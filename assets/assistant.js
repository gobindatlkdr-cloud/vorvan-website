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
  hello:"Hello 👋",intro:"I am Vyn, your support assistant. I am here to help you.",
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
/* Vyn — approved Concept 3 adapted into an original SVG/CSS robot.
 * Separately animated waving arm, eyes, hover and antenna. No copied artwork.
 * The two SVG instances use unique paint-server IDs. */
const mascot=(variant="dock")=>{
 const id=(name)=>"vyn-"+name+"-"+variant;
 return `<span class="vyn-mascot-wrap" aria-hidden="true">
 <svg class="vyn-mascot" viewBox="0 0 170 190" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
 <defs>
  <radialGradient id="${id("shell")}" cx="38%" cy="19%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset=".47" stop-color="#fff6fc"/><stop offset=".83" stop-color="#eac7da"/><stop offset="1" stop-color="#ae638e"/></radialGradient>
  <linearGradient id="${id("rim")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb7d9"/><stop offset=".28" stop-color="#a82061"/><stop offset=".66" stop-color="#6b153f"/><stop offset="1" stop-color="#f6a1c4"/></linearGradient>
  <linearGradient id="${id("visor")}" x1=".18" y1="0" x2=".82" y2="1"><stop offset="0" stop-color="#4c203d"/><stop offset=".3" stop-color="#170e1e"/><stop offset=".8" stop-color="#2b1127"/><stop offset="1" stop-color="#692243"/></linearGradient>
  <radialGradient id="${id("faceglow")}" cx="50%" cy="70%" r="75%"><stop offset="0" stop-color="#e75499" stop-opacity=".22"/><stop offset="1" stop-color="#190c1d" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id("pink")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb6d8"/><stop offset=".34" stop-color="#d92778"/><stop offset="1" stop-color="#6d133b"/></linearGradient>
  <radialGradient id="${id("orb")}" cx="33%" cy="22%" r="72%"><stop offset="0" stop-color="#ffcae1"/><stop offset=".38" stop-color="#d61d6b"/><stop offset="1" stop-color="#620d37"/></radialGradient>
  <filter id="${id("eyeglow")}" x="-70%" y="-120%" width="240%" height="340%"><feGaussianBlur stdDeviation="2"/></filter>
 </defs>
 <ellipse class="vyn-shadow" cx="84" cy="179" rx="42" ry="5" fill="#7b3155" opacity=".18"/>
 <g class="vyn-hover-core">
  <!-- Wave hand at left; pivots at shoulder, independent of head/body. -->
  <g class="vyn-wave-joint" transform="translate(53 128)">
   <g class="vyn-wave-arm">
    <path d="M-1 -1 Q-23 -9 -29 -32" stroke="#7d164a" stroke-width="19" stroke-linecap="round" fill="none"/>
    <path d="M-1 -1 Q-23 -9 -29 -32" stroke="url(#${id("shell")})" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M-22 -30 Q-27 -38 -35 -39" fill="none" stroke="#a63371" stroke-width="6" stroke-linecap="round"/>
    <g class="vyn-wave-palm">
     <path d="M-38 -43 C-43 -48 -49 -61 -46 -65 C-44 -68 -40 -67 -37 -61 L-33 -55 L-38 -72 Q-40 -80 -35 -81 Q-30 -82 -28 -75 L-24 -62 L-27 -81 Q-29 -88 -23 -89 Q-17 -89 -16 -82 L-13 -65 L-14 -78 Q-15 -85 -10 -85 Q-5 -84 -5 -77 L-4 -58 Q5 -66 9 -60 Q13 -53 5 -43 L-9 -30 Q-21 -25 -29 -30 Z" fill="url(#${id("rim")})" stroke="#fff1f9" stroke-width="2.5" stroke-linejoin="round"/>
     <path d="M-31 -39 Q-22 -34 -14 -40" fill="none" stroke="#ffa5cd" stroke-opacity=".72" stroke-width="2.5" stroke-linecap="round"/>
     <ellipse cx="-32" cy="-66" rx="2" ry="3" fill="#fff2f7" opacity=".7"/>
    </g>
   </g>
  </g>
  <path class="vyn-wave-trail" d="M12 45 Q1 53 3 68 M24 43 Q14 48 13 57" fill="none" stroke="#dc4a8e" stroke-width="3" stroke-linecap="round"/>
  <!-- Right arm rests, reinforcing the greeting pose. -->
  <path d="M115 125 Q136 131 143 149" stroke="#75103c" stroke-width="21" stroke-linecap="round" fill="none"/>
  <path d="M115 125 Q136 131 143 149" stroke="url(#${id("shell")})" stroke-width="16" stroke-linecap="round" fill="none"/>
  <ellipse cx="144" cy="151" rx="12" ry="13" fill="url(#${id("rim")})" stroke="#fff3fa" stroke-width="2"/>
  <!-- Floating torso with rose-metal trim, lower hoverlight and central name plate. -->
  <path d="M58 117 Q86 109 112 118 Q129 129 122 156 Q116 171 86 173 Q57 170 51 155 Q44 132 58 117Z" fill="url(#${id("shell")})" stroke="url(#${id("rim")})" stroke-width="3.2"/>
  <path d="M56 149 Q86 167 118 149" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="3"/>
  <path d="M72 172 Q86 180 102 172" fill="none" stroke="#ec3b85" stroke-width="5" stroke-linecap="round" class="vyn-hoverlight"/>
  <rect class="vyn-chest" x="61" y="132" width="51" height="28" rx="11" fill="url(#${id("visor")})" stroke="#d35a93" stroke-width="2.2"/>
  <text class="vyn-chest-name" x="86.5" y="151.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="800" fill="#fff8fb">Vyn</text>
  <!-- Rounded helmet, ruby circular ear-pods, pink neck ring. -->
  <ellipse cx="86" cy="114" rx="23" ry="9" fill="url(#${id("rim")})" stroke="#fff9fc" stroke-width="2"/>
  <ellipse cx="35" cy="80" rx="13" ry="25" fill="url(#${id("rim")})" stroke="#ffe8f4" stroke-width="2.5"/>
  <ellipse cx="137" cy="80" rx="13" ry="25" fill="url(#${id("rim")})" stroke="#ffe8f4" stroke-width="2.5"/>
  <ellipse cx="35" cy="80" rx="6.2" ry="13" fill="#7b1547" stroke="#fc8cbf" stroke-width="2"/>
  <ellipse cx="137" cy="80" rx="6.2" ry="13" fill="#7b1547" stroke="#fc8cbf" stroke-width="2"/>
  <ellipse cx="137" cy="79" rx="2" ry="7" fill="#fff5fc" opacity=".66"/>
  <path d="M47 43 Q54 32 69 29 Q100 22 124 41 Q139 55 140 78 Q141 109 124 118 Q104 126 85 126 Q57 125 44 113 Q34 101 36 77 Q36 53 47 43 Z" fill="url(#${id("shell")})" stroke="url(#${id("rim")})" stroke-width="3.4"/>
  <path d="M51 43 Q69 30 90 34" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
  <path d="M42 83 Q44 111 62 116" fill="none" stroke="#b5568c" stroke-width="3" opacity=".5"/>
  <!-- Translucent deep plum visor with delighted expressive eyes. -->
  <rect x="46" y="51" width="81" height="62" rx="29" fill="url(#${id("visor")})" stroke="#9b356d" stroke-width="3"/>
  <rect x="48" y="54" width="77" height="56" rx="27" fill="url(#${id("faceglow")})"/>
  <path d="M58 62 Q82 49 116 63" fill="none" stroke="#fff8fd" stroke-opacity=".23" stroke-width="3.5" stroke-linecap="round"/>
  <g class="vyn-animated-eyes" fill="none" stroke="#ff9cdb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
   <path d="M59 88 Q68 71 77 88"/><path d="M94 88 Q103 72 113 88"/>
  </g>
  <g fill="none" stroke="#ff95d1" stroke-width="8" opacity=".32" filter="url(#${id("eyeglow")})">
   <path d="M59 88 Q68 71 77 88"/><path d="M94 88 Q103 72 113 88"/>
  </g>
  <path d="M80 99 Q87 104 94 99" fill="none" stroke="#f86cb4" stroke-width="2.4" stroke-linecap="round"/>
  <!-- Miniature glossy antenna with orbit ring, exclusive Vyn signature. -->
  <path d="M84 29 L84 17" stroke="#762045" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="84" cy="19" rx="15" ry="5" transform="rotate(-14 84 19)" fill="none" stroke="#f6a6cb" stroke-width="2.4" opacity=".88"/>
  <circle cx="84" cy="13" r="10" fill="url(#${id("orb")})" stroke="#ffe8f4" stroke-width="1.5"/>
  <ellipse cx="80.5" cy="9.5" rx="3.4" ry="2.8" fill="#fff7fc" opacity=".7"/>
 </g>
 </svg></span>`;
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
if(subhead)subhead.textContent="VORVAN Support Assistant";
const headingBlock=head?.firstElementChild;
if(headingBlock){
 headingBlock.classList.add("bian-heading");
 headingBlock.insertAdjacentHTML("afterbegin",'<span class="bian-head-avatar">'+mascot("header")+"</span>");
}
send.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg><span class="vyn-send-label">Send</span>';
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
 add(l.hello+"\n"+l.intro);add(l.choose);
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
