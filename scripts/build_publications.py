#!/usr/bin/env python3
"""
European Mobility Society (EMoS) — OpenAlex Publications Builder
----------------------------------------------------------------
Fetches peer-reviewed works for all EMoS researchers listed in
scripts/members_openalex.json, filters them by Mobility Science topics and
curated domain patterns, and writes publications.json.

Maintenance note (Mattia / Luca / Riccardo):
  When adding a new EMoS researcher, add their OpenAlex author ID (`A...`) to
  scripts/members_openalex.json and run this script (or let GitHub Actions
  .github/workflows/update-publications.yml update publications.json weekly).

Usage:
  # Fetch directly from OpenAlex for all members in scripts/members_openalex.json:
  python3 scripts/build_publications.py

  # Or build from a saved raw OpenAlex JSON dump:
  python3 scripts/build_publications.py --input raw_works.json --output publications.json

Copyright (c) 2026 European Mobility Society (EMoS)
"""

import argparse
import datetime
import json
import os
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

MOBILITY_TOPICS = {
    "Human Mobility and Location-Based Analysis": "Human Mobility",
    "Urban Transport and Accessibility": "Transport & Transit",
    "Transportation Planning and Optimization": "Transport & Transit",
    "Urban Design and Spatial Analysis": "Urban & Cities",
    "Agglomeration and Urban Systems": "Urban & Cities",
    "Global Urban Networks and Dynamics": "Urban & Cities",
    "Smart Cities and Technologies": "Urban & Cities",
    "Housing Market and Economics": "Urban & Cities",
    "Geographic Information Systems Studies": "Urban & Cities",
    "Urban, Neighborhood, and Segregation Studies": "Segregation & Equity",
    "Cultural Industries and Urban Development": "Urban & Cities",
}

TOPIC_PATTERNS = {
    "Human Mobility": [
        r"\bhuman mobility\b", r"\burban mobility\b", r"\bpopulation mobility\b", r"\bmobility\b",
        r"\btrajector(?:y|ies)\b", r"\bcommut(?:e|ing|ers?)\b", r"\borigin[- ]destination\b",
        r"\bnext[- ]location\b", r"\bpedestrian\b", r"\bactive travel\b", r"\bcycling\b",
        r"\bmigration flows?\b", r"\binternal migration\b", r"\bmobile phone data\b",
        r"\bmovement predictability\b", r"\bmovement ecology\b",
    ],
    "Transport & Transit": [
        r"\btransport(?:ation)?\b", r"\btransit\b", r"\btraffic\b", r"\bbus network\b", r"\brail(?:way)?\b",
        r"\bbike lane", r"\broad network\b", r"\bnavigation services?\b", r"\bair transport\b",
        r"\bcarbon intensity\b", r"\b15[- ]minute cit", r"\bproximity[- ]based cit", r"\bisochrone\b",
    ],
    "Urban & Cities": [
        r"\burban\b", r"\bcities\b", r"\bcity\b", r"\bgentrification\b", r"\bhousing market\b",
        r"\bstreet network\b", r"\bspatial network\b", r"\bspatial segmentation\b",
        r"\bpoints? of interest\b", r"\bregionalization\b", r"\burban scaling\b", r"\burban vibrancy\b",
        r"\bneighbourhood\b", r"\bneighborhood\b",
    ],
    "Segregation & Equity": [
        r"\bsegregation\b", r"\bdisparit(?:y|ies)\b", r"\binequalit(?:y|ies)\b",
        r"\bsocioeconomic mixing\b", r"\bhousing insecurity\b", r"\baccessibility\b",
        r"\bincome segregation\b",
    ],
    "Urban AI & Sensing": [
        r"\b(?:urban|mobility|city|cities|traffic|navigation|location-based|air quality)\b.*\b(?:llm|large language model|recommender|machine learning|sensors?)\b",
        r"\b(?:llm|large language model|recommender|machine learning|sensors?)\b.*\b(?:urban|mobility|city|cities|traffic|navigation|location-based|air quality)\b",
    ],
}

EPIDEMIC_PATTERNS = [
    r"\bepidemic\b", r"\bpandemic\b", r"\bcontagion\b", r"\bdisease spreading\b",
    r"\blockdown\b", r"\bcovid-19\b", r"\bresilience\b", r"\bvaccination\b", r"\bimmunization\b",
]

