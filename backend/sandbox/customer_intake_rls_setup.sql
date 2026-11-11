-- GitHub Actions disposable Postgres ONLY. Must not run on production.
-- Requires backend/sandbox/vor006_rls_setup.sql to create fake auth users/roles.
create schema if not exists private;
grant usage on schema private to service_role;
create or replace function auth.jwt() returns jsonb language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
grant execute on function auth.jwt() to authenticated;
create or replace function private.touch_updated_at() returns trigger language plpgsql
as $$ begin new.updated_at=now();return new;end $$;
