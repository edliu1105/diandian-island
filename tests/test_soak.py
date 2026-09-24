# -*- coding: utf-8 -*-
"""Soak: resource stability at NORMAL speed (fast=False: real animation durations, real timers, real reveals).

Round-robin over all 24 mini-games (worlds interleaved: P1,B1,H1,A1,X1,V1,P2,...; level cycling 1..MAXLV), every
session played to its end with the 'right' strategy through __next + __gesture (a step every 200 ms while the question
is answerable, the app plays every reveal / praise / correction at real speed). Every 5th session leaves mid-question
with gesture('home') (at q1/q2/q3, 0/0.4/0.9 s after starting an action); every 6th question is answered wrong.

samples : every 30 s wherever the app is ('periodic') and after every return to the map ('map': 1.5 s after the map
          is up, after a forced GC) -> tests/logs/soak_<engine>.csv
asserts : map samples, median of the last 4 vs the first 4 (fewer - never overlapping - when the run is short):
          dom <= +15 %; timers / anims / waits / scopes back to the same small numbers (last median <= first median,
          no map sample above max(first median, 2)); live WebAudio sources return to <= 8 on the map (lowest value
          within 6 s after the 1.5 s sample - the map celebration's star sounds are legitimately live at 1.5 s);
          utter <= 24; #fx children <= 5; JS heap (chromium, after window.gc) <= +40 %.
          extra: docAnims <= first + 2; no infinite Web Animation still running on a DETACHED element while on the map
          (document.getAnimations() and the DOM count cannot see those: the document timeline keeps such an animation
          and its whole detached subtree alive forever; tracked by a transparent Element.prototype.animate wrapper
          installed as an init script); CDP DOM counters (chromium, live nodes / JS listeners after GC, detached
          included) reported as a trend (WARN only: Voice.refs legitimately keeps about one old session alive).
          zero page errors (page errors, console errors / warnings, failed requests); every session ends on the map.
steady state: the save is pre-seeded so the map's permanent content is final before the first sample (every story
          chapter seen -> island flowers + pennant exist; >= 60 stars -> six big stars per island; finale seen).
          Otherwise legitimate, bounded content (a flower per chapter, a big star per 10 stars) reads as DOM growth.
usage: python tests/test_soak.py [minutes] [engine]    or  --minutes N --engine chromium|webkit [--tag name]
       default 15 minutes, chromium (the release run); 3 minutes while developing.
"""
import os, sys, csv, time, json, hashlib, argparse
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import ROOT, LOGDIR, serve, new_page, enter, set_state, wait_map, Log
from play_util import ANSWERABLE, state, step, go, home, all_games, median

WORLDS = ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']
MAXLV = {'peppa': 3, 'bluey': 3, 'huluwa': 4, 'paw': 4, 'xiyou': 4, 'avengers': 4}
SESSION_LIMIT = 240      # s; 5 rounds at real speed take ~40-90 s (the app itself stops after 150 s once 3 rounds are done)
STALL = 60               # s without any change of (question, phase, submitted) -> the session is stuck (fail, leave)
STEP_GAP = 200           # ms between two logical steps of one question (a quick child; hammering is test_stress's job)
WRONG_EVERY = 6          # every 6th question overall is answered wrong
MAP_WAIT = 1.5           # s on the map before the map sample
AUDIO_SETTLE = 6.0       # s allowed for the live WebAudio count to come back to <= 8
PERIOD = 30.0            # s between periodic samples

SEED_STATE_JS = """
for (const id of Object.keys(s.worlds)) { const w = s.worlds[id]; w.unlocked = true; w.story = 3; w.visits = Math.max(w.visits || 0, 10); w.stars = Math.max(w.stars || 0, 60); }
s.finaleSeen = true; s.finaleDue = false;
"""

