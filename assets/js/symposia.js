/**
 * =============================================================================
 * European Mobility Society (EMoS) — Symposia & Events Page
 * -----------------------------------------------------------------------------
 * Powers symposia.html from symposia.json:
 *   - Highlights upcoming editions (status === "upcoming") in the featured banner
 *   - Renders the 3-column Past Editions archive cards (2026 Exeter, 2025 Turin,
 *     2024 Pisa) with 16:9 group photos routing through symposium-archive.html
 *   - Optionally displays related community events when `events[]` is populated
 *
 * Depends on: assets/js/data.js, assets/js/shared.js, symposia.json
 *
 * Copyright (c) 2026 European Mobility Society (EMoS)
 * Project: https://mobilityscience.github.io/EMoS/
 * =============================================================================
 */
(function () {
  window.EMOS.initChrome();

  window.EMOS.loadData({ needPublications: false, needSymposia: true }).then(({ symposiaData }) => {
    const { esc } = window.EMOS;

    const symposiaItems = (symposiaData?.symposia || []).slice().sort((a, b) => (b.year || 0) - (a.year || 0));
    const upcomingSymposia = symposiaItems.filter(s => s.status === 'upcoming');
    const pastSymposia = symposiaItems.filter(s => s.status !== 'upcoming');

    document.getElementById('symposia-upcoming').innerHTML = upcomingSymposia.length ? upcomingSymposia.map(s => `
      <article class="card-lift rounded-2xl border border-teal-500/30 bg-gradient-to-br from-brand-700 to-teal-700 p-6 sm:p-7 text-white shadow-md">
        <header class="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-teal-100">${esc(s.dates)} · ${esc(s.city)}, ${esc(s.country)}</p>
            <h3 class="mt-1 font-display text-2xl font-bold text-white">${esc(s.edition)}</h3>
          </div>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
            <span class="h-1.5 w-1.5 rounded-full bg-gold-400"></span>
            <span>Upcoming · ${esc(s.year)}</span>
          </span>
        </header>
        <p class="mt-3 text-sm text-white/90 leading-relaxed">${esc(s.summary)}</p>
        ${s.venue ? `<p class="mt-2 text-xs text-teal-100">Venue: ${esc(s.venue)}</p>` : ''}
        ${s.archiveUrl ? `<footer class="mt-4"><a href="${esc(s.archiveUrl)}" class="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-teal-50">View edition page <span class="sr-only">(${esc(s.edition)})</span> →</a></footer>` : ''}
      </article>`).join('') : '<p class="text-sm text-ink-500">Next edition details will be announced soon.</p>';

    /** Route local archived symposium folders through the encapsulated viewer (?edition=<slug>). */
    const archiveHref = s => {
      const m = String(s.archiveUrl || '').match(/symposia\/([^/]+)\//);
      return m ? `symposium-archive.html?edition=${encodeURIComponent(m[1])}` : s.archiveUrl;
    };

    document.getElementById('symposia-past').innerHTML = pastSymposia.length ? pastSymposia.map(s => {
      const href = archiveHref(s);
      return `
      <article class="card-lift overflow-clip flex flex-col justify-between rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-teal-500/40">
        <div>
          ${s.photo ? `
            <a href="${esc(href)}" class="block overflow-clip bg-slate-100 border-b border-slate-200/80">
              <img src="${esc(s.photo)}" alt="${esc(s.photoAlt || s.edition)}" width="1280" height="720"
                   class="aspect-video w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
            </a>` : ''}
          <div class="p-6 pb-4">
            <header class="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-teal-700">${esc(s.dates)} · ${esc(s.city)}, ${esc(s.country)}</p>
                <h3 class="mt-1 font-display text-xl font-bold text-ink-900">
                  <a href="${esc(href)}" class="hover:text-brand-600">${esc(s.edition)}</a>
                </h3>
              </div>
              <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">${esc(s.year)}</span>
            </header>
            <p class="mt-2.5 text-sm text-ink-700 leading-relaxed">${esc(s.summary)}</p>
            ${s.venue ? `<p class="mt-2 text-xs text-ink-500">Venue: ${esc(s.venue)}</p>` : ''}
          </div>
        </div>
        <footer class="mx-6 mb-6 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-sm">
          <a href="${esc(href)}" class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-1.5 font-medium text-white hover:bg-brand-600">
            Open archived edition <span class="sr-only">(${esc(s.edition)})</span> →
          </a>
          ${s.originalUrl ? `<a href="${esc(s.originalUrl)}" target="_blank" rel="noopener" class="font-medium text-ink-500 hover:text-brand-600">Original URL <span class="sr-only">for ${esc(s.edition)}</span> ↗</a>` : ''}
        </footer>
      </article>`;
    }).join('') : '<p class="col-span-full text-sm text-ink-500">No past editions listed yet.</p>';

    const eventItems = symposiaData?.events || [];
    if (eventItems.length) {
      document.getElementById('events-section').classList.remove('hidden');
      document.getElementById('events-list').innerHTML = eventItems.map(ev => `
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="font-semibold text-ink-900">${ev.url ? `<a href="${esc(ev.url)}" target="_blank" rel="noopener" class="hover:text-brand-600">${esc(ev.title)}</a>` : esc(ev.title)}</h3>
            ${ev.dates ? `<span class="text-xs font-medium text-ink-500">${esc(ev.dates)}</span>` : ''}
          </header>
          ${ev.location ? `<p class="mt-1 text-xs text-ink-500">${esc(ev.location)}</p>` : ''}
          ${ev.description ? `<p class="mt-2 text-sm text-ink-700">${esc(ev.description)}</p>` : ''}
        </article>`).join('');
    }
  });
})();
