"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vault=fs.readFileSync("backend/compliance-vault/index.ts","utf8");
const reader=fs.readFileSync("backend/compliance-vault/body-limit.ts","utf8");
const vyn=fs.readFileSync("backend/site-assistant/index.ts","utf8");
const admin=fs.readFileSync("assets/admin.js","utf8");
const html=fs.readFileSync("admin.html","utf8");
assert.match(vault,/readBytesWithLimit\(req,LIMIT\)/);
assert.match(vault,/readBytesWithLimit\(req,2200\)/);
assert.doesNotMatch(vault,/req\.arrayBuffer\(\)|req\.text\(\)/);
assert.match(reader,/req\.body\.getReader\(\)/);
assert.match(reader,/total > maxBytes/);
assert.match(reader,/reader\.cancel\(\)/);
assert.match(vault,/jwt\.aal!=="aal2"/);
assert.match(vault,/owner_only_file_access/);
assert.match(vault,/incorporation_required/);
assert.match(html,/PRE-INCORPORATION/);
assert.match(admin,/const COMPANY="admin@vorvan\.co\.in"/);
assert.doesNotMatch(vyn,/admin@vorvan\.co\.in/);
assert.doesNotMatch(vyn,/official_emails:EMAIL/);
assert.match(vyn,/official_email:emailForTopic\(topic\)/);
for(const page of ["index.html","solutions.html","contact.html","partners.html","privacy.html","terms.html"]){
 const source=fs.readFileSync(page,"utf8");
 assert.doesNotMatch(source,/href="admin\.html"|admin@vorvan\.co\.in|Staff access/,page+" publicly exposes private admin");
 assert.match(source,/Incorporation pending/,page+" missing pending incorporation disclosure");
}
console.log("PASS M0: bounded request body, MFA and owner controls preserved, Vyn internal mailbox hidden, feature-gated site disclaimers");
