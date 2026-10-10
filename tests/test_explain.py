# -*- coding: utf-8 -*-
"""Five options + "why" after a wrong answer (client 2026-10-10, docs/OPTIONS-EXPLAIN-SPEC.md) - worlds 1 and 2.

1. every game x every level: the answer phase of a question; a choice question shows FIVE options (or it is one of the
   documented "two asks" games), exactly one of them right; the options are laid out on the stage, >= 88 CSS px, on top
   (nothing covers them), clear of the HUD (home / avatar / tray), of the task card and of the characters - at
   1180x820, 820x1180 and 1024x768
2. every game x every level: one WRONG answer -> phase 'explain' runs, ends with a gold mark on the right option
   (window.__xlog), no page error, then a NEW question comes (retest)
3. generators (Session.genQ, no UI): >= 5 options, exactly one right, options distinct, the right answer's place among
   the five balanced (each place 14-26 %; the rank of a right NUMBER among the five is reported when one rank > 50 %)
usage: python tests/test_explain.py [part=all|gen|layout|explain] [worlds=w1,w2] [jobs=3]
log: tests/logs/explain.log"""
import os, sys, json, re
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Log, ROOT

PART = sys.argv[1] if len(sys.argv) > 1 else 'all'
WSEL = sys.argv[2] if len(sys.argv) > 2 else 'w1,w2'
JOBS = int(sys.argv[3]) if len(sys.argv) > 3 else 3
W1 = ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']
W2 = ['peppa2', 'bluey2', 'pjmasks', 'paw2', 'huluwa2', 'xiyou2', 'avengers2']
VIEWS = [(1180, 820), (820, 1180), (1024, 768)]
# questions that are not "pick one of several": nothing to count (build, trace, drive, sort by hand ...)
ACT = {'P2', 'P4', 'H2', 'Y1', 'Y3', 'D1', 'G2', 'G3', 'W1', 'Q3'}
# one question, two asks (2-3 possible answers): B1 more/less/same, B3 conservation, C2 most/least, Q2 where, Y2 which way
TWO = {'B1', 'B3', 'C2', 'Q2', 'Y2'}
# the answer is a PAIR of kites: 4 kites = 6 possible pairs (>= 5), random tapping 1/6 - left as it was (documented)
PAIRS = {'Q4'}
CHOICE = {'H1': r'^g\d$', 'X2': r'^c\d+$', 'Q2': r'^sp_', 'Q4': r'^k\d$', 'C4': r'^f\d$', 'J2': r'^b\d$', 'G1': r'^(s\d|card\d)$', 'C2': r'^(col\d|card\d)$',
          'B1': r'^(bluey|bingo|same)$', 'B3': r'^(bluey|bingo|same)$'}
NOREV = "(() => { try { if (typeof V2D !== 'undefined') { V2D.slot = () => null; V2D.plan = () => ({ pos: [] }); } } catch (e) {} })()"

