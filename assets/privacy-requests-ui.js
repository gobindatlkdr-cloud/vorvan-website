/** VOR-016 accessible fixed-choice Admin demonstration. Not a customer rights portal. */
import {FIXTURE_SUBJECTS,REQUEST_TYPES,PRIVACY_NOTICES,PRIVACY_NOTICE_VERSION} from "./privacy-requests-sandbox.js";
export {createPrivacyRequestsSandbox} from "./privacy-requests-sandbox.js";
const make=(tag,label="",klass="")=>{
 const x=document.createElement(tag);x.textContent=label;if(klass)x.className=klass;return x;
};
const add=(root,...children)=>{root.append(...children);return root;};
const selector=(label,options)=>{
 const el=make("select");el.setAttribute("aria-label",label);
 for(const [value,title] of options){const opt=make("option",title);opt.value=value;el.append(opt);}
 return el;
};
const prettify=x=>x.replaceAll("_"," ");
export function mountPrivacyRequestsSandbox(root,model){
 if(!root||typeof root.replaceChildren!=="function"||!model||typeof model.snapshot!=="function")return {ok:false};
 const initial=model.snapshot();
 if(!initial.ok||initial.mode!=="synthetic_only"||!["owner","operator","auditor"].includes(initial.role))return {ok:false};
 const outer=make("section","","vor016-panel");
 const title=make("h2","Privacy Requests & Export — Synthetic Sandbox");
 const warning=make("p","NO REAL PRIVACY REQUESTS. Fictional identities and records only. This page cannot verify identity, accept legal consent, delete data, change permissions or export real information.");
 const role=make("p","Existing AAL2/ACL-verified Admin role: "+initial.role+". Demo role controls do not replace a future secure customer portal.");
 const locale=selector("Demo privacy notice language",[["en","English"],["bn","বাংলা"],["hi","हिन्दी"]]);
 const notice=make("p",PRIVACY_NOTICES.en,"vor016-notice");
 const acknowledgement=make("button","Acknowledge fictional privacy notice");acknowledgement.type="button";
 const category=selector("Fictional privacy request type",REQUEST_TYPES.map(x=>[x,prettify(x)]));
 const subject=selector("Fictional identity fixture",FIXTURE_SUBJECTS.map(x=>[x,prettify(x)]));
 const create=make("button","Create fictional privacy request");create.type="button";create.disabled=true;
 const reset=make("button","Erase all fictional privacy work");reset.type="button";reset.disabled=initial.role!=="owner";
 const feedback=make("p","Acknowledge the sample notice before creating fictional requests.","vor016-feedback");
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const form=add(make("div","","vor016-controls"),locale,notice,acknowledgement,category,subject,create,reset);
 const queue=make("div","","vor016-queue"),history=make("div","","vor016-history");
 const preview=make("pre","No fictional export preview requested.","vor016-preview");
 preview.setAttribute("aria-label","Fictional export preview");
 const blockers=make("div","","vor016-blockers");
 let noticeAcknowledged=false;
 const communicate=(message)=>{feedback.textContent=message;};
 function draw(){
  const s=model.snapshot();
  queue.replaceChildren(make("h3","Role-scoped fictional rights request queue"),
   make("p",s.requests.length+" visible fictional requests. Real requests, records, deletion and exports = 0."));
  for(const item of s.requests){
   const card=make("article","","vor016-item");
   add(card,make("h4",item.id+" · "+prettify(item.request_type)),
    make("p",prettify(item.subject_fixture)+" · "+item.status.replaceAll("_"," ")+" · revision "+item.revision+
     " · "+item.team+" · identity check SIMULATED: "+item.identity_simulation_passed));
   const controls=make("div","","vor016-item-actions");
   if(item.status==="submitted"){
    const pick=selector("Match fictional fixture for "+item.id,FIXTURE_SUBJECTS.map(x=>[x,prettify(x)]));
    pick.value=item.subject_fixture;
    const check=make("button","Simulate identity fixture match");check.type="button";check.disabled=s.role==="auditor";
    check.addEventListener("click",()=>{
     const r=model.verifyFixture({request_id:item.id,fixture_subject:pick.value,simulation_marker:"fictional_match_only",expected_revision:item.revision});
     communicate(r.ok?"Fictional fixture matched locally; this is NOT real identity proof.":"Denied: "+r.code);draw();
    });
    add(controls,pick,check);
   }
   const actions=[
    ["fixture_verified","start_review","Start synthetic review"],
    ["under_review","request_human_review","Require human privacy review"],
    ["under_review","owner_approve","Owner approves simulated handling"],
    ["human_review","owner_approve","Owner approves after review"],
    ["approved","simulate_complete","Mark fictional processing complete"]
   ];
   for(const [from,action,label] of actions){
    if(item.status!==from)continue;
    if(action==="owner_approve"&&["deletion","withdraw_consent"].includes(item.request_type)&&item.status==="under_review")continue;
    const button=make("button",label);button.type="button";
    button.disabled=s.role==="auditor"||(action.startsWith("owner_")||action==="simulate_complete"?s.role!=="owner":false);
    button.addEventListener("click",()=>{
     const r=model.transition({request_id:item.id,action,expected_revision:item.revision});
     communicate(r.ok?"Fictional status recorded in page memory.":"Denied: "+r.code);draw();
    });
    controls.append(button);
   }
   if(["access","export"].includes(item.request_type)&&item.status==="approved"){
    const output=make("button","Preview synthetic JSON only");output.type="button";output.disabled=s.role!=="owner";
    output.addEventListener("click",()=>{
     const r=model.preview({request_id:item.id,fixture_subject:item.subject_fixture,expected_revision:item.revision});
     if(r.ok){preview.textContent=JSON.stringify(r.preview,null,2);communicate("Fixed invented JSON shown locally. Nothing downloaded or sent.");}
     else communicate("Denied: "+r.code);
     draw();
    });
    controls.append(output);
   }
   card.append(controls);queue.append(card);
  }
  if(!s.requests.length)queue.append(make("p","No fictional requests. Real data rights processing remains disabled."));
  history.replaceChildren(make("h3","Temporary role-scoped audit events"));
  const records=make("ol");
  for(const e of s.audit)records.append(make("li","#"+e.event_no+" "+e.request_id+" · "+e.action+" · "+e.actor_role));
  history.append(records);
  if(!s.audit.length)history.append(make("p","No events recorded. Audit is page-memory only, NOT compliance evidence."));
  blockers.replaceChildren(make("h3","Production privacy service — locked release requirements"));
  const list=make("ul");
  for(const gate of s.release_blockers)list.append(make("li","BLOCKED: "+prettify(gate)));
  blockers.append(list);
 }
 locale.addEventListener("change",()=>{notice.textContent=PRIVACY_NOTICES[locale.value]||PRIVACY_NOTICES.en;});
 acknowledgement.addEventListener("click",()=>{
  noticeAcknowledged=true;create.disabled=initial.role==="auditor";
  communicate("Demo notice acknowledged. This is NOT legally verified consent.");
 });
 create.addEventListener("click",()=>{
  const r=model.create({mode:"synthetic_only",subject_fixture:subject.value,request_type:category.value,
   notice_version:PRIVACY_NOTICE_VERSION,privacy_acknowledged:noticeAcknowledged});
  communicate(r.ok?"Fictional request created; no personal data was collected.":"Denied: "+r.code);
  preview.textContent="No fictional export preview requested.";draw();
 });
 reset.addEventListener("click",()=>{
  const r=model.reset();communicate(r.ok?"Fictional in-memory requests and events erased.":"Denied: "+r.code);
  if(r.ok){preview.textContent="No fictional export preview requested.";noticeAcknowledged=false;create.disabled=true;}
  draw();
 });
 add(outer,title,warning,role,form,feedback,queue,
  make("h3","Illustrative synthetic JSON (never a customer data download)"),preview,history,blockers,
  make("p","This training UI does not initiate an actual access, correction, deletion, consent withdrawal or export request. For real privacy concerns, use the officially published legal contact channel, without sharing OTPs or sensitive files."));
 root.replaceChildren(outer);draw();return {ok:true,mode:"synthetic_only"};
}
