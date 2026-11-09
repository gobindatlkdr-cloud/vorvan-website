# VORVAN — M1/VOR-010 Admin Readiness & Role-Scoped Synthetic Sandbox

Date: 10 November 2026. This milestone adds fictional queues to the EXISTING approved MFA Admin Panel. This is a learning/workflow prototype only, never borrower data or a real credit or lending operation.

## Implemented source

- admin.html: a Readiness Sandbox button in the existing hidden authenticated dashboard navigation.
- assets/admin.js: the new module is dynamically imported only after the existing /admin-console/overview API succeeds, confirming the server-approved role. Backend requires verified Supabase Admin ACL and AAL2 MFA. Rechecks session and role before the asynchronous module mounts. Clears simulated state on sign-out. The existing real operational task form stays hidden on the synthetic readiness panel.
- assets/admin-readiness-sandbox.js: pure source module reusing actual VOR-008 Passport sessions and canonical VOR-009 action-plan templates (derived from VOR-007 rules). No new tables, functions, authentication systems, production roles, or backend writes.
- assets/admin.css: burgundy responsive cards, task stage controls, locked release indicators and accessible focus.
- backend/tests/admin_readiness_sandbox.test.ts and backend/tests/admin_readiness_ui.test.ts: role, source template parity, invalid IDs, forged updates, release locks, DOM, integration gating, and no-network checks.

Versions: admin module vor010-synthetic-2026-11-10-v1; VOR-009 templates sandbox-2026-11-09-90d-v1.

## Fixed synthetic role matrix

| Approved Admin role | Visible educational templates | Stage updates | Reset demo | Production release |
| --- | ---: | --- | --- | --- |
| Owner | 18 | Simulated only | Yes | NO |
| Operator | 12 operations-scope only | Operations templates only | No | NO |
| Auditor | 18 sanitized synthetic templates | Read-only | No | NO |
| Unknown/unverified | No access to dashboard | No | No | NO |

Task stages: todo, in_progress, reviewed. Three categories Personal, Business, Education; six synthetic VOR-009 questions per category; day 30, 60 and 90 milestones. The first four templates per category are operations-scope; final two are compliance-scope. Change history is capped at 30 local synthetic entries, contains no personal data, and is not a real audit log. Browser reload/sign-out clears all demo state.

Seven always BLOCKED release gates: incorporation COI/CIN, approved customer Auth/consent, formal direct lender LSP/API contracts, credit bureau/provider agreements, independent legal/privacy approval, independent security/VAPT, real payments. They cannot be unlocked by completing demo tasks or by any role.

SECURITY NOTE: Browser-side sandbox permissions are illustrative, NOT real backend authorization. Existing verified Admin ACL and AAL2 enforce access to the actual dashboard. JavaScript is publicly inspectable and contains no sensitive records or production credentials. New module has no fetch, XHR, local/session storage, email/notification, financial account, backend writes or PII. Every snapshot marks release_ready false, production_access_enabled false, real_customer_records 0 and no_backend_storage true.

## Tests / acceptance

GitHub CI invokes Deno role/scoping/source tests and actual module synthetic DOM tests, syntax/type checks, earlier MFA/Vault/Vyn, VOR-006 through VOR-009 and isolated PostgreSQL consent-RLS. Evidence links and PR/merge SHA added after verification.

VOR-010 overall remains PARTIAL pending real Owner/Operator/Auditor AAL2 session E2E, mobile Safari/VoiceOver/Android accessibility, reviewed workflow content and independent VAPT. Real owner-scoped task tables, secure retention/RLS, audit and customer consent are not implemented. No real customer onboarding, score, lender approval or payments are active.

Proposed VORVAN PRIVATE LIMITED remains pre-incorporation; COI/CIN pending.
