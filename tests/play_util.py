# -*- coding: utf-8 -*-
"""Shared, time-based play helpers for test_soak.py and test_stress.py.

harness.answer_question() counts loop iterations, which is fine with __fast but gives up during real-speed animations;
everything here is driven by wall-clock deadlines instead, and one logical step (__next + __gesture) is done atomically
inside the page so the phase cannot change between choosing a step and performing it.
"""
import time

ANSWERABLE = ('act', 'ready', 'input')

# one cheap observation of where the app is (never throws: a failing snap() is reported, not raised)
STATE_JS = r"""() => {
  const on = id => { const e = document.getElementById(id); return !!(e && e.classList.contains('on')); };
  let q = null, err = '';
  try { q = window.__q; } catch (e) { err = String(e && e.message || e); }
  return {
    q: q ? { gen: q.gen, phase: q.phase, submitted: !!q.submitted, guided: !!q.guided, game: q.game, level: q.level, kind: q.kind, err: q.err } : null,
    map: !q && on('map') && !on('game'), game: on('game'), scr: (document.body && document.body.dataset.scr) || '', err,
  };
}"""

# one logical step of the current question (the guided question and the B3 'pairing' correction are always followed)
STEP_JS = r"""(strategy) => {
  let q = null;
  try { q = window.__q; } catch (e) { return { state: 'error', err: String(e && e.message || e) }; }
  if (!q) return { state: 'noq' };
  const ph = q.phase;
  if (ph !== 'pairing' && (q.submitted || !['act', 'ready', 'input'].includes(ph))) return { state: 'busy', gen: q.gen, phase: ph };
  const s = window.__next(q.guided || ph === 'pairing' ? 'right' : strategy);
  if (!s) return { state: 'nostep', gen: q.gen, phase: ph };
  const r = window.__gesture(s.g, s.p);
  return { state: 'step', gen: q.gen, phase: ph, g: s.g, id: (s.p && (s.p.id || s.p.to)) || '', r };
}"""


def state(page):
    return page.evaluate(STATE_JS)


def step(page, strategy='right'):
    return page.evaluate(STEP_JS, strategy)


def go(page, world, game, level, seed):
    page.evaluate("([w, g, l, s]) => window.__go(w, g, l, { noDemo: true, seed: s })", [world, game, level, seed])


def home(page):
    page.evaluate("window.__gesture('home')")


def on_map(page):
    return page.evaluate("window.__q === null && document.querySelector('#map').classList.contains('on') && !document.querySelector('#game').classList.contains('on')")


def all_games(page, worlds, interleave=False):
    """[(world, game)] for every mini-game; interleave=True -> P1,B1,H1,A1,X1,V1,P2,... (a new world every session)"""
    per = [(w, page.evaluate("(w) => WORLDS[w].games.filter(g => GAMES[g])", w)) for w in worlds]
    if not interleave:
        return [(w, g) for w, gs in per for g in gs]
    out, j = [], 0
    while any(j < len(gs) for _, gs in per):
        out += [(w, gs[j]) for w, gs in per if j < len(gs)]
        j += 1
    return out


def median(xs):
    xs = sorted(xs)
    n = len(xs)
    if not n:
        return 0
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2.0


class SpeechChecker:
    """Narration timeline rules over window.__speechLog ({id, t, text, tag, ch, ev}), carried across fetches.

    one-at-a-time : a narration 'speak' while the previous one has had no end / timeout / error / cancel yet
    cancel-gap    : a narration 'speak' less than 150 ms after the latest narration 'cancel' (iOS rule 2).
                    slog() stores Math.round(ms) for both events, so a true gap of 150.0 ms can read as 149 ->
                    the check allows that 1 ms of rounding and nothing more.
    """
    TERMINAL = ('end', 'timeout', 'error', 'cancel')

    def __init__(self, gap_ms=150, rounding_ms=1):
        self.last_id = 0
        self.open = None
        self.last_cancel = None
        self.gap_ms = gap_ms
        self.rounding_ms = rounding_ms
        self.speaks = 0
        self.cancels = 0
        self.gaps = []

    def fetch(self, page):
        return page.evaluate("(id) => (window.__speechLog || []).filter(e => e.id > id)", self.last_id)

    def feed(self, entries):
        overlap, gap = [], []
        for e in sorted(entries, key=lambda x: x['id']):
            self.last_id = max(self.last_id, e['id'])
            if e.get('ch') != 'narr':
                continue
            ev = e.get('ev')
            if ev == 'speak':
                self.speaks += 1
                if self.open is not None:
                    overlap.append((self.open, e))
                if self.last_cancel is not None:
                    d = e['t'] - self.last_cancel['t']
                    self.gaps.append(d)
                    if d < self.gap_ms - self.rounding_ms:
                        gap.append((self.last_cancel, e, d))
                self.open = e
            elif ev in self.TERMINAL:
                self.open = None
                if ev == 'cancel':
                    self.cancels += 1
                    self.last_cancel = e
        return overlap, gap


def fmt_ev(e):
    return '#%s t=%s %s/%s %r' % (e.get('id'), e.get('t'), e.get('ev'), e.get('tag'), (e.get('text') or '')[:16])


def wait_until(page, fn, timeout_s, poll_ms=50, tick=None):
    """poll fn() until it returns a truthy value (returned) or the deadline passes (None); tick() between polls"""
    end = time.time() + timeout_s
    while True:
        v = fn()
        if v:
            return v
        if time.time() >= end:
            return None
        if tick:
            tick()
        page.wait_for_timeout(poll_ms)
