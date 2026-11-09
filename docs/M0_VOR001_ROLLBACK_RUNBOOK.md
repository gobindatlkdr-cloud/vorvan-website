# VORVAN M0 / VOR-001 — Safe Rollback and Recovery Runbook

**Scope:** GitHub Pages corporate website, Supabase Edge Functions and private data; **not** a tested full disaster-recovery guarantee. Owner and approved engineer only. Never share passwords, OTPs or service-role keys.

## A. Before any release

1. Identify the exact stable SHA from `docs/M0_VOR001_BASELINE_MANIFEST.json`: `d8456ffa0fad97b653f590e0cf02429bd6288cc3`. Check the annotated `m0-baseline-20261109` tag, when available, resolves to this exact SHA.
2. Verify the latest `main` GitHub Actions static-security, live URL and Pages runs are green and source diff is reviewed.
3. Log incident/release owner, time, touched modules, scope, expected rollback behaviour and rollback acceptance criteria. Keep secrets only in approved secret managers.
4. Before **database migrations**, make a verified backup and a **restore-tested** plan consistent with current Supabase plan/features. As of 09 Nov 2026, no production restore-tested database backup is evidenced. **Do not assume PITR exists.**
5. Never change company incorporation status, financial service gates, domain/Zoho DNS, MFA rules or partner permissions as part of an unrelated visual rollback.

## B. Frontend rollback (reviewed and reversible)

**Preferred:** Open a GitHub *Revert* pull request for the specific faulty squash-merge commit(s). Review resulting source diff, run CI, merge to `main`, then verify `https://vorvan.co.in/` and critical routes after GitHub Pages finishes. This preserves `main` history and later good changes.

**Alternative for major recovery:** Create a new recovery branch from the baseline tag/SHA and compare it with current `main`. Cherry-pick necessary fixes, submit a reviewable PR. Never run `git push --force` or `git reset --hard` against production `main`.

A **local isolated** recovery dry-run is automated by the baseline tag workflow: `git worktree add --detach <temporary-worktree> <pinned-sha>`, verify expected files and SHA, remove the worktree. This tests that source can be checked out; it **does not** deploy a rollback or prove live recovery.

## C. Edge Function rollback (separate from Pages)

1. Identify exact function name, deployed version and code from a previously validated repository SHA. Do not assume changing `main` automatically reverts Supabase functions.
2. For `compliance-vault`, `admin-console`, `admin-mfa-recovery` and `ai-guidance`: retain `verify_jwt=true`, server ACL, AAL2 for privileged routes and private storage. Verify unauthenticated `401` after any redeployment.
3. For public `site-assistant` and `institutional-inquiries`, preserve origin/method/size/anti-abuse controls, ensure internal Admin contact is never returned and never grant protected data reads.
4. The deployed `api` function **has no counterpart in the repository** and cannot be safely redeployed from this source snapshot. Recover authoritative source or verified deployment artifact first.
5. Redeploy **only** the selected function, run synthetic or read-only tests, record version, JWT configuration and results. If identity or server-side authorization is uncertain, **stop** rather than disable checks.

## D. Database rollback

- The current repository does **not** have proven full migration history for all public tables, and a Git tag does not include Supabase Postgres or Storage contents.
- Use a reviewed additive/fix-forward migration by default. For a harmful migration, identify dependent records and secure backup state; obtain owner approval before destructive restoration, deletion or a point-in-time rollback.
- Restore to a **separate environment first**, compare tables/RLS/GRANTs and verify application flows with synthetic data. Only after independent evidence and explicit owner authorization consider a production restore.
- Re-run `backend/security/m0_vor004_exposure_assertions.sql` and Supabase advisors; do not add permissive policies to bypass errors.

## E. Release/rollback verification

1. `https://vorvan.co.in/` + `solutions.html`, `partners.html`, `contact.html`, `privacy.html` respond, display the four informational loan categories, correct contextual emails and pre-incorporation disclaimer.
2. Public navigation does **not** expose Staff Administration. `/admin.html` remains login/MFA restricted; unauthenticated protected Edge Functions reject access.
3. Vyn's public replies in Bengali/English/Hindi do not expose internal Admin mailboxes or claim live lender products.
4. Institutional enquiry remains safe and no live credit-bureau, KYC, payment or loan application is enabled.
5. Record deployment run links, check logs, functional evidence, diff/revert commit, owner decision and any unresolved defects.

## F. Recovery status

**Implemented:** pinned baseline SHA, annotated tagging workflow, isolated source checkout rehearsal, architecture inventory and this runbook.

**Still unverified:** tag deletion/update prevention at repository ruleset level; production/staging rollback deployment rehearsal; Supabase database backup/restore; the missing deployed `api` source. Do not assert full VOR-001 disaster-recovery acceptance until these are completed.
