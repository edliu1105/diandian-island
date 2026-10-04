# -*- coding: utf-8 -*-
"""World 3: the first-time demo (the ghost hand plays one question, then the child) finishes in every game, both
orientations, without errors.   usage: python tests/demo_w3.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, Log
log = Log('demo_w3')
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    for vw, vh in ((1180, 820), (820, 1180)):
        page = new_page(br, base, vw, vh, fast=True); enter(page)
        ids = page.evaluate("() => ORDER3.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        for w, g in ids:
            before = len(page.errors)
            page.evaluate("([w,g]) => { const ws = Store.w(w); ws.demo = {}; ws.unlocked = true; window.__go(w, g, 0, { seed: 3 }); }", [w, g])
            try:
                page.wait_for_function("([g]) => Store.w(Session.G ? Session.G.world : 'peppa').demo[g] === true || (Session.G && Session.G.rounds === 4)", arg=[g], timeout=40000)
                ok = True
            except Exception as e:
                ok = False
            log.check(ok and not page.errors[before:], '%dx%d %s: the demo plays its question through %s' % (vw, vh, g, page.errors[before:][:1]))
            page.evaluate("gesture('home')"); page.wait_for_timeout(80)
        page.context.close()
    br.close()
sys.exit(0 if log.close() else 1)
