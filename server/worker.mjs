import {handleApi} from './api.mjs';
const WEBSITE = 'https://anandvivek.in';
function cors(response, origin) {
  if (origin !== WEBSITE) return response;
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', WEBSITE);
  headers.set('Vary', 'Origin');
  return new Response(response.body, {status:response.status,headers});
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = request.headers.get('Origin');
    if (url.pathname === '/api/plan') {
      if (request.method === 'OPTIONS') {
        const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(h=>h.trim()).filter(Boolean);
        if (origin !== WEBSITE || request.headers.get('Access-Control-Request-Method') !== 'POST' || requestedHeaders.some(h=>!['authorization','content-type'].includes(h))) return new Response('Origin not allowed.', {status:403});
        return cors(new Response(null, {status:204,headers:{'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'}}), origin);
      }
      // Cloudflare supplies this address; never trust client-supplied X-Forwarded-For.
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip || !env.PLAN_RATE_LIMITER) {
        return cors(Response.json({error:'Game service is not configured. Try again later.'}, {status:503,headers:{'Cache-Control':'no-store'}}), origin);
      }
      const {success} = await env.PLAN_RATE_LIMITER.limit({key:ip});
      if (!success) return cors(Response.json({error:'Too many game requests. Wait a minute before trying again.'}, {status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}}), origin);
    }
    if (url.pathname.startsWith('/api/')) return cors(await handleApi(request), origin);
    return env.ASSETS.fetch(request);
  }
};
