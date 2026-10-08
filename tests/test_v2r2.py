# -*- coding: utf-8 -*-
"""点点岛 v2, the second review round: what the reviewer's experiments found (docs/RESPONSE-V2R2.md)
 C2  a probe answered right moves the support, never enters retention (A.23)
 C10 a review question's automatic 2nd hint only says the question again: it costs no star and no box
 C11 a reload keeps the v2 state exactly (the day record has every field the validator keeps)
 D2  every arithmetic game's top level differs from level 4: Z1/Z2 only the sentence, Z3 only the sentence (no truck),
     Z4 one number of the family hidden; real clicks answer them, targets >= 88 px, landscape and portrait
usage: python tests/test_v2r2.py"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, wait_phase, answer_question, q, Log

log = Log('v2r2')
OPEN = "() => { Store.s.w2all = true; Store.s.w3 = true; ORDER.concat(ORDER2, ORDER3).forEach(id => { const ws = Store.w(id); ws.unlocked = true; ws.demo = {}; WORLDS[id].games.forEach(g => { ws.demo[g] = true; }); }); Store.save(); }"
SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs', 'v2r2')
os.makedirs(SHOTS, exist_ok=True)

with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    page = new_page(br, base, 1180, 820); enter(page); page.evaluate(OPEN)
    page.evaluate("() => W3.load()")
    # C2
    r = page.evaluate("""() => { Store.reset(); const d = DAY(), f = Mem.touch('F+3+4'); f.b = 3; f.due = d; f.last = d - 7; f.sd = [d - 3, d - 1]; const ev0 = Store.s.ev.length;
      Mem.answer('F+3+4', 'probe-ok', 's', { rv: true, sup: 1 }); const m = Mem.get('F+3+4'); return { ev: Store.s.ev.length - ev0, b: m.b, pd: m.pd.length }; }""")
    log.check(r == {'ev': 0, 'b': 4, 'pd': 1}, 'C2 a probe right on its due day: the box moves, the support counts the day, retention has no row %s' % r)
    # C10
    page.evaluate(OPEN)
    page.evaluate("() => { const d = DAY(); const m = Mem.touch('cmp10'); m.b = 3; m.due = d; Store.save(); window.__go('peppa', 'P1', 2, { seed: 3, test: true, keyItems: ['cmp10'], noDemo: true }); }")
    wait_phase(page, timeout=30000); page.wait_for_timeout(200)
    r = page.evaluate("() => { const st = Session.st; Hints.mark(st, 'hint2'); Hints.mark(st, 'hint3'); return { helped: helped(st), soft: !!st.game.softHint }; }")
    page.evaluate("gesture('home')"); page.wait_for_timeout(300)
    log.check(r == {'helped': False, 'soft': True}, 'C10 a review question\'s automatic hints say the question again: not help (no star, no box down) %s' % r)
    # C11
    r = page.evaluate("""() => { Store.reset(); Mem.today(); const d = DAY(); const m = Mem.touch('on10'); m.b = 2; m.due = d + 3; Store.s.gems.n = 3; Store.save();
      const F = ['mem', 'gems', 'key', 'v2pos', 'v2low', 'notes', 'passFail', 'checks', 'tests', 'days', 'ev', 'flagDays'], pick = o => JSON.stringify(F.map(f => o[f]));
      const before = pick(Store.s), after = pick(Store.validate(JSON.parse(JSON.stringify(Store.s)))); return before === after ? 'same' : F.filter((f, i) => JSON.stringify(Store.s[f]) !== JSON.stringify(Store.validate(JSON.parse(JSON.stringify(Store.s)))[f])); }""")
    log.check(r == 'same', 'C11 a reload keeps the v2 state exactly %s' % r)
    # D2
    r = page.evaluate("""() => { const out = {};
      ['Z1', 'Z2', 'Z3', 'Z4'].forEach(g => { const R = GAMES[g], f = lv => { const G = { world: 'trans3', W: WORLDS.trans3, rng: RNG(11), bags: {} }; const s = new Set(); for (let i = 0; i < 200; i++) { const qq = R.gen(G, { level: lv, rng: G.rng }); s.add(JSON.stringify([qq.mode || qq.kind || null, qq.sym || false, qq.hide || null, qq.sup || 0])); } return Array.from(s).sort().join('|'); };
        out[g] = f(4) !== f(5); });
      return out; }""")
    log.check(all(r.values()), 'D2 every arithmetic game\'s level 5 differs from level 4 %s' % r)
    bad = []
    for ori, vw, vh in (('L', 1024, 768), ('P', 768, 1024)):
        pg = new_page(br, base, vw, vh); enter(pg); pg.evaluate(OPEN)
        pg.evaluate("() => W3.load()")
        for g in ('Z3', 'Z4'):
            seen = set()
            for seed in range(1, 9):
                pg.evaluate("([g, s]) => window.__go('trans3', g, 5, { seed: s, noDemo: true })", [g, seed])
                cur = wait_phase(pg, timeout=30000); pg.wait_for_timeout(300)
                info = pg.evaluate("""() => { const st = Session.st, q = st.q, out = [];
                  (st.cards || []).forEach((e, i) => { const r = e.getBoundingClientRect(); if (Math.min(r.width, r.height) < 88) out.push('small' + i); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!(h === e || (h && e.contains(h)))) out.push('covered' + i); });
                  if (q.sym && (st.crates || []).length) out.push('crates shown'); if (st.eqEl) { const r = st.eqEl.getBoundingClientRect(); if (r.left < 0 || r.right > innerWidth) out.push('sentence off screen'); }
                  return { out, key: (q.kind || '') + (q.hide || ''), sym: !!q.sym, hide: q.hide || null }; }""")
                if g == 'Z3' and not info['sym']: bad.append((ori, g, seed, 'not sym'))
                if g == 'Z4' and not info['hide']: bad.append((ori, g, seed, 'nothing hidden'))
                if info['out']: bad.append((ori, g, seed, info['out']))
                if info['key'] not in seen:
                    seen.add(info['key']); pg.screenshot(path=os.path.join(SHOTS, '%s_L5_%s_%s.png' % (g, info['key'] or 'q', ori)))
                tgt = pg.evaluate("() => { const st = Session.st, nx = st.game.next(st, 'right'); const e = nx && st.map[nx.p.id]; if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
                gen0 = pg.evaluate("Session.st.gen")
                if tgt: pg.mouse.click(tgt[0], tgt[1]); pg.wait_for_timeout(200)
                if not pg.evaluate("(g) => !Session.st || Session.st.gen !== g || Session.st.submitted", gen0): bad.append((ori, g, seed, 'click did not submit'))
                pg.evaluate("gesture('home')"); pg.wait_for_timeout(200)
        if pg.errors: bad.append((ori, 'errors', pg.errors[:2]))
        pg.context.close()
    log.check(not bad, 'D2 Z3 level 5 (the sentence only) and Z4 level 5 (a number hidden): on screen, >= 88 px, a real click answers, landscape and portrait %s' % bad[:6])
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
