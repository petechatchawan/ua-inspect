import {
    atLeast,
    describe,
    is,
    isBot,
    isIPadOS,
    isInApp,
    isWebView,
    labels,
    parse,
    type BrowserId,
    type Query,
    type UAInfo,
    type Version,
} from 'ua-inspect';
import { detect, type DetectOptions } from 'ua-inspect/browser';
import { parseRequest, type HeaderRecord } from 'ua-inspect/server';

const info: UAInfo = parse(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.0.0 Safari/537.36',
);
const browserName: BrowserId | null = info.browser.name;
const browserVersion: Version | null = info.browser.version;
const query: Query = { browser: 'chrome' };
const matched: boolean = is(info, { browser: 'chrome' });
const bot: boolean = isBot(info);
const modern: boolean = atLeast(browserVersion, '130');
const ipadOS: boolean = isIPadOS(info);
const inApp: boolean = isInApp(info);
const webView: boolean = isWebView(info);
const summary: string = describe(info);
const headers: HeaderRecord = { 'user-agent': info.ua };
const fromHeaders: UAInfo = parseRequest(headers);
const options: DetectOptions = { highEntropy: false };
const detected: Promise<UAInfo> = detect(options);
const label: string = info.browser.name ? labels.browser[info.browser.name] : 'Unknown';

void [
    browserName,
    query,
    matched,
    bot,
    modern,
    ipadOS,
    inApp,
    webView,
    summary,
    fromHeaders,
    detected,
    label,
];
