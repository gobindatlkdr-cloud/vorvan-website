-- VORVAN M0 / VOR-004: READ-ONLY security boundary audit.
-- Run with a suitably privileged SQL editor in the existing Supabase project.
-- This checks metadata only; no customer rows or secret values are accessed.
-- PASS does NOT replace user-role E2E, Data API configuration review or VAPT.
WITH tables AS (
 SELECT c.relname,c.relrowsecurity
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN('r','p')
), grants AS (
 SELECT table_name,grantee,privilege_type
 FROM information_schema.role_table_grants
 WHERE table_schema='public' AND grantee IN ('anon','authenticated','PUBLIC')
), protected AS (
 SELECT unnest(ARRAY[
 'vorvan_company_readiness','vorvan_compliance_documents',
 'vorvan_compliance_files','vorvan_compliance_events',
 'vorvan_admin_acl','vorvan_admin_audit','vorvan_admin_tasks',
 'vorvan_admin_partner_pipeline','vorvan_admin_support_cases',
 'vorvan_institutional_inquiries','vorvan_institutional_inquiry_audit'
 ]) AS name
), funcs AS (
 SELECT p.oid,p.prosecdef
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
), assertions AS (
 SELECT 'P01_public_tables_rls_enabled' AS check_id,
   NOT EXISTS (SELECT 1 FROM tables WHERE NOT relrowsecurity) AS passed,
   (SELECT count(*)::text || ' public tables reviewed' FROM tables) AS evidence
 UNION ALL SELECT 'P02_no_anon_table_grants',
   NOT EXISTS (SELECT 1 FROM grants WHERE grantee='anon'),
   'No direct anon privileges on public tables'
 UNION ALL SELECT 'P03_no_authenticated_write_grants',
   NOT EXISTS (SELECT 1 FROM grants WHERE grantee='authenticated' AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')),
   'Authenticated write access blocked by SQL GRANT'
 UNION ALL SELECT 'P04_sensitive_tables_present',
   NOT EXISTS (SELECT 1 FROM protected p LEFT JOIN tables t ON t.relname=p.name WHERE t.relname IS NULL),
   '11 sensitive tables expected'
 UNION ALL SELECT 'P05_sensitive_tables_rls_enabled',
   NOT EXISTS (SELECT 1 FROM protected p JOIN tables t ON t.relname=p.name WHERE NOT t.relrowsecurity),
   'Sensitive admin, vault and institution tables require RLS'
 UNION ALL SELECT 'P06_sensitive_tables_no_basic_grants',
   NOT EXISTS (SELECT 1 FROM protected p JOIN grants g ON g.table_name=p.name),
   'No anon/authenticated direct privileges on sensitive tables'
 UNION ALL SELECT 'P07_no_public_security_definers',
   NOT EXISTS (SELECT 1 FROM funcs WHERE prosecdef AND (has_function_privilege('anon',oid,'EXECUTE') OR has_function_privilege('authenticated',oid,'EXECUTE'))),
   'Public schema must not expose privileged definer routines'
 UNION ALL SELECT 'P08_company_bucket_private',
   COALESCE((SELECT NOT public FROM storage.buckets WHERE id='vorvan-company-private'),false),
   'Company vault bucket is private'
 UNION ALL SELECT 'P09_company_bucket_8m_limit',
   COALESCE((SELECT file_size_limit=8388608 FROM storage.buckets WHERE id='vorvan-company-private'),false),
   '8 MiB upload limit'
 UNION ALL SELECT 'P10_no_direct_storage_object_policies',
   NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'),
   'Files reachable only through protected service interface'
)
SELECT check_id,passed,evidence FROM assertions ORDER BY check_id;
