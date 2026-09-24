# -*- coding: utf-8 -*-
"""Pedagogy gate: guessing can never unlock, mastery needs all four games and every required kind,
(a guessing child = follows a fixed strategy wherever the answer is a choice among options; an answer that must be
 built - pour, give N, pair, pay - cannot be guessed and is wrong),
evidence survives a reload, assisted / guided answers never count, probes ask required kinds a level never asks,
a wrong answer is retested with the same kind.
TASK acceptance ('hundreds'): one fixed tap position for 300+ rounds -> the level never rises, the next world stays locked,
the participation stars still grow by one per round.
H3 variety (R3-J01): a child who always sends exactly one brother into the cave and answers right every time never
passes H3's gate (the split must vary); a child who varies the split and answers right does.
R3-C02: the guessing habits in ALL six worlds (answer-blind 'build:K' habits where answers are built); a natural chain
from a fresh save through all six worlds (reload after each world) up to the finale.
usage: python tests/test_pedagogy.py [chromium|webkit] [part,...]   parts: fixed,hundreds,variety,chain,unlock,persist,hint,probe,retest"""
import os, sys, time, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question, wait_map, Log, q, step

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
PARTS = sys.argv[2].split(',') if len(sys.argv) > 2 else ['fixed', 'hundreds', 'variety', 'chain', 'unlock', 'persist', 'hint', 'probe', 'retest']
COMBOS = [('pos:0', 'build:1'), ('pos:2', 'build:3'), ('min', 'build:2'), ('max', 'build:1'), ('rand', 'build:3')]


def reset(page):
    page.evaluate("() => { localStorage.clear(); }")
    page.reload()
    page.wait_for_function('window.__ready === true', timeout=20000)
    enter(page)


def answer_guessing(page, strat, max_steps=40, timeout=15000):
    """a child who only guesses: where the answer is a choice among options it follows `strat` (a fixed position,
    always the smallest / middle / biggest, random); where the answer has to be BUILT (pour, give N, pair, pay ...)
    there is nothing to pick - a guesser cannot build the exact amount, so those answers are wrong. Guided questions
    are followed (a guided child is led by the hand). Preliminary acts ignore the strategy in every game."""
    st = wait_phase(page, timeout=timeout)
    gen = st['gen']
    snap = None
    for _ in range(max_steps):
        cur = q(page)
        if not cur or cur['gen'] != gen:
            break
        if cur['submitted']:
            snap = cur
            break
        if cur['phase'] not in ('act', 'ready', 'input'):
            page.wait_for_timeout(15)
            continue
        choice, build = strat if isinstance(strat, tuple) else (strat, 'wrong')
        s = 'right' if cur.get('guided') else (choice if cur.get('opts') else build)
        if step(page, s) is None:
            page.wait_for_timeout(15)
            continue
        page.wait_for_timeout(5)
    if snap is None:
        snap = q(page)
    return gen, snap


def play_session(page, world, game, strat='right', level=None, seed=None, max_q=40, guess=False):
    """one whole session; returns the list of question snapshots (at submit)"""
    opt = {'noDemo': True}
    if seed is not None:
        opt['seed'] = seed
    page.evaluate("([w,g,l,o]) => window.__go(w, g, l, o)", [world, game, level or 0, opt])
    snaps, last = [], None
    for _ in range(max_q):
        try:
            wait_phase(page, timeout=20000, gen=last)
        except Exception:
            break
        gen, snap = answer_guessing(page, strat) if guess else answer_question(page, strat)
        last = gen
        if snap:
            snaps.append(snap)
        try:
            wait_next_question(page, gen, timeout=25000)
        except Exception:
            break
        if page.evaluate("document.querySelector('#map').classList.contains('on') && !document.querySelector('#game').classList.contains('on')"):
            break
    wait_map(page, timeout=30000)
    return snaps


def world_report(page, w):
    return page.evaluate("(w) => Mastery.gateReport(w)", w)


