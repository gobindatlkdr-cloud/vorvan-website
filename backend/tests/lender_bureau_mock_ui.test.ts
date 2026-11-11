/** VOR-018 actual first-party offline Admin adapter lab DOM tests. */
import {createLenderBureauMockSandbox} from "../../assets/lender-bureau-mock.js";
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+" got "+String(a)+" expected "+String(b));}
function yes(x:unknown,label="assert"){if(!x)throw Error(label);}
class Fake{
 tag:string;textContent="";className="";value="";type="";disabled=false;hidden=false;
 attrs:Record<string,string>={};children:Fake[]=[];events:Record<string,()=>void>={};
 constructor(tag:string){this.tag=tag;}
 append(...nodes:Fake[]){this.children.push(...nodes);}
 replaceChildren(...nodes:Fake[]){this.children=[...nodes];}
 setAttribute(k:string,v:string){this.attrs[k]=String(v);}
 addEventListener(k:string,cb:()=>void){this.events[k]=cb;}
 fire(k:string){if(!this.events[k])throw Error("missing event "+k);this.events[k]();}
}
const all=(root:Fake):Fake[]=>[root,...root.children.flatMap(all)];
const byText=(root:Fake,label:string)=>all(root).find(x=>x.textContent===label);
const byLabel=(root:Fake,label:string)=>all(root).find(x=>x.attrs["aria-label"]===label);
Deno.test("VOR-018 is Admin AAL2/ACL-gated and isolated from real task write operations",async()=>{
 const [html,admin]=await Promise.all([Deno.readTextFile("admin.html"),Deno.readTextFile("assets/admin.js")]);
 yes(html.includes('data-area="adapters"'),"Admin navigation present");
 yes(html.includes('id="dashboard-view" class="workspace" hidden'),"dashboard closed before auth");
 yes(!/<script[^>]+src="assets\/lender-bureau-mock-ui\.js"/.test(html),"no public standalone initializer");
 yes(admin.includes('if(area==="adapters"){'),"scoped area");
 yes(admin.includes('if(!state.access||!["owner","operator","auditor"].includes(validatedRole))'),"auth and role gate");
 yes(admin.includes('import("./lender-bureau-mock-ui.js")'),"lazy module");
 yes(admin.includes('state.area!=="adapters"||!state.access||state.role!==validatedRole'),"async revalidation");
 yes(admin.includes('state.adapterSandbox=null'),"logout and role change memory cleanup");
 yes(admin.includes('state.area==="payments"||state.area==="adapters"'),"synthetic-only no task API");
});
Deno.test("Real UI Owner runs fictional response and 503 retry, never contacts bureau",async()=>{
 const prev=(globalThis as unknown as {document?:unknown}).document,prevFetch=globalThis.fetch;
 let attempts=0;
 globalThis.fetch=(()=>{attempts++;throw Error("unexpected API request")}) as typeof fetch;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const source=await Deno.readTextFile("assets/lender-bureau-mock-ui.js");
  yes(!/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|sendBeacon/.test(source),"no network/storage/HTML injection");
  const {mountLenderBureauMockSandbox}=await import("../../assets/lender-bureau-mock-ui.js");
  const root=new Fake("main"),desk=createLenderBureauMockSandbox("owner");
  eq(mountLenderBureauMockSandbox(root,desk).ok,true);
  yes(all(root).some(x=>x.textContent.includes("No CIBIL/credit bureau lookup")),"CIBIL notice");
  const button=byText(root,"Run offline adapter fixture");
  yes(button?.disabled,"notice gate");
  byText(root,"Acknowledge fictional notice")!.fire("click");
  yes(!button?.disabled,"consent training acknowleged");
  const scenario=byLabel(root,"Fictional bureau/lender response");
  yes(scenario,"fixed scenario selector");
  scenario!.value="illustrative_outage";
  button!.fire("click");
  eq(desk.snapshot().calls[0].status,"mock_unavailable");
  let retry=byText(root,"Retry one fictional outage");
  yes(retry&&!retry.disabled,"single retry control");
  retry!.fire("click");
  eq(desk.snapshot().calls[0].retry_count,1);
  retry=byText(root,"Retry one fictional outage");
  yes(retry?.disabled,"bounded retry");
  eq(attempts,0);
  yes(all(root).some(x=>x.textContent.startsWith("BLOCKED:")),"release gates");
  byText(root,"Erase mock call history")!.fire("click");
  eq(desk.snapshot().calls.length,0);eq(desk.snapshot().audit.length,0);
 }finally{
  if(prev===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=prev;
  globalThis.fetch=prevFetch;
 }
});
Deno.test("Owner switches partners and category choices are bound to provider contract",async()=>{
 const prev=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const {mountLenderBureauMockSandbox}=await import("../../assets/lender-bureau-mock-ui.js");
  const root=new Fake("div"),desk=createLenderBureauMockSandbox("owner");
  eq(mountLenderBureauMockSandbox(root,desk).ok,true);
  byText(root,"Acknowledge fictional notice")!.fire("click");
  const p=byLabel(root,"Fictional lender contract")!,category=byLabel(root,"Fictional loan category")!;
  eq(category.children.length,3);
  p.value="DEMO-LENDER-BETA";p.fire("change");
  eq(category.children.length,2);eq(category.value,"personal");
  category.value="short_term";
  byText(root,"Run offline adapter fixture")!.fire("click");
  eq(desk.snapshot().calls[0].category,"short_term");eq(desk.snapshot().calls[0].partner_id,"DEMO-LENDER-BETA");
  eq(desk.snapshot().calls[0].response.lender_offer_count,0);
 }finally{
  if(prev===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=prev;
 }
});
Deno.test("Operator only Alpha fictional lender; Auditor read-only",async()=>{
 const prev=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const {mountLenderBureauMockSandbox}=await import("../../assets/lender-bureau-mock-ui.js");
  const r=new Fake("main"),operator=createLenderBureauMockSandbox("operator");
  eq(mountLenderBureauMockSandbox(r,operator).ok,true);
  eq(byLabel(r,"Fictional lender contract")?.children.length,1);
  byText(r,"Acknowledge fictional notice")!.fire("click");
  byText(r,"Run offline adapter fixture")!.fire("click");
  eq(operator.snapshot().calls.length,1);
  yes(byText(r,"Erase mock call history")?.disabled,"operator cannot reset");
  const ar=new Fake("main"),aud=createLenderBureauMockSandbox("auditor");
  eq(mountLenderBureauMockSandbox(ar,aud).ok,true);
  byText(ar,"Acknowledge fictional notice")!.fire("click");
  yes(byText(ar,"Run offline adapter fixture")?.disabled,"auditor cannot call");
  yes(byText(ar,"Erase mock call history")?.disabled,"auditor cannot reset");
  eq(aud.snapshot().calls.length,0);
 }finally{
  if(prev===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=prev;
 }
});
