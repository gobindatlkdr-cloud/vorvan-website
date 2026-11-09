/**
 * VOR-002: synthetic request-level tests for actual production Edge handlers.
 * All Supabase Auth/DB responses are mocked in this isolated Deno process.
 * No real login, OTP, service credentials, database writes, or user data.
 * A passing result is NOT an authenticated production E2E approval.
 */
type Handler = (req: Request) => Promise<Response>;
function eq(actual: unknown, expected: unknown, context = "") {
  if (actual !== expected) throw new Error(context + ": expected " + String(expected) + " got " + String(actual));
}
function ok(value: unknown, message: string) { if (!value) throw new Error(message); }
const project = "https://synthetic-auth.supabase.co";
for (const [key,value] of Object.entries({
  SUPABASE_URL: project, SUPABASE_ANON_KEY: "synthetic-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-not-secret", SUPABASE_SECRET_KEYS: "{}",
})) Deno.env.set(key,value);

const ids = {owner:"00000000-0000-4000-8000-000000000001",operator:"00000000-0000-4000-8000-000000000002",
auditor:"00000000-0000-4000-8000-000000000003",blocked:"00000000-0000-4000-8000-000000000004"};
type Role = keyof typeof ids;
type Fixture = { uid:string;email:string;role:Role|null;confirmed:boolean;valid:boolean };
const fixtures = new Map<string,Fixture>();
const encode = (v:unknown) => btoa(JSON.stringify(v)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
function token(role:Role,aal:"aal1"|"aal2"="aal2",opts:{expired?:boolean;wrongSub?:boolean;unconfirmed?:boolean;valid?:boolean}={}):string {
  const uid=ids[role],exp=Math.floor(Date.now()/1000)+(opts.expired?-300:3600);
  const jwt=encode({typ:"JWT",alg:"HS256"})+"."+encode({sub:opts.wrongSub?ids.blocked:uid,aal,exp,role:"authenticated",jti:"fixture-"+fixtures.size})+".synthetic";
  fixtures.set(jwt,{uid,email:role==="owner"?"admin@vorvan.co.in":role+".synthetic@example.invalid",
    role:role==="blocked"?null:role,confirmed:!opts.unconfirmed,valid:opts.valid!==false&&!opts.expired});
  return jwt;
}
const TOK={
 owner:token("owner"),operator:token("operator"),auditor:token("auditor"),
 blocked:token("blocked"),aal1:token("owner","aal1"),expired:token("owner","aal2",{expired:true}),
 wrongSub:token("owner","aal2",{wrongSub:true}),unconfirmed:token("owner","aal2",{unconfirmed:true}),
 revoked:token("owner","aal2",{valid:false})
};
const captured: Handler[]=[];
const originalServe=Deno.serve;
(Deno as unknown as {serve:unknown}).serve=((fn:Handler)=>{
  captured.push(fn);
  return {shutdown(){},finished:Promise.resolve(),ref(){},unref(){}};
}) as typeof Deno.serve;
try {
  await import("../admin-console/index.ts");
  await import("../compliance-vault/index.ts");
  await import("../admin-mfa-recovery/index.ts");
} finally {
  (Deno as unknown as {serve:unknown}).serve=originalServe;
}
eq(captured.length,3,"captured real Deno.serve handlers");
const [admin,vault,recovery]=captured;
let writes=0,deletes=0;
function json(data:unknown,status=200):Response {
 return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});
}
function bearer(headers:Headers):string {
  const h=headers.get("authorization")||"";
  return h.startsWith("Bearer ")?h.slice(7):"";
}
globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{
 const u=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
 eq(u.origin,project,"fixture-only host");
 const h=new Headers(init?.headers), method=init?.method||"GET";
 if(u.pathname==="/auth/v1/user"){
  const f=fixtures.get(bearer(h));
  if(!f?.valid)return json({error:"invalid_or_expired"},401);
  return json({id:f.uid,email:f.email,email_confirmed_at:f.confirmed?"2026-11-01T00:00:00Z":null});
 }
 if(u.pathname==="/rest/v1/vorvan_admin_acl"){
  const email=(u.searchParams.get("email")||"").replace(/^eq\./,"");
  const f=[...fixtures.values()].find(x=>x.email===email&&x.role);
  return json(f?[{admin_role:f.role}]:[]);
 }
 if(u.pathname.includes("/auth/v1/admin/users/")&&u.pathname.endsWith("/factors"))
  return json([{id:ids.owner,factor_type:"totp",status:"verified"}]);
 if(method==="DELETE"&&u.pathname.includes("/auth/v1/admin/users/")){
  deletes++;return json({},200);
 }
 if(u.pathname.startsWith("/rest/v1/")){
  if(method==="POST"||method==="PATCH")writes++;
  if(u.pathname==="/rest/v1/vorvan_company_readiness")
   return json([{incorporation_status:"pending_incorporation",coi_issued:false,cin:null}]);
  if(u.pathname==="/rest/v1/vorvan_compliance_documents")
   return json([{doc_id:"synthetic_doc",title:"Synthetic Document",category:"corporate",stage:"pending",
    post_incorporation:false,notes:""}]);
  if(u.pathname==="/rest/v1/vorvan_compliance_files")return json([]);
  if(u.pathname==="/rest/v1/vorvan_compliance_events")return json([{id:"test_event"}]);
  if(u.pathname==="/rest/v1/vorvan_admin_tasks")
   return json(method==="GET"?[]:[{id:ids.owner,title:"Synthetic task"}]);
  return json([]);
 }
 throw new Error("Unmocked upstream path "+u.pathname);
}) as typeof fetch;

