-- Run VOR-011 only in CI's isolated PostgreSQL service.
-- This verifies actual trigger rollback guarantees, not an in-memory approximation.
DO $$
BEGIN
 IF NOT (SELECT bool_and(relrowsecurity) FROM pg_class WHERE oid IN
  ('public.vorvan_institutional_inquiries'::regclass,
   'public.vorvan_institutional_inquiry_audit'::regclass)) THEN
  RAISE EXCEPTION 'RLS not enabled';
 END IF;
 IF has_table_privilege('anon','public.vorvan_institutional_inquiries','SELECT')
   OR has_table_privilege('authenticated','public.vorvan_institutional_inquiries','SELECT')
   OR has_table_privilege('anon','public.vorvan_institutional_inquiry_audit','SELECT') THEN
  RAISE EXCEPTION 'Direct public or client access remains';
 END IF;
 IF has_function_privilege('anon','public.vor011_inquiry_audit_trigger()','EXECUTE')
   OR has_function_privilege('authenticated','public.vor011_inquiry_audit_trigger()','EXECUTE')
   OR NOT has_function_privilege('service_role','public.vor011_inquiry_audit_trigger()','EXECUTE') THEN
  RAISE EXCEPTION 'Wrong trigger function EXECUTE grants';
 END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.vorvan_institutional_inquiries'::regclass
     AND tgname IN ('vor011_inquiry_after_insert_audit','vor011_inquiry_after_review_audit'))<>2 THEN
  RAISE EXCEPTION 'Expected two after-write audit triggers';
 END IF;
END $$;
SET ROLE service_role;
INSERT INTO public.vorvan_institutional_inquiries
 (id,institution_type,institution_name,institution_website,contact_name,designation,official_email,
  partnership_track,agenda,source_channel,rate_digest,submission_id,request_fingerprint)
VALUES ('40000000-0000-4000-8000-000000000001','nbfc','Fictional Bank/NBFC',
'https://synthetic.invalid','Synthetic Staff','Partnership Specialist','synthetic@example-bank.invalid',
'direct_api','Synthetic non-binding API partnership inquiry for CI testing only.','direct',repeat('a',64),
'50000000-0000-4000-8000-000000000001',repeat('b',64));
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiry_audit
  WHERE inquiry_id='40000000-0000-4000-8000-000000000001' AND action='created')<>1 THEN
  RAISE EXCEPTION 'Create must synchronously create a single audit event';
 END IF;
END $$;
UPDATE public.vorvan_institutional_inquiries
 SET status='reviewing',reviewer_id='10000000-0000-4000-8000-000000000002'
 WHERE id='40000000-0000-4000-8000-000000000001';
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiry_audit
  WHERE action='status_updated' AND actor_user_id='10000000-0000-4000-8000-000000000002')<>1 THEN
  RAISE EXCEPTION 'Status change audit missing or actor incorrect';
 END IF;
END $$;
UPDATE public.vorvan_institutional_inquiries SET review_note='Only synthetic follow-up'
 WHERE id='40000000-0000-4000-8000-000000000001';
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiry_audit WHERE action='note_updated')<>1 THEN
  RAISE EXCEPTION 'Note-change audit missing';
 END IF;
END $$;
UPDATE public.vorvan_institutional_inquiries SET status='reviewing'
 WHERE id='40000000-0000-4000-8000-000000000001';
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiry_audit)<>3 THEN
  RAISE EXCEPTION 'No-op status must not add audit event';
 END IF;
 BEGIN
  INSERT INTO public.vorvan_institutional_inquiries
   (id,institution_type,institution_name,institution_website,contact_name,designation,official_email,
    partnership_track,agenda,source_channel,rate_digest,submission_id,request_fingerprint)
  VALUES ('40000000-0000-4000-8000-000000000002','nbfc','Fictional duplicate',
   'https://synthetic.invalid','Synthetic Staff','Partnership Specialist','synthetic@example-bank.invalid',
   'direct_api','A made-up duplicate submission that must be rejected by database unique index.','direct',
   repeat('a',64),'50000000-0000-4000-8000-000000000001',repeat('b',64));
  RAISE EXCEPTION 'Duplicate submission UUID was accepted';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiries)<>1 THEN
  RAISE EXCEPTION 'Duplicate created a row';
 END IF;
END $$;
RESET ROLE;
-- Force an audit failure; UPDATE must not commit, even if the API caller retries.
ALTER TABLE public.vorvan_institutional_inquiry_audit
 ADD CONSTRAINT synthetic_audit_fail CHECK (action <> 'status_updated') NOT VALID;
SET ROLE service_role;
DO $$
BEGIN
 BEGIN
  UPDATE public.vorvan_institutional_inquiries SET status='verified'
   WHERE id='40000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'Audit failure did not abort status update';
 EXCEPTION WHEN check_violation THEN NULL; END;
 IF (SELECT status FROM public.vorvan_institutional_inquiries
     WHERE id='40000000-0000-4000-8000-000000000001')<>'reviewing' THEN
  RAISE EXCEPTION 'Failed audit left mutated review status';
 END IF;
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiry_audit)<>3 THEN
  RAISE EXCEPTION 'Audit failure left extra audit rows';
 END IF;
END $$;
RESET ROLE;
ALTER TABLE public.vorvan_institutional_inquiry_audit DROP CONSTRAINT synthetic_audit_fail;
-- Also force INSERT audit failure; the entire new intake must roll back.
ALTER TABLE public.vorvan_institutional_inquiry_audit
 ADD CONSTRAINT synthetic_insert_fail CHECK (action <> 'created') NOT VALID;
SET ROLE service_role;
DO $$
BEGIN
 BEGIN
  INSERT INTO public.vorvan_institutional_inquiries
   (id,institution_type,institution_name,institution_website,contact_name,designation,official_email,
    partnership_track,agenda,source_channel,rate_digest,submission_id,request_fingerprint)
  VALUES ('40000000-0000-4000-8000-000000000003','bank','Fictional Failure',
  'https://synthetic.invalid','Synthetic Tester','Test Lead','test@example-bank.invalid',
  'direct_lsp','Synthetic audit failure must prevent any intake from being recorded.','direct',repeat('c',64),
  '50000000-0000-4000-8000-000000000003',repeat('d',64));
  RAISE EXCEPTION 'Audit failure did not abort inquiry INSERT';
 EXCEPTION WHEN check_violation THEN NULL; END;
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiries)<>1 THEN
  RAISE EXCEPTION 'Failed audit allowed an inquiry INSERT';
 END IF;
END $$;
RESET ROLE;
ALTER TABLE public.vorvan_institutional_inquiry_audit DROP CONSTRAINT synthetic_insert_fail;
SET ROLE service_role;
UPDATE public.vorvan_institutional_inquiries SET status='verified'
 WHERE id='40000000-0000-4000-8000-000000000001';
DO $$
BEGIN
 IF (SELECT count(*) FROM public.vorvan_institutional_inquiry_audit WHERE action='status_updated')<>2 THEN
  RAISE EXCEPTION 'Retry after audit restoration did not succeed exactly once';
 END IF;
END $$;
RESET ROLE;
SELECT 'PASS VOR-011 PostgreSQL 17: scoped grants, unique retry IDs, atomic INSERT/UPDATE audit, rollback and safe replay' AS result;
