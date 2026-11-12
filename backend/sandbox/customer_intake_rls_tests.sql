-- VORVAN live customer contact/enquiry RLS proof in isolated Postgres17.
-- All IDs/emails/phones are synthetic and rollback with throwaway CI container.
do $test$
begin
 if not (select relrowsecurity from pg_class where oid='public.vorvan_customer_intake_profiles'::regclass) then
  raise exception 'Profile RLS disabled';
 end if;
 if not (select relrowsecurity from pg_class where oid='public.vorvan_customer_enquiries'::regclass) then
  raise exception 'Enquiry RLS disabled';
 end if;
 if has_table_privilege('anon','public.vorvan_customer_enquiries','select') or
    has_table_privilege('anon','public.vorvan_customer_intake_profiles','insert') then
  raise exception 'Anonymous privileges exposed';
 end if;
 if has_column_privilege('authenticated','public.vorvan_customer_enquiries','status','insert') or
    has_column_privilege('authenticated','public.vorvan_customer_enquiries','status','update') or
    has_column_privilege('authenticated','public.vorvan_customer_intake_profiles','consent_accepted_at','update') then
  raise exception 'Customer can forge staff decisions or consent times';
 end if;
 if not has_column_privilege('authenticated','public.vorvan_customer_enquiries','loan_category','insert') then
  raise exception 'Authenticated enquiry intake unavailable';
 end if;
end $test$;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select set_config('request.jwt.claims','{"email":"test-a@invalid.example","is_anonymous":false}',false);
insert into public.vorvan_customer_intake_profiles(user_id,full_name,email,phone,work_category,work_details,consent_version)
values('00000000-0000-4000-8000-000000000001','Sample Person A','test-a@invalid.example','9000000000',
 'salaried','Fictional full-time office worker','contact_enquiry_v1_2026_11_11');
insert into public.vorvan_customer_enquiries(user_id,loan_category,enquiry_topic,message)
values('00000000-0000-4000-8000-000000000001','education','loan_information','Synthetic question');
do $test$
begin
 if (select count(*) from public.vorvan_customer_intake_profiles) <> 1 then raise exception 'Profile ownership broke';end if;
 if (select count(*) from public.vorvan_customer_enquiries)<>1 then raise exception 'Own enquiry missing';end if;
 begin
  update public.vorvan_customer_enquiries set status='closed'
  where user_id='00000000-0000-4000-8000-000000000001';
  raise exception 'Customer forged staff-only status';
 exception when insufficient_privilege then null;end;
end $test$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
select set_config('request.jwt.claims','{"email":"test-b@invalid.example","is_anonymous":false}',false);
do $test$
begin
 if (select count(*) from public.vorvan_customer_intake_profiles)<>0 or
    (select count(*) from public.vorvan_customer_enquiries)<>0 then
  raise exception 'Cross-user PII exposure';
 end if;
end $test$;
insert into public.vorvan_customer_intake_profiles(user_id,full_name,email,phone,work_category,work_details,consent_version)
values('00000000-0000-4000-8000-000000000002','Sample Person B','test-b@invalid.example','9111111111',
 'self_employed','Synthetic service business','contact_enquiry_v1_2026_11_11');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select set_config('request.jwt.claims','{"email":"test-a@invalid.example","is_anonymous":false}',false);
do $test$
begin
 if (select count(*) from public.vorvan_customer_intake_profiles)<>1 then raise exception 'User B profile exposed to A';end if;
 if (select count(*) from public.vorvan_customer_enquiries)<>1 then raise exception 'Foreign loan enquiry exposed';end if;
end $test$;
reset role;

-- Staff can edit only with service role; change is audited in same transaction.
set role service_role;
update public.vorvan_customer_enquiries
set status='reviewing',staff_reply='Manual information review in progress',
    updated_by_admin='00000000-0000-4000-8000-000000000002'
