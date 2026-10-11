const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({fetch:()=>new Promise(()=>{})});
for(const file of ['decision-context.js','app.js','report.js'])vm.runInContext(fs.readFileSync('studio/'+file,'utf8'),ctx);
vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),ctx);
vm.runInContext("state.application={financialCriticality:'noncritical',executionRestriction:'flexible',sovereigntyRestriction:'conditional'}",ctx);
const base={delivery:'container',criticality:'medium',local:'no',cloud:'yes',hybrid:'no',proximity:'flexible',hardware:'standard',platform:'self',economics:'cloud',demand:'steady',control:'shared',skills:'partial',sourcing:'yes'};
const plan={exitStatus:'documented',exitData:'Full independent export of records, metadata, configuration and required key access; integrity reconciled',exitRecovery:'Portable encrypted backups and restore into a supported alternate runtime; exercise scheduled',exitDestination:'Approved alternate provider with capacity and controls; 8-hour cutover and 15-minute data-loss target',exitTerms:'Export and assistance rights, egress budget, notice and deletion obligations; service and procurement owners'};
const run=code=>vm.runInContext(code,ctx);
function check(values){ctx.input={...base,...values};return run('state.requirements=input;recommendation()');}
let r=check({});assert.equal(r.id,null);assert.equal(r.status,'UNRESOLVED');assert.equal(r.cloudExit.required,true);assert.equal(r.cloudExit.missing.length,5);
for(const key of ['exitStatus','exitData','exitRecovery','exitDestination','exitTerms']){
 const detail=r.cloudExit.missing.find(f=>f.key===key).label;
 ctx.detail=detail;assert.equal(run("requirementTargets('Placement inputs',detail)[0].id"),'evidence-'+key);
}
r=check({...plan,exitStatus:'blocked'});assert.equal(r.id,null);assert.equal(r.status,'REQUIREMENTS CONFLICT');
const conflict=r.conflictDetails.find(x=>x.title==='Cloud arrangement vs impossible provider exit');assert.ok(conflict);assert.ok(conflict.answers.some(x=>x.answer.includes('No feasible exit')));assert.ok(conflict.targets.some(t=>t.id==='evidence-exitRecovery'));
r=check(plan);assert.equal(r.id,'CLOUD-CAAS');assert.match(r.cloudExit.label,/demonstration required/);assert.ok(r.outstanding.some(x=>x.category==='Cloud exit and reversibility'&&x.detail.startsWith('Demonstrate')));
for(const key of ['exitData','exitRecovery','exitDestination','exitTerms']){
 r=check({...plan,[key]:''});assert.equal(r.id,null,key+' is necessary for feasible cloud exit');assert.equal(r.status,'UNRESOLVED');
}
r=check({...plan,exitStatus:'tested'});assert.equal(r.id,'CLOUD-CAAS');assert.match(r.cloudExit.detail,/do not independently verify/);
for(const values of [{delivery:'saas'},{hybrid:'yes'},{delivery:'package',platform:'self'},{delivery:'modern',platform:'managed'}]){
 r=check({...values,exitStatus:'blocked'});assert.equal(r.id,null);assert.equal(r.status,'REQUIREMENTS CONFLICT');
}
for(const values of [{cloud:'no'},{local:'yes'},{economics:'local'}]){r=check({...values,exitStatus:'blocked'});assert.equal(r.id,'ONPREM-CAAS');assert.equal(r.cloudExit.required,false);assert.equal(r.placementConflicts.length,0);}
check({...plan,exitStatus:'blocked'});const html=run('assessment()');
for(const key of Object.keys(plan))assert.ok(html.includes('id="evidence-'+key+'"'));
assert.ok(html.includes('Cloud exit and data recovery'));assert.match(run('proposal()'),/Cloud arrangement vs impossible provider exit/);
let items=run("reportSections().find(([title])=>title==='Cloud exit and data recovery')[1]");assert.ok(items.some(x=>x.answer===plan.exitData));assert.ok(items.some(x=>x.answer?.includes('No feasible exit')));
check({});items=run("reportSections().find(([title])=>title==='Cloud exit and data recovery')[1]");assert.ok(!items.some(x=>x.question==='How will all required data and configuration be retrieved?'));
const catalog=JSON.parse(fs.readFileSync('lib/ai-intake-catalog.json','utf8'));
for(const key of Object.keys(plan))assert.ok(catalog.find(f=>f.field==='requirements.'+key));
assert.ok(catalog.find(f=>f.field==='requirements.exitStatus').options.tested);
console.log('Cloud exit checks passed: blocked / unknown / incomplete plans withhold cloud and hybrid; documented / tested plans require validation; local placement is independent; diagnostics link exact evidence, PDF omits blank text and AI ingestion includes the exit plan.');
