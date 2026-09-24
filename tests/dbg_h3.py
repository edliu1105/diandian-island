import sys, os
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820, fast=False)
    page.on('pageerror', lambda e: print('STACK', e.stack))
    enter(page)
    page.evaluate("() => window.__go('huluwa', 'H3', 2, {noDemo: true, seed: 77})")
    try:
        for i in range(2):
            gen, snap = answer_question(page, 'right', timeout=30000)
            print('answered', snap and snap.get('phase'))
            wait_next_question(page, gen, timeout=30000)
    except Exception as e:
        print('stuck', str(e)[:80], page.evaluate('window.__q && window.__q.phase'))
    br.close()
