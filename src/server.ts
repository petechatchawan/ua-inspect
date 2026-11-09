import { decodeClientHints } from './client-hints';
import { resolve } from './core/resolve';
import type { UAInfo } from './types';

export type HeaderValue = string | readonly string[] | undefined;
export type HeaderRecord = Readonly<Record<string, HeaderValue>>;

export interface HeaderGetter {
    get(name: string): string | null;
}

export type HeaderSource = HeaderRecord | HeaderGetter;

export interface RequestLikeInput {
    readonly headers: HeaderSource;
    readonly userAgent?: string;
}

export type ParseRequestInput = HeaderSource | RequestLikeInput;

function readHeaderValue(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (!Array.isArray(value)) return null;
    const joined = value.filter((item): item is string => typeof item === 'string').join(', ');
    return joined.length > 0 ? joined : null;
}

/** Reads one header from a header record or a `Headers`-like object. A string array joins with `, `. */
export function readHeader(headers: HeaderSource, name: string): string | null {
    if (typeof (headers as HeaderGetter).get === 'function') {
        return readHeaderValue((headers as HeaderGetter).get(name));
    }

    const target = name.toLowerCase();
    for (const [key, value] of Object.entries(headers as HeaderRecord)) {
        if (key.toLowerCase() !== target || value === undefined) continue;
        return readHeaderValue(value);
    }
    return null;
}

function isRequestLikeInput(input: ParseRequestInput): input is RequestLikeInput {
    const headers = (input as RequestLikeInput).headers;
    return headers !== null && typeof headers === 'object' && !Array.isArray(headers);
}

/**
 * Parses a request's User-Agent and the `Sec-CH-UA-*` headers that are present.
 *
 * It accepts a `Request`-like object, a `Headers`-like object, or a plain header record.
 * It does not emit `Accept-CH`, manage cache headers, or negotiate Client Hints.
 *
 * @example
 * const info = parseRequest(request);
 *
 * const fromHeaders = parseRequest({
 *     'user-agent': userAgent,
 *     'sec-ch-ua': '"Google Chrome";v="130"',
 * });
 */
export function parseRequest(input: ParseRequestInput): UAInfo {
    const requestLike = isRequestLikeInput(input) ? input : { headers: input };
    const read = (name: string) => readHeader(requestLike.headers, name);
    const ua = requestLike.userAgent ?? read('user-agent') ?? '';
    return resolve(ua, decodeClientHints(read), null);
}
