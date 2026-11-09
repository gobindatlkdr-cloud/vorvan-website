/**
 * M1 VOR-010 — ADMIN READINESS SANDBOX ONLY.
 * In the real admin page this module is loaded ONLY after server /admin-console/overview
 * has verified Supabase admin ACL + AAL2 MFA. Browser code is NOT an authorization
 * boundary: there are no server writes, APIs, PII, live cases, or lending actions here.
 */
import {createPassportSession} from "./readiness-controller.js";
import {buildEducationalPlan,PLAN_VERSION} from "./readiness-action-plan.js";

export const ADMIN_SANDBOX_VERSION="vor010-synthetic-2026-11-10-v1";
export const ROLES=Object.freeze(["owner","operator","auditor"]);
export const CATEGORIES=Object.freeze(["personal","business","education"]);
export const MILESTONE_IDS=Object.freeze(["d30","d60","d90"]);
export const TASK_STATES=Object.freeze(["todo","in_progress","reviewed"]);
const LOCALES=["en","bn","hi"];
const releaseGates=Object.freeze([
 Object.freeze({id:"incorporation",title:"Certificate of Incorporation (COI/CIN)",state:"blocked",note:"Proposed company — incorporation not verified"}),
 Object.freeze({id:"customer_consent",title:"Customer identity and approved consent",state:"blocked",note:"VOR-006 real customer Auth/consent not released"}),
 Object.freeze({id:"lender_contracts",title:"Direct LSP/API lender agreements",state:"blocked",note:"No verified lender agreement or lender access"}),
 Object.freeze({id:"bureau_data",title:"Credit bureau access and provider agreements",state:"blocked",note:"No real bureau API or credit scores"}),
 Object.freeze({id:"legal_privacy",title:"Legal, regulatory and privacy approval",state:"blocked",note:"Independent professional sign-off outstanding"}),
 Object.freeze({id:"independent_vapt",title:"Independent security assessment",state:"blocked",note:"Real privileged-session tests and VAPT outstanding"}),
 Object.freeze({id:"payments",title:"Live payments and customer charges",state:"blocked",note:"No live payment/merchant operations"})
]);
const copy={
 en:{eyebrow:"VOR-010 · FICTIONAL OPERATIONS",title:"Readiness Operations Sandbox",
 subtitle:"A synthetic template review workspace. Zero real customers, accounts, credit scores or lender decisions.",
 role:"Server-approved role",version:"Template version",categories:"Learning category",milestone:"Milestone",all:"All",
 scope:"Visible work items",templates:"Versioned educational task templates",progress:"Synthetic milestone monitoring",
 state:"Synthetic stage",permissions:"Simulated permissions",read:"View synthetic templates",write:"Change task-stage simulation",
 gates:"Production release gates — always blocked",gateNote:"No role can override these gates. They do not reflect a regulatory approval.",
 queue:"Synthetic work queue",audit:"In-memory demo history",auditNone:"No simulated changes in this tab.",
 reset:"Reset fictional workflow",notice:"Changes only affect temporary demo data in this browser tab. No backend write, audit record, email, notification or financial operation occurs.",
 none:"No synthetic tasks in this role/category filter.", denied:"This action is not available for your assigned demo role.",
 counts:(shown,total)=>shown+" of "+total+" visible task templates",
 progressLabel:(done,total)=>done+" of "+total+" fictional tasks reviewed"},
 bn:{eyebrow:"VOR-010 · কাল্পনিক অপারেশন",title:"রেডিনেস অপারেশন স্যান্ডবক্স",
 subtitle:"শুধু কৃত্রিম টেমপ্লেটের ডেমো। বাস্তব গ্রাহক, অ্যাকাউন্ট, CIBIL স্কোর বা ঋণ সিদ্ধান্ত নেই।",
 role:"সার্ভার অনুমোদিত ভূমিকা",version:"টেমপ্লেট ভার্সন",categories:"শেখার বিভাগ",milestone:"মাইলস্টোন",all:"সব",
 scope:"দেখার অনুমতি থাকা কাজ",templates:"সংস্করণযুক্ত শিক্ষামূলক টাস্ক",progress:"কাল্পনিক মাইলস্টোন অগ্রগতি",
 state:"কাল্পনিক অবস্থা",permissions:"ডেমোর অনুমতি",read:"কৃত্রিম টেমপ্লেট দেখা",write:"ডেমো কাজের অবস্থা বদলানো",
 gates:"প্রোডাকশন চালুর শর্ত — সব বন্ধ",gateNote:"কোনো ভূমিকা এই বাধা সরাতে পারে না; এটি নিয়ন্ত্রক অনুমোদন নয়।",
 queue:"কাল্পনিক কাজের সারি",audit:"এই tab-এর ডেমো ইতিহাস",auditNone:"এই tab-এ কোনো পরিবর্তন হয়নি।",
 reset:"কাল্পনিক কাজ পুনরায় শুরু",notice:"পরিবর্তন শুধু browser tab-এর অস্থায়ী ডেমোতে থাকে। Backend write, বাস্তব audit, ইমেইল, notification বা আর্থিক কাজ হয় না।",
 none:"এই role/category-তে কৃত্রিম কাজ নেই।",denied:"আপনার ডেমো ভূমিকার জন্য এই কাজ অনুমোদিত নয়।",
 counts:(shown,total)=>total+"টির মধ্যে "+shown+"টি টেমপ্লেট দেখা যাচ্ছে",
 progressLabel:(done,total)=>total+"টির মধ্যে "+done+"টি কাল্পনিক কাজ পর্যালোচিত"},
 hi:{eyebrow:"VOR-010 · काल्पनिक ऑपरेशन",title:"रेडिनेस ऑपरेशन सैंडबॉक्स",
 subtitle:"केवल काल्पनिक टेम्पलेट समीक्षा। कोई असली ग्राहक, खाता, CIBIL स्कोर या ऋण निर्णय नहीं।",
 role:"सर्वर-अनुमोदित भूमिका",version:"टेम्पलेट संस्करण",categories:"सीखने की श्रेणी",milestone:"माइलस्टोन",all:"सभी",
 scope:"दिखाई देने वाले कार्य",templates:"संस्करण वाले शैक्षिक टेम्पलेट",progress:"काल्पनिक माइलस्टोन प्रगति",
 state:"काल्पनिक स्थिति",permissions:"डेमो अनुमतियाँ",read:"काल्पनिक टेम्पलेट देखना",write:"डेमो कार्य की स्थिति बदलना",
 gates:"प्रोडक्शन चालू करने की शर्तें — सब अवरुद्ध",gateNote:"कोई भूमिका इन्हें नहीं हटा सकती। यह नियामक मंजूरी नहीं है।",
 queue:"काल्पनिक कार्य सूची",audit:"इस टैब का डेमो इतिहास",auditNone:"इस टैब में कोई बदलाव नहीं हुआ।",
 reset:"काल्पनिक कार्य रीसेट",notice:"बदलाव केवल इस ब्राउज़र टैब की अस्थायी डेमो मेमोरी में हैं। कोई backend write, वास्तविक audit, ईमेल, notification या वित्तीय काम नहीं।",
 none:"इस भूमिका/श्रेणी में कोई काल्पनिक कार्य नहीं।",denied:"यह कार्य आपकी डेमो भूमिका के लिए उपलब्ध नहीं है।",
 counts:(shown,total)=>total+" में से "+shown+" दिखाई देने वाले टेम्पलेट",
 progressLabel:(done,total)=>total+" में से "+done+" काल्पनिक कार्य समीक्षा किए गए"}
};
const recognized=(xs,x)=>typeof x==="string"&&xs.includes(x);
const deny=(code)=>Object.freeze({ok:false,code});
const permissions=(role)=>Object.freeze({read:recognized(ROLES,role),change:role==="owner"||role==="operator",reset:role==="owner",release:false});
/**
 * Immutable, PII-free seed tasks, reusing the *actual* VOR-009 task templates
 * and canonical VOR-007/008 rules. There are NO users/customers/entities.
 */
