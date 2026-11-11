# VORVAN M2 / VOR-013 — Synthetic Support & Complaints Lifecycle

**Date:** 11 November 2026. **Environment:** GitHub source + first-party Admin support panel; no Supabase writes/deployments, no real complainants, no live SLA notifications or auto-reply.

## Existing production baseline (read-only)

Supabase project `vorvan-dev-india` has existing `public.vorvan_admin_support_cases`, `public.complaints` and `public.complaint_events`. All three tables have RLS enabled; anonymous direct grants = **0**. Read-only counts before this change: internal support cases **1**, customer complaints **0**, complaint events **0**. This milestone does **not** inspect the actual content of the existing internal case or mutate these tables.

The existing admin-console endpoints for real support cases offer basic `open/in_progress/closed` CRUD and action logging but do not provide verified, auditable SLA/escalation/transition controls. Existing VOR-006 real customer Auth/consent is not deployed. Therefore do **not** silently enhance real case writes or register genuine complainants through a fictional demo.

## Implementation

| Source | Behavior |
| --- | --- |
| `assets/support-lifecycle-sandbox.js` | Pure deterministic in-memory synthetic lifecycle model. Five fixed topics: general, website, partner, security, complaint. No free-text, PII, customer ID, loan/account data, contacts or messages. |
| `assets/support-lifecycle-ui.js` | First-party accessible/basic synthetic queue UI, fixed-choice intake, case status, demonstration due time, escalation acknowledgement, chronological audit and Owner-only clock reset/advance. Uses `textContent` exclusively for generated text. No browser storage or network. |
| `assets/admin.js` | Mounts the module solely in the authenticated company Admin `support` area after the already-established AAL2/verified allowlist/role gate. The synthetic model receives role from this verified context, **not** from client-provided case data. Logout clears the in-memory model. UI RBAC is not a replacement for backend authorization on real customer cases. |
| `backend/tests/support_lifecycle_sandbox.test.ts` | Synthetic role matrix, state machine, due-date and breach calculations, permitted escalations, rejected PII and unknown inputs, immutable append-only in-memory audit, erasure, no external network. |
| `backend/tests/support_lifecycle_ui.test.ts` | Executes real module with synthetic document DOM; verifies AAL2 Admin mount source guard, UI fixed choices, Owner creation, Owner clock, Owner reset, Auditor lockout and no outbound network. |
| `.github/workflows/static-security.yml` | Requires new engine and UI regression tests, syntax checks and type-check on every PR/main run. Retains all pre-existing security and PostgreSQL RLS checks. |

### Synthetic example transitions

`open → triaged → in_progress → resolved → closed` or `open/triaged/in_progress → escalated → in_progress/resolved`. Closed cases cannot be reopened through this demo. Unsupported skips and no-ops fail closed. Only Owner and Operator may create/transition/acknowledge synthetic cases; Auditor may view history but cannot write. Only Owner may advance the fictional clock or erase the synthetic session.

**Illustrative nonregulatory SLA targets:** security 8 hours; complaint 24 hours; general, website and partner 48 hours. The training clock advances manually, no notifications occur, and an overdue unresolved case is flagged for escalation. Attempting to resolve an overdue case without escalation acknowledgment is denied. These intervals must **not** be represented as statutory or contractually enforceable grievance deadlines. Actual escalation policy needs separate legal/compliance/service review.

The audit trail is append-only and event-frozen **in page memory only**, linked by fictional case ID and role, with created/status transition/acknowledgment/clock events. On reload/logout/Owner reset, it disappears. **It is not a durable compliance audit log**; production transactional DB audit, immutable retention, backup/export and independent verification are still required.

### Security boundaries

- `mode: "synthetic_only"` mandatory; preset and category must match a fixed enumerated synthetic scenario. Fields such as PAN, name, account number, email, identity, custom subject or notes are outright rejected.
- No real customer, finance, KYC, bureau, loan, payment or case data; no `fetch`, localStorage, cookies, notifications, mailto submission or third-party analytics by this sandbox.
- Module is visible only in the previously authenticated Admin console and intentionally does not create real public intake, complaints, case SLA or operator follow-up obligations.
- Real support information and real customer complaints remain managed under separate existing guarded endpoints, with gaps tracked.
- Real Operator/Auditor identities, MFA sessions, AAL2 revocation, actual customer case RLS, DPDP/retention policy, human escalation and regulatory grievance timelines require independent tests and approvals.

## Quality evidence

CI and PR link(s) will be appended after exact-head tests pass. Expected checks: 15 Deno engine scenarios, actual UI synthetic DOM, type-check, previous MFA/consent/institutional inquiry tests, and isolated real PostgreSQL consent/inquiry RLS tests. No live support case will be written for these checks.

**Overall ticket:** `PARTIAL` even after successful merge, because production complaint intake, durable audited state/SLA, actual human escalation, privacy processes, genuine Owner/Operator/Auditor E2E, real mobile screen readers, incident monitoring and VAPT remain pending.
