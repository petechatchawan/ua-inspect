import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const targets = [
    { file: 'parse.d.ts', signature: 'export declare function parse', example: true },
    { file: 'server.d.ts', signature: 'export declare function parseRequest', example: true },
    { file: 'browser.d.ts', signature: 'export declare function detect', example: true },
    { file: 'check.d.ts', signature: 'export declare function is<', example: true },
    { file: 'check.d.ts', signature: 'export declare function atLeast', example: true },
    { file: 'labels.d.ts', signature: 'export declare const labels', example: true },
    { file: 'types.d.ts', signature: 'export interface Version', example: true },
];

function commentBefore(source, signature) {
    const at = source.indexOf(signature);
    if (at < 0) return null;
    const before = source.slice(0, at).trimEnd();
    if (!before.endsWith('*/')) return null;
    const start = before.lastIndexOf('/**');
    return start < 0 ? null : before.slice(start);
}

const failures = [];

for (const target of targets) {
    const source = await readFile(path.join(root, 'dist', 'esm', target.file), 'utf8');
    const comment = commentBefore(source, target.signature);
    if (comment === null) {
        failures.push(`${target.file}: ${target.signature} has no JSDoc block.`);
        continue;
    }
    if (target.example && !comment.includes('@example')) {
        failures.push(`${target.file}: ${target.signature} has no @example.`);
    }
}

const readme = await readFile(path.join(root, 'README.md'), 'utf8');
for (const file of ['llms.txt', 'AGENTS.md']) {
    if (!readme.includes(file)) failures.push(`README.md does not link ${file}.`);
}

const llms = await readFile(path.join(root, 'llms.txt'), 'utf8');
for (const fragment of [
    "from 'ua-inspect'",
    'ua-inspect/server',
    'ua-inspect/browser',
    '## Pitfalls',
]) {
    if (!llms.includes(fragment)) failures.push(`llms.txt is missing ${fragment}.`);
}

if (failures.length > 0) {
    console.error('Public declaration documentation is incomplete:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}

console.log(`Public declarations verified: ${targets.length} symbols carry JSDoc.`);
