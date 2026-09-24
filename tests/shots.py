# -*- coding: utf-8 -*-
"""Capture real screenshots (for self-checks and review evidence).
usage: python tests/shots.py <outdir> [world] [game] [level] [vw] [vh] [engine]
"""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, step, q

out = sys.argv[1] if len(sys.argv) > 1 else 'shots/dev'
world = sys.argv[2] if len(sys.argv) > 2 else 'peppa'
game = sys.argv[3] if len(sys.argv) > 3 else 'P1'
level = int(sys.argv[4]) if len(sys.argv) > 4 else 1
vw = int(sys.argv[5]) if len(sys.argv) > 5 else 1180
vh = int(sys.argv[6]) if len(sys.argv) > 6 else 820
engine = sys.argv[7] if len(sys.argv) > 7 else 'chromium'
os.makedirs(out, exist_ok=True)
tag = '%s_%s_L%d_%dx%d' % (world, game, level, vw, vh)
with sync_playwright() as p, serve() as base:
    br = getattr(p, engine).launch()
    page = new_page(br, base, vw, vh, fast=False)
    page.screenshot(path=os.path.join(out, 'entry_%dx%d.png' % (vw, vh)))
    enter(page)
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(out, 'map_%dx%d.png' % (vw, vh)))
    page.evaluate("([w,g,l]) => { const ws = window.__state(); const s = JSON.parse(localStorage.getItem('ddi.v1')||'null'); window.__go(w, g, l, {noDemo: true}); }", [world, game, level])
    st = wait_phase(page, timeout=20000)
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(out, tag + '_1start.png'))
    # advance through the question, capturing each phase change
    shots = 2
    for i in range(12):
        cur = q(page)
        if not cur or cur['submitted']:
            break
        if cur['phase'] not in ('act', 'ready', 'input'):
            page.wait_for_timeout(300)
            continue
        s = step(page, 'right')
        page.wait_for_timeout(900)
        page.screenshot(path=os.path.join(out, '%s_%dstep.png' % (tag, shots)))
        shots += 1
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(out, tag + '_%dreveal.png' % shots))
    print('errors:', page.errors)
    br.close()
