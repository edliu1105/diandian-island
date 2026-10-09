# -*- coding: utf-8 -*-
"""World 4 (the stars, 10 以内加减): every game
  - gen: levels 1-5 x 300 seeds - an answer, the answer among the options, options all different, the key varies
  - right: difficulty 1-5 answered right (judged right, no error), landscape; 2 and 4 portrait
  - targets: every tap target of the question (st.map) on screen, on top, >= 88 CSS px - landscape and portrait, 1024x768
  - mouse: a real mouse click on the right answer (L1 and L5) submits it
  - wrong: answered wrong at 1 / 3 / 5: named, a NEW question of the same kind follows (each question counts by itself)
and the progress: the stars open when the sky is all flagged and its rainbow castle has played; the sky's gate turns gold
("惊喜来啦！") and leads up ("飞到星空啦！"); one island and one game at a time; the star castle and the space party at the end.
usage: python tests/test_w4.py [chromium|webkit] [jobs=3]      W4_ONLY=F1,F2 to run some games only (no progress part)"""
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
  return out; }"""


def per_game(args):
    ids, vw, vh = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_phase, q
    out = []
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENG).launch()
        page = new_page(br, base, vw, vh, fast=True); enter(page)
        page.evaluate("() => W3.load()")
        for w, g in ids:
            if vw > vh and vw == 1180:
                r = page.evaluate("""(g) => { const R = GAMES[g], bad = []; let keys = 0;
                  for (let lv = 1; lv <= 5; lv++) { const G = { world: R.world, W: WORLDS[R.world], rng: RNG(lv * 13 + 3), bags: {}, ws: Store.w(R.world), level: lv }, seen = new Set();
                    for (let i = 0; i < 300; i++) { let qq; try { qq = R.gen(G, { level: lv, rng: G.rng }); } catch (e) { bad.push('L' + lv + ' throws ' + e.message); break; }
                      if (!qq || qq.answer === undefined || qq.answer === null) { bad.push('L' + lv + ' no answer'); break; }
                      const o = qq.opts; if (Array.isArray(o)) { const ks = o.map(x => JSON.stringify(x)); if (!ks.includes(JSON.stringify(qq.answer)) && !(typeof qq.answer === 'number' && qq.answer >= 0 && qq.answer < o.length && o.every(x => typeof x === 'object'))) bad.push('L' + lv + ' answer not among the options ' + JSON.stringify(qq.k)); if (new Set(ks).size !== ks.length) bad.push('L' + lv + ' two same options ' + JSON.stringify(qq.k)); }
                      seen.add(JSON.stringify(R.key ? R.key(qq) : qq.k)); }
                    keys += seen.size; if (seen.size < 4) bad.push('L' + lv + ' only ' + seen.size + ' different questions'); }
                  return { bad: bad.slice(0, 4), keys }; }""", g)
                out.append((not r['bad'], '%s gen L1-5 x 300: answers valid, options different, enough variety (%d keys) %s' % (g, r['keys'], r['bad'])))
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
                        ok = snap and snap.get('submitted') and not (nq and (nq.get('retest') or nq.get('err')))
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
                for lv in (1, 3, 5):
                    before = len(page.errors)
                    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 19})", [w, g, lv])
                    try:
                        wait_phase(page, timeout=25000); k0 = page.evaluate(KEY)
                        gen, snap = answer_question(page, 'wrong', timeout=25000)
                        wait_next_question(page, gen, timeout=30000)
                        nq = wait_phase(page, timeout=25000); k1 = page.evaluate(KEY)
                        out.append((nq and nq.get('retest') and k1 != k0 and not page.errors[before:], '%s L%d wrong: named, a new question follows (%s), no error %s' % (g, lv, k1 != k0, page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%s L%d wrong: %s %s' % (g, lv, str(e)[:160], page.errors[before:][:1])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
        out.append((not page.errors, '%dx%d %s zero page errors %s' % (vw, vh, [x[1] for x in ids][:1], page.errors[:3])))
        br.close()
    return out


def progress(log):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_map
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
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
    if not only: progress(log)
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
