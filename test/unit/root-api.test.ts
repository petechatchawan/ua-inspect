import { readFileSync } from 'node:fs';
import * as check from '../../src/check';
import * as root from '../../src/index';
import { describe as describeInfo, labels } from '../../src/labels';

// @ts-expect-error ids are types, not value objects
const removedIdObject = root.BrowserId;
// @ts-expect-error parseVersion is not part of the public API
const removedParseVersion = root.parseVersion;

const CHROME_DESKTOP =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

describe('ua-inspect package root', () => {
    it('keeps the root parser-first and exports the query helpers', () => {
        const result = root.parse(CHROME_DESKTOP);
        expect(result.browser.name).toBe('chrome');
        expect(result.os.name).toBe('windows');
        expect(result.device.type).toBe('desktop');
        expect(Object.keys(root).sort()).toEqual(
            [
                'atLeast',
                'describe',
                'is',
                'isBot',
                'isDesktop',
                'isIPad',
                'isIPadOS',
                'isInApp',
                'isMobile',
                'isTablet',
                'isWebView',
                'labels',
                'parse',
            ].sort(),
        );
        expect(root.atLeast).toBe(check.atLeast);
        expect(root.describe).toBe(describeInfo);
        expect(root.isIPadOS).toBe(check.isIPadOS);
        expect(root.isInApp).toBe(check.isInApp);
        expect(root.isWebView).toBe(check.isWebView);
        expect(root.is).toBe(check.is);
        expect(root.isBot).toBe(check.isBot);
        expect(root.labels).toBe(labels);
    });

    it('exports the query and device predicates from check', () => {
        expect(Object.keys(check).sort()).toEqual([
            'atLeast',
            'is',
            'isBot',
            'isDesktop',
            'isIPad',
            'isIPadOS',
            'isInApp',
            'isMobile',
            'isTablet',
            'isWebView',
        ]);
    });

    it('exports check, server, browser and labels as dedicated package subpaths', () => {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
            exports: Record<string, unknown>;
        };
        for (const name of ['check', 'server', 'browser', 'labels']) {
            expect(packageJson.exports[`./${name}`]).toEqual({
                import: {
                    types: `./dist/esm/${name}.d.ts`,
                    default: `./dist/esm/${name}.js`,
                },
                require: {
                    types: `./dist/cjs/${name}.d.ts`,
                    default: `./dist/cjs/${name}.js`,
                },
                default: `./dist/esm/${name}.js`,
            });
        }
    });
});

void removedIdObject;
void removedParseVersion;
