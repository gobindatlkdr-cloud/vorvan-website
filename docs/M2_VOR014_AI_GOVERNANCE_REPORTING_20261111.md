# VORVAN M2 / VOR-014 — Synthetic AI Governance & Reporting

**Date:** 11 November 2026. **Classification:** restricted Admin UI mount but all static assets in public source. **Status:** scoped synthetic implementation; overall ticket remains **PARTIAL** until real controls and sign-off exist.

## Objective and exact boundaries

This milestone adds a *fictional*, fixed-choice AI governance training sandbox to the existing VORVAN Admin console. It does **not** approve models, grant financial services authority, process prompt text, infer from any users, perform customer analytics, or authorize production. No Supabase migration, Edge deployment, real customer/loan data, live AI calls, outbound email, notifications or browser persistence.

The company is **registered per owner confirmation**; exact COI/CIN/PAN have not been verified/published in this repository. Neither registration nor this demo means RBI licence, verified lender partnership or bureau rights. The old Admin banner, README and public informational pages displaying outdated pre-incorporation text were corrected on this scoped branch, alongside their regression assertions.

## Source changes

| File | Purpose |
| --- | --- |
| assets/ai-governance-sandbox.js | Frozen three-entry fictional model/version registry (DEMO-VYN, DEMO-RULES, DEMO-ROUTER), six safety policies, six role-scoped review flags, 18 fixed synthetic evaluation outcomes, cohort-size suppression (minimum three), optimistic revision transitions, append-only/frozen per-session event history and seven permanently blocked release gates. |
| assets/ai-governance-ui.js | First-party textContent-only demo dashboard: registry, policy review, human-review flagging, safe aggregate metrics, gated synthetic evaluations, event history and locked release criteria. |
| admin.html, assets/admin.js, assets/admin.css | Burgundy Admin Governance navigation and responsive panels, mounted only after existing server-authorized Admin /overview role/AAL2 gate. Owner, Operator and Auditor scopes; logout/role change erases demo state. Company-registration label corrected. |
| backend/tests/ai_governance_sandbox.test.ts | Real module deterministic evaluation, forbidden inputs, role matrix, revision replay, safety flags, aggregate suppression, privacy, memory-only events and immutable gates. |
| backend/tests/ai_governance_ui.test.ts | Actual browser module synthetic DOM tests and regression checks for Admin verification guard, role-scoped controls, reset and zero network. |
| .github/workflows/static-security.yml | Mandatory test, JS syntax and Deno checks; all previous MFA, Vault, customer consent, Vyn, support, and isolated PostgreSQL RLS CI checks remain in place. |
| docs/VORVAN_MILESTONE_PENDING_LEDGER.md | Ticket VOR-014 moves to PARTIAL with explicit remaining acceptance; no blanket DONE. |

### Role permissions — demo only

- **Owner**: sees all fictional registry entries, policies, flags and aggregates; can run fixed policy suite, mark critical flags for human review, acknowledge after review, and erase the temporary review session.
- **Operator**: sees only operations-team fictional registry/flags/aggregate cohorts; can run scoped fictional suite and flag assigned items; cannot finalize a human-review flag or reset everything.
- **Auditor**: can read all fictional summaries and in-memory history; cannot mutate flags, run evaluation or reset.
- No role can override **any** production release gate. These are JavaScript demo constraints, not substitutes for server-enforced permissions on real records.

### Security and reporting assertions

1. Only enumerated, static model IDs, policy IDs and review choices. Review mutation requires **exactly** flag_id, decision, expected_revision; unknown data, free text, PAN/email/customer ID fields and stale revision are rejected.
2. No raw prompts, LLM provider, personal identifiers, loan data or model secrets are embedded in registry/fixtures. All analytics are aggregate from **three synthetic samples per policy**; no individualized data, small-cohort group or live telemetry.
3. A critical safety flag cannot go directly from unreviewed to acknowledged; owner human-review stage required. Accepted synthetic history events are frozen append-only **in memory** and scoped by team. Owner reset erases history while revision numbers are never reused within the same session.
4. GitHub Pages assets are public files; **none are a protected audit database**. Genuine role-based server/RLS controls and durable compliance-grade model/version logging remain pending.
5. Seven permanent release blockers: approved consent/DPDP; live Auth/ACL E2E; independent VAPT; formal model/fairness review; privacy/retention/DPIA; verified lender/bureau permissions; real human support escalation. Production release request always denies.

## Verification, deployment and rollback

**Verified PR-source CI evidence:** [VOR-014 PR #41](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/41) at checked head d2d31c877c225fc1c78bab987b79e053d06d54e7. [Static Security #43058152984](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43058152984) SUCCESS: **18/18** real governance engine tests, **3/3** actual synthetic Admin DOM tests, JS/Deno syntax/type checks, all existing MFA/Vault/Vyn/Support/Institutional tests, and isolated PostgreSQL17 consent/inquiry RLS jobs PASS. [Live URL #43058153139](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43058153139) SUCCESS. These are synthetic checks; genuine Admin AAL2 browser UAT, independent VAPT and legal sign-off are NOT claimed. **Verified post-merge:** [PR #41](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/41) MERGED to main at commit 883c646685ba7922eb437d7fafacd32d4d2764a2. [main Static Security #43058589922](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43058589922) SUCCESS (security-check and isolated PostgreSQL17 consent/inquiry RLS jobs); [Live URL #43058590092](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43058590092) SUCCESS; [GitHub Pages #43058590194](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43058590194) SUCCESS; [read-only sitemap diagnostic #43058589967](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43058589967) SUCCESS. GitHub Pages delivery means the static demo assets were deployed; it is **not** proof of a real signed-in AAL2 browser session or a live AI inference deployment.

**Manual UAT not yet performed**: genuine Owner/Operator/Auditor AAL2 browser clickthrough, Safari/Android assistive-technology accessibility, independent security/VAPT, audit durability and production-grade human oversight. No claim of deployment of a real inference system.

**Rollback**: revert only the VOR-014 PR on main after reviewing the diff; no database migration or customer data restoration required for this synthetic source-only milestone. Keep previously merged VOR-013 support demo intact.

**Defect / remaining acceptance register**: live ACL and session revocation proof; signed model governance policy and version approval; persistent append-only audit with data retention/access reviews; DPIA/DPDP and consent evidence; operationalized human fallback with measured real SLA; prompt-injection/redaction adversarial assessment on an approved future runtime; mobile/accessibility UAT; independent VAPT; owner/legal approval. Avoid claiming an approved AI model, live reporting, regulatory conformity or production readiness until evidence is complete.

**Milestone handoff:** stop after VOR-014. Next queued ticket is VOR-016 Privacy Requests & Export; it is **PENDING** and must not be started in this milestone.
