/** VORVAN registered company/public preview release regression.
 * Static HTML and dynamic translation guard; NO customer or payment service enablement.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const publicPages=[
 "index.html","about.html","contact.html","solutions.html","partners.html",
 "lsp-api-integration.html","lender-api-readiness.html","partner-desk.html",
 "institutional-partnership-brief.html","privacy.html","terms.html",
 "experience.html","readiness-passport.html","vyn-coach-sandbox.html","404.html"
];
const obsolete=[
 /under[\s-]*incorporation/i,
 /pre[\s-]*incorporation/i,
 /incorporation pending/i,
 /registration pending/i,
 /not yet incorporated/i,
 /company registration (?:is )?pending/i,
 /A proposed fintech initiative/i,
 /Proposed VORVAN PRIVATE LIMITED/i,
 /নিবন্ধন অপেক্ষমাণ/u,
 /নিবন্ধন সম্পন্ন হয়নি/u,
 /पंजीकरण लंबित/u,
 /प्रस्तावित VORVAN/u
];
for(const page of publicPages){
 const source=read(page);
 for(const rule of obsolete) assert.doesNotMatch(source,rule,page+" stale company status");
}
for(const page of ["index.html","about.html","contact.html","partners.html","solutions.html","privacy.html","terms.html",
 "readiness-passport.html","admin.html"]){
 assert.match(read(page),/Registered company/i,page+" missing corporate status");
}
const home=read("index.html");
assert.match(home,/id="product-previews"/);
for(const path of ["experience.html","readiness-passport.html","vyn-coach-sandbox.html"]){
 assert.match(home,new RegExp('href="'+path+'"'),"home safe demo missing "+path);
}
assert.match(home,/VORVAN PRIVATE LIMITED · REGISTERED COMPANY/);
assert.match(home,/No live loan, credit-bureau, KYC or payment services/);
assert.doesNotMatch(home,/admin@vorvan\.co\.in/,"private staff mailbox on public home");
const readiness=read("assets/readiness-passport.js");
for(const rule of obsolete)assert.doesNotMatch(readiness,rule,"dynamic readiness i18n uses stale company copy");
assert.match(readiness,/VORVAN PRIVATE LIMITED is registered/);
assert.match(readiness,/নিবন্ধিত কোম্পানি/u);
assert.match(readiness,/पंजीकृत कंपनी/u);
assert.match(read("readiness-passport.html"),/assets\/readiness-passport\.js\?v=20261111-registered-company/);
const admin=read("assets/admin.js");
for(const rule of [/incorporation pending/i,/pre[\s-]*incorporation/i])assert.doesNotMatch(admin,rule);
assert.match(admin,/incorporation_required:/,"backend vault approval lock preserved");
assert.match(admin,/COI verification pending in vault/);
assert.match(read("admin.html"),/id="mfa-form"/);
assert.match(read("admin.html"),/assets\/admin\.js\?v=20261112-customer-enquiries/);
assert.match(admin,/if\(!state\.access\|\|!\["owner","operator","auditor"\]\.includes\(validatedRole\)\)/);
for(const source of [home,read("experience.html"),read("readiness-passport.html")]){
 assert.doesNotMatch(source,/Apply Now\s*<\/a>/i,"do not enable loan applications");
}
assert.match(read("experience.html"),/VORVAN PRIVATE LIMITED\. All rights reserved/);
console.log("PASS: all public pages and multilingual dynamic notices reflect registered company; public previews linked, MFA and loan/service gates retained");
