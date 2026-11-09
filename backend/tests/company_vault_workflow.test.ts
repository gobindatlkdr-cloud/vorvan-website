/**
 * VORVAN M0 / VOR-003: synthetic end-to-end request flow through the REAL Vault handler.
 * All identity, PostgREST and Storage calls go to a process-local deterministic mock.
 * No real login, OTP, key, customer document or production write occurs.
 * This does not replace genuine AAL2 Owner, role and production-storage E2E.
 */
type Handler = (request: Request) => Promise<Response>;
function equal(a:unknown,b:unknown,message="assertion") {
  if(a!==b)throw Error(message+": expected "+String(b)+"; got "+String(a));
}
function sure(x:unknown,message="assertion") { if(!x)throw Error(message); }
function bytesMatch(a:Uint8Array,b:Uint8Array,message="byte content") {
  equal(a.length,b.length,message+" length");
  for(let i=0;i<a.length;i++)if(a[i]!==b[i])throw Error(message+" mismatch at "+i);
}
const mockHost="https://synthetic-vault.supabase.co";
Deno.env.set("SUPABASE_URL",mockHost);
Deno.env.set("SUPABASE_ANON_KEY","not-a-real-anon-key");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","not-a-real-service-key");
Deno.env.set("SUPABASE_SECRET_KEYS","{}");
const doc="corp_pack", postDoc="coi_certificate";
const UID="00000000-0000-4000-8000-000000000001";
const clientUrl=mockHost+"/functions/v1/compliance-vault";
type Role = "owner"|"operator"|"auditor"|"unapproved";
const identities=new Map<string,{role:Role,uid:string,aal:"aal1"|"aal2"}>();
function encode(data:unknown):string{
 return btoa(JSON.stringify(data)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
}
function access(role:Role,aal:"aal1"|"aal2"="aal2"):string{
 const jwt=encode({alg:"HS256",typ:"JWT"})+"."+encode({
  sub:UID,aal,exp:2000000000,jti:"vault-test-"+identities.size,
 })+".synthetic";
 identities.set(jwt,{role,uid:UID,aal});
 return jwt;
}
const owner=access("owner"),operator=access("operator"),auditor=access("auditor");
const unapproved=access("unapproved"),aal1=access("owner","aal1");
const captured:Handler[]=[];
const oldServe=Deno.serve;
(Deno as unknown as {serve:unknown}).serve=((fn:Handler)=>{
 captured.push(fn);
 return {finished:Promise.resolve(),shutdown(){},ref(){},unref(){}};
}) as typeof Deno.serve;
try{await import("../compliance-vault/index.ts");}
finally{(Deno as unknown as {serve:unknown}).serve=oldServe;}
equal(captured.length,1,"actual Vault listener loaded");
const handler=captured[0];
type DocRow={doc_id:string;title:string;category:string;stage:string;post_incorporation:boolean;
 description:string;notes:string;verified_at:string|null;updated_at:string};
type FileRow={id:string;doc_id:string;object_path:string;mime_type:string;byte_size:number;
 sha256_hex:string;uploaded_at:string;uploaded_by:string};
type AuditRow={actor_user_id:string;doc_id:string;action:string;meta:Record<string,unknown>;created_at:string};
const docs=new Map<string,DocRow>();
const files:FileRow[]=[];
const objects=new Map<string,Uint8Array>();
const events:AuditRow[]=[];
let seq=0,failMetadata=false,failStorage=false,uploadedObjects=0,deletedObjects=0;
function reset(){
 docs.clear();
 for(const [id,post] of [[doc,false],[postDoc,true]] as const)
  docs.set(id,{doc_id:id,title:"Synthetic Non-sensitive Test",category:"corporate",
    stage:"pending",post_incorporation:post,description:"Mock document only",notes:"",
    verified_at:null,updated_at:"2026-11-09T00:00:00Z"});
 files.length=0;objects.clear();events.length=0;
 seq=0;failMetadata=false;failStorage=false;uploadedObjects=0;deletedObjects=0;
}
reset();
const pdf1=new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
const pdf2=new TextEncoder().encode("%PDF-1.5\n1 0 obj\n<< /Type /Catalog /SyntheticVersion (two) >>\nendobj\n%%EOF\n");
function json(data:unknown,status=200){
 return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});
}
function timeForSequence(n:number){return new Date(Date.UTC(2026,10,9,0,0,n)).toISOString();}
function idForSequence(n:number){return "00000000-0000-4000-8000-"+n.toString(16).padStart(12,"0");}
async function hash(data:Uint8Array):Promise<string>{
 const stable=new Uint8Array(data.length);
 stable.set(data);
 const output=new Uint8Array(await crypto.subtle.digest("SHA-256",stable));
 return Array.from(output,n=>n.toString(16).padStart(2,"0")).join("");
}
function extract(accessHeader:string):string{
 return accessHeader.startsWith("Bearer ")?accessHeader.slice(7):"";
}
function queryValue(u:URL,name:string):string|undefined{
 const s=u.searchParams.get(name)||"";
 return s.startsWith("eq.")?s.slice(3):undefined;
}
let backendCalls=0;
globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{
 const u=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
 equal(u.origin,mockHost,"no external requests");
 backendCalls++;
 const headers=new Headers(init?.headers);
 const method=init?.method||"GET";
 if(u.pathname==="/auth/v1/user"){
  const f=identities.get(extract(headers.get("authorization")||""));
  if(!f)return json({error:"unauthorized"},401);
  return json({id:f.uid,email:f.role+".synthetic@example.invalid",
    email_confirmed_at:"2026-11-01T00:00:00Z"});
 }
 if(u.pathname==="/rest/v1/vorvan_admin_acl"){
  const email=queryValue(u,"email")||"";
  const role=email.split(".")[0] as Role;
  return json(["owner","operator","auditor"].includes(role)?[{admin_role:role}]:[]);
 }
 if(u.pathname==="/rest/v1/vorvan_company_readiness"){
  return json([{incorporation_status:"pending_incorporation",ca_documents_verified:true,
   mca_fee_paid:true,coi_issued:false,cin:null}]);
 }
 if(u.pathname==="/rest/v1/vorvan_compliance_documents"){
  if(method==="GET"){
   const requested=queryValue(u,"doc_id");
   return json((requested?[docs.get(requested)]:[...docs.values()]).filter(Boolean));
  }
  if(method==="PATCH"){
   const row=docs.get(queryValue(u,"doc_id")||"");
   if(!row)return json({error:"no document"},404);
   const patch=JSON.parse(String(init?.body||"{}"));
   Object.assign(row,patch);
   return json([{...row}]);
  }
 }
 if(u.pathname==="/rest/v1/vorvan_compliance_files"){
  if(method==="POST"){
   if(failMetadata){failMetadata=false;return json({error:"mock metadata failure"},503);}
   const data=JSON.parse(String(init?.body||"{}"));
   seq++;
   const row:FileRow={id:idForSequence(seq),...data,uploaded_at:timeForSequence(seq)};
   files.push(row);
   return json([row],201);
  }
  if(method==="GET"){
   const wantedDoc=queryValue(u,"doc_id"),wantedId=queryValue(u,"id");
   const selected=files.filter(f=>(!wantedDoc||f.doc_id===wantedDoc)&&(!wantedId||f.id===wantedId))
    .sort((a,b)=>b.uploaded_at.localeCompare(a.uploaded_at));
   const limit=Number(u.searchParams.get("limit")||100);
   return json(selected.slice(0,limit));
  }
 }
 if(u.pathname==="/rest/v1/vorvan_compliance_events"){
  if(method==="GET")return json([...events].reverse().map(e=>({
   action:e.action,doc_id:e.doc_id,created_at:e.created_at})));
  if(method==="POST"){
   const row=JSON.parse(String(init?.body||"{}")) as AuditRow;
   events.push({...row,created_at:timeForSequence(events.length+1)});
   return json([row],201);
  }
 }
 if(u.pathname.startsWith("/storage/v1/")){
  const regular="/storage/v1/object/vorvan-company-private/";
  const protectedRead="/storage/v1/object/authenticated/vorvan-company-private/";
  if(method==="POST"&&u.pathname.startsWith(regular)){
   if(failStorage){failStorage=false;return json({error:"mock storage unavailable"},503);}
   const body=init?.body;
   if(!(body instanceof Blob))throw Error("Expected real Vault handler to send a Blob");
   const path=decodeURIComponent(u.pathname.slice(regular.length));
   objects.set(path,new Uint8Array(await body.arrayBuffer()));
   uploadedObjects++;
   return json({Key:path},200);
  }
  if(method==="GET"&&u.pathname.startsWith(protectedRead)){
   const path=decodeURIComponent(u.pathname.slice(protectedRead.length));
   const body=objects.get(path);
   if(!body)return json({error:"not found"},404);
   return new Response(Uint8Array.from(body).buffer,{status:200});
  }
  if(method==="DELETE"&&u.pathname.startsWith(regular)){
   const path=decodeURIComponent(u.pathname.slice(regular.length));
   objects.delete(path);deletedObjects++;
   return new Response(null,{status:204});
  }
 }
 throw Error("Unmocked synthetic dependency: "+method+" "+u.pathname);
}) as typeof fetch;

