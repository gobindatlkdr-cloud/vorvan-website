/**
 * VORVAN Customer Identity + Consent: SOURCE-ONLY M1 VOR-006 sandbox prototype.
 * Never deploy without verify_jwt=true and explicit owner/legal go-live approval.
 * Disabled by default, no signup, KYC, credit, payment or loan routes.
 */
import {LANGUAGES, NOTICE_VERSION, PURPOSES, isDecisionAllowed, noticeFor} from "./notices.ts";
import type {Language,Purpose,Decision} from "./notices.ts";
const PROJECT=Deno.env.get("SUPABASE_URL")||"";
const ENABLED=Deno.env.get("VORVAN_CUSTOMER_SANDBOX_ENABLED")==="true";
const ORIGINS=new Set(["https://vorvan.co.in","https://www.vorvan.co.in","https://gobindatlkdr-cloud.github.io"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TABLE="vorvan_customer_consent_events";
type Row={id:string;user_id:string;request_id:string;purpose:Purpose;event_type:Decision;
 notice_version:string;notice_sha256:string;locale:Language;created_at:string};
type Customer={id:string;locale:Language};
function response(req:Request,status:number,data:Record<string,unknown>){
 const h=new Headers({"content-type":"application/json; charset=utf-8","cache-control":"no-store,max-age=0",
  "pragma":"no-cache","x-content-type-options":"nosniff","referrer-policy":"no-referrer","vary":"Origin"});
 const origin=req.headers.get("origin");
 if(origin&&ORIGINS.has(origin)){
  h.set("access-control-allow-origin",origin);
  h.set("access-control-allow-methods","GET,POST,OPTIONS");
  h.set("access-control-allow-headers","authorization,apikey,content-type");
  h.set("access-control-max-age","600");
 }
 return new Response(JSON.stringify(data),{status,headers:h});
}
function fail(req:Request,status:number,code:string){return response(req,status,{ok:false,code});}
function serviceHeaders():Headers|null{
 try{const secret=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
  if(typeof secret==="string"&&secret.startsWith("sb_secret_"))return new Headers({apikey:secret,accept:"application/json"});
 }catch{}
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 return legacy?new Headers({apikey:legacy,authorization:"Bearer "+legacy,accept:"application/json"}):null;
}
async function db(path:string,method="GET",body:unknown=null,prefer=""):Promise<Response|null>{
 const h=serviceHeaders();
 if(!h||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(PROJECT)||!path.startsWith("/rest/v1/"))return null;
 if(body!==null){h.set("content-type","application/json");h.set("prefer",prefer||"return=representation");}
 try{return await fetch(PROJECT+path,{method,headers:h,body:body===null?undefined:JSON.stringify(body),signal:AbortSignal.timeout(6500)});}
 catch{return null;}
}
function decodeJwt(token:string):Record<string,unknown>|null{
 try{const part=token.split(".")[1];if(!part)return null;
 const base=part.replace(/-/g,"+").replace(/_/g,"/");
 const data=JSON.parse(atob(base+"=".repeat((4-base.length%4)%4)));
 return data&&typeof data==="object"&&!Array.isArray(data)?data:null;
 }catch{return null;}
}
async function verifiedUser(req:Request):Promise<Customer|null|"denied"|"unavailable">{
 const authorization=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)||authorization.length>4300)return null;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(PROJECT))return "unavailable";
 const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
 if(!anon)return "unavailable";
 const claims=decodeJwt(authorization.slice(7));
 if(!claims||claims.role!=="authenticated"||typeof claims.exp!=="number"||
    claims.exp<=Math.floor(Date.now()/1000)||typeof claims.sub!=="string"||!UUID.test(claims.sub)||
    claims.is_anonymous===true)return null;
 let user:Record<string,unknown>;
 try{
  const auth=await fetch(PROJECT+"/auth/v1/user",{headers:{authorization,apikey:anon},signal:AbortSignal.timeout(6500)});
  if(!auth.ok)return null;
  user=await auth.json();
 }catch{return "unavailable";}
 if(user.id!==claims.sub||user.role!=="authenticated"||user.is_anonymous===true||
    !user.email_confirmed_at||typeof user.id!=="string")return "denied";
 // No customer enrollment route. Only a separately approved, active existing profile passes.
 const rows=await db("/rest/v1/profiles?id=eq."+encodeURIComponent(user.id)+"&select=id,locale,account_state&limit=1");
 if(!rows?.ok)return "unavailable";
 const records:unknown=await rows.json().catch(()=>null);
 if(!Array.isArray(records)||records.length!==1||records[0]?.account_state!=="active"||records[0]?.id!==user.id)return "denied";
 const lang=records[0]?.locale;
 return {id:user.id as string,locale:LANGUAGES.includes(lang)?lang as Language:"en"};
}
function route(req:Request):string|null{
 const path=new URL(req.url).pathname;
 for(const prefix of ["/functions/v1/customer-identity","/customer-identity"]){
  if(path===prefix||path===prefix+"/")return "/";
  if(path.startsWith(prefix+"/"))return path.slice(prefix.length).replace(/\/+$/,"")||"/";
 }
 return null;
}
async function bodyObject(req:Request):Promise<Record<string,unknown>|null>{
 if(req.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json"||!req.body)return null;
 const r=req.body.getReader();const parts:Uint8Array[]=[];let length=0;
 try{while(true){const next=await r.read();if(next.done)break;
    length+=next.value.byteLength;if(length>2048){await r.cancel().catch(()=>{});return null;}
    parts.push(next.value);
 }}catch{return null}finally{r.releaseLock()}
 const b=new Uint8Array(length);let o=0;for(const part of parts){b.set(part,o);o+=part.length}
 try{const obj=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(b));
  return obj&&typeof obj==="object"&&!Array.isArray(obj)?obj:null;
 }catch{return null;}
}
function parseConsent(body:Record<string,unknown>):{purpose:Purpose;event_type:Decision;locale:Language;notice_version:string;request_id:string}|null{
 const keys=Object.keys(body);
 if(keys.length!==6||!["purpose","event_type","locale","notice_version","request_id","affirmative_action"].every(x=>Object.hasOwn(body,x))||
    body.affirmative_action!==true||
    typeof body.purpose!=="string"||!PURPOSES.includes(body.purpose as Purpose)||
    typeof body.event_type!=="string"||
    typeof body.locale!=="string"||!LANGUAGES.includes(body.locale as Language)||
    body.notice_version!==NOTICE_VERSION||
    typeof body.request_id!=="string"||!UUID.test(body.request_id)||
    !isDecisionAllowed(body.purpose as Purpose,body.event_type as Decision))return null;
 return {purpose:body.purpose as Purpose,event_type:body.event_type as Decision,
   locale:body.locale as Language,notice_version:NOTICE_VERSION,request_id:body.request_id};
}
async function selectRows(userId:string,requestId?:string):Promise<Row[]|null>{
 const query="/rest/v1/"+TABLE+"?user_id=eq."+userId+
 (requestId?"&request_id=eq."+requestId:"&order=created_at.desc&limit=100")+
 "&select=id,user_id,request_id,purpose,event_type,notice_version,notice_sha256,locale,created_at";
 const r=await db(query);
 if(!r?.ok)return null;
 const x:unknown=await r.json().catch(()=>null);
 return Array.isArray(x)?x as Row[]:null;
}
function sameEvent(old:Row,record:Omit<Row,"id"|"created_at">){
 return old.user_id===record.user_id&&old.request_id===record.request_id&&old.purpose===record.purpose&&
 old.event_type===record.event_type&&old.notice_version===record.notice_version&&
 old.notice_sha256===record.notice_sha256&&old.locale===record.locale;
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(origin&&!ORIGINS.has(origin))return fail(req,403,"origin_denied");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:response(req,200,{}).headers});
 const path=route(req);
 if(!path)return fail(req,404,"not_found");
 // Explicit fail-closed feature gate, including for protected sessions.
 if(!ENABLED)return fail(req,503,"customer_sandbox_disabled");
 if(!["GET","POST"].includes(req.method))return fail(req,405,"method_not_allowed");
 if(!["/v1/customer/session","/v1/customer/notices","/v1/customer/consents"].includes(path))return fail(req,404,"not_found");
 const user=await verifiedUser(req);
 if(user===null)return fail(req,401,"login_required");
 if(user==="denied")return fail(req,403,"customer_access_denied");
 if(user==="unavailable")return fail(req,503,"identity_service_unavailable");
 if(req.method==="GET"&&path==="/v1/customer/session")
  return response(req,200,{ok:true,mode:"synthetic_sandbox_only",user_id:user.id,locale:user.locale,
   account_state:"active",financial_services_enabled:false,real_enrollment_enabled:false});
 if(req.method==="GET"&&path==="/v1/customer/notices"){
  const params=new URL(req.url).searchParams;
  if([...params.keys()].some(k=>k!=="locale"))return fail(req,400,"invalid_query");
  const value=params.get("locale")||user.locale;
  if(!LANGUAGES.includes(value as Language))return fail(req,400,"invalid_locale");
  const notices=await Promise.all(PURPOSES.map(p=>noticeFor(p,value as Language)));
  return response(req,200,{ok:true,mode:"unapproved_sandbox",notices});
 }
 if(req.method==="GET"&&path==="/v1/customer/consents"){
  const rows=await selectRows(user.id);
  if(rows===null)return fail(req,503,"consent_read_unavailable");
  return response(req,200,{ok:true,mode:"synthetic_sandbox_only",
   events:rows.map(x=>({id:x.id,purpose:x.purpose,event_type:x.event_type,notice_version:x.notice_version,
      notice_sha256:x.notice_sha256,locale:x.locale,request_id:x.request_id,created_at:x.created_at})),
   max_events:100});
 }
 if(req.method==="POST"&&path==="/v1/customer/consents"){
  const body=await bodyObject(req);
  if(!body)return fail(req,400,"invalid_input");
  const input=parseConsent(body);
  if(!input)return fail(req,400,"invalid_consent");
  const notice=await noticeFor(input.purpose,input.locale);
  const record={...input,user_id:user.id,notice_sha256:notice.digest};
  const existing=await selectRows(user.id,input.request_id);
  if(existing===null)return fail(req,503,"consent_read_unavailable");
  if(existing.length){
   if(!sameEvent(existing[0],record))return fail(req,409,"idempotency_conflict");
   return response(req,200,{ok:true,idempotent:true,event_id:existing[0].id,
    purpose:record.purpose,event_type:record.event_type,notice_version:record.notice_version});
  }
  // Conflict-safe insertion: unique(user_id,request_id) prevents double writes.
  const url="/rest/v1/"+TABLE+"?on_conflict=user_id,request_id&select=id,user_id,request_id,purpose,event_type,notice_version,notice_sha256,locale,created_at";
  const stored=await db(url,"POST",record,"resolution=ignore-duplicates,return=representation");
  if(!stored?.ok)return fail(req,503,"consent_write_unavailable");
  const data:unknown=await stored.json().catch(()=>null);
  if(!Array.isArray(data))return fail(req,503,"consent_write_unavailable");
  const row=data.length===1?data[0] as Row:(await selectRows(user.id,input.request_id))?.[0];
  if(!row)return fail(req,503,"consent_write_unavailable");
  if(!sameEvent(row,record))return fail(req,409,"idempotency_conflict");
  return response(req,data.length?201:200,{ok:true,idempotent:data.length===0,event_id:row.id,
   purpose:row.purpose,event_type:row.event_type,notice_version:row.notice_version});
 }
 return fail(req,405,"method_not_allowed");
});
