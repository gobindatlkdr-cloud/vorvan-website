# VORVAN Public Website Registered-Company & Sandbox Publication

**Date:** 11 November 2026  
**Scope:** Existing GitHub Pages company website and static educational demonstrations.  
**Company:** VORVAN PRIVATE LIMITED is **registered per owner's confirmation**; no CIN, PAN or COI is disclosed or independently verified in this public repository.

## Changes delivered for this release

- Remove the contradictory **"A proposed fintech initiative"** from the public homepage footer's organization description. Show "VORVAN PRIVATE LIMITED · REGISTERED COMPANY" in the homepage utility header, and retain the explicit registered-company footer.
- Correct the dynamic **Readiness Passport** labels, disclaimer and footer in **English, Bengali and Hindi**. Previously, the static HTML said registered while its JavaScript overwrote it with "pre-incorporation" / "registration pending". Change all six rendered strings, keeping the original financial-service safety notices.
- Update **Admin document-vault** messages to distinguish owner-confirmed registration from **unverified COI/company documents**. The original backend **incorporation_required** approval lock, protected storage and AAL2/ACL checks remain in force. No admin-side data or company registration status is falsely marked verified.
- Add a visible **Explore Demos** section on the public homepage with direct links to the pre-existing safe **Credit Awareness Demo**, **Readiness Passport** and **Vyn Educational Coach**. The Admin console is **not advertised on public pages**; its support, complaints, governance, privacy, subscription/payment and lender/bureau mock modules stay behind internal URL access, MFA and role restrictions.
- Make the already deployed pages easier to find without enabling actual loans, bureau queries, banking integrations, AI underwriting, live subscriptions, payments, real KYC or storage of customer financial data.
- Add query-versioned Admin and Readiness JavaScript references to avoid reusing an outdated browser-cached copy, and refresh homepage stylesheet version.
- Add mandatory `scripts/test_registered_company_publication.cjs` to CI plus a **post-merge live domain** check for published homepage content, all three educational demo routes, and current three-language dynamic JS notices. The live test also asserts original vault gating and no stale text.

## Release boundaries

1. **Safe public educational demonstrations** are available to everyone; explicitly fictional and browser-only.
2. **Existing live institutional enquiry and informational website/contact forms** retain their current permissions and validations; no change to live APIs, email routing, Supabase migrations, MFA enforcement or lender offers.
3. **Privileged staff demo panels** remain accessible only after successful server-backed company Admin login, AAL2 MFA and approved role. Client fixtures do not become real data processing.
4. **Production financial services remain disabled** pending verified direct lender/bureau contracts, provider credentials, customer consent and identity, server-enforced RLS, DPDP/legal review, independent VAPT and Owner sign-off.
5. The company is registered according to owner confirmation, but this change does **not** upload or verify the MCA Certificate of Incorporation inside the private compliance vault. A company-document approval lock must not be bypassed.

## Verification and rollback

**Verified publication evidence:** [Release PR #49](https://github.com/gobindatlkdr-cloud/vorvan-website/pull/49) merged into `main` at SHA `403dabe1e176648e05627f3a127a9cb5cd0dbfe9`. Source-head [Static Security PR run #43068754984](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43068754984) SUCCESS; [Live Website PR #43068754903](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43068754903) SUCCESS. **Post-merge production checks:** [GitHub Pages deployment #43068923603](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43068923603) SUCCESS; [Live Domain #43068923732](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43068923732) SUCCESS, including the new push-only check of homepage Explore Demos, updated registered-company HTML, Bengali/English/Hindi dynamic Readiness text, absence of outdated incorporation labels, and preserved Admin vault lock; [Static Security and isolated PostgreSQL RLS #43068924015](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43068924015) SUCCESS; [read-only sitemap / crawler diagnostic #43068923790](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/43068923790) SUCCESS. These checks verify safe public static content, **not** live customer finance or a registered COI document inside the private vault.

**Rollback:** revert the scoped PR if public site regression occurs. No database migrations, financial records, customer data, funds, or live integrations are touched.

**No cumulative milestone reclassification:** this is a publication/content consistency release; previous ticket statuses and remaining release gates remain unchanged.
