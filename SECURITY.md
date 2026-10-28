# Responsible security reporting — VORVAN website

If you notice a security vulnerability affecting this public company site, please **do not publish private details in a public issue**.

Please email `vorvan.pvt.ltd@gmail.com` with the page, issue summary and a safe proof of concept. Do not send customer identity documents or sensitive financial records.

## Security scope and limitations

This is a static informational website, currently hosted from a public GitHub repository. It has no login system, no customer database, no form submission endpoint, no live bureau or bank/NBFC integration, and no payment processor.

The HTML includes a restrictive **CSP delivered through a meta element**. This is defense-in-depth, **not** a substitute for HTTP security headers or an independent security assessment. GitHub Pages does not apply Cloudflare-style `_headers` settings to responses.

Security depends on the site owner's GitHub account permissions. Enable GitHub passkeys or two-factor authentication, review connected applications regularly, use least-privilege access, and never add tokens, API keys, PAN, Aadhaar, KYC scans, credentials or sensitive banking data to this repository.

Do not run active penetration tests, vulnerability scanners, or high-volume traffic against this website without authorization. We will assess reported issues reasonably; no response-time or vulnerability-free guarantee is made.

All financial-services product integrations require separate contractual, technical, privacy and regulatory review before activation.
