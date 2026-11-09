# VORVAN M0 / VOR-001 — Source Baseline & System Architecture Inventory

**Audit:** 09 November 2026 · **Repository:** `gobindatlkdr-cloud/vorvan-website` · **Baseline commit:** `d8456ffa0fad97b653f590e0cf02429bd6288cc3` (pre-VOR-001 changes)

## 1. Verified source identity, checks and release record

- **Baseline annotated tag:** `m0-baseline-20261109`, pinned to the full 40-character commit SHA above. GitHub Actions created and verified the annotated tag via successful [freeze run 42641757122](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42641757122) when the first post-merge `main` push contained `.github/workflows/m0-baseline-freeze.yml`, refuses any retarget, and performs a source-only recovery dry-run. Verify the resulting workflow, tag and target before calling tagging complete.
- **Previous pre-M0 fallback:** `rollback/20261109-pre-m0` at `e2426d24a7f6434ea7529bd3194fae0741141444`. This is an older source point, **not** a database backup.
- **Baseline GitHub checks:** static security [run 42639729906](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42639729906), live URL [run 42639729892](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42639729892), Pages [run 42639729625](https://github.com/gobindatlkdr-cloud/vorvan-website/actions/runs/42639729625): each `success` on the baseline SHA when audited.
- **Tag immutability distinction:** The commit content is identified immutably by SHA; an *annotated tag name* is a movable Git reference unless a repository tag ruleset or immutable-release protection prevents later modification. GitHub reported `main` as `protected=false`; tag protection is **not verified**. The automation never force-pushes or moves an existing tag. Verified 09 November 2026: GitHub repository rulesets list is empty; server-side tag immutability is NOT enforced. Enforce and verify a tag ruleset (tag pattern `m0-baseline-*`, restrict updates/deletion) before stating that the ref itself is immutable. Do not confuse a tag with Supabase recovery.

## 2. Web surfaces (from repository source tree)

| Surface | Real source entry points | Role and state |
|---|---|---|
| Corporate marketing and discovery | `index.html`, `solutions.html`, `about.html`, `contact.html`, `assets/refresh.css`, `assets/site.js` | Public static GitHub Pages; four **informational** loan categories: Personal, Business, Education, Short-Term |
| Institutional partnership | `partners.html`, `partner-desk.html`, `institutional-partnership-brief.html`, `lsp-api-integration.html`, `lender-api-readiness.html` | Direct LSP/lender API discussion only; no lender application or partner approval implied |
| Restricted institutional enquiry | `assets/institutional-inquiry.js`, `backend/institutional-inquiries/index.ts` | Public anti-abuse intake and server-side internal queue; user data must not enter open GitHub |
| Public Vyn assistant | `assets/assistant.js`, `backend/site-assistant/index.ts` | Scripted public FAQ; multilingual response with context-specific public contact; not customer-specific AI |
| Credit experience demonstration | `experience.html`, `assets/site.css` | Explicit fictional demonstration, **not** an authenticated or live bureau result |
| Staff Operations / Compliance | `admin.html`, `assets/admin.js`, `assets/admin.css`, `backend/admin-console/index.ts`, `backend/admin-mfa-recovery/index.ts` | Approved staff, server ACL and AAL2 MFA required; private URL is not public navigation |
| Company legal vault | `backend/compliance-vault/index.ts`, `backend/compliance-vault/body-limit.ts`, `backend/migrations/step12d_compliance_vault.sql` | Private company docs/checklist, AAL2/ACL-protected; 8 MiB, PDF/PNG/JPEG; actual owner E2E still pending |
| Private AI backend | `backend/ai-guidance/index.ts` | JWT protected; not a consumer production coaching entitlement |
| SEO / integrity / recovery | `sitemap.xml`, `robots.txt`, `.github/workflows/*.yml`, `scripts/check_site.py`, `scripts/test_*.cjs`, `backend/security/m0_vor004_exposure_assertions.sql` | Public crawl diagnostics, source CI, live endpoints, reproducible read-only permission checks |

Hosting: GitHub Pages from `main` serves `https://vorvan.co.in/`. GitHub Pages HTML/JS is not a suitable authorization boundary for customer financial data.

## 3. Backend and database — observed system

Supabase project `vorvan-dev-india` (`kukfpsqujlutlgwndplh`), verified during this step. **Seven active Edge Functions**:

| Deployed function | Version | verify_jwt | Source mapping / note |
|---|---:|---|---|
| `api` | 1 | false | **Source missing from current repository tree.** Do NOT redeploy, disable or assume reproducible until recovered from authorized project evidence. |
| `ai-guidance` | 2 | true | `backend/ai-guidance/index.ts` |
| `admin-console` | 4 | true | `backend/admin-console/index.ts` |
| `site-assistant` | 3 | false | `backend/site-assistant/index.ts` |
| `admin-mfa-recovery` | 2 | true | `backend/admin-mfa-recovery/index.ts` |
| `compliance-vault` | 4 | true | `backend/compliance-vault/index.ts` + bounded body reader |
| `institutional-inquiries` | 3 | false | `backend/institutional-inquiries/index.ts` |

`verify_jwt=false` alone does not imply unrestricted business functions; public endpoints must validate method/origin/input, rate-limit/anti-abuse, and deny protected reads. **Do not change any function's JWT mode as part of source rollback without a reviewed functional/security test.**

- 23 `public` tables observed; 23 with RLS enabled. Twelve customer/product-read SELECT policies and protected Admin/Compliance/Institutional data boundaries documented under VOR-004. 10/10 metadata guard assertions passed on 09 Nov 2026.
- Confirmed company documents checklist: 15 entries; company file records: 0 at audit. Vault bucket is private. Live customer credit-report/KYC/payment data is not established by these tables.
- The current repository contains the `step12d_compliance_vault.sql` migration, **not a full migration history reconstructing all 23 tables**. Reproducibility of the full deployed database from source is **not yet proven**.
- External identity, regulatory bureau, lender, payment and LSP services remain inactive pending agreements, security review and legal approval.
- Supabase leaked-password-protection WARN remains; 22 informational no-policy advisory notices are not proof of an exposure. Owner Auth MFA, role separation and vault file E2E are still pending.

## 4. Logical data flows and system boundaries

```text
Anonymous visitor -> GitHub Pages static pages -> public Vyn FAQ / restricted B2B enquiry endpoints
Approved staff    -> /admin.html -> Supabase Auth + AAL2 MFA + server ACL -> Admin API / Company Vault
Future customer   -> isolated auth + consent (M1 not built) -> readiness/plan (not live)
Future lender     -> verified invite + signed agreement (M4 gated) -> tenant-scoped API (not live)
```

No browser/mobile bundle should contain service-role credentials, authenticated partner access must never be inferred from UI visibility, and the public website must not collect real customer bureau data. Incorporation is **pending**, MCA fee paid; no COI/CIN or actual loan/KYC/payment services are authorised.

## 5. Change control, dependencies and known gaps

- Reviews: `.github/workflows/static-security.yml`, `.github/workflows/live-http-check.yml`, `.github/workflows/seo-sitemap-audit.yml`; the baseline checks above are specifically bound to commit SHA, not an unsupported future release claim.
- No package manager build of the static Pages frontend is required; Node source tests and Deno v2 checks run in CI. Backend deploy is separate from GitHub Pages and must be explicitly verified.
- Two superseded open design PRs (#10/#11) existed in the repository at previous audit; merging them blindly would risk replacing the newer UX.
- **Open VOR-001 production controls:** protected tag ruleset / immutable-release setting not verified; dedicated staging environment and actual live rollback rehearsal not completed; `api` function source and full DB schema recreation/backup-restore procedure absent. These stay in the cumulative pending ledger.
- Full recovery procedure and independent, non-destructive test: [`M0_VOR001_ROLLBACK_RUNBOOK.md`](M0_VOR001_ROLLBACK_RUNBOOK.md).
- Machine-readable SHA + CI evidence: [`M0_VOR001_BASELINE_MANIFEST.json`](M0_VOR001_BASELINE_MANIFEST.json).
