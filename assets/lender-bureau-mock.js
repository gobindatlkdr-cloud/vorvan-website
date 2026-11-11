/** VORVAN M4 VOR-018 — OFFLINE lender/bureau integration CONTRACT SIMULATOR.
 * No network calls, real bureau scores, users, PAN, Aadhaar, KYC, lender offers or keys.
 * These invented organizations and outcomes cannot enable loan decisions/disbursal.
 * Caller role is supplied only after the existing server-verified company Admin AAL2 ACL gate.
 */
import {NOTICE_VERSION} from "./vyn-coach-notices.js";
export const ADAPTER_VERSION="m4-vor018-offline-fixture-20261111-v1";
export const DEMO_NOTICE_VERSION=NOTICE_VERSION;
export const ROLES=Object.freeze(["owner","operator","auditor"]);
export const CATEGORIES=Object.freeze(["personal","business","education","short_term"]);
export const SCENARIOS=Object.freeze([
 Object.freeze({id:"illustrative_complete",label:"Invented complete learning file",bureau_state:"simulated_complete",score_band:"illustrative_700_plus",status_code:200}),
 Object.freeze({id:"illustrative_low",label:"Invented lower-score learning file",bureau_state:"simulated_complete",score_band:"illustrative_below_700",status_code:200}),
 Object.freeze({id:"illustrative_incomplete",label:"Invented incomplete learning file",bureau_state:"missing_fields",score_band:"not_available",status_code:422}),
 Object.freeze({id:"illustrative_outage",label:"Invented provider-unavailable response",bureau_state:"provider_unavailable",score_band:"not_available",status_code:503})
]);
export const PARTNER_CONTRACTS=Object.freeze([
 Object.freeze({id:"DEMO-LENDER-ALPHA",name:"Fictional Lender Alpha",categories:Object.freeze(["personal","business","education"]),
  transport:"offline_fixture_only",api_contract:"sandbox.v1",credential_state:"none",real_partner:false}),
 Object.freeze({id:"DEMO-LENDER-BETA",name:"Fictional Lender Beta",categories:Object.freeze(["personal","short_term"]),
  transport:"offline_fixture_only",api_contract:"sandbox.v1",credential_state:"none",real_partner:false})
]);
export const BUREAU_CONTRACT=Object.freeze({
 id:"DEMO-BUREAU",name:"Fictional Bureau",api_contract:"sandbox.v1",
 transport:"offline_fixture_only",credential_state:"none",personal_records:0,real_bureau:false
});
export const RELEASE_GATES=Object.freeze([
 "signed_direct_lender_lsp_contract_and_authorized_api_scope",
 "approved_bureau_access_contract_and_lawful_purpose",
 "customer_identity_and_explicit_legal_consent",
 "server_enforced_tenant_rbac_and_data_minimization",
 "secure_provider_credentials_hosted_server_side",
 "audit_retention_privacy_and_dispute_handling",
 "provider_sandbox_certification_vapt_and_owner_legal_signoff"
]);
const has=(arr,x)=>typeof x==="string"&&arr.includes(x);
const exact=(x,keys)=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const denied=code=>Object.freeze({ok:false,code});
const resultFor=(partner,scenario,category)=>{
 const ok=scenario.status_code===200;
 return Object.freeze({
  schema:"vorvan.mock_adapters.v1",source:"fixed_offline_fixture",partner_id:partner.id,
  bureau_id:BUREAU_CONTRACT.id,category,scenario_id:scenario.id,
  http_status_simulated:scenario.status_code,
  bureau_status:scenario.bureau_state,score_band:scenario.score_band,
  underwriting:"not_performed",eligibility:"not_determined",
  lender_offer_count:0,real_score_available:false,real_credit_report_available:false,
  loan_application_created:false,amount_offered_paise:0,approval:false,
  response_kind:ok?"fictional_contract_response":scenario.status_code===422?"fictional_validation_error":"fictional_provider_outage"
 });
};
export function createLenderBureauMockSandbox(role){
 if(!has(ROLES,role))throw Error("verified_admin_role_required");
 let sequence=0,revision=0,auditSequence=0;
 let calls=[],audit=[];
 const visible=c=>role!=="operator"||c.partner_id==="DEMO-LENDER-ALPHA";
 const canInvoke=()=>role!=="auditor";
 function record(call,action,oldStatus,newStatus){
  audit.push(Object.freeze({event_no:++auditSequence,call_id:call.id,
   partner_id:call.partner_id,action,from:oldStatus??null,to:newStatus??null,
   actor_role:role,fictional_only:true}));
 }
 function snapshot(){
  const viewed=calls.filter(visible);
  const good=viewed.filter(x=>x.status==="mock_success").length;
  const bad=viewed.filter(x=>x.status==="mock_invalid").length;
  const unavailable=viewed.filter(x=>x.status==="mock_unavailable").length;
  return Object.freeze({
   ok:true,mode:"synthetic_only",role,version:ADAPTER_VERSION,notice_version:DEMO_NOTICE_VERSION,
   partners:Object.freeze(PARTNER_CONTRACTS.filter(x=>role!=="operator"||x.id==="DEMO-LENDER-ALPHA")),
   bureau:BUREAU_CONTRACT,scenarios:SCENARIOS,categories:CATEGORIES,
   calls:Object.freeze(viewed.slice()),audit:Object.freeze(audit.filter(x=>role!=="operator"||x.partner_id==="DEMO-LENDER-ALPHA").slice()),
   metrics:Object.freeze({fictional_calls:viewed.length,mock_success:good,mock_validation_error:bad,mock_unavailable:unavailable,
    simulated_retries:viewed.reduce((acc,x)=>acc+x.retry_count,0),real_bureau_hits:0,real_lender_hits:0,real_disbursals:0}),
   release_gates:RELEASE_GATES,production_enabled:false,real_identity_verified:false,
   legal_consent_verified:false,real_bureau_data_received:false,
   actual_provider_requests:0,notifications_sent:0,server_writes:0,storage:"memory_only",
   permissions:Object.freeze({invoke:canInvoke(),retry:canInvoke(),reset:role==="owner",production:false})
  });
 }
 function invoke(input){
  if(!canInvoke())return denied("read_only_role");
  if(!exact(input,["mode","partner_id","scenario_id","category","notice_version","demo_consent_acknowledged","identity_fixture"])||
    input.mode!=="synthetic_only"||input.notice_version!==DEMO_NOTICE_VERSION||
    input.demo_consent_acknowledged!==true||input.identity_fixture!=="fictional_subject_only")
   return denied("fixed_training_consent_and_identity_required");
  const p=PARTNER_CONTRACTS.find(x=>x.id===input.partner_id);
  const sc=SCENARIOS.find(x=>x.id===input.scenario_id);
  if(!p||!sc||!has(CATEGORIES,input.category))return denied("unknown_fixed_contract");
  if(role==="operator"&&p.id!=="DEMO-LENDER-ALPHA")return denied("out_of_scope");
  if(!p.categories.includes(input.category))return denied("category_out_of_contract");
  if(calls.length>=10)return denied("demo_capacity_reached");
  const response=resultFor(p,sc,input.category);
  const status=sc.status_code===200?"mock_success":sc.status_code===422?"mock_invalid":"mock_unavailable";
  const next=Object.freeze({id:"SYN-API-"+String(++sequence).padStart(3,"0"),
   partner_id:p.id,scenario_id:sc.id,category:input.category,status,revision:++revision,
   retry_count:0,max_retries:1,notice_version:DEMO_NOTICE_VERSION,
   demo_consent_acknowledged:true,identity_fixture:"fictional_subject_only",
   response,synthetic_only:true});
  calls.push(next);record(next,"fictional_adapter_called",null,status);
  return Object.freeze({ok:true,call:next});
 }
 function retry(input){
  if(!canInvoke())return denied("read_only_role");
  if(!exact(input,["mode","call_id","expected_revision"]))return denied("invalid_fixed_retry");
  if(input.mode!=="synthetic_only"||typeof input.call_id!=="string"||
    !/^SYN-API-\d{3}$/.test(input.call_id)||!Number.isSafeInteger(input.expected_revision))
   return denied("invalid_fixed_retry");
  const old=calls.find(x=>x.id===input.call_id);
  if(!old||!visible(old))return denied("not_found_or_out_of_scope");
  if(input.expected_revision!==old.revision)return denied("stale_revision");
  if(old.status!=="mock_unavailable"||old.retry_count>=old.max_retries)return denied("retry_not_available");
  // Fixed deterministic second 503 response, no timers and no provider network request.
  const current=Object.freeze({...old,retry_count:old.retry_count+1,revision:++revision});
  calls=calls.map(x=>x.id===current.id?current:x);
  record(current,"fictional_provider_outage_retry",old.status,current.status);
  return Object.freeze({ok:true,call:current,network_requests:0});
 }
 function reset(){
  if(role!=="owner")return denied("owner_only_reset");
  calls=[];audit=[];
  // Preserve IDs and revisions to avoid stale fabricated event replay in this browser session.
  return Object.freeze({ok:true,erased_in_memory:true});
 }
 const requestProductionAccess=()=>denied("immutable_production_provider_gates");
 return Object.freeze({snapshot,invoke,retry,reset,requestProductionAccess});
}
