/** VOR-016 first-party UI tests against actual synthetic DOM. */
import {createPrivacyRequestsSandbox} from "../../assets/privacy-requests-sandbox.js";
function eq(a:unknown,b:unknown,label="assert"){if(a!==b)throw Error(label+" got "+String(a)+" wanted "+String(b));}
function yes(value:unknown,label="assert"){if(!value)throw Error(label);}
class Fake {
 tag:string;textContent="";className="";value="";type="";disabled=false;hidden=false;
 attrs:Record<string,string>={};children:Fake[]=[];callbacks:Record<string,()=>void>={};
 constructor(tag:string){this.tag=tag;}
 append(...nodes:Fake[]){this.children.push(...nodes);}
 replaceChildren(...nodes:Fake[]){this.children=[...nodes];}
 setAttribute(k:string,v:string){this.attrs[k]=String(v);}
 addEventListener(k:string,cb:()=>void){this.callbacks[k]=cb;}
 fire(k:string){if(!this.callbacks[k])throw Error("missing "+k+" listener");this.callbacks[k]();}
}
const all=(x:Fake):Fake[]=>[x,...x.children.flatMap(all)];
const find=(root:Fake,label:string)=>all(root).find(x=>x.textContent===label);
Deno.test("VOR-016 dashboard is reachable only after existing verified AAL2 and authorized role",async()=>{
 const [admin,html]=await Promise.all([Deno.readTextFile("assets/admin.js"),Deno.readTextFile("admin.html")]);
 yes(admin.includes('if(area==="privacy"){'),"privacy gated area");
 yes(admin.includes('if(!state.access||!["owner","operator","auditor"].includes(validatedRole))'),"session and ACL gate");
 yes(admin.includes('import("./privacy-requests-ui.js")'),"first-party dynamic UI");
 yes(admin.includes('state.privacySandbox=null'),"logout and role-change reset");
 yes(admin.includes('state.area==="readiness"||state.area==="governance"||state.area==="privacy"'),"isolate all demos from real Admin task write");
 yes(admin.includes('state.role!==validatedRole'),"async role/session invalidate");
 yes(html.includes('data-area="privacy"'),"Admin navigation");
 yes(html.includes('id="dashboard-view" class="workspace" hidden'),"AAL2-verified dashboard hidden until login");
 yes(!/<script[^>]+src="assets\/privacy-requests-ui\.js"/.test(html),"no standalone page initialization");
});
Deno.test("Owner UI uses fixed choices and canonical demo notice, creates case and export preview without network",async()=>{
 const old=(globalThis as unknown as {document?:unknown}).document,previousFetch=globalThis.fetch;
 let calls=0;
 globalThis.fetch=(()=>{calls++;throw Error("forbidden network")}) as typeof fetch;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const source=await Deno.readTextFile("assets/privacy-requests-ui.js");
  yes(!/innerHTML|sessionStorage|localStorage|\bfetch\s*\(|sendBeacon/.test(source),"first-party text-only/no storage");
  const {mountPrivacyRequestsSandbox}=await import("../../assets/privacy-requests-ui.js");
  const root=new Fake("div"),desk=createPrivacyRequestsSandbox("owner");
  eq(mountPrivacyRequestsSandbox(root,desk).ok,true);
  const createButton=find(root,"Create fictional privacy request");
  yes(createButton?.disabled,"notice gate prevents creation");
  const acknowledge=find(root,"Acknowledge fictional privacy notice");
  yes(acknowledge,"canonical notice acknowledgment button");acknowledge!.fire("click");
  yes(!createButton?.disabled,"owner enabled");
  const type=all(root).find(x=>x.attrs["aria-label"]==="Fictional privacy request type");
  yes(type,"type selector");type!.value="export";
  createButton!.fire("click");
  let snap=desk.snapshot();eq(snap.requests.length,1);eq(snap.requests[0].status,"submitted");
  let verify=find(root,"Simulate identity fixture match");
  yes(verify,"identity step");verify!.fire("click");
  let review=find(root,"Start synthetic review");yes(review,"review step");review!.fire("click");
  let approve=find(root,"Owner approves simulated handling");yes(approve,"approval step");approve!.fire("click");
  let preview=find(root,"Preview synthetic JSON only");yes(preview,"fixed JSON preview");
  preview!.fire("click");
  snap=desk.snapshot();eq(snap.requests[0].preview_issued,true);eq(snap.real_exports,0);
  const pre=all(root).find(x=>x.attrs["aria-label"]==="Fictional export preview");
  yes(pre?.textContent.includes("fictional_profile"),"invented preview");
  let complete=find(root,"Mark fictional processing complete");
  yes(complete,"complete button");complete!.fire("click");
  eq(desk.snapshot().requests[0].status,"simulated_complete");
  eq(desk.snapshot().audit.length,6);
  yes(all(root).some(x=>x.textContent.includes("BLOCKED:")),"release gates");
  eq(calls,0,"no network request");
  find(root,"Erase all fictional privacy work")!.fire("click");
  eq(desk.snapshot().requests.length,0);eq(desk.snapshot().audit.length,0);
 }finally{
  if(old===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=old;
  globalThis.fetch=previousFetch;
 }
});
Deno.test("Auditor UI cannot create or mutate; Operator cannot access deletion workflow",async()=>{
 const previous=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const {mountPrivacyRequestsSandbox}=await import("../../assets/privacy-requests-ui.js");
  const auditor=new Fake("main"),a=createPrivacyRequestsSandbox("auditor");
  eq(mountPrivacyRequestsSandbox(auditor,a).ok,true);
  const button=find(auditor,"Create fictional privacy request");
  yes(button?.disabled,"auditor initial disabled");
  find(auditor,"Acknowledge fictional privacy notice")!.fire("click");
  yes(button?.disabled,"auditor remains disabled");
  yes(find(auditor,"Erase all fictional privacy work")?.disabled,"auditor reset disabled");
  eq(a.snapshot().requests.length,0);
  const operator=new Fake("main"),o=createPrivacyRequestsSandbox("operator");
  eq(mountPrivacyRequestsSandbox(operator,o).ok,true);
  find(operator,"Acknowledge fictional privacy notice")!.fire("click");
  const choice=all(operator).find(x=>x.attrs["aria-label"]==="Fictional privacy request type");
  choice!.value="deletion";find(operator,"Create fictional privacy request")!.fire("click");
  eq(o.snapshot().requests.length,0);
  choice!.value="correction";find(operator,"Create fictional privacy request")!.fire("click");
  eq(o.snapshot().requests.length,1);
  eq(o.snapshot().requests[0].request_type,"correction");
  yes(find(operator,"Erase all fictional privacy work")?.disabled,"operator cannot reset");
 }finally{
  if(previous===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=previous;
 }
});
Deno.test("Trilingual fixed privacy notices and keyboard-label sources remain supported",async()=>{
 const old=(globalThis as unknown as {document?:unknown}).document;
 (globalThis as unknown as {document:unknown}).document={createElement:(tag:string)=>new Fake(tag)};
 try{
  const {mountPrivacyRequestsSandbox}=await import("../../assets/privacy-requests-ui.js");
  const root=new Fake("main");eq(mountPrivacyRequestsSandbox(root,createPrivacyRequestsSandbox("owner")).ok,true);
  const locale=all(root).find(x=>x.attrs["aria-label"]==="Demo privacy notice language");
  const note=all(root).find(x=>x.className==="vor016-notice");
  yes(locale&&note,"notice selector and text");
  locale!.value="bn";locale!.fire("change");yes(note!.textContent.includes("গোপনীয়তা"),"Bengali canonical notice");
  locale!.value="hi";locale!.fire("change");yes(note!.textContent.includes("गोपनीयता"),"Hindi canonical notice");
  yes(all(root).some(x=>x.attrs["aria-label"]==="Fictional identity fixture"),"accessible fixture selector");
 }finally{
  if(old===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=old;
 }
});
