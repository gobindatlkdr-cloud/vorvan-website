/** VORVAN Step 12D — private corporate compliance vault.
 * Operator/owner access requires server-verified Supabase user, approved ACL, and AAL2 MFA.
 * No secret is shipped to GitHub Pages. This function does NOT activate lending.
 */
const BASE=Deno.env.get("SUPABASE_URL")||"";
const ORIGINS=new Set(["https://vorvan.co.in","https://www.vorvan.co.in","https://gobindatlkdr-cloud.github.io"]);
const BUCKET="vorvan-company-private";
const LIMIT=8388608;
const ID=/^[a-z][a-z0-9_]{2,55}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGES=new Set(["pending","draft","under_review","verified","blocked"]);
type Admin={uid:string,role:string};
function headers(req:Request):Headers{
 const h=new Headers({"content-type":"application/json; charset=utf-8","cache-control":"no-store, no-cache, must-revalidate","pragma":"no-cache","x-content-type-options":"nosniff","referrer-policy":"no-referrer","vary":"Origin","x-frame-options":"DENY"});
 const o=req.headers.get("origin");
 if(o&&ORIGINS.has(o)){h.set("access-control-allow-origin",o);h.set("access-control-allow-methods","GET, POST, PATCH, OPTIONS");h.set("access-control-allow-headers","authorization, apikey, content-type");h.set("access-control-max-age","600")}
 return h;
}
function respond(req:Request,status:number,value:Record<string,unknown>){return new Response(JSON.stringify(value),{status,headers:headers(req)})}
function deny(req:Request,status:number,code:string){return respond(req,status,{ok:false,code})}
function serverHeaders():Headers|null{
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(legacy)return new Headers({"apikey":legacy,"authorization":"Bearer "+legacy});
 try{const k=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
  if(typeof k==="string"&&k.startsWith("sb_secret_"))return new Headers({apikey:k});
 }catch{/* no available key */}
 return null;
}
async function internal(path:string,method="GET",data?:unknown):Promise<Response|null>{
 const h=serverHeaders();
 if(!h||!BASE.startsWith("https://")||!path.startsWith("/rest/v1/"))return null;
 h.set("accept","application/json");
 if(data!==undefined){h.set("content-type","application/json");h.set("prefer","return=representation")}
 try{return await fetch(BASE+path,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(10000)})}
 catch{return null}
}
async function storage(path:string,method:string,content?:Uint8Array,mime?:string):Promise<Response|null>{
 const h=serverHeaders();
 if(!h||!BASE.startsWith("https://"))return null;
 if(content){h.set("content-type",mime||"application/octet-stream");h.set("x-upsert","false")}
 try{return await fetch(BASE+"/storage/v1/"+path,{method,headers:h,body:content?new Blob([Uint8Array.from(content).buffer]):undefined,signal:AbortSignal.timeout(15000)})}
 catch{return null}
}
async function authorised(req:Request):Promise<Admin|null|"mfa"|"denied"|"offline">{
 const auth=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth)||auth.length>4200)return null;
 const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
 if(!anon)return "offline";
 let user:Record<string,unknown>;
 try{const r=await fetch(BASE+"/auth/v1/user",{headers:{authorization:auth,apikey:anon},signal:AbortSignal.timeout(8000)});
   if(!r.ok)return null;user=await r.json();
 }catch{return "offline"}
 const uid=user.id,email=user.email;
 if(typeof uid!=="string"||!UUID.test(uid)||typeof email!=="string"||!user.email_confirmed_at&&!user.confirmed_at)return "denied";
 const r=await internal("/rest/v1/vorvan_admin_acl?email=eq."+encodeURIComponent(email.toLowerCase())+"&enabled=is.true&select=admin_role&limit=1");
 if(!r?.ok)return "offline";
 const rows=await r.json().catch(()=>[]);
 if(!Array.isArray(rows)||rows.length!==1||!["owner","operator","auditor"].includes(rows[0]?.admin_role))return "denied";
 try{
  const encoded=auth.slice(7).split(".")[1],norm=encoded.replace(/-/g,"+").replace(/_/g,"/");
  const jwt=JSON.parse(atob(norm+"=".repeat((4-norm.length%4)%4)));
  if(jwt.sub!==uid||jwt.aal!=="aal2")return "mfa";
 }catch{return null}
 return {uid,role:rows[0].admin_role};
}
async function bodyJson(req:Request):Promise<Record<string,unknown>|null>{
 if(!req.headers.get("content-type")?.startsWith("application/json"))return null;
 const length=Number(req.headers.get("content-length")||"0");if(length>2200)return null;
 try{const txt=await req.text();if(txt.length>2200)return null;const x=JSON.parse(txt);
  return x&&typeof x==="object"&&!Array.isArray(x)?x:null;
 }catch{return null}
}
async function event(admin:Admin,doc:string,action:string,meta:Record<string,unknown>={}):Promise<boolean>{
 const r=await internal("/rest/v1/vorvan_compliance_events","POST",{actor_user_id:admin.uid,doc_id:doc,action,meta});return !!r?.ok;
}
function docRoute(url:URL):string{
 let p=url.pathname;
 for(const prefix of ["/functions/v1/compliance-vault","/compliance-vault"])if(p===prefix||p.startsWith(prefix+"/"))return p.slice(prefix.length)||"/";
 return "#";
}
async function document(doc:string){
 const r=await internal("/rest/v1/vorvan_compliance_documents?doc_id=eq."+encodeURIComponent(doc)+"&select=doc_id,title,category,stage,post_incorporation,notes,description&limit=1");
 if(!r?.ok)return null;const rows=await r.json().catch(()=>[]);return Array.isArray(rows)?rows[0]||null:null;
}
async function latestFile(doc:string,id?:string){
 const extra=id?"&id=eq."+encodeURIComponent(id):"";
 const r=await internal("/rest/v1/vorvan_compliance_files?doc_id=eq."+encodeURIComponent(doc)+extra+"&select=id,object_path,mime_type,byte_size,sha256_hex,uploaded_at&order=uploaded_at.desc&limit=1");
 if(!r?.ok)return null;const rows=await r.json().catch(()=>[]);return Array.isArray(rows)?rows[0]||null:null;
}
function validFormat(bytes:Uint8Array,mime:string):boolean{
 if(mime==="application/pdf")return bytes.length>=5&&bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45;
 if(mime==="image/png")return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(mime==="image/jpeg")return bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217;
 return false;
}
async function sendFile(req:Request,adm:Admin,doc:string,fileId?:string):Promise<Response>{
 if(adm.role!=="owner")return deny(req,403,"owner_only_file_access");
 if(!await document(doc))return deny(req,404,"document_not_found");
 const f=await latestFile(doc,fileId);
 if(!f)return deny(req,404,"file_not_found");
 const r=await storage("object/authenticated/"+BUCKET+"/"+f.object_path,"GET");
 if(!r?.ok)return deny(req,503,"private_file_unavailable");
 const bytes=await r.arrayBuffer();
 if(bytes.byteLength!==f.byte_size)return deny(req,503,"file_integrity_length_mismatch");
 const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
 const actual=Array.from(digest,x=>x.toString(16).padStart(2,"0")).join("");
 if(actual!==f.sha256_hex)return deny(req,503,"file_integrity_checksum_mismatch");
 const h=headers(req);h.set("content-type",f.mime_type);h.set("content-length",String(bytes.byteLength));
 h.set("content-disposition","attachment; filename=\"VORVAN_"+doc+(f.mime_type==="application/pdf"?".pdf":f.mime_type==="image/png"?".png":".jpg")+"\"");
 h.set("content-security-policy","sandbox");
 const success=await event(adm,doc,fileId?"document_version_downloaded":"document_downloaded",{version_id:f.id});
 if(!success)return deny(req,503,"audit_unavailable");
 return new Response(bytes,{status:200,headers:h});
}
Deno.serve(async(req:Request):Promise<Response>=>{
 const origin=req.headers.get("origin");
 if(origin&&!ORIGINS.has(origin))return deny(req,403,"origin_denied");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
 if(!["GET","PATCH","POST"].includes(req.method))return deny(req,405,"method_denied");
 const p=docRoute(new URL(req.url));
 if(p==="#")return deny(req,404,"route_not_found");
 const a=await authorised(req);
 if(a===null)return deny(req,401,"login_required");
 if(a==="mfa")return deny(req,403,"mfa_required");
 if(a==="denied")return deny(req,403,"admin_access_denied");
 if(a==="offline")return deny(req,503,"authentication_unavailable");
 if(req.method!=="GET"&&a.role==="auditor")return deny(req,403,"read_only_role");
 try{
  if(req.method==="GET"&&(p==="/"||p==="")){
   const rs=await Promise.all([
    internal("/rest/v1/vorvan_company_readiness?id=eq.1&select=incorporation_status,ca_documents_verified,mca_fee_paid,coi_issued,cin,source,updated_at&limit=1"),
    internal("/rest/v1/vorvan_compliance_documents?select=doc_id,title,category,stage,post_incorporation,description,notes,updated_at&order=category.asc,title.asc&limit=100"),
    internal("/rest/v1/vorvan_compliance_files?select=id,doc_id,mime_type,byte_size,uploaded_at&order=uploaded_at.desc&limit=300")
   ]);
   if(rs.some(x=>!x?.ok))return deny(req,503,"compliance_data_unavailable");
   const company=(await rs[0]!.json())[0]||null;
   const docs=await rs[1]!.json();
   const files=await rs[2]!.json();
   if(!company)return deny(req,503,"company_status_missing");
   const counts:Record<string,number>={};const latest:Record<string,unknown>={};
   for(const f of files){counts[f.doc_id]=(counts[f.doc_id]||0)+1;if(!latest[f.doc_id])latest[f.doc_id]={id:f.id,mime_type:f.mime_type,uploaded_at:f.uploaded_at}}
   return respond(req,200,{ok:true,company,documents:docs.map((d:Record<string,unknown>)=>({...d,versions:counts[d.doc_id as string]||0,latest_file:latest[d.doc_id as string]||null})),role:a.role});
  }
  if(req.method==="GET"&&p==="/audit"){
   const r=await internal("/rest/v1/vorvan_compliance_events?select=action,doc_id,created_at&order=created_at.desc&limit=30");
   return r?.ok?respond(req,200,{ok:true,events:await r.json()}):deny(req,503,"audit_unavailable");
  }
  const versions=/^\/documents\/([a-z][a-z0-9_]{2,55})\/versions$/.exec(p);
  if(req.method==="GET"&&versions){
   if(!await document(versions[1]))return deny(req,404,"document_not_found");
   const r=await internal("/rest/v1/vorvan_compliance_files?doc_id=eq."+versions[1]+"&select=id,mime_type,byte_size,sha256_hex,uploaded_at&order=uploaded_at.desc&limit=100");
   return r?.ok?respond(req,200,{ok:true,versions:await r.json()}):deny(req,503,"versions_unavailable");
  }
  const dl=/^\/documents\/([a-z][a-z0-9_]{2,55})\/download$/.exec(p);
  if(req.method==="GET"&&dl)return await sendFile(req,a,dl[1]);
  const old=/^\/documents\/([a-z][a-z0-9_]{2,55})\/versions\/([0-9a-f-]{36})\/download$/.exec(p);
  if(req.method==="GET"&&old&&UUID.test(old[2]))return await sendFile(req,a,old[1],old[2]);
  const patch=/^\/documents\/([a-z][a-z0-9_]{2,55})$/.exec(p);
  if(req.method==="PATCH"&&patch){
   const doc=patch[1];const existing=await document(doc);
   if(!existing)return deny(req,404,"document_not_found");
   const data=await bodyJson(req);
   if(!data||!Object.keys(data).length||Object.keys(data).some(k=>!["stage","notes"].includes(k)))return deny(req,400,"invalid_input");
   if(data.stage!==undefined&&(typeof data.stage!=="string"||!STAGES.has(data.stage)))return deny(req,400,"invalid_stage");
   if(data.notes!==undefined&&(typeof data.notes!=="string"||data.notes.length>500))return deny(req,400,"invalid_notes");
   if(data.stage==="verified"){
    if(a.role!=="owner")return deny(req,403,"owner_approval_required");
    if(!await latestFile(doc))return deny(req,409,"verified_requires_uploaded_file");
    if(existing.post_incorporation){
      const r=await internal("/rest/v1/vorvan_company_readiness?id=eq.1&select=incorporation_status&limit=1");
      if(!r?.ok||((await r.json())[0]?.incorporation_status!=="incorporated"))return deny(req,409,"incorporation_required");
    }
   }
   const update:Record<string,unknown>={...data,updated_at:new Date().toISOString(),modified_by:a.uid};
   if(data.stage==="verified")update.verified_at=new Date().toISOString();
   else if(data.stage!==undefined)update.verified_at=null;
   const r=await internal("/rest/v1/vorvan_compliance_documents?doc_id=eq."+doc,"PATCH",update);
   if(!r?.ok)return deny(req,503,"update_failed");
   if(!await event(a,doc,"document_status_changed",{stage:data.stage||existing.stage}))return deny(req,503,"audit_unavailable");
   return respond(req,200,{ok:true,document:(await r.json())[0]||null});
  }
  const upload=/^\/documents\/([a-z][a-z0-9_]{2,55})\/upload$/.exec(p);
  if(req.method==="POST"&&upload){
   if(a.role!=="owner")return deny(req,403,"owner_only_file_access");
   const doc=upload[1];if(!await document(doc))return deny(req,404,"document_not_found");
   const mime=(req.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
   if(!["application/pdf","image/png","image/jpeg"].includes(mime))return deny(req,415,"file_type_not_allowed");
   if(Number(req.headers.get("content-length")||"0")>LIMIT)return deny(req,413,"file_too_large");
   const bytes=new Uint8Array(await req.arrayBuffer());
   if(bytes.length<5||bytes.length>LIMIT)return deny(req,413,"invalid_file_size");
   if(!validFormat(bytes,mime))return deny(req,422,"file_signature_mismatch");
   const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
   const checksum=Array.from(digest,x=>x.toString(16).padStart(2,"0")).join("");
   const ext=mime==="application/pdf"?"pdf":mime==="image/png"?"png":"jpg";
   const obj=doc+"/"+crypto.randomUUID()+"."+ext;
   const stored=await storage("object/"+BUCKET+"/"+obj,"POST",bytes,mime);
   if(!stored?.ok)return deny(req,503,"file_storage_failed");
   const row=await internal("/rest/v1/vorvan_compliance_files","POST",{doc_id:doc,object_path:obj,mime_type:mime,byte_size:bytes.length,sha256_hex:checksum,uploaded_by:a.uid});
   if(!row?.ok){
    await storage("object/"+BUCKET+"/"+obj,"DELETE");
    return deny(req,503,"file_metadata_failed");
   }
   const statusUpdate=await internal("/rest/v1/vorvan_compliance_documents?doc_id=eq."+doc,"PATCH",{stage:"under_review",modified_by:a.uid,verified_at:null,updated_at:new Date().toISOString()});
   if(!statusUpdate?.ok)return deny(req,503,"document_review_update_failed");
   const rows=await row.json();
   if(!await event(a,doc,"document_uploaded",{version_id:rows[0]?.id,byte_size:bytes.length}))return deny(req,503,"audit_unavailable");
   return respond(req,201,{ok:true,version_id:rows[0]?.id,byte_size:bytes.length,stage:"under_review"});
  }
  return deny(req,404,"route_not_found");
 }catch{return deny(req,500,"internal_error")}
});
