function reportSections(){
 const r=recommendation(),a=state.application,d=state.decision;
 const zone=model.zones.find(z=>z.id===r.id),op=model.operations.find(o=>o.id===r.operative);
 const option=(key)=>profileOptions[key].options.find(([v])=>v===a[key])?.[1]||'Not provided';
 const response=q=>!questionApplies(q)?'Not applicable — no AI capability selected':q.options.find(([v])=>v===state.requirements[q.key])?.[1]||'Not answered';
 const text=value=>value||'Not provided';
 const pair=(question,answer)=>({question,answer:text(answer),unanswered:!answer||answer==='Not provided'});
 const gaps=[...r.missing];
 ['id','name','owner'].forEach(key=>{if(!a[key])gaps.push('Solution '+key+' is missing.');});
 if(!a.classification||a.classification==='unknown')gaps.push('Confirm institutional data classification.');
 if(a.classification==='custom'&&!a.classificationNotes)gaps.push('Specify the institutional classification label.');
 return [
 ['Decision summary',[
  'Solution: '+text(a.name)+' | ID: '+text(a.id),
  'Institutional service owner: '+text(a.owner),
  'Status: '+r.status,
  'Compatible delivery model: '+r.compatible,
  'Proposed placement: '+(zone?zone.name:r.indicatedId?'EXCLUDED — '+model.zones.find(z=>z.id===r.indicatedId)?.name:'Unresolved - more information required'),
  'Proposed operating model: '+(op?op.name:'Unresolved - more information required'),
  'Supplemental support: '+r.support,
  'This report captures a provisional architecture proposal from the solution requirements. It does not assess or certify eligibility. Mandatory controls and evidence must be validated through institutional review before approval.'
 ]],

 ['Why this placement?',r.reasons.length?r.reasons:['No placement can yet be proposed. Review the missing information and constraints below.']],
 ['Why this operating model?',[...(r.opReasons.length?r.opReasons:['The operating model remains unresolved; confirm control, internal capability and sourcing permission.']),...(zone?['Responsibility boundary: '+zone.responsibility]:[]),'Institutional service ownership and accountability remain internal under every operating model.']],
 ['How the answers lead to the proposal',[
  '1. Mandatory local execution, cloud prohibition, hard local proximity or local hardware requirements constrain installable software to local placement. SaaS-only delivery conflicting with these constraints is flagged.',
  '2. Intentional local and cloud components lead to a hybrid composition; each component still needs its own placement and responsibility definition.',
  '3. Delivery alone never assigns a placement. Cloud permission, local execution, proximity, hardware and hybrid architecture must be confirmed first. Software delivery and supported architecture then determine the compatible service model: SaaS, CaaS, specialized AI infrastructure, managed platforms or server-based hosting.',
  '4. Where location is flexible, stated lifecycle cost evidence can favor local or cloud execution. Elastic demand supports a provisional cloud proposal. Without a differentiator, location remains unresolved.',
  '5. Operational control, internal capability and permitted sourcing are assessed separately. SaaS is provider-operated; internal execution, co-management or managed operations depend on those answers.',
  'The solution profile establishes criticality, financial / systemic impact and explicit execution / sovereignty restrictions. Mandatory local restrictions exclude external cloud. High criticality strengthens F1 and recovery gates; the thesis does not impose a universal criticality-based cloud ban.'
 ]],
 ['Assessment questions and answers',[...new Set(questions.map(q=>q.group))].flatMap(group=>questions.filter(q=>q.group===group)).map((q,i)=>({question:'Q'+(i+1)+'. '+q.label,answer:response(q),group:q.group,unanswered:questionApplies(q)&&(!state.requirements[q.key]||state.requirements[q.key]==='unknown')}))],
 ['Infrastructure security implications',r.cyberChecks],
 ['Conflicts to resolve',r.issues.length?r.issues:['No conflict identified by the current rules. This is not evidence that all controls have passed.']],
 ['Missing information',[...r.placementMissing,...gaps].length?[...new Set([...r.placementMissing,...gaps])]:['No unanswered assessment questions or required identity fields identified. Supporting evidence still requires validation.']],
 ['Evidence and validation before approval',[...r.checks,
  'Verify mandatory security, sovereignty, resilience, connectivity and exit / reversibility controls for the proposed arrangement.',
  'Verify product support, licensing, operational interfaces and responsibility boundaries.',
  'Confirm risk-adjusted lifecycle costs; cost cannot override mandatory controls.'
 ]],
 ['Solution profile',[
  pair('Purpose and institutional capability',a.capability),
  ...Object.keys(profileOptions).map(key=>({...pair(profileOptions[key].label,option(key)),unanswered:!a[key]||a[key]==='unknown'})),
  pair('Data labels and handling restrictions',a.classificationNotes),
  pair('RTO — time to restore',a.rto),pair('RPO — acceptable data loss',a.rpo),
  pair('Jurisdiction, keys and administration',a.jurisdiction),
  pair('Latency and proximity',a.latency),pair('Dependencies and recovery order',a.dependencies),
  pair('Additional information and sizing details for evaluation and reporting ('+(needsEdited?'user-edited':'automatically suggested; requires validation')+')',a.needs||suggestedNeeds())
 ]],
 ['Decision record',[
  pair('Rationale / architecture notes',d.rationale),pair('Conditions and evidence references',d.conditions),
  pair('Decision owner',d.owner),pair('Platform / technology owner',d.platform),
  pair('Technical operator / provider',d.operator),pair('Approval authority',d.authority),pair('Review trigger / date',d.review)
 ]],
 ['Framework basis and limitations',[
  'Governing source: Tese_Pedro_Milagres_Silva_2026_v5.1(1).docx; §3.2.1 placement and mandatory eligibility, §3.3.1 sovereignty, §3.3.2 recovery, §3.4 AI infrastructure, embedded AI and A0–A4 operations, and Appendices B.2–B.7. The workbook v4 supplies the supporting catalog.',
  'The solution-led recommendation rules are a decision-support interpretation of the framework, not validated thresholds from the workbook candidate-scoring matrix.',
  'Answers are supplied by the assessor. This report does not independently verify software support, provider evidence, compliance, tested recovery or real operational effectiveness.',
  'Suggested sizing text is a requirements-gathering aid. Unknown values remain unconfirmed and must not be treated as approved capacity targets.'
 ]]
 ];
}
async function buildReportPdf(){
 const {PDFDocument,StandardFonts,rgb}=PDFLib;
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const fontData=await Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(async name=>{const response=await fetch('vendor/'+name);if(!response.ok)throw Error('Report font unavailable');return response.arrayBuffer();}));
 const font=await doc.embedFont(fontData[0],{subset:true}),bold=await doc.embedFont(fontData[1],{subset:true});
 doc.setTitle('Workload Placement - '+(state.application.name||'Solution Assessment'));
 doc.setSubject('Placement and operating-model reasoning');doc.setCreator('Workload Placement Studio');
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
 newPage();write('Placement & operating-model report',{size:22,f:bold,color:green,gap:10});
 write('Generated: '+new Date().toISOString().replace('T',' ').slice(0,19)+' UTC',{size:9,color:muted,gap:18});
 for(const [heading,items]of reportSections()){
  if(heading==='Assessment questions and answers'||y<150)newPage();
  write(heading,{size:14,f:bold,color:green,gap:14});
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
 pages.forEach((p,i)=>p.drawText('Provisional assessment | '+(i+1)+' / '+pages.length,{x:46,y:30,size:9,font,color:muted}));
 return doc.save();
}
async function downloadReport(){
 const button=document.getElementById('download-report'),status=document.getElementById('report-status');
 button.disabled=true;status.textContent='Preparing PDF report…';
 try{const bytes=await buildReportPdf(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;link.download='Workload-Placement-'+(state.application.id||state.application.name||'Assessment').replace(/[^a-z0-9_-]/gi,'-').slice(0,80)+'.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='PDF report ready. Check your downloads.';}catch(error){status.textContent='The PDF could not be generated. Please try again.';console.error('PDF generation failed',error);}finally{button.disabled=false;}
}
