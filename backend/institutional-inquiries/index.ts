// VORVAN institutional inquiry endpoint: public intake + MFA-only staff review.
// No customer/loan information, no partner account creation, no secret in browser.
const BASE=Deno.env.get("SUPABASE_URL")||"https://kukfpsqujlutlgwndplh.supabase.co";
const ORIGINS=new Set(["https://vorvan.co.in","https://www.vorvan.co.in","https://gobindatlkdr-cloud.github.io"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL=/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PERSONAL=new Set(["gmail.com","yahoo.com","yahoo.co.in","hotmail.com","outlook.com","live.com","icloud.com","proton.me","rediffmail.com","aol.com","mail.com"]);
const text=(v,max)=>typeof v==="string"?v.trim().replace(/\s+/g," ").slice(0,max+1):"";
function secret(){
  try{const s=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;if(typeof s==="string"&&s.startsWith("sb_secret_"))return s;}catch{}
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
}
function publicKey(){
  try{const p=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default;if(typeof p==="string")return p;}catch{}
  return Deno.env.get("SUPABASE_ANON_KEY")||"";
}
function headers(req){
  const h=new Headers({"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","vary":"Origin"});
  const o=req.headers.get("origin");
  if(o&&ORIGINS.has(o)){h.set("access-control-allow-origin",o);h.set("access-control-allow-methods","POST, GET, PATCH, OPTIONS");h.set("access-control-allow-headers","content-type, authorization, apikey");h.set("access-control-max-age","600");}
  return h;
}
function response(req,status,body){return new Response(JSON.stringify(body),{status,headers:headers(req)});}
async function db(path,method="GET",data){
  const key=secret();if(!key||!BASE.startsWith("https://")||!path.startsWith("/rest/v1/"))throw Error("db_unavailable");
  const h=new Headers({apikey:key,accept:"application/json"});
  if(!key.startsWith("sb_secret_"))h.set("authorization","Bearer "+key);
  if(data!==undefined){h.set("content-type","application/json");h.set("prefer","return=representation");}
  return fetch(BASE+path,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(8000)});
}
async function jsonBody(req){
  if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return null;
  const n=Number(req.headers.get("content-length")||"0");if(n>8192)return null;
  if(!req.body)return null;
  const reader=req.body.getReader();const parts=[];let size=0;
  try{
    for(;;){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>8192){await reader.cancel().catch(()=>{});return null;}parts.push(x.value);}
  }catch{return null;}finally{reader.releaseLock();}
  const buf=new Uint8Array(size);let offset=0;for(const p of parts){buf.set(p,offset);offset+=p.length;}
  try{const obj=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buf));return obj&&typeof obj==="object"&&!Array.isArray(obj)?obj:null;}catch{return null;}
}
function goodValue(s,min,max){return typeof s==="string"&&s.length>=min&&s.length<=max&&!/[\u0000-\u001f<>]/.test(s);}
function intake(x){
  if(!x||Object.keys(x).some(k=>!["institution_type","institution_name","institution_website","contact_name","designation","official_email","business_phone","partnership_track","agenda","source_channel","consent","homepage"].includes(k)))return null;
  if(x.homepage)return null;
  if(x.consent!==true)return null;
  const p={
    institution_type:text(x.institution_type,10).toLowerCase(),
    institution_name:text(x.institution_name,140),
    institution_website:text(x.institution_website,240),
    contact_name:text(x.contact_name,100),
    designation:text(x.designation,120),
    official_email:text(x.official_email,160).toLowerCase(),
    business_phone:text(x.business_phone||"",30),
    partnership_track:text(x.partnership_track,20),
    agenda:typeof x.agenda==="string"?x.agenda.trim().slice(0,1201):"",
    source_channel:text(x.source_channel||"unknown",20)
  };
  if(!["bank","nbfc"].includes(p.institution_type)||!["direct_lsp","direct_api","both"].includes(p.partnership_track)||!["google","linkedin","email","direct","other","unknown"].includes(p.source_channel))return null;
  if(!goodValue(p.institution_name,3,140)||!goodValue(p.contact_name,2,100)||!goodValue(p.designation,2,120)||!goodValue(p.agenda,20,1200)||p.business_phone.length>30)return null;
  if(!EMAIL.test(p.official_email)||PERSONAL.has(p.official_email.split("@")[1]))return null;
  if(p.business_phone&&!/^[+()0-9 -]{6,30}$/.test(p.business_phone))return null;
  try{const u=new URL(p.institution_website);if(u.protocol!=="https:"||u.username||u.password||u.port||u.hostname==="localhost"||!u.hostname.includes(".")||u.hostname.length>150)return null;}catch{return null;}
  return p;
}
async function digest(req,email){
  const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip")||"").split(",")[0].trim().slice(0,100);
  const key=secret();if(!key)throw Error("secret_unavailable");
  const cryptoKey=await crypto.subtle.importKey("raw",new TextEncoder().encode(key),"HMAC",false,["sign"]);
  const signed=await crypto.subtle.sign("HMAC",cryptoKey,new TextEncoder().encode("iinq-v1|"+(ip||"no-ip:"+email)));
  return [...new Uint8Array(signed)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function admin(req){
  const auth=req.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth)||auth.length>4200)return {error:"login_required",status:401};
  const pk=publicKey();if(!pk)return {error:"auth_unavailable",status:503};
  const r=await fetch(BASE+"/auth/v1/user",{headers:{authorization:auth,apikey:pk},signal:AbortSignal.timeout(8000)});
  if(!r.ok)return {error:"login_required",status:401};
  const u=await r.json();if(!UUID.test(u.id||"")||!u.email||!(u.email_confirmed_at||u.confirmed_at))return {error:"admin_denied",status:403};
  const q=await db("/rest/v1/vorvan_admin_acl?email=eq."+encodeURIComponent(u.email.toLowerCase())+"&enabled=is.true&select=admin_role&limit=1");
  if(!q.ok)return {error:"auth_unavailable",status:503};
  const acl=await q.json();if(!Array.isArray(acl)||acl.length!==1||!["owner","operator","auditor"].includes(acl[0]?.admin_role))return {error:"admin_denied",status:403};
  let claims;
  try{const segment=auth.slice(7).split(".")[1].replace(/-/g,"+").replace(/_/g,"/");claims=JSON.parse(atob(segment+"=".repeat((4-segment.length%4)%4)));}catch{return {error:"login_required",status:401};}
  if(claims.sub!==u.id||claims.aal!=="aal2")return {error:"mfa_required",status:403};
  return {id:u.id,role:acl[0].admin_role};
}
Deno.serve(async(req)=>{
  const origin=req.headers.get("origin");
  if(origin&&!ORIGINS.has(origin))return response(req,403,{ok:false,code:"origin_denied"});
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
  if(!["POST","GET","PATCH"].includes(req.method))return response(req,405,{ok:false,code:"method_not_allowed"});
  try{
    if(req.method==="POST"){
      const body=await jsonBody(req);const p=intake(body);
      if(!p)return response(req,400,{ok:false,code:"invalid_institutional_inquiry"});
      const rate_digest=await digest(req,p.official_email);
      const hour=new Date(Date.now()-60*60*1000).toISOString();
      const q=await db("/rest/v1/vorvan_institutional_inquiries?rate_digest=eq."+rate_digest+"&created_at=gte."+encodeURIComponent(hour)+"&select=id&limit=6");
      if(!q.ok)return response(req,503,{ok:false,code:"intake_unavailable"});
      const rows=await q.json();if(Array.isArray(rows)&&rows.length>=5)return response(req,429,{ok:false,code:"rate_limited"});
      const recent=new Date(Date.now()-15*60*1000).toISOString();
      const duplicate=await db("/rest/v1/vorvan_institutional_inquiries?official_email=eq."+encodeURIComponent(p.official_email)+"&created_at=gte."+encodeURIComponent(recent)+"&select=id&limit=1");
      if(!duplicate.ok)return response(req,503,{ok:false,code:"intake_unavailable"});
      const existing=await duplicate.json();
      if(Array.isArray(existing)&&existing.length)return response(req,202,{ok:true,code:"received"});
      const saved=await db("/rest/v1/vorvan_institutional_inquiries","POST",{...p,business_phone:p.business_phone||null,rate_digest});
      if(!saved.ok)return response(req,503,{ok:false,code:"save_failed"});
      const result=await saved.json();const id=result?.[0]?.id;
      if(typeof id==="string")await db("/rest/v1/vorvan_institutional_inquiry_audit","POST",{inquiry_id:id,action:"created"}).catch(()=>{});
      return response(req,201,{ok:true,code:"received",reference:typeof id==="string"?id.slice(0,8):null});
    }
    const user=await admin(req);
    if("error" in user)return response(req,user.status,{ok:false,code:user.error});
    if(req.method==="GET"){
      const fields="id,institution_type,institution_name,institution_website,contact_name,designation,official_email,business_phone,partnership_track,agenda,source_channel,status,review_note,created_at,updated_at";
      const q=await db("/rest/v1/vorvan_institutional_inquiries?select="+fields+"&order=created_at.desc&limit=100");
      if(!q.ok)return response(req,503,{ok:false,code:"list_unavailable"});
      return response(req,200,{ok:true,inquiries:await q.json()});
    }
    if(user.role==="auditor")return response(req,403,{ok:false,code:"read_only_role"});
    const id=new URL(req.url).searchParams.get("id")||"";
    if(!UUID.test(id))return response(req,400,{ok:false,code:"invalid_inquiry_id"});
    const body=await jsonBody(req);
    if(!body||!Object.keys(body).length||Object.keys(body).some(k=>!["status","review_note"].includes(k)))return response(req,400,{ok:false,code:"invalid_review"});
    const patch={updated_at:new Date().toISOString(),reviewer_id:user.id};
    if(body.status!==undefined){
      if(!["new","reviewing","verified","contacted","closed","rejected"].includes(body.status))return response(req,400,{ok:false,code:"invalid_status"});
      patch.status=body.status;
    }
    if(body.review_note!==undefined){
      if(typeof body.review_note!=="string"||body.review_note.length>500||/[\u0000-\u001f<>]/.test(body.review_note))return response(req,400,{ok:false,code:"invalid_note"});
      patch.review_note=body.review_note.trim();
    }
    const upd=await db("/rest/v1/vorvan_institutional_inquiries?id=eq."+encodeURIComponent(id),"PATCH",patch);
    if(!upd.ok)return response(req,503,{ok:false,code:"update_unavailable"});
    const rows=await upd.json();if(!Array.isArray(rows)||rows.length!==1)return response(req,404,{ok:false,code:"inquiry_not_found"});
    await db("/rest/v1/vorvan_institutional_inquiry_audit","POST",{inquiry_id:id,actor_user_id:user.id,action:body.status?"status_updated":"note_updated"}).catch(()=>{});
    return response(req,200,{ok:true,inquiry:rows[0]});
  }catch(e){console.error("institutional-inquiries",String(e));return response(req,503,{ok:false,code:"temporarily_unavailable"});}
});