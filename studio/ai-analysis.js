const aiServiceOrigin='https://hybrid-placement-pedro.pedmil226190.chatgpt.site';
const aiGithubOrigin='https://pedmil01.github.io';
const aiDisclosure='This is AI analysis based on the assessment answers and analysis of the optional open-text explanations. It applies the assessment framework, reviews eligibility scope and supporting evidence, and remains advisory. Infrastructure specialists, solution owners and relevant subject-matter experts must validate it; final decisions require institutional approval.';
let aiAnalysis=null,aiBusy=false,aiError='',aiPending=null,aiPopup=null;
function aiSnapshot(){return JSON.stringify({application:state.application,requirements:activeRequirements(),decision:state.decision,sizingUserEdited:needsEdited});}
function aiCurrent(){return !!aiAnalysis&&aiAnalysis.snapshot===aiSnapshot()&&aiAnalysis.text.trim().split(/\s+/).length<=700;}
function aiAssessment(){return {version:1,...JSON.parse(aiSnapshot()),sections:reportSections().filter(([heading])=>heading!=='AI analysis recommendation')};}
function aiRecommendationCard(){
 const current=aiCurrent();
 return `<section class="card ai-analysis-card" id="ai-analysis-card" aria-labelledby="ai-analysis-title"><span class="eyebrow">ADVISORY REVIEW</span><h2 id="ai-analysis-title">AI analysis recommendation</h2><p>${esc(aiDisclosure)}</p><p class="meta">Provider: OpenAI · Model: ${esc(current?aiAnalysis.model:'gpt-5.4-mini')} · Maximum 700 words.</p><p class="meta">Generate sends the solution profile, all assessment answers, sizing details and decision notes to OpenAI. Submit only information authorized for external AI processing.</p>${location.origin!==aiServiceOrigin?'<p class="meta">AI analysis opens the protected Workload Placement Studio. Sign in there if requested; the completed analysis returns to this report.</p>':''}<div class="actions"><button class="primary" onclick="generateAiAnalysis()" ${aiBusy?'disabled':''}>${aiBusy?'Generating AI analysis…':current?'Regenerate AI analysis':'Generate AI analysis'}</button><button class="secondary" onclick="exportAiAssessment()">Export assessment</button><label class="secondary ai-import-label">Import assessment<input type="file" accept="application/json,.json" onchange="importAiAssessment(this.files[0])" hidden></label></div><p id="ai-analysis-status" class="meta" role="status" aria-live="polite">${esc(aiBusy?'Waiting for the protected AI service…':aiError||(aiAnalysis&&!current?'Answers or notes have changed. Regenerate the analysis before using it or including it in the PDF.':current?'Generated '+new Date(aiAnalysis.generatedAt).toLocaleString()+' · '+aiAnalysis.wordCount+' words.':'AI analysis has not been generated for the current answers.'))}</p>${current?`<div class="ai-analysis-text">${esc(aiAnalysis.text)}</div>`:''}<p class="meta">AI advice does not change Placement or the Proposed Operating model. Eligibility review requires specialist validation; final decisions require institutional approval.</p></section>`;
}
function refreshAiPanel(){const panel=document.getElementById('ai-analysis-card');if(panel)panel.outerHTML=aiRecommendationCard();}
function aiReportSection(){
 const items=[aiDisclosure,'Provider: OpenAI. Maximum length: 700 words.'];
 if(aiCurrent())items.push('Model: '+aiAnalysis.model+'. Generated: '+aiAnalysis.generatedAt+'. Word count: '+aiAnalysis.wordCount+'.',aiAnalysis.text);
 else items.push(aiAnalysis?'Answers or optional text have changed since the previous analysis. That analysis is omitted; regenerate it for the current assessment.':'AI analysis has not been generated for the current assessment.');
 items.push('AI advice does not validate eligibility or grant institutional approval.');
 return ['AI analysis recommendation',items];
}
function aiAccept(data,snapshot){
 if(typeof data?.text!=='string'||!data.text.trim()||typeof data.model!=='string')throw Error('The AI service returned an invalid analysis.');
 const words=data.text.trim().split(/\s+/);
 const notice='[Analysis shortened to remain within the 700-word limit.]';
 const text=words.length>700?words.slice(0,700-notice.split(/\s+/).length).join(' ')+'\n\n'+notice:data.text.trim();
 aiAnalysis={...data,text,snapshot,wordCount:text.split(/\s+/).length};aiError='';
}
async function aiRequest(payload){
 const response=await fetch('/api/ai-analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(110000)});
 let data;try{data=await response.json();}catch{throw Error('Sign in to the protected Workload Placement Studio, then try again.');}
 if(!response.ok)throw Error(data.error||'The AI service is unavailable.');
 return data;
}
async function generateAiAnalysis(){
 if(aiBusy)return;
 const payload=aiAssessment(),snapshot=aiSnapshot();aiError='';
 if(JSON.stringify(payload).length>180000){aiError='The assessment is too large. Shorten the supporting text.';refreshAiPanel();return;}
 aiBusy=true;
 if(location.origin!==aiServiceOrigin){
  aiPopup=window.open(aiServiceOrigin+'/studio/index.html#ai-bridge','wps-ai-analysis','width=1080,height=850');
  if(!aiPopup){aiBusy=false;aiError='Allow this site to open the protected analysis window, then try again. You can also export the assessment and import it in Workload Placement Studio.';refreshAiPanel();return;}
  const id=crypto.randomUUID();
  aiPending={id,payload,snapshot,timer:setTimeout(()=>{if(aiPending?.id!==id)return;aiBusy=false;aiPending=null;aiError='The protected window did not return an analysis. Sign in there and try again, or export this assessment and import it in Workload Placement Studio.';refreshAiPanel();},180000)};
  refreshAiPanel();return;
 }
 refreshAiPanel();
 try{aiAccept(await aiRequest(payload),snapshot);}catch(error){aiError=error.name==='TimeoutError'?'The AI request timed out. Try again.':error.message;}finally{aiBusy=false;refreshAiPanel();}
}
function exportAiAssessment(){
 const blob=new Blob([JSON.stringify(aiAssessment(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='Workload-Placement-Assessment.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function aiImport(payload){
 if(payload?.version!==1||!payload.application||!payload.requirements||!payload.decision)throw Error('This is not a Workload Placement Studio assessment.');
 for(const key of ['application','requirements','decision']){
  if(Array.isArray(payload[key])||typeof payload[key]!=='object'||Object.keys(payload[key]).length>100)throw Error('The assessment format is invalid.');
  if(Object.entries(payload[key]).some(([k,v])=>!/^[A-Za-z][A-Za-z0-9]*$/.test(k)||typeof v!=='string'||v.length>30000))throw Error('An assessment field is invalid.');
 }
 state.application={...payload.application};state.requirements={...payload.requirements};state.decision={...payload.decision};needsEdited=!!payload.sizingUserEdited;
 aiAnalysis=null;aiError='';step=2;render();
}
async function importAiAssessment(file){
 if(!file)return;
 try{if(file.size>200000)throw Error('The assessment file is too large.');aiImport(JSON.parse(await file.text()));aiError='Assessment imported. Review the answers, then generate AI analysis.';}catch(error){aiError=error.message;}refreshAiPanel();
}
window.addEventListener('message',async event=>{
 if(event.origin===aiServiceOrigin&&event.source===aiPopup&&aiPending){
  if(event.data?.type==='wps-ai-ready'){aiPopup.postMessage({type:'wps-ai-assessment',id:aiPending.id,payload:aiPending.payload},aiServiceOrigin);return;}
  if(event.data?.type!=='wps-ai-result'||event.data.id!==aiPending.id)return;
  clearTimeout(aiPending.timer);
  try{if(event.data.error)throw Error(event.data.error);aiAccept(event.data.analysis,aiPending.snapshot);}catch(error){aiError=error.message;}
  aiPending=null;aiBusy=false;refreshAiPanel();return;
 }
 if(location.origin!==aiServiceOrigin||location.hash!=='#ai-bridge'||event.origin!==aiGithubOrigin||event.source!==window.opener||event.data?.type!=='wps-ai-assessment'||aiBusy)return;
 const id=event.data.id;
 if(typeof id!=='string'||id.length>100)return;
 try{
  const deadline=Date.now()+10000;while(!model&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,100));
  if(!model)throw Error('The assessment model could not load.');
  aiImport(event.data.payload);aiBusy=true;refreshAiPanel();
  const analysis=await aiRequest(aiAssessment());aiAccept(analysis,aiSnapshot());
  window.opener.postMessage({type:'wps-ai-result',id,analysis},aiGithubOrigin);
 }catch(error){aiError=error.message;window.opener?.postMessage({type:'wps-ai-result',id,error:error.message},aiGithubOrigin);}
 finally{aiBusy=false;refreshAiPanel();}
});
document.addEventListener('input',()=>refreshAiPanel());
document.addEventListener('change',()=>refreshAiPanel());
if(location.origin===aiServiceOrigin&&location.hash==='#ai-bridge'&&window.opener){
 const ready=setInterval(()=>window.opener?.postMessage({type:'wps-ai-ready'},aiGithubOrigin),500);
 setTimeout(()=>clearInterval(ready),60000);
}
