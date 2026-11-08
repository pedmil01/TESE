const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({fetch:()=>new Promise(()=>{})});
for(const f of ['decision-context','app','report'])vm.runInContext(fs.readFileSync('studio/'+f+'.js','utf8'),c);
vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),c);
const profile={financialCriticality:'support',executionRestriction:'flexible',sovereigntyRestriction:'conditional'};
const base={delivery:'modern',platform:'managed',local:'no',cloud:'yes',hybrid:'no',proximity:'flexible',hardware:'standard',criticality:'medium',economics:'unknown',demand:'steady',control:'shared',skills:'strong',sourcing:'yes',recovery:'yes',networkExposure:'internal',securityIsolation:'segmented',keyCustody:'institution',trustedRecovery:'both',aiInfrastructure:'none',embeddedAI:'none',aiAuthority:'none',aiData:'unknown',exitStatus:'unknown'};
function run(patch={},p={}){c.input={...base,...patch};c.profile={...profile,...p};return vm.runInContext('state.application=profile;state.requirements=input;({r:recommendation(),s:decisionStatuses(recommendation()),report:reportSections(),html:proposal()})',c);}
const questions=vm.runInContext('questions.map(q=>({key:q.key,values:q.options.map(o=>o[0])}))',c);
let count=0;
for(const fixture of [{},{local:'yes',platform:'self'},{delivery:'container'},{delivery:'saas'},{delivery:'ai',aiInfrastructure:'inference',aiData:'external'}])for(const q of questions)for(const value of q.values){const t=run({...fixture,[q.key]:value});count++;for(const [label,status]of t.s){assert.notEqual(status,'Unresolved',JSON.stringify({fixture,key:q.key,value,label}));assert.ok(t.report.find(x=>x[0]==='Decision summary')[1].some(x=>x.question===label&&x.answer===status));}}
for(const control of ['retain','shared','delegate','unknown'])for(const skills of ['strong','partial','limited','unknown'])for(const sourcing of ['yes','specialist','no','unknown']){const t=run({control,skills,sourcing});count++;assert.notEqual(t.s[1][1],'Unresolved');}
assert.equal(run({sourcing:'unknown'}).r.operative,'INTERNAL');
assert.equal(run({sourcing:'no',control:'unknown'}).r.operative,'INTERNAL');
assert.equal(run({delivery:'saas',skills:'unknown'}).r.operative,'PROVIDER-OPERATED');
const exit=run({delivery:'saas',exitStatus:'blocked'});assert.equal(exit.s[0][1],'Requirements conflict');assert.equal(exit.r.operative,'PROVIDER-OPERATED');
const external=run({aiInfrastructure:'inference',aiData:'external',platform:'private'});assert.match(external.s[0][1],/^External processing/);assert.ok(external.r.outstanding.some(x=>x.category==='Platform compatibility'));
assert.equal(run({cloud:''}).s[0][1],'Unresolved');
assert.equal(run({control:''}).s[1][1],'Unresolved');
assert.equal(run({cloud:'no',delivery:'saas'}).s[0][1],'Requirements conflict');
assert.equal(run({control:'retain',skills:'limited'}).s[1][1],'Requirements conflict');
const pending=run({control:'unknown',skills:'unknown',sourcing:'unknown',cloud:'unknown'});assert.match(pending.s[0][1],/^Conditional assessment/);assert.match(pending.s[1][1],/^Conditional assessment/);assert.ok(pending.html.includes('data-status-kind="placement"'));assert.ok(pending.html.includes('data-status-kind="operating"'));assert.ok(pending.html.includes('q-cloud'));assert.ok(pending.html.includes('q-control'));
console.log(count+' completed-answer cases passed: no Unresolved status, matching PDF summaries, preserved supported conclusions and conflicts; blank inputs remain unresolved.');
