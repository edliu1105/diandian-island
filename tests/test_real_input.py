# -*- coding: utf-8 -*-
"""Release gate: play every game with REAL pointer input (page.mouse down / move / up at screen px).

The other tests answer through window.__gesture (the logical step). Here every step goes through the browser's
hit-testing and the app's Input adapters, exactly like a finger: occlusion, hit slop, drag corridors, swipe angles,
hold timers, rotate / stretch thresholds and tap fallbacks all apply.

per step:   s = __next(strategy); ph = __physical(s)   (ph.pts = screen px polyline, ph.hold = ms)
            mouse move(p0) / down / move(p1..pn, steps=2, 16 ms apart) / [wait ph.hold] / up
            within 2 s the step must have an effect (ops up, phase changed, submitted, new question) AND the stroke
            must have produced a gesture the game accepted, on the intended target. A diagnostic wrapper around the
            app's gesture() records what the input layer emitted (it never emits anything itself), so a FAIL says what
            the finger really did: nothing / a character tap / the fast-forward overlay / a neighbouring target ...
            Before a stroke the test waits (max 3 s) until nothing on the stage is still popping in or moving - a child
            reacts to what stands still. Strokes on targets with a hold spec run with real timers (window.__fast is
            off from pointerdown to pointerup) so the hold timer and the quick-tap fallback are really exercised.
per question: submitted within 25 s; 'right' must be judged right, 'wrong' must be judged wrong and move on to a retest
per session: zero page errors / console errors / console warnings (OS socket exhaustion of the test machine,
             net::ERR_NO_BUFFER_SPACE, is reported as WARN)

passes (per engine):
  land     1180 x 820, every world x game x level, 2 questions each, strategy 'right'
  port     820 x 1180, level 2 of every game, 2 questions each, 'right'
  wrong    both engines, landscape, level 2 of every game: one wrong answer by real input, then the retest answered
           right. From the wrong question on the app runs with real timings (window.__fast = 0): with fast timings the
           correction's waits are 0 ms and B3's hands-on 'pairing' completes by itself before a finger could touch it.
  nat      (extension) landscape, every level: every tap step whose target has its own gesture (swipe / flick / drag
           with one drop / stretch / rotate / hold), every tap on a slide station (H1 vine) and every tap on a drop
           target (a piece that is not placed yet is dragged onto it) is played as that NATURAL gesture through
           __physical, so drag corridors, swipe angles and rotate / stretch thresholds are exercised too. The input layer
           must recognise it (else FAIL); when the game declines it in that state (e.g. a drop onto a piece that is
           already in) the tap is used for that step. Loop guards: a tap step becomes a natural gesture at most 3 times
           per question, each piece is dragged at most once per question, and a 'drag a piece onto it' that leaves the
           same tap step pending (V4: tapping the bowl takes one OUT) is not repeated.
  natport  the same in portrait, level 2
usage:  python tests/test_real_input.py [chromium|webkit|all] [worlds,comma] [land,port,wrong,nat,natport]
        (RI_VERBOSE=1 prints every stroke and the gestures it produced)
log:    tests/logs/real_input_<engines>.log   screenshots of failing states: shots/real_input/
"""
import os, sys, time, json
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, wait_map, Log, ROOT

ARG_ENG = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else 'all'
ENGINES = ['chromium', 'webkit'] if ARG_ENG == 'all' else ARG_ENG.split(',')
ALL_WORLDS = ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']
WORLDS_SEL = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else ALL_WORLDS
PASS_ORDER = ['land', 'wrong', 'port', 'nat', 'natport']
PASSES = sys.argv[3].split(',') if len(sys.argv) > 3 and sys.argv[3] else PASS_ORDER
VERBOSE = os.environ.get('RI_VERBOSE') == '1'

