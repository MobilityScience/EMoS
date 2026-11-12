/**
 * =============================================================================
 * European Mobility Society (EMoS) — Members Directory Page
 * -----------------------------------------------------------------------------
 * Powers members.html:
 *   - Sorts all 23 researchers alphabetically by surname and supports live text
 *     filtering by name, institution, city, or country
 *   - Renders person-first member cards (portrait, affiliation, bio teaser, and
 *     compact institution badges) that smoothly morph on click into full
 *     institution links (`Map ->`), complete bio, Key publications, and the
 *     `All publications ->` deep link
 *   - Supports `?member=<slug>` deep linking to auto-open and scroll to a card
 *
 * Depends on: assets/js/data.js, assets/js/shared.js, publications.json
 *
 * Copyright (c) 2026 European Mobility Society (EMoS)
 * Project: https://mobilityscience.github.io/EMoS/
 * =============================================================================
 */
(function () {
  window.EMOS.initChrome();

  window.EMOS.loadData({ needPublications: true, needSymposia: false }).then(ctx => {
    const { esc, surname, avatarHtml, instLogoHtml } = window.EMOS;
    const { members, publications, instById, memberById, featuredOf, pubsOf, pubHtml } = ctx;
    const sinceYear = publications.length ? Math.min(...publications.map(p => p.year).filter(Boolean)) : 2021;

    const grid = document.getElementById('members-grid');
    const searchInput = document.getElementById('member-search');
    const sortedMembers = [...members].sort((a, b) => surname(a.name).localeCompare(surname(b.name)));

    const initialMember = new URLSearchParams(location.search).get('member');
    let expandedId = initialMember && memberById[initialMember] ? initialMember : null;

    /* --- Member directory renderer (person-first summary + morphing details) --- */
    /**
     * Filter the surname-sorted directory against #member-search and render
     * person-first cards whose summary header morphs smoothly when expanded.
     */
    function renderMembers() {
      const q = searchInput.value.trim().toLowerCase();
      const list = sortedMembers.filter(m => {
        if (!q) return true;
        const hay = [m.name, ...m.institutions.flatMap(id => [instById[id].name, instById[id].short, instById[id].city, instById[id].country])].join(' ').toLowerCase();
        return hay.includes(q);
      });
      document.getElementById('member-count').textContent = `${list.length} of ${members.length} members`;
      grid.innerHTML = list.length ? list.map(m => {
        const open = m.id === expandedId;
        const feat = featuredOf(m);
        const total = pubsOf(m.id).length;
        const primaryInst = instById[m.institutions[0]];
        return `
        <article id="member-${m.id}" class="${open ? 'is-expanded ring-2 ring-teal-500/25 border-teal-500' : 'border-slate-200'} card-lift rounded-2xl border bg-white shadow-sm hover:shadow-md scroll-mt-24 overflow-clip">
          <button type="button" data-toggle="${m.id}" aria-expanded="${open}" aria-controls="details-${m.id}" class="w-full p-5 text-left cursor-pointer">
            <div class="flex items-start gap-4">
              ${avatarHtml(m, 'h-24 w-24 text-xl', 'rounded-2xl')}
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <h2 class="font-display text-xl font-bold leading-tight text-ink-900">${esc(m.name)}</h2>
                  <svg aria-hidden="true" class="chevron h-5 w-5 shrink-0 text-ink-500 transition-transform mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <p class="mt-1 text-sm font-medium text-brand-700 leading-snug">${m.institutions.map(id => esc(instById[id].name)).join(' · ')}</p>
                <p class="mt-0.5 text-xs text-ink-500">${esc(primaryInst.city)}, ${esc(primaryInst.country)}</p>
                ${m.bio ? `<div class="member-summary-collapse"><div><p class="mt-2 text-xs text-ink-600 leading-relaxed line-clamp-2">${esc(m.bio)}</p></div></div>` : ''}
              </div>
            </div>
            <div class="member-summary-collapse">
              <div>
                <div class="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div class="flex flex-wrap items-center gap-2 min-w-0">
                    ${m.institutions.map(id => instLogoHtml(instById[id], 'h-10 w-20 !p-1.5 !rounded-lg !border-slate-200/80')).join('')}
                  </div>
                  ${total ? `<span class="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 tabular-nums">${total} paper${total === 1 ? '' : 's'} (${sinceYear}+)</span>` : ''}
                </div>
              </div>
            </div>
          </button>

          <div id="details-${m.id}" class="member-details">
            <div>
              <div class="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                <ul class="space-y-2.5">
                  ${m.institutions.map(id => {
                    const i = instById[id];
                    return `
                    <li class="flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 p-2.5 border border-slate-200/70">
                      <span class="flex items-center gap-3 min-w-0">
                        ${instLogoHtml(i, 'h-12 w-24')}
                        <span class="min-w-0">
                          <span class="block text-sm font-medium text-ink-900 truncate">${esc(i.name)}</span>
                          <span class="block text-xs text-ink-500">${esc(i.city)}, ${esc(i.country)}</span>
                        </span>
                      </span>
                      <a href="index.html?inst=${encodeURIComponent(i.id)}#network" class="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-slate-200 hover:bg-teal-50">Map →</a>
                    </li>`;
                  }).join('')}
                </ul>
                <div>
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-ink-500">Bio</h3>
                  <p class="mt-1 text-sm text-ink-700 leading-relaxed">${esc(m.bio)}${m.sampleBio ? ' <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">sample</span>' : ''}</p>
                </div>
                <div>
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-ink-500">Key publications</h3>
                  ${feat.length
                    ? `<ul class="mt-2 space-y-3">${feat.map(p => `<li class="border-l-2 border-gold-400 pl-3">${pubHtml(p, true)}</li>`).join('')}</ul>`
                    : '<p class="mt-1 text-sm text-ink-500">No publications listed yet.</p>'}
                  ${total ? `<a href="publications.html?member=${encodeURIComponent(m.id)}" class="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-800 transition">All publications (${total} · ${sinceYear}+) →</a>` : ''}
                  <p class="mt-2 text-[11px] text-ink-500">Counts cover Mobility Science works indexed since ${sinceYear}, not lifetime career totals.</p>
                </div>
              </div>
            </div>
          </div>
        </article>`;
      }).join('') : '<p class="col-span-full text-sm text-ink-500">No members match your search.</p>';
    }

    renderMembers();
    searchInput.addEventListener('input', renderMembers);

    if (expandedId) {
      requestAnimationFrame(() => document.getElementById('member-' + expandedId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }

    grid.addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle]');
      if (!toggle) return;
      const id = toggle.dataset.toggle;
      expandedId = expandedId === id ? null : id;
      grid.querySelectorAll('article').forEach(a => {
        const on = a.id === 'member-' + expandedId;
        a.classList.toggle('is-expanded', on);
        a.classList.toggle('ring-2', on);
        a.classList.toggle('ring-teal-500/25', on);
        a.classList.toggle('border-teal-500', on);
        a.classList.toggle('border-slate-200', !on);
        a.querySelector('[data-toggle]')?.setAttribute('aria-expanded', on);
      });
    });
  });
})();
