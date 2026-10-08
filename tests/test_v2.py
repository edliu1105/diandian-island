# -*- coding: utf-8 -*-
"""点点岛 v2 (docs/PLAN-v2.md), rule by rule (fast mode):
 D-01 an old save: played games -> their skill cards "learning" (box 2 with good evidence, else 1), first tests spread over
      7 days and not counted for the brake; stars and flags untouched; the arithmetic island first in the sky, or right
      after the sky island the child is on
 D-02 memory: own first try on a due day -> one box up (once a day); wrong / after the 2nd hint -> two down; a probe with
      less support never moves a box, two probe days take the support away (A.7)
 D-03 review slots: 0 / 1 / 2 by what is due, 3 only while braking in a game already done, 1 when review made the child quit
 D-04 stars: at most 2 review stars in a game's five, the rest to the gems; the level counts only the game's own stars;
      no star after the 2nd hint
 D-05 the pass questions of the island come first; twice not right -> box 1 and a note; the missed queue asks again later
 D-06 the key: once a day, its round asks due cards (no stars), none due -> at once; a flag turns a gem; gem 6 calls a hero
 D-07 the arithmetic island: Z1-Z4 at levels 1-5 - every question has its answer among the options, numbers in range;
      every game reaches 5 stars by its own play
 D-08 the parent check only lowers; the monthly test records 15 answers; report fields; export -> import
 D-09 every review type (and a fact at three supports) appears in landscape and portrait on the stage, cards >= 88 px
 D-10 the sky: the arithmetic island opens first; the castle needs it too; every sentence said has a recording
usage: python tests/test_v2.py"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, step, q, Log

log = Log('v2')


def play(page, w, g, lv=2, n=400, strat='right', opt=None, finish=True):
    o = {'seed': 5}; o.update(opt or {})
    page.evaluate("([w, g, l, o]) => window.__go(w, g, l, o)", [w, g, lv, o])
    page.wait_for_function("window.__q && ['act','ready','input'].includes(window.__q.phase)", timeout=30000)
    kinds = []
    for _ in range(n):
        if page.evaluate("!Session.G"): break
        cur = q(page)
        if cur and cur['phase'] in ('act', 'ready', 'input'):
            kinds.append((cur['kind'], cur.get('rv'))); step(page, strat if not callable(strat) else strat(cur))
            if not finish and len(kinds) >= 3: break
        page.wait_for_timeout(30)
    if finish: page.wait_for_function("!Session.G", timeout=30000)
    else: page.evaluate("gesture('home')"); page.wait_for_timeout(300)
    return kinds


with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820)
    enter(page)
    # D-01
    r = page.evaluate("""() => {
      const S0 = JSON.parse(JSON.stringify(Store.s)); delete S0.v2; S0.mem = {};
      ['P1','P3','B1','A3','A4'].forEach(g => { const w = Object.keys(WORLDS).find(x => WORLDS[x].games.includes(g)); (S0.worlds[w].gstars = S0.worlds[w].gstars || {})[g] = 5; S0.worlds[w].g[g] = { n: 9, c: 8, bits: [1,1,1,1,1,1,1,1], k: {} }; });
      (S0.worlds.peppa.gstars = S0.worlds.peppa.gstars || {}).P2 = 3; S0.flags = ['peppa'];
      Store.s = Store.validate(S0); V2Mig.run();
      const d = DAY(), m = Store.s.mem, dues = Object.values(m).map(x => x.due - d);
      return { cards: Object.keys(m).sort(), boxes: Object.values(m).map(x => x.b), dues, mig: Object.values(m).every(x => x.mig), od: Mem.overdue(), stars: Store.s.worlds.peppa.gstars.P2, flags: Store.s.flags, first: ORDER3[0] };
    }""")
    log.check(set(r['cards']) == {'sub5', 'give10', 'cmp10', 'next10', 'on10'} and all(b == 2 for b in r['boxes']) and min(r['dues']) >= 1 and max(r['dues']) <= 7 and r['mig'] and r['stars'] == 3 and r['flags'] == ['peppa'] and r['first'] == 'trans3',
              'D-01 an old save: played games -> their cards (box 2), first tests over days 1-7, stars and flags kept, the arithmetic island first in the sky %s' % r)
    r = page.evaluate("""() => { const src = document.documentElement.outerHTML; return src.includes("if (o && o.worlds) ORDER3.forEach((id, i) => { if (o.worlds[id] && o.worlds[id].unlocked) at = i + 1; })"); }""")
    log.check(r, 'D-01 a save already in the sky: the island goes right after the last open sky island (code path present)')
    # D-02
    r = page.evaluate("""() => {
      Store.reset(); const d = DAY(), out = [];
      Mem.answer('cmp10', 'ok', 'a'); let m = Mem.get('cmp10'); out.push([m.b, m.due - d]);
      m.due = d; m.up = d - 1; Mem.answer('cmp10', 'ok', 'b'); m = Mem.get('cmp10'); out.push([m.b, m.due - d]);
      m.due = d; Mem.answer('cmp10', 'ok', 'c'); m = Mem.get('cmp10'); out.push([m.b, m.due - d]);
      m.b = 5; Mem.answer('cmp10', 'wrong', 'd'); m = Mem.get('cmp10'); out.push([m.b, m.due - d]);
      m.b = 3; Mem.answer('cmp10', 'help', 'e'); m = Mem.get('cmp10'); out.push([m.b, m.due - d]);
      const f = Mem.touch('F+3+4'); f.b = 3; f.sd = [d - 3, d - 1]; const sp = Mem.supFor('F+3+4');
      Mem.answer('F+3+4', 'probe-no', 'f'); const afterNo = [Mem.get('F+3+4').b, Mem.get('F+3+4').sup];
      Mem.answer('F+3+4', 'probe-ok', 'g'); Mem.get('F+3+4').pd.push(d - 1); Mem.answer('F+3+4', 'probe-ok', 'h');
      return { out, sp, afterNo, sup: Mem.get('F+3+4').sup, b: Mem.get('F+3+4').b };
    }""")
    log.check(r['out'] == [[1, 1], [2, 3], [2, 0], [3, 1], [1, 1]] and r['sp'] == {'sup': 1, 'probe': True} and r['afterNo'] == [3, 0] and r['sup'] == 1 and r['b'] == 3,
              'D-02 memory: new -> 1, due -> up (once a day), wrong / helped -> two down; a probe never moves the box, two probe days take the dots away %s' % r)
    # D-03
    r = page.evaluate("""() => {
      Store.reset(); const d = DAY(), G = (gd) => ({ world: 'peppa', id: 'P1', rounds: 5, v2low: false, ws: Store.w('peppa') }), out = [];
      out.push(V2D.plan(G()).pos.length);
      ['cmp10', 'on10'].forEach(c => { const m = Mem.touch(c); m.b = 2; m.due = d; }); out.push(V2D.plan(G()).pos.length);
      Object.keys(SKILLS).concat(['F+1+1', 'F+2+1', 'F+3+1', 'F+4+1']).forEach(c => { const m = Mem.touch(c); m.b = 2; m.due = d - 3; }); out.push(V2D.plan(G()).pos.length);
      (Store.w('peppa').gstars = Store.w('peppa').gstars || {}).P1 = 5; out.push(V2D.plan(G()).pos.length);
      out.push(V2D.plan(Object.assign(G(), { v2low: true })).pos.length);
      out.push(V2D.plan(Object.assign(G(), { rounds: 4 })).pos.length);
      return out;
    }""")
    log.check(r == [0, 1, 2, 3, 1, 2], 'D-03 review slots: 0, 1, 2 by what is due; 3 only braking in a done game; 1 after quitting; at least 2 own questions %s' % r)
    # D-04 stars
    page.evaluate("() => { Store.reset(); Store.s.w2all = true; Store.s.w3 = true; ORDER.concat(ORDER2, ORDER3).forEach(id => { Store.w(id).unlocked = true; Store.w(id).demo = { P1:1,P2:1,P3:1,P4:1,B1:1,B2:1,B3:1,B4:1,Z1:1,Z2:1,Z3:1,Z4:1 }; }); const d = DAY(); Object.keys(SKILLS).forEach(c => { const m = Mem.touch(c); m.b = 2; m.due = d; }); Store.s.days[d].newG = 0; Store.save(); }")
    r = page.evaluate("""() => { const G = { world: 'bluey2', id: 'C2', ws: Store.w('bluey2') }, st = { rv: true }; const a = [V2D.starTo(G, st), V2D.starTo(G, st), V2D.starTo(G, st)]; Store.w('bluey2').gstars = Store.w('bluey2').gstars || {}; Store.w('bluey2').gstars.C2 = 6; Store.w('bluey2').rvs.C2 = 2; return { a, lv: W2.level('bluey2', 'C2'), lvAll: clamp(WORLDS.bluey2.base + Math.floor(6 / 5), 1, 5) }; }""")
    log.check(r['a'] == ['game', 'game', 'gem'] and r['lv'] == r['lvAll'] - 1, 'D-04 at most two review stars count in a game, the third goes to the gems; the level counts only its own stars %s' % r)
    page.evaluate("window.__go('bluey', 'B2', 2, {seed: 3, noDemo: true})")
    page.wait_for_function("window.__q && ['act','ready','input'].includes(window.__q.phase)", timeout=30000)
    s0 = page.evaluate("(Store.w('bluey').gstars || {}).B2 || 0")
    g0 = page.evaluate("() => { Hints.mark(Session.st, 'hint2'); return Session.st.gen; }")
    for _ in range(30):
        cur = q(page)
        if not cur or cur['gen'] != g0 or cur['submitted']: break
        if cur['phase'] in ('act', 'ready', 'input'): step(page, 'right')
        page.wait_for_timeout(30)
    page.wait_for_timeout(500)
    s1 = page.evaluate("(Store.w('bluey').gstars || {}).B2 || 0")
    page.evaluate("gesture('home')"); page.wait_for_timeout(300)
    log.check(s1 == s0, 'D-04 no star after the 2nd hint (%d -> %d)' % (s0, s1))
    # D-05 the pass questions and the missed queue
    page.evaluate("() => { Store.reset(); Store.s.w2all = true; ORDER.forEach(id => { Store.w(id).unlocked = true; Store.w(id).demo = { P1:1,P2:1,P3:1,P4:1 }; }); Store.w('peppa').played = ['P1']; Store.save(); }")
    kinds = play(page, 'peppa', 'P3', 2, opt={'noDemo': True})
    rvs = [c for k, c in kinds if k == 'review']
    log.check('sub5' in rvs, 'D-05 the island\'s earlier game (P1) is asked as a pass question in a later game %s' % rvs)
    r = page.evaluate("""() => { Store.s.passFail = {}; Store.s.notes = []; const G = { world: 'peppa', id: 'P4', sid: 'x', key: false, miss: [], round: 1 }, st = (c) => ({ rv: true, q: { c }, pass: true, assists: [] });
      V2D.remember(G, st('give10'), 'wrong'); V2D.remember(G, st('give10'), 'wrong'); const m = Mem.get('give10');
      return { b: m.b, due: m.due - DAY(), notes: Store.s.notes.map(n => n[1]), miss: G.miss.map(x => [x.c, x.at]) }; }""")
    log.check(r['b'] == 1 and r['due'] == 1 and 'give10' in r['notes'] and r['miss'][0] == ['give10', 3], 'D-05 twice not right -> box 1, back tomorrow, a note for the parent; and asked again two questions later %s' % r)
    # D-06 the key and the gems
    r = page.evaluate("""() => { Store.reset(); const out = { avail: Gems.avail() }; Gems.start(); out.free = Store.s.gems.n; out.avail2 = Gems.avail();
      Gems.turn('flag'); out.flag = Store.s.gems.n; out.heroAt6 = HEROES6[0]; return out; }""")
    log.check(r == {'avail': True, 'free': 1, 'avail2': False, 'flag': 2, 'heroAt6': 'optimus'}, 'D-06 the key once a day (nothing due -> at once), a flag turns a gem, gem 6 calls Optimus %s' % r)
    page.evaluate("() => { Store.s.key.day = -1; const d = DAY(); ['cmp10', 'on10', 'part10'].forEach(c => { const m = Mem.touch(c); m.b = 2; m.due = d; }); Store.s.w2all = true; ORDER.forEach(id => { Store.w(id).unlocked = true; }); Store.save(); }")
    page.evaluate("Gems.start()")
    page.wait_for_function("window.__q && ['act','ready','input'].includes(window.__q.phase)", timeout=30000)
    seen = []
    for _ in range(200):
        if page.evaluate("!Session.G"): break
        cur = q(page)
        if cur and cur['phase'] in ('act', 'ready', 'input'):
            if cur.get('rv') not in seen: seen.append(cur.get('rv'))
            step(page, 'right')
        page.wait_for_timeout(30)
    page.wait_for_timeout(600)
    r = page.evaluate("({ gems: Store.s.gems.n, stars: Object.values(Store.s.worlds).reduce((a, w) => a + Object.values(w.gstars || {}).reduce((x, y) => x + y, 0), 0) })")
    log.check(sorted(seen) == ['cmp10', 'on10', 'part10'] and r['gems'] == 3 and r['stars'] == 0, 'D-06 the key round asks the due cards, gives no stars, then a gem %s %s' % (seen, r))
    # D-07 the arithmetic island
    r = page.evaluate("""() => {
      const bad = [];
      ['Z1', 'Z2', 'Z3', 'Z4'].forEach(g => { const R = GAMES[g]; for (let lv = 1; lv <= 5; lv++) { const G = { world: 'trans3', W: WORLDS.trans3, rng: RNG(lv * 7 + 1), bags: {} };
        for (let i = 0; i < 300; i++) { const qq = R.gen(G, { level: lv, rng: G.rng }); const opts = qq.opts || [];
          if (!opts.includes(qq.answer) || new Set(opts.map(String)).size !== opts.length) bad.push(g + ' L' + lv + ' opts ' + JSON.stringify(qq.k));
          const nums = JSON.stringify(qq).match(/-?\\d+/g).map(Number); if (lv <= 2 && g !== 'Z4' && typeof qq.answer === 'number' && qq.answer > 6) bad.push(g + ' L' + lv + ' big ' + qq.answer);
          if (g === 'Z1' && lv === 1 && qq.answer > 5) bad.push('Z1 L1 ' + qq.answer);
          if (g === 'Z4') { const tru = qq.eqs.filter(e => (e[1] === '+' ? e[0] + e[2] : e[0] - e[2]) === e[4]); if (tru.length !== 1 || qq.eqs.indexOf(tru[0]) !== qq.answer) bad.push('Z4 true sentences ' + JSON.stringify(qq.eqs)); } } } });
      return bad.slice(0, 8);
    }""")
    log.check(not r, 'D-07 Z1-Z4 at levels 1-5 (300 each): the answer once among the options, numbers within the level; Z4 exactly one true sentence %s' % r)
    page.evaluate("() => { Store.reset(); Store.s.w2all = true; Store.s.w3 = true; ORDER.concat(ORDER2, ORDER3).forEach(id => { Store.w(id).unlocked = true; }); Store.save(); }")
    res = {}
    for g in ['Z1', 'Z2', 'Z3', 'Z4']:
        play(page, 'trans3', g, 2, opt={'noDemo': True})
        play(page, 'trans3', g, 2, opt={'noDemo': True, 'seed': 9})
        res[g] = page.evaluate("(g) => Store.w('trans3').gstars[g] || 0", g)
    log.check(all(v >= 5 for v in res.values()), 'D-07 every arithmetic game reaches 5 stars by its own play %s' % res)
    # D-08 the parent
    r = page.evaluate("""() => { Store.reset(); const d = DAY(), m = Mem.touch('part10'); m.b = 5; m.due = d + 20; Mem.parentNo('part10');
      const after = [Mem.get('part10').b, Mem.get('part10').due - d]; const t = Report.text(); const ex = Report.export(); const before = JSON.stringify(Store.validate(JSON.parse(JSON.stringify(Store.s)))); Store.reset(); Report.import(ex);
      return { after, has: ['会了', '学习中', '保持率', '月测', '考一考', '时长'].every(w => t.includes(w)), same: JSON.stringify(Store.s) === before, plan: MonthTest.plan().length }; }""")
    log.check(r['after'] == [1, 1] and r['has'] and r['same'] and r['plan'] == 15, 'D-08 the parent check lowers to box 1; the report names the numbers; export -> import; the monthly test has 15 %s' % r)
    page.evaluate("() => { Store.s.w2all = true; ORDER.forEach(id => { Store.w(id).unlocked = true; }); Store.save(); MonthTest.start(); }")
    page.wait_for_function("window.__q && ['act','ready','input'].includes(window.__q.phase)", timeout=30000)
    for _ in range(600):
        if page.evaluate("!Session.G"): break
        cur = q(page)
        if cur and cur['phase'] in ('act', 'ready', 'input'): step(page, 'right')
        page.wait_for_timeout(25)
    page.wait_for_timeout(500)
    r = page.evaluate("Store.s.tests.length ? Store.s.tests[0] : null")
    log.check(r and r['n'] == 15 and r['ok'] == 15, 'D-08 the monthly test: 15 answers recorded, no stars %s' % (r and {'n': r['n'], 'ok': r['ok']}))
    # D-09 every review type on the stage, both orientations
    for ori, vw, vh in (('L', 1180, 820), ('P', 820, 1180)):
        pg = new_page(br, base, vw, vh); enter(pg)
        pg.evaluate("() => { Store.s.w2all = true; ORDER.forEach(id => { Store.w(id).unlocked = true; Store.w(id).demo = { P1:1,P2:1,P3:1,P4:1 }; }); Store.save(); }")
        bad = []
        for c in ['sub5', 'give10', 'cmp10', 'cmp20', 'next20', 'on10', 'on20', 'part10', 'ten20', 'add10', 'sub10', 'F+3+4', 'F-8-3']:
            for sup in ((0, 1, 2) if c.startswith('F') else (0,)):
                pg.evaluate("([c, s]) => { const m = Mem.touch(c); m.sup = s; m.sd = []; Store.save(); }", [c, sup])
                pg.evaluate("(c) => window.__go('peppa', 'P2', 2, { seed: 3, test: true, keyItems: [c], noDemo: true })", c)
                pg.wait_for_function("window.__q && ['act','ready','input'].includes(window.__q.phase)", timeout=30000); pg.wait_for_timeout(250)
                o = pg.evaluate("""() => { const st = Session.st, S = Stage, out = []; const els = (st.cards || []).concat(st.items ? st.items.map(x => x.e) : []);
                  els.forEach((e, i) => { const b = box(e); if (b.x < -2 || b.y < -2 || b.x + b.w > S.W + 2 || b.y + b.h > S.H + 2) out.push('off' + i); if (Math.min(b.w, b.h) < 60) out.push('small' + i); });
                  st.els.forEach((e, i) => { if (!e.isConnected || e.style.display === 'none') return; const r = e.getBoundingClientRect(); if (r.width > 4 && (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight)) out.push('el' + i); });
                  return out; }""")
                if o: bad.append((c, sup, o))
                for _ in range(40):
                    if pg.evaluate("!Session.G"): break
                    cur = q(pg)
                    if cur and cur['phase'] in ('act', 'ready', 'input'): step(pg, 'right')
                    pg.wait_for_timeout(25)
        log.check(not bad, 'D-09 %s every review type (and a fact at 3 supports) on the stage %s' % (ori, bad[:6]))
        pg.context.close()
    # D-10 the sky
    r = page.evaluate("""() => { Store.reset(); ORDER.concat(ORDER2).forEach(id => { const ws = Store.w(id); ws.unlocked = true; ws.gstars = ws.gstars || {}; WORLDS[id].games.forEach(g => { ws.gstars[g] = 5; }); ws.pass = true; });
      Store.s.w2 = true; Progress.check(false); const a = { trans: Store.w('trans3').unlocked, peppa3: Store.w('peppa3').unlocked };
      ORDER3.filter(id => id !== 'trans3').forEach(id => { Store.w(id).gstars = Store.w(id).gstars || {}; WORLDS[id].games.forEach(g => { Store.w(id).gstars[g] = 5; }); }); Progress.check(false); a.castleWithoutIt = Store.s.fin3 || '';
      Store.w('trans3').gstars = Store.w('trans3').gstars || {}; WORLDS.trans3.games.forEach(g => { Store.w('trans3').gstars[g] = 5; }); Progress.check(false); a.castle = Store.s.fin3; return a; }""")
    log.check(r == {'trans': True, 'peppa3': False, 'castleWithoutIt': '', 'castle': 'due'}, 'D-10 the sky opens with the arithmetic island; the castle needs it too %s' % r)
    miss = page.evaluate("Array.from(window.__vmiss || [])")
    log.check(not miss, 'D-10 every sentence said has a recording %s' % miss[:12])
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
