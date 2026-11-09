# VORVAN — Cumulative Development & Pending Ledger
Updated: **09 November 2026**. Source of ticket IDs: Developer Handover v1 (09 Nov 2026), section 15.
Status key: **DONE** = source + verification evidence; **PARTIAL** = substantive work exists but exit criteria missing; **PENDING** = required exit evidence not available; **BLOCKED** = external approvals/contract needed. Do not relabel pending work as complete without new evidence.

| Milestone | Ticket | Work package | Status | Remaining acceptance evidence |
| --- | --- | --- | --- | --- |
| M0 | VOR-001 | Audit and freeze source baseline | PARTIAL | **Annotated tag m0-baseline-20261109 verified at SHA d8456ffa…; source recovery dry-run PASS; architecture/runbook committed.** Still enforce GitHub tag protection ruleset (none configured), rehearse live/staging rollback, recover missing deployed API source, verify database backup/restore |
| M0 | VOR-002 | Admin MFA + role E2E | PARTIAL | **Synthetic request-handler role/MFA matrix and production metadata audit implemented;** real Owner AAL2 browser proof, actual Operator/Auditor test identities, token expiry/revocation and real cross-role E2E remain pending |
| M0 | VOR-003 | Compliance Vault E2E | PARTIAL | **Real request-handler synthetic PDF/version/SHA-256/download/audit/role tests 13/13 PASS** ([CI 42648050436](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42648050436)); real Owner AAL2 + private Storage E2E, failure-reconciliation for post-metadata stages/audit, genuine Operator/Auditor RBAC, safe retries and evidence capture still pending |
| M0 | VOR-004 | Supabase security remediation | PARTIAL | **Migration 20261109161637 applied; Data API future postgres default grants revoked; 11/11 read-only SQL assertions PASS; current 23 RLS tables, 0 anon grants, 12 auth SELECT unchanged.** Pending: Pro-only leaked-password protection on Supabase Free, owner-dashboard Data API exposed schema check, supabase_admin defaults exception, real session/role E2E, rate-limit/VAPT |
| M0 | VOR-005 | Public Vyn routing/UX QA | PARTIAL | **EN/BN/HI handler 10/10 PASS, synthetic DOM PASS, API-priority/privacy patch LIVE as Supabase site-assistant v4 and Pages deployed; live browser 3/5 PASS, 2 NOT TESTED.** Remaining: actual OTP suppression + Escape verification, mobile/Safari/assistive-tech QA, DLP bypass/rate-limit, privacy/logging and content review |
| M1 | VOR-006 | Customer identity & consent | PARTIAL | **Gated sandbox-only customer Auth handler, synthetic three-language versioned notices, append-only consent events, owner RLS + isolated Postgres/handler tests implemented in source; no live deployment.** Remaining: actual customer login/verified-email UI, real JWT/session E2E, legally approved consent, data export/delete, retention/backup, browser/a11y, rate-limit and owner go-live approval |
| M1 | VOR-007 | Readiness questionnaire/rules | PENDING | Explainable rules, incomplete-input behavior, no real score/approval implication |
| M1 | VOR-008 | Readiness Passport screens | PENDING | Localized, accessible UI with empty/error/consent states |
| M1 | VOR-009 | 90-Day Action Plan | PENDING | Versioned tasks, milestones, reminders, owner-scoped records |
| M1 | VOR-010 | Admin readiness module | PENDING | Scoped queues/definitions, task templates, release gate indicators |
| M1 | VOR-011 | Institutional inquiry E2E | PARTIAL | Existing form/backend live; test synthetic intake → scoped staff queue, anti-spam, audit and failure handling |
| M2 | VOR-012 | Vyn personal coach sandbox | PENDING | Consent-gated mode, safe guidance, redaction, escalation |
| M2 | VOR-013 | Support & complaints | PARTIAL | Existing internal support foundation; complete SLA, case lifecycle and scope checks |
| M2 | VOR-014 | AI governance & reporting | PENDING | Prompt/model registry, safety evaluation, role-scoped dashboards |
| M2 | VOR-016 | Privacy requests & export | PENDING | Authenticated access/correct/delete/export request workflow |
| M3 | VOR-015 | Subscription/payment sandbox | PENDING | Provider-independent simulation, refunds, idempotent webhooks; no live charges |
| M4 | VOR-017 | Partner tenant IAM/portal | BLOCKED | Verified bank/NBFC invitation, MFA, tenant isolation; no live partnership claim |
| M4 | VOR-018 | Bureau/lender adapter mocks | PENDING | Synthetic mock adapters and contracts only; no production keys |
| M4 | VOR-019 | Loan comparison & case tracking | BLOCKED | Synthetic KFS/APR UI; production offers and status require lender-verified APIs |
| M4 | VOR-020 | Go-live gate & independent review | BLOCKED | Signed partnerships, independent VAPT, legal/owner sign-off, rollback monitoring |

