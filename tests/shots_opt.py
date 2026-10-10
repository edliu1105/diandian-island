# -*- coding: utf-8 -*-
"""Screenshots for looking at: five options and the explanation after a wrong answer (worlds 1 and 2).
For every listed game: the options (landscape / portrait / 1024x768) and the explain screen at its gold mark (real speed).
usage: python tests/shots_opt.py [games=P1,B1,...] [views=land,port,ipad] [explain=1]
writes tests/logs/opt/<view>_<game>_L<level>_opts.png and ..._explain.png"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, ROOT
import test_explain as T

GAMES = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] else ['P1', 'B1', 'H3', 'A2', 'X3', 'V3']
VIEWS = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else ['land', 'port']
EXPL = (sys.argv[3] if len(sys.argv) > 3 else '1') == '1'
LEVEL = {}
for g in GAMES:
    if ':' in g:
        k, v = g.split(':'); LEVEL[k] = int(v)
GAMES = [g.split(':')[0] for g in GAMES]
VW = {'land': (1180, 820), 'port': (820, 1180), 'ipad': (1024, 768)}
OUT = os.path.join(ROOT, 'tests', 'logs', 'opt')
os.makedirs(OUT, exist_ok=True)

with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    for v in VIEWS:
        vw, vh = VW[v]
        page = new_page(br, base, vw, vh, fast=True); enter(page); page.evaluate(T.NOREV)
        wmap = page.evaluate("() => { const m = {}; Object.keys(WORLDS).forEach(w => (WORLDS[w].games || []).forEach(g => { m[g] = w; })); return m; }")
        for g in GAMES:
            w = wmap[g]
            lv = LEVEL.get(g) or page.evaluate("(w) => Math.min(3, MAXLV[w])", w)
            page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 11 + l})", [w, g, lv])
            o = T.to_answer(page, g)
            page.wait_for_timeout(400)
            page.screenshot(path=os.path.join(OUT, '%s_%s_L%d_opts.png' % (v, g, lv)))
            if EXPL:
                page.evaluate("window.__fast = 0")            # real speed from here: the explanation as the child sees it
                try:
                    answer_question(page, 'wrong', max_steps=400, timeout=25000)
                    page.wait_for_function("document.querySelector('.ringo.xgold')", timeout=30000, polling=50)
                    page.wait_for_timeout(500)
                    page.screenshot(path=os.path.join(OUT, '%s_%s_L%d_explain.png' % (v, g, lv)))
                except Exception as e:
                    print('no explain shot', g, v, str(e)[:100])
                page.evaluate("window.__fast = 1")
            page.evaluate("gesture('home')"); page.wait_for_timeout(200)
            print(v, g, lv, 'errors', page.errors[:2]); del page.errors[:]
        page.context.close()
    br.close()