# init script: remember every INFINITE Web Animation (only those; cancelled / finished ones are dropped at each read) so
# a sample can count the ones still running on an element that is no longer in the document
LOOP_TRACK_JS = r"""
(() => {
  const loops = [];
  const orig = Element.prototype.animate;
  Element.prototype.animate = function (kf, opt) {
    const a = orig.call(this, kf, opt);
    try { if (opt && typeof opt === 'object' && opt.iterations === Infinity) loops.push(a); } catch (e) {}
    return a;
  };
  window.__loopAnims = () => {
    for (let i = loops.length - 1; i >= 0; i--) { const s = loops[i].playState; if (s === 'idle' || s === 'finished') loops.splice(i, 1); }
    const orphans = loops.filter(a => { const t = a.effect && a.effect.target; return t && !t.isConnected; });
    const desc = a => { const t = a.effect.target; let r = t; while (r.parentNode) r = r.parentNode;
      const cls = e => (e.className && e.className.baseVal == null ? String(e.className).split(' ')[0] : '') || e.tagName.toLowerCase();
      return t.tagName.toLowerCase() + ' in detached ' + cls(r); };
    const what = {}; orphans.forEach(a => { const k = desc(a); what[k] = (what[k] || 0) + 1; });
    return { live: loops.length, orphans: orphans.length, what: Object.keys(what).map(k => what[k] + 'x ' + k).join(', ') };
  };
})();
"""

RES_JS = r"""() => {
  const lp = window.__loopAnims ? window.__loopAnims() : { live: '', orphans: '', what: '' };
  const r = window.__res();
  r.scr = (document.body && document.body.dataset.scr) || '';
  let q = null; try { q = window.__q; } catch (e) {}
  r.gen = q ? q.gen : ''; r.phase = q ? q.phase : '';
  r.loop_anims = lp.live; r.orphan_anims = lp.orphans; r.orphan_what = lp.what;
  return r;
}"""

COLS = ['t_s', 'kind', 'session', 'world', 'game', 'level', 'scr', 'gen', 'phase', 'dom', 'docAnims', 'timers', 'anims',
        'waits', 'scopes', 'utter', 'fx', 'audio', 'audio_min', 'audio_settle_ms', 'voiceQ', 'waiters', 'heap',
        'cdp_nodes', 'cdp_listeners', 'cdp_docs', 'loop_anims', 'orphan_anims', 'orphan_what']


class Sampler:
    def __init__(self, page, engine, path, log):
        self.page, self.log = page, log
        self.t0 = time.time()
        self.rows = []
        self.ctx = {'session': '', 'world': '', 'game': '', 'level': ''}
        self.cdp = None
        if engine == 'chromium':
            try:
                self.cdp = page.context.new_cdp_session(page)
                self.cdp.send('Memory.getDOMCounters')
            except Exception as e:
                self.cdp = None
                log.warn('CDP DOM counters unavailable (%s)' % str(e)[:80])
        self.f = open(path, 'w', encoding='utf-8', newline='')
        self.w = csv.DictWriter(self.f, fieldnames=COLS, extrasaction='ignore')
        self.w.writeheader()
        self.f.flush()
        self.last_periodic = time.time()

    def gc(self):
        for _ in range(2):
            self.page.evaluate('window.gc && window.gc()')

    def read(self, kind, gc=False):
        if gc:
            self.page.evaluate('window.__loopAnims && window.__loopAnims()')   # drop cancelled loops before collecting
            self.gc()
        r = self.page.evaluate(RES_JS)
        if self.cdp:
            try:
                c = self.cdp.send('Memory.getDOMCounters')
                r['cdp_nodes'], r['cdp_listeners'], r['cdp_docs'] = c.get('nodes'), c.get('jsEventListeners'), c.get('documents')
            except Exception:
                pass
        r.update(self.ctx)
        r['kind'] = kind
        r['t_s'] = round(time.time() - self.t0, 1)
        return r

    def write(self, r):
        self.rows.append(r)
        self.w.writerow(r)
        self.f.flush()
        return r

    def tick(self):
        if time.time() - self.last_periodic >= PERIOD:
            self.last_periodic = time.time()
            self.write(self.read('periodic'))

    def map_sample(self):
        """1.5 s on the map -> GC -> sample; then how low the live WebAudio count gets within AUDIO_SETTLE s"""
        self.page.wait_for_timeout(int(MAP_WAIT * 1000))
        r = self.read('map', gc=True)
        a_min, settle, t = r['audio'], (0 if r['audio'] <= 8 else ''), time.time()
        while a_min > 0 and time.time() - t < AUDIO_SETTLE:
            self.page.wait_for_timeout(100)
            a = self.page.evaluate('window.__res().audio')
            a_min = min(a_min, a)
            if settle == '' and a <= 8:
                settle = int((time.time() - t) * 1000)
        r['audio_min'], r['audio_settle_ms'] = a_min, settle
        self.write(r)
        self.tick()
        return r

    def close(self):
        self.f.close()


