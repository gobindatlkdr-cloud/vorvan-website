/** No-data Applicant Profile preview plus SMS activation release gate. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const read=path=>fs.readFileSync(path,"utf8");
const html=read("applicant-form-preview.html");
const css=read("assets/applicant-preview.css");
const login=read("customer.html"),portal=read("assets/customer-portal.js");
const doc=read("docs/REAL_SMS_OTP_ACTIVATION_AND_APPLICANT_DATA_ACCESS_20261112.md");
assert.match(html,/Applicant Details Form/);
assert.match(html,/SYNTHETIC DESIGN PREVIEW/);
assert.match(html,/noindex,nofollow,noarchive/);
assert.match(html,/connect-src 'none'/);
assert.match(html,/script-src 'none'/);
assert.match(html,/form-action 'none'/);
assert.doesNotMatch(html,/<(?:form|script|iframe|object|embed)\b/i,"preview must not submit, run scripts or embed");
assert.doesNotMatch(html,/<(?:input|textarea|select)\b/i,"preview does not accept personal information");
for(const required of [
 "Applicant Full Name","Father's Name","Full Address","District","PIN Code",
 "Employment Category","Private Company","Government Department","Designation",
 "Type of Business","Business / Firm Name","example@invalid.example"]){
 assert.ok(html.includes(required),"sample detail missing: "+required);
}
assert.match(css,/\.vp-examples/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(login,/Applicant Login/);
assert.match(login,/Kindly Login/);
assert.match(portal,/const SMS_PROVIDER_READY=false/);
assert.match(portal,/send\.disabled=!SMS_PROVIDER_READY/);
assert.match(portal,/user\.phone_confirmed_at/);
assert.match(portal,/\/auth\/v1\/verify/);
assert.match(doc,/MSG91/);
assert.match(doc,/Twilio Verify/);
assert.match(doc,/DLT/);
assert.match(doc,/AAL2 MFA/);
assert.match(doc,/vorvan_customer_intake_profiles/);
assert.match(doc,/vorvan_customer_enquiries/);
assert.match(doc,/0 applicant profiles and 0 loan enquiries/);
assert.match(doc,/Do not put API secrets in chat or public GitHub/);
assert.doesNotMatch(html,/supabase\.co|sb_publishable_|sb_secret_/);
console.log("PASS: read-only synthetic applicant preview, no scripts/network/PII and fail-closed real SMS provider activation");
