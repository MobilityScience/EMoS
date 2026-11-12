#!/usr/bin/env python3
"""
European Mobility Society (EMoS) — XML Sitemap Generator
--------------------------------------------------------
Pure Python standard library — zero external dependencies.
Discovers root pages and archived symposium pages under symposia/, excludes
third-party template leftovers, and derives accurate ISO lastmod dates from
Git history (with data-file dependency tracking so updates to
publications.json, symposia.json, or assets/js/data.js bump dependent pages).

Usage:
  python3 scripts/build_sitemap.py

Copyright (c) 2026 European Mobility Society (EMoS)
"""

from __future__ import annotations

import argparse
import datetime as dt
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

DEFAULT_BASE_URL = "https://mobilityscience.github.io/EMoS"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

# Root pages with SEO hints and the data/script files that change their rendered content.
CORE_PAGES = [
    {
        "path": "index.html",
        "loc_path": "",
        "changefreq": "monthly",
        "priority": "1.0",
        "deps": ["index.html", "assets/js/data.js", "assets/js/home.js", "publications.json", "symposia.json"],
    },
    {
        "path": "members.html",
        "loc_path": "members.html",
        "changefreq": "monthly",
        "priority": "0.9",
        "deps": ["members.html", "assets/js/data.js", "assets/js/members.js"],
    },
    {
        "path": "publications.html",
        "loc_path": "publications.html",
        "changefreq": "monthly",
        "priority": "0.9",
        "deps": ["publications.html", "publications.json", "assets/js/publications.js", "assets/js/data.js"],
    },
    {
        "path": "symposia.html",
        "loc_path": "symposia.html",
        "changefreq": "monthly",
        "priority": "0.85",
        "deps": ["symposia.html", "symposia.json", "assets/js/symposia.js"],
    },
    {
        "path": "about.html",
        "loc_path": "about.html",
        "changefreq": "yearly",
        "priority": "0.8",
        "deps": ["about.html"],
    },
]

EXCLUDED_SYMPOSIUM_FILES = {"elements.html", "generic.html"}


def git_lastmod(repo_root: Path, rel_paths: list[str]) -> str | None:
    """Return the latest YYYY-MM-DD commit date across any existing path in rel_paths."""
    existing = [p for p in rel_paths if (repo_root / p).exists()]
    if not existing:
        return None
    try:
        proc = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", *existing],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
        date_str = proc.stdout.strip()
        if len(date_str) == 10:
            return date_str
    except OSError:
        pass
    return None


def file_mtime_date(path: Path) -> str:
    """Fallback UTC YYYY-MM-DD modification date when Git history is unavailable for a file."""
    return dt.datetime.fromtimestamp(path.stat().st_mtime, tz=dt.timezone.utc).strftime("%Y-%m-%d")


def collect_urls(repo_root: Path, base_url: str) -> list[dict[str, str]]:
    """Gather canonical root pages and archived symposium URLs with lastmod and priority metadata."""
    base = base_url.rstrip("/")
    entries: list[dict[str, str]] = []

    for page in CORE_PAGES:
        full_path = repo_root / page["path"]
        if not full_path.exists():
            continue
        lastmod = git_lastmod(repo_root, page["deps"]) or file_mtime_date(full_path)
        loc = f"{base}/" if not page["loc_path"] else f"{base}/{page['loc_path']}"
        entries.append(
            {
                "loc": loc,
                "lastmod": lastmod,
                "changefreq": page["changefreq"],
                "priority": page["priority"],
            }
        )

    symposia_dir = repo_root / "symposia"
    if symposia_dir.is_dir():
        archived_html = sorted(
            p
            for p in symposia_dir.rglob("*.html")
            if p.name not in EXCLUDED_SYMPOSIUM_FILES
        )
        for html_file in archived_html:
            rel = html_file.relative_to(repo_root).as_posix()
            lastmod = git_lastmod(repo_root, [rel]) or file_mtime_date(html_file)
            is_landing = html_file.name == "index.html"
            entries.append(
                {
                    "loc": f"{base}/{rel}",
                    "lastmod": lastmod,
                    "changefreq": "yearly",
                    "priority": "0.7" if is_landing else "0.6",
                }
            )

    return entries


def build_xml(entries: list[dict[str, str]]) -> str:
    """Serialize sitemap URL entries into indented UTF-8 XML matching the Sitemap 0.9 schema."""
    ET.register_namespace("", SITEMAP_NS)
    urlset = ET.Element(f"{{{SITEMAP_NS}}}urlset")

    for entry in entries:
        url_el = ET.SubElement(urlset, f"{{{SITEMAP_NS}}}url")
        for key in ("loc", "lastmod", "changefreq", "priority"):
            child = ET.SubElement(url_el, f"{{{SITEMAP_NS}}}{key}")
            child.text = entry[key]

    ET.indent(urlset, space="  ")
    xml_bytes = ET.tostring(urlset, encoding="utf-8", xml_declaration=True)
    return xml_bytes.decode("utf-8") + "\n"


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint: collect site URLs and write formatted sitemap.xml to disk."""
    parser = argparse.ArgumentParser(description="Build EMoS sitemap.xml")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Canonical site base URL")
    parser.add_argument("--output", default="sitemap.xml", help="Output sitemap path")
    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parent.parent
    out_path = Path(args.output)
    if not out_path.is_absolute():
        out_path = repo_root / out_path

    entries = collect_urls(repo_root, args.base_url)
    xml_text = build_xml(entries)
    out_path.write_text(xml_text, encoding="utf-8")
    print(f"Wrote {len(entries)} URLs to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
