/** VORVAN M2 VOR-013: deterministic synthetic-only support & complaints lifecycle.
 * No live cases, messages, PII, API, storage, timers, financial advice or email.
 * Role is supplied ONLY by an upstream verified AAL2 company Admin session.
 */
export const VERSION="m2-vor013-sandbox-2026-11-11-v1";
export const CATEGORIES=Object.freeze(["general","website","partner","security","complaint"]);
export const ROLES=Object.freeze(["owner","operator","auditor"]);
export const STATES=Object.freeze(["open","triaged","in_progress","escalated","resolved","closed"]);
export const SLA_HOURS=Object.freeze({general:48,website:48,partner:48,security:8,complaint:24});
export const ESCALATIONS=Object.freeze({security:"security",complaint:"grievance",general:"support",website:"support",partner:"partnerships"});
export const PRESETS=Object.freeze({
  general:"Fictional support process enquiry",
  website:"Fictional website navigation issue",
  partner:"Fictional direct LSP/API documentation enquiry",
  security:"Fictional security incident simulation",
  complaint:"Fictional grievance handling simulation"
});
const TRANSITIONS=Object.freeze({
 open:["triaged","escalated"],triaged:["in_progress","escalated"],
 in_progress:["escalated","resolved"],escalated:["in_progress","resolved"],
 resolved:["closed","in_progress"],closed:[]
});
function isRecord(x){return x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;}
function err(code){return {ok:false,code};}
function hoursToMs(n){return n*3600000;}
function validNow(n){return Number.isSafeInteger(n)&&n>=0&&n<8640000000000000;}
function freezeEvent(e){return Object.freeze(e);}
function safeCopy(c){return {...c};}
export function createSupportLifecycleSandbox(role, startMs=Date.UTC(2026,10,11,9,0,0)){
 if(!ROLES.includes(role))throw Error("unsupported_role");
 if(!validNow(startMs))throw Error("invalid_time");
 let now=startMs,cases=[],audit=[],sequence=0;
 // Synthetic examples are made locally; no network/data source is queried.
 const canWrite=()=>role==="owner"||role==="operator";
 function snapshot(){
  return Object.freeze({
   ok:true,version:VERSION,mode:"synthetic_only",role,now_ms:now,
   storage:"memory_only",real_customers:false,external_email_sent:false,
   cases:cases.map(c=>Object.freeze({...c,sla:computeSla(c)})),
   audit:audit.slice()
  });
 }
 function computeSla(c){
  const dueAt=c.created_at_ms+hoursToMs(SLA_HOURS[c.category]);
  const terminal=c.status==="resolved"||c.status==="closed";
  const overdue=!terminal&&now>dueAt;
  return Object.freeze({policy:"demonstration_only_not_a_regulatory_SLA",target_hours:SLA_HOURS[c.category],
   due_at_ms:dueAt,overdue,remaining_hours:terminal?null:Math.max(0,Math.ceil((dueAt-now)/hoursToMs(1))),
   escalation_required:overdue&&!c.escalation_acknowledged,escalation_team:ESCALATIONS[c.category]});
 }
 function log(id,action,from,to){
  audit.push(freezeEvent({event_no:audit.length+1,case_id:id,action,from:from??null,to:to??null,
   actor_role:role,at_ms:now,synthetic_only:true}));
 }
 function intake(input){
  if(!canWrite())return err("read_only_role");
  if(!isRecord(input)||Object.keys(input).length!==3||
    !Object.hasOwn(input,"mode")||!Object.hasOwn(input,"category")||!Object.hasOwn(input,"preset")||
    input.mode!=="synthetic_only"||!CATEGORIES.includes(input.category)||
    input.preset!==input.category)return err("invalid_synthetic_case");
  sequence+=1;
  const c={id:"DEMO-"+String(sequence).padStart(4,"0"),category:input.category,
   subject:PRESETS[input.category],status:"open",created_at_ms:now,updated_at_ms:now,
   escalation_acknowledged:false,assignee_team:ESCALATIONS[input.category],
   source:"synthetic_admin_only",contains_personal_data:false};
  cases.push(c);log(c.id,"created",null,"open");
  return {ok:true,case:safeCopy(c),sla:computeSla(c)};
 }
 function transition(id,to){
  if(!canWrite())return err("read_only_role");
  if(typeof id!=="string"||!/^DEMO-\d{4}$/.test(id)||!STATES.includes(to))return err("invalid_transition");
  const c=cases.find(x=>x.id===id);
  if(!c)return err("case_not_found");
  if(!TRANSITIONS[c.status].includes(to))return err("transition_not_allowed");
  // Overdue cases cannot be closed directly without an escalation acknowledgement.
  if(to==="resolved"&&computeSla(c).overdue&&!c.escalation_acknowledged)
   return err("overdue_requires_escalation");
  const before=c.status;
  c.status=to;c.updated_at_ms=now;
  if(to==="escalated")c.escalation_acknowledged=true;
  log(id,"status_transition",before,to);
  return {ok:true,case:safeCopy(c),sla:computeSla(c)};
 }
 function acknowledgeEscalation(id){
  if(!canWrite())return err("read_only_role");
  if(typeof id!=="string"||!/^DEMO-\d{4}$/.test(id))return err("invalid_case_id");
  const c=cases.find(x=>x.id===id);
  if(!c)return err("case_not_found");
  if(!computeSla(c).overdue&&c.status!=="escalated")return err("not_escalation_eligible");
  if(c.escalation_acknowledged)return {ok:true,idempotent:true};
  c.escalation_acknowledged=true;c.updated_at_ms=now;
  log(id,"escalation_acknowledged",c.status,c.status);
  return {ok:true,idempotent:false,case:safeCopy(c)};
 }
 function advanceClock(hours){
  if(role!=="owner")return err("owner_only_clock");
  if(!Number.isInteger(hours)||hours<0||hours>168||!validNow(now+hoursToMs(hours)))
   return err("invalid_clock_advance");
  now+=hoursToMs(hours);
  // Clock advances are not actual escalations; overdue is a derived state.
  log(null,"synthetic_clock_advanced",null,null);
  return {ok:true,now_ms:now};
 }
 function auditFor(id){
  if(typeof id!=="string"||!/^DEMO-\d{4}$/.test(id))return err("invalid_case_id");
  if(!cases.some(c=>c.id===id))return err("case_not_found");
  return {ok:true,events:audit.filter(e=>e.case_id===id)};
 }
 function reset(){
  if(role!=="owner")return err("owner_only_reset");
  // erase synthetic work; audit is not a durable compliance record.
  cases=[];audit=[];sequence=0;now=startMs;
  return {ok:true,erased:true};
 }
 return Object.freeze({snapshot,intake,transition,acknowledgeEscalation,advanceClock,auditFor,reset});
}
