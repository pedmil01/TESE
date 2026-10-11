const assessmentNotice=[
 'This tool provides a preliminary assessment and indicative recommendations for solution placement and operating arrangements. All outputs require validation by infrastructure specialists, solution owners, and relevant subject-matter experts before a final decision.',
 'Depending on the solution’s criticality, complexity, and risk, more detailed technical, security, sovereignty, resilience, and economic assessments may be required. Recommendations do not confirm that mandatory requirements have been satisfied. Final placement and deployment decisions remain subject to institutional governance and approval.'
];
const methodDescription='This preliminary solution-placement demonstrator uses rules to suggest a placement arrangement and operating model. It does not perform a weighted comparison of eligible candidates. It does not calculate TCO, establish economic superiority, confirm eligibility, or authorize deployment.';
const elasticityMessage='Cloud candidate suggested by elasticity; economic suitability remains unassessed.';
const evidenceFields=[
 {key:'costEvidence',label:'Comparable lifecycle costs — evidence reference',hint:'Identify the comparison, its owner and date. Cover equivalent service requirements, infrastructure / subscriptions, licensing, operations, connectivity, security, recovery and exit. A stated preference is an assessor-supplied conclusion; the tool does not calculate TCO.'},
 {key:'costPeriod',label:'Common economic assessment period',hint:'State the same assessment horizon for each arrangement, for example five years, and identify included commitments.'},
 {key:'baselineDemand',label:'Baseline demand',hint:'Record measured or forecast volumes, utilization and normal capacity with units and the source.'},
 {key:'peakDemand',label:'Peak demand',hint:'Record peak volumes, duration, frequency and response-time requirements with units and assumptions.'},
 {key:'scalingEvidence',label:'Scaling capability',hint:'Explain supported scaling limits, provisioning time, quotas and platform / provider evidence.'},
 {key:'capacityAssumptions',label:'Capacity assumptions',hint:'Record headroom, growth, utilization, redundancy, recovery capacity and any accelerator assumptions.'},
 {key:'operatingEvidence',label:'Operating capability — scope and evidence',hint:'Identify the required skills, staffing, support hours, on-call coverage, lifecycle and recovery responsibilities. Record evidence and gaps; this does not approve an operating model.'},
 {key:'aiFlowDetails',label:'AI data and context flows — details',hint:'When AI is relevant, identify capabilities, prompts, data, telemetry, APIs, processing locations, support access and external dependencies. A processing-location answer alone is not a complete data-flow record.'}
];
const ruleTraceability=[
 {id:'C1',rule:'Enforce declared local execution, external-processing prohibitions, sovereignty and hard proximity / hardware restrictions; block incompatible SaaS or hybrid arrangements.',type:'Direct constraint enforcement',limit:'Enforces declarations only. Specialist evidence is still required for eligibility.'},
 {id:'C2',rule:'Enforce AI processing restrictions and flag contradictory AI answers.',type:'Direct constraint enforcement',limit:'Unknown relevant flows withhold placement; explicit absence across all AI dimensions is required for not applicable.'},
 {id:'I1',rule:'Withhold placement when required location, architecture, profile or relevant AI-flow inputs are unknown.',type:'Tool interpretation / information threshold',limit:'The questionnaire threshold is introduced for the demonstrator; it is not mandatory eligibility validation.'},
 {id:'I2',rule:'Map SaaS-only delivery to cloud SaaS and an intentional local / cloud split to hybrid composition when restrictions permit.',type:'Tool interpretation / catalog mapping',limit:'Compatibility and component boundaries remain subject to specialist validation.'},
 {id:'I3',rule:'Map a selected location and declared software support to CaaS, IaaS, PaaS, private cloud, traditional or specialized AI infrastructure.',type:'Tool interpretation / catalog mapping',limit:'No independent product-support or platform evidence verification.'},
 {id:'I4',rule:'Use an explicit AI workload processing location as a location differentiator, subject to execution restrictions.',type:'Tool interpretation / location inference',limit:'AI involvement alone does not mandate on-premises placement.'},
 {id:'I5',rule:'Use an assessor-supplied lifecycle-economic preference when location is flexible; retain the evidence obligation.',type:'Tool interpretation / assessor conclusion',limit:'Does not calculate TCO or establish superiority; requires a common period, comparable scope and documented demand assumptions.'},
 {id:'I6',rule:'Suggest a cloud candidate for elastic demand when restrictions permit and no economic preference resolves location.',type:'Tool interpretation / elasticity heuristic',limit:'Introduced specifically for this tool. Elasticity does not establish economic suitability.'},
 {id:'I7',rule:'Leave flexible location unresolved without a supported location differentiator or compatible platform pattern.',type:'Tool interpretation / conservative fallback',limit:'Steady demand alone does not select an arrangement.'},
 {id:'I8',rule:'Suggest internal, co-managed, managed or provider operation from control, skills and sourcing; unresolved inputs or capability conflicts leave the operating model unresolved.',type:'Tool interpretation / operating-model mapping',limit:'Institutional accountability remains internal; SaaS tenant administration and support still require capability information.'},
 {id:'V1',rule:'Keep recovery, security, sovereignty, operating and economic gaps visible; criticality strengthens review obligations without an automatic cloud ban.',type:'Specialist validation obligation',limit:'Missing information is distinct from confirmed conflicts. Mandatory validation remains outside the questionnaire.'},
 {id:'V2',rule:'Record intended A0–A4 authority and proportionate controls without granting authorization.',type:'Specialist validation obligation',limit:'A3 requires action approval; A4 requires an approved boundary, least privilege, oversight, auditability and suspension / recovery.'}
];
function scopeNotice(){return `<section class="notice scope-notice" aria-label="Preliminary assessment scope"><strong>Preliminary assessment · specialist validation required</strong>${assessmentNotice.map(p=>`<p>${esc(p)}</p>`).join('')}</section>`;}
function aiNotApplicable(r){return ['saas','package','container','modern'].includes(r.delivery)&&r.aiInfrastructure==='none'&&r.embeddedAI==='none'&&r.aiAuthority==='none';}
function informationProvided(v){return Boolean(String(v||'').trim())&&!/^(unknown|undefined|unresolved|undetermined|n\/?a|none|not (yet )?(provided|known|defined|assessed|confirmed|documented|available|applicable)|to (confirm|be confirmed)|tbc|tbd|needs? (review|assessment|confirmation))\b/i.test(String(v).trim());}
function economicBasis(r,elasticityBased){
 if(['cloud','local','similar'].includes(r.economics))return (elasticityBased?elasticityMessage+' ':'')+'Assessor-supplied conclusion: '+({cloud:'economics favor cloud',local:'economics favor local',similar:'economics are comparable / no clear cost advantage'}[r.economics])+'. Supporting comparative lifecycle-cost evidence requires specialist validation. The tool does not calculate TCO or establish economic superiority.';
 return elasticityBased?elasticityMessage:'Economic suitability remains unassessed; no comparative lifecycle-cost conclusion has been supplied.';
}
function outstandingRequirements(r,placementMissing=[]){
 const a=state.application,items=[];
 const add=(category,detail)=>items.push({category,detail,targets:requirementTargets(category,detail)});
 const unknown=key=>!r[key]||r[key]==='unknown';
 if(r.recovery!=='yes')add('Recovery','Recovery targets and dependencies are not defined or remain unknown. Document RTO (hours), RPO (minutes), backup independence and end-to-end recovery order.');
 for(const [key,label]of [['rto','RTO (hours)'],['rpo','RPO (minutes)'],['dependencies','Dependencies and recovery order']])if(!informationProvided(a[key]))add('Recovery',label+' is missing, unknown or incomplete in the solution profile.');
 if(unknown('trustedRecovery')||r.trustedRecovery==='undefined')add('Recovery','Trusted / cyber-recovery requirements remain undefined; ordinary backup / DR does not establish trusted recovery.');
 for(const key of ['networkExposure','securityIsolation','keyCustody'])if(unknown(key))add('Infrastructure security',questions.find(q=>q.key===key).label);
 if(!informationProvided(a.jurisdiction))add('Sovereignty','Jurisdiction, key-control and administration requirements need detail in the solution profile.');
 if(!a.classification||a.classification==='unknown')add('Infrastructure security','Institutional data classification remains unknown.');
 if(a.classification==='custom'&&!informationProvided(a.classificationNotes))add('Infrastructure security','Specify the institutional classification and handling restrictions.');
 if(!aiNotApplicable(r)){
  for(const key of ['aiInfrastructure','embeddedAI','aiAuthority'])if(unknown(key))add('AI authority and data flows',questions.find(q=>q.key===key).label);
  if(unknown('aiData')||r.aiData==='none'&&!aiInScope(r))add('AI authority and data flows','AI applicability / processing location is unresolved. Not applicable requires explicit absence of all relevant AI capabilities.');
  if(aiInScope(r)&&!informationProvided(r.aiFlowDetails))add('AI authority and data flows','Document AI data / context flows, processing locations, permissions and external dependencies.');
 }
 for(const key of ['control','skills','sourcing'])if(unknown(key))add('Operating capability',questions.find(q=>q.key===key).label);
 if(!informationProvided(r.operatingEvidence))add('Operating capability','Supporting skills, coverage, staffing, lifecycle and recovery responsibility information is incomplete.');
 if(unknown('economics'))add('Economic evidence','No comparative lifecycle-cost conclusion has been supplied.');
 if(unknown('demand'))add('Economic evidence','Demand profile and scaling needs are not established.');
 for(const f of evidenceFields.slice(0,6))if(!informationProvided(r[f.key]))add('Economic evidence',f.label+' remains outstanding.');
 for(const label of placementMissing)add('Placement inputs',label);
 for(const key of ['id','name','owner'])if(!informationProvided(a[key]))add('Solution ownership',({id:'Solution ID',name:'Solution name',owner:'Institutional service owner'}[key])+' is missing.');
 return items.filter((item,i)=>items.findIndex(x=>x.category===item.category&&x.detail===item.detail)===i);
}
function decisionStatuses(r){
 return [
  ['Placement proposal',r.placementConflicts.length?'Requirements conflict':model.zones.find(z=>z.id===r.id)?.name||'Unresolved'],
  ['Eligibility','Unresolved — specialist validation required.'],
  ['Proposed operating model',model.operations.find(o=>o.id===r.operative)?.name||'Unresolved'],
  ['Approval','Pending institutional approval.']
 ];
}
function statusExplanation(kind,r=recommendation()){
 let reasons=[];
 if(kind==='placement'){
  reasons.push(...r.placementMissing.map(item=>'Missing or unconfirmed: '+item));
  reasons.push(...r.checks.filter(item=>/Both local and cloud execution remain possible|location is indicated/i.test(item)));
  if(!reasons.length)reasons.push('The current answers do not establish a supported location and service-model combination. Confirm the software architecture, execution restrictions and a location differentiator.');
 }else if(kind==='operating'){
  reasons.push(...r.opReasons,...r.operatingConflicts);
  reasons.push(...r.outstanding.filter(item=>item.category==='Operating capability').map(item=>item.detail));
  if(state.requirements.delivery==='saas'&&!r.id)reasons.push('A SaaS operating arrangement cannot be proposed until its placement requirements and provider / institutional responsibility boundary are resolved.');
  if(!reasons.length)reasons.push('The answers do not establish a compatible operational-control, capability and sourcing arrangement. Confirm the operating scope and responsibility boundaries.');
 }else if(kind==='eligibility'){
  reasons.push('Mandatory eligibility validation is outside this questionnaire. Infrastructure specialists, solution owners and relevant subject-matter experts have not validated the proposed arrangement through this tool. Supplying every answer does not confirm eligibility.');
  if(!r.id)reasons.push('A compatible placement proposal must first be identified before arrangement-specific eligibility can be assessed.');
  reasons.push(...r.placementConflicts.map(item=>'Confirmed requirement conflict: '+item));
  reasons.push(...r.outstanding.map(item=>item.category+': '+item.detail));
  reasons.push('Specialist validation is required for: '+mandatoryGates.map(g=>g.label).join('; ')+'.');
  if(r.intendedAiAuthority)reasons.push('Intended AI authority '+r.intendedAiAuthority+' still requires validation of data flows, permissions, oversight, traceability and suspension / recovery controls; selection grants no authorization.');
 }
 return [...new Set(reasons)];
}
function assessmentTarget(key){return {step:1,id:'q-'+key,label:'Review '+(questions.find(q=>q.key===key)?.label||key)};}
function profileTarget(key){return {step:0,id:profileOptions[key]?'profile-'+key:'application-'+key,label:'Review '+(profileOptions[key]?.label||({rto:'RTO (hours)',rpo:'RPO (minutes)',dependencies:'dependencies and recovery order',jurisdiction:'jurisdiction, keys and administration',classificationNotes:'classification and handling restrictions',id:'solution ID',name:'solution name',owner:'institutional service owner'}[key]||key))};}
function evidenceTarget(key){return {step:1,id:'evidence-'+key,label:'Provide '+(evidenceFields.find(f=>f.key===key)?.label||key)};}
function validationTarget(){return {step:2,id:'specialist-validation',label:'Review specialist validation requirements'};}
function requirementTargets(category,detail){
 const question=questions.find(q=>q.label===detail),profile=Object.entries(profileOptions).find(([key,value])=>value.label===detail);
 if(question)return [assessmentTarget(question.key)];
 if(profile)return [profileTarget(profile[0])];
 if(detail==='AI data flows and processing location')return [assessmentTarget('aiData'),evidenceTarget('aiFlowDetails')];
 if(category==='Recovery'){
  if(detail.startsWith('RTO '))return [profileTarget('rto')];
  if(detail.startsWith('RPO '))return [profileTarget('rpo')];
  if(detail.startsWith('Dependencies '))return [profileTarget('dependencies')];
  if(detail.startsWith('Trusted /'))return [assessmentTarget('trustedRecovery')];
  return [assessmentTarget('recovery'),profileTarget('rto'),profileTarget('rpo'),profileTarget('dependencies')];
 }
 if(category==='Infrastructure security')return [profileTarget(detail.startsWith('Specify')?'classificationNotes':'classification')];
 if(category==='Sovereignty')return [profileTarget('jurisdiction')];
 if(category==='AI authority and data flows')return detail.startsWith('Document AI')?[evidenceTarget('aiFlowDetails')]:[assessmentTarget('aiInfrastructure'),assessmentTarget('embeddedAI'),assessmentTarget('aiAuthority'),assessmentTarget('aiData')];
 if(category==='Operating capability')return [evidenceTarget('operatingEvidence')];
 if(category==='Economic evidence'){
  const field=evidenceFields.slice(0,6).find(f=>detail.startsWith(f.label));
  if(field)return [evidenceTarget(field.key)];
  return [assessmentTarget(detail.startsWith('Demand')?'demand':'economics')];
 }
 if(category==='Solution ownership')return [profileTarget(detail.startsWith('Solution ID')?'id':detail.startsWith('Solution name')?'name':'owner')];
 return [assessmentTarget('delivery')];
}
function placementResolutionTargets(r){
 const targets=r.placementMissing.flatMap(detail=>requirementTargets('Placement inputs',detail));
 if(targets.length)return targets;
 if(r.checks.some(item=>/Both local and cloud execution remain possible/i.test(item)))return [assessmentTarget('economics'),assessmentTarget('demand'),evidenceTarget('costEvidence')];
 return [assessmentTarget('platform'),assessmentTarget('delivery')];
}
function conflictResolutionTargets(detail){
 if(/AI/i.test(detail))return [assessmentTarget('aiData'),assessmentTarget('embeddedAI'),assessmentTarget('aiInfrastructure'),profileTarget('executionRestriction')];
 if(/sourcing/i.test(detail))return [assessmentTarget('sourcing'),assessmentTarget('skills'),assessmentTarget('control')];
 if(/privileged|Retained internal/i.test(detail))return [assessmentTarget('control'),assessmentTarget('skills'),evidenceTarget('operatingEvidence')];
 return [assessmentTarget('delivery'),assessmentTarget('hybrid'),assessmentTarget('local'),assessmentTarget('cloud'),profileTarget('executionRestriction'),profileTarget('sovereigntyRestriction')];
}
function statusExplanationItems(kind,r=recommendation()){
 return statusExplanation(kind,r).map(detail=>{
  let targets=[];
  const outstanding=r.outstanding.find(item=>detail===item.detail||detail===item.category+': '+item.detail);
  if(outstanding)targets=outstanding.targets;
  else if(kind==='placement'){
   targets=detail.startsWith('Missing or unconfirmed: ')?requirementTargets('Placement inputs',detail.slice('Missing or unconfirmed: '.length)):placementResolutionTargets(r);
  }else if(kind==='operating'){
   targets=/SaaS operating arrangement cannot/.test(detail)?placementResolutionTargets(r):r.operatingConflicts.includes(detail)?conflictResolutionTargets(detail):[assessmentTarget('control'),assessmentTarget('skills'),assessmentTarget('sourcing'),evidenceTarget('operatingEvidence')];
  }else if(kind==='eligibility'){
   if(detail.startsWith('A compatible placement proposal'))targets=placementResolutionTargets(r);
   else if(detail.startsWith('Confirmed requirement conflict: '))targets=conflictResolutionTargets(detail);
   else if(detail.startsWith('Intended AI authority'))targets=[assessmentTarget('aiAuthority'),evidenceTarget('aiFlowDetails'),validationTarget()];
   else targets=[validationTarget()];
  }
  if(!targets?.length)targets=[validationTarget()];
  return {detail,targets:targets.filter((t,i)=>targets.findIndex(x=>x.step===t.step&&x.id===t.id)===i)};
 });
}
function resolutionLinks(targets){return `<div class="requirement-resolution-links">${targets.map(t=>`<a href="#${esc(t.id)}" class="requirement-resolution-link" data-requirement-step="${t.step}" data-requirement-target="${esc(t.id)}">${esc(t.label)}</a>`).join('')}</div>`;}
function statusExplanationHtml(kind,r=recommendation()){return `<ul>${statusExplanationItems(kind,r).map(item=>`<li>${esc(item.detail)}${resolutionLinks(item.targets)}</li>`).join('')}</ul>`;}
function statusFields(r){
 const kinds={'Placement proposal':'placement','Eligibility':'eligibility','Proposed operating model':'operating'};
 return `<dl class="decision-statuses">${decisionStatuses(r).map(([label,value])=>{
  const kind=kinds[label],unresolved=kind&&value.startsWith('Unresolved');
  const text=unresolved?`<button type="button" class="status-explanation-trigger" data-status-kind="${kind}" aria-label="Why ${esc(label.toLowerCase())} is unresolved" aria-expanded="false" aria-haspopup="dialog" aria-controls="status-explanation-tooltip">Unresolved<span class="status-help-icon" aria-hidden="true">?</span></button>${esc(value.slice('Unresolved'.length))}`:esc(value);
  return `<div><dt>${esc(label)}</dt><dd class="${label==='Placement proposal'&&r.placementConflicts.length?'conflict-value':''}">${text}</dd></div>`;
 }).join('')}</dl><p class="meta">Hover over “Unresolved”, or press Enter / tap it, to see why and open links to the relevant fields or validation requirements. A placement proposal can exist while eligibility or the proposed operating model is unresolved. Questionnaire responses never establish eligibility or approval.</p>`;
}
function outstandingHtml(r){
 const categories=[...new Set(r.outstanding.map(x=>x.category))];
 return `<section class="proposal-pending outstanding-requirements" aria-label="Outstanding requirements"><h3>Outstanding requirements · missing / incomplete information</h3>${categories.length?categories.map(c=>`<div class="outstanding-group"><strong>${esc(c)}</strong><ul class="help-list">${r.outstanding.filter(x=>x.category===c).map(item=>`<li>${esc(item.detail)}${resolutionLinks(item.targets)}</li>`).join('')}</ul></div>`).join(''):`<p>Information has been supplied for the characterized requirements. Specialist evidence validation remains outstanding; eligibility is unresolved.</p>${resolutionLinks([validationTarget()])}`}</section>`;
}
function evidenceInputs(group){const fields=evidenceFields.filter(f=>group==='economics'?evidenceFields.indexOf(f)<6:group==='operations'?f.key==='operatingEvidence':f.key==='aiFlowDetails');return `<details class="evidence-inputs"><summary>Record ${group==='economics'?'economic and capacity evidence':group==='operations'?'operating capability details':'AI data-flow details'} (optional at this stage)</summary><p class="meta">Record known information or evidence references. Missing or incomplete information stays visible beside the proposal. These entries do not validate mandatory eligibility.</p>${fields.map(f=>`<div class="field line"><label for="evidence-${f.key}">${esc(f.label)}</label><div class="field-hint" id="hint-${f.key}">${esc(f.hint)}</div><textarea id="evidence-${f.key}" aria-describedby="hint-${f.key}" oninput="answer('${f.key}',this.value)">${esc(state.requirements[f.key])}</textarea></div>`).join('')}</details>`;}
function traceabilityTable(){return `<div class="rankwrap"><table class="traceability-table"><caption>Recommendation rules and limitations</caption><thead><tr><th scope="col">Rule</th><th scope="col">Basis</th><th scope="col">Implementation limit</th></tr></thead><tbody>${ruleTraceability.map(t=>`<tr><th scope="row">${t.id} · ${esc(t.rule)}</th><td>${esc(t.type)}</td><td>${esc(t.limit)}</td></tr>`).join('')}</tbody></table></div>`;}