## Verified completions to date
- Corporate website with **Personal, Business, Education, Short-Term** informational categories and professional **Partner With Us** landing.
- Public Admin mailbox/link removed from customer-facing pages; context-specific departmental contact routing.
- Secure private Company Vault backend and M0 bounded streaming upload/JSON parsing; public Vyn information separation; GitHub CI and live checks.
- Pre-M0 rollback branch and **verified annotated tag `m0-baseline-20261109`** now exist. Tag creation and isolated recovery run [42641757122](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42641757122) passed. **No GitHub tag protection ruleset exists, so the ref is not immutable against authorized deletion/update; this is not a database backup.**
- **Earlier VOR-004 step:** `backend/security/m0_vor004_exposure_assertions.sql` committed and executed against current Supabase: 10/10 PASS; audit report archived. This is a metadata check only.
- **Current VOR-001 step:** Pinned baseline manifest, verified annotated tag and successful isolated source-recovery check, architecture inventory, safe rollback runbook, and CI regression checks implemented. Live/staging rollback, enforced tag immutability and DB recovery remain pending.

- **Current VOR-002 step:** real Admin, Vault and MFA Recovery handler tests built with in-memory synthetic identities; no live account creation, no real OTP. Read-only Auth/ACL audit confirms one enabled Owner with a verified TOTP factor, no active Operator/Auditor. Test evidence: `backend/tests/admin_role_gates.test.ts` and `docs/M0_VOR002_MFA_ROLES_20261109.md`. **This is not real session-level E2E.**

- **Current VOR-003 step:** actual Vault handler with synthetic PDF bytes, version history, SHA-256, prior/current download, audit, size/type/signature rejection, Owner/Operator/Auditor and incorporation gates tested **13/13 PASS**. Evidence: `backend/tests/company_vault_workflow.test.ts`, `docs/M0_VOR003_VAULT_WORKFLOW_20261109.md`, [CI run 42648050436](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42648050436). Live DB remains at **0 uploads/0 audit events**; real browser MFA/Storage E2E and failure reconciliation still required.

- **Current VOR-005 step:** GitHub PR #20 merged at `ea4fc286...`, main CI [#42650146800](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42650146800), live URL [#42650147074](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42650147074), Pages [#42650146805](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42650146805) PASS; Supabase public Vyn Version 4 ACTIVE. Source tests 10/10 multilingual + synthetic DOM PASS; [live browser](https://agent.tinyfish.ai/runs/103092f1-97df-46a2-bb4b-196da6660b59) **3/5 PASS, 2 NOT TESTED** (dummy OTP and Escape). Real privacy/browser/accessibility/abuse acceptance remains open. Report: `docs/M0_VOR005_VYN_MULTILINGUAL_SAFETY_20261109.md`.

- **Current VOR-004 follow-up:** Applied Supabase migration **20261109161637** from reviewed PR #22; pre-remediation SQL 7/11 → post-remediation **11/11 PASS**. New postgres-owned public objects no longer receive automatic anon/authenticated grants; future function PUBLIC EXECUTE blocked, while existing 23/23 RLS, 0 anon grants, 12 authenticated SELECT grants and private Vault remain intact. Evidence: `backend/security/m0_vor004_data_api_assertions.sql` and `docs/M0_VOR004_DATA_API_THREAT_REVIEW_20261109.md`. **Supabase Free leaked-password protection, Data API dashboard schema setting, supabase_admin defaults, live AAL2/session and VAPT remain pending.**

- **Current M1 VOR-006 step:** existing `profiles` and legacy `consent_events` are preserved; new disabled-by-default sandbox-only `backend/customer-identity/index.ts`, EN/BN/HI notice registry, `backend/sandbox/vor006_customer_consent_schema.sql`, genuine Postgres RLS isolation fixtures and synthetic Edge handler tests added. Non-production only; **no live user signup, no actual consent or Supabase schema changes**. Evidence: `docs/M1_VOR006_CUSTOMER_IDENTITY_CONSENT_SANDBOX_20261109.md` and associated GitHub CI. VOR-006 remains PARTIAL pending real Auth/legal/customer UX approvals.

## Incorporation and financial service release gates
- **VORVAN PRIVATE LIMITED: proposed; incorporation pending; MCA fees paid.** No COI/CIN or corporate registration claim until evidence provided by owner.
- Keep all live CIBIL/bureau/KYC, loan applications, payments and actual lender offers OFF until applicable legal, lender/API, bureau/provider and security approvals.
- **Next recommended single step:** M1 VOR-007 — implement a privacy-safe, explainable credit-readiness questionnaire/rules **only against synthetic data**, with no real CIBIL scoring or loan approval. Keep M1 VOR-006 real customer Auth and legally approved consent, M0 security gates and all existing blocked partner features in the cumulative ledger.

## Developer handoff rule
Each delivery: implement **one** narrowly scoped step → run tests → record PR/merge/deployment evidence → update this cumulative ledger → report **কাজ কমপ্লিট — NEXT বলুন** with exact remaining work.
