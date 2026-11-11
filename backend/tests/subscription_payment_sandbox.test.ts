/** VOR-015 real synthetic subscription engine and idempotency contract tests. */
import {createSubscriptionPaymentSandbox,PLAN_CATALOG,FIXTURE_SUBJECTS,RELEASE_GATES,
 ROLES,PAYMENT_VERSION,ORDER_STATES} from "../../assets/subscription-payment-sandbox.js";
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+": got "+String(a)+" expected "+String(b));}
function yes(x:unknown,label="assert"){if(!x)throw Error(label);}
type Desk=ReturnType<typeof createSubscriptionPaymentSandbox>;
const desk=(role="owner")=>createSubscriptionPaymentSandbox(role);
const fixed=(plan_id="guide_3m",subject_fixture="fixture_slate")=>({mode:"synthetic_only",plan_id,subject_fixture});
function create(d:Desk,plan="guide_3m",subject="fixture_slate"){
 const r=d.createOrder(fixed(plan,subject));
 if(!r.ok||!("order" in r))throw Error("create fictional order failed");
 return r.order;
}
function order(d:Desk,id:string){const o=d.snapshot().orders.find((o:{id:string})=>o.id===id);if(!o)throw Error("missing demo order");return o;}
const eventInput=(o:{id:string,revision:number},event_type="succeeded",event_id="SIM-EVT-001-A")=>({
 mode:"synthetic_only",source:"fixed_demo_fixture",order_id:o.id,event_id,event_type,expected_revision:o.revision
});
function settle(d:Desk,id:string,type="succeeded"){
 const o=order(d,id),idNum=o.id.slice(-3);
 return d.simulateWebhook(eventInput(o,type,"SIM-EVT-"+idNum+"-A"));
}
const refundReq=(o:{id:string,revision:number})=>({order_id:o.id,expected_revision:o.revision});
Deno.test("VOR-015 fixed fake plans for 3/6 months are frozen and explicitly not prices",()=>{
 eq(PLAN_CATALOG.length,2);eq(PLAN_CATALOG[0].duration_months,3);eq(PLAN_CATALOG[1].duration_months,6);
 for(const p of PLAN_CATALOG){eq(p.currency,"INR");eq(p.price_status,"fictional_only_not_offered");
  eq(Number.isInteger(p.amount_paise),true);yes(p.amount_paise>0,"fictional paise");
  yes(Object.isFrozen(p),"immutable catalogue");}
 eq(ORDER_STATES.length,7);eq(FIXTURE_SUBJECTS.length,2);eq(ROLES.length,3);
});
Deno.test("Unknown, customer and unverified roles never receive payment simulator",()=>{
 for(const role of ["",null,undefined,"customer","support","admin",{},[]]){
  let rejected=false;try{createSubscriptionPaymentSandbox(role as string);}catch{rejected=true;}
  yes(rejected,"unauthorized role");
 }
});
Deno.test("Demo only: no checkout gateway customer or automatic renewal",()=>{
 const d=desk(),s=d.snapshot();
 eq(s.version,PAYMENT_VERSION);eq(s.checkout_enabled,false);eq(s.payment_gateway_connected,false);
 eq(s.actual_payment_count,0);eq(s.actual_refund_count,0);
 eq(s.actual_webhook_count,0);eq(s.subscriptions_billed,false);eq(s.auto_renewal_enabled,false);
 eq(s.storage,"memory_only");eq(s.customer_data_read,false);
});
Deno.test("Intake rejects extra PII, cards, UPI, amounts, recurring billing and unknown plan",()=>{
 const d=desk();
 for(const bad of [
  {...fixed(),name:"Real User"},{...fixed(),phone:"9999999999"},
  {...fixed(),card:"4111111111111111"},{...fixed(),upi_id:"person@psp"},
  {...fixed(),pan:"ABCDE1234F"},{...fixed(),email:"x@example.invalid"},
  {...fixed(),customer_id:"live"},{...fixed(),amount_paise:1},{...fixed(),notes:"sensitive"},
  {...fixed(),auto_renew:true},{...fixed(),mode:"production"},
  {...fixed(),subject_fixture:"user-123"},{...fixed(),plan_id:"live_price"},
  null,{},[], "arbitrary"
 ])eq(d.createOrder(bad as never).ok,false,"intake must not accept arbitrary information");
 eq(d.snapshot().orders.length,0);eq(d.snapshot().audit.length,0);
});
Deno.test("Owner can create both 3m and 6m plans with stable fixed amounts",()=>{
 const d=desk(),a=create(d,"guide_3m"),b=create(d,"guide_6m","fixture_amber");
 eq(a.id,"SIM-ORD-001");eq(b.id,"SIM-ORD-002");
 eq(a.amount_paise,PLAN_CATALOG[0].amount_paise);eq(b.amount_paise,PLAN_CATALOG[1].amount_paise);
 eq(a.status,"awaiting_demo_event");eq(a.subscription_status,"inactive_demo");
 eq(d.snapshot().totals.fictional_orders,2);eq(d.snapshot().audit.length,2);
});
Deno.test("Operator may simulate only fixture_slate; Auditor can never create",()=>{
 const o=desk("operator"),a=desk("auditor");
 eq(o.createOrder(fixed("guide_3m","fixture_amber")).ok,false);
 eq(o.createOrder(fixed("guide_6m","fixture_slate")).ok,true);
 eq(o.snapshot().orders.length,1);eq(o.snapshot().permissions.refund,false);
 eq(a.createOrder(fixed()).ok,false);eq(a.snapshot().permissions.create,false);
});
Deno.test("Successful fictional webhook yields active demonstration and fixed minor units",()=>{
 const d=desk(),a=create(d);
 const w=settle(d,a.id);eq(w.ok,true);
 if(!w.ok||!("duplicate" in w))throw Error("webhook result shape");
 eq(w.duplicate,false);eq(w.applied,true);
 const s=d.snapshot();
 eq(s.orders[0].status,"payment_simulated");eq(s.orders[0].subscription_status,"fictional_active");
 eq(s.orders[0].paid_paise,a.amount_paise);eq(s.orders[0].refunded_paise,0);
 eq(s.actual_payment_count,0);eq(s.totals.simulated_paid_paise,a.amount_paise);
});
Deno.test("Failed demonstration event cannot activate or fund subscription",()=>{
 const d=desk(),a=create(d);
 yes(settle(d,a.id,"failed").ok,"sim failure");
 eq(d.snapshot().orders[0].status,"payment_declined");eq(d.snapshot().orders[0].paid_paise,0);
 eq(d.snapshot().totals.active_demo_subscriptions,0);
 eq(d.requestRefund(refundReq(order(d,a.id))).ok,false);
});
Deno.test("Replay same simulated webhook is idempotent with stale revision",()=>{
 const d=desk(),a=create(d),body=eventInput(a);
 yes(d.simulateWebhook(body).ok,"first");
 const after=d.snapshot(),again=d.simulateWebhook(body);
 eq(again.ok,true);
 if(!again.ok||!("duplicate" in again))throw Error("duplicate result missing");
 eq(again.duplicate,true);eq(again.applied,false);
 eq(d.snapshot().audit.length,after.audit.length);
 eq(d.snapshot().totals.simulated_paid_paise,a.amount_paise);
 eq(d.snapshot().orders[0].revision,after.orders[0].revision);
});
Deno.test("Conflicting event ID and changed event type are rejected with zero extra audit",()=>{
 const d=desk(),a=create(d);
 const original=eventInput(a);
 yes(d.simulateWebhook(original).ok,"first");
 const auditCount=d.snapshot().audit.length;
 const wrong=d.simulateWebhook({...original,event_type:"failed"});
 eq(wrong.ok,false);eq(d.snapshot().audit.length,auditCount);
 const b=create(d,"guide_6m");
 const other=d.simulateWebhook({...original,order_id:b.id,expected_revision:b.revision});
 eq(other.ok,false);eq(d.snapshot().orders[1].status,"awaiting_demo_event");
});
Deno.test("Strict simulated webhook payload blocks live provider endpoints and credentials",()=>{
 const d=desk(),a=create(d),base=eventInput(a);
 for(const invalid of [
  {...base,mode:"production"},{...base,source:"payment_provider"},
  {...base,signature:"real_gateway_hmac"},{...base,otp:"111111"},
  {...base,payment_instrument:"card"},{...base,customer_email:"x@example.invalid"},
  {...base,amount_paise:1},{...base,event_type:"chargeback"},
  {...base,event_id:"evt_real_live"},{...base,event_id:"SIM-EVT-000000-A"},
  {...base,expected_revision:"1"},null,{}
 ])eq(d.simulateWebhook(invalid as never).ok,false,"forbidden event payload");
 eq(d.snapshot().audit.length,1);
});
Deno.test("Stale revision on first event fails before any settlement simulation",()=>{
 const d=desk(),a=create(d);
 eq(d.simulateWebhook({...eventInput(a),expected_revision:0}).ok,false);
 eq(d.snapshot().orders[0].status,"awaiting_demo_event");
});
Deno.test("Two distinct webhook IDs cannot settle same order twice",()=>{
 const d=desk(),a=create(d);
 yes(settle(d,a.id).ok,"first");
 const rev=order(d,a.id).revision;
 eq(d.simulateWebhook({...eventInput(a),"event_id":"SIM-EVT-001-B",expected_revision:rev}).ok,false);
 eq(d.snapshot().totals.simulated_paid_paise,a.amount_paise);
});
Deno.test("Auditor cannot simulate events or run refund/cancel/clear",()=>{
 const d=desk("auditor"),payload=eventInput({id:"SIM-ORD-001",revision:1});
 eq(d.simulateWebhook(payload).ok,false);
 eq(d.requestRefund({order_id:"SIM-ORD-001",expected_revision:1}).ok,false);
 eq(d.decideRefund({order_id:"SIM-ORD-001",decision:"approve",expected_revision:1}).ok,false);
 eq(d.cancelSubscription({order_id:"SIM-ORD-001",expected_revision:1}).ok,false);
 eq(d.reset().ok,false);
});
Deno.test("Operator can apply fictional paid event but cannot refund, cancel or reset",()=>{
 const d=desk("operator"),a=create(d);
 yes(settle(d,a.id).ok,"operator event");
 eq(d.requestRefund(refundReq(order(d,a.id))).ok,false);
 eq(d.cancelSubscription(refundReq(order(d,a.id))).ok,false);
 eq(d.reset().ok,false);eq(d.snapshot().totals.active_demo_subscriptions,1);
});
Deno.test("Refund requires simulated successful charge and Owner review",()=>{
 const d=desk(),a=create(d);
 eq(d.requestRefund(refundReq(a)).ok,false);
 yes(settle(d,a.id).ok,"paid");
 const paid=order(d,a.id),r=d.requestRefund(refundReq(paid));
 eq(r.ok,true);eq(order(d,a.id).status,"refund_review");
 eq(d.snapshot().audit.length,3);
 eq(d.requestRefund(refundReq(order(d,a.id))).ok,false);
});
Deno.test("Owner fictional refund approval returns all fake minor units, zero net",()=>{
 const d=desk(),a=create(d);
 yes(settle(d,a.id).ok,"pay");yes(d.requestRefund(refundReq(order(d,a.id))).ok,"review");
 const r=d.decideRefund({...refundReq(order(d,a.id)),decision:"approve"});
 eq(r.ok,true);eq(order(d,a.id).status,"refund_simulated");eq(order(d,a.id).subscription_status,"fictional_revoked");
 const s=d.snapshot();eq(s.totals.simulated_refunded_paise,a.amount_paise);
 eq(s.totals.simulated_net_paise,0);eq(s.actual_refund_count,0);
 eq(d.requestRefund(refundReq(order(d,a.id))).ok,false);
});
Deno.test("Owner can reject refund without marking it paid out or auto-renewing",()=>{
 const d=desk(),a=create(d);
 yes(settle(d,a.id).ok,"paid");yes(d.requestRefund(refundReq(order(d,a.id))).ok,"review");
 yes(d.decideRefund({...refundReq(order(d,a.id)),decision:"reject"}).ok,"reject");
 eq(order(d,a.id).status,"refund_rejected");
 eq(order(d,a.id).refunded_paise,0);
 eq(d.snapshot().totals.active_demo_subscriptions,1);
 eq(d.snapshot().auto_renewal_enabled,false);
});
Deno.test("Refund decision requires exact fixed enum and optimistic revision",()=>{
 const d=desk(),a=create(d);
 yes(settle(d,a.id).ok,"pay");yes(d.requestRefund(refundReq(order(d,a.id))).ok,"request");
 const c=order(d,a.id);
 for(const bad of [
  {...refundReq(c),decision:"actual_refund"}, {...refundReq(c),decision:"approve",reason:"free form"},
  {...refundReq(c),decision:"approve",expected_revision:1},{...refundReq(c),decision:"approve",card:"real"},
  null,{},[]
 ])eq(d.decideRefund(bad as never).ok,false);
 eq(order(d,a.id).status,"refund_review");eq(d.snapshot().audit.length,3);
});
Deno.test("Cancellation simulates access revocation, not a monetary refund",()=>{
 const d=desk(),a=create(d);
 yes(settle(d,a.id).ok,"paid");yes(d.cancelSubscription(refundReq(order(d,a.id))).ok,"cancel");
 const c=order(d,a.id);
 eq(c.status,"cancelled_demo");eq(c.subscription_status,"fictional_revoked");
 eq(c.refunded_paise,0);eq(d.snapshot().totals.active_demo_subscriptions,0);
 eq(d.snapshot().totals.simulated_net_paise,a.amount_paise);
 eq(d.cancelSubscription(refundReq(c)).ok,false);
});
Deno.test("Failed, refund-review and refund-simulated orders cannot cancel",()=>{
 for(const status of ["failed","refunded"]){
  const d=desk(),a=create(d);
  if(status==="failed")yes(settle(d,a.id,"failed").ok,"decline");
  else{yes(settle(d,a.id).ok,"paid");yes(d.requestRefund(refundReq(order(d,a.id))).ok,"review");
   yes(d.decideRefund({...refundReq(order(d,a.id)),decision:"approve"}).ok,"approve");}
  eq(d.cancelSubscription(refundReq(order(d,a.id))).ok,false);
 }
});
Deno.test("Frozen per-session audit events, monotonically numbered and never contain PII",()=>{
 const d=desk(),a=create(d);yes(settle(d,a.id).ok,"event");
 const s=d.snapshot();
 eq(s.audit.length,2);eq(s.audit[0].event_no,1);eq(s.audit[1].event_no,2);
 yes(Object.isFrozen(s.audit[0]),"frozen event");yes(Object.isFrozen(s.orders[0]),"frozen order");
 const text=JSON.stringify(s).toLowerCase();
 for(const key of ['"email"','"phone"','"upi_id"','"card"','"aadhaar"','"pan"','"borrower"'])
  yes(!text.includes(key),"no sensitive field "+key);
});
Deno.test("Aggregate net fictional paise reconcile multi-order success/failure/refund",()=>{
 const d=desk(),a=create(d),b=create(d,"guide_6m"),c=create(d);
 yes(settle(d,a.id).ok,"a");yes(settle(d,b.id,"failed").ok,"b");yes(settle(d,c.id).ok,"c");
 yes(d.requestRefund(refundReq(order(d,c.id))).ok,"refund req");
 yes(d.decideRefund({...refundReq(order(d,c.id)),decision:"approve"}).ok,"refund approved");
 const totals=d.snapshot().totals;
 eq(totals.fictional_orders,3);eq(totals.simulated_paid_paise,a.amount_paise+c.amount_paise);
 eq(totals.simulated_refunded_paise,c.amount_paise);eq(totals.simulated_net_paise,a.amount_paise);
 eq(totals.active_demo_subscriptions,1);
});
Deno.test("Bounded memory-only fixture queue and reset preserves monotonic identifiers",()=>{
 const d=desk();
 for(let i=0;i<12;i++)yes(d.createOrder(fixed()).ok,"within 12");
 eq(d.createOrder(fixed()).ok,false);
 const firstRev=d.snapshot().orders[0].revision;
 yes(d.reset().ok,"owner reset");eq(d.snapshot().orders.length,0);eq(d.snapshot().audit.length,0);
 const fresh=create(d);
 eq(fresh.id,"SIM-ORD-013");yes(fresh.revision>firstRev,"never reuse old revision");
});
Deno.test("Reset clears webhook dedup memory but old event key cannot act on a new order",()=>{
 const d=desk(),a=create(d);
 yes(settle(d,a.id).ok,"first");
 yes(d.reset().ok,"reset");
 const b=create(d);
 eq(d.simulateWebhook({...eventInput(a),order_id:a.id}).ok,false);
 yes(settle(d,b.id).ok,"new event");
 eq(d.snapshot().totals.fictional_orders,1);
});
Deno.test("All seven production release gates immutable; no role can enable checkout",()=>{
 eq(RELEASE_GATES.length,7);
 yes(Object.isFrozen(RELEASE_GATES),"frozen gates");
 for(const role of ROLES){
  const d=desk(role),s=d.snapshot();
  eq(d.requestProductionCheckout().ok,false);
  eq(s.checkout_enabled,false);eq(s.production_enabled,false);
  eq(s.actual_payment_count,0);eq(s.actual_refund_count,0);
 }
});
Deno.test("No network, storage, provider keys or real financial operations from simulation",()=>{
 const original=globalThis.fetch;let requests=0;
 globalThis.fetch=(()=>{requests++;throw Error("no external payment calls")}) as typeof fetch;
 try{
  const d=desk(),a=create(d);yes(settle(d,a.id).ok,"pay");
  yes(d.requestRefund(refundReq(order(d,a.id))).ok,"request");
  yes(d.decideRefund({...refundReq(order(d,a.id)),decision:"approve"}).ok,"refund");
  eq(requests,0);eq(d.snapshot().notifications_sent,0);
  eq(d.snapshot().actual_payment_count,0);eq(d.snapshot().actual_refund_count,0);
 }finally{globalThis.fetch=original;}
});
