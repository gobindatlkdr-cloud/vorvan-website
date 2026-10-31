/* Fixture-only test: never process, print or retain actual TOTP secrets. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("assets/admin.js","utf8");
const from=source.indexOf("function displayAuthenticatorQr(qr){");
const to=source.indexOf("\nasync function startMfa(){",from);
assert.ok(from>=0 && to>from,"MFA QR presenter must exist");
const image={hidden:true,onload:null,onerror:null,_src:null,removeAttribute(n){if(n==="src")this._src=null},set src(v){this._src=v;this.onload?.()},get src(){return this._src}};
const error={hidden:true};
const elements={"mfa-qr":image,"mfa-qr-error":error};
const ctx={
  $:id=>elements[id],
  visible:(id,yes)=>{elements[id].hidden=!yes},
  encodeURIComponent
};
vm.runInNewContext(source.slice(from,to)+"\nthis.present=displayAuthenticatorQr;",ctx);
assert.equal(ctx.present('<svg xmlns="http://www.w3.org/2000/svg"><rect width="12" height="12"/></svg>'),true);
assert.equal(image.hidden,false,"Raw SVG must become a visible image");
assert.match(image.src,/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
assert.equal(ctx.present('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>'),true);
assert.equal(image.hidden,false,"XML-declared SVG must be accepted");
assert.equal(ctx.present('data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E'),true);
assert.equal(image.hidden,false,"Existing safe SVG data URIs must be accepted");
assert.equal(ctx.present('invalid'),false);
assert.equal(image.hidden,true);
assert.equal(error.hidden,false,"Unsupported QR must show manual setup fallback");
console.log("MFA QR presenter tests passed (synthetic fixtures only).");
