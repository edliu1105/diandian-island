# -*- coding: utf-8 -*-
"""World 4 (the stars, 10 以内加减): every game
  - gen: levels 1-5 x 300 seeds - an answer, the answer among the options, options all different, the key varies
  - right: difficulty 1-5 answered right (judged right, no error), landscape; 2 and 4 portrait
  - targets: every tap target of the question (st.map) on screen, on top, >= 88 CSS px - landscape and portrait, 1024x768
  - mouse: a real mouse click on the right answer (L1 and L5) submits it
  - wrong: answered wrong at every level: named, then the explain step (st.phase 'explain', st.explaining; the game's own
    explain(st, ans), no page error, the one he chose ringed blue and no longer ticked, the RIGHT one ringed gold, no praise,
    never "错"), then a
    NEW question of the same kind (each question counts by itself)
  - five options (the client, 2026-10-10, docs/OPTIONS-EXPLAIN-SPEC.md): every pick-one question has 5 options (or asks
    two at once - 一题两问 - from 3 cards), exactly one right (rightCount), the right one's place balanced over the five
    places (each place 10-30 % of 300 questions; 一题两问: each card that can be right 15-60 % in either place); the not-pick-one games
    (F3 build, N1 pick all, N2 pick two of >= 5, N4 fill, O2 walk >= 6 ways, a random walk on the right way <= 1/5) checked for their size
  - targets also clear of the friends, the top bar and the task card (__layoutReport)
and the progress: the stars open when the sky is all flagged and its rainbow castle has played; the sky's gate turns gold
("惊喜来啦！") and leads up ("飞到星空啦！"); one island and one game at a time; the star castle and the space party at the end.
usage: python tests/test_w4.py [chromium|webkit] [jobs=3]      W4_ONLY=F1,F2 to run some games only (no progress part)
       W4_TIMING=1: also the explain step in real time (no fast mode; every game at L3, the long ones at more levels): the
       explain phase <= 5.5 s; a tap 0.4 s in ends it within 1.6 s"""
import os, sys
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log

ENG = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
JOBS = int(sys.argv[2]) if len(sys.argv) > 2 else 3
KEY = "(() => { const st = Session.st; return st && st.q ? JSON.stringify(st.game.key(st.q)) : null; })()"
GEO = """() => { const st = Session.st, out = [], vw = innerWidth, vh = innerHeight;
  if (!st || !st.map) return ['no question'];
  for (const id in st.map) { const e = st.map[id]; if (!e || !e.isConnected) continue; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.left < -2 || r.top < -2 || r.right > vw + 2 || r.bottom > vh + 2) out.push(id + ' off screen');
    if (Math.min(r.width, r.height) < 88) out.push(id + ' ' + Math.round(Math.min(r.width, r.height)) + 'px');
    const pe = e.style.pointerEvents; e.style.pointerEvents = 'auto'; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); e.style.pointerEvents = pe;
    if (!(h === e || (h && e.contains(h)))) out.push(id + ' covered by ' + (h ? (h.className && h.className.baseVal === undefined ? h.className : h.tagName) : 'nothing')); }
  /* clear of the friends (their body: the middle of their box), the top bar and the task card */
  const R = window.__layoutReport(), cut = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const keep = R.actors.filter(a => !a.math).map(a => ({ id: 'actor ' + a.id, x: a.x + a.w * 0.2, y: a.y + a.h * 0.12, w: a.w * 0.6, h: a.h * 0.8 })).concat(R.hud.map(h => ({ id: 'hud ' + h.id, x: h.x, y: h.y, w: h.w, h: h.h })), R.math.filter(m => m.cls === 'task').map(m => ({ id: 'task card', x: m.x, y: m.y, w: m.w, h: m.h })));
  R.targets.forEach(t => keep.forEach(k => { if (cut(t, k) > 64) out.push(t.id + ' overlaps ' + k.id); }));
  return out; }"""
