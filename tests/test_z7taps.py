# -*- coding: utf-8 -*-
"""积木城 · 变形金刚 Z7 帮大黄蜂改作业 (client 2026-11-01: "选择的时候没有正确答案"): the row of five number cards above a
number always holds the number the sentence needs there.
 01 generated (400 stories a level): every number tile that is wrong has its needed number in its card row (before: the row
    was the numbers around the one written, and 8-20 % of the stories could not be mended by tapping - 5 − 1 = 4 for
    5 − 4 = 1 offered 2 3 4 5 6)
 02 where the needed number sits in the row is not always the same place
 03 played in the app by TAPPING only (no dragging one number onto another): every story at every level is mended and
    judged right
usage: python tests/test_z7taps.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question, q, Log

log = Log('z7taps')
GEN = """() => { const R = GAMES.Z7, out = {};
  for (let lv = 1; lv <= 5; lv++) { const G = { world: R.world, W: WORLDS[R.world], rng: RNG(lv * 7 + 1), bags: {}, ws: Store.w(R.world), level: lv }; let bad = 0, n = 0; const ex = [], at = [0, 0, 0, 0, 0];
    for (let t = 0; t < 400; t++) { const q = R.gen(G, { level: lv, rng: G.rng }), st = { q, vals: q.shown.slice(), G };
      if (R.evaluate(st, q.shown.join(','))) continue;           /* right as written (together: either part first) */
      [0, 2, 3].forEach(i => { if (q.shown[i] === q.right[i]) return; n++; const r = R.rowVals(st, i), k = r.indexOf(+q.right[i]);
        if (k < 0) { bad++; if (ex.length < 3) ex.push(q.shown.join(' ') + ' -> ' + q.right.join(' ') + ' tile ' + i + ': ' + r.join(' ')); } else at[k]++; }); }
    out['L' + lv] = { bad, n, ex, at }; }
  return out; }"""
TAPS = """() => { GAMES.Z7.next = function (st, strat) {
    if (st.picked || !st.tiles) return null;
    const q = st.q, cur = st.vals, R = q.right;
    if (this.evaluate(st, cur.join(','))) return { g: 'tap', p: { id: 'done' } };
    if (cur[1] !== R[1]) return { g: 'tap', p: { id: 'op' } };
    for (const c of [0, 2, 3]) {
      if (cur[c] === R[c]) continue;
      if (st.pop && st.pop.i === c) { const k = st.pop.vals.indexOf(+R[c]); if (k < 0) { window.__noCard = (window.__noCard || 0) + 1; return { g: 'tap', p: { id: 'done' } }; } return { g: 'tap', p: { id: 'p' + k } }; }
      return { g: 'tap', p: { id: 'n' + [0, 0, 1, 2][c] } };
    }
    return { g: 'tap', p: { id: 'done' } };
  }; }"""

with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820)
    enter(page)
    for _ in range(5):
        page.evaluate("() => W3.load()")
        if page.evaluate("() => typeof W5 !== 'undefined' && W5.ready === true && !!GAMES.Z7 && !!GAMES.Z7.gen"):
            break
        page.wait_for_timeout(1500)
    r = page.evaluate(GEN)
    for lv in range(1, 6):
        x = r['L%d' % lv]
        log.check(x['bad'] == 0 and x['n'] > 50, '01 L%d: every wrong number has its needed number in its card row (%d tiles) %s' % (lv, x['n'], x['ex']))
        log.check(sum(1 for c in x['at'] if c > 0) >= 3, '02 L%d: the needed number sits in different places of the row %s' % (lv, x['at']))
    page.evaluate(TAPS)
    res = []
    for lv in (1, 2, 3, 4, 5):
        for seed in range(1, 9):
            page.evaluate("([l, s]) => { window.__noCard = 0; (Store.w('trans5').gstars || {})['Z7'] = 0; window.__go('trans5', 'Z7', l, {noDemo: true, seed: s}); }", [lv, seed])
            try:
                wait_phase(page, timeout=25000); page.wait_for_timeout(150)
                shown = page.evaluate("Session.st.q.shown.join(' ') + ' -> ' + Session.st.q.right.join(' ')")
                gen, snap = answer_question(page, 'right', max_steps=40, timeout=25000)
                wait_next_question(page, gen, timeout=30000)
                nq = q(page)
                ok = not (nq and (nq.get('retest') or nq.get('err'))) and page.evaluate("window.__noCard") == 0
                res.append((ok, 'L%d s%d %s' % (lv, seed, shown)))
            except Exception as e:
                res.append((False, 'L%d s%d %s' % (lv, seed, str(e)[:120])))
            page.evaluate("gesture('home')"); page.wait_for_timeout(150)
    bad = [m for ok, m in res if not ok]
    log.check(not bad, '03 tapping only, 40 stories over L1-L5: every one mended and judged right %s' % bad[:4])
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
