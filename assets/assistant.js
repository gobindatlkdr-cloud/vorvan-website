/* Bian — an original animated VORVAN website guide.
 * CSS-only mascot movement, no GIF or copied third-party artwork.
 * Live replies use VORVAN's free-tier rules-based FAQ backend; no external LLM.
 * No app cookies, saved chat history or client analytics. */
(()=>{
"use strict";
const root=document.getElementById("vv-assistant");
if(!root)return;
const endpoint="https://kukfpsqujlutlgwndplh.supabase.co/functions/v1/site-assistant";
const $=(selector)=>root.querySelector(selector);
const launch=$("[data-guide-launch]"),popup=$("[data-guide-panel]");
const close=$("[data-guide-close]"),feed=$("[data-guide-feed]");
const field=$("[data-guide-input]"),send=$("[data-guide-send]");
const lang=$("[data-guide-language]"),topics=root.querySelector(".vv-chat-options");
const composer=root.querySelector(".vv-chat-row");
const labels={
 en:{
  hello:"Hello 👋",intro:"Hello, I am Bian, your support assistant. I am here to help you.",
  choose:"Please choose your language.",ready:"I'm here to help with VORVAN, direct LSP partnerships, lending APIs and support. Choose a topic or ask a question.",
  fallback:"Bian's live guide is temporarily unavailable. Please email info@vorvan.co.in.",
  privacy:"Please do not share phone numbers, PAN/Aadhaar, email addresses or personal financial data.",
  topics:{partnership:"LSP partnership",api:"Lending API",credit:"Credit app",support:"Support",legal:"Legal",contact:"Emails"}
 },
 bn:{
  hello:"হ্যালো 👋",intro:"আমি Bian, VORVAN-এর সাপোর্ট অ্যাসিস্ট্যান্ট। আপনাকে সাহায্য করতে এখানে আছি।",
  choose:"আপনার ভাষা নির্বাচন করুন।",ready:"VORVAN, সরাসরি LSP পার্টনারশিপ, লোন API বা সাপোর্ট সম্পর্কে জানতে নিচের অপশন বাছুন অথবা প্রশ্ন লিখুন।",
  fallback:"Bian-এর লাইভ গাইড এখন কাজ করছে না। info@vorvan.co.in-এ মেইল করুন।",
  privacy:"ফোন নম্বর, PAN/Aadhaar, ইমেইল বা ব্যক্তিগত আর্থিক তথ্য এখানে দেবেন না।",
  topics:{partnership:"LSP পার্টনারশিপ",api:"লোন API",credit:"ক্রেডিট অ্যাপ",support:"সাপোর্ট",legal:"লিগ্যাল",contact:"ইমেইল"}
 },
 hi:{
  hello:"नमस्ते 👋",intro:"मैं Bian हूँ, VORVAN का सपोर्ट असिस्टेंट। मैं आपकी मदद के लिए यहाँ हूँ।",
  choose:"अपनी भाषा चुनें।",ready:"VORVAN, सीधे LSP पार्टनरशिप, लेंडिंग API और सहायता के लिए विषय चुनें या सवाल लिखें।",
  fallback:"Bian की लाइव सहायता अभी उपलब्ध नहीं है। info@vorvan.co.in पर लिखें।",
  privacy:"कृपया फ़ोन, PAN/Aadhaar, ईमेल या निजी वित्तीय जानकारी साझा न करें।",
  topics:{partnership:"LSP साझेदारी",api:"लोन API",credit:"क्रेडिट ऐप",support:"सहायता",legal:"कानूनी",contact:"ईमेल"}
 }
};
const languageNames={en:"English",bn:"বাংলা",hi:"हिंदी"};
const mascot=()=>'<span class="bian-figure" aria-hidden="true">'+
 '<span class="bian-aura"></span><span class="bian-antenna"><i></i></span>'+
 '<span class="bian-ear bian-ear-left"></span><span class="bian-ear bian-ear-right"></span>'+
 '<span class="bian-face"><span class="bian-eyes"><i></i><i></i></span><span class="bian-smile"></span></span>'+
 '<span class="bian-body"><span class="bian-v">V</span></span>'+
 '<span class="bian-arm bian-arm-left"></span><span class="bian-arm bian-arm-right"><i class="bian-hand"></i></span>'+
 '<span class="bian-spark bian-spark-one"></span><span class="bian-spark bian-spark-two"></span></span>';
// All inserted markup above is static and owned by this first-party application.
launch.classList.add("bian-launch");
launch.innerHTML='<span class="bian-hi" aria-hidden="true">Hi! 👋</span>'+mascot()+
 '<span class="bian-launch-name" aria-hidden="true">Bian</span>';
launch.setAttribute("aria-label","Open Bian animated support assistant");
popup.classList.add("bian-chat");
popup.setAttribute("aria-label","Bian — VORVAN website support assistant");
const head=root.querySelector(".vv-chat-head");
const heading=head?.querySelector("strong"),subhead=head?.querySelector("small");
if(heading)heading.textContent="Bian";
if(subhead)subhead.textContent="● Available · Guided help";
const headingBlock=head?.firstElementChild;
if(headingBlock){
 headingBlock.classList.add("bian-heading");
 headingBlock.insertAdjacentHTML("afterbegin",'<span class="bian-head-avatar">'+mascot()+"</span>");
}
lang.setAttribute("aria-label","Change Bian chat language");
close.setAttribute("aria-label","Close Bian assistant");
let busy=false;
let languageSelected=false;
let initialized=false;
function add(text,mine=false){
 const p=document.createElement("div");
 p.className="vv-msg"+(mine?" visitor":"");
 p.textContent=text;
 if(mine)feed.append(p);
 else{
  const row=document.createElement("div");row.className="bian-message-row";
  const avatar=document.createElement("span");avatar.className="bian-message-avatar";
  avatar.setAttribute("aria-hidden","true");avatar.textContent="✦";
  row.append(avatar,p);feed.append(row);
 }
 feed.scrollTop=feed.scrollHeight;
}
function controls(ready){
 if(topics)topics.hidden=!ready;
 if(composer)composer.hidden=!ready;
 lang.hidden=!ready;
}
function begin(){
 initialized=true;languageSelected=false;
 feed.replaceChildren();
 controls(false);
 const l=labels.en;
 add(l.hello);add(l.intro);add(l.choose);
 const choices=document.createElement("div");
 choices.className="bian-language-choices";
 choices.setAttribute("role","group");choices.setAttribute("aria-label","Choose a language");
 for(const key of ["en","bn","hi"]){
  const b=document.createElement("button");
  b.type="button";b.className="bian-language-choice";
  b.textContent=languageNames[key];
  b.setAttribute("data-bian-choice",key);
  b.addEventListener("click",()=>choose(key));
  choices.append(b);
 }
 feed.append(choices);
}
function choose(key){
 if(!labels[key]||busy)return;
 lang.value=key;
 languageSelected=true;
 feed.replaceChildren();
 add(languageNames[key],true);
 add(labels[key].ready);
 controls(true);
 field.placeholder=key==="bn"?"আপনার প্রশ্ন লিখুন…":key==="hi"?"अपना सवाल लिखें…":"Ask Bian a question…";
 field.focus();
}
function open(opened){
 popup.hidden=!opened;
 root.classList.toggle("bian-open",opened);
 launch.setAttribute("aria-expanded",String(opened));
 if(opened){
  if(!initialized)begin();
  if(languageSelected)field.focus();
  else feed.querySelector(".bian-language-choice")?.focus();
 }else launch.focus();
}
launch.addEventListener("click",()=>open(popup.hidden));
close.addEventListener("click",()=>open(false));
document.addEventListener("keydown",(e)=>{if(e.key==="Escape"&&!popup.hidden)open(false)});
function looksSensitive(value){
 return /(?:\d[\s-]?){8,}|[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
}
async function ask(topic,message){
 if(busy||!languageSelected)return;
 const local=labels[lang.value]||labels.en;
 if(message&&looksSensitive(message)){add(local.privacy);return}
 busy=true;send.disabled=true;
 const data={language:lang.value};
 if(topic)data.topic=topic;
 if(message)data.message=message;
 try{
  const r=await fetch(endpoint,{
   method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify(data),cache:"no-store",credentials:"omit",
   referrerPolicy:"no-referrer",signal:AbortSignal.timeout(8500)
  });
  const body=await r.json();
  if(!r.ok||typeof body.reply!=="string")throw Error("unavailable");
  add(body.reply);
 }catch{add(local.fallback)}
 finally{busy=false;send.disabled=false}
}
for(const button of root.querySelectorAll("[data-guide-topic]")){
 button.addEventListener("click",()=>{
  if(!languageSelected||busy)return;
  const topic=button.getAttribute("data-guide-topic");
  add(labels[lang.value].topics[topic]||topic,true);
  ask(topic,null);
 });
}
function sendMessage(){
 if(!languageSelected||busy)return;
 const msg=field.value.trim();
 if(!msg||msg.length>240)return;
 field.value="";
 add(msg,true);ask(null,msg);
}
send.addEventListener("click",sendMessage);
field.addEventListener("keydown",(e)=>{
 if(e.key==="Enter"){e.preventDefault();sendMessage()}
});
lang.addEventListener("change",()=>{
 if(labels[lang.value])choose(lang.value);
});
// The home search bar can open Bian and immediately ask a general question.
const quick=document.querySelector("[data-vv-search]");
const quickButton=document.querySelector("[data-vv-search-submit]");
function quickAsk(){
 if(!quick||busy)return;
 const message=quick.value.trim();
 if(!message||message.length>240)return;
 open(true);
 if(!languageSelected)choose("en");
 quick.value="";
 field.value=message;
 sendMessage();
}
if(quick&&quickButton){
 quickButton.addEventListener("click",quickAsk);
 quick.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"){e.preventDefault();quickAsk()}
 });
}
controls(false);
})();
