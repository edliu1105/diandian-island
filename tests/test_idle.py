# -*- coding: utf-8 -*-
"""Attention window (TASK: one question <= 40 s): a child who does not touch anything, normal speed, real hint timing.

For the games with the most steps (every question that needs many taps or a preliminary act), one question is left
completely untouched: the helper ladder (5 s voice, 10 s gesture, 15 s point, 20 s first helper step, then one step
every 1.6 s) must have finished and submitted it within 40 s of the question's start. The finished question must be
marked assisted (never evidence).
usage: python tests/test_idle.py [chromium|webkit]
"""
import os, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, Log

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
# (world, game, level): the most steps per question (see each game's op budget)
CASES = [('peppa', 'P4', 3), ('peppa', 'P2', 3), ('bluey', 'B2', 2), ('bluey', 'B4', 2), ('huluwa', 'H3', 4),
         ('paw', 'A1', 2), ('paw', 'A2', 3), ('xiyou', 'X4', 2), ('avengers', 'V4', 3)]
LIMIT = 40.0


def main():
    log = Log('idle_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        page = new_page(br, base, 1180, 820, fast=False)
        enter(page)
        page.wait_for_timeout(1200)
        for w, g, lv in CASES:
            page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 31})", [w, g, lv])
            page.wait_for_function("() => window.__q && window.__q.gen", timeout=20000, polling=20)
            gen = page.evaluate("window.__q.gen")
            t0 = time.time()
            try:
                page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g || q.submitted; }", arg=gen,
                                       timeout=int(1000 * (LIMIT + 20)), polling=50)
                dt = time.time() - t0
                q = page.evaluate("window.__q") or {}
                log.check(dt <= LIMIT, '%s L%d: untouched question submitted by the helper after %.1f s (<= %d s)' % (g, lv, dt, LIMIT))
                log.check(q.get('hinted') or q.get('gen') != gen, '%s L%d: the helper-finished question is assisted (never evidence)' % (g, lv))
            except Exception as e:
                log.fail('%s L%d: not finished within %d s (%s)' % (g, lv, LIMIT + 20, str(e)[:80]))
            page.evaluate("gesture('home')")
            page.wait_for_timeout(900)
        log.check(not page.errors, 'zero page / console errors %s' % page.errors[:3])
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
