# VORVAN Burgundy brand rollout (8 November 2026)

## Scope
The original website and its protected admin + institutional partner pages remain in the SAME repository. Only a shared **presentation** stylesheet `assets/brand.css` and stylesheet links were added. No API, auth, MFA, Supabase, RLS, payment, loan, legal or content-state code was changed.

## Canonical color tokens
| Token | Hex |
| --- | --- |
| Primary | `#800020` |
| Dark Burgundy | `#5A1028` |
| Hover | `#650019` |
| Soft background | `#F7E9EE` |
| White | `#FFFFFF` |
| Text | `#1F2937` |
| Secondary text | `#6B7280` |

The website's current branded V wordmark styling uses other Burgundy variants and the legacy favicon SVG retains an older blue/teal design. **The official logo asset has not been replaced or re-colored** because an authoritative logo-file color match was not verified. Obtain owner approval of the source logo before changing logos, icons, or any image.

## Integration
All root website HTML pages load `assets/brand.css?v=20261108-burgundy` **after** existing CSS. Keep the file last in the cascade; do not reintroduce per-page brand overrides. Existing `assets/refresh.css` still owns approved small Vyn and 11-second clockwise home-antenna motion. The original `assets/assistant.js` and Vyn reference image remain unchanged.

## Verification
Run:
```sh
node scripts/test_brand_theme.cjs
python3 scripts/check_site.py
node scripts/test_home_vyn.cjs
node scripts/test_bian.cjs
node scripts/test_mfa_qr.cjs
node scripts/test_company_vault.cjs
```
CI performs these checks automatically in a PR. Also visually inspect Home, About, login/MFA, authenticated Admin, Bank/NBFC Partner Desk, mobile navigation, Vyn popup, and each legal page. Verify tab and keyboard focus, color contrast, error/success states, and reduced-motion behavior. The static tests do **not** certify visual correctness or production security.

## Future secure admin editor — deliberately not enabled
A real **Settings → Branding & Appearance** feature must use privileged, MFA-confirmed server authorization, input validation, file type/size validation, safe asset storage, audit history, rollback, controlled publishing, cache invalidation and a shared read-only configuration endpoint consumed by the borrower app and other portals. It must not be simulated with localStorage or unauthenticated write APIs. This PR does not add that feature, modify the database, or imply remote logo/theme propagation.

## Safe release and backup
1. Review and pass all PR checks and manual browser QA.
2. Merge only after approval. Keep the old main commit/tag for rollback.
3. Export a complete Git repository archive (source and documentation only) using the reviewed commit SHA, without private keys or live tokens.
4. Back up any separate production Supabase data and assets with authorized controls. A Git archive is **not** a database or secret backup.
5. Never publish customer information, API keys, tokens, or MFA backup material in public backups.

Pre-incorporation disclosures and staged product/loan/payment statuses remain unchanged.
