# VORVAN — M2 / VOR-012 Vyn Personalized Educational Coach Sandbox

**Date:** 10 November 2026 (IST). **Scope:** independent, fixed-rule, consent-gated **synthetic-only** coach and multilingual browser demo. **Company status:** VORVAN PRIVATE LIMITED is registered, based on the owner's 10 November 2026 confirmation. This source/code audit does not independently certify or publish the COI, CIN or PAN; incorporation does not confer RBI lending permissions. No production borrower account, credit score, bureau integration, lender offer, KYC or payment.

## Reused verified foundations

1. VOR-005 `site-assistant` remains an existing **public FAQ bot**, not a generative model or personal financial adviser. This ticket does **not** rewrite it, change its Edge JWT or claim a paid AI model.
2. VOR-006 customer Auth & `consent_events` implementation remains **disabled / not deployed**. Live Supabase metadata audit confirms customer profiles **0**, legacy consent records **0**, and no `vorvan_vyn_coach_sessions` table. VOR-012 does not create a live consent record or present its checkbox as legally verifiable user consent.
3. VOR-007 `assets/readiness-engine.js` is the canonical generated browser implementation of the Personal, Business and Education **educational checklist**, with no numerical score, loan approval or eligibility. VOR-012 uses its `evaluateReadiness` and `getQuestionnaire` directly; no duplicated scoring rules.
4. VOR-008 Readiness Passport remains an independent synthetic user-experience tool. The Coach demo is standalone and **unlinked from primary public navigation** pending real legal/product release review.

## Implemented files

| File | Purpose |
| --- | --- |
| `assets/vyn-coach-engine.js` | Browser-only pure state machine. Explicit `mode:"synthetic_only"` plus exact VOR-006 `notice_version`, accepted demo Terms, accepted demo Privacy and separate Coach opt-in **all required**. No implicit consent; withdrawal clears answers. Local educational responses based on VOR-007. |
| `assets/vyn-coach-notices.js` | Generated copy of **unapproved VOR-006 draft** Terms and Privacy notices for English/Bengali/Hindi, shown to the user before opt-in. |
| `scripts/build_vyn_coach_notices.cjs` | CI-enforced, byte-exact source parity check between canonical `backend/customer-identity/notices.ts` and browser notice asset. |
| `assets/vyn-coach-ui.js` | Real browser controller: consent wall, localized notices and controls, category selection, six fixed-choice questions, progress meter, offline guidance, optional practice prompt locally cleared before evaluation, support/legal `mailto:` without forwarding any chat text, revoke/clear. Dynamic output is inserted only through `textContent`, never `innerHTML`. |
| `assets/vyn-coach-sandbox.css` | Burgundy `#741943`, mobile-responsive, keyboard focus styles, reduced motion, language-friendly system fonts. |
| `vyn-coach-sandbox.html` | Separate `noindex,nofollow` offline demo page. CSP `connect-src 'none'`, `form-action 'none'`, no remote scripts, analytics or browser storage. No real customer registration. |
| `backend/tests/vyn_coach_safety.test.ts` | Deno tests of actual Coach engine: required consent and version, revocation, category and locale, translated guidance, missing/unsure state, no score/approval, sensitive input masking/block, dangerous claims, injection resistance, human handoff, offline/no-network. |
| `backend/tests/vyn_coach_ui.test.ts` | Deno imports actual first-party browser UI in synthetic DOM; verifies consent block/grant, focused controls, generated questions/progress/clear, input cleared, support/legal mailto, all three locales and revoke. |

## Consent, safety and personalization semantics

- **Consent is strictly a local demo acknowledgement**, *not* verified customer consent or authorization. Missing checkbox, invalid notice version, malformed permission payload or revoked session all deny Coach operation.
- The in-memory user choice consists exclusively of VOR-007's allowed values: `considered`, `not_yet`, `unsure`. The returned educational suggestions come from **pre-authored VOR-007 explanatory next steps**. No model inference, credit score, financial capacity prediction, bank ranking or account profile.
- Optional practice text is limited to a small local buffer and cleared from the input before processing. `redactSensitive` detects common patterns for email, Indian PAN, 12-digit Aadhaar, Indian mobile, IFSC, credit-card-like numbers, bank-account phrases and OTP/password/PIN/credentials. If any pattern matches, the input is **redacted and blocked rather than shown or forwarded**. This is **best-effort pattern matching only**, not complete PII protection or safe intake of real sensitive text; the interface warns never to type actual data.
- The system returns a fixed safety refusal for requests about guaranteed approvals, credit scores, payments/fees and KYC, and does not follow “ignore instructions” prompts: user text is never used as a language model prompt or quoted back.
- Human handoff is **`mailto:support@vorvan.co.in` or `mailto:legal@vorvan.co.in`**, no address to internal staff, no token, no automatically generated email body, and no outgoing message from Vyn.
- Entire session is confined to in-memory JS variables. **No network, localStorage, cookies, database, analytics or persistent message history.** Reload or opt-out erases demo state. Browser CSP blocks outbound fetches.

