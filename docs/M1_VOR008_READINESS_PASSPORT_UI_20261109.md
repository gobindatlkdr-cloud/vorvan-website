# VORVAN — M1 / VOR-008 Readiness Passport & Multilingual UI

**Date:** 09 November 2026 · **Scope:** synthetic educational product demonstration only · **Company:** proposed, incorporation pending (no COI/CIN). No live CIBIL, bureau, lending, KYC, payment, real customer login or application.

## Scope and customer experience delivered

An independent, responsive `readiness-passport.html` page with VORVAN burgundy branding (#741943), three synthetic learning categories and fixed-choice questions. The existing `solutions.html` informational product catalogue has a clearly marked educational preview link. The page is **noindex, follow** pending full product/legal acceptance.

| Browser component | Behavior |
|---|---|
| Category choice | Personal, Business, Education. Switching category explicitly resets the current ephemeral answers. Short-Term Loan remains a separate informational concept, not given fabricated rules. |
| Language | English, Bengali and Hindi for navigation, privacy notices, prompts, choices, reasons, incomplete states and educational passport details; switching languages preserves answers for the current category. |
| Questionnaire | Six prompts per category; three safe fixed choices: reviewed / not yet / unsure. No free-text, age, name, phone, income, account number, PAN, OTP, file, upload, credit report or financial values. |
| Progress | Answered-topic count with native `role=progressbar`, current-step sidebar, next/back, direct step navigation and explicit skipped/unsure states. **Not a readiness or CIBIL score.** |
| Passport overview | Action suggestions and explanations from the **identical generated VOR-007 rules module**. Missing fields remain incomplete, uncertainty is not converted into a decision, and a completely answered questionnaire only means educational topics were reviewed. |
| Safety/consent | No session, API call, network fetch, analytics, storage, cookies, signup or genuine consent collection. VOR-006 production Auth/consent remains OFF. Reload/close clears all in-memory choices. |
| Accessibility | Semantic headings, skip-to-content, native radio fields, accessible buttons, live progress updates, keyboard navigation and visible focus, mobile responsiveness and reduced-motion stylesheet. Automated synthetic DOM coverage does not substitute for real Safari/VoiceOver/TalkBack acceptance. |
| Security | `connect-src 'none'`, `form-action 'none'`, no inline/external script or third-party fonts, no unsafe text interpolation/HTML injection, error states fail closed. |

## Actual VOR-007 rule reuse: one source, browser output verified

- `backend/readiness/questions.ts` and `backend/readiness/engine.ts` remain canonical source.
- `scripts/build_readiness_browser.cjs` deterministically emits `assets/readiness-questions.js` and `assets/readiness-engine.js` from the TypeScript originals **without external npm dependencies**. `--check` ensures committed browser copies are exact; fails closed on unexpected TS structure.
- The browser UI imports `assets/readiness-controller.js`, which itself imports and runs **the VOR-007 generated rules**. There is no separate eligibility/score approximation on the website.
- `backend/tests/readiness_browser_parity.test.ts` exhaustively compares **3 categories × 3 locales × 3^6 fixed-choice combinations = 6,561 identical complete results**, plus partial, malformed, unknown and prohibited answers, comparing each browser result with the actual canonical TS result.
- `backend/tests/readiness_passport_ui.test.ts` exercises the actual browser module with a synthetic DOM, checks language, selection, progress, missing answer summary, topic switch reset, edit/restart, no fetch/localStorage, and CSP/disallowed PII entry fields.

## Verification commands

```bash
node scripts/build_readiness_browser.cjs --check
node --check assets/readiness-questions.js
node --check assets/readiness-engine.js
node --check assets/readiness-controller.js
node --check assets/readiness-passport.js
deno test backend/tests/readiness_browser_parity.test.ts
deno test --allow-read backend/tests/readiness_passport_ui.test.ts
deno test backend/tests/readiness_rules.test.ts
```

Existing M0/M1 security suites, including Supabase RLS synthetic and isolated PostgreSQL Owner A/B checks, remain required.

## Release and security status

The page is publicly viewable as a **fictional, informational sandbox**; its content is not financial advice, underwriting, loan eligibility or approval and is explicitly disconnected from any real customer session or external service. The actual VOR-006 Customer Auth/consent backend is still **undeployed and disabled**.

**Do not** turn this page into a real financial assessment just by changing the labels. A real release requires legally approved language/consent, verified login/session and RLS integration, product/rule review, privacy/DPDP lifecycle, QA with actual browsers/assistive technologies, abuse assessment, independent VAPT and documented owner approval.

## CI and GitHub evidence

**Verified PR branch evidence:** [PR #27](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/27), [Static Security CI #42665571009](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42665571009) **SUCCESS**, [Live URL CI #42665570958](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42665570958) **SUCCESS**. The CI confirms browser assets match canonical TypeScript; **6,561 parity cases PASS**; actual Passport UI synthetic DOM, EN/BN/HI, focus, no-network, missing/progress/reset tests PASS; existing VOR-006 customer Auth and isolated Postgres17 User A/B RLS tests PASS. Any post-merge real-browser outcomes must be captured separately; mock DOM tests do not prove Safari/VoiceOver/TalkBack acceptance.

## Remaining work

- Screen-reader, real keyboard-only, Android/Chrome/iOS/Safari, cross-language glyph/shaping and narrow device regression.
- Independent product/legal/fairness review of educational copy and explainability, consent status and anti-misrepresentation.
- Genuine VOR-006 authenticated/consented data storage is **not** present. Until properly authorized, never collect borrower identities, financial details or true scores here.
- Ensure VOR-009 and VOR-010 future modules use a reviewed privacy-safe data contract, without expanding customer data collection prematurely.
- VOR-007 remains PARTIAL until compliance signoff; VOR-008 remains PARTIAL until accessibility and approved real customer integration are demonstrated.
