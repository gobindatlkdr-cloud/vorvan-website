/** VOR-014: actual model tests. Zero credentials, customers or external AI. */
import {createAiGovernanceSandbox,MODEL_REGISTRY,POLICY_REGISTRY,RELEASE_GATES,MIN_REPORT_COHORT,GOVERNANCE_VERSION} from "../../assets/ai-governance-sandbox.js";
function eq(a:unknown,b:unknown,n="assert"){if(a!==b)throw Error(n+" expected "+String(b)+" got "+String(a));}
function yes(x:unknown,n="assert"){if(!x)throw Error(n);}
const owner=()=>createAiGovernanceSandbox("owner");
const change=(d:ReturnType<typeof createAiGovernanceSandbox>,i=0,decision="needs_human_review")=>{
 const f=d.snapshot().flags[i];
 return d.reviewFlag({flag_id:f.flag_id,decision,expected_revision:f.revision});
};
Deno.test("Owner reads fixed version registry, policies and safety gates",()=>{
 const s=owner().snapshot();
 eq(s.version,GOVERNANCE_VERSION);eq(s.mode,"synthetic_only");eq(s.role,"owner");
 eq(s.registry.length,3);eq(s.policies.length,6);eq(s.flags.length,6);
 eq(MODEL_REGISTRY.length,3);eq(POLICY_REGISTRY.length,6);
 for(const m of s.registry){eq(m.deployment,"not_deployed");eq(m.contains_real_prompts,false);}
 yes(s.registry.every((x:unknown)=>Object.isFrozen(x)),"frozen models");
 yes(s.release_gates.every((x:unknown)=>Object.isFrozen(x)),"frozen gates");
});
Deno.test("No unverified or customer role can create synthetic admin governance",()=>{
 for(const role of ["customer","viewer","anonymous","",null,undefined,{}]){
  let rejected=false;try{createAiGovernanceSandbox(role as string);}catch{rejected=true;}
  yes(rejected,"bad role denied");
 }
});
Deno.test("Operator is operations-scoped, Auditor can view but is read-only",()=>{
 const o=createAiGovernanceSandbox("operator").snapshot();
 const a=createAiGovernanceSandbox("auditor").snapshot();
 eq(o.flags.length,3);eq(o.policies.length,3);eq(o.registry.length,2);
 eq(a.flags.length,6);eq(a.registry.length,3);eq(a.permissions.review,false);
 eq(o.permissions.release,false);eq(a.permissions.release,false);
 eq(a.release_ready,false);eq(o.production_enabled,false);
});
Deno.test("Owner can mark a critical synthetic flag for human review",()=>{
 const d=owner();const first=d.snapshot().flags[0];
 eq(change(d,0,"needs_human_review").ok,true);
 const current=d.snapshot().flags[0];eq(current.status,"needs_human_review");
 yes(current.revision>first.revision,"revision advances");
 eq(d.snapshot().history.length,1);
 eq(d.snapshot().history[0].actor_role,"owner");
});
Deno.test("Critical flag cannot be acknowledged without first going through human review",()=>{
 const d=owner();
 const direct=change(d,0,"acknowledged");
 eq(direct.ok,false);eq("code" in direct?direct.code:null,"critical_requires_human_review");
 eq(d.snapshot().history.length,0);
 yes(change(d,0,"needs_human_review").ok,"review flag");
 yes(change(d,0,"acknowledged").ok,"owner acknowledgement after human review");
 eq(d.snapshot().flags[0].status,"acknowledged");
});
Deno.test("Final flag state blocks replay, no-op and backward transitions",()=>{
 const d=owner();const f=d.snapshot().flags[3];
 const payload={flag_id:f.flag_id,decision:"acknowledged",expected_revision:f.revision};
 eq(d.reviewFlag(payload).ok,true);
 eq(d.reviewFlag(payload).ok,false);
 const now=d.snapshot().flags[3];
 eq(d.reviewFlag({...payload,expected_revision:now.revision}).ok,false);
 eq(d.reviewFlag({...payload,decision:"needs_human_review",expected_revision:now.revision}).ok,false);
});
Deno.test("Optimistic revision rejects stale concurrent review of same flag",()=>{
 const d=owner(),f=d.snapshot().flags[4];
 yes(d.reviewFlag({flag_id:f.flag_id,decision:"needs_human_review",expected_revision:f.revision}).ok,"first");
 const replay=d.reviewFlag({flag_id:f.flag_id,decision:"acknowledged",expected_revision:f.revision});
 eq(replay.ok,false);eq("code" in replay?replay.code:"","stale_review_revision");
 eq(d.snapshot().history.length,1);
});
Deno.test("Operator can review assigned flag but cannot finalize human review",()=>{
 const d=createAiGovernanceSandbox("operator");
 const f=d.snapshot().flags[0];
 eq(d.reviewFlag({flag_id:f.flag_id,decision:"needs_human_review",expected_revision:f.revision}).ok,true);
 const current=d.snapshot().flags[0];
 const fin=d.reviewFlag({flag_id:current.flag_id,decision:"acknowledged",expected_revision:current.revision});
 eq(fin.ok,false);
});
Deno.test("Operator cannot review owner/safety-scoped critical flag even knowing ID",()=>{
 const d=createAiGovernanceSandbox("operator");
 const foreign=owner().snapshot().flags[0];
 eq(d.reviewFlag({flag_id:foreign.flag_id,decision:"needs_human_review",expected_revision:foreign.revision}).ok,false);
 eq(d.snapshot().flags.length,3);
});
Deno.test("Auditor cannot write, evaluate or reset fictional models",()=>{
 const d=createAiGovernanceSandbox("auditor"),f=d.snapshot().flags[0];
 eq(d.reviewFlag({flag_id:f.flag_id,decision:"needs_human_review",expected_revision:f.revision}).ok,false);
 eq(d.runEvaluation({mode:"synthetic_only"}).ok,false);
 eq(d.reset().ok,false);eq(d.snapshot().history.length,0);
});
Deno.test("Strict fields deny PII, free text, unknown flags and arbitrary decisions",()=>{
 const d=owner(),f=d.snapshot().flags[3],valid={flag_id:f.flag_id,decision:"needs_human_review",expected_revision:f.revision};
 for(const bad of [
  {...valid,notes:"An actual borrower name"}, {...valid,email:"person@example.invalid"},
  {...valid,customer_id:"abc"}, {...valid,model_prompt:"some text"},
  {...valid,expected_revision:"1"}, {...valid,flag_id:"not-in-registry"},
  {...valid,decision:"approved"},null,{},[], "free text"
 ])eq(d.reviewFlag(bad as never).ok,false,"rejected unstructured input");
 eq(d.snapshot().history.length,0);
});
Deno.test("Aggregate synthetic reporting uses only >= 3 fixed fixtures per policy",()=>{
 const s=owner().snapshot();
 eq(s.min_report_cohort,MIN_REPORT_COHORT);eq(s.metrics.length,6);
 eq(s.aggregate_totals.fictional_samples,18);
 eq(s.aggregate_totals.blocked,6);eq(s.aggregate_totals.human_review,6);
 for(const row of s.metrics){yes(row.fictional_samples>=3,"cohort threshold");eq(row.passed+row.blocked+row.human_review,row.fictional_samples);}
 eq(s.aggregate_only,true);
});
Deno.test("Operator reporting remains team scoped and has no per-customer analytics",()=>{
 const s=createAiGovernanceSandbox("operator").snapshot();
 eq(s.metrics.length,3);eq(s.aggregate_totals.fictional_samples,9);
 yes(s.metrics.every(x=>x.team==="operations"),"no safety team's metrics");
 eq(s.real_customer_count,0);eq(s.prompt_text_stored,false);eq(s.real_ai_calls,0);
});
Deno.test("Run simulation returns fixed aggregate results without any model request",()=>{
 const d=owner();
 const r=d.runEvaluation({mode:"synthetic_only"});
 eq(r.ok,true);eq(d.snapshot().simulated_runs,1);eq(d.snapshot().history.length,1);
 eq(d.snapshot().history[0].action,"fictional_fixture_suite_run");
 eq(d.runEvaluation({mode:"production"}).ok,false);
 eq(d.runEvaluation({mode:"synthetic_only",notes:"PAN"} as never).ok,false);
 eq(d.snapshot().simulated_runs,1);
});
Deno.test("Release gates immutable and no role can enable actual model production",()=>{
 eq(RELEASE_GATES.length,7);
 for(const gate of RELEASE_GATES){eq(gate.status,"blocked");yes(Object.isFrozen(gate),"frozen gate");}
 for(const role of ["owner","operator","auditor"]){
  const d=createAiGovernanceSandbox(role);
  eq(d.requestProductionRelease().ok,false);
  eq(d.snapshot().release_ready,false);eq(d.snapshot().production_enabled,false);
 }
});
Deno.test("Audit sequence is monotonic and immutable within the page session",()=>{
 const d=owner();const f=d.snapshot().flags[3];
 d.runEvaluation({mode:"synthetic_only"});
 d.reviewFlag({flag_id:f.flag_id,decision:"needs_human_review",expected_revision:f.revision});
 const s=d.snapshot();eq(s.history.length,2);
 eq(s.history[0].event_no,1);eq(s.history[1].event_no,2);
 yes(Object.isFrozen(s.history[0]),"immutable event");
 yes(Object.isFrozen(s.flags[0]),"immutable flag");
});
Deno.test("Owner reset erases in-memory audit without reusing revision tokens",()=>{
 const d=owner(),old=d.snapshot().flags[4];
 d.runEvaluation({mode:"synthetic_only"});
 d.reviewFlag({flag_id:old.flag_id,decision:"acknowledged",expected_revision:old.revision});
 eq(d.reset().ok,true);
 const s=d.snapshot();eq(s.history.length,0);eq(s.simulated_runs,0);
 eq(s.flags.length,6);eq(s.flags[4].status,"unreviewed");
 yes(s.flags[4].revision>old.revision,"replay-preventing revision");
 eq(d.reviewFlag({flag_id:old.flag_id,decision:"acknowledged",expected_revision:old.revision}).ok,false);
});
Deno.test("Sandbox never calls network or browser storage, no external telemetry",()=>{
 const previous=globalThis.fetch;let network=0;
 globalThis.fetch=(()=>{network++;throw Error("forbidden network")}) as typeof fetch;
 try{
  const d=owner();d.runEvaluation({mode:"synthetic_only"});change(d,3);
  eq(network,0);eq(d.snapshot().external_notifications,0);eq(d.snapshot().backend_writes,0);
  const serialized=JSON.stringify(d.snapshot()).toLowerCase();
  for(const field of ['"email"','"phone"','"aadhaar"','"account_number"','"borrower"'])
   yes(!serialized.includes(field),"no sensitive property "+field);
 }finally{globalThis.fetch=previous;}
});
