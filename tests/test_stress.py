# -*- coding: utf-8 -*-
"""Stress: a child bombarding the screen. Every mini-game at level 2; one pass with __fast and one at normal speed.

For every answerable window of every question (the 'act' window and the answer window of a question are separate):
  (a) the target of __next('right') is tapped 10x as fast as possible with REAL pointer events at one point
      (__physical(step).pts[0] -> page.mouse.click(delay=0) in a tight loop; falls back to __next().at),
  (b) 20 seeded-random points inside the viewport are tapped in quick succession (the home button is left out:
      leaving is legitimate navigation, not what is tested; any tap that would land after the session ended is
      swallowed by a test-side capture listener - the 'fence' - so it cannot open a world on the map),
  (c) the question is then finished normally through __next + __gesture ('right'; the B3 pairing correction too).
asserts per game:
  - zero page errors (page errors, console errors / warnings, failed requests);
  - every question is submitted at most once, and #distinct question gens that reached 'judging' == #accepted answers
    == #questions presented (Session.submit is wrapped; a setter on every question object records each phase
    transition, so the synchronous 'judging' step is seen); __q.submitted never goes back to false for a gen;
  - the session completes: back on the map after the normal 5 rounds (within 90 s with __fast; at normal speed the
    app may end a session after 3 rounds once 150 s have passed - accepted then);
  - __res().voiceQ <= 4 during the bombard (sampled every 5 taps + an in-page high-water mark on every Voice.say);
  - window.__speechLog: one narration at a time (no 'narr' speak before the previous one ended / timed out / was
    cancelled); every narration speak >= 150 ms after the latest cancel - enforced in the normal-speed pass only
    (__fast compresses timers; the fast pass just reports the count).
usage: python tests/test_stress.py [chromium|webkit] [--passes fast,slow] [--games P1,B2,...] [--seed N] [--tag name]
"""
import os, sys, time, json, random, hashlib, argparse, collections
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import ROOT, serve, new_page, enter, wait_map, Log
from play_util import ANSWERABLE, state, step, go, home, all_games, SpeechChecker, fmt_ev

WORLDS = ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']
VW, VH = 1180, 820
LEVEL = 2
ROUNDS = 5                         # Session.start: 5 rounds when the demo is skipped (noDemo)
LIMIT = {'fast': 90, 'slow': 300}  # s for a whole session incl. its return to the map
STALL = {'fast': 10, 'slow': 45}   # s without any change of (question, phase, submitted) -> the session is stuck

HOOK_JS = r"""() => {
  if (window.__sx) return 'already';
  const L = window.__sx = { submits: [], phases: [], vqMax: 0, fenced: 0, fence: null };
  const now = () => Math.round(performance.now());
  const sub = Session.submit;
  Session.submit = function (st, value) {
    const was = !!(st && st.submitted);
    const r = sub.call(this, st, value);
    L.submits.push({ gen: st ? st.gen : null, ok: !!r, was, cur: Session.st ? Session.st.gen : null, t: now() });
    return r;
  };
  const newQ = Session.newQ;
  Session.newQ = function (G, opt) {
    const st = newQ.call(this, G, opt);
    let ph = st.phase;
    L.phases.push({ gen: st.gen, game: G.id, from: '', to: ph, t: now() });
    Object.defineProperty(st, 'phase', { configurable: true, enumerable: true,
      get() { return ph; },
      set(v) { if (v !== ph) L.phases.push({ gen: st.gen, from: ph, to: v, t: now() }); ph = v; } });
    return st;
  };
  const say = Voice.say;
  Voice.say = function () { const p = say.apply(this, arguments); if (Voice.q.length > L.vqMax) L.vqMax = Voice.q.length; return p; };
  /* the fence: while a bombard runs, taps on the home button, and every tap once its session is gone, are swallowed */
  const blk = e => {
    const f = L.fence; if (!f) return;
    const t = e.target, hud = t && t.closest ? t.closest('#home, #gear, #parent') : null;
    if (Session.G !== f || hud) { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); if (e.type === 'pointerdown') L.fenced++; }
  };
  ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mouseup', 'click'].forEach(ev => window.addEventListener(ev, blk, true));
  return 'ok';
}"""