# the options of the current question as the child sees them: [{id, right, x, y, w, h, covered}] in stage px + scale
OPTS_JS = r"""() => {
  const st = Session.st; if (!st) return null;
  const g = st.game, q = st.q;
  const sc = Stage.scale || (document.getElementById('stage').getBoundingClientRect().width / Stage.W);
  const R = e => { const b = e.getBoundingClientRect(), a = Stage.toStage(b.left, b.top), z = Stage.toStage(b.right, b.bottom); return { x: Math.round(a.x), y: Math.round(a.y), w: Math.round(z.x - a.x), h: Math.round(z.y - a.y), cw: Math.round(b.width), ch: Math.round(b.height) }; };
  const vis = e => { if (!e || !e.isConnected) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  let els = [];
  const ids = Object.keys(st.map || {});
  /* the option elements: answer cards (card0..), or the game's own pickable things */
  const pickRe = { H1: /^g\d$/, X2: /^c\d+$/, Q2: /^sp_/, Q4: /^k\d$/, C4: /^f\d$/, J2: /^b\d$/, G1: /^s\d$/, C2: /^col\d$/, B1: /^(bluey|bingo|same)$/, B3: /^(bluey|bingo|same)$/ };
  const re = st.G.id === 'C2' && !st.asked ? null : pickRe[st.G.id];          /* C2: the column heads are the answer only once all is sorted */
  ids.forEach(id => { if ((/^card\d$/.test(id) || (re && re.test(id))) && vis(st.map[id])) els.push([id, st.map[id]]); });
  /* what is right: the game's next('right') step */
  let rightId = null; try { const s = g.next(st, 'right'); rightId = s && s.p && (s.p.id || s.p.at); } catch (e) {}
  const out = els.map(([id, e]) => {
    const r = R(e);
    /* occlusion: 3 x 3 points inside; what is really on top there */
    let cov = 0, n = 0;
    for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) { const sx = r.x + r.w * (0.1 + 0.2 * i), sy = r.y + r.h * (0.1 + 0.2 * j), sp = Stage.toScreen(sx, sy); const h = document.elementFromPoint(sp.x, sp.y); n++; if (!(h && (h === e || e.contains(h)))) cov++; }
    return Object.assign({ id, right: id === rightId, cov: Math.round(100 * cov / n) }, r);
  });
  const hud = ['#home', '#avatar', '#tray'].map(s => document.querySelector(s)).filter(vis).map(e => Object.assign({ id: e.id }, R(e)));
  const task = st.els.filter(e => e.classList && e.classList.contains('task') && vis(e)).map(e => Object.assign({ id: 'task' }, R(e)));
  /* the characters on the stage (their core: a sticker's box has air around arms and head) */
  const actors = Object.values(st.G.actors).filter(a => !a.math && vis(a.root)).map(a => { const b = R(a.root); return { id: a.id, x: b.x + b.w * 0.14, y: b.y + b.h * 0.08, w: b.w * 0.72, h: b.h * 0.9 }; }).filter(a => a.x + a.w > 0 && a.x < Stage.W && a.y + a.h > 0 && a.y < Stage.H);
  return { game: st.G.id, level: st.level, kind: st.kind, phase: st.phase, W: Stage.W, H: Stage.H, opts: out, hud, task, actors, two: !!(q.q2 || st.sub2), answer: q.answer, nOpts: (st.opts || []).length };
}"""


def inter(a, b):
    x0, y0 = max(a['x'], b['x']), max(a['y'], b['y'])
    x1, y1 = min(a['x'] + a['w'], b['x'] + b['w']), min(a['y'] + a['h'], b['y'] + b['h'])
    return max(0, x1 - x0) * max(0, y1 - y0)


def games_of(page, worlds):
    """[(world, game, level)] for every level of every game"""
    out = []
    for w in worlds:
        mx = page.evaluate("(w) => MAXLV[w]", w)
        for g in page.evaluate("(w) => WORLDS[w].games.filter(g => GAMES[g])", w):
            out += [(w, g, lv) for lv in range(1, mx + 1)]
    return out


# the steps that come before the options (the child's own act that sets the question up) - done the right way
PRE = {'P1': r'^jumper$', 'P3': r'^t\d$', 'B2': r'^th\d$', 'B3': r'^stretch$', 'H3': r'^(b\d|done)$', 'H4': r'^gem\d+$',
       'A2': r'^(whistle|an\d+|bench)$', 'A3': r'^(pup\d|lift)$', 'A4': r'^(kit\d|group)$', 'X4': r'^(blow|curtain)$', 'V1': r'^portal$',
       'V3': r'^core$', 'C1': r'^p\d$', 'C2': r'^it\d+$', 'D2': r'^g\d$'}


