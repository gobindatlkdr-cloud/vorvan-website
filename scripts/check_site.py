#!/usr/bin/env python3
"""Minimal dependency-free checks for VORVAN's static corporate website.

This is a regression guard, not a penetration test or vulnerability scanner.
"""
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
# Search Console verification tokens are plain text files with .html extension.
# Exclude only the exact verified token file, not arbitrary HTML uploads.
VERIFICATION_FILE = ROOT / "google7decf5ca6ffe0331.html"
if not VERIFICATION_FILE.is_file() or VERIFICATION_FILE.read_bytes() != b"google-site-verification: google7decf5ca6ffe0331.html":
    raise SystemExit("ERROR: Google site verification file is missing or modified")
PAGES = sorted(p for p in ROOT.glob("*.html") if p.name != VERIFICATION_FILE.name)
ERRORS = []

def issue(message):
    ERRORS.append(message)

if len(PAGES) < 8:
    issue("Expected at least 8 website HTML pages.")

PUBLIC_SEO_PAGES = {
    "index.html", "partners.html", "lsp-api-integration.html",
    "lender-api-readiness.html", "institutional-partnership-brief.html",
    "partner-desk.html", "solutions.html", "about.html",
    "contact.html", "experience.html", "privacy.html", "terms.html",
}

LINKEDIN_FOOTER_PAGES = {"index.html", "partners.html", "institutional-partnership-brief.html"}
LINKEDIN_FOLLOW_LINK = (
    '<a href="https://www.linkedin.com/company/vorvan/" rel="noreferrer">'
    'Follow VORVAN on LinkedIn</a>'
)
SECURE_ENQUIRY_LINK = '<a href="partners.html#institutional-inquiry">Secure partnership enquiry</a>'

