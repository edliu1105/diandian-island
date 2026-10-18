# -*- coding: utf-8 -*-
"""debug helper: one game at one level, answer N questions right, dump the options state; screenshots into tests/logs/opt/
usage: python tests/dbg_opt.py WORLD GAME LEVEL [seed] [n_right] [vw] [vh]"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, wait_next_question, ROOT
import test_explain as T

w, g, lv = sys.argv[1], sys.argv[2], int(sys.argv[3])
seed = int(sys.argv[4]) if len(sys.argv) > 4 else 77 + lv
nr = int(sys.argv[5]) if len(sys.argv) > 5 else 1
vw = int(sys.argv[6]) if len(sys.argv) > 6 else 1180
vh = int(sys.argv[7]) if len(sys.argv) > 7 else 820
out = os.path.join(ROOT, 'tests', 'logs', 'opt'); os.makedirs(out, exist_ok=True)
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch(); page = new_page(br, base, vw, vh, fast=True); enter(page); page.evaluate(T.NOREV)
    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, seed])
    for i in range(nr + 1):
        o = T.to_answer(page, g)
        print('Q', i, json.dumps({k: o[k] for k in ('game', 'level', 'kind', 'phase', 'two', 'answer', 'nOpts')} if o else None, ensure_ascii=False))
        for x in (o or {}).get('opts', []):
            print('   ', x)
        page.screenshot(path=os.path.join(out, 'dbg_%s_L%d_q%d.png' % (g, lv, i)))
        if i < nr:
            gen, snap = answer_question(page, 'right', timeout=25000); wait_next_question(page, gen, timeout=30000)
    print('errors', page.errors[:3])
    br.close()
