(()=>{"use strict";
const form=document.getElementById("vv-institutional-inquiry-form");if(!form)return;
const status=document.getElementById("vv-institutional-status"),submit=form.querySelector('button[type="submit"]');
const personal=new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","live.com","proton.me","rediffmail.com"]);
// Keep the SAME submission UUID while retrying an uncertain/failed response in this tab.
let pendingId=null,lastSubmission=null;
function msg(text,ok){status.textContent=text;status.className="vv-inquiry-status "+(ok?"ok":"error");}
function val(name){return form.elements.namedItem(name)?.value?.trim()||"";}
function source(){const s=(new URLSearchParams(location.search).get("utm_source")||"").toLowerCase();return ["google","linkedin","email","direct"].includes(s)?s:s?"other":"unknown";}
form.addEventListener("submit",async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 if(val("homepage"))return;
 const email=val("official_email").toLowerCase(),domain=email.split("@")[1]||"";
 if(personal.has(domain)){msg("Please use an official bank/NBFC email address.",false);return;}
 const p={
  institution_type:val("institution_type"),institution_name:val("institution_name"),
  institution_website:val("institution_website"),contact_name:val("contact_name"),
  designation:val("designation"),official_email:email,business_phone:val("business_phone"),
  partnership_track:val("partnership_track"),agenda:val("agenda"),
  source_channel:source(),homepage:val("homepage"),consent:form.elements.namedItem("consent").checked
 };
 const content=JSON.stringify(p);
 if(lastSubmission!==content){pendingId=null;lastSubmission=content;}
 if(!pendingId){
  if(!globalThis.crypto?.randomUUID){msg("Secure submission is unavailable in this browser.",false);return;}
  pendingId=crypto.randomUUID();
 }
 p.submission_id=pendingId;
 submit.disabled=true;submit.textContent="Submitting…";msg("Sending secure institutional inquiry…",true);
 try{
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),12000);
  let response;
  try{response=await fetch("https://kukfpsqujlutlgwndplh.supabase.co/functions/v1/institutional-inquiries",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(p),signal:ctrl.signal,cache:"no-store"});}
  finally{clearTimeout(timeout);}
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.code==="rate_limited"?"Too many requests. Please email partnerships@vorvan.co.in.":result.code==="invalid_institutional_inquiry"?"Please check all fields and use an official corporate email.":"The online service could not accept your inquiry.");
  const ref=result.reference?" Reference: "+result.reference+".":"";
  msg("Thank you. Your institutional inquiry has been received for manual review."+ref+" This does not provide partner access.",true);
  form.reset();pendingId=null;lastSubmission=null;submit.textContent="Inquiry received";return;
 }catch(e){msg((e?.message||"Submission unavailable.")+" You may retry with the unchanged form; the submission reference remains the same. Delivery may already have succeeded. Alternatively email partnerships@vorvan.co.in.",false);}
 finally{if(!status.textContent.includes("has been received")){submit.disabled=false;submit.textContent="Submit institutional inquiry";}}
});
})();