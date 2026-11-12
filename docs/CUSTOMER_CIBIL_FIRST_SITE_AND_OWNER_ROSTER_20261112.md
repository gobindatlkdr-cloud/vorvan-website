# VORVAN Customer-First Website Release — GoodScore-Informed Original Marketing & Real Enquiry Roster

**Date:** 12 November 2026 · **Company:** VORVAN PRIVATE LIMITED · **Environment:** public static GitHub Pages with existing Supabase project `vorvan-dev-india` (`kukfpsqujlutlgwndplh`).  
**Status:** source implementation; deployment/CI evidence to be recorded following verification.

## Customer journey

1. **Public homepage:** a polished burgundy, original "See a problem. Understand your next step" campaign with three visual cards (credit-report issue explanations, 30/60/90-day credit education, and secure loan enquiry). The main CTA opens `customer.html`; a separate **Partner With Us** button still opens institutional intake. Visitors may read the four loan categories publicly; customer score preview and enquiry are behind verified email authentication.
2. **Account login:** existing Supabase Auth email link/OTP login; short-lived JWT is held only in page memory. No passwords, PIN, OTP, bank details, PAN, Aadhaar or actual credit data are stored by the website. A verified Auth user must sign in before their profile form is displayed. Phone is **self-reported, not SMS verified**. Email delivery, redirect configuration and actual mailbox sign-in require separate UAT.
3. **Customer profile:** customer consents to secure processing and saves name, verified email, 10-digit mobile, employment category, working/occupation description and versioned consent timestamp in the existing `public.vorvan_customer_intake_profiles` table. PostgreSQL RLS is enabled; authenticated users can see only their own record and update only approved contact fields. No bureau score or application data are stored in this table.
4. **CIBIL-style preview:** after profile, customers choose **two clearly fictional scenarios: 662 or 748**. These are fixed test fixtures unrelated to their individual identity or financial history. No credit bureau pull, real score, report, eligibility, AI financial advice, lender offer or real decision. Never store the fictional score in the customer database.
5. **CIBIL Guide:** 3-/6-month educational plan previews with a 30/60/90-day improvement-learning roadmap. No payments, subscriptions or guaranteed score changes. An issue-reporting preview covers unknown account, incorrect overdue/DPD, closed account still active and identity mismatch with safe lender/bureau official correction guidance. No actual repair/dispute filing or expert assignment.
6. **Loan enquiries:** four informational categories (Personal, Business, Education, Short-Term) with fictional score-band explanations; any verified customer may submit a **non-binding information enquiry** independent of their fictional score. `public.vorvan_customer_enquiries` saves only the selected category, topic, short redacted question, timestamp and manual status. No lender data transfer, application, approval, financial decision or referral is created.

## Real Admin roster and manual updates

The existing Supabase Edge function `customer-operations` requires a valid user token, confirmed company-owner email on the private Admin ACL and **AAL2 MFA**. There is no public Admin endpoint for personal customer data.

- **GET /profiles (new):** owner-only bounded 80-record query returns the most recent saved contact profiles **even if no loan enquiry has been submitted**. All fields are allowlisted and the response is `private, no-store`. No borrower score, password, PIN, OTP, bureau report, PAN, Aadhaar, income amount or account details.
- **GET /enquiries (existing):** owner-only enquiry queue, with related contact information for manual review.
- **PATCH /enquiries/:id (existing):** owner-only conditional status updates with optimistic version check, limited staff reply text and a PostgreSQL trigger that atomically records staff updates in a private audit table.
- **Admin UI (updated):** separate **Customer Profiles** roster and **Loan Information Enquiries** queue under the existing authenticated Admin Customer module. Data cleared from DOM when leaving the module or signing out; no localStorage or exported CSV of PII.

## Security and compliance boundaries

- Existing RLS policies limit own profile insert/update/select and own enquiry submission/read to fully authenticated, non-anonymous users.
- **Anonymous users cannot read or write** contact profiles or enquiries. Contact consent does not equal bureau consent or lender-share permission.
- No payment, real CIBIL, AI score or lender API is activated. Fictional score examples are **not** used to determine actual enquiry submission eligibility or real loan matching.
- Supabase API publishable key is public by design; secret/service keys remain server-side in existing functions. Do not enable real bureau or lender features until signed contracts, lawful consent, identity checks, secured server-side adapters, legal review and independent penetration testing.
- Professional review of privacy notice / DPDP applicability and retention is still pending. Credit-score disputes must follow official lender/bureau procedures.
- This release **does not create a duplicate database**: the existing customer profile/enquiry tables and constraints were inspected and reused (0 real customer rows at inspection). The Supabase Auth email-link setup needs an actual test with a controlled mailbox before a fully verified end-to-end claim.

## Verified source, deployment and remaining UAT

- **[Implementation PR #54](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/54)** merged into main at commit `6a28f965d28f517a813841b5949ec69866fa6b07`; conflicted superseded PR #53 closed without merging.
- **[Source Static Security CI #43142268639](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43142268639)** and [source Live URL #43142268749](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43142268749) SUCCESS, including Owner profile roster source/DOM tests, CIBIL-first homepage and existing PostgreSQL consent/enquiry RLS.
- **Post-merge main:** [Static Security #43142545527](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43142545527), [GitHub Pages #43142545500](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43142545500), [Live Website #43142545552](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43142545552), [sitemap diagnostic #43142545607](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43142545607) all SUCCESS. Live workflow checks the new homepage CIBIL marketing, customer portal JS 662/748 examples and existing Owner enquiry anonymous 401.
- **Supabase deployed:** `customer-operations` Edge function upgraded safely from v1 to **v2 ACTIVE, verify_jwt=true** after verifying the old source matches the new source with the sole addition of `GET /profiles`; original company Owner/AAL2 ACL, no-store and origin restrictions preserved. The new endpoint's anonymous **401** is checked separately in a dedicated live workflow update; until that passes, do not claim the anonymous check was independently completed.
- Real person OTP email delivery, actual profile insert, Owner AAL2 browser clickthrough and real customer-vs-customer isolation **not yet tested**; production security/DPDP legal review remains required. All actual CIBIL, lender offer, repair, AI financial decision and payment functions remain blocked.

## Verification and rollback

- Add new site regression covering CIBIL-first public marketing, real Auth/own-row RLS, no real score/loan API, verified owner-only Admin roster, and consumer disclosures.
- Add three Admin profile-roster tests; run existing customer portal and isolated PostgreSQL RLS suites as part of the full GitHub security CI.
- After PR checks pass, deploy server Edge `customer-operations` with **verify_jwt=true**, retaining its existing Owner AAL2 and explicit CORS origin restrictions; test anonymous `GET /profiles` returns 401.
- Merge GitHub PR, verify public HTML/JS and GitHub Pages release. Site delivery is not evidence of successful OTP email delivery or receipt of an actual customer enquiry; these require separate real-user UAT.
- **Rollback:** revert the scoped website PR; if owner-profile Edge route needs rollback, redeploy the independently saved previous Edge function source. Existing database customer records must **not** be deleted during rollback.

**Delivery classification:** customer profile and information enquiry infrastructure is a real authenticated contact workflow, while all score, AI/expert, lender and payment features remain synthetic/disabled. No previous blocked production milestone is unblocked or reclassified merely by this design update.
