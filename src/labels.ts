import { BROWSERS, type BrowserId } from './catalog/browsers';
import { CLIENTS, type ClientId } from './catalog/clients';
import { CONTEXTS, type AppId } from './catalog/contexts';
import { CPUS, type CPUArchitecture } from './catalog/cpus';
import { DEVICE_TYPES, type DeviceType } from './catalog/devices';
import { OPERATING_SYSTEMS, type OSId } from './catalog/os';
import { VENDORS, type VendorId } from './catalog/vendors';
import type { ContextId, EngineId, UAInfo, Version } from './types';

function labelsOf<K extends string>(
    rows: Readonly<Record<K, { readonly label: string }>>,
): Readonly<Record<K, string>> {
    const result = {} as Record<K, string>;
    for (const id of Object.keys(rows) as K[]) result[id] = rows[id].label;
    return result;
}

const ENGINE_LABELS: Readonly<Record<EngineId, string>> = {
    blink: 'Blink',
    edgehtml: 'EdgeHTML',
    gecko: 'Gecko',
    presto: 'Presto',
    webkit: 'WebKit',
};

const CONTEXT_LABELS: Readonly<Record<ContextId, string>> = {
    ...labelsOf<AppId>(CONTEXTS),
    liff: 'LINE LIFF',
    pwa: 'Installed web app',
};

/**
 * Display names for the stable IDs in a result. Results carry IDs, so a program branches on a
 * lowercase ID and shows `labels.browser[info.browser.name]` to a person.
 *
 * @example
 * const browser = info.browser.name ? labels.browser[info.browser.name] : 'Unknown';
 */
export const labels: {
    readonly browser: Readonly<Record<BrowserId, string>>;
    readonly os: Readonly<Record<OSId, string>>;
    readonly engine: Readonly<Record<EngineId, string>>;
    readonly device: Readonly<Record<DeviceType, string>>;
    readonly cpu: Readonly<Record<CPUArchitecture, string>>;
    readonly vendor: Readonly<Record<VendorId, string>>;
    readonly client: Readonly<Record<ClientId, string>>;
    readonly context: Readonly<Record<ContextId, string>>;
} = {
    browser: labelsOf(BROWSERS),
    os: labelsOf(OPERATING_SYSTEMS),
    engine: ENGINE_LABELS,
    device: labelsOf(DEVICE_TYPES),
    cpu: labelsOf(CPUS),
    vendor: labelsOf(VENDORS),
    client: labelsOf(CLIENTS),
    context: CONTEXT_LABELS,
};

function formatVersion(label: string, version: Version | null): string {
    return version === null ? label : `${label} ${version.full}`;
}

/**
 * A one-line human summary of a result. Useful for logs and UI text.
 *
 * @example
 * describe(parse(userAgent)); // 'Google Chrome 150.0.0.0 on Windows 10 (Desktop)'
 */
export function describe(info: UAInfo): string {
    const parts: string[] = [];
    if (info.client.name !== null) {
        parts.push(formatVersion(labels.client[info.client.name], info.client.version));
    } else if (info.client.token !== null) {
        parts.push(
            info.client.type === null
                ? info.client.token
                : `${info.client.token} (${info.client.type})`,
        );
    } else if (info.browser.name !== null) {
        parts.push(formatVersion(labels.browser[info.browser.name], info.browser.version));
    } else {
        parts.push('Unknown browser');
    }

    if (info.browser.mode === 'webview') parts.push('WebView');
    else if (info.browser.mode === 'headless') parts.push('headless');

    if (info.os.name !== null) {
        parts.push(`on ${formatVersion(labels.os[info.os.name], info.os.version)}`);
    }
    if (info.device.type !== null) parts.push(`(${labels.device[info.device.type]})`);
    if (
        info.context.name !== null &&
        (info.context.type === 'in-app-browser' || info.context.type === 'mini-app')
    ) {
        parts.push(`in ${labels.context[info.context.name]}`);
    } else if (info.context.type === 'pwa') {
        parts.push('as installed web app');
    }
    return parts.join(' ');
}
