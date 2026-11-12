/** VORVAN Applicant: phone-OTP gated contact intake, then fictional CIBIL education.
 * SMS provider activation is REQUIRED. No fake OTP, financial data or passwords.
 * Sensitive records stay in verified-auth Supabase RLS and never persist in browser storage.
 */
import {createCustomerJourney,FIXTURES,CATEGORIES,GUIDE_PLANS,ROADMAP,ISSUES,DEMO_PASSCODE}
 from "./customer-journey-engine.js";
const API="https://kukfpsqujlutlgwndplh.supabase.co";
const PUB="sb_publishable_6KyGNqt8CGNlE8vCBdtalA_Ayhfo-Rj";
const CONSENT="applicant_mobile_v1_2026_11_12";
// Fail CLOSED until a real Indian DLT-compliant SMS sender is configured in Supabase Auth.
// Releasing a signup form is not permission to claim SMS delivery.
const SMS_PROVIDER_READY=false;
const PROFILE_COLS="user_id,full_name,father_name,phone,email,address_line,locality,district,state_name,postal_code,work_category,work_details,employment_subtype,employer_name,department_name,designation,business_type,business_name,consent_version,consent_accepted_at";
const root=document.getElementById("customer-portal");
const state={token:"",user:null,profile:null,enquiries:[],phase:"login",view:"score",
 mobile:"",otpRequested:false,busy:false,engine:createCustomerJourney(),
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
const picker=(label,options)=>{
 const select=show("select");select.setAttribute("aria-label",label);
 for(const [value,name] of options){const option=show("option",name);option.value=value;select.append(option)}
 if(options.length)select.value=options[0][0];return select;
};
const field=(label,control)=>add(show("label","","cp-field"),show("span",label),control);
function input(type,placeholder,maxLength=120){
 const x=show("input");x.type=type;x.placeholder=placeholder;x.maxLength=maxLength;
 x.autocomplete=type==="email"?"email":type==="tel"?"tel":"off";return x;
}
const busy=(yes)=>{state.busy=yes};
function explain(message){feedback.textContent=message}
function fail(err,defaultText="Unable to complete this action."){
 const code=String(err?.code||err?.message||"");
 if(/rate limit|over_sms_send_rate_limit|429|frequency/i.test(code))explain("Too many OTP requests. Try again after the provider's cooldown.");
 else if(/invalid.*otp|otp_expired|token.*expired/i.test(code))explain("Invalid or expired SMS OTP. Check the code and try again.");
 else if(/sms|phone.*disabled|provider|not configured/i.test(code))explain("Mobile OTP delivery has not been activated. No account/profile information was saved.");
 else if(/duplicate|23505/i.test(code))explain("This profile already exists. Sign in again.");
 else if(/row.*security|42501|permission denied/i.test(code))explain("Security rules prevented saving. Contact support if this continues.");
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
 const raw=await res.text();
 let data;try{data=raw?JSON.parse(raw):null}catch{data=null}
 if(!res.ok)throw {code:data?.code||data?.error_code||data?.msg||data?.message||"remote_error",status:res.status};
 return data;
}
function sessionClear(){
 state.token="";state.user=null;state.profile=null;state.enquiries=[];
 state.phase="login";state.view="score";state.otpRequested=false;state.mobile="";
 state.engine=createCustomerJourney();state.issueResult=null;
 state.selectedCategory=null;state.demoFixture="demo_salaried";state.lastError="";
}
function phoneNumber(value){
 const normalized=String(value||"").replace(/\s+/g,"");
 if(!/^[6-9][0-9]{9}$/.test(normalized))return null;
 return "+91"+normalized;
}
async function requestLogin(rawNumber){
 if(!SMS_PROVIDER_READY){explain("Mobile OTP activation is pending. The SMS provider and DLT sender must be configured first; no OTP has been sent.");return}
 const phone=phoneNumber(rawNumber);
 if(!phone){explain("Enter a valid 10-digit Indian mobile number.");return}
 if(state.busy)return;
 busy(true);
 try{
  await request("/auth/v1/otp","POST",{phone,create_user:true,channel:"sms"},false);
  state.mobile=phone;state.otpRequested=true;
  draw();explain("OTP request accepted by the authentication service. Please enter the code sent to your mobile; delivery is not guaranteed.");
 }catch(err){fail(err,"SMS OTP could not be requested.");}
 finally{busy(false)}
}
async function verifyCode(rawCode){
 if(!SMS_PROVIDER_READY){explain("SMS OTP authentication is currently unavailable.");return}
 if(state.busy)return;
 const code=String(rawCode||"").trim();
 if(!/^[0-9]{6}$/.test(code)||!phoneNumber(state.mobile.slice(3))){
  explain("Enter the six-digit code sent to the same verified mobile number.");return
 }
 busy(true);
 try{
  const data=await request("/auth/v1/verify","POST",{phone:state.mobile,token:code,type:"sms"},false);
  if(!data?.access_token)throw {code:"no_session"};
  state.token=data.access_token;
  await bootstrap();
 }catch(err){state.token="";fail(err,"SMS OTP verification failed.");}
 finally{busy(false)}
}
async function bootstrap(){
 // Auth /user is the only source of phone ownership; never trust a phone field typed in a form.
 const user=await request("/auth/v1/user");
 if(!user||typeof user.id!=="string"||
   !/^\+91[6-9][0-9]{9}$/.test(String(user.phone||""))||!user.phone_confirmed_at)
   throw {code:"unverified_phone"};
 state.user={id:user.id,phone:user.phone};
 const profiles=await request("/rest/v1/vorvan_customer_intake_profiles?user_id=eq."+
  encodeURIComponent(user.id)+"&select="+PROFILE_COLS+"&limit=1");
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
 area.classList.add("cp-auth-screen");
 area.append(add(show("div","","cp-login-header"),show("span","SECURE CUSTOMER ACCESS","cp-eyebrow"),
  show("h2","Applicant Login"),show("h3","Kindly Login"),
  show("p","Enter your mobile number to receive an SMS verification code. After verification, complete the Applicant Details form.")));
 const form=show("form","","cp-form cp-login-form");
 const container=show("div","","cp-phone-input");
 const code=show("span","+91","cp-country-code");
 const phone=input("tel","Enter 10-digit mobile number",10);
 phone.inputMode="numeric";phone.pattern="[6-9][0-9]{9}";phone.autocomplete="tel-national";phone.required=true;phone.value=state.mobile.slice(3);
 container.append(code,phone);
 form.append(field("Mobile Number",container));
 const send=show("button","Send OTP →","cp-button");send.type="submit";
 send.disabled=!SMS_PROVIDER_READY;
 form.append(send);
 form.addEventListener("submit",event=>{event.preventDefault();requestLogin(phone.value)});
 area.append(form);
 if(state.otpRequested){
  const otp=show("form","","cp-form cp-otp");
  otp.append(show("p","Enter the six-digit SMS OTP sent to "+state.mobile.replace(/^(\+91\d\d)\d{6}/,"$1******")+" ."));
  const codeInput=input("text","6-digit OTP",6);codeInput.inputMode="numeric";
  codeInput.autocomplete="one-time-code";codeInput.pattern="[0-9]{6}";codeInput.required=true;
  otp.append(field("Mobile OTP",codeInput));
  const verify=show("button","Verify & Continue →","cp-button");verify.type="submit";
  otp.append(verify);otp.addEventListener("submit",e=>{e.preventDefault();verifyCode(codeInput.value)});
  area.append(otp);
 }
 area.append(add(show("div","","cp-otp-state"),
  show("strong",SMS_PROVIDER_READY?"SMS OTP authentication available":"SMS OTP activation pending"),
  show("p",SMS_PROVIDER_READY?
    "Do not share OTPs or passwords. Mobile ownership is verified by the authentication provider.":
    "We are configuring a compliant SMS sender. OTP sending and applicant submission are disabled until the provider is activated. No test or fake OTP can unlock the form.")));
 area.append(notice("OTP delivery and DLT provider setup are pending. No personal profile is collected before verified mobile login. Do not enter PAN, Aadhaar, bank details, passwords or salary amounts."));
}
function profileScreen(area){
 if(!state.user)return;
 area.append(add(show("div","","cp-panel-head"),
  show("span","STEP 02 · MOBILE VERIFIED","cp-eyebrow"),
  show("h3",state.profile?"Update Applicant Details":"Applicant Details Form"),
  show("p","Your phone "+state.user.phone+" is verified. Save the following details with explicit consent before opening the credit guide or loan enquiry.")));
 const form=show("form","","cp-form cp-profile-form");
 const previous=state.profile||{};
 const textField=(caption,placeholder,max=100,value="")=>{
  const x=input("text",placeholder,max);x.value=value||"";x.required=true;x.minLength=2;
  return [field(caption,x),x];
 };
 const [nameWrap,name]=textField("Applicant Full Name","Full name",100,previous.full_name);
 const [fatherWrap,father]=textField("Father's Name","Father's full name",100,previous.father_name);
 const [addressWrap,address]=textField("Full Address","House/road/village or locality",200,previous.address_line);
 address.minLength=6;
 const [localWrap,locality]=textField("Town / Village","Town or village",80,previous.locality);
 const [districtWrap,district]=textField("District","District",80,previous.district);
 const [stateWrap,stateName]=textField("State","State",80,previous.state_name||"West Bengal");
 const pin=input("text","6-digit PIN",6);pin.inputMode="numeric";pin.required=true;pin.pattern="[1-9][0-9]{5}";pin.value=previous.postal_code||"";
 const email=input("email","Optional email ID",254);email.value=previous.email||"";
 if(state.profile){email.readOnly=true}
 const work=picker("Occupation type",[
  ["salaried","Salaried"],["self_employed","Business / Self-employed"],
  ["student","Student"],["homemaker","Homemaker"],["other","Other"]
 ]);work.value=previous.work_category||"salaried";
 const detailsInput=input("text","Brief role / profession (no salary amount)",160);
 detailsInput.minLength=3;detailsInput.required=true;detailsInput.value=previous.work_details||"";
 const employment=picker("Salaried job type",[
  ["private_company","Private Company"],["central_government","Central Government"],
  ["state_government","State Government"],["public_sector","Public Sector / PSU"],
  ["other_salaried","Other Salaried"]
 ]);employment.value=previous.employment_subtype||"private_company";
 const company=input("text","Company / employer name",140);company.value=previous.employer_name||"";
 const department=input("text","Government department",140);department.value=previous.department_name||"";
 const designation=input("text","Job title / designation",100);designation.value=previous.designation||"";
 const businessType=picker("Business category",[
  ["retail","Retail"],["services","Services"],["manufacturing","Manufacturing"],
  ["trading","Trading / Wholesale"],["professional","Professional / Freelance"],
  ["agriculture","Agriculture"],["other_business","Other Business"]
 ]);businessType.value=previous.business_type||"retail";
 const businessName=input("text","Business / firm name",140);businessName.value=previous.business_name||"";
 const salariedFields=show("div","","cp-dynamic-work");
 const companyWrap=field("Company / Employer Name",company);
 const deptWrap=field("Government Department",department);
 salariedFields.append(field("Select salaried category",employment),companyWrap,deptWrap,
   field("Designation / Post",designation));
 const businessFields=show("div","","cp-dynamic-work");
 businessFields.append(field("Type of Business",businessType),field("Business / Firm Name",businessName));
 const updateWork=()=>{
  const salaried=work.value==="salaried",biz=work.value==="self_employed";
  salariedFields.hidden=!salaried;businessFields.hidden=!biz;
  const gov=["central_government","state_government"].includes(employment.value);
  companyWrap.hidden=!salaried||gov;deptWrap.hidden=!salaried||!gov;
  company.required=salaried&&!gov;department.required=salaried&&gov;
  designation.required=salaried;businessName.required=biz;
  for(const e of [company,department,designation,employment])e.disabled=!salaried;
  for(const e of [businessType,businessName])e.disabled=!biz;
 };
 work.addEventListener("change",updateWork);employment.addEventListener("change",updateWork);
 form.append(nameWrap,fatherWrap,addressWrap,localWrap,districtWrap,stateWrap,
  field("Postal PIN Code",pin),field("Email ID (optional · not OTP verified)",email),
  field("Employment / Applicant Category",work),field("Occupation Details",detailsInput),
  salariedFields,businessFields);
 updateWork();
 const consent=show("input");consent.type="checkbox";consent.id="applicant-data-consent";
 consent.required=!state.profile;
 if(!state.profile){
  const label=show("label","I agree that VORVAN PRIVATE LIMITED may store my verified mobile, full name, father's name, contact email (if given), address and occupation details to manage my account and respond to my loan-information enquiries. I understand no CIBIL score or loan application is created.");
  label.setAttribute("for","applicant-data-consent");
  form.append(add(show("div","","cp-consent"),consent,label));
 }
 const submit=show("button",state.profile?"Save Updated Details →":"Submit Applicant Details →","cp-button");
 submit.type="submit";form.append(submit);
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(state.busy)return;
  if(!state.profile&&!consent.checked){explain("Please accept the applicant contact-data consent.");return;}
  const payload={
   full_name:name.value.trim(),father_name:father.value.trim(),
   address_line:address.value.trim(),locality:locality.value.trim(),district:district.value.trim(),
   state_name:stateName.value.trim(),postal_code:pin.value.trim(),
   work_category:work.value,work_details:detailsInput.value.trim(),
   employment_subtype:work.value==="salaried"?employment.value:null,
   employer_name:work.value==="salaried"&&!["central_government","state_government"].includes(employment.value)?company.value.trim():null,
   department_name:work.value==="salaried"&&["central_government","state_government"].includes(employment.value)?department.value.trim():null,
   designation:work.value==="salaried"?designation.value.trim():null,
   business_type:work.value==="self_employed"?businessType.value:null,
   business_name:work.value==="self_employed"?businessName.value.trim():null
  };
  const profileText=[payload.full_name,payload.father_name,payload.address_line,payload.locality,
   payload.district,payload.state_name,payload.work_details,
   payload.employer_name,payload.department_name,payload.designation,payload.business_name]
    .filter(Boolean);
  if(!/^[1-9][0-9]{5}$/.test(payload.postal_code)||profileText.some(x=>/[<>\x00-\x1f]/.test(x))||
    payload.full_name.length<2||payload.father_name.length<2||payload.address_line.length<6||
    payload.work_details.length<3||!form.checkValidity()){
    explain("Complete the applicant fields correctly. Do not include sensitive identifiers.");return;
  }
  busy(true);
  try{
   let result;
   if(state.profile){
    result=await request("/rest/v1/vorvan_customer_intake_profiles?user_id=eq."+
      encodeURIComponent(state.user.id)+"&select="+PROFILE_COLS,"PATCH",payload);
   }else{
    // Only Supabase-verified auth.user.phone is accepted. Typed phone never becomes identity.
    result=await request("/rest/v1/vorvan_customer_intake_profiles?select="+PROFILE_COLS,
      "POST",{...payload,user_id:state.user.id,
       phone:state.user.phone.slice(3),email:email.value.trim()||null,consent_version:CONSENT});
   }
   if(!Array.isArray(result)||result.length!==1)throw {code:"profile_save_failed"};
   state.profile=result[0];state.phase="dashboard";state.view="score";
   await loadEnquiries();draw();
   explain("Applicant profile securely saved. Your Owner-only VORVAN Admin queue can now view the record.");
  }catch(err){fail(err,"Unable to save Applicant Details. No loan enquiry was sent.");}
  finally{busy(false)}
 });
 area.append(form,notice("Your details are stored as contact information only, without income figures, PAN, Aadhaar or bureau scores. Use legal@vorvan.co.in to request correction or deletion. See the Privacy Notice."));
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
 top.append(add(show("div"),show("span","VERIFIED MOBILE · APPLICANT PROFILE SAVED","cp-kicker"),
   show("h3","Welcome, "+state.profile.full_name),show("p","Mobile: "+state.user.phone+" · Contact email: "+(state.profile.email||"Not provided"))));
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
 document.body.classList.toggle("cp-authenticated",state.phase!=="login");
 root.replaceChildren();
 const area=show("div","","cp-app-inner");
 if(state.phase==="login")loginScreen(area);
 else if(state.phase==="profile")profileScreen(area);
 else dashboard(area);
 area.append(feedback);root.append(area);
}
async function start(){
 // Phone OTP never authenticates from a URL fragment. No magic-link fallback.
 draw();
}
start();
