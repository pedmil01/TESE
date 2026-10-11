const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({fetch:()=>new Promise(()=>{})});
for(const file of ['decision-context.js','app.js','report.js'])vm.runInContext(fs.readFileSync('studio/'+file,'utf8'),ctx);
vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),ctx);
const run=code=>vm.runInContext(code,ctx);
run("state.application={financialCriticality:'noncritical',executionRestriction:'flexible',sovereigntyRestriction:'conditional'};state.requirements={criticality:'medium',delivery:'container',local:'no',cloud:'yes',hybrid:'no',proximity:'flexible',hardware:'standard',economics:'local',demand:'steady',control:'shared',skills:'partial',sourcing:'yes'}");
const technical=run('recommendation().id');assert.equal(technical,'ONPREM-CAAS');
assert.equal(run('questions.length'),22);assert.match(run('fundingReadiness().detail'),/has not been established/);
for(const status of ['approved','conditional','unfunded','existing','unknown']){
 ctx.status=status;run('state.requirements.fundingStatus=status');
 assert.equal(run('recommendation().id'),technical,'Funding must not silently choose cloud or override mandatory placement');
 const html=run('proposal()');assert.ok(html.includes(run('fundingReadiness().label')));
 for(const field of ['fundingStatus','upfrontBudget','recurringBudget','procurementConstraints','fundingPlan'])assert.ok(html.includes('evidence-'+field));
}
run("state.requirements.fundingStatus='unfunded'");assert.match(run('fundingReadiness().detail'),/not ready for purchase or deployment/);
run("state.requirements.fundingStatus='conditional'");assert.match(run('fundingReadiness().detail'),/partial or awaiting approval/);
run("state.requirements.fundingStatus='approved'");assert.match(run('fundingReadiness().detail'),/does not authorize/);
const html=run('assessment()');assert.ok(html.includes('Funding and procurement'));
for(const key of ['fundingStatus','upfrontBudget','recurringBudget','procurementConstraints','fundingPlan']){
 assert.ok(html.includes('id="evidence-'+key+'"'));assert.ok(html.includes('id="example-'+key+'"'));
}
let section=run("reportSections().find(([title])=>title==='Funding and procurement')[1]");
assert.ok(!section.some(x=>x.question==='What must be purchased upfront, and what budget is available?'),'Blank text is omitted');
run("state.requirements.upfrontBudget='Capital budget EUR 80,000; estimate EUR 120,000; Finance owner to confirm the gap';state.requirements.recurringBudget='Support and subscriptions EUR 3,000/month; renewal budget pending';state.requirements.procurementConstraints='Tender required; six-month lead time';state.requirements.fundingPlan='Finance and procurement to confirm by review date'");
section=run("reportSections().find(([title])=>title==='Funding and procurement')[1]");
assert.ok(section.some(x=>x.answer==='Funding confirmed for the assessed scope and period'));
for(const key of ['upfrontBudget','recurringBudget','procurementConstraints','fundingPlan'])assert.ok(section.some(x=>x.answer===run('state.requirements.'+key)));
run("state.requirements.upfrontBudget=''");section=run("reportSections().find(([title])=>title==='Funding and procurement')[1]");assert.ok(!section.some(x=>x.question==='What must be purchased upfront, and what budget is available?'));
const catalog=JSON.parse(fs.readFileSync('lib/ai-intake-catalog.json','utf8'));
for(const key of ['fundingStatus','upfrontBudget','recurringBudget','procurementConstraints','fundingPlan'])assert.ok(catalog.find(f=>f.field==='requirements.'+key));
assert.equal(catalog.find(f=>f.field==='requirements.fundingStatus').options.unfunded,'Required purchases or service payments cannot currently be funded');
console.log('Funding checks passed: affordability is separate from placement; funding blockers and evidence links are visible; PDF preserves entered text and omits cleared fields; AI auto-fill includes funding and procurement.');
