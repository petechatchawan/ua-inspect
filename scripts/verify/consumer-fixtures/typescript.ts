import {
    atLeast,
    describe,
    is,
    isBot,
    isIPadOS,
    isInApp,
    isWebView,
    label,
    labels,
    parse,
    type BrowserId,
    type Query,
    type UAInfo,
    type Version,
} from 'ua-inspect';
import { detect, type DetectOptions } from 'ua-inspect/browser';
import { parseRequest, type HeaderRecord } from 'ua-inspect/server';

const result: UAInfo = parse('Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36');
if (is(result, { browser: 'chrome' })) {
    const exact: 'chrome' = result.browser.name;
    void exact;
}
const query: Query = { browser: ['chrome', 'edge'], os: 'android' };
const id: BrowserId = 'samsung-internet';
const browserLabel: string = label('browser', id);
const rawLabel: string = labels.browser[id];
const version: Version | null = result.browser.version;
const minor: number | null | undefined = version?.minor;
const modern: boolean = atLeast(version, '130');
const ipadOS: boolean = isIPadOS(result);
const inApp: boolean = isInApp(result);
const webView: boolean = isWebView(result);
const summary: string = describe(result);
// @ts-expect-error a misspelled browser id does not compile
is(result, { browser: 'chrom' });
const headers: HeaderRecord = { 'user-agent': result.ua };
const requestResult: UAInfo = parseRequest(headers);
const options: DetectOptions = { highEntropy: true };
const detector: typeof detect = detect;
void [
    isBot,
    query,
    browserLabel,
    rawLabel,
    minor,
    modern,
    ipadOS,
    inApp,
    webView,
    summary,
    requestResult,
    options,
    detector,
];
