# -*- coding: utf-8 -*-
"""积木城's progress (docs/W5-DESIGN.md §8): run by tests/test_w5.py when W5_ONLY is not set (or by itself:
python tests/w5_flow.py). Islands are made live for one page with an init script (window.__live5), whatever
raw/js/w5/live.json says, so the flows are tested while the islands are still being written.
  1. the child's save (19 flags: worlds 1-2 complete, the sky in progress at 西游记·天宫, hero cards, review cards, laps):
     after the update 积木城 is open, the first map visit flies there ONCE ("积木城开啦！", its first island's cloud flies off,
     the hand points at it); the sky stays open (w3pre) - nothing it had is lost or locked, 天宫 goes on and its flag opens
     the next sky island; the gates go 2 -> 5 -> 3 (-> 1 while the stars are closed); a reload does not fly again
  2. a new player: 积木城 closed until the second sea is flagged; sea 2's gate turns gold ("惊喜来啦！") and leads to 积木城
     ("登上积木城啦！"); one island and one game at a time; an island not live is a cloud ("新岛还在建哦！") that never opens,
     not even by the parent's 全部解锁; while 积木城 is not complete the sky opens after its live islands (gate show in 积木城)
  3. the whole world (all seven live): the seven flags -> the block castle ("积木城堡开啦！") and the party ("积木城大派对！"),
     then 积木城's gate turns gold for the sky; a flag opens a hero card; laps start on a flagged island; teach mode and the
     explain setting (一步一步) in a world-5 game; the parent panel's 积木城 table and 上课对照"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ALL5 = ['peppa5', 'bluey5', 'pjmasks5', 'paw5', 'huluwa5', 'xiyou5', 'avengers5']
SAID = """() => { if (window.__sh) return; window.__sh = 1; window.__said = [];
  const a = Voice.say.bind(Voice), b = Voice.sayNow.bind(Voice); Voice.say = (t, x) => { window.__said.push(t); return a(t, x); }; Voice.sayNow = (t, x) => { window.__said.push(t); return b(t, x); }; }"""
# the child's save, as he has it on 2026-10-17 (docs/W5-DESIGN.md §1): worlds 1-2 done, the sky done up to the arithmetic
# island (inserted after 葫芦娃·云岛), 西游记·天宫 in progress (S1 done, S2 3 stars), 19 flags, cards, review memory, a lap
CHILD = """() => {
  Store.reset(); const S = Store.s, d = DAY();
  const done = w => { const ws = Store.w(w); ws.unlocked = true; ws.played = WORLDS[w].games.slice(); ws.gstars = {}; WORLDS[w].games.forEach(g => { ws.gstars[g] = 5 + (g.charCodeAt(0) % 3); }); ws.stars = Object.values(ws.gstars).reduce((a, b) => a + b, 0); ws.visits = 12; ws.sessions = 9; ws.demo = {}; WORLDS[w].games.forEach(g => { ws.demo[g] = true; }); };
  const w3 = ['peppa3', 'bluey3', 'pjmasks3', 'paw3', 'huluwa3', 'trans3'];
  LIVE().concat(ORDER2, w3).forEach(done);
  LIVE().forEach(w => { Store.w(w).pass = true; });
  const x = Store.w('xiyou3'); x.unlocked = true; x.played = ['S1', 'S2']; x.gstars = { S1: 5, S2: 3 }; x.stars = 8; x.demo = { S1: true, S2: true };
  S.flags = LIVE().concat(ORDER2, w3); S.flagDays = S.flags.map((_, i) => d - 40 + i * 2);
  Object.assign(S, { w2seen: true, gateShown: true, fin2: 'seen', gate3: true, w3seen: true, mapSet: 3, finaleSeen: true, v2pos: 5, seq1: true, star5: true, strict2: true });
  S.gems = { n: 21, src: ['@cards'] }; S.key = { day: d, got: 6, short: false };
  ['add10', 'sub10', 'part10', 'cmp10', 'on10'].forEach((c, i) => { S.mem[c] = { b: 2, due: d + 1 + i, last: d - 1, up: d - 2, seen: d - 20, pass: [], n: 9, ok: 7, sup: 0, sd: [], pd: [] }; });
  S.laps = { peppa2: { n: 2, got: 0, due: 0, iv: 1, cd: 0, g: { Q1: 3 } } };
  Store.save(); return Store.s.flags.length; }"""
SNAP = """() => { const S = Store.s, keep = LIVE().concat(ORDER2, ORDER3);
  return JSON.stringify({ worlds: keep.map(w => { const ws = Store.w(w); return [w, !!ws.unlocked, ws.stars, ws.gstars || {}, (ws.played || []).slice().sort(), !!ws.pass]; }),
    flags: S.flags, gems: S.gems.n, mem: Object.keys(S.mem).sort().map(c => [c, S.mem[c].b]), laps: (S.laps || {}).peppa2, gate3: S.gate3, w3seen: S.w3seen, key: S.key.got }); }"""


def page_with(br, base, live, vw=1180, vh=820):
    from harness import new_page
    return new_page(br, base, vw, vh, fast=True, extra_init='window.__live5 = %s;' % json.dumps(live))


def go_map(page):
    from harness import enter
    page.evaluate(SAID)
    enter(page)
    page.wait_for_timeout(600)


def child_save(log, br, base, live):
    from harness import enter
    tag = 'child save (live %d)' % len(live)
    page = page_with(br, base, live)
    n = page.evaluate(CHILD)
    page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
    before = page.evaluate(SNAP)
    st = page.evaluate("() => ({ order3: ORDER3.slice(), w5: W5.open(), w3: W3.open(), pre: !!Store.s.w3pre, u5: ORDER5.map(w => Store.w(w).unlocked), x3: Store.w('xiyou3').unlocked, a3: Store.w('avengers3').unlocked, flags: Store.s.flags.length })")
    log.check(n == 19 and st['flags'] == 19 and st['order3'].index('trans3') == 5, '%s: 19 flags, worlds 1-2 complete, the sky in progress at 西游记·天宫 (运算岛 the 6th sky island) %s' % (tag, st['order3']))
    log.check(st['w5'] and st['w3'] and st['pre'] and st['x3'] and not st['a3'] and st['u5'] == [True] + [False] * 6, '%s: after the update 积木城 is open (its first island only), the sky stays open (w3pre), 天宫 open, the next sky island still closed %s' % (tag, {k: st[k] for k in ('w5', 'w3', 'pre', 'u5')}))
    go_map(page)
    page.wait_for_function("MapView.set === 5 && !MapView.sailing", timeout=20000); page.wait_for_timeout(1500)
    st = page.evaluate("() => ({ set: MapView.set, said: window.__said.slice(), seen: !!Store.s.w5seen, g5: !!Store.s.gate5, rec: MapView.recommend(), cloud: MapView.isl.peppa5.d.classList.contains('locked'), bg: document.querySelector('#mapbg').style.backgroundImage, gold: MapView.isl.gate.d.classList.contains('sky'), isl: Object.keys(MapView.isl), mapSet: Store.s.mapSet })")
    log.check(st['set'] == 5 and '积木城开啦！' in st['said'] and st['seen'] and st['g5'] and st['mapSet'] == 5, '%s: the first map visit flies to 积木城 ("积木城开啦！") %s' % (tag, st['said'][-5:]))
    log.check('新小岛开啦！' in st['said'] and not st['cloud'] and st['rec'] == 'peppa5', '%s: 佩奇·积木屋\'s cloud flies off ("新小岛开啦！"), the hand points at it (%s)' % (tag, st['rec']))
    log.check('map_blocks' in st['bg'] and 'blockcastle' in st['isl'] and 'gate' in st['isl'] and st['gold'], '%s: 积木城\'s own map, the block castle and the gate - the gate already gold (the way back up to the sky) %s' % (tag, st['bg'][-30:]))
    after = page.evaluate(SNAP)
    log.check(before == after, '%s: nothing lost or locked: every island, star, game star, played game, flag, hero card, review card and lap as before' % tag)
    # through the gate: back up to the sky; its next island opens after 天宫's flag
    page.evaluate("window.__said.length = 0; MapView.tapIsland('gate')")
    page.wait_for_function("MapView.set === 3 && !MapView.sailing", timeout=20000); page.wait_for_timeout(300)
    log.check('飞到云上去！' in page.evaluate("window.__said.slice()"), '%s: 积木城\'s gate -> the sky ("飞到云上去！")' % tag)
    ring = page.evaluate("() => { const out = []; [1, 2, 5, 3].forEach(n => { MapView.useSet(n); out.push([MapView.set, MapView.nextSet()]); }); return out; }")
    log.check(ring == [[1, 2], [2, 5], [5, 3], [3, 1]], '%s: the gates go round 1 -> 2 -> 5 -> 3 -> (the stars closed) 1 %s' % (tag, ring))
    page.evaluate("() => { const x = Store.w('xiyou3'); WORLDS.xiyou3.games.forEach(g => { x.gstars[g] = 5; }); x.played = WORLDS.xiyou3.games.slice(); Store.save(); Progress.check(true); MapView.useSet(3); MapView.update(); }")
    st = page.evaluate("() => ({ a3: Store.w('avengers3').unlocked, w3: W3.open(), flags: Store.s.flags.length })")
    log.check(st['a3'] and st['w3'], '%s: the sky goes on - 天宫\'s four games done open 复仇者·云岛 %s' % (tag, st))
    # a reload: no second flight
    page.evaluate("() => { MapView.useSet(5); Store.save(); }")
    page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
    go_map(page); page.wait_for_timeout(1500)
    said = page.evaluate("window.__said.slice()")
    log.check('积木城开啦！' not in said and page.evaluate("MapView.set") == 5, '%s: a reload does not fly again (the map opens on 积木城, where he was) %s' % (tag, said[-3:]))
    log.check(not page.errors, '%s: zero page errors %s' % (tag, page.errors[:3]))
    page.context.close()


def new_player(log, br, base):
    from harness import answer_question, wait_next_question, wait_map
    live = ['peppa5', 'bluey5']
    tag = 'new player (live peppa5, bluey5)'
    page = page_with(br, base, live)
    go_map(page)
    page.evaluate("() => W3.load()")
    st = page.evaluate("() => ({ w5: W5.open(), u: ORDER5.map(w => Store.w(w).unlocked) })")
    log.check(not st['w5'] and not any(st['u']), '%s: a fresh save - 积木城 closed %s' % (tag, st))
    page.evaluate("""() => { LIVE().concat(ORDER2).forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.pass = true; WORLDS[w].games.forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; }); if (!Store.s.flags.includes(w)) Store.s.flags.push(w); });
      Store.s.gateShown = true; Store.s.w2seen = true; Store.s.fin2 = 'seen'; Store.save(); Progress.check(false); }""")
    st = page.evaluate("() => ({ w5: W5.open(), w3: W3.open(), pre: !!Store.s.w3pre, u: ORDER5.map(w => Store.w(w).unlocked), g: WORLDS.peppa5.games.map(g => W2.gameOpen('peppa5', g)) })")
    log.check(st['w5'] and st['u'] == [True] + [False] * 6 and st['g'] == [True, False, False, False], '%s: the second sea done - 积木城 opens, only its first island and its first game %s' % (tag, st))
    log.check(st['w3'] and st['pre'], '%s: 积木城 not complete yet - the sky stays reachable after the second sea (w3pre) %s' % (tag, st))
    page.evaluate("window.__said.length = 0; MapView.useSet(2); MapView.enter();")
    page.wait_for_timeout(2500)
    st = page.evaluate("() => ({ said: window.__said.slice(), g5: !!Store.s.gate5, rec: MapView.recommend(), gold: MapView.isl.gate.d.classList.contains('sky'), g3: !!Store.s.gate3 })")
    log.check('惊喜来啦！' in st['said'] and st['g5'] and st['rec'] == 'gate' and st['gold'] and not st['g3'], '%s: the second sea\'s gate turns gold for 积木城 ("惊喜来啦！"), the hand points at it %s' % (tag, st))
    page.evaluate("window.__said.length = 0; MapView.tapIsland('gate')")
    page.wait_for_function("MapView.set === 5 && !MapView.sailing", timeout=20000); page.wait_for_timeout(800)
    st = page.evaluate("() => ({ said: window.__said.slice(), seen: !!Store.s.w5seen, locked: ORDER5.map(w => MapView.isl[w].d.classList.contains('locked')) })")
    log.check('登上积木城啦！' in st['said'] and st['seen'] and st['locked'] == [False] + [True] * 6, '%s: through the gate - "登上积木城啦！", 佩奇·积木屋 open, the others clouds %s' % (tag, st['said'][-3:]))
    page.evaluate("window.__said.length = 0; MapView.tapIsland('pjmasks5')"); page.wait_for_timeout(300)
    log.check('新岛还在建哦！' in page.evaluate("window.__said.slice()"), '%s: an island not live: its cloud shakes, "新岛还在建哦！"' % tag)
    # P8 to 5 stars by right answers (the template, really played); the other three games of the island marked done
    page.evaluate("() => { const ws = Store.w('peppa5'); ['P5', 'P6', 'P7'].forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; (ws.played = ws.played || []).push(g); }); Store.save(); }")
    for s in range(1, 4):
        if page.evaluate("W2.gameDone('peppa5', 'P8')"): break
        page.evaluate("(s) => window.__go('peppa5', 'P8', null, {noDemo: true, seed: s})", s)
        for _ in range(12):
            try:
                gen, snap = answer_question(page, 'right', timeout=20000); wait_next_question(page, gen, timeout=30000)
            except Exception:
                break
            if page.evaluate("!Session.G"): break
        wait_map(page, timeout=60000); page.wait_for_timeout(400)
    page.wait_for_timeout(4000)
    st = page.evaluate("() => ({ done: W2.islandDone('peppa5'), b5: Store.w('bluey5').unlocked, j5: Store.w('pjmasks5').unlocked, flags: Store.s.flags.slice(-1), html: MapView.isl.peppa5.flag.innerHTML, cards: Store.s.gems.n, lap: Laps.on('peppa5') })")
    log.check(st['done'] and st['b5'] and not st['j5'], '%s: P8 played to 5 stars (the island\'s four games done) opens Bluey·积木院, not the next one (not live) %s' % (tag, {k: st[k] for k in ('done', 'b5', 'j5')}))
    log.check(st['flags'] == ['peppa5'] and 'FFE58A' in st['html'] and st['cards'] >= 1, '%s: its square flag (a cube on the pole) is planted and counted, a hero card opens (%d cards out)' % (tag, st['cards']))
    log.check(st['lap'], '%s: the flagged island plays laps (再玩一圈)' % tag)
    # every live island flagged: 积木城's gate turns gold for the sky (积木城 not complete)
    page.evaluate("() => { const ws = Store.w('bluey5'); WORLDS.bluey5.games.forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; }); Store.s.flags.push('bluey5'); Store.save(); Progress.check(false); window.__said.length = 0; MapView.useSet(5); MapView.enter(); }")
    page.wait_for_timeout(2500)
    st = page.evaluate("() => ({ said: window.__said.slice(), g3: !!Store.s.gate3, j5: Store.w('pjmasks5').unlocked })")
    log.check('惊喜来啦！' in st['said'] and st['g3'] and not st['j5'], '%s: the live islands flagged - 积木城\'s gate turns gold for the sky; the island not live stays closed %s' % (tag, st))
    page.evaluate("window.__said.length = 0; MapView.tapIsland('gate')")
    page.wait_for_function("MapView.set === 3 && !MapView.sailing", timeout=20000); page.wait_for_timeout(300)
    log.check('飞到云上啦！' in page.evaluate("window.__said.slice()"), '%s: up to the sky ("飞到云上啦！")' % tag)
    # the parent: 全部解锁 opens every live island only; the panel's 积木城 table and 上课对照
    page.evaluate("() => { Parent.open(); }"); page.wait_for_timeout(300)
    st = page.evaluate("""() => { const sh = document.querySelector('#parent .sheet'), hs = Array.from(sh.querySelectorAll('h3')).map(h => h.textContent);
      const b = Array.from(sh.querySelectorAll('button')).find(x => x.textContent.startsWith('上课对照')); if (b) b.click();
      const rows = b && b._t ? b._t.querySelectorAll('tr').length : 0;
      const ul = Array.from(sh.querySelectorAll('button')).find(x => x.textContent === '全部解锁'); if (ul) ul.click();
      return { h5: hs.some(t => t.startsWith('积木城')), order: hs.findIndex(t => t.startsWith('积木城')) < hs.findIndex(t => t.startsWith('云上')), rows, u: ORDER5.map(w => Store.w(w).unlocked), text: b && b._t ? b._t.textContent.slice(0, 80) : '' }; }""")
    log.check(st['h5'] and st['order'] and st['rows'] >= 30, '%s: the parent panel - 积木城\'s table (between the second sea and the sky) and 上课对照 (%d rows: %s)' % (tag, st['rows'], st['text']))
    log.check(st['u'] == [True, True, False, False, False, False, False], '%s: 全部解锁 opens the live islands only %s' % (tag, st['u']))
    page.evaluate("() => Parent.close()")
    log.check(not page.errors, '%s: zero page errors %s' % (tag, page.errors[:3]))
    page.context.close()


def whole_world(log, br, base):
    from harness import answer_question, wait_next_question, wait_phase
    tag = 'the whole world (all seven live)'
    page = page_with(br, base, ALL5)
    go_map(page)
    page.evaluate("() => W3.load()")
    st = page.evaluate("() => ({ full: W5.full, w3: W3.open() })")
    page.evaluate("""() => { LIVE().concat(ORDER2).forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.pass = true; WORLDS[w].games.forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; }); if (!Store.s.flags.includes(w)) Store.s.flags.push(w); });
      Object.assign(Store.s, { gateShown: true, w2seen: true, fin2: 'seen', gate5: true, w5seen: true }); Store.save(); Progress.check(false); }""")
    st = page.evaluate("() => ({ full: W5.full, w5: W5.open(), w3: W3.open(), pre: !!Store.s.w3pre })")
    log.check(st['full'] and st['w5'] and not st['w3'] and not st['pre'], '%s: a new player with 积木城 complete - the sky waits for 积木城 %s' % (tag, st))
    page.evaluate("() => { ORDER5.forEach(w => { const ws = Store.w(w); ws.unlocked = true; WORLDS[w].games.forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; }); }); Store.save(); Progress.check(false); window.__said.length = 0; MapView.useSet(5); MapView.enter(); }")
    page.wait_for_timeout(12000)
    st = page.evaluate("() => ({ fin5: Store.s.fin5, w3: W3.open(), said: window.__said.slice(), scr: Screens.cur, flags: ORDER5.filter(w => Store.s.flags.includes(w)).length, bg: document.querySelector('#finale .fbg').style.backgroundImage })")
    log.check(st['flags'] == 7 and st['fin5'] == 'seen' and '积木城堡开啦！' in st['said'] and '积木城大派对！' in st['said'] and 'finale_blocks' in st['bg'], '%s: seven flags - the block castle opens and the party plays %s' % (tag, [t for t in st['said'] if '积木' in t]))
    log.check(st['w3'], '%s: 积木城 complete opens the sky' % tag)
    page.evaluate("gesture('home')"); page.wait_for_timeout(2500)
    st = page.evaluate("() => ({ g3: !!Store.s.gate3, gold: MapView.isl.gate && MapView.isl.gate.d.classList.contains('sky'), next: MapView.nextSet() })")
    log.check(st['g3'] and st['gold'] and st['next'] == 3, '%s: after the party 积木城\'s gate turns gold and leads up to the sky %s' % (tag, st))
    # teach mode and the explanation step by step in a world-5 game
    page.evaluate("() => { Store.s.settings.explain = 'step'; Store.save(); Teach.last = { w: 'peppa5', g: 'P8' }; Teach.set(1); window.__go('peppa5', 'P8', 3, { noDemo: true, seed: 7 }); }")
    try:
        cur = wait_phase(page, timeout=20000)
        lv = page.evaluate("() => ({ teach: Session.G.teach, level: Session.G.level, badge: !!document.querySelector('#tray .teachb') })")
        gen, snap = answer_question(page, 'wrong', timeout=20000)
        page.wait_for_function("!!document.getElementById('stepnext')", timeout=20000)
        n = 0
        for _ in range(12):
            if not page.evaluate("!!document.getElementById('stepnext') && !!Session.st && Session.st.gen === %d" % gen): break
            r = page.evaluate("(() => { const r = document.getElementById('stepnext').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
            page.mouse.click(r[0], r[1]); n += 1; page.wait_for_timeout(300)
        wait_next_question(page, gen, timeout=20000)
        log.check(lv['teach'] == 1 and lv['level'] == 2 and lv['badge'] and n >= 2, '%s: 教一教 in a world-5 game (level 3 -> %d, the 教 badge) and 一步一步: the explanation waited for 下一步 %d times' % (tag, lv['level'], n))
    except Exception as e:
        dump = page.evaluate("() => ({ q: window.__q && [window.__q.gen, window.__q.phase, window.__q.level], scr: Screens.cur, G: !!Session.G, card: !!document.getElementById('cardshow'), step: !!document.getElementById('stepnext') })")
        log.check(False, '%s: teach / step by step: %s %s' % (tag, str(e)[:160], dump))
    page.evaluate("() => { Teach.set(0); Store.s.settings.explain = 'auto'; Store.save(); gesture('home'); }")
    log.check(not page.errors, '%s: zero page errors %s' % (tag, page.errors[:3]))
    page.context.close()


def registrations(log, br, base):
    """the 28 games are registered: their island, a background that is there (new or fallback, and its thumbnail), the host
    and the friends among the characters, an icon; the island files that parse; the new pictures in use"""
    page = page_with(br, base, [])
    go_map(page); page.evaluate("() => W3.load()"); page.wait_for_timeout(500)
    r = page.evaluate("""async () => { const out = [], ok = async u => { try { const x = await fetch(u, { method: 'HEAD' }); return x.ok; } catch (e) { return false; } };
      for (const w of ORDER5) for (const g of WORLDS[w].games) { const G = GAMES[g]; if (!G) { out.push(g + ' not registered'); continue; }
        if (G.world !== w) out.push(g + ' world ' + G.world);
        if (!(await ok('assets/bg/' + G.bg + '.jpg')) || !(await ok('assets/bgthumb/' + G.bg + '.jpg'))) out.push(g + ' background ' + G.bg);
        if (!CHARS[G.host] || !G.chars.every(c => CHARS[c])) out.push(g + ' characters ' + G.host + ' ' + G.chars);
        if (!G.iconSrc) out.push(g + ' icon');
        for (const p of G.props || []) if (!(await ok('assets/props/' + p + '.png'))) out.push(g + ' prop ' + p); }
      return { bad: out, newbg: ORDER5.flatMap(w => WORLDS[w].games).filter(g => W5HAVE.has(GAMES[g].bg)).length, rules: Object.keys(W5R).sort(), isl: ORDER5.map(w => WORLDS[w].isl) }; }""")
    log.check(not r['bad'], 'registrations: the 28 games, each with its island, background (+ thumbnail), host, friends, icon and things %s' % r['bad'][:5])
    log.w('registrations: %d of 28 games on their new background; island pictures %s; rules written: %s' % (r['newbg'], r['isl'], ','.join(r['rules'])))
    log.check(not page.errors, 'registrations: zero page errors %s' % page.errors[:3])
    page.context.close()


def parent_early(log, br, base):
    """the parent panel's body is in the lazy file (first screen budget, docs/W5-DESIGN.md §9.5): opened before it is in (here:
    on the entry screen, before the entry tap asks for them), the panel shows its title, 关闭 and 稍等, then fills itself in;
    closed while waiting, it stays closed; opened later it is complete at once"""
    from harness import new_page
    tag = 'parent panel before the lazy files'
    page = new_page(br, base, 1180, 820, fast=True)
    st = page.evaluate("() => { Parent.open(); const sh = document.querySelector('#parent .sheet'); return { on: document.querySelector('#parent').classList.contains('on'), h2: (sh.querySelector('h2') || {}).textContent, close: !!sh.querySelector('button.x'), text: sh.textContent }; }")
    log.check(st['on'] and st['h2'] == '家长面板' and st['close'] and '稍等' in st['text'], '%s: opened at once - title, 关闭 and "稍等，正在打开……" %s' % (tag, st['text'][:40]))
    page.wait_for_function("() => /语音诊断/.test(document.querySelector('#parent .sheet').textContent)", timeout=20000)
    st = page.evaluate("() => { const t = document.querySelector('#parent .sheet').textContent; return { wait: /稍等/.test(t), parts: ['语音诊断', '每个世界的进度与难度', '离线', '设置', '全部解锁', '清空进度', '教一教', '答错后的讲解'].filter(k => !t.includes(k)), on: document.querySelector('#parent').classList.contains('on') }; }")
    log.check(st['on'] and not st['wait'] and not st['parts'], '%s: it fills itself in when they arrive (voice, progress tables, offline, settings, 教一教, the explain setting) - missing %s' % (tag, st['parts']))
    page.evaluate("() => Parent.close()")
    page.context.close()
    # closed while waiting: stays closed
    page = new_page(br, base, 1180, 820, fast=True)
    page.evaluate("() => { Parent.open(); Parent.close(); }")
    page.wait_for_function("() => W3.loaded === true", timeout=20000); page.wait_for_timeout(300)
    st = page.evaluate("() => ({ on: document.querySelector('#parent').classList.contains('on'), text: document.querySelector('#parent .sheet').textContent })")
    log.check(not st['on'] and not st['text'], '%s: closed while it waited - it stays closed %s' % (tag, st))
    # after the entry tap: the whole panel at once, the 积木城 table in it, the gear's long press opens it
    go_map(page)
    page.evaluate("() => { Store.s.w5 = true; Parent.open(); }")
    st = page.evaluate("() => { const t = document.querySelector('#parent .sheet').textContent; return { wait: /稍等/.test(t), w5: /积木城（第五世界/.test(t), lessons: /上课对照/.test(t) }; }")
    log.check(not st['wait'] and st['w5'] and st['lessons'], '%s: opened on the map the panel is complete at once (积木城 table, 上课对照) %s' % (tag, st))
    page.evaluate("() => Parent.close()")
    log.check(not page.errors, '%s: zero page errors %s' % (tag, page.errors[:3]))
    page.context.close()


def run(log, eng='chromium'):
    from playwright.sync_api import sync_playwright
    from harness import serve
    with sync_playwright() as p, serve() as base:
        br = getattr(p, eng).launch()
        for fn, args in ((registrations, ()), (parent_early, ()), (child_save, (['peppa5', 'bluey5'],)), (child_save, (ALL5,)), (new_player, ()), (whole_world, ())):
            try:
                fn(log, br, base, *args)
            except Exception as e:
                log.check(False, '%s: %s' % (fn.__name__, str(e)[:300]))
        br.close()


if __name__ == '__main__':
    from harness import Log
    L = Log('w5_flow')
    run(L, sys.argv[1] if len(sys.argv) > 1 else 'chromium')
    sys.exit(0 if L.close() else 1)
