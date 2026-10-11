# -*- coding: utf-8 -*-
"""Five options and "why" after a wrong answer (docs/OPTIONS-EXPLAIN-SPEC.md, client 2026-10-10) for the sky (world 3,
28 games), the arithmetic island (Z1-Z4) and the review question types (RQ / RevGame: review, key round, monthly test):
 G  generators: every game x level, 300 questions with one session's bags: every choice offers 5 options (or asks two
    small questions in one - 一题两问), exactly one is right (each game's own independent check: game.audit / RQ.audit),
    no two options alike, and the right one's place is balanced (every place within +-40 % of an even share)
 E  explain: every game x level answered wrong: the explain step runs (st.phase 'explain'), a blue ring on his choice and
    a gold ring on the right one, no red cross, nobody cheers, no page error, every line said in it <= 8 characters and
    recorded or listed in raw/js/w4/w3explain.voice.txt; then a new question
 R  the review types the same way (test mode on two islands)
 L  layout: every choice game x level x 1180x820 / 820x1180 / 1024x768: every option >= 88 CSS px, on screen, on top (8
    of 9 points hit it), not under the home button, the host, the star tray, the question pill or a character
 S  screenshots in tests/logs/opt3/: every game with its five options and its explanation (landscape and portrait), the
    review types; the explanation's length is logged (2-5 s asked; > 6 s fails)
 T  timing at real speed (review OX1): every game of the sky and the arithmetic island at one level (U4 at levels 2 and 4)
    and the review types: the explanation lasts <= 6 s, and a tap 0.4 s into it ends it within 2 s
The list of new sentences (raw/js/w4/w3explain.voice.txt) is a source file: where it is not delivered every sentence said
in an explanation must be in the voice bank.
usage: python tests/test_opt3.py [jobs=3] [G,E,R,L,S,T]"""
import os, sys, json, re, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log, ROOT

