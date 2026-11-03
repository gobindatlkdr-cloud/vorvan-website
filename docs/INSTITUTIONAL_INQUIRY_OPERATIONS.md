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
