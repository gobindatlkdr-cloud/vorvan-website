#!/usr/bin/env python3
"""Read-only remote sitemap and crawlability audit for VORVAN GitHub Pages.

This checks publicly observable responses from GitHub Actions, not Google's
private Search Console ingestion status. A Googlebot user-agent is not proof
of access from a verified Googlebot IP address.
"""
from __future__ import annotations

from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree
import re
import sys
import time

BASE = "https://vorvan.co.in/"
SITEMAP = BASE + "sitemap.xml"
ROBOTS = BASE + "robots.txt"
ROOT = Path(__file__).resolve().parents[1]
GOOGLEBOT_UA = (
    "Mozilla/5.0 (compatible; Googlebot/2.1; "
    "+http://www.google.com/bot.html)"
)
STANDARD_UA = "VORVAN-public-SEO-monitor/1.0"
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


def fetch(url: str, user_agent: str = STANDARD_UA, attempts: int = 3):
    last = None
    for attempt in range(attempts):
        try:
            request = Request(url, headers={"User-Agent": user_agent, "Accept": "*/*"})
            with urlopen(request, timeout=20) as response:
                return (
                    response.status,
                    response.geturl(),
                    response.headers.get("Content-Type", ""),
                    response.read(1_500_000),
                )
        except (HTTPError, URLError, TimeoutError) as exc:
            last = exc
            if attempt < attempts - 1:
                time.sleep(3)
    raise RuntimeError(f"{url}: {last}")


def main():
    issues = []
    warnings = []
    local_root = ElementTree.fromstring((ROOT / "sitemap.xml").read_bytes())
    expected = [
        loc.text
        for loc in local_root.findall(f".//{SITEMAP_NS}loc")
    ]
    if len(expected) != 12 or len(set(expected)) != len(expected):
        issues.append("Local sitemap must contain exactly 12 distinct public URLs")

    status, final, content_type, robots_body = fetch(ROBOTS)
    robots_text = robots_body.decode("utf-8-sig", "replace")
    print(f"robots.txt: HTTP {status}, final={final}, type={content_type}")
    if status != 200 or final != ROBOTS:
        issues.append("robots.txt did not return HTTP 200 at the canonical URL")
    if f"Sitemap: {SITEMAP}" not in robots_text:
        issues.append("robots.txt lacks the exact canonical sitemap reference")
    robot = RobotFileParser()
    robot.parse(robots_text.splitlines())
    for test_url in [SITEMAP] + expected:
        if not robot.can_fetch(GOOGLEBOT_UA, test_url):
            issues.append(f"robots.txt disallows the sitemap or public URL: {test_url}")

    versions = {}
    for label, agent in [("standard", STANDARD_UA), ("googlebot-user-agent", GOOGLEBOT_UA)]:
        code, final_url, mime, body = fetch(SITEMAP, user_agent=agent)
        print(f"sitemap.xml [{label}]: HTTP {code}, final={final_url}, type={mime}, bytes={len(body)}")
        if code != 200 or final_url != SITEMAP:
            issues.append(f"Sitemap [{label}] not HTTP 200 at canonical URL")
        if not ("xml" in mime.lower() or mime.lower().startswith("text/plain")):
            warnings.append(f"Sitemap [{label}] has unexpected Content-Type {mime!r}; Google compatibility should be inspected")
        try:
            doc = ElementTree.fromstring(body)
            if doc.tag != f"{SITEMAP_NS}urlset":
                issues.append(f"Sitemap [{label}] root XML namespace is invalid")
            locations = [loc.text for loc in doc.findall(f".//{SITEMAP_NS}loc")]
            versions[label] = locations
            if set(locations) != set(expected) or len(locations) != len(expected):
                issues.append(f"Sitemap [{label}] URLs do not match 12 canonical checked-in URLs")
        except ElementTree.ParseError as exc:
            issues.append(f"Sitemap [{label}] is not valid XML: {exc}")
    if versions.get("standard") != versions.get("googlebot-user-agent"):
        issues.append("Sitemap contents differ between ordinary and Googlebot-style requests")

    inspected = 0
    for url in expected:
        if not url.startswith(BASE):
            issues.append(f"URL belongs to a different host: {url}")
            continue
        code, final_url, mime, body = fetch(url, user_agent=GOOGLEBOT_UA)
        html = body.decode("utf-8", "replace")
        match = re.search(r'<link rel="canonical" href="([^"]+)">', html)
        declared = match.group(1) if match else None
        print(f"page: HTTP {code}, {url}, final={final_url}, canonical={declared}")
        if code != 200 or final_url != url:
            issues.append(f"Non-200 or redirected canonical public page: {url}")
        if declared != url:
            issues.append(f"Wrong or absent self-canonical for {url}")
        if re.search(r'<meta name="robots" content="[^"]*\bnoindex\b', html, re.I):
            issues.append(f"Sitemap public page explicitly has noindex: {url}")
        if "html" not in mime.lower():
            warnings.append(f"Page {url} served with unexpected content type {mime}")
        inspected += 1

    for warning in warnings:
        print("WARNING:", warning)
    for issue in issues:
        print("ERROR:", issue)
    if issues:
        print(f"FAIL: {len(issues)} blocking issue(s), {inspected} public URLs inspected")
        return 1
    print(
        f"PASS: Live robots.txt permits {len(expected)} pages and sitemap; "
        "both sitemap request styles served valid matching XML; "
        f"{inspected} canonical pages returned HTTP 200 without noindex."
    )
    print(
        "LIMITATION: This does not prove Google has ingested the sitemap, "
        "that Search Console shows Success, or that a real verified Googlebot IP can crawl it."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