CORE_TITLE_PATTERNS = [
    r"\bmobility\b", r"\btransit\b", r"\btransport", r"\burban\b", r"\bcit(?:y|ies)\b",
    r"\bcommut", r"\bsegregation\b", r"\btrajector", r"\bpedestrian\b", r"\bcycling\b",
]

EXCLUDE_TITLE_PATTERNS = [
    r"\bprotein\b", r"\bdrinking water\b", r"\bwater demand\b", r"\bmunicipal waste\b",
    r"\bgamestop\b", r"\becho chambers?\b", r"\bsoccer\b", r"\bfootball\b", r"\bonline shopping\b",
    r"\boscillators?\b", r"\bmisinformation\b", r"\bfact-checking\b", r"\bantidepressant\b",
    r"\bmodel collapse\b", r"\bfish school search\b", r"\bfirm-level systemic risk\b",
    r"\breddit\b", r"\bhigher education\b", r"\bair pollution\b", r"\bcomparative advantage\b",
    r"\blattice calculation\b", r"\bquantum\b", r"\bpolitical divisiveness\b",
]


def reconstruct_abstract(inv):
    """Rebuild plain-text abstract string from OpenAlex's word-index map."""
    if not inv:
        return ""
    words = {pos: word for word, positions in inv.items() for pos in positions}
    return " ".join(words[k] for k in sorted(words))


def classify_work(work):
    """Return sorted Mobility Science topic tags for an OpenAlex work, or [] to exclude off-topic papers."""
    title = (work.get("title") or "").strip()
    if not title:
        return []
    title_l = title.lower()
    abstract_l = reconstruct_abstract(work.get("abstract_inverted_index")).lower()
    text = f"{title_l} {abstract_l}"

    oa_topics = [t.get("display_name") for t in (work.get("topics") or [])[:2] if t]
    tags = {MOBILITY_TOPICS[t] for t in oa_topics if t in MOBILITY_TOPICS}

    for cat, patterns in TOPIC_PATTERNS.items():
        if any(re.search(p, text) for p in patterns):
            tags.add(cat)

    # Tag Epidemics & Resilience only when both epidemic focus AND mobility/urban focus hold
    has_epi_topic = any("Epidemiology" in t or "COVID-19" in t for t in oa_topics)
    has_epi_title = any(re.search(p, title_l) for p in EPIDEMIC_PATTERNS)
    if (has_epi_topic or has_epi_title) and (tags & {"Human Mobility", "Urban & Cities", "Transport & Transit"}):
        tags.add("Epidemics & Resilience")

    core_title = any(re.search(p, title_l) for p in CORE_TITLE_PATTERNS)
    if any(re.search(p, title_l) for p in EXCLUDE_TITLE_PATTERNS) and not core_title:
        return []

    return sorted(tags)


def build_publications(raw_works, members_cfg):
    """Filter, deduplicate, and normalize raw OpenAlex works into the publications.json schema."""
    aid_to_member = {m["openalexId"]: m for m in members_cfg if m.get("openalexId")}
    pubs = []
    seen_ids = set()

    for w in raw_works:
        wid = (w.get("id") or "").split("/")[-1]
        if not wid or wid in seen_ids:
            continue
        tags = classify_work(w)
        if not tags:
            continue

        authors = []
        matched_members = []
        for a in w.get("authorships", []):
            au = a.get("author") or {}
            dn = (au.get("display_name") or a.get("raw_author_name") or "").strip()
            if dn:
                authors.append(dn)
            aid = (au.get("id") or "").split("/")[-1]
            if aid in aid_to_member and aid_to_member[aid]["id"] not in matched_members:
                matched_members.append(aid_to_member[aid]["id"])

        if not authors or not matched_members:
            continue

        loc = w.get("primary_location") or {}
        src = loc.get("source") or {}
        venue = (src.get("display_name") or "").strip()
        doi = w.get("doi") or ""
        url = doi if doi.startswith("http") else (f"https://doi.org/{doi}" if doi else (loc.get("landing_page_url") or ""))

        seen_ids.add(wid)
        pubs.append({
            "id": wid,
            "title": w["title"].strip(),
            "authors": authors,
            "members": matched_members,
            "venue": venue,
            "year": w.get("publication_year"),
            "url": url,
            "cites": w.get("cited_by_count") or 0,
            "topics": tags,
        })

    pubs.sort(key=lambda p: (-(p.get("year") or 0), -(p.get("cites") or 0), p["title"]))
    return pubs


