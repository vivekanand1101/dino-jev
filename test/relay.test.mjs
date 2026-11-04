import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleApi} from '../server/api.mjs';
import {requestRunnerPlan} from '../dist/modules/runner-client.js';
import worker from '../server/worker.mjs';
const origin = 'https://dino.example';
const state = {speedPxPerSecond:360,previousLatencyMs:350,expectedLatencyMs:350,dinosaur:{x:50,y:93,width:44,height:47,groundY:93,jumpVelocity:0,jumping:false,ducking:false,spaceHeld:false,downHeld:false},obstacles:[]};
const request = (body=state, headers={}) => new Request(origin+'/api/plan', {method:'POST',headers:{origin,authorization:'Bearer test-key','content-type':'application/json',...headers},body:JSON.stringify(body)});
test('hosted browser request uses same-origin relay; server generates legal plans and forwards key only to Jev', async()=>{
 const result = await requestRunnerPlan(state,'test-key',undefined,async(url, options)=>{
  assert.equal(url,'./api/plan');
  return handleApi(new Request(origin+'/api/plan',{...options,headers:{...options.headers,origin}}),async(upstream, init)=>{
   assert.equal(upstream,'https://api.typesafe.ai/v1/systemone');
   assert.equal(init.headers.Authorization,'Bearer test-key');
   assert.equal(init.redirect,'error');
   const body=JSON.parse(init.body);assert.equal(body.model,'jev-latest');
   return Response.json({answers:{action:{type:'choice',choice:'run'}}});
  });
 },true);
 assert.equal(result.planId,'run');assert.equal(JSON.stringify(result).includes('test-key'),false);
});
test('relay rejects foreign origins, missing keys, invalid states, malformed and oversized bodies before contacting Jev', async()=>{
 const never=async()=>assert.fail('must not call Jev');
 for(const [req,status] of [[request(state,{origin:'https://other.example'}),403],[request(state,{authorization:''}),401],[request({}),400],[request('x'.repeat(32769)),413],[request(state,{'content-type':'text/plain'}),415]])assert.equal((await handleApi(req,never)).status,status);
 const malformed=request(); const req=new Request(malformed,{body:'{'});assert.equal((await handleApi(req,never)).status,400);
});
test('upstream authentication errors remain actionable and never expose upstream response bodies', async()=>{
 const res=await handleApi(request(),async()=>new Response('private upstream details test-key',{status:401}));
 assert.equal(res.status,401);assert.deepEqual(await res.json(),{error:'Jev rejected this key. Update it in Key settings.',retryable:false});
 await assert.rejects(requestRunnerPlan(state,'test-key',undefined,async()=>Response.json({error:'Jev rejected this key. Update it in Key settings.'},{status:401}),true),{message:'Jev rejected this key. Update it in Key settings.'});
});
test('worker advertises relay and serves assets without needing a shared secret', async()=>{
 const config=await worker.fetch(new Request(origin+'/api/config'),{});assert.deepEqual(await config.json(),{relay:true});
 const response=await worker.fetch(new Request(origin+'/'),{ASSETS:{fetch:async()=>new Response('game')}});assert.equal(await response.text(),'game');
});

test('relay network failures, malformed host replies and cancellation are actionable', async()=>{
 await assert.rejects(requestRunnerPlan(state,'',undefined,async()=>assert.fail('must not fetch'),true),{message:'Add your Jev API key in Key settings.'});
 await assert.rejects(requestRunnerPlan(state,'test-key',undefined,async()=>{throw Error('private details');},true),{message:'Cannot reach the game host. Check your connection and try again.',retryable:true});
 await assert.rejects(requestRunnerPlan(state,'test-key',undefined,async()=>new Response('not json'),true),{message:'The game host returned an invalid response.'});
 const controller=new AbortController();controller.abort();
 await assert.rejects(requestRunnerPlan(state,'test-key',controller.signal,async()=>{throw Error('aborted');},true),{name:'AbortError'});
});

test('Worker rate limits by Cloudflare client IP before accepting bodies or calling Jev', async()=>{
 let counterKey;
 const response=await worker.fetch(new Request(origin+'/api/plan',{method:'POST',headers:{'CF-Connecting-IP':'192.0.2.1','X-Forwarded-For':'spoofed'}}),{PLAN_RATE_LIMITER:{limit:async({key})=>{counterKey=key;return {success:false};}}});
 assert.equal(response.status,429);assert.equal(counterKey,'192.0.2.1');assert.equal(response.headers.get('Retry-After'),'60');
 const unconfigured=await worker.fetch(request(),{});assert.equal(unconfigured.status,503);
 const allowed=await worker.fetch(new Request(origin+'/api/plan',{method:'POST',headers:{'CF-Connecting-IP':'192.0.2.1'}}),{PLAN_RATE_LIMITER:{limit:async()=>({success:true})}});assert.equal(allowed.status,403);
});
