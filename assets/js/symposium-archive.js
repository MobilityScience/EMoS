/**
 * =============================================================================
 * European Mobility Society (EMoS) — Encapsulated Symposium Archive Viewer
 * -----------------------------------------------------------------------------
 * Powers symposium-archive.html:
 *   - Validates the `?edition=<slug>` query parameter strictly against past
 *     editions listed in symposia.json (preventing unvalidated iframe targets)
 *   - Keeps the main EMoS header, edition switcher bar, standalone link, and
 *     sticky footer visible around the archived static symposium snapshot
 *
 * Depends on: assets/js/data.js, assets/js/shared.js, symposia.json
 *
 * Copyright (c) 2026 European Mobility Society (EMoS)
 * Project: https://mobilityscience.github.io/EMoS/
 * =============================================================================
 */
(function () {
  window.EMOS.initChrome();

  /** Extract the safe edition directory slug (e.g. "2026-exeter") from a local archiveUrl. */
  function slugOf(url) {
    const m = String(url || '').match(/symposia\/([^/]+)\//);
    return m ? m[1] : '';
  }

  window.EMOS.loadData({ needPublications: false, needSymposia: true }).then(({ symposiaData }) => {
    const { esc } = window.EMOS;

    const past = (symposiaData?.symposia || [])
      .filter(s => s.status !== 'upcoming' && s.archiveUrl)
      .sort((a, b) => (b.year || 0) - (a.year || 0));

    if (!past.length) {
      location.replace('symposia.html');
      return;
    }

    const req = new URLSearchParams(location.search).get('edition') || '';
    const current = past.find(s => slugOf(s.archiveUrl) === req) || past[0];
    const currentSlug = slugOf(current.archiveUrl);

    document.title = `${current.edition} (${current.city} ${current.year}) — European Mobility Society`;
    document.getElementById('archive-title').textContent = current.edition;
    document.getElementById('archive-meta').textContent = `${current.dates} · ${current.city}, ${current.country}`;

    const standalone = document.getElementById('archive-standalone');
    standalone.href = current.archiveUrl;

    document.getElementById('archive-switcher').innerHTML = past.map(s => {
      const slug = slugOf(s.archiveUrl);
      const active = slug === currentSlug;
      return `<a href="symposium-archive.html?edition=${encodeURIComponent(slug)}" ${active ? 'aria-current="page"' : ''}
        class="rounded-lg px-2.5 py-1 text-xs font-semibold transition ${active ? 'bg-brand-700 text-white shadow-sm' : 'bg-white text-ink-700 ring-1 ring-slate-200 hover:bg-slate-50'}">
        ${esc(s.year)} ${esc(s.city)}
      </a>`;
    }).join('');

    const frame = document.getElementById('archive-frame');
    frame.title = `${current.edition} (${current.city}, ${current.year}) archived website`;
    frame.src = current.archiveUrl;
  });
})();
