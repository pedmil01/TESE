import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {ingestInquiry} from '../../../lib/ai-intake.mjs';
import {AnalysisError} from '../../../lib/ai-analysis.mjs';
export const dynamic='force-dynamic';
const usage=new Map<string,{start:number,count:number,busy:boolean}>();
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 const user=await getChatGPTUser();
 if(!user)return json({code:'sign_in_required',error:'Sign in to Workload Placement Studio to use document AI auto-fill.'},401);
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return json({error:'Use auto-fill from the protected assessment site.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Send a supported inquiry.'},415);
 if(Number(request.headers.get('content-length')||0)>7300000)return json({error:'Documents exceed the 5 MB total limit.'},413);
 const now=Date.now();
 if(usage.size>1000)for(const [key,value]of usage)if(now-value.start>600000)usage.delete(key);
 let record=usage.get(user.userId);
 if(!record||now-record.start>600000){record={start:now,count:0,busy:false};usage.set(user.userId,record);}
 if(record.busy||record.count>=6)return json({code:'rate_limit',error:'An extraction is running or the request limit has been reached. Wait before trying again.'},429);
 record.busy=true;
 try{
  const raw=await request.text();
  if(raw.length>7300000)return json({error:'Documents exceed the 5 MB total limit.'},413);
  let input;try{input=JSON.parse(raw);}catch{return json({error:'The inquiry format is invalid.'},400);}
  record.count++;
  const config=env as Cloudflare.Env & {OPENAI_API_KEY?:string;OPENAI_MODEL?:string};
  return json(await ingestInquiry(input,{apiKey:config.OPENAI_API_KEY,model:config.OPENAI_MODEL||'gpt-5.4-mini'}));
 }catch(error){
  if(error instanceof AnalysisError)return json({code:error.code,error:error.message},error.status);
  return json({code:'ingestion_failed',error:'Document AI auto-fill could not be completed. Try again later.'},500);
 }finally{record.busy=false;}
}
