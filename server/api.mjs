import {requestRunnerPlan} from '../dist/modules/runner-client.js';
import {WEBSITE_ORIGINS} from './origins.mjs';

// Shared by the loopback preview and Cloudflare Worker. Never stores keys.
export async function handleApi(request, fetcher = fetch) {
  const url = new URL(request.url);
  if (url.pathname === '/api/config' && request.method === 'GET') {
    return Response.json({relay: true}, {headers: {'Cache-Control': 'no-store'}});
  }
  if (url.pathname !== '/api/plan') return new Response('Not found', {status: 404});
  const fail = (error, status) => Response.json({error}, {status, headers: {'Cache-Control': 'no-store'}});
  if (request.method !== 'POST') return fail('Method not allowed.', 405);
  if (request.headers.get('origin') !== url.origin && !WEBSITE_ORIGINS.has(request.headers.get('origin'))) return fail('Origin not allowed.', 403);
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return fail('Expected JSON.', 415);
  const key = request.headers.get('authorization')?.match(/^Bearer (\S{1,1024})$/)?.[1];
  if (!key) return fail('Add your Jev API key in Key settings.', 401);
  // Bound the actual stream, including chunked requests with no Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return fail('Invalid runner state.', 400);
  const chunks = []; let length = 0;
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 32768) { await reader.cancel(); return fail('Request too large.', 413); }
    chunks.push(value);
  }
  let state;
  try { state = JSON.parse(await new Blob(chunks).text()); }
  catch { return fail('Invalid runner state.', 400); }
  try {
    const result = await requestRunnerPlan(state, key, request.signal, fetcher);
    return Response.json(result, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    const message = error.name === 'JevError' ? error.message : 'Jev request failed.';
    const status = message === 'Invalid runner state.' ? 400 : message.includes('rejected this key') ? 401 : message.includes('rate limit') ? 429 : 502;
    return Response.json({error: message, retryable: !!error.retryable}, {status, headers: {'Cache-Control': 'no-store'}});
  }
}
