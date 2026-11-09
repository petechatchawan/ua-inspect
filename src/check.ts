import type {
    AppId,
    BrowserFamily,
    BrowserId,
    BrowserMode,
    ClientId,
    ClientInfo,
    ClientType,
    ContextId,
    ContextType,
    DeviceType,
    EngineId,
    OSId,
    UAInfo,
    VendorId,
    Version,
} from './types';
import { readVersion } from './core/scan';
import { IS_DEVELOPMENT, warnOnce } from './dev';

type Many<T> = T | readonly T[];

/**
 * What to look for. Keys combine with AND and the values of one key combine with OR, so
 * `{ browser: 'chrome', os: ['android', 'harmonyos'] }` is Chrome on Android or HarmonyOS.
 * Every value is a stable lowercase ID, and a misspelled one fails to compile.
 */
export interface Query {
    readonly browser?: Many<BrowserId>;
    readonly family?: Many<BrowserFamily>;
    readonly mode?: Many<BrowserMode>;
    readonly engine?: Many<EngineId>;
    readonly os?: Many<OSId>;
    readonly device?: Many<DeviceType>;
    readonly vendor?: Many<VendorId>;
    readonly client?: Many<ClientId>;
    readonly clientType?: Many<ClientType>;
    readonly context?: Many<ContextId>;
    readonly contextType?: Many<ContextType>;
    readonly app?: Many<AppId>;
}

type Element<T> = T extends readonly (infer U)[] ? U : T;
// A key only counts when the query type guarantees a value for it. An optional key, or a query
// widened to `Query`, would otherwise narrow a field that the runtime query may not name.
type Has<Q extends Query, K extends keyof Query> = K extends keyof Q
    ? undefined extends Q[K]
        ? false
        : true
    : false;

type Narrowed<Q extends Query> = (Has<Q, 'browser'> extends true
    ? { readonly browser: { readonly name: Element<Q['browser']> } }
    : unknown) &
    (Has<Q, 'family'> extends true
        ? { readonly browser: { readonly family: Element<Q['family']> } }
        : unknown) &
    (Has<Q, 'mode'> extends true
        ? { readonly browser: { readonly mode: Element<Q['mode']> } }
        : unknown) &
    (Has<Q, 'engine'> extends true
        ? { readonly engine: { readonly name: Element<Q['engine']> } }
        : unknown) &
    (Has<Q, 'os'> extends true ? { readonly os: { readonly name: Element<Q['os']> } } : unknown) &
    (Has<Q, 'device'> extends true
        ? { readonly device: { readonly type: Element<Q['device']> } }
        : unknown) &
    (Has<Q, 'vendor'> extends true
        ? { readonly device: { readonly vendor: Element<Q['vendor']> } }
        : unknown) &
    (Has<Q, 'client'> extends true
        ? { readonly client: { readonly name: Element<Q['client']> } }
        : unknown) &
    (Has<Q, 'clientType'> extends true
        ? { readonly client: { readonly type: Element<Q['clientType']> } }
        : unknown) &
    (Has<Q, 'context'> extends true
        ? { readonly context: { readonly name: Element<Q['context']> } }
        : unknown) &
    (Has<Q, 'contextType'> extends true
        ? { readonly context: { readonly type: Element<Q['contextType']> } }
        : unknown) &
    (Has<Q, 'app'> extends true
        ? { readonly context: { readonly app: Element<Q['app']> } }
        : unknown);

function matches<T>(actual: T | null, wanted: Many<T> | undefined): boolean {
    if (wanted === undefined) return true;
    if (actual === null) return false;
    return Array.isArray(wanted) ? (wanted as readonly T[]).includes(actual) : actual === wanted;
}

const QUERY_KEYS: ReadonlySet<string> = new Set([
    'browser',
    'family',
    'mode',
    'engine',
    'os',
    'device',
    'vendor',
    'client',
    'clientType',
    'context',
    'contextType',
    'app',
]);

function warnAboutQuery(query: Query): void {
    const keys = Object.keys(query);
    if (keys.length === 0) {
        warnOnce('empty-query', 'is(): an empty query always returns true.');
        return;
    }
    for (const key of keys) {
        if (!QUERY_KEYS.has(key))
            warnOnce(`unknown-key:${key}`, `is(): unknown query key "${key}".`);
    }
}

