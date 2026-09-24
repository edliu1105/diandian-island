# -*- coding: utf-8 -*-
"""Generator gate: every mini-game x level x kind x hundreds of seeds, run on the REAL generators inside the page.

Per game (24), per level 1..MAXLV[world], per kind of kinds(level), SEEDS seeds (fresh session each):
  * gen() never throws, is deterministic for a seed, returns a JSON-able q with a key (q.k) and a defined answer
    (documented exceptions: H3 - the answer exists only after the child's own split, every split 1..N-1 is simulated;
     A1 L1-2 - the dispatch is judged "a,b" by evaluate(); P2 - judged "everyone exactly one pair");
  * cards: exactly 3 distinct integers 0..20 containing the answer, and the game's OWN evaluate() accepts the right
    submission and rejects every other card / a neighbouring wrong submission (exactly one right answer);
  * explicit per-game invariants (level ranges from DESIGN.md section 4 and the generator; solvability with the supply
    the question gives) - see INV below, one commented function per game;
  * balance, measured on simulated sessions that pick the kind and regenerate a repeated key EXACTLY like
    Session.newQ: right-card POSITION 20-47 % each, right-card RANK min/mid/max 15-50 % each (DESIGN 1.4: "always the
    middle card" may only win ~1/3), semantic answers of the judgement games B1/B3/B4.  Bounds get a 2.5-sigma
    sampling tolerance: a share within the tolerance of a bound = WARN (borderline), beyond it = FAIL;
  * every REQUIRED kind is asked at some level; Session.probeFor() asks a missing required kind at a level that has it;
  * static voice lines (intro / verb / praise of every game + PRAISE) <= 8 CJK characters (WARN only);
  * a self-test breaks valid questions on purpose and requires check() to catch each one (the checks are not vacuous).
Numeral setting digits() on and off; a reduced webkit pass re-runs the invariants and cross-checks the question keys.

Seeds are murmur3-mixed (the xorshift32 RNG gives a first draw < 0.026 for every seed 1..400, which would bias the
first bag shuffle of every fresh session). A failing example prints its seed: GAMES[g].gen(G, {level, kind, rng: G.rng})
with G = {bags: {}, rng: RNG(seed), ...} reproduces it exactly.

usage: python tests/test_generators.py [seeds=400]
"""
import os, sys, time, math
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, Log

SEEDS = int(sys.argv[1]) if len(sys.argv) > 1 else 400
SESS_LEN = 12            # questions per simulated session (a multiple of every bag size 2/3/4/6)
WEBKIT_SEEDS = 40
MAXLV = {'peppa': 3, 'bluey': 3, 'huluwa': 4, 'paw': 4, 'xiyou': 4, 'avengers': 4}

