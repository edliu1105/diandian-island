# -*- coding: utf-8 -*-
"""Stars are earned, games open by stars (client rules):
1. every game of both seas: after a wrong answer the next question is a NEW one (another question key), same kind;
   the round with the mistake earns no star (stars in the session and the game's stars unchanged after wrong + right)
2. a session with fewer than 5 stars: the game is not done, the next game stays locked, the island panel shows its
   stars (n of 5); the tray starts with them next time; the 5th star opens the next game ("新游戏开啦！")
3. a save from before the rule: sea 1 stays as earned (passed, gate open, games checked); sea 2's played-through games
   with < 5 stars are not done, their flag comes down, nothing played is locked again
usage: python tests/test_stars.py [jobs=3]"""
import os, sys, json
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log, ROOT

KEY = "(() => { const st = Session.st; return st && st.q ? JSON.stringify(st.game.key(st.q)) : null; })()"


def per_game(ids):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_phase
    out = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        for w, g, lv in ids:
            res = {'g': g}
            try:
                page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 13})", [w, g, lv])
                for t in range(3):                                       # three wrong answers in a row: three new questions
                    st = wait_phase(page, timeout=20000); k0 = page.evaluate(KEY); kind0 = st['kind']
                    gen, snap = answer_question(page, 'wrong', timeout=20000); wait_next_question(page, gen, timeout=30000)
                    st = wait_phase(page, timeout=20000); k1 = page.evaluate(KEY)
                    res.setdefault('diff', []).append(k0 != k1); res.setdefault('kind', []).append(st['kind'] == kind0 and st['retest'])
                gen, snap = answer_question(page, 'right', timeout=20000); wait_next_question(page, gen, timeout=30000)
                res['stars'] = page.evaluate("[Session.G.stars, (Session.G.ws.gstars || {})[Session.G.id] || 0]")
            except Exception as e:
                res['err'] = str(e)[:160]
            res['pe'] = page.errors[:2]; del page.errors[:]
            page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            out.append(res)
        br.close()
    return out