def play_session(page, log, S, smp, i, w, g, lv):
    """one session at real speed; returns (outcome, questions): finished | left | stuck | nostep"""
    leave_q = (1 + (i // 5) % 3) if i % 5 == 4 else None
    leave_delay = (0, 400, 900)[(i // 5) % 3]
    tag = '#%d %s %s L%d' % (i + 1, w, g, lv)
    go(page, w, g, lv, 1000 + i)
    t0 = time.time()
    seen, cur, qn, strat, nostep_t, st = False, None, 0, 'right', None, None
    sig, sig_t, last = None, time.time(), None
    before = len(page.errors)
    while True:
        smp.tick()
        if time.time() - t0 > SESSION_LIMIT:
            log.fail('%s: session still running after %d s (q%d, state %s)' % (tag, SESSION_LIMIT, qn, st))
            home(page)
            return 'stuck', qn
        st = state(page)
        q = st['q']
        s_now = (q['gen'], q['phase'], q['submitted']) if q else (None, st['scr'], st['map'])
        if s_now != sig:
            sig, sig_t = s_now, time.time()
        elif time.time() - sig_t > STALL:
            log.fail('%s q%d: no progress for %d s at %s (last step %s)%s' % (tag, qn, STALL, s_now, last,
                                                                        ('; after page error %s' % page.errors[before:][:1]) if page.errors[before:] else ''))
            home(page)
            return 'stuck', qn
        if q is None:
            if st['map'] and seen:
                return 'finished', qn
            if st['game']:
                seen = True
            page.wait_for_timeout(50)
            continue
        seen = True
        if q['gen'] != cur:
            cur, qn, nostep_t = q['gen'], qn + 1, None
            S['questions'] += 1
            strat = 'right'
            if S['questions'] % WRONG_EVERY == 0 and not q['guided']:
                strat = 'wrong'
                S['wrong'] += 1
        answerable = q['phase'] in ANSWERABLE and not q['submitted']
        if leave_q is not None and qn >= leave_q and answerable:
            if q['phase'] == 'act' or leave_delay:
                step(page, 'right')                 # start something, so the exit lands in the middle of it
            page.wait_for_timeout(leave_delay)
            home(page)
            S['left'] += 1
            return 'left', qn
        if answerable or q['phase'] == 'pairing':
            r = step(page, strat)
            last = '%s %s -> %s' % (r.get('g'), r.get('id'), r.get('r') if r.get('state') == 'step' else r.get('state'))
            if r.get('state') == 'error':
                log.fail('%s q%d: __q/__next threw %s' % (tag, qn, r.get('err')))
            if r.get('state') == 'nostep':
                nostep_t = nostep_t or time.time()
                if strat != 'right' and time.time() - nostep_t > 5:
                    log.warn('%s q%d: no %r step for 5 s in phase %s - finishing it right' % (tag, qn, strat, q['phase']))
                    strat, nostep_t = 'right', time.time()
                elif time.time() - nostep_t > 30:
                    log.fail('%s q%d: __next gave no step for 30 s in phase %s' % (tag, qn, q['phase']))
                    home(page)
                    return 'nostep', qn
                page.wait_for_timeout(50)
                continue
            nostep_t = None
            page.wait_for_timeout(STEP_GAP)
            continue
        page.wait_for_timeout(50)


def parse_args():
    ap = argparse.ArgumentParser(description='normal-speed soak')
    ap.add_argument('pos', nargs='*', help='[minutes] [engine]')
    ap.add_argument('--minutes', type=float)
    ap.add_argument('--engine')
    ap.add_argument('--tag', default='', help='suffix for the log / csv names')
    a = ap.parse_args()
    minutes, engine = 15.0, 'chromium'
    for x in a.pos:
        if x in ('chromium', 'webkit', 'firefox'):
            engine = x
        else:
            minutes = float(x)
    if a.minutes is not None:
        minutes = a.minutes
    if a.engine:
        engine = a.engine
    return minutes, engine, a.tag


def main():
    minutes, engine, tag = parse_args()
    name = 'soak_%s%s' % (engine, ('_' + tag) if tag else '')
    log = Log(name)
    csv_path = os.path.join(LOGDIR, name + '.csv')
    app_md5 = hashlib.md5(open(os.path.join(ROOT, 'index.html'), 'rb').read()).hexdigest()[:10]
    log.w('soak %s: %.1f min at normal speed, index.html md5 %s, samples -> %s' % (engine, minutes, app_md5, csv_path))
    S = {'questions': 0, 'wrong': 0, 'left': 0, 'sessions': 0, 'on_map': 0}
    with sync_playwright() as p, serve() as base:
        kw = {'args': ['--js-flags=--expose-gc', '--enable-precise-memory-info']} if engine == 'chromium' else {}
        br = getattr(p, engine).launch(**kw)
        page = new_page(br, base, 1180, 820, fast=False, extra_init=LOOP_TRACK_JS)
        set_state(page, SEED_STATE_JS)
        enter(page)
        page.wait_for_timeout(3000)                 # entry sentence + map intro hand
        smp = Sampler(page, engine, csv_path, log)
        r0 = smp.write(smp.read('map0', gc=True))
        log.w('map baseline before any session: %s' % json.dumps({k: r0.get(k) for k in COLS[9:] if r0.get(k) not in (None, '')}))
        has_audio = page.evaluate("!!(window.AudioContext || window.webkitAudioContext)")
        if not has_audio:
            log.warn('%s has no AudioContext: no WebAudio source can exist, the live-audio check is vacuous here '
                     '(counting words fall back to the narration engine)' % engine)
        order = all_games(page, WORLDS, interleave=True)
        t_end = time.time() + minutes * 60
        i = 0
        while time.time() < t_end:
            w, g = order[i % len(order)]
            slot = (i % len(order)) // len(WORLDS)
            lv = 1 + (slot + i // len(order)) % MAXLV[w]
            smp.ctx = {'session': i + 1, 'world': w, 'game': g, 'level': lv}
            tag_s = '#%d %s %s L%d' % (i + 1, w, g, lv)
            before = len(page.errors)
            t0 = time.time()
            try:
                outcome, nq = play_session(page, log, S, smp, i, w, g, lv)
            except Exception as e:
                outcome, nq = 'exception', 0
                log.fail('%s: exception %s' % (tag_s, str(e)[:300]))
            S['sessions'] += 1
            try:
                wait_map(page, timeout=60000)
                S['on_map'] += 1
                log.check(outcome in ('finished', 'left'), '%s: %s after %d question(s) in %.1f s, back on the map' % (tag_s, outcome, nq, time.time() - t0))
            except Exception:
                log.fail('%s: did not end on the map (%s)' % (tag_s, outcome))
                try:
                    home(page)
                    wait_map(page, timeout=20000)
                except Exception:
                    pass
            smp.ctx = {'session': i + 1, 'world': w, 'game': g, 'level': lv}
            r = smp.map_sample()
            log.w('   map sample: dom=%s docAnims=%s timers=%s anims=%s waits=%s scopes=%s utter=%s fx=%s audio=%s->%s voiceQ=%s waiters=%s heap=%.2fMB loops=%s orphaned=%s%s%s' % (
                r['dom'], r['docAnims'], r['timers'], r['anims'], r['waits'], r['scopes'], r['utter'], r['fx'], r['audio'], r['audio_min'],
                r['voiceQ'], r['waiters'], (r['heap'] or 0) / 1048576.0, r['loop_anims'], r['orphan_anims'],
                (' nodes=%s listeners=%s' % (r.get('cdp_nodes'), r.get('cdp_listeners'))) if r.get('cdp_nodes') is not None else '',
                (' [%s]' % r['orphan_what']) if r['orphan_anims'] else ''))
            new = page.errors[before:]
            if new:
                log.fail('%s: %d page error(s): %s' % (tag_s, len(new), new[:3]))
            i += 1
        smp.close()
        errors = list(page.errors)
        br.close()

    # ------------------------------------------------------------------ verdict
    rows = smp.rows
    maps = [r for r in rows if r['kind'] == 'map']
    n = len(maps)
    log.w('%d sessions (%d left mid-question), %d questions (%d answered wrong on purpose), %d samples (%d map, %d periodic)' % (
        S['sessions'], S['left'], S['questions'], S['wrong'], len(rows), n, len([r for r in rows if r['kind'] == 'periodic'])))
    log.check(S['sessions'] > 0 and S['on_map'] == S['sessions'], 'every session ended on the map (%d/%d)' % (S['on_map'], S['sessions']))
    log.check(not errors, 'zero page errors over the whole soak (%d) %s' % (len(errors), errors[:5]))
    if n < 2:
        log.fail('only %d map sample(s): run longer to compare first vs last' % n)
        sys.exit(0 if log.close() else 1)
    k = min(4, n // 2)
    F, L = maps[:k], maps[-k:]
    if k < 4:
        log.warn('short run: comparing the first %d with the last %d map samples (4 vs 4 needs >= 8 sessions)' % (k, k))

    def m(rs, key):
        v = [r[key] for r in rs if r.get(key) not in (None, '')]
        return median(v) if v else None

    def cmp_line(key):
        return '%s first %s -> last %s' % (key, m(F, key), m(L, key))

    log.w('trend (map samples, session: dom / heap MB / audio_min / timers / scopes):')
    log.w('   ' + '  '.join('%s:%s/%.2f/%s/%s/%s' % (r['session'], r['dom'], (r['heap'] or 0) / 1048576.0, r['audio_min'], r['timers'], r['scopes']) for r in maps))
    fd, ld = m(F, 'dom'), m(L, 'dom')
    log.check(ld <= fd * 1.15, 'dom within +15%%: %s (%+.1f%%)' % (cmp_line('dom'), 100.0 * (ld - fd) / max(1, fd)))
    for key in ('timers', 'anims', 'waits', 'scopes'):
        base_v = m(F, key)
        high = [(r['session'], r[key]) for r in maps if r[key] > max(base_v, 2)]
        log.check(m(L, key) <= base_v and not high, '%s back to the same small number on the map: %s, all %s%s' % (
            key, cmp_line(key), [r[key] for r in maps], (' above %s at %s' % (max(base_v, 2), high)) if high else ''))
    bad_audio = [(r['session'], r['audio'], r['audio_min']) for r in maps if r['audio_min'] > 8]
    log.check(not bad_audio, 'live WebAudio sources return to <= 8 on the map (at 1.5 s: %s; lowest within %.0f s: %s)%s' % (
        [r['audio'] for r in maps], AUDIO_SETTLE, [r['audio_min'] for r in maps], (' NOT at %s' % bad_audio) if bad_audio else ''))
    log.check(all(r['utter'] <= 24 for r in rows), 'utterance refs <= 24 in every sample (max %s)' % max(r['utter'] for r in rows))
    log.check(all(r['fx'] <= 5 for r in maps), '#fx children <= 5 on the map (%s)' % [r['fx'] for r in maps])
    if engine == 'chromium' and (m(F, 'heap') or 0) > 0:
        fh, lh = m(F, 'heap'), m(L, 'heap')
        log.check(lh <= fh * 1.40, 'JS heap after GC within +40%%: %.2f MB -> %.2f MB (%+.1f%%)' % (fh / 1048576.0, lh / 1048576.0, 100.0 * (lh - fh) / fh))
    else:
        log.w('heap: not measurable on %s (no performance.memory) - skipped' % engine)
    fa, la = m(F, 'docAnims'), m(L, 'docAnims')
    log.check(la <= fa + 2, 'document animations on the map do not accumulate: %s' % cmp_line('docAnims'))
    # infinite animations left running on detached elements: which session added them
    grew, prev = [], 0
    for r in maps:
        o = r.get('orphan_anims') or 0
        if o > prev:
            grew.append('+%d after #%s %s L%s [%s]' % (o - prev, r['session'], r['game'], r['level'], r.get('orphan_what', '')))
        prev = o
    log.check(not any((r.get('orphan_anims') or 0) for r in maps),
              'no infinite animation keeps running on a detached element on the map (orphaned per map sample %s)%s' % (
                  [r.get('orphan_anims') for r in maps], (' - ' + '; '.join(grew)) if grew else ''))
    for key in ('cdp_nodes', 'cdp_listeners'):
        if m(F, key):
            (log.ok if m(L, key) <= m(F, key) * 1.15 else log.warn)('CDP %s after GC (detached included; trend only) within +15%%: %s, all %s' % (
                key[4:], cmp_line(key), [r.get(key) for r in maps]))
    log.check(all((r['voiceQ'] or 0) <= 4 for r in maps) and m(L, 'waiters') <= max(m(F, 'waiters'), 1),
              'voice queue <= 4 and speech waiters do not pile up on the map (voiceQ %s, waiters %s)' % ([r['voiceQ'] for r in maps], [r['waiters'] for r in maps]))
    ok = log.close()
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
