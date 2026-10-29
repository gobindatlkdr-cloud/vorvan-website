# VORVAN: vorvan.co.in — domain, website & departmental email rollout

Last reviewed: 29 October 2026. Domain purchased from **Domain India**. **Zoho mail confirmed by user**: SPF and DKIM verified, Gmail SPF/DKIM/DMARC PASS, MFA tested for users, and inbound/outbound and Info-alias delivery tested. GitHub Pages custom-domain DNS/HTTPS status is **not yet confirmed**. Keep website DNS changes separate from working email records.

## Ownership and registrar

- Sign in to Domain India client area: https://domainindia.com/client/domains
- Open **Domains > My domains > vorvan.co.in > Manage**.
- Check whether registration is **Active**, .IN eKYC is complete, the **expiry/renewal** date, transfer lock **on**, and which nameservers actually serve the domain.
- Do not click **Switch to Free DNS** or replace nameservers blindly. It can disable all existing A/MX/TXT records. See https://domainindia.com/support/kb/view-manage-domains
- Set up a calendar reminder for domain renewal. The paid domain renewal is independent from free web/email hosting.

## Website at https://vorvan.co.in (NOT YET CONNECTED)

GitHub Pages repository: `gobindatlkdr-cloud/vorvan-website`. The verified working URL is `https://gobindatlkdr-cloud.github.io/vorvan-website/`.

Only AFTER determining the authoritative DNS provider:
- Create four root A records (record `@`): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- `www` CNAME to `gobindatlkdr-cloud.github.io` (some DNS providers require the trailing dot).
- Do not overwrite existing MX, TXT, SPF, DKIM or DMARC records.
- Verify DNS externally and enter `vorvan.co.in` under GitHub repo Settings > Pages > Custom domain. GitHub Pages then creates a `CNAME` file.
- Enable **Enforce HTTPS** only when GitHub has issued the certificate. Test the root and www addresses for HTTPS and correct site content, plus Gmail/SMTP deliveries.
- Do not add a `CNAME` file prematurely; the earlier `vorvan.o` configuration made the old GitHub Pages URL redirect to an unusable domain.

## Departmental emails — active (user-verified, 29 October 2026)

- `admin@vorvan.co.in` — Zoho mailbox
- `partnerships@vorvan.co.in` — Zoho mailbox, direct Bank/NBFC LSP/API outreach
- `support@vorvan.co.in` — Zoho mailbox
- `legal@vorvan.co.in` — Zoho mailbox
- `info@vorvan.co.in` — alias routed to Admin inbox

User reports SPF Verified, DKIM Verified and enabled, DMARC verified, Gmail headers showing SPF/DKIM/DMARC PASS, each mail user's MFA login tested, Info alias outgoing and incoming tests successful, and domain expiry/DNS backup reviewed. This reflects the user's completed tests, not a fresh independent network verification by the model.

Never create a separate `security@vorvan.co.in` mailbox or claim it active until the company explicitly does so. Direct legal/security correspondence to `legal@vorvan.co.in`.

**Important:** Do not change the current Zoho MX/SPF/DKIM/DMARC records while connecting the WEBSITE. Website A/CNAME records and Zoho email records have separate purposes.

If later moving email provider, preserve the existing addresses by migrating mailboxes/aliases and the matching MX/DKIM/SPF/DMARC configuration under your owned `vorvan.co.in` domain.

## Separate secure Admin Control Center

Published route: `https://gobindatlkdr-cloud.github.io/vorvan-website/admin.html` — **not** an automatically private page. Security depends entirely on authenticated backend authorization.

- First-time setup uses verified company email `vorvan.pvt.ltd@gmail.com`; no admin Supabase Auth user was present when this panel was created.
- Supabase Auth account must be confirmed by email; then enable authenticator-app TOTP MFA.
- Admin Edge Function rejects all data access without a valid verified user, an admin allowlist entry and Auth JWT `aal2`.
- Admin work items and logs live in RLS-enabled tables and are not directly granted to anonymous or authenticated PostgREST clients.
- Admin UI includes nine sections: Overview, Partners, AI, Customer Ops, Support, Security, Website, Email, Compliance.
- Only work-item management and operational overviews are enabled. Sensitive production actions (loans, CIBIL, KYC, payments, real AI) remain disabled and cannot be enabled by flipping a UI switch.
- Static GitHub Page stores a public Supabase publishable key, **never** a service-role key or password. Passwords and MFA secret material are handled only in the browser and Supabase Auth. No browser localStorage token persistence.
- Before real financial-data use, obtain independent application threat modelling, penetration testing and appropriate approvals.

## Current deployment scopes

- Frontend static website: GitHub Pages.
- Backend and data: Supabase `vorvan-dev-india`, `ap-south-1`.
- Partner enquiry: existing company Gmail only; no mail server or CRM synchronization to the admin console.
- Website domain: `vorvan.co.in` domain purchased but DNS link not verified.
