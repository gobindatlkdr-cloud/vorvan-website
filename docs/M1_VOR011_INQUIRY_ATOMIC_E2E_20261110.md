# VORVAN M1 / VOR-011 — Institutional Inquiry Intake → MFA Queue → Atomic Audit

**Date:** 10 November 2026 (IST) · **Scope:** Direct LSP agreements / direct lending API enquiries from banks and NBFCs only. Not DSA, lead referral, a public customer service, bank/NBFC verification, or a partner credential-issuance flow.

## Starting-state evidence (read-only live Supabase)

- Edge Function `institutional-inquiries` was ACTIVE version 3 with `verify_jwt=false` for public POST. Private staff GET/PATCH validate the Auth /user JWT, confirmed email, company allowlist and JWT `aal2` claim in the function. This is not a replacement for genuine real AAL2/session-revocation E2E.
- `public.vorvan_institutional_inquiries` and `public.vorvan_institutional_inquiry_audit` have RLS enabled; no direct `anon` or `authenticated` table grants or policies.
- **0** real inquiries and **0** audit events in those tables before this milestone. No actual partnership or staff action was simulated against production.
- Observed weaknesses before remediation: inquiry INSERT or review PATCH could succeed while separate audit POST errors were silently suppressed; duplicate form retries could create ambiguity after network timeout; rate checking used untrusted IP forwarding headers and can be bypassed; rate-limit lookups are best-effort/non-atomic.

## Remediation and architecture

| Component | Scope |
| --- | --- |
| `backend/institutional-inquiries/index.ts` | Keep public POST, require validated fields / official institutional email / bank-NBFC / direct LSP-API track and honeypot. Introduce optional version-4 `submission_id` UUID and server HMAC `request_fingerprint`. Before quota checks, replay an existing ID only if identical content; changed content with same ID returns 409. Unique DB key handles concurrent inserts; ambiguous commit can be retried. Missing key remains supported for legacy clients. No raw form content in public receipt or logs. |
| Anti-spam | Email-bucket HMAC throttle, five submissions per hour per official email (best effort), plus fifteen-minute no-new-submission rule and honeypot. Ignore untrusted X-Forwarded-For/CF-IP as authorization signals. Corporate domain restriction does **not prove** real bank affiliation. |
| `backend/migrations/vor011_atomic_inquiry_audit.sql` | Add nullable `submission_id` and HMAC `request_fingerprint`, a uniqueness constraint/index, and `SECURITY INVOKER` AFTER INSERT and UPDATE triggers. Audit insert executes within the same database transaction as the inquiry change, so audit failure rolls back the change. No new client table grants; existing RLS/ACL retained. |
| `assets/institutional-inquiry.js` | Preserve the same cryptographically random in-memory UUID across network failures and unchanged-form retries; change it when fields change. A timeout explicitly says a previous submission **may** have committed, rather than falsely claiming no record. No browser storage. |
| `assets/admin.js` | MFA-gated Partner Inbox gets a **View review history** action. Role-allowed users can see restricted audit metadata through `GET ?view=audit&id=<uuid>`. Auditor remains read-only on PATCH; Owner/Operator may review. No raw financial data or OTP in history. |

**Important:** DB triggers are the atomicity boundary. Edge Function code MUST NOT be deployed before the SQL migration is successfully applied and verified, otherwise intake may write unaudited data or error. The built-in per-email SQL count is not an atomic distributed rate limiter; concurrency, botnet, IP rotation and many fresh institutional addresses remain a future anti-abuse/security task.

## Verification

- `backend/tests/institutional_inquiry_workflow.test.ts`: import and execute actual Edge Function handler; fake Auth users and PostgREST with synthetic Bank/NBFC content. Test intake, explicit replay ID, payload conflicts, ambiguous commit, audit failures, corporate email, prohibited DSA, spam and spoofed headers, quota, disabled public methods, company AAL2 roles, role-scoped queue, read-only audit GET, status updates, ACL/service outage and failure/retry safety.
- `backend/sandbox/vor011_inquiry_fixture.sql` + `backend/sandbox/vor011_atomicity_tests.sql`: temporary PostgreSQL 17 container, not Supabase production. Execute actual checked-in migration. Exercise Owner/Operator audit metadata, INSERT and UPDATE audit, no-op updates, UUID uniqueness, and deliberate audit CHECK constraint failures to prove a failed audit **rolls back** its inquiry INSERT or review PATCH.
- `scripts/test_institutional_form_retry.cjs`: run real public form JS in a synthetic DOM; verify request UUID reuse after timeout, new key when payload changes, corporate mailbox guard and honeypot.
- Existing VOR-002 MFA tests, M0 security controls, M1 VOR-006 Owner/B consent RLS and VOR-007–VOR-010 regression suites stay enabled in GitHub Actions.

**PR/CI and applied production migration/function evidence:** append *verified* PR head run IDs, result counts, migration version, Edge Function version and live no-PII smoke outcomes after execution. Green CI is not by itself independent VAPT or proof of a real bank caller.

## Residual work and exit criteria

1. Auth AAL2 real Owner/Operator/Auditor login and signed-session revocation test, actual staff inbox browser/mobile/a11y E2E; only one real company Owner is verified in the current account.
2. Institution verification independently from RBI/official website and official communication, manual review before any partnership claims. No automatic partner credentials and no real API integration is authorized.
3. CAPTCHA/Turnstile or server-gateway verified anti-bot/rate-limiting, privacy/redaction and data retention policy, time-to-delete/export, backup restore, independent penetration testing. Current email-key 5/hour check is **not concurrency-safe**.
4. Status transition policy, audited history immutability and capture of both status and note changes when amended together; current audit records one action per changed database row and does not record field-level before/after values.
5. External email notification/delivery, independent legal/privacy wording and operational incident/reconciliation monitoring remain unverified. Public form remains informational; no customer PII, loan application or KYC may be submitted.

**Release classification:** VOR-011 code/test/atomicity subtask can be completed independently; overall M1 VOR-011 remains **PARTIAL** until the above real-user, security and legal signoffs. VORVAN incorporation remains pending (MCA fees paid; no CIN/COI).
