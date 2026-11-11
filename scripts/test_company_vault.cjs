"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const admin=fs.readFileSync("assets/admin.js","utf8");
const html=fs.readFileSync("admin.html","utf8");
const backend=fs.readFileSync("backend/compliance-vault/index.ts","utf8");
const schema=fs.readFileSync("backend/migrations/step12d_compliance_vault.sql","utf8");
assert.match(admin,/function vaultPanel\(parent\)/);
assert.match(admin,/functions\/v1\/compliance-vault/);
assert.match(admin,/if\(area==="compliance"\)vaultPanel\(container\)/);
assert.match(html,/REGISTERED COMPANY/);
assert.match(html,/Legal & Documents/);
assert.match(backend,/jwt\.aal!=="aal2"/);
assert.match(backend,/owner_only_file_access/);
assert.match(backend,/SHA-256/);
assert.match(backend,/incorporation_required/);
assert.match(backend,/data.stage==="verified"/); // owner verification workflow
assert.match(schema,/incorporation_status='pending_incorporation'/);
assert.match(schema,/true,true,false,null/); // CA confirmed + fees paid, no COI
assert.match(schema,/enable row level security/);
assert.match(schema,/false,8388608/); // storage bucket private and 8 MiB
const docs=(schema.match(/^\('[a-z_]+','[^']+'/gm)||[]).length;
assert.equal(docs,15,"15 seeded compliance checklist documents");
for(const p of ["index.html","about.html","partners.html","privacy.html","terms.html","contact.html","partner-desk.html","solutions.html"]){
 const h=fs.readFileSync(p,"utf8");
 assert.match(h,/Registered company/);
 assert.match(h,/No live loan, credit-bureau, KYC or payment services/);
}
assert.doesNotMatch(admin,/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
console.log("PASS: owner-confirmed registered company disclosure, 15 documents, private vault, owner MFA and frontend integration");
