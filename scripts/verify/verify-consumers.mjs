import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tarballArgument = process.argv[2];
if (!tarballArgument) throw new Error('verify-consumers.mjs requires a packed tarball path');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixturesDirectory = path.join(rootDirectory, 'scripts', 'verify', 'consumer-fixtures');
const typescriptCommand = path.join(rootDirectory, 'node_modules', 'typescript', 'bin', 'tsc');
const tarballPath = path.resolve(tarballArgument);
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-inspect-consumer-'));

try {
    await writeFile(
        path.join(workspace, 'package.json'),
        '{\n  "private": true,\n  "type": "module"\n}\n',
    );
    for (const file of ['esm.mjs', 'cjs.cjs', 'typescript.ts', 'tsconfig.json']) {
        await copyFile(path.join(fixturesDirectory, file), path.join(workspace, file));
    }

    // The workspace above is an ES module package. A nested package without "type": "module"
    // makes its TypeScript file a CommonJS consumer, so both declaration paths are compiled.
    const cjsDirectory = path.join(workspace, 'cjs');
    await mkdir(cjsDirectory);
    await writeFile(path.join(cjsDirectory, 'package.json'), '{\n  "private": true\n}\n');
    for (const file of ['typescript-cjs.ts', 'tsconfig.cjs.json']) {
        await copyFile(path.join(fixturesDirectory, file), path.join(cjsDirectory, file));
    }

    execFileSync(
        npmCommand,
        [
            'install',
            '--ignore-scripts',
            '--no-audit',
            '--no-fund',
            '--no-package-lock',
            tarballPath,
        ],
        { cwd: workspace, stdio: 'pipe' },
    );

    execFileSync(nodeCommand, [path.join(workspace, 'esm.mjs')], {
        cwd: workspace,
        stdio: 'inherit',
    });
    execFileSync(nodeCommand, [path.join(workspace, 'cjs.cjs')], {
        cwd: workspace,
        stdio: 'inherit',
    });
    for (const project of ['tsconfig.json', path.join('cjs', 'tsconfig.cjs.json')]) {
        execFileSync(nodeCommand, [typescriptCommand, '--project', path.join(workspace, project)], {
            cwd: workspace,
            stdio: 'inherit',
        });
    }
    console.log(
        'Package consumer verification passed from the supplied tarball for ESM, CommonJS, and TypeScript APIs, including a CommonJS TypeScript consumer.',
    );
} finally {
    await rm(workspace, { recursive: true, force: true });
}
