/** VORVAN M3 VOR-015 — BROWSER-ONLY fictional subscription/payment lifecycle.
 * Fake INR amounts are educational fixtures, NOT prices or payment requests.
 * No gateway, webhook endpoint, real money, customer identity, storage, network or settlement.
 * Role is supplied only by the existing server-verified AAL2 company Admin dashboard.
 */
export const PAYMENT_VERSION="m3-vor015-synthetic-2026-11-11-v1";
export const CURRENCY="INR";
export const ROLES=Object.freeze(["owner","operator","auditor"]);
export const FIXTURE_SUBJECTS=Object.freeze(["fixture_slate","fixture_amber"]);
export const PLAN_CATALOG=Object.freeze([
 Object.freeze({id:"guide_3m",label:"Fictional CIBIL Guide — 3 months",duration_months:3,amount_paise:39900,currency:CURRENCY,price_status:"fictional_only_not_offered"}),
 Object.freeze({id:"guide_6m",label:"Fictional CIBIL Guide — 6 months",duration_months:6,amount_paise:69900,currency:CURRENCY,price_status:"fictional_only_not_offered"})
]);
export const ORDER_STATES=Object.freeze([
 "awaiting_demo_event","payment_simulated","payment_declined",
 "refund_review","refund_simulated","refund_rejected","cancelled_demo"
]);
export const RELEASE_GATES=Object.freeze([
 "real_business_payment_onboarding_and_gateway_contract",
 "kyc_and_merchant_approval",
 "legal_subscription_terms_and_cancellation_policy",
 "live_customer_auth_and_versioned_consent",
 "server_side_verified_webhook_signature_and_replay_protection",
 "durable_ledger_and_refund_reconciliation",
 "independent_security_vapt_and_owner_approval"
]);
const deny=(code)=>Object.freeze({ok:false,code});
const oneOf=(xs,x)=>typeof x==="string"&&xs.includes(x);
const isExact=(o,keys)=>o!==null&&typeof o==="object"&&!Array.isArray(o)&&
 Object.getPrototypeOf(o)===Object.prototype&&Object.keys(o).length===keys.length&&
 keys.every(k=>Object.hasOwn(o,k));
