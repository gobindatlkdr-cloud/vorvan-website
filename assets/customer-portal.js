/** VORVAN live customer contact/enquiry portal.
 * Email-authenticated Supabase RLS, contact data only. Sample scores are offline fiction.
 * Login tokens exist only in page memory. No secret credentials, bureau, lender or payment APIs.
 */
import {createCustomerJourney,FIXTURES,CATEGORIES,GUIDE_PLANS,ROADMAP,ISSUES,DEMO_PASSCODE}
 from "./customer-journey-engine.js";
const API="https://kukfpsqujlutlgwndplh.supabase.co";
const PUB="sb_publishable_6KyGNqt8CGNlE8vCBdtalA_Ayhfo-Rj";
const CONSENT="contact_enquiry_v1_2026_11_11";
const root=document.getElementById("customer-portal");
const state={token:"",user:null,profile:null,enquiries:[],phase:"login",view:"score",
 email:"",otpRequested:false,busy:false,engine:createCustomerJourney(),
 issueResult:null,selectedCategory:null,demoFixture:"demo_salaried",lastError:""};
const show=(tag,text="",cls="")=>{
 const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;
};
const add=(node,...children)=>{node.append(...children);return node};
const button=(name,fn,cls="cp-button")=>{
 const n=show("button",name,cls);n.type="button";n.addEventListener("click",fn);return n;
};
const feedback=show("p","","cp-feedback");feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
const notice=(s)=>show("p",s,"cp-note");
const details=(label,val)=>add(show("div","","cp-details-item"),show("span",label),show("strong",val));
const picker=(label,options)=>{
 const select=show("select");select.setAttribute("aria-label",label);
 for(const [value,name] of options){const option=show("option",name);option.value=value;select.append(option)}
 if(options.length)select.value=options[0][0];return select;
};
const field=(label,input)=>add(show("label","","cp-field"),show("span",label),input);
function input(type,placeholder,maxLength=120){
 const x=show("input");x.type=type;x.placeholder=placeholder;x.maxLength=maxLength;
 x.autocomplete=type==="email"?"email":type==="tel"?"tel":"off";return x;
}
const busy=(yes)=>{state.busy=yes};
function explain(message){feedback.textContent=message}
function fail(err,defaultText="This action could not be completed. Try again."){
 const code=err?.code||err?.message||"";
 if(/rate limit|over_email_send_rate_limit|429|frequency/i.test(code))explain("Too many email requests. Please try again later.");
 else if(/invalid.*otp|otp_expired|token.*expired/i.test(code))explain("The verification code is invalid or expired. Request a new email.");
 else if(/duplicate|23505/i.test(code))explain("This entry already exists. Refresh your customer dashboard.");
 else if(/row.*security|42501|permission denied/i.test(code))explain("Security rules prevented this action. Please sign in again and contact support if it continues.");
 else explain(defaultText);
}
function authHeaders(withToken=false){
 const h={apikey:PUB,"content-type":"application/json",accept:"application/json"};
 if(withToken&&state.token)h.authorization="Bearer "+state.token;
 return h;
}
async function request(url,method="GET",payload=null,requiresAuth=true){
 if(requiresAuth&&!state.token)throw {code:"auth_required"};
 const headers=authHeaders(requiresAuth);
 if(payload!==null&&url.startsWith("/rest/v1/"))headers.prefer="return=representation";
 const res=await fetch(API+url,{method,headers,cache:"no-store",
  body:payload===null?undefined:JSON.stringify(payload)});
 const text=await res.text();
 let data;
 try{data=text?JSON.parse(text):null}catch{data=null}
 if(!res.ok)throw {code:data?.code||data?.error_code||data?.msg||data?.message||"remote_error",status:res.status};
 return data;
}
function sessionClear(){
 state.token="";state.user=null;state.profile=null;state.enquiries=[];
 state.phase="login";state.view="score";state.otpRequested=false;
 state.engine=createCustomerJourney();state.issueResult=null;state.selectedCategory=null;state.demoFixture="demo_salaried";
 state.lastError="";
}
async function requestLogin(email){
 const normalized=email.trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)||normalized.length>254){
  explain("Enter a valid email address.");return;
 }
 if(state.busy)return;
 busy(true);
 try{
  const target=encodeURIComponent("https://vorvan.co.in/customer.html");
  await request("/auth/v1/otp?redirect_to="+target,"POST",{email:normalized,create_user:true},false);
  state.email=normalized;state.otpRequested=true;
  explain("Verification request accepted. Check your email for a login link or code. Delivery depends on the email provider.");
  draw();
 }catch(err){fail(err,"Unable to request an email login right now.");}
 finally{busy(false)}
}
async function verifyCode(code){
 if(state.busy)return;
 if(!/^\d{6}$/.test(code)){explain("Enter the six-digit code if your email contains one, or use the login link.");return}
 busy(true);
 try{
  const data=await request("/auth/v1/verify","POST",{email:state.email,token:code,type:"email"},false);
  if(!data?.access_token)throw {code:"no_session"};
  state.token=data.access_token;
  await bootstrap();
 }catch(err){fail(err,"Email verification could not be completed. Please use the link or request a new code.");}
 finally{busy(false)}
}
async function bootstrap(){
 const user=await request("/auth/v1/user");
 if(!user||typeof user.id!=="string"||!user.email||
   !(user.email_confirmed_at||user.confirmed_at))throw {code:"unverified_email"};
 state.user={id:user.id,email:user.email};
 const profiles=await request("/rest/v1/vorvan_customer_intake_profiles?user_id=eq."+
  encodeURIComponent(user.id)+"&select=user_id,full_name,email,phone,work_category,work_details,consent_version,consent_accepted_at&limit=1");
 state.profile=Array.isArray(profiles)&&profiles.length?profiles[0]:null;
 state.phase=state.profile?"dashboard":"profile";
 if(state.profile)await loadEnquiries();
 draw();
}
async function loadEnquiries(){
 if(!state.user)return;
 const data=await request("/rest/v1/vorvan_customer_enquiries?user_id=eq."+
  encodeURIComponent(state.user.id)+"&select=id,loan_category,enquiry_topic,message,status,staff_reply,created_at,updated_at&order=created_at.desc&limit=30");
 state.enquiries=Array.isArray(data)?data:[];
}
async function logout(){
 const tok=state.token;
 sessionClear();draw();
 if(tok)await fetch(API+"/auth/v1/logout",{method:"POST",
   headers:{apikey:PUB,authorization:"Bearer "+tok},cache:"no-store"}).catch(()=>{});
}
function loginScreen(area){
 area.append(add(show("div","","cp-panel-head"),show("span","STEP 01 / SECURE ACCESS","cp-eyebrow"),
  show("h3","Start with your email"),show("p","We verify your email before collecting and saving your personal contact or work information.")));
 const form=show("form","","cp-form");const email=input("email","you@example.com",254);
 email.required=true;email.value=state.email;
 form.append(field("Email address",email));
 const send=show("button","Email my login link or code →","cp-button");send.type="submit";
 form.append(send);form.addEventListener("submit",event=>{event.preventDefault();requestLogin(email.value)});
 area.append(form);
 if(state.otpRequested){
  const codeForm=show("form","","cp-form cp-otp");
  codeForm.append(show("p","If the email includes a six-digit code, enter it here. Otherwise click the sign-in link in your email."));
  const code=input("text","Six-digit email code",6);
  code.inputMode="numeric";code.autocomplete="one-time-code";code.pattern="[0-9]{6}";
  codeForm.append(field("Email verification code",code));
  const submit=show("button","Verify my email →","cp-button");submit.type="submit";
  codeForm.append(submit);codeForm.addEventListener("submit",e=>{e.preventDefault();verifyCode(code.value)});
  area.append(codeForm);
 }
 area.append(notice("Your login is email-verified. Phone OTP is not currently enabled; do not submit passwords, PAN, Aadhaar, bank account details or credit reports. Sessions are held in memory and end when this page is reloaded."));
}
function profileScreen(area){
 area.append(add(show("div","","cp-panel-head"),show("span","STEP 02 / CUSTOMER PROFILE","cp-eyebrow"),
  show("h3",state.profile?"Update your contact details":"Tell us a little about yourself"),
  show("p","Save your verified contact details and working information so the VORVAN team can follow up on enquiries. No CIBIL score is stored.")));
 const form=show("form","","cp-form cp-profile-form");
 const name=input("text","Your full name",100);name.required=true;name.minLength=2;
 const email=show("input");email.type="email";email.value=state.user.email;email.disabled=true;
 const phone=input("tel","10-digit Indian mobile",10);phone.required=true;phone.inputMode="tel";phone.pattern="[6-9][0-9]{9}";
 const work=picker("Employment or work category",[
  ["salaried","Salaried employee"],["self_employed","Self-employed / Business"],["student","Student"],
  ["homemaker","Homemaker"],["other","Other"]
 ]);
 const detailsInput=input("text","Occupation, job type or business activity (not salary)",160);
 detailsInput.required=true;detailsInput.minLength=3;
 const previously=state.profile;
 if(previously){name.value=previously.full_name;phone.value=previously.phone;
  work.value=previously.work_category;detailsInput.value=previously.work_details}
 const emailWrap=field("Verified email (cannot be edited here)",email);
 const consent=show("input");consent.type="checkbox";consent.id="cp-consent";consent.required=!previously;
 const label=show("label","I agree that VORVAN PRIVATE LIMITED may securely store my name, verified email, self-reported phone and working information to manage my enquiries and contact me about them. No credit score or lender data is collected.");
 label.setAttribute("for","cp-consent");
 form.append(field("Full name",name),emailWrap,field("Mobile number (self-reported; not SMS verified)",phone),
  field("Employment category",work),field("Work / occupation details",detailsInput));
 if(!previously)form.append(add(show("div","","cp-consent"),consent,label));
 const save=show("button",previously?"Update profile →":"Save profile & continue →","cp-button");save.type="submit";form.append(save);
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(state.busy)return;
  if(!previously&&!consent.checked){explain("Please read and accept the contact/enquiry privacy consent.");return}
  const payload={full_name:name.value.trim(),phone:phone.value.trim(),work_category:work.value,
    work_details:detailsInput.value.trim()};
  if(payload.full_name.length<2||payload.full_name.length>100||
    !/^[6-9]\d{9}$/.test(payload.phone)||payload.work_details.length<3||
    payload.work_details.length>160){explain("Please complete all profile fields using valid values.");return}
  busy(true);
  try{
   if(previously){
    const result=await request("/rest/v1/vorvan_customer_intake_profiles?user_id=eq."+
     encodeURIComponent(state.user.id)+"&select=user_id,full_name,email,phone,work_category,work_details,consent_version,consent_accepted_at",
     "PATCH",payload);
    if(!Array.isArray(result)||result.length!==1)throw {code:"profile_update_conflict"};
    state.profile=result[0];
   }else{
    const result=await request("/rest/v1/vorvan_customer_intake_profiles?select="+
     "user_id,full_name,email,phone,work_category,work_details,consent_version,consent_accepted_at",
     "POST",{...payload,user_id:state.user.id,email:state.user.email,consent_version:CONSENT});
    if(!Array.isArray(result)||result.length!==1)throw {code:"profile_insert_failed"};
    state.profile=result[0];
   }
   state.phase="dashboard";state.view="score";draw();
   explain("Your contact profile was saved in the secure database. It is visible to authorized owner staff.");
  }catch(err){fail(err,"Your profile could not be saved securely. Nothing else was submitted.");}
  finally{busy(false)}
 });
 area.append(form,notice("Contact and occupation data are used for enquiry follow-up, not for live credit scoring or automatic lender marketing. View the Privacy Notice for correction/deletion requests."));
}
function ensureDemo(){
 if(!state.profile)return;
 const demo=state.engine.snapshot();
 if(demo.score_viewed)return;
 state.engine.restart();
 const fixture=state.demoFixture; // User-selected fictional training scenario; NEVER derived from saved customer data.
 const started=state.engine.begin({mode:"fictional_browser_only",fixture_id:fixture,training_acknowledged:true});
 if(!started.ok)return;
 state.engine.verify({mode:"fictional_browser_only",demo_passcode:DEMO_PASSCODE});
 state.engine.reveal();
}
function scorePanel(area){
 const header=add(show("div","","cp-panel-head"),show("span","STEP 03 / CREDIT AWARENESS","cp-eyebrow"),
  show("h3","Credit score comes before loan choices"),
  show("p","Real CIBIL data is not connected. The score below belongs to a fictional example and does not reflect your personal financial history."));
 area.append(header);
 const scenarios=show("div","","cp-scenario-switch");
 scenarios.append(show("p","Choose a fictional training example. These scores are never calculated from your saved profile and never stored."));
 for(const [id,label] of [["demo_salaried","Example A · 662 (guide first)"],["demo_business","Example B · 748 (explore categories)"]]){
  const item=button(label,()=>{
   if(state.demoFixture===id)return;
   state.demoFixture=id;state.engine.restart();state.issueResult=null;state.selectedCategory=null;
   draw();explain("Fictional example changed. No personal credit data was accessed.");
  },"cp-scenario-choice"+(state.demoFixture===id?" is-active":""));
  item.setAttribute("aria-pressed",String(state.demoFixture===id));scenarios.append(item);
 }
 area.append(scenarios);
 const s=state.engine.snapshot();
 if(!s.score_viewed){
  area.append(add(show("div","","cp-start-score"),show("span","NO CREDIT BUREAU LOOKUP","cp-kicker"),
   show("h4","Explore the fictional score journey"),
   show("p","See how a score, credit issues and CIBIL Guide could appear after a future authorised bureau integration.")));
  area.append(button("Continue to fictional score →",()=>{ensureDemo();draw();
   explain("Illustrative score displayed. No CIBIL bureau data was fetched or stored.")}));
  return;
 }
 const score=s.fictional_profile.score; // This is independent of the authenticated customer and never stored.
 const visual=show("div","","cp-score-layout");
 visual.append(add(show("div","","cp-score-ring"),show("span","FICTIONAL SCORE"),show("strong",String(score)),
   show("small","Example / 900 · Not a bureau score")));
 visual.append(add(show("div","","cp-score-message"),show("span","ILLUSTRATIVE CREDIT HEALTH","cp-kicker"),
  show("h4",score>=700?"Example: Good credit band":"Example: Credit needs attention"),
  show("p",s.fictional_profile.caption),show("p",score>=700?
    "An illustrative 700+ score could lead to reviewing possible categories. Lenders still assess income, policy and documentation.":
    "This invented example is below 700. Start with a learning guide, review potential reporting issues and plan improvements."),
  show("small","No actual eligibility decision, lender offer or credit report exists.")));
 area.append(visual);
 const controls=show("div","","cp-actions");
 controls.append(button("Open CIBIL Guide →",()=>{state.view="guide";draw()}),
  button("Explore loan categories →",()=>{state.view="loans";draw()},"cp-button cp-secondary"),
  button("Report an issue (demo) →",()=>{state.view="issues";draw()},"cp-button cp-secondary"));
 area.append(controls);
}
function guidePanel(area){
 ensureDemo();
 area.append(add(show("div","","cp-panel-head"),show("span","STEP 04 / CIBIL GUIDE","cp-eyebrow"),
  show("h3","Learn your credit improvement path"),
  show("p","Educational explanations, issue reporting examples and a 30/60/90-day plan. No guaranteed score rise or paid service.")));
 const planGroup=show("div","","cp-guide-grid");
 for(const plan of GUIDE_PLANS){
  const card=show("article","","cp-guide-card");
  card.append(show("span","PREVIEW PLAN","cp-kicker"),show("h4",plan.label),
   show("p",plan.months===3?"A focused three-month learning journey.":"A longer six-month education and review journey."),
   show("strong","Preview only · Not for sale"));
  card.append(button("Preview this plan",()=>{
   const res=state.engine.selectGuide({plan_id:plan.id});
   if(res.ok){state.view="guide";draw();explain("Guide duration selected as an educational preview. No payment or subscription created.");}
  },"cp-button cp-secondary"));
  planGroup.append(card);
 }
 area.append(planGroup);
 if(state.engine.snapshot().selected_guide)area.append(notice(
  "Selected: "+state.engine.snapshot().selected_guide.label+". This selection is not charged and is not stored in your customer database."));
 area.append(show("h4","Your 90-day educational roadmap"));
 const road=show("div","","cp-roadmap");
 for(const step of ROADMAP){
  road.append(add(show("article","","cp-roadmap-step"),show("span","DAY "+step.day,"cp-kicker"),
   show("h5",step.title),show("p",step.action)));
 }
 area.append(road);
 area.append(button("See report issues →",()=>{state.view="issues";draw()},"cp-button cp-secondary"));
}
function issuesPanel(area){
 ensureDemo();
 area.append(add(show("div","","cp-panel-head"),show("span","ISSUE SUPPORT / EDUCATIONAL PREVIEW","cp-eyebrow"),
  show("h3","Something seems wrong on your credit report?"),
  show("p","Choose a common issue to see helpful steps. No actual bureau dispute or expert assignment is created here.")));
 const select=picker("Example report issue",ISSUES.map(x=>[x.id,x.name]));
 area.append(field("Choose an issue",select),button("Show suggested solution →",()=>{
  const r=state.engine.reportIssue({issue_id:select.value});
  if(r.ok){state.issueResult=r.issue;draw();explain("Educational steps only; no support case was filed.");}
 }));
 if(state.issueResult)area.append(add(show("div","","cp-solution"),show("span","SUGGESTED NEXT STEPS","cp-kicker"),
  show("h4",state.issueResult.name),show("p",state.issueResult.next),
  show("p","For a real incorrect credit entry, use the concerned lender/credit bureau's verified dispute process. VORVAN does not currently provide an authorised dispute-filing service.")));
 area.append(button("Ask us an information question →",()=>{state.view="loans";draw()},"cp-button cp-secondary"));
}
function loanPanel(area){
 ensureDemo();
 area.append(add(show("div","","cp-panel-head"),show("span","STEP 05 / LOAN INFORMATION ENQUIRY","cp-eyebrow"),
  show("h3","Which loan are you exploring?"),
  show("p","You can ask about Personal, Business, Education or Short-Term Loan. The form is a real enquiry to VORVAN, not a loan application, approval or lender referral.")));
 const demo=state.engine.snapshot();
 const educational=show("div","","cp-example-outcome");
 const sample=demo.fictional_profile;
 if(sample){
  const low=sample.score<700;
  educational.append(show("span","ILLUSTRATIVE CATEGORY EXPLANATION","cp-kicker"),
   show("h4",low?"Example below 700: learning plan before offers":"Example 700+: categories can be explored"),
   show("p",low?
    "This fictional score indicates a learning-first path. Choose a CIBIL Guide preview; no real lender offer or personal eligibility is inferred.":
    "The fictional 700+ example can explore category explanations. A score alone never determines lender eligibility, approval or an offer."));
  if(low)educational.append(button("Review 3/6-month CIBIL Guide →",()=>{state.view="guide";draw()},"cp-button cp-secondary"));
  area.append(educational);
 }
 const categoryGrid=show("div","","cp-loans");
 for(const category of CATEGORIES){
  const isActive=state.selectedCategory===category.id;
  const b=button(category.label+" ↗",()=>{state.selectedCategory=category.id;draw();
   explain("Loan information category selected. Complete the secure enquiry form below.");},
   "cp-loan-choice"+(isActive?" is-active":""));
  let illustration=null;
  if(state.engine.snapshot().score_viewed){
   state.engine.viewLoans();
   illustration=state.engine.chooseCategory({category_id:category.id});
  }
  const label=illustration?.ok?illustration.can_explore_demo?
   "Illustrative category match · No real offer":"Guide / review needed · No real offer":"Informational category";
  const box=add(show("article","","cp-loan-card"),
   show("span",label,"cp-kicker"),show("h4",category.label),
   show("p",category.description),b);
  if(illustration?.ok)box.append(show("p",illustration.reason,"cp-loan-explanation"));
  categoryGrid.append(box);
 }
 area.append(categoryGrid);
 area.append(notice("The category explanations above use fictional scores only. You may send a genuine information enquiry for any loan category; VORVAN does not decide eligibility or send it to a lender."));
 const option=picker("Loan information category",CATEGORIES.map(c=>[c.id,c.label]));
 option.value=state.selectedCategory||"personal";
 const topic=picker("Type of information request",[
  ["loan_information","General loan information"],["eligibility_question","Eligibility information"],
  ["report_issue","Credit report / score education"],["documents","Documentation question"],["other","Other information enquiry"]
 ]);
 const msg=show("textarea");msg.maxLength=300;msg.rows=3;
 msg.placeholder="Optional short question. Do not include PAN, Aadhaar, OTP, bank account, date of birth or salary details.";
 const consent=show("input");consent.type="checkbox";consent.id="cp-enquiry-agree";consent.required=true;
 const label=show("label","Please contact me regarding this non-binding enquiry. I understand VORVAN has not submitted a loan application or received lender approval.");
 label.setAttribute("for","cp-enquiry-agree");
 const form=show("form","","cp-enquiry-form");
 form.append(field("Select loan category",option),field("What would you like to know?",topic),
  field("Your question (optional, maximum 300 characters)",msg),
  add(show("div","","cp-consent"),consent,label));
 const send=show("button","Submit loan information enquiry →","cp-button");send.type="submit";form.append(send);
 form.addEventListener("submit",async e=>{
  e.preventDefault();if(state.busy)return;
  const value=msg.value.trim();
  if(!consent.checked){explain("Please acknowledge the non-binding enquiry conditions.");return;}
  if(value.length>300||/[<>\x00-\x1f]/.test(value)||
    /[0-9]{12}|[A-Z]{5}[0-9]{4}[A-Z]/i.test(value)){
   explain("Please remove sensitive numbers, PAN, Aadhaar or markup from your question.");return;
  }
  busy(true);
  try{
   const saved=await request("/rest/v1/vorvan_customer_enquiries?select=id,loan_category,enquiry_topic,status,created_at",
    "POST",{user_id:state.user.id,loan_category:option.value,enquiry_topic:topic.value,message:value});
   if(!Array.isArray(saved)||saved.length!==1)throw {code:"not_saved"};
   state.view="requests";state.selectedCategory=null;
   await loadEnquiries();draw();
   explain("Enquiry saved securely. Reference: "+saved[0].id+". VORVAN will review it manually; no loan application has been made.");
  }catch(err){fail(err,"Unable to submit this enquiry securely. Please try again.");}
  finally{busy(false)}
 });
 area.append(form,notice("Your selected demo score never affects this real enquiry. Any future lender matching requires separate approvals, accurate information, and your specific consent."));
}
function requestsPanel(area){
 area.append(add(show("div","","cp-panel-head"),show("span","YOUR ENQUIRIES","cp-eyebrow"),
  show("h3","Track your information requests"),show("p","Your enquiries are saved in the secure database. Owner staff may update their manual review status and write a response.")));
 const refresh=button("Refresh my enquiries",async()=>{
  try{await loadEnquiries();draw();explain("Enquiry statuses refreshed.");}catch(e){fail(e,"Could not refresh enquiries.");}
 },"cp-button cp-secondary");
 area.append(refresh);
 if(!state.enquiries.length){area.append(notice("No enquiries submitted yet. Select a loan category to ask for information."));return;}
 const items=show("div","","cp-requests");
 for(const q of state.enquiries){
  const category=CATEGORIES.find(x=>x.id===q.loan_category)?.label||"Loan enquiry";
  const x=add(show("article","","cp-request-card"),show("span",category+" · "+q.status.replaceAll("_"," "),"cp-kicker"),
    show("h4",q.enquiry_topic.replaceAll("_"," ")),
    show("p",q.message||"No additional message"),show("small","Reference: "+q.id+" · "+new Date(q.created_at).toLocaleDateString()));
  if(q.staff_reply)x.append(add(show("div","","cp-staff-response"),show("strong","VORVAN manual response"),show("p",q.staff_reply)));
  items.append(x);
 }
 area.append(items);
}
function dashboard(area){
 const top=show("div","","cp-session");
 top.append(add(show("div"),show("span","VERIFIED EMAIL · PROFILE SAVED","cp-kicker"),
   show("h3","Welcome, "+state.profile.full_name),show("p",state.profile.email+" · Phone is self-reported")));
 top.append(button("Sign out",logout,"cp-button cp-secondary"));
 area.append(top);
 const nav=show("nav","","cp-tabs");nav.setAttribute("aria-label","Customer journey");
 const tabs=[["score","Score preview"],["guide","CIBIL Guide"],["issues","Credit issues"],["loans","Loan enquiry"],["requests","My enquiries"],["profile","My details"]];
 for(const [id,name] of tabs){
  const x=button(name,()=>{if(!state.engine.snapshot().score_viewed&&["guide","issues","loans"].includes(id)){state.view="score";draw();explain("View the fictional score example first, then continue to CIBIL Guide or loan enquiries.");return;}state.view=id;draw()},"cp-tab"+(state.view===id?" is-active":""));
  if(state.view===id)x.setAttribute("aria-current","page");nav.append(x);
 }
 area.append(nav);
 const section=show("section","","cp-journey-panel");
 if(state.view==="profile"){
  state.phase="profile";draw();return;
 }
 if(state.view==="score")scorePanel(section);
 else if(state.view==="guide")guidePanel(section);
 else if(state.view==="issues")issuesPanel(section);
 else if(state.view==="loans")loanPanel(section);
 else if(state.view==="requests")requestsPanel(section);
 area.append(section);
}
function draw(){
 if(!root)return;
 root.replaceChildren();
 const area=show("div","","cp-app-inner");
 if(state.phase==="login")loginScreen(area);
 else if(state.phase==="profile")profileScreen(area);
 else dashboard(area);
 area.append(feedback);root.append(area);
}
async function start(){
 try{
  const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
  const error=hash.get("error");
  if(hash.has("access_token")){
   const value=hash.get("access_token");
   window.history.replaceState(null,"",window.location.pathname);
   if(value&&value.length<4100){state.token=value;await bootstrap();return;}
  }
  if(error){
   window.history.replaceState(null,"",window.location.pathname);
   draw();explain("The email sign-in link could not be verified. Please request another.");
   return;
  }
 }catch{/* User can request a fresh email if callback is unusable */}
 draw();
}
start();
