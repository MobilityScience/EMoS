# European Mobility Society (EMoS) Website

Official website for the **European Mobility Society (EMoS)** — an interdisciplinary network of **23 researchers** across **14 European institutions** advancing quantitative mobility science, urban dynamics, transport, and complex systems.

Live site: **https://mobilityscience.github.io/EMoS/**

Everything runs as a **zero-build static website** on GitHub Pages. There is no Node bundler, no framework compilation, and no backend server.

---

## Pages & Features

| Page | Script | What it does |
|---|---|---|
| `index.html` | `assets/js/home.js` | Hero with Origin–Destination canvas animation and 4 KPI counters (`Members`, `Institutions`, `Collaborations`, `Papers (2021+)`), interactive D3 + TopoJSON Europe network map (cluster zoom, clickable dashed collaboration arcs, collision-avoiding popups, pair drawer), and member institutions logo grid. |
| `about.html` | `assets/js/shared.js` | Society mission, philosophy, and the European Mobility Science Manifesto section. |
| `members.html` | `assets/js/members.js` | Alphabetical directory of all 23 members with search, portraits, verified bios, expandable institutional cards, key publications, and direct links to the map and publications. |
| `publications.html` | `assets/js/publications.js` | Mobility science publications (`2021+`) fetched from OpenAlex, with live search, `Member` / `Institution` selectors, `By year | By institution` toggle, dynamic topic pill counters, `Reset filters`, and Author/Institution Spotlight panels. |
| `symposia.html` | `assets/js/symposia.js` | Upcoming symposium (`2028`) and past editions (`2026 Exeter`, `2025 Turin`, `2024 Pisa`) with 16:9 group photos. |
| `symposium-archive.html` | `assets/js/symposium-archive.js` | Encapsulated archive viewer that renders past symposium static sites inside the shared EMoS header/footer, validated against `symposia.json`. |

---

## Repository Structure

```text
EMoS/
├── index.html                    # Home page + interactive Europe map
├── about.html                    # About page
├── members.html                  # Members directory
├── publications.html             # Publications & OpenAlex explorer
├── symposia.html                 # Symposia overview
├── symposium-archive.html        # Archived symposium wrapper
├── publications.json             # Mobility publications dataset (auto-updated via OpenAlex)
├── symposia.json                 # Symposia metadata (upcoming & past editions)
├── robots.txt                    # Search engine crawl rules
├── sitemap.xml                   # XML sitemap (auto-generated)
├── assets/
│   ├── css/styles.css            # Shared design tokens, sticky footer, custom select & map styles
│   ├── js/
│   │   ├── data.js               # Single source of truth for INSTITUTIONS, MEMBERS & TOPIC_STYLES
│   │   ├── shared.js             # Tailwind config, responsive navbar, JSON loaders, collaboration graph
│   │   ├── home.js               # Hero canvas, KPIs, D3 Europe map & institution grid
│   │   ├── members.js            # Member cards, search & morphing details
│   │   ├── publications.js       # Filters, dynamic topic counts, spotlight & grouping
│   │   ├── symposia.js           # Symposia grid & upcoming/past rendering
│   │   └── symposium-archive.js  # Whitelisted iframe loader for past editions
│   ├── logos/                    # Institution logos & EMoS brand mark
│   └── photos/                   # Member portraits & 16:9 symposium group photos
├── symposia/                     # Preserved static snapshots of past editions
│   ├── 2024-pisa/
│   ├── 2025-turin/
│   └── 2026-exeter/
├── scripts/
│   ├── members_openalex.json     # Verified OpenAlex Author IDs for all 23 members
│   ├── build_publications.py     # Stdlib-only OpenAlex fetcher & mobility topic classifier
│   └── build_sitemap.py          # Git-history-aware sitemap.xml generator
└── .github/workflows/
    ├── update-publications.yml   # Monthly OpenAlex refresh (opens a PR if new papers are found)
    └── update-sitemap.yml        # Keeps sitemap.xml synced on main
```