LAND, PORT = (1180, 820), (820, 1180)
ACT = ('act', 'ready', 'input')           # the child may act (plus 'pairing' during a hands-on correction)
Q_TIMEOUT = 25.0                          # s per question (and for the reveal / correction after it)
PROGRESS_MS = 2000                        # a stroke must show its effect within this
AFTER_STROKE_MS = 120
MOVE_GAP_MS = 16
MAX_STROKES = 40                          # per question (the longest right path is ~10 taps)
SETTLE_S = 3.0                            # max wait per stroke for pieces that are still appearing / moving
NAT_REPEAT = 3                            # a tap step is played as its natural gesture at most this often per question
SHOTS = os.path.join(ROOT, 'shots', 'real_input')
os.makedirs(SHOTS, exist_ok=True)
# Windows runs out of socket buffers when several browser suites run in parallel: a machine problem, reported as WARN
ENV_NOISE = ('net::ERR_NO_BUFFER_SPACE', 'net::ERR_INSUFFICIENT_RESOURCES')

# ---------------------------------------------------------------- page-side diagnostics (installed after __ready)
RIG_JS = r"""
() => {
  if (window.__rig) return 'already';
  if (typeof window.gesture !== 'function') return 'no gesture()';
  const rig = window.__rig = { seq: 0, log: [], subs: {}, sts: {} };
  /* diagnostics only: which question was submitted and how it was judged (st.ok) - fast mode can start the next
     question between two polls */
  const osub = Session.submit;
  Session.submit = function (st, value) {
    const r = osub.apply(this, arguments);
    try {
      if (r && st) {
        rig.subs[st.gen] = { seq: rig.seq, value: JSON.stringify(value) };
        rig.sts[st.gen] = st;
        Object.keys(rig.sts).map(Number).filter(g => g < st.gen - 4).forEach(g => delete rig.sts[g]);
      }
    } catch (e) {}
    return r;
  };
  rig.sub = gen => rig.subs[gen] || null;
  rig.judged = gen => { const st = rig.sts[gen]; return st && typeof st.ok === 'boolean' ? { ok: st.ok, phase: st.phase } : null; };
  /* diagnostics only: record every gesture the INPUT LAYER emits (and what the game answered); it never emits one */
  const orig = window.gesture;
  window.gesture = function (n, p, meta) {
    const st = Session.st, ph = st ? st.phase : null;
    const r = orig.apply(this, arguments);
    try {
      const P = p || {}, S = v => (v == null ? null : String(v));
      rig.log.push({ seq: ++rig.seq, n: String(n), id: S(P.id), at: S(P.at), to: S(P.to), dir: S(P.dir), delta: P.delta == null ? null : P.delta, ids: P.ids ? P.ids.map(String) : null, sys: !!(meta && meta.system), r: String(r), ph });
      if (rig.log.length > 300) rig.log.splice(0, rig.log.length - 150);
    } catch (e) {}
    return r;
  };
  rig.since = n0 => rig.log.filter(x => x.seq > n0);
  const desc = n => {
    if (!n || !n.tagName) return String(n);
    let s = n.tagName.toLowerCase();
    if (n.id) s += '#' + n.id;
    const c = n.classList ? Array.from(n.classList).filter(x => x !== 'press').slice(0, 3) : [];
    if (c.length) s += '.' + c.join('.');
    const im = n.querySelector ? n.querySelector(':scope > img, :scope > .body > img') : null;
    if (im && im.getAttribute('src')) s += '[' + im.getAttribute('src').split('/').pop() + ']';
    if (n.dataset && n.dataset.gid) s += '{' + n.dataset.gid + '}';
    return s;
  };
  /* what a finger at (x, y) really lands on */
  rig.hit = (x, y) => {
    const e = document.elementFromPoint(x, y);
    if (!e) return { top: null, gid: null, out: x < 0 || y < 0 || x > innerWidth || y > innerHeight };
    const t = e.closest ? e.closest('[data-gid]') : null;
    let piece = e;
    while (piece.parentElement && !['stage', 'game'].includes(piece.parentElement.id) && piece.parentElement !== document.body) piece = piece.parentElement;
    const hud = e.closest ? e.closest('.hud') : null;
    return { top: desc(e), piece: desc(piece), gid: t ? t.dataset.gid : null, ff: !!(e.closest && e.closest('#ff')), hud: hud ? hud.id : null };
  };
  rig.probe = () => {
    let q;
    try { q = window.__q; } catch (e) { return { error: String(e) }; }
    if (!q) return null;
    return { gen: q.gen, phase: q.phase, ops: q.ops, submitted: !!q.submitted, err: q.err, guided: !!q.guided, retest: !!q.retest,
             kind: q.kind, level: q.level, game: q.game, seq: rig.seq };
  };
  rig.findEl = id => { const st = Session.st; if (!st || id == null) return null; return (st.game.find && st.game.find(st, id)) || document.querySelector('[data-gid="' + id + '"]'); };
  const specKeys = sp => sp ? Object.keys(sp).filter(k => k !== 'id' && sp[k] !== undefined && sp[k] !== false && sp[k] !== null) : null;
  const target = id => {
    const e = rig.findEl(id);
    if (!e || !e.getBoundingClientRect) return null;
    const r = e.getBoundingClientRect(), sp = e._spec || null;
    return { el: desc(e), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), connected: e.isConnected,
             bound: e.dataset ? (e.dataset.gid || null) : null, spec: specKeys(sp) };
  };
  const visible = t => { if (!t.isConnected) return false; const cs = getComputedStyle(t); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false; const r = t.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight; };
  const bx = t => t._box ? t._box() : box(t);
  const placedIn = (t, drops) => { const b = bx(t), cx = b.x + b.w / 2, cy = b.y + b.h / 2; return drops.some(d => { const q = d.rect(); return cx >= q.x - q.w * 0.25 && cx <= q.x + q.w * 1.25 && cy >= q.y - q.h * 0.25 && cy <= q.y + q.h * 1.25; }); };
  /* the natural gesture a child would use instead of tapping `id` (same target, or the piece that goes there) */
  rig.natural = (s, used) => {
    if (!s || s.g !== 'tap' || !s.p || s.p.id == null) return null;
    used = used || [];
    const id = String(s.p.id), e = rig.findEl(id);
    if (!e) return null;
    const sp = e._spec;
    if (sp && e.dataset && e.dataset.gid === id) {
      if (sp.stretch) return { g: 'stretch', p: { id, delta: 1 }, how: 'self' };
      if (sp.rotate) return { g: 'rotate', p: { id, dir: 1 }, how: 'self' };
      if (sp.swipe && sp.swipe.length) return { g: 'swipe', p: { id, dir: sp.swipe[0] }, how: 'self' };
      if (sp.flick) { const f = typeof sp.flick === 'function' ? sp.flick() : sp.flick; if (f && f.length === 1) return { g: 'drop', p: { id, to: String(f[0].id) }, how: 'self' }; }
      if (sp.drag) { const d = typeof sp.drops === 'function' ? sp.drops() : (sp.drops || []); if (d.length === 1) return { g: 'drop', p: { id, to: String(d[0].id) }, how: 'self' }; }
      if (sp.hold) return { g: 'hold', p: { id }, how: 'self' };
      if (sp.rub) return { g: 'rub', p: { id }, how: 'self' };
      if (sp.arc) return { g: 'arc', p: { id }, how: 'self' };
    }
    const all = Array.from(document.querySelectorAll('#stage [data-gid]'));
    for (const t of all) { const ts = t._spec; if (ts && ts.slide && ts.slide.some(x => String(x.id) === id)) return { g: 'pick', p: { id: t.dataset.gid, at: id }, how: 'slide' }; }
    for (const t of all) {             /* a drop target: drag a piece that is not placed yet onto it (P2 boots, A1 pups) */
      const ts = t._spec; if (!ts || !ts.drag || ts.disabled || t === e || used.includes(t.dataset.gid)) continue;
      const d = typeof ts.drops === 'function' ? ts.drops() : (ts.drops || []);
      if (!d.some(x => String(x.id) === id) || placedIn(t, d) || !visible(t)) continue;
      return { g: 'drop', p: { id: t.dataset.gid, to: id }, how: 'piece' };
    }
    return null;
  };
  /* pieces still popping in / flying / walking on the stage (finite animations; endless idle loops never settle) */
  rig.busy = () => {
    const stage = document.getElementById('stage'), out = [];
    for (const a of document.getAnimations()) {
      try {
        const t = a.effect && a.effect.target;
        if (!t || !stage.contains(t) || (t.closest && t.closest('.hand')) || a.playState !== 'running') continue;
        const tm = a.effect.getComputedTiming();
        if (!isFinite(tm.endTime)) continue;
        out.push(desc(t) + ' ' + Math.round(tm.endTime - (tm.localTime || 0)) + 'ms');
      } catch (e) {}
    }
    return out;
  };
  const physical = s => { const ph = window.__physical(s); if (!ph || !ph.pts || !ph.pts.length) return { ph: null, hit: null }; return { ph, hit: rig.hit(ph.pts[0].x, ph.pts[0].y), out: ph.pts.filter(p => p.x < 0 || p.y < 0 || p.x > innerWidth || p.y > innerHeight).length }; };
  rig.plan = (strat, nat, used) => {
    const q = rig.probe();
    if (!q || q.error) return { q };
    const s = window.__next(strat);
    if (!s) return { q, s: null };
    const a = physical(s);
    const out = { q, s: { g: s.g, p: s.p }, ph: a.ph, hit: a.hit, out: a.out, tr: target(s.p && s.p.id), busy: rig.busy() };
    if (nat) {
      const ns = rig.natural(s, used);
      if (ns) { const b = physical(ns); Object.assign(out, { ns, nph: b.ph, nhit: b.hit, nout: b.out, ntr: target(ns.p.id) }); }
    }
    return out;
  };
  /* real timers for one stroke (hold targets): back to fast right after the input layer handled pointerup */
  rig.slowStroke = () => {
    if (!window.__fast) return false;
    window.__fast = 0;
    window.addEventListener('pointerup', () => { window.__fast = 1; }, { once: true });
    return true;
  };
  return 'ok';
}
"""

