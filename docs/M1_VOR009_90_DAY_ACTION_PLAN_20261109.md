# M1 VOR-009 — 90-Day Educational Action Plan & Milestone Tracking

**Date:** 2026-11-09 · **Repository:** `gobindatlkdr-cloud/vorvan-website` · **Product:** VORVAN Credit Readiness educational sandbox.

## Implementation

A browser-only, versioned and multilingual 90-day **educational reflection plan** was integrated into the existing `readiness-passport.html` Passport review, reusing the actual VOR-007/008 synthetic questionnaire and explainable rules. It is **not** a loan decision, a bureau/CIBIL prediction, an improvement guarantee, a real financial product or a customer record.

### Source and integration

- `assets/readiness-action-plan.js`: canonical VOR-009 **pure JavaScript ESM** engine imported by both browser and Deno tests; imports generated `assets/readiness-questions.js` and `assets/readiness-engine.js`, which CI confirms match the VOR-007 TypeScript source exactly. Version: `sandbox-2026-11-09-90d-v1`; questionnaire version pinned to `sandbox-2026-11-09-v1`.
- `readiness-passport.html`: additional landmark inside the existing Passport review for 30/60/90 educational tasks, accessible progress and an explicit *reminder preview only*. No new public signup, free-text input, personal identifiers or form submission.
- `assets/readiness-passport.js`: renders the plan using DOM `textContent`, not untrusted markup, and holds completion, simulated-day selection and preview opt-in **in memory only**. It resets on category change and reload; retains task completion during language switching for the same category.
- `assets/readiness-passport.css`: VORVAN burgundy, accessible focus, semantic list and mobile layout.
- `backend/tests/readiness_action_plan.test.ts`: direct deterministic plan, language, origin, reminder and privacy tests.
- `backend/tests/readiness_passport_ui.test.ts`: expanded tests using the **actual UI module** with a synthetic DOM for task buttons, preview, multilingual continuity and resets.

### Milestones and decision logic

| Milestone | Synthetic days | Contents |
|---|---:|---|
| D30 | 1–30 | VOR-007 questions 1–2: financial planning topics (no numeric amounts) |
| D60 | 31–60 | Questions 3–4: category-specific reflection topics |
| D90 | 61–90 | Questions 5–6: category-specific reflection topics |

Each task has a deterministic, version-pinned ID, question ID, milestone ID, due simulation day, original VOR-007 answer type (`missing`, `unsure`, `not_yet`, `considered`), localized title/action/rationale, traceable original rule ID where present, and an independent `completed` boolean.

**Important:** marking `considered` in the questionnaire **does not** mark the corresponding action-plan task as done. Completing all six tasks means only that the educational topics were marked reviewed, never that someone qualifies for credit. Task progress is a count, not a credit/readiness score.

Any supplied readiness result must be recomputed from VOR-007's original finite-choice answers. Forged IDs, PII-bearing fields, altered score flags or fabricated rationale are rejected; the engine does not store or send customer data.

### Reminder simulation — no notifications

- Default OFF; a user can explicitly toggle a fictional reminder **preview** on.
- Simulated day selector uses fixed day choices 1–90; the engine strictly validates integer day bounds.
- Within seven fictional days of milestone D30, D60 or D90, the preview shows only the number of incomplete **educational** tasks for that period.
- No `Date`, `setTimeout`, `setInterval`, Web Notifications, email/SMS/push API, cron, server endpoint, account, calendar event, subscription or user reminder is created. Output explicitly has `notification_sent:false`, `delivery_enabled:false`, `scheduled_job_created:false`.
- Changing category or restarting resets completion progress, preview opt-in and simulated day; reloading clears memory.

### Language, accessibility and boundaries

English, Bengali and Hindi are supported for plan headings, milestone ranges, task instructions, reasons, status, progress, opt-in preview, simulation and warnings. Existing Passport keyboard, skip link, descriptive status and responsive/reduced-motion styles remain.

