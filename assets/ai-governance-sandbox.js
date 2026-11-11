/** VORVAN M2 / VOR-014: fictional Admin AI governance / reporting laboratory.
 * No LLM calls, prompts, customer data, telemetry, storage, database, or release actions.
 * The role MUST come from existing verified AAL2 Admin /overview, never user input.
 */
export const GOVERNANCE_VERSION="m2-vor014-synthetic-20261111-v1";
export const ROLES=Object.freeze(["owner","operator","auditor"]);
export const DECISIONS=Object.freeze(["needs_human_review","acknowledged"]);
export const MIN_REPORT_COHORT=3;
const frozenList=(items)=>Object.freeze(items.map(x=>Object.freeze({...x})));
export const MODEL_REGISTRY=frozenList([
 {model_id:"DEMO-VYN",version:"fixture-v1.2",team:"safety",purpose:"Fictional educational assistant",deployment:"not_deployed",contains_real_prompts:false},
 {model_id:"DEMO-RULES",version:"fixture-v1.0",team:"operations",purpose:"Fictional readiness rules",deployment:"not_deployed",contains_real_prompts:false},
 {model_id:"DEMO-ROUTER",version:"fixture-v0.3",team:"operations",purpose:"Fictional human-support routing",deployment:"not_deployed",contains_real_prompts:false}
]);
export const POLICY_REGISTRY=frozenList([
 {id:"consent",team:"safety",severity:"critical",title:"Consent must precede simulated guidance"},
 {id:"privacy",team:"safety",severity:"critical",title:"Reject personal data and account identifiers"},
 {id:"regulated_claims",team:"safety",severity:"critical",title:"Reject lending, bureau and approval claims"},
 {id:"human_handoff",team:"operations",severity:"medium",title:"Provide fictional human fallback"},
 {id:"language_safety",team:"operations",severity:"medium",title:"Keep trilingual safety meaning"},
 {id:"prompt_injection",team:"operations",severity:"high",title:"Reject instruction override attempts"}
]);
export const RELEASE_GATES=frozenList([
 {id:"legal_consent",status:"blocked",reason:"Legal-approved customer consent and DPDP review absent"},
 {id:"auth_scope",status:"blocked",reason:"Actual customer Auth and server-enforced role E2E not approved"},
 {id:"independent_vapt",status:"blocked",reason:"Independent penetration testing and threat acceptance absent"},
 {id:"model_review",status:"blocked",reason:"Model risk, fairness, safety, human oversight approvals absent"},
 {id:"data_governance",status:"blocked",reason:"Retention, deletion, DPIA and incident response approval absent"},
 {id:"lender_bureau",status:"blocked",reason:"Verified lender/bureau/API contractual permission absent"},
 {id:"human_escalation",status:"blocked",reason:"Real complaint SLA and human escalation not approved"}
]);
const FLAG_SEEDS=frozenList(POLICY_REGISTRY.map((p,i)=>({
 flag_id:"SYN-FLAG-"+String(i+1).padStart(3,"0"),policy_id:p.id,
 team:p.team,severity:p.severity,model_id:i<3?"DEMO-VYN":i===3?"DEMO-ROUTER":"DEMO-RULES",
 summary:"Fixed fictional policy review example "+String(i+1)
})));
/* Exactly three static outcomes per policy. Never collect inputs, raw prompts or user traces. */
const POLICY_FIXTURES=frozenList(POLICY_REGISTRY.flatMap((p,i)=>[
 {fixture_id:"SYN-EVAL-"+String(i*3+1).padStart(3,"0"),policy_id:p.id,team:p.team,outcome:"pass"},
 {fixture_id:"SYN-EVAL-"+String(i*3+2).padStart(3,"0"),policy_id:p.id,team:p.team,outcome:"blocked"},
 {fixture_id:"SYN-EVAL-"+String(i*3+3).padStart(3,"0"),policy_id:p.id,team:p.team,outcome:"human_review"}
]));
const denied=(code)=>Object.freeze({ok:false,code});
const plain=(x)=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const has=(arr,x)=>typeof x==="string"&&arr.includes(x);
function aggregated(team){
 const rows=[];
 for(const policy of POLICY_REGISTRY){
  if(team==="operations"&&policy.team!=="operations")continue;
  const events=POLICY_FIXTURES.filter(x=>x.policy_id===policy.id);
  if(events.length<MIN_REPORT_COHORT)continue;
  rows.push(Object.freeze({
   policy_id:policy.id,team:policy.team,fictional_samples:events.length,
   passed:events.filter(x=>x.outcome==="pass").length,
   blocked:events.filter(x=>x.outcome==="blocked").length,
   human_review:events.filter(x=>x.outcome==="human_review").length
  }));
 }
 return Object.freeze(rows);
}
export function createAiGovernanceSandbox(role){
 if(!has(ROLES,role))throw Error("verified_admin_role_required");
 let revision=0,eventSeq=0,runCount=0;
 const seedFlags=()=>FLAG_SEEDS.map(x=>Object.freeze({...x,status:"unreviewed",revision:++revision}));
 let flags=seedFlags(),audit=[];
 const inScope=(team)=>role!=="operator"||team==="operations";
 const canReview=(flag)=>role!=="auditor"&&inScope(flag.team);
 const scope=role==="operator"?"operations":"all";
 function record(action,flag){
  audit.push(Object.freeze({event_no:++eventSeq,action,actor_role:role,
   flag_id:flag?.flag_id??null,team:flag?.team??"safety",synthetic_only:true}));
 }
 function snapshot(){
  const visible=flags.filter(x=>inScope(x.team));
  const metrics=aggregated(scope);
  return Object.freeze({
   ok:true,mode:"synthetic_only",version:GOVERNANCE_VERSION,role,scope,
   registry:Object.freeze(MODEL_REGISTRY.filter(x=>inScope(x.team))),
   policies:Object.freeze(POLICY_REGISTRY.filter(x=>inScope(x.team))),
   flags:Object.freeze(visible.slice()),
   metrics,aggregate_only:true,min_report_cohort:MIN_REPORT_COHORT,
   aggregate_totals:Object.freeze({
    fictional_samples:metrics.reduce((n,x)=>n+x.fictional_samples,0),
    blocked:metrics.reduce((n,x)=>n+x.blocked,0),
    human_review:metrics.reduce((n,x)=>n+x.human_review,0)
   }),
   simulated_runs:runCount,
   history:Object.freeze(audit.filter(x=>inScope(x.team)).slice()),
   release_gates:RELEASE_GATES,release_ready:false,production_enabled:false,
   real_customer_count:0,prompt_text_stored:false,real_ai_calls:0,
   external_notifications:0,backend_writes:0,storage:"memory_only",
   permissions:Object.freeze({review:role!=="auditor",run:role!=="auditor",reset:role==="owner",release:false})
  });
 }
 function reviewFlag(input){
  if(role==="auditor")return denied("read_only_role");
  if(!exact(input,["flag_id","decision","expected_revision"]))return denied("invalid_fixed_choice_input");
  if(!has(DECISIONS,input.decision)||!has(FLAG_SEEDS.map(x=>x.flag_id),input.flag_id)||
   !Number.isSafeInteger(input.expected_revision))return denied("invalid_fixed_choice_input");
  const flag=flags.find(x=>x.flag_id===input.flag_id);
  if(!flag||!canReview(flag))return denied("out_of_scope");
  if(flag.revision!==input.expected_revision)return denied("stale_review_revision");
  if(flag.status===input.decision)return denied("no_state_change");
  if(flag.status==="acknowledged")return denied("terminal_review_state");
  if(flag.status==="needs_human_review"&&input.decision!=="acknowledged")return denied("invalid_transition");
  if(flag.severity==="critical"&&flag.status==="unreviewed"&&input.decision==="acknowledged")
   return denied("critical_requires_human_review");
  if(flag.status==="needs_human_review"&&role!=="owner")return denied("owner_required_for_acknowledgement");
  const next=Object.freeze({...flag,status:input.decision,revision:++revision});
  flags=flags.map(x=>x.flag_id===next.flag_id?next:x);
  record("fictional_flag_"+input.decision,next);
  return Object.freeze({ok:true,flag:next});
 }
 function runEvaluation(input){
  if(role==="auditor")return denied("read_only_role");
  if(!exact(input,["mode"])||input.mode!=="synthetic_only")return denied("synthetic_mode_required");
  runCount+=1;record("fictional_fixture_suite_run",{team:role==="operator"?"operations":"safety"});
  return Object.freeze({ok:true,synthetic_only:true,aggregate_totals:snapshot().aggregate_totals,run_number:runCount});
 }
 function reset(){
  if(role!=="owner")return denied("owner_only_reset");
  flags=seedFlags();audit=[];runCount=0;
  return Object.freeze({ok:true,erased_in_memory:true});
 }
 function requestProductionRelease(){
  return denied("immutable_production_release_gates");
 }
 return Object.freeze({snapshot,reviewFlag,runEvaluation,reset,requestProductionRelease});
}
