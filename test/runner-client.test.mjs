import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestRunnerPlan} from '../dist/modules/runner-client.js';
const state=()=>({speedPxPerSecond:360,previousLatencyMs:350,expectedLatencyMs:350,dinosaur:{x:50,y:93,width:44,height:47,groundY:93,jumpVelocity:0,jumping:false,ducking:false,spaceHeld:false,downHeld:false},obstacles:[]});
test('browser builds plans and Jev selects one directly',async()=>{
 const result=await requestRunnerPlan({...state(),privateData:'not-for-model'},'sample-key',undefined,async(url,options)=>{
 assert.equal(url,'https://api.typesafe.ai/v1/systemone');const body=JSON.parse(options.body);assert.equal(body.model,'jev-latest');assert.equal(body.questions.action.type,'choice');assert.equal(JSON.parse(body.state).privateData,undefined);return Response.json({answers:{action:{type:'choice',choice:'run'}}});
 });assert.equal(result.planId,'run');assert.equal(result.provider,'jev');assert.deepEqual(result.plan,{description:'Release both keys and run without jumping.',events:[{atMs:390,action:'release_all'}]});assert.equal(Number.isInteger(result.latencyMs),true);
});
test('invalid states never call Jev',async()=>{
 for(const invalid of [null,{},[],{...state(),speedPxPerSecond:0},{...state(),obstacles:[{type:['CACTUS_SMALL'],x:1,y:2,width:3,height:4,distance:5}]}])await assert.rejects(requestRunnerPlan(invalid,'sample-key',undefined,async()=>assert.fail('must not fetch')),{message:'Invalid runner state.'});
});
test('invalid plans and authorization failures are reported without key disclosure',async()=>{
 await assert.rejects(requestRunnerPlan(state(),'sample-key',undefined,async()=>Response.json({answers:{action:{type:'choice',choice:'__proto__'}}})),{message:'Jev returned an invalid plan.'});
 await assert.rejects(requestRunnerPlan(state(),'sample-key',undefined,async()=>new Response('',{status:401})),{message:'Jev rejected this key. Update it in Key settings.'});
});
