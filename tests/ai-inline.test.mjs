import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const service='https://hybrid-placement-pedro.pedmil226190.chatgpt.site';
function setup(origin){
 const listeners={},timers=new Map(),frames=[],sent=[];let next=0,requests=0;
 const context=vm.createContext({location:{origin,hash:''},crypto:{randomUUID:()=> 'request-1'},AbortSignal,
  state:{application:{name:'Test'},decision:{}},activeRequirements:()=>({}),needsEdited:false,
  reportSections:()=>[],esc:value=>String(value),
  window:{addEventListener:(name,fn)=>listeners[name]=fn,open:()=>{throw Error('No window may open');}},
  document:{addEventListener(){},getElementById(){return null},body:{appendChild:frame=>frames.push(frame)},createElement:tag=>{
   assert.equal(tag,'iframe');return {contentWindow:{postMessage:(data,target)=>sent.push({data,target})},remove(){this.removed=true;}};
  }},
  setTimeout:(fn,delay)=>{const id=++next;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),
  fetch:async()=>{requests++;return Response.json({text:'Preliminary advice. Validate evidence.',model:'test',generatedAt:'2026-10-11T12:00:00Z'});}
 });
 vm.runInContext(fs.readFileSync('studio/ai-analysis.js','utf8'),context);
 return {context,listeners,timers,frames,sent,requests:()=>requests};
}
test('GitHub analysis remains on the page and accepts results only from the protected frame',async()=>{
 const env=setup('https://pedmil01.github.io');const run=code=>vm.runInContext(code,env.context);
 await run('generateAiAnalysis()');assert.equal(env.frames.length,1);assert.equal(env.frames[0].hidden,true);
 const frame=env.frames[0],ready={origin:service,source:frame.contentWindow,data:{type:'wps-ai-ready'}};
 await env.listeners.message({...ready,origin:'https://untrusted.example'});assert.equal(env.sent.length,0);
 await env.listeners.message({...ready,source:{}});assert.equal(env.sent.length,0);
 await env.listeners.message(ready);await env.listeners.message(ready);assert.equal(env.sent.length,1);
 assert.equal(env.sent[0].target,service);
 const result={origin:service,source:frame.contentWindow,data:{type:'wps-ai-result',id:'request-1',analysis:{text:'Keep local control.',model:'test'}}};
 await env.listeners.message({...result,data:{...result.data,id:'another-request'}});assert.equal(run('aiBusy'),true);
 await env.listeners.message(result);assert.equal(run('aiBusy'),false);assert.equal(run('aiCurrent()'),true);
 assert.equal(frame.removed,true);assert.equal(env.timers.size,0);assert.equal(env.requests(),0);
});
test('blocked connection reports an inline error, cleans up and preserves answers',async()=>{
 const env=setup('https://pedmil01.github.io');const run=code=>vm.runInContext(code,env.context);
 await run('generateAiAnalysis()');const timer=[...env.timers.values()][0];assert.equal(timer.delay,20000);timer.fn();
 assert.equal(run('aiBusy'),false);assert.equal(env.frames[0].removed,true);
 assert.equal(run('state.application.name'),'Test');assert.match(run('aiError'),/Sign in to Studio/);
});
test('protected Studio calls its API directly without creating any bridge',async()=>{
 const env=setup(service);await vm.runInContext('generateAiAnalysis()',env.context);
 assert.equal(env.frames.length,0);assert.equal(env.requests(),1);assert.equal(vm.runInContext('aiCurrent()',env.context),true);
});
