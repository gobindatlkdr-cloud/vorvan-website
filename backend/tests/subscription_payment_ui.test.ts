/** VOR-015 actual first-party Admin payment UI synthetic DOM tests. */
import {createSubscriptionPaymentSandbox} from "../../assets/subscription-payment-sandbox.js";
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+" got "+String(a)+" expected "+String(b));}
function yes(x:unknown,label="assert"){if(!x)throw Error(label);}
class Fake {
 tag:string;textContent="";className="";value="";type="";disabled=false;hidden=false;
 attrs:Record<string,string>={};children:Fake[]=[];callbacks:Record<string,()=>void>={};
 constructor(tag:string){this.tag=tag;}
 append(...nodes:Fake[]){this.children.push(...nodes);}
 replaceChildren(...nodes:Fake[]){this.children=[...nodes];}
 setAttribute(k:string,v:string){this.attrs[k]=String(v);}
 addEventListener(k:string,fn:()=>void){this.callbacks[k]=fn;}
 fire(k:string){const cb=this.callbacks[k];if(!cb)throw Error("missing "+k+" listener");cb();}
}
const all=(root:Fake):Fake[]=>[root,...root.children.flatMap(all)];
const byText=(root:Fake,text:string)=>all(root).find(x=>x.textContent===text);
Deno.test("VOR-015 payment UI is behind verified Admin AAL2/ACL, wiped on logout, no task API",async()=>{
 const [html,admin]=await Promise.all([Deno.readTextFile("admin.html"),Deno.readTextFile("assets/admin.js")]);
 yes(html.includes('data-area="payments"'),"Admin payment nav");
 yes(html.includes('id="dashboard-view" class="workspace" hidden'),"no anonymous dashboard");
 yes(!/<script[^>]+src="assets\/subscription-payment-ui\.js"/.test(html),"no public standalone init");
 yes(admin.includes('if(area==="payments"){'),"payment gate branch");
 yes(admin.includes('if(!state.access||!["owner","operator","auditor"].includes(validatedRole))'),"MFA/ACL role");
 yes(admin.includes('import("./subscription-payment-ui.js")'),"first-party module");
 yes(admin.includes('state.role!==validatedRole'),"async session recheck");
 yes(admin.includes('state.paymentSandbox=null'),"reset on session/role change");
 yes(admin.includes('state.area==="readiness"||state.area==="governance"||state.area==="privacy"||state.area==="payments"'),"synthetic-only task-write barrier");
 yes(admin.includes('const data=await call("/overview")'),"role is server supplied, not query param");
});
Deno.test("Actual Owner DOM creates order, simulates idempotent webhook and Owner-only refund",async()=>{
 const previous=(globalThis as unknown as {document?:unknown}).document,prevFetch=globalThis.fetch;let requests=0;
 globalThis.fetch=(()=>{requests++;throw Error("unexpected live API")}) as typeof fetch;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const source=await Deno.readTextFile("assets/subscription-payment-ui.js");
  yes(!/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|sendBeacon|WebSocket/.test(source),"no injection/network/storage");
  const {mountSubscriptionPaymentSandbox}=await import("../../assets/subscription-payment-ui.js");
  const root=new Fake("main"),model=createSubscriptionPaymentSandbox("owner");
  eq(mountSubscriptionPaymentSandbox(root,model).ok,true);
  yes(all(root).some(x=>x.textContent.includes("No real prices")),"real payment disclaimer");
  yes(all(root).some(x=>x.textContent.includes("3 months")),"3m plan");
  yes(all(root).some(x=>x.textContent.includes("6 months")),"6m plan");
  const plan=all(root).find(x=>x.attrs["aria-label"]==="Fictional subscription plan");
  yes(plan,"fixed plan selector");plan!.value="guide_6m";
  const create=byText(root,"Create fictional subscription order");yes(create&&!create.disabled,"owner can create");
  create!.fire("click");
  eq(model.snapshot().orders.length,1);eq(model.snapshot().orders[0].plan_id,"guide_6m");
  const success=byText(root,"Simulate successful webhook");
  yes(success&&!success.disabled,"fixture webhook action");success!.fire("click");
  eq(model.snapshot().orders[0].status,"payment_simulated");
  const rev=model.snapshot().orders[0].revision,auditCount=model.snapshot().audit.length;
  const replay=byText(root,"Replay same fictional webhook");
  yes(replay,"replay visible");replay!.fire("click");
  eq(model.snapshot().orders[0].revision,rev);eq(model.snapshot().audit.length,auditCount);
  byText(root,"Request fictional refund review")!.fire("click");
  eq(model.snapshot().orders[0].status,"refund_review");
  byText(root,"Approve fictional refund")!.fire("click");
  eq(model.snapshot().orders[0].status,"refund_simulated");
  eq(model.snapshot().totals.simulated_net_paise,0);
  yes(all(root).some(x=>x.textContent.includes("BLOCKED:")),"permanent release list");
  eq(requests,0,"no network");
  byText(root,"Erase fictional payment session")!.fire("click");
  eq(model.snapshot().orders.length,0);eq(model.snapshot().audit.length,0);
 }finally{
  if(previous===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=previous;
  globalThis.fetch=prevFetch;
 }
});
Deno.test("Auditor has disabled mutations; Operator can only use one fictional subject",async()=>{
 const prior=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const {mountSubscriptionPaymentSandbox}=await import("../../assets/subscription-payment-ui.js");
  const auditRoot=new Fake("main"),auditor=createSubscriptionPaymentSandbox("auditor");
  eq(mountSubscriptionPaymentSandbox(auditRoot,auditor).ok,true);
  yes(byText(auditRoot,"Create fictional subscription order")?.disabled,"auditor no create");
  yes(byText(auditRoot,"Erase fictional payment session")?.disabled,"auditor no reset");
  eq(auditor.snapshot().orders.length,0);
  const opRoot=new Fake("main"),operator=createSubscriptionPaymentSandbox("operator");
  eq(mountSubscriptionPaymentSandbox(opRoot,operator).ok,true);
  const subject=all(opRoot).find(x=>x.attrs["aria-label"]==="Fictional subscription subject");
  yes(subject,"operator subject choice");eq(subject!.children.length,1);eq(subject!.value,"fixture_slate");
  byText(opRoot,"Create fictional subscription order")!.fire("click");
  eq(operator.snapshot().orders.length,1);
  byText(opRoot,"Simulate successful webhook")!.fire("click");
  yes(byText(opRoot,"Request fictional refund review")?.disabled,"operator refund disabled");
  yes(byText(opRoot,"Simulate subscription cancellation")?.disabled,"operator cancel disabled");
  yes(byText(opRoot,"Erase fictional payment session")?.disabled,"operator reset disabled");
 }finally{
  if(prior===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=prior;
 }
});
Deno.test("Fictional failed webhook keeps subscription inactive and unavailable for refunds",async()=>{
 const prior=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const {mountSubscriptionPaymentSandbox}=await import("../../assets/subscription-payment-ui.js");
  const root=new Fake("main"),desk=createSubscriptionPaymentSandbox("owner");
  eq(mountSubscriptionPaymentSandbox(root,desk).ok,true);
  byText(root,"Create fictional subscription order")!.fire("click");
  byText(root,"Simulate failed webhook")!.fire("click");
  eq(desk.snapshot().orders[0].status,"payment_declined");
  eq(desk.snapshot().totals.simulated_paid_paise,0);
  yes(!byText(root,"Request fictional refund review"),"no refund after declined demo");
 }finally{
  if(prior===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=prior;
 }
});
Deno.test("UI does not create actual payment links, money collection or provider secrets",async()=>{
 const [html,ui,engine,admin]=await Promise.all([
  Deno.readTextFile("admin.html"),Deno.readTextFile("assets/subscription-payment-ui.js"),
  Deno.readTextFile("assets/subscription-payment-sandbox.js"),Deno.readTextFile("assets/admin.js")
 ]);
 yes(html.includes("CSP")||html.includes("Content-Security-Policy"),"Admin CSP");
 yes(!/razorpay\.|cashfree\.|stripe\.com|phonepe\.|\/checkout|\/payments\/capture/.test(ui+engine),"no real gateway endpoints");
 yes(!/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b|\bsessionStorage\b/.test(engine.replace(/\/\*[\s\S]*?\*\//g,"")),"engine local only");
 yes(admin.includes('if(!syntheticOnly)tasks()')&&admin.includes('state.area==="payments"'),"synthetic payments never fetch real Admin task area");
});