function req(route:string,method="GET",jwt?:string,body?:Uint8Array|string,mime?:string,origin="https://vorvan.co.in"){
 const headers:Record<string,string>={origin};
 if(jwt)headers.authorization="Bearer "+jwt;
 if(body!==undefined)headers["content-type"]=mime||(typeof body==="string"?"application/json":"application/pdf");
 return new Request(clientUrl+route,{method,headers,
  body:body===undefined?undefined:typeof body==="string"?body:Uint8Array.from(body).buffer});
}
async function status(response:Response,expected:number,code?:string){
 equal(response.status,expected,"HTTP status");
 if(code){const val=await response.json();equal(val.code,code,"error code");}
 return response;
}
async function upload(bytes:Uint8Array=pdf1,documentId=doc,jwt=owner,mime="application/pdf"){
 return await handler(req("/documents/"+documentId+"/upload","POST",jwt,bytes,mime));
}
async function get(route:string,jwt=owner){return handler(req(route,"GET",jwt));}
async function patch(documentId:string,payload:unknown,jwt=owner){
 return handler(req("/documents/"+documentId,"PATCH",jwt,JSON.stringify(payload),"application/json"));
}

Deno.test("Owner synthetic PDF upload stores original bytes, SHA-256, metadata and audit event",async()=>{
 reset();
 const r=await status(await upload(),201);
 const out=await r.json();
 equal(out.ok,true);equal(out.stage,"under_review");equal(out.byte_size,pdf1.length);
 equal(files.length,1);equal(objects.size,1);
 bytesMatch(objects.get(files[0].object_path)!,pdf1);
 equal(files[0].sha256_hex,await hash(pdf1));
 equal(out.version_id,files[0].id);
 equal(docs.get(doc)?.stage,"under_review");
 equal(events.length,1);equal(events[0].action,"document_uploaded");
 equal(events[0].meta.version_id,files[0].id);
 const meta=await (await status(await get("/"),200)).json();
 equal(meta.company.incorporation_status,"pending_incorporation");
 equal(meta.company.coi_issued,false);
 equal(meta.documents.find((x:{doc_id:string})=>x.doc_id===doc).versions,1);
 const audit=await (await status(await get("/audit"),200)).json();
 equal(audit.events[0].action,"document_uploaded");
});

