/* 点点岛 · the stars (world 4): the 28 games. Loaded after the entry tap by W3.load() in index.html. Source: raw/js/w4/. */
"use strict";
const W4R = {};
/* ================================================================ ① 佩奇·星球 (零与符号, from 1): F1 鳄鱼嘴 · F2 选符号 · F3 拼算式 ·
   F4 符号代换 (reasoning). Everything inside one function: no top-level names (all islands share one script). */
(() => {
  const INK = '#2B2118';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const flex = (dir, gap) => { const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: dir || 'row', alignItems: 'center', justifyContent: 'center', gap: (gap || 0) + 'px', pointerEvents: 'none' }); return d; };
  /* n dots in rows of `per` (0: an empty dashed ring) */
  const dotsSvg = (n, g, r, fill, per) => {
    per = per || 5; const cols = Math.max(1, Math.min(per, n)), rows = Math.max(1, Math.ceil(n / per)), w = cols * g + 4, h = rows * g + 4;
    const s = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h });
    if (!n) svg('circle', { cx: w / 2, cy: h / 2, r: r, fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-dasharray': '4 3', opacity: 0.6 }, s);
    for (let i = 0; i < n; i++) svg('circle', { cx: 2 + g / 2 + (i % per) * g, cy: 2 + g / 2 + Math.floor(i / per) * g, r, fill: fill || '#4FB3FF', stroke: INK, 'stroke-width': 2.4 }, s);
    s.style.flexShrink = '0'; s.style.pointerEvents = 'none'; return s;
  };
  /* a numeral, with its dots under it at the low levels */
  const numCol = (n, h, dots, k) => { const d = flex('column', 4); d.appendChild(UI.num(n, h)); if (dots) d.appendChild(dotsSvg(n, Math.round(h * 0.21 * (k || 1)), Math.round(h * 0.078 * (k || 1)))); return d; };
  const sym = (t, size, color) => { const o = el('span', ''); o.textContent = t === '-' ? '−' : t; Object.assign(o.style, { font: '900 ' + size + 'px/1 system-ui, sans-serif', color: color || INK, pointerEvents: 'none' }); return o; };
  const slotBox = (w, h, round) => { const b = el('div', ''); Object.assign(b.style, { width: w + 'px', height: h + 'px', border: '5px dashed ' + INK, borderRadius: round ? '50%' : '16px', background: '#FFF7D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', pointerEvents: 'none' }); return b; };
  const rowAt = (n, cx, cy, w, h, gap) => { const tot = n * w + (n - 1) * gap; return Array.from({ length: n }, (_, i) => ({ x: Math.round(cx - tot / 2 + i * (w + gap)), y: Math.round(cy - h / 2) })); };
  const panel = (st, z) => { const e = W2X.thing(st, 10, 10, z || 4, 'card'); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }); return e; };
  const W = { '+': '加', '-': '减', '=': '等于' };
  const words = parts => parts.map(t => typeof t === 'number' ? CN[t] : W[t]).join('');
  const calc = (x, op, y) => op === '+' ? x + y : x - y;
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const SUMS = () => { const out = []; for (let a = 0; a <= 10; a++) for (let b = 0; a + b <= 10; b++) { out.push([a, '+', b, '=', a + b]); } for (let a = 0; a <= 10; a++) for (let b = 0; b <= a; b++) out.push([a, '-', b, '=', a - b]); return out; };

  /* the crocodile mouth: '>' opens to the left (the left side is bigger), '<' to the right, '=' two bars */
  const croc = (rel, size) => {
    const s = svg('svg', { viewBox: '0 0 120 120', width: size || '100%', height: size || '100%' }); s.style.pointerEvents = 'none'; s.style.overflow = 'visible';
    if (rel === 'eq') { [34, 68].forEach(y => svg('rect', { x: 18, y, width: 84, height: 20, rx: 10, fill: '#5CC46E', stroke: INK, 'stroke-width': 5 }, s)); return s; }
    const g = svg('g', rel === 'lt' ? { transform: 'translate(120 0) scale(-1 1)' } : {}, s);
    const jaw = (rot, up) => {
      const j = svg('g', { transform: 'translate(98 60) rotate(' + rot + ')' }, g);
      [-74, -56, -38].forEach(x => svg('path', { d: 'M' + (x - 6) + ' ' + (up ? -8 : 8) + 'L' + x + ' ' + (up ? -21 : 21) + 'L' + (x + 6) + ' ' + (up ? -8 : 8) + 'Z', fill: '#fff', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, j));
      svg('rect', { x: -92, y: -10, width: 98, height: 20, rx: 10, fill: '#5CC46E', stroke: INK, 'stroke-width': 4.5 }, j);
    };
    jaw(26.57, false); jaw(-26.57, true);
    svg('circle', { cx: 98, cy: 60, r: 13, fill: '#5CC46E', stroke: INK, 'stroke-width': 4.5 }, g);
    svg('circle', { cx: 76, cy: 35, r: 8, fill: '#fff', stroke: INK, 'stroke-width': 3 }, g); svg('circle', { cx: 77, cy: 35, r: 3.6, fill: INK }, g);
    return s;
  };
  const crocIc = '<g transform="scale(.8333)"><path d="M22 22L98 60L22 98" fill="none" stroke="#2B2118" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22L98 60L22 98" fill="none" stroke="#5CC46E" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><circle cx="76" cy="35" r="8" fill="#fff" stroke="#2B2118" stroke-width="3"/></g>';

  /* ================================================================ F1 鳄鱼嘴: which sign is right - > < = (the mouth opens to the bigger side) */
  W4R.F1 = {
    kind0: 'croc4', verb: '比！', intro: '鳄鱼爱吃大的！', praise: ['比得真准！'],
    /* L1 two piles of dots (5); L2 dots and a numeral (6); L3 numerals 0-10; L4 a number and a + b; L5 two sentences */
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, rel = bagPick(G, 'f1r' + d, ['gt', 'lt', 'eq']);
      const fits = (x, y) => rel === 'eq' ? x === y : rel === 'gt' ? x > y : x < y;
      const ex = ops => {          /* a + b or a - b (0 sometimes), value 0..10 */
        for (let t = 0; t < 50; t++) {
          const op = rng.pick(ops); let a, b;
          if (op === '+') { a = rng.int(0, 9); b = rng.int(0, 10 - a); } else { a = rng.int(1, 10); b = rng.int(0, a); }
          if ((a === 0 || b === 0) && !rng.chance(0.15)) continue;
          if (a === 0 && b === 0) continue;
          return { t: 'ex', a, op, b, v: calc(a, op, b) };
        }
        return { t: 'ex', a: 2, op: '+', b: 3, v: 5 };
      };
      const key = s => s.t === 'ex' ? s.a + s.op + s.b : s.t[0] + s.v;
      let L = null, R = null;
      for (let t = 0; t < 600 && !L; t++) {
        if (d <= 3) {
          const lo = d === 3 ? 0 : 1, hi = d === 1 ? 5 : d === 2 ? 6 : 10, x = rng.int(lo, hi), y = rng.int(lo, hi);
          if (!fits(x, y) || (d === 2 && Math.abs(x - y) > 3)) continue;
          const dl = rng.chance(0.5);
          L = { t: d === 1 || (d === 2 && dl) ? 'dots' : 'num', v: x }; R = { t: d === 1 || (d === 2 && !dl) ? 'dots' : 'num', v: y };
        } else if (d === 4) {
          const e = ex(['+']), n = e.v + rng.int(-2, 2), exLeft = rng.chance(0.5);
          if (n < 0 || n > 10) continue;
          const l = exLeft ? e.v : n, r = exLeft ? n : e.v;
          if (!fits(l, r)) continue;
          const num = { t: 'num', v: n }; L = exLeft ? e : num; R = exLeft ? num : e;
        } else {
          const a = ex(['+', '-']), b = ex(['+', '+', '-']);
          if (Math.abs(a.v - b.v) > 2 || !fits(a.v, b.v) || key(a) === key(b) || (a.op === '-' && b.op === '-')) continue;
          L = a; R = b;
        }
      }
      if (!L) { L = { t: 'num', v: rel === 'lt' ? 2 : 4 }; R = { t: 'num', v: rel === 'gt' ? 2 : 4 }; if (rel === 'eq') L.v = R.v = 3; }
      return { k: [d, key(L), key(R)], L, R, rel, answer: rel, opts: ['gt', 'lt', 'eq'] };
    },
    geo() { return K.L() ? { sw: 300, sh: 220, sy: 140, gap: 70, slot: 112, cs: 140, cgap: 44, cy: 560 } : { sw: 280, sh: 210, sy: 262, gap: 56, slot: 98, cs: 150, cgap: 38, cy: 720 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(), cx = Stage.W / 2;
      if (st.sideL) place(st.sideL, cx - g.gap - g.sw, g.sy, g.sw, g.sh);
      if (st.sideR) place(st.sideR, cx + g.gap, g.sy, g.sw, g.sh);
      if (st.slot) place(st.slot, cx - g.slot / 2, g.sy + g.sh / 2 - g.slot / 2, g.slot, g.slot);
      (st.cards || []).forEach((c, i) => { const p = rowAt(st.cards.length, cx, g.cy, g.cs, g.cs, g.cgap)[i]; place(c, p.x, p.y, g.cs, g.cs); });
    },
    side(s, small, color) {
      if (s.t === 'dots') return UI.dots(s.v, small ? 140 : 150, { layout: 'dice', color });
      if (s.t === 'num') return UI.num(s.v, small ? 112 : 124);
      const r = flex('row', 8); r.appendChild(UI.num(s.a, small ? 78 : 86)); r.appendChild(sym(s.op, small ? 56 : 62)); r.appendChild(UI.num(s.b, small ? 78 : 86)); return r;
    },
    present(st) {
      const q = st.q, P = !K.L();
      st.sideL = panel(st, 4); st.sideL.appendChild(this.side(q.L, P, '#4FB3FF'));
      st.sideR = panel(st, 4); st.sideR.appendChild(this.side(q.R, P, '#FF9F43'));
      st.slot = W2X.thing(st, 10, 10, 4, ''); Object.assign(st.slot.style, { border: '6px dashed ' + INK, borderRadius: '50%', background: 'rgba(255,247,214,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      st.slot.appendChild(sym('?', 54, 'rgba(43,33,24,.38)'));
      st.cards = q.opts.map((r, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); const h = flex(); h.style.width = h.style.height = '82%'; h.appendChild(croc(r)); c.appendChild(h); return c; });
      st.opts = q.opts.slice();
      this.place(st);
      K.pop(st, st.sideL); K.pop(st, st.slot, 80); K.pop(st, st.sideR, 160); st.cards.forEach((c, i) => K.pop(st, c, 260 + 70 * i));
      K.task(st, [[W3X.ic(crocIc)], ['q']]);
      if (q.L.t === 'dots' || q.R.t === 'dots') W3X.say2(st, '嘴巴朝多的那边。', '哪个符号对？'); else K.say(st, '哪个符号对？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, c = st.cards[q.opts.indexOf(q.rel)];
      st.slot.innerHTML = ''; st.slot.style.border = '0'; st.slot.style.background = 'transparent';
      const m = croc(q.rel); st.slot.appendChild(m);
      K.ring(st, [box(c)], 6, '#FFC93C'); Sfx.reveal();
      await st.scope.anim(st.slot, [{ transform: 'scale(.4)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: T(420) + 1, easing: EASE.pop });
      if (!Session.alive(my)) return;
      if (q.rel !== 'lt') K.hop(st, st.sideL, 18);
      if (q.rel !== 'gt') K.hop(st, st.sideR, 18);
      this.cheerAll(st);
      st.summary = this.sumLine(q.L.v, q.rel, q.R.v); Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1300));
    },
    sumLine(x, rel, y) { return CN[x] + (rel === 'gt' ? '大于' : rel === 'lt' ? '小于' : '等于') + CN[y] + '！'; },
    wrongLine(d, ans) { const more = d <= 2 ? '多' : '大', less = d <= 2 ? '少' : '小'; return ans === 'gt' ? '左边不比右边' + more : ans === 'lt' ? '左边不比右边' + less : '两边不一样' + more; },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(this.wrongLine(st.level, ans)); await st.scope.wait(T(600)); },
    next(st, strat) { if (st.picked || !st.cards) return null; const i = st.opts.indexOf(st.q.rel); return { g: 'tap', p: { id: 'card' + (strat === 'wrong' ? (i + 1) % 3 : i) } }; },
    workEls(st) { return st.cards || []; },
    snap(st) { return { rel: st.q.rel }; },
    lines() {
      const out = [this.intro, '哪个符号对？', '嘴巴朝多的那边。'].concat(this.praise);
      for (let x = 0; x <= 10; x++) for (let y = 0; y <= 10; y++) out.push(this.sumLine(x, x > y ? 'gt' : x < y ? 'lt' : 'eq', y));
      [1, 3].forEach(d => ['gt', 'lt', 'eq'].forEach(a => out.push(this.wrongLine(d, a))));
      return uniq(out);
    },
  };

  /* ================================================================ F2 选符号: a ○ b = c - plus or minus? (0 often: 5 − 5 = 0, 0 + 3 = 3) */
  W4R.F2 = {
    kind0: 'sign4', verb: '选！', intro: '帮猪爸爸选符号！', praise: ['符号选对啦！'],
    /* L1 dots under the numbers (5); L2 numerals (5); L3 10; L4 the "=" on the left (7 = 5 ○ 2); L5 two signs (a ○ b ○ c = d) */
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      if (d === 5) {
        for (let t = 0; t < 300; t++) {
          const b = rng.int(1, 4), c = rng.int(1, 4); if (b === c || b + c > 5) continue;
          const a = rng.int(b + c, 10 - b - c), combos = ['++', '+-', '-+', '--'];
          const ok = bagPick(G, 'f2c', combos), val = s => calc(calc(a, s[0], b), s[1], c);
          const opts = placeOptions(G, [ok].concat(rng.shuffle(combos.filter(x => x !== ok)).slice(0, 2)), ok);
          return { k: [5, a, b, c, ok], two: true, a, b, c, d: val(ok), op: ok, answer: ok, opts, vals: opts.map(val) };
        }
      }
      const max = d <= 2 ? 5 : 10, op = bagPick(G, 'f2o' + d, ['+', '-']), zero = rng.chance(0.25);
      let a, b;
      if (op === '+') { if (zero) { a = 0; b = rng.int(1, max); } else { a = rng.int(1, max - 1); b = rng.int(1, max - a); } }
      else if (zero) { a = rng.int(1, max); b = a; } else { a = rng.int(2, max); b = rng.int(1, a - 1); }
      /* b is never 0: "3 + 0 = 3" and "3 − 0 = 3" would both be right */
      return { k: [d, a, op, b], a, b, c: calc(a, op, b), op, left: d === 4, dots: d === 1, answer: op, opts: ['+', '-'], fact: factOf(op, a, b) };
    },
    parts(q) { return q.two ? [q.a, 'o', q.b, 'o', q.c, '=', q.d] : q.left ? [q.c, '=', q.a, 'o', q.b] : [q.a, 'o', q.b, '=', q.c]; },
    geo(st) { const L = K.L(), two = st.q.two; return L ? { ew: two ? 720 : 540, eh: st.q.dots ? 240 : 190, ey: 150, cw: two ? 200 : 150, ch: two ? 140 : 150, cgap: two ? 32 : 110, cy: 560 } : { ew: two ? 668 : 540, eh: st.q.dots ? 240 : 190, ey: 272, cw: two ? 204 : 160, ch: two ? 140 : 160, cgap: two ? 24 : 100, cy: 730 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(st), cx = Stage.W / 2;
      if (st.eqCard) place(st.eqCard, cx - g.ew / 2, g.ey, g.ew, g.eh);
      (st.cards || []).forEach((c, i) => { const p = rowAt(st.cards.length, cx, g.cy, g.cw, g.ch, g.cgap)[i]; place(c, p.x, p.y, g.cw, g.ch); });
    },
    signFace(t, size) { return sym(t, size, t === '+' ? '#2E9E4F' : '#2E6FD8'); },
    present(st) {
      const q = st.q, P = !K.L();
      st.eqCard = panel(st, 4);
      const row = flex('row', P && q.two ? 8 : 12); st.slots = [];
      this.parts(q).forEach(t => {
        if (t === 'o') { const s = slotBox(q.two && P ? 76 : 86, q.two && P ? 76 : 86, true); s.appendChild(sym('?', 46, 'rgba(43,33,24,.35)')); st.slots.push(s); row.appendChild(s); }
        else if (typeof t === 'number') row.appendChild(numCol(t, q.dots ? 76 : q.two && P ? 72 : 86, q.dots, 1.35));
        else row.appendChild(sym(t, 58));
      });
      st.eqCard.appendChild(row);
      st.cards = q.opts.map((v, i) => {
        const c = W3X.card(st, 'card' + i, 6, 'card');
        if (!q.two) c.appendChild(this.signFace(v, 112));
        else { const r = flex('row', 12); v.split('').forEach(t => { const chip = slotBox(70, 70, false); chip.style.border = '4px solid ' + INK; chip.style.background = '#fff'; chip.appendChild(this.signFace(t, 60)); r.appendChild(chip); }); c.appendChild(r); }
        return c;
      });
      st.opts = q.opts.slice();
      this.place(st);
      K.pop(st, st.eqCard); st.cards.forEach((c, i) => K.pop(st, c, 200 + 80 * i));
      K.task(st, [[W3X.ic('<circle cx="50" cy="50" r="38" fill="#FFF7D6" stroke="#2B2118" stroke-width="6" stroke-dasharray="10 7"/><path d="M32 50H68M50 32V68" stroke="#2E9E4F" stroke-width="10" stroke-linecap="round"/>')], ['q']]);
      K.say(st, q.two ? '填哪两个符号？' : '加还是减？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, c = st.cards[st.opts.indexOf(q.answer)];
      q.op.split('').forEach((t, i) => { const s = st.slots[i]; if (!s) return; s.innerHTML = ''; s.style.border = '0'; s.style.background = 'transparent'; s.appendChild(this.signFace(t, 70)); st.scope.anim(s, [{ transform: 'scale(.3)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: T(380) + 1, delay: T(140 * i), easing: EASE.pop }); });
      K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, st.eqCard, 14); Sfx.reveal(); this.cheerAll(st);
      st.summary = this.sumLine(q); Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1300));
    },
    sumLine(q) { return (q.two ? words([q.a, q.op[0], q.b, q.op[1], q.c, '=', q.d]) : words([q.a, q.op, q.b, '=', q.c])) + '！'; },
    wrongLine(q, ans) { if (q.two) return '这样等于' + CN[q.vals[q.opts.indexOf(ans)]]; return ans === '+' ? '加了会变多' : '减了会变少'; },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(this.wrongLine(st.q, ans)); await st.scope.wait(T(600)); },
    next(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
    workEls(st) { return st.cards || []; },
    snap(st) { return { op: st.q.op }; },
    lines() {
      const out = [this.intro, '加还是减？', '填哪两个符号？', '加了会变多', '减了会变少'].concat(this.praise);
      SUMS().forEach(s => { if (s[2] >= 1) out.push(words(s) + '！'); });
      for (let b = 1; b <= 4; b++) for (let c = 1; c <= 4; c++) { if (b === c || b + c > 5) continue; for (let a = b + c; a <= 10 - b - c; a++) ['++', '+-', '-+', '--'].forEach(s => out.push(this.sumLine({ two: true, a, b, c, op: s, d: calc(calc(a, s[0], b), s[1], c) }))); }
      for (let v = 0; v <= 10; v++) out.push('这样等于' + CN[v]);
      return uniq(out);
    },
  };

  /* ================================================================ F3 拼算式: tap the cards into the five boxes to build a true number sentence.
     Judged when the five boxes are full. evaluate(): ANY true sentence made of the given cards is right (2 + 3 = 5, 3 + 2 = 5,
     5 = 2 + 3 and, at L5, 5 − 3 = 2 all count) - nothing the child can rightly build is ever called wrong. */
  const CW = 108, CH = 132, SW = 122, SH = 146;
  const truth = t => {
    if (!Array.isArray(t) || t.length !== 5) return 'form';
    if ([0, 2, 4].some(i => typeof t[i] !== 'number') || [1, 3].some(i => typeof t[i] === 'number')) return 'form';
    const eqs = [t[1], t[3]].filter(x => x === '=').length;
    if (eqs !== 1) return 'noeq';
    const ok = t[1] === '=' ? t[0] === calc(t[2], t[3], t[4]) : calc(t[0], t[1], t[2]) === t[4];
    return ok ? 'ok' : 'false';
  };
  W4R.F3 = {
    kind0: 'build4', verb: '拼！', intro: '拼一个算式！', praise: ['算式拼对啦！'],
    /* L1 + and = (5, dots); L2 + and = (9, dots); L3 − too (10, numerals); L4 one more number card than needed; L5 that and
       all three signs (+ − =): the child picks the numbers and the operation */
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      const op = d <= 2 ? '+' : bagPick(G, 'f3o' + d, ['+', '-']);
      let a, b, c;
      for (let t = 0; t < 100; t++) {
        const hi = d === 1 ? 5 : d === 2 ? 9 : 10, lo = d === 2 ? 5 : 2;
        c = rng.int(lo, hi); a = rng.int(1, c - 1); b = c - a;           /* a + b = c */
        if (op === '-' && a === b) continue;
        break;
      }
      const sent = op === '+' ? [a, '+', b, '=', c] : [c, '-', a, '=', b];
      const nums = [a, b, c];
      if (d >= 4) { let x; do { x = rng.int(1, 9); } while (nums.includes(x)); nums.push(x); }
      const signs = d === 5 ? ['+', '-', '='] : [op, '='];
      const order = rng.shuffle(nums.map((_, i) => i));
      const cards = order.map(i => nums[i]).concat(signs);
      /* a false sentence for the test's "wrong" path: the same cards, the numbers moved round */
      const wrong = [[sent[4], sent[1], sent[0], '=', sent[2]], [sent[2], sent[1], sent[4], '=', sent[0]], [sent[0], sent[1], sent[4], '=', sent[2]]].find(s => truth(s) === 'false');
      return { k: [d, cards.join('')], d, op, sent, cards, nN: nums.length, nS: signs.length, dots: d <= 2, answer: sent.join(' '), wrong, fact: op === '+' ? factOf('+', a, b) : factOf('-', c, a) };
    },
    evaluate(st, ans) { return truth(ans) === 'ok'; },
    geo() { return K.L() ? { sy: 226, ny: 412, oy: 560, gap: 22, sgap: 12 } : { sy: 300, ny: 494, oy: 652, gap: 22, sgap: 9 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    slotXY(i) { const g = this.geo(); return rowAt(5, Stage.W / 2, g.sy, SW, SH, g.sgap)[i]; },
    homeXY(st, o) { const g = this.geo(); return o.row ? rowAt(st.q.nS, Stage.W / 2, g.oy, CW, CH, g.gap)[o.col] : rowAt(st.q.nN, Stage.W / 2, g.ny, CW, CH, g.gap)[o.col]; },
    place(st) {
      if (st.board) { const a = this.slotXY(0), b = this.slotXY(4); place(st.board, a.x - 14, a.y - 14, b.x + SW - a.x + 28, SH + 28); }
      (st.slots || []).forEach((e, i) => { const p = this.slotXY(i); place(e, p.x, p.y, SW, SH); });
      (st.cardsE || []).forEach(o => { if (o.at != null) { const p = this.slotXY(o.at); place(o.e, p.x + (SW - CW) / 2, p.y + (SH - CH) / 2, CW, CH); } else { const p = this.homeXY(st, o); place(o.e, p.x, p.y, CW, CH); } });
    },
    present(st) {
      const q = st.q;
      st.board = panel(st, 2); st.board.style.background = 'rgba(255,248,236,.96)';
      st.slots = Array.from({ length: 5 }, () => { const e = W2X.thing(st, 10, 10, 3, ''); Object.assign(e.style, { borderRadius: '20px', border: '5px dashed rgba(43,33,24,.5)', background: '#FFF7D6' }); return e; });
      st.cardsE = q.cards.map((v, i) => {
        const id = 'c' + i, e = W3X.card(st, id, 6, 'card'), isN = typeof v === 'number';
        e.appendChild(isN ? numCol(v, 62, q.dots, 1.3) : sym(v, 78, v === '=' ? INK : v === '+' ? '#2E9E4F' : '#2E6FD8'));
        return { id, e, v, row: isN ? 0 : 1, col: isN ? i : i - q.nN, at: null };
      });
      this.place(st);
      K.pop(st, st.board); st.slots.forEach((e, i) => K.pop(st, e, 40 * i)); st.cardsE.forEach((o, i) => K.pop(st, o.e, 200 + 50 * i));
      K.task(st, [[W3X.ic('<rect x="2" y="32" width="22" height="34" rx="5" fill="#FFF7D6" stroke="#2B2118" stroke-width="3.5" stroke-dasharray="5 3"/><path d="M27 49H35M31 45V53" stroke="#2E9E4F" stroke-width="4" stroke-linecap="round"/><rect x="39" y="32" width="22" height="34" rx="5" fill="#FFF7D6" stroke="#2B2118" stroke-width="3.5" stroke-dasharray="5 3"/><path d="M64 45H72M64 53H72" stroke="#2B2118" stroke-width="4" stroke-linecap="round"/><rect x="76" y="32" width="22" height="34" rx="5" fill="#FFF7D6" stroke="#2B2118" stroke-width="3.5" stroke-dasharray="5 3"/>')], ['q']]);
      K.say(st, '拼成对的算式！');
    },
    onGesture(st, name, p) {
      const id = p.id || ''; if (name !== 'tap' || st.done) return false;
      const o = (st.cardsE || []).find(x => x.id === id); if (!o) return false;
      if (o.at != null) { o.at = null; const h = this.homeXY(st, o); K.flyTo(st, o.e, h.x, h.y, 240, 20); Sfx.back(); return 'ok'; }
      const used = st.cardsE.filter(x => x.at != null).map(x => x.at), free = [0, 1, 2, 3, 4].find(i => !used.includes(i));
      if (free == null) return false;
      o.at = free; const s = this.slotXY(free);
      K.flyTo(st, o.e, s.x + (SW - CW) / 2, s.y + (SH - CH) / 2, 280, 30); Sfx.place();
      if (used.length + 1 === 5) {
        st.done = true;
        const ans = [0, 1, 2, 3, 4].map(i => st.cardsE.find(x => x.at === i).v);
        st.scope.timeout(() => { st.picked = true; Session.submit(st, ans); }, 420);
      }
      return 'ok';
    },
    inSlots(st) { return [0, 1, 2, 3, 4].map(i => st.cardsE.find(x => x.at === i)).filter(Boolean); },
    async reveal(st) {
      const my = st, row = this.inSlots(st);
      K.ring(st, row.map(o => box(o.e)), 12, '#FFC93C'); Sfx.reveal();
      for (let i = 0; i < row.length; i++) { if (!Session.alive(my)) return; K.hop(st, row[i].e, 16); Sfx.mar(Sfx.SCALE[2 + i], 0, 0.3, 0.45); await st.scope.wait(T(160)); }
      this.cheerAll(st);
      const t = st.answer, n = t[1] === '=' ? [t[2], t[3], t[4], '=', t[0]] : t;          /* "5 = 2 + 3" is said the usual way round */
      st.summary = words(n) + '！'; Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1300));
    },
    wrongLine(ans) { const t = truth(ans); return t === 'form' ? '数和符号要隔开' : t === 'noeq' ? '要有一个等号' : '两边不一样多'; },
    async feedback(st, ans) { this.inSlots(st).forEach(o => K.wiggle(st, o.e)); W3X.say(this.wrongLine(ans)); await st.scope.wait(T(600)); },
    next(st, strat) {
      if (st.done || !st.cardsE) return null;
      const want = strat === 'wrong' ? st.q.wrong : st.q.sent;
      for (let i = 0; i < 5; i++) { const o = st.cardsE.find(x => x.at === i); if (o && o.v !== want[i]) return { g: 'tap', p: { id: o.id } }; }
      const used = st.cardsE.filter(x => x.at != null).map(x => x.at), free = [0, 1, 2, 3, 4].find(i => !used.includes(i));
      const o = free == null ? null : st.cardsE.find(x => x.at == null && x.v === want[free]);
      return o ? { g: 'tap', p: { id: o.id } } : null;
    },
    workEls(st) { return (st.cardsE || []).filter(o => o.at == null).map(o => o.e); },
    gestureHint(st) { if (st.slots) K.flash(st, st.slots.filter((_, i) => !(st.cardsE || []).some(o => o.at === i))); },      /* where the cards go (never which one) */
    snap(st) { return { placed: (st.cardsE || []).filter(o => o.at != null).length }; },
    lines() {
      const out = [this.intro, '拼成对的算式！', '数和符号要隔开', '要有一个等号', '两边不一样多'].concat(this.praise);
      for (let a = 1; a <= 9; a++) for (let b = 1; a + b <= 10; b++) { const c = a + b; out.push(words([a, '+', b, '=', c]) + '！', words([c, '-', a, '=', b]) + '！'); }
      return uniq(out);
    },
  };

  /* ================================================================ F4 符号代换 (reasoning): ★ = 2, ▲ = 3 - what is ★ + ▲? */
  const SHP = { star: { c: '#FFC93C', n: '星星', k: 'star' }, tri: { c: '#FF6B5B', n: '三角', k: 'tri' }, circle: { c: '#4FB3FF', n: '圆圈', k: 'circle' }, sq: { c: '#5CC46E', n: '方块', k: 'sq' } };
  const shapeSvg = (k, size) => { const s = svg('svg', { viewBox: '0 0 100 100', width: size, height: size }); W2X.shape(s, SHP[k].k, 50, 50, 36, SHP[k].c, 0, 6); s.style.pointerEvents = 'none'; s.style.flexShrink = '0'; s.style.overflow = 'visible'; return s; };
  W4R.F4 = {
    kind0: 'code4', verb: '换！', intro: '符号变成数！', praise: ['真会动脑筋！'],
    /* L1 one sign + a number (5, dots); L2 the sign twice (★ + ★); L3 two signs (★ + ▲); L4 three terms (★ + ★ + ▲); L5 the key
       is a sentence (★ + ★ = 6): find ★ first, then ★ + ▲ */
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, sh = rng.shuffle(Object.keys(SHP)), S = sh[0], T2 = sh[1];
      let keys, qs, vals;
      if (d === 1) { const a = rng.int(1, 4), b = rng.int(1, 5 - a); vals = { [S]: a }; keys = [[S, a]]; qs = rng.chance(0.5) ? [S, b] : [b, S]; }
      else if (d === 2) { const a = rng.int(1, 5); vals = { [S]: a }; keys = [[S, a]]; qs = [S, S]; }
      else if (d === 3) { let a, b; do { a = rng.int(1, 6); b = rng.int(1, 6); } while (a === b || a + b > 10); vals = { [S]: a, [T2]: b }; keys = [[S, a], [T2, b]]; qs = [S, T2]; }
      else if (d === 4) { let a, b; do { a = rng.int(1, 4); b = rng.int(1, 5); } while (a === b || 2 * a + b > 10); vals = { [S]: a, [T2]: b }; keys = [[S, a], [T2, b]]; qs = rng.shuffle([S, S, T2]); }
      else { let a, b; do { a = rng.int(1, 4); b = rng.int(1, 5); } while (a === b || a + b > 9); vals = { [S]: a, [T2]: b }; keys = [[S, S, 2 * a], [T2, b]]; qs = rng.chance(0.5) ? [S, T2] : [T2, S]; }
      const nums = qs.map(t => typeof t === 'number' ? t : vals[t]), ans = nums.reduce((x, y) => x + y, 0);
      return { k: [d, keys.map(k => k.join('=')).join(), qs.join('+')], d, keys, qs, vals, nums, find: d === 5 ? S : null, answer: ans, opts: numOptions(G, ans, 1, 10), dots: d <= 2, fact: nums.length === 2 ? factOf('+', nums[0], nums[1]) : undefined };
    },
    geo(st) { const L = K.L(); return L ? { ky: 112, kh: 150, qy: 290, qh: 140, cs: 136, cgap: 44, cy: 566 } : { ky: 208, kh: 160, qy: 404, qh: 150, cs: 150, cgap: 36, cy: 720 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(st), cx = Stage.W / 2;
      if (st.keyCards) { const n = st.keyCards.length, ws = st.keyW; const tot = ws.reduce((x, y) => x + y, 0) + (n - 1) * 24; let x = cx - tot / 2; st.keyCards.forEach((e, i) => { place(e, x, g.ky, ws[i], g.kh); x += ws[i] + 24; }); }
      if (st.qCard) place(st.qCard, cx - st.qW / 2, g.qy, st.qW, g.qh);
      (st.cards || []).forEach((c, i) => { const p = rowAt(st.cards.length, cx, g.cy, g.cs, g.cs, g.cgap)[i]; place(c, p.x, p.y, g.cs, g.cs); });
    },
    present(st) {
      const q = st.q, P = !K.L(), sz = P ? 74 : 80, nh = P ? 74 : 80;
      const tok = (t, h) => typeof t === 'number' ? numCol(t, h, q.dots) : shapeSvg(t, sz);
      st.keyCards = q.keys.map(k => {
        const e = panel(st, 4), r = flex('row', 10);
        if (k.length === 2) { r.appendChild(shapeSvg(k[0], sz)); r.appendChild(sym('=', 54)); r.appendChild(numCol(k[1], nh, q.dots)); }
        else { r.appendChild(shapeSvg(k[0], sz)); r.appendChild(sym('+', 50)); r.appendChild(shapeSvg(k[1], sz)); r.appendChild(sym('=', 54)); r.appendChild(numCol(k[2], nh, q.dots)); }
        e.appendChild(r); e.style.background = '#FFF1C2'; e.style.borderColor = '#FFC93C'; return e;
      });
      st.keyW = q.keys.map(k => k.length === 2 ? 250 : 380);
      if (P && q.keys.length === 2 && st.keyW[0] + st.keyW[1] > 600) st.keyW = [350, 230];
      st.qCard = panel(st, 4); const r = flex('row', 12); st.qToks = [];
      q.qs.forEach((t, i) => { if (i) r.appendChild(sym('+', 54)); const w = flex(); w.appendChild(tok(t, nh)); r.appendChild(w); st.qToks.push({ w, t }); });
      r.appendChild(sym('=', 54)); st.qSlot = slotBox(78, 92, false); st.qSlot.appendChild(sym('?', 54, 'rgba(43,33,24,.4)')); r.appendChild(st.qSlot);
      st.qCard.appendChild(r);
      st.qW = q.qs.length === 3 ? 560 : 440;
      K.cards(st, q.opts, { size: this.geo(st).cs, gap: 40, cx: Stage.W / 2, cy: this.geo(st).cy, numOnly: !q.dots });
      this.place(st);
      st.keyCards.forEach((e, i) => K.pop(st, e, 100 * i)); K.pop(st, st.qCard, 260);
      K.task(st, [[W3X.ic('<polygon points="22,22 42,62 2,62" fill="#FF6B5B" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/><path d="M48 44H60M54 37L61 44L54 51" fill="none" stroke="#2B2118" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="66" y="22" width="32" height="44" rx="7" fill="#fff" stroke="#2B2118" stroke-width="4"/><text x="82" y="58" font-size="34" font-weight="900" text-anchor="middle" fill="#E8414B" font-family="system-ui,sans-serif">3</text>')], ['q']]);
      if (q.find) W3X.say2(st, '先想' + SHP[q.find].n + '是几。', '问号是几？'); else K.say(st, '问号是几？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, P = !K.L();
      for (let i = 0; i < st.qToks.length; i++) {
        const o = st.qToks[i]; if (typeof o.t === 'number') continue;
        if (!Session.alive(my)) return;
        o.w.innerHTML = ''; o.w.appendChild(numCol(q.vals[o.t], P ? 74 : 80, q.dots));
        st.scope.anim(o.w, [{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0)' }], { duration: T(260) + 1, easing: EASE.out });
        Sfx.pop(); await st.scope.wait(T(220));
      }
      if (!Session.alive(my)) return;
      st.qSlot.innerHTML = ''; st.qSlot.style.border = '0'; st.qSlot.style.background = 'transparent'; st.qSlot.appendChild(UI.num(q.answer, P ? 74 : 80));
      const c = st.cards[st.opts.indexOf(q.answer)]; if (c) K.ring(st, [box(c)], 6, '#FFC93C');
      K.hop(st, st.qCard, 14); Sfx.reveal(); this.cheerAll(st);
      st.summary = this.sumLine(q.nums); Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1300));
    },
    sumLine(nums) { return nums.map(n => CN[n]).join('加') + '等于' + CN[nums.reduce((x, y) => x + y, 0)] + '！'; },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CN[ans]); await st.scope.wait(T(600)); },
    next(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { if (st.keyCards) K.flash(st, st.keyCards); },          /* look at the keys (never the answer) */
    snap(st) { return { terms: st.q.qs.length }; },
    lines() {
      const out = [this.intro, '问号是几？'].concat(this.praise);
      Object.keys(SHP).forEach(k => out.push('先想' + SHP[k].n + '是几。'));
      for (let a = 1; a <= 9; a++) for (let b = 1; a + b <= 10; b++) out.push(this.sumLine([a, b]));
      for (let a = 1; a <= 4; a++) for (let b = 1; b <= 5; b++) { if (a === b || 2 * a + b > 10) continue; out.push(this.sumLine([a, a, b]), this.sumLine([a, b, a]), this.sumLine([b, a, a])); }
      for (let n = 0; n <= 10; n++) out.push('不是' + CN[n]);
      return uniq(out);
    },
  };
})();
/* ================================================================ ② Bluey·星球 (5 以内加, from 1): I1 流星装罐 · I2 举手指 · I3 两格漫画 ·
   I4 数图形 (reasoning). Everything inside one function: no top-level names (all islands share one script). */
(() => {
  const INK = '#2B2118';
  const lvOf = o => Math.min(5, Math.max(1, o.level || 1));
  const flex = (dir, gap) => { const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: dir || 'row', alignItems: 'center', justifyContent: 'center', gap: (gap || 0) + 'px', pointerEvents: 'none' }); return d; };
  const sym = (t, size, color) => { const o = el('span', ''); o.textContent = t === '-' ? '−' : t; Object.assign(o.style, { font: '900 ' + size + 'px/1 system-ui, sans-serif', color: color || INK, pointerEvents: 'none' }); return o; };
  const rowAt = (n, cx, cy, w, h, gap) => { const tot = n * w + (n - 1) * gap; return Array.from({ length: n }, (_, i) => ({ x: Math.round(cx - tot / 2 + i * (w + gap)), y: Math.round(cy - h / 2) })); };
  const panel = (st, z) => { const e = W2X.thing(st, 10, 10, z || 4, 'card'); Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }); return e; };
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
  const sumLine = (a, b) => CN[a] + '加' + CN[b] + '等于' + CN[a + b] + '！';
  const numCards = (st, opts, g, numOnly) => K.cards(st, opts, { size: g.cs, gap: g.cgap || 40, cx: g.cx || Stage.W / 2, cy: g.cy, numOnly });
  const cardRow = (st, g) => (st.cards || []).forEach((c, i) => { const p = g.col ? { x: g.cx - g.cs / 2, y: Math.round(g.cy - (st.cards.length * g.cs + (st.cards.length - 1) * g.cgap) / 2 + i * (g.cs + g.cgap)) } : rowAt(st.cards.length, g.cx, g.cy, g.cs, g.cs, g.cgap)[i]; place(c, p.x, p.y, g.cs, g.cs); });
  const pickCard = (st, strat) => { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; };

  /* ================================================================ I1 流星装罐: stars fall into a jar; the jar gets covered - how many are inside? */
  const JW = 240, JH = 300, STAR = 52;
  const JAR_BODY = 'M72 40V58Q34 66 34 104V262Q34 290 62 290H178Q206 290 206 262V104Q206 66 168 58V40Z';
  W4R.I1 = {
    kind0: 'jar4', verb: '装！', intro: '流星装进罐子！', praise: ['记得真牢！'], props: ['shootingstar'],
    /* L1 sum 3, all seen; L2 sum 5, the jar is covered after both drops; L3 sum 5, covered before the second drop (count on);
       L4 sum 7, the same; L5 three drops after the cover (a + b + c <= 9) */
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, hi = [0, 3, 5, 5, 7, 9][d];
      let a, b, c = 0;
      for (let t = 0; t < 200; t++) {
        a = rng.int(1, hi - 1); b = rng.int(1, hi - a); c = d === 5 ? rng.int(1, Math.max(1, hi - a - b)) : 0;
        if (a + b + c > hi || (d === 5 && hi - a - b < 1)) continue;
        if ((d >= 2 && a + b + c < 3) || (d >= 4 && a + b + c < 5)) continue;
        break;
      }
      const n = a + b + c, v = rng.int(0, 2);
      return { k: [d, a, b, c, v], d, a, b, c, n, v, drops: c ? [a, b, c] : [a, b], cover: d === 1 ? -1 : d === 2 ? 2 : 1, answer: n, opts: numOptions(G, n, 1, d === 1 ? 5 : 10), fact: c ? undefined : factOf('+', a, b) };
    },
    geo() { return K.L() ? { jx: 266, jy: 318, hy: 196, cs: 136, cgap: 24, cx: 780, cy: 372, col: true } : { jx: 232, jy: 404, hy: 288, cs: 136, cgap: 34, cx: 352, cy: 800 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    slotXY(i) { const g = this.geo(), col = i % 3, row = Math.floor(i / 3); return { x: g.jx + 120 + (col - 1) * 54 - STAR / 2, y: g.jy + 262 - row * 52 - STAR / 2 }; },
    place(st) {
      const g = this.geo();
      if (st.jar) place(st.jar, g.jx, g.jy, JW, JH);
      if (st.coverEl) place(st.coverEl, g.jx, g.jy, JW, JH);
      (st.inside || []).forEach((e, i) => { const p = this.slotXY(i); place(e, p.x, p.y, STAR, STAR); });
      (st.flying || []).forEach(o => { const r = Math.floor(o.k / 4), c = g.jx + JW / 2 + [-36, 0, 36][st.q.v], p = rowAt(Math.min(4, o.n - 4 * r), c, g.hy + (r - (Math.ceil(o.n / 4) - 1) / 2) * 74, 66, 66, 10)[o.k % 4]; if (!o.gone) place(o.e, p.x, p.y, 66, 66); });
      cardRow(st, g);
    },
    jarSvg() {
      const s = svg('svg', { viewBox: '0 0 240 300', width: '100%', height: '100%' }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
      svg('path', { d: JAR_BODY, fill: 'rgba(222,243,255,.6)', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s);
      svg('rect', { x: 62, y: 18, width: 116, height: 26, rx: 9, fill: 'rgba(200,232,255,.85)', stroke: INK, 'stroke-width': 6 }, s);
      svg('path', { d: 'M56 112V250', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.8 }, s);
      return s;
    },
    coverSvg() {
      const s = svg('svg', { viewBox: '0 0 240 300', width: '100%', height: '100%' }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
      svg('path', { d: 'M40 76Q60 62 120 62Q180 62 200 76V262Q200 290 172 290H68Q40 290 40 262Z', fill: '#F59A4A', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, s);
      [112, 160, 208, 250].forEach(y => svg('path', { d: 'M42 ' + y + 'H198', stroke: '#D9762B', 'stroke-width': 12 }, s));
      svg('path', { d: 'M40 76Q60 62 120 62Q180 62 200 76', fill: 'none', stroke: INK, 'stroke-width': 6 }, s);
      return s;
    },
    star(z) { const e = K.item(Stage.el, 'assets/props/shootingstar.png', STAR, STAR); e.style.zIndex = z; return e; },
    async drop(st, n) {
      const my = st, g = this.geo(), list = Array.from({ length: n }, (_, k) => ({ e: this.star(5), n, k, gone: false }));
      list.forEach(o => st.els.push(o.e));
      st.flying = list; this.place(st);
      list.forEach((o, k) => K.pop(st, o.e, 70 * k)); Sfx.sparkle && Sfx.sparkle();
      await st.scope.wait(T(1300));
      if (!Session.alive(my)) return;
      const mouth = { x: g.jx + JW / 2 - 33, y: g.jy - 6 };
      await Promise.all(list.map((o, k) => (async () => {
        await st.scope.wait(T(220 * k)); if (!Session.alive(my)) return;
        await K.flyTo(st, o.e, mouth.x, mouth.y, 300, 30); if (!Session.alive(my)) return;
        const i = st.inside.length; st.inside.push(o.e); o.gone = true;
        const p = this.slotXY(i); o.e.style.width = o.e.style.height = STAR + 'px';
        await K.flyTo(st, o.e, p.x, p.y, 260, 0); Sfx.place();
      })()));
      st.flying = [];
    },
    async present(st) {
      const q = st.q, my = st;
      st.inside = []; st.flying = [];
      st.jar = W2X.thing(st, JW, JH, 4, ''); st.jar.appendChild(this.jarSvg());
      st.coverEl = W2X.thing(st, JW, JH, 6, ''); st.coverEl.appendChild(this.coverSvg()); st.coverEl.style.visibility = 'hidden'; st.coverEl.style.transformOrigin = '50% 0';
      this.place(st); K.pop(st, st.jar);
      K.task(st, [['assets/props/shootingstar.png'], [W3X.ic('<path d="M28 18H72V30Q90 36 90 56V82Q90 92 80 92H20Q10 92 10 82V56Q10 36 28 30Z" fill="#F59A4A" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/>')], ['q']]);
      await st.scope.wait(T(500)); if (!Session.alive(my)) return;
      for (let i = 0; i < q.drops.length; i++) {
        if (i === q.cover) { await this.cover(st); if (!Session.alive(my)) return; }
        W3X.tip(i === 0 ? '流星来啦！' : '又来流星啦！');
        await this.drop(st, q.drops[i]); if (!Session.alive(my)) return;
        await st.scope.wait(T(500)); if (!Session.alive(my)) return;
      }
      if (q.cover === q.drops.length) { await this.cover(st); if (!Session.alive(my)) return; }
      numCards(st, q.opts, this.geo(), q.d >= 4);
      this.place(st);
      K.say(st, '罐里一共几颗？');
    },
    async cover(st) {
      W3X.tip('盖上罐子！'); st.covered = true; st.coverEl.style.visibility = '';
      Sfx.whoosh(0.3);
      await st.scope.anim(st.coverEl, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: T(520) + 1, easing: EASE.out });
      await st.scope.wait(T(500));
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, c = st.cards[st.opts.indexOf(q.answer)];
      if (c) K.ring(st, [box(c)], 6, '#FFC93C');
      if (st.covered) { await st.scope.anim(st.coverEl, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: T(420) + 1, easing: EASE.glide, fill: 'forwards' }); if (!Session.alive(my)) return; st.coverEl.style.visibility = 'hidden'; }
      Sfx.reveal();
      for (let i = 0; i < st.inside.length; i++) { if (!Session.alive(my)) return; K.hop(st, st.inside[i], 12); await Count.beat(st.scope, 240, i + 1); }
      this.cheerAll(st);
      st.summary = '一共' + CNQ(q.n) + '颗！'; Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1200));
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CNQ(ans) + '颗'); await st.scope.wait(T(600)); },
    next(st, strat) { return pickCard(st, strat); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { n: st.q.n, covered: !!st.covered }; },
    lines() {
      const out = [this.intro, '流星来啦！', '又来流星啦！', '盖上罐子！', '罐里一共几颗？'].concat(this.praise);
      for (let n = 1; n <= 9; n++) out.push('一共' + CNQ(n) + '颗！');
      for (let n = 0; n <= 10; n++) out.push('不是' + CNQ(n) + '颗');
      return uniq(out);
    },
  };

  /* ================================================================ I2 举手指: two hands hold up a and b fingers - how many fingers? */
  const SKIN = '#FFD9B8';
  const FINGERS = [          /* raised in this order: index, middle, ring, little finger, thumb (a left hand, thumb on the right) */
    { x: 141, y: 130, a: 14, w: 26, up: 84 }, { x: 114, y: 123, a: 4, w: 26, up: 94 }, { x: 87, y: 125, a: -7, w: 25, up: 86 }, { x: 62, y: 135, a: -19, w: 22, up: 68 },
  ];
  const handSvg = (n, mirror, sleeve) => {
    const s = svg('svg', { viewBox: '0 0 200 260', width: '100%', height: '100%' }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
    const g = svg('g', mirror ? { transform: 'translate(200 0) scale(-1 1)' } : {}, s);
    FINGERS.forEach((f, i) => { const len = i < n ? f.up : 22; svg('rect', { x: -f.w / 2, y: -len, width: f.w, height: len + 26, rx: f.w / 2, fill: SKIN, stroke: INK, 'stroke-width': 5, transform: 'translate(' + f.x + ' ' + f.y + ') rotate(' + f.a + ')' }, g); });
    if (n >= 5) svg('rect', { x: -14, y: -66, width: 28, height: 86, rx: 14, fill: SKIN, stroke: INK, 'stroke-width': 5, transform: 'translate(150 188) rotate(58)' }, g);
    svg('path', { d: 'M46 140Q46 118 70 118H134Q158 118 158 142V196Q158 226 128 230H76Q46 226 46 196Z', fill: SKIN, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    if (n < 5) svg('path', { d: 'M150 170Q132 168 120 184Q114 196 128 198Q146 196 156 186', fill: SKIN, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    svg('rect', { x: 58, y: 222, width: 88, height: 36, rx: 8, fill: sleeve, stroke: INK, 'stroke-width': 5 }, g);
    return s;
  };
  W4R.I2 = {
    kind0: 'hands4', verb: '举！', intro: '举起小手指！', praise: ['手指算得快！'],
    /* L1 sum 5; L2 sum 7; L3 the hands show for two seconds, then close (remember); L4 one hand is a number card; L5 both are
       numbers (sum 6-10) */
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, lo = [0, 2, 4, 4, 5, 6][d], hi = [0, 5, 7, 8, 9, 10][d];
      let a, b;
      for (let t = 0; t < 200; t++) { a = rng.int(1, 5); b = rng.int(1, 5); if (a + b >= lo && a + b <= hi) break; }
      const n = a + b;
      return { k: [d, a, b], d, a, b, n, kinds: d <= 3 ? ['hand', 'hand'] : d === 4 ? (rng.chance(0.5) ? ['num', 'hand'] : ['hand', 'num']) : ['num', 'num'], flash: d === 3 || d === 4, answer: n, opts: numOptions(G, n, 1, 10), fact: factOf('+', a, b) };
    },
    geo() { return K.L() ? { pw: 240, ph: 290, py: 112, gap: 36, cs: 136, cgap: 40, cy: 548 } : { pw: 262, ph: 310, py: 214, gap: 28, cs: 150, cgap: 36, cy: 700 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(), cx = Stage.W / 2;
      (st.panels || []).forEach((e, i) => place(e, i ? cx + g.gap / 2 : cx - g.gap / 2 - g.pw, g.py, g.pw, g.ph));
      if (st.plus) place(st.plus, cx - 30, g.py + g.ph / 2 - 30, 60, 60);
      cardRow(st, Object.assign({ cx }, g));
    },
    fill(st, i, up) {
      const q = st.q, e = st.panels[i], v = i ? q.b : q.a; e.innerHTML = '';
      if (q.kinds[i] === 'num') { const c = flex('column', 6), m = flex(); c.appendChild(UI.num(v, 140)); m.style.width = '84px'; m.style.height = '100px'; m.appendChild(handSvg(0, i === 1, i ? '#F59A4A' : '#4FB3FF')); c.appendChild(m); e.appendChild(c); return; }
      const h = flex(); h.style.width = '86%'; h.style.height = '92%'; h.appendChild(handSvg(up ? v : 0, i === 1, i ? '#F59A4A' : '#4FB3FF')); e.appendChild(h);
    },
    async present(st) {
      const q = st.q, my = st;
      st.panels = [panel(st, 4), panel(st, 4)];
      st.plus = W2X.thing(st, 60, 60, 5, ''); Object.assign(st.plus.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#FFC93C', boxShadow: '0 0 0 4px ' + INK }); st.plus.appendChild(sym('+', 46));
      st.panels.forEach((_, i) => this.fill(st, i, true));
      this.place(st); K.pop(st, st.panels[0]); K.pop(st, st.panels[1], 120); K.pop(st, st.plus, 220);
      K.task(st, [[W3X.ic('<rect x="30" y="14" width="13" height="46" rx="6.5" fill="#FFD9B8" stroke="#2B2118" stroke-width="4"/><rect x="46" y="8" width="13" height="52" rx="6.5" fill="#FFD9B8" stroke="#2B2118" stroke-width="4"/><rect x="62" y="40" width="13" height="20" rx="6.5" fill="#FFD9B8" stroke="#2B2118" stroke-width="4"/><rect x="78" y="44" width="13" height="16" rx="6.5" fill="#FFD9B8" stroke="#2B2118" stroke-width="4"/><path d="M24 58Q24 48 36 48H78Q90 48 90 60V78Q90 92 76 92H38Q24 92 24 78Z" fill="#FFD9B8" stroke="#2B2118" stroke-width="4"/>')], ['q']]);
      if (q.flash) {
        W3X.tip('看好手指！');
        await st.scope.wait(T(2000)); if (!Session.alive(my)) return;
        st.panels.forEach((_, i) => { if (q.kinds[i] === 'hand') { this.fill(st, i, false); st.scope.anim(st.panels[i], [{ transform: 'translateY(0)' }, { transform: 'translateY(14px)' }, { transform: 'translateY(0)' }], { duration: T(300) + 1 }); } });
        st.closed = true; Sfx.whoosh(0.25);
        await st.scope.wait(T(400)); if (!Session.alive(my)) return;
      }
      numCards(st, q.opts, Object.assign({ cx: Stage.W / 2 }, this.geo()), q.d >= 3);
      this.place(st);
      K.say(st, '一共几根手指？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, c = st.cards[st.opts.indexOf(q.answer)];
      if (st.closed) st.panels.forEach((_, i) => this.fill(st, i, true));
      st.panels.forEach((e, i) => K.hop(st, e, 16 + 4 * i));
      if (c) K.ring(st, [box(c)], 6, '#FFC93C'); Sfx.reveal(); this.cheerAll(st);
      st.summary = sumLine(q.a, q.b); Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1300));
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CNQ(ans) + '根'); await st.scope.wait(T(600)); },
    next(st, strat) { return pickCard(st, strat); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { kinds: st.q.kinds.join() }; },
    lines() {
      const out = [this.intro, '看好手指！', '一共几根手指？'].concat(this.praise);
      for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) out.push(sumLine(a, b));
      for (let n = 0; n <= 10; n++) out.push('不是' + CNQ(n) + '根');
      return uniq(out);
    },
  };

  /* ================================================================ I3 两格漫画: frame 1 "there are a", frame 2 "b more come" - how many now? */
  const PETS = [['duck', '小鸭'], ['chick', '小鸡'], ['bunny', '小兔'], ['kitten', '小猫']];
  W4R.I3 = {
    kind0: 'comic4', verb: '看！', intro: '看两格漫画！', praise: ['看得真明白！'], props: ['duck', 'chick', 'bunny', 'kitten'],
    /* L1 sum 3, the story told with its numbers; L2 sum 5; L3 the story without numbers (count the frames yourself); L4 which
       number sentence (a + b = c, a + b = c ± 1, a − b = c); L5 frame 2 is "now there are c": how many came? */
    gen(G, o) {
      const d = lvOf(o), rng = o.rng, hi = d === 1 ? 3 : 5, pet = bagPick(G, 'i3p', [0, 1, 2, 3]);
      let a, b; do { a = rng.int(1, hi - 1); b = rng.int(1, hi - a); } while (d >= 2 && a + b < 3);
      const c = a + b, q = { k: [d, a, b, pet], d, a, b, c, pet, told: d !== 3, fact: factOf('+', a, b) };
      if (d === 4) {
        const ok = { s: [a, '+', b, '=', c], why: 'ok' }, res = { s: [a, '+', b, '=', c + (rng.chance(0.5) ? 1 : -1)], why: 'res' }, op = { s: [Math.max(a, b), '-', Math.min(a, b), '=', c], why: 'op' };
        const eqs = rng.shuffle([ok, res, op]);
        return Object.assign(q, { eqs, answer: eqs.indexOf(ok), opts: [0, 1, 2] });
      }
      const ans = d === 5 ? b : c;
      return Object.assign(q, { ask: d === 5 ? 'came' : 'now', answer: ans, opts: numOptions(G, ans, 1, d === 5 ? 5 : 6) });
    },
    geo(st) {
      const L = K.L(), eq = st && st.q && st.q.eqs;
      return L ? { pw: 400, ph: 290, py: eq ? 108 : 118, gap: 44, ani: 84, cs: 136, cgap: 40, cy: 556, ew: 250, eh: 108, ey: 470 }
        : { pw: 326, ph: 300, py: 214, gap: 20, ani: 66, cs: 150, cgap: 36, cy: 690, ew: 420, eh: 100, ey: 560 };
    },
    decor(G) { const st = Session.st && Session.st.G === G ? Session.st : null; if (st && st.q && st.q.eqs && K.L()) W2X.hideAll(G, this.chars); else W3X.decor2(G, this.chars); },
    /* where a pet stands in a frame: the first ones on the top row, the newcomers on the bottom row */
    spot(st, f, i, n, row) { const g = this.geo(st), x0 = f ? Stage.W / 2 + g.gap / 2 : Stage.W / 2 - g.gap / 2 - g.pw, per = Math.max(n, 1); const cx = x0 + g.pw / 2 + (i - (per - 1) / 2) * (g.ani + 8), cy = g.py + g.ph * (row ? 0.72 : 0.32); return { x: cx - g.ani / 2, y: cy - g.ani / 2 }; },
    place(st) {
      const g = this.geo(st), cx = Stage.W / 2, q = st.q;
      (st.frames || []).forEach((e, i) => place(e, i ? cx + g.gap / 2 : cx - g.gap / 2 - g.pw, g.py, g.pw, g.ph));
      if (st.arrow) place(st.arrow, cx - 34, g.py + g.ph / 2 - 34, 68, 68);
      if (st.band) { const p0 = this.spot(st, 1, 0, q.b, 1), p1 = this.spot(st, 1, q.b - 1, q.b, 1), fx = cx + g.gap / 2 + g.pw, room = fx - (p1.x + g.ani + 10) >= 50; place(st.band, p0.x - 10, p0.y - 8, p1.x + g.ani - p0.x + 20, g.ani + 16); if (room) place(st.inArrow, p1.x + g.ani + 10, p0.y + g.ani / 2 - 20, 44, 40); else place(st.inArrow, p1.x + g.ani - 40, p0.y - 46, 44, 40); }          /* no room on the right: above the last newcomer */
      (st.pets || []).forEach(o => { const p = q.d === 5 && o.f === 1 ? this.spot(st, 1, o.i % 3, Math.min(3, q.c - 3 * Math.floor(o.i / 3)), Math.floor(o.i / 3)) : this.spot(st, o.f, o.i, o.row ? q.b : q.a, o.row); place(o.e, p.x, p.y, g.ani, g.ani); });
      if (q.eqs && st.cards) st.cards.forEach((c, i) => { const p = K.L() ? rowAt(3, cx, g.ey + g.eh / 2, g.ew, g.eh, 20)[i] : { x: cx - g.ew / 2, y: g.ey + i * (g.eh + 14) }; place(c, p.x, p.y, g.ew, g.eh); });
      else cardRow(st, Object.assign({ cx }, g));
    },
    pet(st, f, i, row) {
      const g = this.geo(st), e = W2X.thing(st, g.ani, g.ani, 6, '');
      const im = img('assets/props/' + PETS[st.q.pet][0] + '.png', '', e); Object.assign(im.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'contain' });
      return { e, f, i, row };
    },
    eqNode(s) { const r = flex('row', 8); s.forEach(t => r.appendChild(typeof t === 'number' ? UI.num(t, 52) : sym(t, 40))); return r; },
    async present(st) {
      const q = st.q, my = st, nm = PETS[q.pet][1];
      this.layout(st.G);
      st.frames = [panel(st, 4), panel(st, 4)];
      st.arrow = W2X.thing(st, 68, 68, 5, ''); Object.assign(st.arrow.style, { borderRadius: '50%', background: '#FFC93C', boxShadow: '0 0 0 4px ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center' });
      st.arrow.innerHTML = '<svg viewBox="0 0 40 40" width="44" height="44"><path d="M6 20H30M21 10L32 20L21 30" fill="none" stroke="#2B2118" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      st.pets = [];
      for (let i = 0; i < q.a; i++) st.pets.push(this.pet(st, 0, i, 0));
      this.place(st);
      K.pop(st, st.frames[0]); st.pets.forEach((o, i) => K.pop(st, o.e, 120 + 60 * i));
      K.task(st, [['assets/props/' + PETS[q.pet][0] + '.png'], [W3X.ic('<rect x="4" y="22" width="40" height="56" rx="6" fill="#fff" stroke="#2B2118" stroke-width="5"/><rect x="56" y="22" width="40" height="56" rx="6" fill="#fff" stroke="#2B2118" stroke-width="5"/><path d="M40 50H60M53 43L60 50L53 57" fill="none" stroke="#2B2118" stroke-width="4" stroke-linecap="round"/>')], ['q']]);
      W3X.tip(q.told ? '有' + CNQ(q.a) + '只' + nm + '。' : '有一些' + nm + '。');
      await st.scope.wait(T(1600)); if (!Session.alive(my)) return;
      K.pop(st, st.frames[1]); K.pop(st, st.arrow, 100);
      const add = [];
      if (q.d === 5) { for (let i = 0; i < q.c; i++) add.push(this.pet(st, 1, i, 0)); }
      else { for (let i = 0; i < q.a; i++) add.push(this.pet(st, 1, i, 0)); for (let i = 0; i < q.b; i++) add.push(Object.assign(this.pet(st, 1, i, 1), { isNew: true })); }
      if (q.d !== 5) {          /* the newcomers: on a band of their own, an arrow shows where they came from */
        st.band = W2X.thing(st, 10, 10, 5, ''); Object.assign(st.band.style, { borderRadius: '18px', background: 'rgba(79,179,255,.18)', border: '4px dashed #2E6FD8' });
        st.inArrow = W2X.thing(st, 44, 40, 7, ''); st.inArrow.innerHTML = '<svg viewBox="0 0 44 40" width="44" height="40"><path d="M40 20H8M18 8L6 20L18 32" fill="none" stroke="#2B2118" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 20H8M18 8L6 20L18 32" fill="none" stroke="#4FB3FF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
      st.pets = st.pets.concat(add); this.place(st);
      if (st.band) { K.pop(st, st.band, 300); st.scope.anim(st.inArrow, [{ transform: 'translateX(40px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: T(500) + 1, delay: T(300), easing: EASE.out, fill: 'backwards' }); }
      add.forEach((o, i) => { if (o.isNew) st.scope.anim(o.e, [{ transform: 'translateX(' + 220 + 'px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: T(700) + 1, delay: T(300 + 150 * i), easing: EASE.glide, fill: 'backwards' }); else K.pop(st, o.e, 60 * i); });
      W3X.tip(q.told && q.d !== 5 ? '又来了' + CNQ(q.b) + '只！' : '又来了一些！');
      await st.scope.wait(T(1500)); if (!Session.alive(my)) return;
      if (q.eqs) {
        st.cards = q.eqs.map((o, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(this.eqNode(o.s)); K.pop(st, c, 80 * i); return c; });
        st.opts = [0, 1, 2]; this.place(st);
        K.say(st, '哪个算式对？');
      } else {
        numCards(st, q.opts, Object.assign({ cx: Stage.W / 2 }, this.geo(st)), q.d >= 3); this.place(st);
        if (q.ask === 'came') W3X.say2(st, '现在有' + CNQ(q.c) + '只。', '来了几只？'); else K.say(st, '现在几只？');
      }
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, c = st.cards[st.opts.indexOf(q.answer)];
      if (c) K.ring(st, [box(c)], 6, '#FFC93C'); Sfx.reveal();
      const here = st.pets.filter(o => o.f === 1), news = q.d === 5 ? here.slice(q.a) : here.filter(o => o.row);
      const list = q.ask === 'came' ? news : here;
      for (let i = 0; i < list.length; i++) { if (!Session.alive(my)) return; K.hop(st, list[i].e, 14); await Count.beat(st.scope, 240, i + 1); }
      this.cheerAll(st);
      st.summary = q.ask === 'came' ? '来了' + CNQ(q.b) + '只！' : sumLine(q.a, q.b); Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1200));
    },
    wrongLine(q, ans) { if (!q.eqs) return '不是' + CNQ(ans) + '只'; const o = q.eqs[ans]; return o.why === 'op' ? '是来了，不是走了' : CN[o.s[0]] + '加' + CN[o.s[2]] + '不等于' + CN[o.s[4]]; },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(this.wrongLine(st.q, ans)); await st.scope.wait(T(600)); },
    next(st, strat) { return pickCard(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { if (st.frames) K.flash(st, st.frames); },
    snap(st) { return { ask: st.q.ask || 'eq' }; },
    lines() {
      const out = [this.intro, '又来了一些！', '现在几只？', '哪个算式对？', '来了几只？', '是来了，不是走了'].concat(this.praise);
      PETS.forEach(p => { out.push('有一些' + p[1] + '。'); for (let a = 1; a <= 4; a++) out.push('有' + CNQ(a) + '只' + p[1] + '。'); });
      for (let b = 1; b <= 4; b++) out.push('又来了' + CNQ(b) + '只！', '来了' + CNQ(b) + '只！');
      for (let c = 2; c <= 5; c++) out.push('现在有' + CNQ(c) + '只。');
      for (let a = 1; a <= 4; a++) for (let b = 1; a + b <= 5; b++) { out.push(sumLine(a, b)); [a + b - 1, a + b + 1].forEach(x => out.push(CN[a] + '加' + CN[b] + '不等于' + CN[x])); }
      for (let n = 0; n <= 7; n++) out.push('不是' + CNQ(n) + '只');
      return uniq(out);
    },
  };

  /* ================================================================ I4 数图形 (reasoning): a line drawing - how many triangles / squares?
     L1 shapes apart; L2 more, sizes and turns, look-alikes (a long rectangle is not a square); L3 a big triangle cut in two
     (3: the big one counts too); L4 that and a square cut corner to corner (2 more); L5 a 2 x 2 grid of squares (5) */
  const VB = { w: 500, h: 400 };
  const triPts = (cx, cy, r, rot) => { const P = [[0, -r], [r * 0.95, r * 0.72], [-r * 0.95, r * 0.72]], a = (rot || 0) * Math.PI / 180; return P.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]); };
  const sqPts = (cx, cy, s) => [[cx - s / 2, cy - s / 2], [cx + s / 2, cy - s / 2], [cx + s / 2, cy + s / 2], [cx - s / 2, cy + s / 2]];
  const rectPts = (cx, cy, w, h) => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  W4R.I4 = {
    kind0: 'shapes4', verb: '数！', intro: '数一数图形！', praise: ['一个不漏！'],
    gen(G, o) {
      const d = lvOf(o), rng = o.rng;
      const ask = d <= 2 ? bagPick(G, 'i4a' + d, ['tri', 'sq']) : d <= 4 ? 'tri' : 'sq';
      const items = [];          /* { kind, pts | c,r , count: [pts...] } every shape drawn; count = the shapes of the asked kind in it */
      const small = (kind, cx, cy, r, rot) => {
        if (kind === 'tri') { const p = triPts(cx, cy + r * 0.12, r, rot); return { kind, pts: p, count: ask === 'tri' ? [p] : [] }; }
        if (kind === 'sq') { const p = sqPts(cx, cy, r * 1.5); return { kind, pts: p, count: ask === 'sq' ? [p] : [] }; }
        if (kind === 'rect') { const p = rect(cx, cy, r); return { kind, pts: p, count: [] }; }
        return { kind: 'circle', c: [cx, cy], r: r * 0.85, count: [] };
      };
      const rect = (cx, cy, r) => rng.chance(0.5) ? rectPts(cx, cy, r * 2.0, r * 1.0) : rectPts(cx, cy, r * 1.0, r * 1.9);
      const other = () => ask === 'tri' ? rng.pick(['circle', 'sq']) : rng.pick(d === 2 ? ['circle', 'tri', 'rect'] : ['circle', 'tri']);
      let n;
      if (d <= 2) {
        const cells = d === 1 ? [[90, 110], [250, 110], [410, 110], [90, 290], [250, 290], [410, 290]] : [[68, 100], [190, 100], [312, 100], [434, 100], [68, 300], [190, 300], [312, 300], [434, 300]];
        n = d === 1 ? rng.int(2, 4) : rng.int(3, 6);
        const k = d === 1 ? rng.int(1, 2) : rng.int(2, 3), spots = rng.shuffle(cells).slice(0, n + k);
        spots.forEach(([x, y], i) => { const r = d === 1 ? 54 : rng.int(36, 52); items.push(small(i < n ? ask : other(), x, y, r, d === 2 && ask === 'tri' ? rng.pick([0, 90, 180, 270]) : 0)); });
      } else if (d <= 4) {
        const flip = rng.chance(0.5), bx = flip ? 360 : 140, A = [bx, 70], B = [bx + 120, 300], C = [bx - 120, 300], M = mid(B, C);
        items.push({ kind: 'split', pts: [A, B, C], lines: [[A, M]], count: [[A, M, C], [A, B, M], [A, B, C]] });
        const side = flip ? 125 : 375;          /* the other shapes keep clear of the big figure */
        let extra;
        if (d === 3) {
          extra = rng.int(0, 2);
          const cells = rng.shuffle([[side - 52, 112], [side + 52, 112], [side - 52, 282], [side + 52, 282]]);
          for (let i = 0; i < extra; i++) items.push(small('tri', cells[i][0], cells[i][1], 40, 0));
          items.push(small('circle', cells[extra][0], cells[extra][1], 42));
          n = 3 + extra;
        } else {
          const s = 150, Q = sqPts(side, 130, s), dg = rng.chance(0.5) ? [Q[0], Q[2]] : [Q[1], Q[3]];
          items.push({ kind: 'diag', pts: Q, lines: [dg], count: dg[0] === Q[0] ? [[Q[0], Q[1], Q[2]], [Q[0], Q[2], Q[3]]] : [[Q[1], Q[2], Q[3]], [Q[1], Q[3], Q[0]]] });
          extra = rng.int(0, 1);
          const cells = rng.shuffle([[side - 52, 312], [side + 52, 312]]);
          if (extra) items.push(small('tri', cells[0][0], cells[0][1], 42, 0));
          items.push(small('circle', cells[extra][0], cells[extra][1], 40));
          n = 5 + extra;
        }
      } else {
        const flip = rng.chance(0.5), bx = flip ? 345 : 155, s = 230, Q = sqPts(bx, 200, s);
        const sm = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([u, v]) => sqPts(bx + u * s / 4, 200 + v * s / 4, s / 2));
        items.push({ kind: 'grid', pts: Q, lines: [[mid(Q[0], Q[1]), mid(Q[3], Q[2])], [mid(Q[0], Q[3]), mid(Q[1], Q[2])]], count: sm.concat([Q]) });
        const side = flip ? 105 : 395, extra = rng.int(0, 2), cells = rng.shuffle([[side - 52, 110], [side + 52, 110], [side - 52, 290], [side + 52, 290]]);
        for (let i = 0; i < extra; i++) items.push(small('sq', cells[i][0], cells[i][1], 38));
        items.push(small(rng.pick(['circle', 'tri']), cells[extra][0], cells[extra][1], 42));
        n = 5 + extra;
      }
      const key = items.map(it => it.kind + (it.pts ? it.pts[0].map(Math.round).join('.') : it.c.join('.'))).join();
      const opts = d <= 2 ? numOptions(G, n, 1, 9) : placeOptions(G, [n - 1, n, n + 1], n);
      return { k: [d, ask, key], d, ask, items, n, answer: n, opts };
    },
    geo() { return K.L() ? { fx: 186, fy: 108, fw: 500, fh: 400, cs: 136, cgap: 22, cx: 790, cy: 362, col: true } : { fx: 72, fy: 206, fw: 560, fh: 448, cs: 150, cgap: 36, cx: 352, cy: 760 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) { const g = this.geo(); if (st.fig) place(st.fig, g.fx, g.fy, g.fw, g.fh); cardRow(st, g); },
    draw(st) {
      const q = st.q, s = svg('svg', { viewBox: '-10 -10 520 420', width: '100%', height: '100%' }); s.style.pointerEvents = 'none'; s.style.overflow = 'visible';
      const fillOf = it => it.kind === 'circle' ? '#BFE3FF' : it.kind === 'rect' ? '#FFE3A8' : it.kind === 'tri' ? '#FFD0CC' : it.kind === 'sq' ? '#CDEFD2' : '#FFFFFF';
      const P = p => p.map(x => x[0].toFixed(1) + ',' + x[1].toFixed(1)).join(' ');
      q.items.forEach(it => {
        const a = { fill: q.d <= 2 ? fillOf(it) : '#fff', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' };
        if (it.kind === 'circle') svg('circle', Object.assign({ cx: it.c[0], cy: it.c[1], r: it.r }, a), s);
        else svg('polygon', Object.assign({ points: P(it.pts) }, a), s);
        (it.lines || []).forEach(L => svg('path', { d: 'M' + L[0][0] + ' ' + L[0][1] + 'L' + L[1][0] + ' ' + L[1][1], stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, s));
      });
      st.hiLayer = svg('g', {}, s); st.P = P;
      return s;
    },
    present(st) {
      const q = st.q;
      st.fig = panel(st, 4); st.fig.appendChild(this.draw(st));
      numCards(st, q.opts, this.geo(), q.d >= 3);
      this.place(st);
      K.pop(st, st.fig);
      const icon = q.ask === 'tri' ? '<polygon points="50,12 90,84 10,84" fill="#FFD0CC" stroke="#2B2118" stroke-width="6" stroke-linejoin="round"/>' : '<rect x="16" y="16" width="68" height="68" fill="#CDEFD2" stroke="#2B2118" stroke-width="6"/>';
      K.task(st, [[W3X.ic(icon)], ['q']]);
      K.say(st, q.ask === 'tri' ? '一共几个三角形？' : '一共几个正方形？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, c = st.cards[st.opts.indexOf(q.answer)];
      if (c) K.ring(st, [box(c)], 6, '#FFC93C'); Sfx.reveal();
      const all = []; q.items.forEach(it => it.count.forEach(p => all.push(p)));
      for (let i = 0; i < all.length; i++) {
        if (!Session.alive(my)) return;
        const h = svg('polygon', { points: st.P(all[i]), fill: 'rgba(255,201,60,.45)', stroke: '#E8A100', 'stroke-width': 12, 'stroke-linejoin': 'round' }, st.hiLayer);
        await Count.beat(st.scope, 420, i + 1);
        h.setAttribute('fill', 'none'); h.setAttribute('stroke-width', 5);
      }
      if (!Session.alive(my)) return;
      this.cheerAll(st);
      st.summary = '有' + CNQ(q.n) + '个' + (q.ask === 'tri' ? '三角形' : '正方形') + '！'; Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1200));
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(W2Say.notN(ans)); await st.scope.wait(T(600)); },
    next(st, strat) { return pickCard(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { if (st.fig) K.flash(st, [st.fig]); },
    snap(st) { return { ask: st.q.ask, n: st.q.n }; },
    lines() {
      const out = [this.intro, '一共几个三角形？', '一共几个正方形？'].concat(this.praise);
      for (let n = 1; n <= 9; n++) out.push('有' + CNQ(n) + '个三角形！', '有' + CNQ(n) + '个正方形！');
      for (let n = 0; n <= 10; n++) out.push(W2Say.notN(n));
      return uniq(out);
    },
  };
})();
/* ================================================================ 睡衣小英雄·月球 (world 4, island ③: 5 以内减)
   M1 找 which picture is a − b · M2 坐 how many seats of the shuttle are empty (part / whole) · M3 谁 whose balloons are
   more after some fly away · M4 折 fold, punch, unfold: which paper is it (reasoning). Every rule: W4R.<id>, merged over
   W2Base by w4Game (raw/js/w4/games.js). One file scope: nothing here is global but W4R.M1-M4. */
(() => {
  const INK = '#2B2118';
  /* the right option goes where the position bag says (the bag placeOptions uses: never "always the middle one") */
  const deal = (G, rng, ok, others) => { const pos = bagPick(G, 'pos', [0, 1, 2]), o = rng.shuffle(others.slice()), out = []; for (let i = 0, k = 0; i < others.length + 1; i++) out.push(i === pos ? ok : o[k++]); return out; };
  const dotRow = (n, col, g) => {
    g = g || 15; const per = Math.max(1, Math.min(5, n)), rows = Math.max(1, Math.ceil(n / 5)), r = g * 0.39;
    const s = svg('svg', { viewBox: '0 0 ' + (per * g + 2) + ' ' + (rows * g + 2), width: per * g + 2, height: rows * g + 2 });
    if (!n) svg('circle', { cx: g / 2 + 1, cy: g / 2 + 1, r, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '3 3' }, s);
    for (let i = 0; i < n; i++) svg('circle', { cx: 1 + g / 2 + (i % 5) * g, cy: 1 + g / 2 + Math.floor(i / 5) * g, r, fill: col || '#4FB3FF', stroke: INK, 'stroke-width': 2 }, s);
    s.style.flexShrink = '0'; s.style.pointerEvents = 'none'; return s;
  };
  /* a number on its own (numerals on), with its dots under it at the low levels (numerals off: the dots) */
  const numNode = (n, h, dots, col) => {
    const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pointerEvents: 'none' });
    if (digits()) d.appendChild(UI.num(n, h));
    if (dots || !digits()) d.appendChild(dotRow(n, col, digits() ? (h >= 60 ? 18 : 15) : 22));
    return d;
  };
  /* + − = drawn as thick bars (a font's minus is a thin dash); anything else as text */
  const opNode = (t, size) => {
    size = Math.round(size || 46);
    if (t === '-' || t === '+' || t === '=') {
      const s = svg('svg', { viewBox: '0 0 60 60', width: size, height: size }); s.style.flexShrink = '0'; s.style.pointerEvents = 'none';
      const bar = (x, y, w, h) => svg('rect', { x, y, width: w, height: h, rx: Math.min(w, h) / 2, fill: INK }, s);
      if (t === '=') { bar(8, 16, 44, 10); bar(8, 34, 44, 10); } else { bar(6, 25, 48, 10); if (t === '+') bar(25, 6, 10, 48); }
      return s;
    }
    const o = el('span', ''); o.textContent = t; Object.assign(o.style, { font: '900 ' + size + 'px/1 system-ui, sans-serif', color: INK, pointerEvents: 'none' }); return o;
  };
  const eqNode = (parts, dots, h) => { const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'none' }); parts.forEach(t => d.appendChild(typeof t === 'number' ? numNode(t, h, dots) : opNode(t, h * 0.72))); return d; };
  /* a white board on the stage (not a tap target) */
  const board = (st, z, bg) => { const e = W2X.thing(st, 10, 10, z || 4, ''); Object.assign(e.style, { background: bg || '#fff', borderRadius: '24px', boxShadow: '0 0 0 4px ' + INK + ', 0 6px 0 4px rgba(43,33,24,.18)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }); return e; };
  const fill = e => { Object.assign(e.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none' }); return e; };

  /* ================================================================ M1 找 a − b: which picture is it? (a things, b crossed out)
     L1 a ≤ 3 · L2 a ≤ 4 (numbers with dots) · L3 a ≤ 5, numbers only · L4 a − b = c, one picture has the right total but not
     the right rest, one the right rest but not the right total · L5 the "take away" picture: some stay in the crater, some fly
     off. The wrong pictures never show a − b (another total or another number taken away). */
  W4R.M1 = {
    kind0: 'eqpic', verb: '找！', intro: '算式找图！', praise: ['图找对啦！'],
    things: ['alien', 'astronaut', 'rocket', 'crystal'], props: ['alien', 'astronaut', 'rocket', 'crystal'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, hi = [0, 3, 4, 5, 5, 5][d], thing = bagPick(G, 'm1t', this.things);
      const a = rng.int(2, hi), b = rng.int(1, a - 1), c = a - b, ok = { n: a, x: b, why: 'ok' };
      const xs = []; for (let x = 1; x <= a; x++) if (x !== b) xs.push(x);
      const fx = { n: a, x: rng.pick(xs), why: 'x' };                    /* the right total, another number gone */
      let fn;
      if (d === 4) {                                                         /* the right rest, the wrong total */
        const up = { n: a + 1, x: b + 1, why: 'n' }, dn = { n: a - 1, x: b - 1, why: 'n' };
        fn = b >= 2 && a >= 3 && rng.chance(0.5) ? dn : up;
      } else fn = { n: rng.pick([a - 1, a + 1].filter(n => n > b && n >= 2)), x: b, why: 'n' };
      const pics = deal(G, rng, ok, [fx, fn]);
      return { k: [d, a, b, thing], a, b, c, thing, pics, act: d === 5, full: d === 4, dots: d <= 2, answer: pics.indexOf(ok), opts: [0, 1, 2], fact: factOf('-', a, b) };
    },
    /* one picture: n things, the last x crossed out (L5: the rest in the crater, x flying away) */
    pic(q, p, L) {
      const W = L ? 300 : 520, H = L ? 220 : 150, src = 'assets/props/' + q.thing + '.png';
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%' }); s.style.pointerEvents = 'none'; s.style.overflow = 'visible';
      const put = (x, y, sz, faded, tilt) => { const im = svg('image', { href: src, x: x - sz / 2, y: y - sz / 2, width: sz, height: sz }, s); if (faded) im.setAttribute('opacity', '0.38'); if (tilt) im.setAttribute('transform', 'rotate(' + tilt + ' ' + x + ' ' + y + ')'); };
      const grid = (n, cx, cy, gx, gy, per) => { const rows = Math.ceil(n / per), out = []; for (let i = 0; i < n; i++) { const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per; out.push([cx + (c - (inRow - 1) / 2) * gx, cy + (r - (rows - 1) / 2) * gy]); } return out; };
      if (!q.act) {
        const n = p.n, per = L ? (n <= 3 ? n : Math.ceil(n / 2)) : n, rows = Math.ceil(n / per);
        const sz = L ? (rows > 1 ? 82 : 88) : (n > 5 ? 72 : 84), gx = L ? sz + 10 : Math.min(sz + 14, (W - 24) / n);
        grid(n, W / 2, H / 2, gx, sz + 8, per).forEach(([x, y], i) => {
          const gone = i >= n - p.x; put(x, y, sz, gone);
          if (gone) svg('path', { d: 'M' + (x - sz * 0.4) + ' ' + (y + sz * 0.4) + 'L' + (x + sz * 0.4) + ' ' + (y - sz * 0.4), stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round' }, s);
        });
        return s;
      }
      /* the take-away picture: a crater (the ones that stay), an arrow, the ones that fly off */
      const stay = p.n - p.x, go = p.x, cr = L ? { x: 90, y: 110, rx: 84, ry: 92 } : { x: 154, y: 75, rx: 148, ry: 68 };
      svg('ellipse', { cx: cr.x, cy: cr.y, rx: cr.rx, ry: cr.ry, fill: '#E4E8F0', stroke: INK, 'stroke-width': 4 }, s);
      svg('ellipse', { cx: cr.x, cy: cr.y + cr.ry * 0.6, rx: cr.rx * 0.78, ry: cr.ry * 0.24, fill: '#D3D9E4' }, s);
      /* (rows of, size) for the ones that stay and the ones that fly off - as big as the room allows */
      const sl = L ? [[1, 84], [1, 84], [1, 84], [2, 70], [2, 66], [3, 52]][stay] : [[1, 66], [1, 66], [2, 66], [3, 66], [4, 64], [5, 54]][stay];
      grid(stay, cr.x, cr.y, sl[1] + 2, sl[1] + 2, sl[0]).forEach(([x, y]) => put(x, y, sl[1], false));
      const ax = cr.x + cr.rx + 4, ay = cr.y;
      svg('path', { d: 'M' + ax + ' ' + ay + 'H' + (ax + 22), stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round' }, s);
      svg('path', { d: 'M' + (ax + 14) + ' ' + (ay - 11) + 'L' + (ax + 26) + ' ' + ay + 'L' + (ax + 14) + ' ' + (ay + 11), fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      const x0 = ax + 30, gl = L ? [[1, 76], [1, 76], [1, 74], [1, 62], [2, 46], [2, 46]][go] : [[1, 62], [1, 62], [2, 62], [3, 56], [3, 50], [3, 50]][go];
      grid(go, (x0 + W) / 2, ay, gl[1] + 2, gl[1] + 2, gl[0]).forEach(([x, y]) => put(x, y, gl[1], false, -14));
      return s;
    },
    geo() { return K.L() ? { cx: 512, ey: 100, eh: 128, cw: 290, ch: 236, cy: 248, gap: 24 } : { cx: 352, ey: 214, eh: 136, cw: 540, ch: 152, cy: 372, gap: 18 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    drawPics(st) { const L = K.L(); st.picL = L; st.cards.forEach((c, i) => { c.innerHTML = ''; const w = el('div', '', c); Object.assign(w.style, { width: '94%', height: '90%', pointerEvents: 'none' }); w.appendChild(this.pic(st.q, st.q.pics[i], L)); }); },
    place(st) {
      const g = this.geo(), L = K.L(), q = st.q;
      if (st.eqEl) { const w = q.full ? 470 : 320; place(st.eqEl, g.cx - w / 2, g.ey, w, g.eh); }
      if (st.cards) {
        if (st.picL !== L) this.drawPics(st);
        st.cards.forEach((c, i) => L ? place(c, Math.round(g.cx - (3 * g.cw + 2 * g.gap) / 2 + i * (g.cw + g.gap)), g.cy, g.cw, g.ch) : place(c, g.cx - g.cw / 2, g.cy + i * (g.ch + g.gap), g.cw, g.ch));
      }
    },
    present(st) {
      const q = st.q;
      st.eqEl = board(st, 5); st.eqEl.appendChild(eqNode(q.full ? [q.a, '-', q.b, '=', q.c] : [q.a, '-', q.b], q.dots, 64));
      st.cards = q.pics.map((_, i) => W3X.card(st, 'card' + i, 6, 'card'));
      st.opts = [0, 1, 2];
      this.drawPics(st); this.place(st);
      K.pop(st, st.eqEl); st.cards.forEach((c, i) => K.pop(st, c, 120 + 90 * i));
      K.task(st, [['assets/props/' + q.thing + '.png'], [W3X.ic('<path d="M20 50H80" stroke="#2B2118" stroke-width="13" stroke-linecap="round"/>')], ['q']]);
      W3X.say2(st, CN[q.a] + '减' + CN[q.b] + (q.full ? '等于' + CN[q.c] : '') + '。', '哪幅图是它？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, c = st.cards[q.answer];
      K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 16); Sfx.reveal(); this.cheerAll(st);
      st.summary = CN[q.a] + '减' + CN[q.b] + '等于' + CN[q.c] + '！';
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
    },
    async feedback(st, ans) {
      const q = st.q, p = q.pics[ans]; if (st.cards[ans]) K.wiggle(st, st.cards[ans]);
      W3X.say(p.n !== q.a ? '这幅一共' + CNQ(p.n) + '个' : (q.act ? '这幅飞走' : '这幅划掉') + CNQ(p.x) + '个');
      await st.scope.wait(600);
    },
    next(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % 3 : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
    workEls(st) { return st.cards || []; },
    snap(st) { return { a: st.q.a, b: st.q.b, act: st.q.act }; },
  };

  /* ================================================================ M2 坐 a row of n seats, m astronauts sit: how many seats are
     empty? (the whole and its parts - not "taking away"). L1 n ≤ 4, the seats seen · L2 n ≤ 5 · L3 the seats are hidden: only
     "five seats" (a sign) and the ones sitting (a window) · L4 n ≤ 7 · L5 only told: n seats, e empty - how many sit? */
  const CHAIR = (empty) => '<svg viewBox="0 0 100 110" width="100%" height="100%" style="overflow:visible">' +
    '<rect x="20" y="6" width="60" height="66" rx="16" fill="' + (empty ? '#FFFFFF' : '#4F7BFF') + '" stroke="#2B2118" stroke-width="5"' + (empty ? ' stroke-dasharray="9 6"' : '') + '/>' +
    (empty ? '' : '<rect x="31" y="16" width="38" height="42" rx="10" fill="#8FB0FF"/>') +
    '<rect x="10" y="66" width="80" height="22" rx="10" fill="' + (empty ? '#FFFFFF' : '#3A5CC0') + '" stroke="#2B2118" stroke-width="5"' + (empty ? ' stroke-dasharray="9 6"' : '') + '/>' +
    '<path d="M30 90V106M70 90V106" stroke="#2B2118" stroke-width="6" stroke-linecap="round"/></svg>';
  W4R.M2 = {
    kind0: 'seats', verb: '坐！', intro: '飞船上有空座！', praise: ['座位算对啦！'], props: ['astronaut'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, n = rng.int([0, 2, 3, 3, 4, 4][d], [0, 4, 5, 5, 7, 7][d]);
      if (d === 5) {
        const e = rng.int(1, n - 1), m = n - e, seats = rng.shuffle(Array.from({ length: n }, (_, i) => i < m));
        return { k: [d, n, e], n, m, e, seats, mode: 'told', answer: m, opts: numOptions(G, m, 0, n), fact: factOf('-', n, e) };
      }
      const m = rng.int(1, n - 1), e = n - m, seats = rng.shuffle(Array.from({ length: n }, (_, i) => i < m)), see = d <= 2;
      return { k: [d, n, m, see ? seats.map(Number).join('') : ''], n, m, e, seats, mode: see ? 'see' : 'hid', dots: d <= 3, answer: e, opts: numOptions(G, e, 0, n), fact: factOf('-', n, m) };
    },
    geo(st) {
      const L = K.L(), md = st.q.mode, open = st.open;
      if (md === 'see' || open) return L ? { win: { x: 150, y: 112, w: 724, h: 280 }, cy: 524 } : { win: { x: 52, y: 228, w: 600, h: 290 }, cy: 650 };
      if (md === 'hid') return L ? { s1: { x: 150, y: 116, w: 210, h: 270 }, win: { x: 384, y: 116, w: 490, h: 270 }, cy: 524 } : { s1: { x: 182, y: 214, w: 340, h: 170 }, win: { x: 52, y: 404, w: 600, h: 240 }, cy: 744 };
      return L ? { s1: { x: 150, y: 116, w: 210, h: 270 }, s2: { x: 380, y: 116, w: 210, h: 270 }, win: { x: 610, y: 116, w: 264, h: 270 }, cy: 524 }
        : { s1: { x: 52, y: 214, w: 290, h: 170 }, s2: { x: 362, y: 214, w: 290, h: 170 }, win: { x: 152, y: 404, w: 400, h: 240 }, cy: 744 };
    },
    cardSpot(st) { return { cx: K.L() ? 512 : 352, cy: this.geo(st).cy }; },
    decor(G) { W3X.decor2(G, this.chars); },
    /* the seats of a row (and who sits): built once, laid out in place() */
    row(host, occ) {
      host.innerHTML = '';
      return occ.map(on => {
        const s = el('div', '', host); s.innerHTML = CHAIR(false); Object.assign(s.style, { position: 'absolute', pointerEvents: 'none' });
        let a = null; if (on) { a = el('div', '', host); Object.assign(a.style, { position: 'absolute', pointerEvents: 'none' }); const im = img('assets/props/astronaut.png', '', a); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain' }); }
        return { s, a };
      });
    },
    rowPlace(items, W, H) {
      const n = items.length, pitch = Math.min(150, (W - 30) / n), sw = pitch * 0.8, sh = sw * 1.1, y0 = H - 16 - sh, x0 = W / 2 - n * pitch / 2;
      items.forEach((o, i) => {
        const x = x0 + i * pitch + (pitch - sw) / 2; place(o.s, x, y0, sw, sh);
        if (o.a) { const ah = Math.min(sh * 1.28, y0 + sh * 0.84 - 8), aw = ah * 0.72; place(o.a, x + sw / 2 - aw / 2, y0 + sh * 0.84 - ah, aw, ah); }
      });
    },
    sign(st, empty, n) {
      const e = board(st, 5); e.style.gap = '10px';
      const ic = el('div', '', e); Object.assign(ic.style, { width: '74px', height: '82px', flexShrink: '0', pointerEvents: 'none' }); ic.innerHTML = CHAIR(empty);
      e.appendChild(numNode(n, 84, st.q.dots));
      return e;
    },
    place(st) {
      const g = this.geo(st), L = K.L(), dir = L ? 'column' : 'row';
      if (st.s1) { st.s1.style.display = st.open ? 'none' : 'flex'; st.s1.style.flexDirection = dir; place(st.s1, g.s1 ? g.s1.x : -999, g.s1 ? g.s1.y : 0, g.s1 ? g.s1.w : 10, g.s1 ? g.s1.h : 10); }
      if (st.s2) { st.s2.style.display = st.open ? 'none' : 'flex'; st.s2.style.flexDirection = dir; place(st.s2, g.s2 ? g.s2.x : -999, g.s2 ? g.s2.y : 0, g.s2 ? g.s2.w : 10, g.s2 ? g.s2.h : 10); }
      if (st.win) { place(st.win, g.win.x, g.win.y, g.win.w, g.win.h); if (st.items) this.rowPlace(st.items, g.win.w, g.win.h); }
      if (st.cards) K.cardsPlace(st, this.cardSpot(st));
    },
    present(st) {
      const q = st.q;
      st.win = board(st, 4, q.mode === 'see' ? '#DCE6F5' : q.mode === 'hid' ? '#2E3A6B' : '#2E3A6B');
      if (q.mode === 'see') st.items = this.row(st.win, q.seats);
      else if (q.mode === 'hid') { st.s1 = this.sign(st, false, q.n); st.items = this.row(st.win, Array(q.m).fill(true)); }
      else { st.s1 = this.sign(st, false, q.n); st.s2 = this.sign(st, true, q.e); st.win.style.gap = '6px'; const im = img('assets/props/astronaut.png', '', st.win); Object.assign(im.style, { height: '46%', width: 'auto', pointerEvents: 'none' }); st.win.appendChild(opNode('?', 110)); st.win.lastChild.style.color = '#FFE58A'; }
      this.place(st);
      [st.s1, st.s2, st.win].filter(Boolean).forEach((e, i) => K.pop(st, e, 90 * i));
      const sz = this.cardSpot(st);
      K.cards(st, q.opts, { cx: sz.cx, cy: sz.cy, size: 136, gap: 34, numOnly: digits() && st.level >= 4 });
      const chairIc = { node: (() => { const d = el('span', ''); Object.assign(d.style, { display: 'inline-block', width: '46px', height: '50px' }); d.innerHTML = CHAIR(true); return d; })() };
      if (q.mode === 'told') { K.task(st, [['assets/props/astronaut.png'], ['q']]); W3X.say2(st, CNQ(q.n) + '个座位，空' + CNQ(q.e) + '个。', '坐了几个？'); }
      else { K.task(st, [[chairIc], ['q']]); if (q.mode === 'see') K.say(st, '还空几个座位？'); else W3X.say2(st, '一共' + CNQ(q.n) + '个座位。', '还空几个座位？'); }
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, c = st.cards[st.opts.indexOf(q.answer)];
      if (c) K.ring(st, [box(c)], 6, '#FFC93C');
      if (q.mode !== 'see') { st.open = true; st.win.innerHTML = ''; st.win.style.background = '#DCE6F5'; st.items = this.row(st.win, q.seats); this.place(st); K.pop(st, st.win); await st.scope.wait(400); }
      const list = q.mode === 'told' ? st.items.filter(o => o.a).map(o => o.a) : st.items.filter(o => !o.a).map(o => o.s);
      Sfx.reveal();
      for (let i = 0; i < list.length; i++) { if (!Session.alive(my)) return; K.hop(st, list[i], 16); await Count.beat(st.scope, 380, i + 1); }
      this.cheerAll(st);
      st.summary = q.mode === 'told' ? '坐了' + CNQ(q.m) + '个！' : '空' + CNQ(q.e) + '个座位！';
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CNQ(ans) + '个'); await st.scope.wait(600); },
    next(st, strat) { if (st.picked || !st.cards) return null; return K.cardNext(st, strat); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { n: st.q.n, mode: st.q.mode }; },
  };

  /* ================================================================ M3 谁 Catboy and Luna Girl each hold balloons, some fly away:
     whose are more now? (tap the one) · L1 the same number at first (3-4) · L2 the same (4-5) · L3 different at first, and
     half the time the one who had more has fewer now · L4 only number boards (5 − 2) · L5 the number boards, "Catboy has
     more - how many more?" (three cards). The two rests are never the same. */
  const BCOL = ['#FF6B5B', '#FFC93C', '#4FB3FF', '#5CC46E', '#B57BFF'];
  const BPOS = { 1: [[150, 104]], 2: [[110, 104], [190, 104]], 3: [[76, 112], [150, 88], [224, 112]], 4: [[112, 80], [188, 80], [74, 164], [226, 164]], 5: [[74, 82], [150, 70], [226, 82], [112, 164], [188, 164]] };
  const HAND = [150, 236];
  W4R.M3 = {
    kind0: 'balloons', verb: '谁！', intro: '气球飞走啦！', praise: ['看得真仔细！'],
    who: ['catboy', 'luna_girl'], name: { catboy: '猫小子', luna_girl: '月亮女孩' },
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, win = bagPick(G, 'm3w' + d, [0, 1]), trap = d === 3 ? bagPick(G, 'm3trap', [true, false]) : false;
      for (let t = 0; t < 600; t++) {
        let a, b;
        if (d <= 2) { a = b = rng.pick(d === 1 ? [3, 4] : [4, 5]); } else { a = rng.int(2, 5); b = rng.int(2, 5); if (d === 3 && a === b) continue; }
        const c = rng.int(1, a - 1), e = rng.int(1, b - 1), ra = a - c, rb = b - e;
        if (ra === rb || (ra > rb ? 0 : 1) !== win) continue;
        if (d === 3 && ((a > b) !== (ra > rb)) !== trap) continue;
        if (d === 5) { const diff = Math.abs(ra - rb); return { k: [d, a, b, c, e], a, b, c, e, r: [ra, rb], win, mode: 'diff', answer: diff, opts: numOptions(G, diff, 1, 4) }; }
        return { k: [d, a, b, c, e], a, b, c, e, r: [ra, rb], win, mode: d === 4 ? 'num' : 'see', answer: win, opts: [0, 1] };
      }
      return { k: [d, 4, 4, 1, 2], a: 4, b: 4, c: 1, e: 2, r: [3, 2], win: 0, mode: d >= 4 ? (d === 5 ? 'diff' : 'num') : 'see', answer: d === 5 ? 1 : 0, opts: d === 5 ? [1, 2, 3] : [0, 1] };
    },
    geo(st) {
      const L = K.L(), dm = st && st.q && st.q.mode === 'diff';
      return L ? (dm ? { w: 300, h: 400, xs: [182, 542], y: 100, cy: 594 } : { w: 340, h: 480, xs: [150, 534], y: 108 }) : (dm ? { w: 310, h: 480, xs: [32, 362], y: 216, cy: 806 } : { w: 310, h: 560, xs: [32, 362], y: 230 });
    },
    cardSpot(st) { return { cx: K.L() ? 512 : 352, cy: this.geo(st).cy }; },
    decor(G) { W2X.hideAll(G, this.chars); },
    layer(host) { const d = fill(el('div', '', host)); const s = svg('svg', { viewBox: '20 8 260 412', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet' }, d); s.style.overflow = 'visible'; return { d, s }; },
    balloon(host, x, y, col) {
      const L = this.layer(host), s = L.s;
      svg('path', { d: 'M' + x + ' ' + (y + 38) + 'Q' + ((x + HAND[0]) / 2 + 14) + ' ' + ((y + HAND[1]) / 2 + 20) + ' ' + HAND[0] + ' ' + HAND[1], fill: 'none', stroke: INK, 'stroke-width': 2.5 }, s);
      svg('ellipse', { cx: x, cy: y, rx: 31, ry: 37, fill: col, stroke: INK, 'stroke-width': 4 }, s);
      svg('ellipse', { cx: x - 11, cy: y - 14, rx: 7, ry: 10, fill: '#fff', opacity: 0.6 }, s);
      svg('path', { d: 'M' + (x - 6) + ' ' + (y + 43) + 'L' + x + ' ' + (y + 35) + 'L' + (x + 6) + ' ' + (y + 43) + 'Z', fill: col, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, s);
      return L.d;
    },
    miniBalloons() { return '<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M34 52L50 92M66 52L50 92M50 48V92" stroke="#2B2118" stroke-width="3" fill="none"/><ellipse cx="34" cy="34" rx="17" ry="20" fill="#FF6B5B" stroke="#2B2118" stroke-width="4"/><ellipse cx="66" cy="34" rx="17" ry="20" fill="#4FB3FF" stroke="#2B2118" stroke-width="4"/><ellipse cx="50" cy="26" rx="17" ry="20" fill="#FFC93C" stroke="#2B2118" stroke-width="4"/></svg>'; },
    place(st) {
      const g = this.geo(st);
      (st.P || []).forEach((P, i) => place(P.el, g.xs[i], g.y, g.w, g.h));
      if (st.cards) K.cardsPlace(st, this.cardSpot(st));
    },
    async present(st) {
      const q = st.q, my = st, num = q.mode !== 'see';
      st.P = this.who.map((id, i) => {
        const e = W3X.card(st, q.mode === 'diff' ? null : 'who' + i, 5, 'card');
        const base = this.layer(e), W = 300 * (META[id] ? META[id][0] / META[id][1] : 0.6) * 0.66;
        svg('image', { href: 'assets/chars/' + id + '.png', x: 150 - W / 2, y: 224, width: W, height: 190 }, base.s);
        const n = i ? q.b : q.a, gone = i ? q.e : q.c, P = { el: e, id, n, gone, bl: [], sign: null, eq: null };
        if (!num) BPOS[n].forEach((xy, k) => P.bl.push(this.balloon(e, xy[0], xy[1], BCOL[(k + i * 2) % 5])));
        else {
          const sg = el('div', '', e); P.sign = sg;
          Object.assign(sg.style, { position: 'absolute', left: '50%', top: '5%', transform: 'translateX(-50%)', padding: '10px 18px', background: '#FFF8E1', borderRadius: '20px', boxShadow: '0 0 0 4px ' + INK, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', pointerEvents: 'none' });
          const ic = el('div', '', sg); Object.assign(ic.style, { width: '64px', height: '64px' }); ic.innerHTML = this.miniBalloons();
          P.eq = el('div', '', sg); Object.assign(P.eq.style, { display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' });
          P.eq.appendChild(numNode(n, 58, false));
        }
        return P;
      });
      this.place(st);
      st.P.forEach((P, i) => K.pop(st, P.el, 100 * i));
      await st.scope.wait(900); if (!Session.alive(my)) return;
      /* some fly away (the last ones of each bunch) - or on the number board: "− c" with a balloon going up */
      Sfx.whoosh(0.3);
      await Promise.all(st.P.map(P => {
        if (!num) return Promise.all(P.bl.slice(P.n - P.gone).map((b, k) => st.scope.anim(b, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-60%) rotate(-6deg)', opacity: 1, offset: 0.5 }, { transform: 'translateY(-120%) rotate(8deg)', opacity: 0 }], { duration: 1300, delay: 180 * k, easing: EASE.glide }).then(() => { b.style.visibility = 'hidden'; })));
        P.eq.appendChild(opNode('-', 44)); const g = numNode(P.gone, 58, false); P.eq.appendChild(g);
        const up = el('div', '', P.sign); Object.assign(up.style, { position: 'absolute', right: '-6px', top: '-26px', width: '38px', height: '38px', pointerEvents: 'none' }); up.innerHTML = '<svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M20 30V40" stroke="#2B2118" stroke-width="2"/><ellipse cx="20" cy="16" rx="12" ry="14" fill="#FF6B5B" stroke="#2B2118" stroke-width="3"/></svg>';
        st.scope.anim(g, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 300, easing: EASE.pop });
        return st.scope.anim(up, [{ transform: 'translateY(30px)', opacity: 1 }, { transform: 'translateY(-90px)', opacity: 0 }], { duration: 1300, easing: EASE.glide }).then(() => { up.remove(); });
      }));
      if (!Session.alive(my)) return;
      if (q.mode === 'diff') {
        const sp = this.cardSpot(st); K.cards(st, q.opts, { cx: sp.cx, cy: sp.cy, size: 130, gap: 34, numOnly: digits() });
        K.task(st, [[W3X.ic('<path d="M34 52L50 92M66 52L50 92" stroke="#2B2118" stroke-width="3"/><ellipse cx="34" cy="34" rx="17" ry="20" fill="#FF6B5B" stroke="#2B2118" stroke-width="4"/><ellipse cx="66" cy="34" rx="17" ry="20" fill="#4FB3FF" stroke="#2B2118" stroke-width="4"/>')], ['q']]);
        W3X.say2(st, this.name[this.who[q.win]] + '剩的多。', '多几个？');
      } else {
        K.task(st, [['assets/chars/catboy.png', 'assets/chars/luna_girl.png'], ['q']]);
        K.say(st, '谁剩的多？');
      }
    },
    onGesture(st, name, p) {
      if (st.q.mode === 'diff') return W3X.tapCards(st, name, p);
      const m = /^who([01])$/.exec(p.id || ''); if (name !== 'tap' || !m || st.picked) return false;
      st.picked = true; Session.submit(st, Number(m[1])); return 'ok';
    },
    showRest(st) { st.P.forEach((P, i) => { if (!P.eq || P.done) return; P.done = true; P.eq.appendChild(opNode('=', 44)); const r = numNode(st.q.r[i], 58, false); P.eq.appendChild(r); K.pop(st, r); }); },
    async reveal(st) {
      const q = st.q, my = st, P = st.P[q.win];
      K.ring(st, [box(P.el)], 6, '#FFC93C'); Sfx.reveal();
      if (q.mode === 'see') { const left = P.bl.slice(0, P.n - P.gone); for (let i = 0; i < left.length; i++) { if (!Session.alive(my)) return; K.hop(st, left[i], 14); await Count.beat(st.scope, 360, i + 1); } }
      else { this.showRest(st); await st.scope.wait(500); }
      st.summary = q.mode === 'diff' ? '多' + CNQ(q.answer) + '个！' : this.name[P.id] + '剩' + CNQ(q.r[q.win]) + '个！';
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
    },
    async feedback(st, ans) {
      const q = st.q;
      if (q.mode === 'diff') { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是多' + CNQ(ans) + '个'); }
      else { const P = st.P[ans]; if (P) K.wiggle(st, P.el); W3X.say(this.name[this.who[ans]] + '剩' + CNQ(q.r[ans]) + '个'); }
      await st.scope.wait(600);
    },
    next(st, strat) {
      if (st.picked) return null;
      if (st.q.mode === 'diff') return st.cards ? K.cardNext(st, strat) : null;
      const i = strat === 'wrong' ? 1 - st.q.win : st.q.win; return { g: 'tap', p: { id: 'who' + i } };
    },
    workEls(st) { return st.q.mode === 'diff' ? (st.cards || []) : (st.P || []).map(P => P.el); },
    snap(st) { return { r: st.q.r, mode: st.q.mode }; },
  };

  /* ================================================================ M4 折 a sheet is folded, a hole is punched through it: which
     sheet is it when it is opened? (reasoning: symmetry) · L1 one hole, folded left-right · L2 two holes · L3 folded top-down
     · L4 two holes, either fold · L5 folded twice, one hole (four when opened). The sheet is a 4 x 4 grid of places; the wrong
     sheets: only the punched hole(s), the copy slid instead of mirrored, the copy in another row, the other fold, one fold
     only. Every sheet differs from the right one. */
  const HOLE = '#2E3A6B', PAPER = '#FFF3C4';
  W4R.M4 = {
    kind0: 'fold', verb: '折！', intro: '折纸打孔！', praise: ['折纸小能手！'],
    hkey: h => h.map(x => x.join('')).sort().join(','),
    unfold(holes, f) { const out = holes.slice(); if (f.lr || f.both) holes.forEach(([c, r]) => out.push([3 - c, r])); if (f.tb) holes.forEach(([c, r]) => out.push([c, 3 - r])); if (f.both) holes.forEach(([c, r]) => { out.push([c, 3 - r]); out.push([3 - c, 3 - r]); }); return out; },
    foil(k, holes, f, rng) {
      const dx = f.side === 'L' ? 2 : -2, dy = f.vside === 'T' ? 2 : -2;
      if (k === 'one') return holes.slice();
      if (k === 'row') return holes.concat(holes.map(([c, r]) => [3 - c, rng.pick([0, 1, 2, 3].filter(x => x !== r))]));
      if (k === 'shift') { if (f.both) return holes.concat(holes.map(([c, r]) => [c + dx, r]), holes.map(([c, r]) => [c, r + dy]), holes.map(([c, r]) => [c + dx, r + dy])); return holes.concat(holes.map(([c, r]) => f.lr ? [c + dx, r] : [c, r + dy])); }
      if (k === 'axis') return holes.concat(holes.map(([c, r]) => f.lr ? [c, 3 - r] : [3 - c, r]));
      return holes.concat(holes.map(([c, r]) => [3 - c, r]));          /* 'half': unfolded once only */
    },
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng;
      const kind = d <= 2 ? 'lr' : d === 3 ? 'tb' : d === 4 ? bagPick(G, 'm4f', ['lr', 'tb']) : 'both';
      const f = { kind, lr: kind === 'lr', tb: kind === 'tb', both: kind === 'both', side: rng.pick(['L', 'R']), vside: rng.pick(['T', 'B']) };
      const nh = d === 2 || d === 4 ? 2 : 1, kinds = { 1: ['one', 'row'], 2: ['one', 'shift'], 3: ['shift', 'axis'], 4: ['shift', 'axis'], 5: ['half', 'shift'] }[d];
      const inC = c => f.tb || (f.side === 'L' ? c < 2 : c >= 2), inR = r => f.lr || (f.vside === 'T' ? r < 2 : r >= 2);
      const region = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (inC(c) && inR(r)) region.push([c, r]);
      for (let t = 0; t < 300; t++) {
        const holes = rng.shuffle(region.slice()).slice(0, nh);
        const open = this.unfold(holes, f), fs = kinds.map(k => ({ k, h: this.foil(k, holes, f, rng) }));
        const all = [open].concat(fs.map(x => x.h));
        if (all.some(h => h.some(([c, r]) => c < 0 || c > 3 || r < 0 || r > 3))) continue;
        if (new Set(all.map(h => this.hkey(h))).size !== 3) continue;
        const ok = { k: 'ok', h: open }, pics = deal(G, rng, ok, fs);
        return { k: [d, kind, f.side, f.vside, this.hkey(holes)], f, holes, open, pics, nh, answer: pics.indexOf(ok), opts: [0, 1, 2] };
      }
      return this.gen(G, Object.assign({}, o, { level: 1 }));
    },
    /* an opened sheet (an answer card): its fold lines and its holes */
    sheet(f, holes) {
      const s = svg('svg', { viewBox: '0 0 100 100', width: '100%', height: '100%' }); s.style.pointerEvents = 'none';
      svg('rect', { x: 4, y: 4, width: 92, height: 92, rx: 4, fill: PAPER, stroke: INK, 'stroke-width': 3.5 }, s);
      const ln = d => svg('path', { d, stroke: INK, 'stroke-width': 1.6, 'stroke-dasharray': '4 3', opacity: 0.6 }, s);
      if (f.lr || f.both) ln('M50 6V94'); if (f.tb || f.both) ln('M6 50H94');
      holes.forEach(([c, r]) => svg('circle', { cx: 4 + (c + 0.5) * 23, cy: 4 + (r + 0.5) * 23, r: 6.2, fill: HOLE, stroke: INK, 'stroke-width': 1.5 }, s));
      return s;
    },
    /* the sheet on the table: four quarters, so it can fold and open */
    quarter(i, holes, f) {
      const qx = i % 2, qy = i >> 1, s = svg('svg', { viewBox: '0 0 50 50', width: '100%', height: '100%' }); s.style.overflow = 'visible'; s.style.pointerEvents = 'none';
      svg('rect', { x: -0.5, y: -0.5, width: 51, height: 51, fill: PAPER }, s);
      /* the outer edges solid; an inner edge is a dashed fold line only where the sheet is folded (else nothing) */
      const e = (d, inner, fold) => { if (inner && !fold) return; svg('path', { d, stroke: INK, 'stroke-width': inner ? 0.9 : 2.2, 'stroke-dasharray': inner ? '2.5 2' : 'none', opacity: inner ? 0.55 : 1, 'stroke-linecap': 'round' }, s); };
      const v = f.lr || f.both, h = f.tb || f.both;
      e('M0 0H50', qy === 1, h); e('M0 50H50', qy === 0, h); e('M0 0V50', qx === 1, v); e('M50 0V50', qx === 0, v);
      holes.filter(([c, r]) => (c >> 1) === qx && (r >> 1) === qy).forEach(([c, r]) => svg('circle', { cx: ((c % 2) + 0.5) * 25, cy: ((r % 2) + 0.5) * 25, r: 6.6, fill: HOLE, stroke: INK, 'stroke-width': 1 }, s));
      return s;
    },
    drawQ(st, holes) { st.qs.forEach((d, i) => { d.innerHTML = ''; d.appendChild(this.quarter(i, holes, st.q.f)); }); },
    /* which quarters fold onto the others, and around which edge */
    moves(f) {
      const L = f.side === 'L', T = f.vside === 'T';
      const lr = { qs: L ? [1, 3] : [0, 2], origin: L ? '0% 50%' : '100% 50%', kf: L ? 'rotateY(-180deg)' : 'rotateY(180deg)' };
      const tb = q => ({ qs: q, origin: T ? '50% 0%' : '50% 100%', kf: T ? 'rotateX(180deg)' : 'rotateX(-180deg)' });
      if (f.lr) return [lr];
      if (f.tb) return [tb(T ? [2, 3] : [0, 1])];
      return [lr, tb([T ? (L ? 2 : 3) : (L ? 0 : 1)])];
    },
    geo() { return K.L() ? { S: 236, cx: 512, cy: 230, os: 190, ocy: 482, gap: 34 } : { S: 300, cx: 352, cy: 390, os: 196, ocy: 700, gap: 20 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo();
      if (st.pp) place(st.pp, g.cx - g.S / 2, g.cy - g.S / 2, g.S, g.S);
      if (st.cards) K.cardsPlace(st, { cx: g.cx, cy: g.ocy, gap: g.gap });
    },
    cardSpot() { const g = this.geo(); return { cx: g.cx, cy: g.ocy }; },
    async present(st) {
      const q = st.q, my = st, f = q.f, g = this.geo();
      st.pp = W2X.thing(st, g.S, g.S, 4, ''); st.pp.style.perspective = '900px'; st.pp.style.pointerEvents = 'none';
      st.qs = [0, 1, 2, 3].map(i => { const d = el('div', '', st.pp); Object.assign(d.style, { position: 'absolute', left: (i % 2) * 50 + '%', top: (i >> 1) * 50 + '%', width: '50%', height: '50%', pointerEvents: 'none' }); return d; });
      this.drawQ(st, []); this.place(st); K.pop(st, st.pp);
      st.lead = (f.both ? '对折两次，' : '对折，') + '打' + (q.nh === 2 ? '两' : '一') + '个孔。'; Voice.say(st.lead, { tag: 'prompt' });     /* the question itself comes with the sheets */
      await st.scope.wait(700); if (!Session.alive(my)) return;
      /* fold (once or twice) */
      st.hid = [];
      for (const m of this.moves(f)) {
        Sfx.whoosh(0.25);
        await Promise.all(m.qs.map(i => { const e = st.qs[i]; e.style.transformOrigin = m.origin; e.style.zIndex = 2; return st.scope.anim(e, [{ transform: m.kf.replace(/-?180deg/, '0deg') }, { transform: m.kf }], { duration: 700, easing: EASE.glide }); }));
        if (!Session.alive(my)) return;
        m.qs.forEach(i => { const e = st.qs[i]; e.getAnimations().forEach(a => a.cancel()); e.style.visibility = 'hidden'; st.hid.push(i); });
        await st.scope.wait(250); if (!Session.alive(my)) return;
      }
      /* where the folded part was: a dashed outline (it opens back to there); the folded part casts one shadow (two layers) */
      st.ghost = el('div', '', st.pp); Object.assign(st.ghost.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', boxSizing: 'border-box', border: '4px dashed rgba(43,33,24,.5)', background: 'rgba(255,255,255,.28)', borderRadius: '4px', zIndex: -1, pointerEvents: 'none' });
      { const h = f.lr || f.both, v = f.tb || f.both; st.shade = el('div', '', st.pp);
        Object.assign(st.shade.style, { position: 'absolute', left: 'calc(' + (h && f.side === 'R' ? 50 : 0) + '% + 6px)', top: 'calc(' + (v && f.vside === 'B' ? 50 : 0) + '% + 7px)', width: (h ? 50 : 100) + '%', height: (v ? 50 : 100) + '%', background: 'rgba(43,33,24,.3)', zIndex: -1, pointerEvents: 'none' }); }
      st.pp.style.zIndex = 4; st.folded = true;
      K.pop(st, st.ghost);
      await st.scope.wait(300); if (!Session.alive(my)) return;
      /* punch */
      for (let k = 0; k < q.holes.length; k++) {
        const [c, r] = q.holes[k], tool = el('div', '', st.pp);
        Object.assign(tool.style, { position: 'absolute', left: ((c + 0.5) * 25 - 9) + '%', top: ((r + 0.5) * 25 - 34) + '%', width: '18%', height: '34%', zIndex: 5, pointerEvents: 'none' });
        tool.innerHTML = '<svg viewBox="0 0 40 76" width="100%" height="100%"><rect x="6" y="2" width="28" height="22" rx="7" fill="#E8414B" stroke="#2B2118" stroke-width="4"/><rect x="13" y="22" width="14" height="40" fill="#C9D2DC" stroke="#2B2118" stroke-width="4"/><path d="M13 62H27L24 74H16Z" fill="#8892A0" stroke="#2B2118" stroke-width="3" stroke-linejoin="round"/></svg>';
        await st.scope.anim(tool, [{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'translateY(-30px)', opacity: 1, offset: 0.4 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 450, easing: EASE.drop });
        if (!Session.alive(my)) return;
        Sfx.pop(); this.drawQ(st, q.holes.slice(0, k + 1));
        await st.scope.anim(tool, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-70px)', opacity: 0 }], { duration: 350 });
        tool.remove(); if (!Session.alive(my)) return;
      }
      W2X.cards(st, q.pics.map(p => this.sheet(f, p.h)), [0, 1, 2], { size: g.os, gap: g.gap, cx: g.cx, cy: g.ocy });
      this.place(st);
      K.task(st, [[W3X.ic('<path d="M14 14H86V86H14Z" fill="#FFF3C4" stroke="#2B2118" stroke-width="5"/>' + (f.tb ? '' : '<path d="M50 14V86" stroke="#2B2118" stroke-width="3" stroke-dasharray="6 5"/>') + (f.lr ? '' : '<path d="M14 50H86" stroke="#2B2118" stroke-width="3" stroke-dasharray="6 5"/>') + '<circle cx="32" cy="32" r="7" fill="#2E3A6B"/><circle cx="68" cy="' + (f.tb ? 32 : 68) + '" r="7" fill="#2E3A6B"/>')], ['q']]);
      K.say(st, '打开是哪张？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, c = st.cards[q.answer];
      /* the sheet opens: the hidden quarters come back, with their holes */
      this.drawQ(st, q.open); if (st.ghost) st.ghost.remove(); if (st.shade) st.shade.remove();
      const ms = this.moves(q.f).reverse();
      st.folded = false;
      for (const m of ms) {
        await Promise.all(m.qs.map(i => { const e = st.qs[i]; e.style.visibility = ''; return st.scope.anim(e, [{ transform: m.kf }, { transform: m.kf.replace(/-?180deg/, '0deg') }], { duration: 600, easing: EASE.glide }); }));
        if (!Session.alive(my)) return;
      }
      K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 16); Sfx.reveal(); this.cheerAll(st);
      st.summary = '打开是这样！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
    },
    async feedback(st, ans) {
      const q = st.q, p = q.pics[ans]; if (st.cards[ans]) K.wiggle(st, st.cards[ans]);
      W3X.say(p.h.length !== q.open.length ? '这张有' + CNQ(p.h.length) + '个孔' : '折起来对不上');
      await st.scope.wait(600);
    },
    next(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? (st.q.answer + 1) % 3 : st.q.answer; return { g: 'tap', p: { id: 'card' + i } }; },
    workEls(st) { return st.cards || []; },
    snap(st) { return { fold: st.q.f.kind, holes: st.q.holes.length }; },
  };
})();
/* ================================================================ 汪汪队·火星 (world 4, island ④: 6-10 的分与合)
   N1 分 every way to split N: pick all the right cards, then "done" · N2 配 the two cards that make N · N3 接 the split table:
   which row comes next · N4 想 a little sudoku of shapes (reasoning). Every rule: W4R.<id>, merged over W2Base by w4Game
   (raw/js/w4/games.js). One file scope: nothing here is global but W4R.N1-N4. */
(() => {
  const INK = '#2B2118', BLUE = '#4FB3FF', YEL = '#FFC93C';
  const deal = (G, rng, ok, others) => { const pos = bagPick(G, 'pos', [0, 1, 2]), o = rng.shuffle(others.slice()), out = []; for (let i = 0, k = 0; i < others.length + 1; i++) out.push(i === pos ? ok : o[k++]); return out; };
  const dotRow = (n, col, g, per) => {
    g = g || 15; per = per || 5; const pr = Math.max(1, Math.min(per, n)), rows = Math.max(1, Math.ceil(n / per)), r = g * 0.39;
    const s = svg('svg', { viewBox: '0 0 ' + (pr * g + 2) + ' ' + (rows * g + 2), width: pr * g + 2, height: rows * g + 2 });
    for (let i = 0; i < n; i++) svg('circle', { cx: 1 + g / 2 + (i % per) * g, cy: 1 + g / 2 + Math.floor(i / per) * g, r, fill: col || BLUE, stroke: INK, 'stroke-width': 2 }, s);
    s.style.flexShrink = '0'; s.style.pointerEvents = 'none'; return s;
  };
  const numNode = (n, h, dots, col, g) => {
    const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pointerEvents: 'none' });
    if (digits()) d.appendChild(UI.num(n, h));
    if (dots || !digits()) d.appendChild(dotRow(n, col, g || (digits() ? 15 : 20)));
    return d;
  };
  /* + − = drawn as thick bars (a font's minus is a thin dash); anything else as text */
  const opNode = (t, size) => {
    size = Math.round(size || 46);
    if (t === '-' || t === '+' || t === '=') {
      const s = svg('svg', { viewBox: '0 0 60 60', width: size, height: size }); s.style.flexShrink = '0'; s.style.pointerEvents = 'none';
      const bar = (x, y, w, h) => svg('rect', { x, y, width: w, height: h, rx: Math.min(w, h) / 2, fill: INK }, s);
      if (t === '=') { bar(8, 16, 44, 10); bar(8, 34, 44, 10); } else { bar(6, 25, 48, 10); if (t === '+') bar(25, 6, 10, 48); }
      return s;
    }
    const o = el('span', ''); o.textContent = t; Object.assign(o.style, { font: '900 ' + size + 'px/1 system-ui, sans-serif', color: INK, pointerEvents: 'none' }); return o;
  };
  const qBox = h => { const b = el('div', ''); Object.assign(b.style, { width: Math.round(h * 0.78) + 'px', height: Math.round(h * 1.02) + 'px', border: '4px dashed ' + INK, borderRadius: '10px', background: '#FFF7D6', flexShrink: '0', pointerEvents: 'none' }); return b; };
  const board = (st, z, bg) => { const e = W2X.thing(st, 10, 10, z || 4, ''); Object.assign(e.style, { background: bg || '#fff', borderRadius: '24px', boxShadow: '0 0 0 4px ' + INK + ', 0 6px 0 4px rgba(43,33,24,.18)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }); return e; };
  /* the whole: a big white disc with the number (and its dots at the low levels) */
  const whole = (st, n, dots) => { const e = board(st, 5); e.style.borderRadius = '50%'; e.appendChild(numNode(n, 74, dots, '#FF6B5B', 13)); return e; };
  /* a card is picked: yellow, with a tick */
  const mark = (e, on) => {
    e.classList.toggle('hi', on); e.style.background = on ? '#FFE58A' : '';
    let t = e.querySelector('.n4tick');
    if (on && !t) { t = el('div', 'n4tick', e); Object.assign(t.style, { position: 'absolute', right: '-12px', top: '-12px', width: '40px', height: '40px', pointerEvents: 'none' }); t.innerHTML = '<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="17" fill="#5CC46E" stroke="#2B2118" stroke-width="3.5"/><path d="M11 21L18 28L30 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
    if (!on && t) t.remove();
  };
  /* boxes of size w x h in rows of `per`, centred on cx; rows start at y0 */
  const grid = (n, per, cx, y0, w, h, gx, gy) => Array.from({ length: n }, (_, i) => { const r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per; return { x: Math.round(cx - (inRow * w + (inRow - 1) * gx) / 2 + c * (w + gx)), y: y0 + r * (h + gy) }; });

  /* ================================================================ N1 分 "7 can be split into ...?" - 5 or 6 cards "a | b", the
     child picks every right one, then the big tick. Right only when exactly the right cards are picked.
     L1 6 · L2 7 · L3 8 · L4 9, numbers only · L5 10, and one split also turned round ("4 | 6" and "6 | 4": both right). The wrong
     cards make N − 2, N − 1, N + 1 or N + 2. */
  W4R.N1 = {
    kind0: 'splits', verb: '分！', intro: '分一分，找全！', praise: ['全都找到啦！'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, N = 5 + d, nc = d <= 2 ? 5 : 6, dots = d <= 3;
      const halves = []; for (let x = 1; x <= N / 2; x++) halves.push(x);
      const nr = d === 1 ? 2 : d === 2 ? rng.pick([2, 3]) : 3;
      const right = rng.shuffle(halves.slice()).slice(0, nr).map(x => rng.chance(0.5) ? [x, N - x] : [N - x, x]);
      if (d === 5) { const t = right.find(p => p[0] !== p[1]); right.push([t[1], t[0]]); }
      const cards = right.map(p => ({ p, ok: true })), seen = new Set(cards.map(c => c.p.join()));
      for (let t = 0; t < 400 && cards.length < nc; t++) {
        const s = N + rng.pick([-2, -1, 1, 2]), x = rng.int(1, Math.min(9, s - 1)), y = s - x;
        if (y < 1 || y > 9 || seen.has(x + ',' + y) || seen.has(y + ',' + x)) continue;
        seen.add(x + ',' + y); cards.push({ p: [x, y], ok: false });
      }
      const order = rng.shuffle(cards);
      const answer = order.map((c, i) => c.ok ? i : -1).filter(i => i >= 0).join(',');
      return { k: [d, order.map(c => c.p.join('')).join('.')], N, cards: order, dots, answer };
    },
    geo(st) {
      const L = K.L(), n = st.q.cards.length;
      return L ? { wx: 512, wy: 100, ws: 132, per: 3, cx: 512, y0: 250, w: 220, h: 116, gx: 26, gy: 22 } : { wx: 352, wy: 210, ws: 132, per: 2, cx: 352, y0: 366, w: 290, h: 124, gx: 24, gy: 22, n };
    },
    decor(G) { W2X.decorDone(G, this.chars); },
    domino(p, dots) {
      const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'stretch', width: '100%', height: '100%', pointerEvents: 'none' });
      p.forEach((v, i) => { const h = el('div', '', d); Object.assign(h.style, { flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: i ? '4px solid ' + INK : '0' }); h.appendChild(numNode(v, dots ? 50 : 62, dots, i ? YEL : BLUE)); });
      return d;
    },
    place(st) {
      const g = this.geo(st);
      if (st.wh) place(st.wh, g.wx - g.ws / 2, g.wy, g.ws, g.ws);
      if (st.dom) grid(st.dom.length, g.per, g.cx, g.y0, g.w, g.h, g.gx, g.gy).forEach((b, i) => place(st.dom[i], b.x, b.y, g.w, g.h));
    },
    present(st) {
      const q = st.q;
      st.sel = [];
      st.wh = whole(st, q.N, q.dots);
      st.dom = q.cards.map((c, i) => { const e = W3X.card(st, 's' + i, 6, 'card'); e.appendChild(this.domino(c.p, q.dots)); return e; });
      st.doneBtn = K.done(st, 'check'); K.reg(st, 'done', st.doneBtn, {});
      this.place(st);
      K.pop(st, st.wh); st.dom.forEach((e, i) => K.pop(st, e, 100 + 70 * i));
      K.task(st, [[{ qty: q.N }], [W3X.ic('<circle cx="50" cy="22" r="14" fill="#FFC93C" stroke="#2B2118" stroke-width="4"/><path d="M42 34L24 62M58 34L76 62" stroke="#2B2118" stroke-width="5"/><circle cx="22" cy="74" r="12" fill="#4FB3FF" stroke="#2B2118" stroke-width="4"/><circle cx="78" cy="74" r="12" fill="#FFC93C" stroke="#2B2118" stroke-width="4"/>')], ['check']]);
      W3X.say2(st, CN[q.N] + '可以分成几和几？', '对的都点出来！');
    },
    onGesture(st, name, p) {
      const id = p.id || ''; if (name !== 'tap' || st.picked) return false;
      const m = /^s(\d)$/.exec(id);
      if (m) { const i = +m[1], on = !st.sel.includes(i); st.sel = on ? st.sel.concat(i) : st.sel.filter(x => x !== i); mark(st.dom[i], on); if (on) Sfx.place(); else Sfx.back(); st.doneBtn.classList.toggle('ready', st.sel.length > 0); return 'ok'; }
      if (id === 'done') { if (!st.sel.length) { K.wiggle(st, st.doneBtn); return 'free'; } st.picked = true; Session.submit(st, st.sel.slice().sort((a, b) => a - b).join(',')); return 'ok'; }
      return false;
    },
    async reveal(st) {
      const q = st.q, my = st, want = q.answer.split(',').map(Number);
      Sfx.reveal();
      for (const i of want) { if (!Session.alive(my)) return; K.ring(st, [box(st.dom[i])], 4, '#FFC93C'); K.hop(st, st.dom[i], 14); await st.scope.wait(260); }
      this.cheerAll(st);
      st.summary = CN[q.N] + '可以这样分！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
    },
    async feedback(st, ans) {
      const q = st.q, sel = String(ans).split(',').filter(Boolean).map(Number), bad = sel.find(i => !q.cards[i].ok);
      if (bad != null) { const p = q.cards[bad].p; K.wiggle(st, st.dom[bad]); W3X.say(CN[p[0]] + '和' + CN[p[1]] + '是' + CN[p[0] + p[1]]); }
      else { const miss = q.cards.filter((c, i) => c.ok && !sel.includes(i)).length; W3X.say('还有' + CNQ(miss) + '张对的'); }
      await st.scope.wait(600);
    },
    next(st, strat) {
      if (st.picked || !st.dom) return null;
      const want = st.q.answer.split(',').map(Number);
      if (strat === 'wrong') { if (!st.sel.length) return { g: 'tap', p: { id: 's' + st.q.cards.findIndex(c => !c.ok) } }; return { g: 'tap', p: { id: 'done' } }; }
      const extra = st.sel.find(i => !want.includes(i)); if (extra != null) return { g: 'tap', p: { id: 's' + extra } };
      const miss = want.find(i => !st.sel.includes(i)); return { g: 'tap', p: { id: miss != null ? 's' + miss : 'done' } };
    },
    workEls(st) { return st.dom || []; },
    snap(st) { return { N: st.q.N, sel: (st.sel || []).slice() }; },
  };

  /* ================================================================ N2 配 the rocket needs N: which two cards make N together?
     Exactly one pair of cards makes N (no other two cards do, no card is N's half). L1 N 6-7, 4 cards · L2 N 7-8, 5 cards · L3
     N 7-9, 6 cards · L4 N 8-10, numbers only · L5 N 8-10, some cards dots only, some numbers only. */
  W4R.N2 = {
    kind0: 'pair', verb: '配！', intro: '凑数配对！', praise: ['配得正好！'], props: ['rocket'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, N = rng.pick([null, [6, 7], [7, 8], [7, 8, 9], [8, 9, 10], [8, 9, 10]][d]), nc = [0, 4, 5, 6, 6, 6][d];
      for (let t = 0; t < 200; t++) {
        const x = rng.int(1, N - 1), y = N - x; if (x === y) continue;
        /* the other cards: never N's partner of a card already there, never N or its half; different numbers first (smaller
           than N first), then a number may come twice (two 3s make 6, not N) */
        const vals = [x, y], add = (v, dup) => { if (vals.length >= nc || v === N || 2 * v === N || vals.includes(N - v)) return; const k = vals.filter(u => u === v).length; if (k >= (dup ? 2 : 1)) return; vals.push(v); };
        rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).sort((a, b) => (a >= N) - (b >= N)).forEach(v => add(v, false));
        rng.shuffle([...Array(N - 1).keys()].map(v => v + 1)).forEach(v => add(v, true));
        if (vals.length < nc) continue;
        const order = rng.shuffle(vals.map((v, i) => ({ v, ok: i < 2 })));
        const look = d <= 3 ? order.map(() => 'both') : d === 4 ? order.map(() => 'num') : rng.shuffle(order.map((_, i) => i % 2 ? 'dots' : 'num'));
        const answer = order.map((c, i) => c.ok ? i : -1).filter(i => i >= 0).join(',');
        return { k: [d, N, order.map(c => c.v).join('')], N, vals: order.map(c => c.v), look, answer, fact: factOf('+', Math.min(x, y), Math.max(x, y)) };
      }
      return { k: [d, 7, '3412'], N: 7, vals: [3, 4, 1, 2], look: ['both', 'both', 'both', 'both'], answer: '0,1', fact: factOf('+', 3, 4) };
    },
    geo(st) {
      const L = K.L(), n = st.q.vals.length, per = n === 4 ? 2 : 3;
      return L ? { r: { x: 80, y: 130, w: 230, h: 320 }, cx: 600, y0: n === 4 ? 140 : 150, per, s: 140, g: 28 } : { r: { x: 237, y: 206, w: 230, h: 250 }, cx: 352, y0: 486, per, s: 140, g: 28 };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(st);
      if (st.rk) { place(st.rk, g.r.x, g.r.y, g.r.w, g.r.h); }
      if (st.nc) grid(st.nc.length, g.per, g.cx, g.y0, g.s, g.s, g.g, g.g).forEach((b, i) => place(st.nc[i], b.x, b.y, g.s, g.s));
    },
    present(st) {
      const q = st.q, dots = st.level <= 3;
      st.sel = [];
      st.rk = W2X.thing(st, 10, 10, 4, ''); st.rk.style.pointerEvents = 'none';
      const im = img('assets/props/rocket.png', '', st.rk); Object.assign(im.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' });
      const b = el('div', '', st.rk); Object.assign(b.style, { position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%,-50%)', width: '124px', height: '124px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 5px ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' });
      b.appendChild(numNode(q.N, dots ? 62 : 74, dots, '#FF6B5B', 11));
      st.nc = q.vals.map((v, i) => {
        const look = digits() ? q.look[i] : 'dots';
        const c = UI.card(v, 140, { dotsOnly: look === 'dots', numOnly: look === 'num' }); c.style.position = 'absolute'; Stage.el.appendChild(c); st.els.push(c); K.reg(st, 'k' + i, c, {});
        return c;
      });
      this.place(st);
      K.pop(st, st.rk); st.nc.forEach((c, i) => K.pop(st, c, 100 + 60 * i));
      K.task(st, [['assets/props/rocket.png'], [{ qty: q.N }], ['q']]);
      K.say(st, '哪两张合起来是' + CN[q.N] + '？');
    },
    onGesture(st, name, p) {
      const m = /^k(\d)$/.exec(p.id || ''); if (name !== 'tap' || !m || st.picked) return false;
      const i = +m[1];
      if (st.sel.includes(i)) { st.sel = []; mark(st.nc[i], false); Sfx.back(); return 'ok'; }
      st.sel.push(i); mark(st.nc[i], true); Sfx.place();
      if (st.sel.length === 2) { st.picked = true; Session.submit(st, st.sel.slice().sort((a, b) => a - b).join(',')); }
      return 'ok';
    },
    async reveal(st) {
      const q = st.q, [i, j] = q.answer.split(',').map(Number), a = q.vals[i], b = q.vals[j];
      K.ring(st, [box(st.nc[i]), box(st.nc[j])], 8, '#FFC93C'); Sfx.reveal();
      await st.scope.anim(st.rk, [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px) rotate(-3deg)' }, { transform: 'translateY(0)' }], { duration: 600, easing: EASE.pop });
      this.cheerAll(st);
      st.summary = CN[Math.min(a, b)] + '和' + CN[Math.max(a, b)] + '是' + CN[q.N] + '！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
    },
    async feedback(st, ans) {
      const q = st.q, ix = String(ans).split(',').map(Number), v = ix.map(i => q.vals[i]);
      ix.forEach(i => { if (st.nc[i]) K.wiggle(st, st.nc[i]); });
      W3X.say(CN[Math.min(v[0], v[1])] + '和' + CN[Math.max(v[0], v[1])] + '是' + CN[v[0] + v[1]]);
      await st.scope.wait(600);
    },
    next(st, strat) {
      if (st.picked || !st.nc) return null;
      const want = st.q.answer.split(',').map(Number);
      if (strat === 'wrong') { const bad = st.q.vals.findIndex((_, i) => !want.includes(i)); if (!st.sel.length) return { g: 'tap', p: { id: 'k' + bad } }; const j = st.q.vals.findIndex((_, k) => k !== st.sel[0]); return { g: 'tap', p: { id: 'k' + j } }; }
      if (st.sel.length && !want.includes(st.sel[0])) return { g: 'tap', p: { id: 'k' + st.sel[0] } };
      return { g: 'tap', p: { id: 'k' + want.find(i => !st.sel.includes(i)) } };
    },
    workEls(st) { return st.nc || []; },
    snap(st) { return { N: st.q.N, sel: (st.sel || []).slice() }; },
  };

  /* ================================================================ N3 接 the split table of N, row by row (1 + 7, 2 + 6, 3 + 5):
     which row comes next? The wrong rows never make N. L1 N 6-7, with dots · L2 N 7-8, with dots · L3 N 8-9, numbers only ·
     L4 a row in the middle is missing · L5 the table goes the other way (7 + 1, 6 + 2), N up to 10. */
  W4R.N3 = {
    kind0: 'splitrows', verb: '接！', intro: '找分合规律！', praise: ['规律找对啦！'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, N = rng.pick([null, [6, 7], [7, 8], [8, 9], [8, 9, 10], [8, 9, 10]][d]), dots = d <= 2;
      for (let t = 0; t < 200; t++) {
        const s = rng.int(1, d === 1 ? 2 : 3), r = d === 1 ? rng.int(2, 3) : 3;
        let rows, ask;
        if (d === 4) { if (s + 3 > N - 1) continue; rows = [0, 1, 2, 3].map(i => [s + i, N - s - i]); ask = rng.int(1, 2); }
        else if (d === 5) { if (s + r > N - 1) continue; rows = Array.from({ length: r + 1 }, (_, i) => [N - s - i, s + i]); ask = r; }
        else { if (s + r > N - 1) continue; rows = Array.from({ length: r + 1 }, (_, i) => [s + i, N - s - i]); ask = r; }
        const A = rows[ask][0], B = rows[ask][1];
        const fs = [[A, B + 1], [A + 1, B], [A, B - 1], [A - 1, B]].filter(p => p[0] >= 1 && p[1] >= 1 && p[0] <= 10 && p[1] <= 10 && !rows.some((q, i) => i !== ask && q[0] === p[0] && q[1] === p[1]));
        if (fs.length < 2) continue;
        const two = rng.shuffle(fs).slice(0, 2), ok = [A, B], opts = deal(G, rng, ok, two);
        return { k: [d, N, s, r, ask], N, rows, ask, dots, rev: d === 5, mid: d === 4, opts: opts.map(p => p.join('+')), pairs: opts, answer: A + '+' + B, fact: factOf('+', A, B) };
      }
      return { k: [d, 6, 1, 2, 2], N: 6, rows: [[1, 5], [2, 4], [3, 3]], ask: 2, dots, opts: ['3+3', '3+4', '4+3'], pairs: [[3, 3], [3, 4], [4, 3]], answer: '3+3', fact: factOf('+', 3, 3) };
    },
    geo(st) {
      const L = K.L(), n = st.q.rows.length;
      return L ? { wx: 340, wy: 100, ws: 112, rx: 160, rw: 360, ry: 226, rh: 74, rg: 12, ox: 560, ow: 330, oy: 146, oh: 112, og: 18, col: true }
        : { wx: 352, wy: 210, ws: 112, rx: 132, rw: 440, ry: 336, rh: 72, rg: 12, ox: 26, ow: 204, oy: 340 + n * 84 + 18, oh: 124, og: 20, col: false };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    /* one row "a + b" (a blue bar of a dots and a yellow one of b under it at the low levels) */
    rowNode(p, dots, q, big) {
      const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: big ? '22px' : '10px', flexWrap: 'wrap', pointerEvents: 'none' });
      const eq = el('div', '', d); Object.assign(eq.style, { display: 'flex', alignItems: 'center', gap: '10px' });
      if (q) { eq.appendChild(qBox(46)); eq.appendChild(opNode('+', 40)); eq.appendChild(qBox(46)); return d; }
      if (digits()) { eq.appendChild(UI.num(p[0], 48)); eq.appendChild(opNode('+', 40)); eq.appendChild(UI.num(p[1], 48)); }
      if (dots || !digits()) { const bar = el('div', '', d); Object.assign(bar.style, { display: 'flex', gap: '7px' }); bar.appendChild(dotRow(p[0], BLUE, 17, 10)); bar.appendChild(dotRow(p[1], YEL, 17, 10)); }
      return d;
    },
    place(st) {
      const g = this.geo(st), L = K.L();
      if (st.wh) place(st.wh, g.wx - g.ws / 2, g.wy, g.ws, g.ws);
      (st.rowEls || []).forEach((e, i) => place(e, g.rx, g.ry + i * (g.rh + g.rg), g.rw, g.rh));
      if (st.cards) st.cards.forEach((c, i) => L ? place(c, g.ox, g.oy + i * (g.oh + g.og), g.ow, g.oh) : place(c, g.ox + i * (g.ow + g.og), g.oy, g.ow, g.oh));
    },
    present(st) {
      const q = st.q;
      st.wh = whole(st, q.N, q.dots);
      st.rowEls = q.rows.map((p, i) => { const e = board(st, 5, i === q.ask ? '#FFF7D6' : '#fff'); e.style.borderRadius = '18px'; e.appendChild(this.rowNode(p, q.dots, i === q.ask, true)); return e; });
      st.cards = q.pairs.map((p, i) => { const c = W3X.card(st, 'card' + i, 6, 'card'); c.appendChild(this.rowNode(p, q.dots, false, false)); return c; });
      st.opts = q.opts.slice();
      this.place(st);
      K.pop(st, st.wh); st.rowEls.forEach((e, i) => K.pop(st, e, 80 + 70 * i)); st.cards.forEach((c, i) => K.pop(st, c, 400 + 80 * i));
      K.task(st, [[W3X.ic('<path d="M14 20H86M14 40H86M14 60H86M14 80H86" stroke="#2B2118" stroke-width="5" stroke-linecap="round"/><circle cx="26" cy="20" r="6" fill="#4FB3FF"/><circle cx="26" cy="40" r="6" fill="#4FB3FF"/><circle cx="26" cy="60" r="6" fill="#4FB3FF"/><circle cx="26" cy="80" r="6" fill="#FFC93C"/>')], ['q']]);
      W3X.say2(st, CN[q.N] + '分成两个数。', q.mid ? '中间缺了哪一行？' : '下一行是什么？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, e = st.rowEls[q.ask], A = q.rows[q.ask];
      e.innerHTML = ''; e.style.background = '#E6F8E9'; e.appendChild(this.rowNode(A, q.dots, false, true)); K.pop(st, e);
      K.ring(st, [box(st.cards[st.opts.indexOf(q.answer)])], 6, '#FFC93C'); Sfx.reveal();
      for (let i = 0; i < st.rowEls.length; i++) { if (!Session.alive(my)) return; K.hop(st, st.rowEls[i], 10); await st.scope.wait(180); }
      this.cheerAll(st);
      st.summary = CN[A[0]] + '加' + CN[A[1]] + '等于' + CN[q.N] + '！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1100);
    },
    async feedback(st, ans) {
      const i = st.opts.indexOf(ans), p = st.q.pairs[i]; if (st.cards[i]) K.wiggle(st, st.cards[i]);
      W3X.say(CN[p[0]] + '加' + CN[p[1]] + '是' + CN[p[0] + p[1]]); await st.scope.wait(600);
    },
    next(st, strat) { if (st.picked || !st.cards) return null; const a = st.opts.indexOf(st.q.answer), i = strat === 'wrong' ? (a + 1) % 3 : a; return { g: 'tap', p: { id: 'card' + i } }; },
    workEls(st) { return st.cards || []; },
    snap(st) { return { N: st.q.N, ask: st.q.ask }; },
  };

  /* ================================================================ N4 想 a little sudoku: three shapes, every row and every
     column has each shape once - what is under the "?"? L1 3 x 3, one gap, its row tinted · L2 the same, no tint · L3 two gaps
     in one column (the row of the "?" is full) · L4 two gaps in one row (look down the column) · L5 4 x 4 with four shapes,
     two gaps. The "?" always follows from its row or its column alone: one right shape. */
  const SH = [{ k: 'star', c: '#FFC93C', n: '星星' }, { k: 'circle', c: '#4FB3FF', n: '圆圈' }, { k: 'tri', c: '#FF6B5B', n: '三角' }, { k: 'sq', c: '#5CC46E', n: '方块' }];
  W4R.N4 = {
    kind0: 'sudoku', verb: '填！', intro: '小小数独！', praise: ['每格都想对啦！'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, n = d === 5 ? 4 : 3;
      for (let t = 0; t < 200; t++) {
        const rp = rng.shuffle([...Array(n).keys()]), cp = rng.shuffle([...Array(n).keys()]), sp = rng.shuffle([...Array(n).keys()]);
        const g = rp.map(r => cp.map(c => sp[(r + c) % n]));
        const ar = rng.int(0, n - 1), ac = rng.int(0, n - 1);
        let other = null;
        if (d === 3) other = [rng.pick([...Array(n).keys()].filter(r => r !== ar)), ac];
        else if (d === 4) other = [ar, rng.pick([...Array(n).keys()].filter(c => c !== ac))];
        else if (d === 5) { const cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!(r === ar && c === ac)) cells.push([r, c]); other = rng.pick(cells); }
        const blank = (r, c) => (r === ar && c === ac) || (other && other[0] === r && other[1] === c);
        const seen = new Set(); for (let i = 0; i < n; i++) { if (!blank(ar, i)) seen.add(g[ar][i]); if (!blank(i, ac)) seen.add(g[i][ac]); }
        if (seen.size !== n - 1 || seen.has(g[ar][ac])) continue;            /* the "?" follows from what is seen */
        const opts = [...Array(n).keys()];
        return { k: [d, g.map(r => r.join('')).join('/'), ar, ac, other ? other.join('') : ''], n, g, ar, ac, other, tint: d === 1, answer: g[ar][ac], opts };
      }
      return this.gen(G, Object.assign({}, o, { level: 1 }));
    },
    geo(st) {
      const L = K.L(), n = st.q.n;
      return L ? { cs: n === 4 ? 84 : 108, cx: 512, y: 102, os: n === 4 ? 116 : 124, og: n === 4 ? 24 : 30, oy: n === 4 ? 512 : 516 } : { cs: n === 4 ? 100 : 128, cx: 352, y: 216, os: n === 4 ? 130 : 140, og: n === 4 ? 22 : 30, oy: n === 4 ? 732 : 740 };
    },
    cardSpot(st) { const g = this.geo(st); return { cx: g.cx, cy: g.oy }; },
    decor(G) { W3X.decor2(G, this.chars); },
    shapeSvg(i, size) { const s = svg('svg', { viewBox: '0 0 100 100', width: size, height: size }); s.style.pointerEvents = 'none'; W2X.shape(s, SH[i].k, 50, 52, 30, SH[i].c, 0, 5); return s; },
    sheet(q, fillAns) {
      const n = q.n, s = svg('svg', { viewBox: '0 0 ' + (n * 100 + 12) + ' ' + (n * 100 + 12), width: '100%', height: '100%' }); s.style.pointerEvents = 'none';
      svg('rect', { x: 3, y: 3, width: n * 100 + 6, height: n * 100 + 6, rx: 16, fill: '#fff', stroke: INK, 'stroke-width': 6 }, s);
      if (q.tint) svg('rect', { x: 8, y: 6 + q.ar * 100 + 2, width: n * 100 - 4, height: 96, rx: 10, fill: '#FFF1B8' }, s);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const x = 6 + c * 100, y = 6 + r * 100, ask = r === q.ar && c === q.ac, oth = q.other && q.other[0] === r && q.other[1] === c;
        if (ask) { svg('rect', { x: x + 8, y: y + 8, width: 84, height: 84, rx: 12, fill: fillAns ? '#E6F8E9' : '#FFE58A', stroke: INK, 'stroke-width': 4, 'stroke-dasharray': fillAns ? 'none' : '8 6' }, s); if (fillAns) W2X.shape(s, SH[q.g[r][c]].k, x + 50, y + 52, 30, SH[q.g[r][c]].c, 0, 5); else { const t = svg('text', { x: x + 50, y: y + 70, 'text-anchor': 'middle', 'font-size': 56, 'font-weight': 900, fill: INK, 'font-family': 'system-ui, sans-serif' }, s); t.textContent = '?'; } }
        else if (oth) svg('rect', { x: x + 10, y: y + 10, width: 80, height: 80, rx: 12, fill: '#EEF1F6', stroke: '#B8C0CC', 'stroke-width': 3 }, s);
        else W2X.shape(s, SH[q.g[r][c]].k, x + 50, y + 52, 30, SH[q.g[r][c]].c, 0, 5);
      }
      for (let i = 1; i < n; i++) { svg('path', { d: 'M' + (6 + i * 100) + ' 8V' + (n * 100 + 4), stroke: INK, 'stroke-width': 3, opacity: 0.55 }, s); svg('path', { d: 'M8 ' + (6 + i * 100) + 'H' + (n * 100 + 4), stroke: INK, 'stroke-width': 3, opacity: 0.55 }, s); }
      return s;
    },
    place(st) {
      const g = this.geo(st), q = st.q, W = q.n * g.cs + 12;
      if (st.bd) place(st.bd, g.cx - W / 2, g.y, W, W);
      if (st.cards) K.cardsPlace(st, { cx: g.cx, cy: g.oy, gap: g.og });
    },
    present(st) {
      const q = st.q, g = this.geo(st);
      st.bd = W2X.thing(st, 10, 10, 4, ''); st.bd.style.pointerEvents = 'none'; st.bd.appendChild(this.sheet(q, false));
      W2X.cards(st, q.opts.map(i => this.shapeSvg(i, '100%')), q.opts, { size: g.os, gap: g.og, cx: g.cx, cy: g.oy });
      this.place(st); K.pop(st, st.bd);
      K.task(st, [[W3X.ic('<rect x="10" y="10" width="80" height="80" rx="6" fill="#FFF8EC" stroke="#2B2118" stroke-width="5"/><path d="M37 10V90M63 10V90M10 37H90M10 63H90" stroke="#2B2118" stroke-width="3"/><circle cx="23" cy="23" r="7" fill="#4FB3FF"/><polygon points="50,43 57,56 43,56" fill="#FF6B5B"/><text x="77" y="84" font-size="22" font-weight="900" text-anchor="middle" fill="#2B2118">?</text>')], ['q']]);
      W3X.say2(st, '每行每列不一样。', '问号里是什么？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, c = st.cards[st.opts.indexOf(q.answer)];
      st.bd.innerHTML = ''; st.bd.appendChild(this.sheet(q, true)); K.pop(st, st.bd);
      if (c) { K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 14); }
      Sfx.reveal(); this.cheerAll(st);
      st.summary = '每行每列都不一样！'; Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
    },
    async feedback(st, ans) {
      const q = st.q, i = st.opts.indexOf(ans); if (st.cards[i]) K.wiggle(st, st.cards[i]);
      const blank = (r, c) => (r === q.ar && c === q.ac) || (q.other && q.other[0] === r && q.other[1] === c);
      const inRow = q.g[q.ar].some((v, c) => v === ans && !blank(q.ar, c));
      W3X.say((inRow ? '这一行有' : '这一列有') + SH[ans].n + '了'); await st.scope.wait(600);
    },
    next(st, strat) { if (st.picked || !st.cards) return null; const a = st.opts.indexOf(st.q.answer), i = strat === 'wrong' ? (a + 1) % st.opts.length : a; return { g: 'tap', p: { id: 'card' + i } }; },
    workEls(st) { return st.cards || []; },
    snap(st) { return { n: st.q.n, other: st.q.other }; },
  };
})();
/* ================================================================ ⑤ 葫芦娃·星球 (10 以内加, from level 2): O1 三个葫芦倒进碗 ·
   O2 走哪条路 · O3 数字金字塔 · O4 数字规律 (reasoning). docs/W4-DESIGN.md ⑤. Everything inside one function: no
   top-level names (all islands share one script). Registered (background, friends, icon, review card) in games.js. */
(() => {
  const INK = '#2B2118';
  const SEEDC = ['#FF6B5B', '#FFC93C', '#4FB3FF'];
  /* n dots in rows of `per` */
  const dots = (n, o) => {
    o = o || {};
    const per = Math.min(o.per || 5, Math.max(1, n)), g = o.g || 15, r = o.r || 5.8, rows = Math.max(1, Math.ceil(n / per)), w = per * g + 4, h = rows * g + 4;
    const s = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h });
    for (let i = 0; i < n; i++) svg('circle', { cx: 2 + g / 2 + (i % per) * g, cy: 2 + g / 2 + Math.floor(i / per) * g, r, fill: o.fill || '#4FB3FF', stroke: INK, 'stroke-width': 2.2 }, s);
    s.style.flexShrink = '0'; s.style.pointerEvents = 'none'; return s;
  };
  /* a numeral, with its dots under it at the low levels */
  const numDots = (n, h, withDots, o) => {
    const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pointerEvents: 'none' });
    d.appendChild(UI.num(n, h));
    if (withDots && n > 0 && n <= 10) d.appendChild(dots(n, o));
    return d;
  };
  const opEl = (t, size) => { const o = el('span', ''); o.textContent = t === '-' ? '−' : t; Object.assign(o.style, { font: '900 ' + Math.round(size) + 'px/1 system-ui, sans-serif', color: INK, pointerEvents: 'none' }); return o; };
  /* a number sentence: numbers, + - =, and '?' as a dashed box */
  const eqEl = (parts, h) => {
    const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: Math.round(h * 0.16) + 'px', pointerEvents: 'none' });
    parts.forEach(t => {
      if (typeof t === 'number') d.appendChild(UI.num(t, h));
      else if (t === '?') { const b = el('div', '', d); Object.assign(b.style, { width: Math.round(h * 0.85) + 'px', height: Math.round(h * 1.05) + 'px', border: '5px dashed ' + INK, borderRadius: '12px', background: '#FFF7D6' }); }
      else d.appendChild(opEl(t, h * 0.8));
    });
    return d;
  };
  const qmark = h => opEl('?', h);
  /* a white panel (not a target) */
  const panel = (st, z) => { const e = W2X.thing(st, 10, 10, z || 4, ''); Object.assign(e.style, { background: '#fff', borderRadius: '20px', boxShadow: '0 0 0 4px ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }); return e; };
  const popIn = (st, e, delay) => st.scope.anim(e, [{ transform: 'scale(0)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 300, delay: delay || 0, easing: EASE.pop, fill: 'backwards' });
  const numCards = (st, vals, withDots, h) => {
    st.cards = vals.map((v, i) => { const c = W3X.card(st, 'card' + i, 6); c.appendChild(numDots(v, h || 64, withDots, { g: 18, r: 7 })); return c; });
    st.opts = vals.slice();
  };
  const row = (els, cx, cy, w, h, gap) => { const tot = els.length * w + (els.length - 1) * gap; els.forEach((e, i) => place(e, Math.round(cx - tot / 2 + i * (w + gap)), Math.round(cy - h / 2), w, h)); };
  const col = (els, x, y, w, h, gap) => els.forEach((e, i) => place(e, x, y + i * (h + gap), w, h));
  const cardNext = (st, strat) => { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; };
  const seedSvg = c => '<svg viewBox="0 0 24 28" width="100%" height="100%"><path d="M12 2C19 8 21.5 15 20.5 20A8.6 8.6 0 0 1 3.5 20C2.5 15 5 8 12 2Z" fill="' + c + '" stroke="#2B2118" stroke-width="2.6" stroke-linejoin="round"/><path d="M9 12Q7.6 16.5 9.6 20.5" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const plusLine = (ns, r) => ns.map(x => CN[x]).join('加') + '等于' + CN[r] + '！';

  /* ---------------------------------------------------------------- O1 倒！ three gourds, a + b + c seeds, one closed bowl.
     The child taps each gourd (it tips, its seeds fly into the bowl and are gone from sight); then: how many in the bowl?
     L1 sum <= 5 (the gourds' tags: numeral + dots, answer cards with dots) · L2 <= 7 · L3 <= 8, cards numerals only ·
     L4 <= 10, the tags numerals only · L5 <= 10, pick the number sentence a + b + c = s (the wrong ones are false: a wrong
     sum, or an addend that is not on the gourds). */
  const BOWL = '<svg viewBox="0 0 260 130" width="100%" height="100%" preserveAspectRatio="none"><path d="M8 32Q14 124 130 126Q246 124 252 32Z" fill="#B97A3C" stroke="#2B2118" stroke-width="7" stroke-linejoin="round"/><ellipse cx="130" cy="32" rx="122" ry="21" fill="#6E4120" stroke="#2B2118" stroke-width="7"/><path d="M42 74Q130 98 218 74" fill="none" stroke="#D9A066" stroke-width="8" stroke-linecap="round"/></svg>';
  W4R.O1 = {
    kind0: 'pour3', verb: '倒！', intro: '葫芦倒种子！', praise: ['算得真准！'], props: ['gourd'],
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng;
      const [lo, hi, mx] = [null, [3, 5, 3], [5, 7, 4], [6, 8, 5], [7, 10, 6], [7, 10, 6]][d];
      const s0 = rng.int(lo, hi), a = rng.int(Math.max(1, s0 - 2 * mx), Math.min(mx, s0 - 2)), b = rng.int(Math.max(1, s0 - a - mx), Math.min(mx, s0 - a - 1)), c = s0 - a - b;    /* the sum first (spread evenly), then three parts */
      const s = a + b + c, q = { k: [d, a, b, c], d, n: [a, b, c], s, dotsG: d <= 3, dotsC: d <= 2, eq: d === 5 };
      if (!q.eq) { q.answer = s; q.opts = numOptions(G, s, 1, 10); return q; }
      const ok = { s: [a, '+', b, '+', c, '=', s], why: 'ok' };
      const rs = s >= 10 ? s - 1 : s <= 3 ? s + 1 : (rng.chance(0.5) ? s + 1 : s - 1);
      const res = { s: [a, '+', b, '+', c, '=', rs], why: 'res' };
      const k = rng.int(0, 2), v = q.n[k], nv = v <= 1 ? v + 1 : v >= 6 ? v - 1 : (rng.chance(0.5) ? v + 1 : v - 1);
      const n2 = q.n.slice(); n2[k] = nv;
      const add = { s: [n2[0], '+', n2[1], '+', n2[2], '=', s], why: 'add' };
      const pos = bagPick(G, 'o1pos', [0, 1, 2]), wr = rng.shuffle([res, add]);
      q.eqs = [0, 1, 2].map(i => (i === pos ? ok : wr.shift()));
      q.answer = pos; q.opts = [0, 1, 2];
      return q;
    },
    geo(st) {
      const L = K.L(), eq = st.q.eq;
      if (L) return eq ? { gx: [160, 320, 480], gy: 112, gw: 136, gh: 236, bowl: { x: 190, y: 374, w: 260, h: 128 }, eq: { x: 586, y: 122, w: 364, h: 110, gap: 22 } }
        : { gx: [300, 512, 724], gy: 112, gw: 136, gh: 236, bowl: { x: 382, y: 374, w: 260, h: 128 }, cards: { cx: 512, cy: 600, s: 140, gap: 36 } };
      return eq ? { gx: [152, 352, 552], gy: 222, gw: 150, gh: 250, bowl: { x: 207, y: 494, w: 290, h: 132 }, eq: { x: 162, y: 656, w: 380, h: 98, gap: 14 } }
        : { gx: [150, 352, 554], gy: 232, gw: 160, gh: 272, bowl: { x: 192, y: 540, w: 320, h: 150 }, cards: { cx: 352, cy: 840, s: 150, gap: 36 } };
    },
    decor(G) { if (K.L()) W3X.decor2(G, this.chars); else W2X.hideAll(G, this.chars); },
    place(st) {
      if (!st.q) return;
      const g = this.geo(st);
      if (st.bowl) place(st.bowl, g.bowl.x, g.bowl.y, g.bowl.w, g.bowl.h);
      (st.gd || []).forEach((o, i) => place(o.e, g.gx[i] - g.gw / 2, g.gy, g.gw, g.gh));
      if (st.cards) { if (g.eq) col(st.cards, g.eq.x, g.eq.y, g.eq.w, g.eq.h, g.eq.gap); else row(st.cards, g.cards.cx, g.cards.cy, g.cards.s, g.cards.s, g.cards.gap); }
      if (st.win) { const rows = Math.ceil(st.q.s / 5), w = 5 * 38 + 28, h = rows * 40 + 24; place(st.win, Math.round(g.bowl.x + g.bowl.w / 2 - w / 2), Math.round(g.bowl.y + g.bowl.h / 2 - h / 2 + 8), w, h); }
    },
    async present(st) {
      const q = st.q;
      st.bowl = W2X.thing(st, 10, 10, 4, ''); st.bowl.innerHTML = BOWL;
      st.gd = q.n.map((n, i) => {
        const e = W2X.thing(st, 10, 10, 6, '');
        const im = img('assets/props/gourd.png', '', e); Object.assign(im.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '64%', objectFit: 'contain', transformOrigin: '50% 45%' });
        const tag = el('div', '', e); Object.assign(tag.style, { position: 'absolute', left: '9%', right: '9%', bottom: '0', height: '33%', background: '#fff', borderRadius: '16px', boxShadow: '0 0 0 4px ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' });
        tag.appendChild(numDots(n, q.dotsG ? 42 : 58, q.dotsG, { fill: SEEDC[i], g: 18, r: 7 }));
        K.reg(st, 'g' + i, e, {});
        return { e, im, tag, n, poured: false };
      });
      st.left = 3;
      this.place(st);
      popIn(st, st.bowl); st.gd.forEach((o, i) => popIn(st, o.e, 120 + 110 * i));
      K.task(st, [['assets/props/gourd.png'], [W3X.ic('<path d="M10 42Q14 86 50 88Q86 86 90 42Z" fill="#B97A3C" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/><ellipse cx="50" cy="42" rx="40" ry="9" fill="#6E4120" stroke="#2B2118" stroke-width="5"/>')], ['q']]);
      st.phase = 'act';                                   /* the child pours first; the question comes after the third gourd */
      K.say(st, '点葫芦，倒种子！');
    },
    pour(st, i) {
      const o = st.gd[i];
      if (!o || o.poured || st.phase !== 'act') return false;
      o.poured = true; st.left--;
      const last = !st.left;
      if (last) st.phase = 'pouring';                     /* nothing to tap until the question is up */
      const done = this.pourAnim(st, o, i);
      if (last) done.then(() => { if (Session.alive(st) && st.phase === 'pouring') this.ask(st); });
      return 'ok';
    },
    async pourAnim(st, o, i) {
      const b = box(st.bowl), gb = box(o.e), gcx = gb.x + gb.w / 2, bcx = b.x + b.w / 2;
      const dir = gcx < bcx - 30 ? 1 : gcx > bcx + 30 ? -1 : 1;
      Sfx.whoosh(0.2);
      st.scope.anim(o.im, [{ transform: 'rotate(0)' }, { transform: 'rotate(' + dir * 112 + 'deg)', offset: 0.3 }, { transform: 'rotate(' + dir * 112 + 'deg)', offset: 0.75 }, { transform: 'rotate(0)' }], { duration: 1100 + 110 * o.n, easing: EASE.glide, fill: 'none' });
      const mx = gcx + dir * gb.w * 0.34, my = gb.y + gb.h * 0.36, tx = bcx, ty = b.y + b.h * 0.24;
      const all = [];
      for (let k = 0; k < o.n; k++) {
        const s = W2X.thing(st, 24, 28, 9, ''); s.innerHTML = seedSvg(SEEDC[i]); place(s, mx - 12, my - 14, 24, 28);
        const dx = tx - mx + ((k % 3) - 1) * 28, dy = ty - my;
        all.push(st.scope.anim(s, [{ transform: 'translate(0,0) scale(.5)', opacity: 0 }, { transform: 'translate(' + Math.round(dx * 0.4) + 'px,' + Math.round(dy * 0.2 - 40) + 'px) scale(1)', opacity: 1, offset: 0.35 }, { transform: 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px) scale(.9)', opacity: 1, offset: 0.85 }, { transform: 'translate(' + Math.round(dx) + 'px,' + Math.round(dy + 18) + 'px) scale(.6)', opacity: 0 }], { duration: 650, delay: 330 + 120 * k, fill: 'both', easing: 'ease-in' }).then(() => s.remove()));
        st.scope.timeout(() => Sfx.pop(), 880 + 120 * k);
      }
      await Promise.all(all);
      await st.scope.wait(250);
      o.im.style.filter = 'saturate(.2) brightness(1.18) drop-shadow(0 5px 0 rgba(43,33,24,.14))';    /* an empty gourd (pale); its tag still says how many it had */
    },
    ask(st) {
      const q = st.q;
      if (q.eq) { st.cards = q.eqs.map((x, i) => { const c = W3X.card(st, 'card' + i, 6); c.appendChild(eqEl(x.s, 44)); return c; }); st.opts = [0, 1, 2]; }
      else numCards(st, q.opts, q.dotsC, 64);
      this.place(st);
      st.cards.forEach((c, i) => popIn(st, c, 80 * i));
      st.phase = 'ready'; Hints.reset(st);
      K.say(st, q.eq ? '哪个算式对？' : '碗里一共几颗？');
    },
    onGesture(st, name, p) {
      const m = /^g(\d)$/.exec(p.id || '');
      if (m) return name === 'tap' ? this.pour(st, +m[1]) : false;
      return W3X.tapCards(st, name, p);
    },
    async reveal(st) {
      const q = st.q, my = st, card = st.cards[q.eq ? q.answer : st.opts.indexOf(q.answer)];
      if (card) K.ring(st, [box(card)], 6, '#FFC93C');
      /* the bowl is opened: its seeds in rows of five, in the colours of their gourds */
      const win = st.win = W2X.thing(st, 10, 10, 8, ''); Object.assign(win.style, { background: '#FFF8EC', borderRadius: '22px', boxShadow: '0 0 0 4px ' + INK, display: 'grid', gridTemplateColumns: 'repeat(5, 34px)', gap: '6px 4px', padding: '12px 14px', justifyContent: 'center', alignContent: 'center' });
      const seeds = [];
      q.n.forEach((n, i) => { for (let j = 0; j < n; j++) { const s = el('div', '', win); Object.assign(s.style, { width: '30px', height: '34px', justifySelf: 'center' }); s.innerHTML = seedSvg(SEEDC[i]); seeds.push(s); } });
      this.place(st); popIn(st, win); Sfx.reveal();
      await st.scope.wait(300);
      for (let k = 0; k < seeds.length; k++) { if (!Session.alive(my)) return; K.hop(st, seeds[k], 10); await Count.beat(st.scope, 260, k + 1); }
      this.cheerAll(st);
      st.summary = q.eq ? plusLine(q.n, q.s) : '一共' + CNQ(q.s) + '颗！';
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
    },
    async feedback(st, ans) {
      const q = st.q, i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]);
      let line;
      if (q.eq) { const x = q.eqs[ans]; line = x.why === 'res' ? '加起来不是' + CN[x.s[6]] : '和葫芦不一样'; }
      else line = '不是' + CNQ(ans) + '颗';
      W3X.say(line); await st.scope.wait(600);
    },
    next(st, strat) {
      if (st.phase === 'act') { const i = (st.gd || []).findIndex(o => !o.poured); return i >= 0 ? { g: 'tap', p: { id: 'g' + i } } : null; }
      return cardNext(st, strat);
    },
    workEls(st) { return st.phase === 'act' ? (st.gd || []).filter(o => !o.poured).map(o => o.e) : st.cards || []; },
    gestureHint(st) { if (st.phase === 'act') { const o = (st.gd || []).find(x => !x.poured); if (o) W3X.tapHint(st, o.e); } else if (st.gd) K.flash(st, st.gd.map(o => o.tag)); },
    snap(st) { return { poured: (st.gd || []).filter(o => o.poured).length }; },
  };

  /* ---------------------------------------------------------------- O2 走！ which path's number stones add up to N? (tap the
     path; exactly one does). L1 two paths of two stones, N <= 6, stones with dots · L2 N <= 8 · L3 three stones a path ·
     L4 N <= 10, numerals only · L5 three paths. The wrong paths add up to N +- 1 or 2. */
  W4R.O2 = {
    kind0: 'paths', verb: '走！', intro: '找对的路！', praise: ['路找对啦！'], props: ['magicgourd'],
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng, P = d === 5 ? 3 : 2, S = d <= 2 ? 2 : 3, hi = [0, 6, 8, 8, 10, 10][d];
      const comp = total => { const p = []; let left = total; for (let i = 0; i < S - 1; i++) { const v = rng.int(1, left - (S - 1 - i)); p.push(v); left -= v; } p.push(left); return rng.shuffle(p); };
      for (let t = 0; t < 400; t++) {
        const N = rng.int(S + 1, hi), sums = [N];
        rng.shuffle([-2, -1, 1, 2]).concat([-3, 3]).forEach(x => { const w = N + x; if (sums.length < P && w >= S && w <= hi && !sums.includes(w)) sums.push(w); });
        if (sums.length < P) continue;
        const right = comp(N), wrong = sums.slice(1).map(comp);
        const ans = bagPick(G, 'o2p' + P, P === 2 ? [0, 1] : [0, 1, 2]);
        const paths = [], ss = [];
        for (let i = 0, w = 0; i < P; i++) { if (i === ans) { paths.push(right); ss.push(N); } else { paths.push(wrong[w]); ss.push(sums[1 + w]); w++; } }
        return { k: [d, N, paths.map(x => x.join('')).join('-')], d, N, paths, sums: ss, answer: ans, opts: P === 2 ? [0, 1] : [0, 1, 2], dotsOn: d <= 3 };
      }
      return { k: [d, 'x'], d, N: 3, paths: [[1, 2], [2, 2]], sums: [3, 4], answer: 0, opts: [0, 1], dotsOn: true };
    },
    geo(st) {
      const L = K.L(), P = st.q.paths.length, S = st.q.paths[0].length;
      const xs = P === 2 ? (L ? [372, 652] : [212, 492]) : (L ? [290, 512, 734] : [128, 352, 576]);
      const g = L ? { xs, lw: 150, ly: 168, lh: 420, goal: { x: 432, y: 20, w: 160, h: 118 }, gimg: { x: 604, y: 26, w: 76, h: 108 }, start: { x: 512, y: 652 } }
        : { xs, lw: 150, ly: 300, lh: 480, goal: { x: 267, y: 132, w: 170, h: 124 }, gimg: { x: 446, y: 138, w: 80, h: 112 }, start: { x: 352, y: 852 } };
      g.sw = 122; g.sh = S === 2 ? 132 : 112; g.sgap = S === 2 ? 40 : 20;
      return g;
    },
    decor(G) { W3X.decor2(G, this.chars); },
    stoneXY(st, g, i, j) {             /* stage centre of stone j (top to bottom) on path i */
      const S = st.q.paths[i].length, tot = S * g.sh + (S - 1) * g.sgap, y0 = g.ly + g.lh / 2 - tot / 2;
      return { x: g.xs[i], y: y0 + j * (g.sh + g.sgap) + g.sh / 2 };
    },
    place(st) {
      if (!st.q || !st.lanes) return;
      const g = this.geo(st), L = K.L();
      place(st.goal, g.goal.x, g.goal.y, g.goal.w, g.goal.h);
      place(st.gimg, g.gimg.x, g.gimg.y, g.gimg.w, g.gimg.h);
      st.lanes.forEach((ln, i) => {
        place(ln.e, g.xs[i] - g.lw / 2, g.ly, g.lw, g.lh);
        ln.stones.forEach((s, j) => { const c = this.stoneXY(st, g, i, j); place(s, Math.round(c.x - g.xs[i] + g.lw / 2 - g.sw / 2), Math.round(c.y - g.ly - g.sh / 2), g.sw, g.sh); });
      });
      if (!st.walked) place(st.walker, g.start.x - 40, g.start.y - 40, 80, 80);
      /* the roads: from the start up every path to the goal */
      const W = Stage.W, H = Stage.H, gx = g.goal.x + g.goal.w / 2, gy = g.goal.y + g.goal.h;
      let d = '';
      g.xs.forEach(x => { d += 'M' + g.start.x + ' ' + g.start.y + 'Q' + x + ' ' + (g.start.y - 6) + ' ' + x + ' ' + (g.ly + g.lh - 10) + 'L' + x + ' ' + (g.ly + 10) + 'Q' + x + ' ' + (gy + 6) + ' ' + gx + ' ' + gy; });
      st.road.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '"><path d="' + d + '" fill="none" stroke="#2B2118" stroke-width="' + (L ? 54 : 58) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/><path d="' + d + '" fill="none" stroke="#E9C98F" stroke-width="' + (L ? 44 : 48) + '" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="#F6E2B8" stroke-width="6" stroke-dasharray="2 18" stroke-linecap="round"/></svg>';
      place(st.road, 0, 0, W, H);
    },
    async present(st) {
      const q = st.q;
      st.road = W2X.thing(st, 10, 10, 2, '');
      st.goal = panel(st, 6); st.goal.appendChild(numDots(q.N, q.dotsOn ? 56 : 76, q.dotsOn, { g: 17, r: 6.6, fill: '#FFC93C' }));
      st.goal.style.boxShadow = '0 0 0 4px #2B2118, 0 0 0 10px #FFC93C';
      st.gimg = K.item(Stage.el, 'assets/props/magicgourd.png', 76, 108); st.gimg.style.zIndex = 6; st.els.push(st.gimg);
      st.lanes = q.paths.map((p, i) => {
        const e = W2X.thing(st, 10, 10, 5, ''); Object.assign(e.style, { borderRadius: '34px', background: 'rgba(255,255,255,.22)', border: '4px dashed rgba(43,33,24,.4)', boxSizing: 'border-box' });
        const stones = p.map(v => { const s = el('div', '', e); Object.assign(s.style, { position: 'absolute', background: '#fff', borderRadius: '24px', boxShadow: '0 0 0 4px #2B2118, 0 6px 0 4px #9AA3AE', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }); s.appendChild(numDots(v, q.dotsOn ? 46 : 64, q.dotsOn, { g: 16, r: 6.2 })); return s; });
        K.reg(st, 'p' + i, e, {});
        return { e, stones };
      });
      st.walker = W2X.thing(st, 80, 80, 9, ''); Object.assign(st.walker.style, { borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 4px #2B2118', overflow: 'hidden' });
      const wi = img('assets/thumbs/' + this.chars[0] + '.png', '', st.walker); Object.assign(wi.style, { width: '100%', height: '100%', objectFit: 'cover' });
      this.place(st);
      popIn(st, st.goal); st.lanes.forEach((ln, i) => popIn(st, ln.e, 120 + 120 * i)); popIn(st, st.walker, 200);
      K.say(st, '哪条路加起来是' + CN[q.N] + '？');
    },
    onGesture(st, name, p) {
      const m = /^p(\d)$/.exec(p.id || '');
      if (name !== 'tap' || !m || st.picked) return false;
      st.picked = true; Session.submit(st, +m[1]); return 'ok';
    },
    async reveal(st) {
      const q = st.q, my = st, i = q.answer, ln = st.lanes[i], g = this.geo(st);
      K.ring(st, [box(ln.e)], 6, '#FFC93C');
      st.walked = true;
      const order = ln.stones.map((_, j) => j).reverse();          /* from the start: bottom stone first */
      for (const j of order) {
        if (!Session.alive(my)) return;
        const c = this.stoneXY(st, g, i, j);
        await K.flyTo(st, st.walker, c.x + g.sw / 2 - 20, c.y - 40, 380, 40);
        K.hop(st, ln.stones[j], 14); Sfx.hop();
        await st.scope.wait(220);
      }
      if (!Session.alive(my)) return;
      await K.flyTo(st, st.walker, g.goal.x + g.goal.w / 2 - 40, g.goal.y + g.goal.h - 30, 420, 40);
      K.hop(st, st.goal, 16); Sfx.reveal(); this.cheerAll(st);
      st.summary = plusLine(order.map(j => q.paths[i][j]), q.N);
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
    },
    async feedback(st, ans) { const ln = st.lanes[ans]; if (ln) K.wiggle(st, ln.e); W3X.say('这条加起来是' + CN[st.q.sums[ans]]); await st.scope.wait(600); },
    next(st, strat) { if (st.picked || !st.lanes) return null; const i = strat === 'wrong' ? st.q.opts.find(x => x !== st.q.answer) : st.q.answer; return { g: 'tap', p: { id: 'p' + i } }; },
    workEls(st) { return (st.lanes || []).map(ln => ln.e); },
    gestureHint(st) { if (st.goal) K.flash(st, [st.goal]); },
    snap(st) { return { P: st.q.paths.length }; },
  };

  /* ---------------------------------------------------------------- O3 垒！ the number pyramid: the two blocks below add up to
     the block above. L1 two blocks -> the top (<= 5, dots) · L2 the same to 10 · L3 three layers, only the top is asked
     (the middle is empty: two sums, then their sum) · L4 the top and one block known, the other block (numerals only) ·
     L5 three layers, a middle block: its partner is empty too, so it is the top minus (the two blocks under the partner). */
  const ROWC = ['#FFC93C', '#4FB3FF', '#5CC46E'];
  W4R.O3 = {
    kind0: 'pyramid', verb: '垒！', intro: '垒数字金字塔！', praise: ['金字塔垒好啦！'], props: [],
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng;
      if (d <= 2) {
        const T = d === 1 ? rng.int(2, 5) : rng.int(5, 10), a = rng.int(1, T - 1), b = T - a;
        return { k: [d, a, b], d, rows: [[T], [a, b]], show: [['?'], [a, b]], ask: [0, 0], answer: T, opts: numOptions(G, T, 1, 10), dotsOn: true, dotsC: true, fact: factOf('+', a, b) };
      }
      if (d === 4) {
        const side = bagPick(G, 'o3s4', ['L', 'R']), x = rng.int(1, 8), T = rng.int(Math.max(4, x + 1), 10), a = side === 'L' ? x : T - x, b = T - a;
        return { k: [4, a, b, side], d, rows: [[T], [a, b]], show: [[T], side === 'L' ? ['?', b] : [a, '?']], ask: [1, side === 'L' ? 0 : 1], answer: x, opts: numOptions(G, x, 1, 10), dotsOn: false, dotsC: false, fact: factOf('-', T, side === 'L' ? b : a) };
      }
      let a = 1, b = 1, c = 2, T = 5;
      for (let t = 0; t < 400; t++) { const x = rng.int(1, 4), y = rng.int(1, 3), z = rng.int(1, 4), s = x + 2 * y + z; if (s >= (d === 3 ? 5 : 6) && s <= 10) { a = x; b = y; c = z; T = s; break; } }
      const m1 = a + b, m2 = b + c, rows = [[T], [m1, m2], [a, b, c]];
      if (d === 3) return { k: [3, a, b, c], d, rows, show: [['?'], [null, null], [a, b, c]], ask: [0, 0], answer: T, opts: numOptions(G, T, 1, 10), dotsOn: true, dotsC: false };
      const side = bagPick(G, 'o3s5', ['L', 'R']), x = side === 'R' ? m2 : m1;
      return { k: [5, a, b, c, side], d, rows, show: side === 'R' ? [[T], [null, '?'], [a, b, null]] : [[T], ['?', null], [null, b, c]], ask: [1, side === 'R' ? 1 : 0], answer: x, opts: numOptions(G, x, 1, 10), dotsOn: false, dotsC: false };
    },
    geo(st) {
      const L = K.L(), n = st.q.rows.length;
      const [bw, bh, gap, top] = L ? (n === 2 ? [170, 136, 14, 150] : [150, 112, 10, 114]) : (n === 2 ? [190, 150, 14, 290] : [170, 122, 12, 250]);
      return { cx: L ? 512 : 352, top, bw, bh, gap, cards: { cx: L ? 512 : 352, cy: L ? 594 : 788, s: L ? 140 : 150, gap: 36 } };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      if (!st.q || !st.blocks) return;
      const g = this.geo(st);
      st.blocks.forEach((r, ri) => { const w = r.length * g.bw + (r.length - 1) * g.gap, x0 = g.cx - w / 2, y = g.top + ri * (g.bh + g.gap); r.forEach((b, i) => place(b.e, Math.round(x0 + i * (g.bw + g.gap)), y, g.bw, g.bh)); });
      if (st.cards) row(st.cards, g.cards.cx, g.cards.cy, g.cards.s, g.cards.s, g.cards.gap);
    },
    paint(st, b, v, ri) {
      const e = b.e, q = st.q, base = ri === 0 ? ROWC[0] : ri === q.rows.length - 1 ? ROWC[2] : ROWC[1];     /* top yellow, middle blue, bottom green */
      e.innerHTML = ''; b.v = v;
      Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '18px', border: 'none', boxSizing: 'border-box' });
      if (v === '?') { Object.assign(e.style, { background: '#FFF7D6', border: '5px dashed #2B2118', boxShadow: 'none' }); e.appendChild(qmark(64)); }
      else if (v === null) Object.assign(e.style, { background: '#EFE6D4', boxShadow: '0 0 0 4px #2B2118, 0 7px 0 4px ' + base });      /* an empty block: solid, plain */
      else { Object.assign(e.style, { background: '#fff', boxShadow: '0 0 0 4px #2B2118, 0 7px 0 4px ' + base }); e.appendChild(numDots(v, q.dotsOn ? 52 : 68, q.dotsOn, { g: 17, r: 6.6 })); }
    },
    async present(st) {
      const q = st.q;
      st.blocks = q.show.map((r, ri) => r.map(v => { const b = { e: W2X.thing(st, 10, 10, 5, '') }; this.paint(st, b, v, ri); return b; }));
      numCards(st, q.opts, q.dotsC, 64);
      this.place(st);
      st.blocks.slice().reverse().forEach((r, k) => r.forEach((b, i) => popIn(st, b.e, 120 * k + 60 * i)));
      st.cards.forEach((c, i) => popIn(st, c, 400 + 80 * i));
      K.task(st, [[W3X.ic('<rect x="31" y="8" width="38" height="30" rx="6" fill="#FFF7D6" stroke="#2B2118" stroke-width="5" stroke-dasharray="6 4"/><rect x="8" y="50" width="38" height="30" rx="6" fill="#fff" stroke="#2B2118" stroke-width="5"/><rect x="54" y="50" width="38" height="30" rx="6" fill="#fff" stroke="#2B2118" stroke-width="5"/><path d="M27 46L39 40M73 46L61 40" stroke="#2B2118" stroke-width="4" stroke-linecap="round"/>')], ['q']]);
      W3X.say2(st, '两块加起来是上面。', q.ask[0] === 0 ? '上面是几？' : '问号是几？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, n = q.rows.length, card = st.cards[st.opts.indexOf(q.answer)];
      if (card) K.hop(st, card, 18);
      /* every empty block fills in: the middle first, then the asked one, then any empty bottom block */
      const todo = [];
      q.show.forEach((r, ri) => r.forEach((v, i) => { if (v === null || v === '?') todo.push([ri, i, v === '?' ? 1 : ri === 1 ? 0 : 2]); }));
      todo.sort((x, y) => x[2] - y[2]);
      for (const [ri, i] of todo) {
        if (!Session.alive(my)) return;
        this.paint(st, st.blocks[ri][i], q.rows[ri][i], ri);
        popIn(st, st.blocks[ri][i].e); Sfx.place();
        if (ri < n - 1) { K.hop(st, st.blocks[ri + 1][i].e, 10); K.hop(st, st.blocks[ri + 1][i + 1].e, 10); }
        await st.scope.wait(450);
      }
      if (!Session.alive(my)) return;
      K.ring(st, [box(st.blocks[0][0].e), box(st.blocks[1][0].e), box(st.blocks[1][1].e)], 10, '#FFC93C');
      Sfx.reveal(); this.cheerAll(st);
      st.summary = plusLine([q.rows[1][0], q.rows[1][1]], q.rows[0][0]);
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
    },
    async feedback(st, ans) {
      const q = st.q, i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]);
      let line;
      if (q.ask[0] === 0) line = '上面不是' + CN[ans];
      else if (q.rows.length === 2) line = '加起来不是' + CN[q.rows[0][0]];       /* this one and the other block do not make the top */
      else line = '这块不是' + CN[ans];
      W3X.say(line); await st.scope.wait(600);
    },
    next(st, strat) { return cardNext(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { const q = st.q; if (st.blocks) K.flash(st, [st.blocks[q.ask[0]][q.ask[1]].e]); },
    snap(st) { return { rows: st.q.rows.length }; },
  };

  /* ---------------------------------------------------------------- O4 续！ number rows that grow or shrink by a fixed step
     (reasoning; no repeating patterns - world 2 has those): what is the "?" (three choices). Every number within 0-20.
     L1 +1 from 1-6, with dots · L2 -1, or +1 starting anywhere (dots while the row stays within 10) · L3 +2 or -2 ·
     L4 +2 or -2, numerals only, the "?" anywhere in the row (also first or in the middle) · L5 steps of 3 (+3 / -3, "?"
     anywhere) or a row whose step itself grows by one each time (1, 2, 4, 7, ? - "?" last). Five places a row; with four
     numbers known and a fixed rule there is exactly one right answer. */
  W4R.O4 = {
    kind0: 'numseq', verb: '续！', intro: '找数字规律！', praise: ['规律找到啦！'], props: [],
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng;
      const kind = d === 1 ? 'up1' : d === 2 ? bagPick(G, 'o4k2', ['dn1', 'up1x']) : d <= 4 ? bagPick(G, 'o4k' + d, ['up2', 'dn2']) : bagPick(G, 'o4k5', ['up3', 'dn3', 'grow', 'grow']);
      const step = { up1: 1, up1x: 1, dn1: -1, up2: 2, dn2: -2, up3: 3, dn3: -3 }[kind];
      let seq;
      if (kind === 'grow') { const d0 = rng.pick([1, 1, 2]), s = rng.int(0, d0 === 1 ? 10 : 6); seq = [s]; for (let i = 0; i < 4; i++) seq.push(seq[i] + d0 + i); }
      else {
        const lo = step > 0 ? (kind === 'up1' ? 1 : 0) : -4 * step, hi = step > 0 ? (kind === 'up1' ? 6 : 20 - 4 * step) : 20;
        const s = rng.int(lo, hi); seq = [0, 1, 2, 3, 4].map(i => s + i * step);
      }
      const miss = d === 4 || kind === 'up3' || kind === 'dn3' ? rng.int(0, 4) : 4, ans = seq[miss];
      const opts = numOptions(G, ans, 0, d <= 3 && Math.max(...seq) <= 10 ? 10 : 20);       /* a row within 10 keeps its cards within 10 (dots on both) */
      const dotsOn = d <= 3 && Math.max(...seq, ...opts) <= 10;
      return { k: [d, kind, seq.join(','), miss], d, kind, seq, miss, answer: ans, opts, dotsOn };
    },
    geo(st) {
      const L = K.L(), n = st.q.seq.length, dt = st.q.dotsOn;
      const w = L ? (n >= 6 ? 118 : 134) : (n >= 6 ? 100 : n === 5 ? 120 : 150), gap = L ? 18 : 12, h = dt ? 150 : 124;
      return { w, h, gap, cx: L ? 512 : 352, y: L ? 170 : 320, cards: { cx: L ? 512 : 352, cy: L ? 536 : 750, s: L ? 140 : 150, gap: 36 } };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      if (!st.q || !st.cells) return;
      const g = this.geo(st);
      row(st.cells, g.cx, g.y + g.h / 2, g.w, g.h, g.gap);
      if (st.cards) row(st.cards, g.cards.cx, g.cards.cy, g.cards.s, g.cards.s, g.cards.gap);
    },
    paint(st, e, v) {
      const q = st.q; e.innerHTML = '';
      Object.assign(e.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', boxSizing: 'border-box', border: 'none' });
      if (v === '?') { Object.assign(e.style, { background: '#FFF7D6', border: '5px dashed #2B2118', boxShadow: 'none' }); e.appendChild(qmark(68)); }
      else { Object.assign(e.style, { background: '#fff', boxShadow: '0 0 0 4px #2B2118, 0 7px 0 4px #B57BFF' }); e.appendChild(numDots(v, q.dotsOn ? 52 : 68, q.dotsOn, { g: 16, r: 6.2 })); }
    },
    async present(st) {
      const q = st.q;
      st.cells = q.seq.map((v, i) => { const e = W2X.thing(st, 10, 10, 5, ''); this.paint(st, e, i === q.miss ? '?' : v); return e; });
      numCards(st, q.opts, q.dotsOn, 64);
      this.place(st);
      st.cells.forEach((e, i) => popIn(st, e, 90 * i));
      st.cards.forEach((c, i) => popIn(st, c, 90 * q.seq.length + 80 * i));
      K.task(st, [[W3X.ic('<rect x="2" y="30" width="28" height="40" rx="6" fill="#fff" stroke="#2B2118" stroke-width="4"/><rect x="36" y="30" width="28" height="40" rx="6" fill="#fff" stroke="#2B2118" stroke-width="4"/><rect x="70" y="30" width="28" height="40" rx="6" fill="#FFF7D6" stroke="#2B2118" stroke-width="4" stroke-dasharray="5 4"/><path d="M10 50H22M44 44V56M38 50H58" stroke="#E8414B" stroke-width="5" stroke-linecap="round"/>', 56)], ['q']]);
      K.say(st, q.miss === q.seq.length - 1 ? '下一个是几？' : '问号是几？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, card = st.cards[st.opts.indexOf(q.answer)];
      if (card) K.hop(st, card, 18);
      this.paint(st, st.cells[q.miss], q.answer); popIn(st, st.cells[q.miss]); Sfx.place();
      await st.scope.wait(350);
      for (let i = 0; i < st.cells.length; i++) { if (!Session.alive(my)) return; K.hop(st, st.cells[i], 14); Sfx.count(i + 1); await st.scope.wait(230); }
      K.ring(st, [box(st.cells[q.miss])], 6, '#FFC93C'); Sfx.reveal(); this.cheerAll(st);
      st.summary = { up1: '每次多一个！', up1x: '每次多一个！', dn1: '每次少一个！', up2: '每次多两个！', dn2: '每次少两个！', up3: '每次多三个！', dn3: '每次少三个！', grow: '多得越来越多！' }[q.kind];
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('问号不是' + CN[ans]); await st.scope.wait(600); },
    next(st, strat) { return cardNext(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { if (st.cells) K.flash(st, st.cells); },
    snap(st) { return { kind: st.q.kind }; },
  };
})();
/* ================================================================ ⑥ 西游记·星宫 (10 以内减, from level 2): F5 两次被吃 ·
   F6 原来有几 · F7 找钥匙 · F8 迷宫 (reasoning). docs/W4-DESIGN.md ⑥. Everything inside one function: no top-level
   names (all islands share one script). Registered (background, friends, icon, review card) in games.js. */
(() => {
  const INK = '#2B2118';
  const EATC = ['#E8414B', '#2E6FD8'];              /* the first eater's cross, the second eater's cross */
  /* n dots in rows of `per`; crossed: taken away (pale, a red stroke) */
  const dots = (n, o) => {
    o = o || {};
    const per = Math.min(o.per || 5, Math.max(1, n)), g = o.g || 15, r = o.r || 5.8, rows = Math.max(1, Math.ceil(n / per)), w = per * g + 4, h = rows * g + 4;
    const s = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h });
    for (let i = 0; i < n; i++) {
      const x = 2 + g / 2 + (i % per) * g, y = 2 + g / 2 + Math.floor(i / per) * g;
      svg('circle', { cx: x, cy: y, r, fill: o.crossed ? '#FFF8EC' : (o.fill || '#4FB3FF'), stroke: INK, 'stroke-width': 2.2 }, s);
      if (o.crossed) svg('path', { d: 'M' + (x - r) + ' ' + (y - r) + 'L' + (x + r) + ' ' + (y + r), stroke: '#E8414B', 'stroke-width': 2.8, 'stroke-linecap': 'round' }, s);
    }
    s.style.flexShrink = '0'; s.style.pointerEvents = 'none'; return s;
  };
  const flexEl = (dir, gap) => { const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: dir || 'row', alignItems: 'center', justifyContent: 'center', gap: (gap || 0) + 'px', pointerEvents: 'none' }); return d; };
  const numDots = (n, h, withDots, o) => { const d = flexEl('column', 4); d.appendChild(UI.num(n, h)); if (withDots && n > 0 && n <= 10) d.appendChild(dots(n, o)); return d; };
  const opEl = (t, size) => { const o = el('span', ''); o.textContent = t === '-' ? '−' : t; Object.assign(o.style, { font: '900 ' + Math.round(size) + 'px/1 system-ui, sans-serif', color: INK, pointerEvents: 'none' }); return o; };
  /* a number sentence; withDots: every number with its dots under it, the number taken away crossed */
  const eqEl = (parts, h, withDots) => {
    const d = flexEl('row', Math.round(h * 0.18));
    parts.forEach((t, i) => {
      if (typeof t === 'number') d.appendChild(withDots ? numDots(t, h, true, { g: 18, r: 7, crossed: parts[i - 1] === '-' }) : UI.num(t, h));
      else d.appendChild(opEl(t, h * 0.8));
    });
    return d;
  };
  const panel = (st, z) => { const e = W2X.thing(st, 10, 10, z || 4, ''); Object.assign(e.style, { background: '#fff', borderRadius: '22px', boxShadow: '0 0 0 4px ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }); return e; };
  const popIn = (st, e, delay) => st.scope.anim(e, [{ transform: 'scale(0)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 300, delay: delay || 0, easing: EASE.pop, fill: 'backwards' });
  const numCards = (st, vals, withDots, h) => { st.cards = vals.map((v, i) => { const c = W3X.card(st, 'card' + i, 6); c.appendChild(numDots(v, h || 64, withDots, { g: 18, r: 7 })); return c; }); st.opts = vals.slice(); };
  const row = (els, cx, cy, w, h, gap) => { const tot = els.length * w + (els.length - 1) * gap; els.forEach((e, i) => place(e, Math.round(cx - tot / 2 + i * (w + gap)), Math.round(cy - h / 2), w, h)); };
  const col = (els, x, y, w, h, gap) => els.forEach((e, i) => place(e, x, y + i * (h + gap), w, h));
  const cardNext = (st, strat) => { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; };
  const face = (id, size) => { const f = el('div', ''); Object.assign(f.style, { width: size + 'px', height: size + 'px', borderRadius: '50%', overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 3px ' + INK, flexShrink: '0', pointerEvents: 'none' }); const im = img('assets/thumbs/' + id + '.png', '', f); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'cover' }); return f; };
  const crossSvg = c => '<svg viewBox="0 0 100 100" width="100%" height="100%" style="position:absolute;left:0;top:0;pointer-events:none"><path d="M20 20L80 80M80 20L20 80" stroke="#2B2118" stroke-width="20" stroke-linecap="round"/><path d="M20 20L80 80M80 20L20 80" stroke="' + c + '" stroke-width="12" stroke-linecap="round"/></svg>';
  /* a peach picture (crossed: eaten, in the eater's colour) */
  const peachEl = (size, crossC) => { const d = el('div', ''); Object.assign(d.style, { position: 'relative', width: size + 'px', height: size + 'px', pointerEvents: 'none' }); const im = img('assets/props/peach.png', '', d); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'contain', opacity: crossC ? '.42' : '1' }); if (crossC) d.insertAdjacentHTML('beforeend', crossSvg(crossC)); return d; };
  const subLine = (s, r) => s.map((t, i) => (typeof t === 'number' ? CN[t] : t === '-' ? '减' : '加')).join('') + '等于' + CN[r] + '！';
  const slotBox = (w, h) => { const s = el('div', ''); Object.assign(s.style, { width: w + 'px', height: h + 'px', border: '5px dashed ' + INK, borderRadius: '14px', background: '#FFF7D6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }); s.appendChild(opEl('?', h * 0.6)); return s; };
  const fillSlot = (s, n, h) => { if (!s) return; s.innerHTML = ''; s.style.border = '0'; s.style.background = 'transparent'; s.appendChild(UI.num(n, h)); };
  const PLATE = '<svg viewBox="0 0 640 320" width="100%" height="100%" preserveAspectRatio="none"><rect x="6" y="8" width="628" height="306" rx="130" fill="#FFFFFF" stroke="#2B2118" stroke-width="8"/><rect x="32" y="32" width="576" height="258" rx="106" fill="#FFF4E4" stroke="#8FB8E8" stroke-width="10"/></svg>';

  /* ---------------------------------------------------------------- F5 吃！ a plate of a peaches: Bajie eats b (crossed out
     in red), then Wukong eats c (crossed out in blue) - a still picture, the child only watches; how many are left?
     L1 one eater, a <= 6 (cards with dots) · L2 two eaters, a <= 6 · L3 a <= 9 (cards numerals only, 0 can be left) ·
     L4 pick the number sentence a − b − c (wrong ones: + for the second, one eater only, a wrong number) · L5 numerals only:
     the sentence a − b − c = ? builds up as the story is told, no peaches. */
  W4R.F5 = {
    kind0: 'eat2', verb: '吃！', intro: '八戒偷吃桃！', praise: ['算得真快！'], props: ['peach'],
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng, two = d >= 2, r0 = d <= 2 ? 1 : 0;
      const [lo, hi] = [null, [2, 6], [3, 6], [5, 9], [5, 9], [6, 10]][d];
      let a = lo, b = 1, c = two ? 1 : 0;
      for (let t = 0; t < 400; t++) {             /* what is left first (spread evenly), then what the two ate */
        const z0 = rng.int(r0, hi - (two ? 2 : 1)); if (z0 === 0 && rng.chance(0.6)) continue;
        const y = rng.int(1, Math.min(5, hi - z0 - (two ? 1 : 0))), z = two ? rng.int(1, Math.min(5, hi - z0 - y)) : 0, x = z0 + y + z;
        if (x < lo || x > hi) continue;
        a = x; b = y; c = z; break;
      }
      const r = a - b - c, q = { k: [d, a, b, c], d, a, b, c, r, two, pic: d <= 4, dotsC: d <= 2 };
      if (d === 1) q.fact = factOf('-', a, b);
      if (d !== 4) { q.answer = r; q.opts = numOptions(G, r, r0, 10); return q; }
      const ok = { s: [a, '-', b, '-', c], why: 'ok' }, cand = [{ s: [a, '-', b, '+', c], why: 'op' }, { s: [a, '-', b], why: 'one' }];
      const c2 = r >= 1 ? c + 1 : c - 1; if (c2 >= 1) cand.push({ s: [a, '-', b, '-', c2], why: 'c' });
      const b2 = r >= 1 ? b + 1 : b - 1; if (b2 >= 1) cand.push({ s: [a, '-', b2, '-', c], why: 'b' });
      const a2 = a < 10 ? a + 1 : a - 1; cand.push({ s: [a2, '-', b, '-', c], why: 'a' });
      const wr = rng.shuffle(cand).filter(x => JSON.stringify(x.s) !== JSON.stringify(ok.s)).slice(0, 2);
      const pos = bagPick(G, 'f5pos', [0, 1, 2]);
      q.eqs = [0, 1, 2].map(i => (i === pos ? ok : wr.shift()));
      q.answer = pos; q.opts = [0, 1, 2];
      return q;
    },
    geo(st) {
      const L = K.L(), d = st.q.d;
      const one = st.q.a <= 5;
      if (d === 4) return L ? { plate: { x: 26, y: 130, w: 510, h: 280 }, pp: 90, ps: 78, eq: { x: 560, y: 124, w: 370, h: 112, gap: 22 } }
        : { plate: { x: 72, y: 218, w: 560, h: 270 }, pp: 102, ps: 88, eq: { x: 132, y: 508, w: 440, h: 104, gap: 18 } };
      if (d === 5) return L ? { eqc: { x: 192, y: 140, w: 640, h: 210 }, cards: { cx: 512, cy: 568, s: 140, gap: 36 } }
        : { eqc: { x: 32, y: 280, w: 640, h: 210 }, cards: { cx: 352, cy: 690, s: 150, gap: 36 } };
      return L ? { plate: { x: 192, y: one ? 150 : 112, w: 640, h: one ? 230 : 320 }, pp: 112, ps: 96, cards: { cx: 512, cy: 578, s: 140, gap: 36 } }
        : { plate: { x: 42, y: one ? 270 : 226, w: 620, h: one ? 240 : 340 }, pp: 112, ps: 98, cards: { cx: 352, cy: 734, s: 150, gap: 36 } };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    peachXY(g, i, n) { const rows = Math.ceil(n / 5), r = Math.floor(i / 5), inRow = Math.min(5, n - r * 5), c = i % 5, P = g.plate; return { x: Math.round(P.x + P.w / 2 + (c - (inRow - 1) / 2) * g.pp - g.ps / 2), y: Math.round(P.y + P.h / 2 + (r - (rows - 1) / 2) * g.pp - g.ps / 2 + 8) }; },
    place(st) {
      if (!st.q) return;
      const g = this.geo(st);
      if (st.plate) { place(st.plate, g.plate.x, g.plate.y, g.plate.w, g.plate.h); st.peaches.forEach((p, i) => { const xy = this.peachXY(g, i, st.q.a); place(p.e, xy.x, xy.y, g.ps, g.ps); }); }
      if (st.eqBox) place(st.eqBox, g.eqc.x, g.eqc.y, g.eqc.w, g.eqc.h);
      if (st.cards) { if (g.eq) col(st.cards, g.eq.x, g.eq.y, g.eq.w, g.eq.h, g.eq.gap); else row(st.cards, g.cards.cx, g.cards.cy, g.cards.s, g.cards.s, g.cards.gap); }
    },
    /* the numerals-only level: the sentence grows with the story (a, − b under Bajie's face, − c under Wukong's, = ?) */
    renderEq(st, upto) {
      const q = st.q, b = st.eqBox; b.innerHTML = '';
      const r = el('div', '', b); Object.assign(r.style, { display: 'flex', alignItems: 'flex-end', gap: '16px', pointerEvents: 'none' });
      const num = (n, who) => { const c = el('div', '', r); Object.assign(c.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }); if (who) c.appendChild(face(who, 54)); else { const sp = el('div', '', c); sp.style.height = '54px'; } if (n === '?') { st.slot = slotBox(74, 92); c.appendChild(st.slot); } else c.appendChild(UI.num(n, 88)); };
      const op = t => { const o = opEl(t, 66); o.style.marginBottom = '14px'; r.appendChild(o); };
      num(q.a);
      if (upto >= 2) { op('-'); num(q.b, this.chars[0]); }
      if (upto >= 3 && q.two) { op('-'); num(q.c, this.chars[1]); }
      if (upto >= 4) { op('='); num('?'); }
    },
    async eat(st, who, from, n) {
      const a = st.G.actors[this.chars[who]]; if (a && a.x > 0 && a.x < Stage.W) a.hop();
      if (!st.peaches) { this.renderEq(st, who + 2); Sfx.pop(); await st.scope.wait(500); return; }
      for (let i = 0; i < n; i++) {
        const p = st.peaches[from + i]; p.by = who;
        p.e.querySelector('img').style.opacity = '.42'; p.e.insertAdjacentHTML('beforeend', crossSvg(EATC[who]));
        if (i === n - 1) { const f = face(this.chars[who], 42); Object.assign(f.style, { position: 'absolute', right: '-12px', top: '-14px' }); p.e.appendChild(f); }
        st.scope.anim(p.e, [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 260, fill: 'none' }); Sfx.pop();
        await st.scope.wait(280);
      }
    },
    async present(st) {
      const q = st.q, my = st;
      if (q.pic) {
        st.plate = W2X.thing(st, 10, 10, 4, ''); st.plate.innerHTML = PLATE;
        st.peaches = Array.from({ length: q.a }, () => { const e = K.item(Stage.el, 'assets/props/peach.png', 80, 80); e.style.zIndex = 6; st.els.push(e); return { e, by: null }; });
      } else { st.eqBox = panel(st, 6); this.renderEq(st, 1); }
      this.place(st);
      if (st.plate) { popIn(st, st.plate); st.peaches.forEach((p, i) => popIn(st, p.e, 120 + 50 * i)); } else popIn(st, st.eqBox);
      K.task(st, [['assets/props/peach.png'], [{ node: (() => { const d = peachEl(50, EATC[0]); return d; })() }], ['q']]);
      await st.scope.wait(700); if (!Session.alive(my)) return;
      K.say(st, '有' + CNQ(q.a) + '个桃！');
      await st.scope.wait(1500); if (!Session.alive(my)) return;
      const lead = ['八戒吃了' + CNQ(q.b) + '个！'];
      K.say(st, lead[0]); await this.eat(st, 0, q.a - q.b, q.b); if (!Session.alive(my)) return;
      await st.scope.wait(1100); if (!Session.alive(my)) return;
      if (q.two) {
        lead.push('悟空吃了' + CNQ(q.c) + '个！');
        K.say(st, lead[1]); await this.eat(st, 1, q.a - q.b - q.c, q.c); if (!Session.alive(my)) return;
        await st.scope.wait(1100); if (!Session.alive(my)) return;
      }
      if (st.eqBox) { this.renderEq(st, 4); }
      if (q.d === 4) { st.cards = q.eqs.map((x, i) => { const c = W3X.card(st, 'card' + i, 6); c.appendChild(eqEl(x.s, 52)); return c; }); st.opts = [0, 1, 2]; }
      else numCards(st, q.opts, q.dotsC, 64);
      this.place(st);
      st.cards.forEach((c, i) => popIn(st, c, 80 * i));
      st.lead = lead;                                      /* the story again before the question, when it is repeated */
      K.say(st, q.d === 4 ? '哪个算式对？' : '还剩几个？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, card = st.cards[q.d === 4 ? q.answer : st.opts.indexOf(q.answer)];
      if (card) K.ring(st, [box(card)], 6, '#FFC93C');
      fillSlot(st.slot, q.r, 88);
      if (st.peaches) { const left = st.peaches.filter(p => p.by === null); for (let k = 0; k < left.length; k++) { if (!Session.alive(my)) return; K.hop(st, left[k].e, 14); await Count.beat(st.scope, 280, k + 1); } }
      Sfx.reveal(); this.cheerAll(st);
      st.summary = subLine(q.two ? [q.a, '-', q.b, '-', q.c] : [q.a, '-', q.b], q.r);
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
    },
    async feedback(st, ans) {
      const q = st.q, i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]);
      const line = q.d === 4 ? { op: '两次都是吃掉', one: '悟空也吃了', c: '悟空吃了' + CNQ(q.c) + '个', b: '八戒吃了' + CNQ(q.b) + '个', a: '一开始有' + CNQ(q.a) + '个' }[q.eqs[ans].why] : W2Say.notN(ans);
      W3X.say(line); await st.scope.wait(600);
    },
    next(st, strat) { return cardNext(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { if (st.plate) K.flash(st, [st.plate]); else if (st.eqBox) K.flash(st, [st.eqBox]); },
    snap(st) { return { two: st.q.two }; },
  };

  /* ---------------------------------------------------------------- F6 猜！ how many were there? A covered basket; Wukong ate
     b (crossed out), c are left (seen): how many were in the basket? L1 <= 5 (both groups as peaches, cards with dots) ·
     L2 <= 7 · L3 <= 8, the eaten ones only as a number (count on from it) · L4 numerals only: ? − b = c · L5 ? − b − c = d. */
  W4R.F6 = {
    kind0: 'whole', verb: '猜！', intro: '猜猜原来几个！', praise: ['猜对啦！'], props: ['peach', 'bamboobasket'],
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng;
      if (d === 5) {
        let b = 1, c = 2, e = 3;
        for (let t = 0; t < 400; t++) { const x = rng.int(1, 4), y = rng.int(1, 4), z = rng.int(1, 5); if (x + y + z >= 6 && x + y + z <= 10) { b = x; c = y; e = z; break; } }
        const a = b + c + e;
        return { k: [5, b, c, e], d, a, b, c, left: e, answer: a, opts: numOptions(G, a, 1, 10) };
      }
      const [lo, hi] = [null, [2, 5], [4, 7], [5, 8], [5, 10]][d], a = rng.int(lo, hi), b = rng.int(1, Math.min(5, a - 1));
      return { k: [d, a, b], d, a, b, left: a - b, answer: a, opts: numOptions(G, a, 1, 10), fact: factOf('-', a, b), dotsC: d <= 2 };
    },
    geo(st) {
      const L = K.L(), d = st.q.d;
      if (d >= 4) return L ? { eqc: { x: 162, y: 140, w: 700, h: 220 }, cards: { cx: 512, cy: 572, s: 140, gap: 36 } }
        : { eqc: { x: 22, y: 280, w: 660, h: 220 }, cards: { cx: 352, cy: 700, s: 150, gap: 36 } };
      return L ? { basket: { x: 407, y: 102, w: 210, h: 166 }, pe: { x: 150, y: 300, w: 340, h: 210 }, pl: { x: 534, y: 300, w: 340, h: 210 }, cards: { cx: 512, cy: 610, s: 140, gap: 36 } }
        : { basket: { x: 247, y: 212, w: 210, h: 166 }, pe: { x: 22, y: 446, w: 320, h: 230 }, pl: { x: 362, y: 446, w: 320, h: 230 }, cards: { cx: 352, cy: 790, s: 150, gap: 36 } };
    },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      if (!st.q) return;
      const g = this.geo(st);
      if (st.basket) {
        place(st.basket, g.basket.x, g.basket.y, g.basket.w, g.basket.h); place(st.pe, g.pe.x, g.pe.y, g.pe.w, g.pe.h); place(st.pl, g.pl.x, g.pl.y, g.pl.w, g.pl.h);
        /* two arrows: the basket's peaches went two ways */
        const W = Stage.W, H = Stage.H, bx = g.basket.x + g.basket.w / 2, by = g.basket.y + g.basket.h - 6, ar = (x2, y2) => { const x1 = bx + (x2 < bx ? -40 : 40), dx = x2 - x1, dy = y2 - by, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l; return '<path d="M' + x1 + ' ' + by + 'L' + (x2 - ux * 6) + ' ' + (y2 - uy * 6) + '" stroke="#2B2118" stroke-width="7" stroke-linecap="round"/><path d="M' + (x2 - ux * 22 - uy * 14) + ' ' + (y2 - uy * 22 + ux * 14) + 'L' + x2 + ' ' + y2 + 'L' + (x2 - ux * 22 + uy * 14) + ' ' + (y2 - uy * 22 - ux * 14) + '" fill="none" stroke="#2B2118" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'; };
        st.arrows.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + ar(g.pe.x + g.pe.w * 0.6, g.pe.y - 12) + ar(g.pl.x + g.pl.w * 0.4, g.pl.y - 12) + '</svg>';
        place(st.arrows, 0, 0, W, H);
      }
      if (st.eqBox) place(st.eqBox, g.eqc.x, g.eqc.y, g.eqc.w, g.eqc.h);
      if (st.cards) row(st.cards, g.cards.cx, g.cards.cy, g.cards.s, g.cards.s, g.cards.gap);
    },
    peachGrid(n, crossC, size) { const d = el('div', ''); Object.assign(d.style, { display: 'grid', gridTemplateColumns: 'repeat(' + Math.min(4, n) + ', ' + size + 'px)', gap: '6px 8px', pointerEvents: 'none' }); const list = []; for (let i = 0; i < n; i++) { const p = peachEl(size, crossC); d.appendChild(p); list.push(p); } return { d, list }; },
    async present(st) {
      const q = st.q, C = this.chars;
      if (q.d <= 3) {
        st.arrows = W2X.thing(st, 10, 10, 3, '');
        st.basket = W2X.thing(st, 10, 10, 5, '');
        const bi = img('assets/props/bamboobasket.png', '', st.basket); Object.assign(bi.style, { position: 'absolute', left: '0', top: '14%', width: '100%', height: '86%', objectFit: 'contain' });
        st.basket.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 190 156" preserveAspectRatio="none" width="100%" height="100%" style="position:absolute;left:0;top:0;pointer-events:none"><path d="M10 74Q20 8 95 8Q170 8 180 74Q150 92 95 90Q40 92 10 74Z" fill="#D63B2F" stroke="#2B2118" stroke-width="6" stroke-linejoin="round"/><path d="M40 40Q95 26 150 40" fill="none" stroke="#FFC93C" stroke-width="6" stroke-linecap="round"/></svg>');
        st.btag = el('div', '', st.basket); Object.assign(st.btag.style, { position: 'absolute', left: '50%', top: '30%', width: '78px', height: '78px', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 4px ' + INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }); st.btag.appendChild(opEl('?', 56));
        st.pe = panel(st, 5); st.pl = panel(st, 5);
        const fw = face(C[0], 58); Object.assign(fw.style, { position: 'absolute', left: '-18px', top: '-20px' }); st.pe.appendChild(fw);
        if (q.d <= 2) { const g1 = this.peachGrid(q.b, EATC[0], 70); st.pe.appendChild(g1.d); st.eaten = g1.list; }
        else { const r = flexEl('column', 6); r.appendChild(peachEl(66, EATC[0])); r.appendChild(UI.num(q.b, 96)); st.pe.appendChild(r); st.eatNum = r; }      /* eaten: only how many (count on from it) */
        const g2 = this.peachGrid(q.left, null, 70); st.pl.appendChild(g2.d); st.leftP = g2.list;
      } else {
        st.eqBox = panel(st, 6);
        const r = el('div', '', st.eqBox); Object.assign(r.style, { display: 'flex', alignItems: 'flex-end', gap: '16px', pointerEvents: 'none' });
        const num = (n, top) => { const c = el('div', '', r); Object.assign(c.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }); c.appendChild(top || (() => { const sp = el('div', ''); sp.style.height = '58px'; return sp; })()); if (n === '?') { st.slot = slotBox(76, 94); c.appendChild(st.slot); } else c.appendChild(UI.num(n, 88)); };
        const op = t => { const o = opEl(t, 66); o.style.marginBottom = '14px'; r.appendChild(o); };
        const bk = el('div', ''); Object.assign(bk.style, { width: '66px', height: '58px' }); const bim = img('assets/props/bamboobasket.png', '', bk); Object.assign(bim.style, { width: '100%', height: '100%', objectFit: 'contain' });
        num('?', bk); op('-'); num(q.b, face(C[0], 58));
        if (q.d === 5) { op('-'); num(q.c, face(C[1], 58)); }
        op('='); num(q.left);
      }
      numCards(st, q.opts, q.dotsC, 64);
      this.place(st);
      [st.basket, st.pe, st.pl, st.eqBox].filter(Boolean).forEach((e, i) => popIn(st, e, 120 * i));
      st.cards.forEach((c, i) => popIn(st, c, 360 + 80 * i));
      K.task(st, [['assets/props/bamboobasket.png'], ['q']]);
      W3X.say2(st, q.d === 5 ? '吃了两次，还剩' + CNQ(q.left) + '个。' : '吃了' + CNQ(q.b) + '个，还剩' + CNQ(q.left) + '个。', '原来有几个？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, card = st.cards[st.opts.indexOf(q.answer)];
      if (card) K.ring(st, [box(card)], 6, '#FFC93C');
      if (st.btag) { st.btag.innerHTML = ''; st.btag.appendChild(UI.num(q.a, 54)); popIn(st, st.btag); }
      fillSlot(st.slot, q.a, 88);
      Sfx.reveal();
      if (st.leftP) {                     /* count them all: the eaten ones (or their number), then on with the ones left */
        let k = 0;
        if (st.eaten) for (const p of st.eaten) { if (!Session.alive(my)) return; K.hop(st, p, 12); await Count.beat(st.scope, 260, ++k); }
        else { K.hop(st, st.eatNum, 12); k = q.b; await Count.beat(st.scope, 420, k); }
        for (const p of st.leftP) { if (!Session.alive(my)) return; K.hop(st, p, 12); await Count.beat(st.scope, 260, ++k); }
      }
      this.cheerAll(st);
      st.summary = '原来有' + CNQ(q.a) + '个！';
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1200);
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('原来不是' + CNQ(ans) + '个'); await st.scope.wait(600); },
    next(st, strat) { return cardNext(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { const e = [st.pe, st.pl, st.eqBox].filter(Boolean); if (e.length) K.flash(st, e); },
    snap(st) { return { d: st.q.d }; },
  };

  /* ---------------------------------------------------------------- F7 开！ the door says n; three keys, each with a number
     sentence; only one of them makes n. L1 within 5, the keys' sentences with dots (taken away: crossed), the door with dots ·
     L2 within 7 · L3 within 10, numerals only (0 can be on the door) · L4 the wrong keys make n − 1 and n + 1 · L5 + and −
     mixed on the keys. */
  W4R.F7 = {
    kind0: 'keys', verb: '开！', intro: '找钥匙开门！', praise: ['门开啦！'], props: ['key'],
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng, hi = [0, 5, 7, 10, 10, 10][d], lo0 = d <= 2 ? 1 : 0;
      const mk = (op, r) => {
        if (op === '-') { if (r + 1 > hi || r < 0) return null; const b = rng.int(r === 0 ? 2 : 1, hi - r); if (r === 0 && b > hi) return null; return { s: [r + b, '-', b], r, op }; }
        if (r < 2 || r > hi) return null; const a = rng.int(1, r - 1); return { s: [a, '+', r - a], r, op };
      };
      for (let t = 0; t < 400; t++) {
        const n = rng.int(d === 5 ? 2 : lo0, d <= 2 ? hi - 1 : 9);
        const ops = d === 5 ? rng.shuffle(['+', '-', rng.pick(['+', '-'])]) : ['-', '-', '-'];
        const right = mk(ops[0], n); if (!right) continue;
        const deltas = d === 4 ? rng.shuffle([-1, 1]).concat(rng.shuffle([-2, 2])) : rng.shuffle([-2, -1, 1, 2]).concat([3, -3]);
        const wrong = [], used = [n];
        for (const x of deltas) { if (wrong.length === 2) break; const r = n + x; if (r < lo0 || used.includes(r)) continue; const k = mk(ops[wrong.length + 1], r); if (!k) continue; used.push(r); wrong.push(k); }
        if (wrong.length < 2) continue;
        if (t < 300 && [right].concat(wrong).every(x => x.op === '-' && x.s[2] === right.s[2])) continue;      /* not "minus the same" on every key */
        const pos = bagPick(G, 'f7pos', [0, 1, 2]), keys = rng.shuffle(wrong); keys.splice(pos, 0, right);
        return { k: [d, n, keys.map(x => x.s.join('')).join('|')], d, n, keys, answer: pos, opts: [0, 1, 2], dotsOn: d <= 2, fact: factOf(right.op, right.s[0], right.s[2]) };
      }
      return { k: [d, 'x'], d, n: 2, keys: [{ s: [3, '-', 1], r: 2, op: '-' }, { s: [4, '-', 1], r: 3, op: '-' }, { s: [5, '-', 1], r: 4, op: '-' }], answer: 0, opts: [0, 1, 2], dotsOn: true, fact: factOf('-', 3, 1) };
    },
    geo() { return K.L() ? { door: { x: 96, y: 108, w: 290, h: 400 }, keys: { x: 438, y: 116, w: 470, h: 116, gap: 20 } } : { door: { x: 227, y: 208, w: 250, h: 350 }, keys: { x: 92, y: 590, w: 520, h: 114, gap: 16 } }; },
    decor(G) { if (K.L()) W3X.decor2(G, this.chars); else W2X.hideAll(G, this.chars); },
    place(st) {
      if (!st.q) return;
      const g = this.geo();
      if (st.door) place(st.door, g.door.x, g.door.y, g.door.w, g.door.h);
      if (st.cards) col(st.cards, g.keys.x, g.keys.y, g.keys.w, g.keys.h, g.keys.gap);
    },
    async present(st) {
      const q = st.q;
      const door = st.door = W2X.thing(st, 10, 10, 4, '');
      door.innerHTML = '<svg viewBox="0 0 290 400" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;left:0;top:0"><path d="M8 126Q8 20 145 12Q282 20 282 126V394H8Z" fill="#8A2D1E" stroke="#2B2118" stroke-width="8" stroke-linejoin="round"/><rect x="30" y="128" width="230" height="258" fill="#FFE9A8" stroke="#2B2118" stroke-width="5"/></svg>';
      const leaf = (left) => { const f = el('div', '', door); Object.assign(f.style, { position: 'absolute', left: left ? '10.3%' : '50%', top: '32%', width: '39.7%', height: '64.5%', transformOrigin: left ? 'left center' : 'right center', pointerEvents: 'none' }); f.innerHTML = '<svg viewBox="0 0 115 258" width="100%" height="100%" preserveAspectRatio="none"><rect x="2" y="2" width="111" height="254" fill="#D63B2F" stroke="#2B2118" stroke-width="5"/>' + [0, 1, 2, 3].map(r => [0, 1, 2].map(c => '<circle cx="' + (24 + c * 34) + '" cy="' + (36 + r * 60) + '" r="8" fill="#FFC93C" stroke="#2B2118" stroke-width="3"/>').join('')).join('') + '</svg>'; return f; };
      st.leaves = [leaf(true), leaf(false)];
      st.lock = el('div', '', door); Object.assign(st.lock.style, { position: 'absolute', left: '50%', top: '64%', width: '44px', height: '44px', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#FFC93C', boxShadow: '0 0 0 4px ' + INK, pointerEvents: 'none' });
      st.lock.innerHTML = '<svg viewBox="0 0 44 44" width="100%" height="100%"><circle cx="22" cy="18" r="6" fill="#2B2118"/><path d="M19 20H25L27 32H17Z" fill="#2B2118"/></svg>';
      const pl = el('div', '', door); Object.assign(pl.style, { position: 'absolute', left: '20%', top: '4%', width: '60%', height: '25%', background: '#fff', borderRadius: '16px', boxShadow: '0 0 0 4px ' + INK + ', 0 0 0 9px #FFC93C', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' });
      pl.appendChild(numDots(q.n, q.d === 1 ? 46 : 70, q.d === 1, { g: 14, r: 5.4, fill: '#FFC93C' }));
      st.plaque = pl;
      st.keyImgs = [];
      st.cards = q.keys.map((k, i) => {
        const c = W3X.card(st, 'card' + i, 6); c.style.flexDirection = 'row'; c.style.gap = '18px';
        const ki = img('assets/props/key.png', '', c); Object.assign(ki.style, { width: '86px', height: '76px', objectFit: 'contain', pointerEvents: 'none', flexShrink: '0' }); st.keyImgs.push(ki);
        c.appendChild(eqEl(k.s, q.dotsOn ? 50 : 60, q.dotsOn));
        return c;
      });
      st.opts = [0, 1, 2];
      this.place(st);
      popIn(st, door); st.cards.forEach((c, i) => popIn(st, c, 200 + 90 * i));
      K.task(st, [['assets/props/key.png'], [W3X.ic('<rect x="22" y="10" width="56" height="82" rx="6" fill="#D63B2F" stroke="#2B2118" stroke-width="5"/><path d="M50 10V92" stroke="#2B2118" stroke-width="4"/><circle cx="50" cy="58" r="7" fill="#FFC93C" stroke="#2B2118" stroke-width="3"/>')]]);
      W3X.say2(st, '门上是' + CN[q.n] + '。', '哪把钥匙开门？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, i = q.answer, card = st.cards[i], k = q.keys[i];
      K.ring(st, [box(card)], 6, '#FFC93C');
      const cb = box(card), db = box(st.door);
      const fly = K.item(Stage.el, 'assets/props/key.png', 86, 76); fly.style.zIndex = 45; st.els.push(fly);
      place(fly, cb.x + 16, Math.round(cb.y + cb.h / 2 - 38));
      if (st.keyImgs[i]) st.keyImgs[i].style.visibility = 'hidden';
      Sfx.whoosh(0.3);
      await K.flyTo(st, fly, Math.round(db.x + db.w / 2 - 43), Math.round(db.y + db.h * 0.64 - 38), 650, 70, 0.7);
      if (!Session.alive(my)) return;
      Sfx.sparkle();
      st.scope.anim(st.leaves[0], [{ transform: 'perspective(700px) rotateY(0)' }, { transform: 'perspective(700px) rotateY(-78deg)' }], { duration: 700, fill: 'forwards', easing: EASE.glide });
      st.scope.anim(st.leaves[1], [{ transform: 'perspective(700px) rotateY(0)' }, { transform: 'perspective(700px) rotateY(78deg)' }], { duration: 700, fill: 'forwards', easing: EASE.glide });
      st.lock.style.visibility = 'hidden'; fly.style.visibility = 'hidden';
      await st.scope.wait(500);
      Sfx.reveal(); this.cheerAll(st);
      st.summary = subLine(k.s, q.n);
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
    },
    async feedback(st, ans) { const c = st.cards && st.cards[ans]; if (c) K.wiggle(st, c); W3X.say('这把等于' + CN[st.q.keys[ans].r]); await st.scope.wait(600); },
    next(st, strat) { return cardNext(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { if (st.plaque) K.flash(st, [st.plaque]); },
    snap(st) { return { n: st.q.n }; },
  };

  /* ---------------------------------------------------------------- F8 闯！ the maze (reasoning): a square maze, two or three
     openings on its left / top edge marked by coloured flags, the treasure chest at an opening on the right / bottom edge.
     Only one flag's way gets there (a perfect maze - randomised depth-first - with the other entrances' ways cut by a wall;
     checked by a search). The child taps the flag card. L1 4 x 4, two flags, the blocked ways end soon · L2 three flags ·
     L3 5 x 5 · L4 the blocked ways run long (cut next to where they would join) · L5 6 x 6, the way winds (>= 10 cells). */
  const FLAGC = ['#E8414B', '#2E6FD8', '#F5B324'];
  const flagSvg = (c, w, h) => '<svg viewBox="0 0 60 64" width="' + w + '" height="' + h + '"><path d="M14 6V60" stroke="#2B2118" stroke-width="6" stroke-linecap="round"/><path d="M16 8L56 21L16 35Z" fill="' + c + '" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/></svg>';
  W4R.F8 = {
    kind0: 'maze', verb: '闯！', intro: '走迷宫找宝箱！', praise: ['走出来啦！'], props: ['chest'],
    carve(rng, n) {
      const E = Array.from({ length: n }, () => Array(n).fill(0)), S = Array.from({ length: n }, () => Array(n).fill(0)), seen = Array.from({ length: n }, () => Array(n).fill(false));
      const st = [[rng.int(0, n - 1), rng.int(0, n - 1)]]; seen[st[0][0]][st[0][1]] = true;
      while (st.length) {
        const [r, c] = st[st.length - 1], nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && y < n && x >= 0 && x < n && !seen[y][x]);
        if (!nb.length) { st.pop(); continue; }
        const [y, x] = rng.pick(nb);
        if (y === r) E[r][Math.min(c, x)] = 1; else S[Math.min(r, y)][c] = 1;
        seen[y][x] = true; st.push([y, x]);
      }
      return { E, S };
    },
    nbrs(m, n, r, c) { const o = []; if (c + 1 < n && m.E[r][c]) o.push([r, c + 1]); if (c > 0 && m.E[r][c - 1]) o.push([r, c - 1]); if (r + 1 < n && m.S[r][c]) o.push([r + 1, c]); if (r > 0 && m.S[r - 1][c]) o.push([r - 1, c]); return o; },
    route(m, n, a, b) {
      const prev = {}, key = p => p[0] + ',' + p[1], q = [a]; prev[key(a)] = null;
      while (q.length) { const p = q.shift(); if (p[0] === b[0] && p[1] === b[1]) break; this.nbrs(m, n, p[0], p[1]).forEach(x => { if (!(key(x) in prev)) { prev[key(x)] = p; q.push(x); } }); }
      if (!(key(b) in prev)) return null;
      const out = []; for (let p = b; p; p = prev[key(p)]) out.unshift(p); return out;
    },
    reach(m, n, a) { const seen = new Set([a.join()]), q = [a]; while (q.length) { const p = q.shift(); this.nbrs(m, n, p[0], p[1]).forEach(x => { if (!seen.has(x.join())) { seen.add(x.join()); q.push(x); } }); } return seen; },
    cellOf(e, n) { return e.side === 'L' ? [e.i, 0] : e.side === 'T' ? [0, e.i] : e.side === 'R' ? [e.i, n - 1] : [n - 1, e.i]; },
    gen(G, o) {
      const d = Math.min(5, Math.max(1, o.level || 1)), rng = o.rng, n = d <= 2 ? 4 : d <= 4 ? 5 : 6, k = d === 1 ? 2 : 3, minLen = [0, 3, 4, 5, 7, 10][d];
      let keep = null;
      for (let t = 0; t < 600; t++) {
        const m = this.carve(rng, n), half = Math.floor(n / 2);
        const exit = { side: rng.chance(0.5) ? 'R' : 'B', i: rng.int(half, n - 1) }, ex = this.cellOf(exit, n);
        const cand = []; for (let i = 0; i < n; i++) { cand.push({ side: 'L', i }); cand.push({ side: 'T', i }); }
        const ent = [];
        for (const c of rng.shuffle(cand)) { if (ent.length === k) break; if (c.i === 0 && ent.some(e => e.i === 0)) continue; if (ent.some(e => e.side === c.side && Math.abs(e.i - c.i) < 2)) continue; ent.push(c); }
        if (ent.length < k) continue;
        ent.sort((x, y) => (x.side === y.side ? x.i - y.i : x.side === 'T' ? -1 : 1));
        const ri = rng.int(0, k - 1), Pr = this.route(m, n, this.cellOf(ent[ri], n), ex);
        if (!Pr) continue;
        const onR = new Set(Pr.map(p => p.join()));
        let ok = true;
        for (let w = 0; w < k && ok; w++) {
          if (w === ri) continue;
          const Pw = this.route(m, n, this.cellOf(ent[w], n), ex); if (!Pw) continue;
          const j = Pw.findIndex(p => onR.has(p.join()));
          if (j <= 0 || (d >= 4 && j < 3)) { ok = false; break; }
          const i = d <= 2 ? rng.int(0, Math.min(1, j - 1)) : d === 3 ? rng.int(0, j - 1) : rng.int(Math.max(0, j - 2), j - 1);
          const A = Pw[i], B = Pw[i + 1];
          if (A[0] === B[0]) m.E[A[0]][Math.min(A[1], B[1])] = 0; else m.S[Math.min(A[0], B[0])][A[1]] = 0;
        }
        if (!ok) continue;
        const R = this.reach(m, n, ex);
        if (!R.has(this.cellOf(ent[ri], n).join()) || ent.some((e, w) => w !== ri && R.has(this.cellOf(e, n).join()))) continue;
        const cand2 = { m, exit, ent, ri, Pr };
        if (Pr.length < minLen) { if (!keep) keep = cand2; continue; }
        keep = cand2; break;
      }
      const { m, exit, ent, ri, Pr } = keep;
      const ans = bagPick(G, 'f8c' + k, k === 2 ? [0, 1] : [0, 1, 2]), others = rng.shuffle([0, 1, 2].slice(0, k).filter(x => x !== ans));
      const ents = ent.map((e, w) => ({ side: e.side, i: e.i, c: w === ri ? ans : others.shift() }));
      return { k: [d, n, m.E.map(r => r.join('')).join('') + m.S.map(r => r.join('')).join(''), ents.map(e => e.side + e.i + e.c).join(), exit.side + exit.i], d, n, E: m.E, S: m.S, ent: ents, exit, path: Pr, answer: ans, opts: k === 2 ? [0, 1] : [0, 1, 2] };
    },
    geo(st) {
      const L = K.L(), n = st.q.n, k = st.q.ent.length;
      const cs = (L ? { 4: 100, 5: 86, 6: 74 } : { 4: 112, 5: 96, 6: 84 })[n], bs = cs * n;
      if (L) { const ch = 112, cg = 24, tot = k * ch + (k - 1) * cg, by = 170; return { cs, bs, bx: 270, by, cards: { col: true, x: 812, y: Math.round(by + bs / 2 - tot / 2), w: 120, h: ch, gap: cg } }; }
      return { cs, bs, bx: Math.round((704 - bs) / 2) - 12, by: 292, cards: { cx: 352, cy: 948, w: 130, h: 112, gap: 30 } };
    },
    decor(G) { if (K.L()) W3X.decor2(G, this.chars, true); else W2X.hideAll(G, this.chars); },
    flagXY(g, e) { return e.side === 'L' ? { x: g.bx - 64, y: Math.round(g.by + (e.i + 0.5) * g.cs - 33) } : { x: Math.round(g.bx + (e.i + 0.5) * g.cs - 18), y: g.by - 70 }; },
    chestXY(g, n, x) { return x.side === 'R' ? { x: g.bx + g.bs + 6, y: Math.round(g.by + (x.i + 0.5) * g.cs - 35) } : { x: Math.round(g.bx + (x.i + 0.5) * g.cs - 35), y: g.by + g.bs + 6 }; },
    place(st) {
      if (!st.q || !st.board) return;
      const g = this.geo(st), q = st.q;
      place(st.board, g.bx, g.by, g.bs, g.bs);
      st.flags.forEach((f, w) => { const p = this.flagXY(g, q.ent[w]); place(f, p.x, p.y, 60, 66); });
      const c = this.chestXY(g, q.n, q.exit); place(st.chest, c.x, c.y, 70, 70);
      if (st.cards) { if (g.cards.col) col(st.cards, g.cards.x, g.cards.y, g.cards.w, g.cards.h, g.cards.gap); else row(st.cards, g.cards.cx, g.cards.cy, g.cards.w, g.cards.h, g.cards.gap); }
    },
    drawMaze(st) {
      const q = st.q, n = q.n, segs = [], isEnt = (side, i) => q.ent.some(e => e.side === side && e.i === i);
      for (let i = 0; i < n; i++) {
        if (!isEnt('T', i)) segs.push([i, 0, i + 1, 0]);
        if (!isEnt('L', i)) segs.push([0, i, 0, i + 1]);
        if (!(q.exit.side === 'R' && q.exit.i === i)) segs.push([n, i, n, i + 1]);
        if (!(q.exit.side === 'B' && q.exit.i === i)) segs.push([i, n, i + 1, n]);
      }
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (c < n - 1 && !q.E[r][c]) segs.push([c + 1, r, c + 1, r + 1]); if (r < n - 1 && !q.S[r][c]) segs.push([c, r + 1, c + 1, r + 1]); }
      const d = segs.map(s => 'M' + s[0] + ' ' + s[1] + 'L' + s[2] + ' ' + s[3]).join('');
      const tint = (cell, c, op) => '<rect x="' + (cell[1] + 0.06) + '" y="' + (cell[0] + 0.06) + '" width=".88" height=".88" rx=".12" fill="' + c + '" opacity="' + op + '"/>';     /* each opening's cell in its flag's colour */
      const tints = q.ent.map(e => tint(this.cellOf(e, n), FLAGC[e.c], 0.3)).join('');
      st.board.innerHTML = '<svg viewBox="0 0 ' + n + ' ' + n + '" width="100%" height="100%" style="overflow:visible;position:absolute;left:0;top:0"><rect x="0" y="0" width="' + n + '" height="' + n + '" fill="#FFF8EC"/>' + tints + '<g class="way"></g><path d="' + d + '" fill="none" stroke="#2B2118" stroke-width="7" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
    },
    async present(st) {
      const q = st.q;
      st.board = W2X.thing(st, 10, 10, 4, ''); Object.assign(st.board.style, { borderRadius: '6px', boxShadow: '0 6px 0 rgba(43,33,24,.18)' });
      this.drawMaze(st);
      st.flags = q.ent.map(e => { const f = W2X.thing(st, 60, 66, 6, ''); f.innerHTML = flagSvg(FLAGC[e.c], 60, 66); return f; });
      st.chest = K.item(Stage.el, 'assets/props/chest.png', 70, 70); st.chest.style.zIndex = 6; st.els.push(st.chest);
      st.cards = q.opts.map(ci => { const c = W3X.card(st, 'card' + ci, 6); c.insertAdjacentHTML('beforeend', flagSvg(FLAGC[ci], 76, 82)); c.lastChild.style.pointerEvents = 'none'; return c; });
      st.opts = q.opts.slice();
      this.place(st);
      popIn(st, st.board); st.flags.forEach((f, i) => popIn(st, f, 150 + 80 * i)); popIn(st, st.chest, 300);
      st.cards.forEach((c, i) => popIn(st, c, 400 + 80 * i));
      K.task(st, [[W3X.ic('<path d="M26 10V92" stroke="#2B2118" stroke-width="8" stroke-linecap="round"/><path d="M29 14L88 34L29 54Z" fill="#E8414B" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/>')], ['assets/props/chest.png']]);
      K.say(st, '哪面旗能走到宝箱？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, n = q.n, card = st.cards[st.opts.indexOf(q.answer)], e = q.ent.find(x => x.c === q.answer);
      if (card) K.ring(st, [box(card)], 6, '#FFC93C');
      const pts = [], cen = p => (p[1] + 0.5) + ' ' + (p[0] + 0.5);
      pts.push(e.side === 'L' ? '-0.55 ' + (e.i + 0.5) : (e.i + 0.5) + ' -0.55');
      q.path.forEach(p => pts.push(cen(p)));
      pts.push(q.exit.side === 'R' ? (n + 0.55) + ' ' + (q.exit.i + 0.5) : (q.exit.i + 0.5) + ' ' + (n + 0.55));
      const gw = st.board.querySelector('g.way');
      if (gw) {
        const ns = 'http://www.w3.org/2000/svg', line = (c, w) => { const l = document.createElementNS(ns, 'polyline'); l.setAttribute('points', pts.join(' ')); l.setAttribute('fill', 'none'); l.setAttribute('stroke', c); l.setAttribute('stroke-width', w); l.setAttribute('stroke-linecap', 'round'); l.setAttribute('stroke-linejoin', 'round'); l.setAttribute('vector-effect', 'non-scaling-stroke'); l.setAttribute('pathLength', '1'); l.setAttribute('stroke-dasharray', '1 1'); gw.appendChild(l); return l; };
        const a = line('#2B2118', Math.round(this.geo(st).cs * 0.34)), b = line('#FFC93C', Math.round(this.geo(st).cs * 0.26));
        Sfx.whoosh(0.4);
        await Promise.all([a, b].map(l => st.scope.anim(l, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 300 + 120 * q.path.length, fill: 'forwards', easing: 'linear' })));
      }
      if (!Session.alive(st)) return;
      K.hop(st, st.chest, 22); Sfx.reveal(); this.cheerAll(st);
      st.summary = '能走到宝箱！';
      Voice.say(st.summary, { tag: 'summary' }); await st.scope.wait(1300);
    },
    async feedback(st, ans) {
      const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]);
      const w = st.q.ent.findIndex(x => x.c === ans); if (w >= 0 && st.flags[w]) K.flash(st, [st.flags[w]]);
      W3X.say('这里走不通'); await st.scope.wait(600);
    },
    next(st, strat) { return cardNext(st, strat); },
    workEls(st) { return st.cards || []; },
    gestureHint(st) { if (st.board) K.flash(st, [st.board]); },
    snap(st) { return { n: st.q.n, flags: st.q.ent.length }; },
  };
})();
/* ================================================================ ⑦ 复仇者·空间站 (加减关系, starts at 3): I5 想加算减 · I6 星际巴士 ·
   I7 比多比少 · I8 猜数 (reasoning). One block: the helpers stay inside it (all island files share one script). */
{
  const INK = '#2B2118';
  const V7 = {
    /* n dots in rows of five (the arithmetic island's V2G loads after this file: its own copy) */
    dots(n, opt) {
      opt = opt || {};
      const per = Math.min(opt.per || 5, Math.max(1, n)), g = opt.g || 22, r = opt.r || 8.5, rows = Math.max(1, Math.ceil(n / per)), w = per * g + 4, h = rows * g + 4;
      const s = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h });
      for (let i = 0; i < n; i++) svg('circle', { cx: 2 + g / 2 + (i % per) * g, cy: 2 + g / 2 + Math.floor(i / per) * g, r, fill: opt.fill || '#4FB3FF', stroke: INK, 'stroke-width': 2.4 }, s);
      s.style.flexShrink = '0'; s.style.pointerEvents = 'none';
      return s;
    },
    /* a number, with its dots under it at the supported levels (sup 0) */
    numCol(n, sup, h, small) {
      const d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', pointerEvents: 'none', flexShrink: '0' });
      d.appendChild(UI.num(n, h || 60));
      if (!sup && n > 0 && n <= 10) d.appendChild(this.dots(n, small ? { g: 14, r: 5.4 } : { g: 18, r: 7 }));
      return d;
    },
    op(t, size, color) { const o = el('span', ''); o.textContent = t === '-' ? '−' : t; Object.assign(o.style, { font: '900 ' + (size || 46) + 'px/1 system-ui, sans-serif', color: color || INK, pointerEvents: 'none', flexShrink: '0' }); return o; },
    /* the unknown: a dashed yellow box with "?" */
    slot(h) {
      const b = el('div', ''); Object.assign(b.style, { width: Math.round(h * 0.9) + 'px', height: Math.round(h * 1.1) + 'px', border: '5px dashed ' + INK, borderRadius: '12px', background: '#FFF7D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', boxSizing: 'border-box', pointerEvents: 'none' });
      b.appendChild(this.op('?', Math.round(h * 0.72), '#9A7420'));
      return b;
    },
    fill(slot, n, sup, h, small) { slot.innerHTML = ''; Object.assign(slot.style, { border: '0', background: 'transparent', width: 'auto', height: 'auto' }); slot.appendChild(this.numCol(n, sup, h, small)); },
    /* an equation: numbers (with dots at sup 0), '+', '-', '=', '?'; ._nums lists its numbers and its box in order */
    eq(parts, sup, h, col) {
      const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', pointerEvents: 'none' });
      d._nums = [];
      parts.forEach(t => {
        if (typeof t === 'number') { const c = this.numCol(t, sup, h); d.appendChild(c); d._nums.push({ el: c, v: t }); }
        else if (t === '?') { const b = this.slot(h); d.appendChild(b); d._nums.push({ el: b, slot: true }); }
        else d.appendChild(this.op(t, Math.round(h * 0.8), col && col[t]));
      });
      return d;
    },
    /* a white card on the stage (not a target) */
    panel(st, z, lit) {
      const p = W2X.thing(st, 10, 10, z || 4, '');
      Object.assign(p.style, { background: '#FFFFFF', borderRadius: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
        boxShadow: lit ? '0 0 0 4px ' + INK + ', 0 0 0 10px #FFC93C, 0 0 30px 14px rgba(255,220,90,.75)' : '0 0 0 4px ' + INK + ', 0 8px 0 4px rgba(43,33,24,.18)' });
      return p;
    },
    /* one sentence of a story: the next step waits for it (at most `cap` ms) */
    talk(st, text, cap) { return st.scope.guard(Promise.race([Voice.say(text, { tag: 'prompt' }), st.scope.wait(cap || 2600)])); },
    /* a point of an element (stage coordinates): its top / bottom middle */
    at(e, where) { const r = e.getBoundingClientRect(); return Stage.toStage(r.left + r.width / 2, where === 'top' ? r.top : where === 'bottom' ? r.bottom : r.top + r.height / 2); },
    /* recolour the digits of the numbers inside e */
    tint(e, color) { e.querySelectorAll('svg.d > g').forEach(g => { const p = g.children[2]; if (p) p.setAttribute('stroke', color); }); },
    face(who, size) {
      const f = el('div', ''); Object.assign(f.style, { width: size + 'px', height: size + 'px', flexShrink: '0', borderRadius: '50%', overflow: 'hidden', background: WHO7[who].col, boxShadow: '0 0 0 4px ' + INK + ', 0 0 0 8px ' + WHO7[who].col, pointerEvents: 'none' });
      const im = img('assets/thumbs/' + who + '.png', '', f); Object.assign(im.style, { width: '100%', height: '100%', objectFit: 'cover' });
      return f;
    },
    nextCard(st, strat) { if (st.picked || !st.cards) return null; const i = strat === 'wrong' ? st.opts.findIndex(v => v !== st.q.answer) : st.opts.indexOf(st.q.answer); return { g: 'tap', p: { id: 'card' + i } }; },
  };
  const WHO7 = { spiderman: { name: '蜘蛛侠', pr: '他', col: '#E8414B' }, widow: { name: '黑寡妇', pr: '她', col: '#3B4060' } };
  const ROLE = { a: '#2E8FE0', b: '#E8A100', c: '#2E9E4F' };

  /* ================================================================ I5 想加算减: a lit addition a + b = c helps with c − a = ?
     L1 c ≤ 5, dots · L2 c 6-10, dots · L3 numbers only · L4 c − b (the other part) · L5 the lit one is a subtraction, the
     question an addition (b + a = ?, or a + ? = c). The reveal joins the same numbers of the two sentences. */
  W4R.I5 = {
    kind0: 'think', verb: '想！', intro: '加法减法是一家！', praise: ['想得真对！'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, lo = [0, 2, 6, 5, 5, 5][d], hi = [0, 5, 10, 10, 10, 10][d];
      let a = 1, b = 1, c = 2;
      for (let t = 0; t < 60; t++) { c = rng.int(lo, hi); a = rng.int(1, c - 1); b = c - a; if (d < 4 || a !== b) break; }
      if (d <= 4) {
        const tk = d === 4 ? b : a, ans = c - tk;
        return { k: [d, a, b], a, b, c, known: [a, '+', b, '=', c], kr: ['a', 'b', 'c'], ask: [c, '-', tk, '=', '?'], ar: d === 4 ? ['c', 'b', 'a'] : ['c', 'a', 'b'],
          answer: ans, opts: numOptions(G, ans, 0, 10), sup: d <= 2 ? 0 : 1, fact: factOf('-', c, tk) };
      }
      const form = bagPick(G, 'i5f', ['sum', 'part']);
      if (form === 'sum') return { k: [5, a, b, form], a, b, c, known: [c, '-', a, '=', b], kr: ['c', 'a', 'b'], ask: [b, '+', a, '=', '?'], ar: ['b', 'a', 'c'], answer: c, opts: numOptions(G, c, 0, 10), sup: 1, fact: factOf('+', b, a) };
      return { k: [5, a, b, form], a, b, c, known: [c, '-', a, '=', b], kr: ['c', 'a', 'b'], ask: [a, '+', '?', '=', c], ar: ['a', 'b', 'c'], answer: b, opts: numOptions(G, b, 0, 10), sup: 1, fact: factOf('+', a, b) };
    },
    /* "三加四等于七！" / "七减三等于几？" / "三加几等于七？" */
    line(p, ask) { const w = t => (t === '?' ? '几' : CN[t]); return w(p[0]) + (p[1] === '+' ? '加' : '减') + w(p[2]) + '等于' + w(p[4]) + (ask ? '？' : '！'); },
    geo(st) { const L = K.L(), s = st.q.sup; return L ? { cx: 512, w: 520, h: s ? 116 : 154, y1: 102, gap: 40, nh: s ? 76 : 60, cs: 136 } : { cx: 352, w: 620, h: s ? 140 : 182, y1: 226, gap: 56, nh: s ? 92 : 72, cs: 150 }; },
    cardSpot(st) { const g = this.geo(st); return { cx: g.cx, cy: g.y1 + 2 * g.h + g.gap + (K.L() ? 36 : 60) + g.cs / 2, gap: 34 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(st);
      if (st.kEl) place(st.kEl, g.cx - g.w / 2, g.y1, g.w, g.h);
      if (st.aEl) place(st.aEl, g.cx - g.w / 2, g.y1 + g.h + g.gap, g.w, g.h);
      if (st.arrow) place(st.arrow, g.cx - 22, g.y1 + g.h + 4, 44, g.gap - 8);
      if (st.cards) K.cardsPlace(st, this.cardSpot(st));
    },
    present(st) {
      const q = st.q, h = this.geo(st).nh;
      st.kEl = V7.panel(st, 4, true); st.kEq = V7.eq(q.known, q.sup, h); st.kEl.appendChild(st.kEq);
      st.aEl = V7.panel(st, 4, false); st.aEq = V7.eq(q.ask, q.sup, h); st.aEl.appendChild(st.aEq);
      st.arrow = W2X.thing(st, 44, 32, 3, '');
      st.arrow.innerHTML = '<svg viewBox="0 0 44 32" width="100%" height="100%" preserveAspectRatio="none"><path d="M22 2V22M10 14L22 28L34 14" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2V22M10 14L22 28L34 14" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      this.place(st);
      K.pop(st, st.kEl); K.pop(st, st.arrow, 160); K.pop(st, st.aEl, 300);
      K.cards(st, q.opts, Object.assign({ size: this.geo(st).cs, numOnly: !!q.sup }, this.cardSpot(st)));
      const sign = t => W3X.ic('<rect x="8" y="8" width="84" height="84" rx="18" fill="' + (t === '+' ? '#E6F7E9' : '#FFF0E0') + '" stroke="' + INK + '" stroke-width="5"/><path d="' + (t === '+' ? 'M26 50H74M50 26V74' : 'M26 50H74') + '" stroke="' + (t === '+' ? '#2E9E4F' : '#E0701E') + '" stroke-width="13" stroke-linecap="round"/>');
      K.task(st, [[sign(q.known[1])], [sign(q.ask[1])], ['q']]);
      W3X.say2(st, this.line(q.known), this.line(q.ask, true));
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, my = st, h = st.aEq._nums[0].el.querySelector('svg.d').getAttribute('height') | 0, s = st.aEq._nums.find(x => x.slot);
      if (s) V7.fill(s.el, q.answer, q.sup, h);
      const c = st.cards[st.opts.indexOf(q.answer)]; if (c) { K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 18); }
      Sfx.reveal();
      await st.scope.wait(T(200)); if (!Session.alive(my)) return;
      /* the same number in both sentences: the same colour, joined by a dotted line */
      const ln = K.lines(st);
      for (let i = 0; i < 3; i++) {
        const r = q.ar[i], A = st.aEq._nums[i].el, B = st.kEq._nums[q.kr.indexOf(r)].el;
        V7.tint(A, ROLE[r]); V7.tint(B, ROLE[r]);
        await K.link(st, ln, V7.at(B, 'bottom'), V7.at(A, 'top'), ROLE[r]);
        if (!Session.alive(my)) return;
      }
      this.cheerAll(st);
      const full = q.ask.map(t => (t === '?' ? q.answer : t));
      st.summary = this.line(full); Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1400));
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say('不是' + CN[ans]); await st.scope.wait(T(700)); },
    next(st, strat) { return V7.nextCard(st, strat); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { opts: st.opts || null, ask: st.q.ask }; },
  };

  /* ================================================================ I6 星际巴士: the windows are dark - who is on the bus is only
     known from who got on and off. The first passengers are seen once, getting on; at every stop some get on or off; the
     stops build the sentence (4 + 3 − 2 = ?) on the card at the top. L1 one stop, getting on, ≤ 5 · L2 on or off, ≤ 7 ·
     L3 two stops (on, off), ≤ 8 · L4 two stops either way, ≤ 10, numbers only · L5 three stops. */
  W4R.I6 = {
    kind0: 'bus', verb: '乘！', intro: '星际巴士出发！', praise: ['乘客数对啦！'], props: ['spacebus', 'astronaut'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, hi = [0, 5, 7, 8, 10, 10][d], big = d <= 3 ? 3 : 4;
      const pats = { 1: [['on']], 2: [['on'], ['off']], 3: [['on', 'off']], 4: [['on', 'off'], ['off', 'on']], 5: [['on', 'off', 'on'], ['off', 'on', 'off'], ['on', 'on', 'off'], ['off', 'off', 'on'], ['on', 'off', 'off'], ['off', 'on', 'on']] }[d];
      const pat = pats[pats.length > 1 ? bagPick(G, 'i6p' + d, pats.map((_, i) => i)) : 0];
      for (let t = 0; t < 600; t++) {
        const a = rng.int(d === 1 ? 1 : 2, d === 1 ? 3 : 6); let n = a, ok = true; const steps = [];
        pat.forEach((k, i) => { if (!ok) return; const m = rng.int(1, big); n += k === 'on' ? m : -m; if (n > hi || n < (i === pat.length - 1 && d >= 4 ? 0 : 1)) ok = false; steps.push([k, m]); });
        if (!ok) continue;
        const q = { k: [d, a, steps.map(s => s[0] + s[1]).join()], a, steps, answer: n, opts: numOptions(G, n, 0, 10), sup: d >= 4 ? 1 : 0 };
        if (steps.length === 1) q.fact = factOf(steps[0][0] === 'on' ? '+' : '-', a, steps[0][1]);
        return q;
      }
      return { k: [d, 'x'], a: 2, steps: [['on', 1]], answer: 3, opts: [2, 3, 4], sup: 0, fact: factOf('+', 2, 1) };
    },
    geo() {
      return K.L()
        ? { eq: { cx: 512, y: 100, w: 620 }, bus: { x: 150, y: 232, w: 400, h: 286 }, aw: 84, ah: 117, crowd: { x0: 606, y0: 296, per: 5, dx: 76, dy: 110, w: 66, h: 92 }, cards: { cx: 512, cy: 622 } }
        : { eq: { cx: 352, y: 214, w: 660 }, bus: { x: 26, y: 372, w: 400, h: 286 }, aw: 80, ah: 111, crowd: { x0: 444, y0: 330, per: 4, dx: 62, dy: 98, w: 58, h: 81 }, cards: { cx: 352, cy: 772 } };
    },
    door(g) { const b = g.bus; return { x: b.x + b.w * 0.755, y: b.y + b.h * 0.78 }; },
    spot(g, i) { const c = g.crowd; return { x: c.x0 + (i % c.per) * c.dx, y: c.y0 + Math.floor(i / c.per) * c.dy }; },
    cardSpot() { const c = this.geo().cards; return { cx: c.cx, cy: c.cy, gap: 34 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo();
      if (st.eqEl) place(st.eqEl, g.eq.cx - g.eq.w / 2, g.eq.y, g.eq.w, st.q.sup ? 104 : 124);
      if (st.bus) place(st.bus, g.bus.x, g.bus.y, g.bus.w, g.bus.h);
      (st.crowd || []).forEach((e, i) => { const p = this.spot(g, i); place(e, p.x, p.y, g.crowd.w, g.crowd.h); });
      if (st.cards) K.cardsPlace(st, this.cardSpot());
    },
    /* n astronauts walk from the right edge into the door (or out of it and away); every one is counted as they pass */
    async walk(st, n, inward, say) {
      const g = this.geo(), D = this.door(g), w = g.aw, h = g.ah, top = g.bus.y + g.bus.h + 6 - h, far = Stage.W + 40, near = D.x + 30, jobs = [];
      for (let i = 0; i < n; i++) {
        const e = K.item(Stage.el, 'assets/props/astronaut.png', w, h); e.style.zIndex = 7; st.els.push(e);
        const N = 8, kf = [], door = 'translate(' + (D.x - w / 2 - near) + 'px,' + (D.y - h / 2 - top) + 'px) scale(.3)';
        const hit = () => { if (say) Count.say(i + 1); else Sfx.count(i + 1); };
        if (inward) {
          place(e, near, top);
          for (let k = 0; k <= N; k++) kf.push({ transform: 'translate(' + Math.round((far - near) * (1 - k / N)) + 'px,' + (k % 2 ? -10 : 0) + 'px)', opacity: 1, offset: 0.72 * k / N });
          kf.push({ transform: door, opacity: 0, offset: 1 });
          jobs.push(st.scope.anim(e, kf, { duration: 1300, delay: 400 * i, easing: 'linear' }).then(() => { e.remove(); hit(); }));
        } else {
          place(e, near, top);
          kf.push({ transform: door, opacity: 0, offset: 0 });
          for (let k = 0; k <= N; k++) kf.push({ transform: 'translate(' + Math.round((far - near) * k / N) + 'px,' + (k % 2 ? -10 : 0) + 'px)', opacity: 1, offset: 0.28 + 0.72 * k / N });
          st.scope.timeout(hit, 400 * i + 360);
          jobs.push(st.scope.anim(e, kf, { duration: 1300, delay: 400 * i, easing: 'linear' }).then(() => e.remove()));
        }
      }
      await st.scope.guard(Promise.all(jobs));
    },
    /* to the next stop: out at the left, in again from the right */
    async drive(st) {
      const b = box(st.bus), out = -(b.x + b.w + 80), inn = Stage.W - b.x + 80;
      Sfx.whoosh(0.6);
      await st.scope.anim(st.bus, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + out + 'px)', offset: 0.42 }, { transform: 'translateX(' + inn + 'px)', offset: 0.43 }, { transform: 'translateX(0)' }], { duration: 1500, easing: 'ease-in-out', fill: 'none' });
      Sfx.mar(1046.5, 0, 0.35, 0.4); Sfx.mar(1318.5, 0.14, 0.35, 0.5);
    },
    tok(st, node) { if (st.eqEl.style.visibility === 'hidden') { st.eqEl.style.visibility = ''; K.pop(st, st.eqEl); } st.row.appendChild(node); st.scope.anim(node, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 320, easing: EASE.pop }); return node; },
    async present(st) {
      const q = st.q, my = st, h = q.sup ? 66 : 56, alive = () => Session.alive(my);
      st.eqEl = V7.panel(st, 6, false);
      st.row = el('div', '', st.eqEl); Object.assign(st.row.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', pointerEvents: 'none' });
      st.bus = K.item(Stage.el, 'assets/props/spacebus.png', 400, 286); st.bus.style.zIndex = 5; st.els.push(st.bus);
      this.place(st);
      K.pop(st, st.bus); st.eqEl.style.visibility = 'hidden';          /* the sentence card comes with its first number */
      K.task(st, [['assets/props/spacebus.png', 'assets/props/astronaut.png'], ['q']]);
      await st.scope.wait(T(600)); if (!alive()) return;
      /* the first passengers: seen this once, getting on */
      await this.walk(st, q.a, true, st.level <= 2); if (!alive()) return;
      this.tok(st, V7.numCol(q.a, q.sup, h));
      await V7.talk(st, '车上有' + CNQ(q.a) + '个人！', 2400); if (!alive()) return;
      for (const [k, m] of q.steps) {
        await this.drive(st); if (!alive()) return;
        await this.walk(st, m, k === 'on', st.level <= 2); if (!alive()) return;
        this.tok(st, V7.op(k === 'on' ? '+' : '-', 54, k === 'on' ? '#2E9E4F' : '#E0701E')); this.tok(st, V7.numCol(m, q.sup, h));
        await V7.talk(st, (k === 'on' ? '上来' : '下去') + CNQ(m) + '个人！', 2400); if (!alive()) return;
      }
      this.tok(st, V7.op('=', 54)); st.slot = this.tok(st, V7.slot(h));
      K.cards(st, q.opts, Object.assign({ size: 136, numOnly: !!q.sup }, this.cardSpot()));
      K.say(st, '车上现在几个人？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    /* everybody on the bus gets off and is counted */
    async reveal(st) {
      const q = st.q, my = st, g = this.geo(), D = this.door(g);
      if (st.slot) V7.fill(st.slot, q.answer, q.sup, q.sup ? 66 : 56);
      const c = st.cards[st.opts.indexOf(q.answer)]; if (c) { K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 18); }
      Sfx.reveal();
      st.crowd = [];
      for (let i = 0; i < q.answer; i++) {
        if (!Session.alive(my)) return;
        const p = this.spot(g, i), e = K.item(Stage.el, 'assets/props/astronaut.png', g.crowd.w, g.crowd.h); e.style.zIndex = 7; st.els.push(e); st.crowd.push(e);
        place(e, D.x - g.crowd.w / 2, D.y - g.crowd.h / 2);
        K.flyTo(st, e, p.x, p.y, 380, 50);
        await Count.beat(st.scope, 330, i + 1);
      }
      if (!Session.alive(my)) return;
      this.cheerAll(st);
      st.summary = q.answer ? '车上有' + CNQ(q.answer) + '个人！' : '车上没有人了！';
      Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1300));
    },
    async feedback(st, ans) { const i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]); W3X.say(ans === 0 ? '车上还有人' : '不是' + CNQ(ans) + '个人'); await st.scope.wait(T(700)); },
    next(st, strat) { return V7.nextCard(st, strat); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { opts: st.opts || null, steps: st.q.steps }; },
  };

  /* ================================================================ I7 比多比少: 蜘蛛侠 has a; 黑寡妇 has d more / fewer - how many
     has she? Her gems are in a closed box; a bar picture shows "more" / "fewer". L1 more only, gems + dots · L2 more or
     fewer · L3 numbers only · L4 up to 10, either of them is the one we know · L5 the other way round: both known, who has
     more and by how many. The reveal lays both rows of gems side by side. */
  W4R.I7 = {
    kind0: 'compare', verb: '多少！', intro: '比多比少！', praise: ['比得真清楚！'], props: ['gem'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng;
      if (d <= 4) {
        const rel = d === 1 ? 'more' : bagPick(G, 'i7r' + d, ['more', 'less']);
        const known = d === 4 ? bagPick(G, 'i7k', ['spiderman', 'widow']) : 'spiderman', asked = known === 'spiderman' ? 'widow' : 'spiderman';
        const hi = [0, 7, 8, 10, 10][d], amax = [0, 5, 7, 9, 10][d], dmax = [0, 2, 2, 3, 4][d];
        for (let t = 0; t < 400; t++) {
          const a = rng.int(2, amax), dd = rng.int(1, dmax), ans = rel === 'more' ? a + dd : a - dd;
          if (ans < 1 || ans > hi) continue;
          return { k: [d, a, dd, rel, known], a, dd, rel, known, asked, answer: ans, opts: numOptions(G, ans, 0, 10), sup: d <= 2 ? 0 : 1, fact: factOf(rel === 'more' ? '+' : '-', a, dd) };
        }
        return { k: [d, 'x'], a: 3, dd: 1, rel: 'more', known: 'spiderman', asked: 'widow', answer: 4, opts: [3, 4, 5], sup: 0, fact: factOf('+', 3, 1) };
      }
      const more = rng.pick(['spiderman', 'widow']), less = more === 'spiderman' ? 'widow' : 'spiderman', diff = rng.int(1, 4), lo = rng.int(1, 10 - diff);
      const cnt = {}; cnt[more] = lo + diff; cnt[less] = lo;
      const ok = more + ':' + diff, f1 = less + ':' + diff, f2 = more + ':' + (diff > 1 && rng.chance(0.5) ? diff - 1 : diff + 1);
      const opts = rng.shuffle([ok, f1, f2]);
      return { k: [5, cnt.spiderman, cnt.widow], cnt, more, less, diff, answer: ok, opts, sup: 1, fact: factOf('-', lo + diff, lo) };
    },
    geo() { return K.L() ? { x: 152, w: 720, y1: 106, h: 128, gap: 18, fs: 92, nh: 76, gs: 46, cs: 136, top: 38 } : { x: 24, w: 656, y1: 228, h: 148, gap: 22, fs: 104, nh: 86, gs: 48, cs: 150, top: 64 }; },
    cardSpot(st) { const g = this.geo(), s = g.cs + (st.q.cnt ? 14 : 0); return { cx: g.x + g.w / 2, cy: g.y1 + 2 * g.h + g.gap + g.top + s / 2, gap: 34 }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo();
      if (st.r1) place(st.r1.p, g.x, g.y1, g.w, g.h);
      if (st.r2) place(st.r2.p, g.x, g.y1 + g.h + g.gap, g.w, g.h);
      if (st.cards) K.cardsPlace(st, this.cardSpot(st));
    },
    row(st, who) {
      const p = V7.panel(st, 4, false); Object.assign(p.style, { justifyContent: 'flex-start', gap: '20px', padding: '0 22px' });
      p.appendChild(V7.face(who, this.geo().fs));
      const c = el('div', '', p); Object.assign(c.style, { display: 'flex', alignItems: 'center', gap: '16px', minWidth: '0', pointerEvents: 'none' });
      return { p, c, who };
    },
    /* a number in a box of fixed width: the gems after it start at the same place in both rows */
    numBox(n) { const b = el('div', ''); Object.assign(b.style, { width: '104px', display: 'flex', justifyContent: 'center', flexShrink: '0' }); b.appendChild(UI.num(n, this.geo().nh)); return b; },
    gems(n, size) { const d = el('div', ''); Object.assign(d.style, { display: 'flex', gap: '4px', flexShrink: '0', pointerEvents: 'none' }); for (let i = 0; i < n; i++) { const im = img('assets/props/gem.png', '', d); Object.assign(im.style, { width: size + 'px', height: size + 'px', objectFit: 'contain' }); } return d; },
    /* two bars: the one we know on top, hers below - longer by a green piece (more) or shorter by a dashed piece (fewer) */
    bars(q) {
      const s = svg('svg', { viewBox: '0 0 100 64', width: 112, height: 72 }), c1 = WHO7[q.known].col, c2 = WHO7[q.asked].col, a = { stroke: INK, 'stroke-width': 3 };
      svg('rect', Object.assign({ x: 4, y: 6, width: 60, height: 20, rx: 6, fill: c1 }, a), s);
      if (q.rel === 'more') { svg('rect', Object.assign({ x: 4, y: 38, width: 60, height: 20, rx: 6, fill: c2 }, a), s); svg('rect', Object.assign({ x: 64, y: 38, width: 32, height: 20, rx: 6, fill: '#5CC46E' }, a), s); }
      else { svg('rect', Object.assign({ x: 4, y: 38, width: 32, height: 20, rx: 6, fill: c2 }, a), s); svg('rect', { x: 36, y: 38, width: 28, height: 20, rx: 6, fill: '#FFF0E0', stroke: '#E0701E', 'stroke-width': 3, 'stroke-dasharray': '5 4' }, s); }
      s.style.flexShrink = '0'; s.style.pointerEvents = 'none';
      return s;
    },
    chip(q) {
      const d = el('div', ''); Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px', borderRadius: '18px', flexShrink: '0', background: q.rel === 'more' ? '#E6F7E9' : '#FFF0E0', boxShadow: '0 0 0 3px ' + INK, pointerEvents: 'none' });
      d.appendChild(this.bars(q)); d.appendChild(V7.numCol(q.dd, q.sup, 62));
      return d;
    },
    optNode(o) { const [w, n] = o.split(':'), d = el('div', ''); Object.assign(d.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', pointerEvents: 'none' }); d.appendChild(V7.face(w, 64)); d.appendChild(UI.num(+n, 50)); return d; },
    /* the story in two steps: her row comes with its sentence, then the question and the cards */
    async present(st) {
      const q = st.q, my = st, N = WHO7, G = this.geo();
      if (q.cnt) {
        st.r1 = this.row(st, 'spiderman'); st.r1.c.appendChild(this.numBox(q.cnt.spiderman));
        st.r2 = this.row(st, 'widow'); st.r2.c.appendChild(this.numBox(q.cnt.widow));
        st.lead = [N.spiderman.name + '有' + CNQ(q.cnt.spiderman) + '颗宝石', N.widow.name + '有' + CNQ(q.cnt.widow) + '颗宝石'];
      } else {
        st.r1 = this.row(st, q.known); st.r1.c.appendChild(this.numBox(q.a)); if (!q.sup) st.r1.c.appendChild(this.gems(q.a, G.gs));
        st.r2 = this.row(st, q.asked); st.slot = V7.slot(G.nh); st.r2.c.appendChild(st.slot); st.r2.c.appendChild(this.chip(q));
        st.lead = [N[q.known].name + '有' + CNQ(q.a) + '颗宝石', N[q.asked].name + '比' + N[q.known].pr + (q.rel === 'more' ? '多' : '少') + CNQ(q.dd) + '颗'];
      }
      st.r2.p.style.visibility = 'hidden';
      this.place(st);
      K.pop(st, st.r1.p);
      K.task(st, [['assets/thumbs/spiderman.png', 'assets/props/gem.png', 'assets/thumbs/widow.png'], ['q']]);
      await V7.talk(st, st.lead[0], 2600); if (!Session.alive(my)) return;
      st.r2.p.style.visibility = ''; K.pop(st, st.r2.p);
      Voice.say(st.lead[1], { tag: 'prompt' });
      const g = this.cardSpot(st);
      if (q.cnt) W2X.cards(st, q.opts.map(o => this.optNode(o)), q.opts, { size: G.cs + 14, gap: 34, cx: g.cx, cy: g.cy });
      else K.cards(st, q.opts, Object.assign({ size: G.cs, numOnly: !!q.sup }, g));
      K.say(st, q.cnt ? '谁多，多几颗？' : N[q.asked].name + '有几颗？');
    },
    onGesture(st, name, p) { return W3X.tapCards(st, name, p); },
    async reveal(st) {
      const q = st.q, g = this.geo();
      const c = st.cards[st.opts.indexOf(q.answer)]; if (c) { K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 18); }
      /* both rows: the number and its gems, from the same place - the extra ones shine */
      const n1 = q.cnt ? q.cnt[st.r1.who] : q.a, n2 = q.cnt ? q.cnt[st.r2.who] : q.answer;
      const size = Math.max(26, Math.min(44, Math.floor((g.w - 44 - g.fs - 20 - 104 - 16 - 36) / 10)));
      [[st.r1, n1], [st.r2, n2]].forEach(([r, n]) => { r.c.innerHTML = ''; r.c.appendChild(this.numBox(n)); r.gems = this.gems(n, size); r.c.appendChild(r.gems); });
      const lo = Math.min(n1, n2), big = n1 > n2 ? st.r1 : st.r2;
      Array.from(big.gems.children).slice(lo).forEach((e, i) => { e.style.filter = 'drop-shadow(0 0 7px #FFE36B) drop-shadow(0 0 3px #FFFFFF)'; st.scope.anim(e, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 420, delay: 140 * i, easing: EASE.pop }); });
      Sfx.reveal(); this.cheerAll(st);
      st.summary = q.cnt ? WHO7[q.more].name + '多' + CNQ(q.diff) + '颗！' : WHO7[q.asked].name + '有' + CNQ(q.answer) + '颗！';
      Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1500));
    },
    async feedback(st, ans) {
      const q = st.q, i = st.opts.indexOf(ans); if (st.cards && st.cards[i]) K.wiggle(st, st.cards[i]);
      let line;
      if (q.cnt) { const [w, n] = String(ans).split(':'); line = w !== q.more ? '不是' + WHO7[w].name + '多' : '不是多' + CNQ(+n) + '颗'; }
      else if (q.rel === 'more' && ans <= q.a) line = '要比' + CN[q.a] + '多';
      else if (q.rel === 'less' && ans >= q.a) line = '要比' + CN[q.a] + '少';
      else line = '不是' + CNQ(ans) + '颗';
      W3X.say(line); await st.scope.wait(T(700));
    },
    next(st, strat) { return V7.nextCard(st, strat); },
    workEls(st) { return st.cards || []; },
    snap(st) { return { opts: st.opts || null }; },
  };

  /* ================================================================ I8 猜数 (reasoning): clues one by one - "比三大" "比六小" "不是
     四" - each as a picture that stays (? > 3, ? < 6, a crossed-out 4, pairs of dots for "是双数"); tap the number. Only one
     number fits, and every clue is needed. L1 two clues (> and <), cards 0-6, dots · L2 cards 0-10, > and <, or one of
     them and "不是" · L3 three clues · L4 three clues in any order (two "不是" too), numbers only · L5 one clue is "是双数". */
  const CLUE = {
    holds(c, n) { return c[0] === 'gt' ? n > c[1] : c[0] === 'lt' ? n < c[1] : c[0] === 'not' ? n !== c[1] : n % 2 === 0; },
    line(c) { return c[0] === 'gt' ? '比' + CN[c[1]] + '大' : c[0] === 'lt' ? '比' + CN[c[1]] + '小' : c[0] === 'not' ? '不是' + CN[c[1]] : '是双数'; },
    why(c, n) { return c[0] === 'gt' ? '要比' + CN[c[1]] + '大' : c[0] === 'lt' ? '要比' + CN[c[1]] + '小' : c[0] === 'not' ? '不是' + CN[c[1]] : CN[n] + '不是双数'; },
  };
  W4R.I8 = {
    kind0: 'guess', verb: '猜数！', intro: '猜猜是几！', praise: ['猜中啦！'], props: ['alien'],
    gen(G, o) {
      const d = Math.min(5, o.level), rng = o.rng, top = d === 1 ? 6 : 10, all = Array.from({ length: top + 1 }, (_, i) => i);
      const pats = { 1: [['gt', 'lt']], 2: [['gt', 'lt'], ['gt', 'not'], ['lt', 'not']], 3: [['gt', 'lt', 'not']], 4: [['gt', 'lt', 'not'], ['gt', 'not', 'not'], ['lt', 'not', 'not']], 5: [['gt', 'lt', 'even'], ['gt', 'not', 'even'], ['lt', 'not', 'even']] }[d];
      const pick = pats.length > 1 ? bagPick(G, 'i8p' + d, pats.map((_, i) => i)) : 0;
      const cands = cl => all.filter(n => cl.every(c => CLUE.holds(c, n)));
      for (let t = 0; t < 6000; t++) {
        const kinds = pats[t < 4000 ? pick : t % pats.length];
        const cl = kinds.map(k => (k === 'gt' ? ['gt', rng.int(0, top - 1)] : k === 'lt' ? ['lt', rng.int(1, top)] : k === 'not' ? ['not', rng.int(0, top)] : ['even', 0]));
        const nots = cl.filter(c => c[0] === 'not').map(c => c[1]); if (new Set(nots).size !== nots.length) continue;
        const left = cands(cl); if (left.length !== 1) continue;
        if (cl.some((_, i) => cands(cl.filter((__, j) => j !== i)).length < 2)) continue;          /* every clue is needed */
        const clues = d >= 4 ? rng.shuffle(cl) : cl;
        return { k: [d, clues.map(c => c[0] + c[1]).join()], clues, top, answer: left[0], opts: all.slice(), sup: d <= 3 ? 0 : 1 };
      }
      return { k: [d, 'x'], clues: [['gt', 2], ['lt', 4]], top, answer: 3, opts: all.slice(), sup: d <= 3 ? 0 : 1 };
    },
    geo(st) {
      const L = K.L(), n = st.q.opts.length, nc = st.q.clues.length, one = n <= 7;
      const c = L ? { w: 176, h: 124, gap: 22, aw: 104, ah: 108 } : { w: 196, h: 126, gap: 14, aw: 110, ah: 114 };
      const total = (L ? c.aw + 18 : 0) + nc * c.w + (nc - 1) * c.gap, x0 = (L ? 512 : 352) - total / 2;
      Object.assign(c, L ? { ax: x0, ay: (one ? 146 : 108) + (c.h - c.ah) / 2, x: x0 + c.aw + 18, y: one ? 146 : 108 } : { ax: 352 - c.aw / 2, ay: 884, x: x0, y: 226 });
      return L ? Object.assign({ per: one ? n : 6, size: one ? 108 : 104, gap: one ? 14 : 16, cx: 512, cy0: one ? 432 : 386 }, { clue: c })
        : Object.assign({ per: 4, size: one ? 124 : 116, gap: 16, cx: 352, cy0: one ? 470 : 466 }, { clue: c });
    },
    cardSpot(st) { const g = this.geo(st); return { cx: g.cx, cy: g.cy0, gap: g.gap }; },
    decor(G) { W3X.decor2(G, this.chars); },
    place(st) {
      const g = this.geo(st), c = g.clue;
      if (st.cards) st.cards.forEach((e, i) => { const r = Math.floor(i / g.per), inRow = Math.min(g.per, st.cards.length - r * g.per), k = i % g.per; place(e, Math.round(g.cx - (inRow * g.size + (inRow - 1) * g.gap) / 2 + k * (g.size + g.gap)), Math.round(g.cy0 + r * (g.size + g.gap) - g.size / 2), g.size, g.size); });
      if (st.alien) place(st.alien, c.ax, c.ay, c.aw, c.ah);
      (st.clueEls || []).forEach((e, i) => place(e, c.x + i * (c.w + c.gap), c.y, c.w, c.h));
    },
    clueCard(st, c, sup) {
      const e = V7.panel(st, 5, false); e.style.gap = '6px';
      if (c[0] === 'gt' || c[0] === 'lt') { e._slot = V7.slot(44); e.appendChild(e._slot); e.appendChild(V7.op(c[0] === 'gt' ? '>' : '<', 58, '#2E6FD8')); e.appendChild(V7.numCol(c[1], sup, 54, true)); }
      else if (c[0] === 'not') {
        const col = V7.numCol(c[1], 1, 72), w = el('div', '');          /* the number alone: its dots would not be crossed out */ col.insertBefore(w, col.firstChild); Object.assign(w.style, { position: 'relative', pointerEvents: 'none', display: 'flex' }); w.appendChild(col.children[1]); e.appendChild(col);
        const s = svg('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none' }); Object.assign(s.style, { position: 'absolute', left: '-14px', top: '-4px', width: 'calc(100% + 28px)', height: 'calc(100% + 8px)', pointerEvents: 'none', overflow: 'visible' });
        svg('path', { d: 'M8 92L92 8', stroke: '#FFFFFF', 'stroke-width': 13, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, s);
        svg('path', { d: 'M8 92L92 8', stroke: '#5A4636', 'stroke-width': 7, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, s);
        w.appendChild(s);
      } else {
        /* 是双数: the dots all go in pairs */
        const s = svg('svg', { viewBox: '0 0 120 84', width: 116, height: 81 });
        for (let k = 0; k < 3; k++) { const x = 8 + k * 38; svg('rect', { x, y: 4, width: 28, height: 76, rx: 14, fill: '#E6F7E9', stroke: INK, 'stroke-width': 3 }, s); [24, 60].forEach(y => svg('circle', { cx: x + 14, cy: y, r: 9.5, fill: '#5CC46E', stroke: INK, 'stroke-width': 2.5 }, s)); }
        s.style.pointerEvents = 'none'; e.appendChild(s);
      }
      return e;
    },
    async present(st) {
      const q = st.q, my = st;
      st.alien = K.item(Stage.el, 'assets/props/alien.png', 100, 104); st.alien.style.zIndex = 4; st.els.push(st.alien);
      st.clueEls = [];
      this.place(st); K.pop(st, st.alien);
      K.task(st, [['assets/props/alien.png'], ['q']]);
      await st.scope.wait(T(500)); if (!Session.alive(my)) return;
      const lines = q.clues.map(c => CLUE.line(c));
      for (let i = 0; i < q.clues.length; i++) {
        const e = this.clueCard(st, q.clues[i], q.sup); st.clueEls.push(e); this.place(st); K.pop(st, e); Sfx.pop();
        if (i === q.clues.length - 1) break;
        await V7.talk(st, lines[i], 2200); if (!Session.alive(my)) return;
        await st.scope.wait(T(250)); if (!Session.alive(my)) return;
      }
      /* eleven cards: their own ids (n0 .. n10 - the shared card ids stop at card9) */
      const size = this.geo(st).size;
      st.cards = q.opts.map((v, i) => { const c = UI.card(v, size, { numOnly: !!q.sup }); Stage.el.appendChild(c); c.style.position = 'absolute'; K.reg(st, 'n' + v, c, {}); st.els.push(c); st.scope.anim(c, [{ transform: 'scale(0) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 320, delay: 40 * i, easing: EASE.pop, fill: 'backwards' }); return c; });
      st.opts = q.opts.slice();
      this.place(st);
      st.lead = lines.slice(0, -1);
      K.say(st, lines[lines.length - 1] + '，是几？');
    },
    onGesture(st, name, p) { const m = /^n(\d+)$/.exec(p.id || ''); if (name !== 'tap' || !m || !st.cards || st.picked) return false; st.picked = true; Session.submit(st, Number(m[1])); return 'ok'; },
    async reveal(st) {
      const q = st.q, c = st.cards[st.opts.indexOf(q.answer)];
      if (c) { K.ring(st, [box(c)], 6, '#FFC93C'); K.hop(st, c, 18); }
      st.clueEls.forEach((e, i) => { if (e._slot) V7.fill(e._slot, q.answer, 1, 54); st.scope.anim(e, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 380, delay: 160 * i, easing: EASE.pop }); });
      if (st.alien) K.hop(st, st.alien, 24);
      Sfx.reveal(); this.cheerAll(st);
      st.summary = '就是' + CN[q.answer] + '！'; Voice.say(st.summary, { tag: 'summary' });
      await st.scope.wait(T(1300));
    },
    async feedback(st, ans) {
      const q = st.q, i = q.clues.findIndex(c => !CLUE.holds(c, ans)), card = st.cards[st.opts.indexOf(ans)];
      if (card) K.wiggle(st, card); if (st.clueEls[i]) K.wiggle(st, st.clueEls[i]);
      W3X.say(CLUE.why(q.clues[Math.max(0, i)], ans)); await st.scope.wait(T(700));
    },
    next(st, strat) { if (st.picked || !st.cards) return null; const v = strat === 'wrong' ? st.opts.find(x => x !== st.q.answer) : st.q.answer; return { g: 'tap', p: { id: 'n' + v } }; },
    workEls(st) { return st.cards || []; },
    snap(st) { return { opts: st.opts || null, clues: st.q.clues }; },
  };
}
/* ---------------------------------------------------------------- the 28 star games: one rule each (W4R.<id>, raw/js/w4/<island>.js)
   + the island's things. A rule not written yet falls back to the sky's MSums (a playable stand-in). */
function w4Game(rule, spec) {
  const g = defGame(Object.assign({}, W2Base, rule || MSums, spec));
  g.props = (spec.props || []).filter((p, i, a) => a.indexOf(p) === i);
  return g;
}
const IC4 = (() => {
  const k = '#2B2118', I = s => W2X.icon(s);
  return {
    croc: I('<path d="M12 30L50 50L12 70" fill="none" stroke="#3FA34D" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="72" cy="50" r="12" fill="#FFC93C" stroke="' + k + '" stroke-width="4"/>'),
    sign: I('<rect x="8" y="22" width="84" height="56" rx="12" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><path d="M28 50H44M36 42V58M58 50H74" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/>'),
    build: I('<rect x="6" y="34" width="22" height="32" rx="5" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/><rect x="39" y="34" width="22" height="32" rx="5" fill="#FFC93C" stroke="' + k + '" stroke-width="4"/><rect x="72" y="34" width="22" height="32" rx="5" fill="#5CC46E" stroke="' + k + '" stroke-width="4"/>'),
    code: I('<polygon points="30,14 44,40 16,40" fill="#E8414B" stroke="' + k + '" stroke-width="4"/><rect x="56" y="16" width="26" height="26" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/><path d="M20 66H44M58 60L66 76L82 56" stroke="' + k + '" stroke-width="6" stroke-linecap="round" fill="none"/>'),
    jar: I('<path d="M30 26H70V82Q70 90 62 90H38Q30 90 30 82Z" fill="#DFF3FF" stroke="' + k + '" stroke-width="5"/><polygon points="50,40 54,50 64,50 56,56 59,66 50,60 41,66 44,56 36,50 46,50" fill="#FFC93C" stroke="' + k + '" stroke-width="2"/><rect x="26" y="16" width="48" height="12" rx="4" fill="#B97A3C" stroke="' + k + '" stroke-width="4"/>'),
    hands: I('<path d="M24 86V52L16 36M24 52L26 24M24 52L34 22M24 52L40 30" stroke="' + k + '" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M70 86V52L64 30M70 52L78 26" stroke="' + k + '" stroke-width="7" stroke-linecap="round" fill="none"/>'),
    comic: I('<rect x="6" y="20" width="40" height="60" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><rect x="54" y="20" width="40" height="60" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><circle cx="26" cy="50" r="7" fill="#4FB3FF"/><circle cx="66" cy="44" r="7" fill="#4FB3FF"/><circle cx="82" cy="58" r="7" fill="#4FB3FF"/>'),
    shapes: I('<polygon points="50,10 90,84 10,84" fill="none" stroke="' + k + '" stroke-width="6" stroke-linejoin="round"/><path d="M50 10L50 84M30 47L70 47" stroke="#E8414B" stroke-width="5"/>'),
    pic: I('<rect x="10" y="14" width="80" height="44" rx="8" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><circle cx="30" cy="36" r="8" fill="#FFC93C"/><circle cx="50" cy="36" r="8" fill="#FFC93C"/><path d="M62 28L78 44M78 28L62 44" stroke="#E8414B" stroke-width="5"/><path d="M26 76H44M58 76H74" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/>'),
    seats: I('<rect x="8" y="30" width="84" height="44" rx="20" fill="#DCE6F5" stroke="' + k + '" stroke-width="5"/><circle cx="30" cy="52" r="10" fill="#4FB3FF" stroke="' + k + '" stroke-width="3"/><circle cx="54" cy="52" r="10" fill="#fff" stroke="' + k + '" stroke-width="3"/><circle cx="76" cy="52" r="10" fill="#fff" stroke="' + k + '" stroke-width="3"/>'),
    balloons: I('<circle cx="32" cy="36" r="18" fill="#E8414B" stroke="' + k + '" stroke-width="4"/><circle cx="68" cy="36" r="18" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/><path d="M32 54V90M68 54V90" stroke="' + k + '" stroke-width="3"/>'),
    fold: I('<path d="M14 14H86V86H14Z" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><path d="M50 14V86" stroke="' + k + '" stroke-width="3" stroke-dasharray="6 5"/><circle cx="32" cy="40" r="7" fill="' + k + '"/><circle cx="68" cy="40" r="7" fill="' + k + '"/>'),
    splits: I('<circle cx="50" cy="24" r="14" fill="#FFC93C" stroke="' + k + '" stroke-width="4"/><path d="M42 36L24 62M58 36L76 62" stroke="' + k + '" stroke-width="5"/><circle cx="22" cy="74" r="12" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/><circle cx="78" cy="74" r="12" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/>'),
    pair: I('<rect x="8" y="26" width="34" height="48" rx="8" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><rect x="58" y="26" width="34" height="48" rx="8" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><path d="M42 50H58" stroke="#E8414B" stroke-width="6"/>'),
    table: I('<path d="M14 20H86M14 40H86M14 60H86M14 80H86" stroke="' + k + '" stroke-width="5" stroke-linecap="round"/><circle cx="26" cy="20" r="5" fill="#4FB3FF"/><circle cx="26" cy="40" r="5" fill="#4FB3FF"/><circle cx="26" cy="60" r="5" fill="#4FB3FF"/><circle cx="26" cy="80" r="5" fill="#FFC93C"/>'),
    sudoku: I('<rect x="10" y="10" width="80" height="80" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><path d="M37 10V90M63 10V90M10 37H90M10 63H90" stroke="' + k + '" stroke-width="3"/><circle cx="23" cy="23" r="7" fill="#E8414B"/><rect x="43" y="43" width="14" height="14" fill="#4FB3FF"/><polygon points="77,70 84,82 70,82" fill="#3FA34D"/>'),
    gourds3: I('<circle cx="22" cy="58" r="13" fill="#E8414B" stroke="' + k + '" stroke-width="4"/><circle cx="50" cy="58" r="13" fill="#FFC93C" stroke="' + k + '" stroke-width="4"/><circle cx="78" cy="58" r="13" fill="#3FA34D" stroke="' + k + '" stroke-width="4"/><path d="M14 84H86" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/>'),
    path: I('<path d="M10 80Q30 40 50 60T90 20" fill="none" stroke="' + k + '" stroke-width="7" stroke-linecap="round"/><circle cx="30" cy="52" r="9" fill="#FFC93C" stroke="' + k + '" stroke-width="3"/><circle cx="70" cy="44" r="9" fill="#FFC93C" stroke="' + k + '" stroke-width="3"/>'),
    pyramid: I('<rect x="36" y="12" width="28" height="22" rx="4" fill="#FFC93C" stroke="' + k + '" stroke-width="4"/><rect x="20" y="38" width="28" height="22" rx="4" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/><rect x="52" y="38" width="28" height="22" rx="4" fill="#4FB3FF" stroke="' + k + '" stroke-width="4"/><rect x="4" y="64" width="28" height="22" rx="4" fill="#5CC46E" stroke="' + k + '" stroke-width="4"/><rect x="36" y="64" width="28" height="22" rx="4" fill="#5CC46E" stroke="' + k + '" stroke-width="4"/><rect x="68" y="64" width="28" height="22" rx="4" fill="#5CC46E" stroke="' + k + '" stroke-width="4"/>'),
    seq: I('<circle cx="16" cy="50" r="10" fill="#4FB3FF" stroke="' + k + '" stroke-width="3"/><circle cx="40" cy="50" r="10" fill="#4FB3FF" stroke="' + k + '" stroke-width="3"/><circle cx="64" cy="50" r="10" fill="#4FB3FF" stroke="' + k + '" stroke-width="3"/><rect x="78" y="38" width="20" height="24" rx="4" fill="#fff" stroke="' + k + '" stroke-width="3" stroke-dasharray="4 3"/>'),
    peaches: I('<circle cx="34" cy="52" r="16" fill="#FFB3C7" stroke="' + k + '" stroke-width="4"/><circle cx="66" cy="52" r="16" fill="#FFB3C7" stroke="' + k + '" stroke-width="4"/><path d="M54 38L78 66" stroke="#E8414B" stroke-width="6" stroke-linecap="round"/>'),
    first: I('<rect x="8" y="30" width="34" height="40" rx="8" fill="#fff" stroke="' + k + '" stroke-width="3" stroke-dasharray="5 4"/><path d="M48 50H60M64 50H92" stroke="' + k + '" stroke-width="6" stroke-linecap="round"/><text x="25" y="60" font-size="28" font-weight="900" text-anchor="middle" fill="' + k + '">?</text>'),
    key: I('<circle cx="30" cy="50" r="16" fill="none" stroke="#E8A100" stroke-width="8"/><path d="M46 50H90M74 50V64M86 50V60" stroke="#E8A100" stroke-width="8" stroke-linecap="round"/>'),
    maze: I('<rect x="8" y="8" width="84" height="84" rx="6" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><path d="M8 34H62M38 60H92M8 60H22" stroke="' + k + '" stroke-width="5"/><circle cx="20" cy="20" r="7" fill="#E8414B"/><circle cx="80" cy="80" r="7" fill="#3FA34D"/>'),
    think: I('<path d="M14 40H40M27 27V53" stroke="#3FA34D" stroke-width="7" stroke-linecap="round"/><path d="M58 64H86" stroke="#E8414B" stroke-width="7" stroke-linecap="round"/><path d="M40 70Q50 40 62 40" fill="none" stroke="' + k + '" stroke-width="4" stroke-dasharray="5 4"/>'),
    bus: I('<rect x="8" y="30" width="84" height="40" rx="16" fill="#fff" stroke="' + k + '" stroke-width="5"/><circle cx="30" cy="46" r="7" fill="#2E3A6B"/><circle cx="50" cy="46" r="7" fill="#2E3A6B"/><circle cx="70" cy="46" r="7" fill="#2E3A6B"/><path d="M20 82L34 72M80 82L66 72" stroke="' + k + '" stroke-width="4"/>'),
    more: I('<path d="M10 30H70" stroke="#4FB3FF" stroke-width="12" stroke-linecap="round"/><path d="M10 64H46" stroke="#FFC93C" stroke-width="12" stroke-linecap="round"/><path d="M56 64H86" stroke="#E8414B" stroke-width="5" stroke-dasharray="6 5"/>'),
    guess: I('<circle cx="50" cy="50" r="38" fill="#FFF8EC" stroke="' + k + '" stroke-width="5"/><text x="50" y="66" font-size="48" font-weight="900" text-anchor="middle" fill="#E8414B">?</text>'),
  };
})();
[
  ['F1', 'peppa4', 'peppa_crater', ['peppa', 'george'], 'peppa', IC4.croc, 'cmp10'],
  ['F2', 'peppa4', 'peppa_launchpad', ['george', 'daddy_pig'], 'daddy_pig', IC4.sign, 'add10'],
  ['F3', 'peppa4', 'peppa_galley', ['mummy_pig', 'peppa'], 'mummy_pig', IC4.build, 'add10'],
  ['F4', 'peppa4', 'peppa_dome', ['daddy_pig', 'george'], 'daddy_pig', IC4.code, null],
  ['I1', 'bluey4', 'bluey_meteorhill', ['bluey', 'bingo'], 'bluey', IC4.jar, 'add10', ['jar', 'shootingstar']],
  ['I2', 'bluey4', 'bluey_cockpit', ['bingo', 'bluey'], 'bingo', IC4.hands, 'add10'],
  ['I3', 'bluey4', 'bluey_moonpark', ['bandit', 'chilli'], 'bandit', IC4.comic, 'add10'],
  ['I4', 'bluey4', 'bluey_planetarium', ['chilli', 'bandit'], 'chilli', IC4.shapes, null],
  ['M1', 'pjmasks4', 'pj_moonsurface', ['gekko', 'catboy'], 'gekko', IC4.pic, 'sub10'],
  ['M2', 'pjmasks4', 'pj_shuttlecabin', ['owlette', 'pj_robot'], 'owlette', IC4.seats, 'part5', ['astronaut']],
  ['M3', 'pjmasks4', 'pj_mooncity', ['catboy', 'luna_girl'], 'catboy', IC4.balloons, 'sub10'],
  ['M4', 'pjmasks4', 'pj_moonlab', ['pj_robot', 'owlette'], 'pj_robot', IC4.fold, null],
  ['N1', 'paw4', 'paw_marsdesert', ['skye', 'chase'], 'skye', IC4.splits, 'part10'],
  ['N2', 'paw4', 'paw_rovergarage', ['rocky', 'zuma'], 'rocky', IC4.pair, 'part10'],
  ['N3', 'paw4', 'paw_greenhouse', ['marshall', 'rubble'], 'marshall', IC4.table, 'part10'],
  ['N4', 'paw4', 'paw_controlroom', ['ryder', 'skye'], 'ryder', IC4.sudoku, null],
  ['O1', 'huluwa4', 'huluwa_vinegarden', ['gourd2', 'gourd1'], 'gourd2', IC4.gourds3, 'add10'],
  ['O2', 'huluwa4', 'huluwa_rocks', ['gourd6', 'gourd3'], 'gourd6', IC4.path, 'add10'],
  ['O3', 'huluwa4', 'huluwa_courtyard', ['gourd7', 'grandpa'], 'gourd7', IC4.pyramid, 'add10'],
  ['O4', 'huluwa4', 'huluwa_crystalcave', ['grandpa', 'gourd2'], 'grandpa', IC4.seq, null],
  ['F5', 'xiyou4', 'xiyou_peachgarden', ['bajie', 'wukong'], 'bajie', IC4.peaches, 'sub10'],
  ['F6', 'xiyou4', 'xiyou_cloudterrace', ['wukong', 'shaseng'], 'wukong', IC4.first, 'sub10'],
  ['F7', 'xiyou4', 'xiyou_palacedoors', ['tangseng', 'bajie'], 'tangseng', IC4.key, 'sub10', ['key']],
  ['F8', 'xiyou4', 'xiyou_starmaze', ['dragon_horse', 'wukong'], 'wukong', IC4.maze, null],
  ['I5', 'avengers4', 'avengers_commanddeck', ['captain', 'ironman'], 'captain', IC4.think, 'sub10'],
  ['I6', 'avengers4', 'avengers_shuttleline', ['thor', 'hulk'], 'thor', IC4.bus, 'sub10', ['spacebus', 'astronaut']],
  ['I7', 'avengers4', 'avengers_gym', ['spiderman', 'widow'], 'spiderman', IC4.more, 'add10'],
  ['I8', 'avengers4', 'avengers_screens', ['ironman', 'captain'], 'ironman', IC4.guess, null],
].forEach(([id, world, bg, chars, host, icon, card, props]) => {
  w4Game(W4R[id], { id, world, bg, chars, host, iconSrc: icon, props: props || (W4R[id] && W4R[id].props) || [] });
  if (card) GAMECARD[id] = card;
});
W4.ready = true;
if (Screens.cur === 'map' && !Session.G && Store.s.mapSet === 4 && MapView.set !== 4) { MapView.useSet(4); MapView.update(); }
W3.w4in = true;