## GitHub CI and release evidence

**Verified PR #35 CI evidence, exact branch head `b4c71cfc551a67207e9d56ed18bff1cbc3fb95ff`:** [Static Security #42744572387](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42744572387) **SUCCESS**, [Live URL Verification #42744572289](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42744572289) **SUCCESS**. New VOR-012 tests: **19/19** real Coach engine Deno tests PASS and **1/1** actual UI synthetic DOM test PASS. Deterministic VOR-006 notice-copy generator/parity check PASS, JS syntax and Deno type-check PASS. Prior VOR-002–011 security/regression tests, VOR-008 canonical VOR-007 parity **6,561 cases**, and genuine throwaway PostgreSQL 17 consent/institutional audit-RLS tests PASS. This is isolated/synthetic evidence, **not** real Supabase Auth/legal consent or human SLA validation. These checks will be re-run if the evidence file or ledger changes. [PR #35](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/35).

**Release scope:** GitHub Pages can publish the isolated `vyn-coach-sandbox.html` URL for a visibly fictional demo. There is **no new Supabase Edge Function, real Auth enrollment, company record, paid AI API, credit report or lender connection**. This is not a production personalized financial-advice service.

## 10 November 2026 — additional live browser smoke and registration-copy correction

- **Actual read-only live browser test:** [Vyn Coach smoke run](https://agent.tinyfish.ai/runs/ef9d9465-c573-4f44-b12a-cb5789f98ca1), **8/8 scoped checks PASS**. Observed page load/sandbox disclaimers, no-coach-before-opt-in, three separate draft notice/Coach checkboxes, local start, EN/BN/HI selector, 6 synthetic choices and progress, a harmless educational prompt, support/legal contact links without sending, and revoke/reset to blocked state. This does **not** constitute a real customer login, user-data handling test, screen-reader acceptance, legal consent, or delivery of a support case.
- **Detected stale registration claim during browser run:** historical VOR-012 HTML and draft VOR-006 Terms notice incorrectly stated "pre-incorporation / registration pending". The owner subsequently confirmed that **VORVAN PRIVATE LIMITED is registered**. The note must not silently overwrite legal/regulatory checks: no CIN/PAN disclosed here, and registration **does not** imply approval to lend, pull bureau reports, run payments or offer loans.
- **Focused correction:** update the Coach's English/Bengali/Hindi static disclaimers, hero/footer and canonical demo Terms notice with registered-company text; bump the **unapproved draft notice version** from `sandbox-2026-11-09-v1` to `sandbox-2026-11-10-v2`; keep generated browser notices byte-exact with `backend/customer-identity/notices.ts`. Existing v1 mock acknowledgements must fail the version gate. No live customer consent data is affected because the VOR-006 module remains disabled and no production consent records exist.
- **Additional regression:** guard the current three-language registration wording, verify old-version rejection, and verify no "registration pending" HTML text. Retain all security CORS/CSP, consent-before-use, no-network/no-financial-guidance rules and synthetic Deno tests. PR and CI/Pages references to be added after verification.

## Open acceptance items (VOR-012 overall PARTIAL)

1. Genuine Supabase-issued customer Auth session (including expiry, MFA/session revocation as appropriate) and legally approved, versioned DPDP consent from VOR-006; document storage/retention/deletion, owner RLS, privacy rights.
2. Independent policy/legal review of all EN/BN/HI content and financial-services disclaimers; red-team prompt safety, adversarial PII/DLP and fairness evaluation. Pattern redaction is **not** comprehensive.
3. Real Android/Safari screen-reader / TalkBack / VoiceOver and accessibility keyboard UX, visual audit and browser API compatibility; synthetic DOM tests are not the same as these.
4. Real human support ticket creation/escalation SLA, authenticated delivery and grievance timelines under VOR-013. `mailto:` is a navigation link, not a managed escalation lifecycle.
5. Any future generative AI or real “personalized” financial guidance requires separate model governance and vendor/legal consent controls in VOR-014, with release approval and independent VAPT.

**Acceptance principle:** Finish the code-and-synthetic-tests step, keep VOR-012 as **PARTIAL** rather than claiming full production compliance.
