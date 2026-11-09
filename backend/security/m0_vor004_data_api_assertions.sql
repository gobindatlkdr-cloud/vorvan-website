-- M0 VOR-004 read-only security assertions.
-- Designed for the current VORVAN Supabase project.
-- A FAIL must block production customer-data onboarding, not trigger broad grants.
WITH d AS (
 SELECT o.defaclobjtype AS object_type, o.defaclnamespace AS schema_oid,
        pg_get_userbyid(o.defaclrole) AS creator, a.grantee,
        coalesce(r.rolname,'PUBLIC') AS grantee_role, a.privilege_type
 FROM pg_default_acl o
 CROSS JOIN LATERAL aclexplode(o.defaclacl) a
 LEFT JOIN pg_roles r ON r.oid=a.grantee
), t AS (
 SELECT c.relname, c.oid, c.relrowsecurity FROM pg_class c
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN('r','p')
), protected AS (
 SELECT unnest(ARRAY[
 'vorvan_company_readiness','vorvan_compliance_documents',
 'vorvan_compliance_files','vorvan_compliance_events',
 'vorvan_admin_acl','vorvan_admin_audit','vorvan_admin_tasks',
 'vorvan_admin_partner_pipeline','vorvan_admin_support_cases',
 'vorvan_institutional_inquiries','vorvan_institutional_inquiry_audit'
 ]) AS name
), checks AS (
 SELECT 'D01_current_public_tables_have_rls' AS check_id,
   (SELECT count(*)>0 AND bool_and(relrowsecurity) FROM t) AS passed,
   'All current public tables remain RLS-protected' AS scope
 UNION ALL SELECT 'D02_anon_has_no_current_table_privileges',
   NOT EXISTS (SELECT 1 FROM t WHERE has_table_privilege('anon',oid,'SELECT')
     OR has_table_privilege('anon',oid,'INSERT')
     OR has_table_privilege('anon',oid,'UPDATE')
     OR has_table_privilege('anon',oid,'DELETE')),
   'Current anon table access is denied by SQL grants'
 UNION ALL SELECT 'D03_protected_tables_have_no_client_privileges',
   NOT EXISTS (SELECT 1 FROM t JOIN protected p ON p.name=t.relname
     WHERE has_table_privilege('anon',t.oid,'SELECT')
       OR has_table_privilege('authenticated',t.oid,'SELECT')
       OR has_table_privilege('authenticated',t.oid,'INSERT')
       OR has_table_privilege('authenticated',t.oid,'UPDATE')
       OR has_table_privilege('authenticated',t.oid,'DELETE')),
   'Protected Admin, Vault and institutional tables not direct client APIs'
 UNION ALL SELECT 'D04_no_public_views',
   NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN('v','m')),
   'No public views that could bypass RLS'
 UNION ALL SELECT 'D05_no_public_privileged_functions',
   NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.prosecdef AND
      (has_function_privilege('anon',p.oid,'EXECUTE')
       OR has_function_privilege('authenticated',p.oid,'EXECUTE'))),
   'No callable SECURITY DEFINER function in public'
 UNION ALL SELECT 'D06_future_postgres_table_grants_denied',
   NOT EXISTS (SELECT 1 FROM d WHERE creator='postgres'
      AND schema_oid='public'::regnamespace AND object_type='r'
      AND grantee_role IN ('anon','authenticated')),
   'Future postgres-created public tables have no client default grants'
 UNION ALL SELECT 'D07_future_postgres_sequence_grants_denied',
   NOT EXISTS (SELECT 1 FROM d WHERE creator='postgres'
      AND schema_oid='public'::regnamespace AND object_type='S'
      AND grantee_role IN ('anon','authenticated')),
   'Future postgres-created public sequences have no client default grants'
 UNION ALL SELECT 'D08_future_postgres_function_grants_denied',
   NOT EXISTS (SELECT 1 FROM d WHERE creator='postgres'
      AND schema_oid='public'::regnamespace AND object_type='f'
      AND grantee_role IN ('anon','authenticated')),
   'Future postgres-created public functions have no explicit client defaults'
 UNION ALL SELECT 'D09_future_postgres_functions_no_global_public_execute',
   NOT EXISTS (SELECT 1 FROM d WHERE creator='postgres'
      AND schema_oid=0 AND object_type='f' AND grantee=0),
   'New postgres-created functions are not executable by PUBLIC by default'
 UNION ALL SELECT 'D10_vault_storage_remains_private',
   COALESCE((SELECT NOT public FROM storage.buckets WHERE id='vorvan-company-private'),FALSE),
   'Company Vault bucket is not public'
 UNION ALL SELECT 'D11_no_unscoped_client_rls',
   NOT EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname='public'
        AND (coalesce(qual,'')~*'user_metadata|raw_user_meta_data'
             OR coalesce(with_check,'')~*'user_metadata|raw_user_meta_data'
             OR ((roles::text)~'anon|authenticated|public'
                AND (coalesce(qual,'') IN ('true','(true)')
                     OR coalesce(with_check,'') IN ('true','(true)'))))),
   'No user_metadata-based or universally open existing RLS rules'
)
SELECT check_id,coalesce(passed,false) AS passed,scope FROM checks ORDER BY check_id;
