/** VOR-013 executes real first-party Support UI with synthetic DOM; never logs in or writes data. */
import {createSupportLifecycleSandbox,START_MS} from "../../assets/support-lifecycle-sandbox.js";
import {mountSupportLifecycleSandbox} from "../../assets/support-lifecycle-ui.js";
function eq(a:unknown,b:unknown,n="assert"){if(JSON.stringify(a)!==JSON.stringify(b))
 throw Error(n+" "+JSON.stringify(a)+" != "+JSON.stringify(b));}
function yes(v:unknown,n:string){if(!v)throw Error(n);}
class Fake{
 tag:string;children:Fake[]=[];textContent="";value="";disabled=false;
 type="";className="";attrs:Record<string,string>={};events:Record<string,()=>void>={};
 ownerDocument?:{createElement:(tag:string)=>Fake};
 constructor(tag="div"){this.tag=tag;}
 append(...items:Fake[]){this.children.push(...items);}
 replaceChildren(...items:Fake[]){this.children=[...items];}
 setAttribute(k:string,v:string){this.attrs[k]=v;}
 addEventListener(k:string,f:()=>void){this.events[k]=f;}
 fire(event:string){if(!this.events[event])throw Error("Missing event "+event);this.events[event]();}
}
function fixture(role:"owner"|"operator"|"auditor"){
 const root=new Fake("main");
 root.ownerDocument={createElement:(tag:string)=>new Fake(tag)};
 const engine=createSupportLifecycleSandbox(role);
 if(!engine.ok)throw Error("failed role");
 const mounted=mountSupportLifecycleSandbox(root,engine);
 if(!mounted.ok)throw Error("mount failed");
 return {root,engine};
}
Deno.test("Actual VOR-013 Admin Support UI: MFA-bound injection, fictional intake, status, SLA, escalation, audit, reset",async()=>{
 const admin=await Deno.readTextFile("assets/admin.js");
 const html=await Deno.readTextFile("admin.html");
 const css=await Deno.readTextFile("assets/support-lifecycle-sandbox.css");
 const ui=await Deno.readTextFile("assets/support-lifecycle-ui.js");
 yes(admin.includes('if(area==="support")'),"Mounted only in Support route");
 yes(admin.includes('!state.access||!["owner","operator","auditor"].includes(validatedRole)'),"MFA/ACL role gate present");
 yes(admin.includes('state.supportSandbox=null;$("password")'),"Logout clears synthetic state");
 yes(admin.includes('import("./support-lifecycle-sandbox.js")'),"Must dynamically import only inside session");
 yes(admin.includes('import("./support-lifecycle-ui.js")'),"Actual UI must be loaded behind session");
 yes(html.includes('href="assets/support-lifecycle-sandbox.css"'),"Admin loads first-party CSS");
 yes(css.includes("--vor013-burgundy:#741943"),"VORVAN burgundy design");
 yes(css.includes(":focus-visible")&&css.includes("prefers-reduced-motion"),"Keyboard and motion styles");
 yes(!/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|\bXMLHttpRequest\b|\bsendBeacon\b|\binnerHTML\s*=/.test(ui),"No network, storage, or unsafe HTML injection");
 const prev=globalThis.fetch;globalThis.fetch=(()=>{throw Error("Unexpected server call");}) as typeof fetch;
 try{
  const {root,engine}=fixture("owner");
  eq(root.children.length,6);
  const [head,controls,message,summary,queue,audit]=root.children;
  yes(head.children[0].textContent.includes("VOR-013"),"Accurate sandbox title");
  yes(head.children[1].textContent.includes("No real complaints"),"No live case claim");
  const clock=controls.children[0].children[0];
  const templates=controls.children[1].children[0];
  const add=controls.children[2],reset=controls.children[3];
  eq(templates.children.length,6);
  templates.value="website_navigation";add.fire("click");
  eq(queue.children.length,1);eq(engine.snapshot().audit.length,1);
  yes(summary.textContent.includes("no backend or customer record"),"No production writes claimed");
  yes(message.textContent.includes("browser memory only"),"Safe receipt");
  clock.value="240";clock.fire("change");
  yes(queue.children[0].children[3].textContent.includes("Simulated overdue"),"Clock shows overdue");
  let actions=queue.children[0].children[4];
  const select=actions.children[0];select.value="triaged";actions.children[1].fire("click");
  eq(engine.snapshot().queue[0].status,"triaged");
  eq(engine.snapshot().audit.length,2);
  actions=queue.children[0].children[4];
  const escalation=actions.children.find(x=>x.textContent==="Simulate escalation");
  yes(escalation,"Overdue simulated escalation action available");
  escalation!.fire("click");
  eq(engine.snapshot(START_MS+240*3600000).queue[0].status,"escalated");
  eq(engine.snapshot().audit.length,3);
  yes(audit.children[1].children.length>=3,"Audit timeline rendered");
  reset.fire("click");eq(queue.children.length,1);
  yes(queue.children[0].textContent.includes("No fictional cases"),"Owner reset view");
  eq(engine.snapshot().audit.length,0);
 }finally{globalThis.fetch=prev;}
});
Deno.test("Role-scoped UI: Operator has only operations templates; Auditor cannot write demo data",()=>{
 const operator=fixture("operator");
 const opts=operator.root.children[1].children[1].children[0].children;
 eq(opts.length,3);yes(opts.every(x=>!x.textContent.includes("security")&&!x.textContent.includes("Privacy")),"No compliance intake");
 const auditor=fixture("auditor");
 eq(auditor.root.children[1].children[2].disabled,true);
 eq(auditor.root.children[1].children[3].disabled,true);
 eq(auditor.root.children[1].children[1].children[0].children.length,6);
 eq(auditor.engine.snapshot().permissions.read,true);
});
Deno.test("Fake/inconsistent admin roles cannot mount the UI",()=>{
 const root=new Fake("main");root.ownerDocument={createElement:(tag:string)=>new Fake(tag)};
 const bad=mountSupportLifecycleSandbox(root,{ok:true,role:"superuser",version:"vor013-synthetic-2026-11-11-v1"});
 eq(bad.ok,false);
 const invalid=createSupportLifecycleSandbox("unknown");
 eq(mountSupportLifecycleSandbox(root,invalid).ok,false);
 eq(root.children.length,0);
});
