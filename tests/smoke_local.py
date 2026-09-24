# -*- coding: utf-8 -*-
"""quick local smoke: load, enter, play a few questions of the given games, print errors (dev aid, not a release gate)"""
import sys, os
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, answer_question, wait_next_question, wait_phase

games = sys.argv[1].split(',') if len(sys.argv) > 1 else ['peppa:P1:1']
engine = sys.argv[2] if len(sys.argv) > 2 else 'chromium'
with sync_playwright() as p, serve() as base:
    br = getattr(p, engine).launch()
    page = new_page(br, base, 1180, 820, fast=True)
    enter(page)
    for spec in games:
        w, g, lv = spec.split(':')
        page.evaluate("([w,g,l]) => window.__go(w, g, Number(l), {noDemo: true, seed: 99})", [w, g, lv])
        for i in range(3):
            try:
                gen, snap = answer_question(page, 'right')
                wait_next_question(page, gen, timeout=20000)
                print(spec, 'q', i + 1, 'ok' if snap else 'nosnap', snap and snap.get('kind'))
            except Exception as e:
                print(spec, 'q', i + 1, 'FAIL', str(e)[:200]); break
        page.evaluate("gesture('home')")
    print('errors:', page.errors[:10])
    br.close()