JOBS = int(sys.argv[1]) if len(sys.argv) > 1 else 3
PARTS = sys.argv[2].split(',') if len(sys.argv) > 2 else ['G', 'E', 'R', 'L', 'S', 'T']
SHOTS = os.path.join(ROOT, 'tests', 'logs', 'opt3')
os.makedirs(SHOTS, exist_ok=True)
_NEWF = os.path.join(ROOT, 'raw', 'js', 'w4', 'w3explain.voice.txt')          # not in a delivered copy (raw/ is not published): then the bank alone
NEW = [l.strip() for l in open(_NEWF, encoding='utf-8') if l.strip()] if os.path.exists(_NEWF) else []
# the machine (socket buffers) and other builds running at the same time (sw.js rewritten while a real-speed page updates it)
NOISE = ('ERR_NO_BUFFER_SPACE', 'ERR_INSUFFICIENT_RESOURCES', 'ERR_ADDRESS_IN_USE', 'Failed to update a ServiceWorker')
CARDS = ['sub5', 'give10', 'cmp10', 'cmp20', 'next10', 'next20', 'on10', 'on20', 'part5', 'part10', 'ten20', 'add10', 'sub10', 'F+3+4', 'F-8-3']
OPEN = "() => { Store.s.w2all = true; Store.s.w3 = true; ORDER.concat(ORDER2, ORDER3).forEach(id => { const ws = Store.w(id); ws.unlocked = true; ws.demo = {}; WORLDS[id].games.forEach(g => { ws.demo[g] = true; }); }); Store.save(); }"
GO = "([g, l, s, c]) => { const w = Object.keys(WORLDS).find(x => (WORLDS[x].games || []).includes(g)); window.__go(w, g, l, c ? { seed: s, test: true, keyItems: [c], noDemo: true } : { seed: s, noDemo: true }); }"
# what happens during the explanation: rings (their colour), lines said, cheering, red crosses
HOOK = r"""() => {
  window.__ex = { rings: [], lines: [], cheer: 0, seen: false };
  const o = K.ring; K.ring = function (st, rects, pad, color) { if (st && st.phase === 'explain') window.__ex.rings.push(color || 'ink'); return o.apply(this, arguments); };
  const v = Voice.say; Voice.say = function (t, opt) { const st = Session.st; if (st && st.phase === 'explain') window.__ex.lines.push(t); return v.apply(this, arguments); };
  if (typeof Actor !== 'undefined') { const c = Actor.prototype.cheer; Actor.prototype.cheer = function () { const st = Session.st; if (st && st.phase === 'explain') window.__ex.cheer++; return c.apply(this, arguments); }; }
  const p = setInterval(() => { const st = Session.st; if (st && st.phase === 'explain') window.__ex.seen = true; }, 5);
}"""
GEN = r"""([ids, cards]) => {
  const out = [];
  const check = (name, lv, mk, audit) => {
    const hist = {}; let bad = null, kind = null, n = 0, keys = new Set();
    for (let s = 0; s < 300 && !bad; s++) {
      let q; try { q = mk(); } catch (e) { bad = 'throw ' + e.message; break; }
      let a; try { a = audit(q); } catch (e) { bad = 'audit throws ' + e.message; break; }
      keys.add(JSON.stringify(q.k));
      if (a.none) { if (!kind) kind = 'not a choice'; continue; }
      if (a.err) { bad = a.err + ' ' + JSON.stringify(q.k); break; }
      if (a.two) { kind = 'two-in-one (' + a.n + ' each)'; if (a.n > 3) bad = 'two small questions with ' + a.n + ' options'; }
      else { kind = (a.pick === 2 ? 'pick two of ' : '') + a.n; if (a.n < 5) { bad = 'only ' + a.n + ' options'; break; } }
      if (a.pos != null) [].concat(a.pos).forEach(p => { hist[p] = (hist[p] || 0) + 1; n++; });
    }
    /* balance: every place within +-40 % of an even share (spatial games - a picture, a board - have no places) */
    const places = Object.keys(hist).length, even = places ? n / places : 0, worst = places ? Math.max(...Object.values(hist).map(c => Math.abs(c - even) / even)) : 0;
    if (!bad && places && worst > 0.4) bad = 'places not balanced ' + JSON.stringify(hist);
    out.push([name, lv, bad, kind, places ? JSON.stringify(hist) : '-', keys.size]);
  };
  for (const id of ids) { const g = GAMES[id], w = Object.keys(WORLDS).find(x => (WORLDS[x].games || []).includes(id));
    for (let lv = 1; lv <= 5; lv++) { const G = { rng: RNG(lv * 7919 + id.charCodeAt(0) * 31 + id.charCodeAt(1)), bags: {}, ws: Store.w(w), id, world: w, W: WORLDS[w] }; check(id, lv, () => g.gen(G, { level: lv, kind: g.kind0, rng: G.rng }), q => g.audit(q)); } }
  for (const c of cards) { const t = isFact(c) ? 'fact' : SKILLS[c].t; for (const lv of [1, 3, 5]) { const G = { rng: RNG(lv * 31 + c.length * 7 + c.charCodeAt(1)), bags: {} }; check('rq:' + c, lv, () => Object.assign(RQ[t].gen(G, c, { level: lv, sup: 0 }), { t, c }), q => RQ.audit(q)); } }
  return out;
}"""
# the option elements of a question (the things the child chooses among)
OPTS = r"""(() => { const st = Session.st; if (!st) return []; const q = st.q, id = st.G.id, rv = st.game && st.game.review;
  const M = { E1: () => st.cakes, E3: () => st.objs, U1: () => st.cards, U2: () => (q.mode === 'read' ? st.cards : []), U3: () => st.cups.map(o => o.e), U4: () => st.optEls,
    K2: () => q.A.concat(q.B).map(o => o.e), K3: () => st.cells.filter((_, i) => !st.b[i]), K4: () => st.cards, R1: () => st.cards, R2: () => st.handEls, R3: () => st.sheep, R4: () => st.potEls.map(o => o.e),
    L3: () => (q.mode === 'read' ? st.cards : []), L4: () => st.cards, S1: () => st.plateEls, S2: () => st.doorEls, S3: () => st.fanEls, S4: () => st.cards,
    T1: () => (q.mode === 'who' ? st.cards : MSorter.trees[q.tree].bins.map(b => st.nodes[b])), T2: () => st.cards, T3: () => st.tgEls, T4: () => q.cands.map(i => st.gearEls[i]),
    Z1: () => st.cards, Z2: () => st.cards, Z3: () => st.cards, Z4: () => st.cards };
  const f = rv ? (() => (q.t === 'give' ? [] : st.cards)) : M[id]; return f ? (f() || []).filter(Boolean) : null; })()"""
