/* Vyn — an original animated VORVAN website guide.
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
  hello:"Hello 👋",intro:"Hello, I am Vyn, your support assistant. I am here to help you.",
  choose:"Please choose your language.",ready:"I'm here to help with VORVAN, direct LSP partnerships, lending APIs and support. Choose a topic or ask a question.",
  fallback:"Vyn's live guide is temporarily unavailable. Please email info@vorvan.co.in.",
  privacy:"Please do not share phone numbers, PAN/Aadhaar, email addresses or personal financial data.",
  topics:{partnership:"LSP partnership",api:"Lending API",credit:"Credit app",support:"Support",legal:"Legal",contact:"Emails"}
 },
 bn:{
  hello:"হ্যালো 👋",intro:"আমি Vyn, VORVAN-এর সাপোর্ট অ্যাসিস্ট্যান্ট। আপনাকে সাহায্য করতে এখানে আছি।",
  choose:"আপনার ভাষা নির্বাচন করুন।",ready:"VORVAN, সরাসরি LSP পার্টনারশিপ, লোন API বা সাপোর্ট সম্পর্কে জানতে নিচের অপশন বাছুন অথবা প্রশ্ন লিখুন।",
  fallback:"Vyn-এর লাইভ গাইড এখন কাজ করছে না। info@vorvan.co.in-এ মেইল করুন।",
  privacy:"ফোন নম্বর, PAN/Aadhaar, ইমেইল বা ব্যক্তিগত আর্থিক তথ্য এখানে দেবেন না।",
  topics:{partnership:"LSP পার্টনারশিপ",api:"লোন API",credit:"ক্রেডিট অ্যাপ",support:"সাপোর্ট",legal:"লিগ্যাল",contact:"ইমেইল"}
 },
 hi:{
  hello:"नमस्ते 👋",intro:"मैं Vyn हूँ, VORVAN का सपोर्ट असिस्टेंट। मैं आपकी मदद के लिए यहाँ हूँ।",
  choose:"अपनी भाषा चुनें।",ready:"VORVAN, सीधे LSP पार्टनरशिप, लेंडिंग API और सहायता के लिए विषय चुनें या सवाल लिखें।",
  fallback:"Vyn की लाइव सहायता अभी उपलब्ध नहीं है। info@vorvan.co.in पर लिखें।",
  privacy:"कृपया फ़ोन, PAN/Aadhaar, ईमेल या निजी वित्तीय जानकारी साझा न करें।",
  topics:{partnership:"LSP साझेदारी",api:"लोन API",credit:"क्रेडिट ऐप",support:"सहायता",legal:"कानूनी",contact:"ईमेल"}
 }
};
const languageNames={en:"English",bn:"বাংলা",hi:"हिंदी"};
/* An original compact, pearlescent floating robot; all vector parts drawn here.
   Unique IDs avoid gradient collisions between dock and chat-header avatars.
   "Vyn" is printed on the central chest display rather than a floating tag. */