The live page is informational and **noindex**, with a restrictive CSP (`connect-src 'none'`, `form-action 'none'`) and no actual signed-in VOR-006 customer identity or consent. No CIBIL, lender API, KYC, credit application or payment is activated.

### Test commands

```sh
node scripts/build_readiness_browser.cjs --check
deno test backend/tests/readiness_action_plan.test.ts
deno test --allow-read backend/tests/readiness_passport_ui.test.ts
deno test backend/tests/readiness_browser_parity.test.ts
node --check assets/readiness-action-plan.js
node --check assets/readiness-passport.js
deno check assets/readiness-action-plan.js
python3 scripts/check_site.py
```

Existing company security, Vault, MFA and isolated PostgreSQL consent-RLS regressions remain mandatory in `.github/workflows/static-security.yml`.

## Verified GitHub merge, deployment and live browser smoke

- [PR #29](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/29) squash-merged into `main` at **`d9112041e4fcdf56ac860dbc53306270d89dfd56`**. [Static Security + Postgres RLS main run #42670350399](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42670350399) **SUCCESS**, [Live URL #42670352776](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42670352776) **SUCCESS**, [GitHub Pages build/deploy #42670350036](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42670350036) **SUCCESS**.
- [Scoped live browser smoke `8d8d3485-f2d8-402f-8c3d-5a01ad80485c`](https://agent.tinyfish.ai/runs/8d8d3485-f2d8-402f-8c3d-5a01ad80485c) reported **10/10 checks PASS** on the publicly deployed `https://vorvan.co.in/readiness-passport.html` without entering personal data. Evidence included 30/60/90 milestone cards with 2 tasks each, independent 0/6→1/6 task progress while questionnaire remained 0/6, OFF-by-default reminder preview showing 1 fictional Day-30 topic after simulated Day 29 opt-in, no observed browser notification prompt, Bengali/Hindi language switch preserving task progress, Business/Education task/category reset, full reload clearing answers and preview, and no visible CIBIL/loan approval. No browser console/runtime errors observed.
- **Translation QA limitation:** while the major plan headings, task/action text, progress, reminder preview and safety statements switched between Bengali/Hindi/English, browser review noticed some navigation/technical labels still in English. Track complete translation and screen-reader acceptance as pending, not a fully cleared localization audit.
- Real browser smoke + code tests **do not** prove independent accessibility/VAPT, production Auth/consent compliance, server-side storage authorization, absence of all web request telemetry, or delivery behavior of a real notification system. None of those systems were activated.

## Remaining acceptance and production restrictions

- VOR-009 implementation and automated synthetic tests are the scoped delivery; overall VOR-009 remains **PARTIAL** pending legal/product review, real Safari/Android/VoiceOver/TalkBack accessibility, adverse UX/security testing, documented customer-consent/retention and owner approval.
- Any real `owner-scoped` task storage, PII, customer reminders, scheduler, push/SMS/email delivery, KYC, lender or bureau data use **must not** be inferred from this simulation. They require new separately approved authentication, RLS, DPDP/consent workflows, provider integrations and independent security QA.
- Related tickets M0/VOR-001–005, M1/VOR-006–008, VOR-010/011 and all future milestones remain tracked in the cumulative ledger.
- Proposed VORVAN PRIVATE LIMITED remains **pre-incorporation**, COI/CIN pending.

## GitHub CI and browser evidence

**Verified PR tests:** [PR #29](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/29); [Static Security CI #42669890354](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42669890354) **SUCCESS**, including new VOR-009 **15/15 Deno tests PASS**, existing Passport synthetic DOM **3/3 PASS** with VOR-009 task/reminder interactions, VOR-008 canonical/browser exhaustive parity **6,561/6,561 PASS**, current/earlier security validations, and the isolated PostgreSQL customer consent RLS job **PASS**. [Live URL verification #42669889854](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42669889854) **SUCCESS** on the unchanged live baseline. Branch CI does not prove the new UI is live until GitHub Pages publishes after merge. Future live-browser acceptance remains separate.
