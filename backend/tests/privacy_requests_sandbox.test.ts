/** VOR-016 real synthetic privacy lifecycle contract tests. No customer identities or production data. */
import {createPrivacyRequestsSandbox,PRIVACY_VERSION,PRIVACY_NOTICE_VERSION,PRIVACY_NOTICES,
 FIXTURE_SUBJECTS,REQUEST_TYPES,RELEASE_BLOCKERS} from "../../assets/privacy-requests-sandbox.js";
import {NOTICE_VERSION,NOTICES} from "../../assets/vyn-coach-notices.js";
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+" expected "+String(b)+" got "+String(a));}
function yes(value:unknown,label="assert"){if(!value)throw Error(label);}
type Desk=ReturnType<typeof createPrivacyRequestsSandbox>;
const make=(role="owner")=>createPrivacyRequestsSandbox(role);
const fixture=(request_type="access",subject_fixture="fixture_alpha")=>({
 mode:"synthetic_only",subject_fixture,request_type,notice_version:PRIVACY_NOTICE_VERSION,privacy_acknowledged:true
});
function create(d:Desk,type="access",subject="fixture_alpha"){
 const r=d.create(fixture(type,subject));if(!r.ok||!("request" in r))throw Error("fictional creation failed");
 return r.request;
}
function verify(d:Desk,id:string,subject="fixture_alpha"){
 const c=d.snapshot().requests.find((x:unknown)=>x&&typeof x==="object"&&(x as {id:string}).id===id);
 if(!c)throw Error("missing fictional case");
 return d.verifyFixture({request_id:id,fixture_subject:subject,simulation_marker:"fictional_match_only",expected_revision:c.revision});
}
function action(d:Desk,id:string,next:string){
 const c=d.snapshot().requests.find((x:unknown)=>x&&typeof x==="object"&&(x as {id:string}).id===id);
 if(!c)throw Error("missing fictional case");
 return d.transition({request_id:id,action:next,expected_revision:c.revision});
}
function advanceOwner(d:Desk,id:string){
 yes(verify(d,id).ok,"verify");yes(action(d,id,"start_review").ok,"review");
}
Deno.test("Canonical VOR-006 privacy notices preserved without claiming legal consent",()=>{
 eq(PRIVACY_NOTICE_VERSION,NOTICE_VERSION);eq(PRIVACY_NOTICES.en,NOTICES.privacy_acknowledgement.en);
 eq(PRIVACY_NOTICES.bn,NOTICES.privacy_acknowledgement.bn);
 eq(PRIVACY_NOTICES.hi,NOTICES.privacy_acknowledgement.hi);
 const s=make().snapshot();eq(s.legal_consent_verified,false);eq(s.real_identity_verified,false);
});
Deno.test("Five fixed rights categories, two fictional subjects and locked production",()=>{
 eq(REQUEST_TYPES.length,5);eq(FIXTURE_SUBJECTS.length,2);
 eq(RELEASE_BLOCKERS.length,7);eq(make().snapshot().version,PRIVACY_VERSION);
 for(const t of REQUEST_TYPES){const d=make();const r=d.create(fixture(t));eq(r.ok,true,t);}
});
Deno.test("Untrusted roles and customer/anonymous sessions cannot instantiate Admin desk",()=>{
 for(const role of ["customer","unknown","viewer","",null,undefined,{}]){
  let blocked=false;try{createPrivacyRequestsSandbox(role as string);}catch{blocked=true;}
  yes(blocked,"unverified role rejected");
 }
});
Deno.test("Submitting requires exact fixed fields, canonical notice and acknowledgement",()=>{
 const d=make();
 for(const bad of [
  {...fixture(),name:"Real Customer"},{...fixture(),email:"x@example.invalid"},
  {...fixture(),phone:"9999999999"},{...fixture(),notes:"Aadhaar details"},
  {...fixture(),pan:"ABCDE1234F"},{...fixture(),identity_document:"demo"},
  {...fixture(),consent_token:"real"}, {...fixture(),mode:"production"},
  {...fixture(),request_type:"profile_download"},{...fixture(),subject_fixture:"actual_user_id"},
  {...fixture(),notice_version:"unapproved-old"},{...fixture(),privacy_acknowledged:false},
  {...fixture(),privacy_acknowledged:"true"},null,{},[], "free text"
 ])eq(d.create(bad as never).ok,false,"privacy-restricted input");
 eq(d.snapshot().requests.length,0);eq(d.snapshot().audit.length,0);
});
Deno.test("Owner demo can intake all five categories with fictional IDs, memory-only",()=>{
 const d=make();for(const type of REQUEST_TYPES)eq(d.create(fixture(type)).ok,true);
 const s=d.snapshot();eq(s.requests.length,5);eq(s.audit.length,5);
 eq(s.requests[0].id,"SYN-PRIV-001");eq(s.storage,"memory_only");
 for(const c of s.requests){eq(c.privacy_acknowledgement_only,true);eq(c.identity_simulation_passed,false);eq(c.status,"submitted");}
 eq(s.customer_data_accessed,false);eq(s.real_requests,0);eq(s.real_exports,0);eq(s.real_deletions,0);
});
Deno.test("Operator may intake non-destructive operations rights, not deletion or withdrawal",()=>{
 const d=make("operator");
 for(const t of ["access","correction","export"])eq(d.create(fixture(t)).ok,true);
 for(const t of ["deletion","withdraw_consent"])eq(d.create(fixture(t)).ok,false);
 eq(d.snapshot().requests.length,3);eq(d.snapshot().permissions.approve,false);
});
Deno.test("Operator's scoped queue and audit hide owner privacy-officer category",()=>{
 const o=make();create(o,"deletion");
 const a=make("operator");eq(a.snapshot().requests.length,0);eq(a.snapshot().audit.length,0);
 const guess=a.verifyFixture({request_id:"SYN-PRIV-001",fixture_subject:"fixture_alpha",simulation_marker:"fictional_match_only",expected_revision:1});
 eq(guess.ok,false);
});
Deno.test("Auditor reads synthetic data but cannot create, verify, review, preview, reset",()=>{
 const d=make("auditor");
 eq(d.create(fixture()).ok,false);
 eq(d.verifyFixture({request_id:"SYN-PRIV-001",fixture_subject:"fixture_alpha",simulation_marker:"fictional_match_only",expected_revision:1}).ok,false);
 eq(d.transition({request_id:"SYN-PRIV-001",action:"start_review",expected_revision:1}).ok,false);
 eq(d.preview({request_id:"SYN-PRIV-001",fixture_subject:"fixture_alpha",expected_revision:1}).ok,false);
 eq(d.reset().ok,false);eq(d.snapshot().permissions.create,false);
});
Deno.test("Fictional subject mismatch cannot be treated as identity verification",()=>{
 const d=make(),c=create(d,"access","fixture_beta");
 eq(verify(d,c.id,"fixture_alpha").ok,false);
 eq(d.snapshot().requests[0].identity_simulation_passed,false);
 eq(d.snapshot().audit.length,1);
});
Deno.test("Verification requires exact simulation marker, expected revision and schema",()=>{
 const d=make(),c=create(d);
 for(const bad of [
  {request_id:c.id,fixture_subject:"fixture_alpha",simulation_marker:"production_verified",expected_revision:c.revision},
  {request_id:c.id,fixture_subject:"fixture_alpha",simulation_marker:"fictional_match_only",expected_revision:c.revision,email:"x@example.invalid"},
  {request_id:c.id,fixture_subject:"fixture_alpha",simulation_marker:"fictional_match_only",expected_revision:0},
  {request_id:c.id,fixture_subject:"fixture_alpha",simulation_marker:"fictional_match_only",expected_revision:"1"},
  {}
 ])eq(d.verifyFixture(bad as never).ok,false);
 eq(verify(d,c.id).ok,true);eq(verify(d,c.id).ok,false);
});
Deno.test("Forbidden status skips and unsupported actions fail closed before verification",()=>{
 const d=make(),c=create(d);
 for(const next of ["start_review","owner_approve","simulate_complete","delete_customer","approve_real_request"]){
  eq(action(d,c.id,next).ok,false,next);
 }
 eq(d.snapshot().requests[0].status,"submitted");
});
Deno.test("Verified fictional request must be reviewed before owner approval",()=>{
 const d=make(),c=create(d);
 yes(verify(d,c.id).ok,"fixture");eq(action(d,c.id,"owner_approve").ok,false);
 yes(action(d,c.id,"start_review").ok,"review");
 eq(d.snapshot().requests[0].status,"under_review");
});
Deno.test("Sensitive deletion requires human-review branch and owner action",()=>{
 for(const type of ["deletion","withdraw_consent"]){
  const d=make(),c=create(d,type);
  advanceOwner(d,c.id);
  eq(action(d,c.id,"owner_approve").ok,false);
  yes(action(d,c.id,"request_human_review").ok,"human review");
  eq(d.snapshot().requests[0].status,"human_review");
  yes(action(d,c.id,"owner_approve").ok,"owner approval");
  yes(action(d,c.id,"simulate_complete").ok,"complete simulation");
  eq(d.snapshot().requests[0].status,"simulated_complete");
  eq(d.snapshot().real_deletions,0);eq(d.snapshot().real_consent_updates,0);
 }
});
Deno.test("Access/export may complete only after owner-issued fixed invented preview",()=>{
 for(const type of ["access","export"]){
  const d=make(),c=create(d,type);
  advanceOwner(d,c.id);yes(action(d,c.id,"owner_approve").ok,"approve");
  eq(action(d,c.id,"simulate_complete").ok,false);
  const current=d.snapshot().requests[0];
  const r=d.preview({request_id:c.id,fixture_subject:"fixture_alpha",expected_revision:current.revision});
  eq(r.ok,true);if(!r.ok||!("preview" in r))throw Error("missing preview");
  eq(r.preview.mode,"synthetic_only");eq(r.preview.fictional_records,0);eq(r.preview.production_data_included,false);
  eq(d.snapshot().real_exports,0);
  yes(action(d,c.id,"simulate_complete").ok,"finish demo");
 }
});
Deno.test("Export preview denies premature, wrong subject, unsupported type, extra fields and replay",()=>{
 const d=make(),c=create(d,"export","fixture_beta");
 let r=d.preview({request_id:c.id,fixture_subject:"fixture_beta",expected_revision:c.revision});eq(r.ok,false);
 yes(verify(d,c.id,"fixture_beta").ok,"fixture");
 yes(action(d,c.id,"start_review").ok,"review");
 yes(action(d,c.id,"owner_approve").ok,"approve");
 const rev=d.snapshot().requests[0].revision;
 eq(d.preview({request_id:c.id,fixture_subject:"fixture_alpha",expected_revision:rev}).ok,false);
 eq(d.preview({request_id:c.id,fixture_subject:"fixture_beta",expected_revision:rev,notes:"sensitive"} as never).ok,false);
 yes(d.preview({request_id:c.id,fixture_subject:"fixture_beta",expected_revision:rev}).ok,"preview");
 eq(d.preview({request_id:c.id,fixture_subject:"fixture_beta",expected_revision:rev}).ok,false);
 eq(d.snapshot().requests[0].preview_issued,true);
});
Deno.test("Owner can complete correction case with no export or actual record edit",()=>{
 const d=make(),c=create(d,"correction");
 advanceOwner(d,c.id);yes(action(d,c.id,"owner_approve").ok,"approve");
 yes(action(d,c.id,"simulate_complete").ok,"completion");
 eq(d.snapshot().customer_data_accessed,false);eq(d.snapshot().real_requests,0);
});
Deno.test("Strict transitions use optimistic revisions; stale replay cannot change audit",()=>{
 const d=make(),c=create(d);
 const verified=verify(d,c.id);yes(verified.ok,"verify");
 const bad=d.transition({request_id:c.id,action:"start_review",expected_revision:c.revision});
 eq(bad.ok,false);
 eq(d.snapshot().audit.length,2);
 yes(action(d,c.id,"start_review").ok,"correct version");
 eq(d.snapshot().audit.length,3);
});
Deno.test("Audit events and case snapshots frozen, chronological, role-only, no PII",()=>{
 const d=make(),c=create(d);advanceOwner(d,c.id);
 const s=d.snapshot();eq(s.audit.length,3);
 for(let i=0;i<s.audit.length;i++){eq(s.audit[i].event_no,i+1);yes(Object.isFrozen(s.audit[i]),"frozen event");}
 yes(Object.isFrozen(s.requests[0]),"frozen case");yes(Object.isFrozen(s.requests),"frozen list");
 const str=JSON.stringify(s).toLowerCase();
 for(const key of ['"email"','"phone"','"pan"','"aadhaar"','"borrower"','"loan_account"'])
  yes(!str.includes(key),"no personal field "+key);
});
Deno.test("Bounded case intake rejects 13th fictional request",()=>{
 const d=make();
 for(let i=0;i<12;i++)yes(d.create(fixture()).ok,"within bound");
 eq(d.create(fixture()).ok,false);eq(d.snapshot().requests.length,12);
});
Deno.test("Owner reset erases audit/cases; revisions remain monotonic",()=>{
 const d=make(),c=create(d);yes(verify(d,c.id).ok,"verify");
 const before=d.snapshot().requests[0].revision;
 yes(d.reset().ok,"reset");eq(d.snapshot().requests.length,0);eq(d.snapshot().audit.length,0);
 const again=create(d);yes(again.revision>before,"monotonic revision");
 eq(again.id,"SYN-PRIV-001");
});
Deno.test("No role can enable real privacy processing or data export",()=>{
 for(const role of ["owner","operator","auditor"]){
  const d=make(role);eq(d.requestProduction().ok,false);
  const s=d.snapshot();eq(s.production_enabled,false);eq(s.rights_enabled,false);
  eq(s.real_exports,0);eq(s.real_deletions,0);eq(s.customer_data_accessed,false);
 }
});
Deno.test("Fictional workflow never calls network; no credential or storage accesses",()=>{
 const prev=globalThis.fetch;let count=0;
 globalThis.fetch=(()=>{count++;throw Error("no network allowed")}) as typeof fetch;
 try{
  const d=make(),c=create(d,"access");advanceOwner(d,c.id);
  yes(action(d,c.id,"owner_approve").ok,"approved");
  const rev=d.snapshot().requests[0].revision;
  yes(d.preview({request_id:c.id,fixture_subject:"fixture_alpha",expected_revision:rev}).ok,"preview");
  eq(count,0);eq(d.snapshot().notifications_sent,0);
 }finally{globalThis.fetch=prev;}
});
