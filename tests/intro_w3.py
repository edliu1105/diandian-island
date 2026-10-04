# -*- coding: utf-8 -*-
"""World 3 at real speed: the first question of every game (with its first-time tips) - no sentence is dropped by the
voice queue (it keeps the newest three), and the question itself is said.   usage: python tests/intro_w3.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, Log
log = Log('intro_w3')
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820, fast=False); enter(page); page.wait_for_timeout(1500)
    ids = page.evaluate("() => ORDER3.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
    for w, g in ids:
        page.evaluate("window.__speechLog.length = 0")
        page.evaluate("([w,g]) => window.__go(w, g, 0, {noDemo: true, seed: 5})", [w, g])
        try:
            page.wait_for_function("window.__q && ['ready','act','input'].includes(window.__q.phase)", timeout=40000)
        except Exception:
            pass
        page.wait_for_timeout(9000)
        ev = page.evaluate("window.__speechLog.filter(e => e.ch === 'narr').map(e => [e.text, e.ev])")
        dropped = [t for t, e in ev if e == 'dropped']
        prompt = page.evaluate("Session.st && Session.st.prompt")
        spoken = [t for t, e in ev if e in ('speak', 'end')]
        log.check(not dropped and prompt in spoken, '%s: nothing dropped, the question "%s" is said %s' % (g, prompt, dropped))
        page.evaluate("gesture('home')"); page.wait_for_timeout(500)
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
