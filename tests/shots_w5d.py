# -*- coding: utf-8 -*-
"""Package D (⑦ 复仇者·积木楼 V5-V8): screenshots to look at by eye, and the real-pointer checks.
Shots (tests/logs/w5D/): every game at the levels asked, landscape 1180 x 820 and portrait 820 x 1180 - the question, the
right answer's reveal, then a wrong answer's explanation step by step (one shot per 下一步, clicked with the real mouse).
Pointer (W5D_POINTER=1, the default): real mouse input, not __gesture - V5 drags a story card onto a plane and taps the
other way; V6 cuts along the grid lines with the mouse held down (the right cut of the question, then 好了); V7 turns the
blocks by clicking them, then 好了. Each must end in a submitted, right question.
usage: python tests/shots_w5d.py [V5,V6,V7,V8] [levels=1,3,5]      W5D_SHOTS=0: only the pointer checks"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs', 'w5D')
os.makedirs(OUT, exist_ok=True)
GAMES = sys.argv[1].split(',') if len(sys.argv) > 1 else ['V5', 'V6', 'V7', 'V8']
LVS = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else [1, 3, 5]
# the stage point of an element (its centre) in screen px
CEN = "(id) => { const st = Session.st, e = st && st.map[id]; if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }"
SCR = "([x, y]) => { const p = Stage.toScreen(x, y); return [p.x, p.y]; }"


def shots(page, g, lv, tag):
    from harness import wait_phase, answer_question, wait_next_question
    page.evaluate("([g,l]) => { (Store.w('avengers5').gstars || {})[g] = 0; window.__go('avengers5', g, l, {noDemo: true, seed: 5 + l}); }", [g, lv])
    wait_phase(page, timeout=30000); page.wait_for_timeout(900)
    page.screenshot(path=os.path.join(OUT, '%s_L%d_%s_q.png' % (g, lv, tag)))
    gen, _ = answer_question(page, 'right', timeout=30000)
    page.wait_for_timeout(900)
    page.screenshot(path=os.path.join(OUT, '%s_L%d_%s_right.png' % (g, lv, tag)))
    wait_next_question(page, gen, timeout=30000); wait_phase(page, timeout=30000); page.wait_for_timeout(700)
    page.evaluate("() => { Store.s.settings.explain = 'step'; }")
    answer_question(page, 'wrong', timeout=30000)
    page.wait_for_function("!!document.getElementById('stepnext')", timeout=30000)
    for k in range(8):
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(OUT, '%s_L%d_%s_x%d.png' % (g, lv, tag, k + 1)))
        r = page.evaluate("(() => { const b = document.getElementById('stepnext'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
        if not r: break
        page.mouse.click(r[0], r[1])
    page.evaluate("() => { Store.s.settings.explain = 'auto'; gesture('home'); }"); page.wait_for_timeout(300)


def pointer(page, log, g, lv):
    """the right answer with the real mouse: drags (V5), cuts (V6), clicks (V7) - read from the rule's own next('right')"""
    from harness import wait_phase
    before = len(page.errors)
    page.evaluate("([g,l]) => { (Store.w('avengers5').gstars || {})[g] = 0; window.__go('avengers5', g, l, {noDemo: true, seed: 17 + l}); }", [g, lv])
    cur = wait_phase(page, timeout=30000); gen = cur['gen']; page.wait_for_timeout(500)
    how = []
    for _ in range(80):
        s = page.evaluate("(g) => { const st = Session.st; if (!st || st.gen !== g) return 'gone'; if (st.submitted) return 'sub'; if (!['act','ready','input'].includes(st.phase)) return 'wait'; return st.game.pointer ? st.game.pointer(st) : null; }", gen)
        if s in ('gone', 'sub'): break
        if s == 'wait': page.wait_for_timeout(120); continue
        if not s: break
        if s['g'] == 'click':
            xy = page.evaluate(SCR, s['at']); page.mouse.click(xy[0], xy[1]); how.append('click')
        elif s['g'] == 'drag':
            a = page.evaluate(SCR, s['from']); b = page.evaluate(SCR, s['to'])
            page.mouse.move(a[0], a[1]); page.mouse.down()
            for k in range(1, 13): page.mouse.move(a[0] + (b[0] - a[0]) * k / 12, a[1] + (b[1] - a[1]) * k / 12)
            page.mouse.up(); how.append('drag')
        elif s['g'] == 'path':
            pts = [page.evaluate(SCR, p) for p in s['pts']]
            page.mouse.move(pts[0][0], pts[0][1]); page.mouse.down()
            for i in range(1, len(pts)):
                for k in range(1, 9): page.mouse.move(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k / 8, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k / 8)
            page.mouse.up(); how.append('cut')
        page.wait_for_timeout(450)
    page.wait_for_function("(g) => !Session.st || Session.st.gen !== g || ['reveal','praise','done','correcting','explain'].includes(Session.st.phase)", arg=gen, timeout=20000)
    page.wait_for_timeout(600)
    res = page.evaluate("([g, id]) => ({ sub: !Session.st || Session.st.gen !== g || Session.st.submitted, ok: ((Store.w('avengers5').gstars || {})[id] || 0) >= 1 })", [gen, g])
    log.check(res['sub'] and res['ok'] is True and not page.errors[before:], '%s L%d %dx%d real pointer: %s -> submitted, judged right %s %s' % (g, lv, page.viewport_size['width'], page.viewport_size['height'], ','.join(how[:12]), res, page.errors[before:][:1]))
    page.evaluate("gesture('home')"); page.wait_for_timeout(200)


def main():
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    from test_w5 import load_games
    log = Log('w5D')
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch()
        if os.environ.get('W5D_POINTER', '1') == '1':
            for vw, vh in ((1180, 820), (820, 1180), (1024, 768)):
                page = new_page(br, base, vw, vh, fast=True); enter(page); load_games(page)
                for g in [x for x in GAMES if x in ('V5', 'V6', 'V7')]:
                    for lv in LVS:
                        try: pointer(page, log, g, lv)
                        except Exception as e: log.check(False, '%s L%d %dx%d real pointer: %s' % (g, lv, vw, vh, str(e)[:200]))
                page.context.close()
        if os.environ.get('W5D_SHOTS', '1') == '1':
            for vw, vh, tag in ((1180, 820, 'land'), (820, 1180, 'port')):
                page = new_page(br, base, vw, vh, fast=False, sw='block'); enter(page); load_games(page)
                for g in GAMES:
                    for lv in LVS:
                        try: shots(page, g, lv, tag)
                        except Exception as e: print('shot failed', g, lv, tag, str(e)[:200])
                log.check(not page.errors, '%s shots: no page errors %s' % (tag, page.errors[:2]))
                page.context.close()
        br.close()
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