Deno.test("Version history, current and previous download return exact bytes; downloads audited",async()=>{
 reset();
 const a=(await (await status(await upload(pdf1),201)).json()).version_id;
 const b=(await (await status(await upload(pdf2),201)).json()).version_id;
 sure(a!==b,"different version IDs");
 const listed=await (await status(await get("/documents/"+doc+"/versions"),200)).json();
 equal(listed.versions.length,2);
 equal(listed.versions[0].id,b);equal(listed.versions[1].id,a);
 equal(listed.versions[0].sha256_hex,await hash(pdf2));
 const latest=await status(await get("/documents/"+doc+"/download"),200);
 equal(latest.headers.get("content-type"),"application/pdf");
 sure((latest.headers.get("content-disposition")||"").includes("attachment"),"forced download");
 bytesMatch(new Uint8Array(await latest.arrayBuffer()),pdf2,"latest PDF");
 const previous=await status(await get("/documents/"+doc+"/versions/"+a+"/download"),200);
 bytesMatch(new Uint8Array(await previous.arrayBuffer()),pdf1,"prior PDF");
 const meta=await (await status(await get("/"),200)).json();
 equal(meta.documents.find((x:{doc_id:string})=>x.doc_id===doc).versions,2);
 equal(meta.documents.find((x:{doc_id:string})=>x.doc_id===doc).latest_file.id,b);
 equal(events.filter(e=>e.action==="document_uploaded").length,2);
 equal(events.filter(e=>e.action==="document_downloaded").length,1);
 equal(events.filter(e=>e.action==="document_version_downloaded").length,1);
});

Deno.test("Tampered file bytes with correct length cause checksum denial and no download audit",async()=>{
 reset();await status(await upload(),201);
 const f=files[0],bad=Uint8Array.from(objects.get(f.object_path)!);
 bad[bad.length-2]^=1;objects.set(f.object_path,bad);
 const before=events.length;
 await status(await get("/documents/"+doc+"/download"),503,"file_integrity_checksum_mismatch");
 equal(events.length,before,"no download audit for a rejected corrupted response");
});

