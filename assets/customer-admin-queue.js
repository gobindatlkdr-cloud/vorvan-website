/** Restricted customer intake operations UI — owner AAL2 only, backend re-verifies.
 * Never place credentials or customer PII into logs, localStorage or demo fixtures.
 */
const API="https://kukfpsqujlutlgwndplh.supabase.co/functions/v1/customer-operations";
const PUB="sb_publishable_6KyGNqt8CGNlE8vCBdtalA_Ayhfo-Rj";
const STATUSES=["received","reviewing","needs_information","closed"];
const el=(tag,text="",cls="")=>{
 const node=document.createElement(tag);node.textContent=text;if(cls)node.className=cls;return node;
};
const add=(root,...children)=>{root.append(...children);return root;};
const info=(key,value)=>add(el("div","","coa-item"),el("span",key),el("strong",value||"Not provided"));
function choose(label,items,value){
 const select=el("select");select.setAttribute("aria-label",label);
 for(const item of items){const opt=el("option",item.replaceAll("_"," "));opt.value=item;select.append(opt)}
 select.value=value;return select;
}
export function mountCustomerOperations(root,context){
 if(!root||typeof root.replaceChildren!=="function"||
   !context||context.role!=="owner"||typeof context.accessToken!=="string"||
   context.accessToken.length<100)return {ok:false};
 let active=true;let entries=[];let running=false;
 const pane=el("section","","coa-panel");
 const title=el("h2","Customer Login & Loan Enquiries");
 const warning=el("p","Confidential customer contact records. Verified Owner / AAL2 MFA only. Non-binding loan information enquiries; no CIBIL scores, lending decisions or application records.");
 const reload=el("button","Refresh customer enquiries");reload.type="button";
 const message=el("p","Loading owner-only customer records…","coa-status");
 message.setAttribute("role","status");message.setAttribute("aria-live","polite");
 const total=el("p","","coa-totals");const queue=el("div","","coa-queue");
 add(pane,title,warning,reload,message,total,queue);
 root.replaceChildren(pane);
 async function api(path,method="GET",data=null){
  const response=await fetch(API+path,{method,cache:"no-store",headers:{
   apikey:PUB,authorization:"Bearer "+context.accessToken,"content-type":"application/json"
  },body:data===null?undefined:JSON.stringify(data)});
  const reply=await response.json().catch(()=>({}));
  if(!response.ok){
   const err=reply.code||"request_failed";
   throw Error(err);
  }
  return reply;
 }
 const feedback=text=>{message.textContent=text};
 function render(){
  queue.replaceChildren();total.textContent=entries.length+" visible recent enquiries (maximum 80). No credit scores are stored.";
  for(const item of entries){
   const profile=item.profile;
   const card=el("article","","coa-case");
   add(card,el("h3",(profile?.full_name||"Profile unavailable")+" · "+
      item.loan_category.replaceAll("_"," ")),
    el("p","Enquiry "+item.id+" · "+item.status.replaceAll("_"," ")+" · "+new Date(item.created_at).toLocaleString()));
   const grid=el("div","","coa-grid");
   add(grid,info("Verified email",profile?.email),info("Self-reported mobile",profile?.phone),
    info("Work category",profile?.work_category?.replaceAll("_"," ")),
    info("Occupation / working details",profile?.work_details),
    info("Enquiry topic",item.enquiry_topic.replaceAll("_"," ")),
    info("Customer question",item.message||"No additional message"),
    info("Contact-consent version",profile?.consent_version),
    info("Contact-consent recorded",profile?.consent_accepted_at));
   card.append(grid);
   const controls=el("form","","coa-controls");
   const status=choose("Review status for "+item.id,STATUSES,item.status);
   const reply=el("textarea");reply.rows=3;reply.maxLength=500;reply.value=item.staff_reply||"";
   reply.setAttribute("aria-label","Manual customer response for "+item.id);
   reply.placeholder="Manual informational response (no loan approval, sensitive identifiers or promises)";
   const save=el("button","Save manual review");save.type="submit";
   if(item.status==="closed"){status.disabled=true;reply.disabled=true;save.disabled=true}
   controls.append(add(el("label"),el("span","Manual review status"),status),
    add(el("label"),el("span","Response visible to this customer"),reply),save);
   controls.addEventListener("submit",async e=>{
    e.preventDefault();if(running)return;
    const answer=reply.value.trim();
    if(answer.length>500||/[<>\x00-\x1f]/.test(answer)||
      /[0-9]{12}|[A-Z]{5}[0-9]{4}[A-Z]/i.test(answer)){
     feedback("Remove sensitive numbers, PAN-like identifiers or markup from the response.");return;
    }
    if(item.status===status.value){feedback("Select a new status to create an auditable manual review event.");return}
    running=true;save.disabled=true;
    try{
     await api("/enquiries/"+encodeURIComponent(item.id),"PATCH",{
      status:status.value,staff_reply:answer,expected_updated_at:item.updated_at
     });
     feedback("Manual review saved with server-side audit. No lending decision was made.");
     await load(false);
    }catch(e){
     feedback(e.message==="stale_review_revision"?"This case changed. Refresh before trying again.":
      "Manual update was denied or unavailable. No approval was issued.");
    }finally{running=false;save.disabled=false}
   });
   card.append(controls);queue.append(card);
  }
  if(!entries.length)queue.append(el("p","No customer loan information enquiries yet."));
 }
 async function load(showProgress=true){
  if(!active||running&&showProgress)return;
  if(showProgress)feedback("Loading verified owner queue…");
  try{
   const data=await api("/enquiries");
   if(!active)return;
   if(!data.ok||!Array.isArray(data.items)||data.owner_only!==true)throw Error("not_authorized");
   entries=data.items;render();
   if(showProgress)feedback("Customer queue refreshed securely.");
  }catch(e){
   if(!active)return;
   entries=[];queue.replaceChildren();total.textContent="";
   feedback("Unable to open confidential customer queue. Verify Owner MFA access and backend availability.");
  }
 }
 reload.addEventListener("click",()=>load());
 load();
 return {ok:true,dispose:()=>{
  active=false;entries=[];root.replaceChildren();
 }};
}
