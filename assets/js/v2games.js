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
  },
  cmp: {
    gen(G, c, o) { const hi = (SKILLS[c] || {}).hi || 10; let a, b; do { a = G.rng.int(1, hi); b = G.rng.int(1, hi); } while (a === b || Math.abs(a - b) > (hi > 10 ? 9 : 6)); const ask = G.rng.chance(0.5) ? 'big' : 'small', ans = ask === 'big' ? Math.max(a, b) : Math.min(a, b); return { k: ['cmp', a, b, ask], a, b, ask, answer: ans, opts: [a, b], say: ask === 'big' ? '哪个大？' : '哪个小？' }; },
    present(st) { const q = st.q, L = K.L(); W2X.cards(st, q.opts.map(n => n <= 10 ? V2G.numCard(n, st.sup, 80) : (() => { const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }); d.appendChild(UI.num(n, 80)); if (!st.sup) { d.appendChild(V2G.frame(10, 0.8)); d.appendChild(V2G.frame(n - 10, 0.8)); } return d; })()), q.opts, { size: 230, gap: 60, cx: L ? 512 : 352, cy: L ? 360 : 520 }); },
  },
  next: {
    gen(G, c, o) { const hi = (SKILLS[c] || {}).hi || 10, dir = G.rng.chance(0.5) ? 'after' : 'before', n = dir === 'after' ? G.rng.int(1, hi - 1) : G.rng.int(2, hi), ans = dir === 'after' ? n + 1 : n - 1; return { k: ['next', n, dir], n, dir, answer: ans, opts: numOptions(G, ans, 0, hi), say: CN[n] + (dir === 'after' ? '后面是几？' : '前面是几？') }; },
    present(st) {
      const q = st.q, L = K.L(), row = W2X.thing(st, 10, 10, 5, ''); row.style.width = row.style.height = 'auto';
      Object.assign(row.style, { display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 20px', background: 'rgba(255,255,255,.92)', borderRadius: '24px', boxShadow: '0 0 0 4px #2B2118' });
      const cells = q.dir === 'after' ? [q.n - 1, q.n, '?'] : ['?', q.n, q.n + 1];
      cells.forEach(t => { const c = el('div', '', row); Object.assign(c.style, { width: '108px', height: '108px', borderRadius: '18px', background: t === q.n ? '#FFE08A' : '#FFF8EC', boxShadow: '0 0 0 3px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center' }); if (t === '?') c.appendChild(V2G.op('?', 60)); else if (t >= 0) c.appendChild(UI.num(t, 70)); });
      place(row, L ? 330 : 140, L ? 170 : 300); K.pop(st, row);
      RQ.numCards(st, q.opts, 0);
    },
  },
  on: {
    gen(G, c, o) { const hi = (SKILLS[c] || {}).hi || 10, a = G.rng.int(hi > 10 ? 8 : 3, hi > 10 ? 15 : 7), b = G.rng.int(1, Math.min(4, hi - a)), ans = a + b; return { k: ['on', a, b], a, b, answer: ans, opts: numOptions(G, ans, 1, hi), say: '一共有几个？' }; },
    present(st) {
      const q = st.q, L = K.L(), boxE = W2X.thing(st, 220, 200, 5, ''); boxE.innerHTML = '<svg viewBox="0 0 220 200" width="100%" height="100%"><rect x="14" y="40" width="192" height="146" rx="14" fill="#C98B4A" stroke="#2B2118" stroke-width="7"/><path d="M8 40H212" stroke="#2B2118" stroke-width="12" stroke-linecap="round"/></svg>';
      const lab = el('div', '', boxE); Object.assign(lab.style, { position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%,-50%)' }); lab.appendChild(UI.num(q.a, 76));
      const loose = W2X.thing(st, 10, 10, 5, ''); loose.style.width = loose.style.height = 'auto'; loose.appendChild(V2G.dots(q.b, { g: 40, r: 15, per: 4 }));
      place(boxE, L ? 260 : 120, L ? 150 : 270, 220, 200); place(loose, L ? 560 : 400, L ? 220 : 330);
      K.pop(st, boxE); K.pop(st, loose, 100);
      RQ.numCards(st, q.opts, 1);
    },
  },
  part: {
    gen(G, c, o) { const hi = (SKILLS[c] || {}).hi || 10, w = G.rng.int(3, hi), a = G.rng.int(1, w - 1), ans = w - a; return { k: ['part', w, a], w, a, answer: ans, opts: numOptions(G, ans, 0, hi), say: CN[w] + '分成' + CN[a] + '和几？' }; },
    present(st) { const q = st.q, L = K.L(), d = W2X.thing(st, 10, 10, 5, ''); d.style.width = d.style.height = 'auto'; d.appendChild(V2G.partWhole(q.w, q.a, null, st.sup)); place(d, L ? 380 : 210, L ? 110 : 200); K.pop(st, d); RQ.numCards(st, q.opts, 1); },
  },
  ten: {
    gen(G, c, o) { const n = G.rng.int(11, 19); return { k: ['ten', n], n, answer: n, opts: numOptions(G, n, 10, 20), say: '这是几？' }; },
    present(st) { const q = st.q, L = K.L(), d = W2X.thing(st, 10, 10, 5, ''); d.style.width = d.style.height = 'auto'; Object.assign(d.style, { display: 'flex', gap: '18px', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,.9)', borderRadius: '22px', boxShadow: '0 0 0 4px #2B2118' }); d.appendChild(V2G.frame(10, 1.4)); d.appendChild(V2G.frame(q.n - 10, 1.4)); place(d, L ? 250 : 80, L ? 170 : 300); K.pop(st, d); RQ.numCards(st, q.opts, 1); },
  },
  /* a picture story -> its number sentence (skill cards add10 / sub10) */
  eq: {
    gen(G, c, o) {
      const op = (SKILLS[c] || {}).op || '+';
      let a, b; if (op === '+') { a = G.rng.int(1, 6); b = G.rng.int(1, Math.min(4, 10 - a)); } else { a = G.rng.int(3, 9); b = G.rng.int(1, a - 1); }
      /* the wrong ones are always false sentences (R2-S1): the other operation with the same result (b >= 1), the result off by one */
      const r = op === '+' ? a + b : a - b, ok = [a, op, b, '=', r], f1 = [a, op === '+' ? '-' : '+', b, '=', r], f2 = [a, op, b, '=', r + (r > 1 && G.rng.chance(0.5) ? -1 : 1)];
      const opts = G.rng.shuffle([ok, f1, f2]);
      return { k: ['eq', a, op, b], a, b, op, answer: opts.indexOf(ok), opts: [0, 1, 2], eqs: opts, say: '哪个算式对？', fact: factOf(op, a, b) };
    },
    present(st) {
      const q = st.q, L = K.L(), pic = W2X.thing(st, 10, 10, 5, ''); pic.style.width = pic.style.height = 'auto';
      Object.assign(pic.style, { display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,.92)', borderRadius: '22px', boxShadow: '0 0 0 4px #2B2118' });
      if (q.op === '+') { pic.appendChild(V2G.dots(q.a, { g: 30, r: 11, fill: '#4FB3FF' })); pic.appendChild(V2G.op('+', 40)); pic.appendChild(V2G.dots(q.b, { g: 30, r: 11, fill: '#FFC93C' })); }
      else pic.appendChild(V2G.dots(q.a, { g: 30, r: 11, crossFrom: q.a - q.b }));
      place(pic, L ? 120 : 140, L ? 260 : 230); K.pop(st, pic);
      st.cards = q.eqs.map((s, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(V2G.eq(s, 1, 50)); K.pop(st, c, 80 * i); return c; });
      st.opts = [0, 1, 2]; RQ.eq.place(st);
    },
    place(st) { const L = K.L(); (st.cards || []).forEach((c, i) => L ? place(c, 540, 150 + i * 150, 420, 128) : place(c, 92, 470 + i * 150, 520, 128)); },
  },
  /* a number fact: "三加四等于几？" with the support of its level: 0 dots, 1 a part-whole shell, 2 the sum only (A.7) */
  fact: {
    gen(G, c, o) { const f = factParts(c), r = f.op === '+' ? f.a + f.b : f.a - f.b; return { k: ['fact', c, o.sup], f, answer: r, opts: numOptions(G, r, 0, 10), sup: o.sup, say: CN[f.a] + (f.op === '+' ? '加' : '减') + CN[f.b] + '等于几？' }; },
    present(st) {
      const q = st.q, f = q.f, L = K.L(), d = W2X.thing(st, 10, 10, 5, ''); d.style.width = d.style.height = 'auto';
      Object.assign(d.style, { display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', padding: '16px 22px', background: 'rgba(255,255,255,.92)', borderRadius: '24px', boxShadow: '0 0 0 4px #2B2118' });
      if (q.sup === 0) { const row = el('div', '', d); Object.assign(row.style, { display: 'flex', gap: '14px', alignItems: 'center' }); if (f.op === '+') { row.appendChild(V2G.dots(f.a, { g: 28, r: 10 })); row.appendChild(V2G.op('+', 36)); row.appendChild(V2G.dots(f.b, { g: 28, r: 10, fill: '#FFC93C' })); } else row.appendChild(V2G.dots(f.a, { g: 28, r: 10, crossFrom: f.a - f.b })); }
      if (q.sup === 1) d.appendChild(f.op === '+' ? V2G.partWhole(null, f.a, f.b, 1) : V2G.partWhole(f.a, f.b, null, 1));
      d.appendChild(V2G.eq([f.a, f.op, f.b, '=', '?'], 1, 64));
      place(d, L ? 300 : 120, L ? 104 : 200); K.pop(st, d);
      RQ.numCards(st, q.opts, 1);
    },
  },
  numCards(st, vals, sup) { const L = K.L(); W2X.cards(st, vals.map(n => V2G.numCard(n, sup, 70)), vals, { size: 150, gap: 36, cx: L ? 560 : 352, cy: L ? 600 : 880 }); },
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
  async feedback(st, ans) { const t = RQ[st.q.t]; if (t.feedback) { t.feedback(st, ans); } else { const i = (st.opts || []).indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); if (typeof ans === 'number' && st.q.t !== 'eq') W3X.say('不是' + (CN[ans] || ans)); else W3X.say('再看一看'); } await st.scope.wait(T(800)); },
  next(st, strat) { const t = RQ[st.q.t]; if (t.next) return t.next(st, strat); if (st.picked) return null; const vals = st.opts, i = strat === 'wrong' ? vals.findIndex(v => v !== st.q.answer) : vals.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
  relayoutQ(st) { const t = RQ[st.q.t]; if (t.place) t.place(st); },
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
      if (st.pass && !ok) { const n = (Store.s.passFail[c] || 0) + 1; Store.s.passFail[c] = n; if (n >= 2) { const m = Mem.touch(c); m.b = 1; m.due = DAY() + 1; Store.s.notes.push([DAY(), c]); Store.s.passFail[c] = 0; } Store.save(); }
      return;
    }
    /* the game's own question: its card (and, for the arithmetic games, the number fact it asked) */
    const own = GAMECARD[G.id]; if (own) Mem.answer(own, how, G.sid, { own: true, form: 'g:' + G.id });
    const f = st.q && st.q.fact; if (f && isFact(f)) Mem.answer(f, how, G.sid, { sup: 0, own: true });
    G.recent = (G.recent || []).concat(ok && !st.retest ? 1 : 0).slice(-4);
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
  cardRow(st, vals, sup) { const L = K.L(); W2X.cards(st, vals.map(n => V2G.numCard(n, sup, 70)), vals, { size: 150, gap: 36, cx: L ? 600 : 352, cy: L ? 600 : 880 }); },
  next(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
  async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(this.wrongLine ? this.wrongLine(st, ans) : W2Say.notN(ans)); await st.scope.wait(T(700)); },
  fillSlot(st, n) { const s = st.eqEl && st.eqEl.querySelector('[data-slot]'); if (s) { s.style.border = '0'; s.style.background = 'transparent'; s.appendChild(UI.num(n, 60)); } },
};
/* Z1 等号门: the vault door opens when both sides are the same. Every level uses "=" (R2-M3): L1 how many on the left (0
   too); L2 which card makes both sides the same (dots); L3 the same or not (dots, = or ≠); L4 the same or not (numbers);
   L5 the balance a + b = ? + c */
const MDoor = Object.assign({}, ZB, {
  kind0: 'door', verb: '等！', intro: '能量门，两边一样多！', praise: ['两边一样多！'], one: true,
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    if (d === 1) { const a = bagPick(G, 'z1a', [0, 1, 2, 3, 4, 5]); return { k: [1, a], mode: 'count', a, b: null, answer: a, opts: numOptions(G, a, 0, 6), say: '左边有几块？' }; }
    if (d === 2) { const n = rng.int(1, 5); return { k: [2, n], mode: 'match', a: n, b: null, answer: n, opts: numOptions(G, n, 1, 6), say: '哪张让两边一样多？' }; }
    if (d <= 4) {
      const hi = d === 3 ? 7 : 10; let a, b; do { a = rng.int(1, hi - 1); b = rng.int(1, hi - a); } while (a + b < 3);
      const same = bagPick(G, 'z1s' + d, [true, false]), s = a + b, c = same ? s : (s >= hi || rng.chance(0.5) ? s - 1 : s + 1);
      return { k: [d, a, b, c], mode: 'judge', a, b, c, answer: same ? 'eq' : 'ne', opts: ['eq', 'ne'], say: '两边一样多吗？', fact: factOf('+', a, b), sup: d === 4 ? 1 : 0, sym: d === 4 };
    }
    let a, b, c; do { a = rng.int(1, 8); b = rng.int(1, 10 - a); c = rng.int(1, Math.max(1, a + b - 1)); } while (a + b < 4 || c >= a + b);
    const x = a + b - c;
    return { k: [5, a, b, c], mode: 'bal', a, b, c, answer: x, opts: numOptions(G, x, 0, 10), say: '方框里是几？', fact: factOf('-', a + b, c), sup: 1, sym: true };
  },
  present(st) {
    const q = st.q, L = K.L(), door = st.door = W2X.thing(st, 10, 10, 3, '');
    door.innerHTML = '<svg viewBox="0 0 600 320" width="100%" height="100%" preserveAspectRatio="none"><rect x="6" y="6" width="588" height="308" rx="40" fill="#C9D2DC" stroke="#2B2118" stroke-width="8"/><rect x="24" y="24" width="250" height="272" rx="26" fill="#FFF8EC" stroke="#2B2118" stroke-width="6"/><rect x="326" y="24" width="250" height="272" rx="26" fill="#FFF8EC" stroke="#2B2118" stroke-width="6"/></svg>';
    const mid = st.eqSign = el('div', '', door); mid.textContent = q.mode === 'judge' ? '?' : '='; Object.assign(mid.style, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', font: '900 74px/1 system-ui,sans-serif', color: '#8892A0' });
    const panel = x => { const p = el('div', '', door); Object.assign(p.style, { position: 'absolute', left: x, top: '7.5%', width: '42%', height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }); return p; };
    const left = st.left = panel('4%'), right = st.slot = panel('54%');
    const ring = () => { const z = el('div', ''); Object.assign(z.style, { width: '44px', height: '44px', borderRadius: '50%', border: '4px dashed #2B2118' }); return z; };
    const grp = (n, c) => n ? V2G.dots(n, { g: 32, r: 12, per: 5, fill: c }) : ring();
    if (q.mode === 'count' || q.mode === 'match') { if (q.a) left.appendChild(V2G.dots(q.a, { g: 44, r: 17, per: 3, fill: '#4FB3FF' })); right.appendChild(V2G.op('?', 90)); }
    else if (q.mode === 'judge' && !q.sym) { left.appendChild(grp(q.a, '#4FB3FF')); left.appendChild(V2G.op('+', 40)); left.appendChild(grp(q.b, '#FFC93C')); right.appendChild(V2G.dots(q.c, { g: 32, r: 12, per: 5, fill: '#5CC46E' })); }
    else if (q.mode === 'judge') { left.appendChild(V2G.eq([q.a, '+', q.b], 1, 56)); right.appendChild(UI.num(q.c, 96)); }
    else { left.appendChild(V2G.eq([q.a, '+', q.b], 1, 50)); st.eqR = V2G.eq(['?', '+', q.c], 1, 50); right.appendChild(st.eqR); }
    this.place(st); K.pop(st, door);
    const spot = { size: 150, gap: q.mode === 'judge' ? 80 : 36, cx: L ? 600 : 352, cy: L ? 600 : 880 };
    if (q.mode === 'match') W2X.cards(st, q.opts.map(n => V2G.dots(n, { g: 28, r: 11, per: 3, fill: '#4FB3FF' })), q.opts, spot);
    else if (q.mode === 'judge') W2X.cards(st, ['=', '≠'].map(t => { const e = el('div', ''); e.textContent = t; Object.assign(e.style, { font: '900 100px/1 system-ui,sans-serif', color: t === '=' ? '#2E9E4F' : '#8A5A2E', pointerEvents: 'none' }); return e; }), q.opts, spot);
    else this.cardRow(st, q.opts, q.mode === 'count' ? 0 : q.sup);
    K.say(st, q.say);
  },
  place(st) { const L = K.L(), gap = st.q && st.q.mode === 'judge' ? 80 : 36; if (st.door) place(st.door, L ? 210 : 52, L ? 70 : 220, 600, 320); (st.cards || []).forEach((c, i) => place(c, (L ? 600 : 352) - (st.cards.length * 150 + (st.cards.length - 1) * gap) / 2 + i * (150 + gap), (L ? 600 : 880) - 75, 150, 150)); },
  async reveal(st) {
    const q = st.q;
    if (q.mode === 'count') { st.slot.innerHTML = ''; st.slot.appendChild(UI.num(q.answer, 120)); }
    else if (q.mode === 'match') { st.slot.innerHTML = ''; st.slot.appendChild(V2G.dots(q.a, { g: 44, r: 17, per: 3, fill: '#5CC46E' })); }
    else if (q.mode === 'bal') { const s = st.eqR && st.eqR.querySelector('[data-slot]'); if (s) { s.style.border = '0'; s.style.background = 'transparent'; s.appendChild(UI.num(q.answer, 50)); } }
    else { st.eqSign.textContent = q.answer === 'eq' ? '=' : '≠'; const e = st.cards[q.opts.indexOf(q.answer)]; if (e) K.hop(st, e, 24); }
    st.eqSign.style.color = q.answer === 'ne' ? '#8A5A2E' : '#5CC46E';
    st.scope.anim(st.eqSign, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.6)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 600, easing: EASE.pop });
    Sfx.reveal();
    Voice.say(q.mode === 'count' && q.answer === 0 ? '空的就是零！' : q.answer === 'ne' ? '不一样多！' : q.mode === 'judge' ? '一样多！' : '两边一样多！', { tag: 'summary' });
    this.cheerAll(st); await st.scope.wait(T(1300));
  },
  wrongLine(st, ans) { const q = st.q; if (q.mode === 'judge') return ans === 'eq' ? '两边不一样多' : '两边一样多'; if (q.mode === 'match') return '两边不一样多'; return ans === 0 ? '这边不是空的' : W2Say.notN(ans); },
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
  },
  place(st) {
    const L = K.L(), a = st.G.actors;
    if (st.ga) place(st.ga, L ? 250 : 80, L ? 120 : 260); if (st.gb) place(st.gb, L ? 620 : 420, L ? 120 : 260);
    if (st.eqEl) place(st.eqEl, L ? 300 : 90, L ? 330 : 520);
    if (st.cards) st.cards.forEach((c, i) => place(c, (L ? 600 : 352) - (st.cards.length * 150 + (st.cards.length - 1) * 36) / 2 + i * 186, (L ? 600 : 880) - 75, 150, 150));
    void a;
  },
  async reveal(st) {
    const q = st.q, L = K.L();
    this.fillSlot(st, q.answer);
    if (q.miss !== 'sum') { const h = q.miss === 'a' ? st.ga : st.gb; h.innerHTML = ''; h.style.background = 'rgba(255,255,255,.92)'; h.appendChild(V2G.dots(q.answer, { g: 30, r: 11, per: 5, fill: q.miss === 'a' ? '#4FB3FF' : '#FFC93C' })); }
    /* 合体: the two loads fly together into one */
    if (!q.sym) {
      await Promise.all([st.scope.anim(st.ga, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (L ? 180 : 160) + 'px)' }], { duration: 450, fill: 'forwards', easing: EASE.glide }), st.scope.anim(st.gb, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (L ? -190 : -170) + 'px)' }], { duration: 450, fill: 'forwards', easing: EASE.glide })]);
      st.gb.style.display = 'none'; st.ga.innerHTML = ''; const row = el('div', '', st.ga); Object.assign(row.style, { display: 'flex', gap: '8px' }); row.appendChild(V2G.dots(q.a, { g: 30, r: 11, per: 5, fill: '#4FB3FF' })); row.appendChild(V2G.dots(q.b, { g: 30, r: 11, per: 5, fill: '#FFC93C' }));
      st.scope.anim(st.ga, [{ transform: 'translateX(' + (L ? 180 : 160) + 'px) scale(1)' }, { transform: 'translateX(' + (L ? 180 : 160) + 'px) scale(1.15)' }, { transform: 'translateX(' + (L ? 180 : 160) + 'px) scale(1)' }], { duration: 400, fill: 'forwards', easing: EASE.pop });
    }
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
  },
  ask(st) { const q = st.q; st.phase = 'ready'; K.pop(st, st.eqEl); this.cardRow(st, q.opts, q.sup); K.say(st, '还剩几箱？'); },
  place(st) {
    const L = K.L(), B = L ? { x: 120, y: 200 } : { x: 92, y: 300 };
    if (st.bed) place(st.bed, B.x, B.y + 40, 520, 160);
    /* the unloaded crates: by the truck when the child unloads them (they count them), behind the garage door when the
       question is how many went (the unknown part is not seen, M5) */
    let k = 0; (st.crates || []).forEach(o => { if (o.off) { if (st.q.kind === 'took' && !st.revealed) place(o.e, -400, -400, 90, 90); else place(o.e, (L ? 700 : 520) + (k % 2) * 94, (L ? 150 : 520) + Math.floor(k++ / 2) * 94, 90, 90); } else { const i = st.crates.filter(x => !x.off).indexOf(o); place(o.e, B.x + 10 + (i % 5) * 100, B.y - 30 + (i >= 5 ? -94 : 0), 90, 90); } });
    if (st.gdoor) place(st.gdoor, L ? 700 : 520, L ? 150 : 520, 190, 190);
    if (st.eqEl) { if (st.q.sym) { const w = st.eqEl.getBoundingClientRect().width / (Stage.scale || 1); place(st.eqEl, Math.round((L ? 512 : 352) - w / 2), L ? 230 : 360); } else place(st.eqEl, L ? 250 : 120, L ? 420 : 560); }
    if (st.cards) st.cards.forEach((c, i) => place(c, (L ? 600 : 352) - (st.cards.length * 150 + (st.cards.length - 1) * 36) / 2 + i * 186, (L ? 600 : 880) - 75, 150, 150));
  },
  onGesture(st, name, p) {
    const m = /^cr(\d+)$/.exec(p.id || '');
    if (name === 'tap' && m && st.q.act && st.need > 0) { const o = st.crates[+m[1]]; if (o.off) return 'ok'; o.off = true; st.need--; st.childOps++; Sfx.whoosh(0.2); this.place(st); if (st.need === 0 && st.actRes) st.scope.timeout(() => st.actRes(), T(400) + 1); return 'ok'; }
    return W3X.tapCards(st, name, p);
  },
  next(st, strat) { if (st.q.act && st.need > 0) { const i = st.crates.findIndex(o => !o.off); return { g: 'tap', p: { id: 'cr' + i } }; } return ZB.next.call(this, st, strat); },
  async reveal(st) { this.fillSlot(st, st.q.answer); st.revealed = true; if (st.gdoor) st.gdoor.style.display = 'none'; this.place(st); Sfx.reveal(); Voice.say('卸货真快！', { tag: 'summary' }); this.cheerAll(st); await st.scope.wait(T(1100)); },
  wrongLine(st, ans) { return ans === 0 ? '不是零' : '不是' + (CNQ(ans) || ans) + '箱'; },
});
/* Z4 三个数是一家: the triangle of a whole and its two parts - which number sentence belongs to it? */
const MFamily = Object.assign({}, ZB, {
  kind0: 'family', verb: '连！', intro: '三个数是一家！', praise: ['它们是一家！'], one: true,
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, hi = [0, 5, 7, 9, 10, 10][d], w = rng.int(3, hi), a = rng.int(1, w - 1), b = w - a;
    const ops = d <= 2 ? ['+'] : ['+', '-'], op = rng.pick(ops);
    const ok = op === '+' ? [a, '+', b, '=', w] : [w, '-', a, '=', b];
    const bad = [];
    /* the wrong ones are false sentences (never a true one from another family - a 4-year-old would rightly take it) */
    const alt = [[a, '+', b, '=', w + 1], [w, '-', a, '=', b + 1], [a + 1, '+', b, '=', w], [w, '-', b, '=', a + 1], [w, '-', a, '=', Math.max(0, b - 1)]].filter(x => (x[1] === '+' ? x[0] + x[2] : x[0] - x[2]) !== x[4]).filter(s => s.every(x => typeof x !== 'number' || (x >= 0 && x <= 19)) && JSON.stringify(s) !== JSON.stringify(ok));
    while (bad.length < 2) { const s = rng.pick(alt); if (!bad.some(x => JSON.stringify(x) === JSON.stringify(s))) bad.push(s); }
    const opts = rng.shuffle([ok, bad[0], bad[1]]);
    const hide = d === 5 ? rng.pick(['w', 'a', 'b']) : null;          /* the top level: one number of the family is hidden (L8) */
    return { k: [d, w, a, op, hide], w, a, b, op, hide, eqs: opts, answer: opts.indexOf(ok), opts: [0, 1, 2], fact: op === '+' ? factOf('+', a, b) : factOf('-', w, a), sup: d >= 3 ? 1 : 0 };
  },
  present(st) {
    const q = st.q, L = K.L(), tri = st.tri = W2X.thing(st, 10, 10, 5, '');
    tri.innerHTML = '<svg viewBox="0 0 300 260" width="100%" height="100%"><path d="M150 30L270 230H30Z" fill="#E8F4FF" stroke="#2B2118" stroke-width="7" stroke-linejoin="round"/></svg>';
    const put = (n, x, y) => { const c = el('div', '', tri); Object.assign(c.style, { position: 'absolute', left: x + '%', top: y + '%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: '50%', width: '96px', height: '96px', boxShadow: '0 0 0 4px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center' }); c.appendChild(n === '?' ? V2G.op('?', 54) : q.sup ? UI.num(n, 54) : V2G.numCard(n, 0, 40)); };
    put(q.hide === 'w' ? '?' : q.w, 50, 20); put(q.hide === 'a' ? '?' : q.a, 14, 86); put(q.hide === 'b' ? '?' : q.b, 86, 86);
    st.cards = q.eqs.map((s, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(V2G.eq(s, 1, 46)); K.pop(st, c, 80 * i); return c; });
    st.opts = [0, 1, 2];
    this.place(st); K.pop(st, tri);
    K.say(st, '哪个算式是一家？');
  },
  place(st) { const L = K.L(); if (st.tri) place(st.tri, L ? 90 : 202, L ? 150 : 150, 300, 260); (st.cards || []).forEach((c, i) => L ? place(c, 470, 130 + i * 150, 440, 126) : place(c, 92, 470 + i * 150, 520, 126)); },
  async reveal(st) { const e = st.cards[st.q.answer]; K.hop(st, e, 24); K.ring(st, [box(e)], 2, '#5CC46E'); Sfx.reveal(); Voice.say('它们是一家！', { tag: 'summary' }); this.cheerAll(st); await st.scope.wait(T(1200)); },
  async feedback(st, ans) { const e = st.cards[ans]; if (e) K.wiggle(st, e); W3X.say('这个不是一家'); await st.scope.wait(T(700)); },
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

/* ---------------------------------------------------------------- the daily key and the gems (A.13): the first visit of a day
   "找回老朋友" (up to 5 due cards; done = the key, right or not; skippable; nothing due -> the key at once); a key, a flag,
   a boss or an extra review star turns the next gem; 6 gems call a hero. One order, no chance, nothing lost. */
const GEMC = ['#FF6B5B', '#FFC93C', '#5CC46E', '#4FB3FF', '#B57BFF', '#FF9F43'];
const HEROES6 = ['optimus', 'bumblebee', 'ultraman', 'zero', 'kaiju1', 'kaiju2'];
Object.assign(Gems, {
  gemSvg(i, on, size) { const c = GEMC[i % 6]; return '<svg viewBox="0 0 60 60" width="' + size + '" height="' + size + '"><path d="M14 8H46L56 24L30 54L4 24Z" fill="' + (on ? c : 'rgba(255,255,255,.18)') + '" stroke="#2B2118" stroke-width="3.5" stroke-linejoin="round"/>' + (on ? '<path d="M4 24H56M14 8L22 24L30 54L38 24L46 8" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="2.5"/>' : '') + '</svg>'; },
  reveal(n) {
    const ov = el('div', '', document.body); ov.id = 'gemshow';
    Object.assign(ov.style, { position: 'fixed', inset: 0, zIndex: 70, background: 'radial-gradient(circle,#FFF6C8 0%,#B57BFF 55%,#4B2F9E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' });
    const hero = n % 6 === 0, g = el('div', '', ov); g.innerHTML = hero ? '' : this.gemSvg(n - 1, true, 220);
    if (hero) { const im = img('assets/chars/' + HEROES6[(n / 6 - 1) % 6] + '.png', '', g); im.style.height = '320px'; }
    g.animate([{ transform: 'scale(.2) rotate(-30deg)', opacity: 0 }, { transform: 'scale(1.1) rotate(0)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: T(800) + 1, easing: EASE.pop });
    Sfx.fanfare(); Fx.confetti(30); Voice.sayNow(hero ? '新英雄来啦！' : '能量宝石！', { tag: 'card' }); if (n % 36 === 0) Voice.say('宝石册满啦！', { tag: 'card' });
    const off = () => { ov.remove(); MapView.update && MapView.update(); };
    tapify(ov, off); setTimeout(() => { if (ov.isConnected) off(); }, T(3200) + 200);
  },
  album() {
    const ov = el('div', '', document.body); ov.id = 'gems';
    Object.assign(ov.style, { position: 'fixed', inset: 0, zIndex: 55, background: 'linear-gradient(#2B3E8C,#4B2F9E)', overflowY: 'auto', padding: '120px 20px 40px', boxSizing: 'border-box' });
    const home = el('button', 'btn', ov); Object.assign(home.style, { position: 'fixed', left: 'calc(14px + var(--sl))', top: 'calc(14px + var(--st))', width: '96px', height: '96px', background: '#FFE08A' }); img('assets/props/ui_home.png', '', home).style.width = '74%'; tapify(home, () => ov.remove());
    if (this.avail()) { const go = el('button', 'btn', ov); Object.assign(go.style, { position: 'fixed', right: 'calc(14px + var(--sr))', top: 'calc(14px + var(--st))', width: '140px', height: '96px', background: '#5CC46E' }); img('assets/props/chest.png', '', go).style.height = '80%'; tapify(go, () => { ov.remove(); this.start(); }); go.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 1200, iterations: Infinity }); }
    /* the current book: 36 gems each; after the first book the next one starts (the heroes come again) */
    const all = Store.s.gems.n, book = all > 0 ? Math.floor((all - 1) / 36) : 0, n = all - book * 36;
    if (book > 0) { const t = el('div', '', ov); t.textContent = '第 ' + (book + 1) + ' 册'; Object.assign(t.style, { color: '#FFE08A', font: '900 28px system-ui,sans-serif', textAlign: 'center', margin: '0 0 12px' }); }
    HEROES6.forEach((h, r) => {
      const row = el('div', '', ov); Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', margin: '0 auto 14px', maxWidth: '900px' });
      for (let i = 0; i < 5; i++) { const k = r * 6 + i, c = el('div', '', row); c.innerHTML = this.gemSvg(k, k < n, 76); }
      const hc = el('div', '', row); Object.assign(hc.style, { width: '110px', height: '120px', borderRadius: '18px', background: n >= (r + 1) * 6 ? '#fff' : 'rgba(255,255,255,.18)', boxShadow: '0 0 0 3px #2B2118', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' });
      const im = img('assets/chars/' + h + '.png', '', hc); Object.assign(im.style, { height: '92%', objectFit: 'contain', filter: n >= (r + 1) * 6 ? '' : 'brightness(0) opacity(.5)' });
    });
    Voice.sayNow(this.avail() ? '找回老朋友！' : '能量宝石！', { tag: 'map' });
  },
});

/* ---------------------------------------------------------------- the map: the gem chest (top right), the parent's red dot, the
   first map of the day says "找回老朋友！" */
Object.assign(MapV2, {
  ensure() {
    if ($('#gemchest')) return;
    const s = el('style', '', document.head); s.textContent = '#gear.dot::after{content:"";position:absolute;right:12px;top:12px;width:22px;height:22px;border-radius:50%;background:#E8414B;box-shadow:0 0 0 3px #fff}';
    const b = el('button', 'btn', $('#map')); b.id = 'gemchest'; b.setAttribute('aria-label', '能量宝石');
    Object.assign(b.style, { position: 'absolute', right: 'calc(14px + var(--sr))', top: 'calc(14px + var(--st))', width: '104px', height: '104px', background: '#FFF3C4', borderRadius: '28px', zIndex: 12 });
    const i = img('assets/props/chest.png', '', b); Object.assign(i.style, { width: '84%', height: '84%', objectFit: 'contain' });
    tapify(b, () => { MapView.closePanel(true); Gems.album(); });                 /* the album first; its chest button starts the key round (R2-L5) */
  },
  update() {
    this.ensure();
    const c = $('#gemchest'), on = Gems.avail();
    if (on && !c._pulse) c._pulse = c.animate([{ transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,201,60,0)' }, { transform: 'scale(1.08)', boxShadow: '0 0 0 12px rgba(255,201,60,.85)' }, { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,201,60,0)' }], { duration: 1400, iterations: Infinity });
    if (!on && c._pulse) { c._pulse.cancel(); c._pulse = null; }
    $('#gear').classList.toggle('dot', Supply.low());
  },
  hello() { const D = Mem.today(); if (!Gems.avail() || D.hello || fast()) return; D.hello = 1; setTimeout(() => { if (Screens.cur !== 'map' || Session.G) return; Voice.say('找回老朋友！', { tag: 'map' }); const b = $('#gemchest'); if (b) b.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0)' }], { duration: 600, iterations: 2 }); }, T(2600)); },
});
/* new content: the child has reached the last installed sea, or less than 14 days of islands left at last week's pace (A.28) */
const Supply = {
  low() {
    if (ORDER3.some(id => Store.w(id).unlocked)) return true;
    const d = DAY(), recent = (Store.s.flagDays || []).filter(x => x > d - 7).length, left = ORDER.concat(ORDER2, ORDER3).filter(id => !flagged(id)).length;
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
    const where = ORDER.concat(ORDER2, ORDER3).filter(id => Store.w(id).unlocked).slice(-1)[0];
    const days = Object.keys(S.days).map(Number).filter(x => x > d - 7).map(x => Math.round(S.days[x].ms / 60000) + '分').join(' ');
    return ['点点岛进度报告（' + new Date().toLocaleDateString() + '）', '位置：' + (where ? WORLDS[where].name : '-') + '；旗子 ' + (S.flags || []).length + ' 面；已装：三片海，运算岛在云上第 ' + (ORDER3.indexOf('trans3') + 1) + ' 个',
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
  sections(sh) {
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
    if (pre) { const rb = el('button', 'pbtn', sh, { text: '恢复到升级前的存档' }); rb.addEventListener('click', () => { if (!confirm('回到升级 v2 之前的存档？现在的复习记录和宝石会丢掉。')) return; try { localStorage.setItem(KEY, pre); } catch (e) {} location.reload(); }); }
    const rep = el('button', 'pbtn', sh, { text: '复制进度报告' }), ta = el('textarea', '', sh); Object.assign(ta.style, { width: '100%', height: '120px', display: 'none', fontSize: '14px' });
    rep.addEventListener('click', () => { ta.style.display = ''; ta.value = Report.text(); ta.select(); try { navigator.clipboard.writeText(ta.value); rep.textContent = '已复制，可以直接粘贴给 Claude'; } catch (e) { rep.textContent = '请长按下面的文字全选复制'; } });
    const ex = el('button', 'pbtn', sh, { text: '导出存档' }), im = el('button', 'pbtn', sh, { text: '恢复存档' });
    ex.addEventListener('click', () => { ta.style.display = ''; ta.value = Report.export(); ta.select(); try { navigator.clipboard.writeText(ta.value); ex.textContent = '存档已复制'; } catch (e) {} });
    im.addEventListener('click', () => { if (ta.style.display === 'none' || !ta.value) { ta.style.display = ''; ta.value = ''; ta.placeholder = '把导出的存档粘贴到这里，再按一次“恢复存档”'; return; } try { Report.import(ta.value); im.textContent = '已恢复'; } catch (e) { im.textContent = '这段文字不是存档'; } });
    const mins = el('button', 'pbtn', sh, { text: '' }), opts = [12, 15, 20, 30, 10, 0], lab = () => { mins.textContent = '“停船还是继续”：' + (S.settings.mins ? '玩到 ' + S.settings.mins + ' 分钟时问一次' : '关'); };
    lab(); mins.addEventListener('click', () => { S.settings.mins = opts[(opts.indexOf(S.settings.mins) + 1) % opts.length]; Store.save(); lab(); });
    el('div', 'mut', sh, { text: '建议：先玩字字岛 12–18 分钟，再玩点点岛 10–15 分钟。“停船还是继续”只是提醒，没有上限。两个 app 能否共享存储：' + (S.probe ? (S.probe.zzi ? '能（同一个存储）' : '不能（各自独立）') : '还没检测') + '。' });
  },
};

W3.loaded = true;          /* the sky's games and v2's are both in */
