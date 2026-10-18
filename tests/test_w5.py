# -*- coding: utf-8 -*-
"""World 5 (积木城, docs/W5-DESIGN.md): every game of the LIVE islands (raw/js/w5/live.json) - or the games named in
W5_ONLY (any island, live or not: for the island being written) - and the progress of the world.
Per game:
  - gen: levels 1-5 x 300 seeds - an answer; the rule's audit(q) (one entry per ask): every ask has >= 5 options and exactly
    ONE right, the right one's place balanced over the options (each place 0.4-2.0 x its share), 一题两问 = two asks;
    a construction game says so ({ build: true, chance }) and a random play is right at most 1 time in 5; the key varies
  - lines(): every sentence <= 8 Chinese characters, every one recorded (assets/voice bank; W5_VOICE=warn while writing)
  - right: difficulty 1-5 answered right (judged right, no error), landscape 1180 x 820; 2 and 4 portrait 820 x 1180; 3 at
    1024 x 768
  - targets: every tap target of the question (st.map) on screen, on top, >= 88 CSS px, clear of the friends, the top bar
    and the task card - landscape, portrait and 1024 x 768
  - mouse: a real mouse click on the right answer (L1 and L5) submits it
  - wrong: at every level: named, then the explain step (the game's own explain(st, ans), the one he chose ringed blue and
    no longer ticked, the RIGHT one ringed gold, no praise, never 错), then a NEW question of the same kind
Progress (when W5_ONLY is not set; islands made live in the page with window.__live5):
  - a new player: closed until the second sea is flagged; then sea 2's gate turns gold for 积木城, through it "登上积木城啦！",
    one island and one game at a time, an island not live is a cloud ("新岛还在建哦！") and never opens; the gates go
    2 -> 5 -> 3 -> 4 -> 1; all seven flagged: the block castle and the party; then 积木城's gate leads up to the sky
  - the child's save (19 flags: worlds 1-2 complete, the sky in progress at 西游记·天宫): 积木城 opens, the map flies there ONCE
    ("积木城开啦！"), the sky stays open and goes on (its next island opens after 天宫's flag), nothing lost or locked
  - a flag in 积木城 opens a hero card; laps (再玩一圈) start there; teach mode and the explain setting work in a world-5 game;
    the parent panel has 积木城's table and the lesson table (上课对照)
usage: python tests/test_w5.py [chromium|webkit] [jobs=3]      W5_ONLY=P8 (one island while it is written: W5_ONLY=P5,P6,P7,P8)
       W5_TIMING=1: also the explain step in real time (<= 5.5 s, a tap ends it within 1.6 s)"""
import os, sys, re
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log

ENG = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('chromium', 'webkit', 'firefox') else 'chromium'
JOBS = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 3
CJK = re.compile(r'[一-鿿]')
KEY = "(() => { const st = Session.st; return st && st.q ? JSON.stringify(st.game.key(st.q)) : null; })()"
GEO = """() => { const st = Session.st, out = [], vw = innerWidth, vh = innerHeight;
  if (!st || !st.map) return ['no question'];
  for (const id in st.map) { const e = st.map[id]; if (!e || !e.isConnected) continue; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || cs.pointerEvents === 'none') continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.left < -2 || r.top < -2 || r.right > vw + 2 || r.bottom > vh + 2) out.push(id + ' off screen');
    if (Math.min(r.width, r.height) < 88) out.push(id + ' ' + Math.round(Math.min(r.width, r.height)) + 'px');
    const pe = e.style.pointerEvents; e.style.pointerEvents = 'auto'; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); e.style.pointerEvents = pe;
    if (!(h === e || (h && e.contains(h)))) out.push(id + ' covered by ' + (h ? (h.className && h.className.baseVal === undefined ? h.className : h.tagName) : 'nothing')); }
  const R = window.__layoutReport(), cut = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const keep = R.actors.filter(a => !a.math).map(a => ({ id: 'actor ' + a.id, x: a.x + a.w * 0.2, y: a.y + a.h * 0.12, w: a.w * 0.6, h: a.h * 0.8 })).concat(R.hud.map(h => ({ id: 'hud ' + h.id, x: h.x, y: h.y, w: h.w, h: h.h })), R.math.filter(m => m.cls === 'task').map(m => ({ id: 'task card', x: m.x, y: m.y, w: m.w, h: m.h })));
  R.targets.forEach(t => keep.forEach(k => { if (cut(t, k) > 64) out.push(t.id + ' overlaps ' + k.id); }));
  return out; }"""
