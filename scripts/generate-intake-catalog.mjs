import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({fetch:()=>new Promise(()=>{})});
for(const file of ['decision-context.js','app.js'])vm.runInContext(readFileSync(new URL('../studio/'+file,import.meta.url),'utf8'),ctx);
const catalog=vm.runInContext(`(()=>{
 const entries=[];
 const add=(section,key,label,hint,options)=>entries.push({field:section+'.'+key,label,hint,...(options?{options:Object.fromEntries(options)}:{})});
 for(const [key,q]of Object.entries(profileOptions))add('application',key,q.label,q.hint,q.options);
 for(const key of ['id','name','owner','classificationNotes','capability','rto','rpo','jurisdiction','latency','dependencies','needs']){
  const h=workloadHints[key]||applicationTextHints[key];
  add('application',key,key==='rto'?'RTO — hours':key==='rpo'?'RPO — minutes':key,h.hint);
 }
 for(const q of questions)add('requirements',q.key,q.label,q.hint,q.options);
 for(const q of evidenceFields)add('requirements',q.key,q.label,q.hint,q.options);
 for(const [key,h]of Object.entries(decisionHints))add('decision',key,key,h.hint);
 return entries;
})()`,ctx);
writeFileSync(new URL('../lib/ai-intake-catalog.json',import.meta.url),JSON.stringify(catalog,null,2)+'\n');
console.log('AI ingestion catalog synchronized: '+catalog.length+' fields.');