def to_answer(page, game=None, gen=None):
    """wait for the question, do its preliminary act the right way, return when the options are up (or, for a question
    that is all act, at once)"""
    import re
    from harness import wait_phase
    wait_phase(page, phases=('act', 'ready', 'input'), timeout=25000, gen=gen)
    o = None
    for _ in range(80):
        cur = page.evaluate('window.__q')
        if not cur:
            page.wait_for_timeout(50); continue
        o = page.evaluate(OPTS_JS)
        if o and o['opts'] and cur['phase'] in ('ready', 'input'):
            return o
        if cur['phase'] in ('act', 'ready', 'input'):
            s = page.evaluate("window.__next('right')")
            sid = (s and s.get('p') and (s['p'].get('id') or '')) or ''
            pat = PRE.get(game or cur['game'])
            if s and pat and re.match(pat, sid):
                page.evaluate("([g, p]) => window.__gesture(g, p)", [s['g'], s['p']])
            elif s and not (o and o['opts']):
                return o                           # all act (or an act step that is the answer): no options to look at
        page.wait_for_timeout(120)
    return o


def layout_job(args):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question
    vw, vh, ids = args
    res = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, vw, vh, fast=True); enter(page); page.evaluate(NOREV)
        for w, g, lv in ids:
            r = {'v': '%dx%d' % (vw, vh), 'g': g, 'lv': lv, 'bad': [], 'n': []}
            try:
                page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 77 + l})", [w, g, lv])
                for qi in range(2):
                    o = to_answer(page, g)
                    if not o:
                        r['bad'].append('no question'); break
                    sc = vw / o['W'] if vw / o['W'] < vh / o['H'] else vh / o['H']
                    opts = o['opts']
                    r['n'].append(len(opts))
                    if g not in ACT and opts:                 # (no options at all: an act question of this level / kind)
                        if g in TWO:
                            if not (o['two'] or len(opts) >= 5):
                                r['bad'].append('q%d: two-ask game without a second ask (%d options)' % (qi, len(opts)))
                        elif len(opts) < 5 and not (g in PAIRS and len(opts) * (len(opts) - 1) // 2 >= 5):
                            r['bad'].append('q%d: %d options %s' % (qi, len(opts), [x['id'] for x in opts]))
                        nr = sum(1 for x in opts if x['right'])
                        if nr != 1:
                            r['bad'].append('q%d: %d right options' % (qi, nr))
                    for x in opts:
                        if x['cw'] < 88 or x['ch'] < 88:
                            r['bad'].append('q%d %s: %dx%d CSS px < 88' % (qi, x['id'], x['cw'], x['ch']))
                        if x['x'] < -2 or x['y'] < -2 or x['x'] + x['w'] > o['W'] + 2 or x['y'] + x['h'] > o['H'] + 2:
                            r['bad'].append('q%d %s: off the stage %s' % (qi, x['id'], (x['x'], x['y'], x['w'], x['h'])))
                        if x['cov'] > 22 and g != 'H1':          # H1: the vine's own slide layer lies over the gourds (it is the input)
                            r['bad'].append('q%d %s: covered %d%%' % (qi, x['id'], x['cov']))
                        for h in o['hud']:
                            hz = {'x': h['x'] - 6, 'y': h['y'] - 6, 'w': h['w'] + 12, 'h': h['h'] + 12}
                            if inter(hz, x) > 0:
                                r['bad'].append('q%d %s: under the HUD %s' % (qi, x['id'], h['id']))
                        for t in o['task']:
                            if inter(t, x) > 0:
                                r['bad'].append('q%d %s: over the task card' % (qi, x['id']))
                        for a in o['actors']:
                            ov = inter(a, x)
                            if g not in ('H2', 'J2', 'D4') and ov > 0.15 * min(a['w'] * a['h'], x['w'] * x['h']):
                                r['bad'].append('q%d %s: over the character %s (%d%%)' % (qi, x['id'], a['id'], 100 * ov / min(a['w'] * a['h'], x['w'] * x['h'])))
                    for i in range(len(opts)):
                        for j in range(i + 1, len(opts)):
                            if inter(opts[i], opts[j]) > 0:
                                r['bad'].append('q%d: options overlap %s ~ %s' % (qi, opts[i]['id'], opts[j]['id']))
                    if r['bad']:
                        page.screenshot(path=os.path.join(ROOT, 'tests', 'logs', 'opt', 'bad_%dx%d_%s_L%d_q%d.png' % (vw, vh, g, lv, qi)))
                        break
                    gen, snap = answer_question(page, 'right', timeout=25000); wait_next_question(page, gen, timeout=30000)
            except Exception as e:
                r['bad'].append('error %s' % str(e)[:140])
            r['pe'] = page.errors[:2]; del page.errors[:]
            page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            res.append(r)
        br.close()
    return res


def explain_job(ids):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, q
    res = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page); page.evaluate(NOREV)
        for w, g, lv in ids:
            r = {'g': g, 'lv': lv, 'bad': []}
            try:
                page.evaluate("window.__xlog = []; window.__phases = [];")
                page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 31 + l})", [w, g, lv])
                # the right option at the moment of the (wrong) answer, from the game's own next('right')
                page.evaluate("""() => { if (Session.__xs) return; Session.__xs = Session.submit; Session.submit = function (st, v) { try { const s = st.game.next(st, 'right'); window.__rightAt = s && s.p && (s.p.id || s.p.at); } catch (e) { window.__rightAt = null; } return Session.__xs.call(Session, st, v); }; }""")
                gen, snap = answer_question(page, 'wrong', timeout=25000)
                right = [page.evaluate("window.__rightAt || ''")]
                wait_next_question(page, gen, timeout=40000)
                nq = q(page)
                xl = page.evaluate("(gen) => (window.__xlog || []).filter(e => e.q >= gen)", gen)
                golds = [e for e in xl if e['what'] == 'gold']
                if not golds:
                    r['bad'].append('no gold mark %s' % xl[:3])
                elif g not in ACT and right and re.match(CHOICE.get(g, r'^card\d$'), right[0]) and not any(e['id'] in right for e in golds):
                    r['bad'].append('the gold mark is not on the right option %s vs %s' % ([e['id'] for e in golds], right))
                if not (nq and nq.get('retest')):
                    r['bad'].append('no new question after the explanation')
                r['xl'] = [e['what'] for e in xl]
            except Exception as e:
                r['bad'].append('error %s' % str(e)[:160])
            r['pe'] = page.errors[:2]; del page.errors[:]
            page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            res.append(r)
        br.close()
    return res


