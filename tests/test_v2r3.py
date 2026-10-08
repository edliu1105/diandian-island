# -*- coding: utf-8 -*-
"""点点岛 v2, the second review round (docs/REVIEW-V2R2.md, 7/10), finding by finding (docs/RESPONSE-V2R2.md):
 S1 "哪个算式对？": exactly one true number sentence (add10 / sub10, 500 each)
 M1 the flash question: covered first, the dots flash when the host has finished speaking, then the question; the 2nd
    hint flashes once more (real time)
 M2 a card drops at most once a day; a pass question or a missed card asked again, wrong on a day it is not due, moves no
    box (the pass rule decides after two sessions)
 M3 Z1 uses "=" at every level: L1 count, L2 the card that makes both sides the same, L3 / L4 the same or not (= / ≠),
    L5 a + b = ? + c; a real click answers each, >= 88 px, landscape and portrait
 M4 after 36 gems a second book (the heroes come again); a full book says "宝石册满啦！"
 L1 the monthly test: the plan's mix (give N x2, compare x2) and in two sittings
 L2 the save before v2 is kept (and can be restored)
 L3 a skill is "known" only when right in two forms
 L4 the key round shows no star tray
 L5 the chest opens the album first; its chest button starts the key round
usage: python tests/test_v2r3.py"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, wait_phase, answer_question, q, Log

log = Log('v2r3')
OPEN = "() => { Store.s.w2all = true; Store.s.w3 = true; ORDER.concat(ORDER2, ORDER3).forEach(id => { const ws = Store.w(id); ws.unlocked = true; ws.demo = {}; WORLDS[id].games.forEach(g => { ws.demo[g] = true; }); }); Store.save(); }"
SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs', 'v2r3')
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820); enter(page); page.evaluate(OPEN); page.evaluate("() => W3.load()")
    # S1
    r = page.evaluate("""() => { const out = {}; ['add10', 'sub10'].forEach(c => { const G = { rng: RNG(7), bags: {} }; let two = 0, none = 0;
      for (let i = 0; i < 500; i++) { const qq = RQ.eq.gen(G, c, { level: 3 }); const tru = qq.eqs.filter(e => (e[1] === '+' ? e[0] + e[2] : e[0] - e[2]) === e[4]); if (tru.length > 1) two++; if (tru.length < 1 || qq.eqs.indexOf(tru[0]) !== qq.answer) none++; }
      out[c] = [two, none]; }); return out; }""")
    log.check(r == {'add10': [0, 0], 'sub10': [0, 0]}, 'S1 "哪个算式对？": exactly one true sentence, and it is the answer (500 each) %s' % r)
    # M2
    r = page.evaluate("""() => { Store.reset(); const d = DAY();
      const a = Mem.touch('sub10'); a.b = 4; a.due = d; Mem.answer('sub10', 'wrong', 's1', { rv: true }); Mem.answer('sub10', 'wrong', 's1', { rv: true, miss: true }); const due2 = [Mem.get('sub10').b, Mem.get('sub10').due - d];
      const b = Mem.touch('add10'); b.b = 5; b.due = d + 20; Mem.answer('add10', 'wrong', 's1', { rv: true, pass: true }); Mem.answer('add10', 'wrong', 's1', { rv: true, miss: true }); const pass = [Mem.get('add10').b, Mem.get('add10').due - d];
      return { due2, pass }; }""")
    log.check(r == {'due2': [2, 1], 'pass': [5, 20]}, 'M2 a due card wrong, then wrong again as the missed card: one drop (4 -> 2); a pass question and its re-ask wrong on a not-due day: no move %s' % r)
    # L3
    r = page.evaluate("""() => { Store.reset(); const d = DAY(); const m = Mem.touch('cmp10'); m.b = 4; m.due = d + 7; m.fm = ['g:B1']; const one = Mem.state('cmp10'); m.fm.push('rq:cmp'); return [one, Mem.state('cmp10')]; }""")
    log.check(r == ['learning', 'known'], 'L3 a skill in box 4 is "known" only when right in two forms %s' % r)
    # M4
    page.evaluate(OPEN)
    r = page.evaluate("""() => { Store.s.gems.n = 35; Store.save(); window.__sg = []; const o = Voice.say; Voice.say = function (t, x) { window.__sg.push(t); return o.call(this, t, x); };
      Gems.turn('key'); const at36 = Store.s.gems.n; Gems.turn('key'); const at37 = Store.s.gems.n; Voice.say = o;
      const v = Store.validate(JSON.parse(JSON.stringify(Store.s))).gems.n; Gems.album(); const a = document.querySelector('#gems'); const txt = a ? a.textContent : ''; const lit = a ? a.querySelectorAll('path[fill="#FF6B5B"], path[fill="#FFC93C"], path[fill="#5CC46E"], path[fill="#4FB3FF"], path[fill="#B57BFF"], path[fill="#FF9F43"]').length : -1; if (a) a.remove();
      return { at36, at37, v, book2: txt.includes('第 2 册'), lit }; }""")
    log.check(r == {'at36': 36, 'at37': 37, 'v': 37, 'book2': True, 'lit': 1}, 'M4 after 36 gems a second book: the 37th gem is the first of book 2 (kept through a reload) %s' % r)
    # L4 / L5: a real tap on the chest -> the album; its chest button -> the key round, no tray
    page.evaluate("() => { const d = DAY(); const m = Mem.touch('cmp10'); m.b = 2; m.due = d; Store.s.key.day = -1; Store.s.lastDay = d; Store.save(); MapView.update(); }")
    page.wait_for_timeout(400)
    b = page.evaluate("(() => { const e = document.querySelector('#gemchest'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
    if b: page.mouse.click(b[0], b[1]); page.wait_for_timeout(500)
    r1 = page.evaluate("({ album: !!document.querySelector('#gems'), session: !!Session.G, keyGo: Mem.today().keyGo || 0 })")
    go = page.evaluate("(() => { const a = document.querySelector('#gems'); const bs = a ? Array.from(a.querySelectorAll('button')).filter(x => x.querySelector('img[src*=chest]')) : []; if (!bs.length) return null; const r = bs[0].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
    if go: page.mouse.click(go[0], go[1])
    try:
        wait_phase(page, timeout=20000); page.wait_for_timeout(300)
    except Exception:
        pass
    r2 = page.evaluate("({ key: !!(Session.G && Session.G.key), tray: (document.querySelector('#tray') || {}).style ? document.querySelector('#tray').style.visibility : 'none' })")
    page.evaluate("gesture('home')"); page.wait_for_timeout(300)
    log.check(b and r1 == {'album': True, 'session': False, 'keyGo': 0} and r2 == {'key': True, 'tray': 'hidden'}, 'L5 the chest opens the album first (no question, no quit signal), its chest button starts the key round; L4 no star tray in it %s %s' % (r1, r2))
    # L1
    page.evaluate(OPEN)
    plan = page.evaluate("MonthTest.plan()")
    mix = {k: plan.count(k) for k in set(plan)}
    page.evaluate("() => { Store.s.tests = []; delete Store.s.testPart; Store.save(); MonthTest.start(); }")
    gen = None
    for k in range(3):
        cur = wait_phase(page, gen=gen, timeout=20000); gen = cur['gen']; answer_question(page, 'right')
    wait_phase(page, gen=gen, timeout=20000)
    page.evaluate("gesture('home')"); page.wait_for_timeout(400)
    part = page.evaluate("Store.validate(JSON.parse(JSON.stringify(Store.s))).testPart")
    page.evaluate("() => MonthTest.start()")
    left = page.evaluate("Session.G ? Session.G.keyItems.length : -1")
    for k in range(13):
        if page.evaluate("!Session.G"): break
        try:
            cur = wait_phase(page, gen=gen, timeout=20000); gen = cur['gen']; answer_question(page, 'right')
        except Exception:
            break
    page.wait_for_function("!Session.G", timeout=30000)
    t = page.evaluate("({ tests: Store.s.tests.map(x => [x.n, x.ok]), part: Store.s.testPart || null })")
    log.check(len(plan) == 15 and mix.get('give10') == 2 and mix.get('cmp10', 0) + mix.get('cmp20', 0) == 2 and part and len(part['by']) == 3 and left == 12 and t == {'tests': [[15, 15]], 'part': None},
              'L1 the monthly test: give N x2, compare x2, 15 in all; left after 3 it goes on with the other 12 (kept through a reload), one result of 15 %s %s %s %s' % (mix, part and len(part['by']), left, t))
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    page.context.close()
    # L2: an old save (before v2) is kept on the first start, and the parent can go back to it
    ctx = br.new_context(viewport={'width': 1180, 'height': 820})
    pg = ctx.new_page()
    pg.goto(base + '/index.html?fast=1')
    pg.evaluate("() => { const o = JSON.parse(localStorage.getItem('ddi.v1') || '{}'); delete o.v2; delete o.mem; o.worlds = o.worlds || {}; localStorage.removeItem('ddi.pre-v2'); localStorage.setItem('ddi.v1', JSON.stringify(o)); window.__old = JSON.stringify(o); }")
    old = pg.evaluate("window.__old")
    pg.reload(); pg.wait_for_timeout(1500)
    r = pg.evaluate("({ kept: localStorage.getItem('ddi.pre-v2'), now: JSON.parse(localStorage.getItem('ddi.v1') || '{}').v2 })")
    log.check(r['kept'] == old and r['now'] == 1, 'L2 the save before v2 is kept as it was (ddi.pre-v2) and the new save is v2 %s' % {'kept': bool(r['kept']), 'same': r['kept'] == old, 'v2': r['now']})
    ctx.close()
    # M3: Z1 at every level, real clicks, both orientations
    bad, modes = [], {}
    for ori, vw, vh in (('L', 1024, 768), ('P', 768, 1024)):
        pg = new_page(br, base, vw, vh); enter(pg); pg.evaluate(OPEN); pg.evaluate("() => W3.load()")
        for lv in range(1, 6):
            for seed in (1, 2, 3, 4):
                pg.evaluate("([l, s]) => window.__go('trans3', 'Z1', l, { seed: s, noDemo: true })", [lv, seed])
                wait_phase(pg, timeout=30000); pg.wait_for_timeout(300)
                info = pg.evaluate("""() => { const st = Session.st, q = st.q, out = [];
                  (st.cards || []).forEach((e, i) => { const r = e.getBoundingClientRect(); if (Math.min(r.width, r.height) < 88) out.push('small' + i); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!(h === e || (h && e.contains(h)))) out.push('covered' + i); if (r.right > innerWidth || r.bottom > innerHeight) out.push('off' + i); });
                  return { out, mode: q.mode, ans: q.answer }; }""")
                modes.setdefault(lv, set()).add(info['mode'] + ':' + str(info['ans'] in ('eq', 'ne') and info['ans'] or 'n'))
                if info['out']: bad.append((ori, lv, seed, info['out']))
                if seed == 1: pg.screenshot(path=os.path.join(SHOTS, 'Z1_L%d_%s.png' % (lv, ori)))
                gen0 = pg.evaluate("Session.st.gen")
                tgt = pg.evaluate("() => { const st = Session.st, nx = st.game.next(st, 'right'); const e = nx && st.map[nx.p.id]; if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
                if tgt: pg.mouse.click(tgt[0], tgt[1]); pg.wait_for_timeout(250)
                if not pg.evaluate("(g) => !Session.st || Session.st.gen !== g || Session.st.submitted", gen0): bad.append((ori, lv, seed, 'click did not submit'))
                pg.evaluate("gesture('home')"); pg.wait_for_timeout(200)
        if pg.errors: bad.append((ori, 'errors', pg.errors[:2]))
        pg.context.close()
    m = {k: sorted(v) for k, v in modes.items()}
    log.check(not bad and m[1] == ['count:n'] and m[2] == ['match:n'] and set(m[3]) == {'judge:eq', 'judge:ne'} and set(m[4]) == {'judge:eq', 'judge:ne'} and m[5] == ['bal:n'],
              'M3 Z1 uses "=" at every level (count, match, same or not with dots / numbers, balance); real clicks answer, >= 88 px, L and P %s %s' % (m, bad[:4]))
    # M1 real time: the flash after the host has spoken, then the question; the 2nd hint flashes again
    pg = new_page(br, base, 1180, 820, fast=False); enter(pg); pg.evaluate(OPEN); pg.evaluate("() => W3.load()")
    pg.evaluate("() => { window.__sv = []; const o = Voice.say; Voice.say = function (t, x) { window.__sv.push([Math.round(performance.now()), t]); return o.call(this, t, x); }; }")
    pg.evaluate("() => { const d = DAY(); const m = Mem.touch('sub5'); m.b = 2; m.due = d; Store.save(); window.__go('peppa', 'P2', 2, { seed: 3, key: true, keyItems: ['sub5'], noDemo: true }); }")
    pg.wait_for_function("Session.st && Session.st.flash", timeout=30000)
    first = pg.evaluate("({ covered: !!Session.st.covered, t: Math.round(performance.now()) })")
    pg.wait_for_function("Session.st && Session.st.covered === false", timeout=20000, polling=20)
    fl = pg.evaluate("({ t: Math.round(performance.now()), busy: Voice.busy(), said: window.__sv.map(x => x[1]) })")
    pg.wait_for_function("window.__sv.some(x => x[1] === '刚才有几个点？')", timeout=20000)
    ask = pg.evaluate("window.__sv.find(x => x[1] === '刚才有几个点？')[0]")
    pg.wait_for_function("Session.st && Session.st.covered === true", timeout=20000, polling=20)
    pg.evaluate("() => { const st = Session.st; st.game.gestureHint(st); }")
    again = pg.evaluate("Session.st.covered === false")
    pg.evaluate("gesture('home')"); pg.wait_for_timeout(300)
    log.check(first['covered'] and not fl['busy'] and '刚才有几个点？' not in fl['said'] and ask > fl['t'] and again,
              'M1 the flash question: covered first, the dots flash when nothing is being said, the question after the flash, the 2nd hint flashes again %s' % {'first': first['covered'], 'busyAtFlash': fl['busy'], 'askedBefore': '刚才有几个点？' in fl['said'], 'askAfterMs': ask - fl['t'], 'again': again})
    pg.context.close()
    br.close()
sys.exit(0 if log.close() else 1)
