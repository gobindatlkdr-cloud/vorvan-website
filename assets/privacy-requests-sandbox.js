/** VORVAN M2 / VOR-016 — PRIVATE DATA RIGHTS *SIMULATION ONLY*.
 * This public JS is never identity proof or a customer-data authority.
 * No real request, export, deletion, authentication, consent, email or persistence.
 * Role is passed only after the existing server-verified company Admin AAL2/ACL gate.
 */
import {NOTICE_VERSION,NOTICES} from "./vyn-coach-notices.js";
export const PRIVACY_VERSION="m2-vor016-synthetic-2026-11-11-v1";
export const PRIVACY_NOTICE_VERSION=NOTICE_VERSION;
export const PRIVACY_NOTICES=Object.freeze({...NOTICES.privacy_acknowledgement});
export const ROLES=Object.freeze(["owner","operator","auditor"]);
export const FIXTURE_SUBJECTS=Object.freeze(["fixture_alpha","fixture_beta"]);
export const REQUEST_TYPES=Object.freeze(["access","correction","deletion","export","withdraw_consent"]);
export const STATES=Object.freeze(["submitted","fixture_verified","under_review","human_review","approved","simulated_complete"]);
export const RELEASE_BLOCKERS=Object.freeze([
 "real_customer_auth_and_reverification",
 "legally_approved_notices_and_dpdp_review",
 "server_enforced_tenant_rls",
 "durable_audit_and_retention",
 "secure_delivery_and_data_discovery",
 "exception_handling_and_human_privacy_officer",
 "independent_vapt_and_owner_approval"
]);
const TYPE_TEAM=Object.freeze({access:"operations",correction:"operations",export:"operations",deletion:"privacy_officer",withdraw_consent:"privacy_officer"});
const deny=code=>Object.freeze({ok:false,code});
const exact=(x,keys)=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const oneOf=(choices,x)=>typeof x==="string"&&choices.includes(x);
const safeCopy=(x)=>Object.freeze({...x});
const nextAllowed=(status,action,type)=>({
 submitted:[],
 fixture_verified:["start_review"],
 under_review:["request_human_review",...(type==="deletion"||type==="withdraw_consent"?[]:["owner_approve"])],
 human_review:["owner_approve"],approved:["simulate_complete"],simulated_complete:[]
}[status]||[]).includes(action);
export function createPrivacyRequestsSandbox(role){
 if(!oneOf(ROLES,role))throw Error("verified_admin_role_required");
 let sequence=0,revision=0,eventSequence=0;
 let cases=[],audit=[];
 const canWrite=()=>role!=="auditor";
 const inScope=c=>role!=="operator"||c.team==="operations";
 const canAct=c=>canWrite()&&inScope(c);
 function record(id,action,from,to,team){
  audit.push(Object.freeze({event_no:++eventSequence,request_id:id,action,from:from??null,to:to??null,
   team,actor_role:role,synthetic_only:true}));
 }
 function snapshot(){
  return Object.freeze({
   ok:true,role,version:PRIVACY_VERSION,notice_version:PRIVACY_NOTICE_VERSION,
   mode:"synthetic_only",storage:"memory_only",legal_consent_verified:false,
   real_identity_verified:false,customer_data_accessed:false,real_requests:0,
   real_exports:0,real_deletions:0,real_consent_updates:0,notifications_sent:0,
   requests:Object.freeze(cases.filter(inScope).slice()),
   audit:Object.freeze(audit.filter(x=>role!=="operator"||x.team==="operations").slice()),
   release_blockers:RELEASE_BLOCKERS,production_enabled:false,
   rights_enabled:false,permissions:Object.freeze({create:canWrite(),review:canWrite(),approve:role==="owner",reset:role==="owner",production:false})
  });
 }
 function create(input){
  if(!canWrite())return deny("read_only_role");
  if(!exact(input,["mode","subject_fixture","request_type","notice_version","privacy_acknowledged"])||
   input.mode!=="synthetic_only"||!oneOf(FIXTURE_SUBJECTS,input.subject_fixture)||
   !oneOf(REQUEST_TYPES,input.request_type)||input.notice_version!==PRIVACY_NOTICE_VERSION||
   input.privacy_acknowledged!==true)return deny("invalid_fixed_fixture_input");
  if(role==="operator"&&TYPE_TEAM[input.request_type]!=="operations")return deny("out_of_scope");
  if(cases.length>=12)return deny("demo_capacity_reached");
  const item=Object.freeze({
   id:"SYN-PRIV-"+String(++sequence).padStart(3,"0"),subject_fixture:input.subject_fixture,
   request_type:input.request_type,team:TYPE_TEAM[input.request_type],
   status:"submitted",revision:++revision,privacy_notice_version:PRIVACY_NOTICE_VERSION,
   privacy_acknowledgement_only:true,identity_simulation_passed:false,preview_issued:false
  });
  cases.push(item);record(item.id,"synthetic_request_created",null,item.status,item.team);
  return Object.freeze({ok:true,request:item});
 }
 function find(id){
  if(typeof id!=="string"||!/^SYN-PRIV-\d{3}$/.test(id))return null;
  const c=cases.find(x=>x.id===id);
  return c&&inScope(c)?c:null;
 }
 function update(previous,changes,action){
  const now=Object.freeze({...previous,...changes,revision:++revision});
  cases=cases.map(c=>c.id===now.id?now:c);
  record(now.id,action,previous.status,now.status,now.team);
  return Object.freeze({ok:true,request:now});
 }
 function verifyFixture(input){
  if(!canWrite())return deny("read_only_role");
  if(!exact(input,["request_id","fixture_subject","simulation_marker","expected_revision"]))
   return deny("invalid_fixed_fixture_input");
  const c=find(input.request_id);
  if(!c)return deny("not_found_or_out_of_scope");
  if(!Number.isSafeInteger(input.expected_revision)||c.revision!==input.expected_revision)return deny("stale_revision");
  if(c.status!=="submitted")return deny("invalid_transition");
  // Deliberately not real identity verification, OTP, KYC or proof-of-ownership.
  if(input.simulation_marker!=="fictional_match_only"||input.fixture_subject!==c.subject_fixture)
   return deny("fixture_subject_mismatch");
  return update(c,{status:"fixture_verified",identity_simulation_passed:true},"fictional_fixture_match");
 }
 function transition(input){
  if(!canWrite())return deny("read_only_role");
  if(!exact(input,["request_id","action","expected_revision"]))return deny("invalid_fixed_choice_input");
  const c=find(input.request_id);
  if(!c)return deny("not_found_or_out_of_scope");
  if(!Number.isSafeInteger(input.expected_revision)||c.revision!==input.expected_revision)return deny("stale_revision");
  if(!oneOf(["start_review","request_human_review","owner_approve","simulate_complete"],input.action)||
   !nextAllowed(c.status,input.action,c.request_type))return deny("invalid_transition");
  if(!c.identity_simulation_passed)return deny("fixture_verification_required");
  if(input.action==="owner_approve"&&role!=="owner")return deny("owner_only_approval");
  if(input.action==="simulate_complete"&&role!=="owner")return deny("owner_only_completion");
  if(input.action==="simulate_complete"&&["access","export"].includes(c.request_type)&&!c.preview_issued)
   return deny("fictional_preview_required");
  const target={
   start_review:"under_review",request_human_review:"human_review",
   owner_approve:"approved",simulate_complete:"simulated_complete"
  }[input.action];
  return update(c,{status:target},"fictional_"+input.action);
 }
 function preview(input){
  if(role!=="owner")return deny("owner_only_preview");
  if(!exact(input,["request_id","fixture_subject","expected_revision"]))return deny("invalid_fixed_choice_input");
  const c=find(input.request_id);
  if(!c)return deny("not_found_or_out_of_scope");
  if(!Number.isSafeInteger(input.expected_revision)||c.revision!==input.expected_revision)return deny("stale_revision");
  if(!["access","export"].includes(c.request_type)||c.status!=="approved")
   return deny("preview_not_permitted");
  if(!c.identity_simulation_passed||input.fixture_subject!==c.subject_fixture)return deny("fixture_subject_mismatch");
  if(c.preview_issued)return deny("preview_already_issued");
  const data=Object.freeze({
   schema:"vorvan.synthetic_privacy_preview.v1",mode:"synthetic_only",request_id:c.id,
   fixture_subject:c.subject_fixture,notice_version:PRIVACY_NOTICE_VERSION,
   fictional_profile:"training_placeholder",fictional_consent:"demo_acknowledgement_only",
   fictional_records:0,production_data_included:false
  });
  const result=update(c,{preview_issued:true},"fictional_preview_viewed");
  return Object.freeze({ok:true,request:result.request,preview:data});
 }
 function reset(){
  if(role!=="owner")return deny("owner_only_reset");
  cases=[];audit=[];sequence=0; // revision counter NEVER resets within a session
  return Object.freeze({ok:true,erased_in_memory:true});
 }
 const requestProduction=()=>deny("production_privacy_processing_locked");
 return Object.freeze({snapshot,create,verifyFixture,transition,preview,reset,requestProduction});
}
