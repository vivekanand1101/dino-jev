import {handleApi} from './api.mjs';
export default {
  async fetch(request, env) {
    const {pathname} = new URL(request.url);
    if (pathname === '/api/plan') {
      // Cloudflare supplies this address; never trust client-supplied X-Forwarded-For.
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip || !env.PLAN_RATE_LIMITER) {
        return Response.json({error:'Game service is not configured. Try again later.'}, {status:503,headers:{'Cache-Control':'no-store'}});
      }
      const {success} = await env.PLAN_RATE_LIMITER.limit({key:ip});
      if (!success) return Response.json({error:'Too many game requests. Wait a minute before trying again.'}, {status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
    }
    if (pathname.startsWith('/api/')) return handleApi(request);
    return env.ASSETS.fetch(request);
  }
};
