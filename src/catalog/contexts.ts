import type { RowSpec } from '../core/match';
import type { ContextType } from '../types';

export interface ContextRow extends RowSpec<string> {
    readonly label: string;
    readonly type: ContextType;
    /**
     * Products that belong to the host app's metadata, not to a browser. They are ignored for the
     * unaccounted-product guard, so a known app can still report the WebView it runs on.
     */
    readonly ignores?: readonly string[];
}

/** TikTok and TikTok Lite add these top-level products beside the WebView tokens. */
const TIKTOK_METADATA: readonly string[] = [
    'app_version',
    'appname',
    'appversion',
    'bytedancewebview',
    'bytefulllocale',
    'bytelocale',
    'channel',
    'isdarkmode',
    'jssdk',
    'pia',
    'region',
    'spark',
    'wkwebview',
];

const rows = {
    discord: {
        label: 'Discord',
        type: 'in-app-browser',
        // Discord desktop is an Electron app: the Electron token is the host, not a fork.
        ignores: ['electron'],
        match: ['discord'],
    },
    facebook: {
        label: 'Facebook',
        type: 'in-app-browser',
        // The iOS build always sends `FBAN/FBIOS`, but only some builds send a version (`FBAV`).
        match: [
            { product: 'FBAV', fallback: true },
            { product: 'FBAN', valueIs: ['FBIOS'], versionOptional: true },
        ],
    },
    instagram: { label: 'Instagram', type: 'in-app-browser', match: ['Instagram'] },
    line: { label: 'LINE', type: 'in-app-browser', match: ['Line'] },
    messenger: {
        label: 'Messenger',
        type: 'in-app-browser',
        beats: ['facebook'],
        match: [
            { product: 'FBAN', valueIs: ['MessengerForiOS', 'Orca-Android'], versionFrom: 'FBAV' },
        ],
    },
    tiktok: {
        label: 'TikTok',
        type: 'in-app-browser',
        ignores: TIKTOK_METADATA,
        // `musical_ly_2022803040` is a build code, not a version. The explicit `app_version` token wins
        // when the client sends it; the token suffix stays the fallback for the older `musical_ly_28.3.4`.
        match: [
            { words: 'musical_ly*', versionPrefer: 'app_version' },
            { words: 'tiktok*', versionPrefer: 'app_version' },
            { words: 'trill*', versionPrefer: 'app_version' },
            { product: 'BytedanceWebview', versionOptional: true },
        ],
    },
    // The Lite build names itself through `AppName/ultralite` and reports the release in `app_version`.
    'tiktok-lite': {
        label: 'TikTok Lite',
        type: 'in-app-browser',
        beats: ['tiktok'],
        ignores: TIKTOK_METADATA,
        match: [{ product: 'AppName', valueIs: ['ultralite'], versionFrom: 'app_version' }],
    },
    twitter: {
        label: 'Twitter',
        type: 'in-app-browser',
        // Android sends a bare `TwitterAndroid`. iOS sends `Twitter for iPhone/10.34`, where the version
        // sits two words after the brand.
        match: [
            { words: 'twitterandroid', versionOptional: true },
            { words: 'twitter', skip: 2, versionOptional: true },
        ],
    },
    wechat: { label: 'WeChat', type: 'in-app-browser', match: ['MicroMessenger'] },
} as const satisfies Readonly<Record<string, ContextRow>>;

/** The native app that hosts a page. The User-Agent names these. */
export type AppId = keyof typeof rows;
/** What the page runs as. `liff` and `pwa` come from runtime evidence, not from a User-Agent. */
export type ContextId = AppId | 'liff' | 'pwa';

export const CONTEXTS: Readonly<Record<AppId, ContextRow>> = rows;
