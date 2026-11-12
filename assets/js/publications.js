/**
 * =============================================================================
 * European Mobility Society (EMoS) — Publications Catalogue Page
 * -----------------------------------------------------------------------------
 * Powers publications.html:
 *   - Multi-facet filtering of OpenAlex-curated Mobility Science publications
 *     (search query, EMoS member, institution, multi-select topic pills, and
 *     grouping by year or by institution) with bidirectional URL sync
 *   - Renders Author Spotlight and Institution Spotlight cards above results,
 *     including inline expandable `Member bio` and `Collaborations` drawers
 *     (partner institution logos, EMoS co-authors, and `Go to map ->` links)
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
    const { institutions, members, instById, memberById, publications, meta, pubsOf, linksOf, pubHtml } = ctx;
    const sinceYear = publications.length ? Math.min(...publications.map(p => p.year).filter(Boolean)) : 2021;
    const sinceEl = document.getElementById('pub-since-year');
    if (sinceEl) sinceEl.textContent = sinceYear;

    const pubSearch = document.getElementById('pub-search');
    const pubMember = document.getElementById('pub-member');
    const pubInst = document.getElementById('pub-inst');
    const pubGroupEl = document.getElementById('pub-group');
    const pubTopicsEl = document.getElementById('pub-topics');
    const pubResetBtn = document.getElementById('pub-reset');
    const pubSpotlightEl = document.getElementById('pub-spotlight');
    const pubListEl = document.getElementById('pub-list');
    const pubCountEl = document.getElementById('pub-count');

    const sortedMembers = [...members].sort((a, b) => surname(a.name).localeCompare(surname(b.name)));
    const sortedInsts = [...institutions].sort((a, b) => a.name.localeCompare(b.name));

    pubMember.innerHTML += sortedMembers.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
    pubInst.innerHTML += sortedInsts.map(i => `<option value="${i.id}">${esc(i.name)} (${esc(i.short)})</option>`).join('');

    const instsOfPub = p => [...new Set(p.members.flatMap(mid => memberById[mid]?.institutions || []))];
    const allTopics = meta.topics?.length ? meta.topics : [...new Set(publications.flatMap(p => p.topics || []))];
    const selectedTopics = new Set();
    let groupByMode = 'year';
    let spotlightDrawer = { key: null, tab: null }; // tab: 'bio' | 'collab' | null

    /** Update active state classes and aria-pressed attributes on the Group-by segmented buttons. */
    function setGroupBy(mode) {
      groupByMode = mode === 'institution' ? 'institution' : 'year';
      pubGroupEl?.querySelectorAll('[data-group]').forEach(btn => {
        const active = btn.dataset.group === groupByMode;
        btn.setAttribute('aria-pressed', String(active));
        btn.className = active
          ? 'h-full rounded-lg px-3 text-xs font-semibold transition whitespace-nowrap bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/80'
          : 'h-full rounded-lg px-3 text-xs font-semibold transition whitespace-nowrap text-ink-600 hover:text-ink-900';
      });
    }

    // Hydrate initial filter state from query string (?inst=isi&group=institution, ?member=..., ?topic=...)
    const params = new URLSearchParams(location.search);
    const qInst = params.get('inst');
    const qMember = params.get('member');
    const qGroup = params.get('group');
    const qTopic = params.get('topic');

    if (qInst && instById[qInst]) {
      pubInst.value = qInst;
    } else if (qMember && memberById[qMember]) {
      pubMember.value = qMember;
    }
    if (qGroup && (qGroup === 'year' || qGroup === 'institution') && !pubInst.value && !pubMember.value) {
      setGroupBy(qGroup);
    } else {
      setGroupBy('year');
    }
    if (qTopic && allTopics.includes(qTopic)) {
      selectedTopics.add(qTopic);
    }

    /* --- URL state sync & topic pill bar --- */
    /** Synchronize active filter controls (member, inst, group, single topic) into location.search. */
    function syncUrl() {
      const next = new URLSearchParams();
      if (pubMember.value) next.set('member', pubMember.value);
      if (pubInst.value) next.set('inst', pubInst.value);
      if (!pubInst.value && !pubMember.value && groupByMode === 'institution') next.set('group', 'institution');
      if (selectedTopics.size === 1) next.set('topic', [...selectedTopics][0]);
      const qs = next.toString();
      history.replaceState(null, '', qs ? `publications.html?${qs}` : 'publications.html');
    }

    /** Render the multi-select topic filter chips with counts computed from the current base filter subset. */
    function renderTopicBar(baseList) {
      if (!allTopics.length) { pubTopicsEl.classList.add('hidden'); return; }
      const allActive = selectedTopics.size === 0;
      const buttons = [
        `<button type="button" data-topic="" aria-pressed="${allActive}" class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${allActive ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-700 ring-slate-300 hover:bg-slate-50'}">All topics <span class="opacity-75 tabular-nums">(${baseList.length})</span></button>`
      ];
      allTopics.forEach(t => {
        const on = selectedTopics.has(t);
        const st = window.EMOS_DATA.TOPIC_STYLES[t] || { pill: 'bg-slate-100 text-ink-700 ring-slate-300', active: 'bg-brand-700 text-white ring-brand-700', dot: 'bg-slate-400' };
        const cnt = baseList.filter(p => (p.topics || []).includes(t)).length;
        const empty = cnt === 0 && !on;
        const cls = on
          ? st.active
          : empty
            ? 'bg-slate-50 text-ink-500 ring-slate-200 opacity-45 cursor-not-allowed'
            : `${st.pill} hover:opacity-85`;
        buttons.push(`<button type="button" data-topic="${esc(t)}" aria-pressed="${on}" ${empty ? 'disabled' : ''} class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${cls}">
          <span class="h-2 w-2 rounded-full ${on ? 'bg-white' : st.dot}"></span>
          <span>${esc(t)}</span>
          <span class="${on ? 'text-white/80' : 'opacity-70'} tabular-nums">(${cnt})</span>
        </button>`);
      });
      pubTopicsEl.innerHTML = buttons.join('');
    }

    /** Bucket a sorted publication array into `[year, items[]]` entries preserving sort order. */
    function groupByYear(items) {
      const map = new Map();
      items.forEach(p => {
        const y = p.year || 'Unknown';
        if (!map.has(y)) map.set(y, []);
        map.get(y).push(p);
      });
      return [...map.entries()];
    }

    /* --- Collaboration aggregation & shared spotlight drawer --- */
    /** Aggregate EMoS co-authors and collaborating partner institutions for a given member. */
    function getMemberCollaborations(m) {
      const ownSet = new Set(m.institutions);
      const coCounts = new Map();
      const instWorks = new Map();

      pubsOf(m.id).forEach(p => {
        p.members.forEach(oid => {
          if (oid === m.id || !memberById[oid]) return;
          coCounts.set(oid, (coCounts.get(oid) || 0) + 1);
          memberById[oid].institutions.forEach(iid => {
            if (!instById[iid]) return;
            if (!instWorks.has(iid)) instWorks.set(iid, new Set());
            instWorks.get(iid).add(p.title);
          });
        });
      });

      const coauthors = [...coCounts.entries()]
        .map(([id, shared]) => ({ member: memberById[id], shared }))
        .sort((a, b) => b.shared - a.shared || surname(a.member.name).localeCompare(surname(b.member.name)));

      const partnerInsts = [...instWorks.entries()]
        .map(([id, set]) => ({ inst: instById[id], shared: set.size, external: !ownSet.has(id) }))
        .sort((a, b) => Number(b.external) - Number(a.external) || b.shared - a.shared || a.inst.name.localeCompare(b.inst.name));

      return { coauthors, partnerInsts };
    }

    /** Aggregate partner institutions and external EMoS co-authors for a given institution. */
    function getInstCollaborations(inst) {
      const coCounts = new Map();
      const partnerInsts = linksOf(inst.id)
        .map(c => {
          const pid = c.from === inst.id ? c.to : c.from;
          c.works.forEach(w => {
            (w.members || []).forEach(mid => {
              const m = memberById[mid];
              if (m && !m.institutions.includes(inst.id)) {
                coCounts.set(mid, (coCounts.get(mid) || 0) + 1);
              }
            });
          });
          return { inst: instById[pid], shared: c.works.length };
        })
        .filter(x => x.inst)
        .sort((a, b) => b.shared - a.shared || a.inst.name.localeCompare(b.inst.name));

      const coauthors = [...coCounts.entries()]
        .map(([id, shared]) => ({ member: memberById[id], shared }))
        .sort((a, b) => b.shared - a.shared || surname(a.member.name).localeCompare(surname(b.member.name)));

      return { coauthors, partnerInsts };
    }

    /** Render the shared expandable Collaborations drawer used by both Author and Institution spotlights. */
    function renderCollabDrawer({ partnerInsts, coauthors, primaryMapHref, primaryMapLabel, emptyText, isOpen }) {
      const instSection = partnerInsts.length ? `
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-ink-500">Collaborating institutions</h3>
          <div class="mt-2 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            ${partnerInsts.map(({ inst: pi, shared }) => `
              <div class="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 hover:border-teal-500/35 transition">
                <a href="publications.html?inst=${encodeURIComponent(pi.id)}" class="flex items-center gap-2.5 min-w-0 group" title="View publications with ${esc(pi.name)}">
                  ${instLogoHtml(pi, 'h-9 w-20 !p-1.5')}
                  <span class="min-w-0">
                    <span class="block text-xs font-semibold text-ink-900 group-hover:text-brand-700 truncate">${esc(pi.short)}</span>
                    <span class="block text-[11px] text-ink-500 truncate">${esc(pi.city)} · ${shared} shared</span>
                  </span>
                </a>
                <a href="index.html?inst=${encodeURIComponent(pi.id)}#network" class="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-slate-200 hover:bg-teal-50">Map →</a>
              </div>`).join('')}
          </div>
        </div>` : '';

      const peopleSection = coauthors.length ? `
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-ink-500">Co-authoring EMoS members</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            ${coauthors.map(({ member: cm, shared }) => `
              <a href="publications.html?member=${encodeURIComponent(cm.id)}"
                 class="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5 hover:border-teal-500/40 hover:bg-teal-50/40 transition">
                ${avatarHtml(cm, 'h-8 w-8 text-[11px]', 'rounded-lg')}
                <span class="text-left leading-tight">
                  <span class="block text-xs font-semibold text-ink-900">${esc(cm.name)}</span>
                  <span class="block text-[11px] text-ink-500">${cm.institutions.map(id => esc(instById[id]?.short || id)).join('/')} · ${shared} shared</span>
                </span>
              </a>`).join('')}
          </div>
        </div>` : '';

      const body = (instSection || peopleSection)
        ? `${instSection}${peopleSection}`
        : `<p class="text-sm text-ink-600">${esc(emptyText)}</p>`;

      return `
        <div id="spotlight-collab-panel" class="member-details ${isOpen ? 'is-open' : ''}">
          <div>
            <div class="mt-5 pt-4 border-t border-slate-100 space-y-4">
              ${body}
              <div class="pt-1 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100/80">
                <span class="text-[11px] text-ink-500">Based on indexed EMoS co-authored works since ${sinceYear}.</span>
                <a href="${primaryMapHref}" class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition">
                  ${esc(primaryMapLabel)} →
                </a>
              </div>
            </div>
          </div>
        </div>`;
    }

    /* --- Author & Institution spotlight card renderer --- */
    /**
     * Render either the Author Spotlight (with expandable Member bio & Collaborations drawers)
     * or the Institution Spotlight card above the filtered publication list.
     */
    function renderSpotlight(who, whoInst, groupBy, count) {
      if (who && memberById[who]) {
        const m = memberById[who];
        const key = `member:${m.id}`;
        const activeTab = spotlightDrawer.key === key ? spotlightDrawer.tab : null;
        const bioOpen = activeTab === 'bio';
        const collabOpen = activeTab === 'collab';
        const bioText = m.bio ? esc(m.bio) : 'Biography not yet available.';
        const primaryInst = instById[m.institutions[0]];
        const mapHref = `index.html?inst=${encodeURIComponent(m.institutions[0])}#network`;
        const { coauthors, partnerInsts } = getMemberCollaborations(m);

        pubSpotlightEl.innerHTML = `
          <article id="spotlight-card" class="${activeTab ? 'border-teal-500/50' : 'border-slate-200'} rounded-2xl border bg-white p-5 sm:p-6 shadow-sm transition-colors">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div class="flex items-start sm:items-center gap-4 min-w-0">
                ${avatarHtml(m, 'h-20 w-20 text-lg', 'rounded-2xl')}
                <div class="min-w-0 space-y-1.5">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Author spotlight</p>
                  <h2 class="font-display text-2xl font-bold text-ink-900 leading-tight">${esc(m.name)}</h2>
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-700">
                    ${m.institutions.map(id => {
                      const inst = instById[id];
                      return `<a href="publications.html?inst=${encodeURIComponent(inst.id)}" class="hover:text-brand-700 hover:underline">${esc(inst.name)} <span class="text-ink-500">(${esc(inst.city)})</span></a>`;
                    }).join('<span class="text-ink-500" aria-hidden="true">·</span>')}
                  </div>
                </div>
              </div>
              <div class="flex flex-col sm:items-end gap-3 shrink-0">
                <div class="flex flex-wrap items-center gap-2.5">
                  ${m.institutions.map(id => `<a href="publications.html?inst=${encodeURIComponent(id)}" title="View publications from ${esc(instById[id].name)}">${instLogoHtml(instById[id], 'h-12 w-28 !p-2')}</a>`).join('')}
                </div>
                <div class="flex flex-wrap items-center gap-2 text-xs">
                  <span class="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">${count} paper${count === 1 ? '' : 's'} (${sinceYear}+)</span>
                  <button type="button" id="spotlight-bio-toggle" data-spotlight-key="${esc(key)}" data-spotlight-tab="bio" aria-expanded="${bioOpen}" aria-controls="spotlight-bio-panel"
                          class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-700 ring-1 ring-teal-500/20 hover:bg-teal-100 transition">
                    <span>Member bio</span>
                    <svg aria-hidden="true" class="chevron h-3.5 w-3.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <button type="button" id="spotlight-collab-toggle" data-spotlight-key="${esc(key)}" data-spotlight-tab="collab" aria-expanded="${collabOpen}" aria-controls="spotlight-collab-panel"
                          class="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 font-semibold text-gold-700 ring-1 ring-gold-400/40 hover:bg-gold-50/70 transition">
                    <span>Collaborations (${coauthors.length})</span>
                    <svg aria-hidden="true" class="chevron h-3.5 w-3.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <a href="${mapHref}" class="inline-flex items-center gap-1 rounded-full bg-brand-700 px-3 py-1 font-semibold text-white hover:bg-brand-800 transition">Go to map →</a>
                </div>
              </div>
            </div>
            <div id="spotlight-bio-panel" class="member-details ${bioOpen ? 'is-open' : ''}">
              <div>
                <div class="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-ink-500">Bio</h3>
                  <p class="text-sm text-ink-700 leading-relaxed">${bioText}</p>
                  <div class="pt-1 flex flex-wrap items-center gap-4 text-xs">
                    <a href="members.html?member=${encodeURIComponent(m.id)}" class="font-semibold text-teal-700 hover:text-brand-700 hover:underline">Open in Members directory →</a>
                    ${m.institutions.map(id => `<a href="index.html?inst=${encodeURIComponent(id)}#network" class="font-medium text-ink-500 hover:text-brand-700 hover:underline">${esc(instById[id].short)} on map →</a>`).join('')}
                  </div>
                </div>
              </div>
            </div>
            ${renderCollabDrawer({
              partnerInsts,
              coauthors,
              primaryMapHref: mapHref,
              primaryMapLabel: `Go to ${primaryInst ? primaryInst.short : 'network'} on map`,
              emptyText: `No cross-member EMoS papers indexed since ${sinceYear} yet.`,
              isOpen: collabOpen
            })}
          </article>`;
        pubSpotlightEl.classList.remove('hidden');
        return;
      }

      if (whoInst && instById[whoInst]) {
        const inst = instById[whoInst];
        const key = `inst:${inst.id}`;
        const activeTab = spotlightDrawer.key === key ? spotlightDrawer.tab : null;
        const collabOpen = activeTab === 'collab';
        const mapHref = `index.html?inst=${encodeURIComponent(inst.id)}#network`;
        const { partnerInsts, coauthors } = getInstCollaborations(inst);

        pubSpotlightEl.innerHTML = `
          <article id="spotlight-card" class="${collabOpen ? 'border-teal-500/50' : 'border-slate-200'} rounded-2xl border bg-white p-5 sm:p-6 shadow-sm transition-colors">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-4 min-w-0">
                ${instLogoHtml(inst, 'h-14 w-32 !p-2.5')}
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Institution spotlight</p>
                  <h2 class="font-display text-xl font-bold text-ink-900 leading-tight">${esc(inst.name)}</h2>
                  <p class="text-sm text-ink-500">${esc(inst.city)}, ${esc(inst.country)}</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs shrink-0">
                <span class="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">${count} paper${count === 1 ? '' : 's'} (${sinceYear}+)</span>
                <button type="button" id="spotlight-collab-toggle" data-spotlight-key="${esc(key)}" data-spotlight-tab="collab" aria-expanded="${collabOpen}" aria-controls="spotlight-collab-panel"
                        class="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 font-semibold text-gold-700 ring-1 ring-gold-400/40 hover:bg-gold-50/70 transition">
                  <span>Collaborations (${partnerInsts.length})</span>
                  <svg aria-hidden="true" class="chevron h-3.5 w-3.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <a href="${mapHref}" class="inline-flex items-center gap-1 rounded-full bg-brand-700 px-3 py-1 font-semibold text-white hover:bg-brand-800 transition">Go to map →</a>
              </div>
            </div>
            ${renderCollabDrawer({
              partnerInsts,
              coauthors,
              primaryMapHref: mapHref,
              primaryMapLabel: `Go to ${inst.short} on map`,
              emptyText: `No partner collaborations indexed for ${inst.short} since ${sinceYear} yet.`,
              isOpen: collabOpen
            })}
          </article>`;
        pubSpotlightEl.classList.remove('hidden');
        return;
      }

      pubSpotlightEl.classList.add('hidden');
      pubSpotlightEl.innerHTML = '';
    }

    /** Clear search query, member, institution, topics, and grouping back to defaults. */
    function resetAllFilters() {
      pubSearch.value = '';
      pubMember.value = '';
      pubInst.value = '';
      selectedTopics.clear();
      spotlightDrawer = { key: null, tab: null };
      setGroupBy('year');
      syncUrl();
      renderPubs();
    }

    /* --- Main publications feed renderer --- */
    /** Filter publications by search, member, institution, and topics, then render topic counts, spotlight, and list. */
    function renderPubs() {
      const q = pubSearch.value.trim().toLowerCase();
      const who = pubMember.value;
      const whoInst = pubInst.value;
      const groupBy = groupByMode;

      const baseList = publications
        .filter(p => !who || p.members.includes(who))
        .filter(p => !whoInst || instsOfPub(p).includes(whoInst))
        .filter(p => !q || [p.title, p.venue, ...p.authors, ...(p.topics || [])].join(' ').toLowerCase().includes(q));

      renderTopicBar(baseList);

      const hasActiveFilters = Boolean(q || who || whoInst || selectedTopics.size || groupBy !== 'year');
      if (pubResetBtn) pubResetBtn.classList.toggle('hidden', !hasActiveFilters);
      pubMember.classList.toggle('border-teal-600', Boolean(who));
      pubInst.classList.toggle('border-teal-600', Boolean(whoInst));

      const list = baseList
        .filter(p => !selectedTopics.size || (p.topics || []).some(t => selectedTopics.has(t)))
        .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

      renderSpotlight(who, whoInst, groupBy, list.length);

      const parts = [`${list.length} publication${list.length === 1 ? '' : 's'}`];
      if (who) parts.push(`by ${memberById[who].name}`);
      if (whoInst) parts.push(`at ${instById[whoInst].name}`);
      if (selectedTopics.size) parts.push(`in ${[...selectedTopics].join(', ')}`);
      if (meta.updated) parts.push(`· list updated ${meta.updated}`);
      pubCountEl.textContent = parts.join(' ');

      if (!list.length) {
        pubListEl.innerHTML = `<div class="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
          <p class="text-sm text-ink-600">No publications match your current search and topic filters.</p>
          <button type="button" data-reset-all class="inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition">Reset all filters</button>
        </div>`;
        return;
      }

      if (groupBy === 'institution' && !whoInst && !who) {
        const targetInsts = whoInst ? [instById[whoInst]] : sortedInsts;
        const groups = targetInsts
          .map(inst => ({ inst, items: list.filter(p => instsOfPub(p).includes(inst.id)) }))
          .filter(g => g.items.length);

        pubListEl.innerHTML = groups.length ? groups.map(({ inst, items }) => `
          <section>
            <h2 class="sticky top-[4.25rem] z-10 -mx-2 bg-[#fbfcfe]/95 backdrop-blur px-2 py-3 font-display text-2xl font-bold flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
              <span class="flex items-center gap-3.5">${instLogoHtml(inst, 'h-11 w-24')}<span>${esc(inst.name)} <span class="text-base font-sans font-medium text-ink-500">(${esc(inst.city)}, ${esc(inst.country)})</span></span></span>
              <span class="text-xs font-sans font-semibold rounded-full bg-brand-50 text-brand-700 px-3 py-1">${items.length} paper${items.length === 1 ? '' : 's'} (${sinceYear}+)</span>
            </h2>
            <ol class="mt-2 divide-y divide-slate-200 border-b border-slate-200">
              ${items.map(p => `<li class="py-4">${pubHtml(p)}</li>`).join('')}
            </ol>
          </section>`).join('')
          : '<p class="text-sm text-ink-500">No publications match your search.</p>';
        return;
      }

      pubListEl.innerHTML = groupByYear(list).map(([year, items]) => `
        <section>
          <h2 class="sticky top-[4.25rem] z-10 -mx-2 bg-[#fbfcfe]/95 backdrop-blur px-2 py-2.5 font-display text-2xl font-bold border-b border-slate-200">${esc(year)}</h2>
          <ol class="mt-2 divide-y divide-slate-200 border-b border-slate-200">
            ${items.map(p => `<li class="py-4">${pubHtml(p)}</li>`).join('')}
          </ol>
        </section>`).join('');
    }

    /* --- Filter, topic pill & spotlight drawer listeners --- */
    pubSearch.addEventListener('input', renderPubs);
    pubMember.addEventListener('change', () => {
      if (pubMember.value) {
        pubInst.value = '';
        setGroupBy('year');
      }
      spotlightDrawer = { key: null, tab: null };
      syncUrl();
      renderPubs();
    });
    pubInst.addEventListener('change', () => {
      if (pubInst.value) {
        pubMember.value = '';
        setGroupBy('year');
      }
      spotlightDrawer = { key: null, tab: null };
      syncUrl();
      renderPubs();
    });

    pubSpotlightEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-spotlight-tab]');
      if (!btn) return;
      const key = btn.dataset.spotlightKey;
      const tab = btn.dataset.spotlightTab;
      const nextTab = (spotlightDrawer.key === key && spotlightDrawer.tab === tab) ? null : tab;
      spotlightDrawer = { key, tab: nextTab };

      const card = document.getElementById('spotlight-card');
      if (card) {
        card.classList.toggle('border-teal-500/50', Boolean(nextTab));
        card.classList.toggle('border-slate-200', !nextTab);
      }
      document.getElementById('spotlight-bio-panel')?.classList.toggle('is-open', nextTab === 'bio');
      document.getElementById('spotlight-collab-panel')?.classList.toggle('is-open', nextTab === 'collab');
      document.getElementById('spotlight-bio-toggle')?.setAttribute('aria-expanded', String(nextTab === 'bio'));
      document.getElementById('spotlight-collab-toggle')?.setAttribute('aria-expanded', String(nextTab === 'collab'));
    });

    pubGroupEl?.addEventListener('click', e => {
      const btn = e.target.closest('[data-group]');
      if (!btn) return;
      const nextMode = btn.dataset.group;
      if (nextMode === 'institution') {
        pubMember.value = '';
        pubInst.value = '';
        spotlightDrawer = { key: null, tab: null };
      }
      setGroupBy(nextMode);
      syncUrl();
      renderPubs();
    });

    pubResetBtn?.addEventListener('click', resetAllFilters);

    pubTopicsEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-topic]');
      if (!btn || btn.disabled) return;
      const t = btn.dataset.topic;
      if (!t) selectedTopics.clear();
      else if (selectedTopics.has(t)) selectedTopics.delete(t);
      else selectedTopics.add(t);
      syncUrl();
      renderPubs();
    });

    pubListEl.addEventListener('click', e => {
      if (e.target.closest('[data-reset-all]')) {
        resetAllFilters();
        return;
      }
      const pick = e.target.closest('[data-topic-pick]');
      if (!pick) return;
      selectedTopics.clear();
      selectedTopics.add(pick.dataset.topicPick);
      syncUrl();
      renderPubs();
    });

    renderPubs();
  });
})();
