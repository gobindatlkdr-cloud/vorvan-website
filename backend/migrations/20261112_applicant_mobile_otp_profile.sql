-- VORVAN applicant mobile-first contact form (12 Nov 2026).
-- Contact data only, NO PAN/Aadhaar/birthdate/income/bank details/CIBIL data.
-- Supabase phone OTP must be independently configured with a compliant SMS provider.
-- Existing verified-email customer rows (if any) are preserved.
begin;
alter table public.vorvan_customer_intake_profiles
  alter column email drop not null,
  add column if not exists father_name varchar(100),
  add column if not exists address_line varchar(200),
  add column if not exists locality varchar(80),
  add column if not exists district varchar(80),
  add column if not exists state_name varchar(80),
  add column if not exists postal_code varchar(6),
  add column if not exists employment_subtype varchar(32),
  add column if not exists employer_name varchar(140),
  add column if not exists department_name varchar(140),
  add column if not exists designation varchar(100),
  add column if not exists business_type varchar(32),
  add column if not exists business_name varchar(140);
alter table public.vorvan_customer_intake_profiles
  drop constraint if exists vorvan_customer_intake_profiles_consent_version_check;
alter table public.vorvan_customer_intake_profiles
  add constraint vorvan_applicant_consent_version
    check (consent_version in ('contact_enquiry_v1_2026_11_11','applicant_mobile_v1_2026_11_12')),
  add constraint vorvan_applicant_email_format
    check (email is null or (email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' and char_length(email)<=254)),
  add constraint vorvan_applicant_father_name
    check (father_name is null or (char_length(trim(father_name)) between 2 and 100 and father_name !~ '[<>[:cntrl:]]')),
  add constraint vorvan_applicant_address
    check (address_line is null or (char_length(trim(address_line)) between 6 and 200 and address_line !~ '[<>[:cntrl:]]')),
  add constraint vorvan_applicant_location
    check ((locality is null or (char_length(trim(locality)) between 2 and 80 and locality !~ '[<>[:cntrl:]]'))
      and (district is null or (char_length(trim(district)) between 2 and 80 and district !~ '[<>[:cntrl:]]'))
      and (state_name is null or (char_length(trim(state_name)) between 2 and 80 and state_name !~ '[<>[:cntrl:]]'))
      and (postal_code is null or postal_code ~ '^[1-9][0-9]{5}$')),
  add constraint vorvan_applicant_employment_subtype
    check (employment_subtype is null or employment_subtype in
      ('private_company','central_government','state_government','public_sector','other_salaried')),
  add constraint vorvan_applicant_business_type
    check (business_type is null or business_type in
      ('retail','services','manufacturing','trading','professional','agriculture','other_business')),
  add constraint vorvan_applicant_optional_work_text
    check ((employer_name is null or (char_length(trim(employer_name)) between 2 and 140 and employer_name !~ '[<>[:cntrl:]]'))
      and (department_name is null or (char_length(trim(department_name)) between 2 and 140 and department_name !~ '[<>[:cntrl:]]'))
      and (designation is null or (char_length(trim(designation)) between 2 and 100 and designation !~ '[<>[:cntrl:]]'))
      and (business_name is null or (char_length(trim(business_name)) between 2 and 140 and business_name !~ '[<>[:cntrl:]]'))),
  add constraint vorvan_applicant_mobile_form_complete
    check (consent_version <> 'applicant_mobile_v1_2026_11_12'
       or (
         father_name is not null and address_line is not null and locality is not null
         and district is not null and state_name is not null and postal_code is not null
         and (
           (work_category='salaried' and employment_subtype is not null
             and designation is not null and
             ((employment_subtype in ('private_company','other_salaried','public_sector') and employer_name is not null)
              or (employment_subtype in ('central_government','state_government') and department_name is not null)))
           or (work_category='self_employed' and business_type is not null and business_name is not null)
           or (work_category in ('student','homemaker','other'))
         )
       ));
-- Revoke the ability to change a mobile after Auth has verified its ownership.
revoke update(phone) on public.vorvan_customer_intake_profiles from authenticated;
grant select on public.vorvan_customer_intake_profiles to authenticated;
grant insert(user_id,full_name,email,phone,work_category,work_details,consent_version,
  father_name,address_line,locality,district,state_name,postal_code,employment_subtype,
  employer_name,department_name,designation,business_type,business_name)
  on public.vorvan_customer_intake_profiles to authenticated;
grant update(full_name,work_category,work_details,
  father_name,address_line,locality,district,state_name,postal_code,employment_subtype,
  employer_name,department_name,designation,business_type,business_name)
  on public.vorvan_customer_intake_profiles to authenticated;
-- Phone identity is asserted only by a signed, non-anonymous Supabase GoTrue JWT.
-- Preserve legacy email users so earlier consented records remain accessible.
drop policy if exists vorvan_intake_customer_own_insert on public.vorvan_customer_intake_profiles;
create policy vorvan_intake_customer_own_insert on public.vorvan_customer_intake_profiles
 for insert to authenticated with check (
   (select auth.uid())=user_id
   and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
   and (
     (consent_version='applicant_mobile_v1_2026_11_12'
       and (auth.jwt()->>'phone')='+91'||phone)
     or
     (consent_version='contact_enquiry_v1_2026_11_11'
       and email is not null
       and lower(email)=lower(coalesce((auth.jwt()->>'email'),''))
     )
   )
 );
drop policy if exists vorvan_intake_customer_own_update on public.vorvan_customer_intake_profiles;
create policy vorvan_intake_customer_own_update on public.vorvan_customer_intake_profiles
 for update to authenticated
 using ((select auth.uid())=user_id and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false)
 with check (
  (select auth.uid())=user_id and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and (
    (consent_version='applicant_mobile_v1_2026_11_12'
      and (auth.jwt()->>'phone')='+91'||phone)
    or (consent_version='contact_enquiry_v1_2026_11_11'
      and email is not null and lower(email)=lower(coalesce((auth.jwt()->>'email'),'')))
  )
 );
-- Existing owner-only Edge function uses service role, never bypasses a staff AAL2 check.
commit;
