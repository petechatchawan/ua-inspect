/**
 * Compile-checked request recipes. `npm run typecheck` compiles this file.
 * The same calls work in Next.js middleware, Hono, Fastify, and Cloudflare Workers.
 */
import type { IncomingHttpHeaders } from 'node:http';
import { is, isBot } from '../../src/index';
import { parseRequest } from '../../src/server';

declare const request: Request;
declare const headers: IncomingHttpHeaders;

const fromRequest = parseRequest(request);
const fromRecord = parseRequest({ 'user-agent': 'curl/8.4.0' });
const fromHeaders = parseRequest(headers);

export function middleware(input: Request): Response | undefined {
    const info = parseRequest(input);
    if (isBot(info)) return new Response(null, { status: 403 });
    return undefined;
}

export async function fetchHandler(input: Request): Promise<Response> {
    const info = parseRequest(input);
    return Response.json({
        bot: isBot(info),
        chromium: is(info, { family: 'chromium' }),
    });
}

void [fromRequest, fromRecord, fromHeaders];
