# VORVAN SEO Phase 5 — Sitemap Crawl Diagnostic (04 November 2026)

## Why this check exists
Google Search Console previously displayed **Couldn't fetch** for the submitted
`https://vorvan.co.in/sitemap.xml`, although a live URL inspection previously said
the sitemap URL was available to Google. Google treats the sitemap processing
report separately from URL inspection. Do not claim that either one guarantees
the other, or that manual indexing requests guarantee ranking.

## Audited public URLs
The sitemap currently lists 11 canonical public pages. `admin.html` and
`404.html` are excluded from the sitemap and marked noindex.

## How to run
GitHub Actions > **Read-only sitemap and Googlebot-style crawl diagnostic** >
**Run workflow**. The workflow also runs on changes to the listed public
SEO pages, sitemap, robots.txt or diagnostic files in `main`.

The script:
- requests robots.txt and verifies an exact sitemap declaration;
- checks that robots.txt allows public URLs and the sitemap;
- fetches the XML sitemap with standard and **Googlebot-style user-agent**
  headers, verifies XML syntax and checks all 11 expected canonical URLs;
- checks that all listed pages return HTTP 200 at the canonical address, have
  their own canonical metadata and are not marked noindex;
- reports HTTP status, final response URL, content type and observed issues
  in GitHub Actions logs.

## Limitations
1. A Googlebot **user-agent string is not verified Googlebot IP access**.
2. Passing GitHub Actions tests does **not** prove Google's sitemap ingestion,
   URL indexing or search ranking. These must be checked in the Search Console.
3. The Windsor.ai connector is associated with the URL-prefix property
   `https://vorvan.co.in/`, but its 7-day, 28-day and sitemap reports returned
   zero **rows**, which does not mean zero search traffic.
4. The audit makes no DNS, hosting, authentication, payment, data, mail or
   Google Search Console changes.

## Next owner-side verification
Go to Google Search Console > `https://vorvan.co.in/` property:
1. Open Indexing > Sitemaps > submitted `sitemap.xml`, and record **Status**,
   **Last read** and any detailed error.
2. If the status remains **Couldn't fetch**, run URL Inspection on the exact
   sitemap URL > **Test Live URL** and expand **Page availability**. Check
   **Crawl allowed? Yes** and **Page fetch: Successful**.
3. Check Security & Manual Actions > **Manual actions** for any unresolved
   issue before changing sitemap files.
4. If the live test succeeds and the GitHub audit passes, keep the same sitemap,
   allow Google processing time and avoid repeatedly submitting unchanged XML.
   If a definite Google fetch error appears, investigate the specific response.
5. For user-noted remaining URLs: `experience.html`, `contact.html`,
   `privacy.html`, `terms.html`, inspect their indexing status individually
   when quota is available. They remain public and crawlable independently of
   manual Request Indexing.
