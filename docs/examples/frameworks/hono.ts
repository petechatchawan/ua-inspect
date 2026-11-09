/**
 * Compile-checked Hono recipe. `npm run typecheck` compiles this file.
 */
import { Hono } from 'hono';
import { isBot } from '../../../src/index';
import { parseRequest } from '../../../src/server';

const app = new Hono();

app.use('*', async (context, next) => {
    const info = parseRequest(context.req.raw);
    if (isBot(info)) return context.text('Forbidden', 403);
    await next();
});

export { app };
