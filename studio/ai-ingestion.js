const intakeMime={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',txt:'text/plain',md:'text/markdown',csv:'text/csv',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
let intakeInquiry='',intakeFiles=[],intakeBusy=false,intakeError='',intakeResult=null,intakeRecords=[],intakeFilled={},intakePending=null,intakePopup=null;
function intakeDefinition(field){
 const [section,key,...extra]=String(field).split('.');if(extra.length)return null;
 if(section==='application'){
  if(Object.hasOwn(profileOptions,key))return {section,key,...profileOptions[key]};
  if(['id','name','owner','classificationNotes','capability','rto','rpo','jurisdiction','latency','dependencies','needs'].includes(key))return {section,key,label:profileTarget(key).label.replace(/^Review /,'')};
 }
 if(section==='requirements'){const q=questions.find(q=>q.key===key)||evidenceFields.find(q=>q.key===key);if(q)return {section,...q};}
 if(section==='decision'&&Object.hasOwn(decisionHints,key))return {section,key,label:key};
 return null;
}
function intakeTarget(field){const d=intakeDefinition(field);if(!d)return null;return d.section==='application'?profileTarget(d.key):d.section==='decision'?{step:2,id:'decision-'+d.key,label:'Review '+d.label}:questions.some(q=>q.key===d.key)?assessmentTarget(d.key):evidenceTarget(d.key);}
function focusIntakeField(field){const target=intakeTarget(field);if(target)jumpToRequirement(target.step,target.id);}
function intakeValue(field){const d=intakeDefinition(field);return d?state[d.section][d.key]:undefined;}
function intakeCanFill(field){return field==='application.needs'?!hasUserSizingInformation():!String(intakeValue(field)||'').trim()||['unknown','undefined'].includes(intakeValue(field));}
function intakeAlias(field){return {'application.criticality':'requirements.criticality','requirements.criticality':'application.criticality','application.demandProfile':'requirements.demand','requirements.demand':'application.demandProfile','application.hardwareNeed':'requirements.hardware','requirements.hardware':'application.hardwareNeed'}[field];}
function aiIngestionCard(){
 const review=intakeResult?`<div class="notice warning"><strong>Check every AI-filled answer before using the proposal.</strong> Auto-fill was performed by ${esc(intakeResult.model)} and may contain mistakes. Missing information has not been invented.</div><p>${esc(intakeResult.summary)}</p>${intakeResult.warnings.length?`<ul class="intake-warnings">${intakeResult.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:''}<details class="intake-review"><summary>${intakeRecords.filter(r=>r.applied).length} suggestions applied · ${intakeRecords.filter(r=>!r.applied).length} skipped — review sources and answers</summary><ul>${intakeRecords.map(r=>{const d=intakeDefinition(r.field),changed=r.applied&&intakeValue(r.field)!==r.value;return `<li><strong>${esc(d.label)}</strong><span class="meta">${changed?'Edited after auto-fill':r.applied?'AI-filled — check this answer':esc(r.reason)}</span><p>${esc(d.options?.find(([v])=>v===r.value)?.[1]||r.value)}</p><p class="meta">Source: ${esc(r.evidence)}</p>${r.applied?`<button class="secondary" onclick="focusIntakeField('${r.field}')">Review answer</button>`:''}</li>`;}).join('')}</ul></details>`:'';
 return `<section class="card ai-ingestion-card" id="ai-ingestion-card" aria-labelledby="intake-title"><span class="eyebrow">DOCUMENT ASSISTANCE</span><h2 id="intake-title">AI auto-fill from a solution inquiry</h2><div class="notice warning"><strong>Do not upload confidential, restricted, personal or other sensitive information.</strong> Documents and inquiry text are sent to OpenAI, an external AI provider. Use only information approved for external AI processing.</div><div class="notice"><strong>Auto-fill is performed by an OpenAI GPT model and can make mistakes.</strong> Check all answers against the source before using the assessment. The AI fills blank or unconfirmed fields and preserves existing answers. Documents are not added to the site’s history.</div><div class="fields"><div class="field text-entry-field"><label for="intake-documents">Documents (optional)</label><div class="field-hint" id="intake-documents-help">Upload up to three documents, 5 MB in total: PDF, DOC/DOCX, TXT, MD, CSV or XLS/XLSX. For images or charts in Word or Excel, use PDF. Spreadsheets are read up to the first 1,000 rows per sheet.</div><div class="field-example" id="intake-documents-example">Example: An approved solution requirements document and a vendor sizing sheet with sensitive information removed.</div><input id="intake-documents" type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx" aria-describedby="intake-documents-help intake-documents-example" onchange="chooseIntakeFiles(this.files)" ${intakeBusy?'disabled':''}><p class="meta">${intakeFiles.length?intakeFiles.map(f=>esc(f.name)).join(' · '):'No documents selected.'}</p>${intakeFiles.length?'<button class="secondary" type="button" onclick="clearIntakeFiles()">Remove selected documents</button>':''}</div><div class="field text-entry-field"><label for="intake-inquiry">Solution inquiry or additional context (optional)</label><div class="field-hint" id="intake-inquiry-help">Paste the approved inquiry, requirements or clarifications. You can use text alone or add context for the documents. Maximum 20,000 characters.</div><div class="field-example" id="intake-inquiry-example">Example: The solution is supplied as containers, serves 500 users and must recover within 2 hours. Include the evidence you have; leave unknown requirements unconfirmed.</div><textarea id="intake-inquiry" maxlength="20000" aria-describedby="intake-inquiry-help intake-inquiry-example" oninput="intakeInquiry=this.value" ${intakeBusy?'disabled':''}>${esc(intakeInquiry)}</textarea></div></div><div class="actions"><button class="primary" id="intake-submit" type="button" onclick="generateAiAutofill()" ${intakeBusy?'disabled':''}>${intakeBusy?'AI is reading and filling answers…':'Send to OpenAI and auto-fill answers'}</button></div><p class="meta" role="status" aria-live="polite">${esc(intakeError||(intakeBusy?'Reading the inquiry. Keep this page open.':intakeResult?'Auto-fill complete. Review all answers, including skipped and unresolved requirements.':'No information is sent until you select “Send to OpenAI and auto-fill answers”.'))}</p>${review}</section>`;
}
function refreshIntakePanel(){const panel=document.getElementById('ai-ingestion-card');if(panel){panel.outerHTML=aiIngestionCard();enhanceAcronyms(document.getElementById('ai-ingestion-card'));}}
function chooseIntakeFiles(files){
 const selected=Array.from(files||[]);intakeError='';
 if(selected.length>3||selected.reduce((sum,f)=>sum+f.size,0)>5*1024*1024)intakeError='Choose up to three documents, no larger than 5 MB in total.';
 else if(selected.some(f=>!intakeMime[f.name.split('.').pop().toLowerCase()]))intakeError='Use PDF, DOC/DOCX, TXT, MD, CSV or XLS/XLSX documents.';
 else intakeFiles=selected;
 refreshIntakePanel();
}
function clearIntakeFiles(){if(intakeBusy)return;intakeFiles=[];intakeError='';refreshIntakePanel();}
function intakeReadFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('The document could not be read.'));reader.onload=()=>{const data=String(reader.result),base64=data.slice(data.indexOf(',')+1),ext=file.name.split('.').pop().toLowerCase();resolve({name:file.name,data:'data:'+intakeMime[ext]+';base64,'+base64});};reader.readAsDataURL(file);});}
async function intakeRequest(payload){
 const response=await fetch('/api/ai-ingestion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(120000)});
 let data;try{data=await response.json();}catch{throw Error('Sign in to the protected Workload Placement Studio, then try again.');}
 if(!response.ok)throw Error(data.error||'Document AI auto-fill is unavailable.');return data;
}
function applyIntakeResult(result){
 if(typeof result?.summary!=='string'||!Array.isArray(result.fields)||result.fields.length>62||!Array.isArray(result.warnings)||result.warnings.some(w=>typeof w!=='string')||typeof result.model!=='string')throw Error('The AI service returned an invalid extraction.');
 const seen=new Map();
 for(const item of result.fields){const d=intakeDefinition(item?.field);if(!d||seen.has(item.field)||typeof item.value!=='string'||!item.value.trim()||item.value.length>4000||typeof item.evidence!=='string'||!item.evidence.trim()||item.evidence.length>1000||d.options&&!d.options.some(([v])=>v===item.value))throw Error('The AI service returned an invalid answer.');seen.set(item.field,item);}
 const records=[],filledThisRun=new Set();
 const entries=[...result.fields.filter(i=>!['requirements.aiAuthority','requirements.aiData','requirements.aiFlowDetails'].includes(i.field)),...result.fields.filter(i=>['requirements.aiAuthority','requirements.aiData','requirements.aiFlowDetails'].includes(i.field))];
 for(const item of entries){
  const d=intakeDefinition(item.field),alias=intakeAlias(item.field);
  if(filledThisRun.has(item.field)&&intakeValue(item.field)===item.value){records.push({...item,applied:true});continue;}
  let reason='';
  if(['unknown','undefined'].includes(item.value))reason='No confirmed answer was extracted';
  else if(alias&&seen.has(alias)&&seen.get(alias).value!==item.value)reason='Conflicting profile and assessment suggestions — confirm manually';
  else if(d.section==='requirements'&&['aiAuthority','aiData','aiFlowDetails'].includes(d.key)&&!questionApplies({key:d.key==='aiFlowDetails'?'aiData':d.key}))reason='Not applicable to the retained AI answers';
  else if(!intakeCanFill(item.field)||alias&&!intakeCanFill(alias)&&intakeValue(alias)!==item.value)reason='Existing answer preserved';
  if(reason){records.push({...item,applied:false,reason});continue;}
  state[d.section][d.key]=item.value;
  if(item.field==='application.needs')needsEdited=true;
  intakeFilled[item.field]={...item,model:result.model};filledThisRun.add(item.field);
  if(alias&&intakeCanFill(alias)){const a=intakeDefinition(alias);state[a.section][a.key]=item.value;intakeFilled[alias]={...item,field:alias,model:result.model};filledThisRun.add(alias);}
  records.push({...item,applied:true});
 }
 for(const key of ['aiAuthority','aiData'])if(!questionApplies({key}))delete state.requirements[key];
 syncSuggestedNeeds();intakeRecords=records;intakeResult=result;aiAnalysis=null;aiError='';
 if(step>1)step=0;render();return records;
}
function markAiFilledFields(){
 for(const note of document.querySelectorAll('[data-ai-filled-note]')){const control=note.nextElementSibling;if(control)control.setAttribute('aria-describedby',(control.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&!id.startsWith('ai-filled-')).join(' '));note.remove();}
 for(const [field,item]of Object.entries(intakeFilled)){
  if(intakeValue(field)!==item.value)continue;
  const target=intakeTarget(field),control=document.getElementById(target?.id);if(!control)continue;
  const id='ai-filled-'+field.replace('.','-'),note=document.createElement('span');note.id=id;note.dataset.aiFilledNote='';note.className='ai-filled-note';note.textContent='AI auto-filled — check this answer. Source: '+item.evidence;control.insertAdjacentElement('beforebegin',note);
  const described=(control.getAttribute('aria-describedby')||'').split(/\s+/).filter(x=>x&&!x.startsWith('ai-filled-'));control.setAttribute('aria-describedby',[...described,id].join(' '));
 }
}
async function generateAiAutofill(){
 if(intakeBusy)return;
 if(!intakeInquiry.trim()&&!intakeFiles.length){intakeError='Upload a document or paste the solution inquiry first.';refreshIntakePanel();return;}
 intakeBusy=true;intakeError='';
 if(location.origin!==aiServiceOrigin){
  intakePopup=window.open(aiServiceOrigin+'/studio/index.html?v=20261011-intake#ai-ingest-bridge','wps-ai-ingestion','width=1080,height=850');
  if(!intakePopup){intakeBusy=false;intakeError='Allow the protected AI window to open, then try again.';refreshIntakePanel();return;}
 }
 refreshIntakePanel();
 try{
  const payload={inquiry:intakeInquiry,files:await Promise.all(intakeFiles.map(intakeReadFile))};
  if(location.origin!==aiServiceOrigin){
   const id=crypto.randomUUID();intakePending={id,payload,timer:setTimeout(()=>{if(intakePending?.id!==id)return;intakePending=null;intakeBusy=false;intakeError='The protected AI window did not respond. Sign in there and try again.';refreshIntakePanel();},180000)};return;
  }
  applyIntakeResult(await intakeRequest(payload));
 }catch(error){intakeError=error.name==='TimeoutError'?'The AI document request timed out. Try fewer documents or paste the text.':error.message;}
 finally{if(!intakePending){intakeBusy=false;refreshIntakePanel();}}
}
window.addEventListener('message',async event=>{
 if(event.origin===aiServiceOrigin&&event.source===intakePopup&&intakePending){
  if(event.data?.type==='wps-intake-ready'){if(!intakePending.sent){intakePending.sent=true;intakePopup.postMessage({type:'wps-intake-request',id:intakePending.id,payload:intakePending.payload},aiServiceOrigin);}return;}
  if(event.data?.type!=='wps-intake-result'||event.data.id!==intakePending.id)return;
  clearTimeout(intakePending.timer);
  try{if(event.data.error)throw Error(event.data.error);applyIntakeResult(event.data.result);}catch(error){intakeError=error.message;}
  intakePending=null;intakeBusy=false;refreshIntakePanel();return;
 }
 if(location.origin!==aiServiceOrigin||location.hash!=='#ai-ingest-bridge'||event.origin!==aiGithubOrigin||event.source!==window.opener||event.data?.type!=='wps-intake-request'||intakeBusy)return;
 const id=event.data.id;if(typeof id!=='string'||id.length>100)return;
 intakeBusy=true;intakeError='Reading documents from your GitHub Pages assessment…';refreshIntakePanel();
 try{const result=await intakeRequest(event.data.payload);window.opener.postMessage({type:'wps-intake-result',id,result},aiGithubOrigin);intakeError='AI suggestions returned to your original assessment. Check all answers there.';}
 catch(error){intakeError=error.message;window.opener?.postMessage({type:'wps-intake-result',id,error:error.message},aiGithubOrigin);}
 finally{intakeBusy=false;refreshIntakePanel();}
});
document.addEventListener('input',()=>markAiFilledFields());
document.addEventListener('change',()=>markAiFilledFields());
function aiIntakeReportSection(){
 const fields=Object.entries(intakeFilled).filter(([field,item])=>intakeValue(field)===item.value);
 return fields.length?['AI auto-fill disclosure',[fields.length+' answers were auto-filled using OpenAI ('+[...new Set(fields.map(([,item])=>item.model))].join(', ')+').','AI extraction can make mistakes. All answers must be checked against the source documents and validated by the relevant specialists before use. AI auto-fill does not establish eligibility or grant institutional approval.']]:null;
}
if(location.origin===aiServiceOrigin&&location.hash==='#ai-ingest-bridge'&&window.opener){
 const ready=setInterval(()=>window.opener?.postMessage({type:'wps-intake-ready'},aiGithubOrigin),500);
 setTimeout(()=>clearInterval(ready),60000);
}
