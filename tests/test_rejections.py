# -*- coding: utf-8 -*-
"""A promise the platform rejects never ends a live question (coordinator 2026-10-10).
The window's unhandledrejection handler gives a rejection to Session.crash (which ends the question with an error) only
when it comes from the app's own code. A DOMException (audio play() refused after an iOS interruption, InvalidState...),
a TypeError of the network (fetch on flaky Wi-Fi) and a failed service-worker update check (SWU.watch: reg.update()
offline) are dropped.
For a world-1 and a world-2 question, while it waits for the child: each kind of platform rejection, unhandled ->
the question goes on (same question, not failed, not submitted), the child answers it (wrong: the explanation runs
too, and no stars pile up) and the next one comes.
Control: an Error of the app's own code still ends the question (st.failed) - the handler still works.
usage: python tests/test_rejections.py
log: tests/logs/rejections.log"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, wait_next_question, Log

log = Log('rejections')
LIVE = "window.__q && ['act','ready','input'].includes(window.__q.phase)"
REJECT = {
    'DOMException InvalidStateError': "Promise.reject(new DOMException('x', 'InvalidStateError'))",
    'audio play() NotAllowedError': "(() => { const a = new Audio(); a.play = () => Promise.reject(new DOMException('play() failed because the user did not interact', 'NotAllowedError')); a.play(); })()",
    'fetch TypeError (offline)': "Promise.reject(new TypeError('Failed to fetch'))",
    'Safari fetch TypeError': "Promise.reject(new TypeError('Load failed'))",
    # SWU.watch catches its own update check: nothing reaches the window handler (window.__swuCalled: it did run)
    'service worker update (SWU.watch, offline)': """(() => { SWU.reg = null; SWU.watch({ addEventListener() {}, waiting: null, installing: null,
        update: () => { window.__swuCalled = 1; return Promise.reject(new TypeError("Failed to update a ServiceWorker for scope ('/') with script ('/sw.js'): An unknown error occurred when fetching the script.")); } }); })()""",
    'service worker update (raw, InvalidStateError)': "({ update: () => Promise.reject(new DOMException('The object is in an invalid state.', 'InvalidStateError')) }).update()",
}
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
    log.check(page.evaluate("typeof navigator.serviceWorker !== 'undefined'"), 'the browser has navigator.serviceWorker (SWU.watch can run)')
    for w, g, lv in [('peppa', 'P3', 1), ('bluey2', 'C3', 2)]:
        for name, js in REJECT.items():
            page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 5})", [w, g, lv])
            page.wait_for_function(LIVE, timeout=30000)
            gen = page.evaluate("Session.st.gen")
            page.evaluate("window.__ignoredRejections = []; window.__swuCalled = 0;")
            page.evaluate("() => { %s; }" % js)                      # unhandled: nobody catches it
            page.wait_for_timeout(400)
            s = page.evaluate("() => { const st = Session.st; return { gen: st && st.gen, failed: !!(st && st.failed), submitted: !!(st && st.submitted), phase: st && st.phase, ign: window.__ignoredRejections || [], swu: window.__swuCalled }; }")
            ok = s['gen'] == gen and not s['failed'] and not s['submitted'] and s['phase'] in ('act', 'ready', 'input')
            seen = (s['swu'] and not s['ign']) if 'SWU.watch' in name else len(s['ign']) >= 1      # caught where it starts / dropped by the handler
            log.check(ok and seen, '%s L%d, %s: dropped (%s), the question goes on %s' % (g, lv, name, s['ign'][-1:] , {k: s[k] for k in ('failed', 'submitted', 'phase')}))
            try:
                g0, snap = answer_question(page, 'wrong', timeout=25000)      # (wrong: no stars pile up - five end the game)
                wait_next_question(page, g0, timeout=40000)
                nxt = page.evaluate("Session.st && Session.st.gen")
                bad = page.evaluate("!!(Session.st && Session.st.failed)")
                log.check(nxt and nxt > gen and not bad, '%s L%d, %s: answered afterwards, explained, the next question came (q %s -> %s)' % (g, lv, name, gen, nxt))
            except Exception as e:
                log.fail('%s L%d, %s: could not go on %s' % (g, lv, name, str(e)[:120]))
            page.evaluate("gesture('home')"); page.wait_for_timeout(150)
    log.check(not page.errors, 'no page error from the dropped rejections %s' % page.errors[:3])
    # control: an error of the app's own code still ends the question (with the engine's own 'question error')
    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 5})", ['peppa', 'P3', 1])
    page.wait_for_function(LIVE, timeout=30000)
    gen = page.evaluate("Session.st.gen")
    page.evaluate("() => { Promise.reject(new Error('a bug in a game')); }")
    page.wait_for_timeout(600)
    ended = page.evaluate("([g0]) => { const st = Session.st; return !st || st.gen !== g0 || !!st.failed || !!st.submitted; }", [gen])
    log.check(ended and any('question error' in e or 'a bug in a game' in e for e in page.errors), 'control: an Error of the app itself still ends the question %s' % page.errors[:2])
    del page.errors[:]
    br.close()
sys.exit(0 if log.close() else 1)
