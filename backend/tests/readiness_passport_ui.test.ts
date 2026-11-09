/** VOR-008 controller + actual UI module synthetic DOM tests, no browser/network/PII. */
import {createPassportSession} from "../../assets/readiness-controller.js";
function eq(a:unknown,b:unknown,label="assertion"){if(a!==b)throw Error(label+": expected "+String(b)+" got "+String(a));}
function yes(a:unknown,label:string){if(!a)throw Error(label);}
function evaluated(s:ReturnType<ReturnType<typeof createPassportSession>["snapshot"]>){
 const r=s.result;
 if(!r.ok||!("workflow_status" in r))throw Error("Expected validated evaluation");
 return r;
}
Deno.test("Passport controller: 3 categories, in-memory progress and incomplete states",()=>{
 for(const category of ["personal","business","education"]){
  const ctrl=createPassportSession({category,locale:"bn"});
  const s=ctrl.snapshot();eq(s.total,6);eq(s.answered,0);eq(s.percent,0);
  eq(evaluated(s).workflow_status,"needs_more_information");eq(s.consent_status,"unavailable_not_approved");
  eq(s.personal_information_received,false);
  yes(!ctrl.choose("9999999999"),"numeric private data input rejected");
  yes(!ctrl.choose("unknown"),"free-text choice rejected");
  yes(ctrl.choose("considered"),"fixed choice accepted");
  eq(ctrl.snapshot().answered,1);eq(ctrl.snapshot().percent,17);
  ctrl.next();eq(ctrl.snapshot().step,1);
  ctrl.choose("unsure");eq(ctrl.snapshot().answered,2);
  ctrl.passport();eq(evaluated(ctrl.snapshot()).workflow_status,"needs_more_information");
  eq(ctrl.snapshot().screen,"passport");
  ctrl.edit();eq(ctrl.snapshot().screen,"questions");
  ctrl.setLanguage("hi");eq(ctrl.snapshot().answered,2);
  eq(ctrl.snapshot().locale,"hi");
  ctrl.setCategory(category==="personal"?"business":"personal");
  eq(ctrl.snapshot().answered,0);eq(ctrl.snapshot().step,0);
  eq(ctrl.snapshot().screen,"questions");
  ctrl.reset();eq(ctrl.snapshot().answered,0);
 }
});
Deno.test("Passport rejects invalid navigation and unsafe category values",()=>{
 const ctrl=createPassportSession();
 yes(!ctrl.setCategory("short_term"),"unsupported product category must be refused");
 yes(!ctrl.setLanguage("fr"),"unsupported language must be refused");
 yes(!ctrl.goTo(9),"out-of-range index");
 yes(!ctrl.goTo(-1),"negative index");
 yes(!ctrl.goTo(1.5),"fractional index");
 eq(ctrl.snapshot().category,"personal");eq(ctrl.snapshot().locale,"en");
 for(let i=0;i<6;i++){ctrl.goTo(i);yes(ctrl.choose("not_yet"),"safe answer accepted");}
 const s=ctrl.snapshot();
 eq(s.answered,6);eq(evaluated(s).workflow_status,"educational_checklist_reviewed");
 eq(evaluated(s).next_steps.length,6);
 eq(evaluated(s).credit_score,null);
 eq(evaluated(s).eligibility_assessed,false);
 eq(evaluated(s).approval_or_offer_available,false);
});
class FakeElement{
 tag:string;
 children:FakeElement[]=[];
 textContent="";
 className="";
 type="";
 name="";
 value="";
 checked=false;
 hidden=false;
 disabled=false;
 focused=false;
 style:{width:string}={width:""};
 dataset:Record<string,string>={};
 attributes:Record<string,string>={};
 listeners:Record<string,(event?:unknown)=>void>={};
 classes=new Set<string>();
 classList:{toggle:(cls:string,on?:boolean)=>void};
 constructor(tag="div"){
  this.tag=tag;
  this.classList={toggle:(cls,on)=>{
    if(on??!this.classes.has(cls))this.classes.add(cls);else this.classes.delete(cls);
  }};
 }
 setAttribute(name:string,value:string){this.attributes[name]=String(value);}
 getAttribute(name:string){return this.attributes[name]||null;}
 append(...nodes:FakeElement[]){this.children.push(...nodes);}
 replaceChildren(...nodes:FakeElement[]){this.children=[...nodes];}
 addEventListener(name:string,handler:(event?:unknown)=>void){this.listeners[name]=handler;}
 focus(){this.focused=true;}
 fire(name:string,event?:unknown){const f=this.listeners[name];if(!f)throw Error(this.tag+" listener "+name+" missing");f(event);}
}
Deno.test("Actual VOR-008 UI script: multilingual, progress, editing, review, reset and no network",async()=>{
 const html=await Deno.readTextFile("readiness-passport.html");
 const css=await Deno.readTextFile("assets/readiness-passport.css");
 const js=await Deno.readTextFile("assets/readiness-passport.js");
 yes(html.includes("connect-src 'none'"),"Strict CSP must disallow network requests");
 yes(html.includes("form-action 'none'"),"Cannot submit a form");
 yes(html.includes('name="robots" content="noindex,follow"'),"Not indexed before legal/product approval");
 yes(!/<form\b|<textarea\b|<input\b[^>]*type=["'](?:text|email|number|password)/i.test(html),"No PII input fields");
 yes(js.includes('import {createPassportSession}'),"UI must use canonical VOR-007 controller");
 yes(!/\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\b/.test(js.replace(/\/\*[\s\S]*?\*\//g,"")),"UI must not call network/storage");
 yes(css.includes("prefers-reduced-motion:reduce"),"Reduced-motion style required");
 const elements=new Map<string,FakeElement>();
 for(const m of html.matchAll(/\bid="([^"]+)"/g))elements.set(m[1],new FakeElement());
 const btns:FakeElement[]=[];
 for(const c of ["personal","business","education"]){
  const el=new FakeElement("button");el.dataset.category=c;btns.push(el);
 }
 const page={lang:"en"};
 const document={
  documentElement:page,
  getElementById:(id:string)=>elements.get(id)||null,
  querySelectorAll:(selector:string)=>selector==="[data-category]"?btns:[],
  querySelector:(selector:string)=>{
    const c=selector.match(/^\[data-category="(personal|business|education)"\]$/)?.[1];
    return btns.find(x=>x.dataset.category===c)||null;
  },
  createElement:(tag:string)=>new FakeElement(tag),
  createTextNode:(value:string)=>new FakeElement("text-with-"+value),
 };
 const oldDocument=(globalThis as unknown as {document?:unknown}).document;
 const oldFetch=globalThis.fetch;
 (globalThis as unknown as {document:unknown}).document=document;
 globalThis.fetch=(()=>{throw Error("Unexpected network request from private Passport UI");}) as typeof fetch;
 try{
  await import("../../assets/readiness-passport.js");
  const get=(id:string)=>{const v=elements.get(id);if(!v)throw Error(id+" missing");return v;};
  eq(get("rp-error").hidden,true,"initial render succeeds");
  eq(get("rp-progress-label").textContent,"0 of 6 questions answered");
  eq(get("rp-choices").children.length,3,"three radio choices rendered");
  const radio=get("rp-choices").children[0].children[0];
  radio.checked=true;radio.fire("change");
  yes(get("rp-choices").children[0].children[0].focused,"selected radio retains keyboard focus after UI refresh");
  eq(get("rp-meter").getAttribute("aria-valuenow"),"1");
  eq(get("rp-progress-label").textContent,"1 of 6 questions answered");
  get("rp-next").fire("click");
  eq(get("rp-question-counter").textContent,"QUESTION 2 / 6");
  get("rp-review").fire("click");
  eq(get("rp-question-view").hidden,true);
  eq(get("rp-passport-view").hidden,false);
  eq(get("rp-stat-count").textContent,"1 / 6");
  eq(get("rp-stat-missing-count").textContent,"5");
  yes(get("rp-actions-list").children.length>=5,"Missing questions produce next steps");
  eq(get("rp-passport-heading").focused,true);
  eq(get("rp-plan-milestones").children.length,3,"VOR-009 renders 30/60/90-day milestones");
  eq(get("rp-plan-progressbar").getAttribute("aria-valuenow"),"0");
  const taskButton=get("rp-plan-milestones").children[0].children[1].children[0].children[0];
  taskButton.fire("click");
  eq(get("rp-plan-progressbar").getAttribute("aria-valuenow"),"1","Task progress distinct from quiz progress");
  eq(get("rp-stat-count").textContent,"1 / 6","Task completion cannot modify questionnaire");
  const day=get("rp-simulated-day");
  day.value="29";day.fire("change",{currentTarget:day});
  eq(get("rp-reminder-toggle").getAttribute("aria-pressed"),"false","Fake reminder disabled by default");
  get("rp-reminder-toggle").fire("click");
  eq(get("rp-reminder-toggle").getAttribute("aria-pressed"),"true");
  yes(get("rp-reminder-output").textContent.includes("Nothing will be sent."),"Fictional reminder never delivers");
  get("rp-edit").fire("click");
  eq(get("rp-passport-view").hidden,true);
  const select=get("rp-language");
  select.value="bn";select.fire("change",{currentTarget:select});
  eq(page.lang,"bn");eq(get("rp-meter").getAttribute("aria-valuenow"),"1");
  eq(get("rp-plan-progressbar").getAttribute("aria-valuenow"),"1","Language change retains fake task progress");
  yes(get("rp-plan-heading").textContent.includes("৯০ দিনের"),"Bengali educational plan title");
  yes(get("rp-question-note").textContent.includes("কাল্পনিক"),"Bengali UI translated");
  select.value="hi";select.fire("change",{currentTarget:select});
  eq(page.lang,"hi");
  yes(get("rp-plan-heading").textContent.includes("दिन"),"Hindi 90-day heading");
  yes(get("rp-category-title").textContent.includes("विषय"),"Hindi UI translated");
  btns.find(x=>x.dataset.category==="business")!.fire("click");
  eq(get("rp-meter").getAttribute("aria-valuenow"),"0","Category change clears ephemeral answers");
  eq(get("rp-plan-progressbar").getAttribute("aria-valuenow"),"0","Category change resets task progress");
  eq(get("rp-reminder-toggle").getAttribute("aria-pressed"),"false","Category change disables reminder preview");
  eq(get("rp-question-counter").textContent,"प्रश्न 1 / 6");
  get("rp-review").fire("click");
  yes(get("rp-result-status").textContent.includes("विचार"),"Hindi incomplete result");
  get("rp-reset").fire("click");
  eq(get("rp-passport-view").hidden,true);eq(get("rp-meter").getAttribute("aria-valuenow"),"0");
  eq(get("rp-plan-progressbar").getAttribute("aria-valuenow"),"0","Full restart resets milestones");
  eq(get("rp-error").hidden,true);
 }finally{
  if(oldDocument===undefined)delete (globalThis as unknown as {document?:unknown}).document;
  else (globalThis as unknown as {document:unknown}).document=oldDocument;
  globalThis.fetch=oldFetch;
 }
});
