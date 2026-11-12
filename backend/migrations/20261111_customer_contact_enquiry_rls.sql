-- VORVAN customer-first contact intake and non-binding loan information enquiries
-- No credit bureau data, PAN, KYC, loan applications, loan approval or payment records.
-- All user-facing writes require Supabase Auth and ownership-enforcing PostgreSQL RLS.
begin;

create table if not exists public.vorvan_customer_intake_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(100) not null check (char_length(trim(full_name)) between 2 and 100 and full_name !~ '[<>[:cntrl:]]'),
  email varchar(254) not null check (char_length(trim(email)) between 5 and 254),
  phone varchar(10) not null check (phone ~ '^[6-9][0-9]{9}$'),
  work_category varchar(24) not null check (work_category in ('salaried','self_employed','student','homemaker','other')),
  work_details varchar(160) not null check (char_length(trim(work_details)) between 3 and 160 and work_details !~ '[<>[:cntrl:]]'),
  consent_version varchar(40) not null default 'contact_enquiry_v1_2026_11_11'
    check (consent_version = 'contact_enquiry_v1_2026_11_11'),
  consent_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vorvan_customer_intake_profiles enable row level security;
drop policy if exists vorvan_intake_customer_own_read on public.vorvan_customer_intake_profiles;
create policy vorvan_intake_customer_own_read on public.vorvan_customer_intake_profiles
 for select to authenticated
 using ((select auth.uid())=user_id
   and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false);
drop policy if exists vorvan_intake_customer_own_insert on public.vorvan_customer_intake_profiles;
create policy vorvan_intake_customer_own_insert on public.vorvan_customer_intake_profiles
 for insert to authenticated with check (
   (select auth.uid())=user_id
   and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
   and lower(email)=lower(coalesce((select auth.jwt()->>'email'),''))
 );
drop policy if exists vorvan_intake_customer_own_update on public.vorvan_customer_intake_profiles;
create policy vorvan_intake_customer_own_update on public.vorvan_customer_intake_profiles
 for update to authenticated
 using ((select auth.uid())=user_id
    and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false)
 with check ((select auth.uid())=user_id
   and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
   and lower(email)=lower(coalesce((select auth.jwt()->>'email'),'')));
drop trigger if exists vorvan_intake_profile_updated on public.vorvan_customer_intake_profiles;
create trigger vorvan_intake_profile_updated before update on public.vorvan_customer_intake_profiles
 for each row execute function private.touch_updated_at();

revoke all on public.vorvan_customer_intake_profiles from public, anon, authenticated;
grant select on public.vorvan_customer_intake_profiles to authenticated;
grant insert(user_id,full_name,email,phone,work_category,work_details,consent_version)
 on public.vorvan_customer_intake_profiles to authenticated;
grant update(full_name,phone,work_category,work_details)
 on public.vorvan_customer_intake_profiles to authenticated;
grant all on public.vorvan_customer_intake_profiles to service_role;

create table if not exists public.vorvan_customer_enquiries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 loan_category varchar(20) not null
   check (loan_category in ('personal','business','education','short_term')),
 enquiry_topic varchar(30) not null
   check (enquiry_topic in ('loan_information','eligibility_question','report_issue','documents','other')),
 message varchar(300) not null default ''
   check (char_length(message)<=300 and message !~ '[<>[:cntrl:]]'
     and message !~ '[0-9]{12}' and upper(message) !~ '[A-Z]{5}[0-9]{4}[A-Z]'),
 status varchar(24) not null default 'received'
   check (status in ('received','reviewing','needs_information','closed')),
 staff_reply varchar(500) not null default ''
   check (staff_reply !~ '[<>[:cntrl:]]'),
 updated_by_admin uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists vorvan_customer_enquiries_by_user_recent
 on public.vorvan_customer_enquiries(user_id,created_at desc);
create index if not exists vorvan_customer_enquiries_by_queue
 on public.vorvan_customer_enquiries(status,created_at desc);
alter table public.vorvan_customer_enquiries enable row level security;
drop policy if exists vorvan_enquiry_customer_own_read on public.vorvan_customer_enquiries;
create policy vorvan_enquiry_customer_own_read on public.vorvan_customer_enquiries
 for select to authenticated using (
   (select auth.uid())=user_id
   and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 );
drop policy if exists vorvan_enquiry_customer_own_submit on public.vorvan_customer_enquiries;
create policy vorvan_enquiry_customer_own_submit on public.vorvan_customer_enquiries
 for insert to authenticated with check (
   (select auth.uid())=user_id
   and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
   and status='received' and staff_reply=''
   and exists (
      select 1 from public.vorvan_customer_intake_profiles p where p.user_id=(select auth.uid())
   )
 );
drop trigger if exists vorvan_enquiry_updated on public.vorvan_customer_enquiries;
create trigger vorvan_enquiry_updated before update on public.vorvan_customer_enquiries
 for each row execute function private.touch_updated_at();

revoke all on public.vorvan_customer_enquiries from public, anon, authenticated;
grant select(id,user_id,loan_category,enquiry_topic,message,status,staff_reply,created_at,updated_at)
 on public.vorvan_customer_enquiries to authenticated;
grant insert(user_id,loan_category,enquiry_topic,message)
 on public.vorvan_customer_enquiries to authenticated;
grant all on public.vorvan_customer_enquiries to service_role;

create table if not exists private.vorvan_customer_enquiry_admin_audit(
  id bigint generated always as identity primary key,
  enquiry_id uuid not null,
  actor_user_id uuid not null,
  old_status varchar(24) not null,
  new_status varchar(24) not null,
  created_at timestamptz not null default now()
);
alter table private.vorvan_customer_enquiry_admin_audit enable row level security;
-- An audited status or response update is atomic with its audit event.
-- Edge owner verification supplies updated_by_admin, never a public customer.
create or replace function private.vorvan_customer_enquiry_audit_change()
returns trigger language plpgsql set search_path = '' as $fn$
begin
  if (new.status is distinct from old.status) or
     (new.staff_reply is distinct from old.staff_reply) then
    if new.updated_by_admin is null then
      raise exception 'verified_admin_actor_required';
    end if;
    insert into private.vorvan_customer_enquiry_admin_audit(enquiry_id,actor_user_id,old_status,new_status)
      values(new.id,new.updated_by_admin,old.status,new.status);
  end if;
  return new;
end;
$fn$;
revoke all on function private.vorvan_customer_enquiry_audit_change() from public, anon, authenticated;
drop trigger if exists vorvan_enquiry_admin_audit_change on public.vorvan_customer_enquiries;
create trigger vorvan_enquiry_admin_audit_change
  after update of status,staff_reply on public.vorvan_customer_enquiries
  for each row execute function private.vorvan_customer_enquiry_audit_change();
revoke all on private.vorvan_customer_enquiry_admin_audit from public, anon, authenticated;
grant all on private.vorvan_customer_enquiry_admin_audit to service_role;
grant usage, select on sequence private.vorvan_customer_enquiry_admin_audit_id_seq to service_role;

commit;
