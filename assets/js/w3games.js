/* 点点岛 · the sky (world 3): the 28 games. Loaded after the entry tap by W3.load() in index.html. */
"use strict";
/* ================================================================ five options and "why" after a wrong answer (the client,
   2026-10-10, docs/OPTIONS-EXPLAIN-SPEC.md): every choice offers 5 (one right, its place dealt from a bag so it is in each
   place as often); a choice with only 2-3 possible answers asks two of them in one question. After a wrong answer the
   child SEES why: his choice gets a blue ring (never red, never a cross), the right one a gold ring, and the game shows
   why it is right. Every new line <= 8 characters, all listed in raw/js/w4/w3explain.voice.txt (recorded). */
Object.assign(W3X, {
  BLUE: '#4F7BFF', GOLD: '#FFC93C',
  /* the right one among the wrong ones; its place comes from a bag (each of the n places equally often) */
  deal(G, right, wrongs, key) {
    const n = wrongs.length + 1, pos = bagPick(G, 'deal.' + (key || '') + n, Array.from({ length: n }, (_, i) => i)), w = G.rng.shuffle(wrongs.slice());
    return Array.from({ length: n }, (_, i) => (i === pos ? right : w[i < pos ? i : i - 1]));
  },
  /* the first `n` different ones of a list (by a key) */
  uniq(list, keyOf, n, not) { const seen = new Set((not || []).map(keyOf)), out = []; list.forEach(x => { const k = keyOf(x); if (out.length < n && !seen.has(k)) { seen.add(k); out.push(x); } }); return out; },
  /* n equal boxes (w x w*k) in a frame {x, y, w, h}: as big as fits (<= max), the fewest rows, the last row centred */
  grid(n, fr, max, gap, k) {
    gap = gap == null ? 18 : gap; k = k || 1; let best = null;
    for (let cols = n; cols >= 1; cols--) { const rows = Math.ceil(n / cols), s = Math.min(max, (fr.w - (cols - 1) * gap) / cols, ((fr.h - (rows - 1) * gap) / rows) / k); if (!best || s > best.s + 0.5) best = { s, cols, rows }; }
    best.cols = Math.ceil(n / best.rows);                      /* 5 in two rows: 3 + 2 */
    const w = Math.floor(best.s), h = Math.floor(best.s * k), pos = [];
    for (let i = 0; i < n; i++) { const r = Math.floor(i / best.cols), inRow = Math.min(best.cols, n - r * best.cols), c = i % best.cols; pos.push({ x: Math.round(fr.x + fr.w / 2 + (c - (inRow - 1) / 2) * (w + gap) - w / 2), y: Math.round(fr.y + fr.h / 2 + (r - (best.rows - 1) / 2) * (h + gap) - h / 2) }); }
    return { w, h, pos, cols: best.cols, rows: best.rows };
  },
  /* the card size that fits both orientations (a card keeps its size when the iPad turns) */
  size2(n, frs, max, gap, k) { return Math.min(...frs.map(f => this.grid(n, f, max, gap, k).w)); },
  /* place elements of a fixed size in a frame, in rows */
  lay(els, fr, w, h, gap) {
    h = h || w; gap = gap == null ? 18 : gap;
    let cols = Math.max(1, Math.min(els.length, Math.floor((fr.w + gap) / (w + gap)))); const rows = Math.ceil(els.length / cols);
    cols = Math.ceil(els.length / rows);                       /* 5 in two rows: 3 + 2, not 4 + 1 */
    els.forEach((e, i) => {
      const r = Math.floor(i / cols), inRow = Math.min(cols, els.length - r * cols), c = i % cols;
      place(e, Math.round(fr.x + fr.w / 2 + (c - (inRow - 1) / 2) * (w + gap) - w / 2), Math.round(fr.y + fr.h / 2 + (r - (rows - 1) / 2) * (h + gap) - h / 2), w, h);
    });
  },
  /* an element's box in stage px (also for a drawing inside a card) */
  srect(e) { const r = e.getBoundingClientRect(), a = Stage.toStage(r.left, r.top), b = Stage.toStage(r.right, r.bottom); return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }; },
  /* a review question's plate covers the stage (z 60): the explanation's rings and badges go above it */
  up(st, e) { if (e && st && st.game && st.game.review) e.style.setProperty('z-index', '75', 'important'); return e; },
  /* the child's choice: a blue ring and a little shake (no red, no cross) */
  mine(st, e, pad) { if (!e) return null; if (e.classList) e.classList.remove('hi'); K.wiggle(st, e);          /* his pick's glow off: only the blue ring marks it */
    return this.up(st, K.ring(st, [e.style && e.style.left ? box(e) : this.srect(e)], pad == null ? 8 : pad, this.BLUE)); },
  /* the right one: a gold ring and a hop */
  gold(st, e, pad, h) { if (!e) return null; if (h !== 0) K.hop(st, e, h || 16); return this.up(st, K.ring(st, [e.style && e.style.left ? box(e) : this.srect(e)], pad == null ? 8 : pad, this.GOLD)); },
  ringAt(st, r, color, pad) { return this.up(st, K.ring(st, [r], pad == null ? 6 : pad, color || this.BLUE)); },
  /* a number badge centred on a point (stage px) */
  badgeAt(st, x, y, n, size) { size = size || 44; const b = UI.badge(n, size); Stage.el.appendChild(b); b.style.position = 'absolute'; place(b, Math.round(x - size / 2), Math.round(y - size / 2)); st.els.push(b); this.up(st, b); st.scope.anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 260, easing: EASE.pop }); return b; },
  /* a point of an svg drawing (its viewBox units) in stage px */
  svgPt(s, x, y) { const r = this.srect(s), vb = (s.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number), k = Math.min(r.w / vb[2], r.h / vb[3]); return { x: r.x + (r.w - vb[2] * k) / 2 + (x - vb[0]) * k, y: r.y + (r.h - vb[3] * k) / 2 + (y - vb[1]) * k, k }; },
  /* a line of the explanation (tag 'summary': a tap that skips also stops it) */
  tell(text) { return Voice.say(text, { tag: 'summary' }); },
  /* wait for what is being said (at most ms), or ms */
  async beat(st, ms) { await st.scope.guard(Promise.race([Voice.afterSay(80), st.scope.wait(ms)])); },
  /* a dashed ring / box / line drawn inside an svg (in its own units) */
  sv(parent, tag, a) { return svg(tag, a, parent); },
  ringIn(s, cx, cy, r, color, sw) { return svg('circle', { cx, cy, r, fill: 'none', stroke: color || this.BLUE, 'stroke-width': sw || 4, 'stroke-dasharray': (sw || 4) * 1.6 + ' ' + (sw || 4) * 1.2, 'stroke-linecap': 'round' }, s); },
  boxIn(s, x, y, w, h, color, sw) { return svg('rect', { x, y, width: w, height: h, rx: Math.min(w, h) * 0.18, fill: 'none', stroke: color || this.BLUE, 'stroke-width': sw || 4, 'stroke-dasharray': (sw || 4) * 1.6 + ' ' + (sw || 4) * 1.2, 'stroke-linecap': 'round' }, s); },
  lineIn(s, x1, y1, x2, y2, color, sw) { return svg('line', { x1, y1, x2, y2, stroke: color || this.BLUE, 'stroke-width': sw || 5, 'stroke-dasharray': (sw || 5) * 1.6 + ' ' + (sw || 5) * 1.3, 'stroke-linecap': 'round' }, s); },
  /* tests: a question with number options - how many, where the right one is, exactly one right, no two alike */
  auditNum(q) { const o = q.opts || []; return { n: o.length, pos: o.indexOf(q.answer), err: o.filter(v => v === q.answer).length === 1 && new Set(o.map(String)).size === o.length ? null : 'options ' + JSON.stringify(o) }; },
  /* the usual explanation of a card question: his card (blue), what makes the right one right (show), the right one (gold) */
  async explainCards(st, ans, opt) {
    opt = opt || {}; const my = st;
    const cs = st.cards || [], ia = opt.mine != null ? opt.mine : (st.opts || []).indexOf(ans), ir = opt.right != null ? opt.right : (st.opts || []).indexOf(st.q.answer);
    if (cs[ia]) this.mine(st, cs[ia]);
    if (opt.why) { await opt.why(); if (!Session.alive(my)) return; }
    await st.scope.wait(T(500)); if (!Session.alive(my)) return;
    if (opt.show) { await opt.show(); if (!Session.alive(my)) return; }
    if (cs[ir]) this.gold(st, cs[ir]);
    Sfx.reveal();
    this.tell(opt.line || '对的是这个！');
    await this.beat(st, 1600);
  },
});

/* ================================================================ 佩奇 E1 · 切 equal parts: which cake is cut into equal pieces / which is half */
const MHalves = {
  kind0: 'halves', verb: '切！', intro: '帮猪爸爸切蛋糕！', praise: ['切得真公平！'],
  /* region polygons in a 200 x 200 box (clipped by the shape) */
  far: 420,
  half(P, th, side) { const u = [Math.cos(th), Math.sin(th)], n = [-u[1] * side, u[0] * side], L = this.far; return [[P[0] + u[0] * L, P[1] + u[1] * L], [P[0] + u[0] * L + n[0] * L, P[1] + u[1] * L + n[1] * L], [P[0] - u[0] * L + n[0] * L, P[1] - u[1] * L + n[1] * L], [P[0] - u[0] * L, P[1] - u[1] * L]]; },
  quads(P, th) { const L = this.far, u = [Math.cos(th), Math.sin(th)], n = [-u[1], u[0]], d = [[u, n], [n, [-u[0], -u[1]]], [[-u[0], -u[1]], [-n[0], -n[1]]], [[-n[0], -n[1]], u]]; return d.map(([a, b]) => [P, [P[0] + a[0] * L, P[1] + a[1] * L], [P[0] + (a[0] + b[0]) * L, P[1] + (a[1] + b[1]) * L], [P[0] + b[0] * L, P[1] + b[1] * L]]); },
  sectors(angles) { const C = [100, 100], L = this.far, out = []; for (let i = 0; i < angles.length; i++) { const a0 = angles[i], a1 = i + 1 < angles.length ? angles[i + 1] : angles[0] + 360, p = [C]; for (let a = a0; a < a1; a += 20) p.push([C[0] + L * Math.cos(a * Math.PI / 180), C[1] + L * Math.sin(a * Math.PI / 180)]); p.push([C[0] + L * Math.cos(a1 * Math.PI / 180), C[1] + L * Math.sin(a1 * Math.PI / 180)]); out.push(p); } return out; },
  strips(sh, fr, vert) { const b = this.bounds(sh), out = []; let a = 0; fr.forEach(f => { const s = a, e = a + f; a = e; out.push(vert ? [[b.x + b.w * s, b.y - 40], [b.x + b.w * e, b.y - 40], [b.x + b.w * e, b.y + b.h + 40], [b.x + b.w * s, b.y + b.h + 40]] : [[b.x - 40, b.y + b.h * s], [b.x + b.w + 40, b.y + b.h * s], [b.x + b.w + 40, b.y + b.h * e], [b.x - 40, b.y + b.h * e]]); }); return out; },
  bounds(sh) { return sh === 'circle' ? { x: 16, y: 16, w: 168, h: 168 } : sh === 'square' ? { x: 18, y: 18, w: 164, h: 164 } : { x: 8, y: 48, w: 184, h: 104 }; },
  /* one option: shape, regions, shaded indices and what is wrong with it (for the feedback) */
  opt(rng, kind, sh) {
    const C = [100, 100], th = sh === 'circle' ? rng.pick([0, 45, 90, 135]) * Math.PI / 180 : sh === 'square' ? rng.pick([0, 90, 45, 135]) * Math.PI / 180 : rng.pick([0, 90]) * Math.PI / 180;
    const vert = sh === 'rect' ? true : rng() < 0.5, off = (rng() < 0.5 ? -1 : 1) * (sh === 'rect' ? 30 : 36);
    let regs, why = 'ok', qth = 0, a = 0;
    if (kind === 'mid') regs = [this.half(C, th, 1), this.half(C, th, -1)];
    else if (kind === 'off') { const P = [C[0] - Math.sin(th) * off, C[1] + Math.cos(th) * off]; regs = [this.half(P, th, 1), this.half(P, th, -1)]; why = 'uneq'; }
    else if (kind === 'cross') { qth = sh === 'circle' ? rng.pick([0, 45]) * Math.PI / 180 : 0; regs = this.quads(C, qth); }
    else if (kind === 'offcross') { regs = this.quads([C[0] + (rng() < 0.5 ? -26 : 26), C[1] + (rng() < 0.5 ? -24 : 24)], 0); why = 'uneq'; }
    else if (kind === 'strips4') regs = this.strips(sh, [0.25, 0.25, 0.25, 0.25], vert);
    else if (kind === 'ustrips4') { regs = this.strips(sh, rng.shuffle([0.12, 0.18, 0.3, 0.4]), vert); why = 'uneq'; }
    else if (kind === 'sect3') { a = rng.int(0, 5) * 20; regs = this.sectors([a - 90, a + 30, a + 150]); }
    else if (kind === 'usect3') { a = rng.int(0, 5) * 20; regs = this.sectors([a - 90, a - 10, a + 110]); why = 'uneq'; }
    else if (kind === 'strips3') regs = this.strips(sh, [1 / 3, 1 / 3, 1 / 3], vert);
    else { regs = this.strips(sh, rng.shuffle([0.18, 0.32, 0.5]), vert); why = 'uneq'; }
    return { sh, kind, th, qth, a, vert, regs: regs.map(r => r.map(p => [Math.round(p[0]), Math.round(p[1])])), shade: [], why, n: regs.length };
  },
  /* equal parts of this shape: four (a cross or strips) / three (sectors of a circle, strips otherwise); the unequal ones */
  eq4(rng, sh) { return sh === 'circle' ? 'cross' : rng.pick(['cross', 'strips4']); },
  eq3(sh) { return sh === 'circle' ? 'sect3' : 'strips3'; },
  un4(rng, sh) { return sh === 'circle' ? 'offcross' : rng.pick(['offcross', 'ustrips4']); },
  un3(sh) { return sh === 'circle' ? 'usect3' : 'ustrips3'; },
  sig(x) { return x.sh + JSON.stringify(x.regs) + '/' + x.shade.join(''); },
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const ask = d <= 2 ? 'two' : d === 3 ? 'four' : d === 4 ? 'half' : bagPick(G, 'hv5', ['three', 'half2']);
    const shp = () => (d === 1 ? 'circle' : rng.pick(['circle', 'square', 'rect']));
    const O = (k, sh, shade, why) => { const s = sh || shp(), x = this.opt(rng, typeof k === 'function' ? k(s) : k, s); if (shade) x.shade = shade; if (why) x.why = why; return x; };
    /* the right one and four different wrong ones: unequal parts, the wrong number of parts, too little / too much painted */
    let right, pool;
    if (ask === 'two') { right = O('mid'); pool = Array.from({ length: 10 }, (_, i) => (d >= 2 && i === 2 ? O(rng.pick([s => this.eq4(rng, s), s => this.eq3(s)])) : O('off'))); }
    else if (ask === 'four') { right = O(s => this.eq4(rng, s)); pool = [O(s => this.un4(rng, s)), O(s => this.un4(rng, s)), O('mid'), O(s => this.eq3(s))].concat(Array.from({ length: 6 }, () => O(s => this.un4(rng, s)))); }
    else if (ask === 'three') { right = O(s => this.eq3(s)); pool = [O(s => this.un3(s)), O(s => this.un3(s)), O(s => this.eq4(rng, s)), O('mid')].concat(Array.from({ length: 6 }, () => O(s => this.un3(s)))); }
    else if (ask === 'half') {
      right = O('mid', null, [rng.int(0, 1)]);
      pool = [O(s => this.eq4(rng, s), null, [rng.int(0, 3)], 'less'), O('off', null, [rng.int(0, 1)], 'uneqh'), O(s => this.eq4(rng, s), null, rng.pick([[0, 1, 2], [1, 2, 3], [0, 1, 3]]), 'more'), O(s => this.eq3(s), null, [rng.int(0, 2)], 'less')]
        .concat(Array.from({ length: 6 }, (_, i) => (i % 2 ? O('off', null, [rng.int(0, 1)], 'uneqh') : O(s => this.eq4(rng, s), null, [rng.int(0, 3)], 'less'))));
    } else {                                    /* half2: two of four equal pieces are half */
      right = O(s => this.eq4(rng, s), null, rng.pick([[0, 1], [0, 2], [1, 3], [2, 3]]));
      /* unequal pieces, two of them next to each other painted: never half (a cross off the middle, never strips) */
      pool = [O(s => this.eq4(rng, s), null, [rng.int(0, 3)], 'less'), O(s => this.eq4(rng, s), null, rng.pick([[0, 1, 2], [1, 2, 3], [0, 1, 3]]), 'more'), O('offcross', null, rng.pick([[0, 1], [1, 2], [2, 3], [3, 0]]), 'uneqh'), O(s => this.eq3(s), null, rng.pick([[0, 1], [1, 2]]), 'more')]
        .concat(Array.from({ length: 6 }, (_, i) => O(s => this.eq4(rng, s), null, i % 2 ? [rng.int(0, 3)] : rng.pick([[0, 1, 2], [1, 2, 3]]), i % 2 ? 'less' : 'more')));
    }
    const foils = W3X.uniq(pool, x => this.sig(x), 4, [right]);
    while (foils.length < 4) foils.push(O('off', null, ask === 'half' ? [0] : null, ask === 'half' ? 'uneqh' : null));
    const opts = W3X.deal(G, right, foils, 'hv');
    return { k: [ask, opts.map(x => x.sh + x.n + x.why + x.shade.join('')).join()], ask, opts, answer: opts.indexOf(right) };
  },
  /* the lines of a fair cut (an explanation): where the cake should have been cut */
  guides(o, ask) {
    const C = [100, 100], R = 130, b = this.bounds(o.sh), ln = th => [C[0] - Math.cos(th) * R, C[1] - Math.sin(th) * R, C[0] + Math.cos(th) * R, C[1] + Math.sin(th) * R];
    const ray = deg => [C[0], C[1], C[0] + R * Math.cos(deg * Math.PI / 180), C[1] + R * Math.sin(deg * Math.PI / 180)];
    const strips = n => Array.from({ length: n - 1 }, (_, i) => (o.vert ? [b.x + b.w * (i + 1) / n, b.y - 20, b.x + b.w * (i + 1) / n, b.y + b.h + 20] : [b.x - 20, b.y + b.h * (i + 1) / n, b.x + b.w + 20, b.y + b.h * (i + 1) / n]));
    const want = { two: 2, four: 4, three: 3 }[ask];
    if (want && o.n !== want) return null;                                     /* the number of pieces is wrong: they are counted */
    if (ask === 'two') return [ln(o.th)];
    if (ask === 'four') return /strips/.test(o.kind) ? strips(4) : [ln(o.qth), ln(o.qth + Math.PI / 2)];
    if (ask === 'three') return /strips/.test(o.kind) ? strips(3) : [ray(o.a - 90), ray(o.a + 30), ray(o.a + 150)];
    if (o.kind === 'mid' || o.kind === 'off') return [ln(o.th)];             /* half: one line that halves the cake */
    if (/cross/.test(o.kind)) return [ln(o.qth)];
    if (/strips/.test(o.kind)) return o.vert ? [[100, b.y - 20, 100, b.y + b.h + 20]] : [[b.x - 20, 100, b.x + b.w + 20, 100]];
    return [ln((o.a - 90) * Math.PI / 180)];
  },
  /* the middle of a piece (inside the cake), in the drawing's units */
  mid(o, i) {
    const r = o.regs[i], b = this.bounds(o.sh), inPoly = (x, y) => { let c = false; for (let a = 0, z = r.length - 1; a < r.length; z = a++) { const [xa, ya] = r[a], [xz, yz] = r[z]; if ((ya > y) !== (yz > y) && x < (xz - xa) * (y - ya) / (yz - ya) + xa) c = !c; } return c; };
    const inSh = (x, y) => (o.sh === 'circle' ? Math.hypot(x - 100, y - 100) < 80 : x > b.x + 4 && x < b.x + b.w - 4 && y > b.y + 4 && y < b.y + b.h - 4);
    let sx = 0, sy = 0, n = 0; for (let x = 4; x < 200; x += 8) for (let y = 4; y < 200; y += 8) if (inSh(x, y) && inPoly(x, y)) { sx += x; sy += y; n++; }
    return n ? [sx / n, sy / n] : [100, 100];
  },
  /* the pieces of a cake move a little apart */
  burst(st, o) {
    const cen = r => { const xs = r.map(p => Math.max(0, Math.min(200, p[0]))), ys = r.map(p => Math.max(0, Math.min(200, p[1]))); return [(Math.min(...xs) + Math.max(...xs)) / 2 - 100, (Math.min(...ys) + Math.max(...ys)) / 2 - 100]; };
    (o.pieces || []).forEach((g, i) => { const c = cen(o.regs[i]), L = Math.hypot(c[0], c[1]) || 1; st.scope.anim(g, [{ transform: 'translate(0px,0px)' }, { transform: 'translate(' + (c[0] / L * 12).toFixed(1) + 'px,' + (c[1] / L * 12).toFixed(1) + 'px)' }], { duration: 420, easing: EASE.pop, fill: 'forwards' }); });
  },
  /* after a wrong answer: where his cake should have been cut (blue dashes) or its pieces counted; then the right one */
  async explain(st, ans) {
    const q = st.q, my = st, o = q.opts[ans], e = st.cakes[ans], ok = q.opts[q.answer];
    if (o && e) {
      W3X.mine(st, e, 6); this.burst(st, o);
      const s = e.querySelector('svg'), lines = this.guides(o, q.ask);
      if (lines && s) { const g = svg('g', { 'clip-path': 'url(#' + o.clip + ')' }, s); lines.forEach(l => W3X.lineIn(g, l[0], l[1], l[2], l[3], W3X.BLUE, 6)); }
      else if (s) { for (let i = 0; i < o.n; i++) { if (!Session.alive(my)) return; const p = this.mid(o, i), P = W3X.svgPt(s, p[0], p[1]); W3X.badgeAt(st, P.x, P.y, i + 1, 40); await Count.beat(st.scope, 300, i + 1); } }
      await st.scope.wait(T(1300)); if (!Session.alive(my)) return;
    }
    this.burst(st, ok); W3X.gold(st, st.cakes[q.answer], 6); Sfx.reveal();
    W3X.tell(q.ask === 'half' || q.ask === 'half2' ? '涂了一半！' : '一样大的' + { two: '两', four: '四', three: '三' }[q.ask] + '块！');
    await W3X.beat(st, 1600);
  },
  base: { circle: '#FFD3E0', square: '#F6D28B', rect: '#B9855A' },
  draw(o, size) {
    const s = svg('svg', { viewBox: '0 0 200 200', width: size, height: size }), ink = W2X.ink, sh = o.sh, b = this.bounds(sh);
    const id = 'hv' + (MHalves.uid = (MHalves.uid || 0) + 1); o.clip = id;
    const defs = svg('defs', {}, s), cp = svg('clipPath', { id }, defs);
    const shapeAt = (attrs, parent) => sh === 'circle' ? svg('circle', Object.assign({ cx: 100, cy: 100, r: 84 }, attrs), parent) : svg('rect', Object.assign({ x: b.x, y: b.y, width: b.w, height: b.h, rx: sh === 'rect' ? 12 : 16 }, attrs), parent);
    shapeAt({}, cp);
    svg('ellipse', { cx: 100, cy: 188, rx: 92, ry: 10, fill: 'rgba(43,33,24,.12)' }, s);
    o.pieces = o.regs.map((r, i) => {
      const g = svg('g', {}, s), inner = svg('g', { 'clip-path': 'url(#' + id + ')' }, g);
      svg('polygon', { points: W2X.pts(r), fill: o.shade.includes(i) ? '#E8414B' : this.base[sh], stroke: ink, 'stroke-width': 4, 'stroke-linejoin': 'round' }, inner);
      if (sh === 'circle' && !o.shade.includes(i)) for (let k = 0; k < 6; k++) { const a = (i * 70 + k * 61) % 360 * Math.PI / 180, rr = 18 + (k * 23) % 56; svg('circle', { cx: 100 + rr * Math.cos(a), cy: 100 + rr * Math.sin(a), r: 3, fill: ['#5CC46E', '#4FB3FF', '#FFC93C'][k % 3] }, inner); }
      return g;
    });
    shapeAt({ fill: 'none', stroke: ink, 'stroke-width': 6 }, s);
    return s;
  },
  /* five cakes: one row in landscape (above the watchers), 3 + 2 in portrait */
  geo() { return K.L() ? { fr: { x: 20, y: 150, w: 984, h: 330 }, max: 214, gap: 16 } : { fr: { x: 16, y: 230, w: 672, h: 620 }, max: 200, gap: 18 }; },
  decor(G) { W3X.decor2(G, this.chars); },
  place(st) { const g = this.geo(), L = W3X.grid(st.cakes.length, g.fr, g.max, g.gap); st.cakes.forEach((e, i) => place(e, L.pos[i].x, L.pos[i].y, L.w, L.w)); },
  askIcon(ask) {
    const ink = W2X.ink;
    if (ask === 'two') return W3X.ic('<path d="M44 20A30 30 0 0 0 44 80Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="5"/><path d="M56 20A30 30 0 0 1 56 80Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="5"/>');
    if (ask === 'four') return W3X.ic('<path d="M46 46H18A28 28 0 0 1 46 18Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="4"/><path d="M54 46V18A28 28 0 0 1 82 46Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="4"/><path d="M46 54V82A28 28 0 0 1 18 54Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="4"/><path d="M54 54H82A28 28 0 0 1 54 82Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="4"/>');
    if (ask === 'three') return W3X.ic('<path d="M50 50V14A36 36 0 0 1 81 68Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="4"/><path d="M50 50L81 68A36 36 0 0 1 19 68Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="4"/><path d="M50 50L19 68A36 36 0 0 1 50 14Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="4"/>');
    return W3X.ic('<path d="M50 14A36 36 0 0 0 50 86Z" fill="#E8414B" stroke="' + ink + '" stroke-width="5"/><path d="M50 14A36 36 0 0 1 50 86Z" fill="#FFD3E0" stroke="' + ink + '" stroke-width="5"/>');
  },
  asks: { two: '哪个两块一样大？', four: '哪个四块一样大？', three: '哪个三块一样大？', half: '哪个涂了一半？', half2: '哪个涂了一半？' },
  async present(st) {
    const q = st.q, g = this.geo();
    st.cakes = q.opts.map((o, i) => { const e = W3X.card(st, 'card' + i, 5, 'card'); e.style.borderRadius = '50%'; e.appendChild(this.draw(o, '92%')); return e; });
    st.cards = st.cakes; st.opts = q.opts.map((_, i) => i);
    this.place(st);
    st.cakes.forEach((e, i) => K.pop(st, e, 90 * i));
    K.task(st, [[this.askIcon(q.ask)], ['q']]);
    K.say(st, this.asks[q.ask]);
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  line(o, ask) {
    const n = o.n, w = { 2: '两', 3: '三', 4: '四' }[n];
    if (o.why === 'uneq' || o.why === 'uneqh') return w + '块不一样大';
    if (o.why === 'less') return '涂得太少啦';
    if (o.why === 'more') return '涂得太多啦';
    return '这是' + w + '块哦';
  },
  why(o, ask) { const need = { two: 2, four: 4, three: 3 }[ask]; if (need && o.n !== need && o.why === 'ok') o.why = 'count'; return o; },
  async reveal(st) {
    const q = st.q, o = q.opts[q.answer], e = st.cakes[q.answer], ink = W2X.ink;
    const cen = r => { const xs = r.map(p => Math.max(0, Math.min(200, p[0]))), ys = r.map(p => Math.max(0, Math.min(200, p[1]))); return [(Math.min(...xs) + Math.max(...xs)) / 2 - 100, (Math.min(...ys) + Math.max(...ys)) / 2 - 100]; };
    (o.pieces || []).forEach((g, i) => { const c = cen(o.regs[i]), L = Math.hypot(c[0], c[1]) || 1; st.scope.anim(g, [{ transform: 'translate(0px,0px)' }, { transform: 'translate(' + (c[0] / L * 12).toFixed(1) + 'px,' + (c[1] / L * 12).toFixed(1) + 'px)' }], { duration: 420, easing: EASE.pop, fill: 'forwards' }); });
    K.ring(st, [box(e)], 6, '#FFC93C'); Sfx.reveal(); this.cheerAll(st);
    st.summary = q.ask === 'half' || q.ask === 'half2' ? '涂了一半！' : '一样大的' + { two: '两', four: '四', three: '三' }[q.ask] + '块！';
    Voice.say(st.summary, { tag: 'summary' });
    const f = q.opts.findIndex((x, i) => i !== q.answer);                         /* and why not the other one (R8-8) */
    await st.scope.guard(Voice.afterSay(200)); if (!Session.alive(st)) return;
    const fo = this.why(q.opts[f], q.ask); K.wiggle(st, st.cakes[f]);
    Voice.say(fo.why === 'less' || fo.why === 'more' || fo.why === 'uneqh' ? '那个不是一半' : fo.why === 'count' ? '那个块数不对' : '那个不一样大', { tag: 'summary' });
    await st.scope.wait(1300);
    void ink;
  },
  async feedback(st, ans) { const o = this.why(st.q.opts[ans], st.q.ask); if (st.cakes[ans]) K.wiggle(st, st.cakes[ans]); W3X.say(this.line(o, st.q.ask)); await st.scope.wait(500); },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.opts.length : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
  workEls(st) { return st.cakes || []; },
  snap(st) { return { opts: st.q.opts.map(o => o.why) }; },
  /* tests: how many choices, where the right one is, and an independent check that only one is right */
  audit(q) { const want = { two: 2, four: 4, three: 3 }[q.ask], good = q.opts.filter(o => o.why === 'ok' && (!want || o.n === want) && (q.ask === 'half' || q.ask === 'half2' ? o.n === 2 * o.shade.length : o.shade.length === 0)); return { n: q.opts.length, pos: q.answer, err: good.length === 1 && good[0] === q.opts[q.answer] ? null : 'right ones: ' + good.length }; },
};

/* ================================================================ 佩奇 E2 · 排 what happens first: picture stories in time order */
const SEQ_ART = (() => {
  const k = '#2B2118', S = (b) => '<g stroke="' + k + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">' + b + '</g>';
  const nest = '<path d="M14 92Q60 124 106 92Q100 84 60 84Q20 84 14 92Z" fill="#B07A3C"/><path d="M26 96L44 92M54 100L74 94M80 98L96 92" stroke="#7A4A1C" stroke-width="3"/>';
  const egg = '<ellipse cx="60" cy="62" rx="24" ry="30" fill="#FFF8EC"/>';
  const chick = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="20" fill="#FFD84A"/><circle cx="' + (x + 7) + '" cy="' + (y - 5) + '" r="3.5" fill="' + k + '" stroke="none"/><path d="M' + (x + 18) + ' ' + y + 'L' + (x + 30) + ' ' + (y + 4) + 'L' + (x + 18) + ' ' + (y + 8) + 'Z" fill="#FF9F43"/>';
  const soil = '<path d="M8 104Q60 76 112 104V116H8Z" fill="#9A6433"/>';
  const leaf = (x, y, r) => '<path d="M' + x + ' ' + y + 'q' + (14 * r) + ' -16 ' + (28 * r) + ' -6q' + (-12 * r) + ' 14 ' + (-28 * r) + ' 6Z" fill="#5CC46E"/>';
  const apple = (b) => '<path d="M60 30C40 18 16 32 18 60C20 90 42 108 60 100C78 108 100 90 102 60C104 32 80 18 60 30Z" fill="#E8414B"/>' + (b || '') + '<path d="M60 30Q60 18 66 10" fill="none"/><path d="M64 18Q78 8 84 18Q74 26 64 18Z" fill="#5CC46E"/>';
  const snow = '<path d="M4 100Q60 90 116 100V116H4Z" fill="#FFFFFF"/>';
  const cake = (top) => '<rect x="22" y="70" width="76" height="36" rx="8" fill="#FFD3E0"/><path d="M22 80Q32 88 42 80Q52 88 62 80Q72 88 82 80Q92 88 98 80" fill="none" stroke="#FFFFFF" stroke-width="5"/><rect x="54" y="40" width="12" height="30" rx="3" fill="#4FB3FF"/>' + (top || '');
  const cone = '<path d="M44 66L60 112L76 66Z" fill="#E8B26A"/><path d="M50 74L66 92M58 70L70 82M48 84L60 98" stroke="#B9855A" stroke-width="3"/>';
  return {
    egg: [S(nest + egg), S(nest + egg + '<path d="M38 60L46 54L52 62L60 53L68 62L76 55L84 60" fill="none"/>'), S(nest + '<path d="M34 72L44 66L52 74L60 65L68 74L76 66L86 72Q84 96 60 96Q36 96 34 72Z" fill="#FFF8EC"/>' + chick(58, 52) + '<path d="M40 36L50 26L58 34L66 25L76 34Q66 20 58 20Q46 20 40 36Z" fill="#FFF8EC"/>'), S('<path d="M12 104H108" />' + chick(70, 74) + '<path d="M66 92V104M76 92V104" /><path d="M14 98L22 90L28 98L34 90L40 98Q38 110 26 110Q14 110 14 98Z" fill="#FFF8EC"/><path d="M44 104L52 96L58 104Z" fill="#FFF8EC"/>')],
    plant: [S(soil + '<ellipse cx="60" cy="94" rx="10" ry="7" fill="#7A4A1C"/>'), S(soil + '<path d="M60 92V64" fill="none" stroke="#3E8E3E" stroke-width="6"/>' + leaf(60, 66, 1) + leaf(60, 66, -1)), S(soil + '<path d="M60 92V36" fill="none" stroke="#3E8E3E" stroke-width="6"/>' + leaf(60, 70, 1) + leaf(60, 80, -1) + '<path d="M60 18C48 26 50 40 60 40C70 40 72 26 60 18Z" fill="#FF7FA8"/>'), S(soil + '<path d="M60 92V44" fill="none" stroke="#3E8E3E" stroke-width="6"/>' + leaf(60, 72, 1) + leaf(60, 82, -1) + [0, 72, 144, 216, 288].map(a => '<circle cx="' + (60 + 15 * Math.cos(a * Math.PI / 180)).toFixed(1) + '" cy="' + (30 + 15 * Math.sin(a * Math.PI / 180)).toFixed(1) + '" r="11" fill="#FF7FA8"/>').join('') + '<circle cx="60" cy="30" r="9" fill="#FFC93C"/>')],
    apple: [S(apple()), S(apple('<path d="M98 44Q84 50 88 62Q84 74 100 80" fill="#FFF3D6"/>')), S('<path d="M50 28Q66 30 70 28Q60 50 66 60Q60 82 70 98Q60 96 50 98Q60 80 54 60Q60 48 50 28Z" fill="#FFF3D6"/><path d="M60 28Q60 18 66 10" fill="none"/><path d="M48 98Q60 108 72 98" fill="#E8414B"/><path d="M48 30Q60 20 72 30" fill="#E8414B"/>')],
    butterfly: [S('<path d="M16 96Q40 40 104 30Q90 92 16 96Z" fill="#5CC46E"/><circle cx="56" cy="66" r="5" fill="#FFF8EC"/><circle cx="68" cy="62" r="5" fill="#FFF8EC"/><circle cx="62" cy="74" r="5" fill="#FFF8EC"/>'), S('<path d="M16 96Q40 40 104 30Q90 92 16 96Z" fill="#5CC46E"/>' + [0, 1, 2, 3, 4].map(i => '<circle cx="' + (36 + i * 12) + '" cy="' + (64 - i * 4) + '" r="8" fill="#9BE36B"/>').join('') + '<circle cx="96" cy="44" r="4" fill="' + k + '"/>'), S('<path d="M20 14H100" /><path d="M60 14V24" /><path d="M60 24C44 30 44 80 60 96C76 80 76 30 60 24Z" fill="#B9855A"/><path d="M52 44H68M50 60H70M52 76H68" stroke="#7A4A1C" stroke-width="3"/>'), S('<path d="M60 40L60 92" stroke-width="6"/><path d="M58 50C30 18 6 34 18 58C26 70 44 66 58 60Z" fill="#B57BFF"/><path d="M62 50C90 18 114 34 102 58C94 70 76 66 62 60Z" fill="#B57BFF"/><path d="M58 64C36 66 24 90 40 96C50 98 56 84 58 72Z" fill="#FF9F43"/><path d="M62 64C84 66 96 90 80 96C70 98 64 84 62 72Z" fill="#FF9F43"/><path d="M56 40Q50 26 44 24M64 40Q70 26 76 24" fill="none"/>')],
    snowman: [S('<path d="M28 40Q28 20 50 24Q60 10 76 22Q96 20 94 40Z" fill="#D8E3EF"/>' + [[30, 60], [52, 72], [76, 58], [92, 80], [40, 88], [66, 94]].map(([x, y]) => '<path d="M' + (x - 6) + ' ' + y + 'H' + (x + 6) + 'M' + x + ' ' + (y - 6) + 'V' + (y + 6) + '" stroke="#8FB7E8" stroke-width="3"/>').join('') + '<path d="M4 108Q60 102 116 108V116H4Z" fill="#FFFFFF"/>'), S(snow + '<circle cx="42" cy="82" r="20" fill="#FFFFFF"/><circle cx="84" cy="88" r="14" fill="#FFFFFF"/>'), S(snow + '<circle cx="60" cy="80" r="22" fill="#FFFFFF"/><circle cx="60" cy="42" r="16" fill="#FFFFFF"/><circle cx="54" cy="40" r="2.5" fill="' + k + '"/><circle cx="66" cy="40" r="2.5" fill="' + k + '"/><path d="M60 46L76 50L60 51Z" fill="#FF9F43"/><rect x="48" y="16" width="24" height="14" fill="#4F7BFF"/><path d="M42 30H78" stroke-width="6"/>'), S('<path d="M10 102Q60 86 110 102Q60 116 10 102Z" fill="#BFE3FF"/><path d="M60 92L80 96L60 98Z" fill="#FF9F43"/><rect x="28" y="80" width="24" height="14" fill="#4F7BFF" transform="rotate(-18 40 87)"/>')],
    candle: [S(cake()), S(cake('<path d="M60 38C50 28 56 18 60 10C64 18 70 28 60 38Z" fill="#FFC93C"/>')), S(cake('<path d="M60 36Q52 28 60 22Q68 16 60 8" fill="none" stroke="#9AA3AF" stroke-width="4"/>'))],
    icecream: [S(cone + '<circle cx="60" cy="52" r="20" fill="#9BE3C8"/><circle cx="60" cy="30" r="16" fill="#FFB3C7"/>'), S(cone + '<circle cx="60" cy="54" r="18" fill="#9BE3C8"/><path d="M48 64Q46 76 50 80" fill="none" stroke="#9BE3C8" stroke-width="6"/>'), S(cone + '<path d="M44 66Q60 60 76 66" fill="none" stroke="#9BE3C8" stroke-width="6"/>')],
    balloon: [S('<path d="M60 70Q48 80 56 92Q64 104 54 114" fill="none" stroke-width="3"/><path d="M52 70Q60 54 68 70Q60 76 52 70Z" fill="#FF6B5B"/>'), S('<path d="M60 84Q48 96 56 106Q62 112 56 118" fill="none" stroke-width="3"/><ellipse cx="60" cy="46" rx="30" ry="36" fill="#FF6B5B"/><path d="M56 82L64 82L60 88Z" fill="#FF6B5B"/><ellipse cx="50" cy="34" rx="7" ry="10" fill="#FFFFFF" stroke="none" opacity=".7"/>'), S('<path d="M60 84Q48 96 56 106Q62 112 56 118" fill="none" stroke-width="3"/><path d="M46 60L56 70L50 76Z" fill="#FF6B5B"/><path d="M72 58L80 72L68 70Z" fill="#FF6B5B"/><path d="M58 76L64 84L54 84Z" fill="#FF6B5B"/><path d="M30 34L40 42M60 18V30M90 34L80 42M26 60H38M94 60H82" stroke="#FFC93C" stroke-width="5"/>')],
  };
})();
const SEQS = {
  egg3: { art: 'egg', f: [0, 1, 3], sum: '小鸡出壳啦！' }, egg4: { art: 'egg', f: [0, 1, 2, 3], sum: '小鸡出壳啦！' },
  plant3: { art: 'plant', f: [0, 1, 3], sum: '花开啦！' }, plant4: { art: 'plant', f: [0, 1, 2, 3], sum: '花开啦！' },
  apple: { art: 'apple', f: [0, 1, 2], sum: '苹果吃完啦！' }, candle: { art: 'candle', f: [0, 1, 2], sum: '蜡烛吹灭啦！' },
  balloon: { art: 'balloon', f: [0, 1, 2], sum: '气球爆啦！' }, icecream: { art: 'icecream', f: [0, 1, 2], sum: '冰淇淋吃完啦！' },
  bfly3: { art: 'butterfly', f: [1, 2, 3], sum: '变成蝴蝶啦！' }, bfly4: { art: 'butterfly', f: [0, 1, 2, 3], sum: '变成蝴蝶啦！' },
  snow3: { art: 'snowman', f: [1, 2, 3], sum: '雪人化啦！' }, snow4: { art: 'snowman', f: [0, 1, 2, 3], sum: '雪人化啦！' },
};
const MStory = {
  kind0: 'story', verb: '排！', intro: '先发生什么？', praise: ['顺序排对啦！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const pool = d === 1 ? ['egg3', 'plant3', 'apple', 'candle', 'balloon'] : d === 2 ? ['egg3', 'plant3', 'apple', 'candle', 'balloon', 'icecream', 'bfly3', 'snow3'] : d === 3 ? ['egg4', 'plant4'] : ['egg4', 'plant4', 'bfly4', 'snow4'];
    const id = bagPick(G, 'sq' + d, pool), s = SEQS[id], n = s.f.length;
    const frames = s.f.map(f => ({ art: s.art, f }));
    if (d === 5) { const other = rng.pick(Object.keys(SEQ_ART).filter(a => a !== s.art)); frames.push({ art: other, f: rng.int(0, SEQ_ART[other].length - 1), foreign: true }); }
    let order; do { order = rng.shuffle(frames.map((_, i) => i)); } while (order.slice(0, n).every((v, i) => v === i));
    return { k: [id, d, order.join()], id, n, frames, order, sum: s.sum, answer: Array.from({ length: n }, (_, i) => i).join() };
  },
  frame(fr) { const s = svg('svg', { viewBox: '0 0 120 120', width: '100%', height: '100%' }); s.innerHTML = SEQ_ART[fr.art][fr.f]; s.style.pointerEvents = 'none'; return s; },
  geo(st) {
    const L = K.L(), n = st.q.n, m = st.q.frames.length;
    /* the slots stand on the floor, an arrow between each two (left to right: first, then) (R9-8) */
    return L ? { slot: 138, sy: 400, sx: 450, sgap: 44, card: 124, py: 592, px: 450, pgap: 16, per: m } : { slot: 140, sy: 470, sx: 352, sgap: 30, card: 136, py: 690, px: 352, pgap: 18, per: 3 };
  },
  decor(G) { const L = K.L(), a = G.actors[this.chars[0]]; W2X.hideAll(G, this.chars); if (a) showActor(a, L ? 944 : 634, L ? 698 : 1016, L ? 170 : 136); },
  slotXY(st, i) { const g = this.geo(st); return W3X.row(st.q.n, g.sx, g.sy, g.slot, g.sgap)[i]; },
  poolXY(st, i) { const g = this.geo(st); return W3X.row(st.q.frames.length, g.px, g.py, g.card, g.pgap, g.per)[i]; },
  place(st) {
    const g = this.geo(st);
    st.slots.forEach((e, i) => { const p = this.slotXY(st, i); place(e, p.x, p.y, g.slot, g.slot); if (st.arrows[i]) place(st.arrows[i], p.x + g.slot + 2, p.y + g.slot / 2 - 18, g.sgap - 4, 36); });
    st.cardsE.forEach((o, k) => { if (o.at != null) { const p = this.slotXY(st, o.at); place(o.e, p.x + 6, p.y + 6, g.slot - 12, g.slot - 12); } else { const p = this.poolXY(st, o.home); place(o.e, p.x, p.y, g.card, g.card); } });
  },
  async present(st) {
    const q = st.q;
    st.slots = Array.from({ length: q.n }, () => { const e = W2X.thing(st, 10, 10, 3, ''); Object.assign(e.style, { borderRadius: '22px', border: '5px dashed rgba(43,33,24,.5)', background: 'rgba(255,255,255,.45)' }); return e; });
    st.arrows = st.slots.slice(1).map(() => { const b = W2X.thing(st, 40, 36, 4, ''); b.innerHTML = '<svg viewBox="0 0 40 36" width="100%" height="100%"><path d="M4 18H30M22 8L34 18L22 28" fill="none" stroke="#2B2118" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 18H30M22 8L34 18L22 28" fill="none" stroke="#FFC93C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'; return b; });
    st.cardsE = q.order.map((fi, k) => { const e = W3X.card(st, 'c' + fi, 6, 'card'); e.appendChild(this.frame(q.frames[fi])); return { e, fi, home: k, at: null }; });
    this.place(st);
    st.cardsE.forEach((o, i) => K.pop(st, o.e, 70 * i));
    K.task(st, [[W3X.ic('<rect x="2" y="32" width="24" height="36" rx="6" fill="#FFF8EC" stroke="#2B2118" stroke-width="4"/><rect x="38" y="32" width="24" height="36" rx="6" fill="#FFF8EC" stroke="#2B2118" stroke-width="4"/><rect x="74" y="32" width="24" height="36" rx="6" fill="#FFF8EC" stroke="#2B2118" stroke-width="4"/><path d="M27 50H36M32 45L37 50L32 55M63 50H72M68 45L73 50L68 55" fill="none" stroke="#2B2118" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>')], ['q']]);
    K.say(st, '按先后排一排！');
  },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || !/^c\d$/.test(id) || st.done) return false;
    const o = st.cardsE.find(x => 'c' + x.fi === id); if (!o) return false;
    const g = this.geo(st);
    if (o.at != null) { o.at = null; const h = this.poolXY(st, o.home), b0 = box(o.e); place(o.e, b0.x, b0.y, g.card, g.card); K.flyTo(st, o.e, h.x, h.y, 260, 20); Sfx.back(); return 'ok'; }
    const used = st.cardsE.filter(x => x.at != null).map(x => x.at), free = Array.from({ length: st.q.n }, (_, i) => i).find(i => !used.includes(i));
    if (free == null) return false;
    o.at = free; const s = this.slotXY(st, free), b0 = box(o.e); place(o.e, b0.x, b0.y, g.slot - 12, g.slot - 12);
    K.flyTo(st, o.e, s.x + 6, s.y + 6, 300, 30); Sfx.place(); Sfx.count(free + 1);
    if (st.cardsE.filter(x => x.at != null).length === st.q.n) { st.done = true; const ans = Array.from({ length: st.q.n }, (_, i) => st.cardsE.find(x => x.at === i).fi); st.scope.timeout(() => Session.submit(st, ans.join()), 360); }
    return 'ok';
  },
  async reveal(st) {
    const my = st;
    for (let i = 0; i < st.q.n; i++) { if (!Session.alive(my)) return; const o = st.cardsE.find(x => x.at === i); K.hop(st, o.e, 18); Sfx.mar(Sfx.SCALE[2 + i * 2], 0, 0.35, 0.5); await st.scope.wait(320); }
    Sfx.reveal(); this.cheerAll(st); st.summary = st.q.sum; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  async feedback(st, ans) {
    const a = String(ans).split(',').map(Number), q = st.q, i = a.findIndex((v, k) => v !== k), fr = q.frames[a[i]], o = st.cardsE.find(x => x.fi === a[i]);
    if (o) K.wiggle(st, o.e);
    W3X.say(fr && fr.foreign ? '这张不属于这里' : a[i] > i ? '它在后面哦' : '它在前面哦');
    await st.scope.wait(600);
  },
  /* not a choice (the child orders them); after a wrong order: the pictures out of place (blue), then every picture flies
     to its place (the one that does not belong goes back), and the story is told in order */
  async explain(st, ans) {
    const q = st.q, my = st, a = String(ans).split(',').map(Number), g = this.geo(st);
    const rings = a.map((fi, k) => (fi !== k ? W3X.mine(st, st.cardsE.find(x => x.fi === fi).e, 4) : null)).filter(Boolean);
    await st.scope.wait(T(1000)); if (!Session.alive(my)) return;
    rings.forEach(r => r.remove());
    W3X.tell('先后是这样的。');
    await Promise.all(st.cardsE.map(o => {
      const want = q.frames[o.fi].foreign ? null : o.fi; if (o.at === want) return null;
      o.at = want; const b0 = box(o.e), sz = want != null ? g.slot - 12 : g.card, p = want != null ? this.slotXY(st, want) : this.poolXY(st, o.home);
      place(o.e, b0.x, b0.y, sz, sz); return K.flyTo(st, o.e, p.x + (want != null ? 6 : 0), p.y + (want != null ? 6 : 0), 520, 40);
    }));
    if (!Session.alive(my)) return;
    this.place(st);
    for (let i = 0; i < q.n; i++) { if (!Session.alive(my)) return; const o = st.cardsE.find(x => x.at === i); K.hop(st, o.e, 18); Sfx.mar(Sfx.SCALE[2 + i * 2], 0, 0.35, 0.5); await st.scope.wait(T(320)); }
    K.ring(st, st.slots.map(e => box(e)), 10, W3X.GOLD); Sfx.reveal(); W3X.tell(q.sum);
    await W3X.beat(st, 1500);
  },
  audit() { return { none: 'the child orders the pictures' }; },
  next(st, strat) {
    if (st.done) return null;
    const placed = st.cardsE.filter(x => x.at != null).length;
    let want = placed;                                   /* the frame that belongs in the next free slot */
    if (strat === 'wrong' && placed === 0) want = 1;
    const o = st.cardsE.find(x => x.fi === want && x.at == null) || st.cardsE.find(x => x.at == null && !st.q.frames[x.fi].foreign);
    return o ? { g: 'tap', p: { id: 'c' + o.fi } } : null;
  },
  workEls(st) { return (st.cardsE || []).filter(o => o.at == null).map(o => o.e); },
  gestureHint(st) { if (st.slots) K.flash(st, st.slots); },      /* where the pictures go (never which one is first) */
  snap(st) { return { placed: (st.cardsE || []).filter(o => o.at != null).length }; },
};

/* ================================================================ 佩奇 E3 · 形 party things and their solid shapes */
const SOLIDS = { ball: ['beachball', 'yarnball'], cube: ['giftbox', 'dice'], cyl: ['drum', 'tincan'], cone: ['partyhat', 'trafficcone'] };
const SOLID_WORD = { ball: '球形', cube: '方块形', cyl: '圆柱形', cone: '圆锥形' };
const MSolids = {
  kind0: 'solids', verb: '找！', intro: '找一样的形状！', praise: ['形状认得真准！'],
  /* five things: the right one and four that are not (every other shape there at least once; never a thing that is also
     right: no cone for "rolls" - it rolls round - nor for "prints a circle" - its bottom is one) */
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, all = k => SOLIDS[k].map(p => ({ s: k, p }));
    const spread = (kinds, n) => { const per = rng.shuffle(kinds).map(k => rng.shuffle(all(k))), out = []; for (let r = 0; out.length < n && r < 2; r++) per.forEach(l => { if (out.length < n && l[r]) out.push(l[r]); }); return out; };
    if (d <= 2) {
      const t = bagPick(G, 'sd' + d, d === 1 ? ['ball', 'cube', 'cyl'] : ['ball', 'cube', 'cyl', 'cone']), right = { s: t, p: rng.pick(SOLIDS[t]) };
      const opts = W3X.deal(G, right, spread(Object.keys(SOLIDS).filter(k => k !== t), 4), 'sd');
      return { k: [d, t, opts.map(x => x.p).join()], mode: 'match', t, opts, answer: opts.indexOf(right) };
    }
    if (d === 3) {                                       /* both things of that shape among five: two places from a bag */
      const t = bagPick(G, 'sd3', ['ball', 'cube', 'cyl', 'cone']), pairs = []; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) pairs.push(i + '-' + j);
      const at = bagPick(G, 'sd3p', pairs).split('-').map(Number), foils = spread(Object.keys(SOLIDS).filter(k => k !== t), 3), mine = rng.shuffle(all(t));
      const opts = []; for (let i = 0, a = 0, b = 0; i < 5; i++) opts.push(at.includes(i) ? mine[a++] : foils[b++]);
      return { k: [d, t, opts.map(x => x.p).join()], mode: 'two', t, opts, answer: at.join('-') };
    }
    const ask = d === 4 ? bagPick(G, 'sd4', ['noroll', 'nostand']) : bagPick(G, 'sd5', ['pcircle', 'psquare']);
    const t = { noroll: 'cube', nostand: 'ball', pcircle: 'cyl', psquare: 'cube' }[ask], right = { s: t, p: rng.pick(SOLIDS[t]) };
    const fk = { noroll: ['ball', 'cyl'], nostand: ['cube', 'cyl', 'cone'], pcircle: ['ball', 'cube'], psquare: ['ball', 'cyl'] }[ask];
    const opts = W3X.deal(G, right, spread(fk, 4), 'sd');
    return { k: [d, ask, opts.map(x => x.p).join()], mode: ask, t, opts, answer: opts.indexOf(right) };
  },
  /* tests: an independent check (what rolls, stands, prints) that exactly one is right */
  audit(q) {
    const ok = x => (q.mode === 'match' || q.mode === 'two' ? x.s === q.t : q.mode === 'noroll' ? !['ball', 'cyl', 'cone'].includes(x.s) : q.mode === 'nostand' ? x.s === 'ball' : q.mode === 'pcircle' ? ['cyl', 'cone'].includes(x.s) : x.s === 'cube');
    const good = q.opts.map((x, i) => (ok(x) ? i : -1)).filter(i => i >= 0), want = String(q.answer).split('-').map(Number);
    const props = new Set(q.opts.map(x => x.p)).size === q.opts.length;
    return { n: q.opts.length, pos: q.mode === 'two' ? want : q.answer, pick: q.mode === 'two' ? 2 : 1, err: props && good.join() === want.join() ? null : 'right ones ' + good + ' want ' + want + (props ? '' : ' (a thing twice)') };
  },
  solid(kind, size) {
    const s = svg('svg', { viewBox: '0 0 120 120', width: size, height: size }), k = W2X.ink, a = { stroke: k, 'stroke-width': 4, 'stroke-linejoin': 'round' };
    const P = (d, f) => svg('path', Object.assign({ d, fill: f }, a), s);
    if (kind === 'ball') { svg('circle', Object.assign({ cx: 60, cy: 62, r: 44, fill: '#9FD0FF' }, a), s); svg('path', { d: 'M28 84A44 44 0 0 0 100 76A40 40 0 0 1 28 84Z', fill: '#6FA8E0' }, s); svg('ellipse', { cx: 44, cy: 44, rx: 12, ry: 8, fill: '#fff', opacity: 0.8 }, s); }
    else if (kind === 'cube') { P('M60 14L100 34L60 54L20 34Z', '#D6ECFF'); P('M20 34L60 54V104L20 84Z', '#9FD0FF'); P('M60 54L100 34V84L60 104Z', '#6FA8E0'); }
    else if (kind === 'cyl') { P('M26 30V90A34 12 0 0 0 94 90V30Z', '#9FD0FF'); svg('ellipse', Object.assign({ cx: 60, cy: 30, rx: 34, ry: 12, fill: '#D6ECFF' }, a), s); svg('path', { d: 'M76 38V96', stroke: '#fff', 'stroke-width': 5, opacity: 0.6 }, s); }
    else { P('M60 12L96 92A36 12 0 0 1 24 92Z', '#9FD0FF'); svg('path', { d: 'M24 92A36 12 0 0 0 96 92', fill: 'none', stroke: k, 'stroke-width': 4 }, s); svg('path', { d: 'M58 26L44 82', stroke: '#fff', 'stroke-width': 5, opacity: 0.6 }, s); }
    return s;
  },
  /* the model on the left (on top in portrait), the five things 3 + 2 */
  geo(st) { const L = K.L(); return L ? { mx: 210, my: 350, ms: 240, fr: { x: 380, y: 130, w: 630, h: 420 }, cs: 150, gap: 26 } : { mx: 352, my: 330, ms: 230, fr: { x: 20, y: 540, w: 664, h: 330 }, cs: 150, gap: 22 }; },
  decor(G) { W3X.decor2(G, this.chars, true); },
  place(st) {
    const g = this.geo(st);
    place(st.model, g.mx - g.ms / 2, g.my - g.ms / 2, g.ms, g.ms);
    const P = W3X.grid(st.objs.length, g.fr, g.cs, g.gap); st.objs.forEach((e, i) => place(e, P.pos[i].x, P.pos[i].y, P.w, P.w));
    /* the prints (and the explanation's little shapes) sit on the card's lower corner: nothing below the cards to cover */
    if (st.prints) st.prints.forEach((e, i) => { const b = box(st.objs[i]); place(e, b.x + b.w - 50, b.y + b.h - 50, 62, 62); });
    if (st.tags) st.tags.forEach(t => { const b = box(st.objs[t.i]); place(t.e, b.x + b.w - 52, b.y + b.h - 52, 64, 64); });
  },
  modelNode(q) {
    const d = el('div', ''); Object.assign(d.style, { width: '100%', height: '100%' });
    if (q.mode === 'match' || q.mode === 'two') d.appendChild(this.solid(q.t, '100%'));
    else if (q.mode === 'noroll' || q.mode === 'nostand') d.innerHTML = '<svg viewBox="0 0 120 120" width="100%" height="100%"><path d="M8 96H112" stroke="#2B2118" stroke-width="5" stroke-linecap="round"/><path d="M14 104L22 96M34 104L42 96M54 104L62 96M74 104L82 96M94 104L102 96" stroke="#2B2118" stroke-width="3"/><circle cx="44" cy="66" r="28" fill="#9FD0FF" stroke="#2B2118" stroke-width="4"/><path d="M80 52Q100 56 104 76" fill="none" stroke="#E8414B" stroke-width="6" stroke-linecap="round"/><path d="M96 74L104 84L110 72Z" fill="#E8414B"/>' + (q.mode === 'noroll' ? '' : '') + '</svg>';
    else d.innerHTML = '<svg viewBox="0 0 120 120" width="100%" height="100%"><rect x="30" y="10" width="60" height="44" rx="8" fill="#C98B4A" stroke="#2B2118" stroke-width="4"/><rect x="50" y="54" width="20" height="18" fill="#C98B4A" stroke="#2B2118" stroke-width="4"/><rect x="18" y="74" width="84" height="18" rx="6" fill="#8A5A2E" stroke="#2B2118" stroke-width="4"/>' + (q.mode === 'pcircle' ? '<circle cx="60" cy="108" r="10" fill="#E8414B"/>' : '<rect x="50" y="98" width="20" height="20" fill="#E8414B"/>') + '</svg>';
    return d;
  },
  async present(st) {
    const q = st.q;
    st.model = W2X.thing(st, 10, 10, 4, ''); st.model.appendChild(this.modelNode(q));
    st.sel = [];
    st.objs = q.opts.map((o, i) => { const e = W3X.card(st, 'card' + i, 5, 'card'); const im = img('assets/props/' + o.p + '.png', '', e); Object.assign(im.style, { width: '78%', height: '78%', objectFit: 'contain', pointerEvents: 'none' }); return e; });
    st.cards = st.objs; st.opts = q.opts.map((_, i) => i);
    this.place(st);
    K.pop(st, st.model); st.objs.forEach((e, i) => K.pop(st, e, 120 + 80 * i));
    K.task(st, [[{ node: (() => { const d = el('span'); d.appendChild(this.modelNode(q)); d.style.width = d.style.height = '54px'; return d; })() }], ['q']]);
    K.say(st, { match: '哪个和它一样？', two: '找出两个一样的！', noroll: '哪个滚不动？', nostand: '哪个站不稳？', pcircle: '哪个印出圆形？', psquare: '哪个印出方形？' }[q.mode]);
  },
  onGesture(st, name, p) {
    const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || st.picked) return false;
    if (st.q.mode !== 'two') { st.picked = true; Session.submit(st, i); return 'ok'; }
    if (st.sel.includes(i)) { st.sel = st.sel.filter(x => x !== i); st.objs[i].classList.remove('hi'); return 'ok'; }
    st.sel.push(i); st.objs[i].classList.add('hi'); Sfx.place();
    if (st.sel.length === 2) { st.picked = true; Session.submit(st, st.sel.slice().sort((a, b) => a - b).join('-')); }
    return 'ok';
  },
  async reveal(st) {
    const q = st.q, idx = q.mode === 'two' ? q.answer.split('-').map(Number) : [q.answer], my = st;
    idx.forEach(i => { K.ring(st, [box(st.objs[i])], 6, '#FFC93C'); K.hop(st, st.objs[i], 16); });
    Sfx.reveal(); this.cheerAll(st);
    if (q.mode === 'noroll' || q.mode === 'nostand') {
      st.objs.forEach((e, i) => { const s = q.opts[i].s; if (s === 'ball' || s === 'cyl') st.scope.anim(e.firstChild, [{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(26px) rotate(160deg)' }, { transform: 'translateX(0) rotate(0)' }], { duration: 1200, easing: EASE.glide }); });
      st.summary = q.mode === 'noroll' ? '方块滚不动！' : '球站不稳！';
    } else if (q.mode === 'pcircle' || q.mode === 'psquare') {
      this.showPrints(st);
      st.summary = q.mode === 'pcircle' ? '圆柱印出圆形！' : '方块印出方形！';
    } else st.summary = '都是' + SOLID_WORD[q.t] + '！';
    Voice.say(st.summary, { tag: 'summary' });
    await st.scope.wait(1500);
    void my;
  },
  /* what each thing prints (on its card's corner) */
  showPrints(st) {
    if (st.prints) return;
    st.prints = st.q.opts.map(o => { const e = W2X.thing(st, 62, 62, 7, ''); Object.assign(e.style, { background: '#FFF8EC', borderRadius: '50%', boxShadow: '0 0 0 3px #2B2118' }); e.innerHTML = '<svg viewBox="0 0 60 60" width="100%" height="100%">' + (o.s === 'cube' ? '<rect x="15" y="15" width="30" height="30" fill="#E8414B"/>' : o.s === 'cyl' || o.s === 'cone' ? '<circle cx="30" cy="30" r="16" fill="#E8414B"/>' : '<circle cx="30" cy="30" r="4" fill="#E8414B"/>') + '</svg>'; return e; });
    this.place(st); st.prints.forEach((e, i) => K.pop(st, e, 150 * i));
  },
  /* a thing's shape, drawn on its card's corner */
  tag(st, i) { const e = W2X.thing(st, 64, 64, 7, ''); Object.assign(e.style, { background: '#FFF8EC', borderRadius: '50%', boxShadow: '0 0 0 3px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center' }); e.appendChild(this.solid(st.q.opts[i].s, '86%')); (st.tags || (st.tags = [])).push({ e, i }); this.place(st); K.pop(st, e); return e; },
  /* after a wrong answer: what his thing is (its shape / it rolls / it stands / what it prints), then the right one */
  async explain(st, ans) {
    const q = st.q, my = st, mine = String(ans).split('-').map(Number), right = String(q.answer).split('-').map(Number);
    const bad = mine.filter(i => !right.includes(i));
    bad.forEach(i => W3X.mine(st, st.objs[i], 6));
    if (q.mode === 'match' || q.mode === 'two') { K.hop(st, st.model, 14); bad.forEach(i => this.tag(st, i)); }
    else if (q.mode === 'noroll' || q.mode === 'nostand') {
      st.objs.forEach((e, i) => { const s = q.opts[i].s; if (s === 'ball' || (q.mode === 'noroll' && s === 'cyl')) st.scope.anim(e.firstChild, [{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(26px) rotate(160deg)' }, { transform: 'translateX(0) rotate(0)' }], { duration: 1200, easing: EASE.glide }); });
    } else this.showPrints(st);
    await st.scope.wait(T(1400)); if (!Session.alive(my)) return;
    right.forEach(i => { W3X.gold(st, st.objs[i], 6); if (q.mode === 'match' || q.mode === 'two') this.tag(st, i); });
    Sfx.reveal();
    W3X.tell(q.mode === 'noroll' ? '方块滚不动！' : q.mode === 'nostand' ? '球站不稳！' : q.mode === 'pcircle' ? '圆柱印出圆形！' : q.mode === 'psquare' ? '方块印出方形！' : '都是' + SOLID_WORD[q.t] + '！');
    await W3X.beat(st, 1600);
  },
  async feedback(st, ans) {
    const q = st.q, idx = String(ans).split('-').map(Number), bad = idx.find(i => q.opts[i].s !== q.t);
    idx.forEach(i => st.objs[i] && K.wiggle(st, st.objs[i]));
    const s = q.opts[bad != null ? bad : idx[0]].s;
    let line;
    if (q.mode === 'noroll') line = '它能滚哦';
    else if (q.mode === 'nostand') line = '它能站稳哦';
    else if (q.mode === 'pcircle' || q.mode === 'psquare') line = s === 'ball' ? '球印不出来' : s === 'cube' ? '它印出方形' : '它印出圆形';
    else line = '这是' + SOLID_WORD[s] + '的';
    W3X.say(line); await st.scope.wait(500);
  },
  next(st, strat) {
    if (st.picked) return null;
    const q = st.q;
    if (q.mode === 'two') { const [a, b] = q.answer.split('-').map(Number); if (!st.sel.length) return { g: 'tap', p: { id: 'card' + a } }; const c = strat === 'wrong' ? q.opts.findIndex(x => x.s !== q.t) : b; return { g: 'tap', p: { id: 'card' + c } }; }
    const i = strat === 'wrong' ? q.opts.findIndex(x => x.s !== q.t) : q.answer;
    return { g: 'tap', p: { id: 'card' + i } };
  },
  workEls(st) { return st.objs || []; },
  snap(st) { return { mode: st.q.mode, sel: st.sel ? st.sel.length : 0 }; },
};

/* ================================================================ 佩奇 E4 · 缺 what is missing in the picture (reasoning: picture completion) */
const MISS_PICS = (() => {
  const k = '#2B2118', A = 'stroke="' + k + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"';
  const g = (b) => '<g ' + A + '>' + b + '</g>';
  return {
    car: { lv: 1, parts: {
      body: { at: [150, 150], z: 1, d: '<path d="M30 190V150Q34 128 70 124L100 92Q112 80 140 80H196Q216 80 230 98L252 126Q278 132 276 160V190Z" fill="#E8414B"/><path d="M110 120L128 98H160V120Z" fill="#BFE3FF"/><path d="M176 98H206L224 120H176Z" fill="#BFE3FF"/>' },
      wheel1: { at: [86, 196], name: '轮子', d: '<circle cx="86" cy="196" r="28" fill="#3A3A3A"/><circle cx="86" cy="196" r="10" fill="#C9D4E0"/>' },
      wheel2: { at: [222, 196], name: '轮子', d: '<circle cx="222" cy="196" r="28" fill="#3A3A3A"/><circle cx="222" cy="196" r="10" fill="#C9D4E0"/>' },
      lamp: { at: [266, 146], name: '车灯', lv: 4, d: '<rect x="258" y="138" width="16" height="16" rx="4" fill="#FFE36B"/>' } } },
    house: { lv: 1, parts: {
      wall: { at: [150, 190], d: '<rect x="56" y="128" width="188" height="140" fill="#FFE7A8"/>' },
      roof: { at: [150, 80], z: 1, d: '<path d="M40 132L150 44L260 132Z" fill="#E8554A"/>' },
      door: { at: [150, 226], name: '门', d: '<path d="M126 268V206Q150 186 174 206V268Z" fill="#8A5A2E"/><circle cx="164" cy="238" r="4" fill="#FFC93C"/>' },
      win: { at: [88, 172], name: '窗户', lv: 3, d: '<rect x="70" y="152" width="40" height="40" fill="#BFE3FF"/><path d="M90 152V192M70 172H110"/>' },
      win2: { at: [212, 172], name: '窗户', lv: 3, d: '<rect x="192" y="152" width="40" height="40" fill="#BFE3FF"/><path d="M212 152V192M192 172H232"/>' },
      chim: { at: [212, 60], name: '烟囱', lv: 3, d: '<path d="M198 86V48H226V108Z" fill="#B9855A"/>' } } },
    cup: { lv: 1, parts: {
      body: { at: [130, 160], z: 1, d: '<path d="M60 90H200V200Q200 240 160 240H100Q60 240 60 200Z" fill="#7FC8F8"/><path d="M60 90H200" />' },
      handle: { at: [226, 160], name: '把手', d: '<path d="M200 120Q250 120 250 160Q250 200 200 200" fill="none" stroke-width="14"/>' } } },
    fish: { lv: 1, parts: {
      body: { at: [140, 150], z: 1, d: '<path d="M40 150Q100 70 200 150Q100 230 40 150Z" fill="#FF9F43"/><path d="M90 120Q104 150 90 180" fill="none"/>' },
      tail: { at: [236, 150], name: '尾巴', d: '<path d="M196 150L262 106V194Z" fill="#FF9F43"/>' },
      eye: { at: [74, 140], name: '眼睛', lv: 2, d: '<circle cx="74" cy="140" r="9" fill="' + k + '"/>' },
      fin: { at: [140, 92], name: '鱼鳍', lv: 3, d: '<path d="M116 112Q134 70 172 100Z" fill="#FFC93C"/>' } } },
    umbrella: { lv: 1, parts: {
      top: { at: [150, 100], z: 1, d: '<path d="M40 130Q150 10 260 130Q232 116 205 130Q178 116 150 130Q122 116 95 130Q68 116 40 130Z" fill="#B57BFF"/>' },
      handle: { at: [158, 210], name: '伞把', d: '<path d="M150 130V236Q150 262 172 262Q192 262 192 242" fill="none" stroke-width="10"/>' } } },
    table: { lv: 2, parts: {
      top: { at: [150, 110], z: 1, d: '<rect x="30" y="96" width="240" height="30" rx="8" fill="#C98B4A"/>' },
      leg1: { at: [58, 196], name: '桌子腿', d: '<rect x="46" y="126" width="24" height="140" rx="6" fill="#A86F38"/>' },
      leg2: { at: [242, 196], name: '桌子腿', d: '<rect x="230" y="126" width="24" height="140" rx="6" fill="#A86F38"/>' } } },
    cat: { lv: 2, parts: {
      head: { at: [150, 170], d: '<circle cx="150" cy="170" r="92" fill="#FFC27A"/>' },
      ear1: { at: [84, 74], name: '耳朵', d: '<path d="M78 112L84 46L128 84Z" fill="#FFC27A"/>' },
      ear2: { at: [216, 74], name: '耳朵', d: '<path d="M222 112L216 46L172 84Z" fill="#FFC27A"/>' },
      eye1: { at: [116, 150], name: '眼睛', d: '<ellipse cx="116" cy="150" rx="12" ry="16" fill="' + k + '"/>' },
      eye2: { at: [184, 150], name: '眼睛', d: '<ellipse cx="184" cy="150" rx="12" ry="16" fill="' + k + '"/>' },
      nose: { at: [150, 196], name: '鼻子', lv: 4, d: '<path d="M140 188H160L150 200Z" fill="#E8414B"/>' },
      wh1: { at: [90, 214], name: '胡子', lv: 4, d: '<path d="M118 206L62 196M118 216L60 222" fill="none"/>' },
      wh2: { at: [210, 214], name: '胡子', lv: 4, d: '<path d="M182 206L238 196M182 216L240 222" fill="none"/>' } } },
    bfly: { lv: 2, parts: {
      body: { at: [150, 160], z: 1, d: '<path d="M150 80V240" stroke-width="12"/><path d="M146 84Q130 54 112 50M154 84Q170 54 188 50" fill="none"/>' },
      w1: { at: [96, 116], name: '翅膀', d: '<path d="M146 116C94 40 30 76 60 128C78 156 120 150 146 136Z" fill="#4FB3FF"/>' },
      w2: { at: [204, 116], name: '翅膀', d: '<path d="M154 116C206 40 270 76 240 128C222 156 180 150 154 136Z" fill="#4FB3FF"/>' },
      w3: { at: [104, 196], name: '翅膀', d: '<path d="M146 150C100 156 76 210 106 222C126 228 140 200 146 176Z" fill="#FF7FA8"/>' },
      w4: { at: [196, 196], name: '翅膀', d: '<path d="M154 150C200 156 224 210 194 222C174 228 160 200 154 176Z" fill="#FF7FA8"/>' } } },
    teapot: { lv: 2, parts: {
      body: { at: [150, 170], z: 1, d: '<path d="M70 150Q70 236 150 236Q230 236 230 150Q230 110 150 110Q70 110 70 150Z" fill="#5CC46E"/>' },
      spout: { at: [62, 136], name: '壶嘴', d: '<path d="M80 170Q40 160 34 110L54 104Q60 140 84 146Z" fill="#5CC46E"/>' },
      handle: { at: [254, 160], name: '把手', d: '<path d="M226 130Q276 130 274 166Q272 206 226 196" fill="none" stroke-width="14"/>' },
      lid: { at: [150, 92], name: '盖子', lv: 5, d: '<path d="M106 112Q150 74 194 112Z" fill="#9BE36B"/><circle cx="150" cy="80" r="10" fill="#9BE36B"/>' } } },
    flower: { lv: 3, parts: Object.assign({
      stem: { at: [150, 240], d: '<path d="M150 150V290" stroke="#3E8E3E" stroke-width="10"/><circle cx="150" cy="120" r="24" fill="#FFC93C"/>' },
      leaf: { at: [194, 236], name: '叶子', d: '<path d="M152 250Q190 206 236 226Q200 266 152 250Z" fill="#5CC46E"/>' } },
      [0, 1, 2, 3, 4].reduce((o, i) => { const a = (-90 + i * 72) * Math.PI / 180, x = 150 + 52 * Math.cos(a), y = 120 + 52 * Math.sin(a); o['p' + i] = { at: [Math.round(x), Math.round(y)], name: '花瓣', d: '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="30" fill="#FF7FA8"/>' }; return o; }, {})) },
    ladder: { lv: 3, parts: Object.assign({ rails: { at: [80, 160], d: '<path d="M90 26V280M210 26V280" stroke-width="14"/>' } },
      ...[0, 1, 2, 3].map(i => ({ ['r' + i]: { at: [150, 66 + i * 60], name: '一格', d: '<path d="M90 ' + (66 + i * 60) + 'H210" stroke-width="12"/>' } }))) },
    bike: { lv: 3, parts: {
      frame: { at: [150, 150], z: 1, d: '<path d="M80 200L130 130H210L230 200M130 130L150 200H230M210 130L200 100H178M130 130L120 110H100" fill="none" stroke-width="8"/><path d="M106 104H136" stroke-width="10"/>' },
      w1: { at: [78, 202], name: '轮子', d: '<circle cx="80" cy="200" r="46" fill="none" stroke-width="8"/><circle cx="80" cy="200" r="6" fill="' + k + '"/>' },
      w2: { at: [230, 202], name: '轮子', d: '<circle cx="230" cy="200" r="46" fill="none" stroke-width="8"/><circle cx="230" cy="200" r="6" fill="' + k + '"/>' } } },
    star: { lv: 4, star: true, parts: [0, 1, 2, 3, 4].reduce((o, i) => { const a = (-90 + i * 72) * Math.PI / 180; o['s' + i] = { at: [Math.round(150 + 98 * Math.cos(a)), Math.round(150 + 98 * Math.sin(a))], name: '一个角' }; return o; }, { core: { at: [150, 150], z: 1 } }) },
    sun: { lv: 4, parts: Object.assign({ disc: { at: [150, 150], z: 1, d: '<circle cx="150" cy="150" r="56" fill="#FFC93C"/><circle cx="132" cy="140" r="6" fill="' + k + '"/><circle cx="168" cy="140" r="6" fill="' + k + '"/><path d="M128 166Q150 184 172 166" fill="none"/>' } },
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * 45 * Math.PI / 180, x1 = 150 + 74 * Math.cos(a), y1 = 150 + 74 * Math.sin(a), x2 = 150 + 118 * Math.cos(a), y2 = 150 + 118 * Math.sin(a); return { ['r' + i]: { at: [Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2)], name: '一道光', d: '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#FF9F43" stroke-width="12"/>' } }; })) },
    clock: { lv: 5, parts: Object.assign({ face: { at: [150, 150], d: '<circle cx="150" cy="150" r="110" fill="#FFF8EC"/><path d="M150 150V84" stroke-width="10"/><circle cx="150" cy="150" r="8" fill="' + k + '"/>' }, hand: { at: [188, 172], name: '指针', d: '<path d="M150 150L196 178" stroke="#E8414B" stroke-width="10"/>' } },
      ...[0, 3, 6, 9].map(h => { const a = (h * 30 - 90) * Math.PI / 180, x = 150 + 88 * Math.cos(a), y = 150 + 88 * Math.sin(a); return { ['t' + h]: { at: [Math.round(x), Math.round(y)], name: '一个点', d: '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="' + k + '"/>' } }; })) },
    ladybug: { lv: 5, parts: Object.assign({ shell: { at: [150, 170], z: 1, d: '<circle cx="150" cy="96" r="34" fill="' + k + '"/><ellipse cx="150" cy="170" rx="96" ry="88" fill="#E8414B"/><path d="M150 84V258" stroke-width="6"/><circle cx="138" cy="88" r="6" fill="#fff"/><circle cx="162" cy="88" r="6" fill="#fff"/>' } },
      ...[[98, 128], [88, 196], [122, 244], [202, 128], [212, 196], [178, 244]].map(([x, y], i) => ({ ['d' + i]: { at: [x, y], name: '一个点点', d: '<circle cx="' + x + '" cy="' + y + '" r="16" fill="' + k + '"/>' } }))) },
  };
})();
const MMissing = {
  kind0: 'missing', verb: '看！', intro: '看图找一找！', praise: ['眼睛真亮！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const pics = Object.keys(MISS_PICS).filter(k => MISS_PICS[k].lv <= d && MISS_PICS[k].lv >= Math.max(1, d - 2));
    const pic = bagPick(G, 'ms' + d, pics), P = MISS_PICS[pic];
    const cands = Object.keys(P.parts).filter(k => P.parts[k].name && (P.parts[k].lv || P.lv) <= d);
    const miss = rng.pick(cands);
    /* at least five places to tap (client: five options): the parts, and empty places where a part could have been */
    const zs = Object.keys(P.parts).filter(x => P.parts[x].name || P.parts[x].z).map(x => P.parts[x].at), spots = [];
    [40, 95, 150, 205, 260].forEach(y => [40, 95, 150, 205, 260].forEach(x => spots.push([x, y])));
    const near = p => Math.min(...zs.map(z => Math.hypot(z[0] - p[0], z[1] - p[1]))), decoys = [];
    rng.shuffle(spots).sort((a, b) => near(a) - near(b)).forEach(p => { if (zs.length + decoys.length < 5 && zs.concat(decoys).every(z => Math.hypot(z[0] - p[0], z[1] - p[1]) >= 80)) decoys.push(p); });
    return { k: [pic, miss], pic, miss, answer: miss, name: P.parts[miss].name, decoys };
  },
  audit(q) { const P = MISS_PICS[q.pic], n = Object.keys(P.parts).filter(x => P.parts[x].name || P.parts[x].z).length + q.decoys.length; return { n, pos: null, err: n >= 5 && P.parts[q.miss] && P.parts[q.miss].name ? null : 'places ' + n }; },
  art(q, withMissing) {
    const P = MISS_PICS[q.pic], k = W2X.ink, s = svg('svg', { viewBox: '0 0 300 300', width: '100%', height: '100%' });
    s.style.pointerEvents = 'none'; s.style.overflow = 'visible';
    if (P.star) {
      const pts = []; for (let i = 0; i < 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, r = i % 2 ? 46 : 112; pts.push([150 + r * Math.cos(a), 150 + r * Math.sin(a)]); }
      const skip = withMissing ? -1 : Number(q.miss.slice(1)) * 2;
      const poly = pts.filter((_, i) => i !== skip);
      svg('polygon', { points: W2X.pts(poly), fill: '#FFC93C', stroke: k, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s);
      return s;
    }
    const keys = Object.keys(P.parts).filter(x => withMissing || x !== q.miss);
    const order = keys.sort((a, b) => (P.parts[a].name ? 1 : 0) - (P.parts[b].name ? 1 : 0));
    const g = svg('g', { stroke: k, 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, s);
    g.innerHTML = order.map(x => P.parts[x].d).join('');
    return s;
  },
  geo() { return K.L() ? { x: 512, y: 384, s: 470 } : { x: 352, y: 520, s: 520 }; },
  decor(G) { W3X.decor2(G, this.chars); },
  place(st) {
    const g = this.geo(), P = MISS_PICS[st.q.pic], k = g.s / 300;
    place(st.pic, g.x - g.s / 2, g.y - g.s / 2, g.s, g.s);
    st.zones.forEach(z => { const a = z.at || P.parts[z.k].at; place(z.e, g.x - g.s / 2 + a[0] * k - 50, g.y - g.s / 2 + a[1] * k - 50, 100, 100); });
  },
  async present(st) {
    const q = st.q, P = MISS_PICS[q.pic];
    st.pic = W2X.thing(st, 10, 10, 4, ''); Object.assign(st.pic.style, { borderRadius: '28px', background: 'rgba(255,255,255,.88)', boxShadow: '0 0 0 5px #2B2118' });
    st.pic.appendChild(this.art(q, false));
    st.zones = Object.keys(P.parts).filter(x => P.parts[x].name || P.parts[x].z).map(x => { const e = W2X.thing(st, 100, 100, 6, ''); Object.assign(e.style, { borderRadius: '50%' }); K.reg(st, 'pt_' + x, e, {}); return { k: x, e }; })
      .concat((q.decoys || []).map((at, i) => { const e = W2X.thing(st, 100, 100, 6, ''); Object.assign(e.style, { borderRadius: '50%' }); K.reg(st, 'pt_dk' + i, e, {}); return { k: 'dk' + i, e, at }; }));
    this.place(st);
    K.pop(st, st.pic);
    K.task(st, [[W3X.ic('<rect x="10" y="10" width="80" height="80" rx="14" fill="#FFF8EC" stroke="#2B2118" stroke-width="5"/><circle cx="38" cy="44" r="9" fill="#2B2118"/><circle cx="64" cy="44" r="11" fill="none" stroke="#2B2118" stroke-width="4" stroke-dasharray="5 4"/><path d="M36 70Q50 80 64 70" fill="none" stroke="#2B2118" stroke-width="5" stroke-linecap="round"/>')], ['q']]);
    K.say(st, '少了什么？');
  },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || !id.startsWith('pt_') || st.picked) return false;
    st.picked = true; Session.submit(st, id.slice(3)); return 'ok';
  },
  async reveal(st) {
    const q = st.q;
    st.pic.innerHTML = ''; st.pic.appendChild(this.art(q, true));
    const z = st.zones.find(x => x.k === q.miss); if (z) { K.ring(st, [box(z.e)], 4, '#FFC93C'); Fx.burst(center(z.e).x, center(z.e).y, { n: 12, dist: 60 }); }
    Sfx.reveal(); this.cheerAll(st);
    st.summary = '少了' + q.name + '！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1400);
  },
  async feedback(st, ans) { const z = st.zones.find(x => x.k === ans); if (z) K.flash(st, [z.e]); W3X.say('这里不缺哦'); await st.scope.wait(500); },
  /* after a wrong answer: the place he tapped (blue), then the missing part drawn in where it belongs (gold) */
  async explain(st, ans) {
    const q = st.q, my = st, z = st.zones.find(x => x.k === ans);
    if (z) W3X.ringAt(st, box(z.e), W3X.BLUE, 0);
    await st.scope.wait(T(900)); if (!Session.alive(my)) return;
    st.pic.innerHTML = ''; st.pic.appendChild(this.art(q, true));
    const r = st.zones.find(x => x.k === q.miss); if (r) { W3X.ringAt(st, box(r.e), W3X.GOLD, 4); Fx.burst(center(r.e).x, center(r.e).y, { n: 12, dist: 60 }); }
    Sfx.reveal(); W3X.tell('少了' + q.name + '！');
    await W3X.beat(st, 1600);
  },
  next(st, strat) { if (st.picked) return null; const k = strat === 'wrong' ? st.zones.find(z => z.k !== st.q.miss).k : st.q.miss; return { g: 'tap', p: { id: 'pt_' + k } }; },
  workEls(st) { return st.pic ? [st.pic] : []; },
  snap(st) { return { pic: st.q.pic }; },
};

/* ================================================================ Bluey U1 · 盒 equal groups: every box holds the same */
const MGroups = {
  kind0: 'groups', verb: '数！', intro: '小蛋糕装盒啦！', praise: ['几个几个数，真快！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const spec = [null, [[2], [2, 3]], [[3], [2, 3]], [[2, 3, 4], [2, 3, 4]], [[3, 4, 5], [2, 3]], [[4, 5], [3, 4]]][d];
    let k, m; do { k = rng.pick(spec[0]); m = rng.pick(spec[1]); } while (k * m > 20 || (d >= 3 && k * m < 6));
    const item = rng.pick(this.items), open = d <= 2 ? 'all' : 'one';
    return { k: [k, m, item, open], boxes: k, per: m, item, open, answer: k * m, opts: numOptions(G, k * m, 2, 20) };
  },
  boxSvg(open) {
    const s = svg('svg', { viewBox: '0 0 140 120', width: '100%', height: '100%' }), k = W2X.ink;
    svg('path', { d: 'M10 40H130V110Q130 116 124 116H16Q10 116 10 110Z', fill: '#FFB3C7', stroke: k, 'stroke-width': 5, 'stroke-linejoin': 'round' }, s);
    svg('path', { d: 'M20 40V112M120 40V112', stroke: '#FF8DB3', 'stroke-width': 4 }, s);
    if (!open) { svg('path', { d: 'M4 26H136V46H4Z', fill: '#FF8DB3', stroke: k, 'stroke-width': 5, 'stroke-linejoin': 'round' }, s); svg('path', { d: 'M64 26H76V46H64Z', fill: '#FFC93C', stroke: k, 'stroke-width': 3 }, s); }
    s.style.pointerEvents = 'none';
    return s;
  },
  geo(st) { const L = K.L(), n = st.q.boxes; return L ? { y: 330, s: n >= 5 ? 160 : n === 4 ? 192 : 214, gap: n >= 5 ? 18 : 30, per: n } : { y: n > 3 ? 430 : 470, s: n > 3 ? 196 : 200, gap: 22, per: n === 4 ? 2 : 3 }; },
  cardSpot() { return K.L() ? { cx: 512, cy: 612 } : { cx: 352, cy: 800 }; },
  /* the five number cards: one row between the watchers (landscape), one row above them (portrait) */
  cardFr(L) { return (L == null ? K.L() : L) ? { x: 160, y: 540, w: 704, h: 150 } : { x: 16, y: 730, w: 672, h: 140 }; },
  cardSize(n) { return W3X.size2(n, [this.cardFr(true), this.cardFr(false)], 136, 16); },
  decor(G) { W3X.decor2(G, this.chars); },
  inBox(st, b, j) { const m = st.q.per, cols = m <= 2 ? m : m <= 4 ? 2 : 3, rows = Math.ceil(m / cols), r = Math.floor(j / cols), c = j % cols, inRow = Math.min(cols, m - r * cols), sz = Math.round(Math.min(58, b.w * (cols === 3 ? 0.27 : 0.34), b.h * (rows === 2 ? 0.34 : 0.5))); return { x: b.x + b.w / 2 + (c - (inRow - 1) / 2) * (sz + 4) - sz / 2, y: b.y + b.h * 0.62 + (r - (rows - 1) / 2) * (sz + 2) - sz / 2, s: sz }; },
  place(st) {
    const g = this.geo(st);
    W3X.row(st.q.boxes, Stage.W / 2, g.y, g.s, g.gap, g.per).forEach((p, i) => { place(st.boxEls[i], p.x, p.y, g.s, g.s * 120 / 140); });
    st.items.forEach(o => { const b = box(st.boxEls[o.b]), p = this.inBox(st, b, o.j); place(o.e, p.x, p.y, p.s, p.s); });
    if (st.lids) st.lids.forEach((l, i) => { const b = box(st.boxEls[i]); place(l, b.x + b.w / 2 - 34, b.y - 40, 68, 46); });
    if (st.cards) W3X.lay(st.cards, this.cardFr(), box(st.cards[0]).w, null, 16);
  },
  async present(st) {
    const q = st.q;
    st.boxEls = Array.from({ length: q.boxes }, (_, i) => { const e = W2X.thing(st, 10, 10, 4, ''); e.appendChild(this.boxSvg(q.open === 'all' || i === 0)); return e; });
    st.items = [];
    for (let b = 0; b < q.boxes; b++) if (q.open === 'all' || b === 0) for (let j = 0; j < q.per; j++) { const e = K.item(Stage.el, 'assets/props/' + q.item + '.png', 44, 44); e.style.zIndex = 5; st.els.push(e); st.items.push({ e, b, j }); }
    /* a closed box carries a little label: as many dots as the open one holds (every box the same) */
    if (q.open === 'one') st.lids = st.boxEls.map((_, i) => { const l = W2X.thing(st, 68, 46, 6, ''); if (i === 0) l.style.visibility = 'hidden'; else { l.appendChild(UI.qty(q.per, 34, { dotsOnly: true })); Object.assign(l.style, { background: '#FFF8EC', borderRadius: '12px', boxShadow: '0 0 0 3px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center' }); } return l; });
    this.place(st);
    st.boxEls.forEach((e, i) => K.pop(st, e, 80 * i)); st.items.forEach((o, i) => K.pop(st, o.e, 200 + 30 * i));
    K.cards(st, q.opts, Object.assign({ layout: 'frame', size: this.cardSize(q.opts.length), gap: 16 }, this.cardSpot())); this.place(st);
    if (q.open === 'one') { K.task(st, [[{ node: (() => { const d = el('span'); d.style.display = 'flex'; d.style.gap = '4px'; for (let i = 0; i < 3; i++) { const b = el('span'); b.style.width = b.style.height = '40px'; b.appendChild(this.boxSvg(i === 0)); d.appendChild(b); } return d; })() }], ['q']]); W3X.say2(st, '每盒一样多！', '一共几个？'); }
    else { K.task(st, [['assets/props/' + q.item + '.png'], ['q']]); K.say(st, '一共几个？'); }
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  async reveal(st) {
    await this.show(st); if (!Session.alive(st)) return;
    Sfx.reveal(); this.cheerAll(st); st.summary = '一共' + CNQ(st.q.answer) + '个！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
  },
  /* after a wrong answer: his card (blue), the boxes opened and counted box by box, the right card (gold) */
  async explain(st, ans) { await W3X.explainCards(st, ans, { show: () => this.show(st), line: '一共' + CNQ(st.q.answer) + '个！' }); },
  audit(q) { return W3X.auditNum(q); },
  async show(st) {
    const q = st.q, my = st;
    if (q.open === 'one' && !st.opened) {      /* the lids come off: every box holds the same */
      st.opened = true;
      for (let b = 1; b < q.boxes; b++) { st.boxEls[b].innerHTML = ''; st.boxEls[b].appendChild(this.boxSvg(true)); if (st.lids && st.lids[b]) st.lids[b].style.visibility = 'hidden'; for (let j = 0; j < q.per; j++) { const e = K.item(Stage.el, 'assets/props/' + q.item + '.png', 44, 44); e.style.zIndex = 5; st.els.push(e); st.items.push({ e, b, j }); } }
      this.place(st);
    }
    for (let b = 0; b < q.boxes; b++) {      /* counted box by box: three, six, nine ... */
      if (!Session.alive(my)) return;
      st.items.filter(o => o.b === b).forEach(o => K.hop(st, o.e, 14));
      K.badge(st, st.boxEls[b], (b + 1) * q.per, 0, -10, 46);
      await Count.beat(st.scope, 420, (b + 1) * q.per);
    }
  },
  async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(W2Say.notN(ans)); await st.scope.wait(400); },
  next(st, strat) { return st.picked ? null : K.cardNext(st, strat); },
  workEls(st) { return st.boxEls || []; },
};

/* ================================================================ Bluey U2 · 种 rows and columns: plant where the row and the column meet */
const ROWC = [['#E8414B', '红色'], ['#4F7BFF', '蓝色'], ['#FFC93C', '黄色'], ['#5CC46E', '绿色'], ['#B57BFF', '紫色']];
const COLV = [['tomato', '番茄'], ['eggplant', '茄子'], ['pumpkin', '南瓜'], ['broccoli', '西兰花'], ['carrot', '胡萝卜']];
const MGrid = {
  kind0: 'grid', verb: '种！', intro: '种在哪一格？', praise: ['种得真准！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const [C, R] = [null, [3, 3], [4, 3], [4, 4], [4, 4], [5, 4]][d];
    const mode = d === 4 ? 'read' : 'put', two = d === 5;
    const cols = rng.shuffle(COLV.slice(0, 4)).slice(0, C).concat(C > 4 ? [COLV[4]] : []), rows = rng.shuffle(ROWC.slice()).slice(0, R);
    const cell = () => [rng.int(0, C - 1), rng.int(0, R - 1)];
    const t1 = cell(); let t2 = null; if (two) do { t2 = cell(); } while (t2[0] === t1[0] || t2[1] === t1[1]);
    if (mode === 'read') {
      /* four wrong cells, each in the sprout's row or its column (the right colour with the wrong vegetable, or back) */
      const cand = []; for (let r = 0; r < R; r++) if (r !== t1[1]) cand.push([t1[0], r]); for (let c = 0; c < C; c++) if (c !== t1[0]) cand.push([c, t1[1]]);
      const sameC = rng.shuffle(cand.filter(x => x[0] === t1[0])), sameR = rng.shuffle(cand.filter(x => x[1] === t1[1])), foils = [];
      for (let i = 0; foils.length < 4 && i < 6; i++) { if (sameC[i]) foils.push(sameC[i]); if (foils.length < 4 && sameR[i]) foils.push(sameR[i]); }
      const sh = W3X.deal(G, t1, foils, 'gr');
      return { k: [d, cols.map(c => c[0]).join(), rows.map(r => r[1]).join(), t1.join()], C, R, cols, rows, mode, t: [t1], opts: sh, answer: sh.indexOf(t1) };
    }
    return { k: [d, cols.map(c => c[0]).join(), rows.map(r => r[1]).join(), t1.join(), t2 ? t2.join() : ''], C, R, cols, rows, mode, t: two ? [t1, t2] : [t1], answer: (two ? [t1, t2] : [t1]).map(x => x.join(':')).join('|') };
  },
  geo(st) {
    const L = K.L(), q = st.q, cs = L ? Math.min(100, 470 / q.R) : Math.min(108, 520 / q.C);
    return L ? { cs, x0: 500 - q.C * cs / 2 + 30, y0: 600 - q.R * cs, hx: 500 - q.C * cs / 2 - 62, hy: 600 - q.R * cs - 74 } : { cs, x0: 352 - q.C * cs / 2 + 34, y0: 330, hx: 352 - q.C * cs / 2 - 46, hy: 330 - 82 };
  },
  cardSpot() { return K.L() ? { cx: 880, cy: 380 } : { cx: 352, cy: 880 }; },
  /* the five cards of "where is the sprout": two columns right of the field (landscape, above Bluey), one row under it */
  cardFr(L) { return (L == null ? K.L() : L) ? { x: 770, y: 104, w: 240, h: 420 } : { x: 16, y: 790, w: 672, h: 210 }; },
  decor(G) { const L = K.L(); W2X.hideAll(G, this.chars); const a = G.actors[this.chars[0]]; if (a && L) showActor(a, 940, 698, 160); },
  cellXY(st, c, r) { const g = this.geo(st); return { x: g.x0 + c * g.cs, y: g.y0 + r * g.cs }; },
  place(st) {
    const g = this.geo(st), q = st.q;
    st.cellEls.forEach(o => { const p = this.cellXY(st, o.c, o.r); place(o.e, p.x + 3, p.y + 3, g.cs - 6, g.cs - 6); });
    st.rowEls.forEach((e, r) => place(e, g.hx + 8, g.y0 + r * g.cs + g.cs / 2 - 30, 60, 60));
    st.colEls.forEach((e, c) => place(e, g.x0 + c * g.cs + g.cs / 2 - 32, g.hy + 4, 64, 64));
    st.plants.forEach(o => { const p = this.cellXY(st, o.c, o.r); place(o.e, p.x + g.cs / 2 - 32, p.y + g.cs / 2 - 34, 64, 64); });
    if (st.cards) W3X.lay(st.cards, this.cardFr(), box(st.cards[0]).w, null, 12);
  },
  flag(color) { const d = el('div', ''); d.innerHTML = '<svg viewBox="0 0 60 60" width="100%" height="100%"><path d="M12 6V56" stroke="#2B2118" stroke-width="5" stroke-linecap="round"/><path d="M14 8H52L44 22L52 36H14Z" fill="' + color + '" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/></svg>'; return d; },
  cue(q, t) { const d = el('span'); d.style.display = 'flex'; d.style.alignItems = 'center'; d.style.gap = '4px'; const f = this.flag(q.rows[t[1]][0]); f.style.width = f.style.height = '44px'; d.appendChild(f); const v = img('assets/props/' + q.cols[t[0]][0] + '.png', '', d); v.style.height = v.style.width = '44px'; return d; },
  async present(st) {
    const q = st.q;
    st.cellEls = []; for (let r = 0; r < q.R; r++) for (let c = 0; c < q.C; c++) { const e = W2X.thing(st, 10, 10, 3, ''); Object.assign(e.style, { borderRadius: '12px', background: (r + c) % 2 ? '#9A6433' : '#A8723C', boxShadow: '0 0 0 3px #2B2118, inset 0 -6px 0 rgba(0,0,0,.15)', borderLeft: '8px solid ' + q.rows[r][0] }); if (q.mode === 'put') K.reg(st, 'g' + c + '_' + r, e, {}); st.cellEls.push({ e, c, r }); }
    st.rowEls = q.rows.map(rw => { const e = W2X.thing(st, 60, 60, 4, ''); e.appendChild(this.flag(rw[0])); return e; });
    st.colEls = q.cols.map(cv => { const e = W2X.thing(st, 64, 64, 4, 'card'); const im = img('assets/props/' + cv[0] + '.png', '', e); Object.assign(im.style, { width: '82%', height: '82%', objectFit: 'contain' }); return e; });
    st.plants = []; st.step = 0;
    if (q.mode === 'read') { const t = q.t[0], e = K.item(Stage.el, 'assets/props/sprout.png', 64, 64); e.style.zIndex = 6; st.els.push(e); st.plants.push({ e, c: t[0], r: t[1] }); }
    this.place(st);
    st.cellEls.forEach((o, i) => K.pop(st, o.e, 18 * i));
    if (q.mode === 'read') {
      W2X.cards(st, q.opts.map(t => this.cue(q, t)), q.opts.map((_, i) => i), Object.assign({ size: W3X.size2(q.opts.length, [this.cardFr(true), this.cardFr(false)], 136, 12), gap: 12 }, this.cardSpot()));
      this.place(st);
      K.task(st, [['assets/props/sprout.png'], ['q']]); K.say(st, '小苗在哪一格？');
    } else this.ask(st);
  },
  ask(st) {
    const q = st.q, t = q.t[st.step];
    if (st.taskEl) { st.taskEl.remove(); }
    st.taskEl = K.task(st, [[{ node: this.cue(q, t) }], ['assets/props/sprout.png']]);
    W3X.say2(st, q.rows[t[1]][1] + '这一行，', q.cols[t[0]][1] + '这一列！');
  },
  onGesture(st, name, p) {
    const id = p.id || ''; const q = st.q;
    if (q.mode === 'read') return W3X.tapCards(st, name, p);
    const m = /^g(\d)_(\d)$/.exec(id); if (name !== 'tap' || !m || st.done) return false;
    const c = Number(m[1]), r = Number(m[2]);
    if (st.plants.some(o => o.c === c && o.r === r)) return false;
    const e = K.item(Stage.el, 'assets/props/sprout.png', 64, 64); e.style.zIndex = 6; st.els.push(e); st.plants.push({ e, c, r }); this.place(st); K.pop(st, e); Sfx.place();
    st.got = (st.got || []).concat([c + ':' + r]);
    st.step++;
    if (st.step >= q.t.length) { st.done = true; Session.submit(st, st.got.join('|')); }
    else this.ask(st);
    return 'ok';
  },
  evaluate(st, ans) { return st.q.mode === 'read' ? ans === st.q.answer : ans === st.q.answer; },
  async reveal(st) {
    const q = st.q;
    q.t.forEach(t => { const rowE = st.cellEls.filter(o => o.r === t[1]).map(o => o.e), colE = st.cellEls.filter(o => o.c === t[0]).map(o => o.e); K.flash(st, rowE.concat(colE)); });
    st.plants.forEach(o => { st.scope.anim(o.e, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 500, easing: EASE.pop }); });
    Sfx.reveal(); this.cheerAll(st); st.summary = '行和列都对！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  /* the sprout's row (its flag and its cells) lights up, then its column (the vegetable and its cells) */
  async showRC(st, t) {
    K.flash(st, [st.rowEls[t[1]]].concat(st.cellEls.filter(o => o.r === t[1]).map(o => o.e)));
    await st.scope.wait(T(700)); if (!Session.alive(st)) return;
    K.flash(st, [st.colEls[t[0]]].concat(st.cellEls.filter(o => o.c === t[0]).map(o => o.e)));
    await st.scope.wait(T(800));
  },
  /* after a wrong answer: his card / his sprout (blue); the row, then the column; where they meet (gold) */
  async explain(st, ans) {
    const q = st.q, my = st;
    if (q.mode === 'read') { await W3X.explainCards(st, ans, { mine: ans, right: q.answer, show: () => this.showRC(st, q.t[0]) }); return; }
    const got = String(ans).split('|').map(s => s.split(':').map(Number)), i = Math.max(0, got.findIndex((g2, k) => g2[0] !== q.t[k][0] || g2[1] !== q.t[k][1])), g2 = got[i], t = q.t[i];
    const pl = g2 && st.plants.find(o => o.c === g2[0] && o.r === g2[1]); if (pl) W3X.mine(st, pl.e, 10);
    await st.scope.wait(T(700)); if (!Session.alive(my)) return;
    await this.showRC(st, t); if (!Session.alive(my)) return;
    let ok = st.plants.find(o => o.c === t[0] && o.r === t[1]);
    if (!ok) { const e = K.item(Stage.el, 'assets/props/sprout.png', 64, 64); e.style.zIndex = 6; st.els.push(e); ok = { e, c: t[0], r: t[1] }; st.plants.push(ok); this.place(st); K.pop(st, e); }
    const c = st.cellEls.find(o => o.c === t[0] && o.r === t[1]); W3X.gold(st, c ? c.e : ok.e, 4, 0);
    Sfx.reveal(); W3X.tell('种在这一格！');
    await W3X.beat(st, 1600);
  },
  audit(q) { return q.mode === 'read' ? { n: q.opts.length, pos: q.answer, err: q.opts.filter(x => x[0] === q.t[0][0] && x[1] === q.t[0][1]).length === 1 && new Set(q.opts.map(x => x.join())).size === q.opts.length ? null : 'cells' } : { none: 'a field of ' + q.C * q.R + ' cells' }; },
  async feedback(st, ans) {
    const q = st.q;
    if (q.mode === 'read') { const t = q.opts[ans], a = q.t[0]; if (st.cards[ans]) K.wiggle(st, st.cards[ans]); W3X.say(t[1] !== a[1] ? '不是' + q.rows[t[1]][1] + '那行' : '不是' + q.cols[t[0]][1] + '那列'); await st.scope.wait(500); return; }
    const got = String(ans).split('|').map(s => s.split(':').map(Number)), i = got.findIndex((g2, k) => g2[0] !== q.t[k][0] || g2[1] !== q.t[k][1]), g2 = got[i], t = q.t[i];
    const pl = st.plants.find(o => o.c === g2[0] && o.r === g2[1]); if (pl) K.wiggle(st, pl.e);
    W3X.say(g2[1] !== t[1] ? '这是' + q.rows[g2[1]][1] + '那行' : '这是' + q.cols[g2[0]][1] + '那列'); await st.scope.wait(600);
  },
  next(st, strat) {
    const q = st.q;
    if (q.mode === 'read') { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? (q.answer + 1) % q.opts.length : q.answer; return { g: 'tap', p: { id: 'card' + i } }; }
    if (st.done) return null;
    const t = q.t[st.step]; let c = t[0], r = t[1];
    if (strat === 'wrong') r = (r + 1) % q.R;
    return { g: 'tap', p: { id: 'g' + c + '_' + r } };
  },
  workEls(st) { return st.q.mode === 'read' ? (st.cards || []) : st.rowEls.concat(st.colEls); },
  gestureHint(st) { if (st.q.mode === 'read') return; const t = st.q.t[st.step || 0]; K.flash(st, [st.rowEls[t[1]], st.colEls[t[0]]]); },   /* the row's flag and the column's sign - where to look, not the cell */
  snap(st) { return { step: st.step || 0 }; },
};

/* ================================================================ Bluey U3 · 变 the magic cups: which cup hides the ball */
const MCups = {
  kind0: 'cups', verb: '变！', intro: '爸爸变魔术！', praise: ['眼睛跟得真紧！'],
  /* five cups at every level (client: five options); the number of swaps and their speed grow with the level as before.
     About two swaps in three move the ball's cup (as with three cups), so the ball is still followed, not just found */
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, n = 5;
    const [swaps, ms] = [null, [2, 760], [3, 660], [4, 560], [4, 540], [6, 460]][d];
    const end = bagPick(G, 'cu', [0, 1, 2, 3, 4]);                /* where the ball ends: each cup as often */
    let best = null;
    for (let t = 0; t < 60; t++) {
      const ball = rng.int(0, n - 1), list = []; let pos = ball;
      for (let i = 0; i < swaps; i++) {
        let a, b, k = 0;
        do { if (rng() < 0.67) { a = pos; b = rng.int(0, n - 1); } else { a = rng.int(0, n - 1); b = rng.int(0, n - 1); } k++; }
        while (k < 50 && (a === b || (list.length && ((list[list.length - 1][0] === a && list[list.length - 1][1] === b) || (list[list.length - 1][0] === b && list[list.length - 1][1] === a)))));
        list.push([a, b]); if (pos === a) pos = b; else if (pos === b) pos = a;
      }
      const moved = list.filter(([a, b]) => a !== b).length === swaps && pos !== ball;
      best = { ball, list, pos };
      if (moved && pos === end) break;
    }
    return { k: [n, best.ball, best.list.map(x => x.join('')).join('.')], n, ball: best.ball, swaps: best.list, ms, answer: best.pos };
  },
  geo(st) { return K.L() ? { y: 420, s: 150, gap: 30 } : { y: 560, s: 120, gap: 14 }; },
  decor(G) { W3X.decor2(G, ['bandit', 'bluey']); },
  slotXY(st, i) { const g = this.geo(st); return W3X.row(st.q.n, Stage.W / 2, g.y, g.s, g.gap)[i]; },
  place(st) {
    const g = this.geo(st);
    st.cups.forEach(o => { const p = this.slotXY(st, o.slot); place(o.e, p.x, p.y, g.s, g.s); });
    if (st.ballEl) { const p = this.slotXY(st, st.ballSlot); place(st.ballEl, p.x + g.s / 2 - 30, p.y + g.s - 62, 60, 60); }
  },
  cupSvg() { const s = W3X.svg(140, 140); s.innerHTML = '<path d="M26 128L40 22Q70 10 100 22L114 128Z" fill="#E8414B" stroke="#2B2118" stroke-width="6" stroke-linejoin="round"/><path d="M34 112H106" stroke="#FFC93C" stroke-width="10"/><path d="M38 40Q70 30 102 40" fill="none" stroke="#FF8A7A" stroke-width="6"/><ellipse cx="70" cy="128" rx="44" ry="8" fill="#B8323A" stroke="#2B2118" stroke-width="5"/>'; return s; },
  async lift(st, o) { await st.scope.anim(o.e, [{ transform: 'translateY(0)' }, { transform: 'translateY(-90px)' }], { duration: 300, easing: EASE.glide, fill: 'forwards' }); },
  async present(st) {
    const q = st.q, my = st;
    st.cups = Array.from({ length: q.n }, (_, i) => { const e = W3X.card(st, 'cup' + i, 6, ''); e.appendChild(this.cupSvg()); return { e, slot: i, id: i }; });
    st.ballSlot = q.ball;
    st.ballEl = K.item(Stage.el, 'assets/props/pompom.png', 60, 60); st.ballEl.style.zIndex = 5; st.els.push(st.ballEl);
    this.place(st);
    K.task(st, [['assets/props/pompom.png'], [W3X.ic('<path d="M22 86L30 30Q50 22 70 30L78 86Z" fill="#E8414B" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/>')], ['q']]);
    st.phase = 'show';
    K.say(st, '看好球在哪里！');
    const c0 = st.cups.find(o => o.slot === q.ball);
    await st.scope.anim(c0.e, [{ transform: 'translateY(0)' }, { transform: 'translateY(-96px)' }, { transform: 'translateY(-96px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: T(1700) + 1, easing: EASE.glide, fill: 'none' });
    if (!Session.alive(my)) return;
    st.ballEl.style.visibility = 'hidden';
    await st.scope.wait(T(300));
    for (const [a, b] of q.swaps) {           /* two cups trade places along little arcs */
      if (!Session.alive(my)) return;
      await this.swap(st, a, b, q.ms, false);
    }
    if (!Session.alive(my)) return;
    st.ballSlot = q.answer;
    st.phase = 'setup';
    K.say(st, '球在哪个杯子里？');
  },
  /* two cups trade places along little arcs (the ball, when it is seen, goes with its cup) */
  async swap(st, a, b, ms, withBall) {
    const A = st.cups.find(o => o.slot === a), B = st.cups.find(o => o.slot === b), pa = this.slotXY(st, a), pb = this.slotXY(st, b), dx = pb.x - pa.x;
    const kA = [{ transform: 'translate(0,0)' }, { transform: 'translate(' + dx / 2 + 'px,-46px)' }, { transform: 'translate(' + dx + 'px,0)' }], kB = [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (-dx / 2) + 'px,46px)' }, { transform: 'translate(' + (-dx) + 'px,0)' }];
    const o = { duration: T(ms) + 1, easing: 'ease-in-out', fill: 'forwards' }, all = [st.scope.anim(A.e, kA, o), st.scope.anim(B.e, kB, o)];
    if (withBall && (st.ballSlot === a || st.ballSlot === b)) all.push(st.scope.anim(st.ballEl, st.ballSlot === a ? kA : kB, o));
    Sfx.whoosh(0.15);
    await Promise.all(all);
    if (!Session.alive(st)) return;
    A.slot = b; B.slot = a; if (withBall) st.ballSlot = st.ballSlot === a ? b : st.ballSlot === b ? a : st.ballSlot;
    this.place(st); [A.e, B.e, st.ballEl].forEach(e => e.getAnimations().forEach(x => x.cancel()));
  },
  /* after a wrong answer: his cup is empty (blue); then the cups go back and swap again, slower and see-through, so the
     ball can be followed; its cup (gold) comes up */
  async explain(st, ans) {
    const q = st.q, my = st, mine = st.pickedCup;
    if (mine) W3X.mine(st, mine.e, 4);
    await st.scope.wait(T(700)); if (!Session.alive(my)) return;
    st.els.filter(e => e.classList && e.classList.contains('ringo')).forEach(e => e.remove());
    st.cups.forEach(o => { o.e.getAnimations().forEach(x => x.cancel()); o.slot = o.id; o.e.style.opacity = '0.5'; });
    st.ballSlot = q.ball; st.ballEl.style.visibility = ''; st.ballEl.style.zIndex = 7; this.place(st);
    W3X.tell('再看一遍！');
    await st.scope.wait(T(600)); if (!Session.alive(my)) return;
    for (const [a, b] of q.swaps) { if (!Session.alive(my)) return; await this.swap(st, a, b, Math.min(q.ms, 380), true); }
    if (!Session.alive(my)) return;
    st.cups.forEach(o => { o.e.style.opacity = ''; });
    const c = st.cups.find(o => o.slot === q.answer); W3X.gold(st, c.e, 4, 0); this.lift(st, c);
    const b = box(st.ballEl); Fx.burst(b.x + 30, b.y + 30, { n: 12, dist: 60 });
    Sfx.reveal(); W3X.tell('球在这里！');
    await W3X.beat(st, 1500);
  },
  audit(q) { let p = q.ball; q.swaps.forEach(([a, b]) => { if (p === a) p = b; else if (p === b) p = a; }); return { n: q.n, pos: q.answer, err: p === q.answer && q.n >= 5 ? null : 'ball ' + p }; },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || !/^cup\d$/.test(id) || st.picked || !['ready', 'act', 'input'].includes(st.phase)) return false;
    const o = st.cups.find(x => 'cup' + x.id === id); st.picked = true; st.pickedCup = o;
    this.lift(st, o);
    Session.submit(st, o.slot); return 'ok';
  },
  async reveal(st) {
    this.place(st); st.ballEl.style.visibility = '';
    const b = box(st.ballEl); Fx.burst(b.x + 30, b.y + 30, { n: 14, dist: 70 }); K.hop(st, st.ballEl, 18);
    Sfx.reveal(); this.cheerAll(st); st.summary = '球在这里！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
  },
  async feedback(st) { W3X.say('这个是空的'); await st.scope.wait(700); },
  next(st, strat) { if (st.picked) return null; const want = strat === 'wrong' ? (st.q.answer + 1) % st.q.n : st.q.answer; const o = st.cups.find(x => x.slot === want); return { g: 'tap', p: { id: 'cup' + o.id } }; },
  workEls(st) { return (st.cups || []).map(o => o.e); },
  snap(st) { return { n: st.q.n }; },
};

/* ================================================================ Bluey U4 · 叠 see-through cards: what two cards make together (reasoning) */
const MOverlay = {
  kind0: 'overlay', verb: '叠！', intro: '两张叠起来！', praise: ['叠得清清楚楚！'],
  /* a card: up to 9 cells (3 x 3), each with one figure or nothing */
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const kinds = ['circle', 'tri', 'sq', 'star', 'heart', 'diamond'], cols = [0, 1, 2, 3, 4];
    const fig = () => ({ k: rng.pick(kinds), c: rng.pick(cols) });
    const per = d <= 1 ? 1 : d === 2 ? 2 : 3;
    const cells = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const A = {}, B = {};
    cells.slice(0, per).forEach(i => { A[i] = fig(); }); cells.slice(per, per * 2).forEach(i => { B[i] = fig(); });
    const U = Object.assign({}, A, B), key = c => Object.keys(c).sort().map(i => i + c[i].k + c[i].c).join(';');
    const free = cells.slice(per * 2), other = (f, by) => (by === 'k' ? { k: rng.pick(kinds.filter(x => x !== f.k)), c: f.c } : { k: f.k, c: rng.pick(cols.filter(x => x !== f.c)) });
    const moveOne = (c0, k0, j) => { const c = Object.assign({}, c0); c[j] = c[k0]; delete c[k0]; return c; };
    if (d <= 3) {
      /* which picture do A and B make? Four wrong pictures, each with another mistake: one less, one more, one moved,
         one with another shape, one with another colour */
      const used = Object.keys(U), cats = {
        less: used.map(i => { const c = Object.assign({}, U); delete c[i]; return c; }),
        more: free.map(i => Object.assign({}, U, { [i]: fig() })),
        pos: used.flatMap(i => free.map(j => moveOne(U, i, j))),
        shape: used.map(i => Object.assign({}, U, { [i]: other(U[i], 'k') })),
        color: used.map(i => Object.assign({}, U, { [i]: other(U[i], 'c') })),
      };
      const order = rng.shuffle(Object.keys(cats)), pool = [];
      order.forEach(w => { const l = rng.shuffle(cats[w]); pool.push({ c: l[0], why: w }); });
      order.forEach(w => rng.shuffle(cats[w]).forEach(c => pool.push({ c, why: w })));
      const right = { c: U, why: 'ok' }, opts = W3X.deal(G, right, W3X.uniq(pool, x => key(x.c), 4, [right]), 'ov');
      return { k: [d, key(A), key(B)], mode: 'make', A, B, opts, answer: opts.indexOf(right) };
    }
    /* which two cards make this picture? Three cards that do not: things in other places (level 4); one of the two with a
       shape / a colour changed or one thing moved (level 5) */
    const mk = [() => { const c = {}; rng.shuffle(free).slice(0, per).forEach(i => { c[i] = fig(); }); return c; },
      () => { const c = Object.assign({}, A), k0 = rng.pick(Object.keys(c)); c[k0] = other(c[k0], 'k'); return c; },
      () => { const c = Object.assign({}, B), k0 = rng.pick(Object.keys(c)); c[k0] = other(c[k0], 'c'); return c; },
      () => moveOne(B, rng.pick(Object.keys(B)), rng.pick(free)),
      () => moveOne(A, rng.pick(Object.keys(A)), rng.pick(free))];
    let all = null;
    for (let t = 0; t < 60 && !all; t++) {
      const dec = (d === 4 ? [mk[0], mk[0], rng.pick([mk[3], mk[4]])] : rng.shuffle(mk.slice(1)).slice(0, 3)).map(f => f());
      const cs = [A, B].concat(dec);
      if (new Set(cs.map(key)).size !== 5) continue;
      if (this.pairs(cs, U).length !== 1) continue;
      const pairs = []; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) pairs.push(i + '-' + j);
      const at = bagPick(G, 'ovp', pairs).split('-').map(Number), out = []; let k = 0;
      for (let i = 0; i < 5; i++) out.push(at[0] === i ? { c: A, role: 'part' } : at[1] === i ? { c: B, role: 'part' } : { c: dec[k++], role: 'decoy' });
      all = out;
    }
    if (!all) return this.gen(G, Object.assign({}, o, { level: 3 }));
    const ans = all.map((x, i) => (x.role === 'part' ? i : -1)).filter(i => i >= 0).join('-');
    return { k: [d, key(A), key(B), all.map(x => key(x.c)).join('/')], mode: 'find', target: U, cardsC: all, answer: ans };
  },
  /* the pairs of cards that together show exactly the picture (no place used twice) */
  pairs(cs, U) {
    const key = c => Object.keys(c).sort().map(i => i + c[i].k + c[i].c).join(';'), out = [];
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i], b = cs[j]; if (Object.keys(a).some(x => b[x])) continue; if (key(Object.assign({}, a, b)) === key(U)) out.push(i + '-' + j); }
    return out;
  },
  /* the places where two cards differ */
  diff(a, b) { const out = []; for (let i = 0; i < 9; i++) { const x = a[i], y = b[i]; if (!x !== !y || (x && (x.k !== y.k || x.c !== y.c))) out.push(i); } return out; },
  cellRing(s, i, color) { if (s) W3X.ringIn(s, 22 + (i % 3) * 38, 22 + Math.floor(i / 3) * 38, 18, color, 3.5); },
  audit(q) {
    const key = c => Object.keys(c).sort().map(i => i + c[i].k + c[i].c).join(';');
    if (q.mode === 'make') { const U = key(Object.assign({}, q.A, q.B)), good = q.opts.map((x, i) => (key(x.c) === U ? i : -1)).filter(i => i >= 0); return { n: q.opts.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer && new Set(q.opts.map(x => key(x.c))).size === q.opts.length ? null : 'right ones ' + good }; }
    const p = this.pairs(q.cardsC.map(x => x.c), q.target);
    return { n: q.cardsC.length, pos: q.answer.split('-').map(Number), pick: 2, err: p.length === 1 && p[0] === q.answer ? null : 'pairs ' + p };
  },
  draw(c, size, tint) {
    const s = svg('svg', { viewBox: '0 0 120 120', width: size, height: size });
    svg('rect', { x: 3, y: 3, width: 114, height: 114, rx: 14, fill: tint ? 'rgba(190,232,255,.55)' : '#FFF8EC', stroke: '#2B2118', 'stroke-width': 4 }, s);
    for (let i = 1; i < 3; i++) { svg('path', { d: 'M' + (3 + i * 38) + ' 8V112M8 ' + (3 + i * 38) + 'H112', stroke: 'rgba(43,33,24,.12)', 'stroke-width': 2 }, s); }
    Object.keys(c).forEach(i => { const x = 22 + (i % 3) * 38, y = 22 + Math.floor(i / 3) * 38; W2X.shape(s, c[i].k, x, y, 12, W2X.pal[c[i].c], 0, 3); });
    s.style.pointerEvents = 'none';
    return s;
  },
  geo(st) { const L = K.L(); return st.q.mode === 'make' ? (L ? { ay: 250, cs: 156 } : { ay: 380, cs: 168 }) : (L ? { ty: 250, cs: 150 } : { ty: 360, cs: 160 }); },
  /* the five cards: one row right of Bingo (landscape), 3 + 2 (portrait) */
  optFr(L) { return (L == null ? K.L() : L) ? { x: 160, y: 440, w: 850, h: 230 } : { x: 16, y: 570, w: 672, h: 400 }; },
  decor(G) { W2X.hideAll(G, this.chars); const L = K.L(), a = G.actors[this.chars[0]]; if (a) showActor(a, L ? 86 : 72, L ? 698 : 1016, L ? 160 : 120); },
  place(st) {
    const g = this.geo(st), q = st.q, L = K.L();
    if (q.mode === 'make') {
      W3X.row(2, Stage.W / 2, g.ay, g.cs, 90).forEach((p, i) => place(st.ab[i], p.x, p.y, g.cs, g.cs));
      place(st.plus, Stage.W / 2 - 26, g.ay - 26, 52, 52);
    } else place(st.tgt, Stage.W / 2 - g.cs / 2, g.ty - g.cs / 2, g.cs, g.cs);
    st.optEls.forEach(e => { if (e._moved) { e.style.transform = ''; e._moved = false; } });
    W3X.lay(st.optEls, this.optFr(), this.optS(st), null, 20);
    void L;
  },
  optS(st) { return W3X.size2(st.optEls.length, [this.optFr(true), this.optFr(false)], 146, 20); },
  async present(st) {
    const q = st.q;
    st.sel = [];
    if (q.mode === 'make') {
      st.ab = [q.A, q.B].map(c => { const e = W2X.thing(st, 10, 10, 4, ''); e.appendChild(this.draw(c, '100%', true)); return e; });
      st.plus = W2X.thing(st, 52, 52, 4, ''); st.plus.innerHTML = '<svg viewBox="0 0 52 52" width="100%" height="100%"><path d="M26 8V44M8 26H44" stroke="#2B2118" stroke-width="9" stroke-linecap="round"/></svg>';
      st.optEls = q.opts.map((o, i) => { const e = W3X.card(st, 'card' + i, 5, 'card'); e.appendChild(this.draw(o.c, '96%')); return e; });
      st.cards = st.optEls; st.opts = q.opts.map((_, i) => i);
      this.place(st);
      st.ab.forEach((e, i) => K.pop(st, e, 120 * i)); st.optEls.forEach((e, i) => K.pop(st, e, 300 + 80 * i));
      K.task(st, [[W3X.ic('<rect x="8" y="14" width="56" height="56" rx="8" fill="rgba(190,232,255,.8)" stroke="#2B2118" stroke-width="4"/><rect x="34" y="32" width="56" height="56" rx="8" fill="rgba(190,232,255,.8)" stroke="#2B2118" stroke-width="4"/>')], ['q']]);
      K.say(st, '叠起来是哪个？');
    } else {
      st.tgt = W2X.thing(st, 10, 10, 4, ''); st.tgt.appendChild(this.draw(q.target, '100%'));
      st.optEls = q.cardsC.map((o, i) => { const e = W3X.card(st, 'card' + i, 5, ''); e.appendChild(this.draw(o.c, '100%', true)); return e; });
      this.place(st);
      K.pop(st, st.tgt); st.optEls.forEach((e, i) => K.pop(st, e, 200 + 80 * i));
      K.task(st, [[W3X.ic('<rect x="8" y="14" width="56" height="56" rx="8" fill="rgba(190,232,255,.8)" stroke="#2B2118" stroke-width="4"/><rect x="34" y="32" width="56" height="56" rx="8" fill="rgba(190,232,255,.8)" stroke="#2B2118" stroke-width="4"/>')], [{ node: (() => { const d = el('span'); d.style.width = d.style.height = '50px'; d.appendChild(this.draw(q.target, '50px')); return d; })() }]]);
      K.say(st, '哪两张叠成它？');
    }
  },
  onGesture(st, name, p) {
    const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || st.picked) return false;
    if (st.q.mode === 'make') { st.picked = true; Session.submit(st, i); return 'ok'; }
    if (st.sel.includes(i)) { st.sel = st.sel.filter(x => x !== i); st.optEls[i].classList.remove('hi'); return 'ok'; }
    st.sel.push(i); st.optEls[i].classList.add('hi'); Sfx.place();
    if (st.sel.length === 2) { st.picked = true; Session.submit(st, st.sel.slice().sort((a, b) => a - b).join('-')); }
    return 'ok';
  },
  async reveal(st) {
    const q = st.q, my = st;
    /* the two see-through cards slide onto each other on top (R9-4): what they show together is the picture */
    const pair = q.mode === 'make' ? st.ab : q.answer.split('-').map(Number).map(i => st.optEls[i]);
    const ans = q.mode === 'make' ? st.optEls[q.answer] : st.tgt, A = box(pair[0]);
    const meet = q.mode === 'make' ? { x: (box(pair[0]).x + box(pair[1]).x) / 2, y: A.y, w: A.w, h: A.h } : box(st.tgt);
    if (st.plus) st.plus.style.visibility = 'hidden';
    pair.forEach(e => { e.style.zIndex = 9; });
    await Promise.all(pair.map(e => { const b = box(e); return st.scope.anim(e, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (meet.x + meet.w / 2 - b.x - b.w / 2) + 'px,' + (meet.y + meet.h / 2 - b.y - b.h / 2) + 'px)' }], { duration: 700, easing: EASE.glide, fill: 'forwards' }); }));
    if (!Session.alive(my)) return;
    Sfx.pop(); K.hop(st, ans, 14);
    K.ring(st, [box(ans)], 8, '#FFC93C'); if (q.mode === 'make') K.ring(st, [meet], 8, '#FFC93C');
    Sfx.reveal(); this.cheerAll(st);
    st.summary = '叠起来就是它！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  /* after a wrong answer (the client's own example): the two see-through cards really slide together into one; his card
     is compared with it place by place - the places that differ get blue rings, on both; then the right card (gold),
     and the picture of the two lies exactly on it */
  async explain(st, ans) {
    const q = st.q, my = st;
    if (q.mode === 'make') {
      const o = q.opts[ans], ce = st.optEls[ans], [A, B] = st.ab, ba = box(A), bb = box(B), U = Object.assign({}, q.A, q.B);
      const meet = { x: (ba.x + bb.x) / 2, y: ba.y, w: ba.w, h: ba.h };
      if (st.plus) st.plus.style.visibility = 'hidden';
      [A, B].forEach(e => { e.style.zIndex = 9; });
      W3X.tell('两张叠起来是这样。');
      await Promise.all([A, B].map(e => K.flyTo(st, e, meet.x, meet.y, 650, 0))); if (!Session.alive(my)) return;
      const M = W2X.thing(st, meet.w, meet.h, 10, ''); place(M, meet.x, meet.y, meet.w, meet.h); M.appendChild(this.draw(U, '100%', true)); K.hop(st, M, 10);
      await st.scope.wait(T(400)); if (!Session.alive(my)) return;
      if (o && ce) {
        W3X.mine(st, ce, 6);
        const dif = this.diff(U, o.c), sm = M.querySelector('svg'), sc = ce.querySelector('svg');
        dif.forEach(i => { this.cellRing(sm, i, W3X.BLUE); this.cellRing(sc, i, W3X.BLUE); });
        W3X.tell(dif.length > 1 ? '这几格不一样。' : '这一格不一样。');
        await st.scope.wait(T(1500)); if (!Session.alive(my)) return;
      }
      const re = st.optEls[q.answer], rb = box(re), k = rb.w * 0.96 / meet.w;
      await K.flyTo(st, M, rb.x + rb.w / 2 - meet.w / 2, rb.y + rb.h / 2 - meet.h / 2, 600, 40, k); if (!Session.alive(my)) return;
      W3X.gold(st, re, 8, 0); Sfx.reveal(); W3X.tell('对的是这张！');
      st.scope.anim(M, [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 1200, fill: 'forwards' });         /* it lies exactly on it, then the card itself shows */
      await W3X.beat(st, 1500);
      return;
    }
    /* which two: his two slide onto the picture (the places that differ: blue), go back; the right two slide on (gold) */
    const sel = String(ans).split('-').map(Number), right = q.answer.split('-').map(Number), T0 = st.tgt, bt = box(T0), ts = T0.querySelector('svg');
    const onto = async (idx) => { await Promise.all(idx.map(i => { const e = st.optEls[i], b = box(e); e.style.zIndex = 9; e._moved = true; return K.flyTo(st, e, bt.x + bt.w / 2 - b.w / 2, bt.y + bt.h / 2 - b.h / 2, 650, 30, bt.w / b.w); })); };
    sel.forEach(i => W3X.mine(st, st.optEls[i], 6));
    await st.scope.wait(T(600)); if (!Session.alive(my)) return;
    st.els.filter(e => e.classList && e.classList.contains('ringo')).forEach(e => e.remove());
    await onto(sel); if (!Session.alive(my)) return;
    const a = q.cardsC[sel[0]].c, b = q.cardsC[sel[1]].c, both = Object.keys(a).filter(x => b[x]).map(Number);
    const g = svg('g', {}, ts), dif = this.diff(q.target, Object.assign({}, a, b)).concat(both).filter((x, i, l) => l.indexOf(x) === i);
    dif.forEach(i => this.cellRing(g, i, W3X.BLUE));
    W3X.tell(dif.length > 1 ? '这几格不一样。' : '这一格不一样。');
    await st.scope.wait(T(1800)); if (!Session.alive(my)) return;
    g.remove(); sel.forEach(i => { st.optEls[i].style.zIndex = 5; }); this.place(st);
    await st.scope.wait(T(300)); if (!Session.alive(my)) return;
    await onto(right); if (!Session.alive(my)) return;
    W3X.gold(st, T0, 10, 0); Sfx.reveal(); W3X.tell('叠起来就是它！');
    await W3X.beat(st, 1800);
  },
  async feedback(st, ans) {
    const q = st.q;
    if (q.mode === 'make') { if (st.optEls[ans]) K.wiggle(st, st.optEls[ans]); W3X.say({ less: '少了一个', more: '多了一个', pos: '位置不对哦', shape: '形状不对哦', color: '颜色不对哦' }[q.opts[ans].why] || '不一样哦'); }
    else { String(ans).split('-').map(Number).forEach(i => st.optEls[i] && K.wiggle(st, st.optEls[i])); W3X.say('这两张叠不出来'); }
    await st.scope.wait(600);
  },
  next(st, strat) {
    if (st.picked) return null;
    const q = st.q;
    if (q.mode === 'make') { const i = strat === 'wrong' ? (q.answer + 1) % q.opts.length : q.answer; return { g: 'tap', p: { id: 'card' + i } }; }
    const [a, b] = q.answer.split('-').map(Number), decoy = q.cardsC.findIndex(x => x.role === 'decoy');
    if (!st.sel.length) return { g: 'tap', p: { id: 'card' + a } };
    return { g: 'tap', p: { id: 'card' + (strat === 'wrong' ? decoy : b) } };
  },
  workEls(st) { return st.optEls || []; },
  snap(st) { return { mode: st.q.mode, sel: st.sel ? st.sel.length : 0 }; },
};

/* ================================================================ 睡衣小英雄 K1 · 灯 light the windows just like the picture (copying a pattern) */
const MLights = {
  kind0: 'lights', verb: '点灯！', intro: '帮小楼点灯！', praise: ['一模一样！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const [C, R, lit, nc] = [null, [3, 2, 2, 1], [3, 3, 3, 1], [3, 3, 5, 1], [4, 3, 5, 2], [4, 4, 7, 2]][d];
    const model = Array(C * R).fill(0), cells = rng.shuffle(model.map((_, i) => i)).slice(0, lit);
    cells.forEach((i, k) => { model[i] = nc === 2 ? (k % 2) + 1 : 1; });
    return { k: [d, model.join('')], C, R, nc, model, answer: model.join('') };
  },
  col: ['#2E3A6B', '#FFE36B', '#FF8DC7'],
  geo(st) { const L = K.L(), q = st.q; return L ? { ms: 52, mx: 236, my: 370, cs: Math.min(104, 400 / q.R), cx: 640, cy: 380 } : { ms: 46, mx: 352, my: 300, cs: Math.min(104, 420 / q.C), cx: 352, cy: 650 }; },
  decor(G) { W3X.decor2(G, this.chars, true); },
  place(st) {
    const g = this.geo(st), q = st.q;
    const fw = (n, s) => n * s + 24;
    place(st.mFace, g.mx - fw(q.C, g.ms) / 2, g.my - fw(q.R, g.ms) / 2, fw(q.C, g.ms), fw(q.R, g.ms));
    place(st.cFace, g.cx - fw(q.C, g.cs) / 2, g.cy - fw(q.R, g.cs) / 2, fw(q.C, g.cs), fw(q.R, g.cs));
    st.mWins.forEach((e, i) => place(e, g.mx - q.C * g.ms / 2 + (i % q.C) * g.ms + 4, g.my - q.R * g.ms / 2 + Math.floor(i / q.C) * g.ms + 4, g.ms - 8, g.ms - 8));
    st.cWins.forEach((e, i) => place(e, g.cx - q.C * g.cs / 2 + (i % q.C) * g.cs + 5, g.cy - q.R * g.cs / 2 + Math.floor(i / q.C) * g.cs + 5, g.cs - 10, g.cs - 10));
    if (st.doneBtn) K.placeDone(st.doneBtn);
  },
  face(st) { const e = W2X.thing(st, 10, 10, 3, ''); Object.assign(e.style, { borderRadius: '14px 14px 6px 6px', background: '#3B4A86', boxShadow: '0 0 0 5px #2B2118, 0 -14px 0 -2px #2B2118' }); return e; },
  paint(e, v) { e.style.background = this.col[v]; e.style.boxShadow = '0 0 0 4px #2B2118' + (v ? ', 0 0 18px 4px ' + this.col[v] : ''); },
  async present(st) {
    const q = st.q;
    st.state = Array(q.C * q.R).fill(0);
    st.mFace = this.face(st); st.cFace = this.face(st);
    st.mWins = q.model.map(v => { const e = W2X.thing(st, 10, 10, 4, ''); e.style.borderRadius = '6px'; this.paint(e, v); return e; });
    st.cWins = st.state.map((v, i) => { const e = W2X.thing(st, 10, 10, 4, ''); e.style.borderRadius = '10px'; this.paint(e, v); K.reg(st, 'w' + i, e, {}); return e; });
    st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {});
    this.place(st);
    K.pop(st, st.mFace); K.pop(st, st.cFace, 120);
    K.task(st, [[W3X.ic('<rect x="10" y="20" width="34" height="60" rx="4" fill="#3B4A86" stroke="#2B2118" stroke-width="4"/><rect x="16" y="28" width="10" height="10" fill="#FFE36B"/><rect x="28" y="44" width="10" height="10" fill="#FFE36B"/><rect x="56" y="20" width="34" height="60" rx="4" fill="#3B4A86" stroke="#2B2118" stroke-width="4"/><rect x="62" y="28" width="10" height="10" fill="#FFE36B"/><rect x="74" y="44" width="10" height="10" fill="#FFE36B"/>')], ['q']]);
    if (q.nc === 2) W3X.say2(st, '点两次变粉色！', '照样子点灯！'); else K.say(st, '照样子点灯！');
  },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || st.picked) return false;
    if (id === 'done') { st.picked = true; Session.submit(st, st.state.join('')); return 'ok'; }
    if (!/^w\d+$/.test(id)) return false;
    const i = Number(id.slice(1)); st.state[i] = (st.state[i] + 1) % (st.q.nc + 1); this.paint(st.cWins[i], st.state[i]); Sfx.place(); return 'ok';
  },
  async reveal(st) {
    K.flash(st, st.cWins.filter((_, i) => st.q.model[i]).concat(st.mWins.filter((_, i) => st.q.model[i])));
    Sfx.reveal(); this.cheerAll(st); st.summary = '和样子一模一样！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  async feedback(st, ans) { const a = String(ans), n = a.split('').filter((v, i) => v !== st.q.answer[i]).length; W3X.say(n === 1 ? '有一格不一样' : n === 2 ? '有两格不一样' : '好几格不一样'); await st.scope.wait(600); },
  /* not a choice (the child copies the picture); after a wrong answer: the windows that differ (blue, on both houses), then
     they are lit like the picture (gold) */
  async explain(st, ans) {
    const q = st.q, my = st, a = String(ans), dif = q.model.map((v, i) => (String(v) !== a[i] ? i : -1)).filter(i => i >= 0);
    dif.forEach(i => { W3X.ringAt(st, box(st.cWins[i]), W3X.BLUE, 5); W3X.ringAt(st, box(st.mWins[i]), W3X.BLUE, 4); });
    W3X.tell(dif.length > 1 ? '这几格不一样。' : '这一格不一样。');
    await st.scope.wait(T(1600)); if (!Session.alive(my)) return;
    for (const i of dif) { if (!Session.alive(my)) return; st.state[i] = q.model[i]; this.paint(st.cWins[i], q.model[i]); K.pop(st, st.cWins[i]); Sfx.place(); await st.scope.wait(T(220)); }
    W3X.gold(st, st.cFace, 10, 0); Sfx.reveal(); W3X.tell('和样子一模一样！');
    await W3X.beat(st, 1600);
  },
  audit() { return { none: 'the child lights the windows' }; },
  next(st, strat) {
    if (st.picked) return null;
    if (strat === 'wrong') return { g: 'tap', p: { id: 'done' } };
    const i = st.state.findIndex((v, k) => v !== st.q.model[k]);
    return i >= 0 ? { g: 'tap', p: { id: 'w' + i } } : { g: 'tap', p: { id: 'done' } };
  },
  workEls(st) { return st.cWins || []; },
  gestureHint(st) { if (st.mFace) K.flash(st, [st.mFace].concat(st.mWins.filter((_, i) => st.q.model[i]))); },      /* look at the picture (R9-5) */
  snap(st) { return { lit: (st.state || []).filter(Boolean).length }; },
};

/* ================================================================ 睡衣小英雄 K2 · 同 two badges: the one picture on both */
const SPOT_IC = {
  moon: '<path d="M62 12A40 40 0 1 0 88 72A32 32 0 1 1 62 12Z" fill="#FFE36B"/>',
  star: '<polygon points="50,6 61,38 95,38 68,58 78,92 50,72 22,92 32,58 5,38 39,38" fill="#FFC93C"/>',
  sun: '<circle cx="50" cy="50" r="22" fill="#FF9F43"/><path d="M50 8V20M50 80V92M8 50H20M80 50H92M20 20L28 28M72 72L80 80M80 20L72 28M28 72L20 80" stroke="#FF9F43" stroke-width="8"/>',
  heart: '<path d="M50 88C10 60 6 34 22 20C34 10 46 16 50 28C54 16 66 10 78 20C94 34 90 60 50 88Z" fill="#FF6B8B"/>',
  cloud: '<path d="M24 76C8 76 6 56 20 52C18 34 40 26 50 38C56 22 82 24 82 46C96 48 96 76 80 76Z" fill="#E8F4FF"/>',
  drop: '<path d="M50 8C66 34 80 50 80 64A30 30 0 0 1 20 64C20 50 34 34 50 8Z" fill="#4FB3FF"/>',
  leaf: '<path d="M16 84C16 36 46 14 88 14C88 58 62 86 16 84Z" fill="#5CC46E"/><path d="M18 82L70 32" stroke="#2B2118" stroke-width="4" fill="none"/>',
  bolt: '<polygon points="58,6 18,56 46,56 38,94 82,40 54,40" fill="#FFE36B"/>',
  key: '<circle cx="30" cy="50" r="18" fill="#FFC93C"/><circle cx="30" cy="50" r="7" fill="#fff"/><path d="M46 50H90V64M76 50V62" stroke="#FFC93C" stroke-width="10" fill="none"/>',
  bell: '<path d="M50 12C30 12 24 32 24 50V66L14 78H86L76 66V50C76 32 70 12 50 12Z" fill="#FFC93C"/><circle cx="50" cy="84" r="8" fill="#FF9F43"/>',
  fish: '<path d="M10 50Q40 18 72 50Q40 82 10 50Z" fill="#FF7FA8"/><path d="M70 50L94 30V70Z" fill="#FF7FA8"/><circle cx="28" cy="46" r="4" fill="#2B2118"/>',
  apple: '<path d="M50 30C34 18 12 28 14 54C16 80 36 92 50 86C64 92 84 80 86 54C88 28 66 18 50 30Z" fill="#E8414B"/><path d="M52 30Q54 16 62 10" stroke="#2B2118" stroke-width="5" fill="none"/>',
  flower: [0, 72, 144, 216, 288].map(a => '<circle cx="' + (50 + 22 * Math.cos(a * Math.PI / 180)).toFixed(1) + '" cy="' + (50 + 22 * Math.sin(a * Math.PI / 180)).toFixed(1) + '" r="17" fill="#B57BFF"/>').join('') + '<circle cx="50" cy="50" r="13" fill="#FFE36B"/>',
  mush: '<path d="M10 52Q14 12 50 12Q86 12 90 52Z" fill="#E8414B"/><rect x="36" y="52" width="28" height="36" rx="8" fill="#FFF3D6"/><circle cx="34" cy="32" r="7" fill="#fff"/><circle cx="64" cy="28" r="6" fill="#fff"/>',
  crown: '<path d="M12 78L16 30L34 52L50 22L66 52L84 30L88 78Z" fill="#FFC93C"/>',
  note: '<circle cx="30" cy="74" r="14" fill="#3DD6C6"/><circle cx="74" cy="66" r="14" fill="#3DD6C6"/><path d="M42 72V20L86 12V62" stroke="#2B2118" stroke-width="6" fill="none"/>',
};
const MSpot = {
  kind0: 'spot', verb: '找！', intro: '找两边都有的！', praise: ['火眼金睛！'],
  slots: { 3: [[0, -0.42], [-0.38, 0.24], [0.38, 0.24]], 4: [[-0.36, -0.34], [0.36, -0.34], [-0.36, 0.36], [0.36, 0.36]], 5: [[0, 0], [0, -0.5], [0.48, -0.15], [0.3, 0.42], [-0.3, 0.42], [-0.48, -0.15]].slice(0, 5), 6: [[0, 0], [0, -0.52], [0.5, -0.16], [0.31, 0.43], [-0.31, 0.43], [-0.5, -0.16]], 7: [[0, 0], [0, -0.54], [0.47, -0.27], [0.47, 0.27], [0, 0.54], [-0.47, 0.27], [-0.47, -0.27]] },
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, n = d + 2;
    const keys = rng.shuffle(Object.keys(SPOT_IC)), c = keys[0], A = [c].concat(keys.slice(1, n)), B = [c].concat(keys.slice(n, 2 * n - 1));
    const lay = list => { const pos = rng.shuffle(this.slots[n].map((_, i) => i)); return list.map((k, i) => ({ k, at: pos[i], sz: d >= 3 ? 0.8 + rng() * 0.32 : 1, rot: d >= 4 ? rng.int(-50, 50) : 0 })); };
    return { k: [n, c, A.join(), B.join()], n, common: c, A: lay(A), B: lay(B), answer: c };
  },
  geo() { return K.L() ? { D: 400, a: [272, 386], b: [752, 386] } : { D: 344, a: [352, 392], b: [352, 768] }; },
  decor(G) { W2X.hideAll(G, this.chars); },
  place(st) {
    const g = this.geo(), n = st.q.n, base = g.D * (n <= 4 ? 0.27 : n === 5 ? 0.25 : 0.23);
    [['a', st.ca, st.q.A], ['b', st.cb, st.q.B]].forEach(([s, e, list]) => {
      const c = g[s]; place(e, c[0] - g.D / 2, c[1] - g.D / 2, g.D, g.D);
      list.forEach(o => { const p = this.slots[n][o.at], sz = base * o.sz, hit = Math.max(92, sz); place(o.e, c[0] + p[0] * g.D * 0.8 - hit / 2, c[1] + p[1] * g.D * 0.8 - hit / 2, hit, hit); o.e.firstChild.style.width = o.e.firstChild.style.height = sz + 'px'; });
    });
  },
  async present(st) {
    const q = st.q;
    const disc = () => { const e = W2X.thing(st, 10, 10, 3, ''); Object.assign(e.style, { borderRadius: '50%', background: '#FFF8EC', boxShadow: '0 0 0 6px #2B2118, 0 10px 0 6px rgba(43,33,24,.2)' }); return e; };
    st.ca = disc(); st.cb = disc();
    [['a', q.A], ['b', q.B]].forEach(([s, list]) => list.forEach(o => { const e = W2X.thing(st, 92, 92, 5, ''); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', clipPath: 'circle(50%)' }); const v = svg('svg', { viewBox: '0 0 100 100' }); v.innerHTML = '<g stroke="#2B2118" stroke-width="5" stroke-linejoin="round">' + SPOT_IC[o.k] + '</g>'; v.style.transform = 'rotate(' + o.rot + 'deg)'; v.style.pointerEvents = 'none'; v.style.overflow = 'visible'; e.appendChild(v); K.reg(st, s + '_' + o.k, e, {}); o.e = e; }));
    this.place(st);
    K.pop(st, st.ca); K.pop(st, st.cb, 120);
    K.task(st, [[W3X.ic('<circle cx="28" cy="50" r="24" fill="#FFF8EC" stroke="#2B2118" stroke-width="4"/><circle cx="72" cy="50" r="24" fill="#FFF8EC" stroke="#2B2118" stroke-width="4"/><polygon points="28,38 31,47 40,47 33,52 35,61 28,56 21,61 23,52 16,47 25,47" fill="#FFC93C"/><polygon points="72,38 75,47 84,47 77,52 79,61 72,56 65,61 67,52 60,47 69,47" fill="#FFC93C"/>')], ['q']]);
    K.say(st, '哪个两边都有？');
  },
  onGesture(st, name, p) { const m = /^[ab]_(\w+)$/.exec(p.id || ''); if (name !== 'tap' || !m || st.picked) return false; st.picked = true; st.tapped = p.id; Session.submit(st, m[1]); return 'ok'; },
  async reveal(st) {
    const c = st.q.common, a = st.q.A.find(o => o.k === c).e, b = st.q.B.find(o => o.k === c).e, s = K.lines(st);
    K.link(st, s, center(a), center(b), '#FFC93C'); [a, b].forEach(e => { K.ring(st, [box(e)], 2, '#FFC93C'); K.hop(st, e, 14); });
    Sfx.reveal(); st.summary = '两边都有它！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  async feedback(st, ans) { const o = st.q.A.concat(st.q.B).find(x => x.k === ans); if (o) K.wiggle(st, o.e); W3X.say('那边没有它'); await st.scope.wait(500); },
  /* all the pictures on both badges are the choices (5 to 13, more than five at every level); after a wrong answer: his
     picture (blue) and the other badge, where it is not; then the one on both (gold, joined) */
  async explain(st, ans) {
    const q = st.q, my = st, inA = q.A.find(x => x.k === ans), o = (st.tapped || '').startsWith('b_') ? q.B.find(x => x.k === ans) : inA || q.B.find(x => x.k === ans);
    if (o) { W3X.mine(st, o.e, 2); K.flash(st, [q.A.includes(o) ? st.cb : st.ca]); }
    await st.scope.wait(T(1300)); if (!Session.alive(my)) return;
    const c = q.common, a = q.A.find(x => x.k === c).e, b = q.B.find(x => x.k === c).e, s = K.lines(st);
    K.link(st, s, center(a), center(b), W3X.GOLD); [a, b].forEach(e => { W3X.gold(st, e, 2); });
    Sfx.reveal(); W3X.tell('两边都有它！');
    await W3X.beat(st, 1600);
  },
  audit(q) { const both = q.A.filter(x => q.B.some(y => y.k === x.k)); return { n: new Set(q.A.concat(q.B).map(x => x.k)).size, pos: null, err: both.length === 1 && both[0].k === q.common ? null : 'common ' + both.length }; },
  next(st, strat) { if (st.picked) return null; const k = strat === 'wrong' ? st.q.A.find(o => o.k !== st.q.common).k : st.q.common; return { g: 'tap', p: { id: 'a_' + k } }; },
  workEls(st) { return [st.ca, st.cb].filter(Boolean); },
  snap(st) { return { n: st.q.n }; },
};

/* ================================================================ 睡衣小英雄 K3 · 连 three in a row: win, or stop Romeo */
const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const MTicTac = {
  kind0: 'tictac', verb: '连！', intro: '连成一排！', praise: ['真会动脑筋！'],
  wins(b, who) { const out = []; LINES3.forEach(L => { const v = L.map(i => b[i]); if (v.filter(x => x === who).length === 2 && v.includes(0)) out.push(L[v.indexOf(0)]); }); return out.filter((x, i, a) => a.indexOf(x) === i); },
  done3(b) { return LINES3.some(L => b[L[0]] && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]); },
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const mode = d <= 2 ? 'win' : d === 3 ? 'block' : 'turn';
    for (let t = 0; t < 4000; t++) {
      const nc = d <= 1 ? 2 : rng.int(2, d >= 5 ? 3 : 3), nr = d <= 1 ? rng.int(1, 2) : rng.int(Math.max(1, nc - 1), nc + (d >= 4 ? 1 : 0));
      const b = Array(9).fill(0), cells = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      cells.slice(0, nc).forEach(i => { b[i] = 1; }); cells.slice(nc, nc + nr).forEach(i => { b[i] = 2; });
      if (this.done3(b)) continue;
      if (nc + nr > 4) continue;                          /* at least five empty places to choose from (client: five options) */
      const w = this.wins(b, 1), r = this.wins(b, 2);
      let ans = null;
      if (mode === 'win') { if (w.length !== 1 || r.length) continue; if (d === 1 && [[0, 4, 8], [2, 4, 6]].some(L => L.includes(w[0]) && L.filter(i => b[i] === 1).length === 2)) continue; ans = w[0]; }
      else if (mode === 'block') { if (w.length || r.length !== 1) continue; ans = r[0]; }
      else { if (w.length === 1 && r.length <= 1 && (d === 5 || r.length === 1 || rng() < 0.5)) ans = w[0]; else if (!w.length && r.length === 1) ans = r[0]; else continue; }
      return { k: [d, b.join('')], mode, b, answer: ans, why: w.length ? 'win' : 'block' };
    }
    return { k: [d, 'x'], mode: 'win', b: [1, 1, 0, 2, 2, 0, 0, 0, 0], answer: 2, why: 'win' };
  },
  geo() { return K.L() ? { cs: 128, x: 512, y: 392 } : { cs: 150, x: 352, y: 566 }; },
  decor(G) { const L = K.L(); W2X.hideAll(G, this.chars); const a = G.actors.catboy, r = G.actors.romeo; if (a) showActor(a, L ? 110 : 80, L ? 698 : 1016, L ? 190 : 150); if (r) showActor(r, L ? 920 : 630, L ? 698 : 1016, L ? 180 : 140); },
  place(st) { const g = this.geo(); st.cells.forEach((e, i) => place(e, g.x - 1.5 * g.cs + (i % 3) * g.cs + 4, g.y - 1.5 * g.cs + Math.floor(i / 3) * g.cs + 4, g.cs - 8, g.cs - 8)); place(st.board, g.x - 1.5 * g.cs - 12, g.y - 1.5 * g.cs - 12, 3 * g.cs + 24, 3 * g.cs + 24); },
  piece(e, who) { e.innerHTML = ''; if (!who) return; const d = el('div', '', e); Object.assign(d.style, { width: '84%', height: '84%', borderRadius: '50%', background: who === 1 ? '#4F7BFF' : '#E8414B', boxShadow: '0 0 0 4px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', pointerEvents: 'none' }); const im = img('assets/thumbs/' + (who === 1 ? 'catboy' : 'romeo') + '.png', '', d); Object.assign(im.style, { width: '92%', height: '92%', borderRadius: '50%' }); },
  async present(st) {
    const q = st.q;
    st.b = q.b.slice();
    st.board = W2X.thing(st, 10, 10, 3, ''); Object.assign(st.board.style, { borderRadius: '26px', background: 'rgba(30,40,90,.82)', boxShadow: '0 0 0 6px #2B2118' });
    st.cells = st.b.map((v, i) => { const e = W2X.thing(st, 10, 10, 4, ''); Object.assign(e.style, { borderRadius: '18px', background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }); this.piece(e, v); K.reg(st, 'c' + i, e, {}); return e; });
    this.place(st);
    st.cells.forEach((e, i) => K.pop(st, e, 40 * i));
    K.task(st, [[{ node: (() => { const d = el('span'); d.style.display = 'flex'; for (let i = 0; i < 3; i++) { const c = el('span', '', d); c.style.width = c.style.height = '30px'; this.piece(c, i < 2 ? 1 : 0); if (i === 2) { c.style.border = '3px dashed #2B2118'; c.style.borderRadius = '50%'; } } return d; })() }], ['q']]);
    K.say(st, q.mode === 'win' ? '放哪里连成一排？' : q.mode === 'block' ? '挡住罗密欧！' : '轮到你，放哪里？');
  },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || !/^c\d$/.test(id) || st.picked) return false;
    const i = Number(id.slice(1)); if (st.b[i]) return false;
    st.picked = true; st.b[i] = 1; this.piece(st.cells[i], 1); K.pop(st, st.cells[i]); Sfx.place();
    Session.submit(st, i); return 'ok';
  },
  async reveal(st) {
    const q = st.q, L = LINES3.find(l => l.includes(q.answer) && l.filter(x => x !== q.answer).every(x => q.b[x] === (q.why === 'win' ? 1 : 2)));
    if (L) { const s = K.lines(st); await K.link(st, s, center(st.cells[L[0]]), center(st.cells[L[2]]), q.why === 'win' ? '#FFC93C' : '#5CC46E'); L.forEach(x => K.hop(st, st.cells[x], 12)); }
    Sfx.reveal(); this.cheerAll(st); st.summary = q.why === 'win' ? '连成一排啦！' : '挡住罗密欧！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
  },
  async feedback(st, ans) {
    const q = st.q; K.wiggle(st, st.cells[ans]);
    W3X.say(q.mode === 'win' ? '这样连不成一排' : q.mode === 'block' ? '罗密欧还能连' : q.why === 'win' ? '你自己能连成！' : '罗密欧还能连');
    await st.scope.wait(600);
  },
  /* after a wrong answer: his piece fades (blue ring); the line that matters is drawn - his own three (gold) or Romeo's
     three that a piece in the right place stops - and his piece goes there (gold) */
  async explain(st, ans) {
    const q = st.q, my = st, e = st.cells[ans];
    if (e) { W3X.mine(st, e, 2); if (e.firstChild) e.firstChild.style.opacity = '0.4'; }
    await st.scope.wait(T(900)); if (!Session.alive(my)) return;
    const L = LINES3.find(l => l.includes(q.answer) && l.filter(x => x !== q.answer).every(x => q.b[x] === (q.why === 'win' ? 1 : 2)));
    if (L && q.why !== 'win') { this.piece(st.cells[q.answer], 2); st.cells[q.answer].firstChild.style.opacity = '0.45'; const s = K.lines(st); await K.link(st, s, center(st.cells[L[0]]), center(st.cells[L[2]]), '#E8414B'); W3X.tell('罗密欧要连成！'); await st.scope.wait(T(1300)); if (!Session.alive(my)) return; s.remove(); }
    if (e) this.piece(e, 0);
    this.piece(st.cells[q.answer], 1); K.pop(st, st.cells[q.answer]); Sfx.place();
    W3X.gold(st, st.cells[q.answer], 2, 0);
    if (L) { const s = K.lines(st); await K.link(st, s, center(st.cells[L[0]]), center(st.cells[L[2]]), q.why === 'win' ? W3X.GOLD : '#5CC46E'); }
    Sfx.reveal(); W3X.tell(q.why === 'win' ? '连成一排啦！' : '挡住罗密欧！');
    await W3X.beat(st, 1600);
  },
  audit(q) { const free = q.b.filter(v => !v).length, w = this.wins(q.b, 1), r = this.wins(q.b, 2), right = w.length ? w : r; return { n: free, pos: null, err: free >= 5 && right.length === 1 && right[0] === q.answer ? null : 'free ' + free + ' right ' + right }; },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? st.q.b.findIndex((v, k) => !v && k !== st.q.answer) : st.q.answer; return { g: 'tap', p: { id: 'c' + i } }; },
  workEls(st) { return (st.cells || []).filter((_, i) => !st.b[i]); },
  snap(st) { return { mode: st.q.mode }; },
};

/* ================================================================ 睡衣小英雄 K4 · 俯 seen from above: Owlette's view (reasoning: viewpoint) */
const MTopView = {
  kind0: 'topview', verb: '看！', intro: '猫头鹰女飞起来！', praise: ['像猫头鹰一样看！'],
  pal: ['#FF6B5B', '#4FB3FF', '#5CC46E', '#FFC93C'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, kinds = ['cube', 'cyl', 'prism'];
    const cols = rng.shuffle([0, 1, 2, 3]);
    let objs, foils = [];
    const key = os => os.map(x => x.k + x.gx + x.gz + x.c + (x.on != null ? 'o' + x.on : '')).join(';');
    if (d === 1) { const k = rng.pick(kinds); objs = [{ k, gx: 1, gz: 0.5, c: cols[0], big: 1 }]; kinds.filter(x => x !== k).forEach(x => foils.push({ os: [{ k: x, gx: 1, gz: 0.5, c: cols[0], big: 1 }], why: 'shape' })); }
    else if (d <= 3) {
      const n = d === 2 ? 2 : 3, ks = Array.from({ length: n }, () => rng.pick(kinds)); if (ks.every(x => x === ks[0])) ks[n - 1] = kinds[(kinds.indexOf(ks[0]) + 1) % 3];
      const xs = n === 2 ? [0.5, 1.5] : [0, 1, 2];
      objs = ks.map((k, i) => ({ k, gx: xs[i], gz: 0.5, c: cols[i], big: 1 }));
      const sw = objs.map((x, i) => Object.assign({}, x, { gx: xs[n - 1 - i] })); foils.push({ os: sw, why: 'lr' });
      const j = rng.int(0, n - 1), sh = objs.map((x, i) => i === j ? Object.assign({}, x, { k: kinds[(kinds.indexOf(x.k) + 1) % 3] }) : x); foils.push({ os: sh, why: 'shape' });
    } else if (d === 4) {
      const zs = rng.shuffle([[0, 0], [1, 1], [2, 0], [0, 1], [2, 1], [1, 0]]).slice(0, 3);
      if (zs.every(z => z[1] === zs[0][1])) zs[2][1] = 1 - zs[2][1];
      objs = zs.map((z, i) => ({ k: kinds[i], gx: z[0], gz: z[1], c: cols[i], big: 1 }));
      foils.push({ os: objs.map(x => Object.assign({}, x, { gz: 1 - x.gz })), why: 'fb' });
      foils.push({ os: objs.map(x => Object.assign({}, x, { gx: 2 - x.gx })), why: 'lr' });
    } else {
      const base = rng.pick(['cyl', 'cube']), top = base === 'cyl' ? 'cube' : 'cyl', side = 'prism';
      objs = [{ k: base, gx: 0.6, gz: 0.5, c: cols[0], big: 1 }, { k: top, gx: 0.6, gz: 0.5, c: cols[1], big: 0.5, on: 0 }, { k: side, gx: 1.9, gz: 0.5, c: cols[2], big: 1 }];
      foils.push({ os: [objs[0], objs[2]], why: 'hide' });
      foils.push({ os: [Object.assign({}, objs[0], { k: top }), Object.assign({}, objs[1], { k: base }), objs[2]], why: 'shape' });
    }
    /* four wrong views: the mistakes of this level first (left / right, front / back, the hidden top), then another shape
       or two colours swapped */
    const others = [], swapC = (i, j) => objs.map((x, k) => (k === i ? Object.assign({}, x, { c: objs[j].c }) : k === j ? Object.assign({}, x, { c: objs[i].c }) : x));
    objs.forEach((x, i) => kinds.filter(k => k !== x.k).forEach(k => others.push({ os: objs.map((y, j) => (j === i ? Object.assign({}, y, { k }) : y)), why: 'shape' })));
    for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) others.push({ os: swapC(i, j), why: 'color' });
    if (objs.length === 1) [0, 1, 2, 3].filter(c => c !== objs[0].c).forEach(c => others.push({ os: [Object.assign({}, objs[0], { c })], why: 'color' }));
    if (d >= 2) { others.push({ os: objs.map(x => Object.assign({}, x, { gx: 2 - x.gx })), why: 'lr' }); }
    if (d === 4) others.push({ os: objs.map(x => Object.assign({}, x, { gx: 2 - x.gx, gz: 1 - x.gz })), why: 'turn' });
    const vkey = os => os.map(x => x.k + x.gx + x.gz + x.c + (x.on != null ? 'o' : '') + (x.big || 1)).sort().join(';');
    const pool = rng.shuffle(foils).concat(rng.shuffle(others)), wrong = W3X.uniq(pool, f => vkey(f.os), 4, [{ os: objs }]);
    const right = { os: objs, why: 'ok' }, opts = W3X.deal(G, right, wrong, 'tv');
    return { k: [d, key(objs)], objs, opts, answer: opts.indexOf(right) };
  },
  audit(q) { const vkey = os => os.map(x => x.k + x.gx + x.gz + x.c + (x.on != null ? 'o' : '') + (x.big || 1)).sort().join(';'), t = vkey(q.objs), good = q.opts.map((o, i) => (vkey(o.os) === t ? i : -1)).filter(i => i >= 0); return { n: q.opts.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer && new Set(q.opts.map(o => vkey(o.os))).size === q.opts.length ? null : 'right ones ' + good }; },
  /* the scene, a little from the front: back row higher and smaller */
  scene(q, W, H) {
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%' }), k = W2X.ink;
    svg('path', { d: 'M' + (W * 0.12) + ' ' + (H * 0.42) + 'H' + (W * 0.88) + 'L' + (W * 0.98) + ' ' + (H * 0.9) + 'H' + (W * 0.02) + 'Z', fill: '#C98B4A', stroke: k, 'stroke-width': 5, 'stroke-linejoin': 'round' }, s);
    const order = q.objs.map((o, i) => [o, i]).sort((a, b) => a[0].gz - b[0].gz || (a[0].on != null) - (b[0].on != null));
    order.forEach(([o]) => {
      const sc = 0.82 + 0.18 * o.gz, sz = 108 * sc * (o.big || 1);
      const x = W / 2 + (o.gx - 1) * 150 * sc, base = H * (0.52 + 0.3 * o.gz);
      const y = o.on != null ? base - 108 * sc * 0.98 : base;
      this.solid3(s, o.k, x, y, sz, this.pal[o.c]);
    });
    s.style.pointerEvents = 'none';
    return s;
  },
  solid3(s, kind, x, y, sz, c) {
    const k = W2X.ink, a = { stroke: k, 'stroke-width': 4, 'stroke-linejoin': 'round' }, h = sz / 2, dp = sz * 0.28;
    const P = (pts, f) => svg('polygon', Object.assign({ points: W2X.pts(pts), fill: f }, a), s);
    const light = c + 'CC';
    if (kind === 'cube') { P([[x - h, y - sz], [x + h, y - sz], [x + h, y], [x - h, y]], c); P([[x - h, y - sz], [x - h + dp, y - sz - dp], [x + h + dp, y - sz - dp], [x + h, y - sz]], '#FFF8EC'); P([[x + h, y - sz], [x + h + dp, y - sz - dp], [x + h + dp, y - dp], [x + h, y]], light); }
    else if (kind === 'cyl') { svg('path', Object.assign({ d: 'M' + (x - h) + ' ' + (y - sz) + 'V' + y + 'A' + h + ' ' + dp + ' 0 0 0 ' + (x + h) + ' ' + y + 'V' + (y - sz) + 'Z', fill: c }, a), s); svg('ellipse', Object.assign({ cx: x, cy: y - sz, rx: h, ry: dp, fill: '#FFF8EC' }, a), s); }
    else { P([[x - h, y - sz * 0.9], [x + h, y - sz * 0.9], [x + h, y], [x - h, y]], c); P([[x - h, y - sz * 0.9], [x + h, y - sz * 0.9], [x + dp * 0.4, y - sz * 0.9 - dp * 1.6]], '#FFF8EC'); }
  },
  /* the view from above: the table as a square, every thing as its top shape */
  top(os, size) {
    const s = svg('svg', { viewBox: '0 0 120 120', width: size, height: size }), k = W2X.ink;
    svg('rect', { x: 4, y: 4, width: 112, height: 112, rx: 10, fill: '#E6B98A', stroke: k, 'stroke-width': 4 }, s);
    os.slice().sort((a, b) => (a.on != null) - (b.on != null)).forEach(o => {
      const x = 24 + o.gx * 36, y = 38 + o.gz * 44, r = 15 * (o.big || 1), f = this.pal[o.c];
      if (o.k === 'cube') svg('rect', { x: x - r, y: y - r, width: 2 * r, height: 2 * r, fill: f, stroke: k, 'stroke-width': 3 }, s);
      else if (o.k === 'cyl') svg('circle', { cx: x, cy: y, r, fill: f, stroke: k, 'stroke-width': 3 }, s);
      else svg('polygon', { points: W2X.pts([[x, y - r * 1.1], [x + r * 1.05, y + r * 0.75], [x - r * 1.05, y + r * 0.75]]), fill: f, stroke: k, 'stroke-width': 3, 'stroke-linejoin': 'round' }, s);
    });
    s.style.pointerEvents = 'none';
    return s;
  },
  geo() { return K.L() ? { sx: 512, sy: 270, sw: 500, sh: 310 } : { sx: 352, sy: 390, sw: 560, sh: 350 }; },
  /* the five views: one row right of Owlette (landscape), 3 + 2 (portrait) */
  optFr(L) { return (L == null ? K.L() : L) ? { x: 170, y: 446, w: 840, h: 230 } : { x: 16, y: 590, w: 672, h: 400 }; },
  decor(G) { W3X.decor2(G, this.chars, true); },
  place(st) { const g = this.geo(); place(st.sc, g.sx - g.sw / 2, g.sy - g.sh / 2, g.sw, g.sh); if (st.cards) W3X.lay(st.cards, this.optFr(), box(st.cards[0]).w, null, 22); },
  async present(st) {
    const q = st.q, g = this.geo();
    st.sc = W2X.thing(st, 10, 10, 4, ''); st.sc.appendChild(this.scene(q, 520, 330));
    W2X.cards(st, q.opts.map(o => this.top(o.os, '100%')), q.opts.map((_, i) => i), { size: W3X.size2(q.opts.length, [this.optFr(true), this.optFr(false)], 160, 22), gap: 22, cx: g.sx, cy: 600 });
    this.place(st);
    K.pop(st, st.sc);
    K.task(st, [[W3X.ic('<path d="M50 6C40 18 36 26 36 34H64C64 26 60 18 50 6Z" fill="#B57BFF" stroke="#2B2118" stroke-width="4"/><path d="M50 40V60M42 52L50 62L58 52" stroke="#2B2118" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="24" y="68" width="52" height="26" rx="6" fill="#E6B98A" stroke="#2B2118" stroke-width="4"/>')], ['q']]);
    K.say(st, '从上面看是哪个？');
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  async reveal(st) {
    const c = st.cards[st.q.answer]; K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 16);
    const ow = st.G.actors.owlette; if (ow && ow.x > 0) ow.hop();
    Sfx.reveal(); this.cheerAll(st); st.summary = '从上面看是这样！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  async feedback(st, ans) { if (st.cards[ans]) K.wiggle(st, st.cards[ans]); W3X.say({ shape: '形状不对哦', lr: '左右反了', fb: '前后反了', hide: '上面的也看得见', color: '颜色不对哦', turn: '方向不对哦' }[st.q.opts[ans].why] || '形状不对哦'); await st.scope.wait(500); },
  /* after a wrong answer: on his view, the shapes that are not as seen from above (blue rings); then the right view (gold)
     and every thing on the table lights up with its shape seen from above */
  async explain(st, ans) {
    const q = st.q, my = st, o = q.opts[ans], c = st.cards[ans], k = x => x.k + x.gx + x.gz + x.c + (x.on != null ? 'o' : '') + (x.big || 1);
    if (o && c) {
      W3X.mine(st, c, 6);
      const s = c.querySelector('svg'), have = q.objs.map(k), his = o.os.map(k);
      o.os.forEach(x => { if (!have.includes(k(x))) W3X.ringIn(s, 24 + x.gx * 36, 38 + x.gz * 44, 15 * (x.big || 1) + 5, W3X.BLUE, 3.5); });
      q.objs.forEach(x => { if (!his.includes(k(x)) && !o.os.some(y => y.gx === x.gx && y.gz === x.gz && (y.on != null) === (x.on != null))) W3X.ringIn(s, 24 + x.gx * 36, 38 + x.gz * 44, 15 * (x.big || 1) + 5, W3X.BLUE, 3.5); });
      await st.scope.wait(T(1500)); if (!Session.alive(my)) return;
    }
    const r = st.cards[q.answer], s = r.querySelector('svg'); W3X.gold(st, r, 6);
    const ow = st.G.actors.owlette; if (ow && ow.x > 0) ow.hop();
    for (const x of q.objs.slice().sort((a, b) => a.gx - b.gx)) { if (!Session.alive(my)) return; const ring = W3X.ringIn(s, 24 + x.gx * 36, 38 + x.gz * 44, 15 * (x.big || 1) + 5, W3X.GOLD, 3.5); st.scope.anim(ring, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 }); await st.scope.wait(T(380)); }
    Sfx.reveal(); W3X.tell('从上面看是这样！');
    await W3X.beat(st, 1500);
  },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.opts.length : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
  snap(st) { return { n: st.q.objs.length }; },
};

/* ================================================================ 汪汪队 R1 · 式 which number sentence tells the picture story */
const MSums = {
  kind0: 'sums', verb: '算！', intro: '看图选算式！', praise: ['算式选对啦！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, max = [0, 5, 6, 9, 10, 10][d];
    const thing = rng.pick([['seal', '只', '海豹'], ['starfish', '个', '海星']]);
    /* a sentence a child can check: numbers 0-10, the first and every one added or taken >= 1, never below 0 */
    const legal = s => { let v = s[0]; if (!(v >= 1 && v <= 10)) return false; for (let i = 1; i + 1 < s.length && s[i] !== '='; i += 2) { const n = s[i + 1]; if (!(n >= 1 && n <= 10)) return false; v = s[i] === '+' ? v + n : v - n; if (v < 0 || v > 10) return false; } return !s.includes('=') || (s[s.length - 1] >= 0 && s[s.length - 1] <= 10); };
    const key = x => x.s.join();
    for (let t = 0; t < 300; t++) {
      if (d === 5) {
        const a = rng.int(2, 6), b = rng.int(1, 4), c = rng.int(1, a + b - 1); if (a + b > max) continue;
        const ok = { s: [a, '+', b, '-', c], why: 'ok' };
        /* the wrong ones: the signs (came / went the other way), then a wrong number */
        const cand = [{ s: [a, '-', b, '+', c], why: 'op' }, { s: [a, '+', b, '+', c], why: 'op2' }, { s: [a, '-', b, '-', c], why: 'op' }].filter(x => legal(x.s));
        const nums = [{ s: [a, '+', b, '-', c + 1], why: 'c' }, { s: [a, '+', b, '-', c - 1], why: 'c' }, { s: [a + 1, '+', b, '-', c], why: 'a' }, { s: [a - 1, '+', b, '-', c], why: 'a' }, { s: [a, '+', b + 1, '-', c], why: 'b' }, { s: [a, '+', b - 1, '-', c], why: 'b' }].filter(x => legal(x.s));
        const foils = W3X.uniq(rng.shuffle(cand).concat(rng.shuffle(nums)), key, 4, [ok]);
        if (foils.length < 4) continue;
        const opts = W3X.deal(G, ok, foils, 'sm');
        return { k: [d, a, b, c, thing[0]], kind: 'two', a, b, c, res: a + b - c, thing, opts, answer: opts.indexOf(ok) };
      }
      const op = d === 1 ? '+' : bagPick(G, 'op' + d, ['+', '-']);
      let a, b; if (op === '+') { a = rng.int(1, max - 1); b = rng.int(1, max - a); } else { a = rng.int(2, max); b = rng.int(1, a - 1); }
      const res = op === '+' ? a + b : a - b, full = d === 4, R = (x, o2, y) => (o2 === '+' ? x + y : x - y);
      const mk = (x, o2, y, r, why) => ({ s: full ? [x, o2, y, '=', r] : [x, o2, y], why });
      const ok = mk(a, op, b, res, 'ok');
      /* the wrong ones: the other sign (came / went), how many there were, how many came or went; at level 4 a wrong result */
      const other = op === '+' ? (a >= b ? mk(a, '-', b, a - b, 'op') : mk(b, '-', a, b - a, 'op')) : mk(a, '+', b, a + b, 'op'), cand = [];
      [-1, 1].forEach(dx => { cand.push(mk(a + dx, op, b, R(a + dx, op, b), 'a')); cand.push(mk(a, op, b + dx, R(a, op, b + dx), 'b')); if (full) cand.push(mk(a, op, b, res + dx, 'res')); });
      const ok2 = cand.filter(x => legal(x.s) && !(op === '+' && x.s[0] === b && x.s[2] === a));
      const foils = W3X.uniq([other].concat(full ? rng.shuffle(ok2.filter(x => x.why === 'res')) : []).concat(rng.shuffle(ok2)), key, 4, [ok]).filter(x => legal(x.s));
      if (foils.length < 4) continue;
      const opts = W3X.deal(G, ok, foils, 'sm');
      return { k: [d, a, op, b, thing[0], full], kind: op, a, b, res, thing, full, opts, answer: opts.indexOf(ok) };
    }
    return { k: [d, 'x'], kind: '+', a: 2, b: 1, res: 3, thing, full: false, opts: [{ s: [2, '+', 1], why: 'ok' }, { s: [2, '-', 1], why: 'op' }, { s: [3, '+', 1], why: 'a' }], answer: 0 };
  },
  /* five number sentences, one per row: right of the rock (landscape), under it (portrait) */
  geo() { return K.L() ? { rock: { x: 50, y: 210, w: 420, h: 280 }, fr: { x: 500, y: 110, w: 510, h: 580 }, cw: 480, ch: 100, gap: 12 } : { rock: { x: 90, y: 196, w: 524, h: 250 }, fr: { x: 40, y: 466, w: 624, h: 548 }, cw: 620, ch: 100, gap: 12 }; },
  decor(G) { if (K.L()) W3X.decor2(G, this.chars, true); else W2X.hideAll(G, this.chars); },
  spot(st, i, n) { const r = this.geo().rock, cols = Math.min(5, Math.max(3, Math.ceil(n / 2))), rows = Math.ceil(n / cols), c = i % cols, rr = Math.floor(i / cols), inRow = Math.min(cols, n - rr * cols); return { x: r.x + r.w / 2 + (c - (inRow - 1) / 2) * 84 - 38, y: r.y + r.h / 2 + (rr - (rows - 1) / 2) * 84 - 38 }; },
  place(st) {
    const g = this.geo();
    place(st.rockEl, g.rock.x - 20, g.rock.y - 10, g.rock.w + 40, g.rock.h + 20);
    const here = st.items.filter(o => !o.gone);
    here.forEach((o, i) => { const p = this.spot(st, i, here.length); place(o.e, p.x, p.y, 76, 76); });
    st.items.filter(o => o.gone).forEach(o => place(o.e, -300, -300, 76, 76));
    if (st.cards) { const n = st.cards.length, y0 = g.fr.y + (g.fr.h - n * g.ch - (n - 1) * g.gap) / 2; st.cards.forEach((c, i) => place(c, g.fr.x + (g.fr.w - g.cw) / 2, y0 + i * (g.ch + g.gap), g.cw, g.ch)); }      /* one number sentence per row (R10-2) */
  },
  /* a number sentence a child can check without reading: every number with its dots under it; after a minus the
     number taken away is drawn crossed out (R10-2) */
  dotsOf(n, crossed) {
    const per = Math.max(1, Math.min(5, n)), rows = Math.max(1, Math.ceil(n / per)), g = 15, s = svg('svg', { viewBox: '0 0 ' + (per * g + 2) + ' ' + (rows * g + 2), width: per * g + 2, height: rows * g + 2 });
    for (let i = 0; i < n; i++) { const x = 1 + g / 2 + (i % per) * g, y = 1 + g / 2 + Math.floor(i / per) * g; svg('circle', { cx: x, cy: y, r: 5.8, fill: crossed ? '#FFF8EC' : '#4FB3FF', stroke: '#2B2118', 'stroke-width': 2 }, s); if (crossed) svg('path', { d: 'M' + (x - 5) + ' ' + (y - 5) + 'L' + (x + 5) + ' ' + (y + 5), stroke: '#E8414B', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, s); }
    s.style.flexShrink = '0';
    return s;
  },
  eqNode(s) {
    const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'none' });
    s.forEach((t, i) => {
      if (typeof t === 'number') {
        const col = el('div', '', d); Object.assign(col.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' });
        if (digits()) col.appendChild(UI.num(t, 40));
        col.appendChild(this.dotsOf(t, s[i - 1] === '-'));
      } else { const o = el('span', '', d); o.textContent = t === '-' ? '−' : t; Object.assign(o.style, { font: '900 38px/1 system-ui, sans-serif', color: '#2B2118' }); }
    });
    return d;
  },
  async present(st) {
    const q = st.q, my = st, w = q.thing[1];
    st.rockEl = W2X.thing(st, 10, 10, 3, ''); st.rockEl.innerHTML = '<svg viewBox="0 0 400 240" width="100%" height="100%" preserveAspectRatio="none"><path d="M10 200Q20 70 120 50Q200 20 290 50Q390 80 390 200Q300 236 200 230Q90 236 10 200Z" fill="#A9B4C2" stroke="#2B2118" stroke-width="7" stroke-linejoin="round"/><path d="M60 110Q120 80 170 96M240 70Q300 80 330 120" fill="none" stroke="#8892A0" stroke-width="7" stroke-linecap="round"/></svg>';
    const total = q.kind === '-' ? q.a : q.a + q.b + (q.kind === 'two' ? 0 : 0);
    st.items = Array.from({ length: q.kind === '-' ? q.a : q.a + q.b }, (_, i) => { const e = K.item(Stage.el, 'assets/props/' + q.thing[0] + '.png', 76, 76); e.style.zIndex = 5; st.els.push(e); return { e, gone: q.kind !== '-' && i >= q.a }; });
    void total;
    this.place(st);
    st.items.filter(o => !o.gone).forEach((o, i) => K.pop(st, o.e, 60 * i));
    await st.scope.wait(T(700)); if (!Session.alive(my)) return;          /* not straight after the last reveal (R11-4) */
    K.say(st, '有' + CNQ(q.a) + w + q.thing[2]);
    await st.scope.wait(T(1400)); if (!Session.alive(my)) return;
    const come = async n => { const back = st.items.filter(o => o.gone).slice(0, n); back.forEach(o => { o.gone = false; }); this.place(st); back.forEach((o, i) => st.scope.anim(o.e, [{ transform: 'translateX(' + (Stage.W) + 'px)' }, { transform: 'translateX(0)' }], { duration: T(700) + 1, delay: T(120 * i), easing: EASE.glide, fill: 'backwards' })); Sfx.whoosh(0.3); K.say(st, '又来了' + CNQ(n) + w + '！'); await st.scope.wait(T(1500)); };
    const go = async n => { const leave = st.items.filter(o => !o.gone).slice(-n); await Promise.all(leave.map((o, i) => st.scope.anim(o.e, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + (Stage.W * 0.3) + 'px,-60px)', opacity: 1, offset: 0.5 }, { transform: 'translate(' + (Stage.W * 0.6) + 'px,120px)', opacity: 0 }], { duration: T(800) + 1, delay: T(120 * i), easing: EASE.glide, fill: 'forwards' }))); leave.forEach(o => { o.gone = true; o.e.getAnimations().forEach(a => a.cancel()); }); this.place(st); K.say(st, '走了' + CNQ(n) + w + '！'); await st.scope.wait(T(1300)); };
    if (q.kind === '+') await come(q.b);
    else if (q.kind === '-') { Sfx.splash ? Sfx.splash() : Sfx.whoosh(0.3); await go(q.b); }
    else { await come(q.b); if (!Session.alive(my)) return; await go(q.c); }
    if (!Session.alive(my)) return;
    const g = this.geo();
    st.cards = q.opts.map((o, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(this.eqNode(o.s)); return c; });
    st.opts = q.opts.map((_, i) => i);
    this.place(st);
    st.cards.forEach((c, i) => K.pop(st, c, 80 * i));
    K.task(st, [['assets/props/' + q.thing[0] + '.png'], [W3X.ic('<path d="M20 50H80M50 20V80" stroke="#2B2118" stroke-width="12" stroke-linecap="round"/>')], ['q']]);
    K.say(st, '哪个算式对？');
    void g;
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  async reveal(st) {
    const q = st.q, c = st.cards[q.answer], here = st.items.filter(o => !o.gone), my = st;
    K.ring(st, [box(c)], 6, '#FFC93C'); Sfx.reveal();
    for (let i = 0; i < here.length; i++) { if (!Session.alive(my)) return; K.hop(st, here[i].e, 12); await Count.beat(st.scope, 260, i + 1); }
    this.cheerAll(st);
    st.summary = q.kind === 'two' ? '等于' + CN[q.res] + '！' : CN[q.a] + (q.kind === '+' ? '加' : '减') + CN[q.b] + '等于' + CN[q.res] + '！';
    Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
  },
  async feedback(st, ans) {
    const q = st.q, o = q.opts[ans], w = q.thing[1]; if (st.cards[ans]) K.wiggle(st, st.cards[ans]);
    let line;
    if (o.why === 'op' || o.why === 'op2') line = q.kind === '-' ? '是走了，不是来了' : q.kind === 'two' ? (o.why === 'op' ? '先来了，后走了' : '后来是走了') : '是来了，不是走了';
    else if (o.why === 'a') line = '一开始有' + CNQ(q.a) + w;
    else if (o.why === 'b') line = (q.kind === '-' ? '走了' : '来了') + CNQ(q.b) + w;
    else if (o.why === 'c') line = '走了' + CNQ(q.c) + w;
    else line = '不是等于' + CN[o.s[4]];
    W3X.say(line); await st.scope.wait(600);
  },
  /* after a wrong answer: in his sentence, the part that does not fit the story (blue); the story counted again on the
     rock; the right sentence (gold) */
  async explain(st, ans) {
    const q = st.q, my = st, o = q.opts[ans], c = st.cards[ans], ok = q.opts[q.answer];
    if (o && c) { W3X.mine(st, c, 4); const toks = c.firstChild ? c.firstChild.children : []; o.s.forEach((t, i) => { if (t !== ok.s[i] && toks[i]) W3X.ringAt(st, W3X.srect(toks[i]), W3X.BLUE, 5); }); }
    await st.scope.wait(T(1000)); if (!Session.alive(my)) return;
    const here = st.items.filter(x => !x.gone);
    for (let i = 0; i < here.length; i++) { if (!Session.alive(my)) return; K.hop(st, here[i].e, 12); await Count.beat(st.scope, 200, i + 1); }
    W3X.gold(st, st.cards[q.answer], 4, 0); Sfx.reveal();
    W3X.tell(q.kind === 'two' ? '等于' + CN[q.res] + '！' : CN[q.a] + (q.kind === '+' ? '加' : '减') + CN[q.b] + '等于' + CN[q.res] + '！');
    await W3X.beat(st, 1700);
  },
  /* tests: the sentence that tells the story is the right one, and only that one */
  audit(q) { const tell = s => (q.kind === 'two' ? s.join() === [q.a, '+', q.b, '-', q.c].join() : s.slice(0, 3).join() === [q.a, q.kind, q.b].join() && (s.length === 3 || s[4] === q.res)); const good = q.opts.map((o, i) => (tell(o.s) ? i : -1)).filter(i => i >= 0); return { n: q.opts.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer && new Set(q.opts.map(o => o.s.join())).size === q.opts.length ? null : 'right ones ' + good }; },
  next(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.opts.length : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
  workEls(st) { return st.cards || []; },
  snap(st) { return { op: st.q.kind }; },
};

/* ================================================================ 汪汪队 R2 · 接 badge cards: same colour OR same picture follows */
const BADGE_IC = {
  bone: '<path d="M30 40A9 9 0 1 1 40 30L60 50A9 9 0 1 1 70 60A9 9 0 1 1 60 70L40 50A9 9 0 1 1 30 40Z" fill="#fff"/>',
  star: '<polygon points="50,24 57,42 76,42 61,54 66,72 50,62 34,72 39,54 24,42 43,42" fill="#fff"/>',
  drop: '<path d="M50 24C60 40 68 50 68 60A18 18 0 0 1 32 60C32 50 40 40 50 24Z" fill="#fff"/>',
  bolt: '<polygon points="56,22 34,54 48,54 42,78 68,44 54,44" fill="#fff"/>',
  leaf: '<path d="M30 72C30 44 46 30 72 28C72 54 58 72 30 72Z" fill="#fff"/>',
  heart: '<path d="M50 74C28 58 26 44 34 36C40 30 48 34 50 40C52 34 60 30 66 36C74 44 72 58 50 74Z" fill="#fff"/>',
  anchor: '<path d="M50 30V72M38 40H62M30 58Q34 74 50 74Q66 74 70 58" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="50" cy="28" r="6" fill="none" stroke="#fff" stroke-width="5"/>',
  moon: '<path d="M58 26A24 24 0 1 0 72 62A20 20 0 1 1 58 26Z" fill="#fff"/>',
};
const BADGE_COL = ['#E8414B', '#2E6FD8', '#3FA34D', '#E8A100', '#8E44C9', '#FF7A1A'];
const MBadges = {
  kind0: 'badges', verb: '接！', intro: '接上狗狗徽章！', praise: ['接得真对！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, ics = Object.keys(BADGE_IC);
    const rule = d === 1 ? 'color' : d === 2 ? 'icon' : 'or', n = 5;
    const top = { c: rng.int(0, 5), i: rng.pick(ics) }, prev = d === 5 ? { c: (top.c + rng.int(1, 5)) % 6, i: rng.pick(ics.filter(x => x !== top.i)) } : null;
    const share = rule === 'color' ? 'c' : rule === 'icon' ? 'i' : rng.pick(['c', 'i']);
    const ok = share === 'c' ? { c: top.c, i: rng.pick(ics.filter(x => x !== top.i)) } : { c: (top.c + rng.int(1, 5)) % 6, i: top.i };
    const hand = [ok]; let guard = 0;
    while (hand.length < n && guard++ < 200) {
      let x;
      if (prev && hand.length === 1) x = rng() < 0.5 ? { c: prev.c, i: rng.pick(ics.filter(y => y !== top.i)) } : { c: rng.pick([0, 1, 2, 3, 4, 5].filter(y => y !== top.c)), i: prev.i };
      else x = { c: rng.int(0, 5), i: rng.pick(ics) };
      if (x.c === top.c || x.i === top.i) continue;
      if (hand.some(h => h.c === x.c && h.i === x.i)) continue;
      hand.push(x);
    }
    const sh = W3X.deal(G, ok, hand.slice(1), 'bd');
    return { k: [d, top.c + top.i, sh.map(h => h.c + h.i).join()], rule, top, prev, hand: sh, share, answer: sh.indexOf(ok) };
  },
  audit(q) { const fits = h => (q.rule === 'color' ? h.c === q.top.c : q.rule === 'icon' ? h.i === q.top.i : h.c === q.top.c || h.i === q.top.i), good = q.hand.map((h, i) => (fits(h) ? i : -1)).filter(i => i >= 0); return { n: q.hand.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer ? null : 'fitting ' + good }; },
  badge(b, size) { const s = svg('svg', { viewBox: '0 0 100 120', width: size, height: typeof size === 'number' ? size * 1.2 : size }); s.innerHTML = '<path d="M50 6L90 20V60Q90 96 50 114Q10 96 10 60V20Z" fill="' + BADGE_COL[b.c] + '" stroke="#2B2118" stroke-width="6" stroke-linejoin="round"/><path d="M50 16L80 27V60Q80 88 50 102Q20 88 20 60V27Z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4"/><g transform="translate(0 8)" stroke="#2B2118" stroke-width="2">' + BADGE_IC[b.i] + '</g>'; s.style.pointerEvents = 'none'; return s; },
  geo(st) { return K.L() ? { px: 512, py: 248, pw: 150 } : { px: 352, py: 356, pw: 160 }; },
  /* the five badges in the hand: one row right of Ryder (landscape), 3 + 2 (portrait) */
  handFr(L) { return (L == null ? K.L() : L) ? { x: 170, y: 440, w: 840, h: 230 } : { x: 16, y: 590, w: 672, h: 410 }; },
  handW(n) { return W3X.size2(n, [this.handFr(true), this.handFr(false)], 150, 20, 1.2); },
  decor(G) { W3X.decor2(G, this.chars, true); },
  place(st) {
    const g = this.geo(st);
    if (st.prevEl) place(st.prevEl, g.px - g.pw / 2 - 34, g.py - g.pw * 0.6 - 14, g.pw, g.pw * 1.2);
    place(st.topEl, g.px - g.pw / 2, g.py - g.pw * 0.6, g.pw, g.pw * 1.2);
    const w = this.handW(st.handEls.length), P = W3X.grid(st.handEls.length, this.handFr(), w, 20, 1.2);
    st.handEls.forEach((e, i) => { if (!e._played) place(e, P.pos[i].x + (P.w - w) / 2, P.pos[i].y + (P.h - w * 1.2) / 2, w, w * 1.2); });
  },
  async present(st) {
    const q = st.q;
    if (q.prev) { st.prevEl = W2X.thing(st, 10, 10, 3, ''); st.prevEl.appendChild(this.badge(q.prev, '100%')); st.prevEl.style.transform = 'rotate(-10deg)'; }
    st.topEl = W2X.thing(st, 10, 10, 4, ''); st.topEl.appendChild(this.badge(q.top, '100%'));
    st.handEls = q.hand.map((b, i) => { const e = W3X.card(st, 'card' + i, 6, ''); e.appendChild(this.badge(b, '100%')); return e; });
    st.cards = st.handEls; st.opts = q.hand.map((_, i) => i);
    this.place(st);
    K.pop(st, st.topEl); st.handEls.forEach((e, i) => K.pop(st, e, 200 + 80 * i));
    const sw = c => '<rect x="10" y="30" width="34" height="40" rx="6" fill="' + c + '" stroke="#2B2118" stroke-width="4"/>';
    K.task(st, [[W3X.ic(q.rule === 'icon' ? '<g transform="translate(-14 0) scale(.62) translate(16 20)">' + BADGE_IC.star.replace('#fff', '#2B2118') + '</g><g transform="translate(36 0) scale(.62) translate(16 20)">' + BADGE_IC.star.replace('#fff', '#2B2118') + '</g>' : sw(BADGE_COL[0]) + sw(BADGE_COL[0]).replace('x="10"', 'x="56"'))], ['q']]);
    K.say(st, q.rule === 'color' ? '颜色一样的能接！' : q.rule === 'icon' ? '图案一样的能接！' : '颜色或图案一样！');
  },
  onGesture(st, name, p) {
    const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || st.picked) return false;
    st.picked = true; const e = st.handEls[i], t = box(st.topEl); e._played = true; K.flyTo(st, e, t.x + 16, t.y + 10, 360, 50); Sfx.place();
    Session.submit(st, i); return 'ok';
  },
  async reveal(st) {
    const q = st.q; K.ring(st, [box(st.topEl)], 10, '#FFC93C'); Sfx.reveal(); this.cheerAll(st);
    st.summary = q.share === 'c' ? '颜色一样！' : '图案一样！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
  },
  async feedback(st, ans) { const q = st.q; if (st.handEls[ans]) K.wiggle(st, st.handEls[ans]); W3X.say(q.rule === 'color' ? '颜色不一样' : q.rule === 'icon' ? '图案不一样' : '颜色图案都不同'); await st.scope.wait(600); },
  /* after a wrong answer: his badge goes back to the hand (blue: it shares nothing with the top one); the right badge goes
     on top (gold) - the same colour or the same picture */
  async explain(st, ans) {
    const q = st.q, my = st, e = st.handEls[ans];
    if (e) { e._played = false; e.getAnimations().forEach(a => a.cancel()); e.style.transform = ''; this.place(st); W3X.mine(st, e, 4); }
    await st.scope.wait(T(1100)); if (!Session.alive(my)) return;
    const r = st.handEls[q.answer], t = box(st.topEl); r._played = true; r.style.zIndex = 8;
    await K.flyTo(st, r, t.x + 16, t.y + 10, 520, 50); if (!Session.alive(my)) return;
    W3X.gold(st, st.topEl, 12, 0); Sfx.reveal(); W3X.tell(q.share === 'c' ? '颜色一样！' : '图案一样！');
    await W3X.beat(st, 1600);
  },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.hand.length : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
  workEls(st) { return st.handEls || []; },
  snap(st) { return { rule: st.q.rule }; },
};

/* ================================================================ 汪汪队 R3 · 圈 inside the fence or outside (a closed line has an inside) */
const MFence = {
  kind0: 'fence', verb: '找！', intro: '小羊回家啦！', praise: ['里外分得清！'],
  /* the field: corridors (centre polylines, width cw) in a 0..100 x 0..100 box */
  shapes: {
    blob: { cw: 44, p: [[30, 40], [70, 40]], extra: [[50, 28], [50, 62]] },
    U: { cw: 26, p: [[18, 14], [18, 82], [82, 82], [82, 14]] },
    C: { cw: 26, p: [[84, 16], [16, 16], [16, 84], [84, 84]] },
    S: { cw: 22, p: [[12, 13], [88, 13], [88, 50], [12, 50], [12, 87], [88, 87]] },
    G: { cw: 20, p: [[86, 12], [12, 12], [12, 88], [88, 88], [88, 50], [48, 50]] },
    W: { cw: 20, p: [[12, 86], [12, 12], [38, 12], [38, 70], [62, 70], [62, 12], [88, 12], [88, 86]] },
  },
  rects(sh) { const S = this.shapes[sh], h = S.cw / 2, out = []; const segs = []; for (let i = 0; i + 1 < S.p.length; i++) segs.push([S.p[i], S.p[i + 1]]); if (S.extra) segs.push([S.extra[0], S.extra[1]]); segs.forEach(([a, b]) => out.push({ x: Math.min(a[0], b[0]) - h, y: Math.min(a[1], b[1]) - h, w: Math.abs(a[0] - b[0]) + 2 * h, h: Math.abs(a[1] - b[1]) + 2 * h })); return out; },
  inside(R, p, m) { return R.some(r => p[0] >= r.x + m && p[0] <= r.x + r.w - m && p[1] >= r.y + m && p[1] <= r.y + r.h - m); },
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const sh = d === 1 ? 'blob' : d === 2 ? rng.pick(['U', 'C']) : d === 3 ? rng.pick(['S', 'G']) : rng.pick(['S', 'G', 'W']);
    const ask = d >= 4 ? bagPick(G, 'fa' + d, ['in', 'out']) : 'in', n = 5;
    const fx = rng() < 0.5, fy = rng() < 0.5;
    const R = this.rects(sh).map(r => ({ x: fx ? 100 - r.x - r.w : r.x, y: fy ? 100 - r.y - r.h : r.y, w: r.w, h: r.h }));
    const isIn = p => this.inside(R, p, 7), isOut = p => !this.inside(R, p, -7);
    for (let t = 0; t < 600; t++) {
      const pts = [];
      const want = ask === 'in' ? 1 : n - 1;
      for (let k = 0; k < 4000 && pts.length < n; k++) {
        const p = [Math.round(6 + rng() * 88), Math.round(6 + rng() * 88)], inn = isIn(p), out = isOut(p);
        if (!inn && !out) continue;
        const nIn = pts.filter(x => x.inn).length;
        if (inn && nIn >= want) continue; if (out && pts.length - nIn >= n - want) continue;
        if (pts.some(x => Math.hypot(x.p[0] - p[0], x.p[1] - p[1]) < 19)) continue;
        if (d >= 2 && out && pts.filter(x => !x.inn).length === 0 && !this.surrounded(R, p)) continue;     /* the first one outside sits in a bay */
        pts.push({ p: p.map(v => Math.round(v)), inn });
      }
      if (pts.length < n) continue;
      const one = pts.find(x => (ask === 'in' ? x.inn : !x.inn)), list = W3X.deal(G, one, pts.filter(x => x !== one), 'fe'), ans = list.indexOf(one);
      return { k: [d, sh, fx, fy, list.map(x => x.p.join(',')).join('|')], sh, R, ask, list, answer: ans };
    }
    return this.gen(G, Object.assign({}, o, { level: 1 }));
  },
  surrounded(R, p) { let hits = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { for (let s = 3; s < 100; s += 2) { const q = [p[0] + dx * s, p[1] + dy * s]; if (q[0] < 0 || q[0] > 100 || q[1] < 0 || q[1] > 100) break; if (this.inside(R, q, -1)) { hits++; break; } } }); return hits >= 3; },
  geo() { return K.L() ? { x: 230, y: 120, w: 560, h: 520 } : { x: 52, y: 240, w: 600, h: 600 }; },
  decor(G) { const L = K.L(); W2X.hideAll(G, this.chars); const a = G.actors[this.chars[0]]; if (a) showActor(a, L ? 110 : 640, L ? 698 : 1016, L ? 180 : 120); },
  place(st) {
    const g = this.geo(); place(st.field, g.x, g.y, g.w, g.h);
    st.sheep.forEach((o, i) => { const p = st.q.list[i].p; place(o, g.x + p[0] / 100 * g.w - 46, g.y + p[1] / 100 * g.h - 46, 92, 92); });
  },
  fieldSvg(st, fill) {
    const q = st.q, id = 'fm' + (MFence.uid = (MFence.uid || 0) + 1), s = svg('svg', { viewBox: '0 0 100 100', width: '100%', height: '100%', preserveAspectRatio: 'none' });
    const defs = svg('defs', {}, s), m = svg('mask', { id, maskUnits: 'userSpaceOnUse', x: -10, y: -10, width: 120, height: 120 }, defs);
    svg('rect', { x: -10, y: -10, width: 120, height: 120, fill: '#fff' }, m);
    q.R.forEach(r => svg('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 2, fill: '#000' }, m));
    if (fill) { st.fillG = svg('g', { opacity: 0 }, s); q.R.forEach(r => svg('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 2, fill: '#BDF07A' }, st.fillG)); }
    const g = svg('g', { mask: 'url(#' + id + ')' }, s);
    q.R.forEach(r => svg('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 2, fill: 'none', stroke: '#7A4A1C', 'stroke-width': 18, 'vector-effect': 'non-scaling-stroke' }, g));
    const g2 = svg('g', { mask: 'url(#' + id + ')' }, s);
    q.R.forEach(r => svg('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 2, fill: 'none', stroke: '#D9A066', 'stroke-width': 6, 'stroke-dasharray': '10 12', 'vector-effect': 'non-scaling-stroke' }, g2));
    s.style.pointerEvents = 'none';
    return s;
  },
  async present(st) {
    const q = st.q;
    st.field = W2X.thing(st, 10, 10, 3, ''); st.field.appendChild(this.fieldSvg(st, true));
    st.sheep = q.list.map((x, i) => { const e = W3X.card(st, 'sh' + i, 5, ''); const im = img('assets/props/sheep.png', '', e); Object.assign(im.style, { width: '84%', height: '84%', objectFit: 'contain', pointerEvents: 'none' }); return e; });
    this.place(st);
    K.pop(st, st.field); st.sheep.forEach((e, i) => K.pop(st, e, 200 + 90 * i));
    K.task(st, [[W3X.ic('<rect x="14" y="14" width="72" height="72" rx="10" fill="none" stroke="#7A4A1C" stroke-width="9"/><circle cx="50" cy="50" r="14" fill="#fff" stroke="#2B2118" stroke-width="4"/>')], ['q']]);
    K.say(st, q.ask === 'in' ? '哪只在羊圈里？' : '哪只在外面？');
  },
  onGesture(st, name, p) { const id = p.id || ''; if (name !== 'tap' || !/^sh\d$/.test(id) || st.picked) return false; st.picked = true; Session.submit(st, Number(id.slice(2))); return 'ok'; },
  async reveal(st) {
    if (st.fillG) st.scope.anim(st.fillG, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 700, fill: 'forwards' });
    const e = st.sheep[st.q.answer]; K.ring(st, [box(e)], 4, '#FFC93C'); K.hop(st, e, 16);
    Sfx.reveal(); this.cheerAll(st); st.summary = st.q.ask === 'in' ? '在羊圈里面！' : '在羊圈外面！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1400);
  },
  async feedback(st, ans) { if (st.sheep[ans]) K.wiggle(st, st.sheep[ans]); W3X.say(st.q.list[ans].inn ? '这只在里面哦' : '这只在外面哦'); await st.scope.wait(600); },
  /* after a wrong answer: the inside of the fence fills with grass, his sheep (blue) is on the other side; the right one
     (gold) */
  async explain(st, ans) {
    const my = st; if (st.fillG) st.scope.anim(st.fillG, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 700, fill: 'forwards' });
    if (st.sheep[ans]) W3X.mine(st, st.sheep[ans], 2);
    await st.scope.wait(T(1300)); if (!Session.alive(my)) return;
    W3X.gold(st, st.sheep[st.q.answer], 2); Sfx.reveal(); W3X.tell(st.q.ask === 'in' ? '在羊圈里面！' : '在羊圈外面！');
    await W3X.beat(st, 1600);
  },
  audit(q) { const inn = p => this.inside(q.R, p, 7), out = p => !this.inside(q.R, p, -7), good = q.list.map((x, i) => ((q.ask === 'in' ? inn(x.p) : out(x.p)) ? i : -1)).filter(i => i >= 0), clear = q.list.every(x => inn(x.p) || out(x.p)); return { n: q.list.length, pos: q.answer, err: clear && good.length === 1 && good[0] === q.answer ? null : 'right ones ' + good }; },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.list.length : st.q.answer; return { g: 'tap', p: { id: 'sh' + i } }; },
  workEls(st) { return st.sheep || []; },
  gestureHint(st) { if (st.field) K.flash(st, [st.field]); },     /* follow the fence */
  snap(st) { return { sh: st.q.sh }; },
};

/* ================================================================ 汪汪队 R4 · 管 the water pipes: which flower gets water (reasoning) */
const MPipes = {
  kind0: 'pipes', verb: '浇！', intro: '水会流到哪里？', praise: ['水路想通啦！'],
  /* five flowers at every level (client: five options); the pipes get deeper with the level, the top level has a cross
     pipe (water can come round) */
  layouts: {
    3: { n: { s: [50, 6], j: [50, 24], a: [24, 48], b: [76, 48], p0: [10, 90], p1: [30, 90], p2: [50, 90], p3: [70, 90], p4: [90, 90] }, e: [['s', 'j', 0], ['j', 'a', 1], ['j', 'b', 1], ['a', 'p0', 1], ['a', 'p1', 1], ['b', 'p2', 1], ['b', 'p3', 1], ['b', 'p4', 1]] },
    4: { n: { s: [50, 6], j: [50, 20], a: [26, 40], b: [74, 40], c: [36, 62], p0: [10, 90], p1: [30, 90], p2: [50, 90], p3: [70, 90], p4: [90, 90] }, e: [['s', 'j', 0], ['j', 'a', 1], ['j', 'b', 1], ['a', 'p0', 1], ['a', 'c', 1], ['c', 'p1', 1], ['c', 'p2', 1], ['b', 'p3', 1], ['b', 'p4', 1]] },
    5: { n: { s: [50, 6], j: [50, 20], a: [26, 40], b: [74, 40], c: [30, 64], m: [50, 64], e: [70, 64], p0: [10, 90], p1: [30, 90], p2: [50, 90], p3: [70, 90], p4: [90, 90] }, e: [['s', 'j', 0], ['j', 'a', 1], ['j', 'b', 1], ['a', 'p0', 1], ['a', 'c', 1], ['c', 'p1', 1], ['c', 'm', 1], ['m', 'p2', 1], ['m', 'e', 1], ['b', 'e', 1], ['e', 'p3', 1], ['b', 'p4', 1]] },
  },
  reach(Lay, open) { const adj = {}; Lay.e.forEach(([a, b], i) => { if (!open[i]) return; (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); }); const seen = { s: 1 }, q = ['s'], order = []; while (q.length) { const x = q.shift(); order.push(x); (adj[x] || []).forEach(y => { if (!seen[y]) { seen[y] = 1; q.push(y); } }); } return { seen, order }; },
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, L = d <= 2 ? 3 : d === 3 ? 4 : 5, Lay = this.layouts[L];
    const pots = Object.keys(Lay.n).filter(k => k[0] === 'p');
    const want = bagPick(G, 'pi', pots.slice());                      /* the flower that gets water: each place as often */
    let keep = null;
    for (let t = 0; t < 1500; t++) {
      const open = Lay.e.map(e => !e[2] || rng() < 0.5);
      const closed = open.filter(x => !x).length; if (closed < (d === 1 ? 1 : d <= 3 ? 2 : 3)) continue;
      const { seen } = this.reach(Lay, open), wet = pots.filter(p => seen[p]);
      if (wet.length !== 1) continue;
      if (d >= 4) { const cross = Lay.e.findIndex(e => e[0] === 'c' && e[1] === 'm'), cross2 = Lay.e.findIndex(e => e[0] === 'm' && e[1] === 'e'); if (!open[cross] && !open[cross2] && rng() < 0.6) continue; }
      keep = { k: [d, open.map(x => (x ? 1 : 0)).join('')], L, open, pots, answer: wet[0] };
      if (wet[0] === want) break;
    }
    return keep || { k: [d, 'x'], L: 3, open: [true, true, false, true, false, false, false, false], pots, answer: 'p0' };
  },
  audit(q) { const { seen } = this.reach(this.layouts[q.L], q.open), wet = q.pots.filter(p => seen[p]); return { n: q.pots.length, pos: q.pots.indexOf(q.answer), err: wet.length === 1 && wet[0] === q.answer ? null : 'wet ' + wet }; },
  geo() { return K.L() ? { x: 212, y: 104, w: 600, h: 520 } : { x: 62, y: 230, w: 580, h: 640 }; },
  decor(G) { const L = K.L(); W2X.hideAll(G, this.chars); const a = G.actors[this.chars[0]]; if (a) showActor(a, L ? 120 : 600, L ? 698 : 1016, L ? 180 : 120); },
  xy(k) { const g = this.geo(), p = this.layouts[this.cur].n[k]; return [g.x + p[0] / 100 * g.w, g.y + p[1] / 100 * g.h]; },
  place(st) {
    this.cur = st.q.L; const g = this.geo();
    place(st.pipe, g.x, g.y, g.w, g.h);
    st.potEls.forEach(o => { const p = this.xy(o.k); place(o.e, p[0] - 48, p[1] - 70, 96, 110); });
    const t = this.xy('s'); place(st.tank, t[0] - 60, t[1] - 48, 120, 76);
  },
  draw(st) {
    const q = st.q, Lay = this.layouts[q.L], k = W2X.ink, s = svg('svg', { viewBox: '0 0 100 100', width: '100%', height: '100%', preserveAspectRatio: 'none' });
    const P = n => Lay.n[n];
    const path = (a, b) => { const A = P(a), B = P(b); return A[0] === B[0] || A[1] === B[1] ? 'M' + A[0] + ' ' + A[1] + 'L' + B[0] + ' ' + B[1] : 'M' + A[0] + ' ' + A[1] + 'H' + B[0] + 'V' + B[1]; };
    Lay.e.forEach(([a, b]) => svg('path', { d: path(a, b), fill: 'none', stroke: k, 'stroke-width': 5.4, 'stroke-linejoin': 'round', 'vector-effect': 'none' }, s));
    Lay.e.forEach(([a, b]) => svg('path', { d: path(a, b), fill: 'none', stroke: '#C9D4E0', 'stroke-width': 3.4, 'stroke-linejoin': 'round' }, s));
    st.water = Lay.e.map(([a, b]) => svg('path', { d: path(a, b), fill: 'none', stroke: '#3D9BFF', 'stroke-width': 2.4, 'stroke-linejoin': 'round', opacity: 0 }, s));
    st.valves = []; st.valveAt = {};
    Lay.e.forEach(([a, b, v], i) => {
      if (!v) return;
      const A = P(a), B = P(b), horiz = !(A[0] === B[0] || A[1] === B[1]) ? false : A[1] === B[1];
      const toPot = b[0] === 'p', mx = A[0] === B[0] || A[1] === B[1] ? (A[0] + B[0]) / 2 : B[0], my = toPot ? A[1] + (B[1] - A[1]) * (A[0] === B[0] ? 0.3 : 0.45) : A[0] === B[0] || A[1] === B[1] ? (A[1] + B[1]) / 2 : (A[1] + B[1]) / 2 + (B[1] - A[1]) * 0.1;     /* a valve before a flower stays clear of its pot */
      st.valveAt[i] = [mx, my];
      const ox = q.open[i], g = svg('g', {}, s);
      svg('ellipse', { cx: mx, cy: my, rx: 4.2, ry: 4.2 * (K.L() ? 600 / 520 : 580 / 640), fill: ox ? '#5CC46E' : '#E8414B', stroke: k, 'stroke-width': 1.2 }, g);
      const vert = A[0] === B[0] || (!horiz && !(A[1] === B[1]));
      svg('path', { d: ox ? (vert ? 'M' + mx + ' ' + (my - 3) + 'V' + (my + 3) : 'M' + (mx - 3) + ' ' + my + 'H' + (mx + 3)) : (vert ? 'M' + (mx - 3) + ' ' + my + 'H' + (mx + 3) : 'M' + mx + ' ' + (my - 3) + 'V' + (my + 3)), stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
      st.valves.push(g);
    });
    s.style.pointerEvents = 'none';
    return s;
  },
  async present(st) {
    const q = st.q; this.cur = q.L;
    st.pipe = W2X.thing(st, 10, 10, 3, ''); st.pipe.appendChild(this.draw(st));
    st.tank = W2X.thing(st, 120, 76, 4, ''); st.tank.innerHTML = '<svg viewBox="0 0 120 76" width="100%" height="100%"><rect x="6" y="6" width="108" height="56" rx="18" fill="#E8414B" stroke="#2B2118" stroke-width="6"/><path d="M22 34H98" stroke="#FFC93C" stroke-width="8"/><path d="M60 62V74" stroke="#2B2118" stroke-width="10"/></svg>';
    st.potEls = q.pots.map(k => { const e = W3X.card(st, k, 5, ''); const im = img('assets/props/flowerpot.png', '', e); Object.assign(im.style, { width: '86%', height: '86%', objectFit: 'contain', pointerEvents: 'none', filter: 'saturate(.55)' }); return { k, e, im }; });
    this.place(st);
    K.pop(st, st.pipe); st.potEls.forEach((o, i) => K.pop(st, o.e, 200 + 80 * i));
    K.task(st, [[W3X.ic('<circle cx="24" cy="50" r="18" fill="#5CC46E" stroke="#2B2118" stroke-width="4"/><path d="M24 38V62" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M44 50H56" stroke="#2B2118" stroke-width="5"/><path d="M74 34C80 44 86 50 86 58A12 12 0 0 1 62 58C62 50 68 44 74 34Z" fill="#3D9BFF" stroke="#2B2118" stroke-width="4"/>')], [W3X.ic('<circle cx="24" cy="50" r="18" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><path d="M12 50H36" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M60 36L88 64M88 36L60 64" stroke="#E8414B" stroke-width="9" stroke-linecap="round"/>')], ['q']]);
    K.say(st, '哪朵花能浇到水？');
  },
  onGesture(st, name, p) { const id = p.id || ''; if (name !== 'tap' || !/^p\d$/.test(id) || st.picked) return false; st.picked = true; Session.submit(st, id); return 'ok'; },
  async reveal(st) {
    const q = st.q, Lay = this.layouts[q.L], { seen } = this.reach(Lay, q.open), my = st;
    for (let i = 0; i < Lay.e.length; i++) { if (!Session.alive(my)) return; const [a, b] = Lay.e[i]; if (q.open[i] && seen[a] && seen[b]) { st.water[i].setAttribute('opacity', 1); await st.scope.wait(140); } }
    const o = st.potEls.find(x => x.k === q.answer); o.im.style.filter = ''; K.hop(st, o.e, 20); K.ring(st, [box(o.e)], 4, '#FFC93C');
    Sfx.reveal(); this.cheerAll(st); st.summary = '水流到这里啦！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  async feedback(st, ans) { const o = st.potEls.find(x => x.k === ans); if (o) K.wiggle(st, o.e); W3X.say('水过不去哦'); await st.scope.wait(500); },
  /* after a wrong answer: the water runs as far as it can; the closed valves that stop it on the way to his flower get
     blue rings (and his flower); the flower the water reaches (gold) */
  async explain(st, ans) {
    const q = st.q, Lay = this.layouts[q.L], my = st, { seen } = this.reach(Lay, q.open), g = this.geo();
    for (let i = 0; i < Lay.e.length; i++) { if (!Session.alive(my)) return; const [a, b] = Lay.e[i]; if (q.open[i] && seen[a] && seen[b]) { st.water[i].setAttribute('opacity', 1); await st.scope.wait(T(110)); } }
    /* his flower's dry part of the pipes, and the closed valves between it and the water */
    const dry = { [ans]: 1 }, todo = [ans];
    while (todo.length) { const x = todo.shift(); Lay.e.forEach(([a, b]) => { const y = a === x ? b : b === x ? a : null; if (y && !seen[y] && !dry[y]) { dry[y] = 1; todo.push(y); } }); }
    const stop = Lay.e.map(([a, b, v], i) => (v && !q.open[i] && ((seen[a] && dry[b]) || (seen[b] && dry[a])) ? i : -1)).filter(i => i >= 0);
    const o = st.potEls.find(x => x.k === ans); if (o) W3X.mine(st, o.e, 2);
    stop.forEach(i => { const v = st.valveAt[i]; if (v) W3X.ringAt(st, { x: g.x + v[0] / 100 * g.w - 20, y: g.y + v[1] / 100 * g.h - 20, w: 40, h: 40 }, W3X.BLUE, 6); });
    if (stop.length) W3X.tell('这里关着呢。');
    await st.scope.wait(T(1600)); if (!Session.alive(my)) return;
    const r = st.potEls.find(x => x.k === q.answer); r.im.style.filter = ''; W3X.gold(st, r.e, 2, 20);
    Sfx.reveal(); W3X.tell('水流到这里啦！');
    await W3X.beat(st, 1600);
  },
  next(st, strat) { if (st.picked) return null; const k = strat === 'wrong' ? st.q.pots.find(x => x !== st.q.answer) : st.q.answer; return { g: 'tap', p: { id: k } }; },
  workEls(st) { return (st.potEls || []).map(o => o.e); },
  gestureHint(st) { if (st.valves) K.flash(st, [st.pipe]); },
  snap(st) { return { L: st.q.L }; },
};

/* ================================================================ 葫芦娃 L1 · 涂 colour the fields: touching fields never the same colour */
const MAP_COL = [['#E8414B', '红'], ['#FFC93C', '黄'], ['#4F7BFF', '蓝'], ['#5CC46E', '绿']];
const MColorMap = {
  kind0: 'colormap', verb: '涂！', intro: '给山地涂颜色！', praise: ['颜色涂得真聪明！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const [C, R, k, nc, nb] = [null, [3, 3, 4, 3, 1], [4, 3, 5, 3, 2], [4, 4, 6, 3, 3], [5, 4, 7, 4, 3], [5, 4, 8, 4, 4]][d];
    for (let t = 0; t < 400; t++) {
      /* regions grow from k seeds over the grid */
      const reg = Array(C * R).fill(-1), seeds = rng.shuffle(reg.map((_, i) => i)).slice(0, k);
      seeds.forEach((s, i) => { reg[s] = i; });
      const nb4 = i => { const x = i % C, y = Math.floor(i / C), out = []; if (x > 0) out.push(i - 1); if (x < C - 1) out.push(i + 1); if (y > 0) out.push(i - C); if (y < R - 1) out.push(i + C); return out; };
      for (let g = 0; g < 400 && reg.includes(-1); g++) { const i = rng.int(0, C * R - 1); if (reg[i] !== -1) continue; const n = nb4(i).filter(j => reg[j] !== -1); if (n.length) reg[i] = reg[rng.pick(n)]; }
      if (reg.includes(-1)) continue;
      const adj = Array.from({ length: k }, () => new Set());
      reg.forEach((r, i) => nb4(i).forEach(j => { if (reg[j] !== r) { adj[r].add(reg[j]); adj[reg[j]].add(r); } }));
      /* one proper colouring */
      const col = Array(k).fill(-1), order = rng.shuffle(Array.from({ length: k }, (_, i) => i));
      const solve = idx => { if (idx === k) return true; const r = order[idx]; for (const c of rng.shuffle(Array.from({ length: nc }, (_, i) => i))) { if ([...adj[r]].some(x => col[x] === c)) continue; col[r] = c; if (solve(idx + 1)) return true; col[r] = -1; } return false; };
      if (!solve(0)) continue;
      /* the blanks: their colours must follow from the others (exactly one way) and each touches two others or more */
      const blanks = rng.shuffle(Array.from({ length: k }, (_, i) => i)).slice(0, nb).sort((a, b) => a - b);
      if (blanks.some(b => adj[b].size < 2)) continue;
      let ways = 0;
      const fill = Object.assign([], col); blanks.forEach(b => { fill[b] = -1; });
      const count = idx => { if (ways > 1) return; if (idx === blanks.length) { ways++; return; } const r = blanks[idx]; for (let c = 0; c < nc; c++) { if ([...adj[r]].some(x => fill[x] === c)) continue; fill[r] = c; count(idx + 1); fill[r] = -1; } };
      count(0);
      if (ways !== 1) continue;
      return { k: [d, reg.join(''), col.join('')], C, R, nreg: k, nc, reg, col, adj: adj.map(s => [...s]), blanks, answer: blanks.map(b => col[b]).join('') };
    }
    return this.gen(G, Object.assign({}, o, { level: Math.max(1, d - 1) }));
  },
  geo(st) { const L = K.L(), q = st.q, cs = L ? Math.min(118, 460 / q.R, 520 / q.C) : Math.min(116, 580 / q.C); return L ? { cs, x0: 470 - q.C * cs / 2, y0: 380 - q.R * cs / 2 } : { cs, x0: 352 - q.C * cs / 2, y0: 540 - q.R * cs / 2 }; },
  decor(G) { W3X.decor2(G, this.chars, true); },
  place(st) {
    const g = this.geo(st), q = st.q;
    st.cells.forEach((e, i) => place(e, g.x0 + (i % q.C) * g.cs, g.y0 + Math.floor(i / q.C) * g.cs, g.cs, g.cs));
    place(st.lines, g.x0 - 6, g.y0 - 6, q.C * g.cs + 12, q.R * g.cs + 12);
    if (st.doneBtn) K.placeDone(st.doneBtn);
  },
  borders(st) {
    const q = st.q, s = svg('svg', { viewBox: (-0.05) + ' ' + (-0.05) + ' ' + (q.C + 0.1) + ' ' + (q.R + 0.1), width: '100%', height: '100%' }), k = W2X.ink;
    let d = '';
    for (let y = 0; y < q.R; y++) for (let x = 0; x < q.C; x++) {
      const r = q.reg[y * q.C + x];
      if (x === q.C - 1 || q.reg[y * q.C + x + 1] !== r) d += 'M' + (x + 1) + ' ' + y + 'V' + (y + 1);
      if (y === q.R - 1 || q.reg[(y + 1) * q.C + x] !== r) d += 'M' + x + ' ' + (y + 1) + 'H' + (x + 1);
      if (x === 0) d += 'M0 ' + y + 'V' + (y + 1);
      if (y === 0) d += 'M' + x + ' 0H' + (x + 1);
    }
    svg('path', { d, stroke: k, 'stroke-width': 0.07, 'stroke-linecap': 'round', fill: 'none' }, s);
    s.style.pointerEvents = 'none';
    return s;
  },
  paint(st) {
    const q = st.q;
    st.cells.forEach((e, i) => { const r = q.reg[i], blank = q.blanks.includes(r), c = blank ? st.state[q.blanks.indexOf(r)] : q.col[r]; e.style.background = c >= 0 ? MAP_COL[c][0] : 'repeating-linear-gradient(45deg,#FFF8EC 0 10px,#EDE3D2 10px 20px)'; e.style.filter = blank || c < 0 ? '' : 'saturate(.85)'; });
  },
  async present(st) {
    const q = st.q;
    st.state = q.blanks.map(() => -1);
    st.cells = q.reg.map((r, i) => { const e = W2X.thing(st, 10, 10, 3, ''); if (q.blanks.includes(r)) K.reg(st, 'r' + r, e, {}); return e; });
    st.lines = W2X.thing(st, 10, 10, 4, ''); st.lines.appendChild(this.borders(st));
    st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {});
    this.paint(st); this.place(st);
    st.cells.concat([st.lines]).forEach(e => st.scope.anim(e, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: EASE.pop, fill: 'backwards' }));   /* one piece (R10-3) */
    K.task(st, [[W3X.ic('<rect x="6" y="28" width="28" height="44" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><rect x="34" y="28" width="28" height="44" fill="#FFC93C" stroke="#2B2118" stroke-width="4"/><path d="M68 52L76 62L94 38" fill="none" stroke="#5CC46E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>')], [W3X.ic('<rect x="6" y="28" width="28" height="44" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><rect x="34" y="28" width="28" height="44" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><path d="M70 36L92 64M92 36L70 64" stroke="#E8414B" stroke-width="8" stroke-linecap="round"/>')]]);
    W3X.say2(st, '点空地，涂颜色！', '挨着的不能同色！');
  },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || st.picked) return false;
    if (id === 'done') { st.picked = true; Session.submit(st, st.state.join('')); return 'ok'; }
    const m = /^r(\d+)$/.exec(id); if (!m) return false;
    const i = st.q.blanks.indexOf(Number(m[1])); if (i < 0) return false;
    st.state[i] = (st.state[i] + 1) % st.q.nc; this.paint(st); Sfx.place(); return 'ok';
  },
  evaluate(st, ans) { return ans === st.q.answer; },
  conflict(st, ans) {
    const q = st.q, v = String(ans).split('').map(Number), col = q.col.slice(); q.blanks.forEach((b, i) => { col[b] = v[i]; });
    for (const b of q.blanks) { const c = col[b]; if (c < 0) return { empty: b }; const x = q.adj[b].find(y => col[y] === c); if (x != null) return { a: b, b: x }; }
    return null;
  },
  async reveal(st) {
    st.cells.forEach((e, i) => { if (st.q.blanks.includes(st.q.reg[i])) K.hop(st, e, 8); });
    Sfx.reveal(); this.cheerAll(st); st.summary = '挨着的都不一样！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  async feedback(st, ans) {
    const cells = r => st.cells.filter((_, i) => st.q.reg[i] === r);
    const c = String(ans).includes('-') ? null : this.conflict(st, ans);
    if (String(ans).includes('-')) { W3X.say('还有空白的'); }
    else if (c && c.a != null) { K.flash(st, cells(c.a).concat(cells(c.b))); W3X.say('挨着的不能同色'); }
    else W3X.say('挨着的不能同色');
    await st.scope.wait(700);
  },
  /* not a choice (the child colours); after a wrong answer: the fields that break the rule (blue: a blank left, or two
     touching fields of one colour), then the blanks get the colours that work (gold) */
  async explain(st, ans) {
    const q = st.q, my = st, cells = r => st.cells.filter((_, i) => q.reg[i] === r).map(e => box(e)), colOf = r => (q.blanks.includes(r) ? st.state[q.blanks.indexOf(r)] : q.col[r]), bad = new Set();
    q.blanks.forEach(b => { const c = colOf(b); if (c < 0) bad.add(b); else q.adj[b].forEach(y => { if (colOf(y) === c) { bad.add(b); bad.add(y); } }); });
    bad.forEach(r => K.ring(st, cells(r), 4, W3X.BLUE));
    await st.scope.wait(T(1500)); if (!Session.alive(my)) return;
    st.els.filter(e => e.classList && e.classList.contains('ringo')).forEach(e => e.remove());
    for (const b of q.blanks) { if (!Session.alive(my)) return; st.state[q.blanks.indexOf(b)] = q.col[b]; this.paint(st); st.cells.forEach((e, i) => { if (q.reg[i] === b) K.hop(st, e, 8); }); K.ring(st, cells(b), 4, W3X.GOLD); Sfx.place(); await st.scope.wait(T(380)); }
    Sfx.reveal(); W3X.tell('挨着的都不一样！');
    await W3X.beat(st, 1600);
  },
  audit() { return { none: 'the child colours the fields' }; },
  next(st, strat) {
    if (st.picked) return null;
    if (strat === 'wrong') return { g: 'tap', p: { id: 'done' } };
    const i = st.state.findIndex((v, k) => v !== st.q.col[st.q.blanks[k]]);
    return i >= 0 ? { g: 'tap', p: { id: 'r' + st.q.blanks[i] } } : { g: 'tap', p: { id: 'done' } };
  },
  workEls(st) { return (st.cells || []).filter((_, i) => st.q.blanks.includes(st.q.reg[i])); },
  gestureHint(st) { const e = this.workEls(st)[0]; if (e) W3X.tapHint(st, e); },
  snap(st) { return { blanks: st.q.blanks.length }; },
};

/* ================================================================ 葫芦娃 L2 · 一笔画 draw the figure in one stroke (where to start matters) */
const STROKE_FIGS = {
  bowtie: { v: [[16, 18], [16, 82], [50, 50], [84, 18], [84, 82]], e: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 2]] },
  fish: { v: [[12, 50], [42, 22], [70, 50], [42, 78], [90, 24], [90, 76]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 2]] },
  tail: { v: [[50, 12], [84, 62], [16, 62], [50, 92]], e: [[0, 1], [1, 2], [2, 0], [1, 3]] },
  sqdiag: { v: [[18, 18], [82, 18], [82, 82], [18, 82]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]] },
  kite: { v: [[50, 8], [86, 50], [50, 92], [14, 50]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]] },
  flag: { v: [[26, 92], [26, 54], [26, 10], [82, 32]], e: [[0, 1], [1, 2], [2, 3], [3, 1]] },
  domino: { v: [[10, 24], [50, 24], [90, 24], [90, 76], [50, 76], [10, 76]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4]] },
  boat: { v: [[8, 62], [50, 62], [92, 62], [76, 90], [24, 90], [50, 10], [84, 52]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 5], [5, 6], [6, 1]] },
  house: { v: [[18, 44], [82, 44], [82, 92], [18, 92], [50, 8]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 1], [0, 2], [1, 3]] },
};
const MStroke = {
  kind0: 'stroke', verb: '画！', intro: '爷爷教画画！', praise: ['画得真顺！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const pool = [null, ['bowtie', 'fish', 'tail'], ['sqdiag', 'kite', 'flag', 'bowtie'], ['domino', 'kite', 'fish', 'boat'], ['house', 'domino', 'boat'], ['house', 'domino', 'boat', 'flag']][d];
    const name = bagPick(G, 'st' + d, pool), F = STROKE_FIGS[name], mx = rng() < 0.5, my = d >= 4 && name !== 'house' && rng() < 0.5;
    const v = F.v.map(([x, y]) => [mx ? 100 - x : x, my ? 100 - y : y]);
    const good = this.euler(v.length, F.e), bad = this.stuck(v.length, F.e, rng);
    return { k: [name, mx, my], name, v, e: F.e, good, bad, answer: 'done' };
  },
  deg(n, e) { const g = Array(n).fill(0); e.forEach(([a, b]) => { g[a]++; g[b]++; }); return g; },
  /* a full one-stroke path (Hierholzer) from an odd vertex if there are any */
  euler(n, e) {
    const dg = this.deg(n, e), start = dg.findIndex(x => x % 2) >= 0 ? dg.findIndex(x => x % 2) : 0;
    const used = e.map(() => false), stack = [start], path = [];
    while (stack.length) { const v = stack[stack.length - 1], i = e.findIndex(([a, b], k) => !used[k] && (a === v || b === v)); if (i < 0) path.push(stack.pop()); else { used[i] = true; stack.push(e[i][0] === v ? e[i][1] : e[i][0]); } }
    return path.reverse();
  },
  /* a walk that gets stuck with lines left (for the tests' wrong answer) */
  stuck(n, e, rng) {
    for (let t = 0; t < 300; t++) {
      const used = e.map(() => false); let v = rng.int(0, n - 1); const walk = [v];
      for (;;) { const opts = e.map((x, k) => k).filter(k => !used[k] && (e[k][0] === v || e[k][1] === v)); if (!opts.length) break; const k = rng.pick(opts); used[k] = true; v = e[k][0] === v ? e[k][1] : e[k][0]; walk.push(v); }
      if (used.includes(false)) return walk;
    }
    return null;
  },
  geo() { return K.L() ? { x: 512, y: 392, s: 470 } : { x: 352, y: 560, s: 560 }; },
  decor(G) { W3X.decor2(G, this.chars, true); },
  /* the paper is g.s + 60 square and its svg shows -15 .. 115: a dot sits exactly on its line end (R11-1) */
  vxy(st, i) { const g = this.geo(), p = st.q.v[i], u = (g.s + 60) / 130, x0 = g.x - g.s / 2 - 30, y0 = g.y - g.s / 2 - 30; return [x0 + (p[0] + 15) * u, y0 + (p[1] + 15) * u]; },
  place(st) { const g = this.geo(); place(st.paper, g.x - g.s / 2 - 30, g.y - g.s / 2 - 30, g.s + 60, g.s + 60); st.dots.forEach((e, i) => { const p = this.vxy(st, i); place(e, p[0] - 48, p[1] - 48, 96, 96); }); },
  draw(st) {
    const q = st.q, s = svg('svg', { viewBox: '-15 -15 130 130', width: '100%', height: '100%' });
    st.segs = q.e.map(([a, b]) => { svg('line', { x1: q.v[a][0], y1: q.v[a][1], x2: q.v[b][0], y2: q.v[b][1], stroke: '#B9A88E', 'stroke-width': 3.2, 'stroke-dasharray': '3 3', 'stroke-linecap': 'round' }, s); return svg('line', { x1: q.v[a][0], y1: q.v[a][1], x2: q.v[a][0], y2: q.v[a][1], stroke: '#2B2118', 'stroke-width': 4.6, 'stroke-linecap': 'round' }, s); });
    s.style.pointerEvents = 'none';
    return s;
  },
  async present(st) {
    const q = st.q;
    st.used = q.e.map(() => false); st.at = -1; st.path = [];
    st.paper = W2X.thing(st, 10, 10, 3, ''); Object.assign(st.paper.style, { borderRadius: '24px', background: '#FFF8EC', boxShadow: '0 0 0 5px #2B2118' }); st.paper.appendChild(this.draw(st));
    st.dots = q.v.map((_, i) => { const e = W2X.thing(st, 96, 96, 5, ''); e.innerHTML = '<svg viewBox="0 0 96 96" width="100%" height="100%"><circle cx="48" cy="48" r="17" fill="#5CC46E" stroke="#2B2118" stroke-width="5"/></svg>'; K.reg(st, 'v' + i, e, {}); return e; });
    this.place(st);
    K.pop(st, st.paper); st.dots.forEach((e, i) => K.pop(st, e, 60 * i));
    K.task(st, [[W3X.ic('<path d="M20 80L50 20L80 80Z" fill="none" stroke="#B9A88E" stroke-width="6" stroke-dasharray="7 7"/><path d="M20 80L50 20L66 52" fill="none" stroke="#2B2118" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="80" r="9" fill="#5CC46E" stroke="#2B2118" stroke-width="4"/>')], ['q']]);
    W3X.say2(st, '一笔画完它！', '线不能走两遍！');
  },
  onGesture(st, name, p) {
    const m = /^v(\d+)$/.exec(p.id || ''); if (name !== 'tap' || !m || st.picked) return false;
    const v = Number(m[1]), q = st.q;
    if (st.at < 0) { st.at = v; st.path.push(v); st.dots[v].querySelector('circle').setAttribute('fill', '#E8414B'); K.pop(st, st.dots[v]); Sfx.place(); return 'ok'; }
    const k = q.e.findIndex(([a, b], i) => !st.used[i] && ((a === st.at && b === v) || (b === st.at && a === v)));
    if (k < 0) { K.wiggle(st, st.dots[v]); if (!st.toldLine) { st.toldLine = true; Voice.say('沿着线走哦', { tag: 'hint1' }); } return 'ok'; }
    st.used[k] = true; const a = st.at; st.at = v; st.path.push(v);
    const seg = st.segs[k]; seg.setAttribute('x1', q.v[a][0]); seg.setAttribute('y1', q.v[a][1]); seg.setAttribute('x2', q.v[v][0]); seg.setAttribute('y2', q.v[v][1]);
    st.dots.forEach((e, i) => e.querySelector('circle').setAttribute('fill', i === v ? '#E8414B' : '#5CC46E'));
    Sfx.count(st.path.length - 1);
    if (st.used.every(Boolean)) { st.picked = true; Session.submit(st, 'done'); }
    else if (!q.e.some(([x, y], i) => !st.used[i] && (x === v || y === v))) { st.picked = true; Session.submit(st, 'stuck'); }
    return 'ok';
  },
  async reveal(st) { K.ring(st, [box(st.paper)], 4, '#FFC93C'); Sfx.reveal(); this.cheerAll(st); st.summary = '一笔画完啦！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300); },
  async feedback(st) {
    const q = st.q, dg = this.deg(q.v.length, q.e), odd = dg.map((d, i) => d % 2 ? i : -1).filter(i => i >= 0);
    K.wiggle(st, st.dots[st.at]);
    W3X.say(odd.length && !odd.includes(st.path[0]) ? '换个点开始试试' : '还有线没画到');      /* what went wrong, not where to start (R11-3) */
    await st.scope.wait(700);
  },
  /* not a choice (the child draws); after a wrong answer: where he got stuck and the lines not drawn (blue); then, from
     the right dot (gold), the whole figure in one stroke */
  async explain(st, ans) {
    const q = st.q, my = st, P = (x, y) => [x, y];
    if (st.at >= 0) W3X.ringAt(st, box(st.dots[st.at]), W3X.BLUE, -8);
    q.e.forEach(([a, b], k) => { if (!st.used[k]) { const s = st.segs[k]; s.setAttribute('x1', q.v[a][0]); s.setAttribute('y1', q.v[a][1]); s.setAttribute('x2', q.v[b][0]); s.setAttribute('y2', q.v[b][1]); s.setAttribute('stroke', W3X.BLUE); s.setAttribute('stroke-dasharray', '3 3'); } });
    await st.scope.wait(T(1100)); if (!Session.alive(my)) return;
    st.els.filter(e => e.classList && e.classList.contains('ringo')).forEach(e => e.remove());
    st.segs.forEach((s, k) => { const [a] = q.e[k]; s.setAttribute('x2', q.v[a][0]); s.setAttribute('y2', q.v[a][1]); s.setAttribute('x1', q.v[a][0]); s.setAttribute('y1', q.v[a][1]); s.setAttribute('stroke', '#2B2118'); s.removeAttribute('stroke-dasharray'); });
    const path = q.good, used = q.e.map(() => false);
    st.dots.forEach((e, i) => e.querySelector('circle').setAttribute('fill', i === path[0] ? '#E8414B' : '#5CC46E'));
    W3X.ringAt(st, box(st.dots[path[0]]), W3X.GOLD, -8); W3X.tell('从这里开始！');
    await st.scope.wait(T(700)); if (!Session.alive(my)) return;
    for (let i = 1; i < path.length; i++) {
      if (!Session.alive(my)) return;
      const a = path[i - 1], b = path[i], k = q.e.findIndex(([x, y], j) => !used[j] && ((x === a && y === b) || (x === b && y === a))); if (k < 0) continue;
      used[k] = true; const s = st.segs[k]; s.setAttribute('x1', q.v[a][0]); s.setAttribute('y1', q.v[a][1]); s.setAttribute('x2', q.v[b][0]); s.setAttribute('y2', q.v[b][1]); s.setAttribute('stroke', '#E89A00');
      st.dots.forEach((e, j) => e.querySelector('circle').setAttribute('fill', j === b ? '#E8414B' : '#5CC46E')); Sfx.count(i);
      await st.scope.wait(T(230));
    }
    void P; K.ring(st, [box(st.paper)], 4, W3X.GOLD); Sfx.reveal(); W3X.tell('一笔画完啦！');
    await W3X.beat(st, 1200);
  },
  audit() { return { none: 'the child draws the figure' }; },
  next(st, strat) {
    if (st.picked) return null;
    const seq = strat === 'wrong' && st.q.bad ? st.q.bad : st.q.good;
    const i = st.path.length; if (i >= seq.length) return null;
    return { g: 'tap', p: { id: 'v' + seq[i] } };
  },
  workEls(st) { return st.dots || []; },
  snap(st) { return { name: st.q.name, steps: st.path ? st.path.length : 0 }; },
};

/* ================================================================ 葫芦娃 L3 · 算盘 the abacus: an upper bead is five, a lower bead is one */
const MAbacus = {
  kind0: 'abacus', verb: '拨！', intro: '拨算盘！', praise: ['算盘拨得真好！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const mode = bagPick(G, 'ab' + d, ['make', 'read']);
    const n = d === 1 ? rng.int(1, 4) : d === 2 ? rng.int(5, 9) : d === 3 ? rng.pick([3, 4, 6, 7, 8, 9]) : d === 4 ? rng.int(10, 15) : rng.int(11, 20);
    const rods = n >= 10 ? 2 : 1;
    return { k: [d, mode, n], mode, n, rods, answer: n, opts: mode === 'read' ? numOptions(G, n, 1, 20) : null };
  },
  audit(q) { return q.mode === 'read' ? W3X.auditNum(q) : { none: 'the child moves the beads' }; },
  /* the five number cards (read): two columns right of the abacus (landscape), one row under it (portrait, right of the
     watcher) */
  cardFr(L) { return (L == null ? K.L() : L) ? { x: 760, y: 120, w: 250, h: 560 } : { x: 140, y: 796, w: 550, h: 214 }; },
  val(r) { return r.u * 5 + r.l; },
  total(st) { return st.rods.reduce((s, r, i) => s + this.val(r) * (st.rods.length === 2 && i === 0 ? 10 : 1), 0); },
  geo(st) { const L = K.L(), n = st.q.rods; return L ? { cx: st.q.mode === 'read' ? 420 : 470, top: 126, h: 520, rw: 170, n } : { cx: 352, top: 236, h: 530, rw: 190, n }; },
  decor(G) { W3X.decor2(G, this.chars, true); },
  cardSpot() { return K.L() ? { cx: 840, cy: 380 } : { cx: 352, cy: 860 }; },
  /* bead positions: the beam at 30 % of the height; the upper bead up (rest) or down (counted); lower beads up (counted) or down */
  lay(st) {
    const g = this.geo(st), W = g.n * g.rw, x0 = g.cx - W / 2, beam = g.top + g.h * 0.3, bh = 50, bot = g.top + g.h - 16;
    return { g, W, x0, beam, bh, bot, rodX: i => x0 + g.rw * (i + 0.5) };
  },
  place(st) {
    const Ly = this.lay(st), g = Ly.g;
    place(st.frame, Ly.x0 - 26, g.top - 22, Ly.W + 52, g.h + 44);
    st.rods.forEach((r, i) => {
      const x = Ly.rodX(i);
      if (r.rod) place(r.rod, x - 4, g.top - 8, 8, g.h + 6);
      place(r.up, x - 48, r.u ? Ly.beam - Ly.bh - 8 : g.top + 6, 96, Ly.bh);
      r.lows.forEach((b, j) => { const counted = j < r.l; place(b, x - 48, counted ? Ly.beam + 14 + j * (Ly.bh + 4) : Ly.bot - (4 - j) * (Ly.bh + 4), 96, Ly.bh); });
      if (r.zu) place(r.zu, x - g.rw / 2 + 6, g.top - 10, g.rw - 12, Ly.beam - g.top + 4);
      if (r.zc) { const split = Ly.beam + 14 + r.l * (Ly.bh + 4) + (Ly.bot - (4 - r.l) * (Ly.bh + 4) - Ly.beam - 14 - r.l * (Ly.bh + 4)) / 2; place(r.zc, x - g.rw / 2 + 6, Ly.beam + 8, g.rw - 12, split - Ly.beam - 8); r.zc.style.display = r.l ? '' : 'none'; place(r.zr, x - g.rw / 2 + 6, split, g.rw - 12, Ly.bot - split + 10); r.zr.style.display = r.l < 4 ? '' : 'none'; }
    });
    place(st.beam, Ly.x0 - 10, Ly.beam - 8, Ly.W + 20, 16);
    if (st.cards) W3X.lay(st.cards, this.cardFr(), box(st.cards[0]).w, null, 14);
    if (st.doneBtn) K.placeDone(st.doneBtn);
  },
  async present(st) {
    const q = st.q, make = q.mode === 'make';
    st.frame = W2X.thing(st, 10, 10, 3, ''); Object.assign(st.frame.style, { borderRadius: '18px', border: '12px solid #8A5A2E', background: 'rgba(255,248,236,.9)', boxShadow: '0 0 0 4px #2B2118, inset 0 0 0 3px #2B2118' });
    st.beam = W2X.thing(st, 10, 10, 5, ''); Object.assign(st.beam.style, { borderRadius: '6px', background: '#8A5A2E', boxShadow: '0 0 0 3px #2B2118' });
    const shown = make ? 0 : q.n, digitsOf = q.rods === 2 ? [Math.floor(shown / 10), shown % 10] : [shown];
    const beadEl = c => { const e = W2X.thing(st, 96, 50, 6, ''); e.innerHTML = '<svg viewBox="0 0 96 50" width="100%" height="100%"><path d="M4 25L22 5H74L92 25L74 45H22Z" fill="' + c + '" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/><path d="M24 14H60" stroke="rgba(255,255,255,.55)" stroke-width="5" stroke-linecap="round"/></svg>'; return e; };
    st.rods = digitsOf.map((v, i) => {
      const r = { u: v >= 5 ? 1 : 0, l: v % 5, up: beadEl('#E8414B'), lows: [0, 1, 2, 3].map(() => beadEl('#C98B4A')) };
      const rod = W2X.thing(st, 10, 10, 4, ''); r.rod = rod; Object.assign(rod.style, { background: '#2B2118', borderRadius: '3px' });
      if (make) { r.zu = W2X.thing(st, 10, 10, 8, ''); K.reg(st, 'u' + i, r.zu, {}); r.zc = W2X.thing(st, 10, 10, 8, ''); K.reg(st, 'c' + i, r.zc, {}); r.zr = W2X.thing(st, 10, 10, 8, ''); K.reg(st, 'r' + i, r.zr, {}); }
      return r;
    });
    this.place(st);
    K.pop(st, st.frame);
    if (make) { st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {}); K.task(st, [[W3X.ic('<rect x="22" y="8" width="56" height="84" rx="8" fill="#FFF8EC" stroke="#8A5A2E" stroke-width="7"/><path d="M22 34H78" stroke="#8A5A2E" stroke-width="6"/><path d="M36 22H64" stroke="#E8414B" stroke-width="10" stroke-linecap="round"/><path d="M36 48H64M36 62H64" stroke="#C98B4A" stroke-width="10" stroke-linecap="round"/>')], [{ qty: q.n }]]); K.say(st, '拨出' + CN[q.n] + '！'); if (!st.G.toldBead) { st.G.toldBead = true; W3X.tip('上面一颗是五！'); } }
    else { K.cards(st, q.opts, Object.assign({ layout: 'frame', size: W3X.size2(q.opts.length, [this.cardFr(true), this.cardFr(false)], 136, 14), gap: 14 }, this.cardSpot())); this.place(st); K.task(st, [[W3X.ic('<rect x="22" y="8" width="56" height="84" rx="8" fill="#FFF8EC" stroke="#8A5A2E" stroke-width="7"/><path d="M22 34H78" stroke="#8A5A2E" stroke-width="6"/><path d="M36 42H64" stroke="#E8414B" stroke-width="10" stroke-linecap="round"/><path d="M36 54H64" stroke="#C98B4A" stroke-width="10" stroke-linecap="round"/>')], ['q']]); K.say(st, '算盘上是几？'); }
  },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || st.picked) return false;
    if (st.q.mode === 'read') return W3X.tapCards(st, name, p);
    if (id === 'done') { st.picked = true; Session.submit(st, this.total(st)); return 'ok'; }
    const m = /^([ucr])(\d)$/.exec(id); if (!m) return false;
    const r = st.rods[Number(m[2])];
    if (m[1] === 'u') r.u = 1 - r.u; else if (m[1] === 'c' && r.l > 0) r.l--; else if (m[1] === 'r' && r.l < 4) r.l++; else return false;
    Sfx.place(); this.place(st); return 'ok';
  },
  async reveal(st) {
    await this.count(st); if (!Session.alive(st)) return;
    Sfx.reveal(); this.cheerAll(st);
    st.summary = this.sum(st.q.n);
    Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
  },
  sum(n) { return n >= 10 && n !== 10 && n !== 20 ? '十和' + CN[n - 10] + '是' + CN[n] + '！' : n >= 6 && n <= 9 ? '五和' + CN[n - 5] + '是' + CN[n] + '！' : '是' + CN[n] + '！'; },
  /* after a wrong answer: (read) his card (blue), the beads counted, the right card (gold); (make) the rods that are not
     right (blue), then the beads move to the right places and are counted (gold) */
  async explain(st, ans) {
    const q = st.q, my = st;
    if (q.mode === 'read') { await W3X.explainCards(st, ans, { show: () => this.count(st), line: this.sum(q.n) }); return; }
    const want = q.rods === 2 ? [Math.floor(q.n / 10), q.n % 10] : [q.n], Ly = this.lay(st);
    st.rods.forEach((r, i) => { if (r.u !== (want[i] >= 5 ? 1 : 0) || r.l !== want[i] % 5) W3X.ringAt(st, { x: Ly.rodX(i) - Ly.g.rw / 2 + 8, y: Ly.g.top - 6, w: Ly.g.rw - 16, h: Ly.g.h + 12 }, W3X.BLUE, 0); });
    await st.scope.wait(T(1300)); if (!Session.alive(my)) return;
    st.els.filter(e => e.classList && e.classList.contains('ringo')).forEach(e => e.remove());
    await this.count(st); if (!Session.alive(my)) return;
    K.ring(st, [box(st.frame)], 6, W3X.GOLD); Sfx.reveal(); W3X.tell(this.sum(q.n));
    await W3X.beat(st, 1500);
  },
  /* the beads set to the number (make) and counted: five for the upper bead, one for each lower one, ten for a ten */
  async count(st) {
    const q = st.q, my = st;
    if (q.mode === 'make') { const show = q.rods === 2 ? [Math.floor(q.n / 10), q.n % 10] : [q.n]; st.rods.forEach((r, i) => { r.u = show[i] >= 5 ? 1 : 0; r.l = show[i] % 5; }); this.place(st); }
    let run = 0;
    for (let i = 0; i < st.rods.length; i++) {
      const r = st.rods[i], tens = st.rods.length === 2 && i === 0;
      if (tens) { for (let j = 0; j < r.l; j++) { if (!Session.alive(my)) return; K.hop(st, r.lows[j], 12); run += 10; await Count.beat(st.scope, 380, run); } continue; }
      if (r.u) { if (!Session.alive(my)) return; K.hop(st, r.up, 12); run += 5; await Count.beat(st.scope, 380, run); }
      for (let j = 0; j < r.l; j++) { if (!Session.alive(my)) return; K.hop(st, r.lows[j], 12); run += 1; await Count.beat(st.scope, 330, run); }
    }
  },
  async feedback(st, ans) {
    if (st.q.mode === 'read') { const i = st.opts.indexOf(ans); if (st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CN[ans]); }
    else { K.wiggle(st, st.frame); W3X.say('这是' + (CN[ans] || ans)); }
    await st.scope.wait(600);
  },
  next(st, strat) {
    if (st.picked) return null;
    const q = st.q;
    if (q.mode === 'read') return st.cards ? K.cardNext(st, strat) : null;
    if (strat === 'wrong') return this.total(st) !== q.n ? { g: 'tap', p: { id: 'done' } } : { g: 'tap', p: { id: 'r' + (st.rods.length - 1) } };
    const want = q.rods === 2 ? [Math.floor(q.n / 10), q.n % 10] : [q.n];
    for (let i = 0; i < st.rods.length; i++) { const r = st.rods[i], w = want[i]; if (r.u !== (w >= 5 ? 1 : 0)) return { g: 'tap', p: { id: 'u' + i } }; if (r.l < w % 5) return { g: 'tap', p: { id: 'r' + i } }; if (r.l > w % 5) return { g: 'tap', p: { id: 'c' + i } }; }
    return { g: 'tap', p: { id: 'done' } };
  },
  workEls(st) { return st.q.mode === 'read' ? (st.cards || []) : [st.frame]; },
  gestureHint(st) { if (st.q.mode === 'make' && st.rods) W3X.tapHint(st, st.rods[st.rods.length - 1].lows[3]); },
  snap(st) { return { mode: st.q.mode, val: st.rods ? this.total(st) : null }; },
};

/* ================================================================ 葫芦娃 L4 · 补 mend the brocade: which patch continues the pattern (reasoning) */
const MCloth = {
  kind0: 'cloth', verb: '补！', intro: '花布破了个洞！', praise: ['补得真巧！'],
  C: 6, R: 5,
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng, kinds = ['circle', 'sq', 'tri', 'diamond', 'heart', 'star'];
    const cols = rng.shuffle([0, 1, 2, 3, 4, 5]), sh = rng.shuffle(kinds.slice());
    const type = ['stripes', 'check', 'shift', 'grow', 'turn'][d - 1];
    const k = d === 1 ? rng.int(2, 3) : 3, vert = rng() < 0.5;
    const cell = (r, c) => {
      if (type === 'stripes') { const i = (vert ? c : r) % k; return { k: 'sq', c: cols[i], s: 1.25, rot: 0 }; }
      if (type === 'check') { const i = (r + c) % 2; return { k: sh[i], c: cols[i], s: 1, rot: 0 }; }
      if (type === 'shift') { const i = (c + r) % 3; return { k: sh[i], c: cols[i], s: 1, rot: 0 }; }
      if (type === 'grow') return { k: sh[0], c: cols[r % 2], s: [0.55, 0.8, 1.05][c % 3], rot: 0 };
      return { k: 'arrow', c: cols[r % 2], s: 1, rot: (c % 4) * 90 };
    };
    const hs = d === 1 ? 1 : 2, r0 = rng.int(0, this.R - hs), c0 = rng.int(1, this.C - hs - 1);
    const patch = (rr, cc, f) => { const out = []; for (let i = 0; i < hs; i++) for (let j = 0; j < hs; j++) out.push(f ? f(cell(rr + i, cc + j), i, j) : cell(rr + i, cc + j)); return out; };
    const key = p => p.map(x => x.k + x.c + x.s + x.rot).join(';');
    const ok = patch(r0, c0), cand = [], near = [];
    /* the wrong patches: cut from another place of the cloth, or with the pattern changed (the kind of change this cloth
       is about first: size, turn, shape), then another colour */
    [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1], [0, 2], [2, 0]].forEach(([dr, dc]) => { const rr = r0 + dr, cc = c0 + dc; if (rr >= 0 && cc >= 0 && rr + hs <= this.R && cc + hs <= this.C) near.push({ p: patch(rr, cc), why: 'pos' }); });
    if (type === 'grow') [1, 2].forEach(t => cand.push({ p: patch(r0, c0, x => Object.assign({}, x, { s: [0.55, 0.8, 1.05][([0.55, 0.8, 1.05].indexOf(x.s) + t) % 3] })), why: 'size' }));
    if (type === 'turn') [90, 180, 270].forEach(t => cand.push({ p: patch(r0, c0, x => Object.assign({}, x, { rot: (x.rot + t) % 360 })), why: 'turn' }));
    if (type === 'check' || type === 'shift') [1, 2].forEach(t => cand.push({ p: patch(r0, c0, x => Object.assign({}, x, { k: sh[(sh.indexOf(x.k) + t) % 3] })), why: 'shape' }));
    if (type === 'stripes') cand.push({ p: patch(r0, c0, x => Object.assign({}, x, { k: 'circle' })), why: 'shape' });
    const colr = [1, 2, 3, 4, 5].map(t => ({ p: patch(r0, c0, x => Object.assign({}, x, { c: cols[(cols.indexOf(x.c) + t) % 6] })), why: 'color' }));
    const foils = W3X.uniq(rng.shuffle(near).slice(0, 2).concat(rng.shuffle(cand), rng.shuffle(near), rng.shuffle(colr)), c => key(c.p), 4, [{ p: ok }]);
    const right = { p: ok, why: 'ok' }, opts = W3X.deal(G, right, foils, 'cl');
    const grid = []; for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) grid.push(cell(r, c));
    return { k: [d, type, k, vert, r0, c0, cols.join('')], type, hs, r0, c0, grid, opts, answer: opts.indexOf(right) };
  },
  audit(q) { const key = p => p.map(x => x.k + x.c + x.s + x.rot).join(';'), want = []; for (let i = 0; i < q.hs; i++) for (let j = 0; j < q.hs; j++) want.push(q.grid[(q.r0 + i) * this.C + q.c0 + j]); const good = q.opts.map((o, i) => (key(o.p) === key(want) ? i : -1)).filter(i => i >= 0); return { n: q.opts.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer && new Set(q.opts.map(o => key(o.p))).size === q.opts.length ? null : 'right ones ' + good }; },
  motif(s, x, cx, cy, r) {
    if (x.k === 'arrow') { W2X.shape(s, 'arrow', cx, cy, r * 1.2, W2X.pal[x.c], x.rot, 3); return; }
    W2X.shape(s, x.k, cx, cy, r * x.s, W2X.pal[x.c], x.rot, 3);
  },
  clothSvg(q) {
    const s = svg('svg', { viewBox: '0 0 ' + this.C * 40 + ' ' + this.R * 40, width: '100%', height: '100%' });
    svg('rect', { x: 0, y: 0, width: this.C * 40, height: this.R * 40, fill: '#FFF3D6' }, s);
    q.grid.forEach((x, i) => { const r = Math.floor(i / this.C), c = i % this.C; if (r >= q.r0 && r < q.r0 + q.hs && c >= q.c0 && c < q.c0 + q.hs) return; this.motif(s, x, c * 40 + 20, r * 40 + 20, 12); });
    svg('rect', { x: q.c0 * 40 + 1, y: q.r0 * 40 + 1, width: q.hs * 40 - 2, height: q.hs * 40 - 2, fill: '#6B4A2E', stroke: '#2B2118', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, s);
    s.style.pointerEvents = 'none';
    return s;
  },
  patchSvg(p, hs) { const s = svg('svg', { viewBox: '0 0 ' + hs * 40 + ' ' + hs * 40, width: '100%', height: '100%' }); svg('rect', { x: 0, y: 0, width: hs * 40, height: hs * 40, fill: '#FFF3D6' }, s); p.forEach((x, i) => this.motif(s, x, (i % hs) * 40 + 20, Math.floor(i / hs) * 40 + 20, 12)); s.style.pointerEvents = 'none'; return s; },
  geo(st) { const L = K.L(), cw = L ? 66 : 84; return L ? { cw, x: 512 - this.C * cw / 2, y: 120 } : { cw, x: 352 - this.C * cw / 2, y: 230 }; },
  /* the five patches: one row right of the watcher (landscape), 3 + 2 (portrait) */
  optFr(L) { return (L == null ? K.L() : L) ? { x: 170, y: 500, w: 840, h: 190 } : { x: 16, y: 688, w: 672, h: 320 }; },
  optS(st) { return W3X.size2(st.q.opts.length, [this.optFr(true), this.optFr(false)], st.q.hs === 1 ? 116 : 140, 24); },
  decor(G) { W3X.decor2(G, this.chars, true); },
  place(st) { const g = this.geo(st); place(st.cloth, g.x, g.y, this.C * g.cw, this.R * g.cw); place(st.frame, g.x - 14, g.y - 14, this.C * g.cw + 28, this.R * g.cw + 28); if (st.cards) { st.cards.forEach(c => { if (c._moved) { c._moved = false; c.style.transform = ''; c.style.zIndex = ''; } }); W3X.lay(st.cards, this.optFr(), this.optS(st), null, 24); } },
  async present(st) {
    const q = st.q;
    st.frame = W2X.thing(st, 10, 10, 3, ''); Object.assign(st.frame.style, { borderRadius: '10px', background: '#C8323C', boxShadow: '0 0 0 4px #2B2118, inset 0 0 0 4px #FFC93C' });
    st.cloth = W2X.thing(st, 10, 10, 4, ''); st.cloth.appendChild(this.clothSvg(q));
    W2X.cards(st, q.opts.map(o => this.patchSvg(o.p, q.hs)), q.opts.map((_, i) => i), { size: this.optS(st), gap: 24, cx: Stage.W / 2, cy: 600 });
    this.place(st);
    K.pop(st, st.frame);
    K.task(st, [[W3X.ic('<rect x="8" y="8" width="84" height="84" rx="6" fill="#FFF3D6" stroke="#2B2118" stroke-width="5"/><rect x="50" y="50" width="30" height="30" fill="#6B4A2E" stroke="#2B2118" stroke-width="3" stroke-dasharray="5 4"/><circle cx="28" cy="28" r="9" fill="#FF6B5B"/><circle cx="64" cy="28" r="9" fill="#4FB3FF"/><circle cx="28" cy="64" r="9" fill="#4FB3FF"/>')], ['q']]);
    K.say(st, '哪块能补上？');
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  async reveal(st) {
    const q = st.q, g = this.geo(st), c = st.cards[q.answer], b = box(c);
    await K.flyTo(st, c, g.x + q.c0 * g.cw - (b.w - q.hs * g.cw) / 2, g.y + q.r0 * g.cw - (b.h - q.hs * g.cw) / 2, 480, 60, q.hs * g.cw / b.w);
    Sfx.reveal(); this.cheerAll(st); st.summary = '花布补好啦！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
  },
  async feedback(st, ans) { if (st.cards[ans]) K.wiggle(st, st.cards[ans]); W3X.say({ pos: '位置不对哦', color: '颜色不对哦', size: '大小不对哦', turn: '方向不对哦', shape: '形状不对哦' }[st.q.opts[ans].why] || '形状不对哦'); await st.scope.wait(500); },
  /* a patch flies into the hole (scaled to it) */
  async into(st, c) { const q = st.q, g = this.geo(st), b = box(c); c.style.zIndex = 9; c._moved = true; await K.flyTo(st, c, g.x + q.c0 * g.cw - (b.w - q.hs * g.cw) / 2, g.y + q.r0 * g.cw - (b.h - q.hs * g.cw) / 2, 480, 60, q.hs * g.cw / (b.w * 0.84)); },
  /* after a wrong answer: his patch goes into the hole - the pieces that do not go on with the cloth get blue rings; back
     to its place; the right patch goes in (gold) */
  async explain(st, ans) {
    const q = st.q, my = st, c = st.cards[ans], o = q.opts[ans], ok = q.opts[q.answer], key = x => x.k + x.c + x.s + x.rot, g = this.geo(st);
    if (c && o) {
      W3X.mine(st, c, 6);
      const s = c.querySelector('svg'); o.p.forEach((x, i) => { if (key(x) !== key(ok.p[i])) W3X.ringIn(s, (i % q.hs) * 40 + 20, Math.floor(i / q.hs) * 40 + 20, 18, W3X.BLUE, 3); });
      await st.scope.wait(T(700)); if (!Session.alive(my)) return;
      st.els.filter(e => e.classList && e.classList.contains('ringo')).forEach(e => e.remove());
      await this.into(st, c); if (!Session.alive(my)) return;
      await st.scope.wait(T(1400)); if (!Session.alive(my)) return;
      this.place(st);
      await st.scope.wait(T(250)); if (!Session.alive(my)) return;
    }
    await this.into(st, st.cards[q.answer]); if (!Session.alive(my)) return;
    W3X.ringAt(st, { x: g.x + q.c0 * g.cw, y: g.y + q.r0 * g.cw, w: q.hs * g.cw, h: q.hs * g.cw }, W3X.GOLD, 10);
    Sfx.reveal(); W3X.tell('花布补好啦！');
    await W3X.beat(st, 1600);
  },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.opts.length : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
  snap(st) { return { type: st.q.type }; },
};

/* ================================================================ 西游记 S1 · 篮 all / none / only one: the heavenly fruit plates */
const FRUIT3 = [['persimmon', '柿子'], ['pomegranate', '石榴'], ['starfruit', '杨桃']];
const MBaskets = {
  kind0: 'baskets', verb: '找！', intro: '仙果摆好啦！', praise: ['看得真仔细！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const mode = d === 1 ? 'all' : d === 2 ? 'none' : d === 3 ? bagPick(G, 'bk3', ['all', 'none']) : d === 4 ? bagPick(G, 'bk4', ['one', 'all']) : bagPick(G, 'bk5', ['one', 'none', 'all']);
    const m = d <= 2 ? 3 : d === 3 ? 4 : d === 4 ? rng.int(4, 5) : 5;
    const t = rng.int(0, 2), oth = [0, 1, 2].filter(x => x !== t);
    const ok = { all: m, none: 0, one: 1 }[mode];
    /* five plates: the right one and four that are not (nearly all / one too many / none ...) */
    const bad = { all: [m - 1, m - 1, rng.int(1, Math.max(1, m - 2)), 0], none: [1, 1, rng.int(2, m), m], one: [0, 2, rng.int(2, m), m] }[mode];
    const plate = c => rng.shuffle(Array(c).fill(t).concat(Array.from({ length: m - c }, () => rng.pick(oth))));
    const right = plate(ok), plates = W3X.deal(G, right, bad.map(plate), 'bk'), counts = plates.map(p => p.filter(f => f === t).length);
    return { k: [d, mode, t, plates.map(p => p.join('')).join('|')], mode, t, plates, counts, answer: plates.indexOf(right) };
  },
  audit(q) { const ok = { all: q.plates[0].length, none: 0, one: 1 }[q.mode], good = q.counts.map((c, i) => (c === ok ? i : -1)).filter(i => i >= 0); return { n: q.plates.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer ? null : 'right ones ' + good }; },
  /* five plates: one row between the watchers (landscape), 3 + 2 (portrait) */
  geo(st) { return K.L() ? { fr: { x: 20, y: 150, w: 984, h: 330 }, max: 228, gap: 16 } : { fr: { x: 16, y: 230, w: 672, h: 620 }, max: 230, gap: 20 }; },
  decor(G) { W3X.decor2(G, this.chars); },
  fruitXY(i, m, b) { const per = m <= 3 ? m : Math.ceil(m / 2), r = Math.floor(i / per), c = i % per, inRow = Math.min(per, m - r * per), rows = Math.ceil(m / per), s = b.w * (m <= 3 ? 0.31 : 0.28); return { x: b.x + b.w / 2 + (c - (inRow - 1) / 2) * s * 0.92 - s / 2, y: b.y + b.h * 0.5 + (r - (rows - 1) / 2) * s * 0.78 - s / 2 - b.h * 0.06, s }; },
  place(st) {
    const g = this.geo(st), P = W3X.grid(st.plateEls.length, g.fr, g.max, g.gap, 0.82);
    st.plateEls.forEach((e, i) => place(e, P.pos[i].x, P.pos[i].y, P.w, P.h));
    st.fr.forEach(o => { const b = box(st.plateEls[o.p]), q = this.fruitXY(o.i, st.q.plates[o.p].length, b); place(o.e, q.x, q.y, q.s, q.s); });
  },
  async present(st) {
    const q = st.q, F = FRUIT3[q.t];
    st.plateEls = q.plates.map((_, i) => { const e = W3X.card(st, 'card' + i, 4, ''); e.innerHTML = '<svg viewBox="0 0 200 164" width="100%" height="100%"><ellipse cx="100" cy="98" rx="94" ry="58" fill="#FFC93C" stroke="#2B2118" stroke-width="6"/><ellipse cx="100" cy="92" rx="74" ry="40" fill="#FFE59A" stroke="#C99A1A" stroke-width="4"/></svg>'; return e; });
    st.cards = st.plateEls; st.opts = q.plates.map((_, i) => i);
    st.fr = []; q.plates.forEach((pl, p) => pl.forEach((f, i) => { const e = K.item(Stage.el, 'assets/props/' + FRUIT3[f][0] + '.png', 50, 50); e.style.zIndex = 5 + i; st.els.push(e); st.fr.push({ e, p, i, f }); }));
    this.place(st);
    st.plateEls.forEach((e, i) => K.pop(st, e, 100 * i)); st.fr.forEach((o, i) => K.pop(st, o.e, 200 + 25 * i));
    K.task(st, [['assets/props/' + F[0] + '.png'], ['q']]);
    if (q.mode === 'one') W3X.say2(st, '数一数' + F[1] + '！', '哪盘只有一个？');
    else K.say(st, q.mode === 'all' ? '哪盘全是' + F[1] + '？' : '哪盘没有' + F[1] + '？');
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  async reveal(st) {
    const q = st.q, F = FRUIT3[q.t], e = st.plateEls[q.answer];
    st.fr.filter(o => o.p === q.answer && o.f === q.t).forEach(o => K.hop(st, o.e, 16));
    K.ring(st, [box(e)], 6, '#FFC93C'); Sfx.reveal(); this.cheerAll(st);
    /* and why not the others (R10-4): their fruit that breaks the rule shows itself */
    st.scope.timeout(() => { if (!Session.alive(st)) return; K.flash(st, st.fr.filter(o => o.p !== q.answer && (q.mode === 'all' ? o.f !== q.t : o.f === q.t)).map(o => o.e)); }, 900);
    st.summary = q.mode === 'all' ? '全是' + F[1] + '！' : q.mode === 'none' ? '没有' + F[1] + '！' : '只有一个' + F[1] + '！';
    Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  /* after a wrong answer: his plate (blue) and the fruit on it that breaks the rule (blue rings); the right plate (gold),
     its fruit hops */
  async explain(st, ans) {
    const q = st.q, my = st, F = FRUIT3[q.t], e = st.plateEls[ans];
    if (e) { W3X.mine(st, e, 6); st.fr.filter(o => o.p === ans && (q.mode === 'all' ? o.f !== q.t : o.f === q.t)).forEach(o => W3X.ringAt(st, box(o.e), W3X.BLUE, 2)); }
    await st.scope.wait(T(1500)); if (!Session.alive(my)) return;
    W3X.gold(st, st.plateEls[q.answer], 6, 0); st.fr.filter(o => o.p === q.answer && o.f === q.t).forEach(o => K.hop(st, o.e, 16));
    Sfx.reveal(); W3X.tell(q.mode === 'all' ? '全是' + F[1] + '！' : q.mode === 'none' ? '没有' + F[1] + '！' : '只有一个' + F[1] + '！');
    await W3X.beat(st, 1600);
  },
  async feedback(st, ans) {
    const q = st.q, c = q.counts[ans], F = FRUIT3[q.t]; if (st.plateEls[ans]) K.wiggle(st, st.plateEls[ans]);
    st.fr.filter(o => o.p === ans && o.f === q.t).forEach(o => K.hop(st, o.e, 10));
    W3X.say(q.mode === 'all' ? '这盘有别的' : q.mode === 'none' ? '这盘有' + F[1] : c === 0 ? '这盘一个也没有' : '这盘有' + CNQ(c) + '个');
    await st.scope.wait(600);
  },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.plates.length : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
  workEls(st) { return st.plateEls || []; },
  snap(st) { return { mode: st.q.mode }; },
};

/* ================================================================ 西游记 S2 · 钻 which cave door can they get through (wide enough AND tall enough) */
const WALKERS = { bajie: [168, '八戒'], shaseng: [222, '沙僧'], tangseng: [208, '师父'], wukong: [150, '悟空'] };
const MDoors = {
  kind0: 'doors', verb: '钻！', intro: '前面是山洞！', praise: ['大小比得真准！'],
  size(id) { const m = META[id], h = WALKERS[id][0]; return { w: Math.round(h * m[0] / m[1]), h }; },
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const who = d === 1 ? ['bajie'] : d === 2 ? ['tangseng'] : d === 3 ? [rng.pick(['shaseng', 'bajie'])] : d === 4 ? ['bajie', 'tangseng'] : [rng.pick(['shaseng', 'bajie', 'tangseng'])];
    const need = who.map(id => this.size(id)).reduce((a, b) => ({ w: Math.max(a.w, b.w), h: Math.max(a.h, b.h) }), { w: 0, h: 0 });
    const W = need.w + 14, H = need.h + 14, gap = d === 5 ? 10 : 13;
    const ok = { w: W + rng.int(6, 18), h: H + rng.int(6, 18), why: 'ok' };
    /* four doors they cannot get through: too narrow (level 1), too low (level 2), either (3 - 5; closer at 5) - every one
       clearly smaller than the one who must pass */
    const nar = j => ({ w: W - 34 - gap * j, h: H + rng.int(10, 40), why: 'narrow' }), low = j => ({ w: W + rng.int(10, 36), h: H - 34 - gap * j, why: 'low' }), both = j => ({ w: W - 34 - gap * j, h: H - 34 - gap * j, why: 'narrow' });
    const foils = d === 1 ? [nar(0), nar(1), nar(2), nar(3)] : d === 2 ? [low(0), low(1), low(2), low(3)] : rng.shuffle([nar(0), low(0), rng.pick([nar(1), low(1)]), both(1)]);
    const doors = W3X.deal(G, ok, foils, 'dr');
    return { k: [d, who.join(), doors.map(x => x.w + 'x' + x.h).join()], who, need: { w: W, h: H }, doors, answer: doors.indexOf(ok) };
  },
  audit(q) { const fit = q.who.map(id => this.size(id)).reduce((a, b) => ({ w: Math.max(a.w, b.w), h: Math.max(a.h, b.h) }), { w: 0, h: 0 }), good = q.doors.map((d, i) => (d.w > fit.w && d.h > fit.h ? i : -1)).filter(i => i >= 0); return { n: q.doors.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer ? null : 'doors that fit ' + good }; },
  geo(st) {
    /* R11-2: everyone on the ground, the walkers side by side just left of the doors, each door as wide as itself;
       as big as fits (at most the old sizes), so nothing leaves the screen and no narrow door gets small. Five doors in
       portrait: the walkers and two doors on the upper ledge, three doors on the lower one */
    const L = K.L(), q = st.q, n = q.doors.length, ws = q.who.map(id => this.size(id).w), sum = a => a.reduce((x, y) => x + y, 0), dw = q.doors.map(d => d.w);
    const rows = L ? [Array.from({ length: n }, (_, i) => i)] : [[0, 1], [2, 3, 4].filter(i => i < n)], bases = L ? [600] : [560, 950];
    const fix = (r, wk) => (wk ? 12 * (ws.length - 1) + 36 : 0) + 16 * r.length + 14 * (r.length - 1), wid = (r, wk) => (wk ? sum(ws) : 0) + sum(r.map(i => dw[i]));
    const k = Math.min(1, ...rows.map((r, j) => (Stage.W - 40 - fix(r, j === 0)) / wid(r, j === 0)));
    const dx = [], db = [], wx = [];
    rows.forEach((r, j) => {
      let x = (Stage.W - fix(r, j === 0) - k * wid(r, j === 0)) / 2;
      if (j === 0) { ws.forEach(w => { wx.push(x); x += w * k + 12; }); x += 24; }
      r.forEach(i => { dx[i] = x + (dw[i] * k + 16) / 2; db[i] = bases[j]; x += dw[i] * k + 16 + 14; });
    });
    return { k, base: bases[0], bases, wx, dx, db };
  },
  decor(G) { W2X.hideAll(G, this.chars); },
  doorX(st, i) { return this.geo(st).dx[i]; },
  place(st) {
    const g = this.geo(st);
    place(st.wall, 0, g.bases[0] - 330 * g.k, Stage.W, 330 * g.k + 30);
    if (st.wall2) { st.wall2.style.display = g.bases.length > 1 ? '' : 'none'; if (g.bases.length > 1) place(st.wall2, 0, g.bases[1] - 330 * g.k, Stage.W, 330 * g.k + 30); }
    if (st.ledge) st.ledge.style.display = 'none';
    st.doorEls.forEach((e, i) => { const dd = st.q.doors[i], w = dd.w * g.k, h = dd.h * g.k, x = g.dx[i]; place(e, x - w / 2 - 8, g.db[i] - h - 8, w + 16, h + 8); });
    st.walkers.forEach((o, j) => { const s = this.size(o.id), w = s.w * g.k, h = s.h * g.k, x = o.at != null ? g.dx[o.at] - w / 2 : g.wx[j]; place(o.e, x, (o.at != null ? g.db[o.at] : g.base) - h, w, h); });
  },
  async present(st) {
    const q = st.q;
    st.wall = W2X.thing(st, 10, 10, 2, ''); st.wall.innerHTML = '<svg viewBox="0 0 100 40" width="100%" height="100%" preserveAspectRatio="none"><path d="M0 6Q10 0 20 5Q34 -1 48 4Q62 0 76 5Q90 0 100 4V40H0Z" fill="#B9855A" stroke="#2B2118" stroke-width=".6"/><path d="M8 16H22M40 24H56M70 14H88M14 32H30M62 30H80" stroke="#8A5A2E" stroke-width=".8" stroke-linecap="round"/></svg>';
    st.wall2 = W2X.thing(st, 10, 10, 2, ''); st.wall2.innerHTML = st.wall.innerHTML;
    st.doorEls = q.doors.map((dd, i) => { const e = W3X.card(st, 'card' + i, 3, ''); e.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none"><path d="M4 100V30Q4 4 50 4Q96 4 96 30V100Z" fill="#3A2614" stroke="#FFC93C" stroke-width="5" vector-effect="non-scaling-stroke"/></svg>'; return e; });
    st.cards = st.doorEls; st.opts = q.doors.map((_, i) => i);
    st.ledge = W2X.thing(st, 10, 10, 2, ''); st.ledge.innerHTML = '<svg viewBox="0 0 220 40" width="100%" height="100%" preserveAspectRatio="none"><path d="M4 8Q110 -2 216 8L200 36Q110 44 20 36Z" fill="#B9855A" stroke="#2B2118" stroke-width="4" vector-effect="non-scaling-stroke"/></svg>';
    st.walkers = q.who.map(id => { const e = el('div', 'item', Stage.el); e.style.position = 'absolute'; e.style.zIndex = 6; const im = img('assets/chars/' + id + '.png', '', e); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'fill' }); st.els.push(e); return { id, e, at: null }; });
    this.place(st);
    st.doorEls.forEach((e, i) => K.pop(st, e, 90 * i)); st.walkers.forEach(o => K.pop(st, o.e, 300));
    K.task(st, [[{ node: (() => { const d = el('span'); d.style.display = 'flex'; q.who.forEach(id => { const i = img('assets/thumbs/' + id + '.png', '', d); i.style.width = i.style.height = '44px'; }); return d; })() }], [W3X.ic('<path d="M22 92V40Q22 12 50 12Q78 12 78 40V92Z" fill="#3A2614" stroke="#2B2118" stroke-width="5"/>')]]);
    if (q.who.length === 2) W3X.say2(st, '两个都要钻过去！', '选哪个门？'); else K.say(st, '从哪个门钻过去？');
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  async reveal(st) {
    const q = st.q, my = st;
    for (const o of st.walkers) { if (!Session.alive(my)) return; o.at = q.answer; const b = box(o.e); this.place(st); const a = box(o.e); place(o.e, b.x, b.y); await K.flyTo(st, o.e, a.x, a.y, 600, 30); await st.scope.anim(o.e, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.85)' }], { duration: 400, fill: 'forwards' }); }
    Sfx.reveal(); st.summary = q.who.length === 2 ? '都钻过去啦！' : '钻过去啦！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
  },
  /* after a wrong answer: they go to his door and stand in it - they stick out (blue); then they go through the right
     door (gold) */
  async explain(st, ans) {
    const q = st.q, my = st;
    if (st.doorEls[ans]) W3X.mine(st, st.doorEls[ans], 4);
    await Promise.all(st.walkers.map(o => { o.at = ans; const b = box(o.e); this.place(st); const a = box(o.e); place(o.e, b.x, b.y); o.e.style.zIndex = 9; o.e.style.opacity = '0.8'; return K.flyTo(st, o.e, a.x, a.y, 650, 30); }));
    if (!Session.alive(my)) return;
    st.walkers.forEach(o => K.wiggle(st, o.e));
    await st.scope.wait(T(1300)); if (!Session.alive(my)) return;
    st.els.filter(e => e.classList && e.classList.contains('ringo')).forEach(e => e.remove());
    W3X.gold(st, st.doorEls[q.answer], 4, 0);
    for (const o of st.walkers) { if (!Session.alive(my)) return; o.e.style.opacity = ''; o.at = q.answer; const b = box(o.e); this.place(st); const a = box(o.e); place(o.e, b.x, b.y); await K.flyTo(st, o.e, a.x, a.y, 600, 30); await st.scope.anim(o.e, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.85)' }], { duration: 400, fill: 'forwards' }); }
    Sfx.reveal(); W3X.tell(q.who.length === 2 ? '都钻过去啦！' : '钻过去啦！');
    await W3X.beat(st, 1400);
  },
  async feedback(st, ans) {
    const dd = st.q.doors[ans], n = st.q.need; if (st.doorEls[ans]) K.wiggle(st, st.doorEls[ans]);
    const o = st.walkers[0]; if (o) K.wiggle(st, o.e);
    W3X.say(dd.w < n.w ? '门太窄啦' : '门太矮啦'); await st.scope.wait(600);
  },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.doors.length : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
  workEls(st) { return st.doorEls || []; },
  snap(st) { return { who: st.q.who.join() }; },
};

/* ================================================================ 西游记 S3 · 扇 the palm-leaf fans: which opens widest (angle, not size) */
const MFans = {
  kind0: 'fans', verb: '比！', intro: '芭蕉扇来啦！', praise: ['角度看得真准！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    /* five fans at every level (client: five options); the widest (smallest) one stands out by 40 degrees at level 1, 30
       at 2, 20 later; two that open the same at level 5 */
    const ask = d <= 3 ? 'big' : d === 4 ? 'small' : 'same', n = 5;
    for (let t = 0; t < 400; t++) {
      let angs;
      if (ask === 'same') { const a = rng.int(5, 12) * 10; angs = [a, a]; for (let k = 0; k < 300 && angs.length < n; k++) { const b = rng.int(3, 17) * 10; if (Math.abs(b - a) >= 30 && angs.slice(2).every(x => Math.abs(x - b) >= 20)) angs.push(b); } if (angs.length < n) continue; }
      else {
        angs = []; for (let k = 0; k < 300 && angs.length < n; k++) { const b = rng.int(3, 17) * 10; if (angs.every(x => Math.abs(x - b) >= 20)) angs.push(b); } if (angs.length < n) continue;
        const s = angs.slice().sort((x, y) => x - y); if ((ask === 'small' ? s[1] - s[0] : s[n - 1] - s[n - 2]) < (d === 1 ? 40 : d === 2 ? 30 : 20)) continue;
      }
      const rad = d <= 2 ? angs.map(() => 1) : angs.map(() => [0.62, 0.8, 1][rng.int(0, 2)]);
      const ext = ask === 'small' ? Math.min(...angs) : Math.max(...angs), ai = angs.indexOf(ext);
      if (d >= 3 && ask !== 'same') { /* the decoy: the biggest fan is not the widest one */ const bi = rad.indexOf(Math.max(...rad)); if (bi === ai) { rad[ai] = 0.62; const j = (ai + 1) % n; rad[j] = 1; } }
      if (ask === 'same') { rad[0] = 0.62; rad[1] = 1; }
      const rot = angs.map(() => d >= 4 ? rng.int(-3, 3) * 12 : 0);
      let order;
      if (ask === 'same') { const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push(i + '-' + j); const at = bagPick(G, 'fap', pairs).split('-').map(Number), rest = rng.shuffle([2, 3, 4]); order = Array.from({ length: n }, (_, i) => (i === at[0] ? 0 : i === at[1] ? 1 : rest.shift())); }
      else order = W3X.deal(G, ai, angs.map((_, i) => i).filter(i => i !== ai), 'fa');
      const fans = order.map(i => ({ a: angs[i], r: rad[i], rot: rot[i] }));
      const answer = ask === 'same' ? [order.indexOf(0), order.indexOf(1)].sort((x, y) => x - y).join('-') : order.indexOf(ai);
      return { k: [d, ask, fans.map(f => f.a + ':' + f.r).join()], ask, fans, answer };
    }
    return { k: [d, 'x'], ask: 'big', fans: [{ a: 60, r: 1, rot: 0 }, { a: 130, r: 1, rot: 0 }], answer: 1 };
  },
  fan(f) {
    const s = svg('svg', { viewBox: '-110 -110 220 220', width: '100%', height: '100%' }), k = W2X.ink, R = 100 * f.r;
    const g = svg('g', { transform: 'translate(0 ' + (60 * f.r) + ') rotate(' + f.rot + ')' }, s);
    const a0 = (-90 - f.a / 2) * Math.PI / 180, a1 = (-90 + f.a / 2) * Math.PI / 180, P = a => [R * Math.cos(a), R * Math.sin(a)];
    const p0 = P(a0), p1 = P(a1);
    svg('path', { d: 'M0 0L' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + 'A' + R + ' ' + R + ' 0 ' + (f.a > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'Z', fill: '#5CC46E', stroke: k, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    const ribs = Math.max(3, Math.round(f.a / 15));
    for (let i = 1; i < ribs; i++) { const a = a0 + (a1 - a0) * i / ribs, p = P(a); svg('path', { d: 'M0 0L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1), stroke: '#2E8B3E', 'stroke-width': 3 }, g); }
    svg('rect', { x: -8, y: -4, width: 16, height: 34, rx: 6, fill: '#C98B4A', stroke: k, 'stroke-width': 4 }, g);
    f.arc = svg('path', { d: 'M' + (P(a0)[0] * 0.32).toFixed(1) + ' ' + (P(a0)[1] * 0.32).toFixed(1) + 'A' + (R * 0.32) + ' ' + (R * 0.32) + ' 0 ' + (f.a > 180 ? 1 : 0) + ' 1 ' + (P(a1)[0] * 0.32).toFixed(1) + ' ' + (P(a1)[1] * 0.32).toFixed(1), fill: 'none', stroke: '#FFC93C', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0 }, g);
    s.style.pointerEvents = 'none';
    return s;
  },
  audit(q) {
    const as = q.fans.map(f => f.a), want = String(q.answer).split('-').map(Number);
    const good = q.ask === 'same' ? as.map((a, i) => (as.filter(b => b === a).length === 2 ? i : -1)).filter(i => i >= 0) : [as.indexOf(q.ask === 'big' ? Math.max(...as) : Math.min(...as))];
    const once = q.ask === 'same' || as.filter(a => a === as[good[0]]).length === 1;
    return { n: q.fans.length, pos: q.ask === 'same' ? want : q.answer, pick: q.ask === 'same' ? 2 : 1, err: once && good.join() === want.join() ? null : 'right ones ' + good };
  },
  /* five fans: one row between the watchers (landscape), 3 + 2 (portrait) */
  geo(st) { return K.L() ? { fr: { x: 20, y: 130, w: 984, h: 350 }, max: 240, gap: 14 } : { fr: { x: 16, y: 220, w: 672, h: 640 }, max: 250, gap: 18 }; },
  decor(G) { W3X.decor2(G, this.chars); },
  place(st) { const g = this.geo(st), P = W3X.grid(st.fanEls.length, g.fr, g.max, g.gap); st.fanEls.forEach((e, i) => place(e, P.pos[i].x, P.pos[i].y, P.w, P.w)); },
  /* an opening of `a` degrees drawn (dashed) on a fan, to compare */
  wedge(g, a, R, color) { const a0 = (-90 - a / 2) * Math.PI / 180, a1 = (-90 + a / 2) * Math.PI / 180, P = t => [(R * Math.cos(t)).toFixed(1), (R * Math.sin(t)).toFixed(1)], p0 = P(a0), p1 = P(a1); return svg('path', { d: 'M0 0L' + p0[0] + ' ' + p0[1] + 'A' + R + ' ' + R + ' 0 ' + (a > 180 ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1] + 'Z', fill: 'none', stroke: color, 'stroke-width': 7, 'stroke-dasharray': '12 8', 'stroke-linejoin': 'round' }, g); },
  /* after a wrong answer: the openings light up; his fan (blue) - its opening laid on the right fan (blue dashes) shows the
     right one opens more (less); the right one (gold) */
  async explain(st, ans) {
    const q = st.q, my = st, sel = String(ans).split('-').map(Number), right = String(q.answer).split('-').map(Number), gOf = i => st.fanEls[i] && st.fanEls[i].querySelector('svg > g');
    q.fans.forEach(f => { if (f.arc) f.arc.setAttribute('opacity', 1); });
    sel.filter(i => !right.includes(i)).forEach(i => W3X.mine(st, st.fanEls[i], 4));
    await st.scope.wait(T(900)); if (!Session.alive(my)) return;
    if (q.ask !== 'same') { const f = q.fans[sel[0]], r = q.fans[right[0]]; if (f && gOf(right[0])) this.wedge(gOf(right[0]), f.a, 100 * r.r, W3X.BLUE); }
    else if (sel.length === 2 && gOf(sel[1])) this.wedge(gOf(sel[1]), q.fans[sel[0]].a, 100 * q.fans[sel[1]].r, W3X.BLUE);
    await st.scope.wait(T(1400)); if (!Session.alive(my)) return;
    if (q.ask === 'same') this.wedge(gOf(right[1]), q.fans[right[0]].a, 100 * q.fans[right[1]].r, W3X.GOLD);
    right.forEach(i => W3X.gold(st, st.fanEls[i], 4));
    Sfx.reveal(); W3X.tell(q.ask === 'big' ? '这把张得最大！' : q.ask === 'small' ? '这把张得最小！' : '张得一样大！');
    await W3X.beat(st, 1600);
  },
  async present(st) {
    const q = st.q;
    st.sel = [];
    st.fanEls = q.fans.map((f, i) => { const e = W3X.card(st, 'card' + i, 5, 'card'); e.appendChild(this.fan(f)); return e; });
    this.place(st);
    st.fanEls.forEach((e, i) => K.pop(st, e, 90 * i));
    K.task(st, [[W3X.ic('<path d="M50 80L20 30A40 40 0 0 1 80 30Z" fill="#5CC46E" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/><path d="M38 64A16 16 0 0 1 62 64" fill="none" stroke="#FFC93C" stroke-width="7"/>')], ['q']]);
    K.say(st, q.ask === 'big' ? '哪把张得最大？' : q.ask === 'small' ? '哪把张得最小？' : '哪两把张得一样？');
  },
  onGesture(st, name, p) {
    const i = K.cardIndex(p.id); if (name !== 'tap' || i < 0 || st.picked) return false;
    if (st.q.ask !== 'same') { st.picked = true; Session.submit(st, i); return 'ok'; }
    if (st.sel.includes(i)) { st.sel = st.sel.filter(x => x !== i); st.fanEls[i].classList.remove('hi'); return 'ok'; }
    st.sel.push(i); st.fanEls[i].classList.add('hi'); Sfx.place();
    if (st.sel.length === 2) { st.picked = true; Session.submit(st, st.sel.slice().sort((a, b) => a - b).join('-')); }
    return 'ok';
  },
  async reveal(st) {
    const q = st.q; q.fans.forEach(f => { if (f.arc) f.arc.setAttribute('opacity', 1); });
    const idx = q.ask === 'same' ? q.answer.split('-').map(Number) : [q.answer];
    idx.forEach(i => { K.ring(st, [box(st.fanEls[i])], 4, '#FFC93C'); K.hop(st, st.fanEls[i], 14); });
    Sfx.reveal(); this.cheerAll(st); st.summary = q.ask === 'big' ? '这把张得最大！' : q.ask === 'small' ? '这把张得最小！' : '张得一样大！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1400);
  },
  async feedback(st, ans) { String(ans).split('-').map(Number).forEach(i => st.fanEls[i] && K.wiggle(st, st.fanEls[i])); W3X.say(st.q.ask === 'big' ? '还有张得更大的' : st.q.ask === 'small' ? '还有张得更小的' : '这两把不一样'); await st.scope.wait(600); },
  next(st, strat) {
    if (st.picked) return null;
    const q = st.q;
    if (q.ask === 'same') { const [a, b] = q.answer.split('-').map(Number); if (!st.sel.length) return { g: 'tap', p: { id: 'card' + a } }; return { g: 'tap', p: { id: 'card' + (strat === 'wrong' ? q.fans.findIndex((_, i) => i !== a && i !== b) : b) } }; }
    const i = strat === 'wrong' ? (q.answer + 1) % q.fans.length : q.answer; return { g: 'tap', p: { id: 'card' + i } };
  },
  workEls(st) { return st.fanEls || []; },
  snap(st) { return { ask: st.q.ask }; },
};

/* ================================================================ 西游记 S4 · 炉 Laojun's furnace: find the rule, what comes out (reasoning) */
const MFurnace = {
  kind0: 'furnace', verb: '炼！', intro: '炼丹炉变变变！', praise: ['规律找到啦！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const rules = [null, [1], [1, -1, 2], [2, -2, 3], [1, 2, 3, -1, -2], [3, 4, -3, -2]][d], k = bagPick(G, 'fu' + d, rules);
    const ne = d >= 4 ? 3 : 2, hi = d >= 5 ? 9 : 7;
    for (let t = 0; t < 300; t++) {
      const ins = rng.shuffle(Array.from({ length: hi }, (_, i) => i + 1)).slice(0, ne + 1);
      if (ins.some(x => x + k < 1 || x + k > (d >= 5 ? 13 : 10))) continue;
      const x = ins[ne], ex = ins.slice(0, ne).sort((a, b) => a - b).map(v => [v, v + k]);
      const ans = x + k, opts = numOptions(G, ans, 1, d >= 5 ? 13 : 10);
      if (!opts.includes(ans)) continue;
      return { k: [d, k, ins.join()], rule: k, ex, x, answer: ans, opts };
    }
    return { k: [d, 'x'], rule: 1, ex: [[1, 2], [3, 4]], x: 2, answer: 3, opts: [2, 3, 4] };
  },
  /* the numeral (when numerals are on) and the golden pills in rows of five */
  qty(n, h) {
    const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' });
    if (digits()) d.appendChild(UI.num(n, h * 0.62));
    const rows = Math.ceil(n / 5), r = 6.5, gap = 17, w = Math.min(5, n) * gap + 4, H = rows * gap + 4, s = svg('svg', { viewBox: '0 0 ' + w + ' ' + H, width: w * 1.15, height: H * 1.15 });
    s.style.flexShrink = '0';
    for (let i = 0; i < n; i++) svg('circle', { cx: 2 + gap / 2 + (i % 5) * gap, cy: 2 + gap / 2 + Math.floor(i / 5) * gap, r, fill: '#FFC93C', stroke: '#2B2118', 'stroke-width': 2.5 }, s);
    d.appendChild(s); return d;
  },
  geo(st) { const L = K.L(), m = st.q.ex.length + 1; return L ? { x: 400, y0: m === 4 ? 150 : 180, dy: m === 4 ? 118 : 140, bw: 214, bh: 96, fx: 400, cx: 850, cy: 380 } : { x: 352, y0: 280, dy: 128, bw: 214, bh: 100, cx: 352, cy: 860 }; },
  /* the five number cards: two columns on the right (landscape), one row at the bottom left of Wukong (portrait) */
  cardFr(L) { return (L == null ? K.L() : L) ? { x: 770, y: 110, w: 240, h: 580 } : { x: 16, y: 800, w: 560, h: 214 }; },
  audit(q) { return W3X.auditNum(q); },
  decor(G) { W2X.hideAll(G, this.chars); const L = K.L(), a = G.actors[this.chars[0]]; if (a && !L) showActor(a, 640, 1016, 120); },
  place(st) {
    const g = this.geo(st);
    st.rows.forEach((r, i) => { const y = g.y0 + i * g.dy; place(r.inE, g.x - 86 - g.bw, y - g.bh / 2, g.bw, g.bh); place(r.fur, g.x - 48, y - 52, 96, 96); place(r.outE, g.x + 86, y - g.bh / 2, g.bw, g.bh); place(r.arr, g.x - 84, y - 16, 168, 32); });
    if (st.cards) W3X.lay(st.cards, this.cardFr(), box(st.cards[0]).w, null, 14);
  },
  slot(st, q) { const e = W2X.thing(st, 10, 10, 4, ''); Object.assign(e.style, { borderRadius: '18px', background: q ? 'rgba(255,255,255,.55)' : '#FFF8EC', boxShadow: '0 0 0 4px #2B2118', display: 'flex', alignItems: 'center', justifyContent: 'center', border: q ? '4px dashed #2B2118' : '' }); return e; },
  async present(st) {
    const q = st.q, my = st;
    const rows = q.ex.concat([[q.x, null]]);
    st.rows = rows.map(([a, b]) => { const inE = this.slot(st, false), outE = this.slot(st, b == null), fur = K.item(Stage.el, 'assets/props/furnace.png', 96, 96), arr = W2X.thing(st, 210, 32, 3, ''); fur.style.zIndex = 5; st.els.push(fur); arr.innerHTML = '<svg viewBox="0 0 210 32" width="100%" height="100%"><path d="M4 16H206M190 4L206 16L190 28" fill="none" stroke="#2B2118" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="10 8"/></svg>'; inE.appendChild(this.qty(a, 56)); if (b == null) { outE.innerHTML = ICONS.q; outE.firstChild.setAttribute('width', 54); outE.firstChild.setAttribute('height', 54); } return { inE, outE, fur, arr, a, b }; });
    this.place(st);
    K.task(st, [['assets/props/furnace.png'], ['q']]);
    K.say(st, '看炼丹炉怎么变！');
    for (const r of st.rows) {
      if (!Session.alive(my)) return;
      K.pop(st, r.inE); await st.scope.wait(T(380));
      if (r.b == null) { K.pop(st, r.outE); continue; }
      st.scope.anim(r.fur, [{ transform: 'scale(1)' }, { transform: 'scale(1.15) rotate(-4deg)' }, { transform: 'scale(1)' }], { duration: T(500) + 1 }); Sfx.pop();
      await st.scope.wait(T(420)); r.outE.appendChild(this.qty(r.b, 56)); K.pop(st, r.outE); await st.scope.wait(T(500));
    }
    if (!Session.alive(my)) return;
    K.cards(st, q.opts, Object.assign({ layout: 'frame', size: W3X.size2(q.opts.length, [this.cardFr(true), this.cardFr(false)], 128, 14), gap: 14 }, { cx: this.geo(st).cx, cy: this.geo(st).cy }));
    this.place(st);
    W3X.say2(st, '放进' + CNQ(q.x) + '个，', '出来几个？');
  },
  onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
  async reveal(st) {
    const q = st.q, r = st.rows[st.rows.length - 1];
    st.scope.anim(r.fur, [{ transform: 'scale(1)' }, { transform: 'scale(1.2) rotate(5deg)' }, { transform: 'scale(1)' }], { duration: 600 });
    r.outE.innerHTML = ''; r.outE.style.border = ''; r.outE.style.background = '#FFF3C4'; r.outE.appendChild(this.qty(q.answer, 56)); K.pop(st, r.outE);
    st.rows.slice(0, -1).forEach(x => K.hop(st, x.outE, 10));
    Sfx.reveal(); this.cheerAll(st);
    st.summary = q.rule > 0 ? '每次多' + CNQ(q.rule) + '个！' : '每次少' + CNQ(-q.rule) + '个！';
    Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
  },
  async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(W2Say.notN(ans)); await st.scope.wait(400); },
  /* after a wrong answer: his card (blue); the furnace's rule again - what went in and came out before hops, row by row -
     and the last pills come out; the right card (gold) */
  async explain(st, ans) {
    const q = st.q;
    await W3X.explainCards(st, ans, { show: async () => {
      for (const x of st.rows.slice(0, -1)) { if (!Session.alive(st)) return; K.hop(st, x.inE, 10); K.hop(st, x.outE, 10); await st.scope.wait(T(380)); }
      const r = st.rows[st.rows.length - 1]; st.scope.anim(r.fur, [{ transform: 'scale(1)' }, { transform: 'scale(1.2) rotate(5deg)' }, { transform: 'scale(1)' }], { duration: 600 });
      r.outE.innerHTML = ''; r.outE.style.border = ''; r.outE.style.background = '#FFF3C4'; r.outE.appendChild(this.qty(q.answer, 56)); K.pop(st, r.outE);
      await st.scope.wait(T(500));
    }, line: q.rule > 0 ? '每次多' + CNQ(q.rule) + '个！' : '每次少' + CNQ(-q.rule) + '个！' });
  },
  next(st, strat) { return st.picked || !st.cards ? null : K.cardNext(st, strat); },
  workEls(st) { return st.cards || []; },
  snap(st) { return { rule: st.q.rule }; },
};

/* ================================================================ 复仇者 T1 · 分拣机 the sorting machine: follow the yes / no signs */
/* Five options (client 2026-10-10): with two or three boxes there are only 2-3 possible answers, so two things go down one
   after the other and both must be right (一题两问: guessing gets 1/4 or 1/9); with more signs the machine has five boxes;
   "who lands here" offers five things */
const MSorter = {
  kind0: 'sorter', verb: '分！', intro: '分拣机开动啦！', praise: ['一步一步想对啦！'],
  tests: [{ a: 'c', v: 0 }, { a: 's', v: 1 }, { a: 'k', v: 'circle' }],
  trees: {
    1: { n: { g0: [50, 18], b0: [27, 86], b1: [73, 86] }, kids: { g0: ['b0', 'b1'] }, bins: ['b0', 'b1'] },
    3: { n: { g0: [50, 16], g1: [27, 48], b0: [13, 86], b1: [41, 86], b2: [73, 86] }, kids: { g0: ['g1', 'b2'], g1: ['b0', 'b1'] }, bins: ['b0', 'b1', 'b2'] },
    5: { n: { g0: [50, 14], g1: [20, 42], g2: [60, 42], g3: [80, 64], b0: [10, 88], b1: [30, 88], b2: [50, 88], b3: [70, 88], b4: [90, 88] }, kids: { g0: ['g1', 'g2'], g1: ['b0', 'b1'], g2: ['b2', 'g3'], g3: ['b3', 'b4'] }, bins: ['b0', 'b1', 'b2', 'b3', 'b4'] },
  },
  truth(t, it) { return t.a === 'c' ? it.c === t.v : t.a === 's' ? it.s === t.v : it.k === t.v; },
  ask(t) { return t.a === 'c' ? '是红色的吗？' : t.a === 's' ? '是大的吗？' : '是圆的吗？'; },      /* what a sign asks (R9-2) */
  route(q, it) { const T = this.trees[q.tree]; let n = 'g0'; const path = [n]; while (n[0] === 'g') { n = T.kids[n][this.truth(q.gates[n], it) ? 0 : 1]; path.push(n); } return path; },
  binOf(q, it) { return this.trees[q.tree].bins.indexOf(this.route(q, it).slice(-1)[0]); },
  ALL: [0, 1].flatMap(c => [0, 1].flatMap(s => ['circle', 'sq'].map(k => ({ c, s, k })))),
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const tree = d <= 2 ? 1 : d === 3 ? 3 : 5, T = this.trees[tree];
    const gates = {};
    const pickT = ex => rng.pick(this.tests.filter(t => !ex.includes(t.a)));
    gates.g0 = d === 1 ? this.tests[0] : d === 2 ? rng.pick(this.tests.slice(1)) : pickT([]);
    if (T.kids.g0[0] === 'g1') gates.g1 = pickT([gates.g0.a]);
    if (T.kids.g0[1] === 'g2') gates.g2 = pickT([gates.g0.a]);
    if (T.kids.g2 && T.kids.g2[1] === 'g3') gates.g3 = pickT([gates.g0.a, gates.g2.a]);
    const q = { tree, gates }, nb = T.bins.length, of = b => rng.shuffle(this.ALL.filter(x => this.binOf(q, x) === b));
    if (d <= 3) {                        /* two things, the boxes they fall into dealt from a bag (each pair of boxes as often) */
      const pairs = []; for (let a = 0; a < nb; a++) for (let b = 0; b < nb; b++) pairs.push(a + ',' + b);
      const want = bagPick(G, 'sop' + tree, pairs).split(',').map(Number), i1 = of(want[0])[0], i2 = of(want[1]).find(x => x !== i1) || of(want[1])[0];
      if (!i1 || !i2) return this.gen(G, Object.assign({}, o, { level: 4 }));
      return { k: [d, JSON.stringify(gates), JSON.stringify([i1, i2])], mode: 'two', tree, gates, its: [i1, i2], answer: want.join(',') };
    }
    if (d === 4) { const b = bagPick(G, 'sob', [0, 1, 2, 3, 4]), it = of(b)[0]; return { k: [d, JSON.stringify(gates), JSON.stringify(it)], mode: 'where', tree, gates, it, answer: b }; }
    /* who lands in the gold box: one thing that does, four that do not */
    const tgt = bagPick(G, 'sot', [0, 1, 2, 3, 4]), right = of(tgt)[0], others = rng.shuffle(this.ALL.filter(x => this.binOf(q, x) !== tgt)).slice(0, 4);
    const items = W3X.deal(G, right, others, 'so');
    return { k: [d, JSON.stringify(gates), JSON.stringify(items)], mode: 'who', tree, gates, items, target: tgt, answer: items.indexOf(right) };
  },
  audit(q) {
    if (q.mode === 'two') { const b = q.its.map(x => this.binOf(q, x)); return { two: true, n: this.trees[q.tree].bins.length, pos: b, err: b.join(',') === q.answer ? null : 'bins ' + b }; }
    if (q.mode === 'where') return { n: this.trees[q.tree].bins.length, pos: q.answer, err: this.binOf(q, q.it) === q.answer ? null : 'bin' };
    const good = q.items.map((x, i) => (this.binOf(q, x) === q.target ? i : -1)).filter(i => i >= 0);
    return { n: q.items.length, pos: q.answer, err: good.length === 1 && good[0] === q.answer && new Set(q.items.map(x => JSON.stringify(x))).size === q.items.length ? null : 'landing ' + good };
  },
  itemSvg(it, size) { const s = svg('svg', { viewBox: '0 0 100 100', width: size, height: size }), r = it.s ? 34 : 20, c = it.c ? '#4F7BFF' : '#E8414B'; if (it.k === 'circle') svg('circle', { cx: 50, cy: 50, r, fill: c, stroke: '#2B2118', 'stroke-width': 5 }, s); else svg('rect', { x: 50 - r, y: 50 - r, width: 2 * r, height: 2 * r, rx: 4, fill: c, stroke: '#2B2118', 'stroke-width': 5 }, s); s.style.pointerEvents = 'none'; return s; },
  gateSvg(t) {
    const s = svg('svg', { viewBox: '0 0 100 100', width: '100%', height: '100%' }), k = W2X.ink;
    svg('polygon', { points: '50,4 96,50 50,96 4,50', fill: '#FFF8EC', stroke: k, 'stroke-width': 5, 'stroke-linejoin': 'round' }, s);
    if (t.a === 'c') svg('circle', { cx: 50, cy: 50, r: 18, fill: '#E8414B', stroke: k, 'stroke-width': 4 }, s);
    else if (t.a === 's') { svg('circle', { cx: 42, cy: 52, r: 20, fill: '#9AA3AF', stroke: k, 'stroke-width': 4 }, s); svg('circle', { cx: 72, cy: 60, r: 7, fill: 'none', stroke: k, 'stroke-width': 3, 'stroke-dasharray': '3 3' }, s); }
    else svg('circle', { cx: 50, cy: 50, r: 20, fill: 'none', stroke: k, 'stroke-width': 7 }, s);
    s.style.pointerEvents = 'none';
    return s;
  },
  geo(st) { const L = K.L(); return L ? { x: 210, y: 150, w: 600, h: 500, ix: 512, iy: 120 } : { x: 40, y: 260, w: 624, h: 580, ix: 352, iy: 226 }; },
  /* the five things ("who lands here"): a column right of the machine (landscape), a row under it (portrait) */
  cardFr(L) { return (L == null ? K.L() : L) ? { x: 830, y: 100, w: 190, h: 590 } : { x: 16, y: 876, w: 672, h: 140 }; },
  binWH(st) { return st.q.tree === 5 ? [104, 92] : [136, 108]; },
  decor(G) { W2X.hideAll(G, this.chars); },
  P(st, n) { const g = this.geo(st), p = this.trees[st.q.tree].n[n]; return [g.x + p[0] / 100 * g.w, g.y + p[1] / 100 * g.h]; },
  place(st) {
    const g = this.geo(st), [bw, bh] = this.binWH(st);
    place(st.wires, g.x, g.y, g.w, g.h);
    Object.keys(st.nodes).forEach(n => { const p = this.P(st, n), e = st.nodes[n]; if (n[0] === 'g') place(e, p[0] - 54, p[1] - 54, 108, 108); else place(e, p[0] - bw / 2, p[1] - bh / 2, bw, bh); });
    if (st.itemEl && !st.itemEl._moved) place(st.itemEl, g.ix - 46, g.iy - 46, 92, 92);
    (st.parked || []).forEach((o, k) => { if (o.e._moved) return; const p = this.P(st, this.trees[st.q.tree].bins[o.bin]); place(o.e, p[0] - 30 + (k ? 18 : -18), p[1] - bh / 2 - 34, 60, 60); });
    (st.marks || []).forEach(o => { const x = g.x + (o.a[0] + o.b[0]) / 2 / 100 * g.w, y = g.y + o.a[1] / 100 * g.h; place(o.m, x - 20, y - 20, 40, 40); });
    if (st.cards) W3X.lay(st.cards, this.cardFr(), box(st.cards[0]).w, null, 12);
  },
  async present(st) {
    const q = st.q, T = this.trees[q.tree];
    st.wires = W2X.thing(st, 10, 10, 2, ''); const s = svg('svg', { viewBox: '0 0 100 100', width: '100%', height: '100%', preserveAspectRatio: 'none' }); st.wires.appendChild(s);
    Object.keys(T.kids).forEach(gn => T.kids[gn].forEach((c, j) => { const a = T.n[gn], b = T.n[c]; svg('path', { d: 'M' + a[0] + ' ' + a[1] + 'H' + b[0] + 'V' + b[1], fill: 'none', stroke: j ? '#E8414B' : '#3FA34D', 'stroke-width': 1.6, 'stroke-dasharray': '2.5 1.6' }, s); }));
    st.marks = [];
    Object.keys(T.kids).forEach(gn => T.kids[gn].forEach((c, j) => { const a = T.n[gn], b = T.n[c], m = W2X.thing(st, 40, 40, 5, ''); m.innerHTML = j ? '<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="17" fill="#E8414B" stroke="#2B2118" stroke-width="3"/><path d="M13 13L27 27M27 13L13 27" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>' : '<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="17" fill="#3FA34D" stroke="#2B2118" stroke-width="3"/><path d="M11 21L18 28L30 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; st.marks.push({ m, a, b, g: gn, c }); }));
    st.nodes = {};
    Object.keys(T.n).forEach(n => {
      if (n[0] === 'g') { const e = W2X.thing(st, 88, 88, 4, ''); e.appendChild(this.gateSvg(q.gates[n])); K.reg(st, 'gate_' + n, e, {}); st.nodes[n] = e; }
      else { const i = T.bins.indexOf(n), e = W3X.card(st, q.mode === 'who' ? null : 'bin' + i, 4, ''); e.innerHTML = '<svg viewBox="0 0 120 96" width="100%" height="100%"><path d="M8 18H112L102 90H18Z" fill="' + ['#FFC93C', '#4FB3FF', '#B57BFF', '#5CC46E', '#FF9F43'][i] + '" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/><path d="M4 12H116V22H4Z" fill="#2B2118"/></svg>'; if (q.mode === 'who' && i === q.target) { e.style.boxShadow = '0 0 0 6px #FFC93C, 0 0 24px 8px rgba(255,201,60,.8)'; e.style.borderRadius = '14px'; } st.nodes[n] = e; }
    });
    if (q.mode !== 'who') { st.step = 0; st.parked = []; st.itemEl = W2X.thing(st, 80, 80, 7, ''); st.itemEl.appendChild(this.itemSvg(q.mode === 'two' ? q.its[0] : q.it, '100%')); }
    else W2X.cards(st, q.items.map(x => this.itemSvg(x, '84%')), q.items.map((_, i) => i), { size: W3X.size2(q.items.length, [this.cardFr(true), this.cardFr(false)], 120, 12), gap: 12, cx: 352, cy: 935 });
    this.place(st);
    Object.values(st.nodes).forEach((e, i) => K.pop(st, e, 60 * i));
    K.task(st, [[W3X.ic('<polygon points="50,8 88,46 50,84 12,46" fill="#FFF8EC" stroke="#2B2118" stroke-width="5"/><circle cx="50" cy="46" r="14" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><circle cx="18" cy="88" r="9" fill="#3FA34D"/><circle cx="82" cy="88" r="9" fill="#E8414B"/>')], ['q']]);
    if (!st.G.toldGate) { st.G.toldGate = true; W3X.tip('是就走绿色，'); W3X.tip('不是走红色！'); await st.scope.guard(Voice.afterSay(80)); if (!Session.alive(st)) return; }   /* the queue keeps three sentences (R10-1) */
    W3X.say2(st, this.ask(q.gates.g0), q.mode === 'who' ? '谁会掉进这里？' : '它会掉进哪个箱子？');
    st.lead = ['是就走绿色，', '不是走红色！'];          /* replay and hints say the rule again (R11-3); a tap on a sign says its question */
  },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || st.picked) return false;
    if (id.startsWith('gate_')) { const n = id.slice(5); Voice.sayNow(this.ask(st.q.gates[n]), { tag: 'hint1' }); K.hop(st, st.nodes[n], 12); return 'ok'; }
    if (st.q.mode === 'who') return W3X.tapCards(st, name, p);
    if (!/^bin\d$/.test(id)) return false;
    const i = Number(id.slice(3));
    if (st.q.mode === 'two' && st.step === 0) {        /* the first thing goes on the box he chose; then the second one comes */
      st.step = 1; st.got = [i]; st.parked.push({ e: st.itemEl, bin: i }); st.itemEl = W2X.thing(st, 80, 80, 7, ''); st.itemEl.appendChild(this.itemSvg(st.q.its[1], '100%'));
      this.place(st); K.pop(st, st.itemEl); Sfx.place(); K.say(st, '这个呢？'); return 'ok';
    }
    st.picked = true;
    if (st.q.mode === 'two') { st.got.push(i); st.parked.push({ e: st.itemEl, bin: i }); st.itemEl = null; this.place(st); Sfx.place(); Session.submit(st, st.got.join(',')); return 'ok'; }
    Session.submit(st, i); return 'ok';
  },
  /* a thing goes down from the top along the signs; each sign's answer (the branch it takes) lights up */
  async fall(st, it, e, voice, ms) {
    const q = st.q, my = st, g = this.geo(st), path = this.route(q, it);
    e.style.zIndex = 9; e._moved = true; e.getAnimations().forEach(a => a.cancel()); e.style.transform = ''; place(e, g.ix - 46, g.iy - 46, 92, 92);
    for (let k = 0; k < path.length; k++) {
      const n = path[k]; if (!Session.alive(my)) return; const p = this.P(st, n); await K.flyTo(st, e, p[0] - 46, p[1] - 46 - (n[0] === 'b' ? 10 : 0), ms || 340, 10); Sfx.place();
      if (n[0] === 'g') { const t = q.gates[n], y = this.truth(t, it), mk = st.marks.find(m => m.g === n && m.c === path[k + 1]); K.hop(st, st.nodes[n], 10); if (mk) K.hop(st, mk.m, 14); if (voice) { Voice.say(this.ask(t), { tag: 'summary' }); Voice.say(y ? '是！' : '不是！', { tag: 'summary' }); await st.scope.guard(Voice.afterSay(120)); } else await st.scope.wait(T(160)); }
    }
  },
  async reveal(st) {
    const q = st.q, my = st, TR = this.trees[q.tree];
    if (q.mode === 'two') {
      for (let k = 0; k < 2; k++) { if (!Session.alive(my)) return; await this.fall(st, q.its[k], st.parked[k].e, false, 260); K.ring(st, [box(st.nodes[TR.bins[st.got[k]]])], 4, W3X.GOLD); }
      Sfx.reveal(); this.cheerAll(st); st.summary = '都掉对啦！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100); return;
    }
    const it = q.mode === 'where' ? q.it : q.items[q.answer];
    let e = st.itemEl; if (!e) { e = W2X.thing(st, 80, 80, 7, ''); e.appendChild(this.itemSvg(it, '100%')); }
    await this.fall(st, it, e, true); if (!Session.alive(my)) return;
    Sfx.reveal(); this.cheerAll(st); st.summary = q.mode === 'where' ? '掉进这个箱子！' : '它掉进这里！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
  },
  say(t, it) { const y = this.truth(t, it); return t.a === 'c' ? (y ? '它是红色的' : '它不是红色的') : t.a === 's' ? (y ? '它是大的' : '它是小的') : (y ? '它是圆的' : '它不是圆的'); },
  /* the first sign where the thing goes the other way than the box he chose */
  why(q, it, wantBin) {
    const TR = this.trees[q.tree], truePath = this.route(q, it);
    const toBin = b => { const path = ['g0']; let n = 'g0'; while (n[0] === 'g') { const kids = TR.kids[n], sub = x => x === b || (x[0] === 'g' && TR.kids[x].some(y => y === b || (y[0] === 'g' && TR.kids[y].includes(b)))); n = sub(kids[0]) ? kids[0] : kids[1]; path.push(n); } return path; };
    const want = toBin(wantBin), i = want.findIndex((n, k) => truePath[k] !== n), gate = want[Math.max(0, i - 1)];
    return this.say(q.gates[gate] || q.gates.g0, it);
  },
  async feedback(st, ans) {
    const q = st.q, TR = this.trees[q.tree];
    let it, wantBin;
    if (q.mode === 'two') { const got = String(ans).split(',').map(Number), k = q.its.findIndex((x, j) => this.binOf(q, x) !== got[j]); it = q.its[Math.max(0, k)]; wantBin = TR.bins[got[Math.max(0, k)]]; if (st.nodes[wantBin]) K.wiggle(st, st.nodes[wantBin]); }
    else if (q.mode === 'where') { it = q.it; wantBin = TR.bins[ans]; if (st.nodes[wantBin]) K.wiggle(st, st.nodes[wantBin]); }
    else { it = q.items[ans]; wantBin = TR.bins[q.target]; if (st.cards[ans]) K.wiggle(st, st.cards[ans]); }
    W3X.say(this.why(q, it, wantBin)); await st.scope.wait(700);
  },
  /* after a wrong answer: the thing that went wrong goes down along the signs from the top - every sign's answer lights up
     - to the box it really falls into (gold); the box he chose (blue). "Who lands here": his thing goes down (to another
     box, blue), then the right one (into the gold box) */
  async explain(st, ans) {
    const q = st.q, my = st, TR = this.trees[q.tree];
    if (q.mode === 'who') {
      const mine = q.items[ans]; if (st.cards[ans]) W3X.mine(st, st.cards[ans], 4);
      const e1 = W2X.thing(st, 80, 80, 9, ''); e1.appendChild(this.itemSvg(mine, '100%'));
      await this.fall(st, mine, e1, false, 300); if (!Session.alive(my)) return;
      W3X.ringAt(st, box(st.nodes[TR.bins[this.binOf(q, mine)]]), W3X.BLUE, 4);
      await st.scope.wait(T(900)); if (!Session.alive(my)) return;
      const e2 = W2X.thing(st, 80, 80, 9, ''); e2.appendChild(this.itemSvg(q.items[q.answer], '100%'));
      W3X.gold(st, st.cards[q.answer], 4, 0);
      await this.fall(st, q.items[q.answer], e2, false, 300); if (!Session.alive(my)) return;
      W3X.ringAt(st, box(st.nodes[TR.bins[q.target]]), W3X.GOLD, 6); Sfx.reveal(); W3X.tell('它掉进这里！');
      await W3X.beat(st, 1500); return;
    }
    const its = q.mode === 'two' ? q.its : [q.it], got = q.mode === 'two' ? String(ans).split(',').map(Number) : [ans], els = q.mode === 'two' ? st.parked.map(o => o.e) : [st.itemEl];
    for (let k = 0; k < its.length; k++) {
      const right = this.binOf(q, its[k]); if (got[k] === right || !els[k]) continue;
      if (!Session.alive(my)) return;
      W3X.mine(st, st.nodes[TR.bins[got[k]]], 4);
      await this.fall(st, its[k], els[k], false, 320); if (!Session.alive(my)) return;
      W3X.ringAt(st, box(st.nodes[TR.bins[right]]), W3X.GOLD, 6);
      await st.scope.wait(T(500));
    }
    Sfx.reveal(); W3X.tell('掉进这个箱子！');
    await W3X.beat(st, 1500);
  },
  next(st, strat) {
    if (st.picked) return null;
    const q = st.q, nb = this.trees[q.tree].bins.length;
    if (q.mode === 'who') { if (!st.cards) return null; const i = strat === 'wrong' ? (q.answer + 1) % q.items.length : q.answer; return { g: 'tap', p: { id: 'card' + i } }; }
    if (q.mode === 'two') { const want = q.answer.split(',').map(Number)[st.step || 0]; return { g: 'tap', p: { id: 'bin' + (strat === 'wrong' && !st.step ? (want + 1) % nb : want) } }; }
    const i = strat === 'wrong' ? (q.answer + 1) % nb : q.answer; return { g: 'tap', p: { id: 'bin' + i } };
  },
  workEls(st) { return st.q.mode === 'who' ? (st.cards || []) : this.trees[st.q.tree].bins.map(b => st.nodes[b]); },
  gestureHint(st) { if (st.nodes) K.flash(st, [st.nodes.g0]); },
  snap(st) { return { mode: st.q.mode, tree: st.q.tree, step: st.step || 0 }; },
};

/* ================================================================ 复仇者 T2 · 战甲 how many different suits from helmets x bodies (combinations) */
const SUIT_COL = ['#E8414B', '#FFC93C', '#4F7BFF', '#5CC46E', '#B57BFF'];
const MSuits = {
  kind0: 'suits', verb: '换！', intro: '换战甲！', praise: ['一种都不漏！'],
  gen(G, o) {
    const d = Math.min(5, o.level), rng = o.rng;
    const [H, B, F] = [null, [2, 2, 0], [3, 2, 0], [2, 3, 0], [3, 3, 0], [2, 2, 2]][d];
    const cols = rng.shuffle([0, 1, 2, 3, 4]);
    const total = H * B * (F || 1);
    return { k: [d, cols.join('')], H, B, F, hc: cols.slice(0, H), bc: rng.shuffle(cols.slice()).slice(0, B), fc: F ? rng.shuffle(cols.slice()).slice(0, F) : [], answer: total, opts: numOptions(G, total, 2, 12) };
  },
  audit(q) { return W3X.auditNum(q); },
  /* the five number cards: a column on the right (landscape), a row at the bottom (portrait) */
  cardFr(L) { return (L == null ? K.L() : L) ? { x: 818, y: 110, w: 196, h: 580 } : { x: 16, y: 836, w: 672, h: 176 }; },
  suit(h, b, f, size) {
    const s = svg('svg', { viewBox: '0 0 100 150', width: size, height: typeof size === 'number' ? size * 1.5 : size }), k = W2X.ink;
    s.innerHTML = '<g stroke="' + k + '" stroke-width="4" stroke-linejoin="round">'
      + '<rect x="34" y="98" width="13" height="40" rx="5" fill="#9AA3AF"/><rect x="53" y="98" width="13" height="40" rx="5" fill="#9AA3AF"/>'
      + (f != null ? '<rect x="29" y="122" width="20" height="20" rx="5" fill="' + f + '"/><rect x="51" y="122" width="20" height="20" rx="5" fill="' + f + '"/>' : '')
      + '<rect x="14" y="54" width="14" height="40" rx="6" fill="' + b + '"/><rect x="72" y="54" width="14" height="40" rx="6" fill="' + b + '"/>'
      + '<path d="M28 50H72L68 104H32Z" fill="' + b + '"/><circle cx="50" cy="70" r="8" fill="#BFF3FF"/>'
      + '<path d="M30 30Q30 8 50 8Q70 8 70 30V44Q50 54 30 44Z" fill="' + h + '"/><path d="M38 26H62V36Q50 40 38 36Z" fill="#BFF3FF"/></g>';
    s.style.pointerEvents = 'none';
    return s;
  },
  geo(st) { const L = K.L(); return L ? { mx: 512, my: 380, ms: 190, hx: 300, bx: 724, py: [250, 370, 490], fy: 600, cam: [300, 600], strip: [512, 140], cards: [890, 300] } : { mx: 352, my: 470, ms: 180, hx: 120, bx: 584, py: [380, 490, 600], fy: 740, cam: [120, 740], strip: [352, 228], cards: [352, 900] }; },
  decor(G) { W2X.hideAll(G, this.chars); },
  place(st) {
    const g = this.geo(st), q = st.q;
    place(st.man, g.mx - g.ms / 2, g.my - g.ms * 0.75, g.ms, g.ms * 1.5);
    st.hb.forEach((e, i) => place(e, g.hx - 46, g.py[i] - 46, 92, 92));
    st.bb.forEach((e, i) => place(e, g.bx - 46, g.py[i] - 46, 92, 92));
    st.fb.forEach((e, i) => place(e, g.mx - 104 + i * 116, g.fy - 46, 92, 92));
    place(st.cam, g.cam[0] - 50, g.cam[1] - 46, 100, 92);
    if (st.grid) { const q = st.q, cols = q.B * (q.F || 1), rows = q.H, w = K.L() ? 84 : 92, h = w * 1.3, cx = K.L() ? 512 : 352, cy = K.L() ? 360 : 520; st.photos.forEach((o, i) => place(o.e, cx - (cols * (w + 10)) / 2 + (i % cols) * (w + 10), cy - (rows * (h + 10)) / 2 + Math.floor(i / cols) * (h + 10), w, h)); }
    else { const n = st.photos.length, w = 62; st.photos.forEach((o, i) => place(o.e, g.strip[0] - (Math.max(n, 1) * (w + 6)) / 2 + i * (w + 6), g.strip[1] - 40, w, 80)); }
    if (st.cards) W3X.lay(st.cards, this.cardFr(), box(st.cards[0]).w, null, 12);
    void q;
  },
  render(st) { const q = st.q; st.man.innerHTML = ''; st.man.appendChild(this.suit(SUIT_COL[q.hc[st.cur.h]], SUIT_COL[q.bc[st.cur.b]], q.F ? SUIT_COL[q.fc[st.cur.f]] : null, '100%')); },
  swatch(st, id, col, kind) { const e = W3X.card(st, id, 5, 'card'); e.innerHTML = '<svg viewBox="0 0 60 60" width="80%" height="80%">' + (kind === 'h' ? '<path d="M12 34Q12 8 30 8Q48 8 48 34V44Q30 54 12 44Z" fill="' + col + '" stroke="#2B2118" stroke-width="4"/><path d="M20 28H40V36Q30 40 20 36Z" fill="#BFF3FF" stroke="#2B2118" stroke-width="3"/>' : kind === 'b' ? '<path d="M14 10H46L42 52H18Z" fill="' + col + '" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/><circle cx="30" cy="26" r="6" fill="#BFF3FF" stroke="#2B2118" stroke-width="3"/>' : '<rect x="8" y="22" width="20" height="24" rx="5" fill="' + col + '" stroke="#2B2118" stroke-width="4"/><rect x="32" y="22" width="20" height="24" rx="5" fill="' + col + '" stroke="#2B2118" stroke-width="4"/>') + '</svg>'; return e; },
  async present(st) {
    const q = st.q;
    st.cur = { h: 0, b: 0, f: 0 }; st.photos = [];
    st.man = W2X.thing(st, 10, 10, 4, ''); this.render(st);
    st.hb = q.hc.map((c, i) => this.swatch(st, 'h' + i, SUIT_COL[c], 'h'));
    st.bb = q.bc.map((c, i) => this.swatch(st, 'b' + i, SUIT_COL[c], 'b'));
    st.fb = q.fc.map((c, i) => this.swatch(st, 'f' + i, SUIT_COL[c], 'f'));
    st.cam = W3X.card(st, 'cam', 5, 'card'); st.cam.innerHTML = '<svg viewBox="0 0 80 70" width="78%" height="78%"><rect x="6" y="18" width="68" height="44" rx="10" fill="#4F7BFF" stroke="#2B2118" stroke-width="5"/><rect x="26" y="8" width="26" height="14" rx="4" fill="#4F7BFF" stroke="#2B2118" stroke-width="5"/><circle cx="40" cy="40" r="13" fill="#BFF3FF" stroke="#2B2118" stroke-width="5"/></svg>';
    K.cards(st, q.opts, Object.assign({ layout: 'frame', size: W3X.size2(q.opts.length, [this.cardFr(true), this.cardFr(false)], 126, 12), gap: 12 }, { cx: this.geo(st).cards[0], cy: this.geo(st).cards[1] }));
    this.place(st);
    K.pop(st, st.man);
    K.task(st, [[W3X.ic('<path d="M22 40Q22 14 40 14Q58 14 58 40V50Q40 60 22 50Z" fill="#E8414B" stroke="#2B2118" stroke-width="5"/><path d="M62 54H82L80 92H64Z" fill="#4F7BFF" stroke="#2B2118" stroke-width="5"/>')], ['q']]);
    K.say(st, '能拼出几种战甲？');
    if (!st.G.toldCam) { st.G.toldCam = true; W3X.tip('换一换，拍下来！'); }
  },
  comboKey(c) { return c.h + '' + c.b + c.f; },
  onGesture(st, name, p) {
    const id = p.id || ''; if (name !== 'tap' || st.picked) return false;
    if (K.cardIndex(id) >= 0) return W3X.tapCards(st, name, p);
    const m = /^([hbf])(\d)$/.exec(id);
    if (m) { st.cur[m[1]] = Number(m[2]); this.render(st); K.pop(st, st.man); Sfx.place(); return 'ok'; }
    if (id === 'cam') {
      const k = this.comboKey(st.cur);
      if (st.photos.some(o => o.k === k)) { K.wiggle(st, st.cam); Voice.say('这套拍过啦', { tag: 'hint1' }); return 'ok'; }
      const e = W2X.thing(st, 62, 80, 6, ''); Object.assign(e.style, { background: '#FFF8EC', borderRadius: '8px', boxShadow: '0 0 0 3px #2B2118' }); e.appendChild(this.suit(SUIT_COL[st.q.hc[st.cur.h]], SUIT_COL[st.q.bc[st.cur.b]], st.q.F ? SUIT_COL[st.q.fc[st.cur.f]] : null, '100%'));
      st.photos.push({ k, e }); this.place(st); K.pop(st, e); Sfx.mar(1568, 0, 0.2, 0.4); Fx.burst(center(st.cam).x, center(st.cam).y, { n: 8, dist: 40 });
      return 'ok';
    }
    return false;
  },
  async reveal(st) {
    await this.showAll(st, false); if (!Session.alive(st)) return;
    Sfx.reveal(); st.summary = '一共' + CNQ(st.q.answer) + '种！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
  },
  /* after a wrong answer: his card (blue); every suit there is, laid out and counted (the cards stay); the right card (gold) */
  async explain(st, ans) { await W3X.explainCards(st, ans, { show: () => this.showAll(st, true), line: '一共' + CNQ(st.q.answer) + '种！' }); },
  /* every suit, a photo each, in rows (one row per helmet), counted */
  async showAll(st, keepCards) {
    const q = st.q, my = st;
    const all = []; for (let h = 0; h < q.H; h++) for (let b = 0; b < q.B; b++) for (let f = 0; f < (q.F || 1); f++) all.push({ h, b, f });
    st.photos.forEach(o => o.e.remove()); st.photos = []; st.grid = true;
    [st.man, st.cam].concat(st.hb, st.bb, st.fb, keepCards ? [] : st.cards || []).forEach(e => { if (e) e.style.visibility = 'hidden'; });
    all.forEach(c => { const e = W2X.thing(st, 62, 80, 6, ''); Object.assign(e.style, { background: '#FFF8EC', borderRadius: '8px', boxShadow: '0 0 0 3px #2B2118' }); e.appendChild(this.suit(SUIT_COL[q.hc[c.h]], SUIT_COL[q.bc[c.b]], q.F ? SUIT_COL[q.fc[c.f]] : null, '100%')); st.photos.push({ k: this.comboKey(c), e }); });
    this.place(st);
    st.photos.forEach(o => { o.e.style.visibility = 'hidden'; o.e.style.zIndex = 9; });
    for (let i = 0; i < st.photos.length; i++) { if (!Session.alive(my)) return; st.photos[i].e.style.visibility = ''; K.pop(st, st.photos[i].e); await Count.beat(st.scope, 400, i + 1); }
  },
  async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CNQ(ans) + '种'); await st.scope.wait(500); },
  next(st, strat) { return st.picked ? null : K.cardNext(st, strat); },
  workEls(st) { return (st.hb || []).concat(st.bb || [], [st.cam]).filter(Boolean); },
  gestureHint(st) { if (st.hb) K.flash(st, [st.hb[1] || st.hb[0], st.cam]); },
  snap(st) { return { photos: (st.photos || []).length }; },
};

/* ================================================================ 复仇者 T3 · 射 Hawkeye's arrows fly straight: which target can be hit */
const MArrows = {
  kind0: 'arrows', verb: '射！', intro: '鹰眼射箭！', praise: ['看得真准！'],
  B: [9, 60],
  hits(a, b, r, m) {                             /* does the segment a-b pass through rect r grown by m (Liang-Barsky) */
    const x0 = r.x - m, x1 = r.x + r.w + m, y0 = r.y - m, y1 = r.y + r.h + m, dx = b[0] - a[0], dy = b[1] - a[1];
    let t0 = 0, t1 = 1; const p = [-dx, dx, -dy, dy], q = [a[0] - x0, x1 - a[0], a[1] - y0, y1 - a[1]];
    for (let i = 0; i < 4; i++) { if (p[i] === 0) { if (q[i] < 0) return false; } else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } }
    return t0 <= t1;
  },
  gen(G, o) {
    /* five targets (client: five options); the walls are more as fewer targets may be hit */
    const d = Math.min(5, o.level), rng = o.rng, n = 5, no = [0, 3, 3, 4, 4, 2][d], ask = d === 5 ? 'cant' : 'can';
    for (let t = 0; t < 3000; t++) {
      const tg = []; for (let k = 0; k < 200 && tg.length < n; k++) { const p = [rng.int(68, 93), rng.int(10, 90)]; if (tg.every(x => Math.abs(x[1] - p[1]) >= 19 || Math.abs(x[0] - p[0]) >= 16)) tg.push(p); }
      if (tg.length < n) continue;
      const ob = []; for (let k = 0; k < 200 && ob.length < no; k++) { const w = rng.int(6, 9), h = rng.int(16, 30), r = { x: rng.int(30, 58), y: rng.int(4, 96 - h), w, h }; if (ob.every(x => r.x + r.w + 4 < x.x || x.x + x.w + 4 < r.x || r.y + r.h + 6 < x.y || x.y + x.h + 6 < r.y)) ob.push(r); }
      if (ob.length < no) continue;
      const st = tg.map(p => ob.some(r => this.hits(this.B, p, r, -1.5)) ? 'blocked' : ob.some(r => this.hits(this.B, p, r, 3)) ? 'unclear' : 'clear');
      if (st.includes('unclear')) continue;
      const clear = st.filter(x => x === 'clear').length;
      if (ask === 'can' && clear !== 1) continue;
      if (ask === 'cant' && clear !== n - 1) continue;
      return { k: [d, tg.map(p => p.join(',')).join('|'), ob.map(r => [r.x, r.y, r.w, r.h].join(',')).join('|')], ask, tg, ob, state: st, answer: st.indexOf(ask === 'can' ? 'clear' : 'blocked') };
    }
    if ((o.tries || 0) < 4) return this.gen(G, Object.assign({}, o, { tries: (o.tries || 0) + 1 }));
    return { k: [d, 'x'], ask: 'can', tg: [[80, 30], [80, 80]], ob: [{ x: 40, y: 64, w: 8, h: 26 }], state: ['clear', 'blocked'], answer: 0 };
  },
  audit(q) { const s = q.tg.map(p => (q.ob.some(r => this.hits(this.B, p, r, -1.5)) ? 'blocked' : q.ob.some(r => this.hits(this.B, p, r, 3)) ? 'unclear' : 'clear')), good = s.map((x, i) => (x === (q.ask === 'can' ? 'clear' : 'blocked') ? i : -1)).filter(i => i >= 0); return { n: q.tg.length, pos: null, err: !s.includes('unclear') && good.length === 1 && good[0] === q.answer ? null : 'right ones ' + good + ' ' + s }; },
  geo() { return K.L() ? { x: 60, y: 110, w: 904, h: 520 } : { x: 30, y: 230, w: 644, h: 640 }; },
  toPx(p) { const g = this.geo(); return [g.x + p[0] / 100 * g.w, g.y + p[1] / 100 * g.h]; },
  decor(G) { const L = K.L(), a = G.actors.hawkeye, b = this.toPx(this.B); W2X.hideAll(G, this.chars); if (a) showActor(a, b[0] - 6, b[1] + (L ? 104 : 96), L ? 200 : 180); },
  place(st) {
    const g = this.geo();
    st.obEls.forEach((e, i) => { const r = st.q.ob[i]; place(e, g.x + r.x / 100 * g.w, g.y + r.y / 100 * g.h, r.w / 100 * g.w, r.h / 100 * g.h); });
    st.tgEls.forEach((e, i) => { const p = this.toPx(st.q.tg[i]); place(e, p[0] - 48, p[1] - 48, 96, 96); });
    const b = this.toPx(this.B); place(st.nock, b[0] - 14, b[1] - 14, 28, 28);
  },
  async present(st) {
    const q = st.q;
    st.obEls = q.ob.map(() => { const e = W2X.thing(st, 10, 10, 4, ''); e.innerHTML = '<svg viewBox="0 0 40 100" width="100%" height="100%" preserveAspectRatio="none"><rect x="2" y="2" width="36" height="96" rx="4" fill="#A9B4C2" stroke="#2B2118" stroke-width="3" vector-effect="non-scaling-stroke"/><path d="M2 26H38M2 52H38M2 78H38M20 2V26M12 26V52M28 52V78M16 78V98" stroke="#7D8796" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'; return e; });
    st.tgEls = q.tg.map((_, i) => { const e = W3X.card(st, 't' + i, 5, ''); e.innerHTML = '<svg viewBox="0 0 96 96" width="80%" height="80%"><circle cx="48" cy="48" r="40" fill="#fff" stroke="#2B2118" stroke-width="5"/><circle cx="48" cy="48" r="28" fill="#E8414B"/><circle cx="48" cy="48" r="16" fill="#fff"/><circle cx="48" cy="48" r="7" fill="#E8414B"/></svg>'; return e; });
    st.nock = W2X.thing(st, 28, 28, 6, ''); st.nock.innerHTML = '<svg viewBox="0 0 28 28" width="100%" height="100%"><circle cx="14" cy="14" r="10" fill="#FFC93C" stroke="#2B2118" stroke-width="3"/></svg>';
    this.place(st);
    st.tgEls.forEach((e, i) => K.pop(st, e, 90 * i));
    K.task(st, [[W3X.ic('<circle cx="16" cy="50" r="10" fill="#FFC93C" stroke="#2B2118" stroke-width="4"/><path d="M28 50H70" stroke="#2B2118" stroke-width="5" stroke-dasharray="8 6"/><circle cx="82" cy="50" r="14" fill="#E8414B" stroke="#2B2118" stroke-width="4"/>')], ['q']]);
    if (!st.G.toldArrow) { st.G.toldArrow = true; W3X.tip('箭飞得直直的！'); }
    K.say(st, q.ask === 'can' ? '哪个靶子射得到？' : '哪个射不到？');
  },
  onGesture(st, name, p) { const id = p.id || ''; if (name !== 'tap' || !/^t\d$/.test(id) || st.picked) return false; st.picked = true; Session.submit(st, Number(id.slice(1))); return 'ok'; },
  /* an arrow flies straight at target i; it stops at the first wall in the way. Returns that wall (or -1) */
  async shoot(st, i) {
    const q = st.q, b = this.toPx(this.B), p = this.toPx(q.tg[i]);
    let lo = 0, hi = 1, wall = -1;
    if (q.ob.some(r => this.hits(this.B, q.tg[i], r, 0))) { for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2, pt = [this.B[0] + (q.tg[i][0] - this.B[0]) * m, this.B[1] + (q.tg[i][1] - this.B[1]) * m]; if (q.ob.some(r => this.hits(this.B, pt, r, 0))) hi = m; else lo = m; } const pt = [this.B[0] + (q.tg[i][0] - this.B[0]) * hi, this.B[1] + (q.tg[i][1] - this.B[1]) * hi]; wall = q.ob.findIndex(r => this.hits(this.B, pt, r, 0.5)); } else lo = 1;
    const end = lo >= 1 ? p : this.toPx([this.B[0] + (q.tg[i][0] - this.B[0]) * lo, this.B[1] + (q.tg[i][1] - this.B[1]) * lo]);
    const ang = Math.atan2(end[1] - b[1], end[0] - b[0]) * 180 / Math.PI, ar = W2X.thing(st, 90, 20, 8, '');
    ar.innerHTML = '<svg viewBox="0 0 90 20" width="100%" height="100%"><path d="M4 10H76" stroke="#2B2118" stroke-width="5"/><path d="M70 2L88 10L70 18Z" fill="#9AA3AF" stroke="#2B2118" stroke-width="3"/><path d="M4 10L14 2M4 10L14 18" stroke="#E8414B" stroke-width="4"/></svg>';
    place(ar, b[0] - 80, b[1] - 10, 90, 20); ar.style.transformOrigin = '80px 10px';
    Sfx.whoosh(0.3);
    await st.scope.anim(ar, [{ transform: 'translate(0,0) rotate(' + ang + 'deg)' }, { transform: 'translate(' + (end[0] - b[0]) + 'px,' + (end[1] - b[1]) + 'px) rotate(' + ang + 'deg)' }], { duration: 520, easing: 'linear', fill: 'forwards' });
    if (wall < 0) { K.wiggle(st, st.tgEls[i]); Fx.burst(p[0], p[1], { n: 14, dist: 60 }); } else K.wiggle(st, st.obEls[wall]);
    return wall;
  },
  async reveal(st) {
    const q = st.q; await this.shoot(st, q.answer); if (!Session.alive(st)) return;
    Sfx.reveal(); this.cheerAll(st); st.summary = q.ask === 'can' ? '射中啦！' : '被挡住啦！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
  },
  async feedback(st, ans) { if (st.tgEls[ans]) K.wiggle(st, st.tgEls[ans]); W3X.say(st.q.ask === 'can' ? '有东西挡住啦' : '它射得到哦'); await st.scope.wait(600); },
  /* after a wrong answer: an arrow at his target - stopped by a wall (blue), or it hits (blue); then at the right one (gold):
     it hits (can) / the wall that stops it (cant) */
  async explain(st, ans) {
    const q = st.q, my = st;
    W3X.mine(st, st.tgEls[ans], 2);
    const w1 = await this.shoot(st, ans); if (!Session.alive(my)) return;
    if (w1 >= 0) W3X.ringAt(st, box(st.obEls[w1]), W3X.BLUE, 8);
    await st.scope.wait(T(1000)); if (!Session.alive(my)) return;
    const w2 = await this.shoot(st, q.answer); if (!Session.alive(my)) return;
    W3X.gold(st, st.tgEls[q.answer], 2, 0); if (w2 >= 0) W3X.ringAt(st, box(st.obEls[w2]), W3X.GOLD, 8);
    Sfx.reveal(); W3X.tell(q.ask === 'can' ? '射中啦！' : '被挡住啦！');
    await W3X.beat(st, 1500);
  },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % st.q.tg.length : st.q.answer; return { g: 'tap', p: { id: 't' + i } }; },
  workEls(st) { return st.tgEls || []; },
  snap(st) { return { ask: st.q.ask }; },
};

/* ================================================================ 复仇者 T4 · 齿轮 the gears: which one turns the same way (reasoning) */
const MGears = {
  kind0: 'gears', verb: '转！', intro: '齿轮转起来！', praise: ['转得一点不差！'],
  gen(G, o) {
    /* five yellow gears to choose from (client: five options): the right one, the ones turning the other way, and two
       loose gears that touch nothing (they do not turn); every other gear is grey */
    const d = Math.min(5, o.level), rng = o.rng, n = [0, 4, 4, 5, 5, 6][d], ask = d === 4 ? 'opp' : d === 5 ? bagPick(G, 'ge5', ['same', 'opp']) : 'same';
    for (let t = 0; t < 900; t++) {
      const gs = [{ x: 12, y: rng.int(26, 44), r: 8, p: -1 }];
      const ok = (c, ex) => c.x >= c.r + 1 && c.x <= 100 - c.r - 1 && c.y >= c.r + 1 && c.y <= 70 - c.r - 1 && gs.every((g2, j) => ex.includes(j) || Math.hypot(g2.x - c.x, g2.y - c.y) >= g2.r + c.r + 2.6);
      let fail = false;
      for (let i = 1; i < n && !fail; i++) {
        const par = d === 5 && i === n - 1 ? rng.int(1, 2) : i - 1, P = gs[par]; let placed = false;
        for (let k = 0; k < 60; k++) { const r = rng.pick([6.5, 8, 9.5]), a = (rng.int(-55, 55) + (d === 5 && i === n - 1 ? rng.pick([-90, 90]) : 0)) * Math.PI / 180, dd = P.r + r - 1.2, c = { x: P.x + dd * Math.cos(a), y: P.y + dd * Math.sin(a), r, p: par }; if (ok(c, [par])) { gs.push(c); placed = true; break; } }
        if (!placed) fail = true;
      }
      if (fail) continue;
      let lost = false;
      for (let m = 0; m < 2 && !lost; m++) { let loose = null; for (let k = 0; k < 200 && !loose; k++) { const r = rng.pick([6.5, 8]), a = rng() * Math.PI * 2, base = gs[rng.int(1, gs.length - 1)], dd = base.r + r + rng.int(3, 5), c = { x: base.x + dd * Math.cos(a), y: base.y + dd * Math.sin(a), r, p: null }; if (ok(c, [])) loose = c; } if (loose) gs.push(loose); else lost = true; }
      if (lost) continue;
      const depth = gs.map(g2 => { let k = 0, x = g2; while (x.p != null && x.p >= 0) { k++; x = gs[x.p]; } return x.p === -1 ? k : null; });
      const same = gs.map((_, i) => i).filter(i => i > 0 && depth[i] != null && depth[i] % 2 === 0), opp = gs.map((_, i) => i).filter(i => depth[i] != null && depth[i] % 2 === 1), still = gs.map((_, i) => i).filter(i => depth[i] == null);
      if (!same.length || !opp.length) continue;
      const right = ask === 'same' ? rng.pick(same) : rng.pick(opp), turnWrong = ask === 'same' ? opp : same.filter(i => i > 0);
      const wrong = rng.shuffle(turnWrong).slice(0, 2).concat(still); while (wrong.length < 4 && turnWrong.length > wrong.length - still.length) { const x = turnWrong.find(w => !wrong.includes(w)); if (x == null) break; wrong.push(x); }
      if (wrong.length < 4) continue;
      const cands = rng.shuffle([right].concat(wrong.slice(0, 4)));
      const cw = rng() < 0.5;
      return { k: [d, ask, gs.map(g2 => [g2.x.toFixed(0), g2.y.toFixed(0), g2.r].join(',')).join('|')], ask, gs: gs.map(g2 => ({ x: Math.round(g2.x * 10) / 10, y: Math.round(g2.y * 10) / 10, r: g2.r })), depth, cands, cw, answer: right };
    }
    return this.gen(G, Object.assign({}, o, { level: Math.max(1, d - 1) }));
  },
  geo() { return K.L() ? { s: 7.2, x: 152, y: 128 } : { s: 6.3, x: 37, y: 300 }; },
  decor(G) { W2X.hideAll(G, this.chars); },
  gearSvg(r, fill, s) {
    const n = Math.round(r * 1.45), R = r * s, Ri = R - 1.3 * s, Ro = R + 0.15 * s, pts = [];
    for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n, w = Math.PI / n * 0.5; [[Ri, a - w * 1.25], [Ro, a - w * 0.7], [Ro, a + w * 0.7], [Ri, a + w * 1.25]].forEach(([rr, aa]) => pts.push([rr * Math.cos(aa), rr * Math.sin(aa)])); }
    const v = svg('svg', { viewBox: [-Ro - 3, -Ro - 3, 2 * Ro + 6, 2 * Ro + 6].join(' '), width: '100%', height: '100%' });
    svg('polygon', { points: W2X.pts(pts), fill, stroke: '#2B2118', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, v);
    svg('circle', { cx: 0, cy: 0, r: R * 0.32, fill: '#FFF8EC', stroke: '#2B2118', 'stroke-width': 3.5 }, v);
    svg('path', { d: 'M0 ' + (-R * 0.8) + 'V' + (-R * 0.42), stroke: '#2B2118', 'stroke-width': 4, 'stroke-linecap': 'round' }, v);
    v.style.pointerEvents = 'none';
    return v;
  },
  place(st) {
    const g = this.geo();
    st.gearEls.forEach((e, i) => { const c = st.q.gs[i], Ro = (c.r + 0.15) * g.s + 3, hit = Math.max(Ro * 2, 92); place(e, g.x + c.x * g.s - hit / 2, g.y + c.y * g.s - hit / 2, hit, hit); e.firstChild.style.width = e.firstChild.style.height = (Ro * 2) + 'px'; });
    const c0 = st.q.gs[0]; place(st.arrow, g.x + c0.x * g.s - c0.r * g.s - 30, g.y + c0.y * g.s - c0.r * g.s - 30, c0.r * g.s * 2 + 60, c0.r * g.s * 2 + 60);
  },
  async present(st) {
    const q = st.q, g = this.geo();
    st.gearEls = q.gs.map((c, i) => { const cand = q.cands.includes(i), e = W2X.thing(st, 10, 10, i === 0 ? 5 : 4, ''); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', clipPath: 'circle(50%)' }); e.appendChild(this.gearSvg(c.r, i === 0 ? '#E8414B' : cand ? '#FFC93C' : '#B8C2CC', g.s)); if (cand) K.reg(st, 'g' + i, e, {}); return e; });
    st.arrow = W2X.thing(st, 10, 10, 6, ''); st.arrow.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%" style="transform:scaleX(' + (q.cw ? 1 : -1) + ')"><path d="M50 6A44 44 0 0 1 92 40" fill="none" stroke="#E8414B" stroke-width="6" stroke-linecap="round"/><path d="M84 30L94 44L100 28Z" fill="#E8414B" stroke="#2B2118" stroke-width="2"/></svg>';
    this.place(st);
    st.gearEls.forEach((e, i) => K.pop(st, e, 50 * i));
    K.task(st, [[W3X.ic('<circle cx="30" cy="50" r="20" fill="#E8414B" stroke="#2B2118" stroke-width="5"/><path d="M16 24A26 26 0 0 1 48 22" fill="none" stroke="#E8414B" stroke-width="5"/><circle cx="72" cy="50" r="16" fill="#FFC93C" stroke="#2B2118" stroke-width="5"/>')], ['q']]);
    K.say(st, q.ask === 'same' ? '哪个转得和它一样？' : '哪个转得和它相反？');
  },
  onGesture(st, name, p) { const m = /^g(\d+)$/.exec(p.id || ''); if (name !== 'tap' || !m || st.picked) return false; st.picked = true; Session.submit(st, Number(m[1])); return 'ok'; },
  audit(q) { const good = q.cands.filter(i => q.depth[i] != null && i > 0 && (q.ask === 'same' ? q.depth[i] % 2 === 0 : q.depth[i] % 2 === 1)); return { n: q.cands.length, pos: null, err: good.length === 1 && good[0] === q.answer ? null : 'right ones ' + good }; },
  /* every gear that is driven turns (its way, at its speed) */
  spin(st) { const q = st.q; st.gearEls.forEach((e, i) => { const dp = q.depth[i]; if (dp == null) return; const dir = ((dp % 2 === 0) === q.cw) ? 1 : -1, sp = 8 / q.gs[i].r; st.scope.anim(e.firstChild, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (dir * 360 * sp) + 'deg)' }], { duration: 2400, easing: 'linear' }); }); },
  /* an arrow round gear i the way it turns */
  turnArrow(st, i, color) {
    const q = st.q, g = this.geo(), c = q.gs[i], dp = q.depth[i]; if (dp == null) return null;
    const cw = (dp % 2 === 0) === q.cw, e = W2X.thing(st, 10, 10, 7, '');
    e.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%" style="transform:scaleX(' + (cw ? 1 : -1) + ')"><path d="M50 6A44 44 0 0 1 92 40" fill="none" stroke="' + color + '" stroke-width="7" stroke-linecap="round"/><path d="M84 30L94 44L100 28Z" fill="' + color + '" stroke="#2B2118" stroke-width="2"/></svg>';
    place(e, g.x + c.x * g.s - c.r * g.s - 30, g.y + c.y * g.s - c.r * g.s - 30, c.r * g.s * 2 + 60, c.r * g.s * 2 + 60); K.pop(st, e); return e;
  },
  /* after a wrong answer: the gears turn; his gear (blue) with an arrow the way it really turns (or it stands still); the
     right gear (gold) with its arrow - the same way as the red one (or the other way) */
  async explain(st, ans) {
    const q = st.q, my = st;
    this.spin(st);
    if (st.gearEls[ans]) { W3X.ringAt(st, box(st.gearEls[ans]), W3X.BLUE, -6); this.turnArrow(st, ans, W3X.BLUE); }
    await st.scope.wait(T(1600)); if (!Session.alive(my)) return;
    W3X.ringAt(st, box(st.gearEls[q.answer]), W3X.GOLD, -6); this.turnArrow(st, q.answer, W3X.GOLD); this.spin(st);
    Sfx.reveal(); W3X.tell(q.ask === 'same' ? '它们转得一样！' : '它们转得相反！');
    await W3X.beat(st, 1800);
  },
  async reveal(st) {
    const q = st.q;
    this.spin(st);
    K.ring(st, [box(st.gearEls[q.answer])], 2, '#5CC46E');
    Sfx.reveal(); this.cheerAll(st); st.summary = q.ask === 'same' ? '它们转得一样！' : '它们转得相反！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(2000);
  },
  async feedback(st, ans) {
    const q = st.q, dp = q.depth[ans]; K.wiggle(st, st.gearEls[ans]);
    W3X.say(dp == null ? '它没碰到，不转' : (dp % 2 === 0) ? '它转得一样哦' : '它往反方向转'); await st.scope.wait(700);
  },
  next(st, strat) { if (st.picked) return null; const i = strat === 'wrong' ? st.q.cands.find(x => x !== st.q.answer) : st.q.answer; return { g: 'tap', p: { id: 'g' + i } }; },
  workEls(st) { return (st.gearEls || []).filter((_, i) => st.q.cands.includes(i)); },
  snap(st) { return { n: st.q.gs.length }; },
};

/* ---------------------------------------------------------------- the 28 sky games: one rule each + the island's things */
function w3Game(rule, spec) {
  const g = defGame(Object.assign({}, W2Base, rule, spec));
  g.props = (spec.props || []).filter((p, i, a) => a.indexOf(p) === i);
  return g;
}
const IC3 = (() => {
  const k = '#2B2118', I = s => W2X.icon(s);
  return {
    halves: I('<circle cx="50" cy="50" r="40" fill="#FFD3E0" stroke="' + k + '" stroke-width="6"/><path d="M50 10V90" stroke="' + k + '" stroke-width="6"/><circle cx="34" cy="40" r="4" fill="#5CC46E"/><circle cx="64" cy="60" r="4" fill="#4FB3FF"/>'),
    story: I('<rect x="6" y="26" width="26" height="48" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><rect x="37" y="26" width="26" height="48" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><rect x="68" y="26" width="26" height="48" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><ellipse cx="19" cy="52" rx="7" ry="9" fill="#FFF3D6" stroke="' + k + '" stroke-width="3"/><circle cx="81" cy="50" r="8" fill="#FFD84A" stroke="' + k + '" stroke-width="3"/>'),
    missing: I('<rect x="8" y="8" width="84" height="84" rx="14" fill="#FFF8EC" stroke="' + k + '" stroke-width="6"/><path d="M20 70V54Q22 44 36 42L44 30H62Q70 30 74 38L80 46Q86 48 86 56V70Z" fill="#E8414B" stroke="' + k + '" stroke-width="4"/><circle cx="36" cy="72" r="9" fill="#3A3A3A" stroke="' + k + '" stroke-width="3"/><circle cx="70" cy="72" r="9" fill="none" stroke="' + k + '" stroke-width="3" stroke-dasharray="4 3"/>'),
    groups: I('<rect x="6" y="40" width="40" height="40" rx="6" fill="#FFB3C7" stroke="' + k + '" stroke-width="5"/><rect x="54" y="40" width="40" height="40" rx="6" fill="#FFB3C7" stroke="' + k + '" stroke-width="5"/><circle cx="18" cy="56" r="6" fill="#FFC93C"/><circle cx="34" cy="56" r="6" fill="#FFC93C"/><circle cx="66" cy="56" r="6" fill="#FFC93C"/><circle cx="82" cy="56" r="6" fill="#FFC93C"/>'),
    grid: I('<rect x="10" y="10" width="80" height="80" rx="8" fill="#A8723C" stroke="' + k + '" stroke-width="5"/><path d="M37 10V90M63 10V90M10 37H90M10 63H90" stroke="' + k + '" stroke-width="4"/><path d="M50 58V44M50 48Q42 40 40 46Q46 50 50 48Q58 40 60 46Q54 50 50 48" stroke="#3E8E3E" stroke-width="4" fill="#5CC46E"/>'),
    cups: I('<path d="M10 86L18 30Q30 24 42 30L50 86Z" fill="#E8414B" stroke="' + k + '" stroke-width="5" stroke-linejoin="round"/><path d="M50 86L58 30Q70 24 82 30L90 86Z" fill="#E8414B" stroke="' + k + '" stroke-width="5" stroke-linejoin="round"/><circle cx="70" cy="16" r="9" fill="#FFD84A" stroke="' + k + '" stroke-width="4"/>'),
    overlay: I('<rect x="8" y="14" width="56" height="56" rx="8" fill="rgba(190,232,255,.85)" stroke="' + k + '" stroke-width="5"/><rect x="36" y="32" width="56" height="56" rx="8" fill="rgba(190,232,255,.85)" stroke="' + k + '" stroke-width="5"/><circle cx="26" cy="32" r="8" fill="#FF6B5B" stroke="' + k + '" stroke-width="3"/><rect x="66" y="62" width="14" height="14" fill="#4FB3FF" stroke="' + k + '" stroke-width="3"/>'),
    lights: I('<rect x="18" y="10" width="64" height="82" rx="6" fill="#3B4A86" stroke="' + k + '" stroke-width="5"/><rect x="28" y="22" width="16" height="16" fill="#FFE36B"/><rect x="56" y="22" width="16" height="16" fill="#2E3A6B"/><rect x="28" y="50" width="16" height="16" fill="#2E3A6B"/><rect x="56" y="50" width="16" height="16" fill="#FFE36B"/>'),
    spot: I('<circle cx="30" cy="50" r="26" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><circle cx="72" cy="50" r="24" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><path d="M30 38C24 48 24 56 30 62C36 56 36 48 30 38Z" fill="#4FB3FF"/><path d="M72 38C66 48 66 56 72 62C78 56 78 48 72 38Z" fill="#4FB3FF"/>'),
    tictac: I('<path d="M37 10V90M63 10V90M10 37H90M10 63H90" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/><circle cx="23" cy="23" r="9" fill="#4F7BFF" stroke="' + k + '" stroke-width="3"/><circle cx="50" cy="50" r="9" fill="#4F7BFF" stroke="' + k + '" stroke-width="3"/><circle cx="77" cy="23" r="9" fill="#E8414B" stroke="' + k + '" stroke-width="3"/>'),
    topview: I('<path d="M50 8C40 18 38 26 38 32H62C62 26 60 18 50 8Z" fill="#B57BFF" stroke="' + k + '" stroke-width="4"/><path d="M50 36V54" stroke="' + k + '" stroke-width="5"/><rect x="18" y="60" width="64" height="32" rx="6" fill="#E6B98A" stroke="' + k + '" stroke-width="4"/><circle cx="36" cy="76" r="8" fill="#4FB3FF" stroke="' + k + '" stroke-width="3"/><rect x="56" y="68" width="16" height="16" fill="#FF6B5B" stroke="' + k + '" stroke-width="3"/>'),
    sums: I('<circle cx="22" cy="50" r="14" fill="#9AA3AF" stroke="' + k + '" stroke-width="4"/><path d="M44 50H58M51 43V57" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/><circle cx="78" cy="50" r="14" fill="#9AA3AF" stroke="' + k + '" stroke-width="4"/>'),
    badges: I('<path d="M34 10L60 20V48Q60 74 34 86Q8 74 8 48V20Z" fill="#E8414B" stroke="' + k + '" stroke-width="5"/><path d="M66 18L92 28V56Q92 82 66 94Q40 82 40 56V28Z" fill="#E8414B" stroke="' + k + '" stroke-width="5"/>'),
    fence: I('<path d="M14 14H86V86H14Z" fill="none" stroke="#7A4A1C" stroke-width="9" stroke-linejoin="round"/><circle cx="50" cy="52" r="15" fill="#fff" stroke="' + k + '" stroke-width="4"/><circle cx="56" cy="48" r="5" fill="' + k + '"/>'),
    pipes: I('<path d="M50 8V30M50 30H22V80M50 30H78V80" fill="none" stroke="' + k + '" stroke-width="12" stroke-linejoin="round"/><path d="M50 8V30M50 30H22V80M50 30H78V80" fill="none" stroke="#3D9BFF" stroke-width="6" stroke-linejoin="round"/><circle cx="78" cy="56" r="10" fill="#E8414B" stroke="' + k + '" stroke-width="4"/>'),
    colormap: I('<rect x="8" y="8" width="42" height="42" fill="#E8414B" stroke="' + k + '" stroke-width="5"/><rect x="50" y="8" width="42" height="42" fill="#FFC93C" stroke="' + k + '" stroke-width="5"/><rect x="8" y="50" width="42" height="42" fill="#4F7BFF" stroke="' + k + '" stroke-width="5"/><rect x="50" y="50" width="42" height="42" fill="#E8414B" stroke="' + k + '" stroke-width="5"/>'),
    stroke: I('<path d="M18 86V40L50 12L82 40V86Z" fill="none" stroke="' + k + '" stroke-width="7" stroke-linejoin="round"/><path d="M18 86L82 40M18 40L82 86" stroke="' + k + '" stroke-width="5"/><circle cx="18" cy="86" r="8" fill="#E8414B" stroke="' + k + '" stroke-width="3"/>'),
    abacus: I('<rect x="14" y="8" width="72" height="84" rx="8" fill="#FFF8EC" stroke="#8A5A2E" stroke-width="7"/><path d="M14 36H86" stroke="#8A5A2E" stroke-width="6"/><path d="M38 12V88M62 12V88" stroke="' + k + '" stroke-width="3"/><path d="M28 22H48M52 22H72" stroke="#E8414B" stroke-width="10" stroke-linecap="round"/><path d="M28 46H48M28 58H48M52 46H72" stroke="#C98B4A" stroke-width="10" stroke-linecap="round"/>'),
    cloth: I('<rect x="8" y="8" width="84" height="84" rx="4" fill="#C8323C" stroke="' + k + '" stroke-width="5"/><rect x="16" y="16" width="68" height="68" fill="#FFF3D6"/><circle cx="30" cy="30" r="8" fill="#FF6B5B"/><circle cx="70" cy="30" r="8" fill="#4FB3FF"/><circle cx="30" cy="70" r="8" fill="#4FB3FF"/><rect x="58" y="58" width="24" height="24" fill="#6B4A2E" stroke="' + k + '" stroke-width="3" stroke-dasharray="4 3"/>'),
    baskets: I('<ellipse cx="50" cy="62" rx="44" ry="26" fill="#FFC93C" stroke="' + k + '" stroke-width="5"/><circle cx="34" cy="52" r="12" fill="#FF8A3C" stroke="' + k + '" stroke-width="3"/><circle cx="54" cy="48" r="12" fill="#FF8A3C" stroke="' + k + '" stroke-width="3"/><circle cx="70" cy="56" r="11" fill="#E8414B" stroke="' + k + '" stroke-width="3"/>'),
    doors: I('<path d="M6 92V40Q6 16 28 16Q50 16 50 40V92Z" fill="#3A2614" stroke="#FFC93C" stroke-width="5"/><path d="M58 92V60Q58 46 74 46Q90 46 90 60V92Z" fill="#3A2614" stroke="#FFC93C" stroke-width="5"/>'),
    fans: I('<path d="M50 88L12 30A48 48 0 0 1 88 30Z" fill="#5CC46E" stroke="' + k + '" stroke-width="5" stroke-linejoin="round"/><path d="M50 88L31 22M50 88L50 18M50 88L69 22" stroke="#2E8B3E" stroke-width="3"/><path d="M36 68A18 18 0 0 1 64 68" fill="none" stroke="#FFC93C" stroke-width="7"/>'),
    furnace: I('<path d="M24 40H76V70Q76 86 50 86Q24 86 24 70Z" fill="#3E8E6E" stroke="' + k + '" stroke-width="5"/><path d="M30 40Q50 18 70 40Z" fill="#5CC46E" stroke="' + k + '" stroke-width="5"/><path d="M42 60Q50 48 58 60Q58 72 50 72Q42 72 42 60Z" fill="#FF9F43" stroke="' + k + '" stroke-width="3"/><path d="M30 86L26 96M70 86L74 96" stroke="' + k + '" stroke-width="5"/>'),
    sorter: I('<polygon points="50,6 80,36 50,66 20,36" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><circle cx="50" cy="36" r="12" fill="#E8414B" stroke="' + k + '" stroke-width="3"/><rect x="8" y="76" width="30" height="18" fill="#FFC93C" stroke="' + k + '" stroke-width="4"/><rect x="62" y="76" width="30" height="18" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/>'),
    suits: I('<path d="M30 34Q30 8 50 8Q70 8 70 34V46Q50 56 30 46Z" fill="#E8414B" stroke="' + k + '" stroke-width="5"/><path d="M38 28H62V38Q50 42 38 38Z" fill="#BFF3FF" stroke="' + k + '" stroke-width="3"/><path d="M28 56H72L68 94H32Z" fill="#FFC93C" stroke="' + k + '" stroke-width="5" stroke-linejoin="round"/>'),
    arrows: I('<circle cx="70" cy="50" r="26" fill="#fff" stroke="' + k + '" stroke-width="5"/><circle cx="70" cy="50" r="17" fill="#E8414B"/><circle cx="70" cy="50" r="7" fill="#fff"/><path d="M6 50H62" stroke="' + k + '" stroke-width="5"/><path d="M54 42L66 50L54 58Z" fill="' + k + '"/>'),
    gears: I('<circle cx="34" cy="50" r="22" fill="#E8414B" stroke="' + k + '" stroke-width="5" stroke-dasharray="8 5"/><circle cx="34" cy="50" r="8" fill="#FFF8EC" stroke="' + k + '" stroke-width="4"/><circle cx="72" cy="50" r="16" fill="#FFC93C" stroke="' + k + '" stroke-width="5" stroke-dasharray="7 5"/><circle cx="72" cy="50" r="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="3"/>'),
  };
})();
w3Game(MHalves,   { id: 'E1', world: 'peppa3', bg: 'peppa_bakery', chars: ['daddy_pig', 'peppa'], host: 'daddy_pig', iconSrc: IC3.halves });
w3Game(MStory,    { id: 'E2', world: 'peppa3', bg: 'peppa_attic', chars: ['peppa', 'george'], host: 'peppa', iconSrc: IC3.story });
w3Game(MSolids,   { id: 'E3', world: 'peppa3', bg: 'peppa_party', chars: ['george', 'peppa'], host: 'george', icon: 'giftbox', props: ['beachball', 'yarnball', 'giftbox', 'dice', 'drum', 'tincan', 'partyhat', 'trafficcone'] });
w3Game(MMissing,  { id: 'E4', world: 'peppa3', bg: 'peppa_artroom', chars: ['peppa', 'george'], host: 'peppa', iconSrc: IC3.missing, boost: 1 });
w3Game(MGroups,   { id: 'U1', world: 'bluey3', bg: 'bluey_cafe', chars: ['chilli', 'bingo'], host: 'chilli', icon: 'cupcake', items: ['donut', 'cupcake', 'icecream'], props: ['donut', 'cupcake', 'icecream'] });
w3Game(MGrid,     { id: 'U2', world: 'bluey3', bg: 'bluey_garden', chars: ['bluey', 'bingo'], host: 'bluey', icon: 'sprout', props: ['tomato', 'eggplant', 'pumpkin', 'broccoli', 'carrot', 'sprout'] });
w3Game(MCups,     { id: 'U3', world: 'bluey3', bg: 'bluey_stage', chars: ['bandit', 'bluey'], host: 'bandit', iconSrc: IC3.cups, props: ['pompom'] });
w3Game(MOverlay,  { id: 'U4', world: 'bluey3', bg: 'bluey_sunroom', chars: ['bingo'], host: 'bingo', iconSrc: IC3.overlay, boost: 1 });
w3Game(MLights,   { id: 'K1', world: 'pjmasks3', bg: 'pj_skyline', chars: ['owlette', 'catboy'], host: 'owlette', iconSrc: IC3.lights });
w3Game(MSpot,     { id: 'K2', world: 'pjmasks3', bg: 'pj_hqlab', chars: ['gekko'], host: 'gekko', iconSrc: IC3.spot });
w3Game(MTicTac,   { id: 'K3', world: 'pjmasks3', bg: 'pj_nightpark', chars: ['catboy', 'romeo'], host: 'catboy', iconSrc: IC3.tictac });
w3Game(MTopView,  { id: 'K4', world: 'pjmasks3', bg: 'pj_museum', chars: ['owlette'], host: 'owlette', iconSrc: IC3.topview, boost: 1 });
w3Game(MSums,     { id: 'R1', world: 'paw3', bg: 'paw_harbor', chars: ['zuma', 'ryder'], host: 'zuma', iconSrc: IC3.sums, props: ['seal', 'starfish'] });
w3Game(MBadges,   { id: 'R2', world: 'paw3', bg: 'paw_townpark', chars: ['ryder', 'chase'], host: 'ryder', iconSrc: IC3.badges });
w3Game(MFence,    { id: 'R3', world: 'paw3', bg: 'paw_meadow', chars: ['rubble'], host: 'rubble', icon: 'sheep', props: ['sheep'] });
w3Game(MPipes,    { id: 'R4', world: 'paw3', bg: 'paw_nursery', chars: ['marshall'], host: 'marshall', iconSrc: IC3.pipes, props: ['flowerpot'], boost: 1 });
w3Game(MColorMap, { id: 'L1', world: 'huluwa3', bg: 'huluwa_terraces', chars: ['gourd1', 'grandpa'], host: 'gourd1', iconSrc: IC3.colormap });
w3Game(MStroke,   { id: 'L2', world: 'huluwa3', bg: 'huluwa_study', chars: ['grandpa', 'gourd2'], host: 'grandpa', iconSrc: IC3.stroke });
w3Game(MAbacus,   { id: 'L3', world: 'huluwa3', bg: 'huluwa_fair', chars: ['grandpa', 'gourd5'], host: 'grandpa', iconSrc: IC3.abacus });
w3Game(MCloth,    { id: 'L4', world: 'huluwa3', bg: 'huluwa_loom', chars: ['gourd6', 'grandpa'], host: 'gourd6', iconSrc: IC3.cloth, boost: 1 });
w3Game(MBaskets,  { id: 'S1', world: 'xiyou3', bg: 'xiyou_heaven', chars: ['bajie', 'wukong'], host: 'bajie', icon: 'persimmon', props: ['persimmon', 'pomegranate', 'starfruit'] });
w3Game(MDoors,    { id: 'S2', world: 'xiyou3', bg: 'xiyou_cliffs', chars: ['wukong', 'bajie', 'shaseng', 'tangseng'], host: 'wukong', iconSrc: IC3.doors });
w3Game(MFans,     { id: 'S3', world: 'xiyou3', bg: 'xiyou_flame', chars: ['wukong', 'bajie'], host: 'wukong', iconSrc: IC3.fans });
w3Game(MFurnace,  { id: 'S4', world: 'xiyou3', bg: 'xiyou_alchemy', chars: ['wukong'], host: 'wukong', icon: 'furnace', props: ['furnace'], boost: 1 });
w3Game(MSorter,   { id: 'T1', world: 'avengers3', bg: 'avengers_factory', chars: ['ironman'], host: 'ironman', iconSrc: IC3.sorter, boost: -1 });   /* starts with one sign row less (R9-2) */
w3Game(MSuits,    { id: 'T2', world: 'avengers3', bg: 'avengers_armory', chars: ['ironman'], host: 'ironman', iconSrc: IC3.suits, boost: -3 });   /* from 2 x 2 suits; 3 x 3 at L4 (R9-3) */
w3Game(MArrows,   { id: 'T3', world: 'avengers3', bg: 'avengers_field', chars: ['hawkeye'], host: 'hawkeye', iconSrc: IC3.arrows });
w3Game(MGears,    { id: 'T4', world: 'avengers3', bg: 'avengers_garage', chars: ['ironman', 'hulk'], host: 'ironman', iconSrc: IC3.gears, boost: 0 });
W3.w3in = true;
