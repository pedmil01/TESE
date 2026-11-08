const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({fetch:()=>new Promise(()=>{})});
for(const f of ['decision-context','app','report'])vm.runInContext(fs.readFileSync('studio/'+f+'.js','utf8'),c);
vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),c);
const profile={financialCriticality:'support',executionRestriction:'flexible',sovereigntyRestriction:'conditional'};
const base={delivery:'modern',platform:'managed',local:'no',cloud:'yes',hybrid:'no',proximity:'flexible',hardware:'standard',criticality:'medium',economics:'cloud',demand:'steady',control:'retain',skills:'strong',sourcing:'specialist',aiInfrastructure:'none',embeddedAI:'none',exitStatus:'unknown'};
function run(overrides={},p={}){c.input={...base,...overrides};c.profile={...profile,...p};return vm.runInContext('state.application=profile;state.requirements=input;({r:recommendation(),statuses:decisionStatuses(recommendation()),html:proposal(),report:reportSections(),diagnostics:decisionDiagnostics("placement")})',c);}
for(const economics of ['cloud','unknown','similar']){const t=run({economics});assert.equal(t.r.id,'CLOUD-PAAS');assert.equal(t.r.cloudExit.missing.length,5);assert.equal(t.r.status,'TECHNICAL PLACEMENT PROPOSAL');assert.equal(t.diagnostics.length,0);assert.ok(JSON.stringify(t.report).includes('Cloud exit pending'));}
for(const platform of ['managed','unknown']){const t=run({local:'yes',platform});assert.equal(t.r.placementName,'On-premises — platform to be confirmed');assert.equal(t.r.status,'TECHNICAL PLACEMENT PROPOSAL');assert.ok(t.html.includes('On-premises — platform to be confirmed'));assert.equal(t.diagnostics.length,0);assert.ok(t.r.outstanding.some(x=>x.targets.some(y=>y.id==='q-platform')));}
for(const economics of ['cloud','local','unknown'])assert.equal(run({platform:'private',economics}).r.id,'ONPREM-PRIVATE-CLOUD');
assert.equal(run({criticality:'unknown'},{financialCriticality:'unknown'}).r.id,'CLOUD-PAAS');
assert.equal(run({criticality:'unknown'},{financialCriticality:'unknown'}).r.outstanding.filter(x=>x.category==='Impact assessment').length,2);
const constrained=run({local:'yes',platform:'self',cloud:'unknown',proximity:'unknown',hardware:'unknown'},{executionRestriction:'unknown',sovereigntyRestriction:'unknown'});
assert.equal(constrained.r.id,'ONPREM-TRAD');
for(const key of ['delivery','cloud','hybrid','proximity','hardware'])assert.equal(run({[key]:'unknown'}).r.status,'UNRESOLVED',key);
assert.equal(run({embeddedAI:'yes',aiData:'unknown'}).r.status,'UNRESOLVED');
assert.equal(run({delivery:'ai',aiInfrastructure:'inference',aiData:'external',local:'yes'}).r.status,'REQUIREMENTS CONFLICT');
assert.equal(run({exitStatus:'blocked'}).r.status,'REQUIREMENTS CONFLICT');
assert.equal(run({delivery:'saas'}).r.status,'REQUIREMENTS CONFLICT');
for(const key of ['control','skills','sourcing'])assert.equal(run({[key]:'unknown'}).r.operative,null);
assert.equal(run({skills:'limited'}).r.operatingConflicts.length,1);
const external=run({platform:'private',aiInfrastructure:'inference',aiData:'external'});assert.equal(external.r.id,null);assert.equal(external.r.status,'UNRESOLVED');
console.log('Conditional placement: economics-independent exit handling, local location retention, supported private platform, impact gaps, essential unknowns, conflicts and report consistency passed.');
