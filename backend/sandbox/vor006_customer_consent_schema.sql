-- VORVAN M1 VOR-006 — ISOLATED SANDBOX SCHEMA (SOURCE ONLY).
-- Never apply to live VORVAN without independent legal/security approval.
-- PostgreSQL 17 / Supabase Auth: relies on existing auth.users and auth.uid().
-- Append-only consent events. This does NOT enroll users or accept any real records.
CREATE TABLE public.vorvan_customer_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL,
  purpose text NOT NULL CHECK (purpose IN (
    'terms_acknowledgement','privacy_acknowledgement','optional_updates')),
  event_type text NOT NULL,
  notice_version text NOT NULL CHECK (notice_version ~ '^sandbox-[a-z0-9-]{6,60}$'),
  notice_sha256 text NOT NULL CHECK (notice_sha256 ~ '^[a-f0-9]{64}$'),
  locale text NOT NULL CHECK (locale IN ('en','bn','hi')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vor006_purpose_decision CHECK (
    (purpose='optional_updates' AND event_type IN ('granted','withdrawn'))
    OR (purpose IN ('terms_acknowledgement','privacy_acknowledgement')
        AND event_type='acknowledged')),
  CONSTRAINT vor006_event_once UNIQUE (user_id,request_id)
);
CREATE INDEX vor006_owner_time_idx ON public.vorvan_customer_consent_events
  (user_id,created_at DESC);
ALTER TABLE public.vorvan_customer_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vorvan_customer_consent_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.vorvan_customer_consent_events FROM PUBLIC, anon, authenticated, service_role;
-- Customer clients may read only their own consent events; no direct writes.
GRANT SELECT ON public.vorvan_customer_consent_events TO authenticated;
-- VOR-006 server verifies bearer with Auth /user, checks active existing profile,
-- and derives user_id from verified Auth identity rather than request body.
GRANT SELECT, INSERT ON public.vorvan_customer_consent_events TO service_role;
CREATE POLICY vor006_owner_read ON public.vorvan_customer_consent_events
 FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
-- No authenticated INSERT/UPDATE/DELETE policy. No admin/operator/auditor bypass.
-- No RLS policy based on user_metadata. Never create USING (true).