BOMBARD_START_JS = r"""() => {
  const L = window.__sx;
  const s = window.__next('right');
  let ph = null;
  try { ph = s ? window.__physical(s) : null; } catch (e) { ph = { err: String(e && e.message || e) }; }
  const hb = document.querySelector('#home').getBoundingClientRect();
  L.fence = Session.G; L.vqMax = Voice.q.length; L.fenced = 0;
  return { s, ph, home: { x: hb.left, y: hb.top, w: hb.width, h: hb.height }, gen: Session.st ? Session.st.gen : null, voiceQ: window.__res().voiceQ };
}"""

BOMBARD_END_JS = r"""() => { const L = window.__sx; L.fence = null; return { vqMax: L.vqMax, fenced: L.fenced, voiceQ: window.__res().voiceQ }; }"""


def bombard(page, rng):
    b = page.evaluate(BOMBARD_START_JS)
    s, ph = b.get('s'), b.get('ph')
    pt, src = None, ''
    if ph and ph.get('pts'):
        pt, src = ph['pts'][0], 'physical'
    elif s and s.get('at'):
        pt, src = s['at'], 'next.at'
    vq = [b['voiceQ']]
    if pt:
        x, y = min(max(pt['x'], 1), VW - 2), min(max(pt['y'], 1), VH - 2)
        for _ in range(10):                                   # (a) as fast as possible, one point
            page.mouse.click(x, y, delay=0)
        vq.append(page.evaluate('window.__res().voiceQ'))
    hr = b['home']
    for k in range(20):                                       # (b) seeded random points, quick succession
        while True:
            x, y = rng.uniform(1, VW - 2), rng.uniform(1, VH - 2)
            if not (hr['x'] - 12 <= x <= hr['x'] + hr['w'] + 12 and hr['y'] - 12 <= y <= hr['y'] + hr['h'] + 12):
                break
        page.mouse.click(x, y, delay=0)
        if k % 5 == 4:
            vq.append(page.evaluate('window.__res().voiceQ'))
    e = page.evaluate(BOMBARD_END_JS)
    vq.append(e['voiceQ'])
    return {'step': '%s %s' % ((s or {}).get('g'), ((s or {}).get('p') or {}).get('id')), 'src': src, 'hit': bool(pt),
            'vq': vq, 'vqMax': e['vqMax'], 'fenced': e['fenced'], 'phys_err': (ph or {}).get('err')}


