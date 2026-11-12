# European Mobility Society (EMoS) — Website

Official repository for the **European Mobility Society** web portal: **https://mobilityscience.github.io/EMoS/**

A zero-build, multi-page static website hosted on GitHub Pages. It showcases the society's network (**23 researchers across 14 European institutions**), automatically syncs mobility science publications from **OpenAlex**, and preserves past symposium editions in an integrated archive.

---

## Quick Start (Local Preview)

Browsers block `fetch()` requests for local JSON files over `file://`. Run any static HTTP server from the repository root:

```bash
git clone https://github.com/MobilityScience/EMoS.git
cd EMoS
python3 -m http.server 8765
```

Then open **http://localhost:8765** in your browser.

---

## Architecture & File Map

No bundler, Node.js runtime, or build step is required in production. All pages share a common navigation bar, responsive popover menu, and sticky footer managed by `assets/js/shared.js` and `assets/css/styles.css`.

### HTML Pages
| File | Purpose | Page Script |
|---|---|---|
| `index.html` | Home page: hero OD-flow canvas, 4 KPI counters, interactive D3 Europe network map, and institution logo grid. | `assets/js/home.js` |
| `about.html` | Society mission, governance philosophy, and manifesto section. | `assets/js/shared.js` |
| `members.html` | Alphabetical member directory with live search, portraits, bios, and expandable affiliation/publication cards. | `assets/js/members.js` |
| `publications.html` | Publications explorer (`2021+`) with search, member/institution filters, dynamic topic counts, and spotlight panels. | `assets/js/publications.js` |
| `symposia.html` | Overview of upcoming (`2028`) and past symposium editions (`2024–2026`). | `assets/js/symposia.js` |
| `symposium-archive.html` | Sandboxed archive viewer that embeds past static symposium sites under the EMoS header and footer. | `assets/js/symposium-archive.js` |

### Data, Assets & Automation
| Path | Purpose |
|---|---|
| `assets/js/data.js` | Single source of truth for `INSTITUTIONS`, `MEMBERS`, `TOPIC_STYLES`, and `EXTRA_CONNECTIONS`. |
| `assets/js/shared.js` | Tailwind Play CDN theme config, adaptive navbar, JSON loaders, and co-authorship graph builder. |
| `assets/css/styles.css` | Shared design tokens, sticky footer layout, custom `<select>` styling, and map/card styles. |
| `assets/photos/` | Member portraits and `16:9` symposium group photos (`assets/photos/symposia/`). |
| `assets/logos/` | Trimmed institutional logos and the EMoS brand mark (`emos-mark.png`). |
| `publications.json` | Curated mobility publications dataset generated from OpenAlex. |
| `symposia.json` | Metadata and archive whitelist for upcoming and past symposia. |
| `symposia/<edition>/` | Preserved static snapshots of past symposium websites (`2024-pisa`, `2025-turin`, `2026-exeter`). |
| `scripts/members_openalex.json` | Verified OpenAlex Author IDs mapped to member IDs. |
| `scripts/build_publications.py` | Python 3 stdlib-only script that queries OpenAlex, filters mobility papers, and writes `publications.json`. |
| `scripts/build_sitemap.py` | Generates `sitemap.xml` using Git commit timestamps for `<lastmod>`. |
| `.github/workflows/` | Automated monthly OpenAlex refresh (`update-publications.yml`) and sitemap sync (`update-sitemap.yml`). |
| `robots.txt` & `sitemap.xml` | Search engine directives and indexed URL list for GitHub Pages. |

---

## How Collaborations & Data Work

```text
scripts/members_openalex.json ──► scripts/build_publications.py ──► publications.json
                                                                           │
assets/js/data.js (MEMBERS & INSTITUTIONS) ────────────────────────────────┼──► assets/js/shared.js
                                                                           │
    Co-authored papers across different institutions ──────────────────────┴──► Map edges & Spotlight panels
```

- **No hardcoded collaboration links:** Institution-to-institution edges on the Europe map are computed automatically in the browser whenever two EMoS members at different institutions co-author a paper in `publications.json` (plus any manual events/projects in `EXTRA_CONNECTIONS`).
- **Multi-affiliation support:** If a member belongs to multiple institutions in `data.js`, their papers count toward each of their institutions.
- **Publication window (`2021+`):** The `2021+` label on KPIs and badges is derived dynamically from the earliest publication year in `publications.json`, scoping recent society activity around the symposia rather than lifetime career totals.

