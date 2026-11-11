# VORVAN M2 / VOR-013 — Support & Complaints Lifecycle Sandbox

**Date:** 11 November 2026 (IST). **Status:** source implementation and synthetic CI only; NOT an approved real borrower complaint channel. **Business:** VORVAN PRIVATE LIMITED, registered per owner's confirmation. Company incorporation is not a lending license.

## Starting-state audit (Supabase read-only)

Project `vorvan-dev-india` already has separate `public.complaints`, `public.complaint_events`, and `public.vorvan_admin_support_cases` tables. The first two hold **0** rows; existing internal support tracker holds **1** row, which was not read, modified, reproduced or deleted during VOR-013. All three tables have RLS enabled; the two complaint tables have authenticated owner-scoped SELECT policies; there are no anonymous client table grants. Admin tracker retains its existing server-mediated `admin-console` handling. **No migration, new client grant, new table, new Edge deployment or real user/test complaint is required for this ticket.**

## Files delivered

| File | Purpose |
|---|---|
| `assets/support-lifecycle-sandbox.js` | Pure fixed-template synthetic case engine, role-scoped queue and audit, demo SLA targets, escalation and finite-state transition rules. |
| `assets/support-lifecycle-ui.js` | Actual first-party Admin Support UI (fake cases, time-offset selector, status control, simulated escalation and visible audit). Uses `textContent`, not raw HTML. |
| `assets/support-lifecycle-sandbox.css` | Burgundy `#741943`, responsive layout, focus indicators and reduced-motion support. |
| `assets/admin.js` | Dynamically loads and mounts sandbox **only inside existing Admin Support section after server-approved Supabase Auth + AAL2 MFA + ACL overview**. Clears demo on logout; does not replace existing internal tracker. |
| `admin.html` | References local first-party stylesheet; corrects outdated company registration banner without enabling credit/lending. |
| `backend/tests/support_lifecycle_sandbox.test.ts` | Real model tests for role scopes, PII-free intake, idempotency, status transitions, demo SLA, escalation, monotonic audit and offline-only constraints. |
| `backend/tests/support_lifecycle_ui.test.ts` | Synthetic DOM executes actual Admin Support UI and checks role visibility, actual case controls, browser-only behavior and MFA mount condition. |
| `.github/workflows/static-security.yml` | Require model tests, UI DOM tests, JS syntax checks and Deno typecheck on PR/main, retaining other M0/M1/M2 and isolated PostgreSQL tests. |

## Strict synthetic constraints

- Case subjects and summaries come from exactly **six predefined public fictional templates**. The intake accepts only `mode:"synthetic_only"`, `template_id`, and a random UUID request ID; no free-text, name, PAN, Aadhaar, account number, email, phone, loan details, customer ID or uploaded document fields.
- There are two immutable fictional seed samples for staff to inspect, one Operations page-navigation issue and one Compliance security incident. `owner` sees both; `operator` sees only Operations; `auditor` sees both but cannot create, transition, escalate or reset. This is **in-memory role simulation**, not a shared role-scoped production database or complete real Owner/Operator/Auditor AAL2 session verification.
- A real approved Admin session is a prerequisite to mounting the module in `admin.js`. The browser model itself is **not an access-control boundary for actual case records** and has no back-end APIs. It cannot access, modify or grant access to the existing internal support case table.
- Safe transitions are `new → triaged → in_progress → awaiting_review → resolved → closed`, with `resolved → reopened → in_progress`. Escalation can move an overdue fictional case (or high-demo-priority Security case) into `escalated`, then back to `in_progress`; direct jumps to `approved`, `closed` or invalid stages are rejected. `closed` is terminal in the demo.
- Every intake, transition or escalation appends an **immutable in-memory demo audit event** with role, action, case ID and timestamp. Version checks, idempotency UUIDs and monotonic event times prevent duplicate writes, stale mutations and backdating; capacity exhaustion fails rather than silently dropping prior entries. Reset is Owner-only and clears this tab's fictional state, not any production audit.
- Illustrative case categories use **internal demonstration targets** (e.g. security acknowledgement 4 h, response 12 h, resolution 48 h; website/general 24/72/168 h). They are **not contractual, regulatory, RBI, consumer grievance deadlines**, nor evidence that a human agent acknowledged or handled any request. A local clock offset demonstrates elapsed-time breaches and escalation recommendations.
- Browser module has **no fetch/network, localStorage/sessionStorage, cookies, database, notification, email sending, personal information or production SLA delivery**. No actual complaint/reference receipt is issued. Existing Support and Legal mailboxes remain external correspondence channels governed by their own processes.

## Verification evidence

Required before merge: Deno tests of actual engine, synthetic DOM tests of actual UI, syntax/typecheck, earlier VOR-002–012 regression and isolated PostgreSQL 17 RLS/audit CI; Live URL check. After merge verify main CI and GitHub Pages. **PR and exact CI run IDs must be filled with observed green results, not assumed.**

Security context: Supabase official RLS documentation requires explicit least-privilege grants as well as policies for data exposed via Data API. This VOR-013 step **does not create a new Data API or write directly from the browser**. It intentionally defers real database row-scoped support queues until approved Auth, DPDP privacy and legal workflows are ready.

## Remaining / VOR-013 overall PARTIAL

1. Real customer/grievance intake authenticated and consented, secure evidence/attachments, anti-spam and abuse controls, verified reference delivery, privacy notices and DPDP rights; no collection of real borrower financial/identity data in this sandbox.
2. Actual backend role-scoped case database access and versioned SQL transactions, tamper-evident persistent audit, real operator assignments and restricted cross-role testing with actual AAL2 tokens and revoked sessions. The current model is only an in-memory simulation.
3. Approved official grievance SLA and escalation/acknowledgement timelines, staff assignment, legally reviewed categories, real human handoff and case notifications, monitored retry/recovery, holidays/timezones and provider delivery tests.
4. Independent VAPT, comprehensive DLP, real Android/Safari screen reader / keyboard accessibility, consent/accessibility review, and operational runbook/incident response. Existing data retention/export remains VOR-016.

**Acceptance:** Implement and test a fixed-choice, role-scoped, nonpersistent **synthetic** support lifecycle in the authenticated Admin Support UI; keep VOR-013 **PARTIAL** until real service-level and compliance gates are independently satisfied.
