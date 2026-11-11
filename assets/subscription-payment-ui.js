/** VOR-015: fictional Admin subscription/payment training dashboard.
 * Client-only first-party DOM. Not a checkout or gateway, no customer details or requests.
 */
import {PLAN_CATALOG,FIXTURE_SUBJECTS,PAYMENT_VERSION,CURRENCY} from "./subscription-payment-sandbox.js";
export {createSubscriptionPaymentSandbox} from "./subscription-payment-sandbox.js";
const make=(tag,value="",klass="")=>{
 const element=document.createElement(tag);element.textContent=value;
 if(klass)element.className=klass;return element;
};
const add=(root,...nodes)=>{root.append(...nodes);return root;};
const picker=(label,choices)=>{
 const select=make("select");select.setAttribute("aria-label",label);
 for(const [value,title] of choices){const option=make("option",title);option.value=value;select.append(option);}
 if(choices.length)select.value=choices[0][0];
 return select;
};
const fmt=(paise)=>"₹"+(paise/100).toFixed(2);
export function mountSubscriptionPaymentSandbox(root,desk){
 if(!root||typeof root.replaceChildren!=="function"||!desk||typeof desk.snapshot!=="function")
  return {ok:false};
 const initial=desk.snapshot();
 if(!initial.ok||initial.mode!=="synthetic_only"||!["owner","operator","auditor"].includes(initial.role))
  return {ok:false};
 const pane=make("section","","vor015-panel");
 const heading=make("h2","Subscription & Payment — Fictional Sandbox");
 const warning=make("p","TRAINING ONLY. No real prices, customers, checkout, payment link, card/UPI collection, gateway, charges, refunds or auto-renewal. Every figure is fabricated.");
 const meta=make("p","Existing AAL2/ACL-approved Admin role: "+initial.role+" · "+PAYMENT_VERSION+". Training role controls are not payment authorization.");
 const plans=make("div","","vor015-plans");
 for(const plan of PLAN_CATALOG)plans.append(make("p",plan.label+" · "+fmt(plan.amount_paise)+
  " demo INR only · no offered price"));
 const planChoice=picker("Fictional subscription plan",PLAN_CATALOG.map(p=>[p.id,p.label]));
 const eligibleFixtures=FIXTURE_SUBJECTS.filter(x=>initial.role!=="operator"||x==="fixture_slate");
 const subjectChoice=picker("Fictional subscription subject",eligibleFixtures.map(x=>[x,x.replaceAll("_"," ")]));
 const create=make("button","Create fictional subscription order");create.type="button";create.disabled=initial.role==="auditor";
 const reset=make("button","Erase fictional payment session");reset.type="button";reset.disabled=initial.role!=="owner";
 const controls=add(make("div","","vor015-controls"),planChoice,subjectChoice,create,reset);
 const feedback=make("p","Select a demonstration plan. All actions stay inside page memory.","vor015-feedback");
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const totals=make("p","","vor015-totals"),queue=make("div","","vor015-queue");
 const history=make("div","","vor015-audit"),gates=make("div","","vor015-gates");
 function announce(text){feedback.textContent=text;}
 function paint(){
  const s=desk.snapshot();
  totals.textContent=s.totals.fictional_orders+" fictional orders · "+
   fmt(s.totals.simulated_paid_paise)+" invented payments · "+
   fmt(s.totals.simulated_refunded_paise)+" invented refunds · "+
   fmt(s.totals.simulated_net_paise)+" invented net · "+
   s.totals.active_demo_subscriptions+" simulated active subscriptions. None is real revenue.";
  queue.replaceChildren(make("h3","Role-scoped fictional orders"));
  for(const order of s.orders){
   const card=make("article","","vor015-order");
   add(card,make("h4",order.id+" · "+order.plan_id.replaceAll("_"," ")),
    make("p",order.subject_fixture.replaceAll("_"," ")+" · "+order.status.replaceAll("_"," ")+
     " · "+fmt(order.amount_paise)+" fictional INR · rev "+order.revision+
     " · subscription: "+order.subscription_status));
   const buttons=make("div","","vor015-order-actions");
   const actionButton=(label,callback,allowed=true)=>{
    const btn=make("button",label);btn.type="button";btn.disabled=!allowed;
    btn.addEventListener("click",()=>{
     const result=callback();
     announce(result.ok?(result.duplicate?"Duplicate simulated event ignored; no extra transaction.":"Fictional state recorded in memory."):
      "Denied: "+result.code);
     paint();
    });buttons.append(btn);
    return btn;
   };
   const simEventId="SIM-EVT-"+order.id.slice(-3)+"-A";
   if(order.status==="awaiting_demo_event"){
    for(const [kind,label] of [["succeeded","Simulate successful webhook"],["failed","Simulate failed webhook"]]){
     actionButton(label,()=>desk.simulateWebhook({
      mode:"synthetic_only",source:"fixed_demo_fixture",
      order_id:order.id,event_id:simEventId,event_type:kind,expected_revision:order.revision
     }),s.role!=="auditor");
    }
   }else if(order.webhook_event_id){
    actionButton("Replay same fictional webhook",()=>desk.simulateWebhook({
     mode:"synthetic_only",source:"fixed_demo_fixture",order_id:order.id,
     event_id:order.webhook_event_id,event_type:order.webhook_type,
     expected_revision:order.webhook_original_revision
    }),s.role!=="auditor");
   }
   if(order.status==="payment_simulated"){
    actionButton("Request fictional refund review",()=>desk.requestRefund({
     order_id:order.id,expected_revision:order.revision}),s.role==="owner");
    actionButton("Simulate subscription cancellation",()=>desk.cancelSubscription({
     order_id:order.id,expected_revision:order.revision}),s.role==="owner");
   }
   if(order.status==="refund_review"){
    for(const [choice,label] of [["approve","Approve fictional refund"],["reject","Reject fictional refund"]]){
     actionButton(label,()=>desk.decideRefund({
      order_id:order.id,decision:choice,expected_revision:order.revision
     }),s.role==="owner");
    }
   }
   if(order.status==="refund_rejected"){
    actionButton("Simulate subscription cancellation",()=>desk.cancelSubscription({
     order_id:order.id,expected_revision:order.revision}),s.role==="owner");
   }
   card.append(buttons);queue.append(card);
  }
  if(!s.orders.length)queue.append(make("p","No fictional orders; real customer billing and checkout remain OFF."));
  history.replaceChildren(make("h3","In-memory fictional payment audit"));
  const events=make("ol");
  for(const e of s.audit)events.append(make("li","#"+e.event_no+" · "+e.order_id+" · "+e.action+
   " · "+e.actor_role));
  history.append(events);
  if(!s.audit.length)history.append(make("p","No temporary events. This is not a financial or compliance ledger."));
  gates.replaceChildren(make("h3","Real payment release gates — BLOCKED"));
  const entries=make("ul");
  for(const gate of s.release_gates)entries.append(make("li","BLOCKED: "+gate.replaceAll("_"," ")));
  gates.append(entries);
 }
 create.addEventListener("click",()=>{
  const result=desk.createOrder({mode:"synthetic_only",subject_fixture:subjectChoice.value,
   plan_id:planChoice.value});
  announce(result.ok?"Fictional order created. Nothing has been billed.":"Denied: "+result.code);paint();
 });
 reset.addEventListener("click",()=>{
  const result=desk.reset();
  announce(result.ok?"Fictional orders, simulated webhook keys and audit cleared in memory.":"Denied: "+result.code);
  paint();
 });
 add(pane,heading,warning,meta,make("h3","Illustrative subscription catalogue"),plans,controls,
  feedback,totals,queue,history,gates,
  make("p","No RBI/lender, payment-provider, merchant onboarding, gateway API, webhook receiver, financial record, real settlement or customer consent is represented by this sandbox."));
 root.replaceChildren(pane);paint();return {ok:true,mode:"synthetic_only"};
}
