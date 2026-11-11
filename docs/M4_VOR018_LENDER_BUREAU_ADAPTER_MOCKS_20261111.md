# VORVAN M4 / VOR-018 — Lender & Bureau Offline Adapter Mocks

**11 November 2026** · **Status: PARTIAL overall** · Static Admin demonstration only.

## Verified scope versus excluded production functions

VORVAN PRIVATE LIMITED is registered per its owner's confirmation; incorporation is not permission to obtain TransUnion CIBIL/other bureau reports, operate lending, represent bank/NBFC partners or issue loan offers. This milestone supplies **only fixed fabricated provider contracts and local JavaScript mock responses**. Real bureau enquiries, real scores, customer identities, PAN/Aadhaar/KYC, partner tokens, lender APIs, eligibility, underwriting, loan applications, loan disbursal, financial settlement, actual consent, database writes and marketing notifications **remain disabled**.

This repository uses public static client-side source. Its displayed role checks follow an existing Admin /overview server-controlled AAL2/ACL gate, but mock roles and fixtures are NOT production identity, authorization, bureau consent, signed partner contracts or tenant security.

## Deliverables

| Artifact | Scope |
| --- | --- |
| assets/lender-bureau-mock.js | Frozen offline contract registry: **DEMO-LENDER-ALPHA** (Personal/Business/Education) and **DEMO-LENDER-BETA** (Personal/Short-term), plus separate **DEMO-BUREAU**. Two invented partners, zero provider credentials. Four fully fictional test scenarios (illustrative bands above/below 700, missing fields, provider outage). Fixed exact field/notice/identity fixture checks, per-contract category restrictions and Owner/Operator/Auditor role filtering; no real scores, offers or applications. |
| assets/lender-bureau-mock-ui.js | First-party Admin mock monitoring: partner and category selectors, simulated bureau/lender 200/422/503 responses, role-scoped request log, aggregate status counts, at most one simulated retry after 503, seven blocked go-live gates. No production integration or browser persistence. |
| admin.html; assets/admin.js; assets/admin.css | Responsive burgundy panel; loaded only after existing company server-verified AAL2/ACL Admin session. Role/session rechecked before async module mount, demo state cleared on logout/role change, unrelated actual Admin task-write UI excluded. |
| backend/tests/lender_bureau_mock.test.ts | 19 model tests: contract scope, strict allowlists, no PII, demo notice/identity fixture, invalid category, mock HTTP statuses, bounded retry, stale revision, immutable audit, role scope and zero network. |
| backend/tests/lender_bureau_mock_ui.test.ts | 4 actual module DOM tests: parent session guard, role restrictions, matching category options, 503 retry, no traffic, no real loan offer. |
| .github/workflows/static-security.yml | Added mandatory Deno tests, Node syntax and type checking without relaxing existing milestone tests or isolated PostgreSQL RLS. |
| docs/VORVAN_MILESTONE_PENDING_LEDGER.md | Update ticket VOR-018 to PARTIAL with explicit real integration blockers, preserve total 20 and next-ticket boundary. |

## Mock contract flow and fail-closed design

1. Only company Admin roles already permitted by the upstream Admin panel may mount the demonstration. Owner sees two invented lenders; Operator only the Alpha fixture; Auditor may read but cannot create/retry/reset.
2. Intake requires an exact fixed synthetic request consisting of: mode, fictional partner, scenario, category, **canonical VOR-006 unapproved privacy notice version**, explicit *fictional* demo acknowledgement and the fixed literal identity fixture. Unknown keys, customer identifiers, free-form text, PAN, Aadhaar, actual scores, passwords, tokens, API keys or real provider URLs are rejected.
3. Only contract-listed categories are accepted. Four prebuilt scenarios return invented **200**, **422**, **503** status labels, but never call a provider or create real HTTP requests. The fictional "700+" and "below 700" labels are just educational bands, not real bureau data, credit evaluation or a 700-score lending entitlement.
4. On simulated 503, the same fixed outage may be reattempted once **in memory**, producing a second fictional outage event with optimistic revision enforcement. No network, background jobs, retry storms, user prompts, bureau pulls or provider integrations.
5. Every response explicitly has zero lender offers, "not_determined" eligibility, no underwriting, no personal bureau report, no approvals/disbursals and no payment. Immutable event metadata and frozen fictional cases stay in browser page memory and disappear at logout/reset; this is not regulatory audit evidence.
6. Seven **non-overrideable production gates** cover signed direct LSP/lender agreements, bureau data rights/lawful purpose, actual consent and identity verification, server-enforced tenant IAM/RLS, server-held secrets, real data retention/audit and independent partner sandbox certification/VAPT/legal/Owner signoff.

## Out-of-scope and real acceptance gaps

No Supabase schema migration, Edge deployment, provider credential, cloud function, real data transfer, institutional registration, user-facing loan recommendation or consumer identity onboarding. A passed GitHub Pages deploy indicates delivery of public static fictional code—not evidence of live partner agreements, real Admin E2E, actual CIBIL API access or a financial service approval.

The ticket remains **PARTIAL** even after automated CI because these items remain pending: verified direct partner agreements and contacts; signed bureau contracts and authorized purpose; partner-specific API specifications/sandbox tokens stored securely server-side; real customer authentication plus lawful verified consent; tenant-scoped server enforcement and durable audit; real privacy/data-retention and dispute/revocation procedures; realistic failure/rate-limit/reconciliation E2E; independent VAPT; legal and Owner approval.

**Rollback:** revert only the VOR-018 PR and repeat existing Admin AAL2/ACL/static security CI. No database or customer data changes require recovery.

**Verification note:** Record real PR, check-run and deployment URLs only after GitHub returns a success. All tests and mock responses remain synthetic.

**Handoff:** STOP at VOR-018. Next ticket must be selected from remaining blocked M4 items; **VOR-017 Partner IAM/Portal, VOR-019 Loan Comparison and VOR-020 Go-Live review remain BLOCKED** until prerequisites and external approvals. Do not automatically begin any of them.
