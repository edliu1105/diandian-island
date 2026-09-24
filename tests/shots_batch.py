# -*- coding: utf-8 -*-
"""Batch real screenshots: for each (world, game, level) capture the answerable state and the reveal.
usage: python tests/shots_batch.py <outdir> <engine> <vw>x<vh> world:game:level [world:game:level ...]
"""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, step, q

out, engine, vp = sys.argv[1], sys.argv[2], sys.argv[3]
vw, vh = map(int, vp.split('x'))
specs = [s.split(':') for s in sys.argv[4:]]
os.makedirs(out, exist_ok=True)
with sync_playwright() as p, serve() as base:
    br = getattr(p, engine).launch()
    page = new_page(br, base, vw, vh, fast=False)
    enter(page)
    page.wait_for_timeout(800)
    for w, g, lv in specs:
        tag = '%s_%s_L%s_%dx%d' % (w, g, lv, vw, vh)
        page.evaluate("([w,g,l]) => window.__go(w, g, Number(l), {noDemo: true, seed: 77})", [w, g, lv])
        try:
            wait_phase(page, timeout=25000)
        except Exception as e:
            print('no question', tag, e)
            continue
        # drive until the question is answerable (past any act stage)
        for i in range(8):
            cur = q(page)
            if cur and cur['phase'] in ('ready', 'input') and not cur['submitted']:
                break
            if cur and cur['phase'] == 'act':
                step(page, 'right')
            page.wait_for_timeout(700)
        page.wait_for_timeout(1300)
        page.screenshot(path=os.path.join(out, tag + '_a_ready.png'))
        for i in range(14):
            cur = q(page)
            if not cur or cur['submitted']:
                break
            if cur['phase'] not in ('act', 'ready', 'input'):
                page.wait_for_timeout(300)
                continue
            step(page, 'right')
            page.wait_for_timeout(420)
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(out, tag + '_b_reveal.png'))
        page.evaluate("gesture('home')")
        page.wait_for_timeout(700)
    print('errors:', page.errors)
    br.close()