def run_game(page, log, pname, fast, w, g, gi, rng, sc, T):
    tag = '[%s] %s %s L%d' % (pname, w, g, LEVEL)
    before_err = len(page.errors)
    i_sub, i_ph = page.evaluate("[window.__sx.submits.length, window.__sx.phases.length]")
    stars0 = page.evaluate("(w) => Store.w(w).stars", w)
    go(page, w, g, LEVEL, 4242 + gi)
    t0 = time.time()
    limit, stall = LIMIT['fast' if fast else 'slow'], STALL['fast' if fast else 'slow']
    poll, gap = (10, 5) if fast else (40, 150)
    bombarded, observed = set(), {}
    seen = finished = False
    stuck = ''
    sig, sig_t, last_step, same_step = None, time.time(), None, 0
    B = {'bombards': 0, 'no_target': 0, 'vq': [], 'vqMax': 0, 'fenced': 0, 'steps': 0, 'phys_err': []}
    while time.time() - t0 < limit:
        st = state(page)
        q = st['q']
        s_now = (q['gen'], q['phase'], q['submitted']) if q else (None, st['scr'], st['map'])
        if s_now != sig:
            sig, sig_t = s_now, time.time()
        elif time.time() - sig_t > stall:
            errs = page.errors[before_err:]
            stuck = 'no progress for %d s at %s%s%s' % (stall, s_now,
                                                         ('; __next(right) -> %s answered %r %d times in a row' % (last_step[0], last_step[1], same_step)) if last_step else '',
                                                         ('; after page error %s' % errs[:1]) if errs else '')
            break
        if q is None:
            if st['map'] and seen:
                finished = True
                break
            if st['game']:
                seen = True
            page.wait_for_timeout(poll)
            continue
        seen = True
        seq = observed.setdefault(q['gen'], [])
        if not seq or seq[-1] != q['submitted']:
            seq.append(q['submitted'])
        ph = q['phase']
        if ph in ANSWERABLE and not q['submitted']:
            key = (q['gen'], 'act' if ph == 'act' else 'answer')
            if key not in bombarded:
                bombarded.add(key)
                r = bombard(page, rng)
                B['bombards'] += 1
                B['no_target'] += 0 if r['hit'] else 1
                B['vq'] += r['vq']
                B['vqMax'] = max(B['vqMax'], r['vqMax'])
                B['fenced'] += r['fenced']
                if r['phys_err']:
                    B['phys_err'].append(r['phys_err'])
                continue
        if (ph in ANSWERABLE and not q['submitted']) or ph == 'pairing':   # (c) finish it normally (B3: pair the blocks)
            r = step(page, 'right')
            B['steps'] += 1
            one = ('%s %s' % (r.get('g'), r.get('id')), r.get('r') if r.get('state') == 'step' else r.get('state'))
            same_step = same_step + 1 if one == last_step else 1
            last_step = one
            page.wait_for_timeout(gap)
            continue
        page.wait_for_timeout(poll)
    elapsed = time.time() - t0
    if not finished and not stuck:
        try:
            wait_map(page, timeout=1000)
            finished = True
        except Exception:
            pass
    log.check(finished, '%s: session completed and returned to the map (%.1f s, limit %d s)%s' % (tag, elapsed, limit, (' - STUCK: ' + stuck) if stuck else ''))
    if not finished:
        try:
            home(page)
            wait_map(page, timeout=20000)
        except Exception:
            pass

    subs = page.evaluate("(i) => window.__sx.submits.slice(i)", i_sub)
    phs = page.evaluate("(i) => window.__sx.phases.slice(i)", i_ph)
    stars1 = page.evaluate("(w) => Store.w(w).stars", w)
    accepted = [s for s in subs if s['ok']]
    rejected = [s for s in subs if not s['ok']]
    per_gen = collections.Counter(s['gen'] for s in accepted)
    judged = collections.Counter(p['gen'] for p in phs if p['to'] == 'judging')
    presented = sorted({p['gen'] for p in phs})
    praised = {p['gen'] for p in phs if p['to'] == 'praise'}
    corrected = {p['gen'] for p in phs if p['to'] == 'correcting'}
    twice = {k: v for k, v in per_gen.items() if v > 1}
    log.check(not twice, '%s: every question submitted at most once (%d accepted answers, %d extra submit calls rejected by the one-shot guard)%s' % (
        tag, len(accepted), len(rejected), (' TWICE: %s' % twice) if twice else ''))
    # a stuck session's last question never gets an answer: that is reported above, not as a submit anomaly
    expect = presented if finished else presented[:-1]
    skipped = sorted(set(expect) - set(judged))
    same = set(judged) == set(per_gen) and len(judged) == len(accepted) and all(v == 1 for v in judged.values()) and not skipped
    log.check(same, '%s: distinct gens that reached judging (%d) == accepted answers (%d) == questions presented (%d%s)%s' % (
        tag, len(judged), len(accepted), len(presented), '' if finished else ', the stuck one excluded',
        '' if same else ' judged-twice=%s judged-not-submitted=%s submitted-not-judged=%s never-judged=%s' % (
            {k: v for k, v in judged.items() if v > 1}, sorted(set(judged) - set(per_gen)), sorted(set(per_gen) - set(judged)), skipped)))
    back = [gg for gg, seq in observed.items() if True in seq and False in seq[seq.index(True):]]
    log.check(not back, '%s: __q.submitted never went back to false (%d gens watched)%s' % (tag, len(observed), (' for %s' % back) if back else ''))
    ok_rounds = len(praised)
    normal = ok_rounds == ROUNDS or (not fast and elapsed > 150 and ok_rounds >= 3)
    log.check(finished and normal and stars1 - stars0 == ok_rounds, '%s: the normal number of rounds: %d right answers = %d stars (%d questions, %d wrong after taps)%s' % (
        tag, ok_rounds, stars1 - stars0, len(presented), len(corrected), '' if finished else ' - session did not complete (see above)'))
    vq_hi = max(B['vq'] + [B['vqMax']]) if B['vq'] else B['vqMax']
    log.check(vq_hi <= 4, '%s: voiceQ <= 4 during %d bombards (max %d; samples %s)' % (tag, B['bombards'], vq_hi, B['vq'][:12]))
    overlap, gaps = sc.feed(sc.fetch(page))
    log.check(not overlap, '%s: one narration at a time (%d speaks so far)%s' % (
        tag, sc.speaks, (' OVERLAP: ' + ' | '.join('%s -> %s' % (fmt_ev(a), fmt_ev(b)) for a, b in overlap[:3])) if overlap else ''))
    gtxt = ' | '.join('%s -> %s (%d ms)' % (fmt_ev(a), fmt_ev(b), d) for a, b, d in gaps[:3])
    if fast:
        if gaps:
            log.w('INFO %s: %d narration speak(s) < 150 ms after a cancel (not enforced with __fast): %s' % (tag, len(gaps), gtxt))
    else:
        log.check(not gaps, '%s: every narration speak >= 150 ms after the latest cancel%s' % (tag, (' VIOLATION: ' + gtxt) if gaps else ''))
    new = page.errors[before_err:]
    log.check(not new, '%s: zero page errors %s' % (tag, new[:3]))
    if B['no_target'] or B['phys_err']:
        log.warn('%s: %d bombard(s) without a tap target (__physical/__next gave no point) %s' % (tag, B['no_target'], B['phys_err'][:2]))
    T['games'] += 1
    T['questions'] += len(presented)
    T['answers'] += len(accepted)
    T['rejected'] += len(rejected)
    T['wrong'] += len(corrected)
    T['bombards'] += B['bombards']
    T['fenced'] += B['fenced']
    T['vq'] = max(T['vq'], vq_hi)
    T['overlap'] += len(overlap)
    T['gaps'] += len(gaps)
    T['time'] += elapsed
    log.w('   %s: %.1f s, %d questions, %d bombards (%d real taps), %d finishing steps, %d taps fenced after the session ended' % (
        tag, elapsed, len(presented), B['bombards'], 30 * B['bombards'] - 10 * B['no_target'], B['steps'], B['fenced']))


