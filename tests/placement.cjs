const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({fetch:()=>new Promise(()=>{})});
vm.runInContext(fs.readFileSync('studio/decision-context.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('studio/app.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('studio/report.js','utf8'),ctx);
vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),ctx);
function recommend(overrides){ctx.input=overrides;return vm.runInContext('recommendation(input)',ctx)}
vm.runInContext("state.application={financialCriticality:'noncritical',executionRestriction:'flexible',sovereigntyRestriction:'conditional'}",ctx);
const base={exitStatus:'documented',exitData:'Complete export and independent access to records, attachments, metadata, configuration and required keys documented in EXIT-1',exitRecovery:'Portable backups restore to a supported alternative runtime; demonstration scheduled with the service owner',exitDestination:'Approved alternative environment with capacity, controls and dependency recovery order; cutover and data-loss targets documented',exitTerms:'Contract export rights, transition assistance and costs recorded; service and procurement owners maintain the plan',criticality:'medium',delivery:'container',local:'no',cloud:'yes',hybrid:'no',proximity:'flexible',hardware:'standard',platform:'self',economics:'cloud',demand:'steady',control:'shared',skills:'partial',sourcing:'yes',operatingEvidence:'Operating scope: platform team, 24/7 coverage, lifecycle and recovery ownership'};
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
ctx.input={delivery:'saas'};const html=vm.runInContext('state.requirements=input;proposal()',ctx);assert.ok(html.includes('Outstanding requirements'));assert.ok(html.includes('Placement')&&html.includes('Unresolved'));
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
assert.ok(recommend({...base,embeddedAI:'yes',aiAuthority:'A3',aiData:'local'}).checks.some(x=>x.includes('A3 —')));
assert.ok(recommend({...base,embeddedAI:'yes',aiAuthority:'A4',aiData:'local'}).checks.some(x=>x.includes('A4 —')));
assert.ok(recommend({...base,embeddedAI:'yes',aiAuthority:'A2',aiData:'local'}).checks.some(x=>x.includes('no-production-write')));
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
assert.deepEqual(Array.from(vm.runInContext('decisionStatuses(recommendation())',ctx),row=>row[0]),['Placement','Proposed Operating model']);
assert.ok(!recoveryCase.html.includes('<dt>Eligibility</dt>')&&!recoveryCase.html.includes('<dt>Approval</dt>'));
const decisionSummary=recoveryCase.sections.find(([heading])=>heading==='Decision summary')[1];
assert.ok(!decisionSummary.some(line=>/^(Eligibility|Approval):/.test(line)));
assert.equal(recoveryCase.r.id,'CLOUD-CAAS');
assert.equal(recoveryCase.r.operative,null);
assert.ok(recoveryCase.r.outstanding.some(x=>x.category==='Recovery'&&/not defined/.test(x.detail)));
for(const text of ['Placement','Proposed Operating model','Cloud candidate suggested by elasticity; economic suitability remains unassessed.','Recovery']){
 assert.ok(recoveryCase.html.replace(/<span class="status-help-icon"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'').includes(text),text+' visible beside candidate');
 assert.ok(recoveryCase.result.replace(/<span class="status-help-icon"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'').includes(text),text+' visible on recommendation');
 assert.ok(JSON.stringify(recoveryCase.sections).includes(text),text+' visible in PDF sections');
}
for(const text of ['Comparable lifecycle costs','assessment period','Baseline demand','Peak demand','Scaling capability','Capacity assumptions'])assert.ok(recoveryCase.html.includes(text));
for(const key of ['control','skills','sourcing'])assert.equal(recommend({...base,[key]:'unknown'}).operative,null);
assert.equal(recommend({...base,operatingEvidence:''}).operative,'CO-MANAGED','Optional supporting evidence must not suppress a proposal supported by the operating answers');
assert.equal(recommend({...base,delivery:'saas',skills:'unknown'}).operative,null);
for(const authority of ['A3','A4']){
 const test=renderCase({...base,embeddedAI:'yes',aiAuthority:authority,aiData:'local'});
 assert.equal(test.r.intendedAiAuthority,authority);
 assert.equal(test.r.eligibility,'Unresolved — specialist validation required.');
 assert.equal(test.r.approval,'Pending institutional approval.');
 assert.ok(test.html.includes('Recorded intent does not authorize execution'));
 assert.ok(test.r.checks.some(x=>x.startsWith(authority+' —')));
 assert.ok(test.r.outstanding.some(x=>x.category==='AI authority and data flows'));
 assert.ok(test.sections.find(([heading])=>heading==='Recommendation basis')[1].some(item=>item.question==='Intended AI authority'&&item.answer.startsWith(authority))); 
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
for(const key of ['aiInfrastructure','embeddedAI']){
 const test=renderCase({...base,aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none',[key]:'unknown'});
 assert.ok(test.r.aiStatus.startsWith('Unresolved'));assert.ok(test.r.outstanding.some(x=>x.category==='AI authority and data flows'));
 assert.ok(!vm.runInContext("questionApplies({key:'aiData'})",ctx),'Processing location waits until AI involvement is established');
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
assert.ok(!missingLocation.html.includes('data-status-kind="eligibility"'));
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
assert.ok(!suppliedAnswers.html.includes('aria-label="Why eligibility is unresolved"'));
assert.ok(missingLocation.html.includes('type="button"'));
assert.ok(missingLocation.html.includes('aria-expanded="false"'));
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
 {...base,embeddedAI:'yes',aiAuthority:'A4',aiData:'unknown'},
 {...base,recovery:'unknown',trustedRecovery:'undefined',aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none'},
 {...base,recovery:'yes',networkExposure:'internal',securityIsolation:'segmented',keyCustody:'institution',embeddedAI:'yes',aiAuthority:'A3',aiData:'local'}
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

// The final three unanswered requirements are named, linked and updated live.
const allRequirements={...base,recovery:'yes',networkExposure:'internal',securityIsolation:'segmented',keyCustody:'institution',trustedRecovery:'both',aiInfrastructure:'inference',embeddedAI:'none',aiAuthority:'none',aiData:'local'};
const lastKeys=['cloud','skills','recovery','aiData'];
function remainingCase(count){
 ctx.input={...allRequirements,...Object.fromEntries(lastKeys.slice(0,count).map((key,i)=>[key,i?'unknown':'']))};
 vm.runInContext('state.requirements=input',ctx);
 return vm.runInContext('({progress:assessmentProgress(),notice:remainingRequirementsHtml(),assessment:assessment(),report:result()})',ctx);
}
assert.equal(remainingCase(4).notice,'');
for(const count of [3,2,1]){
 const test=remainingCase(count);
 assert.equal(test.progress.total,22);assert.equal(test.progress.characterized,22-count);
 assert.equal(test.progress.missing.length,count);
 assert.ok(test.notice.includes('Only '+count+' of 22 requirements still need confirmation'));
 assert.ok(test.assessment.includes('id="remaining-requirements-notice"')&&test.assessment.includes('aria-live="polite"'));
 assert.ok(test.report.includes(test.notice));
 for(const key of lastKeys.slice(0,count)){
  assert.ok(test.notice.includes('href="#q-'+key+'"'));
  assert.ok(test.notice.includes('data-requirement-step="1"'));
  assert.ok(test.assessment.includes('id="q-'+key+'"'));
 }
}
const finished=remainingCase(0);
assert.ok(finished.notice.includes('All 22 assessment requirements are characterized'));
assert.ok(finished.notice.includes('specialist validation and institutional approval'));
assert.ok(finished.report.includes('PDF reports are not saved in history'));
assert.ok(finished.report.includes('Download this report now to keep a copy.'));
assert.ok(finished.report.includes('If you leave or reload this session without downloading it, this report will not be available later.'));
assert.ok(finished.report.includes('aria-describedby="pdf-report-history-warning"'));
ctx.input={...allRequirements,aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none',aiData:'unknown'};
vm.runInContext('state.requirements=input',ctx);
assert.equal(vm.runInContext('assessmentProgress().characterized',ctx),22);
assert.equal(vm.runInContext('assessmentProgress().missing.length',ctx),0);
const progressNodes={'live-proposal-content':{innerHTML:''},'remaining-requirements-notice':{innerHTML:''},progress:{textContent:''}};
ctx.document={getElementById:id=>progressNodes[id]||null};ctx.hideStatusTip=()=>{};ctx.enhanceAcronyms=()=>{};
remainingCase(4);vm.runInContext("step=1;answer('cloud','yes')",ctx);
assert.ok(progressNodes['remaining-requirements-notice'].innerHTML.includes('Only 3 of 22'));
assert.equal(progressNodes.progress.textContent,19);
vm.runInContext("answer('skills','partial')",ctx);
assert.ok(progressNodes['remaining-requirements-notice'].innerHTML.includes('Only 2 of 22'));
assert.ok(!progressNodes['remaining-requirements-notice'].innerHTML.includes('href="#q-skills"'));
assert.equal(progressNodes.progress.textContent,20);
vm.runInContext("answer('cloud','unknown');answer('hardware','unknown')",ctx);
assert.equal(progressNodes['remaining-requirements-notice'].innerHTML,'');
assert.equal(progressNodes.progress.textContent,18);
console.log('Completion notice checks passed: 4/3/2/1/0 thresholds, live counts, linked missing answers, AI applicability and PDF history warning.');

// Replay WL-001 from the supplied report: separate a real AI/location conflict from optional evidence.
const reported={...allRequirements,cloud:'no',proximity:'hard',platform:'private',economics:'similar',aiInfrastructure:'training',embeddedAI:'none',aiAuthority:'A0',aiData:'external',operatingEvidence:''};
ctx.application={id:'WL-001',name:'WL-001',owner:'DSI',financialCriticality:'noncritical',executionRestriction:'flexible',sovereigntyRestriction:'conditional'};
vm.runInContext('state.application=application',ctx);
const reportedCase=renderCase(reported);
assert.equal(reportedCase.r.id,null,'External AI must still conflict with the declared cloud prohibition');
assert.equal(reportedCase.r.operative,'CO-MANAGED','The known operating answers must remain useful despite a placement conflict');
assert.equal(reportedCase.r.conflictDetails.length,1);
const reportedConflict=reportedCase.r.conflictDetails[0];
assert.deepEqual(Array.from(reportedConflict.targets,t=>t.id),['q-aiData','q-cloud','q-proximity','q-aiInfrastructure']);
for(const key of ['aiData','cloud','proximity','aiInfrastructure']){
 assert.ok(reportedConflict.answers.some(answer=>answer.target.id==='q-'+key&&answer.answer!=='Not answered'));
 assert.ok(reportedCase.html.includes('href="#q-'+key+'"'));
}
for(const text of ['Q3.','Q5.','Q19.','Q22.','Selected:','Why:','How to resolve:','institution-hosted'])assert.ok(reportedCase.html.includes(text),text+' visible beside the conflict');
assert.ok(reportedCase.html.includes('data-status-state="conflict"'));
assert.ok(reportedCase.r.outstanding.some(item=>item.category==='Operating capability'),'Missing operating evidence remains visible for validation');
assert.ok(!reportedCase.html.includes('Operating model: Operating decision inputs need confirmation'));
const reportedPdf=reportedCase.sections.find(([heading])=>heading==='Confirmed requirement conflicts')[1];
for(const text of ['Q3.','Q5.','Q19.','Q22.','selected:','Why:','How to resolve:'])assert.ok(reportedPdf.some(line=>line.includes(text)),text+' in PDF conflict explanation');
assert.equal(reportedCase.sections[2][0],'Confirmed requirement conflicts','PDF conflict explanations immediately follow the decision summary');
const resolvedCase=renderCase({...reported,aiData:'local'});
assert.equal(resolvedCase.r.id,'ONPREM-CAAS','Institution-hosted AI removes the external-processing conflict');
assert.equal(resolvedCase.r.operative,'CO-MANAGED');
assert.equal(resolvedCase.r.conflictDetails.length,0);

// Unknown operating answers and genuine capability conflicts name only the fields responsible.
const missingOperating=renderCase({...base,skills:'unknown',operatingEvidence:''});
const missingOperatingDiagnostics=vm.runInContext('decisionDiagnostics("operating")',ctx);
assert.deepEqual(Array.from(missingOperatingDiagnostics[0].targets,t=>t.id),['q-skills']);
assert.ok(missingOperating.html.includes('Operating model: Operating decision inputs need confirmation'));
assert.ok(missingOperatingDiagnostics[0].answers[0].answer!=='Not answered','The unknown answer displays its questionnaire option label');
const incompatibleOperating=renderCase({...base,skills:'limited',sourcing:'no'});
assert.equal(vm.runInContext('decisionStatuses(recommendation())[1][1]',ctx),'Requirements conflict');
assert.deepEqual(Array.from(incompatibleOperating.r.conflictDetails[0].targets,t=>t.id),['q-skills','q-sourcing']);
assert.ok(incompatibleOperating.html.includes('Sourcing prohibition vs internal capability gap'));
for(const input of routeCases){
 const test=renderCase(input);
 assert.equal(test.r.conflictDetails.length,test.r.issues.length,'Every confirmed conflict has a structured explanation');
 for(const item of test.r.conflictDetails){
  assert.ok(item.answers.length>=2,'Conflicts identify the answers in opposition');
  assert.ok(item.action&&item.targets.length,'Each conflict has a corrective action and destinations');
 }
}
console.log('WL-001 diagnostic checks passed: exact conflicting answers/links, corrective actions, independent co-managed proposal, optional evidence gaps and matching PDF explanations.');
