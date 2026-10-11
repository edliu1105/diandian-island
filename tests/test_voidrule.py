# -*- coding: utf-8 -*-
"""Rule 3 (the client, 2026-10-10, docs/OPTIONS-EXPLAIN-SPEC.md): a session with 3 or more wrong answers on guessable
questions (a choice, two asks, a multi-select; review and key questions too) does not credit its stars.
 A  random tapping (every question: a random option, right 1 time in 5): the questions needed to collect a game's 5 stars,
    before (no rule) and after, in the app (two games, fast timings) and by simulation of the session (100 000 runs);
    after >= 5x before
 B  0-2 wrong guesses in a session: the stars exactly as before (one per question right at its first try)
 C  3 wrong guesses: no star credited (the tray lit them, at the end they fade grey and float away), no ✓, no new game,
    no memory-box step up, no mastery evidence of the right answers (the wrong ones recorded), the line "再来一局吧！",
    no celebration and no failure sound; the 5th star in such a session does not end it early
 D  leaving mid-session (home): fewer than 3 wrong guesses so far - the stars count; 3 - they do not
 E  wrong answers that cannot be guessed (give N, build, carry ...) never count; a right answer after the 2nd hint gives
    no star and is not wrong
 F  the key round: 3 wrong guesses - no gem (the key is used for the day), no pass evidence; fewer - the gem
 G  every game x level of the four worlds and the review types: guessable(st) as each game declares it
 H  the parent panel counts the sessions that did not count, per game
usage: python tests/test_voidrule.py [parts=ABCDEFGH]
log: tests/logs/voidrule.log"""
import os, sys, random, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, Log

PARTS = sys.argv[1] if len(sys.argv) > 1 else 'ABCDEFGH'
log = Log('voidrule')
OPEN = "() => { Store.s.w2all = true; Store.s.w3 = true; Store.s.w4 = true; Object.keys(WORLDS).forEach(id => { const ws = Store.w(id); ws.unlocked = true; ws.demo = {}; (WORLDS[id].games || []).forEach(g => { ws.demo[g] = true; }); }); Store.save(); }"
LIVE = "window.__q && ['act','ready','input'].includes(window.__q.phase)"
HOOK = """() => { if (window.__vr) return; window.__vr = { said: [], sfx: [] };
  const v = Voice.say.bind(Voice); Voice.say = (t, o) => { window.__vr.said.push(t); return v(t, o); };
  Object.keys(Sfx).filter(k => typeof Sfx[k] === 'function' && !['ensure', 'note', 'rebuild', 'track', 'duckTo', 'duck', 't', 'startMedia'].includes(k)).forEach(k => { const f = Sfx[k].bind(Sfx); Sfx[k] = (...a) => { window.__vr.sfx.push(k); return f(...a); }; }); }"""
STATE = """([w, g]) => { const ws = Store.w(w), m = Store.s.mem; return { stars: (ws.gstars || {})[g] || 0, wstars: ws.stars, done: W2.gameDone(w, g), voids: Ledger.voids(w, g), gems: Store.s.gems.n,
  next: (() => { const gs = WORLDS[w].games, i = gs.indexOf(g); return gs[i + 1] ? W2.gameOpen(w, gs[i + 1]) : null; })(), mem: JSON.parse(JSON.stringify(m)), mg: JSON.parse(JSON.stringify((ws.g || {})[g] || null)), key: JSON.parse(JSON.stringify(Store.s.key)) }; }"""


def fresh(page):
    """a new child: an empty save, every island open (its games open by the rules: the next one after 5 stars)"""
    page.evaluate("() => { localStorage.clear(); Store.s = defState(); Store.s.w3 = true; Store.s.w4 = true; Object.keys(WORLDS).forEach(id => { const ws = Store.w(id); ws.unlocked = true; ws.demo = {}; (WORLDS[id].games || []).forEach(g => { ws.demo[g] = true; }); }); Store.save(); }")


