/** VORVAN Send SMS Auth Hook — REAL PROVIDER ADAPTER, PRODUCTION DISABLED.
 * Only the Supabase-generated OTP is sent; no independent MSG91 OTP or login JWT.
 * Incoming requests MUST be Standard Webhooks HMAC-signed by Supabase Auth.
 * No customer data stored, no secrets/OTP/phone written to logs.
 */
export interface SmsHookConfig {
  SMS_SENDER_ACTIVATED?:string;
  MSG91_DLT_APPROVED?:string;
  SUPABASE_SEND_SMS_HOOK_SECRET?:string;
  MSG91_AUTHKEY?:string;
  MSG91_FLOW_TEMPLATE_ID?:string;
  MSG91_DLT_PE_ID?:string;
  MSG91_DLT_TEMPLATE_ID?:string;
  MSG91_SENDER_ID?:string;
}
type Dependencies={fetcher?:typeof fetch; now?:()=>number};
const PHONE=/^\+91[6-9]\d{9}$/;
const CODE=/^\d{6}$/;
const CACHE_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
function reply(status:number,code:string):Response {
  return new Response(JSON.stringify(status===200?{}:{error:{http_code:status,message:code}}),
    {status,headers:CACHE_HEADERS});
}
function b64(value:string):Uint8Array|null {
  try{
    const bin=atob(value);
    if(!bin.length)return null;
    return Uint8Array.from(bin,c=>c.charCodeAt(0));
  }catch{return null;}
}
async function authentic(
  raw:string, headers:Headers, secrets:string, now:number
):Promise<boolean>{
  const id=headers.get("webhook-id");
  const ts=headers.get("webhook-timestamp");
  const header=headers.get("webhook-signature");
  if(!id||id.length>200||!ts||!/^\d{10}$/.test(ts)||!header||header.length>1500)return false;
  if(Math.abs(now/1000-Number(ts))>300)return false;
  const candidates=header.trim().split(/\s+/).filter(x=>x.startsWith("v1,")).map(x=>b64(x.slice(3))).filter((x):x is Uint8Array=>x!==null&&x.length===32);
  if(candidates.length<1||candidates.length>5)return false;
  const signed=new TextEncoder().encode(id+"."+ts+"."+raw);
  for(const entry of secrets.split("|").slice(0,3)){
    if(!entry.startsWith("v1,whsec_"))continue;
    const secret=b64(entry.slice("v1,whsec_".length));
    if(!secret||secret.length<32)continue;
    try{
      const key=await crypto.subtle.importKey("raw",secret as BufferSource,{name:"HMAC",hash:"SHA-256"},false,["verify"]);
      for(const candidate of candidates){
        if(await crypto.subtle.verify("HMAC",key,candidate as BufferSource,signed))return true;
      }
    }catch{/* bad signing configuration fails closed */}
  }
  return false;
}
async function boundedBody(req:Request):Promise<string|null>{
  const declared=Number(req.headers.get("content-length")||0);
  if(!Number.isFinite(declared)||declared>20_000||!req.body)return null;
  const reader=req.body.getReader(),parts:Uint8Array[]=[];let total=0;
  try {
    for(;;){
      const part=await reader.read();
      if(part.done)break;
      total+=part.value.length;
      if(total>20_000){await reader.cancel().catch(()=>{});return null;}
      parts.push(part.value);
    }
  }catch{return null;}finally{reader.releaseLock();}
  const buffer=new Uint8Array(total);let offset=0;
  for(const chunk of parts){buffer.set(chunk,offset);offset+=chunk.length;}
  try{return new TextDecoder("utf-8",{fatal:true}).decode(buffer);}
  catch{return null;}
}
function providerReady(c:SmsHookConfig):boolean{
  return c.SMS_SENDER_ACTIVATED==="true"&&c.MSG91_DLT_APPROVED==="true"&&
    !!c.SUPABASE_SEND_SMS_HOOK_SECRET&&
    /^[A-Za-z0-9_-]{10,200}$/.test(c.MSG91_AUTHKEY||"")&&
    /^[A-Za-z0-9_-]{8,100}$/.test(c.MSG91_FLOW_TEMPLATE_ID||"")&&
    /^\d{10,24}$/.test(c.MSG91_DLT_PE_ID||"")&&
    /^\d{10,24}$/.test(c.MSG91_DLT_TEMPLATE_ID||"")&&
    /^[A-Z0-9]{6,11}$/.test(c.MSG91_SENDER_ID||"");
}
export async function handleSmsHook(req:Request,c:SmsHookConfig,d:Dependencies={}):Promise<Response>{
  if(req.method!=="POST")return reply(405,"method_not_allowed");
  if(req.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")
    return reply(415,"invalid_content_type");
  // No sending is possible before owner-recorded DLT approvals, secrets and BOTH gates.
  if(!providerReady(c))return reply(503,"sms_sender_not_activated");
  const raw=await boundedBody(req);
  if(raw===null)return reply(413,"invalid_hook_payload");
  if(!await authentic(raw,req.headers,c.SUPABASE_SEND_SMS_HOOK_SECRET!, (d.now??Date.now)()))
    return reply(401,"invalid_hook_signature");
  let event:unknown;
  try{event=JSON.parse(raw);}catch{return reply(400,"invalid_hook_payload");}
  if(!event||typeof event!=="object"||Array.isArray(event))return reply(400,"invalid_hook_payload");
  const e=event as {user?:{phone?:unknown};sms?:{otp?:unknown}};
  const phone=e.user?.phone,otp=e.sms?.otp;
  if(typeof phone!=="string"||!PHONE.test(phone)||typeof otp!=="string"||!CODE.test(otp))
    return reply(400,"invalid_hook_payload");
  const body={
    template_id:c.MSG91_FLOW_TEMPLATE_ID!,
    short_url:"0",
    recipients:[{mobiles:phone.slice(1),OTP:otp}]
  };
  try{
    const res=await (d.fetcher??fetch)("https://control.msg91.com/api/v5/flow",{
      method:"POST",headers:{"accept":"application/json","content-type":"application/json","authkey":c.MSG91_AUTHKEY!},
      body:JSON.stringify(body),signal:AbortSignal.timeout(3500),cache:"no-store"
    });
    if(!res.ok)return reply(502,"sms_provider_rejected");
    // HTTP 200 without explicit vendor acceptance is NOT a confirmed send.
    const result:unknown=await res.json().catch(()=>null);
    if(!result||typeof result!=="object"||Array.isArray(result)||
       (result as {type?:unknown}).type!=="success")
      return reply(502,"sms_provider_rejected");
    return reply(200,"accepted");
  }catch{return reply(503,"sms_provider_unavailable");}
}
