# VORVAN — M1 / VOR-007 Readiness Questionnaire & Explainable Rules QA

**Date:** 09 November 2026 (IST) · **Existing repo:** `gobindatlkdr-cloud/vorvan-website` · **Ticket:** VOR-007.

## Implementation in this milestone

Implemented in source control a pure deterministic educational readiness questionnaire/rules engine for **Personal**, **Business** and **Education** categories. Each questionnaire contains six carefully worded fixed-choice questions (two shared, four unique), localized to **Bengali, Hindi and English**. Neither free text nor any monetary amount, bank account number, PAN, loan offer, OTP, credit report or borrower identity is accepted.

Code: `backend/readiness/questions.ts`, `backend/readiness/engine.ts`, `backend/readiness/demo.ts`; developer usage: `backend/readiness/README.md`.

### Safety model

- `mode: "synthetic_only"` is mandatory and input shape/answer values are fail-closed.
- Unanswered/unsure questions are treated as incomplete. `not_yet` triggers a topic-specific educational action and a reason; `considered` records only **self-reported** consideration, not verified finances.
- Each explanation contains the question, deterministic rule ID, observed answer type, localized rationale and suggested next step.
- No numeric credit-readiness score, CIBIL score, predicted bureau score, eligibility threshold (including 700), repayment capacity calculation, lender match, application, KYC or payment functionality.
- Full answers mean **educational questionnaire reviewed**, **not** loan eligibility, approval or score improvement.
- Pure function module performs no storage, network access or logging. No public web form, new Supabase Edge Function, database schema or customer-facing route was deployed.

### Tests and evidence

`backend/tests/readiness_rules.test.ts` provides deterministic validation for all category-locale pairs, exact questionnaire schema, full/partial/unsure/omitted replies, ordered reasons, category crossover, unknown keys and malicious/PII/free-text/numerical values, non-scoring safety, deterministic output, and offline/no-network behavior.

`backend/readiness/demo.ts` runs hardcoded fake examples for all three categories; GitHub CI parses the emitted records and rejects any non-null CIBIL score, eligibility/offer flag or personal-data storage.

**Verified PR checks:** [PR #26](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/26), [Static Security CI #42659708723](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42659708723) **SUCCESS** (new VOR-007 Deno engine tests **16 passed, 0 failed**, Deno source typecheck PASS, and the three-category synthetic-demo no-score/approval/PII output check PASS). All existing M0 VOR-002/003/005 tests, VOR-006 Customer Auth, and isolated PostgreSQL 17 consent-RLS checks also PASS. [Live URL verification #42659708884](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42659708884) **SUCCESS**. Evidence was taken from the branch PR; repeat CI on any later changes before merging. No live customer or financial endpoints are enabled.

### Current release boundaries / pending

- Initial question/rule catalogue supports exactly three categories. The site's fourth **Short-Term Loan** informational category is not part of this ticket; do not silently apply Personal rules to it.
- VOR-008 is responsible for accessible rendered Customer Questionnaire/Readiness Passport screens, language choice, unknown/empty/error states and approved consent gating.
- VOR-006 production customer login/consent is not enabled. No real borrower inputs or session/record retention safeguards are established here.
- Need independent legal/product/compliance review of wording and explainable rules, broader adversarial and fairness testing, signed lender/provider agreements as applicable, accessibility tests and independent security testing before releasing real customer guidance.
- Proposed VORVAN PRIVATE LIMITED remains pre-incorporation (MCA fee paid, COI/CIN pending). No live lending, bureau/CIBIL, KYC, loan application or payment services are activated.

**Acceptance:** source-only synthetic questionnaire + pure explainable non-decision rules with CI evidence **complete after green CI**. Overall VOR-007 remains **PARTIAL** because live application/security/legal acceptance is pending.
