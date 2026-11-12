# VORVAN Customer-First Website and Secure Enquiry Release

**Date:** 12 November 2026  
**Status:** Source implemented; deploy only after CI and server security verification.

## Customer experience
The homepage prioritises **Customer Login → Profile → clearly fictional CIBIL Score → CIBIL Guide (3/6-month previews) → credit-report issue education → loan information enquiry**. Four planned categories remain publicly explained; customers sign in before they can submit a non-binding information enquiry. The separate **Partner With Us** institutional route remains unchanged. Burgundy styling is retained; text follows VORVAN's own voice, not copied competitor materials.

### Actual service boundaries
- **Real, intended for launch after verification:** Supabase email-verified authentication, customer contact profile (full name, verified email, self-reported 10-digit mobile, work category and occupation details), versioned contact/enquiry consent indicator, and logged-in loan information enquiries. Each customer reads only their own data via PostgreSQL row-level security. Enquiries have four manually managed states and a staff reply.
- **Fictional local training only:** CIBIL-style fixed 662 sample, educational 30/60/90-day milestones, 3/6-month CIBIL Guide preview, reporting issues for suggested next steps and illustrative category matching. Score and issue examples are never fetched from an authorised bureau, saved, used for decisions, reported to a lender or marketed as real AI expertise.
- **Not enabled:** SMS OTP/phone verification, live CIBIL API, lender match/offer, loan application/disbursal, payments/subscriptions, expert dispute filing, customer score storage and customer document/KYC upload.

## Database and access security
Migration: `backend/migrations/20261111_customer_contact_enquiry_rls.sql`, applied to connected Supabase project. Creates `public.vorvan_customer_intake_profiles` and `public.vorvan_customer_enquiries` with Auth ownership RLS, immutable consent version/timestamp and staff-only status/reply fields. `private.vorvan_customer_enquiry_admin_audit` stores each owner staff state change via a transaction-coupled trigger. No anonymous table permission; direct customers cannot read other people's data, alter decision status or read private Admin audit.

Owner queue: `backend/customer-operations/index.ts` verifies Supabase Auth /user, confirmed email, enabled Admin ACL and AAL2 MFA **on every call**; only role `owner` can list contact/enquiry records or update manual response/status. Source under `assets/customer-admin-queue.js` is lazy-mounted from the pre-existing authenticated Admin portal. It is not reachable from an unauthenticated public navigation link. State transitions are bounded (received → reviewing/needs_information/closed, reviewing → needs_information/closed, needs_information → reviewing/closed); closed is terminal. Staff changes use optimistic concurrency and atomic audit.

The customer's authentication token stays only in page memory; reloading requires signing in again. No secret/service role key or personal data is embedded in the public repository.

## Data governance / limitations
Email OTP delivery depends on the connected Supabase Auth provider configuration and email send quotas. Phone number is self-reported, not SMS verified. The contact-enquiry consent is recorded when a customer saves their profile, not proof of consent to credit bureau checks or lender sharing. The privacy page explains what is collected and supplies the legal contact route for access/correction/deletion requests. Customer enquiry free text must not contain PAN, Aadhaar, bank details, OTP or salary amounts; this is not a regulatory dispute resolution form.

Before treating this as production-complete: verify Auth email templates and site redirect URL, verify real non-identifying test-user sign-in, validate customer consent language with legal counsel, run real browser user-vs-user RLS UAT, confirm owner AAL2 end-to-end review, complete privacy/retention and independent VAPT, and monitor abuse, email quotas and takedown procedures. No fabricated CIBIL preview is represented as a real score. The user explicitly requested profile data to be saved; do not use it for marketing or bureau pulls without separate lawful purposes and consent.

## Verification, rollback and release
Execute Deno customer-journey checks, source checks and isolated PostgreSQL 17 RLS+audit tests, then existing repository security CI; deploy `customer-operations` Edge Function with JWT verification. Do not assert live availability until GitHub Pages and domain checks pass. Backout live publication by reverting the scoped frontend PR and disabling the Edge function. The database stays locked by RLS and can be retained for a controlled migration/secure deletion after privacy review. No migration rollback that might remove real customer records without an approved data-erasure plan.

All prior 20-ticket milestone release gates remain as documented. **This is a controlled contact intake pilot, not full CIBIL/lending go-live.**