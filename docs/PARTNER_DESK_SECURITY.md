# VORVAN Partner Desk — security & operational status

Published page: `/partner-desk.html`.

### Public access
Any visitor can view this informational page. It is not an authenticated or RBI-verified bank/NBFC portal. The only active communication actions are `mailto:` links to `vorvan.pvt.ltd@gmail.com`.

### Customer and institutional controls
The visible customer request, bureau pull, KYC, lender sandbox, partner onboarding and production AI controls are HTML `disabled` and `aria-disabled`. These should not be considered a security barrier by themselves. Server-side feature gates are explicitly set to `false` and no loan or bureau API is implemented on this page.

### Don't email customer information
Emails must not include Aadhaar, PAN, OTPs, passwords, bank statements, bureau files, customer loan records or other sensitive financial data.

### Future verified partner-only access
A bank / NBFC verification process with institution identity, authorised contact evidence, signed formal agreement, separate tenant-scoped roles, least privilege, audit logging, revocation, data residency review and consent controls is required before enabling customer-specific requests. Nothing is automatically activated by a contact email.

Regulatory and legal terms/privacy disclosures require review before any real customer financial service is launched.
