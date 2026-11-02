# -*- coding: utf-8 -*-
"""An install of the offline package that does not finish is tried again while the app is open (2026-11-01: Chromium ends
any service worker event after 5 minutes - the ~85 MB package since 积木城 did not always make it - and the app then had no
offline play until the next launch).
 01 the first install fails (one picture will not come): no worker
 02 the app tries again by itself (window.__swRetryMs: 3 s here, 30 s in the app); the second try reuses what the first one
    fetched and finishes: the version is active and controls the page
 03 offline, a reload still opens the app
usage: python tests/test_swretry.py"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, Log

log = Log('swretry')
STATE = """async () => { const r = await navigator.serviceWorker.getRegistration(); const meta = []; for (const k of await caches.keys()) if (await (await caches.open(k)).match('./__ddi_meta.json')) meta.push(k);
  return { ctrl: !!navigator.serviceWorker.controller, inst: !!(r && r.installing), act: r && r.active ? r.active.state : null, meta }; }"""

with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={'width': 1180, 'height': 820}, service_workers='allow')
    ctx.add_init_script('window.__swRetryMs = 3000;')
    blocked = {'n': 0, 'on': True}

    def block(route):
        if blocked['on']:
            blocked['n'] += 1
            return route.abort()
        return route.continue_()
    ctx.route('**/assets/props/ui_star.png', block)
    page = ctx.new_page()
    page.goto(base + 'index.html')
    page.wait_for_function('window.__ready === true', timeout=30000)
    t0, failed = time.time(), None
    for _ in range(600):                              # the first install: it fails on the star
        s = page.evaluate(STATE)
        if blocked['n'] >= 3 and not s['inst'] and not s['act']:
            failed = s
            break
        page.wait_for_timeout(500)
    log.check(failed is not None and not failed['meta'], '01 the first install failed on a picture that would not come (%d tries, %.0f s) %s' % (blocked['n'], time.time() - t0, failed))
    blocked['on'] = False
    t1, ok = time.time(), None
    for _ in range(600):
        s = page.evaluate(STATE)
        if s['ctrl'] and s['act'] == 'activated' and s['meta']:
            ok = s
            break
        page.wait_for_timeout(500)
    log.check(ok is not None, '02 the app tried again by itself and the version is installed and in control (%.0f s) %s' % (time.time() - t1, ok or page.evaluate(STATE)))
    ctx.set_offline(True)
    try:
        page.reload()
        page.wait_for_function('window.__ready === true', timeout=30000)
        log.ok('03 offline, a reload opens the app')
    except Exception as e:
        log.fail('03 offline reload: %s' % str(e)[:160])
    br.close()
sys.exit(0 if log.close() else 1)
