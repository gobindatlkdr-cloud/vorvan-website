# VORVAN — M0 VOR-004 Supabase Auth, Data API & Threat Review

**Audit date:** 09 Nov 2026 · **Supabase:** `vorvan-dev-india`, India, PostgreSQL 17 · **Status:** pre-incorporation (MCA fee paid; COI/CIN pending) · **No real borrower data used**.

## Evidence and scope

This review uses read-only database catalog queries, Supabase Security Advisors, project metadata, an inspection of the deployed Edge Function metadata/source entry points and official Supabase security documentation. It **does not** read user passwords, JWT contents, customer rows, OAuth secrets, credit reports or production company documents.

### Actual observed configuration

| Area | Live audit finding |
| --- | --- |
| Subscription | Organization is on Supabase **Free** plan |
| Auth advisor | `auth_leaked_password_protection`: **WARN, 1 finding**; feature disabled and requires **Pro Plan or above** for activation |
| RLS advisor | `rls_enabled_no_policy`: **INFO, 22 notices**. These may represent intentionally deny-by-default tables; do **not** create permissive policies to silence notices |
| Public tables | **23 total, 23 RLS enabled** |
| Current direct grants | **0** current `anon` table privileges; authenticated has **12 SELECT grants**, with RLS policies scoped to owned records or an enabled catalog item |
| Sensitive Admin/Vault/Institutional tables | **11 named sensitive tables**; no direct `anon`/`authenticated` grant |
| Public views / functions | **0 views, 0 public functions**; no public privileged definer function callable by API roles |
| Storage | `vorvan-company-private` bucket private; no direct storage object policies observed |
| Public default privileges | **Postgres-created future tables, sequences, functions have broad `anon` and `authenticated` defaults** before this release; another set of similar defaults is owned by `supabase_admin` |
| PGRST exposed schema setting | `current_setting('pgrst.db_schemas', true)` returned **null**. This does **NOT** confirm which schemas the dashboard's Data API exposes |
| Edge Functions | 7 active functions: `api`, `site-assistant`, `institutional-inquiries` have `verify_jwt=false`; `ai-guidance`, `admin-console`, `admin-mfa-recovery`, `compliance-vault` have `verify_jwt=true` |

**Important:** A public Edge Function with `verify_jwt=false` is not automatically an exposed customer-data leak, but its own route-level checks and rate limiting must be reviewed. Existing `api` function source was retrieved from the deployed project, and is **not fully reproduced in the current GitHub repository**, so reproducible deployment remains a VOR-001 gap.

## Threat model and disposition

| Threat ID | Actor / scenario | Mitigation in this step | Residual gap |
| --- | --- | --- | --- |
| T01 | A future developer creates a new `public` table; default grants expose it through Data API before RLS review | Source-controlled `postgres` default grant revoke migration, with post-change SQL assertions | New `supabase_admin`-created objects still inherit internal defaults; avoid extensions in public and review provider configuration |
| T02 | New SQL function becomes callable by `PUBLIC` through default EXECUTE | Revoke future default EXECUTE for `postgres`; explicitly grant only required function execution | Affects future functions in all schemas; developers must review and grant required calls, and Supabase-owned defaults remain |
| T03 | Credential stuffing via previously leaked passwords | Existing owner MFA, no password/key disclosure in source | Supabase Auth **leaked-password protection disabled** on Free; choose paid Pro plan + enable and verify, or formally accept risk while limiting scope to test/admin |
| T04 | Cross-tenant or cross-account IDOR through Data API | Existing RLS + explicit current grants; read-only assertion suite verifies no broad policy and no `user_metadata` authorization | Live Owner/Operator/Auditor and customer-role E2E not performed; actual Data API exposed schema configuration must be checked in Dashboard |
| T05 | Access JWT survives session termination; account lockout not instantaneous | Admin/Vault services require live Auth check, server ACL and AAL2 claim | Actual JWT `session_id` claim lookup against `auth.sessions`, revocation verification and expiry testing are not complete |
| T06 | Unrestricted public function/Edge API abused for spam/data extraction | Public function paths are reviewable; no public SQL `SECURITY DEFINER` functions found | `api` deployment source recovery, endpoint rate limits/origin & abuse controls and independent VAPT outstanding |
| T07 | Service role/secret accidentally bundled into static GitHub Pages | Additional CI test scans public entrypoints; service-role remains server-only by design | Full-repo historical secret scan, key rotation, SAST and dependency vulnerability review not complete |
| T08 | Private company storage read directly via authenticated API role | Private bucket, no direct `storage.objects` policies, protected `compliance-vault` Edge handler | Real owner AAL2 file E2E and atomic upload/audit recovery still pending |
| T09 | Database cannot be restored after accidental data loss | M0 baseline tag, source rollback runbook, read-only integrity assertions | Full backup-restore rehearsal and documented recovery objectives still pending |
| T10 | Unapproved company or financial service goes live | Incorporation and loan/CIBIL/KYC/payment feature gates stay disabled | Legal incorporation, signed lender agreements and independent go-live approvals required |

