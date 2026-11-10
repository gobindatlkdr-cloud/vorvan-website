# VORVAN bank/NBFC inbound programme — 2026-11-03

## Scope
Bank/NBFC partnership proposals only: direct LSP agreements and direct lender API integrations. No DSA, generic lead referrals, loan applications, or customer KYC. Pre-incorporation until COI is issued.

## Flow
Public \`partners.html#institutional-inquiry\` -> Supabase function \`institutional-inquiries\` (public POST) -> \`public.vorvan_institutional_inquiries\` (RLS on, anon/auth grants revoked) -> \`admin.html\` Bank/NBFC Partners tab (MFA-required GET/PATCH).
Inquiries start at \`new\`. Manual verification of institution, domain, representative, RBI regulated status and relevance is required. A status change never grants access or executes a contract.

## Security
No service/secret key in public assets. Allowed origin restricted. Payload size bounded. Input validation, free-mail blocking, honeypot, HMAC-pseudonymised coarse IP rate limiting (best-effort only), duplicate suppression. No files accepted. Audit entries for create/update, status visible to MFA-approved staff only. No anonymous DB access. No raw borrower documents.

## Operator routine
1. Login with confirmed company admin email and MFA (AAL2).
2. Open Bank / NBFC Partners and review Institutional Inbox.
3. Independently check institution at official RBI/bank directories; verify sender via independently sourced official contact—not only form content. Never automatically consider a submission a verified RE.
4. Reply through company Partnerships email only after review; record concise progress notes; no customer data or secrets in notes.
5. Handle privacy deletion requests via legal@vorvan.co.in. Review retention/deletion operation and rate-limit traffic periodically; automated purge is NOT implemented.
6. Add institutional outreach website URL \`https://vorvan.co.in/partners.html#institutional-inquiry?...\` only with correct query placement; for tracking use \`https://vorvan.co.in/partners.html?utm_source=linkedin#institutional-inquiry\`.

## Known limitations
This is an inquiry intake, not a bank-only login and not a Google Reviews gate. No automated email notification, CAPTCHA/Turnstile, anti-bot IP assurance, identity proof or penetration test. Public form can be submitted by a misrepresenting party, so manual verification is compulsory. End-to-end external visitor test, real email delivery and Google Search Console owner verification are separate steps.

## VOR-011 retry and transactional audit enhancement (2026-11-10)

The public form sends a one-use UUID held only in browser-tab memory and reused if a response times out or fails. If the submitted fields change, it generates a new UUID. A retry with the same ID and same normalized content receives the previous receipt; a reused ID with different content is rejected. A network failure cannot prove the inquiry was not saved; use the unchanged form to retry safely, or contact partnerships@vorvan.co.in. No auto-onboarding occurs.

A database AFTER INSERT / review UPDATE SECURITY INVOKER trigger atomically records `created`, `status_updated`, or `note_updated` audit events. If the audit insert fails, the inquiry insert/review update is rolled back. The MFA-protected Owner/Operator/Auditor inbox can inspect an inquiry's audit history; Auditor cannot PATCH. Per-email HMAC throttling and honeypot are best-effort; corporate email domains do not authenticate institutional authority. This does not include CAPTCHA, strong bot prevention, retention automation or independently validated real MFA login.

See [VOR-011 test and release evidence](M1_VOR011_INQUIRY_ATOMIC_E2E_20261110.md). No real lender/customer-data records are part of the synthetic CI tests.
