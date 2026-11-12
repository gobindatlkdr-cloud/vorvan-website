# VORVAN PRIVATE LIMITED — Real Indian Mobile OTP Activation & Secure Applicant Data Access

**12 November 2026 · Production readiness runbook**

## Current verified facts
- Supabase project: **vorvan-dev-india**, project ref `kukfpsqujlutlgwndplh`, database region **ap-south-1 (Mumbai)**. The project is healthy at last review.
- Existing `public.vorvan_customer_intake_profiles` holds applicant profile (father, address, optional contact email, verified phone, occupation and employer/business details) and `public.vorvan_customer_enquiries` holds nonbinding category-specific questions and manual status.
- Last read-only counts: **0 applicant profiles and 0 loan enquiries**. Two Supabase Auth users existed but are not counted as applicant profiles.
- Both applicant tables have RLS enabled. `anon` has no SELECT grants; the customer cannot UPDATE their verified mobile. Owner-only `customer-operations` Edge function uses JWT + private Owner ACL + **AAL2 MFA**, and its current version is v3 with `verify_jwt=true`. Applicant CIBIL score is never saved in the profile database.
- The first screen is `https://vorvan.co.in/customer.html`, mobile-only. **SMS_PROVIDER_READY=false** in public source; OTP button is deliberately disabled. Actual applicant profile submission has not been UAT-tested. No claim of active SMS or fully verified onboarding.

## Real SMS OTP: external decisions / user permission required
VORVAN must have an actual **SMS delivery account**, an applicable **Indian DLT Principal Entity (PE) registration**, approved header, approved content template and provider balance/billing, plus access to Supabase **Auth → Providers → Phone** settings. **Do not put API secrets in chat or public GitHub**; enter them only into the provider dashboard or Supabase secure secret settings with controlled access.

### Suggested route for India — MSG91 with Supabase Send SMS Hook
- MSG91 can map DLT PE ID, approved sender/header and template; regional India SMS infrastructure is appropriate for testing. Its OTP pricing changes with volume; verify the current official checkout amount before authorizing any payment.
- Supabase supports a **Send SMS Auth Hook** that can use regional providers. MSG91 is **not** one of the listed built-in phone providers; do not pretend its API key can be pasted into the native Twilio field. Engineering must create a dedicated authenticated hook, verify Supabase hook signatures, send **Supabase-generated OTP** through an approved DLT template and return success **only on a genuinely accepted provider request**, keeping all credentials server-side. Do not use MSG91's separate self-generated OTP as a replacement for Supabase JWT verification without a separate identity architecture/security review.
- Vendor references: https://msg91.com/help/dlt-registration-in-india/step-by-step-guide-to-implement-dlt-in-sms and https://docs.msg91.com/sms ; Supabase: https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook.

### Simpler native Supabase alternative — Twilio Verify
- Supabase supports Twilio Verify as a first-class SMS Phone provider: https://supabase.com/docs/guides/auth/phone-login?showSmsProvider=Twilio .
- In India, verify with Twilio **in writing** that the selected sender flow and approved DLT header/template can deliver compliant OTP traffic before paying or changing production Auth settings. Do not activate unless actual test SMS delivery works.

## First external action for the company owner

1. Confirm **which SMS provider** VORVAN will use: **MSG91 (recommended for evaluating Indian DLT integration, but needs a custom Supabase hook)** or **Twilio Verify (native setup, check India sender compliance)**. If an account exists, report only provider name, whether DLT PE/Header/Template is approved and current account status; **never send OTP, passwords or full API keys**.
2. If VORVAN has no DLT registration, register the legal company as a **Principal Entity** with an Indian telecom operator's DLT portal (company COI/KYC details may be required). Apply for a sender header (e.g. `VORVAN`, subject to availability and approval) and service/OTP message template.
3. Sample DLT content for operator review (the final wording must match provider template exactly): `VORVAN: Your login verification code is {#var#}. Do not share this code with anyone.`
4. Map the DLT PE ID, approved Header ID and Template ID to the selected SMS provider; approve pricing/top-up only after showing the official amount. No transaction, signup, account acceptance or payment should be claimed before confirmed.
5. Configure the provider inside **Supabase Auth → Providers → Phone** (for native provider) or Auth **Send SMS Hook** (for MSG91), with confirmation mandatory; never enable auto-confirm or public fake-number bypass.
6. Configure 6-digit OTP, sensible short expiry, cooldown, per-IP/device quotas, abuse detection and CAPTCHA consistent with production Auth settings; verify authentic messages to **a number the owner controls**, including wrong/expired code and rate-limit behavior.
7. Perform real SMS provider test followed by **two separate controlled test applicants** (Salaried/Government and Business) and Owner AAL2 UI review. Verify no cross-user data visibility, session logout, profile update and staff manual enquiry audit.
8. After verified testing and privacy/legal signoff, change fail-closed `SMS_PROVIDER_READY=false` to `true` in a separate reviewable GitHub PR, CI/Pages deploy and independent live check. Do not enable real CIBIL score, subscriptions, lender APIs or credit repair as part of OTP activation.

## Where VORVAN Applicant Data Lives — Owner access only

**Two ways to read it:**

**A. Your VORVAN Owner Admin portal**: open https://vorvan.co.in/admin.html, log in with authorized Owner account and complete MFA. Select **Customer/Applicant Profiles & Loan Enquiries**. The **Applicant Profiles** roster shows applicant name, mobile, father, address, work and consent even before a loan enquiry. A separate **Loan Information Enquiries** queue shows the loan category, status and staff reply. Because the Admin API is Owner/AAL2 and token-validated, regular visitors and staff cannot read the entire list. The present API displays **up to the latest 80 rows**; for all historical records, use authenticated Supabase Table Editor or add approved backend pagination later.

**B. Supabase project dashboard**: https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh. Sign in with the project Owner's Supabase account → **Database → Table Editor** → select schema `public` → `vorvan_customer_intake_profiles` or `vorvan_customer_enquiries`. Phone verification records (if any) are managed in **Authentication → Users**, never copied into an exposed public table.

**Precautions:** Admin and Supabase owner accounts need MFA and least-privilege access; never publish credentials, API service-role keys, full data exports, OTP or customer info in GitHub/chat. Treat exports as sensitive; encrypt backups, avoid uncontrolled CSV downloads, document retention and honour corrections/deletion requests. RLS, OTP and encryption in transit reduce risks but are not substitutes for legal review and independent security testing.

## Release states & dependencies
- **Done:** private data structures, RLS, verified phone-only profile flow code, conditional occupation form, Admin Owner roster, educational credit demo and manual enquiry backend.
- **Done with this UI-only follow-up:** read-only synthetic applicant form preview for design inspection (no network/data collection).
- **Not done:** real provider account approval, DLT PE/header/template approval, authenticated SMS sender configuration, real OTP to a controlled recipient, live applicant form submission UAT and production privacy/VAPT sign-off.
- **Do not pretend SMS OTP is active, or report customer records that do not exist.**

Official regulatory guidance: https://www.trai.gov.in/advice-to-senders .
