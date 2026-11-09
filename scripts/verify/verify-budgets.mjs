import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import path from 'node:path';

const BUDGETS = {
    tarball: 60_000,
    root: 11_000,
    check: 2_000,
};

async function measure(root, entry) {
    const result = await build({
        entryPoints: [path.join(root, 'dist', 'esm', entry)],
        bundle: true,
        minify: true,
        format: 'esm',
        platform: 'neutral',
        target: 'es2020',
        write: false,
        logLevel: 'silent',
    });
    return gzipSync(result.outputFiles[0].contents).length;
}

export async function verifyBudgets(root, report) {
    const sizes = {
        tarball: report.size,
        root: await measure(root, 'index.js'),
        check: await measure(root, 'check.js'),
    };
    const failures = [];
    for (const [name, budget] of Object.entries(BUDGETS)) {
        if (sizes[name] > budget) {
            failures.push(`${name}: ${sizes[name]} bytes exceeds the ${budget} byte budget.`);
        }
    }
    if (failures.length > 0) {
        throw new Error(`Bundle or package budget exceeded: ${failures.join(' ')}`);
    }
    console.log(
        `Budgets verified: tarball ${sizes.tarball} B, root ${sizes.root} B gzip, check ${sizes.check} B gzip.`,
    );
}
