/** VORVAN internal admin gateway. ALL data operations require verified company email, AAL2 MFA and server-side allowlist.
 * Public GitHub Pages markup is not an authorization boundary. No lender or credit live activation endpoints. */
const PROJECT = Deno.env.get("SUPABASE_URL") ?? "";
const PUBLIC_ORIGINS = new Set([
  "https://gobindatlkdr-cloud.github.io",
  "https://vorvan.co.in",
  "https://www.vorvan.co.in"
]);
const AREAS = ["overview","partners","ai","customers","support","security","website","email","compliance"];
const STATES = ["todo","in_progress","blocked","done"];
const PRIORITIES = ["low","normal","high"];
const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
function headers(req:Request):Headers {
  const h=new Headers({"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","pragma":"no-cache","x-content-type-options":"nosniff","referrer-policy":"no-referrer","vary":"Origin"});
  const o=req.headers.get("origin");
  if(o&&PUBLIC_ORIGINS.has(o)){
    h.set("access-control-allow-origin",o);h.set("access-control-allow-methods","GET, POST, PATCH, OPTIONS");
    h.set("access-control-allow-headers","authorization, apikey, content-type");
    h.set("access-control-max-age","600");
  }
  return h;
}
function json(req:Request,status:number,data:Record<string,unknown>){return new Response(JSON.stringify(data),{status,headers:headers(req)})}
function fail(req:Request,status:number,code:string){return json(req,status,{ok:false,code})}
function credentials():Headers|null{
  try{
    const newer=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
    if(typeof newer==="string"&&newer.startsWith("sb_secret_"))return new Headers({apikey:newer,accept:"application/json"});
  }catch{ /* fallback */ }
  const older=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(older)return new Headers({apikey:older,authorization:"Bearer "+older,accept:"application/json"});
  return null;
}
async function db(path:string, method="GET",body:unknown=null):Promise<Response|null>{
  const keys=credentials();if(!keys||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(PROJECT)||!path.startsWith("/rest/v1/"))return null;
  if(body!==null){keys.set("content-type","application/json");keys.set("prefer",method==="POST"?"return=representation":"return=representation");}
  try {return await fetch(PROJECT+path,{method,headers:keys,body:body===null?undefined:JSON.stringify(body),signal:AbortSignal.timeout(6500)});}
  catch{return null;}
}
async function requestBody(req:Request):Promise<Record<string,unknown>|null>{
  if(req.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()!=="application/json"||!req.body)return null;
  const reader=req.body.getReader();const parts:Uint8Array[]=[];let size=0;
  try{
    for(;;){const n=await reader.read();if(n.done)break;size+=n.value.byteLength;if(size>2048){await reader.cancel().catch(()=>{});return null;}parts.push(n.value)}
  }catch{return null}finally{reader.releaseLock()}
  const b=new Uint8Array(size);let i=0;for(const p of parts){b.set(p,i);i+=p.byteLength}
  try{const x:unknown=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(b));return x&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:null}catch{return null}
}
type Admin={userId:string;role:string};
async function verifiedAdmin(req:Request):Promise<Admin|null|"mfa_required"|"denied"|"unavailable">{
  const authorization=req.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)||authorization.length>4200)return null;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(PROJECT))return "unavailable";
  const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
  if(!anon)return "unavailable";
  let user:Record<string,unknown>;
  try{
    const r=await fetch(PROJECT+"/auth/v1/user",{headers:{authorization,apikey:anon},signal:AbortSignal.timeout(6500)});
    if(!r.ok)return null;
    user=await r.json();
  }catch{return "unavailable"}
  const uid=user.id,email=user.email,confirmed=user.email_confirmed_at||user.confirmed_at;
  if(typeof uid!=="string"||!UUID.test(uid)||typeof email!=="string"||!confirmed)return "denied";
  const acl=await db("/rest/v1/vorvan_admin_acl?email=eq."+encodeURIComponent(email.toLowerCase())+"&enabled=is.true&select=admin_role&limit=1");
  if(!acl?.ok)return "unavailable";
  const rows:unknown=await acl.json();
  if(!Array.isArray(rows)||rows.length!==1||!["owner","operator","auditor"].includes(rows[0]?.admin_role))return "denied";
  // Platform validates JWT. Auth /user validates it again; inspect trusted validated token AAL.
  let claims:Record<string,unknown>;
  try{
    const payload=authorization.slice(7).split(".")[1];
    const norm=payload.replace(/-/g,"+").replace(/_/g,"/");
    claims=JSON.parse(atob(norm+"=".repeat((4-norm.length%4)%4)));
  }catch{return null}
  if(claims.sub!==uid||claims.aal!=="aal2")return "mfa_required";
  return {userId:uid,role:rows[0].admin_role as string};
}
function pathOf(req:Request):string|null{
  const p=new URL(req.url).pathname;
  for(const prefix of ["/functions/v1/admin-console","/admin-console"]){
    if(p===prefix||p===prefix+"/")return "/";
    if(p.startsWith(prefix+"/"))return p.slice(prefix.length).replace(/\/+$/,"")||"/";
  }
  return null;
}
const moduleInfo=[
  {id:"website",name:"Corporate Website",state:"published",help:"GitHub Pages live. vorvan.co.in custom DNS not yet confirmed."},
  {id:"partners",name:"Bank/NBFC Partner Desk",state:"enquiry_only",help:"Email enquiries; customer transactions disabled."},
  {id:"ai",name:"AI Guidance",state:"demo_only",help:"Authenticated rules-based fictional demo, not a live AI/LLM credit decision."},
  {id:"customers",name:"Customer Operations",state:"locked",help:"No live KYC, bureau data, payments or lender applications."},
  {id:"support",name:"Support",state:"manual_email",help:"Company Gmail; no customer attachments/PII."},
  {id:"security",name:"Security",state:"review_required",help:"Verified role, MFA and audit log; formal penetration test pending."},
  {id:"email",name:"Domain Email",state:"dns_pending",help:"@vorvan.co.in mailboxes are not verified or activated."},
  {id:"compliance",name:"Regulatory Review",state:"pending",help:"RBI/lender agreements and legal/privacy review outstanding."}
];
async function audit(userId:string,action:string,target:string|null){
  await db("/rest/v1/vorvan_admin_audit","POST",{actor_user_id:userId,action,target_id:target});
}
Deno.serve(async(req:Request):Promise<Response>=>{
  const origin=req.headers.get("origin");
  if(origin&&!PUBLIC_ORIGINS.has(origin))return fail(req,403,"origin_not_allowed");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
  if(!["GET","POST","PATCH"].includes(req.method))return fail(req,405,"method_not_allowed");
  const path=pathOf(req);if(!path)return fail(req,404,"not_found");
  const admin=await verifiedAdmin(req);
  if(admin===null)return fail(req,401,"login_required");
  if(admin==="mfa_required")return fail(req,403,"mfa_required");
  if(admin==="denied")return fail(req,403,"admin_access_denied");
  if(admin==="unavailable")return fail(req,503,"auth_service_unavailable");
  if(req.method!=="GET"&&admin.role!=="owner"&&admin.role!=="operator")return fail(req,403,"read_only_role");
  try{
    if(req.method==="GET"&&(path==="/"||path==="/overview")){
      const q=await db("/rest/v1/vorvan_admin_tasks?select=id,area,title,status,priority,notes,created_at,updated_at&order=updated_at.desc&limit=100");
      if(!q?.ok)return fail(req,503,"tasks_unavailable");
      const tasks=await q.json();
      const counters:Record<string,number>={todo:0,in_progress:0,blocked:0,done:0};
      if(Array.isArray(tasks))for(const t of tasks){if(t?.status in counters)counters[t.status]++}
      return json(req,200,{ok:true,role:admin.role,modules:moduleInfo,counters,tasks,domain:"vorvan.co.in",domain_connected:false,domain_email_active:false,customer_actions_enabled:false});
    }
    if(req.method==="GET"&&path==="/modules")return json(req,200,{ok:true,modules:moduleInfo});
    if(req.method==="GET"&&path==="/tasks"){
      const q=await db("/rest/v1/vorvan_admin_tasks?select=id,area,title,status,priority,notes,created_at,updated_at&order=updated_at.desc&limit=100");
      return q?.ok?json(req,200,{ok:true,tasks:await q.json()}):fail(req,503,"tasks_unavailable");
    }
    if(req.method==="GET"&&path==="/audit"){
      const q=await db("/rest/v1/vorvan_admin_audit?select=action,created_at&order=created_at.desc&limit=40");
      return q?.ok?json(req,200,{ok:true,events:await q.json()}):fail(req,503,"audit_unavailable");
    }
    if(req.method==="POST"&&path==="/tasks"){
      const x=await requestBody(req);
      if(!x||Object.keys(x).some(k=>!["area","title","notes","priority"].includes(k)))return fail(req,400,"invalid_input");
      const {area,title,notes="",priority="normal"}=x;
      if(typeof area!=="string"||!AREAS.includes(area)||typeof title!=="string"||title.trim().length<3||title.length>120||typeof notes!=="string"||notes.length>500||typeof priority!=="string"||!PRIORITIES.includes(priority))return fail(req,400,"invalid_input");
      const q=await db("/rest/v1/vorvan_admin_tasks","POST",{area,title:title.trim(),notes,priority,status:"todo",created_by:admin.userId,last_modified_by:admin.userId});
      if(!q?.ok)return fail(req,503,"write_unavailable");
      const data=await q.json();await audit(admin.userId,"task_created",data?.[0]?.id||null);
      return json(req,201,{ok:true,task:data?.[0]||null});
    }
    const match=/^\/tasks\/([\da-f-]{36})$/i.exec(path);
    if(req.method==="PATCH"&&match&&UUID.test(match[1])){
      const x=await requestBody(req);
      if(!x||!Object.keys(x).length||Object.keys(x).some(k=>!["status","notes","priority"].includes(k)))return fail(req,400,"invalid_input");
      if(x.status!==undefined&&(typeof x.status!=="string"||!STATES.includes(x.status)))return fail(req,400,"invalid_status");
      if(x.priority!==undefined&&(typeof x.priority!=="string"||!PRIORITIES.includes(x.priority)))return fail(req,400,"invalid_priority");
      if(x.notes!==undefined&&(typeof x.notes!=="string"||x.notes.length>500))return fail(req,400,"invalid_notes");
      const q=await db("/rest/v1/vorvan_admin_tasks?id=eq."+encodeURIComponent(match[1]),"PATCH",{...x,updated_at:new Date().toISOString(),last_modified_by:admin.userId});
      if(!q?.ok)return fail(req,503,"write_unavailable");
      const data=await q.json();
      if(!Array.isArray(data)||data.length!==1)return fail(req,404,"task_missing");
      await audit(admin.userId,"task_updated",match[1]);
      return json(req,200,{ok:true,task:data[0]});
    }

    // Private operational partner tracker (never handles borrower data or financial decisions).
    if(req.method==="GET"&&path==="/partners"){
      const q=await db("/rest/v1/vorvan_admin_partner_pipeline?select=id,organization_name,institution_type,partnership_track,stage,notes,updated_at&order=updated_at.desc&limit=100");
      return q?.ok?json(req,200,{ok:true,partners:await q.json()}):fail(req,503,"partners_unavailable");
    }
    if(req.method==="POST"&&path==="/partners"){
      const x=await requestBody(req);
      if(!x||Object.keys(x).some(k=>!["organization_name","institution_type","partnership_track","notes"].includes(k)))return fail(req,400,"invalid_partner_input");
      const name=x.organization_name,type=x.institution_type,track=x.partnership_track,notes=x.notes??"";
      if(typeof name!=="string"||name.trim().length<3||name.length>120||!["bank","nbfc","technology"].includes(String(type))||!["direct_lsp","direct_api"].includes(String(track))||typeof notes!=="string"||notes.length>500)return fail(req,400,"invalid_partner_input");
      const q=await db("/rest/v1/vorvan_admin_partner_pipeline","POST",{organization_name:name.trim(),institution_type:type,partnership_track:track,notes,stage:"research"});
      if(!q?.ok)return fail(req,503,"partner_write_unavailable");
      const rows=await q.json();await audit(admin.userId,"partner_record_created",rows?.[0]?.id||null);
      return json(req,201,{ok:true,partner:rows?.[0]||null});
    }
    const partnerMatch=/^\/partners\/([\da-f-]{36})$/i.exec(path);
    if(req.method==="PATCH"&&partnerMatch&&UUID.test(partnerMatch[1])){
      const x=await requestBody(req);
      if(!x||!Object.keys(x).length||Object.keys(x).some(k=>!["stage","notes"].includes(k)))return fail(req,400,"invalid_partner_update");
      if(x.stage!==undefined&&!["research","contacted","meeting","due_diligence","contracting","onboarded","paused"].includes(String(x.stage)))return fail(req,400,"invalid_partner_stage");
      if(x.notes!==undefined&&(typeof x.notes!=="string"||x.notes.length>500))return fail(req,400,"invalid_notes");
      const q=await db("/rest/v1/vorvan_admin_partner_pipeline?id=eq."+encodeURIComponent(partnerMatch[1]),"PATCH",{...x,updated_at:new Date().toISOString()});
      if(!q?.ok)return fail(req,503,"partner_write_unavailable");
      const rows=await q.json();if(!Array.isArray(rows)||rows.length!==1)return fail(req,404,"partner_not_found");
      await audit(admin.userId,"partner_record_updated",partnerMatch[1]);return json(req,200,{ok:true,partner:rows[0]});
    }
    // Internal general support desk, strictly no customer credentials or financial documents.
    if(req.method==="GET"&&path==="/support-cases"){
      const q=await db("/rest/v1/vorvan_admin_support_cases?select=id,subject,category,status,notes,updated_at&order=updated_at.desc&limit=100");
      return q?.ok?json(req,200,{ok:true,cases:await q.json()}):fail(req,503,"cases_unavailable");
    }
    if(req.method==="POST"&&path==="/support-cases"){
      const x=await requestBody(req);
      if(!x||Object.keys(x).some(k=>!["subject","category","notes"].includes(k)))return fail(req,400,"invalid_case_input");
      const title=x.subject,category=x.category,notes=x.notes??"";
      if(typeof title!=="string"||title.trim().length<3||title.length>120||!["website","partner","security","general"].includes(String(category))||typeof notes!=="string"||notes.length>500)return fail(req,400,"invalid_case_input");
      const q=await db("/rest/v1/vorvan_admin_support_cases","POST",{subject:title.trim(),category,notes,status:"open"});
      if(!q?.ok)return fail(req,503,"case_write_unavailable");
      const rows=await q.json();await audit(admin.userId,"support_case_created",rows?.[0]?.id||null);
      return json(req,201,{ok:true,case:rows?.[0]||null});
    }
    const caseMatch=/^\/support-cases\/([\da-f-]{36})$/i.exec(path);
    if(req.method==="PATCH"&&caseMatch&&UUID.test(caseMatch[1])){
      const x=await requestBody(req);
      if(!x||!Object.keys(x).length||Object.keys(x).some(k=>!["status","notes"].includes(k)))return fail(req,400,"invalid_case_update");
      if(x.status!==undefined&&!["open","in_progress","closed"].includes(String(x.status)))return fail(req,400,"invalid_case_status");
      if(x.notes!==undefined&&(typeof x.notes!=="string"||x.notes.length>500))return fail(req,400,"invalid_notes");
      const q=await db("/rest/v1/vorvan_admin_support_cases?id=eq."+encodeURIComponent(caseMatch[1]),"PATCH",{...x,updated_at:new Date().toISOString()});
      if(!q?.ok)return fail(req,503,"case_write_unavailable");
      const rows=await q.json();if(!Array.isArray(rows)||rows.length!==1)return fail(req,404,"case_not_found");
      await audit(admin.userId,"support_case_updated",caseMatch[1]);return json(req,200,{ok:true,case:rows[0]});
    }
    return fail(req,404,"route_not_found");
  }catch{return fail(req,500,"internal_error")}
});
