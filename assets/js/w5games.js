/* 点点岛 · 积木城 (world 5): the 28 games. Loaded after the entry tap by W3.load() in index.html (after w4games.js). Source: raw/js/w5/ (raw/js/build_w5.py). */
"use strict";
const W5R = {};
const W5HAVE = new Set(["avengers_armory", "avengers_field", "avengers_hangar", "avengers_hangar5", "avengers_lab", "avengers_tilehall", "avengers_workshop", "avengers_yard", "bluey_blockyard", "bluey_candyshop", "bluey_creek", "bluey_kitepark", "bluey_picnic", "bluey_pool", "bluey_shop", "bluey_yard", "huluwa_fields", "huluwa_meadow", "huluwa_orchard", "huluwa_papercut", "huluwa_study", "huluwa_terraces", "huluwa_treasure", "huluwa_treasure5", "paw_busstop", "paw_city", "paw_classroom", "paw_control", "paw_controlroom", "paw_mapmat", "paw_townmat", "paw_townpark", "peppa_artroom", "peppa_blockroom", "peppa_easel", "peppa_garden", "peppa_playground", "peppa_porch", "peppa_stage", "peppa_zoo", "pj_canteen", "pj_hq", "pj_hqlab", "pj_moonlab", "pj_museum", "pj_robotlab", "pj_toyroom", "pj_workshop", "trans_assembly", "trans_control", "trans_dock", "trans_garage5", "trans_hangar", "trans_school", "trans_yard", "ultra_crystalhall", "ultra_lab", "ultra_plaza", "ultra_street", "xiyou_cliffs", "xiyou_courtyard", "xiyou_mountainroad", "xiyou_palace", "xiyou_peak", "xiyou_temple", "xiyou_templehall", "xiyou_vinegrove", "zz_ultra2_quiz", "zz_ultra4_abc", "zz_ultra4_write", "zz_ultra_find", "prop_bush", "prop_balloon", "prop_flower", "prop_bone", "prop_fish"]);
/* ================================================================ 积木城 (world 5): what the 28 rules share. This file comes
   first in assets/js/w5games.js; only W5U is global (each island file is wrapped in its own (() => { ... })()).
   docs/W5-DESIGN.md §4 and docs/OPTIONS-EXPLAIN-SPEC.md, the iron rules:
     - a "pick one" question has FIVE options or more (doors, cells, things on the stage), exactly one right; the right one's
       place comes from a bag (W5U.at / W5U.deal), a number's rank among the five too (W5U.nums). A question with only 2-3
       possible answers asks two at once (一题两问, W5U.two*): right only when both are.
     - after a wrong answer: feedback says what it is (one short line, never 错), then explain(st, ans): 1. a BLUE dashed ring
       on what he chose + a line why it is not it; 2. the demonstration (no cheering); 3. a GOLD ring on the right one + why.
       Every ring and every line is one step of the parent's 一步一步 setting by itself (K.ring / Voice.say mark it); a step
       that is only an animation calls Step.beat(st) (W5U.beat does).
     - every sentence <= 8 Chinese characters; two-sentence questions with W3X.say2; every sentence a rule can say is listed
       by its lines() (and the sentences built from numbers / names in raw/js/w5/<island>.voice.txt) so it is recorded.
     - tap targets >= 88 logical px in landscape (1024 x 704) and portrait (704 x 1024) - the stage is never scaled below 1.
   The convention of §3.3 (gone / still here / came / together) is W5U.gone / stay / came / brace and W5U.twoLines. */
const W5U = {
  GOLD: '#FFC93C', BLUE: '#4FB3FF', INK: '#2B2118', GREY: '#9AA3AD',
  pal: ['#FF6B5B', '#4FB3FF', '#5CC46E', '#FFC93C', '#B57BFF', '#FF9F43'],
  /* ---------------------------------------------------------------- options: places and numbers from bags */
  /* the right one's place among n (0..n-1) from a bag of all n places (each place right equally often in the long run) */
  at(G, n, name) { return bagPick(G, (name || 'w5at') + n, Array.from({ length: n }, (_, i) => i)); },
  /* the right one at the place the bag deals, the others shuffled around it */
  deal(G, ok, others, name) {
    const n = others.length + 1, pos = this.at(G, n, name), o = G.rng.shuffle(others.slice()), out = [];
    for (let i = 0, k = 0; i < n; i++) out.push(i === pos ? ok : o[k++]);
    return out;
  },
  /* five different numbers around n inside [lo, hi] (hi moves up when narrower than five); n's rank (smallest ... largest)
     from a bag, so no rank is a safe guess either; then dealt (its place from the place bag) */
  nums(G, n, lo, hi) {
    lo = lo == null ? 0 : lo; hi = Math.max(hi == null ? 10 : hi, lo + 4, n);
    const fit = [0, 1, 2, 3, 4].filter(r => n - r >= lo && n - r + 4 <= hi);
    const b = G.bags.w5rank || (G.bags.w5rank = []);
    if (!b.length) b.push(...G.rng.shuffle([0, 1, 2, 3, 4]));
    const i = b.findIndex(r => fit.includes(r));
    const r = i >= 0 ? b.splice(i, 1)[0] : (fit.length ? fit[G.rng.int(0, fit.length - 1)] : 0);
    return this.deal(G, n, [0, 1, 2, 3, 4].map(k => n - r + k).filter(v => v !== n));
  },
  /* ---------------------------------------------------------------- layout */
  /* n boxes of w x h in rows of `per`, each row centred on cx, the rows together centred on cy */
  grid(n, cx, cy, w, h, gx, gy, per) {
    per = per || n; gy = gy == null ? gx : gy;
    const rows = Math.ceil(n / per), out = [];
    for (let i = 0; i < n; i++) { const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per; out.push({ x: Math.round(cx - (inRow * w + (inRow - 1) * gx) / 2 + c * (w + gx)), y: Math.round(cy - (rows * h + (rows - 1) * gy) / 2 + r * (h + gy)) }); }
    return out;
  },
  lay(els, cx, cy, w, h, gx, gy, per) { this.grid(els.length, cx, cy, w, h, gx, gy, per).forEach((p, i) => { if (els[i]) place(els[i], p.x, p.y, w, h); }); },
  /* the usual row of five cards: landscape 5 x 116 (186-838, clear of the friends in the corners), portrait 5 x 120 */
  row5(L) { return L ? { s: 116, gap: 18 } : { s: 120, gap: 12 }; },
  /* a white tap card on the stage, registered as `id` (z 6); its content goes in with .appendChild */
  card(st, id, z) { const c = W3X.card(st, id, z || 6, 'card'); return c; },
  /* five (or more) option cards from nodes: st.cards, st.opts; ids card0 .. cardN */
  cards(st, nodes, vals) { st.cards = nodes.map((nd, i) => { const c = this.card(st, 'card' + i); if (nd) c.appendChild(nd); return c; }); st.opts = vals.slice(); return st.cards; },
  /* tap one card: submit its value (once) */
  tapCard(st, name, p) { const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || !st.cards || st.picked) return false; st.picked = true; Session.submit(st, st.opts[i]); return 'ok'; },
  cardNext(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return i < 0 ? null : { g: 'tap', p: { id: 'card' + i } }; },
  /* ---------------------------------------------------------------- 一题两问: two asks, each one tap; st.fill collects them,
     the question is judged (Session.submit with 'a,b') when the last is in. The rule says each ask with ask(st, k). */
  twoStart(st, asks) { st.fill = Array(asks || 2).fill(null); st.askK = 0; },
  twoPut(st, v, then) {
    const k = st.fill.indexOf(null); if (k < 0 || st.picked) return false;
    st.fill[k] = v; Sfx.place();
    if (st.fill.indexOf(null) < 0) { st.picked = true; st.scope.timeout(() => Session.submit(st, st.fill.join(',')), 380); }
    else if (then) then(k + 1);
    return 'ok';
  },
  /* the two dots on the task card (as the engine's Two.pips): this ask big and yellow, a done one green, the next small */
  pips(st, t, k) {
    if (!t) return t;
    const d = el('div', 'twopips', t); Object.assign(d.style, { display: 'flex', gap: '8px', marginLeft: '8px', alignItems: 'center' });
    [0, 1].forEach(i => { const cur = i === k, s = cur ? 30 : 18, p = el('span', cur ? 'cur' : '', d); Object.assign(p.style, { width: s + 'px', height: s + 'px', flex: '0 0 auto', borderRadius: '50%', boxShadow: '0 0 0 3px ' + this.INK, background: i < k ? '#5CC46E' : cur ? '#FFC93C' : '#fff' }); if (cur && k) st.scope.anim(p, [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 700, delay: 200 }); });
    return t;
  },
  twoBad(st, ans) { const a = String(ans).split(','), w = String(st.q.answer).split(','); return w.map((x, k) => (a[k] !== x ? k : -1)).filter(k => k >= 0); },
  /* ---------------------------------------------------------------- the explain step's marks */
  /* a thing's box on the stage (a piece inside another one: from the screen) */
  rect(e) {
    if (e.parentElement === Stage.el && e.style.left) return box(e);
    if (e.offsetWidth) {
      let x = 0, y = 0, n = e;
      while (n && n.parentElement !== Stage.el) {
        const p = n.offsetParent; if (!p) break;
        x += n.offsetLeft + (p === Stage.el ? 0 : p.clientLeft); y += n.offsetTop + (p === Stage.el ? 0 : p.clientTop);
        if (p === Stage.el) return { x, y, w: e.offsetWidth, h: e.offsetHeight };
        n = p;
      }
      if (n && n !== e && n.parentElement === Stage.el && n.style.left) { const b = box(n); return { x: b.x + x, y: b.y + y, w: e.offsetWidth, h: e.offsetHeight }; }
    }
    const r = e.getBoundingClientRect(), a = Stage.toStage(r.left, r.top), b = Stage.toStage(r.right, r.bottom);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  },
  ring(st, els, color, pad) { const list = [].concat(els).filter(Boolean); if (!list.length) return null; return K.ring(st, list.map(e => this.rect(e)), pad == null ? 6 : pad, color); },
  /* what he chose: a blue dashed ring (and a little shake) - never red, never a cross; st.xb remembers it (tests) */
  blue(st, els, pad) { return [].concat(els).filter(Boolean).map(e => { (st.xb = st.xb || []).push(e); K.wiggle(st, e); return this.ring(st, e, this.BLUE, pad); }); },
  hide(rings) { [].concat(rings).filter(Boolean).forEach(r => { r.style.visibility = 'hidden'; }); },
  /* the right one: a gold ring, one for every element given */
  gold(st, els, pad) { [].concat(els).filter(Boolean).forEach(e => this.ring(st, e, this.GOLD, pad)); },
  /* a small round mark at a point of a picture (the thing that differs) */
  dot(st, x, y, r, color) {
    const d = W2X.thing(st, 2 * r, 2 * r, 48, ''); place(d, Math.round(x - r), Math.round(y - r), 2 * r, 2 * r);
    Object.assign(d.style, { borderRadius: '50%', border: '5px dashed ' + (color || this.BLUE), boxSizing: 'border-box', pointerEvents: 'none', background: 'rgba(79,179,255,.12)' });
    K.pop(st, d); Step.mark(st); return d;
  },
  /* a demonstration step without its own words or ring: step by step it waits for 下一步 */
  beat(st) { return Step.beat(st); },
  /* counting one by one: aloud when a right answer is shown; in the explain step a rising tick each (short) */
  count(st, ms, n) { if (!st.explaining) return Count.beat(st.scope, ms, n); Sfx.count(Math.max(1, n)); return st.scope.wait(Math.min(ms, 190)); },
  /* a summary sentence; a tap in the explain step (st.ff) skips it */
  sum(st, text) { if (st.explaining && st.ff) return Promise.resolve('ff'); return Voice.say(text, { tag: 'summary' }); },
  /* a sentence early in the explain step (what his choice is): a tap cuts it */
  note(st, text) { return Voice.say(text, { tag: 'explain' }); },
  /* the feedback line (said once, remembered for the step-by-step first step) */
  say(st, text) { st.fbLine = text; return Voice.say(text, { tag: 'wrong' }); },
  cardOf(st, v) { const i = (st.opts || []).indexOf(v); return i >= 0 && st.cards ? st.cards[i] : null; },
  /* the simplest explain: his card blue, a moment, then the game's own reveal (gold and the demonstration; no cheering) */
  async chosenThenReveal(g, st, ans, el) {
    const my = st;
    this.blue(st, el || this.cardOf(st, ans));
    await st.scope.wait(650); if (!Session.alive(my)) return;
    await this.beat(st); if (!Session.alive(my)) return;
    await g.reveal(st);
  },
  /* ---------------------------------------------------------------- §3.3 "went away" and "still here": one drawing for the
     whole world. Gone: a grey dashed outline where it stood (no red, no cross) and an arrow out of the door; still here:
     solid, one frame around the group; came: a sparkle; together: a big brace between the two groups. */
  /* a grey dashed outline of e's box (left behind when e goes away) */
  gone(st, e, z) {
    const b = this.rect(e), d = W2X.thing(st, b.w, b.h, z || 3, '');
    place(d, b.x, b.y, b.w, b.h);
    Object.assign(d.style, { border: '5px dashed ' + this.GREY, borderRadius: '24px', boxSizing: 'border-box', background: 'rgba(154,163,173,.12)', pointerEvents: 'none' });
    st.scope.anim(d, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    return d;
  },
  /* e walks out to (x, y) (the door) with an arrow behind it; its outline stays */
  async leave(st, e, x, y, dur) {
    const b = this.rect(e), g = this.gone(st, e), s = K.lines(st), a = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    const l = svg('path', { d: 'M' + a.x + ' ' + a.y + 'L' + x + ' ' + y, stroke: this.GREY, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '3 14', fill: 'none' }, s);
    svg('path', { d: this.arrowHead(a, { x, y }, 22), fill: this.GREY }, s);
    await st.scope.anim(e, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + (x - a.x) + 'px,' + (y - a.y) + 'px) scale(.6)', opacity: 0 }], { duration: dur || 600, easing: EASE.glide, fill: 'forwards' });
    return { ghost: g, trail: l };
  },
  arrowHead(a, b, s) { const ang = Math.atan2(b.y - a.y, b.x - a.x), p = (t, r) => (b.x + Math.cos(ang + t) * r).toFixed(1) + ' ' + (b.y + Math.sin(ang + t) * r).toFixed(1); return 'M' + b.x + ' ' + b.y + 'L' + p(Math.PI * 0.82, s) + 'L' + p(-Math.PI * 0.82, s) + 'Z'; },
  /* what is still here: one solid frame around the group */
  stay(st, els, color) { const list = [].concat(els).filter(Boolean); if (!list.length) return null; return K.ring(st, list.map(e => this.rect(e)), 10, color || this.INK); },
  /* it came: a sparkle on it (and a pop) */
  came(st, e) { const b = this.rect(e); K.pop(st, e); Fx.burst(b.x + b.w / 2, b.y + b.h / 2, { n: 10, dist: 50 }); },
  /* together: a big brace under (or over) both groups, its tip in the middle */
  brace(st, els, above) {
    const list = [].concat(els).filter(Boolean); if (!list.length) return null;
    const R = list.map(e => this.rect(e)), x0 = Math.min(...R.map(r => r.x)), x1 = Math.max(...R.map(r => r.x + r.w)), y = above ? Math.min(...R.map(r => r.y)) - 14 : Math.max(...R.map(r => r.y + r.h)) + 14, k = above ? -1 : 1, m = (x0 + x1) / 2;
    const s = K.lines(st), h = 26 * k;
    const p = svg('path', { d: 'M' + x0 + ' ' + y + 'Q' + x0 + ' ' + (y + h) + ' ' + (x0 + 30) + ' ' + (y + h) + 'L' + (m - 24) + ' ' + (y + h) + 'Q' + m + ' ' + (y + h) + ' ' + m + ' ' + (y + 2 * h) + 'Q' + m + ' ' + (y + h) + ' ' + (m + 24) + ' ' + (y + h) + 'L' + (x1 - 30) + ' ' + (y + h) + 'Q' + x1 + ' ' + (y + h) + ' ' + x1 + ' ' + y, stroke: this.GOLD, 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, s);
    Step.mark(st);
    return p;
  },
  /* the words of §3.3: "走了两只" / "还剩三只" / "来了两只" / "一共五只" (unit: 只 / 个 / 块 / 条 ...) */
  went: (n, u) => '走了' + CNQ(n) + (u || '只'), left: (n, u) => '还剩' + CNQ(n) + (u || '只'), came2: (n, u) => '来了' + CNQ(n) + (u || '只'), all: (n, u) => '一共' + CNQ(n) + (u || '只'),
  /* both sentences, never only one: "走了两只，" then "还剩三只" */
  async twoLines(st, gone, left, u) { await this.sum(st, this.went(gone, u) + '，'); if (!Session.alive(st)) return; await this.sum(st, this.left(left, u) + '！'); },
  /* ---------------------------------------------------------------- pictures */
  /* a thing's picture: the new props (bush, balloon, flower, bone, fish) from their file when it is there, else a drawing */
  NEWP: {
    bush: '<ellipse cx="50" cy="62" rx="40" ry="28" fill="#5CC46E" stroke="#2B2118" stroke-width="5"/><circle cx="34" cy="48" r="16" fill="#6FD27F" stroke="#2B2118" stroke-width="5"/><circle cx="62" cy="44" r="18" fill="#6FD27F" stroke="#2B2118" stroke-width="5"/>',
    balloon: '<ellipse cx="50" cy="40" rx="26" ry="32" fill="#E8414B" stroke="#2B2118" stroke-width="5"/><path d="M50 72L46 80H54Z M50 80Q44 88 52 96" fill="none" stroke="#2B2118" stroke-width="3"/>',
    flower: '<path d="M50 56V94" stroke="#3E8E3E" stroke-width="6"/><g stroke="#2B2118" stroke-width="4"><circle cx="50" cy="22" r="13" fill="#FFC93C"/><circle cx="68" cy="36" r="13" fill="#FFC93C"/><circle cx="61" cy="56" r="13" fill="#FFC93C"/><circle cx="39" cy="56" r="13" fill="#FFC93C"/><circle cx="32" cy="36" r="13" fill="#FFC93C"/><circle cx="50" cy="40" r="11" fill="#FF9F43"/></g>',
    bone: '<path d="M26 40a10 10 0 1 1 6-16a10 10 0 1 1 10 12H58a10 10 0 1 1 10-12a10 10 0 1 1 6 16a10 10 0 1 1-6 16a10 10 0 1 1-10 12H42a10 10 0 1 1-10 12a10 10 0 1 1-6-16z" fill="#FFF8EC" stroke="#2B2118" stroke-width="5" transform="translate(0 6)"/>',
    fish: '<path d="M20 50Q46 22 72 50Q46 78 20 50Z" fill="#FF9F43" stroke="#2B2118" stroke-width="5"/><path d="M70 50L92 34V66Z" fill="#FF9F43" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/><circle cx="34" cy="46" r="4" fill="#2B2118"/>',
  },
  prop(k) { return this.NEWP[k] && !W5HAVE.has('prop_' + k) ? W2X.icon(this.NEWP[k]) : 'assets/props/' + k + '.png'; },
  propImg(k, w, h, pct) { const i = img(this.prop(k), ''); Object.assign(i.style, { width: (w ? w + 'px' : (pct || 100) + '%'), height: (h ? h + 'px' : (pct || 100) + '%'), objectFit: 'contain', pointerEvents: 'none' }); return i; },
  /* a block figure (积木小人: square head, square body, two mittens, two legs) - a generic toy, not a character. front: a
     face; back: the back of the head (hair). opt: { color, front, left / right: a picture in that hand (its OWN left / right) } */
  blockMan(opt) {
    opt = opt || {};
    const k = this.INK, c = opt.color || '#4FB3FF', s = svg('svg', { viewBox: '0 0 100 160', width: '100%', height: '100%' }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
    svg('rect', { x: 34, y: 112, width: 13, height: 40, rx: 4, fill: '#2E3A6B', stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 53, y: 112, width: 13, height: 40, rx: 4, fill: '#2E3A6B', stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 26, y: 62, width: 48, height: 54, rx: 8, fill: c, stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 10, y: 66, width: 14, height: 40, rx: 6, fill: c, stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 76, y: 66, width: 14, height: 40, rx: 6, fill: c, stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 7, y: 102, width: 20, height: 18, rx: 8, fill: '#FFC93C', stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 73, y: 102, width: 20, height: 18, rx: 8, fill: '#FFC93C', stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 30, y: 16, width: 40, height: 42, rx: 8, fill: '#FFD9A8', stroke: k, 'stroke-width': 4 }, s);
    svg('rect', { x: 40, y: 8, width: 20, height: 10, rx: 3, fill: '#FFD9A8', stroke: k, 'stroke-width': 4 }, s);
    if (opt.front) { svg('circle', { cx: 42, cy: 34, r: 3.6, fill: k }, s); svg('circle', { cx: 58, cy: 34, r: 3.6, fill: k }, s); svg('path', { d: 'M42 45Q50 51 58 45', stroke: k, 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round' }, s); }
    else svg('path', { d: 'M30 50V24Q30 16 38 16H62Q70 16 70 24V50Q50 56 30 50Z', fill: '#6B4A2E', stroke: k, 'stroke-width': 4 }, s);      /* the back of the head: hair */
    /* its own right hand is on the screen's left when it faces you, on the right when you see its back */
    const hand = side => (side === 'right') === !!opt.front ? 17 : 83;
    ['left', 'right'].forEach(side => { if (!opt[side]) return; const im = svg('image', { href: opt[side], x: hand(side) - 20, y: 76, width: 40, height: 40 }, s); im.setAttribute('preserveAspectRatio', 'xMidYMid meet'); });
    return s;
  },
  /* ---------------------------------------------------------------- shapes made of grid cells (areas, cutting, puzzles):
     a shape is a list of [col, row] cells */
  poly: {
    norm(cells) { const x0 = Math.min(...cells.map(c => c[0])), y0 = Math.min(...cells.map(c => c[1])); return cells.map(c => [c[0] - x0, c[1] - y0]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); },
    key(cells) { return this.norm(cells).map(c => c.join(':')).join(','); },
    /* the eight turns and flips */
    forms(cells) { const out = []; let cur = cells; for (let f = 0; f < 2; f++) { for (let r = 0; r < 4; r++) { out.push(this.key(cur)); cur = cur.map(([x, y]) => [-y, x]); } cur = cells.map(([x, y]) => [-x, y]); } return out; },
    /* the same shape when one can be turned / flipped onto the other */
    same(a, b) { if (a.length !== b.length) return false; const k = this.key(b); return this.forms(a).includes(k); },
    /* one piece (every cell reached from the first through edges) */
    joined(cells) { const set = new Set(cells.map(c => c.join(':'))), seen = new Set(), q = [cells[0]]; seen.add(cells[0].join(':')); while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ':' + (y + dy); if (set.has(k) && !seen.has(k)) { seen.add(k); q.push([x + dx, y + dy]); } }); } return seen.size === cells.length; },
  },
  /* ---------------------------------------------------------------- grid paths (mazes, arrows): the shortest way from a
     to b through cells where pass(from, to) is true; null when there is none. Cells are [col, row]. */
  bfs(cols, rows, a, b, pass) {
    const key = c => c[0] + ':' + c[1], prev = new Map([[key(a), null]]), q = [a];
    while (q.length) {
      const c = q.shift(); if (c[0] === b[0] && c[1] === b[1]) { const path = []; for (let k = key(c), p = c; p; p = prev.get(key(p))) path.unshift(p); return path; }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const n = [c[0] + dx, c[1] + dy]; if (n[0] < 0 || n[1] < 0 || n[0] >= cols || n[1] >= rows || prev.has(key(n)) || (pass && !pass(c, n))) return; prev.set(key(n), c); q.push(n); });
    }
    return null;
  },
};
/* ================================================================ ① 佩奇·积木屋 (peppa5, from level 1): P5 捉迷藏 · P6 小剧场 ·
   P7 钉板 · P8 动物园记位置 (reasoning). docs/W5-DESIGN.md §5 ①. Everything inside one function: no top-level names (all the
   islands share one script); each rule is W5R.<id>, registered (background, friends, icon, review card) in games.js.
   P8 was written first (package 0) as the template of a world-5 rule - copy its parts: gen / audit / geo / present / place /
   onGesture / next / feedback / explain / reveal / rightEls / lines. */
(() => {
  const INK = '#2B2118';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine) */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));

  /* ---------------------------------------------------------------- P8 记！ 动物园记位置 (F3 Zoo Locations: where, not who)
     A little block zoo: a grid of pens, all with the same wooden door. "看好，记住！" - the animals stand in their pens for a few
     seconds - every door closes at once - "小兔住在哪里？" - tap a door.
       L1 one row of 5 pens, 2 animals, 3 s · L2 2 x 3, 3 animals, 3 s · L3 3 x 3, 4 animals, 4 s
       L4 3 x 3, 4 animals, 4 s, 一题两问: one animal, then another, both right · L5 3 x 4, 5 animals, 5 s, 一题两问: a door glows
       "这里住着谁？" (5 animal cards), then "小鸭住在哪里？" (a door).
     The right door's place comes from a bag over all the pens (so does the right card's place among the five). A random tap
     is right 1 time in 5 (L1) to 1 in 81 / 60 (L4 / L5). Wrong: every door opens, his door ringed blue ("这里住着小鸭" /
     "这里是空的"), the right door gold ("小兔在这里！"). */
  const ZOO = ['bunny', 'duck', 'kitten', 'chick', 'sheep', 'seal', 'turtle', 'ladybug'];
  const ZN = { bunny: '小兔', duck: '小鸭', kitten: '小猫', chick: '小鸡', sheep: '小羊', seal: '海豹', turtle: '乌龟', ladybug: '瓢虫' };
  /* per level: rows x cols of pens, animals, seconds to look */
  const P8L = [null, { r: 1, c: 5, n: 2, t: 3000 }, { r: 2, c: 3, n: 3, t: 3000 }, { r: 3, c: 3, n: 4, t: 4000 }, { r: 3, c: 3, n: 4, t: 4000, two: 1 }, { r: 3, c: 4, n: 5, t: 5000, two: 2 }];
  /* a pen: grass, a fence at the back, the animal, a wooden door in front (closed: the same door everywhere) */
  const PEN = '<svg viewBox="0 0 100 90" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;left:0;top:0;pointer-events:none"><rect x="3" y="3" width="94" height="84" rx="10" fill="#BFE7A2" stroke="' + INK + '" stroke-width="4"/><path d="M8 26H92M8 44H92" stroke="#B97A3C" stroke-width="5"/><path d="M14 10V48M32 10V48M50 10V48M68 10V48M86 10V48" stroke="#B97A3C" stroke-width="6" stroke-linecap="round"/></svg>';
  const DOOR = '<svg viewBox="0 0 100 90" width="100%" height="100%" preserveAspectRatio="none" style="pointer-events:none"><rect x="3" y="3" width="94" height="84" rx="10" fill="#E2A15B" stroke="' + INK + '" stroke-width="4"/><path d="M27 6V84M50 6V84M73 6V84" stroke="#B97A3C" stroke-width="4"/><path d="M8 22L92 68" stroke="#B97A3C" stroke-width="7" stroke-linecap="round"/><circle cx="84" cy="47" r="5" fill="#FFC93C" stroke="' + INK + '" stroke-width="3"/></svg>';
  W5R.P8 = {
    kind0: 'zoo5', verb: '记！', intro: '记住谁住哪里！', praise: ['记得真牢！'], props: ZOO.slice(),
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, L = P8L[d], N = L.r * L.c;
      const animals = rng.shuffle(ZOO).slice(0, L.n), pens = Array(N).fill(null);
      /* the asked one's pen from a bag over all the pens; the second asked (L4 / L5) from its own bag, never the same pen */
      const a = animals[0], pa = W5U.at(G, N, 'p8a' + d);
      pens[pa] = a;
      let b = null, pb = -1;
      if (L.two) { b = animals[1]; for (let t = 0; t < 2 * N && (pb < 0 || pb === pa); t++) pb = W5U.at(G, N, 'p8b' + d); if (pb === pa) pb = (pa + 1 + rng.int(0, N - 2)) % N; pens[pb] = b; }
      const free = rng.shuffle(pens.map((x, i) => (x ? -1 : i)).filter(i => i >= 0));
      animals.slice(L.two ? 2 : 1).forEach((x, k) => { pens[free[k]] = x; });
      const q = { d, rows: L.r, cols: L.c, pens, look: L.t, opts: pens.map((_, i) => i) };
      if (!L.two) return Object.assign(q, { k: [d, pens.map(x => x ? x[0] + x[1] : '-').join(''), a], ask: a, answer: pa });
      if (L.two === 1) return Object.assign(q, { k: [d, pens.map(x => x ? x[0] + x[1] : '-').join(''), a, b], asks: 2, ask: a, ask2: b, answer: pa + ',' + pb });
      /* L5: the door of a glows, "这里住着谁？" - the five animals of the zoo as cards (a's place from a bag); then b's door */
      const cards = W5U.deal(G, a, animals.filter(x => x !== a), 'p8c');
      return Object.assign(q, { k: [d, pens.map(x => x ? x[0] + x[1] : '-').join(''), a, b], asks: 2, glow: pa, cards, ask2: b, answer: a + ',' + pb });
    },
    /* the shape of the question for the tests (tests/test_w5.py): one entry per ask - how many options, where the right one
       is, how many are right (always 1) */
    audit(q) {
      const door = x => ({ n: q.pens.length, at: q.pens.indexOf(x), right: q.pens.filter(p => p === x).length });
      if (q.cards) return [{ n: q.cards.length, at: q.cards.indexOf(q.pens[q.glow]), right: q.cards.filter(c => c === q.pens[q.glow]).length }, door(q.ask2)];
      return q.asks === 2 ? [door(q.ask), door(q.ask2)] : [door(q.ask)];
    },
    /* the pens' box (logical px): landscape 1024 x 704 / portrait 704 x 1024, clear of the task card, the HUD and the two
       watchers in the bottom corners; every pen >= 88 */
    geo(q) {
      const L = K.L(), k = q.rows + 'x' + q.cols;
      const T = L ? { '1x5': [150, 150, 18, 340], '2x3': [168, 150, 18, 330], '3x3': [150, 128, 16, 330], '3x4': [130, 112, 14, 296] }
        : { '1x5': [124, 150, 10, 470], '2x3': [196, 180, 16, 500], '3x3': [190, 164, 16, 520], '3x4': [146, 128, 14, 440] };
      const [w, h, gap, cy] = T[k];
      return { w, h, gap, cy, cardCy: L ? 612 : 790 };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const q = st.q, g = this.geo(q);
      if (st.pens) W5U.lay(st.pens, Stage.W / 2, g.cy, g.w, g.h, g.gap, g.gap, q.cols);
      if (st.cards) { const r = W5U.row5(K.L()); W5U.lay(st.cards, Stage.W / 2, g.cardCy, r.s, r.s, r.gap); }
    },
    /* a pen with its animal; .door is its door (open: folded up, out of the way) */
    pen(st, x) {
      const e = W2X.thing(st, 10, 10, 6, ''); e.innerHTML = PEN;
      if (x) { const im = W5U.propImg(x); Object.assign(im.style, { position: 'absolute', left: '18%', top: '22%', width: '64%', height: '70%' }); e.appendChild(im); e._im = im; }
      const d = el('div', '', e); Object.assign(d.style, { position: 'absolute', inset: '0', transformOrigin: '50% 0%', transform: 'scaleY(.08)', pointerEvents: 'none' }); d.innerHTML = DOOR;
      e.door = d; return e;
    },
    doors(st, open, ms) { st.pens.forEach((e, i) => st.scope.anim(e.door, [{ transform: open ? 'scaleY(1)' : 'scaleY(.08)' }, { transform: open ? 'scaleY(.08)' : 'scaleY(1)' }], { duration: ms || 320, delay: open ? 0 : 20 * i, fill: 'forwards', easing: EASE.glide })); },
    /* the line for an ask: where does it live / who lives here */
    askLine(x) { return ZN[x] + '住在哪里？'; },
    ask(st, k) {
      const q = st.q;
      if (q.cards && k === 0) {
        /* L5, the first ask: a door glows, five animal cards */
        st.glowA = st.scope.anim(st.pens[q.glow], [{ boxShadow: '0 0 0 4px ' + INK + ', 0 0 0 12px rgba(255,201,60,.95)' }, { boxShadow: '0 0 0 4px ' + INK + ', 0 0 0 22px rgba(255,201,60,.35)' }], { duration: 700, iterations: Infinity, direction: 'alternate' });
        W5U.cards(st, q.cards.map(x => W5U.propImg(x, null, null, 78)), q.cards);
        this.place(st); st.cards.forEach((c, i) => K.pop(st, c, 60 * i));
        W5U.pips(st, K.task(st, [[{ node: this.doorIc() }], ['q']]), 0);
        K.say(st, '这里住着谁？');
        return;
      }
      if (q.cards) { (st.cards || []).forEach(c => { c.style.opacity = '.45'; c.style.pointerEvents = 'none'; }); st.pens[q.glow].getAnimations().forEach(a => a.cancel()); }
      const x = k === 0 ? q.ask : q.ask2;
      $$('.task', Stage.el).forEach(t => t.remove());
      const t = K.task(st, [[W5U.prop(x)], ['q']]); if (q.asks === 2) W5U.pips(st, t, k);
      K.say(st, this.askLine(x));
    },
    doorIc() { const s = el('span', ''); s.innerHTML = DOOR.replace('width="100%" height="100%" preserveAspectRatio="none"', 'width="54" height="48"'); return s; },
    async present(st) {
      const q = st.q, my = st;
      st.pens = q.pens.map(x => this.pen(st, x));
      this.place(st);
      st.pens.forEach((e, i) => K.pop(st, e, 40 * i));
      K.say(st, '看好，记住！');
      await st.scope.wait(T(q.look));
      if (!Session.alive(my)) return;
      this.doors(st, false); Sfx.whoosh(0.25);
      await st.scope.wait(T(420));
      if (!Session.alive(my)) return;
      st.pens.forEach((e, i) => K.reg(st, 'door' + i, e, {}));            /* the doors are the answers - only now */
      if (q.asks === 2) { W5U.twoStart(st, 2); this.ask(st, 0); } else { K.task(st, [[W5U.prop(q.ask)], ['q']]); K.say(st, this.askLine(q.ask)); }
    },
    /* a small numbered badge on the door chosen for the first of two asks (gone in the explain step) */
    mark(st, e, n) { const b = el('div', 'p8mark', e); b.textContent = n; Object.assign(b.style, { position: 'absolute', right: '6px', top: '6px', width: '34px', height: '34px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 3px ' + INK, font: '900 22px/34px system-ui,sans-serif', textAlign: 'center', color: INK, pointerEvents: 'none' }); K.pop(st, b); },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const q = st.q, door = /^door\d+$/.test(p.id) ? Number(p.id.slice(4)) : -1, ci = K.cardIndex(p.id);
      if (q.asks !== 2) { if (door < 0) return false; st.picked = true; Session.submit(st, door); return 'ok'; }
      const k = st.fill.indexOf(null);
      if (q.cards && k === 0) { if (ci < 0) return false; K.pop(st, st.cards[ci]); return W5U.twoPut(st, q.cards[ci], n => this.ask(st, n)); }
      if (door < 0) return false;
      if (!q.cards && k === 0) this.mark(st, st.pens[door], 1);
      K.pop(st, st.pens[door]);
      return W5U.twoPut(st, String(door), n => this.ask(st, n));
    },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.pens || !st.map || !st.map.door0) return null;
      const N = q.pens.length;
      if (q.asks !== 2) return { g: 'tap', p: { id: 'door' + (strat === 'wrong' ? (q.answer + 1 + (st.gen % (N - 1))) % N : q.answer) } };
      const k = st.fill.indexOf(null); if (k < 0) return null;
      const want = String(q.answer).split(',')[k];
      if (q.cards && k === 0) { if (!st.cards) return null; const i = strat === 'wrong' ? q.cards.findIndex(c => c !== want) : q.cards.indexOf(want); return { g: 'tap', p: { id: 'card' + i } }; }
      const w = Number(want), dd = strat === 'wrong' && k === 0 ? (w + 1) % N : w;
      return { g: 'tap', p: { id: 'door' + dd } };
    },
    /* which asks he got wrong (0 / 1), and for each what he chose */
    bad(st, ans) { return st.q.asks === 2 ? W5U.twoBad(st, ans) : (ans === st.q.answer ? [] : [0]); },
    chosen(st, ans, k) { const v = st.q.asks === 2 ? String(ans).split(',')[k] : ans; return (st.q.cards && k === 0) ? { card: W5U.cardOf(st, v), who: v } : { door: st.pens[Number(v)], who: st.q.pens[Number(v)] }; },
    rightOf(st, k) { const q = st.q; if (q.cards && k === 0) return W5U.cardOf(st, q.pens[q.glow]); const x = k === 0 ? q.ask : q.ask2; return st.pens[q.pens.indexOf(x)]; },
    /* what his choice is: "这里住着小鸭" / "这里是空的" / (a card) "小鸭不住这里" */
    wrongLine(c) { return c.card ? ZN[c.who] + '不住这里' : c.who ? '这里住着' + ZN[c.who] : '这里是空的'; },
    rightLine(st, k) { const q = st.q; return q.cards && k === 0 ? '这里住着' + ZN[q.pens[q.glow]] : ZN[k === 0 ? q.ask : q.ask2] + '在这里！'; },
    async feedback(st, ans) {
      const k = this.bad(st, ans)[0] || 0, c = this.chosen(st, ans, k);
      if (c.door || c.card) K.wiggle(st, c.door || c.card);
      W5U.say(st, this.wrongLine(c));
      await st.scope.wait(T(600));
    },
    /* 1. every door opens; what he chose ringed blue + what it is; 2. the right door (card) gold + where it lives */
    async explain(st, ans) {
      const my = st, bad = this.bad(st, ans);
      $$('.p8mark', Stage.el).forEach(m => m.remove());
      this.doors(st, true); Sfx.reveal();
      await st.scope.wait(T(360)); if (!Session.alive(my)) return;
      const cs = bad.map(k => this.chosen(st, ans, k));
      const rings = W5U.blue(st, cs.map(c => c.door || c.card));
      await fbDone(st); if (!Session.alive(my)) return;          /* the feedback line ("这里住着小鸭") ends - not said twice */
      await st.scope.wait(T(400)); if (!Session.alive(my)) return;
      W5U.hide(rings);
      bad.forEach(k => { const e = this.rightOf(st, k); W5U.gold(st, e); K.hop(st, e, 14); });
      await W5U.sum(st, this.rightLine(st, bad[0]));
      await st.scope.wait(700);
    },
    rightEls(st, ans) { return this.bad(st, ans).map(k => this.rightOf(st, k)); },
    /* right: every door opens, the right door(s) gold */
    async reveal(st) {
      const q = st.q, my = st, ks = q.asks === 2 ? [0, 1] : [0];
      $$('.p8mark', Stage.el).forEach(m => m.remove());
      this.doors(st, true); Sfx.reveal();
      await st.scope.wait(T(320)); if (!Session.alive(my)) return;
      ks.forEach(k => { const e = this.rightOf(st, k); W5U.gold(st, e); K.hop(st, e, 14); });
      this.cheerAll(st);
      st.summary = this.rightLine(st, ks[ks.length - 1]);
      W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.pens || []; },
    snap(st) { return { pens: st.q.pens.slice(), fill: (st.fill || []).slice() }; },
    lines() {
      const out = [this.intro, '看好，记住！', '这里住着谁？', '这里是空的'].concat(this.praise);
      ZOO.forEach(x => out.push(this.askLine(x), '这里住着' + ZN[x], ZN[x] + '不住这里', ZN[x] + '在这里！'));
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- shared by P5-P7: a scene laid out in its own units
     (parts: { e, x, y, w, h }) and fitted into the free box of the stage (clear of the task card, the top bar and the two
     watchers in the bottom corners) - landscape 1024 x 704 / portrait 704 x 1024 */
  const FREE = L => (L ? { x: 160, y: 112, w: 704, h: 574 } : { x: 16, y: 216, w: 672, h: 648 });
  const fit = (bb, A, cap, vb) => { const s = Math.min(cap || 1.25, A.w / (bb.x1 - bb.x0), A.h / (bb.y1 - bb.y0)); return { s, ox: A.x + (A.w - (bb.x1 - bb.x0) * s) / 2 - bb.x0 * s, oy: A.y + (A.h - (bb.y1 - bb.y0) * s) * (vb == null ? 0.5 : vb) - bb.y0 * s }; };
  const putParts = (parts, f) => parts.forEach(p => place(p.e, Math.round(f.ox + p.x * f.s), Math.round(f.oy + p.y * f.s), Math.round(p.w * f.s), Math.round(p.h * f.s)));
  /* a drawing (svg markup, stretched to its box) as a part of the scene */
  const svgPart = (st, z, inner, vw, vh) => { const e = W2X.thing(st, 10, 10, z, ''); e.innerHTML = '<svg viewBox="0 0 ' + vw + ' ' + vh + '" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none">' + inner + '</svg>'; return e; };
  const imgPart = (st, z, k, bottom) => { const e = W2X.thing(st, 10, 10, z, ''); const im = W5U.propImg(k); if (bottom) im.style.objectPosition = '50% 100%'; e.appendChild(im); return e; };
  /* an invisible tap target over a thing (its whole body, also where it is hidden), above everything of the scene */
  const tapPart = (st, id) => { const e = W2X.thing(st, 10, 10, 30, ''); K.reg(st, id, e, {}); return e; };
  const S4 = 'stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"';
  /* a pause inside one step of the explanation (Scope.wait would end the step-by-step beat there); a tap skips it */
  const pause = (st, ms) => (st.ff || fast() ? Promise.resolve() : new Promise(r => st.scope.timeout(r, ms)));

  /* ---------------------------------------------------------------- P5 藏！ 捉迷藏 (F13 Field Trip; the test's question 3: in
     front / behind, said the other way round). George hid five toys in his block playroom: "谁在桌子后面？" - tap a toy.
       L1 one table, five toys on / under / in front / behind / beside it (asked: on / under / in front / behind, from a bag)
       L2 a table and the toy box, five toys at five (place, word) pairs, the asked word (+ 里面) also at the other place
       L3 toys around toys: "谁在小熊后面？" - toys hide behind, stand on and in front of 小熊 and 恐龙 (the same word at the other)
       L4 the other way round: "小鸭藏在什么后面？" - tap one of five places (table, toy box, big block, bush, slide)
       L5 two conditions: "在桌子下面，" "谁也在小熊后面？" - one toy is both, every other toy only one of the two
     Drawn as it looks: behind = the lower half hidden by the thing, feet higher; in front = feet lower, over the thing; on =
     standing on it; under = on the floor between the table's legs; in = the head out of the box. Every toy's tap target is an
     invisible box over its whole body (also the hidden part), above the scene. The asked word comes from a bag; the right
     toy's place (left to right) from a bag where the layout allows it (L1-L4); L5's right toy is always the one beside 小熊
     (that is the question), so which of the five toys it is comes from the bag. Wrong: his toy ringed blue, where it really
     is ("它在桌子前面"); the demonstration (behind: the thing turns see-through - "看，它被桌子挡住了"; in front: the toy
     steps forward - "看，它挡住了桌子"); the right toy ringed gold ("它在桌子后面"). */
  const TOY5 = ['dino', 'teddy', 'bunny', 'duck', 'chick', 'kitten', 'turtle'];
  const TN = { dino: '恐龙', teddy: '小熊', bunny: '小兔', duck: '小鸭', chick: '小鸡', kitten: '小猫', turtle: '乌龟' };
  const LMN = { table: '桌子', box: '箱子', block: '积木', bush: '灌木', slide: '滑梯', teddy: '小熊', dino: '恐龙' };
  const RW = { on: '上面', under: '下面', front: '前面', behind: '后面', in: '里面', beside: '旁边' };
  const LSZ = { table: [300, 230], box: [200, 150], block: [150, 150], bush: [170, 155], slide: [220, 170], teddy: [120, 130], dino: [120, 130] };
  const LREL = { table: ['on', 'under', 'front', 'behind', 'beside'], box: ['in', 'front', 'behind', 'beside'], block: ['on', 'front', 'behind', 'beside'], bush: ['front', 'behind', 'beside'], slide: ['on', 'front', 'behind', 'beside'], teddy: ['on', 'front', 'behind', 'beside'], dino: ['on', 'front', 'behind', 'beside'] };
  /* the layer of a toy by where it is: behind < (the box's inside) < in < the thing < under (between the legs, the front legs
     over it) < on / beside < in front */
  const ZREL = { behind: 4, in: 6, under: 6, on: 9, beside: 9, front: 10 };
  const studs = (w, y, n) => Array.from({ length: n }, (_, i) => '<ellipse cx="' + Math.round(w * (i + 1) / (n + 1)) + '" cy="' + (y + 3) + '" rx="13" ry="6" fill="#C98B4A"/><ellipse cx="' + Math.round(w * (i + 1) / (n + 1)) + '" cy="' + y + '" rx="13" ry="6" fill="#FFE2B0" stroke="#B97A3C" stroke-width="2.5"/>').join('');
  const LMSVG = {
    tableBack: w => '<rect x="38" y="62" width="16" height="132" rx="4" fill="#9A6433" ' + S4 + '/><rect x="' + (w - 54) + '" y="62" width="16" height="132" rx="4" fill="#9A6433" ' + S4 + '/>',
    table: w => '<polygon points="18,2 ' + (w - 18) + ',2 ' + (w - 2) + ',66 2,66" fill="#F2C27E" ' + S4 + '/>' + studs(w, 34, Math.max(3, Math.round(w / 80))) + '<rect x="2" y="66" width="' + (w - 4) + '" height="24" rx="4" fill="#D9954E" ' + S4 + '/><rect x="8" y="90" width="24" height="138" rx="5" fill="#C27C3C" ' + S4 + '/><rect x="' + (w - 32) + '" y="90" width="24" height="138" rx="5" fill="#C27C3C" ' + S4 + '/>',
    boxBack: '<polygon points="16,2 184,2 198,32 2,32" fill="#6B4026" ' + S4 + '/><path d="M20 8H180" stroke="#8C5A36" stroke-width="5"/>',
    box: '<rect x="2" y="30" width="196" height="118" rx="8" fill="#FF6B5B" ' + S4 + '/><path d="M100 30V148" stroke="' + INK + '" stroke-width="3"/><circle cx="50" cy="88" r="15" fill="#FFC93C" ' + S4 + '/><circle cx="150" cy="88" r="15" fill="#FFC93C" ' + S4 + '/>',
    slide: '<polygon points="2,40 70,40 218,166 218,168 2,168" fill="#4FB3FF" ' + S4 + '/><path d="M70 40L218 166" stroke="#FFC93C" stroke-width="12" stroke-linecap="round"/><rect x="0" y="28" width="74" height="14" rx="5" fill="#5CC46E" ' + S4 + '/><path d="M12 42V168M58 42V168" stroke="' + INK + '" stroke-width="5"/><path d="M12 70H58M12 100H58M12 130H58M12 158H58" stroke="#FFF" stroke-width="6"/><path d="M12 70H58M12 100H58M12 130H58M12 158H58" stroke="' + INK + '" stroke-width="2"/>',
  };
  /* small pictures for the task card */
  const ICON5 = {
    table: '<polygon points="20,30 80,30 90,48 10,48" fill="#F2C27E" ' + S4 + '/><rect x="14" y="48" width="9" height="40" fill="#C27C3C" ' + S4 + '/><rect x="77" y="48" width="9" height="40" fill="#C27C3C" ' + S4 + '/>',
    box: '<polygon points="22,30 78,30 84,42 16,42" fill="#6B4026" ' + S4 + '/><rect x="16" y="42" width="68" height="44" rx="5" fill="#FF6B5B" ' + S4 + '/>',
    slide: '<polygon points="10,36 34,36 88,86 10,86" fill="#4FB3FF" ' + S4 + '/><path d="M34 36L88 86" stroke="#FFC93C" stroke-width="7"/>',
    on: '<rect x="26" y="52" width="48" height="38" rx="5" fill="#4FB3FF" ' + S4 + '/><circle cx="50" cy="34" r="15" fill="#FFC93C" ' + S4 + '/>',
    under: '<rect x="12" y="24" width="76" height="12" rx="4" fill="#F2C27E" ' + S4 + '/><path d="M20 36V88M80 36V88" ' + S4 + '/><circle cx="50" cy="72" r="15" fill="#FFC93C" ' + S4 + '/>',
    front: '<rect x="30" y="20" width="50" height="50" rx="5" fill="#4FB3FF" ' + S4 + '/><circle cx="38" cy="70" r="19" fill="#FFC93C" ' + S4 + '/>',
    behind: '<circle cx="58" cy="32" r="17" fill="#FFC93C" ' + S4 + '/><rect x="22" y="40" width="50" height="50" rx="5" fill="#4FB3FF" ' + S4 + '/>',
    in: '<polygon points="24,44 76,44 82,54 18,54" fill="#6B4026" ' + S4 + '/><circle cx="50" cy="44" r="15" fill="#FFC93C" ' + S4 + '/><rect x="18" y="54" width="64" height="36" rx="5" fill="#4FB3FF" ' + S4 + '/>',
    beside: '<rect x="14" y="40" width="46" height="48" rx="5" fill="#4FB3FF" ' + S4 + '/><circle cx="80" cy="72" r="15" fill="#FFC93C" ' + S4 + '/>',
  };
  const lmIcon = k => (ICON5[k] ? W3X.ic(ICON5[k], 54) : W5U.prop(k));
  W5R.P5 = {
    kind0: 'hide5', verb: '藏！', intro: '乔治藏玩具！', praise: ['找得真准！'], props: TOY5.concat(['bush', 'block']),
    /* where a toy stands for (thing, word, side): its centre x and its feet, in scene units */
    slot(L, rel, side) {
      const x = L.x, b = L.base, w = L.w, h = L.h, k = L.k, R = side === 'R';
      if (rel === 'beside') return { cx: R ? x + w + 62 : x - 62, feet: b };
      if (k === 'teddy' || k === 'dino') {
        if (rel === 'on') return { cx: x + w / 2, feet: b - h + 4 };
        if (rel === 'behind') return { cx: R ? x + w - 18 : x + 18, feet: b - 64 };
        if (rel === 'front') return { cx: R ? x + w - 6 : x + 6, feet: b + 40 };
      }
      if (rel === 'front') return { cx: R ? x + w - 22 : x + 22, feet: b + 44 };
      if (k === 'table') {
        if (rel === 'on') return { cx: R ? x + w - 85 : x + 85, feet: b - 168 };
        if (rel === 'behind') return { cx: R ? x + w - 85 : x + 85, feet: b - 184 };
        if (rel === 'under') return { cx: L.ux != null ? L.ux : x + w / 2, feet: b - 4 };
      }
      if (k === 'box') { if (rel === 'in') return { cx: x + w / 2, feet: b - 70 }; if (rel === 'behind') return { cx: x + w / 2, feet: b - 100 }; }
      if (k === 'block') { if (rel === 'on') return { cx: x + w / 2, feet: b - 112 }; if (rel === 'behind') return { cx: x + w / 2, feet: b - 98 }; }
      if (k === 'bush') { if (rel === 'behind') return { cx: x + w / 2, feet: b - 96 }; }
      if (k === 'slide') { if (rel === 'on') return { cx: x + 36, feet: b - 136 }; if (rel === 'behind') return { cx: x + 64, feet: b - 92 }; }
      return null;
    },
    lm(k, x, base, row) { return { k, x, base, w: LSZ[k][0], h: LSZ[k][1], row: row || 0 }; },
    /* a toy at (thing i, word, side): its facts = every (thing, word) it is */
    toy(q, t, i, rel, side) { const L = q.lms[i], p = this.slot(L, rel, side); if (t === 'turtle' && (rel === 'behind' || rel === 'in')) return null; return p && Object.assign({ t, lm: i, rel, side, facts: [[i, rel]], row: L.row || 0 }, p); },
    /* L1: one table, the five words */
    lay1(rng, ask) {
      const q = { lms: [this.lm('table', 0, 0)] }, fs = rng.chance(0.5) ? 'L' : 'R', os = rng.chance(0.5) ? 'L' : 'R', T = rng.shuffle(TOY5);
      q.lms[0].ux = 150 + rng.int(-55, 55);
      q.toys = [['on', os], ['behind', os === 'L' ? 'R' : 'L'], ['under', 'C'], ['front', fs], ['beside', fs === 'L' ? 'R' : 'L']].map(([r, s], i) => this.toy(q, T[i], 0, r, s));
      q.ask = [[0, ask]];
      return q;
    },
    /* L2: the table and the toy box; the right pair, the same word at the other thing (when it has it), three more pairs */
    lay2(rng, ask) {
      const tl = rng.chance(0.5), q = { lms: [this.lm('table', tl ? 0 : 260, 0), this.lm('box', tl ? 360 : 0, 0)] }, T = rng.shuffle(TOY5);
      q.lms[0].ux = q.lms[0].x + 150 + rng.int(-45, 45);
      const os = rng.chance(0.5) ? 'L' : 'R', side = () => (rng.chance(0.5) ? 'L' : 'R');
      const all = [[0, 'on', os], [0, 'behind', os === 'L' ? 'R' : 'L'], [0, 'under', 'C'], [0, 'front', side()], [0, 'beside', tl ? 'L' : 'R'], [1, 'in', 'C'], [1, 'behind', 'C'], [1, 'front', side()], [1, 'beside', tl ? 'R' : 'L']];
      const at = ask === 'in' ? 1 : (ask === 'front' || ask === 'behind') ? rng.int(0, 1) : 0;
      const pick = [all.find(c => c[0] === at && c[1] === ask)], other = all.find(c => c[0] !== at && c[1] === ask);
      if (other) pick.push(other);
      const ok = c => !pick.includes(c) && !(c[0] === 1 && (c[1] === 'in' || c[1] === 'behind') && pick.some(p => p[0] === 1 && (p[1] === 'in' || p[1] === 'behind'))) && !(c[1] === 'beside' && pick.some(p => p[1] === 'beside'));
      for (const c of rng.shuffle(all)) { if (pick.length >= 5) break; if (ok(c)) pick.push(c); }
      if (pick.length < 5) return null;
      q.toys = pick.map((c, i) => this.toy(q, T[i], c[0], c[1], c[2]));
      q.ask = [[at, ask]];
      return q;
    },
    /* L3: 小熊 and 恐龙 (not options), five toys around them: the asked word at one of them and at the other, three more */
    lay3(rng, ask) {
      const refs = rng.shuffle(['teddy', 'dino']), q = { lms: [this.lm(refs[0], 0, 0), this.lm(refs[1], 330, 0)] }, T = rng.shuffle(TOY5.filter(t => !refs.includes(t)));
      const all = [];
      [0, 1].forEach(r => { const bs = rng.chance(0.5) ? 'L' : 'R'; all.push([r, 'on', 'C'], [r, 'behind', bs], [r, 'front', bs === 'L' ? 'R' : 'L'], [r, 'beside', r ? 'R' : 'L']); });
      const at = rng.int(0, 1), pick = [all.find(c => c[0] === at && c[1] === ask), all.find(c => c[0] !== at && c[1] === ask)];
      for (const c of rng.shuffle(all)) { if (pick.length >= 5) break; if (!pick.includes(c)) pick.push(c); }
      q.toys = pick.map((c, i) => this.toy(q, T[i], c[0], c[1], c[2]));
      q.ask = [[at, ask]];
      return q;
    },
    /* L4: five things in two rows; the asked toy at the right thing, two more toys somewhere (not options) */
    lay4(rng, ask) {
      const ks = rng.shuffle(['table', 'box', 'block', 'bush', 'slide']), rows = [ks.slice(0, 2), ks.slice(2)];
      const q = { lms: [] }, T = rng.shuffle(TOY5);
      rows.forEach((row, r) => { let x = 0; row.forEach(k => { const L = this.lm(k, x, r * 270, r); q.lms.push(L); x += L.w + 56; }); const sh = -(x - 56) / 2; q.lms.filter(L => L.row === r).forEach(L => { L.x += sh; }); });
      q.lms.forEach(L => { if (L.k === 'table') L.ux = L.x + 150; });
      const hosts = q.lms.map((L, i) => i).filter(i => LREL[q.lms[i].k].includes(ask));
      const at = rng.pick(hosts), side = () => (rng.chance(0.5) ? 'L' : 'R');
      q.toys = [this.toy(q, T[0], at, ask, ask === 'beside' ? side() : side())];
      const used = [[at, ask]];
      for (let t = 0, k = 1; t < 30 && k < 3; t++) {
        const i = rng.int(0, 4), rel = rng.pick(LREL[q.lms[i].k].filter(r => r !== 'beside'));
        if (used.some(u => u[0] === i && (u[1] === rel || (q.lms[i].k === 'box' && ['in', 'behind'].includes(u[1]) && ['in', 'behind'].includes(rel)) || (q.lms[i].k === 'table' && ['on', 'behind'].includes(u[1]) && ['on', 'behind'].includes(rel))))) continue;
        used.push([i, rel]); q.toys.push(this.toy(q, T[k++], i, rel, side()));
      }
      q.ask = [[at, ask]]; q.who = 0;
      return q;
    },
    /* L5: a long table, 小熊 (or 恐龙) in front of one of its corners; the right toy under the table behind 小熊, one toy
       behind 小熊 outside the table, three under the table further along */
    lay5(rng) {
      const ref = rng.pick(['teddy', 'dino']), m = rng.chance(0.5), W = 460;
      const q = { lms: [this.lm('table', 0, 0)], ref }, T0 = rng.shuffle(TOY5.filter(t => t !== ref)), T = T0.filter(t => t !== 'turtle').slice(0, 2).concat(T0.filter(t => t === 'turtle'), T0.filter(t => t !== 'turtle').slice(2));
      q.lms[0].w = W;
      const X = u => (m ? W - u : u);
      q.refAt = { cx: X(0), feet: 40 };
      const mk = (t, cx, feet, facts, z) => ({ t, cx: X(cx), feet, facts, z, rel: facts.length ? facts[0][1] : 'beside', lm: 0, row: 0 });
      q.toys = [mk(T[0], 72, -4, [[0, 'under'], [1, 'behind']], 5), mk(T[1], -72, -30, [[1, 'behind']], 5),
        mk(T[2], 186, -4, [[0, 'under']], 6), mk(T[3], 294, -4, [[0, 'under']], 6), mk(T[4], 400, -4, [[0, 'under']], 6)];
      q.ask = [[0, 'under'], [1, 'behind']];
      return q;
    },
    /* the toys' boxes (100 x 100 units, the feet at the bottom) / the things' boxes */
    tbox(T) { return { x: T.cx - 50, y: T.feet - 100, w: 100, h: 100 }; },
    lbox(L) { return { x: L.x, y: L.base - L.h, w: L.w, h: L.h }; },
    /* no option's centre inside another option's box */
    clear(bs) { const inside = (p, b) => p.x > b.x + 4 && p.x < b.x + b.w - 4 && p.y > b.y + 4 && p.y < b.y + b.h - 4; return bs.every((a, i) => bs.every((b, j) => i === j || !inside({ x: a.x + a.w / 2, y: a.y + a.h / 2 }, b))); },
    sat(q, T) { return q.ask.every(a => T.facts.some(f => f[0] === a[0] && f[1] === a[1])); },
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      const ask = d === 5 ? 'under' : bagPick(G, 'p5w' + d, d === 1 ? ['on', 'under', 'front', 'behind'] : d === 2 ? ['on', 'under', 'front', 'behind', 'in'] : d === 3 ? ['on', 'behind', 'front'] : ['behind', 'front', 'on', 'under', 'in']);
      const want = d < 5 ? W5U.at(G, 5, 'p5r' + d) : -1;
      let best = null;
      for (let t = 0; t < 60; t++) {
        const q = this['lay' + d](rng, ask);
        if (!q || q.toys.some(x => !x)) continue;
        const opt = d === 4 ? q.lms.map((L, i) => ({ id: 'l' + i, b: this.lbox(L) })) : q.toys.map((T, i) => ({ id: 't' + i, b: this.tbox(T) }));
        if (!this.clear(opt.map(x => x.b))) continue;
        const right = d === 4 ? 'l' + q.ask[0][0] : 't' + q.toys.findIndex(T => this.sat(q, T));
        if (d === 4 ? false : q.toys.filter(T => this.sat(q, T)).length !== 1) continue;
        q.opts = opt.slice().sort((a, b) => (a.b.x + a.b.w / 2) - (b.b.x + b.b.w / 2)).map(x => x.id);
        if (d === 5) { const ot = q.opts.filter(x => x !== right); q.opts = W5U.deal(G, right, ot, 'p5r5'); }
        q.answer = right;
        if (!best) best = q;
        if (d === 5 || q.opts.indexOf(right) === want) { best = q; break; }
      }
      const q = best;
      q.d = d; q.word = ask;
      /* the scene's box: everything that is drawn */
      const bs = q.lms.map(L => this.lbox(L)).concat(q.toys.map(T => this.tbox(T)));
      if (q.refAt) bs.push({ x: q.refAt.cx - 60, y: q.refAt.feet - 110, w: 120, h: 110 });
      q.bb = { x0: Math.min(...bs.map(b => b.x)) - 6, y0: Math.min(...bs.map(b => b.y)) - 6, x1: Math.max(...bs.map(b => b.x + b.w)) + 6, y1: Math.max(...bs.map(b => b.y + b.h)) + 6 };
      q.k = [d, ask, q.lms.map(L => L.k[0] + L.x).join(''), q.toys.map(T => T.t.slice(0, 2) + T.rel[0] + T.lm + Math.round(T.cx)).join('.')];
      return q;
    },
    audit(q) { return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.d === 4 ? 1 : q.opts.filter(id => this.sat(q, q.toys[+id.slice(1)])).length }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    /* the words: what the asked place is called */
    askLine(q) {
      const [i, r] = q.ask[0], L = q.lms[i];
      if (q.d === 4) return TN[q.toys[0].t] + '藏在什么' + RW[r] + '？';
      return '谁在' + LMN[L.k] + RW[r] + '？';
    },
    /* where a toy really is (one of its facts, the asked thing first) */
    whereLine(q, T) { const f = T.facts.find(x => x[0] === q.ask[0][0]) || T.facts[0]; const k = f[0] === 1 && q.ref ? q.ref : q.lms[f[0]].k; return '它在' + LMN[k] + RW[f[1]]; },
    /* what his choice is, said kindly: where it is / which condition it misses */
    wrongLine(q, id) {
      if (q.d === 4) { const L = q.lms[+id.slice(1)]; return '不在' + LMN[L.k] + RW[q.word] + '哦'; }
      const T = q.toys[+id.slice(1)];
      if (q.d === 5) return T.facts.some(f => f[0] === 0) ? '它不在' + LMN[q.ref] + '后面' : '它不在桌子下面';
      return this.whereLine(q, T);
    },
    rightLines(q) {
      if (q.d === 5) return ['也在桌子下面！'];
      if (q.d === 4) return ['在' + LMN[q.lms[q.ask[0][0]].k] + RW[q.word] + '！'];
      return [this.whereLine(q, q.toys[+q.answer.slice(1)])];
    },
    draw(st) {
      const q = st.q, parts = st.parts = [];
      const add = (e, b) => { parts.push(Object.assign({ e }, b)); return e; };
      st.lmEls = q.lms.map((L, i) => {
        const b = this.lbox(L), zr = (L.row || 0) * 10, out = [];
        if (L.k === 'table') { out.push(add(svgPart(st, 3 + zr, LMSVG.tableBack(L.w), L.w, 230), b)); out.push(add(svgPart(st, 7 + zr, LMSVG.table(L.w), L.w, 230), b)); }
        else if (L.k === 'box') { out.push(add(svgPart(st, 5 + zr, LMSVG.boxBack, 200, 150), b)); out.push(add(svgPart(st, 7 + zr, LMSVG.box, 200, 150), b)); }
        else if (L.k === 'slide') out.push(add(svgPart(st, 7 + zr, LMSVG.slide, 220, 170), b));
        else out.push(add(imgPart(st, 7 + zr, L.k, true), b));
        return out;
      });
      if (q.refAt) st.refEl = add(imgPart(st, 8, q.ref, true), { x: q.refAt.cx - 55, y: q.refAt.feet - 110, w: 110, h: 110 });
      st.toyEls = q.toys.map(T => add(imgPart(st, (T.z || ZREL[T.rel]) + (T.row || 0) * 10, T.t, true), this.tbox(T)));
      st.tapEls = {};
      if (q.d === 4) q.lms.forEach((L, i) => { st.tapEls['l' + i] = add(tapPart(st, 'l' + i), this.lbox(L)); });
      else q.opts.forEach(id => { st.tapEls[id] = add(tapPart(st, id), this.tbox(q.toys[+id.slice(1)])); });
    },
    place(st) { if (!st.parts) return; putParts(st.parts, fit(st.q.bb, FREE(K.L()), 1.25, K.L() ? 0.6 : 0.82)); },   /* standing on the floor: low in the free box */
    task(st) {
      const q = st.q;
      if (q.d === 5) return K.task(st, [[{ node: lmIcon('table').node }, { node: W3X.ic(ICON5.under, 48).node }], [W5U.prop(q.ref), { node: W3X.ic(ICON5.behind, 48).node }], ['q']]);
      if (q.d === 4) return K.task(st, [[W5U.prop(q.toys[0].t)], [{ node: W3X.ic(ICON5[q.word], 54).node }], ['q']]);
      const L = q.lms[q.ask[0][0]], ic = lmIcon(L.k);
      return K.task(st, [[ic.node ? { node: ic.node } : ic], [{ node: W3X.ic(ICON5[q.word], 54).node }], ['q']]);
    },
    async present(st) {
      const q = st.q;
      this.draw(st); this.place(st);
      st.lmEls.forEach((ls, i) => ls.forEach(e => K.pop(st, e, 50 * i)));
      if (st.refEl) K.pop(st, st.refEl, 80);
      st.toyEls.forEach((e, i) => K.pop(st, e, 160 + 60 * i));
      this.task(st);
      if (q.d === 5) W3X.say2(st, '在桌子下面，', '谁也在' + LMN[q.ref] + '后面？');
      else K.say(st, this.askLine(q));
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked || !st.tapEls || !st.tapEls[p.id]) return false;
      st.picked = true;
      const e = st.toyEls[+p.id.slice(1)];
      if (st.q.d !== 4 && e) K.hop(st, e, 12);
      Session.submit(st, p.id);
      return 'ok';
    },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.tapEls) return null;
      return { g: 'tap', p: { id: strat === 'wrong' ? q.opts.find(x => x !== q.answer) : q.answer } };
    },
    /* the picture of an option (the toy, or the thing in L4) */
    optEls(st, id) { return st.q.d === 4 ? st.lmEls[+id.slice(1)] : [st.toyEls[+id.slice(1)]]; },
    async feedback(st, ans) {
      K.wiggle(st, this.optEls(st, ans)[0]);
      W5U.say(st, this.wrongLine(st.q, ans));
      await st.scope.wait(T(600));
    },
    /* the demonstration of the asked word on the right toy: behind - the thing that hides it turns see-through; in front - it
       steps out over the thing; else it hops (and a step-by-step pause) */
    async demo(st) {
      const q = st.q, my = st, Rt = q.d === 4 ? q.toys[0] : q.toys[+q.answer.slice(1)], Re = q.d === 4 ? st.toyEls[0] : st.toyEls[+q.answer.slice(1)];
      const rel = q.d === 5 ? 'behind' : q.word, hider = q.d === 5 ? [st.refEl] : st.lmEls[q.d === 4 ? q.ask[0][0] : Rt.lm], name = q.d === 5 ? LMN[q.ref] : LMN[q.lms[q.d === 4 ? q.ask[0][0] : Rt.lm].k];
      if (rel === 'behind') {
        hider.forEach(e => st.scope.anim(e, [{ opacity: 1 }, { opacity: 0.28, offset: 0.2 }, { opacity: 0.28, offset: 0.8 }, { opacity: 1 }], { duration: 1500, easing: 'ease-in-out' }));
        W5U.note(st, '它被' + name + '挡住了');
        await st.scope.wait(1100);
      } else if (rel === 'front') {
        st.scope.anim(Re, [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(6%) scale(1.14)', offset: 0.3 }, { transform: 'translateY(6%) scale(1.14)', offset: 0.75 }, { transform: 'translateY(0) scale(1)' }], { duration: 1300, easing: 'ease-in-out' });
        W5U.note(st, '它挡住了' + name);
        await st.scope.wait(1100);
      } else {
        K.hop(st, Re, 18); hider.forEach(e => K.flash(st, [e]));
        await W5U.beat(st); if (!Session.alive(my)) return;
        await st.scope.wait(500);
      }
    },
    async explain(st, ans) {
      const q = st.q, my = st;
      const rings = W5U.blue(st, st.tapEls[ans]);
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      await this.demo(st); if (!Session.alive(my)) return;
      const R = st.tapEls[q.answer]; W5U.gold(st, R); K.hop(st, this.optEls(st, q.answer)[0], 14);
      for (const l of this.rightLines(q)) { await W5U.sum(st, l); if (!Session.alive(my)) return; }
      await st.scope.wait(200);
    },
    rightEls(st) { return [st.tapEls[st.q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st;
      Sfx.reveal();
      W5U.gold(st, st.tapEls[q.answer]); K.hop(st, this.optEls(st, q.answer)[0], 16);
      this.cheerAll(st);
      const ls = this.rightLines(q); st.summary = ls[ls.length - 1];
      for (const l of ls) { await W5U.sum(st, l); if (!Session.alive(my)) return; }
      await st.scope.wait(T(500));
    },
    workEls(st) { return st.toyEls || []; },
    snap(st) { return { word: st.q.word, toys: st.q.toys.map(T => T.t + ':' + T.rel) }; },
    lines() {
      const out = [this.intro].concat(this.praise), W4 = ['behind', 'front', 'on', 'under', 'in'];
      [['table', ['on', 'under', 'front', 'behind']], ['box', ['in', 'front', 'behind']], ['teddy', ['on', 'behind', 'front']], ['dino', ['on', 'behind', 'front']]].forEach(([k, rs]) => rs.forEach(r => out.push('谁在' + LMN[k] + RW[r] + '？')));
      ['table', 'box', 'teddy', 'dino'].forEach(k => LREL[k].forEach(r => out.push('它在' + LMN[k] + RW[r])));
      ['table', 'box', 'block', 'bush', 'slide'].forEach(k => W4.forEach(r => { out.push('不在' + LMN[k] + RW[r] + '哦'); if (LREL[k].includes(r)) out.push('在' + LMN[k] + RW[r] + '！'); }));
      Object.keys(LMN).forEach(k => out.push('它被' + LMN[k] + '挡住了', '它挡住了' + LMN[k]));
      TOY5.forEach(t => W4.forEach(r => { if (!(t === 'turtle' && (r === 'behind' || r === 'in'))) out.push(TN[t] + '藏在什么' + RW[r] + '？'); }));
      ['teddy', 'dino'].forEach(r => out.push('谁也在' + LMN[r] + '后面？', '它不在' + LMN[r] + '后面'));
      out.push('也在桌子下面！');
      out.push('在桌子下面，', '它不在桌子下面');
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- P6 演！ 小剧场 (F15 / S11 / S8 / S16: the meaning of + and −
     with things and actions, no symbols yet). Peppa tells a little story; the task card shows it as pictures (how many at
     first -> what happens -> how many); he acts it out on the block stage and rings the bell.
       come  "台上有两只小鸭。" "又来了一只！" - tap the door: one comes in each time (tap one that just came: it goes back)
       go    "走了一只！" - tap (or drag to the door) one on the stage: it walks out (tap the door: the last one comes back)
       join  "这边有两只，" "那边有三只，" "合起来！" - drag one mat onto the other (or tap one, then the other)
       take  "盘子里有五块。" "佩奇拿走两块！" - drag (or tap) cookies into Peppa's basket (tap the basket: one goes back)
     L1 1-3 on the stage, come / go 1-2, at most 5 · L2 + join and take, at most 6, 1-3 · L3 he puts them on the stage first
     ("先请三只小鸭上台！" - when they are there: "走了一只！"), at most 7 · L4 two changes ("台上有四只。" "来了两只，"
     "又走了一只！"), at most 8 · L5 the task card is a number sentence (4 + 2, 5 − 3, dots under the numbers): "照着算式演！"
     - first the first number, then the change, at most 9 (reading a number sentence back as a story).
     Right = the stage ends as the story AND the actions are the story's (came / went counted; nothing else done); a
     construction, a random play is almost never right. Wrong: what he moved ringed blue ("来了三只哦" / "这是走了哦"); the
     stage back to the start (the group framed), the change once more by §3.3 - came: through the door with a sparkle, counted
     on ("三……四、五"); went: out of the door, a grey dashed outline where it stood, counted down; together: a brace - then the
     result ringed gold: "现在有五只" / "走了两只，" "还剩三只！". */
  const ACT = ['duck', 'chick', 'bunny'];
  const AN = { duck: '小鸭', chick: '小鸡', bunny: '小兔' };
  const DOOR6 = '<rect x="4" y="4" width="112" height="192" rx="10" fill="#FFC93C" ' + S4 + '/><rect x="4" y="4" width="112" height="34" rx="8" fill="#FF6B5B" ' + S4 + '/><circle cx="34" cy="21" r="7" fill="#FF9F43" ' + S4 + '/><circle cx="86" cy="21" r="7" fill="#FF9F43" ' + S4 + '/><path d="M24 196V82Q24 52 60 52Q96 52 96 82V196Z" fill="#5A3A22" ' + S4 + '/><path d="M4 120H24M96 120H116M4 160H24M96 160H116" stroke="' + INK + '" stroke-width="3"/>';
  const IC6 = {
    come: '<rect x="6" y="14" width="40" height="76" rx="6" fill="#FFC93C" ' + S4 + '/><path d="M14 90V44Q14 30 26 30Q38 30 38 44V90Z" fill="#5A3A22"/><path d="M50 52H88M76 40L90 52L76 64" fill="none" stroke="#5CC46E" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 18L73 26L81 27L75 32L77 40L70 36L63 40L65 32L59 27L67 26Z" fill="#FFF3A8" stroke="' + INK + '" stroke-width="2"/>',
    go: '<rect x="54" y="14" width="40" height="76" rx="6" fill="#FFC93C" ' + S4 + '/><path d="M62 90V44Q62 30 74 30Q86 30 86 44V90Z" fill="#5A3A22"/><path d="M48 52H10" stroke="#9AA3AD" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 12"/><path d="M60 52H22M34 40L20 52L34 64" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
    join: '<rect x="6" y="66" width="38" height="16" rx="6" fill="#B57BFF" ' + S4 + '/><rect x="56" y="66" width="38" height="16" rx="6" fill="#4FB3FF" ' + S4 + '/><path d="M10 52Q10 40 24 40H40Q50 40 50 28Q50 40 60 40H76Q90 40 90 52" fill="none" stroke="#FFC93C" stroke-width="7" stroke-linecap="round"/><path d="M10 52Q10 40 24 40H40Q50 40 50 28Q50 40 60 40H76Q90 40 90 52" fill="none" stroke="' + INK + '" stroke-width="2"/>',
    take: '<path d="M16 50H84L76 90H24Z" fill="#E0A458" ' + S4 + '/><path d="M28 50Q50 10 72 50" fill="none" ' + S4 + '/><circle cx="50" cy="34" r="12" fill="#C98B4A" ' + S4 + '/>',
  };
  const P6L = [null, { kinds: ['come', 'go'], max: 5 }, { kinds: ['come', 'go', 'join', 'take'], max: 6 }, { kinds: ['come', 'go'], max: 7 }, { kinds: ['two'], max: 8 }, { kinds: ['plus', 'minus'], max: 9 }];
  /* the stage's pieces (logical px): door, frame, the ten places (feet), the two mats, the plate and its eight places, the basket */
  const G6 = L => (L ? { door: { x: 168, y: 238, w: 118, h: 198 }, frame: { x: 300, y: 252, w: 578, h: 304 }, sx: 354, sp: 108, rows: [404, 530], mats: [{ x: 312, y: 368, w: 262, h: 168 }, { x: 604, y: 368, w: 262, h: 168 }], plate: { x: 392, y: 262, w: 400, h: 284 }, cx: 592, cy: [352, 458], basket: { x: 172, y: 468, w: 140, h: 134 } }
    : { door: { x: 22, y: 330, w: 112, h: 196 }, frame: { x: 146, y: 338, w: 546, h: 330 }, sx: 196, sp: 106, rows: [486, 614], mats: [{ x: 150, y: 470, w: 262, h: 168 }, { x: 426, y: 470, w: 262, h: 168 }], plate: { x: 214, y: 370, w: 420, h: 290 }, cx: 424, cy: [462, 568], basket: { x: 160, y: 762, w: 140, h: 132 } });
  W5R.P6 = {
    kind0: 'come', verb: '演！', intro: '小剧场开演啦！', praise: ['演得真对！'], props: ACT.concat(['cookie', 'plate', 'basket']),
    kinds(lv) { return P6L[Math.min(5, Math.max(1, lv || 1))].kinds; },
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, L = P6L[d];
      const kind = o.kind && L.kinds.includes(o.kind) ? o.kind : bagPick(G, 'p6k' + d, L.kinds);
      const who = rng.pick(ACT), q = { d, kind, who, steps: [] };
      const nMax = d === 1 ? 2 : 3;
      if (kind === 'join') { q.a = rng.int(1, 3); q.b = rng.int(1, Math.min(3, L.max - q.a)); q.start = q.a + q.b; q.n = 0; q.fact = factOf('+', q.a, q.b); }
      else if (kind === 'take') { q.n = rng.int(1, nMax); q.start = rng.int(q.n + 1, Math.min(L.max, 6)); q.fact = factOf('-', q.start, q.n); }
      else if (kind === 'two') {
        const dirs = rng.chance(0.5) ? ['come', 'go'] : ['go', 'come'];
        for (let t = 0; t < 50; t++) {
          const s = rng.int(2, 5), a = rng.int(1, 2), b = rng.int(1, 2), mid = s + (dirs[0] === 'come' ? a : -a), end = mid + (dirs[1] === 'come' ? b : -b);
          if (mid >= 1 && end >= 1 && Math.max(s, mid, end) <= L.max) { q.start = s; q.steps = [{ dir: dirs[0], n: a }, { dir: dirs[1], n: b }]; break; }
        }
      } else {
        const dir = kind === 'plus' ? 'come' : kind === 'minus' ? 'go' : kind;
        q.n = rng.int(1, nMax);
        q.start = dir === 'come' ? rng.int(d >= 3 ? 2 : 1, L.max - q.n) : rng.int(Math.max(q.n + 1, d >= 3 ? 2 : 1), d === 1 ? 3 : L.max);
        if (d === 1) q.start = Math.min(q.start, 3);
        q.setup = d === 3 || d === 5;
        if (q.setup) q.steps.push({ dir: 'come', n: q.start, setup: true });
        q.steps.push({ dir, n: q.n });
        q.fact = factOf(dir === 'come' ? '+' : '-', q.start, q.n);
      }
      const c = q.steps.filter(s => s.dir === 'come').reduce((x, s) => x + s.n, 0), w = q.steps.filter(s => s.dir === 'go').reduce((x, s) => x + s.n, 0);
      q.answer = 'c' + c + 'w' + w + 'j' + (kind === 'join' ? 1 : 0) + 'b' + (kind === 'take' ? q.n : 0);
      q.k = [d, kind, who, q.start, q.n, q.a, q.steps.map(s => s.dir[0] + s.n).join('')];
      return q;
    },
    audit() { return [{ build: true, chance: 0.02 }]; },
    decor(G) { W2X.decorDone(G, this.chars); },
    /* ---- words */
    unit(q) { return q.kind === 'take' ? '块' : '只'; },
    changeLine(q, s) { return s.dir === 'come' ? '又来了' + CNQ(s.n) + '只！' : '走了' + CNQ(s.n) + '只！'; },
    storyLines(q) {
      const A = AN[q.who];
      if (q.kind === 'join') return ['这边有' + CNQ(q.a) + '只，', '那边有' + CNQ(q.b) + '只，', '合起来！'];
      if (q.kind === 'take') return ['盘子里有' + CNQ(q.start) + '块。', '佩奇拿走' + CNQ(q.n) + '块！'];
      if (q.kind === 'two') { const [s1, s2] = q.steps; return ['台上有' + CNQ(q.start) + '只。', (s1.dir === 'come' ? '来了' : '走了') + CNQ(s1.n) + '只，', (s2.dir === 'come' ? '又来了' : '又走了') + CNQ(s2.n) + '只！']; }
      if (q.d === 5) return ['照着算式演！'];
      if (q.setup) return ['先请' + CNQ(q.start) + '只' + A + '上台！'];
      return ['台上有' + CNQ(q.start) + '只' + A + '。', this.changeLine(q, q.steps[0])];
    },
    /* the stage's state as the answer: came / went / together / taken */
    state(st) { const P = st.p6; return 'c' + P.came + 'w' + P.went + 'j' + (P.merged ? 1 : 0) + 'b' + P.taken.length; },
    parse(ans) { const m = /^c(\d+)w(\d+)j(\d)b(\d+)$/.exec(ans || '') || [0, 0, 0, 0, 0]; return { c: +m[1], w: +m[2], j: +m[3], b: +m[4] }; },
    wrongLine(q, ans) {
      const a = this.parse(ans), n = q.n;
      if (q.kind === 'join') return a.c ? '这是来了哦' : a.w ? '这是走了哦' : '还没合起来哦';
      if (q.kind === 'take') return a.b > n ? '多拿了' + CNQ(a.b - n) + '块' : a.b ? '只拿了' + CNQ(a.b) + '块' : '还没拿哦';
      if (q.kind === 'two') { const wc = q.steps.filter(s => s.dir === 'come')[0].n, ww = q.steps.filter(s => s.dir === 'go')[0].n; if (a.c !== wc) return a.c ? '来了' + CNQ(a.c) + '只哦' : '还没来哦'; return a.w ? '走了' + CNQ(a.w) + '只哦' : '还没走哦'; }
      const dir = q.steps[q.steps.length - 1].dir;
      if (q.setup) {
        if (dir === 'go') { if (a.c !== q.start) return a.c < q.start ? '开始要' + CNQ(q.start) + '只' : '来了' + CNQ(a.c) + '只哦'; return a.w ? '走了' + CNQ(a.w) + '只哦' : '还没走哦'; }
        if (a.w) return '这是走了哦'; if (a.c < q.start) return '开始要' + CNQ(q.start) + '只'; return a.c === q.start ? '还没来哦' : '又来了' + CNQ(a.c - q.start) + '只哦';
      }
      if (dir === 'come') return a.w ? '这是走了哦' : a.c ? '来了' + CNQ(a.c) + '只哦' : '还没来哦';
      return a.c ? '这是来了哦' : a.w ? '走了' + CNQ(a.w) + '只哦' : '还没走哦';
    },
    /* the end of the story: how many there are now / went and still here */
    endLines(q) {
      if (q.kind === 'take') return ['拿走' + CNQ(q.n) + '块，', '还剩' + CNQ(q.start - q.n) + '块！'];
      if (q.kind === 'join') return ['现在有' + CNQ(q.a + q.b) + '只'];
      if (q.kind === 'two') { const r = q.steps.reduce((x, s) => x + (s.dir === 'come' ? s.n : -s.n), q.start); return ['现在有' + CNQ(r) + '只']; }
      const s = q.steps[q.steps.length - 1];
      return s.dir === 'come' ? ['现在有' + CNQ(q.start + s.n) + '只'] : [W5U.went(s.n) + '，', W5U.left(q.start - s.n) + '！'];
    },
    /* ---- pieces */
    spot(i) { const g = G6(K.L()), r = Math.floor(i / 5), c = i % 5; return { x: g.sx + c * g.sp - 50, y: g.rows[r] - 100, w: 100, h: 100 }; },
    doorAt() { const g = G6(K.L()).door; return { x: g.x + g.w / 2, y: g.y + g.h * 0.62 }; },
    actorEl(st, who, tap) { const e = imgPart(st, 9, who, true); if (tap) { const id = 'a' + (st.p6.ids++); e._id = id; K.reg(st, id, e, { drag: true, drops: () => [{ id: 'door', rect: () => box(st.p6.door) }] }); } return e; },
    freeSpot(st) { const P = st.p6; for (let i = 0; i < 10; i++) if (!P.on.some(a => a.spot === i)) return i; return -1; },
    /* a mat with its group (the actors are inside it: they move with it) */
    matEl(st, k, n, live) {
      const e = W2X.thing(st, 10, 10, 6, '');
      const m = el('div', '', e); Object.assign(m.style, { position: 'absolute', left: '0', right: '0', bottom: '0', height: '44px', pointerEvents: 'none' });
      m.innerHTML = '<svg viewBox="0 0 262 44" width="100%" height="100%" preserveAspectRatio="none"><rect x="3" y="6" width="256" height="34" rx="16" fill="' + (k ? '#4FB3FF' : '#B57BFF') + '" ' + S4 + '/><path d="M24 23H238" stroke="#FFF" stroke-width="4" stroke-dasharray="10 10" opacity=".7"/></svg>';
      e._kids = Array.from({ length: n }, () => { const a = el('div', '', e); Object.assign(a.style, { position: 'absolute', pointerEvents: 'none' }); const im = W5U.propImg(st.q.who); im.style.objectPosition = '50% 100%'; a.appendChild(im); return a; });
      if (live) K.reg(st, 'mat' + k, e, { drag: true, drops: () => (st.p6.mats && st.p6.mats[1 - k] ? [{ id: 'mat' + (1 - k), rect: () => box(st.p6.mats[1 - k]) }] : []) });
      return e;
    },
    layMat(e) { const b = box(e), n = e._kids.length, s = n > 4 ? 78 : 88, gap = 6, w0 = n * s + (n - 1) * gap; e._kids.forEach((a, i) => place(a, Math.round((b.w - w0) / 2 + i * (s + gap)), Math.round(b.h - 30 - s), s, s)); },
    cookieSpot(i, n) { const g = G6(K.L()), r = n > 4 ? Math.floor(i / Math.ceil(n / 2)) : 0, per = n > 4 ? Math.ceil(n / 2) : n, inRow = r ? n - per : per, c = r ? i - per : i, cy = n > 4 ? g.cy[r] : (g.cy[0] + g.cy[1]) / 2; return { x: Math.round(g.cx + (c - (inRow - 1) / 2) * 104 - 48), y: Math.round(cy - 48), w: 96, h: 96 }; },
    basketSpot(k) { const b = G6(K.L()).basket; return { x: b.x + 18 + (k % 3) * 34, y: b.y + 8 - Math.floor(k / 3) * 22, w: 52, h: 52 }; },
    place(st) {
      const P = st.p6; if (!P) return;
      const g = G6(K.L()), put = (e, r) => e && place(e, r.x, r.y, r.w, r.h);
      put(P.door, g.door); put(P.frame, g.frame);
      if (P.plate) put(P.plate, g.plate);
      if (P.basket) put(P.basket, g.basket);
      P.on.forEach(a => put(a.e, this.spot(a.spot)));
      if (P.mats) {
        if (P.merged) { const r = { x: g.mats[0].x, y: g.mats[0].y, w: g.mats[1].x + g.mats[1].w - g.mats[0].x, h: g.mats[0].h }; put(P.mats[P.into], r); }
        else P.mats.forEach((m, k) => m && put(m, g.mats[k]));
        P.mats.forEach(m => m && m.isConnected && this.layMat(m));
      }
      P.cookies.forEach(c => { if (c.inB < 0) put(c.e, this.cookieSpot(c.i, P.cookies.length)); else put(c.e, this.basketSpot(c.inB)); });
    },
    /* the stage at the start: the door, the frame, and (by the kind) the actors, the two mats, or the plate and the basket */
    setStage(st, live) {
      const q = st.q, P = st.p6;
      P.door = P.door || (() => { const e = svgPart(st, 6, DOOR6, 120, 200); if (live && q.kind !== 'join' && q.kind !== 'take') K.reg(st, 'door', e, {}); return e; })();
      P.frame = P.frame || (() => { const e = W2X.thing(st, 10, 10, 2, ''); Object.assign(e.style, { border: '5px dashed rgba(43,33,24,.55)', borderRadius: '26px', background: 'rgba(255,248,236,.28)', pointerEvents: 'none' }); return e; })();
      if (q.kind === 'join') { P.mats = [this.matEl(st, 0, q.a, live), this.matEl(st, 1, q.b, live)]; }
      else if (q.kind === 'take') {
        P.plate = P.plate || (() => { const e = W2X.thing(st, 10, 10, 3, ''); e.innerHTML = '<svg viewBox="0 0 400 284" width="100%" height="100%" preserveAspectRatio="none" style="pointer-events:none"><ellipse cx="200" cy="146" rx="194" ry="134" fill="#FFF" ' + S4 + '/><ellipse cx="200" cy="146" rx="150" ry="98" fill="none" stroke="#9FD3F5" stroke-width="6"/></svg>'; return e; })();
        P.basket = P.basket || (() => { const e = imgPart(st, 6, 'basket', true); if (live) K.reg(st, 'basket', e, {}); return e; })();
        P.cookies = Array.from({ length: q.start }, (_, i) => { const e = imgPart(st, 8, 'cookie'); if (live) K.reg(st, 'k' + i, e, { drag: true, drops: () => [{ id: 'basket', rect: () => box(P.basket) }] }); return { i, e, inB: -1 }; });
      } else if (!q.setup) P.on = Array.from({ length: q.start }, (_, i) => ({ e: this.actorEl(st, q.who, live), spot: i, fresh: -1 }));
      this.place(st);
    },
    taskParts(q) {
      const ic = k => ({ node: W3X.ic(IC6[k], 54).node }), A = W5U.prop(q.who);
      if (q.kind === 'join') return [[A, { qty: q.a }, { node: W3X.ic('<rect x="44" y="20" width="12" height="60" rx="6" fill="#C9B8A6"/>', 30).node }, A, { qty: q.b }], [ic('join')]];
      if (q.kind === 'take') return [[W5U.prop('cookie'), { qty: q.start }], [ic('take'), { qty: q.n }]];
      if (q.d === 5) return [[A], [{ node: this.sumCard(q) }]];
      return [[A, { qty: q.start }]].concat(q.steps.filter(s => !s.setup).map(s => [ic(s.dir), { qty: s.n }]));
    },
    /* the number sentence of L5 (numbers with their dots under them) */
    sumCard(q) {
      const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF', borderRadius: '14px', padding: '4px 12px', boxShadow: '0 0 0 3px ' + INK, pointerEvents: 'none' });
      const num = n => { const c = el('div', '', d); Object.assign(c.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }); if (digits()) c.appendChild(UI.num(n, 46)); c.appendChild(UI.dots(n, n > 5 ? 84 : 64, { layout: 'frame' })); };
      const op = t => { const s = svg('svg', { viewBox: '0 0 60 60', width: 46, height: 46 }, d); svg('rect', { x: 6, y: 25, width: 48, height: 10, rx: 5, fill: INK }, s); if (t === '+') svg('rect', { x: 25, y: 6, width: 10, height: 48, rx: 5, fill: INK }, s); };
      num(q.start); op(q.kind === 'plus' ? '+' : '-'); num(q.n);
      return d;
    },
    async present(st) {
      const q = st.q;
      st.p6 = { on: [], out: [], cookies: [], taken: [], came: 0, went: 0, ph: 0, phCame: 0, phWent: 0, merged: false, ids: 0, sel: null };
      this.setStage(st, true);
      st.doneBtn = K.done(st, 'bell'); K.reg(st, 'done', st.doneBtn, {});
      const P = st.p6;
      K.pop(st, P.door); P.on.forEach((a, i) => K.pop(st, a.e, 80 + 60 * i)); (P.mats || []).forEach((m, i) => K.pop(st, m, 80 + 100 * i)); P.cookies.forEach((c, i) => K.pop(st, c.e, 80 + 50 * i));
      K.task(st, this.taskParts(q));
      const L = this.storyLines(q);
      st.lead = L.slice(0, -1); L.slice(0, -1).forEach(l => Voice.say(l, { tag: 'prompt' }));
      K.say(st, L[L.length - 1]);
    },
    dir(st) { const q = st.q, s = q.steps[st.p6.ph] || q.steps[q.steps.length - 1]; return s ? s.dir : 'come'; },
    /* a phase is done (L3 / L5: everyone is on the stage - now the change; L4: the first change): the next phase */
    advance(st) {
      const q = st.q, P = st.p6, s = q.steps[P.ph]; if (!s || P.ph >= q.steps.length - 1) return;
      if ((s.dir === 'come' ? P.phCame : P.phWent) < s.n) return;
      P.ph++; P.phCame = 0; P.phWent = 0;
      if (s.setup) { const nx = q.steps[P.ph]; st.scope.timeout(() => { if (Session.alive(st) && !st.submitted) { if (q.d === 5) K.flash(st, $$('.task', Stage.el)); K.say(st, this.changeLine(q, nx)); } }, 380); }
    },
    comeIn(st, fresh) {
      const P = st.p6, i = this.freeSpot(st); if (i < 0) return null;
      const a = { e: this.actorEl(st, st.q.who, true), spot: i, fresh }, s = this.spot(i), dd = this.doorAt();
      P.on.push(a); place(a.e, dd.x - 50, dd.y - 60, 100, 100); K.flyTo(st, a.e, s.x, s.y, 320, 30); Sfx.pop();
      return a;
    },
    goOut(st, a) {
      const P = st.p6; P.on.splice(P.on.indexOf(a), 1);
      Input.unbind(a.e); delete st.map[a.e._id]; a.e.style.transform = '';
      const dd = this.doorAt(), b = box(a.e);
      st.scope.anim(a.e, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + (dd.x - b.x - 50) + 'px,' + (dd.y - b.y - 60) + 'px) scale(.6)', opacity: 0 }], { duration: 360, easing: EASE.glide, fill: 'forwards' }).then(() => a.e.remove());
      Sfx.whoosh(0.2);
    },
    onGesture(st, name, p) {
      const q = st.q, P = st.p6, id = p.id || ''; if (st.picked || !P) return false;
      if (id === 'done' && name === 'tap') { st.picked = true; Session.submit(st, this.state(st)); return 'ok'; }
      if (q.kind === 'join') {
        const k = id === 'mat0' ? 0 : id === 'mat1' ? 1 : -1; if (k < 0 || P.merged) return false;
        if (name === 'drop' && (p.to === 'mat0' || p.to === 'mat1') && p.to !== id) return this.merge(st, k, 1 - k);
        if (name !== 'tap') return false;
        if (P.sel == null) { P.sel = k; P.mats[k].classList.add('glow'); Sfx.press(); return 'ok'; }
        if (P.sel === k) { P.sel = null; P.mats[k].classList.remove('glow'); return 'ok'; }
        return this.merge(st, P.sel, k);
      }
      if (q.kind === 'take') {
        const m = /^k(\d+)$/.exec(id);
        if (m && (name === 'tap' || (name === 'drop' && p.to === 'basket'))) { const c = P.cookies[+m[1]]; if (c.inB >= 0) return false; this.takeOne(st, c); return 'ok'; }
        if (id === 'basket' && name === 'tap') { const c = P.taken.pop(); if (!c) { K.wiggle(st, P.basket); return 'free'; } c.inB = -1; const s = this.cookieSpot(c.i, P.cookies.length), b0 = box(c.e); c.e.style.zIndex = 8; K.reg(st, 'k' + c.i, c.e, { drag: true, drops: () => [{ id: 'basket', rect: () => box(P.basket) }] }); place(c.e, b0.x - 22, b0.y - 22, 96, 96); K.flyTo(st, c.e, s.x, s.y, 300, 40).then(() => this.place(st)); Sfx.back(); return 'ok'; }
        return false;
      }
      if (id === 'door' && name === 'tap') {
        const last = P.out[P.out.length - 1];
        if (this.dir(st) === 'go' && last && last.ph === P.ph) { P.out.pop(); const a = this.comeIn(st, last.fresh); if (!a) return 'free'; P.went--; P.phWent--; return 'ok'; }
        if (!this.comeIn(st, P.ph)) { K.wiggle(st, P.door); return 'free'; }
        P.came++; P.phCame++; this.advance(st); return 'ok';
      }
      const a = P.on.find(x => x.e._id === id);
      if (a && (name === 'tap' || (name === 'drop' && p.to === 'door'))) {
        this.goOut(st, a);
        if (this.dir(st) === 'come' && a.fresh === P.ph) { P.came--; P.phCame--; return 'ok'; }
        P.went++; P.phWent++; P.out.push({ ph: P.ph, fresh: a.fresh }); this.advance(st); return 'ok';
      }
      return false;
    },
    merge(st, from, into) {
      const P = st.p6; if (P.merged) return false;
      P.merged = true; P.into = into; P.sel = null; P.mats.forEach(m => m.classList.remove('glow'));
      const A = P.mats[from], B = P.mats[into];
      A._kids.forEach(k => B.appendChild(k)); B._kids = into ? A._kids.concat(B._kids) : B._kids.concat(A._kids);
      Input.unbind(A); delete st.map['mat' + from]; A.remove(); P.mats[from] = null; Input.unbind(B); delete st.map['mat' + into];
      this.place(st); Sfx.place(); K.pop(st, B);
      return 'ok';
    },
    takeOne(st, c) {
      const P = st.p6; c.inB = P.taken.length; P.taken.push(c);
      Input.unbind(c.e); delete st.map['k' + c.i]; c.e.style.zIndex = 7; c.e.style.transform = '';
      const s = this.basketSpot(c.inB), b0 = box(c.e); place(c.e, b0.x + 22, b0.y + 22, 52, 52); K.flyTo(st, c.e, s.x, s.y, 300, 50).then(() => this.place(st)); Sfx.place();
    },
    next(st, strat) {
      const q = st.q, P = st.p6; if (st.picked || !P || !st.map.done) return null;
      const wrong = strat === 'wrong', done = { g: 'tap', p: { id: 'done' } };
      if (q.kind === 'join') { if (wrong || P.merged) return done; const t = box(P.mats[1]); return { g: 'drop', p: { id: 'mat0', to: 'mat1' }, to: { x: t.x + t.w / 2, y: t.y + t.h / 2 } }; }
      if (q.kind === 'take') {
        const want = q.n + (wrong ? 1 : 0);
        if (P.taken.length < want) { const c = P.cookies.find(x => x.inB < 0); if (!c) return done; const b = box(P.basket); return { g: 'drop', p: { id: 'k' + c.i, to: 'basket' }, to: { x: b.x + b.w / 2, y: b.y + b.h / 2 } }; }
        if (P.taken.length > want) return { g: 'tap', p: { id: 'basket' } };
        return done;
      }
      const s = q.steps[P.ph], last = P.ph === q.steps.length - 1;
      const want = s.n + (wrong && last ? 1 : 0), prog = s.dir === 'come' ? P.phCame : P.phWent;
      if (prog < want) { if (s.dir === 'come') return this.freeSpot(st) < 0 ? done : { g: 'tap', p: { id: 'door' } }; const a = P.on[P.on.length - 1]; return a ? { g: 'tap', p: { id: a.e._id } } : done; }
      return done;
    },
    gestureHint(st) { const P = st.p6; if (!P) return; W3X.tapHint(st, st.q.kind === 'join' ? P.mats.find(Boolean) : st.q.kind === 'take' ? (P.cookies.find(c => c.inB < 0) || {}).e : P.door); },
    workEls(st) { const P = st.p6; return P ? [P.door].concat(P.on.map(a => a.e), (P.mats || []).filter(Boolean), P.cookies.filter(c => c.inB < 0).map(c => c.e)) : []; },
    /* what he moved (for the blue ring): those that came in this question / the door they went out of / the mats / the basket */
    moved(st, ans) {
      const q = st.q, P = st.p6, a = this.parse(ans);
      if (q.kind === 'join') return (P.mats || []).filter(Boolean);
      if (q.kind === 'take') return [P.basket];
      const wantW = q.steps.filter(s => s.dir === 'go').reduce((x, s) => x + s.n, 0), came = P.on.filter(x => x.fresh >= 0).map(x => x.e);
      return a.w !== wantW || !came.length ? [P.door] : came;
    },
    async feedback(st, ans) {
      const m = this.moved(st, ans); if (m[0]) K.wiggle(st, m[0]);
      W5U.say(st, this.wrongLine(st.q, ans));
      await st.scope.wait(T(600));
    },
    /* the story once more from the start, drawn by §3.3; st.p6.result = what is there at the end */
    async replay(st) {
      const q = st.q, P = st.p6, my = st;
      P.on.forEach(a => a.e.remove()); P.cookies.forEach(c => c.e.remove()); (P.mats || []).forEach(m => m && m.remove());
      P.on = []; P.cookies = []; P.taken = []; P.mats = null; P.merged = false;
      if (q.setup) P.on = Array.from({ length: q.start }, (_, i) => ({ e: this.actorEl(st, q.who, false), spot: i, fresh: -1 }));
      this.setStage(st, false);
      const start = q.kind === 'join' ? P.mats.filter(Boolean) : q.kind === 'take' ? P.cookies.map(c => c.e) : P.on.map(a => a.e);
      start.forEach(e => st.scope.anim(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 }));
      const frame = W5U.stay(st, start); if (frame) frame.style.borderStyle = 'solid';
      await pause(st, 200); if (!Session.alive(my)) return;
      W5U.hide(frame);
      if (q.kind === 'join') {
        W5U.note(st, '合起来！');
        const A = P.mats[0], B = P.mats[1], dx = box(B).x - box(A).x;
        await st.scope.anim(A, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + Math.round(dx * 0.35) + 'px)' }], { duration: 500, easing: EASE.glide }); if (!Session.alive(my)) return;
        A.getAnimations().forEach(x => x.cancel()); this.merge(st, 0, 1);
        await pause(st, 200); if (!Session.alive(my)) return;
        const kids = P.mats[1]._kids; W5U.brace(st, kids, true);
        Count.say(q.a + q.b);
        P.result = kids;
        await st.scope.wait(600);
        return;
      }
      if (q.kind === 'take') {
        W5U.note(st, '佩奇拿走' + CNQ(q.n) + '块！');
        const b = box(P.basket);
        for (let i = 0; i < q.n; i++) { const c = P.cookies[P.cookies.length - 1 - i]; c.inB = i; W5U.leave(st, c.e, b.x + b.w / 2, b.y + b.h / 2, 420); Count.say(q.start - i - 1); await pause(st, 300); if (!Session.alive(my)) return; const k = imgPart(st, 7, 'cookie'), r = this.basketSpot(i); place(k, r.x, r.y, r.w, r.h); K.pop(st, k); }
        P.result = P.cookies.filter(c => c.inB < 0).map(c => c.e);
        await st.scope.wait(150);
        return;
      }
      const steps = q.steps.filter(s => !s.setup), dd = this.doorAt();
      let n = q.start;
      for (const s of steps) {
        if (q.kind !== 'two') W5U.note(st, this.changeLine(q, s));
        else if (!steps.indexOf(s)) W5U.note(st, steps.map(x => (x.dir === 'come' ? '来了' : '走了') + CNQ(x.n) + '只').join('，') + '！');
        for (let i = 0; i < s.n; i++) {
          if (s.dir === 'come') { const sp = this.freeSpot(st), a = { e: this.actorEl(st, q.who, false), spot: sp, fresh: 0 }, r = this.spot(sp); P.on.push(a); place(a.e, dd.x - 50, dd.y - 60, 100, 100); await K.flyTo(st, a.e, r.x, r.y, 300, 30); if (!Session.alive(my)) return; W5U.came(st, a.e); a.badge = K.badge(st, a.e, ++n, 0, -4, 40); Count.say(n); await pause(st, 160); }
          else { const a = P.on.pop(); if (a.badge) a.badge.remove(); W5U.leave(st, a.e, dd.x, dd.y, 360); Count.say(--n); await pause(st, 300); }
          if (!Session.alive(my)) return;
        }
      }
      P.result = P.on.map(a => a.e);
      await st.scope.wait(150);
    },
    async explain(st, ans) {
      const q = st.q, my = st;
      const rings = W5U.blue(st, this.moved(st, ans));
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      await this.replay(st); if (!Session.alive(my)) return;
      this.goldFrame(st, st.p6.result);
      for (const l of this.endLines(q)) { await W5U.sum(st, l); if (!Session.alive(my)) return; }
      await st.scope.wait(200);
    },
    rightEls(st) { return (st.p6 && st.p6.result) || []; },
    /* what is there at the end: one solid gold frame round the group (§3.3: what is still here is drawn solid) */
    goldFrame(st, els) { const r = W5U.ring(st, els, W5U.GOLD, 10); if (r) { r.style.borderStyle = 'solid'; r.style.borderRadius = '30px'; } return r; },
    /* right: the result ringed gold (together: a brace), the end of the story */
    async reveal(st) {
      const q = st.q, P = st.p6, my = st;
      Sfx.reveal();
      const res = q.kind === 'join' ? P.mats.find(Boolean)._kids : q.kind === 'take' ? P.cookies.filter(c => c.inB < 0).map(c => c.e) : P.on.map(a => a.e);
      if (q.kind === 'join') W5U.brace(st, res, true);
      if (res.length) this.goldFrame(st, res);
      this.cheerAll(st);
      const ls = this.endLines(q); st.summary = ls[ls.length - 1];
      for (const l of ls) { await W5U.sum(st, l); if (!Session.alive(my)) return; }
      await st.scope.wait(T(400));
    },
    snap(st) { return { state: st.p6 ? this.state(st) : '', ph: st.p6 ? st.p6.ph : 0 }; },
    lines() {
      const out = [this.intro, '照着算式演！', '合起来！', '还没合起来哦', '这是走了哦', '这是来了哦', '还没来哦', '还没走哦', '还没拿哦'].concat(this.praise);
      const R = (a, b, f) => { for (let n = a; n <= b; n++) f(CNQ(n)); };
      R(1, 3, c => out.push('又来了' + c + '只！', '走了' + c + '只！', '佩奇拿走' + c + '块！', '拿走' + c + '块，', '这边有' + c + '只，', '那边有' + c + '只，', '走了' + c + '只，'));
      R(1, 2, c => out.push('来了' + c + '只，', '又走了' + c + '只！', '只拿了' + c + '块'));
      R(1, 2, a => R(1, 2, b => out.push('来了' + a + '只，走了' + b + '只！', '走了' + a + '只，来了' + b + '只！')));
      R(2, 5, c => out.push('台上有' + c + '只。'));
      R(2, 6, c => out.push('盘子里有' + c + '块。'));
      R(1, 5, c => out.push('还剩' + c + '块！', '多拿了' + c + '块'));
      R(1, 8, c => out.push('还剩' + c + '只！'));
      R(1, 9, c => out.push('走了' + c + '只哦'));
      R(1, 10, c => out.push('来了' + c + '只哦', '又来了' + c + '只哦', '现在有' + c + '只'));
      R(2, 9, c => out.push('开始要' + c + '只'));
      ACT.forEach(a => { R(1, 6, c => out.push('台上有' + c + '只' + AN[a] + '。')); R(2, 7, c => out.push('先请' + c + '只' + AN[a] + '上台！')); });
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- P7 连！ 钉板拉皮筋 (F4 Little Painter: dots joined by straight
     lines, lines closing a shape; S7: polygons by their sides; F5: parallel lines). Daddy Pig's peg board (5 x 5 pegs, L5
     6 x 6) and a small sample card. Tap a peg (it lights up), tap another: a rubber band between them; go on peg by peg;
     tap the first peg again: the shape is closed. Tap the last lit peg: its band comes off (tap a lit peg further back: the
     bands after it come off; tap a closed shape: it opens). Then the big button.
       L1 copy the sample at the same place (a star marks the first peg): triangle, square, rectangle, sides <= 2
       L2 copy the sample anywhere on the board: 4-5 sides (little house, kite ...), sides <= 3, slanted ones too
       L3 no sample: "拉一个三条边的！" (3 / 4 / 5 sides from a bag) - any closed shape with that many sides, not crossing
       itself (pegs in a straight line on one side are one side)
       L4 copy a 5-6 sided sample (arrow, house with a porch ...) with a 1 x 2 slanted side, anywhere
       L5 a band is on the board (maybe slanted): "再拉一条路！" "和它一样方向！" - a band of the same direction, not on its
       line, at least 2 steps long
     A construction: every right shape counts (L2 / L4 any place, L3 any shape with N sides, L5 any parallel band); a random
     play is right almost never. Wrong: his shape ringed blue, the band that differs flashing ("这里不一样哦"; sides: his
     bands counted one by one - "这是四条边"); the right shape in gold slides from the card onto the board ("照这样拉"),
     an N-sided example counted ("三条边！"), or a band of the same direction with a little train on both ("一样方向"). */
  const PSH = {
    1: [[[0, 0], [2, 0], [0, 2]], [[0, 0], [2, 0], [2, 2]], [[0, 0], [0, 2], [2, 2]], [[2, 0], [2, 2], [0, 2]], [[1, 0], [2, 2], [0, 2]], [[0, 0], [2, 0], [1, 2]], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0], [2, 0], [2, 2], [0, 2]], [[0, 0], [2, 0], [2, 1], [0, 1]], [[0, 0], [1, 0], [1, 2], [0, 2]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 1], [0, 2]]],
    2: [[[0, 1], [1, 0], [2, 1], [2, 3], [0, 3]], [[1, 0], [2, 1], [1, 3], [0, 1]], [[1, 0], [2, 1], [1, 2], [0, 1]], [[1, 0], [2, 0], [3, 2], [0, 2]], [[1, 0], [3, 0], [2, 2], [0, 2]], [[0, 0], [3, 0], [2, 1], [1, 1]], [[0, 0], [2, 0], [3, 1], [2, 2], [0, 2]], [[0, 0], [3, 0], [3, 1], [2, 2], [1, 2]]],
    4: [[[0, 2], [1, 0], [2, 2], [2, 4], [0, 4]], [[0, 4], [0, 2], [1, 0], [2, 2], [3, 2], [3, 4]], [[0, 0], [2, 0], [3, 2], [2, 4], [0, 4]], [[0, 0], [2, 0], [3, 2], [2, 4], [0, 4], [1, 2]], [[1, 0], [3, 0], [4, 2], [3, 4], [1, 4], [0, 2]], [[0, 0], [3, 0], [3, 2], [1, 2], [0, 4]]],
  };
  /* an example of each number of sides (L3's explanation and the tests' right play) */
  const NGON = { 3: [[1, 1], [3, 1], [1, 3]], 4: [[1, 1], [3, 1], [3, 3], [1, 3]], 5: [[1, 2], [2, 1], [3, 2], [3, 3], [1, 3]] };
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const PG = {
    /* the corners of a path: repeated pegs and pegs in the middle of a straight side left out */
    corners(p, closed) {
      let v = p.filter((x, i) => i === 0 || !same(x, p[i - 1]));
      if (closed && v.length > 1 && same(v[0], v[v.length - 1])) v.pop();
      for (let ch = true; ch && v.length > 2;) {
        ch = false;
        for (let i = 0; i < v.length; i++) {
          if (!closed && (i === 0 || i === v.length - 1)) continue;
          const a = v[(i - 1 + v.length) % v.length], b = v[i], c = v[(i + 1) % v.length];
          if (cross(sub(b, a), sub(c, b)) === 0 && (sub(b, a)[0] * sub(c, b)[0] + sub(b, a)[1] * sub(c, b)[1]) > 0) { v.splice(i, 1); ch = true; break; }
        }
      }
      return v;
    },
    /* the same cycle of corners (either way round), after moving both to their top-left */
    norm(v) { const x0 = Math.min(...v.map(p => p[0])), y0 = Math.min(...v.map(p => p[1])); return v.map(p => [p[0] - x0, p[1] - y0]); },
    sameCycle(a, b) {
      if (a.length !== b.length) return false;
      const k = p => p.join(':'), A = a.map(k), n = a.length;
      for (const B of [b.map(k), b.slice().reverse().map(k)]) for (let s = 0; s < n; s++) if (A.every((x, i) => x === B[(i + s) % n])) return true;
      return false;
    },
    area2(v) { let s = 0; v.forEach((p, i) => { const q = v[(i + 1) % v.length]; s += p[0] * q[1] - q[0] * p[1]; }); return s; },
    /* proper crossing (or touching) of two non-neighbouring sides */
    hit(a, b, c, d) {
      const o = (p, q, r) => Math.sign(cross(sub(q, p), sub(r, p))), on = (p, q, r) => Math.min(p[0], r[0]) <= q[0] && q[0] <= Math.max(p[0], r[0]) && Math.min(p[1], r[1]) <= q[1] && q[1] <= Math.max(p[1], r[1]);
      const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
      if (o1 !== o2 && o3 !== o4) return true;
      return (o1 === 0 && on(a, c, b)) || (o2 === 0 && on(a, d, b)) || (o3 === 0 && on(c, a, d)) || (o4 === 0 && on(c, b, d));
    },
    simple(v) {
      const n = v.length; if (n < 3 || this.area2(v) === 0) return false;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (j === i + 1 || (i === 0 && j === n - 1)) continue; if (this.hit(v[i], v[(i + 1) % n], v[j], v[(j + 1) % n])) return false; }
      return true;
    },
  };
  const P7G = (L, n) => {
    const p = n === 6 ? (L ? 92 : 90) : L ? 104 : 100, B = n * p;
    return L ? { p, board: { x: n === 6 ? 330 : 350, y: n === 6 ? 112 : 124, w: B, h: B }, card: { x: 124, y: 120, w: 204, h: 204 }, done: { x: 172, y: 420 } }
      : { p, board: { x: Math.round((704 - B) / 2), y: n === 6 ? 352 : 382, w: B, h: B }, card: { x: 20, y: 200, w: 166, h: 166 }, done: { x: 568, y: 226 } };
  };
  const DIRS5 = [[1, 0], [0, 1], [1, 1], [1, -1], [1, 2], [2, 1], [1, -2], [2, -1]];
  W5R.P7 = {
    kind0: 'pegs5', verb: '连！', intro: '钉板拉皮筋！', praise: ['拉得真直！'],
    kinds(lv) { return [['copy', 'copy', 'shift', 'sides', 'shift', 'par'][Math.min(5, Math.max(1, lv || 1))]]; },
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, n = d === 5 ? 6 : 5, q = { d, n };
      if (d === 3) { q.sides = bagPick(G, 'p7s', [3, 4, 5]); q.answer = NGON[q.sides].map(p => p.join(',')).join(';') + '!'; q.k = [d, q.sides, rng.int(0, 99)]; return q; }
      if (d === 5) {
        const v = DIRS5[bagPick(G, 'p7d', [0, 1, 2, 3, 4, 5, 6, 7])], st2 = [v[0] * 2, v[1] * 2];
        for (let t = 0; t < 200; t++) {
          const a = [rng.int(0, 5), rng.int(0, 5)], b = [a[0] + st2[0], a[1] + st2[1]];
          if (b[0] < 0 || b[0] > 5 || b[1] < 0 || b[1] > 5) continue;
          /* a right band exists: the same direction, another line */
          const sol = []; for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) { const e = [x + st2[0], y + st2[1]]; if (e[0] >= 0 && e[0] <= 5 && e[1] >= 0 && e[1] <= 5 && cross(sub([x, y], a), v) !== 0) sol.push([[x, y], e]); }
          if (!sol.length) continue;
          q.given = [a, b]; q.v = v; const s = sol[rng.int(0, sol.length - 1)]; q.answer = s.map(p => p.join(',')).join(';'); q.k = [d, a, b]; return q;
        }
      }
      const shapes = PSH[d === 1 ? 1 : d === 2 ? 2 : 4], i = bagPick(G, 'p7h' + d, shapes.map((_, k) => k));
      let s = shapes[i];
      if (rng.chance(0.5)) { const W = Math.max(...s.map(p => p[0])); s = s.map(p => [W - p[0], p[1]]); }
      const W = Math.max(...s.map(p => p[0])), H = Math.max(...s.map(p => p[1])), ox = rng.int(0, n - 1 - W), oy = rng.int(0, n - 1 - H);
      q.shape = s.map(p => [p[0] + ox, p[1] + oy]);
      q.answer = q.shape.map(p => p.join(',')).join(';') + '!';
      q.k = [d, i, q.shape.map(p => p.join('')).join('.')];
      return q;
    },
    audit() { return [{ build: true, chance: 0.01 }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    /* ---- the answer: "c,r;c,r;...;" + "!" when closed */
    enc(path, closed) { return path.map(p => p.join(',')).join(';') + (closed ? '!' : ''); },
    dec(ans) { const s = String(ans || ''), closed = s.endsWith('!'), body = closed ? s.slice(0, -1) : s; return { path: body ? body.split(';').map(x => x.split(',').map(Number)) : [], closed }; },
    /* what is wrong with a play (null: right) */
    judge(q, ans) {
      const a = this.dec(ans);
      if (!a.path.length) return 'none';
      if (q.d === 5) {
        if (a.closed) return 'dir';
        const v = PG.corners(a.path, false); if (v.length !== 2) return 'dir';
        const dv = sub(v[1], v[0]);
        if (cross(dv, q.v) !== 0) return 'dir';
        if (cross(sub(v[0], q.given[0]), q.v) === 0) return 'line';
        if (gcd(Math.abs(dv[0]), Math.abs(dv[1])) < 2 * gcd(Math.abs(q.v[0]), Math.abs(q.v[1]))) return 'short';
        return null;
      }
      if (!a.closed) return 'open';
      const v = PG.corners(a.path, true);
      if (q.d === 3) return PG.simple(v) && v.length === q.sides ? null : PG.simple(v) ? 'sides' : 'cross';
      if (q.d === 1) return PG.sameCycle(v, q.shape) ? null : 'diff';
      return PG.sameCycle(PG.norm(v), PG.norm(q.shape)) ? null : 'diff';
    },
    evaluate(st, ans) { return this.judge(st.q, ans) === null; },
    /* ---- the board */
    geo(st) { return P7G(K.L(), st.q.n); },
    pegXY(st, p) { const g = this.geo(st); return { x: g.board.x + (p[0] + 0.5) * g.p, y: g.board.y + (p[1] + 0.5) * g.p }; },
    place(st) {
      const S = st.p7; if (!S) return;
      const g = this.geo(st);
      place(S.board, g.board.x - 14, g.board.y - 14, g.board.w + 28, g.board.h + 28);
      S.cells.forEach(c => place(c.e, g.board.x + c.p[0] * g.p, g.board.y + c.p[1] * g.p, g.p, g.p));
      place(S.layer, 0, 0, Stage.W, Stage.H); S.layer.setAttribute('width', Stage.W); S.layer.setAttribute('height', Stage.H);
      if (S.card) place(S.card, g.card.x, g.card.y, g.card.w, g.card.h);
      if (st.doneBtn) { st.doneBtn._done.x = g.done.x; st.doneBtn._done.y = g.done.y; K.placeDone(st.doneBtn); }
      this.draw(st);
    },
    /* every peg, the given band (L5), his bands and lit pegs, the start star (L1) - redrawn whole each time */
    draw(st) {
      const S = st.p7, q = st.q, s = S.layer, P = p => this.pegXY(st, p);
      while (s.firstChild) s.removeChild(s.firstChild);
      for (let x = 0; x < q.n; x++) for (let y = 0; y < q.n; y++) { const c = P([x, y]); svg('circle', { cx: c.x, cy: c.y, r: 9, fill: '#8A5A2B', stroke: INK, 'stroke-width': 3 }, s); }
      if (q.given) { const a = P(q.given[0]), b = P(q.given[1]); svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#5CC46E', 'stroke-width': 11, 'stroke-linecap': 'round' }, s); }
      const band = (a, b, col) => { const A = P(a), B = P(b); svg('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: INK, 'stroke-width': 13, 'stroke-linecap': 'round' }, s); svg('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: col || '#FF6B5B', 'stroke-width': 7, 'stroke-linecap': 'round' }, s); };
      S.path.forEach((p, i) => { if (i) band(S.path[i - 1], p); });
      if (S.closed && S.path.length > 2) band(S.path[S.path.length - 1], S.path[0]);
      S.path.forEach((p, i) => { const c = P(p); svg('circle', { cx: c.x, cy: c.y, r: i === S.path.length - 1 && !S.closed ? 17 : 14, fill: '#FFC93C', stroke: INK, 'stroke-width': 4 }, s); });
      if (q.d === 1) { const c = P(q.shape[0]), st5 = W2X.star(c.x, c.y - 30, 15); svg('polygon', { points: W2X.pts(st5), fill: '#FFC93C', stroke: INK, 'stroke-width': 3 }, s); }
    },
    /* the sample card: a little board with the shape (L1 with the star at its first corner) / the number of sides (L3) /
       the band's direction (L5) */
    cardInner(q) {
      const n = q.n, m = 100 / n, P = p => [(p[0] + 0.5) * m, (p[1] + 0.5) * m];
      let s = '';
      if (q.d === 3) { let t = '<text x="50" y="52" font-size="46" font-weight="900" text-anchor="middle" fill="#FF6B5B" stroke="' + INK + '" stroke-width="2">' + q.sides + '</text>'; for (let i = 0; i < q.sides; i++) { const x = 50 + (i - (q.sides - 1) / 2) * 17; t += '<path d="M' + (x - 5) + ' 84L' + (x + 5) + ' 66" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M' + (x - 5) + ' 84L' + (x + 5) + ' 66" stroke="#FF6B5B" stroke-width="4.5" stroke-linecap="round"/>'; } return t; }
      for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) s += '<circle cx="' + ((x + 0.5) * m).toFixed(1) + '" cy="' + ((y + 0.5) * m).toFixed(1) + '" r="3.4" fill="#8A5A2B"/>';
      if (q.d === 5) { const a = P(q.given[0]), b = P(q.given[1]); return s + '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#5CC46E" stroke-width="6" stroke-linecap="round"/>'; }
      const pts = q.shape.map(P);
      s += '<polygon points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="rgba(255,107,91,.2)" stroke="#E8414B" stroke-width="6" stroke-linejoin="round"/>';
      if (q.d === 1) s += '<polygon points="' + W2X.pts(W2X.star(pts[0][0], pts[0][1] - 9, 8)) + '" fill="#FFC93C" stroke="' + INK + '" stroke-width="1.5"/>';
      return s;
    },
    async present(st) {
      const q = st.q;
      const S = st.p7 = { path: [], closed: false, cells: [] };
      S.board = W2X.thing(st, 10, 10, 3, ''); Object.assign(S.board.style, { borderRadius: '26px', background: 'linear-gradient(#F3C98B,#E2A15B)', boxShadow: '0 0 0 5px ' + INK + ', 0 8px 0 5px rgba(43,33,24,.2)', pointerEvents: 'none' });
      S.layer = svg('svg', { width: Stage.W, height: Stage.H }, Stage.el); Object.assign(S.layer.style, { position: 'absolute', left: '0px', top: '0px', zIndex: 5, pointerEvents: 'none', overflow: 'visible' }); st.els.push(S.layer);
      for (let x = 0; x < q.n; x++) for (let y = 0; y < q.n; y++) { const e = W2X.thing(st, 10, 10, 8, ''); K.reg(st, 'g' + x + '_' + y, e, {}); S.cells.push({ p: [x, y], e }); }
      if (q.d !== 5) { S.card = W2X.thing(st, 10, 10, 6, 'card'); S.card.innerHTML = '<svg viewBox="0 0 100 100" width="88%" height="88%" style="pointer-events:none">' + this.cardInner(q) + '</svg>'; S.card.style.pointerEvents = 'none'; }
      st.doneBtn = K.done(st, 'check', 0, 0, 110); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      K.pop(st, S.board); if (S.card) K.pop(st, S.card, 120);
      const ic = W3X.ic('<g fill="' + INK + '"><circle cx="20" cy="20" r="6"/><circle cx="50" cy="20" r="6"/><circle cx="80" cy="20" r="6"/><circle cx="20" cy="50" r="6"/><circle cx="50" cy="50" r="6"/><circle cx="80" cy="50" r="6"/><circle cx="20" cy="80" r="6"/><circle cx="50" cy="80" r="6"/><circle cx="80" cy="80" r="6"/></g><path d="M20 80L50 20L80 80Z" fill="none" stroke="#FF6B5B" stroke-width="7" stroke-linejoin="round"/>', 54);
      if (q.d === 3) { K.task(st, [[ic], [{ qty: q.sides }], ['q']]); K.say(st, '拉一个' + CN[q.sides] + '条边的！'); }
      else if (q.d === 5) { K.task(st, [[ic], [W3X.ic('<path d="M10 70L60 20" stroke="#5CC46E" stroke-width="10" stroke-linecap="round"/><path d="M40 90L90 40" stroke="#FF6B5B" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 14"/>', 54)], ['q']]); W3X.say2(st, '再拉一条路！', '和它一样方向！'); }
      else { K.task(st, [[ic], ['eye'], ['q']]); K.say(st, q.d === 1 ? '照着拉，从星星开始！' : '照着样子拉！'); }
    },
    onGesture(st, name, p) {
      const S = st.p7, id = p.id || ''; if (name !== 'tap' || st.picked || !S) return false;
      if (id === 'done') { if (!S.path.length) { K.wiggle(st, st.doneBtn); return 'free'; } st.picked = true; Session.submit(st, this.enc(S.path, S.closed)); return 'ok'; }
      const m = /^g(\d)_(\d)$/.exec(id); if (!m) return false;
      const P = [+m[1], +m[2]], i = S.path.findIndex(x => same(x, P));
      if (S.closed) { S.closed = false; Sfx.back(); }
      else if (!S.path.length) { S.path.push(P); Sfx.press(); }
      else if (i === S.path.length - 1) { S.path.pop(); Sfx.back(); }
      else if (i === 0 && S.path.length >= 3) { S.closed = true; Sfx.place(); }
      else if (i >= 0) { S.path.length = i + 1; Sfx.back(); }
      else { S.path.push(P); Sfx.place(); }
      st.doneBtn.classList.toggle('ready', S.path.length > 1);
      this.draw(st);
      return 'ok';
    },
    /* the play the tests (and the first-time demo) make: the right shape corner by corner, closed, then the button */
    want(st, strat) {
      const q = st.q;
      if (q.d === 5) { const a = this.dec(q.answer).path; return strat === 'wrong' ? { path: [a[0], [a[0][0] + (q.v[0] ? 0 : 1), a[0][1] + (q.v[0] ? 1 : 0)].map(x => Math.min(5, x))].filter((x, i, A) => i === 0 || !same(x, A[0])), closed: false } : { path: a, closed: false }; }
      const a = this.dec(q.answer).path;
      return strat === 'wrong' ? { path: a.slice(0, 2), closed: false } : { path: a, closed: true };
    },
    next(st, strat) {
      const S = st.p7; if (st.picked || !S || !st.map.done) return null;
      const w = this.want(st, strat), tap = p => ({ g: 'tap', p: { id: 'g' + p[0] + '_' + p[1] } });
      if (S.closed && !w.closed) return tap(S.path[0]);
      const k = S.path.length;
      for (let i = 0; i < k; i++) if (!w.path[i] || !same(w.path[i], S.path[i])) return tap(S.path[k - 1]);
      if (k < w.path.length) return tap(w.path[k]);
      if (w.closed && !S.closed) return tap(w.path[0]);
      return { g: 'tap', p: { id: 'done' } };
    },
    gestureHint(st) { const S = st.p7; if (S && S.cells.length) W3X.tapHint(st, S.cells[Math.floor(S.cells.length / 2)].e); },
    workEls(st) { return st.p7 ? [st.p7.board] : []; },
    wrongLine(q, ans) {
      const j = this.judge(q, ans), a = this.dec(ans);
      if (j === 'none') return '还没拉哦';
      if (j === 'open') return '还没围起来';
      if (j === 'sides') return '这是' + CN[PG.corners(a.path, true).length] + '条边';
      if (j === 'cross') return '皮筋交叉了';
      if (j === 'dir') return '方向不一样哦';
      if (j === 'line') return '要拉另一条哦';
      if (j === 'short') return '再长一点哦';
      return '这里不一样哦';
    },
    async feedback(st, ans) { K.wiggle(st, st.p7.board); W5U.say(st, this.wrongLine(st.q, ans)); await st.scope.wait(T(600)); },
    /* a box over some pegs (for a ring) */
    over(st, pts, pad) {
      const XY = pts.map(p => this.pegXY(st, p)), x0 = Math.min(...XY.map(p => p.x)) - pad, y0 = Math.min(...XY.map(p => p.y)) - pad, x1 = Math.max(...XY.map(p => p.x)) + pad, y1 = Math.max(...XY.map(p => p.y)) + pad;
      const e = W2X.thing(st, 10, 10, 9, ''); e.style.pointerEvents = 'none'; place(e, Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)); return e;
    },
    /* the right shape (or band) for the explanation: L2 / L4 at the place nearest to his corners */
    rightShape(st, ans) {
      const q = st.q, a = this.dec(ans);
      if (q.d === 3) return { pts: NGON[q.sides], closed: true };
      if (q.d === 5) return { pts: this.dec(q.answer).path, closed: false };
      if (q.d === 1 || !a.path.length) return { pts: q.shape, closed: true };
      const nm = PG.norm(q.shape), W = Math.max(...nm.map(p => p[0])), H = Math.max(...nm.map(p => p[1]));
      const mx = a.path.reduce((s, p) => s + p[0], 0) / a.path.length, my = a.path.reduce((s, p) => s + p[1], 0) / a.path.length;
      const cx = nm.reduce((s, p) => s + p[0], 0) / nm.length, cy = nm.reduce((s, p) => s + p[1], 0) / nm.length;
      const ox = Math.max(0, Math.min(q.n - 1 - W, Math.round(mx - cx))), oy = Math.max(0, Math.min(q.n - 1 - H, Math.round(my - cy)));
      return { pts: nm.map(p => [p[0] + ox, p[1] + oy]), closed: true };
    },
    /* a gold drawing of a shape on its own layer (it can slide in from the card) */
    goldShape(st, sh) {
      const g = this.geo(st), e = W2X.thing(st, 10, 10, 12, ''); e.style.pointerEvents = 'none';
      place(e, g.board.x, g.board.y, g.board.w, g.board.h);
      const s = svg('svg', { viewBox: '0 0 ' + g.board.w + ' ' + g.board.h, width: '100%', height: '100%' }, e); s.style.overflow = 'visible';
      const P = p => [(p[0] + 0.5) * g.p, (p[1] + 0.5) * g.p], pts = sh.pts.map(P).map(p => p.join(',')).join(' ');
      const tag = sh.closed ? 'polygon' : 'polyline';
      svg(tag, { points: pts, fill: sh.closed ? 'rgba(255,201,60,.25)' : 'none', stroke: INK, 'stroke-width': 15, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
      svg(tag, { points: pts, fill: 'none', stroke: '#FFC93C', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
      e._svg = s; e._P = P;
      return e;
    },
    async explain(st, ans) {
      const q = st.q, S = st.p7, my = st, a = this.dec(ans), j = this.judge(q, ans);
      const mine = a.path.length ? this.over(st, a.path, 30) : S.board;
      const rings = W5U.blue(st, mine);
      /* 1. what is different: his bands that are not the right shape's flash (sides: counted one by one) */
      const R = this.rightShape(st, ans), rk = new Set(), key = (u, v) => [u.join(','), v.join(',')].sort().join('|');
      R.pts.forEach((p, i) => { if (i || R.closed) rk.add(key(R.pts[(i - 1 + R.pts.length) % R.pts.length], p)); });
      const v = a.closed ? PG.corners(a.path, true) : a.path, edges = v.map((p, i) => (i || a.closed ? [v[(i - 1 + v.length) % v.length], p] : null)).filter(Boolean);
      const lay = S.layer, line = (e, col, w, dash) => { const A = this.pegXY(st, e[0]), B = this.pegXY(st, e[1]); return svg('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': dash || 'none' }, lay); };
      if (j === 'sides') {
        for (let i = 0; i < edges.length; i++) { line(edges[i], W5U.BLUE, 12); Count.say(i + 1); await pause(st, 250); if (!Session.alive(my)) return; }
      } else edges.filter(e => !rk.has(key(e[0], e[1]))).forEach(e => { const l = line(e, W5U.BLUE, 12, '4 16'); st.scope.anim(l, [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 500, iterations: 3 }); });
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      /* 2. the right one in gold: from the card onto the board / counted / with a little train on both bands */
      const gs = this.goldShape(st, R);
      if (S.card && q.d !== 3) { const c = box(S.card), b = box(gs); const k = c.w / b.w; gs.style.transformOrigin = '0 0'; st.scope.anim(gs, [{ transform: 'translate(' + (c.x - b.x) + 'px,' + (c.y - b.y) + 'px) scale(' + k.toFixed(3) + ')' }, { transform: 'translate(0,0) scale(1)' }], { duration: 700, easing: EASE.glide }); }
      else st.scope.anim(gs, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
      if (q.d === 3) {
        W5U.note(st, CN[q.sides] + '条边！');
        for (let i = 0; i < R.pts.length; i++) { const p = R.pts[i], c = this.pegXY(st, [(p[0] + R.pts[(i + 1) % R.pts.length][0]) / 2, (p[1] + R.pts[(i + 1) % R.pts.length][1]) / 2]); const b = W2X.thing(st, 40, 40, 51, 'badge'); b.appendChild(UI.num(i + 1, 26, { plain: true, halo: false })); place(b, Math.round(c.x - 20), Math.round(c.y - 20), 40, 40); Object.assign(b.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#FFF', boxShadow: '0 0 0 3px ' + INK }); Count.say(i + 1); await pause(st, 250); if (!Session.alive(my)) return; }
      } else if (q.d === 5) {
        W5U.note(st, '一样方向');
        const trains = [q.given, R.pts].map(b => { const A = this.pegXY(st, b[0]), B = this.pegXY(st, b[1]), t = W2X.thing(st, 34, 34, 52, ''); Object.assign(t.style, { borderRadius: '10px', background: '#FF6B5B', boxShadow: '0 0 0 3px ' + INK, pointerEvents: 'none' }); place(t, Math.round(A.x - 17), Math.round(A.y - 17), 34, 34); st.scope.anim(t, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + Math.round(B.x - A.x) + 'px,' + Math.round(B.y - A.y) + 'px)' }], { duration: 1100, easing: 'ease-in-out', fill: 'forwards' }); return t; });
        await pause(st, 1150); if (!Session.alive(my)) return; trains.forEach(t => t.remove());
      } else { W5U.note(st, '照这样拉'); await pause(st, 900); if (!Session.alive(my)) return; }
      S.gold = this.over(st, R.pts, 34);
      W5U.gold(st, S.gold);
      await st.scope.wait(600);
    },
    rightEls(st) { return st.p7 && st.p7.gold ? [st.p7.gold] : []; },
    async reveal(st) {
      const S = st.p7, my = st, a = this.dec(st.answer);
      Sfx.reveal();
      if (a.path.length) { S.gold = this.over(st, a.path, 30); W5U.gold(st, S.gold); }
      this.cheerAll(st);
      st.summary = st.q.d === 5 ? '一样方向' : st.q.d === 3 ? CN[st.q.sides] + '条边！' : '拉得一模一样';
      await W5U.sum(st, st.summary); if (!Session.alive(my)) return;
      await st.scope.wait(T(400));
    },
    snap(st) { return { path: st.p7 ? this.enc(st.p7.path, st.p7.closed) : '' }; },
    lines() {
      const out = [this.intro, '照着拉，从星星开始！', '照着样子拉！', '再拉一条路！', '和它一样方向！', '还没拉哦', '还没围起来', '皮筋交叉了', '方向不一样哦', '要拉另一条哦', '再长一点哦', '这里不一样哦', '照这样拉', '一样方向', '拉得一模一样'].concat(this.praise);
      for (let k = 3; k <= 10; k++) out.push('这是' + CN[k] + '条边');
      [3, 4, 5].forEach(k => out.push('拉一个' + CN[k] + '条边的！', CN[k] + '条边！'));
      return uniq(out);
    },
  };
})();
/* ================================================================ ② Bluey·积木院 (bluey5, from level 1): B5 左手右手 · B6 发生了什么 ·
   B7 风筝线团 · B8 找不同 (reasoning). docs/W5-DESIGN.md §5 ②. Everything inside one function: no top-level names (all the
   islands share one script); each rule is W5R.<id>, registered (background, friends, icon, review card) in games.js. The parts
   follow W5R.P8 (raw/js/w5/peppa.js): gen / audit / geo / present / place / onGesture / next / feedback / explain / reveal /
   rightEls / lines. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C', BLUE = '#4FB3FF';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const S4 = 'stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"';
  /* a pause inside one step of the explanation (Scope.wait would end the step-by-step beat there); a tap skips it */
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine) */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));
  const pause = (st, ms) => (st.ff || fast() ? Promise.resolve() : new Promise(r => st.scope.timeout(r, ms)));
  /* a positioned piece of the question (an svg drawing in it, stretched to its box) */
  const piece = (st, z, inner, vw, vh) => { const e = W2X.thing(st, 10, 10, z, ''); if (inner != null) e.innerHTML = '<svg viewBox="0 0 ' + vw + ' ' + vh + '" width="100%" height="100%" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none">' + inner + '</svg>'; return e; };
  const gridXY = (n, per, cx, cy, w, h, gx, gy) => W5U.grid(n, cx, cy, w, h, gx, gy, per);

  /* ---------------------------------------------------------------- B5 找！ 左手右手 (F14 Lucky Ring: left and right - one's own,
     and the left and right of someone facing you). Five block figures (a generic toy: square head, square body, two mittens,
     two legs; a face in front, hair at the back), something in each hand: "谁右手拿着气球？" - tap a figure.
       L1 all five with their backs to you (their right hand is on your right), 3 kinds of things; exactly one has a balloon in
       its right hand, at least one has it in its left · L2 all five face you (first question: "它们看着你哦！") · L3 some face
       you, some not · L4 two conditions: "右手拿气球，" "左手拿花的是谁？" · L5 nothing in the hands: a kitten / teddy / ball on
       the ground on its own left or right: "谁的左边有小猫？".
     L1-L2: the task card shows a figure from the back, the asked hand glowing (what "right hand" means); from L3 only the
     thing. The right figure's place and the asked hand (left / right) come from bags. Wrong: his figure ringed blue, it lifts
     the hand he took for the asked one ("这是它的左手" / "它右手拿着花"); a figure that faces you turns round ("它面对着你"
     "转过来看看") - its hands change sides on the screen; the right figure ringed gold lifts the asked hand ("它右手拿气球"). */
  const IT = { balloon: '气球', flower: '花', icecream: '冰淇淋', ball: '球', flag: '小旗' };
  const GR = { kitten: '小猫', teddy: '小熊', ball: '球' };
  const HW = { L: '左', R: '右' };
  const FLAG = W2X.icon('<path d="M30 92V10" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M32 12L86 28L32 46Z" fill="#FF6B5B" ' + S4 + '/><circle cx="30" cy="9" r="6" fill="' + GOLD + '" ' + S4 + '/>');
  const itemSrc = k => (k === 'flag' ? FLAG : W5U.prop(k));
  const SHIRT = ['#FF6B5B', '#4FB3FF', '#5CC46E', '#B57BFF', '#FF9F43'];
  /* a block figure (viewBox 100 x 160): .arms[0] is the arm on the screen's left, .arms[1] on the right (each with its mitten
     and what it holds) - its OWN right hand is on the screen's left when it faces you */
  const FIG = (front, color, hold) => {
    const s = svg('svg', { viewBox: '0 0 100 160', width: '100%', height: '100%' }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
    const R = (x, y, w, h, rx, fill, p) => svg('rect', { x, y, width: w, height: h, rx, fill, stroke: INK, 'stroke-width': 4 }, p || s);
    R(34, 112, 13, 40, 4, '#2E3A6B'); R(53, 112, 13, 40, 4, '#2E3A6B');
    R(26, 62, 48, 54, 8, color);
    s.arms = [10, 76].map((x, k) => {
      const g = svg('g', {}, s); g.style.transformBox = 'view-box'; g.style.transformOrigin = (x + 7) + 'px 66px';
      R(x, 66, 14, 40, 6, color, g); R(x - 3, 102, 20, 18, 8, '#FFC93C', g);
      const own = (k === 0) === !!front ? 'R' : 'L', it = hold && hold[own];
      if (it) { const im = svg('image', { href: itemSrc(it), x: x + 7 - 22, y: 84, width: 44, height: 44 }, g); im.setAttribute('preserveAspectRatio', 'xMidYMid meet'); }
      return g;
    });
    R(30, 16, 40, 42, 8, '#FFD9A8'); R(40, 8, 20, 10, 3, '#FFD9A8');
    if (front) { svg('circle', { cx: 42, cy: 34, r: 3.6, fill: INK }, s); svg('circle', { cx: 58, cy: 34, r: 3.6, fill: INK }, s); svg('path', { d: 'M42 45Q50 51 58 45', stroke: INK, 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round' }, s); }
    else svg('path', { d: 'M30 38V24Q30 16 38 16H62Q70 16 70 24V38Z', fill: '#6B4A2E', stroke: INK, 'stroke-width': 4 }, s);
    return s;
  };
  const B5L = [null, { face: 'back' }, { face: 'front' }, { face: 'mix' }, { face: 'mix', two: true }, { face: 'mix', ground: true }];
  W5R.B5 = {
    kind0: 'lr5', verb: '找！', intro: '分清左和右！', praise: ['左右分得清！'], props: ['balloon', 'flower', 'icecream', 'ball', 'kitten', 'teddy'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, L = B5L[d], at = W5U.at(G, 5, 'b5p' + d);
      const faces = L.face === 'back' ? [0, 0, 0, 0, 0] : L.face === 'front' ? [1, 1, 1, 1, 1] : rng.shuffle([1, 1, 0, 0, rng.int(0, 1)]);
      const H = bagPick(G, 'b5h' + d, ['L', 'R']), O = H === 'L' ? 'R' : 'L';
      for (let t = 0; t < 200; t++) {
        let men, ask;
        if (L.ground) {
          const Z = rng.pick(Object.keys(GR));
          men = Array.from({ length: 5 }, () => ({ g: rng.pick(Object.keys(GR)), side: rng.pick(['L', 'R']) }));
          men[at] = { g: Z, side: H };
          const dz = rng.pick([0, 1, 2, 3, 4].filter(i => i !== at)); men[dz] = { g: Z, side: O };
          ask = { g: Z, side: H };
        } else {
          const kinds = rng.shuffle(Object.keys(IT)).slice(0, d === 1 ? 3 : 4), X = kinds[0], Y = rng.pick(kinds.slice(1).filter(k => k !== 'icecream' && (X !== 'icecream' || IT[k].length === 1)).concat(X === 'icecream' ? ['flower'] : []));
          const any = () => rng.pick(kinds);
          men = Array.from({ length: 5 }, () => ({ L: any(), R: any() }));
          const others = rng.shuffle([0, 1, 2, 3, 4].filter(i => i !== at));
          if (L.two) {
            men[at] = { [H]: X, [O]: Y };
            men[others[0]] = { [H]: X, [O]: any() }; men[others[1]] = { [H]: any(), [O]: Y }; men[others[2]] = { [H]: Y, [O]: X };
            ask = { X, H, Y, O };
          } else {
            men[at] = { [H]: X, [O]: any() };
            men[others[0]] = { [H]: any(), [O]: X };
            ask = { X, H };
          }
        }
        men.forEach((m, i) => { m.front = faces[i]; m.color = SHIRT[i]; });
        const q = { d, men, ask, answer: at, opts: [0, 1, 2, 3, 4] };
        if (this.right(q).length !== 1 || this.right(q)[0] !== at) continue;
        /* every condition is met by someone else too (a figure that has it the other way round or only half) */
        if (L.ground ? !men.some((m, i) => i !== at && m.g === ask.g) : !men.some((m, i) => i !== at && (m[O] === ask.X || m.L === ask.X || m.R === ask.X))) continue;
        q.k = [d, H, men.map(m => (m.front ? 'f' : 'b') + (L.ground ? m.g[0] + m.side : m.L.slice(0, 2) + m.R.slice(0, 2))).join('.')];
        return q;
      }
      return null;
    },
    /* the figures that meet the question */
    ok(q, m) { const a = q.ask; if (q.d === 5) return m.g === a.g && m.side === a.side; return m[a.H] === a.X && (!a.Y || m[a.O] === a.Y); },
    right(q) { return q.men.map((m, i) => (this.ok(q, m) ? i : -1)).filter(i => i >= 0); },
    audit(q) { return [{ n: 5, at: q.answer, right: this.right(q).length }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo() {
      const L = K.L();
      return L ? { w: 140, h: 224, gap: 24, cx: 512, cy: 392, uw: 196, uh: 210, ugap: 22, rows: [258, 486] } : { w: 124, h: 198, gap: 10, cx: 352, cy: 560, uw: 196, uh: 210, ugap: 14, rows: [420, 650] };
    },
    /* a figure's unit: the figure (and in L5 its mat with the thing on the ground beside its feet) */
    unitInner(q, m) {
      if (q.d !== 5) return null;
      const scr = m.front ? (m.side === 'L' ? 'R' : 'L') : m.side;    /* its own left, on the screen */
      return { scr };
    },
    draw(st, i) {
      const q = st.q, m = q.men[i], e = st.units[i];
      e.innerHTML = '';
      if (q.d === 5) {
        const mat = el('div', '', e); Object.assign(mat.style, { position: 'absolute', left: '2%', right: '2%', bottom: '0', height: '20%', borderRadius: '50%', background: 'rgba(255,248,236,.75)', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none' });
        const fw = el('div', '', e); Object.assign(fw.style, { position: 'absolute', left: '22%', width: '56%', top: '0', height: '94%', pointerEvents: 'none' }); fw.appendChild(FIG(m.front, m.color, null));
        const scr = this.unitInner(q, m).scr, gi = W5U.propImg(m.g); gi.style.objectPosition = '50% 100%';
        const gw = el('div', '', e); Object.assign(gw.style, { position: 'absolute', width: '30%', height: '30%', bottom: '4%', pointerEvents: 'none' }); gw.style[scr === 'L' ? 'left' : 'right'] = '-2%'; gw.appendChild(gi);
        e._fig = fw.firstChild; e._g = gw; e._gside = scr;
      } else { e.appendChild(FIG(m.front, m.color, m)); e._fig = e.firstChild; }
    },
    place(st) {
      if (!st.units) return;
      const g = this.geo(), q = st.q;
      if (q.d === 5) { const top = gridXY(5, 3, g.cx, 0, g.uw, g.uh, g.ugap, 0); st.units.forEach((e, i) => place(e, top[i].x, (i < 3 ? g.rows[0] : g.rows[1]) - g.uh / 2, g.uw, g.uh)); }
      else W5U.lay(st.units, g.cx, g.cy, g.w, g.h, g.gap, 0);
    },
    askLines(q) {
      const a = q.ask;
      if (q.d === 5) return ['谁的' + HW[a.side] + '边有' + GR[a.g] + '？'];
      if (q.d === 4) return [HW[a.H] + '手拿' + IT[a.X] + '，', HW[a.O] + '手拿' + IT[a.Y] + '的是谁？'];
      return ['谁' + HW[a.H] + '手拿着' + IT[a.X] + '？'];
    },
    /* the task card: L1-L2 a figure from the back with the asked hand glowing and the thing in it; then only the thing(s) */
    taskCard(st) {
      const q = st.q, a = q.ask;
      if (q.d <= 2) {
        const d = el('span', ''); Object.assign(d.style, { position: 'relative', display: 'inline-block', width: '62px', height: '98px' });
        const f = FIG(false, '#C9D3E0', { [a.H]: a.X }); d.appendChild(f);
        const arm = f.arms[a.H === 'R' ? 1 : 0]; arm.style.filter = 'drop-shadow(0 0 6px #FFC93C) drop-shadow(0 0 3px #FFC93C)';
        return K.task(st, [[{ node: d }], ['q']]);
      }
      if (q.d === 5) return K.task(st, [[W5U.prop(a.g)], ['q']]);
      if (q.d === 4) return K.task(st, [[itemSrc(a.X)], [itemSrc(a.Y)], ['q']]);
      return K.task(st, [[itemSrc(a.X)], ['q']]);
    },
    async present(st) {
      const q = st.q, G = st.G;
      st.units = q.men.map((m, i) => { const e = W2X.thing(st, 10, 10, 6, ''); K.reg(st, 'm' + i, e, {}); return e; });
      st.units.forEach((e, i) => this.draw(st, i));
      this.place(st);
      st.units.forEach((e, i) => K.pop(st, e, 60 * i));
      this.taskCard(st);
      const ls = this.askLines(q);
      if (q.d === 2 && !G.b5front) { G.b5front = true; W3X.say2(st, '它们看着你哦！', ls[0]); }
      else if (ls.length > 1) W3X.say2(st, ls[0], ls[1]);
      else K.say(st, ls[0]);
    },
    onGesture(st, name, p) {
      const i = /^m\d$/.test(p.id || '') ? +p.id.slice(1) : -1;
      if (name !== 'tap' || i < 0 || st.picked) return false;
      st.picked = true; K.hop(st, st.units[i], 10); Session.submit(st, i); return 'ok';
    },
    next(st, strat) { if (st.picked || !st.units) return null; const q = st.q; return { g: 'tap', p: { id: 'm' + (strat === 'wrong' ? (q.answer + 1 + (st.gen % 4)) % 5 : q.answer) } }; },
    /* what his figure really has (the first condition it misses) */
    wrongLine(q, i) {
      const m = q.men[i], a = q.ask;
      if (q.d === 5) {
        if (m.g === a.g) return GR[a.g] + '在它' + HW[m.side] + '边';
        return m.side === a.side ? '它的' + HW[a.side] + '边是' + GR[m.g] : '它' + HW[a.side] + '边什么也没有';
      }
      if (m[a.H] !== a.X) return m[a.H === 'L' ? 'R' : 'L'] === a.X ? '这是' + HW[a.H === 'L' ? 'R' : 'L'] + '手哦' : '它' + HW[a.H] + '手拿着' + IT[m[a.H]];
      return '它' + HW[a.O] + '手拿着' + IT[m[a.O]];
    },
    /* a hand lifts (screen side 0 / 1); in L5 the thing on that side glows */
    lift(st, i, scr, color) {
      const e = st.units[i];
      if (st.q.d === 5) { const b = box(e), gl = W2X.thing(st, 10, 10, 7, ''); gl.style.pointerEvents = 'none'; place(gl, Math.round(scr ? b.x + b.w * 0.66 : b.x), Math.round(b.y + b.h * 0.6), Math.round(b.w * 0.34), Math.round(b.h * 0.4)); return W5U.ring(st, gl, color || GOLD, 4); }
      const arm = e._fig && e._fig.arms && e._fig.arms[scr];
      if (arm) st.scope.anim(arm, [{ transform: 'translateY(0)' }, { transform: 'translateY(-34px)', offset: 0.35 }, { transform: 'translateY(-34px)', offset: 0.8 }, { transform: 'translateY(0)' }], { duration: 1300, easing: 'ease-in-out' });
      Sfx.pop();
      return null;
    },
    /* a figure that faces you turns round (0.6 s): its hands change sides on the screen */
    async turn(st, i) {
      const my = st, e = st.units[i], m = st.q.men[i];
      await st.scope.anim(e, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.05)' }], { duration: 300, easing: EASE.glide }); if (!Session.alive(my)) return;
      m.front = 0; this.draw(st, i);
      await st.scope.anim(e, [{ transform: 'scaleX(0.05)' }, { transform: 'scaleX(1)' }], { duration: 300, easing: EASE.glide });
    },
    async feedback(st, ans) { K.wiggle(st, st.units[ans]); W5U.say(st, this.wrongLine(st.q, ans)); await st.scope.wait(T(600)); },
    /* the screen side (0 left / 1 right) of a figure's own hand / side */
    scr(m, own) { return (own === 'R') === !m.front ? 1 : 0; },
    async explain(st, ans) {
      const q = st.q, my = st, a = q.ask, H = q.d === 5 ? a.side : a.H, m = q.men[ans], R = q.men[q.answer];
      /* 1. his figure lifts the hand on YOUR side H (the one he took for its H): what it really is */
      W5U.blue(st, st.units[ans]);
      /* the hand (side) he took for H: the one with the asked thing in it, else the one on his own H side of the screen */
      const F = H === 'L' ? 'R' : 'L', took = q.d === 5 ? (m.g === a.g ? m.side : m.front ? F : H) : m[F] === a.X && m[H] !== a.X ? F : m[H] === a.X ? a.O : (m.front ? F : H);
      const blueRing = this.lift(st, ans, this.scr(m, took), BLUE);
      await fbDone(st); if (!Session.alive(my)) return;
      if (blueRing) W5U.hide(blueRing);
      /* 2. one that faces you turns round */
      const who = m.front ? ans : R.front ? q.answer : -1;
      if (who >= 0) {
        W5U.note(st, '它面对着你');
        await this.turn(st, who); if (!Session.alive(my)) return;
        await st.scope.wait(400); if (!Session.alive(my)) return;
      } else {
        /* nobody faces you: his figure lifts its own H hand (side) - what is really there */
        const say = q.d === 5 ? (m.side === H ? '它的' + HW[H] + '边是' + GR[m.g] : '它' + HW[H] + '边什么也没有') : '它' + HW[H] + '手拿着' + IT[m[H]];
        const r2 = this.lift(st, ans, this.scr(m, H), BLUE); if (say !== st.fbLine) W5U.note(st, say); else W5U.beat(st);
        await st.scope.wait(700); if (!Session.alive(my)) return; if (r2) W5U.hide(r2);
      }
      /* 3. the right one, gold: it lifts its own H hand */
      W5U.gold(st, st.units[q.answer]);
      this.lift(st, q.answer, this.scr(R, H));
      if (q.d === 4) this.lift(st, q.answer, this.scr(R, a.O));
      for (const l of this.rightLines(q)) { await W5U.sum(st, l); if (!Session.alive(my)) return; }
      await st.scope.wait(200);
    },
    rightLines(q) {
      const a = q.ask;
      if (q.d === 5) return ['它的' + HW[a.side] + '边有' + GR[a.g]];
      if (q.d === 4) return ['两只手都对！'];
      return ['它' + HW[a.H] + '手拿' + IT[a.X]];
    },
    rightEls(st) { return [st.units[st.q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st, R = q.men[q.answer];
      Sfx.reveal(); W5U.gold(st, st.units[q.answer]);
      this.lift(st, q.answer, this.scr(R, q.d === 5 ? q.ask.side : q.ask.H));
      this.cheerAll(st);
      const ls = this.rightLines(q); st.summary = ls[ls.length - 1];
      for (const l of ls) { await W5U.sum(st, l); if (!Session.alive(my)) return; }
      await st.scope.wait(T(400));
    },
    workEls(st) { return st.units || []; },
    snap(st) { return { men: st.q.men.map(m => (m.front ? 'f' : 'b')) }; },
    lines() {
      const out = [this.intro, '它们看着你哦！', '它面对着你', '两只手都对！'].concat(this.praise), K2 = Object.keys(IT);
      ['L', 'R'].forEach(h => {
        const o = h === 'L' ? 'R' : 'L';
        out.push('这是' + HW[h] + '手哦', '这是它的' + HW[h] + '手', '这是它的' + HW[h] + '边', '它' + HW[h] + '边什么也没有');
        K2.forEach(x => { out.push('谁' + HW[h] + '手拿着' + IT[x] + '？', '它' + HW[h] + '手拿着' + IT[x], '它' + HW[h] + '手拿' + IT[x], HW[h] + '手拿' + IT[x] + '，'); if (x !== 'icecream') out.push(HW[o] + '手拿' + IT[x] + '的是谁？'); });
        Object.keys(GR).forEach(g => out.push('谁的' + HW[h] + '边有' + GR[g] + '？', '它的' + HW[h] + '边是' + GR[g], '它的' + HW[h] + '边有' + GR[g], GR[g] + '在它' + HW[h] + '边'));
      });
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- B6 变！ 发生了什么 (S11 / S8 / S16: pictures and a story -
     the step after acting it out). Two instant photos of the same place - "之前" and "之后" (ducks on the pond, chicks on the
     bench, bunnies in the garden) - and five event cards: a little block door with an arrow in + n dots = n came; an arrow out
     + n dots = n went; two equal little photos = nothing changed. "发生了什么？" - tap a card.
       L1 1-4 before, 1-2 came or went (from a bag), at most 5; the places stay (who came stands at the end, who went was at the
       end) · L2 at most 6, 1-3; the after photo is arranged anew (no empty places to see) · L3 at most 8; maybe nothing
       changed (about 1 in 5, the arrangement changed) · L4 the before photo is shown 2 s and turned over: "记住有几只！" ·
       L5 the before photo is only a number card; at most 10 - count on or back from a number.
     The five cards: right; the same way ±1; the other way, the same number; nothing changed (the right card's place from a
     bag). Wrong: his card ringed blue; before and after joined one to one - what is more in after sparkles (came, counted on:
     "多了两只，是来了"), what is not there any more in before turns into a grey dashed outline and walks out of the door
     (went, counted back: "少了两只，是走了"); "没有来也没有走"; the right card ringed gold ("来了两只"). */
  const B6A = ['duck', 'chick', 'bunny'], B6N = { duck: '小鸭', chick: '小鸡', bunny: '小兔' };
  const SCENE = {
    duck: '<rect width="300" height="190" fill="#BFE7A2"/><ellipse cx="160" cy="104" rx="132" ry="74" fill="#7CC8F2" stroke="#4FA6D6" stroke-width="6"/><path d="M60 92Q80 86 100 92M190 132Q210 126 230 132" stroke="#E6F6FF" stroke-width="4" fill="none"/>',
    chick: '<rect width="300" height="190" fill="#BFE7A2"/><rect x="18" y="98" width="272" height="20" rx="6" fill="#C98B4A" stroke="' + INK + '" stroke-width="4"/><rect x="18" y="150" width="272" height="20" rx="6" fill="#C98B4A" stroke="' + INK + '" stroke-width="4"/><path d="M40 170V188M268 170V188" stroke="' + INK + '" stroke-width="6"/>',
    bunny: '<rect width="300" height="190" fill="#A8D98A"/><path d="M14 70H292M14 112H292M14 154H292" stroke="#8A5A2B" stroke-width="10" stroke-linecap="round" opacity=".45"/>',
  };
  const DOOR6S = '<rect x="2" y="54" width="28" height="84" rx="6" fill="#FFC93C" ' + S4 + '/><path d="M8 138V80Q8 68 16 68Q24 68 24 80V138Z" fill="#5A3A22"/>';
  /* the 10 places in a photo (2 rows of 5), in the photo's own units (300 x 190) */
  const SLOT6 = i => ({ x: 62 + (i % 5) * 54, y: Math.floor(i / 5) ? 136 : 62 });
  const EVT = {
    came: '<rect x="6" y="10" width="34" height="58" rx="6" fill="#FFC93C" ' + S4 + '/><path d="M13 68V34Q13 24 23 24Q33 24 33 34V68Z" fill="#5A3A22"/><path d="M42 40H86M72 26L88 40L72 54" fill="none" stroke="#5CC46E" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 6L69 14L77 15L71 20L73 28L66 24L59 28L61 20L55 15L63 14Z" fill="#FFF3A8" stroke="' + INK + '" stroke-width="2"/>',
    went: '<rect x="6" y="10" width="34" height="58" rx="6" fill="#FFC93C" ' + S4 + '/><path d="M13 68V34Q13 24 23 24Q33 24 33 34V68Z" fill="#5A3A22"/><path d="M90 40H46M58 26L44 40L58 54" fill="none" stroke="#9AA3AD" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
    same: '<rect x="4" y="18" width="38" height="46" rx="5" fill="#FFF" ' + S4 + '/><rect x="58" y="18" width="38" height="46" rx="5" fill="#FFF" ' + S4 + '/><circle cx="23" cy="40" r="9" fill="#FFC93C" stroke="' + INK + '" stroke-width="3"/><circle cx="77" cy="40" r="9" fill="#FFC93C" stroke="' + INK + '" stroke-width="3"/><path d="M45 34H55M45 46H55" stroke="' + INK + '" stroke-width="4"/>',
  };
  const B6L = [null, { max: 5, nMax: 2, kinds: ['came', 'went'] }, { max: 6, nMax: 3, kinds: ['came', 'went'] }, { max: 8, nMax: 3, kinds: ['came', 'went', 'came', 'went', 'same'] }, { max: 8, nMax: 3, kinds: ['came', 'went', 'came', 'went', 'same'] }, { max: 10, nMax: 3, kinds: ['came', 'went', 'came', 'went', 'same'] }];
  W5R.B6 = {
    kind0: 'what5', verb: '变！', intro: '发生了什么？', praise: ['看得真明白！'], props: B6A.slice(),
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, L = B6L[d], kind = bagPick(G, 'b6k' + d, L.kinds), who = rng.pick(B6A);
      let b, n = 0;
      if (kind === 'same') { b = rng.int(2, L.max); }
      else { n = rng.int(1, L.nMax); b = kind === 'came' ? rng.int(1, L.max - n) : rng.int(n + 1, d === 1 ? 4 : L.max); if (d === 1) b = Math.min(b, 4); }
      const a = kind === 'came' ? b + n : kind === 'went' ? b - n : b;
      /* the places: L1 kept (who came at the end, who went from the end); else the after photo arranged anew */
      const pb = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, b).sort((x, y) => x - y);
      const before = d === 1 ? Array.from({ length: b }, (_, i) => i) : pb;
      const after = d === 1 ? Array.from({ length: a }, (_, i) => i) : (() => { for (let t = 0; t < 20; t++) { const pa = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, a).sort((x, y) => x - y); if (pa.join() !== pb.slice(0, a).join()) return pa; } return rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, a).sort((x, y) => x - y); })();
      const right = kind === 'same' ? 's' : kind[0] + n;
      /* the others: the same way ±1, the other way with the same number, nothing changed */
      const cands = [], dir = kind === 'same' ? null : kind[0], other = dir === 'c' ? 'w' : 'c';
      const okc = v => v !== right && !cands.includes(v) && (v === 's' || (+v.slice(1) >= 1 && (v[0] === 'c' ? b + +v.slice(1) <= 10 : +v.slice(1) <= b)));
      const add = v => { if (okc(v)) cands.push(v); };
      if (dir) { add(dir + (n - 1)); add(dir + (n + 1)); add(other + n); add('s'); add(dir + (n + 2)); add(other + (n + 1)); add(other + (n - 1)); add(dir + (n + 3)); }
      else { add('c1'); add('w1'); add('c2'); add('w2'); add('c3'); add('w3'); }
      for (let k = 1; k <= 6 && cands.length < 4; k++) { add('c' + k); add('w' + k); }
      const opts = W5U.deal(G, right, cands.slice(0, 4), 'b6p' + d);
      const q = { d, kind, who, b, n, a, before, after, answer: right, opts, k: [d, kind, who, b, n, after.join('')] };
      if (kind !== 'same') q.fact = factOf(kind === 'came' ? '+' : '-', b, n);
      return q;
    },
    audit(q) { return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.opts.filter(v => v === q.answer).length }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo() {
      const L = K.L();
      return L ? { ph: [{ x: 58, y: 108, w: 412, h: 302 }, { x: 554, y: 108, w: 412, h: 302 }], arrow: { x: 482, y: 230, w: 60, h: 60 }, cardCy: 604 }
        : { ph: [{ x: 180, y: 198, w: 344, h: 252 }, { x: 180, y: 478, w: 344, h: 252 }], arrow: { x: 330, y: 450, w: 44, h: 28 }, cardCy: 812 };
    },
    /* a photo: the white frame, its scene (with the little door on the left) and its label dot */
    photoEl(st, k) {
      const e = W2X.thing(st, 10, 10, 2, ''); e.style.pointerEvents = 'none';
      e.innerHTML = '<svg viewBox="0 0 336 246" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;left:0;top:0"><rect x="3" y="3" width="330" height="240" rx="10" fill="#FFF" ' + S4 + '/><g transform="translate(18 16)">' + SCENE[st.q.who] + '<g transform="translate(-4 20)">' + DOOR6S + '</g></g><circle cx="168" cy="226" r="8" fill="' + (k ? '#FF6B5B' : '#9AA3AD') + '"/></svg>';
      return e;
    },
    /* where a thing at place i of photo k is (stage px) */
    slotRect(st, k, i) { const g = this.geo().ph[k], s = SLOT6(i), sx = g.w / 336, sy = g.h / 246, w = 56 * sx; return { x: Math.round(g.x + (18 + s.x) * sx - w / 2), y: Math.round(g.y + (16 + s.y) * sy - w / 2), w: Math.round(w), h: Math.round(w) }; },
    doorXY(k) { const g = this.geo().ph[k], sx = g.w / 336, sy = g.h / 246; return { x: g.x + (18 + 12) * sx, y: g.y + (16 + 20 + 104) * sy }; },
    place(st) {
      if (!st.photos) return;
      const g = this.geo(), q = st.q;
      st.photos.forEach((e, k) => place(e, g.ph[k].x, g.ph[k].y, g.ph[k].w, g.ph[k].h));
      if (st.arrow) place(st.arrow, g.arrow.x, g.arrow.y, g.arrow.w, g.arrow.h);
      st.items.forEach((list, k) => list.forEach(it => { const r = this.slotRect(st, k, it.slot); place(it.e, r.x, r.y, r.w, r.h); }));
      if (st.numCard) { const r = g.ph[0]; place(st.numCard, r.x + r.w / 2 - 70, r.y + r.h / 2 - 80, 140, 160); }
      if (st.back) place(st.back, g.ph[0].x, g.ph[0].y, g.ph[0].w, g.ph[0].h);
      if (st.cards) { const r = W5U.row5(K.L()); W5U.lay(st.cards, Stage.W / 2, g.cardCy, r.s, r.s, r.gap); }
    },
    itemEl(st, k, slot) { const e = W2X.thing(st, 10, 10, 6, ''); e.style.pointerEvents = 'none'; const im = W5U.propImg(st.q.who); e.appendChild(im); return { e, slot }; },
    cardNode(v) {
      const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', pointerEvents: 'none' });
      const kind = v === 's' ? 'same' : v[0] === 'c' ? 'came' : 'went';
      d.innerHTML = '<svg viewBox="0 0 100 74" width="84" height="62">' + EVT[kind] + '</svg>';
      if (kind !== 'same') { const n = +v.slice(1), per = n > 4 ? Math.ceil(n / 2) : n, s2 = svg('svg', { viewBox: '0 0 ' + (per * 20) + ' ' + (n > per ? 40 : 20), width: per * 18, height: n > per ? 36 : 18 }, d); for (let i = 0; i < n; i++) svg('circle', { cx: 10 + (i % per) * 20, cy: 10 + Math.floor(i / per) * 20, r: 7.5, fill: kind === 'came' ? '#5CC46E' : '#9AA3AD', stroke: INK, 'stroke-width': 2.5 }, s2); }
      return d;
    },
    async present(st) {
      const q = st.q, my = st;
      st.photos = [this.photoEl(st, 0), this.photoEl(st, 1)];
      st.arrow = W2X.thing(st, 10, 10, 4, ''); st.arrow.innerHTML = '<svg viewBox="0 0 60 60" width="100%" height="100%" style="pointer-events:none">' + (K.L() ? '<path d="M8 30H48M36 16L52 30L36 44" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M30 6V50M16 38L30 54L44 38" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>') + '</svg>';
      st.items = [q.before.map(s => this.itemEl(st, 0, s)), q.after.map(s => this.itemEl(st, 1, s))];
      if (q.d === 5) { st.items[0].forEach(it => { it.e.style.visibility = 'hidden'; }); st.numCard = W2X.thing(st, 10, 10, 7, 'card'); st.numCard.style.pointerEvents = 'none'; st.numCard.appendChild(UI.qty(q.b, 96)); }
      W5U.cards(st, q.opts.map(v => this.cardNode(v)), q.opts);
      this.place(st);
      if (q.d === 4) {
        st.photos[1].style.visibility = 'hidden'; st.items[1].forEach(it => { it.e.style.visibility = 'hidden'; }); st.cards.forEach(c => { c.style.visibility = 'hidden'; });
        K.pop(st, st.photos[0]); st.items[0].forEach((it, i) => K.pop(st, it.e, 40 * i));
        K.task(st, [[W5U.prop(q.who)], ['q']]);
        K.say(st, '记住有几只！');
        await st.scope.wait(T(2000)); if (!Session.alive(my)) return;
        await this.flip(st, true); if (!Session.alive(my)) return;
        st.photos[1].style.visibility = ''; st.items[1].forEach(it => { it.e.style.visibility = ''; }); st.cards.forEach(c => { c.style.visibility = ''; });
        K.pop(st, st.photos[1]); st.items[1].forEach((it, i) => K.pop(st, it.e, 40 * i)); st.cards.forEach((c, i) => K.pop(st, c, 200 + 60 * i));
        K.say(st, '发生了什么？');
        return;
      }
      K.pop(st, st.photos[0]); K.pop(st, st.photos[1], 120); st.items.forEach((l, k) => l.forEach((it, i) => K.pop(st, it.e, 120 * k + 40 * i)));
      st.cards.forEach((c, i) => K.pop(st, c, 300 + 60 * i));
      K.task(st, [[W5U.prop(q.who)], ['q']]);
      K.say(st, '发生了什么？');
    },
    /* L4: the before photo turns over (face down: a block pattern) and back */
    async flip(st, down) {
      const my = st, P = st.photos[0];
      await st.scope.anim(P, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.04)' }], { duration: 220 }); if (!Session.alive(my)) return;
      if (down) { st.back = W2X.thing(st, 10, 10, 8, ''); st.back.style.pointerEvents = 'none'; st.back.innerHTML = '<svg viewBox="0 0 336 246" width="100%" height="100%" preserveAspectRatio="none"><rect x="3" y="3" width="330" height="240" rx="10" fill="#4FB3FF" ' + S4 + '/><g fill="#FFF" opacity=".35"><circle cx="70" cy="70" r="22"/><circle cx="168" cy="70" r="22"/><circle cx="266" cy="70" r="22"/><circle cx="70" cy="176" r="22"/><circle cx="168" cy="176" r="22"/><circle cx="266" cy="176" r="22"/></g><text x="168" y="140" font-size="72" font-weight="900" text-anchor="middle" fill="#FFF">?</text></svg>'; this.place(st); st.items[0].forEach(it => { it.e.style.visibility = 'hidden'; }); }
      else { if (st.back) st.back.remove(); st.back = null; st.items[0].forEach(it => { it.e.style.visibility = ''; }); }
      await st.scope.anim(down ? st.back : P, [{ transform: 'scaleX(0.04)' }, { transform: 'scaleX(1)' }], { duration: 220 });
    },
    onGesture(st, name, p) { return W5U.tapCard(st, name, p); },
    next(st, strat) { if (st.cards && st.cards[0].style.visibility === 'hidden') return null; return W5U.cardNext(st, strat); },
    say(v) { return v === 's' ? '没有变' : (v[0] === 'c' ? '来了' : '走了') + CNQ(+v.slice(1)) + '只'; },
    wrongLine(q, v) {
      if (v === 's') return '数量变了哦';
      if (q.kind === 'same') return v[0] === 'c' ? '不是来了哦' : '不是走了哦';
      if (v[0] !== q.answer[0]) return v[0] === 'c' ? '不是来了哦' : '不是走了哦';
      return '不是' + this.say(v);
    },
    async feedback(st, ans) { const c = W5U.cardOf(st, ans); if (c) K.wiggle(st, c); W5U.say(st, this.wrongLine(st.q, ans)); await st.scope.wait(T(600)); },
    async explain(st, ans) {
      const q = st.q, my = st, B = st.items[0], A = st.items[1];
      const rings = W5U.blue(st, W5U.cardOf(st, ans));
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      /* 2. the before photo face up again (L4) / the number card turned into its picture (L5), then one to one */
      if (st.back) { await this.flip(st, false); if (!Session.alive(my)) return; }
      if (st.numCard) { st.numCard.remove(); st.numCard = null; B.forEach((it, i) => { it.e.style.visibility = ''; K.pop(st, it.e, 30 * i); }); await pause(st, 300); if (!Session.alive(my)) return; }
      const m = Math.min(B.length, A.length), s = K.lines(st);
      for (let i = 0; i < m; i++) { const a = W5U.rect(B[i].e), b = W5U.rect(A[i].e); K.link(st, s, { x: a.x + a.w / 2, y: a.y + a.h / 2 }, { x: b.x + b.w / 2, y: b.y + b.h / 2 }, '#B57BFF'); }
      await pause(st, 100); if (!Session.alive(my)) return;
      if (q.kind === 'same') W5U.note(st, '没有来也没有走');
      else if (q.kind === 'came') {
        W5U.note(st, '多了' + CNQ(q.n) + '只，是来了');
        for (let i = m; i < A.length; i++) { W5U.came(st, A[i].e); K.badge(st, A[i].e, i + 1, 0, -4, 36); Count.say(i + 1); await pause(st, 260); if (!Session.alive(my)) return; }
      } else {
        W5U.note(st, '少了' + CNQ(q.n) + '只，是走了');
        const dd = this.doorXY(0);
        for (let i = B.length - 1; i >= m; i--) { W5U.leave(st, B[i].e, dd.x, dd.y, 340); Count.say(i); await pause(st, 260); if (!Session.alive(my)) return; }
        const fr = W5U.stay(st, B.slice(0, m).map(it => it.e)); if (fr) fr.style.borderStyle = 'solid';
      }
      await st.scope.wait(100); if (!Session.alive(my)) return;
      const R = W5U.cardOf(st, q.answer); W5U.gold(st, R); K.hop(st, R, 12);
      await W5U.sum(st, q.kind === 'went' ? W5U.left(q.a) + '！' : this.say(q.answer));
      if (!Session.alive(my)) return;
      await st.scope.wait(100);
    },
    rightEls(st) { return [W5U.cardOf(st, st.q.answer)]; },
    async reveal(st) {
      const q = st.q, my = st, R = W5U.cardOf(st, q.answer);
      if (st.back) { await this.flip(st, false); if (!Session.alive(my)) return; }
      Sfx.reveal(); W5U.gold(st, R); K.hop(st, R, 14); this.cheerAll(st);
      st.summary = this.say(q.answer);
      await W5U.sum(st, st.summary); if (!Session.alive(my)) return;
      await st.scope.wait(T(400));
    },
    workEls(st) { return st.cards || []; },
    snap(st) { return { opts: (st.opts || []).slice() }; },
    lines() {
      const out = [this.intro, '记住有几只！', '没有变', '数量变了哦', '不是来了哦', '不是走了哦', '没有来也没有走'].concat(this.praise);
      for (let n = 1; n <= 6; n++) { const c = CNQ(n); out.push('来了' + c + '只', '走了' + c + '只', '不是来了' + c + '只', '不是走了' + c + '只', '多了' + c + '只，是来了', '少了' + c + '只，是走了'); }
      for (let n = 1; n <= 9; n++) out.push('还剩' + CNQ(n) + '只！');
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- B7 跟！ 风筝线团 (S1 Chase It: the eyes follow a line). Five
     kites above, five little animals below, each holding a string up to its kite; the strings cross. "小兔的风筝是哪个？" - tap
     a kite. He may also slide his finger along a string from its animal (stations along it): what he slid over glows - his
     own tool, never judged.
       L1 five strings of five colours, each crosses at most once · L2 one colour, each crosses 1-2 times · L3 2-3 times, with
       S-bends · L4 a cloud hides a piece of the asked string (straight under it, <= 80 units) · L5 small loops and close
       parallel stretches, 3-4 crossings.
     The right kite's place comes from a bag (the asked animal is the one whose kite it is). Wrong: a blue bead runs from his
     kite down its string to its owner ("这是小鸭的风筝"); a gold bead runs from the asked animal up its string, stopping and
     flashing at every crossing ("跟着线走"); the right kite ringed gold ("这个是小兔的"). */
  const B7A = ['bunny', 'duck', 'kitten', 'chick', 'sheep'], B7N = { bunny: '小兔', duck: '小鸭', kitten: '小猫', chick: '小鸡', sheep: '小羊' };
  const KCOL = ['#FF6B5B', '#4FB3FF', '#5CC46E', '#FFC93C', '#B57BFF'];
  const SCOL = ['#E8414B', '#2E86DE', '#2FA84F', '#E0A400', '#8E44D9'];
  const KITE = [
    c => '<polygon points="50,4 90,42 50,84 10,42" fill="' + c + '" ' + S4 + '/><path d="M50 4V84M10 42H90" stroke="' + INK + '" stroke-width="3"/>',
    c => '<polygon points="50,6 94,70 50,58 6,70" fill="' + c + '" ' + S4 + '/><path d="M50 6V58" stroke="' + INK + '" stroke-width="3"/>',
    c => '<rect x="16" y="8" width="68" height="70" rx="6" fill="' + c + '" ' + S4 + '/><path d="M16 8L84 78M84 8L16 78" stroke="' + INK + '" stroke-width="3"/>',
    c => '<circle cx="50" cy="42" r="38" fill="' + c + '" ' + S4 + '/><circle cx="50" cy="42" r="14" fill="#FFF" stroke="' + INK + '" stroke-width="3"/>',
    c => '<polygon points="' + W2X.pts(W2X.star(50, 44, 42)) + '" fill="' + c + '" ' + S4 + '/>',
  ];
  const B7L = [null, { lo: 0, hi: 1, each: 1, amp: 0, colors: true }, { lo: 1, hi: 2, each: 2, amp: 0.25 }, { lo: 2, hi: 3, each: 3, amp: 0.6 }, { lo: 1, hi: 3, each: 3, amp: 0, cloud: true }, { lo: 3, hi: 4, each: 4, amp: 0.5, loop: true }];
  const segX = (a, b, c, d) => { const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x); if (Math.abs(den) < 1e-9) return null; const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den, u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den; return t >= 0 && t < 1 && u >= 0 && u < 1 ? { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), t } : null; };
  W5R.B7 = {
    kind0: 'tangle5', verb: '跟！', intro: '风筝线缠住啦！', praise: ['眼睛跟得真准！'], props: B7A.slice(),
    geo() {
      const L = K.L();
      return L ? { kx: 512, ky: 112, kw: 104, kh: 116, kp: 150, ax: 512, ay: 498, aw: 100, ap: 150 }
        : { kx: 352, ky: 214, kw: 100, kh: 112, kp: 126, ax: 352, ay: 752, aw: 100, ap: 126 };
    },
    /* a string in unit space: u along the board (0 animal ... 1 kite), x in "lanes" (0..4); sampled */
    curve(xa, xk, amp, ph, loop) {
      const P = [], N = 48;
      for (let i = 0; i <= N; i++) {
        const t = i / N, s = t * t * (3 - 2 * t), w = amp * Math.sin(Math.PI * 2 * t + ph) * Math.sin(Math.PI * t);
        P.push({ x: xa + (xk - xa) * s + w, y: t });
      }
      if (loop) { const k = Math.round(N * loop.t), c = P[k], out = []; for (let j = 0; j <= 14; j++) { const a = Math.PI / 2 + j / 14 * Math.PI * 2; out.push({ x: c.x + loop.r * Math.cos(a) * loop.dir, y: c.y - loop.r * 0.12 + loop.r * 0.12 * Math.sin(a) }); } P.splice(k, 0, ...out); }
      return P;
    },
    /* the crossings of string i with the others (in unit space, x scaled so the lanes are about as wide as the height) */
    crossings(S, i) {
      const sc = p => ({ x: p.x * 0.25, y: p.y }), out = [];
      S.forEach((Q, j) => { if (j === i) return; const A = S[i]; for (let a = 1; a < A.length; a++) for (let b = 1; b < Q.length; b++) { const h = segX(sc(A[a - 1]), sc(A[a]), sc(Q[b - 1]), sc(Q[b])); if (h) out.push({ a: a - 1 + h.t, j }); } });
      return out.sort((x, y) => x.a - y.a);
    },
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, L = B7L[d], at = W5U.at(G, 5, 'b7p' + d);
      const animals = rng.shuffle(B7A), kites = rng.shuffle([0, 1, 2, 3, 4]), kcol = rng.shuffle(KCOL.map((_, i) => i));
      let best = null;
      for (let t = 0; t < 400; t++) {
        const perm = rng.shuffle([0, 1, 2, 3, 4]);      /* animal at lane i holds the kite at lane perm[i] */
        if (d === 1 && perm.some((p, i) => Math.abs(p - i) > 1)) continue;
        const who = perm.indexOf(at);
        const S = perm.map((p, i) => this.curve(i, p, L.amp * (0.5 + rng()), rng() * 6.28, L.loop && i === who ? { t: 0.3 + rng() * 0.4, r: 0.45, dir: rng.chance(0.5) ? 1 : -1 } : null));
        const X = S.map((_, i) => this.crossings(S, i));
        if (X.some(x => x.length > L.each)) continue;
        const n = X[who].length; if (n < L.lo || n > L.hi) continue;
        if (d >= 2 && X.reduce((s, x) => s + x.length, 0) < 4) continue;
        const scol = (() => { for (let u = 0; u < 30; u++) { const c = rng.shuffle([0, 1, 2, 3, 4]); if (c.every((x, i) => x !== kcol[perm[i]])) return c; } return [0, 1, 2, 3, 4]; })();
        const q = { d, perm, who, animals, kites, kcol, scol, S: S.map(P => P.map(p => [+p.x.toFixed(3), +p.y.toFixed(3)])), X: X[who], answer: at, opts: [0, 1, 2, 3, 4] };
        if (L.cloud && n) { const c = X[who][Math.floor(rng() * n)], P = S[who], k = Math.floor(c.a), p = P[k]; q.cloud = { x: +p.x.toFixed(3), y: +p.y.toFixed(3) }; }
        if (L.cloud && !n) continue;
        q.k = [d, perm.join(''), who, animals[who]];
        best = q; break;
      }
      return best;
    },
    audit(q) { return [{ n: 5, at: q.answer, right: q.perm.filter(p => p === q.answer).length }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    /* unit -> stage: lane x, height 0 (the animal's hand) .. 1 (the kite's tail) */
    toStage(p) { const g = this.geo(); return { x: g.ax + (p[0] - 2) * g.ap, y: (g.ay - 4) + ((g.ky + g.kh - 6) - (g.ay - 4)) * p[1] }; },
    place(st) {
      if (!st.kiteEls) return;
      const g = this.geo(), q = st.q;
      st.kiteEls.forEach((e, i) => place(e, Math.round(g.kx + (i - 2) * g.kp - g.kw / 2), g.ky, g.kw, g.kh));
      st.aniEls.forEach((e, i) => place(e, Math.round(g.ax + (i - 2) * g.ap - g.aw / 2), g.ay, g.aw, g.aw));
      place(st.layer, 0, 0, Stage.W, Stage.H); st.layer.setAttribute('width', Stage.W); st.layer.setAttribute('height', Stage.H);
      this.drawStrings(st);
      if (st.cloudEl) { const c = this.toStage([q.cloud.x, q.cloud.y]); place(st.cloudEl, Math.round(c.x - 56), Math.round(c.y - 32), 112, 64); }
    },
    path(st, P) { return P.map((p, i) => { const s = this.toStage(p); return (i ? 'L' : 'M') + s.x.toFixed(1) + ' ' + s.y.toFixed(1); }).join(''); },
    drawStrings(st) {
      const q = st.q, s = st.layer; while (s.firstChild) s.removeChild(s.firstChild);
      q.S.forEach((P, i) => {
        const d = this.path(st, P), col = q.d === 1 ? SCOL[q.scol[i]] : '#6B4A2E';
        svg('path', { d, fill: 'none', stroke: '#FFF', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.8 }, s);
        svg('path', { d, fill: 'none', stroke: col, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      });
      st.glowPaths = q.S.map(() => svg('path', { d: '', fill: 'none', stroke: GOLD, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85 }, s));
      (st.lit || []).forEach((k, i) => { if (k > 0) st.glowPaths[i].setAttribute('d', this.path(st, q.S[i].slice(0, k + 1))); });
    },
    /* the stations along string i (every 3rd point), for his finger */
    stations(st, i) { const P = st.q.S[i], out = []; for (let k = 0; k < P.length; k += 3) out.push({ id: 's' + k, rect: () => { const s = this.toStage(P[k]); return { x: s.x - 22, y: s.y - 22, w: 44, h: 44 }; } }); return out; },
    async present(st) {
      const q = st.q;
      st.layer = svg('svg', { width: Stage.W, height: Stage.H }, Stage.el); Object.assign(st.layer.style, { position: 'absolute', left: '0px', top: '0px', zIndex: 4, pointerEvents: 'none', overflow: 'visible' }); st.els.push(st.layer);
      st.lit = [0, 0, 0, 0, 0];
      st.kiteEls = q.kites.map((sh, i) => { const e = piece(st, 6, KITE[sh](KCOL[q.kcol[i]]) + '<path d="M50 84Q40 96 50 104Q60 112 50 116" fill="none" stroke="' + INK + '" stroke-width="2.5"/>', 100, 116); K.reg(st, 'k' + i, e, {}); return e; });
      st.aniEls = q.animals.map((a, i) => { const e = W2X.thing(st, 10, 10, 6, ''); e.appendChild(W5U.propImg(a)); K.reg(st, 'a' + i, e, { slide: this.stations(st, i) }); return e; });
      if (q.cloud) { st.cloudEl = W2X.thing(st, 10, 10, 7, ''); st.cloudEl.style.pointerEvents = 'none'; st.cloudEl.innerHTML = '<svg viewBox="0 0 140 80" width="100%" height="100%"><path d="M26 70Q4 70 6 52Q8 36 28 38Q30 14 56 16Q72 2 92 14Q116 10 120 34Q138 38 134 54Q130 70 110 70Z" fill="#FFF" stroke="#C9D3E0" stroke-width="5"/></svg>'; }
      this.place(st);
      st.kiteEls.forEach((e, i) => K.pop(st, e, 50 * i)); st.aniEls.forEach((e, i) => K.pop(st, e, 120 + 50 * i));
      K.task(st, [[W5U.prop(q.animals[q.who])], [W3X.ic(KITE[0]('#FFF') , 50)], ['q']]);
      K.say(st, B7N[q.animals[q.who]] + '的风筝是哪个？');
    },
    onGesture(st, name, p) {
      const id = p.id || '';
      if (name === 'pass' && /^a\d$/.test(id)) { const i = +id.slice(1), k = +String(p.at).slice(1); if (k <= st.lit[i] + 6) { st.lit[i] = Math.max(st.lit[i], k); st.glowPaths[i].setAttribute('d', this.path(st, st.q.S[i].slice(0, st.lit[i] + 1))); } return 'free'; }
      if (name === 'pick' || (name === 'tap' && /^a\d$/.test(id))) return 'free';
      const i = /^k\d$/.test(id) ? +id.slice(1) : -1;
      if (name !== 'tap' || i < 0 || st.picked) return false;
      st.picked = true; K.hop(st, st.kiteEls[i], 10); Session.submit(st, i); return 'ok';
    },
    next(st, strat) { if (st.picked || !st.kiteEls) return null; const q = st.q; return { g: 'tap', p: { id: 'k' + (strat === 'wrong' ? (q.answer + 1 + (st.gen % 4)) % 5 : q.answer) } }; },
    ownerOf(q, k) { return q.animals[q.perm.indexOf(k)]; },
    async feedback(st, ans) { K.wiggle(st, st.kiteEls[ans]); W5U.say(st, '这是' + B7N[this.ownerOf(st.q, ans)] + '的风筝'); await st.scope.wait(T(600)); },
    /* a bead running along string i (up: from the animal; down: from the kite), stopping at the given crossings */
    async bead(st, i, up, color, stops) {
      const my = st, P = st.q.S[i].map(p => this.toStage(p)), seq = up ? P : P.slice().reverse(), b = W2X.thing(st, 30, 30, 52, '');
      Object.assign(b.style, { borderRadius: '50%', background: color, boxShadow: '0 0 0 4px ' + INK + ', 0 0 16px 6px ' + color, pointerEvents: 'none' });
      const stopAt = new Set((stops || []).map(x => Math.round(up ? x.a : P.length - 1 - x.a)));
      for (let k = 0; k < seq.length; k++) {
        if (k % 2 && !stopAt.has(k) && k < seq.length - 1) continue;
        place(b, Math.round(seq[k].x - 15), Math.round(seq[k].y - 15), 30, 30);
        if (stopAt.has(k)) { Fx.burst(seq[k].x, seq[k].y, { n: 8, dist: 34 }); Sfx.pop(); await pause(st, 150); }
        await pause(st, 14); if (!Session.alive(my)) return b;
      }
      return b;
    },
    async explain(st, ans) {
      const q = st.q, my = st, mine = q.perm.indexOf(ans);
      W5U.blue(st, st.kiteEls[ans]);
      const b1 = await this.bead(st, mine, false, BLUE); if (!Session.alive(my)) return;
      W5U.blue(st, st.aniEls[mine]);
      await fbDone(st); if (!Session.alive(my)) return;
      if (b1) b1.remove();
      if (st.cloudEl) st.scope.anim(st.cloudEl, [{ opacity: 1 }, { opacity: 0.25 }], { duration: 400, fill: 'forwards' });
      W5U.note(st, '跟着线走');
      await this.bead(st, q.who, true, GOLD, q.X); if (!Session.alive(my)) return;
      st.glowPaths[q.who].setAttribute('d', this.path(st, q.S[q.who]));
      await st.scope.wait(150); if (!Session.alive(my)) return;
      W5U.gold(st, st.kiteEls[q.answer]); K.hop(st, st.kiteEls[q.answer], 14);
      await W5U.sum(st, '这个是' + B7N[q.animals[q.who]] + '的'); if (!Session.alive(my)) return;
      await st.scope.wait(200);
    },
    rightEls(st) { return [st.kiteEls[st.q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st;
      Sfx.reveal(); st.glowPaths[q.who].setAttribute('d', this.path(st, q.S[q.who]));
      if (st.cloudEl) st.cloudEl.style.opacity = '0.3';
      W5U.gold(st, st.kiteEls[q.answer]); K.hop(st, st.kiteEls[q.answer], 14); this.cheerAll(st);
      st.summary = '这个是' + B7N[q.animals[q.who]] + '的';
      await W5U.sum(st, st.summary); if (!Session.alive(my)) return;
      await st.scope.wait(T(400));
    },
    workEls(st) { return st.kiteEls || []; },
    gestureHint(st) { if (st.aniEls) W3X.tapHint(st, st.aniEls[st.q.who]); },
    snap(st) { return { lit: (st.lit || []).slice() }; },
    lines() {
      const out = [this.intro, '跟着线走'].concat(this.praise);
      B7A.forEach(a => out.push(B7N[a] + '的风筝是哪个？', '这是' + B7N[a] + '的风筝', '这个是' + B7N[a] + '的'));
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- B8 比！ 找不同 (reasoning; F17 Popping Candy: what differs in
     a grid). Two boxes of sweets side by side (portrait: one above the other), the same but for one or two places. Tap the
     sweet that differs (in either box: the same place counts).
       L1 2 x 3, one place, its colour · L2 3 x 3, one place, its shape · L3 3 x 3, one place, a small detail (the way the
       stripes go, a dot, a ring) · L4 4 x 4, two places: tap both (each tap marks it, tap again to take the mark off; judged
       when two are marked) · L5 4 x 4, one place differs and two neighbours swapped places: "找出所有不一样！" - three to
       find, empty circles on the task card show how many are still to find.
     L1-L3 a pick from 6 / 9 places (the right place from a bag); L4-L5 a construction (a random play is right 1 in 120 / 560).
     Wrong: his sweet and the one at the same place in the other box grow and flash ("这两颗一样哦"); a light goes over both
     boxes row by row, one pair after another, and stops at the pair that differs: both ringed gold ("这两颗不一样"), then
     what differs ("颜色不一样" / "形状不一样" / "花纹不一样" / "换了位置"). */
  const CCOL = ['#FF6B5B', '#4FB3FF', '#5CC46E', '#FFC93C', '#B57BFF', '#FF8DC7'];
  const CSH = ['round', 'heart', 'star', 'wrap'], CPAT = ['none', 's1', 's2', 'dot', 'ring'];
  const candy = c => {
    const f = CCOL[c.c], k = 'stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"';
    let s = c.s === 'round' ? '<circle cx="50" cy="50" r="31" fill="' + f + '" ' + k + '/>'
      : c.s === 'heart' ? '<path d="M50 82C22 62 14 46 20 32C26 18 44 18 50 32C56 18 74 18 80 32C86 46 78 62 50 82Z" fill="' + f + '" ' + k + '/>'
        : c.s === 'star' ? '<polygon points="' + W2X.pts(W2X.star(50, 52, 36)) + '" fill="' + f + '" ' + k + '/>'
          : '<path d="M22 50L6 34V66Z" fill="' + f + '" ' + k + '/><path d="M78 50L94 34V66Z" fill="' + f + '" ' + k + '/><ellipse cx="50" cy="50" rx="30" ry="22" fill="' + f + '" ' + k + '/>';
    const w = 'stroke="#FFF" stroke-width="5" stroke-linecap="round"';
    if (c.p === 's1') s += '<path d="M37 59L45 47M46 63L56 49M55 61L63 50" ' + w + '/>';
    if (c.p === 's2') s += '<path d="M63 59L55 47M54 63L44 49M45 61L37 50" ' + w + '/>';
    if (c.p === 'dot') s += '<circle cx="50" cy="52" r="7" fill="#FFF" stroke="' + INK + '" stroke-width="2.5"/>';
    if (c.p === 'ring') s += '<circle cx="50" cy="52" r="11" fill="none" stroke="#FFF" stroke-width="5"/>';
    return s;
  };
  const B8L = [null, { r: 2, c: 3, diff: ['c'] }, { r: 3, c: 3, diff: ['s'] }, { r: 3, c: 3, diff: ['p'] }, { r: 4, c: 4, two: 2 }, { r: 4, c: 4, two: 1, swap: true }];
  W5R.B8 = {
    kind0: 'diff5', verb: '比！', intro: '两盒糖不一样！', praise: ['眼睛真尖！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, L = B8L[d], N = L.r * L.c;
      const rnd = () => ({ s: d <= 1 ? rng.pick(CSH) : rng.pick(CSH), c: rng.int(0, 5), p: d <= 2 ? 'none' : rng.pick(CPAT) });
      const A = Array.from({ length: N }, rnd), B = A.map(x => Object.assign({}, x)), diffs = [];
      const change = (i, what) => {
        const x = B[i];
        if (what === 'c') { x.c = rng.pick([0, 1, 2, 3, 4, 5].filter(v => v !== x.c)); }
        else if (what === 's') { x.s = rng.pick(CSH.filter(v => v !== x.s)); }
        else { x.p = x.p === 's1' ? 's2' : x.p === 's2' ? 's1' : rng.pick(CPAT.filter(v => v !== x.p)); }
        diffs.push({ i, what });
      };
      if (!L.two) { const at = W5U.at(G, N, 'b8p' + d); change(at, L.diff[0]); return { d, rows: L.r, cols: L.c, A, B, diffs, answer: at, opts: A.map((_, i) => i), k: [d, at, A.map(x => x.s[0] + x.c + x.p[0]).join('')] }; }
      const cells = rng.shuffle(A.map((_, i) => i));
      if (L.swap) {
        /* two neighbours (side by side or one above the other) that look different swap places */
        let s = null;
        for (const i of cells) { const nb = [i % L.c < L.c - 1 ? i + 1 : -1, i + L.c < N ? i + L.c : -1].filter(j => j >= 0 && JSON.stringify(A[j]) !== JSON.stringify(A[i])); if (nb.length) { s = [i, rng.pick(nb)]; break; } }
        if (!s) return this.gen(G, o);
        B[s[0]] = Object.assign({}, A[s[1]]); B[s[1]] = Object.assign({}, A[s[0]]);
        diffs.push({ i: s[0], what: 'w' }, { i: s[1], what: 'w' });
        const one = cells.find(i => !s.includes(i) && !s.some(j => Math.abs(j - i) === 1 || Math.abs(j - i) === L.c));
        change(one, rng.pick(['c', 's', 'p']));
      } else { change(cells[0], rng.pick(['c', 's', 'p'])); change(cells[1], rng.pick(['c', 's', 'p'])); }
      const ans = diffs.map(x => x.i).sort((a, b) => a - b);
      return { d, rows: L.r, cols: L.c, A, B, diffs, need: ans.length, answer: ans.join(','), k: [d, ans.join('.'), A.map(x => x.s[0] + x.c + x.p[0]).join('')] };
    },
    audit(q) { return q.need ? [{ build: true, chance: q.need === 2 ? 1 / 120 : 1 / 560 }] : [{ n: q.opts.length, at: q.answer, right: q.A.filter((x, i) => JSON.stringify(x) !== JSON.stringify(q.B[i])).length }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    /* the two boxes: cell size, gaps, their places (landscape side by side, portrait one above the other) */
    geo(q) {
      const L = K.L(), c = q.cols === 3 && q.rows === 2 ? 120 : q.cols === 3 ? (L ? 110 : 104) : (L ? 90 : 88), gap = q.cols === 4 ? (L ? 8 : 6) : 10, pad = 14;
      const bw = q.cols * c + (q.cols - 1) * gap + 2 * pad, bh = q.rows * c + (q.rows - 1) * gap + 2 * pad;
      if (L) { const x0 = Math.round(512 - bw - 18), y0 = q.rows === 4 ? 116 : Math.round(320 - bh / 2); return { c, gap, pad, bw, bh, box: [{ x: x0, y: y0 }, { x: 530, y: y0 }] }; }
      const y0 = q.rows === 4 ? 202 : 206, x0 = Math.round(352 - bw / 2);
      return { c, gap, pad, bw, bh, box: [{ x: x0, y: y0 }, { x: x0, y: y0 + bh + (q.rows === 4 ? 16 : 22) }] };
    },
    cellRect(q, k, i) { const g = this.geo(q), b = g.box[k], r = Math.floor(i / q.cols), cc = i % q.cols; return { x: b.x + g.pad + cc * (g.c + g.gap), y: b.y + g.pad + r * (g.c + g.gap), w: g.c, h: g.c }; },
    place(st) {
      if (!st.boxes) return;
      const q = st.q, g = this.geo(q);
      st.boxes.forEach((e, k) => place(e, g.box[k].x, g.box[k].y, g.bw, g.bh));
      st.cells.forEach((list, k) => list.forEach((e, i) => { const r = this.cellRect(q, k, i); place(e, r.x, r.y, r.w, r.h); }));
    },
    async present(st) {
      const q = st.q;
      st.marks = [];
      st.boxes = [0, 1].map(k => { const e = W2X.thing(st, 10, 10, 3, ''); Object.assign(e.style, { borderRadius: '26px', background: '#FFF8EC', boxShadow: '0 0 0 5px ' + INK + ', 0 0 0 11px ' + (k ? '#FF8DC7' : '#4FB3FF') + ', 0 0 0 14px ' + INK, pointerEvents: 'none' }); return e; });
      st.cells = [q.A, q.B].map((list, k) => list.map((c, i) => { const e = piece(st, 6, '<rect x="4" y="4" width="92" height="92" rx="16" fill="#FFF" stroke="#E8D9C4" stroke-width="4"/>' + candy(c), 100, 100); K.reg(st, (k ? 'b' : 'a') + i, e, {}); return e; }));
      this.place(st);
      st.boxes.forEach((e, k) => K.pop(st, e, 80 * k)); st.cells.forEach((l, k) => l.forEach((e, i) => K.pop(st, e, 80 * k + 20 * i)));
      const ic = W3X.ic('<rect x="6" y="20" width="40" height="60" rx="6" fill="#FFF" ' + S4 + '/><rect x="54" y="20" width="40" height="60" rx="6" fill="#FFF" ' + S4 + '/><circle cx="26" cy="38" r="7" fill="#FF8DC7"/><circle cx="26" cy="62" r="7" fill="#4FB3FF"/><circle cx="74" cy="38" r="7" fill="#FF8DC7"/><circle cx="74" cy="62" r="7" fill="#5CC46E"/>', 54);
      if (q.need) {
        st.pipBox = el('span', ''); Object.assign(st.pipBox.style, { display: 'flex', gap: '6px', alignItems: 'center' });
        st.pips = Array.from({ length: q.need }, () => { const p = el('span', '', st.pipBox); Object.assign(p.style, { width: '26px', height: '26px', borderRadius: '50%', boxShadow: '0 0 0 3px ' + INK, background: '#FFF', display: 'inline-block' }); return p; });
        K.task(st, [[ic], [{ node: st.pipBox }], ['q']]);
        if (q.d === 5) K.say(st, '找出所有不一样！'); else W3X.say2(st, '有两颗不一样，', '都找出来！');
      } else { K.task(st, [[ic], ['q']]); K.say(st, '哪颗糖不一样？'); }
    },
    /* a mark on both sweets of place i (L4 / L5) */
    mark(st, i, on) {
      st.cells.forEach(l => { const e = l[i]; let m = e.querySelector('.b8mk'); if (on && !m) { m = el('div', 'b8mk', e); Object.assign(m.style, { position: 'absolute', inset: '-6px', borderRadius: '20px', boxShadow: '0 0 0 6px #FF9F43', pointerEvents: 'none' }); } if (!on && m) m.remove(); });
      st.pips.forEach((p, k) => { p.style.background = k < st.marks.length ? '#FF9F43' : '#FFF'; });
    },
    onGesture(st, name, p) {
      const m = /^([ab])(\d+)$/.exec(p.id || ''); if (name !== 'tap' || !m || st.picked) return false;
      const i = +m[2], q = st.q;
      K.pop(st, st.cells[m[1] === 'a' ? 0 : 1][i]);
      if (!q.need) { st.picked = true; Session.submit(st, i); return 'ok'; }
      const at = st.marks.indexOf(i);
      if (at >= 0) { st.marks.splice(at, 1); this.mark(st, i, false); Sfx.back(); return 'ok'; }
      st.marks.push(i); this.mark(st, i, true); Sfx.place();
      if (st.marks.length >= q.need) { st.picked = true; st.scope.timeout(() => Session.submit(st, st.marks.slice().sort((a, b) => a - b).join(',')), 350); }
      return 'ok';
    },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.cells) return null;
      const right = q.need ? q.answer.split(',').map(Number) : [q.answer], side = st.gen % 2 ? 'b' : 'a';
      if (!q.need) return { g: 'tap', p: { id: side + (strat === 'wrong' ? (q.answer + 1) % q.A.length : q.answer) } };
      const bad = st.marks.find(i => !right.includes(i)); if (strat !== 'wrong' && bad != null) return { g: 'tap', p: { id: side + bad } };
      if (strat === 'wrong') { const w = q.A.findIndex((_, i) => !right.includes(i) && !st.marks.includes(i)); return { g: 'tap', p: { id: side + (st.marks.length ? w : right[0]) } }; }
      const miss = right.find(i => !st.marks.includes(i)); return miss == null ? null : { g: 'tap', p: { id: side + miss } };
    },
    evaluate(st, ans) { return String(ans) === String(st.q.answer); },
    /* his places that are the same in both boxes */
    wrongs(st, ans) { const right = st.q.need ? st.q.answer.split(',').map(Number) : [st.q.answer]; return String(ans).split(',').map(Number).filter(i => !right.includes(i)); },
    async feedback(st, ans) { const w = this.wrongs(st, ans); w.forEach(i => K.wiggle(st, st.cells[0][i])); W5U.say(st, '这两颗一样哦'); await st.scope.wait(T(600)); },
    whatLine(w) { return w === 'c' ? '颜色不一样' : w === 's' ? '形状不一样' : w === 'p' ? '花纹不一样' : '换了位置'; },
    async explain(st, ans) {
      const q = st.q, my = st, w = this.wrongs(st, ans);
      const had = st.marks; st.marks = []; had.forEach(i => this.mark(st, i, false));
      /* 1. his sweet and its twin grow and flash, ringed blue */
      const pair = i => [st.cells[0][i], st.cells[1][i]];
      w.forEach(i => pair(i).forEach(e => st.scope.anim(e, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 700, iterations: 2 })));
      const rings = w.length ? W5U.blue(st, [].concat(...w.map(pair))) : W5U.blue(st, st.boxes[0]);
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      /* 2. a light goes over the rows of both boxes; at a row with a difference it stops: gold on both sweets */
      const g = this.geo(q), bars = [0, 1].map(k => { const b = W2X.thing(st, 10, 10, 8, ''); Object.assign(b.style, { borderRadius: '14px', background: 'rgba(255,236,140,.45)', boxShadow: '0 0 18px 6px rgba(255,236,140,.6)', pointerEvents: 'none' }); return b; });
      const rowsWith = new Set(q.diffs.map(x => Math.floor(x.i / q.cols))), last = Math.max(...rowsWith);
      for (let r = 0; r <= last; r++) {
        bars.forEach((b, k) => { const c = this.cellRect(q, k, r * q.cols); place(b, c.x - 6, c.y - 6, g.bw - 2 * g.pad + 12, g.c + 12); });
        if (rowsWith.has(r)) { q.diffs.filter(x => Math.floor(x.i / q.cols) === r).forEach(x => { W5U.gold(st, pair(x.i)); K.hop(st, st.cells[1][x.i], 10); }); Sfx.reveal(); await pause(st, 280); }
        else await pause(st, 120);
        if (!Session.alive(my)) return;
      }
      bars.forEach(b => b.remove());
      await W5U.sum(st, '这两颗不一样'); if (!Session.alive(my)) return;
      await W5U.sum(st, this.whatLine(q.diffs[0].what)); if (!Session.alive(my)) return;
      await st.scope.wait(200);
    },
    rightEls(st) { const q = st.q; return [].concat(...q.diffs.map(x => [st.cells[0][x.i], st.cells[1][x.i]])); },
    async reveal(st) {
      const q = st.q, my = st;
      if (st.marks) st.marks.forEach(i => this.mark(st, i, false));
      Sfx.reveal(); q.diffs.forEach(x => { W5U.gold(st, [st.cells[0][x.i], st.cells[1][x.i]]); K.hop(st, st.cells[1][x.i], 12); });
      this.cheerAll(st);
      st.summary = this.whatLine(q.diffs[q.diffs.length - 1].what);
      await W5U.sum(st, st.summary); if (!Session.alive(my)) return;
      await st.scope.wait(T(400));
    },
    workEls(st) { return st.boxes || []; },
    snap(st) { return { marks: (st.marks || []).slice() }; },
    lines() { return uniq([this.intro, '哪颗糖不一样？', '有两颗不一样，', '都找出来！', '找出所有不一样！', '这两颗一样哦', '这两颗不一样', '颜色不一样', '形状不一样', '花纹不一样', '换了位置'].concat(this.praise)); },
  };
})();
/* ================================================================ ③ 睡衣小英雄·积木塔 (pjmasks5, from level 1): J5 三角拼图 ·
   J6 数图形填表 · J7 拍下所有分法 · J8 按什么分的 (reasoning). docs/W5-DESIGN.md §5 ③. One function, no top-level names;
   each rule is W5R.<id> (registered in games.js). Package B. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C', BLUE = '#4FB3FF';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
  /* a plain positioned piece of the question (no tap of its own unless registered) */
  const thing = (st, z, cls) => { const d = el('div', cls || 'item', Stage.el); d.style.position = 'absolute'; d.style.zIndex = z || 5; place(d, 0, 0, 10, 10); st.els.push(d); return d; };
  const mid = e => { const b = box(e); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
  const ff = st => st.explaining && st.ff;
  /* a line inside an explanation (a tap cuts it, and after a tap it is not said) */
  const say = (st, t) => (ff(st) ? Promise.resolve('ff') : W5U.note(st, t));
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine) */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));

  /* ================================================================ J5 拼！ 用三角形拼 (tri5)
     A silhouette on a pale grid (cells of 96); a tray of pieces: the four little right triangles (half a cell: ◤ ◥ ◣ ◢, one
     colour each), the little square, at L5 the big triangle (two cells) and the parallelogram. A piece dragged onto the board
     snaps into the cell under the finger (its direction is the piece's own: no turning); a placed piece is dragged back to
     the tray, onto another cell, or tapped away. Tap a piece, then a cell, works too. "发射" judges: every half of the
     silhouette covered, nothing twice, nothing outside.
       L1 the pieces' borders drawn in; 3-4 pieces, two triangle directions + the square (house, boat, pine, cone, slide)
       L2 borders drawn; 4-6 pieces, all four directions (kite, fish, rocket, arrow, sailboat)
       L3 only the outline; triangles only - a square place needs two triangles; 5-6 pieces
       L4 only the outline; the tray holds exactly the pieces + 2 that are not needed; 6 pieces
       L5 like a tangram: big triangles, parallelograms, little triangles (rocket, cat, house, arrow); the tray is exact + 1
     A cell has four quarters (top, right, bottom, left): ◤ = top + left ... a square all four. A random play is right about
     1 time in thousands (k pieces each on the right cell with the right piece). Wrong: the pieces in the wrong direction / out
     of the outline ringed blue (or the empty places), the helper fills the rest in gold one by one ("两个三角拼成方" when two
     triangles make a square), "看，拼满了" with the board ringed gold. */
  const QS = { F: [0, 1, 2, 3], a: [0, 3], b: [0, 1], c: [2, 3], d: [1, 2] };
  const PT = {
    s: { c: [[0, 0, 'F']], p: [[0, 0], [1, 0], [1, 1], [0, 1]], w: 1, h: 1 },
    a: { c: [[0, 0, 'a']], p: [[0, 0], [1, 0], [0, 1]], w: 1, h: 1 },
    b: { c: [[0, 0, 'b']], p: [[0, 0], [1, 0], [1, 1]], w: 1, h: 1 },
    c: { c: [[0, 0, 'c']], p: [[0, 0], [1, 1], [0, 1]], w: 1, h: 1 },
    d: { c: [[0, 0, 'd']], p: [[1, 0], [1, 1], [0, 1]], w: 1, h: 1 },
    A: { c: [[0, 0, 'F'], [1, 0, 'a'], [0, 1, 'a']], p: [[0, 0], [2, 0], [0, 2]], w: 2, h: 2 },
    B: { c: [[1, 0, 'F'], [0, 0, 'b'], [1, 1, 'b']], p: [[0, 0], [2, 0], [2, 2]], w: 2, h: 2 },
    C: { c: [[0, 1, 'F'], [0, 0, 'c'], [1, 1, 'c']], p: [[0, 0], [2, 2], [0, 2]], w: 2, h: 2 },
    D: { c: [[1, 1, 'F'], [1, 0, 'd'], [0, 1, 'd']], p: [[2, 0], [2, 2], [0, 2]], w: 2, h: 2 },
    P: { c: [[0, 0, 'd'], [1, 0, 'a']], p: [[1, 0], [2, 0], [1, 1], [0, 1]], w: 2, h: 1 },
    Q: { c: [[0, 0, 'b'], [1, 0, 'c']], p: [[0, 0], [1, 0], [2, 1], [1, 1]], w: 2, h: 1 },
    V: { c: [[0, 0, 'd'], [0, 1, 'a']], p: [[1, 0], [1, 1], [0, 2], [0, 1]], w: 1, h: 2 },
    W: { c: [[0, 0, 'c'], [0, 1, 'b']], p: [[0, 0], [1, 1], [1, 2], [0, 1]], w: 1, h: 2 },
  };
  const MIR = { s: 's', a: 'b', b: 'a', c: 'd', d: 'c', A: 'B', B: 'A', C: 'D', D: 'C', P: 'Q', Q: 'P', V: 'W', W: 'V', F: 'F', '.': '.' };
  const PCOL = { s: '#5CC46E', a: '#FF6B5B', b: '#4FB3FF', c: '#FFC93C', d: '#B57BFF', A: '#FF9F43', B: '#FF9F43', C: '#FF9F43', D: '#FF9F43', P: '#3DD6C6', Q: '#3DD6C6', V: '#3DD6C6', W: '#3DD6C6' };
  const SMALL = 'abcd';
  /* the silhouettes: rows of cells ('.' none, F full, a-d a half) and one way to fill them (type + column + row) */
  const SH = {
    house: ['dc|FF', 'd00 c10 s01 s11'], boat: ['.F.|bFa', 's10 b01 s11 a21'], pine: ['dc|dc', 'd00 c10 d01 c11'],
    cone: ['FF|ba', 's00 s10 b01 a11'], slide: ['d.|FF', 'd00 s01 s11'],
    kite: ['dc|ba', 'd00 c10 b01 a11'], fish: ['cdc|aba', 'c00 d10 c20 a01 b11 a21'], rocket: ['dc|FF|ab', 'd00 c10 s01 s11 a02 b12'],
    arrow: ['bFc|dFa', 'b00 s10 c20 d01 s11 a21'], sail: ['.Fc|bFa', 's10 c20 b01 s11 a21'], flag: ['Fc|Fa', 's00 c10 s01 a11'],
    eaves: ['.dc.|dFFc', 'd10 c20 d01 s11 s21 c31'],
    rocket5: ['dc|FF|FF|ab', 'd00 c10 A01 D01 a03 b13'], cat: ['cd|FF|FF', 'c00 d10 A01 V11 d02 d12'],
    house5: ['.dc.|dFFc|.FF.', 'D00 C20 P12 a12 d22'], arrow5: ['bFc|dFa', 'Q00 Q10 P01 P11'],
  };
  const J5SET = [null, ['house', 'boat', 'pine', 'cone', 'slide', 'slide*'], ['kite', 'fish', 'rocket', 'arrow', 'arrow*', 'sail', 'sail*'],
    ['house', 'boat', 'cone', 'kite', 'flag', 'flag*', 'slide', 'sail*'], ['fish', 'rocket', 'arrow', 'arrow*', 'sail', 'sail*', 'eaves'],
    ['rocket5', 'cat', 'house5', 'arrow5', 'arrow5*']];
  const shapeOf = name => {
    const mir = name.endsWith('*'), base = SH[name.replace('*', '')];
    let rows = base[0].split('|'), sol = base[1].split(' ').map(s => ({ t: s[0], x: +s[1], y: +s[2] }));
    const cols = rows[0].length;
    if (mir) { rows = rows.map(r => r.split('').reverse().map(ch => MIR[ch]).join('')); sol = sol.map(s => ({ t: MIR[s.t], x: cols - s.x - PT[MIR[s.t]].w, y: s.y })); }
    return { rows, sol, cols, nrows: rows.length };
  };
  /* the board's quarters: 'x,y' -> [quarters] */
  const silOf = rows => { const m = {}; rows.forEach((r, y) => r.split('').forEach((ch, x) => { if (ch !== '.') m[x + ',' + y] = QS[ch]; })); return m; };
  const halfPoly = (h, x, y) => ({ F: [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]], a: [[x, y], [x + 1, y], [x, y + 1]], b: [[x, y], [x + 1, y], [x + 1, y + 1]], c: [[x, y], [x + 1, y + 1], [x, y + 1]], d: [[x + 1, y], [x + 1, y + 1], [x, y + 1]] })[h];
  const pts = (P, u, ox, oy) => P.map(([x, y]) => ((ox || 0) + x * u).toFixed(1) + ',' + ((oy || 0) + y * u).toFixed(1)).join(' ');
  /* a piece's picture: its polygon at `u` per cell (gold edge when the helper puts it) */
  function pieceSvg(t, u, gold) {
    const P = PT[t], s = svg('svg', { viewBox: '-4 -4 ' + (P.w * u + 8) + ' ' + (P.h * u + 8), width: P.w * u + 8, height: P.h * u + 8 });
    s.style.overflow = 'visible'; s.style.pointerEvents = 'none'; s.style.display = 'block';
    svg('polygon', { points: pts(P.p, u), fill: PCOL[t], stroke: gold ? '#E0A100' : INK, 'stroke-width': gold ? 6 : 4, 'stroke-linejoin': 'round' }, s);
    return s;
  }
  /* the silhouette as a little picture for the task card */
  function silIcon(rows) {
    const c = rows[0].length, r = rows.length, u = 84 / Math.max(c, r), ox = (100 - c * u) / 2, oy = (100 - r * u) / 2;
    let o = '', f = '';
    rows.forEach((row, y) => row.split('').forEach((ch, x) => { if (ch === '.') return; const p = pts(halfPoly(ch, x, y), u, ox, oy); o += '<polygon points="' + p + '" fill="#2B2118" stroke="#2B2118" stroke-width="8" stroke-linejoin="round"/>'; f += '<polygon points="' + p + '" fill="#9FD8FF"/>'; }));
    return W2X.icon(o + f);
  }
  const ROCKET = '<svg viewBox="0 0 40 40"><path d="M20 3C27 9 29 17 27 27H13C11 17 13 9 20 3Z" fill="#fff" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="15" r="4" fill="#4FB3FF" stroke="#2B2118" stroke-width="2.5"/><path d="M13 21L7 30L13 28ZM27 21L33 30L27 28Z" fill="#FF6B5B" stroke="#2B2118" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 28L20 37L24 28Z" fill="#FFC93C" stroke="#2B2118" stroke-width="2.5" stroke-linejoin="round"/></svg>';

  W5R.J5 = {
    kind0: 'tri5', verb: '拼！', intro: '用三角形拼！', praise: ['拼得满满的！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, name = bagPick(G, 'j5s' + d, J5SET[d]), S = shapeOf(name);
      let sol = S.sol;
      if (d === 3) sol = sol.flatMap(p => p.t !== 's' ? [p] : (rng.chance(0.5) ? [{ t: 'a', x: p.x, y: p.y }, { t: 'd', x: p.x, y: p.y }] : [{ t: 'b', x: p.x, y: p.y }, { t: 'c', x: p.x, y: p.y }]));
      const used = uniq(sol.map(p => p.t));
      let tray;
      if (d === 1) { const tri = used.filter(t => SMALL.includes(t)); if (tri.length < 2) tri.push(MIR[tri[0]]); tray = tri.concat(['s']).map(t => ({ t })); }
      else if (d === 2) tray = ['a', 'b', 'c', 'd', 's'].map(t => ({ t }));
      else if (d === 3) tray = ['a', 'b', 'c', 'd'].map(t => ({ t }));
      else {
        const extra = d === 4 ? 2 : 1, pool = d === 4 ? ['a', 'b', 'c', 'd', 's'] : ['A', 'B', 'C', 'D', 'P', 'Q', 'a', 'b', 'c', 'd'];
        const not = pool.filter(t => !used.includes(t)), more = rng.shuffle(not.length >= extra ? not : pool).slice(0, extra);
        tray = rng.shuffle(sol.map(p => ({ t: p.t, fin: 1 })).concat(more.map(t => ({ t, fin: 1 }))));
      }
      return { k: [d, name], d, name, rows: S.rows, cols: S.cols, nrows: S.nrows, sol, tray, lines: d <= 2, fin: d >= 4, answer: 'ok' };
    },
    audit(q) {
      const cells = q.cols * q.nrows, n = q.sol.length, T = q.tray.length;
      return [{ build: true, chance: Math.min(1, fact(n) / Math.pow(T * cells, n)) }];
    },
    decor(G) { W2X.decorDone(G, this.chars); },
    geo(st) {
      const q = st.q, u = 96, n = q.tray.length;
      if (K.L()) return { u, bx: Math.round(390 - q.cols * u / 2), by: Math.round(380 - q.nrows * u / 2), tc: 3, tx: 600, ty: n > 6 ? 118 : 150, ts: 104, tg: 12, done: [892, 572] };
      const tc = 4, tw = tc * 104 + (tc - 1) * 12;
      return { u, bx: Math.round(352 - q.cols * u / 2), by: Math.round(400 - q.nrows * u / 2), tc, tx: Math.round(352 - tw / 2), ty: n > 4 ? 626 : 680, ts: 104, tg: 12, done: [566, 884] };
    },
    cellBox(st, x, y) { const g = this.geo(st); return { x: g.bx + x * g.u, y: g.by + y * g.u, w: g.u, h: g.u }; },
    slotBox(st, i) { const g = this.geo(st), r = Math.floor(i / g.tc), c = i % g.tc, inRow = Math.min(g.tc, st.q.tray.length - r * g.tc), x0 = g.tx + (g.tc - inRow) * (g.ts + g.tg) / 2; return { x: Math.round(x0 + c * (g.ts + g.tg)), y: g.ty + r * (g.ts + g.tg), w: g.ts, h: g.ts }; },
    trayBox(st) { const n = st.q.tray.length, g = this.geo(st), rows = Math.ceil(n / g.tc), c = Math.min(n, g.tc), w = c * g.ts + (c - 1) * g.tg + 28, cx = g.tx + (g.tc * g.ts + (g.tc - 1) * g.tg) / 2; return { x: Math.round(cx - w / 2), y: g.ty - 14, w, h: rows * g.ts + (rows - 1) * g.tg + 28 }; },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.boardEl) return;
      place(st.boardEl, g.bx, g.by, q.cols * g.u, q.nrows * g.u); place(st.outlineEl, g.bx, g.by, q.cols * g.u, q.nrows * g.u);
      Object.keys(st.cells).forEach(id => { const [x, y] = id.slice(1).split('_').map(Number), b = this.cellBox(st, x, y); place(st.cells[id], b.x, b.y, b.w, b.h); });
      st.placed.forEach(p => this.posPiece(st, p));
      st.slots.forEach((e, i) => { const b = this.slotBox(st, i); place(e, b.x, b.y, b.w, b.h); });
      const t = this.trayBox(st); place(st.trayEl, t.x, t.y, t.w, t.h);
      if (st.doneBtn) { st.doneBtn._done.x = g.done[0]; st.doneBtn._done.y = g.done[1]; K.placeDone(st.doneBtn); }
    },
    posPiece(st, p) { const g = this.geo(st), P = PT[p.t]; place(p.el, g.bx + p.x * g.u - 4, g.by + p.y * g.u - 4, P.w * g.u + 8, P.h * g.u + 8); },
    drawBoard(st) {
      const q = st.q, u = 96, e = thing(st, 3, 'item'), s = svg('svg', { viewBox: '0 0 ' + q.cols * u + ' ' + q.nrows * u, width: '100%', height: '100%' });
      s.style.overflow = 'visible'; s.style.pointerEvents = 'none'; e.appendChild(s);
      svg('rect', { x: -14, y: -14, width: q.cols * u + 28, height: q.nrows * u + 28, rx: 22, fill: 'rgba(255,248,236,.93)', stroke: INK, 'stroke-width': 4 }, s);
      for (let y = 0; y < q.nrows; y++) for (let x = 0; x < q.cols; x++) svg('rect', { x: x * u + 3, y: y * u + 3, width: u - 6, height: u - 6, rx: 8, fill: 'rgba(43,33,24,.05)', stroke: 'rgba(43,33,24,.18)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, s);
      const parts = []; q.rows.forEach((row, y) => row.split('').forEach((ch, x) => { if (ch !== '.') parts.push(pts(halfPoly(ch, x, y), u)); }));
      parts.forEach(p => svg('polygon', { points: p, fill: INK, stroke: INK, 'stroke-width': 10, 'stroke-linejoin': 'round' }, s));
      parts.forEach(p => svg('polygon', { points: p, fill: '#BFE3FF' }, s));
      if (q.lines) q.sol.forEach(p => svg('polygon', { points: pts(PT[p.t].p, u, p.x * u, p.y * u), fill: 'none', stroke: 'rgba(43,33,24,.55)', 'stroke-width': 3, 'stroke-dasharray': '9 7', 'stroke-linejoin': 'round' }, s));
      /* the outline again above the pieces (a piece that sticks out is crossed by it): the edges no two parts share */
      const o = thing(st, 8, 'item'), so = svg('svg', { viewBox: '0 0 ' + q.cols * u + ' ' + q.nrows * u, width: '100%', height: '100%' }, o), cnt = {};
      so.style.overflow = 'visible'; so.style.pointerEvents = 'none';
      q.rows.forEach((row, y) => row.split('').forEach((ch, x) => { if (ch === '.') return; const P = halfPoly(ch, x, y); P.forEach((a, i) => { const b = P[(i + 1) % P.length], k = [a.join(','), b.join(',')].sort().join(' '); cnt[k] = (cnt[k] || 0) + 1; }); }));
      Object.keys(cnt).filter(k => cnt[k] === 1).forEach(k => { const [a, b] = k.split(' ').map(t => t.split(',').map(Number)); svg('line', { x1: a[0] * u, y1: a[1] * u, x2: b[0] * u, y2: b[1] * u, stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.8 }, so); });
      st.outlineEl = o;
      return e;
    },
    async present(st) {
      const q = st.q;
      st.placed = []; st.sel = null; st.cells = {};
      st.boardEl = this.drawBoard(st);
      st.trayEl = thing(st, 2, 'item'); Object.assign(st.trayEl.style, { borderRadius: '26px', background: 'rgba(185,122,60,.86)', boxShadow: '0 0 0 4px ' + INK + ', inset 0 6px 0 rgba(255,255,255,.25)' });
      for (let y = 0; y < q.nrows; y++) for (let x = 0; x < q.cols; x++) {
        const id = 'c' + x + '_' + y, e = thing(st, 9, 'item');
        K.reg(st, id, e, { drag: true, drops: () => this.cellDrops(st), onDragMove: () => this.follow(st, id), onDragEnd: ok => { if (!ok) this.unfollow(st); } });
        st.cells[id] = e;
      }
      st.slots = q.tray.map((p, i) => {
        const e = W3X.card(st, null, 8); e.appendChild(pieceSvg(p.t, q.d === 5 ? 42 : 64));
        K.reg(st, 'p' + i, e, { drag: true, drops: () => this.slotDrops(st, i) });
        return e;
      });
      st.doneBtn = K.done(st, 'check'); st.doneBtn.innerHTML = ROCKET; K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      K.pop(st, st.boardEl); st.slots.forEach((e, i) => K.pop(st, e, 60 + 40 * i));
      K.task(st, [[silIcon(q.rows)]]);
      K.say(st, '把它拼满！');
    },
    /* drop targets: one cell for a one-cell piece, every place its box fits for a bigger one; a board piece also the tray */
    cellDrops(st) {
      const out = [];
      Object.keys(st.cells).forEach(id => out.push({ id, rect: () => box(st.cells[id]) }));
      out.push({ id: 'tray', rect: () => this.trayBox(st) });
      return out;
    },
    slotDrops(st, i) {
      const q = st.q, P = PT[q.tray[i].t], g = this.geo(st);
      if (P.w * P.h === 1) return Object.keys(st.cells).map(id => ({ id, rect: () => box(st.cells[id]) }));
      const out = [];
      for (let y = 0; y + P.h <= q.nrows; y++) for (let x = 0; x + P.w <= q.cols; x++) out.push({ id: 'a' + x + '_' + y, rect: () => ({ x: g.bx + x * g.u, y: g.by + y * g.u, w: P.w * g.u, h: P.h * g.u }) });
      return out;
    },
    /* a board piece follows the finger while its cell is dragged */
    follow(st, id) {
      if (!st.drag || st.drag.id !== id) { const [x, y] = id.slice(1).split('_').map(Number), i = this.topAt(st, x, y); st.drag = { id, p: i >= 0 ? st.placed[i] : null }; }
      if (st.drag.p) { st.drag.p.el.style.transform = st.cells[id].style.transform; st.drag.p.el.style.zIndex = 44; }
    },
    unfollow(st) { const d = st.drag; st.drag = null; if (d && d.p) { d.p.el.style.zIndex = 7; d.p.el.animate([{ transform: d.p.el.style.transform || 'none' }, { transform: 'none' }], { duration: T(260), easing: EASE.pop }); d.p.el.style.transform = ''; } },
    topAt(st, x, y) { for (let i = st.placed.length - 1; i >= 0; i--) { const p = st.placed[i]; if (PT[p.t].c.some(([dx, dy]) => p.x + dx === x && p.y + dy === y)) return i; } return -1; },
    anchorOf(to) { const m = /^[ca](\d+)_(\d+)$/.exec(to || ''); return m ? { x: +m[1], y: +m[2] } : null; },
    fits(st, t, x, y) { const P = PT[t]; return x >= 0 && y >= 0 && x + P.w <= st.q.cols && y + P.h <= st.q.nrows; },
    select(st, i) {
      st.sel = st.sel === i ? null : i;
      st.slots.forEach((e, k) => { e.style.outline = k === st.sel ? '7px solid ' + GOLD : ''; e.style.outlineOffset = '3px'; });
      Sfx.tap && Sfx.tap();
    },
    put(st, slot, x, y, gold) {
      const q = st.q, t = q.tray[slot].t, P = PT[t];
      x = clamp(x, 0, q.cols - P.w); y = clamp(y, 0, q.nrows - P.h);
      if (q.fin && st.placed.some(p => p.slot === slot)) return false;
      const e = thing(st, 7, 'item'); e.appendChild(pieceSvg(t, 96, gold));
      const p = { t, x, y, slot: q.fin ? slot : -1, el: e };
      st.placed.push(p); this.posPiece(st, p);
      if (q.fin) { st.slots[slot].style.visibility = 'hidden'; }
      if (st.sel != null) this.select(st, st.sel);
      Sfx.place(); K.pop(st, e);
      return 'ok';
    },
    remove(st, i, quiet) {
      const p = st.placed.splice(i, 1)[0]; if (!p) return;
      const e = p.el, b = p.slot >= 0 ? this.slotBox(st, p.slot) : this.trayBox(st);
      st.scope.anim(e, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.5)' }], { duration: T(220), fill: 'forwards' }).then(() => e.remove());
      if (p.slot >= 0) { const s = st.slots[p.slot]; s.style.visibility = ''; K.pop(st, s); }
      if (!quiet) Sfx.back();
      return b;
    },
    onDrop(st, id, to) {
      let m;
      if ((m = /^p(\d+)$/.exec(id))) {
        const i = +m[1]; st.slots[i].style.transform = '';
        const a = this.anchorOf(to); if (!a) return 'free';
        return this.put(st, i, a.x, a.y) || 'free';
      }
      if ((m = /^c(\d+)_(\d+)$/.exec(id))) {
        const cx = +m[1], cy = +m[2]; st.cells[id].style.transform = '';
        const i = this.topAt(st, cx, cy); st.drag = null;
        if (i < 0) return 'free';
        const p = st.placed[i]; p.el.style.transform = ''; p.el.style.zIndex = 7;
        if (to === 'tray') { this.remove(st, i); return 'ok'; }
        const a = this.anchorOf(to); if (!a) return 'free';
        const nx = p.x + a.x - cx, ny = p.y + a.y - cy;
        if (!this.fits(st, p.t, nx, ny)) { Sfx.back(); return 'free'; }
        p.x = nx; p.y = ny; st.placed.splice(i, 1); st.placed.push(p); this.posPiece(st, p); Sfx.place();
        return 'ok';
      }
      return false;
    },
    onGesture(st, name, p) {
      if (st.picked || !st.cells) return false;
      const id = p.id || '';
      if (name === 'drop') return this.onDrop(st, id, p.to);
      if (name !== 'tap') return false;
      if (id === 'done') return this.launch(st);
      let m;
      if ((m = /^p(\d+)$/.exec(id))) { this.select(st, +m[1]); return 'ok'; }
      if ((m = /^c(\d+)_(\d+)$/.exec(id))) {
        const x = +m[1], y = +m[2];
        if (st.sel != null) return this.put(st, st.sel, x, y) || 'free';
        const i = this.topAt(st, x, y); if (i < 0) return 'free';
        this.remove(st, i); return 'ok';
      }
      return false;
    },
    launch(st) {
      if (!st.placed.length) { K.wiggle(st, st.doneBtn); return 'free'; }
      st.picked = true; if (st.sel != null) this.select(st, st.sel);
      const r = this.analyze(st, st.placed); st.res = r;
      Session.submit(st, r.code);
      return 'ok';
    },
    /* what the board holds: bad pieces (i -> 'out' | 'dir'), the quarters still empty, a code */
    analyze(st, list) {
      const sil = silOf(st.q.rows), cover = {}, bad = new Map();
      /* first what lies (partly) outside the outline, then what lies on a piece put before it */
      list.forEach((p, i) => {
        PT[p.t].c.forEach(([dx, dy, h]) => {
          const s = sil[(p.x + dx) + ',' + (p.y + dy)] || [];
          if (!s.length) bad.set(i, 'out');
          else if (QS[h].some(x => !s.includes(x)) && !bad.has(i)) bad.set(i, SMALL.includes(p.t) ? 'dir' : 'out');
        });
      });
      list.forEach((p, i) => {
        if (bad.has(i)) return;
        const ks = PT[p.t].c.flatMap(([dx, dy, h]) => QS[h].map(x => (p.x + dx) + ',' + (p.y + dy) + ':' + x));
        if (ks.some(k => cover[k] != null)) bad.set(i, 'dir'); else ks.forEach(k => { cover[k] = i; });
      });
      const ok = {}; list.forEach((p, i) => { if (!bad.has(i)) PT[p.t].c.forEach(([dx, dy, h]) => QS[h].forEach(x => { ok[(p.x + dx) + ',' + (p.y + dy) + ':' + x] = 1; })); });
      const gaps = []; Object.keys(sil).forEach(k => { const miss = sil[k].filter(x => !ok[k + ':' + x]); if (miss.length) gaps.push({ k, miss }); });
      const kinds = Array.from(bad.values());
      const code = kinds.includes('out') ? 'out' : kinds.includes('dir') ? 'dir' : gaps.length ? 'gap' : 'ok';
      return { bad, gaps, code };
    },
    LINE: { out: '有一块出去了', dir: '这块方向不对', gap: '还有空的地方' },
    async feedback(st, ans) {
      const r = st.res || this.analyze(st, st.placed);
      r.bad.forEach((k, i) => { const p = st.placed[i]; if (p) K.wiggle(st, p.el); });
      W5U.say(st, this.LINE[ans] || this.LINE.gap);
      await st.scope.wait(T(600));
    },
    /* what fills the empty places: L1-L3 the halves / squares each cell still misses (two triangles at L3); L4-L5 the
       solution's pieces that are not on the board */
    fillPlan(st) {
      const q = st.q, out = [];
      if (q.fin) { q.sol.forEach(s => { if (!st.placed.some(p => p.t === s.t && p.x === s.x && p.y === s.y)) out.push(s); }); return out; }
      const r = this.analyze(st, st.placed);
      r.gaps.forEach(({ k, miss }) => {
        const [x, y] = k.split(',').map(Number), key = miss.slice().sort().join('');
        if (miss.length === 4) { if (q.d === 3 || !q.tray.some(p => p.t === 's')) { out.push({ t: 'a', x, y, two: 1 }); out.push({ t: 'd', x, y, two: 2 }); } else out.push({ t: 's', x, y }); }
        else { const t = 'abcd'.split('').find(h => QS[h].slice().sort().join('') === key); if (t) out.push({ t, x, y }); }
      });
      return out;
    },
    slotFor(st, t) { const q = st.q; return q.tray.findIndex((p, i) => p.t === t && !(q.fin && st.placed.some(o => o.slot === i))); },
    /* 1. the pieces that are wrong ringed blue (or the empty places); 2. they go, the helper fills the rest in gold;
       3. the board ringed gold: "看，拼满了" */
    async explain(st, ans) {
      const my = st, q = st.q, r = this.analyze(st, st.placed);
      const badIdx = Array.from(r.bad.keys());
      let rings;
      if (badIdx.length) rings = W5U.blue(st, badIdx.map(i => st.placed[i].el));
      else {
        st.holes = r.gaps.map(({ k, miss }) => {
          const [x, y] = k.split(',').map(Number), b = this.cellBox(st, x, y), e = thing(st, 6, 'item');
          place(e, b.x, b.y, b.w, b.h);
          const h = miss.length === 4 ? 'F' : 'abcd'.split('').find(t => QS[t].slice().sort().join('') === miss.slice().sort().join('')) || 'F';
          const s = svg('svg', { viewBox: '0 0 96 96', width: '100%', height: '100%' }, e); s.style.pointerEvents = 'none';
          svg('polygon', { points: pts(halfPoly(h, 0, 0), 96), fill: 'rgba(79,179,255,.35)' }, s);
          return e;
        });
        rings = W5U.blue(st, st.holes);
      }
      await fbDone(st); if (!Session.alive(my)) return;
      await W5U.beat(st); if (!Session.alive(my)) return;
      /* the wrong ones go back */
      W5U.hide(rings);
      badIdx.sort((a, b) => b - a).forEach(i => this.remove(st, i, true));
      if (q.fin) for (let i = st.placed.length - 1; i >= 0; i--) { const p = st.placed[i]; if (!q.sol.some(s => s.t === p.t && s.x === p.x && s.y === p.y)) this.remove(st, i, true); }
      (st.holes || []).forEach(e => e.remove());
      Sfx.back();
      await st.scope.wait(T(260)); if (!Session.alive(my)) return;
      /* the helper puts the missing pieces, gold-edged, one by one */
      const plan = this.fillPlan(st), step = Math.max(110, Math.min(260, 1000 / Math.max(1, plan.length)));
      let said = false;
      for (const s of plan) {
        if (!Session.alive(my)) return;
        const slot = this.slotFor(st, s.t), from = slot >= 0 ? this.slotBox(st, slot) : this.trayBox(st);
        const e = thing(st, 7, 'item'); e.appendChild(pieceSvg(s.t, 96, true));
        const p = { t: s.t, x: s.x, y: s.y, slot: q.fin ? slot : -1, el: e }; st.placed.push(p); this.posPiece(st, p);
        if (q.fin && slot >= 0) st.slots[slot].style.visibility = 'hidden';
        const b = box(e);
        if (!ff(st)) await st.scope.anim(e, [{ transform: 'translate(' + (from.x - b.x) + 'px,' + (from.y - b.y) + 'px) scale(.45)' }, { transform: 'none' }], { duration: T(step), easing: EASE.glide });
        Sfx.place();
        if (s.two === 2 && !said) { said = true; await say(st, '两个三角拼成方'); }
      }
      if (!Session.alive(my)) return;
      W5U.gold(st, st.boardEl, 10);
      await W5U.sum(st, '看，拼满了');
      await st.scope.wait(T(150));
    },
    rightEls(st) { return [st.boardEl]; },
    async reveal(st) {
      const my = st; Sfx.reveal();
      st.placed.forEach((p, i) => K.hop(st, p.el, 10));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, st.boardEl, 10); this.cheerAll(st);
      st.summary = '看，拼满了'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* the tests' and the first demo's step: the solution piece by piece (a piece not in it is tapped away first), then 发射.
       'wrong': one piece short (now and then a wrong piece in its place), then 发射 */
    next(st, strat) {
      if (st.picked || !st.cells) return null;
      const q = st.q, inSol = p => q.sol.some(s => s.t === p.t && s.x === p.x && s.y === p.y);
      if (strat !== 'wrong') {
        const b = st.placed.findIndex(p => !inSol(p));
        if (b >= 0) { const p = st.placed[b], c = PT[p.t].c.find(([dx, dy]) => this.topAt(st, p.x + dx, p.y + dy) === b); if (c) return { g: 'tap', p: { id: 'c' + (p.x + c[0]) + '_' + (p.y + c[1]) } }; }
      }
      const todo = q.sol.filter(s => !st.placed.some(p => p.t === s.t && p.x === s.x && p.y === s.y));
      if (todo.length > (strat === 'wrong' ? 1 : 0)) return this.dropStep(st, todo[0]);
      if (strat === 'wrong' && todo.length === 1 && !st.nxAlt && st.gen % 3) {
        const s = todo[0], free = t => t !== s.t && this.slotFor(st, t) >= 0 && !q.sol.some(o => o.t === t && o.x === s.x && o.y === s.y);
        const alt = st.gen % 3 === 1 ? 's' : (SMALL.includes(s.t) ? SMALL.split('').find(free) : null);
        if (alt && free(alt) && PT[alt].w === 1 && PT[alt].h === 1) { st.nxAlt = true; return this.dropStep(st, { t: alt, x: s.x, y: s.y }); }
      }
      return { g: 'tap', p: { id: 'done' } };
    },
    dropStep(st, s) {
      const i = this.slotFor(st, s.t); if (i < 0) return { g: 'tap', p: { id: 'done' } };
      const P = PT[s.t], g = this.geo(st), to = (P.w * P.h === 1 ? 'c' : 'a') + s.x + '_' + s.y;
      return { g: 'drop', p: { id: 'p' + i, to }, to: { x: g.bx + (s.x + P.w / 2) * g.u, y: g.by + (s.y + P.h / 2) * g.u } };
    },
    /* how to act (never which piece where): a piece dragged half-way to the board */
    gestureHint(st) {
      if (!st.slots || !st.slots[0]) return; const a = mid(st.slots[0]), b = mid(st.boardEl);
      Hand.busy++; Hand.drag(st.scope, a.x, a.y, a.x + (b.x - a.x) * 0.6, a.y + (b.y - a.y) * 0.6, 700).then(() => { Hand.done(); Hand.hide(st.scope); });
    },
    workEls(st) { return st.slots || []; },
    snap(st) { return { placed: (st.placed || []).map(p => p.t + p.x + p.y).join(' ') }; },
    lines() { return uniq([this.intro, '把它拼满！', '看，拼满了', '两个三角拼成方'].concat(Object.values(this.LINE), this.praise)); },
  };
  /* ================================================================ J6 数！ 数图形，填表格 (count5)
     A picture built of shapes. L1-L2: a few shapes in the squares of a 4 x 4 grid (sizes differ at L2). L3-L5: a real picture
     - robot, rocket, train, house, owl, castle - every part a shape filling its own block of the grid (one cell, or 2 x 1,
     1 x 2, 2 x 2, 3 x 1, 4 x 1) at one scale, the parts touching so the outline reads (each part still its own tap block of
     >= 88); the picture decides how many of each kind (a part can be one of 1-3 shapes). A table: one row per kind of shape - its outline, [−] the count [+]. Tapping a part ticks
     it (only to help him keep track - it never fills the table). "好了" judges the table.
       L1 triangles and circles, 1-4 each, upright, all the same size
       L2 + squares, sizes differ, some triangles upside down; 1-5 each
       L3 + rectangles: a square turned 45° is still a square, a long rectangle is not one; 1-5 each
       L4 four kinds, 12-16 parts; the table right, then "哪种最多？" - tap a row (both parts must be right)
       L5 + half circles, up to 6 each; the table right, then "三角形比圆多几个？" (five number cards)
     A random table is right 1 time in 7 per row (< 1 in 49 with two rows). Wrong: the first wrong row ringed blue ("三角形不是
     四个"), that kind's parts light up one by one with a count (a turned square turns upright and back: "转一转，还是方的"),
     the row gets its number in gold ("三角形有三个"). Part two: his row / card blue, the right one gold ("三角形最多" /
     the two rows side by side: "多两个"). */
  const KIND6 = ['tri', 'circle', 'sq', 'rect', 'semi'];
  const KN6 = { tri: '三角形', circle: '圆', sq: '正方形', rect: '长方形', semi: '半圆' };
  /* the pictures: the 16 squares of a 4 x 4 grid (column, row) in the order they are used, and the kind a square likes */
  const PIC6 = {
    robot: ['10 20 11 21 12 22 13 23 01 31 02 32 00 30 03 33', { '10': 'sq', '20': 'sq', '13': 'rect', '23': 'rect', '00': 'tri', '30': 'tri' }],
    rocket: ['10 20 11 21 12 22 02 32 13 23 01 31 03 33 00 30', { '10': 'tri', '20': 'tri', '02': 'tri', '32': 'tri', '11': 'circle', '21': 'circle' }],
    train: ['01 11 21 31 02 12 22 32 30 00 10 20 03 13 23 33', { '02': 'circle', '12': 'circle', '22': 'circle', '32': 'circle', '00': 'rect', '30': 'sq' }],
    castle: ['01 11 21 31 02 12 22 32 00 30 10 20 03 13 23 33', { '00': 'tri', '30': 'tri', '10': 'tri', '20': 'tri', '22': 'semi' }],
    owl: ['10 20 11 21 12 22 00 30 01 31 02 32 13 23 03 33', { '00': 'tri', '30': 'tri', '11': 'circle', '21': 'circle', '13': 'semi', '23': 'semi' }],
  };
  /* L3-L5 pictures: parts [column, row, width, height, the shapes it can be (t c s r h), flags: o optional, d a triangle
     upside down, v a one-cell rectangle standing, n / L / R a half circle's dome down / left / right, 4 a square may be
     turned 45 degrees] */
  const PIC6B = {
    robot: [[1, 0, 2, 1, 'rh'], [0, 0, 1, 1, 'tc', 'o'], [3, 0, 1, 1, 'tc', 'o'], [1, 1, 2, 2, 'sc', '4'], [0, 1, 1, 1, 'rc'], [3, 1, 1, 1, 'rc'],
      [0, 2, 1, 1, 'cht'], [3, 2, 1, 1, 'cht'], [1, 3, 1, 1, 'rs', 'v'], [2, 3, 1, 1, 'rs', 'v'], [0, 3, 1, 1, 'ht', 'o'], [3, 3, 1, 1, 'ht', 'o']],
    rocket: [[1, 0, 2, 1, 't'], [1, 1, 1, 1, 'cs', '4'], [2, 1, 1, 1, 'cs', '4'], [1, 2, 1, 1, 'rs', 'v'], [2, 2, 1, 1, 'rs', 'v'], [0, 2, 1, 1, 't'], [3, 2, 1, 1, 't'],
      [0, 1, 1, 1, 'rch', 'vo'], [3, 1, 1, 1, 'rch', 'vo'], [1, 3, 1, 1, 'thc', 'dn'], [2, 3, 1, 1, 'thc', 'dn'], [0, 3, 1, 1, 'c', 'o'], [3, 3, 1, 1, 'c', 'o']],
    train: [[0, 0, 1, 1, 'rs', 'v'], [1, 0, 1, 1, 'ch', 'o'], [2, 0, 1, 1, 'c', 'o'], [3, 0, 1, 1, 'th'], [0, 1, 3, 1, 'r'], [3, 1, 1, 1, 'sr'],
      [0, 2, 1, 1, 'c'], [1, 2, 1, 1, 'ch', 'n'], [2, 2, 1, 1, 'ch', 'n'], [3, 2, 1, 1, 'c'], [0, 3, 4, 1, 'r', 'o']],
    house: [[0, 0, 1, 1, 'c', 'o'], [1, 0, 2, 1, 't'], [3, 0, 1, 1, 'rs', 'vo'], [1, 1, 1, 1, 'sc', '4'], [2, 1, 1, 1, 'sc', '4'], [1, 2, 1, 1, 'r', 'v'], [2, 2, 1, 1, 'sch', '4'],
      [0, 1, 1, 1, 'tc'], [0, 2, 1, 1, 'r', 'v'], [3, 1, 1, 1, 'tc', 'o'], [3, 2, 1, 1, 'r', 'vo'], [1, 3, 2, 1, 'rh', 'o'], [0, 3, 1, 1, 'hc', 'o'], [3, 3, 1, 1, 'hc', 'o']],
    owl: [[0, 0, 1, 1, 't'], [3, 0, 1, 1, 't'], [1, 0, 2, 1, 'hr'], [1, 1, 1, 1, 'cs', '4'], [2, 1, 1, 1, 'cs', '4'], [0, 1, 1, 2, 'rh', 'L'], [3, 1, 1, 2, 'rh', 'R'],
      [1, 2, 2, 1, 'hrc', 'n'], [1, 3, 1, 1, 'tc'], [2, 3, 1, 1, 'tc'], [0, 3, 1, 1, 'r', 'o'], [3, 3, 1, 1, 'r', 'o']],
    castle: [[0, 0, 1, 1, 't'], [3, 0, 1, 1, 't'], [1, 0, 1, 1, 't', 'o'], [2, 0, 1, 1, 't', 'o'], [0, 1, 1, 2, 'r'], [3, 1, 1, 2, 'r'], [1, 1, 1, 1, 'sc', '4'], [2, 1, 1, 1, 'sc', '4'],
      [1, 2, 2, 1, 'hr'], [0, 3, 1, 1, 's', 'o'], [1, 3, 1, 1, 'sh', 'o'], [2, 3, 1, 1, 'sh', 'o'], [3, 3, 1, 1, 's', 'o']],
  };
  /* each part's colour, by its role in the picture (a robot's limbs blue, a rocket's nose and fins red ...) */
  const PIC6C = { robot: 'BYYKBBYYBBRR', rocket: 'RBBWWRRKKOYWW', train: 'KWYRGRKKKKO', house: 'YROBBOBGOGOKGG', owl: 'OOOYYPPWOOGG', castle: 'RRYYKKBBOKWWK' };
  const COL6 = { R: '#FF6B5B', B: '#4FB3FF', G: '#5CC46E', Y: '#FFC93C', P: '#B57BFF', O: '#FF9F43', W: '#EEF2F7', K: '#B7C0CC' };
  const LET6 = { t: 'tri', c: 'circle', s: 'sq', r: 'rect', h: 'semi' };
  /* a part filling its block (W x H units), the same scale for every part; its turn is about the block's middle */
  function part6(g, kind, W, H, rot, fill) {
    const i = 4, a = { fill, stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, G0 = svg('g', { transform: 'translate(' + W / 2 + ' ' + H / 2 + ')' }, g);
    const T6 = 'rotate(' + rot + ')', w = rot % 180 ? H : W, h = rot % 180 ? W : H;
    if (kind === 'circle') return svg('circle', Object.assign({ cx: 0, cy: 0, r: Math.min(W, H) / 2 - i }, a), G0);
    if (kind === 'semi') { const r = Math.min(w / 2, h) - i; return svg('path', Object.assign({ d: 'M' + (-r) + ' ' + (r / 2) + 'A' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + (r / 2) + 'Z', transform: T6 }, a), G0); }
    if (kind === 'tri') return svg('polygon', Object.assign({ points: [[0, -h / 2 + i], [w / 2 - i, h / 2 - i], [-w / 2 + i, h / 2 - i]].map(p => p.join(',')).join(' '), transform: T6 }, a), G0);
    if (kind === 'sq') { const q = (Math.min(W, H) - 2 * i) / 2 * (rot % 90 ? 0.72 : 1); return svg('rect', Object.assign({ x: -q, y: -q, width: 2 * q, height: 2 * q, transform: T6 }, a), G0); }
    if (W === H) { const q = W / 2 - i; return svg('rect', Object.assign({ x: -q, y: -q * 0.54, width: 2 * q, height: q * 1.08, transform: T6 }, a), G0); }
    return svg('rect', Object.assign({ x: -W / 2 + i, y: -H / 2 + i, width: W - 2 * i, height: H - 2 * i }, a), G0);
  }
  const J6KINDS = [null, ['tri', 'circle'], ['tri', 'circle', 'sq'], ['tri', 'circle', 'sq', 'rect'], ['tri', 'circle', 'sq', 'rect'], KIND6];
  const PAIRS6 = [['tri', 'circle'], ['sq', 'circle'], ['rect', 'circle'], ['semi', 'circle'], ['circle', 'semi']];
  /* one part drawn in a box of s: kind, scale, turn (tri 180 upside down, sq 45 a diamond, rect 90 standing, semi 0-270) */
  function shape6(g, kind, s, k, rot, fill, stroke, sw) {
    const c = s / 2, r = s * k / 2, a = { fill, stroke: stroke || INK, 'stroke-width': sw || 4, 'stroke-linejoin': 'round' };
    const T6 = 'rotate(' + rot + ' ' + c + ' ' + c + ')';
    if (kind === 'circle') return svg('circle', Object.assign({ cx: c, cy: c, r: r * 0.92 }, a), g);
    if (kind === 'tri') return svg('polygon', Object.assign({ points: [[c, c - r], [c + r * 1.05, c + r * 0.8], [c - r * 1.05, c + r * 0.8]].map(p => p.join(',')).join(' '), transform: T6 }, a), g);
    if (kind === 'sq') { const h = r * (rot % 90 ? 0.74 : 0.86); return svg('rect', Object.assign({ x: c - h, y: c - h, width: 2 * h, height: 2 * h, transform: T6 }, a), g); }
    if (kind === 'rect') return svg('rect', Object.assign({ x: c - r, y: c - r * 0.42, width: 2 * r, height: r * 0.84, transform: T6 }, a), g);
    return svg('path', Object.assign({ d: 'M' + (c - r) + ' ' + (c + r * 0.35) + 'A' + r + ' ' + r + ' 0 0 1 ' + (c + r) + ' ' + (c + r * 0.35) + 'Z', transform: T6 }, a), g);
  }
  function icon6(kind, s, color) { const e = svg('svg', { viewBox: '0 0 ' + s + ' ' + s, width: s, height: s }); e.style.pointerEvents = 'none'; shape6(e, kind, s, 0.78, 0, color || '#fff', INK, 4); return e; }
  /* the count: dots in a frame of five (two rows past five); with numerals (L4-L5) the numeral beside them */
  function dots6(n, w, num) {
    const e = svg('svg', { viewBox: '0 0 ' + w + ' 76', width: w, height: 76 }); e.style.pointerEvents = 'none';
    const dw = num ? w * 0.6 : w, x0 = num ? w - dw : 0, p = dw / 5;
    for (let i = 0; i < (n > 5 ? 10 : 5); i++) { const r = Math.floor(i / 5), c = i % 5; svg('circle', { cx: x0 + p * (c + 0.5), cy: n > 5 ? 22 + r * 32 : 38, r: p * 0.36, fill: i < n ? '#FF6B5B' : 'rgba(43,33,24,.12)', stroke: i < n ? INK : 'none', 'stroke-width': 2.5 }, e); }
    if (num) { const t = svg('text', { x: (w - dw) / 2, y: 54, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 900, fill: INK, 'font-family': 'system-ui,sans-serif' }, e); t.textContent = n; }
    return e;
  }
  const BTN6 = { m: '<svg viewBox="0 0 40 40" width="46" height="46" style="pointer-events:none"><rect x="7" y="16" width="26" height="8" rx="4" fill="#2B2118"/></svg>', p: '<svg viewBox="0 0 40 40" width="46" height="46" style="pointer-events:none"><rect x="7" y="16" width="26" height="8" rx="4" fill="#2B2118"/><rect x="16" y="7" width="8" height="26" rx="4" fill="#2B2118"/></svg>' };

  W5R.J6 = {
    kind0: 'count5', verb: '数！', intro: '机器人数图形！', praise: ['数得清清楚楚！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, kinds = J6KINDS[d];
      if (d >= 3) return this.genPic(G, d, rng, kinds);
      const pic = bagPick(G, 'j6p', Object.keys(PIC6));
      let cnt, most = -1, pair = null;
      for (let t = 0; t < 300; t++) {
        if (d === 1) cnt = kinds.map(() => rng.int(1, 4));
        else if (d <= 3) cnt = kinds.map(() => rng.int(1, 5));
        else if (d === 4) { if (most < 0) most = W5U.at(G, 4, 'j6m'); const m = rng.int(4, 6); cnt = kinds.map((_, i) => (i === most ? m : rng.int(2, m - 1))); }
        else { if (!pair) pair = bagPick(G, 'j6pair', PAIRS6); cnt = kinds.map(() => rng.int(1, 6)); const a = kinds.indexOf(pair[0]), b = kinds.indexOf(pair[1]); if (cnt[a] < cnt[b]) { const x = cnt[a]; cnt[a] = cnt[b]; cnt[b] = x; } if (cnt[a] === cnt[b]) continue; }
        const tot = cnt.reduce((a, b) => a + b, 0);
        if (tot > (d === 5 ? 14 : 16) || (d === 4 && tot < 12) || (d === 5 && tot < 10)) continue;
        break;
      }
      /* the parts: the picture's squares in order; a square takes the kind it likes while that kind has parts left */
      const order = PIC6[pic][0].split(' ').slice(0, cnt.reduce((a, b) => a + b, 0)), like = PIC6[pic][1], left = cnt.slice();
      const parts = order.map(sq => ({ sq, kind: null }));
      parts.forEach(p => { const k = kinds.indexOf(like[p.sq]); if (k >= 0 && left[k] > 0) { p.kind = kinds[k]; left[k]--; } });
      const rest = rng.shuffle(kinds.flatMap((k, i) => Array(left[i]).fill(k)));
      parts.forEach(p => { if (!p.kind) p.kind = rest.pop(); });
      parts.forEach(p => {
        p.x = +p.sq[0]; p.y = +p.sq[1]; p.col = rng.pick(W5U.pal);
        p.k = d === 1 ? 0.78 : rng.pick([0.56, 0.68, 0.8, 0.92]);
        p.rot = p.kind === 'tri' ? (d >= 2 && rng.chance(0.3) ? 180 : 0) : p.kind === 'sq' ? (d >= 3 && rng.chance(0.35) ? 45 : 0) : p.kind === 'rect' ? (rng.chance(0.4) ? 90 : 0) : p.kind === 'semi' ? rng.pick([0, 90, 180, 270]) : 0;
        if (p.kind === 'rect') p.k = Math.max(p.k, 0.8);
      });
      const q = { k: [d, pic, cnt.join('')], d, pic, kinds, cnt, parts, num: d >= 4 };
      if (d === 4) Object.assign(q, { most, answer: cnt.join(',') + '|' + most });
      else if (d === 5) { const a = kinds.indexOf(pair[0]), b = kinds.indexOf(pair[1]), diff = cnt[a] - cnt[b]; Object.assign(q, { pair: [a, b], diff, cards: W5U.nums(G, diff, 1, 7), answer: cnt.join(',') + '|' + diff }); }
      else q.answer = cnt.join(',') + '|';
      return q;
    },
    /* L3-L5: a picture; each part one of the shapes it can be, so that every kind is there (1-5; L5 1-6), at L4 12-16 parts
       with one kind the most (that kind from a bag), at L5 10-14 parts and the pair asked about not the same number */
    genPic(G, d, rng, kinds) {
      const most = d === 4 ? W5U.at(G, 4, 'j6m') : -1, pair = d === 5 ? bagPick(G, 'j6pair', PAIRS6) : null, lo = d === 4 ? 12 : d === 5 ? 10 : 6, hi = d === 4 ? 16 : d === 5 ? 14 : 13;
      const names = Object.keys(PIC6B).filter(n => PIC6B[n].length >= lo), first = bagPick(G, 'j6q' + d, names);
      for (let t = 0; t < 800; t++) {
        const pic = t < 300 ? first : rng.pick(names), parts = [];
        let bad = false;
        for (const [j, [x, y, w, h, ks, fl]] of PIC6B[pic].entries()) {
          const f = fl || '', can = ks.split('').map(c => LET6[c]).filter(k => kinds.includes(k));
          if (!can.length) { if (f.includes('o')) continue; bad = true; break; }
          if (f.includes('o') && rng.chance(d === 4 ? 0.2 : 0.45)) continue;
          const kind = rng.pick(can);
          const rot = kind === 'tri' ? (f.includes('d') ? 180 : 0) : kind === 'sq' ? (f.includes('4') && rng.chance(0.5) ? 45 : 0) : kind === 'rect' ? (w === 1 && h === 1 && f.includes('v') ? 90 : 0) : kind === 'semi' ? (f.includes('n') ? 180 : f.includes('L') ? 270 : f.includes('R') ? 90 : 0) : 0;
          parts.push({ x, y, w, h, kind, rot, col: COL6[PIC6C[pic][j]] });
        }
        if (bad) continue;
        const cnt = kinds.map(k => parts.filter(p => p.kind === k).length), tot = parts.length, top = d === 5 ? 6 : d === 4 ? 7 : 5;
        if (tot < lo || tot > hi || cnt.some(c => c < 1 || c > top)) continue;
        if (d === 4 && !cnt.every((c, i) => i === most || c < cnt[most])) continue;
        const q = { k: [d, pic, parts.map(p => p.kind[0] + p.rot).join('')], d, pic, kinds, cnt, parts, num: d >= 4, blocks: true };
        if (d === 4) return Object.assign(q, { most, answer: cnt.join(',') + '|' + most });
        if (d === 5) { const a = kinds.indexOf(pair[0]), b = kinds.indexOf(pair[1]), diff = cnt[a] - cnt[b]; if (diff < 1) continue; return Object.assign(q, { pair: [a, b], diff, cards: W5U.nums(G, diff, 1, 7), answer: cnt.join(',') + '|' + diff }); }
        q.answer = cnt.join(',') + '|';
        return q;
      }
      return null;
    },
    audit(q) { return [{ build: true, chance: Math.pow(1 / 7, q.kinds.length) * (q.d === 4 ? 1 / 4 : q.d === 5 ? 1 / 5 : 1) }]; },
    decor(G) { W3X.decor2(G, this.chars, true); },
    geo(st) {
      const L = K.L(), n = st.q.kinds.length;
      if (L) return { L, s: 92, px: 188, py: n > 4 ? 132 : 150, rw: 400, rh: 92, rx: 598, ry: n > 4 ? 102 : Math.round(338 - (n * 92 + (n - 1) * 8) / 2), per: 1, gap: n > 4 ? 6 : 8, done: [906, 600, 96] };
      return { L, s: 88, px: 176, py: 210, rw: 330, rh: 92, rx: 14, ry: 582, per: 2, gap: 4, cgap: 16, done: [566, 884, 110] };
    },
    rowBox(st, k) { const g = this.geo(st); if (g.per === 1) return { x: g.rx, y: g.ry + k * (g.rh + g.gap), w: g.rw, h: g.rh }; const r = Math.floor(k / 2), c = k % 2; return { x: g.rx + c * (g.rw + g.cgap), y: g.ry + r * (g.rh + g.gap), w: g.rw, h: g.rh }; },
    /* inside a row: icon | − | count | + */
    rowParts(st, k) {
      const b = this.rowBox(st, k), L = K.L(), iw = L ? 76 : 60, dw = b.w - iw - 2 * 88 - 16;
      return { icon: { x: b.x + 2, y: b.y + 4, w: iw, h: 84 }, m: { x: b.x + iw + 6, y: b.y + 2 }, disp: { x: b.x + iw + 100, y: b.y + 8, w: dw, h: 76 }, p: { x: b.x + b.w - 90, y: b.y + 2 } };
    },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.picEl) return;
      place(st.picEl, g.px - 12, g.py - 12, 4 * g.s + 24, 4 * g.s + 24);
      const W1 = p => p.w || 1, H1 = p => p.h || 1, x0 = Math.min(...q.parts.map(p => p.x)), x1 = Math.max(...q.parts.map(p => p.x + W1(p))), y0 = Math.min(...q.parts.map(p => p.y)), y1 = Math.max(...q.parts.map(p => p.y + H1(p)));
      const ox = (4 - (x1 - x0)) / 2 - x0, oy = (4 - (y1 - y0)) / 2 - y0;
      st.partEls.forEach((e, i) => { const p = q.parts[i]; place(e, Math.round(g.px + (p.x + ox) * g.s), Math.round(g.py + (p.y + oy) * g.s), W1(p) * g.s, H1(p) * g.s); });
      q.kinds.forEach((_, k) => {
        const R = st.rows[k], P = this.rowParts(st, k), b = this.rowBox(st, k);
        place(R.row, b.x, b.y, b.w, b.h); place(R.icon, P.icon.x, P.icon.y, P.icon.w, P.icon.h); place(R.m, P.m.x, P.m.y, 88, 88); place(R.p, P.p.x, P.p.y, 88, 88); place(R.disp, P.disp.x, P.disp.y, P.disp.w, P.disp.h);
        this.show(st, k);
      });
      if (st.cards) W5U.lay(st.cards, g.px + 2 * g.s, g.py + 2 * g.s, 100, 100, 14, 14, 3);
      if (st.doneBtn) { st.doneBtn._done.x = g.done[0]; st.doneBtn._done.y = g.done[1]; K.placeDone(st.doneBtn); }
    },
    show(st, k) { const R = st.rows[k]; R.disp.innerHTML = ''; R.disp.appendChild(dots6(st.vals[k], parseFloat(R.disp.style.width) || 120, st.q.num)); },
    async present(st) {
      const q = st.q, g = this.geo(st);
      st.vals = q.kinds.map(() => 0); st.ticks = q.parts.map(() => false); st.part2 = false;
      st.picEl = thing(st, 3, 'item'); Object.assign(st.picEl.style, { borderRadius: '24px', background: 'rgba(255,248,236,.92)', boxShadow: '0 0 0 4px ' + INK });
      st.partEls = q.parts.map((p, i) => {
        const W = (p.w || 1) * 92, H = (p.h || 1) * 92, e = thing(st, 6, 'item'), s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%' }, e); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
        if (q.blocks) { e._shape = part6(s, p.kind, W, H, p.rot, p.col); e._turn = a => e._shape.setAttribute('transform', 'rotate(' + a + ')'); }
        else { e._shape = shape6(s, p.kind, 92, p.k, p.rot, p.col); e._turn = a => e._shape.setAttribute('transform', 'rotate(' + a + ' 46 46)'); }
        K.reg(st, 'g' + i, e, {});
        return e;
      });
      st.rows = q.kinds.map((kind, k) => {
        const row = thing(st, 5, 'item'); Object.assign(row.style, { borderRadius: '20px', background: 'rgba(255,248,236,.94)', boxShadow: '0 0 0 4px ' + INK });
        const icon = thing(st, 6, 'item'); Object.assign(icon.style, { display: 'flex', alignItems: 'center', justifyContent: 'center' }); icon.appendChild(icon6(kind, 62));
        const m = W3X.card(st, null, 7); m.innerHTML = BTN6.m; K.reg(st, 'm' + k, m, {});
        const p = W3X.card(st, null, 7); p.innerHTML = BTN6.p; K.reg(st, 'p' + k, p, {});
        const disp = thing(st, 6, 'item');
        return { row, icon, m, p, disp };
      });
      st.doneBtn = K.done(st, 'check', g.done[0], g.done[1], g.done[2]); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      K.pop(st, st.picEl); st.partEls.forEach((e, i) => K.pop(st, e, 30 * i));
      K.task(st, [q.kinds.slice(0, 3).map((k, i) => ({ node: icon6(k, 44, W5U.pal[i]) })), ['q']]);
      K.say(st, '数一数，填表！');
    },
    tick(st, i) {
      st.ticks[i] = !st.ticks[i]; const e = st.partEls[i];
      if (st.ticks[i]) { const t = el('div', 'j6tick', e); t.innerHTML = '<svg viewBox="0 0 40 40" width="34" height="34"><circle cx="20" cy="20" r="17" fill="#5CC46E" stroke="#2B2118" stroke-width="3"/><path d="M11 21L18 28L30 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; Object.assign(t.style, { position: 'absolute', right: '-4px', top: '-4px', pointerEvents: 'none' }); Sfx.place(); }
      else { const t = e.querySelector('.j6tick'); if (t) t.remove(); Sfx.back(); }
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const id = p.id || '', q = st.q; let m;
      if (st.part2) {
        if (q.d === 4 && (m = /^r(\d)$/.exec(id))) { st.picked = true; K.pop(st, st.rows[+m[1]].row); Session.submit(st, st.vals.join(',') + '|' + m[1]); return 'ok'; }
        if (q.d === 5) { const i = K.cardIndex(id); if (i < 0) return false; st.picked = true; K.pop(st, st.cards[i]); Session.submit(st, st.vals.join(',') + '|' + st.opts[i]); return 'ok'; }
        return false;
      }
      if ((m = /^g(\d+)$/.exec(id))) { this.tick(st, +m[1]); return 'ok'; }
      if ((m = /^([mp])(\d)$/.exec(id))) {
        const k = +m[2], v = st.vals[k] + (m[1] === 'p' ? 1 : -1);
        if (v < 0 || v > 9) { K.wiggle(st, st.rows[k][m[1]]); return 'free'; }
        st.vals[k] = v; this.show(st, k); K.pop(st, st.rows[k].disp); Sfx.count(Math.max(1, v));
        return 'ok';
      }
      if (id === 'done') {
        const ok = st.vals.every((v, k) => v === q.cnt[k]);
        if (!ok || q.d <= 3) { st.picked = true; Session.submit(st, st.vals.join(',') + '|' + (q.d <= 3 ? '' : 'x')); return 'ok'; }
        this.toPart2(st); return 'ok';
      }
      return false;
    },
    /* the table is right: the second part (L4 a row, L5 a card); the buttons rest */
    toPart2(st) {
      const q = st.q; st.part2 = true; Sfx.reveal();
      const off = e => { e.style.visibility = 'hidden'; Input.unbind(e); };
      st.rows.forEach(R => { off(R.m); off(R.p); }); q.kinds.forEach((_, k) => { delete st.map['m' + k]; delete st.map['p' + k]; });
      off(st.doneBtn); delete st.map.done;
      st.partEls.forEach(e => { e.style.opacity = '.3'; Input.unbind(e); }); q.parts.forEach((_, i) => delete st.map['g' + i]);
      $$('.task', Stage.el).forEach(t => t.remove());
      if (q.d === 4) {
        st.rows.forEach((R, k) => { R.row.style.zIndex = 8; R.icon.style.zIndex = 9; R.disp.style.zIndex = 9; K.reg(st, 'r' + k, R.row, {}); K.pop(st, R.row, 60 * k); });
        K.task(st, [[{ node: icon6('tri', 44, '#FF6B5B') }], ['q']]);
        K.say(st, '哪种最多？');
      } else {
        const [a, b] = q.pair;
        W5U.cards(st, q.cards.map(v => { const n = UI.num(v, 64); n.style.pointerEvents = 'none'; return n; }), q.cards);
        st.cards.forEach((c, i) => { c.style.zIndex = 8; K.pop(st, c, 60 * i); });
        this.place(st);
        K.task(st, [[{ node: icon6(q.kinds[a], 44, '#FF6B5B') }], [{ node: icon6(q.kinds[b], 44, '#4FB3FF') }], ['q']]);
        K.say(st, this.cmpLine(q));
      }
    },
    cmpLine(q) { return KN6[q.kinds[q.pair[0]]] + '比' + KN6[q.kinds[q.pair[1]]] + '多几个？'; },
    parse(ans) { const [t, x] = String(ans).split('|'); return { vals: t.split(',').map(Number), x }; },
    wrongLine(st, ans) {
      const q = st.q, a = this.parse(ans), k = a.vals.findIndex((v, i) => v !== q.cnt[i]);
      if (k >= 0) return a.vals[k] > 0 ? KN6[q.kinds[k]] + '不是' + CNQ(a.vals[k]) + '个' : '有一行不对哦';
      if (q.d === 4) return KN6[q.kinds[+a.x]] + '不是最多';
      return '不是' + CNQ(+a.x) + '个';
    },
    async feedback(st, ans) { W5U.say(st, this.wrongLine(st, ans)); await st.scope.wait(T(600)); },
    /* 1. the wrong row blue; 2. that kind's parts light up one by one, counted (a turned square turns upright and back);
       3. the row's right number in gold. Part two: his row / card blue, (L5 the two rows framed: "多两个"), the right one gold */
    async explain(st, ans) {
      const my = st, q = st.q, a = this.parse(ans), bad = a.vals.map((v, i) => (v !== q.cnt[i] ? i : -1)).filter(i => i >= 0);
      if (bad.length) {
        const k = bad[0], rings = W5U.blue(st, st.rows[k].row);
        await fbDone(st); if (!Session.alive(my)) return;
        W5U.hide(rings);
        await W5U.beat(st); if (!Session.alive(my)) return;
        st.partEls.forEach(e => { e.style.opacity = '1'; });
        let n = 0, turned = null;
        for (let i = 0; i < q.parts.length; i++) {
          if (q.parts[i].kind !== q.kinds[k]) continue;
          if (!Session.alive(my)) return;
          n++; const e = st.partEls[i]; e._shape.setAttribute('stroke', '#E0A100'); e._shape.setAttribute('stroke-width', 8); K.hop(st, e, 12);
          if (q.parts[i].kind === 'sq' && q.parts[i].rot && turned == null) turned = i;
          await W5U.count(st, 150, n);
        }
        if (turned != null && !ff(st)) {
          const e = st.partEls[turned], p = q.parts[turned];
          const turn = (from, to) => { const t0 = performance.now(), dur = T(380); return new Promise(res => { const f = () => { const kk = dur ? Math.min(1, (performance.now() - t0) / dur) : 1; e._turn(from + (to - from) * kk); if (kk < 1 && Session.alive(my) && !st.ff) requestAnimationFrame(f); else { e._turn(to); res(); } }; f(); }); };
          await turn(p.rot, 0); await say(st, '转一转，还是方的'); await turn(0, p.rot);
        }
        if (!Session.alive(my)) return;
        bad.forEach(i => { st.vals[i] = q.cnt[i]; this.show(st, i); K.pop(st, st.rows[i].disp); });
        W5U.gold(st, bad.map(i => st.rows[i].row), 6);
        if (turned == null || ff(st)) await W5U.sum(st, KN6[q.kinds[k]] + '有' + CNQ(q.cnt[k]) + '个');
        await st.scope.wait(T(200));
        return;
      }
      if (q.d === 4) {
        const rings = W5U.blue(st, st.rows[+a.x].row);
        await fbDone(st); if (!Session.alive(my)) return;
        W5U.hide(rings);
        W5U.gold(st, st.rows[q.most].row, 6); K.hop(st, st.rows[q.most].row, 10);
        await W5U.sum(st, KN6[q.kinds[q.most]] + '最多');
        await st.scope.wait(T(300));
        return;
      }
      const rings = W5U.blue(st, W5U.cardOf(st, +a.x));
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      const [i, j] = q.pair; W5U.stay(st, st.rows[i].row); W5U.stay(st, st.rows[j].row); K.hop(st, st.rows[i].disp, 10);
      await W5U.sum(st, '多' + CNQ(q.diff) + '个'); if (!Session.alive(my)) return;
      W5U.gold(st, W5U.cardOf(st, q.diff));
      await st.scope.wait(T(500));
    },
    rightEls(st, ans) {
      const q = st.q, a = this.parse(ans), bad = a.vals.map((v, i) => (v !== q.cnt[i] ? i : -1)).filter(i => i >= 0);
      if (bad.length) return bad.map(i => st.rows[i].row);
      return q.d === 4 ? [st.rows[q.most].row] : [W5U.cardOf(st, q.diff)];
    },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      st.rows.forEach(R => K.hop(st, R.disp, 10));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      if (q.d === 4) { W5U.gold(st, st.rows[q.most].row, 6); st.summary = KN6[q.kinds[q.most]] + '最多'; }
      else if (q.d === 5) { W5U.gold(st, W5U.cardOf(st, q.diff)); st.summary = '多' + CNQ(q.diff) + '个'; }
      else { W5U.gold(st, st.rows.map(R => R.row), 6); st.summary = '表填对啦！'; }
      this.cheerAll(st); W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* tests: the + / − taps row by row, then 好了, then (L4 / L5) the row or the card. 'wrong': the first row one off - or,
       every other question at L4 / L5, the table right and the second part wrong */
    next(st, strat) {
      if (st.picked || !st.rows) return null;
      const q = st.q, part2wrong = strat === 'wrong' && q.d >= 4 && st.gen % 2 === 0;
      if (st.part2) {
        if (q.d === 4) { const k = strat === 'wrong' ? (q.most + 1) % q.kinds.length : q.most; return { g: 'tap', p: { id: 'r' + k } }; }
        const i = strat === 'wrong' ? q.cards.findIndex(v => v !== q.diff) : q.cards.indexOf(q.diff); return { g: 'tap', p: { id: 'card' + i } };
      }
      const want = q.cnt.slice(); if (strat === 'wrong' && !part2wrong) want[0] = want[0] < 9 ? want[0] + 1 : want[0] - 1;
      for (let k = 0; k < want.length; k++) { if (st.vals[k] < want[k]) return { g: 'tap', p: { id: 'p' + k } }; if (st.vals[k] > want[k]) return { g: 'tap', p: { id: 'm' + k } }; }
      return { g: 'tap', p: { id: 'done' } };
    },
    gestureHint(st) { if (st.part2 || !st.rows) return; W3X.tapHint(st, st.rows[0].p); },
    workEls(st) { return st.part2 ? (st.cards || st.rows.map(R => R.row)) : (st.rows || []).map(R => R.p); },
    snap(st) { return { vals: (st.vals || []).join(','), part2: !!st.part2 }; },
    lines() {
      const out = [this.intro, '数一数，填表！', '哪种最多？', '有一行不对哦', '转一转，还是方的', '表填对啦！'].concat(this.praise);
      KIND6.forEach(k => { out.push(KN6[k] + '最多', KN6[k] + '不是最多'); for (let n = 1; n <= 9; n++) out.push(KN6[k] + '不是' + CNQ(n) + '个'); for (let n = 1; n <= 6; n++) out.push(KN6[k] + '有' + CNQ(n) + '个'); });
      PAIRS6.forEach(([a, b]) => out.push(KN6[a] + '比' + KN6[b] + '多几个？'));
      for (let n = 1; n <= 7; n++) out.push('不是' + CNQ(n) + '个'); for (let n = 1; n <= 5; n++) out.push('多' + CNQ(n) + '个');
      return uniq(out);
    },
  };
  /* ================================================================ J7 分！ 拍下所有分法 (split5)
     A long block lunchbox with N buns in a row and a sliding block divider between them (never at an end: one bun a side at
     least); above it the 分合图 (the whole N on top, the two sides below) follows the divider; a camera button 拍 puts the
     split in the album (a split already there shakes "这个拍过了" - a step of the doing, not a mistake); "好了" judges.
     The divider is dragged (it snaps from gap to gap) or a bun is tapped (the divider jumps past it).
       L1 N = 4 (now and then 5), the album shows N − 1 empty frames · L2 N = 5 with frames · L3 N = 6, no frames
       L4 N = 7, no frames · L5 N = 8 (now and then 7), the divider starts in the middle (or one off it)
     Right: every split 1 | N−1 ... N−1 | 1 is in the album ("1 和 3" and "3 和 1" are two). A random album (each split taken
     or not) is right 1 time in 2^(N−1) <= 1 in 8. Wrong: the album sorts itself, the missing frames ringed blue ("还少了一种");
     the divider walks from the left, each photo lights up, the missing one is taken and ringed gold ("二和三"); "五有四种分法". */
  const CAMB = '<svg viewBox="0 0 40 40"><rect x="5" y="11" width="30" height="22" rx="4" fill="#fff" stroke="#2B2118" stroke-width="3"/><rect x="14" y="6" width="12" height="7" rx="2" fill="#fff" stroke="#2B2118" stroke-width="3"/><circle cx="20" cy="22" r="7" fill="#4FB3FF" stroke="#2B2118" stroke-width="3"/><circle cx="20" cy="22" r="3" fill="#2B2118"/><circle cx="30" cy="15" r="1.8" fill="#FF6B5B"/></svg>';
  function dotsIn(n, cx, cy, r, g, col) {
    const per = n <= 3 ? n : Math.ceil(n / 2), rows = n <= 3 ? 1 : 2, p = Math.min(r * 1.5 / per, r * 0.62), dr = p * 0.36;
    for (let i = 0; i < n; i++) { const ro = Math.floor(i / per), inRow = Math.min(per, n - ro * per), c = i % per; svg('circle', { cx: cx + (c - (inRow - 1) / 2) * p, cy: cy + (ro - (rows - 1) / 2) * p, r: dr, fill: col || '#FF6B5B', stroke: INK, 'stroke-width': 2 }, g); }
  }
  W5R.J7 = {
    kind0: 'split5', verb: '分！', intro: '包子分两盒！', praise: ['一种也没漏！'], props: ['bun'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      const N = d === 1 ? (rng.chance(0.75) ? 4 : 5) : d === 2 ? 5 : d === 3 ? 6 : d === 4 ? 7 : bagPick(G, 'j7n5', [8, 8, 7, 8, 7]);
      const k0 = d === 5 ? (N === 8 ? bagPick(G, 'j7m8', [4, 3, 4, 5]) : bagPick(G, 'j7m7', [3, 4])) : bagPick(G, 'j7k' + N, Array.from({ length: N - 1 }, (_, i) => i + 1));
      return { k: [d, N, k0], d, N, k0, frames: d <= 2, num: d >= 4, answer: Array.from({ length: N - 1 }, (_, i) => i + 1).join(',') };
    },
    audit(q) { return [{ build: true, chance: Math.pow(0.5, q.N - 1) }]; },
    decor(G) { W2X.decorDone(G, this.chars); },
    geo(st) {
      const N = st.q.N, L = K.L();
      if (L) return { L, s: 96, gap: 44, cx: 512, by: 392, bh: 132, dg: { cx: 250, cy: 166, r: 54, ly: 292, lx: 70, pr: 46 }, cam: [404, 166, 112], al: { x: 544, y: 114, w: 104, h: 100, g: 12, per: 4 } };
      const s = Math.min(96, Math.floor((676 - 40) / N));
      return { L, s, gap: 40, cx: 352, by: 448, bh: 132, dg: { cx: 196, cy: 262, r: 50, ly: 376, lx: 66, pr: 44 }, cam: [392, 236, 112], al: { x: 34, y: 610, w: 150, h: 116, g: 12, per: 4 } };
    },
    x0(st) { const g = this.geo(st); return g.cx - (st.q.N * g.s + g.gap) / 2; },
    bunX(st, i, k) { const g = this.geo(st); return this.x0(st) + i * g.s + g.s / 2 + (i >= (k == null ? st.k : k) ? g.gap : 0); },
    divX(st, k) { const g = this.geo(st); return this.x0(st) + (k == null ? st.k : k) * g.s + g.gap / 2; },
    slotBox(st, i) { const a = this.geo(st).al, c = i % a.per, r = Math.floor(i / a.per); return { x: a.x + c * (a.w + a.g), y: a.y + r * (a.h + a.g), w: a.w, h: a.h }; },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.box) return;
      const bw = q.N * g.s + g.gap + 36;
      place(st.box, Math.round(g.cx - bw / 2), g.by, bw, g.bh);
      this.layBuns(st, false);
      const c = g.cam; place(st.cam, c[0], c[1], c[2], c[2]);
      place(st.dg, g.dg.cx - g.dg.lx - g.dg.pr - 10, g.dg.cy - g.dg.r - 10, 2 * (g.dg.lx + g.dg.pr + 10), g.dg.ly - g.dg.cy + g.dg.r + g.dg.pr + 20);
      this.drawDiagram(st);
      { const a = g.al, n = Math.max(q.N - 1, 4), rows = Math.ceil(n / a.per); place(st.album, a.x - 12, a.y - 12, a.per * a.w + (a.per - 1) * a.g + 24, rows * a.h + (rows - 1) * a.g + 24); }
      (st.frames || []).forEach((e, i) => { const b = this.slotBox(st, i); place(e, b.x, b.y, b.w, b.h); });
      st.photos.forEach(ph => { const b = this.slotBox(st, ph.slot); place(ph.el, b.x, b.y, b.w, b.h); this.drawPhoto(st, ph); });
      if (st.doneBtn) K.placeDone(st.doneBtn);
    },
    /* the buns and the divider where k says (animated when it moves) */
    layBuns(st, anim) {
      const g = this.geo(st), hw = Math.max(88, g.s), y = g.by + 20, h = g.bh - 40;
      st.buns.forEach((e, i) => {
        const x = Math.round(this.bunX(st, i) - hw / 2), b = box(e);
        if (anim && b.w && Math.abs(b.x - x) > 1 && !fast()) e.animate([{ transform: 'translateX(' + (b.x - x) + 'px)' }, { transform: 'none' }], { duration: 180, easing: EASE.glide });
        place(e, x, y - 4, hw, h + 8);
        e.firstChild.style.width = e.firstChild.style.height = Math.min(84, g.s - 6) + 'px';
      });
      const dx = Math.round(this.divX(st) - 44), b = box(st.div);
      if (anim && b.w && Math.abs(b.x - dx) > 1 && !fast()) st.div.animate([{ transform: 'translateX(' + (b.x - dx) + 'px)' }, { transform: 'none' }], { duration: 180, easing: EASE.glide });
      place(st.div, dx, g.by - 10, 88, g.bh + 20);
    },
    drawDiagram(st, gold) {
      const q = st.q, g = this.geo(st), d = g.dg, e = st.dg, B = box(e), ox = B.x, oy = B.y, a = st.k, b = q.N - st.k;
      e.innerHTML = ''; const s = svg('svg', { viewBox: '0 0 ' + B.w + ' ' + B.h, width: '100%', height: '100%' }, e); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
      const W = { x: d.cx - ox, y: d.cy - oy }, P1 = { x: d.cx - d.lx - ox, y: d.ly - oy }, P2 = { x: d.cx + d.lx - ox, y: d.ly - oy };
      [P1, P2].forEach(P => svg('line', { x1: W.x, y1: W.y, x2: P.x, y2: P.y, stroke: INK, 'stroke-width': 5 }, s));
      const circ = (P, r, n, fill, dc) => { svg('circle', { cx: P.x, cy: P.y, r, fill, stroke: gold ? '#E0A100' : INK, 'stroke-width': gold ? 7 : 4 }, s);
        if (q.num) { const t = svg('text', { x: P.x, y: P.y - r * 0.12, 'text-anchor': 'middle', 'font-size': r * 0.78, 'font-weight': 900, fill: INK, 'font-family': 'system-ui,sans-serif' }, s); t.textContent = n; dotsIn(n, P.x, P.y + r * 0.5, r * 0.62, s, dc); }
        else dotsIn(n, P.x, P.y, r * 0.95, s, dc); };
      circ(W, d.r, q.N, '#FFF8EC', '#FF6B5B'); circ(P1, d.pr, a, '#DFF3FF', '#4FB3FF'); circ(P2, d.pr, b, '#FFF1C9', '#FF9F43');
    },
    /* a photo: the little lunchbox of that split (dots left | right; numerals at L4-L5) */
    drawPhoto(st, ph) {
      const q = st.q, e = ph.el, b = box(e), w = b.w, h = b.h; e.innerHTML = '';
      const s = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: '100%' }, e); s.style.pointerEvents = 'none';
      const a = ph.a, c = q.N - a, mx = 10, bx = w - 2 * mx, by = q.num ? h * 0.42 : h * 0.3, bh = q.num ? h * 0.4 : h * 0.42, cut = mx + bx * a / q.N;
      svg('rect', { x: mx, y: by, width: bx, height: bh, rx: 8, fill: '#FFF1C9', stroke: INK, 'stroke-width': 3 }, s);
      const p = Math.min(bx / (q.N + 1), bh * 0.8), r = p * 0.36;
      for (let i = 0; i < q.N; i++) { svg('circle', { cx: i < a ? mx + (i + 0.5) * (cut - mx) / a : cut + (i - a + 0.5) * (mx + bx - cut) / c, cy: by + bh / 2, r: Math.min(r, (i < a ? (cut - mx) / a : (mx + bx - cut) / c) * 0.38), fill: i < a ? '#4FB3FF' : '#FF9F43', stroke: INK, 'stroke-width': 1.8 }, s); }
      svg('line', { x1: cut, y1: by - 6, x2: cut, y2: by + bh + 6, stroke: '#E8414B', 'stroke-width': 5, 'stroke-linecap': 'round' }, s);
      if (q.num) { const t = svg('text', { x: w / 2, y: h * 0.32, 'text-anchor': 'middle', 'font-size': h * 0.28, 'font-weight': 900, fill: INK, 'font-family': 'system-ui,sans-serif' }, s); t.textContent = a + ' 和 ' + c; }
    },
    async present(st) {
      const q = st.q;
      st.k = q.k0; st.photos = [];
      st.box = thing(st, 3, 'item'); Object.assign(st.box.style, { borderRadius: '26px', background: 'linear-gradient(#FFE08A,#F5B324)', boxShadow: '0 0 0 5px ' + INK + ', inset 0 -10px 0 rgba(43,33,24,.12)' });
      st.buns = Array.from({ length: q.N }, (_, i) => { const e = thing(st, 6, 'item'); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center' }); e.appendChild(W5U.propImg('bun', 80, 80)); K.reg(st, 'b' + i, e, {}); return e; });
      st.div = thing(st, 8, 'item'); st.div.innerHTML = '<svg viewBox="0 0 88 152" width="100%" height="100%" preserveAspectRatio="none" style="pointer-events:none"><rect x="31" y="2" width="26" height="148" rx="9" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><circle cx="44" cy="22" r="5" fill="#fff"/><circle cx="44" cy="130" r="5" fill="#fff"/></svg>';
      K.reg(st, 'div', st.div, { slide: Array.from({ length: q.N - 1 }, (_, i) => ({ id: 's' + (i + 1), rect: () => { const g = this.geo(st); return { x: this.divX(st, i + 1) - g.s / 2, y: g.by - 20, w: g.s, h: g.bh + 40 }; } })) });
      st.dg = thing(st, 4, 'item');
      st.cam = W3X.card(st, null, 7); st.cam.innerHTML = CAMB; st.cam.firstChild.style.width = '70%'; st.cam.firstChild.style.pointerEvents = 'none'; K.reg(st, 'snap', st.cam, {});
      st.album = thing(st, 3, 'item'); Object.assign(st.album.style, { borderRadius: '22px', background: 'rgba(255,248,236,.88)', boxShadow: '0 0 0 4px ' + INK });
      st.frames = q.frames ? Array.from({ length: q.N - 1 }, () => this.frame(st)) : [];
      st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      K.pop(st, st.box); st.buns.forEach((e, i) => K.pop(st, e, 40 * i)); K.pop(st, st.cam, 200);
      K.task(st, [[W5U.prop('bun')], [{ node: (() => { const e = el('span', ''); e.innerHTML = CAMB; e.firstChild.setAttribute('width', 50); e.firstChild.setAttribute('height', 50); return e; })() }]]);
      K.say(st, '所有分法都拍下！');
    },
    frame(st) { const e = thing(st, 4, 'item'); Object.assign(e.style, { borderRadius: '14px', border: '4px dashed rgba(43,33,24,.5)', background: 'rgba(43,33,24,.06)', boxSizing: 'border-box' }); return e; },
    setK(st, k) {
      if (k < 1 || k > st.q.N - 1) return false;
      if (k === st.k) return 'free';
      st.k = k; this.layBuns(st, true); this.drawDiagram(st); Sfx.place();
      return 'ok';
    },
    snap(st) { return { k: st.k, album: (st.photos || []).map(p => p.a).join(',') }; },
    shoot(st) {
      const a = st.k, old = st.photos.find(p => p.a === a);
      if (old) { K.wiggle(st, old.el); Voice.say('这个拍过了', { tag: 'act' }); return 'free'; }
      const slot = st.photos.length, e = thing(st, 6, 'card'), b = this.slotBox(st, slot);
      e.style.zIndex = 6; place(e, b.x, b.y, b.w, b.h);
      const ph = { a, slot, el: e }; st.photos.push(ph); this.drawPhoto(st, ph);
      Sfx.pop(); Fx.flash && Fx.flash(); K.pop(st, e);
      if (st.q.frames && st.photos.length === st.q.N - 1) st.doneBtn.classList.add('ready');
      return 'ok';
    },
    onGesture(st, name, p) {
      if (st.picked || !st.buns) return false;
      const id = p.id || ''; let m;
      if (name === 'pass' && id === 'div') { m = /^s(\d+)$/.exec(p.at || ''); return m ? this.setK(st, +m[1]) || 'free' : false; }
      if (name === 'pick' && id === 'div') return 'free';
      if (name !== 'tap') return false;
      if ((m = /^b(\d+)$/.exec(id))) {
        const i = +m[1], k = i < st.k ? i : i + 1;
        if (k < 1 || k > st.q.N - 1) { K.wiggle(st, st.buns[i]); return 'free'; }
        return this.setK(st, k);
      }
      if (id === 'snap') return this.shoot(st);
      if (id === 'done') {
        if (!st.photos.length) { K.wiggle(st, st.doneBtn); return 'free'; }
        st.picked = true; Session.submit(st, st.photos.map(p => p.a).sort((a, b) => a - b).join(','));
        return 'ok';
      }
      return false;
    },
    missing(st, ans) { const have = String(ans).split(',').filter(Boolean).map(Number); return Array.from({ length: st.q.N - 1 }, (_, i) => i + 1).filter(a => !have.includes(a)); },
    async feedback(st, ans) { W5U.say(st, '还少了' + CNQ(this.missing(st, ans).length) + '种'); await st.scope.wait(T(600)); },
    /* 1. the album sorts itself, the empty frames blue; 2. the divider walks from the left, each photo lights up, a missing
       one is taken and ringed gold ("二和三"); 3. "五有四种分法" */
    async explain(st, ans) {
      const my = st, q = st.q, miss = this.missing(st, ans), N = q.N;
      st.photos.forEach(ph => { ph.slot = ph.a - 1; const b = this.slotBox(st, ph.slot), o = box(ph.el); if (!fast()) ph.el.animate([{ transform: 'translate(' + (o.x - b.x) + 'px,' + (o.y - b.y) + 'px)' }, { transform: 'none' }], { duration: 300, easing: EASE.glide }); place(ph.el, b.x, b.y, b.w, b.h); });
      (st.frames || []).forEach(e => e.remove());
      st.frames = Array.from({ length: N - 1 }, (_, i) => { const e = this.frame(st), b = this.slotBox(st, i); place(e, b.x, b.y, b.w, b.h); return e; });
      const rings = W5U.blue(st, miss.map(a => st.frames[a - 1]));
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      await W5U.beat(st); if (!Session.alive(my)) return;
      const per = Math.max(100, Math.min(220, 1000 / (N - 1)));
      st.newPh = [];
      for (let a = 1; a <= N - 1; a++) {
        if (!Session.alive(my)) return;
        st.k = a; this.layBuns(st, true); this.drawDiagram(st);
        const ph = st.photos.find(p => p.a === a);
        if (ph) { K.hop(st, ph.el, 10); Sfx.count(a); await st.scope.wait(T(per)); continue; }
        const e = thing(st, 6, 'card'), b = this.slotBox(st, a - 1); e.style.zIndex = 6; place(e, b.x, b.y, b.w, b.h);
        const np = { a, slot: a - 1, el: e }; st.photos.push(np); this.drawPhoto(st, np); st.newPh.push(e);
        Sfx.pop(); K.pop(st, e); W5U.gold(st, e, 4); this.drawDiagram(st, true);
        if (st.newPh.length === 1) { await say(st, CN[a] + '和' + CN[N - a]); await st.scope.wait(T(150)); } else await st.scope.wait(T(per));
      }
      if (!Session.alive(my)) return;
      await W5U.sum(st, CN[N] + '有' + CNQ(N - 1) + '种分法');
      await st.scope.wait(T(150));
    },
    rightEls(st) { return st.newPh || []; },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      st.photos.forEach((ph, i) => K.hop(st, ph.el, 10));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, st.photos.map(p => p.el), 8); this.cheerAll(st);
      st.summary = CN[q.N] + '有' + CNQ(q.N - 1) + '种分法'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* tests: move the divider to the next split missing (tap the bun it jumps past), 拍; then 好了. 'wrong': one split left out */
    next(st, strat) {
      if (st.picked || !st.buns) return null;
      const q = st.q, have = st.photos.map(p => p.a), todo = Array.from({ length: q.N - 1 }, (_, i) => i + 1).filter(a => !have.includes(a));
      if (todo.length > (strat === 'wrong' ? 1 : 0)) {
        const a = todo.includes(st.k) && !(strat === 'wrong' && todo.length === 2 && st.k === todo[1]) ? st.k : todo.find(x => x !== st.k);
        if (a !== st.k) return { g: 'tap', p: { id: 'b' + (a < st.k ? a : a - 1) } };
        return { g: 'tap', p: { id: 'snap' } };
      }
      return { g: 'tap', p: { id: 'done' } };
    },
    gestureHint(st) { if (!st.div) return; const c = mid(st.div), g = this.geo(st); Hand.busy++; Hand.drag(st.scope, c.x, c.y, c.x + g.s, c.y, 600).then(() => { Hand.done(); Hand.hide(st.scope); }); },
    workEls(st) { return st.div ? [st.div, st.cam] : []; },
    lines() {
      const out = [this.intro, '所有分法都拍下！', '这个拍过了'].concat(this.praise);
      for (let n = 1; n <= 7; n++) out.push('还少了' + CNQ(n) + '种');
      for (let N = 4; N <= 8; N++) { out.push(CN[N] + '有' + CNQ(N - 1) + '种分法'); for (let a = 1; a < N; a++) out.push(CN[a] + '和' + CN[N - a]); }
      return uniq(out);
    },
  };
  /* ================================================================ J8 收！ 按什么分的 (rule5, the reasoning test)
     Romeo made a mess: toy boxes, each already holding three block toys (shape x colour x size); the new toys go in. Nothing
     says the rule - the boxes show it: in every box one thing is the same (and only that thing tells the boxes apart).
     Drag a toy into a box (or tap the toy, then the box); judged when every new toy is in.
       L1 two boxes by colour (red / blue); the new toys' shape and size are in no box · L2 two boxes by shape, colours all
       mixed · L3 three boxes by colour or by shape · L4 by size: big / small (two boxes) or big / middle / small (three)
       L5 four boxes by colour and size (big red, small red, big blue, small blue)
     With two boxes there are three new toys, with three or four boxes two (a random sort is right 1 time in 8, 9 or 16 -
     the design's two toys in two boxes would be 1 in 4). Wrong: his toy ringed blue, that box's toys lift together and the
     same thing glows ("这箱都是红的", "它是蓝的"); the toy flies to its box, ringed gold ("蓝的放这里"). */
  const TCOL = { red: '#E8414B', blue: '#3D8BEA', yellow: '#FFC93C', green: '#4FBF63' };
  const TCN = { red: '红', blue: '蓝', yellow: '黄', green: '绿' };
  const TSN = { circle: '圆的', square: '方的', tri: '三角形', star: '星星' };
  const TZN = { big: '大的', mid: '中号的', small: '小的' };
  const TSZ = { big: 0.9, mid: 0.62, small: 0.36 };
  function toySvg(t, px) {
    const s = svg('svg', { viewBox: '0 0 100 100', width: px, height: px }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
    const k = TSZ[t.size], r = 46 * k, c = 50, col = TCOL[t.color], a = { fill: col, stroke: INK, 'stroke-width': 4 / Math.max(k, 0.6), 'stroke-linejoin': 'round' };
    const g = svg('g', { transform: 'translate(' + c + ' ' + (c + (1 - k) * 40) + ')' }, s);
    if (t.shape === 'circle') { svg('circle', Object.assign({ cx: 0, cy: 0, r }, a), g); svg('ellipse', { cx: -r * 0.32, cy: -r * 0.35, rx: r * 0.22, ry: r * 0.13, fill: 'rgba(255,255,255,.7)' }, g); }
    else if (t.shape === 'square') { svg('rect', Object.assign({ x: -r * 0.9, y: -r * 0.9, width: r * 1.8, height: r * 1.8, rx: r * 0.12 }, a), g); svg('rect', { x: -r * 0.66, y: -r * 0.7, width: r * 0.6, height: r * 0.16, rx: r * 0.08, fill: 'rgba(255,255,255,.6)' }, g); }
    else if (t.shape === 'tri') { svg('polygon', Object.assign({ points: [[0, -r], [r * 1.05, r * 0.82], [-r * 1.05, r * 0.82]].map(p => p.join(',')).join(' ') }, a), g); svg('path', { d: 'M' + (-r * 0.12) + ' ' + (-r * 0.5) + 'L' + (-r * 0.45) + ' ' + (r * 0.12), stroke: 'rgba(255,255,255,.7)', 'stroke-width': r * 0.14, 'stroke-linecap': 'round' }, g); }
    else svg('polygon', Object.assign({ points: W2X.star(0, 0, r * 1.05, 0).map(p => p.join(',')).join(' ') }, a), g);
    return s;
  }
  const J8RULE = { 1: ['color'], 2: ['shape'], 3: ['color', 'shape'], 4: ['size'], 5: ['cs'] };
  W5R.J8 = {
    kind0: 'rule5', verb: '收！', intro: '玩具放哪个箱？', praise: ['规律看出来啦！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, rule = bagPick(G, 'j8r' + d, J8RULE[d]);
      const SH = ['circle', 'square', 'tri'], CO = ['red', 'blue', 'yellow', 'green'];
      let boxes, B, sizes = d === 4 ? bagPick(G, 'j8z', [['big', 'small'], ['big', 'mid', 'small']]) : null;
      if (rule === 'color') boxes = (d === 1 ? ['red', 'blue'] : rng.shuffle(CO).slice(0, 3)).map(c => ({ color: c }));
      else if (rule === 'shape') boxes = rng.shuffle(SH).slice(0, d === 2 ? 2 : 3).map(s => ({ shape: s }));
      else if (rule === 'size') boxes = sizes.map(z => ({ size: z }));
      else boxes = [['red', 'big'], ['red', 'small'], ['blue', 'big'], ['blue', 'small']].map(([c, z]) => ({ color: c, size: z }));
      boxes = rng.shuffle(boxes); B = boxes.length;
      const T = B === 2 ? 3 : 2;
      /* the toys in a box: the rule's value(s), every other thing at least two ways in the box */
      const keys = ['shape', 'color', 'size'], pool = { shape: SH, color: CO, size: ['big', 'mid', 'small'] };
      if (d === 1) { pool.shape = ['circle', 'square']; pool.size = ['mid']; }
      const fill = bx => {
        for (let t = 0; t < 50; t++) {
          const toys = [0, 1, 2].map(() => { const x = {}; keys.forEach(k => { x[k] = bx[k] || rng.pick(pool[k]); }); return x; });
          if (keys.every(k => bx[k] || pool[k].length < 2 || new Set(toys.map(x => x[k])).size >= 2) && new Set(toys.map(x => keys.map(k => x[k]).join())).size === 3) return toys;
        }
        return [0, 1, 2].map((_, i) => { const x = {}; keys.forEach(k => { x[k] = bx[k] || pool[k][i % pool[k].length]; }); return x; });
      };
      const inBox = boxes.map(fill);
      /* the new toys: the rule's value of the box the bag deals, the rest free (L1: a shape and a size no box has) */
      const toys = [], answer = [];
      for (let i = 0; i < T; i++) {
        const b = W5U.at(G, B, 'j8b' + d), x = {};
        keys.forEach(k => { x[k] = boxes[b][k] || rng.pick(d === 1 ? (k === 'shape' ? ['tri', 'star'] : ['big']) : k === 'shape' ? SH : k === 'color' ? CO : ['big', 'mid', 'small']); });
        toys.push(x); answer.push(b);
      }
      const sig = x => keys.map(k => (x[k] || '-').slice(0, 2)).join('');
      return { k: [d, rule, boxes.map(sig).join(''), toys.map(sig).join('')], d, rule, boxes, inBox, toys, answer: answer.join(',') };
    },
    audit(q) { return [{ build: true, chance: Math.pow(1 / q.boxes.length, q.toys.length) }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo(st) {
      const L = K.L(), B = st.q.boxes.length, T = st.q.toys.length;
      if (L) return { L, bw: B === 4 ? 196 : 220, bh: 214, by: 118, bgap: B === 4 ? 16 : 30, per: B, ty: 420, ts: 116, tgap: 44 };
      return { L, bw: B === 4 ? 300 : B === 3 ? 214 : 300, bh: B === 4 ? 200 : 220, by: 214, bgap: B === 3 ? 10 : 18, per: B === 4 ? 2 : B, ty: B === 4 ? 680 : 520, ts: 120, tgap: 40 };
    },
    boxBox(st, i) { const g = this.geo(st), p = W5U.grid(st.q.boxes.length, Stage.W / 2, 0, g.bw, g.bh, g.bgap, 18, g.per)[i], rows = Math.ceil(st.q.boxes.length / g.per); return { x: p.x, y: p.y + g.by + (rows * g.bh + (rows - 1) * 18) / 2, w: g.bw, h: g.bh }; },
    toyBox(st, i) { const g = this.geo(st), p = W5U.grid(st.q.toys.length, Stage.W / 2, g.ty + g.ts / 2, g.ts, g.ts, g.tgap, 0)[i]; return { x: p.x, y: p.y, w: g.ts, h: g.ts }; },
    place(st) {
      if (!st.boxEls) return;
      st.boxEls.forEach((e, i) => { const b = this.boxBox(st, i); place(e, b.x, b.y, b.w, b.h); });
      st.toyEls.forEach((e, i) => { const b = this.toyBox(st, i); place(e, b.x, b.y, b.w, b.h); });
    },
    /* a toy box: the back wall, the three toys standing in it, the front panel; new toys sit on top */
    boxEl(st, i) {
      const q = st.q, e = thing(st, 5, 'item');
      e.innerHTML = '<svg viewBox="0 0 200 214" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;left:0;top:0;pointer-events:none"><rect x="8" y="58" width="184" height="150" rx="16" fill="#B97A3C" stroke="#2B2118" stroke-width="5"/><rect x="18" y="66" width="164" height="70" rx="10" fill="#8A5A2B"/></svg>';
      const row = el('div', '', e); Object.assign(row.style, { position: 'absolute', left: '6%', right: '6%', top: '30%', height: '36%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', pointerEvents: 'none' });
      e._toys = q.inBox[i].map(t => { const w = el('span', '', row); w.style.display = 'block'; w.appendChild(toySvg(t, 58)); return w; });
      const front = el('div', '', e); Object.assign(front.style, { position: 'absolute', left: '0', right: '0', top: '62%', bottom: '0', borderRadius: '0 0 16px 16px', background: 'linear-gradient(#D9964F,#B97A3C)', boxShadow: 'inset 0 0 0 5px #2B2118', pointerEvents: 'none' });
      e._top = el('div', '', e); Object.assign(e._top.style, { position: 'absolute', left: '4%', right: '4%', top: '0', height: '30%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', pointerEvents: 'none' });
      return e;
    },
    async present(st) {
      const q = st.q;
      st.put = q.toys.map(() => -1); st.sel = null;
      st.boxEls = q.boxes.map((_, i) => { const e = this.boxEl(st, i); K.reg(st, 'x' + i, e, {}); return e; });
      st.toyEls = q.toys.map((t, i) => { const e = W3X.card(st, null, 8); e.appendChild(toySvg(t, 104)); K.reg(st, 't' + i, e, { drag: true, drops: () => st.boxEls.map((b, k) => ({ id: 'x' + k, rect: () => box(b) })) }); return e; });
      this.place(st);
      st.boxEls.forEach((e, i) => K.pop(st, e, 80 * i)); st.toyEls.forEach((e, i) => K.pop(st, e, 300 + 80 * i));
      K.task(st, [[{ node: toySvg(q.toys[0], 50) }], [{ node: (() => { const s = el('span', ''); s.innerHTML = '<svg viewBox="0 0 100 100" width="50" height="50"><rect x="8" y="34" width="84" height="60" rx="10" fill="#B97A3C" stroke="#2B2118" stroke-width="6"/></svg>'; return s; })() }], ['q']]);
      K.say(st, '新玩具放哪里？');
    },
    select(st, i) { st.sel = st.sel === i ? null : i; st.toyEls.forEach((e, k) => { e.style.outline = k === st.sel ? '7px solid ' + GOLD : ''; e.style.outlineOffset = '3px'; }); },
    /* toy i goes into box b (it sits on top of the box, a little sparkle) */
    putIn(st, i, b) {
      if (st.put[i] >= 0) return false;
      st.put[i] = b; const e = st.toyEls[i]; e.style.transform = ''; e.style.visibility = 'hidden'; Input.unbind(e); delete st.map['t' + i];
      const m = el('span', '', st.boxEls[b]._top); m.style.display = 'block'; m.appendChild(toySvg(st.q.toys[i], 62)); st.mini = st.mini || {}; st.mini[i] = m;
      K.pop(st, m); Sfx.place(); if (st.sel != null) this.select(st, st.sel);
      if (st.put.every(x => x >= 0)) { st.picked = true; st.scope.timeout(() => Session.submit(st, st.put.join(',')), T(380)); }
      return 'ok';
    },
    onGesture(st, name, p) {
      if (st.picked || !st.boxEls) return false;
      const id = p.id || ''; let m;
      if (name === 'drop' && (m = /^t(\d)$/.exec(id))) { const b = /^x(\d)$/.exec(p.to || ''); if (!b) { st.toyEls[+m[1]].style.transform = ''; return 'free'; } return this.putIn(st, +m[1], +b[1]) || 'free'; }
      if (name !== 'tap') return false;
      if ((m = /^t(\d)$/.exec(id))) { this.select(st, +m[1]); return 'ok'; }
      if ((m = /^x(\d)$/.exec(id))) { if (st.sel == null) { K.wiggle(st, st.boxEls[+m[1]]); return 'free'; } return this.putIn(st, st.sel, +m[1]) || 'free'; }
      return false;
    },
    word(q, x) { return q.rule === 'color' ? TCN[x.color] + '的' : q.rule === 'shape' ? TSN[x.shape] : q.rule === 'size' ? TZN[x.size] : (x.size === 'big' ? '大' : '小') + TCN[x.color] + '的'; },
    firstBad(st, ans) { const a = String(ans).split(',').map(Number), w = String(st.q.answer).split(',').map(Number); return w.map((x, i) => (a[i] !== x ? i : -1)).filter(i => i >= 0); },
    async feedback(st, ans) {
      const q = st.q, i = this.firstBad(st, ans)[0], b = +String(ans).split(',')[i];
      if (st.mini && st.mini[i]) K.wiggle(st, st.mini[i]);
      W5U.say(st, '这箱都是' + this.word(q, q.boxes[b]));
      await st.scope.wait(T(600));
    },
    /* 1. his toy blue, the toys of that box lift together and glow ("这箱都是红的"), what his toy is ("它是蓝的");
       2. the toy flies to its box, the box's toys glow, the box ringed gold ("蓝的放这里") */
    async explain(st, ans) {
      const my = st, q = st.q, bad = this.firstBad(st, ans), a = String(ans).split(',').map(Number), w = String(q.answer).split(',').map(Number);
      const i = bad[0], his = st.boxEls[a[i]], rings = W5U.blue(st, st.mini[i]);
      his._toys.forEach((t, k) => { K.hop(st, t, 22); t.classList.add('glow'); });
      await fbDone(st); if (!Session.alive(my)) return;
      K.hop(st, st.mini[i], 16);
      await say(st, '它是' + this.word(q, q.toys[i])); if (!Session.alive(my)) return;
      await st.scope.wait(T(40)); if (!Session.alive(my)) return;
      W5U.hide(rings); his._toys.forEach(t => t.classList.remove('glow'));
      /* the toys go where they belong */
      for (const j of bad) {
        const m = st.mini[j], from = m.getBoundingClientRect(), dst = st.boxEls[w[j]]._top;
        dst.appendChild(m); const to = m.getBoundingClientRect();
        if (!fast()) m.animate([{ transform: 'translate(' + (from.left - to.left) / Stage.s + 'px,' + (from.top - to.top) / Stage.s + 'px)' }, { transform: 'none' }], { duration: 340, easing: EASE.glide });
      }
      Sfx.place();
      await st.scope.wait(T(340)); if (!Session.alive(my)) return;
      const right = st.boxEls[w[i]]; right._toys.forEach(t => { K.hop(st, t, 16); t.classList.add('glow'); });
      W5U.gold(st, uniq(bad.map(j => st.boxEls[w[j]])), 6);
      await W5U.sum(st, this.word(q, q.boxes[w[i]]) + '放这里');
      await st.scope.wait(T(60));
    },
    rightEls(st, ans) { const w = String(st.q.answer).split(',').map(Number); return uniq(this.firstBad(st, ans).map(j => st.boxEls[w[j]])); },
    async reveal(st) {
      const my = st, q = st.q, w = String(q.answer).split(',').map(Number); Sfx.reveal();
      Object.values(st.mini || {}).forEach(m => K.hop(st, m, 14));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, uniq(w.map(b => st.boxEls[b])), 6); this.cheerAll(st);
      st.summary = this.word(q, q.boxes[w[w.length - 1]]) + '放这里'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    next(st, strat) {
      if (st.picked || !st.toyEls) return null;
      const q = st.q, w = String(q.answer).split(',').map(Number), i = st.put.findIndex(x => x < 0); if (i < 0) return null;
      const b = strat === 'wrong' && i === 0 ? (w[0] + 1) % q.boxes.length : w[i], r = box(st.boxEls[b]);
      return { g: 'drop', p: { id: 't' + i, to: 'x' + b }, to: { x: r.x + r.w / 2, y: r.y + r.h / 2 } };
    },
    gestureHint(st) { const e = (st.toyEls || []).find(x => x.style.visibility !== 'hidden'); if (!e) return; const a = mid(e), b = { x: Stage.W / 2, y: this.geo(st).by + 100 }; Hand.busy++; Hand.drag(st.scope, a.x, a.y, a.x + (b.x - a.x) * 0.5, a.y + (b.y - a.y) * 0.5, 600).then(() => { Hand.done(); Hand.hide(st.scope); }); },
    workEls(st) { return (st.toyEls || []).filter(e => e.style.visibility !== 'hidden'); },
    snap(st) { return { put: (st.put || []).join(',') }; },
    lines() {
      const out = [this.intro, '新玩具放哪里？'].concat(this.praise), words = [];
      Object.values(TCN).forEach(c => words.push(c + '的')); ['红', '蓝'].forEach(c => words.push('大' + c + '的', '小' + c + '的'));
      ['circle', 'square', 'tri'].forEach(s => words.push(TSN[s])); Object.values(TZN).forEach(z => words.push(z));
      words.forEach(x => out.push('这箱都是' + x, '它是' + x, x + '放这里'));
      return uniq(out);
    },
  };
})();
/* ================================================================ ④ 汪汪队·积木站 (paw5, from level 2): A5 画路线 · A6 看箭头走 ·
   A7 对号入座 (the symbols + − = brought in, a number sentence read back into the picture) · A8 排座位 (reasoning).
   docs/W5-DESIGN.md §5 ④. One function, no top-level names; each rule is W5R.<id> (registered in games.js). Package B. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const thing = (st, z, cls) => { const d = el('div', cls || 'item', Stage.el); d.style.position = 'absolute'; d.style.zIndex = z || 5; place(d, 0, 0, 10, 10); st.els.push(d); return d; };
  const mid = e => { const b = box(e); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
  const ff = st => st.explaining && st.ff;
  /* a line inside an explanation (a tap cuts it, and after a tap it is not said) */
  const say = (st, t) => (ff(st) ? Promise.resolve('ff') : W5U.note(st, t));
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine) */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));
  const thumb = (id, px) => { const s = el('span', ''); Object.assign(s.style, { display: 'block', width: px + 'px', height: px + 'px', borderRadius: '50%', overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none', flex: '0 0 auto' }); const i = img('assets/thumbs/' + id + '.png', '', s); Object.assign(i.style, { width: '100%', height: '100%', objectFit: 'cover' }); return s; };
  const PUP = { chase: '阿奇', skye: '天天', marshall: '毛毛', rubble: '小砾', rocky: '灰灰', zuma: '路马' };

  /* ================================================================ A6 走！ 看箭头走 (arrows5)
     A town mat seen from above (5 x 5 cells of 96), six landmarks; 天天 (Skye) is the piece; an arrow card on the task card.
     Tap the landmark where she ends.
       L1 one direction, 1-3 arrows (the session's first question also says "往右走两格！") · L2 two directions, 3-4 arrows
       L3 three legs (→ ↑ →), 4-6 arrows, she starts on a landmark · L4 arrows with numbers (→3 ↑2)
       L5 the other way round: start and end (a flag) given, five route cards ("哪张路线卡对？"): one right; the others turn one
          leg round, go one too far or one short, or swap the two numbers
     Right: the landmark at the end (its type from a bag: the right one's place among the six is balanced). Wrong: his
     landmark ringed blue ("多走了一格" / "少走了一格" / "方向不对哦"), 天天 walks it arrow by arrow (each arrow lights,
     a tick per cell, "往上" at a turn), the right landmark gold ("到了游泳池"). L5: his card blue, she walks the right
     card to the flag, "这张能到旗子". */
  const LM = ['school', 'park', 'bakery', 'fire', 'pool', 'hospital'];
  const LMN = { school: '学校', park: '公园', bakery: '面包店', fire: '消防站', pool: '游泳池', hospital: '医院' };
  const LMSVG = {
    school: '<rect x="14" y="40" width="72" height="50" rx="4" fill="#FFD27A" stroke="#2B2118" stroke-width="4"/><path d="M8 42L50 14L92 42Z" fill="#E8414B" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/><rect x="40" y="62" width="20" height="28" fill="#8A5A2B" stroke="#2B2118" stroke-width="3"/><circle cx="50" cy="32" r="6" fill="#fff" stroke="#2B2118" stroke-width="3"/><rect x="22" y="52" width="12" height="12" fill="#BFE3FF" stroke="#2B2118" stroke-width="2.5"/><rect x="66" y="52" width="12" height="12" fill="#BFE3FF" stroke="#2B2118" stroke-width="2.5"/>',
    park: '<rect x="8" y="70" width="84" height="20" rx="8" fill="#7ED36A" stroke="#2B2118" stroke-width="4"/><rect x="44" y="44" width="10" height="34" fill="#9A6433" stroke="#2B2118" stroke-width="3"/><circle cx="49" cy="34" r="24" fill="#4FBF63" stroke="#2B2118" stroke-width="4"/><circle cx="20" cy="64" r="9" fill="#FF7FA8" stroke="#2B2118" stroke-width="3"/><circle cx="80" cy="62" r="9" fill="#FFC93C" stroke="#2B2118" stroke-width="3"/>',
    bakery: '<rect x="14" y="40" width="72" height="50" rx="4" fill="#FFF1D6" stroke="#2B2118" stroke-width="4"/><path d="M10 40L18 22H82L90 40Z" fill="#FF9FB8" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/><path d="M26 40V48M42 40V48M58 40V48M74 40V48" stroke="#2B2118" stroke-width="3"/><ellipse cx="50" cy="70" rx="22" ry="12" fill="#E2A15B" stroke="#2B2118" stroke-width="4"/><path d="M40 64L44 76M50 62L52 78M60 64L58 76" stroke="#9A6433" stroke-width="3"/>',
    fire: '<rect x="12" y="34" width="76" height="56" rx="4" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><path d="M8 36L50 12L92 36Z" fill="#B8282F" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/><rect x="26" y="54" width="48" height="36" fill="#FFF8EC" stroke="#2B2118" stroke-width="4"/><path d="M26 66H74M26 78H74" stroke="#2B2118" stroke-width="3"/><circle cx="50" cy="28" r="6" fill="#FFC93C" stroke="#2B2118" stroke-width="3"/>',
    pool: '<rect x="8" y="22" width="84" height="64" rx="14" fill="#fff" stroke="#2B2118" stroke-width="4"/><rect x="16" y="30" width="68" height="48" rx="9" fill="#4FB3FF"/><path d="M20 46Q28 40 36 46T52 46T68 46T84 46M20 60Q28 54 36 60T52 60T68 60T84 60" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M76 14V40M88 14V40M76 22H88M76 32H88" stroke="#2B2118" stroke-width="3.5"/>',
    hospital: '<rect x="14" y="26" width="72" height="64" rx="4" fill="#fff" stroke="#2B2118" stroke-width="4"/><rect x="40" y="36" width="20" height="40" fill="#E8414B"/><rect x="30" y="46" width="40" height="20" fill="#E8414B"/><rect x="42" y="78" width="16" height="12" fill="#BFE3FF" stroke="#2B2118" stroke-width="2.5"/>',
  };
  const DIRS = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
  const DIRN = { R: '右', L: '左', U: '上', D: '下' };
  const ROT = { R: 0, D: 90, L: 180, U: 270 };
  const OPP = { R: 'L', L: 'R', U: 'D', D: 'U' };
  const PERP = { R: ['U', 'D'], L: ['U', 'D'], U: ['R', 'L'], D: ['R', 'L'] };
  /* the cells a route passes (start first); segs = [[dir, n], ...] */
  const walk = (s, segs) => { const out = [s.slice()]; let c = s.slice(); segs.forEach(([d, n]) => { for (let i = 0; i < n; i++) { c = [c[0] + DIRS[d][0], c[1] + DIRS[d][1]]; out.push(c.slice()); } }); return out; };
  const inG = c => c[0] >= 0 && c[1] >= 0 && c[0] < 5 && c[1] < 5;
  const eqC = (a, b) => a[0] === b[0] && a[1] === b[1];
  /* an arrow (pointing right before turning), with a numeral under it (L4-L5) */
  function arrowSvg(dir, n, px, col) {
    const s = svg('svg', { viewBox: n ? '0 0 80 48' : '0 0 48 48', width: n ? px * 80 / 48 : px, height: px }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
    const g = svg('g', { transform: 'rotate(' + ROT[dir] + ' 24 24)' }, s);
    svg('path', { d: 'M6 24H36M26 12L38 24L26 36', fill: 'none', stroke: col || INK, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    if (n) { const t = svg('text', { x: 63, y: 39, 'text-anchor': 'middle', 'font-size': 40, 'font-weight': 900, fill: '#E8414B', stroke: INK, 'stroke-width': 1.5, 'font-family': 'system-ui,sans-serif' }, s); t.textContent = n; }
    s._g = g; return s;
  }
  /* a route written as arrows: one per cell (L1-L3) or one per leg with its number (L4-L5) */
  function routeNode(segs, nums, px) {
    const d = el('span', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: nums ? '2px' : '0px', pointerEvents: 'none' }); d._arrows = [];
    segs.forEach(([dir, n]) => { if (nums) { const a = arrowSvg(dir, n, px); d.appendChild(a); d._arrows.push({ a, n }); } else for (let i = 0; i < n; i++) { const a = arrowSvg(dir, 0, px); d.appendChild(a); d._arrows.push({ a, n: 1 }); } });
    return d;
  }
  const FLAG = '<svg viewBox="0 0 60 60" width="100%" height="100%" style="pointer-events:none;overflow:visible"><path d="M16 56V6" stroke="#2B2118" stroke-width="5" stroke-linecap="round"/><path d="M18 8H50L42 20L50 32H18Z" fill="#E8414B" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/></svg>';

  W5R.A6 = {
    kind0: 'arrows5', verb: '走！', intro: '跟着箭头走！', praise: ['一步不差！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      for (let t = 0; t < 400; t++) {
        let segs;
        if (d === 1) { const dir = bagPick(G, 'a6d', ['R', 'L', 'U', 'D']); segs = [[dir, rng.int(1, 3)]]; }
        else if (d === 2) { const a = rng.pick(['R', 'L', 'U', 'D']), b = rng.pick(PERP[a]), tot = rng.int(3, 4), n1 = rng.int(1, tot - 1); segs = [[a, n1], [b, tot - n1]]; }
        else if (d === 3) { const a = rng.pick(['R', 'L', 'U', 'D']), b = rng.pick(PERP[a]), tot = rng.int(4, 6), n1 = rng.int(1, tot - 2), n2 = rng.int(1, tot - n1 - 1); segs = [[a, n1], [b, n2], [a, tot - n1 - n2]]; }
        else { const a = rng.pick(['R', 'L', 'U', 'D']), b = rng.pick(PERP[a]), three = d === 4 && rng.chance(0.4); segs = three ? [[a, rng.int(1, 2)], [b, rng.int(1, 3)], [a, rng.int(1, 2)]] : [[a, rng.int(1, 4)], [b, rng.int(1, 4)]]; }
        const start = [rng.int(0, 4), rng.int(0, 4)], path = walk(start, segs);
        if (!path.every(inG) || path.slice(1).some(c => eqC(c, start))) continue;
        const end = path[path.length - 1];
        if (d === 5) {
          /* five cards: the right one + four that end elsewhere */
          const key = s => s.map(x => x.join('')).join(' '), cand = [];
          const add = (s, why) => { if (s.some(x => x[1] < 1)) return; const p = walk(start, s); if (eqC(p[p.length - 1], end) || !p.every(inG) || cand.some(c => key(c.s) === key(s)) || key(s) === key(segs)) return; cand.push({ s, why }); };
          segs.forEach((x, i) => add(segs.map((y, j) => (j === i ? [OPP[y[0]], y[1]] : y)), 'dir'));
          segs.forEach((x, i) => add(segs.map((y, j) => (j === i ? [y[0], y[1] + 1] : y)), 'more'));
          segs.forEach((x, i) => add(segs.map((y, j) => (j === i ? [y[0], y[1] - 1] : y)), 'less'));
          if (segs.length === 2 && segs[0][1] !== segs[1][1]) add([[segs[0][0], segs[1][1]], [segs[1][0], segs[0][1]]], 'swap');
          if (cand.length < 4) continue;
          const pick = rng.shuffle(cand).slice(0, 4), right = { s: segs, why: 'ok' }, cards = W5U.deal(G, right, pick, 'a6c');
          return { k: [d, start.join(''), key(segs), pick.map(c => key(c.s)).join('|')], d, start, segs, end, cards, nums: true, answer: cards.indexOf(right) };
        }
        /* the six landmarks: the right one (type from a bag) at the end; near misses first (one too far, one short, the
           last leg the other way), then anywhere off the route */
        const ans = W5U.at(G, 6, 'a6l' + d), last = segs[segs.length - 1][0], cells = [end];
        const near = [[end[0] + DIRS[last][0], end[1] + DIRS[last][1]], path[path.length - 2], walk(path[path.length - 1 - segs[segs.length - 1][1]], [[OPP[last], segs[segs.length - 1][1]]]).pop()];
        if (d === 3) cells.push(start.slice());
        near.forEach(c => { if (cells.length < 6 && inG(c) && !eqC(c, start) && !cells.some(x => eqC(x, c))) cells.push(c); });
        const free = rng.shuffle(Array.from({ length: 25 }, (_, i) => [i % 5, Math.floor(i / 5)]).filter(c => !path.some(p => eqC(p, c)) && !cells.some(x => eqC(x, c))));
        while (cells.length < 6 && free.length) cells.push(free.pop());
        if (cells.length < 6) continue;
        const others = rng.shuffle(cells.slice(1)), at = [];
        LM.forEach((_, i) => { at[i] = i === ans ? end : others.pop(); });
        const startLm = d === 3 ? at.findIndex(c => eqC(c, start)) : -1;
        return { k: [d, start.join(''), segs.map(x => x.join('')).join(' '), at.map(c => c.join('')).join('')], d, start, segs, end, at, startLm, nums: d >= 4, answer: ans };
      }
      return null;
    },
    audit(q) { return q.cards ? [{ n: 5, at: q.answer, right: q.cards.filter(c => c.why === 'ok').length }] : [{ n: 6, at: q.answer, right: q.at.filter(c => eqC(c, q.end)).length }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo(st) {
      const L = K.L(), l5 = !!st.q.cards;
      if (L) return l5 ? { L, u: 96, mx: 150, my: 118, cx: 690, cy: 108, cw: 184, ch: 92, cg: 12 } : { L, u: 96, mx: 272, my: 118 };
      return l5 ? { L, u: 96, mx: 112, my: 214, cy: 724, cw: 120, ch: 120 } : { L, u: 96, mx: 112, my: 230 };
    },
    cellXY(st, c) { const g = this.geo(st); return { x: g.mx + c[0] * g.u, y: g.my + c[1] * g.u }; },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.mat) return;
      place(st.mat, g.mx - 14, g.my - 14, 5 * g.u + 28, 5 * g.u + 28);
      (st.lms || []).forEach((e, i) => { const p = this.cellXY(st, q.at[i]); place(e, p.x, p.y, g.u, g.u); });
      if (st.flag) { const p = this.cellXY(st, q.end); place(st.flag, p.x + 14, p.y + 6, 70, 70); }
      const c = st.cur || q.start, p = this.cellXY(st, c), sm = q.startLm >= 0 && eqC(c, q.start); place(st.tok, p.x + (sm ? 46 : 18), p.y + (sm ? 46 : 18), sm ? 52 : 60, sm ? 52 : 60);
      if (st.cards) st.cards.forEach((e, i) => { if (g.L) place(e, g.cx, g.cy + i * (g.ch + g.cg), g.cw, g.ch); else { const x = Math.round(352 - (5 * g.cw + 4 * 12) / 2 + i * (g.cw + 12)); place(e, x, g.cy, g.cw, g.ch); } });
    },
    async present(st) {
      const q = st.q, G = st.G;
      st.mat = thing(st, 3, 'item');
      let m = '<svg viewBox="0 0 508 508" width="100%" height="100%" style="pointer-events:none"><rect x="2" y="2" width="504" height="504" rx="22" fill="#CFEFB0" stroke="#2B2118" stroke-width="4"/>';
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) m += '<rect x="' + (18 + i * 96) + '" y="' + (18 + j * 96) + '" width="88" height="88" rx="12" fill="#B6E39A"/>';
      for (let i = 0; i < 6; i++) m += '<path d="M' + (14 + i * 96) + ' 14V494M14 ' + (14 + i * 96) + 'H494" stroke="#E9E4D8" stroke-width="8" stroke-linecap="round"/>';
      st.mat.innerHTML = m + '</svg>';
      if (!q.cards) st.lms = q.at.map((c, i) => { const e = thing(st, 6, 'item'); e.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%" style="pointer-events:none">' + LMSVG[LM[i]] + '</svg>'; K.reg(st, 'l' + i, e, {}); return e; });
      else { st.flag = thing(st, 6, 'item'); st.flag.innerHTML = FLAG; }
      st.tok = thing(st, 7, 'item'); st.tok.appendChild(thumb('skye', 60)); st.cur = q.start.slice();
      if (q.cards) {
        W5U.cards(st, q.cards.map(c => routeNode(c.s, true, K.L() ? 40 : 30)), q.cards.map((_, i) => i));
        st.cards.forEach((c, i) => K.pop(st, c, 60 * i));
      }
      this.place(st);
      K.pop(st, st.mat); (st.lms || []).forEach((e, i) => K.pop(st, e, 40 * i));
      if (q.cards) {
        K.task(st, [[{ node: thumb('skye', 46) }], [{ node: (() => { const s = el('span', ''); s.style.display = 'block'; s.style.width = '50px'; s.style.height = '50px'; s.innerHTML = FLAG; return s; })() }], ['q']]);
        K.say(st, '哪张路线卡对？');
        return;
      }
      st.route = routeNode(q.segs, q.nums, 40);
      K.task(st, [[q.startLm >= 0 ? W2X.icon(LMSVG[LM[q.startLm]]) : { node: thumb('skye', 46) }, { node: st.route }]]);
      if (q.d === 1 && !G.a6said) { G.a6said = true; const [dir, n] = q.segs[0]; W3X.say2(st, '往' + DIRN[dir] + '走' + CNQ(n) + '格！', '天天走到哪里？'); }
      else K.say(st, '天天走到哪里？');
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const q = st.q;
      if (q.cards) return W5U.tapCard(st, name, p);
      const m = /^l(\d)$/.exec(p.id || ''); if (!m) return false;
      st.picked = true; K.pop(st, st.lms[+m[1]]); Session.submit(st, +m[1]);
      return 'ok';
    },
    /* why his landmark is not it: past the end on the last leg / on the way / elsewhere */
    whyLine(st, i) {
      const q = st.q, c = q.at[i], path = walk(q.start, q.segs), last = q.segs[q.segs.length - 1][0], end = q.end;
      for (let k = 1; k <= 5; k++) if (eqC(c, [end[0] + DIRS[last][0] * k, end[1] + DIRS[last][1] * k])) return '多走了' + CNQ(k) + '格';
      const j = path.findIndex(p => eqC(p, c)); if (j >= 0 && j < path.length - 1) return '少走了' + CNQ(path.length - 1 - j) + '格';
      return '方向不对哦';
    },
    cardLine(st, i) { const w = st.q.cards[i].why; return w === 'more' ? '多走了一格' : w === 'less' ? '少走了一格' : w === 'swap' ? '顺序不对哦' : '方向不对哦'; },
    async feedback(st, ans) {
      const q = st.q;
      if (q.cards) { K.wiggle(st, st.cards[ans]); W5U.say(st, this.cardLine(st, ans)); }
      else { K.wiggle(st, st.lms[ans]); W5U.say(st, this.whyLine(st, ans)); }
      await st.scope.wait(T(600));
    },
    /* 天天 walks the route cell by cell (the arrow of each cell lights; a tick a cell; "往上" at a turn) */
    async walkIt(st, segs, arrows) {
      const my = st, q = st.q, per = Math.max(110, Math.min(200, 1300 / walk(q.start, segs).length));
      st.cur = q.start.slice(); this.place(st);
      let k = 0, ai = 0;
      for (let s = 0; s < segs.length; s++) {
        const [dir, n] = segs[s];
        if (s > 0) Voice.say('往' + DIRN[dir], { tag: 'explain' });
        for (let i = 0; i < n; i++) {
          if (!Session.alive(my)) return;
          const a = arrows && arrows[ai]; if (a) { a.a._g.querySelector('path').setAttribute('stroke', '#E0A100'); }
          if (arrows && (!q.nums || i === n - 1)) ai++;
          const from = this.cellXY(st, st.cur); st.cur = [st.cur[0] + DIRS[dir][0], st.cur[1] + DIRS[dir][1]]; const to = this.cellXY(st, st.cur);
          place(st.tok, to.x + 18, to.y + 18, 60, 60);
          if (!ff(st)) st.tok.animate([{ transform: 'translate(' + (from.x - to.x) + 'px,' + (from.y - to.y) + 'px)' }, { transform: 'none' }], { duration: T(per * 0.8), easing: EASE.glide });
          k++; await W5U.count(st, per, k);
          await st.scope.wait(T(Math.max(0, per - 190)));
        }
      }
    },
    /* 1. his landmark (card) blue; 2. she walks the route; 3. the right landmark (card) gold: "到了游泳池" / "这张能到旗子" */
    async explain(st, ans) {
      const my = st, q = st.q, rings = W5U.blue(st, q.cards ? st.cards[ans] : st.lms[ans]);
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      await W5U.beat(st); if (!Session.alive(my)) return;
      await this.walkIt(st, q.segs, q.cards ? null : st.route && st.route._arrows); if (!Session.alive(my)) return;
      if (q.cards) { W5U.gold(st, st.cards[q.answer]); await W5U.sum(st, '这张能到旗子'); }
      else { W5U.gold(st, st.lms[q.answer]); K.hop(st, st.tok, 14); await W5U.sum(st, '到了' + LMN[LM[q.answer]]); }
      await st.scope.wait(T(150));
    },
    rightEls(st) { return [st.q.cards ? st.cards[st.q.answer] : st.lms[st.q.answer]]; },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      const e = q.cards ? st.cards[q.answer] : st.lms[q.answer];
      st.cur = q.end.slice(); this.place(st); K.hop(st, st.tok, 16);
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, e); this.cheerAll(st);
      st.summary = q.cards ? '这张能到旗子' : '到了' + LMN[LM[q.answer]]; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    next(st, strat) {
      if (st.picked) return null; const q = st.q;
      if (q.cards) { if (!st.cards) return null; const i = strat === 'wrong' ? (q.answer + 1 + st.gen % 4) % 5 : q.answer; return { g: 'tap', p: { id: 'card' + i } }; }
      if (!st.lms) return null;
      const i = strat === 'wrong' ? (q.answer + 1 + st.gen % 5) % 6 : q.answer; return { g: 'tap', p: { id: 'l' + i } };
    },
    workEls(st) { return st.cards || st.lms || []; },
    snap(st) { return { cur: (st.cur || []).join(',') }; },
    lines() {
      const out = [this.intro, '天天走到哪里？', '哪张路线卡对？', '这张能到旗子', '方向不对哦', '顺序不对哦'].concat(this.praise);
      Object.values(DIRN).forEach(d => { out.push('往' + d); for (let n = 1; n <= 3; n++) out.push('往' + d + '走' + CNQ(n) + '格！'); });
      for (let n = 1; n <= 8; n++) out.push('多走了' + CNQ(n) + '格', '少走了' + CNQ(n) + '格');
      LM.forEach(l => out.push('到了' + LMN[l]));
      return uniq(out);
    },
  };
  /* ================================================================ A8 坐！ 排座位 (seat5, the reasoning test)
     The PAW bus seen from the side, a row of 3-5 seats ("left / right" = the child's own screen left / right, as the cards
     draw it); the pups' heads are the pieces; clue cards come one by one, each said aloud (pictures: heads, arrows,
     brackets, a little seat row, a little house for "not going"). Drag a pup onto a seat (or tap the pup, then the seat);
     tap a seated pup and it comes back; all seats full, then "出发".
       L1 3 seats, 3 pups, 2 clues (the middle + left of) · L2 3 seats, 4 pups (one stays home), 2-3 clues with next to /
       not next to · L3 4 seats, 4 pups, 3 clues with "最左边" · L4 4 seats, 3 clues that chain (X left of Y, Y left of Z)
       L5 5 seats, 5 pups, 4 clues, one of them a "not" ("小砾不坐两头" / "X 不挨着 Y")
     Every set of clues has exactly one seating. A random seating is right 1 time in 6 (L1, only reached by stepping down) to
     1 in 120. Wrong: the first clue his seating breaks flashes blue, its pups wiggle ("天天不在毛毛左边"); the clues light up
     one by one and the pups jump into their seats ("天天在毛毛左边"); "全都对上了". */
  const DOGS = ['chase', 'skye', 'marshall', 'rubble', 'rocky', 'zuma'];
  const A8L = [null, { S: 3, D: 3, n: [2, 2], need: ['mid', 'left'], pool: ['mid', 'left'] }, { S: 3, D: 4, n: [2, 3], need: ['out', 'nx'], pool: ['out', 'next', 'notnext', 'left', 'mid', 'first'] },
    { S: 4, D: 4, n: [3, 3], need: ['first'], pool: ['first', 'left', 'next', 'notnext'] }, { S: 4, D: 4, n: [3, 3], need: ['chain'], pool: ['left', 'first', 'next'] },
    { S: 5, D: 5, n: [4, 4], need: ['neg'], pool: ['notends', 'notnext', 'left', 'next', 'first', 'mid'] }];
  const holds = (c, ar) => {
    const S = ar.length, p = x => ar.indexOf(x), a = p(c.x), b = c.y ? p(c.y) : -1;
    if (c.t === 'out') return a < 0;
    if (a < 0 || (c.y && b < 0)) return false;
    if (c.t === 'mid') return S % 2 === 1 && a === (S - 1) / 2;
    if (c.t === 'left') return a < b;
    if (c.t === 'next') return Math.abs(a - b) === 1;
    if (c.t === 'notnext') return Math.abs(a - b) !== 1;
    if (c.t === 'first') return a === 0;
    if (c.t === 'notends') return a > 0 && a < S - 1;
    return false;
  };
  const clueLine = c => { const X = PUP[c.x], Y = c.y ? PUP[c.y] : ''; return { mid: X + '在中间', left: X + '在' + Y + '左边', next: X + '挨着' + Y, notnext: X + '不挨着' + Y, first: X + '坐最左边', notends: X + '不坐两头', out: X + '不去' }[c.t]; };
  const breakLine = c => { const X = PUP[c.x], Y = c.y ? PUP[c.y] : ''; return { mid: X + '不在中间', left: X + '不在' + Y + '左边', next: X + '没挨着' + Y, notnext: X + '不挨着' + Y, first: X + '不在最左边', notends: X + '不坐两头', out: X + '不去' }[c.t]; };
  /* every seating of S seats from these pups */
  const seatings = (S, dogs) => { const out = [], rec = (cur, left) => { if (cur.length === S) { out.push(cur.slice()); return; } left.forEach((d, i) => rec(cur.concat(d), left.filter((_, j) => j !== i))); }; rec([], dogs); return out; };
  const HOUSE = '<path d="M14 50L50 18L86 50V88H14Z" fill="#FFD27A" stroke="#2B2118" stroke-width="6" stroke-linejoin="round"/><rect x="40" y="58" width="20" height="30" fill="#8A5A2B" stroke="#2B2118" stroke-width="4"/>';
  W5R.A8 = {
    kind0: 'seat5', verb: '坐！', intro: '帮狗狗排座位！', praise: ['排得全都对！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, L = A8L[d];
      for (let t = 0; t < 300; t++) {
        const dogs = rng.shuffle(DOGS).slice(0, L.D), target = rng.shuffle(dogs).slice(0, L.S), all = seatings(L.S, dogs);
        const cand = [];
        dogs.forEach(x => {
          if (!target.includes(x)) { cand.push({ t: 'out', x }); return; }
          ['mid', 'first', 'notends'].forEach(k => cand.push({ t: k, x }));
          dogs.forEach(y => { if (y !== x && target.includes(y)) ['left', 'next', 'notnext'].forEach(k => { if (k === 'left' || x < y) cand.push({ t: k, x, y }); }); });
        });
        const ok = cand.filter(c => L.pool.includes(c.t) && holds(c, target)), pick = [];
        const req = L.need.map(k => { const f = ok.filter(c => (k === 'nx' ? ['next', 'notnext'].includes(c.t) : k === 'neg' ? ['notends', 'notnext'].includes(c.t) : k === 'chain' ? c.t === 'left' : c.t === k)); return f.length ? rng.pick(f) : null; });
        if (req.some(r => !r)) continue;
        req.forEach(r => pick.push(r));
        if (L.need[0] === 'chain') { const a = pick[0], nxt = ok.filter(c => c.t === 'left' && c.x === a.y); if (!nxt.length) continue; pick.push(rng.pick(nxt)); }
        let sols = all.filter(ar => pick.every(c => holds(c, ar)));
        /* then the clue that leaves the fewest seatings, until one is left */
        while (sols.length > 1 && pick.length < L.n[1]) {
          let best = null, bn = sols.length;
          rng.shuffle(ok).forEach(c => { if (pick.includes(c)) return; const n = sols.filter(ar => holds(c, ar)).length; if (n < bn) { bn = n; best = c; } });
          if (!best) break; pick.push(best); sols = sols.filter(ar => holds(best, ar));
        }
        if (sols.length !== 1 || pick.length < L.n[0] || pick.length > L.n[1]) continue;
        const clues = d === 4 ? pick : rng.shuffle(pick);
        return { k: [d, target.join(','), clues.map(c => c.t + c.x + (c.y || '')).join(' ')], d, S: L.S, dogs: rng.shuffle(dogs), target, clues, answer: target.join(',') };
      }
      return null;
    },
    audit(q) { return [{ build: true, chance: 1 / seatings(q.S, q.dogs).length }]; },
    decor(G) { K.L() ? W3X.decor2(G, this.chars) : W2X.decorDone(G, this.chars); },
    geo(st) {
      const L = K.L(), q = st.q, n = q.clues.length;
      if (L) return { L, cw: n > 3 ? 214 : 240, ch: 92, cy: 104, cper: 4, cgap: 12, sw: 106, sy: 248, sg: 14, by: 222, bh: 176, dy: 452, ds: 104, dg: 22, done: [902, 262, 104] };
      return { L, cw: 330, ch: 92, cy: 210, cper: 2, cgap: 12, sw: 106, sy: 470, sg: 8, by: 444, bh: 176, dy: 672, ds: 108, dg: 18, done: [566, 884, 110] };
    },
    seatBox(st, i) { const g = this.geo(st), S = st.q.S, w = S * g.sw + (S - 1) * g.sg, x0 = (g.L ? 492 : 352) - w / 2; return { x: Math.round(x0 + i * (g.sw + g.sg)), y: g.sy, w: g.sw, h: g.sw }; },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.bus) return;
      W5U.lay(st.clueEls, Stage.W / 2, g.cy + (Math.ceil(q.clues.length / g.cper) * (g.ch + g.cgap) - g.cgap) / 2, g.cw, g.ch, g.cgap, g.cgap, g.cper);
      const a = this.seatBox(st, 0), b = this.seatBox(st, q.S - 1);
      place(st.bus, a.x - 40, g.by, b.x + b.w - a.x + (g.L ? 150 : 100), g.bh);
      st.seatEls.forEach((e, i) => { const s = this.seatBox(st, i); place(e, s.x, s.y, s.w, s.h); });
      const waiting = q.dogs.filter(x => !st.seat.includes(x)), pos = W5U.grid(q.dogs.length, Stage.W / 2, g.dy + g.ds / 2, g.ds, g.ds, g.dg, 0);
      q.dogs.forEach((x, k) => { const e = st.dogEls[k], si = st.seat.indexOf(x); if (si >= 0) { const s = this.seatBox(st, si); place(e, s.x + 4, s.y + 4, s.w - 8, s.h - 8); } else { const p = pos[k]; place(e, p.x, p.y, g.ds, g.ds); } });
      if (st.doneBtn) { st.doneBtn._done.x = g.done[0]; st.doneBtn._done.y = g.done[1]; K.placeDone(st.doneBtn); }
    },
    /* a clue card's picture */
    clueNode(st, c) {
      const S = st.q.S, d = el('span', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', pointerEvents: 'none', width: '100%', height: '100%' });
      const head = x => thumb(x, 58), sym = h => { const s = el('span', '', d); s.innerHTML = h; s.style.display = 'flex'; return s; };
      const row = (who, at, ends) => { const s = svg('svg', { viewBox: '0 0 ' + (S * 34 + 6) + ' 40', width: S * 30 + 6, height: 36 }); s.style.pointerEvents = 'none'; for (let i = 0; i < S; i++) svg('rect', { x: 4 + i * 34, y: 6, width: 28, height: 28, rx: 6, fill: ends && (i === 0 || i === S - 1) ? '#5B4A3A' : i === at ? '#FFC93C' : '#fff', stroke: INK, 'stroke-width': 3 }, s); return s; };
      if (c.t === 'out') { d.appendChild(head(c.x)); sym('<svg viewBox="0 0 100 100" width="52" height="52">' + HOUSE + '</svg>'); }
      else if (c.t === 'left') {
        /* X is left of Y: from Y a long arrow points left, to X (not "<" - that is the less-than sign of 星空) */
        d.appendChild(head(c.x)); d.style.gap = '2px';
        sym('<svg viewBox="0 0 76 44" width="74" height="44"><path d="M70 22H16" stroke="#2B2118" stroke-width="13" stroke-linecap="round"/><path d="M70 22H16" stroke="#4FB3FF" stroke-width="7" stroke-linecap="round"/><path d="M28 6L8 22L28 38Z" fill="#4FB3FF" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/></svg>');
        d.appendChild(head(c.y));
      }
      else if (c.t === 'next') { const b = el('span', '', d); Object.assign(b.style, { display: 'flex', gap: '0px', padding: '3px 6px', borderRadius: '30px', boxShadow: '0 0 0 4px ' + GOLD }); b.appendChild(head(c.x)); b.appendChild(head(c.y)); }
      else if (c.t === 'notnext') { d.appendChild(head(c.x)); sym('<svg viewBox="0 0 24 56" width="20" height="54"><rect x="4" y="2" width="16" height="52" rx="4" fill="#B97A3C" stroke="#2B2118" stroke-width="4"/></svg>'); d.appendChild(head(c.y)); }
      else { d.appendChild(head(c.x)); d.appendChild(row(c.x, c.t === 'mid' ? (S - 1) / 2 : c.t === 'first' ? 0 : -1, c.t === 'notends')); }
      return d;
    },
    async present(st) {
      const q = st.q;
      st.seat = Array(q.S).fill(null); st.sel = null;
      st.bus = thing(st, 3, 'item');
      st.bus.innerHTML = '<svg viewBox="0 0 400 176" width="100%" height="100%" preserveAspectRatio="none" style="pointer-events:none"><rect x="6" y="8" width="380" height="140" rx="30" fill="#E8554A" stroke="#2B2118" stroke-width="6"/><rect x="6" y="104" width="380" height="20" fill="#2E6FD8"/><rect x="368" y="30" width="16" height="70" rx="6" fill="#BFE3FF" stroke="#2B2118" stroke-width="4"/></svg>' +
        '<svg viewBox="0 0 400 176" width="100%" height="100%" style="pointer-events:none;position:absolute;left:0;top:0"><circle cx="80" cy="148" r="24" fill="#2B2118"/><circle cx="80" cy="148" r="10" fill="#C9D3E0"/><circle cx="318" cy="148" r="24" fill="#2B2118"/><circle cx="318" cy="148" r="10" fill="#C9D3E0"/></svg>';
      st.bus.style.position = 'absolute';
      st.seatEls = Array.from({ length: q.S }, (_, i) => { const e = thing(st, 5, 'item'); Object.assign(e.style, { borderRadius: '18px', background: '#DFF3FF', boxShadow: 'inset 0 0 0 4px ' + INK }); K.reg(st, 's' + i, e, {}); return e; });
      st.dogEls = q.dogs.map((x, k) => { const e = thing(st, 8, 'item'); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center' }); const h = thumb(x, 92); h.style.width = h.style.height = '88%'; e.appendChild(h); K.reg(st, 'd' + k, e, { drag: true, drops: () => st.seatEls.map((s, i) => ({ id: 's' + i, rect: () => box(s) })) }); return e; });
      st.clueEls = q.clues.map(c => { const e = thing(st, 4, 'card'); e.style.zIndex = 4; e.appendChild(this.clueNode(st, c)); e.style.visibility = 'hidden'; return e; });
      st.doneBtn = K.done(st, 'paw'); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      K.pop(st, st.bus); st.dogEls.forEach((e, i) => K.pop(st, e, 60 * i));
      /* the clues one by one, each said as it comes (the pups can be moved meanwhile) */
      const lines = q.clues.map(clueLine);
      st.lead = lines.slice(0, -1); st.prompt = lines[lines.length - 1];
      q.clues.forEach((c, i) => st.scope.timeout(() => { const e = st.clueEls[i]; if (e.style.visibility !== 'hidden') return; e.style.visibility = ''; K.pop(st, e); if (!st.picked) Voice.say(lines[i], { tag: 'prompt' }); }, T(300 + 1250 * i)));
      K.task(st, [[{ node: thumb(q.dogs[0], 46) }], [{ node: (() => { const s = el('span', ''); s.innerHTML = '<svg viewBox="0 0 60 40" width="60" height="40"><rect x="3" y="4" width="54" height="28" rx="9" fill="#E8554A" stroke="#2B2118" stroke-width="3"/><circle cx="15" cy="33" r="6" fill="#2B2118"/><circle cx="45" cy="33" r="6" fill="#2B2118"/></svg>'; return s; })() }]]);
    },
    select(st, k) { st.sel = st.sel === k ? null : k; st.dogEls.forEach((e, i) => { e.style.outline = i === st.sel ? '6px solid ' + GOLD : ''; e.style.borderRadius = '50%'; }); },
    sit(st, k, i) {
      const x = st.q.dogs[k], was = st.seat.indexOf(x);
      if (was >= 0) st.seat[was] = null;
      st.seat[i] = x; st.dogEls[k].style.transform = '';
      if (st.sel != null) this.select(st, st.sel);
      this.place(st); K.pop(st, st.dogEls[k]); Sfx.place();
      st.doneBtn.classList.toggle('ready', st.seat.every(Boolean));
      return 'ok';
    },
    onGesture(st, name, p) {
      if (st.picked || !st.seatEls) return false;
      const id = p.id || ''; let m;
      if (name === 'drop' && (m = /^d(\d)$/.exec(id))) { const s = /^s(\d)$/.exec(p.to || ''); st.dogEls[+m[1]].style.transform = ''; return s ? this.sit(st, +m[1], +s[1]) : 'free'; }
      if (name !== 'tap') return false;
      if ((m = /^d(\d)$/.exec(id))) { const x = st.q.dogs[+m[1]], i = st.seat.indexOf(x); if (i >= 0) { st.seat[i] = null; this.place(st); Sfx.back(); st.doneBtn.classList.remove('ready'); return 'ok'; } this.select(st, +m[1]); return 'ok'; }
      if ((m = /^s(\d)$/.exec(id))) {
        const i = +m[1];
        if (st.sel != null) return this.sit(st, st.sel, i);
        if (st.seat[i]) { st.seat[i] = null; this.place(st); Sfx.back(); st.doneBtn.classList.remove('ready'); return 'ok'; }
        K.wiggle(st, st.seatEls[i]); return 'free';
      }
      if (id === 'done') {
        if (!st.seat.every(Boolean)) { K.wiggle(st, st.doneBtn); return 'free'; }
        st.picked = true; Session.submit(st, st.seat.join(',')); return 'ok';
      }
      return false;
    },
    broken(st, ans) { const ar = String(ans).split(','); return st.q.clues.findIndex(c => !holds(c, ar)); },
    async feedback(st, ans) {
      const c = st.q.clues[Math.max(0, this.broken(st, ans))];
      [c.x, c.y].filter(Boolean).forEach(x => { const k = st.q.dogs.indexOf(x); if (k >= 0) K.wiggle(st, st.dogEls[k]); });
      W5U.say(st, breakLine(c));
      await st.scope.wait(T(600)); await st.scope.guard(Voice.afterSay(60));
    },
    /* 1. the clue he broke blue, its pups wiggle; 2. the clues light up one by one, the pups jump into their seats ("天天在
       毛毛左边"); 3. the seats ringed gold: "全都对上了" */
    async explain(st, ans) {
      const my = st, q = st.q, b = Math.max(0, this.broken(st, ans)), c = q.clues[b];
      st.clueEls.forEach(e => { e.style.visibility = ''; });
      const rings = W5U.blue(st, st.clueEls[b]);
      [c.x, c.y].filter(Boolean).forEach(x => { const k = q.dogs.indexOf(x); if (k >= 0) K.wiggle(st, st.dogEls[k]); });
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      st.seat = q.target.slice(); this.place(st);
      st.dogEls.forEach(e => K.hop(st, e, 18)); Sfx.place();
      for (let i = 0; i < q.clues.length; i++) { if (!Session.alive(my)) return; const e = st.clueEls[i]; e.style.boxShadow = '0 0 0 6px ' + GOLD; K.pop(st, e); await st.scope.wait(T(90)); }
      await say(st, clueLine(c)); if (!Session.alive(my)) return;
      await st.scope.wait(T(150)); if (!Session.alive(my)) return;
      W5U.gold(st, st.seatEls, 10);
      await W5U.sum(st, '全都对上了');
      await st.scope.wait(T(150));
    },
    rightEls(st) { return st.seatEls; },
    async reveal(st) {
      const my = st; Sfx.reveal();
      st.dogEls.forEach(e => K.hop(st, e, 14));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, st.seatEls, 10); this.cheerAll(st);
      st.summary = '全都对上了'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* tests: seat by seat (a wrong pup in a seat is tapped back first), then 出发. 'wrong': the first two swapped */
    next(st, strat) {
      if (st.picked || !st.seatEls) return null;
      const q = st.q, want = q.target.slice(); if (strat === 'wrong') { const t = want[0]; want[0] = want[1]; want[1] = t; }
      for (let i = 0; i < q.S; i++) if (st.seat[i] && st.seat[i] !== want[i]) return { g: 'tap', p: { id: 's' + i } };
      for (let i = 0; i < q.S; i++) if (!st.seat[i]) { const k = q.dogs.indexOf(want[i]), r = box(st.seatEls[i]); return { g: 'drop', p: { id: 'd' + k, to: 's' + i }, to: { x: r.x + r.w / 2, y: r.y + r.h / 2 } }; }
      return { g: 'tap', p: { id: 'done' } };
    },
    gestureHint(st) { const k = st.q.dogs.findIndex(x => !st.seat.includes(x)); if (k < 0) return; const a = mid(st.dogEls[k]), b = mid(st.seatEls[0]); Hand.busy++; Hand.drag(st.scope, a.x, a.y, a.x + (b.x - a.x) * 0.5, a.y + (b.y - a.y) * 0.5, 600).then(() => { Hand.done(); Hand.hide(st.scope); }); },
    workEls(st) { return st.dogEls || []; },
    snap(st) { return { seat: (st.seat || []).join(',') }; },
    lines() {
      const out = [this.intro, '全都对上了'].concat(this.praise);
      DOGS.forEach(x => { ['mid', 'first', 'notends', 'out'].forEach(t => out.push(clueLine({ t, x }), breakLine({ t, x }))); DOGS.forEach(y => { if (y !== x) ['left', 'next', 'notnext'].forEach(t => { if (t === 'left' || x < y) out.push(clueLine({ t, x, y }), breakLine({ t, x, y })); }); }); });
      return uniq(out);
    },
  };
  /* ================================================================ A7 填！ 对号入座：故事变算式 (roles5, boost −1: the first round is L1)
     A little story above (two panels: before / after, or one panel for the stories without a movement), a number sentence
     below; the child puts every part of the story into the slot of its ROLE. Drawn as §3.3 says everywhere in 积木城: what
     went away = a grey dashed outline where it stood + a grey trail out of the door; what is still here = solid, one frame
     round the group; what came = a sparkle; together = a brace. The explanation always says both ("走了两只，" "还剩三只！").
     The first question of a session (L1-L2) first shows the symbol (not scored, not a hint): "走了，" "就写减号！" - a duck
     slides out of the door and its trail becomes "−" / "又来了，" "也写加号！" - one comes in with a sparkle, "+".
       L1 went / came (≤ 5): four picture cards (the group at the start, the group that went / came, the group at the end,
          and one that came / went the other way), the symbols printed; a card in a slot shows its count under it
       L2 number blocks (three right + two off by one from the whole), symbols printed; + the two stories without a
          movement: together (2 red fish, 3 yellow fish, "一共？") and the other part (5 fish, 2 of them red: "黄的？") ≤ 7
       L3 the symbol is a slot too (+ and − blocks); ≤ 9
       L4 read a sentence back into the picture: 6 − 2 = 4 is given, each number goes onto the group it tells about (three
          groups + one group that is not in the story); ≤ 10
       L5 listen (no picture; the task card writes it in pictures): "这里有六只小鸭。" "走了两只。" "还剩几只？" - build the
          whole sentence from number and symbol blocks; ≤ 10
     Judged by ROLE: 5 − 3 = 2 is true but wrong for "5 ducks, 2 went away" - what went away is after the minus, what is left
     after the equals (his own confusion, 10/17). Together: either part first. A random filling is right 1 time in 24 (L1,
     L4), 1 in 60 or 120 (L2, L3, L5). Wrong: the first slot that is wrong ringed blue while the story plays again ("走了的是
     两只" / "还剩三只哦" / "一共是五只" / "这是减法故事"); every number flies from its group into its slot, the group
     glowing ("走了两只，" "还剩三只！"); the sentence read: "五减二等于三". */
  const A7ANI = { duck: '小鸭', chick: '小鸡', bunny: '小兔' };
  const FISHP = c => '<path d="M20 50Q46 22 72 50Q46 78 20 50Z" fill="' + c + '" stroke="#2B2118" stroke-width="5"/><path d="M70 50L92 34V66Z" fill="' + c + '" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/><circle cx="34" cy="46" r="4" fill="#2B2118"/>';
  const FISH = { red: W2X.icon(FISHP('#E8414B')), yellow: W2X.icon(FISHP('#FFC93C')) };
  const DOOR_OUT = W2X.icon('<rect x="8" y="14" width="40" height="76" rx="6" fill="#B97A3C" stroke="#2B2118" stroke-width="5"/><path d="M92 52H58M70 38L56 52L70 66" fill="none" stroke="#9AA3AD" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>');
  const DOOR_IN = W2X.icon('<rect x="8" y="14" width="40" height="76" rx="6" fill="#B97A3C" stroke="#2B2118" stroke-width="5"/><path d="M56 52H90M78 38L92 52L78 66" fill="none" stroke="#2B2118" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M74 20L77 27L84 28L78 32L80 39L74 35L68 39L70 32L64 28L71 27Z" fill="#FFC93C" stroke="#2B2118" stroke-width="2"/>');
  const EQIC = W2X.icon('<rect x="2" y="30" width="26" height="36" rx="5" fill="#fff" stroke="#2B2118" stroke-width="4" stroke-dasharray="6 4"/><path d="M33 48h10" stroke="#2B2118" stroke-width="6"/><rect x="48" y="30" width="26" height="36" rx="5" fill="#fff" stroke="#2B2118" stroke-width="4" stroke-dasharray="6 4"/><path d="M79 42h18M79 54h18" stroke="#2B2118" stroke-width="5"/>');
  const SPARK = '<svg viewBox="0 0 30 30" width="22" height="22" style="position:absolute;right:-6px;top:-8px;pointer-events:none"><path d="M15 1L18 12L29 15L18 18L15 29L12 18L1 15L12 12Z" fill="#FFE45C" stroke="#2B2118" stroke-width="2" stroke-linejoin="round"/></svg>';
  const SYM = { '+': '加', '−': '减' };
  /* the three roles of a story, in the order of the sentence */
  const ROLES = { go: ['start', 'gone', 'left'], come: ['start', 'came', 'all'], join: ['red', 'yellow', 'all'], part: ['all', 'red', 'yellow'] };
  const OPOF = { go: '−', come: '+', join: '+', part: '−' };
  const roleLine = (r, n, u) => ({ start: '一开始是' + CNQ(n) + u, gone: '走了的是' + CNQ(n) + u, came: '来了的是' + CNQ(n) + u, left: '还剩' + CNQ(n) + u + '哦', all: '一共是' + CNQ(n) + u, red: '红的是' + CNQ(n) + u, yellow: '黄的是' + CNQ(n) + u })[r];
  const eqLine = (a, op, b, c) => CN[a] + SYM[op] + CN[b] + '等于' + CN[c];
  /* the two lines while the numbers fly (the first number flies without one) */
  const flyLines = q => ({ go: [null, '走了' + CNQ(q.v[1]) + q.u + '，', '还剩' + CNQ(q.v[2]) + q.u + '！'], come: [null, '来了' + CNQ(q.v[1]) + q.u + '，', '一共' + CNQ(q.v[2]) + q.u + '！'], join: [null, '合起来，', '一共' + CNQ(q.v[2]) + '条！'], part: [null, '拿走红的，', '黄的' + CNQ(q.v[2]) + '条！'] })[q.type];
  /* the story said: two sentences (and at L5 the question) */
  const storyLines = q => { const u = q.u, A = A7ANI[q.ani];
    if (q.type === 'go') return ['这里有' + CNQ(q.v[0]) + u + A + '。', '走了' + CNQ(q.v[1]) + u + '。', '还剩几只？'];
    if (q.type === 'come') return ['这里有' + CNQ(q.v[0]) + u + A + '。', '又来了' + CNQ(q.v[1]) + u + '。', '一共几只？'];
    if (q.type === 'join') return ['有' + CNQ(q.v[0]) + '条红鱼，', CNQ(q.v[1]) + '条黄鱼。', '一共几条？'];
    return ['一共' + CNQ(q.v[0]) + '条鱼，', CNQ(q.v[1]) + '条是红的。', '黄的有几条？']; };

  W5R.A7 = {
    kind0: 'roles5', verb: '填！', intro: '故事变算式！', praise: ['每个数都放对啦！'], props: ['duck', 'chick', 'bunny', 'fish'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, hi = [0, 5, 7, 9, 10, 10][d];
      let type = d === 1 || !G.a7first ? bagPick(G, 'a7m' + d, ['go', 'come']) : bagPick(G, 'a7t' + d, ['go', 'come', 'join', 'part', 'go', 'come']);
      G.a7first = true;
      const ani = bagPick(G, 'a7a', Object.keys(A7ANI)), fish = type === 'join' || type === 'part', u = fish ? '条' : '只';
      let v;
      for (let t = 0; t < 200; t++) {
        const whole = rng.int(d === 1 ? 3 : 4, hi), p = rng.int(1, whole - 1), r = whole - p;
        if (p === r) continue;
        v = type === 'go' ? [whole, p, r] : type === 'come' ? [r, p, whole] : type === 'join' ? [p, r, whole] : [whole, p, r];
        break;
      }
      const op = OPOF[type], roles = ROLES[type], q = { d, type, ani, fish, u, v, op, roles };
      const whole = Math.max(...v), others = [];
      [1, -1, 2, -2, 3].forEach(k => { const x = whole + k; if (others.length < 2 && x >= 1 && x <= 10 && !v.includes(x) && !others.includes(x)) others.push(x); });
      if (d === 1) {
        const chg = type === 'go' ? 'gone' : 'came', wrongChg = type === 'go' ? 'came' : 'gone';
        q.pics = rng.shuffle([{ r: 'start', n: v[0] }, { r: chg, n: v[1] }, { r: roles[2], n: v[2] }, { r: wrongChg, n: v[1] }]);
        q.answer = ['start', chg, roles[2]].join(',');
      } else if (d === 4) {
        const oani = fish ? rng.pick(['chick', 'bunny']) : rng.pick(Object.keys(A7ANI).filter(a => a !== ani));
        let on = 2; while (v.includes(on)) on++;
        q.other = { ani: oani, n: on };
        /* the four groups the numbers can go on, in the picture's order */
        q.tags = type === 'go' ? ['start', 'other', 'gone', 'left'] : type === 'come' ? ['start', 'other', 'came', 'all'] : ['red', 'yellow', 'other', 'all'];
        q.blocks = v.slice();
        q.answer = q.tags.map(r => (r === 'other' ? '' : v[roles.indexOf(r)])).join(',');
      } else {
        q.blocks = rng.shuffle(v.concat(others)).concat(d >= 3 ? ['+', '−'] : []);
        q.answer = d === 2 ? v.join(',') : [v[0], op, v[1], v[2]].join(',');
      }
      q.k = [d, type, ani, v.join('.')];
      q.fact = factOf(op === '+' ? '+' : '-', v[0], v[1]);
      return q;
    },
    /* right: by role; together: either part first */
    evaluate(st, ans) {
      const q = st.q; if (ans === q.answer) return true;
      if (q.type !== 'join' || q.d === 1 || q.d === 4) return false;
      const a = String(ans).split(','), w = String(q.answer).split(',');
      if (q.d === 2) return a[0] === w[1] && a[1] === w[0] && a[2] === w[2];
      return a[0] === w[2] && a[1] === w[1] && a[2] === w[0] && a[3] === w[3];
    },
    audit(q) { const n = q.d === 1 || q.d === 4 ? 24 : q.d === 2 ? 60 : 120; return [{ build: true, chance: (q.type === 'join' && q.d !== 1 && q.d !== 4 ? 2 : 1) / n }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo(st) {
      const q = st.q, L = K.L(), H = q.d === 4 ? 312 : 216, s = L ? 104 : 100;
      const two = !q.fish, py = L ? 96 : 206;
      const panels = q.d === 5 ? [] : two ? (L ? [[124, py, 360, H], [540, py, 360, H]] : [[22, py, 300, H], [382, py, 300, H]]) : (L ? [[Math.round(512 - (q.d === 4 ? 300 : 280)), py, q.d === 4 ? 600 : 560, H]] : [[22, py, 660, H]]);
      const eqY = q.d === 5 ? (L ? 214 : 300) : py + H + (L ? 20 : 18);
      return { L, s, sw: q.d === 1 ? (L ? 150 : 136) : s, H, panels, eqY, eqCx: L ? 470 : 304, by: eqY + s + (q.d === 1 ? 50 : L ? 26 : 30), bs: q.d === 1 ? [L ? 150 : 136, s] : [L ? 100 : 96, L ? 100 : 96] };
    },
    /* the sentence row: [slot] op [slot] = [slot] (L3 / L5: the op is a slot) */
    eqLayout(st) {
      const q = st.q, g = this.geo(st), opSlot = q.d === 3 || q.d === 5, items = [['n', 0], opSlot ? ['o', 1] : ['s', q.op], ['n', opSlot ? 2 : 1], ['s', '='], ['n', opSlot ? 3 : 2]];
      const w = it => (it[0] === 's' ? 52 : it[0] === 'n' ? g.sw : g.s), tot = items.reduce((a, it) => a + w(it), 0) + 8 * (items.length - 1);
      let x = g.eqCx - tot / 2; const out = items.map(it => { const b = { kind: it[0], v: it[1], x: Math.round(x), y: g.eqY, w: w(it), h: g.s }; x += w(it) + 8; return b; });
      return { items: out, right: Math.round(x - 8) };
    },
    homeBox(st, j) {
      const q = st.q, g = this.geo(st), n = q.blocks ? q.blocks.length : q.pics.length, [bw, bh] = g.bs;
      if (q.d === 4) { const it = this.eqLayout(st).items.filter(i => i.kind === 'n')[j]; return { x: it.x, y: it.y, w: it.w, h: it.h }; }
      const per = g.L ? n : (n > 5 ? 4 : n), p = W5U.grid(n, g.L ? 512 : 352, g.by + (Math.ceil(n / per) * (bh + 12) - 12) / 2, bw, bh, 12, 12, per)[j];
      return { x: p.x, y: p.y, w: bw, h: bh };
    },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.eqEls) return;
      if (st.sceneL !== g.L) this.drawScene(st);
      const E = this.eqLayout(st);
      E.items.forEach((it, i) => place(st.eqEls[i], it.x, it.y, it.w, it.h));
      const ex = E.items[0].x - 10, ew = E.right - E.items[0].x + 20; place(st.eqBox, ex, g.eqY - 10, ew, g.s + 20);
      (st.blockEls || []).forEach((e, j) => { const at = st.at[j]; let b; if (at && at[0] === 'q') b = this.slotBox(st, at[1]); else if (at && at[0] === 't') b = box(st.tagEls[at[1]]); else b = this.homeBox(st, j); place(e, b.x + (b.w - parseFloat(e.style.width || b.w)) / 2, b.y, parseFloat(e.style.width) || b.w, b.h); });
      (st.counts || []).forEach((c, i) => { if (!c) return; const b = this.slotBox(st, i); place(c, b.x + b.w / 2 - 40, b.y + b.h + 2, 80, 40); });
      (st.slots || []).forEach((sl, i) => { const full = st.at.some(x => x && ((x[0] === 'q' && x[1] === i) || (q.d === 4 && x[0] === 'e' && x[1] === i))); sl.el.style.borderColor = full ? 'transparent' : (sl.op ? '#E8414B' : '#2E6FD8'); });
      if (st.doneBtn) { st.doneBtn._done.x = E.right + 22; st.doneBtn._done.y = g.eqY - 2; K.placeDone(st.doneBtn); }
    },
    slotBox(st, i) { const it = this.eqLayout(st).items.filter(x => x.kind !== 's')[i]; return { x: it.x, y: it.y, w: it.w, h: it.h }; },
    /* ---------------------------------------------------------------- the story picture (rebuilt when the stage turns) */
    drawScene(st) {
      const q = st.q, g = this.geo(st);
      (st.panelEls || []).forEach(e => e.remove()); (st.tagEls || []).forEach(e => e.remove());
      st.sceneL = g.L; st.panelEls = []; st.grp = {}; st.tagEls = [];
      if (q.d === 5) return;
      const mk = (P, z) => { const e = thing(st, z || 3, 'item'); place(e, P[0], P[1], P[2], P[3]); Object.assign(e.style, { borderRadius: '22px', background: 'rgba(255,248,236,.94)', boxShadow: '0 0 0 4px ' + INK }); st.panelEls.push(e); return e; };
      const L4 = q.d === 4, top = L4 ? 104 : 28, gh = L4 ? 180 : 168;
      /* a group: n pictures in rows inside (x, y, w, h) of panel p; kind: 'plain' | 'gone' | 'came' | 'framed' */
      const group = (p, role, src, n, x, y, w, h, kind) => {
        const e = el('div', '', p); Object.assign(e.style, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', pointerEvents: 'none', borderRadius: '16px' });
        let per = Math.max(1, Math.min(n, Math.floor((w - 8) / 60))); if (Math.ceil(n / per) * 60 > h) per = Math.max(1, Math.min(n, Math.floor((w - 8) / 46)));
        const rows = Math.ceil(n / per), sz = Math.max(30, Math.min(56, Math.floor((w - 8) / per) - 4, Math.floor((h - 8) / rows) - 4));
        for (let i = 0; i < n; i++) {
          const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per, cell = el('div', '', e);
          Object.assign(cell.style, { position: 'absolute', width: sz + 'px', height: sz + 'px', left: Math.round(w / 2 - (inRow * (sz + 4)) / 2 + c * (sz + 4)) + 'px', top: Math.round(h / 2 - (rows * (sz + 4)) / 2 + r * (sz + 4)) + 'px' });
          if (kind === 'gone') { Object.assign(cell.style, { border: '4px dashed ' + W5U.GREY, borderRadius: '14px', boxSizing: 'border-box', background: 'rgba(154,163,173,.14)' }); const im = img(src, '', cell); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain', opacity: '.28', filter: 'grayscale(1)' }); }
          else { const im = img(src, '', cell); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain' }); if (kind === 'came') cell.insertAdjacentHTML('beforeend', SPARK); }
        }
        if (kind === 'framed') e.style.boxShadow = '0 0 0 4px ' + INK;
        st.grp[role] = e; return e;
      };
      const src = q.fish ? null : W5U.prop(q.ani);
      if (!q.fish) {
        const [A, B] = g.panels.map(P => mk(P)), w1 = g.panels[0][2], w2 = g.panels[1][2];
        const arr = thing(st, 4, 'item'); arr.innerHTML = '<svg viewBox="0 0 60 60" width="100%" height="100%" style="pointer-events:none"><path d="M8 30H44M32 16L48 30L32 44" fill="none" stroke="#2B2118" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        place(arr, g.panels[0][0] + w1 + 4, g.panels[0][1] + g.H / 2 - 22, g.panels[1][0] - g.panels[0][0] - w1 - 8, 44); st.panelEls.push(arr);
        /* the door of the after picture */
        const door = el('div', '', B); Object.assign(door.style, { position: 'absolute', left: '8px', top: (top + 4) + 'px', width: '40px', height: (gh - 8) + 'px', borderRadius: '8px', background: '#B97A3C', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none' });
        if (L4) { group(A, 'start', src, q.v[0], 12, top, w1 * 0.62, gh, 'plain'); group(A, 'other', W5U.prop(q.other.ani), q.other.n, w1 * 0.66, top, w1 * 0.32, gh, 'plain'); }
        else group(A, 'start', src, q.v[0], 14, top, w1 - 28, gh, 'plain');
        const cw = Math.round((w2 - 60) * 0.42);
        if (q.type === 'go') {
          const gone = group(B, 'gone', src, q.v[1], 56, top, cw, gh, 'gone');
          group(B, 'left', src, q.v[2], 64 + cw, top, w2 - 72 - cw, gh, 'framed');
          /* the ones that went: faded at the door, a grey trail out */
          const t = svg('svg', { width: w2, height: g.H }, B); Object.assign(t.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', overflow: 'visible' });
          const y = top + gh / 2; svg('path', { d: 'M' + (56 + cw * 0.8) + ' ' + y + 'L22 ' + y, stroke: W5U.GREY, 'stroke-width': 6, 'stroke-dasharray': '3 10', 'stroke-linecap': 'round', fill: 'none' }, t); svg('path', { d: W5U.arrowHead({ x: 60, y }, { x: 14, y }, 18), fill: W5U.GREY }, t);
          st.trail = t; void gone;
        } else {
          group(B, 'came', src, q.v[1], 56, top, cw, gh, 'came');
          group(B, 'old', src, q.v[0], 64 + cw, top, w2 - 72 - cw, gh, 'plain');
          const all = el('div', '', B); Object.assign(all.style, { position: 'absolute', left: '52px', top: (top - 4) + 'px', width: (w2 - 60) + 'px', height: (gh + 8) + 'px', borderRadius: '18px', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none' }); st.grp.all = all;
        }
      } else {
        const A = mk(g.panels[0]), w = g.panels[0][2], fw = L4 ? Math.round(w * 0.3) : Math.round(w * 0.42), fy = top, fh = L4 ? 96 : 120;
        group(A, 'red', FISH.red, q.v[q.type === 'join' ? 0 : 1], 20, fy, fw, fh, 'plain');
        const yel = group(A, 'yellow', FISH.yellow, q.v[q.type === 'join' ? 1 : 2], 30 + fw, fy, fw, fh, 'plain');
        if (q.type === 'part' && q.d !== 4) { const cv = el('div', 'a7cover', yel); Object.assign(cv.style, { position: 'absolute', inset: '-4px', borderRadius: '16px', background: '#7FB2D9', boxShadow: '0 0 0 4px ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }); cv.innerHTML = ICONS.q; cv.firstChild.style.width = '54px'; cv.firstChild.style.height = '54px'; st.cover = cv; }
        if (L4) group(A, 'other', W5U.prop(q.other.ani), q.other.n, 44 + 2 * fw, fy, w - 60 - 2 * fw, fh, 'plain');
        /* together: a brace under both */
        const all = el('div', '', A); Object.assign(all.style, { position: 'absolute', left: '16px', top: (fy - 4) + 'px', width: (2 * fw + 18) + 'px', height: (fh + 40) + 'px', pointerEvents: 'none' }); st.grp.all = all;
        const b = svg('svg', { width: 2 * fw + 18, height: fh + 40 }, all); b.style.overflow = 'visible';
        const by = fh + 10, x0 = 4, x1 = 2 * fw + 14, m = (x0 + x1) / 2;
        svg('path', { d: 'M' + x0 + ' ' + by + 'Q' + x0 + ' ' + (by + 14) + ' ' + (x0 + 20) + ' ' + (by + 14) + 'L' + (m - 16) + ' ' + (by + 14) + 'Q' + m + ' ' + (by + 14) + ' ' + m + ' ' + (by + 28) + 'Q' + m + ' ' + (by + 14) + ' ' + (m + 16) + ' ' + (by + 14) + 'L' + (x1 - 20) + ' ' + (by + 14) + 'Q' + x1 + ' ' + (by + 14) + ' ' + x1 + ' ' + by, stroke: INK, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, b);
        if (q.type === 'part' && q.d !== 4) { const t = el('div', '', all); Object.assign(t.style, { position: 'absolute', left: (m - 34) + 'px', top: (by + 30) + 'px' }); t.appendChild(UI.num(q.v[0], 40)); }
        else if (q.d !== 4) { const t = el('div', '', all); Object.assign(t.style, { position: 'absolute', left: (m - 22) + 'px', top: (by + 30) + 'px', width: '44px', height: '44px' }); t.innerHTML = ICONS.q; }
      }
      /* L4: a dashed tag for a number at every group (above it; "together" below the brace) */
      if (L4) {
        st.tagEls = q.tags.map((r, i) => {
          const e = thing(st, 6, 'item'), G0 = W5U.rect(st.grp[r]), s = 92;
          const x = r === 'all' && q.fish ? G0.x + G0.w / 2 - s / 2 : r === 'all' ? G0.x + G0.w - s - 6 : G0.x + G0.w / 2 - s / 2, y = r === 'all' && q.fish ? G0.y + G0.h - 2 : G0.y - s - 6;
          place(e, Math.round(x), Math.round(y), s, s);
          Object.assign(e.style, { borderRadius: '18px', border: '5px dashed #2E6FD8', background: 'rgba(223,243,255,.85)', boxSizing: 'border-box' });
          K.reg(st, 't' + i, e, {});
          return e;
        });
      }
    },
    numBlock(v) { const e = el('div', ''); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', pointerEvents: 'none' }); if (v === '+' || v === '−') e.innerHTML = '<svg viewBox="0 0 40 40" width="58" height="58"><rect x="6" y="16" width="28" height="8" rx="4" fill="#2B2118"/>' + (v === '+' ? '<rect x="16" y="6" width="8" height="28" rx="4" fill="#2B2118"/>' : '') + '</svg>'; else { const n = UI.num(v, 62); e.appendChild(n); } return e; },
    picCard(p) {
      const q = this._q, e = el('div', ''); Object.assign(e.style, { position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' });
      const n = p.n, per = Math.min(n, 5), sz = 26, row = el('div', '', e); Object.assign(row.style, { position: 'absolute', left: '14px', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3px' });
      for (let i = 0; i < n; i++) { const c = el('div', '', row); Object.assign(c.style, { position: 'relative', width: sz + 'px', height: sz + 'px' }); if (p.r === 'gone') { Object.assign(c.style, { border: '3px dashed ' + W5U.GREY, borderRadius: '8px', boxSizing: 'border-box' }); const im = img(W5U.prop(q.ani), '', c); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain', opacity: '.28', filter: 'grayscale(1)' }); } else { const im = img(W5U.prop(q.ani), '', c); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain' }); if (p.r === 'came') c.insertAdjacentHTML('beforeend', SPARK.replace('width="22" height="22"', 'width="14" height="14"')); } }
      if (p.r === 'gone' || p.r === 'came') { const ar = el('div', '', e); Object.assign(ar.style, { position: 'absolute', left: '2px', top: '4px', width: '40px', height: '30px' }); ar.innerHTML = '<svg viewBox="0 0 40 30" width="40" height="30"><rect x="1" y="2" width="12" height="26" rx="3" fill="#B97A3C" stroke="#2B2118" stroke-width="2.5"/>' + (p.r === 'gone' ? '<path d="M38 15H18M24 9L17 15L24 21" fill="none" stroke="#9AA3AD" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M16 15H36M30 9L37 15L30 21" fill="none" stroke="#2B2118" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>') + '</svg>'; }
      if (p.r === 'left' || p.r === 'all') row.style.boxShadow = '0 0 0 3px ' + INK, row.style.borderRadius = '10px', row.style.padding = '3px';
      return e;
    },
    async present(st) {
      const q = st.q, G = st.G; this._q = q;
      st.at = []; st.sel = null; st.counts = [];
      this.drawScene(st);
      /* the sentence row */
      st.eqBox = thing(st, 3, 'item'); Object.assign(st.eqBox.style, { borderRadius: '22px', background: 'rgba(255,248,236,.9)', boxShadow: '0 0 0 4px ' + INK });
      const E = this.eqLayout(st);
      st.slots = [];
      st.eqEls = E.items.map((it, i) => {
        const e = thing(st, 5, 'item');
        if (it.kind === 's') { Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center' }); e.innerHTML = it.v === '=' ? '<svg viewBox="0 0 40 40" width="46" height="46"><rect x="6" y="11" width="28" height="7" rx="3.5" fill="#2B2118"/><rect x="6" y="23" width="28" height="7" rx="3.5" fill="#2B2118"/></svg>' : this.numBlock(it.v).innerHTML; e._sym = it.v; return e; }
        Object.assign(e.style, { borderRadius: '16px', border: '5px dashed ' + (it.kind === 'o' ? '#E8414B' : '#2E6FD8'), background: '#fff', boxSizing: 'border-box' });
        const k = st.slots.length; st.slots.push({ el: e, op: it.kind === 'o' }); if (q.d !== 4) K.reg(st, 'q' + k, e, {});
        return e;
      });
      /* the lesson: the first question of the session (L1-L2) shows where the symbol comes from */
      if (q.d <= 2 && !G.a7les && (q.type === 'go' || q.type === 'come')) { G.a7les = true; this.place(st); await this.lesson(st); if (!Session.alive(st)) return; }
      /* the blocks: L1 picture cards, L2-L3 / L5 number (and symbol) blocks, L4 the given sentence's numbers */
      const items = q.d === 1 ? q.pics : q.blocks;
      st.blockEls = items.map((p, j) => {
        const e = W3X.card(st, null, 8), b = this.homeBox(st, j); place(e, b.x, b.y, b.w, b.h);
        e.appendChild(q.d === 1 ? this.picCard(p) : this.numBlock(p));
        K.reg(st, 'b' + j, e, { drag: true, drops: () => this.drops(st, j) });
        if (q.d === 4) st.at[j] = ['e', j];
        return e;
      });
      st.doneBtn = K.done(st, 'check', 0, 0, 100); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      st.blockEls.forEach((e, i) => K.pop(st, e, 60 * i));
      const S = storyLines(q);
      if (q.d === 5) {
        const sent = q.type === 'go' ? [[W5U.prop(q.ani), { qty: q.v[0] }], [DOOR_OUT, { qty: q.v[1] }], ['q']] : q.type === 'come' ? [[W5U.prop(q.ani), { qty: q.v[0] }], [DOOR_IN, { qty: q.v[1] }], ['q']] : q.type === 'join' ? [[FISH.red, { qty: q.v[0] }], [FISH.yellow, { qty: q.v[1] }], ['q']] : [[FISH.red, FISH.yellow, { qty: q.v[0] }], [FISH.red, { qty: q.v[1] }], [FISH.yellow, 'q']];
        K.task(st, sent);
        st.lead = ['听故事，列算式！', S[0], S[1]]; st.lead.forEach(l => Voice.say(l, { tag: 'prompt' })); K.say(st, S[2]);
      } else {
        K.task(st, [[EQIC]]);
        st.lead = [S[0], S[1]]; st.lead.forEach(l => Voice.say(l, { tag: 'prompt' })); K.say(st, q.d === 4 ? '把数放回图里！' : '放进算式里！');
      }
    },
    /* the symbol, once a session: "走了，" "就写减号！" (a duck slides out, its trail becomes −) / "又来了，" "也写加号！" */
    async lesson(st) {
      const my = st, q = st.q, g = this.geo(st), sym = st.eqEls[1], go = q.type === 'go';
      sym.style.opacity = '0';
      /* a little stage of its own where the blocks will come: a door, one animal going out (coming in) */
      const W = 420, H = 124, cx = g.L ? 512 : 352, card = thing(st, 30, 'item'); place(card, Math.round(cx - W / 2), g.by, W, H);
      Object.assign(card.style, { borderRadius: '22px', background: '#FFF8EC', boxShadow: '0 0 0 4px ' + INK, overflow: 'visible' });
      card.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none"><rect x="' + (go ? 20 : 20) + '" y="14" width="46" height="96" rx="8" fill="#B97A3C" stroke="#2B2118" stroke-width="5"/></svg>';
      const a = img(W5U.prop(q.ani), '', card); Object.assign(a.style, { position: 'absolute', width: '70px', height: '70px', top: '26px', left: go ? '300px' : '30px' });
      const tr = svg('path', { d: 'M300 62H300', stroke: go ? W5U.GREY : '#FFC93C', 'stroke-width': 12, 'stroke-linecap': 'round', fill: 'none' }, card.firstChild);
      W3X.say2(st, go ? '走了，' : '又来了，', go ? '就写减号！' : '也写加号！');
      const t0 = performance.now(), dur = T(1100);
      await new Promise(res => { const f = () => { if (!Session.alive(my)) return res(); const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1, x = go ? 300 - 230 * k : 30 + 230 * k;
        a.style.left = x + 'px'; a.style.opacity = go ? String(1 - 0.75 * k) : '1'; tr.setAttribute('d', go ? 'M' + (x + 60) + ' 62H330' : 'M80 62H' + (x + 10));
        if (k < 1) requestAnimationFrame(f); else res(); }; f(); });
      if (!Session.alive(my)) return;
      if (!go) { const b = box(card); Fx.burst(Stage.toScreen(b.x + 300, b.y + 60).x, Stage.toScreen(b.x + 300, b.y + 60).y, { n: 10, dist: 40 }); }
      /* the trail (the arms) becomes the symbol and goes to its place */
      const m = thing(st, 31, 'item'), mb = box(card), sb = box(sym); place(m, Math.round(mb.x + W / 2 - 40), Math.round(mb.y + 22), 80, 80);
      m.innerHTML = this.numBlock(q.op).innerHTML; m.style.display = 'flex'; m.style.alignItems = 'center'; m.style.justifyContent = 'center';
      tr.setAttribute('opacity', 0.25); K.pop(st, m);
      await st.scope.wait(T(350)); if (!Session.alive(my)) return;
      await st.scope.anim(m, [{ transform: 'none' }, { transform: 'translate(' + (sb.x + sb.w / 2 - mb.x - W / 2) + 'px,' + (sb.y + sb.h / 2 - mb.y - 62) + 'px)' }], { duration: T(550), easing: EASE.glide, fill: 'forwards' });
      if (!Session.alive(my)) return;
      m.remove(); sym.style.opacity = ''; K.pop(st, sym); Sfx.pop();
      await st.scope.guard(Voice.afterSay(100)); if (!Session.alive(my)) return;
      await st.scope.anim(card, [{ opacity: 1 }, { opacity: 0 }], { duration: T(200), fill: 'forwards' });
      card.remove(); st.lead = null;
    },
    drops(st, j) {
      const q = st.q;
      if (q.d === 4) return st.tagEls.map((e, i) => ({ id: 't' + i, rect: () => box(e) }));
      const isSym = q.d !== 1 && (q.blocks[j] === '+' || q.blocks[j] === '−');
      return st.slots.map((s, i) => ({ id: 'q' + i, rect: () => box(s.el), op: s.op })).filter(x => (q.d === 1 || q.d === 2 ? true : x.op === isSym));
    },
    /* block j goes into slot / tag (the one there goes home) */
    put(st, j, where) {
      const q = st.q, [kind, i] = where;
      if (kind === 'q') { const isSym = q.d !== 1 && (q.blocks[j] === '+' || q.blocks[j] === '−'); if ((q.d === 3 || q.d === 5) && st.slots[i].op !== isSym) { st.blockEls[j].style.transform = ''; K.wiggle(st, st.slots[i].el); return 'free'; } }
      const old = st.at.findIndex((a, k) => k !== j && a && a[0] === kind && a[1] === i);
      if (old >= 0) st.at[old] = q.d === 4 ? ['e', old] : null;
      st.at[j] = [kind, i]; st.blockEls[j].style.transform = '';
      if (st.sel != null) this.select(st, st.sel);
      if (q.d === 1) this.showCounts(st);
      this.place(st); K.pop(st, st.blockEls[j]); Sfx.place();
      st.doneBtn.classList.toggle('ready', this.full(st));
      return 'ok';
    },
    back(st, j) { st.at[j] = st.q.d === 4 ? ['e', j] : null; if (st.q.d === 1) this.showCounts(st); this.place(st); Sfx.back(); st.doneBtn.classList.remove('ready'); return 'ok'; },
    full(st) { const q = st.q; return q.d === 4 ? st.at.every(a => a[0] === 't') : st.slots.every((_, i) => st.at.some(a => a && a[0] === 'q' && a[1] === i)); },
    /* L1: a picture in a slot shows its count under it */
    showCounts(st) {
      (st.counts || []).forEach(c => c && c.remove()); st.counts = [];
      st.slots.forEach((s, i) => { const j = st.at.findIndex(a => a && a[0] === 'q' && a[1] === i); if (j < 0) return; const c = thing(st, 6, 'item'); Object.assign(c.style, { display: 'flex', justifyContent: 'center' }); c.appendChild(UI.num(st.q.pics[j].n, 38)); st.counts[i] = c; });
    },
    select(st, j) { st.sel = st.sel === j ? null : j; st.blockEls.forEach((e, k) => { e.style.outline = k === st.sel ? '7px solid ' + GOLD : ''; e.style.outlineOffset = '3px'; }); },
    onGesture(st, name, p) {
      if (st.picked || !st.blockEls) return false;
      const id = p.id || '', q = st.q; let m;
      if (name === 'drop' && (m = /^b(\d)$/.exec(id))) { const j = +m[1], t = /^([qt])(\d)$/.exec(p.to || ''); if (!t) { st.blockEls[j].style.transform = ''; return 'free'; } return this.put(st, j, [t[1], +t[2]]); }
      if (name !== 'tap') return false;
      if ((m = /^b(\d)$/.exec(id))) { const j = +m[1], a = st.at[j]; if (a && a[0] !== 'e') return this.back(st, j); this.select(st, j); return 'ok'; }
      if ((m = /^([qt])(\d)$/.exec(id))) {
        const i = +m[2], j = st.at.findIndex(a => a && a[0] === m[1] && a[1] === i);
        if (st.sel != null) return this.put(st, st.sel, [m[1], i]);
        if (j >= 0) return this.back(st, j);
        return 'free';
      }
      if (id === 'done') {
        if (!this.full(st)) { K.wiggle(st, st.doneBtn); return 'free'; }
        st.picked = true; if (st.sel != null) this.select(st, st.sel);
        Session.submit(st, this.value(st)); return 'ok';
      }
      return false;
    },
    value(st) {
      const q = st.q;
      if (q.d === 4) return q.tags.map((_, i) => { const j = st.at.findIndex(a => a[0] === 't' && a[1] === i); return j >= 0 ? q.blocks[j] : ''; }).join(',');
      return st.slots.map((_, i) => { const j = st.at.findIndex(a => a && a[0] === 'q' && a[1] === i); return q.d === 1 ? q.pics[j].r : q.blocks[j]; }).join(',');
    },
    /* the first place that is wrong, in reading order: { i (slot / tag), line: that place's role and its number } */
    firstBad(st, ans) {
      const q = st.q, a = String(ans).split(','), w = String(q.answer).split(',');
      if (q.d === 4) { const i = a.findIndex((x, k) => x !== w[k] && x !== ''); const r = q.tags[i]; return { i, line: r === 'other' ? A7ANI[q.other.ani] + '不在故事里' : roleLine(r, q.v[q.roles.indexOf(r)], q.u) }; }
      const opS = q.d === 3 || q.d === 5, num = opS ? [0, 2, 3] : [0, 1, 2];
      /* the role each number place wants (together: the two parts either way round) */
      const want = num.map((p, k) => q.roles[k]);
      if (q.type === 'join' && q.d !== 1 && a[num[0]] === w[num[1]]) { want[0] = 'yellow'; want[1] = 'red'; }
      for (let i = 0; i < a.length; i++) {
        if (opS && i === 1) { if (a[1] !== q.op) return { i, line: q.op === '−' ? '这是减法故事' : '这是加法故事' }; continue; }
        const k = num.indexOf(i), r = want[k], ri = q.roles.indexOf(r), ok = q.d === 1 ? a[i] === w[k] : a[i] === String(q.v[ri]);
        if (!ok) return { i, line: roleLine(r, q.v[ri], q.u) };
      }
      return { i: 0, line: roleLine(q.roles[0], q.v[0], q.u) };
    },
    /* the sentence is heard to its end before the story plays again */
    async feedback(st, ans) { const b = this.firstBad(st, ans); W5U.say(st, b.line); await st.scope.wait(T(600)); await st.scope.guard(Voice.afterSay(60)); },
    /* 1. the wrong place blue while the story's change plays again; 2. every number flies from its group into its slot (L4:
       from the sentence onto its group), the group glowing - "走了两只，" "还剩三只！"; 3. "五减二等于三" */
    async explain(st, ans) {
      const my = st, q = st.q, b = this.firstBad(st, ans);
      const target = q.d === 4 ? st.tagEls[b.i] : st.slots[b.i].el, rings = W5U.blue(st, target);
      this.replay(st);
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      await W5U.beat(st); if (!Session.alive(my)) return;
      if (st.cover) { st.cover.style.transition = 'opacity .3s'; st.cover.style.opacity = '0'; }
      /* everything back home, then each right one flies */
      st.blockEls.forEach((e, j) => { st.at[j] = q.d === 4 ? ['e', j] : null; }); if (q.d === 1) this.showCounts(st); this.place(st);
      const lines = flyLines(q), order = [0, 1, 2];
      for (const k of order) {
        if (!Session.alive(my)) return;
        const role = q.roles[k], grp = st.grp[role];
        let j, where;
        if (q.d === 1) { j = q.pics.findIndex(p => p.r === (k === 0 ? 'start' : k === 1 ? (q.type === 'go' ? 'gone' : 'came') : q.roles[2])); where = ['q', k]; }
        else if (q.d === 4) { j = k; where = ['t', q.tags.indexOf(role)]; }
        else { j = q.blocks.findIndex((x, jj) => x === q.v[k] && !st.at[jj]); where = ['q', q.d === 2 ? k : [0, 2, 3][k]]; }
        if (grp) { grp.classList.add('glow'); st.scope.timeout(() => grp.classList.remove('glow'), 1600); }
        const e = st.blockEls[j], from = box(e); st.at[j] = where; if (q.d === 1) this.showCounts(st); this.place(st); const to = box(e);
        const src = q.d === 4 ? from : (grp ? W5U.rect(grp) : from);
        if (!ff(st)) e.animate([{ transform: 'translate(' + (src.x + src.w / 2 - to.x - to.w / 2) + 'px,' + (src.y + src.h / 2 - to.y - to.h / 2) + 'px) scale(.6)' }, { transform: 'none' }], { duration: T(320), easing: EASE.glide });
        Sfx.place();
        if (lines[k]) await say(st, lines[k]); else await st.scope.wait(T(100));
        await st.scope.wait(T(30));
      }
      if (q.d === 3 || q.d === 5) { const j = q.blocks.indexOf(q.op); st.at[j] = ['q', 1]; this.place(st); K.pop(st, st.blockEls[j]); }
      if (!Session.alive(my)) return;
      W5U.gold(st, q.d === 4 ? q.roles.map(r => st.tagEls[q.tags.indexOf(r)]) : st.eqBox, 6);
      await W5U.sum(st, eqLine(q.v[0], q.op, q.v[1], q.v[2]));
      await st.scope.wait(T(40));
    },
    /* the story's change again: the ones that went fade out by the door / the ones that came sparkle */
    replay(st) {
      const q = st.q, gg = st.grp[q.type === 'go' ? 'gone' : q.type === 'come' ? 'came' : 'yellow'];
      if (!gg || ff(st)) return;
      if (q.type === 'come') { W5U.came(st, gg); return; }
      st.scope.anim(gg, [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], { duration: 800 });
      if (st.trail) st.scope.anim(st.trail, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
    },
    rightEls(st) { const q = st.q; return q.d === 4 ? q.roles.map(r => st.tagEls[q.tags.indexOf(r)]) : [st.eqBox]; },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      st.blockEls.forEach(e => K.hop(st, e, 12));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, q.d === 4 ? q.roles.map(r => st.tagEls[q.tags.indexOf(r)]) : st.eqBox, 6); this.cheerAll(st);
      st.summary = eqLine(q.v[0], q.op, q.v[1], q.v[2]); W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* tests: every block to the slot of its role (a wrong one tapped back first), then 好了. 'wrong': the last two roles
       swapped - the child's own 5 − 3 = 2 */
    next(st, strat) {
      if (st.picked || !st.blockEls) return null;
      const q = st.q, w = String(q.answer).split(',');
      if (strat === 'wrong') { const a = q.d === 4 ? q.tags.indexOf(q.roles[1]) : w.length - 2, b = q.d === 4 ? q.tags.indexOf(q.roles[2]) : w.length - 1, t = w[a]; w[a] = w[b]; w[b] = t; }
      const kind = q.d === 4 ? 't' : 'q', n = q.d === 4 ? q.tags.length : st.slots.length;
      const valOf = j => (q.d === 1 ? q.pics[j].r : String(q.blocks[j]));
      for (let i = 0; i < n; i++) {
        const j = st.at.findIndex(a => a && a[0] === kind && a[1] === i);
        if (j >= 0 && valOf(j) !== w[i]) return { g: 'tap', p: { id: kind + i } };
        if (j < 0 && w[i] !== '') {
          const jj = (q.d === 1 ? q.pics : q.blocks).findIndex((x, k) => valOf(k) === w[i] && !(st.at[k] && st.at[k][0] === kind));
          if (jj < 0) continue;
          const r = kind === 'q' ? box(st.slots[i].el) : box(st.tagEls[i]);
          return { g: 'drop', p: { id: 'b' + jj, to: kind + i }, to: { x: r.x + r.w / 2, y: r.y + r.h / 2 } };
        }
      }
      return { g: 'tap', p: { id: 'done' } };
    },
    gestureHint(st) { const e = (st.blockEls || [])[0], t = st.q.d === 4 ? st.tagEls[0] : st.slots[0].el; if (!e || !t) return; const a = mid(e), b = mid(t); Hand.busy++; Hand.drag(st.scope, a.x, a.y, a.x + (b.x - a.x) * 0.5, a.y + (b.y - a.y) * 0.5, 600).then(() => { Hand.done(); Hand.hide(st.scope); }); },
    workEls(st) { return st.blockEls || []; },
    snap(st) { return { at: (st.at || []).map(a => (a ? a.join('') : '-')).join(' ') }; },
    lines() {
      const out = [this.intro, '放进算式里！', '把数放回图里！', '听故事，列算式！', '走了，', '就写减号！', '又来了，', '也写加号！', '合起来，', '拿走红的，', '这是减法故事', '这是加法故事', '还剩几只？', '一共几只？', '一共几条？', '黄的有几条？'].concat(this.praise);
      for (let n = 1; n <= 10; n++) {
        ['start', 'gone', 'came', 'left', 'all'].forEach(r => out.push(roleLine(r, n, '只')));
        ['all', 'red', 'yellow'].forEach(r => out.push(roleLine(r, n, '条')));
        out.push('走了' + CNQ(n) + '只，', '还剩' + CNQ(n) + '只！', '来了' + CNQ(n) + '只，', '一共' + CNQ(n) + '只！', '一共' + CNQ(n) + '条！', '黄的' + CNQ(n) + '条！');
        out.push('走了' + CNQ(n) + '只。', '又来了' + CNQ(n) + '只。', '有' + CNQ(n) + '条红鱼，', CNQ(n) + '条黄鱼。', '一共' + CNQ(n) + '条鱼，', CNQ(n) + '条是红的。');
        Object.values(A7ANI).forEach(A => out.push('这里有' + CNQ(n) + '只' + A + '。'));
        for (let m = 1; m <= 10; m++) { if (n + m <= 10 && n !== m) out.push(eqLine(n, '+', m, n + m)); if (n - m >= 1 && m !== n - m) out.push(eqLine(n, '−', m, n - m)); }
      }
      Object.values(A7ANI).forEach(A => out.push(A + '不在故事里'));
      return uniq(out);
    },
  };
  /* ================================================================ A5 画！ 画路线 (route5)
     L1-L3 a block-wall maze seen from above (cells of 96): 阿奇's police car at the start, the kitten at the end, bones to
     pick up, puddles to keep out of. L4-L5 a block castle seen from the side (3-4 floors, ladders between them): a locked
     door just before the kitten and a key somewhere (L5 also a sleeping teddy on one way). The maze always has several ways.
     The finger draws: press on the car (or on the line's end) and drag - the line follows cell by cell into open
     neighbours only (a wall stops it); dragging back along it takes it back; let go and it stays, touch its end to go on;
     tap the car to clear it. The line reaching the kitten is the answer (the car drives it).
       L1 4 x 4, "路上捡骨头！" · L2 5 x 5, "捡骨头，" "不踩水坑！" · L3 6 x 6, "两根骨头都要捡！"
       L4 castle, 3 floors: "先拿钥匙，" "再开门！" (the line may go through the locked door; without the key first it is
          not right) · L5 castle, 4 floors, key + door + "别吵醒小熊！"
     Right: at the kitten, every bone (the key before the door) on the way, no puddle / teddy. Each maze is drawn so that at
     most 1 in 5 of all the ways to the kitten is right, and the shortest is not. Wrong: the car drives his line and stops
     where it goes wrong, ringed blue ("踩到水坑啦" / "门还锁着呢" / "吵醒小熊啦"; or at the end the bone it missed:
     "骨头没拿到哦"); a gold line is drawn ("走这边，拿骨头") and the car drives it to the kitten, ringed gold. */
  const ck = c => c[0] + ',' + c[1];
  const ek = (a, b) => [ck(a), ck(b)].sort().join('|');
  /* every simple way from a to b (null when there are more than cap) */
  function allPaths(nb, a, b, cap) {
    const out = [], seen = new Set([ck(a)]), path = [a]; let steps = 0;
    const rec = c => { if (out.length > cap || steps++ > cap * 40) return; if (c[0] === b[0] && c[1] === b[1]) { out.push(path.slice()); return; } nb(c).forEach(n => { const k = ck(n); if (seen.has(k)) return; seen.add(k); path.push(n); rec(n); path.pop(); seen.delete(k); }); };
    rec(a); return out.length > cap || steps > cap * 40 ? null : out;
  }
  W5R.A5 = {
    kind0: 'route5', verb: '画！', intro: '画出路线！', praise: ['路线画得好！'], props: ['bone', 'policecar', 'kitten', 'puddle', 'key', 'teddy'],
    /* the open neighbours of a cell */
    nbOf(q) { return c => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [c[0] + dx, c[1] + dy]).filter(n => n[0] >= 0 && n[1] >= 0 && n[0] < q.cols && n[1] < q.rows && this.open(q, c, n)); },
    open(q, a, b) { if (q.castle && a[1] !== b[1]) return q.ladders.includes(Math.min(a[1], b[1]) + ':' + a[0]) && a[0] === b[0]; return !q.walls.includes(ek(a, b)); },
    /* is a whole path right? (and where it first goes wrong) */
    judge(q, path) {
      const has = c => path.some(p => p[0] === c[0] && p[1] === c[1]);
      for (let i = 0; i < path.length; i++) {
        const c = path[i], k = ck(c);
        if ((q.puddles || []).includes(k)) return { ok: false, why: 'puddle', at: c };
        if (q.bear && q.bear === k) return { ok: false, why: 'bear', at: c };
        if (q.door && q.door === k && !path.slice(0, i).some(p => ck(p) === q.key)) return { ok: false, why: 'door', at: c };
      }
      const last = path[path.length - 1];
      if (!last || ck(last) !== ck(q.goal)) return { ok: false, why: 'short', at: last };
      const miss = (q.bones || []).find(b => !has(b.split(',').map(Number)));
      if (miss) return { ok: false, why: 'bone', at: miss.split(',').map(Number) };
      return { ok: true };
    },
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      for (let t = 0; t < 2000; t++) {
        const q = d <= 3 ? this.maze(G, rng, d) : this.castleQ(G, rng, d);
        if (!q) continue;
        const nb = this.nbOf(q), paths = allPaths(nb, q.start, q.goal, 3000);
        if (!paths || paths.length < 5) continue;
        if (!this.items(q, paths, rng, d)) continue;
        const ok = paths.filter(p => this.judge(q, p).ok);
        if (!ok.length || ok.length / paths.length > 0.2) continue;
        const short = paths.reduce((a, p) => (p.length < a.length ? p : a), paths[0]);
        if (this.judge(q, short).ok) continue;
        q.right = ok.reduce((a, p) => (p.length < a.length ? p : a), ok[0]).map(ck);
        q.wrongPath = short.map(ck);
        q.chance = ok.length / paths.length; q.nPaths = paths.length;
        q.k = [d, q.cols, q.walls.join(' ') + (q.ladders || []).join(' '), (q.bones || []).join(' '), (q.puddles || []).join(' '), q.key || '', q.bear || '', ck(q.start)];
        q.answer = 'ok';
        return q;
      }
      return null;
    },
    /* a maze: a random spanning tree of the cells, then a few more openings (several ways) */
    maze(G, rng, d) {
      const n = d + 3, walls = new Set(), cells = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { cells.push([x, y]); if (x < n - 1) walls.add(ek([x, y], [x + 1, y])); if (y < n - 1) walls.add(ek([x, y], [x, y + 1])); }
      const seen = new Set(), stack = [[rng.int(0, n - 1), rng.int(0, n - 1)]]; seen.add(ck(stack[0]));
      while (stack.length) {
        const c = stack[stack.length - 1], nx = rng.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [c[0] + dx, c[1] + dy]).filter(p => p[0] >= 0 && p[1] >= 0 && p[0] < n && p[1] < n && !seen.has(ck(p))));
        if (!nx.length) { stack.pop(); continue; }
        walls.delete(ek(c, nx[0])); seen.add(ck(nx[0])); stack.push(nx[0]);
      }
      const extra = [0, 3, 4, 6][d], rest = rng.shuffle(Array.from(walls));
      for (let i = 0; i < extra && rest.length; i++) walls.delete(rest.pop());
      const corner = bagPick(G, 'a5c', [0, 1, 2, 3]), C = [[0, 0], [n - 1, 0], [n - 1, n - 1], [0, n - 1]];
      return { d, cols: n, rows: n, walls: Array.from(walls).sort(), start: C[corner], goal: C[(corner + 2) % 4] };
    },
    /* a castle: floors (row 0 the top), ladders between floors, a wall or two; the kitten at an end of the top floor behind
       the door, the start at the other side of the ground floor */
    castleQ(G, rng, d) {
      const F = d === 4 ? 3 : 4, C = 6, walls = [], ladders = [], left = rng.chance(0.5), gx = left ? 0 : C - 1, door = left ? 1 : C - 2;
      for (let y = 0; y < F - 1; y++) { const cols = rng.shuffle([0, 1, 2, 3, 4, 5].filter(x => !(y === 0 && (x === gx || x === door)))).slice(0, d === 4 ? 4 : rng.int(3, 4)); cols.forEach(x => ladders.push(y + ':' + x)); }
      for (let y = 1; y < F; y++) if (rng.chance(0.6)) { const x = rng.int(0, C - 2); walls.push(ek([x, y], [x + 1, y])); }
      return { d, castle: true, cols: C, rows: F, walls: walls.sort(), ladders: ladders.sort(), start: [left ? C - 1 : 0, F - 1], goal: [gx, 0], door: ck([door, 0]) };
    },
    /* bones / puddles / key / teddy where they make the shortest way wrong and keep at least one way right */
    items(q, paths, rng, d) {
      const cnt = {}, k0 = ck(q.start), k1 = ck(q.goal), short = paths.reduce((a, p) => Math.min(a, p.length), 99), onShort = new Set();
      paths.forEach(p => p.forEach(c => { cnt[ck(c)] = (cnt[ck(c)] || 0) + 1; }));
      paths.filter(p => p.length === short).forEach(p => p.forEach(c => onShort.add(ck(c))));
      const free = Object.keys(cnt).filter(k => k !== k0 && k !== k1 && k !== q.door);
      const off = rng.shuffle(free.filter(k => !onShort.has(k) && cnt[k] / paths.length <= 0.5));
      if (!off.length) return false;
      const rare = off.filter(k => cnt[k] / paths.length <= (d === 5 ? 0.4 : 0.2));
      if (d === 1) { if (!rare.length) return false; q.bones = [rare[0]]; }
      else if (d === 2) { q.bones = [off[0]]; const p = rng.shuffle(free.filter(k => onShort.has(k) && k !== off[0])); if (!p.length) return false; q.puddles = p.slice(0, rng.int(1, 2)); }
      else if (d === 3) { if (off.length < 2) return false; q.bones = off.slice(0, 2); }
      else { if (!rare.length) return false; q.key = rare[0]; if (d === 5) { const b = rng.shuffle(free.filter(k => onShort.has(k) && k !== q.key)); if (!b.length) return false; q.bear = b[0]; } }
      return true;
    },
    audit(q) { return [{ build: true, chance: q.chance }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo(st) {
      const q = st.q, L = K.L(), u = 96, rh = q.castle ? 118 : 96, w = q.cols * u, h = q.rows * rh;
      return { L, u, rh, w, h, x: Math.round((L ? 512 : 352) - w / 2), y: Math.round((L ? 400 : 524) - h / 2) };
    },
    cellC(st, c) { const g = this.geo(st); return { x: g.x + (c[0] + 0.5) * g.u, y: g.y + (c[1] + 0.5) * g.rh }; },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.board) return;
      place(st.board, g.x, g.y, g.w, g.h); place(st.art, g.x - 14, g.y - 14, g.w + 28, g.h + 28); place(st.lineEl, g.x, g.y, g.w, g.h);
      st.things.forEach(t => { const c = this.cellC(st, t.c), s = t.s; place(t.el, Math.round(c.x - s / 2), Math.round(c.y - s / 2 + (t.dy || 0)), s, s); });
      this.drawLine(st);
      this.moveCar(st, st.carAt || q.start);
    },
    moveCar(st, c) { st.carAt = c; const p = this.cellC(st, c), s = st.q.castle ? 70 : 78; place(st.car, Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s); },
    /* the picture: maze floor and block walls, or the castle (floors, ladders, the door) */
    drawArt(st) {
      const q = st.q, g = this.geo(st), u = g.u, rh = g.rh, W = g.w + 28, H = g.h + 28;
      let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" style="pointer-events:none;overflow:visible"><g transform="translate(14 14)">';
      if (!q.castle) {
        s += '<rect x="-14" y="-14" width="' + W + '" height="' + H + '" rx="20" fill="#BFE7A2" stroke="#2B2118" stroke-width="5"/>';
        for (let y = 0; y < q.rows; y++) for (let x = 0; x < q.cols; x++) s += '<rect x="' + (x * u + 5) + '" y="' + (y * rh + 5) + '" width="' + (u - 10) + '" height="' + (rh - 10) + '" rx="12" fill="#DDF3C8"/>';
        const bar = (x1, y1, x2, y2) => '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="#2B2118" stroke-width="18" stroke-linecap="round"/><path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="#E2A15B" stroke-width="10" stroke-linecap="round"/>';
        q.walls.forEach(e => { const [a, b] = e.split('|').map(t => t.split(',').map(Number)); if (a[0] !== b[0]) { const x = Math.max(a[0], b[0]) * u; s += bar(x, a[1] * rh + 4, x, (a[1] + 1) * rh - 4); } else { const y = Math.max(a[1], b[1]) * rh; s += bar(a[0] * u + 4, y, (a[0] + 1) * u - 4, y); } });
        s += bar(0, 0, g.w, 0) + bar(g.w, 0, g.w, g.h) + bar(g.w, g.h, 0, g.h) + bar(0, g.h, 0, 0);
      } else {
        s += '<rect x="-14" y="-14" width="' + W + '" height="' + H + '" rx="12" fill="#D9D2C5" stroke="#2B2118" stroke-width="5"/>';
        for (let y = 0; y < q.rows; y++) { s += '<rect x="0" y="' + (y * rh) + '" width="' + g.w + '" height="' + (rh - 14) + '" fill="#EFE9DD"/>'; s += '<rect x="-14" y="' + ((y + 1) * rh - 14) + '" width="' + W + '" height="14" fill="#B97A3C" stroke="#2B2118" stroke-width="4"/>'; }
        q.ladders.forEach(l => { const [y, x] = l.split(':').map(Number), cx = x * u + u / 2, y0 = y * rh + rh / 2, y1 = (y + 1) * rh + rh / 2; s += '<path d="M' + (cx - 16) + ' ' + y0 + 'V' + y1 + 'M' + (cx + 16) + ' ' + y0 + 'V' + y1 + '" stroke="#8A5A2B" stroke-width="7" stroke-linecap="round"/>'; for (let r = y0 + 14; r < y1; r += 20) s += '<path d="M' + (cx - 16) + ' ' + r + 'H' + (cx + 16) + '" stroke="#8A5A2B" stroke-width="5"/>'; });
        q.walls.forEach(e => { const [a, b] = e.split('|').map(t => t.split(',').map(Number)), x = Math.max(a[0], b[0]) * u; s += '<rect x="' + (x - 9) + '" y="' + (a[1] * rh + 4) + '" width="18" height="' + (rh - 18) + '" rx="4" fill="#9AA3AD" stroke="#2B2118" stroke-width="4"/>'; });
        const [dx, dy] = q.door.split(',').map(Number); s += '<rect x="' + (dx * u + 22) + '" y="' + (dy * rh + 12) + '" width="' + (u - 44) + '" height="' + (rh - 28) + '" rx="10" fill="#9A6433" stroke="#2B2118" stroke-width="5"/><circle cx="' + (dx * u + u / 2) + '" cy="' + (dy * rh + rh / 2) + '" r="9" fill="#FFC93C" stroke="#2B2118" stroke-width="3"/>';
      }
      st.art.innerHTML = s + '</g></svg>';
    },
    drawLine(st, gold) {
      const q = st.q, g = this.geo(st), L = gold || st.line;
      st.lineEl.innerHTML = '';
      const s = svg('svg', { viewBox: '0 0 ' + g.w + ' ' + g.h, width: '100%', height: '100%' }, st.lineEl); s.style.pointerEvents = 'none'; s.style.overflow = 'visible';
      const pts = L.map(c => ((c[0] + 0.5) * g.u) + ',' + ((c[1] + 0.5) * g.rh)).join(' ');
      if (L.length > 1) { svg('polyline', { points: pts, fill: 'none', stroke: INK, 'stroke-width': 22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.5 }, s); svg('polyline', { points: pts, fill: 'none', stroke: gold ? GOLD : '#FF6B5B', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s); }
      const h = L[L.length - 1]; if (h && !gold) svg('circle', { cx: (h[0] + 0.5) * g.u, cy: (h[1] + 0.5) * g.rh, r: 14, fill: '#fff', stroke: INK, 'stroke-width': 5 }, s);
      return s;
    },
    async present(st) {
      const q = st.q;
      st.line = []; st.active = false; st.press = null;
      st.art = thing(st, 3, 'item'); this.drawArt(st);
      st.lineEl = thing(st, 5, 'item');
      st.things = [];
      const add = (k, c, s, dy) => { const e = thing(st, 6, 'item'); e.appendChild(W5U.propImg(k)); st.things.push({ el: e, c, s, dy }); return e; };
      st.goalEl = add('kitten', q.goal, 76);
      st.boneEls = (q.bones || []).map(b => add('bone', b.split(',').map(Number), 62));
      st.pudEls = (q.puddles || []).map(b => add('puddle', b.split(',').map(Number), 78));
      if (q.key) st.keyEl = add('key', q.key.split(',').map(Number), 60);
      if (q.bear) st.bearEl = add('teddy', q.bear.split(',').map(Number), 72);
      st.car = thing(st, 7, 'item'); st.car.appendChild(q.castle ? thumb('chase', 64) : W5U.propImg('policecar'));
      st.board = thing(st, 4, 'item');
      const stations = []; for (let y = 0; y < q.rows; y++) for (let x = 0; x < q.cols; x++) stations.push({ id: 'c' + x + '_' + y, rect: () => { const g = this.geo(st); return { x: g.x + x * g.u, y: g.y + y * g.rh, w: g.u, h: g.rh }; } });
      K.reg(st, 'board', st.board, { slide: stations });
      this.place(st);
      K.pop(st, st.art); st.things.forEach((t, i) => K.pop(st, t.el, 120 + 50 * i)); K.pop(st, st.car, 80);
      const goal = q.castle ? [{ node: thumb('chase', 46) }] : [W5U.prop('policecar')];
      K.task(st, [goal.concat((q.bones || []).length ? [W5U.prop('bone')] : q.key ? [W5U.prop('key')] : []), [W5U.prop('kitten')]]);
      if (q.d === 1) K.say(st, '路上捡骨头！');
      else if (q.d === 2) W3X.say2(st, '捡骨头，', '不踩水坑！');
      else if (q.d === 3) K.say(st, '两根骨头都要捡！');
      else W3X.say2(st, '先拿钥匙，', q.d === 4 ? '再开门！' : '别吵醒小熊！');
    },
    adj(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; },
    /* the finger passes a cell (Input's slide stations; the tests send the same) */
    onPass(st, c) {
      const q = st.q, L = st.line, head = L[L.length - 1], k = ck(c);
      if (!st.press) st.press = { at: k, moved: false };
      if (!st.active) {
        if (!L.length && k === ck(q.start)) { st.line = [c]; st.active = true; this.drawLine(st); return 'ok'; }
        if (head && k === ck(head)) { st.active = true; return 'ok'; }
        if (L.length && k === ck(q.start)) { st.active = true; st.fresh = true; return 'ok'; }
        return 'free';
      }
      if (st.fresh) { if (this.adj(q.start, c) && this.open(q, q.start, c)) { st.fresh = false; st.line = [q.start]; } else return 'free'; }
      const H = st.line[st.line.length - 1];
      if (k === ck(H)) return 'free';
      if (st.line.length > 1 && k === ck(st.line[st.line.length - 2])) { st.line.pop(); st.press.moved = true; this.drawLine(st); Sfx.back(); return 'ok'; }
      let add = null;
      if (this.adj(H, c) && this.open(q, H, c) && !st.line.some(p => ck(p) === k)) add = [c];
      else if (Math.abs(H[0] - c[0]) + Math.abs(H[1] - c[1]) === 2) {
        /* a corner cut by the finger: through the cell between, if that way is open */
        const mids = [[H[0], c[1]], [c[0], H[1]], [(H[0] + c[0]) / 2, (H[1] + c[1]) / 2]].filter(m => Number.isInteger(m[0]) && Number.isInteger(m[1]) && this.adj(H, m) && this.adj(m, c));
        const m = mids.find(m => this.open(q, H, m) && this.open(q, m, c) && !st.line.some(p => ck(p) === ck(m)) && !st.line.some(p => ck(p) === k));
        if (m) add = [m, c];
      }
      if (!add) return 'free';
      add.forEach(p => st.line.push(p)); st.press.moved = true; this.drawLine(st); Sfx.count(Math.min(9, st.line.length));
      if (ck(st.line[st.line.length - 1]) === ck(q.goal)) { st.picked = true; st.active = false; st.res = this.judge(q, st.line); Session.submit(st, st.res.ok ? 'ok' : st.res.why); }
      return 'ok';
    },
    onGesture(st, name, p) {
      if (st.picked || !st.board || p.id !== 'board') return false;
      const m = /^c(\d+)_(\d+)$/.exec(p.at || ''); if (!m) return false;
      const c = [+m[1], +m[2]];
      if (name === 'pass') return this.onPass(st, c);
      if (name === 'pick') {
        /* the finger is lifted: a tap on the car (nothing drawn this time) clears the line */
        const pr = st.press; st.press = null; st.active = false; st.fresh = false;
        if (pr && !pr.moved && pr.at === ck(st.q.start) && ck(c) === ck(st.q.start) && st.line.length > 1) { st.line = []; this.drawLine(st); K.pop(st, st.car); Sfx.back(); return 'ok'; }
        return 'free';
      }
      return false;
    },
    LINE: { puddle: '踩到水坑啦', door: '门还锁着呢', bear: '吵醒小熊啦', bone: '骨头没拿到哦', short: '骨头没拿到哦' },
    GOLD: { puddle: '走这边，绕过水坑', door: '走这边，拿钥匙', bear: '走这边，绕过小熊', bone: '走这边，拿骨头', short: '走这边，拿骨头' },
    async feedback(st, ans) { W5U.say(st, this.LINE[ans] || this.LINE.bone); await st.scope.wait(T(600)); },
    /* the car (or 阿奇) drives a line, stopping at `stop` */
    async drive(st, line, stop) {
      const my = st, per = Math.max(45, Math.min(110, 800 / Math.max(1, line.length)));
      for (let i = 0; i < line.length; i++) {
        if (!Session.alive(my)) return;
        const from = this.cellC(st, st.carAt || line[0]); this.moveCar(st, line[i]); const to = this.cellC(st, line[i]);
        if (!ff(st) && i) st.car.animate([{ transform: 'translate(' + (from.x - to.x) + 'px,' + (from.y - to.y) + 'px)' }, { transform: 'none' }], { duration: T(per), easing: 'linear' });
        await st.scope.wait(T(per));
        if (stop && ck(line[i]) === ck(stop)) return;
      }
    },
    elAt(st, c) { const k = ck(c), t = st.things.find(x => ck(x.c) === k); return t ? t.el : null; },
    /* 1. his line driven to where it goes wrong, ringed blue; 2. the gold way drawn, the car drives it to the kitten (gold) */
    async explain(st, ans) {
      const my = st, q = st.q, r = this.judge(q, st.line);
      const stopAt = r.why === 'bone' || r.why === 'short' ? null : r.at;
      await this.drive(st, st.line, stopAt); if (!Session.alive(my)) return;
      let mark = this.elAt(st, r.at);
      if (!mark) { mark = thing(st, 6, 'item'); const c = this.cellC(st, r.at), g = this.geo(st); place(mark, Math.round(c.x - g.u / 2 + 6), Math.round(c.y - g.rh / 2 + 6), g.u - 12, g.rh - 12); }
      const rings = W5U.blue(st, mark);
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      const right = q.right.map(k => k.split(',').map(Number));
      this.drawLine(st, right); Sfx.reveal();
      if (!ff(st)) st.lineEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T(350) });
      this.moveCar(st, q.start);
      const said = W5U.sum(st, this.GOLD[r.why] || this.GOLD.bone);
      await this.drive(st, right); if (!Session.alive(my)) return;
      await said; if (!Session.alive(my)) return;
      W5U.gold(st, st.goalEl, 8); K.hop(st, st.goalEl, 16);
      await st.scope.wait(T(300));
    },
    rightEls(st) { return [st.goalEl]; },
    async reveal(st) {
      const my = st; Sfx.reveal();
      await this.drive(st, st.line); if (!Session.alive(my)) return;
      W5U.gold(st, st.goalEl, 8); K.hop(st, st.goalEl, 16); this.cheerAll(st);
      st.summary = '接到小猫啦'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* tests: the right way cell by cell ('wrong': the shortest way, which misses a bone / steps in a puddle / opens the door
       without the key); a line that is not on the way is taken back first */
    next(st, strat) {
      if (st.picked || !st.board) return null;
      const want = (strat === 'wrong' ? st.q.wrongPath : st.q.right).map(k => k.split(',').map(Number)), L = st.line;
      let i = 0; while (i < L.length && i < want.length && ck(L[i]) === ck(want[i])) i++;
      const c = i < L.length ? (L.length > 1 ? L[L.length - 2] : null) : want[L.length];
      if (!c) return null;
      const p = this.cellC(st, c);
      return { g: 'pass', p: { id: 'board', at: 'c' + c[0] + '_' + c[1] }, x: p.x, y: p.y };
    },
    /* a real finger: the cells of the right way in screen points (for a pointer test) */
    realPath(st) { return st.q.right.map(k => { const c = this.cellC(st, k.split(',').map(Number)); return Stage.toScreen(c.x, c.y); }); },
    gestureHint(st) { const q = st.q, n = this.nbOf(q)(q.start)[0]; if (!n) return; const a = this.cellC(st, q.start), b = this.cellC(st, n); Hand.busy++; Hand.drag(st.scope, a.x, a.y, b.x, b.y, 600).then(() => { Hand.done(); Hand.hide(st.scope); }); },
    workEls(st) { return st.car ? [st.car] : []; },
    snap(st) { return { line: (st.line || []).map(ck).join(' ') }; },
    lines() { return uniq([this.intro, '路上捡骨头！', '捡骨头，', '不踩水坑！', '两根骨头都要捡！', '先拿钥匙，', '再开门！', '别吵醒小熊！', '接到小猫啦'].concat(Object.values(this.LINE), Object.values(this.GOLD), this.praise)); },
  };
})();
/* ================================================================ 变形金刚·积木厂 (trans5, the 5th island, from level 2): Z5 听口令装
   机器人 · Z6 车变机器人，零件一样吗 · Z7 帮大黄蜂改作业 · Z8 卡车开出去 (reasoning). docs/W5-DESIGN.md §16.4. One function,
   no top-level names; each rule is W5R.<id> (registered in games.js). The 积木厂 package. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const thing = (st, z, cls) => { const d = el('div', cls || 'item', Stage.el); d.style.position = 'absolute'; d.style.zIndex = z || 5; place(d, 0, 0, 10, 10); st.els.push(d); return d; };
  const mid = e => { const b = box(e); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
  const ff = st => st.explaining && st.ff;
  /* a line inside an explanation (a tap cuts it, and after a tap it is not said) */
  const say = (st, t) => (ff(st) ? Promise.resolve('ff') : W5U.note(st, t));
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine) */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));
  /* the feedback line, heard to its end before the explanation starts */
  const fbSay = async (st, line) => { W5U.say(st, line); await st.scope.wait(T(600)); await st.scope.guard(Voice.afterSay(60)); };
  const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const DIRW = { up: '上面', down: '下面', left: '左边', right: '右边' };

  /* ================================================================ Z5 装！ 听口令装机器人 (assem5)
     An assembly board of empty cells (>= 96; L1-L2 4 x 4, from L3 5 x 5) with the red body block in the middle; a tray of
     parts (yellow, blue, green block, an orange triangle = antenna, a black wheel: every one different by colour or shape).
     擎天柱 says one order at a time; after every part put on the board (right or not - nothing tells him) he says the next.
     The orders said stay on the task card as small pictures (the part and the part it goes by). Drag a part into a cell
     (or tap it, then the cell); tap a placed part and it goes back; then "装好了".
       L1 2 orders, only above / below, always by the red block · L2 3 orders, above / below / left / right (the screen's),
       by the red block or the part just put · L3 4 orders, each by the part put before (the robot grows a piece at a time)
       L4 4 orders, one "in the middle" ("绿块，" "红块和蓝块中间！") or by two parts ("绿块，" "放在蓝块下面，" "黄块右边！")
       L5 a manual: three little pictures (a part next to another), only "照着说明书装！"
     Right: every order holds for the parts where they really are (next to = the next cell that way). A random board is
     right well under 1 time in 1000. Wrong: the first part whose order does not hold ringed blue ("黄块在红块左边"); the
     order's picture lights, an arrow grows from the part it goes by, the part slides into the gold cell ("上面在这里"),
     the rest too; the robot ringed gold ("机器人装好了"). */
  const PN = { r: '红块', y: '黄块', b: '蓝块', g: '绿块', t: '三角', w: '轮子' };
  const PCOL = { r: '#E8414B', y: '#FFC93C', b: '#4FB3FF', g: '#5CC46E', t: '#FF9F43', w: '#3A3F4A' };
  function partSvg(k, px) {
    const s = svg('svg', { viewBox: '0 0 100 100', width: px, height: px }); s.style.pointerEvents = 'none'; s.style.overflow = 'visible'; s.style.display = 'block';
    const a = { stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' };
    if (k === 't') svg('polygon', Object.assign({ points: '50,10 90,88 10,88', fill: PCOL.t }, a), s);
    else if (k === 'w') { svg('circle', Object.assign({ cx: 50, cy: 50, r: 40, fill: PCOL.w }, a), s); svg('circle', { cx: 50, cy: 50, r: 15, fill: '#C9D3E0', stroke: INK, 'stroke-width': 4 }, s); }
    else { svg('rect', Object.assign({ x: 8, y: 16, width: 84, height: 76, rx: 10, fill: PCOL[k] }, a), s); [30, 70].forEach(x => svg('rect', { x: x - 11, y: 6, width: 22, height: 12, rx: 4, fill: PCOL[k], stroke: INK, 'stroke-width': 4 }, s)); if (k === 'r') { svg('circle', { cx: 36, cy: 48, r: 7, fill: '#fff', stroke: INK, 'stroke-width': 3 }, s); svg('circle', { cx: 64, cy: 48, r: 7, fill: '#fff', stroke: INK, 'stroke-width': 3 }, s); svg('path', { d: 'M36 70H64', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round' }, s); } }
    return s;
  }
  /* where an order puts its part, from where the parts it goes by are */
  const targetOf = (o, at) => {
    const A = at[o.ref]; if (!A) return null;
    if (o.rel === 'mid') { const B = at[o.ref2]; if (!B) return null; const x = (A[0] + B[0]) / 2, y = (A[1] + B[1]) / 2; return Number.isInteger(x) && Number.isInteger(y) && Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) === 2 && (A[0] === B[0] || A[1] === B[1]) ? [x, y] : null; }
    const t = [A[0] + DIR[o.rel][0], A[1] + DIR[o.rel][1]];
    if (o.rel2) { const B = at[o.ref2]; if (!B || B[0] + DIR[o.rel2][0] !== t[0] || B[1] + DIR[o.rel2][1] !== t[1]) return null; }
    return t;
  };
  const holds = (o, at) => { const t = targetOf(o, at), p = at[o.p]; return !!(t && p && t[0] === p[0] && t[1] === p[1]); };
  /* the words of an order: [the part, (how)] */
  const orderLines = o => o.rel === 'mid' ? [PN[o.p] + '，', PN[o.ref] + '和' + PN[o.ref2] + '中间！'] : o.rel2 ? [PN[o.p] + '，', '放在' + PN[o.ref] + DIRW[o.rel] + '，', PN[o.ref2] + DIRW[o.rel2] + '！'] : [PN[o.p] + '，', '放在' + PN[o.ref] + DIRW[o.rel] + '！'];

  W5R.Z5 = {
    kind0: 'assem5', verb: '装！', intro: '跟着口令装！', praise: ['装得一点不差！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, n = d <= 2 ? 4 : 5, N = [0, 2, 3, 4, 4, 3][d];
      for (let t = 0; t < 400; t++) {
        const body = n === 5 ? [2, 2] : rng.pick([[1, 1], [2, 1], [1, 2], [2, 2]]), at = { r: body }, orders = [];
        const parts = rng.shuffle(['y', 'b', 'g', 't', 'w']).slice(0, N);
        let ok = true;
        for (let i = 0; i < N && ok; i++) {
          const p = parts[i], placed = Object.keys(at), prev = i ? parts[i - 1] : 'r';
          const refs = d === 1 ? ['r'] : d === 3 ? [prev] : d === 2 ? ['r', prev] : placed, rels = d === 1 ? ['up', 'down'] : ['up', 'down', 'left', 'right'];
          const cands = [];
          refs.forEach(ref => rels.forEach(rel => { const c = [at[ref][0] + DIR[rel][0], at[ref][1] + DIR[rel][1]]; if (c[0] >= 0 && c[1] >= 0 && c[0] < n && c[1] < n && !Object.values(at).some(q => q[0] === c[0] && q[1] === c[1])) cands.push({ p, ref, rel, c }); }));
          /* L4: the last order in the middle of two parts or by two parts, when the board allows it */
          if (d === 4 && i === N - 1) {
            const two = [];
            for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
              if (Object.values(at).some(q => q[0] === x && q[1] === y)) continue;
              const by = (dx, dy) => placed.find(k => at[k][0] === x + dx && at[k][1] === y + dy);
              [[1, 0], [0, 1]].forEach(([dx, dy]) => { const A = by(-dx, -dy), B = by(dx, dy); if (A && B) two.push({ p, rel: 'mid', ref: A, ref2: B, c: [x, y] }); });
              [['up', 'left'], ['up', 'right'], ['down', 'left'], ['down', 'right']].forEach(([r1, r2]) => { const A = by(-DIR[r1][0], -DIR[r1][1]), B = by(-DIR[r2][0], -DIR[r2][1]); if (A && B && A !== B) two.push({ p, rel: r1, ref: A, rel2: r2, ref2: B, c: [x, y] }); });
            }
            if (!two.length) { ok = false; break; }
            const c = rng.pick(two); orders.push(c); at[p] = c.c; continue;
          }
          if (!cands.length) { ok = false; break; }
          const c = rng.pick(cands); orders.push(c); at[p] = c.c;
        }
        if (!ok) continue;
        const tray = rng.shuffle(parts.slice());
        return { k: [d, body.join(''), orders.map(x => x.p + x.rel + x.ref + (x.ref2 || '') + (x.rel2 || '')).join(' ')], d, n, body, orders: orders.map(x => { const y = Object.assign({}, x); delete y.c; return y; }), goal: at, tray, manual: d === 5, answer: 'ok' };
      }
      return null;
    },
    audit(q) { const cells = q.n * q.n - 1; let c = 1; for (let i = 0; i < q.orders.length; i++) c /= (cells - i); return [{ build: true, chance: c }]; },
    decor(G) { W2X.decorDone(G, this.chars); },
    geo(st) {
      const q = st.q, L = K.L(), u = 96, w = q.n * u;
      if (L) return { L, u, bx: Math.round(420 - w / 2), by: Math.round(376 - w / 2), tx: 700, ty: 168, tc: 2, ts: 104, tg: 14 };
      return { L, u, bx: Math.round(352 - w / 2), by: Math.round(472 - w / 2), tx: Math.round(352 - (q.tray.length * 104 + (q.tray.length - 1) * 14) / 2), ty: 736, tc: 4, ts: 104, tg: 14 };
    },
    cellBox(st, c) { const g = this.geo(st); return { x: g.bx + c[0] * g.u, y: g.by + c[1] * g.u, w: g.u, h: g.u }; },
    slotBox(st, i) { const g = this.geo(st), r = Math.floor(i / g.tc), c = i % g.tc; return { x: g.tx + c * (g.ts + g.tg), y: g.ty + r * (g.ts + g.tg), w: g.ts, h: g.ts }; },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.boardEl) return;
      place(st.boardEl, g.bx - 14, g.by - 14, q.n * g.u + 28, q.n * g.u + 28);
      Object.keys(st.cells).forEach(id => { const [x, y] = id.slice(1).split('_').map(Number), b = this.cellBox(st, [x, y]); place(st.cells[id], b.x, b.y, b.w, b.h); });
      const bb = this.cellBox(st, q.body); place(st.bodyEl, bb.x + 4, bb.y + 4, bb.w - 8, bb.h - 8);
      q.tray.forEach((p, i) => { const e = st.partEls[p], c = st.at[p]; const b = c ? this.cellBox(st, c) : this.slotBox(st, i); place(e, b.x + 4, b.y + 4, b.w - 8, b.h - 8);
        Object.assign(e.style, c ? { background: 'transparent', borderColor: 'transparent', boxShadow: 'none' } : { background: '', borderColor: '', boxShadow: '' }); const sv = e.firstChild; if (sv) { sv.setAttribute('width', c ? 84 : 72); sv.setAttribute('height', c ? 84 : 72); } });
    },
    async present(st) {
      const q = st.q;
      st.at = {}; st.sel = null; st.said = 0; st.placedN = 0;
      st.boardEl = thing(st, 3, 'item'); Object.assign(st.boardEl.style, { borderRadius: '22px', background: 'rgba(225,232,242,.93)', boxShadow: '0 0 0 4px ' + INK });
      st.cells = {};
      for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) {
        if (x === q.body[0] && y === q.body[1]) continue;
        const id = 'c' + x + '_' + y, e = thing(st, 4, 'item'); Object.assign(e.style, { borderRadius: '12px', boxShadow: 'inset 0 0 0 3px rgba(43,33,24,.18)', background: 'rgba(255,255,255,.55)' });
        K.reg(st, id, e, {}); st.cells[id] = e;
      }
      st.bodyEl = thing(st, 6, 'item'); st.bodyEl.appendChild(partSvg('r', '100%')); st.bodyEl.firstChild.setAttribute('width', '100%'); st.bodyEl.firstChild.setAttribute('height', '100%');
      st.partEls = {};
      q.tray.forEach((p, i) => {
        const e = W3X.card(st, null, 8); const s = partSvg(p, 72); e.appendChild(s);
        K.reg(st, 'p' + p, e, { drag: true, drops: () => this.drops(st, p) });
        st.partEls[p] = e;
      });
      st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      K.pop(st, st.boardEl); K.pop(st, st.bodyEl, 100); q.tray.forEach((p, i) => K.pop(st, st.partEls[p], 200 + 60 * i));
      if (q.manual) {
        K.task(st, [[{ node: (() => { const d = el('span', ''); Object.assign(d.style, { display: 'flex', gap: '10px' }); q.orders.forEach(o => d.appendChild(this.manualPic(o))); return d; })() }]]);
        K.say(st, '照着说明书装！');
      } else this.nextOrder(st);
    },
    /* L5's manual: a little picture of a part next to the part it goes by */
    manualPic(o) {
      const e = el('span', ''); Object.assign(e.style, { display: 'block', width: '64px', height: '64px', position: 'relative', background: '#fff', borderRadius: '10px', boxShadow: '0 0 0 3px ' + INK });
      const d = DIR[o.rel], put = (k, x, y) => { const s = partSvg(k, 26); Object.assign(s.style, { position: 'absolute', left: x + 'px', top: y + 'px' }); e.appendChild(s); };
      put(o.ref, 19 - d[0] * 14, 19 - d[1] * 14); put(o.p, 19 + d[0] * 14, 19 + d[1] * 14);
      return e;
    },
    /* the orders said so far: each a little box with the part and the part(s) it goes by (no arrows - those are L5's) */
    ordersNode(list) {
      const d = el('span', ''); Object.assign(d.style, { display: 'flex', gap: '8px' });
      list.forEach(o => { const b = el('span', '', d); Object.assign(b.style, { display: 'flex', gap: '2px', padding: '3px 6px', background: '#fff', borderRadius: '10px', boxShadow: '0 0 0 3px ' + INK }); [o.p, o.ref].concat(o.ref2 ? [o.ref2] : []).forEach(k => b.appendChild(partSvg(k, 34))); });
      return d;
    },
    /* say the next order (and draw it on the task card) */
    nextOrder(st) {
      const q = st.q; if (q.manual || st.said >= q.orders.length) return;
      const o = q.orders[st.said++], L = orderLines(o);
      $$('.task', Stage.el).forEach(t => t.remove());
      K.task(st, [[{ node: this.ordersNode(q.orders.slice(0, st.said)) }]]);
      st.lead = L.slice(0, -1); st.lead.forEach(l => Voice.say(l, { tag: 'prompt' })); K.say(st, L[L.length - 1]);
    },
    drops(st, p) { return Object.keys(st.cells).map(id => ({ id, rect: () => box(st.cells[id]) })); },
    occupied(st, c) { if (c[0] === st.q.body[0] && c[1] === st.q.body[1]) return 'r'; return Object.keys(st.at).find(k => st.at[k] && st.at[k][0] === c[0] && st.at[k][1] === c[1]) || null; },
    put(st, p, c) {
      const was = !st.at[p], other = this.occupied(st, c);
      if (other === 'r') return 'free';
      if (other && other !== p) st.at[other] = null;
      st.at[p] = c; st.partEls[p].style.transform = '';
      if (st.sel != null) this.select(st, st.sel);
      this.place(st); K.pop(st, st.partEls[p]); Sfx.place();
      if (was) { st.placedN++; if (st.placedN >= st.said) this.nextOrder(st); }
      st.doneBtn.classList.toggle('ready', st.q.tray.every(k => st.at[k]));
      return 'ok';
    },
    select(st, p) { st.sel = st.sel === p ? null : p; st.q.tray.forEach(k => { const e = st.partEls[k]; e.style.outline = k === st.sel ? '7px solid ' + GOLD : ''; e.style.outlineOffset = '3px'; }); },
    onGesture(st, name, p) {
      if (st.picked || !st.cells) return false;
      const id = p.id || ''; let m;
      if (name === 'drop' && (m = /^p([a-z])$/.exec(id))) { const c = /^c(\d)_(\d)$/.exec(p.to || ''); st.partEls[m[1]].style.transform = ''; if (!c) { this.place(st); return 'free'; } return this.put(st, m[1], [+c[1], +c[2]]); }
      if (name !== 'tap') return false;
      if ((m = /^p([a-z])$/.exec(id))) { const k = m[1]; if (st.at[k]) { st.at[k] = null; this.place(st); Sfx.back(); st.doneBtn.classList.remove('ready'); return 'ok'; } this.select(st, k); return 'ok'; }
      if ((m = /^c(\d)_(\d)$/.exec(id))) { if (st.sel == null) return 'free'; return this.put(st, st.sel, [+m[1], +m[2]]); }
      if (id === 'done') {
        if (!st.q.tray.every(k => st.at[k]) || (!st.q.manual && st.said < st.q.orders.length)) { K.wiggle(st, st.doneBtn); return 'free'; }
        st.picked = true; if (st.sel != null) this.select(st, st.sel);
        const at = Object.assign({ r: st.q.body }, st.at), bad = st.q.orders.findIndex(o => !holds(o, at));
        Session.submit(st, bad < 0 ? 'ok' : 'o' + bad);
        return 'ok';
      }
      return false;
    },
    /* where his part is: "黄块在红块左边" / "黄块没挨着红块" / "黄块还没装" */
    whereLine(st, o) {
      const at = Object.assign({ r: st.q.body }, st.at), P = at[o.p], R = at[o.ref];
      if (!P) return PN[o.p] + '还没装';
      const k = Object.keys(DIR).find(r => P[0] === R[0] + DIR[r][0] && P[1] === R[1] + DIR[r][1]);
      return k ? PN[o.p] + '在' + PN[o.ref] + DIRW[k] : PN[o.p] + '没挨着' + PN[o.ref];
    },
    badOrder(st, ans) { return st.q.orders[+String(ans).slice(1)] || st.q.orders[0]; },
    async feedback(st, ans) { const o = this.badOrder(st, ans); if (st.at[o.p]) K.wiggle(st, st.partEls[o.p]); await fbSay(st, this.whereLine(st, o)); },
    /* 1. the part of the first order that does not hold ringed blue; 2. an arrow from the part it goes by, the part slides
       into the gold cell ("上面在这里"), the others too; 3. the robot ringed gold: "机器人装好了" */
    async explain(st, ans) {
      const my = st, q = st.q, o = this.badOrder(st, ans), e = st.partEls[o.p];
      const rings = W5U.blue(st, e);
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      /* the arrow from the part it goes by, toward where it should be */
      const goal = q.goal[o.p], R = o.rel === 'mid' ? null : this.cellBox(st, st.at[o.ref] || q.goal[o.ref] || q.body), G1 = this.cellBox(st, goal);
      const s = K.lines(st);
      if (R) { const a = { x: R.x + R.w / 2, y: R.y + R.h / 2 }, b = { x: G1.x + G1.w / 2, y: G1.y + G1.h / 2 }; svg('path', { d: 'M' + a.x + ' ' + a.y + 'L' + b.x + ' ' + b.y, stroke: GOLD, 'stroke-width': 10, 'stroke-linecap': 'round' }, s); svg('path', { d: W5U.arrowHead(a, b, 22), fill: GOLD, stroke: INK, 'stroke-width': 2 }, s); }
      const gc = thing(st, 5, 'item'); place(gc, G1.x + 2, G1.y + 2, G1.w - 4, G1.h - 4); Object.assign(gc.style, { borderRadius: '14px', background: 'rgba(255,201,60,.55)', boxShadow: 'inset 0 0 0 5px ' + GOLD });
      await st.scope.wait(T(250)); if (!Session.alive(my)) return;
      const slide = p => { const e2 = st.partEls[p], from = box(e2); st.at[p] = q.goal[p]; this.place(st); const to = box(e2); if (!ff(st)) e2.animate([{ transform: 'translate(' + (from.x - to.x) + 'px,' + (from.y - to.y) + 'px)' }, { transform: 'none' }], { duration: T(380), easing: EASE.glide }); };
      /* everything not where it belongs goes back first, then each slides in */
      q.tray.forEach(p => { const c = st.at[p], gp = q.goal[p]; if (c && (c[0] !== gp[0] || c[1] !== gp[1])) st.at[p] = null; });
      this.place(st);
      slide(o.p); Sfx.place();
      await say(st, o.rel === 'mid' ? '中间在这里' : DIRW[o.rel] + '在这里'); if (!Session.alive(my)) return;
      q.tray.forEach(p => { if (!st.at[p]) slide(p); });
      await st.scope.wait(T(300)); if (!Session.alive(my)) return;
      W5U.ring(st, [st.bodyEl].concat(q.tray.map(p => st.partEls[p])), GOLD, 12);
      await W5U.sum(st, '机器人装好了');
      await st.scope.wait(T(100));
    },
    rightEls(st) { return [st.bodyEl].concat(st.q.tray.map(p => st.partEls[p])); },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      q.tray.forEach(p => K.hop(st, st.partEls[p], 12));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.ring(st, [st.bodyEl].concat(q.tray.map(p => st.partEls[p])), GOLD, 12); this.cheerAll(st);
      st.summary = '机器人装好了'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* tests: the parts in the orders' order (a part in a wrong cell is tapped back first), then 装好了; 'wrong': the first
       part a cell off */
    next(st, strat) {
      if (st.picked || !st.cells) return null;
      const q = st.q;
      let goal = q.goal;
      if (strat === 'wrong') {
        const o = q.orders[0], g0 = q.goal[o.p], alt = [[g0[0] + 1, g0[1]], [g0[0] - 1, g0[1]], [g0[0], g0[1] + 1], [g0[0], g0[1] - 1]].find(c => st.cells['c' + c[0] + '_' + c[1]] && !Object.values(q.goal).some(x => x[0] === c[0] && x[1] === c[1]));
        if (alt) goal = Object.assign({}, q.goal, { [o.p]: alt });
      }
      for (const o of q.orders) {
        const c = st.at[o.p], gp = goal[o.p];
        if (c && (c[0] !== gp[0] || c[1] !== gp[1])) return { g: 'tap', p: { id: 'p' + o.p } };
        if (!c) { const b = this.cellBox(st, gp); return { g: 'drop', p: { id: 'p' + o.p, to: 'c' + gp[0] + '_' + gp[1] }, to: { x: b.x + b.w / 2, y: b.y + b.h / 2 } }; }
      }
      return { g: 'tap', p: { id: 'done' } };
    },
    gestureHint(st) { const p = st.q.tray.find(k => !st.at[k]); if (!p) return; const a = mid(st.partEls[p]), b = mid(st.boardEl); Hand.busy++; Hand.drag(st.scope, a.x, a.y, a.x + (b.x - a.x) * 0.5, a.y + (b.y - a.y) * 0.5, 600).then(() => { Hand.done(); Hand.hide(st.scope); }); },
    workEls(st) { return (st.q && st.partEls) ? st.q.tray.map(p => st.partEls[p]) : []; },
    snap(st) { return { at: JSON.stringify(st.at || {}), said: st.said }; },
    lines() {
      const out = [this.intro, '照着说明书装！', '机器人装好了', '中间在这里'].concat(this.praise), ks = Object.keys(PN);
      Object.values(DIRW).forEach(w => out.push(w + '在这里'));
      ks.forEach(p => { if (p === 'r') return; out.push(PN[p] + '，', PN[p] + '还没装'); ks.forEach(r => { if (r === p) return; out.push(PN[p] + '没挨着' + PN[r]); Object.values(DIRW).forEach(w => out.push('放在' + PN[r] + w + '！', '放在' + PN[r] + w + '，', PN[r] + w + '！', PN[p] + '在' + PN[r] + w)); ks.forEach(r2 => { if (r2 !== r && r2 !== p) out.push(PN[r] + '和' + PN[r2] + '中间！'); }); }); });
      return uniq(out);
    },
  };
  /* ================================================================ Z6 变！ 车变机器人：零件一样吗 (morph5)
     大黄蜂's car built of block shapes (rectangles, squares, triangles, round wheels, half circles; every block outlined).
     First tap the car (or 大黄蜂): "点他变形！" - its blocks flash up in a burst of light (a getting-ready step, not the math,
     not a hint); then the five robots can be tapped: "变成哪个机器人？" - the one built of exactly the same blocks.
       L1 the car 3 blocks, all different colours; the others: a block in another colour, one block missing, one too many,
          a block of another shape (the same colour)
       L2 4-5 blocks, some the same colour (two black wheels); others also a wheel more or less
       L3 a block turned in the robot is still the same block; others also a block of another size
       L4 6 blocks; one other robot has one long block where the car has two squares: as big, but not the same blocks
       L5 two cars together: 大黄蜂's car and 擎天柱's truck - "两辆车合体！" "合成哪个大机器人？"
     The right robot's place from a bag. Wrong: his robot ringed blue; the car's blocks in a row, his robot's blocks in a
     row under them, pairs joined; the one with no partner ringed blue ("这块车上没有" / "少了一个轮子" / "这块大了" ...);
     the right robot ringed gold, its blocks all paired ("零件一模一样"). */
  const BCOL = { Y: '#FFC93C', K: '#3A3F4A', B: '#4FB3FF', R: '#E8414B', G: '#B7C0CC', N: '#5CC46E' };
  /* a block's size in units (big = 1.4 times): w, h */
  const bsz = b => { const k = b.s === 2 ? 1.4 : 1; return b.k === 'rect' ? [2 * k, 1 * k] : b.k === 'semi' ? [1 * k, 0.5 * k] : b.k === 'tri' ? [1 * k, 0.9 * k] : b.k === 'circle' ? [0.9 * k, 0.9 * k] : [1 * k, 1 * k]; };
  const bsig = b => b.k + b.c + b.s;
  const msig = list => list.map(bsig).sort().join('|');
  /* one block drawn with its middle at (x, y), u px a unit, turned rot degrees */
  function blockDraw(g, b, x, y, u, rot) {
    const [w, h] = bsz(b), W = w * u, H = h * u, a = { fill: BCOL[b.c], stroke: INK, 'stroke-width': Math.max(2.5, u * 0.08), 'stroke-linejoin': 'round' }, G1 = svg('g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (rot || 0) + ')' }, g);
    if (b.k === 'circle') { svg('circle', Object.assign({ cx: 0, cy: 0, r: W / 2 }, a), G1); if (b.c === 'K') svg('circle', { cx: 0, cy: 0, r: W / 5, fill: '#C9D3E0', stroke: INK, 'stroke-width': 2 }, G1); }
    else if (b.k === 'semi') svg('path', Object.assign({ d: 'M' + (-W / 2) + ' ' + (H / 2) + 'A' + (W / 2) + ' ' + (W / 2) + ' 0 0 1 ' + (W / 2) + ' ' + (H / 2) + 'Z' }, a), G1);
    else if (b.k === 'tri') svg('polygon', Object.assign({ points: [[0, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].map(p => p.join(',')).join(' ') }, a), G1);
    else svg('rect', Object.assign({ x: -W / 2, y: -H / 2, width: W, height: H, rx: Math.min(W, H) * 0.12 }, a), G1);
    return G1;
  }
  /* the car seen from the side: the body, wheels under it, a triangle as its nose, the rest on top */
  function carLayout(list) {
    const L = list.map((b, i) => ({ b, i })), out = [], take = f => { const j = L.findIndex(f); return j < 0 ? null : L.splice(j, 1)[0]; };
    const body = take(x => x.b.k === 'rect') || L.shift(), [bw, bh] = bsz(body.b);
    out.push({ i: body.i, x: 0, y: 0, rot: 0 });
    const wheels = []; let w; while ((w = take(x => x.b.k === 'circle'))) wheels.push(w);
    wheels.forEach((x, k) => out.push({ i: x.i, x: wheels.length === 1 ? 0 : -bw * 0.32 + k * (bw * 0.64 / (wheels.length - 1)), y: bh / 2 + bsz(x.b)[1] * 0.3, rot: 0 }));
    const nose = take(x => x.b.k === 'tri');
    if (nose) out.push({ i: nose.i, x: bw / 2 + bsz(nose.b)[1] / 2, y: 0, rot: 90 });
    let left = -bw / 2 + 0.05, top = -bh / 2;
    L.forEach(x => { const [w2, h2] = bsz(x.b); if (left + w2 > bw / 2 + 0.3) { left = -bw / 2 + 0.05; top -= h2; } out.push({ i: x.i, x: left + w2 / 2, y: top - h2 / 2, rot: 0 }); left += w2; });
    return out;
  }
  /* a robot: the biggest block standing as the body, a head on it, the wheels as feet, the rest as arms (turned) */
  function robotLayout(list, seed) {
    const L = list.map((b, i) => ({ b, i, a: bsz(b)[0] * bsz(b)[1] })), out = [];
    L.sort((p, q) => q.a - p.a || p.i - q.i);
    const torso = L.shift(), tr = torso.b.k === 'rect' ? 90 : 0, [tw0, th0] = bsz(torso.b), tw = tr ? th0 : tw0, th = tr ? tw0 : th0;
    out.push({ i: torso.i, x: 0, y: 0, rot: tr });
    let hi = L.findIndex(x => ['semi', 'sq', 'tri'].includes(x.b.k)); if (hi < 0) hi = L.findIndex(x => x.b.k !== 'circle');
    if (hi >= 0) { const h = L.splice(hi, 1)[0]; out.push({ i: h.i, x: 0, y: -th / 2 - bsz(h.b)[1] / 2, rot: 0 }); }
    const feet = L.filter(x => x.b.k === 'circle'), rest = L.filter(x => x.b.k !== 'circle');
    feet.forEach((x, k) => out.push({ i: x.i, x: (k - (feet.length - 1) / 2) * 0.95, y: th / 2 + bsz(x.b)[1] / 2, rot: 0 }));
    const side = [0, 0];
    rest.forEach((x, k) => {
      const s = (k + seed) % 2, rot = x.b.k === 'rect' ? 90 : x.b.k === 'tri' ? (s ? 90 : -90) + ((seed >> 1) % 2) * 180 : 0, [w0, h0] = bsz(x.b), turned = Math.abs(rot) % 180 === 90, w = turned ? h0 : w0, h = turned ? w0 : h0;
      out.push({ i: x.i, x: (s ? 1 : -1) * (tw / 2 + w / 2 + 0.06), y: -th / 2 + side[s] + h / 2, rot }); side[s] += h + 0.06;
    });
    return out;
  }
  /* blocks laid out, drawn to fit a W x H box */
  function drawLaid(list, lay, W, H, pad) {
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%' }); s.style.pointerEvents = 'none'; s.style.overflow = 'visible';
    const ext = lay.map(p => { const [w0, h0] = bsz(list[p.i]), t = Math.abs(p.rot) % 180 === 90, w = t ? h0 : w0, h = t ? w0 : h0; return [p.x - w / 2, p.y - h / 2, p.x + w / 2, p.y + h / 2]; });
    const x0 = Math.min(...ext.map(e => e[0])), y0 = Math.min(...ext.map(e => e[1])), x1 = Math.max(...ext.map(e => e[2])), y1 = Math.max(...ext.map(e => e[3])), u = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0));
    const ox = W / 2 - (x0 + x1) / 2 * u, oy = H / 2 - (y0 + y1) / 2 * u;
    lay.forEach(p => blockDraw(s, list[p.i], ox + p.x * u, oy + p.y * u, u, p.rot));
    return s;
  }
  /* 大黄蜂's car (yellow body) and 擎天柱's truck (big red body) */
  const BEE = (rng, d) => {
    if (d === 1) return [{ k: 'rect', c: 'Y', s: 1 }, { k: rng.pick(['semi', 'sq', 'tri']), c: rng.pick(['B', 'R']), s: 1 }, { k: 'circle', c: 'K', s: 1 }];
    if (d === 4) return [{ k: 'rect', c: 'Y', s: 1 }, { k: 'sq', c: 'B', s: 1 }, { k: 'sq', c: 'B', s: 1 }, { k: 'circle', c: 'K', s: 1 }, { k: 'circle', c: 'K', s: 1 }, { k: 'tri', c: 'R', s: 1 }];
    const car = [{ k: 'rect', c: 'Y', s: d === 3 ? 2 : 1 }, { k: rng.pick(['semi', 'sq']), c: 'B', s: d === 3 && rng.chance(0.5) ? 2 : 1 }, { k: 'circle', c: 'K', s: 1 }, { k: 'circle', c: 'K', s: 1 }];
    if (d !== 5 && rng.chance(0.6)) car.push({ k: 'tri', c: 'R', s: 1 });
    return car;
  };
  const TRUCK = rng => [{ k: 'rect', c: 'R', s: 2 }, { k: 'sq', c: 'B', s: 1 }, { k: 'circle', c: 'K', s: 1 }, { k: 'circle', c: 'K', s: 1 }].concat(rng.chance(0.5) ? [{ k: 'tri', c: 'G', s: 1 }] : []);
  W5R.Z6 = {
    kind0: 'morph5', verb: '变！', intro: '大黄蜂变形！', praise: ['零件看得真清！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      for (let t = 0; t < 300; t++) {
        const car = BEE(rng, d), car2 = d === 5 ? TRUCK(rng) : null, all = car.concat(car2 || []), right = msig(all);
        /* the four others, each changed one way */
        const kinds = ['color', 'missing', 'extra', 'shape'].concat(d >= 2 ? ['wheel'] : []).concat(d >= 3 ? ['size'] : []);
        const make = kind => {
          const L = all.map(b => Object.assign({}, b)), any = L.map((_, i) => i), solid = any.filter(i => L[i].k !== 'circle'), j = rng.pick(kind === 'shape' || kind === 'size' ? solid : any);
          if (kind === 'color') L[j].c = rng.pick(['Y', 'B', 'R', 'N', 'G'].filter(x => x !== L[j].c));
          else if (kind === 'missing') L.splice(j, 1);
          else if (kind === 'extra') L.push({ k: rng.pick(['tri', 'sq', 'semi']), c: rng.pick(['Y', 'B', 'R', 'N']), s: 1 });
          else if (kind === 'shape') L[j].k = rng.pick(['sq', 'tri', 'semi', 'rect'].filter(x => x !== L[j].k));
          else if (kind === 'wheel') { const w = L.findIndex(b => b.k === 'circle'); if (w < 0) return null; if (rng.chance(0.5)) L.splice(w, 1); else L.push(Object.assign({}, L[w])); }
          else if (kind === 'size') L[j].s = L[j].s === 2 ? 1 : 2;
          else if (kind === 'merge') { const a = L.findIndex(b => b.k === 'sq'), b2 = a < 0 ? -1 : L.findIndex((b, i) => i > a && b.k === 'sq' && b.c === L[a].c && b.s === L[a].s); if (b2 < 0) return null; const c = L[a].c; L.splice(b2, 1); L.splice(a, 1, { k: 'rect', c, s: 1 }); }
          return L.length ? L : null;
        };
        const bag = (d === 4 ? ['merge'] : []).concat(rng.shuffle(kinds.slice()), rng.shuffle(kinds.slice())), others = [], seen = new Set([right]);
        for (const k of bag) { if (others.length >= 4) break; const L = make(k); if (!L) continue; const s = msig(L); if (seen.has(s)) continue; seen.add(s); others.push({ list: L, kind: k }); }
        if (others.length < 4) continue;
        const ok = { list: all.map(b => Object.assign({}, b)), kind: 'ok' }, robots = W5U.deal(G, ok, others, 'z6r');
        robots.forEach(r => { r.seed = rng.int(0, 7); });
        return { k: [d, msig(car), car2 ? msig(car2) : '', others.map(x => msig(x.list)).join('/')], d, car, car2, robots, answer: robots.indexOf(ok) };
      }
      return null;
    },
    audit(q) { const s = msig(q.car.concat(q.car2 || [])); return [{ n: 5, at: q.answer, right: q.robots.filter(r => msig(r.list) === s).length }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo(st) {
      const L = K.L(), two = !!st.q.car2;
      return L ? { L, car: two ? [[196, 116, 300, 220], [528, 116, 300, 220]] : [[312, 112, 400, 240]], cy: 520, cw: 116, ch: 168, cg: 18 }
        : { L, car: two ? [[30, 236, 316, 230], [358, 236, 316, 230]] : [[132, 226, 440, 260]], cy: 640, cw: 120, ch: 176, cg: 12 };
    },
    place(st) {
      const g = this.geo(st);
      if (!st.carEls) return;
      st.carEls.forEach((e, i) => { const r = g.car[i]; place(e, r[0], r[1], r[2], r[3]); });
      if (st.cards) st.cards.forEach((c, i) => place(c, Math.round(Stage.W / 2 - (5 * g.cw + 4 * g.cg) / 2 + i * (g.cw + g.cg)), Math.round(g.cy - g.ch / 2), g.cw, g.ch));
      if (st.listEl) this.placeList(st);
    },
    async present(st) {
      const q = st.q;
      st.carEls = [q.car].concat(q.car2 ? [q.car2] : []).map((list, i) => {
        const e = W3X.card(st, null, 6); e.style.padding = '0';
        e.appendChild(drawLaid(list, carLayout(list), 300, 200, 18));
        K.reg(st, i ? 'car2' : 'car', e, {});
        return e;
      });
      /* the robots wait, pale, until the car has changed (then they are registered as card0 .. card4) */
      st.cards = q.robots.map(r => { const c = W3X.card(st, null, 6); c.appendChild(drawLaid(r.list, robotLayout(r.list, r.seed), 120, 160, 10)); c.style.opacity = '.45'; return c; });
      st.opts = q.robots.map((_, i) => i);
      this.place(st);
      st.carEls.forEach((e, i) => K.pop(st, e, 80 * i)); st.cards.forEach((c, i) => K.pop(st, c, 200 + 60 * i));
      K.task(st, [[{ node: (() => { const d = el('span', ''); Object.assign(d.style, { width: '96px', height: '56px', display: 'block' }); d.appendChild(drawLaid(q.car, carLayout(q.car), 96, 56, 4)); return d; })() }], ['q']]);
      if (q.car2) W3X.say2(st, '两辆车合体！', '点他变形！'); else K.say(st, '点他变形！');
    },
    onCharTap(st, id) { if (id === 'bumblebee' && !st.morphed && st.carEls) { gesture('tap', { id: 'car' }); return true; } return false; },
    /* the getting-ready step: the cars flash up in a burst of light, then the robots can be tapped */
    async morph(st) {
      const my = st, q = st.q; st.morphed = true; Sfx.whoosh && Sfx.whoosh(0.3);
      st.carEls.forEach(e => { if (!fast()) e.animate([{ transform: 'none', filter: 'none' }, { transform: 'translateY(-26px) scale(1.06)', filter: 'brightness(1.5) drop-shadow(0 0 18px #FFE45C)' }, { transform: 'none', filter: 'none' }], { duration: 700 }); const c = mid(e); Fx.burst(c.x, c.y, { n: 14, dist: 80 }); });
      st.cards.forEach((c, i) => { c.style.opacity = ''; K.reg(st, 'card' + i, c, {}); K.pop(st, c, 250 + 60 * i); });
      await st.scope.wait(T(450)); if (!Session.alive(my)) return;
      K.say(st, q.car2 ? '合成哪个大机器人？' : '变成哪个机器人？');
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const id = p.id || '';
      if (id === 'car' || id === 'car2') { if (st.morphed) { K.wiggle(st, st.carEls[id === 'car' ? 0 : 1]); return 'free'; } this.morph(st); return 'free'; }
      if (!st.morphed) return false;
      return W5U.tapCard(st, name, p);
    },
    /* his robot's blocks against the car's: which do not pair, and the line for it */
    pairs(st, ri) {
      const q = st.q, A = q.car.concat(q.car2 || []), B = q.robots[ri].list, pa = A.map(() => -1), used = B.map(() => false);
      A.forEach((a, i) => { const j = B.findIndex((b, k) => !used[k] && bsig(a) === bsig(b)); if (j >= 0) { pa[i] = j; used[j] = true; } });
      return { A, B, pa, ma: A.map((_, i) => i).filter(i => pa[i] < 0), mb: B.map((_, j) => j).filter(j => !used[j]) };
    },
    whyLine(P) {
      const { A, B, ma, mb } = P;
      if (ma.length && mb.length) { const a = A[ma[0]], b = B[mb[0]]; return a.k === b.k && a.c === b.c ? (b.s > a.s ? '这块大了' : '这块小了') : a.k === b.k ? '颜色不一样' : '这块车上没有'; }
      if (mb.length) return B[mb[0]].k === 'circle' ? '多了一个轮子' : '这块车上没有';
      return A[ma[0]].k === 'circle' ? '少了一个轮子' : '少了一块';
    },
    async feedback(st, ans) { K.wiggle(st, st.cards[ans]); await fbSay(st, '零件不一样哦'); },
    /* the block list: the car's blocks in a row, a robot's under them (a partner right under its partner, joined by a
       dashed line; one without a partner under one without a partner, or at the end) */
    showList(st, ri, gold) {
      if (st.listEl) st.listEl.remove();
      const P = this.pairs(st, ri), { A, B, pa, ma, mb } = P, col = {};
      pa.forEach((j, i) => { if (j >= 0) col[j] = i; });
      mb.forEach((j, k) => { col[j] = k < ma.length ? ma[k] : A.length + (k - ma.length); });
      const n = Math.max(A.length, ...Object.values(col).map(c => c + 1)), cw = 92, ch = 78, W = n * cw + 24, H = 2 * ch + 56, X = c => 12 + cw / 2 + c * cw, Y = [12 + ch / 2, 44 + ch * 1.5];
      const e = thing(st, 30, 'item'); Object.assign(e.style, { borderRadius: '22px', background: '#FFF8EC', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none' }); st.listEl = e; e._w = W; e._h = H;
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%' }, e); s.style.pointerEvents = 'none';
      pa.forEach((j, i) => { if (j >= 0) svg('path', { d: 'M' + X(i) + ' ' + (Y[0] + 30) + 'V' + (Y[1] - 30), stroke: gold ? '#E0A100' : INK, 'stroke-width': 5, 'stroke-dasharray': '5 6', 'stroke-linecap': 'round' }, s); });
      A.forEach((a, i) => blockDraw(s, a, X(i), Y[0], 28, 0));
      B.forEach((b, j) => blockDraw(s, b, X(col[j]), Y[1], 28, 0));
      e._A = A.map((_, i) => ({ x: X(i), y: Y[0] })); e._B = B.map((_, j) => ({ x: X(col[j]), y: Y[1] }));
      this.placeList(st); K.pop(st, e);
      return P;
    },
    placeList(st) {
      const e = st.listEl, g = this.geo(st), r = g.car[0], r2 = g.car[g.car.length - 1], cx = (r[0] + r2[0] + r2[2]) / 2, cy = r[1] + r[3] / 2, k = Math.min(1, (Stage.W - 32) / e._w);
      place(e, Math.round(cx - e._w * k / 2), Math.round(cy - e._h * k / 2), Math.round(e._w * k), Math.round(e._h * k)); e._k = k;
    },
    /* a ringable spot on the list (the block at p) */
    markAt(st, p) { const e = st.listEl, b = box(e), k = e._k || 1, m = thing(st, 31, 'item'); m.style.pointerEvents = 'none'; place(m, Math.round(b.x + (p.x - 40) * k), Math.round(b.y + (p.y - 34) * k), Math.round(80 * k), Math.round(68 * k)); return m; },
    /* 1. his robot blue (the feedback line ends); the two lists, the block without a partner blue + why;
       2. the right robot gold, its list all paired: "零件一模一样" */
    async explain(st, ans) {
      const my = st, q = st.q, r = W5U.blue(st, st.cards[ans]);
      await fbDone(st); if (!Session.alive(my)) return;
      const P = this.showList(st, ans, false);
      const marks = P.mb.map(j => this.markAt(st, st.listEl._B[j])).concat(P.ma.map(i => this.markAt(st, st.listEl._A[i]))).slice(0, 2);
      const r2 = W5U.blue(st, marks);
      await say(st, this.whyLine(P)); if (!Session.alive(my)) return;
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.hide(r.concat(r2)); marks.forEach(m => m.remove());
      this.showList(st, q.answer, true);
      W5U.gold(st, st.cards[q.answer]); K.hop(st, st.cards[q.answer], 12);
      await W5U.sum(st, '零件一模一样');
      await st.scope.wait(T(150));
    },
    rightEls(st) { return [st.cards[st.q.answer]]; },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      this.showList(st, q.answer, true);
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, st.cards[q.answer]); this.cheerAll(st);
      st.summary = '零件一模一样'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    next(st, strat) {
      if (st.picked || !st.carEls) return null;
      if (!st.morphed) return { g: 'tap', p: { id: 'car' } };
      if (!st.map || !st.map.card0) return null;
      const q = st.q, i = strat === 'wrong' ? (q.answer + 1 + st.gen % 4) % 5 : q.answer;
      return { g: 'tap', p: { id: 'card' + i } };
    },
    gestureHint(st) { if (!st.morphed && st.carEls) W3X.tapHint(st, st.carEls[0]); },
    workEls(st) { return st.morphed ? st.cards : st.carEls || []; },
    snap(st) { return { morphed: !!st.morphed }; },
    lines() { return uniq([this.intro, '点他变形！', '变成哪个机器人？', '两辆车合体！', '合成哪个大机器人？', '零件不一样哦', '这块车上没有', '少了一个轮子', '多了一个轮子', '少了一块', '这块大了', '这块小了', '颜色不一样', '零件一模一样'].concat(this.praise)); },
  };

  /* ================================================================ Z7 改！ 帮大黄蜂改作业 (fix5; errors ok / swap / sign / whole / res)
     A little story above, drawn as §3.3 says (two panels, before / after: what went away walks out of the door - W5U.leave
     leaves its grey dashed outline and a trail; what is still here is framed - W5U.stay; what came sparkles - W5U.came;
     together - W5U.brace), and on a blackboard the number sentence 大黄蜂 wrote: three number tiles, a symbol tile, "=".
     "他写对了吗？" - tap a number: a row of five number cards pops up above it, tap one and it goes in; tap the symbol: + and
     − change places; drag a number onto another: the two change places (made for "what went and what is left written the
     wrong way round"); then "好了" (also when it was right all along - then it must not be changed).
       L1 a story that moves (went away / came), <= 5, dots under the numbers; errors ok 1, swap 3, sign 2 (of 6)
       L2 + the two stories that stand still (together: red and yellow fish; the other part), <= 7; + whole
       L3 <= 9; + res (the answer worked out wrong)        L4 only heard: no picture, the task card writes it; <= 9
       L5 + compare (7 red fish, 4 yellow: how many more - 7 − 4 = 3) and the other part written the wrong way round; <= 10
     swap is always a take-away story (5 − 3 = 2 for "5, 2 went away": true sums, the roles the wrong way round - his own
     confusion). Judged by ROLE (together: either part first). Random play: "好了" at once is right only when it was right
     (1 in 6), changing at random almost never - about 0.18 in all. Wrong: one line (the part he let pass: "走了的是两只" /
     "这是减法故事" / "还剩三只哦"; he changed a right one: "这道写对了"; one is still to fix: "还有一个要改"); 1. the wrong
     tiles ringed blue (the line ends; it is not said again); 2. each number flies from its group in the picture into its
     tile, the group glowing ("走了两只，" "还剩三只！"); 3. the blackboard gold: "五减二等于三". q.fact: the story's sum. */
  const FISHP = c => '<path d="M20 50Q46 22 72 50Q46 78 20 50Z" fill="' + c + '" stroke="#2B2118" stroke-width="5"/><path d="M70 50L92 34V66Z" fill="' + c + '" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/><circle cx="34" cy="46" r="4" fill="#2B2118"/>';
  const FISH = { red: W2X.icon(FISHP('#E8414B')), yellow: W2X.icon(FISHP('#FFC93C')) };
  const DOOR_OUT = W2X.icon('<rect x="8" y="14" width="40" height="76" rx="6" fill="#B97A3C" stroke="#2B2118" stroke-width="5"/><path d="M92 52H58M70 38L56 52L70 66" fill="none" stroke="#9AA3AD" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>');
  const DOOR_IN = W2X.icon('<rect x="8" y="14" width="40" height="76" rx="6" fill="#B97A3C" stroke="#2B2118" stroke-width="5"/><path d="M56 52H90M78 38L92 52L78 66" fill="none" stroke="#2B2118" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M74 20L77 27L84 28L78 32L80 39L74 35L68 39L70 32L64 28L71 27Z" fill="#FFC93C" stroke="#2B2118" stroke-width="2"/>');
  const BOARDIC = W2X.icon('<rect x="6" y="14" width="88" height="62" rx="6" fill="#2F5D4E" stroke="#B97A3C" stroke-width="6"/><path d="M20 44h12M26 38v12M44 44h10M62 40h12M62 48h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M34 86L44 76M66 86L56 76" stroke="#2B2118" stroke-width="5" stroke-linecap="round"/>');
  const RADIO = '<svg viewBox="0 0 60 50" width="100%" height="100%" style="pointer-events:none"><path d="M14 14L40 4" stroke="#2B2118" stroke-width="4" stroke-linecap="round"/><rect x="4" y="14" width="52" height="32" rx="8" fill="#FFC93C" stroke="#2B2118" stroke-width="4"/><circle cx="20" cy="30" r="9" fill="#3A3F4A" stroke="#2B2118" stroke-width="3"/><path d="M36 24h12M36 31h12M36 38h12" stroke="#2B2118" stroke-width="3" stroke-linecap="round"/></svg>';
  const SPARK = '<svg viewBox="0 0 30 30" width="22" height="22" style="position:absolute;right:-6px;top:-8px;pointer-events:none"><path d="M15 1L18 12L29 15L18 18L15 29L12 18L1 15L12 12Z" fill="#FFE45C" stroke="#2B2118" stroke-width="2" stroke-linejoin="round"/></svg>';
  const SYM7 = { '+': '加', '−': '减' };
  const Z7THING = { duck: { u: '只', name: '小鸭', go: '走了', come: '又来了' }, car: { u: '辆', name: '车', go: '开走了', come: '又开来' } };
  /* the three roles of a story, in the order of the sentence (a op b = c) */
  const Z7ROLES = { go: ['start', 'gone', 'left'], come: ['start', 'came', 'all'], join: ['red', 'yellow', 'all'], part: ['all', 'red', 'yellow'], cmp: ['more', 'less', 'diff'] };
  const Z7OP = { go: '−', come: '+', join: '+', part: '−', cmp: '−' };
  const z7role = (r, n, u) => ({ start: '一开始是' + CNQ(n) + u, gone: '走了的是' + CNQ(n) + u, came: '来了的是' + CNQ(n) + u, left: '还剩' + CNQ(n) + u + '哦', all: '一共是' + CNQ(n) + u, red: '红的是' + CNQ(n) + '条', yellow: '黄的是' + CNQ(n) + '条', more: '红的是' + CNQ(n) + '条', less: '黄的是' + CNQ(n) + '条', diff: '多的是' + CNQ(n) + '条' })[r];
  const z7eq = (a, op, b, c) => CN[a] + SYM7[op] + CN[b] + '等于' + CN[c];
  /* the two lines while the numbers fly (the first number flies without one): §3.3's two sentences */
  const z7fly = q => { const [, b, c] = q.v, u = q.u;
    return { go: [null, W5U.went(b, u) + '，', W5U.left(c, u) + '！'], come: [null, W5U.came2(b, u) + '，', W5U.all(c, u) + '！'], join: [null, '合起来，', '一共' + CNQ(c) + '条！'], part: [null, '拿走红的，', '黄的' + CNQ(c) + '条！'], cmp: [null, '比一比，', '红的多' + CNQ(c) + '条！'] }[q.type]; };
  const z7story = q => { const [a, b] = q.v.map(CNQ), T7 = Z7THING[q.thing];
    if (q.type === 'go') return ['这里有' + a + T7.u + T7.name + '。', T7.go + b + T7.u + '。', '还剩几' + T7.u + '？'];
    if (q.type === 'come') return ['这里有' + a + T7.u + T7.name + '。', T7.come + b + T7.u + '。', '一共几' + T7.u + '？'];
    if (q.type === 'join') return ['有' + a + '条红鱼，', b + '条黄鱼。', '一共几条？'];
    if (q.type === 'part') return ['一共' + a + '条鱼，', b + '条是红的。', '黄的有几条？'];
    return ['有' + a + '条红鱼，', b + '条黄鱼。', '红的多几条？']; };

  W5R.Z7 = {
    kind0: 'fix5', verb: '改！', intro: '大黄蜂的作业！', praise: ['改得真对！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, hi = [0, 5, 7, 9, 9, 10][d];
      const err = bagPick(G, 'z7e' + d, d === 1 ? ['ok', 'swap', 'swap', 'swap', 'sign', 'sign'] : d === 2 ? ['ok', 'swap', 'swap', 'sign', 'sign', 'whole'] : ['ok', 'swap', 'swap', 'sign', 'whole', 'res']);
      const type = err === 'swap' ? (d === 1 ? 'go' : d === 5 ? bagPick(G, 'z7s5', ['go', 'part', 'cmp']) : bagPick(G, 'z7s', ['go', 'part']))
        : d === 1 ? bagPick(G, 'z7t1', ['go', 'come']) : d === 5 ? bagPick(G, 'z7t5', ['go', 'come', 'join', 'part', 'cmp', 'cmp']) : bagPick(G, 'z7t', ['go', 'come', 'join', 'part']);
      const thing = type === 'go' || type === 'come' ? bagPick(G, 'z7a', ['duck', 'car']) : 'fish', u = thing === 'fish' ? '条' : Z7THING[thing].u;
      let v = null;
      for (let t = 0; t < 200 && !v; t++) {
        const whole = rng.int(d === 1 ? 3 : 4, hi), p = rng.int(1, whole - 1), r = whole - p;
        if (p === r) continue;
        v = type === 'come' ? [r, p, whole] : type === 'join' ? [p, r, whole] : [whole, p, r];
      }
      const op = Z7OP[type], S = x => String(x), right = [S(v[0]), op, S(v[1]), S(v[2])];
      const off = (n, lo) => { const c = rng.shuffle([-2, -1, 1, 2]).map(k => n + k).filter(x => x >= lo && x <= 10); return c[0]; };
      let shown = right.slice();
      if (err === 'ok' && type === 'join' && rng.chance(0.5)) shown = [S(v[1]), '+', S(v[0]), S(v[2])];
      else if (err === 'swap') shown = [S(v[0]), '−', S(v[2]), S(v[1])];
      else if (err === 'sign') shown[1] = op === '+' ? '−' : '+';
      else if (err === 'whole') shown[0] = S(off(v[0], 1));
      else if (err === 'res') shown[3] = S(off(v[2], 1));
      const q = { d, type, thing, u, v, op, roles: Z7ROLES[type], err, right, shown, answer: right.join(','), heard: d === 4 };
      q.k = [d, type, thing, v.join('.'), err];
      q.fact = factOf(op === '+' ? '+' : '-', v[0], v[1]);
      return q;
    },
    /* by role; together: either part first */
    evaluate(st, ans) { const q = st.q, a = String(ans).split(','), R = q.right; if (a.join(',') === R.join(',')) return true; return q.type === 'join' && a[0] === R[2] && a[1] === R[1] && a[2] === R[0] && a[3] === R[3]; },
    audit() { return [{ build: true, chance: 0.18 }]; },
    decor(G) { W2X.decorDone(G, this.chars); },
    geo(st) {
      const q = st.q, L = K.L(), two = q.type === 'go' || q.type === 'come', heard = q.heard && !st.showPic;
      const panels = two ? (L ? [[112, 104, 372, 200], [540, 104, 372, 200]] : [[20, 214, 318, 210], [366, 214, 318, 210]]) : (L ? [[232, 104, 560, 200]] : [[52, 214, 600, 210]]);
      const by = heard ? (L ? 230 : 330) : (L ? 318 : 470), dots = q.d === 1 ? 46 : 0;
      return { L, two, panels, by, bh: 104 + 40 + dots, ts: 104, os: 96, es: 56, gap: 14, cx: L ? 512 : 352 };
    },
    /* the five places on the blackboard: n0 op n1 = n2 (x, w) */
    row(st) {
      const g = this.geo(st), ws = [g.ts, g.os, g.ts, g.es, g.ts], tot = ws.reduce((a, w) => a + w, 0) + 4 * g.gap;
      let x = g.cx - tot / 2; return ws.map(w => { const b = { x: Math.round(x), w }; x += w + g.gap; return b; });
    },
    place(st) {
      const q = st.q, g = this.geo(st);
      if (!st.boardEl) return;
      if (st.sceneL !== g.L) this.scene(st, false);
      const R = this.row(st), y = g.by + 20;
      place(st.boardEl, R[0].x - 28, g.by, R[4].x + R[4].w - R[0].x + 56, g.bh);
      [0, 1, 2, 4].forEach((p, i) => place(st.tiles[i], R[p].x, y, R[p].w, g.ts));
      place(st.eqEl, R[3].x, y, R[3].w, g.ts);
      (st.dotEls || []).forEach((e, i) => { const p = [0, 2, 4][i]; place(e, R[p].x - 6, y + g.ts + 8, R[p].w + 12, 34); });
      if (st.radio) { const a = st.G.actors[this.chars[0]]; if (a && a.x > 0) place(st.radio, Math.round(a.x + 4), Math.round(a.y - a.h - 40), 52, 44); }
      if (st.pop) this.closePop(st);
    },
    /* ---------------------------------------------------------------- the story picture (built again when the stage turns) */
    scene(st, anim) {
      const q = st.q, g = this.geo(st), tok = (st.sceneTok || 0) + 1;
      st.sceneTok = tok; (st.sc || []).forEach(e => e && e.remove()); st.sc = []; st.grp = {}; st.sceneL = g.L;
      if (q.heard && !st.showPic) return null;
      const keep = e => { if (e) st.sc.push(e); return e; };
      const panel = P => { const e = keep(thing(st, 3, 'item')); place(e, P[0], P[1], P[2], P[3]); Object.assign(e.style, { borderRadius: '22px', background: 'rgba(255,248,236,.94)', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none' }); return e; };
      const pic = (src, x, y, s, flip) => { const e = keep(thing(st, 6, 'item')); e.style.pointerEvents = 'none'; place(e, Math.round(x), Math.round(y), s, s); const im = img(src, '', e); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain', transform: flip ? 'scaleX(-1)' : '' }); return e; };
      const solid = r => { if (r) { r.style.borderStyle = 'solid'; r.style.borderRadius = '22px'; } return keep(r); };
      const grid = (n, x, y, w, h, s) => W5U.grid(n, x + w / 2, y + h / 2, s, s, 6, 6, Math.min(n, Math.max(1, Math.floor((w + 6) / (s + 6)))));
      const fit = (n, w, h) => { for (let s = 64; s > 30; s -= 2) { const per = Math.max(1, Math.floor((w + 6) / (s + 6))); if (Math.ceil(n / per) * (s + 6) - 6 <= h) return s; } return 30; };
      if (g.two) {
        const [P0, P1] = g.panels; panel(P0); panel(P1);
        const ar = keep(thing(st, 4, 'item')); ar.innerHTML = '<svg viewBox="0 0 60 60" width="100%" height="100%" style="pointer-events:none"><path d="M8 30H44M32 16L48 30L32 44" fill="none" stroke="#2B2118" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        place(ar, P0[0] + P0[2] + 2, P0[1] + P0[3] / 2 - 20, P1[0] - P0[0] - P0[2] - 4, 40);
        const src = W5U.prop(q.thing), n0 = q.v[0], nAll = q.type === 'go' ? n0 : q.v[2];
        const s0 = fit(n0, P0[2] - 28, P0[3] - 28);
        st.grp.start = grid(n0, P0[0] + 14, P0[1] + 14, P0[2] - 28, P0[3] - 28, s0).map(p => pic(src, p.x, p.y, s0));
        /* the door of the after picture, on its left */
        const door = keep(thing(st, 4, 'item')); place(door, P1[0] + 10, P1[1] + 24, 38, P1[3] - 48); Object.assign(door.style, { borderRadius: '8px', background: '#B97A3C', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none' });
        const ax = P1[0] + 58, aw = P1[2] - 70, s1 = fit(nAll, aw, P1[3] - 28), spots = grid(nAll, ax, P1[1] + 14, aw, P1[3] - 28, s1), dx = P1[0] + 29, dy = P1[1] + P1[3] / 2;
        if (q.type === 'go') {
          const all = spots.map(p => pic(src, p.x, p.y, s1)), byX = all.slice().sort((a, b) => box(a).x - box(b).x || box(a).y - box(b).y), gone = byX.slice(0, q.v[1]), left = all.filter(e => !gone.includes(e));
          st.grp.left = left;
          const frame = () => solid(W5U.stay(st, left));
          if (!anim) { const R = gone.map(e => { const b = W5U.rect(e), gh = W5U.gone(st, e); keep(gh); e.style.visibility = 'hidden'; return { b, gh }; }); this.trails(st, R.map(r => r.b), dx, dy); st.grp.gone = R.map(r => r.gh); frame(); }
          else this.play(st, tok, async () => {
            await st.scope.wait(T(1200)); if (st.sceneTok !== tok) return;
            const R = gone.map(e => W5U.leave(st, e, dx, dy, T(700)));
            R.forEach(r => r.then(x => { if (st.sceneTok !== tok) { x.ghost.remove(); x.trail.parentNode && x.trail.parentNode.remove(); return; } keep(x.ghost); keep(x.trail.parentNode); }));
            st.grp.gone = []; const done = await Promise.all(R); if (st.sceneTok !== tok) return;
            st.grp.gone = done.map(x => x.ghost); frame();
          });
        } else {
          const old = spots.slice(0, n0).map(p => pic(src, p.x, p.y, s1)), nw = spots.slice(n0).map(p => { const e = pic(src, p.x, p.y, s1, q.thing === 'car'); e.insertAdjacentHTML('beforeend', SPARK); return e; });
          st.grp.came = nw; st.grp.all = old.concat(nw);
          const frame = () => solid(W5U.stay(st, old.concat(nw)));
          if (!anim) frame();
          else {
            nw.forEach(e => { e.style.visibility = 'hidden'; });
            this.play(st, tok, async () => {
              await st.scope.wait(T(1200)); if (st.sceneTok !== tok) return;
              await Promise.all(nw.map(e => { const b = W5U.rect(e); e.style.visibility = ''; return st.scope.anim(e, [{ transform: 'translate(' + (dx - b.x - b.w / 2) + 'px,' + (dy - b.y - b.h / 2) + 'px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: T(600), easing: EASE.glide }); }));
              if (st.sceneTok !== tok) return;
              nw.forEach(e => W5U.came(st, e)); frame();
            });
          }
        }
      } else {
        const P = g.panels[0]; panel(P);
        const x0 = P[0] + 18, w = P[2] - 36, top = P[1] + 14;
        if (q.type === 'cmp') {
          /* two rows from the left, one under one: the red ones left over are "more" */
          const n = q.v[0], s = Math.min(54, Math.floor((w + 6) / n) - 6), X = i => x0 + i * (s + 6), y1 = top + 8, y2 = top + 8 + s + 40;
          const reds = Array.from({ length: n }, (_, i) => pic(FISH.red, X(i), y1, s)), yel = Array.from({ length: q.v[1] }, (_, i) => pic(FISH.yellow, X(i), y2, s));
          const ls = keep(K.lines(st)); ls.style.zIndex = 5; ls.classList.add('scene');
          yel.forEach((_, i) => svg('path', { d: 'M' + (X(i) + s / 2) + ' ' + (y1 + s + 4) + 'V' + (y2 - 4), stroke: INK, 'stroke-width': 4, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, ls));
          st.grp.more = reds; st.grp.less = yel; st.grp.diff = reds.slice(q.v[1]);
        } else {
          const h = P[3] - 92;
          if (q.type === 'join') {
            const hw = (w - 24) / 2, s = Math.min(fit(q.v[0], hw, h), fit(q.v[1], hw, h));
            st.grp.red = grid(q.v[0], x0, top, hw, h, s).map(p => pic(FISH.red, p.x, p.y, s));
            st.grp.yellow = grid(q.v[1], x0 + hw + 24, top, hw, h, s).map(p => pic(FISH.yellow, p.x, p.y, s));
            st.grp.all = st.grp.red.concat(st.grp.yellow);
          } else {
            const s = fit(q.v[0], w, h), sp = grid(q.v[0], x0, top, w, h, s), all = sp.map((p, i) => pic(i < q.v[1] ? FISH.red : FISH.yellow, p.x, p.y, s));
            st.grp.all = all; st.grp.red = all.slice(0, q.v[1]); st.grp.yellow = all.slice(q.v[1]);
          }
          const br = W5U.brace(st, st.grp.all, false); if (br) { keep(br.parentNode); br.setAttribute('stroke', INK); br.setAttribute('stroke-width', 6); br.parentNode.classList.add('scene'); br.parentNode.style.zIndex = 5; }
        }
      }
      return null;
    },
    /* a story animation that stops when the picture is built again */
    play(st, tok, f) { f().catch(() => {}); },
    /* grey trails from where they stood to the door (the picture built again without the animation) */
    trails(st, rects, dx, dy) {
      const s = K.lines(st); st.sc.push(s);
      rects.forEach(b => { const a = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; svg('path', { d: 'M' + a.x + ' ' + a.y + 'L' + dx + ' ' + dy, stroke: W5U.GREY, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '3 14', fill: 'none' }, s); svg('path', { d: W5U.arrowHead(a, { x: dx, y: dy }, 22), fill: W5U.GREY }, s); });
    },
    /* ---------------------------------------------------------------- the blackboard */
    tileNode(v, px) {
      const e = el('div', ''); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', pointerEvents: 'none' });
      if (v === '+' || v === '−') e.innerHTML = '<svg viewBox="0 0 40 40" width="' + (px || 62) + '" height="' + (px || 62) + '"><rect x="5" y="16" width="30" height="8" rx="4" fill="#2B2118"/>' + (v === '+' ? '<rect x="16" y="5" width="8" height="30" rx="4" fill="#2B2118"/>' : '') + '</svg>';
      else if (v !== '' && v != null) e.appendChild(UI.num(+v, px || 64));
      return e;
    },
    show(st, i, v) { const t = st.tiles[i]; t.innerHTML = ''; t.appendChild(this.tileNode(v)); if (st.dotEls && i !== 1) this.dots(st, i === 0 ? 0 : i === 2 ? 1 : 2, v); },
    dots(st, k, v) {
      const e = st.dotEls[k], n = v === '' ? 0 : +v; e.innerHTML = '';
      const s = svg('svg', { viewBox: '0 0 116 34', width: '100%', height: '100%' }, e); s.style.pointerEvents = 'none';
      for (let i = 0; i < n; i++) svg('circle', { cx: 58 - (Math.min(n, 5) - 1) * 11 + (i % 5) * 22, cy: n > 5 ? (i < 5 ? 9 : 25) : 17, r: 7, fill: '#FFF8EC' }, s);
    },
    /* the cell index (0 a, 1 op, 2 b, 3 c) of tile i, and back */
    cellEl(st, c) { return st.tiles[[0, 1, 2, 3][c]]; },
    async present(st) {
      const q = st.q, G = st.G;
      st.vals = q.shown.slice(); st.pop = null; st.showPic = false;
      st.boardEl = thing(st, 3, 'item'); Object.assign(st.boardEl.style, { borderRadius: '18px', background: '#2F5D4E', border: '7px solid #B97A3C', boxShadow: '0 0 0 4px ' + INK, boxSizing: 'border-box' });
      st.tiles = [0, 1, 2, 3].map(i => {
        const t = W3X.card(st, null, 6); if (i === 1) t.style.background = '#FFF3C4';
        K.reg(st, i === 1 ? 'op' : 'n' + [0, 0, 1, 2][i], t, i === 1 ? {} : { drag: true, drops: () => this.drops(st, i) });
        return t;
      });
      st.eqEl = thing(st, 5, 'item'); st.eqEl.innerHTML = '<svg viewBox="0 0 40 40" width="100%" height="100%" style="pointer-events:none"><rect x="5" y="11" width="30" height="7" rx="3.5" fill="#FFF8EC"/><rect x="5" y="23" width="30" height="7" rx="3.5" fill="#FFF8EC"/></svg>';
      if (q.d === 1) st.dotEls = [0, 1, 2].map(() => { const e = thing(st, 5, 'item'); e.style.pointerEvents = 'none'; return e; });
      st.tiles.forEach((_, i) => this.show(st, i, st.vals[i]));
      st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {}); st.doneBtn.classList.add('ready');
      st.radio = thing(st, 7, 'item'); st.radio.innerHTML = RADIO; st.radio.style.pointerEvents = 'none';
      this.scene(st, !q.heard);
      this.place(st);
      K.pop(st, st.boardEl); st.tiles.forEach((t, i) => K.pop(st, t, 120 + 60 * i));
      const S = z7story(q);
      if (q.heard) {
        const it = q.thing === 'fish' ? null : W5U.prop(q.thing);
        K.task(st, q.type === 'go' ? [[it, { qty: q.v[0] }], [DOOR_OUT, { qty: q.v[1] }], [BOARDIC]] : q.type === 'come' ? [[it, { qty: q.v[0] }], [DOOR_IN, { qty: q.v[1] }], [BOARDIC]]
          : q.type === 'join' ? [[FISH.red, { qty: q.v[0] }], [FISH.yellow, { qty: q.v[1] }], [BOARDIC]] : [[FISH.red, FISH.yellow, { qty: q.v[0] }], [FISH.red, { qty: q.v[1] }], [FISH.yellow, BOARDIC]]);
      } else K.task(st, [[BOARDIC]]);
      const first = !G.z7les; G.z7les = true;
      st.lead = S.concat(first ? ['他写对了吗？'] : []); st.lead.forEach(l => Voice.say(l, { tag: 'prompt' }));
      K.say(st, first ? '不对就改一改！' : '他写对了吗？');
    },
    drops(st, i) { return [0, 2, 3].filter(j => j !== i).map(j => ({ id: 'n' + [0, 0, 1, 2][j], rect: () => box(st.tiles[j]) })); },
    tileOf(id) { const m = /^n(\d)$/.exec(id || ''); return m ? [0, 2, 3][+m[1]] : id === 'op' ? 1 : -1; },
    /* the row of five number cards above tile i: the numbers around the one in it */
    openPop(st, i) {
      this.closePop(st);
      const cur = +st.vals[i], lo = Math.max(1, Math.min(6, cur - 2)), vals = [0, 1, 2, 3, 4].map(k => lo + k), tb = box(st.tiles[i]), s = 92, gp = 8, W = 5 * s + 4 * gp;
      const x0 = Math.max(8, Math.min(Stage.W - 8 - W, Math.round(tb.x + tb.w / 2 - W / 2))), y0 = Math.round(tb.y - s - 30);
      const els = vals.map((v, k) => { const c = W3X.card(st, null, 60); c.style.zIndex = 60; c.appendChild(this.tileNode(String(v), 54)); place(c, x0 + k * (s + gp), y0, s, s); if (v === cur) c.style.boxShadow = '0 0 0 5px ' + GOLD + ', 0 0 0 9px ' + INK; K.reg(st, 'p' + k, c, {}); K.pop(st, c, 30 * k); return c; });
      st.pop = { i, els, vals }; st.tiles[i].style.outline = '6px solid ' + GOLD; st.tiles[i].style.outlineOffset = '3px';
    },
    closePop(st) {
      const P = st.pop; if (!P) return; st.pop = null;
      P.els.forEach((c, k) => { Input.unbind(c); if (st.map) delete st.map['p' + k]; c.remove(); });
      st.tiles[P.i].style.outline = '';
    },
    set(st, i, v) { st.vals[i] = String(v); this.show(st, i, st.vals[i]); K.pop(st, st.tiles[i]); Sfx.place(); },
    onGesture(st, name, p) {
      if (st.picked || !st.tiles) return false;
      const id = p.id || '', i = this.tileOf(id); let m;
      if (name === 'drop' && i >= 0) {
        const j = this.tileOf(p.to); st.tiles[i].style.transform = '';
        if (j < 0 || j === i || j === 1) return 'free';
        this.closePop(st); const a = st.vals[i]; st.vals[i] = st.vals[j]; st.vals[j] = a; this.show(st, i, st.vals[i]); this.show(st, j, st.vals[j]);
        K.pop(st, st.tiles[i]); K.pop(st, st.tiles[j]); Sfx.place(); return 'ok';
      }
      if (name !== 'tap') return false;
      if (i === 1) { this.closePop(st); this.set(st, 1, st.vals[1] === '+' ? '−' : '+'); return 'ok'; }
      if (i >= 0) { if (st.pop && st.pop.i === i) { this.closePop(st); return 'free'; } this.openPop(st, i); Sfx.touch && Sfx.touch(); return 'ok'; }
      if ((m = /^p(\d)$/.exec(id)) && st.pop) { const P = st.pop, v = P.vals[+m[1]]; this.closePop(st); this.set(st, P.i, v); return 'ok'; }
      if (id === 'done') { this.closePop(st); st.picked = true; Session.submit(st, st.vals.join(',')); return 'ok'; }
      return false;
    },
    /* the cells that do not fit the story (by role; together: the better way round) and the line for the first */
    bad(st, ans) {
      const q = st.q, a = String(ans).split(','), R = q.right, alt = q.type === 'join' ? [R[2], R[1], R[0], R[3]] : null;
      const miss = W => [0, 1, 2, 3].filter(k => a[k] !== W[k]);
      let cells = miss(R), want = R, order = q.roles;
      if (alt && miss(alt).length < cells.length) { cells = miss(alt); want = alt; order = [q.roles[1], q.roles[0], q.roles[2]]; }
      const c = cells[0], line = c == null ? '' : c === 1 ? (q.op === '−' ? '这是减法故事' : '这是加法故事') : z7role(order[[0, 0, 1, 2][c]], +want[c], q.u);
      return { cells, line };
    },
    changed(st, ans) { const a = String(ans).split(','); return [0, 1, 2, 3].filter(k => a[k] !== st.q.shown[k]); },
    fbLine(st, ans) {
      const q = st.q, B = this.bad(st, ans);
      if (q.err === 'ok') return '这道写对了';
      if (!this.changed(st, ans).length) return B.line;
      return B.cells.length === 1 ? '还有一个要改' : B.line;
    },
    async feedback(st, ans) {
      const q = st.q, cells = q.err === 'ok' ? this.changed(st, ans) : this.bad(st, ans).cells;
      cells.forEach(c => K.wiggle(st, this.cellEl(st, c)));
      await fbSay(st, this.fbLine(st, ans));
    },
    /* 1. the tiles that do not fit (he changed: the ones he changed) blue; 2. each number from its group into its tile, the
       group glowing: "走了两只，" "还剩三只！"; 3. the blackboard gold: "五减二等于三" */
    async explain(st, ans) {
      const my = st, q = st.q, cells = q.err === 'ok' ? this.changed(st, ans) : this.bad(st, ans).cells;
      this.closePop(st);
      const rings = W5U.blue(st, cells.map(c => this.cellEl(st, c)));
      await fbDone(st); if (!Session.alive(my)) return;
      W5U.hide(rings);
      await W5U.beat(st); if (!Session.alive(my)) return;
      /* L4 (only heard): now the picture */
      if (q.heard && !st.showPic) { st.showPic = true; this.scene(st, false); this.place(st); }
      [0, 2, 3].forEach(c => { st.vals[c] = ''; this.show(st, c, ''); });
      if (st.vals[1] !== q.op) this.set(st, 1, q.op);
      const lines = z7fly(q);
      for (let k = 0; k < 3; k++) {
        if (!Session.alive(my)) return;
        const c = [0, 2, 3][k], grp = (st.grp || {})[q.roles[k]] || [], t = st.tiles[c];
        grp.forEach(e => { e.classList.add('glow'); st.scope.timeout(() => e.classList.remove('glow'), 1500); });
        st.vals[c] = q.right[c]; this.show(st, c, st.vals[c]);
        const to = box(t), R = grp.map(e => W5U.rect(e)), src = R.length ? { x: Math.min(...R.map(r => r.x)), y: Math.min(...R.map(r => r.y)), w: Math.max(...R.map(r => r.x + r.w)) - Math.min(...R.map(r => r.x)), h: Math.max(...R.map(r => r.y + r.h)) - Math.min(...R.map(r => r.y)) } : to;
        if (!ff(st)) t.animate([{ transform: 'translate(' + Math.round(src.x + src.w / 2 - to.x - to.w / 2) + 'px,' + Math.round(src.y + src.h / 2 - to.y - to.h / 2) + 'px) scale(.6)' }, { transform: 'none' }], { duration: T(340), easing: EASE.glide });
        Sfx.place();
        if (lines[k]) await say(st, lines[k]); else await st.scope.wait(T(380));
        await st.scope.wait(T(30));
      }
      if (!Session.alive(my)) return;
      W5U.gold(st, st.boardEl, 6);
      await W5U.sum(st, z7eq(q.v[0], q.op, q.v[1], q.v[2]));
      await st.scope.wait(T(40));
    },
    rightEls(st) { return [st.boardEl]; },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      st.tiles.forEach(t => K.hop(st, t, 12));
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      W5U.gold(st, st.boardEl, 6); this.cheerAll(st);
      st.summary = z7eq(q.v[0], q.op, q.v[1], q.v[2]); W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    /* tests: 'right' mends the sentence (symbol, a swap by dragging, numbers through the cards), then 好了; 'wrong' lets it
       pass (a right one: the symbol changed first) */
    next(st, strat) {
      if (st.picked || !st.tiles) return null;
      const q = st.q, cur = st.vals;
      if (strat === 'wrong') return q.err === 'ok' && cur.join(',') === q.shown.join(',') ? { g: 'tap', p: { id: 'op' } } : { g: 'tap', p: { id: 'done' } };
      if (this.evaluate(st, cur.join(','))) return { g: 'tap', p: { id: 'done' } };
      const R = q.right;
      if (cur[1] !== R[1]) return { g: 'tap', p: { id: 'op' } };
      if (cur[2] === R[3] && cur[3] === R[2] && cur[2] !== cur[3] && !st.pop) return { g: 'drop', p: { id: 'n1', to: 'n2' } };
      for (const c of [0, 2, 3]) {
        if (cur[c] === R[c]) continue;
        if (st.pop && st.pop.i === c) { const want = +R[c], k = st.pop.vals.reduce((b, v, j) => (Math.abs(v - want) < Math.abs(st.pop.vals[b] - want) ? j : b), 0); return { g: 'tap', p: { id: 'p' + k } }; }
        return { g: 'tap', p: { id: 'n' + [0, 0, 1, 2][c] } };
      }
      return { g: 'tap', p: { id: 'done' } };
    },
    gestureHint(st) { if (st.tiles) W3X.tapHint(st, st.tiles[0]); },
    workEls(st) { return (st.tiles || []).concat(st.doneBtn ? [st.doneBtn] : []); },
    snap(st) { return { vals: (st.vals || []).join(','), pop: st.pop ? st.pop.i : -1 }; },
    lines() {
      const out = [this.intro, '他写对了吗？', '不对就改一改！', '这道写对了', '还有一个要改', '这是减法故事', '这是加法故事', '合起来，', '拿走红的，', '比一比，', '一共几条？', '黄的有几条？', '红的多几条？'].concat(this.praise);
      Object.values(Z7THING).forEach(T7 => out.push('还剩几' + T7.u + '？', '一共几' + T7.u + '？'));
      for (let n = 1; n <= 10; n++) {
        Object.values(Z7THING).forEach(T7 => {
          ['start', 'gone', 'came', 'left', 'all'].forEach(r => out.push(z7role(r, n, T7.u)));
          out.push(W5U.went(n, T7.u) + '，', W5U.left(n, T7.u) + '！', W5U.came2(n, T7.u) + '，', W5U.all(n, T7.u) + '！', '这里有' + CNQ(n) + T7.u + T7.name + '。', T7.go + CNQ(n) + T7.u + '。', T7.come + CNQ(n) + T7.u + '。');
        });
        ['all', 'red', 'yellow', 'diff'].forEach(r => out.push(z7role(r, n, '条')));
        out.push('一共' + CNQ(n) + '条！', '黄的' + CNQ(n) + '条！', '红的多' + CNQ(n) + '条！', '有' + CNQ(n) + '条红鱼，', CNQ(n) + '条黄鱼。', '一共' + CNQ(n) + '条鱼，', CNQ(n) + '条是红的。');
        for (let m = 1; m <= 10; m++) { if (n + m <= 10 && n !== m) out.push(z7eq(n, '+', m, n + m)); if (n - m >= 1 && m !== n - m) out.push(z7eq(n, '−', m, n - m)); }
      }
      return uniq(out);
    },
  };

  /* ================================================================ Z8 挪！ 卡车开出去 (park5, the reasoning test)
     A block car park seen from above (5 x 5 cells of 96); 擎天柱's red truck (2 cells) lies across the middle row, the gate is
     at that row's right end. 5-7 other vehicles: little block cars (2 cells), long lorries (3); one lying across moves only
     left / right, one standing only up / down (L1-L2 draw arrows on their roofs). 大黄蜂's yellow car is one of them.
       first (L1-L3): "卡车要开出去！" "先挪哪辆车？" - tap a car (or drag it: the car he moves first is his answer)
       count (L4-L5): "最少挪几辆车？" - five number cards (1-5)
     A small search (5 x 5, <= 8 vehicles) finds every shortest way (a move = one car slid any distance); "first" questions
     only where every shortest way starts with the same car, "count" questions only where no shortest way moves a car twice.
       L1 one standing car in the truck's way that can move off by itself; 4+ others not in the way
       L2 the car in the way cannot move off (a car above, the wall below): the first move is the car that holds it
       L3 two cars in the way, both held by the same car: that car first (3 moves)
       L4 count, 2-3 cars · L5 count, 3-4 cars, a long lorry has to move on the way (a 5 x 5 park: a standing lorry of 3
       across the middle row could never get out of it, so the lorry is the one that makes room for a car in the way)
     A random tap is right 1 time in 5-7 cars; a card 1 in 5 (its place and rank from bags). Wrong: his car ringed blue tries
     to go ("它被挡住了" - it bumps / "它不挡卡车" - it moves, the truck is still shut in; count: "不是两辆"); the cars move
     in the right order, one by one ("先挪这辆", "一辆、两辆"); the truck drives out ("卡车开出去了"). */
  const PKCOL = ['#4FB3FF', '#5CC46E', '#B57BFF', '#FF9F43', '#3DD6C6', '#FF7FA8', '#9AA3AD'];
  /* the search: vehicles [{ o: 'h' | 'v', len, x, y }] (0 = the truck, it does not move until it leaves) */
  const parkOcc = (V, p) => { const g = Array(25).fill(-1); V.forEach((v, i) => { for (let k = 0; k < v.len; k++) { const x = v.o === 'h' ? p[i] + k : v.x, y = v.o === 'h' ? v.y : p[i] + k; g[y * 5 + x] = i; } }); return g; };
  /* every move from positions p: a car (not the truck) slid any distance */
  const parkMoves = (V, p) => { const g = parkOcc(V, p), out = []; for (let i = 1; i < V.length; i++) { const v = V[i]; for (const s of [-1, 1]) { let q = p[i]; for (;;) { const nq = q + s; if (nq < 0 || nq + v.len > 5) break; const cell = s < 0 ? nq : nq + v.len - 1, x = v.o === 'h' ? cell : v.x, y = v.o === 'h' ? v.y : cell; if (g[y * 5 + x] >= 0) break; q = nq; const np = p.slice(); np[i] = q; out.push({ i, np }); } } } return out; };
  function parkSolve(V, maxD) {
    const key = p => p.join(','), start = V.map(v => (v.o === 'h' ? v.x : v.y));
    const occ = p => parkOcc(V, p), moves = p => parkMoves(V, p);
    const goal = p => { const g = occ(p); for (let x = p[0] + V[0].len; x < 5; x++) if (g[10 + x] >= 0) return false; return true; };
    const dist = new Map([[key(start), 0]]), preds = new Map(), stateOf = new Map([[key(start), start]]);
    let layer = [start], M = goal(start) ? 0 : -1;
    for (let d = 0; d < maxD && M < 0; d++) {
      const next = [];
      for (const p of layer) for (const m of moves(p)) {
        const k = key(m.np), seen = dist.get(k);
        if (seen === undefined) { dist.set(k, d + 1); stateOf.set(k, m.np); preds.set(k, [{ from: key(p), i: m.i }]); next.push(m.np); }
        else if (seen === d + 1) preds.get(k).push({ from: key(p), i: m.i });
      }
      if (next.some(goal)) M = d + 1;
      layer = next;
    }
    if (M <= 0) return { M };
    /* the shortest ways: back from the goals of depth M */
    const on = new Set(), goals = layer.filter(goal).map(key); goals.forEach(k => on.add(k));
    const edges = new Map();
    let cur = goals;
    for (let d = M; d > 0; d--) { const prev = new Set(); cur.forEach(k => (preds.get(k) || []).forEach(e => { if (dist.get(e.from) === d - 1) { prev.add(e.from); (edges.get(e.from) || edges.set(e.from, []).get(e.from)).push({ to: k, i: e.i }); } })); prev.forEach(k => on.add(k)); cur = Array.from(prev); }
    const first = uniq((edges.get(key(start)) || []).map(e => e.i));
    /* every shortest way: does one move a car twice? (and one way, for the demonstration) */
    let twice = false, way = null, count = 0;
    const walk = (k, used, path) => { if (count > 4000) return; if (path.length === M) { count++; if (!way) way = path.slice(); return; } (edges.get(k) || []).forEach(e => { if (used.includes(e.i)) twice = true; walk(e.to, used.concat(e.i), path.concat({ i: e.i, p: stateOf.get(e.to)[e.i] })); }); };
    walk(key(start), [], []);
    return { M, first, twice, way, occ: occ(start), moves: moves(start) };
  }
  W5R.Z8 = {
    kind0: 'park5', verb: '挪！', intro: '帮卡车开出去！', praise: ['卡车出来啦！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, want = [0, 1, 2, 3, 0, 0][d];
      for (let t = 0; t < 3000; t++) {
        const V = [], g = Array(25).fill(false);
        const fill = v => { for (let k = 0; k < v.len; k++) { const x = v.o === 'h' ? v.x + k : v.x, y = v.o === 'h' ? v.y : v.y + k; if (x > 4 || y > 4 || g[y * 5 + x]) return false; } for (let k = 0; k < v.len; k++) { const x = v.o === 'h' ? v.x + k : v.x, y = v.o === 'h' ? v.y : v.y + k; g[y * 5 + x] = true; } V.push(v); return true; };
        fill({ o: 'h', len: 2, x: 0, y: 2, truck: 1 });
        /* the cars in the truck's way: standing, across the middle row */
        const nb = d === 3 ? 2 : d === 5 ? rng.int(1, 2) : d === 4 ? rng.int(1, 2) : 1, cols = rng.shuffle([2, 3, 4]).slice(0, nb);
        cols.forEach(x => fill({ o: 'v', len: 2, x, y: rng.int(1, 2) }));
        const K = rng.int(5, 7);
        for (let tries = 0; V.length < K + 1 && tries < 60; tries++) { const ov = rng.chance(0.5) ? 'h' : 'v', len = rng.chance(0.25) ? 3 : 2; fill({ o: ov, len, x: rng.int(0, ov === 'h' ? 5 - len : 4), y: rng.int(0, ov === 'v' ? 5 - len : 4) }); }
        if (V.length < 6) continue;
        const R = parkSolve(V, 5);
        if (R.M < 1 || R.twice || !R.way) continue;
        const inWay = i => { const v = V[i]; return v.o === 'v' && v.x >= 2 && v.y <= 2 && v.y + v.len > 2; };
        if (d <= 3) {
          if (R.M !== want || R.first.length !== 1) continue;
          const a = R.first[0];
          if (d === 1 && !inWay(a)) continue;
          if (d >= 2 && inWay(a)) continue;
          /* a car in the way that is not the answer cannot get out of the way by one move */
          const stuckOk = V.every((v, i) => i === 0 || i === a || !inWay(i) || !R.moves.some(m => m.i === i && !(m.np[i] <= 2 && m.np[i] + v.len > 2)));
          if (!stuckOk) continue;
          const yellow = rng.pick(V.map((_, i) => i).filter(i => i > 0));
          const cars = V.slice(1).map((v, i) => i + 1);
          return { k: [d, V.map(v => v.o + v.len + v.x + v.y).join('')], d, V, yellow, ask: 'first', answer: a, way: R.way, M: R.M, arrows: d <= 2, cars };
        }
        if ((d === 4 && (R.M < 2 || R.M > 3)) || (d === 5 && (R.M < 3 || R.M > 4))) continue;
        if (d === 5 && !R.way.some(w => V[w.i].len === 3)) continue;
        const yellow = rng.pick(V.map((_, i) => i).filter(i => i > 0));
        return { k: [d, V.map(v => v.o + v.len + v.x + v.y).join('')], d, V, yellow, ask: 'count', answer: R.M, cards: W5U.nums(G, R.M, 1, 5), way: R.way, M: R.M, arrows: false };
      }
      return null;
    },
    audit(q) { if (q.cards) return [{ n: 5, at: q.cards.indexOf(q.answer), right: q.cards.filter(c => c === q.answer).length }]; return [{ build: true, chance: 1 / (q.V.length - 1) }]; },
    decor(G) { W3X.decor2(G, this.chars); },
    geo(st) { const L = K.L(); return L ? { L, u: 96, gx: 230, gy: 120, cx: 770, cy: 108, cw: 108, ch: 92 } : { L, u: 96, gx: 112, gy: 214, cy: 726, cw: 120, ch: 120 }; },
    vBox(st, i, pos) { const g = this.geo(st), v = st.q.V[i], p = pos == null ? st.pos[i] : pos, x = v.o === 'h' ? p : v.x, y = v.o === 'h' ? v.y : p; return { x: g.gx + x * g.u, y: g.gy + y * g.u, w: (v.o === 'h' ? v.len : 1) * g.u, h: (v.o === 'v' ? v.len : 1) * g.u }; },
    place(st) {
      const g = this.geo(st);
      if (!st.lot) return;
      place(st.lot, g.gx - 16, g.gy - 16, 5 * g.u + 32, 5 * g.u + 32);
      place(st.exit, g.gx + 5 * g.u + 2, g.gy + 2 * g.u + 12, 54, 72);
      st.vEls.forEach((e, i) => { const b = this.vBox(st, i); place(e, b.x + 4, b.y + 4, b.w - 8, b.h - 8); });
      if (st.cards) st.cards.forEach((c, i) => { if (g.L) place(c, g.cx, g.cy + i * (g.ch + 10), g.cw, g.ch); else place(c, Math.round(352 - (5 * g.cw + 48) / 2 + i * (g.cw + 12)), g.cy, g.cw, g.ch); });
    },
    /* a vehicle seen from above: body, windscreen, wheels; the truck has a cab; arrows on the roof at L1-L2 */
    vehicle(st, i) {
      const q = st.q, v = q.V[i], e = thing(st, 6, 'item'), w = (v.o === 'h' ? v.len : 1) * 100, h = (v.o === 'v' ? v.len : 1) * 100;
      const col = i === 0 ? '#E8414B' : i === q.yellow ? '#FFC93C' : PKCOL[(i - 1) % PKCOL.length];
      let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="100%" preserveAspectRatio="none" style="pointer-events:none;overflow:visible">';
      const wh = (x, y) => '<rect x="' + x + '" y="' + y + '" width="22" height="12" rx="4" fill="#2B2118"/>';
      if (v.o === 'h') { s += wh(14, -2) + wh(w - 36, -2) + wh(14, h - 10) + wh(w - 36, h - 10); s += '<rect x="2" y="6" width="' + (w - 4) + '" height="' + (h - 12) + '" rx="16" fill="' + col + '" stroke="#2B2118" stroke-width="5"/><rect x="' + (w - 34) + '" y="18" width="18" height="' + (h - 36) + '" rx="6" fill="#BFE3FF" stroke="#2B2118" stroke-width="3"/>'; if (i === 0) s += '<rect x="' + (w - 62) + '" y="10" width="6" height="' + (h - 20) + '" fill="#2B2118"/>'; }
      else { s += wh(-2, 14) + wh(-2, h - 36) + wh(w - 20, 14) + wh(w - 20, h - 36); s = s.replace(/width="22" height="12"/g, 'width="12" height="22"'); s += '<rect x="6" y="2" width="' + (w - 12) + '" height="' + (h - 4) + '" rx="16" fill="' + col + '" stroke="#2B2118" stroke-width="5"/><rect x="18" y="16" width="' + (w - 36) + '" height="18" rx="6" fill="#BFE3FF" stroke="#2B2118" stroke-width="3"/>'; }
      if (q.arrows && i > 0) { const c = { x: w / 2, y: h / 2 }; s += v.o === 'h' ? '<path d="M' + (c.x - 26) + ' ' + c.y + 'H' + (c.x + 26) + 'M' + (c.x - 14) + ' ' + (c.y - 10) + 'L' + (c.x - 26) + ' ' + c.y + 'L' + (c.x - 14) + ' ' + (c.y + 10) + 'M' + (c.x + 14) + ' ' + (c.y - 10) + 'L' + (c.x + 26) + ' ' + c.y + 'L' + (c.x + 14) + ' ' + (c.y + 10) + '" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M' + c.x + ' ' + (c.y - 26) + 'V' + (c.y + 26) + 'M' + (c.x - 10) + ' ' + (c.y - 14) + 'L' + c.x + ' ' + (c.y - 26) + 'L' + (c.x + 10) + ' ' + (c.y - 14) + 'M' + (c.x - 10) + ' ' + (c.y + 14) + 'L' + c.x + ' ' + (c.y + 26) + 'L' + (c.x + 10) + ' ' + (c.y + 14) + '" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'; }
      e.innerHTML = s + '</svg>';
      return e;
    },
    async present(st) {
      const q = st.q;
      st.pos = q.V.map(v => (v.o === 'h' ? v.x : v.y));
      st.lot = thing(st, 3, 'item');
      let s = '<svg viewBox="0 0 512 512" width="100%" height="100%" style="pointer-events:none"><rect x="2" y="2" width="508" height="508" rx="18" fill="#9AA3AD" stroke="#2B2118" stroke-width="4"/><rect x="16" y="16" width="480" height="480" fill="#D7DCE3"/>';
      for (let i = 1; i < 5; i++) s += '<path d="M' + (16 + i * 96) + ' 16V496M16 ' + (16 + i * 96) + 'H496" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"/>';
      s += '<rect x="496" y="208" width="16" height="96" fill="#D7DCE3"/></svg>';
      st.lot.innerHTML = s;
      st.exit = thing(st, 4, 'item'); st.exit.innerHTML = '<svg viewBox="0 0 54 72" width="100%" height="100%" style="pointer-events:none"><path d="M6 36H44M30 20L46 36L30 52" fill="none" stroke="#2B2118" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 36H44M30 20L46 36L30 52" fill="none" stroke="#5CC46E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      st.vEls = q.V.map((_, i) => this.vehicle(st, i));
      if (q.ask === 'first') q.V.forEach((v, i) => { if (i) K.reg(st, 'v' + i, st.vEls[i], { drag: true, drops: () => [{ id: 'lot', rect: () => box(st.lot) }] }); });
      else { W5U.cards(st, q.cards.map(n => { const x = UI.num(n, 62); x.style.pointerEvents = 'none'; return x; }), q.cards); st.cards.forEach((c, i) => K.pop(st, c, 60 * i)); }
      this.place(st);
      K.pop(st, st.lot); st.vEls.forEach((e, i) => K.pop(st, e, 40 * i));
      K.task(st, [[{ node: (() => { const d = el('span', ''); d.innerHTML = '<svg viewBox="0 0 90 46" width="90" height="46"><rect x="3" y="6" width="62" height="34" rx="10" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><path d="M68 23H86M78 14L87 23L78 32" fill="none" stroke="#2B2118" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; return d; })() }], ['q']]);
      W3X.say2(st, '卡车要开出去！', q.ask === 'first' ? '先挪哪辆车？' : '最少挪几辆车？');
    },
    /* can car i slide (from now) at all; one that is in the truck's way */
    canGo(st, i, pos) { return parkMoves(st.q.V, pos || st.pos).filter(m => m.i === i); },
    inWay(st, i) { const v = st.q.V[i], p = st.pos[i]; return v.o === 'v' && v.x >= 2 && p <= 2 && p + v.len > 2; },
    onGesture(st, name, p) {
      if (st.picked) return false;
      const id = p.id || '', q = st.q;
      if (q.ask === 'count') return W5U.tapCard(st, name, p);
      const m = /^v(\d)$/.exec(id); if (!m) return false;
      const i = +m[1], e = st.vEls[i];
      if (name === 'drop') {
        /* dragged: it goes that way as far as it can (or bumps) - the car he moved first is his answer */
        const t = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(e.style.transform || ''), v = q.V[i], dd = t ? (v.o === 'h' ? +t[1] : +t[2]) : 0;
        e.style.transform = ''; st.picked = true; this.tryGo(st, i, dd >= 0 ? 1 : -1); Session.submit(st, i); return 'ok';
      }
      if (name !== 'tap') return false;
      st.picked = true; K.pop(st, e); Session.submit(st, i); return 'ok';
    },
    /* slide car i one way as far as it goes (a little bump when it cannot) */
    tryGo(st, i, s) {
      const ms = this.canGo(st, i).filter(m => Math.sign(m.np[i] - st.pos[i]) === s), e = st.vEls[i];
      if (!ms.length) { const v = st.q.V[i], d = (v.o === 'h' ? 'translateX(' : 'translateY(') + (s * 14) + 'px)'; if (!fast()) e.animate([{ transform: 'none' }, { transform: d }, { transform: 'none' }], { duration: 280 }); Sfx.thud && Sfx.thud(); return false; }
      const far = ms.reduce((a, m) => (Math.abs(m.np[i] - st.pos[i]) > Math.abs(a.np[i] - st.pos[i]) ? m : a), ms[0]);
      this.slide(st, i, far.np[i]); return true;
    },
    slide(st, i, to) { const e = st.vEls[i], a = box(e); st.pos[i] = to; this.place(st); const b = box(e); if (!ff(st)) e.animate([{ transform: 'translate(' + (a.x - b.x) + 'px,' + (a.y - b.y) + 'px)' }, { transform: 'none' }], { duration: T(320), easing: EASE.glide }); Sfx.whoosh && Sfx.whoosh(0.15); },
    whyLine(st, i) { return this.inWay(st, i) ? '它被挡住了' : '它不挡卡车'; },
    async feedback(st, ans) {
      if (st.q.ask === 'count') { K.wiggle(st, W5U.cardOf(st, ans)); await fbSay(st, '不是' + CNQ(ans) + '辆'); return; }
      st.pos = st.q.V.map(v => (v.o === 'h' ? v.x : v.y)); this.place(st);
      await fbSay(st, this.whyLine(st, ans));
    },
    /* the cars in the right order, one by one, then the truck drives out */
    async demo(st, gold) {
      const my = st, q = st.q, per = Math.max(260, Math.min(480, 1500 / q.way.length));
      st.pos = q.V.map(v => (v.o === 'h' ? v.x : v.y)); this.place(st);
      for (let k = 0; k < q.way.length; k++) {
        if (!Session.alive(my)) return;
        const s = q.way[k]; this.slide(st, s.i, s.p);
        if (k === 0 && gold) { W5U.gold(st, st.vEls[s.i], 6); await say(st, '先挪这辆'); }
        else if (q.ask === 'count' && st.explaining) await say(st, CNQ(k + 1) + '辆');
        else await st.scope.wait(T(per));
      }
      if (!Session.alive(my)) return;
      const e = st.vEls[0], g = this.geo(st);
      if (!ff(st)) await st.scope.anim(e, [{ transform: 'none' }, { transform: 'translateX(' + (5 * g.u) + 'px)', opacity: 0 }], { duration: T(600), easing: EASE.glide, fill: 'forwards' });
      Sfx.whoosh && Sfx.whoosh(0.3);
    },
    /* 1. his car (card) blue, it tries to go; 2. the right order; 3. the truck out: "卡车开出去了" */
    async explain(st, ans) {
      const my = st, q = st.q;
      if (q.ask === 'count') { const r = W5U.blue(st, W5U.cardOf(st, ans)); await fbDone(st); if (!Session.alive(my)) return; W5U.hide(r); }
      else {
        const r = W5U.blue(st, st.vEls[ans]);
        this.tryGo(st, ans, 1) || this.tryGo(st, ans, -1);
        await fbDone(st); if (!Session.alive(my)) return; W5U.hide(r);
        await st.scope.wait(T(250)); if (!Session.alive(my)) return;
      }
      await W5U.beat(st); if (!Session.alive(my)) return;
      await this.demo(st, q.ask === 'first'); if (!Session.alive(my)) return;
      if (q.ask === 'count') W5U.gold(st, W5U.cardOf(st, q.answer));
      await W5U.sum(st, '卡车开出去了');
      await st.scope.wait(T(100));
    },
    rightEls(st) { return [st.q.ask === 'count' ? W5U.cardOf(st, st.q.answer) : st.vEls[st.q.answer]]; },
    async reveal(st) {
      const my = st, q = st.q; Sfx.reveal();
      W5U.gold(st, q.ask === 'count' ? W5U.cardOf(st, q.answer) : st.vEls[q.answer], 6);
      await this.demo(st, false); if (!Session.alive(my)) return;
      this.cheerAll(st); st.summary = '卡车开出去了'; W5U.sum(st, st.summary);
      await st.scope.wait(T(700));
    },
    next(st, strat) {
      if (st.picked) return null; const q = st.q;
      if (q.ask === 'count') { if (!st.cards) return null; const i = strat === 'wrong' ? q.cards.findIndex(v => v !== q.answer) : q.cards.indexOf(q.answer); return { g: 'tap', p: { id: 'card' + i } }; }
      if (!st.vEls) return null;
      const others = q.V.map((_, i) => i).filter(i => i > 0 && i !== q.answer), i = strat === 'wrong' ? others[st.gen % others.length] : q.answer;
      return { g: 'tap', p: { id: 'v' + i } };
    },
    gestureHint(st) { if (st.q.ask !== 'first') return; const i = st.q.V.findIndex((v, k) => k > 0), a = mid(st.vEls[i]); W3X.tapHint(st, st.vEls[i]); void a; },
    workEls(st) { return st.cards || (st.vEls || []).slice(1); },
    snap(st) { return { pos: (st.pos || []).join(',') }; },
    lines() {
      const out = [this.intro, '卡车要开出去！', '先挪哪辆车？', '最少挪几辆车？', '它被挡住了', '它不挡卡车', '先挪这辆', '卡车开出去了'].concat(this.praise);
      for (let n = 1; n <= 5; n++) out.push('不是' + CNQ(n) + '辆', CNQ(n) + '辆');
      return uniq(out);
    },
  };
})();
/* ================================================================ ⑤ 葫芦娃·积木山 (huluwa5, from level 2): H5 剪纸对折 · H6 几个几个圈 ·
   H7 哪块地大 · H8 千里眼找宝贝 (reasoning). docs/W5-DESIGN.md §5 ⑤. One function, no top-level names: each rule is W5R.<id>,
   registered (background, friends, icon) in games.js. Package C. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C', BLUE = '#4FB3FF';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const R1 = v => Math.round(v * 10) / 10;
  let UID = 0;
  const uid = p => 'h5' + p + (++UID);
  /* a stage rect from screen coordinates */
  const stageRect = (x0, y0, x1, y1) => { const a = Stage.toStage(Math.min(x0, x1), Math.min(y0, y1)), b = Stage.toStage(Math.max(x0, x1), Math.max(y0, y1)); return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }; };
  /* a number badge at a stage point (counting in the explain step) */
  const badgeAt = (st, x, y, n, size) => { size = size || 42; const b = UI.badge(n, size); Stage.el.appendChild(b); b.style.position = 'absolute'; b.style.pointerEvents = 'none'; place(b, Math.round(x - size / 2), Math.round(y - size / 2)); st.els.push(b); st.scope.anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 240, easing: EASE.pop }); return b; };
  /* an svg (viewBox 0 0 100 100) as an icon for the task card */
  const ic = s => W3X.ic(s, 52);
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine). As paw.js. */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));

  /* ================================================================ H5 折！ 剪纸对折 (F10 Special Twins, S5 Kingdom of Origami)
     A red paper cut on the window, five dashed lines across it, a coloured knob (88) at one end of each. "沿哪条线折，两边一样？"
     - tap a knob (or the line: a transparent band 40 on each side). Exactly one line is a line of symmetry.
       L1 one vertical axis, simple outlines (gourd, house, crown, lantern) · L2 the axis vertical or horizontal (a bag) ·
       L3 the outline has two axes, the cut pattern inside only one · L4 the axis is diagonal (a kite, a heart ... turned 45°) ·
       L5 the other way round: five different paper cuts, one line on each, "哪张对折两边一样？" (tap a card).
     The five lines: the axis, the line across it through the middle, a diagonal through the middle, the axis moved off the
     middle, the cross line moved off the middle (all turned with the paper). The right one's place among the five from a bag.
     Wrong: the paper really folds along his line (one half turns over), what does not meet is ringed blue ("这里对不上"), it
     opens again; then it folds along the right line: the halves meet, gold ("两边一样！"). Shapes are drawn from circles,
     ellipses, rounded rectangles and polygons (cut-outs as holes), symmetric about x = 0 in their own frame (±100). */
  const c = (x, y, r) => ['c', x, y, r], e = (x, y, rx, ry, a) => ['e', x, y, rx, ry, a || 0], r = (x, y, w, h, q) => ['r', x, y, w, h, q || 0], p = pts => ['p', pts];
  /* a primitive and its mirror image (x -> -x) */
  const M = q => { const m = q[0] === 'c' ? ['c', -q[1], q[2], q[3]] : q[0] === 'e' ? ['e', -q[1], q[2], q[3], q[4], -q[5]] : q[0] === 'r' ? ['r', -(q[1] + q[3]), q[2], q[3], q[4], q[5]] : ['p', q[1].map(([x, y]) => [-x, y])]; return [q, m]; };
  const flat = a => [].concat(...a.map(q => (Array.isArray(q[0]) ? q : [q])));
  const petals = () => [-90, -18, 54, 126, 198].map(a => c(R1(34 * Math.cos(a * Math.PI / 180)), R1(-38 + 34 * Math.sin(a * Math.PI / 180)), 21));
  const PAPER = {
    gourd: { n: '葫芦', s: flat([c(0, 38, 52), c(0, -30, 34), r(-14, -12, 28, 24, 4), r(-5, -84, 10, 24, 3), M(e(20, -74, 19, 9, -25))]), h: flat([c(0, 42, 15), c(0, -30, 10), M(c(-27, 54, 7))]) },
    house: { n: '小房子', s: flat([p([[0, -94], [88, -18], [-88, -18]]), r(-64, -24, 128, 106, 4)]), h: flat([r(-15, 30, 30, 52, 6), M(r(-50, -4, 26, 24, 3)), c(0, -46, 11)]) },
    crown: { n: '皇冠', s: flat([p([[-82, 44], [-82, -36], [-44, 4], [0, -58], [44, 4], [82, -36], [82, 44]]), c(0, -66, 13), M(c(-82, -44, 12)), r(-82, 40, 164, 30, 6)]), h: flat([c(0, 18, 12), M(p([[-44, 12], [-34, 24], [-44, 36], [-54, 24]]))]) },
    lantern: { n: '灯笼', s: flat([e(0, 0, 74, 56), r(-34, -70, 68, 18, 6), r(-30, 52, 60, 16, 6), r(-4, -96, 8, 28, 3), p([[-12, 66], [12, 66], [22, 104], [-22, 104]])]), h: flat([e(0, 0, 13, 34), M(e(-42, 0, 8, 26))]) },
    butterfly: { n: '蝴蝶', s: flat([e(0, 4, 9, 58), M(e(44, -30, 46, 34, -20)), M(e(36, 36, 32, 26, 25)), M(p([[3, -50], [9, -53], [31, -94], [25, -96]]))]), h: flat([M(c(50, -34, 13)), M(c(38, 38, 9))]) },
    fish: { n: '小鱼', s: flat([e(0, -14, 44, 70), p([[0, 36], [44, 98], [-44, 98]]), M(p([[38, -12], [64, 8], [38, 24]]))]), h: flat([M(c(-17, -52, 8)), c(0, 18, 8), M(e(-16, -4, 6, 11))]) },
    flower: { n: '花', s: flat([c(0, -38, 22)].concat(petals(), [r(-5, -12, 10, 104, 4)], M(e(26, 52, 24, 10, -30)))), h: flat([c(0, -38, 9)]) },
    kite: { n: '风筝', s: flat([p([[0, -100], [62, -30], [0, 94], [-62, -30]])]), h: flat([c(0, -32, 12), M(c(-28, -28, 7)), c(0, 34, 9)]) },
    heart: { n: '心', s: flat([c(-34, -30, 40), c(34, -30, 40), p([[-71, -16], [71, -16], [0, 86]])]), h: flat([c(0, -10, 12)]) },
    /* L3: outlines with two axes (and more); the cut pattern inside keeps only the vertical one */
    oval: { n: '椭圆', s: [e(0, 0, 98, 72)], h: flat([c(-13, -14, 14), c(13, -14, 14), p([[-26, -8], [26, -8], [0, 28]]), M(c(-64, -4, 10))]) },
    plate: { n: '方块', s: [r(-96, -70, 192, 140, 24)], h: flat([p([[0, -50], [32, 2], [-32, 2]]), r(-8, 2, 16, 30, 2), M(c(-62, -38, 9))]) },
    square: { n: '正方', s: [r(-84, -84, 168, 168, 20)], h: flat([p([[0, -60], [40, -16], [15, -16], [15, 46], [-15, 46], [-15, -16], [-40, -16]]), M(c(-54, -54, 11))]) },
    hexagon: { n: '六边', s: [p([[-94, 0], [-47, -82], [47, -82], [94, 0], [47, 82], [-47, 82]])], h: flat([p([[0, -48], [36, -12], [-36, -12]]), r(-26, -12, 52, 42, 2), M(c(-60, 22, 8))]) },
  };
  const H5S = { 1: ['gourd', 'house', 'crown', 'lantern'], 2: ['butterfly', 'fish', 'lantern', 'crown', 'house', 'gourd', 'flower'], 3: ['oval', 'plate', 'square', 'hexagon'], 4: ['kite', 'heart', 'house', 'gourd', 'butterfly', 'fish'], 5: ['gourd', 'house', 'crown', 'lantern', 'butterfly', 'fish', 'flower', 'kite', 'heart'] };
  const OFF = 30;            /* how far the moved lines are off the middle (paper units) */
  const LR = 150;            /* the knobs: on a circle of this radius around the middle (paper units) */
  /* a line in the paper's own frame: direction a (deg, 90 = the axis), offset d along its normal; axis: it is the one */
  const H5LINES = (rng, axisOnly) => [{ a: 90, d: 0, axis: 1 }, { a: 0, d: 0 }, { a: rng.pick([45, 135]), d: 0 }, { a: 90, d: rng.pick([-OFF, OFF]) }, { a: 0, d: rng.pick([-OFF, OFF]) }];
  const rad = a => a * Math.PI / 180;
  const unit = a => [Math.cos(rad(a)), Math.sin(rad(a))], nrm = a => [-Math.sin(rad(a)), Math.cos(rad(a))];
  /* the two points where a line meets the circle of radius rr (paper units) */
  const ends = (ln, rr) => { const u = unit(ln.a), n = nrm(ln.a), h = Math.sqrt(Math.max(0, rr * rr - ln.d * ln.d)); return [1, -1].map(s => [ln.d * n[0] + s * h * u[0], ln.d * n[1] + s * h * u[1]]); };
  const rot = (pt, th) => { const c0 = Math.cos(rad(th)), s0 = Math.sin(rad(th)); return [pt[0] * c0 - pt[1] * s0, pt[0] * s0 + pt[1] * c0]; };
  /* which end of each line carries its knob: the choice that keeps the knobs farthest apart */
  const knobEnds = (lines, rng) => {
    const E = lines.map(l => ends(l, LR));
    let best = null, bs = -1;
    for (let m = 0; m < 1 << lines.length; m++) {
      const P = lines.map((_, i) => E[i][(m >> i) & 1]);
      let mn = 1e9; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) mn = Math.min(mn, Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]));
      const sc = mn + rng() * 4;
      if (sc > bs) { bs = sc; best = m; }
    }
    return lines.map((_, i) => (best >> i) & 1);
  };
  /* draw the primitives into a canvas path (paper units, origin in the middle) */
  const cvPrim = (ctx, q) => {
    ctx.beginPath();
    if (q[0] === 'c') ctx.arc(q[1], q[2], q[3], 0, 2 * Math.PI);
    else if (q[0] === 'e') ctx.ellipse(q[1], q[2], q[3], q[4], rad(q[5]), 0, 2 * Math.PI);
    else if (q[0] === 'r') { if (ctx.roundRect && q[5]) ctx.roundRect(q[1], q[2], q[3], q[4], q[5]); else ctx.rect(q[1], q[2], q[3], q[4]); }
    else { q[1].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
    ctx.fill();
  };
  const svPrim = (q, parent, fill) => {
    if (q[0] === 'c') return svg('circle', { cx: q[1], cy: q[2], r: q[3], fill }, parent);
    if (q[0] === 'e') return svg('ellipse', { cx: 0, cy: 0, rx: q[3], ry: q[4], fill, transform: 'translate(' + q[1] + ' ' + q[2] + ') rotate(' + q[5] + ')' }, parent);
    if (q[0] === 'r') return svg('rect', { x: q[1], y: q[2], width: q[3], height: q[4], rx: q[5], fill }, parent);
    return svg('polygon', { points: q[1].map(x => x.join(',')).join(' '), fill }, parent);
  };
  /* the paper as a mask: white = paper, black = the cut-outs */
  const CV = 260, CH = CV / 2;
  const maskOf = sh => {
    const cv = document.createElement('canvas'); cv.width = CV; cv.height = CV;
    const ctx = cv.getContext('2d'); ctx.translate(CH, CH); ctx.fillStyle = '#fff';
    sh.s.forEach(q => cvPrim(ctx, q));
    ctx.globalCompositeOperation = 'destination-out'; sh.h.forEach(q => cvPrim(ctx, q));
    const d = ctx.getImageData(0, 0, CV, CV).data, m = new Uint8Array(CV * CV);
    for (let i = 0; i < CV * CV; i++) m[i] = d[4 * i + 3] > 127 ? 1 : 0;
    return m;
  };
  /* folded along a line (paper units): the places on the side that stays where the paper does not meet the turned-over half;
     returned as up to two boxes (paper units) round the biggest pieces, and the share of the paper that does not meet */
  const misfit = (sh, ln) => {
    const m = maskOf(sh), n = nrm(ln.a), at = (x, y) => { const i = Math.floor(x + CH), j = Math.floor(y + CH); return i < 0 || j < 0 || i >= CV || j >= CV ? 0 : m[j * CV + i]; };
    const bad = new Uint8Array(CV * CV); let area = 0, nb = 0;
    for (let j = 0; j < CV; j++) for (let i = 0; i < CV; i++) {
      const x = i + 0.5 - CH, y = j + 0.5 - CH, s = x * n[0] + y * n[1] - ln.d;
      const a = m[j * CV + i]; area += a;
      if (s >= 0) continue;
      const b = at(x - 2 * s * n[0], y - 2 * s * n[1]);
      if (a !== b) { bad[j * CV + i] = 1; nb++; }
    }
    /* pieces (4-neighbours) */
    const seen = new Uint8Array(CV * CV), parts = [];
    for (let k = 0; k < CV * CV; k++) {
      if (!bad[k] || seen[k]) continue;
      const q = [k]; seen[k] = 1; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, cnt = 0;
      while (q.length) { const t = q.pop(), x = t % CV, y = (t - x) / CV; cnt++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const xx = x + dx, yy = y + dy, kk = yy * CV + xx; if (xx >= 0 && yy >= 0 && xx < CV && yy < CV && bad[kk] && !seen[kk]) { seen[kk] = 1; q.push(kk); } }); }
      parts.push({ cnt, x: x0 - CH, y: y0 - CH, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    }
    parts.sort((a, b) => b.cnt - a.cnt);
    const big = parts.filter(t => t.cnt >= Math.max(30, nb * 0.12)).slice(0, 2);
    return { share: area ? nb / area : 0, boxes: big.length ? big : parts.slice(0, 1) };
  };
  /* the paper cut (svg group in paper units): a darker copy a little below (the paper's thickness), the red paper; the
     cut-outs are holes of a mask */
  const paperG = (parent, sh, fill, shade) => {
    const g = svg('g', {}, parent), id = uid('m');
    const mk = svg('mask', { id, maskUnits: 'userSpaceOnUse', x: -140, y: -140, width: 280, height: 280 }, g);
    sh.s.forEach(q => svPrim(q, mk, '#fff')); sh.h.forEach(q => svPrim(q, mk, '#000'));
    if (shade) svg('rect', { x: -140, y: -140, width: 280, height: 280, fill: shade, mask: 'url(#' + id + ')', transform: 'translate(2.5 3.5)' }, g);
    svg('rect', { x: -140, y: -140, width: 280, height: 280, fill, mask: 'url(#' + id + ')' }, g);
    return g;
  };
  /* a half plane (paper units): the side where n·x < d (keep) or > d */
  const halfPts = (ln, neg) => { const u = unit(ln.a), n = nrm(ln.a), L = 420, k = neg ? -1 : 1, P = [ln.d * n[0], ln.d * n[1]]; return [[P[0] + u[0] * L, P[1] + u[1] * L], [P[0] - u[0] * L, P[1] - u[1] * L], [P[0] - u[0] * L + k * n[0] * L, P[1] - u[1] * L + k * n[1] * L], [P[0] + u[0] * L + k * n[0] * L, P[1] + u[1] * L + k * n[1] * L]].map(x => x.map(R1).join(',')).join(' '); };
  /* CSS transform that turns the far half over the line: scaleY(s) across it (1 = flat, -1 = folded over) */
  const foldTf = (ln, s) => { const n = nrm(ln.a), P = [R1(ln.d * n[0]), R1(ln.d * n[1])]; return 'translate(' + P[0] + 'px,' + P[1] + 'px) rotate(' + ln.a + 'deg) scaleY(' + s + ') rotate(' + (-ln.a) + 'deg) translate(' + (-P[0]) + 'px,' + (-P[1]) + 'px)'; };
  /* one paper on the stage (or on a card): an svg whose viewBox is in paper units, the paper turned by th. .fold(st, ln)
     folds along a line, .open(st) unfolds, .boxes(rects in paper units) -> stage rects */
  const PaperView = (sh, th, box) => {
    const s = svg('svg', { viewBox: -box + ' ' + -box + ' ' + 2 * box + ' ' + 2 * box, width: '100%', height: '100%' });
    s.style.overflow = 'visible'; s.style.pointerEvents = 'none'; s.style.position = 'absolute'; s.style.left = '0'; s.style.top = '0';
    const root = svg('g', { transform: 'rotate(' + th + ')' }, s);
    const base = paperG(root, sh, '#E23B3B', '#8E1F24');
    const lines = svg('g', {}, root), over = svg('g', {}, root);
    const V = {
      svg: s, root, base, lines, sh, th,
      /* fold along ln: the near half stays, the far half turns over it (a lighter red, so where they do not meet shows) */
      async fold(st, ln, ms) {
        V.open(); const cid = uid('k'), cid2 = uid('k');
        const d1 = svg('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, over); svg('polygon', { points: halfPts(ln, true) }, d1);
        const d2 = svg('clipPath', { id: cid2, clipPathUnits: 'userSpaceOnUse' }, over); svg('polygon', { points: halfPts(ln, false) }, d2);
        const stay = svg('g', { 'clip-path': 'url(#' + cid + ')' }, over); paperG(stay, sh, '#E23B3B', '#8E1F24');
        const flip = svg('g', {}, over); flip.style.transformBox = 'view-box'; flip.style.transformOrigin = '0px 0px';
        const fl = svg('g', { 'clip-path': 'url(#' + cid2 + ')' }, flip); paperG(fl, sh, '#FF8A80', null).setAttribute('opacity', '0.88');
        const E = ends(ln, box * 0.94);
        svg('line', { x1: R1(E[0][0]), y1: R1(E[0][1]), x2: R1(E[1][0]), y2: R1(E[1][1]), stroke: INK, 'stroke-width': 2.5, 'stroke-dasharray': '6 5', opacity: 0.6 }, over);
        base.style.visibility = 'hidden';
        Sfx.whoosh(0.2);
        await st.scope.anim(flip, [{ transform: foldTf(ln, 1) }, { transform: foldTf(ln, -1) }], { duration: ms || 560, easing: EASE.glide, fill: 'forwards' });
        V.flip = flip; V.ln = ln;
      },
      async unfold(st, ms) { if (!V.flip) return; await st.scope.anim(V.flip, [{ transform: foldTf(V.ln, -1) }, { transform: foldTf(V.ln, 1) }], { duration: ms || 280, easing: EASE.glide, fill: 'forwards' }); V.open(); },
      open() { while (over.firstChild) over.removeChild(over.firstChild); base.style.visibility = ''; V.flip = null; },
      /* paper units (unturned frame) -> a stage rect, through the svg's real place on the screen */
      toStage(b) {
        const m = root.getScreenCTM(); if (!m) return null;
        const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
        return stageRect(Math.min(...pts.map(q => q.x)), Math.min(...pts.map(q => q.y)), Math.max(...pts.map(q => q.x)), Math.max(...pts.map(q => q.y)));
      },
    };
    return V;
  };
  const LCOL = ['#4FB3FF', '#5CC46E', '#B57BFF', '#FF9F43', '#FF6FA8'];
  /* a fold icon for the task card */
  const FOLDIC = '<path d="M50 10C30 10 18 30 22 50C26 72 40 86 50 90C60 86 74 72 78 50C82 30 70 10 50 10Z" fill="#E23B3B" stroke="#2B2118" stroke-width="4"/><path d="M50 4V96" stroke="#2B2118" stroke-width="4" stroke-dasharray="7 6"/><path d="M60 30Q78 34 74 52" fill="none" stroke="#2B2118" stroke-width="4"/><path d="M68 50L74 56L79 47" fill="none" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/>';
  W5R.H5 = {
    kind0: 'fold5', verb: '折！', intro: '剪纸对折！', praise: ['两边一模一样！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      if (d === 5) {
        /* five different paper cuts, one line on each: one card's line is its axis */
        const names = rng.shuffle(H5S[5]).slice(0, 5);
        const wrongs = ['H', 'D', 'V', 'Hd'];
        const cards = names.map((nm, i) => {
          const th = rng.pick([0, 0, 90]);
          if (i === 0) return { sh: nm, th, ln: { a: 90, d: 0, axis: 1 } };
          const w = bagPick(G, 'h5w', wrongs);
          const ln = w === 'H' ? { a: 0, d: 0 } : w === 'D' ? { a: rng.pick([45, 135]), d: 0 } : w === 'V' ? { a: 90, d: rng.pick([-OFF, OFF]) } : { a: 0, d: rng.pick([-OFF, OFF]) };
          return { sh: nm, th, ln };
        });
        const deck = W5U.deal(G, cards[0], cards.slice(1), 'h5c');
        const answer = deck.indexOf(cards[0]);
        return { d, k: [d, deck.map(x => x.sh + x.th + x.ln.a + x.ln.d).join('.')], cards: deck, answer };
      }
      const nm = rng.pick(H5S[d]);
      const th = d === 1 ? 0 : d === 4 ? bagPick(G, 'h5t4', [45, -45]) : bagPick(G, 'h5t' + d, [0, 90]);
      const L = H5LINES(rng), axis = L[0];
      const lines = W5U.deal(G, axis, L.slice(1), 'h5l');
      const answer = lines.indexOf(axis);
      return { d, k: [d, nm, th, lines.map(l => l.a + ':' + l.d).join('.')], sh: nm, th, lines, ends: knobEnds(lines.map(l => ({ a: l.a + th, d: l.d })), rng), answer };
    },
    audit(q) {
      if (q.cards) return [{ n: q.cards.length, at: q.answer, right: q.cards.filter(x => x.ln.axis).length }];
      return [{ n: q.lines.length, at: q.answer, right: q.lines.filter(l => l.axis).length }];
    },
    /* landscape: the paper in the middle, the knobs on a circle round it; portrait: lower down. L5: five cards */
    geo(q) {
      const L = K.L();
      if (q.cards) return L ? { s: 168, gap: 18, per: 5, cy: 384 } : { s: 196, gap: 20, per: 3, cy: 540 };
      return L ? { cx: 512, cy: 404, k: 1.52, R: 236 } : { cx: 352, cy: 556, k: 1.62, R: 250 };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const q = st.q, g = this.geo(q);
      if (q.cards) { if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.cy, g.s, g.s, g.gap, 24, g.per); return; }
      if (!st.pap) return;
      const B = LR + 70, S = Math.round(2 * B * g.k);
      place(st.papEl, Math.round(g.cx - S / 2), Math.round(g.cy - S / 2), S, S);
      st.knobs.forEach((kn, i) => { const P = rot(ends({ a: q.lines[i].a, d: q.lines[i].d }, LR)[q.ends[i]], q.th); place(kn, Math.round(g.cx + P[0] * g.k - 46), Math.round(g.cy + P[1] * g.k - 46), 92, 92); });
    },
    /* the lines on the paper: each dashed in its knob's colour over a white edge; a transparent band (40 each side) to tap */
    drawLines(st) {
      const q = st.q, V = st.pap, k = this.geo(q).k;
      while (V.lines.firstChild) V.lines.removeChild(V.lines.firstChild);
      st.bands = q.lines.map((ln, i) => {
        const E = ends(ln, LR), a = E[q.ends[i]], b0 = E[1 - q.ends[i]], b = [a[0] + (b0[0] - a[0]) * 0.92, a[1] + (b0[1] - a[1]) * 0.92];
        const at = { x1: R1(a[0]), y1: R1(a[1]), x2: R1(b[0]), y2: R1(b[1]) };
        svg('line', Object.assign({ stroke: '#fff', 'stroke-width': R1(13 / k), 'stroke-linecap': 'round', opacity: 0.9 }, at), V.lines);
        svg('line', Object.assign({ stroke: LCOL[i], 'stroke-width': R1(8 / k), 'stroke-dasharray': R1(18 / k) + ' ' + R1(11 / k), 'stroke-linecap': 'round' }, at), V.lines);
        const band = svg('line', Object.assign({ stroke: 'rgba(0,0,0,0)', 'stroke-width': 80 / k, 'pointer-events': 'visibleStroke' }, at), V.lines);
        band.style.pointerEvents = 'visibleStroke'; band.style.cursor = 'pointer'; band._box = () => W5U.rect(band);
        Input.bind(band, { id: 'band' + i }); (st.bound || (st.bound = [])).push(band);
        return band;
      });
    },
    knob(st, i) {
      const kn = W2X.thing(st, 92, 92, 8, '');
      kn.innerHTML = '<svg viewBox="0 0 92 92" width="100%" height="100%" style="pointer-events:none"><circle cx="46" cy="46" r="40" fill="' + LCOL[i] + '" stroke="' + INK + '" stroke-width="5"/><circle cx="46" cy="46" r="27" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="9 7"/><circle cx="46" cy="46" r="9" fill="#fff" stroke="' + INK + '" stroke-width="3"/></svg>';
      kn.style.borderRadius = '50%';
      K.reg(st, 'k' + i, kn, {});
      return kn;
    },
    /* a card of L5: the paper with its one line */
    cardPaper(x) {
      const V = PaperView(PAPER[x.sh], x.th, 128);
      const E = ends(x.ln, 118);
      svg('line', { x1: R1(E[0][0]), y1: R1(E[0][1]), x2: R1(E[1][0]), y2: R1(E[1][1]), stroke: '#fff', 'stroke-width': 12, 'stroke-linecap': 'round' }, V.lines);
      svg('line', { x1: R1(E[0][0]), y1: R1(E[0][1]), x2: R1(E[1][0]), y2: R1(E[1][1]), stroke: '#2E6FD8', 'stroke-width': 8, 'stroke-dasharray': '16 10', 'stroke-linecap': 'round' }, V.lines);
      return V;
    },
    present(st) {
      const q = st.q;
      if (q.cards) {
        st.views = q.cards.map(x => this.cardPaper(x));
        W5U.cards(st, st.views.map(() => null), q.cards.map((_, i) => i));
        st.cards.forEach((cd, i) => { const w = el('div', '', cd); Object.assign(w.style, { position: 'relative', width: '86%', height: '86%', pointerEvents: 'none' }); w.appendChild(st.views[i].svg); });
        this.place(st);
        st.cards.forEach((cd, i) => K.pop(st, cd, 70 * i));
        K.task(st, [[ic(FOLDIC)], ['q']]);
        K.say(st, '哪张对折两边一样？');
        return;
      }
      st.papEl = W2X.thing(st, 10, 10, 4, ''); st.papEl.style.pointerEvents = 'none';
      st.pap = PaperView(PAPER[q.sh], q.th, LR + 70);
      st.papEl.appendChild(st.pap.svg);
      st.knobs = q.lines.map((_, i) => this.knob(st, i));
      this.drawLines(st);
      st.mid = svg('circle', { cx: 0, cy: 0, r: R1(34 / this.geo(q).k), fill: 'rgba(0,0,0,0)' }, st.pap.lines); st.mid.style.pointerEvents = 'all';
      this.place(st);
      K.pop(st, st.papEl); st.knobs.forEach((kn, i) => K.pop(st, kn, 120 + 60 * i));
      K.task(st, [[ic(FOLDIC)], ['q']]);
      W3X.say2(st, '沿哪条线折，', '两边一样？');
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const id = p.id || '';
      if (st.q.cards) return W5U.tapCard(st, name, p);
      const m = /^(?:k|band)(\d)$/.exec(id); if (!m) return false;
      const i = +m[1]; st.picked = true; K.pop(st, st.knobs[i]); Session.submit(st, i); return 'ok';
    },
    next(st, strat) {
      const q = st.q; if (st.picked) return null;
      if (q.cards) return W5U.cardNext(st, strat);
      if (!st.knobs) return null;
      const n = q.lines.length, i = strat === 'wrong' ? (q.answer + 1 + (st.gen % (n - 1))) % n : q.answer;
      return { g: 'tap', p: { id: 'k' + i } };
    },
    async feedback(st, ans) {
      const e = st.q.cards ? st.cards[ans] : st.knobs[ans];
      if (e) K.wiggle(st, e);
      W5U.say(st, '两边不一样');
      await st.scope.wait(T(550));
    },
    /* 1. folded along his line: what does not meet, ringed blue ("这里对不上"); 2. open, folded along the right line: the
       halves meet, gold ("两边一样！") */
    async explain(st, ans) {
      const q = st.q, my = st, L5 = !!q.cards;
      const V = L5 ? st.views[ans] : st.pap, ln = L5 ? q.cards[ans].ln : q.lines[ans];
      W5U.blue(st, L5 ? st.cards[ans] : st.knobs[ans]);
      await V.fold(st, ln); if (!Session.alive(my)) return;
      const mf = misfit(V.sh, ln);
      const rings = mf.boxes.map(b => { const R = V.toStage(b); return R ? K.ring(st, [R], 6, BLUE) : null; });
      W5U.note(st, '这里对不上');
      await st.scope.wait(1000); if (!Session.alive(my)) return;
      W5U.hide(rings);
      await V.unfold(st); if (!Session.alive(my)) return;
      const V2 = L5 ? st.views[q.answer] : st.pap, ln2 = L5 ? q.cards[q.answer].ln : q.lines[q.answer];
      await V2.fold(st, ln2); if (!Session.alive(my)) return;
      W5U.gold(st, this.rightEls(st));
      if (!L5) { const R = V2.toStage({ x: -108, y: -108, w: 216, h: 216 }); if (R) K.ring(st, [R], 0, GOLD); }
      await W5U.sum(st, '两边一样！');
      await st.scope.wait(250);
    },
    rightEls(st) { return [st.q.cards ? st.cards[st.q.answer] : st.knobs[st.q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st, L5 = !!q.cards;
      const V = L5 ? st.views[q.answer] : st.pap, ln = L5 ? q.cards[q.answer].ln : q.lines[q.answer];
      await V.fold(st, ln, 600); if (!Session.alive(my)) return;
      W5U.gold(st, this.rightEls(st)); Sfx.reveal();
      this.cheerAll(st);
      st.summary = '两边一样！';
      W5U.sum(st, st.summary);
      await st.scope.wait(T(800));
    },
    workEls(st) { return st.q.cards ? st.cards || [] : st.knobs || []; },
    snap(st) { return { sh: st.q.sh || null, lines: st.q.lines ? st.q.lines.map(l => l.a + ':' + l.d) : null }; },
    lines() { return uniq([this.intro, '沿哪条线折，', '两边一样？', '哪张对折两边一样？', '两边不一样', '这里对不上', '两边一样！'].concat(this.praise)); },
    /* for the shape check (tests): how much of the paper does not meet when folded along each line of a question */
    _misfit(sh, ln) { return misfit(PAPER[sh], ln).share; },
    _shapes() { return Object.keys(PAPER); },
  };

  /* ================================================================ H6 圈！ 几个几个圈 (F8 Rainforest: count by twos / fives; F6
     Squary's Farm: equal groups). Gourds (or peaches) lie on the ground. One stroke of the finger through (or round) k of them
     ties them into a bundle with a vine ("叮", no number); not k: they only wiggle ("要两个一捆" the first time - a word of
     the action, not a mistake). Tapping k of them one by one ties them too. Every bundle tied (the rest fewer than k): five
     number cards.
       L1 4-8 in a row, twos, "一共几个？" · L2 6-12 scattered, twos, "一共几个？" or "圈了几捆？" (a bag) · L3 10-20 in hands of
       five, fives, "一共几个？" · L4 an odd number of them, tied in twos - or in fives with 1-4 over (a bag): one question,
       two asks, two rows of cards: "圈了几捆？" and "还剩几个？" · L5 bundles of five already tied + a few loose (<= 18): no
       tying, "一共几个？".
     Tying can never be wrong (any k make a bundle); the cards are the question (five, the right one's place and rank from
     bags). Wrong: his card blue ("不是八个"); the bundles light up one by one with the count ("二、四、六" / "五、十"), the
     loose ones one by one; the right card gold ("一共七个"). */
  const H6IT = ['gourd', 'peach'];
  const H6S = 92;               /* a thing to tie: >= 88 */
  /* the ground: where the things lie (stage px) */
  const H6F = (d, L) => L ? { x: 40, y: 112, w: 944, h: d === 4 ? 300 : 416 } : { x: 24, y: 214, w: 656, h: d === 4 ? 400 : 500 };
  /* the convex hull (monotone chain) */
  const hull = P => {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = []; p.forEach(q => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    const up = []; p.slice().reverse().forEach(q => { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };
  /* a vine round some points: the hull of a circle round each */
  const ringPath = (cs, rr) => { const S = []; cs.forEach(([x, y]) => { for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; S.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]); } }); const H = hull(S); return 'M' + H.map(q => R1(q[0]) + ' ' + R1(q[1])).join('L') + 'Z'; };
  const inPoly = (pt, P) => { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if (((a.y > pt.y) !== (b.y > pt.y)) && (pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x)) ins = !ins; } return ins; };
  W5R.H6 = {
    kind0: 'group5', verb: '圈！', intro: '两个两个圈！', praise: ['数得真快！'], props: H6IT.slice(),
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, item = rng.pick(H6IT), seed = rng.int(1, 1e9);
      let per = 2, n, ask = 'total', pre = 0;
      if (d === 1) n = bagPick(G, 'h6n1', [4, 6, 8]);
      else if (d === 2) { n = bagPick(G, 'h6n2', [6, 8, 10, 12]); ask = bagPick(G, 'h6a2', ['total', 'groups']); }
      else if (d === 3) { per = 5; n = bagPick(G, 'h6n3', [10, 15, 20]); }
      else if (d === 4) { per = bagPick(G, 'h6p4', [2, 5]); n = per === 2 ? bagPick(G, 'h6n4', [5, 7, 9, 11]) : bagPick(G, 'h6m4', [6, 7, 8, 9, 11, 12, 13, 14]); }
      else { per = 5; pre = bagPick(G, 'h6b5', [1, 2, 3]); n = 5 * pre + rng.int(1, pre === 3 ? 3 : 4); }
      const groups = Math.floor(n / per), left = n % per;
      const q = { d, n, per, item, seed, pre, groups, left, lay: d === 1 ? 'row' : d === 3 ? 'palm' : d === 5 ? 'tied' : 'scatter' };
      if (d === 4) {
        const optsA = W5U.nums(G, groups, 1, 10), optsB = W5U.nums(G, left, 0, 4);
        return Object.assign(q, { k: [d, n, per, item, seed % 997], asks: 2, ask: 'groups', ask2: 'left', optsA, optsB, answer: groups + ',' + left });
      }
      const ans = ask === 'groups' ? groups : n;
      return Object.assign(q, { k: [d, n, per, ask, item, seed % 997], ask, answer: ans, opts: ask === 'groups' ? W5U.nums(G, ans, 1, 10) : W5U.nums(G, ans, 1, 20) });
    },
    audit(q) {
      const one = (opts, v) => ({ n: opts.length, at: opts.indexOf(v), right: opts.filter(x => x === v).length });
      if (q.asks === 2) return [one(q.optsA, q.groups), one(q.optsB, q.left)];
      return [one(q.opts, q.answer)];
    },
    decor(G) { W3X.decor2(G, this.chars); },
    /* where each thing lies (stage centres): from the question's own seed, so a turn of the iPad keeps the same picture */
    spots(q) {
      const L = K.L(), F = H6F(q.d, L), rr = RNG(q.seed), n = q.n, cx = F.x + F.w / 2, cy = F.y + F.h / 2, out = [];
      const five = (x, y, pt, flip) => [[-1, -0.5], [0, -0.5], [1, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([u, v]) => out.push([x + u * pt, y + (flip ? -v : v) * pt]));
      if (q.lay === 'row') {
        const two = !L && n > 6, per = two ? Math.ceil(n / 2) : n, pitch = Math.min(two ? 150 : 124, (F.w - 20) / per);
        for (let i = 0; i < n; i++) { const r = two ? Math.floor(i / per) : 0, c = i - r * per; out.push([cx + (c - (per - 1) / 2) * pitch, cy + (two ? (r - 0.5) * 150 : 0)]); }
        return out;
      }
      if (q.lay === 'tied') {
        const m = q.pre, loose = n - 5 * m, cw = 224, top = L ? F.y + F.h * 0.33 : F.y + F.h * 0.26;
        const C = !L && m === 3 ? [[cx - cw / 2, top], [cx + cw / 2, top], [cx, top + 170]] : Array.from({ length: m }, (_, j) => [cx + (j - (m - 1) / 2) * cw, top]);
        C.forEach(([x, y]) => five(x, y, 72, rr() < 0.5));
        const ly = L ? F.y + F.h * 0.8 : (m === 3 ? F.y + F.h * 0.9 : F.y + F.h * 0.66);
        for (let i = 0; i < loose; i++) out.push([cx + (i - (loose - 1) / 2) * 84, ly]);
        return out;
      }
      if (q.lay === 'palm') {
        const m = n / 5, cw = 320;
        const C = m === 4 ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([u, v]) => [cx + u * (L ? 170 : 166), cy + v * (L ? 105 : 118)])
          : L ? Array.from({ length: m }, (_, j) => [cx + (j - (m - 1) / 2) * cw, cy])
            : m === 3 ? [[cx - 166, cy - 118], [cx + 166, cy - 118], [cx, cy + 118]] : [[cx - 166, cy], [cx + 166, cy]];
        rr.shuffle(C).forEach(([x, y]) => five(x, y, 100, rr() < 0.5));
        return out;
      }
      /* scattered: a jittered grid */
      const cols = L ? 7 : (q.d === 4 ? 5 : 4), rows = L ? (q.d === 4 ? 2 : 3) : (q.d === 4 ? 3 : 4), cw = F.w / cols, ch = F.h / rows;
      const cells = rr.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
      const jx = Math.max(0, (cw - H6S - 26) / 2), jy = Math.max(0, (ch - H6S - 26) / 2);
      cells.forEach(k => { const c = k % cols, r = (k - c) / cols; out.push([F.x + (c + 0.5) * cw + (rr() * 2 - 1) * jx, F.y + (r + 0.5) * ch + (rr() * 2 - 1) * jy]); });
      return out;
    },
    /* the cards: one row under the ground; L4 two rows (几捆 / 剩几个) */
    cardGeo(q) {
      const L = K.L();
      if (q.asks === 2) return L ? { s: 100, gap: 14, cy: [486, 610] } : { s: 108, gap: 12, cy: [690, 822] };
      return L ? { s: 116, gap: 18, cy: [612] } : { s: 120, gap: 12, cy: [830] };
    },
    cardSpot(st) { const g = this.cardGeo(st.q); return { cx: Stage.W / 2, cy: g.cy[0], size: g.s, gap: g.gap }; },
    place(st) {
      const q = st.q; if (!st.items) return;
      const P = this.spots(q), S = q.lay === 'tied' ? 66 : H6S;
      st.items.forEach((it, i) => { it.c = P[i]; place(it.el, Math.round(P[i][0] - S / 2), Math.round(P[i][1] - S / 2), S, S); });
      if (st.pad) { const F = H6F(q.d, K.L()); place(st.pad, F.x, F.y, F.w, F.h); }
      if (st.vineEl) place(st.vineEl, 0, 0, Stage.W, Stage.H);
      if (st.vineSvg) { st.vineSvg.setAttribute('viewBox', '0 0 ' + Stage.W + ' ' + Stage.H); this.drawVines(st); }
      const g = this.cardGeo(q);
      [st.cards, st.cardsB].forEach((row, r) => { if (row) W5U.lay(row, Stage.W / 2, g.cy[r], g.s, g.s, g.gap); });
      (st.rowIc || []).forEach((e, r) => { const L = K.L(), x = Stage.W / 2 - (5 * g.s + 4 * g.gap) / 2 - (L ? 52 : 0); if (L) { e.style.display = ''; place(e, Math.round(x - 30), Math.round(g.cy[r] - 30), 60, 60); } else e.style.display = 'none'; });
    },
    /* a vine round every bundle (gold while it is counted) */
    drawVines(st) {
      const s = st.vineSvg; while (s.firstChild) s.removeChild(s.firstChild);
      st.bundles.forEach((b, j) => {
        const d = ringPath(b.map(i => st.items[i].c), st.q.lay === 'tied' ? 44 : st.q.lay === 'palm' ? 52 : 58), lit = st.lit === j;
        const g = svg('g', {}, s);
        svg('path', { d, fill: lit ? 'rgba(255,201,60,.22)' : 'rgba(92,196,110,.14)', stroke: lit ? GOLD : '#2F7D32', 'stroke-width': lit ? 12 : 9, 'stroke-linejoin': 'round' }, g);
        svg('path', { d, fill: 'none', stroke: lit ? '#FFF3B0' : '#7BD389', 'stroke-width': 3.5, 'stroke-dasharray': '10 9', 'stroke-linejoin': 'round' }, g);
        b.el = g;
      });
      if (st.trail && st.trk) s.appendChild(st.trail);
    },
    present(st) {
      const q = st.q;
      st.bundles = []; st.pick = []; st.lit = -1;
      st.vineEl = W2X.thing(st, Stage.W, Stage.H, 5, ''); st.vineEl.style.pointerEvents = 'none';
      st.vineSvg = svg('svg', { viewBox: '0 0 ' + Stage.W + ' ' + Stage.H, width: '100%', height: '100%' }, st.vineEl); st.vineSvg.style.overflow = 'visible';
      st.trail = svg('polyline', { points: '', fill: 'none', stroke: 'rgba(47,125,50,.55)', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      st.items = Array.from({ length: q.n }, (_, i) => {
        const e = W2X.thing(st, H6S, H6S, 6, ''); const im = W5U.propImg(q.item); e.appendChild(im);
        Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' });
        const it = { el: e, id: 'g' + i, c: [0, 0] };
        if (q.lay !== 'tied') K.reg(st, it.id, e, { sweep: () => this.regions(st) });
        return it;
      });
      if (q.lay === 'tied') { for (let j = 0; j < q.pre; j++) st.bundles.push([0, 1, 2, 3, 4].map(k => 5 * j + k)); }
      else {
        st.pad = W2X.thing(st, 10, 10, 4, ''); st.pad.style.borderRadius = '28px';
        Input.bind(st.pad, { id: 'pad', sweep: () => this.regions(st) }); (st.bound || (st.bound = [])).push(st.pad);
        this.track(st);
      }
      this.place(st);
      st.items.forEach((it, i) => K.pop(st, it.el, Math.min(600, 30 * i)));
      if (q.lay === 'tied') { this.ask(st); return; }
      K.task(st, [[W5U.prop(q.item)], [ic(this.tieIc(q.per))], ['q']]);
      K.say(st, q.per === 5 ? '五个五个圈！' : '两个两个圈！');
    },
    /* the task card's picture of a bundle: two (or five) round things in a vine */
    tieIc(k) { const pts = k === 2 ? [[34, 50], [66, 50]] : [[26, 38], [50, 38], [74, 38], [38, 64], [62, 64]], r = k === 2 ? 15 : 11; return pts.map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#8BC34A" stroke="#2B2118" stroke-width="3.5"/>').join('') + '<path d="' + ringPath(pts, r + 9) + '" fill="none" stroke="#2F7D32" stroke-width="5"/>'; },
    /* the finger's own path (a real pointer): through which things it went, and which it went round */
    track(st) {
      const add = e => {
        const t = st.trk; if (!t || !t.live || e.pointerId !== t.id) return;
        const p = Input.pt(e), l = t.pts[t.pts.length - 1], m = Math.ceil(Math.hypot(p.x - l.x, p.y - l.y) / 8);
        for (let k = 1; k <= m; k++) t.pts.push({ x: l.x + (p.x - l.x) * k / m, y: l.y + (p.y - l.y) * k / m });
        if (t.pts.length > 900) t.pts.splice(1, t.pts.length - 900);
        this.drawTrail(st);
      };
      st.scope.on(Stage.el, 'pointerdown', e => { if (st.cards || st.picked || st.allTied) return; st.trk = { pts: [Input.pt(e)], id: e.pointerId, live: true, t: now() }; if (!st.trail.parentNode) st.vineSvg.appendChild(st.trail); this.drawTrail(st); });
      st.scope.on(window, 'pointermove', add);
      st.scope.on(window, 'pointerup', e => { const t = st.trk; if (t && e.pointerId === t.id) { t.live = false; st.scope.timeout(() => { if (st.trk === t) { st.trk = null; this.drawTrail(st); } }, 140); } });
    },
    drawTrail(st) { const t = st.trk; st.trail.setAttribute('points', t && t.pts.length > 1 ? t.pts.map(q => R1(q.x) + ',' + R1(q.y)).join(' ') : ''); },
    free(st) { const tied = new Set([].concat(...st.bundles)); return st.items.map((_, i) => i).filter(i => !tied.has(i)); },
    regions(st) { return this.free(st).map(i => ({ id: 'g' + i, rect: () => box(st.items[i].el) })); },
    /* which free things a path touches or goes round */
    hit(st, pts) {
      const F = this.free(st), out = new Set();
      F.forEach(i => { const b = box(st.items[i].el), m = b.w * 0.06; if (pts.some(q => q.x >= b.x + m && q.x <= b.x + b.w - m && q.y >= b.y + m && q.y <= b.y + b.h - m)) out.add(i); });
      let len = 0; for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
      const a = pts[0], z = pts[pts.length - 1];
      /* a loop: what it goes round (most of a thing inside it) - not what its line only grazes */
      if (len > 200 && Math.hypot(a.x - z.x, a.y - z.y) < Math.max(110, len * 0.25)) {
        const inside = F.filter(i => { const b = box(st.items[i].el); let k = 0; [0.2, 0.5, 0.8].forEach(u => [0.2, 0.5, 0.8].forEach(v => { if (inPoly({ x: b.x + u * b.w, y: b.y + v * b.h }, pts)) k++; })); return k >= 4; });
        if (inside.length) return inside;
      }
      return Array.from(out);
    },
    /* k free things: a bundle; else they wiggle */
    tie(st, ids) {
      const q = st.q, F = new Set(this.free(st)); ids = uniq(ids).filter(i => F.has(i));
      st.pick.forEach(i => this.mark(st, i, false)); st.pick = [];
      if (!ids.length) return 'free';
      /* in hands of five (L3) a bundle is one hand: five from different hands only wiggle (the vines would cross) */
      const mixed = q.lay === 'palm' && ids.length === q.per && ids.some(i => Math.floor(i / 5) !== Math.floor(ids[0] / 5));
      if (ids.length !== q.per || mixed) {
        ids.forEach(i => K.wiggle(st, st.items[i].el));
        if (mixed) return 'ok';
        if (!st.saidK) { st.saidK = true; Voice.say(q.per === 5 ? '要五个一捆' : '要两个一捆', { tag: 'fix' }); }
        return 'ok';
      }
      st.bundles.push(ids.slice().sort((a, b) => a - b));
      this.drawVines(st);
      const b = st.bundles[st.bundles.length - 1];
      if (b.el) st.scope.anim(b.el, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
      ids.forEach(i => K.hop(st, st.items[i].el, 10));
      Sfx.mar(1319, 0, 0.32, 0.4); Sfx.mar(1760, 0.08, 0.3, 0.3);
      if (this.free(st).length < q.per) { st.allTied = true; st.scope.timeout(() => { if (Session.alive(st) && !st.cards) this.ask(st); }, 420); }
      return 'ok';
    },
    mark(st, i, on) { const e = st.items[i].el; e.style.background = on ? 'rgba(255,255,255,.7)' : ''; e.style.boxShadow = on ? '0 0 0 5px #2F7D32' : ''; },
    /* every bundle tied: the cards (and the question) */
    ask(st) {
      const q = st.q, g = this.cardGeo(q);
      const row = (vals, idp, r) => vals.map((v, i) => { const c = UI.card(v, g.s, { layout: 'frame' }); Stage.el.appendChild(c); c.style.position = 'absolute'; K.reg(st, idp + i, c, {}); st.els.push(c); K.pop(st, c, 60 * i + 120 * r); return c; });
      if (st.pad) st.pad.style.pointerEvents = 'none';
      if (st.trk) { st.trk = null; this.drawTrail(st); }
      if (q.asks === 2) {
        st.cards = row(q.optsA, 'card', 0); st.opts = q.optsA.slice();
        st.cardsB = row(q.optsB, 'cardb', 1); st.optsB = q.optsB.slice();
        st.cardsB.forEach(c => { c.style.opacity = '.45'; c.style.pointerEvents = 'none'; });
        st.rowIc = [this.rowIcon(st, true), this.rowIcon(st, false)];
        this.place(st);
        W5U.twoStart(st, 2); this.askK(st, 0);
        return;
      }
      st.cards = row(q.opts, 'card', 0); st.opts = q.opts.slice();
      this.place(st);
      $$('.task', Stage.el).forEach(t => t.remove());
      if (q.lay === 'tied') { K.task(st, [[W5U.prop(q.item)], [ic(this.tieIc(5))], ['q']]); W3X.say2(st, '五个一捆，', '一共几个？'); }
      else { K.task(st, [[W5U.prop(q.item)], ['q']]); K.say(st, q.ask === 'groups' ? '圈了几捆？' : '一共几个？'); }
    },
    rowIcon(st, tied) { const e = W2X.thing(st, 60, 60, 6, ''); e.style.pointerEvents = 'none'; e.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%">' + (tied ? this.tieIc(2) : '<circle cx="50" cy="50" r="18" fill="#8BC34A" stroke="#2B2118" stroke-width="4"/>') + '</svg>'; return e; },
    askK(st, k) {
      const q = st.q;
      if (k === 1) { st.cards.forEach(c => { c.style.opacity = '.55'; c.style.pointerEvents = 'none'; }); st.cardsB.forEach(c => { c.style.opacity = ''; c.style.pointerEvents = ''; }); }
      $$('.task', Stage.el).forEach(t => t.remove());
      const t = K.task(st, [[k === 0 ? ic(this.tieIc(q.per)) : W5U.prop(q.item)], ['q']]); W5U.pips(st, t, k);
      K.say(st, k === 0 ? '圈了几捆？' : '还剩几个？');
    },
    onGesture(st, name, p) {
      const q = st.q, id = p.id || '';
      if (st.picked) return false;
      if (st.cards) {
        if (name !== 'tap') return false;
        const a = /^card(\d)$/.exec(id), b = /^cardb(\d)$/.exec(id);
        if (q.asks !== 2) { if (!a) return false; st.picked = true; K.pop(st, st.cards[+a[1]]); Session.submit(st, st.opts[+a[1]]); return 'ok'; }
        const k = st.fill.indexOf(null);
        if (k === 0 && a) { const c = st.cards[+a[1]]; c.style.boxShadow = '0 0 0 6px #5CC46E, var(--stk)'; K.pop(st, c); return W5U.twoPut(st, String(st.opts[+a[1]]), n => this.askK(st, n)); }
        if (k === 1 && b) { K.pop(st, st.cardsB[+b[1]]); return W5U.twoPut(st, String(st.optsB[+b[1]])); }
        return false;
      }
      if (st.allTied || q.lay === 'tied') return false;
      if (name === 'sweep') {
        const t = st.trk, real = t && t.pts.length > 1 && now() - t.t < 30000;
        const ids = real ? this.hit(st, t.pts) : (p.ids || []).map(x => +String(x).slice(1)).filter(x => x >= 0);
        if (real) t.live = false;
        return this.tie(st, ids);
      }
      const m = /^g(\d+)$/.exec(id);
      if (name === 'tap' && m) {
        const i = +m[1]; if (!this.free(st).includes(i)) { K.hop(st, st.items[i].el, 8); return 'free'; }
        if (st.pick.includes(i)) { st.pick = st.pick.filter(x => x !== i); this.mark(st, i, false); Sfx.back(); return 'ok'; }
        st.pick.push(i); this.mark(st, i, true); Sfx.place();
        if (st.pick.length === q.per) { const ids = st.pick.slice(); return this.tie(st, ids); }
        return 'ok';
      }
      return false;
    },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.items) return null;
      if (st.cards) {
        if (q.asks !== 2) { const i = strat === 'wrong' ? st.opts.findIndex(v => v !== q.answer) : st.opts.indexOf(q.answer); return { g: 'tap', p: { id: 'card' + i } }; }
        const k = st.fill.indexOf(null); if (k < 0) return null;
        const want = +String(q.answer).split(',')[k], opts = k === 0 ? st.opts : st.optsB, bad = strat === 'wrong' && k === st.gen % 2;
        const i = bad ? opts.findIndex(v => v !== want) : opts.indexOf(want);
        return { g: 'tap', p: { id: (k === 0 ? 'card' : 'cardb') + i } };
      }
      if (st.allTied || q.lay === 'tied') return null;
      const F = this.free(st); if (F.length < q.per) return null;
      /* the first free one and its nearest free neighbours */
      const c0 = st.items[F[0]].c, dist = i => Math.hypot(st.items[i].c[0] - c0[0], st.items[i].c[1] - c0[1]);
      const near = q.lay === 'palm' ? F.filter(i => Math.floor(i / 5) === Math.floor(F[0] / 5)) : F.slice().sort((a, b) => dist(a) - dist(b)).slice(0, q.per);
      const cx = near.reduce((s, i) => s + st.items[i].c[0], 0) / q.per, cy = near.reduce((s, i) => s + st.items[i].c[1], 0) / q.per;
      return { g: 'sweep', p: { id: 'pad', ids: near.map(i => 'g' + i) }, x: cx, y: cy };
    },
    /* the hand shows how to tie (a stroke through two things) - never which card */
    gestureHint(st) {
      if (st.cards || st.allTied) return; const n = this.next(st, 'right'); if (!n || n.g !== 'sweep') return;
      const A = n.p.ids.map(id => st.items[+id.slice(1)].c);
      Hand.busy++; Hand.drag(st.scope, A[0][0], A[0][1], A[A.length - 1][0], A[A.length - 1][1]).then(() => { Hand.done(); Hand.hide(st.scope); });
    },
    lineNot(ask, v) { return ask === 'groups' ? '不是' + CNQ(v) + '捆' : ask === 'left' ? '不是剩' + CNQ(v) + '个' : '不是' + CNQ(v) + '个'; },
    lineRight(ask, v) { return ask === 'groups' ? '圈了' + CNQ(v) + '捆' : ask === 'left' ? W5U.left(v, '个') : W5U.all(v, '个'); },
    bad(st, ans) { return st.q.asks === 2 ? W5U.twoBad(st, ans) : (ans === st.q.answer ? [] : [0]); },
    askOf(q, k) { return q.asks === 2 ? (k === 0 ? 'groups' : 'left') : q.ask; },
    chosenCard(st, ans, k) { const q = st.q; if (q.asks !== 2) return W5U.cardOf(st, ans); const v = +String(ans).split(',')[k]; return k === 0 ? st.cards[st.opts.indexOf(v)] : st.cardsB[st.optsB.indexOf(v)]; },
    rightCard(st, k) { const q = st.q; if (q.asks !== 2) return W5U.cardOf(st, q.answer); return k === 0 ? st.cards[st.opts.indexOf(q.groups)] : st.cardsB[st.optsB.indexOf(q.left)]; },
    async feedback(st, ans) {
      const q = st.q, k = this.bad(st, ans)[0] || 0, c = this.chosenCard(st, ans, k), v = q.asks === 2 ? +String(ans).split(',')[k] : ans;
      if (c) K.wiggle(st, c);
      W5U.say(st, this.lineNot(this.askOf(q, k), v));
      await st.scope.wait(T(550));
    },
    /* the count the explanation shows: bundle by bundle ("二、四、六"; "一、二、三" for how many bundles), then the loose ones */
    async countUp(st, ask) {
      const q = st.q, my = st, lo = this.free(st), up = q.lay === 'tied' ? 50 : 64;
      /* the bundles in reading order (rows top to bottom, each left to right), whatever order he tied them in */
      const cen = b => [b.reduce((s, i) => s + st.items[i].c[0], 0) / b.length, b.reduce((s, i) => s + st.items[i].c[1], 0) / b.length];
      const order = st.bundles.map((b, j) => j).sort((a, b) => { const A = cen(st.bundles[a]), Bc = cen(st.bundles[b]); return Math.round(A[1] / 120) - Math.round(Bc[1] / 120) || A[0] - Bc[0]; });
      if (ask !== 'left') {
        for (let jj = 0; jj < order.length; jj++) {
          if (!Session.alive(my)) return;
          const j = order[jj]; st.lit = j; this.drawVines(st);
          const cs = st.bundles[j].map(i => st.items[i].c), top = Math.min(...cs.map(c => c[1])) - up, mx = cs.reduce((s, c) => s + c[0], 0) / cs.length;
          const v = ask === 'groups' ? jj + 1 : (jj + 1) * q.per;
          badgeAt(st, mx, Math.max(30, top), v, 44); st.bundles[j].forEach(i => K.hop(st, st.items[i].el, 10));
          await Count.beat(st.scope, 240, v);
        }
        st.lit = -1; this.drawVines(st);
      }
      if (ask === 'groups') return;
      /* the loose ones: a tick each, the last one said (the total) */
      let v = ask === 'left' ? 0 : st.bundles.length * q.per;
      for (let j = 0; j < lo.length; j++) {
        if (!Session.alive(my)) return;
        v++; const i = lo[j], c = st.items[i].c; badgeAt(st, c[0], c[1] - up + 6, v, 40); K.hop(st, st.items[i].el, 10);
        if (j === lo.length - 1) await Count.beat(st.scope, 260, v); else { Sfx.count(Math.min(20, v)); await st.scope.wait(220); }
      }
    },
    /* 1. his card blue + what it is not; 2. the bundles counted (and the loose ones), the right card gold + the answer */
    async explain(st, ans) {
      const q = st.q, my = st, bad = this.bad(st, ans), k = bad[0] || 0, ask = this.askOf(q, k);
      W5U.blue(st, bad.map(j => this.chosenCard(st, ans, j)));
      await fbDone(st); if (!Session.alive(my)) return;
      await this.countUp(st, ask); if (!Session.alive(my)) return;
      W5U.gold(st, bad.map(j => this.rightCard(st, j)));
      await W5U.sum(st, this.lineRight(ask, ask === 'groups' ? q.groups : ask === 'left' ? q.left : q.n));
    },
    rightEls(st, ans) { return this.bad(st, ans).map(j => this.rightCard(st, j)); },
    async reveal(st) {
      const q = st.q, ks = q.asks === 2 ? [0, 1] : [0];
      W5U.gold(st, ks.map(j => this.rightCard(st, j))); Sfx.reveal();
      st.lit = -1; (st.bundles || []).forEach((b, j) => { if (b.el) st.scope.anim(b.el, [{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }], { duration: 500, delay: 90 * j }); });
      this.cheerAll(st);
      st.summary = this.lineRight(this.askOf(q, ks[ks.length - 1]), q.asks === 2 ? q.left : q.answer);
      W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.cards ? st.cards.concat(st.cardsB || []) : (st.items || []).map(it => it.el); },
    snap(st) { return { n: st.q.n, tied: (st.bundles || []).length }; },
    lines() {
      const out = [this.intro, '五个五个圈！', '一共几个？', '圈了几捆？', '还剩几个？', '五个一捆，', '要两个一捆', '要五个一捆'].concat(this.praise);
      /* the cards: totals 1-20, bundles 1-10, left over 0-4; the right answers: totals 4-20, bundles 2-7, left over 1-4 */
      for (let v = 1; v <= 20; v++) out.push(this.lineNot('total', v));
      for (let v = 4; v <= 20; v++) out.push(this.lineRight('total', v));
      for (let v = 1; v <= 10; v++) out.push(this.lineNot('groups', v));
      for (let v = 2; v <= 7; v++) out.push(this.lineRight('groups', v));
      for (let v = 0; v <= 4; v++) out.push(this.lineNot('left', v));
      for (let v = 1; v <= 4; v++) out.push(this.lineRight('left', v));
      return uniq(out);
    },
  };

  /* ================================================================ H7 比！ 哪块地大 (F9 Fruit Party: compare areas; S14 Who Is
     Taller?: measure with a unit). Grandpa's five vegetable plots seen from above, each made of little squares, a fence round
     it, a vegetable sign. Tap a plot.
       L1 five rectangles of 2-6 squares, all different: "哪块地最大？" · L2 L, T, long strips, 3-8 squares; the biggest or the
       smallest (a bag); the plot that looks longest is not the biggest (and the smallest is not the most compact) · L3 "哪两块
       一样大？": exactly two plots have the same number of squares, in different shapes - tap two (1 in 10 at random) · L4
       half squares cut on the diagonal ("两个半格，一格"), the biggest or the smallest · L5 one big irregular plot (6-12
       squares, with halves): "这块地有几格？" - five number cards.
     The squares are drawn (L1-L3 solid lines, L4-L5 faint dashed). Every plot of a question has the same square size.
     Wrong: his plot ringed blue, its squares light up one by one with their numbers, two halves together making one ("这块是
     五格"); then the right plot the same way, gold ("七格最大！"). */
  const H7VEG = ['broccoli', 'carrot', 'radish', 'pumpkin', 'corn', 'eggplant', 'tomato'];
  /* a half square: 1 ◤ 2 ◥ 3 ◢ 4 ◣ (which corner of the unit square it fills) */
  const HALF = { 1: [[0, 0], [1, 0], [0, 1]], 2: [[0, 0], [1, 0], [1, 1]], 3: [[1, 0], [1, 1], [0, 1]], 4: [[0, 0], [1, 1], [0, 1]] };
  const cellPoly = ([c, r, t]) => (t ? HALF[t] : [[0, 0], [1, 0], [1, 1], [0, 1]]).map(([x, y]) => [c + x, r + y]);
  const area2 = cells => cells.reduce((s, x) => s + (x[2] ? 1 : 2), 0);              /* in half squares */
  const ext = cells => { const w = Math.max(...cells.map(x => x[0])) + 1, h = Math.max(...cells.map(x => x[1])) + 1; return { w, h, e: Math.max(w, h) }; };
  const normC = cells => { const x0 = Math.min(...cells.map(x => x[0])), y0 = Math.min(...cells.map(x => x[1])); return cells.map(x => [x[0] - x0, x[1] - y0, x[2] || 0]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  /* a random piece of n squares inside mw x mh */
  const grow = (rng, n, mw, mh) => {
    for (let t = 0; t < 300; t++) {
      const S = new Map([['0:0', [0, 0]]]); let tries = 0;
      while (S.size < n && tries++ < 400) {
        const cand = []; S.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ':' + (y + dy); if (!S.has(k)) cand.push([x + dx, y + dy]); }));
        const c = rng.pick(cand), all = Array.from(S.values()).concat([c]);
        const w = Math.max(...all.map(a => a[0])) - Math.min(...all.map(a => a[0])) + 1, h = Math.max(...all.map(a => a[1])) - Math.min(...all.map(a => a[1])) + 1;
        if ((w <= mw && h <= mh) || (w <= mh && h <= mw)) S.set(c.join(':'), c);
      }
      if (S.size === n) { let out = normC(Array.from(S.values())); const e = ext(out); if (e.w > mw) out = normC(out.map(([x, y]) => [y, x, 0])); return out; }
    }
    return normC(Array.from({ length: n }, (_, i) => [i % mw, Math.floor(i / mw)]));
  };
  const rect = (w, h) => normC(Array.from({ length: w * h }, (_, i) => [i % w, Math.floor(i / w), 0]));
  /* nh half squares added round a piece: each one leans on a full square by one of its two short sides */
  const addHalves = (rng, cells, nh, mw, mh) => {
    for (let t = 0; t < 200; t++) {
      const out = cells.map(x => x.slice()), used = new Set(out.map(x => x[0] + ':' + x[1]));
      let ok = true;
      for (let k = 0; k < nh && ok; k++) {
        const cand = [];
        out.filter(x => !x[2]).forEach(([x, y]) => [[1, 0, [1, 4]], [-1, 0, [2, 3]], [0, 1, [1, 2]], [0, -1, [4, 3]]].forEach(([dx, dy, ts]) => {
          /* the empty square at (x+dx, y+dy) leans on (x, y): its side towards (x, y) must be a short side of the triangle */
          const key = (x + dx) + ':' + (y + dy); if (!used.has(key)) ts.forEach(tt => cand.push([x + dx, y + dy, tt]));
        }));
        const fit = cand.filter(c => { const all = out.concat([c]), w = Math.max(...all.map(a => a[0])) - Math.min(...all.map(a => a[0])) + 1, h = Math.max(...all.map(a => a[1])) - Math.min(...all.map(a => a[1])) + 1; return w <= mw && h <= mh; });
        if (!fit.length) { ok = false; break; }
        const c = rng.pick(fit); out.push(c); used.add(c[0] + ':' + c[1]);
      }
      if (ok) return normC(out);
    }
    return null;
  };
  /* the counting units of a plot: every full square, then the halves two by two (nearest first) */
  const units = cells => {
    const full = cells.map((x, i) => i).filter(i => !cells[i][2]), halves = cells.map((x, i) => i).filter(i => cells[i][2]);
    const U = full.map(i => [i]), left = halves.slice(), cen = i => { const P = cellPoly(cells[i]); return [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]; };
    while (left.length > 1) { const a = left.shift(); let bi = 0, bd = 1e9; left.forEach((b, j) => { const d = Math.hypot(cen(a)[0] - cen(b)[0], cen(a)[1] - cen(b)[1]); if (d < bd) { bd = d; bi = j; } }); U.push([a, left.splice(bi, 1)[0]]); }
    return U.map(u => ({ cells: u, at: cen(u[0]), pair: u.length === 2 ? [cen(u[0]), cen(u[1])] : null }));
  };
  const sig = cells => cells.map(x => x.join('')).join('.');
  W5R.H7 = {
    kind0: 'area5', verb: '比！', intro: '爷爷的菜地！', praise: ['比得真准！'], props: H7VEG.slice(),
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, veg = rng.shuffle(H7VEG).slice(0, 5);
      if (d === 5) {
        for (let t = 0; t < 200; t++) {
          const nh = rng.pick([2, 4]), A = rng.int(6, 12), full = A - nh / 2;
          const base = grow(rng, full, 5, 4), cells = addHalves(rng, base, nh, 5, 4);
          if (!cells) continue;
          return { d, k: [d, sig(cells)], plots: [cells], veg, ask: 'count', answer: A, opts: W5U.nums(G, A, 1, 16) };
        }
      }
      const most = d === 1 || d === 3 ? true : bagPick(G, 'h7a' + d, [true, false]);
      for (let t = 0; t < 400; t++) {
        let plots, A;
        if (d === 1) {
          const R = { 2: [[2, 1], [1, 2]], 3: [[3, 1], [1, 3]], 4: [[2, 2], [4, 1]], 5: [[5, 1]], 6: [[3, 2], [2, 3]] };
          plots = [6, 2, 3, 4, 5].map(a => { const [w, h] = rng.pick(R[a]); return rect(w, h); });
        } else if (d === 3) {
          const P = rng.int(4, 7), a = grow(rng, P, 4, 3); let b = null;
          for (let k = 0; k < 40 && !b; k++) { const c = grow(rng, P, 4, 3); if (!W5U.poly.same(a.map(x => x.slice(0, 2)), c.map(x => x.slice(0, 2)))) b = c; }
          if (!b) continue;
          const others = rng.shuffle([3, 4, 5, 6, 7, 8].filter(x => x !== P)).slice(0, 3).map(n => grow(rng, n, 4, 3));
          const order = rng.shuffle([a, b].concat(others));
          if (new Set(order.map(sig)).size < 5) continue;
          const answer = [order.indexOf(a), order.indexOf(b)].sort((x, y) => x - y).join(',');
          return { d, k: [d, order.map(sig).join('|')], plots: order, veg, ask: 'same', pair: P, answer };
        } else {
          /* L2 (whole squares) and L4 (halves too): the answer first, then a plot that LOOKS bigger (a long strip) or smaller
             (a compact block) but is not, then three more */
          const H = d === 4, mkH = (full, nh, mw, mh) => (nh ? addHalves(rng, grow(rng, full, mw, mh), nh, mw, mh) : grow(rng, full, mw, mh));
          if (most) {
            const A = rng.int(6, 8);
            plots = [H ? mkH(A - 1, 2, 3, 3) : grow(rng, A, 3, 3), rect(5, 1)];
            for (let j = 0; j < 3; j++) { const sz = rng.int(3, A - 1); plots.push(H && rng.chance(0.7) && sz >= 3 ? mkH(sz - 1, 2, 4, 3) : grow(rng, sz, 4, 3)); }
          } else {
            const a = rng.int(3, 4);
            plots = [H ? mkH(a - 1, 2, 4, 2) : rect(a, 1), a === 3 ? rect(2, 2) : rect(3, 2)];
            for (let j = 0; j < 3; j++) { const sz = rng.int(a + 1, 8); plots.push(H && rng.chance(0.7) ? mkH(sz - 1, 2, 4, 3) : grow(rng, sz, 4, 3)); }
          }
          if (plots.some(x => !x)) continue;
          const E = plots.map(x => ext(x).e);
          if (most && !(Math.max(...E.slice(1)) > E[0])) continue;
          if (!most && !(Math.min(...E.slice(1)) < E[0])) continue;
          if (H && plots.filter(x => x.some(c => c[2])).length < 3) continue;
        }
        const ar = plots.map(p => area2(p) / 2), A0 = ar[0];
        if (ar.slice(1).some(a => (most ? a >= A0 : a <= A0))) continue;
        if (new Set(plots.map(sig)).size < 5) continue;
        const deck = W5U.deal(G, plots[0], plots.slice(1), 'h7');
        return { d, k: [d, most, deck.map(sig).join('|')], plots: deck, veg, ask: most ? 'most' : 'least', answer: deck.indexOf(plots[0]) };
      }
      const deck = [rect(2, 3), rect(1, 2), rect(1, 3), rect(2, 2), rect(1, 5)];
      return { d, k: [d, 'x'], plots: deck, veg, ask: 'most', answer: 0 };
    },
    audit(q) {
      if (q.ask === 'same') return [{ build: true, chance: 0.1 }];
      if (q.ask === 'count') return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.opts.filter(v => v === q.answer).length }];
      const ar = q.plots.map(p => area2(p) / 2), best = q.ask === 'most' ? Math.max(...ar) : Math.min(...ar);
      return [{ n: q.plots.length, at: q.answer, right: ar.filter(a => a === best).length }];
    },
    geo(q) {
      const L = K.L();
      if (q.ask === 'count') return L ? { slots: [[512, 316]], w: 560, h: 400, s: 64, cy: 612, cs: 116, gap: 18 } : { slots: [[352, 470]], w: 600, h: 470, s: 72, cy: 830, cs: 120, gap: 12 };
      const sl = L ? [[212, 214], [512, 214], [812, 214], [362, 432], [662, 432]] : [[126, 330], [352, 330], [578, 330], [239, 550], [465, 550]];
      const w = L ? 280 : 214, h = L ? 196 : 200;
      const mw = Math.max(...q.plots.map(p => ext(p).w)), mh = Math.max(...q.plots.map(p => ext(p).h));
      return { slots: sl, w, h, s: Math.min(L ? 46 : 40, Math.floor((w - 44) / mw), Math.floor((h - 56) / mh)) };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const q = st.q, g = this.geo(q);
      (st.plotEls || []).forEach((e, i) => {
        const [x, y] = g.slots[i]; place(e, Math.round(x - g.w / 2), Math.round(y - g.h / 2), g.w, g.h);
        const E = ext(q.plots[i]); place(e._sv, Math.round((g.w - E.w * g.s) / 2), Math.round((g.h - E.h * g.s) / 2 + 8), E.w * g.s, E.h * g.s);
      });
      if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.cy, g.cs, g.cs, g.gap);
    },
    cardSpot(st) { const g = this.geo(st.q); return { cx: Stage.W / 2, cy: g.cy, size: g.cs, gap: g.gap }; },
    /* one plot: soil squares, the square lines, the fence round it; .units: the counting units (polygons + label spot) */
    plot(st, i) {
      const q = st.q, cells = q.plots[i], E = ext(cells), solid = q.d <= 3;
      const e = W2X.thing(st, 10, 10, 6, ''); Object.assign(e.style, { borderRadius: '24px', background: 'rgba(255,248,236,.32)', boxShadow: '0 0 0 3px rgba(43,33,24,.18)' });
      const sv = svg('svg', { viewBox: '-0.2 -0.2 ' + (E.w + 0.4) + ' ' + (E.h + 0.4), width: '100%', height: '100%' }); sv.style.overflow = 'visible';
      const box0 = el('div', '', e); Object.assign(box0.style, { position: 'absolute', pointerEvents: 'none' }); box0.appendChild(sv); e._sv = box0;
      const polys = cells.map((x, j) => svg('polygon', { points: cellPoly(x).map(p => p.join(',')).join(' '), fill: (x[0] + x[1]) % 2 ? '#B9824A' : '#C48E55', stroke: solid ? '#6B4423' : 'rgba(107,68,35,.55)', 'stroke-width': solid ? 0.045 : 0.03, 'stroke-dasharray': solid ? 'none' : '0.1 0.08' }, sv));
      /* the fence: the edges that belong to one square only */
      const cnt = new Map(); cells.forEach(x => { const P = cellPoly(x); P.forEach((p, k) => { const a = p, b = P[(k + 1) % P.length], key = [a.join(','), b.join(',')].sort().join('|'); cnt.set(key, (cnt.get(key) || 0) + 1); }); });
      const fence = Array.from(cnt.keys()).filter(k => cnt.get(k) === 1).map(k => k.split('|').map(s => s.split(',').map(Number)));
      fence.forEach(([a, b]) => svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#5A3A1E', 'stroke-width': 0.13, 'stroke-linecap': 'round' }, sv));
      const posts = new Set(); fence.forEach(([a, b]) => { posts.add(a.join(',')); posts.add(b.join(',')); });
      posts.forEach(p => { const [x, y] = p.split(',').map(Number); svg('circle', { cx: x, cy: y, r: 0.09, fill: '#E2B07A', stroke: '#5A3A1E', 'stroke-width': 0.04 }, sv); });
      const lab = svg('g', {}, sv);
      const sign = W5U.propImg(q.veg[i], 40, 40); Object.assign(sign.style, { position: 'absolute', left: '6px', top: '4px' }); e.appendChild(sign);
      e._polys = polys; e._lab = lab; e._units = units(cells);
      if (q.ask !== 'count') K.reg(st, 'p' + i, e, {});
      else e.style.pointerEvents = 'none';
      return e;
    },
    /* light the squares up one by one (two halves together) with their numbers; an animation, so a step-by-step stop does not
       cut it; returns how long it takes */
    countAnim(st, e, color, step) {
      const U = e._units; step = step || 150;
      while (e._lab.firstChild) e._lab.removeChild(e._lab.firstChild);
      const lines = svg('g', {}, e._lab), nums = svg('g', {}, e._lab);
      U.forEach((u, j) => {
        u.cells.forEach(ci => { const pg = e._polys[ci]; pg.style.transition = ''; st.scope.anim(pg, [{ fill: pg.getAttribute('fill') }, { fill: color }], { duration: 120, delay: step * j, fill: 'forwards' }); });
        const g = svg('g', {}, nums);
        /* two halves: the same number on both, a dotted line between them (under the numbers) */
        if (u.pair) { const ln = svg('line', { x1: u.pair[0][0], y1: u.pair[0][1], x2: u.pair[1][0], y2: u.pair[1][1], stroke: INK, 'stroke-width': 0.06, 'stroke-dasharray': '0.08 0.07' }, lines); st.scope.anim(ln, [{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: step * j, fill: 'both' }); }
        (u.pair || [u.at]).forEach(a => {
          const r = u.pair ? 0.23 : 0.3;
          svg('circle', { cx: a[0], cy: a[1], r, fill: '#fff', stroke: INK, 'stroke-width': 0.05 }, g);
          const t = svg('text', { x: a[0], y: a[1] + r * 0.42, 'text-anchor': 'middle', 'font-size': r * 1.27, 'font-weight': 900, fill: INK, 'font-family': 'system-ui,sans-serif' }, g); t.textContent = j + 1;
        });
        st.scope.anim(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: step * j, fill: 'both' });
        st.scope.timeout(() => Sfx.count(Math.min(20, j + 1)), step * j);
      });
      return T(step * U.length + 150);
    },
    present(st) {
      const q = st.q;
      st.sel = [];
      st.plotEls = q.plots.map((_, i) => this.plot(st, i));
      if (q.ask === 'count') {
        const g = this.geo(q);
        st.cards = q.opts.map((v, i) => { const c = UI.card(v, g.cs, { layout: 'frame' }); Stage.el.appendChild(c); c.style.position = 'absolute'; K.reg(st, 'card' + i, c, {}); st.els.push(c); K.pop(st, c, 200 + 60 * i); return c; });
        st.opts = q.opts.slice();
      }
      this.place(st);
      st.plotEls.forEach((e, i) => K.pop(st, e, 70 * i));
      const fic = ic('<rect x="8" y="30" width="40" height="40" fill="#C48E55" stroke="#2B2118" stroke-width="4"/><rect x="52" y="14" width="40" height="56" fill="#C48E55" stroke="#2B2118" stroke-width="4"/><path d="M8 50H48M28 30V70M52 42H92M72 14V70" stroke="#6B4423" stroke-width="3"/>');
      K.task(st, [[fic], ['q']]);
      K.say(st, q.ask === 'most' ? '哪块地最大？' : q.ask === 'least' ? '哪块地最小？' : q.ask === 'same' ? '哪两块一样大？' : '这块地有几格？');
    },
    hi(st, i, on) { const e = st.plotEls[i]; e.style.boxShadow = on ? '0 0 0 6px #FFC93C, 0 0 18px 6px rgba(255,214,90,.8)' : '0 0 0 3px rgba(43,33,24,.18)'; e.style.background = on ? 'rgba(255,248,236,.6)' : 'rgba(255,248,236,.32)'; },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const q = st.q, id = p.id || '';
      if (q.ask === 'count') return W5U.tapCard(st, name, p);
      const m = /^p(\d)$/.exec(id); if (!m) return false;
      const i = +m[1];
      if (q.ask !== 'same') { st.picked = true; K.pop(st, st.plotEls[i]); Session.submit(st, i); return 'ok'; }
      if (st.sel.includes(i)) { st.sel = st.sel.filter(x => x !== i); this.hi(st, i, false); Sfx.back(); return 'ok'; }
      st.sel.push(i); this.hi(st, i, true); Sfx.place(); K.pop(st, st.plotEls[i]);
      if (st.sel.length === 2) { st.picked = true; const v = st.sel.slice().sort((a, b) => a - b).join(','); st.scope.timeout(() => Session.submit(st, v), 380); }
      return 'ok';
    },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.plotEls) return null;
      if (q.ask === 'count') return W5U.cardNext(st, strat);
      if (q.ask !== 'same') { const n = q.plots.length, i = strat === 'wrong' ? (q.answer + 1 + (st.gen % (n - 1))) % n : q.answer; return { g: 'tap', p: { id: 'p' + i } }; }
      const pair = String(q.answer).split(',').map(Number), others = [0, 1, 2, 3, 4].filter(i => !pair.includes(i));
      const want = strat === 'wrong' ? (st.gen % 2 ? [pair[0], others[0]] : others.slice(0, 2)) : pair;
      const i = want.find(x => !st.sel.includes(x)); return i == null ? null : { g: 'tap', p: { id: 'p' + i } };
    },
    sizeOf(q, i) { return area2(q.plots[i]) / 2; },
    lineIs: v => '这块是' + CNQ(v) + '格',
    async feedback(st, ans) {
      const q = st.q;
      if (q.ask === 'count') { const c = W5U.cardOf(st, ans); if (c) K.wiggle(st, c); W5U.say(st, '不是' + CNQ(ans) + '格'); }
      else if (q.ask === 'same') { String(ans).split(',').forEach(i => K.wiggle(st, st.plotEls[+i])); W5U.say(st, '这两块不一样大'); }
      else { K.wiggle(st, st.plotEls[ans]); W5U.say(st, this.lineIs(this.sizeOf(q, ans))); }
      await st.scope.wait(T(550));
    },
    /* 1. his plot(s) ringed blue and counted ("这块是五格" / "五格和六格"); 2. the right one(s) counted, gold ("七格最大！") */
    async explain(st, ans) {
      const q = st.q, my = st, BL = '#9AD3FF', GL = '#FFE08A';
      if (q.ask === 'count') {
        W5U.blue(st, W5U.cardOf(st, ans));
        await fbDone(st); if (!Session.alive(my)) return;
        const ms = this.countAnim(st, st.plotEls[0], GL, 125);
        W5U.ring(st, st.plotEls[0]._sv, GOLD, 10);
        W5U.note(st, '两个半格，一格');
        await st.scope.wait(Math.max(1050, ms)); if (!Session.alive(my)) return;
        W5U.gold(st, W5U.cardOf(st, q.answer));
        await W5U.sum(st, CNQ(q.answer) + '格！');
        return;
      }
      if (q.ask === 'same') {
        const mine = String(ans).split(',').map(Number), pair = String(q.answer).split(',').map(Number);
        mine.forEach(i => this.hi(st, i, false));
        W5U.blue(st, mine.map(i => st.plotEls[i]));
        const m1 = Math.max(...mine.map(i => this.countAnim(st, st.plotEls[i], BL, 130)));
        W5U.note(st, CNQ(this.sizeOf(q, mine[0])) + '格和' + CNQ(this.sizeOf(q, mine[1])) + '格');
        await st.scope.wait(Math.max(1200, m1)); if (!Session.alive(my)) return;
        const m2 = Math.max(...pair.map(i => this.countAnim(st, st.plotEls[i], GL, 130)));
        W5U.gold(st, pair.map(i => st.plotEls[i]));
        W5U.sum(st, '都是' + CNQ(q.pair) + '格！');
        await st.scope.wait(Math.max(1100, m2)); if (!Session.alive(my)) return;
        return;
      }
      W5U.blue(st, st.plotEls[ans]);
      const m1 = this.countAnim(st, st.plotEls[ans], BL, 130), t0 = now();
      await fbDone(st); if (!Session.alive(my)) return;
      await st.scope.wait(Math.max(250, m1 - (now() - t0))); if (!Session.alive(my)) return;
      const m2 = this.countAnim(st, st.plotEls[q.answer], GL, 130);
      W5U.gold(st, st.plotEls[q.answer]);
      W5U.sum(st, CNQ(this.sizeOf(q, q.answer)) + (q.ask === 'most' ? '格最大！' : '格最小！'));
      await st.scope.wait(Math.max(1000, m2));
    },
    rightEls(st) { const q = st.q; return q.ask === 'count' ? [W5U.cardOf(st, q.answer)] : q.ask === 'same' ? String(q.answer).split(',').map(i => st.plotEls[+i]) : [st.plotEls[q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st, GL = '#FFE08A';
      const R = q.ask === 'count' ? [0] : q.ask === 'same' ? String(q.answer).split(',').map(Number) : [q.answer];
      const ms = Math.max(...R.map(i => this.countAnim(st, st.plotEls[i], GL, 110)));
      W5U.gold(st, this.rightEls(st)); Sfx.reveal();
      this.cheerAll(st);
      st.summary = q.ask === 'count' ? CNQ(q.answer) + '格！' : q.ask === 'same' ? '都是' + CNQ(q.pair) + '格！' : CNQ(this.sizeOf(q, q.answer)) + (q.ask === 'most' ? '格最大！' : '格最小！');
      W5U.sum(st, st.summary);
      await st.scope.wait(Math.max(T(900), ms));
      if (!Session.alive(my)) return;
    },
    workEls(st) { return st.q.ask === 'count' ? st.cards || [] : st.plotEls || []; },
    snap(st) { return { sizes: st.q.plots.map(p => area2(p) / 2), sel: (st.sel || []).slice() }; },
    lines() {
      const out = [this.intro, '哪块地最大？', '哪块地最小？', '哪两块一样大？', '这块地有几格？', '这两块不一样大', '两个半格，一格'].concat(this.praise);
      /* a plot of L1-L4 has 2-8 squares, the one of L5 6-12 (its cards 2-16); the biggest 6-8, the smallest 3-4, a pair 4-7,
         a plot of L3 3-8 */
      for (let v = 2; v <= 8; v++) out.push(this.lineIs(v));
      for (let v = 6; v <= 12; v++) out.push(CNQ(v) + '格！');
      for (let v = 2; v <= 16; v++) out.push('不是' + CNQ(v) + '格');
      for (let v = 6; v <= 8; v++) out.push(CNQ(v) + '格最大！');
      for (let v = 3; v <= 4; v++) out.push(CNQ(v) + '格最小！');
      for (let v = 4; v <= 7; v++) out.push('都是' + CNQ(v) + '格！');
      for (let a = 3; a <= 8; a++) for (let b = 3; b <= 8; b++) if (a !== b) out.push(CNQ(a) + '格和' + CNQ(b) + '格');
      return uniq(out);
    },
  };

  /* ================================================================ H8 找！ 千里眼找宝贝 (reasoning; F18 Surprise for Mom: find the
     targets - one feature first, then two or three; things first, then shapes). The snake spirit's treasure: 12-28 things in
     a loose grid (each >= 88). Tap a thing to tick it (tap again: the tick goes), then the big tick. Right only when exactly
     the targets are ticked.
       L1 one feature, the kind ("把葫芦都找出来！"), 2-3 of 12 · L2 one feature, the colour, 3-4 of 16, the other things of
       the same kinds · L3 two features ("红色的，星星都找出来！"), 3-4 of 20, at least three that have only the colour and
       three that have only the kind · L4 three features ("小的，黄色的星星！"), 3-5 of 24, some turned · L5 shapes ("大的，有
       条纹的，三角形！": big / small, striped / hollow / solid, triangle / circle / square), 3-5 of 28.
     A construction question (random ticking is right about never). Wrong: what he ticked that is not one ringed blue (its
     tick goes) and why ("这个是蓝色的" / "这个不是星星"), or - nothing extra - the ones he missed ringed blue ("这里还有一个");
     then every target gold, counted, and named ("红色的星星！"). */
  const H8K = { gourd: '葫芦', gem: '宝石', star: '星星', cup: '杯子', pearl: '珠子' };
  const H8C = [['red', '红色', '红', '#E8414B'], ['yellow', '黄色', '黄', '#FFC93C'], ['blue', '蓝色', '蓝', '#4FB3FF'], ['green', '绿色', '绿', '#5CC46E'], ['purple', '紫色', '紫', '#B57BFF']];
  const COL = Object.fromEntries(H8C.map(c => [c[0], c]));
  const H8SH = { tri: '三角形', circ: '圆形', sq: '正方形' };
  const H8F = { stripe: ['有条纹的，', '条纹', '这个有条纹'], hollow: ['空心的，', '空心', '这个是空心的'], solid: ['实心的，', '实心', '这个是实心的'] };
  /* one thing as svg (viewBox 0 0 100 100): a kind (L1-L4) or a shape with a fill (L5); sz the scale, r a turn */
  const thingSvg = (t, id) => {
    const k = INK, col = t.c ? COL[t.c][3] : '#2E6FD8', S = 'stroke="' + k + '" stroke-width="' + (4.5 / t.sz).toFixed(1) + '" stroke-linejoin="round"';
    let body = '';
    if (t.sh) {
      const P = t.sh === 'tri' ? '<polygon points="50,14 88,80 12,80"' : t.sh === 'circ' ? '<circle cx="50" cy="50" r="35"' : '<rect x="17" y="17" width="66" height="66" rx="3"';
      if (t.f === 'solid') body = P + ' fill="' + col + '" ' + S + '/>';
      else if (t.f === 'hollow') body = P + ' fill="#fff" stroke="' + col + '" stroke-width="' + (11 / t.sz).toFixed(1) + '" stroke-linejoin="round"/>' + P + ' fill="none" stroke="' + k + '" stroke-width="2.5" stroke-linejoin="round"/>';
      else body = '<clipPath id="' + id + '">' + P + '/></clipPath><g clip-path="url(#' + id + ')"><rect x="0" y="0" width="100" height="100" fill="#fff"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => '<path d="M' + (i * 14 - 40) + ' 100L' + (i * 14 + 10) + ' 0" stroke="' + col + '" stroke-width="7"/>').join('') + '</g>' + P + ' fill="none" ' + S + '/>';
    } else if (t.k === 'gourd') body = '<path d="M50 20L50 12" stroke="' + k + '" stroke-width="6"/><path d="M52 14Q64 4 72 14Q62 20 52 14Z" fill="#5CC46E" ' + S + '/><circle cx="50" cy="64" r="25" fill="' + col + '" ' + S + '/><circle cx="50" cy="34" r="16" fill="' + col + '" ' + S + '/><rect x="44" y="44" width="12" height="9" fill="' + col + '"/><ellipse cx="42" cy="58" rx="6" ry="9" fill="#fff" opacity=".55"/>';
    else if (t.k === 'gem') body = '<polygon points="30,22 70,22 88,42 50,88 12,42" fill="' + col + '" ' + S + '/><path d="M12 42H88M30 22L40 42L50 88L60 42L70 22" fill="none" stroke="' + k + '" stroke-width="3" stroke-linejoin="round"/><polygon points="34,26 44,26 38,38" fill="#fff" opacity=".6"/>';
    else if (t.k === 'star') body = '<polygon points="' + W2X.pts(W2X.star(50, 54, 40)) + '" fill="' + col + '" ' + S + '/><circle cx="42" cy="44" r="5" fill="#fff" opacity=".6"/>';
    else if (t.k === 'cup') body = '<path d="M70 38Q90 38 88 54Q86 68 66 66" fill="none" stroke="' + k + '" stroke-width="7"/><path d="M70 38Q90 38 88 54Q86 68 66 66" fill="none" stroke="' + col + '" stroke-width="3"/><path d="M18 28H74L68 76Q66 86 56 86H36Q26 86 24 76Z" fill="' + col + '" ' + S + '/><rect x="16" y="22" width="60" height="9" rx="4" fill="' + col + '" ' + S + '/><rect x="28" y="40" width="7" height="30" rx="3" fill="#fff" opacity=".5"/>';
    else body = '<circle cx="50" cy="52" r="32" fill="' + col + '" ' + S + '/><ellipse cx="40" cy="40" rx="10" ry="7" fill="#fff" opacity=".7"/>';
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible;pointer-events:none"><g transform="translate(50 52) scale(' + t.sz + ') rotate(' + (t.r || 0) + ') translate(-50 -52)">' + body + '</g></svg>';
  };
  const BIG = 0.98, SMALL = 0.56;
  W5R.H8 = {
    kind0: 'search5', verb: '找！', intro: '千里眼找宝贝！', praise: ['一个都没漏！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, KS = Object.keys(H8K), CS = H8C.map(c => c[0]);
      const N = [0, 12, 16, 20, 24, 28][d], nT = d === 1 ? rng.int(2, 3) : d <= 3 ? rng.int(3, 4) : rng.int(3, 5);
      const noise = () => (rng.chance(0.5) ? 0.8 : 0.92);
      let want, mk, dims;
      if (d === 5) {
        dims = ['s', 'f', 'sh'];
        want = { s: rng.pick(['big', 'small']), f: rng.pick(Object.keys(H8F)), sh: rng.pick(Object.keys(H8SH)) };
        mk = () => ({ s: rng.pick(['big', 'small']), f: rng.pick(Object.keys(H8F)), sh: rng.pick(Object.keys(H8SH)) });
      } else {
        dims = d === 1 ? ['k'] : d === 2 ? ['c'] : d === 3 ? ['c', 'k'] : ['s', 'c', 'k'];
        want = { k: rng.pick(KS), c: rng.pick(CS), s: rng.pick(['big', 'small']) };
        mk = () => ({ k: rng.pick(KS), c: rng.pick(CS), s: rng.pick(['big', 'small']) });
      }
      const match = t => dims.every(x => t[x] === want[x]);
      const other = (x, v) => { const pool = x === 'k' ? KS : x === 'c' ? CS : x === 's' ? ['big', 'small'] : x === 'f' ? Object.keys(H8F) : Object.keys(H8SH); return rng.pick(pool.filter(p => p !== v)); };
      const items = [];
      for (let i = 0; i < nT; i++) { const t = mk(); dims.forEach(x => { t[x] = want[x]; }); items.push(t); }
      /* near misses: everything right but one feature */
      if (dims.length > 1) dims.forEach(x => { const m = d === 3 ? 3 : rng.int(2, 3); for (let i = 0; i < m; i++) { const t = mk(); dims.forEach(y => { t[y] = want[y]; }); t[x] = other(x, want[x]); items.push(t); } });
      /* L2: the other things are of the same kinds as the targets */
      while (items.length < N) { const t = mk(); if (d === 2 && rng.chance(0.6)) t.k = rng.pick(items.slice(0, nT)).k; if (!match(t)) items.push(t); }
      items.forEach(t => { t.sz = d >= 4 ? (t.s === 'big' ? BIG : SMALL) : noise(); t.r = d === 4 && rng.chance(0.3) ? rng.pick([-28, -18, 18, 28]) : 0; if (d < 4) delete t.s; if (d === 5) { delete t.k; delete t.c; } });
      const order = rng.shuffle(items.map((t, i) => i)).map(i => items[i]);
      const answer = order.map((t, i) => (match(t) ? i : -1)).filter(i => i >= 0).join(',');
      return { d, k: [d, JSON.stringify(want), order.map(t => (t.k || t.sh || '') + (t.c || t.f || '') + (t.s || '')).join('.')], items: order, want, dims, answer, seed: rng.int(1, 1e9) };
    },
    audit(q) { return [{ build: true, chance: 0 }]; },
    /* the grid: landscape / portrait columns x rows per level */
    geo(q) {
      const L = K.L(), n = q.items.length;
      const CR = L ? { 12: [4, 3], 16: [6, 3], 20: [5, 4], 24: [6, 4], 28: [7, 4] } : { 12: [3, 4], 16: [4, 4], 20: [4, 5], 24: [5, 5], 28: [5, 6] };
      const [cols, rows] = CR[n], A = L ? { x: 128, y: 108, w: 768, h: 436 } : { x: 20, y: 208, w: 664, h: 660 };
      const cw = A.w / cols, ch = A.h / rows, s = Math.max(92, Math.min(124, Math.floor(Math.min(cw, ch) - 10)));
      return { cols, rows, A, cw, ch, s };
    },
    decor(G) { W2X.decorDone(G, this.chars); },
    place(st) {
      const q = st.q, g = this.geo(q); if (!st.things) return;
      const rr = RNG(q.seed), cells = rr.shuffle(Array.from({ length: g.cols * g.rows }, (_, i) => i)).slice(0, q.items.length).sort((a, b) => a - b);
      const jx = Math.max(0, (g.cw - g.s) / 2 * 0.7), jy = Math.max(0, (g.ch - g.s) / 2 * 0.7);
      st.things.forEach((e, i) => { const k = cells[i], c = k % g.cols, r = (k - c) / g.cols; place(e, Math.round(g.A.x + (c + 0.5) * g.cw - g.s / 2 + (rr() * 2 - 1) * jx), Math.round(g.A.y + (r + 0.5) * g.ch - g.s / 2 + (rr() * 2 - 1) * jy), g.s, g.s); });
    },
    words(q) {
      const w = q.want, C = COL[w.c] || [];
      if (q.d === 1) return { lead: null, ask: '把' + H8K[w.k] + '都找出来！', sum: '都是' + H8K[w.k] + '！' };
      if (q.d === 2) return { lead: null, ask: C[1] + '的都找出来！', sum: '都是' + C[1] + '的！' };
      if (q.d === 3) return { lead: C[1] + '的，', ask: H8K[w.k] + '都找出来！', sum: C[1] + '的' + H8K[w.k] + '！' };
      if (q.d === 4) return { lead: (w.s === 'big' ? '大' : '小') + '的，', ask: C[1] + '的' + H8K[w.k] + '！', sum: (w.s === 'big' ? '大' : '小') + '的' + C[2] + H8K[w.k] + '！' };
      return { lead: [(w.s === 'big' ? '大' : '小') + '的，', H8F[w.f][0]], ask: H8SH[w.sh] + '！', sum: (w.s === 'big' ? '大' : '小') + '的' + H8F[w.f][1] + H8SH[w.sh] + '！' };
    },
    present(st) {
      const q = st.q;
      st.sel = [];
      st.things = q.items.map((t, i) => {
        const e = W2X.thing(st, 10, 10, 6, ''); Object.assign(e.style, { borderRadius: '22px', background: 'rgba(255,248,236,.55)', boxShadow: '0 0 0 3px rgba(43,33,24,.25)' });
        const inner = el('div', '', e); Object.assign(inner.style, { position: 'absolute', left: '9%', top: '9%', width: '82%', height: '82%', pointerEvents: 'none' }); inner.innerHTML = thingSvg(t, uid('s'));
        K.reg(st, 't' + i, e, {});
        return e;
      });
      st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      st.things.forEach((e, i) => K.pop(st, e, Math.min(700, 25 * i)));
      const w = q.want, ex = Object.assign({ sz: q.d >= 4 ? (w.s === 'big' ? 1 : 0.6) : 0.95, r: 0 }, q.d === 5 ? { s: w.s, f: w.f, sh: w.sh } : { k: q.d === 2 ? 'pearl' : w.k, c: q.d === 1 ? null : w.c });
      if (q.d === 1) ex.c = 'yellow';
      const card = el('span', ''); card.innerHTML = thingSvg(ex, uid('s')).replace('width="100%" height="100%"', 'width="56" height="56"');
      K.task(st, [[{ node: card }], ['check']]);
      const W = this.words(q);
      if (W.lead) { st.lead = W.lead; [].concat(W.lead).forEach(l => Voice.say(l, { tag: 'prompt' })); }
      K.say(st, W.ask);
    },
    mark(st, i, on) {
      const e = st.things[i];
      e.style.background = on ? 'rgba(255,248,214,.95)' : 'rgba(255,248,236,.55)'; e.style.boxShadow = on ? '0 0 0 5px #5CC46E' : '0 0 0 3px rgba(43,33,24,.25)';
      let t = e.querySelector('.h8tick');
      if (on && !t) { t = el('div', 'h8tick', e); Object.assign(t.style, { position: 'absolute', right: '-10px', top: '-10px', width: '38px', height: '38px', pointerEvents: 'none' }); t.innerHTML = '<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="17" fill="#5CC46E" stroke="#2B2118" stroke-width="3.5"/><path d="M11 21L18 28L30 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; K.pop(st, t); }
      if (!on && t) t.remove();
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const id = p.id || '';
      if (id === 'done') { if (!st.sel.length) { K.wiggle(st, st.doneBtn); return 'free'; } st.picked = true; Session.submit(st, st.sel.slice().sort((a, b) => a - b).join(',')); return 'ok'; }
      const m = /^t(\d+)$/.exec(id); if (!m) return false;
      const i = +m[1], on = !st.sel.includes(i);
      st.sel = on ? st.sel.concat(i) : st.sel.filter(x => x !== i); this.mark(st, i, on);
      if (on) Sfx.place(); else Sfx.back();
      st.doneBtn.classList.toggle('ready', st.sel.length > 0);
      return 'ok';
    },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.things) return null;
      const want = String(q.answer).split(',').filter(Boolean).map(Number);
      if (strat === 'wrong') {
        /* every other question one extra, else one missing */
        const extra = st.gen % 2 ? q.items.findIndex((t, i) => !want.includes(i)) : -1;
        const goal = extra >= 0 ? want.concat(extra) : want.slice(1);
        const add = goal.find(i => !st.sel.includes(i)); if (add != null) return { g: 'tap', p: { id: 't' + add } };
        const rem = st.sel.find(i => !goal.includes(i)); if (rem != null) return { g: 'tap', p: { id: 't' + rem } };
        return { g: 'tap', p: { id: 'done' } };
      }
      const rem = st.sel.find(i => !want.includes(i)); if (rem != null) return { g: 'tap', p: { id: 't' + rem } };
      const add = want.find(i => !st.sel.includes(i)); return { g: 'tap', p: { id: add != null ? 't' + add : 'done' } };
    },
    /* what is not right about a thing (the first feature of the question it does not have) */
    whyNot(q, t) {
      const w = q.want, x = q.dims.find(dd => t[dd] !== w[dd]);
      if (x === 'c') return '这个是' + COL[t.c][1] + '的';
      if (x === 'k') return '这个不是' + H8K[w.k];
      if (x === 's') return '这个是' + (t.s === 'big' ? '大' : '小') + '的';
      if (x === 'f') return H8F[t.f][2];
      return '这个不是' + H8SH[w.sh];
    },
    split(st, ans) { const q = st.q, sel = String(ans).split(',').filter(Boolean).map(Number), T = String(q.answer).split(',').filter(Boolean).map(Number); return { sel, T, extra: sel.filter(i => !T.includes(i)), miss: T.filter(i => !sel.includes(i)) }; },
    async feedback(st, ans) {
      const q = st.q, S = this.split(st, ans);
      if (S.extra.length) { K.wiggle(st, st.things[S.extra[0]]); W5U.say(st, this.whyNot(q, q.items[S.extra[0]])); }
      else W5U.say(st, '还漏了' + CNQ(S.miss.length) + '个');
      await st.scope.wait(T(550));
    },
    /* 1. the extra ones (their ticks go) blue + why - or the missed ones blue ("这里还有一个"); 2. every target gold, counted,
       named */
    async explain(st, ans) {
      const q = st.q, my = st, S = this.split(st, ans);
      if (S.extra.length) {
        S.extra.forEach(i => this.mark(st, i, false));
        W5U.blue(st, S.extra.map(i => st.things[i]));
        await fbDone(st); if (!Session.alive(my)) return;
        await st.scope.wait(350); if (!Session.alive(my)) return;
      } else {
        W5U.blue(st, S.miss.map(i => st.things[i]));
        W5U.note(st, '这里还有' + CNQ(S.miss.length) + '个');
        await st.scope.wait(1050); if (!Session.alive(my)) return;
      }
      /* every target gold at once, counted by badges popping in one after another (an animation: one step of 一步一步) */
      W5U.gold(st, S.T.map(i => st.things[i]));
      S.T.forEach((i, j) => { const b = box(st.things[i]), bg = badgeAt(st, b.x + b.w - 6, b.y + 6, j + 1, 38); st.scope.anim(bg, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 240, delay: 220 * j, easing: EASE.pop, fill: 'both' }); st.scope.timeout(() => Sfx.count(j + 1), 220 * j); });
      W5U.note(st, this.words(q).sum);
      await st.scope.wait(Math.max(1300, 220 * S.T.length + 500));
    },
    rightEls(st) { return String(st.q.answer).split(',').filter(Boolean).map(i => st.things[+i]); },
    async reveal(st) {
      const q = st.q, tg = String(q.answer).split(',').map(Number);
      W5U.gold(st, tg.map(i => st.things[i])); Sfx.reveal();
      this.cheerAll(st);
      st.summary = this.words(q).sum;
      W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.things || []; },
    snap(st) { return { sel: (st.sel || []).slice(), n: st.q.items.length }; },
    lines() {
      const out = [this.intro].concat(this.praise), KS = Object.keys(H8K);
      const add = q => { const W = this.words(q); [].concat(W.lead || []).forEach(l => out.push(l)); out.push(W.ask, W.sum); };
      KS.forEach(k => add({ d: 1, want: { k } }));
      H8C.forEach(c => { add({ d: 2, want: { c: c[0] } }); KS.forEach(k => { add({ d: 3, want: { c: c[0], k } }); ['big', 'small'].forEach(s => add({ d: 4, want: { c: c[0], k, s } })); }); });
      ['big', 'small'].forEach(s => Object.keys(H8F).forEach(f => Object.keys(H8SH).forEach(sh => add({ d: 5, want: { s, f, sh } }))));
      H8C.forEach(c => out.push('这个是' + c[1] + '的'));
      KS.forEach(k => out.push('这个不是' + H8K[k]));
      Object.keys(H8SH).forEach(sh => out.push('这个不是' + H8SH[sh]));
      Object.keys(H8F).forEach(f => out.push(H8F[f][2]));
      out.push('这个是大的', '这个是小的');
      for (let n = 1; n <= 5; n++) out.push('还漏了' + CNQ(n) + '个', '这里还有' + CNQ(n) + '个');
      return uniq(out);
    },
  };
})();
/* ================================================================ ⑥ 西游记·积木庙 (xiyou5, from level 2): X5 从哪儿拍的 · X6 拉直比一比 ·
   X7 取经队排队 · X8 换尺子量 (reasoning). docs/W5-DESIGN.md §5 ⑥. One function, no top-level names: each rule is W5R.<id>,
   registered (background, friends, icon) in games.js. Package C. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C', BLUE = '#4FB3FF';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const R1 = v => Math.round(v * 10) / 10;
  let UID = 0;
  const uid = p => 'x5' + p + (++UID);
  const ic = s => W3X.ic(s, 52);
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine). As paw.js. */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));
  /* a number badge at a stage point */
  const badgeAt = (st, x, y, n, size, delay) => { size = size || 40; const b = UI.badge(n, size); Stage.el.appendChild(b); b.style.position = 'absolute'; b.style.pointerEvents = 'none'; place(b, Math.round(x - size / 2), Math.round(y - size / 2)); st.els.push(b); st.scope.anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 240, delay: delay || 0, easing: EASE.pop, fill: 'both' }); return b; };
  /* a row of number cards (ids idp0 ...) */
  const numRow = (st, vals, size, idp, opt) => vals.map((v, i) => { const c = UI.card(v, size, Object.assign({ layout: 'frame' }, opt || {})); Stage.el.appendChild(c); c.style.position = 'absolute'; K.reg(st, (idp || 'card') + i, c, {}); st.els.push(c); K.pop(st, c, 60 * i); return c; });
  /* a tween in real time (rAF), skipped by a tap (st.ff) and instant in fast mode */
  const tween = (st, ms, fn) => new Promise(res => {
    const t0 = now(), d = T(ms);
    const step = () => { if (st.scope.dead) return; const k = d ? Math.min(1, (now() - t0) / d) : 1; fn(st.ff ? 1 : k); if (k < 1 && !st.ff) requestAnimationFrame(step); else { fn(1); res(); } };
    step();
  });
  const NAME = { tangseng: '唐僧', wukong: '悟空', bajie: '八戒', shaseng: '沙僧', dragon_horse: '白龙马' };

  /* ================================================================ X5 拍！ 从哪儿拍的 (S2 Taking Photos; S17 Tumble Jumble). A square
     stone table seen from above at a slant, 1-3 things on it (a 3 x 3 grid); five places to take a photo round it (front - the
     child's side -, back, left, right, and a cloud above). Beside it a photo: "这张在哪里拍的？" - tap a place.
       L1 one teapot (spout one way, handle the other, a flower painted on its front): the five photos all differ · L2 two
       things side by side, one tall one short: from behind left and right change places, from the side one hides the other ·
       L3 two things one behind the other · L4 three things in an L · L5 一题两问: two photos, where was each taken.
     How a photo is made: from the front, left-right as it is, the near one in front; from behind, left-right turned round, the
     far one in front; from the left side, what is near the child shows on the photo's right; from the right side, on its left;
     from above, the plan (round things round, the box square, the teapot's spout pointing its way). A question is used only
     when its photo differs from the four others. Wrong: his place flashes ("咔嚓"), its photo flies next to the question's,
     blue ("从这里拍是这样"); then the right place, its photo the same as the question's, gold ("在这里拍的！"). */
  const VIEWS = ['front', 'back', 'left', 'right', 'top'];
  const KN = { vase: '花瓶', pagoda: '小塔', peach: '桃子', box: '盒子', teapot: '茶壶' };
  const TALL = { vase: 1, pagoda: 1 };
  /* a thing seen from the side, standing on (0, 0); f: what of the teapot faces the camera */
  const side = (kind, f) => {
    const k = 'stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"';
    if (kind === 'vase') return '<rect x="-7" y="-82" width="14" height="10" rx="3" fill="#7FD1A8" ' + k + '/><circle cx="0" cy="-56" r="15" fill="#5DBB8E" ' + k + '/><circle cx="0" cy="-23" r="23" fill="#5DBB8E" ' + k + '/><rect x="-6" y="-44" width="12" height="8" fill="#5DBB8E"/><ellipse cx="-8" cy="-28" rx="5" ry="9" fill="#fff" opacity=".5"/>';
    if (kind === 'pagoda') return '<polygon points="-20,0 20,0 16,-24 -16,-24" fill="#D9534F" ' + k + '/><polygon points="-24,-24 24,-24 0,-34" fill="#8E3B2E" ' + k + '/><polygon points="-14,-34 14,-34 11,-52 -11,-52" fill="#D9534F" ' + k + '/><polygon points="-18,-52 18,-52 0,-62" fill="#8E3B2E" ' + k + '/><polygon points="-3,-62 3,-62 0,-86" fill="#FFC93C" ' + k + '/>';
    if (kind === 'peach') return '<path d="M0 -40C-26 -40 -24 0 0 0C24 0 26 -40 0 -40Z" fill="#FF9CB0" ' + k + '/><path d="M0 -40C-4 -30 -4 -10 0 -2" fill="none" stroke="#E2627A" stroke-width="3"/><path d="M2 -40Q14 -52 22 -44Q12 -36 2 -40Z" fill="#5CC46E" ' + k + '/>';
    if (kind === 'box') return '<rect x="-22" y="-44" width="44" height="44" rx="3" fill="#4FB3FF" ' + k + '/><path d="M-22 -32H22" stroke="' + INK + '" stroke-width="3"/><rect x="-6" y="-50" width="12" height="7" rx="2" fill="#FFC93C" ' + k + '/>';
    /* the teapot: f = 'R' / 'L' spout to the photo's right / left (seen from the front: 'F' a flower on it); 'S' the spout
       comes at the camera, 'H' the handle does; fl: the flower on the photo's right / left rim */
    const body = '<ellipse cx="0" cy="-22" rx="27" ry="21" fill="#F5D76E" ' + k + '/><rect x="-12" y="-46" width="24" height="7" rx="3" fill="#F5D76E" ' + k + '/><circle cx="0" cy="-50" r="4" fill="#E89B3C" ' + k + '/>';
    const flower = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle cx="0" cy="-6" r="5" fill="#FF6FA8"/><circle cx="6" cy="0" r="5" fill="#FF6FA8"/><circle cx="0" cy="6" r="5" fill="#FF6FA8"/><circle cx="-6" cy="0" r="5" fill="#FF6FA8"/><circle cx="0" cy="0" r="3.5" fill="#FFC93C"/></g>';
    const spout = s => '<path d="M' + 22 * s + ' -18Q' + 40 * s + ' -20 ' + 44 * s + ' -38L' + 37 * s + ' -38Q' + 34 * s + ' -27 ' + 22 * s + ' -28Z" fill="#F5D76E" ' + k + '/>';
    const handle = s => '<path d="M' + 24 * s + ' -32Q' + 42 * s + ' -32 ' + 40 * s + ' -18Q' + 38 * s + ' -8 ' + 22 * s + ' -12" fill="none" stroke="' + INK + '" stroke-width="7"/><path d="M' + 24 * s + ' -32Q' + 42 * s + ' -32 ' + 40 * s + ' -18Q' + 38 * s + ' -8 ' + 22 * s + ' -12" fill="none" stroke="#F5D76E" stroke-width="3"/>';
    if (f === 'R' || f === 'L' || f === 'RF' || f === 'LF') { const s = f[0] === 'R' ? 1 : -1; return spout(s) + handle(-s) + body + (f.length > 1 ? flower(0, -22, 1) : ''); }
    const fl = f.slice(1);
    if (f[0] === 'S') return body + '<ellipse cx="0" cy="-26" rx="7" ry="6" fill="#F5D76E" ' + k + '/><ellipse cx="0" cy="-26" rx="3" ry="2.5" fill="' + INK + '"/>' + flower(fl === 'R' ? 22 : -22, -22, 0.7);
    return body + '<path d="M-9 -34Q0 -40 9 -34Q12 -22 9 -12Q0 -8 -9 -12Q-12 -22 -9 -34Z" fill="none" stroke="' + INK + '" stroke-width="6"/><path d="M-9 -34Q0 -40 9 -34Q12 -22 9 -12Q0 -8 -9 -12Q-12 -22 -9 -34Z" fill="none" stroke="#F5D76E" stroke-width="2.5"/>' + flower(fl === 'R' ? 22 : -22, -22, 0.7);
  };
  /* a thing seen from above, centred on (0, 0) */
  const plan = (kind, face) => {
    const k = 'stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"';
    if (kind === 'vase') return '<circle r="21" fill="#5DBB8E" ' + k + '/><circle r="12" fill="#7FD1A8" ' + k + '/><circle r="5" fill="' + INK + '"/>';
    if (kind === 'pagoda') return '<polygon points="' + W2X.pts(W2X.ngon(8, 0, 0, 21, 22.5)) + '" fill="#D9534F" ' + k + '/><polygon points="' + W2X.pts(W2X.ngon(8, 0, 0, 12, 22.5)) + '" fill="#8E3B2E" ' + k + '/><circle r="4" fill="#FFC93C" ' + k + '/>';
    if (kind === 'peach') return '<circle r="20" fill="#FF9CB0" ' + k + '/><path d="M2 -4Q16 -18 22 -8Q12 0 2 -4Z" fill="#5CC46E" ' + k + '/>';
    if (kind === 'box') return '<rect x="-21" y="-21" width="42" height="42" rx="3" fill="#4FB3FF" ' + k + '/><rect x="-6" y="-6" width="12" height="12" rx="2" fill="#FFC93C" ' + k + '/>';
    const s = face === 'R' ? 1 : -1;
    return '<path d="M' + 20 * s + ' -5L' + 42 * s + ' -9L' + 42 * s + ' -3L' + 20 * s + ' 5Z" fill="#F5D76E" ' + k + '/><path d="M' + -20 * s + ' -8Q' + -38 * s + ' 0 ' + -20 * s + ' 8" fill="none" stroke="' + INK + '" stroke-width="7"/><circle r="23" fill="#F5D76E" ' + k + '/><circle r="9" fill="#F5D76E" ' + k + '/><circle r="3.5" fill="#E89B3C"/><circle cx="0" cy="19" r="4" fill="#FF6FA8"/>';
  };
  /* what the camera at a view sees: for every thing its slot on the photo (0-2), its distance (0 nearest) and its look */
  const seen = (things, view) => things.map(t => {
    const c = t.c, r = t.r;
    if (view === 'front') return { t, slot: c, near: 2 - r, f: t.kind === 'teapot' ? t.face + 'F' : '' };
    if (view === 'back') return { t, slot: 2 - c, near: r, f: t.kind === 'teapot' ? (t.face === 'R' ? 'L' : 'R') : '' };
    if (view === 'left') return { t, slot: r, near: c, f: t.kind === 'teapot' ? (t.face === 'R' ? 'H' : 'S') + 'R' : '' };
    if (view === 'right') return { t, slot: 2 - r, near: 2 - c, f: t.kind === 'teapot' ? (t.face === 'R' ? 'S' : 'H') + 'L' : '' };
    return { t, slot: c, near: r, f: t.face || '' };
  });
  /* a signature of a photo: two photos with the same signature look the same */
  const sigOf = (things, view) => view === 'top' ? 'top:' + things.map(t => t.kind + t.c + t.r + (t.face || '')).sort().join('.')
    : [0, 1, 2].map(s => seen(things, view).filter(x => x.slot === s).sort((a, b) => a.near - b.near).map(x => x.t.kind + x.f).join('>')).join('|');
  /* the photo (viewBox 0 0 200 200): the table's edge and the things standing on it, or the table seen from above */
  const photoSvg = (things, view) => {
    let s = '<svg viewBox="0 0 200 200" width="100%" height="100%" style="pointer-events:none;display:block">';
    if (view === 'top') {
      s += '<rect x="0" y="0" width="200" height="200" fill="#D9C7A3"/><rect x="18" y="18" width="164" height="164" rx="10" fill="#A7A9AC" stroke="' + INK + '" stroke-width="4"/><rect x="26" y="26" width="148" height="148" rx="7" fill="#BEC0C3"/>';
      const one = things.length === 1;
      things.forEach(t => { s += '<g transform="translate(' + (45 + 55 * t.c) + ' ' + (45 + 55 * t.r) + ') scale(' + (one ? 1.7 : 1.12) + ')">' + plan(t.kind, t.face) + '</g>'; });
    } else {
      s += '<rect x="0" y="0" width="200" height="200" fill="#CFE9F7"/><rect x="0" y="150" width="200" height="50" fill="#A7A9AC"/><rect x="0" y="150" width="200" height="9" fill="#8E9094"/><path d="M0 150H200" stroke="' + INK + '" stroke-width="3"/>';
      const one = things.length === 1;
      seen(things, view).sort((a, b) => b.near - a.near).forEach(x => { const sc = (one ? 1.75 : 1.14) * (1 - 0.09 * x.near); s += '<g transform="translate(' + (38 + 62 * x.slot) + ' ' + (152 - 10 * x.near) + ') scale(' + sc.toFixed(2) + ')">' + side(x.t.kind, x.f) + '</g>'; });
    }
    return s + '</svg>';
  };
  /* the scene: the table seen from the front and above; things stand on its 3 x 3 grid (viewBox 0 0 400 400) */
  const gridPt = (c, r) => { const y = 168 + r * 52, t = (y - 138) / (292 - 138), x0 = 120 - 58 * t, x1 = 280 + 58 * t; return [x0 + (c + 0.5) / 3 * (x1 - x0), y]; };
  const sceneSvg = things => {
    let s = '<svg viewBox="0 0 400 400" width="100%" height="100%" style="pointer-events:none;overflow:visible">';
    s += '<path d="M76 300V352M324 300V352M112 292V318M288 292V318" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/><path d="M76 300V352M324 300V352" stroke="#8E9094" stroke-width="7" stroke-linecap="round"/>';
    s += '<polygon points="120,138 280,138 338,292 62,292" fill="#BEC0C3" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><polygon points="62,292 338,292 338,308 62,308" fill="#8E9094" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
    for (let i = 1; i < 3; i++) { const a = gridPt(i - 0.5, -0.5), b = gridPt(i - 0.5, 2.5); s += '<path d="M' + R1(a[0]) + ' ' + R1(a[1] - 4) + 'L' + R1(b[0]) + ' ' + R1(b[1] - 4) + '" stroke="#A7A9AC" stroke-width="2" stroke-dasharray="6 6"/>'; }
    things.slice().sort((a, b) => a.r - b.r).forEach(t => { const [x, y] = gridPt(t.c, t.r), sc = (things.length === 1 ? 1.6 : 1.22) * (0.8 + 0.1 * t.r); s += '<g transform="translate(' + R1(x) + ' ' + R1(y) + ') scale(' + sc.toFixed(2) + ')">' + side(t.kind, t.kind === 'teapot' ? t.face + 'F' : '') + '</g>'; });
    return s + '</svg>';
  };
  /* a place to take the photo from: a round pad with a camera looking at the table (the cloud: from above) */
  const spotSvg = v => {
    const arrow = { front: 'M50 30V12M42 20L50 12L58 20', back: 'M50 70V88M42 80L50 88L58 80', left: 'M70 50H88M80 42L88 50L80 58', right: 'M30 50H12M20 42L12 50L20 58', top: 'M50 70V90M42 82L50 90L58 82' }[v];
    const base = v === 'top' ? '<path d="M18 62Q6 62 8 50Q8 38 22 40Q24 24 42 26Q52 14 66 24Q84 22 84 40Q96 44 90 56Q88 64 76 64Z" fill="#fff" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' : '<circle cx="50" cy="50" r="44" fill="#FFF3D6" stroke="' + INK + '" stroke-width="4"/>';
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="pointer-events:none;overflow:visible">' + base + '<rect x="32" y="40" width="36" height="24" rx="5" fill="#4A4F57" stroke="' + INK + '" stroke-width="3"/><rect x="40" y="35" width="12" height="7" rx="2" fill="#4A4F57"/><circle cx="50" cy="52" r="8" fill="#9AD3FF" stroke="#fff" stroke-width="3"/><path d="' + arrow + '" fill="none" stroke="#E8414B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };
  /* the arrangements of each level */
  const X5ARR = {
    1: rng => [{ kind: 'teapot', c: 1, r: 1, face: rng.pick(['R', 'L']) }],
    2: rng => { const r = rng.int(0, 2), cs = rng.pick([[0, 2], [0, 1], [1, 2]]), tall = rng.pick(['vase', 'pagoda']), low = rng.pick(['peach', 'box']), k = rng.shuffle([tall, low]); return [{ kind: k[0], c: cs[0], r }, { kind: k[1], c: cs[1], r }]; },
    3: rng => { const c = rng.int(0, 2), rs = rng.pick([[0, 2], [0, 1], [1, 2]]), tall = rng.pick(['vase', 'pagoda']), low = rng.pick(['peach', 'box']), k = rng.shuffle([tall, low]); return [{ kind: k[0], c, r: rs[0] }, { kind: k[1], c, r: rs[1] }]; },
    4: rng => { const c0 = rng.int(0, 1), r0 = rng.int(0, 1), dx = rng.pick([0, 1]), dy = rng.pick([0, 1]), k = rng.shuffle(['vase', 'pagoda', 'peach', 'box']).slice(0, 3);
      const P = [[c0, r0], [c0 + 1, r0], [c0, r0 + 1], [c0 + 1, r0 + 1]], skip = dx + 2 * dy; return P.filter((_, i) => i !== skip).map(([c, r], i) => ({ kind: k[i], c, r })); },
  };
  W5R.X5 = {
    kind0: 'photo5', verb: '拍！', intro: '八戒拍照片！', praise: ['方向想对啦！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      for (let t = 0; t < 200; t++) {
        const things = X5ARR[d === 5 ? rng.pick([3, 4]) : d](rng), sigs = VIEWS.map(v => sigOf(things, v));
        const ok = v => sigs.filter(s => s === sigs[VIEWS.indexOf(v)]).length === 1;
        if (d === 5) {
          const a = bagPick(G, 'x5a', VIEWS); let b = bagPick(G, 'x5b', VIEWS); if (b === a) b = VIEWS[(VIEWS.indexOf(a) + 1 + rng.int(0, 3)) % 5];
          if (!ok(a) || !ok(b)) continue;
          return { d, k: [d, things.map(x => x.kind + x.c + x.r).join('.'), a, b], things, asks: 2, view: a, view2: b, sigs, answer: VIEWS.indexOf(a) + ',' + VIEWS.indexOf(b) };
        }
        const v = bagPick(G, 'x5v' + d, VIEWS);
        if (!ok(v)) continue;
        return { d, k: [d, things.map(x => x.kind + x.c + x.r + (x.face || '')).join('.'), v], things, view: v, sigs, answer: VIEWS.indexOf(v) };
      }
      const things = [{ kind: 'teapot', c: 1, r: 1, face: 'R' }];
      return { d, k: [d, 'x'], things, view: 'left', sigs: VIEWS.map(v => sigOf(things, v)), answer: 2 };
    },
    audit(q) {
      const one = v => ({ n: 5, at: VIEWS.indexOf(v), right: q.sigs.filter(s => s === q.sigs[VIEWS.indexOf(v)]).length });
      return q.asks === 2 ? [one(q.view), one(q.view2)] : [one(q.view)];
    },
    /* the scene (table + places) and the photos: landscape the photo on the right, portrait under it */
    geo() {
      const L = K.L();
      return L ? { sc: [392, 400], ss: 360, spots: { front: [392, 642], back: [392, 168], left: [150, 404], right: [634, 404], top: [196, 196] }, ph: [818, 250], pw: 206, ph2: [818, 492], pw2: 176 }
        : { sc: [352, 486], ss: 380, spots: { front: [352, 744], back: [352, 254], left: [92, 488], right: [612, 488], top: [146, 280] }, ph: [250, 912], pw: 182, ph2: [458, 912], pw2: 182 };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(); if (!st.scene) return;
      place(st.scene, Math.round(g.sc[0] - g.ss / 2), Math.round(g.sc[1] - g.ss / 2), g.ss, g.ss);
      st.spots.forEach((e, i) => { const [x, y] = g.spots[VIEWS[i]]; place(e, Math.round(x - 48), Math.round(y - 48), 96, 96); });
      if (st.topLine) { const [x, y] = g.spots.top; place(st.topLine, 0, 0, Stage.W, Stage.H); st.topLine.firstChild.setAttribute('viewBox', '0 0 ' + Stage.W + ' ' + Stage.H); st.topLine.firstChild.innerHTML = '<path d="M' + x + ' ' + (y + 40) + 'L' + g.sc[0] + ' ' + (g.sc[1] - g.ss * 0.06) + '" stroke="#fff" stroke-width="6" stroke-dasharray="4 10" stroke-linecap="round" opacity=".9"/>'; }
      this.placePhoto(st.photo, g.ph, g.pw);
      if (st.photo2) this.placePhoto(st.photo2, g.ph2, g.pw2);
    },
    placePhoto(e, at, w) { if (e) place(e, Math.round(at[0] - w / 2), Math.round(at[1] - w * 0.56), w, Math.round(w * 1.12)); },
    /* a polaroid with a photo */
    polaroid(st, view, z) {
      const e = W2X.thing(st, 10, 10, z || 6, ''); Object.assign(e.style, { background: '#fff', borderRadius: '8px', boxShadow: '0 0 0 4px ' + INK + ', 0 6px 0 4px rgba(43,33,24,.2)', pointerEvents: 'none' });
      const inner = el('div', '', e); Object.assign(inner.style, { position: 'absolute', left: '7%', top: '6%', width: '86%', height: '77%', overflow: 'hidden', borderRadius: '3px', boxShadow: '0 0 0 2px ' + INK });
      inner.innerHTML = photoSvg(st.q.things, view).replace('width="100%" height="100%"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid slice"');
      return e;
    },
    present(st) {
      const q = st.q;
      st.scene = W2X.thing(st, 10, 10, 3, ''); st.scene.style.pointerEvents = 'none'; st.scene.innerHTML = sceneSvg(q.things);
      st.topLine = W2X.thing(st, 10, 10, 4, ''); st.topLine.style.pointerEvents = 'none'; svg('svg', { width: '100%', height: '100%' }, st.topLine);
      st.spots = VIEWS.map((v, i) => { const e = W2X.thing(st, 96, 96, 7, ''); e.innerHTML = spotSvg(v); e.style.borderRadius = '50%'; K.reg(st, 'sp' + i, e, {}); return e; });
      st.photo = this.polaroid(st, q.view, 6);
      this.place(st);
      K.pop(st, st.scene); st.spots.forEach((e, i) => K.pop(st, e, 100 + 60 * i)); K.pop(st, st.photo, 300);
      if (q.asks === 2) { W5U.twoStart(st, 2); this.ask(st, 0); return; }
      K.task(st, [[ic('<rect x="10" y="24" width="80" height="58" rx="8" fill="#FFF" stroke="#2B2118" stroke-width="4"/><circle cx="50" cy="53" r="17" fill="#9AD3FF" stroke="#2B2118" stroke-width="4"/><rect x="36" y="14" width="28" height="12" rx="3" fill="#4A4F57"/>')], ['q']]);
      K.say(st, '这张在哪里拍的？');
    },
    ask(st, k) {
      const q = st.q;
      if (k === 1) { const old = st.photo; st.scope.anim(old, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-30px) rotate(-6deg)' }], { duration: 300, fill: 'forwards' }).then(() => old.remove()); st.photo = this.polaroid(st, q.view2, 6); this.place(st); K.pop(st, st.photo, 200); }
      $$('.task', Stage.el).forEach(t => t.remove());
      const t = K.task(st, [[ic('<rect x="10" y="24" width="80" height="58" rx="8" fill="#FFF" stroke="#2B2118" stroke-width="4"/><circle cx="50" cy="53" r="17" fill="#9AD3FF" stroke="#2B2118" stroke-width="4"/>')], ['q']]); W5U.pips(st, t, k);
      K.say(st, k === 0 ? '这张在哪里拍的？' : '这张呢？');
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const m = /^sp(\d)$/.exec(p.id || ''); if (!m) return false;
      const i = +m[1]; this.flash(st, i);
      if (st.q.asks === 2) return W5U.twoPut(st, String(i), n => this.ask(st, n));
      st.picked = true; Session.submit(st, i); return 'ok';
    },
    flash(st, i) { const e = st.spots[i]; K.pop(st, e); const b = box(e); Fx.burst(b.x + b.w / 2, b.y + b.h / 2, { n: 8, dist: 46 }); Sfx.pop(); },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.spots) return null;
      if (q.asks !== 2) return { g: 'tap', p: { id: 'sp' + (strat === 'wrong' ? (q.answer + 1 + (st.gen % 4)) % 5 : q.answer) } };
      const k = st.fill.indexOf(null); if (k < 0) return null;
      const want = +String(q.answer).split(',')[k], bad = strat === 'wrong' && k === st.gen % 2;
      return { g: 'tap', p: { id: 'sp' + (bad ? (want + 1 + (st.gen % 4)) % 5 : want) } };
    },
    bad(st, ans) { return st.q.asks === 2 ? W5U.twoBad(st, ans) : (ans === st.q.answer ? [] : [0]); },
    pick(st, ans, k) { return st.q.asks === 2 ? +String(ans).split(',')[k] : ans; },
    rightOf(st, k) { return st.q.asks === 2 ? +String(st.q.answer).split(',')[k] : st.q.answer; },
    async feedback(st, ans) {
      const k = this.bad(st, ans)[0] || 0; K.wiggle(st, st.spots[this.pick(st, ans, k)]);
      W5U.say(st, '从这里拍不一样');
      await st.scope.wait(T(550));
    },
    /* a photo taken from place i flies from it to the second photo's place */
    async shoot(st, i, ring) {
      const g = this.geo(), my = st;
      if (st.photo2) st.photo2.remove();
      this.flash(st, i);
      st.photo2 = this.polaroid(st, VIEWS[i], 8); this.placePhoto(st.photo2, g.ph2, g.pw2);
      const b = box(st.spots[i]), p = box(st.photo2);
      await st.scope.anim(st.photo2, [{ transform: 'translate(' + R1(b.x + b.w / 2 - p.x - p.w / 2) + 'px,' + R1(b.y + b.h / 2 - p.y - p.h / 2) + 'px) scale(.25)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: EASE.glide });
      if (!Session.alive(my)) return;
      W5U.ring(st, st.photo2, ring, 6);
    },
    /* 1. his place: its photo next to the question's, blue ("从这里拍是这样"); 2. the right place: the same photo, gold */
    async explain(st, ans) {
      const q = st.q, my = st, k = this.bad(st, ans)[0] || 0, mine = this.pick(st, ans, k), right = this.rightOf(st, k);
      if (q.asks === 2 && k === 0) { st.photo.remove(); st.photo = this.polaroid(st, q.view, 6); this.place(st); }
      W5U.blue(st, this.bad(st, ans).map(j => st.spots[this.pick(st, ans, j)]));
      await this.shoot(st, mine, BLUE); if (!Session.alive(my)) return;
      W5U.note(st, '从这里拍是这样');
      await st.scope.wait(1100); if (!Session.alive(my)) return;
      await this.shoot(st, right, GOLD); if (!Session.alive(my)) return;
      W5U.gold(st, this.bad(st, ans).map(j => st.spots[this.rightOf(st, j)]).concat([st.photo]));
      await W5U.sum(st, '在这里拍的！');
      await st.scope.wait(250);
    },
    rightEls(st, ans) { return this.bad(st, ans).map(j => st.spots[this.rightOf(st, j)]); },
    async reveal(st) {
      const q = st.q, ks = q.asks === 2 ? [0, 1] : [0];
      W5U.gold(st, ks.map(j => st.spots[this.rightOf(st, j)]).concat([st.photo])); Sfx.reveal();
      this.cheerAll(st);
      st.summary = '在这里拍的！'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.spots || []; },
    snap(st) { return { view: st.q.view, fill: (st.fill || []).slice() }; },
    lines() { return uniq([this.intro, '这张在哪里拍的？', '这张呢？', '从这里拍不一样', '从这里拍是这样', '在这里拍的！'].concat(this.praise)); },
  };

  /* ================================================================ X6 拉！ 拉直比一比 (F9 Fruit Party: how long is a bent line; S14 Who
     Is Taller?). A grid mat on the ground, five vine ropes from five little posts on the left, each in its own lane, winding
     along the grid lines with a knot at every grid point (L1-L3: count the pieces between knots); from L4 smooth curves with a
     bead on every unit of length. Tap a rope (its whole lane, 88 high). The ropes are not pulled straight by the child - that
     is the demonstration.
       L1 straight ropes and ropes with one bend, 2-7 long, the longest 2 more than the next: "哪根最长？" · L2 zigzags, the
       longest or the shortest (a bag); the rope whose ends are farthest apart is not the longest (closest: not the shortest) ·
       L3 a straight rope above: "哪根和它一样长？" - one of the five bent ones · L4 smooth curves with beads: longest / shortest /
       as long as the straight one · L5 one long winding rope (8-15): "这根有几格长？" - five number cards.
     Wrong: his rope is pulled straight in its lane, its pieces numbered ("这根是六格"), blue; the right one pulled straight too,
     the two now side by side from the same post, gold ("九格最长！"). */
  /* a rope on the grid: from (0, y0) along the lines y = 0 / 1 of its lane: horizontal runs and steps across */
  const gridRope = (rng, len, bends) => {
    for (let t = 0; t < 200; t++) {
      const runs = bends + 1, h = len - bends; if (h < runs) return null;
      const a = Array(runs).fill(1); for (let k = runs; k < h; k++) a[rng.int(0, runs - 1)]++;
      if (a.some(x => x > 7)) continue;
      let x = 0, y = rng.pick([0, 1]); const pts = [[x, y]];
      a.forEach((r, i) => { x += r; pts.push([x, y]); if (i < runs - 1) { y = 1 - y; pts.push([x, y]); } });
      if (x > 8) continue;
      return { pts, len };
    }
    return null;
  };
  /* a smooth rope: y = 0.5 + A sin(2π x / P + ph) (lane units), its span chosen so that it is exactly len long */
  const arcLen = (A, P, ph, span) => { let L = 0, px = 0, py = 0.5 + A * Math.sin(ph); for (let i = 1; i <= 120; i++) { const x = span * i / 120, y = 0.5 + A * Math.sin(2 * Math.PI * x / P + ph); L += Math.hypot(x - px, y - py); px = x; py = y; } return L; };
  const smoothRope = (rng, len, flat) => {
    const A = flat ? 0.16 : rng.pick([0.36, 0.42, 0.48]), P = flat ? 2.6 : rng.pick([1.2, 1.5, 1.8]), ph = rng.pick([0, Math.PI]);
    let lo = 0.5, hi = len; for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; if (arcLen(A, P, ph, m) < len) lo = m; else hi = m; }
    const span = (lo + hi) / 2, pts = []; for (let i = 0; i <= 120; i++) { const x = span * i / 120; pts.push([R1(x * 100) / 100, R1((0.5 + A * Math.sin(2 * Math.PI * x / P + ph)) * 100) / 100]); }
    return { pts, len, smooth: 1 };
  };
  /* a long rope that winds over a block of the grid (L5): a snake path */
  const longRope = (rng, len) => {
    for (let t = 0; t < 400; t++) {
      const W = 7, H = 4, seen = new Set(), pts = [[0, rng.int(0, H)]]; seen.add(pts[0].join());
      let dir = [1, 0], ok = true;
      for (let k = 0; k < len; k++) {
        const [x, y] = pts[pts.length - 1];
        const opts = [[1, 0], [0, 1], [0, -1], [-1, 0]].filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && nx <= W && ny >= 0 && ny <= H && !seen.has(nx + ',' + ny); });
        if (!opts.length) { ok = false; break; }
        const keep = opts.find(o => o[0] === dir[0] && o[1] === dir[1]), d = keep && rng.chance(0.4) ? keep : rng.pick(opts);
        dir = d; pts.push([x + d[0], y + d[1]]); seen.add(pts[pts.length - 1].join());
      }
      if (!ok) continue;
      /* merge straight runs (fewer vertices; the knots still come at every unit) */
      const out = [pts[0]]; for (let k = 1; k < pts.length - 1; k++) { const a = out[out.length - 1], b = pts[k], c = pts[k + 1]; if ((b[0] - a[0]) * (c[1] - b[1]) !== (b[1] - a[1]) * (c[0] - b[0])) out.push(b); } out.push(pts[pts.length - 1]);
      const xs = out.map(p => p[0]); if (Math.max(...xs) - Math.min(...xs) < 4 || out.length - 2 < Math.min(6, Math.floor(len / 2))) continue;
      return { pts: out, len };
    }
    return { pts: [[0, 0], [len, 0]], len };
  };
  const span = r => Math.hypot(r.pts[r.pts.length - 1][0] - r.pts[0][0], r.pts[r.pts.length - 1][1] - r.pts[0][1]);
  const cum = pts => { const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return S; };
  W5R.X6 = {
    kind0: 'rope5', verb: '拉！', intro: '哪根绳子长？', praise: ['量得真准！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      if (d === 5) { const len = rng.int(8, 15), r = longRope(rng, len); return { d, k: [d, r.pts.join('|')], ropes: [r], ask: 'count', answer: len, opts: W5U.nums(G, len, 1, 19) }; }
      const ask = d === 1 ? 'long' : d === 2 ? bagPick(G, 'x6a2', ['long', 'short']) : d === 3 ? 'same' : bagPick(G, 'x6a4', ['long', 'short', 'same']);
      for (let t = 0; t < 300; t++) {
        let lens, ref = null;
        if (ask === 'same') { ref = rng.int(3, 6); lens = [ref].concat(rng.shuffle([ref - 2, ref - 1, ref + 1, ref + 2, ref + 1, ref - 1]).filter(x => x >= 2).slice(0, 4)); }
        else if (d === 1) { const top = rng.int(5, 7), rest = rng.shuffle([2, 3, 4, 5].filter(x => x <= top - 2)); while (rest.length < 4) rest.push(rng.int(2, top - 2)); lens = [top].concat(rest.slice(0, 4)); }
        else if (ask === 'long') { const top = rng.int(6, 9); lens = [top, top - 1].concat(Array.from({ length: 3 }, () => rng.int(3, top - 1))); }
        else { const lo = rng.int(4, 5); lens = [lo, lo + 1].concat(Array.from({ length: 3 }, () => rng.int(lo + 1, 9))); }
        /* the trap: the longest rope winds a lot and a slightly shorter one is straight (or the shortest is straight and a
           longer one winds a lot), so the ends do not tell */
        const wind = L => Math.max(1, Math.min(Math.floor((L - 1) / 2), rng.int(1, 4)));
        const mk = (L, i) => {
          if (d === 4) return smoothRope(rng, L, ask === 'long' ? i === 1 : ask === 'short' ? i === 0 : rng.chance(0.3));
          if (d === 1) return gridRope(rng, L, L >= 3 && rng.chance(0.5) ? 1 : 0);
          if (ask === 'long') return gridRope(rng, L, i === 0 ? Math.max(2, wind(L)) : i === 1 ? 0 : wind(L));
          if (ask === 'short') return gridRope(rng, L, i === 0 ? 0 : i === 1 ? 2 : wind(L));
          return gridRope(rng, L, i === 0 ? Math.max(2, wind(L)) : wind(L));
        };
        const ropes = lens.map(mk); if (ropes.some(r => !r)) continue;
        if (ask === 'same' && span(ropes[0]) >= ref - 0.5) continue;
        if (ask === 'long' && d > 1) { const S = ropes.map(span); if (!(Math.max(...S.slice(1)) > S[0] + 0.4)) continue; }
        if (ask === 'short') { const S = ropes.map(span); if (!(Math.min(...S.slice(1)) < S[0] - 0.4)) continue; }
        const deck = W5U.deal(G, ropes[0], ropes.slice(1), 'x6');
        return { d, k: [d, ask, deck.map(r => r.len + ':' + r.pts.length).join('.'), rng.int(0, 99)], ropes: deck, ask, ref, answer: deck.indexOf(ropes[0]) };
      }
      const ropes = [3, 2, 5, 4, 7].map(L => ({ pts: [[0, 0], [L, 0]], len: L })); return { d, k: [d, 'x'], ropes, ask: 'long', answer: 4 };
    },
    audit(q) {
      if (q.ask === 'count') return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.opts.filter(v => v === q.answer).length }];
      const L = q.ropes.map(r => r.len), want = q.ask === 'long' ? Math.max(...L) : q.ask === 'short' ? Math.min(...L) : q.ref;
      return [{ n: L.length, at: q.answer, right: L.filter(x => x === want).length }];
    },
    /* u: one unit; x0: the posts; y0: the first lane's top line; lanes 2u apart (a rope uses its lane's two lines) */
    geo(q) {
      const L = K.L(), ref = q.ask === 'same';
      if (q.ask === 'count') return L ? { u: 44, x0: 180, y0: 150, cy: 612, cs: 116, gap: 18, sy: 410 } : { u: 40, x0: 72, y0: 270, cy: 830, cs: 120, gap: 12, sy: 520 };
      return L ? { u: 44, x0: 200, y0: ref ? 212 : 150, ry: 128 } : { u: 44, x0: 84, y0: ref ? 360 : 310, ry: 274 };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    /* rope i's own frame -> stage */
    toStage(st, i, x, y) { const g = this.geo(st.q); return [g.x0 + x * g.u, g.y0 + (st.q.ask === 'count' ? 0 : 2 * i * g.u) + y * g.u]; },
    place(st) {
      const q = st.q, g = this.geo(q); if (!st.sv) return;
      place(st.svEl, 0, 0, Stage.W, Stage.H); st.sv.setAttribute('viewBox', '0 0 ' + Stage.W + ' ' + Stage.H);
      (st.lanes || []).forEach((e, i) => place(e, g.x0 - 46, Math.round(g.y0 + 2 * i * g.u - 0.5 * g.u), Math.round(9.5 * g.u + 46), 2 * g.u));
      if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.cy, g.cs, g.cs, g.gap);
      this.draw(st);
    },
    cardSpot(st) { const g = this.geo(st.q); return { cx: Stage.W / 2, cy: g.cy || 612, size: g.cs || 116, gap: g.gap || 18 }; },
    /* the mat, the posts, the reference rope, every rope (pulled straight by k[i] in 0..1) and its numbers */
    draw(st) {
      const q = st.q, g = this.geo(q), s = st.sv, u = g.u;
      while (s.firstChild) s.removeChild(s.firstChild);
      const n = q.ask === 'count' ? 1 : q.ropes.length, cols = q.ask === 'count' ? 15 : 10, rows = q.ask === 'count' ? 4 : 2 * n - 1;
      const mx = g.x0 - 0.5 * u, my = g.y0 - 0.5 * u;
      svg('rect', { x: mx, y: my, width: (cols + 1) * u, height: (rows + 1) * u + (q.ask === 'count' ? 3 * u : 0), rx: 18, fill: 'rgba(245,232,200,.86)', stroke: '#8A6A3E', 'stroke-width': 4 }, s);
      const gr = svg('g', { stroke: 'rgba(138,106,62,.35)', 'stroke-width': 2 }, s);
      for (let c = 0; c <= cols; c++) svg('line', { x1: g.x0 + c * u, y1: my + 0.2 * u, x2: g.x0 + c * u, y2: my + (rows + 0.8) * u + (q.ask === 'count' ? 3 * u : 0) }, gr);
      for (let r = 0; r <= rows + (q.ask === 'count' ? 3 : 0); r++) svg('line', { x1: mx + 0.2 * u, y1: g.y0 + r * u, x2: g.x0 + (cols + 0.3) * u, y2: g.y0 + r * u }, gr);
      if (q.ask === 'same') {
        const y = g.ry; svg('rect', { x: g.x0 - 0.6 * u, y: y - 0.6 * u, width: (q.ref + 1.2) * u, height: 1.2 * u, rx: 14, fill: 'rgba(255,248,236,.9)', stroke: INK, 'stroke-width': 3 }, s);
        this.ropeSvg(s, [[g.x0, y], [g.x0 + q.ref * u, y]], q.ref, q.d === 4, '#C98B4A');
      }
      q.ropes.forEach((r, i) => {
        const k = (st.k || [])[i] || 0, S = cum(r.pts), base = q.ask === 'count' ? [g.x0, g.y0 + 5.5 * u] : this.toStage(st, i, 0, 0.5);
        const P = r.pts.map((p, j) => { const a = this.toStage(st, i, p[0], p[1]), b = [base[0] + S[j] * u, base[1]]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; });
        const post = P[0];
        svg('rect', { x: post[0] - 14, y: post[1] - 20, width: 14, height: 40, rx: 4, fill: '#8A5A2E', stroke: INK, 'stroke-width': 3 }, s);
        this.ropeSvg(s, P, r.len, !!r.smooth, (st.tint || [])[i]);
        (st.nums || [])[i] && this.numbers(st, s, P, r.len, st.nums[i]);
      });
    },
    /* a rope through stage points P (len units long): a thick vine, knots on every unit (or beads) */
    ropeSvg(s, P, len, smooth, tint) {
      const d = 'M' + P.map(p => R1(p[0]) + ' ' + R1(p[1])).join('L');
      svg('path', { d, fill: 'none', stroke: INK, 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      svg('path', { d, fill: 'none', stroke: tint || '#B97A3C', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      /* knots at whole units (grid ropes) / a bead in the middle of every unit (smooth) */
      const L = cum(P), tot = L[L.length - 1], unit = tot / len;
      const marks = []; for (let j = smooth ? 0.5 : 0; j <= len + 1e-6; j++) marks.push(j * unit);
      marks.forEach(m => { let i = 1; while (i < L.length - 1 && L[i] < m) i++; const a = P[i - 1], b = P[i], seg = L[i] - L[i - 1], t = seg ? (m - L[i - 1]) / seg : 0; const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        svg('circle', { cx: R1(x), cy: R1(y), r: smooth ? 7 : 5.5, fill: smooth ? '#FF9F43' : '#6B4423', stroke: INK, 'stroke-width': smooth ? 2.5 : 1.5 }, s); });
    },
    /* numbers on the pieces of a straightened rope (n of them shown so far) */
    numbers(st, s, P, len, n) {
      const L = cum(P), tot = L[L.length - 1], unit = tot / len;
      for (let j = 0; j < Math.min(n, len); j++) {
        const m = (j + 0.5) * unit; let i = 1; while (i < L.length - 1 && L[i] < m) i++; const a = P[i - 1], b = P[i], seg = L[i] - L[i - 1], t = seg ? (m - L[i - 1]) / seg : 0;
        const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t - 22;
        svg('circle', { cx: R1(x), cy: R1(y), r: 13, fill: '#fff', stroke: INK, 'stroke-width': 2.5 }, s);
        const tx = svg('text', { x: R1(x), y: R1(y + 6), 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 900, fill: INK, 'font-family': 'system-ui,sans-serif' }, s); tx.textContent = j + 1;
      }
    },
    present(st) {
      const q = st.q;
      st.k = q.ropes.map(() => 0); st.nums = q.ropes.map(() => 0); st.tint = q.ropes.map(() => null);
      st.svEl = W2X.thing(st, Stage.W, Stage.H, 4, ''); st.svEl.style.pointerEvents = 'none';
      st.sv = svg('svg', { width: '100%', height: '100%' }, st.svEl); st.sv.style.overflow = 'visible';
      if (q.ask === 'count') { st.cards = numRow(st, q.opts, this.geo(q).cs, 'card'); st.opts = q.opts.slice(); }
      else st.lanes = q.ropes.map((_, i) => { const e = W2X.thing(st, 10, 10, 6, ''); e.style.borderRadius = '16px'; K.reg(st, 'r' + i, e, {}); return e; });
      this.place(st);
      K.pop(st, st.svEl);
      K.task(st, [[ic('<path d="M10 70Q24 20 40 60T70 40T92 60" fill="none" stroke="#B97A3C" stroke-width="8" stroke-linecap="round"/><path d="M10 88H92" stroke="#2B2118" stroke-width="5" stroke-dasharray="9 6"/>')], ['q']]);
      K.say(st, { long: '哪根最长？', short: '哪根最短？', same: '哪根和它一样长？', count: '这根有几格长？' }[q.ask]);
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      if (st.q.ask === 'count') return W5U.tapCard(st, name, p);
      const m = /^r(\d)$/.exec(p.id || ''); if (!m) return false;
      st.picked = true; st.tint[+m[1]] = '#E2A15B'; this.draw(st); K.pop(st, st.lanes[+m[1]]); Session.submit(st, +m[1]); return 'ok';
    },
    next(st, strat) {
      const q = st.q; if (st.picked) return null;
      if (q.ask === 'count') return W5U.cardNext(st, strat);
      if (!st.lanes) return null;
      return { g: 'tap', p: { id: 'r' + (strat === 'wrong' ? (q.answer + 1 + (st.gen % 4)) % 5 : q.answer) } };
    },
    lineIs: v => '这根是' + CNQ(v) + '格',
    async feedback(st, ans) {
      const q = st.q;
      if (q.ask === 'count') { const c = W5U.cardOf(st, ans); if (c) K.wiggle(st, c); W5U.say(st, '不是' + CNQ(ans) + '格'); }
      else { K.wiggle(st, st.lanes[ans]); W5U.say(st, q.ask === 'long' ? '还有更长的' : q.ask === 'short' ? '还有更短的' : this.lineIs(q.ropes[ans].len)); }
      await st.scope.wait(T(550));
    },
    /* pull rope i straight (0.6 s), then number its pieces one by one */
    async straighten(st, i, tint) {
      const my = st, len = st.q.ropes[i].len;
      st.tint[i] = tint;
      await tween(st, 480, k => { st.k[i] = k; this.draw(st); }); if (!Session.alive(my)) return;
      Sfx.whoosh(0.15);
      const dt = len > 9 ? 80 : 100;
      for (let j = 1; j <= len; j++) st.scope.timeout(() => { if (!Session.alive(my)) return; st.nums[i] = j; this.draw(st); Sfx.count(Math.min(20, j)); }, dt * j);
      return T(dt * len + 150);
    },
    /* 1. his rope pulled straight and numbered, blue ("这根是六格"); 2. the right one the same, gold ("九格最长！") */
    async explain(st, ans) {
      const q = st.q, my = st;
      if (q.ask === 'count') {
        W5U.blue(st, W5U.cardOf(st, ans));
        await fbDone(st); if (!Session.alive(my)) return;
        const ms = await this.straighten(st, 0, '#FFC93C'); if (!Session.alive(my)) return;
        await st.scope.wait(ms);
        W5U.gold(st, W5U.cardOf(st, q.answer));
        await W5U.sum(st, this.lineIs(q.answer));
        await st.scope.wait(250);
        return;
      }
      W5U.blue(st, st.lanes[ans]);
      const m1 = await this.straighten(st, ans, '#7FC3F2'); if (!Session.alive(my)) return;
      /* 这根是六格: for 一样长 that was the feedback line already (said once) */
      if (q.ask === 'same') { const t0 = now(); await fbDone(st); if (!Session.alive(my)) return; await st.scope.wait(Math.max(200, m1 - (now() - t0))); }
      else { W5U.note(st, this.lineIs(q.ropes[ans].len)); await st.scope.wait(Math.max(900, m1)); }
      if (!Session.alive(my)) return;
      const m2 = await this.straighten(st, q.answer, '#FFC93C'); if (!Session.alive(my)) return;
      W5U.gold(st, st.lanes[q.answer]);
      const L = q.ropes[q.answer].len;
      W5U.sum(st, q.ask === 'long' ? CNQ(L) + '格最长！' : q.ask === 'short' ? CNQ(L) + '格最短！' : '也是' + CNQ(L) + '格！');
      await st.scope.wait(Math.max(1000, m2));
    },
    rightEls(st) { return [st.q.ask === 'count' ? W5U.cardOf(st, st.q.answer) : st.lanes[st.q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st;
      W5U.gold(st, this.rightEls(st)); Sfx.reveal();
      const i = q.ask === 'count' ? 0 : q.answer, ms = await this.straighten(st, i, '#FFC93C'); if (!Session.alive(my)) return;
      this.cheerAll(st);
      const L = q.ropes[i].len;
      st.summary = q.ask === 'long' ? CNQ(L) + '格最长！' : q.ask === 'short' ? CNQ(L) + '格最短！' : q.ask === 'same' ? '也是' + CNQ(L) + '格！' : this.lineIs(L);
      W5U.sum(st, st.summary);
      await st.scope.wait(Math.max(T(900), ms));
    },
    workEls(st) { return st.q.ask === 'count' ? st.cards || [] : st.lanes || []; },
    snap(st) { return { lens: st.q.ropes.map(r => r.len) }; },
    lines() {
      const out = [this.intro, '哪根最长？', '哪根最短？', '哪根和它一样长？', '这根有几格长？', '还有更长的', '还有更短的'].concat(this.praise);
      for (let v = 2; v <= 15; v++) out.push(this.lineIs(v));
      for (let v = 4; v <= 19; v++) out.push('不是' + CNQ(v) + '格');
      for (let v = 5; v <= 9; v++) out.push(CNQ(v) + '格最长！');
      for (let v = 2; v <= 5; v++) out.push(CNQ(v) + '格最短！');
      for (let v = 3; v <= 6; v++) out.push('也是' + CNQ(v) + '格！');
      return uniq(out);
    },
  };

  /* ================================================================ X7 排！ 取经队排队 (F13 Field Trip: ordinal numbers, position). The
     team walks along a mountain road (landscape to the right, portrait upwards - the front one carries a little flag): 2-4 of
     唐僧 / 悟空 / 八戒 / 沙僧 / 白龙马 and block men, 5-9 in all. Five number cards (第几: a flag on the card; 几个: dots).
       L1 5 in the team: "从前面数，八戒是第几个？" or from the back (a bag) · L2 6-7: "第几个" or "八戒前面有几个？" (a bag; the
       number in front is one less than the place - the usual mix-up) · L3 7-8: "八戒从前数第三，从后数是第几？" · L4 a hill hides
       the team, only he shows: "八戒前面有两个，后面有三个，一共几个？" (<= 9) · L5 hidden too: "从前数他第三，从后数他第四，一共几
       个？" (3 + 4 - 1).
     The friends do not watch from the corners here (they walk in the team). Wrong: his card blue ("不是第四个" / "要从后面数哦" /
     "别忘了他自己"); the hill moves away, flags with numbers go up over the team from the end that is counted (only the ones in
     front of him for 前面有几个); the right card gold ("八戒是第三个" / "一共六个"). */
  const TEAM = ['tangseng', 'wukong', 'bajie', 'shaseng', 'dragon_horse'];
  const MANC = ['#4FB3FF', '#5CC46E', '#FF9F43', '#B57BFF', '#FF6FA8', '#3DD6C6'];
  W5R.X7 = {
    kind0: 'queue5', verb: '排！', intro: '取经队出发！', praise: ['数得真清楚！'], props: [],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      const n = d === 1 ? 5 : d === 2 ? rng.int(6, 7) : d === 3 ? rng.int(7, 8) : 0;
      if (d >= 4) {
        let a, b, tot;
        if (d === 4) { do { a = rng.int(1, 5); b = rng.int(1, 5); } while (a + b + 1 > 9); tot = a + b + 1; }
        else { do { a = rng.int(2, 6); b = rng.int(2, 6); } while (a + b - 1 > 9 || a + b - 1 < 4); tot = a + b - 1; }
        const pos = d === 4 ? a : a - 1, who = rng.pick(TEAM), team = this.team(rng, tot, pos, who);
        return { d, k: [d, a, b, who], n: tot, team, pos, who, ask: 'total', a, b, answer: tot, opts: W5U.nums(G, tot, 3, 13), hide: true };
      }
      const ask = d === 1 ? 'ord' : d === 2 ? bagPick(G, 'x7a2', ['ord', 'before']) : 'ord';
      const from = d === 1 ? bagPick(G, 'x7f1', ['front', 'back']) : d === 2 ? 'front' : 'back';
      /* his place from a bag (never the very front when asking who is in front of him) */
      const places = Array.from({ length: n }, (_, i) => i).filter(i => !(ask === 'before' && i === 0));
      const pos = bagPick(G, 'x7p' + d + n + ask, places), who = rng.pick(TEAM), team = this.team(rng, n, pos, who);
      const answer = ask === 'before' ? pos : from === 'front' ? pos + 1 : n - pos;
      return { d, k: [d, n, pos, ask, from, who], n, team, pos, who, ask, from, answer, opts: W5U.nums(G, answer, ask === 'before' ? 0 : 1, 9) };
    },
    /* the team (front first): he at pos, 1-3 more named friends, block men in between */
    team(rng, n, pos, who) {
      const others = rng.shuffle(TEAM.filter(x => x !== who)).slice(0, rng.int(1, Math.min(3, n - 1)));
      const T = Array(n).fill(null); T[pos] = who;
      rng.shuffle(Array.from({ length: n }, (_, i) => i).filter(i => i !== pos)).slice(0, others.length).forEach((i, k) => { T[i] = others[k]; });
      return T.map(x => x || 'man' + rng.int(0, MANC.length - 1));
    },
    audit(q) { return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.opts.filter(v => v === q.answer).length }]; },
    /* landscape: the front at the right, the cards below; portrait: the front at the top, the cards in a column on the right */
    geo(q) {
      const L = K.L(), n = q.hide ? 9 : q.n;          /* hidden behind the hill: the spacing (and the hill) as for the longest team - they give nothing away */
      if (L) { const sp = Math.min(116, 760 / n); return { L, x0: 848, y0: 430, sp, h: Math.min(124, sp * 1.2), cy: 612, cs: 116, gap: 18 }; }
      const sp = Math.min(92, 580 / n); return { L, x0: 190, y0: 340, sp, h: Math.min(92, sp * 1.0), cx: 548, cs: 112, gap: 14 };
    },
    decor(G) { this.chars.forEach(id => { const a = G.actors[id]; if (a) hideActor(a); }); },
    spot(q, i) { const g = this.geo(q); return g.L ? [g.x0 - i * g.sp, g.y0] : [g.x0, g.y0 + i * g.sp]; },
    place(st) {
      const q = st.q, g = this.geo(q); if (!st.people) return;
      st.people.forEach((e, i) => { const [x, y] = this.spot(q, i), w = Math.round(g.h * e._ar); place(e, Math.round(x - w / 2), Math.round(y - g.h), w, Math.round(g.h)); });
      if (st.road) { place(st.road, 0, 0, Stage.W, Stage.H); st.road.firstChild.setAttribute('viewBox', '0 0 ' + Stage.W + ' ' + Stage.H); st.road.firstChild.innerHTML = this.roadSvg(q); }
      if (st.hill) { const b = this.hillBox(q); place(st.hill, b.x, b.y, b.w, b.h); const hp = st.hill.querySelector('path'); if (hp) hp.setAttribute('d', K.L() ? 'M0 100V36Q8 8 22 26Q34 2 50 20Q64 0 78 22Q92 6 100 32V100Z' : 'M0 100V14Q8 2 22 9Q34 0 50 7Q64 0 78 8Q92 2 100 13V100Z'); }
      if (st.cards) { if (g.L) W5U.lay(st.cards, Stage.W / 2, g.cy, g.cs, g.cs, g.gap); else W5U.lay(st.cards, g.cx, 560, g.cs, g.cs, g.gap, g.gap, 1); }
    },
    cardSpot(st) { const g = this.geo(st.q); return g.L ? { cx: Stage.W / 2, cy: g.cy, size: g.cs, gap: g.gap } : { cx: g.cx, cy: 560, size: g.cs, gap: g.gap }; },
    /* the road, the flag of the front one, an arrow: this way is the front */
    roadSvg(q) {
      const g = this.geo(q), f = this.spot(q, 0), b = this.spot(q, (q.hide ? 9 : q.n) - 1);
      if (g.L) return '<path d="M30 ' + (g.y0 + 6) + 'H994" stroke="#C9A36A" stroke-width="58" stroke-linecap="round" opacity=".85"/><path d="M30 ' + (g.y0 + 6) + 'H994" stroke="#E2C48F" stroke-width="40" stroke-linecap="round" stroke-dasharray="2 26" opacity=".9"/>' +
        '<path d="M' + (f[0] + 52) + ' ' + (g.y0 - 40) + 'H' + (f[0] + 96) + 'M' + (f[0] + 82) + ' ' + (g.y0 - 54) + 'L' + (f[0] + 98) + ' ' + (g.y0 - 40) + 'L' + (f[0] + 82) + ' ' + (g.y0 - 26) + '" fill="none" stroke="#E8414B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
      return '<path d="M' + g.x0 + ' ' + (f[1] - g.h - 60) + 'V' + (b[1] + 24) + '" stroke="#C9A36A" stroke-width="64" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M' + (g.x0 + 56) + ' ' + (f[1] - 30) + 'V' + (f[1] - 76) + 'M' + (g.x0 + 42) + ' ' + (f[1] - 62) + 'L' + (g.x0 + 56) + ' ' + (f[1] - 78) + 'L' + (g.x0 + 70) + ' ' + (f[1] - 62) + '" fill="none" stroke="#E8414B" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    /* the hill: its body (below 36 % of its box) covers every one of them */
    hillBox(q) {
      const g = this.geo(q), f = this.spot(q, 0), b = this.spot(q, 8);
      if (g.L) { const H = Math.round((g.h + 80) / 0.62); return { x: b[0] - 74, y: g.y0 + 34 - H, w: f[0] - b[0] + 148, h: H }; }
      const top = f[1] - g.h - 20, bot = b[1] + 34, H = Math.round((bot - top) / 0.86); return { x: g.x0 - 104, y: bot - H, w: 208, h: H };
    },
    person(st, id, i) {
      const e = W2X.thing(st, 10, 10, 4, ''); e.style.pointerEvents = 'none';
      if (id.startsWith('man')) { e.appendChild(W5U.blockMan({ color: MANC[+id.slice(3)], front: true })); e._ar = 100 / 160; }
      else { const im = W2X.charImg(id); Object.assign(im.style, { width: '100%', height: '100%' }); e.appendChild(im); e._ar = (META[id] ? META[id][0] / META[id][1] : 0.7); }
      if (i === 0) { const f = el('div', '', e); Object.assign(f.style, { position: 'absolute', right: '-16px', top: '-30px', width: '34px', height: '46px', pointerEvents: 'none' }); f.innerHTML = '<svg viewBox="0 0 34 46" width="100%" height="100%"><path d="M4 2V44" stroke="#2B2118" stroke-width="4"/><path d="M6 4H32L26 12L32 20H6Z" fill="#E8414B" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/></svg>'; }
      return e;
    },
    /* the cards: 第几 a flag with the number; 几个 the number with its dots */
    card(v, size, ord) {
      if (!ord) return UI.card(v, size, { layout: 'frame' });
      const c = el('div', 'card'); c.style.width = c.style.height = size + 'px';
      const f = el('div', '', c); Object.assign(f.style, { display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' });
      const fl = el('span', '', f); fl.innerHTML = '<svg viewBox="0 0 30 44" width="' + Math.round(size * 0.26) + '" height="' + Math.round(size * 0.38) + '"><path d="M4 2V42" stroke="#2B2118" stroke-width="4"/><path d="M6 4H28L22 11L28 18H6Z" fill="#E8414B" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/></svg>';
      f.appendChild(UI.num(v, Math.round(size * 0.46)));
      c._n = v; return c;
    },
    words(q) {
      const N = NAME[q.who];
      if (q.ask === 'total') return q.d === 4 ? { lead: [N + '前面有' + CNQ(q.a) + '个，', '后面有' + CNQ(q.b) + '个，'], ask: '一共几个？' } : { lead: ['从前数他第' + CN[q.a] + '，', '从后数他第' + CN[q.b] + '，'], ask: '一共几个？' };
      if (q.ask === 'before') return { lead: null, ask: N + '前面有几个？' };
      if (q.d === 3) return { lead: N + '从前数第' + CN[q.pos + 1] + '，', ask: '从后数是第几？' };
      return { lead: q.from === 'front' ? '从前面数，' : '从后面数，', ask: N + '是第几个？' };
    },
    present(st) {
      const q = st.q, g = this.geo(q);
      st.road = W2X.thing(st, 10, 10, 2, ''); st.road.style.pointerEvents = 'none'; svg('svg', { width: '100%', height: '100%' }, st.road).style.overflow = 'visible';
      st.people = q.team.map((id, i) => this.person(st, id, i));
      if (q.hide) { st.hill = W2X.thing(st, 10, 10, 5, ''); st.hill.style.pointerEvents = 'none'; st.hill.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none"><path d="' + (K.L() ? 'M0 100V36Q8 8 22 26Q34 2 50 20Q64 0 78 22Q92 6 100 32V100Z' : 'M0 100V14Q8 2 22 9Q34 0 50 7Q64 0 78 8Q92 2 100 13V100Z') + '" fill="#7FA35B" stroke="#2B2118" stroke-width="1.6" vector-effect="non-scaling-stroke"/><path d="M14 84Q30 68 44 82Q60 64 78 80" fill="none" stroke="#5E8442" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'; st.people[q.pos].style.zIndex = 7; }
      const ord = q.ask === 'ord';
      st.cards = q.opts.map((v, i) => { const c = this.card(v, g.cs, ord); Stage.el.appendChild(c); c.style.position = 'absolute'; K.reg(st, 'card' + i, c, {}); st.els.push(c); K.pop(st, c, 200 + 60 * i); return c; });
      st.opts = q.opts.slice();
      this.place(st);
      st.people.forEach((e, i) => K.pop(st, e, 40 * i));
      const head = img('assets/thumbs/' + q.who + '.png', ''); head.style.height = '54px'; head.style.borderRadius = '50%';
      K.task(st, [[{ node: head }], ['q']]);
      const W = this.words(q);
      if (W.lead) { st.lead = W.lead; [].concat(W.lead).forEach(l => Voice.say(l, { tag: 'prompt' })); }
      K.say(st, W.ask);
    },
    onGesture(st, name, p) { return W5U.tapCard(st, name, p); },
    next(st, strat) { return W5U.cardNext(st, strat); },
    /* what his card is: the place counted from the other end, himself forgotten / counted twice, or just not it */
    wrongLine(q, v) {
      if (q.ask === 'total') return q.d === 4 && v === q.a + q.b ? '别忘了他自己' : q.d === 5 && v === q.a + q.b ? '他数了两次哦' : '不是' + CNQ(v) + '个';
      if (q.ask === 'before') return '前面不是' + CNQ(v) + '个';
      const other = q.from === 'front' ? q.n - q.pos : q.pos + 1;
      if (v === other) return q.from === 'front' ? '要从前面数哦' : '要从后面数哦';
      return '不是第' + CN[v] + '个';
    },
    rightLine(q) {
      if (q.ask === 'total') return W5U.all(q.n, '个');
      if (q.ask === 'before') return '前面有' + CNQ(q.pos) + '个';
      return q.from === 'front' ? NAME[q.who] + '是第' + CN[q.answer] + '个' : '从后数是第' + CN[q.answer];
    },
    async feedback(st, ans) { const c = W5U.cardOf(st, ans); if (c) K.wiggle(st, c); W5U.say(st, this.wrongLine(st.q, ans)); await st.scope.wait(T(550)); },
    /* flags with numbers over the people in the order they are counted (an animation) */
    flags(st, order) {
      const g = this.geo(st.q);
      const dt = order.length > 6 ? 120 : 160;
      order.forEach((i, j) => { const b = box(st.people[i]); if (g.L) badgeAt(st, b.x + b.w / 2, b.y - 20, j + 1, 40, dt * j); else badgeAt(st, g.x0 - 58, b.y + b.h * 0.45, j + 1, 40, dt * j); st.scope.timeout(() => { Sfx.count(j + 1); K.hop(st, st.people[i], 10); }, dt * j); });
      return T(dt * order.length + 150);
    },
    /* 1. his card blue + what it is; 2. (the hill moves away) the counting flags; 3. the right card gold + the answer */
    async explain(st, ans) {
      const q = st.q, my = st;
      W5U.blue(st, W5U.cardOf(st, ans));
      await fbDone(st); if (!Session.alive(my)) return;
      let order, line = null;
      if (q.hide) {
        await st.scope.anim(st.hill, [{ transform: 'none', opacity: 1 }, { transform: K.L() ? 'translateY(70%)' : 'translateX(-80%)', opacity: 0 }], { duration: 340, fill: 'forwards' }); if (!Session.alive(my)) return;
        order = st.people.map((_, i) => i).reverse(); line = q.d === 4 ? '再加他自己' : '他只算一次';
        W5U.ring(st, st.people[q.pos], GOLD, 4);
      } else if (q.ask === 'before') order = st.people.map((_, i) => i).filter(i => i < q.pos);
      else order = q.from === 'front' ? st.people.map((_, i) => i).filter(i => i <= q.pos) : st.people.map((_, i) => i).filter(i => i >= q.pos).reverse();
      const ms = this.flags(st, order);
      if (line) { W5U.note(st, line); await st.scope.wait(Math.max(950, ms)); }
      else await st.scope.wait(ms);
      if (!Session.alive(my)) return;
      W5U.gold(st, W5U.cardOf(st, q.answer));
      await W5U.sum(st, this.rightLine(q));
      await st.scope.wait(250);
    },
    rightEls(st) { return [W5U.cardOf(st, st.q.answer)]; },
    async reveal(st) {
      const q = st.q;
      W5U.gold(st, W5U.cardOf(st, q.answer)); Sfx.reveal();
      K.hop(st, st.people[q.pos], 18);
      this.cheerAll(st);
      st.summary = this.rightLine(q); W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    cheerAll(st) { if (st.explaining) return; [st.people[st.q.pos]].forEach(e => K.hop(st, e, 20)); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { team: st.q.team.slice(), pos: st.q.pos }; },
    lines() {
      const out = [this.intro, '从前面数，', '从后面数，', '从后数是第几？', '一共几个？', '要从前面数哦', '要从后面数哦', '别忘了他自己', '他数了两次哦', '再加他自己', '他只算一次'].concat(this.praise);
      TEAM.forEach(w => {
        const N = NAME[w]; out.push(N + '是第几个？', N + '前面有几个？');
        for (let k = 1; k <= 7; k++) out.push(N + '是第' + CN[k] + '个');
        for (let k = 1; k <= 8; k++) out.push(N + '从前数第' + CN[k] + '，');
        for (let k = 1; k <= 5; k++) out.push(N + '前面有' + CNQ(k) + '个，');
      });
      for (let k = 1; k <= 5; k++) out.push('后面有' + CNQ(k) + '个，');
      for (let k = 2; k <= 6; k++) out.push('从前数他第' + CN[k] + '，', '从后数他第' + CN[k] + '，');
      for (let k = 1; k <= 9; k++) out.push('不是第' + CN[k] + '个');
      for (let k = 1; k <= 8; k++) out.push('从后数是第' + CN[k]);
      for (let k = 0; k <= 9; k++) out.push('前面不是' + CNQ(k) + '个');
      for (let k = 1; k <= 6; k++) out.push('前面有' + CNQ(k) + '个');
      for (let k = 3; k <= 13; k++) out.push('不是' + CNQ(k) + '个');
      for (let k = 3; k <= 9; k++) out.push(W5U.all(k, '个'));
      return uniq(out);
    },
  };

  /* ================================================================ X8 量！ 换尺子量 (reasoning; S14 Who Is Taller?: measured with
     different units, the numbers differ). Five "height records", one for each of the team: a head and the blocks it was
     measured with - big blocks (each exactly two small ones high), small blocks, from L3 peaches too (three small ones). The
     team stand behind a screen: only the records can be compared. Tap a record.
       L1 two kinds of block, stacked up from the same floor: the height shows it, counting blocks misleads (the tallest is
       measured in big blocks, someone shorter has more small ones) · L2 lying in rows, the left ends not lined up: compare
       the lengths, not the right ends · L3 three units (big, small, peach); the task card shows their sizes side by side ·
       L4 only "number + unit" (3 big, 6 small ...) and "1 big = 2 small" on the task card: think · L5 "八戒是四块大积木，换成
       小的是几块？" - five number cards.
     Wrong: his record ringed blue, its blocks split into small ones and numbered ("这个是六块"); the right one the same, gold
     ("沙僧最高！"). */
  const X8WHO = ['tangseng', 'wukong', 'bajie', 'shaseng', 'dragon_horse'];
  const USZ = { small: 1, big: 2, peach: 3 };
  const UCOL = { small: '#FFC93C', big: '#4FB3FF' };
  W5R.X8 = {
    kind0: 'units5', verb: '量！', intro: '用积木量身高！', praise: ['想得真明白！'], props: ['peach'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      if (d === 5) { const who = rng.pick(X8WHO.slice(0, 4)), b = rng.int(2, 6); return { d, k: [d, who, b], recs: [{ who, unit: 'big', n: b }], ask: 'count', answer: 2 * b, opts: W5U.nums(G, 2 * b, 1, 14) }; }
      const ask = bagPick(G, 'x8a' + d, ['tall', 'short']), peach = d === 3;
      for (let t = 0; t < 400; t++) {
        const H = rng.shuffle(Array.from({ length: 9 }, (_, i) => i + 2)).slice(0, 5);
        const units = H.map(h => { const can = ['small'].concat(h % 2 === 0 ? ['big'] : [], peach && h % 3 === 0 ? ['peach'] : []).filter(u => h / USZ[u] <= (u === 'small' ? 10 : 5)); return rng.pick(can); });
        const ext = ask === 'tall' ? Math.max(...H) : Math.min(...H), at = H.indexOf(ext);
        /* the trap: the answer is not the one with the most (fewest) blocks */
        if (ask === 'tall') { const cand = ['big'].concat(peach && ext % 3 === 0 ? ['peach'] : []).filter(u => ext % USZ[u] === 0); if (!cand.length) continue; units[at] = rng.pick(cand); }
        else { units[at] = 'small'; }
        const n = H.map((h, i) => h / USZ[units[i]]);
        if (ask === 'tall' && !(Math.max(...n.filter((_, i) => i !== at)) > n[at])) continue;
        if (ask === 'short' && !(Math.min(...n.filter((_, i) => i !== at)) < n[at])) continue;
        if (peach && !units.includes('peach')) continue;
        if (d !== 3 && !units.includes('big')) continue;
        const who = rng.shuffle(X8WHO);
        const recs0 = H.map((h, i) => ({ who: who[i], unit: units[i], n: n[i], h, off: 0 }));
        if (d === 2) {
          /* lying in rows: the left ends moved; the right end that reaches farthest is not the answer's */
          recs0.forEach(r => { r.off = rng.int(0, 3); }); recs0[at].off = ask === 'tall' ? 0 : 3;
          const ends = recs0.map(r => r.off + r.h), far = ask === 'tall' ? Math.max(...ends.filter((_, i) => i !== at)) >= ends[at] : Math.min(...ends.filter((_, i) => i !== at)) <= ends[at];
          if (!far) continue;
        }
        const deck = W5U.deal(G, recs0[at], recs0.filter((_, i) => i !== at), 'x8');
        return { d, k: [d, ask, deck.map(r => r.who[0] + r.unit[0] + r.n + r.off).join('.')], recs: deck, ask, answer: deck.indexOf(recs0[at]) };
      }
      const recs = [{ who: 'bajie', unit: 'big', n: 4, h: 8, off: 0 }, { who: 'wukong', unit: 'small', n: 7, h: 7, off: 0 }, { who: 'shaseng', unit: 'small', n: 5, h: 5, off: 0 }, { who: 'tangseng', unit: 'big', n: 2, h: 4, off: 0 }, { who: 'dragon_horse', unit: 'small', n: 3, h: 3, off: 0 }];
      return { d, k: [d, 'x'], recs, ask: 'tall', answer: 0 };
    },
    audit(q) {
      if (q.ask === 'count') return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.opts.filter(v => v === q.answer).length }];
      const H = q.recs.map(r => r.n * USZ[r.unit]), want = q.ask === 'tall' ? Math.max(...H) : Math.min(...H);
      return [{ n: H.length, at: q.answer, right: H.filter(h => h === want).length }];
    },
    /* landscape / portrait: five upright records in a row (u: one small block); L2 five rows; L5 one record + cards */
    geo(q) {
      const L = K.L();
      if (q.ask === 'count') return L ? { mode: 'one', x: 362, y: 138, w: 300, h: 404, u: 26, cy: 612, cs: 116, gap: 18 } : { mode: 'one', x: 202, y: 232, w: 300, h: 500, u: 32, cy: 826, cs: 120, gap: 12 };
      if (q.d === 2) return L ? { mode: 'rows', x: 140, y: 112, w: 744, rh: 90, gap: 8, u: 40, bx: 110 } : { mode: 'rows', x: 22, y: 236, w: 660, rh: 104, gap: 12, u: 38, bx: 100 };
      return L ? { mode: 'cols', x: 100, y: 118, w: 152, h: 414, gap: 16, u: 32, head: 70 } : { mode: 'cols', x: 20, y: 230, w: 124, h: 560, gap: 11, u: 46, head: 64 };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const q = st.q, g = this.geo(q); if (!st.recEls) return;
      st.recEls.forEach((e, i) => {
        if (g.mode === 'one') place(e, g.x, g.y, g.w, g.h);
        else if (g.mode === 'rows') place(e, g.x, g.y + i * (g.rh + g.gap), g.w, g.rh);
        else place(e, g.x + i * (g.w + g.gap), g.y, g.w, g.h);
        this.drawRec(st, i);
      });
      if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.cy, g.cs, g.cs, g.gap);
    },
    cardSpot(st) { const g = this.geo(st.q); return { cx: Stage.W / 2, cy: g.cy || 612, size: g.cs || 116, gap: g.gap || 18 }; },
    /* one block (svg, in px of the record): small yellow, big blue (twice as high, a bit wider), peach 3 high */
    blockSvg(unit, x, y, w, h, vertical) {
      if (unit === 'peach') { const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 2; return '<path d="M' + R1(cx) + ' ' + R1(cy - r) + 'C' + R1(cx - r * 1.3) + ' ' + R1(cy - r) + ' ' + R1(cx - r * 1.1) + ' ' + R1(cy + r) + ' ' + R1(cx) + ' ' + R1(cy + r) + 'C' + R1(cx + r * 1.1) + ' ' + R1(cy + r) + ' ' + R1(cx + r * 1.3) + ' ' + R1(cy - r) + ' ' + R1(cx) + ' ' + R1(cy - r) + 'Z" fill="#FF9CB0" stroke="' + INK + '" stroke-width="3"/><path d="M' + R1(cx + 2) + ' ' + R1(cy - r) + 'q10 -12 18 -4q-8 8 -18 4z" fill="#5CC46E" stroke="' + INK + '" stroke-width="2"/>'; }
      return '<rect x="' + R1(x + 1.5) + '" y="' + R1(y + 1.5) + '" width="' + R1(w - 3) + '" height="' + R1(h - 3) + '" rx="4" fill="' + UCOL[unit] + '" stroke="' + INK + '" stroke-width="3"/>' + (unit === 'big' ? '<rect x="' + R1(x + 6) + '" y="' + R1(y + 6) + '" width="' + R1(vertical ? w * 0.18 : w - 12) + '" height="' + R1(vertical ? h - 12 : h * 0.2) + '" rx="2" fill="#fff" opacity=".35"/>' : '');
    },
    /* a record: the head and its blocks (or "n x unit" at L4); split: shown as small blocks, numbered up to `num` */
    drawRec(st, i) {
      const q = st.q, g = this.geo(q), r = q.recs[i], e = st.recEls[i], sv = e._sv, b = box(e), H = r.n * USZ[r.unit], split = e._split, num = e._num || 0;
      let s = '';
      if (g.mode === 'rows') {
        const x0 = g.bx + r.off * g.u, y0 = b.h / 2 - 22, hh = 44;
        s += '<path d="M' + (g.bx - 8) + ' 8V' + (b.h - 8) + '" stroke="' + INK + '" stroke-width="3" stroke-dasharray="5 5" opacity=".4"/>';
        if (split) for (let k = 0; k < H; k++) s += this.blockSvg('small', x0 + k * g.u, y0 + 4, g.u, hh - 8, false);
        else { let x = x0; for (let k = 0; k < r.n; k++) { const w = USZ[r.unit] * g.u; s += this.blockSvg(r.unit, x, r.unit === 'big' ? y0 : y0 + 4, w, r.unit === 'big' ? hh : hh - 8, false); x += w; } }
        for (let k = 0; k < Math.min(num, H); k++) s += '<circle cx="' + R1(x0 + (k + 0.5) * g.u) + '" cy="' + R1(y0 + hh / 2) + '" r="12" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/><text x="' + R1(x0 + (k + 0.5) * g.u) + '" y="' + R1(y0 + hh / 2 + 5.5) + '" text-anchor="middle" font-size="15" font-weight="900" fill="' + INK + '" font-family="system-ui,sans-serif">' + (k + 1) + '</text>';
      } else {
        const head = g.mode === 'one' ? 80 : g.head, floor = b.h - 12, cx = b.w / 2;
        s += '<path d="M8 ' + floor + 'H' + (b.w - 8) + '" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>';
        if (q.d === 4 && !split) {
          s += '<text x="' + R1(cx - 26) + '" y="' + R1(head + 86) + '" text-anchor="middle" font-size="54" font-weight="900" fill="#E8414B" stroke="' + INK + '" stroke-width="2" font-family="system-ui,sans-serif">' + r.n + '</text>';
          s += this.blockSvg(r.unit, cx + 4, head + 86 - USZ[r.unit] * 24, 34, USZ[r.unit] * 24, true);
        } else if (split) for (let k = 0; k < H; k++) s += this.blockSvg('small', cx - b.w * 0.24, floor - (k + 1) * g.u, b.w * 0.48, g.u, true);
        else { let y = floor; for (let k = 0; k < r.n; k++) { const hh = USZ[r.unit] * g.u, w = r.unit === 'small' ? b.w * 0.48 : b.w * 0.62; y -= hh; s += this.blockSvg(r.unit, cx - w / 2, y, w, hh, true); } }
        for (let k = 0; k < Math.min(num, H); k++) { const y = floor - (k + 0.5) * g.u; s += '<circle cx="' + R1(cx) + '" cy="' + R1(y) + '" r="' + Math.min(13, g.u * 0.42) + '" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/><text x="' + R1(cx) + '" y="' + R1(y + 5.5) + '" text-anchor="middle" font-size="15" font-weight="900" fill="' + INK + '" font-family="system-ui,sans-serif">' + (k + 1) + '</text>'; }
      }
      sv.setAttribute('viewBox', '0 0 ' + b.w + ' ' + b.h); sv.innerHTML = s;
    },
    /* the task card: the units side by side (L3), "1 big = 2 small" (L4, L5) */
    unitIc(q) {
      const k = 'stroke="#2B2118" stroke-width="3"';
      if (q.d === 3) return '<svg viewBox="0 0 120 70" width="104" height="60"><path d="M4 66H116" stroke="#2B2118" stroke-width="3"/><rect x="8" y="46" width="22" height="18" rx="3" fill="#FFC93C" ' + k + '/><rect x="40" y="28" width="26" height="36" rx="3" fill="#4FB3FF" ' + k + '/><path d="M93 10C74 10 76 64 93 64C110 64 112 10 93 10Z" fill="#FF9CB0" ' + k + '/></svg>';
      if (q.d >= 4) return '<svg viewBox="0 0 120 70" width="104" height="60"><rect x="6" y="10" width="28" height="54" rx="3" fill="#4FB3FF" ' + k + '/><path d="M44 30H60M44 40H60" stroke="#2B2118" stroke-width="5"/><rect x="72" y="10" width="24" height="27" rx="3" fill="#FFC93C" ' + k + '/><rect x="72" y="37" width="24" height="27" rx="3" fill="#FFC93C" ' + k + '/></svg>';
      return '<svg viewBox="0 0 100 70" width="86" height="60"><rect x="12" y="8" width="30" height="56" rx="3" fill="#4FB3FF" ' + k + '/><rect x="58" y="36" width="26" height="28" rx="3" fill="#FFC93C" ' + k + '/></svg>';
    },
    present(st) {
      const q = st.q, g = this.geo(q);
      st.recEls = q.recs.map((r, i) => {
        const e = W2X.thing(st, 10, 10, 6, 'card'); e.style.overflow = 'visible';
        const sv = svg('svg', { width: '100%', height: '100%' }, e); Object.assign(sv.style, { position: 'absolute', left: '0', top: '0', overflow: 'visible', pointerEvents: 'none' }); e._sv = sv;
        const hd = img('assets/thumbs/' + r.who + '.png', '', e);
        Object.assign(hd.style, g.mode === 'rows' ? { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: (g.rh - 18) + 'px', height: (g.rh - 18) + 'px', borderRadius: '50%', pointerEvents: 'none' } : { position: 'absolute', left: '50%', top: '8px', transform: 'translateX(-50%)', width: (g.mode === 'one' ? 76 : g.head - 8) + 'px', height: (g.mode === 'one' ? 76 : g.head - 8) + 'px', borderRadius: '50%', pointerEvents: 'none' });
        if (q.ask !== 'count') K.reg(st, 'rec' + i, e, {}); else e.style.pointerEvents = 'none';
        return e;
      });
      if (q.ask === 'count') { st.cards = numRow(st, q.opts, g.cs, 'card'); st.opts = q.opts.slice(); }
      this.place(st);
      st.recEls.forEach((e, i) => K.pop(st, e, 70 * i));
      const ui = el('span', ''); ui.innerHTML = this.unitIc(q);
      K.task(st, [[{ node: ui }], ['q']]);
      if (q.ask === 'count') { const r = q.recs[0]; W3X.say2(st, NAME[r.who] + '是' + CNQ(r.n) + '块大积木，', '换成小的是几块？'); }
      else K.say(st, q.ask === 'tall' ? '谁最高？' : '谁最矮？');
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      if (st.q.ask === 'count') return W5U.tapCard(st, name, p);
      const m = /^rec(\d)$/.exec(p.id || ''); if (!m) return false;
      st.picked = true; K.pop(st, st.recEls[+m[1]]); Session.submit(st, +m[1]); return 'ok';
    },
    next(st, strat) {
      const q = st.q; if (st.picked) return null;
      if (q.ask === 'count') return W5U.cardNext(st, strat);
      if (!st.recEls) return null;
      return { g: 'tap', p: { id: 'rec' + (strat === 'wrong' ? (q.answer + 1 + (st.gen % 4)) % 5 : q.answer) } };
    },
    hOf(q, i) { const r = q.recs[i]; return r.n * USZ[r.unit]; },
    async feedback(st, ans) {
      const q = st.q;
      if (q.ask === 'count') { const c = W5U.cardOf(st, ans); if (c) K.wiggle(st, c); W5U.say(st, '不是' + CNQ(ans) + '块'); }
      else { K.wiggle(st, st.recEls[ans]); W5U.say(st, '积木大小不一样'); }
      await st.scope.wait(T(550));
    },
    /* record i: every block becomes small ones, then they are numbered one by one (an animation) */
    split(st, i) {
      const e = st.recEls[i], H = this.hOf(st.q, i);
      e._split = true; e._num = 0; this.drawRec(st, i); Sfx.whoosh(0.15);
      const dt = H > 8 ? 110 : 140;
      for (let k = 1; k <= H; k++) st.scope.timeout(() => { if (!Session.alive(st)) return; e._num = k; this.drawRec(st, i); Sfx.count(Math.min(20, k)); }, 200 + dt * k);
      return T(200 + dt * H + 150);
    },
    /* 1. his record: small blocks, numbered, blue ("这个是六块"); 2. the right one the same, gold ("沙僧最高！") */
    async explain(st, ans) {
      const q = st.q, my = st;
      if (q.ask === 'count') {
        W5U.blue(st, W5U.cardOf(st, ans));
        await fbDone(st); if (!Session.alive(my)) return;
        const ms = this.split(st, 0);
        W5U.note(st, '换成小积木');
        await st.scope.wait(Math.max(1000, ms)); if (!Session.alive(my)) return;
        W5U.gold(st, W5U.cardOf(st, q.answer));
        await W5U.sum(st, '是' + CNQ(q.answer) + '块小的');
        await st.scope.wait(250);
        return;
      }
      W5U.blue(st, st.recEls[ans]);
      const m1 = this.split(st, ans);
      W5U.note(st, '这个是' + CNQ(this.hOf(q, ans)) + '块');
      await st.scope.wait(Math.max(1000, m1)); if (!Session.alive(my)) return;
      const m2 = this.split(st, q.answer);
      W5U.gold(st, st.recEls[q.answer]);
      W5U.sum(st, NAME[q.recs[q.answer].who] + (q.ask === 'tall' ? '最高！' : '最矮！'));
      await st.scope.wait(Math.max(1000, m2));
    },
    rightEls(st) { return [st.q.ask === 'count' ? W5U.cardOf(st, st.q.answer) : st.recEls[st.q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st;
      W5U.gold(st, this.rightEls(st)); Sfx.reveal();
      const i = q.ask === 'count' ? 0 : q.answer, ms = this.split(st, i);
      this.cheerAll(st);
      st.summary = q.ask === 'count' ? '是' + CNQ(q.answer) + '块小的' : NAME[q.recs[i].who] + (q.ask === 'tall' ? '最高！' : '最矮！');
      W5U.sum(st, st.summary);
      await st.scope.wait(Math.max(T(900), ms));
      if (!Session.alive(my)) return;
    },
    workEls(st) { return st.q.ask === 'count' ? st.cards || [] : st.recEls || []; },
    snap(st) { return { recs: st.q.recs.map(r => r.unit + r.n) }; },
    lines() {
      const out = [this.intro, '谁最高？', '谁最矮？', '换成小的是几块？', '积木大小不一样', '换成小积木'].concat(this.praise);
      X8WHO.forEach(w => out.push(NAME[w] + '最高！', NAME[w] + '最矮！'));
      X8WHO.slice(0, 4).forEach(w => { for (let b = 2; b <= 6; b++) out.push(NAME[w] + '是' + CNQ(b) + '块大积木，'); });
      for (let v = 2; v <= 10; v++) out.push('这个是' + CNQ(v) + '块');
      for (let v = 1; v <= 16; v++) out.push('不是' + CNQ(v) + '块');
      for (let v = 4; v <= 12; v += 2) out.push('是' + CNQ(v) + '块小的');
      return uniq(out);
    },
  };
})();
/* ================================================================ ⑧ 奥特曼·积木光之国 (ultra5, from level 2): U5 光线拐弯 · U6 变大变小 ·
   U7 光棒搭房子 · U8 楼后面几只小怪兽 (reasoning). docs/W5-DESIGN.md §16.4. One function, no top-level names: each rule is
   W5R.<id>, registered (background, friends, icon, review card) in games.js. The little monsters are friends who play - the
   light lights lamps, makes things bigger and builds houses; nobody fights. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C', BLUE = '#4FB3FF';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const R1 = v => Math.round(v * 10) / 10;
  const ic = s => W3X.ic(s, 52);
  /* step 1 of an explanation: the feedback line (said just before) ends while his choice is ringed blue - it is not said
     twice; step by step, the engine says it again at the first stop (Step.boundary: st.fbLine). (W5R1 2) */
  const fbDone = st => st.scope.guard(Voice.afterSay(80)).then(() => st.scope.wait(T(180)));
  const thumb = (id, px) => { const s = el('span', ''); Object.assign(s.style, { display: 'block', width: px + 'px', height: px + 'px', borderRadius: '50%', overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 3px ' + INK, pointerEvents: 'none', flex: '0 0 auto' }); const i = img('assets/thumbs/' + id + '.png', '', s); Object.assign(i.style, { width: '100%', height: '100%', objectFit: 'cover' }); return s; };
  /* a number badge at a stage point (counting in the explain step) */
  const badgeAt = (st, x, y, n, size, delay) => { size = size || 40; const b = UI.badge(n, size); Stage.el.appendChild(b); b.style.position = 'absolute'; b.style.pointerEvents = 'none'; place(b, Math.round(x - size / 2), Math.round(y - size / 2)); st.els.push(b); st.scope.anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 240, delay: delay || 0, easing: EASE.pop, fill: 'both' }); return b; };
  /* a row of number cards (ids card0 ...) */
  const numRow = (st, vals, size) => vals.map((v, i) => { const c = UI.card(v, size, { layout: 'frame' }); Stage.el.appendChild(c); c.style.position = 'absolute'; K.reg(st, 'card' + i, c, {}); st.els.push(c); K.pop(st, c, 60 * i); return c; });
  /* a full-stage svg layer (stage coordinates) */
  const layer = (st, z) => { const e = W2X.thing(st, Stage.W, Stage.H, z, ''); e.style.pointerEvents = 'none'; const s = svg('svg', { viewBox: '0 0 ' + Stage.W + ' ' + Stage.H, width: '100%', height: '100%' }, e); s.style.overflow = 'visible'; e._s = s; return e; };
  const relayer = e => { if (!e) return; place(e, 0, 0, Stage.W, Stage.H); e._s.setAttribute('viewBox', '0 0 ' + Stage.W + ' ' + Stage.H); };

  /* ================================================================ U5 照！ 光线拐弯 (S1 Chase It, S3 Step by Step, F5 City
     Adventure). A crystal floor of 5 x 5 cells (>= 96); the light comes in from the left (奥特曼's crystal) along one row;
     crystal mirrors (/ or \) turn it 90°; from L3 a crystal wall stops it. Star lamps on the top and the right edge.
       L1 one mirror on its way · L2 two · L3 three and a wall (the light still ends at a lamp) - "光会照到哪里？" (five lamps)
       L4 "转哪面镜子，光能照到小恐龙？" - 5-6 mirrors, turning exactly one of them sends the light to the lamp with 小恐龙
       L5 "镜子放哪一格，光能照到小恐龙？" - the mirror is given, five dashed cells, exactly one works.
     A mirror: / turns right->up, up->right, left->down, down->left; \ turns right->down, down->right, left->up, up->left.
     Wrong: his lamp (mirror, cell) blue ("光走不到这里" / "转这面不行哦" / "放这里不行哦"; turning or placing shows where the
     light would go then); the real light walks, a flash at its first mirror ("碰到镜子拐弯"); the lamp lights, gold
     ("光照到这里"). */
  const N5 = 5;
  const turn = (m, d) => (m === '/' ? [-d[1], -d[0]] : [d[1], d[0]]);
  /* the light from the left of row r0: the cells it crosses, the mirrors it meets, where it leaves (top i / right i / ...) */
  const trace = (mir, wall, r0) => {
    let r = r0, c = -1, d = [1, 0]; const cells = [], hits = [];
    for (let k = 0; k < 60; k++) {
      c += d[0]; r += d[1];
      if (c < 0 || r < 0 || c >= N5 || r >= N5) return { cells, hits, exit: c >= N5 ? 'R' + r : r < 0 ? 'T' + c : r >= N5 ? 'B' + c : 'L' + r };
      const key = r + ',' + c; cells.push([r, c]);
      if (wall[key]) return { cells, hits, exit: null, wall: key };
      if (mir[key]) { hits.push(key); d = turn(mir[key], d); }
    }
    return { cells, hits, exit: null };
  };
  const SLOTS = ['T0', 'T1', 'T2', 'T3', 'T4', 'R0', 'R1', 'R2', 'R3', 'R4'];
  const ok5 = e => !!e && (e[0] === 'T' || e[0] === 'R');
  W5R.U5 = {
    kind0: 'beam5', verb: '照！', intro: '光线会拐弯！', praise: ['光线算得准！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, ask = d <= 3 ? 'where' : d === 4 ? 'flip' : 'place';
      const randCell = () => [rng.int(0, N5 - 1), rng.int(0, N5 - 1)];
      for (let t = 0; t < 3000; t++) {
        const r0 = rng.int(0, N5 - 1), mir = {}, wall = {};
        if (ask === 'where') {
          const want = d, extra = d === 1 ? rng.int(1, 2) : rng.int(1, 2);
          for (let k = 0; k < want + extra + 2; k++) { const [r, c] = randCell(); mir[r + ',' + c] = rng.pick(['/', '\\']); }
          if (d === 3) { const [r, c] = randCell(); if (!mir[r + ',' + c]) wall[r + ',' + c] = 1; }
          const tr = trace(mir, wall, r0);
          if (!ok5(tr.exit) || tr.hits.length !== want) continue;
          if (d === 3 && !Object.keys(wall).length) continue;
          if (Object.keys(mir).length < want + 1) continue;
          /* five lamps: the right one and four that look possible (next to it, straight on, others) */
          const near = SLOTS.filter(s => s !== tr.exit), score = s => (s[0] === tr.exit[0] && Math.abs(+s[1] - +tr.exit[1]) === 1 ? 0 : s === 'R' + r0 ? 0 : 1) + rng() * 0.9;
          const others = near.sort((a, b) => score(a) - score(b)).slice(0, 4);
          const lamps = W5U.deal(G, tr.exit, others, 'u5l');
          return { d, ask, k: [d, r0, JSON.stringify(mir), JSON.stringify(wall)], r0, mir, wall, lamps, answer: lamps.indexOf(tr.exit), exit: tr.exit };
        }
        /* flip / place: a target lamp the light reaches only by the one right change */
        const nm = ask === 'flip' ? rng.int(5, 6) : rng.int(2, 4);
        for (let k = 0; k < nm; k++) { const [r, c] = randCell(); mir[r + ',' + c] = rng.pick(['/', '\\']); }
        if (Object.keys(mir).length < nm) continue;
        if (rng.chance(0.4)) { const [r, c] = randCell(); if (!mir[r + ',' + c]) wall[r + ',' + c] = 1; }
        const now0 = trace(mir, wall, r0);
        if (ask === 'flip') {
          const keys = Object.keys(mir), ex = keys.map(key => { const m2 = Object.assign({}, mir, { [key]: mir[key] === '/' ? '\\' : '/' }); return trace(m2, wall, r0).exit; });
          const goodIdx = keys.map((_, i) => i).filter(i => ok5(ex[i]) && ex[i] !== now0.exit && ex.filter(x => x === ex[i]).length === 1);
          if (!goodIdx.length) continue;
          const gi = rng.pick(goodIdx), target = ex[gi];
          if (keys.filter(key => mir[key]).length < 5) continue;
          const order = W5U.deal(G, keys[gi], keys.filter((_, i) => i !== gi), 'u5f' + keys.length);
          return { d, ask, k: [d, r0, JSON.stringify(mir), JSON.stringify(wall)], r0, mir, wall, target, opts: order, answer: order.indexOf(keys[gi]), now: now0.exit };
        }
        /* place: the given mirror; five empty cells, one of them sends the light to the lamp */
        const m = rng.pick(['/', '\\']), empty = [];
        for (let r = 0; r < N5; r++) for (let c = 0; c < N5; c++) { const key = r + ',' + c; if (!mir[key] && !wall[key]) empty.push(key); }
        const res = empty.map(key => trace(Object.assign({}, mir, { [key]: m }), wall, r0).exit);
        const good = empty.filter((key, i) => ok5(res[i]) && res[i] !== now0.exit);
        if (!good.length) continue;
        const pick = rng.pick(good), target = res[empty.indexOf(pick)];
        /* the other four: cells the light crosses now (they change its way) that do not lead there; then any */
        const onPath = new Set(now0.cells.map(x => x.join(',')));
        const bad = rng.shuffle(empty.filter((key, i) => key !== pick && res[i] !== target)).sort((a, b) => (onPath.has(b) ? 1 : 0) - (onPath.has(a) ? 1 : 0)).slice(0, 4);
        if (bad.length < 4) continue;
        const order = W5U.deal(G, pick, bad, 'u5p');
        return { d, ask, k: [d, r0, JSON.stringify(mir), m, pick], r0, mir, wall, target, m, opts: order, answer: order.indexOf(pick), now: now0.exit };
      }
      const mir = { '2,2': '/' }; return { d, ask: 'where', k: [d, 'x'], r0: 2, mir, wall: {}, lamps: ['T2', 'T1', 'T3', 'R2', 'T0'], answer: 0, exit: 'T2' };
    },
    audit(q) {
      if (q.ask === 'where') return [{ n: q.lamps.length, at: q.answer, right: q.lamps.filter(s => s === trace(q.mir, q.wall, q.r0).exit).length }];
      if (q.ask === 'flip') return [{ n: q.opts.length, at: q.answer, right: q.opts.filter(key => trace(Object.assign({}, q.mir, { [key]: q.mir[key] === '/' ? '\\' : '/' }), q.wall, q.r0).exit === q.target).length }];
      return [{ n: q.opts.length, at: q.answer, right: q.opts.filter(key => trace(Object.assign({}, q.mir, { [key]: q.m }), q.wall, q.r0).exit === q.target).length }];
    },
    geo() { const L = K.L(); return L ? { cs: 96, x0: 262, y0: 196 } : { cs: 100, x0: 92, y0: 312 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    cellXY(r, c) { const g = this.geo(); return [g.x0 + (c + 0.5) * g.cs, g.y0 + (r + 0.5) * g.cs]; },
    slotXY(s) { const g = this.geo(), i = +s[1]; return s[0] === 'T' ? [g.x0 + (i + 0.5) * g.cs, g.y0 - 52] : s[0] === 'R' ? [g.x0 + N5 * g.cs + 54, g.y0 + (i + 0.5) * g.cs] : s[0] === 'B' ? [g.x0 + (i + 0.5) * g.cs, g.y0 + N5 * g.cs + 40] : [g.x0 - 40, g.y0 + (i + 0.5) * g.cs]; },
    place(st) {
      const q = st.q, g = this.geo(); if (!st.floor) return;
      relayer(st.floor); relayer(st.beamL);
      this.drawFloor(st);
      (st.lampEls || []).forEach((e, i) => { const [x, y] = this.slotXY(q.lamps[i]); place(e, Math.round(x - 46), Math.round(y - 46), 92, 92); });
      if (st.dino) { const [x, y] = this.slotXY(q.target); place(st.dino, Math.round(x - 46), Math.round(y - 46), 92, 92); }
      (st.cellEls || []).forEach((e, i) => { const [r, c] = q.opts[i].split(',').map(Number); place(e, g.x0 + c * g.cs, g.y0 + r * g.cs, g.cs, g.cs); });
      if (st.src) { const [x, y] = this.cellXY(q.r0, -1); place(st.src, Math.round(x - 28), Math.round(y - 30), 60, 60); }
      if (st.beamMir) this.drawBeam(st, this.beamPts(st, st.beamMir).P, st.beamCol);
    },
    /* the floor, the mirrors (st.mirNow), the walls */
    drawFloor(st) {
      const q = st.q, g = this.geo(), s = st.floor._s, cs = g.cs; while (s.firstChild) s.removeChild(s.firstChild);
      svg('rect', { x: g.x0 - 8, y: g.y0 - 8, width: N5 * cs + 16, height: N5 * cs + 16, rx: 16, fill: 'rgba(223,240,255,.78)', stroke: '#7BA7D8', 'stroke-width': 4 }, s);
      for (let r = 0; r < N5; r++) for (let c = 0; c < N5; c++) svg('rect', { x: g.x0 + c * cs + 3, y: g.y0 + r * cs + 3, width: cs - 6, height: cs - 6, rx: 10, fill: (r + c) % 2 ? 'rgba(255,255,255,.55)' : 'rgba(205,228,250,.65)' }, s);
      Object.keys(q.wall).forEach(key => { const [r, c] = key.split(',').map(Number), x = g.x0 + c * cs, y = g.y0 + r * cs; svg('rect', { x: x + 8, y: y + 8, width: cs - 16, height: cs - 16, rx: 8, fill: '#8E7CC3', stroke: INK, 'stroke-width': 4 }, s); svg('path', { d: 'M' + (x + 18) + ' ' + (y + 30) + 'L' + (x + 40) + ' ' + (y + 18) + 'M' + (x + 22) + ' ' + (y + 52) + 'L' + (x + 60) + ' ' + (y + 30), stroke: '#fff', 'stroke-width': 4, opacity: 0.6, 'stroke-linecap': 'round' }, s); });
      st.mirG = {};
      Object.keys(st.mirNow).forEach(key => { st.mirG[key] = this.mirrorSvg(s, key, st.mirNow[key]); });
      if (st.ghost) st.mirG[st.ghost.key] = this.mirrorSvg(s, st.ghost.key, st.ghost.m, st.ghost.col);
      /* the candidate cells of L5: dashed */
      if (q.ask === 'place') q.opts.forEach(key => { const [r, c] = key.split(',').map(Number); svg('rect', { x: g.x0 + c * cs + 9, y: g.y0 + r * cs + 9, width: cs - 18, height: cs - 18, rx: 10, fill: 'rgba(255,255,255,.5)', stroke: '#2E6FD8', 'stroke-width': 4, 'stroke-dasharray': '10 7' }, s); });
    },
    mirrorSvg(s, key, m, col) {
      const g = this.geo(), cs = g.cs, [r, c] = key.split(',').map(Number), x = g.x0 + c * cs, y = g.y0 + r * cs, a = 14, b = cs - 14;
      const gg = svg('g', {}, s), d = m === '/' ? 'M' + (x + a) + ' ' + (y + b) + 'L' + (x + b) + ' ' + (y + a) : 'M' + (x + a) + ' ' + (y + a) + 'L' + (x + b) + ' ' + (y + b);
      svg('path', { d, stroke: INK, 'stroke-width': 16, 'stroke-linecap': 'round' }, gg);
      svg('path', { d, stroke: col || '#9EE7FF', 'stroke-width': 10, 'stroke-linecap': 'round' }, gg);
      svg('path', { d, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.85 }, gg);
      gg.style.transformBox = 'fill-box'; gg.style.transformOrigin = 'center';
      return gg;
    },
    /* the light's way: from the crystal on the left through the cells' middles to its lamp (or the wall) */
    beamPts(st, mir) {
      const q = st.q, tr = trace(mir, q.wall, q.r0), P = [this.cellXY(q.r0, -1)];
      tr.cells.forEach(([r, c]) => { if (mir[r + ',' + c] || q.wall[r + ',' + c]) P.push(this.cellXY(r, c)); });
      const last = tr.cells[tr.cells.length - 1];
      if (tr.exit) P.push(this.slotXY(tr.exit)); else if (last) P.push(this.cellXY(last[0], last[1]));
      return { P, tr };
    },
    drawBeam(st, P, col, k) {
      const s = st.beamL._s; while (s.firstChild) s.removeChild(s.firstChild);
      if (!P) { st.beamMir = null; return; }
      const d = 'M' + P.map(p => R1(p[0]) + ' ' + R1(p[1])).join('L');
      svg('path', { d, stroke: col === BLUE ? 'rgba(79,179,255,.35)' : 'rgba(255,236,140,.45)', 'stroke-width': 22, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      const p = svg('path', { d, stroke: col || '#FFE45C', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': col === BLUE ? '16 10' : 'none' }, s);
      st.beamCol = col;
      return p;
    },
    /* the light walks its way (0.9 s); at its first mirror a flash */
    async shine(st, mir, col) {
      const my = st, { P, tr } = this.beamPts(st, mir);
      const s = st.beamL._s; while (s.firstChild) s.removeChild(s.firstChild);
      const d = 'M' + P.map(p => R1(p[0]) + ' ' + R1(p[1])).join('L'), L = P.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0), 0);
      svg('path', { d, stroke: col === BLUE ? 'rgba(79,179,255,.3)' : 'rgba(255,236,140,.45)', 'stroke-width': 22, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      const p = svg('path', { d, stroke: col || '#FFE45C', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': L + ' ' + L }, s);
      st.beamMir = mir; st.beamCol = col;
      Sfx.zap && Sfx.zap();
      if (tr.hits.length) { const [r, c] = tr.hits[0].split(',').map(Number), [x, y] = this.cellXY(r, c), seg = P.slice(0, 2), k = Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]) / Math.max(1, L); st.scope.timeout(() => { if (Session.alive(my)) Fx.burst(x, y, { n: 10, dist: 46, colors: ['#FFE45C', '#FFFFFF', '#9EE7FF'] }); }, 800 * k); }
      await st.scope.anim(p, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 800, easing: 'linear', fill: 'forwards' });
      return tr;
    },
    lampSvg(on) { return '<svg viewBox="0 0 92 92" width="100%" height="100%" style="pointer-events:none;overflow:visible">' + (on ? '<circle cx="46" cy="46" r="44" fill="rgba(255,228,92,.55)"/>' : '') + '<circle cx="46" cy="46" r="36" fill="' + (on ? '#FFF6B8' : '#E9EEF6') + '" stroke="' + INK + '" stroke-width="4"/><polygon points="' + W2X.pts(W2X.star(46, 47, 25)) + '" fill="' + (on ? '#FFC93C' : '#B8C2D0') + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></svg>'; },
    light(st, e) { if (!e) return; e.innerHTML = this.lampSvg(true) + (e._dino ? '' : ''); if (e._dino) e.appendChild(e._dino); K.pop(st, e); Sfx.sparkle && Sfx.sparkle(); },
    present(st) {
      const q = st.q, g = this.geo();
      st.mirNow = Object.assign({}, q.mir);
      st.floor = layer(st, 3); st.beamL = layer(st, 6);
      st.src = W2X.thing(st, 60, 60, 7, ''); st.src.style.pointerEvents = 'none';
      st.src.innerHTML = '<svg viewBox="0 0 60 60" width="100%" height="100%" style="overflow:visible"><polygon points="30,2 54,18 54,42 30,58 6,42 6,18" fill="#BFE9FF" stroke="' + INK + '" stroke-width="4"/><polygon points="30,14 42,22 42,38 30,46 18,38 18,22" fill="#FFF6B8"/></svg>';
      const t = thumb('ultraman', 34); Object.assign(t.style, { position: 'absolute', left: '-14px', top: '-22px' }); st.src.appendChild(t);
      if (q.ask === 'where') st.lampEls = q.lamps.map((s, i) => { const e = W2X.thing(st, 92, 92, 7, ''); e.innerHTML = this.lampSvg(false); e.style.borderRadius = '50%'; K.reg(st, 'lamp' + i, e, {}); return e; });
      else {
        st.dino = W2X.thing(st, 92, 92, 7, ''); st.dino.style.pointerEvents = 'none'; st.dino.innerHTML = this.lampSvg(false);
        const dn = thumb('kaiju2', 46); Object.assign(dn.style, { position: 'absolute', right: '-18px', bottom: '-14px' }); st.dino._dino = dn; st.dino.appendChild(dn);
        st.cellEls = q.opts.map((key, i) => { const e = W2X.thing(st, 10, 10, 7, ''); e.style.borderRadius = '12px'; K.reg(st, 'm' + i, e, {}); return e; });
      }
      this.place(st);
      K.pop(st, st.floor); (st.lampEls || st.cellEls).forEach((e, i) => K.pop(st, e, 80 + 40 * i));
      const mirIc = '<rect x="6" y="6" width="88" height="88" rx="10" fill="#DFF0FF" stroke="#2B2118" stroke-width="4"/><path d="M18 82L82 18" stroke="#2B2118" stroke-width="14" stroke-linecap="round"/><path d="M18 82L82 18" stroke="#9EE7FF" stroke-width="8" stroke-linecap="round"/><path d="M4 50H44V8" fill="none" stroke="#FFC93C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
      /* the first time (the demo): the rule first */
      if (st.demo) Voice.say('光碰到镜子会拐弯！', { tag: 'prompt' });
      if (q.ask === 'where') { K.task(st, [[ic(mirIc)], ['q']]); K.say(st, '光会照到哪里？'); }
      else if (q.ask === 'flip') { K.task(st, [[ic(mirIc)], [{ node: thumb('kaiju2', 50) }]]); W3X.say2(st, '转哪面镜子，', '光能照到小恐龙？'); }
      else { const one = q.m === '/' ? 'M18 82L82 18' : 'M18 18L82 82'; K.task(st, [[ic('<rect x="6" y="6" width="88" height="88" rx="10" fill="#fff" stroke="#2E6FD8" stroke-width="5" stroke-dasharray="12 8"/><path d="' + one + '" stroke="#2B2118" stroke-width="14" stroke-linecap="round"/><path d="' + one + '" stroke="#9EE7FF" stroke-width="8" stroke-linecap="round"/>')], [{ node: thumb('kaiju2', 50) }]]); W3X.say2(st, '镜子放哪一格，', '光能照到小恐龙？'); }
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const id = p.id || '', a = /^lamp(\d)$/.exec(id), b = /^m(\d)$/.exec(id);
      if (st.q.ask === 'where' && a) { st.picked = true; K.pop(st, st.lampEls[+a[1]]); Session.submit(st, +a[1]); return 'ok'; }
      if (st.q.ask !== 'where' && b) { st.picked = true; K.pop(st, st.cellEls[+b[1]]); Session.submit(st, +b[1]); return 'ok'; }
      return false;
    },
    next(st, strat) {
      const q = st.q; if (st.picked) return null;
      const n = q.ask === 'where' ? q.lamps.length : q.opts.length, i = strat === 'wrong' ? (q.answer + 1 + (st.gen % (n - 1))) % n : q.answer;
      if (q.ask === 'where') return st.lampEls ? { g: 'tap', p: { id: 'lamp' + i } } : null;
      return st.cellEls ? { g: 'tap', p: { id: 'm' + i } } : null;
    },
    wrongLine(q) { return q.ask === 'where' ? '光走不到这里' : q.ask === 'flip' ? '转这面不行哦' : '放这里不行哦'; },
    async feedback(st, ans) { const e = st.q.ask === 'where' ? st.lampEls[ans] : st.cellEls[ans]; if (e) K.wiggle(st, e); W5U.say(st, this.wrongLine(st.q)); await st.scope.wait(T(550)); },
    /* the mirrors after his change (or the right one) */
    changed(st, i) { const q = st.q, key = q.opts[i]; if (q.ask === 'flip') return Object.assign({}, q.mir, { [key]: q.mir[key] === '/' ? '\\' : '/' }); return Object.assign({}, q.mir, { [key]: q.m }); },
    /* turn a mirror over (an animation) or put the given one in a cell */
    async change(st, i, col) {
      const q = st.q, key = q.opts[i];
      if (q.ask === 'flip') { const gg = st.mirG[key]; if (gg) await st.scope.anim(gg, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }], { duration: 320, easing: EASE.glide }); st.mirNow = this.changed(st, i); st.ghost = null; }
      else { st.mirNow = Object.assign({}, q.mir); st.ghost = { key, m: q.m, col }; }
      this.drawFloor(st);
      if (q.ask === 'place') { const gg = st.mirG[key]; if (gg) st.scope.anim(gg, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260 }); }
    },
    /* 1. his lamp (mirror, cell) blue - turned / placed: where the light would go then; 2. the real light walks, a flash at
       its first mirror ("碰到镜子拐弯"); 3. the lamp lights, gold ("光照到这里") */
    async explain(st, ans) {
      const q = st.q, my = st;
      if (q.ask === 'where') {
        W5U.blue(st, st.lampEls[ans]);
        await fbDone(st); if (!Session.alive(my)) return;
        W5U.note(st, '碰到镜子拐弯');
        await this.shine(st, q.mir, null); if (!Session.alive(my)) return;
        await st.scope.wait(350); if (!Session.alive(my)) return;
        const e = st.lampEls[q.answer]; this.light(st, e);
        W5U.gold(st, e);
        await W5U.sum(st, '光照到这里');
        return;
      }
      W5U.blue(st, st.cellEls[ans]);
      await fbDone(st); if (!Session.alive(my)) return;
      await this.change(st, ans, '#9AD3FF'); if (!Session.alive(my)) return;
      await this.shine(st, this.changed(st, ans), BLUE); if (!Session.alive(my)) return;
      await st.scope.wait(400); if (!Session.alive(my)) return;
      st.mirNow = Object.assign({}, q.mir); st.ghost = null; this.drawFloor(st); this.drawBeam(st, null);
      await this.change(st, q.answer, null); if (!Session.alive(my)) return;
      W5U.note(st, '碰到镜子拐弯');
      await this.shine(st, this.changed(st, q.answer), null); if (!Session.alive(my)) return;
      await st.scope.wait(300); if (!Session.alive(my)) return;
      this.light(st, st.dino); W5U.gold(st, [st.cellEls[q.answer], st.dino]);
      await W5U.sum(st, '光照到这里');
    },
    rightEls(st) { const q = st.q; return [q.ask === 'where' ? st.lampEls[q.answer] : st.cellEls[q.answer]]; },
    async reveal(st) {
      const q = st.q, my = st;
      if (q.ask !== 'where') { await this.change(st, q.answer, null); if (!Session.alive(my)) return; }
      await this.shine(st, q.ask === 'where' ? q.mir : this.changed(st, q.answer), null); if (!Session.alive(my)) return;
      const e = q.ask === 'where' ? st.lampEls[q.answer] : st.dino; this.light(st, e);
      W5U.gold(st, this.rightEls(st)); Sfx.reveal();
      this.cheerAll(st);
      st.summary = '光照到这里'; W5U.sum(st, st.summary);
      await st.scope.wait(T(800));
    },
    workEls(st) { return st.lampEls || st.cellEls || []; },
    snap(st) { return { ask: st.q.ask }; },
    lines() { return uniq([this.intro, '光碰到镜子会拐弯！', '光会照到哪里？', '转哪面镜子，', '镜子放哪一格，', '光能照到小恐龙？', '光走不到这里', '转这面不行哦', '放这里不行哦', '碰到镜子拐弯', '光照到这里'].concat(this.praise)); },
  };

  /* ================================================================ U6 看！ 变大变小 (F9 Fruit Party, S14 Who Is Taller?, S7 Shape
     Beauty Contest). On the left a little block shape on squares; 赛罗's light turns it into "？". Five cards with bigger
     shapes on the same squares: "变大以后是哪个？" (every square becomes 2 x 2).
       L1 2-3 squares (a line, a little L) twice as big; wrong: only wider, only taller, one square missing, not bigger ·
       L2 3-4 squares (L, S ... shapes that are not their own mirror image) + turned over then bigger · L3 4-5 squares in two
       colours: the colours stay where they were (wrong: colours swapped) · L4 the other way: a big shape, "变小以后是哪个？"
       (half as long, half as wide) · L5 the right one is bigger AND turned 90° ("转过来也一样"); wrong: turned over, only
       wider, not bigger, another shape.
     Wrong: his card blue ("只变宽了哦" ...); the right shape laid over his card, what differs ringed blue ("这里不一样"); the
     little shape grows on the left, every square into four ("一格变四格"); the right card gold ("长宽都变大"). */
  const P6 = W5U.poly;
  const U6SH = {
    2: [[[0, 0], [1, 0]]],
    3: [[[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 1]]],
    4: [[[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]]],
    5: [[[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]], [[1, 0], [0, 1], [1, 1], [2, 1], [2, 2]]],
  };
  const UCOL6 = ['#FF6B5B', '#4FB3FF'];
  /* a coloured shape: [[c, r, colour], ...] */
  const nrm6 = s => { const x0 = Math.min(...s.map(a => a[0])), y0 = Math.min(...s.map(a => a[1])); return s.map(a => [a[0] - x0, a[1] - y0, a[2] || 0]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  const key6 = s => nrm6(s).map(a => a.join(':')).join(',');
  const scl = (s, sx, sy) => nrm6([].concat(...s.map(([c, r, k]) => { const o = []; for (let i = 0; i < sx; i++) for (let j = 0; j < sy; j++) o.push([c * sx + i, r * sy + j, k]); return o; })));
  const half = s => nrm6(s.filter(([c, r]) => c % 2 === 0 && r % 2 === 0).map(([c, r, k]) => [c / 2, r / 2, k]));
  const mirr = s => nrm6(s.map(([c, r, k]) => [-c, r, k]));
  const rot90 = s => nrm6(s.map(([c, r, k]) => [-r, c, k]));
  const chiral = cells => !P6.forms(cells).slice(0, 4).includes(P6.key(cells.map(([x, y]) => [-x, y])));
  const ext6 = s => ({ w: Math.max(...s.map(a => a[0])) + 1, h: Math.max(...s.map(a => a[1])) + 1 });
  W5R.U6 = {
    kind0: 'scale5', verb: '看！', intro: '变大光线！', praise: ['大小看得真准！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      for (let t = 0; t < 400; t++) {
        const n = d === 1 ? rng.int(2, 3) : d === 2 ? rng.int(3, 4) : d === 3 ? rng.int(4, 5) : d === 4 ? rng.int(3, 4) : 4;
        let cells = rng.pick(U6SH[n]).map(a => a.slice());
        const turns = rng.int(0, 3); for (let k = 0; k < turns; k++) cells = cells.map(([x, y]) => [-y, x]);
        if (rng.chance(0.5) && d >= 2) cells = cells.map(([x, y]) => [-x, y]);
        let base = nrm6(cells.map(([c, r]) => [c, r, 0]));
        if ((d === 2 || d === 5) && !chiral(base.map(a => a.slice(0, 2)))) continue;
        if (d === 3) { const k = base.map(() => rng.int(0, 1)); if (!k.includes(0) || !k.includes(1)) continue; base = base.map((a, i) => [a[0], a[1], k[i]]); }
        const big = scl(base, 2, 2), E = ext6(big);
        if (E.w > 6 || E.h > 6) continue;
        const other = () => { const alt = U6SH[n].filter(sh => !P6.same(sh, base.map(a => a.slice(0, 2)))); return alt.length ? scl(nrm6(rng.pick(alt).map(([c, r]) => [c, r, 0])), 2, 2) : null; };
        /* one square fewer (one whose loss keeps the shape in one piece) */
        const less = () => { if (base.length <= 2) return null; const ok = base.map((_, j) => j).filter(j => P6.joined(base.filter((_, i) => i !== j).map(a => a.slice(0, 2)))); const j = rng.pick(ok); return nrm6(base.filter((_, i) => i !== j)); };
        const miss = () => { const m = less(); return m ? scl(m, 2, 2) : null; };
        let right, C = [];
        if (d === 4) {
          right = base;
          C = [['big', big], ['narrow', scl(base, 1, 2)], ['short', scl(base, 2, 1)], ['mirror', chiral(base.map(a => a.slice(0, 2))) ? mirr(base) : null], ['miss', less()]];
        } else if (d === 5) {
          right = rot90(big);
          C = [['mirror', rot90(mirr(big))], ['wide', rot90(scl(base, 2, 1))], ['same', rot90(base)], ['shape', other()], ['tall', rot90(scl(base, 1, 2))]];
        } else {
          right = big;
          C = [['wide', scl(base, 2, 1)], ['tall', scl(base, 1, 2)], ['same', base], ['miss', miss()]];
          if (d >= 2) C.push(['mirror', d === 2 ? mirr(big) : null], ['shape', other()]);
          if (d === 3) C.push(['color', scl(base.map(a => [a[0], a[1], 1 - a[2]]), 2, 2)]);
        }
        /* four wrong ones, all different from the right one and from each other */
        const seen = new Set([key6(right)]), wrong = [];
        rng.shuffle(C.filter(c => c[1])).forEach(([why, s]) => { const k = key6(s); if (wrong.length < 4 && !seen.has(k)) { seen.add(k); wrong.push({ why, s }); } });
        if (wrong.length < 4) continue;
        if (d === 3 && !wrong.some(w => w.why === 'color')) { const cw = C.find(c => c[0] === 'color'); if (cw && !seen.has(key6(cw[1]))) wrong[3] = { why: 'color', s: cw[1] }; else continue; }
        if ([right].concat(wrong.map(w => w.s)).some(s => ext6(s).w > 6 || ext6(s).h > 6)) continue;
        const R = { why: 'right', s: right }, deck = W5U.deal(G, R, wrong, 'u6');
        return { d, k: [d, key6(base), deck.map(x => x.why).join('.')], base: d === 4 ? big : base, shrink: d === 4, cards: deck, answer: deck.indexOf(R) };
      }
      const b = nrm6([[0, 0, 0], [1, 0, 0]]); const deck = [{ why: 'right', s: scl(b, 2, 2) }, { why: 'wide', s: scl(b, 2, 1) }, { why: 'tall', s: scl(b, 1, 2) }, { why: 'same', s: b }, { why: 'miss', s: scl(nrm6([[0, 0, 0]]), 2, 2) }];
      return { d, k: [d, 'x'], base: b, cards: deck, answer: 0 };
    },
    audit(q) { return [{ n: q.cards.length, at: q.answer, right: q.cards.filter(c => c.why === 'right').length }]; },
    geo() { const L = K.L(); return L ? { px: 512, py: 226, pw: 470, ph: 216, cs: 168, cy: 452, gap: 16, per: 5, u: 23 } : { px: 352, py: 330, pw: 600, ph: 220, cs: 190, cy: 560, gap: 18, per: 3, u: 24 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(); if (!st.panel) return;
      place(st.panel, Math.round(g.px - g.pw / 2), Math.round(g.py - g.ph / 2), g.pw, g.ph);
      if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.per === 5 ? g.cy : g.cy + 105, g.cs, g.cs, g.gap, 20, g.per);
      this.drawPanel(st);
    },
    /* a shape as svg rects at u px a square, centred in w x h; opt.dash: outline only */
    shapeSvg(s, u, w, h, opt) {
      opt = opt || {}; const E = ext6(s), x0 = (w - E.w * u) / 2, y0 = (h - E.h * u) / 2;
      let out = '';
      if (opt.grid) for (let c = -1; c <= E.w; c++) for (let r = -1; r <= E.h; r++) out += '<rect x="' + R1(x0 + c * u) + '" y="' + R1(y0 + r * u) + '" width="' + u + '" height="' + u + '" fill="none" stroke="rgba(46,111,216,.16)" stroke-width="1.5"/>';
      s.forEach(([c, r, k]) => { out += opt.dash ? '<rect x="' + R1(x0 + c * u + 2) + '" y="' + R1(y0 + r * u + 2) + '" width="' + (u - 4) + '" height="' + (u - 4) + '" rx="3" fill="rgba(255,201,60,.18)" stroke="#E0A400" stroke-width="3" stroke-dasharray="5 4"/>' : '<rect x="' + R1(x0 + c * u + 1) + '" y="' + R1(y0 + r * u + 1) + '" width="' + (u - 2) + '" height="' + (u - 2) + '" rx="3" fill="' + UCOL6[k || 0] + '" stroke="' + INK + '" stroke-width="2.5"/>'; });
      return out;
    },
    /* the panel: the little shape, 赛罗's light, the "?" (or, after the explanation, the shape grown) */
    drawPanel(st) {
      const q = st.q, g = this.geo(), s = st.panel._s, u = g.u, w = g.pw, h = g.ph;
      s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      const bw = Math.min(170, w * 0.36);
      let out = '<rect x="4" y="4" width="' + (w - 8) + '" height="' + (h - 8) + '" rx="22" fill="rgba(255,255,255,.82)" stroke="#7BA7D8" stroke-width="4"/>';
      out += '<g transform="translate(18 18)">' + this.shapeSvg(q.base, u, bw, h - 36, { grid: true }) + '</g>';
      const ax = 18 + bw + 12, bx = w - 18 - bw;
      out += '<path d="M' + ax + ' ' + h / 2 + 'H' + (bx - 16) + '" stroke="#FFE45C" stroke-width="14" stroke-linecap="round"/><path d="M' + ax + ' ' + h / 2 + 'H' + (bx - 16) + '" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M' + (bx - 30) + ' ' + (h / 2 - 16) + 'L' + (bx - 10) + ' ' + h / 2 + 'L' + (bx - 30) + ' ' + (h / 2 + 16) + '" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
      out += '<rect x="' + bx + '" y="18" width="' + bw + '" height="' + (h - 36) + '" rx="14" fill="rgba(223,240,255,.9)" stroke="#2E6FD8" stroke-width="4" stroke-dasharray="10 7"/>';
      if (st.grown) out += '<g transform="translate(' + bx + ' 18)">' + this.shapeSvg(q.shrink ? half(q.base) : scl(q.base, 2, 2), u, bw, h - 36, { grid: true }) + '</g>';
      else out += '<text x="' + (bx + bw / 2) + '" y="' + (h / 2 + 22) + '" text-anchor="middle" font-size="64" font-weight="900" fill="#2E6FD8" font-family="system-ui,sans-serif">?</text>';
      s.innerHTML = out;
    },
    present(st) {
      const q = st.q, g = this.geo();
      st.panel = W2X.thing(st, 10, 10, 5, ''); st.panel.style.pointerEvents = 'none';
      st.panel._s = svg('svg', { width: '100%', height: '100%' }, st.panel); st.panel._s.style.overflow = 'visible';
      const z = thumb('zero', 46); Object.assign(z.style, { position: 'absolute', left: '-14px', top: '-14px' }); st.panel.appendChild(z);
      st.cards = q.cards.map((c, i) => { const e = W3X.card(st, 'card' + i, 6, 'card'); const sv = svg('svg', { viewBox: '0 0 ' + g.cs + ' ' + g.cs, width: '100%', height: '100%' }, e); sv.style.pointerEvents = 'none'; sv.innerHTML = this.shapeSvg(c.s, g.u, g.cs, g.cs, { grid: true }); e._sv = sv; return e; });
      st.opts = q.cards.map((_, i) => i);
      this.place(st);
      K.pop(st, st.panel); st.cards.forEach((c, i) => K.pop(st, c, 120 + 60 * i));
      K.task(st, [[ic('<rect x="8" y="58" width="16" height="16" fill="#FF6B5B" stroke="#2B2118" stroke-width="3"/><rect x="24" y="58" width="16" height="16" fill="#FF6B5B" stroke="#2B2118" stroke-width="3"/><path d="M44 50L60 50" stroke="#FFC93C" stroke-width="6"/><rect x="62" y="30" width="16" height="16" fill="#FF6B5B" stroke="#2B2118" stroke-width="2"/><rect x="78" y="30" width="16" height="16" fill="#FF6B5B" stroke="#2B2118" stroke-width="2"/><rect x="62" y="46" width="16" height="16" fill="#FF6B5B" stroke="#2B2118" stroke-width="2"/><rect x="78" y="46" width="16" height="16" fill="#FF6B5B" stroke="#2B2118" stroke-width="2"/>')], ['q']]);
      K.say(st, q.shrink ? '变小以后是哪个？' : '变大以后是哪个？');
    },
    onGesture(st, name, p) { if (name !== 'tap' || st.picked) return false; const i = K.cardIndex(p.id); if (i < 0) return false; st.picked = true; K.pop(st, st.cards[i]); Session.submit(st, i); return 'ok'; },
    next(st, strat) { const q = st.q; if (st.picked || !st.cards) return null; return { g: 'tap', p: { id: 'card' + (strat === 'wrong' ? (q.answer + 1 + (st.gen % 4)) % 5 : q.answer) } }; },
    whyLine(q, why) { return { wide: '只变宽了哦', tall: '只变高了哦', same: '没有变大哦', miss: '少了一格哦', mirror: '翻过来了哦', color: '颜色换了哦', shape: '形状变了哦', big: '没有变小哦', narrow: '只变窄了哦', short: '只变矮了哦' }[why] || '形状变了哦'; },
    async feedback(st, ans) { K.wiggle(st, st.cards[ans]); W5U.say(st, this.whyLine(st.q, st.q.cards[ans].why)); await st.scope.wait(T(550)); },
    /* 1. his card blue; the right shape laid over it (dashed), what differs ringed blue ("这里不一样"); 2. the little shape grows
       on the left, every square into four ("一格变四格"); 3. the right card gold */
    async explain(st, ans) {
      const q = st.q, my = st, g = this.geo(), mine = q.cards[ans].s, right = q.cards[q.answer].s;
      W5U.blue(st, st.cards[ans]);
      await fbDone(st); if (!Session.alive(my)) return;
      const e = st.cards[ans]; e._sv.innerHTML = this.shapeSvg(mine, g.u, g.cs, g.cs, { grid: true }) + this.shapeSvg(right, g.u, g.cs, g.cs, { dash: true });
      /* the squares that differ (both drawn from the card's middle): one blue ring round them */
      const Em = ext6(mine), Er = ext6(right), om = [(g.cs - Em.w * g.u) / 2, (g.cs - Em.h * g.u) / 2], orr = [(g.cs - Er.w * g.u) / 2, (g.cs - Er.h * g.u) / 2];
      const pm = new Map(mine.map(([c, r, k]) => [R1(om[0] + c * g.u) + ':' + R1(om[1] + r * g.u), k])), pr = new Map(right.map(([c, r, k]) => [R1(orr[0] + c * g.u) + ':' + R1(orr[1] + r * g.u), k]));
      const diff = []; pm.forEach((k, p) => { if (pr.get(p) !== k) diff.push(p); }); pr.forEach((k, p) => { if (pm.get(p) !== k) diff.push(p); });
      if (diff.length) { const b = box(e), xs = diff.map(p => +p.split(':')[0]), ys = diff.map(p => +p.split(':')[1]), sc = b.w / g.cs; K.ring(st, [{ x: b.x + Math.min(...xs) * sc, y: b.y + Math.min(...ys) * sc, w: (Math.max(...xs) - Math.min(...xs) + g.u) * sc, h: (Math.max(...ys) - Math.min(...ys) + g.u) * sc }], 4, BLUE); }
      W5U.note(st, '这里不一样');
      await st.scope.wait(1000); if (!Session.alive(my)) return;
      st.grown = true; this.drawPanel(st); K.pop(st, st.panel);
      W5U.note(st, q.shrink ? '四格变一格' : '一格变四格');
      await st.scope.wait(950); if (!Session.alive(my)) return;
      W5U.gold(st, st.cards[q.answer]);
      await W5U.sum(st, q.shrink ? '长宽都变小' : q.d === 5 ? '转过来也一样' : '长宽都变大');
    },
    rightEls(st) { return [st.cards[st.q.answer]]; },
    async reveal(st) {
      const q = st.q;
      st.grown = true; this.drawPanel(st);
      W5U.gold(st, st.cards[q.answer]); Sfx.reveal();
      this.cheerAll(st);
      st.summary = q.shrink ? '长宽都变小' : q.d === 5 ? '转过来也一样' : '长宽都变大'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.cards || []; },
    snap(st) { return { cards: st.q.cards.map(c => c.why) }; },
    lines() { return uniq([this.intro, '变大以后是哪个？', '变小以后是哪个？', '这里不一样', '一格变四格', '四格变一格', '长宽都变大', '长宽都变小', '转过来也一样'].concat(this.praise, ['wide', 'tall', 'same', 'miss', 'mirror', 'color', 'shape', 'big', 'narrow', 'short'].map(w => this.whyLine(null, w)))); },
  };

  /* ================================================================ U7 数！ 光棒搭房子 (F4 Little Painter, S7 Shape Beauty Contest;
     the assessment's question 5). 赛罗 builds little crystal houses from glowing sticks, all the same length, on a dot grid.
     Tap a stick: it lights up with a little dot beside it - only to remember it was counted (tap again: it goes). Five
     number cards: "用了几根光棒？"
       L1 one shape: a triangle (3), a square (4), a zigzag (3-5) · L2 two shapes apart (<= 8) · L3 two shapes sharing a side:
       the little house (square + roof = 6), two squares side by side (7) - the shared stick counts once · L4 three squares in
       a row (10), a window of four (12), houses with more rooms (<= 12) · L5 the other way: "七根光棒，能搭哪一个？" - five
       shapes, one uses exactly seven.
     Wrong: his card blue ("不是八根"; L5 "这个用了八根"); the sticks light one by one, numbered; a stick two shapes share
     shines longer ("这根两边都用"); the right card gold ("一共七根"). */
  const H3 = Math.sqrt(3) / 2;
  /* the shapes: lists of sticks [[x1, y1, x2, y2]] in stick units (y down), with which sticks two shapes share */
  const sq = (x, y) => [[x, y, x + 1, y], [x + 1, y, x + 1, y + 1], [x + 1, y + 1, x, y + 1], [x, y + 1, x, y]];
  const tri = (x, y) => [[x, y, x + 1, y], [x + 1, y, x + 0.5, y - H3], [x + 0.5, y - H3, x, y]];
  const zig = (x, y, n) => Array.from({ length: n }, (_, i) => [x + i * 0.5, y + (i % 2 ? -H3 : 0), x + (i + 1) * 0.5, y + (i % 2 ? 0 : -H3)]);
  const U7F = {
    tri: () => tri(0, 1), sq: () => sq(0, 0), zig3: () => zig(0, 1, 3), zig4: () => zig(0, 1, 4), zig5: () => zig(0, 1, 5),
    house: () => sq(0, 1).concat(tri(0, 1)), sq2: () => sq(0, 0).concat(sq(1, 0)), tri2: () => tri(0, 1).concat([[0, 1, 1, 1], [1, 1, 0.5, 1 + H3], [0.5, 1 + H3, 0, 1]]),
    side: () => sq(0, 0).concat([[1, 0, 1, 1], [1, 0, 1 + H3, 0.5], [1 + H3, 0.5, 1, 1]]), sq3: () => sq(0, 0).concat(sq(1, 0), sq(2, 0)),
    win: () => sq(0, 0).concat(sq(1, 0), sq(0, 1), sq(1, 1)), tower: () => sq(0, 1).concat(sq(0, 2), tri(0, 1)), house2: () => sq(0, 1).concat(sq(1, 1), tri(0, 1)),
    house3: () => sq(0, 1).concat(sq(1, 1), tri(0, 1), tri(1, 1)), stack3: () => sq(0, 0).concat(sq(1, 0), sq(0, 1)),
  };
  const PAIRS = [['tri', 'sq'], ['sq', 'sq'], ['tri', 'tri'], ['sq', 'zig3'], ['tri', 'zig4'], ['tri', 'zig3'], ['sq', 'zig4']];
  const kS = s => s.slice().map(v => R1(v * 100) / 100);
  const skey = s => { const a = kS(s), p = [a[0] + ',' + a[1], a[2] + ',' + a[3]].sort(); return p.join('|'); };
  /* a figure: one or two shapes (two: the second moved right of the first); the sticks, without doubles, and which are shared */
  const build7 = names => {
    const all = []; let dx = 0;
    names.forEach(nm => { const S = U7F[nm](), xs = S.flatMap(s => [s[0], s[2]]); const x0 = Math.min(...xs); S.forEach(s => all.push([s[0] - x0 + dx, s[1], s[2] - x0 + dx, s[3]])); dx += Math.max(...xs) - x0 + 0.9; });
    const cnt = new Map(); all.forEach(s => { const k = skey(s); cnt.set(k, (cnt.get(k) || 0) + 1); });
    const seen = new Set(), S0 = [];
    all.forEach(s => { const k = skey(s); if (seen.has(k)) return; seen.add(k); S0.push({ s, sh: cnt.get(k) > 1 }); });
    /* pieces that touch belong together; each piece counted round its middle, the shared sticks last */
    const pt = (x, y) => R1(x * 100) / 100 + ',' + R1(y * 100) / 100, comp = S0.map((_, i) => i);
    const find = i => (comp[i] === i ? i : (comp[i] = find(comp[i])));
    S0.forEach((a, i) => S0.forEach((b, j) => { if (j > i && [pt(a.s[0], a.s[1]), pt(a.s[2], a.s[3])].some(p => p === pt(b.s[0], b.s[1]) || p === pt(b.s[2], b.s[3]))) comp[find(i)] = find(j); }));
    const groups = {}; S0.forEach((a, i) => { (groups[find(i)] = groups[find(i)] || []).push(a); });
    const ordered = [];
    Object.values(groups).sort((A, B) => Math.min(...A.map(a => Math.min(a.s[0], a.s[2]))) - Math.min(...B.map(a => Math.min(a.s[0], a.s[2])))).forEach(G => {
      const cx = G.reduce((t, a) => t + a.s[0] + a.s[2], 0) / (2 * G.length), cy = G.reduce((t, a) => t + a.s[1] + a.s[3], 0) / (2 * G.length);
      const ang = a => { const x = (a.s[0] + a.s[2]) / 2 - cx, y = (a.s[1] + a.s[3]) / 2 - cy; return (Math.atan2(y, x) + Math.PI * 2.75) % (Math.PI * 2); };
      G.filter(a => !a.sh).sort((a, b) => ang(a) - ang(b)).concat(G.filter(a => a.sh)).forEach(a => ordered.push(a));
    });
    return { sticks: ordered.map(a => a.s), shared: ordered.map((a, i) => (a.sh ? i : -1)).filter(i => i >= 0) };
  };
  const U7L = { 1: [['tri'], ['sq'], ['zig3'], ['zig4'], ['zig5']], 3: [['house'], ['sq2'], ['tri2'], ['side']], 4: [['sq3'], ['win'], ['tower'], ['house2'], ['house3'], ['stack3']] };
  W5R.U7 = {
    kind0: 'sticks5', verb: '数！', intro: '光棒搭房子！', praise: ['一根不多不少！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      if (d === 5) {
        /* five shapes, one uses exactly seven sticks */
        for (let t = 0; t < 200; t++) {
          const seven = rng.pick([['sq2'], ['tri', 'sq'], ['sq', 'zig3'], ['tri', 'zig4']]);
          const pool = [['house'], ['sq', 'sq'], ['tri2'], ['tower'], ['side'], ['tri', 'tri'], ['sq3'], ['house2'], ['stack3'], ['zig5'], ['sq'], ['tri', 'zig3']].filter(f => build7(f).sticks.length !== 7);
          const others = rng.shuffle(pool).slice(0, 4);
          const counts = others.map(f => build7(f).sticks.length);
          if (new Set(counts).size < 3) continue;
          const deck = W5U.deal(G, seven, others, 'u7c');
          return { d, k: [d, deck.map(f => f.join('+')).join('.')], figs: deck, n: 7, ask: 'which', answer: deck.indexOf(seven) };
        }
      }
      const names = d === 2 ? rng.pick(PAIRS) : rng.pick(U7L[d]);
      const f = build7(names), n = f.sticks.length;
      return { d, k: [d, names.join('+'), rng.int(0, 2)], names, n, ask: 'count', answer: n, opts: W5U.nums(G, n, 1, 14) };
    },
    audit(q) {
      if (q.ask === 'which') return [{ n: q.figs.length, at: q.answer, right: q.figs.filter(f => build7(f).sticks.length === q.n).length }];
      return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.opts.filter(v => v === q.answer).length }];
    },
    geo(q) {
      const L = K.L();
      if (q.ask === 'which') return L ? { cs: 168, cy: 392, gap: 16, per: 5 } : { cs: 196, cy: 470, gap: 18, per: 3 };
      return L ? { fx: 512, fy: 316, fw: 600, fh: 330, umax: 120, cy: 612, cs: 116, gap: 18 } : { fx: 352, fy: 470, fw: 620, fh: 440, umax: 130, cy: 830, cs: 120, gap: 12 };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    /* a figure's sticks in px: unit u, centred on (cx, cy) */
    layout7(f, cx, cy, w, h, umax) {
      const xs = f.sticks.flatMap(s => [s[0], s[2]]), ys = f.sticks.flatMap(s => [s[1], s[3]]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const u = Math.min(umax, (w - 30) / Math.max(1, x1 - x0), (h - 30) / Math.max(1, y1 - y0));
      return f.sticks.map(s => [cx + (s[0] - (x0 + x1) / 2) * u, cy + (s[1] - (y0 + y1) / 2) * u, cx + (s[2] - (x0 + x1) / 2) * u, cy + (s[3] - (y0 + y1) / 2) * u]).concat([u]);
    },
    stickSvg(s, P, opt) {
      opt = opt || {};
      const L = 'x1="' + R1(P[0]) + '" y1="' + R1(P[1]) + '" x2="' + R1(P[2]) + '" y2="' + R1(P[3]) + '"';
      let out = '<line ' + L + ' stroke="' + (opt.glow || 'rgba(158,231,255,.55)') + '" stroke-width="' + (opt.w || 18) + '" stroke-linecap="round"/><line ' + L + ' stroke="' + INK + '" stroke-width="' + (opt.w ? opt.w * 0.5 : 9) + '" stroke-linecap="round"/><line ' + L + ' stroke="' + (opt.col || '#BFF0FF') + '" stroke-width="' + (opt.w ? opt.w * 0.28 : 5) + '" stroke-linecap="round"/>';
      return out;
    },
    dotsSvg(P) { const D = new Set(); P.forEach(p => { D.add(R1(p[0]) + ',' + R1(p[1])); D.add(R1(p[2]) + ',' + R1(p[3])); }); let o = ''; D.forEach(k => { const [x, y] = k.split(','); o += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#FFF6B8" stroke="' + INK + '" stroke-width="2.5"/>'; }); return o; },
    place(st) {
      const q = st.q, g = this.geo(q);
      if (q.ask === 'which') { if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.cy, g.cs, g.cs, g.gap, 24, g.per); return; }
      if (!st.fig) return;
      relayer(st.figL);
      const P = this.layout7(st.fig, g.fx, g.fy, g.fw, g.fh, g.umax); st.u = P.pop(); st.P = P;
      this.drawFig(st);
      if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.cy, g.cs, g.cs, g.gap);
    },
    cardSpot(st) { const g = this.geo(st.q); return { cx: Stage.W / 2, cy: g.cy, size: g.cs, gap: g.gap }; },
    /* the figure: a faint dot grid, the sticks (marked ones lit, with a little dot), the end dots; the tap bands */
    drawFig(st) {
      const s = st.figL._s, P = st.P, g = this.geo(st.q), u = st.u;
      while (s.firstChild) s.removeChild(s.firstChild);
      let out = '<rect x="' + (g.fx - g.fw / 2) + '" y="' + (g.fy - g.fh / 2) + '" width="' + g.fw + '" height="' + g.fh + '" rx="22" fill="rgba(240,248,255,.78)" stroke="#7BA7D8" stroke-width="4"/>';
      for (let x = g.fx - g.fw / 2 + 18; x < g.fx + g.fw / 2 - 10; x += u / 2) for (let y = g.fy - g.fh / 2 + 18; y < g.fy + g.fh / 2 - 10; y += u / 2) out += '<circle cx="' + R1(x) + '" cy="' + R1(y) + '" r="2.4" fill="rgba(46,111,216,.25)"/>';
      P.forEach((p, i) => { const lit = (st.marks || []).includes(i), hot = st.hot === i; out += this.stickSvg(null, p, hot ? { glow: 'rgba(255,201,60,.7)', col: '#FFC93C', w: 24 } : lit ? { glow: 'rgba(255,236,140,.7)', col: '#FFE45C' } : {}); if (lit) { const mx = (p[0] + p[2]) / 2, my = (p[1] + p[3]) / 2, nx = -(p[3] - p[1]), ny = p[2] - p[0], L = Math.hypot(nx, ny) || 1; out += '<circle cx="' + R1(mx + nx / L * 18) + '" cy="' + R1(my + ny / L * 18) + '" r="7" fill="#FF6B5B" stroke="' + INK + '" stroke-width="2"/>'; } });
      out += this.dotsSvg(P);
      s.innerHTML = out;
      /* tap bands (80 wide): a stick lit as a counting mark (not the answer) */
      const bands = svg('g', {}, s);
      st.bands = P.map((p, i) => { const b = svg('line', { x1: R1(p[0]), y1: R1(p[1]), x2: R1(p[2]), y2: R1(p[3]), stroke: 'rgba(0,0,0,0)', 'stroke-width': Math.min(84, u * 0.8), 'stroke-linecap': 'butt' }, bands); b.style.pointerEvents = 'visibleStroke'; b._box = () => W5U.rect(b); Input.bind(b, { id: 'st' + i }); (st.bound || (st.bound = [])).push(b); return b; });
    },
    /* a card of L5: a little figure */
    figCard(st, names, i) {
      const g = this.geo(st.q), e = W3X.card(st, 'card' + i, 6, 'card'), f = build7(names), P = this.layout7(f, g.cs / 2, g.cs / 2, g.cs - 8, g.cs - 8, 60); P.pop();
      const sv = svg('svg', { viewBox: '0 0 ' + g.cs + ' ' + g.cs, width: '100%', height: '100%' }, e); sv.style.pointerEvents = 'none';
      sv.innerHTML = P.map(p => this.stickSvg(null, p, { w: 11 })).join('') + this.dotsSvg(P).replace(/r="7"/g, 'r="4.5"');
      e._f = f; e._P = P; e._sv = sv; return e;
    },
    present(st) {
      const q = st.q, g = this.geo(q);
      if (q.ask === 'which') {
        st.cards = q.figs.map((f, i) => this.figCard(st, f, i)); st.opts = q.figs.map((_, i) => i);
        this.place(st); st.cards.forEach((c, i) => K.pop(st, c, 60 * i));
        K.task(st, [[ic('<path d="M14 80L86 20" stroke="#2B2118" stroke-width="12" stroke-linecap="round"/><path d="M14 80L86 20" stroke="#BFF0FF" stroke-width="6" stroke-linecap="round"/>')], [{ qty: q.n }], ['q']]);
        W3X.say2(st, CN[q.n] + '根光棒，', '能搭哪一个？');
        return;
      }
      st.marks = []; st.fig = build7(q.names);
      st.figL = layer(st, 5); st.figL.style.pointerEvents = 'none';
      st.cards = numRow(st, q.opts, g.cs); st.opts = q.opts.slice();
      this.place(st);
      K.pop(st, st.figL);
      K.task(st, [[ic('<path d="M14 80L86 20" stroke="#2B2118" stroke-width="12" stroke-linecap="round"/><path d="M14 80L86 20" stroke="#BFF0FF" stroke-width="6" stroke-linecap="round"/>')], ['q']]);
      K.say(st, '用了几根光棒？');
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const m = /^st(\d+)$/.exec(p.id || '');
      if (m) { const i = +m[1], on = !st.marks.includes(i); st.marks = on ? st.marks.concat(i) : st.marks.filter(x => x !== i); this.drawFig(st); if (on) Sfx.place(); else Sfx.back(); return 'free'; }
      const i = K.cardIndex(p.id); if (i < 0) return false;
      st.picked = true; K.pop(st, st.cards[i]); Session.submit(st, st.opts[i]); return 'ok';
    },
    next(st, strat) { const q = st.q; if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== q.answer) : st.opts.indexOf(q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
    wrongLine(q, v) { return q.ask === 'which' ? '这个用了' + CNQ(build7(q.figs[v]).sticks.length) + '根' : '不是' + CNQ(v) + '根'; },
    async feedback(st, ans) { const c = W5U.cardOf(st, ans); if (c) K.wiggle(st, c); W5U.say(st, this.wrongLine(st.q, ans)); await st.scope.wait(T(550)); },
    /* number the sticks of points P (stage px) one after another (an animation); the shared ones shine longer */
    countSticks(st, P, shared, toStage) {
      const dt = P.length > 8 ? 120 : 160;
      P.forEach((p, j) => { const a = toStage(p[0], p[1]), b = toStage(p[2], p[3]); badgeAt(st, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, j + 1, 34, dt * j); st.scope.timeout(() => Sfx.count(Math.min(20, j + 1)), dt * j); });
      return T(dt * P.length + 200);
    },
    /* 1. his card blue (the feedback line said once); 2. the sticks counted, the shared one shines ("这根两边都用"); 3. gold */
    async explain(st, ans) {
      const q = st.q, my = st;
      W5U.blue(st, W5U.cardOf(st, ans));
      await fbDone(st); if (!Session.alive(my)) return;
      if (q.ask === 'which') {
        const e = st.cards[q.answer], b = box(e), sc = b.w / this.geo(q).cs;
        const ms = this.countSticks(st, e._P, e._f.shared, (x, y) => [b.x + x * sc, b.y + y * sc]);
        W5U.note(st, '一根一根数');
        await st.scope.wait(Math.max(1000, ms)); if (!Session.alive(my)) return;
        W5U.gold(st, e);
        await W5U.sum(st, W5U.all(q.n, '根'));
        return;
      }
      const sh = st.fig.shared;
      if (sh.length) { st.hot = sh[0]; this.drawFig(st); }
      const ms = this.countSticks(st, st.P, sh, (x, y) => [x, y]);
      W5U.note(st, sh.length ? '这根两边都用' : '一根一根数');
      await st.scope.wait(Math.max(1100, ms)); if (!Session.alive(my)) return;
      W5U.gold(st, W5U.cardOf(st, q.answer));
      await W5U.sum(st, W5U.all(q.answer, '根'));
    },
    rightEls(st) { return [W5U.cardOf(st, st.q.answer)]; },
    async reveal(st) {
      const q = st.q;
      W5U.gold(st, W5U.cardOf(st, q.answer)); Sfx.reveal();
      this.cheerAll(st);
      st.summary = W5U.all(q.ask === 'which' ? q.n : q.answer, '根'); W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.cards || []; },
    snap(st) { return { n: st.q.n, marks: (st.marks || []).slice() }; },
    lines() {
      const out = [this.intro, '用了几根光棒？', '能搭哪一个？', '这根两边都用', '一根一根数'].concat(this.praise);
      for (let v = 1; v <= 14; v++) out.push('不是' + CNQ(v) + '根');
      for (let v = 3; v <= 12; v++) out.push(W5U.all(v, '根'), '这个用了' + CNQ(v) + '根');
      out.push('七根光棒，');
      return uniq(out);
    },
  };

  /* ================================================================ U8 藏！ 楼后面几只小怪兽 (reasoning; F13 Field Trip, F18 Surprise
     for Mom). A row of 2-4 crystal buildings (opaque); little block monsters (friends playing hide and seek) are behind them:
     a head shows here, a tail there, a head over a roof. "楼后面藏着几只？" - five number cards.
       L1 2-3 of them, each shows one part · L2 one is wider than its building: its head on one side, its tail on the other,
       the same colour - one · L3 a red head on the left and a blue tail on the right: two · L4 the same colour but a big head
       and a small tail: two; or a head and a tail two buildings apart: two · L5 heads over the roofs, tails beside, 4
       buildings, 3-5 of them: colour, size and place together.
     Wrong: his card blue ("不是四只"); the buildings turn to glass, every monster is ringed once ("头和尾巴是一只" /
     "颜色不一样，是两只" / "大小不一样，是两只" / "离得太远，是两只"); the right card gold ("一共三只"). */
  const MCOL = { red: '#FF6B5B', blue: '#4FB3FF', green: '#5CC46E', purple: '#B57BFF', orange: '#FF9F43' };
  /* a block monster (friendly): a big square head with round eyes and two little round horns, a lower body, a tail.
     Lying: head at the front end (f = 1 faces right). Standing: head on top, the tail out to one side at the bottom.
     H: the head's size. Returns svg in stage px for the monster whose head's centre is at (hx, hy). */
  const monsterSvg = (m, hx, hy) => {
    const H = m.H, c = MCOL[m.col], k = 'stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"', f = m.f;
    let s = '';
    if (m.pose === 'lie') {
      const bw = m.L, by = hy - H * 0.05, bx0 = f > 0 ? hx - bw : hx, tx = f > 0 ? bx0 : bx0 + bw;
      s += '<path d="M' + R1(tx) + ' ' + R1(by + H * 0.04) + 'L' + R1(tx - f * H * 0.9) + ' ' + R1(by + H * 0.3) + 'L' + R1(tx) + ' ' + R1(by + H * 0.48) + 'Z" fill="' + c + '" ' + k + '/>';
      s += '<rect x="' + R1(bx0) + '" y="' + R1(by) + '" width="' + R1(bw) + '" height="' + R1(H * 0.55) + '" rx="' + R1(H * 0.18) + '" fill="' + c + '" ' + k + '/>';
    } else {
      const top = hy + H * 0.35, bh = m.L, tx = hx + (f > 0 ? -1 : 1) * H * 0.3;
      if (!m.noTail) s += '<path d="M' + R1(tx) + ' ' + R1(top + bh - H * 0.5) + 'L' + R1(tx - f * H * 0.95) + ' ' + R1(top + bh - H * 0.24) + 'L' + R1(tx) + ' ' + R1(top + bh - H * 0.06) + 'Z" fill="' + c + '" ' + k + '/>';
      s += '<rect x="' + R1(hx - H * 0.36) + '" y="' + R1(top) + '" width="' + R1(H * 0.72) + '" height="' + R1(bh) + '" rx="' + R1(H * 0.18) + '" fill="' + c + '" ' + k + '/>';
    }
    s += '<circle cx="' + R1(hx - H * 0.28) + '" cy="' + R1(hy - H * 0.5) + '" r="' + R1(H * 0.13) + '" fill="#FFE45C" ' + k + '/><circle cx="' + R1(hx + H * 0.28) + '" cy="' + R1(hy - H * 0.5) + '" r="' + R1(H * 0.13) + '" fill="#FFE45C" ' + k + '/>';
    s += '<rect x="' + R1(hx - H / 2) + '" y="' + R1(hy - H / 2) + '" width="' + H + '" height="' + H + '" rx="' + R1(H * 0.22) + '" fill="' + c + '" ' + k + '/>';
    s += '<circle cx="' + R1(hx - H * 0.18 + f * H * 0.06) + '" cy="' + R1(hy - H * 0.06) + '" r="' + R1(H * 0.13) + '" fill="#fff" ' + k + '/><circle cx="' + R1(hx + H * 0.18 + f * H * 0.06) + '" cy="' + R1(hy - H * 0.06) + '" r="' + R1(H * 0.13) + '" fill="#fff" ' + k + '/>';
    s += '<circle cx="' + R1(hx - H * 0.18 + f * H * 0.09) + '" cy="' + R1(hy - H * 0.04) + '" r="' + R1(H * 0.055) + '" fill="' + INK + '"/><circle cx="' + R1(hx + H * 0.18 + f * H * 0.09) + '" cy="' + R1(hy - H * 0.04) + '" r="' + R1(H * 0.055) + '" fill="' + INK + '"/>';
    s += '<path d="M' + R1(hx - H * 0.14) + ' ' + R1(hy + H * 0.2) + 'Q' + R1(hx) + ' ' + R1(hy + H * 0.3) + ' ' + R1(hx + H * 0.14) + ' ' + R1(hy + H * 0.2) + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
    return s;
  };
  /* a hiding place: a monster (lie: head out on side `side` of building b, or the whole width with its tail out on the other
     side; stand: head over the roof, tail out at the side). The layout turns these into positions. */
  const U8COLS = Object.keys(MCOL);
  W5R.U8 = {
    kind0: 'peek5', verb: '藏！', intro: '小怪兽捉迷藏！', praise: ['数得真清楚！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      for (let t = 0; t < 300; t++) {
        const nb = d <= 1 ? rng.int(2, 3) : d <= 3 ? 3 : d === 4 ? rng.pick([3, 4]) : 4;
        const slots = []; for (let b = 0; b < nb; b++) { slots.push(b + 'L', b + 'R'); if (d === 5) slots.push(b + 'T'); }
        const free = new Set(slots), M = [], cols = rng.shuffle(U8COLS);
        let ci = 0; const col = () => cols[ci++ % cols.length], size = () => rng.pick(['s', 'b']);
        /* a side slot also closes the facing side of the next building (one thing per gap: nothing overlaps) */
        const take = (...ks) => { if (!ks.every(k => free.has(k))) return false; ks.forEach(k => { free.delete(k); const b = +k[0]; if (k[1] === 'R') free.delete((b + 1) + 'L'); if (k[1] === 'L') free.delete((b - 1) + 'R'); }); return true; };
        let trap = null;
        const single = () => { const opts = Array.from(free).filter(k => k[1] !== 'T'); if (!opts.length) return false; const k = rng.pick(opts); take(k); M.push({ kind: 'one', b: +k[0], side: k[1], part: rng.pick(['head', 'tail']), col: col(), sz: size() }); return true; };
        const wide = () => { const b = rng.int(0, nb - 1); if (!take(b + 'L', b + 'R')) return false; M.push({ kind: 'wide', b, f: rng.pick([1, -1]), col: col(), sz: size() }); return true; };
        if (d === 1) { const n = rng.int(2, 3); for (let i = 0; i < n; i++) single(); }
        else if (d === 2) { if (!wide()) continue; trap = 'wide'; const n = rng.int(1, 2); for (let i = 0; i < n; i++) single(); }
        else if (d === 3) {
          /* a head on the left and a tail on the right of one building, different colours: two */
          const b = rng.int(0, nb - 1); if (!take(b + 'L', b + 'R')) continue;
          const c1 = col(), c2 = col(), z = size(), f = rng.pick([1, -1]);
          M.push({ kind: 'one', b, side: f > 0 ? 'R' : 'L', part: 'head', col: c1, sz: z }, { kind: 'one', b, side: f > 0 ? 'L' : 'R', part: 'tail', col: c2, sz: z }); trap = 'color';
          if (rng.chance(0.5)) wide(); single();
        } else if (d === 4) {
          if (rng.chance(0.5)) {
            const b = rng.int(0, nb - 1); if (!take(b + 'L', b + 'R')) continue;
            const c1 = col(), f = rng.pick([1, -1]);
            M.push({ kind: 'one', b, side: f > 0 ? 'R' : 'L', part: 'head', col: c1, sz: 'b' }, { kind: 'one', b, side: f > 0 ? 'L' : 'R', part: 'tail', col: c1, sz: 's' }); trap = 'size';
          } else {
            /* a head at the right of building b, a tail at the left of building b + 2 ... no: a head and a tail two buildings apart */
            if (nb < 3) continue;
            const b = rng.int(0, nb - 3), c1 = col(), z = size();
            if (!take(b + 'R', (b + 2) + 'L')) continue;
            M.push({ kind: 'one', b, side: 'R', part: 'tail', col: c1, sz: z }, { kind: 'one', b: b + 2, side: 'L', part: 'head', col: c1, sz: z }); trap = 'far';
          }
          wide() || single(); if (rng.chance(0.5)) single();
        } else {
          /* standing ones: a head over the roof, its tail out beside (one), or a head over the roof and somebody else's tail */
          const b = rng.int(0, nb - 1), f = rng.pick([1, -1]), side = f > 0 ? 'L' : 'R';
          if (!take(b + 'T', b + side)) continue;
          M.push({ kind: 'stand', b, f, col: col(), sz: 'b' }); trap = 'stand';
          const n = rng.int(1, 3);
          for (let i = 0; i < n; i++) { if (rng.chance(0.4)) { const t2 = Array.from(free).filter(k => k[1] === 'T'); if (t2.length) { const k = rng.pick(t2); take(k); M.push({ kind: 'roof', b: +k[0], col: col(), sz: size() }); continue; } } if (!(rng.chance(0.4) && wide())) single(); }
        }
        const n = M.length;
        if (n < (d === 5 ? 3 : 2) || n > (d === 5 ? 5 : 4)) continue;
        const bw = Array.from({ length: nb }, () => rng.int(0, 2));
        return { d, k: [d, nb, M.map(m => m.kind + m.b + (m.side || '') + (m.part || '') + m.col[0] + m.sz).join('.'), bw.join('')], nb, bw, M, trap, answer: n, opts: W5U.nums(G, n, 1, 9) };
      }
      return { d, k: [d, 'x'], nb: 2, bw: [1, 1], M: [{ kind: 'one', b: 0, side: 'L', part: 'head', col: 'red', sz: 'b' }, { kind: 'one', b: 1, side: 'R', part: 'tail', col: 'blue', sz: 's' }], trap: null, answer: 2, opts: [1, 2, 3, 4, 5] };
    },
    audit(q) { return [{ n: q.opts.length, at: q.opts.indexOf(q.answer), right: q.opts.filter(v => v === q.answer).length }]; },
    geo(q) {
      const L = K.L();
      return L ? { x0: 120, x1: 904, ground: 500, top: 190, cy: 612, cs: 108, gap: 14 } : { x0: 40, x1: 664, ground: 700, top: 300, cy: 830, cs: 120, gap: 12 };
    },
    /* the friends: 奥特曼 in one corner, 小怪兽 in the other, 小恐龙 beside 奥特曼 */
    decor(G) {
      const L = K.L(), A = id => G.actors[id];
      if (A('ultraman')) showActor(A('ultraman'), L ? 86 : 72, L ? 698 : 1016, L ? 176 : 140);
      if (A('kaiju1')) showActor(A('kaiju1'), L ? 944 : 634, L ? 698 : 1016, L ? 150 : 128);
      if (A('kaiju2')) showActor(A('kaiju2'), L ? 170 : 168, L ? 698 : 1016, L ? 112 : 104);
    },
    /* the buildings (x, w, h) and every monster's head position, from the question (the same picture after a turn) */
    scene(q) {
      const g = this.geo(q), nb = q.nb, L5 = K.L(), span = g.x1 - g.x0, slot = span / nb;
      const B = Array.from({ length: nb }, (_, i) => { const w = Math.round(slot * (0.46 + 0.05 * q.bw[i])), cx = g.x0 + (i + 0.5) * slot, h = Math.round((g.ground - g.top) * (0.74 + 0.09 * ((i + q.bw[i]) % 3))); return { x: Math.round(cx - w / 2), w, h, y: g.ground - h }; });
      const sc = nb >= 4 ? 0.82 : 1, HS = { s: Math.round((L5 ? 50 : 44) * sc), b: Math.round((L5 ? 70 : 60) * sc) };
      const P = q.M.map(m => {
        const b = B[m.b], H = HS[m.sz], hy = g.ground - H * 0.56;
        if (m.kind === 'wide') return Object.assign({}, m, { pose: 'lie', H, L: b.w + H * 0.42 + 2, hx: m.f > 0 ? b.x + b.w + H * 0.42 : b.x - H * 0.42, hy });
        const roofY = x => b.y - 34 * Math.max(0, 1 - Math.abs(x - (b.x + b.w / 2)) / (b.w / 2 + 6)), over = hx => Math.min(roofY(hx - H / 2), roofY(hx + H / 2), roofY(Math.min(Math.max(hx, b.x), b.x + b.w))) - H * 0.22;
        if (m.kind === 'stand') { const f = m.f, hx = f > 0 ? b.x + H * 0.55 : b.x + b.w - H * 0.55, hyR = over(hx); return Object.assign({}, m, { pose: 'stand', f, H, L: g.ground - (hyR + H * 0.35) - 4, hx, hy: hyR }); }
        if (m.kind === 'roof') { const hx = b.x + b.w / 2 + (m.b % 2 ? -1 : 1) * b.w * 0.22; return Object.assign({}, m, { pose: 'stand', f: 1, H, L: H * 0.9, hx, hy: over(hx), noTail: true }); }
        const out = m.side === 'R' ? 1 : -1;
        if (m.part === 'head') { const L = Math.max(H * 0.5, Math.min(b.w - H * 0.3 - 8, H * 1.5)); return Object.assign({}, m, { pose: 'lie', f: out, H, L, hx: out > 0 ? b.x + b.w + H * 0.4 : b.x - H * 0.4, hy }); }
        const L = Math.max(H * 0.6, Math.min(b.w - H * 0.6, H * 1.4));
        return Object.assign({}, m, { pose: 'lie', f: -out, H, L, hx: out > 0 ? b.x + b.w + 2 - L : b.x - 2 + L, hy });
      });
      return { B, P };
    },
    decorScene(st) {
      const q = st.q, g = this.geo(q), S = this.scene(q), sb = st.back._s, sf = st.front._s;
      relayer(st.back); relayer(st.front);
      sb.innerHTML = S.P.map(p => '<g class="mon">' + monsterSvg(p, p.hx, p.hy) + '</g>').join('');
      let f = '';
      S.B.forEach((b, i) => {
        f += '<g class="bld"><rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="10" fill="' + ['#C9DDF5', '#D8CFF5', '#CDEFE6', '#F2D9E6'][i % 4] + '" stroke="' + INK + '" stroke-width="5"/>';
        f += '<polygon points="' + (b.x - 6) + ',' + b.y + ' ' + (b.x + b.w / 2) + ',' + (b.y - 34) + ' ' + (b.x + b.w + 6) + ',' + b.y + '" fill="#9EC5F0" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
        for (let r = 0; r < Math.floor((b.h - 40) / 60); r++) for (let c = 0; c < 2; c++) f += '<rect x="' + R1(b.x + b.w * (0.2 + 0.38 * c)) + '" y="' + (b.y + 26 + r * 60) + '" width="' + R1(b.w * 0.22) + '" height="32" rx="6" fill="#FFF6B8" stroke="' + INK + '" stroke-width="3"/>';
        f += '</g>';
      });
      f += '<path d="M' + (g.x0 - 30) + ' ' + g.ground + 'H' + (g.x1 + 30) + '" stroke="' + INK + '" stroke-width="4" stroke-linecap="round" opacity=".5"/>';
      sf.innerHTML = f;
      if (st.glass) sf.querySelectorAll('.bld').forEach(e => { e.style.opacity = '0.28'; });
      st.S = S;
    },
    place(st) {
      const q = st.q, g = this.geo(q); if (!st.back) return;
      this.decorScene(st);
      if (st.cards) W5U.lay(st.cards, Stage.W / 2, g.cy, g.cs, g.cs, g.gap);
    },
    cardSpot(st) { const g = this.geo(st.q); return { cx: Stage.W / 2, cy: g.cy, size: g.cs, gap: g.gap }; },
    present(st) {
      const q = st.q, g = this.geo(q);
      st.back = layer(st, 3); st.front = layer(st, 4);
      st.cards = numRow(st, q.opts, g.cs); st.opts = q.opts.slice();
      this.place(st);
      K.pop(st, st.front);
      K.task(st, [[ic('<rect x="20" y="30" width="44" height="64" rx="6" fill="#C9DDF5" stroke="#2B2118" stroke-width="4"/><rect x="64" y="52" width="22" height="20" rx="6" fill="#5CC46E" stroke="#2B2118" stroke-width="4"/><circle cx="71" cy="60" r="4" fill="#fff" stroke="#2B2118" stroke-width="2"/><path d="M20 70L4 78L20 84Z" fill="#FF6B5B" stroke="#2B2118" stroke-width="3"/>')], ['q']]);
      K.say(st, '楼后面藏着几只？');
    },
    onGesture(st, name, p) { return W5U.tapCard(st, name, p); },
    next(st, strat) { return W5U.cardNext(st, strat); },
    async feedback(st, ans) { const c = W5U.cardOf(st, ans); if (c) K.wiggle(st, c); W5U.say(st, '不是' + CNQ(ans) + '只'); await st.scope.wait(T(550)); },
    trapLine(q) { return { wide: '头和尾巴是一只', stand: '头和尾巴是一只', color: '颜色不一样，是两只', size: '大小不一样，是两只', far: '离得太远，是两只' }[q.trap] || '一只一只数'; },
    /* a box round a monster: its visible-or-not whole body (stage px) */
    monBox(p) {
      const H = p.H;
      if (p.pose === 'lie') { const x0 = p.f > 0 ? p.hx - p.L - H * 0.7 : p.hx - H / 2, x1 = p.f > 0 ? p.hx + H / 2 : p.hx + p.L + H * 0.7; return { x: x0, y: p.hy - H * 0.65, w: x1 - x0, h: H * 1.3 }; }
      const tip = p.noTail ? p.hx : p.hx - p.f * H * 1.25, x0 = Math.min(p.hx - H / 2, tip), x1 = Math.max(p.hx + H / 2, tip); return { x: x0, y: p.hy - H * 0.65, w: x1 - x0, h: p.L + H * 1.0 + H * 0.05 };
    },
    /* 1. his card blue (said once); 2. the buildings turn to glass, every monster ringed once, counted ("头和尾巴是一只" ...);
       3. the right card gold ("一共三只") */
    async explain(st, ans) {
      const q = st.q, my = st;
      W5U.blue(st, W5U.cardOf(st, ans));
      await fbDone(st); if (!Session.alive(my)) return;
      st.glass = true; this.decorScene(st);
      st.front._s.querySelectorAll('.bld').forEach(e => st.scope.anim(e, [{ opacity: 1 }, { opacity: 0.28 }], { duration: 380 }));
      st.S.P.forEach((p, j) => { const b = this.monBox(p); st.scope.timeout(() => { if (!Session.alive(my)) return; K.ring(st, [b], 4, '#FF9F43'); badgeAt(st, p.hx, p.hy - p.H * 0.75 - 6, j + 1, 38); Sfx.count(j + 1); }, 420 + 260 * j); });
      W5U.note(st, this.trapLine(q));
      await st.scope.wait(Math.max(1300, 420 + 260 * st.S.P.length + 200)); if (!Session.alive(my)) return;
      W5U.gold(st, W5U.cardOf(st, q.answer));
      await W5U.sum(st, '一共' + CNQ(q.answer) + '只');
    },
    rightEls(st) { return [W5U.cardOf(st, st.q.answer)]; },
    async reveal(st) {
      const q = st.q;
      W5U.gold(st, W5U.cardOf(st, q.answer)); Sfx.reveal();
      st.glass = true; this.decorScene(st);
      this.cheerAll(st);
      st.summary = '一共' + CNQ(q.answer) + '只'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    cheerAll(st) { if (st.explaining) return; ['ultraman', 'kaiju1', 'kaiju2'].forEach(id => { const a = st.G.actors[id]; if (a && a.x > 0) a.cheer(); }); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { n: st.q.answer, trap: st.q.trap }; },
    lines() {
      const out = [this.intro, '楼后面藏着几只？', '头和尾巴是一只', '颜色不一样，是两只', '大小不一样，是两只', '离得太远，是两只', '一只一只数'].concat(this.praise);
      for (let v = 1; v <= 9; v++) out.push('不是' + CNQ(v) + '只');
      for (let v = 2; v <= 5; v++) out.push('一共' + CNQ(v) + '只');
      return uniq(out);
    },
  };
})();
/* ================================================================ ⑦ 复仇者·积木楼 (avengers5, from level 3): V5 加号飞机、减号飞机 ·
   V6 切成一样的 · V7 积木转转 · V8 穿过墙洞 (reasoning). docs/W5-DESIGN.md §5 ⑦. One function, no top-level names: each rule
   is W5R.<id>, registered (background, friends, icon, review card) in games.js. Package D. */
(() => {
  const INK = '#2B2118', GOLD = '#FFC93C', BLUE = '#4FB3FF';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const sv = (w, h) => { const s = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: '100%' }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none'; return s; };
  /* a FLIP move: e goes to (x, y, w, h) on the stage, animated from where it is now */
  const glide = (st, e, x, y, w, h, ms) => {
    const a = box(e); place(e, x, y, w, h);
    if (!a.w || fast()) return Promise.resolve();
    const k = a.w / (w || a.w);
    return st.scope.anim(e, [{ transform: 'translate(' + (a.x - x) + 'px,' + (a.y - y) + 'px) scale(' + k + ')', transformOrigin: '0 0' }, { transform: 'translate(0,0) scale(1)', transformOrigin: '0 0' }], { duration: ms || 380, easing: EASE.glide });
  };
  /* a big button (≥ 88) with its own picture, at (x, y) */
  const button = (st, id, pic, size) => { const b = K.done(st, 'check', 0, 0, size || 110); b.innerHTML = pic; K.reg(st, id, b, {}); return b; };
  const ICON = {
    go: '<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="46" fill="#5CC46E" stroke="' + INK + '" stroke-width="5"/><path d="M22 62L46 54L58 30H66L62 50L80 44L82 52L62 60L66 76H58L48 62L24 70Z" fill="#fff" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/></svg>',
    ok: '<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="46" fill="#5CC46E" stroke="' + INK + '" stroke-width="5"/><path d="M28 52L44 67L73 34" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="46" fill="#FFC93C" stroke="' + INK + '" stroke-width="5"/><path d="M34 40A22 22 0 1 1 30 62" fill="none" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/><path d="M20 28L36 44L42 24Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/></svg>',
  };

  /* ---------------------------------------------------------------- V5 送！ 加号飞机、减号飞机 (S11 Top It Up, S16 Piggy Bank,
     S8 Party at Beach): story cards are sorted by the operation they need - not computed. Two kinds of adding (又来了 inc,
     合起来 join), two kinds of taking away (拿走 dec, 求另一部分 part) and 比多少 (cmp). Drawn as §3.3: what came sparkles
     and comes in on an arrow; what went is a grey dashed outline with an arrow out; together is a gold brace; the part asked
     for has a "?".
       L1 3 cards (又来了, 拿走, one more of these) · L2 4 cards (+ 合起来) · L3 4 cards, always a 求另一部分
       L4 3 stories heard: each card pops up while captain tells it in two short sentences; the card shows only the things
          (no arrow, no brace) - tapping a card tells it again · L5 4 cards, always a 比多少
     Drag a card onto a plane (or tap the card, then the plane); a card on a plane can go to the other one. All on board:
     起飞. A random sort is right 1 time in 2^n (1/8 L1, 1/16 L2-L5). Right: every card gets its number sentence, one is
     read, the planes take off. Wrong: his card blue, its story played again; it flies to the right plane (gold) "拿走，用
     减号"; its number sentence comes under it and is read. */
  const V5K = { inc: '+', join: '+', dec: '-', part: '-', cmp: '-' };
  const V5FB = { inc: '这是又来了哦', join: '这是合起来哦', dec: '这是吃掉了哦', part: '这是求另一份', cmp: '这是比多少' };
  const V5WHY = { inc: '又来了，用加号', join: '合起来，用加号', dec: '拿走，用减号', part: '求另一份，用减号', cmp: '比多少，用减号' };
  /* the task card's picture: a plane, + and - */
  const IC5P = W2X.icon('<path d="M10 52Q10 42 24 41H70L84 26H94L89 44Q96 46 96 52Q96 58 89 59H24Q10 59 10 52Z" fill="#EEF3FA" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><text x="30" y="92" font-size="34" font-weight="900" text-anchor="middle" fill="#E8414B">+</text><text x="70" y="92" font-size="34" font-weight="900" text-anchor="middle" fill="#2E6FD8">−</text>');
  const V5MAX = [0, 5, 7, 9, 10, 10];
  /* the number sentence of a story: [a, op, b, c] */
  const v5eq = s => s.t === 'inc' || s.t === 'join' ? [s.a, '+', s.b, s.a + s.b] : s.t === 'dec' ? [s.a, '-', s.b, s.a - s.b] : s.t === 'part' ? [s.a, '-', s.b, s.a - s.b] : [s.a, '-', s.b, s.a - s.b];
  const v5read = e => CN[e[0]] + (e[1] === '+' ? '加' : '减') + CN[e[2]] + '等于' + CN[e[3]] + '！';
  /* the two sentences of a heard story (L4) */
  const v5tell = s => s.t === 'inc' ? ['池塘里有' + CNQ(s.a) + '只鸭，', '又飞来' + CNQ(s.b) + '只！']
    : s.t === 'dec' ? ['盘里有' + CNQ(s.a) + '块饼干，', '吃掉了' + CNQ(s.b) + '块！']
    : s.t === 'join' ? ['红球' + CNQ(s.a) + '个，蓝球' + CNQ(s.b) + '个，', '一共几个？']
    : [CNQ(s.a) + '条鱼，' + CNQ(s.b) + '条红的，', '黄的有几条？'];
  /* a story's numbers: inc / join a + b, dec a - b, part a fish of which b red, cmp a and b (a > b) - within the level's range */
  function v5story(rng, t, hi) {
    if (t === 'inc' || t === 'join') { const c = rng.int(3, hi), a = rng.int(1, c - 1); return { t, a, b: c - a }; }
    const a = rng.int(3, hi), b = rng.int(1, a - 1);
    return { t, a, b };
  }
  W5R.V5 = {
    kind0: 'story5', verb: '送！', intro: '加还是减？', praise: ['想得真清楚！'], props: ['duck', 'cookie', 'apple', 'pear'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, hi = V5MAX[d];
      let ts;
      if (d === 1) ts = ['inc', 'dec', rng.pick(['inc', 'dec'])];
      else if (d === 2) ts = ['inc', 'dec', 'join', rng.pick(['inc', 'dec', 'join'])];
      else if (d === 3) ts = ['part', rng.pick(['inc', 'join']), 'dec', rng.pick(['inc', 'join', 'dec'])];
      else if (d === 4) { const a = rng.pick(['inc', 'join']), b = rng.pick(['dec', 'part']); ts = [a, b, rng.pick(['inc', 'join', 'dec', 'part'].filter(t => t !== a && t !== b))]; }
      else ts = ['cmp', rng.pick(['inc', 'join']), rng.pick(['dec', 'part']), rng.pick(['inc', 'join', 'dec', 'part'])];
      ts = rng.shuffle(ts);
      /* L4: three different kinds - three different things (ducks, balls, cookies, fish), so the stories are told apart */
      const ss = ts.map(t => v5story(rng, t, hi));
      for (let i = 1; i < ss.length; i++) for (let j = 0; j < i; j++) if (ss[i].t === ss[j].t && ss[i].a === ss[j].a && ss[i].b === ss[j].b) { ss[i] = v5story(rng, ss[i].t, hi); j = -1; }
      const answer = ss.map(s => V5K[s.t]).join('');
      return { k: [d, ss.map(s => s.t[0] + s.a + s.b).join('')], d, ss, heard: d === 4, answer, opts: ['+', '-'] };
    },
    audit(q) { return [{ build: true, chance: Math.pow(0.5, q.ss.length) }]; },
    /* the home row of the story cards, the two planes' bays, the take-off button */
    geo(q) {
      const L = K.L(), n = q.ss.length;
      const card = L ? (n === 3 ? { w: 220, h: 165, gap: 30, per: 3, cy: 188 } : { w: 200, h: 150, gap: 20, per: 4, cy: 180 })
        : (n === 3 ? { w: 216, h: 162, gap: 14, per: 3, cy: 300 } : { w: 226, h: 170, gap: 18, per: 2, cy: 382 });
      const bay = L ? { w: 320, h: 352, y: 296, xs: [182, 522] } : { w: 322, h: 314, y: 574, xs: [20, 362] };
      return { card, bay, mini: { w: 150, h: 112, gap: 10 }, head: L ? 100 : 72, go: L ? [886, 372] : [297, 898] };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    /* where card i is: its home spot, or its place in a bay */
    spot(st, i) {
      const g = this.geo(st.q), c = g.card, n = st.q.ss.length;
      const where = st.where[i];
      if (where == null) { const p = W5U.grid(n, Stage.W / 2, c.cy, c.w, c.h, c.gap, 16, c.per)[i]; return { x: p.x, y: p.y, w: c.w, h: c.h }; }
      const b = where === '+' ? 0 : 1, k = st.bays[b].indexOf(i), m = g.mini, x0 = g.bay.xs[b] + (g.bay.w - 2 * m.w - m.gap) / 2, y0 = g.bay.y + g.head + 8;
      return { x: x0 + (k % 2) * (m.w + m.gap), y: y0 + Math.floor(k / 2) * (m.h + m.gap), w: m.w, h: m.h };
    },
    place(st) {
      const q = st.q, g = this.geo(q);
      (st.homes || []).forEach((h, i) => { const p = W5U.grid(q.ss.length, Stage.W / 2, g.card.cy, g.card.w, g.card.h, g.card.gap, 16, g.card.per)[i]; place(h, p.x, p.y, g.card.w, g.card.h); });
      (st.bayEls || []).forEach((b, k) => { place(b, g.bay.xs[k], g.bay.y, g.bay.w, g.bay.h); b._plane.style.height = g.head + 'px'; });
      (st.cards || []).forEach((c, i) => { if (c._fly) return; const s = this.spot(st, i); place(c, s.x, s.y, s.w, s.h); });
      if (st.goBtn) place(st.goBtn, g.go[0], g.go[1], 110, 110);
    },
    /* a thing drawn at (x, y), size s: a picture prop, or a drawn ball / fish in a colour */
    thing(s, kind, x, y, size, color) {
      if (kind === 'ball') { const g = svg('g', {}, s); svg('circle', { cx: x, cy: y, r: size * 0.42, fill: color, stroke: INK, 'stroke-width': 2.4 }, g); svg('path', { d: 'M' + (x - size * 0.22) + ' ' + (y - size * 0.12) + 'Q' + (x - size * 0.12) + ' ' + (y - size * 0.3) + ' ' + (x + size * 0.06) + ' ' + (y - size * 0.3), stroke: '#fff', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, g); return g; }
      if (kind === 'fish') { const g = svg('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + (size / 40) + ')' }, s); svg('path', { d: 'M-16 0Q-2 -13 12 0Q-2 13 -16 0Z', fill: color, stroke: INK, 'stroke-width': 2.4 }, g); svg('path', { d: 'M11 0L20 -8V8Z', fill: color, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g); svg('circle', { cx: -9, cy: -2, r: 1.8, fill: INK }, g); return g; }
      const im = svg('image', { href: 'assets/props/' + kind + '.png', x: x - size / 2, y: y - size / 2, width: size, height: size }, s); im.setAttribute('preserveAspectRatio', 'xMidYMid meet'); return im;
    },
    /* n spots in a box (x, y, w, h), as big as fit (at most `max`): rows of `per` (0: the number of columns that makes the
       things biggest) */
    spots(n, x, y, w, h, per, max) {
      max = max || 44;
      const sz = k => Math.min(max, w / k, h / Math.ceil(n / k));
      if (!per) { per = 1; for (let k = 2; k <= n; k++) if (sz(k) > sz(per) + 0.5) per = k; }
      per = Math.max(1, Math.min(per, n)); const rows = Math.ceil(n / per), size = sz(per), out = [];
      for (let i = 0; i < n; i++) { const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per; out.push({ x: x + w / 2 + (c - (inRow - 1) / 2) * size, y: y + h / 2 + (r - (rows - 1) / 2) * size, s: size * 0.92 }); }
      return out;
    },
    arrow(s, x1, y1, x2, y2, color, dash) {
      const a = { x: x1, y: y1 }, b = { x: x2, y: y2 };
      svg('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none', 'stroke-dasharray': dash ? '2 9' : '' }, s);
      svg('path', { d: W5U.arrowHead(a, b, 13), fill: color, stroke: color === '#fff' ? INK : 'none' }, s);
    },
    brace(s, x0, x1, y, up, label) {
      const k = up ? -1 : 1, m = (x0 + x1) / 2, h = 10 * k;
      svg('path', { d: 'M' + x0 + ' ' + y + 'Q' + x0 + ' ' + (y + h) + ' ' + (x0 + 12) + ' ' + (y + h) + 'L' + (m - 10) + ' ' + (y + h) + 'Q' + m + ' ' + (y + h) + ' ' + m + ' ' + (y + 2 * h) + 'Q' + m + ' ' + (y + h) + ' ' + (m + 10) + ' ' + (y + h) + 'L' + (x1 - 12) + ' ' + (y + h) + 'Q' + x1 + ' ' + (y + h) + ' ' + x1 + ' ' + y, stroke: '#E0A400', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, s);
      if (label != null) { const t = svg('text', { x: m, y: y + 2 * h + (up ? -4 : 20), 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 900, fill: INK, 'font-family': 'system-ui,sans-serif' }, s); t.textContent = label; }
    },
    qmark(s, x, y) { const g = svg('g', {}, s); svg('circle', { cx: x, cy: y, r: 13, fill: '#FFF3C4', stroke: INK, 'stroke-width': 2.6 }, g); const t = svg('text', { x, y: y + 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 900, fill: INK, 'font-family': 'system-ui,sans-serif' }, g); t.textContent = '?'; return g; },
    /* the picture of a story (viewBox 200 x 150). heard: only the things. Returns the parts the replay moves. */
    draw(s, st0, heard) {
      const p = { moved: [], stay: [], extra: [] };
      if (heard) {
        /* L4: only the things - the story is heard */
        const n = st0.t === 'inc' || st0.t === 'join' ? st0.a + st0.b : st0.a;
        this.spots(n, 4, 4, 192, 142, 0, 46).forEach((q, i) => p.stay.push(st0.t === 'inc' ? this.thing(s, 'duck', q.x, q.y, q.s) : st0.t === 'dec' ? this.thing(s, 'cookie', q.x, q.y, q.s)
          : st0.t === 'join' ? this.thing(s, 'ball', q.x, q.y, q.s, i < st0.a ? '#E8414B' : '#4F7BFF') : this.thing(s, 'fish', q.x, q.y, q.s, i < st0.b ? '#E8414B' : '#FFC93C')));
        return p;
      }
      if (st0.t === 'inc') {
        /* the ducks there, and the ones that came: on the right, sparkling, a green arrow bringing them in */
        this.spots(st0.a, 2, 2, 124, 146, 0, 44).forEach(q => p.stay.push(this.thing(s, 'duck', q.x, q.y, q.s)));
        svg('path', { d: 'M128 8V142', stroke: 'rgba(43,33,24,.25)', 'stroke-width': 2, 'stroke-dasharray': '4 5' }, s);
        const sp = this.spots(st0.b, 132, 2, 66, 120, 0, 40);
        sp.forEach(q => { const g = svg('g', {}, s); this.thing(g, 'duck', q.x, q.y, q.s); const k = q.s / 30; svg('path', { d: 'M' + (q.x + 9 * k) + ' ' + (q.y - 16 * k) + 'l' + 2.4 * k + ' ' + 5 * k + ' ' + 5 * k + ' ' + 2.4 * k + ' ' + -5 * k + ' ' + 2.4 * k + ' ' + -2.4 * k + ' ' + 5 * k + ' ' + -2.4 * k + ' ' + -5 * k + ' ' + -5 * k + ' ' + -2.4 * k + ' ' + 5 * k + ' ' + -2.4 * k + 'z', fill: GOLD, stroke: INK, 'stroke-width': 1 }, g); p.moved.push(g); });
        this.arrow(s, 198, 138, 134, 138, '#3FAE55');
        return p;
      }
      if (st0.t === 'dec') {
        /* the cookies; the eaten ones a grey dashed outline, a grey arrow taking them out */
        const all = this.spots(st0.a, 2, 2, 162, 146, 0, 46);
        all.forEach((q, i) => { if (i < st0.a - st0.b) p.stay.push(this.thing(s, 'cookie', q.x, q.y, q.s)); else p.moved.push(svg('circle', { cx: q.x, cy: q.y, r: q.s * 0.42, fill: 'rgba(154,163,173,.15)', stroke: '#9AA3AD', 'stroke-width': 2.8, 'stroke-dasharray': '4 4' }, s)); });
        const last = all[all.length - 1]; this.arrow(s, last.x + last.s * 0.5, last.y, 198, last.y, '#9AA3AD', true);
        return p;
      }
      if (st0.t === 'join') {
        /* two groups and the brace that puts them together, "?" at its tip */
        this.spots(st0.a, 2, 2, 96, 106, 0, 42).forEach(q => p.stay.push(this.thing(s, 'ball', q.x, q.y, q.s, '#E8414B')));
        this.spots(st0.b, 102, 2, 96, 106, 0, 42).forEach(q => p.stay.push(this.thing(s, 'ball', q.x, q.y, q.s, '#4F7BFF')));
        this.brace(s, 10, 190, 112, false, null); p.extra.push(this.qmark(s, 100, 136));
        return p;
      }
      if (st0.t === 'part') {
        /* all the fish under a brace with their number; the red ones, and over the yellow ones a "?" */
        const red = this.spots(st0.b, 2, 68, 96, 80, 0, 40), yel = this.spots(st0.a - st0.b, 102, 68, 96, 80, 0, 40);
        red.forEach(q => p.stay.push(this.thing(s, 'fish', q.x, q.y, q.s, '#E8414B')));
        yel.forEach(q => p.moved.push(this.thing(s, 'fish', q.x, q.y, q.s, '#FFC93C')));
        this.brace(s, 12, 188, 40, true, st0.a);
        p.extra.push(this.qmark(s, 150, 54));
        return p;
      }
      /* cmp: a apples above, b pears below, one under the other from the left; the extra apples in a dashed box, "?" */
      const size = Math.min(40, 190 / st0.a), x0 = 100 - (st0.a - 1) * size / 2;
      for (let i = 0; i < st0.a; i++) (i < st0.b ? p.stay : p.moved).push(this.thing(s, 'apple', x0 + i * size, 74, size * 0.92));
      for (let i = 0; i < st0.b; i++) p.stay.push(this.thing(s, 'pear', x0 + i * size, 74 + size + 8, size * 0.92));
      const xa = x0 + st0.b * size - size / 2, xb = x0 + (st0.a - 1) * size + size / 2;
      svg('rect', { x: xa, y: 74 - size / 2 - 3, width: xb - xa, height: size + 6, rx: 8, fill: 'none', stroke: '#E0A400', 'stroke-width': 3.5, 'stroke-dasharray': '6 5' }, s);
      p.extra.push(this.qmark(s, (xa + xb) / 2, 74 - size / 2 - 18));
      return p;
    },
    /* a story card (registered later with its drag spec) */
    card(st, i) {
      const s0 = st.q.ss[i], c = W3X.card(st, null, 6, 'card');
      c.style.overflow = 'hidden'; c.style.borderRadius = '18px';
      const s = sv(200, 150); c.appendChild(s); c._parts = this.draw(s, s0, st.q.heard); c._svg = s;
      return c;
    },
    async present(st) {
      const q = st.q, my = st, n = q.ss.length;
      st.where = Array(n).fill(null); st.bays = [[], []]; st.sel = -1;
      st.homes = q.ss.map(() => { const h = W2X.thing(st, 10, 10, 2, ''); Object.assign(h.style, { borderRadius: '18px', border: '4px dashed rgba(43,33,24,.3)', background: 'rgba(255,255,255,.25)', boxSizing: 'border-box', pointerEvents: 'none' }); return h; });
      st.bayEls = ['+', '-'].map((op, k) => {
        const b = W2X.thing(st, 10, 10, 3, ''); Object.assign(b.style, { borderRadius: '28px', background: 'rgba(255,255,255,.55)', boxShadow: '0 0 0 4px ' + INK });
        const s = sv(320, 100); Object.assign(s.style, { position: 'absolute', left: '0', top: '0', width: '100%' }); s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        /* a plane seen from the side, its op on the tail */
        const col = k ? '#2E6FD8' : '#E8414B';
        svg('path', { d: 'M40 64Q40 44 70 42H230L262 18H290L280 50Q300 54 300 64Q300 76 280 78H70Q40 78 40 64Z', fill: '#EEF3FA', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, s);
        svg('path', { d: 'M120 70L180 70L150 96H128Z', fill: '#C9D3E0', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, s);
        [86, 112, 138, 164, 190].forEach(x => svg('circle', { cx: x, cy: 58, r: 6, fill: '#BFE3FF', stroke: INK, 'stroke-width': 2.5 }, s));
        svg('circle', { cx: 268, cy: 34, r: 24, fill: col, stroke: INK, 'stroke-width': 4 }, s);
        const t = svg('text', { x: 268, y: 48, 'text-anchor': 'middle', 'font-size': 46, 'font-weight': 900, fill: '#fff', 'font-family': 'system-ui,sans-serif' }, s); t.textContent = k ? '−' : '+';
        b.appendChild(s); b._plane = s;
        K.reg(st, k ? 'm' : 'p', b, {});
        return b;
      });
      const drops = () => st.bayEls.map((b, k) => ({ id: k ? 'm' : 'p', rect: () => box(b) }));
      st.cards = q.ss.map((_, i) => { const c = this.card(st, i); K.reg(st, 'card' + i, c, { drag: true, drops }); return c; });
      st.opts = q.ss.map((_, i) => i);
      st.goBtn = button(st, 'go', ICON.go);
      this.place(st);
      st.bayEls.forEach((b, k) => K.pop(st, b, 60 * k));
      K.task(st, [[W2X.icon('<rect x="8" y="22" width="56" height="44" rx="8" fill="#FFF" stroke="' + INK + '" stroke-width="5"/><circle cx="26" cy="44" r="7" fill="#FFC93C" stroke="' + INK + '" stroke-width="3"/><circle cx="44" cy="44" r="7" fill="#FFC93C" stroke="' + INK + '" stroke-width="3"/><path d="M68 44H92M82 34L92 44L82 54" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>')], [IC5P], ['q']]);
      if (!q.heard) { st.cards.forEach((c, i) => K.pop(st, c, 70 * i)); K.say(st, '故事送上飞机！'); return; }
      /* L4: the stories one by one, each told in two sentences while its card pops up - the question is open at once (a card
         already told can be moved while the next one is told: no long wait) */
      st.cards.forEach(c => { c.style.visibility = 'hidden'; });
      st.prompt = '故事送上飞机！';
      (async () => {
        for (let i = 0; i < n; i++) {
          if (!Session.alive(my)) return;
          st.cards[i].style.visibility = ''; K.pop(st, st.cards[i]); Sfx.pop();
          const [a, b] = v5tell(q.ss[i]);
          Voice.say(a, { tag: 'prompt' }); await st.scope.guard(Voice.say(b, { tag: 'prompt' }));
          await st.scope.wait(T(160));
        }
      })().catch(() => {});
    },
    /* the selected card glows; at L4 its story is told again */
    select(st, i) {
      st.cards.forEach((c, j) => c.classList.toggle('hi', j === i)); st.sel = i;
      if (i >= 0) { K.hop(st, st.cards[i], 10); Sfx.tap(); if (st.q.heard) { const [a, b] = v5tell(st.q.ss[i]); Voice.say(a, { tag: 'prompt' }); Voice.say(b, { tag: 'prompt' }); } }
    },
    /* card i onto the plane op ('+' / '-') */
    board(st, i, op) {
      const c = st.cards[i], from = st.where[i];
      c.style.transform = '';
      if (from === op) { this.select(st, -1); this.place(st); return; }
      if (from != null) { const b = st.bays[from === '+' ? 0 : 1]; b.splice(b.indexOf(i), 1); }
      st.where[i] = op; st.bays[op === '+' ? 0 : 1].push(i);
      this.select(st, -1); Sfx.place();
      const all = st.cards.map((_, j) => this.spot(st, j));
      st.cards.forEach((e, j) => { const s = all[j], b = box(e); if (j === i) glide(st, e, s.x, s.y, s.w, s.h, 360); else if (Math.abs(b.x - s.x) + Math.abs(b.y - s.y) > 1) glide(st, e, s.x, s.y, s.w, s.h, 260); });
      st.goBtn.classList.toggle('ready', st.where.every(w => w != null));
    },
    onGesture(st, name, p) {
      if (st.picked) return false;
      const id = p.id || '', ci = K.cardIndex(id);
      if (name === 'drop' && ci >= 0 && (p.to === 'p' || p.to === 'm')) { this.board(st, ci, p.to === 'p' ? '+' : '-'); return 'ok'; }
      if (name !== 'tap') return false;
      if (ci >= 0) { this.select(st, st.sel === ci ? -1 : ci); return 'ok'; }
      if (id === 'p' || id === 'm') { if (st.sel < 0) { K.wiggle(st, st.bayEls[id === 'p' ? 0 : 1]); return 'ok'; } this.board(st, st.sel, id === 'p' ? '+' : '-'); return 'ok'; }
      if (id === 'go') {
        if (st.where.some(w => w == null)) { K.wiggle(st, st.goBtn); W5U.say(st, '都送上飞机！'); return 'ok'; }
        st.picked = true; this.select(st, -1); Session.submit(st, st.where.join('')); return 'ok';
      }
      return false;
    },
    next(st, strat) {
      const q = st.q; if (st.picked || !st.cards || !st.goBtn) return null;
      const want = q.answer.split('').map((op, i) => (strat === 'wrong' && i === 0 ? (op === '+' ? '-' : '+') : op));
      const i = st.where.findIndex((w, j) => w !== want[j]);
      if (i < 0) return { g: 'tap', p: { id: 'go' } };
      if (st.sel !== i) return { g: 'tap', p: { id: 'card' + i } };
      return { g: 'tap', p: { id: want[i] === '+' ? 'p' : 'm' } };
    },
    /* tests/shots_w5d.py: the right answer with the real mouse - even cards dragged onto their plane, odd ones tapped */
    pointer(st) {
      const nx = this.next(st, 'right'); if (!nx) return null;
      const c = e => { const b = box(e); return [b.x + b.w / 2, b.y + b.h / 2]; }, id = nx.p.id, ci = K.cardIndex(id);
      if (ci >= 0 && ci % 2 === 0 && st.sel < 0) return { g: 'drag', from: c(st.cards[ci]), to: c(st.bayEls[st.q.answer[ci] === '+' ? 0 : 1]) };
      return { g: 'click', at: c(st.map[id]) };
    },
    bad(st, ans) { const a = String(ans); return st.q.answer.split('').map((op, i) => (a[i] !== op ? i : -1)).filter(i => i >= 0); },
    async feedback(st, ans) {
      const i = this.bad(st, ans)[0], c = st.cards[i];
      if (c) K.wiggle(st, c);
      W5U.say(st, V5FB[st.q.ss[i].t]);
      await st.scope.wait(T(600));
    },
    /* the story of card i played again in its picture: what came comes in, what went goes out (§3.3) */
    async replay(st, i) {
      const c = st.cards[i], p = c._parts, t = st.q.ss[i].t;
      if (t === 'inc') p.moved.forEach((g, k) => st.scope.anim(g, [{ transform: 'translate(70px,-10px)', opacity: 0 }, { transform: 'translate(0,0)', opacity: 1 }], { duration: 520, delay: 90 * k, easing: EASE.glide, fill: 'backwards' }));
      else if (t === 'dec') p.moved.forEach((g, k) => { const cl = g.cloneNode(); cl.setAttribute('fill', '#E2A15B'); cl.setAttribute('stroke', INK); cl.setAttribute('stroke-dasharray', ''); c._svg.appendChild(cl); st.scope.anim(cl, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(60px,0)', opacity: 0 }], { duration: 560, delay: 90 * k, easing: EASE.glide, fill: 'forwards' }); });
      else (p.extra.concat(p.moved)).forEach((g, k) => st.scope.anim(g, [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], { duration: 520, delay: 60 * k }));
      await st.scope.wait(T(480));
    },
    /* the number sentence on the card, at its bottom */
    eqOn(st, i) {
      const c = st.cards[i]; if (!c || c._eq) return; const e = v5eq(st.q.ss[i]);
      const b = el('div', '', c); c._eq = b;
      Object.assign(b.style, { position: 'absolute', left: '0', right: '0', bottom: '0', height: '34%', background: 'rgba(255,248,236,.96)', borderTop: '3px solid ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 ' + Math.round(box(c).h * 0.24) + 'px/1 system-ui,sans-serif', color: INK, pointerEvents: 'none', letterSpacing: '1px' });
      b.textContent = e[0] + ' ' + (e[1] === '+' ? '+' : '−') + ' ' + e[2] + ' = ' + e[3];
      if (c._svg) c._svg.style.height = '66%';                     /* the picture moves up, the sentence under it */
      st.scope.anim(b, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 260, easing: EASE.pop });
    },
    /* 1. his card blue (his line was said), its story again; 2. it flies to the right plane, gold, "拿走，用减号"; 3. its
       number sentence under it, read */
    async explain(st, ans) {
      const my = st, bad = this.bad(st, ans), i = bad[0], s0 = st.q.ss[i];
      this.select(st, -1);
      W5U.blue(st, st.cards[i]);
      await this.replay(st, i); if (!Session.alive(my)) return;
      await st.scope.wait(120); if (!Session.alive(my)) return;
      bad.forEach(j => { st.where[j] = null; [0, 1].forEach(k => { const b = st.bays[k], x = b.indexOf(j); if (x >= 0) b.splice(x, 1); }); });
      bad.forEach(j => { st.where[j] = st.q.answer[j]; st.bays[st.q.answer[j] === '+' ? 0 : 1].push(j); });
      $$('.ringo', Stage.el).forEach(r => { r.style.visibility = 'hidden'; });
      /* why, said while the card flies (the gold ring when it has landed) */
      const why = W5U.sum(st, V5WHY[s0.t]);
      await Promise.all(st.cards.map((e, j) => { const s = this.spot(st, j); return glide(st, e, s.x, s.y, s.w, s.h, 420); }));
      if (!Session.alive(my)) return;
      W5U.gold(st, bad.map(j => st.cards[j]));
      await why; if (!Session.alive(my)) return;
      await st.scope.wait(150); if (!Session.alive(my)) return;
      this.eqOn(st, i);
      await W5U.sum(st, v5read(v5eq(s0)));
    },
    rightEls(st, ans) { return this.bad(st, ans).map(i => st.cards[i]); },
    /* right: every card its number sentence, one read; the planes take off */
    async reveal(st) {
      const my = st, q = st.q;
      st.cards.forEach((_, i) => this.eqOn(st, i)); Sfx.reveal();
      W5U.gold(st, st.bayEls);
      this.cheerAll(st);
      st.summary = v5read(v5eq(q.ss[0])); W5U.sum(st, st.summary);
      await st.scope.wait(T(700)); if (!Session.alive(my)) return;
      Sfx.whoosh(0.3);
      st.bayEls.forEach((b, k) => st.scope.anim(b._plane, [{ transform: 'translate(0,0)' }, { transform: 'translate(40px,-30px) rotate(-8deg)' }], { duration: 700, easing: EASE.glide, fill: 'forwards' }));
      await st.scope.wait(T(700));
    },
    workEls(st) { return st.cards || []; },
    snap(st) { return { where: (st.where || []).slice() }; },
    lines() {
      const out = [this.intro, '故事送上飞机！', '都送上飞机！'].concat(this.praise, Object.values(V5FB), Object.values(V5WHY));
      for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) { if (a + b <= 10) out.push(v5read([a, '+', b, a + b])); if (a - b >= 1) out.push(v5read([a, '-', b, a - b])); }
      /* the heard stories (L4, numbers within 10) */
      for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
        if (a + b <= 10 && a + b >= 3) v5tell({ t: 'inc', a, b }).concat(v5tell({ t: 'join', a, b })).forEach(x => out.push(x));
        if (a - b >= 1 && a >= 3) v5tell({ t: 'dec', a, b }).concat(v5tell({ t: 'part', a, b })).forEach(x => out.push(x));
      }
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- V6 切！ 切成一样的 (F12 Little Handyman, F10 Special Twins):
     an iron plate of little squares; the laser follows the finger along the grid lines only - from the plate's edge to its
     edge (press at an edge point and slide; the cut is made when the laser reaches an edge again). A cut can end on a cut
     made before (four pieces). The pieces part a little. 复原 puts the plate back, 好了 hands it in.
       L1 2 x 4, 2 x 5, 2 x 6 (and standing): the middle, or a step through the middle
       L2 3 x 4, 2 x 6, 4 x 4: many cuts are right · L3 T, U, 十, H: the line of symmetry, or a turned step
       L4 the cuts that must turn: 2 x 3 into two L, an L of 8, a step of 8, a T of 8 lying down
       L5 four the same (2 x 4, 3 x 4, 4 x 4, 2 x 6 ...): several cuts, a cut may start or end on an earlier one
     Right: the pieces are the same - one turned or flipped onto another covers it exactly (W5U.poly.same). Every right cut is
     right. A random cut (then 好了) is right at most 1 time in 5 (2 x 3: 3 of 15; 2 x 2 is left out: 2 of 6); L5 (cut at random until
     there are four pieces) by simulation at most 0.03 (CUT5CH). Wrong: one piece is lifted, turned / flipped onto the other, what
     is left over (or sticks out) gets a blue dashed outline; the gold laser cuts the right way; one half turns onto the
     other and covers it "转过来，一样". */
  const CUTS = {
    1: ['##,##,##,##', '##,##,##,##,##', '##,##,##,##,##,##'],
    2: ['###,###,###,###', '##,##,##,##,##,##', '####,####,####,####'],
    3: ['####,.##.,.##.', '#..#,#..#,####', '.##.,####,####,.##.', '#..#,####,#..#', '######,..##..,..##..'],
    4: ['##,##,##', '####,##..,##..', '.###,####,#...', '##..,####,##..'],
    5: ['##,##,##,##', '###,###,###,###', '####,####,####,####', '##,##,##,##,##,##'],
  };
  /* L5: a random play (cuts at random until there are four pieces or more) is right this often at most (simulated offline
     with the same cut rules, 1500 plays each: 2 x 4 0.031, 3 x 4 0.002, 4 x 4 0.000, 2 x 6 0.002) */
  const CUT5CH = 0.04;
  const METAL = [['#C8D3E0', '#9FB0C4'], ['#F2C14E', '#D49A1E'], ['#E86A5B', '#B8473A']];
  const TINT = ['#FFC93C', '#7FC8FF', '#FF8F80', '#8FE09A', '#C9A8FF', '#FFB36B'];
  /* a shape: rows of '#' / '.' turned r quarter turns and flipped f */
  const cutShape = (rows, r, f) => {
    let cells = []; rows.split(',').forEach((row, y) => row.split('').forEach((ch, x) => { if (ch === '#') cells.push([x, y]); }));
    for (let k = 0; k < r; k++) cells = cells.map(([x, y]) => [-y, x]);
    if (f) cells = cells.map(([x, y]) => [-x, y]);
    return W5U.poly.norm(cells);
  };
  const CK = c => c[0] + ':' + c[1];
  const EK = (a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) ? CK(a) + '|' + CK(b) : CK(b) + '|' + CK(a);
  /* the geometry of a shape: its vertices, which edges are inside it, which vertices are on its edge */
  function cutGeo(cells) {
    const S = new Set(cells.map(CK)), has = (x, y) => S.has(x + ':' + y);
    const cols = Math.max(...cells.map(c => c[0])) + 1, rows = Math.max(...cells.map(c => c[1])) + 1;
    const V = []; const VS = new Set();
    cells.forEach(([x, y]) => [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => { const v = [x + dx, y + dy], k = CK(v); if (!VS.has(k)) { VS.add(k); V.push(v); } }));
    V.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    /* the edge between two neighbouring vertices: inside when both cells beside it are in the shape */
    const inner = (a, b) => { if (a[0] === b[0]) { const y = Math.min(a[1], b[1]); return has(a[0] - 1, y) && has(a[0], y); } const x = Math.min(a[0], b[0]); return has(x, a[1] - 1) && has(x, a[1]); };
    const edge = v => !(has(v[0] - 1, v[1] - 1) && has(v[0], v[1] - 1) && has(v[0] - 1, v[1]) && has(v[0], v[1]));
    return { cells, S, cols, rows, V, VS, inner, edge, n: cells.length };
  }
  /* the pieces: the cells joined through edges that are not cut */
  function cutPieces(g, cut) {
    const seen = new Set(), out = [];
    g.cells.forEach(c0 => {
      if (seen.has(CK(c0))) return;
      const comp = [c0], st = [c0]; seen.add(CK(c0));
      while (st.length) {
        const [x, y] = st.pop();
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const n = [x + dx, y + dy]; if (!g.S.has(CK(n)) || seen.has(CK(n))) return;
          const e = dx ? EK([Math.max(x, n[0]), y], [Math.max(x, n[0]), y + 1]) : EK([x, Math.max(y, n[1])], [x + 1, Math.max(y, n[1])]);
          if (cut.has(e)) return;
          seen.add(CK(n)); comp.push(n); st.push(n);
        });
      }
      out.push(comp);
    });
    return out;
  }
  const allSame = P => P.length > 1 && P.every(p => W5U.poly.same(P[0], p));
  /* every cut from an edge point to an edge point along inside edges (none touching the edge on the way); cached */
  const CUTC = {};
  function cutAll(g) {
    const key = g.cells.map(CK).join(','); if (CUTC[key]) return CUTC[key];
    const res = [], nb = v => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [v[0] + dx, v[1] + dy]).filter(w => g.VS.has(CK(w)) && g.inner(v, w));
    g.V.filter(g.edge).forEach(s => { const dfs = path => nb(path[path.length - 1]).forEach(w => { if (path.some(p => p[0] === w[0] && p[1] === w[1])) return; const np = path.concat([w]); if (g.edge(w)) res.push(np); else dfs(np); }); dfs([s]); });
    const seen = new Set(), out = [];
    res.forEach(p => { const k = p.map(CK).join('>'), kr = p.slice().reverse().map(CK).join('>'); if (seen.has(kr)) return; seen.add(k); out.push(p); });
    const right = [], wrong = [];
    out.forEach(p => { const P = cutPieces(g, new Set(cutEdges(p))); (P.length === 2 && allSame(P) ? right : wrong).push(p); });
    return (CUTC[key] = { all: out, right, wrong });
  }
  const cutEdges = p => p.slice(1).map((v, i) => EK(p[i], v));
  /* four the same (L5): straight cuts - three across the long way when a side is a multiple of 4, else the middle both ways */
  function cut4(g) {
    const C = g.cols, R = g.rows, line = (a, b) => { const out = [a.slice()]; let c = a.slice(); while (c[0] !== b[0] || c[1] !== b[1]) { c = [c[0] + Math.sign(b[0] - c[0]), c[1] + Math.sign(b[1] - c[1])]; out.push(c); } return out; };
    if (C % 4 === 0) return [1, 2, 3].map(k => line([k * C / 4, 0], [k * C / 4, R]));
    if (R % 4 === 0) return [1, 2, 3].map(k => line([0, k * R / 4], [C, k * R / 4]));
    return [line([0, R / 2], [C, R / 2]), line([C / 2, 0], [C / 2, R / 2]), line([C / 2, R / 2], [C / 2, R])];
  }
  W5R.V6 = {
    kind0: 'cut5', verb: '切！', intro: '钢铁侠切铁板！', praise: ['切得一样大！'], boost: -1,
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, name = bagPick(G, 'v6s' + d, CUTS[d]);
      const r = rng.int(0, 3), f = rng.int(0, 1), cells = cutShape(name, r, f), g = cutGeo(cells), m = rng.int(0, METAL.length - 1);
      const n = d === 5 ? 4 : 2;
      let sol, bad, chance;
      if (n === 2) {
        const A = cutAll(g);
        /* the right cut shown in the explanation: the shortest (the middle when there is one); the wrong one the tests make:
           a short one cutting off a piece of another size */
        sol = [A.right.slice().sort((a, b) => a.length - b.length)[0]];
        bad = [A.wrong.slice().sort((a, b) => a.length - b.length)[rng.int(0, Math.min(2, A.wrong.length - 1))]];
        chance = A.right.length / A.all.length;
      } else {
        sol = cut4(g);
        /* wrong: a corner cell cut off first (a piece of one square cannot be a quarter), then the right cuts */
        const corner = g.V.find(v => g.VS.has(CK([v[0] + 1, v[1]])) && g.VS.has(CK([v[0], v[1] + 1])) && g.S.has(CK(v)) && !g.edge([v[0] + 1, v[1] + 1]));
        bad = [[[corner[0] + 1, corner[1]], [corner[0] + 1, corner[1] + 1], [corner[0], corner[1] + 1]]].concat(sol);
        chance = CUT5CH;
      }
      return { k: [d, cells.map(CK).join(','), m], d, cells, n, sol, bad, chance, metal: m, answer: 'same' };
    },
    audit(q) { return [{ build: true, chance: q.chance }]; },
    evaluate(st, ans) { const P = cutPieces(cutGeo(st.q.cells), new Set(String(ans).split(',').filter(Boolean))); return P.length === st.q.n && allSame(P); },
    /* the plate: cells of C (88-96) with a margin, in the room between the friends and the buttons */
    geo(q) {
      const L = K.L(), g = cutGeo(q.cells), M = 36;
      const room = L ? { x: 176, y: 96, w: 690, h: 604 } : { x: 16, y: 196, w: 672, h: 674 };
      const C = Math.floor(Math.max(88, Math.min(96, (room.w - 2 * M) / g.cols, (room.h - 2 * M) / g.rows)));
      const W = g.cols * C + 2 * M, H = g.rows * C + 2 * M;
      return { C, M, W, H, x: Math.round(room.x + (room.w - W) / 2), y: Math.round(room.y + (room.h - H) / 2), undo: L ? [884, 236] : [196, 894], done: L ? [884, 380] : [408, 894] };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const p = this.geo(st.q);
      if (st.plate) place(st.plate, p.x, p.y, p.W, p.H);
      if (st.undoBtn) place(st.undoBtn, p.undo[0], p.undo[1], 110, 110);
      if (st.doneBtn) place(st.doneBtn, p.done[0], p.done[1], 110, 110);
    },
    /* a vertex's point on the stage */
    pt(st, v) { const p = this.geo(st.q); return { x: p.x + p.M + v[0] * p.C, y: p.y + p.M + v[1] * p.C }; },
    anchor(st, v) { return st.g.edge(v) || st.cutV.has(CK(v)); },
    /* the plate drawn again: the pieces (each its colour once cut), their outlines, the grid lines to cut along, the cuts,
       the laser's line */
    draw(st) {
      const q = st.q, p = this.geo(q), g = st.g, C = p.C, M = p.M, s = st.svgEl;
      s.setAttribute('viewBox', '0 0 ' + p.W + ' ' + p.H); while (s.firstChild) s.removeChild(s.firstChild);
      const P = st.pieces, one = P.length < 2, apart = st.apart;
      const ctr = cs => [cs.reduce((t, c) => t + c[0] + 0.5, 0) / cs.length, cs.reduce((t, c) => t + c[1] + 0.5, 0) / cs.length];
      const all = ctr(g.cells);
      st.pieceEls = P.map((cs, i) => {
        const pc = ctr(cs), dx = apart ? Math.sign(Math.round((pc[0] - all[0]) * 4)) * 9 : 0, dy = apart ? Math.sign(Math.round((pc[1] - all[1]) * 4)) * 9 : 0;
        const gr = svg('g', { transform: 'translate(' + dx + ' ' + dy + ')' }, s), set = new Set(cs.map(CK));
        const fill = one ? METAL[q.metal][0] : TINT[i % TINT.length];
        cs.forEach(([x, y]) => svg('rect', { x: M + x * C, y: M + y * C, width: C + 0.6, height: C + 0.6, fill }, gr));
        /* rivets in the corners of the plate's squares; grid lines between two squares of the same piece */
        cs.forEach(([x, y]) => { if (set.has((x + 1) + ':' + y)) svg('path', { d: 'M' + (M + (x + 1) * C) + ' ' + (M + y * C + 6) + 'V' + (M + (y + 1) * C - 6), stroke: 'rgba(43,33,24,.35)', 'stroke-width': 3, 'stroke-dasharray': '7 7' }, gr); if (set.has(x + ':' + (y + 1))) svg('path', { d: 'M' + (M + x * C + 6) + ' ' + (M + (y + 1) * C) + 'H' + (M + (x + 1) * C - 6), stroke: 'rgba(43,33,24,.35)', 'stroke-width': 3, 'stroke-dasharray': '7 7' }, gr); });
        let d = '';
        cs.forEach(([x, y]) => { const X = M + x * C, Y = M + y * C; if (!set.has(x + ':' + (y - 1))) d += 'M' + X + ' ' + Y + 'H' + (X + C); if (!set.has(x + ':' + (y + 1))) d += 'M' + X + ' ' + (Y + C) + 'H' + (X + C); if (!set.has((x - 1) + ':' + y)) d += 'M' + X + ' ' + Y + 'V' + (Y + C); if (!set.has((x + 1) + ':' + y)) d += 'M' + (X + C) + ' ' + Y + 'V' + (Y + C); });
        svg('path', { d, stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'square', fill: 'none' }, gr);
        gr._cells = cs; gr._off = [dx, dy];
        return gr;
      });
      /* the cuts made (dark grooves while the pieces still touch) */
      if (!apart) st.strokes.forEach(path => svg('path', { d: path.map((v, i) => (i ? 'L' : 'M') + (M + v[0] * C) + ' ' + (M + v[1] * C)).join(''), stroke: INK, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s));
      /* the laser: a red line along the finger's path, a glowing point at its end */
      if (st.stroke && st.stroke.path.length) {
        const path = st.stroke.path, d = path.map((v, i) => (i ? 'L' : 'M') + (M + v[0] * C) + ' ' + (M + v[1] * C)).join('');
        if (path.length > 1) { svg('path', { d, stroke: 'rgba(255,80,60,.35)', 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s); svg('path', { d, stroke: '#FF3B2F', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s); }
        const e = path[path.length - 1]; svg('circle', { cx: M + e[0] * C, cy: M + e[1] * C, r: 13, fill: '#FFE36B', stroke: '#FF3B2F', 'stroke-width': 5 }, s);
      }
    },
    async present(st) {
      const q = st.q, p = this.geo(q);
      st.g = cutGeo(q.cells); st.cut = new Set(); st.cutV = new Set(); st.strokes = []; st.stroke = null; st.apart = false;
      st.pieces = cutPieces(st.g, st.cut);
      st.plate = W2X.thing(st, p.W, p.H, 5, ''); st.plate.style.background = 'transparent';
      st.svgEl = sv(p.W, p.H); st.plate.appendChild(st.svgEl);
      const self = this;
      K.reg(st, 'plate', st.plate, { slide: st.g.V.map((v, i) => ({ id: 'v' + i, rect: () => { const c = self.pt(st, v), r = Math.round(self.geo(st.q).C * 0.29); return { x: c.x - r, y: c.y - r, w: 2 * r, h: 2 * r }; } })) });
      st.undoBtn = button(st, 'undo', ICON.undo); st.doneBtn = button(st, 'done', ICON.ok);
      this.draw(st); this.place(st);
      K.pop(st, st.plate);
      K.task(st, [[W2X.icon('<rect x="10" y="22" width="80" height="56" fill="' + METAL[q.metal][0] + '" stroke="' + INK + '" stroke-width="5"/><path d="M50 14V86" stroke="#FF3B2F" stroke-width="7" stroke-dasharray="9 6"/>')], [W2X.icon('<rect x="6" y="26" width="40" height="48" fill="#FFC93C" stroke="' + INK + '" stroke-width="5"/><rect x="54" y="26" width="40" height="48" fill="#7FC8FF" stroke="' + INK + '" stroke-width="5"/><path d="M44 50H56" stroke="' + INK + '" stroke-width="5"/><path d="M47 44L53 50L47 56" fill="none" stroke="' + INK + '" stroke-width="3"/>')]]);
      K.say(st, q.n === 4 ? '切成一样的四块！' : '切成一样的两块！');
    },
    /* the finger reached vertex v: the laser goes on along the grid line (or back), a cut is made at an edge */
    pass(st, i) {
      const v = st.g.V[i]; if (!v) return false;
      const s = st.stroke;
      if (!s) { if (this.anchor(st, v)) { st.stroke = { path: [v] }; this.draw(st); } return 'ok'; }
      if (s.done) return 'ok';
      const path = s.path, last = path[path.length - 1], prev = path[path.length - 2], same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
      if (same(v, last)) return 'ok';
      if (same(v, prev)) { path.pop(); this.draw(st); return 'ok'; }
      /* a straight run along one grid line (a fast finger skips a point): every step an uncut edge inside the plate */
      const dx = Math.sign(v[0] - last[0]), dy = Math.sign(v[1] - last[1]);
      const steps = []; let ok = !!(dx === 0 || dy === 0), c = last;
      while (ok && !same(c, v)) { const w = [c[0] + dx, c[1] + dy]; if (!st.g.VS.has(CK(w)) || !st.g.inner(c, w) || st.cut.has(EK(c, w)) || path.some(u => same(u, w))) { ok = false; break; } steps.push(w); c = w; if (this.anchor(st, w)) break; }
      if (!ok || !steps.length) { if (path.length === 1 && this.anchor(st, v)) { s.path = [v]; this.draw(st); } return 'ok'; }
      steps.forEach(w => path.push(w));
      if (this.anchor(st, path[path.length - 1])) { s.done = true; this.cutNow(st, path); }
      this.draw(st); Sfx.tap();
      return 'ok';
    },
    /* the laser reached an edge: the cut is made, the pieces counted; enough pieces - they part a little */
    cutNow(st, path) {
      cutEdges(path).forEach(e => st.cut.add(e)); path.forEach(v => st.cutV.add(CK(v)));
      st.strokes.push(path.slice()); st.pieces = cutPieces(st.g, st.cut);
      st.apart = st.pieces.length >= st.q.n;
      Sfx.zap(); const e = this.pt(st, path[path.length - 1]); Fx.burst(e.x, e.y, { n: 8, dist: 36 });
      st.doneBtn.classList.toggle('ready', st.apart);
    },
    reset(st) { st.cut = new Set(); st.cutV = new Set(); st.strokes = []; st.stroke = null; st.apart = false; st.pieces = cutPieces(st.g, st.cut); st.doneBtn.classList.remove('ready'); Sfx.back(); this.draw(st); },
    onGesture(st, name, p) {
      if (st.picked) return false;
      if (name === 'pass' && p.id === 'plate') return this.pass(st, Number(String(p.at).slice(1)));
      if (name === 'pick' && p.id === 'plate') {
        const s = st.stroke; st.stroke = null;
        if (s && !s.done && s.path.length > 1 && !st.toldEdge) { st.toldEdge = true; Voice.say('从边切到边！', { tag: 'prompt' }); }
        this.draw(st); return 'ok';
      }
      if (name !== 'tap') return false;
      if (p.id === 'undo') { this.reset(st); return 'ok'; }
      if (p.id === 'done') {
        if (st.pieces.length < st.q.n) { K.wiggle(st, st.doneBtn); Voice.say(st.q.n === 4 ? '切成一样的四块！' : '切成一样的两块！', { tag: 'prompt' }); return 'ok'; }
        st.picked = true; Session.submit(st, Array.from(st.cut).sort().join(',')); return 'ok';
      }
      return false;
    },
    /* the tests' steps: the cuts of the plan, one vertex at a time (a cut ends at an edge: the finger is lifted), then 好了 */
    next(st, strat) {
      if (st.picked || !st.plate) return null;
      if (st.stroke && st.stroke.done) return { g: 'pick', p: { id: 'plate', at: 'v0' } };
      const plan = strat === 'wrong' ? st.q.bad : st.q.sol, vid = v => 'v' + st.g.V.findIndex(w => w[0] === v[0] && w[1] === v[1]);
      const step = v => { const c = this.pt(st, v); return { g: 'pass', p: { id: 'plate', at: vid(v) }, x: c.x, y: c.y }; };
      if (st.stroke) {
        const path = st.stroke.path, last = path[path.length - 1];
        for (const s of plan) for (let i = 0; i + 1 < s.length; i++) if (s[i][0] === last[0] && s[i][1] === last[1] && !st.cut.has(EK(s[i], s[i + 1]))) return step(s[i + 1]);
        return { g: 'pick', p: { id: 'plate', at: 'v0' } };
      }
      for (const s of plan) for (let i = 0; i + 1 < s.length; i++) if (!st.cut.has(EK(s[i], s[i + 1]))) return step(s[i]);
      return { g: 'tap', p: { id: 'done' } };
    },
    /* tests/shots_w5d.py: the same plan with the real mouse - each cut one press-slide-lift */
    pointer(st) {
      const nx = this.next(st, 'right'); if (!nx) return null;
      if (nx.g === 'tap') { const b = box(st.map[nx.p.id]); return { g: 'click', at: [b.x + b.w / 2, b.y + b.h / 2] }; }
      if (nx.g === 'pick') return null;
      const plan = st.q.sol, v0 = st.g.V[Number(nx.p.at.slice(1))];
      for (const s of plan) { const i = s.findIndex(v => v[0] === v0[0] && v[1] === v0[1]); if (i >= 0 && i + 1 < s.length && !st.cut.has(EK(s[i], s[i + 1]))) { const run = [s[i]]; for (let k = i + 1; k < s.length; k++) { run.push(s[k]); if (this.anchor(st, s[k])) break; } return { g: 'path', pts: run.map(v => { const c = this.pt(st, v); return [c.x, c.y]; }) }; } }
      return null;
    },
    sameStep(st, exp, name, p) { return !!(p && exp.p && p.id === exp.p.id); },
    /* the pieces of an answer, the two shown in the explanation (the biggest and another), and why */
    look(st, ans) {
      const P = cutPieces(st.g, new Set(String(ans).split(',').filter(Boolean))), n = st.q.n;
      const why = P.length !== n ? (P.length <= 6 ? '切成了' + CN[P.length] + '块' : '切成好多块') : P.some(p => p.length !== P[0].length) ? '一块大一块小' : '形状不一样';
      return { P, why };
    },
    async feedback(st, ans) { W5U.say(st, this.look(st, ans).why); K.wiggle(st, st.plate); await st.scope.wait(T(600)); },
    /* the best way to lay piece A on piece B (a turn / flip and a shift): the SVG matrix and the cells where it lands */
    lay(st, A, B) {
      const p = this.geo(st.q), C = p.C, M = p.M, Bs = new Set(B.map(CK)); let best = null;
      const mats = [[1, 0, 0, 1], [0, -1, 1, 0], [-1, 0, 0, -1], [0, 1, -1, 0], [-1, 0, 0, 1], [0, 1, 1, 0], [1, 0, 0, -1], [0, -1, -1, 0]];
      mats.forEach(m => {
        /* the centre of a cell (x + .5, y + .5) goes to m * centre + t; t so that the shape lands on B's cells */
        const T0 = A.map(([x, y]) => [m[0] * (x + 0.5) + m[1] * (y + 0.5), m[2] * (x + 0.5) + m[3] * (y + 0.5)]);
        B.forEach(b => { const t = [b[0] + 0.5 - T0[0][0], b[1] + 0.5 - T0[0][1]]; const land = T0.map(c => [Math.round(c[0] + t[0] - 0.5), Math.round(c[1] + t[1] - 0.5)]), hit = land.filter(c => Bs.has(CK(c))).length; if (!best || hit > best.hit) best = { m, t, land, hit }; });
      });
      /* in the SVG's units: X' = m (X - O) + O + C t, O the grid's corner (M, M) */
      const m = best.m, e = M - (m[0] * M + m[1] * M) + C * best.t[0], f = M - (m[2] * M + m[3] * M) + C * best.t[1];
      return Object.assign(best, { matrix: [m[0], m[2], m[1], m[3], e, f] });
    },
    /* a copy of a piece lifted and laid on another (the explanation, the reveal) */
    async ghost(st, A, B, gr) {
      const L = this.lay(st, A, B), p = this.geo(st.q), C = p.C, M = p.M, s = st.svgEl;
      const g = svg('g', {}, s), off = (gr && gr._off) || [0, 0], offB = ((st.pieceEls || []).find(x => x._cells === B) || { _off: [0, 0] })._off;
      A.forEach(([x, y]) => svg('rect', { x: M + x * C + 4, y: M + y * C + 4, width: C - 8, height: C - 8, rx: 10, fill: 'rgba(255,255,255,.55)', stroke: INK, 'stroke-width': 4 }, g));
      const [a, b, c, d, e, f] = L.matrix;
      await st.scope.anim(g, [{ transform: 'translate(' + off[0] + 'px,' + off[1] + 'px)' }, { transform: 'translate(' + (off[0] + offB[0]) / 2 + 'px,' + ((off[1] + offB[1]) / 2 - 30) + 'px)', offset: 0.35 }, { transform: 'matrix(' + [a, b, c, d, e + offB[0], f + offB[1]].join(',') + ')' }], { duration: fast() ? 10 : 520, easing: EASE.glide, fill: 'forwards' });
      return { g, L, offB };
    },
    /* 1. a piece lifted onto another (turned / flipped): what is left over or sticks out, blue dashed; 2. the gold laser
       cuts the right way ("照这样切"); 3. one half turned onto the other covers it, the plate gold ("转过来，一样") */
    async explain(st, ans) {
      const my = st, q = st.q, p = this.geo(q), C = p.C, M = p.M, { P } = this.look(st, ans);
      /* his pieces, apart */
      st.cut = new Set(String(ans).split(',').filter(Boolean)); st.pieces = P; st.apart = true; st.stroke = null; this.draw(st);
      if (P.length !== q.n) {
        /* too many pieces: each one counted */
        (st.xb = st.xb || []).push(...st.pieceEls); W5U.ring(st, st.pieceEls, BLUE, 6);
        for (let i = 0; i < st.pieceEls.length; i++) { if (!Session.alive(my)) return; const r = W5U.rect(st.pieceEls[i]); W3X.badgeAt(st, r.x + r.w / 2, r.y + r.h / 2, i + 1, 46); Sfx.count(i + 1); await st.scope.wait(T(200)); }
      } else {
        /* the smallest piece (or one of another shape) lifted onto the biggest: what is left over / sticks out */
        const big = P.slice().sort((a, b) => b.length - a.length)[0], small = P.slice().sort((a, b) => a.length - b.length)[0];
        const B = big, A = small !== big ? small : (P.find(x => x !== big && !W5U.poly.same(x, big)) || P.find(x => x !== big));
        const gh = await this.ghost(st, A, B, st.pieceEls[P.indexOf(A)]); if (!Session.alive(my)) return;
        const land = new Set(gh.L.land.map(CK)), Bs = new Set(B.map(CK));
        const odd = B.filter(c => !land.has(CK(c))).concat(gh.L.land.filter(c => !Bs.has(CK(c))));
        const marks = odd.map(([x, y]) => svg('rect', { x: M + x * C + 8 + gh.offB[0], y: M + y * C + 8 + gh.offB[1], width: C - 16, height: C - 16, rx: 12, fill: 'rgba(79,179,255,.18)', stroke: BLUE, 'stroke-width': 6, 'stroke-dasharray': '12 8' }, st.svgEl));
        const mk = marks.length ? marks : [gh.g]; (st.xb = st.xb || []).push(...mk); W5U.ring(st, mk, BLUE, 4);
      }
      await st.scope.wait(450); if (!Session.alive(my)) return;
      /* the right cut: the plate whole again, the gold laser along the plan, the pieces part */
      $$('.ringo, .badge', Stage.el).forEach(r => { r.style.visibility = 'hidden'; });
      st.cut = new Set(); st.strokes = []; st.apart = false; st.pieces = cutPieces(st.g, st.cut); this.draw(st);
      const gold = svg('path', { d: q.sol.map(s => s.map((v, i) => (i ? 'L' : 'M') + (M + v[0] * C) + ' ' + (M + v[1] * C)).join('')).join(''), stroke: GOLD, 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, st.svgEl);
      const len = q.sol.reduce((t, s) => t + (s.length - 1) * C, 0);
      gold.setAttribute('stroke-dasharray', len + ' ' + len); st.scope.anim(gold, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: fast() ? 10 : 650, fill: 'forwards' });
      Sfx.zap(); W5U.dot(st, this.pt(st, q.sol[0][0]).x, this.pt(st, q.sol[0][0]).y, 22, GOLD);
      W5U.note(st, '照这样切');
      await st.scope.wait(T(600)); if (!Session.alive(my)) return;
      q.sol.forEach(s => cutEdges(s).forEach(e => st.cut.add(e))); st.strokes = q.sol.slice(); st.pieces = cutPieces(st.g, st.cut); st.apart = true; this.draw(st);
      await st.scope.wait(150); if (!Session.alive(my)) return;
      $$('.ringo', Stage.el).forEach(r => { r.style.visibility = 'hidden'; });
      const R = st.pieces;
      await this.ghost(st, R[0], R[1], st.pieceEls[0]); if (!Session.alive(my)) return;
      W5U.gold(st, st.plate, 4);
      await W5U.sum(st, '转过来，一样');
    },
    rightEls(st) { return [st.plate]; },
    /* right: one piece turned onto another covers it */
    async reveal(st) {
      const my = st, P = st.pieces;
      Sfx.reveal();
      if (P.length > 1) await this.ghost(st, P[0], P[1], st.pieceEls[0]);
      if (!Session.alive(my)) return;
      W5U.gold(st, st.plate, 4); this.cheerAll(st);
      st.summary = st.q.n === 4 ? '四块一样大！' : '两块一样大！'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.plate ? [st.plate] : []; },
    snap(st) { return { cuts: st.cut ? st.cut.size : 0, pieces: st.pieces ? st.pieces.length : 0 }; },
    lines() {
      const out = [this.intro, '切成一样的两块！', '切成一样的四块！', '从边切到边！', '一块大一块小', '形状不一样', '切成好多块', '照这样切', '转过来，一样', '两块一样大！', '四块一样大！'].concat(this.praise);
      for (let k = 3; k <= 6; k++) out.push('切成了' + CN[k] + '块');
      return uniq(out);
    },
  };
  /* ---------------------------------------------------------------- V7 转！ 积木转转 (F1 Turning Cubes): Black Panther's floor
     tiles. A pattern card, and a frame of blocks whose top face is half yellow, half blue along a diagonal (from L4 also all
     yellow / all blue). Tap a block: it turns a quarter (L4-L5: it goes on to the next of its six faces). 好了 hands it in.
       L1 2 x 2, the card shows where the blocks meet; two blocks are right already · L2 2 x 2, all four to turn, lines shown
       L3 2 x 2, no lines: a big diamond, a bow, a pinwheel, stripes ... (where do the blocks meet?)
       L4 2 x 2 with whole-colour faces, no lines · L5 3 x 3, no lines, mixed (four or five blocks to turn)
     Faces: 0-3 the yellow half at the top-left, top-right, bottom-right, bottom-left corner (a quarter turn: +1); 4 all
     yellow, 5 all blue. A random play is right (1/4)^2 = 1/16 at most (L1), far less above. Wrong: the card gets its lines,
     each block that differs ringed blue with its place on the card lit "这块还要转"; it turns a quarter at a time until it
     matches, gold "这样就对上了". (The design's "这块转错了" says 错 - the iron rule: "这块还要转".) */
  const V7Y = '#FFC93C', V7B = '#3A6FE0';
  const V7FIG3 = ['2310', '0132', '1203', '3021', '1023', '3201', '0000', '1111', '2222', '3333', '2301', '0123', '3210', '1032', '0303', '1212', '2121', '3030'];
  const V7FIG4 = ['2344', '4423', '2355', '5523', '4501', '1045', '4512', '3045', '0154', '5401', '2453', '3524', '4140', '5253', '0414', '2535'];
  /* the face drawn in a 100 x 100 square */
  const v7face = (s, st0, x, y, k, e) => {
    k = k || 1; e = e || 0;                  /* e: a hair bigger, so the pattern card shows no seam where the blocks meet */
    svg('rect', { x: x - e, y: y - e, width: 100 * k + 2 * e, height: 100 * k + 2 * e, fill: st0 === 4 ? V7Y : V7B }, s);
    const P = [[[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[1, 0], [1, 1], [0, 1]], [[0, 0], [1, 1], [0, 1]]][st0];
    if (P) svg('path', { d: 'M' + P.map(([a, b]) => (x + a * 100 * k + (a ? e : -e)) + ' ' + (y + b * 100 * k + (b ? e : -e))).join('L') + 'Z', fill: V7Y }, s);
  };
  W5R.V7 = {
    kind0: 'blocks5', verb: '转！', intro: '黑豹的地砖！', praise: ['图案对上啦！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, N = d === 5 ? 3 : 2, K6 = d >= 4 ? 6 : 4;
      let tgt;
      if (d <= 2) { do { tgt = Array.from({ length: 4 }, () => rng.int(0, 3)); } while (new Set(tgt).size < 2); }
      else if (d === 3) tgt = bagPick(G, 'v7f3', V7FIG3).split('').map(Number);
      else if (d === 4) tgt = bagPick(G, 'v7f4', V7FIG4).split('').map(Number);
      else {
        /* 3 x 3: turned the same way four times round the middle (a pinwheel, a diamond, a frame) or mirrored */
        const rot = (s, n) => (s >= 4 ? s : (s + n) % 4), mir = s => (s >= 4 ? s : [1, 0, 3, 2][s]), f = () => rng.int(0, 5), w = () => rng.int(4, 5);
        if (rng.chance(0.6)) { const c = f(), e = f(), m = rng.chance(0.5) ? w() : f(); tgt = [c, e, rot(c, 1), rot(e, 3), m, rot(e, 1), rot(c, 3), rot(e, 2), rot(c, 2)]; }
        else { const a = f(), b = f(), c = f(); tgt = [a, w(), mir(a), b, w(), mir(b), c, w(), mir(c)]; }
        if (new Set(tgt).size < 3) tgt[4] = tgt[4] === 4 ? 5 : 4;
      }
      /* the blocks at the start: L1 two right, two not; L2-L3 none right; L4 three or four not; L5 five or six not */
      /* each block that is not right is one to three taps away (L5: at most 15 taps in all) */
      const n = N * N, wrongN = d === 1 ? 2 : d <= 3 ? 4 : d === 4 ? rng.int(3, 4) : rng.int(4, 5);
      const wrongAt = rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, wrongN);
      const start = tgt.map((t, i) => (wrongAt.includes(i) ? (t - rng.int(1, 3) + K6) % K6 : t));
      return { k: [d, tgt.join(''), start.join('')], d, N, K6, tgt, start, lines: d <= 2, answer: tgt.join(''), chance: Math.pow(1 / K6, wrongN) };
    },
    audit(q) { return [{ build: true, chance: q.chance }]; },
    geo(q) {
      const L = K.L(), N = q.N;
      const s = L ? (N === 3 ? 124 : 148) : (N === 3 ? 124 : 156), gap = 10, fw = N * s + (N - 1) * gap;
      const card = L ? (N === 3 ? 252 : 236) : (N === 3 ? 214 : 214);
      return L ? { s, gap, fx: 640 - fw / 2, fy: 392 - fw / 2, fw, cx: 292 - card / 2, cy: 392 - card / 2, card, done: [886, 330] }
        : { s, gap, fx: 352 - fw / 2, fy: (N === 3 ? 652 : 640) - fw / 2, fw, cx: 352 - card / 2, cy: (N === 3 ? 222 : 226), card, done: [297, 898] };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(st.q), N = st.q.N;
      if (st.cardEl) place(st.cardEl, g.cx, g.cy, g.card, g.card);
      if (st.frame) place(st.frame, g.fx - 16, g.fy - 16, g.fw + 32, g.fw + 32);
      (st.blocks || []).forEach((b, i) => place(b, g.fx + (i % N) * (g.s + g.gap), g.fy + Math.floor(i / N) * (g.s + g.gap), g.s, g.s));
      if (st.doneBtn) place(st.doneBtn, g.done[0], g.done[1], 110, 110);
    },
    /* the pattern card (with the blocks' lines at L1-L2, or when the explanation draws them) */
    drawCard(st, lines) {
      const q = st.q, N = q.N, s = st.cardSvg; while (s.firstChild) s.removeChild(s.firstChild);
      const k = 1 / N; q.tgt.forEach((t, i) => v7face(s, t, (i % N) * 100 * k, Math.floor(i / N) * 100 * k, k, 0.35));
      if (lines) for (let j = 1; j < N; j++) { svg('path', { d: 'M' + (100 * j / N) + ' 0V100M0 ' + (100 * j / N) + 'H100', stroke: '#fff', 'stroke-width': 1.6 }, s); svg('path', { d: 'M' + (100 * j / N) + ' 0V100M0 ' + (100 * j / N) + 'H100', stroke: INK, 'stroke-width': 0.9, 'stroke-dasharray': '2.4 1.6' }, s); }
      svg('rect', { x: 0, y: 0, width: 100, height: 100, fill: 'none', stroke: INK, 'stroke-width': 2.4 }, s);
    },
    paint(st, i) { const b = st.blocks[i], s = b._face; while (s.firstChild) s.removeChild(s.firstChild); v7face(s, st.state[i], 0, 0, 1); svg('rect', { x: 0, y: 0, width: 100, height: 100, fill: 'none', stroke: INK, 'stroke-width': 3 }, s); },
    /* one tap: a quarter turn (a little roll), or on to the next face (L4-L5) */
    turn(st, i, quiet) {
      const a = st.state[i], b = (a + 1) % st.q.K6; st.state[i] = b; this.paint(st, i);
      const f = st.blocks[i]._face;
      if (a < 4 && b < 4) st.scope.anim(f, [{ transform: 'rotate(-90deg) scale(.86)' }, { transform: 'rotate(0) scale(1)' }], { duration: 240, easing: EASE.pop });
      else st.scope.anim(f, [{ transform: 'scaleX(0.1)' }, { transform: 'scaleX(1)' }], { duration: 240, easing: EASE.pop });
      if (!quiet) Sfx.place();
    },
    async present(st) {
      const q = st.q;
      st.state = q.start.slice();
      st.cardEl = W2X.thing(st, 10, 10, 5, ''); Object.assign(st.cardEl.style, { background: '#fff', borderRadius: '18px', boxShadow: '0 0 0 5px ' + INK + ', 0 8px 0 5px rgba(43,33,24,.25)', padding: '12px', boxSizing: 'border-box' });
      st.cardSvg = sv(100, 100); st.cardSvg.setAttribute('viewBox', '0 0 100 100'); st.cardEl.appendChild(st.cardSvg);
      this.drawCard(st, q.lines);
      st.frame = W2X.thing(st, 10, 10, 4, ''); Object.assign(st.frame.style, { background: 'rgba(91,62,140,.82)', borderRadius: '22px', boxShadow: '0 0 0 5px ' + INK });
      st.blocks = st.state.map((_, i) => {
        const b = W2X.thing(st, 10, 10, 6, ''); Object.assign(b.style, { borderRadius: '14px', overflow: 'hidden', boxShadow: '0 7px 0 0 rgba(43,33,24,.55)', background: V7B });
        const s = sv(100, 100); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('preserveAspectRatio', 'none'); s.style.transformOrigin = '50% 50%'; b.appendChild(s); b._face = s;
        K.reg(st, 'b' + i, b, {}); return b;
      });
      st.blocks.forEach((_, i) => this.paint(st, i));
      st.doneBtn = button(st, 'done', ICON.ok);
      this.place(st);
      K.pop(st, st.cardEl); st.blocks.forEach((b, i) => K.pop(st, b, 60 + 40 * i));
      K.task(st, [[W2X.icon('<rect x="8" y="8" width="84" height="84" fill="' + V7B + '" stroke="' + INK + '" stroke-width="5"/><path d="M8 8H92L8 92Z" fill="' + V7Y + '"/><rect x="8" y="8" width="84" height="84" fill="none" stroke="' + INK + '" stroke-width="5"/><path d="M62 30A20 20 0 1 1 46 74" fill="none" stroke="#fff" stroke-width="7"/><path d="M38 66L48 78L56 64Z" fill="#fff"/>')], ['q']]);
      K.say(st, '照着图案转！');
    },
    onGesture(st, name, p) {
      if (name !== 'tap' || st.picked) return false;
      const id = p.id || '';
      if (id === 'done') { st.picked = true; Session.submit(st, st.state.join('')); return 'ok'; }
      const m = /^b(\d)$/.exec(id); if (!m) return false;
      this.turn(st, Number(m[1])); st.doneBtn.classList.add('ready');
      return 'ok';
    },
    next(st, strat) {
      if (st.picked || !st.blocks) return null;
      if (strat === 'wrong') return { g: 'tap', p: { id: 'done' } };
      const i = st.state.findIndex((s, k) => s !== st.q.tgt[k]);
      return { g: 'tap', p: { id: i >= 0 ? 'b' + i : 'done' } };
    },
    pointer(st) { const nx = this.next(st, 'right'); if (!nx) return null; const b = box(st.map[nx.p.id]); return { g: 'click', at: [b.x + b.w / 2, b.y + b.h / 2] }; },
    bad(st, ans) { const a = String(ans); return st.q.tgt.map((t, i) => (Number(a[i]) !== t ? i : -1)).filter(i => i >= 0); },
    async feedback(st, ans) { const n = this.bad(st, ans).length; W5U.say(st, n === 1 ? '有一块不一样' : n === 2 ? '有两块不一样' : n === 3 ? '有三块不一样' : '好几块不一样'); await st.scope.wait(T(600)); },
    /* 1. the card's lines, the blocks that differ blue, their places on the card lit; 2. they turn, a quarter at a time,
       until they match - gold */
    async explain(st, ans) {
      const my = st, q = st.q, bad = this.bad(st, ans), N = q.N;
      this.drawCard(st, true);
      bad.forEach(i => svg('rect', { x: (i % N) * 100 / N + 1.5, y: Math.floor(i / N) * 100 / N + 1.5, width: 100 / N - 3, height: 100 / N - 3, fill: 'rgba(255,255,255,.35)', stroke: BLUE, 'stroke-width': 2.4, 'stroke-dasharray': '4 3' }, st.cardSvg));
      W5U.blue(st, bad.map(i => st.blocks[i]));
      W5U.note(st, bad.length === 1 ? '这块还要转' : '这几块还要转');
      await st.scope.wait(1000); if (!Session.alive(my)) return;
      $$('.ringo', Stage.el).forEach(r => { r.style.visibility = 'hidden'; });
      for (let k = 0; k < q.K6 && bad.some(i => st.state[i] !== q.tgt[i]); k++) {
        if (!Session.alive(my)) return;
        bad.forEach(i => { if (st.state[i] !== q.tgt[i]) this.turn(st, i, true); }); Sfx.place();
        await st.scope.wait(T(300));
      }
      if (!Session.alive(my)) return;
      W5U.gold(st, bad.map(i => st.blocks[i]));
      await W5U.sum(st, '这样就对上了');
      await st.scope.wait(300);
    },
    rightEls(st, ans) { return this.bad(st, ans).map(i => st.blocks[i]); },
    async reveal(st) {
      W5U.gold(st, st.frame, 4); Sfx.reveal(); this.cheerAll(st);
      st.summary = '和图案一样！'; W5U.sum(st, st.summary);
      await st.scope.wait(T(900));
    },
    workEls(st) { return st.blocks || []; },
    snap(st) { return { state: (st.state || []).join('') }; },
    lines() { return uniq([this.intro, '照着图案转！', '有一块不一样', '有两块不一样', '有三块不一样', '好几块不一样', '这块还要转', '这几块还要转', '这样就对上了', '和图案一样！'].concat(this.praise)); },
  };
  /* ---------------------------------------------------------------- V8 穿！ 穿过墙洞 (S17 Tumble Jumble; reasoning): a little
     building of blocks on a 3 x 3 base (seen from the front, a little from above and the right), Hulk pushes it towards a
     wall with five holes - which hole does it go through? What matters is its outline in the direction it is pushed: a block
     hidden behind another changes nothing.
       L1 2-3 blocks in a row or a column, very different holes · L2 4-5 blocks, some hidden behind
       (L1-L2 the building stands two blocks wide at most, so the holes are drawn big: 56-unit cells; from L3 36)
       L3 5-6 blocks with depth; the other holes: its outline from above, from the side, the front turned round, one block less
       L4 pushed from the side (the wall on its left): its outline from the side is wanted
       L5 the other way round: one hole, five buildings - which goes through?
     The holes start at the floor; the building may slide sideways to meet one. A hole bigger than the outline would let it
     through too, so no other hole contains the outline (the design's "one block more" is "one block less" here) - exactly one
     hole (building) is right; its place from a bag. Wrong: the building's outline laid on his hole, what sticks out blue
     dashed "这里卡住了"; a lamp behind the building throws its shadow on the right hole, gold "影子就是洞"; it goes through
     "穿过去了". */
  const V8C = ['#E8414B', '#FFC93C', '#4F7BFF', '#5CC46E', '#FF9F43', '#B57BFF'];
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  /* a building: blocks [x, y, z] (x left-right, y front-back, z up), every block on the floor or on a block */
  function v8tower(rng, n, xw) {
    xw = xw || 3;
    const h = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], cols = [];
    const x0 = rng.int(0, xw - 1), y0 = rng.int(0, 2); h[x0][y0] = 1; cols.push([x0, y0]);
    for (let k = 1; k < n; k++) {
      const opts = [];
      cols.forEach(([x, y]) => { if (h[x][y] < 3) opts.push([x, y]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy; if (a >= 0 && a < xw && b >= 0 && b < 3 && !h[a][b]) opts.push([a, b]); }); });
      const [x, y] = rng.pick(opts); if (!h[x][y]) cols.push([x, y]); h[x][y]++;
    }
    return v8blocks(h);
  }
  const v8blocks = h => { const out = []; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < h[x][y]; z++) out.push([x, y, z]); return out; };
  const v8h = B => { const h = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; B.forEach(([x, y, z]) => { h[x][y] = Math.max(h[x][y], z + 1); }); return h; };
  /* outlines as cells [u, v] (v up from the floor), moved to start at u = 0 */
  const v8norm = cs => { if (!cs.length) return []; const u0 = Math.min(...cs.map(c => c[0])); return cs.map(([u, v]) => [u - u0, v]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  const v8key = cs => v8norm(cs).map(c => c.join(':')).join(',');
  const v8front = B => v8norm(uniq(B.map(([x, , z]) => x + ':' + z)).map(s => s.split(':').map(Number)));
  const v8side = B => v8norm(uniq(B.map(([, y, z]) => y + ':' + z)).map(s => s.split(':').map(Number)));
  const v8top = B => v8norm(uniq(B.map(([x, y]) => x + ':' + y)).map(s => s.split(':').map(Number)));
  const v8mirror = cs => v8norm(cs.map(([u, v]) => [-u, v]));
  /* does an outline go through a hole (it may slide sideways; both stand on the floor)? */
  const v8fits = (sil, hole) => { const H = new Set(hole.map(c => c.join(':'))); for (let d = -3; d <= 3; d++) if (sil.every(([u, v]) => H.has((u + d) + ':' + v))) return d; return null; };
  /* the slide that leaves the fewest cells outside, drawn inside its 120 box (lo .. hi: the columns that fit in it) */
  const v8best = (sil, hole, lo, hi) => { const H = new Set(hole.map(c => c.join(':'))); let best = null; for (let d = -3; d <= 3; d++) { if (Math.min(...sil.map(c => c[0])) + d < lo || Math.max(...sil.map(c => c[0])) + d > hi) continue; const out = sil.filter(([u, v]) => !H.has((u + d) + ':' + v)).length; if (!best || out < best.out) best = { d, out }; } return best || { d: 0, out: 0 }; };
  /* a random outline standing on the floor: column heights (width 1-3) */
  const v8sky = (rng, wmax) => { const w = rng.int(1, wmax || 3), cs = []; for (let u = 0; u < w; u++) { const hh = rng.int(1, 3); for (let v = 0; v < hh; v++) cs.push([u, v]); } return v8norm(cs); };
  W5R.V8 = {
    kind0: 'wall5', verb: '穿！', intro: '绿巨人推积木！', praise: ['一下就穿过！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      for (let tries = 0; tries < 200; tries++) {
        let B;
        if (d === 1) { const n = rng.int(2, 3); if (rng.chance(0.5)) { const y = rng.int(0, 2), x0 = rng.int(0, 1); B = Array.from({ length: 2 }, (_, i) => [x0 + i, y, 0]); } else { const x = rng.int(0, 2), y = rng.int(0, 2); B = Array.from({ length: n }, (_, i) => [x, y, i]); } }
        else B = v8tower(rng, d === 2 ? rng.int(4, 5) : d === 3 ? rng.int(5, 6) : d === 4 ? rng.int(4, 6) : rng.int(4, 6), d === 2 ? 2 : 3);
        const front = v8front(B), side = v8side(B), hid = B.filter(([x, y, z]) => B.some(b => b[0] === x && b[2] === z && b[1] < y)).length;
        if (d === 2 && !hid) continue;
        if (d === 3 && (!hid || new Set(B.map(b => b[1])).size < 2)) continue;
        if (d === 4 && v8key(front) === v8key(side)) continue;
        const sil = d === 4 ? side : front;
        if (d === 1 && sil.length < 2) continue;
        if (d === 5) {
          /* one hole (this building's front outline), five buildings: only this one fits */
          const others = [], tk = T => T.map(b => b.join('')).sort().join('.');
          const add = T => { if (T && others.length < 4 && tk(T) !== tk(B) && !others.some(x => tk(x) === tk(T)) && v8fits(v8front(T), front) === null) others.push(T); };
          /* one block more that shows; the building turned round (mirror); turned to its side; random ones */
          const h = v8h(B), plus = []; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) { if (h[x][y] < 3 && (h[x][y] || x === 0 || x === 2 || y === 0)) plus.push([x, y]); }
          rng.shuffle(plus).slice(0, 3).forEach(([x, y]) => { const h2 = h.map(r => r.slice()); h2[x][y]++; add(v8blocks(h2)); });
          add(B.map(([x, y, z]) => [2 - x, y, z])); add(B.map(([x, y, z]) => [y, x, z]));
          for (let k = 0; k < 60 && others.length < 4; k++) add(v8tower(rng, rng.int(3, 6)));
          if (others.length < 4) continue;
          const towers = W5U.deal(G, B, others, 'v8t');
          return { k: [d, B.map(b => b.join('')).join('.')], d, hole: front, towers, answer: towers.indexOf(B), opts: [0, 1, 2, 3, 4], col: rng.int(0, 5) };
        }
        /* the other holes: from above, from the side / front, turned round, one block less; then random ones */
        const holes = [], cand = [d === 4 ? front : side, v8top(B), v8mirror(sil)];
        const tops = []; sil.forEach(([u, v]) => { if (!sil.some(c => c[0] === u && c[1] === v + 1)) tops.push([u, v]); });
        if (sil.length > 1) { const t = rng.pick(tops); cand.push(v8norm(sil.filter(c => !(c[0] === t[0] && c[1] === t[1])))); }
        const wmax = d <= 2 ? 2 : 3, wide = c => Math.max(...c.map(x => x[0])) + 1 > wmax || Math.max(...c.map(x => x[1])) + 1 > 3;
        for (let k = 0; k < 40; k++) cand.push(v8sky(rng, wmax));
        (d === 1 ? rng.shuffle(cand) : cand).forEach(c => { if (holes.length < 4 && c.length && !wide(c) && v8fits(sil, c) === null && v8key(c) !== v8key(sil) && !holes.some(x => v8key(x) === v8key(c))) holes.push(c); });
        if (holes.length < 4) continue;
        const opts = W5U.deal(G, sil, holes, 'v8h');
        return { k: [d, B.map(b => b.join('')).join('.')], d, side: d === 4, big: d <= 2, B, sil, holes: opts, answer: opts.indexOf(sil), opts: [0, 1, 2, 3, 4], col: rng.int(0, 5) };
      }
      return this.gen(G, Object.assign({}, o, { level: Math.max(1, d - 1) }));
    },
    audit(q) {
      if (q.d === 5) return [{ n: q.towers.length, at: q.answer, right: q.towers.filter(T => v8fits(v8front(T), q.hole) !== null).length }];
      return [{ n: q.holes.length, at: q.answer, right: q.holes.filter(h => v8fits(q.sil, h) !== null).length }];
    },
    /* where things go: the wall (with its holes), the building, the arrow; L5 the wall's one hole and five building cards */
    geo(q) {
      const L = K.L();
      if (q.d === 5) return L ? { wall: [362, 92, 300, 200], hole: [432, 112, 160], cards: [0, 1, 2, 3, 4].map(i => [512 + (i - 2) * 166 - 75, 322]), cw: 150, ch: 176 }
        : { wall: [202, 200, 300, 200], hole: [272, 220, 160], cards: [0, 1, 2, 3, 4].map(i => (i < 3 ? [352 + (i - 1) * 166 - 75, 434] : [352 + (i === 3 ? -83 : 83) - 75, 626])), cw: 150, ch: 176 };
      if (q.side) return L ? { wall: [176, 96, 268, 424], holes: [0, 1, 2, 3, 4].map(i => (i < 4 ? [190 + (i % 2) * 130, 112 + Math.floor(i / 2) * 136] : [255, 384])), tower: [578, 214, 300], arrow: [560, 364, 452, 364] }
        : { wall: [16, 214, 268, 424], holes: [0, 1, 2, 3, 4].map(i => (i < 4 ? [30 + (i % 2) * 130, 230 + Math.floor(i / 2) * 136] : [95, 502])), tower: [386, 300, 290], arrow: [376, 450, 296, 450] };
      if (q.big) return L ? { wall: [170, 92, 684, 208], holes: [0, 1, 2, 3, 4].map(i => [512 + (i - 2) * 134 - 62, 106]), hw: 124, hh: 180, tower: [377, 378, 280], arrow: [512, 372, 512, 304] }
        : { wall: [20, 200, 664, 208], holes: [0, 1, 2, 3, 4].map(i => [352 + (i - 2) * 132 - 62, 214]), hw: 124, hh: 180, tower: [212, 468, 300], arrow: [352, 462, 352, 412] };
      return L ? { wall: [176, 92, 672, 200], holes: [0, 1, 2, 3, 4].map(i => [512 + (i - 2) * 132 - 60, 132]), tower: [377, 378, 280], arrow: [512, 372, 512, 300] }
        : { wall: [24, 200, 656, 330], holes: [0, 1, 2, 3, 4].map(i => (i < 3 ? [352 + (i - 1) * 146 - 60, 228] : [352 + (i === 3 ? -73 : 73) - 60, 378])), tower: [212, 586, 280], arrow: [352, 582, 352, 536] };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(st.q);
      if (st.wallEl) place(st.wallEl, g.wall[0], g.wall[1], g.wall[2], g.wall[3]);
      if (st.holeEls) st.holeEls.forEach((e, i) => place(e, g.holes[i][0], g.holes[i][1], g.hw || 120, g.hh || 120));
      if (st.bigHole) place(st.bigHole, g.hole[0], g.hole[1], g.hole[2], g.hole[2]);
      if (st.towerEl) place(st.towerEl, g.tower[0], g.tower[1], g.tower[2], g.tower[2]);
      if (st.cards && g.cards) st.cards.forEach((c, i) => place(c, g.cards[i][0], g.cards[i][1], g.cw, g.ch));
      if (st.arrowEl && g.arrow) { const [x1, y1, x2, y2] = g.arrow, s = st.arrowEl; while (s.firstChild) s.removeChild(s.firstChild); svg('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, stroke: '#fff', 'stroke-width': 26, 'stroke-linecap': 'round' }, s); svg('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, stroke: '#3FAE55', 'stroke-width': 16, 'stroke-linecap': 'round' }, s); svg('path', { d: W5U.arrowHead({ x: x1, y: y1 }, { x: x2, y: y2 }, 34), fill: '#3FAE55', stroke: '#fff', 'stroke-width': 4 }, s); }
    },
    /* a building in a cabinet view (a block 100, its depth 50 up and to the right); viewBox fits any 3 x 3 x 3 */
    tower(B, col) {
      const s = sv(466, 466); s.setAttribute('viewBox', '-8 -458 466 466');
      svg('path', { d: 'M0 0H300L450 -150H150Z', fill: '#C9B79C', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s);
      svg('path', { d: 'M0 0H300V16H0Z', fill: '#A58F70', stroke: INK, 'stroke-width': 6 }, s); svg('path', { d: 'M300 0L450 -150V-134L300 16Z', fill: '#8C7859', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s);
      B.slice().sort((a, b) => b[1] - a[1] || a[2] - b[2] || a[0] - b[0]).forEach(([x, y, z], i) => {
        const X = 100 * x + 50 * y, Y = -100 * z - 50 * y, c = V8C[(col + x + 2 * y + z) % V8C.length];
        const g = svg('g', { 'stroke-width': 5, stroke: INK, 'stroke-linejoin': 'round' }, s);
        svg('path', { d: 'M' + X + ' ' + (Y - 100) + 'H' + (X + 100) + 'L' + (X + 150) + ' ' + (Y - 150) + 'H' + (X + 50) + 'Z', fill: shade(c, 1.18) }, g);
        svg('path', { d: 'M' + (X + 100) + ' ' + Y + 'L' + (X + 150) + ' ' + (Y - 50) + 'V' + (Y - 150) + 'L' + (X + 100) + ' ' + (Y - 100) + 'Z', fill: shade(c, 0.72) }, g);
        svg('rect', { x: X, y: Y - 100, width: 100, height: 100, fill: c }, g);
        svg('circle', { cx: X + 50, cy: Y - 50, r: 13, fill: shade(c, 1.12), stroke: shade(c, 0.6), 'stroke-width': 4 }, g);
      });
      return s;
    },
    /* a hole in the wall, standing on its box's bottom edge: L1-L2 big cells (56 in a 124 x 180 box: at most two wide, three
       high), from L3 cells of 36 in a 120 box (three by three) */
    holeSvg(cs, big) {
      const W = big ? 124 : 120, Hh = big ? 180 : 120, c = big ? 56 : 36, fy = Hh - 6, s = sv(W, Hh), w = Math.max(...cs.map(x => x[0])) + 1, x0 = W / 2 - w * c / 2;
      cs.forEach(([u, v]) => svg('rect', { x: x0 + u * c - 0.4, y: fy - (v + 1) * c - 0.4, width: c + 0.8, height: c + 0.8, fill: '#2B2118' }, s));
      /* its edge: a light rim */
      const H = new Set(cs.map(x => x.join(':'))); let d = '';
      cs.forEach(([u, v]) => { const X = x0 + u * c, Y = fy - (v + 1) * c; if (!H.has(u + ':' + (v + 1))) d += 'M' + X + ' ' + Y + 'H' + (X + c); if (!H.has(u + ':' + (v - 1)) && v > 0) d += 'M' + X + ' ' + (Y + c) + 'H' + (X + c); if (!H.has((u - 1) + ':' + v)) d += 'M' + X + ' ' + Y + 'V' + (Y + c); if (!H.has((u + 1) + ':' + v)) d += 'M' + (X + c) + ' ' + Y + 'V' + (Y + c); });
      svg('path', { d, stroke: '#F3E2C8', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, s);
      s._x0 = x0; s._c = c; s._W = W; s._fy = fy;
      return s;
    },
    wall(st, w, h) {
      const e = W2X.thing(st, 10, 10, 3, ''); Object.assign(e.style, { borderRadius: '14px', boxShadow: '0 0 0 5px ' + INK, overflow: 'hidden', background: '#C98B4A' });
      const s = sv(w, h); s.setAttribute('preserveAspectRatio', 'none');
      for (let r = 0; r * 34 < h; r++) for (let k = -1; k * 68 < w; k++) svg('rect', { x: k * 68 + (r % 2 ? 34 : 0) + 2, y: r * 34 + 2, width: 64, height: 30, rx: 4, fill: r % 3 === 1 ? '#D79A58' : '#CF9150', stroke: '#9B6532', 'stroke-width': 2 }, s);
      e.appendChild(s); return e;
    },
    async present(st) {
      const q = st.q, g = this.geo(q);
      st.wallEl = this.wall(st, g.wall[2], g.wall[3]);
      if (q.d === 5) {
        st.bigHole = W2X.thing(st, 10, 10, 4, ''); st.bigHole.appendChild(st.bigSvg = this.holeSvg(q.hole)); st.bigHole.style.pointerEvents = 'none';
        st.cards = q.towers.map((T, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); const t = this.tower(T, q.col); Object.assign(t.style, { width: '92%', height: '92%' }); c.appendChild(t); c._t = t; return c; });
        st.opts = q.opts.slice();
        this.place(st);
        K.pop(st, st.wallEl); st.cards.forEach((c, i) => K.pop(st, c, 60 * i));
        K.task(st, [[W2X.icon('<rect x="6" y="10" width="88" height="80" rx="6" fill="#C98B4A" stroke="' + INK + '" stroke-width="5"/><path d="M34 90V56H50V40H66V90Z" fill="' + INK + '"/>')], ['q']]);
        K.say(st, '哪座能穿过？');
        return;
      }
      st.holeEls = q.holes.map((h, i) => { const e = W2X.thing(st, 120, 120, 5, ''); e.appendChild(e._s = this.holeSvg(h, q.big)); Object.assign(e.style, { borderRadius: '12px' }); K.reg(st, 'card' + i, e, {}); return e; });
      st.cards = st.holeEls; st.opts = q.opts.slice();
      st.towerEl = W2X.thing(st, 10, 10, 6, ''); st.towerEl.appendChild(st.towerSvg = this.tower(q.B, q.col)); st.towerEl.style.pointerEvents = 'none';
      st.arrowEl = K.lines(st); st.arrowEl.style.zIndex = 4;
      this.place(st);
      K.pop(st, st.wallEl); st.holeEls.forEach((e, i) => K.pop(st, e, 50 * i)); K.pop(st, st.towerEl, 200);
      K.task(st, [[W2X.icon('<path d="M10 80H90" stroke="' + INK + '" stroke-width="5"/><rect x="20" y="40" width="22" height="40" fill="#E8414B" stroke="' + INK + '" stroke-width="4"/><rect x="42" y="58" width="22" height="22" fill="#FFC93C" stroke="' + INK + '" stroke-width="4"/>')], [W2X.icon('<rect x="6" y="10" width="88" height="80" rx="6" fill="#C98B4A" stroke="' + INK + '" stroke-width="5"/><path d="M34 90V56H50V40H66V90Z" fill="' + INK + '"/>')], ['q']]);
      if (q.side) W3X.say2(st, '从旁边推！', '从哪个洞能穿过？'); else K.say(st, '从哪个洞能穿过？');
    },
    onGesture(st, name, p) { return W5U.tapCard(st, name, p); },
    next(st, strat) { return W5U.cardNext(st, strat); },
    pointer(st) { const nx = this.next(st, 'right'); if (!nx) return null; const b = box(st.map[nx.p.id]); return { g: 'click', at: [b.x + b.w / 2, b.y + b.h / 2] }; },
    async feedback(st, ans) { const c = st.cards && st.cards[ans]; if (c) K.wiggle(st, c); W5U.say(st, '卡住啦'); await st.scope.wait(T(600)); },
    /* an outline laid in a hole box (its svg): the cells inside a colour, the cells outside blue dashed */
    lay(s, sil, hole, color, dash) {
      const c = s._c, W = s._W, fy = s._fy, w = Math.max(...hole.map(x => x[0])) + 1, x0 = W / 2 - w * c / 2, b = v8fits(sil, hole), d = b !== null ? b : v8best(sil, hole, Math.ceil(-x0 / c), Math.floor((W - x0) / c) - 1).d, H = new Set(hole.map(x => x.join(':')));
      const g = svg('g', {}, s), out = [];
      sil.forEach(([u, v]) => { const X = x0 + (u + d) * c, Y = fy - (v + 1) * c, inside = H.has((u + d) + ':' + v); svg('rect', { x: X + 2, y: Y + 2, width: c - 4, height: c - 4, rx: 4, fill: inside ? color : 'rgba(79,179,255,.25)', stroke: inside ? 'none' : BLUE, 'stroke-width': 3.5, 'stroke-dasharray': inside ? '' : '5 4' }, g); if (!inside) out.push(1); });
      return { g, out: out.length };
    },
    /* 1. the outline laid on his hole: what sticks out blue (the building moves up to it); 2. a lamp behind the building, its
       shadow fills the right hole - gold; 3. it goes through */
    async explain(st, ans) {
      const my = st, q = st.q;
      if (q.d === 5) {
        const mine = st.cards[ans], right = st.cards[q.answer];
        W5U.blue(st, mine);
        const a = this.lay(st.bigSvg, v8front(q.towers[ans]), q.hole, 'rgba(232,65,75,.55)');
        W5U.note(st, '这里卡住了');
        await st.scope.wait(900); if (!Session.alive(my)) return;
        a.g.remove(); $$('.ringo', Stage.el).forEach(r => { r.style.visibility = 'hidden'; });
        const sh = this.lay(st.bigSvg, v8front(q.towers[q.answer]), q.hole, 'rgba(255,201,60,.9)');
        st.scope.anim(sh.g, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
        W5U.gold(st, [right, st.bigHole]);
        await W5U.sum(st, '影子就是洞'); if (!Session.alive(my)) return;
        await st.scope.wait(250); if (!Session.alive(my)) return;
        await this.through(st, right, st.bigHole); if (!Session.alive(my)) return;
        await W5U.sum(st, '穿过去了');
        return;
      }
      const mine = st.holeEls[ans], right = st.holeEls[q.answer];
      W5U.blue(st, mine);
      st.scope.anim(st.towerEl, [{ transform: 'translateY(0)' }, { transform: q.side ? 'translateX(-40px)' : 'translateY(-34px)' }, { transform: 'translateY(0)' }], { duration: 600, easing: EASE.glide });
      const a = this.lay(mine._s, q.sil, q.holes[ans], 'rgba(232,65,75,.6)');
      W5U.note(st, '这里卡住了');
      await st.scope.wait(900); if (!Session.alive(my)) return;
      $$('.ringo', Stage.el).forEach(r => { r.style.visibility = 'hidden'; });
      /* the lamp behind the building, its light, the shadow on the wall */
      const tb = box(st.towerEl), lamp = W2X.thing(st, 64, 64, 7, ''); lamp.innerHTML = '<svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="16" fill="#FFE36B" stroke="' + INK + '" stroke-width="4"/><path d="M32 4V12M32 52V60M4 32H12M52 32H60M12 12L18 18M46 46L52 52M52 12L46 18M12 52L18 46" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/></svg>';
      place(lamp, q.side ? tb.x + tb.w - 20 : tb.x + tb.w / 2 - 32, q.side ? tb.y + tb.h / 2 - 32 : tb.y + tb.h - 40, 64, 64); K.pop(st, lamp); Sfx.sparkle();
      const sh = this.lay(right._s, q.sil, q.holes[q.answer], 'rgba(30,22,16,.0)');
      sh.g.querySelectorAll('rect').forEach(r => { r.setAttribute('fill', 'rgba(255,201,60,.92)'); });
      st.scope.anim(sh.g, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: 'forwards' });
      /* the light from the lamp past the building onto the hole */
      const rb = box(right), lb = box(lamp), e2 = q.side ? [rb.x + rb.w, rb.y, rb.x + rb.w, rb.y + rb.h] : [rb.x, rb.y + rb.h, rb.x + rb.w, rb.y + rb.h];
      const beam = svg('path', { d: 'M' + (lb.x + 32) + ' ' + (lb.y + 32) + 'L' + e2[0] + ' ' + e2[1] + 'L' + e2[2] + ' ' + e2[3] + 'Z', fill: 'rgba(255,236,140,.38)' }, st.arrowEl);
      st.scope.anim(beam, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
      W5U.gold(st, right);
      await W5U.sum(st, '影子就是洞'); if (!Session.alive(my)) return;
      await st.scope.wait(250); if (!Session.alive(my)) return;
      beam.remove();
      await this.through(st, st.towerEl, right); if (!Session.alive(my)) return;
      await W5U.sum(st, '穿过去了');
    },
    /* the building flies into the hole (and through) */
    async through(st, e, hole) {
      const a = box(e), b = box(hole);
      Sfx.whoosh(0.3);
      await st.scope.anim(e, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + (b.x + b.w / 2 - a.x - a.w / 2) + 'px,' + (b.y + b.h / 2 - a.y - a.h / 2) + 'px) scale(.35)', opacity: 0.15 }], { duration: fast() ? 10 : 520, easing: EASE.glide, fill: 'forwards' });
    },
    rightEls(st) { return [st.cards[st.q.answer]]; },
    async reveal(st) {
      const my = st, q = st.q, right = st.cards[q.answer];
      W5U.gold(st, right); Sfx.reveal();
      if (q.d === 5) await this.through(st, right, st.bigHole); else await this.through(st, st.towerEl, right);
      if (!Session.alive(my)) return;
      this.cheerAll(st); st.summary = '穿过去了！'; W5U.sum(st, st.summary);
      await st.scope.wait(T(700));
    },
    workEls(st) { return st.cards || []; },
    snap(st) { return { opts: st.opts || null }; },
    lines() { return uniq([this.intro, '从哪个洞能穿过？', '从旁边推！', '哪座能穿过？', '卡住啦', '这里卡住了', '影子就是洞', '穿过去了', '穿过去了！'].concat(this.praise)); },
  };
})();
/* ---------------------------------------------------------------- 积木城 on the map and in the parent panel (out of the first
   screen: index.html calls these hooks when they are here - FLAG_HTML: window.W5S, Parent.panel: W5P)
   - the flag: a square flag in the island's colour, a 2 x 2 chequer in its corner (its two colours), the host in the middle,
     a little cube on the pole (three faces seen from above) - docs/W5-DESIGN.md §2.2
   - the parent panel: 积木城's table (open / flagged, every game ✓ / stars / level, islands not live yet) and the lesson
     table 上课对照 (Think Academy PreK lesson -> the game to play after it; appendix B), drawn when it is opened */
window.W5S = W => '<div class="cloth"><svg viewBox="0 0 60 42"><rect x="2" y="2" width="56" height="38" rx="3" fill="' + W.color + '" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/>'
  + '<path d="M3.5 3.5h7v7h-7zM10.5 10.5h7v7h-7z" fill="' + W.color2 + '"/><path d="M10.5 3.5h7v7h-7zM3.5 10.5h7v7h-7z" fill="#FFF8EC"/></svg><img src="assets/thumbs/' + W.host + '.png" alt="" style="left:24px;top:7px"></div>'
  + '<svg class="finial" viewBox="0 0 24 24"><path d="M12 12L21 7.5V16.5L12 21Z" fill="#E8A100"/><path d="M12 12L3 7.5V16.5L12 21Z" fill="#FFD84A"/><path d="M12 3L21 7.5L12 12L3 7.5Z" fill="#FFE58A"/>'
  + '<path d="M12 3L21 7.5V16.5L12 21L3 16.5V7.5ZM3 7.5L12 12L21 7.5M12 12V21" fill="none" stroke="#2B2118" stroke-width="2" stroke-linejoin="round"/></svg>';
/* Think Academy PreK (F = autumn, S = spring) -> 积木城 (docs/W5-DESIGN.md appendix B); null: not made (and why) */
const W5LESSONS = [
  ['F1 Turning Cubes', ['V7', 'J5', 'Z6']], ['F2 How is the Weather?', ['J6'], '读表（穿衣不做）'], ['F3 Zoo Locations', ['P8']], ['F4 Little Painter', ['P7', 'U7']],
  ['F5 City Adventure', ['P7', 'U5'], 'P7 第 5 级：平行线'], ['F6 Squary\'s Farm', ['H6']], ['F7 Unforgettable Trip', null, '不做：规律已有，是强项'], ['F8 Rainforest', ['H6']],
  ['F9 Fruit Party', ['X6', 'H7', 'U6']], ['F10 Special Twins', ['H5', 'V6']], ['F11 Insect World', ['J7', 'Z6']], ['F12 Little Handyman', ['V6']],
  ['F13 Field Trip', ['X7', 'P5', 'Z5', 'U8']], ['F14 Lucky Ring', ['B5', 'Z5']], ['F15 Let\'s Make Cakes', ['P6', 'A7', 'Z7']], ['F16 Ask Elves', null, '不做：云上 U2 已有'],
  ['F17 Popping Candy', ['B8']], ['F18 Surprise for Mom', ['H8', 'U8']],
  ['S1 Chase It', ['B7', 'A5', 'U5', 'Z8']], ['S2 Taking Photos', ['X5']], ['S3 Step by Step', ['A6', 'Z5', 'U5']], ['S4 Tidy Up', ['J8', 'J6']], ['S5 Kingdom of Origami', ['H5'], '只做折（打孔是星空 M4）'],
  ['S6 One Day in Cannery', ['J7']], ['S7 Shape Beauty Contest', ['P7', 'J6', 'J5', 'Z6', 'U6', 'U7']], ['S8 Party at Beach', ['P6', 'B6', 'A7', 'Z7']], ['S9 Rolling Shapes', null, '不做：云上 E3 已有'],
  ['S10 Squary the Pirate', ['J7', 'Z8'], '有序思考（排除法已有）'], ['S11 Top It Up', ['P6', 'V5', 'A7', 'Z7']], ['S12 Lost in Castle', ['A5'], 'A5 第 4–5 级：城堡'], ['S13 Float and Sink', null, '不做：屏幕上没法真的试'],
  ['S14 Who Is Taller?', ['X8', 'X6', 'H7', 'U6']], ['S15 Wowowowo', null, '不做：已有 F4、Y3'], ['S16 Piggy Bank', ['V5', 'A7', 'Z7']], ['S17 Tumble Jumble', ['V8', 'X5', 'Z5']], ['S18 Journey to the Cave', ['A8', 'Z8']],
];
/* the games' names for the parent (docs/W5-DESIGN.md §0) */
const W5NAMES = { P5: '捉迷藏', P6: '小剧场', P7: '钉板', P8: '记位置', B5: '左手右手', B6: '发生了什么', B7: '线团', B8: '找不同', J5: '三角拼图', J6: '数图形填表', J7: '拍下所有分法', J8: '按什么分的',
  A5: '画路线', A6: '看箭头走', A7: '对号入座', A8: '排座位', H5: '剪纸对折', H6: '几个几个圈', H7: '哪块地大', H8: '千里眼找', X5: '从哪儿拍的', X6: '拉直比一比', X7: '取经队排队', X8: '换尺子量',
  V5: '加号飞机减号飞机', V6: '切成一样的', V7: '积木转转', V8: '穿过墙洞',
  Z5: '听口令装机器人', Z6: '零件一样吗', Z7: '帮大黄蜂改作业', Z8: '卡车开出去', U5: '光线拐弯', U6: '变大变小', U7: '光棒搭房子', U8: '楼后面几只小怪兽' };
const W5P = sh => {
  if (!LIVE5.length) return;
  const isl = g => ORDER5.find(w => WORLDS[w].games.includes(g)), gname = g => g + ' ' + (W5NAMES[g] || '');
  if (W5.open()) {
    el('h3', '', sh, { text: '积木城（第五世界，在第二片海和云上之间：位置、路线、图形和加减的意思；上线 ' + LIVE5.length + '/' + ORDER5.length + ' 个岛）' });
    const t = el('table', '', sh); t.innerHTML = '<tr><th>岛</th><th>开放</th><th>小游戏（✓ 已过 · 星）</th><th>难度</th></tr>';
    ORDER5.forEach(id => {
      const ws = Store.w(id), tr = el('tr', '', t), live = W5.live(id);
      el('td', '', tr, { text: WORLDS[id].name });
      el('td', '', tr, { text: !live ? '还在建' : ws.unlocked ? (W2.islandDone(id) ? '已过关' : '开放') : '未开放' });
      el('td', '', tr, { text: live ? WORLDS[id].games.map(g => gname(g) + (W2.gameDone(id, g) ? ' ✓' : W2.gameOpen(id, g) ? ' ·' : ' 🔒') + W2.stars(id, g) + '★').join('  ') : '-' });
      el('td', '', tr, { text: live ? WORLDS[id].games.map(g => 'L' + W2.level(id, g)).join(' ') : '-' });
    });
  }
  /* 上课对照: a button; the table is drawn when the parent opens it */
  const b = el('button', 'pbtn', sh, { text: '上课对照：学而思这一课 → 积木城的哪个游戏' });
  b.addEventListener('click', () => {
    if (b._t) { b._t.remove(); b._t = null; return; }
    const t = b._t = el('table', '', sh); b.after(t);
    t.innerHTML = '<tr><th>学而思 PreK 这一课</th><th>上完课去玩</th></tr>';
    W5LESSONS.forEach(([lesson, games, note]) => {
      const tr = el('tr', '', t); el('td', '', tr, { text: lesson });
      el('td', '', tr, { text: games ? games.map(g => { const w = isl(g); return gname(g) + '（' + WORLDS[w].name + (!W5.live(w) ? '，还在建' : !Store.w(w).unlocked ? '，还没开' : '') + '）'; }).join('、') + (note ? '；' + note : '') : note });
    });
  });
};
/* this file can come after the map was drawn: 积木城's flags get their own look now */
if (typeof Screens !== 'undefined' && Screens.cur === 'map' && MapView.built && MapView.set === 5) { ORDER5.forEach(id => { const I = MapView.isl[id]; if (I && I.flag) I.flag.innerHTML = FLAG_HTML(id); }); MapView.update(); }
/* ---------------------------------------------------------------- the 36 games of 积木城 (28 + §16's Z5-Z8, U5-U8): one rule each (W5R.<id>, raw/js/w5/
   <island>.js) + the island's things. Row: [id, island, new background, fallback background (until the new picture is in
   assets/bg: raw/js/build_w5.py lists what is there in W5HAVE), friends (first = the host's side), host, icon, review card,
   boost, things]. A rule not written yet falls back to the sky's MSums (a playable stand-in; its island is not live).
   Review cards: the counting games use the existing cards; pos / shape / op10 (package D) count only once their question
   types are in (SKILLS has them) - "no question type, no card in the box". */
function w5Game(rule, spec) {
  const g = defGame(Object.assign({}, W2Base, rule || MSums, spec));
  g.props = (spec.props || []).filter((p, i, a) => a.indexOf(p) === i && (!W5U.NEWP[p] || W5HAVE.has('prop_' + p)));
  return g;
}
const W5CARD = {};
const IC5 = (() => {
  const k = '#2B2118', I = s => W2X.icon(s), S = 'stroke="' + k + '" stroke-width="4"';
  return {
    hide: I('<rect x="14" y="44" width="72" height="12" rx="4" fill="#B97A3C" ' + S + '/><path d="M22 56V88M78 56V88" ' + S + '/><circle cx="50" cy="30" r="13" fill="#FFC93C" ' + S + '/><path d="M44 28h2M54 28h2" ' + S + '/>'),
    stage: I('<rect x="10" y="58" width="80" height="18" rx="5" fill="#FFC93C" ' + S + '/><path d="M16 58V30H30" fill="none" ' + S + '/><circle cx="56" cy="44" r="10" fill="#FFF" ' + S + '/><path d="M70 44h16M78 36l8 8-8 8" fill="none" ' + S + '/>'),
    pegs: I('<g fill="' + k + '"><circle cx="20" cy="20" r="5"/><circle cx="50" cy="20" r="5"/><circle cx="80" cy="20" r="5"/><circle cx="20" cy="50" r="5"/><circle cx="50" cy="50" r="5"/><circle cx="80" cy="50" r="5"/><circle cx="20" cy="80" r="5"/><circle cx="50" cy="80" r="5"/><circle cx="80" cy="80" r="5"/></g><path d="M20 80L50 20L80 80Z" fill="none" stroke="#E8414B" stroke-width="6" stroke-linejoin="round"/>'),
    zoo: I('<rect x="8" y="16" width="38" height="32" rx="5" fill="#E2A15B" ' + S + '/><rect x="54" y="16" width="38" height="32" rx="5" fill="#E2A15B" ' + S + '/><rect x="8" y="56" width="38" height="32" rx="5" fill="#BFE7A2" ' + S + '/><rect x="54" y="56" width="38" height="32" rx="5" fill="#E2A15B" ' + S + '/><circle cx="27" cy="72" r="8" fill="#FFF" ' + S + '/>'),
    hands: I('<rect x="34" y="14" width="32" height="30" rx="6" fill="#FFD9A8" ' + S + '/><rect x="30" y="46" width="40" height="40" rx="6" fill="#4FB3FF" ' + S + '/><circle cx="14" cy="64" r="11" fill="#E8414B" ' + S + '/><circle cx="86" cy="64" r="9" fill="#FFC93C" ' + S + '/>'),
    happened: I('<rect x="6" y="26" width="36" height="46" rx="5" fill="#FFF" ' + S + '/><rect x="58" y="26" width="36" height="46" rx="5" fill="#FFF" ' + S + '/><path d="M44 50h10M50 44l6 6-6 6" fill="none" ' + S + '/><circle cx="24" cy="50" r="7" fill="#FFC93C"/><circle cx="70" cy="44" r="7" fill="#FFC93C"/><circle cx="82" cy="58" r="7" fill="#FFC93C"/>'),
    kites: I('<path d="M24 8L40 26L24 44L8 26Z" fill="#E8414B" ' + S + '/><path d="M76 8L92 26L76 44L60 26Z" fill="#4FB3FF" ' + S + '/><path d="M24 44Q60 64 70 92M76 44Q40 64 30 92" fill="none" stroke="' + k + '" stroke-width="3"/>'),
    candy: I('<rect x="6" y="20" width="40" height="60" rx="6" fill="#FFF" ' + S + '/><rect x="54" y="20" width="40" height="60" rx="6" fill="#FFF" ' + S + '/><circle cx="26" cy="38" r="7" fill="#FF7FA8"/><circle cx="26" cy="62" r="7" fill="#4FB3FF"/><circle cx="74" cy="38" r="7" fill="#FF7FA8"/><circle cx="74" cy="62" r="7" fill="#5CC46E"/>'),
    tri: I('<path d="M10 86L50 14L90 86Z" fill="#FFF" ' + S + '/><path d="M50 14V86M30 50L70 50" stroke="' + k + '" stroke-width="3"/><path d="M50 50L70 50L50 86Z" fill="#4FB3FF"/>'),
    table: I('<rect x="8" y="12" width="84" height="76" rx="6" fill="#FFF" ' + S + '/><path d="M8 38H92M8 62H92M38 12V88" stroke="' + k + '" stroke-width="3"/><circle cx="23" cy="25" r="7" fill="#E8414B"/><path d="M16 56L23 44L30 56Z" fill="#4FB3FF"/><rect x="16" y="68" width="14" height="14" fill="#5CC46E"/>'),
    split: I('<rect x="8" y="34" width="84" height="32" rx="8" fill="#FFF3C4" ' + S + '/><circle cx="24" cy="50" r="8" fill="#FFF" ' + S + '/><circle cx="76" cy="50" r="8" fill="#FFF" ' + S + '/><circle cx="58" cy="50" r="8" fill="#FFF" ' + S + '/><path d="M42 26V74" stroke="#E8414B" stroke-width="7" stroke-linecap="round"/>'),
    sort: I('<rect x="6" y="50" width="40" height="38" rx="5" fill="#E8414B" ' + S + '/><rect x="54" y="50" width="40" height="38" rx="5" fill="#4FB3FF" ' + S + '/><circle cx="26" cy="30" r="12" fill="#E8414B" ' + S + '/><rect x="62" y="18" width="24" height="24" fill="#4FB3FF" ' + S + '/>'),
    route: I('<rect x="8" y="8" width="84" height="84" rx="6" fill="#BFE7A2" ' + S + '/><path d="M20 80V50H50V20H80" fill="none" stroke="#E8414B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="80" r="6" fill="' + k + '"/>'),
    arrows: I('<path d="M10 34H32M24 26l8 8-8 8M40 34H62M54 26l8 8-8 8" fill="none" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/><path d="M80 74V48M72 56l8-8 8 8" fill="none" stroke="#E8414B" stroke-width="6" stroke-linecap="round"/>'),
    roles: I('<rect x="4" y="34" width="24" height="32" rx="4" fill="#FFF" stroke="' + k + '" stroke-width="3" stroke-dasharray="5 3"/><path d="M34 50h10" stroke="' + k + '" stroke-width="6"/><rect x="50" y="34" width="24" height="32" rx="4" fill="#FFF" stroke="' + k + '" stroke-width="3" stroke-dasharray="5 3"/><path d="M80 44h14M80 56h14" stroke="' + k + '" stroke-width="5"/>'),
    seats: I('<rect x="6" y="30" width="88" height="44" rx="18" fill="#FFF" ' + S + '/><circle cx="28" cy="52" r="10" fill="#E8554A" ' + S + '/><circle cx="50" cy="52" r="10" fill="#FFF" ' + S + '/><circle cx="72" cy="52" r="10" fill="#4FB3FF" ' + S + '/>'),
    fold: I('<path d="M50 12C30 12 18 30 22 50C26 72 40 86 50 90C60 86 74 72 78 50C82 30 70 12 50 12Z" fill="#E8414B" ' + S + '/><path d="M50 6V94" stroke="' + k + '" stroke-width="3" stroke-dasharray="6 5"/>'),
    groups: I('<g fill="#46C27A" ' + S + '><circle cx="20" cy="30" r="9"/><circle cx="40" cy="30" r="9"/><circle cx="64" cy="30" r="9"/><circle cx="84" cy="30" r="9"/><circle cx="30" cy="70" r="9"/></g><path d="M8 30C8 14 52 14 52 30C52 46 8 46 8 30Z" fill="none" stroke="#E8414B" stroke-width="3"/>'),
    fields: I('<rect x="8" y="8" width="40" height="40" fill="#BFE7A2" ' + S + '/><rect x="52" y="8" width="40" height="64" fill="#C98B4A" ' + S + '/><rect x="8" y="52" width="40" height="40" fill="#BFE7A2" ' + S + '/><path d="M28 8V48M8 28H48" stroke="' + k + '" stroke-width="2"/>'),
    search: I('<circle cx="42" cy="42" r="26" fill="#DFF3FF" stroke="' + k + '" stroke-width="6"/><path d="M62 62L88 88" stroke="' + k + '" stroke-width="9" stroke-linecap="round"/><path d="M42 28L46 38H56L48 44L51 54L42 48L33 54L36 44L28 38H38Z" fill="#FFC93C" stroke="' + k + '" stroke-width="2"/>'),
    photo: I('<rect x="10" y="30" width="80" height="54" rx="8" fill="#FFF" ' + S + '/><rect x="36" y="18" width="28" height="14" rx="3" fill="#FFF" ' + S + '/><circle cx="50" cy="56" r="16" fill="#4FB3FF" ' + S + '/>'),
    rope: I('<path d="M10 70Q24 20 40 60T70 40T92 60" fill="none" stroke="#B97A3C" stroke-width="7" stroke-linecap="round"/><path d="M10 88H92" stroke="' + k + '" stroke-width="4" stroke-dasharray="8 5"/>'),
    queue: I('<g fill="#FFD9A8" ' + S + '><rect x="6" y="40" width="18" height="40" rx="4"/><rect x="30" y="40" width="18" height="40" rx="4"/><rect x="54" y="40" width="18" height="40" rx="4"/><rect x="78" y="40" width="18" height="40" rx="4"/></g><path d="M87 40V14L97 20L87 26" fill="#E8414B" stroke="' + k + '" stroke-width="3"/>'),
    measure: I('<g ' + S + '><rect x="12" y="62" width="30" height="26" fill="#4FB3FF"/><rect x="12" y="36" width="30" height="26" fill="#4FB3FF"/><rect x="58" y="74" width="30" height="14" fill="#FFC93C"/><rect x="58" y="60" width="30" height="14" fill="#FFC93C"/><rect x="58" y="46" width="30" height="14" fill="#FFC93C"/><rect x="58" y="32" width="30" height="14" fill="#FFC93C"/></g>'),
    planes: I('<path d="M8 40L40 34L46 18H54L52 34L74 30L76 40L52 44L54 58H46L40 46L8 44Z" fill="#DFF3FF" stroke="' + k + '" stroke-width="3"/><text x="66" y="92" font-size="40" font-weight="900" text-anchor="middle" fill="#E8414B">+</text><text x="26" y="92" font-size="40" font-weight="900" text-anchor="middle" fill="#2E6FD8">−</text>'),
    cut: I('<rect x="10" y="22" width="80" height="56" fill="#C8D3E0" ' + S + '/><path d="M50 14V86" stroke="#E8414B" stroke-width="6" stroke-dasharray="8 5"/>'),
    tiles: I('<g ' + S + '><rect x="10" y="10" width="38" height="38" fill="#4FB3FF"/><rect x="52" y="10" width="38" height="38" fill="#4FB3FF"/><rect x="10" y="52" width="38" height="38" fill="#4FB3FF"/><rect x="52" y="52" width="38" height="38" fill="#4FB3FF"/></g><path d="M10 48L48 10V48ZM90 48L52 10H90ZM10 52H48L10 90ZM52 52H90L90 90Z" fill="#FFC93C"/>'),
    wall: I('<rect x="6" y="12" width="88" height="76" rx="4" fill="#C98B4A" ' + S + '/><path d="M30 40H54V54H70V76H30Z" fill="#2B2118"/>'),
    /* §16: 变形金刚·积木厂 and 奥特曼·积木光之国 */
    assem: I('<rect x="8" y="8" width="84" height="84" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="3" stroke-dasharray="6 4"/><rect x="38" y="40" width="24" height="24" fill="#E8413A" ' + S + '/><rect x="38" y="14" width="24" height="24" fill="#FFC93C" ' + S + '/><rect x="64" y="40" width="24" height="24" fill="#4FB3FF" ' + S + '/>'),
    morph: I('<rect x="6" y="52" width="40" height="22" rx="5" fill="#FFC93C" ' + S + '/><circle cx="16" cy="78" r="7" fill="' + k + '"/><circle cx="36" cy="78" r="7" fill="' + k + '"/><path d="M50 50h8M54 46l6 4-6 4" fill="none" ' + S + '/><rect x="66" y="16" width="20" height="18" fill="#FFC93C" ' + S + '/><rect x="62" y="36" width="28" height="32" fill="#FFC93C" ' + S + '/><rect x="64" y="70" width="10" height="18" fill="' + k + '"/><rect x="78" y="70" width="10" height="18" fill="' + k + '"/>'),
    fix: I('<rect x="6" y="18" width="88" height="56" rx="6" fill="#2E5E3E" ' + S + '/><text x="50" y="58" font-size="28" font-weight="900" text-anchor="middle" fill="#fff">5−3</text><path d="M56 84l10 10 22-26" fill="none" stroke="#5CC46E" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'),
    park: I('<rect x="6" y="6" width="88" height="88" rx="6" fill="#DCE6F5" ' + S + '/><rect x="12" y="40" width="40" height="20" rx="5" fill="#E8413A" ' + S + '/><rect x="58" y="14" width="18" height="40" rx="5" fill="#FFC93C" ' + S + '/><path d="M94 50h-8" stroke="#5CC46E" stroke-width="8"/>'),
    beam: I('<path d="M8 30H62V82" fill="none" stroke="#FFE066" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 18L74 42" stroke="#4FB3FF" stroke-width="8" stroke-linecap="round"/><circle cx="62" cy="86" r="9" fill="#FFC93C" ' + S + '/>'),
    scale: I('<rect x="8" y="58" width="16" height="16" fill="#4FB3FF" ' + S + '/><rect x="24" y="58" width="16" height="16" fill="#4FB3FF" ' + S + '/><path d="M44 66h8M48 62l6 4-6 4" fill="none" ' + S + '/><rect x="58" y="42" width="16" height="16" fill="#4FB3FF" ' + S + '/><rect x="74" y="42" width="16" height="16" fill="#4FB3FF" ' + S + '/><rect x="58" y="58" width="16" height="16" fill="#4FB3FF" ' + S + '/><rect x="74" y="58" width="16" height="16" fill="#4FB3FF" ' + S + '/>'),
    sticks: I('<path d="M20 80V44H60V80ZM20 44L40 18L60 44" fill="none" stroke="#7FE3FF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><g fill="' + k + '"><circle cx="20" cy="80" r="4"/><circle cx="60" cy="80" r="4"/><circle cx="20" cy="44" r="4"/><circle cx="60" cy="44" r="4"/><circle cx="40" cy="18" r="4"/></g><text x="80" y="70" font-size="26" font-weight="900" text-anchor="middle" fill="' + k + '">?</text>'),
    peek: I('<circle cx="30" cy="30" r="12" fill="#B57BFF" ' + S + '/><circle cx="26" cy="28" r="3" fill="' + k + '"/><circle cx="34" cy="28" r="3" fill="' + k + '"/><rect x="18" y="38" width="46" height="54" rx="4" fill="#BFE4FF" ' + S + '/><path d="M64 80Q82 80 88 66" fill="none" stroke="#B57BFF" stroke-width="7" stroke-linecap="round"/>'),
  };
})();
[
  ['P5', 'peppa5', 'peppa_blockroom', 'peppa_porch', ['george', 'peppa'], 'george', IC5.hide, 'pos', 0, ['dino', 'teddy', 'bunny', 'duck', 'chick', 'kitten', 'turtle', 'bush']],
  ['P6', 'peppa5', 'peppa_stage', 'peppa_garden', ['peppa', 'mummy_pig'], 'peppa', IC5.stage, 'add10', 0, ['duck', 'chick', 'bunny', 'cookie', 'plate']],
  ['P7', 'peppa5', 'peppa_easel', 'peppa_artroom', ['daddy_pig', 'george'], 'daddy_pig', IC5.pegs, 'shape', 0],
  ['P8', 'peppa5', 'peppa_zoo', 'peppa_playground', ['mummy_pig', 'peppa'], 'mummy_pig', IC5.zoo, null, 0],
  ['B5', 'bluey5', 'bluey_blockyard', 'bluey_yard', ['bandit', 'bluey'], 'bandit', IC5.hands, 'pos', 0, ['balloon', 'flower', 'icecream', 'ball', 'kitten', 'teddy']],
  ['B6', 'bluey5', 'bluey_pool', 'bluey_creek', ['chilli', 'bingo'], 'chilli', IC5.happened, 'sub10', 0, ['duck', 'chick', 'bunny', 'cookie', 'plate', 'carrot']],
  ['B7', 'bluey5', 'bluey_kitepark', 'bluey_picnic', ['bingo', 'bluey'], 'bingo', IC5.kites, null, 0, ['bunny', 'duck', 'kitten', 'chick', 'sheep']],
  ['B8', 'bluey5', 'bluey_candyshop', 'bluey_shop', ['bluey', 'bingo'], 'bluey', IC5.candy, null, 0],
  ['J5', 'pjmasks5', 'pj_workshop', 'pj_hqlab', ['gekko', 'catboy'], 'gekko', IC5.tri, 'shape', 0],
  ['J6', 'pjmasks5', 'pj_robotlab', 'pj_moonlab', ['pj_robot', 'owlette'], 'pj_robot', IC5.table, 'shape', 0],
  ['J7', 'pjmasks5', 'pj_canteen', 'pj_hq', ['owlette', 'gekko'], 'owlette', IC5.split, 'part10', 0, ['bun']],
  ['J8', 'pjmasks5', 'pj_toyroom', 'pj_museum', ['catboy', 'romeo'], 'catboy', IC5.sort, null, 0],
  ['A5', 'paw5', 'paw_mapmat', 'paw_city', ['chase', 'skye'], 'chase', IC5.route, null, 0, ['bone', 'policecar', 'kitten', 'puddle', 'key', 'teddy']],
  ['A6', 'paw5', 'paw_townmat', 'paw_control', ['skye', 'chase'], 'skye', IC5.arrows, 'pos', 0],
  ['A7', 'paw5', 'paw_classroom', 'paw_controlroom', ['rocky', 'marshall'], 'rocky', IC5.roles, 'sub10', -1, ['fish', 'duck', 'chick', 'bunny', 'cookie', 'apple']],
  ['A8', 'paw5', 'paw_busstop', 'paw_townpark', ['ryder', 'rubble'], 'ryder', IC5.seats, null, 0],
  ['H5', 'huluwa5', 'huluwa_papercut', 'huluwa_study', ['gourd7', 'grandpa'], 'gourd7', IC5.fold, 'shape', 0],
  ['H6', 'huluwa5', 'huluwa_orchard', 'huluwa_meadow', ['gourd1', 'gourd2'], 'gourd1', IC5.groups, null, 0, ['gourd', 'peach']],
  ['H7', 'huluwa5', 'huluwa_fields', 'huluwa_terraces', ['grandpa', 'gourd6'], 'grandpa', IC5.fields, null, 0, ['broccoli', 'carrot', 'radish', 'pumpkin']],
  ['H8', 'huluwa5', 'huluwa_treasure5', 'huluwa_treasure', ['gourd2', 'snake'], 'gourd2', IC5.search, null, 0],
  ['X5', 'xiyou5', 'xiyou_courtyard', 'xiyou_temple', ['bajie', 'wukong'], 'bajie', IC5.photo, 'pos', 0, ['peach']],
  ['X6', 'xiyou5', 'xiyou_vinegrove', 'xiyou_peak', ['wukong', 'tangseng'], 'wukong', IC5.rope, null, 0],
  ['X7', 'xiyou5', 'xiyou_mountainroad', 'xiyou_cliffs', ['tangseng', 'shaseng'], 'tangseng', IC5.queue, null, 0],
  ['X8', 'xiyou5', 'xiyou_templehall', 'xiyou_palace', ['shaseng', 'bajie'], 'shaseng', IC5.measure, null, 0, ['peach']],
  ['V5', 'avengers5', 'avengers_hangar5', 'avengers_hangar', ['captain', 'thor'], 'captain', IC5.planes, 'op10', 0, ['duck', 'cookie', 'beachball', 'apple', 'fish']],
  ['V6', 'avengers5', 'avengers_workshop', 'avengers_lab', ['ironman', 'spiderman'], 'ironman', IC5.cut, 'shape', -1],
  ['V7', 'avengers5', 'avengers_tilehall', 'avengers_armory', ['panther', 'widow'], 'panther', IC5.tiles, null, 0],
  ['V8', 'avengers5', 'avengers_yard', 'avengers_field', ['hulk', 'captain'], 'hulk', IC5.wall, 'pos', 0],
  /* §16 (client 2026-10-19): 变形金刚·积木厂 (raw/js/w5/transformers.js) and 奥特曼·积木光之国 (raw/js/w5/ultraman.js); fallback
     backgrounds: the sky's Autobot rooms, 字字岛's land of light (zz_, the client's pictures) */
  ['Z5', 'trans5', 'trans_assembly', 'trans_hangar', ['optimus', 'bumblebee'], 'optimus', IC5.assem, 'pos', 0],
  ['Z6', 'trans5', 'trans_garage5', 'trans_dock', ['bumblebee', 'optimus'], 'bumblebee', IC5.morph, 'shape', 0],
  ['Z7', 'trans5', 'trans_school', 'trans_control', ['bumblebee', 'optimus'], 'bumblebee', IC5.fix, 'sub10', 0, ['crate', 'car', 'duck', 'fish']],
  ['Z8', 'trans5', 'trans_yard', 'paw_mapmat', ['optimus', 'bumblebee'], 'optimus', IC5.park, null, 0],
  ['U5', 'ultra5', 'ultra_crystalhall', 'zz_ultra2_quiz', ['ultraman', 'kaiju2'], 'ultraman', IC5.beam, null, 0],
  ['U6', 'ultra5', 'ultra_lab', 'zz_ultra4_abc', ['zero', 'ultraman'], 'zero', IC5.scale, 'shape', 0],
  ['U7', 'ultra5', 'ultra_plaza', 'zz_ultra_find', ['zero', 'kaiju1'], 'zero', IC5.sticks, 'shape', 0],
  ['U8', 'ultra5', 'ultra_street', 'zz_ultra4_write', ['ultraman', 'kaiju1', 'kaiju2'], 'ultraman', IC5.peek, null, 0],
].forEach(([id, world, bg, fb, chars, host, icon, card, boost, props]) => {
  const r = W5R[id];
  w5Game(r, { id, world, bg: W5HAVE.has(bg) ? bg : fb, chars, host, iconSrc: icon, boost: boost || (r && r.boost) || 0, props: (props || []).concat((r && r.props) || []) });
  if (card) W5CARD[id] = card;
});
/* a card counts once its question type is in (SKILLS has it): now, and again when v2games.js (the review types) arrives */
W5.cardsIn = () => Object.keys(W5CARD).forEach(id => { if (SKILLS[W5CARD[id]]) GAMECARD[id] = W5CARD[id]; });
W5.cardsIn();
W5.ready = true;
W3.w5in = true;
