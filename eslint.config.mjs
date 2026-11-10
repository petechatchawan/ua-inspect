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
        ignores: ['.git/**', 'coverage/**', 'dist/**', 'node_modules/**', 'apps/**', 'docs/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
            globals: { ...globals.node },
        },
        plugins: { '@typescript-eslint': tsPlugin },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            'no-magic-numbers': 'off',
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
