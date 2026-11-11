/** Actual browser module via fictional DOM; no browser/network dependency. */
import {createAiGovernanceSandbox} from "../../assets/ai-governance-sandbox.js";
function eq(a:unknown,b:unknown,n="assert"){if(a!==b)throw Error(n+" "+String(a)+" != "+String(b));}
function yes(a:unknown,n="assert"){if(!a)throw Error(n);}
class Fake{
 tag:string;textContent="";className="";value="";type="";disabled=false;hidden=false;attrs:Record<string,string>={};
 children:Fake[]=[];callbacks:Record<string,()=>void>={};
 constructor(tag:string){this.tag=tag;}
 append(...nodes:Fake[]){this.children.push(...nodes);}
 replaceChildren(...nodes:Fake[]){this.children=[...nodes];}
 setAttribute(k:string,v:string){this.attrs[k]=v;}
 addEventListener(k:string,fn:()=>void){this.callbacks[k]=fn;}
 fire(k:string){const f=this.callbacks[k];if(!f)throw Error("no "+k);f();}
}
const all=(root:Fake):Fake[]=>[root,...root.children.flatMap(all)];
Deno.test("VOR-014 Admin mount requires server-approved session gate and clears on sign-out",async()=>{
 const admin=await Deno.readTextFile("assets/admin.js");
 const html=await Deno.readTextFile("admin.html");
 yes(html.includes('data-area="governance"'),"nav link");
 yes(admin.includes('if(area==="governance"){'),"governance branch");
 yes(admin.includes('if(!state.access||!["owner","operator","auditor"].includes(validatedRole))'),"verified session/role");
 yes(admin.includes('import("./ai-governance-ui.js")'),"dynamic first-party module");
 yes(admin.includes('state.governanceSandbox=null'),"erase on sign out");
 yes(admin.includes('state.role!==validatedRole'),"role revalidation before mount");
});
Deno.test("Actual VOR-014 UI renders owner review, fixed reports, audit, blocked gates and reset",async()=>{
 const previousDocument=(globalThis as unknown as {document?:unknown}).document;
 const previousFetch=globalThis.fetch;let requests=0;
 globalThis.fetch=(()=>{requests++;throw Error("network forbidden")}) as typeof fetch;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const src=await Deno.readTextFile("assets/ai-governance-ui.js");
  yes(!/innerHTML|localStorage|sessionStorage|fetch\s*\(/.test(src),"no injection, persistence or network");
  const {mountAiGovernanceSandbox}=await import("../../assets/ai-governance-ui.js");
  const root=new Fake("div"),desk=createAiGovernanceSandbox("owner");
  eq(mountAiGovernanceSandbox(root,desk).ok,true);
  let nodes=all(root);
  yes(nodes.some(x=>x.textContent.includes("fictional model")), "fictional notice");
  yes(nodes.some(x=>x.textContent.includes("BLOCKED")), "locked gates rendered");
  yes(nodes.some(x=>x.textContent.includes("18 fixed test fixtures")), "safe aggregate rendered");
  const evalBtn=nodes.find(x=>x.textContent==="Run fictional policy evaluation");
  yes(evalBtn&&!evalBtn.disabled,"owner evaluation");
  evalBtn!.fire("click");eq(desk.snapshot().simulated_runs,1);
  nodes=all(root);
  const select=nodes.find(x=>x.attrs["aria-label"]==="Review decision for SYN-FLAG-001");
  const review=nodes.find(x=>x.textContent==="Record synthetic review");
  yes(select&&review,"fixed review inputs");select!.value="needs_human_review";
  review!.fire("click");eq(desk.snapshot().flags[0].status,"needs_human_review");
  eq(desk.snapshot().history.length,2);
  const erase=all(root).find(x=>x.textContent==="Erase synthetic review session");
  yes(erase&&!erase.disabled,"Owner reset");erase!.fire("click");
  eq(desk.snapshot().history.length,0);eq(requests,0);
 }finally{
  if(previousDocument===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=previousDocument;
  globalThis.fetch=previousFetch;
 }
});
Deno.test("UI Operator only sees operations policies; Auditor controls disabled",async()=>{
 const old=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const {mountAiGovernanceSandbox}=await import("../../assets/ai-governance-ui.js");
  const ops=new Fake("div"),o=createAiGovernanceSandbox("operator");
  eq(mountAiGovernanceSandbox(ops,o).ok,true);
  eq(o.snapshot().flags.length,3);
  yes(!all(ops).some(x=>x.textContent.includes("SYN-FLAG-001")),"no critical team flag");
  yes(all(ops).find(x=>x.textContent==="Erase synthetic review session")?.disabled,"operator reset locked");
  const audit=new Fake("div"),a=createAiGovernanceSandbox("auditor");
  eq(mountAiGovernanceSandbox(audit,a).ok,true);
  yes(all(audit).find(x=>x.textContent==="Run fictional policy evaluation")?.disabled,"auditor run locked");
  yes(all(audit).find(x=>x.textContent==="Record synthetic review")?.disabled,"auditor review locked");
  eq(a.snapshot().history.length,0);
 }finally{
  if(old===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=old;
 }
});