JS_LIB = r"""
() => {
  /* ---------------------------------------------------------------- helpers */
  const mix = i => { let h = (i + 0x9E3779B9) >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; return (h >>> 0) || 1; };
  const J = x => { try { const s = JSON.stringify(x); return s === undefined ? String(x) : s; } catch (e) { return String(x); } };
  const inR = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
  const uniq = a => Array.isArray(a) && new Set(a.map(J)).size === a.length;
  const sameSet = (a, want) => Array.isArray(a) && a.length === want.length && uniq(a) && want.every(v => a.includes(v));
  const pts01 = (p, n) => Array.isArray(p) && p.length === n && p.every(x => Array.isArray(x) && x.length === 2 && x.every(c => typeof c === 'number' && c >= 0 && c <= 1));
  const sums = pieces => { let s = new Set([0]); pieces.forEach(p => { const t = new Set(s); s.forEach(x => t.add(x + p)); s = t; }); return s; };
  const fnv = (h, s) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  const safeKey = (game, q) => { try { return game.key(q); } catch (e) { return '?key-throws'; } };
  /* the fake session a generator needs: bags + rng (bagPick / numOptions / placeOptions), ws, level */
  const mkG = (g, lv, seed) => ({ world: GAMES[g].world, id: g, game: GAMES[g], rng: RNG(seed), bags: {}, ws: { level: lv, floor: 1, g: {}, win: [], hist: [], log: [], lastKey: '' }, level: lv, round: 0 });
  /* what numOptions(G, ans, lo, hi) promises: three consecutive distinct integers inside [lo, hi] containing ans */
  function numOpt(E, opts, ans, lo, hi, tag) {
    const bad = () => E.push([tag || 'num-options', 'cards ' + J(opts) + ' must be 3 consecutive integers in [' + lo + ',' + hi + '] containing ' + ans]);
    if (!Array.isArray(opts) || opts.length !== 3) return bad();
    const s = opts.slice().sort((a, b) => a - b);
    if (!(s.every(v => inR(v, lo, hi)) && s[1] === s[0] + 1 && s[2] === s[1] + 1 && opts.includes(ans))) bad();
  }
  const L = (tab, lv) => tab[lv];

  /* ---------------------------------------------------------------- per-game invariants
     fn(q, lv, kind, E, W, ctx): push [type, detail] into E (FAIL) or W (WARN) */
  const INV = {
    /* P1 splash - subitizing. DESIGN: L1 n 1-3, flash 1000 ms, cards {1,2,3}; L2 n 2-4, flash 900, cards by the size
       bag (numOptions 1..7); L3 'chunk' n 4-6 made of two small groups (numOptions 1..9). The child must SEE n splats. */
    P1(q, lv, kind, E) {
      const r = L({ 1: [1, 3], 2: [2, 4], 3: [4, 6] }, lv);
      if (!inR(q.n, r[0], r[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(r)]);
      if (q.answer !== q.n) E.push(['answer', 'answer ' + q.answer + ' != n ' + q.n]);
      if (!pts01(q.pts, q.n)) E.push(['splats', (q.pts || []).length + ' splat points for n=' + q.n + ' (or outside the sheet)']);
      if (lv === 1) { if (!sameSet(q.opts, [1, 2, 3])) E.push(['cards', 'L1 cards must be {1,2,3}: ' + J(q.opts)]); }
      else numOpt(E, q.opts, q.n, 1, lv === 2 ? 7 : 9);
      if (lv >= 3) {
        const c = q.chunks;
        if (!(Array.isArray(c) && c.length === 2 && c.every(x => inR(x, 1, 4)) && c[0] + c[1] === q.n)) E.push(['chunks', 'chunks ' + J(c) + ' must be two groups of 1-4 summing to n=' + q.n]);
        if (q.layout !== 'two') E.push(['layout', 'L3 layout ' + q.layout]);
      } else {
        if (q.chunks !== null) E.push(['chunks', 'L1-2 has no chunks: ' + J(q.chunks)]);
        if (!['scatter', 'line'].includes(q.layout)) E.push(['layout', 'layout ' + q.layout]);
      }
      if (q.flash !== (lv === 1 ? 1000 : 900)) E.push(['flash', 'flash ' + q.flash + ' ms']);
      if (!['frame', 'dice'].includes(q.cardLayout)) E.push(['card-layout', J(q.cardLayout)]);
      if (!['peppa', 'george', 'daddy_pig'].includes(q.jumper)) E.push(['jumper', J(q.jumper)]);
    },
    /* P2 boots - one-to-one. DESIGN: L1 2 people + 3 pairs, L2 3 + 5, L3 4-5 + 7; judged "everyone exactly one pair".
       Solvable: a pair for everyone AND a spare pair (over-giving must be possible). */
    P2(q, lv, kind, E) {
      const r = L({ 1: [2, 2], 2: [2, 4], 3: [4, 5] }, lv), rack = L({ 1: 3, 2: 5, 3: 7 }, lv);
      const pool = ['peppa', 'george', 'mummy_pig', 'daddy_pig', 'teddy'];
      if (!inR(q.n, r[0], r[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(r)]);
      if (!(Array.isArray(q.who) && q.who.length === q.n && uniq(q.who) && q.who.every(w => pool.includes(w)))) E.push(['recipients', J(q.who) + ' must be n=' + q.n + ' distinct of ' + J(pool)]);
      if (q.rack !== rack) E.push(['rack', 'rack ' + q.rack + ' != ' + rack]);
      if (!(q.rack > q.n)) E.push(['supply', 'rack ' + q.rack + ' pairs <= ' + q.n + ' recipients']);
      if (!(Array.isArray(q.colors) && q.colors.length === q.rack && q.colors.every(c => BOOTS.includes(c)))) E.push(['colors', J(q.colors)]);
      if (!(Array.isArray(q.lift) && q.lift.length === q.n && q.lift.every(v => inR(v, -20, 20)))) E.push(['lift', J(q.lift)]);
      if (q.answer !== 'each1') E.push(['answer', J(q.answer)]);
    },
    /* P3 toybox - cardinality. DESIGN: L1 'along' n 2-3 (teaching), L2 'card' n 3-5, L3 n 4-6; toys distinct, laid
       out twice (pts / pts2 on a 3x2 grid); L1 cards {1,2,3} / {2,3,4}, then the size bag (numOptions 1..9). */
    P3(q, lv, kind, E) {
      const r = L({ 1: [2, 3], 2: [3, 5], 3: [4, 6] }, lv);
      if (!inR(q.n, r[0], r[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(r)]);
      if (q.answer !== q.n) E.push(['answer', 'answer ' + q.answer + ' != n ' + q.n]);
      if (!(Array.isArray(q.toys) && q.toys.length === q.n && uniq(q.toys) && q.toys.every(t => TOYS.includes(t)))) E.push(['toys', J(q.toys)]);
      if (!pts01(q.pts, q.n) || !pts01(q.pts2, q.n)) E.push(['cells', 'toy cells ' + (q.pts || []).length + '/' + (q.pts2 || []).length + ' for n=' + q.n]);
      if (!sameSet(q.order, Array.from({ length: q.n }, (_, i) => i))) E.push(['order', J(q.order)]);
      numOpt(E, q.opts, q.n, 1, lv === 1 ? 5 : 9);          /* rank-dealt options (Session.genQ) */
    },
    /* P4 candles - Give-N. DESIGN: L1 'match' N 1-3, L2 'giveN' 2-5, L3 4-6; "the box always holds N+3 or more".
       Solvable: add() stops at min(supply, 10) candles -> N fits and >= 3 spare (never "just take them all"). */
    P4(q, lv, kind, E) {
      const r = L({ 1: [1, 3], 2: [2, 5], 3: [4, 6] }, lv);
      if (!inR(q.N, r[0], r[1])) E.push(['N-range', 'N=' + q.N + ' not in ' + J(r)]);
      if (q.answer !== q.N) E.push(['answer', 'answer ' + q.answer + ' != N ' + q.N]);
      if (q.supply !== q.N + 3 + (lv > 1 ? 1 : 0)) E.push(['supply', 'supply ' + q.supply + ' for N ' + q.N]);
      const cap = Math.min(q.supply, 10);
      if (!(q.N <= cap)) E.push(['unsolvable', 'N=' + q.N + ' > usable candles ' + cap]);
      else if (cap - q.N < 3) E.push(['spare', 'only ' + (cap - q.N) + ' spare candles (DESIGN: N+3 or more)']);
      if (!['george', 'peppa', 'daddy_pig', 'mummy_pig'].includes(q.star)) E.push(['star', J(q.star)]);
    },
    /* B1 compare. DESIGN: L1 each 1-4, difference >= 2 or equal, same item; L2 each 2-5, difference >= 1, half of the
       questions "the fewer are bigger"; L3 each 4-7, difference 1, one side spread. 'same' -> equal counts,
       'more'/'less' -> different counts and the answer is the sister with more / fewer. */
    B1(q, lv, kind, E) {
      const r = L({ 1: [1, 4], 2: [2, 5], 3: [4, 7] }, lv);
      if (!inR(q.nl, r[0], r[1]) || !inR(q.nb, r[0], r[1])) E.push(['count-range', 'bluey ' + q.nl + ' bingo ' + q.nb + ' not in ' + J(r)]);
      if (!pts01(q.posA, q.nl) || !pts01(q.posB, q.nb)) E.push(['cells', 'plate cells ' + (q.posA || []).length + '/' + (q.posB || []).length + ' for ' + q.nl + '/' + q.nb + ' items (4x2 grid)']);
      if (q.ask !== (kind === 'less' ? 'less' : 'more')) E.push(['ask', q.ask + ' for kind ' + kind]);
      const d = Math.abs(q.nl - q.nb);
      if (kind === 'same') {
        if (d !== 0) E.push(['same-unequal', "'same' with " + q.nl + ' vs ' + q.nb]);
        if (q.answer !== 'same') E.push(['answer', J(q.answer) + " for 'same'"]);
      } else {
        if (d === 0) E.push(['equal-counts', "'" + kind + "' with equal counts " + q.nl]);
        else {
          if (!(lv === 1 ? d >= 2 : lv === 3 ? d === 1 : d >= 1)) E.push(['difference', 'difference ' + d + ' at L' + lv]);
          const more = q.nl > q.nb ? 'bluey' : 'bingo', less = more === 'bluey' ? 'bingo' : 'bluey';
          if (q.answer !== (kind === 'less' ? less : more)) E.push(['answer', J(q.answer) + ' for ' + kind + ' with bluey ' + q.nl + ' bingo ' + q.nb]);
        }
      }
      if (q.itemL !== q.itemB) {
        const ok = lv >= 2 && kind !== 'same' && [q.itemL, q.itemB].sort().join() === 'cherry,watermelon' && ((q.itemL === 'watermelon') === (q.nl < q.nb));
        if (!ok) E.push(['items', 'conflict items ' + q.itemL + '/' + q.itemB + ' with counts ' + q.nl + '/' + q.nb + ' (the bigger item must sit on the side with fewer)']);
      } else if (!['cookie', 'strawberry'].includes(q.itemL)) E.push(['items', J(q.itemL)]);
      if (lv >= 3 ? !['bluey', 'bingo'].includes(q.spread) : q.spread !== '') E.push(['spread', J(q.spread)]);
      if (typeof q.blueyLeft !== 'boolean') E.push(['side', J(q.blueyLeft)]);
    },
    /* B2 shop. DESIGN: L1 2-3 things, L2 3-5 ('match': pay coin by coin, the jar gives up to 8 -> n+1 <= 8);
       L3 'remember' 3-5 things, then pick a coin stack (numOptions 1..6). */
    B2(q, lv, kind, E) {
      const r = L({ 1: [2, 3], 2: [3, 5], 3: [3, 5] }, lv);
      if (!inR(q.n, r[0], r[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(r)]);
      if (!(Array.isArray(q.items) && q.items.length === q.n && q.items.every(i => SHOP.includes(i)))) E.push(['items', J(q.items)]);
      if (q.answer !== q.n) E.push(['answer', 'answer ' + q.answer + ' != n ' + q.n]);
      if (lv <= 2) {
        if (q.opts != null || q.stacks != null) E.push(['cards', 'match levels have no coin stacks']);
        if (!(q.n + 1 <= 8)) E.push(['unsolvable', 'the jar gives at most 8 coins, n=' + q.n]);
      } else {
        if (J(q.stacks) !== J(q.opts)) E.push(['stacks', 'stacks ' + J(q.stacks) + ' != opts ' + J(q.opts)]);
        numOpt(E, q.opts, q.n, 1, 6);
      }
    },
    /* B3 conservation. DESIGN: L1 3 blocks a row, L2 4, L3 5-6. 'same': nothing changes; 'add': Bandit puts one block
       into ONE row; 'remove': takes one out (a row never empties). The answer is the real comparison of the rows. */
    B3(q, lv, kind, E) {
      const r = L({ 1: [3, 4], 2: [4, 5], 3: [5, 6] }, lv);     /* one block of variety per level (no identical retests) */
      if (!inR(q.n, r[0], r[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(r)]);
      const truth = q.nb === q.ng ? 'same' : q.nb > q.ng ? 'bluey' : 'bingo';
      if (q.answer !== truth) E.push(['answer', J(q.answer) + ' but rows bluey ' + q.nb + ' bingo ' + q.ng]);
      if (kind === 'same') { if (!(q.changed === null && q.nb === q.n && q.ng === q.n)) E.push(['same', 'changed ' + J(q.changed) + ' rows ' + q.nb + '/' + q.ng + ' n=' + q.n]); }
      else {
        const ch = q.changed, chN = ch === 'bluey' ? q.nb : q.ng, other = ch === 'bluey' ? q.ng : q.nb;
        if (!['bluey', 'bingo'].includes(ch)) E.push(['changed', J(ch) + ' for ' + kind]);
        else if (!(chN === q.n + (kind === 'add' ? 1 : -1) && other === q.n && chN >= 1)) E.push(['change', kind + ' on ' + ch + ': rows ' + q.nb + '/' + q.ng + ' n=' + q.n]);
      }
    },
    /* B4 top up. DESIGN: difference bag 0/1/2 (L3 0-3); Bluey L1 2-3, L2 3-5, L3 4-7; b = a - d >= 0 (Bingo may have
       none); a plate shows at most 8 cookies (4x2 spots). L1-2 pour from the jar (at most 5 -> d+1 <= 5);
       L3 pick one of three bags holding 0-3 cookies. */
    B4(q, lv, kind, E) {
      const dr = lv === 3 ? [0, 3] : [0, 2], ar = L({ 1: [2, 3], 2: [3, 5], 3: [4, 7] }, lv);
      if (!inR(q.d, dr[0], dr[1])) E.push(['d-range', 'd=' + q.d + ' not in ' + J(dr)]);
      if (!inR(q.a, ar[0], ar[1])) E.push(['a-range', 'a=' + q.a + ' not in ' + J(ar)]);
      if (!(q.b === q.a - q.d && q.b >= 0)) E.push(['b', 'b=' + q.b + ' for a=' + q.a + ' d=' + q.d]);
      if (q.answer !== q.d) E.push(['answer', 'answer ' + q.answer + ' != d ' + q.d]);
      if (q.a > 8) E.push(['plate', 'a=' + q.a + ' cookies but a plate has 8 spots']);
      if (lv <= 2) {
        if (q.opts != null) E.push(['cards', 'pour levels have no bags']);
        if (!(q.d + 1 <= 5)) E.push(['unsolvable', 'the jar pours at most 5, d=' + q.d]);
      } else {
        if (J(q.bags) !== J(q.opts)) E.push(['bags', 'bags ' + J(q.bags) + ' != opts ' + J(q.opts)]);
        if (!(Array.isArray(q.opts) && q.opts.length === 3 && uniq(q.opts) && q.opts.every(v => inR(v, 0, 3)) && q.opts.includes(q.d))) E.push(['bags-range', 'bags ' + J(q.opts) + ' must be 3 distinct of 0..3 containing d=' + q.d]);
      }
    },
    /* H1 ordinal. DESIGN: L1 3 gourds k 1-3 root left; L2 4-5 k 2-4 root left; L3 5-6 k 2-5 root random;
       L4 7 k 3-7 root random; target k <= n. */
    H1(q, lv, kind, E) {
      const nr = L({ 1: [3, 3], 2: [4, 5], 3: [5, 6], 4: [7, 7] }, lv), kr = L({ 1: [1, 3], 2: [2, 4], 3: [2, 5], 4: [3, 7] }, lv);
      if (!inR(q.n, nr[0], nr[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(nr)]);
      if (!inR(q.target, kr[0], kr[1]) || q.target > q.n) E.push(['target', 'k=' + q.target + ' not in ' + J(kr) + ' or > n=' + q.n]);
      if (q.answer !== q.target) E.push(['answer', 'answer ' + q.answer + ' != k ' + q.target]);
      if (lv <= 2 ? q.rootLeft !== true : typeof q.rootLeft !== 'boolean') E.push(['root', 'rootLeft ' + J(q.rootLeft)]);
    },
    /* H2 "the k-th" vs "k of them". DESIGN: L1 3-4 brothers k 1-3; L2 5, k 2-4; L3 6-7, k 2-5; L4 7, ordinal k 4-7,
       cardinal k 2-3; k <= n. 'ord' answer = the brother standing k-th, 'card' answer = k. */
    H2(q, lv, kind, E) {
      const nr = L({ 1: [3, 4], 2: [5, 5], 3: [6, 7], 4: [7, 7] }, lv);
      const kr = L(kind === 'ord' ? { 1: [1, 3], 2: [2, 4], 3: [2, 5], 4: [4, 7] } : { 1: [1, 3], 2: [2, 4], 3: [2, 5], 4: [2, 3] }, lv);
      if (!inR(q.n, nr[0], nr[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(nr)]);
      if (!inR(q.target, kr[0], kr[1]) || q.target > q.n) E.push(['target', 'k=' + q.target + ' not in ' + J(kr) + ' or > n=' + q.n]);
      if (!(Array.isArray(q.order) && q.order.length === q.n && uniq(q.order) && q.order.every(b => BRO.includes(b)))) E.push(['order', J(q.order)]);
      const want = kind === 'ord' ? (q.order || [])[q.target - 1] : q.target;
      if (q.answer !== want) E.push(['answer', J(q.answer) + ' != ' + J(want)]);
      if (typeof q.startLeft !== 'boolean') E.push(['side', J(q.startLeft)]);
    },
    /* H3 self split. DESIGN: L1 N=3, L2 4-5, L3 5-6, L4 7 (distinct brothers). The child decides the split (at least
       one on each side), so the answer (how many in the cave) is null until then; every split 1..N-1 must get
       valid cards (numOptions(inCave, 1, 7)) that the game judges with exactly one right card. */
    H3(q, lv, kind, E, W, ctx) {
      const nr = L({ 1: [3, 3], 2: [4, 5], 3: [5, 6], 4: [7, 7] }, lv);
      if (!inR(q.N, nr[0], nr[1])) E.push(['N-range', 'N=' + q.N + ' not in ' + J(nr)]);
      if (!(Array.isArray(q.order) && q.order.length === q.N && uniq(q.order) && q.order.every(b => BRO.includes(b)))) E.push(['order', J(q.order)]);
      if (q.answer !== null) E.push(['answer', 'must stay null until the split: ' + J(q.answer)]);
      for (let s = 1; s < q.N; s++) {
        const G2 = ctx.scratch(), opts = numOptions(G2, s, 1, 7);
        numOpt(E, opts, s, 1, 7, 'split-cards');
        const st = { q: Object.assign({}, q, { answer: s, opts }), level: lv, kind, G: G2 };
        if (GAMES.H3.evaluate(st, s) !== true || opts.some(o => o !== s && GAMES.H3.evaluate(st, o))) E.push(['split-judge', 'split ' + s + ' cards ' + J(opts)]);
      }
    },
    /* H4 hidden part. DESIGN: L1 N=3 take 1-2; L2 4-5 take 1-3; L3 5-7 take 2-4; L4 8-10 take 2-5; hidden < N;
       all N gems then the N-took left on cells of a 5x2 grid. */
    H4(q, lv, kind, E) {
      const nr = L({ 1: [3, 3], 2: [4, 5], 3: [5, 7], 4: [8, 10] }, lv), tr = L({ 1: [1, 2], 2: [1, 3], 3: [2, 4], 4: [2, 5] }, lv);
      if (!inR(q.N, nr[0], nr[1])) E.push(['N-range', 'N=' + q.N + ' not in ' + J(nr)]);
      if (!inR(q.took, tr[0], tr[1]) || q.took >= q.N) E.push(['took', 'took ' + q.took + ' not in ' + J(tr) + ' or >= N ' + q.N]);
      if (q.answer !== q.took) E.push(['answer', 'answer ' + q.answer + ' != took ' + q.took]);
      if (!pts01(q.pts, q.N) || !pts01(q.pts2, q.N - q.took)) E.push(['cells', 'gem cells ' + (q.pts || []).length + '/' + (q.pts2 || []).length + ' for N ' + q.N + ' took ' + q.took]);
      numOpt(E, q.opts, q.took, 0, 8);                          /* "none taken" is a fair distractor */
    },
    /* A1 two missions. DESIGN: L1 n=3, L2 4-5, L3 5-6, L4 6 with a 2-4; a, b >= 1, a+b = n, distinct pups.
       'split2' (L1-2): the child dispatches both teams, judged "a,b" (answer null, no cards);
       'rest' (L3+): predict b on cards (numOptions 1..6). */
    A1(q, lv, kind, E) {
      const nr = L({ 1: [3, 3], 2: [4, 5], 3: [5, 6], 4: [6, 6] }, lv);
      if (!inR(q.n, nr[0], nr[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(nr)]);
      if (!(inR(q.a, 1, q.n - 1) && inR(q.b, 1, q.n - 1) && q.a + q.b === q.n)) E.push(['parts', 'a ' + q.a + ' + b ' + q.b + ' vs n ' + q.n + ' (both parts >= 1)']);
      if (lv === 4 && !inR(q.a, 2, 4)) E.push(['a-range', 'L4 a=' + q.a + ' not in 2..4']);
      if (!(Array.isArray(q.team) && q.team.length === q.n && uniq(q.team) && q.team.every(p => PUPS.includes(p)))) E.push(['team', J(q.team)]);
      if (lv <= 2) { if (q.answer !== null || q.opts !== null) E.push(['answer', 'split2 is judged "a,b": answer ' + J(q.answer) + ' opts ' + J(q.opts)]); }
      else { if (q.answer !== q.b) E.push(['answer', 'answer ' + q.answer + ' != b ' + q.b]); numOpt(E, q.opts, q.b, 0, 7); }
    },
    /* A2 two vehicles, one pen. Generator/DESIGN (R4-J01): L1 'along' a 1-2, total <= 3; L2 total 3-4; L3 total 4-5
       with any split (never "always five"; whistle + <=5 touches + answer <= 7); L4 'on': a = 5 on the bench + b 1-2; a, b >= 1; two different
       animals; L1-3 the animals stand on pen cells (3x2 grid), L4 uses the bench (pts unused). */
    A2(q, lv, kind, E) {
      const n = q.a + q.b;
      if (!(inR(q.a, 1, 5) && inR(q.b, 1, 4))) E.push(['parts', 'a ' + q.a + ' b ' + q.b]);
      if (q.n !== n || q.answer !== n) E.push(['answer', 'n ' + q.n + ' answer ' + q.answer + ' != a+b ' + n]);
      const ok = lv === 1 ? inR(q.a, 1, 2) && n <= 3 : lv === 2 ? inR(n, 3, 4) : lv === 3 ? inR(n, 4, 5) : q.a === 5 && inR(q.b, 1, 2);
      if (!ok) E.push(['level-shape', 'L' + lv + ' a=' + q.a + ' b=' + q.b]);
      if (!VEH.some(v => J(v) === J(q.pair))) E.push(['vehicles', J(q.pair)]);
      if (!(ANIMALS.includes(q.animal) && ANIMALS.includes(q.animal2) && q.animal !== q.animal2)) E.push(['animals', q.animal + '/' + q.animal2]);
      if (lv <= 3 && !pts01(q.pts, n)) E.push(['cells', 'pen cells ' + (q.pts || []).length + ' for ' + n + ' animals']);
      numOpt(E, q.opts, n, 1, 9);
    },
    /* A3 elevator: successor / predecessor. DESIGN: result always 1-10; L1 k 1-3 +1; L2 k 2-6 +-1; L3 k 3-8 +-1, +2;
       L4 k 4-8 +-1, +-2 (d in {1,2}); 'minus' result >= 1; two distinct pups, d of them move. */
    A3(q, lv, kind, E) {
      const kr = L({ 1: [1, 3], 2: [2, 6], 3: [3, 8], 4: [4, 8] }, lv);
      if (!inR(q.n0, kr[0], kr[1])) E.push(['k-range', 'k=' + q.n0 + ' not in ' + J(kr)]);
      if (!(q.d === 1 || (q.d === 2 && (lv === 4 || (lv === 3 && kind === 'plus'))))) E.push(['d', 'd=' + q.d + ' for ' + kind + ' at L' + lv]);
      const res = kind === 'plus' ? q.n0 + q.d : q.n0 - q.d;
      if (q.answer !== res || !inR(res, 1, 10)) E.push(['result', 'answer ' + q.answer + ' for k ' + q.n0 + ' ' + kind + ' ' + q.d + ' (must be k+-d within 1..10)']);
      if (!(Array.isArray(q.who) && q.who.length === 2 && uniq(q.who) && q.who.every(p => PUPS.includes(p)) && q.d <= q.who.length)) E.push(['who', J(q.who)]);
      numOpt(E, q.opts, q.answer, 0, 12);           /* A3: an empty lift is a fair distractor */
    },
    /* A4 count on. DESIGN: L1 k 1-2 + 1; L2 k 2-4 + 1-2; L3 k 4-6 + 2-3; L4 k 5-7 + 2-3; total <= 10. */
    A4(q, lv, kind, E) {
      const kr = L({ 1: [1, 2], 2: [2, 4], 3: [4, 6], 4: [5, 7] }, lv), mr = L({ 1: [1, 1], 2: [1, 2], 3: [2, 3], 4: [2, 3] }, lv);
      if (!inR(q.k0, kr[0], kr[1]) || !inR(q.m, mr[0], mr[1])) E.push(['range', 'k ' + q.k0 + ' m ' + q.m + ' vs ' + J(kr) + '/' + J(mr)]);
      if (q.answer !== q.k0 + q.m || !(q.answer <= 10)) E.push(['answer', 'answer ' + q.answer + ' for ' + q.k0 + '+' + q.m]);
      numOpt(E, q.opts, q.answer, 1, 12);           /* A4: room above 10 for balanced ranks */
    },
    /* X1 golden staff: grow from k to N = k + d. DESIGN: L1 k 1-2 d 1-2; L2 k 2-4 d 1-3; L3 k 3-6 d 2-3 (grow() clamps
       the staff to [k, min(10, k+6)] -> N must be reachable); L4 k 5-7, target 8-10, pick one of three growth
       bars of length 1-4 (the answer is d; the generator itself maps d=4 to bars [4,2,3] to stay within 1-4). */
    X1(q, lv, kind, E) {
      const kr = L({ 1: [1, 2], 2: [2, 4], 3: [3, 6], 4: [5, 7] }, lv);
      if (!inR(q.k0, kr[0], kr[1])) E.push(['k-range', 'k=' + q.k0 + ' not in ' + J(kr)]);
      if (q.N !== q.k0 + q.d || !(q.d >= 1)) E.push(['N', 'N ' + q.N + ' != k ' + q.k0 + ' + d ' + q.d]);
      if (lv <= 3) {
        const dr = L({ 1: [1, 2], 2: [1, 3], 3: [2, 3] }, lv);
        if (!inR(q.d, dr[0], dr[1])) E.push(['d-range', 'd=' + q.d + ' not in ' + J(dr)]);
        if (q.answer !== q.N) E.push(['answer', 'answer ' + q.answer + ' != N ' + q.N]);
        if (q.opts != null) E.push(['cards', 'L1-3 builds the staff, no bars']);
        if (!(q.N <= Math.min(10, q.k0 + 6))) E.push(['unsolvable', 'target ' + q.N + ' beyond the staff limit ' + Math.min(10, q.k0 + 6)]);
      } else {
        if (!inR(q.N, 8, 10)) E.push(['N-range', 'L4 target ' + q.N + ' not in 8..10']);
        if (q.answer !== q.d) E.push(['answer', 'answer ' + q.answer + ' != d ' + q.d]);
        if (J(q.bars) !== J(q.opts)) E.push(['bars', 'bars ' + J(q.bars) + ' != opts ' + J(q.opts)]);
        if (!(Array.isArray(q.opts) && q.opts.length === 3 && uniq(q.opts) && q.opts.includes(q.d))) E.push(['bars', J(q.opts)]);
        else if (!q.opts.every(v => inR(v, 1, 6)) || !inR(q.d, 1, 4)) E.push(['bar-length', 'bars ' + J(q.opts) + ' (k=' + q.k0 + ', d=' + q.d + ') outside 1..6 or the right piece outside 1..4']);
      }
    },
    /* X2 somersault cloud: land on a + m. DESIGN: L1 a 1-3 m 1-2 on clouds 1-5; L2 a 2-6 m 1-3; L3 a 3-7 m 2-3;
       L4 a 4-7 m 2-3 on clouds 1-10; a + m <= max clouds (a may be lowered to max - m). */
    X2(q, lv, kind, E) {
      const ar = L({ 1: [1, 3], 2: [2, 6], 3: [3, 7], 4: [4, 7] }, lv), mr = L({ 1: [1, 2], 2: [1, 3], 3: [2, 3], 4: [2, 3] }, lv);
      if (q.max !== (lv === 1 ? 5 : 10)) E.push(['clouds', 'max ' + q.max]);
      if (!(inR(q.a, ar[0], ar[1]) || (q.a === q.max - q.m && q.a >= 1)) || !inR(q.m, mr[0], mr[1])) E.push(['range', 'a ' + q.a + ' m ' + q.m + ' vs ' + J(ar) + '/' + J(mr)]);
      if (q.answer !== q.a + q.m || !(q.answer <= q.max)) E.push(['landing', 'a ' + q.a + ' + m ' + q.m + ' = ' + q.answer + ' vs ' + q.max + ' clouds']);
    },
    /* X3 fill the basket: need = cap - a. DESIGN: L1 'five' five-frame a 1-4; L2+ 'ten' ten-frame a 5-9 (L2 top row
       first, L3 scattered holes, L4 loose peaches); three branches with 1-5 peaches, the right one always there. */
    X3(q, lv, kind, E) {
      const cap = lv === 1 ? 5 : 10, ar = lv === 1 ? [1, 4] : [5, 9];
      if (q.cap !== cap) E.push(['cap', 'cap ' + q.cap + ' != ' + cap]);
      if (!inR(q.a, ar[0], ar[1])) E.push(['a-range', 'a=' + q.a + ' not in ' + J(ar)]);
      if (q.need !== q.cap - q.a || !inR(q.need, 1, 5) || q.answer !== q.need) E.push(['need', 'need ' + q.need + ' answer ' + q.answer + ' for cap ' + q.cap + ' a ' + q.a]);
      if (!(Array.isArray(q.opts) && q.opts.length === 3 && uniq(q.opts) && q.opts.every(v => inR(v, 0, 7)) && q.opts.includes(q.need) && inR(q.need, 1, 5))) E.push(['branches', 'branches ' + J(q.opts) + ' must be 3 distinct of 0..7 incl. need 1..5 ' + q.need]);
      const h = q.holes;
      if (!(Array.isArray(h) && h.length === q.a && uniq(h) && h.every(x => inR(x, 0, q.cap - 1)))) E.push(['holes', J(h) + ' for a=' + q.a]);
      else if (lv !== 3 && !h.every((x, i) => x === i)) E.push(['holes', 'L' + lv + ' fills the top row first: ' + J(h)]);
      if (q.loose !== (lv >= 4)) E.push(['loose', J(q.loose)]);
    },
    /* X4 clones behind the water curtain. DESIGN: L1 N 4-5 hide 1-3; L2 N 6-7 hide 1-3; L3 N=10 hide 2-5;
       L4 N=10 hide 3-7. The reveal frame has exactly N cells (N != 10 below L3); hidden h < N; the visible N-h
       stand on cells of a 5x2 grid. */
    X4(q, lv, kind, E) {
      const nr = L({ 1: [4, 5], 2: [6, 7], 3: [10, 10], 4: [10, 10] }, lv), hr = L({ 1: [1, 3], 2: [1, 3], 3: [2, 5], 4: [3, 7] }, lv);
      if (!inR(q.N, nr[0], nr[1])) E.push(['N-range', 'N=' + q.N + ' not in ' + J(nr)]);
      if (!inR(q.h, hr[0], hr[1]) || q.h >= q.N) E.push(['hidden', 'h=' + q.h + ' not in ' + J(hr) + ' or >= N ' + q.N]);
      if (q.answer !== q.h) E.push(['answer', 'answer ' + q.answer + ' != h ' + q.h]);
      if (!pts01(q.pts, q.N - q.h)) E.push(['cells', 'visible clone cells ' + (q.pts || []).length + ' != N-h ' + (q.N - q.h)]);
      numOpt(E, q.opts, q.h, 0, 9);
    },
    /* V1 count on from the closed jet. DESIGN: L1 a 1-2 + b 1-2; L2 a 3-5 + 1-2; L3 a 4-6 + 2-3; L4 a 5-7 + 2;
       total <= 9: nine different heroes, nobody appears twice (portal b + inside a). */
    V1(q, lv, kind, E) {
      const ar = L({ 1: [1, 2], 2: [3, 5], 3: [4, 6], 4: [5, 7] }, lv), br = L({ 1: [1, 2], 2: [1, 2], 3: [2, 3], 4: [2, 2] }, lv);
      if (!inR(q.a, ar[0], ar[1]) || !inR(q.b, br[0], br[1])) E.push(['range', 'a ' + q.a + ' b ' + q.b + ' vs ' + J(ar) + '/' + J(br)]);
      if (q.answer !== q.a + q.b || !(q.answer <= 9)) E.push(['total', 'answer ' + q.answer + ' for ' + q.a + '+' + q.b]);
      const all = (q.portal || []).concat(q.inside || []);
      if (!((q.portal || []).length === q.b && (q.inside || []).length === q.a && uniq(all) && all.every(h => HEROES.includes(h)))) E.push(['heroes', 'portal ' + J(q.portal) + ' inside ' + J(q.inside)]);
      numOpt(E, q.opts, q.answer, 1, 11);
    },
    /* V2 tens and ones. DESIGN: L1 T 10-12, L2 10-15, L3 11-19, L4 10-20 (two crates = 20). 'build': the supply
       (L1 crate + 3 singles, L2 crate + 6 singles, L3 crate + packs 1-5, L4 two crates + packs 1-5) can make exactly T;
       'name': three cards 9..20 (numOptions); crates/ones is the place-value split of T. */
    V2(q, lv, kind, E) {
      const tr = L({ 1: [10, 12], 2: [10, 15], 3: [11, 19], 4: [10, 20] }, lv);
      if (!inR(q.T, tr[0], tr[1])) E.push(['T-range', 'T=' + q.T + ' not in ' + J(tr)]);
      if (q.answer !== q.T) E.push(['answer', 'answer ' + q.answer + ' != T ' + q.T]);
      if (q.crates !== (q.T >= 20 ? 2 : 1) || q.ones !== q.T - 10 * q.crates || !inR(q.ones, 0, 9)) E.push(['place-value', 'crates ' + q.crates + ' ones ' + q.ones + ' for T ' + q.T]);
      const s = q.supply || {}, want = lv <= 2 ? { crates: 1, singles: lv === 1 ? 3 : 6, packs: [] } : { crates: lv >= 4 ? 2 : 1, singles: 0, packs: [1, 2, 3, 4, 5] };
      if (J(s) !== J(want)) E.push(['supply', J(s) + ' != ' + J(want)]);
      if (kind === 'build') {
        if (q.opts != null) E.push(['cards', 'build has no cards']);
        const pieces = [].concat(Array(s.crates || 0).fill(10), Array(s.singles || 0).fill(1), s.packs || []);
        if (!sums(pieces).has(q.T)) E.push(['unsolvable', 'supply ' + J(pieces) + ' cannot make T=' + q.T]);
      } else numOpt(E, q.opts, q.T, 8, 22);
    },
    /* V3 make ten first. DESIGN: L1 a 8-9 b 2-3; L2 a 7-9 b 3-4; L3 a 6-9 b 4-6; L4 a 5-9 b 6-9. answer = need = 10-a,
       which must fit into the bar b (need <= b); three piece cards containing need.
       every piece can be cut from the bar (v <= b) - a longer one would be an impossible distractor (FAIL);
       WARN: T = 10 (nothing left for the second gauge, the reveal line becomes "十和零，十！"). */
    V3(q, lv, kind, E, W) {
      const ar = L({ 1: [7, 9], 2: [6, 9], 3: [6, 9], 4: [5, 9] }, lv), br = L({ 1: [2, 5], 2: [3, 6], 3: [4, 6], 4: [6, 9] }, lv);
      if (!inR(q.a, ar[0], ar[1]) || !inR(q.b, br[0], br[1])) E.push(['range', 'a ' + q.a + ' b ' + q.b + ' vs ' + J(ar) + '/' + J(br)]);
      if (kind === 'sum10') {                 /* the child pours both parts, then names the total: ten and some */
        if (q.answer !== q.a + q.b || q.T !== q.a + q.b || q.need !== 10 - q.a || !(q.need <= q.b)) E.push(['sum', 'answer ' + q.answer + ' T ' + q.T + ' need ' + q.need + ' for a ' + q.a + ' b ' + q.b]);
        numOpt(E, q.opts, q.T, 10, 20);
        return;
      }
      if (q.need !== 10 - q.a || q.answer !== q.need || q.T !== q.a + q.b) E.push(['need', 'need ' + q.need + ' answer ' + q.answer + ' T ' + q.T + ' for a ' + q.a + ' b ' + q.b]);
      if (!(q.need <= q.b)) E.push(['unsolvable', 'need ' + q.need + ' > bar ' + q.b]);
      if (!(Array.isArray(q.opts) && q.opts.length === 3 && uniq(q.opts) && q.opts.every(v => inR(v, 1, 9)) && q.opts.includes(q.need))) E.push(['pieces', J(q.opts) + ' for need ' + q.need]);
      else if (q.opts.some(v => v > q.b)) E.push(['piece-longer-than-bar', 'piece ' + Math.max.apply(null, q.opts) + ' > bar b=' + q.b + ' (a=' + q.a + ', need ' + q.need + ', pieces ' + J(q.opts) + ')']);
      if (q.T === 10) W.push(['T=10', 'a ' + q.a + ' + b ' + q.b + ' = 10: nothing left for gauge 2, reveal says "十和零，十！"']);
    },
    /* V4 numeral <-> quantity. DESIGN: n L1 1-3, L2 3-6, L3 5-10, L4 10-19. 'n2q': L1-2 n+3 single crystals, L3 bundles
       1-5, L4 a ten-bundle + bundles 1-5 -> the supply can make n; 'q2n': three target numerals (numOptions 1..20). */
    V4(q, lv, kind, E) {
      const nr = L({ 1: [1, 3], 2: [3, 6], 3: [5, 10], 4: [10, 19] }, lv);
      if (!inR(q.n, nr[0], nr[1])) E.push(['n-range', 'n=' + q.n + ' not in ' + J(nr)]);
      if (q.answer !== q.n) E.push(['answer', 'answer ' + q.answer + ' != n ' + q.n]);
      const s = q.supply || {}, want = lv <= 2 ? { singles: q.n + 3, bundles: [], ten: 0 } : { singles: 0, bundles: [1, 2, 3, 4, 5], ten: lv >= 4 ? 1 : 0 };
      if (J(s) !== J(want)) E.push(['supply', J(s) + ' != ' + J(want)]);
      if (kind === 'n2q') {
        if (q.opts != null) E.push(['cards', 'n2q has no cards']);
        const pieces = [].concat(Array(s.singles || 0).fill(1), s.bundles || [], s.ten ? [10] : []);
        if (!sums(pieces).has(q.n)) E.push(['unsolvable', 'supply ' + J(pieces) + ' cannot make n=' + q.n]);
      } else numOpt(E, q.opts, q.n, 0, 20);
    },
  };

  /* ---------------------------------------------------------------- the submission a right play produces, and wrong ones */
  function subs(g, q, lv, kind) {
    if (g === 'H3') return null;                                   /* simulated per split inside INV.H3 */
    if (g === 'P2') { const ones = Array(q.n).fill(1); return { right: ones, wrongs: [[0].concat(ones.slice(1)), [2].concat(ones.slice(1))] }; }
    if (g === 'H2' && kind === 'ord') { const o = q.order || [], k = q.target; const w = [o[k < q.n ? k : k - 2], '-']; if (k > 1) w.push(o.slice(0, k).join(',')); return { right: o[k - 1], wrongs: w }; }
    if (g === 'A1' && lv <= 2) { const right = q.a + ',' + q.b; return { right, wrongs: [q.n + ',0', (q.a + 1) + ',' + (q.b - 1), q.b + ',' + q.a].filter(x => x !== right) }; }
    const right = q.answer;
    let wrongs;
    if (Array.isArray(q.opts)) wrongs = q.opts.filter(o => o !== right);
    else if (typeof right === 'number') wrongs = [right + 1, right - 1];
    else wrongs = ['bluey', 'bingo', 'same'].filter(x => x !== right);
    return { right, wrongs };
  }

  function check(g, q, lv, kind, G, ctx) {
    const E = [], W = [], game = GAMES[g];
    if (!q || typeof q !== 'object') { E.push(['q', 'gen returned ' + J(q)]); return { E, W }; }
    /* common: a key, JSON-able, the kind it was asked for, a defined answer */
    if (q.k === undefined) E.push(['key', 'q.k undefined']);
    try { game.key(q); JSON.stringify(q); } catch (e) { E.push(['json', String(e)]); }
    if ('kind' in q && q.kind !== kind) E.push(['kind', 'q.kind ' + J(q.kind) + ' != asked ' + kind]);
    const open = g === 'H3' || (g === 'A1' && lv <= 2);
    if (!open && (q.answer === undefined || q.answer === null || (typeof q.answer === 'number' && !Number.isInteger(q.answer)))) E.push(['answer-defined', 'answer ' + J(q.answer)]);
    /* cards: exactly 3 distinct integers 0..20 (UI.dots draws up to 20) containing the answer */
    if (q.opts != null) {
      const o = q.opts;
      if (!Array.isArray(o) || o.length !== 3) E.push(['cards-3', 'opts ' + J(o)]);
      else {
        if (!uniq(o)) E.push(['cards-distinct', 'opts ' + J(o)]);
        if (!o.every(v => inR(v, 0, 22))) E.push(['cards-int', 'opts ' + J(o) + ' must be integers 0..22']);
        if (!o.includes(q.answer)) E.push(['cards-answer', 'answer ' + J(q.answer) + ' not among ' + J(o)]);
      }
    }
    try { INV[g](q, lv, kind, E, W, ctx); } catch (e) { E.push(['invariant-threw', String((e && e.stack) || e).slice(0, 240)]); }
    /* the game's own judge: the right submission passes, every other card / a near miss fails */
    try {
      const sb = subs(g, q, lv, kind);
      if (sb) {
        const st = { q, level: lv, kind, G, game };
        const ok = game.evaluate(st, sb.right);
        if (ok !== true) E.push(['judge-right', 'evaluate(' + J(sb.right) + ') = ' + J(ok)]);
        sb.wrongs.forEach(w => { if (game.evaluate(st, w)) E.push(['judge-wrong', 'wrong submission ' + J(w) + ' is judged right (right: ' + J(sb.right) + ')']); });
      }
    } catch (e) { E.push(['judge-threw', String((e && e.message) || e).slice(0, 200)]); }
    return { E, W };
  }

  function note(bucket, type, ex) { const b = bucket[type] || (bucket[type] = { count: 0, ex: [] }); b.count++; if (b.ex.length < 3) b.ex.push(ex); }

  /* ---------------------------------------------------------------- one game x level */
  function runLevel(g, lv, cfg) {
    const game = GAMES[g], t0 = performance.now();
    const kinds = game.kinds(lv, mkG(g, lv, 1));
    const r = { g, lv, kinds, gens: 0, fail: {}, warn: {}, keys: {}, fp: 2166136261, fp40: 2166136261, sfp: 2166136261, sess: null, ms: 0 };
    const run = (G, kind, seed, i) => {
      let q;
      try { q = game.gen(G, { level: lv, kind, rng: G.rng }); }
      catch (e) { note(r.fail, 'gen-throws', { seed, kind, i, detail: String((e && e.message) || e) }); return null; }
      r.gens++;
      const { E, W } = check(g, q, lv, kind, G, { scratch: () => mkG(g, lv, (seed ^ 0x5bd1e995) >>> 0 || 7) });
      if (E.length || W.length) { const qs = J(q); E.forEach(([t, d]) => note(r.fail, t, { seed, kind, i, detail: d, q: qs })); W.forEach(([t, d]) => note(r.warn, t, { seed, kind, i, detail: d, q: qs })); }
      return q;
    };
    /* pass 1 (exhaustive): every kind x every seed, each question from a fresh session (fresh bags) */
    for (const kind of kinds) {
      const keys = new Set();
      for (let s = 1; s <= cfg.seeds; s++) {
        const seed = mix(s), q = run(mkG(g, lv, seed), kind, seed, null);
        if (!q) continue;
        const key = safeKey(game, q), js = J(q);
        keys.add(key);
        r.fp = fnv(r.fp, js);
        if (s <= cfg.fpSeeds) r.fp40 = fnv(r.fp40, key);          /* cross-engine fingerprint of the keys */
        if (s <= cfg.detSeeds) {                    /* same seed + fresh session -> the same question */
          const G2 = mkG(g, lv, seed); let q2 = null;
          try { q2 = game.gen(G2, { level: lv, kind, rng: G2.rng }); } catch (e) {}
          if (J(q2) !== js) note(r.fail, 'nondeterministic', { seed, kind, i: null, detail: 'second run: ' + J(q2).slice(0, 300), q: js });
        }
      }
      r.keys[kind] = keys.size;
    }
    /* pass 2 (balance): sessions exactly like Session.newQ - kind from the kind bag, bags live for the whole session,
       a question with the previous key is regenerated (up to 30 times, then accepted) */
    if (cfg.sessSeeds > 0) {
      const S = { nq: 0, nOpt: 0, pos: [0, 0, 0], rank: [0, 0, 0], sem: {}, semN: 0, side: [0, 0], misl: [0, 0], retries: 0, repeats: 0 };
      for (let s = 1; s <= cfg.sessSeeds; s++) {
        const seed = mix(100000 + s), G = mkG(g, lv, seed), ks = game.kinds(lv, G);
        for (let i = 0; i < cfg.sessLen; i++) {
          const kind = ks.length > 1 ? bagPick(G, 'kind' + lv, ks) : ks[0];
          let q = null, key = null;
          try { q = Session.genQ(G, lv, kind); } catch (e) { note(r.fail, 'throws', { seed, kind, i, detail: String(e && e.stack || e).slice(0, 300), q: null }); }
          if (!q) continue;
          key = safeKey(game, q);
          if (key === G.ws.lastKey) { S.repeats++; note(r.warn, 'repeat', { seed, kind, i, detail: 'session question ' + i + ' repeats the previous question after 30 regenerations: key ' + key, q: J(q) }); }
          G.ws.lastKey = key;
          r.sfp = fnv(r.sfp, key);
          S.nq++;
          if (Array.isArray(q.opts) && q.opts.length === 3 && q.opts.includes(q.answer)) {
            S.nOpt++;
            S.pos[q.opts.indexOf(q.answer)]++;
            S.rank[q.opts.slice().sort((a, b) => a - b).indexOf(q.answer)]++;
          }
          if (g === 'B1' || g === 'B3') { S.sem[q.answer] = (S.sem[q.answer] || 0) + 1; S.semN++; }
          if (g === 'B4') { S.sem['d=' + q.d] = (S.sem['d=' + q.d] || 0) + 1; S.semN++; }
          if (g === 'B1' && q.answer !== 'same') S.side[((q.answer === 'bluey') === q.blueyLeft) ? 0 : 1]++;
          if (g === 'B3' && kind !== 'same') { S.misl[1]++; if (q.answer !== 'bingo') S.misl[0]++; }
        }
      }
      r.sess = S;
    }
    r.ms = Math.round(performance.now() - t0);
    return r;
  }

  /* ---------------------------------------------------------------- Session.probeFor (J01-b) */
  function probe(g) {
    const game = GAMES[g], W = game.world, out = [];
    const mk = (lv, round) => ({ world: W, id: g, game, ws: { level: lv, floor: 1, g: {}, win: [], hist: [], log: [], mastery: 0 }, level: lv, round, probed: false, bags: {}, rng: RNG(mix(77)), ev: [] });
    for (let lv = 1; lv <= MAXLV[W]; lv++) {
      const G = mk(lv, 1), lvKinds = game.kinds(lv, G), miss = (REQUIRED[g] || []).filter(k => !lvKinds.includes(k));
      const o = { lv, lvKinds, miss, pr: null, pr2: null, probed: null, prKinds: null, genOk: null, r0: null, done: null, err: null };
      try {
        o.pr = Session.probeFor(G);
        o.probed = G.probed;
        o.pr2 = Session.probeFor(G);                                  /* once per session */
        if (o.pr) {
          o.prKinds = game.kinds(o.pr.level, G);
          const Gq = mkG(g, o.pr.level, mix(5)), q = game.gen(Gq, { level: o.pr.level, kind: o.pr.kind, rng: Gq.rng });
          o.genOk = !!q && check(g, q, o.pr.level, o.pr.kind, Gq, { scratch: () => mkG(g, o.pr.level, 9) }).E.length === 0;
        }
        o.r0 = Session.probeFor(mk(lv, 0));                           /* only in round 1 */
        const G3 = mk(lv, 1), gs = Mastery.gs(G3.ws, g);
        (REQUIRED[g] || []).forEach(k => { gs.k[Mastery.kindKey(k)] = 1; });
        o.done = Session.probeFor(G3);                                /* evidence already there -> no probe */
      } catch (e) { o.err = String((e && e.stack) || e).slice(0, 300); }
      out.push(o);
    }
    return out;
  }

  /* ---------------------------------------------------------------- registry facts */
  function meta() {
    const ids = Object.keys(GAMES).sort(), req = {};
    ids.forEach(g => {
      const game = GAMES[g], per = {}, all = new Set();
      for (let lv = 1; lv <= MAXLV[game.world]; lv++) { const ks = game.kinds(lv, mkG(g, lv, 1)); per[lv] = ks; (Array.isArray(ks) ? ks : []).forEach(k => all.add(k)); }
      req[g] = { world: game.world, kind0: game.kind0, required: REQUIRED[g] || null, per, missing: (REQUIRED[g] || []).filter(k => !all.has(k)) };
    });
    const worlds = {}; ORDER.forEach(w => { worlds[w] = { games: WORLDS[w].games, maxLv: MAXLV[w] }; });
    return { ids, req, worlds, requiredIds: Object.keys(REQUIRED).sort() };
  }

  /* ---------------------------------------------------------------- static voice lines */
  function voice() {
    const cjk = s => (String(s).match(/[㐀-䶿一-鿿]/g) || []).length, out = [];
    Object.keys(GAMES).sort().forEach(g => {
      const x = GAMES[g];
      out.push({ g, what: 'intro', text: x.intro, n: cjk(x.intro) });
      out.push({ g, what: 'verb', text: x.verb, n: cjk(x.verb) });
      (x.praise || []).forEach(p => out.push({ g, what: 'praise', text: p, n: cjk(p) }));
    });
    PRAISE.forEach(p => out.push({ g: '*', what: 'PRAISE', text: p, n: cjk(p) }));
    return out;
  }

  /* ---------------------------------------------------------------- self-test: the checks are not vacuous
     (a valid question is broken on purpose; check() must report one of the expected violation types) */
  function selftest() {
    const out = [];
    const T = (name, g, lv, kind, mutate, expect) => {
      for (let s = 1; s <= 300; s++) {
        const G = mkG(g, lv, mix(900 + s)), q = GAMES[g].gen(G, { level: lv, kind, rng: G.rng });
        const m = JSON.parse(JSON.stringify(q));
        if (mutate(m) === false) continue;                     /* not applicable to this seed */
        const got = check(g, m, lv, kind, G, { scratch: () => mkG(g, lv, 3) }).E.map(e => e[0]);
        const clean = check(g, q, lv, kind, mkG(g, lv, mix(900 + s)), { scratch: () => mkG(g, lv, 3) }).E.length === 0;
        out.push({ name, g, lv, kind, expect, got, ok: expect.some(t => got.includes(t)), clean });
        return;
      }
      out.push({ name, g, lv, kind, expect, got: ['(no applicable seed)'], ok: false, clean: true });
    };
    T('a splat is missing', 'P1', 2, 'sub', q => { q.pts.pop(); }, ['splats']);
    T('two equal cards', 'P1', 2, 'sub', q => { q.opts = [q.n, q.n, q.n + 1]; }, ['cards-distinct']);
    T('only 2 cards', 'P3', 2, 'card', q => { q.opts = q.opts.filter(v => v !== q.n).slice(0, 1).concat([q.n]); }, ['cards-3']);
    T('no spare pair of boots', 'P2', 1, 'pair', q => { q.rack = q.n; q.colors = q.colors.slice(0, q.n); }, ['rack', 'supply']);
    T('candle box holds exactly N', 'P4', 3, 'giveN', q => { q.supply = q.N; }, ['supply', 'spare', 'unsolvable']);
    T("'same' with unequal plates", 'B1', 2, 'same', q => { q.nb = q.nl + 1; q.posB = q.posA.concat([[0.5, 0.5]]); }, ['same-unequal']);
    T("'more' answers the smaller plate", 'B1', 2, 'more', q => { q.answer = q.answer === 'bluey' ? 'bingo' : 'bluey'; }, ['answer']);
    T('bigger item on the side with more', 'B1', 2, 'less', q => { if (q.itemL === q.itemB) return false; const t = q.itemL; q.itemL = q.itemB; q.itemB = t; }, ['items']);
    T('9 things but the jar has 8 coins', 'B2', 2, 'match', q => { q.n = 9; q.answer = 9; q.items = Array(9).fill('apple'); }, ['unsolvable', 'n-range']);
    T("'add' but the rows stay equal", 'B3', 2, 'add', q => { q.nb = q.ng = q.n; }, ['change', 'answer']);
    T('Bingo has -1 cookies', 'B4', 1, 'diff', q => { q.b = -1; }, ['b']);
    T('a bag with 7 cookies', 'B4', 3, 'diff', q => { q.opts = q.bags = [q.d, q.d + 4, q.d + 5]; }, ['bags-range']);
    T('8th gourd of 7', 'H1', 4, 'ord', q => { q.target = q.answer = 8; }, ['target']);
    T('ordinal answer is the wrong brother', 'H2', 2, 'ord', q => { q.answer = q.order[q.target % q.n]; }, ['answer']);
    T('brother missing from the team', 'H3', 2, 'selfsplit', q => { q.order.pop(); }, ['order']);
    T('Six took every gem', 'H4', 3, 'hidden', q => { q.took = q.answer = q.N; }, ['took']);
    T('an empty mission', 'A1', 1, 'split2', q => { q.a = 0; q.b = q.n; }, ['parts']);
    T('L3 total 6', 'A2', 3, 'all', q => { q.b = 6 - q.a; q.n = 6; q.answer = 6; }, ['level-shape']);
    T('elevator ends at 0', 'A3', 2, 'minus', q => { q.n0 = 1; q.answer = 0; }, ['result', 'k-range']);
    T('A4 total 12', 'A4', 4, 'on', q => { q.m = 5; q.answer = q.k0 + 5; }, ['range', 'answer']);
    T('staff target beyond k+6', 'X1', 3, 'target', q => { q.k0 = 3; q.d = 8; q.N = q.answer = 11; }, ['unsolvable', 'd-range']);
    T('growth bar of 7', 'X1', 4, 'target', q => { q.opts = q.bars = [q.d, 7, 8]; }, ['bar-length']);
    T('landing past the last cloud', 'X2', 1, 'line', q => { q.m = 5; q.answer = q.a + 5; }, ['landing', 'range']);
    T('no branch fills the basket', 'X3', 2, 'ten', q => { q.opts = [q.need + 1, q.need + 2, q.need + 3]; }, ['branches', 'cards-answer']);
    T('ten-frame below L3', 'X4', 1, 'hidden', q => { q.N = 10; }, ['N-range']);
    T('a hero twice', 'V1', 4, 'on', q => { q.inside[0] = q.portal[0]; }, ['heroes']);
    T('16 from a crate + 3 singles', 'V2', 1, 'build', q => { q.T = q.answer = 16; q.ones = 6; }, ['unsolvable', 'T-range']);
    T('name cards not consecutive', 'V2', 4, 'name', q => { q.opts = [q.T, q.T - 4, q.T - 5]; }, ['num-options']);
    T('bar shorter than need', 'V3', 2, 'split10', q => { q.b = q.need - 1; q.T = q.a + q.b; }, ['unsolvable', 'range']);
    T('no ten-bundle for 16-19', 'V4', 4, 'n2q', q => { if (q.n < 16) return false; q.supply.ten = 0; }, ['unsolvable']);
    T('question without a key', 'V4', 2, 'q2n', q => { delete q.k; }, ['key']);
    T('answer not among the cards', 'X4', 3, 'ten', q => { q.opts = q.opts.map(v => v + 3); }, ['cards-answer', 'num-options']);
    return out;
  }

  window.__GT = { runLevel, probe, meta, voice, selftest };
  return Object.keys(window.__GT);
}
"""


