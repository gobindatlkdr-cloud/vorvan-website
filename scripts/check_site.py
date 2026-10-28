#!/usr/bin/env python3
"""Minimal dependency-free checks for VORVAN's static corporate website.

This is a regression guard, not a penetration test or vulnerability scanner.
"""
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted(ROOT.glob("*.html"))
ERRORS = []

def issue(message):
    ERRORS.append(message)

if len(PAGES) < 8:
    issue("Expected at least 8 website HTML pages.")

for page in PAGES:
    html = page.read_text(encoding="utf-8")
    if '<meta http-equiv="Content-Security-Policy"' not in html:
        issue(f"{page.name}: missing Content Security Policy")
    if '<meta name="referrer" content="no-referrer">' not in html:
        issue(f"{page.name}: missing referrer restriction")
    if page.name == "admin.html":
        # Admin login/MFA forms are allowed; privileged actions are server-checked.
        if re.search(r"<(?:iframe|object|embed)\\b", html, re.I):
            issue("admin.html: frame/embed is not permitted")
        if 'https://kukfpsqujlutlgwndplh.supabase.co' not in html:
            issue("admin.html: expected restricted Supabase connect-src")
    elif re.search(r"<(?:form|iframe|object|embed)\\b", html, re.I):
        issue(f"{page.name}: form, frame or embed is not permitted")
    if re.search(r'\s(?:style|on[a-z]+)\s*=', html, re.I):
        issue(f"{page.name}: inline style or event handler blocked by CSP")
    allowed_script = r'assets/(?:site|admin)\\.js' if page.name == "admin.html" else r'assets/site\\.js'
    for script in re.findall(r'<script\\b[^>]*>', html, re.I):
        if not re.search(r'src="' + allowed_script + r'"', script):
            issue(f"{page.name}: unexpected script")
    for match in re.finditer(r'\b(?:src|href)="([^"]+)"', html):
        href = match.group(1)
        if href.startswith(("#", "mailto:", "tel:", "data:")):
            continue
        parsed = urlsplit(href)
        if parsed.scheme or parsed.netloc or href.startswith("//"):
            issue(f"{page.name}: unexpected external resource: {href}")
            continue
        path = parsed.path
        if path and not (ROOT / path).is_file():
            issue(f"{page.name}: missing local target: {path}")

for source in [ROOT / "assets" / "site.js", ROOT / "assets" / "site.css"]:
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

if ERRORS:
    for e in ERRORS:
        print("ERROR:", e)
    raise SystemExit(1)
print(f"PASS: {len(PAGES)} pages checked; no forbidden inline code, forms, external resources or broken local paths.")
