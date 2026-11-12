# VORVAN — Official company website

**Public website:** https://vorvan.co.in/
**Source:** GitHub Pages, `main` branch, custom HTTPS domain.
**Business status:** **VORVAN PRIVATE LIMITED** is registered per the owner's confirmation of 10 November 2026. Homepage and all dynamic Readiness Passport language variants must consistently show this status. This repository does not publish or independently verify the COI/CIN/PAN. Registration does not imply any RBI lending licence, credit bureau access or lender/API agreement.

## Public navigation

- **Home:** overview and four **planned** loan categories (personal, business, education and short-term).
- **Loan Categories:** `solutions.html` — separate anchored category descriptions and a clearly fictional product demo.
- **Public educational demos:** homepage `#product-previews` links to `experience.html` (fictional credit awareness), `readiness-passport.html` (trilingual fixed-choice learning), and `vyn-coach-sandbox.html` (offline educational guidance). These are live static pages only; no CIBIL, loan, KYC, billing or customer consent services are activated.
- **Partner With Us:** `partners.html` — formal direct LSP/lender API discussion for verified banks and NBFCs only, with its existing institutional enquiry form.
- **About / Contact:** general company information and website support.

**Contact routing:** company information → `info@vorvan.co.in`; support → `support@vorvan.co.in`; institutional page → `partnerships@vorvan.co.in`; legal documents → `legal@vorvan.co.in`. Private admin mailbox `admin@vorvan.co.in` must not appear on public pages. Secure staff login remains privately accessible at `/admin.html`, with server-approved ACL and MFA.

## Security and deployment

- CI in `.github/workflows/static-security.yml` tests local links, first-party scripts, MFA, protected Company Vault and public page consistency.
- Deployment: merge approved and tested changes into `main`; verify that the custom domain serves the latest HTML and CSS.
- Do not commit keys, passwords, secret project files, borrower data or OTPs to this public repository.
- Supabase project `vorvan-dev-india` hosts secured backend; never change the public information site into a live lending service just by enabling a UI control.
- Owner-authenticated vault upload/download and audit logging require real MFA smoke testing before upload of sensitive company files.

## Critical regulatory guardrails

VORVAN is **not** a bank, NBFC, currently approved LSP, licensed credit bureau or lender. Customer account opening, bureau reports, KYC, loan applications, disbursement and payment processing are **not live**. No lender rates, eligibility decisions, approval claims or customer data collection is implied by the four educational categories.

The reference website for the November 2026 refresh was Credila, for navigation architecture and content hierarchy only; no third-party art, copy, styles, code or trademarks were reused.

## Operations

Public partnership queries use the separate bank/NBFC institutional route. Staff perform normal admin work through approved access controls. Before any regulated financial feature is activated, independently verify incorporation documents and obtain all applicable lender/API, privacy, security, legal and owner approvals through separately reviewed changes and testing.

## Applicant Login, secure data and support scope (12 November 2026)

- `/customer.html` now displays **Applicant Login / Kindly Login** and a +91 mobile-number-only entry screen. The previous email-magic-link instruction has been superseded. The Supabase phone OTP request/verify and verified-phone profile code exists, but **real SMS sign-in is disabled** by `SMS_PROVIDER_READY=false` until an Indian DLT-compliant SMS sender/provider, owner approval, actual delivery tests and privacy/security gates are complete. **Do not enable the flag on permission alone.**
- The original burgundy `/applicant-form-preview.html` shows a **read-only, synthetic-only** representation of the after-OTP personal/work form. It has no submit control and cannot capture records. It is not in public navigation or the sitemap.
- Applicant fields, if a genuinely verified applicant later consents and submits, are designed for existing RLS-protected Supabase `public.vorvan_customer_intake_profiles`, with separate nonbinding enquiries in `public.vorvan_customer_enquiries`. Owner-only Admin `/admin.html` requires server-authorized AAL2 MFA. No applicant profiles or enquiries were present at the latest read-only audit.
- The 3/6-month CIBIL Guide, 30/60/90 educational activities and sample scores are fictional learning features only. No real bureau pull, lender offer, subscription, KYC, loan application, disbursal or payment is active.
- Support & Complaints VOR-013 is a verified merged **synthetic Admin-only lifecycle sandbox**, not a live customer grievance intake or enforceable SLA. Real complaint audit, regulated escalation/retention and genuine role E2E still need independent approval and testing.

For activation and owner access see `docs/REAL_SMS_OTP_ACTIVATION_AND_APPLICANT_DATA_ACCESS_20261112.md`, `docs/APPLICANT_MOBILE_OTP_FORM_RELEASE_20261112.md`, and `docs/M2_VOR013_SUPPORT_COMPLAINTS_LIFECYCLE_20261111.md`.