const mascot=(variant="dock")=>{
 const shell="vyn-shell-"+variant,edge="vyn-edge-"+variant,face="vyn-face-"+variant;
 return '<span class="vyn-mascot-wrap" aria-hidden="true">'+
 '<svg class="vyn-mascot" viewBox="0 0 118 136" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">'+
 '<defs>'+
 '<linearGradient id="'+shell+'" x1="0" y1="0" x2=".94" y2="1"><stop offset="0" stop-color="#fffaff"/><stop offset=".48" stop-color="#f5d9ee"/><stop offset="1" stop-color="#dba0c7"/></linearGradient>'+
 '<linearGradient id="'+edge+'" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#b54b8f"/><stop offset=".65" stop-color="#76204e"/><stop offset="1" stop-color="#451431"/></linearGradient>'+
 '<linearGradient id="'+face+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#30162f"/><stop offset=".7" stop-color="#3e193b"/><stop offset="1" stop-color="#772859"/></linearGradient>'+
 '</defs>'+
 '<ellipse class="vyn-shadow" cx="59" cy="128" rx="26" ry="4" fill="#7a3153" opacity=".18"/>'+
 '<g class="vyn-hover-core">'+
 '<circle class="vyn-orbit-dot" cx="20" cy="51" r="3.2" fill="#80edd4"/>'+
 '<path class="vyn-satellite-ring" d="M17 52 A45 46 0 0 1 98 35" fill="none" stroke="#e5b9d2" stroke-width="1.8" stroke-dasharray="3 5" opacity=".65"/>'+
 '<g class="vyn-left-limb"><path d="M30 81 Q18 86 17 98" stroke="#8e356d" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="17" cy="99" r="7" fill="#6fe3c4" stroke="#e4fff6" stroke-width="2.5"/></g>'+
 '<g transform="translate(91 84)"><g class="vyn-right-limb">'+
 '<path d="M0 0 Q13 -9 16 -27" stroke="#893264" stroke-width="10" fill="none" stroke-linecap="round"/>'+
 '<path d="M0 0 Q13 -9 16 -27" stroke="#d3a0be" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>'+
 '<g class="vyn-palm"><path d="M8 -34 C3 -43 5 -50 10 -50 Q14 -50 17 -44 L17 -58 Q18 -63 22 -61 Q26 -60 26 -54 L28 -61 Q32 -64 35 -60 L34 -52 Q39 -57 43 -53 Q47 -49 43 -41 L43 -32 Q45 -23 37 -20 L23 -18 Q14 -21 8 -34Z" fill="#6ae5c5" stroke="#edfff9" stroke-width="2.5" stroke-linejoin="round"/>'+
 '<path d="M17 -43 L19 -38 M26 -45 L28 -39 M34 -45 L35 -39" stroke="#3aaf96" stroke-width="1.7" stroke-linecap="round" opacity=".7"/></g>'+
 '</g></g>'+
 '<path d="M59 26 C84 26 101 41 101 64 L96 98 Q93 118 59 121 Q25 118 22 98 L17 64 C17 41 34 26 59 26Z" fill="url(#'+shell+')" stroke="url(#'+edge+')" stroke-width="3"/>'+
 '<path d="M27 86 Q59 97 91 86" fill="none" stroke="#bb8caa" stroke-width="1.5" opacity=".55"/>'+
 '<path d="M27 41 Q40 30 54 32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>'+
 '<path d="M59 22 L65 29 L59 36 L53 29Z" fill="#70e9c9" stroke="#fff" stroke-width="2"/>'+
 '<rect x="25" y="43" width="68" height="37" rx="19" fill="url(#'+face+')" stroke="#cb81b1" stroke-width="2"/>'+
 '<path d="M34 49 Q58 37 84 49" fill="none" stroke="#fff" stroke-opacity=".23" stroke-width="2.5" stroke-linecap="round"/>'+
 '<g class="vyn-animated-eyes" fill="none" stroke="#89ffdd" stroke-width="4.3" stroke-linecap="round"><path d="M40 63 Q45 57 51 63"/><path d="M67 63 Q73 57 79 63"/></g>'+
 '<path d="M55 71 Q59 74 63 71" fill="none" stroke="#77eccc" stroke-width="2" stroke-linecap="round"/>'+
 '<rect class="vyn-chest" x="36" y="88" width="46" height="24" rx="10" fill="#562244" stroke="#ad6491" stroke-width="1.5"/>'+
 '<text class="vyn-chest-name" x="59" y="105" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="16.5" font-weight="800" fill="#fff9fd">Vyn</text>'+
 '<path d="M46 117 Q59 121 72 117" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.3" stroke-linecap="round"/>'+
 '</g></svg></span>';
};
// All inserted markup above is static and owned by this first-party application.
launch.classList.add("bian-launch");
launch.innerHTML=mascot("dock");
launch.setAttribute("aria-label","Open Vyn animated support assistant");
popup.classList.add("bian-chat");
popup.setAttribute("aria-label","Vyn — VORVAN website support assistant");
const head=root.querySelector(".vv-chat-head");
const heading=head?.querySelector("strong"),subhead=head?.querySelector("small");
if(heading)heading.textContent="Vyn";
if(subhead)subhead.textContent="● Available · Guided help";
const headingBlock=head?.firstElementChild;
if(headingBlock){
 headingBlock.classList.add("bian-heading");
 headingBlock.insertAdjacentHTML("afterbegin",'<span class="bian-head-avatar">'+mascot("header")+"</span>");
}
lang.setAttribute("aria-label","Change Vyn chat language");
close.setAttribute("aria-label","Close Vyn assistant");
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
 field.placeholder=key==="bn"?"আপনার প্রশ্ন লিখুন…":key==="hi"?"अपना सवाल लिखें…":"Ask Vyn a question…";
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
// The home search bar can open Vyn and immediately ask a general question.
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