# the stroke showed an effect: new question / submitted / phase / ops, or the game accepted a (non-system) gesture
PROGRESS_JS = r"""
([gen, ops, phase, sub, n0]) => {
  let q; try { q = window.__q; } catch (e) { return 'q-error'; }
  if (!q) return 'session-ended';
  if (q.gen !== gen) return 'gen';
  if (!!q.submitted !== sub) return 'submitted';
  if (q.phase !== phase) return 'phase';
  if (q.ops > ops) return 'ops';
  if (window.__rig.log.some(x => x.seq > n0 && !x.sys && x.r === 'ok')) return 'accepted';
  return false;
}
"""


def install_rig(page):
    r = page.evaluate(RIG_JS)
    if r not in ('ok', 'already'):
        raise RuntimeError('cannot install diagnostics: %s' % r)


def probe(page):
    return page.evaluate('() => window.__rig.probe()')


def sdesc(s):
    if not s:
        return 'None'
    p = s.get('p') or {}
    extra = ','.join('%s=%s' % (k, v) for k, v in p.items() if k != 'id')
    return '%s(%s%s)' % (s.get('g'), p.get('id'), (' ' + extra) if extra else '')


def gdesc(em):
    out = []
    for e in em:
        a = e['n'] + '(' + str(e['id'])
        for k in ('at', 'to', 'dir'):
            if e.get(k):
                a += ' %s=%s' % (k, e[k])
        if e.get('delta') is not None:
            a += ' d=%s' % e['delta']
        a += ')->' + e['r']
        if e.get('sys'):
            a += '[system]'
        out.append(a)
    return '[' + ', '.join(out) + ']' if out else '[nothing]'


