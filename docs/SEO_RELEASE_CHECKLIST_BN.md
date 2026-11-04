# VORVAN — Search Console ও B2B SEO Release Checklist (04 Nov 2026)

## বাস্তব SEO changes
- Homepage-এ WebSite microdata দিয়ে VORVAN site name declared; existing strict CSP বজায় আছে (কোনো inline executable JavaScript যোগ করা হয়নি)।
- Public pages: self-referencing canonical URL, page-specific title/description, Open Graph URL/site name, Twitter summary card।
- নতুন public information page: /lsp-api-integration.html, banks এবং RBI-regulated NBFC-দের জন্য direct LSP/API discussion guide।
- Homepage, partnerships, partner desk, solutions থেকে HTML anchor links।
- sitemap.xml-এ canonical public URLs; lastmod শুধুমাত্র প্রকৃত 04 Nov edits অনুযায়ী; robots.txt sitemap URL অপরিবর্তিত।
- Admin ও 404 pages noindex।
- Corporate state: pre-incorporation; no CIN, RBI licence, executed partner integration, live credit pull, live loan application claims।

## Owner-initiated Search Console actions
1. Property https://vorvan.co.in/ নির্বাচন করুন।
2. Indexing > Sitemaps-এ আগের /sitemap.xml submission status দেখুন। "Couldn't fetch" থাকলে নতুন করে বারবার resubmit নয়; 24–48 ঘণ্টা পরে পুনরায় দেখুন। Last read এবং specific error note করুন।
3. URL Inspection-এ https://vorvan.co.in/lsp-api-integration.html পরীক্ষা করুন; new page live test successful হলে Request indexing করা যায়। Google's crawl/indexing schedule এবং ranking নিশ্চিত নয়।
4. Homepage ও https://vorvan.co.in/partners.html ইতিমধ্যে user-verified indexed; পুনরায় অনাবশ্যক request নয়।
5. Performance > Search results-এ keyword impressions/clicks 2–4 সপ্তাহ পর্যবেক্ষণ করুন; নতুন property-তে তাৎক্ষণিক data নাও থাকতে পারে।

## Intended B2B search queries (research targets, not ranking claims)
- direct LSP partnership India
- bank NBFC lending API integration
- NBFC API sandbox collaboration
- fintech lender technology partnership
- regulated lender digital integration

## Release tests
- scripts/check_site.py validates canonical/link integrity, public sitemap list, 404/admin noindex, first-party assets and strict CSP.
- GitHub Actions live-http-check validates published integration guide, sitemap, homepage canonical and link.
- Verify public links still route to institutional inquiry and mailbox.
- Never add customer data to public form or claim active lender relationships.
- Post-incorporation, corporate status must be updated **only** after official Certificate of Incorporation evidence and legal review.

## Limitations
- WebSite microdata expresses a preferred site name; Google determines displayed site name.
- A sitemap is a discovery hint, not guaranteed indexing or ranking.
- Google Search Console "Couldn't fetch" may be a separate fetch-report issue despite successful URL Inspection; no final resolution is claimed.
- Marketing targeting requires genuine institutional partner distribution and consent-based contact; SEO alone cannot confine visitors to verified financial institutions.