def judge(cnt, n, lo, hi):
    """share cnt/n against [lo, hi] with a 2.5-sigma sampling tolerance t at each bound:
    'fail' beyond a bound by more than t, 'warn' (borderline) within t of a bound on either side - so a share that
    is structurally exactly on the bound (e.g. 50 %) is reported the same way every run - 'ok' otherwise"""
    p = cnt / float(n)
    tl = 2.5 * math.sqrt(lo * (1 - lo) / n) if 0 < lo < 1 else 0.0
    th = 2.5 * math.sqrt(hi * (1 - hi) / n) if 0 < hi < 1 else 0.0
    if p < lo - tl or p > hi + th:
        return 'fail', p
    if (lo > 0 and p < lo + tl) or (hi < 1 and p > hi - th):
        return 'warn', p
    return 'ok', p


def emit(log, verdict, msg, recap):
    if verdict == 'ok':
        log.ok(msg)
    elif verdict == 'warn':
        log.warn(msg)
        recap.append('WARN ' + msg)
    else:
        log.fail(msg)
        recap.append('FAIL ' + msg)


def worst(vs):
    return 'fail' if 'fail' in vs else 'warn' if 'warn' in vs else 'ok'


def emit_share(log, verdict, msg, recap):
    """a balance line; a WARN here means a share lies within the sampling tolerance of a bound (borderline)"""
    if verdict == 'warn':
        msg += ' - BORDERLINE (a share lies within the 2.5-sigma sampling tolerance of a bound)'
    emit(log, verdict, msg, recap)


