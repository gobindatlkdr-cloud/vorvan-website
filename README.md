# VORVAN — Official company website

**Public website:** https://vorvan.co.in/
**Source:** GitHub Pages, `main` branch, custom HTTPS domain.
**Business status:** **VORVAN PRIVATE LIMITED** is registered per the owner's confirmation of 10 November 2026. This repository does not publish or independently verify the COI/CIN/PAN. Registration does not imply any RBI lending licence, credit bureau access or lender/API agreement.

## Public navigation

- **Home:** overview and four **planned** loan categories (personal, business, education and short-term).
- **Loan Categories:** `solutions.html` — separate anchored category descriptions and a clearly fictional product demo.
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
