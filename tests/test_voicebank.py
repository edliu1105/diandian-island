# -*- coding: utf-8 -*-
"""Voice bank coverage (client: the natural voice everywhere, never the old one): every game played through one whole
session (intro, questions, a wrong answer and its retry, the hint ladder, praise, the goodbye), the map shows (flags, new
games, new islands, the gate, the lantern island), and the narration log checked - every sentence must have a recording
(window.__vmiss empty, no 'skip'). Misses are written to raw/voice_miss.json for tools/voice_extra.py + voice_bank.py.
usage: python tests/test_voicebank.py [jobs=3]"""
import os, sys, json
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log, ROOT


def play(ids):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question
    miss, skip, lines = set(), set(), set()
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch()
        page = new_page(br, base, 1180, 820, fast=True, hint_scale=0.05); enter(page); page.wait_for_timeout(800)
        for w, g in ids:
            try:
                page.evaluate("([w,g]) => window.__go(w, g, 0, {noDemo: true, seed: 7})", [w, g])
                for i in range(12):
                    strat = 'wrong' if i == 1 else 'right'
                    gen, _ = answer_question(page, strat, timeout=20000)
                    page.wait_for_function("([g]) => !Session.G || (window.__q && window.__q.gen !== g)", arg=[gen], timeout=30000)
                    if page.evaluate("!Session.G || Session.G.finishing"): break
                    if i == 2: page.wait_for_timeout(1500)                      # the hint ladder's kind words
                page.wait_for_function("(Screens.cur === 'map' || Screens.cur === 'finale') && !Session.G", timeout=60000)
                page.wait_for_timeout(1500)
                if page.evaluate("Screens.cur === 'finale'"): page.evaluate("gesture('home')")
            except Exception as e:
                page.evaluate("gesture('home')")
            log = page.evaluate("window.__speechLog.filter(e => e.ch === 'narr').map(e => [e.text, e.ev])")
            lines.update(t for t, ev in log if t)
            skip.update(t for t, ev in log if ev == 'skip' and t)
            miss.update(page.evaluate("[...(window.__vmiss || [])]"))
            page.evaluate("window.__speechLog.length = 0; window.__vmiss = new Set()")
        br.close()
    return sorted(miss), sorted(skip), sorted(lines)


def map_flows():
    """the map's own sentences: locked islands / games / gate / flag slot, the gate opening, sailing both ways, flags,
    new islands, the lantern island and the finale"""
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page); page.wait_for_timeout(1200)
        rl = lambda: (page.reload(), page.wait_for_function('window.__ready === true', timeout=20000), enter(page), page.wait_for_timeout(2500))
        page.evaluate("MapView.tapIsland('bluey')"); page.wait_for_timeout(700)
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_timeout(700)
        page.evaluate("MapView.tapIsland('peppa')"); page.wait_for_timeout(700)
        page.evaluate("() => { const m = MapView.panel && MapView.panel.querySelector('[data-game=\"P2\"]'); if (m) gesture('tap', {}); }")
        page.evaluate("MapView.closePanel(true)")
        page.evaluate("() => { LIVE().forEach(w => { Store.w(w).pass = true; }); Store.save(); }"); rl()
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_timeout(2500)
        page.evaluate("MapView.tapIsland('festival')"); page.wait_for_timeout(800)
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_timeout(2500)
        page.evaluate("MapView.tapIsland('gate')"); page.wait_for_timeout(2500)
        page.evaluate("() => { ORDER2.forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.gstars = {}; WORLDS[w].games.forEach(g => { ws.gstars[g] = 5; }); }); Store.s.mapSet = 2; Store.save(); }"); rl()
        page.wait_for_timeout(3000)
        if page.evaluate("Screens.cur === 'finale'"): page.wait_for_timeout(5000); page.evaluate("gesture('home')")
        if page.evaluate("typeof ORDER3 !== 'undefined'"):          # the sky: the gate turns gold, up to the sky, its islands, the rainbow castle
            page.evaluate("() => { Store.s.fin2 = 'seen'; Store.s.mapSet = 2; Store.save(); }"); rl(); page.wait_for_timeout(3000)
            page.evaluate("MapView.tapIsland('gate')"); page.wait_for_timeout(3000)
            page.evaluate("MapView.tapIsland('bluey3')"); page.wait_for_timeout(700)
            page.evaluate("MapView.tapIsland('rainbow')"); page.wait_for_timeout(700)
            page.evaluate("MapView.tapIsland('peppa3')"); page.wait_for_timeout(700)
            page.evaluate("() => { const b = MapView.panel && MapView.panel.querySelector('[data-game=\"E2\"]'); if (b) b.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); }")
            page.evaluate("MapView.closePanel(true)")
            page.evaluate("() => { ORDER3.forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.gstars = {}; WORLDS[w].games.forEach(g => { ws.gstars[g] = 5; }); }); Store.s.mapSet = 3; Store.save(); }"); rl()
            page.wait_for_timeout(3000)
            if page.evaluate("Screens.cur === 'finale'"): page.wait_for_timeout(5000); page.evaluate("gesture('home')")
            page.evaluate("MapView.tapIsland('gate')"); page.wait_for_timeout(3000)
        log = page.evaluate("window.__speechLog.filter(e => e.ch === 'narr').map(e => [e.text, e.ev])")
        miss = page.evaluate("[...(window.__vmiss || [])]")
        br.close()
    return sorted(miss), sorted(t for t, ev in log if ev == 'skip' and t), sorted(t for t, ev in log if t)


def main():
    jobs = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    log = Log('voicebank')
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = page.evaluate("() => Object.keys(WORLDS).flatMap(w => (WORLDS[w].games || []).map(g => [w, g])).filter(x => GAMES[x[1]])")
        if os.environ.get('VB_WORLDS'): ids = [x for x in ids if x[0] in os.environ['VB_WORLDS'].split(',')]
        br.close()
    with Pool(jobs) as pool:
        res = pool.map(play, [ids[i::jobs] for i in range(jobs)])
    res.append(map_flows())
    miss = sorted(set().union(*[set(r[0]) for r in res])); skip = sorted(set().union(*[set(r[1]) for r in res])); lines = set().union(*[set(r[2]) for r in res])
    json.dump(miss, open(os.path.join(ROOT, 'raw', 'voice_miss.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    log.check(not miss, '%d games played through: %d different sentences, every one recorded %s' % (len(ids), len(lines), miss[:12]))
    log.check(not skip, 'no sentence let go for lack of audio %s' % skip[:8])
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
