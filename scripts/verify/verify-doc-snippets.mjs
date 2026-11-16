import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The docs are part of the published contract. A snippet that imports a helper the build no
// longer exports, or names a label id the catalog dropped, should fail the pack check instead of
// the reader.

export const DOC_FILES = ['README.md', 'llms.txt', 'docs/th-quickstart.md', 'docs/api.md'];

const TS_FENCE = /^\s*```(?:ts|typescript)\s*$/i;
const CLOSE_FENCE = /^\s*```\s*$/;

/** TypeScript fenced blocks, each with the 1-based line of its first content line. */
export function typescriptBlocks(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let start = null;
    for (let index = 0; index < lines.length; index++) {
        if (start === null) {
            if (TS_FENCE.test(lines[index])) start = index;
            continue;
        }
        if (CLOSE_FENCE.test(lines[index])) {
            blocks.push({ line: start + 2, text: lines.slice(start + 1, index).join('\n') });
            start = null;
        }
    }
    return blocks;
}

function importStatement(lines, start) {
    let text = '';
    for (let index = start; index < lines.length; index++) {
        text += (index === start ? '' : '\n') + lines[index];
        const trimmed = text.trim();
        if (/^import\s+['"][^'"]+['"]\s*;?$/.test(trimmed)) return { text: trimmed, end: index };
        if (/from\s+['"][^'"]+['"]\s*;?$/.test(trimmed)) return { text: trimmed, end: index };
    }
    return { text: text.trim(), end: start };
}

function parseClause(clause) {
    let rest = clause.trim();
    let typeOnly = false;
    if (/^type\s+/.test(rest)) {
        typeOnly = true;
        rest = rest.replace(/^type\s+/, '');
    }

    const names = [];
    const braces = /\{([\s\S]*)\}/.exec(rest);
    if (braces) {
        for (const entry of braces[1].split(',')) {
            const name = entry
                .trim()
                .replace(/^type\s+/, '')
                .split(/\s+as\s+/)[0]
                .trim();
            if (name) names.push(name);
        }
    }

    const namespace = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(rest);
    const defaultName = /^([A-Za-z_$][\w$]*)\s*(?:,|$)/.exec(rest)?.[1] ?? null;
    return { names, defaultName, namespace: namespace?.[1] ?? null, typeOnly };
}

/** Every import statement in a TypeScript fenced block, with its source line. */
export function extractDocImports(markdown) {
    const imports = [];
    for (const block of typescriptBlocks(markdown)) {
        const lines = block.text.split('\n');
        for (let index = 0; index < lines.length; index++) {
            if (!/^\s*import\b/.test(lines[index])) continue;
            const { text, end } = importStatement(lines, index);
            const statement = text.replace(/;$/, '');
            const named = /^import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/.exec(statement);
            if (named) {
                imports.push({
                    line: block.line + index,
                    specifier: named[2],
                    ...parseClause(named[1]),
                });
            } else {
                const sideEffect = /^import\s+['"]([^'"]+)['"]/.exec(statement);
                if (sideEffect) {
                    imports.push({
                        line: block.line + index,
                        specifier: sideEffect[1],
                        names: [],
                        defaultName: null,
                        namespace: null,
                        typeOnly: false,
                    });
                }
            }
            index = end;
        }
    }
    return imports;
}

/** The imported names that the module does not export. */
export function missingBindings(available, imported) {
    const have = available instanceof Set ? available : new Set(available);
    return [...new Set(imported)].filter((name) => !have.has(name));
}

/** Every `labels.<kind>.<id>` access and every `label('<kind>'` first argument, with its line. */
export function labelReferences(markdown) {
    const references = [];
    const lines = markdown.split('\n');
    for (let index = 0; index < lines.length; index++) {
        for (const match of lines[index].matchAll(
            /\blabels\.([A-Za-z][\w-]*)\.([A-Za-z0-9][\w-]*)/g,
        )) {
            references.push({ line: index + 1, kind: match[1], id: match[2] });
        }
        for (const match of lines[index].matchAll(/\blabel\(\s*'([^']*)'/g)) {
            references.push({ line: index + 1, kind: match[1], id: null });
        }
    }
    return references;
}

