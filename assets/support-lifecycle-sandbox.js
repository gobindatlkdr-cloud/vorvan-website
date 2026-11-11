/**
 * M2 VOR-013 — FICTIONAL support/complaints lifecycle.
 * Pure browser module. No live customer intake, Supabase data, email, fetch,
 * notifications, storage, personal identifiers, real SLA or credit decisions.
 * The actual admin session/AAL2/ACL is verified by /admin-console/overview,
 * BEFORE the parent admin.js is allowed to mount this demonstration.
 */
export const SUPPORT_VERSION="vor013-synthetic-2026-11-11-v1";
export const ROLES=Object.freeze(["owner","operator","auditor"]);
export const STATUS=Object.freeze(["new","triaged","in_progress","awaiting_review","resolved","reopened","escalated","closed"]);
export const MAX_CASES=20,MAX_AUDIT=240;
export const START_MS=Date.parse("2026-11-11T09:00:00Z");
const HOUR=60*60*1000;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const FIXED_CASES=Object.freeze([
 Object.freeze({id:"website_navigation",scope:"operations",category:"website",
  subject:"Fictional page navigation issue",summary:"Simulate reviewing a demo website navigation concern."}),
 Object.freeze({id:"partner_api_information",scope:"operations",category:"partner",
  subject:"Fictional institutional API inquiry follow-up",summary:"Simulate clarifying a generic bank/NBFC direct API enquiry."}),
 Object.freeze({id:"general_help",scope:"operations",category:"general",
  subject:"Fictional support guidance request",summary:"Simulate finding public website support guidance."}),
 Object.freeze({id:"privacy_policy_review",scope:"compliance",category:"privacy",
  subject:"Fictional privacy notice review",summary:"Simulate an internal privacy policy question; no personal data."}),
 Object.freeze({id:"security_warning",scope:"compliance",category:"security",
  subject:"Fictional security incident drill",summary:"Simulate internal triage of a hypothetical website security warning."}),
 Object.freeze({id:"complaints_policy",scope:"compliance",category:"complaints",
  subject:"Fictional complaint policy review",summary:"Simulate an internal review of complaint-routing policy."})
]);
export const DEMO_SLA=Object.freeze({
 website:Object.freeze({ack_h:24,response_h:72,resolve_h:168}),
 partner:Object.freeze({ack_h:12,response_h:48,resolve_h:120}),
 general:Object.freeze({ack_h:24,response_h:72,resolve_h:168}),
 privacy:Object.freeze({ack_h:12,response_h:48,resolve_h:120}),
 security:Object.freeze({ack_h:4,response_h:12,resolve_h:48}),
 complaints:Object.freeze({ack_h:24,response_h:72,resolve_h:168})
});
// Closed is terminal for this synthetic demo. A reopened case must be resolved first.
const ALLOWED=Object.freeze({
 new:Object.freeze(["triaged"]),
 triaged:Object.freeze(["in_progress"]),
 in_progress:Object.freeze(["awaiting_review"]),
 awaiting_review:Object.freeze(["resolved"]),
 resolved:Object.freeze(["closed","reopened"]),
 reopened:Object.freeze(["in_progress"]),
 escalated:Object.freeze(["in_progress"]),
 closed:Object.freeze([])
});
export function nextStatuses(status){
 return typeof status==="string"&&Object.hasOwn(ALLOWED,status)?Object.freeze([...ALLOWED[status]]):Object.freeze([]);
}
const denial=(code)=>Object.freeze({ok:false,code});
const isRole=v=>typeof v==="string"&&ROLES.includes(v);
const isUUID=v=>typeof v==="string"&&UUID.test(v);
const plain=v=>v!==null&&typeof v==="object"&&!Array.isArray(v)&&
 (Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const sameKeys=(obj,expected)=>plain(obj)&&Object.keys(obj).length===expected.length&&
 expected.every(k=>Object.hasOwn(obj,k));
const permitted=(role,rec)=>role==="owner"||(role==="operator"&&rec.scope==="operations");
const readAllowed=(role,rec)=>role==="owner"||role==="auditor"||
  (role==="operator"&&rec.scope==="operations");
const immutable=(value)=>Object.freeze(value);
const toIso=(ms)=>new Date(ms).toISOString();
function sla(rec,nowMs){
 const policy=DEMO_SLA[rec.category];
 const end=rec.closed_at_ms!==null||rec.resolved_at_ms!==null;
 const deadlines={
  acknowledge:rec.created_at_ms+policy.ack_h*HOUR,
  first_response:rec.created_at_ms+policy.response_h*HOUR,
  resolution:rec.created_at_ms+policy.resolve_h*HOUR
 };
 const breached={
  acknowledge:rec.acknowledged_at_ms===null&&nowMs>deadlines.acknowledge,
  first_response:rec.responded_at_ms===null&&nowMs>deadlines.first_response,
  resolution:!end&&nowMs>deadlines.resolution
 };
 return immutable({
  policy:"illustrative_internal_targets_not_regulatory_sla",
  deadline_at:immutable(Object.fromEntries(Object.entries(deadlines).map(([k,v])=>[k,toIso(v)]))),
  breached:immutable(breached),escalation_suggested:Object.values(breached).some(Boolean),
  priority:rec.category==="security"?"high_demo_priority":"normal_demo_priority"
 });
}
/** Role is passed ONLY after parent admin.js verifies a current MFA/ACL session.
 * This role is an in-memory simulation, never an authorization boundary for real data. */
export function createSupportLifecycleSandbox(role){
 if(!isRole(role))return denial("unauthorized_role");
 const cases=[],events=[],requests=new Map();
 let auditSequence=0;
 function visible(id){return cases.find(x=>x.id===id)||null}
 function receipts(request_id,fingerprint){
  if(!requests.has(request_id))return null;
  const old=requests.get(request_id);
  return old.fingerprint===fingerprint?immutable({...old.receipt,idempotent:true}):denial("idempotency_conflict");
 }
 function emit(action,rec,from,to,nowMs,request_id){
  const event=immutable({
    seq:++auditSequence,case_id:rec.id,action,from_status:from,to_status:to,
    actor_role:role,request_id,at:toIso(nowMs),synthetic_only:true
  });
  events.push(event);return event;
 }
 function add(raw,nowMs=START_MS){
  if(!sameKeys(raw,["mode","template_id","request_id"]))return denial("invalid_input");
  if(raw.mode!=="synthetic_only")return denial("synthetic_mode_required");
  if(!isUUID(raw.request_id))return denial("invalid_request_id");
  const item=FIXED_CASES.find(x=>x.id===raw.template_id);
  if(!item)return denial("unknown_template");
  if(!Number.isSafeInteger(nowMs)||nowMs<START_MS||nowMs>START_MS+365*24*HOUR)
   return denial("invalid_clock");
  const fingerprint="intake:"+item.id;
  const previous=receipts(raw.request_id,fingerprint);if(previous)return previous;
  if(!permitted(role,item))return denial(role==="auditor"?"read_only_role":"out_of_scope");
  if(cases.length>=MAX_CASES||events.length>=MAX_AUDIT)return denial("demo_capacity");
  const rec={
   id:raw.request_id,template_id:item.id,category:item.category,scope:item.scope,
   subject:item.subject,summary:item.summary,
   status:"new",version:1,created_at_ms:nowMs,last_event_at_ms:nowMs,acknowledged_at_ms:null,
   responded_at_ms:null,resolved_at_ms:null,closed_at_ms:null
  };
  cases.push(rec);
  emit("created",rec,null,"new",nowMs,raw.request_id);
  const receipt=immutable({ok:true,idempotent:false,case_id:rec.id,status:rec.status,version:rec.version,
    simulated:true,no_backend_write:true});
  requests.set(raw.request_id,{fingerprint,receipt});return receipt;
 }
 function update(raw,nowMs=START_MS){
  if(!sameKeys(raw,["mode","case_id","target_status","expected_version","request_id"]))
   return denial("invalid_input");
  if(raw.mode!=="synthetic_only")return denial("synthetic_mode_required");
  if(!isUUID(raw.case_id)||!isUUID(raw.request_id)||raw.case_id===raw.request_id)
   return denial("invalid_request_id");
  if(!STATUS.includes(raw.target_status))return denial("invalid_status");
  if(!Number.isSafeInteger(raw.expected_version)||raw.expected_version<1)return denial("invalid_version");
  if(!Number.isSafeInteger(nowMs)||nowMs<START_MS||nowMs>START_MS+365*24*HOUR)
   return denial("invalid_clock");
  const fingerprint="status:"+raw.case_id+":"+raw.target_status+":"+raw.expected_version;
  const oldReceipt=receipts(raw.request_id,fingerprint);if(oldReceipt)return oldReceipt;
  const rec=visible(raw.case_id);
  if(!rec)return denial("case_not_found");
  if(!permitted(role,rec))return denial(role==="auditor"?"read_only_role":"out_of_scope");
  if(rec.version!==raw.expected_version)return denial("stale_version");
  if(!ALLOWED[rec.status].includes(raw.target_status))return denial("invalid_transition");
  if(nowMs<rec.last_event_at_ms)return denial("clock_reversal");
  if(events.length>=MAX_AUDIT)return denial("audit_capacity");
  const previous=rec.status;rec.status=raw.target_status;rec.version++;rec.last_event_at_ms=nowMs;
  if(raw.target_status==="triaged"&&rec.acknowledged_at_ms===null)rec.acknowledged_at_ms=nowMs;
  if(raw.target_status==="in_progress"&&rec.responded_at_ms===null)rec.responded_at_ms=nowMs;
  if(raw.target_status==="resolved")rec.resolved_at_ms=nowMs;
  if(raw.target_status==="reopened")rec.resolved_at_ms=null;
  if(raw.target_status==="closed")rec.closed_at_ms=nowMs;
  emit("status_changed",rec,previous,rec.status,nowMs,raw.request_id);
  const receipt=immutable({ok:true,case_id:rec.id,status:rec.status,version:rec.version,
    idempotent:false,simulated:true,no_backend_write:true});
  requests.set(raw.request_id,{fingerprint,receipt});return receipt;
 }
 function escalate(raw,nowMs=START_MS){
  if(!sameKeys(raw,["mode","case_id","expected_version","request_id"]))
   return denial("invalid_input");
  if(raw.mode!=="synthetic_only")return denial("synthetic_mode_required");
  if(!isUUID(raw.case_id)||!isUUID(raw.request_id)||raw.case_id===raw.request_id)
   return denial("invalid_request_id");
  if(!Number.isSafeInteger(raw.expected_version)||raw.expected_version<1)return denial("invalid_version");
  if(!Number.isSafeInteger(nowMs)||nowMs<START_MS||nowMs>START_MS+365*24*HOUR)
   return denial("invalid_clock");
  const fingerprint="escalate:"+raw.case_id+":"+raw.expected_version;
  const previous=receipts(raw.request_id,fingerprint);if(previous)return previous;
  const rec=visible(raw.case_id);if(!rec)return denial("case_not_found");
  if(!permitted(role,rec))return denial(role==="auditor"?"read_only_role":"out_of_scope");
  if(rec.version!==raw.expected_version)return denial("stale_version");
  if(!["new","triaged","in_progress","awaiting_review","reopened"].includes(rec.status))
   return denial("invalid_transition");
  if(nowMs<rec.created_at_ms)return denial("invalid_clock");
  if(!sla(rec,nowMs).escalation_suggested&&rec.category!=="security")
   return denial("not_due_for_escalation");
  if(events.length>=MAX_AUDIT)return denial("audit_capacity");
  const from=rec.status;rec.status="escalated";rec.version++;rec.last_event_at_ms=nowMs;
  emit("escalation_simulated",rec,from,"escalated",nowMs,raw.request_id);
  const result=immutable({ok:true,case_id:rec.id,status:rec.status,version:rec.version,
   idempotent:false,simulated:true,notification_sent:false,real_escalation_created:false});
  requests.set(raw.request_id,{fingerprint,receipt:result});return result;
 }
 function snapshot(nowMs=START_MS){
  if(!Number.isSafeInteger(nowMs)||nowMs<START_MS||nowMs>START_MS+365*24*HOUR)
   return denial("invalid_clock");
  const queue=cases.filter(x=>readAllowed(role,x)).map(x=>immutable({
    id:x.id,template_id:x.template_id,category:x.category,scope:x.scope,
    subject:x.subject,summary:x.summary,status:x.status,version:x.version,
    created_at:toIso(x.created_at_ms),sla:sla(x,nowMs)
  }));
  const shown=new Set(queue.map(x=>x.id));
  return immutable({
   ok:true,version:SUPPORT_VERSION,role,mode:"synthetic_only",
   queue:immutable(queue),cases_visible:queue.length,total_synthetic_cases:cases.length,
   audit:immutable(events.filter(e=>shown.has(e.case_id)).map(e=>immutable({...e}))),
   simulated_now:toIso(nowMs),
   permissions:immutable({read:true,intake:role!=="auditor",transition:role!=="auditor",
     escalation:role!=="auditor",delete:false,real_case_access:false,real_notification:false}),
   backend_writes:0,customer_records:0,real_grievance_received:false,
   real_sla_enforced:false,notification_sent:false,storage_enabled:false
  });
 }
 function reset(){
  if(role!=="owner")return denial("owner_only");
  cases.length=0;events.length=0;requests.clear();auditSequence=0;
  return immutable({ok:true,synthetic_only:true,all_demo_data_cleared:true});
 }
 return immutable({ok:true,role,version:SUPPORT_VERSION,add,update,escalate,snapshot,reset});
}
