# VORVAN M0 — Baseline security hardening and verification

**Project basis:** `VORVAN_Software_Development_Project_Handover_v1_2026-11-09.pdf`, sections 2.1, 12, 14, 15 (VOR-001 to VOR-005).  
**Audit date:** 09 November 2026.  
**Company status:** incorporation **PENDING**; MCA fee paid; no verified COI/CIN. Never imply regulated lending services are live.

## Starting state and recovery

- Existing owner-controlled repository: `gobindatlkdr-cloud/vorvan-website`
- Pre-M0 `main` commit: `e2426d24a7f6434ea7529bd3194fae0741141444`
- Non-production baseline snapshot branch: `rollback/20261109-pre-m0` points to the exact pre-change commit.
- Implementation branch: `feature/20261109-m0-secure-baseline`.
- There were two already-open, superseded burgundy-design PRs (#10 and #11); **do not merge them** without checking their conflicts against the newer site.
- To roll back frontend changes, create a reviewed revert PR of the M0 merge; to restore backend, redeploy the known source from the baseline commit and verify JWT remains required. Avoid force-pushing `main`.
- This branch is a recovery pointer, **not** an immutable release tag or backup of Supabase data.

## Confirmed baseline evidence

| Area | Evidence / boundary |
|---|---|
| Public site | GitHub Pages; newer loan-category and Partner With Us redesign already in main |
| Admin | Existing client/MFA checks and server-side allowlist maintained; actual owner AAL2 end-to-end interaction NOT tested |
| Vault | Four restricted tables, fifteen checklist rows, private bucket, JWT-enabled Edge Function; zero file/evidence rows at audit |
| Supabase | Seven active Edge Functions; RLS enabled on examined public tables |
| Incorporation | Database status pending, fee paid; COI and CIN not yet present |
| Known warnings | Auth leaked-password protection warning; intentional RLS-enabled/no-policy information warnings |
| Regulated features | No live lender, CIBIL/bureau, KYC, payments or customer application enabled by this release |

## Changes in this milestone

1. Vault JSON requests and file uploads now use `readBytesWithLimit`, a bounded stream reader. Rejects malformed/oversized Content-Length and streaming uploads larger than 8 MiB, even without Content-Length.
2. Public Vyn API no longer advertises `admin@vorvan.co.in` in English/Bengali/Hindi responses or the contacts payload.
3. Public Vyn API returns just the **topic-appropriate** email contact (`info`, `partnerships`, `support`, `legal`) to the caller.
4. Deno body-reader tests and Node source/access-boundary tests are included in GitHub CI. Existing tests remain in place.

## What tests prove — and do not prove

### Automated source/unit checks

- Small bytes accepted and preserved.
- Oversize stream rejected with or without declared request length.
- Invalid Content-Length and empty request rejected.
- Source still requires owner file operations, server-verified AAL2 JWT, incorporation blocking and private storage.
- Public Vyn source does not contain internal admin mailbox or mass contacts payload.
- No production lender feature is activated by the patch.

These **are not a substitute for** authenticated owner-browser E2E, cross-role authorization tests, dependency SAST, independent VAPT, load testing or an external legal audit.

### Required operational E2E (still pending, owner-approved test account only)

- AAL1 direct Vault call → denied; AAL2 owner sign-in succeeds; operator/auditor attempts upload/verify → denied.
- Upload a **synthetic, nonsensitive** PDF and PNG; download; independently verify hash, version numbering, events and owner approval.
- Test 8 MiB boundary; wrong MIME/signature; duplicate upload; failed/degraded storage; expired JWT; revoked session.
- Ensure post-incorporation evidence cannot become `verified` until actual COI/CIN is verified and status updated by approved process.
- Capture sanitized screenshots/test logs and remediate defects before real company document upload.

## Open risks and owner decisions

- Supabase Free currently cannot automatically be represented as having leaked-password protection enabled. Maintain unique strong owner password, MFA, least privileges and session review. Evaluate paid Auth protection or formal risk acceptance before handling sensitive data.
- RLS-enabled tables with no policies can be **intentional deny by default**. Examine every table/view, Data API GRANT, SECURITY DEFINER function and storage policy before introducing customer records. Never add permissive RLS policies just to clear warnings.
- Production backup/restore, incident response, data retention, penetration test and real Auth journey still need evidence.
- M1 Customer Identity/Consent, Readiness Passport and 90-Day Plan are **not** implemented by this M0 hardening release.
- M2 personal AI, M3 payments and M4 lender integrations remain gated until separate technical/legal/contract approvals.

## Release checklist

- [ ] New PR passes all GitHub CI jobs and is reviewed/merged
- [ ] Supabase Edge Functions `compliance-vault` and `site-assistant` deployed from the same merged source versions
- [ ] Verify `compliance-vault` still requires valid JWT and unauthorized access returns HTTP 401
- [ ] Send synthetic public Vyn requests in EN, BN, HI; verify no private admin mailbox and contextual contact
- [ ] Check RLS adviser output unchanged, no new warnings
- [ ] Owner-authenticated browser E2E and independent assessment scheduled/recorded before sensitive documents

**Never use real borrower/customer data in these tests.**
