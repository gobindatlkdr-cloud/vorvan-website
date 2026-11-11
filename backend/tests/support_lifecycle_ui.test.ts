import {createSupportLifecycleSandbox} from "../../assets/support-lifecycle-sandbox.js";
function eq(a:unknown,b:unknown,n="assert"){if(a!==b)throw Error(n+": "+String(a)+" != "+String(b));}
function yes(a:unknown,n:string){if(!a)throw Error(n);}
class Fake {
 tag:string;textContent="";className="";value="";type="";disabled=false;hidden=false;selected=false;attrs:Record<string,string>={};
 children:Fake[]=[];callbacks:Record<string,()=>void>={};
 constructor(tag:string){this.tag=tag;}
 append(...nodes:Fake[]){this.children.push(...nodes);}
 replaceChildren(...nodes:Fake[]){this.children=[...nodes];}
 setAttribute(k:string,v:string){this.attrs[k]=v;}
 addEventListener(k:string,fn:()=>void){this.callbacks[k]=fn;}
 fire(k:string){const fn=this.callbacks[k];if(!fn)throw Error("no "+k);fn();}
}
const all=(node:Fake):Fake[]=>[node,...node.children.flatMap(all)];
Deno.test("VOR-013 actual UI mounts synthetic support queue; Owner can create/advance and Auditor cannot mutate",async()=>{
 const old=(globalThis as unknown as {document?:unknown}).document;
 const src=await Deno.readTextFile("assets/admin.js");
 yes(src.includes('if(area==="support"){'),"Admin support branch");
 yes(src.includes('if(!state.access||!["owner","operator","auditor"].includes(validatedRole))'),"MFA admin gate");
 yes(src.includes('import("./support-lifecycle-ui.js")'),"First-party dynamic module");
 yes(src.includes('state.supportSandbox=null'),"Session signout wipes in-memory support");
 yes(!/localStorage|sessionStorage|fetch\s*\(/.test(await Deno.readTextFile("assets/support-lifecycle-ui.js")),"No network or browser persistence");
 let requests=0;const prevFetch=globalThis.fetch;
 globalThis.fetch=(()=>{requests++;throw Error("unexpected API request")}) as typeof fetch;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const mod=await import("../../assets/support-lifecycle-ui.js");
  const root=new Fake("div");
  const desk=mod.createSupportLifecycleSandbox("owner");
  eq(mod.mountSupportLifecycleSandbox(root,desk).ok,true);
  let found=all(root);
  const create=found.find(x=>x.textContent==="Create fictional case");
  yes(create,"create button");
  create!.fire("click");
  eq(desk.snapshot().cases.length,1);eq(desk.snapshot().audit.length,1);
  found=all(root);
  const advance=found.find(x=>x.textContent.startsWith("Advance demo clock"));
  yes(advance,"owner time control");advance!.fire("click");
  eq(desk.snapshot().cases[0].sla.overdue,false,"48h general category");
  const reset=all(root).find(x=>x.textContent.startsWith("Erase demo cases"));
  yes(reset,"owner reset");reset!.fire("click");
  eq(desk.snapshot().cases.length,0);eq(desk.snapshot().audit.length,0);
  const auditor=mod.createSupportLifecycleSandbox("auditor"), auditorRoot=new Fake("div");
  eq(mod.mountSupportLifecycleSandbox(auditorRoot,auditor).ok,true);
  const auditorCreate=all(auditorRoot).find(x=>x.textContent==="Create fictional case");
  yes(auditorCreate?.disabled,"auditor create button disabled");
  const auditorShift=all(auditorRoot).find(x=>x.textContent.startsWith("Advance demo clock"));
  yes(auditorShift?.disabled,"auditor clock disabled");
  eq(auditor.intake({mode:"synthetic_only",category:"security",preset:"security"}).ok,false);
  eq(requests,0,"no network ever used");
 }finally{
  if(old===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=old;
  globalThis.fetch=prevFetch;
 }
});
