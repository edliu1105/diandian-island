# -*- coding: utf-8 -*-
"""葫芦娃 G3 (trace a number) with a real finger: every digit 0-9 and some teens are written with mouse moves along the
dashed path (through the app's own nearest-station matching), stroke by stroke - exactly on the line and with a wobbly
finger - in both orientations; each must finish (8 used to stop at its last point). And the Chinese school order: 9
starts at the top right and goes round counterclockwise, 1 is one straight stroke, 5 writes the bar last, 4 the vertical
last.   usage: python tests/trace_check.py [url]"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, wait_phase, Log
log = Log('trace_check')
NUMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 18, 19]

FORCE = """(n) => { const g = GAMES.G3; if (!g.__gen0) g.__gen0 = g.gen; g.gen = (G, o) => ({ k: [Math.min(5, o.level), n, Math.random()], n, answer: 'done' }); }"""
STROKES = """() => { const st = Session.st, g = st.game, S = g.geo(st).S.list, out = [];
  S.forEach(s => { const p = g.pt(st, s), c = Stage.toScreen(p.x, p.y); if (s.start || !out.length) out.push([]); out[out.length - 1].push([c.x, c.y]); });
  return out; }"""


def trace(page, strokes, wobble):
    for si, pts in enumerate(strokes):
        dense = []
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            L = math.hypot(x1 - x0, y1 - y0); k = max(1, int(L / 7))
            nx, ny = (-(y1 - y0) / L, (x1 - x0) / L) if L else (0, 0)
            for m in range(k):
                t = m / k; w = wobble * math.sin((len(dense) + si) * 0.9)
                dense.append((x0 + (x1 - x0) * t + nx * w, y0 + (y1 - y0) * t + ny * w))
        dense.append(tuple(pts[-1]))
        page.mouse.move(*dense[0]); page.mouse.down()
        for x, y in dense[1:]:
            page.mouse.move(x, y)
        page.mouse.up()
        page.wait_for_timeout(60)


with sync_playwright() as p, serve() as base:
    base = sys.argv[1] if len(sys.argv) > 1 else base
    br = p.chromium.launch()
    for tag, vw, vh in (('L', 1180, 820), ('P', 820, 1180)):
        page = new_page(br, base, vw, vh, sw='block'); enter(page)
        for wobble in (0, 9):
            bad = []
            for n in NUMS:
                page.evaluate(FORCE, n)
                page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", ['huluwa2', 'G3', 3, 7 + n])
                wait_phase(page, timeout=30000); page.wait_for_timeout(250)
                page.evaluate("() => { window.__tr = Session.st; }")          # this question (fast mode moves on at once)
                trace(page, page.evaluate(STROKES), wobble)
                r = page.evaluate("() => { const st = window.__tr; return { n: st.q.n, done: st.done, total: st.game.geo(st).S.list.length, over: !!st.over }; }")
                if not r['over'] or r['n'] != n or r['done'] != r['total']:
                    bad.append((n, r))
                page.evaluate("gesture('home')"); page.wait_for_timeout(250)
            log.check(not bad, '%s %s finger: every number written through to the end %s' % (tag, 'wobbly' if wobble else 'exact', bad))
        log.check(not page.errors, '%s no page errors %s' % (tag, page.errors[:3]))
        page.context.close()
    # the Chinese order, from the data
    page = new_page(br, base, 1180, 820, sw='block'); enter(page)
    d = page.evaluate("() => DIGITS")
    nine = d['9'][0]
    area = sum(nine[i][0] * nine[i + 1][1] - nine[i + 1][0] * nine[i][1] for i in range(7))      # the loop (up to the stem), shoelace on screen axes
    log.check(nine[0][0] > 60 and nine[0][1] < 40 and area < 0, '9: from the top right, the circle counterclockwise on screen (signed area %d), then down %s' % (area, nine))
    log.check(len(d['1']) == 1 and len(d['1'][0]) == 2, '1: one straight stroke %s' % d['1'])
    log.check(len(d['5']) == 2 and d['5'][1][0][1] == d['5'][1][1][1], '5: the vertical and the belly, then the bar on top %s' % d['5'])
    log.check(len(d['4']) == 2 and d['4'][1][0][0] == d['4'][1][1][0], '4: slant and bar, then the vertical %s' % d['4'])
    br.close()
sys.exit(0 if log.close() else 1)
