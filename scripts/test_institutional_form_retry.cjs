"use strict";
/** VOR-011 actual website form script in a synthetic DOM; no live network. */
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs");
const source=fs.readFileSync("assets/institutional-inquiry.js","utf8");
const page=fs.readFileSync("partners.html","utf8");
const styles=fs.readFileSync("assets/institutional-inquiry.css","utf8");
// Honeypot intentionally must NOT appear in visible/accessibility form controls.
// This is a source assertion: visually hidden bait remains in the HTML DOM.
assert.match(page,/class="vv-inquiry-honey" aria-hidden="true"/);
assert.match(page,/<input id="ii-homepage" name="homepage" autocomplete="off" tabindex="-1">/);
assert.match(styles,/\.vv-inquiry-honey\{position:absolute!important;left:-10000px!important;/);

const fields={
 institution_type:"nbfc",institution_name:"Synthetic Institution",
 institution_website:"https://synthetic-bank.invalid",contact_name:"Fictional Contact",
 designation:"Partnerships Officer",official_email:"synthetic@example-bank.invalid",
 business_phone:"",partnership_track:"direct_api",
 agenda:"A fictional direct lending API partnership inquiry for testing only.",
 homepage:"",consent:true
};
const events={};
const submit={disabled:false,textContent:"Submit institutional inquiry"};
const status={textContent:"",className:""};
const form={
 elements:{namedItem(name){return name==="consent"?{checked:!!fields.consent}:{value:fields[name]||""};}},
 querySelector(q){assert.equal(q,'button[type="submit"]');return submit;},
 addEventListener(name,cb){events[name]=cb;},
 reportValidity(){return true;},
 reset(){fields.institution_name="Synthetic Institution";fields.agenda="A fictional direct lending API partnership inquiry for testing only.";},
};
let ids=0,okResponse=false,requests=[];
const document={getElementById(id){
 return id==="vv-institutional-inquiry-form"?form:id==="vv-institutional-status"?status:null;
}};
const ctx={
 document,location:{search:"?utm_source=linkedin"},URLSearchParams,AbortController,setTimeout,clearTimeout,
 crypto:{randomUUID(){ids++;return "f0000000-0000-4000-8000-"+String(ids).padStart(12,"0");}},
 fetch:async(url,args)=>{
  requests.push({url,args,payload:JSON.parse(args.body)});
  return {ok:okResponse,status:okResponse?201:503,
    json:async()=>okResponse?{ok:true,code:"received",reference:"30000000"}:{ok:false,code:"save_failed"}};
 },
};
vm.runInNewContext(source,ctx,{timeout:3000});
assert.equal(typeof events.submit,"function");
async function send(){await events.submit({preventDefault(){}});}
(async()=>{
 await send();assert.equal(requests.length,1);
 const first=requests[0].payload.submission_id;
 assert.equal(requests[0].payload.source_channel,"linkedin");
 assert.match(first,/^f0000000-0000-4000-8000-/);
 assert.equal(submit.disabled,false);
 assert.match(status.textContent,/retry with the unchanged form/);
 assert.doesNotMatch(status.textContent,/No inquiry is recorded until/);
 await send();
 assert.equal(requests.length,2);
 assert.equal(requests[1].payload.submission_id,first,"same ID after uncertain failure");
 assert.equal(ids,1,"no new UUID generated for retry");
 fields.agenda="Changed synthetic API inquiry to verify distinct retry key after editing.";
 await send();
 assert.equal(requests.length,3);
 assert.notEqual(requests[2].payload.submission_id,first,"edited payload receives new ID");
 assert.equal(ids,2);
 okResponse=true;
 await send();assert.equal(requests.length,4);assert.equal(ids,2);
 assert.match(status.textContent,/has been received/);
 assert.equal(submit.disabled,true);
 fields.official_email="synthetic@gmail.com";
 await send();assert.equal(requests.length,4,"free mail blocked in browser");
 assert.match(status.textContent,/official bank\/NBFC email/);
 fields.official_email="synthetic@example-bank.invalid";
 fields.homepage="bot-trap";
 await send();assert.equal(requests.length,4,"honeypot blocks request");
 console.log("PASS VOR-011 first-party institutional form: replay ID stable after timeout, changes get new ID, direct API fields, honeypot, corporate mail and safe uncertainty");
})().catch(e=>{console.error(e);process.exitCode=1;});
