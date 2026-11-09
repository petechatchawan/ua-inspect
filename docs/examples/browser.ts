/**
 * Compile-checked browser recipes. `npm run typecheck` compiles this file.
 */
import { is } from '../../src/index';
import { detect, type LiffAdapter } from '../../src/browser';

declare const liff: LiffAdapter;

export async function currentBrowser() {
    const info = await detect();
    return { chromium: is(info, { family: 'chromium' }), info };
}

export async function detailedBrowser() {
    return detect({ highEntropy: true });
}

export async function liffBrowser() {
    return detect({ liff });
}

export async function safeDetect() {
    try {
        return await detect();
    } catch {
        return null;
    }
}