for page in PAGES:
    html = page.read_text(encoding="utf-8")
    if page.name in PUBLIC_SEO_PAGES:
        canonical = "https://vorvan.co.in/" + ("" if page.name == "index.html" else page.name)
        if html.count(f'<link rel="canonical" href="{canonical}">') != 1:
            issue(f"{page.name}: missing or duplicate self-canonical")
        if f'<meta property="og:url" content="{canonical}">' not in html:
            issue(f"{page.name}: missing exact social canonical URL")
        if not re.search(r'<meta name="description" content="[^"]{65,200}">', html):
            issue(f"{page.name}: missing meaningful meta description")
        if not re.search(r'<meta property="og:site_name" content="VORVAN">', html):
            issue(f"{page.name}: site-name social metadata missing")
        if not re.search(r'<title>[^<]{20,85}</title>', html):
            issue(f"{page.name}: descriptive title missing")
    if page.name in ("admin.html", "404.html", "readiness-passport.html", "vyn-coach-sandbox.html", "customer.html") and not re.search(
        r'<meta name="robots" content="noindex', html
    ):
        issue(f"{page.name}: this page must not be indexed")
    if '<meta http-equiv="Content-Security-Policy"' not in html:
        issue(f"{page.name}: missing Content Security Policy")
    if '<meta name="referrer" content="no-referrer">' not in html:
        issue(f"{page.name}: missing referrer restriction")
    if page.name == "customer.html":
        if 'https://kukfpsqujlutlgwndplh.supabase.co' not in html or 'form-action \'self\'' not in html:
            issue("customer.html: expected restricted Supabase connection and same-origin form")
        if re.search(r"<(?:iframe|object|embed)\b", html, re.I):
            issue("customer.html: external frame/embed forbidden")
    if page.name == "vyn-coach-sandbox.html":
        if "connect-src 'none'" not in html or "form-action 'none'" not in html:
            issue("vyn-coach-sandbox.html: outbound network and forms must remain disabled")
        if 'id="vc-terms"' not in html or 'id="vc-privacy"' not in html or 'id="vc-opt-in"' not in html:
            issue("vyn-coach-sandbox.html: explicit demo permissions required")
        if re.search(r"<(?:form|iframe|object|embed)\b", html, re.I):
            issue("vyn-coach-sandbox.html: real forms or embeds forbidden")
    if page.name == "readiness-passport.html":
        if "connect-src 'none'" not in html or "form-action 'none'" not in html:
            issue("readiness-passport.html: network and forms must remain disabled")
        if re.search(r'<(?:input|textarea)\b', html, re.I):
            issue("readiness-passport.html: no raw input/PII fields allowed")
    if page.name == "customer.html":
        if 'https://kukfpsqujlutlgwndplh.supabase.co' not in html:
            issue("customer.html: restricted Supabase-only connect-src required")
        if 'type="module" src="assets/customer-portal.js' not in html:
            issue("customer.html: first-party customer login module required")
        if 'noindex' not in html:
            issue("customer.html: login portal must not be indexed")
    if page.name in ("admin.html", "customer.html"):
        # Authenticated portal forms are permitted; privileged Admin/Customer DB operations are server/RLS checked.
        if re.search(r"<(?:iframe|object|embed)\b", html, re.I):
            issue("admin.html: frame/embed is not permitted")
        if 'https://kukfpsqujlutlgwndplh.supabase.co' not in html:
            issue("admin.html: expected restricted Supabase connect-src")
    elif page.name == "partners.html":
        # One deliberately reviewed, non-file-upload B2B institutional form is allowed.
        if re.search(r"<(?:iframe|object|embed)\b", html, re.I):
            issue("partners.html: external frame or embed forbidden")
        if len(re.findall(r"<form\b", html, re.I)) != 1 or 'id="vv-institutional-inquiry-form"' not in html:
            issue("partners.html: unexpected form structure")
        if re.search(r'type\s*=\s*"file"', html, re.I):
            issue("partners.html: upload controls are forbidden")
    elif re.search(r"<(?:form|iframe|object|embed)\b", html, re.I):
        issue(f"{page.name}: form, frame or embed is not permitted")
    if re.search(r'\s(?:style|on[a-z]+)\s*=', html, re.I):
        issue(f"{page.name}: inline style or event handler blocked by CSP")
    allowed_script = (r'assets/customer-portal\.js' if page.name == "customer.html"
        else r'assets/vyn-coach-ui\.js' if page.name == "vyn-coach-sandbox.html"
        else r'assets/readiness-passport\.js' if page.name == "readiness-passport.html"
        else r'assets/(?:site|admin)\.js' if page.name == "admin.html"
        else r'assets/(?:site|assistant|institutional-inquiry)\.js' if page.name == "partners.html"
        else r'assets/(?:site|assistant)\.js')
    for script in re.findall(r'<script\b[^>]*>', html, re.I):
        if not re.search(r'src="' + allowed_script + r'(?:\?v=[A-Za-z0-9_-]+)?"', script):
            issue(f"{page.name}: unexpected script")
    local_links_html = html
    if page.name in LINKEDIN_FOOTER_PAGES:
        footer = re.search(r"<footer\b[^>]*>(.*?)</footer>", html, re.I | re.S)
        if not footer or footer.group(1).count(LINKEDIN_FOLLOW_LINK) != 1:
            issue(f"{page.name}: missing or duplicate reviewed LinkedIn footer link")
        else:
            start = footer.start(1) + footer.group(1).index(LINKEDIN_FOLLOW_LINK)
            local_links_html = html[:start] + html[start + len(LINKEDIN_FOLLOW_LINK):]
        if not footer or SECURE_ENQUIRY_LINK not in footer.group(1):
            issue(f"{page.name}: missing direct secure enquiry footer link")
    for match in re.finditer(r'\b(?:src|href)="([^"]+)"', local_links_html):
        href = match.group(1)
        if page.name in PUBLIC_SEO_PAGES:
            canonical = "https://vorvan.co.in/" + ("" if page.name == "index.html" else page.name)
            # Only the page's own reviewed canonical URL is permitted externally.
            if href == canonical and f'<link rel="canonical" href="{canonical}">' in html:
                continue
        if page.name == "readiness-passport.html":
            sandbox_canonical = "https://vorvan.co.in/readiness-passport.html"
            if (href == sandbox_canonical and
                f'<link rel="canonical" href="{sandbox_canonical}">' in html):
                continue
        if href.startswith(("#", "mailto:", "tel:", "data:")):
            continue
        parsed = urlsplit(href)
        if parsed.scheme or parsed.netloc or href.startswith("//"):
            issue(f"{page.name}: unexpected external resource: {href}")
            continue
        path = parsed.path
        if path and not (ROOT / path).is_file():
            issue(f"{page.name}: missing local target: {path}")

for source in [ROOT / "assets" / "site.js", ROOT / "assets" / "site.css", ROOT / "assets" / "refresh.css"]:
    if not source.is_file():
        issue(f"Missing {source.relative_to(ROOT)}")
        continue
    contents = source.read_text(encoding="utf-8")
    if re.search(r'\beval\s*\(|\bnew\s+Function\s*\(|document\.write\s*\(', contents):
        issue(f"{source.name}: potentially unsafe dynamic code execution")
    if re.search(r'https?://', contents):
        issue(f"{source.name}: network dependency requires review")

