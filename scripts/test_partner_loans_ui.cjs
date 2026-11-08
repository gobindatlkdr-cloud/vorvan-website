"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const pages = ["index.html","solutions.html","partners.html","about.html","contact.html","partner-desk.html","lsp-api-integration.html","lender-api-readiness.html","institutional-partnership-brief.html","experience.html","privacy.html","terms.html","404.html"];
const loans = ["Personal Loan","Business Loan","Education Loan","Short-Term Loan"];
const anchors = ["personal-loan","business-loan","education-loan","short-term-loan"];
for(const name of pages){
 const html=fs.readFileSync(name,"utf8");
 assert.match(html,/Partner With Us/,name+" needs distinct institutional CTA");
 assert.doesNotMatch(html,/href="admin\.html"|admin@vorvan\.co\.in|Staff access/,name+" must not advertise private admin");
 assert.match(html,/href="solutions\.html"/,name+" links to loan category overview");
 assert.match(html,/href="partners\.html"/,name+" links to partner route");
}
const home=fs.readFileSync("index.html","utf8");
const solutions=fs.readFileSync("solutions.html","utf8");
assert.match(home,/id="loan-categories"/);
for(let i=0;i<loans.length;i++){
 assert.ok(home.includes(loans[i]),"homepage category missing "+loans[i]);
 assert.ok(solutions.includes(loans[i]),"solutions category missing "+loans[i]);
 assert.ok(solutions.includes('id="'+anchors[i]+'"'),"solution anchor missing "+anchors[i]);
 assert.ok(home.includes('solutions.html#'+anchors[i]),"homepage category link missing");
}
assert.equal((home.match(/class="vv-loan-card"/g)||[]).length,4,"exactly four homepage categories");
assert.equal((solutions.match(/class="vv-loan-card vv-detail-card"/g)||[]).length,4,"exactly four detail categories");
const contact=fs.readFileSync("contact.html","utf8");
assert.match(contact,/class="vv-contact-grid"/);
assert.match(contact,/info@vorvan\.co\.in/);
assert.match(contact,/support@vorvan\.co\.in/);
assert.doesNotMatch(contact,/admin@vorvan\.co\.in/);
const partners=fs.readFileSync("partners.html","utf8");
assert.match(partners,/id="vv-institutional-inquiry-form"/);
assert.match(partners,/partnerships@vorvan\.co\.in/);
const privacy=fs.readFileSync("privacy.html","utf8");
assert.match(privacy,/legal@vorvan\.co\.in/);
const admin=fs.readFileSync("admin.html","utf8");
assert.match(admin,/id="signin-form"/);
assert.match(admin,/mfa/);
for(const name of pages.filter(p=>!["experience.html","404.html"].includes(p))){
 const html=fs.readFileSync(name,"utf8");
 const footer=html.match(/<footer class="vv-footer">([\s\S]*?)<\/footer>/)?.[1];
 assert.ok(footer,name+" has a footer");
 const mailboxLinks=[...footer.matchAll(/href="mailto:([a-z]+@vorvan\.co\.in)/g)];
 assert.equal(mailboxLinks.length,1,name+" must have exactly one contextual footer mailbox");
 const expected=["partners.html","partner-desk.html","lsp-api-integration.html","lender-api-readiness.html","institutional-partnership-brief.html"].includes(name)?"partnerships@vorvan.co.in":["privacy.html","terms.html"].includes(name)?"legal@vorvan.co.in":["solutions.html"].includes(name)?"support@vorvan.co.in":"info@vorvan.co.in";
 assert.equal(mailboxLinks[0][1],expected,name+" must route context to correct team");
 assert.match(footer,/Incorporation pending/);
}
const css=fs.readFileSync("assets/refresh.css","utf8");
assert.match(css,/\.vv-loan-grid/);
assert.match(css,/\.vv-contact-grid/);
assert.match(css,/@media\(max-width:560px\)/);
console.log("PASS: four planned loan categories, Partner With Us, contextual email routing, admin hidden and responsive layout");