def pts_desc(ph):
    p = ph['pts']
    hold = (' hold %dms' % ph['hold']) if ph.get('hold') else ''
    if len(p) == 1:
        return '(%.0f,%.0f)%s' % (p[0]['x'], p[0]['y'], hold)
    return '(%.0f,%.0f)->(%.0f,%.0f) %d pts%s' % (p[0]['x'], p[0]['y'], p[-1]['x'], p[-1]['y'], len(p), hold)


def matches(e, ns):
    """did the input layer emit the natural gesture `ns`?"""
    p = ns['p']
    if e['sys'] or e['n'] != ns['g'] or e['id'] != str(p['id']):
        return False
    if ns['g'] == 'drop':
        return e.get('to') == str(p['to'])
    if ns['g'] == 'pick':
        return e.get('at') == str(p['at'])
    if ns['g'] == 'swipe':
        return e.get('dir') == str(p['dir'])
    if ns['g'] == 'stretch':
        return (e.get('delta') or 0) > 0
    if ns['g'] == 'rotate':
        return e.get('dir') == '1'
    return True


def stroke(page, ph):
    """one finger: down at the first point, through every point, up at the last (real pointer events)"""
    pts = ph['pts']
    m = page.mouse
    m.move(pts[0]['x'], pts[0]['y'])
    m.down()
    for p in pts[1:]:
        m.move(p['x'], p['y'], steps=2)
        page.wait_for_timeout(MOVE_GAP_MS)
    if ph.get('hold'):
        page.wait_for_timeout(int(ph['hold']))
    m.up()


