/**
 * =============================================================================
 * European Mobility Society (EMoS) — Home Page (Hero Canvas, Map & Institutions)
 * -----------------------------------------------------------------------------
 * Powers index.html:
 *   - Redirects legacy #members/<id> and #publications/... hash URLs to new pages
 *   - Renders the minimalist Origin-Destination canvas flow animation (#hero-flow),
 *     respecting `prefers-reduced-motion`
 *   - Drives the interactive D3 Europe network map: collision-avoiding popups,
 *     dashed clickable candidate collaboration arcs (.link.is-candidate), smart
 *     ego-cluster zoom framing, pair works side drawer, and Reset map controls
 *   - Renders the 14 Member Institutions showcase card grid (#legend)
 *
 * Depends on: assets/js/data.js, assets/js/shared.js, d3@7, topojson-client@3
 *
 * Copyright (c) 2026 European Mobility Society (EMoS)
 * Project: https://mobilityscience.github.io/EMoS/
 * =============================================================================
 */
(function () {
  // Redirect legacy SPA hash links if someone visits an old #route URL
  (function redirectLegacyHash() {
    const raw = location.hash.replace(/^#/, '');
    if (!raw || raw === 'home' || raw === 'network') return;
    const [head, param, subparam] = raw.split('/');
    if (head === 'about') location.replace('about.html');
    else if (head === 'symposia') location.replace('symposia.html');
    else if (head === 'members') {
      location.replace(param ? `members.html?member=${encodeURIComponent(param)}` : 'members.html');
    } else if (head === 'publications') {
      if (param === 'inst' && subparam) {
        location.replace(`publications.html?inst=${encodeURIComponent(subparam)}&group=institution`);
      } else if (param) {
        location.replace(`publications.html?member=${encodeURIComponent(param)}`);
      } else {
        location.replace('publications.html');
      }
    }
  })();

  window.EMOS.initChrome();

  /** Animate the hero Origin-Destination flow network canvas, honoring prefers-reduced-motion. */
  function initHeroFlowCanvas() {
    const canvas = document.getElementById('hero-flow');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = [
      { x: 0.14, y: 0.28 }, { x: 0.24, y: 0.56 }, { x: 0.18, y: 0.78 },
      { x: 0.42, y: 0.24 }, { x: 0.48, y: 0.52 }, { x: 0.39, y: 0.76 },
      { x: 0.68, y: 0.22 }, { x: 0.74, y: 0.50 }, { x: 0.64, y: 0.78 },
      { x: 0.87, y: 0.34 }, { x: 0.84, y: 0.68 }
    ];
    const routes = [
      [0, 3, '#052b63', 0.18], [1, 4, '#0aa0a0', -0.22], [2, 5, '#052b63', 0.20],
      [3, 6, '#0aa0a0', 0.16], [4, 7, '#d19e2a', -0.18], [5, 8, '#0aa0a0', 0.22],
      [6, 9, '#052b63', -0.16], [7, 10, '#0aa0a0', 0.20], [1, 7, '#052b63', 0.26],
      [4, 9, '#0aa0a0', -0.24], [0, 4, '#d19e2a', 0.18], [5, 7, '#052b63', -0.18]
    ];
    const pulses = routes.map((r, idx) => ({ route: r, t: (idx * 0.17) % 1, speed: 0.0022 + (idx % 3) * 0.0007 }));

    let width = 0, height = 0, rafId = 0;
    /** Match backing canvas pixel size to its CSS box and devicePixelRatio. */
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || 520;
      height = rect.height || 325;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /** Sample a point at parameter t in [0, 1] along a quadratic Bezier arc between nodes a and b. */
    function quadPoint(a, b, bend, t) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const cx = mx - (b.y - a.y) * bend, cy = my + (b.x - a.x) * bend;
      const u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
        y: u * u * a.y + 2 * u * t * cy + t * t * b.y
      };
    }

    /** Redraw the grid, curved flow links, moving pulses, and urban hub markers for one frame. */
    function drawFrame(advance) {
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural urban grid
      ctx.strokeStyle = 'rgba(5, 43, 99, 0.05)';
      ctx.lineWidth = 1;
      const step = 36;
      for (let x = step; x < width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = step; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      const pts = nodes.map(n => ({ x: n.x * width, y: n.y * height }));

      // Curves
      routes.forEach(([i, j, color, bend]) => {
        const a = pts[i], b = pts[j];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const cx = mx - (b.y - a.y) * bend, cy = my + (b.x - a.x) * bend;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.strokeStyle = color === '#d19e2a' ? 'rgba(209, 158, 42, 0.35)' : color === '#0aa0a0' ? 'rgba(10, 160, 160, 0.32)' : 'rgba(5, 43, 99, 0.20)';
        ctx.lineWidth = 1.75;
        ctx.stroke();
      });

      // Flowing mobility pulses
      pulses.forEach(p => {
        if (advance) p.t = (p.t + p.speed) % 1;
        const [i, j, color, bend] = p.route;
        const pos = quadPoint(pts[i], pts[j], bend, p.t);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = color === '#d19e2a' ? 'rgba(209, 158, 42, 0.25)' : color === '#0aa0a0' ? 'rgba(10, 160, 160, 0.22)' : 'rgba(5, 43, 99, 0.2)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // Urban hubs
      pts.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, idx % 3 === 0 ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = idx % 2 === 0 ? '#052b63' : '#0aa0a0';
        ctx.stroke();
      });

      if (advance) rafId = requestAnimationFrame(() => drawFrame(true));
    }

    resize();
    window.addEventListener('resize', () => { resize(); if (reduceMotion) drawFrame(false); });
    drawFrame(!reduceMotion);
  }
  initHeroFlowCanvas();

  /** Ease-out cubic count-up animation for the 4 hero KPI counters. */
  function animateStat(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !target) {
      el.textContent = target;
      return;
    }
    const startT = performance.now();
    const dur = 550;
    function step(now) {
      const p = Math.min(1, (now - startT) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  window.EMOS.loadData({ needPublications: true, needSymposia: false }).then(ctx => {
    const { esc, avatarHtml, instLogoHtml } = window.EMOS;
    const { institutions, members, instById, publications, connections, byRecent, peopleAt, linksOf, findLink, pubHtml } = ctx;
    const sinceYear = publications.length ? Math.min(...publications.map(p => p.year).filter(Boolean)) : 2021;
    const pubsLabel = document.getElementById('stat-pubs-label');
    if (pubsLabel) pubsLabel.textContent = `Papers (${sinceYear}+)`;
    const heroSince = document.getElementById('hero-since-year');
    if (heroSince) heroSince.textContent = sinceYear;

    animateStat('stat-members', members.length);
    animateStat('stat-inst', institutions.length);
    animateStat('stat-links', connections.length);
    animateStat('stat-pubs', publications.length);

    /* =========================================================
       MAP (D3 + Natural Earth boundaries)
       ========================================================= */
    const W = 960, H = 640, MIN_GAP = 38;
    const svg = d3.select('#map-svg');
    const tooltip = document.getElementById('tooltip');
    const mapWrap = document.getElementById('map-wrap');
    const hint = document.getElementById('hint');
    const popup = document.getElementById('node-popup');
    const panel = document.getElementById('panel');
    const backdrop = document.getElementById('backdrop');

    const projection = d3.geoConicConformal().rotate([-8, 0]).parallels([35, 65]);
    projection.fitExtent([[24, 24], [W - 24, H - 24]], {
      type: 'MultiPoint',
      coordinates: [[-10, 37], [24, 37], [-10, 58], [24, 58]]
    });
    const geoPath = d3.geoPath(projection);

    // Projected coordinates, nudged apart where institutions share a city (e.g. London)
    const pos = Object.fromEntries(institutions.map(i => [i.id, projection([i.lng, i.lat])]));
    for (let iter = 0; iter < 60; iter++) {
      institutions.forEach((a, ai) => institutions.slice(ai + 1).forEach(b => {
        const pa = pos[a.id], pb = pos[b.id];
        let dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy);
        if (d >= MIN_GAP) return;
        if (d < 0.01) { dx = 1; dy = 0; d = 1; }
        const push = (MIN_GAP - d) / 2;
        pa[0] -= (dx / d) * push; pa[1] -= (dy / d) * push;
        pb[0] += (dx / d) * push; pb[1] += (dy / d) * push;
      }));
    }

    svg.append('rect').attr('class', 'sea').attr('width', W).attr('height', H);
    const gWorld = svg.append('g');
    const gCountry = gWorld.append('g');
    const gLinks = gWorld.append('g');
    const gMarkers = svg.append('g');

    let currentTransform = d3.zoomIdentity;

    /** Build an SVG quadratic Bezier path between projected institution centroids a and b. */
    function curve(a, b) {
      const [x1, y1] = a, [x2, y2] = b;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const k = window.EMOS_DATA.CURVE_STRENGTH;
      const cx = mx - (y2 - y1) * k, cy = my + (x2 - x1) * k;
      return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
    }

    /** Convert SVG map viewBox coordinates into CSS pixels relative to #map-wrap. */
    function toScreen([x, y]) {
      const s = svg.node().getBoundingClientRect(), w = mapWrap.getBoundingClientRect();
      const ratio = s.width / W;
      return [x * ratio + s.left - w.left, y * ratio + s.top - w.top];
    }

    /** Display the floating dark hover tooltip anchored near the pointer. */
    function showTip(html, evt) { tooltip.innerHTML = html; tooltip.classList.remove('hidden'); moveTip(evt); }
    /** Keep the floating hover tooltip inside #map-wrap bounds as the cursor moves. */
    function moveTip(evt) {
      const r = mapWrap.getBoundingClientRect();
      const x = Math.min(evt.clientX - r.left + 12, r.width - tooltip.offsetWidth - 8);
      tooltip.style.left = x + 'px';
      tooltip.style.top = Math.max(evt.clientY - r.top - 40, 8) + 'px';
    }
    const hideTip = () => tooltip.classList.add('hidden');

    const linkSel = gLinks.selectAll('path.link').data(connections).join('path')
      .attr('class', 'link')
      .attr('d', c => curve(pos[c.from], pos[c.to]))
      .on('mouseenter', (evt, c) => {
        if (!selected || (c.from !== selected && c.to !== selected)) return;
        const otherId = c.from === selected ? c.to : c.from;
        const a = instById[selected], b = instById[otherId];
        showTip(`<div class="font-semibold">${esc(a.short)} ↔ ${esc(b.short)}</div><div class="text-white/75">${c.works.length} shared work${c.works.length === 1 ? '' : 's'} — click to open</div>`, evt);
      })
      .on('mousemove', moveTip)
      .on('mouseleave', hideTip)
      .on('click', (evt, c) => {
        if (!selected || (c.from !== selected && c.to !== selected)) return;
        evt.stopPropagation();
        hideTip();
        onNodeClick(c.from === selected ? c.to : c.from);
      });

    const markerSel = gMarkers.selectAll('g.marker').data(institutions).join('g')
      .attr('class', 'marker')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', i => `${i.name}, ${i.city}`);
    markerSel.append('circle').attr('class', 'pulse').attr('r', 19);
    markerSel.append('circle').attr('class', 'ring').attr('r', 17);
    markerSel.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', i => i.short.length > 3 ? 8 : 10).text(i => i.short);

    let selected = null;
    let pair = null;

    markerSel
      .on('mouseenter', (evt, i) => {
        if (i.id === selected) return;
        const n = peopleAt(i.id).length;
        showTip(`<div class="font-semibold">${esc(i.name)}</div><div class="text-white/70">${esc(i.city)}, ${esc(i.country)} · ${n} member${n === 1 ? '' : 's'}</div>`, evt);
      })
      .on('mousemove', moveTip)
      .on('mouseleave', hideTip)
      .on('click', (evt, i) => { evt.stopPropagation(); hideTip(); onNodeClick(i.id); })
      .on('keydown', (evt, i) => { if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); onNodeClick(i.id); } });

    /** Position all SVG institution node markers under the current zoom/pan transform (constant screen size). */
    function placeMarkers() {
      markerSel.attr('transform', i => `translate(${currentTransform.apply(pos[i.id])})`);
    }
    placeMarkers();

    /** Highlight #reset-view whenever the map has an active selection or non-default zoom/pan transform. */
    function syncResetUi() {
      const hasActiveState = Boolean(selected || pair || Math.abs(currentTransform.k - 1) > 0.05 || Math.hypot(currentTransform.x, currentTransform.y) > 4);
      const resetBtn = document.getElementById('reset-view');
      if (resetBtn) {
        resetBtn.classList.toggle('border-brand-600', hasActiveState);
        resetBtn.classList.toggle('bg-brand-50', hasActiveState);
        resetBtn.classList.toggle('text-brand-700', hasActiveState);
        resetBtn.classList.toggle('border-slate-300', !hasActiveState);
        resetBtn.classList.toggle('bg-white', !hasActiveState);
        resetBtn.classList.toggle('text-ink-700', !hasActiveState);
      }
    }

    const zoom = d3.zoom()
      .scaleExtent([1, 6])
      .translateExtent([[0, 0], [W, H]])
      .on('zoom', evt => {
        currentTransform = evt.transform;
        gWorld.attr('transform', currentTransform);
        placeMarkers();
        positionPopup();
        hideTip();
        syncResetUi();
      });
    svg.call(zoom).on('dblclick.zoom', null);
    svg.on('click', evt => { if (!evt.defaultPrevented) clearSelection(); });
    window.addEventListener('resize', positionPopup);

    /** Clear selection, hide popups/drawer, and reset zoom/pan back to the full European viewport. */
    const resetMapAll = () => {
      clearSelection();
      if (Math.abs(currentTransform.k - 1) > 0.01 || Math.hypot(currentTransform.x, currentTransform.y) > 1) {
        svg.transition().duration(550).call(zoom.transform, d3.zoomIdentity);
      }
    };
    document.getElementById('zoom-in').onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    document.getElementById('zoom-out').onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.5);
    document.getElementById('reset-view').onclick = resetMapAll;
    const zoomResetBtn = document.getElementById('zoom-reset');
    if (zoomResetBtn) zoomResetBtn.onclick = resetMapAll;

    /** Smoothly frame the given projected points inside the viewport, offset when the collaboration drawer is open. */
    function zoomToPoints(points, maxScale = 3) {
      const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const k = Math.min(maxScale, 0.6 / Math.max((x1 - x0) / W, (y1 - y0) / H, 0.15));
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      const panelOpen = !panel.classList.contains('closed');
      const cx = (x0 + x1) / 2 + (isDesktop && panelOpen ? 130 / k : 0);
      const cy = (y0 + y1) / 2 + (!isDesktop && panelOpen ? 120 / k : 0);
      svg.transition().duration(700).call(
        zoom.transform,
        d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-cx, -cy)
      );
    }

    /* --- Institution node popup & collision-avoiding placement --- */
    /** Populate and show the institution popover card (logo, city, clickable members list, publications link). */
    function showPopup(id) {
      const i = instById[id];
      const people = peopleAt(id);
      const n = linksOf(id).length;
      popup.innerHTML = `
        <div class="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3 bg-gradient-to-br from-brand-50/60 to-white rounded-t-2xl">
          <div class="min-w-0 flex-1 space-y-2">
            ${instLogoHtml(i, 'h-11 w-32')}
            <div>
              <h3 id="popup-title" class="text-sm font-bold leading-snug text-ink-900">${esc(i.name)}</h3>
              <p class="text-xs text-ink-500">${esc(i.city)}, ${esc(i.country)}</p>
            </div>
          </div>
          <button data-popup-close class="-mr-1 shrink-0 rounded-full p-1.5 text-ink-500 hover:bg-slate-100 hover:text-ink-900" aria-label="Close">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <ul class="max-h-48 overflow-y-auto border-t border-slate-100 px-2.5 py-2 space-y-0.5">
          ${people.length ? people.map(m => `
            <li><a href="members.html?member=${encodeURIComponent(m.id)}" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-900 hover:bg-brand-50 hover:text-brand-700">
              ${avatarHtml(m, 'h-8 w-8 text-[10px]', 'rounded-full')}
              <span class="truncate">${esc(m.name)}</span>
            </a></li>`).join('') : '<li class="px-2 py-1.5 text-sm text-ink-500">No members listed yet.</li>'}
        </ul>
        <div class="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between gap-2 bg-slate-50/70 rounded-b-2xl">
          <p class="text-[11px] text-ink-500">${n ? 'Click a teal node or dashed link.' : 'No collaborations yet.'}</p>
          <a href="publications.html?inst=${encodeURIComponent(i.id)}&group=institution" class="shrink-0 text-xs font-semibold text-teal-700 hover:text-brand-700 hover:underline">All publications →</a>
        </div>`;
      popup.dataset.id = id;
      popup.classList.remove('hidden');
      positionPopup();
    }

    /** Score candidate positions around the selected node to avoid overlapping markers, hint banner, or zoom buttons. */
    function positionPopup() {
      if (popup.classList.contains('hidden')) return;
      const docked = mapWrap.clientWidth < 640;
      popup.classList.toggle('docked', docked);
      if (docked) return;

      const [px, py] = toScreen(currentTransform.apply(pos[popup.dataset.id]));
      const pw = popup.offsetWidth, ph = popup.offsetHeight;
      const ww = mapWrap.clientWidth, wh = mapWrap.clientHeight;
      const pad = 8, gap = 28, nodePad = 24;

      const clampX = x => Math.max(pad, Math.min(x, ww - pw - pad));
      const clampY = y => Math.max(pad, Math.min(y, wh - ph - pad));

      const markerPts = institutions.map(inst => ({
        id: inst.id,
        pt: toScreen(currentTransform.apply(pos[inst.id]))
      }));

      const hintRect = hint ? {
        left: hint.parentElement.offsetLeft,
        top: hint.parentElement.offsetTop,
        right: hint.parentElement.offsetLeft + hint.offsetWidth + 8,
        bottom: hint.parentElement.offsetTop + hint.offsetHeight + 8
      } : null;

      const zoomRect = { left: ww - 56, top: wh - 88, right: ww, bottom: wh };

      const candidates = [
        [clampX(px + gap),           clampY(py - ph / 2)],     // right
        [clampX(px - pw - gap),      clampY(py - ph / 2)],     // left
        [clampX(px + gap),           clampY(py + gap)],        // below-right
        [clampX(px - pw - gap),      clampY(py + gap)],        // below-left
        [clampX(px - pw / 2),        clampY(py + gap)],        // below
        [clampX(px + gap),           clampY(py - ph - gap)],   // above-right
        [clampX(px - pw - gap),      clampY(py - ph - gap)],   // above-left
        [clampX(px - pw / 2),        clampY(py - ph - gap)],   // above
        [pad + 4,                    clampY(wh - ph - 12)],    // safe dock: bottom-left (Atlantic)
        [clampX(ww - pw - 52),       clampY(12)],              // safe dock: top-right
        [clampX(ww - pw - 52),       clampY(wh - ph - 12)],    // safe dock: bottom-right
        [pad + 4,                    clampY(64)]               // safe dock: top-left below hint
      ];

      function rectsOverlap(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      }

      let best = null;
      let bestScore = Infinity;

      for (const [cx, cy] of candidates) {
        const box = { left: cx, top: cy, right: cx + pw, bottom: cy + ph };
        let nodeHits = 0;
        for (const m of markerPts) {
          const [mx, my] = m.pt;
          if (mx >= box.left - nodePad && mx <= box.right + nodePad && my >= box.top - nodePad && my <= box.bottom + nodePad) {
            nodeHits += (m.id === popup.dataset.id ? 2 : 1);
          }
        }
        const uiHits = (hintRect && rectsOverlap(box, hintRect) ? 1 : 0) + (rectsOverlap(box, zoomRect) ? 1 : 0);
        const dist = Math.hypot((cx + pw / 2) - px, (cy + ph / 2) - py);
        const score = nodeHits * 100000 + uiHits * 10000 + dist;
        if (score < bestScore) {
          bestScore = score;
          best = [cx, cy];
        }
      }

      popup.style.left = best[0] + 'px';
      popup.style.top = best[1] + 'px';
    }

    /** Close the floating institution node popup and clear its active dataset id. */
    function hidePopup() { popup.classList.add('hidden'); delete popup.dataset.id; }
    popup.addEventListener('click', e => {
      e.stopPropagation();
      if (e.target.closest('[data-popup-close]')) clearSelection();
    });

    /** Update the floating status banner at the top-left of the map. */
    function setHint(html) { hint.innerHTML = html; }
    const defaultHint = `<span class="h-2 w-2 shrink-0 rounded-full bg-brand-700"></span><span>Click an institution to see its members, then another to see common works.</span>`;

    /** Synchronize CSS visual states on markers (.is-selected, .is-candidate, .is-pair, .is-dim) and links (.is-candidate, .is-shown). */
    function render() {
      const linked = selected ? new Set(linksOf(selected).flatMap(c => [c.from, c.to])) : null;
      svg.classed('has-selection', !!selected);
      markerSel
        .classed('is-selected', i => i.id === selected)
        .classed('is-candidate', i => !!linked && i.id !== selected && linked.has(i.id))
        .classed('is-pair', i => !!pair && pair.includes(i.id))
        .classed('is-dim', i => (!!pair && !pair.includes(i.id)) || (!!linked && i.id !== selected && !linked.has(i.id)));
      linkSel
        .classed('is-candidate', c => !!selected && (c.from === selected || c.to === selected))
        .classed('is-shown', c => !!pair && findLink(pair[0], pair[1]) === c);
      syncResetUi();
    }

    /** Smoothly return to the default European overview when the map is currently zoomed or panned. */
    function resetZoomIfNeeded() {
      if (Math.abs(currentTransform.k - 1) > 0.05 || Math.hypot(currentTransform.x, currentTransform.y) > 4) {
        svg.transition().duration(550).call(zoom.transform, d3.zoomIdentity);
      }
    }

    /** Select an anchor institution, frame its collaborating cluster (or reset zoom if isolated), and open its popup. */
    function selectFirst(id) {
      closePanel(false);
      pair = null;
      selected = id;
      const i = instById[id];
      const rel = linksOf(id);
      const n = rel.length;
      setHint(`<span class="h-2 w-2 shrink-0 rounded-full bg-brand-700"></span><span><strong class="font-semibold">${esc(i.short)}</strong> selected — ${n ? `pick a highlighted node or dashed arc (${n} collaboration${n === 1 ? '' : 's'}).` : 'no recorded collaborations yet.'}</span>`);
      render();
      if (n) {
        const clusterIds = [...new Set(rel.flatMap(c => [c.from, c.to]))];
        zoomToPoints(clusterIds.map(pid => pos[pid]), 2.1);
      } else {
        resetZoomIfNeeded();
      }
      showPopup(id);
    }

    /**
     * Handle clicking an institution node, legend card, or dashed link:
     * picks a first node, opens the pair drawer when linked, toggles off on self-click,
     * or switches focus to the clicked unlinked institution.
     */
    function onNodeClick(id) {
      if (pair) { selectFirst(id); return; }
      if (!selected) { selectFirst(id); return; }
      if (selected === id) { clearSelection(); return; }

      const link = findLink(selected, id);
      if (link) {
        pair = [selected, id];
        selected = null;
        hidePopup();
        render();
        openPanel(link);
        setHint(`<span class="h-2 w-2 shrink-0 rounded-full bg-gold-500"></span><span>Showing common works. Click any institution to start again.</span>`);
      } else {
        const a = instById[selected], b = instById[id];
        selectFirst(id);
        setHint(`<span class="h-2 w-2 shrink-0 rounded-full bg-slate-400"></span><span>No recorded common works between ${esc(a.short)} and ${esc(b.short)}. <strong class="font-semibold">${esc(b.short)}</strong> is now selected.</span>`);
      }
    }

    /** Reset active institution/pair state, close popups/panel, and restore the default full-Europe view. */
    function clearSelection() {
      selected = null;
      pair = null;
      hidePopup();
      closePanel(false);
      setHint(defaultHint);
      render();
      resetZoomIfNeeded();
    }

    d3.json(window.EMOS_DATA.COUNTRIES_URL).then(world => {
      const countries = topojson.feature(world, world.objects.countries).features;
      const nodeCountries = new Set(institutions.map(i => i.country));
      gCountry.selectAll('path').data(countries).join('path')
        .attr('class', d => 'country' + (nodeCountries.has(d.properties.name) ? ' has-node' : ''))
        .attr('d', geoPath);
      document.getElementById('map-loading')?.remove();
    }).catch(() => {
      const loader = document.getElementById('map-loading');
      if (loader) loader.textContent = 'Country boundaries could not be loaded — the network is still shown.';
    });

    /* Institution showcase card grid below the map */
    document.getElementById('legend').innerHTML = [...institutions]
      .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name))
      .map(i => {
        const cnt = peopleAt(i.id).length;
        const pubCount = publications.filter(p => p.members.some(mid => ctx.memberById[mid]?.institutions.includes(i.id))).length;
        return `
        <article class="card-lift rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-teal-500/50 flex flex-col justify-between gap-3">
          <button type="button" data-legend="${i.id}" class="text-left group space-y-3 focus-visible:outline-none">
            <div class="inst-logo-frame h-20 w-full !p-3 !bg-slate-50/40 group-hover:!bg-white transition-colors">
              <img src="${esc(i.logo)}" alt="${esc(i.name)} logo" loading="lazy" />
            </div>
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md ring-1 ring-teal-500/20">${esc(i.short)}</span>
                <span class="text-xs text-ink-500">${cnt} member${cnt === 1 ? '' : 's'}</span>
              </div>
              <h4 class="mt-2 font-semibold text-ink-900 leading-snug group-hover:text-brand-700">${esc(i.name)}</h4>
              <p class="mt-0.5 text-xs text-ink-500">${esc(i.city)}, ${esc(i.country)}</p>
            </div>
          </button>
          <footer class="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button type="button" data-legend="${i.id}" class="font-medium text-brand-600 hover:text-brand-700">Focus on map <span class="sr-only">${esc(i.name)}</span></button>
            <a href="publications.html?inst=${encodeURIComponent(i.id)}&group=institution" class="font-semibold text-teal-700 hover:text-brand-700">${pubCount} paper${pubCount === 1 ? '' : 's'} (${sinceYear}+) <span class="sr-only">from ${esc(i.name)}</span> →</a>
          </footer>
        </article>`;
      }).join('');

    document.getElementById('legend').addEventListener('click', e => {
      const btn = e.target.closest('[data-legend]');
      if (!btn) return;
      const id = btn.dataset.legend;
      onNodeClick(id);
      document.getElementById('map-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    /* --- Pairwise collaboration slide-over drawer --- */
    /** Populate and slide open the collaboration panel showing shared works between two linked institutions. */
    function openPanel(c) {
      const a = instById[c.from], b = instById[c.to];
      document.getElementById('panel-title').textContent = `${a.short} ↔ ${b.short}`;
      document.getElementById('panel-inst').innerHTML = [a, b].map(i => {
        const people = peopleAt(i.id);
        return `
          <div class="rounded-xl bg-slate-50/70 p-3 border border-slate-200/70">
            <div class="flex items-center gap-3">
              ${instLogoHtml(i, 'h-12 w-24')}
              <div class="min-w-0">
                <div class="text-sm font-semibold leading-snug text-ink-900">${esc(i.name)}</div>
                <div class="text-xs text-ink-500">${esc(i.city)}, ${esc(i.country)}</div>
              </div>
            </div>
            ${people.length ? `<p class="mt-2.5 text-xs text-ink-700">${people.map(p => `<a href="members.html?member=${encodeURIComponent(p.id)}" class="hover:text-brand-600 hover:underline">${esc(p.name)}</a>`).join(' · ')}</p>` : ''}
          </div>`;
      }).join('');
      document.getElementById('panel-count').textContent = `${c.works.length} ${c.works.length === 1 ? 'work' : 'works'}`;
      document.getElementById('panel-works').innerHTML = [...c.works].sort(byRecent).map(w => `
        <li class="rounded-xl border border-slate-200 p-4">
          ${w.extra ? `<span class="mb-2 inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 bg-brand-50 text-brand-700">${esc(w.type || 'Work')}</span>` : ''}
          ${pubHtml(w, true)}
        </li>`).join('');

      panel.classList.remove('closed');
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      zoomToPoints([pos[a.id], pos[b.id]]);
    }

    /** Close the collaboration panel and optionally clear the active pair selection on the map. */
    function closePanel(reset = true) {
      if (panel.classList.contains('closed')) return;
      panel.classList.add('closed');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      if (reset) clearSelection();
    }

    document.getElementById('panel-close').addEventListener('click', () => closePanel());
    backdrop.addEventListener('click', () => closePanel());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') clearSelection(); });

    setHint(defaultHint);

    // Support ?inst=<id> focus when coming from Members / Publications pages
    const focusInst = new URLSearchParams(location.search).get('inst');
    if (focusInst && instById[focusInst]) {
      setTimeout(() => {
        selectFirst(focusInst);
        if (!linksOf(focusInst).length) zoomToPoints([pos[focusInst]], 2.0);
      }, 250);
    }
  });
})();
