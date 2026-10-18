/* 点点岛 v2 (docs/PLAN-v2.md): the review question types, the planner, the arithmetic island's games, the gem screens, the
   map's corner, the parent tools. Loaded after the entry tap with the sky's games (W3.load). Source: raw/js/v2.js (split by
   raw/js/v2_split.py). */
"use strict";
/* ---------------------------------------------------------------- drawing helpers: dots, ten frames, numbers, equations */
const V2G = {
  ink: '#2B2118',
  dots(n, opt) {
    opt = opt || {};
    const per = Math.min(opt.per || 5, Math.max(1, n)), g = opt.g || 22, r = opt.r || 8.5, rows = Math.max(1, Math.ceil(n / per)), w = per * g + 4, h = rows * g + 4;
    const s = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w * (opt.k || 1), height: h * (opt.k || 1) });
    for (let i = 0; i < n; i++) { const x = 2 + g / 2 + (i % per) * g, y = 2 + g / 2 + Math.floor(i / per) * g; svg('circle', { cx: x, cy: y, r, fill: opt.crossFrom != null && i >= opt.crossFrom ? '#FFF8EC' : (opt.fill || '#4FB3FF'), stroke: this.ink, 'stroke-width': 2.4 }, s); if (opt.crossFrom != null && i >= opt.crossFrom) svg('path', { d: 'M' + (x - r) + ' ' + (y - r) + 'L' + (x + r) + ' ' + (y + r), stroke: '#E8414B', 'stroke-width': 3, 'stroke-linecap': 'round' }, s); }
    s.style.flexShrink = '0'; return s;
  },
  frame(n, k) {           /* a ten frame (2 x 5) with n dots */
    const g = 26, s = svg('svg', { viewBox: '0 0 ' + (5 * g + 6) + ' ' + (2 * g + 6), width: (5 * g + 6) * (k || 1), height: (2 * g + 6) * (k || 1) });
    svg('rect', { x: 3, y: 3, width: 5 * g, height: 2 * g, fill: '#FFF8EC', stroke: this.ink, 'stroke-width': 3, rx: 4 }, s);
    for (let i = 1; i < 5; i++) svg('path', { d: 'M' + (3 + i * g) + ' 3V' + (3 + 2 * g), stroke: this.ink, 'stroke-width': 1.6 }, s);
    svg('path', { d: 'M3 ' + (3 + g) + 'H' + (3 + 5 * g), stroke: this.ink, 'stroke-width': 1.6 }, s);
    for (let i = 0; i < n; i++) svg('circle', { cx: 3 + g / 2 + (i % 5) * g, cy: 3 + g / 2 + Math.floor(i / 5) * g, r: g * 0.36, fill: '#FF6B5B', stroke: this.ink, 'stroke-width': 2 }, s);
    return s;
  },
  num(n, h) { return digits() ? UI.num(n, h || 70) : this.dots(n, { k: 1.2 }); },
  /* five option cards (client 2026-10-10): the card size that fits both orientations, then rows in this orientation's
     frame. Review questions: under the picture (landscape), at the bottom (portrait) */
  fr5(L) { return (L == null ? K.L() : L) ? { x: 40, y: 500, w: 944, h: 190 } : { x: 16, y: 790, w: 672, h: 220 }; },
  size5(n, frs, max) { return W3X.size2(n, frs, max || 150, 16); },
  /* a number card's numeral as big as the card allows (with its dots under it at support 0) */
  numH(size) { return Math.round(Math.min(70, size * 0.44)); },
  /* a number with (support 0) its dots under it */
  numCard(n, sup, h) { const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', pointerEvents: 'none' }); d.appendChild(UI.num(n, h || 70)); if (!sup && n <= 10) d.appendChild(this.dots(n, { g: 15, r: 5.8 })); return d; },
  op(t, size) { const o = el('span', ''); o.textContent = t === '-' ? '−' : t; Object.assign(o.style, { font: '900 ' + (size || 46) + 'px/1 system-ui, sans-serif', color: this.ink }); return o; },
  /* an equation: [n | '+' | '-' | '=' | '?'] - numbers with dots at support 0; '?' a dashed box */
  eq(parts, sup, h) {
    const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'none' });
    parts.forEach((t, i) => {
      if (typeof t === 'number') d.appendChild(sup ? UI.num(t, h || 60) : this.numCard(t, 0, h || 60));
      else if (t === '?') { const b = el('div', '', d); Object.assign(b.style, { width: (h || 60) * 0.9 + 'px', height: (h || 60) * 1.1 + 'px', border: '5px dashed ' + this.ink, borderRadius: '12px', background: '#FFF7D6' }); b.dataset.slot = '1'; }
      else d.appendChild(this.op(t));
    });
    return d;
  },
  /* a part-whole diagram: the whole on top, two parts below (null = '?'); dots at support 0, empty boxes at 1 */
  partWhole(w, a, b, sup) {
    const d = el('div', ''); Object.assign(d.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 26px', justifyItems: 'center', pointerEvents: 'none' });
    const cell = (n, span) => { const c = el('div', '', d); Object.assign(c.style, { gridColumn: span ? '1 / span 2' : '', minWidth: '110px', minHeight: '96px', padding: '8px', borderRadius: '50%', background: '#FFF8EC', boxShadow: '0 0 0 4px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center' }); if (n == null) { c.appendChild(this.op('?', 54)); c.dataset.slot = '1'; } else c.appendChild(sup === 0 ? this.numCard(n, 0, 50) : UI.num(n, 54)); return c; };
    cell(w, true); cell(a); cell(b);
    return d;
  },
};

/* ---------------------------------------------------------------- the review question types (one place, one look; also the
   key round, the boss and the monthly test - so the numbers can be compared, A.6) */