export function buildSyntheticTemplateCatalog(locale="en"){
 if(!recognized(LOCALES,locale))return deny("invalid_locale");
 const templates=[];
 for(const category of CATEGORIES){
  const snapshot=createPassportSession({category,locale}).snapshot();
  const plan=buildEducationalPlan(snapshot);
  if(!plan.ok||plan.version!==PLAN_VERSION)throw Error("canonical_plan_not_available");
  for(let i=0;i<plan.tasks.length;i++){
   const task=plan.tasks[i];
   templates.push(Object.freeze({
    id:task.id,category,question_id:task.question_id,
    milestone_id:task.milestone_id,due_day:task.due_day,template_version:PLAN_VERSION,
    title:task.title,action:task.action,reason:task.reason,
    assigned_scope:i<4?"operations":"compliance",
    synthetic_only:true
   }));
  }
 }
 return Object.freeze(templates);
}
export function createAdminReadinessSandbox(role){
 if(!recognized(ROLES,role))return deny("unauthorised_role");
 const allowed=permissions(role);
 const statuses=new Map(),history=[];
 const base=buildSyntheticTemplateCatalog("en");
 const allIds=new Set(base.map(t=>t.id));
 const scopeAllows=(t)=>role!=="operator"||t.assigned_scope==="operations";
 function snapshot(locale="en",category="all",milestone="all"){
  if(!recognized(LOCALES,locale)||!(category==="all"||recognized(CATEGORIES,category))||
   !(milestone==="all"||recognized(MILESTONE_IDS,milestone)))return deny("invalid_filter");
  const templates=buildSyntheticTemplateCatalog(locale);
  const visible=templates.filter(t=>scopeAllows(t)&&
   (category==="all"||t.category===category)&&
   (milestone==="all"||t.milestone_id===milestone));
  const queue=visible.map(t=>Object.freeze({...t,status:statuses.get(t.id)||"todo"}));
  const milestones=MILESTONE_IDS.map(id=>{
   const subset=queue.filter(t=>t.milestone_id===id);
   return Object.freeze({id,day:id==="d30"?30:id==="d60"?60:90,
    visible:subset.length,reviewed:subset.filter(t=>t.status==="reviewed").length,
    in_progress:subset.filter(t=>t.status==="in_progress").length});
  });
  return Object.freeze({
   ok:true,role,version:ADMIN_SANDBOX_VERSION,template_version:PLAN_VERSION,
   synthetic_only:true,production_access_enabled:false,
   real_customer_records:0,customer_data_collected:false,
   allowed,locale,category,milestone,
   available_to_role:templates.filter(scopeAllows).length,
   visible_count:queue.length,queue, milestones,
   release_gates:releaseGates,release_ready:false,
   change_history:history.filter(h=>role!=="operator"||h.role==="operator")
    .map(h=>Object.freeze({...h})),
   no_backend_storage:true,real_audit_created:false,notifications_sent:false
  });
 }
 function transition(id,next){
  if(!allowed.change)return deny("read_only_role");
  if(typeof id!=="string"||!allIds.has(id))return deny("unknown_template");
  if(!recognized(TASK_STATES,next))return deny("invalid_state");
  const template=base.find(t=>t.id===id);
  if(!scopeAllows(template))return deny("out_of_scope");
  const previous=statuses.get(id)||"todo";
  if(previous===next)return Object.freeze({ok:true,changed:false});
  statuses.set(id,next);
  history.unshift(Object.freeze({task_id:id,from:previous,to:next,role,synthetic_only:true}));
  if(history.length>30)history.length=30;
  return Object.freeze({ok:true,changed:true});
 }
 function reset(){
  if(!allowed.reset)return deny("owner_only");
  statuses.clear();history.length=0;
  return Object.freeze({ok:true,reset:true});
 }
 return Object.freeze({ok:true,role,permissions:allowed,snapshot,transition,reset});
}
function node(tag,css,text){
 const n=document.createElement(tag);
 if(css)n.className=css;
 if(text!==undefined)n.textContent=String(text);
 return n;
}
function append(parent,...children){parent.append(...children);return parent}
/**
 * Render only inside the already authorised dashboard mount.
 * The caller in admin.js must have a successfully verified /overview role+MFA.
 * No client-side security decision can grant access to real backend APIs.
 */
