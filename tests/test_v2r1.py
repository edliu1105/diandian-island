# -*- coding: utf-8 -*-
"""点点岛 v2 round-1 review (docs/REVIEW-V2R1.md), finding by finding:
 S1 a review question takes the stage: in every game of every sea x every review type, landscape and portrait, a real
    mouse click on the right answer submits it and its pieces are not covered
 S2 the pass questions come in normal play: P1 played to 5 stars in two sessions, then P3 asks P1's card
 M1 a failed probe brings the support back (no endless probe); M2 the game's own question moves no box on a day the card
    is not due; M3 the arithmetic island's place is fixed in a fresh save; M4 every target >= 88 CSS px (the cubes of
    "给我 N 个", the crates of 卸货); M5 卸货 "搬走了几箱": the unloaded crates are hidden until the reveal;
 M6 the key round / the monthly test open with their own words, no game banner; M7 two wrong of the last four -> the next
    question a level lower
 L1 the brake as in the plan; L2 a 0 group shows a dashed ring; L6 "write a 5" changes no card; L7 a game's first visit
    gets at most one review question
usage: python tests/test_v2r1.py"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, step, q, answer_question, wait_phase, Log

log = Log('v2r1')
OPEN = "() => { Store.s.w2all = true; Store.s.w3 = true; ORDER.concat(ORDER2, ORDER3).forEach(id => { const ws = Store.w(id); ws.unlocked = true; ws.demo = {}; WORLDS[id].games.forEach(g => { ws.demo[g] = true; }); }); Store.save(); }"


def wait_q(page):
    page.wait_for_function("window.__q && ['act','ready','input'].includes(window.__q.phase)", timeout=30000)


with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    # S1: every game x review types, both orientations: real click on the right answer submits; nothing covers it
    for ori, vw, vh in (('L', 1180, 820), ('P', 820, 1180)):
        page = new_page(br, base, vw, vh); enter(page); page.evaluate(OPEN)
        games = page.evaluate("ORDER.concat(ORDER2, ORDER3).flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        bad = []
        for w, g in games:
            for c in ('give10', 'add10', 'part10'):
                page.evaluate("([w, g, c]) => { window.__go(w, g, 2, { seed: 3, noDemo: true }); window.__forceRv = c; }", [w, g, c])
                try:
                    wait_q(page)
                except Exception:
                    bad.append((g, c, 'no question')); page.evaluate("gesture('home')"); continue
                # replace the game's first question by a review card: home and start a test-mode session on this game's scene
                page.evaluate("gesture('home')"); page.wait_for_timeout(150)
                page.evaluate("([w, g, c]) => window.__go(w, g, 2, { seed: 3, test: true, keyItems: [c], noDemo: true })", [w, g, c])
                try:
                    wait_q(page); page.wait_for_timeout(250)
                except Exception:
                    bad.append((g, c, 'no review')); page.evaluate("gesture('home')"); continue
                info = page.evaluate("""() => { const st = Session.st, out = [];
                  const els = (st.cards || []).concat(st.items ? st.items.map(x => x.e) : []);
                  els.forEach((e, i) => { const r = e.getBoundingClientRect(); let cov = 0; for (const fx of [.3, .5, .7]) for (const fy of [.3, .5, .7]) { const h = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (!(h === e || (h && e.contains(h)))) cov++; } if (cov > 1) out.push('covered' + i); if (Math.min(r.width, r.height) < 88) out.push('small' + i + ':' + Math.round(r.width)); });
                  /* nor do the review pieces cover the game's own buttons: home, the host, the question pill, done */
                  [document.querySelector('#home'), document.querySelector('#avatar')].concat(st.els.filter(e => e.isConnected && (e.classList.contains('task') || e._done))).forEach(e => { if (!e) return; const r = e.getBoundingClientRect(); if (!r.width) return; const pe = e.style.pointerEvents; e.style.pointerEvents = 'auto'; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); e.style.pointerEvents = pe; if (!(h === e || (h && e.contains(h)))) out.push('chrome ' + (e.id || e.className)); });     /* the pill takes no taps itself: probe it as if it did */
                  return { out, t: st.q.t }; }""")
                if info['out']: bad.append((g, c, info['out'][:3]))
                # a real click on the right answer (give: the cubes then the done button)
                for _ in range(14):
                    cur = q(page)
                    if not cur or cur['submitted'] or cur['phase'] not in ('act', 'ready', 'input'): break
                    tgt = page.evaluate("() => { const st = Session.st, nx = st.game.next(st, 'right'); if (!nx) return null; const e = st.map[nx.p.id] || (nx.p.id === 'done' ? st.doneBtn : null); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
                    if not tgt: break
                    page.mouse.click(tgt[0], tgt[1]); page.wait_for_timeout(60)
                sub = page.evaluate("Session.st ? Session.st.submitted : true")
                if not sub: bad.append((g, c, 'click did not submit'))
                page.evaluate("gesture('home')"); page.wait_for_timeout(120)
        log.check(not bad, 'S1 %s: %d games x 3 review types: the right answer clicked by a real mouse submits, nothing covers the cards, >= 88 px %s' % (ori, len(games), bad[:8]))
        page.context.close()
    page = new_page(br, base, 1180, 820); enter(page)
    # S2: P1 in two sessions to 5 stars (its own questions), then P3: P1's card comes as a pass question
    page.evaluate("() => { Store.reset(); Store.s.v2pos = 0; Store.save(); }")
    page.evaluate(OPEN)
    for seed in (1, 2, 3):
        if page.evaluate("W2.gameDone('peppa', 'P1')"): break
        page.evaluate("(s) => window.__go('peppa', 'P1', null, { seed: s, noDemo: true })", seed); wait_q(page)
        for _ in range(300):
            if page.evaluate("!Session.G"): break
            cur = q(page)
            if cur and cur['phase'] in ('act', 'ready', 'input'): step(page, 'right')
            page.wait_for_timeout(25)
        page.wait_for_function("!Session.G", timeout=30000)
    passed_own = page.evaluate("Mem.passed('sub5')")
    page.evaluate("window.__go('peppa', 'P3', null, { seed: 4, noDemo: true })"); wait_q(page)
    rvs = []
    for _ in range(300):
        if page.evaluate("!Session.G"): break
        cur = q(page)
        if cur and cur['phase'] in ('act', 'ready', 'input'):
            if cur.get('rv') and cur.get('rv') not in rvs: rvs.append(cur.get('rv'))
            step(page, 'right')
        page.wait_for_timeout(25)
    page.wait_for_function("!Session.G", timeout=30000)
    log.check(not passed_own and 'sub5' in rvs, 'S2 the game\'s own questions do not pass a card; P3 then asks P1\'s card as a pass question %s %s' % (passed_own, rvs))
    # M1 / M2 / M3
    r = page.evaluate("""() => { Store.reset(); const d = DAY(), f = Mem.touch('F+3+4'); f.b = 3; f.due = d; f.sd = [d - 3, d - 1];
      const a = Mem.supFor('F+3+4'); Mem.answer('F+3+4', 'probe-no', 's'); const b = Mem.supFor('F+3+4');
      const m = Mem.touch('on10'); m.b = 5; m.due = d + 20; Mem.answer('on10', 'wrong', 's', { own: true }); const own = [m.b, m.due - d]; Mem.answer('on10', 'help', 's', { own: true });
      return { a, b, box: Mem.get('F+3+4').b, own, own2: [Mem.get('on10').b, Mem.get('on10').due - d], pos: Store.s.v2pos === undefined ? 'unset' : 'set' }; }""")
    log.check(r['a'] == {'sup': 1, 'probe': True} and r['b'] == {'sup': 0, 'probe': False} and r['box'] == 3 and r['own'] == [5, 20] and r['own2'] == [5, 20],
              'M1 a failed probe brings the dots back (no endless probe, no box move); M2 a slip in the game\'s own question on a not-due day moves no box %s' % r)
    page2 = new_page(br, base, 1180, 820); enter(page2)
    r = page2.evaluate("({ pos: Store.s.v2pos, first: ORDER3[0] })")
    log.check(r['pos'] == 0 and r['first'] == 'trans3', 'M3 a fresh save fixes the island\'s place (v2pos) at once %s' % r)
    page2.context.close()
    # M4 sizes in the crates game (the cubes are covered by S1); M5 the hidden part
    page.evaluate(OPEN)
    page.evaluate("window.__go('trans3', 'Z3', 1, { seed: 3, noDemo: true })"); wait_q(page)
    r = page.evaluate("Math.min(...Session.st.crates.map(o => o.e.getBoundingClientRect().width))")
    page.evaluate("gesture('home')"); page.wait_for_timeout(200)
    found = None
    for seed in range(1, 30):
        page.evaluate("(s) => window.__go('trans3', 'Z3', 3, { seed: s, noDemo: true })", seed); wait_q(page)
        if page.evaluate("Session.st.q.kind === 'took'"):
            found = page.evaluate("() => ({ hidden: Session.st.crates.filter(o => o.off).every(o => o.e.getBoundingClientRect().right < 0), door: !!Session.st.gdoor })")
            page.evaluate("gesture('home')"); page.wait_for_timeout(200); break
        page.evaluate("gesture('home')"); page.wait_for_timeout(150)
    log.check(r >= 88 and found and found['hidden'] and found['door'], 'M4 the crates are %d px; M5 "搬走了几箱": the unloaded crates are behind the door until the reveal %s' % (r, found))
    # M6
    page.evaluate("() => { Voice.say = ((f) => function (t, o) { (window.__s6 = window.__s6 || []).push(t); return f.call(this, t, o); })(Voice.say); }")
    page.evaluate("() => { window.__s6 = []; const d = DAY(); const m = Mem.touch('cmp10'); m.b = 2; m.due = d; Store.s.key.day = -1; Store.save(); Gems.start(); }")
    wait_q(page); page.wait_for_timeout(200)
    said = page.evaluate("window.__s6.slice(0, 3)")
    banner = page.evaluate("!!document.querySelector('#fx .banner')")
    page.evaluate("gesture('home')"); page.wait_for_timeout(200)
    log.check(said and said[0] == '找回老朋友！' and not banner, 'M6 the key round opens with "找回老朋友！" and no game banner %s' % said)
    # M7
    r = page.evaluate("""() => { const src = String(Session.round); return src.includes('G.level - 1'); }""")
    page.evaluate("window.__go('bluey2', 'C2', 3, { seed: 3, noDemo: true })")
    lv, gen = [], None
    for k in range(6):
        if k and page.evaluate("!Session.G"): break          # a session is a fixed number of questions (each counts, 2026-10-08)
        cur = wait_phase(page, gen=gen, timeout=30000); gen = cur['gen']
        lv.append((cur['level'], cur['retest'], bool(cur.get('rv'))))
        answer_question(page, 'wrong' if k < 2 else 'right'); page.wait_for_timeout(300)
    if page.evaluate("!!Session.G"): page.evaluate("gesture('home')")
    page.wait_for_timeout(200)
    fresh = [l for l, rt, rv in lv[1:] if not rt and not rv]          # the game's own new questions (a review card keeps its own form)
    log.check(r and lv[0][0] == 3 and fresh and fresh[0] == 2, 'M7 two wrong answers -> the next new question a level lower %s' % lv)
    # L1 / L6 / L7
    r = page.evaluate("""() => { Store.reset(); const d = DAY(); Mem.today().newG = 5; Object.keys(SKILLS).slice(0, 4).forEach(c => { const m = Mem.touch(c); m.b = 2; m.due = d; });
      const brake = Mem.brake(); const p1 = V2D.plan({ world: 'peppa', id: 'P1', rounds: 4, ws: Store.w('peppa') }).pos.length;
      Object.keys(SKILLS).concat(['F+1+1','F+2+1','F+3+1','F+4+1','F+5+1','F+6+1','F+7+1','F+8+1']).forEach(c => { const m = Mem.touch(c); m.b = 2; m.due = d; });
      const p2 = V2D.plan({ world: 'peppa', id: 'P1', rounds: 4, ws: Store.w('peppa') }).pos.length;
      return { brake, p1, p2, write5: String(ParentV2.sections).includes("[null, '在纸上写一个 5。']") }; }""")
    log.check(r == {'brake': False, 'p1': 1, 'p2': 1, 'write5': True}, 'L1 new games do not brake; L7 a first visit (4 rounds) gets one review at most; L6 "write a 5" changes no card %s' % r)
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
