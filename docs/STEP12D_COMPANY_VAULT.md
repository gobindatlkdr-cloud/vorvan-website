# Step 12D — Company Vault implementation

**As of 3 November 2026:** VORVAN incorporation is pending. The owner reports CA-reviewed documents and paid MCA fees. No COI or CIN has been issued. The website must not claim the company is incorporated.

## Scope
- Static public corporate website on GitHub Pages; existing admin login with mandatory AAL2 MFA.
- Supabase project vorvan-dev-india: the additive migration backend/migrations/step12d_compliance_vault.sql has been applied.
- Four dedicated database tables have RLS enabled and no anon/authenticated grants. A private 8 MiB company-documents bucket has been created.
- 15 checklist records cover incorporation, corporate documentation, privacy and security, direct LSP/API due diligence and contracts.
- Edge Function backend/compliance-vault/index.ts is deployed under the compliance-vault slug with verify_jwt enabled.
- Owner-only file upload/download with PDF/PNG/JPEG validation; SHA-256 fingerprint verification on downloads; version metadata, review stages, audit events.
- Legal & Documents in admin.html and assets/admin.js loads the vault after approved owner login and MFA.
- Website footer says incorporation is pending and regulated customer services are not live.

## Guardrails
- No banking or NBFC approvals, live bureau pull, loans, KYC, customer subscriptions or lender connectivity is enabled.
- No customer KYC, Aadhaar, OTPs, passwords or bank data must be uploaded into this company document vault.
- Owner review of uploaded evidence is required before status may be marked verified.
- Post-incorporation documents are blocked from verification while company status is pending.
- Company status is read-only in the UI. Update only after the owner supplies and verifies a genuine Certificate of Incorporation/CIN.

## Verification
- Verified by database query: incorporation_status=pending_incorporation, mca_fee_paid=true, ca_documents_verified=true, coi_issued=false, cin=null.
- Verified by database query: 15 checklist rows, private bucket, RLS on four tables, no anon/authenticated table privileges, no uploaded files.
- Supabase Edge Function active with JWT requirement.
- Pull request CI checks JavaScript, Deno type check and static security invariants.
- Owner browser upload/download and audit recording not yet end-to-end tested. Do not upload sensitive real company documents until smoke testing passes.
- Existing Auth warning: leaked-password protection disabled. Check plan availability before sensitive launch.