export function mountAdminReadinessSandbox(container,session){
 if(!container||!session?.ok||!recognized(ROLES,session.role))return deny("unavailable");
 const root=node("section","vor010-sandbox");
 container.append(root);
 let locale="en",category="all",milestone="all";
 function paint(){
  const data=session.snapshot(locale,category,milestone);
  if(!data.ok)return deny("invalid_view");
  const c=copy[locale];
  root.replaceChildren();
  const header=node("div","vor010-head");
  const text=node("div","");
  append(text,node("span","section-overline",c.eyebrow),node("h2","",c.title),
    node("p","",c.subtitle));
  const meta=node("p","vor010-meta",c.role+": "+data.role.toUpperCase()+" · "+c.version+": "+data.template_version);
  append(header,text,meta);root.append(header);
  const controls=node("div","vor010-filters");
  for(const [label,value,allVals,onChange] of [
   [c.categories,category,[["all",c.all],...CATEGORIES.map(id=>[id,id.toUpperCase()])],v=>{category=v;}],
   [c.milestone,milestone,[["all",c.all],["d30","Day 30"],["d60","Day 60"],["d90","Day 90"]],v=>{milestone=v;}],
   ["Language",locale,[["en","English"],["bn","বাংলা"],["hi","हिंदी"]],v=>{locale=v;}]
  ]){
    const wrap=node("label","vor010-filter",label);
    const select=node("select");
    select.setAttribute("aria-label",label);
    for(const [v,labelText] of allVals){const opt=node("option","",labelText);opt.value=v;opt.selected=v===value;select.append(opt);}
    select.addEventListener("change",()=>{onChange(select.value);paint();});
    wrap.append(select);controls.append(wrap);
  }
  root.append(controls);
  const cards=node("div","vor010-milestones");
  for(const stage of data.milestones){
   const card=node("div","vor010-stage");
   const heading=node("strong","", "Day "+stage.day);
   append(card,heading,node("span","",stage.reviewed+" / "+stage.visible+" "+c.progress));
   // Progress is a count of synthetic templates, NOT a credit/readiness score.
   const track=node("div","vor010-track");track.setAttribute("role","progressbar");
   track.setAttribute("aria-label","Day "+stage.day+" synthetic templates reviewed");
   track.setAttribute("aria-valuenow",String(stage.reviewed));
   track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(stage.visible));
   const fill=node("span","");fill.style.width=(stage.visible?Math.round(stage.reviewed/stage.visible*100):0)+"%";
   track.append(fill);card.append(track);cards.append(card);
  }
  root.append(cards);
  const info=node("div","vor010-permissions");
  append(info,node("strong","",c.permissions+": "),
    node("span","",c.read+" · "+c.write+": "+(data.allowed.change?"YES (DEMO ONLY)":"NO")+" · Production release: NEVER"));
  root.append(info);
  const queueHeader=node("div","vor010-queue-head");
  append(queueHeader,node("h3","",c.queue),node("span","",c.counts(data.visible_count,data.available_to_role)));
  root.append(queueHeader);
  const list=node("div","vor010-queue");
  if(!data.queue.length)list.append(node("p","",c.none));
  for(const task of data.queue){
   const card=node("article","vor010-task");
   const intro=node("div","vor010-task-description");
   append(intro,node("strong","",task.title),
     node("p","",task.action),
     node("small","",task.category.toUpperCase()+" · Day "+task.due_day+" · "+task.assigned_scope+" · "+task.template_version));
   const label=node("label","",c.state);
   const select=node("select");select.setAttribute("aria-label",c.state+": "+task.title);
   for(const status of TASK_STATES){
    const opt=node("option","",status.replaceAll("_"," "));
    opt.value=status;opt.selected=status===task.status;select.append(opt);
   }
   select.disabled=!data.allowed.change||task.assigned_scope==="compliance"&&session.role==="operator";
   select.addEventListener("change",()=>{
    const ret=session.transition(task.id,select.value);
    if(!ret.ok){
      select.value=task.status;
      feedback.textContent=c.denied;
      return;
    }
    paint();
   });
   label.append(select);card.append(intro,label);list.append(card);
  }
  root.append(list);
  const gateHeading=node("h3","vor010-gate-title",c.gates);
  root.append(gateHeading,node("p","vor010-note",c.gateNote));
  const gateList=node("ul","vor010-gates");
  for(const gate of data.release_gates){
   const li=node("li","");
   append(li,node("strong","",gate.title),
     node("span","vor010-locked","BLOCKED — "+gate.note));
   gateList.append(li);
  }
  root.append(gateList);
  const bottom=node("div","vor010-bottom");
  const reset=node("button","small-button",c.reset);reset.type="button";
  reset.disabled=!data.allowed.reset;
  reset.addEventListener("click",()=>{const result=session.reset();if(result.ok)paint();else feedback.textContent=c.denied;});
  const feedback=node("span","vor010-feedback","");
  append(bottom,reset,feedback);root.append(bottom);
  const audit=node("div","vor010-audit");audit.append(node("h3","",c.audit));
  if(!data.change_history.length)audit.append(node("p","",c.auditNone));
  for(const entry of data.change_history.slice(0,12))
   audit.append(node("p","",entry.task_id.split(":").slice(-1)[0]+" · "+entry.from+" → "+entry.to+" · "+entry.role+" (synthetic)"));
  root.append(audit,node("p","vor010-alert",c.notice));
  return Object.freeze({ok:true,view:data});
 }
 return paint();
}