def gen_stats(log, page, worlds):
    """the generator itself, many times per game x level, through Session.genQ (rank bag) and placeOptions (position bag)"""
    out = page.evaluate(r"""([worlds]) => {
      const res = [];
      for (const w of worlds) for (const g of WORLDS[w].games) {
        const game = GAMES[g]; if (!game) continue;
        for (let lv = 1; lv <= MAXLV[w]; lv++) {
          const G = { id: g, game, world: w, W: WORLDS[w], ws: { lastKey: null, played: [] }, bags: {}, rng: RNG(1234 + lv * 17 + g.charCodeAt(0)), level: lv, seenKeys: new Set(), actors: {}, els: {} };
          const kinds = game.kinds(lv, G);
          const S = { n: 0, opt: 0, pos: [0, 0, 0, 0, 0], rank: [0, 0, 0, 0, 0], bad: [], len: {} };
          for (let i = 0; i < 400; i++) {
            G.seenKeys = new Set();
            const kind = kinds.length > 1 ? bagPick(G, 'kind' + lv, kinds) : kinds[0];
            let q; try { q = Session.genQ(G, lv, kind); } catch (e) { S.bad.push('gen error ' + e.message); break; }
            S.n++;
            const o = q.opts || q.bars || q.bags || q.stacks || q.figs || q.bots || (g === 'J4' || (g === 'G1' && q.mode === 'find') ? q.items : null);
            if (!Array.isArray(o)) continue;
            S.len[o.length] = (S.len[o.length] || 0) + 1;
            const key = x => JSON.stringify(x);
            if (g !== 'J4' && new Set(o.map(key)).size !== o.length) S.bad.push('options repeat ' + key(o));     /* J4: the ones that fit the rule look alike on purpose */
            /* the right one: the answer value - or its index for picture questions that answer with an index */
            let ri = o.findIndex(x => key(x) === key(q.answer));
            if ((ri < 0 || typeof o[0] === 'object') && typeof q.answer === 'number' && q.answer >= 0 && q.answer < o.length && typeof o[0] !== 'number') ri = q.answer;
            if (ri < 0) { S.bad.push('answer not among the options ' + key(q.answer) + ' ' + key(o)); continue; }
            const same = o.filter(x => key(x) === key(o[ri])).length; if (same !== 1) S.bad.push('the answer twice');
            S.opt++; if (o.length === 5) { S.pos[ri]++; if (typeof o[0] === 'number') { const s = o.slice().sort((a, b) => a - b); S.rank[s.indexOf(o[ri])]++; } }
          }
          res.push({ w, g, lv, S });
        }
      }
      return res;
    }""", [worlds])
    return out