XWRAP = """() => {
  if (!window.__said) { window.__said = []; const vs = Voice.say.bind(Voice); Voice.say = (t, x) => { window.__said.push(t); return vs(t, x); }; }
  ORDER5.forEach(w => WORLDS[w].games.forEach(id => {
    const g = GAMES[id]; if (!g || g.__xw) return; g.__xw = true; const orig = g.explain;
    g.explain = async function (st, ans) {
      const rec = { id, level: st.level, gen: st.gen, phase: st.phase, explaining: !!st.explaining, own: !!orig, t0: performance.now(), s0: window.__said.length };
      window.__xr = rec;
      try { if (orig) await orig.call(this, st, ans); else await this.reveal(st); } catch (e) { rec.err = String((e && e.message) || e); throw e; }
      rec.ms = Math.round(performance.now() - rec.t0); rec.alive = Session.alive(st);
      rec.said = window.__said.slice(rec.s0);
      const rings = Array.from(document.querySelectorAll('#stage > .ringo')).filter(r => getComputedStyle(r).visibility !== 'hidden');
      const inside = (r, e) => { const a = r.getBoundingClientRect(), b = e.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; return x >= a.left - 3 && x <= a.right + 3 && y >= a.top - 3 && y <= a.bottom + 3; };
      const gold = rings.filter(r => getComputedStyle(r).borderTopColor === 'rgb(255, 201, 60)');
      const right = (this.rightEls ? this.rightEls(st, ans) : []) || [];
      rec.right = right.length; rec.rightOk = right.length > 0 && right.every(e => e && e.isConnected && gold.some(r => inside(r, e)));
      rec.chosen = (st.xb || []).length;
      const R = new Set(right); rec.marked = (st.xb || []).filter(e => e && !R.has(e) && (e.classList.contains('hi') || ['rgb(255, 229, 138)', 'rgb(255, 233, 168)'].includes(getComputedStyle(e).backgroundColor))).length;
      rec.bad = rec.said.filter(t => (this.praise || []).includes(t) || PRAISE.includes(t) || /错/.test(t));
      if (window.__xhold) await new Promise(r => { window.__xrel = r; });
    };
  }));
}"""
# audit(q) -> [{ n, at, right }] per ask, or [{ build: true, chance }] (a construction game)
GEN = """(g) => { const R = GAMES[g], bad = []; let keys = 0; const kinds = {};
  if (!R.audit) return { bad: ['no audit(q) in the rule'], keys: 0, kinds: [] };
  for (let lv = 1; lv <= 5; lv++) { const G = { world: R.world, W: WORLDS[R.world], rng: RNG(lv * 13 + 3), bags: {}, ws: Store.w(R.world), level: lv }, seen = new Set(), pos = []; let n = 0;
    for (let i = 0; i < 300; i++) { let qq, A;
      try { qq = R.gen(G, { level: lv, rng: G.rng }); A = R.audit(qq); } catch (e) { bad.push('L' + lv + ' throws ' + e.message); break; }
      if (!qq || qq.answer === undefined || qq.answer === null) { bad.push('L' + lv + ' no answer'); break; }
      if (!Array.isArray(A) || !A.length) { bad.push('L' + lv + ' audit is not a list'); break; }
      if (A[0].build) { kinds['build'] = 1; if (!(A[0].chance <= 0.2)) bad.push('L' + lv + ' a random play is right ' + A[0].chance); }
      else { kinds[A.length === 2 ? 'two asks' : A[0].n + ' options'] = 1; n++;
        A.forEach((a, k) => { if (!(a.n >= 5)) bad.push('L' + lv + ' ask ' + k + ': only ' + a.n + ' options'); if (a.right !== 1) bad.push('L' + lv + ' ask ' + k + ': ' + a.right + ' right options ' + JSON.stringify(qq.k)); if (!(a.at >= 0 && a.at < a.n)) bad.push('L' + lv + ' ask ' + k + ': right one at ' + a.at);
          const P = pos[k] || (pos[k] = {}); P.n = a.n; P.c = P.c || Array(a.n).fill(0); if (a.at >= 0 && a.at < P.c.length) P.c[a.at]++; }); }
      seen.add(JSON.stringify(R.key ? R.key(qq) : qq.k)); }
    keys += seen.size; if (seen.size < 4) bad.push('L' + lv + ' only ' + seen.size + ' different questions');
    if (n >= 100) pos.forEach((P, k) => { const e = n / P.n; if (P.c.some(c => c < 0.4 * e || c > 2.0 * e)) bad.push('L' + lv + ' ask ' + k + ': the right place is not balanced ' + JSON.stringify(P.c)); });
  }
  return { bad: Array.from(new Set(bad)).slice(0, 5), keys, kinds: Object.keys(kinds) }; }"""
