/** VOR-012 — execute actual browser UI in synthetic DOM; no browser network/storage. */
import {NOTICES} from "../../assets/vyn-coach-notices.js";
function eq(x:unknown,y:unknown,name="assert"){if(x!==y)throw Error(name+": "+String(x)+" != "+String(y));}
function yes(x:unknown,name:string){if(!x)throw Error(name);}
class Fake {
 tag:string;id="";value="";textContent="";hidden=false;checked=false;disabled=false;
 href="";htmlFor="";placeholder="";className="";type="";
 children:Fake[]=[];dataset:Record<string,string>={};
 listeners:Record<string,()=>void>={};attrs:Record<string,string>={};focused=false;
 constructor(tag="div"){this.tag=tag;}
 append(...items:Fake[]){this.children.push(...items);}
 replaceChildren(...items:Fake[]){this.children=[...items];}
 get options(){return this.children.filter(c=>c.tag==="option");}
 setAttribute(n:string,v:string){this.attrs[n]=v;}
 removeAttribute(n:string){delete this.attrs[n];if(n==="href")this.href="";}
 addEventListener(name:string,f:()=>void){this.listeners[name]=f;}
 focus(){this.focused=true;}
 fire(name:string){const f=this.listeners[name];if(!f)throw Error("listener missing: "+name);f();}
}
Deno.test("Actual Vyn Coach DOM: consent gating, progress, tri-language, PII blocking, support, revoke",async()=>{
 const html=await Deno.readTextFile("vyn-coach-sandbox.html");
 const js=await Deno.readTextFile("assets/vyn-coach-ui.js");
 const css=await Deno.readTextFile("assets/vyn-coach-sandbox.css");
 yes(html.includes("connect-src 'none'"),"Network CSP must be disabled");
 yes(html.includes("form-action 'none'"),"No form submission allowed");
 yes(html.includes('name="robots" content="noindex,nofollow"'),"No marketing/indexing before legal approval");
 yes(html.includes('src="assets/vyn-coach-ui.js"'),"Only first-party UI module");
 yes(html.includes('id="vc-terms"')&&html.includes('id="vc-privacy"')&&html.includes('id="vc-opt-in"'),"Distinct consent gates");
 yes(html.includes('id="vc-terms-notice-text"')&&html.includes('id="vc-privacy-notice-text"'),"Actual notices visible");
 yes(!/<form\b/i.test(html),"Not a real customer submission form");
 yes(!/localStorage|sessionStorage|XMLHttpRequest|sendBeacon|\bfetch\s*\(/.test(js),"UI must not use network or storage");
 yes(css.includes("prefers-reduced-motion:reduce"),"Reduced motion styles");
 yes(css.includes("--burgundy:#741943"),"Approved VORVAN Burgundy");
 const elements=new Map<string,Fake>();
 for(const m of html.matchAll(/\bid="([^"]+)"/g)){
  if(elements.has(m[1]))throw Error("Duplicate HTML id "+m[1]);
  elements.set(m[1],new Fake());
 }
 const get=(id:string)=>{const item=elements.get(id);if(!item)throw Error("missing "+id);return item;};
 const page={lang:"en"};
 const root=get("vc-app");root.dataset={};
 root["querySelector" as "id"]=undefined as never; // replaced below without external libraries
 (root as unknown as {querySelector:(selector:string)=>Fake|null}).querySelector=(selector)=>
  selector.startsWith("#")?elements.get(selector.slice(1))||null:null;
 for(const [id,values] of [
  ["vc-topic",["plan","questions","privacy","human"]],
  ["vc-category",["personal","business","education"]],
  ["vc-language",["en","bn","hi"]],
 ] as const){
  const select=get(id);select.tag="select";select.value=values[0];
  for(const choice of values){const opt=new Fake("option");opt.value=choice;select.append(opt);}
 }
 const note=get("vc-prompt"),answer=get("vc-answer");
 const old=(globalThis as unknown as {document?:unknown}).document;
 const fetchOld=globalThis.fetch;
 const doc={
  documentElement:page,
  getElementById:(id:string)=>elements.get(id)||null,
  createElement:(tag:string)=>new Fake(tag)
 };
 (globalThis as unknown as {document:unknown}).document=doc;
 let requests=0;
 globalThis.fetch=(()=>{requests++;throw Error("Unexpected external request");}) as typeof fetch;
 try{
  await import("../../assets/vyn-coach-ui.js");
  eq(root.dataset.coachMode,"synthetic_only");eq(root.dataset.noNetwork,"true");
  eq(get("vc-coach").hidden,true,"Coaching hidden without consent");
  eq(get("vc-consent-gate").hidden,false,"Consent must show");
  get("vc-start").fire("click");
  eq(get("vc-coach").hidden,true);
  yes(get("vc-status").textContent.includes("three checkboxes"),"Blocked consent");
  get("vc-terms").checked=true;get("vc-privacy").checked=true;
  get("vc-opt-in").checked=true;get("vc-start").fire("click");
  eq(get("vc-coach").hidden,false);
  eq(get("vc-consent-gate").hidden,true);
  eq(get("vc-questions").children.length,6);
  eq(get("vc-progress").textContent,"0 / 6 fictional topics reviewed");
  yes(get("vc-category").focused,"Focus moves to safe content after consent");
  const first=get("vc-questions").children[0].children[1];
  first.value="considered";first.fire("change");
  yes(get("vc-progress").textContent.startsWith("1 / 6"),"One synthetic answer");
  first.value="";first.fire("change");
  yes(get("vc-progress").textContent.startsWith("0 / 6"),"Clear choice");
  note.value="OTP is 496031";
  get("vc-send").fire("click");
  eq(note.value,"","Raw prompt cleared immediately");
  yes(!answer.textContent.includes("496031"),"No reflected OTP");
  yes(answer.textContent.includes("Sensitive-looking text"),"Safe response");
  eq(get("vc-human").hidden,false);
  eq(get("vc-human").href,"mailto:support@vorvan.co.in");
  get("vc-topic").value="privacy";get("vc-send").fire("click");
  eq(get("vc-human").href,"mailto:legal@vorvan.co.in");
  get("vc-language").value="bn";get("vc-language").fire("change");
  eq(page.lang,"bn");
  eq(get("vc-terms-notice-text").textContent,NOTICES.terms_acknowledgement.bn);
  eq(get("vc-privacy-notice-text").textContent,NOTICES.privacy_acknowledgement.bn);
  get("vc-topic").value="plan";get("vc-send").fire("click");
  yes(answer.textContent.includes("শিক্ষামূলক"),"Bengali educational response");
  get("vc-language").value="hi";get("vc-language").fire("change");
  eq(page.lang,"hi");
  eq(get("vc-terms-notice-text").textContent,NOTICES.terms_acknowledgement.hi);
  get("vc-send").fire("click");
  yes(answer.textContent.includes("शैक्षिक"),"Hindi educational response");
  get("vc-category").value="education";get("vc-category").fire("change");
  eq(get("vc-questions").children.length,6);
  yes(get("vc-progress").textContent.startsWith("0 / 6"),"Category resets answers");
  get("vc-revoke").fire("click");
  eq(get("vc-coach").hidden,true);eq(get("vc-consent-gate").hidden,false);
  eq(get("vc-terms").checked,false);eq(get("vc-privacy").checked,false);
  eq(get("vc-opt-in").checked,false);eq(get("vc-questions").children.length,0);
  eq(get("vc-human").href,"");eq(get("vc-human").hidden,true);
  eq(requests,0);
 }finally{
  if(old===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=old;
  globalThis.fetch=fetchOld;
 }
});
