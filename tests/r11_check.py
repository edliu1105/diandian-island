# -*- coding: utf-8 -*-
"""The R11 fixes at real speed: L2's dots sit on the line ends (both orientations, every level); T1's replay, first
hint and cheer-up say the machine's rule again (nothing dropped); L2's stuck feedback says what went wrong; R1 leaves a
breath between the reveal and the next story; S2 portrait: the walkers stand on the ground beside the doors, all on
screen.   usage: python tests/r11_check.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, wait_phase, step, q, Log
log = Log('r11_check')

GEO = """() => { const st = Session.st, pb = st.paper.getBoundingClientRect(), sc = pb.width / 130, out = [];
  st.q.v.forEach((p, i) => { const b = st.dots[i].getBoundingClientRect(); out.push(Math.hypot(b.x + b.width / 2 - (pb.x + (p[0] + 15) * sc), b.y + b.height / 2 - (pb.y + (p[1] + 15) * sc))); });
  return out; }"""


def said(page, since=0):
    return page.evaluate("(s) => window.__speechLog.filter(e => e.ch === 'narr' && e.id > s).map(e => [e.text, e.ev, e.tag, e.t])", since)


def mark(page):
    return page.evaluate("window.__speechLog.length ? window.__speechLog[window.__speechLog.length - 1].id : 0")


def go(page, w, g, lv, seed):
    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, seed])
    return wait_phase(page, timeout=40000)


with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    # 1. L2 geometry (fast)
    for tag, vw, vh in (('L', 1180, 820), ('P', 820, 1180)):
        page = new_page(br, base, vw, vh); enter(page)
        worst = 0
        for lv in (1, 2, 3, 4, 5):
            for seed in (3, 2208, 77):
                go(page, 'huluwa3', 'L2', lv, seed); page.wait_for_timeout(400)
                worst = max(worst, max(page.evaluate(GEO)))
                page.evaluate("gesture('home')"); page.wait_for_timeout(200)
        log.check(worst < 2, '%s L2: every dot on its line end (worst %.1f px over 15 questions)' % (tag, worst))
        # S2 portrait / landscape: walkers on the ground, everything on screen
        for seed in (1, 5, 99, 606):
            for lv in (1, 4, 5):
                go(page, 'xiyou3', 'S2', lv, seed); page.wait_for_timeout(500)
                r = page.evaluate("""() => { const st = Session.st, S = Stage.el.getBoundingClientRect(), bs = st.doorEls.concat(st.walkers.map(o => o.e)).map(e => e.getBoundingClientRect());
                    const doors = bs.slice(0, st.doorEls.length), walk = bs.slice(st.doorEls.length);
                    return { inside: bs.every(b => b.x >= S.x - 1 && b.right <= S.right + 1), ground: walk.every(w => Math.abs(w.bottom - (doors[0].bottom)) < 3),
                      apart: walk.every(w => w.right <= doors[0].x + 2), minDoor: Math.min(...doors.map(b => Math.min(b.width, b.height))) }; }""")
                log.check(r['inside'] and r['ground'] and r['apart'] and r['minDoor'] >= 88,
                          '%s S2 L%d seed %d: walkers on the ground left of the doors, all on screen, doors >= 88 px %s' % (tag, lv, seed, r))
                page.evaluate("gesture('home')"); page.wait_for_timeout(200)
        log.check(not page.errors, '%s no page errors %s' % (tag, page.errors[:3]))
        page.context.close()

    # 2. T1 at real speed: replay, first hint, cheer-up
    page = new_page(br, base, 1180, 820, fast=False, hint_scale=0.4); enter(page); page.wait_for_timeout(1200)
    go(page, 'avengers3', 'T1', 0, 7); page.wait_for_timeout(9000)
    prompt = page.evaluate("Session.st.prompt")
    m = mark(page); page.evaluate("gesture('relisten')"); page.wait_for_timeout(9000)
    ev = said(page, m); rel = [t for t, e, tg, _ in ev if e == 'speak' and tg == 'relisten']; dropped = [t for t, e, tg, _ in ev if e == 'dropped']
    log.check(rel == ['是就走绿色，', '不是走红色！', prompt] and not dropped, 'T1 replay: the rule, then the question %s %s' % (rel, dropped))
    # the first hint (5 s x 0.4 of quiet) and the cheer-up (hint 3) come by themselves now
    page.wait_for_timeout(16000)
    ev = said(page, m); dropped = [t for t, e, tg, _ in ev if e == 'dropped']
    hint = [t for t, e, tg, _ in ev if e == 'speak' and tg in ('hint1', 'cheer')]
    log.check(hint[:3] == ['是就走绿色，', '不是走红色！', prompt] and not dropped, 'T1 first hint: the rule, then the question %s %s' % (hint[:3], dropped))
    log.check(len(hint) >= 6 and hint[3:6] == ['是就走绿色，', '不是走红色！', prompt], 'T1 cheer-up: the whole rule again, then the question %s' % hint[3:6])
    page.evaluate("gesture('home')"); page.wait_for_timeout(500)

    # 3. L2 stuck at real speed
    for seed in (1, 2, 3, 4):
        go(page, 'huluwa3', 'L2', 3, seed); page.wait_for_timeout(5000)
        m = mark(page)
        for _ in range(20):
            cur = q(page)
            if not cur or cur['submitted'] or cur['phase'] not in ('act', 'ready', 'input'): break
            step(page, 'wrong'); page.wait_for_timeout(300)
        page.wait_for_timeout(1500)
        ev = [t for t, e, tg, _ in said(page, m) if e == 'speak']
        exp = page.evaluate("""() => { const st = Session.st; return st && st.path ? st.path[0] : null; }""")
        fb = [t for t in ev if t in ('换个点开始试试', '还有线没画到', '走不下去啦！')]
        log.check(fb and fb[0] in ('换个点开始试试', '还有线没画到'), 'L2 seed %d stuck: %s (said %s)' % (seed, fb[:1], ev[:4]))
        page.evaluate("gesture('home')"); page.wait_for_timeout(400)

    # 4. R1: a breath between the reveal and the next story
    go(page, 'paw3', 'R1', 2, 11); page.wait_for_timeout(6000)
    m = mark(page)
    for _ in range(10):
        cur = q(page)
        if not cur or cur['submitted']: break
        if cur['phase'] not in ('act', 'ready', 'input'): page.wait_for_timeout(250); continue
        step(page, 'right'); page.wait_for_timeout(300)
    page.wait_for_timeout(9000)
    ev = said(page, m)
    ends = [t0 for t, e, tg, t0 in ev if e == 'end' and tg in ('summary', 'praise')]
    nxt = [t0 for t, e, tg, t0 in ev if e == 'speak' and t.startswith('有')]
    gap = (nxt[0] - max(x for x in ends if x <= nxt[0])) if nxt and ends and any(x <= nxt[0] for x in ends) else None
    log.check(gap is not None and gap >= 600, 'R1: %s ms between the reveal and "有..." %s' % (gap, [(t, e, tg) for t, e, tg, _ in ev][:8]))
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
