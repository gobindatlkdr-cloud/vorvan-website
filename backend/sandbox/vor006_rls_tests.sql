-- Run ONLY in a temporary Postgres service after setup and VOR-006 schema.
DO $$
DECLARE table_name text := 'public.vorvan_customer_consent_events';
BEGIN
 IF NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid=table_name::regclass) THEN
   RAISE EXCEPTION 'RLS/FORCE RLS not enabled';
 END IF;
 IF has_table_privilege('anon',table_name,'SELECT') OR has_table_privilege('anon',table_name,'INSERT') THEN
   RAISE EXCEPTION 'Anonymous permissions unexpectedly granted';
 END IF;
 IF NOT has_table_privilege('authenticated',table_name,'SELECT') OR
   has_table_privilege('authenticated',table_name,'INSERT') OR
   has_table_privilege('authenticated',table_name,'UPDATE') OR
   has_table_privilege('authenticated',table_name,'DELETE') THEN
   RAISE EXCEPTION 'Authenticated customer permissions unsafe';
 END IF;
 IF NOT has_table_privilege('service_role',table_name,'SELECT') OR
   NOT has_table_privilege('service_role',table_name,'INSERT') OR
   has_table_privilege('service_role',table_name,'UPDATE') OR
   has_table_privilege('service_role',table_name,'DELETE') THEN
   RAISE EXCEPTION 'Service is not append-only';
 END IF;
 IF (SELECT count(*) FROM pg_policies
     WHERE schemaname='public' AND tablename='vorvan_customer_consent_events'
     AND cmd='SELECT' AND 'authenticated'=ANY(roles)
     AND qual LIKE '%auth.uid()%') <> 1 THEN
   RAISE EXCEPTION 'Expected exactly one owner-filter SELECT policy';
 END IF;
END $$;
-- Fake consent events; these identities cannot exist outside this temporary DB.
INSERT INTO public.vorvan_customer_consent_events
(user_id,request_id,purpose,event_type,notice_version,notice_sha256,locale)
VALUES
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','terms_acknowledgement','acknowledged','sandbox-2026-11-09-v1',repeat('a',64),'en'),
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000012','optional_updates','granted','sandbox-2026-11-09-v1',repeat('b',64),'bn'),
('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000021','optional_updates','withdrawn','sandbox-2026-11-09-v1',repeat('c',64),'hi');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_customer_consent_events) <> 2 THEN
  RAISE EXCEPTION 'User A should see only own two events';
 END IF;
 IF (SELECT count(*) FROM public.vorvan_customer_consent_events
     WHERE user_id='00000000-0000-4000-8000-000000000002') <> 0 THEN
  RAISE EXCEPTION 'User A can read User B records';
 END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_customer_consent_events) <> 1 THEN
  RAISE EXCEPTION 'User B should see only own one event';
 END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','',false);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_customer_consent_events) <> 0 THEN
  RAISE EXCEPTION 'Authenticated role without subject must see nothing';
 END IF;
END $$;
RESET ROLE;

-- Confirm uniqueness and valid event-types are database-enforced.
DO $$
BEGIN
 BEGIN
  INSERT INTO public.vorvan_customer_consent_events
   (user_id,request_id,purpose,event_type,notice_version,notice_sha256,locale)
   VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011',
   'terms_acknowledgement','acknowledged','sandbox-2026-11-09-v1',repeat('d',64),'en');
  RAISE EXCEPTION 'Duplicate request id was accepted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.vorvan_customer_consent_events
   (user_id,request_id,purpose,event_type,notice_version,notice_sha256,locale)
   VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099',
   'terms_acknowledgement','granted','sandbox-2026-11-09-v1',repeat('d',64),'en');
  RAISE EXCEPTION 'Invalid purpose/action was accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT 'PASS VOR-006: Postgres RLS isolates User A/B, anonymous denied, service append-only, SQL uniqueness and action constraints enforced' AS result;
