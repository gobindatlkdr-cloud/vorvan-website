/** Customer-first CIBIL guide demo is never financial eligibility or a real score. */
import {createCustomerJourney,FIXTURES,ISSUES,GUIDE_PLANS,ROADMAP,CATEGORIES,DEMO_PASSCODE} from "../../assets/customer-journey-engine.js";
function eq(a:unknown,b:unknown,name="assert"){if(a!==b)throw Error(name+" got "+String(a)+" expected "+String(b));}
function yes(x:unknown,name="assert"){if(!x)throw Error(name);}
const start=(which="demo_salaried")=>{
 const d=createCustomerJourney();
 yes(d.begin({mode:"fictional_browser_only",fixture_id:which,training_acknowledged:true}).ok);
 yes(d.verify({mode:"fictional_browser_only",demo_passcode:DEMO_PASSCODE}).ok);
 return d;
};
Deno.test("Real score, profiles and CIBIL/network calls are never part of demo engine",()=>{
 const d=createCustomerJourney().snapshot();
 eq(d.real_profile_collected,false);eq(d.profile_persisted,false);
 eq(d.actual_credit_score,false);eq(d.real_bureau_requests,0);
 eq(d.real_loan_offers,0);eq(d.real_applications,0);eq(d.real_subscriptions,0);
 eq(d.permissions.customer_profile_collection,false);eq(d.permissions.financial_services,false);
});
Deno.test("Fixed fictional identity fixtures only, with no user-entered PII intake",()=>{
 const d=createCustomerJourney();
 for(const invalid of [
  {mode:"fictional_browser_only",fixture_id:"real-user-id",training_acknowledged:true},
  {mode:"fictional_browser_only",fixture_id:"demo_salaried",training_acknowledged:false},
  {mode:"fictional_browser_only",fixture_id:"demo_salaried",training_acknowledged:true,phone:"9999999999"},
  {mode:"production",fixture_id:"demo_business",training_acknowledged:true},null,{},[]
 ])eq(d.begin(invalid as never).ok,false);
 eq(d.snapshot().stage,"profile");eq(FIXTURES.length,2);
});
Deno.test("Demo flow starts with profile, then verification, then fictional score",()=>{
 const d=createCustomerJourney();
 eq(d.reveal().ok,false);eq(d.viewLoans().ok,false);
 yes(d.begin({mode:"fictional_browser_only",fixture_id:"demo_salaried",training_acknowledged:true}).ok);
 eq(d.snapshot().stage,"verify");
 eq(d.verify({mode:"fictional_browser_only",demo_passcode:"000000"}).ok,false);
 yes(d.verify({mode:"fictional_browser_only",demo_passcode:DEMO_PASSCODE}).ok);
 eq(d.snapshot().stage,"score");yes(d.reveal().ok);
 eq(d.snapshot().stage,"guide");eq(d.snapshot().score_viewed,true);
 eq(d.snapshot().actual_credit_score,false);
});
Deno.test("Illustrative low and 700+ bands never create actual lender offers",()=>{
 const low=start("demo_salaried"),high=start("demo_business");
 yes(low.reveal().ok);yes(high.reveal().ok);
 yes(low.snapshot().fictional_profile.score<700);
 yes(high.snapshot().fictional_profile.score>=700);
 yes(low.viewLoans().ok);yes(high.viewLoans().ok);
 const l=low.chooseCategory({category_id:"personal"});
 const h=high.chooseCategory({category_id:"business"});
 if(!l.ok||!h.ok)throw Error("fictional category selection unexpectedly blocked");
 eq(l.can_explore_demo,false);eq(h.can_explore_demo,true);
 eq(l.real_offer,false);eq(h.application_enabled,false);
 eq(high.snapshot().real_loan_offers,0);
});
Deno.test("Four loan categories and issue-reporting guidance are static, no records submitted",()=>{
 const d=start();yes(d.reveal().ok);
 eq(CATEGORIES.length,4);eq(ISSUES.length,5);
 for(const issue of ISSUES){
  const r=d.reportIssue({issue_id:issue.id});
  if(!r.ok)throw Error("fixed educational issue was unexpectedly blocked");
  eq(r.record_created,false);eq(r.expert_assigned,false);eq(r.notification_sent,false);
 }
 eq(d.snapshot().support_case_submitted,false);
 eq(d.reportIssue({issue_id:"actual_dispute",customer_email:"x@invalid.example"} as never).ok,false);
});
Deno.test("Three and six-month Guide plans are previews, free and never billed",()=>{
 const d=start();yes(d.reveal().ok);eq(GUIDE_PLANS.length,2);eq(ROADMAP.length,3);
 for(const plan of GUIDE_PLANS){
  const result=d.selectGuide({plan_id:plan.id});if(!result.ok)throw Error("fictional Guide option denied");
  eq(result.charged,false);eq(result.subscription_created,false);
 }
 eq(d.snapshot().real_subscriptions,0);
 eq(d.selectGuide({plan_id:"paid",payment_token:"secret"} as never).ok,false);
});
Deno.test("Score-first prevents direct loan category selection without demo education stage",()=>{
 const d=createCustomerJourney();
 eq(d.viewLoans().ok,false);eq(d.chooseCategory({category_id:"education"}).ok,false);
 const verified=start();
 eq(verified.chooseCategory({category_id:"business"}).ok,false);
 yes(verified.reveal().ok);yes(verified.viewLoans().ok);
 eq(verified.chooseCategory({category_id:"fake"}).ok,false);
 eq(verified.chooseCategory({category_id:"education"}).ok,true);
});
Deno.test("Session reset clears all invented state without browser persistence",()=>{
 const d=start();d.reveal();d.selectGuide({plan_id:"guide_3m"});
 d.reportIssue({issue_id:"unknown_account"});d.restart();
 eq(d.snapshot().stage,"profile");eq(d.snapshot().score_viewed,false);
 eq(d.snapshot().selected_guide,null);eq(d.snapshot().fictional_profile,null);
});
Deno.test("No network during fictional scores and loan matching",()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=(()=>{calls++;throw Error("network forbidden")}) as typeof fetch;
 try{
  const d=start("demo_business");d.reveal();d.selectGuide({plan_id:"guide_6m"});
  d.viewLoans();d.chooseCategory({category_id:"business"});
  eq(calls,0);eq(d.snapshot().network_requests,0);
 }finally{globalThis.fetch=old}
});
Deno.test("Public customer page has strong no-real-CIBIL, no-payment and consent disclosures",async()=>{
 const page=await Deno.readTextFile("customer.html");
 const client=await Deno.readTextFile("assets/customer-portal.js");
 const admin=await Deno.readTextFile("assets/admin.js");
 const sql=await Deno.readTextFile("backend/migrations/20261111_customer_contact_enquiry_rls.sql");
 yes(page.includes("Verified email login"),"auth experience");
 yes(page.includes("Loan Categories"),"category navigation");
 yes(page.includes("not a loan application"),"non-binding notice");
 yes(page.includes("privacy.html"),"privacy rights");
 yes(client.includes('"/auth/v1/verify"'),"email token verify");
 yes(client.includes("email_confirmed_at"),"verified email checks");
 yes(client.includes("vorvan_customer_intake_profiles"),"persist profile");
 yes(client.includes("vorvan_customer_enquiries"),"persist query");
 yes(client.includes("state.engine=createCustomerJourney()"),"no real score retrieval");
 yes(!client.includes("localStorage")&&!client.includes("sessionStorage"),"no token persistence");
 yes(!client.includes("service_role")&&!client.includes("sb_secret_"),"no browser secrets");
 yes(admin.includes('if(area==="customers"){'),"owner queue in existing admin");
 yes(admin.includes('state.role!=="owner"'),"MFA owner role");
 yes(sql.includes("row level security"),"postgres RLS");
 yes(sql.includes("auth.uid()"),"customer ownership");
 yes(!sql.includes("USING (true)"),"never public RLS");
});
