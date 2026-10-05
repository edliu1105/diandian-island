# -*- coding: utf-8 -*-
"""The way up to the sky, the way a family meets it: every island of the evening sea gets its flag, the lantern island
and its finale (the group photo) play, the child goes home from the photo - and then the gate in the middle turns gold
("惊喜来啦！") and a tap on it flies up to the sky (never back to sea 1). Also: a save where the finale was seen long ago
(before the 5-star rule) and the flags were earned again later; a gold show cut short by a tap; tapping the gate
before its show.   usage: python tests/gate3_flow.py [url]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, Log
log = Log('gate3_flow')

SETUP = """(fin2) => {
  ORDER.forEach(w => { Store.w(w).pass = true; Store.w(w).unlocked = true; });
  ORDER2.forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.gstars = {}; WORLDS[w].games.forEach(g => { ws.gstars[g] = 5; }); });
  Object.assign(Store.s, { w2seen: true, gateShown: true, flags: LIVE().slice(), fin2, gate3: false, w3seen: false, mapSet: 2 });
  Store.save(); }"""


def fresh(br, base, fast=True):
    page = new_page(br, base, 1180, 820, sw='block', fast=fast)
    enter(page); page.wait_for_timeout(300)
    return page


def state(page):
    return page.evaluate("""() => ({ set: MapView.set, gold: !!(MapView.isl.gate && MapView.isl.gate.d.classList.contains('sky')), gate3: !!Store.s.gate3,
        fin2: Store.s.fin2, scr: Screens.cur, said: window.__speechLog.filter(e => e.ev === 'speak').map(e => e.text).slice(-6) })""")


def reload_enter(page):
    page.reload(); enter(page)


def wait_until(page, js, ms):
    try:
        page.wait_for_function(js, timeout=ms); return True
    except Exception:
        return False


with sync_playwright() as p, serve() as base:
    base = sys.argv[1] if len(sys.argv) > 1 else base
    br = p.chromium.launch()

    # A. the whole way: flags -> lantern island -> finale -> home from the photo -> gold gate -> tap -> the sky
    page = fresh(br, base); page.evaluate(SETUP, ''); reload_enter(page)
    log.check(wait_until(page, "Screens.cur === 'finale'", 60000), 'A: the flags, the lantern island, then the finale (group photo) %s' % state(page))
    page.wait_for_timeout(2500); page.click('#fhome')
    ok = wait_until(page, "MapView.isl.gate && MapView.isl.gate.d.classList.contains('sky') && Store.s.gate3", 8000)
    page.wait_for_timeout(1500)
    s = state(page)
    log.check(ok and '惊喜来啦！' in s['said'], 'A: home from the photo -> the gate turns gold, "惊喜来啦！" %s' % s)
    page.evaluate("MapView.tapIsland('gate')")
    log.check(wait_until(page, "MapView.set === 3 && !MapView.sailing", 8000), 'A: a tap on the gold gate flies up to the sky %s' % state(page))
    page.context.close()

    # B. the finale was seen long ago (before the 5-star rule); the flags were earned again: the gold gate on entry
    page = fresh(br, base); page.evaluate(SETUP, 'seen'); reload_enter(page)
    ok = wait_until(page, "MapView.isl.gate && MapView.isl.gate.d.classList.contains('sky') && Store.s.gate3", 40000)
    log.check(ok, 'B: finale seen before; flags again -> the gate turns gold on the map %s' % state(page))
    page.context.close()

    # C. the gold show is cut short (the child taps the gate during the flags): the tap still leads up, not back to sea 1
    page = fresh(br, base, fast=False); page.evaluate(SETUP, 'seen'); reload_enter(page)      # real speed: the flags take ~10 s
    page.wait_for_timeout(1500); page.evaluate("MapView.tapIsland('gate')")
    page.wait_for_timeout(1000); page.evaluate("MapView.tapIsland('gate')")
    log.check(page.evaluate("MapView.set") == 2 and not page.evaluate("Store.s.gate3"), 'C: taps during the flags: still on the evening sea, the show goes on %s' % state(page))
    wait_until(page, "Store.s.gate3", 30000); page.wait_for_timeout(2500)
    log.check('惊喜来啦！' in state(page)['said'] and page.evaluate("MapView.isl.gate.d.classList.contains('sky')"), 'C: then the gate turns gold, "惊喜来啦！" %s' % state(page))
    page.evaluate("MapView.tapIsland('gate')")
    ok = wait_until(page, "MapView.set === 3 && !MapView.sailing", 10000)
    log.check(ok and page.evaluate("MapView.set") != 1, 'C: taps on the gate before / during its show never sail back to sea 1 %s' % state(page))
    page.context.close()

    # D. on sea 1 when it all happened: through the gate to sea 2, the gold gate show plays there
    page = fresh(br, base); page.evaluate(SETUP, 'seen'); page.evaluate("Store.s.mapSet = 1; Store.save()"); reload_enter(page)
    page.wait_for_timeout(1500); page.evaluate("MapView.tapIsland('gate')")
    ok = wait_until(page, "MapView.set === 2 && Store.s.gate3 && MapView.isl.gate.d.classList.contains('sky')", 40000)
    log.check(ok, 'D: from sea 1 through the gate -> sea 2, its gate turns gold %s' % state(page))
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