/** The references that the built labels object does not satisfy. */
export function missingLabelReferences(references, labels) {
    return references.filter(({ kind, id }) => {
        const table = labels[kind];
        if (table === undefined) return true;
        return id !== null && !(id in table);
    });
}

function subpathOf(specifier) {
    if (specifier === 'ua-inspect') return '.';
    if (specifier.startsWith('ua-inspect/')) return `.${specifier.slice('ua-inspect'.length)}`;
    return null;
}

function exportTargets(entry) {
    if (typeof entry === 'string') return { runtime: entry, types: null };
    const branch = entry?.import ?? entry;
    return { runtime: branch?.default ?? null, types: branch?.types ?? null };
}

function typeExports(source) {
    const names = new Set();
    for (const match of source.matchAll(
        /export\s+(?:declare\s+)?(?:type|interface|class|function|const|let|var|enum)\s+([A-Za-z_$][\w$]*)/g,
    )) {
        names.add(match[1]);
    }
    for (const match of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
        for (const entry of match[1].split(',')) {
            const name = entry
                .trim()
                .replace(/^type\s+/, '')
                .split(/\s+as\s+/)[0]
                .trim();
            if (name) names.add(name);
        }
    }
    return names;
}

async function moduleNames(root, packageJson, specifier) {
    const entry = packageJson.exports?.[subpathOf(specifier)];
    const targets = exportTargets(entry);
    const module = await import(pathToFileURL(path.join(root, targets.runtime)).href);
    const runtime = new Set(Object.keys(module));
    const all = new Set(runtime);
    if (targets.types) {
        for (const name of typeExports(await readFile(path.join(root, targets.types), 'utf8'))) {
            all.add(name);
        }
    }
    return { runtime, all, labels: module.labels };
}

/** Fails when a documented import, root export, or label reference is missing from the build. */
export async function verifyDocSnippets(root) {
    const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    const exportsMap = packageJson.exports ?? {};
    const failures = [];
    let importsChecked = 0;
    let labelsChecked = 0;

    for (const file of DOC_FILES) {
        const markdown = await readFile(path.join(root, file), 'utf8');
        const imports = extractDocImports(markdown);
        importsChecked += imports.length;
        for (const found of imports) {
            const subpath = subpathOf(found.specifier);
            if (subpath === null) continue;
            if (!(subpath in exportsMap)) {
                failures.push(
                    `${file}:${found.line}: ${found.specifier} is not in the package.json export map.`,
                );
                continue;
            }
            if (found.names.length === 0) continue;
            const available = await moduleNames(root, packageJson, found.specifier);
            for (const name of missingBindings(available.all, found.names)) {
                failures.push(
                    `${file}:${found.line}: ${found.specifier} has no export named ${name}.`,
                );
            }
        }

        const references = labelReferences(markdown);
        labelsChecked += references.length;
        const labelsModule = await moduleNames(root, packageJson, 'ua-inspect/labels');
        for (const reference of missingLabelReferences(references, labelsModule.labels)) {
            const named =
                reference.id === null
                    ? `label kind '${reference.kind}'`
                    : `labels.${reference.kind}.${reference.id}`;
            failures.push(`${file}:${reference.line}: ${named} is not in the built labels object.`);
        }
    }

    const llms = await readFile(path.join(root, 'llms.txt'), 'utf8');
    const rootModule = await moduleNames(root, packageJson, 'ua-inspect');
    for (const name of rootModule.runtime) {
        if (!new RegExp(`\\b${name}\\b`).test(llms)) {
            failures.push(`llms.txt:1: root export ${name} is not mentioned.`);
        }
    }

    if (failures.length > 0) {
        throw new Error(`Documentation snippets do not match the build:\n${failures.join('\n')}`);
    }
    return { files: DOC_FILES.length, imports: importsChecked, labels: labelsChecked };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const counts = await verifyDocSnippets(root);
    console.log(
        `Documentation snippets verified: ${counts.files} files, ${counts.imports} imports, ${counts.labels} label references.`,
    );
}
