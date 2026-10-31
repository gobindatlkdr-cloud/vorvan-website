/* Offline synthetic DOM test for Bian's first-party chat flow. No external services. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
class Node{
 constructor(tag="div"){this.tag=tag;this.hidden=false;this.children=[];this.attrs={};this.ev={};this.value="";this.textContent="";this.className="";this.innerHTML="";this.scrollHeight=0;this.scrollTop=0;this.focused=false;this.dataset={};this.classList={add:()=>{},toggle:()=>{}};}
 setAttribute(k,v){this.attrs[k]=String(v)}
 getAttribute(k){return this.attrs[k]||null}
 addEventListener(k,fn){this.ev[k]=fn}
 append(...els){this.children.push(...els);this.scrollHeight=this.children.length}
 replaceChildren(...els){this.children=els;this.scrollHeight=this.children.length}
 focus(){this.focused=true}
 querySelector(q){
  if(q===".bian-language-choice"){const choices=this.children.find(n=>n.className==="bian-language-choices");return choices?.children[0]||null}
  return null
 }
 insertAdjacentHTML(where,html){this.htmlPrefix=html}
}
const root=new Node(),launch=new Node("button"),panel=new Node("section");
const close=new Node("button"),feed=new Node(),field=new Node("input");
const send=new Node("button"),lang=new Node("select"),topics=new Node(),composer=new Node();
const head=new Node(),headLabel=new Node(),headStrong=new Node("strong"),headSmall=new Node("small");
head.firstElementChild=headLabel;
head.querySelector=q=>q==="strong"?headStrong:q==="small"?headSmall:null;
const topicButton=new Node("button");topicButton.setAttribute("data-guide-topic","partnership");
const selectors={
 "[data-guide-launch]":launch,"[data-guide-panel]":panel,
 "[data-guide-close]":close,"[data-guide-feed]":feed,
 "[data-guide-input]":field,"[data-guide-send]":send,
 "[data-guide-language]":lang,
 ".vv-chat-options":topics,".vv-chat-row":composer,".vv-chat-head":head
};
root.querySelector=q=>selectors[q]||null;
root.querySelectorAll=q=>q==="[data-guide-topic]"?[topicButton]:[];
const document={
 getElementById:id=>id==="vv-assistant"?root:null,
 querySelector:()=>null,createElement:tag=>new Node(tag),
 addEventListener:()=>{}
};
panel.hidden=true;lang.value="en";
const calls=[];
const context={
 document,AbortSignal:{timeout:()=>({})},
 fetch:async(url,args)=>{calls.push({url,args});return {ok:true,json:async()=>({reply:"Synthetic response"})}}
};
const source=fs.readFileSync("assets/assistant.js","utf8");
vm.runInNewContext(source,context,{timeout:2500});
assert.match(launch.innerHTML,/bian-figure/);
assert.match(launch.innerHTML,/bian-arm-right/);
assert.equal(topics.hidden,true);
launch.ev.click();
assert.equal(panel.hidden,false);
assert.equal(feed.children.length,4);
assert.equal(topics.hidden,true,"No topics until language selection");
const choiceGroup=feed.children[3];
assert.equal(choiceGroup.children.length,3);
choiceGroup.children[1].ev.click();
assert.equal(lang.value,"bn");
assert.equal(topics.hidden,false);
assert.equal(composer.hidden,false);
field.value="LSP partnership";
send.ev.click();
setImmediate(()=>{
 assert.equal(calls.length,1);
 const payload=JSON.parse(calls[0].args.body);
 assert.equal(payload.language,"bn");
 assert.equal(payload.message,"LSP partnership");
 close.ev.click();
 assert.equal(panel.hidden,true);
 const css=fs.readFileSync("assets/refresh.css","utf8");
 for(const marker of ["@keyframes bian-wave","@keyframes bian-hover","prefers-reduced-motion","bian-language-choice","bian-launch"]){
  assert.ok(css.includes(marker),"Missing CSS marker "+marker);
 }
 console.log("Bian assistant tests passed: animated mascot, launcher, language-first chat, API handoff and close.");
});
