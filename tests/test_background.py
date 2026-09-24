# -*- coding: utf-8 -*-
"""Backgrounding in the middle of the mathematics (R3-U04), real timings.

While the app is hidden, nothing of the running question may move on: the picture is frozen (every stage element keeps
its on-screen rectangle and opacity), the phase does not change, no timer fires. After returning, the process continues
from where it stopped and the question ends normally. Checked at the moments where it matters most:
 X4  the clones hide behind the water curtain            (phase 'show', right after the spell)
 H4  the invisible brother takes gems away               (between the last count and the theft, timer-driven)
 P3  the reveal takes the toys out of the box again      (phase 'reveal', right after a right answer)
 A2  the vehicles drive to the pen                       (phase 'show', right after the whistle)
usage: python tests/test_background.py [chromium|webkit]
"""
import os, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, wait_phase, q, step, Log

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
HIDE = """
window.__hide = (on) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => on }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => on ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); };
"""
SIG = """() => Array.from(Stage.el.children).map(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), cs.opacity, cs.visibility].join(','); }).join('|')"""


def act_until(page, gen, stop_js, max_steps=20):
    """do the right steps until stop_js is true (the moment to go to the background)"""
    for _ in range(max_steps):
        if page.evaluate(stop_js):
            return True
        cur = q(page)
        if not cur or cur['gen'] != gen:
            return False
        if cur['phase'] in ('act', 'ready', 'input') and not cur['submitted']:
            step(page, 'right')
        page.wait_for_timeout(120)
    return page.evaluate(stop_js)


def case(page, log, name, world, game, lv, stop_js, after_ms, done_js):
    page.evaluate("gesture('home')")
    page.wait_for_timeout(700)
    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 41})", [world, game, lv])
    st = wait_phase(page, phases=('act', 'ready', 'input'), timeout=30000)
    gen = st['gen']
    if not act_until(page, gen, stop_js):
        log.fail('%s: never reached the moment to test' % name)
        return
    page.wait_for_timeout(after_ms)
    ph0 = (q(page) or {}).get('phase')
    page.evaluate("() => window.__hide(true)")
    page.wait_for_timeout(150)
    s1 = page.evaluate(SIG)
    page.wait_for_timeout(3000)                       # longer than the step that was running
    s2 = page.evaluate(SIG)
    ph1 = (q(page) or {}).get('phase')
    page.evaluate("() => window.__hide(false)")
    log.check(s1 == s2 and ph0 == ph1, '%s: hidden for 3 s -> the picture and the phase (%s) stood still%s' % (name, ph0, '' if s1 == s2 else ' (changed: %d of %d elements)' % (sum(1 for a, b in zip(s1.split('|'), s2.split('|')) if a != b), len(s1.split('|')))))
    try:
        page.wait_for_function(done_js, arg=gen, timeout=15000, polling=50)
        log.ok('%s: after returning the process went on and finished' % name)
    except Exception:
        log.fail('%s: after returning the process did not finish (phase %s)' % (name, (q(page) or {}).get('phase')))


def main():
    log = Log('background_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        page = new_page(br, base, 1180, 820, fast=False, extra_init=HIDE)
        enter(page)
        page.wait_for_timeout(1200)
        ready_or_next = "(g) => { const q = window.__q; return !q || q.gen !== g || ['ready', 'input'].includes(q.phase); }"
        next_q = "(g) => { const q = window.__q; return !q || q.gen !== g; }"
        case(page, log, 'X4 clones hiding', 'xiyou', 'X4', 2, "() => window.__q && window.__q.phase === 'show'", 250, ready_or_next)
        case(page, log, 'H4 the theft', 'huluwa', 'H4', 1, "() => window.__q && window.__q.phase !== 'act' && window.__q.phase !== 'setup'", 100, ready_or_next)
        case(page, log, 'P3 reveal', 'peppa', 'P3', 2, "() => window.__q && window.__q.submitted", 300, next_q)
        case(page, log, 'A2 vehicles driving', 'paw', 'A2', 2, "() => window.__q && window.__q.phase === 'show'", 150, ready_or_next)
        log.check(not page.errors, 'zero page / console errors %s' % page.errors[:3])
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
