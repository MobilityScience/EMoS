# European Mobility Society website

A single-page website for the society. It has four sections:

- **Home:** an interactive map of member institutions across Europe.
- **About:** the society's philosophy.
- **Members:** the people in the society.
- **Publications:** recent papers by members.

Everything runs in the browser. There is no build step and no server code.

## Files

| File | What it contains |
|---|---|
| `index.html` | The page: layout, styles, script, members, institutions and the About text. |
| `publications.json` | The list of papers. The page reads it each time it opens. |

Both files must sit in the same folder.

## Publishing on GitHub Pages

1. Upload `index.html` and `publications.json` to the root of the repository.
2. Go to **Settings → Pages**. Choose **Deploy from a branch**, then branch `main` and folder `/ (root)`, and save.
3. The site appears at `https://<username>.github.io/<repository>/` after a minute or two.

File names are case-sensitive.

The page will **not** load the papers if `index.html` is opened directly from disk, because browsers block reading local files. To test on your own computer, start a small local server in the folder and open `http://localhost:8000`:

```bash
python3 -m http.server
```

## Using the site

### Home: the network map

The map shows each member institution as a circle with its short name. Countries that host a member are shaded slightly darker.

| Action | Result |
|---|---|
| Hover over an institution | Shows its name, city and number of members. |
| Click an institution | Selects it and opens a popup listing its members. Institutions it has no collaborations with fade out. |
| Click a name in the popup | Opens that person's card on the Members page. |
| Click a second institution | If the two share work, a gold line appears between them and a side panel lists their common works and members. Otherwise a note says so, and the second institution becomes the new selection. |
| Click the selected institution again, click the map background, or press **Esc** | Clears the selection. |
| Drag, scroll, or use **+ / −** | Pans and zooms. **Reset view** returns to the start. |
| Click an institution in the list under the map | Same as clicking its marker. |

Collaboration lines stay hidden until two institutions are selected, which keeps the map clean.

On phones, the popup sits at the bottom of the map and the side panel opens as a sheet from the bottom of the screen.

### About

Static text describing why the society exists, how it works, and its values. Edit it directly in `index.html`, in the section with `id="view-about"`.

### Members

- **Cards:** one per person, sorted by surname, with a search box that matches names, institutions, cities and countries.
- **Expanding a card:** click it to show the person's institutions with a **Map →** link, their bio, their two key publications, and a link to all their publications.

### Publications

- **List:** every paper in `publications.json`, grouped by year with the newest first.
- **Filters:** search by title, author or venue, or filter by member.
- **Authors:** society members appear in bold and link to their card. Lists longer than 12 authors are shortened around the members.
- **Last update:** the date in the file's `updated` field is shown above the list.

### Links you can share

| Address | Opens |
|---|---|
| `#home` | Home page and map |
| `#about` | About page |
| `#members` | Members page |
| `#members/mattia-mazzoli` | Members page with that person's card open |
| `#publications` | All publications |
| `#publications/mattia-mazzoli` | Publications filtered to that person |

A member's id is their name in lowercase, without accents, with hyphens instead of spaces. For example, `José Javier Ramasco` becomes `jose-javier-ramasco`.

## How the data fits together

```
publications.json ──► papers ──► authors matched to members by name
                                         │
members (index.html) ──► each member belongs to one or more institutions
                                         │
                                         ▼
     two members at different institutions on the same paper
              = a collaboration between those institutions (map line)
```

Everything is derived from the paper list. Nothing about collaborations is entered by hand. The same list feeds three things:

- **Publications page:** all papers.
- **Member cards:** each member's two most-cited papers. Ties go to the more recent paper.
- **Map:** a line between two institutions whenever members at both co-authored a paper. The side panel lists those papers.

If a member belongs to two institutions, as Riccardo Di Clemente does, their papers count for both.

## Updating the papers (`publications.json`)

Edit the file on GitHub (pencil icon → commit). The live site updates within a couple of minutes, and the page always fetches the latest version.