for source in ROOT.glob("**/*"):
    if source.is_file() and source.suffix.lower() in {".html", ".js", ".css"}:
        contents = source.read_text(encoding="utf-8")
        for pattern in (r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', r'sk_live_[A-Za-z0-9]{12,}', r'ghp_[A-Za-z0-9]{30,}'):
            if re.search(pattern, contents):
                issue(f"{source.relative_to(ROOT)}: possible embedded credential")

# Keep the Search Console sitemap limited to live public self-canonical pages.
import xml.etree.ElementTree as ET
sitemap = ROOT / "sitemap.xml"
try:
    tree = ET.parse(sitemap)
    locs = [e.text for e in tree.findall(
        ".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc"
    )]
    expected = {
        "https://vorvan.co.in/" + ("" if p == "index.html" else p)
        for p in PUBLIC_SEO_PAGES
    }
    if len(locs) != len(expected) or set(locs) != expected:
        issue("sitemap.xml: URLs must match the 12 public canonical pages")
except (ET.ParseError, OSError) as exc:
    issue(f"sitemap.xml: invalid XML or missing sitemap: {exc}")

if 'itemtype="https://schema.org/WebSite"' not in (ROOT / "index.html").read_text(encoding="utf-8"):
    issue("index.html: missing site name WebSite microdata")
if 'href="lsp-api-integration.html"' not in (ROOT / "partners.html").read_text(encoding="utf-8"):
    issue("partners.html: integration guide must be internally linked")
for parent in ("partners.html", "partner-desk.html", "lsp-api-integration.html"):
    if 'href="lender-api-readiness.html"' not in (ROOT / parent).read_text(encoding="utf-8"):
        issue(f"{parent}: sandbox readiness guide missing an internal crawlable link")


# Phase 3: verify factual brand microdata and B2B navigational paths.
homepage = (ROOT / "index.html").read_text(encoding="utf-8")
if homepage.count('itemtype="https://schema.org/WebSite"') != 1:
    issue("index.html: exactly one WebSite identity scope is required")
if homepage.count('itemtype="https://schema.org/Organization"') != 1:
    issue("index.html: exactly one factual VORVAN Organization scope is required")
for expected in (
    '<strong itemprop="name">VORVAN</strong>',
    '<meta itemprop="url" content="https://vorvan.co.in/">',
    '<meta itemprop="email" content="info@vorvan.co.in">',
):
    if expected not in homepage:
        issue("index.html: Organization metadata missing or inaccurate: " + expected)

for filename in PUBLIC_SEO_PAGES - {"experience.html"}:
    html = (ROOT / filename).read_text(encoding="utf-8")
    for link in (
        '<a href="lsp-api-integration.html">LSP &amp; lender API guide</a>',
        '<a href="lender-api-readiness.html">API sandbox checklist</a>',
        '<a href="institutional-partnership-brief.html">One-page partner brief</a>',
    ):
        if link not in html:
            issue(f"{filename}: global B2B resource link is absent: {link}")

for filename, expected_depth in (
    ("lsp-api-integration.html", 3),
    ("lender-api-readiness.html", 4),
):
    html = (ROOT / filename).read_text(encoding="utf-8")
    if html.count('itemtype="https://schema.org/BreadcrumbList"') != 1:
        issue(f"{filename}: missing or duplicate BreadcrumbList scope")
    if html.count('itemtype="https://schema.org/ListItem"') != expected_depth:
        issue(f"{filename}: breadcrumb hierarchy depth is invalid")
    if sorted(int(x) for x in re.findall(r'<meta itemprop="position" content="(\d+)">', html)) != list(range(1, expected_depth + 1)):
        issue(f"{filename}: breadcrumb positions are invalid")

# Conversion path validation; only the pre-existing institutional form may submit.
brief = (ROOT / "institutional-partnership-brief.html").read_text(encoding="utf-8")
if brief.count('href="partners.html#institutional-inquiry"') < 2:
    issue("institutional brief: missing direct secure enquiry CTAs")
if '<form' in brief.lower():
    issue("institutional brief: unexpected form; use existing institutional endpoint")
if 'registered company' not in brief.lower():
    issue("institutional brief: registered-company disclaimer missing")
if 'href="partners.html#institutional-inquiry"' not in (ROOT / "index.html").read_text(encoding="utf-8"):
    issue("homepage: missing direct institutional enquiry CTA")
partners = (ROOT / "partners.html").read_text(encoding="utf-8")
if 'id="vv-institutional-inquiry-form"' not in partners or 'id="institutional-inquiry"' not in partners:
    issue("partners.html: existing form or destination anchor missing")

if ERRORS:
    for e in ERRORS:
        print("ERROR:", e)
    raise SystemExit(1)
print(f"PASS: {len(PAGES)} pages checked; no forbidden inline code, forms, external resources or broken local paths.")
