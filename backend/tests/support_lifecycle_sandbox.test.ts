/** VOR-013 tests actual fictional support-case model. Zero live PII or external services. */
import {
 createSupportLifecycleSandbox,SUPPORT_VERSION,ROLES,STATUS,FIXED_CASES,DEMO_SLA,
 START_MS,MAX_CASES,MAX_AUDIT,nextStatuses
} from "../../assets/support-lifecycle-sandbox.js";
function eq(a:unknown,b:unknown,label="assert"){if(JSON.stringify(a)!==JSON.stringify(b))
 throw Error(label+" expected "+JSON.stringify(b)+" got "+JSON.stringify(a));}
function yes(v:unknown,label:string){if(!v)throw Error(label);}
function open(role:"owner"|"operator"|"auditor"){
 const x=createSupportLifecycleSandbox(role);
 if(!x.ok)throw Error("valid role rejected");return x;
}
const h=(n:number)=>START_MS+n*3600000;
let seq=0;
function uuid(){const tail=(++seq).toString(16).padStart(12,"0");return "a0000000-0000-4000-8000-"+tail;}
function payload(template_id:string,id=uuid()){return {mode:"synthetic_only",template_id,request_id:id};}
function create(s:ReturnType<typeof open>,template_id="website_navigation",nowMs=START_MS){
 const r=s.add(payload(template_id),nowMs);
 if(!r.ok)throw Error("Unexpected case creation failed "+r.code);return r;
}
function change(s:ReturnType<typeof open>,c:{case_id:string;version:number},target_status:string,clock=START_MS,id=uuid()){
 return s.update({mode:"synthetic_only",case_id:c.case_id,target_status,expected_version:c.version,request_id:id},clock);
}
function err(r:unknown,code:string){if(!r||typeof r!=="object"||!("code" in r))throw Error("Expected denial "+code);eq(r.code,code);}
Deno.test("VOR-013 uses fixed, public fictional template IDs and separate illustrative SLA policies",()=>{
 eq(SUPPORT_VERSION,"vor013-synthetic-2026-11-11-v1");
 eq(ROLES,["owner","operator","auditor"]);eq(FIXED_CASES.length,6);
 eq(new Set(FIXED_CASES.map(x=>x.id)).size,6);
 eq(FIXED_CASES.filter(x=>x.scope==="operations").length,3);
 eq(FIXED_CASES.filter(x=>x.scope==="compliance").length,3);
 eq(Object.keys(DEMO_SLA).length,6);
 yes(FIXED_CASES.every(x=>Object.isFrozen(x)&&!/PAN|Aadhaar|@|account number|password/i.test(x.summary)),"No private case data");
});
Deno.test("Anonymous, customer, self-declared superuser and malformed role never initialize queue",()=>{
 for(const role of [null,undefined,{},[],0,"","admin","customer","OWNER","superadmin","operator:owner"]){
  err(createSupportLifecycleSandbox(role),"unauthorized_role");
 }
});
Deno.test("Owner can create six synthetic templates; no real customer, backend or SMS",()=>{
 const s=open("owner");
 for(const t of FIXED_CASES)create(s,t.id);
 const view=s.snapshot();
 eq(view.cases_visible,6);eq(view.audit.length,6);eq(view.mode,"synthetic_only");
 eq(view.customer_records,0);eq(view.backend_writes,0);
 eq(view.storage_enabled,false);eq(view.real_grievance_received,false);eq(view.notification_sent,false);
 eq(view.real_sla_enforced,false);eq(view.queue.every(x=>x.status==="new"),true);
});
Deno.test("Operator sees only assigned operations cases and cannot create compliance case",()=>{
 const o=open("operator");
 for(const t of FIXED_CASES.filter(t=>t.scope==="operations"))create(o,t.id);
 err(o.add(payload("privacy_policy_review")),"out_of_scope");
 err(o.add(payload("security_warning")),"out_of_scope");
 const view=o.snapshot();eq(view.cases_visible,3);
 yes(view.queue.every(x=>x.scope==="operations"),"Operator scope");
});
Deno.test("Auditor sees read-only queue and cannot add, transition, escalate or reset",()=>{
 const a=open("auditor");
 err(a.add(payload("website_navigation")),"read_only_role");
 err(a.update({mode:"synthetic_only",case_id:uuid(),target_status:"triaged",expected_version:1,request_id:uuid()}),"case_not_found");
 err(a.reset(),"owner_only");
 const v=a.snapshot();eq(v.permissions.transition,false);eq(v.permissions.intake,false);
 eq(v.permissions.real_case_access,false);eq(v.permissions.real_notification,false);
});
Deno.test("No free-text intake, names, email, PAN, passwords, account numbers, or customer IDs accepted",()=>{
 const s=open("owner"),base=payload("general_help");
 for(const field of [
 {subject:"Real person full name"}, {notes:"PAN ABCDE1234F"},{email:"user@example.com"},
 {phone:"9876543210"}, {user_id:"fake"}, {amount:50000}, {description:"a private grievance"},
 {password:"something"}, {account:"12345678901234"}
 ])err(s.add({...base,...field}),"invalid_input");
 err(s.add({...base,mode:"production"}),"synthetic_mode_required");
 err(s.add({...base,template_id:"custom_subject_from_user"}),"unknown_template");
 err(s.add({...base,request_id:"123"}),"invalid_request_id");
 eq(s.snapshot().queue.length,0);
});
Deno.test("Duplicate request ID is idempotent and conflicting template is rejected",()=>{
 const s=open("owner"),id=uuid();
 const r=s.add(payload("website_navigation",id));
 eq(r.ok,true);const old=s.add(payload("website_navigation",id));
 eq(old.ok,true);if(old.ok)eq(old.idempotent,true);
 err(s.add(payload("security_warning",id)),"idempotency_conflict");
 eq(s.snapshot().audit.length,1);eq(s.snapshot().queue.length,1);
});
Deno.test("Owner stage graph enforces safe sequence and version increment with immutable audit",()=>{
 const s=open("owner");let c=create(s,"partner_api_information");
 const expected=["triaged","in_progress","awaiting_review","resolved","closed"];
 for(const [i,status] of expected.entries()){
  const r=change(s,c,status,h(i+1));
  eq(r.ok,true,"stage "+status);if(!r.ok)throw Error("unexpected");
  c={...c,version:r.version};
  eq(s.snapshot(h(i+1)).queue[0].status,status);
 }
 eq(s.snapshot(h(6)).queue[0].version,6);
 eq(s.snapshot(h(6)).audit.length,6);
 err(change(s,c,"reopened",h(6)),"invalid_transition");
 yes(s.snapshot().audit.every(x=>x.synthetic_only&&x.actor_role==="owner"),"role-tagged event trail");
});
Deno.test("Skipped status, fake approval and status bypass never mutate",()=>{
 const s=open("owner"),c=create(s);
 for(const status of ["resolved","closed","approved","underwriting","accepted","in_progress","new"]){
  err(change(s,c,status),"invalid_transition");
 }
 eq(s.snapshot().queue[0].status,"new");eq(s.snapshot().audit.length,1);
 eq(nextStatuses("new"),["triaged"]);
 eq(nextStatuses("closed"),[]);
});
Deno.test("Optimistic version and idempotent retry prevent duplicate status audit entries",()=>{
 const s=open("owner"),c=create(s),id=uuid();
 const r=change(s,c,"triaged",h(1),id);eq(r.ok,true);if(!r.ok)throw Error("bad");
 const copy=change(s,c,"triaged",h(1),id);eq(copy.ok,true);if(copy.ok)eq(copy.idempotent,true);
 err(change(s,c,"in_progress",h(2)),"stale_version");
 err(change(s,c,"closed",h(2),id),"idempotency_conflict");
 eq(s.snapshot().audit.length,2);
});
Deno.test("Internal demo SLA shows 3 synthetic deadlines and different category targets",()=>{
 const s=open("owner");
 create(s,"security_warning");create(s,"general_help");
 const start=s.snapshot(h(0)),late=s.snapshot(h(25));
 const security=start.queue.find(x=>x.category==="security")!;
 const general=start.queue.find(x=>x.category==="general")!;
 eq(security.sla.policy,"illustrative_internal_targets_not_regulatory_sla");
 eq(security.sla.priority,"high_demo_priority");
 yes(security.sla.deadline_at.acknowledge!==general.sla.deadline_at.acknowledge,"priority differs");
 const overdue=late.queue.find(x=>x.category==="security")!;
 eq(overdue.sla.breached.acknowledge,true);
 eq(overdue.sla.breached.first_response,true);
 eq(overdue.sla.escalation_suggested,true);
 eq(late.real_sla_enforced,false);
});
Deno.test("Acknowledged and responded clocks stop being overdue while unresolved resolution can still breach",()=>{
 const s=open("owner");let c=create(s,"website_navigation");
 for(const [st,t] of [["triaged",h(1)],["in_progress",h(2)]] as const){
  const r=change(s,c,st,t);if(!r.ok)throw Error("unexpected");c={...c,version:r.version};
 }
 const after=s.snapshot(h(200)).queue[0].sla;
 eq(after.breached.acknowledge,false);eq(after.breached.first_response,false);
 eq(after.breached.resolution,true);
});
Deno.test("Overdue or security incident escalation is in-memory only with audit and safe restart",()=>{
 const s=open("owner"),c=create(s,"website_navigation");
 err(s.escalate({mode:"synthetic_only",case_id:c.case_id,expected_version:1,request_id:uuid()}),"not_due_for_escalation");
 const r=s.escalate({mode:"synthetic_only",case_id:c.case_id,expected_version:1,request_id:uuid()},h(30));
 eq(r.ok,true);if(!r.ok)throw Error("bad");
 eq(r.real_escalation_created,false);eq(r.notification_sent,false);
 eq(s.snapshot(h(30)).audit.at(-1)!.action,"escalation_simulated");
 const resumed=change(s,{case_id:c.case_id,version:r.version},"in_progress",h(31));
 eq(resumed.ok,true);
 const security=create(s,"security_warning",h(40));
 eq(s.escalate({mode:"synthetic_only",case_id:security.case_id,expected_version:1,request_id:uuid()},h(40)).ok,true);
});
Deno.test("Resolved cases may reopen; closed cases remain terminal",()=>{
 const s=open("owner");let c=create(s);
 for(const [status,time] of [["triaged",1],["in_progress",2],["awaiting_review",3],["resolved",4],["reopened",5],["in_progress",6]] as const){
  const r=change(s,c,status,h(time));if(!r.ok)throw Error("unexpected "+status);
  c={...c,version:r.version};
 }
 eq(s.snapshot(h(6)).queue[0].status,"in_progress");
 err(change(s,c,"closed",h(7)),"invalid_transition");
});
Deno.test("Audit timestamps cannot be backdated after a later status event",()=>{
 const s=open("owner");let c=create(s);const r=change(s,c,"triaged",h(24));
 if(!r.ok)throw Error("bad");c={...c,version:r.version};
 err(change(s,c,"in_progress",h(1)),"clock_reversal");
 eq(s.snapshot(h(24)).audit.length,2);
});
Deno.test("Synthetic snapshot and event records are frozen and cannot elevate permissions",()=>{
 const s=open("auditor"),v=s.snapshot();
 eq(Object.isFrozen(v),true);eq(Object.isFrozen(v.queue),true);
 eq(Object.isFrozen(v.permissions),true);
 eq(v.permissions.real_case_access,false);
 yes(!("setRole" in s)&&!("grantRole" in s)&&!("productionQueue" in s),"No elevation API");
 eq(Object.isFrozen(s),true);
});
Deno.test("Limited memory capacity denies further creation before dropping audit entries",()=>{
 const s=open("owner");
 for(let i=0;i<MAX_CASES;i++)create(s,"general_help");
 err(s.add(payload("general_help")),"demo_capacity");
 eq(s.snapshot().queue.length,MAX_CASES);eq(s.snapshot().audit.length,MAX_CASES);
 yes(MAX_AUDIT>MAX_CASES,"audit ceiling exceeds case limit");
});
Deno.test("Malformed updates, unknown fields, clock and IDs fail closed",()=>{
 const s=open("owner"),c=create(s),base={
  mode:"synthetic_only",case_id:c.case_id,target_status:"triaged",expected_version:1,request_id:uuid()
 };
 for(const change of [{notes:"PAN"}, {actor_role:"owner"}, {grievance:"actual"},
  {amount:9999}, {user_id:"admin"}, {message:"private"}]){
  err(s.update({...base,...change}),"invalid_input");
 }
 err(s.update({...base,request_id:"bad"}),"invalid_request_id");
 err(s.update({...base,expected_version:0}),"invalid_version");
 err(s.update({...base,target_status:"paid"}),"invalid_status");
 err(s.update({...base,mode:"real"}),"synthetic_mode_required");
 err(s.update(base,START_MS-1),"invalid_clock");
 eq(s.snapshot().audit.length,1);
});
Deno.test("Owner reset removes all fictional cases and in-memory audit; other roles cannot",()=>{
 const s=open("owner");create(s,"security_warning");
 eq(s.snapshot().audit.length,1);eq(s.reset().ok,true);
 eq(s.snapshot().audit.length,0);eq(s.snapshot().queue.length,0);
 err(open("operator").reset(),"owner_only");
});
Deno.test("Actual Support Sandbox model makes zero network or browser storage calls",()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=(()=>{calls++;throw Error("unexpected network");}) as typeof fetch;
 try{
  const s=open("owner");create(s);s.snapshot(h(20));
  eq(calls,0);eq(s.snapshot().backend_writes,0);
 }finally{globalThis.fetch=old;}
});
