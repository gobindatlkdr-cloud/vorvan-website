/* VOR-005: first-party Vyn widget code in synthetic DOM, no browser or real credentials. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("assets/assistant.js","utf8");
class Node{
 constructor(tag="div"){
  this.tag=tag;this.hidden=false;this.children=[];this.ev={};this.attrs={};
  this.value="";this.textContent="";this.className="";this.innerHTML="";
  this.scrollTop=0;this.scrollHeight=0;this.focused=false;this.dataset={};
  this.classList={add:()=>{},toggle:()=>{}};
 }
 setAttribute(k,v){this.attrs[k]=String(v)}
 getAttribute(k){return this.attrs[k]||null}
 addEventListener(k,fn){this.ev[k]=fn}
 append(...els){this.children.push(...els);this.scrollHeight=this.children.length}
 replaceChildren(...els){this.children=els;this.scrollHeight=this.children.length}
 focus(){this.focused=true}
 querySelector(q){
  if(q===".bian-language-choice"){
   const x=this.children.find(v=>v.className==="bian-language-choices");
   return x?.children[0]||null;
  }
  return null;
 }
 insertAdjacentHTML(where,html){this.htmlPrefix=html}
}
function setup(){
 const root=new Node(),launch=new Node("button"),popup=new Node("section");
 const close=new Node("button"),feed=new Node(),field=new Node("input"),send=new Node("button");
 const lang=new Node("select"),topics=new Node(),composer=new Node(),head=new Node();
 const strong=new Node("strong"),small=new Node("small"),headLabel=new Node();
 head.firstElementChild=headLabel;
 head.querySelector=q=>q==="strong"?strong:q==="small"?small:null;
 const topic=new Node("button");topic.setAttribute("data-guide-topic","support");
 const quick=new Node("input"),quickButton=new Node("button");
 const sel={
  "[data-guide-launch]":launch,"[data-guide-panel]":popup,"[data-guide-close]":close,
  "[data-guide-feed]":feed,"[data-guide-input]":field,"[data-guide-send]":send,
  "[data-guide-language]":lang,".vv-chat-options":topics,".vv-chat-row":composer,
  ".vv-chat-head":head
 };
 root.querySelector=q=>sel[q]||null;
 root.querySelectorAll=q=>q==="[data-guide-topic]"?[topic]:[];
 const handlers={};
 const document={
  getElementById:id=>id==="vv-assistant"?root:null,
  querySelector:q=>q==="[data-vv-search]"?quick:q==="[data-vv-search-submit]"?quickButton:null,
  createElement:tag=>new Node(tag),
  addEventListener:(key,fn)=>handlers[key]=fn,
 };
 popup.hidden=true;lang.value="en";
 const requests=[];
 let mode="ok";
 const context={document,AbortSignal:{timeout:()=>({})},
  fetch:async(url,args)=>{
   requests.push({url,args});
   if(mode==="offline")throw Error("synthetic network outage");
   if(mode==="privacy_error")return {status:400,ok:false,json:async()=>({error:"please_remove_personal_information"})};
   return {status:200,ok:true,json:async()=>({reply:"<img onerror=alert(1)> synthetic server response"})};
  },
 };
 vm.runInNewContext(source,context,{timeout:3000});
 const text=()=>{const result=[];function walk(n){if(typeof n.textContent==="string"&&n.textContent)result.push(n.textContent);for(const child of n.children||[])walk(child)}walk(feed);return result.join("\n")};
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 const select=code=>{
  if(!popup.hidden&&feed.children.length===3&&feed.children[2].className==="bian-language-choices"){
   const ix={en:0,bn:1,hi:2}[code];
   feed.children[2].children[ix].ev.click();
  } else {lang.value=code;lang.ev.change()}
  assert.equal(lang.value,code);
 };
 const message=async(value)=>{
  field.value=value;send.ev.click();await tick();
 };
 return {root,launch,popup,close,feed,field,send,lang,topics,composer,topic,
  quick,quickButton,handlers,requests,select,message,text,tick,setMode:(x)=>mode=x};
}
(async()=>{
 const a=setup();
 assert.equal(a.launch.attrs["aria-label"],"Open Vyn animated support assistant");
 assert.equal(a.popup.attrs["aria-label"],"Vyn — VORVAN website support assistant");
 assert.equal(a.send.ev.click instanceof Function,true);
 a.launch.ev.click();
 assert.equal(a.popup.hidden,false);
 assert.equal(a.topics.hidden,true,"Language-first interaction");
 assert.equal(a.composer.hidden,true);
 assert.equal(a.feed.children.length,3);
 a.select("bn");
 assert.equal(a.composer.hidden,false);
 assert.match(a.text(),/বাংলা|VORVAN/);
 await a.message("LSP partnership");
 assert.equal(a.requests.length,1);
 assert.equal(JSON.parse(a.requests[0].args.body).language,"bn");
 assert.equal(JSON.parse(a.requests[0].args.body).message,"LSP partnership");
 assert.match(a.text(),/<img onerror=alert\(1\)>/,"Server response is literal text");
 assert.equal(a.send.disabled,false);

 a.select("hi");
 const prior=a.requests.length;
 await a.message("OTP: 123456");
 assert.equal(a.requests.length,prior,"OTP cannot reach network");
 assert.equal(a.field.value,"");
 assert.doesNotMatch(a.text(),/OTP: 123456/,"OTP cannot be echoed into chat DOM");
 assert.match(a.text(),/साझा न करें/,"Hindi local privacy feedback");
 await a.message("PAN ABCDE1234F");
 assert.equal(a.requests.length,prior,"PAN cannot reach network");
 assert.doesNotMatch(a.text(),/ABCDE1234F/);
 await a.message("password: 654321");
 assert.equal(a.requests.length,prior,"password cannot reach network");

 a.setMode("offline");
 await a.message("LSP question");
 assert.match(a.text(),/लाइव सहायता/,"Hindi network fallback");
 a.select("bn");
 await a.message("API information");
 assert.match(a.text(),/লাইভ গাইড/,"Bengali network fallback");
 a.select("en");
 await a.message("Support please");
 assert.match(a.text(),/temporarily unavailable/,"English network fallback");

 a.setMode("privacy_error");
 await a.message("normal website request");
 assert.match(a.text(),/Please do not share phone numbers/,"Backend 400 privacy guidance not outage");
 a.setMode("ok");
 const before=a.requests.length;
 a.topic.ev.click();
 await a.tick();
 assert.equal(a.requests.length,before+1);
 assert.equal(JSON.parse(a.requests.at(-1).args.body).topic,"support");

 // As the widget is closed, Escape also moves focus back to the launcher.
 a.handlers.keydown({key:"Escape"});
 assert.equal(a.popup.hidden,true);
 assert.equal(a.launch.focused,true);
 assert.equal(a.launch.attrs["aria-expanded"],"false");

 const b=setup();
 b.quick.value="API sandbox";
 b.quickButton.ev.click();
 await b.tick();
 assert.equal(b.popup.hidden,false);
 assert.equal(b.lang.value,"en","Homepage shortcut defaults to English on first use");
 assert.equal(b.quick.value,"");
 assert.equal(JSON.parse(b.requests[0].args.body).message,"API sandbox");
 const beforeQuick=b.requests.length;
 b.quick.value="OTP 123456";
 b.quickButton.ev.click();
 await b.tick();
 assert.equal(b.requests.length,beforeQuick,"Home shortcut cannot leak an OTP");
 assert.doesNotMatch(b.text(),/OTP 123456/);
 const css=fs.readFileSync("assets/refresh.css","utf8");
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(source,/p\.textContent=text;/,"Live assistant messages rendered with textContent");
 console.log("PASS VOR-005 synthetic DOM: language-first EN/BN/HI, backend handoff, secure redaction, homepage shortcut, XSS-safe text, privacy/backend outage fallback, topic CTA, Escape, keyboard and reduced motion");
})().catch(error=>{console.error(error);process.exitCode=1});