function request(path:string,method="GET",jwt?:string,body?:unknown,origin="https://vorvan.co.in"):Request{
 const headers:Record<string,string>={origin};
 if(jwt)headers.authorization="Bearer "+jwt;
 if(body!==undefined)headers["content-type"]="application/json";
 return new Request(project+"/functions/v1/"+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
}
async function check(handler:Handler,r:Request,status:number,error?:string){
 const response=await handler(r);
 eq(response.status,status,r.method+" "+r.url);
 if(error){const body=await response.json();eq(body.code,error,"response error code");}
}
Deno.test("Admin rejects no session, revoked and expired simulated Auth access tokens",async()=>{
 await check(admin,request("admin-console/overview"),401,"login_required");
 await check(admin,request("admin-console/overview","GET",TOK.revoked),401,"login_required");
 await check(admin,request("admin-console/overview","GET",TOK.expired),401,"login_required");
});
Deno.test("Admin blocks AAL1 and JWT subject mismatch",async()=>{
 await check(admin,request("admin-console/overview","GET",TOK.aal1),403,"mfa_required");
 await check(admin,request("admin-console/overview","GET",TOK.wrongSub),403,"mfa_required");
});
Deno.test("Admin blocks disabled ACL and unconfirmed identity",async()=>{
 await check(admin,request("admin-console/overview","GET",TOK.blocked),403,"admin_access_denied");
 await check(admin,request("admin-console/overview","GET",TOK.unconfirmed),403,"admin_access_denied");
});
Deno.test("Admin Owner Operator Auditor read-only overview access",async()=>{
 for(const access of [TOK.owner,TOK.operator,TOK.auditor])
  await check(admin,request("admin-console/overview","GET",access),200);
});
Deno.test("Admin Auditor cannot write; Operator can write synthetic operational task",async()=>{
 const data={area:"website",title:"Synthetic QA task"},before=writes;
 await check(admin,request("admin-console/tasks","POST",TOK.auditor,data),403,"read_only_role");
 eq(writes,before,"auditor cannot touch DB writer");
 await check(admin,request("admin-console/tasks","POST",TOK.operator,data),201);
 ok(writes>before,"operator authorized task write must reach mocked DB");
});
Deno.test("Admin unknown origin fails before action",async()=>{
 await check(admin,request("admin-console/overview","GET",TOK.owner,undefined,"https://attacker.invalid"),403,"origin_not_allowed");
});
Deno.test("Vault rejects no session, revoked or AAL1 token",async()=>{
 await check(vault,request("compliance-vault/"),401,"login_required");
 await check(vault,request("compliance-vault/","GET",TOK.revoked),401,"login_required");
 await check(vault,request("compliance-vault/","GET",TOK.aal1),403,"mfa_required");
});
Deno.test("Vault Owner Operator Auditor can read nonbinary checklist metadata",async()=>{
 for(const access of [TOK.owner,TOK.operator,TOK.auditor])
  await check(vault,request("compliance-vault/","GET",access),200);
});
Deno.test("Vault Auditor cannot patch; Operator cannot approve verified stage",async()=>{
 const before=writes;
 await check(vault,request("compliance-vault/documents/synthetic_doc","PATCH",TOK.auditor,{notes:"QA"}),403,"read_only_role");
 eq(writes,before,"auditor denied before DB write");
 await check(vault,request("compliance-vault/documents/synthetic_doc","PATCH",TOK.operator,{stage:"verified"}),403,"owner_approval_required");
});
Deno.test("Vault binary upload and download reserved for Owner",async()=>{
 for(const access of [TOK.operator,TOK.auditor]){
  await check(vault,request("compliance-vault/documents/synthetic_doc/upload","POST",access),403,
   access===TOK.auditor?"read_only_role":"owner_only_file_access");
  await check(vault,request("compliance-vault/documents/synthetic_doc/download","GET",access),403,"owner_only_file_access");
 }
});
Deno.test("Owner MFA recovery blocks anonymous and non-owner",async()=>{
 await check(recovery,request("admin-mfa-recovery","POST"),401,"login_required");
 await check(recovery,request("admin-mfa-recovery","POST",TOK.operator),403,"verified_owner_required");
});
Deno.test("Verified Owner TOTP cannot be deleted by incomplete-enrollment recovery",async()=>{
 const before=deletes;
 await check(recovery,request("admin-mfa-recovery","POST",TOK.owner),403,"verified_mfa_protected");
 eq(deletes,before,"must not delete verified MFA");
});
Deno.test("No synthetic recovery test removed a factor",()=>eq(deletes,0));
