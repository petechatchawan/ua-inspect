import { resolve } from './core/resolve';
import { IS_DEVELOPMENT, warnOnce } from './dev';
import type { UAInfo } from './types';

/**
 * Parses a User-Agent string. It is synchronous, deterministic, and never throws.
 * Detection reads at most the first 1,024 characters, while `info.ua` keeps the full input.
 *
 * @example
 * const info = parse(req.headers['user-agent']);
 * info.browser.name; // 'chrome' or null
 */
export function parse(userAgent: string | null | undefined): UAInfo {
    if (
        IS_DEVELOPMENT &&
        userAgent !== null &&
        userAgent !== undefined &&
        typeof userAgent !== 'string'
    ) {
        warnOnce(
            'parse:non-string',
            `parse(): expected a string, null or undefined; received ${typeof userAgent}.`,
        );
    }
    return resolve(typeof userAgent === 'string' ? userAgent : '', null, null);
}
