/**
 * Compile-checked mirror of the README quickstart.
 * `npm run typecheck` compiles this file, so a documented example cannot drift from the API.
 * The README imports the published package; this file imports the source tree.
 */
import { atLeast, is, isBot, labels, parse, type UAInfo } from '../../src/index';
import { parseRequest } from '../../src/server';
import { detect } from '../../src/browser';

declare const userAgent: string;
declare const request: Request;

const info: UAInfo = parse(userAgent);

if (is(info, { browser: 'chrome-mobile', os: 'android', device: 'mobile' })) {
    const name: 'chrome-mobile' = info.browser.name;
    void name;
}

const blocked: boolean = isBot(info);
const modernChrome: boolean =
    info.browser.name === 'chrome' && atLeast(info.browser.version, '130');
const browserLabel: string = info.browser.name ? labels.browser[info.browser.name] : 'Unknown';
const vendorLabel: string = labels.vendor.samsung;
const fromRequest: UAInfo = parseRequest(request);
const detected: Promise<UAInfo> = detect();

void [blocked, modernChrome, browserLabel, vendorLabel, fromRequest, detected];