def main():
    log = Log('pedagogy_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        page = new_page(br, base, 1180, 820, fast=True)
        enter(page)
        games = {w: page.evaluate("(w) => WORLDS[w].games", w) for w in ['peppa', 'bluey', 'huluwa']}
        games_all = {w: page.evaluate("(w) => WORLDS[w].games", w) for w in ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']}

        # ---------------------------------------------------------------- guessing strategies never unlock
        if 'fixed' in PARTS:
            # R3-C02: every world; a guesser = a position / rank / random habit on answer cards AND an answer-blind habit
            # where the answer is built or picked in the scene ('build:K': always build / send / pour / pay / stretch K,
            # always the K-th place) - never reading the answer
            combos = COMBOS if ENGINE == 'chromium' else COMBOS[:3]
            for w in ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']:
                for choice, build in combos:
                    strat = choice + '/' + build
                    reset(page)
                    page.evaluate("() => { ORDER.forEach(o => { Store.w(o).unlocked = true; }); Store.save(); }")
                    for rnd in range(3):
                        for g in games_all[w]:
                            play_session(page, w, g, (choice, build), seed=100 + rnd * 7 + len(strat), guess=True)
                    st = page.evaluate("(w) => __state().worlds[w]", w)
                    rep = world_report(page, w)
                    log.check(not st['cleared'], '%s strategy %-14s: world NOT cleared (level %s, per-game ok %s)' % (w, strat, st['level'], [(x['g'], x['ok'], x['right7']) for x in rep['per']]))
                    # the games where the habit produced wrong first answers must be blocked on their own
                    for x in rep['per']:
                        g = x['g']
                        gs = st.get('g', {}).get(g, {'n': 0, 'c': 0})
                        if gs.get('n', 0) and gs.get('c', 0) < gs.get('n', 0):
                            log.check(not x['ok'], '%s %s strategy %s: game gate blocked (%d/%d right, last7 %d)' % (w, g, strat, gs['c'], gs['n'], x['right7']))

        # ---------------------------------------------------------------- R3-C02: natural unlocking through all six worlds
        if 'chain' in PARTS:
            reset(page)
            order = page.evaluate('ORDER')
            for i, w in enumerate(order):
                log.check(page.evaluate('(w) => __state().worlds[w].unlocked', w), 'chain: %s is open before it is played (%s)' % (w, 'open from the start' if i < 2 else 'opened by the world before it'))
                sess = 0
                while sess < 40 and not page.evaluate('(w) => __state().worlds[w].cleared', w):
                    play_session(page, w, games_all[w][sess % 4], 'right', seed=2000 + 50 * i + sess)
                    sess += 1
                st = page.evaluate('(w) => __state().worlds[w]', w)
                log.check(st['cleared'], 'chain: %s cleared by a child who understands (%d sessions, level %d)' % (w, sess, st['level']))
                page.reload(); page.wait_for_function('window.__ready === true', timeout=20000); enter(page)   # every world across a reload
                if i + 1 < len(order):
                    nxt = order[i + 1]
                    if i + 1 >= 2:
                        log.check(page.evaluate('(w) => __state().worlds[w].unlocked', nxt), 'chain: %s opened by itself after %s (kept across a reload)' % (nxt, w))
            s_ = page.evaluate('() => __state()')
            log.check(s_.get('finaleDue') or s_.get('finaleSeen'), 'chain: all six worlds cleared -> the finale is due / seen')

        # ---------------------------------------------------------------- TASK: the same position for hundreds of rounds
        if 'hundreds' in PARTS:
            # the games whose answer is a choice among three places (a 'fixed position' exists there; in P2 / P4 /
            # B2 / B4 the child builds the answer, the strategy has no position to stick to)
            for w, strat, g4 in [('peppa', 'pos:0', ['P1', 'P3']), ('bluey', 'pos:2', ['B1', 'B3'])]:
                reset(page)
                stars0 = page.evaluate("(w) => __state().worlds[w].stars", w)
                levels, sess, t0 = [], 0, time.time()
                while sess < 64:                          # 64 sessions x 5 rounds = 320 rounds
                    play_session(page, w, g4[sess % 2], strat, seed=900 + sess, guess=True)
                    sess += 1
                    levels.append(page.evaluate("(w) => __state().worlds[w].level", w))
                st = page.evaluate("(w) => __state().worlds[w]", w)
                rounds = 5 * sess
                log.check(max(levels) <= 1, '%s: %d rounds always tapping %s -> the level never rose (levels seen %s)' % (w, rounds, strat, sorted(set(levels))))
                log.check(not st['cleared'], '%s: %d rounds of %s -> world NOT cleared' % (w, rounds, strat))
                rep = world_report(page, w)
                log.check(not any(x['ok'] for x in rep['per'] if x['g'] in g4), '%s: %d rounds of %s -> no game gate passed %s' % (w, rounds, strat, [(x['g'], x['right7']) for x in rep['per'] if x['g'] in g4]))
                log.check(not page.evaluate("() => __state().worlds.huluwa.unlocked"), '%s: %d rounds of %s -> the next world stays locked' % (w, rounds, strat))
                log.check(st['stars'] - stars0 == rounds, '%s: participation stars still grow one per round (%d stars for %d rounds, %.0f s)' % (w, st['stars'] - stars0, rounds, time.time() - t0))

        # ---------------------------------------------------------------- H3: a self-made split must vary
        if 'variety' in PARTS:
            for strat, want_ok in (('split1', False), ('keep1', False), ('right', True)):
                reset(page)
                for sess in range(4):
                    play_session(page, 'huluwa', 'H3', strat, level=2, seed=700 + sess)
                rep = world_report(page, 'huluwa')
                h3 = [x for x in rep['per'] if x['g'] == 'H3'][0]
                gs = page.evaluate("() => (__state().worlds.huluwa.g || {}).H3 || {}")
                if want_ok:
                    log.check(h3['ok'], 'H3 split varied and answered right: the game gate passes (right7 %s, kinds %s, variety %s, splits %s)' % (h3['right7'], h3['kindsOk'], h3.get('varOk'), gs.get('v')))
                else:
                    log.check(not h3['ok'] and h3['right7'] >= 6, 'H3 %s answered right every time: the game gate stays shut (right7 %s, variety %s, splits %s)' % ({'split1': '"always send one"', 'keep1': '"always keep one outside"'}[strat], h3['right7'], h3.get('varOk'), gs.get('v')))

        # ---------------------------------------------------------------- all four games needed; then unlock
        if 'unlock' in PARTS:
            reset(page)
            for w in ['peppa', 'bluey']:
                g4 = games[w]
                for rnd in range(3):
                    for g in g4[:3]:
                        play_session(page, w, g, 'right', seed=300 + rnd)
                st = page.evaluate("(w) => __state().worlds[w]", w)
                rep = world_report(page, w)
                log.check(not st['cleared'], '%s: three games mastered, fourth never played -> NOT cleared (%s)' % (w, [(x['g'], x['ok']) for x in rep['per']]))
                for rnd in range(3):
                    play_session(page, w, g4[3], 'right', seed=400 + rnd)
                    if page.evaluate("(w) => __state().worlds[w].cleared", w):
                        break
                st = page.evaluate("(w) => __state().worlds[w]", w)
                rep = world_report(page, w)
                log.check(st['cleared'], '%s: all four games mastered -> cleared (level %d, windows %d, acc %.2f, per %s)' % (w, st['level'], st['windows'], rep['acc'], [(x['g'], x['ok'], x['right7'], x['kindsOk']) for x in rep['per']]))
            log.check(page.evaluate("() => __state().worlds.huluwa.unlocked"), 'huluwa unlocked once peppa AND bluey are cleared')
            log.check(not page.evaluate("() => __state().worlds.paw.unlocked"), 'paw still locked (needs huluwa)')

        # ---------------------------------------------------------------- evidence survives a reload (J01-a)
        if 'persist' in PARTS:
            reset(page)
            g4 = games['peppa']
            for rnd in range(3):
                for g in g4[:2]:
                    play_session(page, 'peppa', g, 'right', seed=500 + rnd)
            before = page.evaluate("() => __state().worlds.peppa")
            page.reload(); page.wait_for_function('window.__ready === true', timeout=20000); enter(page)
            after = page.evaluate("() => __state().worlds.peppa")
            same = all(json.dumps(before['g'].get(g), sort_keys=True) == json.dumps(after['g'].get(g), sort_keys=True) for g in g4[:2])
            log.check(same and before['g'], 'reload keeps per-game evidence %s' % {g: after['g'].get(g) for g in g4[:2]})
            log.check(json.dumps(before['win'], sort_keys=True) == json.dumps(after['win'], sort_keys=True) and len(after['win']) == len(before['win']), 'reload keeps the level window (%d entries with game ids)' % len(after['win']))
            log.check(len(after.get('log', [])) == len(before.get('log', [])), 'reload keeps the answer log (%d)' % len(after.get('log', [])))
            for rnd in range(4):
                for g in g4[2:]:
                    play_session(page, 'peppa', g, 'right', seed=600 + rnd)
                if page.evaluate("() => __state().worlds.peppa.cleared"):
                    break
            rep = world_report(page, 'peppa')
            log.check(page.evaluate("() => __state().worlds.peppa.cleared"), 'two games -> reload -> two other games -> cleared (%s)' % [(x['g'], x['ok']) for x in rep['per']])

        # ---------------------------------------------------------------- an assisted answer is never evidence (J02)
        if 'hint' in PARTS:
            hp = new_page(br, base, 1180, 820, fast=True, hint_scale=0.05)
            enter(hp)
            hp.evaluate("() => window.__go('peppa', 'P1', 1, {noDemo: true, seed: 42})")
            st0 = wait_phase(hp, timeout=20000)
            # do the jump (act), then wait for the hint ladder (scaled: 5 s -> 100 ms) before answering
            for _ in range(10):
                cur = hp.evaluate('window.__q')
                if cur['phase'] in ('ready', 'input'):
                    break
                hp.evaluate("(() => { const s = window.__next('right'); if (s) window.__gesture(s.g, s.p); })()")
                hp.wait_for_timeout(100)
            g0 = hp.evaluate('window.__q.gen')
            hp.wait_for_timeout(420)                       # hint 1 at 250 ms (scaled), the helper would act only at 1250 ms
            cur = hp.evaluate('window.__q')
            log.check(cur['gen'] == g0 and cur['hinted'], 'after the first hint the question is marked assisted (%s, gen %s/%s)' % (cur.get('phase'), cur['gen'], g0))
            gen, snap = answer_question(hp, 'right')
            wait_next_question(hp, gen, timeout=20000)
            gs = hp.evaluate("() => (__state().worlds.peppa.g || {}).P1 || { n: 0 }")
            lg = hp.evaluate("() => (__state().worlds.peppa.log || []).slice(-1)[0]")
            log.check(gs.get('n', 0) == 0 and lg and lg['h'] == 1 and lg['ev'] == 0, 'assisted right answer: logged (h=1, ev=0) but not evidence (P1 n=%s)' % gs.get('n'))
            # relisten (tap the avatar) also marks the question as assisted
            wait_phase(hp, timeout=20000, gen=gen)
            for _ in range(10):
                cur = hp.evaluate('window.__q')
                if cur['phase'] in ('ready', 'input'):
                    break
                hp.evaluate("(() => { const s = window.__next('right'); if (s) window.__gesture(s.g, s.p); })()")
                hp.wait_for_timeout(50)
            hp.evaluate("gesture('relisten')")
            log.check(hp.evaluate('window.__q.hinted'), 'relisten marks the question as assisted')
            # a math act (H3 split) with a hint is assisted too
            hp.evaluate("gesture('home')")
            hp.evaluate("() => window.__go('huluwa', 'H3', 1, {noDemo: true, seed: 3})")
            wait_phase(hp, phases=('act',), timeout=20000)
            hp.wait_for_timeout(420)
            log.check(hp.evaluate('window.__q.hinted'), 'H3: a hint during the split (math act) marks the question as assisted')
            hp.evaluate("gesture('home')")
            # a non-math act (P1 jump) with a nudge is not
            hp.evaluate("() => window.__go('peppa', 'P1', 1, {noDemo: true, seed: 4})")
            wait_phase(hp, phases=('act',), timeout=20000)
            hp.wait_for_timeout(420)
            log.check(hp.evaluate('window.__q.phase') == 'act' and not hp.evaluate('window.__q.hinted'), 'P1: a nudge before the jump (not the math) does not spoil the question')
            hp.evaluate("gesture('home')")
            log.check(not hp.errors, 'hint page: zero errors %s' % hp.errors[:3])
            hp.context.close()

        # ---------------------------------------------------------------- probes for required kinds (J01-b)
        if 'probe' in PARTS:
            reset(page)
            page.evaluate("() => { const w = Store.w('peppa'); w.level = 3; w.floor = 3; Store.save(); }")
            seen = []
            for rnd in range(2):
                snaps = play_session(page, 'peppa', 'P1', 'right', seed=700 + rnd)
                seen += [(s['kind'], s['level']) for s in snaps]
            k = page.evaluate("() => ((__state().worlds.peppa.g || {}).P1 || { k: {} }).k")
            log.check(('sub', 1) in seen or ('sub', 2) in seen, 'floor L3 (only "chunk" asked): a "sub" probe at its own level was asked %s' % seen)
            log.check(k.get('sub', 0) >= 1, 'the probe answer counts for the required kind (k=%s)' % k)
            win = page.evaluate("() => __state().worlds.peppa.win")
            log.check(len(win) <= len([s for s in seen if s[1] == 3]), 'probes never enter the level window (%d window entries)' % len(win))

        # ---------------------------------------------------------------- retest keeps the kind (R2-J03); guided after two errors
        if 'retest' in PARTS:
            reset(page)
            page.evaluate("() => window.__go('bluey', 'B1', 2, {noDemo: true, seed: 55})")
            st0 = wait_phase(page, timeout=20000)
            k0 = st0['kind']
            gen, snap = answer_question(page, 'wrong')
            st1 = wait_phase(page, timeout=25000, gen=gen)
            log.check(st1['retest'] and st1['kind'] == k0, 'after a wrong "%s" the retest asks "%s" again (retest=%s)' % (k0, st1['kind'], st1['retest']))
            gen, snap = answer_question(page, 'wrong')
            st2 = wait_phase(page, timeout=25000, gen=gen)
            log.check(st2['guided'] and st2['kind'] == k0, 'after two errors the same kind is guided (guided=%s, kind=%s)' % (st2['guided'], st2['kind']))
            gen, snap = answer_question(page, 'right')
            wait_next_question(page, gen, timeout=25000)
            lg = page.evaluate("() => (__state().worlds.bluey.log || []).slice(-3)")
            log.check(len(lg) == 3 and lg[-1]['gd'] == 1 and lg[-1]['ev'] == 0, 'the guided answer is logged but never evidence %s' % lg)
            page.evaluate("gesture('home')")

        log.check(not page.errors, 'zero console/page errors %s' % page.errors[:3])
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