def fmt_ex(ex):
    s = 'seed %s' % ex.get('seed')
    if ex.get('i') is not None:
        s += ' (session q#%s)' % ex['i']
    s += ' kind=%s: %s' % (ex.get('kind'), ex.get('detail', ''))
    if ex.get('q'):
        q = ex['q']
        s += ' | q=' + (q if len(q) <= 700 else q[:700] + '...')
    return s


def pct(c, n):
    return '%.2f%%' % (100.0 * c / n) if n else '-'


def report_level(log, r, tag, recap):
    g, lv = r['g'], r['lv']
    head = '%s L%d %s' % (g, lv, tag)
    for t, b in sorted(r['fail'].items()):
        emit(log, 'fail', '%s [%s] %d violation(s); e.g. %s' % (head, t, b['count'], ' || '.join(fmt_ex(e) for e in b['ex'])), recap)
    if not r['fail']:
        log.ok('%s invariants: %d questions generated, kinds %s, distinct keys %s (%d ms)' % (head, r['gens'], r['kinds'], r['keys'], r['ms']))
    for t, b in sorted(r['warn'].items()):
        emit(log, 'warn', '%s [%s] %d case(s); e.g. %s' % (head, t, b['count'], ' || '.join(fmt_ex(e) for e in b['ex'][:2])), recap)
    for k, n in sorted(r['keys'].items()):
        if n <= 1:
            emit(log, 'warn', '%s kind %s: only %d distinct question over %d seeds - a retest after a mistake (and a repeated kind) '
                 'can never change the numbers; Session.newQ burns 30 gen() calls and then repeats it' % (head, k, n, SEEDS), recap)
    S = r['sess']
    if not S:
        return
    if S['nOpt']:
        n = S['nOpt']
        pv = [judge(c, n, 0.20, 0.47) for c in S['pos']]
        emit_share(log, worst([v for v, _ in pv]), '%s right-card POSITION 0/1/2 = %s over %d card questions (bound 20-47%%)'
             % (head, ' / '.join(pct(c, n) for c in S['pos']), n), recap)
        rv = [judge(c, n, 0.15, 0.50) for c in S['rank']]
        emit_share(log, worst([v for v, _ in rv]), '%s right-card RANK min/mid/max = %s over %d card questions (bound 15-50%%; DESIGN 1.4: '
             '"always the middle card" may win only ~1/3)' % (head, ' / '.join(pct(c, n) for c in S['rank']), n), recap)
    if g in ('B1', 'B3') and S['semN']:
        n = S['semN']
        cats = ['bluey', 'bingo', 'same']
        vs = [judge(S['sem'].get(c, 0), n, 0.20, 0.47)[0] for c in cats]
        emit_share(log, worst(vs), '%s semantic answers bluey/bingo/same = %s over %d questions (bound 20-47%%; DESIGN 1.4.3 semantic bag ~1/3 each%s)'
             % (head, ' / '.join(pct(S['sem'].get(c, 0), n) for c in cats), n,
                '; the "same" button always sits in the middle, so this is also the middle-button share' if g == 'B1' else '; fixed layout rows/button'), recap)
    if g == 'B1' and sum(S['side']):
        n = sum(S['side'])
        v, _ = judge(S['side'][0], n, 0.35, 0.65)
        emit_share(log, v, '%s more/less: the right plate is on the LEFT in %s of %d questions (bound 35-65%%)' % (head, pct(S['side'][0], n), n), recap)
    if g == 'B3' and S['misl'][1]:
        n = S['misl'][1]
        v, _ = judge(S['misl'][0], n, 0.50, 1.0)
        emit_share(log, v, '%s add/remove: the stretched row (Bingo) is NOT the bigger one in %s of %d questions (DESIGN: more than half)'
             % (head, pct(S['misl'][0], n), n), recap)
    if g == 'B4' and S['semN']:
        n = S['semN']
        keys = sorted(S['sem'])
        k = len(keys)
        vs = [judge(S['sem'][c], n, 0.6 / k, 1.4 / k)[0] for c in keys]
        emit_share(log, worst(vs), '%s difference bag %s over %d questions (each within 0.6/k..1.4/k of %d values)'
             % (head, ', '.join('%s %s' % (c, pct(S['sem'][c], n)) for c in keys), n, k), recap)