---

## Local Development

Browsers block `fetch()` for local JSON files over `file://`. Run a local static server from the repository root and open `http://localhost:8765`:

```bash
python3 -m http.server 8765
```

---

## Shareable Deep Links

| URL | Result |
|---|---|
| `index.html?inst=<id>#network` | Opens Home and focuses the map on that institution |
| `members.html?member=<id>` | Opens Members with that person's card expanded and centered |
| `publications.html?member=<id>` | Filters Publications to that member and opens their Spotlight |
| `publications.html?inst=<id>&group=institution` | Filters Publications to an institution (or switches to `By institution` view) |
| `symposium-archive.html?edition=<id>` | Opens a past symposium (`2024-pisa`, `2025-turin`, `2026-exeter`) in the archive viewer |

Member `id`s are lowercase, accent-free, and hyphenated (e.g., `riccardo-di-clemente`, `luca-pappalardo`, `mattia-mazzoli`).

---

## Updating Content & Automation

### 1. Adding or editing members and institutions
- Edit `INSTITUTIONS` and `MEMBERS` in [`assets/js/data.js`](assets/js/data.js).
- Save member portraits in `assets/photos/` and trimmed institution logos in `assets/logos/`.
- Add the member's verified OpenAlex Author ID to [`scripts/members_openalex.json`](scripts/members_openalex.json).

### 2. Updating publications (`publications.json`)
`scripts/build_publications.py` uses **only the Python standard library** (no `pip install` needed). It queries OpenAlex for all authors in `scripts/members_openalex.json`, filters for mobility-related works (`2021+`), assigns one of 6 topics, and preserves the `_about`, `_copyright`, and `_schema` headers in `publications.json`:

```bash
python3 scripts/build_publications.py
```

The GitHub Action [`.github/workflows/update-publications.yml`](.github/workflows/update-publications.yml) also runs automatically on the **1st of every month** (and can be triggered manually via `workflow_dispatch`) to open a Pull Request whenever new papers are detected.

### 3. Adding a symposium edition
- Add the edition entry to [`symposia.json`](symposia.json) (`status`: `"upcoming"` or `"past"`).
- Save a `16:9` group photo in `assets/photos/symposia/` and, for past editions, place the static snapshot under `symposia/<year-city>/`.

### 4. Regenerating `sitemap.xml`
Whenever pages or data files change, regenerate [`sitemap.xml`](sitemap.xml) (automated on `main` via [`.github/workflows/update-sitemap.yml`](.github/workflows/update-sitemap.yml)):

```bash
python3 scripts/build_sitemap.py
```

---

## Technical Notes

- **Styling & Libraries (CDN):** [Tailwind CSS](https://tailwindcss.com) (Play CDN, configured in `assets/js/shared.js`), [D3](https://d3js.org) 7.9.0, [topojson-client](https://github.com/topojson/topojson-client) 3.1.0, and Google Fonts (`Inter`, `Source Serif 4`).
- **Map Data:** European country borders come from Natural Earth (public domain) via `world-atlas`.
- **SEO:** Every main page includes `<link rel="canonical">`, Open Graph, Twitter Card, and Schema.org JSON-LD metadata.
- **How Collaborations Are Computed:** No collaboration links are hardcoded. `assets/js/shared.js` derives institution-to-institution links directly from co-authored papers in `publications.json` (plus optional `EXTRA_CONNECTIONS` in `assets/js/data.js`).

---

## Maintainers & Credits

- **Riccardo Di Clemente** — Multi-page architecture, interactive D3 network map, OpenAlex automation pipeline, symposia archive integration, and SEO.
- **Luca Pappalardo** & **Mattia Mazzoli** — Society coordination, content curation, and repository maintenance.
- **European Mobility Society (EMoS)** — Member biographies, institutional assets, and symposium archives.

Copyright (c) 2026 European Mobility Society (EMoS).
