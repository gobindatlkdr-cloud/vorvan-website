# VORVAN M3 / VOR-015 — Subscription & Payment Sandbox

**Prepared:** 11 November 2026. **Milestone:** M3 VOR-015. **Delivery scope:** Admin-only synthetic training UI and first-party browser code. **Ticket status:** PARTIAL overall; simulated source implementation only.

## Business and financial disclaimers

VORVAN PRIVATE LIMITED is registered per the owner's confirmation. Company registration alone does NOT grant payment-provider, regulated-lending or credit-bureau authorization. **No real subscription, charge, capture, gateway integration, card, UPI ID, payment link, merchant checkout, auto-renewal, refund disbursement, receipt, KYC, live account or financial processing is enabled.** This milestone neither checks CIBIL nor calculates customer eligibility.

All figures below are **fictional training fixtures, not approved prices or offers**:

| Synthetic plan | Demonstration duration | Fictional INR paise |
| --- | --- | --- |
| guide_3m | 3 months | 39900 paise (₹399.00, not an offer) |
| guide_6m | 6 months | 69900 paise (₹699.00, not an offer) |

Use the Owner-confirmed 3/6-month educational guide concept only as a fixture. Real retail price, taxes, fee description, refund policy, cancellation rules, legal terms, provider choice and user consent are **not yet approved**.

## What has been implemented

| Code / evidence | Details |
| --- | --- |
| assets/subscription-payment-sandbox.js | Deterministic memory-only engine: fixed frozen catalogue, 2 fictional identities (fixture_slate, fixture_amber), maximum 12 fake orders, order status lifecycle, idempotent duplicate fictional webhook handling, collision rejection, Owner-only two-step refund and cancellation simulation, aggregate minor-unit reporting and in-session immutable event history. |
| assets/subscription-payment-ui.js | First-party responsive Admin panel with fixed-choice plan/fixture selector; demonstration success/failure webhook buttons and duplicate-replay button; mock subscription status, fake refund review/approve/reject, cancellation, fictional revenue/refunds, audit and locked release requirements. |
| admin.html, assets/admin.js, assets/admin.css | Burgundy Admin navigation; mounts only within existing server-authorized /overview + AAL2 MFA Admin dashboard and approved Owner/Operator/Auditor role. Async role/session rechecked before mount. Clears demo state at logout/role change; hides real task-write worklist for synthetic payment area. |
| backend/tests/subscription_payment_sandbox.test.ts | 27 real model unit tests of schemas, minor units, role gates, fake event idempotency/conflict/stale revision, refund workflow and reconciliation, fixed releases, frozen audit and no network. |
| backend/tests/subscription_payment_ui.test.ts | 5 actual module synthetic DOM and static-source regression tests: auth mount, Owner fake workflow, role controls, failure path, no real checkout endpoints. |
| .github/workflows/static-security.yml | Added mandatory engine tests, actual UI DOM tests, Node syntax and Deno type checks while retaining existing VOR-001–016 regression and isolated PostgreSQL RLS CI. |
| docs/VORVAN_MILESTONE_PENDING_LEDGER.md | Moves M3 VOR-015 from PENDING to PARTIAL. Production controls remain outstanding. |

### Financial safety mechanics

1. **Fixed input only:** create order accepts only mode, fictional subject fixture, and plan ID. No user identifiers, PAN, account numbers, cards, UPI details, documents, tax information, passwords, or payment credentials are accepted.
2. **Demo webhook is not a receiver:** a browser button constructs a fictional event ID and calls a local JavaScript function. Input requires exact synthetic mode, fixed-demo source, fake event ID, order ID, event type and expected revision. No HMAC signature, provider callback, server endpoint or live webhook is implemented.
3. **Idempotency:** an identical synthetic event ID + order/outcome returns duplicate=true/applied=false and creates no second payment event—even if the revision changed. Reusing an event ID for a different order/outcome is rejected. Any new event after a terminal transaction is blocked.
4. **Status transitions:** awaiting_demo_event → payment_simulated or payment_declined; payment_simulated → refund_review → refund_simulated or refund_rejected. An eligible successful fake payment may be marked cancelled_demo by Owner; cancellation never implies a monetary refund. Status is not actual service activation.
5. **Owner approval:** only Owner may request or approve/reject simulated refunds and cancel a fake subscription; Operator may create and handle assigned fake payment events; Auditor is read-only. Operator can use only fixture_slate; Owner can use either fictional fixture. This is **browser role simulation, not a production server-ledger authorization**.
6. **No automatic billing:** auto_renewal_enabled is permanently false and no scheduled jobs, payment credentials, payment gateways or card-on-file storage are added.
7. **Minor-unit arithmetic:** fake INR money is stored as integer paise, never floating-point rupee cents. Fictional metrics reconcile simulated paid, refunded and net paise across 3m/6m fixtures.
8. **Audit:** frozen event metadata stays in page memory and disappears at logout/reset. It is not tamper-proof, durable, financial, PCI or compliance audit evidence.

### Production release gates: all BLOCKED

- Valid merchant/company KYC and payment-provider account onboarding.
- Executed provider contract and approved use case (including regulatory/lender constraints where applicable).
- Signed-off subscription pricing/tax/T&C, cancellation/refund/auto-renewal rules and compliant consumer disclosures.
- Actual user authentication and securely versioned consent.
- Server-side authenticated/verified webhook signatures, nonce/replay retention, idempotent transactions, server audit and reconciled durable financial ledger.
- Verified refund execution and disputes/chargebacks handling.
- Independent security review, privacy/legal assessment, operating procedures and explicit company Owner approval.

**No production gateway API keys, webhook secrets, payment-account credentials, real data or new Supabase/Edge migrations are introduced.** All actual payment functionality must remain disabled.

## Verification and rollback

**Verified implementation:** [PR #45](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/45) merged into main at `15578724e0775ad5ed9ea0b4f02af93ceb70bca2` from verified source SHA `078d40d797d493d4a5b8fefa04395e1d25f3f486`. [PR Static Security #43063313501](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43063313501) SUCCESS: **27/27 engine tests, 5/5 actual Admin UI DOM tests**, Node/Deno checks, all prior milestone regression and isolated PostgreSQL17 consent/inquiry RLS SUCCESS; [PR Live URL #43063313958](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43063313958) SUCCESS. **Verified main commit post-merge**: [Static Security #43063537162](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43063537162) SUCCESS, [Live Website #43063537094](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43063537094) SUCCESS, [GitHub Pages #43063537281](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43063537281) SUCCESS. This proves static training assets deployment, **not a live billing feature, true merchant approval, PCI compliance or actual Owner/Operator MFA browser UAT**.

Outstanding acceptance: approved payment-provider sandbox, real merchant KYC, legal price/subscription/refund terms, server-side payment architecture, webhook signature verification, distributed idempotency persistence, durable ledger/reconciliation, independent VAPT, real multi-role AAL2 browser UAT, approved pricing, localization/accessibility and owner/legal signoff.

**Rollback:** revert only VOR-015 PR on main; no customer funds/data to recover and no database migrations to roll back. Leave already-merged VOR-013, VOR-014 and VOR-016 intact.

**Single-step handoff:** STOP after VOR-015. Next queued work item: M4 VOR-018 Lender/Bureau Mock APIs (PENDING), without real bureau access or loan origination. VOR-017 Partner IAM/Portal remains BLOCKED pending authenticated partner contracts/approvals.
