-- VORVAN M0 / VOR-004: Prevent accidental Data API exposure of FUTURE objects.
-- Source: Supabase "Securing your API" and default-privileges knowledge base (2026).
-- Scope: objects CREATED by postgres after this migration. Existing tables,
-- grants, policies, data, auth, admin, staff and service-role grants stay unchanged.
-- Explicit GRANT + appropriate RLS policies are required for any future client API.
-- supabase_admin has internal defaults that postgres cannot safely override.
-- Caution: global function PUBLIC EXECUTE revoke affects FUTURE postgres-created
-- functions in all schemas; grant EXECUTE explicitly when authorized.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
