# -*- coding: utf-8 -*-
"""Full-flow walk: every world x every level x every mini-game, answered with a strategy.

checks: zero console errors / page errors, every question answerable, ops <= budget on the 'right' path,
        every line the app speaks has <= 8 characters (TASK: opening / counting / summary lines <= 8 characters),
        answer options unique, 3-card questions put scene and card dots at different coordinates,
        all-wrong runs never exceed 2 wrong answers per round and always finish (guided rescue).
usage: python tests/test_flow.py [chromium|webkit] [worlds,comma] [strategy right|wrong]
"""
import os, sys, time, json, re
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, q, step, answer_question, wait_next_question, wait_map, Log

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
WORLDS = (sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers'])
STRAT = sys.argv[3] if len(sys.argv) > 3 else 'right'
MAXLV = {'peppa': 3, 'bluey': 3, 'huluwa': 4, 'paw': 4, 'xiyou': 4, 'avengers': 4}


# games whose scene shows the quantity as a pattern the answer cards could copy: they MUST report both layouts
NEED_LAYOUT = {'P1', 'H4', 'A2', 'X4'}
CJK = re.compile(r'[一-鿿]')


def layouts_differ(snap):
    sc = snap.get('sceneLayout')
    cards = snap.get('cardLayouts')
    if not sc or not cards:
        return snap.get('game') not in NEED_LAYOUT or not snap.get('opts')
    for c in cards:
        if len(c) == len(sc):
            a = sorted((round(x, 2), round(y, 2)) for x, y in sc)
            b = sorted((round(x, 2), round(y, 2)) for x, y in c)
            if max(abs(p[0] - r[0]) + abs(p[1] - r[1]) for p, r in zip(a, b)) < 0.08:
                return False
    return True


def run_session(page, log, world, game, level, strat):
    stars0 = page.evaluate("(w) => __state().worlds[w].stars", world)
    n_speech = page.evaluate("window.__speechCalls.length")
    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 1234 + l})", [world, game, level])
    rounds_err = []
    err_in_round = 0
    nq = 0
    last_gen = None
    t0 = time.time()
    while True:
        try:
            st = wait_phase(page, timeout=20000, gen=last_gen)
        except Exception as e:
            on_map = page.evaluate("(document.querySelector('#map').classList.contains('on') && !document.querySelector('#game').classList.contains('on')) || Screens.cur === 'finale'")
            if not on_map:
                log.fail('%s %s L%d: no answerable question and not back on the map (%s)' % (world, game, level, str(e)[:60]))
            break
        cur = q(page)
        if not cur:
            break
        gen, snap = answer_question(page, strat)
        nq += 1
        last_gen = gen
        if snap is None:
            log.fail('%s %s L%d q%d: no snapshot' % (world, game, level, nq))
            break
        opts = snap.get('opts')
        if opts is not None:
            log.check(len(set(map(str, opts))) == len(opts), '%s %s L%d q%d options unique %s' % (world, game, level, nq, opts))
            log.check(str(snap['answer']) in map(str, opts) if not isinstance(snap['answer'], str) else True, '%s %s L%d q%d answer among options' % (world, game, level, nq))
        log.check(layouts_differ(snap), '%s %s L%d q%d scene vs card coordinates differ' % (world, game, level, nq))
        if strat == 'right' and not snap.get('guided'):
            log.check(snap['ops'] <= snap['budget'], '%s %s L%d q%d ops %s <= budget %s' % (world, game, level, nq, snap['ops'], snap['budget']))
        if snap.get('err', 0) > 2:
            log.fail('%s %s L%d q%d: err=%s > 2 in a round' % (world, game, level, nq, snap['err']))
        try:
            wait_next_question(page, gen, timeout=25000)
        except Exception as e:
            log.fail('%s %s L%d q%d: next question did not come (%s)' % (world, game, level, nq, str(e)[:80]))
            break
        if page.evaluate("(document.querySelector('#map').classList.contains('on') && !document.querySelector('#game').classList.contains('on')) || Screens.cur === 'finale'"):
            break
        if nq > 40:
            log.fail('%s %s L%d: more than 40 questions in one session' % (world, game, level))
            break
    log.check(nq >= 3, '%s %s L%d: at least 3 questions answered (got %d)' % (world, game, level, nq))
    try:
        wait_map(page, timeout=30000)
        log.ok('%s %s L%d: session finished with %d questions in %.1fs' % (world, game, level, nq, time.time() - t0))
    except Exception:
        log.fail('%s %s L%d: did not return to map' % (world, game, level))
        page.evaluate("gesture('home')")
    # every spoken line (intro, prompts, counting fallbacks, summaries, corrections, praise) <= 8 characters
    said = page.evaluate("(n) => window.__speechCalls.slice(n).filter(c => c.ev === 'speak').map(c => c.text)", n_speech)
    long_lines = sorted({t for t in said if len(CJK.findall(t)) > 8})
    log.check(not long_lines, '%s %s L%d: every spoken line <= 8 characters (%d lines) %s' % (world, game, level, len(said), long_lines[:6]))
    # results and rewards: every round ends with one participation star; the right path needs exactly one question per round
    stars = page.evaluate("(w) => __state().worlds[w].stars", world) - stars0
    log.check(stars == 5, '%s %s L%d: one star per round (got %d)' % (world, game, level, stars))
    if strat == 'right':
        log.check(nq == 5, '%s %s L%d: right path = one question per round (got %d questions)' % (world, game, level, nq))
    else:
        log.check(nq == 15, '%s %s L%d: wrong path = wrong, wrong, guided per round (got %d questions)' % (world, game, level, nq))
    return nq


def main():
    log = Log('flow_%s_%s_%s' % (ENGINE, STRAT, '-'.join(WORLDS)))
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        page = new_page(br, base, 1180, 820, fast=True)
        enter(page)
        games = page.evaluate("Object.keys(GAMES)")
        for w in WORLDS:
            wg = page.evaluate("(w) => WORLDS[w].games.filter(g => GAMES[g])", w)
            for g in wg:
                for lv in range(1, MAXLV[w] + 1):
                    before = len(page.errors)
                    try:
                        run_session(page, log, w, g, lv, STRAT)
                    except Exception as e:
                        log.fail('%s %s L%d exception %s' % (w, g, lv, str(e)[:200]))
                        try:
                            page.evaluate("gesture('home')")
                        except Exception:
                            pass
                    new = page.errors[before:]
                    log.check(not new, '%s %s L%d zero console/page errors %s' % (w, g, lv, new[:3]))
        br.close()
    ok = log.close()
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
