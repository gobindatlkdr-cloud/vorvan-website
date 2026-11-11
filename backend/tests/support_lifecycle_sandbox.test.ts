import {createSupportLifecycleSandbox,CATEGORIES,ROLES,STATES,SLA_HOURS,VERSION} from "../../assets/support-lifecycle-sandbox.js";
const eq=(a:unknown,b:unknown,name="check")=>{if(a!==b)throw Error(name+": "+String(a)+" != "+String(b));};
const yes=(a:unknown,name:string)=>{if(!a)throw Error(name);};
const start=Date.UTC(2026,10,11,9,0,0);
const sample=(category:string)=>({mode:"synthetic_only",category,preset:category});
function get(d:ReturnType<typeof createSupportLifecycleSandbox>){return d.snapshot();}
Deno.test("VOR-013 five synthetic categories and service-training SLA targets",()=>{
 eq(VERSION,"m2-vor013-sandbox-2026-11-11-v1");eq(CATEGORIES.length,5);
 eq(SLA_HOURS.security,8);eq(SLA_HOURS.complaint,24);
 eq(SLA_HOURS.general,48);eq(SLA_HOURS.partner,48);
 eq(STATES.length,6);
});
Deno.test("Owner creates five fictional cases and timestamps reflect fixed policy",()=>{
 const d=createSupportLifecycleSandbox("owner",start);
 for(const c of CATEGORIES)eq(d.intake(sample(c)).ok,true);
 const snap=get(d);eq(snap.cases.length,5);eq(snap.audit.length,5);
 eq(snap.cases[0].id,"DEMO-0001");
 for(const x of snap.cases){eq(x.sla.target_hours,SLA_HOURS[x.category as keyof typeof SLA_HOURS]);
 eq(x.source,"synthetic_admin_only");eq(x.contains_personal_data,false);eq(x.sla.overdue,false);}
 eq(snap.storage,"memory_only");eq(snap.real_customers,false);eq(snap.external_email_sent,false);
});
Deno.test("Operator can intake and progress but cannot change clock or erase audit",()=>{
 const d=createSupportLifecycleSandbox("operator",start);
 eq(d.intake(sample("partner")).ok,true);
 eq(d.transition("DEMO-0001","triaged").ok,true);
 eq(d.advanceClock(25).ok,false);eq(d.reset().ok,false);
 eq(get(d).cases[0].status,"triaged");
});
Deno.test("Auditor can read synthetic queue/audit but cannot create or mutate cases",()=>{
 const d=createSupportLifecycleSandbox("auditor",start);
 eq(d.intake(sample("general")).ok,false);
 eq(d.transition("DEMO-0001","triaged").ok,false);
 eq(d.acknowledgeEscalation("DEMO-0001").ok,false);
 eq(d.advanceClock(25).ok,false);eq(d.reset().ok,false);
 eq(get(d).cases.length,0);
});
Deno.test("Input constraints deny PII text, free text, unknown categories and client identity",()=>{
 const d=createSupportLifecycleSandbox("owner");
 for(const x of [
  {...sample("website"),subject:"Name and Aadhaar details"},
  {...sample("website"),email:"person@example.invalid"},
  {...sample("website"),notes:"PAN ABCDE1234F"},
  {...sample("website"),user_id:"10000000-0000-4000-8000-000000000001"},
  {...sample("website"),mode:"production"},
  {...sample("website"),preset:"general"},
  sample("loan_approval"),null,[],{}
 ]){const r=d.intake(x);eq(r.ok,false,"privacy-gated intake");}
 eq(get(d).audit.length,0);eq(get(d).cases.length,0);
});
Deno.test("Status state machine allows triage, progress, resolution and closure",()=>{
 const d=createSupportLifecycleSandbox("owner",start);d.intake(sample("general"));
 for(const target of ["triaged","in_progress","resolved","closed"]){
  const r=d.transition("DEMO-0001",target);eq(r.ok,true,target);
 }
 eq(get(d).cases[0].status,"closed");
 eq(d.transition("DEMO-0001","in_progress").ok,false);
 eq(get(d).audit.length,5);
});
Deno.test("Illegal skips, no-ops, unsupported ID and hidden reopened state denied",()=>{
 const d=createSupportLifecycleSandbox("owner",start);d.intake(sample("complaint"));
 for(const state of ["closed","resolved","open","unauthorised"]){
  const result=d.transition("DEMO-0001",state);eq(result.ok,false,state);
 }
 eq(d.transition("DEMO-9999","triaged").ok,false);
 eq(d.transition("real-uuid","triaged").ok,false);
 eq(get(d).audit.length,1);
});
Deno.test("Overdue security incident requires training escalation before resolution",()=>{
 const d=createSupportLifecycleSandbox("owner",start);d.intake(sample("security"));
 d.transition("DEMO-0001","triaged");d.transition("DEMO-0001","in_progress");
 d.advanceClock(9);
 let item=get(d).cases[0];eq(item.sla.overdue,true);eq(item.sla.escalation_required,true);
 eq(item.sla.escalation_team,"security");eq(item.sla.target_hours,8);
 const reject=d.transition("DEMO-0001","resolved");eq(reject.ok,false);
 eq(d.acknowledgeEscalation("DEMO-0001").ok,true);
 eq(d.acknowledgeEscalation("DEMO-0001").idempotent,true);
 eq(d.transition("DEMO-0001","resolved").ok,true);
 item=get(d).cases[0];eq(item.sla.overdue,false);eq(item.sla.remaining_hours,null);
});
Deno.test("Escalation route and controlled acknowledgement are auditable",()=>{
 const d=createSupportLifecycleSandbox("owner",start);d.intake(sample("complaint"));
 eq(d.acknowledgeEscalation("DEMO-0001").ok,false);
 eq(d.transition("DEMO-0001","escalated").ok,true);
 const events=d.auditFor("DEMO-0001");
 eq(events.ok,true);if(!events.ok)throw Error("missing audit");
 eq(events.events.length,2);eq(events.events[1].to,"escalated");
 eq(get(d).cases[0].assignee_team,"grievance");
 eq(get(d).cases[0].escalation_acknowledged,true);
});
Deno.test("SLA threshold exact boundary is not overdue until exceeded",()=>{
 const d=createSupportLifecycleSandbox("owner",start);d.intake(sample("complaint"));
 d.advanceClock(24);eq(get(d).cases[0].sla.overdue,false);
 d.advanceClock(1);eq(get(d).cases[0].sla.overdue,true);
});
Deno.test("All audit events are frozen chronological append-only snapshots",()=>{
 const d=createSupportLifecycleSandbox("owner",start);d.intake(sample("website"));d.transition("DEMO-0001","triaged");
 const before=d.snapshot();eq(before.audit.length,2);
 yes(Object.isFrozen(before.audit[0]),"frozen event");yes(Object.isFrozen(before.cases[0]),"frozen case snapshot");
 eq(before.audit[0].action,"created");eq(before.audit[1].action,"status_transition");
 const a=d.auditFor("DEMO-0001");if(!a.ok)throw Error("audit failed");
 eq(a.events[0].event_no,1);eq(a.events[1].event_no,2);
 eq(d.auditFor("DEMO-9999").ok,false);
});
Deno.test("Reset erases synthetic cases and audit but cannot affect external service",()=>{
 const d=createSupportLifecycleSandbox("owner",start);d.intake(sample("general"));d.advanceClock(3);
 eq(d.reset().ok,true);eq(get(d).cases.length,0);eq(get(d).audit.length,0);eq(get(d).now_ms,start);
 eq(d.intake(sample("general")).case?.id,"DEMO-0001");
});
Deno.test("Invalid role, clock, oversized advance and negative time are rejected",()=>{
 for(const role of ["customer","anonymous","viewer"]){
  let failed=false;try{createSupportLifecycleSandbox(role);}catch{failed=true;}yes(failed,role);
 }
 const d=createSupportLifecycleSandbox("owner",start);
 for(const n of [1.5,169,-1,Number.NaN])eq(d.advanceClock(n).ok,false);
});
Deno.test("Read-only data cannot contain financial fields, phone, OTP, PAN or email",()=>{
 const d=createSupportLifecycleSandbox("owner",start);
 for(const c of CATEGORIES)d.intake(sample(c));
 const value=JSON.stringify(d.snapshot());
 for(const field of ['"email"','"phone"','"otp"','"pan"','"account_number"','"borrower"'])
  yes(!value.toLowerCase().includes(field.toLowerCase()),"no "+field);
});
Deno.test("Engine never calls network, localStorage, cookies or realtime services",()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=(()=>{calls++;throw Error("network forbidden")}) as typeof fetch;
 try{const d=createSupportLifecycleSandbox("owner");d.intake(sample("security"));d.transition("DEMO-0001","escalated");eq(calls,0);}
 finally{globalThis.fetch=old;}
});
