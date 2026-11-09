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

GitHub [PR #31](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/31) branch [Static Security & RLS run #42676930137](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42676930137) **SUCCESS**: actual VOR-010 model **14/14 PASS**, admin UI and AAL2/ACL mount static+sandbox DOM **2/2 PASS** (new total 16/16); inherited VOR-007/008/009 including 6,561 source/browser parity, M0 MFA/Vault/Vyn, source check/type checks, and isolated PostgreSQL 17 User A/B consent RLS PASS. [Live website regression #42676930024](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42676930024) **SUCCESS** on the existing site. These are synthetic tests, **not** proof of an actual signed-in Owner/Operator/Auditor AAL2 E2E browser session. The new Admin UI is eligible for Pages publishing after merge.

VOR-010 overall remains PARTIAL pending real Owner/Operator/Auditor AAL2 session E2E, mobile Safari/VoiceOver/Android accessibility, reviewed workflow content and independent VAPT. Real owner-scoped task tables, secure retention/RLS, audit and customer consent are not implemented. No real customer onboarding, score, lender approval or payments are active.

## Verified merged deployment and live surface (10 November 2026)

- [Implementation PR #31](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/31) squash merged as main SHA dd761bebadd01e23043b95e7ecaddf08eccf3cb4.
- [Production branch Static Security + isolated PostgreSQL RLS #42677319230](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42677319230) SUCCESS; [Live URL and anonymous admin API denial #42677319346](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42677319346) SUCCESS; [GitHub Pages build and deploy #42677319759](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42677319759) SUCCESS.
- The deployed [Admin Console](https://vorvan.co.in/admin.html) still displays the sign-in/MFA entry screen. The new first-party module at https://vorvan.co.in/assets/admin-readiness-sandbox.js was fetched from the live host successfully and matched the VOR-010 synthetic module content. Note: the module is publicly readable JavaScript by design; it contains fictional templates only. The actual Dashboard mounts the module after successful server-approved AAL2 Admin sign-in.
- All new 16/16 sandbox engine + actual UI synthetic-DOM tests PASS; real Operator/Auditor user accounts and signed-in cross-role browser evidence are NOT available. No real customer/task data was read or modified during this check.
- Current coverage limitation: role authorization for the **real** backend uses pre-existing ACL+AAL2 and has not been modified; the new frontend role matrix controls only in-memory fictional stage changes. Do not use this module for real loan servicing/borrower records.

Proposed VORVAN PRIVATE LIMITED remains pre-incorporation; COI/CIN pending.
