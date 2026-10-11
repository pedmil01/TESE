import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {generateAnalysis,validateAssessment,limitWords,providerError} from '../lib/ai-analysis.mjs';

const assessment={version:1,application:{name:'Institutional file exchange',rto:'2',rpo:'15',dependencies:'Identity before file exchange',needs:'Sizing explanation: 500 users'},requirements:{delivery:'container',cloud:'no',aiFlowDetails:'Optional explanation: internal model context only',operatingEvidence:'Internal operations, 24/7'},decision:{rationale:'Local keys must stay under institutional control'},sections:[['Solution profile',[{question:'RTO — time to restore (hours)',answer:'2'}]]],sizingUserEdited:true};
test('all inputs reach Responses and advice cannot expose credentials or become authorization',async()=>{
 let sent;
 const output=await generateAnalysis(assessment,{apiKey:'test-only-key',fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(options.body);
  return Response.json({status:'completed',model:'gpt-5.4-mini',output:[{type:'message',content:[{type:'output_text',text:'Preliminary analysis. Specialist validation and institutional approval are required.'}]}]});
 }});
 assert.deepEqual(JSON.parse(sent.input),assessment);assert.equal(sent.store,false);assert.equal(sent.model,'gpt-5.4-mini');assert.ok(!sent.tools);
 assert.match(sent.instructions,/untrusted assessment data/);assert.match(sent.instructions,/HOURS/);assert.match(sent.instructions,/MINUTES/);assert.match(sent.instructions,/A4 Bounded Autonomy/);assert.match(sent.instructions,/eligibility unresolved/);
 assert.equal(output.provider,'OpenAI');assert.ok(!JSON.stringify(output).includes('test-only-key'));
 assert.match(sent.instructions,/Eligibility scope and evidence review/);
 assert.match(sent.instructions,/do not add an eligibility or approval status to the proposal/);
 assert.match(sent.instructions,/aiAuthority is collected only when embeddedAI is enabled or planned/);
 assert.match(sent.instructions,/No AI workload alone does not exclude embedded AI processing/);
});
test('the hard word limit is enforced independently of model instructions',()=>{
 const result=limitWords(Array(2500).fill('word').join(' '));assert.equal(result.text.split(/\s+/).length,2000);assert.equal(result.wordCount,2000);assert.equal(result.shortened,true);
});
test('invalid input and billing failures have actionable messages without provider secrets',async()=>{
 assert.throws(()=>validateAssessment({...assessment,requirements:{cloud:{nested:true}}}),/field is invalid/);
 assert.throws(()=>validateAssessment({...assessment,application:{name:'x'.repeat(30001)}}),/too long/);
 assert.equal(providerError(429,{error:{code:'insufficient_quota',message:'private provider detail'}}).code,'billing_required');
 assert.equal(providerError(429,{error:{code:'credit_balance_exhausted',type:'insufficient_quota'}}).code,'billing_required');
 await assert.rejects(generateAnalysis(assessment,{apiKey:'test',fetchImpl:async()=>Response.json({error:{code:'insufficient_quota',message:'private provider detail'}},{status:429})}),error=>error.code==='billing_required'&&!error.message.includes('private provider detail'));
 await assert.rejects(generateAnalysis(assessment,{apiKey:'test',fetchImpl:async()=>Response.json({status:'incomplete'})}),error=>error.code==='analysis_incomplete');
});
test('changing any optional text invalidates the AI report; HTML-like model content is escaped',()=>{
 const listeners=[];
 const context=vm.createContext({fetch:()=>new Promise(()=>{}),location:{origin:'https://hybrid-placement-pedro.pedmil226190.chatgpt.site',hash:''},window:{addEventListener:(...args)=>listeners.push(args)},document:{addEventListener:()=>{}},setTimeout,clearTimeout});
 for(const file of ['decision-context.js','app.js','report.js','ai-analysis.js'])vm.runInContext(fs.readFileSync('studio/'+file,'utf8'),context);
 vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),context);
 vm.runInContext("state.application={name:'Test',rto:'2',rpo:'15'};state.requirements={};state.decision={};aiAccept({text:'<script>alert(1)</script> Preliminary advice.',model:'gpt-5.4-mini',generatedAt:'2026-10-11T14:00:00Z'},aiSnapshot())",context);
 assert.equal(vm.runInContext('aiCurrent()',context),true);
 assert.match(vm.runInContext('aiRecommendationCard()',context),/reviews eligibility scope and supporting evidence/);
 assert.ok(!vm.runInContext('proposal()',context).includes('<dt>Eligibility</dt>'));
 assert.match(vm.runInContext('aiRecommendationCard()',context),/&lt;script&gt;/);
 assert.ok(vm.runInContext("JSON.stringify(reportSections()).includes('<script>alert(1)</script> Preliminary advice.')",context));
 vm.runInContext("state.decision.conditions='New optional explanation'",context);
 assert.equal(vm.runInContext('aiCurrent()',context),false);
 assert.equal(vm.runInContext("JSON.stringify(reportSections()).includes('<script>alert(1)</script> Preliminary advice.')",context),false);
 assert.match(vm.runInContext('JSON.stringify(aiReportSection())',context),/omitted/);
 assert.match(fs.readFileSync('studio/ai-analysis.js','utf8'),/event.origin!==aiGithubOrigin\|\|event.source!==window.opener/);
});