LAYOUT = r"""() => { const els = """ + OPTS + r""", st = Session.st, out = [];
  if (!els) return { skip: true };
  const R = e => e.getBoundingClientRect(), inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const hud = ['#home', '#avatar', '#tray'].map(s => document.querySelector(s)).filter(e => e && R(e).width > 0).concat(st.els.filter(e => e.isConnected && e.classList && e.classList.contains('task')));
  const actors = st.game.review ? [] : Object.values(st.G.actors).filter(a => a.root && a.root.isConnected && getComputedStyle(a.root).display !== 'none' && getComputedStyle(a.root).visibility !== 'hidden' && R(a.root).width > 2).map(a => ({ id: a.id, r: a.root.querySelector('img') ? R(a.root.querySelector('img')) : R(a.root) }));
  els.forEach((e, i) => {
    const r = R(e);
    if (Math.min(r.width, r.height) < 88) out.push('small' + i + ':' + Math.round(Math.min(r.width, r.height)));
    if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) out.push('off screen ' + i);
    let hit = 0; for (const fx of [0.3, 0.5, 0.7]) for (const fy of [0.3, 0.5, 0.7]) { const h = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (h && (h === e || e.contains(h))) hit++; }
    if (hit < 8) out.push('covered' + i + ':' + hit + '/9');
    hud.forEach(h => { if (inter(r, R(h)) > 4) out.push('under ' + (h.id || 'question pill') + ' ' + i); });
    actors.forEach(a => { if (inter(r, a.r) > 0.12 * r.width * r.height) out.push('over ' + a.id + ' ' + i); });
  });
  return { n: els.length, out };
}"""


def ids_all():
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = page.evaluate("() => ORDER3.flatMap(w => WORLDS[w].games)")
        br.close()
    return ids


def ready(page):
    """the page with every game in: other builds rewrite index.html now and then - a page caught half way is loaded again"""
    from harness import enter
    for k in range(6):
        try:
            page.evaluate("() => W3.load()")
            page.wait_for_function("() => W3.loaded === true && !!GAMES.Z1 && !!GAMES.E1 && !!GAMES.T4 && typeof RQ !== 'undefined'", timeout=15000)
            return True
        except Exception:
            page.wait_for_timeout(3000); page.reload(); page.wait_for_function('window.__ready === true', timeout=30000); enter(page)
    return False


def errs(page, before):
    return [e for e in page.errors[before:] if not any(k in e for k in NOISE)]


def part_gen(log, ids):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ready(page)
        for name, lv, bad, kind, hist, nk in page.evaluate(GEN, [ids, CARDS]):
            log.check(not bad and nk >= (1 if name.startswith('rq:F') else 2 if name == 'E4' or name.startswith('rq:') else 3), 'G %s L%d: %s options, exactly one right, places %s, %d different questions %s' % (name, lv, kind, hist, nk, bad or ''))
        log.check(not errs(page, 0), 'G no page errors %s' % errs(page, 0)[:2])
        br.close()


def explain_job(args):
    ids, vw, vh = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_phase
    out = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, vw, vh, fast=True); enter(page)
        ready(page); page.evaluate(OPEN); page.evaluate(HOOK)
        bank = page.evaluate("() => typeof Bank !== 'undefined' && !!Bank.set")
        for g, c in ids:
            for lv in ((2,) if c else (1, 2, 3, 4, 5)):
                before = len(page.errors)
                tag = '%s%s L%d %dx%d' % (g, (' ' + c) if c else '', lv, vw, vh)
                try:
                    page.evaluate(GO, [g, lv, 11 + lv, c])
                    wait_phase(page, timeout=40000)
                    choice = page.evaluate("() => { const st = Session.st, a = st.game.audit ? st.game.audit(st.q) : (st.game.review ? RQ.audit(st.q) : {}); return !a.none; }")
                    page.evaluate("() => { window.__ex = { rings: [], lines: [], cheer: 0, seen: false }; }")
                    gen, snap = answer_question(page, 'wrong', timeout=30000)
                    page.wait_for_function("([g]) => !Session.G || !Session.st || Session.st.gen !== g", arg=[gen], timeout=40000, polling=20)
                    ex = page.evaluate("window.__ex")
                    nxt = page.evaluate("() => !!Session.G && !!Session.st")
                    reds = page.evaluate("() => document.querySelectorAll('#stage .redx, #stage [data-redx]').length")
                    lines = ex['lines']
                    long = [t for t in lines if len(re.findall(r'[一-鿿]', t)) > 8]
                    unrec = page.evaluate("(ls) => ls.filter(t => !(typeof Bank !== 'undefined' && Bank.set && Bank.has(t)))", lines) if bank else []
                    unrec = [t for t in unrec if t not in NEW]
                    ok = ex['seen'] and '#FFC93C' in ex['rings'] and (not choice or '#4F7BFF' in ex['rings']) and ex['cheer'] == 0 and not long and not unrec and not reds and not errs(page, before) and (nxt or c)
                    out.append((ok, 'E %s: explain ran %s, rings %s, lines %s, cheer %d, too long %s, not recorded %s, next question %s %s' % (tag, ex['seen'], ex['rings'], lines, ex['cheer'], long, unrec, nxt, errs(page, before)[:1])))
                except Exception as e:
                    out.append((False, 'E %s: %s %s' % (tag, str(e)[:160], errs(page, before)[:1])))
                page.evaluate("gesture('home')"); page.wait_for_timeout(80)
        br.close()
    return out


