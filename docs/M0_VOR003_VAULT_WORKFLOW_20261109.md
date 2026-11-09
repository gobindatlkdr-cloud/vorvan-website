# VORVAN — M0 VOR-003 Company Document Vault Workflow Test Evidence

**Date:** 09 November 2026 · **Scope:** Synthetic request-level integration tests of the existing `backend/compliance-vault/index.ts` handler · **Company:** pre-incorporation (MCA fees paid; COI/CIN not issued).

## Result

**13/13 Deno integration tests passed, 0 failures.** Verified in [GitHub Actions CI run 42648050436](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42648050436) against the VOR-003 pull-request source. The tests are installed in the existing Static Security workflow; future PRs and pushes to `main` rerun them.

**Test source:** `backend/tests/company_vault_workflow.test.ts`.

### What is actually exercised

The test imports the **real production Vault Edge Function request handler** but intercepts the `Deno.serve` registration within its test process. It supplies synthetic AAL2-style JWT payloads and mock Auth/ACL replies and replaces **all** Supabase REST/Storage HTTP calls with deterministic in-memory records and object bytes. It does not make network requests to Supabase and does not produce an Auth-issued JWT or validate its signature. The actual Edge deployment still relies on platform JWT validation and `/auth/v1/user` checks.

| # | Test | Result |
|---|---|---|
| 1 | Owner uploads a **synthetic PDF**; verify exact bytes, 64-character SHA-256, metadata, under-review state and upload audit event | PASS |
| 2 | Upload two different PDF versions; check latest + prior version IDs, ordering, stored SHA-256, exact download bytes and both download audit actions | PASS |
| 3 | Same-length storage-byte tampering triggers `file_integrity_checksum_mismatch`, never returns sensitive content or logs a successful download | PASS |
| 4 | Truncated file triggers `file_integrity_length_mismatch` | PASS |
| 5 | Operator and Auditor cannot upload/download binary files | PASS |
| 6 | Unapproved, AAL1 and absent bearer cannot upload | PASS |
| 7 | Unsupported MIME and PDF-signature mismatch rejected | PASS |
| 8 | File larger than **8 MiB** rejected before storage/metadata writes | PASS |
| 9 | Synthetic storage error rejected; failed metadata insertion deletes the previously uploaded private object | PASS |
| 10 | Owner can verify uploaded evidence; Operator cannot approve; Auditor cannot modify | PASS |
| 11 | Verification requires uploaded evidence; **post-incorporation document cannot be marked verified while incorporation pending** | PASS |
| 12 | Unknown document and malformed PATCH rejected without writes | PASS |
| 13 | Disallowed Origin and nonexistent public storage route rejected | PASS |

### Live production state — READ ONLY

Observed through aggregate SQL metadata on 09 Nov 2026:

- Compliance document checklist records: **15**.
- Company file database rows: **0**.
- Compliance audit-event database rows: **0**.
- Bucket `vorvan-company-private`: **not public**.
- Company state: `pending_incorporation`; MCA fee paid.
- No test object or event was written to the live Supabase project.

### What remains unverified / open risks

- **Real Owner AAL2 browser login and real Supabase Storage upload/download** with a non-sensitive file have NOT been tested. No real Operator/Auditor identity was used. As such, this is **NOT end-to-end production verification**.
- The workflow uses separate Storage upload, metadata insert, document status update and audit insert operations. These operations are **not one atomic transaction**. The code compensates for a failed metadata insert by deleting the storage blob, but a later status update or audit insert failure could leave a partially completed sequence (orphan/unsynchronized state). This requires reconciliation/compensating cleanup and failure-injection tests **before sensitive document use**.
- Concurrency and duplicate uploads, storage outage/retry/idempotency, audit availability, session expiry/revocation, PDF content malware scanning and cross-user authorization have not been independently stress-tested.
- The mocked JWT AAL2 claim does not substitute for **real Supabase-issued Auth token validation** and MFA factor verification.
- The test's bytes are not actual company documents, cannot be construed as a reviewed or approved COI/CIN and are never uploaded to production.
- Independent VAPT, verified backup/restore and incident response are still pending.

### Acceptance decision

**VOR-003 synthetic functional/security integration subtask: COMPLETED. VOR-003 overall: PARTIAL.** No real company documents should be placed in the Vault until Owner E2E, failure recovery and outstanding security gates have documented results.

### Rerun

In GitHub Actions select the existing **Static website security and integrity** workflow, or from a trusted checkout with Deno v2 run:

```bash
deno test --allow-env backend/tests/company_vault_workflow.test.ts
```

Only synthetic/test-host environment values are used; no production passwords, service-role keys, customer credit data, real OTPs or documents are needed.
