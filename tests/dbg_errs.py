import sys, os
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question
specs = [s.split(':') for s in sys.argv[1].split(',')]
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820, fast=False)
    enter(page)
    for w, g, lv in specs:
        n0 = len(page.errors)
        page.evaluate("([w,g,l]) => window.__go(w, g, Number(l), {noDemo: true, seed: 77})", [w, g, lv])
        try:
            for i in range(2):
                gen, snap = answer_question(page, 'right', timeout=30000)
                wait_next_question(page, gen, timeout=40000)
        except Exception as e:
            print(g, 'stuck', str(e)[:80])
        print(g, lv, page.errors[n0:][:3])
        page.evaluate("gesture('home')"); page.wait_for_timeout(500)
    br.close()
