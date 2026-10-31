/* Offline synthetic DOM test for Vyn's first-party chat flow. No external services. */
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
assert.ok(launch.innerHTML.includes('class="vyn-mascot"'),"Mini mascot must be first-party SVG");
assert.ok(launch.innerHTML.includes('class="vyn-right-limb"'),"Hand must have separate moving arm");
assert.ok(launch.innerHTML.includes('class="vyn-palm"'),"Palm must be independently articulated");
assert.ok(launch.innerHTML.includes('class="vyn-chest-name"'),"Center badge required");
assert.ok(launch.innerHTML.includes('>Vyn</text>'),"Vyn name must appear on chest, not HI");
assert.ok(!launch.innerHTML.includes("Hi!")&&!launch.innerHTML.includes("bian-figure")&&!launch.innerHTML.includes("bian-launch-name"),"No legacy mascot or text-bubble label");
assert.ok(launch.innerHTML.includes("vyn-shell-dock"),"SVG dock gradients must be namespaced");
assert.ok(headLabel.htmlPrefix.includes("vyn-shell-header"),"Header gradients must have different IDs");
assert.equal(headStrong.textContent,"Vyn","Chat header must be Vyn");
assert.match(source,/Hello, I am Vyn/,"Greeting must introduce Vyn");
assert.doesNotMatch(source,/Bian/,"No old bot name may remain in UI source");
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
 const wave=css.slice(css.indexOf("@keyframes vyn-futuristic-wave"));
 assert.ok(wave.includes("20%{transform:rotate(-22deg)}"),"Arm must swing left");
 assert.ok(wave.includes("34%{transform:rotate(24deg)}"),"Arm must swing right");
 assert.ok(wave.includes("48%{transform:rotate(-20deg)}"),"Arm must swing back");
 assert.ok(css.includes("@keyframes vyn-futuristic-palm"),"Palm moves independently");
 assert.ok(css.includes("#vv-assistant .vyn-chest-name"),"Name is centered on chest");
 assert.ok(css.includes("width:64px;height:80px"),"Launcher smaller than previous 78x86 version");
 assert.ok(css.includes("@media(max-width:550px)"),"Mobile size maintained");
 assert.ok(css.includes("prefers-reduced-motion:reduce"),"Accessibility reduced motion");
 console.log("Vyn assistant tests passed: animated mascot, launcher, language-first chat, API handoff and close.");
});