def main():
    log = Log('explain')
    os.makedirs(os.path.join(ROOT, 'tests', 'logs', 'opt'), exist_ok=True)
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    worlds = (W1 if 'w1' in WSEL else []) + (W2 if 'w2' in WSEL else [])
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = games_of(page, worlds)
        if PART in ('all', 'gen'):
            for r in gen_stats(log, page, worlds):
                S, g, lv = r['S'], r['g'], r['lv']
                if g in ACT or not S['opt']:
                    if S['bad']:
                        log.fail('%s L%d generator: %s' % (g, lv, S['bad'][:2]))
                    continue
                ok5 = all(int(k) >= 5 for k in S['len'])
                log.check(ok5 or g in TWO, '%s L%d: every question has >= 5 options %s' % (g, lv, S['len']))
                log.check(not S['bad'], '%s L%d: one right option, options distinct %s' % (g, lv, S['bad'][:2]))
                n5 = sum(S['pos'])
                if n5 >= 100:
                    share = [x / n5 for x in S['pos']]
                    log.check(all(0.14 <= x <= 0.26 for x in share), '%s L%d: the right answer\'s place is balanced %s' % (g, lv, [round(x, 2) for x in share]))
                    if sum(S['rank']) >= 100:
                        rs = [x / sum(S['rank']) for x in S['rank']]
                        if max(rs) > 0.5:
                            log.warn('%s L%d: the right number is mostly the same rank among the five %s' % (g, lv, [round(x, 2) for x in rs]))
        log.check(not page.errors, 'generators: no page error %s' % page.errors[:2])
        br.close()
    if PART in ('all', 'layout'):
        jobs = [(vw, vh, ids[i::JOBS]) for vw, vh in VIEWS for i in range(JOBS)]
        with Pool(JOBS) as pool:
            for part in pool.map(layout_job, jobs):
                for r in part:
                    tag = '%s %s L%d' % (r['v'], r['g'], r['lv'])
                    log.check(not r['bad'] and not r['pe'], '%s: options %s; >= 88 px, on the stage, on top, clear of the HUD %s %s' % (tag, r['n'], r['bad'][:3], r['pe']))
    if PART in ('all', 'explain'):
        with Pool(JOBS) as pool:
            for part in pool.map(explain_job, [ids[i::JOBS] for i in range(JOBS)]):
                for r in part:
                    log.check(not r['bad'] and not r['pe'], '%s L%d: wrong -> explain (%s) -> gold on the right one -> a new question %s %s' % (r['g'], r['lv'], ','.join(r.get('xl', [])), r['bad'][:2], r['pe']))
    return log.close()


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
