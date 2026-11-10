/** VOR-011: test REAL Edge request handler against synthetic Auth/PostgREST and atomic audit model.
 * NO live bank details, customer records, access tokens, Supabase calls, or real emails.
 */
type Handler=(req:Request)=>Promise<Response>;
type Inquiry=Record<string,unknown>&{id:string;official_email:string;rate_digest:string;created_at:string;submission_id:string|null;request_fingerprint:string|null;status:string;review_note:string|null};
type Audit={id:string;inquiry_id:string;actor_user_id:string|null;action:string;created_at:string};
const HOST="https://vor011-synthetic.supabase.co";
const ORIGIN="https://vorvan.co.in",BASE=HOST+"/functions/v1/institutional-inquiries";
const A="10000000-0000-4000-8000-000000000001";
const B="10000000-0000-4000-8000-000000000002";
const C="10000000-0000-4000-8000-000000000003";
const sid="f0000000-0000-4000-8000-000000000011";
const sid2="f0000000-0000-4000-8000-000000000022";
const fn=()=>Date.now();
Deno.env.set("SUPABASE_URL",HOST);
Deno.env.set("SUPABASE_SECRET_KEYS","{}");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","synthetic-service-role");
Deno.env.set("SUPABASE_PUBLISHABLE_KEYS","{}");
Deno.env.set("SUPABASE_ANON_KEY","synthetic-publishable");
const encoded=(v:unknown)=>btoa(JSON.stringify(v)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const token=(uid:string,aal="aal2")=>"fixture."+encoded({sub:uid,aal})+".fixture";
const OWNER=token(A),OPERATOR=token(B),AUDITOR=token(C),AAL1=token(A,"aal1");
const roles:Record<string,string>={[A]:"owner",[B]:"operator",[C]:"auditor"};
const captured:Handler[]=[];
const originalServe=Deno.serve;
(Deno as unknown as {serve:unknown}).serve=((h:Handler)=>{captured.push(h);return {shutdown(){},finished:Promise.resolve(),ref(){},unref(){}};}) as typeof Deno.serve;
try{await import("../institutional-inquiries/index.ts");}
finally{(Deno as unknown as {serve:unknown}).serve=originalServe;}
const handler=captured[0];if(!handler)throw Error("No handler imported");
function eq(x:unknown,y:unknown,n="assert"){if(x!==y)throw Error(n+": got "+String(x)+" expected "+String(y));}
function yes(x:unknown,n:string){if(!x)throw Error(n);}
const inquiries:Inquiry[]=[],audits:Audit[]=[];
let fail={rate:false,duplicate:false,write:false,audit:false,update:false,list:false,auth:false,acl:false,unknownCommit:false};
function reset(){inquiries.length=0;audits.length=0;fail={rate:false,duplicate:false,write:false,audit:false,update:false,list:false,auth:false,acl:false,unknownCommit:false};}
const ok=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}});
let idSeq=0;
function addAudit(row:Inquiry,action:string,actor:string|null=null){
 if(fail.audit)throw Error("simulated DB audit trigger failure");
 const audit:Audit={id:"20000000-0000-4000-8000-"+(++idSeq).toString().padStart(12,"0"),inquiry_id:row.id,actor_user_id:actor,action,created_at:new Date().toISOString()};
 audits.push(audit);
}
function addRow(row:Inquiry){
 // Matches database UNIQUE submission_id and AFTER INSERT audit: rollback on audit failure.
 if(row.submission_id&&inquiries.some(x=>x.submission_id===row.submission_id))return ok({code:"23505"},409);
 try{addAudit(row,"created");}catch{return ok({code:"audit_trigger_failed"},503);}
 inquiries.push(row);return ok([row],201);
}
globalThis.fetch=(async(input:RequestInfo|URL,opts?:RequestInit):Promise<Response>=>{
 const u=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
 eq(u.origin,HOST,"forbid live network");
 const method=opts?.method||"GET",path=u.pathname;
 if(path==="/auth/v1/user"){
  if(fail.auth)return ok({message:"failure"},401);
  const tok=new Headers(opts?.headers).get("authorization")?.slice(7)||"";
  const user=Object.keys(roles).find(id=>tok===token(id)||tok===token(id,"aal1"));
  if(!user)return ok({},401);
  return ok({id:user,email:"synthetic-"+user.slice(-1)+"@example-bank.invalid",email_confirmed_at:"2026-11-01T00:00:00Z"});
 }
 if(path==="/rest/v1/vorvan_admin_acl"){
  if(fail.acl)return ok({},503);
  const email=u.searchParams.get("email")||"";
  const candidate=Object.keys(roles).find(id=>email.includes(id.slice(-1)+"@"));
  return ok(candidate?[{admin_role:roles[candidate]}]:[]);
 }
 if(path==="/rest/v1/vorvan_institutional_inquiries"){
  if(method==="GET"){
   if(fail.list)return ok({},503);
   if(u.searchParams.has("submission_id")){
    const id=(u.searchParams.get("submission_id")||"").replace(/^eq\./,"");
    return ok(inquiries.filter(x=>x.submission_id===id).slice(0,1));
   }
   if(u.searchParams.has("rate_digest")){
    if(fail.rate)return ok({},503);
    const digest=(u.searchParams.get("rate_digest")||"").replace(/^eq\./,"");
    const after=new Date((u.searchParams.get("created_at")||"").replace(/^gte\./,"")).getTime();
    return ok(inquiries.filter(x=>x.rate_digest===digest&&new Date(x.created_at).getTime()>=after).slice(0,6).map(x=>({id:x.id})));
   }
   if(u.searchParams.has("official_email")){
    if(fail.duplicate)return ok({},503);
    const email=(u.searchParams.get("official_email")||"").replace(/^eq\./,"");
    const after=new Date((u.searchParams.get("created_at")||"").replace(/^gte\./,"")).getTime();
    return ok(inquiries.filter(x=>x.official_email===email&&new Date(x.created_at).getTime()>=after).slice(0,1).map(x=>({id:x.id})));
   }
   return ok(inquiries.slice(-100).reverse());
  }
  if(method==="POST"){
   if(fail.write)return ok({},503);
   const row=JSON.parse(String(opts?.body||"{}")) as Inquiry;
   row.id="30000000-0000-4000-8000-"+(++idSeq).toString().padStart(12,"0");
   row.created_at=new Date().toISOString();row.status="new";row.review_note=null;
   const result=addRow(row);
   if(fail.unknownCommit&&result.ok){
    fail.unknownCommit=false;throw Error("network lost after DB committed");
   }
   return result;
  }
  if(method==="PATCH"){
   if(fail.update)return ok({},503);
   const id=(u.searchParams.get("id")||"").replace(/^eq\./,"");
   const idx=inquiries.findIndex(x=>x.id===id);
   if(idx===-1)return ok([],200);
   const current=inquiries[idx],next={...current,...JSON.parse(String(opts?.body||"{}"))};
   try{
    if(next.status!==current.status)addAudit(next,"status_updated",String(next.reviewer_id));
    else if(next.review_note!==current.review_note)addAudit(next,"note_updated",String(next.reviewer_id));
   }catch{return ok({},503);}
   inquiries[idx]=next;return ok([next]);
  }
 }
 if(path==="/rest/v1/vorvan_institutional_inquiry_audit"){
  if(method!=="GET")throw Error("Unexpected non-atomic direct audit write "+method);
  if(fail.list)return ok({},503);
  const inquiry=(u.searchParams.get("inquiry_id")||"").replace(/^eq\./,"");
  return ok(audits.filter(a=>a.inquiry_id===inquiry));
 }
 throw Error("Unexpected network route "+method+" "+path);
}) as typeof fetch;
function publicBody(submission_id?:string){
 const value:Record<string,unknown>={
  institution_type:"nbfc",institution_name:"Synthetic Regulated Institution",
  institution_website:"https://synthetic-institution.invalid",
  contact_name:"Fictional Representative",designation:"Partnerships Coordinator",
  official_email:"synthetic@example-bank.invalid",business_phone:"+91 2000000000",
  partnership_track:"direct_api",
  agenda:"Seeking an informational discussion about a fictional direct lender API partnership.",
  source_channel:"direct",homepage:"",consent:true
 };
 if(submission_id)value.submission_id=submission_id;
 return value;
}
function request(method="POST",access?:string,body?:unknown,query="",origin=ORIGIN){
 const headers:Record<string,string>={origin};
 if(access)headers.authorization="Bearer "+access;
 if(body!==undefined)headers["content-type"]="application/json";
 return new Request(BASE+query,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
}
async function act(method="POST",access?:string,body?:unknown,query="",origin=ORIGIN){
 const resp=await handler(request(method,access,body,query,origin));
 return {status:resp.status,data:await resp.json() as Record<string,unknown>,headers:resp.headers};
}
Deno.test("Synthetic public intake creates one inquiry AND one transactionally linked audit",async()=>{
 reset();const r=await act("POST",undefined,publicBody(sid));
 eq(r.status,201);eq(r.data.code,"received");eq(inquiries.length,1);eq(audits.length,1);
 eq(audits[0].inquiry_id,inquiries[0].id);eq(audits[0].action,"created");
 eq(inquiries[0].submission_id,sid);
 yes(/^[a-f0-9]{64}$/.test(String(inquiries[0].request_fingerprint)),"HMAC request hash");
 yes(/^[a-f0-9]{64}$/.test(String(inquiries[0].rate_digest)),"HMAC rate digest");
});
Deno.test("Identical retry returns existing receipt without duplicate audit or new row",async()=>{
 reset();const initial=await act("POST",undefined,publicBody(sid));
 const replay=await act("POST",undefined,publicBody(sid));
 eq(initial.status,201);eq(replay.status,202);eq(replay.data.replayed,true);
 eq(replay.data.reference,initial.data.reference);eq(inquiries.length,1);eq(audits.length,1);
});
Deno.test("Same submission UUID with different payload rejects conflicting replay",async()=>{
 reset();eq((await act("POST",undefined,publicBody(sid))).status,201);
 const changed={...publicBody(sid),agenda:"A different synthetic agenda for direct LSP partnership discussion without any customer information."};
 const replay=await act("POST",undefined,changed);
 eq(replay.status,409);eq(replay.data.code,"submission_conflict");eq(inquiries.length,1);
});
Deno.test("Ambiguous timeout after DB commit is retry safe",async()=>{
 reset();fail.unknownCommit=true;
 const r=await act("POST",undefined,publicBody(sid));
 eq(r.status,503);eq(inquiries.length,1);eq(audits.length,1);
 const next=await act("POST",undefined,publicBody(sid));
 eq(next.status,202);eq(inquiries.length,1);eq(audits.length,1);
});
Deno.test("Simulated audit failure atomically rejects a new inquiry; retry succeeds",async()=>{
 reset();fail.audit=true;
 const failure=await act("POST",undefined,publicBody(sid));
 eq(failure.status,503);eq(inquiries.length,0);eq(audits.length,0);
 fail.audit=false;const retry=await act("POST",undefined,publicBody(sid));
 eq(retry.status,201);eq(inquiries.length,1);eq(audits.length,1);
});
Deno.test("Spam honeypot, personal mailbox, invalid LSP track and loan/customer data fields reject",async()=>{
 reset();
 const cases=[
  {...publicBody(sid),homepage:"trap"},
  {...publicBody(sid),official_email:"demo@gmail.com"},
  {...publicBody(sid),partnership_track:"dsa"},
  {...publicBody(sid),customer_pan:"ABCDE1234F"},
  {...publicBody(sid),agenda:"too short"},
  {...publicBody(sid),institution_website:"http://localhost"},
  {...publicBody(sid),submission_id:"not-a-valid-uuid"},
 ];
 for(const bad of cases)eq((await act("POST",undefined,bad)).status,400);
 eq(inquiries.length,0);eq(audits.length,0);
});
Deno.test("Email-bucket throttle ignores spoofed forwarding headers and caps burst",async()=>{
 reset();const initial=await act("POST",undefined,publicBody(sid));
 eq(initial.status,201);
 const repeated=new Request(BASE,{method:"POST",headers:{"origin":ORIGIN,"content-type":"application/json","x-forwarded-for":"203.0.113.255"},body:JSON.stringify(publicBody(sid2))});
 const result=await handler(repeated);eq(result.status,429);
 const digest=String(inquiries[0].rate_digest);
 for(let i=1;i<5;i++)inquiries.push({...inquiries[0],id:"30000000-0000-4000-8000-"+(200+i).toString().padStart(12,"0"),created_at:new Date(fn()-30*60*1000).toISOString(),submission_id:null});
 const limit=await act("POST",undefined,publicBody(sid2));
 eq(limit.status,429);eq(limit.data.code,"rate_limited");
 eq(inquiries.filter(x=>x.rate_digest===digest).length,5);
});
Deno.test("Database throttle, duplicate query, insert failure all fail closed",async()=>{
 for(const key of ["rate","duplicate","write"] as const){
  reset();fail[key]=true;
  const r=await act("POST",undefined,publicBody(sid));
  eq(r.status,503,"failed "+key);eq(inquiries.length,0);eq(audits.length,0);
 }
});
Deno.test("Legacy public intake without submission ID remains usable with atomic DB audit",async()=>{
 reset();const r=await act("POST",undefined,publicBody());
 eq(r.status,201);eq(inquiries[0].submission_id,null);eq(audits.length,1);
 eq((await act("POST",undefined,publicBody())).status,202);
});
Deno.test("Anonymous, bad tokens and AAL1 cannot see protected staff queue",async()=>{
 reset();await act("POST",undefined,publicBody(sid));
 eq((await act("GET")).status,401);
 eq((await act("GET","non-jwt")).status,401);
 eq((await act("GET",AAL1)).status,403);
 eq((await act("GET",OWNER)).status,200);
});
Deno.test("AAL2 Owner/Operator/Auditor can read company queue, auditor cannot modify",async()=>{
 reset();await act("POST",undefined,publicBody(sid));
 for(const role of [OWNER,OPERATOR,AUDITOR]){
  const q=await act("GET",role);eq(q.status,200);eq((q.data.inquiries as Inquiry[]).length,1);
 }
 const denial=await act("PATCH",AUDITOR,{status:"reviewing"},"?id="+inquiries[0].id);
 eq(denial.status,403);eq(denial.data.code,"read_only_role");
});
Deno.test("AAL2 Operator update creates audit with reviewer; Owner can edit note; Auditor reads history",async()=>{
 reset();await act("POST",undefined,publicBody(sid));const id=inquiries[0].id;
 const first=await act("PATCH",OPERATOR,{status:"reviewing"},"?id="+id);
 eq(first.status,200);eq(inquiries[0].status,"reviewing");
 eq(audits.length,2);eq(audits[1].actor_user_id,B);eq(audits[1].action,"status_updated");
 const second=await act("PATCH",OWNER,{review_note:"Synthetic institution needs independent verification."},"?id="+id);
 eq(second.status,200);eq(audits.length,3);eq(audits[2].action,"note_updated");
 const history=await act("GET",AUDITOR,undefined,"?view=audit&id="+id);
 eq(history.status,200);eq((history.data.events as Audit[]).length,3);
 yes(!(history.data.events as Audit[]).some(x=>"official_email" in x),"audit metadata only");
});
Deno.test("Audit insertion failure rolls back operator status and stays retriable",async()=>{
 reset();await act("POST",undefined,publicBody(sid));const id=inquiries[0].id;
 fail.audit=true;
 const denied=await act("PATCH",OPERATOR,{status:"verified"},"?id="+id);
 eq(denied.status,503);eq(inquiries[0].status,"new");eq(audits.length,1);
 fail.audit=false;
 const retried=await act("PATCH",OPERATOR,{status:"verified"},"?id="+id);
 eq(retried.status,200);eq(inquiries[0].status,"verified");eq(audits.length,2);
});
Deno.test("Read-only audit query requires valid id and a verified AAL2 role",async()=>{
 reset();await act("POST",undefined,publicBody(sid));const id=inquiries[0].id;
 eq((await act("GET",undefined,undefined,"?view=audit&id="+id)).status,401);
 eq((await act("GET",AAL1,undefined,"?view=audit&id="+id)).status,403);
 eq((await act("GET",AUDITOR,undefined,"?view=audit&id=wrong")).status,400);
 eq((await act("GET",AUDITOR,undefined,"?view=audit&id="+id+"&limit=999999")).status,400);
 eq((await act("GET",OWNER,undefined,"?view=audit&id="+id)).status,200);
});
Deno.test("Forged extra query parameters and forbidden methods rejected",async()=>{
 reset();await act("POST",undefined,publicBody(sid));
 eq((await act("GET",OWNER,undefined,"?foo=bar")).status,400);
 eq((await act("PATCH",OWNER,{status:"reviewing"},"?id="+inquiries[0].id+"&role=owner")).status,400);
 eq((await act("DELETE",OWNER)).status,405);
 eq((await act("GET",OWNER,undefined,"","https://malicious.invalid")).status,403);
});
Deno.test("Unknown staff status, XSS review note and invalid UUID rejected without audit",async()=>{
 reset();await act("POST",undefined,publicBody(sid));const id=inquiries[0].id;
 const bad=[{status:"approved_lender"},{review_note:"<script>alert(1)</script>"},{foo:"bar"}];
 for(const patch of bad)eq((await act("PATCH",OWNER,patch,"?id="+id)).status,400);
 eq(audits.length,1);
});
Deno.test("ACL and Auth dependency outages deny reviewer access",async()=>{
 reset();fail.acl=true;eq((await act("GET",OWNER)).status,503);
 reset();fail.auth=true;eq((await act("GET",OWNER)).status,401);
});
Deno.test("Public responses never include raw form text or internal admin email",async()=>{
 reset();const r=await act("POST",undefined,publicBody(sid));
 eq(r.status,201);
 yes(!JSON.stringify(r.data).includes("synthetic@example-bank.invalid"),"no email echo");
 yes(!JSON.stringify(r.data).includes("admin@vorvan.co.in"),"no internal contact");
 yes(!JSON.stringify(r.data).includes("Synthetic Regulated Institution"),"no institution echo");
});
