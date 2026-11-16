import {
    extractDocImports,
    labelReferences,
    missingBindings,
} from '../../scripts/verify/verify-doc-snippets.mjs';

describe('documentation snippets', () => {
    it('reads single-line imports from TypeScript blocks with their line', () => {
        const markdown = [
            '# Example',
            '',
            '```ts',
            "import { parse } from 'ua-inspect';",
            "import { is } from 'ua-inspect/check';",
            '```',
            '',
            '```js',
            "const { labels } = require('ua-inspect');",
            '```',
        ].join('\n');

        expect(extractDocImports(markdown)).toEqual([
            {
                line: 4,
                specifier: 'ua-inspect',
                names: ['parse'],
                defaultName: null,
                namespace: null,
                typeOnly: false,
            },
            {
                line: 5,
                specifier: 'ua-inspect/check',
                names: ['is'],
                defaultName: null,
                namespace: null,
                typeOnly: false,
            },
        ]);
    });

    it('reads multi-line braces, type imports, default imports, and aliases', () => {
        const markdown = [
            '```ts',
            'import {',
            '    atLeast,',
            '    is,',
            "} from 'ua-inspect';",
            "import type { UAInfo } from 'ua-inspect';",
            "import { type NextRequest, NextResponse as Response } from 'next/server';",
            "import liff from '@line/liff';",
            '```',
        ].join('\n');

        expect(extractDocImports(markdown)).toEqual([
            {
                line: 2,
                specifier: 'ua-inspect',
                names: ['atLeast', 'is'],
                defaultName: null,
                namespace: null,
                typeOnly: false,
            },
            {
                line: 6,
                specifier: 'ua-inspect',
                names: ['UAInfo'],
                defaultName: null,
                namespace: null,
                typeOnly: true,
            },
            {
                line: 7,
                specifier: 'next/server',
                names: ['NextRequest', 'NextResponse'],
                defaultName: null,
                namespace: null,
                typeOnly: false,
            },
            {
                line: 8,
                specifier: '@line/liff',
                names: [],
                defaultName: 'liff',
                namespace: null,
                typeOnly: false,
            },
        ]);
    });

    it('reports only the names the module does not export', () => {
        expect(missingBindings(['parse', 'labels'], ['parse', 'labels', 'ghost'])).toEqual([
            'ghost',
        ]);
        expect(missingBindings(new Set(['parse']), ['parse'])).toEqual([]);
    });

    it('reads label accesses and label kinds with their line', () => {
        const markdown = [
            'labels.browser.chrome;',
            "label('os', null, 'n/a');",
            'labels.browser[info.browser.name];',
        ].join('\n');

        expect(labelReferences(markdown)).toEqual([
            { line: 1, kind: 'browser', id: 'chrome' },
            { line: 2, kind: 'os', id: null },
        ]);
    });
});
