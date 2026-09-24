# -*- coding: utf-8 -*-
"""dev aid: layout report + screenshot of one game state.
usage: python tests/dbg_layout.py world game level [land|port] [question#] [reveal]"""
import sys, os, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question
sys.path.insert(0, os.path.dirname(__file__))
from test_layout import check

w, g, lv = sys.argv[1], sys.argv[2], int(sys.argv[3])
o = sys.argv[4] if len(sys.argv) > 4 else 'land'
nq = int(sys.argv[5]) if len(sys.argv) > 5 else 1
vw, vh = (1180, 820) if o == 'land' else (820, 1180)
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, vw, vh, fast=True)
    enter(page)
    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 4321 + l})", [w, g, lv])
    last = None
    for qi in range(nq):
        wait_phase(page, phases=('act', 'ready', 'input'), timeout=20000, gen=last)
        for _ in range(12):
            cur = page.evaluate('window.__q')
            if cur and cur['phase'] in ('ready', 'input'):
                break
            page.evaluate("(() => { const s = window.__next('right'); if (s) window.__gesture(s.g, s.p); })()")
            page.wait_for_timeout(120)
        if qi < nq - 1:
            gen, snap = answer_question(page, 'right')
            last = gen
            wait_next_question(page, gen)
    page.wait_for_timeout(100)
    rep = page.evaluate('window.__layoutReport()')
    for b in sorted(set(check(rep))):
        print('BAD', b)
    print(json.dumps({k: rep[k] for k in ('targets', 'actors')}, ensure_ascii=False)[:2500])
    out = 'shots/dbg_%s_%s_L%d_q%d.png' % (o, g, lv, nq)
    page.screenshot(path=out)
    print('shot', out, 'errors', page.errors)
    br.close()
