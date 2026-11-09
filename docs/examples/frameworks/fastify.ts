/**
 * Compile-checked Fastify recipe. `npm run typecheck` compiles this file.
 */
import Fastify from 'fastify';
import { isBot } from '../../../src/index';
import { parseRequest } from '../../../src/server';

const app = Fastify();

app.addHook('onRequest', async (request, reply) => {
    const info = parseRequest(request.headers);
    if (isBot(info)) await reply.code(403).send();
});

export { app };