class Run:
    """one engine x pass on one page"""

    def __init__(self, page, log, eng, name, natural=False):
        self.page, self.log, self.eng, self.name, self.natural = page, log, eng, name, natural
        self.stats = {'sessions': 0, 'questions': 0, 'strokes': 0, 'natural': 0}
        self.nat_kinds = {}
        self.shot_done = set()
        self.settle_t0 = None
        self.err0 = 0

    def shot(self, key):
        if key in self.shot_done:
            return
        self.shot_done.add(key)
        try:
            self.page.screenshot(path=os.path.join(SHOTS, '%s_%s_%s.png' % (self.eng, self.name, key)))
        except Exception:
            pass

    def fail(self, tag, msg, key=None):
        self.log.fail('%s: %s' % (tag, msg))
        if key:
            self.shot(key)

    def broken(self, tag, key):
        """an uncaught page error / a question error broke the flow: fail fast (the session check lists them all)"""
        bad = [e for e in self.page.errors[self.err0:] if e.startswith('pageerror') or 'question error' in e]
        if bad:
            self.fail(tag, 'the question broke with a page error (not an input problem): %s' % bad[0][:300], key)
            return True
        return False

    def settled(self, plan):
        """wait (max SETTLE_S per stroke) until nothing on the stage is still popping in / moving"""
        if not plan.get('busy'):
            return True
        if self.settle_t0 is None:
            self.settle_t0 = time.time()
        return time.time() - self.settle_t0 > SETTLE_S

    # ---------------------------------------------------------------- one real stroke for one step
    def do_step(self, tag, plan, key, nat=False):
        """-> 'ok' | 'fail' | 'declined' (natural gesture recognised by the input layer but not taken by the game)"""
        page, cur = self.page, plan['q']
        s, ph, hit, tr, nout = (plan['ns'], plan['nph'], plan['nhit'], plan['ntr'], plan.get('nout')) if nat else \
                               (plan['s'], plan['ph'], plan['hit'], plan['tr'], plan.get('out'))
        self.settle_t0 = None
        what = ('natural %s for %s' % (sdesc(s), sdesc(plan['s']))) if nat else sdesc(s)
        if not ph or not ph.get('pts'):
            self.fail(tag, 'UNMAPPABLE step %s: __physical returned null (target %s)' % (what, tr), key)
            return 'fail'
        n0 = cur['seq']
        slow = bool(tr and tr.get('spec') and 'hold' in tr['spec'])
        restored = page.evaluate('() => window.__rig.slowStroke()') if slow else False
        stroke(page, ph)
        if restored:
            page.evaluate('() => { window.__fast = 1; }')
        self.stats['strokes'] += 1
        page.wait_for_timeout(AFTER_STROKE_MS)
        try:
            why = page.wait_for_function(PROGRESS_JS, arg=[cur['gen'], cur['ops'], cur['phase'], cur['submitted'], n0],
                                         timeout=PROGRESS_MS, polling=25).json_value()
        except PWTimeout:
            why = None
        em = page.evaluate('(n) => window.__rig.since(n)', n0)
        mine = [e for e in em if not e['sys']]
        acc = [e for e in mine if e['r'] == 'ok']
        info = 'step %s [phase %s] stroke %s%s | finger lands on %s | target %s | emitted %s' % (
            what, cur['phase'], pts_desc(ph), ' (%d points outside the viewport)' % nout if nout else '', hit, tr, gdesc(em))
        if plan.get('busy'):
            info += ' | still moving after %.0f s: %s' % (SETTLE_S, plan['busy'][:4])
        if VERBOSE:
            self.log.w('   . %s: %s%s -> %s' % (tag, what, ' [real timers]' if slow else '', gdesc(em)))
        if why in ('session-ended', 'q-error'):
            self.fail(tag, 'session ended / broke after a stroke (%s): %s' % (why, info), key)
            return 'fail'
        if nat:
            mt = [e for e in mine if matches(e, s)]
            if not mt:
                if acc:
                    self.log.warn('%s: natural gesture NOT RECOGNISED as %s by the input layer; another gesture did the step: %s' % (tag, s['g'], info))
                    return 'ok'
                self.fail(tag, 'NATURAL GESTURE NOT RECOGNISED by the input layer (expected %s): %s' % (sdesc(s), info), key)
                return 'fail'
            if not any(e['r'] == 'ok' for e in mt):
                if VERBOSE:
                    self.log.w('   . %s: the game declines %s here (%s) - the tap is used for this step' % (tag, sdesc(s), mt[0]['r']))
                return 'declined'
            self.stats['natural'] += 1
            k = s['g'] + ('' if plan['ns'].get('how') == 'self' else '/' + plan['ns'].get('how'))
            self.nat_kinds[k] = self.nat_kinds.get(k, 0) + 1
            return 'ok'
        if not why:
            self.fail(tag, 'REAL INPUT HAD NO EFFECT within %d ms: %s' % (PROGRESS_MS + AFTER_STROKE_MS, info), key)
            return 'fail'
        if not acc:
            self.fail(tag, 'the state moved (%s) but the stroke produced no accepted gesture - the intended step was not performed: %s' % (why, info), key)
            return 'fail'
        want = (s.get('p') or {}).get('id')
        if want is not None and not any(str(want) in (e.get('id'), e.get('at'), e.get('to')) for e in acc):
            self.fail(tag, 'REAL INPUT HIT ANOTHER TARGET - the stroke for %s was taken as a gesture on something else: %s' % (sdesc(s), info), key)
            return 'fail'
        return 'ok'

    # ---------------------------------------------------------------- one question until it is submitted
    def play_question(self, tag, strat, prev_gen, key, slow=False):
        page = self.page
        try:
            wait_phase(page, phases=ACT, timeout=20000, gen=prev_gen)
        except Exception:
            self.fail(tag, 'question never became answerable (state %s)' % probe(page), key)
            return None
        if slow:
            page.evaluate('() => { window.__fast = 0; }')        # real timings from here on (see 'wrong' above)
        first = probe(page)
        gen = first['gen']
        answer = page.evaluate('() => { const q = window.__q; return q ? JSON.stringify(q.answer) : null; }')
        t0 = time.time()
        strokes = 0
        declined = set()          # natural strokes the game declined in this question (their tap is used)
        no_piece = set()          # tap steps whose 'drag a piece onto it' version did not advance the path
        nat_count = {}            # tap step -> times it was played as a natural gesture in this question
        used_pieces = []          # pieces already dragged onto a drop target in this question (each piece once)
        prev_piece = None         # the tap step that was just played as 'drag a piece onto it'
        while True:
            if time.time() - t0 > Q_TIMEOUT:
                self.fail(tag, 'STUCK: not submitted after %.0f s and %d strokes (state %s)' % (Q_TIMEOUT, strokes, probe(page)), key)
                return None
            if self.broken(tag, key):
                return None
            cur0 = probe(page)
            use = 'right' if (cur0 and cur0.get('guided')) else strat     # a guided question is followed, like a led child
            plan = page.evaluate('([s, n, u]) => window.__rig.plan(s, n, u)', [use, self.natural, used_pieces])
            cur = plan.get('q')
            if not cur or cur.get('error') or cur['gen'] != gen or cur['submitted']:
                if page.evaluate('(g) => window.__rig.sub(g)', gen):
                    break                              # submitted (fast mode may already show the next question)
                if not cur or cur.get('error'):
                    self.fail(tag, 'session ended before the question was submitted (%s)' % cur, key)
                else:
                    self.fail(tag, 'question gen %s was replaced by gen %s without being submitted (state %s)' % (gen, cur['gen'], cur), key)
                return None
            if cur['phase'] not in ACT or not plan.get('s') or not self.settled(plan):
                page.wait_for_timeout(40)
                continue
            if strokes >= MAX_STROKES:
                self.fail(tag, 'more than %d strokes without submitting (last step %s, state %s)' % (MAX_STROKES, sdesc(plan['s']), cur), key)
                return None
            ns = plan.get('ns')
            sig = json.dumps(ns, sort_keys=True) if ns else None
            tap_sig = json.dumps(plan['s'], sort_keys=True)
            if prev_piece is not None and prev_piece == tap_sig:
                no_piece.add(tap_sig)     # e.g. V4 'tap bowl' takes one out - dropping a piece onto the bowl puts one in
            prev_piece = None
            nat = bool(ns) and sig not in declined and nat_count.get(tap_sig, 0) < NAT_REPEAT and \
                not (ns.get('how') == 'piece' and tap_sig in no_piece)
            r = self.do_step(tag, plan, key, nat=nat)
            strokes += 1
            if r == 'fail':
                return None
            if r == 'declined':
                declined.add(sig)
            if nat and r == 'ok':
                nat_count[tap_sig] = nat_count.get(tap_sig, 0) + 1
                if ns.get('how') == 'piece':
                    prev_piece = tap_sig
                    used_pieces.append(str(ns['p']['id']))
        return {'gen': gen, 'answer': answer, 'strokes': strokes, 'level': first['level'], 'kind': first['kind']}

    # ---------------------------------------------------------------- after submit: reveal / correction (+ hands-on pairing) until the next question
    def finish_question(self, tag, gen, key):
        page = self.page
        t0 = time.time()
        pair_taps = 0
        while time.time() - t0 < Q_TIMEOUT:
            if self.broken(tag, key):
                return None
            plan = page.evaluate("() => { const q = window.__rig.probe(); return q && !q.error && q.phase === 'pairing' ? window.__rig.plan('right', false) : { q }; }")
            cur = plan.get('q')
            if not cur or cur.get('error') or cur['gen'] != gen:
                return {'next': cur, 'pair_taps': pair_taps}
            if cur['phase'] == 'pairing' and plan.get('s') and self.settled(plan):
                if self.do_step(tag + ' pairing', plan, key) != 'ok':
                    return None
                pair_taps += 1
                continue
            page.wait_for_timeout(40)
        self.fail(tag, 'the next question did not come within %.0f s after submit (state %s)' % (Q_TIMEOUT, probe(page)), key)
        return None

    # ---------------------------------------------------------------- one session: __go, N questions by real input, home
    def session(self, w, g, lv, strategies, slow=False):
        page, log = self.page, self.log
        tag0 = '[%s %s] %s L%d' % (self.eng, self.name, g, lv)
        before = self.err0 = len(page.errors)
        fails0 = log.fails
        self.stats['sessions'] += 1
        page.evaluate("([w, g, l, s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, 1000 + lv])
        prev = None
        try:
            for qi, strat in enumerate(strategies):
                tag = '%s q%d %s' % (tag0, qi + 1, strat)
                key = '%s_L%d_q%d_%s' % (g, lv, qi + 1, strat)
                nat0 = self.stats['natural']
                r = self.play_question(tag, strat, prev, key, slow=slow and qi == 0)
                if r is None:
                    break
                if slow and qi == len(strategies) - 1:
                    page.evaluate('() => { window.__fast = 1; }')
                self.stats['questions'] += 1
                tag = '%s [%s L%d]' % (tag, r['kind'], r['level'])
                f = self.finish_question(tag, r['gen'], key)
                if f is None:
                    break
                nxt = f['next']
                if not nxt or nxt.get('error'):
                    log.fail('%s: the session ended right after the question (state %s)' % (tag, nxt))
                    break
                jd = page.evaluate('(g) => window.__rig.judged(g)', r['gen']) or {}
                sub = page.evaluate('(g) => window.__rig.sub(g)', r['gen']) or {}
                judged = jd.get('ok')
                how = '%d strokes' % r['strokes']
                if self.natural:
                    how += ' (%d natural gestures)' % (self.stats['natural'] - nat0)
                if f['pair_taps']:
                    how += ' + %d hands-on pairing taps' % f['pair_taps']
                if strat == 'right':
                    if judged is True:
                        log.ok('%s: answered right by real input in %s' % (tag, how))
                    else:
                        self.fail(tag, 'REAL INPUT GAVE A WRONG ANSWER on the right path (judged %s, submitted %s, expected %s)' % (
                            judged, sub.get('value'), r['answer']), key)
                        break
                else:
                    if judged is False and nxt.get('err', 0) >= 1:
                        log.ok('%s: wrong answer by real input in %s, judged wrong, the game moved on to a retest' % (tag, how))
                    elif judged is True:
                        log.warn('%s: the wrong path was judged RIGHT (submitted %s) - strategy wrong is not wrong here?' % (tag, sub.get('value')))
                    else:
                        self.fail(tag, 'after the wrong answer the game did not move on to a retest (judged %s, next question %s)' % (judged, nxt), key)
                        break
                prev = r['gen']
        except Exception as e:
            self.fail(tag0, 'exception %s' % str(e)[:300], '%s_L%d_exc' % (g, lv))
        try:
            page.evaluate('() => { window.__fast = 1; }')
            page.evaluate("gesture('home')")
            wait_map(page, timeout=15000)
        except Exception as e:
            log.fail('%s: could not return to the map (%s)' % (tag0, str(e)[:120]))
        new = page.errors[before:]
        env = [e for e in new if any(k in e for k in ENV_NOISE)]
        new = [e for e in new if e not in env]
        if env:
            log.warn('%s: %d request errors of the TEST MACHINE (OS socket exhaustion, not the app): %s' % (tag0, len(env), env[:2]))
        if new:
            log.fail('%s: %d page/console errors: %s' % (tag0, len(new), new[:4]))
        elif log.fails == fails0:
            log.ok('%s: session clean (real input, zero page errors)' % tag0)


def main():
    log = Log('real_input_%s' % '-'.join(ENGINES))
    summary = []
    t_all = time.time()
    with sync_playwright() as p, serve() as base:
        for eng in ENGINES:
            t_eng = time.time()
            f0, p0, w0 = log.fails, log.passes, log.warns
            br = getattr(p, eng).launch()
            tot = {'sessions': 0, 'questions': 0, 'strokes': 0, 'natural': 0}
            for pas in PASS_ORDER:
                if pas not in PASSES:                      # R3-C03: the normal-speed wrong path runs on WebKit too
                    continue
                vw, vh = PORT if pas in ('port', 'natport') else LAND
                page = new_page(br, base, vw, vh, fast=True)
                install_rig(page)
                enter(page)
                run = Run(page, log, eng, pas, natural=pas in ('nat', 'natport'))
                maxlv = page.evaluate('MAXLV')
                t_pass = time.time()
                for w in WORLDS_SEL:
                    games = page.evaluate('(w) => WORLDS[w].games.filter(g => GAMES[g])', w)
                    for g in games:
                        if pas in ('land', 'nat'):
                            for lv in range(1, maxlv[w] + 1):
                                run.session(w, g, lv, ['right', 'right'])
                        elif pas in ('port', 'natport'):
                            run.session(w, g, 2, ['right', 'right'])
                        else:
                            run.session(w, g, 2, ['wrong', 'right'], slow=True)
                extra = (' (natural gestures: %s)' % ', '.join('%s x%d' % kv for kv in sorted(run.nat_kinds.items()))) if run.natural else ''
                log.w('--- %s %s: %d sessions, %d questions, %d real strokes%s in %.0f s' % (
                    eng, pas, run.stats['sessions'], run.stats['questions'], run.stats['strokes'], extra, time.time() - t_pass))
                for k in tot:
                    tot[k] += run.stats[k]
                page.context.close()
            br.close()
            summary.append('%s: pass=%d fail=%d warn=%d | %d sessions, %d questions, %d real strokes (%d natural gestures) | %.0f s' % (
                eng, log.passes - p0, log.fails - f0, log.warns - w0, tot['sessions'], tot['questions'], tot['strokes'], tot['natural'], time.time() - t_eng))
    for s in summary:
        log.w('ENGINE ' + s)
    log.w('total %.0f s' % (time.time() - t_all))
    ok = log.close()
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