def check_meta(log, meta, recap):
    ids = meta['ids']
    want = sorted(g for w in meta['worlds'].values() for g in w['games'])
    emit(log, 'ok' if ids == want and len(ids) == 24 else 'fail', 'registry: %d games %s == WORLDS games' % (len(ids), ids), recap)
    emit(log, 'ok' if meta['requiredIds'] == ids else 'fail', 'REQUIRED has an entry for every game (%d)' % len(meta['requiredIds']), recap)
    for g in ids:
        m = meta['req'][g]
        good_world = g in meta['worlds'][m['world']]['games']
        per_ok = all(isinstance(ks, list) and ks for ks in m['per'].values())      # repeats allowed: a kind may be weighted (B1 L1)
        emit(log, 'ok' if good_world and per_ok else 'fail', '%s kinds per level %s (world %s)' % (g, m['per'], m['world']), recap)
        emit(log, 'ok' if m['required'] and not m['missing'] else 'fail',
             '%s every REQUIRED kind %s is asked at some level%s' % (g, m['required'], (' - NEVER asked: %s' % m['missing']) if m['missing'] else ''), recap)


def check_probe(log, g, rows, tag, recap):
    for o in rows:
        head = '%s L%d %s probeFor' % (g, o['lv'], tag)
        if o['err']:
            emit(log, 'fail', '%s threw: %s' % (head, o['err']), recap)
            continue
        bad = []
        if o['miss']:
            pr = o['pr']
            if not pr:
                bad.append('required %s missing at this level but no probe' % o['miss'])
            else:
                if pr.get('kind') not in o['miss']:
                    bad.append('probe kind %s is not a missing required kind %s' % (pr.get('kind'), o['miss']))
                if pr.get('kind') not in (o['prKinds'] or []):
                    bad.append('probe level %s does not ask %s (kinds %s)' % (pr.get('level'), pr.get('kind'), o['prKinds']))
                if not o['genOk']:
                    bad.append('probe question (L%s %s) is not valid' % (pr.get('level'), pr.get('kind')))
                if o['pr2'] is not None:
                    bad.append('a second probe in the same session: %s' % o['pr2'])
                if o['probed'] is not True:
                    bad.append('G.probed not set')
        elif o['pr'] is not None:
            bad.append('probe %s although this level asks every required kind' % o['pr'])
        if o['r0'] is not None:
            bad.append('probe outside round 1: %s' % o['r0'])
        if o['done'] is not None:
            bad.append('probe although every required kind already has evidence: %s' % o['done'])
        what = ('asks %s at L%s' % (o['pr']['kind'], o['pr']['level'])) if o['pr'] else 'no probe'
        emit(log, 'fail' if bad else 'ok', '%s: level kinds %s, missing required %s -> %s%s' % (head, o['lvKinds'], o['miss'], what, ('; ' + '; '.join(bad)) if bad else ''), recap)


