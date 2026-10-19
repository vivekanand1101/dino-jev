import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {createApp} from '../dist/app.js';
import {validateRunnerState} from '../dist/state.js';
const state=()=>({speedPxPerSecond:360,previousLatencyMs:350,expectedLatencyMs:350,dinosaur:{x:50,y:93,width:44,height:47,groundY:93,jumpVelocity:0,jumping:false,ducking:false,spaceHeld:false,downHeld:false},obstacles:[]});
test('manual play and health work without a key',async()=>{
 const app=createApp();
 const health=await request(app).get('/health'); assert.equal(health.status,200); assert.deepEqual(health.body,{configured:false,model:'jev-latest'});
 const page=await request(app).get('/');assert.equal(page.status,200); assert.match(page.text,/<title>Dino × Jev<\/title>/);
 const unavailable=await request(app).post('/api/action').send({state:state()});assert.equal(unavailable.status,503);assert.deepEqual(unavailable.body,{error:'Set TYPESAFE_API_KEY or JEV_API_KEY to enable Jev.'});
});
test('reject malformed JSON, wrong content type, excessive bodies and invalid state before upstream',async()=>{
 const app=createApp('test-secret','jev-latest',async()=>{assert.fail('must not contact upstream')});
 for(const invalid of [null,[],{}, {...state(),speedPxPerSecond:0},{...state(),previousLatencyMs:-1},{...state(),expectedLatencyMs:'350'},{...state(),dinosaur:null},{...state(),physics:{gravity:-1}},{...state(),obstacles:Array(4).fill({})},{...state(),obstacles:[{type:'__proto__',x:1,y:2,width:3,height:4,distance:5}]}]){
 const response=await request(app).post('/api/action').send({state:invalid});assert.equal(response.status,400);assert.deepEqual(response.body,{error:'Invalid runner state.'});
 }
 const malformed=await request(app).post('/api/action').type('json').send('{');assert.equal(malformed.status,400);assert.deepEqual(malformed.body,{error:'Malformed JSON.'});
 const large=await request(app).post('/api/action').send({state:state(),padding:'x'.repeat(9000)});assert.equal(large.status,413);assert.deepEqual(large.body,{error:'Request body exceeds 8kb.'});
 const text=await request(app).post('/api/action').type('text').send('hello');assert.equal(text.status,415);assert.deepEqual(text.body,{error:'Content-Type must be application/json.'});
 const hostile=await request(app).post('/api/action').set('Origin','https://evil.example').send({state:state()});assert.equal(hostile.status,403);assert.deepEqual(hostile.body,{error:'Same-origin requests required.'});
});
test('Jev receives only validated state, server credentials, and a bounded request',async()=>{
 let calls=0;
 const app=createApp('test-secret','test-model',async(url,options)=>{
 calls++;assert.equal(url,'https://api.typesafe.ai/v1/systemone');assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.deepEqual(options.headers,{Authorization:'Bearer test-secret','Content-Type':'application/json'});assert.equal(options.signal.aborted,false);
 const body=JSON.parse(options.body);assert.equal(body.model,'test-model');assert.equal(body.questions.action.type,'choice');assert.equal(JSON.parse(body.state).privateData,undefined);
 return Response.json({answers:{action:{type:'choice',choice:'run'}}});
 });
 const response=await request(app).post('/api/action').send({state:{...state(),privateData:'not-for-the-model'}});
 assert.equal(response.status,200);assert.equal(calls,1);assert.equal(response.body.planId,'run');assert.equal(response.body.provider,'jev');
 assert.deepEqual(response.body.plan,{description:'Release both keys and run without jumping.',events:[{atMs:390,action:'release_all'}]});assert.equal(Number.isInteger(response.body.latencyMs),true);assert.equal(response.text.includes('test-secret'),false);
});
test('upstream errors and invalid choices are contained',async()=>{
 for(const [fake,error] of [[async()=>new Response('',{status:429}),'Jev returned HTTP 429.'],[async()=>Response.json({answers:{action:{type:'choice',choice:'__proto__'}}}),'Jev request failed or timed out.'],[async()=>{throw new Error('secret upstream details')},'Jev request failed or timed out.']]){
 const response=await request(createApp('test-secret','jev-latest',fake)).post('/api/action').send({state:state()});assert.equal(response.status,502);assert.equal(response.body.retryable,true);assert.deepEqual(response.body,{error,retryable:true});assert.equal(response.text.includes('secret'),false);
 }
});
test('runner validation strips private fields and enforces numeric and obstacle bounds',()=>{
 const valid=state();valid.obstacles=[{id:1,type:'CACTUS_SMALL',x:300,y:105,distance:206,width:17,height:35,speedPxPerSecond:360,privateData:'secret'}];
 assert.deepEqual(validateRunnerState(valid),{speedPxPerSecond:360,previousLatencyMs:350,expectedLatencyMs:350,dinosaur:{...valid.dinosaur,reachedMinHeight:undefined,speedDrop:undefined},physics:undefined,obstacles:[{id:1,type:'CACTUS_SMALL',x:300,y:105,distance:206,width:17,height:35,speedPxPerSecond:360}]});
 for(const [field,value] of [['width',0],['height',-1],['id',1.1],['speedPxPerSecond',0],['type','other'],['type',['CACTUS_SMALL']]]){
 const invalid=structuredClone(valid);invalid.obstacles[0][field]=value;assert.equal(validateRunnerState(invalid),null);
 }
});
