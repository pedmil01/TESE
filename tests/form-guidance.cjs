const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({fetch:()=>new Promise(()=>{}),document:{getElementById:()=>null}});
for(const file of ['decision-context.js','app.js','report.js'])vm.runInContext(fs.readFileSync('studio/'+file,'utf8'),ctx);
vm.runInContext('model='+fs.readFileSync('studio/model.json','utf8'),ctx);
vm.runInContext("state.requirements={embeddedAI:'yes',aiInfrastructure:'inference'}",ctx);
const before=vm.runInContext('JSON.stringify(state)',ctx);
const profileFields=vm.runInContext('Object.keys(profileOptions).map(key=>({key,example:profileExamples[key],html:optionField(key)}))',ctx);
const assessmentFields=vm.runInContext('questions.map(q=>({key:q.key,example:questionExamples[q.key],html:assessmentQuestionHtml(q)}))',ctx);
for(const [fields,idFor,hintFor]of [
 [profileFields,key=>`profile-${key}-example`,key=>`profile-${key}-hint`],
 [assessmentFields,key=>`example-${key}`,key=>`hint-${key}`]
])for(const {key,example,html}of fields){
 assert.ok(example&&example.length>30,`${key} has a useful, specific example`);
 assert.ok(html.includes(`class="field-example" id="${idFor(key)}"`),`${key} displays its example outside the answer control`);
 assert.ok(html.includes(`aria-describedby="${hintFor(key)} ${idFor(key)}"`),`${key} associates both explanation and example with the answer control`);
 assert.match(html,/class="field(?: line)? question-field"/);
 assert.ok(!/<select[^>]*>[\s\S]*Illustrative example:/.test(html),'Examples are guidance, not answer options');
}
assert.equal(vm.runInContext('JSON.stringify(state)',ctx),before,'Rendering guidance does not insert examples into assessment answers');
const profile=vm.runInContext('profile()',ctx),assessment=vm.runInContext('assessment()',ctx);
for(const [html,page]of [[profile,'profile'],[assessment,'assessment']]){
 for(const match of html.matchAll(/<(input|textarea)\b[^>]*id="([^"]+)"[^>]*>/g)){
  const [,tag,id]=match;
  assert.match(match[0],/aria-describedby="[^"]*example[^"]*"/,`${page} ${tag} ${id} has an associated visible example`);
 }
}
const report=vm.runInContext('JSON.stringify(reportSections())',ctx);
for(const {example}of [...profileFields,...assessmentFields])assert.ok(!report.includes(example),'Example prose cannot appear as a PDF answer');
console.log(`Form guidance passed: all ${profileFields.length} profile choices and ${assessmentFields.length} assessment questions have separate accessible examples; every free-text field has example guidance; examples stay out of answers and PDF sections.`);
