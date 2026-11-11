/** VOR-018 fictional adapter monitoring inside already verified Admin dashboard. */
import {PARTNER_CONTRACTS,SCENARIOS,DEMO_NOTICE_VERSION} from "./lender-bureau-mock.js";
export {createLenderBureauMockSandbox} from "./lender-bureau-mock.js";
const make=(tag,value="",css="")=>{const x=document.createElement(tag);x.textContent=value;if(css)x.className=css;return x;};
const pick=(label,items)=>{
 const element=make("select");element.setAttribute("aria-label",label);
 for(const [id,name] of items){const opt=make("option",name);opt.value=id;element.append(opt);}
 if(items.length)element.value=items[0][0];return element;
};
const join=(node,...children)=>{node.append(...children);return node;};
const name=x=>x.replaceAll("_"," ");
export function mountLenderBureauMockSandbox(root,engine){
 if(!root||typeof root.replaceChildren!=="function"||!engine||typeof engine.snapshot!=="function")return {ok:false};
 const first=engine.snapshot();
 if(!first.ok||first.mode!=="synthetic_only"||!["owner","operator","auditor"].includes(first.role))return {ok:false};
 const pane=make("section","","vor018-panel");
 const title=make("h2","Lender & Bureau API — Offline Mock Lab");
 const notice=make("p","FICTIONAL TRAINING ONLY: No CIBIL/credit bureau lookup, no real lender, loan offer, eligibility, KYC, application, bureau score or disbursal. This page contains no provider credentials.");
 const role=make("p","Admin role from verified AAL2 session: "+first.role+". Browser fixture permissions cannot authorize live provider APIs.");
 const partner=pick("Fictional lender contract",first.partners.map(p=>[p.id,p.name]));
 const category=pick("Fictional loan category",first.partners.length?first.partners[0].categories.map(x=>[x,name(x)]):[]);
 const scenario=pick("Fictional bureau/lender response",SCENARIOS.map(x=>[x.id,x.label]));
 const demoConsent=make("button","Acknowledge fictional notice");demoConsent.type="button";
 const invoke=make("button","Run offline adapter fixture");invoke.type="button";invoke.disabled=true;
 const reset=make("button","Erase mock call history");reset.type="button";reset.disabled=first.role!=="owner";
 const feedback=make("p","This is an unapproved sample notice. Acknowledging it is not real customer consent.","vor018-feedback");
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const actions=join(make("div","","vor018-controls"),partner,category,scenario,demoConsent,invoke,reset);
 const overview=make("div","","vor018-contracts"),summary=make("p","","vor018-summary");
 const calls=make("div","","vor018-calls"),events=make("div","","vor018-audit"),gates=make("div","","vor018-gates");
 let acknowledged=false;
 function refreshCategories(){
  const p=PARTNER_CONTRACTS.find(x=>x.id===partner.value);
  const available=first.partners.find(x=>x.id===p?.id);
  category.replaceChildren();
  if(!available)return;
  for(const id of available.categories){const option=make("option",name(id));option.value=id;category.append(option);}
  category.value=available.categories[0];
 }
 function draw(){
  const s=engine.snapshot();
  overview.replaceChildren(make("h3","Fixed, independent fictional provider contracts"));
  for(const item of s.partners)overview.append(make("p",item.name+" · categories: "+item.categories.map(name).join(", ")+
   " · transport: OFFLINE · credentials: NONE · partner agreement: NOT CLAIMED"));
  overview.append(make("p","Fictional Bureau · zero real credit records · no CIBIL affiliation"));
  summary.textContent=s.metrics.fictional_calls+" local calls · "+s.metrics.mock_success+
   " sample successes · "+s.metrics.mock_validation_error+" sample validation failures · "+
   s.metrics.mock_unavailable+" simulated outages · "+s.metrics.simulated_retries+
   " bounded local retries · real bureau/lender requests = 0";
  calls.replaceChildren(make("h3","Role-scoped mock API monitor"));
  for(const item of s.calls){
   const card=make("article","","vor018-item");
   card.append(make("h4",item.id+" · "+item.partner_id),
    make("p",name(item.category)+" · "+name(item.scenario_id)+" · "+name(item.status)+
     " · fake HTTP "+item.response.http_status_simulated+" · revision "+item.revision));
   const data=make("p","Illustrative band: "+name(item.response.score_band)+
    ". Loan eligibility NOT determined; lender offers 0; underwriting NOT performed; bureau hits 0.");
   card.append(data);
   if(item.status==="mock_unavailable"){
    const retry=make("button","Retry one fictional outage");retry.type="button";
    retry.disabled=s.role==="auditor"||item.retry_count>=item.max_retries;
    retry.addEventListener("click",()=>{
     const r=engine.retry({mode:"synthetic_only",call_id:item.id,expected_revision:item.revision});
     feedback.textContent=r.ok?"Local retry simulated. No provider traffic.":"Denied: "+r.code;draw();
    });card.append(retry);
   }
   calls.append(card);
  }
  if(!s.calls.length)calls.append(make("p","No mock requests. Real financial data services remain disabled."));
  events.replaceChildren(make("h3","Temporary fictional call audit"));
  const list=make("ol");
  for(const item of s.audit)list.append(make("li","#"+item.event_no+" · "+item.call_id+" · "+item.action+" · "+item.actor_role));
  events.append(list);
  if(!s.audit.length)events.append(make("p","No temporary events. This is not a production compliance log."));
  gates.replaceChildren(make("h3","Production lender/bureau connections — BLOCKED"));
  const blockers=make("ul");
  for(const gate of s.release_gates)blockers.append(make("li","BLOCKED: "+name(gate)));
  gates.append(blockers);
 }
 partner.addEventListener("change",refreshCategories);
 demoConsent.addEventListener("click",()=>{
  acknowledged=true;invoke.disabled=first.role==="auditor";
  feedback.textContent="Fictional notice acknowledged locally (version "+DEMO_NOTICE_VERSION+"). Not legally verified customer consent.";
 });
 invoke.addEventListener("click",()=>{
  const r=engine.invoke({mode:"synthetic_only",partner_id:partner.value,scenario_id:scenario.value,
   category:category.value,notice_version:DEMO_NOTICE_VERSION,
   demo_consent_acknowledged:acknowledged,identity_fixture:"fictional_subject_only"});
  feedback.textContent=r.ok?"Fixed offline mock response created. Zero real API requests.":"Denied: "+r.code;draw();
 });
 reset.addEventListener("click",()=>{
  const r=engine.reset();feedback.textContent=r.ok?"Mock history cleared in memory.":"Denied: "+r.code;
  if(r.ok){acknowledged=false;invoke.disabled=true;}draw();
 });
 join(pane,title,notice,role,actions,feedback,overview,summary,calls,events,gates,
  make("p","All fake scores are categorical educational bands. No lender is real or verified. No API agreement, credit authorization, payment, loan approval, bureau pull, or KFS is represented."));
 root.replaceChildren(pane);draw();return {ok:true,mode:"synthetic_only"};
}
