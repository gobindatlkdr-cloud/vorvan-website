# VORVAN: vorvan.co.in — domain, website & departmental email rollout

Last reviewed: 28 October 2026. Domain reported purchased from **Domain India**. DNS control and email hosting have NOT yet been verified. Do not advertise any @vorvan.co.in address as active until an actual external mailbox test succeeds.

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

## Departmental emails — desired, NOT YET ACTIVE

`info@vorvan.co.in`
`partnerships@vorvan.co.in`
`support@vorvan.co.in`
`security@vorvan.co.in`
`admin@vorvan.co.in`

Option A: Zoho Mail's Forever Free custom-domain plan, if eligible for the account/data center. Documentation: https://www.zoho.com/mail/custom-domain-email.html . The user owns the domain; connect the existing domain in Zoho's Admin Console. After receiving exact provider-generated values:

1. Verify ownership by provider-specific TXT/CNAME.
2. Set MX records supplied by that **specific** Zoho region/account (avoid copying records from unrelated Zoho data centers).
3. Set one consolidated SPF TXT record appropriate for the outbound provider.
4. Enable DKIM signing and publish its selector record.
5. Publish DMARC, initially with monitoring and then tighten based on legitimate mail sources.
6. Create separate mailboxes or grouped aliases (free-plan limits/availability may vary). Require MFA for all actual mailbox users.
7. Perform independent inbound AND outbound email tests, including reply-to and SPF/DKIM/DMARC alignment checks.
8. Only then replace the temporary Gmail contact links on the public website with verified company email addresses.

Option B: Cloudflare Free Email Routing (inbound forwarding only, not normal arbitrary-recipient outbound sending). Requires Cloudflare DNS. The user's current Domain India nameservers must be checked, DNS records migrated carefully if changing nameservers. Info: https://developers.cloudflare.com/email-service/get-started/route-emails/

**Never** claim `@vorvan.co.in` mailboxes are live solely because the domain is registered. Free hosting may have quotas or regional restrictions; paid yearly domain renewal still applies.

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