---

## How to Update the Site

### 1. Add or edit a member
1. Add the member's portrait to `assets/photos/` (square/portrait JPEG or PNG).
2. Add or update their entry in `MEMBERS` inside [`assets/js/data.js`](assets/js/data.js):
   ```js
   {
     id: 'first-last',
     name: 'First Last',
     institutions: ['inst-id'],
     photo: 'assets/photos/first-last.jpg',
     bio: 'Short verified biography.',
     aliases: ['F. Last'] // optional: alternate spellings used on papers
   }
   ```
3. Add their verified OpenAlex Author ID to [`scripts/members_openalex.json`](scripts/members_openalex.json) and run `python3 scripts/build_publications.py`.

### 2. Add or edit an institution
1. Save a trimmed logo in `assets/logos/`.
2. Add an entry to `INSTITUTIONS` inside [`assets/js/data.js`](assets/js/data.js) (`lat`/`lng` automatically place the node on the D3 map; `country` must match Natural Earth country names for shading):
   ```js
   { id: 'inst-id', name: 'Full Institution Name', short: 'SHORT', city: 'City', country: 'Country', lat: 0.0, lng: 0.0, logo: 'assets/logos/inst.png' }
   ```

### 3. Refresh publications (`publications.json`)
`scripts/build_publications.py` requires **Python 3.9+** and uses only the standard library:

```bash
python3 scripts/build_publications.py
# Optional: override start year (default: 2021)
python3 scripts/build_publications.py --since 2021
```

On GitHub, [`.github/workflows/update-publications.yml`](.github/workflows/update-publications.yml) runs on the **1st of every month** (or manually via *Actions → Run workflow*) and opens a Pull Request if new mobility papers are found.

### 4. Add a symposium edition
1. Add the edition metadata to [`symposia.json`](symposia.json) (`"status": "upcoming"` or `"past"`).
2. Save a `16:9` group photo in `assets/photos/symposia/`.
3. For past editions, place the static site files under `symposia/<year-city>/` (automatically whitelisted for `symposium-archive.html?edition=<id>`).

### 5. Regenerate `sitemap.xml`
Run after adding pages or updating datasets (also automated on `main` via [`.github/workflows/update-sitemap.yml`](.github/workflows/update-sitemap.yml)):

```bash
python3 scripts/build_sitemap.py
```

---

## Shareable Deep Links

| URL | Behavior |
|---|---|
| `index.html?inst=<id>#network` | Centers the Home map on the selected institution |
| `members.html?member=<id>` | Opens Members with that member's card expanded |
| `publications.html?member=<id>` | Filters Publications by member and opens their Spotlight |
| `publications.html?inst=<id>&group=institution` | Filters by institution or switches to the `By institution` view |
| `symposium-archive.html?edition=<id>` | Opens a past symposium edition inside the archive wrapper |

---

## Technical Stack

- **Styling:** [Tailwind CSS](https://tailwindcss.com) (Play CDN) + custom CSS tokens in `assets/css/styles.css`
- **Visualization:** [D3.js](https://d3js.org) `7.9.0` + [topojson-client](https://github.com/topojson/topojson-client) `3.1.0` + Natural Earth (`world-atlas`)
- **Typography:** Google Fonts (`Inter` and `Source Serif 4`)
- **SEO:** Canonical URLs, Open Graph, Twitter Cards, Schema.org JSON-LD, `robots.txt`, and `sitemap.xml`

---

## Maintainers

- **Riccardo Di Clemente** (`@ric-dicle`) — Website architecture, interactive D3 network map, OpenAlex pipeline, symposia archive integration, and SEO
- **Luca Pappalardo** (`@jonpappalord`) — Society coordination, content curation, member & publication review, and repository maintenance
- **Mattia Mazzoli** (`@mattiamazzoli`) — Initial website foundation, society coordination, content curation, and repository maintenance

Copyright © 2026 **European Mobility Society (EMoS)**.
