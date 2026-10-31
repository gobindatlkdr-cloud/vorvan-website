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
 customers:["Customer Operations","Confidential account operations stay locked until approved"],
 support:["Support & Grievances","Issue tracking and business correspondence work queue"],
 security:["Security & Audit","Authentication controls, checks and administrative change history"],
 website:["Website & Domain","GitHub Pages deployment and vorvan.co.in verification plan"],
 email:["Department Emails","Domain-based corporate mailboxes and DNS setup status"],
 compliance:["Legal & Compliance","Review checklist, consents, contracts and compliance readiness"]
};
const $=(id)=>document.getElementById(id);
const state={access:"",refresh:"",role:"",tasks:[],modules:[],counters:{},area:"overview",mfaFactor:"",mfaSetup:false,user:null,events:[]};
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
function clearSession(){state.access="";state.refresh="";state.mfaFactor="";state.user=null;state.tasks=[];state.modules=[];state.role="";$("password").value="";$("signup-password").value="";$("signup-confirm").value="";$("mfa-code").value="";$("mfa-secret").textContent="";$("mfa-qr").removeAttribute("src");visible("mfa-setup",false);visible("dashboard-view",false);visible("mfa-view",false);visible("signup-view",false);visible("login-view",true);visible("logout",false)}
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
  if(typeof qr==="string"&&qr.startsWith("data:image/svg+xml")){$("mfa-qr").src=qr;visible("mfa-qr",true)}
  else visible("mfa-qr",false);
  visible("mfa-setup",true);visible("mfa-pending-help",false);
  $("mfa-explanation").textContent="Scan this new QR code, then enter the six-digit code from that exact authenticator entry.";
 }catch(e){
   visible("mfa-pending-help",true);
   $("mfa-explanation").textContent="Your MFA setup could not continue. Use the recovery button below to replace a single incomplete authenticator registration.";
   message("mfa-message",e.message||"Incomplete MFA setup detected. Use recovery below.");
 }
}
async function restartPendingMfa(){
  const button=$("mfa-reset-pending");
  button.disabled=true;
  try{
    const user=await auth("/user","GET",undefined,true);
    if(user.email?.toLowerCase()!==COMPANY)throw Error("Wrong administrator account.");
    const factors=Array.isArray(user.factors)?user.factors:[];
    if(factors.some(x=>x.factor_type==="totp"&&x.status==="verified")){
      throw Error("A verified MFA is present. It cannot be reset here.");
    }
    const pending=factors.filter(x=>x.factor_type==="totp"&&x.status==="unverified");
    if(pending.length!==1||!pending[0].id)throw Error("Incomplete factor not found. Please sign out and back in.");
    await auth("/factors/"+encodeURIComponent(pending[0].id),"DELETE",undefined,true);
    const result=await auth("/factors","POST",{factor_type:"totp",friendly_name:"VORVAN Admin renewed"},true);
    state.mfaFactor=result.id;
    const qr=result.totp?.qr_code||"";
    $("mfa-secret").textContent=result.totp?.secret||"";
    if(qr.startsWith("data:image/svg+xml")){$("mfa-qr").src=qr;visible("mfa-qr",true)}
    else visible("mfa-qr",false);
    visible("mfa-setup",true);visible("mfa-pending-help",false);
    $("mfa-code").value="";
    $("mfa-explanation").textContent="Scan the NEW QR code in your authenticator app. Enter the 6-digit code from the NEW entry, not the old one.";
    message("mfa-message","A new MFA enrollment is ready. Keep the old authenticator entry until this one is verified.",true);
  }catch(e){message("mfa-message",e.message||"MFA setup recovery failed.")}
  finally{button.disabled=false}
}
async function verifyMfa(event){
 event.preventDefault();message("mfa-message","");
 const code=$("mfa-code").value.trim();
 if(!/^\d{6}$/.test(code)||!state.mfaFactor){message("mfa-message","Enter a valid six-digit authenticator code.");return}
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
 const data=await call("/overview");state.tasks=Array.isArray(data.tasks)?data.tasks:[];state.modules=Array.isArray(data.modules)?data.modules:[];state.counters=data.counters||{};state.role=data.role||"unknown";
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

function infoPanel(area){
 const container=el("div","panel-grid");
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
  partners:[["Partner Desk","Public roadmap; partner email links only.","enquiry_only","https://gobindatlkdr-cloud.github.io/vorvan-website/partner-desk.html"],["Partnership approvals","Direct LSP and API only; no referral-only model.","locked","https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh"]],
  ai:[["Demo Edge Function","JWT-guarded fictional guidance for three credit scenarios.","demo_only","https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh/functions"],["Website Guide","Multilingual, free, live rule-based information assistant is active; no LLM or customer data.","published","https://gobindatlkdr-cloud.github.io/vorvan-website/"],["Production LLM","Not activated; regulated data, model and cost approval required.","locked"]],
  customers:[["Customer profiles","No customers registered or financial information accessible via this console.","locked"],["KYC / Credit report","Consent, vendor contracts and authorisation required.","locked"],["Loan applications","Lender integration disabled.","locked"]],
  support:[["Support mailbox","support@vorvan.co.in on Zoho, user-verified mail delivery.","published","mailto:support@vorvan.co.in"],["Legal and grievances","legal@vorvan.co.in; official private documents should not be sent through ordinary email.","published","mailto:legal@vorvan.co.in"]],
  security:[["Authentication","Password + verified email + authenticator-app MFA (AAL2) required.","published"],["Public website security","Github Actions checks and CSP are defence in depth, not a penetration test.","review_required","https://github.com/gobindatlkdr-cloud/vorvan-website/actions"],["Audit history","Task create/update operations are logged server-side.","published"]],
  website:[["Published website","GitHub Pages currently serves the company site over HTTPS.","published","https://gobindatlkdr-cloud.github.io/vorvan-website/"],["Bought domain: vorvan.co.in","Purchased via Domain India; nameservers and HTTPS connection not yet verified.","dns_pending","https://domainindia.com/client/domains"],["Repository","Edit and deploy website source through GitHub.","published","https://github.com/gobindatlkdr-cloud/vorvan-website"]],
  email:[["Five Zoho company addresses","Admin, Partnerships, Support and Legal mailboxes, plus Info alias to Admin; user verified SPF/DKIM/DMARC and mail delivery.","published"],["Website domain mapping","vorvan.co.in website DNS and HTTPS cutover are separate from company email and still pending.","dns_pending","https://github.com/gobindatlkdr-cloud/vorvan-website/settings/pages"]],
  compliance:[["Regulatory approval","RBI digital lending and lender contract review pending.","locked"],["Privacy & legal documents","Informational templates; professional review required before customer launch.","review_required","https://gobindatlkdr-cloud.github.io/vorvan-website/privacy.html"]]
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
function render(){
 const [title,subtitle]=AREAS[state.area];$("page-title").textContent=title;$("page-subtitle").textContent=subtitle;$("panel-content").replaceChildren(infoPanel(state.area));$("new-task-toggle").disabled=state.role==="auditor";
 for(const b of document.querySelectorAll("#panel-nav button")){b.classList.toggle("selected",b.dataset.area===state.area)}
 $("task-area").value=state.area;tasks();
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
$("mfa-cancel").addEventListener("click",clearSession);
$("logout").addEventListener("click",()=>{const jwt=state.access;clearSession();if(jwt)fetch(AUTH+"/logout",{method:"POST",headers:{"apikey":PUB,authorization:"Bearer "+jwt}}).catch(()=>{});});
$("reload").addEventListener("click",async()=>{try{await load();render()}catch(e){message("dashboard-message",e.message)}});
for(const b of document.querySelectorAll("#panel-nav button"))b.addEventListener("click",()=>{state.area=b.dataset.area;visible("new-task-form",false);render()});
$("new-task-toggle").addEventListener("click",()=>visible("new-task-form",$("new-task-form").hidden));
$("new-task-form").addEventListener("submit",addTask);
})();