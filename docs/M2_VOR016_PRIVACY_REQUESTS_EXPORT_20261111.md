# VORVAN M2 / VOR-016 — Privacy Requests & Export (Synthetic Only)

**11 November 2026** · Milestone VOR-016 · Company registration owner-confirmed · Demo source on GitHub Pages; live data-rights processing **NOT ENABLED**.

## Scope and boundaries

This single development milestone builds a **synthetic privacy-operations training workflow** under the existing company Admin login. The page is accessible through the verified Admin dashboard after the pre-existing server-verified Owner/Operator/Auditor ACL and AAL2 MFA /overview gate. It is not a customer portal, not statutory compliance, and does not verify actual identities or access/delete/transfer any information held by VORVAN. Real identity, real user-consent registration, privacy-rights requests, correspondence, email, legal notices, production exports and deletions remain disabled.

The external source repository is public: browser role simulation, synthetic fixture labels and model state are not security credentials or substitutes for real server-side permission/RLS controls.

## What is implemented

| Source | Scope |
| --- | --- |
| assets/privacy-requests-sandbox.js | Deterministic in-memory training model. Five fixed request types: access, correction, deletion, export, consent withdrawal; two fully fictional subjects; strict no-free-text intake; fixed role/team scope; simulated fixture match and canonical VOR-006 privacy notice version; optimistic revisions and safe status transitions; Owner-only simulated approval/completion; bounded 12-case session; frozen in-memory audit; seven immutable production blockers; zero real data operations. |
| assets/privacy-requests-ui.js | First-party Admin queue with fixed-choice intake and user-visible warning, English/Bengali/Hindi VOR-006 draft privacy notice, synthetic fixture match, Owner review, fictional JSON preview for access/export, no browser download/network, session reset, review history and blocked release gates. textContent-only rendering. |
| assets/admin.js; admin.html; assets/admin.css | Burgundy, responsive Privacy Requests panel, mounted only after existing server/role/AAL2-approved Admin dashboard. Demo state is cleared on logout or role change; real Admin task-write form remains hidden for synthetic area. |
| backend/tests/privacy_requests_sandbox.test.ts | Actual engine security, fixed schema, subject mismatch, revision replay, Owner/Operator/Auditor RBAC, workflow, demo export, audit/retention boundaries, no real data/no network. |
| backend/tests/privacy_requests_ui.test.ts | Actual browser module synthetic DOM, approved Admin mount guard, roles, canonical notices, export preview, disabled roles, audit and reset. |
| .github/workflows/static-security.yml | All VOR-016 tests, JS syntax and Deno type checks mandatory alongside previous VOR-001–014 and isolated PostgreSQL RLS checks. |

## Lifecycle and privacy controls

- **Intake:** requires mode "synthetic_only"; one of two fictional subject fixtures; fixed request type; exact generated VOR-006 unapproved draft privacy notice version; explicit demo notice acknowledgement. Extra contact, name, email, PAN, account, KYC, document, notes and free text fields rejected.
- **Fixture match:** accepted only if the chosen fixed fictional marker matches the request's preselected subject fixture and revision. This is *not* identity authentication, identity verification, KYC, OTP or proof-of-data-subject ownership. A real requester must later be authenticated via a separately reviewed flow.
- **Status machine:** submitted → fixture_verified → under_review → (human_review when appropriate) → approved → simulated_complete. No arbitrary jump, old revision, repeat completion, real data mutation or automated decisions.
- **Sensitive rights:** deletion and consent withdrawal **require** a human-review simulation and Owner approval before fictional completion. They do not delete records or revoke actual consent. Other types also require Owner approval.
- **Export/access:** Owner-only, permitted after simulated approval and exact subject fixture match. Only a fixed fabricated JSON preview is shown in the page; it has zero fictional records and explicitly no production data. Completion of access/export demo requires that fictional preview. No file transfer, download link or actual data export.
- **Role matrix:** Owner may see/review all synthetic requests and reset session; Operator may create/verify/triage only access, correction and export training requests, cannot view/review deletion or withdrawal, cannot approve/complete/preview or reset; Auditor may view synthetic summaries/audit but cannot mutate.
- **Audit:** event numbers monotonically increase in page memory with only fixed action, role, team and fictional request ID; events/cases are frozen and appended. Logout/reset destroys audit. This is **not** durable compliance evidence.
- **Hard release blocker:** production rights, real data processing, export, deletion and consent operations are permanently disabled in this demo, even for Owner.

## Acceptance and open risk ledger

No production Supabase migration, Edge deployment, customer records, notification, email, auth change, data-provider connectivity or live privacy requests are part of this milestone. Existing VOR-006 customer identity/consent is not live. Only synthetic UI files deploy via static site, and their front-end permissions are demonstrative.

The VOR-016 ticket remains **PARTIAL** after source/CI merge until: genuine customer MFA/identity and request authenticity checks; server-enforced user-to-data authorization and tenant isolation; durable and tamper-resistant audit; legal DPDP applicability, rules, notices and timelines verified by professionals; proper verification/minimization/retention and secure export delivery; real deletion/correction with backups and statutory exceptions; third-party data mapping and processors; request response workflows and grievance handoff; accessibility/mobile/Safari testing; independent VAPT and owner/legal approval.

**Rollback:** revert this isolated milestone PR, then reconfirm Admin AAL2/ACL and Pages. No real database or customer data needs rollback from this synthetic-only change.

**Verification evidence:** Record exact PR, commit, tests and post-merge GitHub Actions/Pages results after independently checking them. Do not claim real AAL2 browser E2E, regulatory compliance or production rollout because synthetic CI passes.

**Handoff:** stop at VOR-016. The next roadmap work package is M3 VOR-015 (Payment/Subscription Sandbox) according to the 20-ticket backlog. Do **not** start it automatically.
