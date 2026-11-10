-- M1 VOR-011 — Atomic audit trail and safe public inquiry retry IDs.
-- Reviewed for existing VORVAN Bank/NBFC inquiry and audit tables.
-- No existing inquiries or audit rows are removed; no new anon/authenticated grants.
-- Run only after synthetic PostgreSQL CI and source review.
ALTER TABLE public.vorvan_institutional_inquiries
  ADD COLUMN IF NOT EXISTS submission_id uuid,
  ADD COLUMN IF NOT EXISTS request_fingerprint text;
ALTER TABLE public.vorvan_institutional_inquiries
  ADD CONSTRAINT vor011_submission_fingerprint_pair
  CHECK (
    (submission_id IS NULL AND request_fingerprint IS NULL)
    OR
    (submission_id IS NOT NULL AND request_fingerprint ~ '^[a-f0-9]{64}$')
  );
CREATE UNIQUE INDEX IF NOT EXISTS vor011_unique_submission_id
  ON public.vorvan_institutional_inquiries (submission_id)
  WHERE submission_id IS NOT NULL;

-- SECURITY INVOKER: uses existing service_role INSERT on the audit table.
-- A failed audit INSERT aborts the entire inquiry INSERT/PATCH transaction.
-- No separate fire-and-forget audit requests may remain in the Edge handler.
CREATE FUNCTION public.vor011_inquiry_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vorvan_institutional_inquiry_audit
      (inquiry_id, actor_user_id, action)
    VALUES (NEW.id, NULL, 'created');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.vorvan_institutional_inquiry_audit
        (inquiry_id, actor_user_id, action)
      VALUES (NEW.id, NEW.reviewer_id, 'status_updated');
    ELSIF NEW.review_note IS DISTINCT FROM OLD.review_note THEN
      INSERT INTO public.vorvan_institutional_inquiry_audit
        (inquiry_id, actor_user_id, action)
      VALUES (NEW.id, NEW.reviewer_id, 'note_updated');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.vor011_inquiry_audit_trigger() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vor011_inquiry_audit_trigger() TO service_role;
CREATE TRIGGER vor011_inquiry_after_insert_audit
  AFTER INSERT ON public.vorvan_institutional_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.vor011_inquiry_audit_trigger();
CREATE TRIGGER vor011_inquiry_after_review_audit
  AFTER UPDATE OF status, review_note ON public.vorvan_institutional_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.vor011_inquiry_audit_trigger();

-- Existing protected RLS, existing company MFA/ACL and all service-role access remain.
