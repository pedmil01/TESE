const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes={};
function node(id){return nodes[id]||=({hidden:false,disabled:false,required:false,value:'',innerHTML:'',textContent:'',attributes:{},setAttribute(key,value){this.attributes[key]=value}});}
const ctx=vm.createContext({fetch:()=>new Promise(()=>{}),setTimeout,clearTimeout,location:{origin:'https://hybrid-placement-pedro.pedmil226190.chatgpt.site',hash:''},window:{addEventListener:()=>{}},document:{getElementById:node,addEventListener:()=>{}},hideStatusTip:()=>{},enhanceAcronyms:()=>{}});
for(const file of ['decision-context.js','app.js','report.js','ai-analysis.js'])vm.runInContext(fs.readFileSync('studio/'+file,'utf8'),ctx);
vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),ctx);
vm.runInContext("state.application={id:'TEST',name:'AI applicability',owner:'Owner',financialCriticality:'noncritical',executionRestriction:'flexible',sovereigntyRestriction:'conditional'};step=1",ctx);
const base={delivery:'container',criticality:'medium',local:'no',cloud:'yes',hybrid:'no',proximity:'flexible',hardware:'standard',platform:'self',economics:'cloud',demand:'steady',recovery:'yes',control:'shared',skills:'partial',sourcing:'yes',networkExposure:'internal',securityIsolation:'segmented',keyCustody:'institution',trustedRecovery:'both',aiInfrastructure:'none',embeddedAI:'none'};
function load(overrides){ctx.input={...base,...overrides};vm.runInContext('state.requirements=input',ctx);return vm.runInContext('({r:recommendation(),progress:assessmentProgress(),authority:questionApplies({key:"aiAuthority"}),data:questionApplies({key:"aiData"}),authorityHtml:assessmentQuestionHtml(questions.find(q=>q.key==="aiAuthority")),dataHtml:assessmentQuestionHtml(questions.find(q=>q.key==="aiData")),payload:JSON.parse(aiSnapshot()),sections:reportSections()})',ctx);}
for(const [input,authority,data]of [
 [{},false,false],
 [{aiInfrastructure:'training'},false,true],
 [{embeddedAI:'yes'},true,true],
 [{aiInfrastructure:'inference',embeddedAI:'yes'},true,true],
 [{embeddedAI:'unknown'},false,false],
 [{aiInfrastructure:'unknown'},false,false],
 [{aiInfrastructure:'unknown',embeddedAI:'yes'},true,true]
]){
 const test=load(input);assert.equal(test.authority,authority);assert.equal(test.data,data);
 for(const [html,applicable]of [[test.authorityHtml,authority],[test.dataHtml,data]]){
  assert.equal(/id="field-[^"]+" hidden/.test(html),!applicable,'Inapplicable question is hidden');
  assert.equal(/<select[^>]+disabled/.test(html),!applicable,'Inapplicable question cannot be edited or focused');
  assert.equal(html.includes('required aria-required="true"'),applicable,'Only applicable AI questions are required');
 }
 assert.equal(test.progress.missing.some(q=>q.key==='aiAuthority'),authority);
 assert.equal(test.progress.missing.some(q=>q.key==='aiData'),data);
 if(data)assert.equal(test.r.id,null,'Relevant but unknown processing location withholds placement');
 else assert.ok(!test.r.placementMissing.includes('AI data flows and processing location'));
}
const stale=load({cloud:'no',aiAuthority:'A4',aiData:'external',aiFlowDetails:'Obsolete external flow'});
assert.equal(stale.r.id,'ONPREM-CAAS');assert.equal(stale.r.intendedAiAuthority,null);assert.equal(stale.r.placementConflicts.length,0);
assert.equal(stale.progress.missing.length,0);
for(const key of ['aiAuthority','aiData','aiFlowDetails'])assert.ok(!(key in stale.payload.requirements),'Hidden '+key+' is excluded from AI/export payloads');
assert.ok(!JSON.stringify(stale.sections).includes('Obsolete external flow'));
const answers=stale.sections.find(([heading])=>heading==='Assessment questions and answers')[1];
assert.match(answers[20].answer,/no embedded AI is enabled or planned/);assert.match(answers[21].answer,/no AI workload or embedded AI is used/);
const workload=load({aiInfrastructure:'training',aiData:'local',aiAuthority:'A4'});
assert.equal(workload.r.id,'ONPREM-CAAS');assert.equal(workload.r.intendedAiAuthority,null,'A workload alone does not make operational authority applicable');
assert.ok(!workload.r.outstanding.some(item=>item.detail==='What authority will AI have over infrastructure operations?'));
const embedded=load({embeddedAI:'yes',aiAuthority:'A3',aiData:'external'});
assert.equal(embedded.r.intendedAiAuthority,'A3');assert.equal(embedded.r.id,'CLOUD-CAAS');
assert.match(vm.runInContext('aiQuestionContext()',ctx),/without a dedicated AI workload/);
load({embeddedAI:'yes',aiAuthority:'A4',aiData:'external'});
vm.runInContext("answer('embeddedAI','none')",ctx);
for(const key of ['aiAuthority','aiData']){
 assert.equal(node('field-'+key).hidden,true);assert.equal(node('q-'+key).disabled,true);assert.equal(node('q-'+key).required,false);
 assert.equal(vm.runInContext('state.requirements.'+key,ctx),undefined,'Switching AI off clears an obsolete selection');
}
assert.equal(node('ai-flow-evidence').hidden,true);assert.equal(node('progress').textContent,22);
vm.runInContext("answer('aiInfrastructure','inference')",ctx);
assert.equal(node('field-aiData').hidden,false);assert.equal(node('q-aiData').required,true);assert.equal(node('field-aiAuthority').hidden,true);
vm.runInContext("answer('aiData','local');answer('embeddedAI','yes')",ctx);
assert.equal(node('field-aiAuthority').hidden,false);assert.equal(node('q-aiAuthority').required,true);assert.equal(vm.runInContext('state.requirements.aiAuthority',ctx),undefined,'Enabling AI again requires a fresh authority answer');
assert.equal(node('ai-flow-evidence').hidden,false);
assert.ok(vm.runInContext('questions.find(q=>q.key==="embeddedAI").label',ctx).includes('software, platform or hardware'));
console.log('AI applicability checks passed: no AI/workload-only/embedded/both/unknown cases, live visibility and required state, stale-answer cleanup, independent authority, PDF explanations and sanitized AI/export payloads.');
