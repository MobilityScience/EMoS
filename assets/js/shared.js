/**
 * =============================================================================
 * European Mobility Society (EMoS) — Shared UI Chrome & Data Loader
 * -----------------------------------------------------------------------------
 * Loaded on every page before page-specific scripts:
 *   - Configures Tailwind Play CDN palette tokens (brand navy, teal, gold, ink)
 *   - Builds the adaptive top navbar (inline links or Popover menu via ResizeObserver)
 *   - Fetches publications.json and symposia.json and computes institution graph
 *     links, author matching, topic badges, avatar frames, and logo frames
 *
 * Exposes global `window.EMOS` API for home.js, members.js, publications.js,
 * symposia.js, and symposium-archive.js.
 *
 * Copyright (c) 2026 European Mobility Society (EMoS)
 * Project: https://mobilityscience.github.io/EMoS/
 * =============================================================================
 */

// Configure Tailwind theme palette across all static HTML pages
if (window.tailwind) {
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          display: ['"Source Serif 4"', 'Georgia', 'serif']
        },
        colors: {
          ink:   { 900: '#0f1b2d', 700: '#33415a', 500: '#64748b' },
          brand: { 50: '#eef3fb', 100: '#d9e4f5', 500: '#2f5aa8', 600: '#244a8f', 700: '#052b63' },
          teal:  { 50: '#ecfaf9', 100: '#ccf5f2', 500: '#0aa0a0', 600: '#088282', 700: '#066666' },
          gold:  { 50: '#fdf7e8', 400: '#e5b549', 500: '#d19e2a', 700: '#8a6514' }
        }
      }
    }
  };
}

