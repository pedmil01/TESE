const acronymEntries=[
 ['AI','Artificial Intelligence','Software capabilities used for tasks such as inference, analysis, recommendations or controlled execution. The assessment distinguishes AI workloads, embedded AI and AI-enabled operations.'],
 ['API','Application Programming Interface','An interface through which solutions or automation exchange data or invoke permitted actions.'],
 ['BIA','Business Impact Analysis','An assessment of disruption impacts used to establish service criticality and continuity or recovery requirements.'],
 ['CaaS','Containers as a Service','A managed container-platform service model. It may run on-premises or in cloud; the location and operating responsibilities must be assessed separately.'],
 ['CPU','Central Processing Unit','A general-purpose processor that executes software instructions. CPU capacity is one part of solution sizing.'],
 ['DNS','Domain Name System','The service that resolves names to network addresses and other records. It can be a critical solution and recovery dependency.'],
 ['DR','Disaster Recovery','Restoring services after a major disruption. DR does not by itself establish trusted recovery after a cyber compromise. DR1–DR8 in the framework are design-requirement identifiers, not disaster-recovery levels.'],
 ['EEA','European Economic Area','The EU Member States plus Iceland, Liechtenstein and Norway. An EEA location alone does not establish control sovereignty.'],
 ['EU','European Union','The European Union. EU hosting describes location; provider jurisdiction, privileged access and control must still be assessed.'],
 ['GB','Gigabyte','A unit of digital data, normally one billion bytes. Confirm whether a supplier uses decimal GB or binary GiB when comparing capacity.'],
 ['GPU','Graphics Processing Unit','A processor designed for parallel computation, often used for AI training and inference. GPU requirements do not automatically determine cloud or on-premises placement.'],
 ['HSM','Hardware Security Module','A specialized hardware device for protecting cryptographic keys and carrying out cryptographic operations. Confirm key custody, administration and supported deployment options.'],
 ['ID','Identifier','A reference used to distinguish a solution, workload or decision record.'],
 ['IaaS','Infrastructure as a Service','A service providing infrastructure such as virtual machines, storage and networks. The customer retains responsibilities above the provider-managed infrastructure layers.'],
 ['I/O','Input/Output','Reading or writing data between a solution and resources such as storage or networks.'],
 ['OLA','Operational Level Agreement','An agreement between operational teams defining responsibilities and commitments that support the service.'],
 ['FinOps','Financial Operations','A collaborative practice for managing technology value, usage and cost, connecting engineering, finance and business decisions.'],
 ['IOPS','Input/Output Operations Per Second','A storage-performance measure counting read and write operations per second. Interpret it with operation size, latency and workload mix.'],
 ['IT','Information Technology','Computing systems, networks, software and the services used to process and manage information.'],
 ['ITSM','IT Service Management','The practices used to manage IT services, including incidents, changes and service responsibilities.'],
 ['MSP','Managed Service Provider','An external provider responsible for an agreed operational service. Delegation does not transfer institutional accountability.'],
 ['OS','Operating System','System software that manages computing resources and provides the environment in which solutions run.'],
 ['PaaS','Platform as a Service','A managed solution or data platform. The provider operates defined platform layers while the institution retains responsibilities for its solutions, data and service configuration.'],
 ['PDF','Portable Document Format','The document format used for the downloadable assessment report.'],
 ['PKI','Public Key Infrastructure','The certificates, trust services and processes used to manage public-key identities and cryptographic trust.'],
 ['RPO','Recovery Point Objective','The maximum acceptable data loss expressed as a duration. The assessment records this data-loss window in minutes. An RPO of 15 minutes means that no more than 15 minutes of recent data changes may be lost.'],
 ['RTO','Recovery Time Objective','The target maximum time to restore the service after a disruption. The assessment records this restoration time in hours. An RTO of two hours means restoration is required within two hours.'],
 ['SaaS','Software as a Service','A solution supplied as a provider-hosted service. The institution still owns tenant, data, access and assurance responsibilities within the agreed boundary.'],
 ['SLA','Service Level Agreement','An agreement defining service commitments, such as availability, support response and recovery commitments. An SLA is not evidence of tested end-to-end recovery.'],
 ['TB','Terabyte','A unit of digital data, normally one trillion bytes. Confirm whether a supplier uses decimal TB or binary TiB when comparing capacity.'],
 ['TCO','Total Cost of Ownership','The cost of an arrangement over its lifecycle, including infrastructure or subscriptions, people, support, connectivity, security, recovery and exit.'],
 ['URL','Uniform Resource Locator','The address used to locate a web page or another resource.'],
 ['UTC','Coordinated Universal Time','The time standard used for timestamps in the generated report.'],
 ['vCPU','Virtual Central Processing Unit','A virtual processor allocated to a virtual machine or computing service. Performance depends on the underlying processor and allocation model.'],
 ['VM','Virtual Machine','A software-defined computing environment running on virtualized hardware.'],
 ['WL','Workload','The abbreviation used in example workload identifiers such as WL-001. A workload is a solution or service assessed as a defined unit.'],
 ['A0','Observation','AI may access and interpret authorized operational information, without production-write permissions. This is an operational-authority category, not a maturity score.'],
 ['A1','Assistance','AI provides analytical support such as diagnostics or summaries; humans determine subsequent actions.'],
 ['A2','Recommendation','AI proposes operational actions for human assessment and decision; it does not execute production changes.'],
 ['A3','Approved Execution','AI executes a specifically authorized action through controlled interfaces after the required approval.'],
 ['A4','Bounded Autonomy','AI selects and executes predefined actions within an explicitly approved operating boundary, with oversight, auditability and suspension controls.']
].map(([term,expansion,description])=>({term,expansion,description})).sort((a,b)=>a.term.localeCompare(b.term));
const acronymLookup=new Map(acronymEntries.map(e=>[e.term,e]));
for(const [alias,term]of Object.entries({APIs:'API',CPUs:'CPU',GPUs:'GPU',HSMs:'HSM',VMs:'VM',SLAs:'SLA',CAAS:'CaaS',IAAS:'IaaS',PAAS:'PaaS',SAAS:'SaaS'}))acronymLookup.set(alias,acronymLookup.get(term));
const acronymPattern=new RegExp('\\b('+[...acronymLookup.keys()].sort((a,b)=>b.length-a.length).join('|')+')\\b','g');
function glossary(){return `<div class="card glossary"><h2>List of acronyms</h2><p>Hover over or focus an underlined term anywhere in the assessment for an explanation. Select it to open its definition here. A0–A4 describe intended operational authority.</p><div class="acronym-index">${acronymEntries.map(e=>`<a href="#acronym-${e.term}" class="acronym-index-link" data-acronym="${e.term}">${esc(e.term)}</a>`).join('')}</div><dl>${acronymEntries.map(e=>`<div class="acronym-entry" id="acronym-${e.term}" tabindex="-1"><dt><strong>${esc(e.term)}</strong><span>${esc(e.expansion)}</span></dt><dd>${esc(e.description)}</dd></div>`).join('')}</dl></div>`;}
function acronymLink(label,entry){const a=document.createElement('a');a.className='acronym-link';a.href='#acronym-'+entry.term;a.dataset.acronym=entry.term;a.textContent=label;a.setAttribute('aria-label',label+' — '+entry.expansion+'. Open definition.');return a;}
function enhanceAcronyms(root=document.getElementById('content')){
 if(!root||step===4)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];let node;
 while(node=walker.nextNode())if(!node.parentElement.closest('a,button,input,select,textarea,script,style,.glossary')&&node.textContent.trim())nodes.push(node);
 for(const node of nodes){const matches=[...node.textContent.matchAll(acronymPattern)];if(!matches.length)continue;let cursor=0;const fragment=document.createDocumentFragment();for(const m of matches){fragment.append(document.createTextNode(node.textContent.slice(cursor,m.index)),acronymLink(m[0],acronymLookup.get(m[0])));cursor=m.index+m[0].length;}fragment.append(document.createTextNode(node.textContent.slice(cursor)));node.replaceWith(fragment);}

}
function openAcronym(term){hideAcronymTip();go(4);history.replaceState(null,'','#acronym-'+term);const target=document.getElementById('acronym-'+term);if(target){target.scrollIntoView({block:'start'});target.focus({preventScroll:true});}}
let acronymTip,acronymTipAnchor;
function hideAcronymTip(){if(acronymTip)acronymTip.hidden=true;if(acronymTipAnchor)acronymTipAnchor.removeAttribute('aria-describedby');acronymTipAnchor=null;}
function showAcronymTip(anchor){const entry=acronymLookup.get(anchor.dataset.acronym);if(!entry)return;hideAcronymTip();if(!acronymTip){acronymTip=document.createElement('div');acronymTip.id='acronym-tooltip';acronymTip.className='acronym-tooltip';acronymTip.setAttribute('role','tooltip');acronymTip.addEventListener('mouseleave',hideAcronymTip);document.body.append(acronymTip);}acronymTip.textContent=entry.term+' — '+entry.expansion+'. '+entry.description+' Select to open the list of acronyms.';acronymTip.hidden=false;acronymTipAnchor=anchor;anchor.setAttribute('aria-describedby',acronymTip.id);const rect=anchor.getBoundingClientRect(),tip=acronymTip.getBoundingClientRect();acronymTip.style.left=Math.max(8,Math.min(rect.left,innerWidth-tip.width-8))+'px';acronymTip.style.top=Math.max(8,rect.bottom+tip.height+12<innerHeight?rect.bottom+8:rect.top-tip.height-8)+'px';}
document.addEventListener('click',event=>{const a=event.target.closest('a[data-acronym]');if(a&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();openAcronym(a.dataset.acronym);}});
document.addEventListener('mouseover',event=>{const a=event.target.closest('.acronym-link');if(a)showAcronymTip(a);});
document.addEventListener('mouseout',event=>{if(event.target.closest('.acronym-link')&&!acronymTip?.contains(event.relatedTarget))hideAcronymTip();});
document.addEventListener('focusin',event=>{const a=event.target.closest('.acronym-link');if(a)showAcronymTip(a);});
document.addEventListener('focusout',hideAcronymTip);
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideAcronymTip();});
window.addEventListener('scroll',hideAcronymTip,true);
window.addEventListener('resize',hideAcronymTip);
