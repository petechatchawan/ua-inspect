import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['test/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts'],
            reporter: ['text', 'text-summary', 'lcov'],
            reportsDirectory: 'coverage',
            thresholds: {
                statements: 97,
                lines: 98,
                functions: 98,
                branches: 92,
            },
        },
    },
});
