# VORVAN Website — Go-Live & Admin Operations Playbook
**Date:** 29 October 2026 | **Base:** Cooch Behar, West Bengal, India

## Verified current state
- **Approved design and active free hosting:** https://gobindatlkdr-cloud.github.io/vorvan-website/
- **Public Bank/NBFC partner desk:** https://gobindatlkdr-cloud.github.io/vorvan-website/partner-desk.html
- **Separate Admin interface:** https://gobindatlkdr-cloud.github.io/vorvan-website/admin.html
- **Supabase project:** `kukfpsqujlutlgwndplh`, `ap-south-1`.
- **GitHub Pages deployment and static/live checks:** passing.
- **Paid domain purchased:** `vorvan.co.in`.
- **Public DNS audit (2026-10-29):** authoritative nameservers `a.ns.domainindia.net`, `b.ns.domainindia.net`; no apex website A records; no `www` CNAME; Zoho MX remains at `mx.zoho.in`, `mx2.zoho.in`, `mx3.zoho.in`; DMARC and other TXT records present. `https://vorvan.co.in` was not resolving. Audit: https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/40911496414
- **Do not modify/replace** NS, MX, SPF, DKIM, DMARC, Zoho aliases or mailboxes as part of website setup.
- **Separate Admin Auth:** only `admin@vorvan.co.in` is enabled in server-side allowlist; no Supabase Auth user registered at last check.

## 1. Domain India: Website DNS only (current next step)

With the DNS provider remaining Domain India (as independently checked), sign in to the existing Domain India client account, go to **Domains > My Domains > vorvan.co.in > Manage > DNS Management / Manage DNS Records** (the exact menu depends on provider UI).

Inspect existing `@` A/AAAA/ALIAS records and `www` records first. Add the following **only if there is no conflicting existing website record**.

| Type | Host / Name | Value / Target | TTL |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | default |
| A | @ | 185.199.109.153 | default |
| A | @ | 185.199.110.153 | default |
| A | @ | 185.199.111.153 | default |
| CNAME | www | gobindatlkdr-cloud.github.io | default |

This leaves Zoho MX/TXT records unchanged. If an existing conflicting A/AAAA/CNAME record is present, inspect it before editing; do **not** delete other website/hosting records blindly.

**GitHub reference:** https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

**Domain India guide:** https://domainindia.com/support/kb/manage-dns-records

## 2. Read-only verification (done by assistant on request)
After records are saved, re-run the read-only workflow under GitHub Actions:
https://github.com/gobindatlkdr-cloud/vorvan-website/actions/workflows/domain-readiness.yml

Pass criteria:
- apex A = all four expected GitHub Pages addresses (or a supported ALIAS/ANAME configuration),
- `www` CNAME = `gobindatlkdr-cloud.github.io`,
- Zoho MX and TXT records remain unchanged,
- DNS cache has propagated.

**Do not set a premature GitHub Pages CNAME file or custom domain; it could redirect the working `github.io` site before the new domain resolves.**

## 3. Connect and verify GitHub Pages custom domain
Only after website DNS resolves, open
https://github.com/gobindatlkdr-cloud/vorvan-website/settings/pages

- Confirm publishing: `Deploy from a branch`, `main`, `/(root)`.
- Enter `vorvan.co.in` under **Custom domain** and Save.
- Wait for GitHub domain check and managed TLS certificate issuance. Select **Enforce HTTPS** when enabled.
- Open both https://vorvan.co.in and https://www.vorvan.co.in and confirm the site, links, assets, partner emails, Terms and Privacy.
- Verify that requests go to VORVAN only, not a stale domain or unrelated site.
- Recheck that `admin@vorvan.co.in` and `partnerships@vorvan.co.in` can send and receive Zoho emails.

If domain is not ready, retain working GitHub Pages URL rather than interrupt service.

## 4. First-time secure Admin login
- Open https://gobindatlkdr-cloud.github.io/vorvan-website/admin.html (later adapt to custom domain).
- Expand **First-time setup** and register only `admin@vorvan.co.in`.
- Use a unique password; **never send any password, verification link, OTP or MFA backup code in chat**.
- Verify Supabase authentication confirmation email in Zoho Admin inbox.
- Log in and enroll an authenticator-app TOTP factor (MFA). AAL2 is mandatory for Admin API access.
- Verify Overview, Partner tracker, Support tracker, Audit and Tasks.
- If sign-in or confirmation fails, check Supabase Auth settings and request-specific errors **without posting secrets**.
- The Admin HTML is publicly viewable but private data is restricted by server-side roles, verified email, MFA and RLS.

**Important:** This first login has not yet been completed or tested with the actual owner account.

## 5. How partnership enquiries work TODAY
1. A bank/NBFC visits **Partnerships** or **Partner Desk**.
2. The `mailto:` button opens that institution's email client, addressed to `partnerships@vorvan.co.in`.
3. The email arrives in the **Zoho Partnerships mailbox** (subject to the institution actually sending and Zoho deliverability).
4. Admin/authorised personnel review and reply using Zoho Mail.
5. After verification, manually open the secured Admin Panel -> **Bank/NBFC Partners**, record **organisation name**, `bank`/`nbfc`, direct `LSP`/`API` stage, and progress through `research`, `contacted`, `meeting`, `due_diligence`, `contracting`, `onboarded` or `paused`.
6. Do not record borrowers' identity or financial data in internal tracker notes.

**Critical:** The public website does **not** automatically send the email to the Admin Dashboard. There is no Zoho-to-Supabase integration, no self-service booking and no customer request form. A sent email appears in Zoho, not automatically in the Admin Pipeline.

## 6. How support requests work TODAY
1. Public Contact -> `support@vorvan.co.in`; legal/security matters -> `legal@vorvan.co.in`.
2. The appropriate Zoho mailbox receives the email.
3. Admin staff read, reply and investigate in Zoho.
4. Record a **non-sensitive** summary in Admin Panel -> **Support & Grievances**; assign `open`, `in_progress`, or `closed`.
5. Mail delivery and response status in Zoho must be checked separately. The Admin tracker is manual today.

## 7. Live assistant and AI limitations
- Public **Ask VORVAN**: live, free-tier hosted, **rules-based FAQ**, multilingual; not an external generative LLM.
- It answers site / direct LSP / API / sandbox / basic compliance / support queries. It does not notify Admin of messages and is not an inbox.
- Internal `ai-guidance` is an authenticated **fictional-data demonstration**, not a real credit-scoring decision engine.
- Customer login, KYC, bureau pulls, loan requests, lender integration, payments and production AI remain disabled until required contracts, security and legal approvals.

## 8. Security and operations checklist
- Protect registrar, Zoho, GitHub and Supabase accounts with unique passwords and MFA.
- Enable GitHub account 2FA/passkey and verify repository access is limited to authorised maintainers.
- Keep GitHub Pages static: never put Supabase **secret / service_role** keys, Zoho passwords or API credentials in HTML/CSS/JS.
- Publicise only verified corporate mailboxes; no `security@` mailbox is claimed active.
- Check GitHub Actions deployment and static security workflows after code changes.
- Review Supabase security advisers and operational audit.
- Confirm legal review of Terms/Privacy before marketing real lending features.
- Put renewal reminder for paid `vorvan.co.in` domain; free hosting is subject to GitHub/Supabase quotas.
- Do not guarantee against downtime, misuse, provider logging or all security threats.
- Review content before changing customer-facing disclaimers.
