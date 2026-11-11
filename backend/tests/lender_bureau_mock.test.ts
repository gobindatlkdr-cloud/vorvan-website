/** VOR-018: actual offline lender/bureau contract, data-boundary and RBAC tests. */
import {createLenderBureauMockSandbox,PARTNER_CONTRACTS,BUREAU_CONTRACT,SCENARIOS,CATEGORIES,
 RELEASE_GATES,DEMO_NOTICE_VERSION,ADAPTER_VERSION} from "../../assets/lender-bureau-mock.js";
import {NOTICE_VERSION} from "../../assets/vyn-coach-notices.js";
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+" got "+String(a)+" expected "+String(b));}
function yes(a:unknown,label="assert"){if(!a)throw Error(label);}
type Desk=ReturnType<typeof createLenderBureauMockSandbox>;
const open=(role="owner")=>createLenderBureauMockSandbox(role);
const input=(partner_id="DEMO-LENDER-ALPHA",scenario_id="illustrative_complete",category="personal")=>({
 mode:"synthetic_only",partner_id,scenario_id,category,notice_version:DEMO_NOTICE_VERSION,
 demo_consent_acknowledged:true,identity_fixture:"fictional_subject_only"
});
function run(d:Desk, partner="DEMO-LENDER-ALPHA",scenario="illustrative_complete",category="personal"){
 const z=d.invoke(input(partner,scenario,category));
 if(!z.ok||!("call" in z))throw Error("unexpected fictional invoke failure");
 return z.call;
}
Deno.test("Two fully fictional lender contracts, one bureau and four response scenarios",()=>{
 eq(PARTNER_CONTRACTS.length,2);eq(BUREAU_CONTRACT.id,"DEMO-BUREAU");
 eq(BUREAU_CONTRACT.real_bureau,false);eq(BUREAU_CONTRACT.personal_records,0);
 eq(SCENARIOS.length,4);eq(CATEGORIES.length,4);eq(RELEASE_GATES.length,7);
 for(const p of PARTNER_CONTRACTS){
  eq(p.real_partner,false);eq(p.credential_state,"none");eq(p.transport,"offline_fixture_only");
  yes(Object.isFrozen(p),"immutable lender");yes(Object.isFrozen(p.categories),"immutable categories");
 }
});
Deno.test("Consent notice reuses canonical draft version but never asserts real consent",()=>{
 const s=open().snapshot();eq(s.version,ADAPTER_VERSION);
 eq(DEMO_NOTICE_VERSION,NOTICE_VERSION);
 eq(s.legal_consent_verified,false);eq(s.real_identity_verified,false);
 eq(s.real_bureau_data_received,false);eq(s.actual_provider_requests,0);
});
Deno.test("Only server-approved Admin demo role accepted; customer and unknown fail",()=>{
 for(const role of ["customer","viewer","guest","","broker",null,undefined,{}]){
  let failed=false;try{createLenderBureauMockSandbox(role as string);}catch{failed=true;}
  yes(failed,"role blocked");
 }
});
Deno.test("Strict consent/identity fields block real PAN, Aadhaar, free text, keys and URLs",()=>{
 const d=open();
 for(const bad of [
  {...input(),name:"Real borrower"},{...input(),pan:"ABCDE1234F"},
  {...input(),aadhaar:"123412341234"},{...input(),phone:"9999999999"},
  {...input(),email:"any@example.invalid"},{...input(),bureau_api_key:"secret"},
  {...input(),access_token:"secret"},{...input(),url:"https://example.invalid"},
  {...input(),cibil_score:750},{...input(),loan_amount:100000},
  {...input(),mode:"production"},{...input(),notice_version:"old"},
  {...input(),demo_consent_acknowledged:false},{...input(),identity_fixture:"real_account"},
  null,[],{},"free form"
 ])eq(d.invoke(bad as never).ok,false,"insecure payload");
 eq(d.snapshot().calls.length,0);eq(d.snapshot().audit.length,0);
});
Deno.test("Unknown fixed provider/scenario/category denied before logging",()=>{
 const d=open();
 for(const bad of [
  input("REAL-BANK"),input("DEMO-BUREAU"),input("DEMO-LENDER-ALPHA","not_a_scenario"),
  input("DEMO-LENDER-ALPHA","illustrative_complete","gold_loan")
 ])eq(d.invoke(bad).ok,false);
 eq(d.snapshot().metrics.fictional_calls,0);
});
Deno.test("Partner-specific contract categories fail closed for forbidden route",()=>{
 const d=open();
 eq(d.invoke(input("DEMO-LENDER-BETA","illustrative_complete","education")).ok,false);
 eq(d.invoke(input("DEMO-LENDER-ALPHA","illustrative_complete","short_term")).ok,false);
 eq(d.snapshot().calls.length,0);
});
Deno.test("Both allowed fictional provider/category contract paths return safe no-offer response",()=>{
 const d=open();
 const a=run(d,"DEMO-LENDER-ALPHA","illustrative_complete","education");
 const b=run(d,"DEMO-LENDER-BETA","illustrative_low","short_term");
 eq(a.response.http_status_simulated,200);eq(b.response.http_status_simulated,200);
 eq(a.response.loan_application_created,false);eq(b.response.underwriting,"not_performed");
 eq(a.response.eligibility,"not_determined");eq(a.response.lender_offer_count,0);
 eq(b.response.real_credit_report_available,false);eq(b.response.approval,false);
 eq(b.response.amount_offered_paise,0);eq(d.snapshot().metrics.real_disbursals,0);
});
Deno.test("Illustrative score bands are not actual CIBIL scores",()=>{
 const d=open();const a=run(d,"DEMO-LENDER-ALPHA","illustrative_complete");
 const b=run(d,"DEMO-LENDER-ALPHA","illustrative_low");
 eq(a.response.score_band,"illustrative_700_plus");eq(b.response.score_band,"illustrative_below_700");
 eq(a.response.real_score_available,false);eq(b.response.real_score_available,false);
 eq(a.response.real_credit_report_available,false);eq(b.response.real_credit_report_available,false);
});
Deno.test("Incomplete fixture creates simulated 422 with no eligibility or loan offer",()=>{
 const d=open();const c=run(d,"DEMO-LENDER-ALPHA","illustrative_incomplete");
 eq(c.status,"mock_invalid");eq(c.response.http_status_simulated,422);
 eq(c.response.bureau_status,"missing_fields");eq(c.response.score_band,"not_available");
 eq(d.snapshot().metrics.mock_validation_error,1);
});
Deno.test("Provider outage produces 503 then one bounded local retry still offline",()=>{
 const d=open();const a=run(d,"DEMO-LENDER-ALPHA","illustrative_outage");
 eq(a.status,"mock_unavailable");eq(a.response.http_status_simulated,503);
 const z=d.retry({mode:"synthetic_only",call_id:a.id,expected_revision:a.revision});
 eq(z.ok,true);eq(d.snapshot().calls[0].retry_count,1);
 eq(d.snapshot().metrics.simulated_retries,1);eq(d.snapshot().metrics.mock_unavailable,1);
 eq(d.snapshot().actual_provider_requests,0);
 eq(d.retry({mode:"synthetic_only",call_id:a.id,expected_revision:d.snapshot().calls[0].revision}).ok,false);
});
Deno.test("Retry rejects unsupported status, stale revision, extra payload and fabricated IDs",()=>{
 const d=open(),good=run(d),bad=run(d,"DEMO-LENDER-ALPHA","illustrative_outage");
 const valid={mode:"synthetic_only",call_id:bad.id,expected_revision:bad.revision};
 eq(d.retry({...valid,call_id:good.id}).ok,false);
 eq(d.retry({...valid,expected_revision:bad.revision+1}).ok,false);
 eq(d.retry({...valid,payload:"PII"} as never).ok,false);
 eq(d.retry({...valid,call_id:"SIM-123"}).ok,false);
 eq(d.retry({...valid,mode:"production"}).ok,false);
 eq(d.snapshot().audit.length,2);
});
Deno.test("Owner sees both providers, operator sees Alpha only and auditor cannot mutate",()=>{
 const owner=open(),op=open("operator"),aud=open("auditor");
 eq(owner.snapshot().partners.length,2);eq(op.snapshot().partners.length,1);
 eq(op.snapshot().partners[0].id,"DEMO-LENDER-ALPHA");
 eq(op.invoke(input("DEMO-LENDER-BETA")).ok,false);
 eq(op.invoke(input("DEMO-LENDER-ALPHA")).ok,true);
 eq(aud.invoke(input()).ok,false);
 eq(aud.retry({mode:"synthetic_only",call_id:"SYN-API-001",expected_revision:1}).ok,false);
 eq(op.reset().ok,false);eq(aud.reset().ok,false);
});
Deno.test("Operator cannot forge known synthetic Beta call IDs across sessions",()=>{
 const owner=open(),a=run(owner,"DEMO-LENDER-BETA"),op=open("operator");
 const retry=op.retry({mode:"synthetic_only",call_id:a.id,expected_revision:a.revision});
 eq(retry.ok,false);eq(op.snapshot().calls.length,0);eq(op.snapshot().audit.length,0);
});
Deno.test("Returned results include only static metadata, no user PII or bureau details",()=>{
 const d=open(),a=run(d);
 yes(Object.isFrozen(a),"immutable call");yes(Object.isFrozen(a.response),"immutable result");
 const json=JSON.stringify(d.snapshot()).toLowerCase();
 for(const field of ['"pan"','"aadhaar"','"email"','"phone"','"account_number"','"customer_id"','"date_of_birth"'])
  yes(!json.includes(field),"no PII property "+field);
 eq(d.snapshot().server_writes,0);eq(d.snapshot().notifications_sent,0);
});
Deno.test("Audit metadata is immutable and monotonically incremented for success and outage retry",()=>{
 const d=open(),a=run(d,"DEMO-LENDER-ALPHA","illustrative_outage");
 d.retry({mode:"synthetic_only",call_id:a.id,expected_revision:a.revision});
 const s=d.snapshot();eq(s.audit.length,2);
 eq(s.audit[0].event_no,1);eq(s.audit[1].event_no,2);
 yes(Object.isFrozen(s.audit[0]),"frozen audit");
 eq(s.audit[1].action,"fictional_provider_outage_retry");
});
Deno.test("Ten-call memory cap denies additional requests with no new audit",()=>{
 const d=open();for(let i=0;i<10;i++)yes(d.invoke(input()).ok,"within cap");
 eq(d.invoke(input()).ok,false);eq(d.snapshot().calls.length,10);
 eq(d.snapshot().audit.length,10);
});
Deno.test("Owner reset erases in-memory history but preserves unique IDs and revisions",()=>{
 const d=open(),a=run(d);eq(a.id,"SYN-API-001");
 eq(d.reset().ok,true);eq(d.snapshot().calls.length,0);eq(d.snapshot().audit.length,0);
 const next=run(d);eq(next.id,"SYN-API-002");yes(next.revision>a.revision,"monotonic rev");
});
Deno.test("No role can enable actual CIBIL, lender APIs, loans or provider credentials",()=>{
 for(const role of ["owner","operator","auditor"]){
  const d=open(role),s=d.snapshot();
  eq(d.requestProductionAccess().ok,false);eq(s.production_enabled,false);
  eq(s.metrics.real_bureau_hits,0);eq(s.metrics.real_lender_hits,0);
  eq(s.metrics.real_disbursals,0);eq(s.actual_provider_requests,0);
  yes(s.release_gates.length===7,"7 release gates");
 }
});
Deno.test("No fetch, storage, secrets or network calls during every offline scenario",()=>{
 const prior=globalThis.fetch;let count=0;
 globalThis.fetch=(()=>{count++;throw Error("no provider network")}) as typeof fetch;
 try{
  const d=open();
  for(const scenario of SCENARIOS)yes(d.invoke(input("DEMO-LENDER-ALPHA",scenario.id)).ok,"fixture");
  const last=d.snapshot().calls[3];
  yes(d.retry({mode:"synthetic_only",call_id:last.id,expected_revision:last.revision}).ok,"retry");
  eq(count,0);eq(d.snapshot().actual_provider_requests,0);
 }finally{globalThis.fetch=prior;}
});