# the explain step: every world-4 rule's explain is wrapped once; what it did is kept in window.__xr
XWRAP = """() => {
  if (!window.__said) { window.__said = []; const vs = Voice.say.bind(Voice); Voice.say = (t, x) => { window.__said.push(t); return vs(t, x); }; }
  ORDER4.forEach(w => WORLDS[w].games.forEach(id => {
    const g = GAMES[id]; if (!g || g.__xw) return; g.__xw = true; const orig = g.explain;
    g.explain = async function (st, ans) {
      const rec = { id, level: st.level, gen: st.gen, phase: st.phase, explaining: !!st.explaining, own: !!orig, t0: performance.now(), s0: window.__said.length };
      window.__xr = rec;
      try { if (orig) await orig.call(this, st, ans); else await this.reveal(st); } catch (e) { rec.err = String((e && e.message) || e); throw e; }
      rec.ms = Math.round(performance.now() - rec.t0); rec.alive = Session.alive(st);
      rec.said = window.__said.slice(rec.s0);
      const rings = Array.from(document.querySelectorAll('#stage > .ringo')).filter(r => getComputedStyle(r).visibility !== 'hidden');
      const inside = (r, e) => { const a = r.getBoundingClientRect(), b = e.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; return x >= a.left - 3 && x <= a.right + 3 && y >= a.top - 3 && y <= a.bottom + 3; };
      const gold = rings.filter(r => getComputedStyle(r).borderTopColor === 'rgb(255, 201, 60)');
      const right = (this.rightEls ? this.rightEls(st, ans) : []) || [];
      rec.right = right.length; rec.rightOk = right.length > 0 && right.every(e => e && e.isConnected && gold.some(r => inside(r, e)));
      rec.chosen = (st.xb || []).length;
      /* review OX1: a wrong pick keeps no selection mark (tick, yellow) during the explain step - only the blue ring */
      const R = new Set(right); rec.marked = (st.xb || []).filter(e => e && !R.has(e) && (e.classList.contains('hi') || e.querySelector('.n4tick, .m3tick') || ['rgb(255, 229, 138)', 'rgb(255, 233, 168)'].includes(getComputedStyle(e).backgroundColor))).length;
      rec.bad = rec.said.filter(t => (this.praise || []).includes(t) || PRAISE.includes(t) || /错/.test(t));
      if (window.__xhold) await new Promise(r => { window.__xrel = r; });
    };
  }));
}"""
GEN = """(g) => { const R = GAMES[g], bad = [], NON = { F3: 'build', N1: 'pick all', N2: 'pick two', N4: 'fill', O2: 'walk' }, LINE = { I8: 1 }; let keys = 0; const kinds = {};
  for (let lv = 1; lv <= 5; lv++) { const G = { world: R.world, W: WORLDS[R.world], rng: RNG(lv * 13 + 3), bags: {}, ws: Store.w(R.world), level: lv }, seen = new Set(), pos = [0, 0, 0, 0, 0], pos2 = [[0, 0, 0], [0, 0, 0]]; let n5 = 0, n2 = 0;
    for (let i = 0; i < 300; i++) { let qq; try { qq = R.gen(G, { level: lv, rng: G.rng }); } catch (e) { bad.push('L' + lv + ' throws ' + e.message); break; }
      if (!qq || qq.answer === undefined || qq.answer === null) { bad.push('L' + lv + ' no answer'); break; }
      const o = qq.opts, J = x => JSON.stringify(x);
      if (NON[g]) { kinds[NON[g]] = 1;
        if (g === 'N1' && qq.cards.length < 5) bad.push('L' + lv + ' N1 only ' + qq.cards.length + ' cards');
        if (g === 'N2' && qq.vals.length < 5) bad.push('L' + lv + ' N2 only ' + qq.vals.length + ' cards');
        if (g === 'O2' && R.ways(qq.C, qq.R).length < 6) bad.push('L' + lv + ' O2 only ' + R.ways(qq.C, qq.R).length + ' ways');
        if (g === 'O2') { let pr = 1; qq.right.forEach((x, i) => { if (!i) return; const [r, c] = qq.right[i - 1]; pr /= (r > 0 ? 1 : 0) + (c < qq.C - 1 ? 1 : 0); }); if (pr > 0.2) bad.push('L' + lv + ' O2: a random walk finds the right way ' + pr); }
      } else if (qq.asks === 2) { kinds['two asks'] = 1; n2++;
        const parts = String(qq.answer).split(',');
        const os = (o || []).map(String);
        if (!Array.isArray(o) || o.length < 3 || parts.length !== 2 || parts.some(x => !os.includes(x))) bad.push('L' + lv + ' two asks: answer ' + qq.answer + ' / cards ' + J(o));
        else parts.forEach((x, k) => pos2[k][os.indexOf(x)]++);
      } else { kinds[(o || []).length + ' options'] = 1;
        if (!Array.isArray(o) || o.length < 5) { bad.push('L' + lv + ' only ' + (o || []).length + ' options ' + J(qq.k)); }
        else { const ks = o.map(J); let p = ks.indexOf(J(qq.answer)); if (p < 0 && typeof qq.answer === 'number' && qq.answer >= 0 && qq.answer < o.length && o.every(x => typeof x === 'number') && o.join() === o.map((_, i) => i).join()) p = qq.answer;
          if (p < 0) bad.push('L' + lv + ' answer not among the options ' + J(qq.k));
          if (new Set(ks).size !== ks.length) bad.push('L' + lv + ' two same options ' + J(qq.k));
          if (p >= 0 && o.length === 5 && !LINE[g]) { pos[p]++; n5++; } }
      }
      if (R.rightCount) { const rc = R.rightCount(qq); if (rc !== 1) bad.push('L' + lv + ' ' + rc + ' right options ' + J(qq.k)); }
      seen.add(JSON.stringify(R.key ? R.key(qq) : qq.k)); }
    keys += seen.size; if (seen.size < 4) bad.push('L' + lv + ' only ' + seen.size + ' different questions');
    if (n5 >= 100 && pos.some(c => c < 0.1 * n5 || c > 0.3 * n5)) bad.push('L' + lv + ' right place not balanced ' + JSON.stringify(pos));
    if (n2 >= 100 && pos2.some(r => r.filter(c => c > 0).length < 2 || r.some(c => c > 0 && (c < 0.15 * n2 || c > 0.6 * n2)))) bad.push('L' + lv + ' two asks: cards not balanced ' + JSON.stringify(pos2));          /* a card that is never right (F2's "=") is a decoy */
  }
  return { bad: bad.slice(0, 4), keys, kinds: Object.keys(kinds) }; }"""


