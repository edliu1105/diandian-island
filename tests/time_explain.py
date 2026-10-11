# -*- coding: utf-8 -*-
"""How long the explanation after a wrong answer takes at real speed (client: about 2-5 s, a tap skips it).
For every game of worlds 1 and 2 at each level asked (default L2 and L5): answer wrong at real timings, measure the
'explain' phase (limit 6 s, AGAIN line included); then once more with a tap (gesture 'skip') 300 ms into the explanation -
it must end within ~1 s.
usage: python tests/time_explain.py [games=all] [levels=2,5]     e.g.  all 5  |  all 2  |  J1,C3 2,5
log: tests/logs/time_explain.log"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, Log
import test_explain as T

SEL = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] not in ('', 'all') else None
LVS = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else [2, 5]
LIMIT = 6.0
log = Log('time_explain')
WATCH = """() => { const st = Session.st, id = st.gen; window.__xt = { t0: 0, t1: 0 }; const t = setInterval(() => { const s = Session.st; const now = performance.now();
  if (s && s.gen === id && s.phase === 'explain' && !window.__xt.t0) window.__xt.t0 = now;
  if (window.__xt.t0 && !window.__xt.t1 && (!s || s.gen !== id || s.phase !== 'explain')) { window.__xt.t1 = now; clearInterval(t); } }, 10); }"""
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page); page.evaluate(T.NOREV)
    wmap = page.evaluate("() => { const m = {}; Object.keys(WORLDS).forEach(w => (WORLDS[w].games || []).forEach(g => { m[g] = w; })); return m; }")
    games = SEL or [g for w in T.W1 + T.W2 for g in page.evaluate("(w) => WORLDS[w].games", w)]
    longest = []
    for g, LV in [(g, lv) for lv in LVS for g in games]:
        w = wmap[g]
        res = []
        for skip in (False, True):
            page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 21})", [w, g, LV])
            try:
                page.wait_for_function("window.__q && ['act','ready','input'].includes(window.__q.phase)", timeout=30000)
                page.evaluate("window.__fast = 0")
                page.evaluate(WATCH)
                answer_question(page, 'wrong', max_steps=400, timeout=30000)
                page.wait_for_function("window.__xt && window.__xt.t0 > 0", timeout=30000, polling=20)
                if skip:
                    page.wait_for_timeout(300); page.evaluate("gesture('skip')")
                page.wait_for_function("window.__xt.t1 > 0", timeout=40000, polling=20)
                d = page.evaluate("(window.__xt.t1 - window.__xt.t0) / 1000")
                res.append(round(d, 1))
            except Exception as e:
                res.append(None); print(g, 'error', str(e)[:100])
            page.evaluate("window.__fast = 1"); page.evaluate("gesture('home')"); page.wait_for_timeout(150)
        full, skipped = res
        longest.append((full or 0, '%s L%d' % (g, LV)))
        log.check(full is not None and full <= LIMIT, '%s L%d: the explanation takes %s s at real speed (aim 2-5 s, limit %g s)' % (g, LV, full, LIMIT))
        log.check(skipped is not None and skipped <= 1.6, '%s L%d: a tap skips it (%s s)' % (g, LV, skipped))
    log.w('longest: %s' % sorted(longest, reverse=True)[:8])
    log.check(not page.errors, 'no page error %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
