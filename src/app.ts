import { validateRunnerState } from './state.js';
import { inferenceLimit, localBrowserSecurity } from './security.js';
import { buildPlanDecision } from './decision.js';
import express, { type ErrorRequestHandler } from 'express';
import { fileURLToPath } from 'node:url';
export function createApp(key?: string, model = 'jev-latest', fetcher: typeof fetch = fetch) {
const app = express();
app.disable('x-powered-by');
app.use(localBrowserSecurity());
app.use('/api', inferenceLimit());
app.use(express.json({ limit: '8kb' }));
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));
app.get('/health', (_req,res) => res.json({configured: Boolean(key), model}));
app.post('/api/action', async (req,res) => {
  if (!req.is('application/json')) { res.status(415).json({error:'Content-Type must be application/json.'}); return; }
  const s = validateRunnerState(req.body?.state);
  if (!s) { res.status(400).json({error:'Invalid runner state.'}); return; }
  if (!key) { res.status(503).json({error:'Set TYPESAFE_API_KEY or JEV_API_KEY to enable Jev.'}); return; }
  const decision = buildPlanDecision(s);
  const started = performance.now();
  try {
    const response = await fetcher('https://api.typesafe.ai/v1/systemone', {
      method:'POST', redirect:'error', signal:AbortSignal.timeout(3000),
      headers:{Authorization:`Bearer ${key}`, 'Content-Type':'application/json'},
      body:JSON.stringify({model, state:JSON.stringify(decision.state), questions:{action:{type:'choice',instructions:decision.instructions,criteria:decision.criteria}}})
    });
    if (!response.ok) { res.status(502).json({error:`Jev returned HTTP ${response.status}.`, retryable:[429,500,502,503,504].includes(response.status)}); return; }
    const data = await response.json();
    const action = data?.answers?.action?.choice;
    if (data?.answers?.action?.type !== 'choice' || typeof action !== 'string' || !Object.hasOwn(decision.criteria, action)) throw new Error('Invalid action');
    res.json({plan:decision.criteria[action], planId:action, provider:'jev', latencyMs:Math.round(performance.now()-started)});
  } catch { res.status(502).json({error:'Jev request failed or timed out.',retryable:true}); }
});
app.use((_req,res) => { res.status(404).json({error:'Route not found.'}); });
const errors: ErrorRequestHandler = (error,_req,res,_next) => {
  if (error?.type === 'entity.too.large') { res.status(413).json({error:'Request body exceeds 8kb.'}); return; }
  if (error?.type === 'entity.parse.failed') { res.status(400).json({error:'Malformed JSON.'}); return; }
  res.status(500).json({error:'Internal server error.'});
};
app.use(errors);
return app;
}