const RQ = {
  /* tests: how many options, where the right one is, and that only one is right */
  audit(q) {
    if (q.t === 'give') return { none: 'the child gives' };
    if (q.t === 'cmp') { const want = q.pairs.map(p => (q.ask === 'big' ? Math.max(...p) : Math.min(...p))); return { two: true, n: 2, pos: q.pairs.map((p, i) => p.indexOf(want[i])), err: want.join(',') === q.answer && q.pairs.every(p => p[0] !== p[1]) ? null : 'pairs' }; }
    if (q.t === 'op10') return { two: true, n: 2, pos: q.answer.split(',').map(o => (o === '+' ? 0 : 1)), err: q.ss.map(x => RQ.op10.OP[x.t]).join(',') === q.answer ? null : 'ops' };
    if (q.t === 'eq') { const tru = q.eqs.filter(e => (e[1] === '+' ? e[0] + e[2] : e[0] - e[2]) === e[4]); return { n: q.eqs.length, pos: q.answer, err: tru.length === 1 && q.eqs.indexOf(tru[0]) === q.answer && new Set(q.eqs.map(String)).size === q.eqs.length ? null : 'true ones ' + tru.length }; }
    return W3X.auditNum(q);
  },
  sub: {
    gen(G, c, o) { const n = G.rng.int(1, 5); return { k: ['sub', n], n, answer: n, opts: numOptions(G, n, 1, 6), say: '刚才有几个点？' }; },
    present(st) {
      const q = st.q, L = K.L(), card = W2X.thing(st, 300, 220, 6, 'card'); place(card, L ? 362 : 202, L ? 150 : 260, 300, 220);
      Object.assign(card.style, { display: 'flex', alignItems: 'center', justifyContent: 'center' }); card.appendChild(V2G.dots(q.n, { per: 3, g: 46, r: 17 }));
      /* covered first; when the host has finished speaking the dots flash 1.5 s, then the question (R2-M1) */
      const cover = () => { card.innerHTML = ''; const f = el('div', '', card); Object.assign(f.style, { width: '100%', height: '100%', borderRadius: '18px', background: 'repeating-linear-gradient(45deg,#FFC93C 0 18px,#FFB020 18px 36px)' }); st.covered = true; };
      st.flash = card; cover(); K.pop(st, card);
      st.flashOnce = ms => { if (!Session.alive(st) || st.revealed) return; card.innerHTML = ''; card.appendChild(V2G.dots(q.n, { per: 3, g: 46, r: 17 })); st.covered = false; st.scope.timeout(() => { if (Session.alive(st) && !st.revealed) cover(); }, T(ms) + 1); };
      st.scope.guard(Voice.afterSay(150)).then(() => { if (!Session.alive(st)) return; st.flashOnce(1500); st.scope.timeout(() => { if (Session.alive(st)) K.say(st, q.say); }, T(1700) + 1); }).catch(() => {});
      RQ.numCards(st, q.opts, 1);
    },
    saySelf: true,
    gestureHint(st) { if (st.reflashed || !st.flashOnce) { Voice.say(st.q.say, { tag: 'prompt' }); return; } st.reflashed = true; st.flashOnce(1200); },
    reveal(st) { st.revealed = true; if (st.flash) { st.flash.innerHTML = ''; st.flash.appendChild(V2G.dots(st.q.n, { per: 3, g: 46, r: 17 })); } },
    /* after a wrong answer: the dots come back and are counted one by one */
    async show(st) { RQ.sub.reveal(st); const pts = st.flash ? Array.from(st.flash.querySelectorAll('circle')) : []; for (let i = 0; i < pts.length; i++) { if (!Session.alive(st)) return; const r = W3X.srect(pts[i]); W3X.badgeAt(st, r.x + r.w / 2, r.y + r.h / 2, i + 1, 34); await W3X.count(st, 320, i + 1); } },
  },
  give: {
    gen(G, c, o) { const n = G.rng.int(2, o.level >= 3 ? 10 : 7); return { k: ['give', n], n, answer: n, say: '给我' + CNQ(n) + '个！' }; },
    present(st) {
      const q = st.q, L = K.L(), pool = 12;
      st.basket = W2X.thing(st, 420, 390, 4, ''); st.basket.innerHTML = '<svg viewBox="0 0 420 390" width="100%" height="100%"><path d="M10 90H410L376 378H44Z" fill="#E6B98A" stroke="#2B2118" stroke-width="8" stroke-linejoin="round"/><path d="M10 90H410" stroke="#2B2118" stroke-width="12" stroke-linecap="round"/></svg>';
      /* 96 px: the stage is 1024 x 704, a 9.7-inch iPad shows it at scale 1 - every cube stays >= 88 CSS px */
      st.items = Array.from({ length: pool }, (_, i) => { const e = K.item(Stage.el, 'assets/props/cube.png', 96, 96); e.style.zIndex = 6; st.els.push(e); K.reg(st, 'it' + i, e, {}); return { e, inB: false }; });
      st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {});
      RQ.give.place(st); st.items.forEach((o, i) => K.pop(st, o.e, 30 * i));
    },
    place(st) {
      const L = K.L(), B = L ? { x: 540, y: 130 } : { x: 120, y: 580 }; place(st.basket, B.x, B.y, 420, 390);
      let a = 0, b = 0;
      st.items.forEach(o => { if (o.inB) { const k = b++; place(o.e, B.x + 18 + (k % 4) * 96, B.y + 94 + Math.floor(k / 4) * 96, 96, 96); } else { const k = a++; place(o.e, (L ? 40 : 110) + (k % 4) * 108, (L ? 130 : 226) + Math.floor(k / 4) * 108, 96, 96); } });
    },
    onGesture(st, name, p) {
      if (name !== 'tap') return false;
      if (p.id === 'done') { if (!st.submitted) Session.submit(st, st.items.filter(o => o.inB).length); return 'ok'; }
      const m = /^it(\d+)$/.exec(p.id || ''); if (!m) return false;
      const o = st.items[+m[1]]; o.inB = !o.inB; st.childOps++; Sfx.tap(); RQ.give.place(st); return 'ok';
    },
    next(st, strat) { const inB = st.items.filter(o => o.inB).length, want = strat === 'wrong' ? st.q.n + 1 : st.q.n; if (inB < want) return { g: 'tap', p: { id: 'it' + st.items.findIndex(o => !o.inB) } }; return { g: 'tap', p: { id: 'done' } }; },
    reveal(st) { K.hop(st, st.basket, 20); },
    feedback(st, ans) { W3X.say(W2Say.notN(ans)); },
    /* not a choice (the child gives); after a wrong answer: the cubes in the basket are counted, then cubes go in (or out)
       until there are as many as he was asked for (gold) */
    async explain(st, ans) {
      const my = st, n = st.q.n, inB = () => st.items.filter(o => o.inB);
      W3X.ringAt(st, box(st.basket), W3X.BLUE, 4);
      const have = inB(); for (let i = 0; i < have.length; i++) { if (!Session.alive(my)) return; const b = box(have[i].e); W3X.badgeAt(st, b.x + b.w / 2, b.y + 14, i + 1, 34); await W3X.count(st, 280, i + 1); }
      await st.scope.wait(T(700)); if (!Session.alive(my)) return;
      st.els.filter(e => e.classList && (e.classList.contains('ringo') || e.classList.contains('badge'))).forEach(e => e.remove());
      while (inB().length !== n) { if (!Session.alive(my)) return; const add = inB().length < n, o = add ? st.items.find(x => !x.inB) : inB().slice(-1)[0]; if (!o) break; o.inB = add; RQ.give.place(st); K.pop(st, o.e); Sfx.place(); await st.scope.wait(T(260)); }
      inB().forEach((o, i) => { const b = box(o.e); W3X.badgeAt(st, b.x + b.w / 2, b.y + 14, i + 1, 34); });
      W3X.gold(st, st.basket, 4, 0); Sfx.reveal(); W3X.tell('要' + CNQ(n) + '个。');
      await W3X.beat(st, 1500);
    },
  },
  /* bigger / smaller has only two answers: two pairs in one question (一题两问, client 2026-10-10) - both must be right */
  cmp: {
    gen(G, c, o) {
      const hi = (SKILLS[c] || {}).hi || 10, ask = G.rng.chance(0.5) ? 'big' : 'small', at = bagPick(G, 'cmpat', ['0,0', '0,1', '1,0', '1,1']).split(',').map(Number), pairs = [];
      for (let k = 0; k < 2; k++) { let a, b; do { a = G.rng.int(1, hi); b = G.rng.int(1, hi); } while (a === b || Math.abs(a - b) > (hi > 10 ? 9 : 6) || pairs.some(p => p.includes(a) && p.includes(b))); const w = ask === 'big' ? Math.max(a, b) : Math.min(a, b), x = a + b - w; pairs.push(at[k] === 0 ? [w, x] : [x, w]); }
      const want = pairs.map(p => (ask === 'big' ? Math.max(...p) : Math.min(...p)));
      return { k: ['cmp', pairs.join('|'), ask], pairs, ask, answer: want.join(','), opts: pairs[0].concat(pairs[1]), say: ask === 'big' ? '哪个大？' : '哪个小？' };
    },
    card(n, sup) { if (n <= 10) return V2G.numCard(n, sup, 70); const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', pointerEvents: 'none' }); d.appendChild(UI.num(n, 62)); if (!sup) { d.appendChild(V2G.frame(10, 0.7)); d.appendChild(V2G.frame(n - 10, 0.7)); } return d; },
    present(st) {
      const q = st.q; st.pick = [null, null];
      W2X.cards(st, q.opts.map(n => RQ.cmp.card(n, st.sup)), q.opts, { size: 190, gap: 30, cx: 512, cy: 360 }); st.cards.forEach(c => { c.style.zIndex = 8; });
      st.pairBox = [0, 1].map(() => { const b = W2X.thing(st, 10, 10, 2, ''); b.style.pointerEvents = 'none'; Object.assign(b.style, { borderRadius: '30px', background: 'rgba(255,255,255,.55)', boxShadow: '0 0 0 4px rgba(43,33,24,.35)' }); return b; });
      RQ.cmp.place(st);
    },
    /* the two pairs: side by side (landscape), one above the other (portrait) */
    place(st) {
      const L = K.L(), s = 190, g = 30;
      [0, 1].forEach(k => { const x0 = L ? (k ? 552 : 72) : 162, y0 = L ? 230 : (k ? 600 : 250); if (st.pairBox) place(st.pairBox[k], x0 - 20, y0 - 20, 2 * s + g + 40, s + 40); (st.cards || []).slice(2 * k, 2 * k + 2).forEach((c, j) => place(c, x0 + j * (s + g), y0, s, s)); });
    },
    onGesture(st, name, p) {
      const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || st.picked) return false;
      const k = i < 2 ? 0 : 1; st.pick[k] = i; st.cards.slice(2 * k, 2 * k + 2).forEach((c, j) => c.classList.toggle('hi', 2 * k + j === i)); Sfx.place();
      if (st.pick.every(x => x != null)) { st.picked = true; Session.submit(st, st.pick.map(j => st.opts[j]).join(',')); }
      return 'ok';
    },
    next(st, strat) { if (st.picked) return null; const want = st.q.answer.split(',').map(Number), k = st.pick[0] == null ? 0 : 1, a = st.opts.indexOf(want[k], 2 * k); return { g: 'tap', p: { id: 'card' + (strat === 'wrong' && k === 0 ? 2 * k + (1 - (a - 2 * k)) : a) } }; },
    feedback(st, ans) { const got = String(ans).split(',').map(Number), want = st.q.answer.split(',').map(Number), k = got[0] !== want[0] ? 0 : 1, i = st.opts.indexOf(got[k], 2 * k); if (st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CN[got[k]]); },
    /* after a wrong answer: in each pair, his card (blue) and the bigger (smaller) one (gold); their dots line up */
    async explain(st, ans) {
      const q = st.q, my = st, got = String(ans).split(',').map(Number), want = q.answer.split(',').map(Number);
      [0, 1].forEach(k => { if (got[k] !== want[k]) W3X.mine(st, st.cards[st.opts.indexOf(got[k], 2 * k)], 6); });
      await st.scope.wait(T(1100)); if (!Session.alive(my)) return;
      [0, 1].forEach(k => W3X.gold(st, st.cards[st.opts.indexOf(want[k], 2 * k)], 6));
      Sfx.reveal(); W3X.tell(q.ask === 'big' ? '大的是这个！' : '小的是这个！');
      await W3X.beat(st, 1500);
    },
  },
  next: {
    gen(G, c, o) { const hi = (SKILLS[c] || {}).hi || 10, dir = G.rng.chance(0.5) ? 'after' : 'before', n = dir === 'after' ? G.rng.int(1, hi - 1) : G.rng.int(2, hi), ans = dir === 'after' ? n + 1 : n - 1; return { k: ['next', n, dir], n, dir, answer: ans, opts: numOptions(G, ans, 0, hi), say: CN[n] + (dir === 'after' ? '后面是几？' : '前面是几？') }; },
    present(st) {
      const q = st.q, L = K.L(), row = W2X.thing(st, 10, 10, 5, ''); row.style.width = row.style.height = 'auto';
      Object.assign(row.style, { display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 20px', background: 'rgba(255,255,255,.92)', borderRadius: '24px', boxShadow: '0 0 0 4px #2B2118' });
      const cells = q.dir === 'after' ? [q.n - 1, q.n, '?'] : ['?', q.n, q.n + 1];
      cells.forEach(t => { const c = el('div', '', row); Object.assign(c.style, { width: '108px', height: '108px', borderRadius: '18px', background: t === q.n ? '#FFE08A' : '#FFF8EC', boxShadow: '0 0 0 3px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center' }); if (t === '?') { c.appendChild(V2G.op('?', 60)); st.hole = c; } else if (t >= 0) c.appendChild(UI.num(t, 70)); });
      place(row, L ? 330 : 140, L ? 170 : 300); K.pop(st, row);
      RQ.numCards(st, q.opts, 0);
    },
    /* after a wrong answer: the number comes into its place in the row */
    async show(st) { RQ.fill(st, st.hole, st.q.answer, 70); await st.scope.wait(T(500)); },
  },
  on: {
    gen(G, c, o) { const hi = (SKILLS[c] || {}).hi || 10, a = G.rng.int(hi > 10 ? 8 : 3, hi > 10 ? 15 : 7), b = G.rng.int(1, Math.min(4, hi - a)), ans = a + b; return { k: ['on', a, b], a, b, answer: ans, opts: numOptions(G, ans, 1, hi), say: '一共有几个？' }; },
    present(st) {
      const q = st.q, L = K.L(), boxE = W2X.thing(st, 220, 200, 5, ''); boxE.innerHTML = '<svg viewBox="0 0 220 200" width="100%" height="100%"><rect x="14" y="40" width="192" height="146" rx="14" fill="#C98B4A" stroke="#2B2118" stroke-width="7"/><path d="M8 40H212" stroke="#2B2118" stroke-width="12" stroke-linecap="round"/></svg>';
      const lab = el('div', '', boxE); Object.assign(lab.style, { position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%,-50%)' }); lab.appendChild(UI.num(q.a, 76));
      const loose = st.loose = W2X.thing(st, 10, 10, 5, ''); loose.style.width = loose.style.height = 'auto'; loose.appendChild(V2G.dots(q.b, { g: 40, r: 15, per: 4 }));
      place(boxE, L ? 260 : 120, L ? 150 : 270, 220, 200); place(loose, L ? 560 : 400, L ? 220 : 330);
      K.pop(st, boxE); K.pop(st, loose, 100);
      RQ.numCards(st, q.opts, 1);
    },
    /* after a wrong answer: counting on from the box - the loose ones get a + 1, a + 2 ... */
    async show(st) { const pts = st.loose ? Array.from(st.loose.querySelectorAll('circle')) : []; for (let i = 0; i < pts.length; i++) { if (!Session.alive(st)) return; const r = W3X.srect(pts[i]); W3X.badgeAt(st, r.x + r.w / 2, r.y + r.h / 2, st.q.a + i + 1, 40); await W3X.count(st, 340, st.q.a + i + 1); } },
  },
  part: {
    gen(G, c, o) { const hi = (SKILLS[c] || {}).hi || 10, w = G.rng.int(3, hi), a = G.rng.int(1, w - 1), ans = w - a; return { k: ['part', w, a], w, a, answer: ans, opts: numOptions(G, ans, 0, hi), say: CN[w] + '分成' + CN[a] + '和几？' }; },
    present(st) { const q = st.q, L = K.L(), d = st.pw = W2X.thing(st, 10, 10, 5, ''); d.style.width = d.style.height = 'auto'; d.appendChild(V2G.partWhole(q.w, q.a, null, st.sup)); place(d, L ? 380 : 210, L ? 110 : 200); K.pop(st, d); RQ.numCards(st, q.opts, 1); },
    /* after a wrong answer: the missing part comes into its place */
    async show(st) { RQ.fill(st, st.pw && st.pw.querySelector('[data-slot]'), st.q.answer, 54); await st.scope.wait(T(500)); },
  },
  ten: {
    gen(G, c, o) { const n = G.rng.int(11, 19); return { k: ['ten', n], n, answer: n, opts: numOptions(G, n, 10, 20), say: '这是几？' }; },
    present(st) { const q = st.q, L = K.L(), d = st.tens = W2X.thing(st, 10, 10, 5, ''); d.style.width = d.style.height = 'auto'; Object.assign(d.style, { display: 'flex', gap: '18px', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,.9)', borderRadius: '22px', boxShadow: '0 0 0 4px #2B2118' }); d.appendChild(V2G.frame(10, 1.4)); d.appendChild(V2G.frame(q.n - 10, 1.4)); place(d, L ? 250 : 80, L ? 170 : 300); K.pop(st, d); RQ.numCards(st, q.opts, 1); },
    /* after a wrong answer: a full ten, then counting on: eleven, twelve ... */
    async show(st) {
      const fr = st.tens ? st.tens.children : [];
      if (fr[0]) { const r = W3X.srect(fr[0]); W3X.badgeAt(st, r.x + r.w / 2, r.y - 4, 10, 48); await W3X.count(st, 420, 10); }
      const pts = fr[1] ? Array.from(fr[1].querySelectorAll('circle')) : [];
      for (let i = 0; i < pts.length; i++) { if (!Session.alive(st)) return; const r = W3X.srect(pts[i]); W3X.badgeAt(st, r.x + r.w / 2, r.y + r.h / 2, 11 + i, 38); await W3X.count(st, 340, 11 + i); }
    },
  },
  /* a picture story -> its number sentence (skill cards add10 / sub10) */
  eq: {
    gen(G, c, o) {
      const op = (SKILLS[c] || {}).op || '+';
      let a, b; if (op === '+') { a = G.rng.int(1, 6); b = G.rng.int(1, Math.min(4, 10 - a)); } else { a = G.rng.int(3, 9); b = G.rng.int(1, a - 1); }
      /* the wrong ones are always false sentences (R2-S1): the other operation with the same result (b >= 1), the result off
         by one, then another false one (off by two, a number changed) - five in all, only the right one true */
      const r = op === '+' ? a + b : a - b, ok = [a, op, b, '=', r], f1 = [a, op === '+' ? '-' : '+', b, '=', r], f2 = [a, op, b, '=', r + (r > 1 && (r >= 10 || G.rng.chance(0.5)) ? -1 : 1)];
      const more = G.rng.shuffle([[a, op, b, '=', r + 2], [a, op, b, '=', r - 2], [a, op, b, '=', r - 1], [a, op, b, '=', r + 1], [a + 1, op, b, '=', r], [a, op, b + 1, '=', r], [a - 1, op, b, '=', r]]);
      const foils = W3X.uniq([f1, f2].concat(more).filter(s => RQ.falseOk(s) && s.every(x => typeof x !== 'number' || x <= 10)), String, 4, [ok]);      /* within ten, as the card (R3: no "= 11") */
      const opts = W3X.deal(G, ok, foils, 'rqeq');
      return { k: ['eq', a, op, b], a, b, op, answer: opts.indexOf(ok), opts: opts.map((_, i) => i), eqs: opts, say: '哪个算式对？', fact: factOf(op, a, b) };
    },
    present(st) {
      const q = st.q, L = K.L(), pic = W2X.thing(st, 10, 10, 5, ''); pic.style.width = pic.style.height = 'auto';
      Object.assign(pic.style, { display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,.92)', borderRadius: '22px', boxShadow: '0 0 0 4px #2B2118' });
      if (q.op === '+') { pic.appendChild(V2G.dots(q.a, { g: 30, r: 11, fill: '#4FB3FF' })); pic.appendChild(V2G.op('+', 40)); pic.appendChild(V2G.dots(q.b, { g: 30, r: 11, fill: '#FFC93C' })); }
      else pic.appendChild(V2G.dots(q.a, { g: 30, r: 11, crossFrom: q.a - q.b }));
      place(pic, L ? 120 : 140, L ? 260 : 230); K.pop(st, pic);
      st.cards = q.eqs.map((s, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(V2G.eq(s, 1, 46)); K.pop(st, c, 80 * i); return c; });
      st.opts = q.opts.slice(); RQ.eq.place(st);
    },
    /* five sentences, one per row: right of the picture (landscape), under it (portrait) */
    place(st) { RQ.rows(st, K.L() ? { x: 520, y: 100, w: 470, h: 590 } : { x: 92, y: 420, w: 520, h: 590 }); },
    async explain(st, ans) { await RQ.explainEq(st, ans, () => {}); },
  },
  /* a number fact: "三加四等于几？" with the support of its level: 0 dots, 1 a part-whole shell, 2 the sum only (A.7) */
  fact: {
    gen(G, c, o) { const f = factParts(c), r = f.op === '+' ? f.a + f.b : f.a - f.b; return { k: ['fact', c, o.sup], f, answer: r, opts: numOptions(G, r, 0, 10), sup: o.sup, say: CN[f.a] + (f.op === '+' ? '加' : '减') + CN[f.b] + '等于几？' }; },
    present(st) {
      const q = st.q, f = q.f, L = K.L(), d = W2X.thing(st, 10, 10, 5, ''); d.style.width = d.style.height = 'auto';
      Object.assign(d.style, { display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', padding: '16px 22px', background: 'rgba(255,255,255,.92)', borderRadius: '24px', boxShadow: '0 0 0 4px #2B2118' });
      if (q.sup === 0) { const row = el('div', '', d); Object.assign(row.style, { display: 'flex', gap: '14px', alignItems: 'center' }); if (f.op === '+') { row.appendChild(V2G.dots(f.a, { g: 28, r: 10 })); row.appendChild(V2G.op('+', 36)); row.appendChild(V2G.dots(f.b, { g: 28, r: 10, fill: '#FFC93C' })); } else row.appendChild(V2G.dots(f.a, { g: 28, r: 10, crossFrom: f.a - f.b })); }
      if (q.sup === 1) d.appendChild(f.op === '+' ? V2G.partWhole(null, f.a, f.b, 1) : V2G.partWhole(f.a, f.b, null, 1));
      d.appendChild(V2G.eq([f.a, f.op, f.b, '=', '?'], 1, 64)); st.factEl = d;
      place(d, L ? 300 : 120, L ? 104 : 200); K.pop(st, d);
      RQ.numCards(st, q.opts, 1);
    },
    /* after a wrong answer: the result comes into the sentence */
    async show(st) { (st.factEl ? Array.from(st.factEl.querySelectorAll('[data-slot]')) : []).forEach(e => RQ.fill(st, e, st.q.answer, 56)); await st.scope.wait(T(500)); },
  },
  /* ---------------------------------------------------------------- 积木城's three cards (docs/W5-DESIGN.md §8.5, package D):
     pos (where: 上面 / 里面 / 前面 / 后面 / 左边 / 右边), shape (how many triangles / circles / squares / oblongs in a
     little picture - separate shapes only), op10 (two story cards: + or -, 一题两问) */
  /* pos: a box on the plain board and five toys round it - "谁在盒子后面？". A closed box (a toy can be on it) or an open
     crate (a toy can be in it); front / behind are drawn as they look: behind - its lower half hidden by the box, higher up;
     in front - lower down, over the box. Every toy has its own tap area over its whole body (one behind the box too). The
     asked word from a bag; the right toy's place among the five options from a bag. After a wrong answer: his toy blue,
     where it really is ("它在盒子前面"); behind: the box goes see-through; the right toy gold ("小熊在盒子后面"). */
  pos: {
    toys: { teddy: '小熊', bunny: '小兔', duck: '小鸭', chick: '小鸡', kitten: '小猫', dino: '恐龙', turtle: '乌龟', sheep: '小羊' },
    words: { top: '上面', in: '里面', front: '前面', back: '后面', left: '左边', right: '右边' },
    gen(G, c, o) {
      const w = bagPick(G, 'rqposw', ['top', 'in', 'front', 'back', 'left', 'right']), open = w === 'in' || (w !== 'top' && G.rng.chance(0.5));
      const spots = ['left', 'right', 'front', 'back', open ? 'in' : 'top'], toys = G.rng.shuffle(Object.keys(this.toys)).slice(0, 5);
      const at = {}; G.rng.shuffle(spots).forEach((s, i) => { at[toys[i]] = s; });
      const ok = toys.find(t => at[t] === w), opts = W3X.deal(G, ok, toys.filter(t => t !== ok), 'rqpos');
      return { k: ['pos', w, open ? 1 : 0, opts.map(t => t + at[t]).join('')], w, open, at, opts, answer: ok, say: '谁在盒子' + this.words[w] + '？' };
    },
    /* the box and the toys' places (stage px): the box's front face x0..x1, y0..y1; a toy is 130 square */
    geo() { const L = K.L(), cx = L ? 512 : 352, y0 = L ? 300 : 420, T = 110; return { cx, y0, T, spot: { left: [cx - 270, y0 + 50], right: [cx + 160, y0 + 50], front: [cx - 55, y0 + 140], back: [cx - 125, y0 - 110], top: [cx + 25, y0 - 140], in: [cx - 10, y0 - 82] } }; },
    present(st) {
      const q = st.q, g = RQ.pos.geo(), ink = V2G.ink;
      /* the box: closed (a lid on top) or open (its back wall, the dark inside, then its front) - the front face drawn last */
      const mk = (z, draw) => { const e = W2X.thing(st, 300, 260, z, ''); e.style.pointerEvents = 'none'; const s = svg('svg', { viewBox: '0 0 300 260', width: '100%', height: '100%' }, e); s.style.overflow = 'visible'; draw(s); return e; };
      st.boxBack = mk(5, s => { if (q.open) { svg('path', { d: 'M30 90L70 40H270L230 90Z', fill: '#B0743A', stroke: ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s); svg('path', { d: 'M40 88L74 48H262L228 88Z', fill: '#5B3A1E' }, s); } else { svg('path', { d: 'M30 90L70 40H270L230 90Z', fill: '#FF8FA8', stroke: ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s); svg('path', { d: 'M126 90L166 40M146 90L186 40', stroke: '#FFC93C', 'stroke-width': 10 }, s); } });
      st.boxFront = mk(7, s => { svg('path', { d: 'M230 90L270 40V200L230 250Z', fill: q.open ? '#9A622E' : '#E06A86', stroke: ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s); svg('rect', { x: 30, y: 90, width: 200, height: 160, rx: 6, fill: q.open ? '#C98B4A' : '#FF7A98', stroke: ink, 'stroke-width': 6 }, s); if (q.open) svg('path', { d: 'M30 140H230M30 195H230', stroke: '#9A622E', 'stroke-width': 5 }, s); else svg('path', { d: 'M120 90V250M140 90V250', stroke: '#FFC93C', 'stroke-width': 10 }, s); });
      /* the toys: the one behind under the box, the one inside between its back and its front */
      const zOf = s => (s === 'back' ? 4 : s === 'in' ? 6 : s === 'front' ? 8 : 6);
      st.toyEls = q.opts.map(t => { const e = W2X.thing(st, g.T, g.T, zOf(q.at[t]), ''); e.style.pointerEvents = 'none'; const im = img('assets/props/' + t + '.png', '', e); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain' }); return e; });
      st.cards = q.opts.map((t, i) => { const e = W2X.thing(st, g.T, g.T, 9, ''); e.style.borderRadius = '22px'; K.reg(st, 'card' + i, e, {}); return e; });
      st.opts = q.opts.slice();
      RQ.pos.place(st);
      st.toyEls.forEach((e, i) => K.pop(st, e, 50 * i));
    },
    place(st) {
      const q = st.q, g = RQ.pos.geo(), bx = g.cx - 150, by = g.y0 - 90;
      [st.boxBack, st.boxFront].forEach(e => e && place(e, bx, by, 300, 260));
      q.opts.forEach((t, i) => { const p = g.spot[q.at[t]]; [st.toyEls[i], st.cards[i]].forEach(e => e && place(e, p[0], p[1], g.T, g.T)); });
    },
    where(st, t) { return '它在盒子' + RQ.pos.words[st.q.at[t]]; },
    feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(RQ.pos.where(st, ans)); },
    /* his toy (blue) and where it is; behind: the box goes see-through for a moment; the right toy (gold) and where it is */
    async explain(st, ans) {
      const q = st.q, my = st, i = st.opts.indexOf(ans), r = st.opts.indexOf(q.answer);
      if (st.cards[i]) W3X.mine(st, st.cards[i], 6);
      W3X.tell(RQ.pos.where(st, ans));
      await st.scope.wait(T(1300)); if (!Session.alive(my)) return;
      if (q.w === 'back' || q.at[ans] === 'back') { [st.boxBack, st.boxFront].forEach(e => st.scope.anim(e, [{ opacity: 1 }, { opacity: 0.3, offset: 0.25 }, { opacity: 0.3, offset: 0.75 }, { opacity: 1 }], { duration: T(1100) })); await st.scope.wait(T(1100)); if (!Session.alive(my)) return; await Step.beat(st); if (!Session.alive(my)) return; }
      W3X.gold(st, st.cards[r], 6, 0); K.hop(st, st.toyEls[r], 18); Sfx.reveal();
      W3X.tell(RQ.pos.toys[q.answer] + '在盒子' + RQ.pos.words[q.w]);
      await W3X.beat(st, 1600);
    },
    reveal(st) { const r = st.opts.indexOf(st.q.answer); if (st.toyEls && st.toyEls[r]) K.hop(st, st.toyEls[r], 22); },
    lines() { const P = RQ.pos, out = []; Object.keys(P.words).forEach(w => { out.push('谁在盒子' + P.words[w] + '？', '它在盒子' + P.words[w]); Object.keys(P.toys).forEach(t => out.push(P.toys[t] + '在盒子' + P.words[w])); }); return out; },
  },
  /* shape: a little picture of separate shapes (triangles - some turned or long, circles, squares - some a little turned,
     oblongs), "几个三角形？" with five number cards. After a wrong answer: the shapes asked for counted one by one, the right
     card gold ("三个三角形！") */
  shape: {
    kinds: { tri: '三角形', circle: '圆形', square: '正方形', rect: '长方形' },
    gen(G, c, o) {
      const ask = bagPick(G, 'rqshape', ['tri', 'circle', 'square', 'rect']), n = G.rng.int(1, 6), others = G.rng.int(Math.max(2, 5 - n), 9 - n);
      const items = Array.from({ length: n }, () => ask).concat(Array.from({ length: others }, () => G.rng.pick(['tri', 'circle', 'square', 'rect'].filter(k => k !== ask))));
      const cells = G.rng.shuffle(Array.from({ length: 18 }, (_, i) => i)).slice(0, items.length);
      const sh = G.rng.shuffle(items).map((k, i) => ({ k, cell: cells[i], s: G.rng.int(70, 100), rot: k === 'circle' ? 0 : G.rng.pick([0, 0, 15, -15, 30, 180, 90]), col: G.rng.int(0, 5), long: k === 'tri' && G.rng.chance(0.3), jx: G.rng.int(-10, 10), jy: G.rng.int(-10, 10) }));
      return { k: ['shape', ask, sh.map(x => x.k[0] + x.cell).join('')], ask, n, sh, answer: n, opts: numOptions(G, n, 0, 10), say: '几个' + this.kinds[ask] + '？' };
    },
    /* the picture: 6 x 3 cells (landscape) / 3 x 6 (portrait) */
    frame() { return K.L() ? { x: 152, y: 100, w: 720, h: 380, cols: 6 } : { x: 62, y: 204, w: 580, h: 570, cols: 3 }; },
    draw(s, x, k) {
      const ink = V2G.ink, col = ['#FF6B5B', '#4FB3FF', '#5CC46E', '#FFC93C', '#B57BFF', '#FF9F43'][x.col], h = x.s * (k || 1) / 2;
      const g = svg('g', { transform: 'rotate(' + x.rot + ')' }, s);
      if (x.k === 'circle') svg('circle', { cx: 0, cy: 0, r: h * 0.92, fill: col, stroke: ink, 'stroke-width': 5 }, g);
      else if (x.k === 'square') svg('rect', { x: -h * 0.8, y: -h * 0.8, width: h * 1.6, height: h * 1.6, fill: col, stroke: ink, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
      else if (x.k === 'rect') svg('rect', { x: -h, y: -h * 0.48, width: 2 * h, height: h * 0.96, fill: col, stroke: ink, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
      else svg('path', { d: x.long ? 'M' + (-h) + ' ' + (h * 0.7) + 'L' + h + ' ' + (h * 0.7) + 'L' + (-h * 0.6) + ' ' + (-h * 0.7) + 'Z' : 'M0 ' + (-h) + 'L' + (h * 0.95) + ' ' + (h * 0.75) + 'L' + (-h * 0.95) + ' ' + (h * 0.75) + 'Z', fill: col, stroke: ink, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
      return g;
    },
    present(st) {
      const q = st.q, f = RQ.shape.frame();
      const pic = st.pic = W2X.thing(st, 10, 10, 5, ''); Object.assign(pic.style, { background: 'rgba(255,255,255,.92)', borderRadius: '24px', boxShadow: '0 0 0 4px #2B2118' });
      const s = st.picSvg = svg('svg', { viewBox: '0 0 ' + f.w + ' ' + f.h, width: '100%', height: '100%' }, pic);
      const cw = f.w / f.cols, rows = 18 / f.cols, ch = f.h / rows;
      st.shapeEls = q.sh.map(x => { const c = x.cell % f.cols, r = Math.floor(x.cell / f.cols), gg = svg('g', { transform: 'translate(' + (c * cw + cw / 2 + x.jx) + ' ' + (r * ch + ch / 2 + x.jy) + ')' }, s); RQ.shape.draw(gg, x, Math.min(cw, ch) / 126); gg._k = x.k; return gg; });
      RQ.shape.place(st); K.pop(st, pic);
      RQ.numCards(st, q.opts, 1);
    },
    place(st) { const f = RQ.shape.frame(); if (st.pic) place(st.pic, f.x, f.y, f.w, f.h); RQ.placeNum(st); },
    /* after a wrong answer: the shapes asked for counted one by one */
    async explain(st, ans) {
      const q = st.q;
      await W3X.explainCards(st, ans, { line: CNQ(q.n) + '个' + RQ.shape.kinds[q.ask] + '！', show: async () => { const els = st.shapeEls.filter(e => e._k === q.ask); for (let i = 0; i < els.length; i++) { if (!Session.alive(st)) return; const r = W3X.srect(els[i]); W3X.badgeAt(st, r.x + r.w / 2, r.y + r.h / 2, i + 1, 40); await W3X.count(st, 300, i + 1); } } });
    },
    lines() { const out = []; Object.values(RQ.shape.kinds).forEach(k => { out.push('几个' + k + '？'); for (let n = 1; n <= 6; n++) out.push(CNQ(n) + '个' + k + '！'); }); return out; },
  },
  /* op10: two story cards side by side (portrait: one above the other), each with its own + and - (一题两问): which do
     you use? 又来了 / 合起来 + ; 拿走 / 求另一部分 / 比多少 - (drawn as §3.3: what came sparkles, what went is a grey dashed
     outline with an arrow out, together a brace, the part asked for a "?"). The four (+, -) pairs from a bag. After a
     wrong answer: his button blue, the story played again ("这是吃掉了哦"), the right button gold ("拿走，用减号"). */
  op10: {
    OP: { inc: '+', join: '+', dec: '-', part: '-', cmp: '-' },
    FB: { inc: '这是又来了哦', join: '这是合起来哦', dec: '这是吃掉了哦', part: '这是求另一份', cmp: '这是比多少' },
    WHY: { inc: '又来了，用加号', join: '合起来，用加号', dec: '拿走，用减号', part: '求另一份，用减号', cmp: '比多少，用减号' },
    gen(G, c, o) {
      const want = bagPick(G, 'rqop', ['+,+', '+,-', '-,+', '-,-']).split(','), P = { '+': ['inc', 'join'], '-': ['dec', 'part', 'cmp'] };
      const ss = want.map(op => { const t = G.rng.pick(P[op]); if (op === '+') { const s = G.rng.int(3, 10), a = G.rng.int(1, s - 1); return { t, a, b: s - a }; } const a = G.rng.int(3, t === 'cmp' ? 8 : 10), b = G.rng.int(1, a - 1); return { t, a, b }; });
      if (ss[0].t === ss[1].t && ss[0].a === ss[1].a) ss[1].a = ss[1].a > 3 ? ss[1].a - 1 : ss[1].a + 1;
      ss.forEach(s => { if (s.b >= s.a && s.t !== 'inc' && s.t !== 'join') s.b = s.a - 1; });
      return { k: ['op10', ss.map(s => s.t + s.a + s.b).join('|')], ss, answer: want.join(','), opts: ['+', '-', '+', '-'], say: '用加还是用减？' };
    },
    /* a story's picture (viewBox 200 x 150): dots in colours, the arrows / brace / "?" of §3.3 */
    draw(s, x) {
      const ink = V2G.ink, out = { moved: [] };
      const dots = (n, x0, y0, w, h, col, keep) => { let per = 1; const sz = k => Math.min(30, w / k, h / Math.ceil(n / k)); for (let k = 2; k <= n; k++) if (sz(k) > sz(per) + 0.5) per = k; const z = sz(per), rows = Math.ceil(n / per), P = []; for (let i = 0; i < n; i++) { const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per; P.push([x0 + w / 2 + (c - (inRow - 1) / 2) * z, y0 + h / 2 + (r - (rows - 1) / 2) * z, z * 0.42]); } return P.map(([cx, cy, r], i) => (keep ? keep(i, cx, cy, r) : svg('circle', { cx, cy, r, fill: col, stroke: ink, 'stroke-width': 2.4 }, s))); };
      const arrow = (x1, y1, x2, y2, col, dash) => { svg('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': dash ? '2 9' : '', fill: 'none' }, s); const a = Math.atan2(y2 - y1, x2 - x1), p = t => (x2 + Math.cos(a + t) * 13).toFixed(1) + ' ' + (y2 + Math.sin(a + t) * 13).toFixed(1); svg('path', { d: 'M' + x2 + ' ' + y2 + 'L' + p(2.6) + 'L' + p(-2.6) + 'Z', fill: col }, s); };
      const brace = (x0, x1, y, up) => { const k = up ? -1 : 1, m = (x0 + x1) / 2, h = 10 * k; svg('path', { d: 'M' + x0 + ' ' + y + 'Q' + x0 + ' ' + (y + h) + ' ' + (x0 + 12) + ' ' + (y + h) + 'H' + (m - 10) + 'Q' + m + ' ' + (y + h) + ' ' + m + ' ' + (y + 2 * h) + 'Q' + m + ' ' + (y + h) + ' ' + (m + 10) + ' ' + (y + h) + 'H' + (x1 - 12) + 'Q' + x1 + ' ' + (y + h) + ' ' + x1 + ' ' + y, stroke: '#E0A400', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, s); };
      const qm = (cx, cy) => { svg('circle', { cx, cy, r: 13, fill: '#FFF3C4', stroke: ink, 'stroke-width': 2.6 }, s); const t = svg('text', { x: cx, y: cy + 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 900, fill: ink, 'font-family': 'system-ui,sans-serif' }, s); t.textContent = '?'; };
      const num = (cx, cy, n) => { const t = svg('text', { x: cx, y: cy, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 900, fill: ink, 'font-family': 'system-ui,sans-serif' }, s); t.textContent = n; };
      if (x.t === 'inc') { dots(x.a, 4, 4, 120, 140, '#4FB3FF'); svg('path', { d: 'M128 8V142', stroke: 'rgba(43,33,24,.25)', 'stroke-width': 2, 'stroke-dasharray': '4 5' }, s); out.moved = dots(x.b, 132, 4, 64, 116, '#4FB3FF', (i, cx, cy, r) => { const g = svg('g', {}, s); svg('circle', { cx, cy, r, fill: '#4FB3FF', stroke: ink, 'stroke-width': 2.4 }, g); svg('path', { d: 'M' + (cx + r * 0.7) + ' ' + (cy - r * 1.3) + 'l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z', fill: '#FFC93C', stroke: ink, 'stroke-width': 1 }, g); return g; }); arrow(198, 138, 134, 138, '#3FAE55'); }
      else if (x.t === 'dec') { const P = dots(x.a, 4, 4, 160, 142, '#E2A15B', (i, cx, cy, r) => (i < x.a - x.b ? svg('circle', { cx, cy, r, fill: '#E2A15B', stroke: ink, 'stroke-width': 2.4 }, s) : svg('circle', { cx, cy, r, fill: 'rgba(154,163,173,.15)', stroke: '#9AA3AD', 'stroke-width': 2.8, 'stroke-dasharray': '4 4' }, s))); out.moved = P.slice(x.a - x.b); const l = P[P.length - 1]; arrow(+l.getAttribute('cx') + 14, +l.getAttribute('cy'), 198, +l.getAttribute('cy'), '#9AA3AD', true); }
      else if (x.t === 'join') { dots(x.a, 2, 2, 96, 104, '#E8414B'); dots(x.b, 102, 2, 96, 104, '#4F7BFF'); brace(10, 190, 112); qm(100, 136); out.moved = Array.from(s.querySelectorAll('circle')); }
      else if (x.t === 'part') { dots(x.b, 2, 68, 96, 80, '#E8414B'); out.moved = dots(x.a - x.b, 102, 68, 96, 80, '#FFC93C'); brace(12, 188, 40, true); num(100, 16, x.a); qm(150, 54); }
      else { const z = Math.min(36, 190 / x.a), x0 = 100 - (x.a - 1) * z / 2; for (let i = 0; i < x.a; i++) { const e = svg('circle', { cx: x0 + i * z, cy: 70, r: z * 0.42, fill: '#E8414B', stroke: ink, 'stroke-width': 2.4 }, s); if (i >= x.b) out.moved.push(e); } for (let i = 0; i < x.b; i++) svg('circle', { cx: x0 + i * z, cy: 70 + z + 8, r: z * 0.42, fill: '#5CC46E', stroke: ink, 'stroke-width': 2.4 }, s); const xa = x0 + x.b * z - z / 2, xb = x0 + (x.a - 1) * z + z / 2; svg('rect', { x: xa, y: 70 - z / 2 - 3, width: xb - xa, height: z + 6, rx: 8, fill: 'none', stroke: '#E0A400', 'stroke-width': 3.5, 'stroke-dasharray': '6 5' }, s); qm((xa + xb) / 2, 70 - z / 2 - 18); }
      return out;
    },
    geo() { const L = K.L(); return L ? { cards: [[150, 104], [554, 104]], w: 320, h: 240, btn: 112, by: 372 } : { cards: [[44, 196], [44, 586]], w: 400, h: 300, btn: 112, bx: 470 }; },
    present(st) {
      const q = st.q;
      st.storyEls = q.ss.map(x => { const e = W2X.thing(st, 10, 10, 5, ''); Object.assign(e.style, { background: '#fff', borderRadius: '20px', boxShadow: '0 0 0 4px #2B2118', overflow: 'hidden' }); const s = svg('svg', { viewBox: '0 0 200 150', width: '100%', height: '100%' }, e); e._parts = RQ.op10.draw(s, x); e._svg = s; return e; });
      st.cards = q.opts.map((op, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(V2G.op(op, 64)); c.firstChild.style.color = op === '+' ? '#E8414B' : '#2E6FD8'; return c; });
      st.opts = q.opts.slice(); st.pick = [null, null];
      RQ.op10.place(st);
      st.storyEls.forEach((e, i) => K.pop(st, e, 80 * i)); st.cards.forEach((c, i) => K.pop(st, c, 160 + 40 * i));
    },
    /* each story with its two buttons: under it (landscape), beside it (portrait) */
    place(st) {
      const g = RQ.op10.geo(), L = K.L();
      (st.storyEls || []).forEach((e, k) => place(e, g.cards[k][0], g.cards[k][1], g.w, g.h));
      (st.cards || []).forEach((c, i) => { const k = i >> 1, j = i & 1, x0 = g.cards[k][0], y0 = g.cards[k][1]; if (L) place(c, x0 + g.w / 2 - g.btn - 14 + j * (g.btn + 28), g.by, g.btn, g.btn); else place(c, g.bx, y0 + g.h / 2 - g.btn - 12 + j * (g.btn + 24), g.btn + 40, g.btn); });
    },
    onGesture(st, name, p) {
      const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || st.picked) return false;
      const k = i >> 1; st.pick[k] = i; st.cards.slice(2 * k, 2 * k + 2).forEach((c, j) => c.classList.toggle('hi', 2 * k + j === i)); Sfx.place();
      if (st.pick.every(x => x != null)) { st.picked = true; Session.submit(st, st.pick.map(j => st.opts[j]).join(',')); }
      return 'ok';
    },
    next(st, strat) { if (st.picked) return null; const want = st.q.answer.split(','), k = st.pick[0] == null ? 0 : 1, op = strat === 'wrong' && k === 0 ? (want[0] === '+' ? '-' : '+') : want[k]; return { g: 'tap', p: { id: 'card' + (2 * k + (op === '+' ? 0 : 1)) } }; },
    bad(st, ans) { const a = String(ans).split(','), w = st.q.answer.split(','); return [0, 1].filter(k => a[k] !== w[k]); },
    feedback(st, ans) { const k = RQ.op10.bad(st, ans)[0] || 0, a = String(ans).split(','); K.wiggle(st, st.cards[2 * k + (a[k] === '+' ? 0 : 1)]); W3X.say(RQ.op10.FB[st.q.ss[k].t]); },
    /* his button blue, the story again; the right button gold, why */
    async explain(st, ans) {
      const q = st.q, my = st, a = String(ans).split(','), bad = RQ.op10.bad(st, ans), k = bad[0];
      st.cards.forEach(c => c.classList.remove('hi'));
      bad.forEach(j => W3X.mine(st, st.cards[2 * j + (a[j] === '+' ? 0 : 1)], 6));
      const P = st.storyEls[k]._parts.moved;
      P.forEach((e, i) => st.scope.anim(e, q.ss[k].t === 'dec' ? [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(40px,0)', opacity: 0.2 }, { transform: 'translate(0,0)', opacity: 1 }] : q.ss[k].t === 'inc' ? [{ transform: 'translate(60px,0)', opacity: 0 }, { transform: 'translate(0,0)', opacity: 1 }] : [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], { duration: T(700), delay: T(70 * i) }));
      W3X.tell(RQ.op10.FB[q.ss[k].t]);
      await st.scope.wait(T(1300)); if (!Session.alive(my)) return;
      bad.forEach(j => W3X.gold(st, st.cards[2 * j + (q.answer.split(',')[j] === '+' ? 0 : 1)], 6));
      Sfx.reveal(); W3X.tell(RQ.op10.WHY[q.ss[k].t]);
      await W3X.beat(st, 1600);
    },
    reveal(st) { const w = st.q.answer.split(','); [0, 1].forEach(k => { const c = st.cards[2 * k + (w[k] === '+' ? 0 : 1)]; if (c) K.hop(st, c, 20); }); },
    lines() { return ['用加还是用减？'].concat(Object.values(RQ.op10.FB), Object.values(RQ.op10.WHY)); },
  },
  numCards(st, vals, sup) { const s = V2G.size5(vals.length, [V2G.fr5(true), V2G.fr5(false)]); W2X.cards(st, vals.map(n => V2G.numCard(n, sup, V2G.numH(s))), vals, { size: s, gap: 16, cx: 512, cy: 600 }); RQ.placeNum(st); },
  placeNum(st) { if (st.cards && st.cards.length) W3X.lay(st.cards, V2G.fr5(), box(st.cards[0]).w, null, 16); },
  /* a '?' place gets its number (gold) */
  fill(st, e, n, h) { if (!e || e.dataset.filled) return; e.dataset.filled = '1'; e.innerHTML = ''; e.style.border = '0'; e.style.background = '#FFE08A'; e.appendChild(UI.num(n, h || 60)); K.pop(st, e); },
  /* sentence cards, one per row, as tall as five fit */
  rows(st, fr) { const cs = st.cards || [], n = cs.length, h = Math.min(128, Math.floor((fr.h - (n - 1) * 12) / n)), y0 = fr.y + (fr.h - n * h - (n - 1) * 12) / 2; cs.forEach((c, i) => place(c, fr.x, Math.round(y0 + i * (h + 12)), fr.w, h)); },
  /* a sentence that may be offered as wrong: false, numbers 0-19 (the first and the one added / taken >= 1) */
  falseOk(s) { const v = s[1] === '+' ? s[0] + s[2] : s[0] - s[2]; return v !== s[4] && s[0] >= 1 && s[2] >= 1 && s[4] >= 0 && s.every(x => typeof x !== 'number' || x <= 19); },
  /* after a wrong sentence: it is worked out - its result is ringed (blue) and what it really makes shows above it; the
     true sentence (gold); then `more` (the picture / the family) */
  async explainEq(st, ans, more) {
    const my = st, eqs = st.q.eqs, i = (st.opts || []).indexOf(ans), c = st.cards[i], s = eqs[i];
    if (c && s) {
      W3X.mine(st, c, 4);
      const toks = c.firstChild ? c.firstChild.children : [], res = toks[toks.length - 1], v = s[1] === '+' ? s[0] + s[2] : s[0] - s[2];
      if (res) { const r = W3X.srect(res); W3X.ringAt(st, r, W3X.BLUE, 6); if (v >= 0) W3X.badgeAt(st, r.x + r.w + 30, r.y + r.h / 2, v, 46); }
    }
    await st.scope.wait(T(1500)); if (!Session.alive(my)) return;
    if (more) { const r = more(); if (r && r.then) { await r; if (!Session.alive(my)) return; await Step.beat(st); if (!Session.alive(st)) return;      /* step by step: the demonstration is a step of its own (PT2 Q3) */ } }
    W3X.gold(st, st.cards[st.q.answer], 4, 0); Sfx.reveal(); W3X.tell('这个算式对！');
    await W3X.beat(st, 1600);
  },
};
/* the review game: the host of THIS island asks; built like every game (GameBase) */
const RevGame = {
  /* softHint: its 2nd hint says the question again - no help, so it costs nothing (as in 字字岛's 补句子) */
  id: 'review', kind0: 'review', verb: '想！', review: true, softHint: true,
  present(st) {
    const t = RQ[st.q.t];
    if (st.missQ) Voice.say('再来一个！', { tag: 'prompt' }); else if (!st.G.rvSaid && !st.G.key && !st.G.test) { st.G.rvSaid = true; Voice.say('老朋友来了！', { tag: 'prompt' }); }
    const board = W2X.thing(st, Stage.W, Stage.H, 60, 'v2board'); place(board, 0, 0, Stage.W, Stage.H);
    Object.assign(board.style, { background: st.G.test ? '#FFF8EC' : 'rgba(255,248,236,.94)', pointerEvents: 'auto' });
    t.present(st); st.taskEl = K.task(st, [['speaker', 'q']]); if (t.saySelf) st.prompt = st.q.say; else K.say(st, st.q.say);
    st.els.forEach(e => { if (e !== board) e.style.zIndex = String(61 + (parseInt(e.style.zIndex, 10) || 0)); });
  },
  evaluate(st, ans) { return ans === st.q.answer; },
  onGesture(st, name, p) { const t = RQ[st.q.t]; if (t.onGesture) return t.onGesture(st, name, p); return W3X.tapCards(st, name, p); },
  async reveal(st) { const t = RQ[st.q.t]; if (t.reveal) t.reveal(st); const i = (st.opts || []).indexOf(st.q.answer); if (st.cards && st.cards[i]) K.hop(st, st.cards[i], 26); Sfx.reveal(); await st.scope.wait(T(700)); },
  /* after a wrong answer (client 2026-10-10): the type's own explanation, or his card (blue), what shows the answer, the
     right card (gold) */
  async explain(st, ans) {
    const t = RQ[st.q.t];
    if (t.explain) { await t.explain(st, ans); return; }
    await W3X.explainCards(st, ans, { show: async () => { if (t.show) await t.show(st); else if (t.reveal) t.reveal(st); await st.scope.wait(T(600)); } });
  },
  async feedback(st, ans) { const t = RQ[st.q.t]; if (t.feedback) { t.feedback(st, ans); } else { const i = (st.opts || []).indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); if (typeof ans === 'number' && st.q.t !== 'eq') W3X.say('不是' + (CN[ans] || ans)); else W3X.say('再看一看'); } await st.scope.wait(T(800)); },
  next(st, strat) { const t = RQ[st.q.t]; if (t.next) return t.next(st, strat); if (st.picked) return null; const vals = st.opts, i = strat === 'wrong' ? vals.findIndex(v => v !== st.q.answer) : vals.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
  relayoutQ(st) { const t = RQ[st.q.t]; if (t.place) t.place(st); else RQ.placeNum(st); },
  gestureHint(st) { const t = RQ[st.q.t]; if (t.gestureHint) return t.gestureHint(st); if (st.hintDone) return; st.hintDone = true; Voice.say(st.q.say, { tag: 'prompt' }); },
  workEls(st) { return st.cards || []; },
  snap(st) { return { opts: st.opts || null, rv: st.q.c }; },
  cleanup() {},
  kinds() { return ['review']; },
  key(q) { return 'rv:' + JSON.stringify(q.k); },
};

/* ---------------------------------------------------------------- the planner (A.8-A.12): review slots by what is due, the pass
   questions of this island first, the missed queue, the star cap */
Object.assign(V2D, {
  cardsOf(w) { return Array.from(new Set((WORLDS[w].games || []).map(g => GAMECARD[g]).filter(Boolean))); },
  plan(G) {
    if (G.key || G.test) return { pos: [] };
    const due = Mem.due().length, gdone = W2.gameDone(G.world, G.id), rounds = G.rounds;
    let n = due === 0 ? 0 : due <= 8 ? 1 : 2;
    if (Mem.brake() && due && gdone) n = 3;                           /* the 3rd slot only in a game already done (A.8) */
    /* this island's pass questions get a slot even when nothing is due (A.12) */
    const pend = this.cardsOf(G.world).filter(c => c !== GAMECARD[G.id] && !Mem.passed(c) && WORLDS[G.world].games.some(g => GAMECARD[g] === c && (G.ws.played || []).includes(g)));
    if (pend.length && n === 0) n = 1;
    if (G.v2low || G.rounds <= 4) n = Math.min(n, 1);                 /* review made the child quit / a game's first visit: one (A.16, A.8) */
    n = Math.min(n, Math.max(0, rounds - 2));                        /* at least two of the game's own questions */
    return { pos: [1, 3, 4].slice(0, n) };
  },
  /* the question of this round: a review card or null (the game's own) */
  slot(G) {
    if (typeof RQ === 'undefined') return null;                       /* the question types are still loading */
    if (G.key || G.test) { const c = (G.keyItems || [])[G.round]; return c ? { c } : null; }
    const used = G.rvUsed || (G.rvUsed = []);
    const miss = (G.miss || []).find(m => m.at <= G.round && !m.done);
    if (miss) { miss.done = true; return { c: miss.c, miss: true }; }
    if (!G.rv || !G.rv.pos.includes(G.round)) return null;
    if (G.round >= 3 && Clock.t() - G.t0 > 140000 && !fast() && G.rv.pos.indexOf(G.round) >= 1) return null;   /* late: the game's own first */
    /* the pass questions of this island's earlier games first (not waiting for a due day) */
    const own = GAMECARD[G.id], isl = this.cardsOf(G.world).filter(c => c !== own && !used.includes(c) && !Mem.passed(c) && RQ[(SKILLS[c] || {}).t] && G.ws.played && WORLDS[G.world].games.some(g => GAMECARD[g] === c && (G.ws.played || []).includes(g)));
    const due = Mem.due().filter(c => !used.includes(c) && c !== own);
    const c = isl[0] || due[0]; if (!c) return null;
    used.push(c); return { c, pass: !!isl[0] && c === isl[0] };
  },
  newQ(G, rv) {
    const S = Session, c = rv.c, fact = isFact(c), t = fact ? 'fact' : SKILLS[c].t, sp = fact ? Mem.supFor(c) : { sup: 0, probe: false };
    const q = Object.assign(RQ[t].gen(G, c, { level: G.level, sup: sp.sup }), { t, c });
    const game = Object.assign(Object.create(GameBase), RevGame, { chars: G.game.chars, host: G.game.host });
    const st = {
      gen: ++S.qn, id: 'q' + S.qn, G, game, q, kind: 'review', level: G.level, phase: 'setup', hinted: false, guided: false, demo: false, retest: false, probe: false,
      evidence: false, again: false, err: 0, scope: new Scope(G.scope), els: [], map: {}, ops: 0, childOps: 0, assists: [],
      submitted: false, idleFrom: Clock.t(), hintLv: 0, nextAuto: 0, budget: budgetFor(G.level), ff: false, childTook: false,
      rv: true, sup: sp.sup, supProbe: sp.probe, pass: !!rv.pass, missQ: !!rv.miss,
    };
    st.answerP = new Promise((res, rej) => { st.answerRes = res; st.answerRej = rej; });
    S.st = st; window.__qn = st.gen;
    return st;
  },
  /* memory of the card asked about (a review card, or the game's own card) */
  remember(G, st, res) {
    if (G.test) { (G.testRes || (G.testRes = [])).push([st.q.c, res === 'ok' && !helped(st) ? 1 : 0]); return; }
    Mem.today().q++;
    const D = Mem.today(); if (st.rv) D.rq++; else D.nq++;
    const ok = res === 'ok', how = ok ? (helped(st) ? 'help' : 'ok') : 'wrong';
    if (res !== 'ok' && res !== 'wrong') return;
    if (st.rv) {
      const c = st.q.c;
      if (st.supProbe) Mem.answer(c, how === 'ok' ? 'probe-ok' : 'probe-no', G.sid, { rv: true, sup: st.sup });
      else Mem.answer(c, how, G.sid, { sup: st.sup, rv: true, pass: st.pass, miss: st.missQ, form: 'rq:' + st.q.t });
      if (!ok && !G.key) G.miss.push({ c, at: G.round + 2 });
      if (st.pass && ok && Store.s.passFail[c]) { Store.s.passFail[c] = 0; Store.save(); }
      if (st.pass && !ok) { const n = (Store.s.passFail[c] || 0) + 1; Store.s.passFail[c] = n; if (n >= 2) { const m = Mem.touch(c); m.b = 1; m.due = DAY() + 1; Store.s.notes.push([DAY(), c]); Store.s.passFail[c] = 0; } Store.save(); }
      return;
    }
    /* the game's own question: its card (and, for the arithmetic games, the number fact it asked) */
    const own = GAMECARD[G.id]; if (own) Mem.answer(own, how, G.sid, { own: true, form: 'g:' + G.id });
    const f = st.q && st.q.fact; if (f && isFact(f)) Mem.answer(f, how, G.sid, { sup: 0, own: true });
    G.recent = (G.recent || []).concat(ok ? 1 : 0).slice(-4);          /* each question by its own answer: 2 of the last 4 really wrong (A.11, R3-M2) */
  },
  /* where a star of this question goes: the game's tray (at most 2 review stars counted there) or a gem (A.9) */
  starTo(G, st) {
    if (!st.rv) return 'game';
    const ws = G.ws, rvs = ws.rvs || (ws.rvs = {});
    if (W2.gameDone(G.world, G.id) || (rvs[G.id] || 0) >= 2) return 'gem';
    rvs[G.id] = (rvs[G.id] || 0) + 1; return 'game';
  },
  /* review was making the child quit (first two weeks): a round of review quits more than twice as often as a game's own
     question, or three quits in a row on review -> one review a session, the rest to the key (A.16) */
  quit(G) {
    const st = Session.st, D = Mem.today();
    if (!st || G.key || G.test) return;
    if (st.rv) { D.rqQuit++; Store.s.rvQuitRun = (Store.s.rvQuitRun || 0) + 1; } else { D.nqQuit++; Store.s.rvQuitRun = 0; }
    const days = Object.values(Store.s.days), rq = days.reduce((a, x) => a + (x.rq || 0), 0), rqq = days.reduce((a, x) => a + (x.rqQuit || 0), 0), nq = days.reduce((a, x) => a + (x.nq || 0), 0), nqq = days.reduce((a, x) => a + (x.nqQuit || 0), 0);
    if (Store.s.rvQuitRun >= 3 || (rq >= 6 && nq >= 6 && rqq / rq > 2 * Math.max(0.05, nqq / nq))) { if (!Store.s.v2low) { Store.s.v2low = true; Store.s.notes.push([DAY(), 'low']); } }
    Store.save();
  },
});

/* ---------------------------------------------------------------- the four games of the arithmetic island (Optimus and
   Bumblebee): 0 and "=", the addition sentence (two robots combine), take away / the unknown part (unloading), the
   family of three numbers. New play every one; numbers grow with the level (A.2). */
const ZB = {
  decor(G) { if (K.L()) W3X.decor2(G, this.chars, this.one); else W2X.hideAll(G, this.chars); },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  /* five number cards (client 2026-10-10): between the watchers (landscape), at the bottom (portrait) */
  cardFr(L) { return (L == null ? K.L() : L) ? { x: 160, y: 520, w: 700, h: 170 } : { x: 16, y: 800, w: 672, h: 210 }; },
  cardRow(st, vals, sup) { const s = V2G.size5(vals.length, [this.cardFr(true), this.cardFr(false)]); W2X.cards(st, vals.map(n => V2G.numCard(n, sup, V2G.numH(s))), vals, { size: s, gap: 16, cx: 512, cy: 600 }); this.placeCards(st); },
  placeCards(st) { if (st.cards && st.cards.length) W3X.lay(st.cards, this.cardFr(), box(st.cards[0]).w, null, 16); },
  next(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
  async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(this.wrongLine ? this.wrongLine(st, ans) : W2Say.notN(ans)); await st.scope.wait(T(700)); },
  fillSlot(st, n) { const s = st.eqEl && st.eqEl.querySelector('[data-slot]'); if (s && !s.dataset.filled) { s.dataset.filled = '1'; s.style.border = '0'; s.style.background = 'transparent'; s.appendChild(UI.num(n, 60)); } },
  /* after a wrong answer: his card (blue), what makes the answer (the game's show), the right card (gold) */
  async explain(st, ans) { await W3X.explainCards(st, ans, { show: async () => { await this.show(st); await st.scope.wait(T(500)); }, line: '对的是这个！' }); },
  audit(q) { return W3X.auditNum(q); },
};
/* Z1 等号门: the vault door opens when both sides are the same. Every level uses "=" (R2-M3): L1 how many on the left (0
   too); L2 which card makes both sides the same (dots); L3 the same or not (dots, = or ≠); L4 the same or not (numbers);
   L5 the balance a + b = ? + c. "The same or not" has two answers: two doors in one question (一题两问, client
   2026-10-10), both must be right */
const MDoor = Object.assign({}, ZB, {
  kind0: 'door', verb: '等！', intro: '能量门，两边一样多！', praise: [], one: true,          /* no own praise: after a right "≠" it would say the opposite (R3-M1) */
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    if (d === 1) { const a = bagPick(G, 'z1a', [0, 1, 2, 3, 4, 5]); return { k: [1, a], mode: 'count', a, b: null, answer: a, opts: numOptions(G, a, 0, 6), say: '左边有几块？' }; }
    if (d === 2) { const n = rng.int(1, 5); return { k: [2, n], mode: 'match', a: n, b: null, answer: n, opts: numOptions(G, n, 1, 6), say: '哪张让两边一样多？' }; }
    if (d <= 4) {
      const hi = d === 3 ? 7 : 10, at = bagPick(G, 'z1j' + d, ['eq,eq', 'eq,ne', 'ne,eq', 'ne,ne']).split(',');
      const one = same => { let a, b; do { a = rng.int(1, hi - 1); b = rng.int(1, hi - a); } while (a + b < 3); const s = a + b, c = same ? s : (s >= hi || rng.chance(0.5) ? s - 1 : s + 1); return { a, b, c }; };
      const ds = at.map(x => one(x === 'eq'));
      return { k: [d, ds.map(x => x.a + '+' + x.b + ':' + x.c).join('|')], mode: 'judge', ds, a: ds[0].a, b: ds[0].b, c: ds[0].c, answer: at.join(','), opts: ['eq', 'ne', 'eq', 'ne'], say: '两边一样多吗？', fact: factOf('+', ds[0].a, ds[0].b), sup: d === 4 ? 1 : 0, sym: d === 4 };
    }
    let a, b, c; do { a = rng.int(1, 8); b = rng.int(1, 10 - a); c = rng.int(1, Math.max(1, a + b - 1)); } while (a + b < 4 || c >= a + b);
    const x = a + b - c;
    return { k: [5, a, b, c], mode: 'bal', a, b, c, answer: x, opts: numOptions(G, x, 0, 10), say: '方框里是几？', fact: factOf('+', x, c), sup: 1, sym: true };
  },
  audit(q) { if (q.mode !== 'judge') return W3X.auditNum(q); const r = q.ds.map(x => (x.a + x.b === x.c ? 'eq' : 'ne')); return { two: true, n: 2, pos: r.map(x => (x === 'eq' ? 0 : 1)), err: r.join(',') === q.answer ? null : 'signs ' + r }; },
  /* a door: two panels and the sign between them; `small` for the two doors of "the same or not" */
  makeDoor(st, q, small) {
    const door = W2X.thing(st, 10, 10, 3, '');
    door.innerHTML = '<svg viewBox="0 0 600 320" width="100%" height="100%" preserveAspectRatio="none"><rect x="6" y="6" width="588" height="308" rx="40" fill="#C9D2DC" stroke="#2B2118" stroke-width="8"/><rect x="24" y="24" width="250" height="272" rx="26" fill="#FFF8EC" stroke="#2B2118" stroke-width="6"/><rect x="326" y="24" width="250" height="272" rx="26" fill="#FFF8EC" stroke="#2B2118" stroke-width="6"/></svg>';
    const sign = el('div', '', door); sign.textContent = q.mode === 'judge' ? '?' : '='; Object.assign(sign.style, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', font: '900 ' + (small ? 60 : 74) + 'px/1 system-ui,sans-serif', color: '#8892A0' });
    const panel = x => { const p = el('div', '', door); Object.assign(p.style, { position: 'absolute', left: x, top: '7.5%', width: '42%', height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: small ? '6px' : '10px', flexWrap: 'wrap' }); return p; };
    const left = panel('4%'), right = panel('54%'), out = { door, sign, left, right };
    const ring = () => { const z = el('div', ''); Object.assign(z.style, { width: '44px', height: '44px', borderRadius: '50%', border: '4px dashed #2B2118' }); return z; };
    const g = small ? 26 : 32, grp = (n, c) => (n ? V2G.dots(n, { g, r: g * 0.375, per: 5, fill: c }) : ring());
    if (q.mode === 'count' || q.mode === 'match') { left.appendChild(q.a ? V2G.dots(q.a, { g: 44, r: 17, per: 3, fill: '#4FB3FF' }) : ring()); right.appendChild(V2G.op('?', 90)); }
    else if (q.mode === 'judge' && !q.sym) { left.appendChild(grp(q.a, '#4FB3FF')); left.appendChild(V2G.op('+', small ? 32 : 40)); left.appendChild(grp(q.b, '#FFC93C')); right.appendChild(V2G.dots(q.c, { g, r: g * 0.375, per: 5, fill: '#5CC46E' })); }
    else if (q.mode === 'judge') { left.appendChild(V2G.eq([q.a, '+', q.b], 1, small ? 44 : 56)); right.appendChild(UI.num(q.c, small ? 80 : 96)); }
    else { left.appendChild(V2G.eq([q.a, '+', q.b], 1, 50)); out.eqR = V2G.eq(['?', '+', q.c], 1, 50); right.appendChild(out.eqR); }
    return out;
  },
  present(st) {
    const q = st.q;
    if (q.mode === 'judge') {
      st.doorsJ = q.ds.map(x => this.makeDoor(st, Object.assign({ mode: 'judge', sym: q.sym }, x), true)); st.pick = [null, null];
      W2X.cards(st, q.opts.map(t => { const e = el('div', ''); e.textContent = t === 'eq' ? '=' : '≠'; Object.assign(e.style, { font: '900 80px/1 system-ui,sans-serif', color: t === 'eq' ? '#2E9E4F' : '#8A5A2E', pointerEvents: 'none' }); return e; }), q.opts, { size: 116, gap: 20, cx: 512, cy: 600 });
      this.place(st); st.doorsJ.forEach((d, i) => K.pop(st, d.door, 120 * i));
      K.say(st, q.say); return;
    }
    const D = this.makeDoor(st, q, false); st.door = D.door; st.eqSign = D.sign; st.left = D.left; st.slot = D.right; st.eqR = D.eqR;
    this.place(st); K.pop(st, st.door);
    if (q.mode === 'match') { const s = V2G.size5(q.opts.length, [this.cardFr(true), this.cardFr(false)]); W2X.cards(st, q.opts.map(n => V2G.dots(n, { g: Math.min(28, s * 0.22), r: Math.min(11, s * 0.085), per: 3, fill: '#4FB3FF' })), q.opts, { size: s, gap: 16, cx: 512, cy: 600 }); this.placeCards(st); }
    else this.cardRow(st, q.opts, q.mode === 'count' ? 0 : q.sup);
    K.say(st, q.say);
  },
  /* the two doors of "the same or not": side by side, each with its = and ≠ under it (landscape); one above the other, the
     signs on their right (portrait) */
  place(st) {
    const L = K.L();
    if (st.doorsJ) {
      st.doorsJ.forEach((d, k) => {
        const x = L ? (k ? 528 : 36) : 24, y = L ? 104 : (k ? 560 : 220), w = L ? 460 : 480, h = L ? 250 : 260; place(d.door, x, y, w, h);
        (st.cards || []).slice(2 * k, 2 * k + 2).forEach((c, j) => (L ? place(c, x + w / 2 - 128 + j * 140, y + h + 26, 116, 116) : place(c, x + w + 34, y + 8 + j * 132, 116, 116)));
      });
      return;
    }
    if (st.door) place(st.door, L ? 210 : 52, L ? 70 : 220, 600, 320);
    this.placeCards(st);
  },
  onGesture(st, name, p) {
    if (!st.doorsJ) return W3X.tapCards(st, name, p);
    const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || st.picked) return false;
    const k = i < 2 ? 0 : 1; st.pick[k] = st.opts[i]; st.cards.slice(2 * k, 2 * k + 2).forEach((c, j) => c.classList.toggle('hi', 2 * k + j === i)); Sfx.place();
    if (st.pick.every(x => x != null)) { st.picked = true; Session.submit(st, st.pick.join(',')); }
    return 'ok';
  },
  next(st, strat) {
    if (!st.doorsJ) return ZB.next.call(this, st, strat);
    if (st.picked) return null;
    const want = st.q.answer.split(','), k = st.pick[0] == null ? 0 : 1, i = 2 * k + (want[k] === 'eq' ? 0 : 1);
    return { g: 'tap', p: { id: 'card' + (strat === 'wrong' && k === 0 ? 2 * k + (1 - (i - 2 * k)) : i) } };
  },
  /* what makes the answer: the number in the right panel / the green dots / the box filled */
  async show(st) {
    const q = st.q;
    if (q.mode === 'count') { st.slot.innerHTML = ''; st.slot.appendChild(UI.num(q.answer, 120)); }
    else if (q.mode === 'match') { st.slot.innerHTML = ''; st.slot.appendChild(V2G.dots(q.a, { g: 44, r: 17, per: 3, fill: '#5CC46E' })); }
    else if (q.mode === 'bal') { const s = st.eqR && st.eqR.querySelector('[data-slot]'); if (s && !s.dataset.filled) { s.dataset.filled = '1'; s.style.border = '0'; s.style.background = 'transparent'; s.appendChild(UI.num(q.answer, 50)); } }
    if (st.eqSign) { st.eqSign.style.color = '#5CC46E'; st.scope.anim(st.eqSign, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.6)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 600, easing: EASE.pop }); }
  },
  /* a door's sign is put in (= green, ≠ brown) */
  sign(st, d, t) { d.sign.textContent = t === 'eq' ? '=' : '≠'; d.sign.style.color = t === 'ne' ? '#8A5A2E' : '#5CC46E'; st.scope.anim(d.sign, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.6)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 600, easing: EASE.pop }); },
  async reveal(st) {
    const q = st.q;
    if (st.doorsJ) {
      const want = q.answer.split(',');
      for (let k = 0; k < 2; k++) { if (!Session.alive(st)) return; this.sign(st, st.doorsJ[k], want[k]); K.hop(st, st.cards[2 * k + (want[k] === 'eq' ? 0 : 1)], 24); Voice.say(want[k] === 'ne' ? '不一样多！' : '一样多！', { tag: 'summary' }); await st.scope.wait(T(700)); }
      Sfx.reveal(); this.cheerAll(st); await st.scope.wait(T(900)); return;
    }
    await this.show(st);
    Sfx.reveal();
    Voice.say(q.mode === 'count' && q.answer === 0 ? '空的就是零！' : '两边一样多！', { tag: 'summary' });
    this.cheerAll(st); await st.scope.wait(T(1300));
  },
  /* after a wrong answer, "the same or not": under every panel how many it has, then the door's sign; his sign (blue), the
     right one (gold). The other levels: his card, the number shown, the right card */
  async explain(st, ans) {
    if (!st.doorsJ) { await ZB.explain.call(this, st, ans); return; }
    const q = st.q, my = st, got = String(ans).split(','), want = q.answer.split(',');
    [0, 1].forEach(k => { if (got[k] !== want[k]) W3X.mine(st, st.cards[2 * k + (got[k] === 'eq' ? 0 : 1)], 4); });
    for (let k = 0; k < 2; k++) {
      if (!Session.alive(my)) return;
      const d = st.doorsJ[k], x = q.ds[k], b = box(d.door);
      W3X.badgeAt(st, b.x + b.w * 0.25, b.y + b.h - 6, x.a + x.b, 50); W3X.badgeAt(st, b.x + b.w * 0.75, b.y + b.h - 6, x.c, 50);
      await st.scope.wait(T(700)); if (!Session.alive(my)) return;
      this.sign(st, d, want[k]); W3X.gold(st, st.cards[2 * k + (want[k] === 'eq' ? 0 : 1)], 4, 0);
      W3X.tell(want[k] === 'ne' ? '不一样多！' : '一样多！');
      await W3X.beat(st, 1200);
    }
  },
  wrongLine(st, ans) { const q = st.q; if (q.mode === 'judge') { const got = String(ans).split(','), want = q.answer.split(','), k = got[0] !== want[0] ? 0 : 1; return got[k] === 'eq' ? '两边不一样多' : '两边一样多'; } if (q.mode === 'match') return '两边不一样多'; return ans === 0 ? '这边不是空的' : W2Say.notN(ans); },
  async feedback(st, ans) {
    if (st.doorsJ) { const got = String(ans).split(','), want = st.q.answer.split(','), k = got[0] !== want[0] ? 0 : 1; K.wiggle(st, st.cards[2 * k + (got[k] === 'eq' ? 0 : 1)]); W3X.say(this.wrongLine(st, ans)); await st.scope.wait(T(700)); return; }
    await ZB.feedback.call(this, st, ans);
  },
});
/* Z2 机器人合体: Optimus carries a, Bumblebee carries b; together they become one sentence a + b = ?; later one load is in a
   closed chest: a + ? = c (the missing part) */
const MCombine = Object.assign({}, ZB, {
  kind0: 'combine', verb: '合！', intro: '机器人合体！', praise: ['合体成功！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, hi = [0, 5, 7, 9, 10, 10][d], a = rng.int(1, hi - 2), b = rng.int(1, hi - a), c = a + b;
    const miss = d >= 3 && bagPick(G, 'z2m' + d, d === 3 ? ['sum', 'b'] : ['sum', 'b', 'a']) || 'sum';
    const ans = miss === 'sum' ? c : miss === 'b' ? b : a;
    return { k: [d, a, b, miss], a, b, c, miss, answer: ans, opts: numOptions(G, ans, 0, hi), say: miss === 'sum' ? '一共几块？' : '箱子里有几块？', fact: factOf('+', a, b), sup: d >= 4 ? 1 : 0, sym: d === 5 };
  },
  present(st) {
    const q = st.q, L = K.L();
    const mk = (n, hidden, color) => { const e = W2X.thing(st, 10, 10, 5, ''); e.style.width = e.style.height = 'auto'; Object.assign(e.style, { padding: '12px', background: hidden ? '#8A5A2E' : 'rgba(255,255,255,.92)', borderRadius: '20px', boxShadow: '0 0 0 4px #2B2118', minWidth: '120px', minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }); if (hidden) e.appendChild(V2G.op('?', 56)); else e.appendChild(V2G.dots(n, { g: 30, r: 11, per: 5, fill: color })); return e; };
    st.ga = mk(q.a, q.miss === 'a', '#4FB3FF'); st.gb = mk(q.b, q.miss === 'b', '#FFC93C');
    if (q.sym) { st.ga.style.display = 'none'; st.gb.style.display = 'none'; }                 /* the top level: the sentence only */
    const parts = q.miss === 'sum' ? [q.a, '+', q.b, '=', '?'] : q.miss === 'b' ? [q.a, '+', '?', '=', q.c] : ['?', '+', q.b, '=', q.c];
    st.eqEl = W2X.thing(st, 10, 10, 6, ''); st.eqEl.style.width = st.eqEl.style.height = 'auto'; Object.assign(st.eqEl.style, { padding: '10px 18px', background: '#fff', borderRadius: '22px', boxShadow: '0 0 0 4px #2B2118' }); st.eqEl.appendChild(V2G.eq(parts, 1, 58));
    this.place(st); K.pop(st, st.ga); K.pop(st, st.gb, 120); K.pop(st, st.eqEl, 240);
    this.cardRow(st, q.opts, q.sup);
    if (q.miss !== 'sum') { W3X.say2(st, '一共' + CNQ(q.c) + '块。', q.say); } else K.say(st, q.say);
    void L;
  },
  place(st) {
    const L = K.L();
    if (st.ga) place(st.ga, L ? 250 : 80, L ? 120 : 260); if (st.gb) place(st.gb, L ? 620 : 420, L ? 120 : 260);
    if (st.eqEl) place(st.eqEl, L ? 300 : 90, L ? 330 : 520);
    this.placeCards(st);
  },
  /* the hidden load opens, the two loads fly together into one (合体) */
  async show(st) {
    const q = st.q, L = K.L();
    if (st.shown) return; st.shown = true;
    this.fillSlot(st, q.answer);
    if (q.miss !== 'sum') { const h = q.miss === 'a' ? st.ga : st.gb; h.innerHTML = ''; h.style.background = 'rgba(255,255,255,.92)'; h.appendChild(V2G.dots(q.answer, { g: 30, r: 11, per: 5, fill: q.miss === 'a' ? '#4FB3FF' : '#FFC93C' })); }
    if (!q.sym) {
      await Promise.all([st.scope.anim(st.ga, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (L ? 180 : 160) + 'px)' }], { duration: 450, fill: 'forwards', easing: EASE.glide }), st.scope.anim(st.gb, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (L ? -190 : -170) + 'px)' }], { duration: 450, fill: 'forwards', easing: EASE.glide })]);
      st.gb.style.display = 'none'; st.ga.innerHTML = ''; const row = el('div', '', st.ga); Object.assign(row.style, { display: 'flex', gap: '8px' }); row.appendChild(V2G.dots(q.a, { g: 30, r: 11, per: 5, fill: '#4FB3FF' })); row.appendChild(V2G.dots(q.b, { g: 30, r: 11, per: 5, fill: '#FFC93C' }));
      st.scope.anim(st.ga, [{ transform: 'translateX(' + (L ? 180 : 160) + 'px) scale(1)' }, { transform: 'translateX(' + (L ? 180 : 160) + 'px) scale(1.15)' }, { transform: 'translateX(' + (L ? 180 : 160) + 'px) scale(1)' }], { duration: 400, fill: 'forwards', easing: EASE.pop });
    }
  },
  async reveal(st) {
    const L = K.L();
    await this.show(st); if (!Session.alive(st)) return;
    Sfx.reveal(); Fx.burst && Fx.burst((L ? 480 : 300), (L ? 170 : 320), { n: 14 });
    Voice.say('合体成功！', { tag: 'summary' }); this.cheerAll(st); await st.scope.wait(T(1200));
  },
});
/* Z3 卸货: Bumblebee's truck - the child unloads b crates (taps them off), then: how many are left? Later: some were
   unloaded behind the door - how many? (the unknown part) */
const MUnload = Object.assign({}, ZB, {
  kind0: 'unload', verb: '卸！', intro: '帮大黄蜂卸货！', praise: ['卸货真快！'], one: true,
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, hi = [0, 5, 7, 9, 10, 10][d], n = rng.int(3, hi), b = rng.int(1, n - 1), r = n - b;
    const kind = d >= 3 ? bagPick(G, 'z3k' + d, ['left', 'took']) : 'left';
    const ans = kind === 'left' ? r : b;
    return { k: [d, n, b, kind], n, b, r, kind, answer: ans, opts: numOptions(G, ans, 0, hi), fact: factOf('-', n, b), sup: d >= 4 ? 1 : 0, act: kind === 'left' && d <= 3, sym: d === 5 };
  },
  present(st) {
    const q = st.q, L = K.L(), my = st;
    if (q.sym) {                                     /* the top level: the number sentence only, no truck (L8) */
      st.crates = []; st.eqEl = W2X.thing(st, 10, 10, 6, ''); st.eqEl.style.width = st.eqEl.style.height = 'auto'; Object.assign(st.eqEl.style, { padding: '14px 24px', background: '#fff', borderRadius: '26px', boxShadow: '0 0 0 5px #2B2118' });
      st.eqEl.appendChild(V2G.eq(q.kind === 'left' ? [q.n, '-', q.b, '=', '?'] : [q.n, '-', '?', '=', q.r], 1, 72));
      this.place(st); K.pop(st, st.eqEl); st.phase = 'ready'; this.cardRow(st, q.opts, q.sup);
      if (q.kind === 'left') K.say(st, '还剩几箱？'); else W3X.say2(st, '还剩' + CNQ(q.r) + '箱。', '搬走了几箱？');
      return;
    }
    st.bed = W2X.thing(st, 10, 10, 3, ''); st.bed.innerHTML = '<svg viewBox="0 0 520 160" width="100%" height="100%" preserveAspectRatio="none"><rect x="6" y="20" width="420" height="96" rx="12" fill="#FFC93C" stroke="#2B2118" stroke-width="7"/><rect x="426" y="40" width="88" height="76" rx="14" fill="#2B2118"/><circle cx="90" cy="130" r="26" fill="#3A3A3A" stroke="#2B2118" stroke-width="6"/><circle cx="350" cy="130" r="26" fill="#3A3A3A" stroke="#2B2118" stroke-width="6"/><circle cx="470" cy="130" r="22" fill="#3A3A3A" stroke="#2B2118" stroke-width="6"/></svg>';
    st.crates = Array.from({ length: q.n }, (_, i) => { const e = K.item(Stage.el, 'assets/props/crate.png', 90, 90); e.style.zIndex = 6; st.els.push(e); K.reg(st, 'cr' + i, e, {}); return { e, off: !q.act && q.kind === 'took' ? i >= q.r : false }; });
    st.eqEl = W2X.thing(st, 10, 10, 6, ''); st.eqEl.style.width = st.eqEl.style.height = 'auto'; Object.assign(st.eqEl.style, { padding: '10px 18px', background: '#fff', borderRadius: '22px', boxShadow: '0 0 0 4px #2B2118' });
    st.eqEl.appendChild(V2G.eq(q.kind === 'left' ? [q.n, '-', q.b, '=', '?'] : [q.n, '-', '?', '=', q.r], 1, 56));
    this.place(st); K.pop(st, st.bed); st.crates.forEach((o, i) => K.pop(st, o.e, 40 * i));
    if (q.act) {                                     /* the child unloads first (act), then the question comes */
      st.phase = 'act'; st.need = q.b; K.say(st, '搬走' + CNQ(q.b) + '箱！');
      st.actRes = () => { if (Session.alive(my)) this.ask(st); };
      return;
    }
    if (q.kind === 'took') { st.gdoor = W2X.thing(st, 190, 190, 5, ''); st.gdoor.innerHTML = '<svg viewBox="0 0 190 190" width="100%" height="100%"><rect x="6" y="6" width="178" height="178" rx="18" fill="#8A5A2E" stroke="#2B2118" stroke-width="8"/><path d="M20 50H170M20 90H170M20 130H170" stroke="#6B4A2E" stroke-width="6"/></svg>'; const qm = el('div', '', st.gdoor); Object.assign(qm.style, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }); qm.appendChild(V2G.op('?', 84)); this.place(st); K.pop(st, st.gdoor); W3X.say2(st, '还剩' + CNQ(q.r) + '箱。', '搬走了几箱？'); this.cardRow(st, q.opts, q.sup); return; }
    this.ask(st);
    void L;
  },
  ask(st) { const q = st.q; st.phase = 'ready'; K.pop(st, st.eqEl); this.cardRow(st, q.opts, q.sup); K.say(st, '还剩几箱？'); },
  place(st) {
    const L = K.L(), B = L ? { x: 120, y: 200 } : { x: 92, y: 300 };
    if (st.bed) place(st.bed, B.x, B.y + 40, 520, 160);
    /* the unloaded crates: by the truck when the child unloads them (they count them), behind the garage door when the
       question is how many went (the unknown part is not seen, M5); portrait: three a row, above the five cards */
    let k = 0; (st.crates || []).forEach(o => { if (o.off) { if (st.q.kind === 'took' && !st.revealed) place(o.e, -400, -400, 90, 90); else if (L) place(o.e, 680 + (k % 3) * 94, 150 + Math.floor(k++ / 3) * 94, 90, 90); else place(o.e, 420 + (k % 3) * 92, 510 + Math.floor(k++ / 3) * 92, 90, 90); } else { const i = st.crates.filter(x => !x.off).indexOf(o); place(o.e, B.x + 10 + (i % 5) * 100, B.y - 30 + (i >= 5 ? -94 : 0), 90, 90); } });
    if (st.gdoor) place(st.gdoor, L ? 700 : 480, L ? 150 : 520, 190, 190);
    if (st.eqEl) { if (st.q.sym) { const w = st.eqEl.getBoundingClientRect().width / (Stage.scale || 1); place(st.eqEl, Math.round((L ? 512 : 352) - w / 2), L ? 230 : 360); } else place(st.eqEl, L ? 250 : 60, L ? 420 : 560); }
    this.placeCards(st);
  },
  onGesture(st, name, p) {
    const m = /^cr(\d+)$/.exec(p.id || '');
    if (name === 'tap' && m && st.q.act && st.need > 0) { const o = st.crates[+m[1]]; if (o.off) return 'ok'; o.off = true; st.need--; st.childOps++; Sfx.whoosh(0.2); this.place(st); if (st.need === 0 && st.actRes) st.scope.timeout(() => st.actRes(), T(400) + 1); return 'ok'; }
    return W3X.tapCards(st, name, p);
  },
  next(st, strat) { if (st.q.act && st.need > 0) { const i = st.crates.findIndex(o => !o.off); return { g: 'tap', p: { id: 'cr' + i } }; } return ZB.next.call(this, st, strat); },
  /* the box filled; the door opens; the crates asked about (left on the truck / taken off) are counted */
  async show(st) {
    const q = st.q, my = st;
    this.fillSlot(st, q.answer); st.revealed = true; if (st.gdoor) st.gdoor.style.display = 'none';
    /* the crates that go (when the child did not carry them off himself): they come off the truck first */
    const off = (st.crates || []).filter(o => o.off).length; if (st.explaining && q.kind === 'left' && st.crates && st.crates.length && off < q.b) { st.crates.filter(o => !o.off).slice(-(q.b - off)).forEach(o => { o.off = true; }); Sfx.whoosh(0.2); this.place(st); await st.scope.wait(T(600)); if (!Session.alive(my)) return; }
    this.place(st);
    const cs = (st.crates || []).filter(o => (q.kind === 'left' ? !o.off : o.off));
    for (let i = 0; i < cs.length && st.explaining; i++) { if (!Session.alive(my)) return; K.hop(st, cs[i].e, 14); await W3X.count(st, 260, i + 1); }
  },
  async reveal(st) { await this.show(st); if (!Session.alive(st)) return; Sfx.reveal(); Voice.say('卸货真快！', { tag: 'summary' }); this.cheerAll(st); await st.scope.wait(T(1100)); },
  wrongLine(st, ans) { return ans === 0 ? '不是零' : '不是' + (CNQ(ans) || ans) + '箱'; },
});
/* Z4 三个数是一家: the triangle of a whole and its two parts - which number sentence belongs to it? */
const MFamily = Object.assign({}, ZB, {
  kind0: 'family', verb: '连！', intro: '三个数是一家！', praise: ['它们是一家！'], one: true,
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, hi = [0, 5, 7, 9, 10, 10][d], w = rng.int(3, hi), a = rng.int(1, w - 1), b = w - a;
    const ops = d <= 2 ? ['+'] : ['+', '-'], op = rng.pick(ops);
    const ok = op === '+' ? [a, '+', b, '=', w] : [w, '-', a, '=', b];
    /* the wrong ones are false sentences (never a true one from another family - a 4-year-old would rightly take it): four
       of them, the near ones first */
    const alt = [[a, '+', b, '=', w + 1], [w, '-', a, '=', b + 1], [a + 1, '+', b, '=', w], [w, '-', b, '=', a + 1], [w, '-', a, '=', Math.max(0, b - 1)], [a, '+', b, '=', w - 1], [b, '+', a, '=', w + 1], [w, '-', b, '=', Math.max(0, a - 1)], [a, '+', b + 1, '=', w], [w + 1, '-', a, '=', b], [a, '+', b, '=', w + 2]]
      .filter(x => (x[1] === '+' ? x[0] + x[2] : x[0] - x[2]) !== x[4]).filter(s => s.every(x => typeof x !== 'number' || (x >= 0 && x <= 19)) && JSON.stringify(s) !== JSON.stringify(ok));
    const near = op === '+' ? alt.filter(s => s[1] === '+') : alt.filter(s => s[1] === '-'), bad = W3X.uniq(rng.shuffle(near).concat(rng.shuffle(alt)), s => JSON.stringify(s), 4);
    const opts = W3X.deal(G, ok, bad, 'z4');
    const hide = d === 5 ? rng.pick(['w', 'a', 'b']) : null;          /* the top level: one number of the family is hidden (L8) */
    return { k: [d, w, a, op, hide], w, a, b, op, hide, eqs: opts, answer: opts.indexOf(ok), opts: opts.map((_, i) => i), fact: op === '+' ? factOf('+', a, b) : factOf('-', w, a), sup: d >= 3 ? 1 : 0 };
  },
  audit(q) { const tru = q.eqs.filter(e => (e[1] === '+' ? e[0] + e[2] : e[0] - e[2]) === e[4]); return { n: q.eqs.length, pos: q.answer, err: tru.length === 1 && q.eqs.indexOf(tru[0]) === q.answer ? null : 'true ones ' + tru.length }; },
  present(st) {
    const q = st.q, tri = st.tri = W2X.thing(st, 10, 10, 5, '');
    tri.innerHTML = '<svg viewBox="0 0 300 260" width="100%" height="100%"><path d="M150 30L270 230H30Z" fill="#E8F4FF" stroke="#2B2118" stroke-width="7" stroke-linejoin="round"/></svg>';
    st.triN = [];
    const put = (n, x, y) => { const c = el('div', '', tri); Object.assign(c.style, { position: 'absolute', left: x + '%', top: y + '%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: '50%', width: '96px', height: '96px', boxShadow: '0 0 0 4px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center' }); c.appendChild(n === '?' ? V2G.op('?', 54) : q.sup ? UI.num(n, 54) : V2G.numCard(n, 0, 40)); st.triN.push(c); };
    put(q.hide === 'w' ? '?' : q.w, 50, 20); put(q.hide === 'a' ? '?' : q.a, 14, 86); put(q.hide === 'b' ? '?' : q.b, 86, 86);
    st.cards = q.eqs.map((s, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(V2G.eq(s, 1, 46)); K.pop(st, c, 80 * i); return c; });
    st.opts = q.opts.slice();
    this.place(st); K.pop(st, tri);
    K.say(st, '哪个算式是一家？');
  },
  /* five sentences, one per row: right of the triangle (landscape), under it (portrait) */
  place(st) { const L = K.L(); if (st.tri) place(st.tri, L ? 90 : 202, L ? 150 : 190, 300, 260); RQ.rows(st, L ? { x: 430, y: 100, w: 570, h: 590 } : { x: 60, y: 460, w: 584, h: 550 }); },
  async reveal(st) { const e = st.cards[st.q.answer]; K.hop(st, e, 24); K.ring(st, [box(e)], 2, '#5CC46E'); Sfx.reveal(); Voice.say('它们是一家！', { tag: 'summary' }); this.cheerAll(st); await st.scope.wait(T(1200)); },
  async feedback(st, ans) { const e = st.cards[ans]; if (e) K.wiggle(st, e); W3X.say('这个不是一家'); await st.scope.wait(T(700)); },
  /* after a wrong answer: his sentence worked out (what it really makes, beside its result: blue), the family's numbers hop,
     the true sentence (gold) */
  async explain(st, ans) { await RQ.explainEq(st, ans, async () => { (st.triN || []).forEach((c, i) => st.scope.timeout(() => K.hop(st, c, 14), 160 * i)); await st.scope.wait(T(700)); }); },
});
const ICZ = (() => { const k = '#2B2118', I = s => W2X.icon(s); return {
  door: I('<rect x="8" y="16" width="84" height="68" rx="12" fill="#C9D2DC" stroke="' + k + '" stroke-width="5"/><path d="M38 44H62M38 56H62" stroke="#5CC46E" stroke-width="7" stroke-linecap="round"/>'),
  combine: I('<rect x="6" y="30" width="34" height="40" rx="8" fill="#4FB3FF" stroke="' + k + '" stroke-width="5"/><rect x="60" y="30" width="34" height="40" rx="8" fill="#FFC93C" stroke="' + k + '" stroke-width="5"/><path d="M44 50H56M50 44V56" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/>'),
  unload: I('<rect x="6" y="40" width="62" height="34" rx="6" fill="#FFC93C" stroke="' + k + '" stroke-width="5"/><rect x="68" y="48" width="24" height="26" rx="5" fill="' + k + '"/><rect x="18" y="14" width="22" height="22" fill="#E8862E" stroke="' + k + '" stroke-width="4"/><circle cx="24" cy="80" r="8" fill="' + k + '"/><circle cx="76" cy="80" r="8" fill="' + k + '"/>'),
  family: I('<path d="M50 10L92 86H8Z" fill="#E8F4FF" stroke="' + k + '" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="26" r="10" fill="#FF6B5B"/><circle cx="20" cy="78" r="10" fill="#4FB3FF"/><circle cx="80" cy="78" r="10" fill="#FFC93C"/>'),
}; })();
w3GameV2(MDoor, { id: 'Z1', world: 'trans3', bg: 'trans_vault', chars: ['optimus', 'bumblebee'], host: 'optimus', iconSrc: ICZ.door, props: ['cube'] });
w3GameV2(MCombine, { id: 'Z2', world: 'trans3', bg: 'trans_hangar', chars: ['optimus', 'bumblebee'], host: 'optimus', iconSrc: ICZ.combine });
w3GameV2(MUnload, { id: 'Z3', world: 'trans3', bg: 'trans_dock', chars: ['bumblebee', 'optimus'], host: 'bumblebee', iconSrc: ICZ.unload, props: ['crate'] });
w3GameV2(MFamily, { id: 'Z4', world: 'trans3', bg: 'trans_control', chars: ['optimus', 'bumblebee'], host: 'optimus', iconSrc: ICZ.family });
function w3GameV2(rule, spec) { const g = defGame(Object.assign({}, W2Base, rule, spec)); g.props = (spec.props || []).filter((p, i, a) => a.indexOf(p) === i); return g; }

/* ---------------------------------------------------------------- the daily key and the hero cards (A.13; client 2026-10-11:
   like 字字岛's - the gems are gone). The first visit of a day "找回老朋友" (up to 5 due cards; done = the key, right or
   not; skippable; nothing due -> the key at once): the key opens the next hero card at once; planting an island's flag
   opens one too (the flag waits for it). One fixed order, no chance, nothing lost; all out -> the key opens the album.
   The cards are the client's own character pictures (assets/chars), favourites spread out. Store.s.gems.n = cards out. */
const CARDS = ['optimus', 'ultraman', 'ironman', 'chase', 'bumblebee', 'spiderman', 'wukong', 'zero', 'captain', 'catboy',
  'hulk', 'gourd1', 'kaiju1', 'thor', 'marshall', 'owlette', 'panther', 'gourd2', 'skye', 'miles', 'kaiju2', 'gekko', 'gourd3',
  'widow', 'rubble', 'bajie', 'hawkeye', 'gourd7', 'zuma', 'dragon_horse', 'pj_robot', 'rocky', 'shaseng', 'bluey', 'peppa',
  'ryder', 'bingo', 'george',
  /* 积木城 (client 2026-10-17, via docs/W5-DESIGN.md §10.5): every other picture of the client's in assets/chars, appended so
     no card already out changes */
  'gourd4', 'tangseng', 'luna_girl', 'grandpa', 'bandit', 'gourd5', 'romeo', 'daddy_pig', 'gourd6', 'chilli', 'snake', 'mummy_pig', 'scorpion'];
Object.assign(Gems, {
  card(src) {
    this.migrate();
    const a = Store.s.gems;
    if (a.n >= CARDS.length) { if (!fast() && (src === 'key' || src === 'free')) this.album(); else if (src === 'flag') Voice.say('卡册满啦！', { tag: 'card' }); return Promise.resolve(); }
    a.n++; a.src.push(src); Store.save();
    return fast() ? Promise.resolve() : this.reveal(CARDS[a.n - 1]);
  },
  /* a save from the gems: 6 gems were a hero - the heroes shown stay, a started hero's gems open the next card now (shown
     once on the next map visit) */
  migrate() {
    const a = Store.s.gems; if (a.src.includes('@cards')) return;
    const old = a.n, heroes = Math.floor(old / 6);
    a.n = Math.min(CARDS.length, heroes + (old % 6 > 0 ? 1 : 0)); a.src = a.src.filter(x => !/^@/.test(x)).slice(-150); a.src.push('@cards');
    if (a.n > heroes) a.src.push('@show');
    Store.save();
  },
  /* on the map: the card the move to cards opened, shown once */
  pending() {
    this.migrate();
    const a = Store.s.gems, i = a.src.indexOf('@show');
    if (i < 0 || fast() || Screens.cur !== 'map' || Session.G || document.getElementById('cardshow')) return;
    a.src.splice(i, 1); Store.save();
    if (a.n > 0) this.reveal(CARDS[Math.min(a.n, CARDS.length) - 1]);
  },
  reveal(id) {
    const ov = el('div', '', document.body); ov.id = 'cardshow';
    Object.assign(ov.style, { position: 'fixed', inset: 0, zIndex: 70, background: 'radial-gradient(circle,#FFF6C8 0%,#FFC93C 45%,#E8862E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const c = el('div', '', ov); Object.assign(c.style, { width: '300px', height: '400px', borderRadius: '28px', background: '#fff', boxShadow: '0 0 0 6px #2B2118, 0 0 0 16px #FFE08A, 0 20px 50px rgba(0,0,0,.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' });
    const im = img('assets/chars/' + id + '.png', '', c); Object.assign(im.style, { height: '92%', maxWidth: '96%', objectFit: 'contain' });
    c.animate([{ transform: 'rotateY(90deg) scale(.4)' }, { transform: 'rotateY(0) scale(1.08)', offset: 0.7 }, { transform: 'rotateY(0) scale(1)' }], { duration: T(900) + 1, easing: EASE.pop });
    Sfx.fanfare(); Fx.confetti(40); Voice.sayNow('新朋友来啦！', { tag: 'card' });
    return new Promise(res => {
      const off = () => { if (ov.isConnected) { ov.remove(); MapView.update && MapView.update(); } res(); };
      tapify(ov, off);
      setTimeout(off, T(3600) + 200);
    });
  },
  /* the album (the map's chest): every card, those out in colour, the rest dark silhouettes; the key starts from here */
  album() {
    this.migrate();
    const ov = el('div', '', document.body); ov.id = 'gems';
    Object.assign(ov.style, { position: 'fixed', inset: 0, zIndex: 55, background: 'linear-gradient(#2B3E8C,#4B2F9E)', overflowY: 'auto', padding: '120px 20px 40px', boxSizing: 'border-box' });
    const home = el('button', 'btn', ov); Object.assign(home.style, { position: 'fixed', left: 'calc(14px + var(--sl))', top: 'calc(14px + var(--st))', width: '96px', height: '96px', background: '#FFE08A' }); img('assets/props/ui_home.png', '', home).style.width = '74%'; tapify(home, () => ov.remove());
    if (this.avail()) {
      const go = el('button', 'btn', ov); Object.assign(go.style, { position: 'fixed', right: 'calc(14px + var(--sr))', top: 'calc(14px + var(--st))', width: '140px', height: '96px', background: '#5CC46E' });
      img('assets/props/chest.png', '', go).style.height = '80%';
      tapify(go, () => { ov.remove(); this.start(); });
      go.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 1200, iterations: Infinity });
    }
    const grid = el('div', '', ov); Object.assign(grid.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '16px', maxWidth: '980px', margin: '0 auto' });
    const n = Store.s.gems.n;
    CARDS.forEach((id, k) => {
      const c = el('div', '', grid); c.className = 'acard' + (k < n ? ' on' : '');
      Object.assign(c.style, { height: '160px', borderRadius: '18px', background: k < n ? '#fff' : 'rgba(255,255,255,.18)', boxShadow: '0 0 0 3px #2B2118', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' });
      const im = img('assets/chars/' + id + '.png', '', c); Object.assign(im.style, { height: '90%', maxWidth: '94%', objectFit: 'contain', filter: k < n ? '' : 'brightness(0) opacity(.5)' });
    });
    Voice.sayNow(this.avail() ? '找回老朋友！' : '我的英雄卡！', { tag: 'map' });
  },
});
/* the cards are here (this file comes a second after the entry tap): a save from the gems moves over; a card asked for
   before (core Gems.turn queued it) is opened now */
Gems.migrate(); (Gems.q || []).splice(0).forEach(src => Gems.card(src));

/* ---------------------------------------------------------------- the map: the gem chest (top right), the parent's red dot, the
   first map of the day says "找回老朋友！" */
Object.assign(MapV2, {
  ensure() {
    if ($('#gemchest')) return;
    const s = el('style', '', document.head); s.textContent = '#gear.dot::after{content:"";position:absolute;right:12px;top:12px;width:22px;height:22px;border-radius:50%;background:#E8414B;box-shadow:0 0 0 3px #fff}';
    const b = el('button', 'btn', $('#map')); b.id = 'gemchest'; b.setAttribute('aria-label', '英雄卡');
    Object.assign(b.style, { position: 'absolute', right: 'calc(14px + var(--sr))', top: 'calc(14px + var(--st))', width: '104px', height: '104px', background: '#FFF3C4', borderRadius: '28px', zIndex: 12 });
    const i = img('assets/props/chest.png', '', b); Object.assign(i.style, { width: '84%', height: '84%', objectFit: 'contain' });
    tapify(b, () => { MapView.closePanel(true); Gems.album(); });                 /* the album first; its chest button starts the key round (R2-L5) */
  },
  update() {
    this.ensure();
    if (typeof Laps !== 'undefined' && MapView.isl) Laps.draw(MapView);      /* crowns, rockets and sparkles by the flags */
    if (Screens.cur === 'map' && !Session.G) setTimeout(() => Gems.pending(), 400);       /* a card the move to cards opened: shown once */
    const c = $('#gemchest'), on = Gems.avail();
    if (on && !c._pulse) c._pulse = c.animate([{ transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,201,60,0)' }, { transform: 'scale(1.08)', boxShadow: '0 0 0 12px rgba(255,201,60,.85)' }, { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,201,60,0)' }], { duration: 1400, iterations: Infinity });
    if (!on && c._pulse) { c._pulse.cancel(); c._pulse = null; }
    $('#gear').classList.toggle('dot', Supply.low());
  },
  /* the day's greeting: once a day (saved), never while a hero card is showing - it waits for the card (PT3 3) */
  hello() { const D = Mem.today(); if (!Gems.avail() || D.hello || fast()) return; D.hello = 1; Store.save(); const say = (k) => { if (Screens.cur !== 'map' || Session.G) return; if (document.getElementById('cardshow')) { if (k < 20) setTimeout(() => say(k + 1), 600); return; } Voice.say('找回老朋友！', { tag: 'map' }); const b = $('#gemchest'); if (b) b.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0)' }], { duration: 600, iterations: 2 }); }; setTimeout(() => say(0), T(2600)); },
});
/* new content: the child has reached the last installed sea, or less than 14 days of islands left at last week's pace (A.28) */
const Supply = {
  low() {
    if (ORDER4.some(id => Store.w(id).unlocked)) return true;          /* the stars are the last installed world */
    const d = DAY(), recent = (Store.s.flagDays || []).filter(x => x > d - 7).length, left = ALLW().filter(id => W5.live(id) && !flagged(id)).length;
    return recent > 0 && left / (recent / 7) < 14;
  },
};
/* "停船还是继续" after about 12 minutes today (A.16): a ritual, never a gate */
Object.assign(StopGo, {
  maybe() {
    const mins = Store.s.settings.mins, D = Mem.today();
    if (!mins || D.asked || D.ms < mins * 60000 || fast()) return false;
    D.asked = 1; Store.save();
    const ov = el('div', '', $('#map')); Object.assign(ov.style, { position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(12,44,74,.66)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '60px' });
    const h = img('assets/chars/optimus.png', '', ov); h.style.height = '260px';
    const mk = (svgS, fn) => { const b = el('button', 'btn', ov); Object.assign(b.style, { position: 'relative', width: '170px', height: '170px', background: '#fff' }); b.innerHTML = svgS; tapify(b, fn); return b; };
    mk('<svg viewBox="0 0 60 60" width="78%" height="78%"><path d="M40 8A22 22 0 1 0 52 44A18 18 0 1 1 40 8Z" fill="#FFD84A" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/><path d="M44 16h8l-8 8h8" fill="none" stroke="#2B2118" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>', () => { ov.remove(); Voice.sayNow('明天见！', { tag: 'map' }); });
    mk('<svg viewBox="0 0 60 60" width="70%" height="70%"><path d="M18 10L48 30L18 50Z" fill="#5CC46E" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/></svg>', () => { ov.remove(); });
    Voice.sayNow('停船还是继续？', { tag: 'map' });
    return true;
  },
});
/* ---------------------------------------------------------------- the report for Opus, export / import */
const Report = {
  text() {
    const S = Store.s, d = DAY(), cs = Object.keys(S.mem), by = s => cs.filter(c => Mem.state(c) === s).map(cardName).join('、') || '-';
    const [r7, n7] = Mem.keep(7, 13), [r30, n30] = Mem.keep(30, 59);
    const where = ALLW().filter(id => Store.w(id).unlocked).slice(-1)[0], maps = new Set(ALLW().map(id => WORLDS[id].map || 1)).size;
    const days = Object.keys(S.days).map(Number).filter(x => x > d - 7).map(x => Math.round(S.days[x].ms / 60000) + '分').join(' ');
    return ['点点岛进度报告（' + new Date().toLocaleDateString() + '）', '位置：' + (where ? WORLDS[where].name : '-') + '；旗子 ' + (S.flags || []).length + ' 面；已装：' + CN[maps] + '个世界（积木城上线 ' + LIVE5.length + '/7 岛），运算岛在云上第 ' + (ORDER3.indexOf('trans3') + 1) + ' 个',
      '会了（隔 7 天还对）：' + by('known'), '学习中：' + by('learning'), '待复测：' + by('stale'),
      '今天到期 ' + Mem.due().length + '，逾期 ' + Mem.overdue(), '7 天保持率：' + (n7 ? Math.round(r7 * 100) + '%（' + n7 + '）' : '样本不足') + '；30 天：' + (n30 ? Math.round(r30 * 100) + '%（' + n30 + '）' : '样本不足'),
      '月测：' + (S.tests.length ? S.tests.map(t => t.ok + '/' + t.n).join(' ') : '还没测'), '考一考：' + (S.checks.length ? S.checks.map(c => c.yes + '/' + c.n).join(' ') : '还没做'),
      '最近 7 天每天时长：' + (days || '-'), '复习减量：' + (S.v2low ? '是（孩子在复习题处退出较多）' : '否')].join('\n');
  },
  export() { return btoa(unescape(encodeURIComponent(JSON.stringify(Store.s)))); },
  import(txt) { const o = JSON.parse(decodeURIComponent(escape(atob(txt.trim())))); Store.s = Store.validate(o); Store.save(); },
};
/* the two apps on one iPad: can they read each other's storage? (A.18 - a probe; nothing depends on it) */

/* ---------------------------------------------------------------- the monthly test (A.25): 15 questions from the same types,
   no stars, plain; the first one is the baseline */
const MonthTest = {
  plan() { return ['give10', 'give10', 'sub5', 'cmp10', 'cmp20', 'on10', 'next10', 'part5', 'part10', 'part10', 'ten20', 'add10', 'add10', 'sub10', 'sub10']; },
  /* a test left half way goes on from where it stopped (within a week) - it can be done in two sittings (A.25) */
  part() { const P = Store.s.testPart; return P && DAY() - P.day <= 7 && P.by.length < 15 ? P.by : []; },
  start() { Parent.close(); const isl = Gems.island(), part = this.part(); Session.start(isl, WORLDS[isl].games[0], { test: true, keyItems: this.plan().slice(part.length), noDemo: true, testRes: part }); },
  done(G) { const r = G.testRes || [], ok = r.filter(x => x[1]).length; Store.s.tests.push({ day: DAY(), n: r.length, ok, by: r }); delete Store.s.testPart; Store.save(); },
};
/* ---------------------------------------------------------------- the parent panel, v2 */
const LIFE = { give10: '拿几个勺子：给我 7 个！', on10: '数楼梯：已经走了 5 级，再走 3 级是几级？', part10: '分零食：8 块饼干分两盘', cmp10: '比一比：谁的积木多？', add10: '买东西：1 块钱和 2 块钱一共几块？', sub10: '吃水果：5 个苹果吃掉 2 个还剩几个？', ten20: '数一捆筷子：十根一捆，再加几根', next10: '电梯里看楼层：5 楼的上一层是几楼？', sub5: '掷骰子：一眼看出几个点', cmp20: '比身高：谁高一点？', next20: '数日历：今天几号，明天几号？', on20: '跳房子：从 12 接着数' };
const ParentV2 = {
  /* the parent panel's 教一教 (the gear opens on the map: the last game played) - here, out of the first screen */
  teach(sh, P) {
    /* 教一教: this game (open now, or the last one played) one or two levels lower, no stars, until turned off / left */
    { const G0 = Session.G && !Session.G.dead ? Session.G : null, inKey = !!(G0 && (G0.key || G0.test)), G = inKey ? null : G0, t = inKey ? null : G ? { w: G.world, g: G.id } : Teach.last;
      el('h3', '', sh, { text: '教一教（暂时降低难度，陪孩子学：对刚玩过的小游戏）' });
      if (inKey) el('div', 'mut', sh, { text: G0.key ? '钥匙局里不能教一教。' : '月测里不能教一教。' });
      else if (!t) el('div', 'mut', sh, { text: '先让孩子玩一个小游戏，再来这里。' });
      else {
        const row = el('div', '', sh), on = Teach.on && Teach.on.g === t.g ? Teach.on.down : 0;
        el('span', '', row, { text: t.g + '（' + WORLDS[t.w].name + '）' + (G ? '正在玩' : '刚玩过') + '：' });
        if (on && !G) el('div', 'mut', sh, { text: '已为 ' + t.g + ' 预设：' + (on === 1 ? '降一级' : '降两级') + '（孩子玩别的游戏就取消）。' });
        [[1, '降一级来教'], [2, '降两级来教'], [0, '关掉']].forEach(([d, txt]) => { const b = el('button', 'pbtn', row, { text: txt }); if (d === on) b.style.background = '#FFC93C'; b.addEventListener('click', () => { Teach.set(d); P.close(); MapView.update && MapView.update(); }); });
        el('div', 'mut', sh, { text: '打开后，孩子下次进这个小游戏时：题降一级或两级（最低 1 级），不给星、不开新游戏、不升复习箱，答错也不记成错，原来的星和难度都不变；离开这个小游戏、玩别的游戏或按“关掉”就恢复。星星槽左边有个“教”字。' + (W2.level && WORLDS[t.w].map >= 2 && W2.level(t.w, t.g) <= 1 ? '（这个小游戏已经是最低一级。）' : '') });
      } }
  },
  /* the parent panel: the explanation after a wrong answer */
  explainSetting(sh) {
    /* the explanation after a wrong answer: off / by itself / step by step (the parent talks the child through it) */
    { const row = el('div', '', sh); el('span', '', row, { text: '答错后的讲解：' });
      const bs = [];
      const paint = () => bs.forEach(([k, b]) => { b.style.background = Step.mode() === k ? '#FFC93C' : '#fff'; });
      [['off', '关'], ['auto', '自动'], ['step', '一步一步']].forEach(([k, t]) => { const b = el('button', 'pbtn', row, { text: t }); bs.push([k, b]); b.addEventListener('click', () => { Store.s.settings.explain = k; Store.save(); paint(); }); });
      paint();
      el('div', 'mut', sh, { text: '一步一步：每说完一句就停下，按绿色的大按钮“下一步”再往下讲（按钮会自己找一个不挡住题目的地方），方便您陪孩子一起看；按住下面的“按住跳过”1 秒直接出下一题。关：答错后不讲解，直接出下一题。' }); }
  },
  sections(sh) {
    if (typeof Laps !== 'undefined') Laps.parent(sh);
    const S = Store.s, cs = Object.keys(S.mem), cnt = s => cs.filter(c => Mem.state(c) === s).length;
    const [r7, n7] = Mem.keep(7, 13), [r30, n30] = Mem.keep(30, 59), pct = (r, n) => n ? Math.round(r * 100) + '%（' + Math.round(r * n) + '/' + n + '）' : '样本不足';
    if (Supply.low()) el('div', 'mut', sh, { html: '<b style="color:#E8414B">● 新内容快用完了</b>：请点"复制进度报告"，发给 Claude（Opus 5.5），让它做下一个世界。' });
    el('h3', '', sh, { text: '记得牢不牢（只给家长看）' });
    el('div', 'mut', sh, { text: '会了（隔 7 天还对）' + cnt('known') + ' 项 · 学习中 ' + cnt('learning') + ' · 见过 ' + cnt('seen') + ' · 待复测 ' + cnt('stale') + '。今天到期 ' + Mem.due().length + '，逾期 ' + Mem.overdue() + '。7 天保持率 ' + pct(r7, n7) + '；30 天 ' + pct(r30, n30) + '（目标 85% 以上）。' });
    const fs = cs.filter(isFact), fcnt = s2 => fs.filter(c => Mem.state(c) === s2).length, fsup = k => fs.filter(c => S.mem[c].sup === k).length;
    if (fs.length) el('div', 'mut', sh, { text: '加减事实（' + fs.length + ' 个）：会了 ' + fcnt('known') + '，学习中 ' + fcnt('learning') + '；支架：还要数点 ' + fsup(0) + '，看框 ' + fsup(1) + '，只看算式 ' + fsup(2) + '。只看算式、隔 7 天还对，才算“会了”。' });
    const t = el('table', '', sh); t.innerHTML = '<tr><th>技能</th><th>状态</th><th>箱</th><th>下次</th></tr>' + cs.filter(c => !isFact(c)).slice(0, 16).map(c => { const m = S.mem[c]; return '<tr><td>' + cardName(c) + '</td><td>' + ({ known: '会了', learning: '学习中', seen: '见过', stale: '待复测', none: '-' }[Mem.state(c)]) + '</td><td>' + m.b + (isFact(c) ? ' · 支架 ' + ['点', '框', '算式'][m.sup] : '') + '</td><td>' + (m.b ? (m.due - DAY() <= 0 ? '今天' : m.due - DAY() + ' 天后') : '-') + '</td></tr>'; }).join('');
    const sig = [], d = DAY(), days = [d, d - 1, d - 2].map(x => S.days[x]).filter(Boolean), quits = days.reduce((a, x) => a + Math.max(0, (x.keyGo || 0) - (x.keyEnd || 0)), 0);
    if (quits >= 2) { if (!S.key.short) { S.key.short = true; Store.save(); } sig.push('三天里钥匙题中途退出 ' + quits + ' 次：钥匙题已缩到 3 道。'); }
    if (S.v2low) sig.push('孩子在复习题处退出较多：每局只放 1 道复习，复习主要放进钥匙。');
    (S.notes || []).filter(n => n[1] !== 'low').slice(-3).forEach(n => sig.push('“' + cardName(n[1]) + '”换个样子问两次都没对，明天会再复习。'));
    const ch = S.checks.slice(-2); if (ch.length === 2 && n7 >= 20 && ch.every(c => c.n && c.yes / c.n < r7 - 0.2)) sig.push('连续两周考一考比 app 里低 20 个百分点以上：请告诉 Claude。');
    const fd = (S.flagDays || []).slice(-4); if (fd.length >= 2) sig.push('最近几面旗各用了 ' + fd.slice(1).map((x, i) => Math.max(0, x - fd[i]) + ' 天').join('、') + '。');
    el('h3', '', sh, { text: '早期信号' }); el('div', 'mut', sh, { html: sig.length ? sig.map(x => '• ' + x).join('<br>') : '暂时没有。' });
    el('h3', '', sh, { text: '每周“考一考”（约 5 分钟，用家里的实物，不看屏幕）' });
    const tasks = [['give10', '拿 7 个勺子给我。'], ['on10', '从 6 接着数，数 3 个是几？'], ['part10', '8 可以分成 3 和几？'], ['add10', '3 加 4 是几？'], [null, '在纸上写一个 5。']];
    const box = el('div', 'mut', sh); box.innerHTML = '按孩子的表现点“会 / 不会 / 未测”，再问一句“你怎么算的”，记下用了什么方法。点“不会”的那一项明天会复习；“会”不加分。';
    const res = { day: d, n: 0, yes: 0, how: [] };
    tasks.forEach(([c, txt]) => {
      const r = el('div', '', sh); Object.assign(r.style, { display: 'flex', gap: '8px', alignItems: 'center', margin: '6px 0', flexWrap: 'wrap' }); el('span', '', r, { text: txt }).style.minWidth = '210px';
      const sel = el('select', '', r); ['方法…', '直接想起', '数手指', '接着数', '凑十', '不会'].forEach(o => { const op = el('option', '', sel); op.textContent = o; });
      const b = (lbl, f) => { const bt = el('button', 'pbtn', r, { text: lbl }); bt.style.padding = '6px 12px'; bt.addEventListener('click', () => { f(); r.querySelectorAll('button').forEach(x => x.disabled = true); bt.style.background = '#FFE08A'; }); };
      b('会', () => { res.n++; res.yes++; res.how.push(sel.value); }); b('不会', () => { res.n++; res.how.push(sel.value); if (c) Mem.parentNo(c); }); b('未测', () => {});
    });
    const save = el('button', 'pbtn', sh, { text: '保存这次考一考' }); save.addEventListener('click', () => { if (res.n) { S.checks.push(res); Store.save(); save.textContent = '已保存（' + res.yes + '/' + res.n + '）'; } });
    const cur = Object.keys(S.mem).filter(c => !isFact(c) && Mem.state(c) === 'learning')[0] || 'give10';
    el('h3', '', sh, { text: '这周的生活数学' }); el('div', 'mut', sh, { text: LIFE[cur] || LIFE.give10 });
    el('h3', '', sh, { text: '每月小测（约 6 分钟，可以分两次）' });
    el('div', 'mut', sh, { text: '15 道题，素色、不给星，和以前的结果比曲线。上次：' + (S.tests.length ? S.tests.slice(-3).map(t => t.ok + '/' + t.n).join('、') : '还没测（第一次就是起点）') + (MonthTest.part().length ? '。这次已经做了 ' + MonthTest.part().length + ' 题，点下面接着做。' : '') });
    const mt = el('button', 'pbtn', sh, { text: MonthTest.part().length ? '接着做月测' : '开始月测' }); mt.addEventListener('click', () => MonthTest.start());
    el('h3', '', sh, { text: '进度报告 · 存档' });
    let pre = null; try { pre = localStorage.getItem('ddi.pre-v2'); } catch (e) {}
    if (pre) { const rb = el('button', 'pbtn', sh, { text: '恢复到升级前的存档' }); rb.addEventListener('click', () => { if (!confirm('回到升级 v2 之前的存档？现在的复习记录和英雄卡会丢掉。')) return; try { localStorage.setItem(KEY, pre); } catch (e) {} location.reload(); }); }
    const rep = el('button', 'pbtn', sh, { text: '复制进度报告' }), ta = el('textarea', '', sh); Object.assign(ta.style, { width: '100%', height: '120px', display: 'none', fontSize: '14px' });
    rep.addEventListener('click', () => { ta.style.display = ''; ta.value = Report.text(); ta.select(); try { navigator.clipboard.writeText(ta.value); rep.textContent = '已复制，可以直接粘贴给 Claude'; } catch (e) { rep.textContent = '请长按下面的文字全选复制'; } });
    const ex = el('button', 'pbtn', sh, { text: '导出存档' }), im = el('button', 'pbtn', sh, { text: '恢复存档' });
    ex.addEventListener('click', () => { ta.style.display = ''; ta.value = Report.export(); ta.select(); try { navigator.clipboard.writeText(ta.value); ex.textContent = '存档已复制'; } catch (e) {} });
    im.addEventListener('click', () => { if (ta.style.display === 'none' || !ta.value) { ta.style.display = ''; ta.value = ''; ta.placeholder = '把导出的存档粘贴到这里，再按一次“恢复存档”'; return; } try { Report.import(ta.value); im.textContent = '已恢复'; } catch (e) { im.textContent = '这段文字不是存档'; } });
    const mins = el('button', 'pbtn', sh, { text: '' }), opts = [12, 15, 20, 30, 10, 0], lab = () => { mins.textContent = '“停船还是继续”：' + (S.settings.mins ? '玩到 ' + S.settings.mins + ' 分钟时问一次' : '关'); };
    lab(); mins.addEventListener('click', () => { S.settings.mins = opts[(opts.indexOf(S.settings.mins) + 1) % opts.length]; Store.save(); lab(); });
    el('div', 'mut', sh, { text: '建议：先玩字字岛 12–18 分钟，再玩点点岛 10–15 分钟。“停船还是继续”只是提醒，没有上限。两个 app 能否共享存储：' + (S.probe ? (S.probe.zzi ? '能（同一个存储）' : '还没检测到字字岛的存档（字字岛装在同一个网址下、玩过以后才能判断）') : '还没检测') + '。' });
  },
};
/* ---------------------------------------------------------------- the step-by-step explanation's button and beats (the parent's
   一步一步, Step in index.html keeps only the marks): out of the first screen */
Object.assign(Step, {
  show(st) {
    this.hide();
    const box = el('div', '', document.body); box.id = 'stepbox';
    Object.assign(box.style, { position: 'fixed', left: '0px', top: '0px', zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: '0.45' });
    const b = el('button', '', box); b.id = 'stepnext';
    Object.assign(b.style, { width: '108px', height: '108px', borderRadius: '50%', border: 0, background: '#5CC46E', boxShadow: '0 0 0 4px #2B2118, 0 6px 0 4px rgba(43,33,24,.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', font: '800 20px/1.1 system-ui', flex: '0 0 auto' });
    b.innerHTML = '<svg viewBox="0 0 40 40" width="44" height="44"><path d="M12 7L33 20L12 33Z" fill="#fff" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/></svg><span>下一步</span>';
    tapify(b, () => this.next(st));
    /* the parent's 跳过: under the button, a 1 s press (a child's tap does nothing), >= 44 px */
    const sk = el('button', '', box, { text: '按住跳过' });
    Object.assign(sk.style, { minWidth: '88px', height: '44px', border: 0, background: 'rgba(255,255,255,.8)', borderRadius: '12px', padding: '0 10px', font: '600 15px/1 system-ui', color: '#6B5B4B', position: 'relative', overflow: 'hidden', touchAction: 'none' });
    let t = 0, bar = null;
    const stop = () => { clearTimeout(t); t = 0; if (bar) { bar.remove(); bar = null; } };
    sk.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); stop(); bar = el('i', '', sk); Object.assign(bar.style, { position: 'absolute', left: 0, bottom: 0, height: '4px', width: '0%', background: '#5CC46E' }); bar.animate([{ width: '0%' }, { width: '100%' }], { duration: 1000, fill: 'forwards' }); t = setTimeout(() => { stop(); this.skip(st); }, 1000); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => sk.addEventListener(ev, stop));
    this.place(st);
  },
  /* the button's place: the first candidate that covers nothing - the options / targets of the question, the rings of the
     explanation, the characters, the HUD and the task card - checked against their real rects now; else the least
     covered place on a grid, at 88 px; the ringed options are never covered if that can be helped (review PT1 P1) */
  place(st) {
    const box = document.getElementById('stepbox'), btn = document.getElementById('stepnext'); if (!box || !btn) return;
    const W = innerWidth, H = innerHeight;
    const R = e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    const vis = e => { if (!e || !e.isConnected) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
    const obs = [];
    const add = (e, w, core) => { if (!vis(e)) return; let r = R(e); if (core) r = { x: r.x + r.w * 0.14, y: r.y + r.h * 0.08, w: r.w * 0.72, h: r.h * 0.9 }; obs.push({ r, w }); };
    Object.values(st.map || {}).forEach(e => add(e, 3));
    (st.cards || []).forEach(e => add(e, 3));
    $$('.ringo', Stage.el).forEach(e => add(e, 6));
    (st.els || []).forEach(e => { if (e.classList && (e.classList.contains('task') || e.classList.contains('card'))) add(e, e.classList.contains('task') ? 2 : 3); });
    Object.values((st.G && st.G.actors) || {}).forEach(a => { if (!a.math) add(a.root, 1, true); });
    ['#home', '#avatar', '#tray', '#gear'].forEach(q => add(document.querySelector(q), 40));        /* never over the HUD */
    const inter = (a, c) => Math.max(0, Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x)) * Math.max(0, Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y));
    const score = (x, y, S) => { const b = { x, y, w: S, h: S + 52 }; let sc = 0; obs.forEach(o => { const i = inter(b, o.r); if (i > 0) sc += o.w * i / Math.max(1, o.r.w * o.r.h); }); return sc; };
    const hudB = Math.max(110, ...['#home', '#avatar', '#tray'].map(q => document.querySelector(q)).filter(vis).map(e => e.getBoundingClientRect().bottom + 8));
    const m = 16, cands = S => [[W - S - m, H / 2 - S / 2 - 26], [W - S - m, H - S - 52 - m], [m, H / 2 - S / 2 - 26], [m, H - S - 52 - m], [W / 2 - S / 2, H - S - 52 - m], [W / 2 - S / 2, hudB], [W - S - m, hudB], [m, hudB], [W - S - m, H * 0.3], [m, H * 0.3], [W - S - m, H * 0.7 - S], [m, H * 0.7 - S]];
    let best = null;
    for (const S of [108, 88]) {
      for (const [x, y] of cands(S)) { const sc = score(x, y, S); if (sc === 0) { best = { x, y, S, sc }; break; } if (!best || sc < best.sc) best = { x, y, S, sc }; }
      if (best && best.sc === 0) break;
      for (let y = hudB; y <= H - S - 52 - m && (!best || best.sc > 0); y += 24) for (let x = m; x <= W - S - m; x += 24) { const sc = score(x, y, S); if (sc < best.sc) best = { x, y, S, sc }; if (sc === 0) break; }
      if (best.sc === 0) break;
    }
    btn.style.width = btn.style.height = best.S + 'px';
    box.style.left = Math.round(best.x) + 'px'; box.style.top = Math.round(best.y) + 'px';
  },
  hide() { const b = document.getElementById('stepbox'); if (b) b.remove(); },
  /* a beat is over: wait for 下一步 (the button lights up) */
  wait(st) {
    if (!this.on(st)) return Promise.resolve();
    const b = document.getElementById('stepbox');
    if (b) { this.place(st); b.style.opacity = '1'; const n = document.getElementById('stepnext'); if (n && n.animate) n.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 600, iterations: 2 }); }
    if (st.stepP) return st.stepP;               /* a beat already waiting (a line not awaited, then the end): the same tap */
    st.stepP = st.scope.guard(new Promise(res => { st.stepRes = () => { st.stepP = null; res(); }; }));
    return st.stepP;
  },
  /* a beat ends: what was said is finished, then 下一步. The first step always has words: if the game drew his blue ring
     without a line, the line that told him what is wrong is said again (or "不是四个" / "不是这个哦"), and the first step
     ends with "我们一起看！"; a demonstration step without words says "再看一看！" - so the parent has a sentence at every
     step (reviews PT1 P6, PT2 Q4) */
  boundary(st) {
    st.stepDirty = false; st.stepN = (st.stepN || 0) + 1;
    const first = st.stepN === 1 && !st.stepLines, silent = st.stepN > 1 && !st.stepLines && !st.closing, quiet = () => st.scope.guard(Voice.afterSay(0)).then(() => { st.stepDirty = false; });
    st.stepLines = 0;
    return quiet()
      .then(() => { if (first && this.on(st)) Voice.say(this.whatWrong(st), { tag: 'explain' }); else if (silent && this.on(st)) Voice.say('再看一看！', { tag: 'explain' }); return quiet(); })
      .then(() => { if (first && !st.cued && !st.stepEnd && this.on(st)) { st.cued = true; Voice.say('我们一起看！', { tag: 'explain' }); return quiet(); } })   /* the end of the first step (PT2 Q4) */
      .then(() => this.wait(st))
      .then(() => { st.stepLines = 0; });
  },
  whatWrong(st) { const a = st.answer; return st.fbLine || (typeof a === 'number' && a >= 0 && a <= 20 ? W2Say.notN(a) : '不是这个哦'); },
  next(st) { const r = st.stepRes; st.stepRes = null; const b = document.getElementById('stepbox'); if (b) b.style.opacity = '0.45'; Sfx.touch(); if (r) r(); },
  skip(st) { st.stepMode = false; this.hide(); const r = st.stepRes; st.stepRes = null; if (r) r(); Session.fastForward(); },
});
/* ---------------------------------------------------------------- New Game Plus (client 2026-10-17): an island whose flag is
   planted plays laps. Lap 2: every game a fresh row of 5 silver stars (the normal star rule); all 4 games full -> a crown
   by the flag (and a hero card). Lap 3: gold stars -> a rocket that takes off and lands by the island (and a card). Lap 4
   and later: rainbow stars -> the rocket counts x2, x3 ... Nothing locks; difficulty and review stay as they are.
   Store.s.laps[w] = { n: the lap being played (2 ...), got: rewards so far (1 crown, 2 rocket, 3+ rocket xN), g: stars of
   this lap per game (0-5), due: a lap completed, its reward still to show }. A save without laps: every flagged island is
   on lap 2 with no stars (nothing to migrate); its stars are never touched. */
const LAPCOL = n => (n === 2 ? '#C9D3E0' : n === 3 ? '#FFC93C' : '#FF7BC8');
const LAPSVG = {
  crown: '<svg viewBox="0 0 60 48" width="100%" height="100%"><path d="M6 40L4 12L18 24L30 6L42 24L56 12L54 40Z" fill="#FFC93C" stroke="#2B2118" stroke-width="3.5" stroke-linejoin="round"/><rect x="6" y="38" width="48" height="8" rx="3" fill="#F2A93B" stroke="#2B2118" stroke-width="3.5"/><circle cx="30" cy="27" r="4.5" fill="#FF6B5B" stroke="#2B2118" stroke-width="2.5"/><circle cx="16" cy="31" r="3.5" fill="#4FB3FF" stroke="#2B2118" stroke-width="2"/><circle cx="44" cy="31" r="3.5" fill="#5CC46E" stroke="#2B2118" stroke-width="2"/></svg>',
  rocket: '<svg viewBox="0 0 48 72" width="100%" height="100%"><path d="M24 4C36 14 38 32 34 50H14C10 32 12 14 24 4Z" fill="#F4F7FB" stroke="#2B2118" stroke-width="3.5" stroke-linejoin="round"/><circle cx="24" cy="26" r="6" fill="#4FB3FF" stroke="#2B2118" stroke-width="3"/><path d="M14 38L4 54L14 50ZM34 38L44 54L34 50Z" fill="#FF6B5B" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/><path d="M18 52L24 68L30 52Z" fill="#FFC93C" stroke="#2B2118" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  spark: '<svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15 1L18 12L29 15L18 18L15 29L12 18L1 15L12 12Z" fill="#FFF3A8" stroke="#2B2118" stroke-width="2" stroke-linejoin="round"/></svg>',
};
const Laps = {
  st(w) { const L = Store.s.laps || (Store.s.laps = {}); return L[w] || (L[w] = { n: 2, got: 0, due: 0, iv: 0, g: {} }); },
  /* a lap is played on an island whose flag is planted and whose games are all done (NG1 4: an old-rule flag keeps its
     own stars and checks until every game has its 5) */
  on(w) { return !!(WORLDS[w] && (WORLDS[w].games || []).length && (Store.s.flags || []).includes(w) && W2.islandDone(w)); },
  total(w) { const s = this.st(w); return s.due ? 99 : WORLDS[w].games.reduce((t, g) => t + (s.g[g] || 0), 0); },
  name(g) { return GAMES[g] && GAMES[g].verb ? GAMES[g].verb.replace(/[！!。，,\s]/g, '') : g; },
  /* a star of this session also counts for the island's lap; the game's 5th lap star is a "集满啦！" (NG1 1) */
  star(G) {
    const w = G.world; if (!G.lapOn || !this.on(w)) return;           /* a lap session is decided when it starts (NG2 A) */
    const s = this.st(w); if (s.due) { G.lapK = 5; return; }        /* this lap is complete: its reward comes on the map */
    const was = s.g[G.id] || 0; s.g[G.id] = Math.min(5, was + 1); G.lapK = s.g[G.id];
    if (was === 4) { G.lapFull = 1; this.lit = { w, g: G.id }; }
    if (WORLDS[w].games.every(g => (s.g[g] || 0) >= 5)) s.due = 1;
    Store.save();
  },
  /* the game's tray: this lap's real stars (0-5), in the lap's colour */
  tray(G, tray) {
    const w = G.world; if (!this.on(w) || G.key || G.test || G.teach) return;
    const s = this.st(w), n = s.due ? 5 : (s.g[G.id] || 0);
    G.trayBase = n; G.lapK = 0; tray.dataset.lap = Math.min(4, s.n);
    $$('i', tray).forEach((e, i) => e.classList.toggle('on', i < n));
    this.css();
    if (n < 5) { G.lapOn = 1; return; }
    /* this game is full for the lap (NG2 D): said, the tray glows, its stars count nothing for the lap; back on the map the
       island's panel opens with the games still to fill glowing */
    G.lapK = 5;
    if (s.due) return;
    this.steer = w;
    Voice.say('这个已经满啦！', { tag: 'map' });
    tray.animate([{ boxShadow: '0 0 0 0 rgba(255,201,60,0)' }, { boxShadow: '0 0 0 8px rgba(255,201,60,.9), 0 0 30px 12px rgba(255,214,90,.8)' }, { boxShadow: '0 0 0 0 rgba(255,201,60,0)' }], { duration: T(1400) + 1, iterations: 2, easing: 'ease-in-out' });
  },
  /* the end of a session: 2+ wrong answers on an island without a lap -> the hand points to a lap once (NG1 1) */
  end(G) {
    if (G.key || G.test || G.teach) return;
    const wrong = (G.ev || []).filter(b => !b).length;
    if (!this.on(G.world) && wrong >= 2) { Store.s.lapHelp = 1; Store.save(); }      /* kept until the hand has shown an island */
  },
  /* the hand's island after a hard session: in this sea, the lap with the fewest stars (the latest flag first) */
  /* no lap in this sea but one in another: the hand shows the gate (the way back) once, the help waits for that sea (NG2 B) */
  pick(M) {
    const h = Store.s.lapHelp; if (!h) return null;
    const fl = Store.s.flags || [], ids = M.ids().filter(o => this.on(o) && M.isl[o]);
    if (!ids.length) {
      if (h !== 1 || !M.isl.gate || !Object.keys(WORLDS).some(o => this.on(o))) return null;
      Store.s.lapHelp = 2; Store.save(); Voice.say('回前面练一练！', { tag: 'map' });
      return 'gate';
    }
    if (h === 1) Voice.say('回前面练一练！', { tag: 'map' });
    Store.s.lapHelp = 0; Store.save();
    ids.sort((a, b) => this.total(a) - this.total(b) || fl.indexOf(b) - fl.indexOf(a));
    return ids[0];
  },
  /* the island inviting another lap: in this sea the latest flag whose lap is not touched yet - one sparkle, not six */
  target(M) {
    const fl = Store.s.flags || [];
    const ids = M.ids().filter(o => this.on(o) && !this.st(o).due && !Object.values(this.st(o).g).some(v => v > 0));
    ids.sort((a, b) => fl.indexOf(b) - fl.indexOf(a));
    return ids[0] || null;
  },
  css() { if ($('#lapcss')) return; const c = el('style', '', document.head); c.id = 'lapcss'; c.textContent = '#tray[data-lap="2"] i.on{filter:grayscale(1) brightness(1.35)}#tray[data-lap="3"] i.on{filter:saturate(1.6) brightness(1.1)}#tray[data-lap="4"] i.on{animation:laprb 2.4s linear infinite}@keyframes laprb{to{filter:hue-rotate(360deg)}}.lapb{position:absolute;right:12px;top:-4px;display:flex;flex-direction:row-reverse;align-items:flex-end;gap:2px;pointer-events:none}.lapb .rk{position:relative}.lapb .rk b{position:absolute;right:-12px;top:-6px;font:900 16px/1 system-ui,sans-serif;color:#fff;background:#FF6B5B;border-radius:10px;padding:2px 5px;box-shadow:0 0 0 2px #2B2118}#map:has(.gstars) .bigstars{opacity:.2}.gstars.laprow{background:rgba(255,255,255,.92);border-radius:14px;box-shadow:0 0 0 2px rgba(43,33,24,.3);padding:2px 6px}'; },
  /* the map: crown / rocket (xN) by every flag, a sparkle on the island inviting a lap */
  draw(M) {
    this.css();
    const tg = this.target(M);
    Object.keys(M.isl || {}).forEach(id => {
      const I = M.isl[id]; if (!I || !I.flag || !WORLDS[id] || !this.on(id)) { const old = I && I.flag && I.flag.querySelector('.lapb'); if (old) old.remove(); return; }
      let b = I.flag.querySelector('.lapb'); if (!b) b = el('div', 'lapb', I.flag);
      const s = this.st(id), key = s.got + ':' + s.n + ':' + (id === tg ? 1 : 0); if (b.dataset.k === key) return; b.dataset.k = key; b.innerHTML = '';
      if (s.got >= 1) { const c = el('span', 'cr', b); c.innerHTML = LAPSVG.crown; Object.assign(c.style, { width: '34px', height: '28px', display: 'block' }); }
      if (s.got >= 2) { const r = el('span', 'rk', b); r.innerHTML = LAPSVG.rocket; Object.assign(r.style, { width: '24px', height: '36px', display: 'block' }); if (s.got >= 3) el('b', '', r, { text: '×' + (s.got - 1) }); }
      if (id !== tg) return;
      const sp = el('span', 'sp', b); sp.innerHTML = LAPSVG.spark; Object.assign(sp.style, { width: '22px', height: '22px', display: 'block', alignSelf: 'flex-start' });
      Loops.run(sp, [{ transform: 'scale(.6) rotate(0)', opacity: 0.5 }, { transform: 'scale(1.2) rotate(45deg)', opacity: 1 }, { transform: 'scale(.6) rotate(90deg)', opacity: 0.5 }], { duration: 1600 });
    });
    this.chest(M);
  },
  /* the chest (top right) never covers a flag, a crown or a host: then it goes top left (NG1 2) */
  chest(M) {
    const c = $('#gemchest'); if (!c || Screens.cur !== 'map') return;
    const sz = innerWidth < 1100 ? '92px' : '104px'; c.style.width = c.style.height = sz;
    const R = () => { c.style.left = ''; c.style.right = 'calc(14px + var(--sr))'; }, L = () => { c.style.right = 'auto'; c.style.left = 'calc(14px + var(--sl))'; };
    const hit = () => { const r = c.getBoundingClientRect(); return Object.values(M.isl || {}).some(I => I && [I.flag, I.flag && I.flag.querySelector('.lapb'), I.hero].some(e => { if (!e || !e.isConnected) return false; const q = e.getBoundingClientRect(); return q.width > 0 && getComputedStyle(e).display !== 'none' && q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top; })); };
    R(); if (hit()) { L(); if (hit()) R(); }
  },
  /* the island panel: this lap's stars per game (silver / gold / rainbow) on a light strip; the game just filled glows */
  row(w, g, row) {
    if (!this.on(w)) return;
    const s = this.st(w), n = s.due ? 5 : (s.g[g] || 0);
    row.dataset.n = n; row.dataset.lap = s.n; row.classList.add('laprow'); this.css();
    $$('img', row).forEach((e, k) => { e.style.filter = k < n ? (s.n === 2 ? 'grayscale(1) brightness(1.35) drop-shadow(0 2px 0 rgba(43,33,24,.35))' : s.n === 3 ? 'saturate(1.6) brightness(1.1) drop-shadow(0 2px 0 rgba(43,33,24,.35))' : 'hue-rotate(' + (k * 60) + 'deg) drop-shadow(0 2px 0 rgba(43,33,24,.35))') : 'grayscale(1) opacity(.35)'; });
    if (this.steer === w && n < 5) row.animate([{ boxShadow: '0 0 0 2px rgba(43,33,24,.3)' }, { boxShadow: '0 0 0 6px rgba(255,201,60,.95), 0 0 28px 10px rgba(255,214,90,.85)' }, { boxShadow: '0 0 0 2px rgba(43,33,24,.3)' }], { duration: T(1100) + 1, iterations: 4, delay: T(400) });      /* still to fill (NG2 D) */
    if (this.lit && this.lit.w === w && this.lit.g === g) {
      this.lit = null;
      row.animate([{ boxShadow: '0 0 0 2px rgba(43,33,24,.3)' }, { boxShadow: '0 0 0 6px rgba(255,201,60,.95), 0 0 28px 10px rgba(255,214,90,.85)' }, { boxShadow: '0 0 0 2px rgba(43,33,24,.3)' }], { duration: T(1100) + 1, iterations: 3, delay: T(400) });
    }
  },
  /* the island panel's flag box: the next lap's reward, a little dim */
  panel(w, fs, FS) {
    if (!this.on(w)) return;
    const s = this.st(w), nx = s.got >= 1 ? 'rocket' : 'crown', d = el('div', 'lapnext', fs);
    d.innerHTML = LAPSVG[nx];
    Object.assign(d.style, { position: 'absolute', right: '-14px', top: '-18px', width: (nx === 'crown' ? 40 : 28) + 'px', height: (nx === 'crown' ? 32 : 42) + 'px', opacity: 0.9, filter: 'grayscale(.4)', pointerEvents: 'none' });
    Loops.run(d, [{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 1200 });
    const t = el('div', '', fs, { text: '第' + (CN[s.n] || s.n) + '圈' });
    Object.assign(t.style, { position: 'absolute', left: '50%', bottom: '-30px', transform: 'translateX(-50%)', whiteSpace: 'nowrap', font: '800 16px/1 system-ui,sans-serif', color: '#fff', background: LAPCOL(s.n), borderRadius: '10px', padding: '4px 8px', boxShadow: '0 0 0 2px #2B2118', textShadow: '0 1px 0 #2B2118', pointerEvents: 'none' });
  },
  /* a hero card for a lap: lap 2 always; lap 3 only while plenty are left (10 after one for every island still without
     a flag) - otherwise the rocket alone (NG1 6) */
  card(got) {
    if (got === 1) return true;
    if (got !== 2) return false;
    const left = CARDS.length - ((Store.s.gems && Store.s.gems.n) || 0), fl = Store.s.flags || [];
    const unfl = Object.keys(WORLDS).filter(o => (WORLDS[o].games || []).length && !fl.includes(o)).length;
    return left - unfl >= 10;
  },
  /* the map after a session: a completed lap - its reward appears by the flag, a celebration, maybe a hero card */
  async celebrate(M, live) {
    for (const w of M.ids().filter(o => this.on(o) && this.st(o).cd && !this.st(o).due)) {      /* a card a reload interrupted */
      if (!live()) return true;
      this.st(w).cd = 0; Store.save(); await Gems.card('lap');
    }
    for (const w of M.ids().filter(o => this.on(o) && this.st(o).due)) {
      if (!live()) return true;
      const s = this.st(w); s.due = 0; s.got++; s.n++; s.g = {}; s.cd = this.card(s.got) ? 1 : 0; Store.save();      /* the card is owed from now on */
      M.update(); this.draw(M);
      const I = M.isl[w], b = I && I.flag && I.flag.querySelector('.lapb'), it = b && (s.got >= 2 ? b.querySelector('.rk') : b.querySelector('.cr'));
      if (it) {
        /* the flight is drawn over the whole map (an island's own layer would pass behind its neighbours) */
        const r = it.getBoundingClientRect(), dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight / 2 - (r.top + r.height / 2);
        const fly = el('div', '', $('#fx')); fly.innerHTML = it.innerHTML;
        Object.assign(fly.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', zIndex: 70, pointerEvents: 'none' });
        it.style.visibility = 'hidden';
        const kf = s.got === 1 ? [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(4) rotate(-8deg)', offset: 0.3 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(4) rotate(8deg)', offset: 0.5 }, { transform: 'translate(0,-30px) scale(1.5)', offset: 0.85 }, { transform: 'translate(0,0) scale(1)' }]      /* the crown flies onto the host's head */
          : s.got === 2 ? [{ transform: 'translateY(0)' }, { transform: 'translateY(8px) scale(1.1)', offset: 0.15 }, { transform: 'translateY(-200px) scale(1.4)', offset: 0.55 }, { transform: 'translateY(-200px) scale(1.4)', offset: 0.65 }, { transform: 'translateY(0)' }]
          : [{ transform: 'scale(0) rotate(-30deg)' }, { transform: 'scale(1.6) rotate(8deg)', offset: 0.6 }, { transform: 'scale(1)' }];
        const an = fly.animate(kf, { duration: T(s.got <= 2 ? 2200 : 800) + 1, easing: s.got <= 2 ? 'ease-in-out' : EASE.pop });
        const done = () => { if (!fly.isConnected) return; fly.remove(); it.style.visibility = ''; const q = it.getBoundingClientRect(); Fx.burst(q.left + q.width / 2, q.top + q.height / 2, { screen: true, n: 22 }); };
        an.onfinish = done; setTimeout(done, T(s.got <= 2 ? 2400 : 1000) + 50);
      }
      Sfx.fanfare(); Fx.confetti(40);
      if (s.got <= 2) { setTimeout(() => { Sfx.fanfare(); Fx.confetti(40); }, T(1100)); }      /* a longer fanfare for the crown and the rocket */
      Voice.say(s.got === 1 ? '得到皇冠啦！' : s.got === 2 ? '火箭起飞啦！' : '火箭又飞啦！', { tag: 'unlock' });
      await new Promise(r => setTimeout(r, T(s.got <= 2 ? 2600 : 1600)));
      if (s.cd && live()) { s.cd = 0; Store.save(); await Gems.card('lap'); }
    }
    if (this.steer && M.isl[this.steer] && live()) { const w = this.steer; M.openPanel(w); this.steer = null; return false; }      /* back from a full game: the games to fill glow */
    return this.invite(M, live);
  },
  /* the first time an island is on lap 2: "再玩一次吧！" and its sparkle grows (once per island) */
  async invite(M, live) {
    const w = this.target(M); if (!w || !live()) return !live();
    const s = this.st(w); if (s.iv || s.n !== 2) return false;
    s.iv = 1; Store.save();
    const I = M.isl[w], sp = I && I.flag && I.flag.querySelector('.lapb .sp');
    Voice.say('再玩一次吧！', { tag: 'map' });
    if (sp) {
      sp.animate([{ transform: 'scale(1)' }, { transform: 'scale(2.6) rotate(45deg)' }, { transform: 'scale(1)' }], { duration: T(900) + 1, iterations: 3, easing: 'ease-in-out', composite: 'add' });
      const q = sp.getBoundingClientRect(); Fx.burst(q.left + q.width / 2, q.top + q.height / 2, { screen: true, n: 14 });
    }
    await new Promise(r => setTimeout(r, T(1600)));
    return !live();
  },
  /* the parent panel: per island, the lap, this lap's stars per game (by name) and what it has earned */
  parent(sh) {
    const ids = Object.keys(WORLDS).filter(w => this.on(w)); if (!ids.length) return;
    el('h3', '', sh, { text: '再玩一圈（插旗以后：第二圈皇冠，第三圈火箭，以后火箭 ×2、×3……）' });
    const t = el('table', '', sh); t.innerHTML = '<tr><th>岛</th><th>正在玩</th><th>这一圈的星</th><th>已得</th></tr>';
    ids.forEach(w => { const s = this.st(w), tr = el('tr', '', t); el('td', '', tr, { text: WORLDS[w].name }); el('td', '', tr, { text: '第' + s.n + '圈' }); el('td', '', tr, { text: WORLDS[w].games.map(g => this.name(g) + ' ' + (s.due ? 5 : (s.g[g] || 0)) + '/5').join('、') }); el('td', '', tr, { text: s.got === 0 ? '旗子' : s.got === 1 ? '旗子、皇冠' : '旗子、皇冠、火箭' + (s.got >= 3 ? ' ×' + (s.got - 1) : '') }); });
  },
};
/* the map came before this file (it loads a second after the entry tap): its chest, the day's greeting, a card the move
   opened - now that MapV2 and the cards are in (PT1 P8, PT2 Q1) */
if (typeof Screens !== 'undefined' && Screens.cur === 'map' && !Session.G) { MapView.update(); MapV2.hello(); setTimeout(() => Gems.pending(), 600); }
/* a lap completed before the app was closed: its reward is shown now, not a session later (NG1 5) */
if (typeof Screens !== 'undefined' && Screens.cur === 'map' && !Session.G && (MapView.ids().some(o => Laps.on(o) && Laps.st(o).due) || ((t) => t && !Laps.st(t).iv && Laps.st(t).n === 2)(Laps.target(MapView)))) MapView.after(T(300));
if (typeof W5 !== 'undefined' && W5.cardsIn) W5.cardsIn();          /* 积木城's review cards whose question types came with this file (pos / shape / op10) */

W3.loaded = true;          /* the sky's games and v2's are both in */