def _load_openalex_key():
    """Read optional OPENALEX_API_KEY from the environment or ~/.env for higher API rate limits."""
    key = os.environ.get("OPENALEX_API_KEY", "").strip()
    if key:
        return key
    env_file = Path.home() / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("OPENALEX_API_KEY="):
                return line.split("=", 1)[1].strip().strip("\"'")
    return ""


def fetch_openalex_works(members_cfg, since_year=2021, until_year=None):
    """Query OpenAlex API for all configured authors using only Python stdlib."""
    if until_year is None:
        until_year = datetime.date.today().year
    author_ids = [m["openalexId"] for m in members_cfg if m.get("openalexId")]
    api_key = _load_openalex_key()
    headers = {"User-Agent": "EMoS-Website/1.0 (https://github.com/MobilityScience/EMoS)"}

    works_by_id = {}
    batch_size = 5
    for i in range(0, len(author_ids), batch_size):
        batch = "|".join(author_ids[i:i + batch_size])
        page = 1
        while True:
            params = {
                "filter": f"author.id:{batch},publication_year:{since_year}-{until_year},type:article|review|book-chapter",
                "per-page": "200",
                "page": str(page),
            }
            if api_key:
                params["api_key"] = api_key
            url = "https://api.openalex.org/works?" + urllib.parse.urlencode(params)
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            results = payload.get("results") or []
            for w in results:
                wid = w.get("id")
                if wid:
                    works_by_id[wid] = w
            total = (payload.get("meta") or {}).get("count") or 0
            if page * 200 >= total or not results:
                break
            page += 1
            time.sleep(0.15)
        time.sleep(0.15)
    return list(works_by_id.values())


def main():
    """CLI entrypoint: load member config, fetch/read works, filter topics, and write publications.json."""
    parser = argparse.ArgumentParser(description="Fetch OpenAlex works and generate mobility-filtered publications.json.")
    parser.add_argument("--input", help="Optional local JSON file of raw OpenAlex works (skips live API fetch)")
    parser.add_argument("--members", default=str(Path(__file__).with_name("members_openalex.json")))
    parser.add_argument("--output", default="publications.json")
    parser.add_argument("--since", type=int, default=2021, help="First publication year to include (default: 2021)")
    args = parser.parse_args()

    raw_members_cfg = json.loads(Path(args.members).read_text())
    members_cfg = raw_members_cfg["members"] if isinstance(raw_members_cfg, dict) else raw_members_cfg
    if args.input:
        raw_works = json.loads(Path(args.input).read_text())
        print(f"Loaded {len(raw_works)} works from {args.input}")
    else:
        print(f"Fetching OpenAlex works ({args.since}–{datetime.date.today().year}) for {len(members_cfg)} members...")
        raw_works = fetch_openalex_works(members_cfg, since_year=args.since)
        print(f"Fetched {len(raw_works)} unique works from OpenAlex")

    pubs = build_publications(raw_works, members_cfg)

    topic_counts = Counter(t for p in pubs for t in p["topics"])
    out = {
        "_about": "European Mobility Society (EMoS) — Auto-generated OpenAlex publications catalog (do not edit manually; run scripts/build_publications.py).",
        "_copyright": "Copyright (c) 2026 European Mobility Society (EMoS)",
        "_schema": {
            "updated": "ISO YYYY-MM-DD date of last OpenAlex refresh",
            "source": "Human-readable provenance summary shown in UI badges",
            "topics": "string[] — Mobility Science topic pills ordered by frequency",
            "publications": [
                {
                    "id": "OpenAlex work ID (W...)",
                    "title": "Publication title",
                    "authors": "string[] — full display names of all co-authors",
                    "members": "string[] — matched EMoS member slugs from assets/js/data.js",
                    "venue": "Journal or book venue name",
                    "year": "int — publication year (>= 2021)",
                    "url": "Canonical DOI or landing page URL",
                    "cites": "int — OpenAlex cited_by_count",
                    "topics": "string[] — matched EMoS Mobility Science topic categories"
                }
            ]
        },
        "updated": datetime.date.today().isoformat(),
        "source": f"OpenAlex — {args.since}–{datetime.date.today().year} peer-reviewed works filtered by Mobility Science topics",
        "topics": [t for t, _ in topic_counts.most_common()],
        "publications": pubs,
    }
    Path(args.output).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(pubs)} publications to {args.output}")
    print("Topics:", dict(topic_counts))


if __name__ == "__main__":
    main()
