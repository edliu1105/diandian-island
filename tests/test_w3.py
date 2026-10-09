# -*- coding: utf-8 -*-
"""World 3 (the sky): every game at difficulty 1-5 answered right (judged right, no error) in both orientations, every
game answered wrong (named, a NEW question of the same kind follows), and the progress (the sky opens when every
island of world 2 has its flag; the gate in the middle of the evening sea shows "惊喜来啦！" and leads up; one island
and one game at a time, 5 stars open the next; the rainbow castle and the finale at the end).
usage: python tests/test_w3.py [chromium|webkit] [jobs=3]"""
import os, sys
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log

ENG = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
JOBS = int(sys.argv[2]) if len(sys.argv) > 2 else 3
KEY = "(() => { const st = Session.st; return st && st.q ? JSON.stringify(st.game.key(st.q)) : null; })()"


def per_game(args):
    ids, vw, vh = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_phase, q
    out = []
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENG).launch()
        page = new_page(br, base, vw, vh, fast=True); enter(page)
        for w, g in ids:
            for lv in ((1, 2, 3, 4, 5) if vw > vh else (2, 4)):
                for seed in ((5 + lv, 31 + lv) if vw > vh else (7 + lv,)):
                    before = len(page.errors)
                    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, seed])
                    try:
                        gen, snap = answer_question(page, 'right', timeout=25000)
                        wait_next_question(page, gen, timeout=30000)
                        nq = q(page)
                        ok = snap and snap.get('submitted') and not (nq and (nq.get('retest') or nq.get('err')))
                        out.append((ok and not page.errors[before:], '%dx%d %s L%d s%d right: judged right, no error %s' % (vw, vh, g, lv, seed, page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%dx%d %s L%d s%d right: %s %s' % (vw, vh, g, lv, seed, str(e)[:160], page.errors[before:][:1])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            if vw > vh:
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
        br = getattr(p, ENG).launch()
        page = new_page(br, base, 1180, 820, fast=True); enter(page)
        st = page.evaluate("() => ({ open: W3.open(), u: ORDER3.map(w => Store.w(w).unlocked) })")
        log.check(not st['open'] and not any(st['u']), 'fresh save: the sky closed %s' % st)
        # world 1 and world 2 done, the lantern island seen: the gate in the evening sea becomes the way up
        page.evaluate("""() => { LIVE().forEach(w => { Store.w(w).pass = true; }); ORDER2.forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.gstars = {}; WORLDS[w].games.forEach(g => { ws.gstars[g] = 5; }); });
            Store.s.gateShown = true; Store.s.w2seen = true; Store.s.fin2 = 'seen'; Store.s.flags = LIVE().concat(ORDER2); Store.s.mapSet = 2; Store.save(); }""")
        page.reload(); page.wait_for_function('window.__ready === true', timeout=20000); enter(page)
        st = page.evaluate("() => ({ open: W3.open(), u: ORDER3.map(w => Store.w(w).unlocked), g: ['E1','E2','E3','E4'].map(g => W2.gameOpen('peppa3', g)), set: MapView.set })")
        log.check(st['open'] and st['u'] == [True] + [False] * (len(st['u']) - 1) and st['g'] == [True, False, False, False] and st['set'] == 2,      # v2: the first sky island is the arithmetic island
              'world 2 done: the sky opens with only its first island and first game; the map stays on the evening sea %s' % st)
        page.wait_for_function("Store.s.gate3 === true && document.querySelector('.isl.gate').classList.contains('sky')", timeout=10000)
        said = page.wait_for_function("() => JSON.stringify(window.__speechLog).includes('惊喜来啦')", timeout=8000) is not None
        log.check(said and page.evaluate("MapView.recommend()") == 'gate', 'the middle of the evening sea: the gate turns gold, "惊喜来啦！", the hand points at it')
        page.screenshot(path=os.path.join(os.path.dirname(__file__), 'logs', 'w3_gate.png'))
        page.evaluate("MapView.tapIsland('gate')")
        page.wait_for_function("MapView.set === 3 && !MapView.sailing && JSON.stringify(window.__speechLog).includes('飞到云上啦')", timeout=10000)
        st = page.evaluate("() => ({ isl: Object.keys(MapView.isl), bg: document.querySelector('#mapbg').style.backgroundImage, rb: MapView.isl.rainbow.d.classList.contains('locked') })")
        log.check('gate' in st['isl'] and 'rainbow' in st['isl'] and 'map_sky' in st['bg'] and st['rb'], 'through the gate: the sky (its own picture), "飞到云上啦！", a gate in its middle, the rainbow castle under its cloud %s' % st)
        page.wait_for_timeout(800); page.screenshot(path=os.path.join(os.path.dirname(__file__), 'logs', 'w3_map.png'))
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_function("MapView.set === 1 && !MapView.sailing", timeout=10000)
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_function("MapView.set === 2 && !MapView.sailing", timeout=10000)
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_function("MapView.set === 3 && !MapView.sailing", timeout=10000)
        log.check(True, 'the gates go round: sky -> first sea -> evening sea -> sky')
        for g in ('E1', 'E2', 'E3', 'E4'):
            page.evaluate("([g]) => window.__go('peppa3', g, 0, {noDemo: true, seed: 2})", [g])
            for i in range(8):
                try:
                    gen, snap = answer_question(page, 'right', timeout=25000); wait_next_question(page, gen, timeout=30000)
                except Exception:
                    break
            wait_map(page, timeout=60000)
            st = page.evaluate("([g]) => ({ done: W2.gameDone('peppa3', g), stars: W2.stars('peppa3', g), open: WORLDS.peppa3.games.map(x => W2.gameOpen('peppa3', x)), b3: Store.w('bluey3').unlocked })", [g])
            log.check(st['done'] and st['stars'] >= 5, '%s: five right answers, 5 stars, done %s' % (g, st))
            page.wait_for_timeout(1200); page.evaluate("MapView.closePanel(true)")
        st['b3'] = page.evaluate("() => { if (ORDER3.indexOf('trans3') < ORDER3.indexOf('bluey3')) { const ws = Store.w('trans3'); ws.gstars = ws.gstars || {}; WORLDS.trans3.games.forEach(g => { ws.gstars[g] = 5; }); } Progress.check(false); return Store.w('bluey3').unlocked; }")      # v2: the arithmetic island before it is done too
        log.check(st['b3'], 'all four games of peppa3 (and the arithmetic island) with 5 stars: bluey3 opens %s' % st)
        page.wait_for_function("!MapView.isl.peppa3.flag.classList.contains('gone')", timeout=15000)
        st = page.evaluate("() => ({ flags: Store.s.flags.slice(), banner: !!document.querySelector('#islands .flagpole:not(.gone) .cloth path[d^=\"M2 2H58V30\"]') })")
        log.check(st['flags'][-1] == 'peppa3' and st['banner'], 'peppa3 complete: its sky flag (a hanging banner) is planted and counted %s' % st)
        page.evaluate("() => { ORDER3.forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.gstars = {}; WORLDS[w].games.forEach(g => { ws.gstars[g] = 5; }); }); Store.save(); }")
        page.evaluate("() => { const ws = Store.w('avengers3'); ws.gstars.T4 = 4; Store.save(); }")
        page.evaluate("window.__go('avengers3', 'T4', 0, {noDemo: true, seed: 4})")
        for i in range(8):
            try:
                gen, snap = answer_question(page, 'right', timeout=25000); wait_next_question(page, gen, timeout=30000)
            except Exception:
                break
        page.wait_for_function("Screens.cur === 'finale'", timeout=60000)
        log.check(page.evaluate("Store.s.fin3") == 'seen', 'the whole sky done: the rainbow castle opens and the finale plays')
        page.evaluate("gesture('home')"); page.wait_for_timeout(400)
        log.check(page.evaluate("MapView.recommend() === (W4.open() ? 'gate' : 'rainbow') && !MapView.isl.rainbow.d.classList.contains('locked')"), 'afterwards the rainbow castle stays open, and the hand points at the gate up to the stars (world 4)')
        log.check(not page.errors, 'progress: zero page errors %s' % page.errors[:3])
        br.close()


def main():
    log = Log('w3_' + ENG)
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = page.evaluate("() => ORDER3.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        br.close()
    only = os.environ.get('W3_ONLY')
    if only: ids = [x for x in ids if x[1] in only.split(',')]
    jobs = [(ids[i::JOBS], 1180, 820) for i in range(JOBS)] + [(ids[i::JOBS], 820, 1180) for i in range(JOBS)]
    with Pool(JOBS) as pool:
        for part in pool.map(per_game, jobs):
            for ok, msg in part: log.check(ok, msg)
    if not only: progress(log)
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