def rules(log):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_map
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        page.evaluate("() => { LIVE().forEach(w => { Store.w(w).pass = true; }); Store.s.gateShown = true; Store.s.w2seen = true; Store.save(); }")
        page.reload(); page.wait_for_function('window.__ready === true', timeout=20000); enter(page); page.wait_for_timeout(600)
        # a session: right, wrong (+ its new question right), right, wrong (+ right), wrong (+ right) -> 2 stars
        page.evaluate("window.__go('peppa2', 'Q1', 0, {noDemo: true, seed: 3})")
        plan = ['right', 'wrong', 'right', 'right', 'wrong', 'right', 'wrong', 'right', 'right', 'right', 'right']
        for s in plan:
            try:
                gen, snap = answer_question(page, s, timeout=20000); wait_next_question(page, gen, timeout=30000)
            except Exception:
                break
            if page.evaluate("!Session.G"): break
        wait_map(page, timeout=60000); page.wait_for_timeout(1200)
        st = page.evaluate("() => ({ stars: W2.stars('peppa2', 'Q1'), done: W2.gameDone('peppa2', 'Q1'), q2: W2.gameOpen('peppa2', 'Q2'), said: JSON.stringify(window.__speechLog).includes('新游戏开啦') })")
        log.check(st['stars'] < 5 and not st['done'] and not st['q2'] and not st['said'], 'a session with mistakes: %s stars (only first-try right answers), Q1 not done, Q2 still locked %s' % (st['stars'], st))
        n1 = st['stars']
        page.evaluate("MapView.closePanel(true); MapView.openPanel('peppa2')"); page.wait_for_timeout(500)
        pn = page.evaluate("() => ({ rows: [...MapView.panel.querySelectorAll('.gstars')].map(r => +r.dataset.n), lock: !!MapView.panel.querySelector('[data-game=\"Q2\"] svg') })")
        log.check(pn['rows'] == [n1] and pn['lock'], 'the island panel: Q1 shows %d of 5 stars, Q2 has its lock %s' % (n1, pn))
        page.screenshot(path=os.path.join(ROOT, 'tests', 'logs', 'stars_panel.png'))
        page.wait_for_timeout(500); page.click('[data-game="Q2"]'); page.wait_for_timeout(300)
        log.check(page.evaluate("JSON.stringify(window.__speechLog).includes('先集满五颗星')") and page.evaluate("!Session.G"), 'a locked game: "先集满五颗星！", it does not start')
        page.evaluate("MapView.closePanel(true)")
        # next session: the tray starts with the stars already earned; the 5th star opens Q2
        page.evaluate("window.__go('peppa2', 'Q1', 0, {noDemo: true, seed: 4})")
        page.wait_for_function("!!Session.st", timeout=20000)
        tray = page.evaluate("document.querySelectorAll('#tray i.on').length")
        log.check(tray == min(n1, 4), 'the next session: the tray starts with the %d stars already earned (%d)' % (n1, tray))
        for i in range(8):
            try:
                gen, snap = answer_question(page, 'right', timeout=20000); wait_next_question(page, gen, timeout=30000)
            except Exception:
                break
            if page.evaluate("!Session.G"): break
        wait_map(page, timeout=60000); page.wait_for_timeout(1500)
        st = page.evaluate("() => ({ stars: W2.stars('peppa2', 'Q1'), done: W2.gameDone('peppa2', 'Q1'), q2: W2.gameOpen('peppa2', 'Q2'), said: JSON.stringify(window.__speechLog).includes('新游戏开啦'), panel: !!MapView.panel })")
        log.check(st['done'] and st['q2'] and st['said'] and st['panel'], '5 stars: Q1 done, Q2 opens, "新游戏开啦！" with the panel %s' % st)
        log.check(not page.errors, 'rules: zero page errors %s' % page.errors[:3])
        # ---- an old save: sea 1 played through (some games < 5 stars), sea 2 peppa2 played through with 2 stars each
        page.evaluate("""() => {
            const s = JSON.parse(JSON.stringify(Store.s)); delete s.star5;
            LIVE().forEach(w => { const ws = s.worlds[w]; ws.unlocked = true; ws.pass = false; ws.gdone = {}; ws.gstars = {}; WORLDS[w].games.forEach(g => { ws.gdone[g] = true; ws.gstars[g] = 2; }); });
            const pw = s.worlds.peppa2; pw.unlocked = true; pw.gdone = {}; pw.gstars = {}; pw.played = ['Q1', 'Q2', 'Q3', 'Q4']; ['Q1', 'Q2', 'Q3', 'Q4'].forEach(g => { pw.gdone[g] = true; pw.gstars[g] = 2; });
            s.worlds.bluey2.unlocked = true; s.worlds.bluey2.gdone = { C1: true }; s.worlds.bluey2.gstars = { C1: 1 }; s.worlds.bluey2.played = ['C1'];
            s.flags = LIVE().concat(['peppa2']); s.gateShown = true; s.w2seen = true; s.mapSet = 2;
            localStorage.setItem('ddi.v1', JSON.stringify(s)); }""")
        page.reload(); page.wait_for_function('window.__ready === true', timeout=20000); enter(page); page.wait_for_timeout(1500)
        st = page.evaluate("""() => ({ star5: Store.s.star5, sea1: LIVE().every(passed), w2: W2.open(), sea1checks: LIVE().every(w => WORLDS[w].games.every(g => W2.gameDone(w, g))),
            q: ['Q1','Q2','Q3','Q4'].map(g => [W2.gameDone('peppa2', g), W2.gameOpen('peppa2', g)]), flags: Store.s.flags.slice(), b2: Store.w('bluey2').unlocked, c: ['C1','C2'].map(g => W2.gameOpen('bluey2', g)) })""")
        log.check(st['star5'] and st['sea1'] and st['w2'] and st['sea1checks'], 'an old save: sea 1 stays as earned (passed, the gate open, every game checked) %s' % {k: st[k] for k in ('star5', 'sea1', 'w2', 'sea1checks')})
        log.check(all(not d and o for d, o in st['q']) and 'peppa2' not in st['flags'] and all(w in st['flags'] for w in ['peppa', 'avengers']),
                  'sea 2: played-through games with 2 stars are not done but stay open; peppa2\'s flag comes down, sea 1 flags stay %s' % st)
        log.check(st['b2'] and st['c'] == [True, False], 'an island opened before stays open; its next game waits for 5 stars %s' % st)
        log.check(not page.errors, 'old save: zero page errors %s' % page.errors[:3])
        br.close()


def main():
    jobs = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    log = Log('stars')
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = page.evaluate("() => Object.keys(WORLDS).flatMap(w => (WORLDS[w].games || []).filter(g => GAMES[g]).map(g => [w, g, WORLDS[w].map === 2 ? 3 : 2]))")
        br.close()
    with Pool(jobs) as pool:
        res = [r for part in pool.map(per_game, [ids[i::jobs] for i in range(jobs)]) for r in part]
    for r in res:
        if 'err' in r:
            log.fail('%s: %s' % (r['g'], r['err'])); continue
        log.check(all(r['diff']) and all(r['kind']), '%s: three wrong answers -> three new questions, same kind, retest %s %s' % (r['g'], r['diff'], r['kind']))
        log.check(r['stars'] == [0, 0], '%s: the round with mistakes earns no star (session, game) %s' % (r['g'], r['stars']))
        log.check(not r['pe'], '%s: no page error %s' % (r['g'], r['pe']))
    rules(log)
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
