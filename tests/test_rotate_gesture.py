# -*- coding: utf-8 -*-
"""Rotation + natural gestures (R3-U03): after the iPad turns, the gesture parameters follow the new layout.

B3 (stretch the row), B4 (turn the jar), X1 (stretch the staff - horizontal in landscape, vertical in portrait):
the question starts in one orientation, the iPad turns, then the NATURAL gesture (a real pointer stroke along the new
axis / around the jar's new centre, taken from __physical) must be recognised as that gesture (not the tap fallback)
and change the scene; then the iPad turns back and the natural gesture works again.
usage: python tests/test_rotate_gesture.py [chromium|webkit]
"""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, wait_phase, q, Log

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
LAND, PORT = (1180, 820), (820, 1180)
WRAP = """() => { if (window.__glog) return; window.__glog = []; const og = window.gesture;
  window.gesture = function (n, p, m) { const r = og.apply(this, arguments); window.__glog.push({ n, id: p && p.id, r }); return r; }; }"""
CASES = [('bluey', 'B3', 1, 'stretch', 'stretch', 1), ('bluey', 'B4', 1, 'jar', 'rotate', 1), ('xiyou', 'X1', 2, 'tip', 'stretch', 1)]


def stroke(page, ph):
    pts = ph['pts']
    m = page.mouse
    m.move(pts[0]['x'], pts[0]['y'])
    m.down()
    for p in pts[1:]:
        m.move(p['x'], p['y'], steps=2)
        page.wait_for_timeout(16)
    m.up()


# the stroke comes from what is ON SCREEN (element rectangles), never from the app's gesture spec - a stale spec would
# otherwise produce a matching stale stroke and hide the bug
GEOM = """(game) => {
  const r = e => e.getBoundingClientRect(), c = e => { const b = r(e); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
  const G = Session.G, pts = [];
  const line = (a, dx, dy, n) => { for (let i = 0; i <= n; i++) pts.push({ x: a.x + dx * i / n, y: a.y + dy * i / n }); };
  if (game === 'X1') {                       /* along the staff, outwards from its base to its tip */
    const t = c(G.els.tip), s = c(G.els.staff); let dx = t.x - s.x, dy = t.y - s.y; const L = Math.hypot(dx, dy) || 1;
    const k = Stage.scale || (r(Stage.el).width / Stage.W);
    line(t, dx / L * 100 * k, dy / L * 100 * k, 10);
  } else if (game === 'B4') {                /* a quarter turn around the jar where it is now */
    const j = c(G.els.jar), b = r(G.els.jar), R = Math.max(b.width, b.height) * 0.45;
    for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (Math.PI * 0.6) * i / 12; pts.push({ x: j.x + Math.cos(a) * R, y: j.y + Math.sin(a) * R }); }
  } else if (game === 'B3') {                /* pull the row's end outwards along the row */
    const b = r(G.els.rowG), k = r(Stage.el).width / Stage.W;
    line({ x: b.left + b.width * 0.6, y: b.top + b.height / 2 }, 110 * k, 0, 10);
  }
  return { pts };
}"""


def natural(page, log, tag, gid, g, arg, game):
    ph = page.evaluate(GEOM, game)
    if not ph or not ph['pts']:
        log.fail('%s: no stroke computed' % tag)
        return
    ops0 = (q(page) or {}).get('ops', 0)
    page.evaluate("() => { window.__glog.length = 0; }")
    stroke(page, ph)
    page.wait_for_timeout(700)
    glog = page.evaluate("window.__glog")
    got = [x for x in glog if x['n'] == g and x['id'] == gid and x['r'] == 'ok']
    ops1 = (q(page) or {}).get('ops', 0)
    log.check(bool(got) and ops1 > ops0, '%s: the %s gesture along the NEW layout was recognised and acted (%s, ops %d -> %d)' % (tag, g, [(x['n'], x['r']) for x in glog], ops0, ops1))


def main():
    log = Log('rotate_gesture_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        for world, game, lv, gid, g, arg in CASES:
            for first, second in ((LAND, PORT), (PORT, LAND)):
                page = new_page(br, base, first[0], first[1], fast=True)
                enter(page)
                page.evaluate(WRAP)
                page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 17})", [world, game, lv])
                wait_phase(page, phases=('act', 'ready', 'input'), timeout=20000)
                # the question waits for this gesture now
                page.wait_for_function("(id) => { const s = window.__next('right'); return !!s && s.p && s.p.id === id; }", arg=gid, timeout=10000)
                tag = '%s L%d %s' % (game, lv, 'land->port' if first == LAND else 'port->land')
                page.set_viewport_size({'width': second[0], 'height': second[1]})
                page.wait_for_timeout(600)
                natural(page, log, tag + ' after the turn', gid, g, arg, game)
                page.set_viewport_size({'width': first[0], 'height': first[1]})
                page.wait_for_timeout(600)
                if page.evaluate("(id) => { const s = window.__next('right'); return !!s && s.p && s.p.id === id; }", gid):
                    natural(page, log, tag + ' and back again', gid, g, arg, game)
                log.check(not page.errors, '%s: zero page errors %s' % (tag, page.errors[:2]))
                page.context.close()
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
