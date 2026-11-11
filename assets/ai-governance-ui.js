/** VOR-014 first-party, fixed-choice, in-memory Admin governance panel.
 * AAL2 and role verification are enforced by the parent Admin /overview session.
 */
import {GOVERNANCE_VERSION,DECISIONS} from "./ai-governance-sandbox.js";
export {createAiGovernanceSandbox} from "./ai-governance-sandbox.js";
const make=(tag,label="",className="")=>{
 const x=document.createElement(tag);x.textContent=label;if(className)x.className=className;return x;
};
const add=(root,...nodes)=>{root.append(...nodes);return root;};
export function mountAiGovernanceSandbox(root,desk){
 if(!root||typeof root.replaceChildren!=="function"||!desk||typeof desk.snapshot!=="function")return {ok:false};
 const initial=desk.snapshot();
 if(!initial.ok||initial.mode!=="synthetic_only"||!["owner","operator","auditor"].includes(initial.role))return {ok:false};
 const panel=make("section","","vor014-panel");
 const heading=make("h2","AI Governance & Reporting — Fictional Sandbox");
 const note=make("p","Only prewritten synthetic fixtures. No real AI inference, stored prompts, customers, model approvals, production permissions or financial decisions.");
 const meta=make("p","Verified Admin role: "+initial.role+" · Model registry "+GOVERNANCE_VERSION+" · Demo-only aggregate metrics.");
 const actions=make("div","","vor014-actions");
 const execute=make("button","Run fictional policy evaluation");execute.type="button";execute.disabled=initial.role==="auditor";
 const reset=make("button","Erase synthetic review session");reset.type="button";reset.disabled=initial.role!=="owner";
 add(actions,execute,reset);
 const feedback=make("p","Synthetic release gates remain blocked.","vor014-feedback");
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const registry=make("div","","vor014-registry");
 const metrics=make("div","","vor014-metrics");
 const queue=make("div","","vor014-flags");
 const gates=make("div","","vor014-gates");
 const audit=make("div","","vor014-audit");
 const headingFor=(label)=>make("h3",label);
 function paint(){
  const s=desk.snapshot();
  registry.replaceChildren(headingFor("Fictional model/version registry"));
  const modelList=make("ul");
  for(const m of s.registry)modelList.append(make("li",m.model_id+" · "+m.version+" · "+m.purpose+" · "+m.deployment));
  registry.append(modelList);
  metrics.replaceChildren(headingFor("Aggregate synthetic safety metrics (minimum cohort "+s.min_report_cohort+")"));
  const summary=make("p",s.aggregate_totals.fictional_samples+" fixed test fixtures · "+
   s.aggregate_totals.blocked+" blocked · "+s.aggregate_totals.human_review+" human-review flags · "+
   s.simulated_runs+" local evaluation runs");
  const report=make("ul");
  for(const m of s.metrics)report.append(make("li",m.policy_id.replaceAll("_"," ")+": "+
   m.fictional_samples+" fixtures; pass "+m.passed+", blocked "+m.blocked+", review "+m.human_review));
  add(metrics,summary,report);
  queue.replaceChildren(headingFor("Role-scoped fictional review flags"));
  for(const flag of s.flags){
   const item=make("article","","vor014-flag");
   add(item,make("h4",flag.flag_id+" · "+flag.policy_id.replaceAll("_"," ")),
    make("p",flag.summary+" · "+flag.severity+" · "+flag.team+" · "+flag.status+" · revision "+flag.revision));
   const choose=make("select");choose.setAttribute("aria-label","Review decision for "+flag.flag_id);
   for(const value of DECISIONS){
    const option=make("option",value.replaceAll("_"," "));option.value=value;choose.append(option);
   }
   const review=make("button","Record synthetic review");review.type="button";
   review.disabled=s.role==="auditor";
   review.addEventListener("click",()=>{
    const result=desk.reviewFlag({flag_id:flag.flag_id,decision:choose.value,expected_revision:flag.revision});
    feedback.textContent=result.ok?"Fictional flag change recorded in page memory.":"Not permitted: "+result.code;
    paint();
   });
   add(item,choose,review);queue.append(item);
  }
  if(!s.flags.length)queue.append(make("p","No assigned fictional flags."));
  gates.replaceChildren(headingFor("Production release gates — permanently blocked in this sandbox"));
  const gateList=make("ul");
  for(const gate of s.release_gates)gateList.append(make("li",gate.id.replaceAll("_"," ")+": BLOCKED · "+gate.reason));
  gates.append(gateList);
  audit.replaceChildren(headingFor("Temporary review event history"));
  const events=make("ol");
  for(const event of s.history)events.append(make("li","#"+event.event_no+" · "+event.action+" · "+
   event.actor_role+" · "+(event.flag_id||"fixed fixture suite")));
  audit.append(events);
  if(!s.history.length)audit.append(make("p","No in-memory events. This is not a compliance audit log."));
 }
 execute.addEventListener("click",()=>{
  const result=desk.runEvaluation({mode:"synthetic_only"});
  feedback.textContent=result.ok?"Fictional evaluation finished locally. No AI was called.":"Not permitted: "+result.code;
  paint();
 });
 reset.addEventListener("click",()=>{
  const result=desk.reset();
  feedback.textContent=result.ok?"Temporary fictional session erased.":"Not permitted: "+result.code;
  paint();
 });
 add(panel,heading,note,meta,actions,feedback,registry,metrics,queue,gates,audit,
  make("p","No customer analytics or raw prompt traces. Role scopes here are demonstrative; real data requires separate server-side RLS and audit."));
 root.replaceChildren(panel);paint();
 return {ok:true,mode:"synthetic_only"};
}