/**
 * True when `info` satisfies every key of the query. Keys combine with AND, and the values of one
 * key combine with OR. The predicate narrows only the fields the query type guarantees.
 *
 * @example
 * if (is(info, { browser: ['chrome', 'edge'], os: 'windows' })) {
 *     info.browser.name; // 'chrome' | 'edge'
 * }
 */
export function is<Q extends Query>(info: UAInfo, query: Q): info is UAInfo & Narrowed<Q> {
    if (IS_DEVELOPMENT) warnAboutQuery(query);
    return (
        matches(info.browser.name, query.browser) &&
        matches(info.browser.family, query.family) &&
        matches(info.browser.mode, query.mode) &&
        matches(info.engine.name, query.engine) &&
        matches(info.os.name, query.os) &&
        matches(info.device.type, query.device) &&
        matches(info.device.vendor, query.vendor) &&
        matches(info.client.name, query.client) &&
        matches(info.client.type, query.clientType) &&
        matches(info.context.name, query.context) &&
        matches(info.context.type, query.contextType) &&
        matches(info.context.app, query.app)
    );
}

function versionSegments(version: Version): readonly number[] {
    return version.full.split('.').map((segment) => Number(segment));
}

/**
 * True when `version` is at least `minimum`, compared segment by segment. Missing segments count
 * as zero. A null version, or a malformed minimum, never satisfies the minimum.
 *
 * @example
 * if (atLeast(info.browser.version, '130')) {
 *     // Chrome 130 or newer
 * }
 */
export function atLeast(version: Version | null, minimum: string): boolean {
    const target = readVersion(minimum);
    if (version === null || target === null) return false;
    const left = versionSegments(version);
    const right = versionSegments(target);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index++) {
        const current = left[index] ?? 0;
        const wanted = right[index] ?? 0;
        if (current !== wanted) return current > wanted;
    }
    return true;
}

const BOT_TYPES: readonly ClientInfo['type'][] = ['bot', 'crawler', 'ai-crawler'];

/** True for the client types that fetch pages on their own: `bot`, `crawler` and `ai-crawler`. */
export function isBot(info: UAInfo): boolean {
    return BOT_TYPES.includes(info.client.type);
}

type NarrowDevice<T extends DeviceType> = UAInfo & { readonly device: { readonly type: T } };
type NarrowOS<T extends OSId> = UAInfo & { readonly os: { readonly name: T } };
type InAppInfo = UAInfo & {
    readonly context: { readonly type: 'in-app-browser' | 'mini-app' };
};
type WebViewInfo = UAInfo & { readonly browser: { readonly mode: 'webview' } };

/** True when the device is a phone. Narrows `device.type` to `'mobile'`. */
export function isMobile(info: UAInfo): info is NarrowDevice<'mobile'> {
    return info.device.type === 'mobile';
}

/** True when the device is a tablet. Narrows `device.type` to `'tablet'`. */
export function isTablet(info: UAInfo): info is NarrowDevice<'tablet'> {
    return info.device.type === 'tablet';
}

/** True when the device is a desktop. Narrows `device.type` to `'desktop'`. */
export function isDesktop(info: UAInfo): info is NarrowDevice<'desktop'> {
    return info.device.type === 'desktop';
}

/** True when the page runs inside a host app, as an in-app browser or a mini-app. */
export function isInApp(info: UAInfo): info is InAppInfo {
    return info.context.type === 'in-app-browser' || info.context.type === 'mini-app';
}

/** True when the browser reports `mode: 'webview'`. Narrows `browser.mode` to `'webview'`. */
export function isWebView(info: UAInfo): info is WebViewInfo {
    return info.browser.mode === 'webview';
}

/** True when `os` is iPadOS. Narrows `os.name` to `'ipados'`. */
export function isIPadOS(info: UAInfo): info is NarrowOS<'ipados'> {
    return info.os.name === 'ipados';
}

/**
 * True when the result names an iPad: `os` is `ipados`, or the device model is `iPad`.
 * The model check matters because an app string can name `iPad` without the `CPU OS` token,
 * in which case the OS reads as `ios`. An iPad in desktop mode sends a Macintosh User-Agent,
 * so `parse()` cannot see it; only `detect()` recovers it through touch evidence.
 *
 * This is not a type predicate because either field can establish it. Use `isIPadOS` when you
 * need `os.name` narrowed.
 */
export function isIPad(info: UAInfo): boolean {
    return info.os.name === 'ipados' || info.device.model === 'iPad';
}