### Remediation proposed by this PR

`backend/migrations/m0_vor004_postgres_default_api_grants.sql` removes default automatic **`anon` and `authenticated` grants for FUTURE objects created by `postgres`** in `public`, and revokes `PUBLIC` EXECUTE for future `postgres`-owned functions across schemas. This does **not** mutate current table privileges or customer data. The `service_role` defaults are deliberately retained for existing server-side backend compatibility; server-only keys must remain private. Any future intentional Data API endpoint will need explicit grants, RLS and tests.

**Supabase internal exception:** `supabase_admin` owns its own system default privileges; `postgres` cannot safely alter those. Avoid creating extensions in `public`. See [Supabase's knowledge base](https://supabase.com/kb/troubleshooting/cant-change-the-default-privileges-of-supabase_admin-in-the-public-schema-448af9).

### Reproducible live query and release safety

- Pre-change check `backend/security/m0_vor004_data_api_assertions.sql` had **D06/D07/D08 FAIL**, which is expected before applying the migration. Existing-current-table checks passed.
- Post-change, execute that exact read-only assertion suite and require **11/11 PASS**; compare current table grants and RLS with the baseline.
- **This document is staged before deployment. Actual migration and post-change result must be recorded here after applying the reviewed change.**
- No auth user, MFA settings, PostgREST schema config, payment, bureau, lender or company incorporation status is changed by the migration.
- Important: `ALTER DEFAULT PRIVILEGES` is forward-looking only. Existing ACLs remain unchanged; do not auto-grant broad access to restore old defaults.

## Remaining owner / plan-dependent decisions

1. **Leaked-password protection:** Free plan cannot enable the Pro-only Auth feature. Owner may separately opt into a paid plan and verify the warning clears, or formally accept a limited-scope preproduction risk. No subscription upgrade was initiated.
2. **Data API exposed schemas:** Read actual `https://supabase.com/dashboard/project/kukfpsqujlutlgwndplh/integrations/data_api/settings` from an approved owner account. SQL PGRST setting returned null, so **cannot claim verified**. Reduce exposed schemas and turn off automatic new-table exposure if enabled.
3. **Owner/Operator/Auditor real E2E:** Distinct, approved identities with genuine Supabase-issued AAL2 tokens and session expiration/refresh/revocation tests; no OTP/password in ChatGPT.
4. **Threat model outstanding:** key management, high-value logging/data retention, network abuse/rate limits, VAPT and fully reviewed `api` Edge Function source deployment.
5. **RLS info warnings:** Inspect the 22 deny-by-default entries; do not create broad `USING(true)` policies to silence informational notices.

### References

- [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase — Password security and leaked password protection](https://supabase.com/docs/guides/auth/password-security)
- [Supabase — `supabase_admin` default privileges](https://supabase.com/kb/troubleshooting/cant-change-the-default-privileges-of-supabase_admin-in-the-public-schema-448af9)
- [Supabase — Security Advisor](https://supabase.com/docs/guides/database/database-linter)
