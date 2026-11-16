import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

const restrictedSyntax = [
    {
        selector: 'Literal[regex]',
        message:
            'Use a catalog signal. Regular expressions are banned here so matching stays linear.',
    },
    {
        selector: "NewExpression[callee.name='RegExp']",
        message:
            'Use a catalog signal. Regular expressions are banned here so matching stays linear.',
    },
    {
        selector: 'CallExpression[callee.property.name=/^(match|matchAll|search)$/]',
        message:
            'Use a catalog signal. Regular expressions are banned here so matching stays linear.',
    },
];

export default [
    {
        ignores: [
            '.git/**',
            'coverage/**',
            'dist/**',
            'node_modules/**',
            'apps/**',
            // The consumer fixtures compile against the packed package name, so they are not part
            // of a local tsconfig. `verify-consumers.mjs` compiles them from the tarball instead.
            'scripts/verify/consumer-fixtures/**',
        ],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
                project: ['./tsconfig.test.json'],
                tsconfigRootDir: import.meta.dirname,
            },
            globals: { ...globals.node },
        },
        plugins: { '@typescript-eslint': tsPlugin },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            'no-magic-numbers': 'off',
        },
    },
    {
        files: ['src/**/*.ts', 'test/**/*.ts', 'docs/examples/**/*.ts'],
        rules: {
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/only-throw-error': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
        },
    },
    {
        files: ['test/**/*.ts'],
        languageOptions: { globals: { ...globals.node, ...globals.vitest } },
    },
    {
        files: ['scripts/**/*.mjs'],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        files: ['**/*.cjs'],
        languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
        rules: { '@typescript-eslint/no-require-imports': 'off' },
    },
    {
        files: ['src/**/*.ts'],
        rules: { 'no-restricted-syntax': ['error', ...restrictedSyntax] },
    },
];
