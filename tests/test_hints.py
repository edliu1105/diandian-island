# -*- coding: utf-8 -*-
"""Hint ladder gate (U04, D08) at normal animation speed.
 - absolute deadlines from the child's last own action: 5 s voice, 10 s gesture, 15 s point, 20 s first helper step,
   then the helper shows the rest briskly: one step every 1.6 s (anchored, no drift) - an untouched question ends
   inside the 40 s attention window (test_idle.py measures it per game at normal speed)
 - time in the background never counts (the app clock stops while hidden)
 - a child who does nothing: every question still finishes, and after two helper-finished questions the session ends
usage: python tests/test_hints.py [chromium|webkit] [scale]   (scale 0.2 -> 1 / 2 / 3 / 5 / 7 s ...)"""
import os, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, wait_map, Log

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
SC = float(sys.argv[2]) if len(sys.argv) > 2 else 0.2

HIDE = """
window.__hide = (on) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => on }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => on ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); };
"""


def assists(page):
    q = page.evaluate('window.__q')
    return (q or {}).get('assists', []), q


def main():
    log = Log('hints_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        page = new_page(br, base, 1180, 820, fast=False, hint_scale=SC, extra_init=HIDE)
        enter(page)
        page.wait_for_timeout(1500)
        # ---------------------------------------------------------- 1. the ladder on a question nobody touches
        # P2 at level 3: five pigs to serve -> the helper needs several steps, so its rhythm can be measured
        page.evaluate("() => window.__go('peppa', 'P2', 3, {noDemo: true, seed: 21})")
        st = wait_phase(page, phases=('ready', 'input'), timeout=30000)
        gen = st['gen']
        a, q = [], None
        t_end = time.time() + 47 * SC + 6
        while time.time() < t_end:
            aa, qq = assists(page)
            if not qq or qq['gen'] != gen:
                break
            a, q = aa, qq
            page.wait_for_timeout(150)
        names = [x[0] for x in a]
        t = {}
        for n_, tt in a:
            t.setdefault(n_, []).append(tt)
        log.check(names[:3] == ['hint1', 'hint2', 'hint3'], 'ladder order hint1 -> hint2 -> hint3 %s' % names)
        if len(t.get('hint1', [])) and len(t.get('hint2', [])) and len(t.get('hint3', [])):
            d12 = (t['hint2'][0] - t['hint1'][0]) / SC / 1000.0
            d23 = (t['hint3'][0] - t['hint2'][0]) / SC / 1000.0
            tol = 0.1 / SC + 0.4           # one 100 ms tick, in app time
            log.check(abs(d12 - 5) < tol, 'hint 1 -> hint 2 after 5 s (measured %.2f s app time)' % d12)
            # hint 3 may wait for the gesture demo of hint 2 to finish (the hand is busy) - but never shifts later steps
            log.check(-tol < d23 - 5 < 3.8 + tol, 'hint 2 -> hint 3 after 5 s (+ the running gesture demo) (measured %.2f s)' % d23)
        autos = t.get('auto', [])
        if len(autos) >= 2:
            first = (autos[0] - t['hint1'][0]) / SC / 1000.0 + 5
            gaps = [(autos[i + 1] - autos[i]) / SC / 1000.0 for i in range(len(autos) - 1)]
            tol = 0.1 / SC + 0.4
            log.check(abs(first - 20) < tol + 0.6, 'first helper step at 20 s after the last own action (measured %.2f s)' % first)
            # the brisk steps: every 1.6 s of real time at most (the helper's hand demo itself is not scaled: with a scaled
            # ladder the gap is the demo's own length), all gaps equal - no drift
            real = [(autos[i + 1] - autos[i]) / 1000.0 for i in range(len(autos) - 1)]
            log.check(all(g <= 1.6 + 0.25 for g in real) and max(real) - min(real) < 0.3, 'then the helper shows the rest briskly: a step every <= 1.6 s, no drift (real gaps %s)' % [round(g, 2) for g in real])
        else:
            log.check(q and q['gen'] != gen, 'helper steps happened (autos %s) or the question already finished' % autos)
        log.check(q is None or q.get('hinted') or q['gen'] != gen, 'the question is marked assisted')
        page.evaluate("gesture('home')")
        page.wait_for_timeout(800)

        # ---------------------------------------------------------- 2. background time does not count
        page.evaluate("() => window.__go('peppa', 'P3', 2, {noDemo: true, seed: 22})")
        st = wait_phase(page, phases=('ready', 'input'), timeout=30000)
        gen = st['gen']
        page.wait_for_function("window.__q && (window.__q.assists || []).length >= 1", timeout=int(1000 * (10 * SC + 10)))
        a, q = assists(page)
        h1 = a[0][1]
        page.evaluate("() => window.__hide(true)")
        page.wait_for_timeout(int(1000 * 12 * SC) + 1500)          # longer than two ladder steps
        a_hidden, q2 = assists(page)
        page.evaluate("() => window.__hide(false)")
        log.check(len(a_hidden) == 1, 'while hidden the ladder stands still (%d assists)' % len(a_hidden))
        page.wait_for_function("window.__q && (window.__q.assists || []).length >= 2", timeout=int(1000 * (10 * SC + 10)))
        a, q = assists(page)
        d = (a[1][1] - h1) / SC / 1000.0
        log.check(abs(d - 5) < 0.1 / SC + 0.8, 'after returning, hint 2 comes 5 s (app time) after hint 1 - background excluded (measured %.2f s)' % d)
        page.evaluate("gesture('home')")
        page.wait_for_timeout(800)

        # ---------------------------------------------------------- 3. nobody plays: the session still ends by itself
        t0 = time.time()
        page.evaluate("() => window.__go('huluwa', 'H1', 1, {noDemo: true, seed: 23})")
        wait_phase(page, timeout=30000)
        try:
            wait_map(page, timeout=int(1000 * (2 * (20 + 7 * 1.6) * SC + 60)))
            dt = time.time() - t0
            log.ok('no input at all: every question finished by the helper and the session ended after two such questions (%.1f s)' % dt)
            st = page.evaluate("() => __state().worlds.huluwa")
            lg = st.get('log', [])[-3:]
            log.check(all(x['h'] == 1 and x['ev'] == 0 for x in lg), 'helper-finished questions are never evidence %s' % lg)
        except Exception as e:
            log.fail('no input at all: session did not end (%s)' % str(e)[:80])
        log.check(not page.errors, 'zero errors %s' % page.errors[:3])
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
