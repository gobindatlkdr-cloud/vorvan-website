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
assert.ok(launch.innerHTML.includes('class="vyn-mascot"'),"Approved Vyn mascot SVG must render");
assert.ok(launch.innerHTML.includes('class="vyn-wave-arm"'),"Wave arm is independent");
assert.ok(launch.innerHTML.includes('class="vyn-wave-palm"'),"Palm waves separately");
assert.ok(launch.innerHTML.includes('class="vyn-chest-name"'),"Chest panel must have a name");
assert.ok(launch.innerHTML.includes('>Vyn</text>'),"Chest must display Vyn, not HI");
assert.ok(!launch.innerHTML.includes("Hi!")&&!launch.innerHTML.includes("bian-figure"),"No legacy greeting bubble or old mascot");
assert.ok(launch.innerHTML.includes("vyn-shell-dock"),"Dock SVG gradients must be namespaced");
assert.ok(headLabel.htmlPrefix.includes("vyn-shell-header"),"Header SVG must have independent gradient IDs");
assert.equal(headStrong.textContent,"Vyn","Chat header must display Vyn");
assert.equal(headSmall.textContent,"VORVAN Support Assistant","Approved subheading");
assert.match(source,/I am Vyn, your support assistant/,"Intro must identify Vyn");
assert.ok(source.includes('add(l.hello+"\\n"+l.intro)'),"Greeting must be a combined bubble");
assert.doesNotMatch(source,/Bian/,"Old bot name must be absent from user-facing JS");
assert.equal(topics.hidden,true);
launch.ev.click();
assert.equal(panel.hidden,false);
assert.equal(feed.children.length,3);
assert.equal(topics.hidden,true,"No topics until language selection");
const choiceGroup=feed.children[2];
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
 const wave=css.slice(css.indexOf("@keyframes vyn3-wave"));
 assert.ok(wave.includes("18%{transform:rotate(-28deg)}"),"Waving arm raises");
 assert.ok(wave.includes("30%{transform:rotate(17deg)}"),"Waving arm swings right");
 assert.ok(wave.includes("42%{transform:rotate(-27deg)}"),"Waving arm swings left");
 assert.ok(css.includes("@keyframes vyn3-palm"),"Separate palm animation");
 assert.ok(css.includes("#vv-assistant .vyn-chest-name"),"Name on chest");
 assert.ok(css.includes("width:80px;height:91px"),"Compact floating button");
 assert.ok(css.includes("VORVAN"),"Website stylesheet intact");
 assert.ok(css.includes("prefers-reduced-motion:reduce"),"Reduced-motion setting supported");
 console.log("Vyn assistant tests passed: animated mascot, launcher, language-first chat, API handoff and close.");
});