def layout_job(args):
    ids, vw, vh = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, wait_phase
    out = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, vw, vh, fast=True); enter(page)
        ready(page); page.evaluate(OPEN)
        for g, c in ids:
            bad = []; n = 0
            for lv in ((2,) if c else (1, 2, 3, 4, 5)):
                for seed in (3, 8):
                    try:
                        page.evaluate(GO, [g, lv, seed, c]); wait_phase(page, timeout=40000); page.wait_for_timeout(450)
                        r = page.evaluate(LAYOUT)
                        if r.get('skip'): continue
                        n += 1
                        if r['out']: bad.append(('L%d s%d' % (lv, seed), r['n'], r['out'][:4]))
                    except Exception as e:
                        bad.append(('L%d s%d' % (lv, seed), str(e)[:120]))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            if n or bad:
                out.append((not bad, 'L %s%s %dx%d: %d questions, every option >= 88 px, on screen, on top, clear of the HUD / question / characters %s' % (g, (' ' + c) if c else '', vw, vh, n, bad[:3])))
        out.append((not errs(page, 0), 'L %dx%d no page errors %s' % (vw, vh, errs(page, 0)[:2])))
        br.close()
    return out


SHOT_LV = {'E1': 3, 'E2': 3, 'E3': 4, 'E4': 2, 'U1': 3, 'U2': 4, 'U3': 3, 'U4': 2, 'K1': 3, 'K2': 2, 'K3': 4, 'K4': 3, 'R1': 4, 'R2': 3, 'R3': 4, 'R4': 4,
           'L1': 3, 'L2': 3, 'L3': 3, 'L4': 3, 'S1': 4, 'S2': 3, 'S3': 4, 'S4': 3, 'T1': 2, 'T2': 3, 'T3': 3, 'T4': 3, 'Z1': 3, 'Z2': 3, 'Z3': 4, 'Z4': 3}


def shot_job(args):
    ids, ori = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_phase
    vw, vh = (1180, 820) if ori == 'L' else (820, 1180)
    out = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, vw, vh, fast=False); enter(page)
        ready(page); page.evaluate(OPEN)
        for g, c in ids:
            lv = 2 if c else SHOT_LV.get(g, 3)
            name = ('%s_%s' % (g, c.replace('+', 'p').replace('-', 'm')) if c else '%s_L%d' % (g, lv)) + '_' + ori
            before = len(page.errors)
            try:
                page.evaluate(GO, [g, lv, 5, c]); wait_phase(page, timeout=60000); page.wait_for_timeout(1100)
                page.screenshot(path=os.path.join(SHOTS, name + '.png'))
                gen, snap = answer_question(page, 'wrong', timeout=40000)
                page.wait_for_function("() => window.__q && window.__q.phase === 'explain'", timeout=40000, polling=20)
                t0 = time.time()
                page.wait_for_function("() => Array.from(document.querySelectorAll('.ringo')).some(e => getComputedStyle(e).borderTopColor === 'rgb(255, 201, 60)')", timeout=30000, polling=40)
                page.wait_for_timeout(450)
                page.screenshot(path=os.path.join(SHOTS, name + '_explain.png'))
                page.wait_for_function("() => !window.__q || window.__q.phase !== 'explain'", timeout=30000, polling=40)
                secs = time.time() - t0
                out.append((secs <= 6.0 and not errs(page, before), 'S %s: options and explanation shot, explanation %.1f s %s' % (name, secs, errs(page, before)[:1])))
            except Exception as e:
                out.append((False, 'S %s: %s %s' % (name, str(e)[:160], errs(page, before)[:1])))
            page.evaluate("gesture('home')"); page.wait_for_timeout(250)
        br.close()
    return out


