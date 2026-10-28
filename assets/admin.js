/* VORVAN Admin Console. First-party JS only. No localStorage, cookies, third-party scripts or embedded secrets.
 * Only the Supabase publishable key is public. All admin rights are server-side. */
(()=>{"use strict";
const API="https://kukfpsqujlutlgwndplh.supabase.co";
const PUB="sb_publishable_6KyGNqt8CGNlE8vCBdtalA_Ayhfo-Rj";
const AUTH=API+"/auth/v1";
const EDGE=API+"/functions/v1/admin-console";
const COMPANY="vorvan.pvt.ltd@gmail.com";
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
function clearSession(){state.access="";state.refresh="";state.mfaFactor="";state.user=null;state.tasks=[];state.modules=[];state.role="";$("password").value="";$("mfa-code").value="";$("mfa-secret").textContent="";$("mfa-qr").removeAttribute("src");visible("mfa-setup",false);visible("dashboard-view",false);visible("mfa-view",false);visible("login-view",true);visible("logout",false)}
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
async function signup(){
 const password=$("password").value;
 if(password.length<12){message("login-message","Enter a unique password of at least 12 characters, then choose Create account.");return}
 try{
  const redirect=encodeURIComponent("https://gobindatlkdr-cloud.github.io/vorvan-website/admin.html");
  await auth("/signup?redirect_to="+redirect,"POST",{email:COMPANY,password},false);
  $("password").value="";
  message("login-message","Account registration requested. Open the confirmation email in vorvan.pvt.ltd@gmail.com and verify it; then return here to sign in. If you already registered, use Sign in.",true);
 }catch(e){message("login-message",e.message||"Signup unavailable. Check Supabase Auth settings.")}
}
async function startMfa(){
 visible("login-view",false);visible("dashboard-view",false);visible("mfa-view",true);
 message("mfa-message","");
 $("mfa-code").value="";
 try{
  const factors=Array.isArray(state.user?.factors)?state.user.factors:[];
  const verified=factors.find(f=>f.factor_type==="totp"&&f.status==="verified");
  if(verified){state.mfaFactor=verified.id;state.mfaSetup=false;visible("mfa-setup",false);$("mfa-explanation").textContent="Open your existing authenticator app and enter the current 6-digit code.";return}
  const result=await auth("/factors","POST",{factor_type:"totp",friendly_name:"VORVAN Admin"},true);
  state.mfaFactor=result.id;state.mfaSetup=true;
  const secret=result.totp?.secret||"";
  $("mfa-secret").textContent=secret;
  const qr=result.totp?.qr_code||"";
  if(typeof qr==="string"&&qr.startsWith("data:image/svg+xml")){$("mfa-qr").src=qr;visible("mfa-qr",true)}
  else visible("mfa-qr",false);
  visible("mfa-setup",true);
  $("mfa-explanation").textContent="Set up TOTP in an authenticator app using the code or QR shown below. Then enter the 6-digit code to enable MFA.";
 }catch(e){message("mfa-message",e.message||"Cannot start MFA. Check Supabase Auth MFA settings.")}
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
  ai:[["Demo Edge Function","JWT-guarded fictional guidance for three credit scenarios.","demo_only","https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh/functions"],["Production LLM","Not activated; regulated data, model and cost approval required.","locked"]],
  customers:[["Customer profiles","No customers registered or financial information accessible via this console.","locked"],["KYC / Credit report","Consent, vendor contracts and authorisation required.","locked"],["Loan applications","Lender integration disabled.","locked"]],
  support:[["Business Gmail","Company inbox is currently the only confirmed live mailbox.","manual_email","https://mail.google.com"],["Grievance channel","Use existing Gmail until official domain mail records are tested.","pending"]],
  security:[["Authentication","Password + verified email + authenticator-app MFA (AAL2) required.","published"],["Public website security","Github Actions checks and CSP are defence in depth, not a penetration test.","review_required","https://github.com/gobindatlkdr-cloud/vorvan-website/actions"],["Audit history","Task create/update operations are logged server-side.","published"]],
  website:[["Published website","GitHub Pages currently serves the company site over HTTPS.","published","https://gobindatlkdr-cloud.github.io/vorvan-website/"],["Bought domain: vorvan.co.in","Purchased via Domain India; nameservers and HTTPS connection not yet verified.","dns_pending","https://domainindia.com/client/domains"],["Repository","Edit and deploy website source through GitHub.","published","https://github.com/gobindatlkdr-cloud/vorvan-website"]],
  email:[["Domain email not yet configured","Avoid advertising these addresses until MX/SPF/DKIM/DMARC are live and verified.","dns_pending"],["Recommended provider","Zoho Mail free custom domain if eligible, or Cloudflare free inbound forwarding only.","pending","https://www.zoho.com/mail/"]],
  compliance:[["Regulatory approval","RBI digital lending and lender contract review pending.","locked"],["Privacy & legal documents","Informational templates; professional review required before customer launch.","review_required","https://gobindatlkdr-cloud.github.io/vorvan-website/privacy.html"]]
 };
 for(const v of extras[area]||[])container.append(box(...v));
 if(area==="email"){
  const mail=el("article","panel-box");append(mail,el("h2","","Planned @vorvan.co.in addresses"),el("p","","Not active mailboxes — setup requires provider verification and DNS changes."));
  const list=el("div","mail-list");
  for(const p of ["info","partnerships","support","security","admin"]){
   const line=el("div","mail-line");append(line,el("strong","",p+"@vorvan.co.in"),el("span","","NOT ACTIVE"));list.append(line)
  }
  mail.append(list);container.append(mail)
 }
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
$("signup").addEventListener("click",signup);
$("mfa-form").addEventListener("submit",verifyMfa);
$("mfa-cancel").addEventListener("click",clearSession);
$("logout").addEventListener("click",()=>{const jwt=state.access;clearSession();if(jwt)fetch(AUTH+"/logout",{method:"POST",headers:{"apikey":PUB,authorization:"Bearer "+jwt}}).catch(()=>{});});
$("reload").addEventListener("click",async()=>{try{await load();render()}catch(e){message("dashboard-message",e.message)}});
for(const b of document.querySelectorAll("#panel-nav button"))b.addEventListener("click",()=>{state.area=b.dataset.area;visible("new-task-form",false);render()});
$("new-task-toggle").addEventListener("click",()=>visible("new-task-form",$("new-task-form").hidden));
$("new-task-form").addEventListener("submit",addTask);
})();