/**
 * Compile-checked query recipes. `npm run typecheck` compiles this file.
 */
import {
    atLeast,
    describe,
    is,
    isBot,
    isIPad,
    isIPadOS,
    isInApp,
    isWebView,
    label,
    labels,
    type UAInfo,
} from '../../src/index';

declare const info: UAInfo;

export const recipes = {
    phone: is(info, { device: 'mobile' }),
    handheld: is(info, { device: ['mobile', 'tablet'] }),
    chromium: is(info, { family: 'chromium' }),
    webview: is(info, { mode: 'webview' }),
    line: is(info, { app: 'line' }),
    liff: is(info, { context: 'liff' }),
    bot: isBot(info),
    ipad: isIPad(info),
    ipadOS: isIPadOS(info),
    modernChrome: is(info, { browser: 'chrome' }) && atLeast(info.browser.version, '130'),
    browserLabel: label('browser', info.browser.name),
    vendorLabel: labels.vendor.samsung,
    summary: describe(info),
    inApp: isInApp(info),
    webView: isWebView(info),
};
