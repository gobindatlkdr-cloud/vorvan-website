/** VOR-010: synthetic DOM test of actual admin readiness module, plus MFA mount gating audit. */
import {createAdminReadinessSandbox,mountAdminReadinessSandbox} from "../../assets/admin-readiness-sandbox.js";
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+": expected "+String(b)+" got "+String(a));}
function yes(v:unknown,label:string){if(!v)throw Error(label);}
class Element{
 tag:string;className="";textContent="";value="";type="";selected=false;disabled=false;hidden=false;
 children:Element[]=[];style:{width:string}={width:""};attrs:Record<string,string>={};
 handlers:Record<string,(e?:unknown)=>void>={};
 constructor(tag="div"){this.tag=tag;}
 append(...nodes:Element[]){this.children.push(...nodes);}
 replaceChildren(...nodes:Element[]){this.children=[...nodes];}
 setAttribute(k:string,v:string){this.attrs[k]=String(v);}
 getAttribute(k:string){return this.attrs[k]??null;}
 addEventListener(k:string,fn:(e?:unknown)=>void){this.handlers[k]=fn;}
 fire(k:string){if(!this.handlers[k])throw Error("No "+k+" on "+this.tag);this.handlers[k]();}
 focus(){}
}
function first(root:Element,className:string){
 const matches=(x:Element):Element|null=>{
  if(x.className.split(/\s+/).includes(className))return x;
  for(const c of x.children){const result=matches(c);if(result)return result;}
  return null;
 };
 const out=matches(root);if(!out)throw Error("No ."+className);
 return out;
}
function all(root:Element,className:string){
 const found:Element[]=[];const visit=(x:Element)=>{if(x.className.split(/\s+/).includes(className))found.push(x);for(const c of x.children)visit(c);};
 visit(root);return found;
}
Deno.test("VOR-010 real dashboard renderer works on synthetic DOM for owner/operator/auditor",()=>{
 const prior=(globalThis as {document?:unknown}).document;
 const previousFetch=globalThis.fetch;
 (globalThis as {document:unknown}).document={createElement:(tag:string)=>new Element(tag)};
 globalThis.fetch=(()=>{throw Error("Unexpected network or production admin operation");}) as typeof fetch;
 try{
  for(const [role,count,mayChange,canReset] of [["owner",18,true,true],["operator",12,true,false],["auditor",18,false,false]] as const){
   const s=createAdminReadinessSandbox(role);
   if(!s.ok)throw Error("Unexpected role deny");
   const root=new Element("main");
   const mount=mountAdminReadinessSandbox(root,s);
   eq(mount.ok,true);
   eq(all(root,"vor010-task").length,count,"Role scoped task count");
   eq(all(root,"vor010-gates").length,1,"Always display blocked gates");
   eq(all(root,"vor010-locked").length,7,"All seven gates shown as blocked");
   const selectors=all(root,"vor010-task").map(card=>card.children[1].children[0]);
   eq(selectors.every(x=>x.disabled===!mayChange),true,"Task stage permission");
   eq(all(root,"small-button")[0].disabled,!canReset,"Owner-only demo reset");
   if(role==="owner"){
    const sel=selectors[0];sel.value="reviewed";sel.fire("change");
    eq(all(root,"vor010-task").length,18);
    eq(first(root,"vor010-stage").children[2].getAttribute("aria-valuenow"),"1");
    eq(s.snapshot().change_history.length,1);
    const reset=all(root,"small-button")[0];reset.fire("click");
    eq(s.snapshot().change_history.length,0);eq(s.snapshot().queue[0].status,"todo");
    eq(first(root,"vor010-stage").children[2].getAttribute("aria-valuenow"),"0");
   }
  }
 }finally{
  if(prior===undefined)delete (globalThis as {document?:unknown}).document;
  else (globalThis as {document:unknown}).document=prior;
  globalThis.fetch=previousFetch;
 }
});
Deno.test("Admin page uses existing verified /overview, checks AAL2 before dashboard, module is not a public route",async()=>{
 const [html,admin,backend,sandbox,css]=await Promise.all([
  Deno.readTextFile("admin.html"),
  Deno.readTextFile("assets/admin.js"),
  Deno.readTextFile("backend/admin-console/index.ts"),
  Deno.readTextFile("assets/admin-readiness-sandbox.js"),
  Deno.readTextFile("assets/admin.css")
 ]);
 yes(html.includes('id="dashboard-view" class="workspace" hidden'),"MFA dashboard initially hidden");
 yes(html.includes('data-area="readiness"'),"Sandbox navigation within gated dashboard");
 yes(!/<script[^>]+src="assets\/admin-readiness-sandbox\.js"/.test(html),"No standalone public page initialization");
 yes(admin.includes('await load();')&&admin.includes('visible("mfa-view",false);visible("dashboard-view",true);'),"Only after AAL2 and server overview load dashboard opens");
 yes(admin.includes('const data=await call("/overview")'),"Role is taken from verified API overview, not query params");
 yes(admin.includes('if(!state.access||!["owner","operator","auditor"].includes(validatedRole))'),"Untrusted/admin role denied before import");
 yes(admin.includes('state.role!==validatedRole'),"Async role/session invalidation rechecked");
 yes(admin.includes('import("./admin-readiness-sandbox.js")'),"Only dashboard area dynamically imports module");
 yes(admin.includes('state.readinessSandbox=null'),"Sign out clears simulated session");
 yes(admin.includes('state.area==="readiness"?"overview":state.area'),"Real admin backend task write form never accepts fake readiness area");
 yes(backend.includes('claims.aal!=="aal2"'),"Existing real server AAL2 enforcement");
 yes(backend.includes('vorvan_admin_acl'),"Existing real server ACL enforcement");
 yes(!/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b|\bsessionStorage\b|\bsendBeacon\b|\bWebSocket\b/.test(sandbox.replace(/\/\*[\s\S]*?\*\//g,"")),"Sandbox engine never calls network/storage");
 yes(css.includes(".vor010-sandbox")&&css.includes("focus-visible"),"Styled focus and reusable admin UI");
 yes(html.includes("noindex,nofollow"),"Admin page not intended for indexation");
});
