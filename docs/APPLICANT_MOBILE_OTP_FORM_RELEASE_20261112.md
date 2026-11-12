# VORVAN Applicant Login — Mobile OTP and Conditional Identity-Profile Intake
**Date:** 12 November 2026 · **Company:** VORVAN PRIVATE LIMITED (registered) · **Status:** phone-only customer interface and secured database source; live SMS verification must remain disabled until configured.

## Public design (original burgundy VORVAN)
- `customer.html` opens directly to **Applicant Login** / **Kindly Login** with a 10-digit Indian mobile input; no email login/link, no direct loan or score UI before authentication.
- Illustration uses original HTML/CSS mock phone and credit-journey panel. OneScore/Paisabazaar screenshots are design inspiration only; no copied marketing claims or company assets.
- **Phone +91 OTP** design: POST Supabase `/auth/v1/otp` with phone, POST `/auth/v1/verify` with `type:"sms"`, then authenticated GET `/auth/v1/user` must confirm matching `phone_confirmed_at` before any profile read/write. JWT kept only in page memory.
- **Fail-closed launch flag `SMS_PROVIDER_READY=false`:** OTP submission/verification is disabled until real India-compliant SMS sender, Supabase Phone provider settings, sender-template and delivery tests are complete. No fabricated code, email link fallback, fake verified identity or silent storage. Public page must visibly state SMS activation pending.

## Applicant Details after verified mobile (future enabled auth)
- Personal: full name, father's name, address line, town/village, district, state, PIN, optional **self-reported/nonverified** email.
- Employment: salaried/private company/central government/state government/PSU/other salaried; conditionally company/employer or government department and designation. Self-employed/business: retail/services/manufacturing/trading/professional/agriculture/other, firm name. Student/homemaker/other simple occupation details.
- Explicit consent required before first save. Never collect income amount, bank account, PAN, Aadhaar, date of birth or credit score. Sensitive inputs are private and do not appear in GitHub code, logs or URLs. Account creation never automatically authorises lender sharing or marketing.
- On successful save, app opens the existing protected customer dashboard. Fictional CIBIL samples 662/748, CIBIL Guide, educational issue help and nonbinding Personal/Business/Education/Short-Term loan information enquiries remain **separate** from genuine applicant identity and do not become real lender decisions.

## Reuse and enforcement
- Existing Supabase project, `auth.users`, `public.vorvan_customer_intake_profiles` and `public.vorvan_customer_enquiries` reused. Migration `20261112_applicant_mobile_otp_profile.sql` extends the applicant profile with conditional categories; verified phone immutable to user; consent version `applicant_mobile_v1_2026_11_12`.
- SQL RLS preserves legacy email users (if any) and strictly requires `auth.uid()`, authenticated/non-anonymous JWT phone ownership **plus real `auth.users.phone_confirmed_at`**, via tiny boolean-only security-definer function in **unexposed `vorvan_authz` schema**. Phone cannot be overwritten. Each customer accesses only their own profile/enquiry; `anon` has no access to customer PII.
- Existing `customer-operations` Edge function validates Owner ACL and AAL2 MFA before service-role lookup; profile roster shows all applicant fields for Owner only, including applicants with no enquiry. Admin review and atomic audit remain unchanged. Protect access against stale session/revoked Owner by verifying /user each call as existing backend code already does.
- Add synthetic tests of government/business branches, JWT phone match and tampered claim denial, email optional, immutability and other-user profile denial. Run disposable PostgreSQL 17 RLS suite; no real PII fixtures.

## Mandatory external activation
1. Enable Supabase Auth **Phone** provider with Twilio/MessageBird/Vonage/Textlocal supported service, or supported custom SMS hook. Store sender credentials only in Supabase dashboard/secrets, **never in public GitHub**.
2. Register correct Indian sender identity / template with applicable TRAI DLT processes and verify SMS delivery and cost/abuse limits. Configure per-IP/device OTP throttling and CAPTCHA/rate limits; confirm SMS terms/price before enabling.
3. Perform verified recipient UAT (OTP request, rate limit, wrong/expired OTP, ownership, profile form both salaried and business, Admin Owner read, logout/relogin and user A/B isolation). Security, DPDP consent/retention/legal review and privacy rights before production.
4. Only after provider + regulatory + security prerequisites, change `SMS_PROVIDER_READY` to true in a separate reviewed release, run CI and actual SMS deliverability verification. Keep true status from customer-facing notice until proven.

## Release classification
**Website applicant first-screen:** ready to publish as *SMS activation pending* and no live profile intake. **Database schema:** secured migration, once independently applied and verified. **Real SMS OTP and end-to-end applicant onboarding:** BLOCKED on external provider/DLT, legal and UAT. **Credit bureau, lender, subscription and payment:** OFF.

Rollback of design: revert scoped PR; no destructive DB migration. If Edge function is rolled back to previous version, do not expose new PII through any other pathway. Data retention/deletion and user correction must be handled by lawful operations, not by deleting tables.
