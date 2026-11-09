/** M1 VOR-006 — actual Edge handler, synthetic Auth+PostgREST, no live credentials. */
import {NOTICE_VERSION, noticeFor} from "../customer-identity/notices.ts";
type Handler=(req:Request)=>Promise<Response>;
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+" expected "+String(b)+" got "+String(a));}
function yes(a:unknown,label:string){if(!a)throw Error(label);}
const host="https://synthetic-identity.supabase.co";
Deno.env.set("SUPABASE_URL",host);
Deno.env.set("SUPABASE_ANON_KEY","synthetic-anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","synthetic-service-key");
Deno.env.set("SUPABASE_SECRET_KEYS","{}");
Deno.env.set("VORVAN_CUSTOMER_SANDBOX_ENABLED","true");
const A="00000000-0000-4000-8000-000000000001";
const B="00000000-0000-4000-8000-000000000002";
const requestA="00000000-0000-4000-8000-000000000011";
const requestB="00000000-0000-4000-8000-000000000022";
type Fixture={uid:string;valid:boolean;emailConfirmed:boolean;anonymous:boolean;userRole:string};
const fixtures=new Map<string,Fixture>();
const base64=(x:unknown)=>btoa(JSON.stringify(x)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
function token(uid:string,options:{expired?:boolean;invalid?:boolean;unconfirmed?:boolean;anonymous?:boolean;role?:string;wrongSub?:boolean}={}){
 const jwt=base64({typ:"JWT",alg:"HS256"})+"."+base64({
   role:options.role||"authenticated",sub:options.wrongSub?B:uid,
   exp:Math.floor(Date.now()/1000)+(options.expired?-500:3600),
   is_anonymous:!!options.anonymous,jti:"synthetic-"+fixtures.size})+".fixture";
 fixtures.set(jwt,{uid,valid:!options.invalid,emailConfirmed:!options.unconfirmed,
  anonymous:!!options.anonymous,userRole:"authenticated"});
 return jwt;
}
const a=token(A),b=token(B),invalid=token(A,{invalid:true}),expired=token(A,{expired:true});
const unconfirmed=token(A,{unconfirmed:true}),anonymous=token(A,{anonymous:true});
const wrongSub=token(A,{wrongSub:true}),wrongRole=token(A,{role:"service_role"});
const captured:Handler[]=[];
const previousServe=Deno.serve;
(Deno as unknown as {serve:unknown}).serve=((fn:Handler)=>{
 captured.push(fn);return {shutdown(){},finished:Promise.resolve(),ref(){},unref(){}};
}) as typeof Deno.serve;
try{await import("../customer-identity/index.ts");}
finally{(Deno as unknown as {serve:unknown}).serve=previousServe;}
eq(captured.length,1,"captured production handler");
const handler=captured[0];
type Row={id:string;user_id:string;request_id:string;purpose:string;event_type:string;
 notice_version:string;notice_sha256:string;locale:string;created_at:string};
const rows:Row[]=[];
const profiles=new Map([[A,{id:A,locale:"bn",account_state:"active"}],
 [B,{id:B,locale:"hi",account_state:"active"}]]);
let writes=0,failWrites=false,failReads=false,backendCalls=0;
const reset=()=>{rows.length=0;writes=0;failWrites=false;failReads=false;
 profiles.set(A,{id:A,locale:"bn",account_state:"active"});
 profiles.set(B,{id:B,locale:"hi",account_state:"active"});};
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});}
function bearer(h:Headers){const v=h.get("authorization")||"";return v.startsWith("Bearer ")?v.slice(7):"";}
globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{
 const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
 eq(url.origin,host,"test must never reach production Supabase");
 backendCalls++;
 const headers=new Headers(init?.headers),method=init?.method||"GET";
 if(url.pathname==="/auth/v1/user"){
  const f=fixtures.get(bearer(headers));
  if(!f?.valid)return json({error:"invalid_token"},401);
  return json({id:f.uid,role:f.userRole,is_anonymous:f.anonymous,
   email_confirmed_at:f.emailConfirmed?"2026-11-09T00:00:00Z":null});
 }
 if(url.pathname==="/rest/v1/profiles"){
  if(failReads)return json({error:"unavailable"},503);
  const uid=(url.searchParams.get("id")||"").replace(/^eq\./,"");
  return json(profiles.has(uid)?[profiles.get(uid)]:[]);
 }
 if(url.pathname==="/rest/v1/vorvan_customer_consent_events"){
  if(failReads)return json({error:"unavailable"},503);
  const uid=(url.searchParams.get("user_id")||"").replace(/^eq\./,"");
  if(method==="GET"){
   const req=(url.searchParams.get("request_id")||"").replace(/^eq\./,"");
   const found=rows.filter(x=>x.user_id===uid&&(!req||x.request_id===req));
   return json(found.slice(-100).reverse());
  }
  if(method==="POST"){
   writes++;
   if(failWrites)return json({error:"insertion failed"},503);
   const body=JSON.parse(String(init?.body||"{}")) as Omit<Row,"id"|"created_at">;
   if(rows.some(x=>x.user_id===body.user_id&&x.request_id===body.request_id))return json([],201);
   const stored={...body,id:"00000000-0000-4000-8000-"+(rows.length+1).toString().padStart(12,"0"),
    created_at:"2026-11-09T00:00:00Z"};
   rows.push(stored);
   return json([stored],201);
  }
 }
 throw Error("Unexpected network route "+method+" "+url.pathname);
}) as typeof fetch;
const origin="https://vorvan.co.in",prefix=host+"/functions/v1/customer-identity";
function req(path:string,method="GET",access?:string,body?:unknown,opts:{origin?:string;raw?:string;type?:string}={}){
 const h:Record<string,string>={origin:opts.origin||origin};
 if(access)h.authorization="Bearer "+access;
 if(body!==undefined||opts.raw!==undefined)h["content-type"]=opts.type||"application/json";
 return new Request(prefix+path,{method,headers:h,
  body:method==="GET"||method==="OPTIONS"?undefined:opts.raw!==undefined?opts.raw:body===undefined?undefined:JSON.stringify(body)});
}
async function call(path:string,method="GET",access=a,body?:unknown,opts:{}={}){
 const r=await handler(req(path,method,access,body,opts));
 const data=await r.json() as Record<string,unknown>;
 return {status:r.status,data,headers:r.headers};
}
function consent(id=requestA,purpose="terms_acknowledgement",event_type="acknowledged",locale="bn"){
 return {purpose,event_type,locale,request_id:id,notice_version:NOTICE_VERSION,affirmative_action:true};
}
Deno.test("Verified existing active customer can get own sandbox session, not real enrollment",async()=>{
 reset();
 const r=await call("/v1/customer/session");
 eq(r.status,200);eq(r.data.user_id,A);eq(r.data.locale,"bn");
 eq(r.data.financial_services_enabled,false);eq(r.data.real_enrollment_enabled,false);
 eq(r.headers.get("cache-control"),"no-store,max-age=0");
});
Deno.test("Bearer missing, expired, invalid and forged role rejected",async()=>{
 reset();
 eq((await handler(req("/v1/customer/session"))).status,401);
 eq((await call("/v1/customer/session","GET",invalid)).status,401);
 eq((await call("/v1/customer/session","GET",expired)).status,401);
 eq((await call("/v1/customer/session","GET",wrongRole)).status,401);
});
Deno.test("Mismatched signed-in subject, unconfirmed or anonymous identity rejected",async()=>{
 reset();
 eq((await call("/v1/customer/session","GET",wrongSub)).status,403);
 eq((await call("/v1/customer/session","GET",unconfirmed)).status,403);
 eq((await call("/v1/customer/session","GET",anonymous)).status,401);
});
Deno.test("No approved profile or inactive profile cannot start customer session",async()=>{
 reset();profiles.delete(A);
 const absent=await call("/v1/customer/session");eq(absent.status,403);eq(absent.data.code,"customer_access_denied");
 profiles.set(A,{id:A,locale:"bn",account_state:"blocked"});
 const blocked=await call("/v1/customer/session");eq(blocked.status,403);
});
Deno.test("Language-specific versioned legal notices and SHA-256 digests are server-authored",async()=>{
 reset();
 for(const lang of ["en","bn","hi"]){
  const r=await call("/v1/customer/notices?locale="+lang);
  eq(r.status,200);eq(r.data.mode,"unapproved_sandbox");
  const notices=r.data.notices as Array<{locale:string;version:string;digest:string;legal_status:string;text:string;purpose:string}>;
  eq(notices.length,3);
  for(const n of notices){eq(n.locale,lang);eq(n.version,NOTICE_VERSION);eq(n.legal_status,"unapproved_sandbox");
   eq(n.digest.length,64);eq(n.digest,(await noticeFor(n.purpose as "optional_updates",lang as "en")).digest);
   yes(n.text.length>30,"substantial notice body");}
 }
});
Deno.test("Consent acknowledgement is append-only, digested, linked to auth user, and read scoped",async()=>{
 reset();
 const r=await call("/v1/customer/consents","POST",a,consent());
 eq(r.status,201);eq(r.data.idempotent,false);eq(rows.length,1);eq(rows[0].user_id,A);
 eq(rows[0].notice_version,NOTICE_VERSION);
 eq(rows[0].notice_sha256,(await noticeFor("terms_acknowledgement","bn")).digest);
 const own=await call("/v1/customer/consents","GET",a);eq(own.status,200);
 eq((own.data.events as Row[]).length,1);
 const other=await call("/v1/customer/consents","GET",b);eq((other.data.events as Row[]).length,0);
 eq(writes,1);
});
Deno.test("Idempotent replay yields same receipt, conflicting payload never overwrites",async()=>{
 reset();
 const first=await call("/v1/customer/consents","POST",a,consent());
 const receipt=await call("/v1/customer/consents","POST",a,consent());
 eq(first.status,201);eq(receipt.status,200);eq(receipt.data.idempotent,true);
 eq(first.data.event_id,receipt.data.event_id);eq(rows.length,1);eq(writes,1);
 const conflict=await call("/v1/customer/consents","POST",a,consent(requestA,"optional_updates","granted"));
 eq(conflict.status,409);eq(conflict.data.code,"idempotency_conflict");
 eq(rows.length,1);
});
Deno.test("Optional consent is separate from legal acknowledgment, withdraw is append-only",async()=>{
 reset();
 eq((await call("/v1/customer/consents","POST",a,consent(requestA,"optional_updates","granted","en"))).status,201);
 eq((await call("/v1/customer/consents","POST",a,consent(requestB,"optional_updates","withdrawn","en"))).status,201);
 eq(rows.length,2);eq(rows[0].event_type,"granted");eq(rows[1].event_type,"withdrawn");
 yes(rows[0].id!==rows[1].id,"new withdrawal event; no data mutation");
 eq((await call("/v1/customer/consents","GET",b)).data.events instanceof Array,true);
});
Deno.test("Forged user_id, invalid purpose, wrong version and no affirmative choice rejected",async()=>{
 reset();
 const cases=[
  {...consent(),user_id:B},
  {...consent(),notice_version:"live-2026"},
  {...consent(),event_type:"granted"},
  {...consent(),affirmative_action:false},
  {...consent(),purpose:"bureau_access"},
  {...consent(),email:"nope@example.invalid"}
 ];
 for(const payload of cases){
  const r=await call("/v1/customer/consents","POST",a,payload);
  eq(r.status,400);eq(r.data.code,"invalid_consent");
 }
 eq(rows.length,0);eq(writes,0);
});
Deno.test("Cross-customer URL tampering, forbidden origin, methods and routes denied",async()=>{
 reset();
 const target=await call("/v1/customer/consents?user_id="+B);eq(target.status,400);
 const o=await handler(req("/v1/customer/session","GET",a,undefined,{origin:"https://evil.invalid"}));
 eq(o.status,403);
 eq((await call("/v1/customer/session","POST",a,consent())).status,405);
 eq((await call("/v1/customer/loan-apply")).status,404);
});
Deno.test("Malformed, oversized, non-json consent bodies fail closed",async()=>{
 reset();
 const invalids=[{raw:"{"},{raw:" ".repeat(2050)},{raw:'{"purpose":"optional_updates"}',type:"text/plain"}];
 for(const opts of invalids){
  const r=await handler(req("/v1/customer/consents","POST",a,undefined,opts));
  eq(r.status,400);
 }
 eq(rows.length,0);eq(writes,0);
});
Deno.test("Database outages fail without fabricating consent receipt",async()=>{
 reset();failWrites=true;
 const failure=await call("/v1/customer/consents","POST",a,consent());
 eq(failure.status,503);eq(failure.data.code,"consent_write_unavailable");eq(rows.length,0);
 failWrites=false;failReads=true;
 const read=await call("/v1/customer/consents");
 eq(read.status,503);eq(read.data.code,"identity_service_unavailable");
});
Deno.test("Unknown request cannot reach real lender/bureau/KYC/payment API",async()=>{
 reset();
 for(const path of ["/v1/loan/submit","/v1/kyc","/v1/cibil","/v1/payments"])
  eq((await call(path)).status,404);
 yes(backendCalls>0,"handler exercised with synthetic Auth service");
});
