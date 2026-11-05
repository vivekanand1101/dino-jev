const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
function setup(hostedRelay=null){
 const elements=new Map(); const get=id=>{if(!elements.has(id))elements.set(id,{textContent:'',disabled:false});return elements.get(id)};
 const events=[],listeners={},requests=[];
 class Runner {
  constructor(){this.currentSpeed=6;this.activated=false;this.paused=false;this.crashed=false;this.horizon={obstacles:[{xPos:600,yPos:105,width:17,typeConfig:{type:'CACTUS_SMALL',height:35}}]};this.canvas={};this.tRex={xPos:0,yPos:93,groundYPos:93,jumpVelocity:0,jumping:false,ducking:false,config:{WIDTH:44,HEIGHT:47}};}
  startGame(){} play(){this.playing=true;this.paused=false} restart(){this.crashed=false;this.play()}
  onKeyDown(e){events.push(['down',e.keyCode])} onKeyUp(e){events.push(['up',e.keyCode])}
 }
 const context=vm.createContext({fetch:async()=>({ok:true,json:async()=>({relay:true})}),Runner,document:{getElementById:get,querySelector:()=>hostedRelay?{content:hostedRelay}:null},window:{addEventListener:(name,fn)=>listeners[name]=fn},mountKeySettings:()=>({getKey:()=> 'test-key',getSignal:()=>undefined}),requestRunnerPlan:async(state,key,signal,fetcher,relay)=>new Promise(resolve=>requests.push({resolve,body:{state},relay})),performance,AbortSignal,setTimeout,clearTimeout,setInterval:()=>{}
 });
 vm.runInContext(readFileSync('public/controller.js','utf8').replace(/^import .*;$/gm,''),context);
 return{context,get,events,requests,listeners};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('game continues while Jev decides; keys stay held until release',async()=>{
 const s=setup();await s.listeners.load();vm.runInContext('motion.set(runner.horizon.obstacles[0],{span:200,speed:360})',s.context);s.get('start').onclick();
 assert.equal(vm.runInContext('runner.playing',s.context),true);
 assert.equal(vm.runInContext('runner.paused',s.context),false);
 assert.equal(s.requests.length,1);
 s.requests[0].resolve({action:'press_space'});await flush();
 assert.deepEqual(s.events,[['down',32]]);assert.equal(s.requests.length,2);
 assert.equal(s.requests[1].body.state.dinosaur.spaceHeld,true);
 s.requests[1].resolve({action:'hold_space'});await flush();
 assert.deepEqual(s.events,[['down',32]]);
 s.requests[2].resolve({action:'release_space'});await flush();
 assert.deepEqual(s.events,[['down',32],['up',32]]);
 s.requests[3].resolve({action:'press_space'});await flush();
 s.requests[4].resolve({action:'tap_space'});await flush();
 assert.deepEqual(s.events.slice(-3),[['down',32],['up',32],['down',32]]);
 s.get('stop').onclick();assert.equal(vm.runInContext('runner.paused',s.context),false);
});
test('late Jev reply is ignored after human takeover',async()=>{
 const s=setup();await s.listeners.load();vm.runInContext('motion.set(runner.horizon.obstacles[0],{span:200,speed:360})',s.context);s.get('start').onclick();s.get('stop').onclick();
 s.requests[0].resolve({action:'press_space'});await flush();
 assert.deepEqual(s.events,[]);assert.equal(s.requests.length,1);
});

test('native website gameplay uses its configured Jev relay instead of a missing local API',async()=>{
 const endpoint='/slops/dino/api/plan';
 const s=setup(endpoint);await s.listeners.load();vm.runInContext('motion.set(runner.horizon.obstacles[0],{span:200,speed:360})',s.context);s.get('start').onclick();
 assert.equal(s.requests[0].relay,endpoint);s.get('stop').onclick();
});