LINES = """(g) => { const R = GAMES[g]; if (!R.lines) return { missing: true }; const L = R.lines(), cjk = t => (t.match(/[一-鿿]/g) || []).length;
  return { n: L.length, long: L.filter(t => cjk(t) > 8), unrec: L.filter(t => !Bank.has(t)), bad: L.filter(t => /错/.test(t)) }; }"""


def load_games(page):
    from harness import enter
    for _ in range(5):
        page.evaluate("() => W3.load()")
        if page.evaluate("() => W5.ready === true && ORDER5.every(w => WORLDS[w].games.every(g => !!GAMES[g] && !!GAMES[g].gen))"): return True
        page.reload(); page.wait_for_function('window.__ready === true', timeout=30000); enter(page)
    return False


def per_game(args):
    ids, vw, vh = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_phase, q
    out = []
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENG).launch()
        page = new_page(br, base, vw, vh, fast=True); enter(page)
        out.append((load_games(page), '%dx%d the games loaded' % (vw, vh)))
        page.evaluate(XWRAP)
        for w, g in ids:
            if vw > vh and vw == 1180:
                r = page.evaluate(GEN, g)
                out.append((not r['bad'], '%s gen L1-5 x 300: %s; one right per ask, its place balanced, enough variety (%d keys) %s' % (g, '/'.join(r['kinds']), r['keys'], r['bad'])))
                L = page.evaluate(LINES, g)
                if L.get('missing'): out.append((False, '%s lines(): missing' % g))
                else:
                    out.append((not L['long'] and not L['bad'], '%s lines(): %d sentences, none longer than 8 characters %s, no 错 %s' % (g, L['n'], L['long'][:4], L['bad'][:2])))
                    vok = not L['unrec']
                    if not vok and os.environ.get('W5_VOICE') == 'warn': out.append((None, '%s lines(): %d not recorded yet %s' % (g, len(L['unrec']), L['unrec'][:4])))
                    else: out.append((vok, '%s lines(): every sentence recorded (%d not: %s)' % (g, len(L['unrec']), L['unrec'][:4])))
            for lv in ((1, 2, 3, 4, 5) if vw > vh and vw == 1180 else (2, 4) if vw < vh else (3,)):
                for seed in ((5 + lv, 31 + lv) if vw == 1180 else (7 + lv,)):
                    before = len(page.errors)
                    page.evaluate("([w,g,l,s]) => { (Store.w(w).gstars || {})[g] = 0; window.__go(w, g, l, {noDemo: true, seed: s}); }", [w, g, lv, seed])
                    try:
                        cur = wait_phase(page, timeout=25000); page.wait_for_timeout(250)
                        geo = page.evaluate(GEO)
                        if geo: out.append((False, '%dx%d %s L%d s%d targets: %s' % (vw, vh, g, lv, seed, geo[:4])))
                        gen, snap = answer_question(page, 'right', timeout=25000)
                        wait_next_question(page, gen, timeout=30000)
                        nq = q(page)
                        sub = snap and (snap.get('submitted') or snap.get('gen') != gen)
                        ok = sub and not (nq and (nq.get('retest') or nq.get('err')))
                        out.append((ok and not page.errors[before:], '%dx%d %s L%d s%d right: judged right, no error %s' % (vw, vh, g, lv, seed, page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%dx%d %s L%d s%d right: %s %s' % (vw, vh, g, lv, seed, str(e)[:160], page.errors[before:][:1])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            if vw == 1180:
                for lv in (1, 5):          # a real mouse on the right answer
                    before = len(page.errors)
                    page.evaluate("([w,g,l]) => { (Store.w(w).gstars || {})[g] = 0; window.__go(w, g, l, {noDemo: true, seed: 23}); }", [w, g, lv])
                    try:
                        cur = wait_phase(page, timeout=25000); gen0 = cur['gen']; page.wait_for_timeout(300)
                        for _ in range(16):
                            st = page.evaluate("(g) => { const st = Session.st; if (!st || st.gen !== g) return 'gone'; if (st.submitted) return 'sub'; if (!['act', 'ready', 'input'].includes(st.phase)) return 'wait'; const nx = st.game.next(st, 'right'); if (!nx) return 'none'; if (nx.g !== 'tap') return 'gesture:' + nx.g; const e = st.map[nx.p.id]; if (!e) return 'nomap:' + nx.p.id; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }", gen0)
                            if st in ('gone', 'sub'): break
                            if st == 'wait': page.wait_for_timeout(120); continue
                            if not isinstance(st, list): break
                            page.mouse.click(st[0], st[1]); page.wait_for_timeout(420)
                        sub = page.evaluate("(g) => !Session.st || Session.st.gen !== g || Session.st.submitted", gen0)
                        if isinstance(st, str) and st.startswith('gesture:'):
                            out.append((True, '%s L%d mouse: answered by a %s gesture (not a tap) - covered by the harness' % (g, lv, st)))
                        else:
                            out.append((sub and not page.errors[before:], '%s L%d mouse: a real click on the right answer submits it (%s) %s' % (g, lv, st, page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%s L%d mouse: %s' % (g, lv, str(e)[:160])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            for lv in ((1, 2, 3, 4, 5) if vw == 1180 else (3,)):
                for seed in ((19, 41) if vw == 1180 else (29,)):
                    before = len(page.errors)
                    page.evaluate("window.__xr = null")
                    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, seed])
                    try:
                        wait_phase(page, timeout=25000); k0 = page.evaluate(KEY)
                        gen, snap = answer_question(page, 'wrong', timeout=25000)
                        wait_next_question(page, gen, timeout=30000)
                        nq = wait_phase(page, timeout=25000); k1 = page.evaluate(KEY)
                        x = page.evaluate("window.__xr") or {}
                        okx = x.get('gen') == gen and x.get('phase') == 'explain' and x.get('explaining') and x.get('own') and not x.get('err') and x.get('rightOk') and x.get('chosen', 0) > 0 and not x.get('marked') and not x.get('bad')
                        out.append((nq and nq.get('retest') and k1 != k0 and okx and not page.errors[before:], '%dx%d %s L%d s%d wrong: named; explain (own %s, right one ringed gold %s/%s, chosen marked %s (still ticked %s), said %s); a new question follows (%s), no error %s' % (vw, vh, g, lv, seed, x.get('own'), x.get('rightOk'), x.get('right'), x.get('chosen'), x.get('marked'), (x.get('said') or [])[:3] + (x.get('bad') or []), k1 != k0, page.errors[before:][:1] or x.get('err') or '')))
                    except Exception as e:
                        out.append((False, '%dx%d %s L%d wrong: %s %s' % (vw, vh, g, lv, str(e)[:160], page.errors[before:][:1])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
        out.append((not page.errors, '%dx%d %s zero page errors %s' % (vw, vh, [x[1] for x in ids][:1], page.errors[:3])))
        br.close()
    return out


PHASE = """([gen, skip]) => new Promise(res => {
  let t0 = null; const t1 = performance.now();
  const tick = () => { const q = window.__q;
    if (t0 === null) { if (q && q.gen === gen && q.phase === 'explain') { t0 = performance.now(); if (skip) setTimeout(() => gesture('skip'), 400); } else if (!q || q.gen !== gen || performance.now() - t1 > 30000) return res(-1); }
    else if (!q || q.gen !== gen || q.phase !== 'explain') return res(performance.now() - t0);
    setTimeout(tick, 15); };
  tick(); })"""


def timing(args):
    """the explain step in real time (no fast mode), every game at L1, L3 and L5: the explain phase (the engine's "again" line
    included) at most 5.5 s; a tap 0.4 s in ends it within 1.6 s"""
    ids, = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, wait_next_question, wait_phase, answer_question, q
    out = []
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENG).launch()
        page = new_page(br, base, 1180, 820, fast=False, sw='block'); enter(page)
        load_games(page); page.evaluate(XWRAP)
        for w, g in ids:
            for lv in (1, 3, 5):
                for skip in (False, True):
                    before = len(page.errors)
                    page.evaluate("window.__xr = null")
                    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 19})", [w, g, lv])
                    try:
                        wait_phase(page, timeout=60000)
                        gen, snap = answer_question(page, 'wrong', timeout=60000)
                        for _ in range(20):
                            cur = q(page)
                            if not cur or cur['gen'] != gen or cur.get('submitted'): break
                            answer_question(page, 'wrong', timeout=60000)
                        ms = page.evaluate(PHASE, [gen, skip])
                        wait_next_question(page, gen, timeout=60000)
                        x = page.evaluate("window.__xr") or {}
                        if skip:
                            out.append((0 <= ms <= 1600 and not page.errors[before:], '%s L%d explain skipped by a tap at 0.4 s: over %.1f s later (<= 1.6 s) %s' % (g, lv, ms / 1000.0 - 0.4, page.errors[before:][:1])))
                        else:
                            out.append((1000 <= ms <= 5500 and x.get('rightOk') and not page.errors[before:], '%s L%d explain in real time: phase %.1f s (<= 5.5 s), right one ringed gold %s %s' % (g, lv, ms / 1000.0, x.get('rightOk'), page.errors[before:][:1])))
                    except Exception as e:
                        out.append((False, '%s L%d explain timing: %s' % (g, lv, str(e)[:160])))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(100)
        br.close()
    return out


def main():
    log = Log('w5_' + ENG)
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        all_ids = page.evaluate("() => ORDER5.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        live = page.evaluate("() => LIVE5.slice()")
        br.close()
    only = os.environ.get('W5_ONLY')
    if only:
        ids = [x for x in all_ids if x[1] in only.split(',')]
    else:
        ids = [x for x in all_ids if x[0] in live]
        log.w('live islands: %s (the others are skipped: not live yet - W5_ONLY=<ids> tests a game of any island)' % (live or 'none'))
    if ids:
        jobs = [(ids[i::JOBS], 1180, 820) for i in range(JOBS)] + [(ids[i::JOBS], 820, 1180) for i in range(JOBS)] + [(ids[i::JOBS], 1024, 768) for i in range(JOBS)]
        jobs = [j for j in jobs if j[0]]
        with Pool(JOBS) as pool:
            for part in pool.map(per_game, jobs):
                for ok, msg in part:
                    if ok is None: log.warn(msg)
                    else: log.check(ok, msg)
            if os.environ.get('W5_TIMING'):
                for part in pool.map(timing, [(ids[i::JOBS],) for i in range(JOBS) if ids[i::JOBS]]):
                    for ok, msg in part: log.check(ok, msg)
    if not only:
        import w5_flow
        w5_flow.run(log, ENG)
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
