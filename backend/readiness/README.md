# M1 / VOR-007 — Credit Readiness Learning Rules (Synthetic Only)

**Status:** Source implementation for developer handoff, NOT a live financial assessment. No backend function, table, data-collection endpoint or customer UI was deployed in this ticket.

## Scope

This module covers the three requested initial educational categories: **Personal**, **Business**, and **Education**. The public corporate website also describes **Short-Term Loans**; the fourth category is deliberately **not** enabled in this milestone and remains informational until a separately reviewed questionnaire/rules change is approved.

The word *readiness* in the project title means a person's preparation to learn and organize questions, **not** an evaluation of creditworthiness, credit scores, financial capacity, lender conditions or loan approval.

### Source map

- `backend/readiness/questions.ts` — six mandatory questions per category (two common + four category-specific). English/Bengali/Hindi wording, explanatory rationale and actionable general guidance. Fixed-choice values only: `considered`, `not_yet`, `unsure`.
- `backend/readiness/engine.ts` — pure deterministic, versioned, explicit rule decisions. No network, storage, history, auth, client SDK, bank data or bureau input.
- `backend/readiness/demo.ts` — hardcoded fictional example runner; does not accept interactive/customer input.
- `backend/tests/readiness_rules.test.ts` — scenario, validation, language, incomplete-input, safety and explainability test coverage.
- `.github/workflows/static-security.yml` — require Deno tests, type-check and output-safety checks on PR and main.

### Input example (safe, fictional)

```ts
import {getQuestionnaire, evaluateReadiness} from "./engine.ts";
const questionnaire=getQuestionnaire("personal", "bn");
const result=evaluateReadiness({
  mode: "synthetic_only",
  category: "personal",
  locale: "bn",
  answers: {
    repayment_budget_review: "considered",
    personal_purpose: "not_yet"
  }
});
```

`getQuestionnaire` declares six questions and three fixed choices in the selected language; it never asks for identifying details or money amounts. `evaluateReadiness` returns either `{ok:false,code:...}` without reflecting invalid input, or `{ok:true, ...}` with `workflow_status`, counts of answered questions, IDs for missing/uncertain questions, fixed localized educational next steps, and an ordered list of **explanations**. Each explanation includes `question_id`, `rule_id`, `input_choice`, `observation`, `reason`, `next_step` and `synthetic_self_report_only` evidence. The suggestions are not personalised underwriting advice.

### Explainable rule table

| Fixed answer | Rule observation | System behavior |
| --- | --- | --- |
| Unanswered | No triggered financial rule | Mark question as missing and offer its general topic action |
| `unsure` | `clarification_suggested` | Mark uncertainty and offer a general action; checklist cannot be considered fully reviewed |
| `not_yet` | `review_suggested` | Return general topic action and reason. Full answers may make the *educational checklist* reviewed, but this never means financial readiness |
| `considered` | `self_reported_consideration` | Record a synthetic self-reported consideration, never assert proof, income verification or eligibility |

**Status is only:** `needs_more_information` or `educational_checklist_reviewed`. There is **no numerical readiness score, threshold, risk rank, eligibility estimate, CIBIL prediction, lender matching or approval logic**. Counts refer to questionnaire fields, not credit scores. Output flags explicitly set `credit_score:null`, `eligibility_assessed:false`, `approval_or_offer_available:false`, and `personal_data_stored:false`.

### Safety and migration boundaries

- Root fields allowed: `mode`, `category`, `locale`, `answers`. Unexpected fields such as `user_id`, `pan`, `income`, `cibil_score`, `approval` are rejected.
- Answer keys must correspond exactly to the selected questionnaire and fixed values; no free-text input, amount, dates, Aadhaar, bank account, PAN, OTP, telephone number or uploaded file.
- There is no customer login route, no active customer registration, no API endpoint and no persistent data store in VOR-007. Earlier M1 VOR-006 customer-consent API remains separately gated and undeployed.
- The real website's categories remain informational. No new public questionnaire is linked or published, avoiding collection of real borrowers' financial details.
- Source version: `sandbox-2026-11-09-v1`. Future changes must bump version, review rules, localization and compliance, and run the full scenario suite.

### Testing

From a Deno v2 checkout:

```sh
deno test backend/tests/readiness_rules.test.ts
deno check backend/readiness/questions.ts backend/readiness/engine.ts backend/readiness/demo.ts
deno run backend/readiness/demo.ts
```

The demo contains deliberately made-up choices only and cannot be used to infer any customer's creditworthiness.

### Unfinished work

VOR-007 overall is **PARTIAL** pending compliance/content-owner review of all explanatory rules and translations, integration with VOR-006 approved consent, real authenticated non-production integration and secure data lifecycle, adverse scenario/safety evaluation and subsequent release approvals. **VOR-008** separately covers an accessible, localized UI for questionnaire, error/unknown and consent states. Short-Term category expansion is a separate scope decision.
