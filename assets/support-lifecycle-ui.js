/** VOR-013 browser-only synthetic Support Queue; caller must verify AAL2 & role via admin-console. */
import {CATEGORIES,STATES,createSupportLifecycleSandbox,PRESETS,VERSION} from "./support-lifecycle-sandbox.js";
const make=(tag,text="",className="")=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
const append=(p,...children)=>{p.append(...children);return p;};
export function mountSupportLifecycleSandbox(root,desk){
 if(!root||typeof root.replaceChildren!=="function"||!desk||typeof desk.snapshot!=="function")return {ok:false};
 const initial=desk.snapshot();
 if(!["owner","operator","auditor"].includes(initial.role))return {ok:false};
 const container=make("section","","vor013-panel");
 const heading=make("h2","Support & Complaints — Synthetic Lifecycle");
 const warning=make("p","SANDBOX · Fictional cases only. No real users, tickets, messages, identities, SLAs or complaint submissions. Actions do not reach any mailbox.");
 const roles=make("p","MFA-approved staff role: "+initial.role+" · Case data only in this page memory.");
 const controls=make("div","","vor013-controls"),caseList=make("div","","vor013-cases");
 const feedback=make("p","Choose a fixed fictional issue.","vor013-feedback");feedback.setAttribute("role","status");
 const category=make("select");category.setAttribute("aria-label","Fictional issue category");
 for(const c of CATEGORIES){const opt=make("option",c.replaceAll("_"," "));opt.value=c;category.append(opt);}
 const create=make("button","Create fictional case");create.type="button";
 if(initial.role==="auditor")create.disabled=true;
 const shift=make("button","Advance demo clock by 25h (Owner only)");shift.type="button";shift.disabled=initial.role!=="owner";
 const clear=make("button","Erase demo cases (Owner only)");clear.type="button";clear.disabled=initial.role!=="owner";
 append(controls,category,create,shift,clear);
 const footer=make("p","Targets below are fictional training examples, not regulatory grievance redressal timelines.");
 const summary=make("p","","vor013-summary");
 function announce(x){feedback.textContent=x;}
 function display(){
  const data=desk.snapshot();caseList.replaceChildren();
  summary.textContent=data.cases.length+" fictional cases · "+data.audit.length+" in-memory audit entries · version "+VERSION;
  for(const c of data.cases){
   const article=make("article","","vor013-case");const title=make("h3",c.id+" · "+c.subject);
   const meta=make("p","Status: "+c.status+" · "+c.category+" · sample SLA "+c.sla.target_hours+"h · "+(c.sla.overdue?"OVERDUE":"not overdue")+" · team "+c.assignee_team);
   const timeline=make("p","Demo due: "+new Date(c.sla.due_at_ms).toISOString());
   append(article,title,meta,timeline);
   if(c.sla.escalation_required)article.append(make("p","Training escalation required — overdue without acknowledgement.","vor013-alert"));
   const actions=make("div","","vor013-actions");
   if(data.role!=="auditor"){
    const next=make("select");next.setAttribute("aria-label","Next status for "+c.id);
    for(const target of STATES){
     const option=make("option",target);option.value=target;
     if(target===c.status)option.selected=true;
     next.append(option);
    }
    const update=make("button","Apply transition");update.type="button";
    update.addEventListener("click",()=>{const r=desk.transition(c.id,next.value);announce(r.ok?"Status updated in demo.":"Denied: "+r.code);display();});
    const escalate=make("button","Acknowledge escalation");escalate.type="button";
    escalate.addEventListener("click",()=>{const r=desk.acknowledgeEscalation(c.id);announce(r.ok?"Acknowledgement logged in demo.":"Denied: "+r.code);display();});
    append(actions,next,update,escalate);
   }
   const auditBtn=make("button","View audit events");auditBtn.type="button";
   const history=make("ol");history.hidden=true;
   auditBtn.addEventListener("click",()=>{
    const r=desk.auditFor(c.id);history.replaceChildren();
    if(r.ok)for(const e of r.events)history.append(make("li","#"+e.event_no+" "+e.action+" ("+(e.from||"none")+" → "+(e.to||"none")+") · "+e.actor_role));
    history.hidden=!history.hidden;
   });
   append(article,actions,auditBtn,history);caseList.append(article);
  }
  if(!data.cases.length)caseList.append(make("p","No fictional cases. Nothing is submitted to production."));
 }
 create.addEventListener("click",()=>{
  const r=desk.intake({mode:"synthetic_only",category:category.value,preset:category.value});
  announce(r.ok?"Fictional case created.":"Denied: "+r.code);display();
 });
 shift.addEventListener("click",()=>{const r=desk.advanceClock(25);announce(r.ok?"Fictional clock advanced 25 hours.":"Denied: "+r.code);display();});
 clear.addEventListener("click",()=>{const r=desk.reset();announce(r.ok?"Synthetic demo erased.":"Denied: "+r.code);display();});
 append(container,heading,warning,roles,controls,feedback,summary,caseList,footer);
 root.replaceChildren(container);display();return {ok:true,mode:"synthetic_only"};
}