def check_voice(log, lines, recap):
    long_ = [x for x in lines if x['n'] > 8]
    for x in long_:
        emit(log, 'warn', 'voice %s %s "%s" has %d CJK characters (> 8, DESIGN: every spoken line <= 8)' % (x['g'], x['what'], x['text'], x['n']), recap)
    log.ok('voice: %d static lines checked (intro / verb / praise of 24 games + PRAISE), %d over 8 CJK characters; longest %s'
           % (len(lines), len(long_), max(lines, key=lambda x: x['n'])['text'] if lines else '-'))


def run_engine(p, base, engine, seeds, sess_seeds, log, recap, ref=None):
    br = getattr(p, engine).launch()
    page = new_page(br, base, 1180, 820, fast=True)
    page.evaluate(JS_LIB)
    out = {}
    meta = page.evaluate('() => window.__GT.meta()')
    if ref is None:
        for c in page.evaluate('() => window.__GT.selftest()'):
            emit(log, 'ok' if c['ok'] and c['clean'] else 'fail', 'self-test %s L%d %s "%s": broken question reported as %s (expected one of %s)%s'
                 % (c['g'], c['lv'], c['kind'], c['name'], c['got'], c['expect'], '' if c['clean'] else ' - BUT the unbroken question was not clean'), recap)
        check_meta(log, meta, recap)
        check_voice(log, page.evaluate('() => window.__GT.voice()'), recap)
    ids = meta['ids']
    cfg = {'seeds': seeds, 'sessSeeds': sess_seeds, 'sessLen': SESS_LEN, 'detSeeds': 25 if ref is None else 5, 'fpSeeds': min(WEBKIT_SEEDS, SEEDS)}
    for digits in (True, False):
        page.evaluate('(d) => { Store.s.settings.digits = d; }', digits)
        dtag = 'digits=%s' % ('on' if digits else 'off')
        tag = '[%s %s]' % (engine, dtag)
        if ref is None:
            for g in ids:
                check_probe(log, g, page.evaluate('(g) => window.__GT.probe(g)', g), tag, recap)
        for g in ids:
            for lv in range(1, MAXLV[meta['req'][g]['world']] + 1):
                r = page.evaluate('([g, lv, cfg]) => window.__GT.runLevel(g, lv, cfg)', [g, lv, cfg])
                out[(digits, g, lv)] = r
                if ref is None:
                    base_r = out.get((True, g, lv)) if not digits else None
                    if base_r is not None and base_r['fp'] == r['fp'] and base_r['sfp'] == r['sfp'] and base_r['fail'].keys() == r['fail'].keys():
                        log.ok('%s L%d %s: identical questions to digits=on (%d generated; %d fail types, %d warn types as above)'
                               % (g, lv, tag, r['gens'], len(r['fail']), len(r['warn'])))
                    else:
                        report_level(log, r, tag, recap)
                else:
                    cr = ref.get((digits, g, lv))
                    head = '%s L%d %s' % (g, lv, tag)
                    new_fail = sorted(set(r['fail']) - set(cr['fail'] if cr else {}))
                    for t in new_fail:
                        b = r['fail'][t]
                        emit(log, 'fail', '%s [%s] %d violation(s) only on %s; e.g. %s' % (head, t, b['count'], engine, ' || '.join(fmt_ex(e) for e in b['ex'])), recap)
                    same_keys = cr is not None and cr['fp40'] == r['fp40']
                    emit(log, 'ok' if same_keys else 'warn', '%s: %d questions, invariant failures %s (same types as chromium: %s), question keys for seeds 1..%d %s chromium'
                         % (head, r['gens'], sorted(r['fail']) or 'none', 'yes' if not new_fail else 'NO', cfg['fpSeeds'], 'identical to' if same_keys else 'DIFFER from'), recap)
    br.close()
    return out


def main():
    log = Log('generators')
    recap = []
    t0 = time.time()
    log.w('generator gate: %d seeds per game x level x kind, %d simulated sessions x %d questions for balance, digits on/off; webkit %d seeds'
          % (SEEDS, SEEDS, SESS_LEN, WEBKIT_SEEDS))
    with sync_playwright() as p, serve() as base:
        ref = run_engine(p, base, 'chromium', SEEDS, SEEDS, log, recap)
        log.w('chromium pass done in %.1f s' % (time.time() - t0))
        run_engine(p, base, 'webkit', min(WEBKIT_SEEDS, SEEDS), 0, log, recap, ref=ref)
    log.w('---------------------------------------------------------------- RECAP (%d FAIL / WARN lines, %.1f s)' % (len(recap), time.time() - t0))
    for line in recap:
        log.w(line[:1200])
    ok = log.close()
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
