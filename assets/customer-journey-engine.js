/** VORVAN customer-first journey — offline demo only.
 * Fictional persons, OTP, bureau-style score and loan categories.
 * NEVER accepts personal details or contacts CIBIL, banks, Supabase, payment or storage.
 */
export const JOURNEY_VERSION="customer-demo-v1-20261111";
export const DEMO_PASSCODE="246810";
export const FIXTURES=Object.freeze([
 Object.freeze({id:"demo_salaried",name:"Aarav Sample",phone:"9000000000",email:"aarav@invalid.example",
  occupation:"Salaried employee (fictional)",working:"Full-time · Demo services",score:662,score_band:"needs_attention",
  caption:"Illustrative overdue and credit-utilisation learning example",loan_types:Object.freeze(["personal","education","short_term"])}),
 Object.freeze({id:"demo_business",name:"Mira Sample",phone:"9111111111",email:"mira@invalid.example",
  occupation:"Self-employed (fictional)",working:"Business owner · Demo trading",score:748,score_band:"good",
  caption:"Illustrative good-history credit-learning example",loan_types:Object.freeze(["business","personal","education","short_term"])})
]);
export const CATEGORIES=Object.freeze([
 Object.freeze({id:"personal",label:"Personal Loan",description:"Personal expenses and planned repayments"}),
 Object.freeze({id:"business",label:"Business Loan",description:"Working capital and business financing"}),
 Object.freeze({id:"education",label:"Education Loan",description:"Tuition and eligible study-related expenses"}),
 Object.freeze({id:"short_term",label:"Short-Term Loan",description:"Short-tenure credit and repayment considerations"})
]);
export const ISSUES=Object.freeze([
 Object.freeze({id:"unknown_account",name:"Loan or card I do not recognise",next:"Compare lender account details with your bureau report, then use the lender/bureau official dispute route."}),
 Object.freeze({id:"incorrect_overdue",name:"Wrong overdue or DPD",next:"Collect repayment confirmations and statements, then raise a correction with the reporting lender or bureau."}),
 Object.freeze({id:"closed_account",name:"Closed loan still appears active",next:"Check closure/NOC documents and ask the lender/bureau to verify reporting and update dates."}),
 Object.freeze({id:"identity_mismatch",name:"Personal details do not match",next:"Review identity details and request correction through the bureau/lender's official verified process."}),
 Object.freeze({id:"not_matched",name:"Expected loan category is missing",next:"Check documented income, repayment capacity, purpose and any lender criteria; a score alone does not establish eligibility."})
]);
export const GUIDE_PLANS=Object.freeze([
 Object.freeze({id:"guide_3m",months:3,label:"CIBIL Guide · 3 months",price:"Not for sale · Preview"}),
 Object.freeze({id:"guide_6m",months:6,label:"CIBIL Guide · 6 months",price:"Not for sale · Preview"})
]);
export const ROADMAP=Object.freeze([
 Object.freeze({day:30,title:"Understand",action:"Review reported accounts, repayment history and enquiries. Note anything you believe is inaccurate."}),
 Object.freeze({day:60,title:"Strengthen",action:"Set due-date reminders and review available steps to lower revolving credit utilisation."}),
 Object.freeze({day:90,title:"Review",action:"Recheck updates through an authorised bureau, if available, and reassess next steps without expecting a guaranteed score change."})
]);
const allowed=(list,id)=>typeof id==="string"&&list.some(x=>x.id===id);
const deny=code=>Object.freeze({ok:false,code});
const exact=(v,keys)=>v!==null&&typeof v==="object"&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype&&
 Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export function createCustomerJourney(){
 let fixture=null,stage="profile",verification=false,scoreViewed=false,plan=null,issue=null,loanCategory=null;
 const snapshot=()=>Object.freeze({
  stage,version:JOURNEY_VERSION,mode:"fictional_browser_only",fictional_profile:fixture,
  verified_demo:verification,score_viewed:scoreViewed,
  selected_guide:plan,issue_preview:issue,loan_category:loanCategory,
  actual_credit_score:false,actual_otp_sent:false,real_profile_collected:false,profile_persisted:false,
  real_bureau_requests:0,real_loan_offers:0,real_applications:0,real_subscriptions:0,
  support_case_submitted:false,network_requests:0,permissions:Object.freeze({
   financial_services:false,real_identity_verification:false,customer_profile_collection:false,expert_support:false
  })
 });
 function begin(input){
  if(stage!=="profile")return deny("reset_before_new_demo");
  if(!exact(input,["mode","fixture_id","training_acknowledged"])||input.mode!=="fictional_browser_only"||
    !allowed(FIXTURES,input.fixture_id)||input.training_acknowledged!==true)return deny("fictional_demo_only");
  fixture=FIXTURES.find(x=>x.id===input.fixture_id);stage="verify";
  return Object.freeze({ok:true,stage});
 }
 function verify(input){
  if(stage!=="verify")return deny("stage_verification_required");
  if(!exact(input,["mode","demo_passcode"])||input.mode!=="fictional_browser_only"||
    input.demo_passcode!==DEMO_PASSCODE)return deny("demo_code_required");
  verification=true;stage="score";return Object.freeze({ok:true,stage,real_otp_sent:false});
 }
 function reveal(){
  if(stage!=="score"||!verification)return deny("demo_verification_required");
  scoreViewed=true;stage="guide";
  return Object.freeze({ok:true,stage,simulated_score:fixture.score,not_cibil:true});
 }
 function selectGuide(input){
  if(!scoreViewed||!["guide","loans","issue"].includes(stage))return deny("score_first");
  if(!exact(input,["plan_id"])||!allowed(GUIDE_PLANS,input.plan_id))return deny("unknown_preview_plan");
  plan=GUIDE_PLANS.find(x=>x.id===input.plan_id);
  stage="guide";
  return Object.freeze({ok:true,plan,charged:false,subscription_created:false});
 }
 function viewLoans(){
  if(!scoreViewed||!verification)return deny("score_first");
  stage="loans";return Object.freeze({ok:true,stage,eligible:false,real_offers:0});
 }
 function chooseCategory(input){
  if(stage!=="loans")return deny("score_first");
  if(!exact(input,["category_id"])||!allowed(CATEGORIES,input.category_id))return deny("unknown_category");
  loanCategory=CATEGORIES.find(x=>x.id===input.category_id);
  const scoreMeetsDemoRule=fixture.score>=700;
  const sampleCategoryMatch=fixture.loan_types.includes(loanCategory.id);
  const canExplore=scoreMeetsDemoRule&&sampleCategoryMatch;
  const reason=!scoreMeetsDemoRule?"Demo score below the illustrative 700 learning threshold; review CIBIL Guide.":
    !sampleCategoryMatch?"This fictional work profile does not include this category in the demo. Real lenders evaluate income, purpose, repayment and documentation.":
    "Illustrative category only; no lender has reviewed this case. Credit scores alone never guarantee offers.";
  return Object.freeze({ok:true,category:loanCategory,can_explore_demo:canExplore,
   reason,real_offer:false,application_enabled:false});
 }
 function reportIssue(input){
  if(!scoreViewed||!["guide","loans","issue"].includes(stage))return deny("score_first");
  if(!exact(input,["issue_id"])||!allowed(ISSUES,input.issue_id))return deny("unknown_fixed_issue");
  issue=ISSUES.find(x=>x.id===input.issue_id);stage="issue";
  return Object.freeze({ok:true,issue,record_created:false,expert_assigned:false,notification_sent:false});
 }
 function restart(){
  fixture=null;stage="profile";verification=false;scoreViewed=false;plan=null;issue=null;loanCategory=null;
  return Object.freeze({ok:true,cleared_in_memory:true});
 }
 return Object.freeze({snapshot,begin,verify,reveal,selectGuide,viewLoans,chooseCategory,reportIssue,restart});
}
