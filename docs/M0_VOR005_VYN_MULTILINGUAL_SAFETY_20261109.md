# VORVAN M0 / VOR-005 — Public Vyn Multilingual, Security & Fallback Test Evidence

**Scope:** public Vyn scripted FAQ (not a generative LLM); browser-first support widget and Supabase `site-assistant` Edge handler.  
**Date:** 09 November 2026 · **Company:** pre-incorporation, MCA fees paid, no COI/CIN.

## Code changes in VOR-005

1. **Public Edge Function:** strengthen privacy filtering for PAN-format identifiers, 4–8-digit OTP/PIN/password phrases and existing email/long-number patterns. Input is rejected with an input-independent `400 please_remove_personal_information` and is not echoed in the response. This is a **pattern-based protection**, not an exhaustive PII detector.
2. **Intent routing:** prioritize technical `API` intent over generic bank/lender partnership terms, so e.g. "Help me with a lender API" routes to `api` and `partnerships@vorvan.co.in`.
3. **Website widget:** reject similarly sensitive text **before** calling `add(msg,true)`; do not display raw sensitive input in the chat DOM, even when rejected. Show localized privacy guidance for blocked input and a backend privacy-related 400 error.
4. Keep language-first flow, static animated Vyn mascot, reduced-motion support, `textContent` insertion for dynamic text, topic-specific public emails and no production lending/bureau/KYC/payment activation.

## CI evidence (real source, synthetic inputs)

**GitHub Actions, branch commit `6b58f4a40fcbc566d39d782b8f621fd539bdc94d`:**  
- [Static security & Vyn tests — run 42649746268](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42649746268): **SUCCESS**.
- [Live website URL regression — run 42649746459](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42649746459): confirm final outcome against the same commit before merge.

**Backend:** `deno test backend/tests/site_assistant_multilingual.test.ts` — **10 passed, 0 failed**. Imports and tests the **real Edge Function request handler** without opening a network server. Covers:
- English, Bengali and Hindi topic responses and correct published contact email for partnership, API, website support, legal and credit;
- plain-language unknown question, contextual fallback and detailed partnership/API questions;
- informational credit responses, no fictitious approval, `ai_model:false`, `personal_data_saved:false`;
- rejection without reflection of synthetic email, PAN, Aadhaar, telephone, OTP, PIN and password-like input;
- invalid language/topic, unknown keys, malformed JSON, oversized request and content-type;
- CORS origin denial, GET denial, allowed OPTIONS, no-store headers, and no token leakage.

**Browser widget:** `node scripts/test_vyn_multilingual_ui.cjs` — **PASS**. Executes the actual `assets/assistant.js` in a synthetic DOM, mocking only network/DOM. Covers:
- language-first selection and EN/BN/HI language switching;
- correct API payload, message rendered as safe `textContent` (HTML markup cannot execute in tested DOM);
- sensitive PAN/OTP/password suppressed **before DOM echo and before network call**;
- Bengali/Hindi/English network-outage fallback; backend 400 privacy fallback;
- homepage Ask Vyn shortcut and no sensitive shortcut forwarding;
- help-topic button, keyboard Escape/close focus restoration, reduced-motion CSS source.

**Existing security/build tests** (VOR-002 role checks, VOR-003 Vault integration, JS syntax and Deno check) also completed successfully in the same CI.

## Unverified work — keep VOR-005 PARTIAL

- Tests are isolated/mock tests; they **do not establish** a real Chrome/Safari/mobile screen-reader or keyboard-only browser acceptance test.
- Public Supabase Edge Function must be separately deployed after source PR merge. Verify active function version, real deployed EN/BN/HI responses, API refusal of synthetic PII and cross-domain CORS in a controlled *live* smoke test before marking VOR-005 fully complete.
- Any locally displayed user text is not stored server-side by Vyn, but this does not prove network/edge/system logs never contain data. Avoid including identifiers in the first place; assess logs, retention, browser history, analytics and third-party extension risk.
- **Pattern filter is not a complete PII/sensitive-data DLP system.** Unicode variants, alternate OTP phrasing, account IDs, UPI IDs, addresses, and contextual bank/credit information may need stronger suppression or moderated workflows.
- Real load/rate-limit abuse protection, accessibility/voiceover QA, accessibility of quickAsk navigation, live outage/retry UX, threat modelling and independent penetration assessment remain pending.
- The Vyn knowledge base is rules-based, not a credit-decision AI model; independent legal/reputation content review is still pending.

## Public safety gate

VORVAN is still **pre-incorporation**; the site does not provide live credit reports, loan application/approval, KYC, payment or partner API keys. All such production features stay OFF.

## Acceptance decision

**VOR-005 synthetic code-level multilingual/safety/browser-widget QA: COMPLETE when merged and CI is green. VOR-005 overall: PARTIAL** pending real device/browser QA and live endpoint verification/abuse review.

Future regression: GitHub Actions **Static website security and integrity** runs the two new tests on every PR and `main` push.
