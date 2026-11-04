import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildPlanDecision} from '../dist/modules/decision.js';
const state=()=>({speedPxPerSecond:360,previousLatencyMs:350,expectedLatencyMs:350,dinosaur:{x:50,y:93,width:44,height:47,groundY:93,jumpVelocity:0,jumping:false,ducking:false,spaceHeld:false,downHeld:false},obstacles:[{type:'CACTUS_SMALL',x:234,y:105,width:17,height:35,distance:140}]});
test('latency projection gives Jev the gap when its decision arrives',()=>{
 const result=buildPlanDecision(state());
 assert.equal(result.state.obstacles[0].predictedGapAtActionPx,14);
 assert.equal(result.state.obstacles[0].contactAfterActionMs,39);
});
test('held Space uses release-and-press jump plans instead of duplicate keydown',()=>{
 const s=state();s.dinosaur.spaceHeld=true;
 const plans=buildPlanDecision(s).criteria;
 assert.ok(Object.values(plans).some(p=>p.events.some(e=>e.action==='tap_space')));
 assert.ok(Object.values(plans).every(p=>p.events.every(e=>e.action!=='press_space')));
});
test('safe cactus forecasts filter out unsafe alternatives',()=>{
 const s=state();s.expectedLatencyMs=80;s.obstacles[0].x=310;s.obstacles[0].distance=216;
 const plans=buildPlanDecision(s).criteria;
 assert.ok(Object.keys(plans).length>0);
 assert.equal(plans.run,undefined);
 assert.ok(Object.values(plans).every(p=>p.description.includes('"approximateCollisionAfterActionMs":null')));
});

test('plans schedule multiple jumps for separated obstacles',()=>{
 const s=state();s.obstacles=[{type:'CACTUS_SMALL',x:454,y:105,width:17,height:35,distance:360},{type:'CACTUS_SMALL',x:814,y:105,width:17,height:35,distance:720}];
 const plan=buildPlanDecision(s).criteria.balanced;
 assert.equal(plan.events.filter(e=>e.action==='tap_space').length,2);
 assert.ok(plan.events.every((e,i)=>i===0||e.atMs>=plan.events[i-1].atMs));
});

test('bird height determines feasible plans',()=>{
 for(const [y,prefix] of [[50,'pass_high'],[75,'duck_'],[100,'jump_low_']]){
 const s=state();s.obstacles=[{id:1,type:'PTERODACTYL',x:600,y,width:46,height:40,distance:506}];
 const plans=buildPlanDecision(s).criteria;
 assert.ok(Object.keys(plans).every(k=>k.startsWith(prefix)));
 assert.ok(Object.values(plans).every(p=>p.obstacleIds.includes(1)));
 }
});
