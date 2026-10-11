function reportSections(){
 const r=recommendation(),a=state.application,d=state.decision;
 const zone=model.zones.find(z=>z.id===r.id);
 const option=key=>profileOptions[key].options.find(([v])=>v===a[key])?.[1]||'Not provided';
 const response=q=>!questionApplies(q)?'Not applicable — responses establish that no relevant AI capability is involved':q.options.find(([v])=>v===state.requirements[q.key])?.[1]||'Not answered';
 const text=value=>value||'Not provided';
 const pair=(question,answer)=>({question,answer:text(answer),unanswered:!informationProvided(answer)});
 const hasText=value=>Boolean(String(value||'').trim());
 const enteredPair=(question,value)=>hasText(value)?[pair(question,value)]:[];
 const evidenceEntries=evidenceFields.filter(f=>hasText(state.requirements[f.key])).map(f=>pair(f.label,state.requirements[f.key]));
 const decisionEntries=[['rationale','Rationale / architecture notes'],['conditions','Conditions and evidence references'],['owner','Decision owner'],['platform','Platform / technology owner'],['operator','Technical operator / provider'],['authority','Approval authority'],['review','Review trigger / date']].flatMap(([key,label])=>enteredPair(label,d[key]));
 return [
  ['Preliminary assessment scope',assessmentNotice],
  ['Decision summary',[
   ...(hasText(a.name)||hasText(a.id)?[[...(hasText(a.name)?['Solution: '+a.name]:[]),...(hasText(a.id)?['ID: '+a.id]:[])].join(' | ')]:[]),
   ...(hasText(a.owner)?['Institutional service owner: '+a.owner]:[]),
   ...decisionStatuses(r).map(([label,value])=>label+': '+value),
   ...r.conflictDetails.map(item=>'Conflict: '+item.title+'. '+item.answers.map(answer=>answer.label.split('. ')[0]+': '+answer.answer).join(' | ')),
   ...['placement','operating'].flatMap(kind=>decisionDiagnostics(kind,r).filter(item=>item.type==='unresolved').map(item=>(kind==='placement'?'Placement':'Operating model')+' unresolved: '+item.detail)),
   'Placement and the proposed operating model are preliminary recommendations. Outstanding requirements require specialist validation; final decisions require institutional approval.'
  ]],
  ['Confirmed requirement conflicts',r.conflictDetails.length?r.conflictDetails.flatMap(diagnosticReportLines):['No confirmed conflict identified by the current rules. This does not establish that mandatory requirements are satisfied.']],
  ...(['placement','operating'].some(kind=>decisionDiagnostics(kind,r).some(item=>item.type==='unresolved'))?[['Unresolved decisions — causes and next steps',['placement','operating'].flatMap(kind=>decisionDiagnostics(kind,r).filter(item=>item.type==='unresolved').flatMap(item=>diagnosticReportLines({...item,title:(kind==='placement'?'Placement: ':'Operating model: ')+item.title})))]]:[]),
  ...(typeof aiReportSection==='function'?[aiReportSection()]:[]),
  ['Recommendation basis',[
   ...(r.reasons.length?r.reasons.filter(x=>x!==r.economicsBasis):['Placement unresolved. Confirm required inputs, restrictions and supported architecture.']),
   r.economicsBasis,
   'Compatible delivery: '+r.compatible,
   'AI applicability: '+r.aiStatus,
   ...(r.intendedAiAuthority?['Intended AI authority: '+r.intendedAiAuthority+'. Recorded intent does not authorize execution.']:[]),
   'Applied rules: '+r.appliedRules.join(', ')+'. See the recommendation-rules table below.'
  ]],
  ['Outstanding requirements — missing / incomplete information',r.outstanding.length?r.outstanding.map(x=>x.category+': '+x.detail):['Information has been supplied for the characterized requirements. Specialist evidence validation remains outstanding.']],
  ['Proposed operating model — basis and boundary',[
   ...r.opReasons,
   'Supplemental support: '+r.support,
   ...(zone?['Service-model responsibility boundary: '+zone.responsibility]:[]),
   'Institutional service ownership and accountability remain internal under every operating model.'
  ]],
  ['Specialist validation and institutional approval',[
   'Infrastructure specialists, solution owners and relevant subject-matter experts must validate the proposal, outstanding requirements, conflicts and supporting evidence. Detailed evidence validation remains outside this questionnaire.',
   'Detailed technical, security, sovereignty, resilience and economic assessment must be proportionate to solution criticality, complexity and risk. Final placement and deployment remain subject to institutional governance and approval.',
   ...r.checks,
   'Verify product support, licensing, operational interfaces and responsibility boundaries. Verify the end-to-end recovery, security, sovereignty, connectivity and exit / reversibility controls for the proposed arrangement.',
   'Validate assessor-supplied economic conclusions against comparable lifecycle costs, a common assessment period, baseline and peak demand, scaling capability and capacity assumptions. Costs cannot override mandatory requirements.'
  ]],
  ['Infrastructure security implications',r.cyberChecks],
  ['Assessment questions and answers',questions.map((q,i)=>({question:'Q'+(i+1)+'. '+q.label,answer:response(q),group:q.group,unanswered:questionApplies(q)&&(!state.requirements[q.key]||state.requirements[q.key]==='unknown')}))],
  ...(evidenceEntries.length?[['Supporting requirement information and evidence',evidenceEntries]]:[]),
  ['Solution profile',[
   ...enteredPair('Purpose and institutional capability',a.capability),
   ...Object.keys(profileOptions).map(key=>({...pair(profileOptions[key].label,option(key)),unanswered:!a[key]||a[key]==='unknown'})),
   ...enteredPair('Data labels and handling restrictions',a.classificationNotes),
   ...enteredPair('RTO — time to restore (hours)',a.rto),...enteredPair('RPO — acceptable data-loss window (minutes)',a.rpo),
   ...enteredPair('Jurisdiction, keys and administration',a.jurisdiction),...enteredPair('Latency and proximity',a.latency),
   ...enteredPair('Dependencies and recovery order',a.dependencies),
   ...(hasUserSizingInformation()?[pair('Additional information and sizing details for evaluation and reporting (user-entered)',a.needs)]:[])
  ]],
  ...(decisionEntries.length?[['Decision record',[
   ...decisionEntries,
   'Naming an approval authority or entering decision notes does not grant approval. Final decisions require a separate institutional approval process.'
  ]]]:[]),
  ['Recommendation method and limitations',[
   methodDescription,
   'Directly implemented declarations and specialist validation obligations are distinguished from interpretation rules introduced for the demonstrator, including the elasticity-based cloud suggestion.',
   'Answers and evidence references are supplied by the assessor. This report does not independently verify product support, provider evidence, compliance, tested recovery or real operational effectiveness.',
   'Suggested sizing text is a requirements-gathering aid. Unknown values remain unconfirmed and must not be treated as approved capacity targets.'
  ]],
  ['Recommendation rules and limitations',ruleTraceability.map(trace=>({trace}))]
 ];
}
async function buildReportPdf(){
 const {PDFDocument,StandardFonts,rgb}=PDFLib;
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const fontData=await Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(async name=>{const response=await fetch('vendor/'+name);if(!response.ok)throw Error('Report font unavailable');return response.arrayBuffer();}));
 const font=await doc.embedFont(fontData[0],{subset:true}),bold=await doc.embedFont(fontData[1],{subset:true});
 doc.setTitle('Workload Placement - '+(state.application.name||'Solution Assessment'));
 doc.setSubject('Preliminary solution-placement demonstrator; specialist validation and institutional approval required');doc.setCreator('Workload Placement Studio');
 const clean=s=>Array.from(String(s).replace(/[\u2010-\u2015]/g,'-').replace(/→/g,' -> ').replace(/≤/g,'<=').replace(/≥/g,'>=')).map(c=>{try{font.encodeText(c);return c}catch{return '?'}}).join('');
 const pages=[];let page,y;
 const ink=rgb(.12,.18,.25),muted=rgb(.35,.40,.46),green=rgb(.05,.36,.29);
 function newPage(){page=doc.addPage([595.28,841.89]);pages.push(page);y=773;page.drawText('WORKLOAD PLACEMENT STUDIO',{x:46,y:805,size:9,font:bold,color:green});page.drawLine({start:{x:46,y:792},end:{x:549,y:792},thickness:.6,color:rgb(.8,.85,.84)});}
 function wrap(value,size,f,width=503){const output=[];for(const paragraph of clean(value).split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(f.widthOfTextAtSize((line?line+' ':'')+word,size)<=width){line+=(line?' ':'')+word;continue}if(line)output.push(line);line='';for(const ch of word){if(f.widthOfTextAtSize(line+ch,size)>width){output.push(line);line=''}line+=ch}}output.push(line)}return output;}
 function write(value,{size=10.5,f=font,color=ink,gap=8,x=46,width=503}={}){const lines=wrap(value,size,f,width),leading=size*1.45;for(const line of lines){if(y-leading<55)newPage();page.drawText(line,{x,y,size,font:f,color});y-=leading}y-=gap;}
 function writeAnswer(item){
  const questionLines=wrap(item.question,10.5,bold);
  const answerLines=wrap('Answer: '+item.answer,10.5,font,491);
  const height=(questionLines.length+answerLines.length)*15.225+24;
  const minimum=questionLines.length*15.225+Math.min(answerLines.length,3)*15.225+12;
  if(y-Math.min(height,minimum+100)<55)newPage();
  write(item.question,{f:bold,gap:5});
  const color=item.unanswered?rgb(.55,.30,.09):ink;
  for(const line of answerLines){
   if(y-15.225<55){newPage();write('Answer (continued)',{size:9,f:bold,color:muted,gap:6,x:58,width:491});}
   page.drawText(line,{x:58,y,size:10.5,font,color});y-=15.225;
  }
  y-=17;
 }
 function writeTraceTable(rows){
  const widths=[208,110,185],left=46,size=8.5,leading=12.3,pad=7;
  const columns=row=>[row.id+' — '+row.rule,row.type,row.limit];
  function row(values,header=false){
   const f=header?bold:font;
   const lines=values.map((v,i)=>wrap(v,size,f,widths[i]-2*pad));
   const height=Math.max(...lines.map(x=>x.length))*leading+2*pad;
   if(y-height<55){newPage();drawHeader();}
   let x=left;
   for(let i=0;i<values.length;i++){
    page.drawRectangle({x,y:y-height+5,width:widths[i],height,color:header?rgb(.90,.95,.93):rgb(.98,.99,.99),borderColor:rgb(.80,.86,.84),borderWidth:.5});
    lines[i].forEach((line,j)=>page.drawText(line,{x:x+pad,y:y-pad-j*leading-3,size,font:f,color:ink}));
    x+=widths[i];
   }
   y-=height;
  }
  function drawHeader(){row(['Rule','Basis','Implementation limit'],true);}
  drawHeader();rows.forEach(item=>row(columns(item.trace)));y-=12;
 }
 newPage();write('Placement & operating-model report',{size:22,f:bold,color:green,gap:10});
 write('Generated: '+new Date().toISOString().replace('T',' ').slice(0,19)+' UTC',{size:9,color:muted,gap:18});
 for(const [heading,items]of reportSections()){
  if(heading==='Assessment questions and answers'||heading==='Recommendation rules and limitations'||y<165)newPage();
  write(heading,{size:14,f:bold,color:green,gap:14});
  if(heading==='Recommendation rules and limitations'){writeTraceTable(items);continue;}
  let group=null;
  for(const item of items){
   if(typeof item==='string'){write(item);continue;}
   if(item.group&&item.group!==group){
    if(y<165)newPage();
    group=item.group;write(group,{size:11,f:bold,color:green,gap:12});
   }
   writeAnswer(item);
  }
  y-=9;
 }
 pages.forEach((p,i)=>p.drawText('Preliminary assessment | '+(i+1)+' / '+pages.length,{x:46,y:30,size:9,font,color:muted}));
 return doc.save();
}
async function downloadReport(){
 const button=document.getElementById('download-report'),status=document.getElementById('report-status');
 button.disabled=true;status.textContent='Preparing PDF report…';
 try{const bytes=await buildReportPdf(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;link.download='Workload-Placement-'+(state.application.id||state.application.name||'Assessment').replace(/[^a-z0-9_-]/gi,'-').slice(0,80)+'.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='PDF report ready. Check your downloads.';}catch(error){status.textContent='The PDF could not be generated. Please try again.';console.error('PDF generation failed',error);}finally{button.disabled=false;}
}
