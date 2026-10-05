# -*- coding: utf-8 -*-
"""Sea 2 counts with 5 stars (client): the short keep2 release (every sea-2 game played through kept as passed) is
taken back. A save that went through keep2 - every sea-2 game kept with < 5 stars, all flags, the gate gold, the sky
seen, the map on the sky - after loading: no sea-2 game done without 5 stars, the sea-2 flags down, the sky shut (map
on the evening sea, the gate not gold, a sky island never played closed again); a game with 5 stars stays done; when
world 2 is really done the gate turns gold and leads up; a new save is untouched; sea 1 keeps what it earned.
usage: python tests/strict2_check.py [url]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, Log
log = Log('strict2_check')
KEPT = """() => {
  ORDER.forEach(w => { const ws = Store.w(w); ws.pass = true; ws.unlocked = true; ws.keep = {}; WORLDS[w].games.forEach(g => { ws.keep[g] = true; }); });
  ORDER2.forEach((w, k) => { const ws = Store.w(w); ws.unlocked = true; ws.gstars = {}; ws.gdone = {}; ws.keep = {}; WORLDS[w].games.forEach((g, i) => { ws.gstars[g] = k === 0 ? 5 : i % 3; ws.gdone[g] = true; ws.keep[g] = true; }); });
  Store.w(ORDER3[0]).unlocked = true;
  Object.assign(Store.s, { w2seen: true, gateShown: true, flags: LIVE().concat(ORDER2), fin2: 'seen', gate3: true, w3seen: true, mapSet: 3 });
  delete Store.s.strict2; Store.save(); }"""


def wait_until(page, js, ms):
    try:
        page.wait_for_function(js, timeout=ms); return True
    except Exception:
        return False


with sync_playwright() as p, serve() as base:
    base = sys.argv[1] if len(sys.argv) > 1 else base
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820, sw='block'); enter(page)
    log.check(page.evaluate("Store.s.strict2 === true"), 'a new save: nothing to take back')
    page.evaluate(KEPT); page.reload(); enter(page); page.wait_for_timeout(1500)
    r = page.evaluate("""() => ({ done2: ORDER2.map(w => W2.islandDone(w)), flags2: ORDER2.filter(w => (Store.s.flags || []).includes(w)), open3: W3.open(), set: MapView.set,
        gold: !!(MapView.isl.gate && MapView.isl.gate.d.classList.contains('sky')), gate3: Store.s.gate3, w3seen: Store.s.w3seen, sky1: Store.w(ORDER3[0]).unlocked,
        sea1: LIVE().every(w => passed(w)), keep2: ORDER2.some(w => Store.w(w).keep) })""")
    log.check(r['done2'] == [True] + [False] * 6, 'sea 2: only the island with 5 stars in every game is done %s' % r)
    log.check(len(r['flags2']) <= 1 and not r['keep2'], 'sea 2: the other flags are down, nothing kept without its stars %s' % r)
    log.check(not r['open3'] and r['set'] == 2 and not r['gold'] and not r['gate3'] and not r['w3seen'] and not r['sky1'], 'the sky is shut again: the evening sea, the gate not gold, the sky island closed %s' % r)
    log.check(r['sea1'], 'sea 1 keeps what it earned')
    page.evaluate("MapView.tapIsland('gate')")
    log.check(wait_until(page, "MapView.set === 1 && !MapView.sailing", 10000), 'the plain gate goes round to sea 1 (the sky is not open yet)')
    # world 2 really done (5 stars everywhere): the gate turns gold and leads up
    page.evaluate("() => { ORDER2.forEach(w => { const ws = Store.w(w); WORLDS[w].games.forEach(g => { ws.gstars[g] = 5; }); }); Store.s.mapSet = 2; Store.save(); }")
    page.reload(); enter(page)
    ok = wait_until(page, "Store.s.gate3 && MapView.isl.gate && MapView.isl.gate.d.classList.contains('sky')", 40000)
    log.check(ok, 'with 5 stars in every game: the flags, then the gate turns gold')
    page.wait_for_timeout(1500); page.evaluate("MapView.tapIsland('gate')")
    log.check(wait_until(page, "MapView.set === 3 && !MapView.sailing", 10000), 'and a tap flies up to the sky')
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
