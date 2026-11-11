/* VORVAN Admin Console. First-party JS only. No localStorage, cookies, third-party scripts or embedded secrets.
 * Only the Supabase publishable key is public. All admin rights are server-side. */
(()=>{"use strict";
const API="https://kukfpsqujlutlgwndplh.supabase.co";
const PUB="sb_publishable_6KyGNqt8CGNlE8vCBdtalA_Ayhfo-Rj";
const AUTH=API+"/auth/v1";
const EDGE=API+"/functions/v1/admin-console";
const COMPANY="admin@vorvan.co.in";
const AREAS={
 overview:["Operations overview","Readiness, approvals and actions across the company"],
 partners:["Bank / NBFC Partners","Direct LSP and API collaboration; customer requests remain disabled"],
 ai:["AI Backend","Synthetic credit guidance status, security and deployment"],
 governance:["AI Governance & Reporting (Sandbox)","Fictional version registry, safety flags, role-scoped analytics and permanently locked release gates"],
 privacy:["Privacy Requests & Export (Sandbox)","Synthetic fixed-choice access/correction/delete/export/consent-withdrawal lifecycle — never live processing"],
 customers:["Customer Operations","Confidential account operations stay locked until approved"],
 readiness:["Readiness Operations (Sandbox)","Synthetic 30/60/90-day template queues, simulated role scopes and locked go-live gates"],
 support:["Support & Grievances","Issue tracking and business correspondence work queue"],
 security:["Security & Audit","Authentication controls, checks and administrative change history"],
 website:["Website & Domain","Live company website, custom-domain HTTPS and GitHub Pages status"],
 email:["Department Emails","Domain-based corporate mailboxes and DNS setup status"],
 compliance:["Legal & Compliance","Review checklist, consents, contracts and compliance readiness"]
};
const $=(id)=>document.getElementById(id);
const state={access:"",refresh:"",role:"",tasks:[],modules:[],counters:{},area:"overview",mfaFactor:"",mfaSetup:false,user:null,events:[],readinessSandbox:null,supportSandbox:null,governanceSandbox:null,privacySandbox:null};
function visible(id,yes){$(id).hidden=!yes}
function message(id,msg,ok=false){const el=$(id);el.textContent=msg;el.classList.toggle("ok",ok)}
function el(tag,cl,text){const x=document.createElement(tag);if(cl)x.className=cl;if(text!==undefined)x.textContent=String(text);return x}
function append(parent,...kids){for(const k of kids)parent.append(k);return parent}
function authHeaders(includeSession=false){const h={"apikey":PUB,"content-type":"application/json"};if(includeSession&&state.access)h.authorization="Bearer "+state.access;return h}
async function auth(path,method="GET",body=undefined,session=true){
 const res=await fetch(AUTH+path,{method,headers:authHeaders(session),body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
 const result=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(result.msg||result.message||result.error_description||"Authentication request failed");
 return result;
}
function setTokens(result){if(result.access_token){state.access=result.access_token;state.refresh=result.refresh_token||state.refresh}}
function clearSession(){state.access="";state.refresh="";state.mfaFactor="";state.user=null;state.tasks=[];state.modules=[];state.role="";state.readinessSandbox=null;state.supportSandbox=null;state.governanceSandbox=null;state.privacySandbox=null;$("password").value="";$("signup-password").value="";$("signup-confirm").value="";$("mfa-code").value="";$("mfa-secret").textContent="";$("mfa-qr").removeAttribute("src");visible("mfa-setup",false);visible("dashboard-view",false);visible("mfa-view",false);visible("signup-view",false);visible("login-view",true);visible("logout",false)}
async function login(event){
 event.preventDefault();message("login-message","");
 const password=$("password").value;
 if(password.length<12){message("login-message","Use a unique password with at least 12 characters.");return}
 try{
  const result=await auth("/token?grant_type=password","POST",{email:COMPANY,password},false);
  setTokens(result);$("password").value="";
  const user=await auth("/user","GET",undefined,true);
  if(user.email?.toLowerCase()!==COMPANY||!(user.email_confirmed_at||user.confirmed_at)){clearSession();message("login-message","The verified company administrator email is required.");return}
  state.user=user;
  await startMfa();
 }catch(e){clearSession();message("login-message",e.message||"Sign-in failed.")}
}
function openSignup(){
 message("login-message","");message("signup-message","");
 $("password").value="";
 visible("login-view",false);visible("signup-view",true);
 $("signup-password").focus();
}
function backToSignin(){
 $("signup-password").value="";$("signup-confirm").value="";
 visible("signup-view",false);visible("login-view",true);$("password").focus();
}
async function signup(event){
 event.preventDefault();
 message("signup-message","");
 const password=$("signup-password").value;
 const confirmation=$("signup-confirm").value;
 if(password.length<12){message("signup-message","Create a password with at least 12 characters (letters, numbers and symbols are allowed).");return}
 if(password!==confirmation){message("signup-message","Password and Confirm Password must be identical.");return}
 const button=$("signup-submit");button.disabled=true;
 try{
  const redirect=encodeURIComponent("https://vorvan.co.in/admin.html");
  await auth("/signup?redirect_to="+redirect,"POST",{email:COMPANY,password},false);
  $("signup-password").value="";$("signup-confirm").value="";
  message("signup-message","Registration request submitted. Check the Zoho inbox for admin@vorvan.co.in and use Supabase's email confirmation link. After verification, choose Back to sign in. If no message arrives, check Spam and your Supabase Auth email settings.",true);
 }catch(e){message("signup-message",e.message||"Account registration could not be completed.")}
 finally{button.disabled=false}
}
function displayAuthenticatorQr(qr){
 const img=$("mfa-qr");
 const fallback=$("mfa-qr-error");
 img.removeAttribute("src");visible("mfa-qr",false);visible("mfa-qr-error",false);
 let uri="";
 if(typeof qr==="string"){
  const raw=qr.trim();
  if(/^data:image\/svg\+xml(?:;[^,]*)?,/i.test(raw))uri=raw;
  else if(/^data:image\/png;base64,/i.test(raw))uri=raw;
  else if(raw.length<=500000&&(raw.startsWith("<svg")||raw.startsWith("<?xml")))
    uri="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(raw);
 }
 if(!uri){visible("mfa-qr-error",true);return false}
 img.onload=()=>{visible("mfa-qr",true);visible("mfa-qr-error",false)};
 img.onerror=()=>{visible("mfa-qr",false);visible("mfa-qr-error",true)};
 img.src=uri;
 return true;
}
async function startMfa(){
 visible("login-view",false);visible("dashboard-view",false);visible("mfa-view",true);
 message("mfa-message","");
 $("mfa-code").value="";
 state.mfaFactor="";
 visible("mfa-setup",false);
 visible("mfa-pending-help",false);
 try{
  const factors=Array.isArray(state.user?.factors)?state.user.factors:[];
  const verified=factors.find(f=>f.factor_type==="totp"&&f.status==="verified");
  if(verified){state.mfaFactor=verified.id;state.mfaSetup=false;visible("mfa-setup",false);$("mfa-explanation").textContent="Open your existing authenticator app and enter the current 6-digit code.";return}
  const incomplete=factors.find(f=>f.factor_type==="totp"&&f.status==="unverified");
  if(incomplete){
    state.mfaFactor=incomplete.id;
    state.mfaSetup=true;
    visible("mfa-setup",false);
    $("mfa-explanation").textContent="Previous MFA enrollment is incomplete. Enter the code for the previously scanned authenticator entry, or use the recovery option below.";
    visible("mfa-pending-help",true);
    message("mfa-message","Existing incomplete MFA setup detected.",true);
    return;
  }
  // Offer recovery even if the Auth user response omits an unverified factor.
  visible("mfa-pending-help",true);
  const result=await auth("/factors","POST",{factor_type:"totp",friendly_name:"VORVAN Admin"},true);
  state.mfaFactor=result.id;state.mfaSetup=true;
  const secret=result.totp?.secret||"";
  $("mfa-secret").textContent=secret;
  const qr=result.totp?.qr_code||"";
  displayAuthenticatorQr(qr);
  visible("mfa-secret",false);
  visible("mfa-setup",true);visible("mfa-pending-help",false);
  $("mfa-explanation").textContent="Scan this new QR code, then enter the six-digit code from that exact authenticator entry.";
 }catch(e){
   visible("mfa-pending-help",true);
   $("mfa-explanation").textContent="Your MFA setup could not continue. Use the recovery button below to replace a single incomplete authenticator registration.";
   message("mfa-message",e.message||"Incomplete MFA setup detected. Use recovery below.");
 }
}
async function restartPendingMfa(){
 const button=$("mfa-reset-pending");button.disabled=true;
 message("mfa-message","Checking the signed-in owner's incomplete MFA setup…");
 try{
  if(!state.access)throw Error("Please sign in again.");
  const res=await fetch(API+"/functions/v1/admin-mfa-recovery",{
   method:"POST",headers:authHeaders(true),body:JSON.stringify({action:"reset_unverified_totp"}),cache:"no-store"
  });
  const response=await res.json().catch(()=>({}));
  if(!res.ok){
   const codes={
    verified_mfa_protected:"A verified MFA is registered. You must use the existing authenticator; recovery cannot remove it.",
    pending_mfa_not_single:"No single incomplete MFA setup was found. Sign out and sign in again.",
    login_required:"Your sign-in has expired. Sign out and sign in again.",
    owner_permission_required:"The verified company owner account is required.",
    recovery_not_configured:"Server recovery is unavailable. Contact the website administrator."
   };
   throw Error(codes[response.code]||("Recovery could not finish: "+(response.code||res.status)));
  }
  // Auth provider has now removed only the incomplete factor.
  // Create a fresh enrollment using the user's current authenticated session.
  state.mfaFactor="";
  $("mfa-code").value="";
  $("mfa-secret").textContent="";
  $("mfa-qr").removeAttribute("src");
  visible("mfa-setup",false);
  const fresh=await auth("/factors","POST",{factor_type:"totp",friendly_name:"VORVAN Admin new setup"},true);
  if(typeof fresh.id!=="string"||!fresh.id)throw Error("New MFA enrollment failed. Sign out and sign in again.");
  state.mfaFactor=fresh.id;
  state.mfaSetup=true;
  const qr=fresh.totp?.qr_code||"";
  $("mfa-secret").textContent=fresh.totp?.secret||"";
  displayAuthenticatorQr(qr);
  visible("mfa-secret",false);
  visible("mfa-setup",true);
  visible("mfa-pending-help",false);
  $("mfa-explanation").textContent="This is a NEW authenticator setup. Scan this new QR code, or enter the new secret into Google Authenticator. Enter the code from this new entry, not the old one.";
  message("mfa-message","New MFA enrollment created. Verify it with the NEW Google Authenticator entry.",true);
 }catch(e){
  visible("mfa-pending-help",true);
  message("mfa-message",e.message||"Recovery failed. Do not share an authenticator code.");
 }finally{button.disabled=false}
}
async function verifyMfa(event){
 event.preventDefault();message("mfa-message","");
 const code=$("mfa-code").value.trim();
 if(!/^\d{6}$/.test(code)){message("mfa-message","Enter exactly six digits from the Authenticator app.");return}
 if(!state.mfaFactor){visible("mfa-pending-help",true);message("mfa-message","No active MFA setup is selected. Use Reset incomplete MFA below to generate a new QR code.");return}
 try{
  const id=encodeURIComponent(state.mfaFactor);
  const chall=await auth("/factors/"+id+"/challenge","POST",{},true);
  const result=await auth("/factors/"+id+"/verify","POST",{challenge_id:chall.id,code},true);
  setTokens(result);
  $("mfa-secret").textContent="";$("mfa-qr").removeAttribute("src");$("mfa-code").value="";
  await load();
  visible("mfa-view",false);visible("dashboard-view",true);visible("logout",true);
  state.area="overview";render();
 }catch(e){message("mfa-message",e.message||"MFA verification failed.")}
}
async function call(path,method="GET",body){
 if(!state.access)throw Error("Sign in and complete MFA first.");
 const res=await fetch(EDGE+path,{method,headers:authHeaders(true),body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
 const json=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(json.code==="mfa_required"?"MFA is required. Sign out and verify your authenticator.":json.code==="admin_access_denied"?"This email is not authorised by the backend admin allowlist.":("Admin request failed: "+(json.code||res.status)));
 return json;
}
async function load(){
 const data=await call("/overview");state.tasks=Array.isArray(data.tasks)?data.tasks:[];state.modules=Array.isArray(data.modules)?data.modules:[];state.counters=data.counters||{};const verifiedRole=data.role||"unknown";if(state.role!==verifiedRole){state.readinessSandbox=null;state.supportSandbox=null;state.governanceSandbox=null;state.privacySandbox=null;}state.role=verifiedRole;
 $("admin-role").textContent="Approved role: "+state.role;
 message("dashboard-message","Last refreshed: "+new Date().toLocaleString(),true);
}
function textList(parent,items){const ul=el("ul");for(const t of items)append(ul,el("li","",t));parent.append(ul)}
function statusLabel(s){return ({published:"Published",enquiry_only:"Enquiry Only",demo_only:"Demo Only",locked:"Disabled",manual_email:"Manual Email",review_required:"Review Required",dns_pending:"DNS Pending",pending:"Pending"})[s]||s}
function box(title,description,status,link,label){
 const b=el("article","panel-box");
 const tag=el("span","status"+(status==="published"?" live":""),statusLabel(status));
 append(b,tag,el("h2","",title),el("p","",description));
 if(link){const a=el("a","",label||"Open official console ↗");a.href=link;a.target="_blank";a.rel="noopener noreferrer";b.append(a)}
 return b;
}

function field(form,labelText,tag,opts={}){
 const id="entry-"+form.dataset.kind+"-"+(opts.key||labelText).replace(/[^a-z]/gi,"-");
 const label=el("label","",labelText);label.htmlFor=id;
 const input=el(tag);input.id=id;input.name=opts.key||"";if(opts.required)input.required=true;
 if(opts.maxLength)input.maxLength=opts.maxLength;
 if(opts.placeholder)input.placeholder=opts.placeholder;
 if(tag==="select"){for(const [value,text] of (opts.options||[])){const op=el("option","",text);op.value=value;input.append(op)}}
 append(form,label,input);return input;
}
function tracker(container,area){
 const isPartner=area==="partners";const endpoint=isPartner?"/partners":"/support-cases";
 const pane=el("article","panel-box");
 const title=el("h2","",isPartner?"Institutional partnership tracker":"General support case tracker");
 const desc=el("p","",isPartner?"Internal bank/NBFC outreach status; direct LSP and direct API only. No customer data.":"Internal website, partner and security issues only; never record customer personal/financial data.");
 const form=el("form","");form.dataset.kind=area;
 let name=field(form,isPartner?"Institution name":"Case subject","input",{key:isPartner?"organization_name":"subject",required:true,maxLength:120,placeholder:"No customer information"});
 let kind=field(form,isPartner?"Institution type":"Category","select",{key:isPartner?"institution_type":"category",options:isPartner?[["bank","Bank"],["nbfc","NBFC"],["technology","Technology provider"]]:[["website","Website"],["partner","Partner support"],["security","Security"],["general","General"]]});
 let track=isPartner?field(form,"Partnership route","select",{key:"partnership_track",options:[["direct_lsp","Formal LSP"],["direct_api","Direct lending API"]]}):null;
 let notes=field(form,"Operational notes only","textarea",{key:"notes",maxLength:500,placeholder:"Never add PAN, Aadhaar, OTP, borrower KYC, bureau report or passwords"});
 const submit=el("button","primary",isPartner?"Add institution":"Add case");submit.type="submit";form.append(submit);
 const list=el("div","tracker-list","Loading…");
 form.addEventListener("submit",async e=>{
  e.preventDefault();submit.disabled=true;
  try{
   const body=isPartner?{organization_name:name.value.trim(),institution_type:kind.value,partnership_track:track.value,notes:notes.value}:{subject:name.value.trim(),category:kind.value,notes:notes.value};
   await call(endpoint,"POST",body);name.value="";notes.value="";await loadEntries();
   message("dashboard-message","Record saved. Personal/customer data must not be stored in this tracker.",true);
  }catch(err){message("dashboard-message",err.message||"Save failed")}finally{submit.disabled=false}
 });
 async function loadEntries(){
  try{
   const result=await call(endpoint);list.replaceChildren();
   const entries=(isPartner?result.partners:result.cases)||[];
   if(!entries.length){list.append(el("p","subtitle","No records yet."));return}
   for(const obj of entries){
    const card=el("article","task"),left=el("div"),title=el("strong","",isPartner?obj.organization_name:obj.subject);
    const details=el("div","details",obj.notes||"No additional details");
    const type=el("span","meta",isPartner?(obj.institution_type.toUpperCase()+" · "+obj.partnership_track):obj.category.toUpperCase());
    append(left,title,details,type);
    const select=el("select");select.setAttribute("aria-label","Change status for "+title.textContent);
    const stages=isPartner?["research","contacted","meeting","due_diligence","contracting","onboarded","paused"]:["open","in_progress","closed"];
    for(const st of stages){const op=el("option","",st.replaceAll("_"," "));op.value=st;op.selected=(obj[isPartner?"stage":"status"]===st);select.append(op)}
    select.disabled=state.role==="auditor";
    select.addEventListener("change",async()=>{select.disabled=true;try{await call(endpoint+"/"+encodeURIComponent(obj.id),"PATCH",{[isPartner?"stage":"status"]:select.value});await loadEntries();message("dashboard-message","Record status updated.",true)}catch(err){message("dashboard-message",err.message||"Could not update")}finally{select.disabled=false}});
    append(card,left,select);list.append(card);
   }
  }catch(e){list.textContent="Tracker unavailable: "+(e.message||"Access denied")}
 }
 if(state.role==="auditor")form.hidden=true;
 append(pane,title,desc,form,list);container.append(pane);loadEntries();
}


async function vaultRequest(path,method="GET",body,rawType){
 if(!state.access)throw Error("Complete admin sign-in and MFA first.");
 const h=authHeaders(true);
 if(rawType)h["content-type"]=rawType;
 const res=await fetch(API+"/functions/v1/compliance-vault"+path,{method,headers:h,body:body===undefined?undefined:rawType?body:JSON.stringify(body),cache:"no-store"});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){
  const hints={mfa_required:"Please sign in and complete MFA.",admin_access_denied:"Admin role not approved.",incorporation_required:"Incorporation pending: approval is locked.",owner_approval_required:"Owner approval required.",verified_requires_uploaded_file:"Upload a genuine document first.",file_signature_mismatch:"File signature does not match its MIME type.",file_storage_failed:"Private Storage upload failed."};
  throw Error(hints[data.code]||"Compliance API: "+(data.code||res.status));
 }
 return data;
}
async function vaultDownload(doc,version){
 const p="/documents/"+encodeURIComponent(doc)+(version?"/versions/"+encodeURIComponent(version):"")+"/download";
 const res=await fetch(API+"/functions/v1/compliance-vault"+p,{headers:authHeaders(true),cache:"no-store"});
 if(!res.ok){const x=await res.json().catch(()=>({}));throw Error("Private download failed: "+(x.code||res.status))}
 const blob=await res.blob(),url=URL.createObjectURL(blob),a=el("a");
 a.href=url;a.download="VORVAN_"+doc+(blob.type==="application/pdf"?".pdf":blob.type==="image/png"?".png":".jpg");
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function vaultPanel(parent){
 const pane=el("article","panel-box vault");
 append(pane,el("h2","","Private Company Documents & LSP/API Due Diligence"),el("p","","Protected administrative records. Never upload borrower KYC, credit reports, Aadhaar, OTPs, passwords or banking credentials."));
 const msg=el("p","vault-message","Loading protected company records…"),company=el("div","vault-company"),list=el("div","vault-list"),events=el("div","vault-events");
 msg.setAttribute("role","status");msg.setAttribute("aria-live","polite");
 append(pane,msg,company,list,events);parent.append(pane);
 const tell=(text,ok=false)=>{msg.textContent=text;msg.classList.toggle("ok",ok)};
 async function refresh(){
  const r=await vaultRequest("/"),c=r.company||{};company.replaceChildren();list.replaceChildren();events.replaceChildren();
  const top=el("div","vault-summary");
  top.append(el("strong","",c.incorporation_status==="incorporated"?"Incorporated":"Pre-Incorporation · Certificate Pending"));
  for(const [key,yes,no] of [["ca_documents_verified","CA documents verified","CA verification pending"],["mca_fee_paid","MCA fee paid","MCA fee pending"],["coi_issued","COI issued","COI not issued"]])top.append(el("span","",c[key]?yes:no));
  if(c.cin)top.append(el("span","","CIN: "+c.cin));company.append(top);
  const docs=r.documents||[];tell("Secure checklist loaded — "+docs.length+" records; "+docs.filter(d=>d.stage==="verified").length+" verified.",true);
  let cat="";
  for(const d of docs){
   if(cat!==d.category){cat=d.category;list.append(el("h3","vault-heading",cat.replaceAll("_"," ").toUpperCase()))}
   const item=el("article","vault-item"),head=el("div","vault-head");
   append(head,el("strong","",d.title),el("span","vault-tag",d.stage.replaceAll("_"," ")));
   append(item,head,el("p","",d.description||""),el("p","vault-meta",(d.versions||0)+" private file version(s)"));
   if(d.post_incorporation&&c.incorporation_status!=="incorporated")item.append(el("p","vault-warning","After incorporation — final verification locked"));
   const tools=el("div","vault-tools"),select=el("select");
   select.setAttribute("aria-label","Document status: "+d.title);
   for(const st of ["pending","draft","under_review","verified","blocked"]){
    if(st==="verified"&&state.role!=="owner")continue;
    const opt=el("option","",st.replaceAll("_"," "));opt.value=st;opt.selected=st===d.stage;select.append(opt);
   }
   select.disabled=state.role==="auditor";
   select.addEventListener("change",async()=>{
    if(select.value==="verified"&&!confirm("Confirm Owner approval for "+d.title+"? Verify uploaded evidence before approval.")){select.value=d.stage;return}
    select.disabled=true;try{await vaultRequest("/documents/"+d.doc_id,"PATCH",{stage:select.value});await refresh();tell("Review status saved.",true)}
    catch(e){select.value=d.stage;tell(e.message)}finally{select.disabled=false}
   });tools.append(select);
   const note=el("input");note.type="text";note.value=d.notes||"";note.maxLength=500;note.placeholder="Internal notes — no customer data";note.setAttribute("aria-label","Review note: "+d.title);note.disabled=state.role==="auditor";
   const save=el("button","small-button","Save note");save.type="button";save.disabled=state.role==="auditor";
   save.addEventListener("click",async()=>{save.disabled=true;try{await vaultRequest("/documents/"+d.doc_id,"PATCH",{notes:note.value});tell("Note saved.",true)}catch(e){tell(e.message)}finally{save.disabled=false}});
   tools.append(note,save);
   if(state.role==="owner"){
    const file=el("input");file.type="file";file.accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";file.className="vault-upload";file.setAttribute("aria-label","Private document upload: "+d.title);
    file.addEventListener("change",async()=>{
     const f=file.files&&file.files[0];if(!f)return;
     if(f.size>8388608||!["application/pdf","image/png","image/jpeg"].includes(f.type)){tell("Upload requires PDF, PNG or JPEG, 8 MB maximum.");file.value="";return}
     file.disabled=true;
     try{await vaultRequest("/documents/"+d.doc_id+"/upload","POST",f,f.type);await refresh();tell("File stored privately and sent for review.",true)}
     catch(e){tell(e.message)}finally{file.disabled=false;file.value=""}
    });tools.append(file);
    if(d.versions){
     const down=el("button","small-button","Download latest");down.type="button";
     down.addEventListener("click",()=>vaultDownload(d.doc_id).then(()=>tell("Private file downloaded.",true)).catch(e=>tell(e.message)));tools.append(down);
     if(d.versions>1){
      const history=el("button","small-button","Version history");history.type="button";
      history.addEventListener("click",async()=>{
       try{const v=await vaultRequest("/documents/"+d.doc_id+"/versions"),wrap=el("div","vault-versions");
        for(const ver of v.versions||[]){const b=el("button","small-button",new Date(ver.uploaded_at).toLocaleString()+" · "+Math.ceil(ver.byte_size/1024)+" KB");
         b.type="button";b.addEventListener("click",()=>vaultDownload(d.doc_id,ver.id).catch(e=>tell(e.message)));wrap.append(b)}
        item.querySelector(".vault-versions")?.remove();item.append(wrap);
       }catch(e){tell(e.message)}
      });tools.append(history);
     }
    }
   }
   item.append(tools);list.append(item);
  }
  events.append(el("h3","vault-heading","AUDIT HISTORY"));
  try{const q=await vaultRequest("/audit");if(!q.events?.length)events.append(el("p","vault-meta","No compliance actions recorded."));
    for(const ev of (q.events||[]).slice(0,12))events.append(el("p","vault-meta",new Date(ev.created_at).toLocaleString()+" · "+ev.action.replaceAll("_"," ")+" · "+ev.doc_id));
  }catch{events.append(el("p","vault-meta","Audit history unavailable."))}
 }
 refresh().catch(e=>tell(e.message||"Unable to load vault."));
}

function infoPanel(area){
 const container=el("div","panel-grid");
 if(area==="privacy"){
  const notice=el("article","panel-box");
  append(notice,el("span","status","SYNTHETIC ONLY · NO REAL IDENTITY OR PERSONAL DATA"),
   el("h2","","Privacy Requests & Export — Training Sandbox"),
   el("p","","Fixed fictional identity fixtures and role-scoped review; real access/correction/deletion/consent withdrawal or data export is disabled."));
  const mount=el("div","vor016-mount","Loading fictional privacy rights workflow…");
  container.append(notice,mount);
  // Only server-approved company Admin /overview and AAL2 MFA can reach this dashboard.
  const validatedRole=state.role;
  if(!state.access||!["owner","operator","auditor"].includes(validatedRole)){
   mount.textContent="Verified company Admin role and AAL2 MFA required.";return container;
  }
  import("./privacy-requests-ui.js").then(mod=>{
   if(state.area!=="privacy"||!state.access||state.role!==validatedRole)return;
   if(!state.privacySandbox||state.privacySandbox.snapshot().role!==validatedRole)
    state.privacySandbox=mod.createPrivacyRequestsSandbox(validatedRole);
   const result=mod.mountPrivacyRequestsSandbox(mount,state.privacySandbox);
   if(!result.ok)mount.textContent="Fictional privacy workflow unavailable.";
  }).catch(()=>{if(state.area==="privacy")mount.textContent="Fictional privacy workflow unavailable; no personal data accessed.";});
  return container;
 }
 if(area==="governance"){
  const notice=el("article","panel-box");
  append(notice,el("span","status","FICTIONAL ONLY · NO LIVE MODEL OR CUSTOMER DATA"),
   el("h2","","AI Governance & Reporting — Sandbox"),
   el("p","","Synthetic version registry, safety flags and aggregate fixture metrics. Production release is permanently disabled in this panel."));
  const mount=el("div","vor014-mount","Loading fictional governance controls…");
  container.append(notice,mount);
  // Reachable solely inside an active AAL2/ACL verified Admin dashboard.
  const validatedRole=state.role;
  if(!state.access||!["owner","operator","auditor"].includes(validatedRole)){
   mount.textContent="Verified company Admin role and AAL2 MFA required.";return container;
  }
  import("./ai-governance-ui.js").then(mod=>{
   if(state.area!=="governance"||!state.access||state.role!==validatedRole)return;
   if(!state.governanceSandbox||state.governanceSandbox.snapshot().role!==validatedRole)
    state.governanceSandbox=mod.createAiGovernanceSandbox(validatedRole);
   const result=mod.mountAiGovernanceSandbox(mount,state.governanceSandbox);
   if(!result.ok)mount.textContent="Synthetic governance panel unavailable.";
  }).catch(()=>{if(state.area==="governance")mount.textContent="Synthetic governance panel unavailable; no real data was accessed.";});
  return container;
 }
 if(area==="support"){
  const notice=el("article","panel-box");
  append(notice,el("span","status","FICTIONAL ONLY · NO LIVE COMPLAINT DATA"),
    el("h2","","Support & Complaints — Training Sandbox"),
    el("p","","Temporary role-scoped examples; no production tickets, user information, customer identities, email delivery or real SLA commitments."));
  const mount=el("div","vor013-mount","Loading fictional support workflow…");
  container.append(notice,mount);
  const validatedRole=state.role;
  if(!state.access||!["owner","operator","auditor"].includes(validatedRole)){
   mount.textContent="Verified company Admin role and AAL2 MFA required.";return container;
  }
  import("./support-lifecycle-ui.js").then(mod=>{
   if(state.area!=="support"||!state.access||state.role!==validatedRole)return;
   if(!state.supportSandbox||state.supportSandbox.snapshot().role!==validatedRole)
    state.supportSandbox=mod.createSupportLifecycleSandbox
      ?mod.createSupportLifecycleSandbox(validatedRole):null;
   if(!state.supportSandbox){
    import("./support-lifecycle-sandbox.js").then(m=>{
     if(state.area!=="support"||!state.access||state.role!==validatedRole)return;
     state.supportSandbox=m.createSupportLifecycleSandbox(validatedRole);
     mod.mountSupportLifecycleSandbox(mount,state.supportSandbox);
    }).catch(()=>{mount.textContent="Sandbox unavailable; no live support data accessed.";});
   }else mod.mountSupportLifecycleSandbox(mount,state.supportSandbox);
  }).catch(()=>{if(state.area==="support")mount.textContent="Sandbox unavailable; no live support data accessed.";});
  return container;
 }
 if(area==="readiness"){
  const notice=el("article","panel-box");
  append(notice,el("span","status","FICTIONAL · NEVER PRODUCTION"),
    el("h2","","Readiness template operations — simulation"),
    el("p","","The platform verified your role and MFA before this panel opened. All examples are public, fictional templates; browser permissions here never authorize real customer data or financial services."));
  const mount=el("div","vor010-mount","Loading versioned synthetic templates…");
  container.append(notice,mount);
  // This branch is reached ONLY within the previously authenticated dashboard.
  // Admin /overview enforces approved identity+role+AAL2 MFA server-side.
  const validatedRole=state.role;
  if(!state.access||!["owner","operator","auditor"].includes(validatedRole)){
   mount.textContent="Approved admin role and MFA required.";
   return container;
  }
  import("./admin-readiness-sandbox.js").then(mod=>{
   if(state.area!=="readiness"||!state.access||state.role!==validatedRole)return;
   if(!state.readinessSandbox||state.readinessSandbox.role!==validatedRole)
    state.readinessSandbox=mod.createAdminReadinessSandbox(validatedRole);
   mount.replaceChildren();
   const outcome=mod.mountAdminReadinessSandbox(mount,state.readinessSandbox);
   if(!outcome.ok)mount.textContent="Synthetic readiness module unavailable.";
  }).catch(()=>{if(state.area==="readiness")mount.textContent="Synthetic readiness module unavailable; no customer data was accessed.";});
  return container;
 }
 if(area==="overview"){
  const cards=el("div","metric-grid");const c=state.counters;
  for(const [k,label] of [["todo","To do"],["in_progress","In progress"],["blocked","Blocked"],["done","Completed"]]){
   const m=el("article","metric");append(m,el("strong","",c[k]||0),el("span","",label));cards.append(m)
  }
  const frag=document.createDocumentFragment();frag.append(cards);
  for(const m of state.modules)container.append(box(m.name,m.help,m.state,m.id==="website"?"https://github.com/gobindatlkdr-cloud/vorvan-website/actions":m.id==="security"?"https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh/advisors/security":undefined));
  frag.append(container);return frag;
 }
 const module=state.modules.find(m=>m.id===area);if(module)container.append(box(module.name,module.help,module.state));
 const extras={
  partners:[["Partner Desk","Public roadmap; partner email links only.","enquiry_only","https://vorvan.co.in/partner-desk.html"],["Partnership approvals","Direct LSP and API only; no referral-only model.","locked","https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh"]],
  ai:[["Demo Edge Function","JWT-guarded fictional guidance for three credit scenarios.","demo_only","https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh/functions"],["Website Guide","Multilingual, free, live rule-based information assistant is active; no LLM or customer data.","published","https://vorvan.co.in/"],["Production LLM","Not activated; regulated data, model and cost approval required.","locked"]],
  customers:[["Customer profiles","No customers registered or financial information accessible via this console.","locked"],["KYC / Credit report","Consent, vendor contracts and authorisation required.","locked"],["Loan applications","Lender integration disabled.","locked"]],
  support:[["Support mailbox","support@vorvan.co.in on Zoho, user-verified mail delivery.","published","mailto:support@vorvan.co.in"],["Legal and grievances","legal@vorvan.co.in; official private documents should not be sent through ordinary email.","published","mailto:legal@vorvan.co.in"]],
  security:[["Authentication","Password + verified email + authenticator-app MFA (AAL2) required.","published"],["Public website security","Github Actions checks and CSP are defence in depth, not a penetration test.","review_required","https://github.com/gobindatlkdr-cloud/vorvan-website/actions"],["Audit history","Task create/update operations are logged server-side.","published"]],
  website:[["Published website","Official custom domain is live on GitHub Pages with HTTPS enabled.","published","https://gobindatlkdr-cloud.github.io/vorvan-website/"],["Bought domain: vorvan.co.in","Domain India DNS mapping, four GitHub Pages A records, www CNAME and HTTPS redirects verified.","published","https://vorvan.co.in/"],["Repository","Edit and deploy website source through GitHub.","published","https://github.com/gobindatlkdr-cloud/vorvan-website"]],
  email:[["Five Zoho company addresses","Admin, Partnerships, Support and Legal mailboxes, plus Info alias to Admin; user verified SPF/DKIM/DMARC and mail delivery.","published"],["Website domain mapping","The website is live on HTTPS; Zoho Mail DNS routing remains separate and configured.","published","https://vorvan.co.in/"]],
  compliance:[["Regulatory approval","RBI digital lending and lender contract review pending.","locked"],["Privacy & legal documents","Informational templates; professional review required before customer launch.","review_required","https://vorvan.co.in/privacy.html"]]
 };
 for(const v of extras[area]||[])container.append(box(...v));
 if(area==="email"){
  const mail=el("article","panel-box");append(mail,el("h2","","Company @vorvan.co.in addresses"),el("p","","Email setup verified by company administrator; DNS and website-host mapping are separate."));
  const list=el("div","mail-list");
  for(const p of ["admin","partnerships","support","legal","info"]){
   const line=el("div","mail-line");append(line,el("strong","",p+"@vorvan.co.in"),el("span","","EMAIL CONFIGURED"));list.append(line)
  }
  mail.append(list);container.append(mail)
 }
 if(area==="partners"||area==="support")tracker(container,area);
 if(area==="partners")institutionalInbox(container);
  if(area==="compliance")vaultPanel(container);
 if(area==="security"){
  const pane=el("article","panel-box");pane.append(el("h2","","Recent task changes"));
  const log=el("div","", "Loading audit history…");pane.append(log);container.append(pane);
  call("/audit").then(x=>{log.replaceChildren();for(const ev of (x.events||[])){log.append(el("p","",new Date(ev.created_at).toLocaleString()+" · "+ev.action))}if(!x.events?.length)log.textContent="No administrative task changes yet."}).catch(()=>{log.textContent="Audit data unavailable."})
 }
 return container;
}
function tasks(){
 const container=$("task-list");container.replaceChildren();
 const list=state.area==="overview"?state.tasks:state.tasks.filter(t=>t.area===state.area);
 if(!list.length){container.append(el("p","subtitle","No work items in this section."));return}
 for(const t of list){
  const card=el("article","task");const left=el("div");
  append(left,el("strong","",t.title),el("div","details",t.notes||"No notes"),el("span","meta",t.area.toUpperCase()+" · "+t.priority+" · "+new Date(t.updated_at).toLocaleDateString()));
  const select=el("select");select.setAttribute("aria-label","Status for "+t.title);
  for(const status of ["todo","in_progress","blocked","done"]){const opt=el("option","",status.replace("_"," "));opt.value=status;opt.selected=(t.status===status);select.append(opt)}
  select.disabled=state.role==="auditor";select.addEventListener("change",async()=>{const prior=t.status;select.disabled=true;try{await call("/tasks/"+encodeURIComponent(t.id),"PATCH",{status:select.value});await load();render()}catch(e){select.value=prior;message("dashboard-message",e.message)}finally{select.disabled=false}});
  append(card,left,select);container.append(card);
 }
}

function institutionalInbox(container){
 const pane=el("article","panel-box");
 append(pane,el("h2","","New institutional inquiries — Bank / NBFC only"),el("p","","Public form submissions are unverified. Confirm entity registration, official domain, sender authority and direct LSP/API fit before replying. Status changes do not create accounts."));
 const reload=el("button","primary","Refresh inquiry inbox");reload.type="button";pane.append(reload);
 const list=el("div","tracker-list","Loading institutional inquiries…");pane.append(list);container.append(pane);
 async function loadInbox(){
  if(!state.access)return;list.textContent="Loading…";
  try{
   const r=await fetch(API+"/functions/v1/institutional-inquiries",{method:"GET",headers:authHeaders(true),cache:"no-store"});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(data.code||"unavailable");
   list.replaceChildren();
   const entries=Array.isArray(data.inquiries)?data.inquiries:[];
   if(!entries.length){list.append(el("p","subtitle","No online institutional inquiries received yet."));return;}
   const count=el("p","subtitle",entries.length+" most recent inquiries; newest first.");list.append(count);
   for(const record of entries){
    const card=el("article","task"),left=el("div");
    append(left,el("strong","",record.institution_name+" · "+record.institution_type.toUpperCase()));
    append(left,el("div","details",record.contact_name+" — "+record.designation+" · "+record.official_email));
    append(left,el("div","details","Track: "+record.partnership_track+" · Source: "+record.source_channel+" · "+new Date(record.created_at).toLocaleString()));
    const safeSite=String(record.institution_website||"");
    if(/^https:\/\/[A-Za-z0-9.-]+(?:\/|$)/.test(safeSite)){
     const site=el("a","","Institution website");site.href=safeSite;site.target="_blank";site.rel="noopener noreferrer nofollow";left.append(site);
    }
    append(left,el("p","details",record.agenda));
    if(record.business_phone)append(left,el("div","details","Business phone: "+record.business_phone));
    const mail=el("a","","Reply from company mailbox ↗");mail.href="mailto:"+encodeURIComponent(record.official_email)+"?subject="+encodeURIComponent("Re: VORVAN direct LSP/API institutional inquiry");
    left.append(mail);
    const controls=el("div","");
    const status=el("select");status.setAttribute("aria-label","Review stage for "+record.institution_name);
    for(const st of ["new","reviewing","verified","contacted","closed","rejected"]){const o=el("option","",st);o.value=st;o.selected=record.status===st;status.append(o);}
    status.disabled=state.role==="auditor";
    controls.append(status);
    const note=el("textarea");note.maxLength=500;note.rows=2;note.placeholder="Internal verification note (no customer data)";note.value=record.review_note||"";note.disabled=state.role==="auditor";
    const save=el("button","primary","Save review");save.type="button";save.disabled=state.role==="auditor";
    const feedback=el("span","meta","");
    save.addEventListener("click",async()=>{
      save.disabled=true;feedback.textContent="Saving…";
      try{
       const r=await fetch(API+"/functions/v1/institutional-inquiries?id="+encodeURIComponent(record.id),{
        method:"PATCH",headers:authHeaders(true),body:JSON.stringify({status:status.value,review_note:note.value.trim()}),cache:"no-store"
       });
       const v=await r.json().catch(()=>({}));if(!r.ok)throw Error(v.code||"save_failed");
       feedback.textContent="Saved. This is only an internal review stage, not institutional access.";
      }catch(e){feedback.textContent="Not saved: "+e.message;}finally{save.disabled=state.role==="auditor";}
    });
    const auditButton=el("button","","View review history");auditButton.type="button";
    const auditList=el("div","details","History available to MFA-approved staff only.");
    auditButton.addEventListener("click",async()=>{
      auditButton.disabled=true;auditList.textContent="Loading history…";
      try{
       const r=await fetch(API+"/functions/v1/institutional-inquiries?view=audit&id="+encodeURIComponent(record.id),
        {method:"GET",headers:authHeaders(true),cache:"no-store"});
       const v=await r.json().catch(()=>({}));if(!r.ok)throw Error(v.code||"audit_unavailable");
       auditList.replaceChildren();
       for(const ev of (Array.isArray(v.events)?v.events:[])){
        auditList.append(el("p","",new Date(ev.created_at).toLocaleString()+" · "+ev.action));
       }
       if(!auditList.children.length)auditList.textContent="No recorded audit events.";
      }catch(e){auditList.textContent="Audit history unavailable: "+e.message;}
      finally{auditButton.disabled=false;}
    });
    append(controls,el("p","meta","Internal status"),status,note,save,feedback,auditButton,auditList);
    append(card,left,controls);list.append(card);
   }
  }catch(err){list.textContent="Inbox unavailable: "+err.message+". Do not share your login or OTP.";}
 }
 reload.addEventListener("click",loadInbox);loadInbox();
}

function render(){
 const [title,subtitle]=AREAS[state.area];$("page-title").textContent=title;$("page-subtitle").textContent=subtitle;$("panel-content").replaceChildren(infoPanel(state.area));$("new-task-toggle").disabled=state.role==="auditor";
 for(const b of document.querySelectorAll("#panel-nav button")){b.classList.toggle("selected",b.dataset.area===state.area)}
 const syntheticOnly=state.area==="readiness"||state.area==="governance"||state.area==="privacy";
 $("new-task-toggle").hidden=syntheticOnly;document.querySelector(".worklist").hidden=syntheticOnly;
 $("task-area").value=syntheticOnly?"overview":state.area;if(!syntheticOnly)tasks();
}
async function addTask(event){
 event.preventDefault();
 try{
  await call("/tasks","POST",{area:$("task-area").value,title:$("task-title").value.trim(),notes:$("task-notes").value,priority:"normal"});
  $("task-title").value="";$("task-notes").value="";visible("new-task-form",false);await load();render();
 }catch(e){message("dashboard-message",e.message)}
}
$("signin-form").addEventListener("submit",login);
$("signup-open").addEventListener("click",openSignup);
$("signup-form").addEventListener("submit",signup);
$("signup-back").addEventListener("click",backToSignin);
$("mfa-form").addEventListener("submit",verifyMfa);
$("mfa-reset-pending").addEventListener("click",restartPendingMfa);
$("mfa-reveal-secret").addEventListener("click",()=>{const box=$("mfa-secret");if(!box.textContent)return;visible("mfa-secret",box.hidden);$("mfa-reveal-secret").textContent=box.hidden?"Show manual setup key":"Hide manual setup key"});
$("mfa-cancel").addEventListener("click",clearSession);
$("logout").addEventListener("click",()=>{const jwt=state.access;clearSession();if(jwt)fetch(AUTH+"/logout",{method:"POST",headers:{"apikey":PUB,authorization:"Bearer "+jwt}}).catch(()=>{});});
$("reload").addEventListener("click",async()=>{try{await load();render()}catch(e){message("dashboard-message",e.message)}});
for(const b of document.querySelectorAll("#panel-nav button"))b.addEventListener("click",()=>{state.area=b.dataset.area;visible("new-task-form",false);render()});
$("new-task-toggle").addEventListener("click",()=>visible("new-task-form",$("new-task-form").hidden));
$("new-task-form").addEventListener("submit",addTask);
})();