window.EMOS = (function () {
  /** Escape special HTML characters before interpolating strings into DOM templates. */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  /** Normalize accents/punctuation into a lowercase URL-safe slug identifier. */
  const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  /** Return up to two uppercase initials for portrait fallback badges. */
  const initials = name => name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  /** Extract surname portion (tokens after the first given name) for alphabetical sorting. */
  const surname = name => name.split(/\s+/).slice(1).join(' ') || name;
  /** Extract first given name for fallback sample copy. */
  const firstName = name => name.split(/\s+/)[0];

  /** Load OddBird Popover API polyfill on older browsers lacking native HTMLElement.prototype.popover. */
  function ensurePopoverSupport() {
    if (!Object.hasOwn(HTMLElement.prototype, 'popover')) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@oddbird/popover-polyfill@0.6.1/dist/popover.min.js';
      s.defer = true;
      document.head.appendChild(s);
    }
  }

  /** Switch #site-menu between inline horizontal links and mobile popover drawer based on container width. */
  function initNavbar() {
    ensurePopoverSupport();
    const header = document.querySelector('.site-header');
    const inner = header?.querySelector('.header-inner');
    const menu = document.getElementById('site-menu');
    if (!header || !inner || !menu) return;

    let lastWidth = 0;
    /** Measure whether inline links fit inside .header-inner without overflowing and toggle .is-wide. */
    function syncLayout(forceCheck = false) {
      const w = header.clientWidth;
      const isWideNow = header.classList.contains('is-wide');
      if (!forceCheck && !isWideNow && w <= lastWidth) {
        lastWidth = w;
        return;
      }
      lastWidth = w;

      const wasOpen = menu.matches(':popover-open') || menu.classList.contains(':popover-open');
      header.classList.add('is-measuring');
      header.classList.add('is-wide');
      menu.removeAttribute('popover');

      const fits = inner.scrollWidth <= inner.clientWidth + 1;
      header.classList.toggle('is-wide', fits);

      if (!fits) {
        menu.setAttribute('popover', 'auto');
        if (wasOpen && typeof menu.showPopover === 'function') {
          try { menu.showPopover(); } catch (_) {}
        }
      }

      requestAnimationFrame(() => header.classList.remove('is-measuring'));
    }

    const ro = new ResizeObserver(() => syncLayout(false));
    ro.observe(header);
    ro.observe(menu);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => syncLayout(true));
    }
    syncLayout(true);
  }

  /** Hydrate shared page chrome: current footer year, society title spans, and responsive navigation. */
  function initChrome() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    document.querySelectorAll('.society-name').forEach(el => {
      el.textContent = window.EMOS_DATA.SOCIETY_NAME;
    });
    initNavbar();
  }

  /** Render a member portrait with graceful initial-badge fallback if the photo is missing or fails to load. */
  function avatarHtml(m, sizeClass = 'h-14 w-14 text-sm', shapeClass = 'rounded-2xl') {
    const fallback = `<span class="avatar-fallback ${sizeClass} ${shapeClass} shrink-0 bg-gradient-to-br from-brand-50 to-teal-50 text-brand-700 ring-1 ring-brand-100 flex items-center justify-center font-semibold">${esc(initials(m.name))}</span>`;
    if (!m.photo) return fallback;
    return `<span class="relative ${sizeClass} shrink-0 inline-flex items-center justify-center">
      <img src="${esc(m.photo)}" alt="" loading="lazy" class="h-full w-full ${shapeClass} object-cover object-[center_20%] ring-2 ring-white shadow-sm"
           onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden');" />
      <span class="hidden h-full w-full ${shapeClass} bg-gradient-to-br from-brand-50 to-teal-50 text-brand-700 ring-1 ring-brand-100 flex items-center justify-center font-semibold">${esc(initials(m.name))}</span>
    </span>`;
  }

  /** Render an institution logo inside a standardized frame (sized for both square crests and wide wordmarks). */
  function instLogoHtml(i, boxClass = 'h-12 w-24') {
    if (!i.logo) {
      return `<span class="${boxClass} inst-logo-frame text-xs font-bold text-brand-700 bg-brand-50">${esc(i.short)}</span>`;
    }
    return `<span class="${boxClass} inst-logo-frame" title="${esc(i.name)}">
      <img src="${esc(i.logo)}" alt="${esc(i.name)} logo" loading="lazy" />
    </span>`;
  }

  /** Render a Mobility Science topic pill badge, either static or clickable for instant topic filtering. */
  function topicTagHtml(t, clickable = false) {
    const st = window.EMOS_DATA.TOPIC_STYLES[t] || { pill: 'bg-slate-100 text-ink-700 ring-slate-300', dot: 'bg-slate-400' };
    if (clickable) {
      return `<button type="button" data-topic-pick="${esc(t)}" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 transition hover:opacity-80 ${st.pill}"><span class="h-1.5 w-1.5 rounded-full ${st.dot}"></span>${esc(t)}</button>`;
    }
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${st.pill}"><span class="h-1.5 w-1.5 rounded-full ${st.dot}"></span>${esc(t)}</span>`;
  }

  /**
   * Fetch requested JSON datasets (publications.json and/or symposia.json),
   * link publications to EMoS members/institutions, build the undirected
   * inter-institution collaboration graph, and return shared helper functions.
   */
  function loadData({ needPublications = true, needSymposia = false } = {}) {
    const data = window.EMOS_DATA;
    const institutions = data.INSTITUTIONS;
    const members = data.MEMBERS.map(m => ({ ...m, id: m.id || slug(m.name) }));

    const instById = Object.fromEntries(institutions.map(i => [i.id, i]));
    const memberById = Object.fromEntries(members.map(m => [m.id, m]));
    const nameKey = s => slug(s).replace(/-/g, '');
    const memberByName = {};
    members.forEach(m => [m.name, ...(m.aliases || [])].forEach(n => {
      memberByName[nameKey(n)] = m.id;
    }));
    const memberOfAuthor = a => memberByName[nameKey(a)] || null;

    if (data.USE_SAMPLE_CONTENT) {
      members.forEach(m => {
        const insts = m.institutions.map(id => instById[id]?.name || id).join(' and ');
        if (!m.bio) {
          m.bio = `${firstName(m.name)} is a member of the society based at ${insts}. A short biography will appear here.`;
          m.sampleBio = true;
        }
      });
    }

    const pubsPromise = needPublications
      ? fetch(data.PUBLICATIONS_URL, { cache: 'no-cache' })
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
          .then(
            raw => Array.isArray(raw) ? { pubs: raw, meta: {} } : { pubs: raw.publications || [], meta: raw },
            err => {
              console.error('Could not load publications:', err);
              const bar = document.createElement('div');
              bar.className = 'bg-gold-50 border-b border-gold-400 px-4 py-2 text-center text-sm text-gold-700';
              bar.textContent = `Publications could not be loaded from "${data.PUBLICATIONS_URL}". Serve the site from an HTTP web server.`;
              document.body.prepend(bar);
              return { pubs: [], meta: {} };
            }
          )
      : Promise.resolve({ pubs: [], meta: {} });

    const sympPromise = needSymposia
      ? fetch(data.SYMPOSIA_URL, { cache: 'no-cache' })
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
          .catch(() => ({ symposia: [], events: [] }))
      : Promise.resolve({ symposia: [], events: [] });

    return Promise.all([pubsPromise, sympPromise]).then(([{ pubs, meta }, symposiaData]) => {
      const publications = pubs.filter(p => p && p.title && Array.isArray(p.authors));
      publications.forEach(p => {
        const explicit = (p.members || []).map(x => memberById[x] ? x : memberOfAuthor(x)).filter(Boolean);
        p.members = [...new Set([...p.authors.map(memberOfAuthor).filter(Boolean), ...explicit])];
      });

      const connections = [];
      const connByKey = {};
      const pairKey = (a, b) => [a, b].sort().join('|');
      /** Normalize and record an undirected collaboration edge (a <-> b) with deduplicated works. */
      function addWork(a, b, work) {
        if (a === b) return;
        const k = pairKey(a, b);
        if (!connByKey[k]) {
          const [from, to] = k.split('|');
          connByKey[k] = { id: 'c' + connections.length, from, to, works: [] };
          connections.push(connByKey[k]);
        }
        if (!connByKey[k].works.includes(work)) connByKey[k].works.push(work);
      }
      publications.forEach(p => {
        for (let i = 0; i < p.members.length; i++) {
          for (let j = i + 1; j < p.members.length; j++) {
            memberById[p.members[i]].institutions.forEach(a =>
              memberById[p.members[j]].institutions.forEach(b => addWork(a, b, p))
            );
          }
        }
      });
      data.EXTRA_CONNECTIONS.forEach(c =>
        c.works.forEach(w => addWork(c.from, c.to, { ...w, authors: w.authors || [], extra: true }))
      );

      /** Sort helper: newest year first, then alphabetical by title. */
      const byRecent = (a, b) => b.year - a.year || a.title.localeCompare(b.title);
      /** Return all publications authored by member `id`, sorted most recent first. */
      const pubsOf = id => publications.filter(p => p.members.includes(id)).sort(byRecent);
      /** Pick up to 2 highest-impact publications for a member (most cited, then newest). */
      const featuredOf = m => [...pubsOf(m.id)].sort((a, b) => (b.cites || 0) - (a.cites || 0) || b.year - a.year).slice(0, 2);
      /** Return EMoS members affiliated with institution `id`, sorted by surname. */
      const peopleAt = id => members.filter(m => m.institutions.includes(id)).sort((a, b) => surname(a.name).localeCompare(surname(b.name)));
      /** Return all collaboration edges incident to institution `id`. */
      const linksOf = id => connections.filter(c => c.from === id || c.to === id);
      /** Look up the undirected collaboration edge between institutions `a` and `b`. */
      const findLink = (a, b) => connByKey[pairKey(a, b)];

      /** Format an author list with clickable EMoS member links, collapsing middle non-EMoS authors past `max`. */
      function authorsHtml(p, max = 12) {
        const shown = p.authors.map((a, i) => ({ a, i, m: memberOfAuthor(a) }));
        let list = shown;
        if (shown.length > max) {
          const keep = new Set([0, 1, 2, shown.length - 1, ...shown.filter(x => x.m).map(x => x.i)]);
          list = [];
          let gap = false;
          shown.forEach(x => {
            if (keep.has(x.i)) { list.push(x); gap = false; }
            else if (!gap) { list.push({ gap: true }); gap = true; }
          });
        }
        return list.map(x => x.gap ? '…'
          : x.m ? `<a href="members.html?member=${encodeURIComponent(x.m)}" class="font-semibold text-ink-900 hover:text-brand-600 hover:underline">${esc(x.a)}</a>`
          : esc(x.a)).join(', ');
      }

      /** Render a formatted bibliographic citation block (title link, linked EMoS authors, venue/year/cites, topics). */
      function pubHtml(p, compact = false) {
        const title = p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" class="hover:text-brand-600">${esc(p.title)}</a>` : esc(p.title);
        const topics = Array.isArray(p.topics) && p.topics.length && !compact
          ? `<div class="mt-2 flex flex-wrap gap-1.5">${p.topics.map(t => topicTagHtml(t, true)).join('')}</div>`
          : '';
        return `
          <div class="${compact ? 'text-sm' : ''}">
            <p class="font-semibold leading-snug text-ink-900">${title}${p.sample ? ' <span class="ml-1 align-middle rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">sample</span>' : ''}</p>
            <p class="mt-1 ${compact ? 'text-xs' : 'text-sm'} text-ink-700">${authorsHtml(p)}</p>
            <p class="mt-0.5 ${compact ? 'text-xs' : 'text-sm'} text-ink-500"><em>${esc(p.venue)}</em>${p.year ? ` · ${esc(p.year)}` : ''}${p.cites ? ` · ${p.cites} cite${p.cites === 1 ? '' : 's'}` : ''}</p>
            ${topics}
          </div>`;
      }

      return {
        institutions, members, instById, memberById, publications, meta, symposiaData,
        connections, byRecent, pubsOf, featuredOf, peopleAt, linksOf, findLink,
        authorsHtml, pubHtml
      };
    });
  }

  return {
    esc, slug, initials, surname, firstName,
    initChrome, avatarHtml, instLogoHtml, topicTagHtml, loadData
  };
})();
