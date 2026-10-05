# -*- coding: utf-8 -*-
"""Sea 2 as it was earned (client: the flags of the second sea were gone after the 5-star update): a save from before
this release where every sea-2 game was played through with fewer than 5 stars - after loading, every game counts,
the 7 flags come back (with their show), the lantern island / gold gate follow and the gate leads up to the sky; a game
never played through stays not done; a new save is not touched; the migration runs once (a game played through later
with < 5 stars does not count).   usage: python tests/keep2_check.py [url]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, Log
log = Log('keep2_check')
OLD = """(skip) => {
  ORDER.forEach(w => { Store.w(w).pass = true; Store.w(w).unlocked = true; });
  ORDER2.forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.gstars = {}; ws.gdone = {}; WORLDS[w].games.forEach((g, i) => { ws.gstars[g] = i % 3; if (!(skip && w === ORDER2[6] && i === 3)) ws.gdone[g] = true; }); delete ws.keep; });
  Object.assign(Store.s, { w2seen: true, gateShown: true, flags: LIVE().slice(), fin2: 'seen', gate3: false, mapSet: 2, star5: true });
  delete Store.s.keep2; Store.save(); }"""


def wait_until(page, js, ms):
    try:
        page.wait_for_function(js, timeout=ms); return True
    except Exception:
        return False


with sync_playwright() as p, serve() as base:
    base = sys.argv[1] if len(sys.argv) > 1 else base
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820, sw='block'); enter(page)
    log.check(page.evaluate("Store.s.keep2 === true"), 'a new save: keep2 set, nothing to migrate')
    page.evaluate(OLD, False); page.reload(); enter(page)
    log.check(page.evaluate("ORDER2.every(w => W2.islandDone(w)) && W2.allDone() && W3.open()"), 'old save: every sea-2 game played through counts again, the sky is open')
    ok = wait_until(page, "ORDER2.every(w => (Store.s.flags || []).includes(w))", 30000)
    log.check(ok, 'the 7 flags of the second sea come back %s' % page.evaluate("Store.s.flags"))
    ok = wait_until(page, "Store.s.gate3 && MapView.isl.gate && MapView.isl.gate.d.classList.contains('sky')", 20000)
    log.check(ok, 'then the gate turns gold')
    page.wait_for_timeout(1500); page.evaluate("MapView.tapIsland('gate')")
    log.check(wait_until(page, "MapView.set === 3 && !MapView.sailing", 10000), 'and a tap flies up to the sky')
    # once only: a game played through later with < 5 stars does not count
    page.evaluate("() => { const w = ORDER2[0], g = WORLDS[w].games[0]; delete Store.w(w).keep[g]; Store.w(w).gstars[g] = 2; Store.save(); }")
    page.reload(); enter(page)
    log.check(page.evaluate("!W2.gameDone(ORDER2[0], WORLDS[ORDER2[0]].games[0])"), 'the migration runs once: later play needs 5 stars')
    # a game never played through stays not done
    page.evaluate(OLD, True); page.reload(); enter(page)
    log.check(page.evaluate("!W2.islandDone(ORDER2[6]) && ORDER2.slice(0, 6).every(w => W2.islandDone(w)) && !W3.open()"), 'a game never played through stays not done (its island has no flag, the sky stays shut)')
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
