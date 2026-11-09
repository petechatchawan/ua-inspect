import './verify-package-identity.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyReadmeCatalog } from './catalog-coverage.mjs';
import { verifyBudgets } from './verify-budgets.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-inspect-pack-'));

try {
    if (packageJson.name !== 'ua-inspect')
        throw new Error(`Expected package name ua-inspect, received ${packageJson.name}`);
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
        throw new Error(`Expected a valid semantic version, received ${packageJson.version}`);
    }
    const subpaths = Object.keys(packageJson.exports ?? {}).filter(
        (subpath) => subpath !== './package.json',
    );
    if (!subpaths.includes('.')) throw new Error('The export map is missing the package root.');
    for (const subpath of subpaths) {
        const entry = packageJson.exports[subpath];
        for (const condition of ['import', 'require']) {
            const branch = entry?.[condition];
            if (branch === null || typeof branch !== 'object') {
                throw new Error(`Export ${subpath} is missing the ${condition} condition.`);
            }
            for (const targetName of ['types', 'default']) {
                const target = branch[targetName];
                if (!target) {
                    throw new Error(
                        `Export ${subpath} ${condition} is missing the ${targetName} target.`,
                    );
                }
                if (!existsSync(path.join(root, target))) {
                    throw new Error(
                        `Export ${subpath} ${condition} target ${target} does not exist. Run npm run build first.`,
                    );
                }
            }
        }
        if (typeof entry.default !== 'string' || !existsSync(path.join(root, entry.default))) {
            throw new Error(`Export ${subpath} has no existing default target.`);
        }
    }

    // The packed tarball is only as good as the tree it was built from, so compare the documentation
    // with this build before packing it.
    const advertisedIds = await verifyReadmeCatalog(root);

    const output = execFileSync(
        npmCommand,
        ['pack', '--ignore-scripts', '--json', '--pack-destination', workspace],
        { cwd: root, encoding: 'utf8' },
    );
    const [report] = JSON.parse(output);
    if (report.name !== packageJson.name || report.version !== packageJson.version) {
        throw new Error(`Unexpected packed identity: ${report.name}@${report.version}`);
    }

    const packedPaths = report.files.map((file) => file.path);
    for (const required of ['README.md', 'LICENSE', 'llms.txt']) {
        if (!packedPaths.includes(required))
            throw new Error(`Package is missing required documentation: ${required}`);
    }

    const forbiddenFiles = packedPaths.filter(
        (filePath) =>
            filePath.startsWith('apps/playground/') ||
            filePath.includes('__tests__') ||
            /(?:^|\/).*\.(?:spec|test)\.(?:js|cjs|mjs|ts)$/.test(filePath) ||
            /dist\/(?:esm|cjs)\/v2\//.test(filePath) ||
            /dist\/(?:esm|cjs)\/mappings\//.test(filePath),
    );
    if (forbiddenFiles.length > 0) {
        throw new Error(
            `Package contains forbidden implementation/test files: ${forbiddenFiles.join(', ')}`,
        );
    }
    await verifyBudgets(root, report);
    const tarballPath = path.join(workspace, report.filename);
    execFileSync(
        nodeCommand,
        [path.join(root, 'scripts', 'verify', 'verify-consumers.mjs'), tarballPath],
        {
            cwd: root,
            stdio: 'inherit',
        },
    );
    console.log(
        `Package contents verified: ${report.files.length} files, ${report.unpackedSize} unpacked bytes, ${report.name}@${report.version}.`,
    );
    console.log(`README ids verified against the build: ${advertisedIds}.`);
} finally {
    await rm(workspace, { recursive: true, force: true });
}