def session(page, w, g, lv, pattern, seed=11, quit_after=None, opt=None):
    """one session: the questions answered by `pattern` (R right, W wrong, H right after the 2nd hint); the rest right.
    quit_after: leave (home) after that many questions. Returns the state of the save after it and what was said"""
    page.evaluate("() => { window.__vr.said = []; window.__vr.sfx = []; window.__vrEnd = null; }")
    o = dict(opt or {}); o.update({'noDemo': True, 'seed': seed})
    page.evaluate("([w, g, l, o]) => window.__go(w, g, l, o)", [w, g, lv, o])
    n = 0
    lit = 0
    while True:
        page.wait_for_function("(%s) || (!Session.G && Screens.cur === 'map')" % LIVE, timeout=40000, polling=30)
        if not page.evaluate("!!Session.G"):
            break
        if quit_after is not None and n >= quit_after:
            page.evaluate("gesture('home')"); page.wait_for_timeout(200)
            break
        a = pattern[n] if n < len(pattern) else 'R'
        if a == 'H':
            page.evaluate("Session.st.assists.push('hint2')")
        page.evaluate("() => { window.__vrSfxFrom = window.__vr.sfx.length; }")
        gen, snap = answer_question(page, 'right' if a in 'RH' else 'wrong', timeout=30000, max_steps=400)
        n += 1
        page.wait_for_function("(gen) => !Session.G || !window.__q || window.__q.gen !== gen || Session.G.finishing", arg=gen, timeout=40000, polling=30)
        if page.evaluate("!!(Session.G && Session.G.finishing)"):
            lit = page.evaluate("Session.G.stars")
            page.wait_for_function("!Session.G && Screens.cur === 'map'", timeout=40000, polling=30)
            break
    page.wait_for_function("!Session.G", timeout=40000, polling=30)
    page.wait_for_timeout(150)
    st = page.evaluate(STATE, [w, g])
    st['said'] = page.evaluate("window.__vr.said.slice()")
    st['sfx'] = page.evaluate("window.__vr.sfx.slice()")
    st['n'] = n
    return st


def random_tapper(page, w, g, lv, rule, seed, cap=400):
    """questions answered by random taps until the game has its 5 stars (each question: right with p = 1 / options)"""
    fresh(page)
    page.evaluate("(v) => { Ledger.VOID = v; }", 3 if rule else 99)
    rnd = random.Random(seed)
    total, s = 0, 0
    while total < cap and not page.evaluate("([w, g]) => W2.gameDone(w, g)", [w, g]):
        page.evaluate("([w, g, l, s]) => window.__go(w, g, l, { noDemo: true, seed: s })", [w, g, lv, 1000 + seed * 101 + s])
        s += 1
        while True:
            page.wait_for_function("(%s) || (!Session.G && Screens.cur === 'map')" % LIVE, timeout=40000, polling=30)
            if not page.evaluate("!!Session.G"):
                break
            k = page.evaluate("() => { const st = Session.st; return (st.opts || []).length || (st.q.opts || []).length || 5; }")
            gen, snap = answer_question(page, 'right' if rnd.random() < 1.0 / k else 'wrong', timeout=30000, max_steps=400)
            total += 1
            page.wait_for_function("(gen) => !Session.G || !window.__q || window.__q.gen !== gen", arg=gen, timeout=40000, polling=30)
    page.evaluate("() => { Ledger.VOID = 3; }")
    return total, s


def simulate(p_right, rule, runs=100000, rounds=5, seed=1):
    """the session as the engine runs it: 5 questions a session, a star for each right one, the session ends at the 5th
    star - with the rule only when it can no longer turn void (wrong guesses + questions left < 3); with the rule a
    session with 3 wrong ones credits nothing. Mean questions to 5 stars"""
    rnd = random.Random(seed)
    tot = 0
    for _ in range(runs):
        stars, q = 0, 0
        while stars < 5:
            got, wrong = 0, 0
            for r in range(rounds):
                q += 1
                if rnd.random() < p_right:
                    got += 1
                else:
                    wrong += 1
                if stars + got >= 5 and (not rule or (wrong < 3 and wrong + rounds - r - 1 < 3)):
                    break
            if not rule or wrong < 3:
                stars += got
        tot += q
    return tot / runs