const frozen=(x)=>Object.freeze(x);
const allowedId=(id)=>typeof id==="string"&&/^SIM-ORD-\d{3}$/.test(id);
const allowedEventId=(id)=>typeof id==="string"&&/^SIM-EVT-\d{3}-[AB]$/.test(id);
const activeStatus=(s)=>["payment_simulated","refund_review","refund_rejected"].includes(s);
const asPublicOrder=(o)=>frozen({...o});
export function createSubscriptionPaymentSandbox(role){
 if(!oneOf(ROLES,role))throw Error("verified_admin_role_required");
 let sequence=0,revision=0,eventSequence=0;
 let orders=[],history=[],webhookHistory=new Map();
 const canWrite=()=>role!=="auditor";
 const inScope=(o)=>role!=="operator"||o.subject_fixture==="fixture_slate";
 function event(order,action,from,to){
  history.push(frozen({event_no:++eventSequence,order_id:order.id,actor_role:role,
   action,from:from??null,to:to??null,fictional_only:true}));
 }
 function lookup(orderId){
  if(!allowedId(orderId))return null;
  const o=orders.find(x=>x.id===orderId);
  return o&&inScope(o)?o:null;
 }
 function change(previous,updates,action){
  const result=frozen({...previous,...updates,revision:++revision});
  orders=orders.map(o=>o.id===result.id?result:o);
  event(result,action,previous.status,result.status);
  return frozen({ok:true,order:asPublicOrder(result)});
 }
 function snapshot(){
  const visible=orders.filter(inScope);
  const gross=visible.reduce((sum,o)=>sum+o.paid_paise,0);
  const refunded=visible.reduce((sum,o)=>sum+o.refunded_paise,0);
  return frozen({
   ok:true,role,version:PAYMENT_VERSION,mode:"synthetic_only",storage:"memory_only",
   currency:CURRENCY,plans:PLAN_CATALOG,orders:frozen(visible.slice()),
   audit:frozen(history.filter(e=>role!=="operator"||visible.some(o=>o.id===e.order_id)).slice()),
   totals:frozen({fictional_orders:visible.length,simulated_paid_paise:gross,
    simulated_refunded_paise:refunded,simulated_net_paise:gross-refunded,
    active_demo_subscriptions:visible.filter(o=>activeStatus(o.status)).length}),
   release_gates:RELEASE_GATES,production_enabled:false,checkout_enabled:false,
   payment_gateway_connected:false,actual_payment_count:0,actual_refund_count:0,
   actual_webhook_count:0,notifications_sent:0,customer_data_read:false,
   subscriptions_billed:false,auto_renewal_enabled:false,
   permissions:frozen({create:canWrite(),simulate_webhook:canWrite(),
    refund:role==="owner",cancel:role==="owner",reset:role==="owner",go_live:false})
  });
 }
 function createOrder(input){
  if(!canWrite())return deny("read_only_role");
  if(!isExact(input,["mode","subject_fixture","plan_id"])||
   input.mode!=="synthetic_only"||!oneOf(FIXTURE_SUBJECTS,input.subject_fixture)||
   !oneOf(PLAN_CATALOG.map(p=>p.id),input.plan_id))return deny("invalid_fixed_order");
  if(role==="operator"&&input.subject_fixture!=="fixture_slate")return deny("out_of_scope");
  if(orders.length>=12)return deny("demo_capacity_reached");
  const plan=PLAN_CATALOG.find(p=>p.id===input.plan_id);
  const order=frozen({id:"SIM-ORD-"+String(++sequence).padStart(3,"0"),
   plan_id:plan.id,subject_fixture:input.subject_fixture,currency:CURRENCY,
   amount_paise:plan.amount_paise,duration_months:plan.duration_months,
   status:"awaiting_demo_event",subscription_status:"inactive_demo",
   paid_paise:0,refunded_paise:0,webhook_event_id:null,webhook_type:null,
   webhook_original_revision:null,revision:++revision,synthetic_only:true});
  orders.push(order);event(order,"fictional_order_created",null,order.status);
  return frozen({ok:true,order});
 }
 function simulateWebhook(input){
  if(!canWrite())return deny("read_only_role");
  if(!isExact(input,["mode","source","order_id","event_id","event_type","expected_revision"])||
    input.mode!=="synthetic_only"||input.source!=="fixed_demo_fixture"||
    !allowedId(input.order_id)||!allowedEventId(input.event_id)||
    !oneOf(["succeeded","failed"],input.event_type)||
    !Number.isSafeInteger(input.expected_revision))return deny("invalid_fixed_webhook");
  const o=lookup(input.order_id);
  if(!o)return deny("not_found_or_out_of_scope");
  // Identical event ID and payload is idempotent even after later state changes.
  // A reused ID with altered order, outcome or source is always rejected.
  const previous=webhookHistory.get(input.event_id);
  if(previous){
   if(previous.order_id===input.order_id&&previous.event_type===input.event_type)
    return frozen({ok:true,duplicate:true,applied:false,order:asPublicOrder(o)});
   return deny("event_id_conflict");
  }
  if(input.expected_revision!==o.revision)return deny("stale_revision");
  if(o.status!=="awaiting_demo_event")return deny("invalid_payment_transition");
  const status=input.event_type==="succeeded"?"payment_simulated":"payment_declined";
  const updated=change(o,{status,
   subscription_status:input.event_type==="succeeded"?"fictional_active":"inactive_demo",
   paid_paise:input.event_type==="succeeded"?o.amount_paise:0,
   webhook_event_id:input.event_id,webhook_type:input.event_type,
   webhook_original_revision:input.expected_revision},"fictional_webhook_"+input.event_type);
  webhookHistory.set(input.event_id,frozen({order_id:input.order_id,event_type:input.event_type}));
  return frozen({ok:true,duplicate:false,applied:true,order:updated.order});
 }
 function requestRefund(input){
  if(role!=="owner")return deny("owner_only_refund");
  if(!isExact(input,["order_id","expected_revision"]))return deny("invalid_fixed_choice");
  const o=lookup(input.order_id);
  if(!o)return deny("not_found_or_out_of_scope");
  if(!Number.isSafeInteger(input.expected_revision)||input.expected_revision!==o.revision)return deny("stale_revision");
  if(o.status!=="payment_simulated")return deny("refund_not_available");
  return change(o,{status:"refund_review"},"fictional_refund_requested");
 }
 function decideRefund(input){
  if(role!=="owner")return deny("owner_only_refund");
  if(!isExact(input,["order_id","decision","expected_revision"])||
    !oneOf(["approve","reject"],input.decision))return deny("invalid_fixed_choice");
  const o=lookup(input.order_id);
  if(!o)return deny("not_found_or_out_of_scope");
  if(!Number.isSafeInteger(input.expected_revision)||input.expected_revision!==o.revision)return deny("stale_revision");
  if(o.status!=="refund_review")return deny("refund_review_required");
  return change(o,{
   status:input.decision==="approve"?"refund_simulated":"refund_rejected",
   subscription_status:input.decision==="approve"?"fictional_revoked":"fictional_active",
   refunded_paise:input.decision==="approve"?o.paid_paise:0
  },"fictional_refund_"+input.decision);
 }
 function cancelSubscription(input){
  if(role!=="owner")return deny("owner_only_cancel");
  if(!isExact(input,["order_id","expected_revision"]))return deny("invalid_fixed_choice");
  const o=lookup(input.order_id);
  if(!o)return deny("not_found_or_out_of_scope");
  if(!Number.isSafeInteger(input.expected_revision)||input.expected_revision!==o.revision)return deny("stale_revision");
  if(!["payment_simulated","refund_rejected"].includes(o.status))return deny("cancel_not_permitted");
  return change(o,{status:"cancelled_demo",subscription_status:"fictional_revoked"},"fictional_subscription_cancelled");
 }
 function reset(){
  if(role!=="owner")return deny("owner_only_reset");
  orders=[];history=[];webhookHistory=new Map();
  // Preserve sequence/revision/event numbers within the browser session to prevent token reuse.
  return frozen({ok:true,erased_in_memory:true});
 }
 const requestProductionCheckout=()=>deny("immutable_production_payment_gates");
 return frozen({snapshot,createOrder,simulateWebhook,requestRefund,decideRefund,
   cancelSubscription,reset,requestProductionCheckout});
}
