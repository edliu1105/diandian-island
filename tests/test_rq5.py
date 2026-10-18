# -*- coding: utf-8 -*-
"""积木城's three review types (pos / shape / op10, raw/js/v2.js RQ) asked on every world-5 island: each type x each game of
each island (its scene, its two watchers, its host) x 1180 x 820 / 820 x 1180 / 1024 x 768 - every tap target of the review
question on screen, on top, >= 88 CSS px, clear of the watchers (their body), the top bar and the task card (the same check
as tests/test_w5.py's targets); then answered right with the real mouse (it submits), no page error.
usage: python tests/test_rq5.py [jobs=3]        RQ5_ONLY=pos,shape for some types; RQ5_GAMES=J8,V5 for some games"""
import os, sys
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log
from test_w5 import GEO, load_games

JOBS = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 3
TYPES = os.environ.get('RQ5_ONLY', 'pos,shape,op10').split(',')


def job(args):
    vw, vh, games = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, wait_phase
    out = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, vw, vh, fast=True); enter(page); load_games(page)
        for w, g in games:
            for c in TYPES:
                for seed in (3, 11):
                    before = len(page.errors)
                    tag = '%dx%d %s %s s%d' % (vw, vh, g, c, seed)
                    try:
                        page.evaluate("([w, g, c, s]) => window.__go(w, g, 2, { seed: 7919 * s + 101, test: true, keyItems: [c], noDemo: true })", [w, g, c, seed])
                        wait_phase(page, timeout=30000); page.wait_for_timeout(350)
                        info = page.evaluate("() => ({ rv: !!Session.st.rv, t: Session.st.q.t })")
                        geo = page.evaluate(GEO)
                        gen = page.evaluate("Session.st.gen")
                        for _ in range(6):            # the right answer with the real mouse
                            xy = page.evaluate("(g) => { const st = Session.st; if (!st || st.gen !== g || st.submitted) return null; const nx = st.game.next(st, 'right'); if (!nx) return null; const e = st.map[nx.p.id]; if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }", gen)
                            if not xy: break
                            page.mouse.click(xy[0], xy[1]); page.wait_for_timeout(120)
                        sub = page.evaluate("(g) => !Session.st || Session.st.gen !== g || Session.st.submitted", gen)
                        ok = info['rv'] and info['t'] == c and not geo and sub and not page.errors[before:]
                        out.append((ok, '%s: a review question of its type %s, targets clear %s, a real click submits %s %s' % (tag, info, geo[:4], sub, page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%s: %s %s' % (tag, str(e)[:160], page.errors[before:][:1])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(80)
        br.close()
    return out


def main():
    log = Log('rq5')
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        games = page.evaluate("() => ORDER5.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        br.close()
    only = os.environ.get('RQ5_GAMES')
    if only: games = [x for x in games if x[1] in only.split(',')]
    jobs = [(vw, vh, games[i::JOBS]) for vw, vh in ((1180, 820), (820, 1180), (1024, 768)) for i in range(JOBS) if games[i::JOBS]]
    bad = 0
    with Pool(JOBS) as pool:
        for part in pool.map(job, jobs):
            for ok, msg in part:
                if not ok: bad += 1
                log.check(ok, msg)
    log.w('%d games x %d types x 3 sizes x 2 seeds' % (len(games), len(TYPES)))
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
