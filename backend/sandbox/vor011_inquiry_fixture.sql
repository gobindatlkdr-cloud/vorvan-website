-- VOR-011 ephemeral PostgreSQL 17 fixture; NOT production schema.
-- Requires backend/sandbox/vor006_rls_setup.sql (anon/authenticated/service_role roles).
CREATE TABLE public.vorvan_institutional_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_type text NOT NULL CHECK (institution_type IN ('bank','nbfc')),
  institution_name text NOT NULL,
  institution_website text NOT NULL,
  contact_name text NOT NULL,
  designation text NOT NULL,
  official_email text NOT NULL,
  business_phone text,
  partnership_track text NOT NULL CHECK (partnership_track IN ('direct_lsp','direct_api','both')),
  agenda text NOT NULL,
  source_channel text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','verified','contacted','closed','rejected')),
  review_note text,
  reviewer_id uuid,
  rate_digest text NOT NULL CHECK (rate_digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.vorvan_institutional_inquiry_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.vorvan_institutional_inquiries(id),
  actor_user_id uuid,
  action text NOT NULL CHECK (action IN ('created','status_updated','note_updated')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vorvan_institutional_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vorvan_institutional_inquiry_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vorvan_institutional_inquiries FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.vorvan_institutional_inquiry_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vorvan_institutional_inquiries TO service_role;
GRANT SELECT, INSERT ON public.vorvan_institutional_inquiry_audit TO service_role;
