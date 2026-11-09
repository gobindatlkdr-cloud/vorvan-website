# VORVAN M1 / VOR-006 — Customer Identity, Secure Login & Versioned Consent (Sandbox)

**Date:** 09 November 2026 · **Source:** VORVAN Developer Handover v1, ticket VOR-006.
**Environment:** GitHub source + isolated fake Auth/PostgREST + throwaway PostgreSQL 17 CI. **Not deployed or switched on in live Supabase.**  
**Company:** Proposed VORVAN PRIVATE LIMITED; COI/CIN pending; MCA fees paid. No customer onboarding, financial transactions or real consent is approved.

## Verified existing architecture

A read-only audit of the live Supabase project `vorvan-dev-india` found:

- Existing `auth.users` integration, `public.profiles` (fields `id, display_name, locale, account_state`) and `public.consent_events` (fields `user_id, purpose, version, scope, granted_at, revoked_at`).
- `profiles` and `consent_events` already have authenticated, user-owned **SELECT** RLS policies; **no customer INSERT/UPDATE grant** is active.
- Customer profile records: **0**; existing consent rows: **0**; Auth users total: **1** (existing company account, not a customer).
- Existing profile/legacy consent schema is **not** modified and no new live user is created.
- Production Data API exposed-schema settings and Supabase Free leaked-password protection remain separate M0 VOR-004 pending items.

## New source-only sandbox modules

| File | Purpose |
| --- | --- |
| `backend/customer-identity/index.ts` | New Supabase Edge Function handler, fail-closed unless `VORVAN_CUSTOMER_SANDBOX_ENABLED=true`. Requires `verify_jwt=true` **if ever deployed**, verifies bearer again via Auth `/auth/v1/user`, JWT subject/expiry/role, confirmed nonanonymous identity, and **existing active profile**. Never accepts user identity from body or URL. |
| `backend/customer-identity/notices.ts` | Server-pinned, **unapproved** EN/BN/HI sandbox notice content for terms acknowledgement, privacy acknowledgement and an **independent optional-updates opt-in/withdrawal**. Server computes SHA-256 of localized notice copy. |
| `backend/sandbox/vor006_customer_consent_schema.sql` | **Non-production SQL only.** Separate `vorvan_customer_consent_events` append-only consent table with purpose/action and version/digest constraints, unique per-user request UUID, server-authored timestamp, forced RLS, owner-only SELECT and no customer write privileges; service role SELECT+INSERT only. |
| `backend/tests/customer_identity_consent.test.ts` | Imports actual Edge handler with synthetic JWT and mocked Auth/PostgREST. |
| `backend/tests/customer_identity_disabled.test.ts` | Checks default disabled state returns HTTP 503 before any customer enrollment. |
| `backend/sandbox/vor006_rls_setup.sql` and `vor006_rls_tests.sql` | Real PostgreSQL tests in **ephemeral CI service** proving User A/B isolation, anonymous denial, no client mutation, service append-only privileges, uniqueness and invalid action constraint. |

## Endpoint contract (NOT LIVE)

All endpoints are beneath `/functions/v1/customer-identity/v1/customer`. Every route requires valid Supabase Auth credentials and an active pre-existing customer profile **even in a gated sandbox**.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/session` | Confirm verified customer identity and locale; explicitly report financial services and real enrollment disabled |
| GET | `/notices?locale=bn` | Return pinned draft sandbox notices with version, digest, and `unapproved_sandbox` status |
| GET | `/consents` | List up to 100 own, chronological immutable consent events; client cannot choose `user_id` |
| POST | `/consents` | Explicit affirmative choice plus purpose, decision, locale, pinned version, idempotency UUID; user ID and digest derived on the server, stored append-only |
| Any | `/signup`, `/kyc`, `/loan`, `/cibil`, `/payment` | No implementation; must remain blocked |

Consent distinctions: terms/privacy require `acknowledged`, optional updates use `granted` or `withdrawn`. These are **synthetic acknowledgements and preferences, not legally valid production consent**. Optional updates opt-in does not send marketing messages. For each request, the server derives `user_id` from verified Auth identity. It rejects a supplied `user_id`, invalid purpose, stale version, unconfirmed identity, repeated request ID with different content, and oversized/non-JSON input.

An **identical idempotent replay** returns the first stored receipt; an incompatible duplicate returns HTTP 409 without changing any existing event.

## Security safeguards

- Authorization is server-side: signature checked by Supabase Edge **platform `verify_jwt=true` on future deployment** and actual user retrieved through Auth `/auth/v1/user`; the sandbox tests mock Auth responses, **not cryptographic signature verification**.
- JWT `sub`, `role`, `exp` matched against Auth user. `raw_user_meta_data` is never treated as an authorization source. Anonymous and unconfirmed users denied.
- Existing `profiles.account_state` must be `active`, and a profile must have been explicitly provisioned; no public signup and no auto-provisioning.
- DB grants deny `anon` SELECT and any client INSERT/UPDATE/DELETE. `authenticated` may SELECT **only own** rows via `(select auth.uid()) = user_id`; Edge server can INSERT only and cannot UPDATE or DELETE. A distinct mandatory unique `(user_id,request_id)` prevents duplicate events.
- Server sets notice version, SHA-256 digest and logged user ID; no raw identity/KYC/financial information stored.
- Guarded CORS, method allowlist, body-size cap (2 KiB), `no-store` response and error codes without echoing sensitive request text.
- `VORVAN_CUSTOMER_SANDBOX_ENABLED` is false by default, and this new Edge Function is **NOT DEPLOYED** to the public Supabase project.

## CI proof and remaining acceptance

**Required GitHub CI:** existing Static Security and Live URL checks plus new VOR-006 Deno Edge handler tests and `consent-rls-isolated-postgres` job. Run status/PR references must be appended after checks complete.

**Remaining / not demonstrated:**
1. Actual customer sign-up/sign-in UI, verified email workflow, real Supabase-issued user JWT and revocation/refresh on owner-approved sandbox account.
2. Legal review and localization of **real** Terms, Privacy Notice and DPDP Act consent, lawful basis, retention policy, separate optional consents, guardian/minor handling, and data-subject rights. The present notices are intentionally **unapproved test text**.
3. Production-consent data lifecycle: encryption/key management, backup/restore, retention/deletion, export (VOR-016), event pagination/state derivation when beyond 100 rows, abuse/rate limiting, independent VAPT.
4. Control of any later database activation: review exposed schemas/Data API and row-policy grants, verify service_role privacy, monitor logs, require approved feature flags and explicit owner signoff.
5. Only a future approved app may offer real borrower onboarding; all live loan, bureau/CIBIL, KYC, partner integration, payment and subscription features remain off.

**Acceptance status:** sandbox source and tests complete **after passing CI**; VOR-006 overall remains **PARTIAL** until the above real-user, compliance and go-live requirements are satisfied.