where user_id='00000000-0000-4000-8000-000000000001';
do $test$
begin
 if (select count(*) from private.vorvan_customer_enquiry_admin_audit)<>1 then
  raise exception 'Missing transaction-coupled staff audit';
 end if;
 if not exists(select 1 from public.vorvan_customer_enquiries
               where status='reviewing' and staff_reply='Manual information review in progress') then
  raise exception 'Manual review update absent';
 end if;
end $test$;
reset role;
select 'PASS: owner-scoped profile and enquiries; anonymous denied; immutable consent/staff status; atomic Admin review audit' as verdict;


-- Mobile OTP / applicant details isolation tests: synthetic auth users only.
insert into auth.users(id,phone,phone_confirmed_at) values
 ('00000000-0000-4000-8000-000000000003','+919200000000',now()),
 ('00000000-0000-4000-8000-000000000004','+919300000000',now());
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
select set_config('request.jwt.claims','{"phone":"+919200000000","is_anonymous":false}',false);
insert into public.vorvan_customer_intake_profiles(
 user_id,full_name,phone,consent_version,father_name,address_line,locality,district,state_name,
 postal_code,work_category,work_details,employment_subtype,department_name,designation)
values ('00000000-0000-4000-8000-000000000003','Applicant Sample One','9200000000',
 'applicant_mobile_v1_2026_11_12','Parent Sample','12 Example Street','Sample Town',
 'Sample District','Sample State','736135','salaried','Fictional government employment',
 'state_government','Test Public Department','Test Officer');
do $test$
begin
 if (select count(*) from public.vorvan_customer_intake_profiles)<>1
 then raise exception 'Phone applicant profile not available to its owner';end if;
 if exists(select 1 from public.vorvan_customer_intake_profiles
           where email is not null and user_id='00000000-0000-4000-8000-000000000003')
 then raise exception 'Phone signup unexpectedly required an email';end if;
 if has_column_privilege('authenticated','public.vorvan_customer_intake_profiles','phone','update')
 then raise exception 'Customer can overwrite verified OTP mobile';end if;
end $test$;
-- Incorrect signed phone claim must not grant a profile insert.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select set_config('request.jwt.claims','{"phone":"+919100000000","is_anonymous":false}',false);
do $test$
begin
 begin
 insert into public.vorvan_customer_intake_profiles(
 user_id,full_name,phone,consent_version,father_name,address_line,locality,district,state_name,
 postal_code,work_category,work_details,business_type,business_name)
 values ('00000000-0000-4000-8000-000000000004','Applicant Sample Two','9300000000',
 'applicant_mobile_v1_2026_11_12','Parent Sample','13 Example Street','Sample Town',
 'Sample District','Sample State','736135','self_employed','Example small business','retail','Sample Firm');
 raise exception 'Invalid JWT phone claim was accepted';
 exception when insufficient_privilege then null;end;
end $test$;
-- A real matching verified phone JWT can insert a business applicant.
select set_config('request.jwt.claims','{"phone":"+919300000000","is_anonymous":false}',false);
insert into public.vorvan_customer_intake_profiles(
 user_id,full_name,phone,consent_version,father_name,address_line,locality,district,state_name,
 postal_code,work_category,work_details,business_type,business_name)
 values ('00000000-0000-4000-8000-000000000004','Applicant Sample Two','9300000000',
 'applicant_mobile_v1_2026_11_12','Parent Sample','13 Example Street','Sample Town',
 'Sample District','Sample State','736135','self_employed','Example small business','retail','Sample Firm');
do $test$
begin
 if (select count(*) from public.vorvan_customer_intake_profiles)<>1 then
  raise exception 'Another applicant profile leaked to signed-in user';end if;
 if (select business_type from public.vorvan_customer_intake_profiles limit 1)<>'retail' then
  raise exception 'Business category not saved securely';end if;
end $test$;
reset role;
select 'PASS: verified mobile JWT claimant, father/address/job/business fields, email optional, cross-user RLS and phone-immutable grants' as verdict;
