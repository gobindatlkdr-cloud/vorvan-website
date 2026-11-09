# VORVAN — M0 / VOR-004 Database Exposure Verification
**Date:** 09 November 2026 (IST)  
**Source of scope:** VORVAN Software Development Project Handover v1, sections 2.1, 9, 12, 14 and VOR-004.  
**Environment:** Existing Supabase project `vorvan-dev-india`; **read-only metadata audit**, with no customer-row reads or schema writes.  
**Re-run:** Execute `backend/security/m0_vor004_exposure_assertions.sql` through the trusted project SQL editor. The script returns check_id, passed and evidence; investigate any `false`.

## Verified findings (SQL metadata as of this report)
- **10 / 10 assertions passed** when the identical committed SQL was executed against the live project.
- **23 / 23 public tables have RLS enabled.**
- **0 direct table privileges for `anon`** in the public schema, and **0 authenticated INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER privileges** observed.
- **11 named sensitive Admin, Company Vault, and Institutional Inquiry tables** present, RLS enabled, with **0 direct anon/authenticated grants**.
- **12 SELECT RLS policies** observed. Most scope reads to `auth.uid()` or an owned parent record. `catalog_items` uses `purchase_enabled=true` to filter authenticated reads; review it again before adding any real catalogue products.
- **No `public`-schema functions** appeared in the inventory; no publicly callable `SECURITY DEFINER` routines were identified in that schema.
- Company storage bucket `vorvan-company-private` is **non-public**, has an **8 MiB** limit and accepts **PDF/PNG/JPEG**. No direct `storage.objects` policies were found.
- **12 authenticated SELECT grants** exist on legacy customer/product tables. Their 12 RLS policies appeared scoped to ownership or the enabled catalogue predicate. They are not equivalent to unrestricted data exposure, but must be penetration-tested with actual account identities.
- Data API exposed-schema configuration was **not verifiable from the SQL configuration value** (returned null); verify separately in project settings before a customer-data launch.
- Other schemas, external integrations, identity providers, storage provider internals, key rotation and frontend third-party dependencies are **outside this specific metadata check**.

## Advisor state (not concealed)
- `auth_leaked_password_protection` — **WARN, 1 finding**: feature disabled. See Supabase Auth password-security guidance: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- `rls_enabled_no_policy` — **INFO, 22 notices**: includes deliberately deny-by-default relations. Inspect exposure and permissions; do not create `USING (true)` policies merely to dismiss the notices. See https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Controls and limitations
- This check reports current metadata only; it **does not prove** IDOR prevention, token/session invalidation, partner cross-tenant isolation, MFA login, live file-upload/download, SSL/TLS configuration, backups, release monitoring or a passed VAPT.
- Do not add broad grants to the sensitive tables. Keep MFA-gated APIs and private company storage in place.
- The archived file and this SQL do not include database credentials, sensitive rows, customer IDs, private documents or service keys.
- Before accepting VOR-004 fully: review Supabase Data API exposed schemas; document a compensating control or plan upgrade for leaked-password protection; run genuine user-role tests (AAL1 vs AAL2, owner vs operator vs auditor); verify old token revocation and resource access; prepare threat model.
- **Company remains pre-incorporation**; MCA fee paid but COI/CIN not issued. All real CIBIL/bureau, KYC, lender processing and customer payment gates remain OFF.

## Verdict
**VOR-004 metadata exposure subtask: VERIFIED COMPLETE.**
**VOR-004 overall security remediation: STILL PARTIAL** until documented risk disposition, Auth warning and E2E role tests. The 10 PASS assertions are bounded to the queries above, not a full production approval.
