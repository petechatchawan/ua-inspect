import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../../src/parse';
import { parseRequest } from '../../src/server';
import type { UAInfo } from '../../src/types';

// Real User-Agent strings only. Nothing composed belongs in these files. Every new vector under
// `test/data` needs a `src`, and the entries that predate that rule are pinned below so the
// unproven set can only shrink.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

interface Vector {
    readonly id: string;
    readonly ua: string;
    readonly headers?: Readonly<Record<string, string>>;
    readonly src?: string;
    readonly note?: string;
    readonly expect: DeepPartial<Omit<UAInfo, 'ua'>>;
}

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

const CAPTURES = path.join(DATA, 'user-agents.json');

const PROVENANCE = /^(?:observed|vendor-doc|corpus):\S.*@\d{4}-\d{2}-\d{2}$/;

const UNPROVEN_IDS = [
    'android-browser-1-5-galaxy-s3',
    'android-browser-4-galaxy-nexus',
    'android-browser-4-htc-flyer',
    'android-browser-4-huawei-h891l',
    'android-browser-4-huawei-u9508',
    'chrome-100-macos',
    'chrome-111-chromeos',
    'chrome-111-linux',
    'chrome-112-windows-10',
    'chrome-20-windows-8',
    'chrome-58-android-7-1-2',
    'chrome-webview-43-android-5-1-1',
    'chromium-16-ubuntu-11-10-i686',
    'cpu-chromeos-x86-64',
    'cpu-linux-i686',
    'cpu-linux-x86-64',
    'cpu-macos-unknown',
    'cpu-windows-x64',
    'crios-19-ios-5-1-1',
    'crmo-16-android-4-0-3',
    'device-galaxy-nexus',
    'device-galaxy-s6',
    'device-htc-flyer-tablet',
    'device-huawei-h891l',
    'device-iphone',
    'device-macos-desktop',
    'device-nexus-5',
    'device-nexus-5x',
    'device-oneplus-12r',
    'device-windows-desktop',
    'discord-ipados-52',
    'discord-linux-0-0-26',
    'edge-android-11-webview',
    'edge-android-8-g8441',
    'edge-chromium-74',
    'edge-ios-11',
    'edge-legacy-12',
    'edge-legacy-17',
    'edge-legacy-18',
    'edge-macos-100',
    'edge-windows-iot-10',
    'engine-android-browser-4-webkit',
    'engine-chrome-112-blink',
    'engine-chrome-20-webkit',
    'engine-chrome-28-blink',
    'engine-chromium-16-webkit',
    'engine-crios-19-webkit',
    'engine-crmo-16-webkit',
    'engine-samsung-internet-3-blink',
    'facebook-android-5-sm-g900p',
    'facebook-ios-10-3-1',
    'facebook-ios-13-3-1-no-version',
    'firefox-linux-80-appname',
    'firefox-macos-100',
    'firefox-mobile-android-5',
    'firefox-mobile-android-7-nexus-5x',
    'firefox-mobile-ios-16',
    'firefox-mobile-ios-9',
    'firefox-mobile-ipados-8',
    'firefox-windows-15-alpha',
    'headless-chrome-60-macos',
    'headless-chrome-no-version-linux',
    'huawei-browser-android-6',
    'huawei-browser-android-6-gms',
    'huawei-browser-android-6-hmscore',
    'huawei-browser-android-6-hmscore-gms',
    'huawei-browser-windows-hbpc',
    'instagram-ios-14',
    'mi-browser-android-4-2',
    'opera-10-10-linux',
    'opera-14-mobile',
    'opera-6-windows-95',
    'opera-8-5-macos',
    'opera-gx-android-10-redmi',
    'opera-gx-windows-60',
    'opera-mini-ios-12',
    'opera-mini-j2me-5',
    'opera-mobi-android-2-3-5',
    'opera-tablet-windows-11-1',
    'os-android-3-2-1',
    'os-android-4-0-3-dashed',
    'os-android-5-1-1',
    'os-chromeos',
    'os-ios-26-frozen',
    'os-ios-5-1-1',
    'os-ipados-26-frozen',
    'os-linux',
    'os-macos-10-15-7',
    'os-windows-10',
    'os-windows-8',
    'safari-macos-15-6-2-comma',
    'safari-macos-419',
    'safari-mobile-ios-15-7-comma',
    'safari-mobile-ios-16-3-no-version',
    'safari-mobile-ios-4-0-5',
    'safari-windows-5-0-1',
    'samsung-internet-1-tizen-sm-z130h',
    'samsung-internet-1-tizen-smart-tv',
    'samsung-internet-23-redmi-8a',
    'samsung-internet-3-galaxy-s6',
    'samsung-internet-4-sm-g925a',
    'samsung-internet-4-vr-sm-g925k',
    'tiktok-android-10-28-3-4',
    'tiktok-android-11-21-9-4',
    'tiktok-ios-14-8-21-1-0',
    'tiktok-ios-18-6-trill-43',
    'tiktok-lite-android-8',
    'twitter-android-13-cph2531',
    'twitter-ipados-15-7',
    'vivo-browser-android-13',
];

// `user-agents.json` holds first-party captures. Each subdirectory holds one dimension.
function loadVectors(): Vector[] {
    const files = [CAPTURES];
    for (const entry of readdirSync(DATA, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        for (const file of readdirSync(path.join(DATA, entry.name))) {
            if (file.endsWith('.json')) files.push(path.join(DATA, entry.name, file));
        }
    }
    return files.flatMap((file) => JSON.parse(readFileSync(file, 'utf8')) as Vector[]);
}

const VECTORS = loadVectors();
const CAPTURED = JSON.parse(readFileSync(CAPTURES, 'utf8')) as Vector[];

describe('stored User-Agent vectors', () => {
    it('has an entry', () => {
        expect(VECTORS.length).toBeGreaterThan(0);
    });

    it('uses unique ids', () => {
        const ids = VECTORS.map((entry) => entry.id);
        expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    });

    it('cites the capture of every first-party string', () => {
        const bad = CAPTURED.filter(
            (entry) => !/^observed:\S.*@\d{4}-\d{2}-\d{2}$/.test(entry.src ?? ''),
        );
        expect(bad.map((entry) => entry.id)).toEqual([]);
    });

    it('accepts the three documented provenance prefixes', () => {
        const bad = VECTORS.filter(
            (entry) => entry.src !== undefined && !PROVENANCE.test(entry.src),
        );
        expect(bad.map((entry) => entry.id)).toEqual([]);
    });

    it('keeps the unproven fixture set to its snapshot', () => {
        const unproven = VECTORS.filter((entry) => entry.src === undefined)
            .map((entry) => entry.id)
            .sort();
        expect(unproven).toEqual(UNPROVEN_IDS);
    });

    it('keeps the documented fixture counts current', () => {
        const coverage = readFileSync(path.join(DATA, '..', '..', 'docs', 'coverage.md'), 'utf8');
        const dimensions = VECTORS.length - CAPTURED.length;

        expect(coverage).toContain(`${CAPTURED.length} entries today`);
        expect(coverage).toContain(`${dimensions} entries today`);
    });

    it.each(VECTORS.map((entry) => [entry.id, entry] as const))(
        '%s parses as expected',
        (_, entry) => {
            const info = entry.headers
                ? parseRequest({ ...entry.headers, 'user-agent': entry.ua })
                : parse(entry.ua);
            expect(info).toMatchObject({ ua: entry.ua, ...entry.expect });
        },
    );
});