def load_games(page):
    """the games come in their own files after the entry tap; on a machine short of sockets a file can fail - load again"""
    from harness import enter
    for _ in range(5):
        page.evaluate("() => W3.load()")
        if page.evaluate("() => ORDER4.every(w => WORLDS[w].games.every(g => !!GAMES[g] && !!GAMES[g].gen))"): return True
        page.reload(); page.wait_for_function('window.__ready === true', timeout=30000); enter(page)
    return False


def answer_fully(page, strat, timeout=60000):
    """answer_question runs out of steps on a long question in real time (O1 pours three gourds first): go on until it is in"""
    from harness import answer_question, q
    gen, snap = answer_question(page, strat, timeout=timeout)
    for _ in range(30):
        cur = q(page)
        if not cur or cur['gen'] != gen or cur.get('submitted'): break
        answer_question(page, strat, timeout=timeout)
    return gen


def per_game(args):
    ids, vw, vh = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_phase, q
    out = []
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENG).launch()
        page = new_page(br, base, vw, vh, fast=True); enter(page)
        out.append((load_games(page), '%dx%d the games loaded' % (vw, vh)))
        page.evaluate(XWRAP)
        for w, g in ids:
            if vw > vh and vw == 1180:
                r = page.evaluate(GEN, g)
                out.append((not r['bad'], '%s gen L1-5 x 300: %s; one right, its place balanced, options different, enough variety (%d keys) %s' % (g, '/'.join(r['kinds']), r['keys'], r['bad'])))
            for lv in ((1, 2, 3, 4, 5) if vw > vh and vw == 1180 else (2, 4) if vw < vh else (3,)):
                for seed in ((5 + lv, 31 + lv) if vw == 1180 else (7 + lv,)):
                    before = len(page.errors)
                    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, seed])
                    try:
                        cur = wait_phase(page, timeout=25000); page.wait_for_timeout(250)
                        geo = page.evaluate(GEO)
                        if geo: out.append((False, '%dx%d %s L%d s%d targets: %s' % (vw, vh, g, lv, seed, geo[:4])))
                        gen, snap = answer_question(page, 'right', timeout=25000)
                        wait_next_question(page, gen, timeout=30000)
                        nq = q(page)
                        # a question judged a moment after its last tap (一题两问, F3) can be judged, praised and gone before the
                        # harness looks again: then the snapshot is already the next question's (its gen differs)
                        sub = snap and (snap.get('submitted') or snap.get('gen') != gen)
                        ok = sub and not (nq and (nq.get('retest') or nq.get('err')))
                        out.append((ok and not page.errors[before:], '%dx%d %s L%d s%d right: judged right, no error %s' % (vw, vh, g, lv, seed, page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%dx%d %s L%d s%d right: %s %s' % (vw, vh, g, lv, seed, str(e)[:160], page.errors[before:][:1])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            if vw == 1180:
                for lv in (1, 5):          # a real mouse on the right answer
                    before = len(page.errors)
                    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 23})", [w, g, lv])
                    try:
                        cur = wait_phase(page, timeout=25000); gen0 = cur['gen']; page.wait_for_timeout(300)
                        for _ in range(16):
                            st = page.evaluate("(g) => { const st = Session.st; if (!st || st.gen !== g) return 'gone'; if (st.submitted) return 'sub'; if (!['act', 'ready', 'input'].includes(st.phase)) return 'wait'; const nx = st.game.next(st, 'right'); if (!nx) return 'none'; if (nx.g !== 'tap') return 'gesture:' + nx.g; const e = st.map[nx.p.id]; if (!e) return 'nomap:' + nx.p.id; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }", gen0)
                            if st in ('gone', 'sub'): break
                            if st == 'wait': page.wait_for_timeout(120); continue
                            if not isinstance(st, list): break
                            page.mouse.click(st[0], st[1]); page.wait_for_timeout(120)
                        sub = page.evaluate("(g) => !Session.st || Session.st.gen !== g || Session.st.submitted", gen0)
                        if isinstance(st, str) and st.startswith('gesture:'):
                            out.append((True, '%s L%d mouse: answered by a %s gesture (not a tap) - covered by the harness' % (g, lv, st)))
                        else:
                            out.append((sub and not page.errors[before:], '%s L%d mouse: a real click on the right answer submits it (%s) %s' % (g, lv, st, page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%s L%d mouse: %s' % (g, lv, str(e)[:160])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            for lv in ((1, 2, 3, 4, 5) if vw == 1180 else (3,)):
                for seed in ((19, 41) if vw == 1180 else (29,)):
                    before = len(page.errors)
                    page.evaluate("window.__xr = null")
                    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, seed])
                    try:
                        wait_phase(page, timeout=25000); k0 = page.evaluate(KEY)
                        gen, snap = answer_question(page, 'wrong', timeout=25000)
                        wait_next_question(page, gen, timeout=30000)
                        nq = wait_phase(page, timeout=25000); k1 = page.evaluate(KEY)
                        x = page.evaluate("window.__xr") or {}
                        okx = x.get('gen') == gen and x.get('phase') == 'explain' and x.get('explaining') and x.get('own') and not x.get('err') and x.get('rightOk') and x.get('chosen', 0) > 0 and not x.get('marked') and not x.get('bad')
                        out.append((nq and nq.get('retest') and k1 != k0 and okx and not page.errors[before:], '%dx%d %s L%d s%d wrong: named; explain (own %s, right one ringed gold %s/%s, chosen marked %s (still ticked %s), said %s); a new question follows (%s), no error %s' % (vw, vh, g, lv, seed, x.get('own'), x.get('rightOk'), x.get('right'), x.get('chosen'), x.get('marked'), (x.get('said') or [])[:3] + (x.get('bad') or []), k1 != k0, page.errors[before:][:1] or x.get('err') or '')))
                    except Exception as e:
                        out.append((False, '%dx%d %s L%d wrong: %s %s' % (vw, vh, g, lv, str(e)[:160], page.errors[before:][:1])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
        out.append((not page.errors, '%dx%d %s zero page errors %s' % (vw, vh, [x[1] for x in ids][:1], page.errors[:3])))
        br.close()
    return out


# real time: from the moment the question is in its explain phase until it leaves it (the engine's "again" line included);
# with skip, a tap ("skip") 0.4 s in
PHASE = """([gen, skip]) => new Promise(res => {
  let t0 = null; const t1 = performance.now();
  const tick = () => { const q = window.__q;
    if (t0 === null) { if (q && q.gen === gen && q.phase === 'explain') { t0 = performance.now(); if (skip) setTimeout(() => gesture('skip'), 400); } else if (!q || q.gen !== gen || performance.now() - t1 > 30000) return res(-1); }
    else if (!q || q.gen !== gen || q.phase !== 'explain') return res(performance.now() - t0);
    setTimeout(tick, 15); };
  tick(); })"""
# the longest ones besides L3 (review OX1: M3 L2 was 6.4 s)
MORE = {'M3': (1, 2, 4, 5), 'I4': (4,), 'I1': (5,), 'F8': (5,), 'M4': (5,), 'O2': (5,), 'F1': (5,), 'F2': (5,)}


def timing(args):
    """the explain step in real time (no fast mode), every game at L3 (and the long ones at other levels): the explain
    phase (the engine's "again" line included) at most 5.5 s; a tap 0.4 s in ends it within 1.6 s (st.ff honoured)"""
    ids, = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, wait_next_question, wait_phase
    out = []
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENG).launch()
        page = new_page(br, base, 1180, 820, fast=False, sw='block'); enter(page)
        load_games(page); page.evaluate(XWRAP)
        for w, g in ids:
            for lv in (3,) + MORE.get(g, ()):
                for skip in (False, True):
                    before = len(page.errors)
                    page.evaluate("window.__xr = null")
                    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 19})", [w, g, lv])
                    try:
                        wait_phase(page, timeout=60000)
                        gen = answer_fully(page, 'wrong')
                        ms = page.evaluate(PHASE, [gen, skip])
                        wait_next_question(page, gen, timeout=60000)
                        x = page.evaluate("window.__xr") or {}
                        if skip:
                            out.append((0 <= ms <= 1600 and not page.errors[before:], '%s L%d explain skipped by a tap at 0.4 s: over %.1f s later (<= 1.6 s) %s' % (g, lv, ms / 1000.0 - 0.4, page.errors[before:][:1])))
                        else:
                            out.append((1000 <= ms <= 5500 and x.get('rightOk') and not page.errors[before:], '%s L%d explain in real time: phase %.1f s (<= 5.5 s; its own part %.1f s), right one ringed gold %s %s' % (g, lv, ms / 1000.0, (x.get('ms') or 0) / 1000.0, x.get('rightOk'), page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%s L%d explain timing: %s' % (g, lv, str(e)[:160])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(100)
        br.close()
    return out


def progress(log):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_map
    with sync_playwright() as p, serve() as base:
        # 积木城 (world 5) not live: no flight there on the first map visit of this save (tests/w5_flow.py tests it)
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True, extra_init='window.__live5 = [];'); enter(page)
        page.evaluate("() => W3.load()")
        st = page.evaluate("() => ({ open: W4.open(), u: ORDER4.map(w => Store.w(w).unlocked) })")
        log.check(not st['open'] and not any(st['u']), 'fresh save: the stars closed %s' % st)
        # the sky all flagged, its rainbow castle played
        page.evaluate("""() => { LIVE().concat(ORDER2, ORDER3).forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.pass = true; WORLDS[w].games.forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; }); if (!Store.s.flags.includes(w)) Store.s.flags.push(w); });
          Store.s.gateShown = true; Store.s.w2seen = true; Store.s.fin2 = 'seen'; Store.s.gate3 = true; Store.s.w3seen = true; Store.s.fin3 = 'seen'; Store.save(); Progress.check(false); }""")
        st = page.evaluate("() => ({ open: W4.open(), u: ORDER4.map(w => Store.w(w).unlocked), g: WORLDS.peppa4.games.map(g => W2.gameOpen('peppa4', g)) })")
        log.check(st['open'] and st['u'] == [True] + [False] * 6 and st['g'] == [True, False, False, False], 'the sky done: the stars open, only their first island and its first game %s' % st)
        page.evaluate("() => { window.__said = []; const o = Voice.sayNow.bind(Voice); Voice.sayNow = (t, x) => { window.__said.push(t); return o(t, x); }; const o2 = Voice.say.bind(Voice); Voice.say = (t, x) => { window.__said.push(t); return o2(t, x); }; MapView.useSet(3); MapView.enter(); }")
        page.wait_for_timeout(2500)
        said = page.evaluate("window.__said.slice()")
        log.check('惊喜来啦！' in said and page.evaluate("Store.s.gate4 === true && MapView.recommend() === 'gate'"), 'the sky: its gate turns gold ("惊喜来啦！"), the hand points at it %s' % said[-3:])
        page.evaluate("MapView.tapIsland('gate')")
        page.wait_for_function("MapView.set === 4 && !MapView.sailing", timeout=20000); page.wait_for_timeout(600)
        st = page.evaluate("() => ({ isl: Object.keys(MapView.isl), bg: document.querySelector('#mapbg').style.backgroundImage, said: window.__said.slice(-2) })")
        log.check('starcastle' in st['isl'] and 'gate' in st['isl'] and 'map_space' in st['bg'] and '飞到星空啦！' in st['said'], 'through the gate: the stars (their own map), "飞到星空啦！", the gate and the star castle %s' % st)
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_function("MapView.set === 1 && !MapView.sailing", timeout=20000)
        log.check(True, 'the gates go round: stars -> first sea')
        page.evaluate("MapView.useSet(4); MapView.update()")
        # one island: its four games played to 5 stars by right answers
        for g in ['F1', 'F2', 'F3', 'F4']:
            for s in range(1, 4):
                if page.evaluate("(g) => W2.gameDone('peppa4', g)", g): break
                page.evaluate("([g, s]) => window.__go('peppa4', g, null, {noDemo: true, seed: s})", [g, s])
                for _ in range(12):
                    try:
                        gen, snap = answer_question(page, 'right', timeout=20000); wait_next_question(page, gen, timeout=30000)
                    except Exception:
                        break
                    if page.evaluate("!Session.G"): break
                wait_map(page, timeout=60000); page.wait_for_timeout(400)
        st = page.evaluate("() => ({ done: WORLDS.peppa4.games.map(g => W2.gameDone('peppa4', g)), b4: Store.w('bluey4').unlocked })")
        log.check(all(st['done']) and st['b4'], 'peppa4: four games to 5 stars, bluey4 opens %s' % st)
        page.wait_for_timeout(5000)
        st = page.evaluate("() => ({ flags: Store.s.flags.slice(-1), html: (MapView.isl.peppa4 && MapView.isl.peppa4.flag.innerHTML) || '' })")
        log.check(st['flags'] == ['peppa4'] and '#FFD84A' in st['html'], 'peppa4 complete: its star pennant is planted and counted %s' % st['flags'])
        n = page.evaluate("Store.s.flags.length"); line = page.evaluate("(n) => CNQ(n) + '面旗子啦！'", n)
        log.check(n > 20 and 'undefined' not in line and page.evaluate("(t) => Bank.has(t)", line), 'the flag count past 20 is said and recorded: "%s" (%d flags)' % (line, n))
        # the whole world: the star castle and the space party
        page.evaluate("""() => { ORDER4.forEach(w => { const ws = Store.w(w); ws.unlocked = true; WORLDS[w].games.forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; }); }); Store.save(); Progress.check(false); MapView.enter(); }""")
        page.wait_for_timeout(9000)
        log.check(page.evaluate("Store.s.fin4") == 'seen', 'the whole world done: the star castle opens and the space party plays')
        log.check(not page.errors, 'progress: zero page errors %s' % page.errors[:3])
        br.close()


def main():
    log = Log('w4_' + ENG)
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = page.evaluate("() => ORDER4.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        br.close()
    only = os.environ.get('W4_ONLY')
    if only: ids = [x for x in ids if x[1] in only.split(',')]
    jobs = [(ids[i::JOBS], 1180, 820) for i in range(JOBS)] + [(ids[i::JOBS], 820, 1180) for i in range(JOBS)] + [(ids[i::JOBS], 1024, 768) for i in range(JOBS)]
    with Pool(JOBS) as pool:
        for part in pool.map(per_game, jobs):
            for ok, msg in part: log.check(ok, msg)
        if os.environ.get('W4_TIMING'):
            for part in pool.map(timing, [(ids[i::JOBS],) for i in range(JOBS)]):
                for ok, msg in part: log.check(ok, msg)
    if not only: progress(log)
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