```json
{
  "updated": "2026-10-23",
  "source": "OpenAlex — each member's 5 most recent published papers (no preprints)",
  "publications": [
    {
      "title": "Paper title",
      "authors": ["First Author", "Mattia Mazzoli", "Last Author"],
      "venue": "Journal name",
      "year": 2026,
      "url": "https://doi.org/10.xxxx/xxxxx",
      "cites": 3
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Paper title. |
| `authors` | yes | All authors, in order, as written on the paper. |
| `venue` | no | Journal or conference. |
| `year` | no | Used to sort and group. |
| `url` | no | Usually the DOI link. Makes the title clickable. |
| `cites` | no | Citation count. Used to pick each member's two featured papers. Use `0` if unknown. |
| `members` | no | Member names or ids, to link someone whose name in `authors` doesn't match. |
| `id` | no | Any unique string. Not shown. |

**How authors are matched to members:** each name in `authors` is compared with the members' names and `aliases` in `index.html`, ignoring accents and capitals. If a member publishes under a different spelling, add that spelling to their `aliases` once. An example is "Carmen Cabrera-Arnau" for Carmen Cabrera.

**Check the file before uploading.** A missing comma or quote stops the page from loading any papers, and the page then shows a yellow notice at the top. Paste the file into a JSON validator such as jsonlint.com before committing.

The file can also be a plain list of papers (`[ {...}, {...} ]`) without the `updated` and `source` fields.

## Editing settings in `index.html`

All editable data sits at the top of the main `<script>` block, under `DATA — edit these`.

| Setting | What it does |
|---|---|
| `SOCIETY_NAME` | Name shown in the menu bar, page title, home page and footer. |
| `USE_SAMPLE_CONTENT` | When `true`, members without a bio get a placeholder bio marked "sample". Set it to `false` once real bios are in. |
| `institutions` | The map nodes. |
| `members` | The people. |
| `PUBLICATIONS_URL` | Where the paper list is loaded from. Default: `publications.json`. |
| `extraConnections` | Optional common works that aren't papers, such as events or projects. They are added to the map links. |
| `CURVE_STRENGTH` | How much the map lines bend. `0` gives straight lines. |
| `COUNTRIES_URL` | Source of the country borders. |

### Adding an institution

```js
{ id: 'ucl', name: 'University College London', short: 'UCL', city: 'London', country: 'United Kingdom', lat: 51.5246, lng: -0.1340 }
```

- **`id`:** a short unique key that members refer to.
- **`short`:** the label inside the map marker, up to about 5 characters.
- **`lat` / `lng`:** the location. Institutions in the same city are nudged apart automatically so their markers don't overlap.
- **`country`:** must match the country name in the map data (for example `United Kingdom`, `Italy`, `Spain`) for the country to be shaded.

### Adding a member

```js
{ name: 'Mattia Mazzoli', institutions: ['isi'], bio: 'Short biography…', aliases: ['M. Mazzoli'] }
```

- **`institutions`:** one or more institution `id`s.
- **`bio`:** plain text shown when the card is expanded.
- **`aliases`:** optional. Other spellings of the name used on papers.

### Adding a non-paper collaboration

```js
const extraConnections = [
  { from: 'exeter', to: 'isi', works: [{ title: 'Joint summer school', type: 'Event', year: 2026, url: 'https://…' }] }
];
```

### Changing the logo

In the menu bar, replace the `<span>` that shows the letter "E" with an `<img src="logo.png" alt="" class="h-9 w-9">`, and upload `logo.png` next to `index.html`.

## Technical notes

- **Libraries** (loaded from CDNs):
  - [Tailwind CSS](https://tailwindcss.com) (Play CDN) for styling.
  - [D3](https://d3js.org) 7.9.0 for the map.
  - [topojson-client](https://github.com/topojson/topojson-client) 3.1.0.
  - Google Fonts: Inter and Source Serif 4.
- **Map data:** country borders come from Natural Earth (public domain), via the [world-atlas](https://github.com/topojson/world-atlas) package.
- **Pages:** Home, About, Members and Publications are all in one HTML file and switch using the part of the address after `#`. This works on GitHub Pages with no extra setup.
- **Browser console:** Tailwind's Play CDN logs a warning that it isn't meant for production. The site works normally. For a production build, Tailwind can be compiled into a static stylesheet.
- **Publications data:** the initial list was compiled from [OpenAlex](https://openalex.org) in October 2026, taking each member's five most recent published papers and excluding preprints.
