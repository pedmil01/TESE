const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({fetch:()=>new Promise(()=>{})});
vm.runInContext(fs.readFileSync('dist/decision-context.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('dist/report.js','utf8'),ctx);
vm.runInContext('model='+fs.readFileSync('dist/model.json','utf8'),ctx);
function recommend(overrides){ctx.input=overrides;return vm.runInContext('recommendation(input)',ctx)}
vm.runInContext("state.application={financialCriticality:'noncritical',executionRestriction:'flexible',sovereigntyRestriction:'conditional'}",ctx);
const base={criticality:'medium',delivery:'container',local:'no',cloud:'yes',hybrid:'no',proximity:'flexible',hardware:'standard',platform:'self',economics:'cloud',demand:'steady',control:'shared',skills:'partial',sourcing:'yes',operatingEvidence:'Operating scope: platform team, 24/7 coverage, lifecycle and recovery ownership'};
for(const delivery of ['saas','package','container','modern','ai'])assert.equal(recommend({delivery}).id,null,'Delivery alone must never assign placement');
assert.equal(recommend(base).id,'CLOUD-CAAS');
for(const override of [{local:'yes'},{cloud:'no'},{proximity:'hard'},{hardware:'local'},{economics:'local'}])assert.equal(recommend({...base,...override}).id,'ONPREM-CAAS');
for(const key of ['local','cloud','hybrid','proximity','hardware'])assert.equal(recommend({...base,[key]:'unknown'}).id,null,'Unknown constraint must withhold placement: '+key);
assert.equal(recommend({...base,economics:'unknown',demand:'steady'}).id,null);
assert.equal(recommend({...base,economics:'unknown',demand:'elastic'}).id,'CLOUD-CAAS');
assert.equal(recommend({...base,hybrid:'yes'}).id,'HYBRID-COMPOSITION');
for(const override of [{cloud:'no'},{local:'yes'}])assert.equal(recommend({...base,hybrid:'yes',...override}).id,null);
assert.equal(recommend({...base,delivery:'saas'}).id,'CLOUD-SAAS');
for(const override of [{local:'yes'},{cloud:'no'},{proximity:'hard'},{hardware:'local'},{hybrid:'yes'}])assert.ok(recommend({...base,delivery:'saas',...override}).issues.length);
assert.equal(recommend({...base,delivery:'modern',platform:'unknown'}).id,null);
assert.equal(recommend({...base,delivery:'modern',platform:'managed'}).id,'CLOUD-PAAS');
assert.equal(recommend({...base,delivery:'package',platform:'self'}).id,'CLOUD-IAAS');
assert.equal(recommend({...base,delivery:'modern',local:'yes',platform:'managed'}).id,null);
assert.equal(recommend({...base,delivery:'package',local:'yes',platform:'private'}).id,'ONPREM-PRIVATE-CLOUD');
assert.equal(recommend({...base,delivery:'package',platform:'private'}).id,null);
assert.equal(recommend({...base,control:'unknown',skills:'strong'}).operative,null);
assert.equal(recommend({...base,skills:'strong'}).operative,'INTERNAL');
assert.equal(recommend({...base,skills:'limited'}).operative,'OUTSOURCED-MSP');
assert.equal(recommend({...base,skills:'partial'}).operative,'CO-MANAGED');
assert.equal(recommend({...base,criticality:'high'}).id,recommend({...base,criticality:'low'}).id);
assert.ok(recommend({...base,criticality:'high'}).checks.some(x=>x.includes('critical-service')));
ctx.input={delivery:'saas'};const html=vm.runInContext('state.requirements=input;proposal()',ctx);assert.ok(html.includes('Outstanding requirements'));assert.ok(html.includes('Placement proposal')&&html.includes('Unresolved'));
assert.equal(recommend(base).status,'PLACEMENT PROPOSAL');
vm.runInContext("state.application.executionRestriction='local'",ctx);assert.equal(recommend(base).id,'ONPREM-CAAS');
vm.runInContext("state.application.executionRestriction='flexible';state.application.sovereigntyRestriction='local'",ctx);assert.equal(recommend(base).id,'ONPREM-CAAS');
assert.equal(recommend({...base,hybrid:'yes'}).id,null);
vm.runInContext("state.application.sovereigntyRestriction='unknown'",ctx);assert.equal(recommend(base).id,null);
vm.runInContext("state.application.sovereigntyRestriction='conditional'",ctx);
assert.equal(recommend(base).status,'PLACEMENT PROPOSAL');
assert.ok(recommend(base).checks.some(x=>x.includes('Data and control sovereignty')));
vm.runInContext("state.application.financialCriticality='critical'",ctx);assert.ok(recommend(base).checks.some(x=>x.includes('Financial / systemic')));
const gateHtml=vm.runInContext('assessment()',ctx);assert.ok(!gateHtml.includes('gate-security'));assert.ok(!gateHtml.includes('Mandatory eligibility checks'));assert.ok(gateHtml.includes('q-delivery'));
console.log('Placement regression checks passed: delivery-only, unknowns, local constraints, cost / demand, hybrid conflicts, compatibility, independent operations and assurance.');

assert.equal(recommend({...base,embeddedAI:'yes',aiData:'unknown'}).id,null);
assert.equal(recommend({...base,embeddedAI:'yes',aiData:'external',cloud:'no'}).id,null);
assert.ok(recommend({...base,aiAuthority:'A3',aiData:'local'}).checks.some(x=>x.includes('A3 —')));
assert.ok(recommend({...base,aiAuthority:'A4',aiData:'local'}).checks.some(x=>x.includes('A4 —')));
assert.ok(recommend({...base,aiAuthority:'A2',aiData:'local'}).checks.some(x=>x.includes('no-production-write')));
assert.equal(recommend({...base,aiInfrastructure:'inference',aiData:'local'}).id,'ONPREM-CAAS');

assert.ok(recommend({...base,networkExposure:'internet'}).cyberChecks.some(x=>x.includes('Internet exposure')));
assert.ok(recommend({...base,securityIsolation:'dedicated'}).cyberChecks.some(x=>x.includes('Dedicated physical isolation')));
assert.ok(recommend({...base,keyCustody:'institution'}).cyberChecks.some(x=>x.includes('Institution-controlled keys')));
assert.ok(recommend({...base,trustedRecovery:'undefined'}).cyberChecks.some(x=>x.includes('Cyber-recovery gap')));
assert.ok(recommend({...base,trustedRecovery:'both'}).cyberChecks.some(x=>x.includes('Trusted rebuild')));
assert.equal(recommend({...base,networkExposure:'internet',keyCustody:'institution',securityIsolation:'dedicated'}).id,recommend(base).id);

// Requested acceptance cases, checking both engine output and rendered/report content.
function renderCase(input){ctx.input=input;vm.runInContext('state.requirements=input',ctx);return vm.runInContext('({r:recommendation(),html:proposal(),result:result(),sections:reportSections()})',ctx);}
const recoveryCase=renderCase({...base,economics:'unknown',demand:'elastic',recovery:'unknown',skills:'unknown',operatingEvidence:''});
assert.equal(recoveryCase.r.id,'CLOUD-CAAS');
assert.equal(recoveryCase.r.operative,null);
assert.ok(recoveryCase.r.outstanding.some(x=>x.category==='Recovery'&&/not defined/.test(x.detail)));
for(const text of ['Placement proposal','Eligibility','Proposed operating model','Approval','Unresolved — specialist validation required.','Pending institutional approval.','Cloud candidate suggested by elasticity; economic suitability remains unassessed.','Recovery']){
 assert.ok(recoveryCase.html.replace(/<span class="status-help-icon"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'').includes(text),text+' visible beside candidate');
 assert.ok(recoveryCase.result.replace(/<span class="status-help-icon"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'').includes(text),text+' visible on recommendation');
 assert.ok(JSON.stringify(recoveryCase.sections).includes(text),text+' visible in PDF sections');
}
for(const text of ['Comparable lifecycle costs','assessment period','Baseline demand','Peak demand','Scaling capability','Capacity assumptions'])assert.ok(recoveryCase.html.includes(text));
for(const key of ['control','skills','sourcing'])assert.equal(recommend({...base,[key]:'unknown'}).operative,null);
assert.equal(recommend({...base,operatingEvidence:''}).operative,null);
assert.equal(recommend({...base,delivery:'saas',skills:'unknown'}).operative,null);
for(const authority of ['A3','A4']){
 const test=renderCase({...base,aiAuthority:authority,aiData:'local'});
 assert.equal(test.r.intendedAiAuthority,authority);
 assert.equal(test.r.eligibility,'Unresolved — specialist validation required.');
 assert.equal(test.r.approval,'Pending institutional approval.');
 assert.ok(test.html.includes('Recorded intent does not authorize execution'));
 assert.ok(test.r.checks.some(x=>x.startsWith(authority+' —')));
 assert.ok(test.r.outstanding.some(x=>x.category==='AI authority and data flows'));
 assert.ok(JSON.stringify(test.sections).includes('Intended AI authority: '+authority));
}
for(const input of [
 {...base,delivery:'saas',local:'yes'},
 {...base,delivery:'saas',sourcing:'no'},
 {...base,delivery:'saas',control:'retain'},
 {...base,hybrid:'yes',cloud:'no'},
 {...base,hybrid:'yes',local:'yes'},
 {...base,embeddedAI:'yes',aiData:'external',cloud:'no'}
]){
 const test=renderCase(input);assert.equal(test.r.id,null);assert.ok(test.r.placementConflicts.length);
 assert.ok(test.html.includes('Requirements conflict'));assert.ok(test.html.includes('Confirmed requirement conflicts'));
 assert.equal(vm.runInContext('decisionStatuses(recommendation())[0][1]',ctx),'Requirements conflict');
}
const opConflict=renderCase({...base,skills:'limited',sourcing:'no'});
assert.equal(opConflict.r.id,'CLOUD-CAAS');assert.equal(opConflict.r.operative,null);assert.ok(opConflict.r.operatingConflicts.length);assert.equal(opConflict.r.placementConflicts.length,0);
const noAi=renderCase({...base,aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none'});
assert.ok(noAi.r.aiStatus.startsWith('Not applicable'));
for(const key of ['aiInfrastructure','embeddedAI','aiAuthority']){
 const test=renderCase({...base,aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none',[key]:'unknown'});
 assert.ok(test.r.aiStatus.startsWith('Unresolved'));assert.ok(test.r.outstanding.some(x=>x.category==='AI authority and data flows'));
 assert.ok(vm.runInContext("questionApplies({key:'aiData'})",ctx));
}
for(const economics of ['cloud','local','similar']){
 const test=renderCase({...base,economics,demand:'elastic'});
 assert.ok(test.r.economicsBasis.includes('Assessor-supplied conclusion'));
 assert.ok(test.r.economicsBasis.includes('does not calculate TCO'));
}
const comparableNoEvidence=renderCase({...base,economics:'similar',demand:'elastic'});
assert.ok(comparableNoEvidence.html.includes('Cloud candidate suggested by elasticity; economic suitability remains unassessed.'));
const complete=renderCase({...base,recovery:'yes',networkExposure:'internal',securityIsolation:'segmented',keyCustody:'institution',trustedRecovery:'both',aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none',costEvidence:'Cost comparison FIN-10 prepared by owner; equivalent service, security, recovery and exit',costPeriod:'5 years',baselineDemand:'100 transactions/s',peakDemand:'500 transactions/s for 2 hours',scalingEvidence:'Platform load test CAP-4',capacityAssumptions:'30% headroom; two recovery sites'});
assert.equal(complete.r.operative,'CO-MANAGED');
assert.equal(complete.r.eligibility,'Unresolved — specialist validation required.');
assert.equal(complete.r.approval,'Pending institutional approval.');
ctx.input={rto:'To confirm',rpo:'unknown',dependencies:'TBD'};vm.runInContext('Object.assign(state.application,input)',ctx);
assert.ok(recommend(base).outstanding.some(x=>x.detail.includes('RTO (hours) is missing')));
const sections=vm.runInContext('reportSections()',ctx);
const notice=vm.runInContext('assessmentNotice',ctx);
assert.equal(JSON.stringify(sections[0][1]),JSON.stringify(notice));
assert.ok(!/thesis|Tese_|§|B\.[2-7]/i.test(JSON.stringify(sections)));
const table=vm.runInContext('framework()',ctx);assert.ok(table.includes('<table'));assert.ok(table.includes('I6'));assert.ok(table.includes('elasticity heuristic'));
assert.ok(!/thesis|Tese_|§|B\.[2-7]|DR[1-8]/i.test(table));
assert.ok(!vm.runInContext('assessment()',ctx).includes('gate-security'));
console.log('Acceptance checks passed: persistent recovery/economic gaps, independent statuses, unresolved capability, AI intent/no authorization, explicit conflicts, confirmed AI absence and PDF/site consistency.');

// Status explanations use the actual unresolved conditions rather than one generic message.
function explanations(input){ctx.input=input;vm.runInContext('state.requirements=input',ctx);return vm.runInContext('({placement:statusExplanation("placement"),eligibility:statusExplanation("eligibility"),operating:statusExplanation("operating"),html:statusFields(recommendation())})',ctx);}
const missingLocation=explanations({...base,cloud:'unknown'});
assert.ok(missingLocation.placement.some(x=>x.includes('external cloud processing')));
assert.ok(missingLocation.html.includes('data-status-kind="placement"'));
assert.ok(missingLocation.html.includes('data-status-kind="eligibility"'));
assert.ok(!missingLocation.html.includes('data-status-kind="operating"'));
const noDifferentiator=explanations({...base,economics:'unknown',demand:'steady'});
assert.ok(noDifferentiator.placement.some(x=>x.includes('steady demand alone does not choose a location')));
const platformGap=explanations({...base,delivery:'modern',platform:'managed',local:'yes'});
assert.ok(platformGap.placement.some(x=>x.includes('supported local deployment')));
const missingSkills=explanations({...base,skills:'unknown',operatingEvidence:''});
assert.ok(missingSkills.operating.some(x=>x.includes('skills / coverage')));
assert.ok(missingSkills.html.includes('data-status-kind="operating"'));
const capabilityConflict=explanations({...base,skills:'limited',sourcing:'no'});
assert.ok(capabilityConflict.operating.some(x=>x.includes('internal capacity is insufficient')));
const suppliedAnswers=explanations({...base,recovery:'yes',aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none'});
assert.ok(suppliedAnswers.eligibility.some(x=>x.includes('Supplying every answer does not confirm eligibility')));
assert.ok(suppliedAnswers.eligibility.some(x=>x.includes('RTO')));
assert.ok(suppliedAnswers.eligibility.some(x=>x.includes('Data sensitivity and security controls')&&x.includes('Data and control sovereignty')&&x.includes('Recovery, dependencies and reversibility')));
assert.ok(suppliedAnswers.html.includes('aria-label="Why eligibility is unresolved"'));
assert.ok(suppliedAnswers.html.includes('type="button"'));
assert.ok(suppliedAnswers.html.includes('aria-expanded="false"'));
assert.ok(!suppliedAnswers.html.includes('data-status-kind="placement"'));
ctx.input={...base,cloud:'unknown',operatingEvidence:'<script>alert(1)</script>'};vm.runInContext('state.requirements=input',ctx);
assert.ok(!vm.runInContext('statusFields(recommendation())',ctx).includes('<script>'));
console.log('Status explanation checks passed: location inputs, selection evidence, platform mismatch, operating gaps/conflicts, independent eligibility validation and accessible controls.');

// Every unresolved reason has a link to a field or specialist review section that exists.
function resolutionCase(input,application={}){
 ctx.input=input;ctx.application=application;
 vm.runInContext('state.requirements=input;state.application=application',ctx);
 return vm.runInContext('({r:recommendation(),views:[profile(),assessment(),result()],items:["placement","eligibility","operating"].flatMap(kind=>statusExplanationItems(kind)),eligibility:statusExplanationItems("eligibility"),outstanding:outstandingHtml(recommendation())})',ctx);
}
const routeCases=[
 {...base,cloud:'unknown'},
 {...base,economics:'unknown',demand:'steady'},
 {...base,delivery:'modern',platform:'managed',local:'yes'},
 {...base,skills:'unknown',operatingEvidence:''},
 {...base,skills:'limited',sourcing:'no'},
 {...base,delivery:'saas',local:'yes'},
 {...base,hybrid:'yes',cloud:'no'},
 {...base,embeddedAI:'yes',aiData:'external',cloud:'no'},
 {...base,aiAuthority:'A4',aiData:'unknown'},
 {...base,recovery:'unknown',trustedRecovery:'undefined',aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none'},
 {...base,recovery:'yes',networkExposure:'internal',securityIsolation:'segmented',keyCustody:'institution',aiAuthority:'A3',aiData:'local'}
];
for(const input of routeCases){
 const test=resolutionCase(input,{financialCriticality:'noncritical',executionRestriction:'flexible',sovereigntyRestriction:'conditional',classification:'custom'});
 for(const item of [...test.items,...test.r.outstanding]){
  assert.ok(item.targets.length,'Fix destination for '+item.detail);
  for(const target of item.targets){
   assert.ok(test.views[target.step].includes('id="'+target.id+'"'),target.id+' exists in its destination view');
   ctx.target=target;
   const html=vm.runInContext('resolutionLinks([target])',ctx);
   assert.ok(html.includes('href="#'+target.id+'"'));
   assert.ok(html.includes('data-requirement-step="'+target.step+'"'));
  }
 }
 assert.ok(test.eligibility[0].targets.some(t=>t.id==='specialist-validation'));
 assert.ok(test.outstanding.includes('requirement-resolution-link'));
}
const recoveryLinks=resolutionCase({...base,recovery:'unknown'});
assert.deepEqual(Array.from(recoveryLinks.r.outstanding.find(x=>x.detail.startsWith('RTO ')).targets,x=>x.id),['application-rto']);
assert.deepEqual(Array.from(recoveryLinks.r.outstanding.find(x=>x.detail.startsWith('Comparable lifecycle costs')).targets,x=>x.id),['evidence-costEvidence']);
const missingProfileLinks=resolutionCase(base);
assert.ok(missingProfileLinks.items.some(x=>x.targets.some(t=>t.id==='profile-executionRestriction')));
console.log('Resolution-link checks passed: every unresolved reason links to an existing profile field, assessment question, evidence field or specialist-validation section.');

// Units are visible beyond placeholder examples, in labels, guidance, links and reports.
ctx.application={financialCriticality:'critical',executionRestriction:'flexible',sovereigntyRestriction:'conditional',rto:'2',rpo:'15'};ctx.input={...base,embeddedAI:'yes',aiAuthority:'A4',aiData:'local'};
vm.runInContext('state.application=application;state.requirements=input',ctx);
const recoveryProfile=vm.runInContext('profile()',ctx);
assert.ok(recoveryProfile.includes('<label for="application-rto">RTO — time to restore (hours)'));
assert.ok(recoveryProfile.includes('<label for="application-rpo">RPO — acceptable data-loss window (minutes)'));
assert.ok(recoveryProfile.includes('Enter the target in hours'));
assert.ok(recoveryProfile.includes('Enter the target in minutes'));
const recoveryReport=vm.runInContext('reportSections()',ctx).find(([heading])=>heading==='Solution profile')[1];
assert.ok(recoveryReport.some(item=>item.question==='RTO — time to restore (hours)'&&item.answer==='2'));
assert.ok(recoveryReport.some(item=>item.question==='RPO — acceptable data-loss window (minutes)'&&item.answer==='15'));
const publicContent=vm.runInContext('JSON.stringify([profile(),assessment(),result(),framework(),statusExplanation("eligibility"),reportSections()])',ctx);
assert.ok(!/thesis|Tese_|§|B\.[2-7]|\bRR[1-6]\b|\bAI[1-9][0-9]?\b/i.test(publicContent));
console.log('Content checks passed: explicit RTO hours and RPO minutes in profile/report; thesis citations and criterion references removed without dropping validation requirements.');