def timing_job(args):
    ids, vw, vh = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_phase
    out = []
    PH = "(gen) => { const q = window.__q; return !q || q.gen !== gen || q.phase !== 'explain'; }"
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, vw, vh, fast=False); enter(page)
        ready(page); page.evaluate(OPEN)
        for g, lv, c in ids:
            tag = '%s%s L%d %dx%d' % (g, (' ' + c) if c else '', lv, vw, vh)
            res = []
            for skip in (False, True):
                before = len(page.errors)
                try:
                    page.evaluate(GO, [g, lv, 5, c]); wait_phase(page, timeout=60000); page.wait_for_timeout(600)
                    gen, snap = answer_question(page, 'wrong', max_steps=200, timeout=40000)
                    page.wait_for_function("(gen) => { const q = window.__q; return q && q.gen === gen && q.phase === 'explain'; }", arg=gen, timeout=40000, polling=10)
                    t0 = time.time()
                    if skip: page.wait_for_timeout(400); t0 = time.time(); page.evaluate("gesture('skip')")
                    page.wait_for_function(PH, arg=gen, timeout=20000, polling=20)
                    res.append(round(time.time() - t0, 1))
                except Exception as e:
                    res.append(None); out.append((False, 'T %s: %s %s' % (tag, str(e)[:140], errs(page, before)[:1])))
                page.evaluate("gesture('home')"); page.wait_for_timeout(250)
            if None not in res:
                out.append((res[0] <= 6.0 and res[1] <= 2.0, 'T %s: the explanation %.1f s (<= 6), a tap at 0.4 s ends it in %.1f s (<= 2)' % (tag, res[0], res[1])))
        out.append((not errs(page, 0), 'T %dx%d no page errors %s' % (vw, vh, errs(page, 0)[:2])))
        br.close()
    return out


def main():
    log = Log('opt3')
    ids = ids_all()                                   # the sky's islands, the arithmetic island among them
    only = os.environ.get('OPT3_ONLY')
    if only: ids = [x for x in ids if x in only.split(',')]
    games = [(g, None) for g in ids]
    review = [('P2', c) for c in CARDS] + [('Z2', c) for c in ('cmp10', 'add10', 'part10')]
    if only: review = [x for x in review if 'review' in only.split(',')]
    if 'G' in PARTS: part_gen(log, ids)
    with Pool(JOBS) as pool:
        if 'E' in PARTS:
            for part in pool.map(explain_job, [(games[i::JOBS], 1180, 820) for i in range(JOBS)]):
                for ok, msg in part: log.check(ok, msg)
        if 'R' in PARTS:
            for part in pool.map(explain_job, [(review[i::JOBS], 1180, 820) for i in range(JOBS)] + [(review[i::JOBS], 820, 1180) for i in range(JOBS)]):
                for ok, msg in part: log.check(ok, msg)
        if 'L' in PARTS:
            jobs = [(games + review, vw, vh) for vw, vh in ((1180, 820), (820, 1180), (1024, 768))]
            for part in pool.map(layout_job, jobs):
                for ok, msg in part: log.check(ok, msg)
        if 'T' in PARTS:
            items = [(g, SHOT_LV.get(g, 3), None) for g, _ in games] + [x for x in [('U4', 4, None), ('R4', 3, None)] if any(g == x[0] for g, _ in games)]
            items += [] if (only and 'review' not in only.split(',')) else [('P2', 2, c) for c in ('sub5', 'give10', 'cmp10', 'next10', 'on10', 'part10', 'ten20', 'add10', 'F+3+4')]
            for part in pool.map(timing_job, [(items[i::JOBS], 1180, 820) for i in range(JOBS)]):
                for ok, msg in part: log.check(ok, msg)
        if 'S' in PARTS:
            pick = games + [x for x in [('P2', c) for c in ('sub5', 'give10', 'cmp10', 'next10', 'on10', 'part10', 'ten20', 'add10', 'F+3+4')] if not only or 'review' in only.split(',')]
            jobs = [(pick[i::JOBS], o) for o in ('L', 'P') for i in range(JOBS)]
            for part in pool.map(shot_job, jobs):
                for ok, msg in part: log.check(ok, msg)
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