with sync_playwright() as p, serve() as base:
    br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
    page.evaluate(OPEN); page.evaluate("W3.load()"); page.wait_for_timeout(2000); page.evaluate(HOOK)

    if 'A' in PARTS:
        m_before, m_after = simulate(0.2, False), simulate(0.2, True)
        t_before, t_after = simulate(1 / 9, False, runs=20000), simulate(1 / 9, True, runs=20000)
        log.check(m_after >= 5 * m_before, 'A random tapping, 5 options (simulated): %.1f questions to a game\'s 5 stars before, %.1f after (x%.1f)' % (m_before, m_after, m_after / m_before))
        log.check(t_after >= 5 * t_before, 'A random tapping, two asks of three (simulated): %.1f before, %.1f after (x%.1f)' % (t_before, t_after, t_after / t_before))
        for k, (w, g, lv) in enumerate([('bluey2', 'C3', 1), ('paw2', 'D3', 1)]):
            runs = [(random_tapper(page, w, g, lv, False, seed=10 * k + i), random_tapper(page, w, g, lv, True, seed=10 * k + i)) for i in range(3)]
            b = sum(x[0][0] for x in runs) / 3.0; a = sum(x[1][0] for x in runs) / 3.0
            log.check(a >= 4 * b, 'A random tapping in the app, %s L%d (3 children each): %.0f questions to 5 stars before %s, %.0f after %s (x%.1f)' % (g, lv, b, [x[0][0] for x in runs], a, [x[1][0] for x in runs], a / max(1, b)))

    if 'B' in PARTS:
        fresh(page)
        for pat, want in [('RRRRR', 5 - 0), ('RWRWR', 3), ('WWRRR', 3), ('RRWRW', 3)]:
            fresh(page)
            s = session(page, 'bluey2', 'C3', 1, pat)
            want = min(want, 5)
            log.check(s['stars'] == want and s['voids'] == 0 and '再来一局吧！' not in s['said'], 'B %s (%d wrong): %d stars credited, as before (%s)' % (pat, pat.count('W'), s['stars'], s['stars']))
        fresh(page)
        s = session(page, 'avengers', 'V1', 2, 'RWRWR')
        log.check(s['stars'] == 3 and s['wstars'] == 3 and (s['mem'].get('on20') or {}).get('b') == 1, 'B a world-1 game, 2 wrong: 3 stars, the card on20 steps up to box 1 %s' % s['mem'].get('on20'))

    if 'C' in PARTS:
        fresh(page)
        page.evaluate("() => { const ws = Store.w('bluey2'); ws.gstars = { C3: 3 }; Store.save(); }")
        s = session(page, 'bluey2', 'C3', 1, 'WWWRR')
        log.check(s['stars'] == 3 and not s['done'] and s['next'] is False and s['voids'] == 1, 'C 3 wrong then 2 right with 3 stars before: still 3, no ✓, the next game (C4) still shut, counted as a session that did not count %s' % {k: s[k] for k in ('stars', 'done', 'next', 'voids')})
        log.check('再来一局吧！' in s['said'] and '玩得真开心！' not in s['said'], 'C the host says "再来一局吧！" (no "玩得真开心！") %s' % s['said'][-3:])
        bad = [x for x in s['sfx'] if x in ('complete', 'fanfare', 'thud', 'boing', 'zap', 'back')]
        log.check(not bad, 'C no celebration, no failure sound at the end %s' % bad)
        log.check(s['n'] == 5, 'C the 5th star (lit) after 3 wrong guesses does not end the session early (%d questions)' % s['n'])
        fresh(page)
        page.evaluate("() => { const ws = Store.w('bluey2'); ws.gstars = { C3: 4 }; Store.save(); }")
        s = session(page, 'bluey2', 'C3', 1, 'RRRRR')
        log.check(s['stars'] == 7 and s['done'] and s['next'] is True and '集满啦！' in s['said'] and s['n'] == 3, 'C 4 stars, then right: the 5th star in question 1 could still turn void - the session goes on until it cannot (question 3), then "集满啦！", ✓, the next game open (%d stars, %d questions)' % (s['stars'], s['n']))
        fresh(page)
        page.evaluate("() => { const ws = Store.w('bluey2'); ws.gstars = { C3: 2 }; Store.save(); }")
        s = session(page, 'bluey2', 'C3', 1, 'RRRRR')
        log.check(s['stars'] == 5 and s['done'] and s['n'] == 3 and '集满啦！' in s['said'], 'C 2 stars, then right: the 5th star in question 3 (it can no longer turn void) ends the session at once, as before (%d questions)' % s['n'])
        # world 1: the box of the game's card and its mastery evidence
        fresh(page)
        s = session(page, 'avengers', 'V1', 2, 'WWWRR')
        mg = s['mg'] or {}
        log.check(s['stars'] == 0 and (s['mem'].get('on20') or {}).get('b', 0) == 0 and mg.get('c', 0) == 0 and mg.get('n', 0) == 3,
                  'C world 1, 3 wrong + 2 right: no star, the card on20 does not step up (box %s), mastery: the 3 wrong recorded, the 2 right not (%s right of %s)' % ((s['mem'].get('on20') or {}).get('b'), mg.get('c'), mg.get('n')))
        # the fade: grey, no red
        fresh(page)
        page.evaluate("() => { window.__fade = []; if (Scope.prototype.__vr) return; const o = Scope.prototype.anim; Scope.prototype.__vr = o; Scope.prototype.anim = function (e, kf, opt) { if (e && e.parentNode && e.parentNode.id === 'tray') window.__fade.push(JSON.stringify(kf)); return o.apply(this, arguments); }; }")
        s = session(page, 'bluey2', 'C3', 1, 'WRWRW')
        fade = page.evaluate("window.__fade")
        log.check(s['stars'] == 0 and fade and all('grayscale(1)' in f and 'red' not in f for f in fade), 'C the lit stars fade grey and float away (%d stars, no red)' % len(fade))

    if 'D' in PARTS:
        fresh(page)
        s = session(page, 'bluey2', 'C3', 1, 'WRWR', quit_after=4)
        log.check(s['stars'] == 2 and s['voids'] == 0, 'D left after 2 wrong + 2 right: the 2 stars count (%d)' % s['stars'])
        fresh(page)
        s = session(page, 'bluey2', 'C3', 1, 'WWRW', quit_after=4)
        log.check(s['stars'] == 0 and s['voids'] == 1, 'D left after 3 wrong + 1 right: it does not count (%d stars, %d void)' % (s['stars'], s['voids']))
        fresh(page)
        s = session(page, 'bluey2', 'C3', 1, 'R', quit_after=1)
        log.check(s['stars'] == 1, 'D left after 1 right: 1 star (%d)' % s['stars'])

    if 'E' in PARTS:
        fresh(page)
        s = session(page, 'peppa', 'P4', 2, 'WWWRR')
        log.check(s['stars'] == 2 and s['voids'] == 0, 'E give N (P4, not guessable): 3 wrong + 2 right - the 2 stars count (%d)' % s['stars'])
        fresh(page)
        s = session(page, 'avengers2', 'W1', 2, 'WWWWR')
        log.check(s['stars'] == 1 and s['voids'] == 0, 'E the number line (W1 of the 2nd sea, a drag): 4 wrong + 1 right - 1 star (%d)' % s['stars'])
        fresh(page)
        s = session(page, 'bluey2', 'C3', 1, 'WWHHR')
        log.check(s['stars'] == 1 and s['voids'] == 0, 'E 2 wrong + 2 right after the 2nd hint + 1 right: the hinted ones give no star and are not wrong - 1 star (%d)' % s['stars'])

    if 'F' in PARTS:
        items = ['sub5', 'next10', 'on10', 'part5', 'add10']
        fresh(page)
        s = session(page, 'peppa', 'P1', 1, 'WWWRR', opt={'key': True, 'keyItems': items})
        right = [c for c in items[3:]]
        log.check(s['gems'] == 0 and s['key']['day'] >= 0 and all(not (s['mem'].get(c) or {}).get('pass') and (s['mem'].get(c) or {}).get('b', 0) == 0 for c in right),
                  'F the key round, 3 wrong: no gem (gems %d), the key used for today, the right ones no pass and no box %s' % (s['gems'], {c: (s['mem'].get(c) or {}).get('b') for c in right}))
        fresh(page)
        s = session(page, 'peppa', 'P1', 1, 'WWRRR', opt={'key': True, 'keyItems': items})
        log.check(s['gems'] == 1 and all((s['mem'].get(c) or {}).get('b', 0) == 1 for c in items[2:]), 'F the key round, 2 wrong: the gem (%d), the right ones step up %s' % (s['gems'], {c: (s['mem'].get(c) or {}).get('b') for c in items[2:]}))

    if 'G' in PARTS:
        # what each game declares (flag / its own check / the options shown), at the answer
        page.evaluate("""() => { window.__ga = []; if (Session.__ga) return; Session.__ga = Session.submit; Session.submit = function (st, v) { window.__ga.push([st.G.id, st.rv ? (st.q.t || '') : '', guessable(st)]); return Session.__ga.call(Session, st, v); }; }""")
        NOT = {'P2', 'P4', 'H2', 'Q3', 'D1', 'G2', 'G3', 'Y1', 'W1', 'F3', 'N4', 'O2', 'E2', 'K1', 'L1', 'L2'}
        PICK = {'H1', 'X2', 'Q2', 'Q4', 'C4', 'J2', 'G1', 'N1', 'N2'}
        ids = page.evaluate("() => { const out = []; Object.keys(WORLDS).forEach(w => (WORLDS[w].games || []).forEach(g => { if (GAMES[g]) out.push([w, g, Math.min(3, MAXLV[w] || 5)]); })); return out; }")
        bad, seen = [], {}
        for w, g, lv in ids:
            if g not in NOT and g not in PICK:
                continue
            page.evaluate("window.__ga = []")
            page.evaluate("([w,g,l]) => window.__go(w, g, l, { noDemo: true, seed: 5 })", [w, g, lv])
            try:
                answer_question(page, 'wrong', timeout=30000, max_steps=400); page.wait_for_timeout(80)
                r = page.evaluate("window.__ga")
                got = bool(r and r[0][2])
                seen[g] = got
                if got != (g in PICK):
                    bad.append('%s %s' % (g, got))
            except Exception as e:
                bad.append('%s %s' % (g, str(e)[:60]))
            page.evaluate("gesture('home')"); page.wait_for_timeout(60)
        log.check(not bad and len(seen) >= len(NOT | PICK) - 1, 'G picks among things in the scene / multi-selects count, built / walked / written ones do not: %d games checked %s' % (len(seen), bad))
        r = []
        for c in ['give10', 'sub5', 'cmp10', 'add10']:
            page.evaluate("window.__ga = []")
            page.evaluate("(c) => window.__go('peppa', 'P1', 1, { seed: 5, test: true, keyItems: [c], noDemo: true })", c)
            answer_question(page, 'wrong', timeout=30000, max_steps=400); page.wait_for_timeout(80)
            x = page.evaluate("window.__ga"); r.append((c, bool(x and x[0][2])))
            page.evaluate("gesture('home')"); page.wait_for_timeout(60)
        log.check(r == [('give10', False), ('sub5', True), ('cmp10', True), ('add10', True)], 'G review types: give N does not count, the choices do %s' % r)

    if 'H' in PARTS:
        fresh(page)
        session(page, 'bluey2', 'C3', 1, 'WWWRR')
        page.evaluate("Parent.panel()"); page.wait_for_timeout(300)
        txt = page.evaluate("(() => { const h = [...document.querySelectorAll('h3')].find(x => x.textContent.includes('不算星的局')); return h && h.nextElementSibling ? h.nextElementSibling.textContent : ''; })()")
        log.check('C3 1局' in txt and 'C1 0局' in txt, 'H the parent panel: per game the sessions that did not count (%s)' % txt[txt.find('C1'):txt.find('C1') + 40])
        page.evaluate("() => { const x = [...document.querySelectorAll('button')].find(b => b.textContent === '关闭'); if (x) x.click(); }")

    log.check(not [e for e in page.errors if 'ERR_' not in e], 'no page error %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
