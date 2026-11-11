/** VOR-013 — mount only inside verified admin dashboard after real /overview MFA+ACL.
 * This UI makes in-memory fictional cases; never submits any support form/API or email.
 * No user-supplied free text, local/session storage, cookies, or personal data.
 */
import {
 SUPPORT_VERSION,START_MS,FIXED_CASES,nextStatuses
} from "./support-lifecycle-sandbox.js";
const HOURS=[0,4,12,24,48,72,120,168,240];
const isAllowedRole=role=>["owner","operator","auditor"].includes(role);
export function mountSupportLifecycleSandbox(root,sandbox){
 if(!root||!sandbox?.ok||!isAllowedRole(sandbox.role)||sandbox.version!==SUPPORT_VERSION)
  return {ok:false,code:"admin_session_required"};
 const d=root.ownerDocument||document;
 let simulatedHours=0,sequence=0;
 const make=(tag,text,cl)=>{
  const x=d.createElement(tag);if(text!==undefined)x.textContent=String(text);
  if(cl)x.className=cl;return x;
 };
 const append=(parent,...children)=>{parent.append(...children);return parent;};
 const isoToHours=h=>START_MS+h*3600000;
 const issueId=()=>{
  if(!globalThis.crypto?.randomUUID)throw new Error("Secure fictional ID generator unavailable");
  return crypto.randomUUID();
 };
 const nextRequest=()=>issueId();
 const msg=make("p","","vor013-message");msg.setAttribute("role","status");msg.setAttribute("aria-live","polite");
 const head=make("section",undefined,"vor013-header");
 append(head,make("h2","VOR-013 · Fictional Support & Complaints Lifecycle"),
  make("p","DEMO ONLY — Fixed fictional templates. No real complaints received, no customer data, no email, and no backend audit or notification."),
  make("p","Illustrative response targets only: NOT legally guaranteed grievance timelines. Actual customer complaints must use approved support/legal channels."));
 const controls=make("div",undefined,"vor013-controls");
 const labelClock=make("label","Synthetic time offset");
 const selectClock=make("select");selectClock.setAttribute("aria-label","Synthetic time offset");
 for(const h of HOURS){const opt=make("option",h+" hours after fictional start");opt.value=String(h);selectClock.append(opt);}
 labelClock.append(selectClock);
 const labelTemplate=make("label","Generate a fictional case");
 const choice=make("select");choice.setAttribute("aria-label","Fictional case template");
 const visible=FIXED_CASES.filter(x=>sandbox.role!=="operator"||x.scope==="operations");
 for(const item of visible){const opt=make("option",item.subject+" ("+item.scope+")");opt.value=item.id;choice.append(opt);}
 labelTemplate.append(choice);
 const add=make("button","Add demo case");add.type="button";add.disabled=sandbox.role==="auditor";
 const reset=make("button","Owner: erase all demo cases");reset.type="button";reset.disabled=sandbox.role!=="owner";
 append(controls,labelClock,labelTemplate,add,reset);
 const summary=make("p",undefined,"vor013-meta");
 const queue=make("div",undefined,"vor013-queue");
 const history=make("section",undefined,"vor013-audit");
 history.append(make("h3","In-memory demonstration audit events"));
 const auditList=make("div");
 history.append(auditList);
 function show(text,good=false){
  msg.textContent=text;msg.className=good?"vor013-message is-ok":"vor013-message";
 }
 const currentTime=()=>isoToHours(simulatedHours);
 const changes=(work)=>{
  try{const r=work();
   if(!r.ok){show("Simulation blocked: "+r.code);return;}
   show("Fictional change recorded in browser memory only.",true);
  }catch{show("Synthetic operation unavailable.");}
  render();
 };
 function render(){
  const snap=sandbox.snapshot(currentTime());
  if(!snap.ok){show("Invalid simulation clock");return;}
  queue.replaceChildren();auditList.replaceChildren();
  summary.textContent=snap.cases_visible+" visible fictional cases · "+snap.audit.length+
   " visible in-memory audit events · role: "+snap.role+" · time: "+simulatedHours+
   "h · no backend or customer record created";
  for(const rec of snap.queue){
   const card=make("article",undefined,"vor013-case");
   const title=make("h3",rec.subject);
   const desc=make("p",rec.summary);
   const line=make("p","Status: "+rec.status+" · "+rec.category+" · "+rec.scope+
    " · Version: "+rec.version,"vor013-meta");
   const due=make("p",undefined,"vor013-sla");
   const breaches=Object.entries(rec.sla.breached).filter(([,value])=>value).map(([key])=>key);
   due.textContent="Illustrative targets: acknowledgement "+
    rec.sla.deadline_at.acknowledge+", response "+rec.sla.deadline_at.first_response+
    ", resolution "+rec.sla.deadline_at.resolution+
    ". "+(breaches.length?"Simulated overdue: "+breaches.join(", "):"No simulated overdue target.");
   const actions=make("div",undefined,"vor013-case-actions");
   const permission=snap.permissions.transition&&(sandbox.role!=="operator"||rec.scope==="operations");
   const options=nextStatuses(rec.status);
   if(permission&&options.length){
    const select=make("select");select.setAttribute("aria-label","Next demo status for "+rec.subject);
    for(const status of options){const op=make("option",status.replaceAll("_"," "));op.value=status;select.append(op);}
    const move=make("button","Apply safe transition");move.type="button";
    move.addEventListener("click",()=>changes(()=>sandbox.update({
     mode:"synthetic_only",case_id:rec.id,target_status:select.value,
     expected_version:rec.version,request_id:nextRequest()
    },currentTime())));
    append(actions,select,move);
   }
   if(permission&&["new","triaged","in_progress","awaiting_review","reopened"].includes(rec.status)&&
      (rec.sla.escalation_suggested||rec.category==="security")){
    const esc=make("button","Simulate escalation");esc.type="button";
    esc.addEventListener("click",()=>changes(()=>sandbox.escalate({
      mode:"synthetic_only",case_id:rec.id,expected_version:rec.version,request_id:nextRequest()
    },currentTime())));
    actions.append(esc);
   }
   append(card,title,desc,line,due,actions);queue.append(card);
  }
  if(!snap.queue.length)queue.append(make("p","No fictional cases in this role-scoped queue."));
  for(const entry of snap.audit){
   const row=make("p",entry.seq+" · "+entry.action+" · "+entry.actor_role+
    " · "+entry.from_status+" → "+entry.to_status+" · "+entry.at);
   auditList.append(row);
  }
  if(!snap.audit.length)auditList.append(make("p","No synthetic actions recorded in this tab."));
 }
 add.addEventListener("click",()=>{
  if(add.disabled)return;
  changes(()=>sandbox.add({mode:"synthetic_only",template_id:choice.value,
    request_id:nextRequest()},currentTime()));
 });
 reset.addEventListener("click",()=>changes(()=>sandbox.reset()));
 selectClock.addEventListener("change",()=>{
  const h=Number(selectClock.value);
  if(!HOURS.includes(h)){show("Invalid simulation offset");return;}
  simulatedHours=h;render();
 });
 root.replaceChildren();append(root,head,controls,msg,summary,queue,history);render();
 return {ok:true,role:sandbox.role,mode:"synthetic_only",mounted:true};
}