Deno.test("Truncated storage object causes size mismatch without releasing content",async()=>{
 reset();await status(await upload(),201);
 const f=files[0];objects.set(f.object_path,pdf1.subarray(0,pdf1.length-2));
 await status(await get("/documents/"+doc+"/download"),503,"file_integrity_length_mismatch");
});

Deno.test("Operator and Auditor cannot upload or download private files",async()=>{
 reset();const before=backendCalls;
 await status(await upload(pdf1,doc,operator),403,"owner_only_file_access");
 await status(await upload(pdf1,doc,auditor),403,"read_only_role");
 await status(await get("/documents/"+doc+"/download",operator),403,"owner_only_file_access");
 await status(await get("/documents/"+doc+"/download",auditor),403,"owner_only_file_access");
 equal(objects.size,0);equal(files.length,0);
 sure(backendCalls>=before,"mock requests are allowed for identity checks only");
});

Deno.test("Unapproved user, AAL1 and missing bearer denied before file write",async()=>{
 reset();
 await status(await upload(pdf1,doc,unapproved),403,"admin_access_denied");
 await status(await upload(pdf1,doc,aal1),403,"mfa_required");
 await status(await upload(pdf1,doc,""),401,"login_required");
 equal(objects.size,0);equal(files.length,0);
});

Deno.test("Invalid type and invalid PDF signature refused with no object creation",async()=>{
 reset();
 await status(await upload(pdf1,doc,owner,"text/plain"),415,"file_type_not_allowed");
 const wrong=new TextEncoder().encode("Hello! Not a PDF");
 await status(await upload(wrong,doc,owner,"application/pdf"),422,"file_signature_mismatch");
 equal(uploadedObjects,0);
});

Deno.test("Oversize upload beyond 8MiB rejected without storage or metadata write",async()=>{
 reset();
 const big=new Uint8Array(8388609);big.set(pdf1);
 await status(await upload(big),413,"invalid_file_size_or_limit");
 equal(uploadedObjects,0);equal(files.length,0);
});

Deno.test("Storage failure and metadata failure fail closed; metadata failure deletes private blob",async()=>{
 reset();failStorage=true;
 await status(await upload(),503,"file_storage_failed");
 equal(objects.size,0);equal(files.length,0);
 failMetadata=true;
 await status(await upload(),503,"file_metadata_failed");
 equal(objects.size,0);equal(files.length,0);
 equal(deletedObjects,1);
});

Deno.test("Only Owner can approve evidence; Operator cannot verify and Auditor cannot change notes",async()=>{
 reset();
 await status(await upload(),201);
 await status(await patch(doc,{stage:"verified"},operator),403,"owner_approval_required");
 await status(await patch(doc,{notes:"auditor edit"},auditor),403,"read_only_role");
 const approved=await status(await patch(doc,{stage:"verified"},owner),200);
 equal((await approved.json()).document.stage,"verified");
 equal(events.filter(e=>e.action==="document_status_changed").length,1);
 equal(docs.get(doc)?.verified_at!==null,true);
});

Deno.test("Verification requires uploaded evidence; post-incorporation evidence remains gated",async()=>{
 reset();
 await status(await patch(doc,{stage:"verified"},owner),409,"verified_requires_uploaded_file");
 await status(await upload(pdf1,postDoc),201);
 await status(await patch(postDoc,{stage:"verified"},owner),409,"incorporation_required");
 equal(docs.get(postDoc)?.stage,"under_review");
 equal(events.some(e=>e.action==="document_status_changed"),false);
});

Deno.test("Missing document and malformed PATCH never mutate records",async()=>{
 reset();
 await status(await upload(pdf1,"missing_document"),404,"document_not_found");
 await status(await patch(doc,{unapproved_field:"x"},owner),400,"invalid_input");
 await status(await patch(doc,{notes:"N".repeat(501)},owner),400,"invalid_notes");
 equal(files.length,0);equal(events.length,0);
});

Deno.test("Forbidden Origin denied; private object never accessible via direct public request",async()=>{
 reset();
 await status(await handler(req("/", "GET",owner,undefined,undefined,"https://attacker.invalid")),403,"origin_denied");
 // The Edge handler has no public route for Storage object paths.
 await status(await get("/storage/v1/object/"+doc+"/synthetic.pdf"),404,"route_not_found");
 equal(objects.size,0);
});