def parse_args():
    ap = argparse.ArgumentParser(description='rapid-tap stress')
    ap.add_argument('engine', nargs='?', default='chromium')
    ap.add_argument('--passes', default='fast,slow')
    ap.add_argument('--games', default='', help='comma list, e.g. P1,V1 (default: all 24)')
    ap.add_argument('--seed', type=int, default=20260924)
    ap.add_argument('--tag', default='')
    return ap.parse_args()


def main():
    a = parse_args()
    name = 'stress_%s%s' % (a.engine, ('_' + a.tag) if a.tag else '')
    log = Log(name)
    app_md5 = hashlib.md5(open(os.path.join(ROOT, 'index.html'), 'rb').read()).hexdigest()[:10]
    log.w('stress %s: passes %s, level %d, index.html md5 %s' % (a.engine, a.passes, LEVEL, app_md5))
    only = [x for x in a.games.split(',') if x]
    with sync_playwright() as p, serve() as base:
        br = getattr(p, a.engine).launch()
        for pname in [x for x in a.passes.split(',') if x]:
            fast = pname == 'fast'
            T = collections.Counter()
            T['vq'] = 0
            page = new_page(br, base, VW, VH, fast=fast)
            log.w('[%s] pass starts, index.html md5 %s' % (pname, hashlib.md5(open(os.path.join(ROOT, 'index.html'), 'rb').read()).hexdigest()[:10]))
            enter(page)
            log.check(page.evaluate(HOOK_JS) == 'ok', '[%s] instrumentation installed (Session.submit / Session.newQ / Voice.say wrapped, fence ready)' % pname)
            sc = SpeechChecker()
            sc.feed(sc.fetch(page))                               # the entry sentence
            games = all_games(page, WORLDS)
            if only:
                games = [x for x in games if x[1] in only]
            rng = random.Random(a.seed + (0 if fast else 1))
            t_pass = time.time()
            for gi, (w, g) in enumerate(games):
                try:
                    run_game(page, log, pname, fast, w, g, gi, rng, sc, T)
                except Exception as e:
                    log.fail('[%s] %s %s: exception %s' % (pname, w, g, str(e)[:300]))
                    try:
                        page.evaluate('window.__sx && (window.__sx.fence = null)')
                        home(page)
                        wait_map(page, timeout=20000)
                    except Exception:
                        pass
            log.w('[%s] SUMMARY %d games in %.0f s: %d questions, %d accepted answers (%d wrong), %d duplicate submit calls rejected, '
                  '%d bombards, %d taps fenced after a session ended, voiceQ max %d, %d narration speaks / %d cancels, '
                  'min cancel->speak gap %s ms, overlaps %d, gap violations %d%s' % (
                      pname, T['games'], time.time() - t_pass, T['questions'], T['answers'], T['wrong'], T['rejected'],
                      T['bombards'], T['fenced'], T['vq'], sc.speaks, sc.cancels, min(sc.gaps) if sc.gaps else '-',
                      T['overlap'], T['gaps'], ' (not enforced with __fast)' if fast else ''))
            page.context.close()
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
