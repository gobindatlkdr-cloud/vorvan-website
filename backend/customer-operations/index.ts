/** VORVAN Customer Operations: SERVER-VERIFIED AAL2 OWNER ONLY.
 * Manual non-binding loan enquiries, verified contact data. No CIBIL or lending API.
 * Not a public submission endpoint. User writes use Supabase RLS directly.
 */
const URL=Deno.env.get("SUPABASE_URL")??"";
const ORIGINS=new Set(["https://vorvan.co.in","https://www.vorvan.co.in","https://gobindatlkdr-cloud.github.io"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES=["received","reviewing","needs_information","closed"];
const TO:Record<string,string[]>={
 received:["reviewing","needs_information","closed"],
 reviewing:["needs_information","closed"],
 needs_information:["reviewing","closed"],
 closed:[]
};
function headers(request:Request){
 const h=new Headers({
  "content-type":"application/json; charset=utf-8","cache-control":"private, no-store, max-age=0",
  "pragma":"no-cache","x-content-type-options":"nosniff","referrer-policy":"no-referrer","vary":"Origin"
 });
 const origin=request.headers.get("origin");
 if(origin&&ORIGINS.has(origin)){
  h.set("access-control-allow-origin",origin);
  h.set("access-control-allow-methods","GET, PATCH, OPTIONS");
  h.set("access-control-allow-headers","authorization, apikey, content-type");
  h.set("access-control-max-age","300");
 }
 return h;
}
function json(req:Request,status:number,body:Record<string,unknown>){
 return new Response(JSON.stringify(body),{status,headers:headers(req)});
}
const deny=(r:Request,status:number,code:string)=>json(r,status,{ok:false,code});
function serviceHeaders(){
 try{
  const value=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
  if(typeof value==="string"&&value.startsWith("sb_secret_"))
   return new Headers({apikey:value,accept:"application/json"});
 }catch{/* legacy fallback */}
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 return legacy?new Headers({apikey:legacy,authorization:"Bearer "+legacy,accept:"application/json"}):null;
}
async function service(path:string,method="GET",payload:unknown=null){
 const h=serviceHeaders();
 if(!h||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(URL)||!path.startsWith("/rest/v1/"))return null;
 if(payload!==null){h.set("content-type","application/json");h.set("prefer","return=representation")}
 try{return await fetch(URL+path,{method,headers:h,body:payload===null?undefined:JSON.stringify(payload),
  signal:AbortSignal.timeout(7000),cache:"no-store"})}catch{return null}
}
async function verifiedOwner(req:Request):Promise<string|"mfa_required"|"denied"|"unavailable"|null>{
 const authorization=req.headers.get("authorization")??"";
 if(authorization.length>4100||!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization))return null;
 const pub=Deno.env.get("SUPABASE_ANON_KEY")??"";
 if(!pub||!URL)return "unavailable";
 let user:Record<string,unknown>;
 try{
  const r=await fetch(URL+"/auth/v1/user",{
    headers:{apikey:pub,authorization},signal:AbortSignal.timeout(7000),cache:"no-store"
  });
  if(!r.ok)return null;
  user=await r.json();
 }catch{return "unavailable"}
 const uid=user.id,email=user.email;
 if(typeof uid!=="string"||!UUID.test(uid)||typeof email!=="string"||
   !(user.email_confirmed_at||user.confirmed_at))return "denied";
 const acl=await service("/rest/v1/vorvan_admin_acl?email=eq."+
  encodeURIComponent(email.trim().toLowerCase())+"&enabled=is.true&select=admin_role&limit=1");
 if(!acl?.ok)return "unavailable";
 const rows=await acl.json();
 if(!Array.isArray(rows)||rows.length!==1||rows[0]?.admin_role!=="owner")return "denied";
 let claims:Record<string,unknown>;
 try{
  const b64=authorization.slice(7).split(".")[1];
  const norm=b64.replace(/-/g,"+").replace(/_/g,"/");
  claims=JSON.parse(atob(norm+"=".repeat((4-norm.length%4)%4)));
 }catch{return null}
 if(claims.sub!==uid||claims.aal!=="aal2")return "mfa_required";
 return uid;
}
function path(req:Request){
 const p=new globalThis.URL(req.url).pathname;
 for(const prefix of ["/functions/v1/customer-operations","/customer-operations"]){
  if(p===prefix)return "/";
  if(p.startsWith(prefix+"/"))return p.slice(prefix.length).replace(/\/+$/,"")||"/";
 }
 return null;
}
async function body(req:Request){
 if(req.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json"||!req.body)return null;
 const chunks:Uint8Array[]=[];let size=0,reader=req.body.getReader();
 try{
  while(true){
   const chunk=await reader.read();if(chunk.done)break;
   size+=chunk.value.byteLength;
   if(size>1400){await reader.cancel();return null}chunks.push(chunk.value);
  }
 }catch{return null}finally{reader.releaseLock()}
 const array=new Uint8Array(size);let index=0;
 for(const chunk of chunks){array.set(chunk,index);index+=chunk.length}
 try{
  const obj:unknown=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(array));
  return obj&&typeof obj==="object"&&!Array.isArray(obj)?obj as Record<string,unknown>:null;
 }catch{return null}
}
const exact=(input:Record<string,unknown>,keys:string[])=>
 Object.keys(input).length===keys.length&&keys.every(x=>Object.hasOwn(input,x));
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(origin&&!ORIGINS.has(origin))return deny(req,403,"origin_not_allowed");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
 if(!["GET","PATCH"].includes(req.method))return deny(req,405,"method_not_allowed");
 const route=path(req);if(!route)return deny(req,404,"not_found");
 const owner=await verifiedOwner(req);
 if(owner===null)return deny(req,401,"login_required");
 if(owner==="mfa_required")return deny(req,403,"mfa_required");
 if(owner==="denied")return deny(req,403,"owner_only");
 if(owner==="unavailable")return deny(req,503,"auth_unavailable");
 if(req.method==="GET"&&route==="/enquiries"){
  const q=await service("/rest/v1/vorvan_customer_enquiries?select="+
   "id,user_id,loan_category,enquiry_topic,message,status,staff_reply,created_at,updated_at"+
   "&order=created_at.desc&limit=80");
  if(!q?.ok)return deny(req,503,"enquiry_queue_unavailable");
  const enquiries=await q.json();
  if(!Array.isArray(enquiries))return deny(req,503,"invalid_queue_response");
  const ids=[...new Set(enquiries.map(x=>x.user_id).filter(x=>typeof x==="string"&&UUID.test(x)))];
  let profiles:unknown[]=[];
  if(ids.length){
   const p=await service("/rest/v1/vorvan_customer_intake_profiles?select="+
    "user_id,full_name,email,phone,work_category,work_details,consent_version,consent_accepted_at"+
    "&user_id=in.("+ids.join(",")+")&limit=80");
   if(!p?.ok)return deny(req,503,"profile_queue_unavailable");
   profiles=await p.json();
   if(!Array.isArray(profiles))return deny(req,503,"invalid_profile_response");
  }
  const lookup=new Map(profiles.map((x:any)=>[x.user_id,x]));
  const joined=enquiries.map(x=>({...x,profile:lookup.get(x.user_id)??null}));
  return json(req,200,{ok:true,owner_only:true,items:joined,limited_to:80,
    real_credit_scores:0,loan_approvals:0,loan_disbursements:0});
 }
 const match=/^\/enquiries\/([0-9a-f-]{36})$/i.exec(route);
 if(req.method==="PATCH"&&match&&UUID.test(match[1])){
  const input=await body(req);
  if(!input||!exact(input,["status","staff_reply","expected_updated_at"])||
    typeof input.status!=="string"||!STATUSES.includes(input.status)||
    typeof input.staff_reply!=="string"||input.staff_reply.length>500||
    /[<>\x00-\x1f]/.test(input.staff_reply)||
    /[0-9]{12}|[A-Z]{5}[0-9]{4}[A-Z]/.test(input.staff_reply.toUpperCase())||
    typeof input.expected_updated_at!=="string"||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|\+00:00)$/.test(input.expected_updated_at))
    return deny(req,400,"invalid_review_fields");
  const id=match[1];
  const read=await service("/rest/v1/vorvan_customer_enquiries?id=eq."+id+
   "&select=id,status,staff_reply,updated_at&limit=1");
  if(!read?.ok)return deny(req,503,"enquiry_not_available");
  const current=await read.json();
  if(!Array.isArray(current)||current.length!==1)return deny(req,404,"enquiry_not_found");
  const row=current[0];
  if(row.updated_at!==input.expected_updated_at)return deny(req,409,"stale_review_revision");
  if(!TO[row.status]?.includes(input.status))return deny(req,409,"invalid_review_transition");
  const update=await service("/rest/v1/vorvan_customer_enquiries?id=eq."+id+
   "&updated_at=eq."+encodeURIComponent(row.updated_at)+"&status=eq."+row.status,"PATCH",{
     status:input.status,staff_reply:input.staff_reply,updated_by_admin:owner
   });
  if(!update?.ok)return deny(req,503,"review_write_unavailable");
  const updated=await update.json();
  if(!Array.isArray(updated)||updated.length!==1)return deny(req,409,"concurrent_review_conflict");
  // Database trigger atomically writes a private event. If it fails, update fails too.
  return json(req,200,{ok:true,item:{
   id:updated[0].id,status:updated[0].status,staff_reply:updated[0].staff_reply,
   updated_at:updated[0].updated_at},manual_information_only:true,loan_approved:false});
 }
 return deny(req,404,"not_found");
});
