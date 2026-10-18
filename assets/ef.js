/* Seer · EF interface system: shared shell, trade slip, charts. No dependencies. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- helpers ---------- */
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const short = (n) => n >= 1e9 ? '$' + (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' : n >= 1e6 ? '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? '$' + Math.round(n / 1e3) + 'K' : '$' + Math.round(n);
  const pct = (p, d = 0) => (p * 100).toFixed(d) + '%';
  const cents = (p) => Math.round(p * 100) + '¢';
  const el = (tag, attrs = {}, html) => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; };
  const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const walk = (seed, n, start, vol, lo = 0.02, hi = 0.98, pull = 0.04, mean) => {
    const r = rng(seed); const out = []; let v = start; mean = mean == null ? start : mean;
    for (let i = 0; i < n; i++) { v += (r() - 0.5) * vol + (mean - v) * pull; v = Math.min(hi, Math.max(lo, v)); out.push(v); }
    return out;
  };
  const PAL = ['#8B4EF7', '#4DA3FF', '#2FD08A', '#F5B63A', '#FF6B7A', '#2EC5CE', '#C26BFF', '#9AA3B2'];

  /* ---------- icons ---------- */
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2 0-4-.5-4-2.2S10 4 12 8c2-4 4-3.9 4-2.2S14 8 12 8z"/></svg>',
    mark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };

  /* ---------- theme ---------- */
  const saved = (() => { try { return localStorage.getItem('seer-ef-theme'); } catch (e) { return null; } })();
  document.documentElement.dataset.theme = saved || 'dark';
  const setTheme = (t) => { document.documentElement.dataset.theme = t; try { localStorage.setItem('seer-ef-theme', t); } catch (e) {} $$('[data-theme-btn]').forEach(b => b.innerHTML = t === 'dark' ? I.sun : I.moon); document.dispatchEvent(new CustomEvent('themechange')); };

  /* ---------- shell ---------- */
  const PAGES = [
    ['index.html', 'Protocol', 'home'], ['app.html', 'App', 'app'], ['deep.html', 'Deep', 'deep'],
    ['futarchy.html', 'Futarchy', 'futarchy'], ['opportunity.html', 'Opportunity Markets', 'opportunity'], ['risk.html', 'Risk Pricing', 'risk']
  ];
  function shell(page) {
    const nav = PAGES.map(([h, n, k]) => `<a href="${h}"${k === page ? ' aria-current="page"' : ''}>${n}</a>`).join('');
    const hdr = el('header', { class: 'hdr' }, `
      <div class="wrap">
        <a class="logo" href="index.html" aria-label="Seer"><i></i></a>
        <nav class="nav" aria-label="Seer products">${nav}</nav>
        <div class="sp"></div>
        <button class="icon-btn" data-theme-btn aria-label="Toggle theme"></button>
        <button class="btn sm" data-connect>Connect wallet</button>
        <button class="icon-btn burger" aria-label="Menu" data-burger>${I.menu}</button>
      </div>
      <nav class="mnav" aria-label="Seer products (mobile)">${nav}</nav>`);
    document.body.prepend(hdr);
    $('[data-burger]').onclick = () => $('.mnav').classList.toggle('open');
    $('[data-theme-btn]').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    $('[data-connect]').onclick = () => toast('Wallet connection is simulated in this concept');
    setTheme(document.documentElement.dataset.theme);
    const f = el('footer', { class: 'ftr' }, `
      <div class="wrap">
        <div><a class="logo" href="index.html" style="height:24px;margin-bottom:14px"><i></i></a>
          <p class="muted" style="max-width:34ch;font-size:14px">The protocol beneath prediction markets, futarchy, opportunity markets and risk pricing.</p></div>
        <div><h5>Products</h5><a href="app.html">App</a><a href="deep.html">Deep</a><a href="futarchy.html">Futarchy</a></div>
        <div><h5>Signals</h5><a href="opportunity.html">Opportunity Markets</a><a href="risk.html">Risk Pricing</a><a href="index.html#protocol">Protocol</a></div>
        <div><h5>Build</h5><a href="https://github.com/seer-pm" rel="noopener">GitHub</a><a href="https://seer-3.gitbook.io/seer-documentation" rel="noopener">Documentation</a><a href="https://x.com/seer_pm" rel="noopener">X</a></div>
        <div class="note"><span>Design concept for the Seer interfaces on the Electric Foundation identity.</span><span>All figures, names and prices are illustrative. Orders are simulated.</span></div>
      </div>`);
    $('main').after(f);
  }

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    let t = $('.toast'); if (!t) { t = el('div', { class: 'toast', role: 'status' }); document.body.append(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- trade slip (kit: Amount, +$1 +$5 +$20 +$100, Confirm) ---------- */
  function slip({ title, outcome, side = 'yes', price, tag = 'Yes', note }) {
    let back = $('.slip-back');
    if (!back) { back = el('div', { class: 'slip-back' }); document.body.append(back); back.addEventListener('click', (e) => { if (e.target === back) close(); }); document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }); }
    const close = () => back.classList.remove('open');
    let amount = 100;
    const render = () => {
      const shares = amount / price, payout = shares, profit = payout - amount;
      back.innerHTML = `<div class="slip" role="dialog" aria-modal="true" aria-label="Trade">
        <div class="meta"><span class="chip ${side === 'yes' ? 'pri' : ''}">${tag}</span><span>${outcome || ''}</span><span class="right">${cents(price)} per share</span></div>
        <h4>${title}</h4>
        <div class="amt"><span>Amount</span><div style="display:flex;align-items:baseline;gap:2px;flex:1;justify-content:flex-end"><b style="font-size:34px;opacity:.5">$</b><input class="num" inputmode="decimal" value="${amount.toFixed(2)}" aria-label="Amount in dollars"></div></div>
        <div class="quick">${[1, 5, 20, 100].map(v => `<button data-add="${v}">+$${v}</button>`).join('')}</div>
        <div class="sum"><div><span>Shares</span><b class="num">${shares.toFixed(2)}</b></div><div><span>Pays out if right</span><b class="num">${usd(payout, 2)}</b></div><div><span>Potential profit</span><b class="num" style="color:var(--up)">+${usd(profit, 2)}</b></div>${note ? `<div><span>${note}</span><b></b></div>` : ''}</div>
        <div class="act"><button class="btn" data-ok>Confirm</button><button class="x" data-x aria-label="Close">${I.x}</button></div></div>`;
      $('input', back).onchange = (e) => { amount = Math.max(1, parseFloat(e.target.value) || 1); render(); };
      $$('[data-add]', back).forEach(b => b.onclick = () => { amount += +b.dataset.add; render(); });
      $('[data-x]', back).onclick = close;
      $('[data-ok]', back).onclick = () => { close(); toast(`Simulated: bought ${(amount / price).toFixed(2)} shares of ${outcome || tag} for ${usd(amount, 2)}`); };
    };
    render(); back.classList.add('open'); setTimeout(() => $('[data-ok]', back) && $('[data-ok]', back).focus(), 30);
  }

  /* ---------- line chart ---------- */
  function lineChart(root, opts) {
    let api = build(root, opts);
    if (!root.__ro) { let lw0 = root.clientWidth; root.__ro = true; window.addEventListener('resize', () => { if (Math.abs(root.clientWidth - lw0) > 24 && root.isConnected) { lw0 = root.clientWidth; api.rebuild(); } }); }
    api.rebuild = () => { const a = build(root, opts); api.paths = a.paths; api.setActive = a.setActive; };
    return api;
  }
  function build(root, { series, xLabels, yMin = 0, yMax = 1, yFmt = (v) => v.toFixed(2), H = 340, ticks = 5, onHover, area = false, lw = 2, yUnit }) {
    const W = Math.max(300, Math.round(root.clientWidth || 920)), pl = 8, pr = 52, pt = 12, pb = 28;
    if (W < 560) H = Math.min(H, Math.round(W * 0.62));
    const n = series[0].data.length;
    const X = (i) => pl + (i / (n - 1)) * (W - pl - pr), Y = (v) => pt + (1 - (v - yMin) / (yMax - yMin)) * (H - pt - pb);
    root.classList.add('chart'); root.innerHTML = '';
    const s = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Price history chart' });
    for (let i = 0; i <= ticks; i++) {
      const v = yMin + (i / ticks) * (yMax - yMin), y = Y(v);
      s.append(sv('line', { x1: pl, x2: W - pr, y1: y, y2: y, class: 'grid-l' }));
      const t = sv('text', { x: W - pr + 10, y: y + 4 }); t.textContent = yFmt(v); s.append(t);
    }
    (xLabels || []).forEach(([i, lbl]) => { const t = sv('text', { x: X(i), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }); t.textContent = lbl; s.append(t); });
    const paths = series.map((se, k) => {
      const d = se.data.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
      if (area && k === 0) { const a = sv('path', { d: d + `L${X(n - 1)} ${Y(yMin)}L${X(0)} ${Y(yMin)}Z`, fill: se.color, opacity: .12 }); s.append(a); }
      const p = sv('path', { d, fill: 'none', stroke: se.color, 'stroke-width': se.w || lw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': se.dash || '', opacity: se.op == null ? 1 : se.op, 'data-k': k });
      s.append(p); return p;
    });
    const cross = sv('line', { y1: pt, y2: H - pb, stroke: 'currentColor', 'stroke-opacity': .25, opacity: 0 }); s.append(cross);
    const dots = series.map(se => { const c = sv('circle', { r: 4, fill: se.color, stroke: 'var(--card)', 'stroke-width': 2, opacity: 0 }); s.append(c); return c; });
    root.append(s);
    const tip = el('div', { class: 'tip' }); root.append(tip);
    const move = (ev) => {
      const r = s.getBoundingClientRect(); const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const i = Math.max(0, Math.min(n - 1, Math.round(((px / r.width) * W - pl) / (W - pl - pr) * (n - 1))));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('opacity', 1);
      dots.forEach((c, k) => { c.setAttribute('cx', X(i)); c.setAttribute('cy', Y(series[k].data[i])); c.setAttribute('opacity', series.length > 12 ? 0 : 1); });
      const rows = series.map((se, k) => [se, se.data[i], k]).sort((a, b) => b[1] - a[1]).slice(0, 6);
      tip.innerHTML = `<b>${(xLabels && xLabels.fmt ? xLabels.fmt(i) : 'Day ' + (i + 1))}</b>` + rows.map(([se, v]) => `<div><span style="display:inline-flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:2px;background:${se.color}"></i>${se.name}</span><span class="num" style="color:var(--tx)">${yFmt(v)}</span></div>`).join('');
      const left = (X(i) / W) * r.width; tip.style.left = Math.min(r.width - 160, Math.max(0, left + 14)) + 'px'; tip.style.top = '8px'; tip.style.opacity = 1;
      if (onHover) onHover(i, rows[0][2]);
    };
    const leave = () => { cross.setAttribute('opacity', 0); dots.forEach(c => c.setAttribute('opacity', 0)); tip.style.opacity = 0; if (onHover) onHover(null); };
    s.addEventListener('mousemove', move); s.addEventListener('touchmove', move, { passive: true }); s.addEventListener('mouseleave', leave); s.addEventListener('touchend', leave);
    return { paths, setActive(k) { paths.forEach((p, i) => { p.setAttribute('opacity', k == null ? (series[i].op == null ? 1 : series[i].op) : i === k ? 1 : 0.12); p.setAttribute('stroke-width', i === k ? (series[i].w || lw) + 1.5 : (series[i].w || lw)); if (i === k) s.append(p); }); } };
  }

  const spark = (data, color = 'var(--pri-hi)', w = 96, h = 28) => {
    const mn = Math.min(...data), mx = Math.max(...data), n = data.length;
    const d = data.map((v, i) => (i ? 'L' : 'M') + (i / (n - 1) * w).toFixed(1) + ' ' + (h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 6)).toFixed(1)).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  };

  /* generic avatar thumb (no third-party logos): gradient tile with initials */
  const tile = (txt, i = 0, size = 48) => { const a = [['#7D33FF', '#B07BFF'], ['#2A6BFF', '#6FB2FF'], ['#12A878', '#52E0AE'], ['#E0892B', '#FFC46B'], ['#D5436F', '#FF8AA8'], ['#2A2A33', '#4B4B5A']][i % 6]; return `<div class="thumb" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${a[0]},${a[1]});font-size:${Math.round(size / 3)}px">${txt}</div>`; };

  window.EF = { $, $$, el, sv, rng, usd, short, pct, cents, walk, PAL, I, shell, slip, toast, lineChart, spark, tile, setTheme };
})();
