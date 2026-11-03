-- VORVAN Step 12D: reproducible schema, already applied to vorvan-dev-india 2026-11-03
-- Sensitive tables have RLS enabled with NO anon/authenticated policies by design.
-- Only the MFA/ACL-protected Edge Function may access them via service-role credentials.
create table if not exists public.vorvan_company_readiness (
 id smallint primary key default 1 check (id=1),
 incorporation_status text not null default 'pending_incorporation' check(incorporation_status in ('pending_incorporation','incorporated')),
 ca_documents_verified boolean not null default false,
 mca_fee_paid boolean not null default false,
 coi_issued boolean not null default false,
 cin text,
 source text not null default 'owner_confirmed',
 updated_at timestamptz not null default now(),
 constraint incorporation_requires_certificate check (
  (incorporation_status='pending_incorporation' and coi_issued=false and cin is null)
  or (incorporation_status='incorporated' and coi_issued=true and cin is not null and length(trim(cin))=21)
 )
);
alter table public.vorvan_company_readiness enable row level security;
revoke all on public.vorvan_company_readiness from anon,authenticated;
insert into public.vorvan_company_readiness(id,incorporation_status,ca_documents_verified,mca_fee_paid,coi_issued,cin,source)
values (1,'pending_incorporation',true,true,false,null,'owner_confirmed_2026_11_03')
on conflict(id) do nothing;

create table if not exists public.vorvan_compliance_documents (
 doc_id text primary key check(doc_id ~ '^[a-z][a-z0-9_]{2,55}$'),
 title text not null check(length(title) between 4 and 120),
 category text not null check(category in ('incorporation','corporate','lsp_due_diligence','privacy_security','contracting')),
 stage text not null default 'pending' check(stage in ('pending','draft','under_review','verified','blocked')),
 post_incorporation boolean not null default false,
 description text not null default '' check(length(description)<=500),
 notes text not null default '' check(length(notes)<=500),
 modified_by uuid references auth.users(id),
 verified_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.vorvan_compliance_documents enable row level security;
revoke all on public.vorvan_compliance_documents from anon,authenticated;
create index if not exists vorvan_compliance_docs_cat_idx on public.vorvan_compliance_documents(category);

create table if not exists public.vorvan_compliance_files (
 id uuid primary key default gen_random_uuid(),
 doc_id text not null references public.vorvan_compliance_documents(doc_id),
 object_path text not null unique check(length(object_path)<=240),
 mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg')),
 byte_size integer not null check(byte_size between 1 and 8388608),
 sha256_hex text not null check(sha256_hex ~ '^[0-9a-f]{64}$'),
 uploaded_by uuid not null references auth.users(id),
 uploaded_at timestamptz not null default now()
);
alter table public.vorvan_compliance_files enable row level security;
revoke all on public.vorvan_compliance_files from anon,authenticated;
create index if not exists vorvan_compliance_files_doc_idx on public.vorvan_compliance_files(doc_id,uploaded_at desc);

create table if not exists public.vorvan_compliance_events (
 id bigint generated always as identity primary key,
 actor_user_id uuid not null references auth.users(id),
 action text not null check(action in ('document_uploaded','document_status_changed','document_downloaded','document_version_downloaded')),
 doc_id text not null references public.vorvan_compliance_documents(doc_id),
 meta jsonb not null default '{}'::jsonb check(jsonb_typeof(meta)='object'),
 created_at timestamptz not null default now()
);
alter table public.vorvan_compliance_events enable row level security;
revoke all on public.vorvan_compliance_events from anon,authenticated;
create index if not exists vorvan_compliance_events_created_idx on public.vorvan_compliance_events(created_at desc);

insert into public.vorvan_compliance_documents(doc_id,title,category,post_incorporation,description) values
('mca_payment_receipt','MCA Payment Acknowledgement','incorporation',false,'Payment confirmed by owner; receipt upload outstanding'),
('mca_filing_ack','MCA Filing / SRN Acknowledgement','incorporation',false,'Record MCA filing acknowledgement when available'),
('coi_certificate','Certificate of Incorporation (COI)','incorporation',true,'Not yet issued: do not display incorporated status'),
('corporate_pan_tan','Corporate PAN / TAN','corporate',true,'Record official PAN/TAN after issuance'),
('board_resolution','Board Resolution for Direct LSP/API','corporate',true,'Prepare after incorporation and board approval'),
('company_profile','Company Profile and Business Model','corporate',false,'Direct lender API and formal LSP, not DSA or lead referral'),
('lsp_due_diligence','Direct LSP/API Due Diligence Pack','lsp_due_diligence',false,'Institutional onboarding and vendor diligence materials'),
('data_consent','Customer Consent and Privacy Design','privacy_security',false,'Purpose-specific consent, minimisation and retention plans'),
('information_security','Information Security Policy','privacy_security',false,'Access control, encryption, backups and monitoring'),
('grievance_policy','Grievance Redressal Procedure','privacy_security',false,'Customer contacts and escalation procedure'),
('api_architecture','API Architecture and Security Review','lsp_due_diligence',false,'Proposed integration and threat model; no live lenders'),
('bcp_incident','Business Continuity and Incident Response','privacy_security',false,'Response plan, incident register and recovery exercises'),
('lsp_agreement','Draft LSP and Data Processing Agreements','contracting',false,'Legal drafts only; no executed lender contract represented'),
('vapt_assessment','Security Testing and VAPT Evidence','privacy_security',false,'Do not mark certified without actual independent assessment'),
('bank_account_kyc','Corporate Bank Account and KYC','corporate',true,'To be completed after incorporation')
on conflict(doc_id) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('vorvan-company-private','vorvan-company-private',false,8388608,array['application/pdf','image/png','image/jpeg'])
on conflict(id) do nothing;
