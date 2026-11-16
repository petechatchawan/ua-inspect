import { labels, type ClientHintHeaders, type UAInfo } from '../services/ua-detection-service';
import type { PlaygroundMode } from './playground-state';

export const NOT_DETECTED = 'Not detected';

function humanize(value: string | null | undefined): string {
    if (!value) return NOT_DETECTED;
    const special: Readonly<Record<string, string>> = {
        webview: 'WebView',
        // `pwa` is a context type here. `labels.context.pwa` names the context id instead.
        pwa: 'PWA',
        'in-app-browser': 'In-App Browser',
        'mini-app': 'Mini App',
        'ai-crawler': 'AI Crawler',
        'ai-assistant': 'AI Assistant',
        'http-client': 'HTTP Client',
        'email-client': 'Email Client',
        'media-player': 'Media Player',
    };
    return (
        special[value] ??
        value
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
    );
}

function formatProduct(name: string | null, version: { readonly full: string } | null): string {
    if (!name) return NOT_DETECTED;
    return version?.full ? `${name} ${version.full}` : name;
}

export interface DetectionSummaryViewModel {
    readonly browser: string;
    readonly mode: string;
    readonly contextHost: string;
    readonly contextSurface: string;
    readonly os: string;
    readonly device: string;
}

export interface ResultRowViewModel {
    readonly label: string;
    readonly value: string;
    readonly detected: boolean;
}

export interface ResultCardViewModel {
    readonly id: string;
    readonly title: string;
    readonly rows: readonly ResultRowViewModel[];
}

function row(label: string, value: string | null | undefined): ResultRowViewModel {
    const normalized = value && value.trim() ? value : NOT_DETECTED;
    return { label, value: normalized, detected: normalized !== NOT_DETECTED };
}

export function createDetectionSummary(result: UAInfo): DetectionSummaryViewModel {
    return {
        browser: formatProduct(
            result.browser.name ? labels.browser[result.browser.name] : null,
            result.browser.version,
        ),
        mode: humanize(result.browser.mode),
        contextHost: formatProduct(
            result.context.app ? labels.context[result.context.app] : null,
            result.context.version,
        ),
        contextSurface: result.context.name ? labels.context[result.context.name] : NOT_DETECTED,
        os: formatProduct(result.os.name ? labels.os[result.os.name] : null, result.os.version),
        device: result.device.type ? labels.device[result.device.type] : NOT_DETECTED,
    };
}

export function createResultCards(result: UAInfo): readonly ResultCardViewModel[] {
    return [
        {
            id: 'browser',
            title: 'Browser',
            rows: [
                row('Name', result.browser.name ? labels.browser[result.browser.name] : null),
                row('Version', result.browser.version?.full),
                row('Family', humanize(result.browser.family)),
                row('Mode', humanize(result.browser.mode)),
            ],
        },
        {
            id: 'context',
            title: 'Context',
            rows: [
                row('Type', humanize(result.context.type)),
                row('Surface', result.context.name ? labels.context[result.context.name] : null),
                row('Host app', result.context.app ? labels.context[result.context.app] : null),
                row('Host version', result.context.version?.full),
            ],
        },
        {
            id: 'client',
            title: 'Client',
            rows: [
                row('Type', humanize(result.client.type)),
                row(
                    'Name',
                    result.client.name ? labels.client[result.client.name] : result.client.token,
                ),
                row('Version', result.client.version?.full),
            ],
        },
        {
            id: 'engine',
            title: 'Engine',
            rows: [
                row('Name', result.engine.name ? labels.engine[result.engine.name] : null),
                row('Version', result.engine.version?.full),
            ],
        },
        {
            id: 'os',
            title: 'Operating System',
            rows: [
                row('Name', result.os.name ? labels.os[result.os.name] : null),
                row('Version', result.os.version?.full),
            ],
        },
        {
            id: 'device',
            title: 'Device',
            rows: [
                row('Type', result.device.type ? labels.device[result.device.type] : null),
                row('Vendor', result.device.vendor ? labels.vendor[result.device.vendor] : null),
                row('Model', result.device.model),
            ],
        },
        {
            id: 'cpu',
            title: 'CPU',
            rows: [
                row(
                    'Architecture',
                    result.cpu.architecture ? labels.cpu[result.cpu.architecture] : null,
                ),
                row('Bitness', result.cpu.bitness ? `${result.cpu.bitness}-bit` : null),
            ],
        },
    ];
}

export function createCodeExample(input: {
    readonly mode: PlaygroundMode;
    readonly userAgent: string;
    readonly headers: ClientHintHeaders | null;
}): string {
    if (input.mode === 'current') {
        return `import { detect } from 'ua-inspect/browser';\n\nconst result = await detect();`;
    }
    if (input.headers !== null) {
        return (
            `import { parseRequest } from 'ua-inspect/server';\n\n` +
            `const result = parseRequest({\n` +
            `  userAgent: ${JSON.stringify(input.userAgent)},\n` +
            `  headers: ${JSON.stringify(input.headers)},\n` +
            `});`
        );
    }
    return (
        `import { parse } from 'ua-inspect';\n\n` +
        `const result = parse(${JSON.stringify(input.userAgent)});`
    );
}
