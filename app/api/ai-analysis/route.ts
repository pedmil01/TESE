import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {generateAnalysis,AnalysisError} from '../../../lib/ai-analysis.mjs';

export const dynamic='force-dynamic';
const usage=new Map<string,{start:number,count:number,busy:boolean}>();
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
  const user=await getChatGPTUser();
  if(!user)return json({code:'sign_in_required',error:'Sign in to the protected Workload Placement Studio to use AI analysis.'},401);
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return json({code:'origin_not_allowed',error:'Generate the analysis from the protected assessment site.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Send a JSON assessment.'},415);
  if(Number(request.headers.get('content-length')||0)>200000)return json({error:'The assessment is too large.'},413);
  const now=Date.now();
  if(usage.size>1000)for(const [key,value]of usage)if(now-value.start>600000)usage.delete(key);
  let record=usage.get(user.userId);
  if(!record||now-record.start>600000){record={start:now,count:0,busy:false};usage.set(user.userId,record);}
  if(record.busy||record.count>=6)return json({code:'rate_limit',error:'An analysis is running, or the request limit has been reached. Wait before trying again.'},429);
  record.busy=true;
  try{
    const body=await request.text();
    if(body.length>180000)return json({error:'The assessment is too large. Shorten the supporting text.'},413);
    let assessment;
    try{assessment=JSON.parse(body);}catch{return json({error:'The assessment JSON is invalid.'},400);}
    record.count++;
    const config=env as Cloudflare.Env & {OPENAI_API_KEY?:string;OPENAI_MODEL?:string};
    return json(await generateAnalysis(assessment,{apiKey:config.OPENAI_API_KEY,model:config.OPENAI_MODEL||'gpt-5.4-mini'}));
  }catch(error){
    if(error instanceof AnalysisError)return json({code:error.code,error:error.message},error.status);
    return json({code:'analysis_failed',error:'The AI analysis could not be completed. Try again later.'},500);
  }finally{record.busy=false;}
}
