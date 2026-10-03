# -*- coding: utf-8 -*-
"""World 2: every game at difficulty 1, 3 and 5 answered right (judged right, no error), every game once answered wrong
(feedback + correction run, the retest comes), and the progress rules (one island, one game at a time; played through
or 5 stars opens the next game; all games of an island open the next island).
usage: python tests/test_w2.py [chromium|webkit]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, wait_next_question, wait_map, q, Log

ENG = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
log = Log('w2_' + ENG)
ISL = [('peppa2', 'Q'), ('bluey2', 'C'), ('pjmasks', 'J'), ('paw2', 'D'), ('huluwa2', 'G'), ('xiyou2', 'Y'), ('avengers2', 'W')]
with sync_playwright() as p, serve() as base:
    br = getattr(p, ENG).launch()
    for vw, vh in ((1180, 820), (820, 1180)):
        page = new_page(br, base, vw, vh, fast=True); enter(page)
        for w, L in ISL:
            for k in (1, 2, 3):
                g = L + str(k)
                for lv in ((1, 3, 5) if vw > vh else (2, 4)):
                    before = len(page.errors)
                    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 5 + l})", [w, g, lv])
                    try:
                        gen, snap = answer_question(page, 'right', timeout=20000)
                        wait_next_question(page, gen, timeout=20000)
                        nq = q(page)
                        ok = snap and snap.get('submitted') and not (nq and (nq.get('retest') or nq.get('err')))
                        log.check(ok and not page.errors[before:], '%dx%d %s L%d right: judged right, no error %s' % (vw, vh, g, lv, page.errors[before:][:1]))
                    except Exception as e:
                        log.fail('%dx%d %s L%d right: %s %s' % (vw, vh, g, lv, str(e)[:120], page.errors[before:][:1]))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
                if vw > vh:
                    before = len(page.errors)
                    page.evaluate("([w,g]) => window.__go(w, g, 2, {noDemo: true, seed: 9})", [w, g])
                    try:
                        gen, snap = answer_question(page, 'wrong', timeout=20000)
                        wait_next_question(page, gen, timeout=30000)
                        nq = q(page)
                        log.check(nq and nq.get('retest') and not page.errors[before:], '%s wrong: corrected, a retest follows, no error %s' % (g, page.errors[before:][:1]))
                    except Exception as e:
                        log.fail('%s wrong: %s %s' % (g, str(e)[:120], page.errors[before:][:1]))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
        log.check(not page.errors, '%dx%d zero page errors %s' % (vw, vh, page.errors[:3]))
        page.context.close()
    # ---------------- progress
    page = new_page(br, base, 1180, 820, fast=True); enter(page)
    st = page.evaluate("() => ({ open: W2.open(), u: ORDER2.map(w => Store.w(w).unlocked) })")
    log.check(not st['open'] and not any(st['u']), 'fresh save: world 2 closed %s' % st)
    page.evaluate("() => { LIVE().forEach(w => { Store.w(w).stars = 10; }); Store.save(); }")
    page.reload(); page.wait_for_function('window.__ready === true', timeout=20000); enter(page)
    st = page.evaluate("() => ({ open: W2.open(), u: ORDER2.map(w => Store.w(w).unlocked), g: ['Q1','Q2','Q3'].map(g => W2.gameOpen('peppa2', g)), set: MapView.set })")
    log.check(st['open'] and st['u'] == [True] + [False] * 6 and st['g'] == [True, False, False] and st['set'] == 2, 'world 1 passed: world 2 opens with only its first island and first game; the map shows the new sea %s' % st)
    for g in ('Q1', 'Q2', 'Q3'):
        page.evaluate("([g]) => window.__go('peppa2', g, 0, {noDemo: true, seed: 2})", [g])
        for i in range(8):
            try:
                gen, snap = answer_question(page, 'right', timeout=20000); wait_next_question(page, gen, timeout=20000)
            except Exception:
                break
        wait_map(page, timeout=60000)
        st = page.evaluate("([g]) => ({ done: W2.gameDone('peppa2', g), open: WORLDS.peppa2.games.map(x => W2.gameOpen('peppa2', x)), bluey2: Store.w('bluey2').unlocked })", [g])
        log.check(st['done'], '%s played through: done %s' % (g, st))
        if g != 'Q3':      # R6-1: the next game opened by THIS session is announced and shown (5 right answers open it mid-session)
            page.wait_for_timeout(1500)
            ann = page.evaluate("() => ({ panel: !!MapView.panel, said: JSON.stringify(window.__speechLog || []).includes('新游戏开啦') })")
            log.check(ann['panel'] and ann['said'], '%s session over: "新游戏开啦！" and the island panel opens %s' % (g, ann))
            page.evaluate("MapView.closePanel(true)")
    log.check(st['bluey2'], 'all three games of peppa2 played: bluey2 opens %s' % st)
    st = page.evaluate("() => { Store.w('bluey2').gstars = { C1: 5 }; return W2.gameOpen('bluey2', 'C2'); }")
    log.check(st, '5 stars in C1 open C2 without playing it through')
    log.check(not page.errors, 'progress: zero page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
