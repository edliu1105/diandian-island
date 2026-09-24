import sys, os, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question
eng = sys.argv[1] if len(sys.argv) > 1 else 'webkit'
with sync_playwright() as p, serve() as base:
    br = getattr(p, eng).launch()
    page = new_page(br, base, 1180, 820, fast=True)
    enter(page)
    for run in range(3):
        page.evaluate("() => window.__go('avengers', 'V4', 2, {noDemo: true, seed: 1236})")
        last = None
        for i in range(5):
            wait_phase(page, timeout=20000, gen=last)
            gen, snap = answer_question(page, 'right'); last = gen
            wait_next_question(page, gen, timeout=20000)
        page.wait_for_timeout(3000)
        st = page.evaluate("() => ({ scr: Screens.cur, G: !!Session.G, fin: Session.G && Session.G.finishing, dead: Session.G && Session.G.dead, round: Session.G && Session.G.round, q: window.__q && window.__q.phase, map: document.querySelector('#map').classList.contains('on'), game: document.querySelector('#game').classList.contains('on'), waits: __res() })")
        print(run, json.dumps(st))
        if st['G']:
            page.evaluate("gesture('home')")
    print('errors', page.errors[:5])
    br.close()
