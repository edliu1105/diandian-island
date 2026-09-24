# -*- coding: utf-8 -*-
"""Rotation gate: the iPad can be turned at any moment (landscape 1180x820 <-> portrait 820x1180).

Every world x mini-game at level 2 (+ the world's max level when it is 4), fast mode, one session each:
 q1 (created in landscape)
  1. answerable (ready/input; a preliminary act is done the right way first) -> turn to portrait -> layout gate:
     check() clean, the stage really is portrait, no page scroll (scrollTop 0, no horizontal scroll)
  2. turn back to landscape -> the same gate
  3. mid-drag: a draggable piece is pressed with real pointer events (window.__physical) and moved halfway, the iPad
     turns to portrait, then the finger lifts -> no error, the gesture was aborted, the piece sprang back inside the
     stage, the question is still answerable (a question without any draggable piece just turns)
  4. finished the right way (__next('right') via __gesture) in portrait, every step's target inside the stage
     -> submitted, judged right, the next question comes
 q2 (created in portrait) - the same the other way round
  - the fresh portrait question passes the gate; mid-drag rotation to landscape (during the act when the act is
    where the drag lives: A3 'plus', H3), else a plain rotation -> gate in landscape
  - finished the right way in landscape -> submitted, judged right, the next question comes
Normal speed (fast=False), one game per world at level 2 (--reveal-all: every game at level 2):
  5. the question is answered; 300 ms after the submit (reveal animation running) the iPad turns
     -> the next question comes and passes the gate in the new orientation
Zero console / page errors per session. Exit 0 only when nothing failed.
Drift diagnostic (WARN only, --no-drift skips it): every rotated state is compared with a fresh layout of the very same
question in that orientation (same seed, same stored state); a piece whose centre is > 24 px away from its fresh place
was left behind by the relayout even when check() has nothing to say (e.g. a frame no longer around its objects).

usage: python tests/test_rotate.py [chromium|webkit|all] [worlds,comma] [games,comma]
                                   [--reveal-all|--no-reveal|--only-reveal] [--no-drift]
writes tests/logs/rotate_<engine>.log and screenshots of failing states to shots/rotate/
"""
import os, sys, time, json, math
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, q, wait_phase, wait_next_question, Log, ROOT
from test_layout import check

FLAGS = [a for a in sys.argv[1:] if a.startswith('--')]
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
ENGINES = ['chromium', 'webkit'] if not ARGS or ARGS[0] in ('', 'all') else ARGS[0].split(',')
WORLDS = ARGS[1].split(',') if len(ARGS) > 1 and ARGS[1] else ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']
ONLY = set(ARGS[2].split(',')) if len(ARGS) > 2 and ARGS[2] else None
REVEAL_ALL = '--reveal-all' in FLAGS
MAIN = '--only-reveal' not in FLAGS
REVEAL = '--no-reveal' not in FLAGS
DRIFT = '--no-drift' not in FLAGS
DRIFT_PX = 24
# step 5 subset: per world the game whose reveal moves the most scene pieces / characters
REVEAL_PICK = {'peppa': 'P1', 'bluey': 'B3', 'huluwa': 'H3', 'paw': 'A2', 'xiyou': 'X2', 'avengers': 'V1'}

VIEW = {'land': (1180, 820), 'port': (820, 1180)}
STAGE = {'land': (1024, 704), 'port': (704, 1024)}
LIVE = ('act', 'ready', 'input')
SHOTS = os.path.join(ROOT, 'shots', 'rotate')
os.makedirs(SHOTS, exist_ok=True)
SEED = 4321          # the layout gate's seeds: the un-rotated layout of these first questions is known clean

# ------------------------------------------------------------------ in-page helpers (test side only)
ACT_JS = "(() => { const s = window.__next('right'); if (s) window.__gesture(s.g, s.p); return !!s; })()"

SCROLL_JS = """() => { const s = document.scrollingElement; return { top: s.scrollTop, left: s.scrollLeft, sw: s.scrollWidth, cw: s.clientWidth }; }"""

# running finite animations inside the stage (normal speed: pieces pop in; judge the layout once they stand still)
BUSY_JS = """() => Stage.el.getAnimations({ subtree: true }).filter(a => a.playState === 'running' && a.effect && a.effect.getTiming().iterations !== Infinity).length"""

# one right step: the step, whether its target lies inside the stage, what the gesture entry said
STEP_JS = """(gen) => {
  const q = window.__q;
  if (!q || q.gen !== gen) return { gone: true };
  if (q.submitted) return { submitted: true, phase: q.phase };
  if (!['act', 'ready', 'input', 'pairing'].includes(q.phase)) return { wait: q.phase };
  const s = window.__next('right');
  if (!s) return { wait: q.phase, none: true };
  let off = null;
  if (s.at) { const p = Stage.toStage(s.at.x, s.at.y); if (p.x < 0 || p.y < 0 || p.x > Stage.W || p.y > Stage.H) off = { x: Math.round(p.x), y: Math.round(p.y), W: Stage.W, H: Stage.H }; }
  const r = window.__gesture(s.g, s.p);
  const q2 = window.__q;
  return { step: s.g + ' ' + ((s.p && s.p.id) || ''), r, off, phase0: q.phase, submitted: !!(q2 && q2.gen === gen && q2.submitted), phase: q2 ? q2.phase : null };
}"""

# a draggable piece of the current question (the right step's own piece first) -> a logical 'drop' step
DRAG_JS = """(prefer) => {
  const st = Session.st; if (!st) return null;
  const vis = e => { if (!e || !e.isConnected) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const all = Array.from(Stage.el.querySelectorAll('[data-gid]')).filter(e => vis(e) && e._spec && !e._spec.disabled && (e._spec.drag || e._spec.flick));
  all.sort((a, b) => (b.dataset.gid === prefer) - (a.dataset.gid === prefer));
  for (const e of all) {
    const sp = e._spec;
    let list = sp.flick ? (typeof sp.flick === 'function' ? sp.flick() : sp.flick) : (typeof sp.drops === 'function' ? sp.drops() : (sp.drops || []));
    list = (list || []).filter(d => d && d.id);
    if (list.length) return { g: 'drop', p: { id: e.dataset.gid, to: list[0].id }, how: sp.flick ? 'flick' : 'drag' };
  }
  return null;
}"""

# where to put the finger on the piece: the stroke's first point, or a nearby point that really hits the piece
PRESS_JS = """([id, p0]) => {
  const st = Session.st;
  const e = (st && st.game.find && st.game.find(st, id)) || document.querySelector('[data-gid="' + id + '"]');
  if (!e) return null;
  const r = e.getBoundingClientRect(), cand = [[0, 0]];
  for (const fx of [-0.25, 0, 0.25]) for (const fy of [-0.3, 0, 0.3]) cand.push([fx * r.width, fy * r.height]);
  for (const [dx, dy] of cand) { const h = document.elementFromPoint(p0.x + dx, p0.y + dy); const t = h && h.closest ? h.closest('[data-gid]') : null; if (t === e) return { dx, dy }; }
  const h = document.elementFromPoint(p0.x, p0.y);
  return { miss: h ? (h.closest && h.closest('[data-gid]') ? h.closest('[data-gid]').dataset.gid : (h.id || h.className || h.tagName)).toString() : 'nothing' };
}"""

INFLIGHT_JS = """() => { const c = Input.cur; return c ? { id: c.id, moved: !!c.moved, tf: c.el.style.transform || '' } : null; }"""

# the dragged piece after the finger lifted: transform, press state, box in stage px (transforms included)
PIECE_JS = """(id) => {
  const st = Session.st;
  const e = (st && st.game.find && st.game.find(st, id)) || Array.from(Stage.el.querySelectorAll('[data-gid]')).find(x => x.dataset.gid === id);
  if (!e || !e.isConnected) return { gone: true };
  const r = e.getBoundingClientRect(), a = Stage.toStage(r.left, r.top), b = Stage.toStage(r.right, r.bottom);
  return { tf: e.style.transform || '', press: e.classList.contains('press'), x: Math.round(a.x), y: Math.round(a.y), w: Math.round(b.x - a.x), h: Math.round(b.y - a.y), W: Stage.W, H: Stage.H };
}"""

ARROW = {'land': 'port->land', 'port': 'land->port'}


# ------------------------------------------------------------------ helpers
def turn(page, o, settle_ms=250):
    """rotate the iPad; the app re-lays out 60 ms after the resize (debounced)"""
    w, h = VIEW[o]
    page.set_viewport_size({'width': w, 'height': h})
    page.wait_for_timeout(settle_ms)


def settle(page, max_ms=3000):
    t_end = time.time() + max_ms / 1000.0
    while time.time() < t_end:
        if not page.evaluate(BUSY_JS):
            return True
        page.wait_for_timeout(50)
    return False


def shoot(page, shot):
    try:
        page.screenshot(path=os.path.join(SHOTS, shot + '.png'))
    except Exception:
        pass


def brief(cur):
    return cur and {k: cur.get(k) for k in ('gen', 'phase', 'submitted')}


def answerable(page, gen=None, timeout=20000, pause=120):
    """wait for the question (a new one if `gen` is given); a preliminary act (jump, open, gather...) is done the right
    way first -> phase ready/input"""
    wait_phase(page, phases=LIVE, timeout=timeout, gen=gen)
    t_end = time.time() + timeout / 1000.0
    while True:
        cur = q(page)
        if cur and cur['phase'] in ('ready', 'input') and (gen is None or cur['gen'] != gen):
            return cur
        if time.time() > t_end:
            raise RuntimeError('never answerable (phase %s)' % (cur and cur['phase']))
        if cur and cur['phase'] == 'act':
            page.evaluate(ACT_JS)
        page.wait_for_timeout(pause)


def drive_right(page, gen, timeout_s=20, pause_ms=40):
    """finish the question with __next('right') steps via __gesture; returns (outcome, notes)
    outcome: 'submitted' | 'gone' (the question ended without a submit seen) | 'stuck' | 'timeout'"""
    notes = {'steps': [], 'off': [], 'refused': []}
    t_end = time.time() + timeout_s
    idle_since = time.time()
    while time.time() < t_end:
        r = page.evaluate(STEP_JS, gen)
        if r.get('gone'):
            return 'gone', notes
        if 'step' not in r:
            if r.get('submitted'):
                return 'submitted', notes
            if time.time() - idle_since > 8:
                notes['stuck'] = r
                return 'stuck', notes
            page.wait_for_timeout(20)
            continue
        idle_since = time.time()
        notes['steps'].append(r['step'])
        if r['off']:
            notes['off'].append('%s at %s' % (r['step'], r['off']))
        if r['r'] != 'ok':
            notes['refused'].append('%s -> %s (phase %s)' % (r['step'], r['r'], r['phase0']))
        if r['submitted']:
            return 'submitted', notes
        if len(notes['steps']) > 60:
            return 'stuck', notes
        page.wait_for_timeout(pause_ms)
    return 'timeout', notes


def gate(page, log, tag, o, shot=None, known=(), dup=(), dup_name=''):
    """layout gate on the current state after a rotation: the stage follows, check() is clean, the page does not scroll.
    known: problems the same state had before any rotation (annotated); dup: problems of an identical earlier state
    that already failed there (reported once as a warning, not failed again). Returns (problems, report)."""
    rep = page.evaluate('window.__layoutReport()')
    if not rep:
        log.fail('%s: no layout report (no question on screen)' % tag)
        return ['no report'], None
    bad = []
    W, H = STAGE[o]
    if bool(rep['portrait']) != (o == 'port') or rep['W'] != W or rep['H'] != H:
        bad.append('stage did not follow the rotation: portrait=%s stage %sx%s' % (rep['portrait'], rep['W'], rep['H']))
    bad += check(rep)
    sc = page.evaluate(SCROLL_JS)
    if sc['top'] != 0:
        bad.append('document.scrollingElement.scrollTop = %s' % sc['top'])
    if sc['left'] != 0 or sc['sw'] > sc['cw'] + 1:
        bad.append('horizontal scroll: %s' % sc)
    bad = sorted(set(bad))
    full = '%s [%s/%s]' % (tag, rep.get('kind'), rep.get('phase'))
    new = [b for b in bad if b not in dup]
    same = [b for b in bad if b in dup]
    for b in new:
        log.fail('%s: %s%s' % (full, b, '   (also before any rotation)' if b in known else ''))
    if same:
        log.warn('%s: %d problem(s) identical to %s (failed there)' % (full, len(same), dup_name))
    if new and shot:
        shoot(page, shot)
    if not bad:
        log.ok('%s: layout clean' % full)
    return bad, rep


# ------------------------------------------------------------------ drift: rotated layout vs a fresh layout of the same question
def pieces(rep):
    """targets, characters and the non-interactive math pieces (task card, badges) of a report, keyed stably"""
    out = {}
    for kind in ('targets', 'actors', 'math'):
        seen = {}
        for x in rep.get(kind) or []:
            if kind == 'math' and x.get('id'):
                continue                                  # cards / done button: already compared as targets
            k = x.get('id') or x.get('cls') or '?'
            seen[k] = seen.get(k, 0) + 1
            out[(kind, k if seen[k] == 1 else '%s#%d' % (k, seen[k]))] = x
    return out


def drift(rot, fresh):
    A, B = pieces(rot), pieces(fresh)
    xywh = lambda r: (r['x'], r['y'], r['w'], r['h'])
    out = []
    for key in sorted(set(A) | set(B)):
        a, b = A.get(key), B.get(key)
        name = '%s %s' % ({'targets': 'target', 'actors': 'character', 'math': 'piece'}[key[0]], key[1])
        if a is None:
            out.append('%s not visible (fresh layout has it at %s)' % (name, xywh(b)))
        elif b is None:
            out.append('%s visible at %s (not in the fresh layout)' % (name, xywh(a)))
        else:
            d = math.hypot(a['x'] + a['w'] / 2 - b['x'] - b['w'] / 2, a['y'] + a['h'] / 2 - b['y'] - b['h'] / 2)
            if d > DRIFT_PX:
                out.append('%s at %s, fresh layout %s (%d px off)' % (name, xywh(a), xywh(b), d))
    return out


def report_drift(log, tag, rot, fresh):
    if not rot or not fresh:
        return
    d = drift(rot, fresh)
    if d:
        log.warn('%s: DRIFT %d piece(s) not where a fresh layout puts them: %s' % (tag, len(d), '; '.join(d[:8])))
    else:
        log.ok('%s: same layout as a fresh start in this orientation' % tag)


def ident(cur):
    """the question as generated, taken at its first live phase (an act may still fill in fields of st.q later)"""
    return json.dumps([cur.get('game'), cur.get('level'), cur.get('kind'), cur.get('q')], sort_keys=True)


def control(page, w, g, lv, snap, start, want, second=False, quick=False):
    """the same session started fresh in `start` from the same stored state -> report of the same question
    (the first one, or with second=True the second one after the first was answered the right way).
    quick=True: a normal-speed page plays the control in fast mode (the app reads window.__fast on every use)"""
    turn(page, start)
    page.evaluate('(s) => { Store.s = JSON.parse(s); }', snap)
    if quick:
        page.evaluate("() => { window.__rotSlow = !window.__fast; window.__fast = 1; }")
    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, SEED + lv])
    try:
        first = wait_phase(page, phases=LIVE, timeout=20000)
        if second:
            cur = answerable(page, timeout=20000)
            out, _ = drive_right(page, cur['gen'])
            if out != 'submitted':
                return None, 'first question not submitted (%s)' % out
            first = wait_phase(page, phases=LIVE, timeout=20000, gen=cur['gen'])
        if ident(first) != want:
            return None, 'the fresh start asked another question'
        answerable(page, timeout=20000)
        settle(page)
        return page.evaluate('window.__layoutReport()'), ''
    except Exception as e:
        return None, 'exception %s' % str(e)[:120]
    finally:
        go_home(page)
        if quick:
            page.evaluate("() => { if (window.__rotSlow) delete window.__fast; delete window.__rotSlow; }")


def go_home(page):
    try:
        page.mouse.up()
    except Exception:
        pass
    try:
        page.evaluate("gesture('home')")
        page.wait_for_timeout(80)
    except Exception:
        pass


def mid_drag(page, log, tag, shot, gen, to_o, dup=(), dup_name=''):
    """finger down on a draggable piece, halfway to its drop, the iPad turns to `to_o`, the finger lifts.
    Returns the layout report after the lift, or None (and does not turn) when the question has no draggable piece."""
    e0 = len(page.errors)
    s = page.evaluate("() => window.__next('right')")
    if s and s['g'] == 'drop':
        step = {'g': 'drop', 'p': s['p'], 'how': 'next'}
    else:
        step = page.evaluate(DRAG_JS, (s or {}).get('p', {}).get('id'))
    if not step:
        return None
    pid = step['p']['id']
    phys = page.evaluate('(s) => window.__physical(s)', {'g': step['g'], 'p': step['p']})
    if not phys or not phys.get('pts') or len(phys['pts']) < 2:
        log.warn('%s: __physical gave no stroke for %s' % (tag, step))
        return None
    phase0 = (q(page) or {}).get('phase')
    pts = phys['pts']
    off = page.evaluate(PRESS_JS, [pid, pts[0]])
    dx, dy = (off['dx'], off['dy']) if off and 'dx' in off else (0, 0)
    half = max(1, (len(pts) - 1) // 2)
    page.mouse.move(pts[0]['x'] + dx, pts[0]['y'] + dy)
    page.mouse.down()
    for pt in pts[1:half + 1]:
        page.mouse.move(pt['x'] + dx, pt['y'] + dy, steps=3)
    page.wait_for_timeout(40)
    fl = page.evaluate(INFLIGHT_JS)
    started = bool(fl and fl['id'] == pid and fl['moved'])
    what = '%s %s -> %s, phase %s' % (step['how'], pid, step['p']['to'], phase0)
    turn(page, to_o)                                     # the iPad turns while the finger is still down
    still = page.evaluate(INFLIGHT_JS)                   # the app must have dropped the gesture
    page.mouse.up()
    page.wait_for_timeout(200)
    page.mouse.move(1, 1)
    bad = []
    if not started:
        log.warn('%s [%s]: the drag did not start (in flight: %s; press point %s)' % (tag, what, fl, off))
    if still:
        bad.append('gesture still in flight after the rotation: %s' % still)
    # the relayout itself may put the piece off the stage; that already failed at `dup_name` - not a spring-back fault
    placed_out = any(d.startswith('outside stage: %s ' % pid) for d in dup)
    out_msgs = []
    pc = page.evaluate(PIECE_JS, pid)
    if pc.get('gone'):
        bad.append('dragged piece %s vanished' % pid)
    else:
        if 'translate' in pc['tf']:
            bad.append('dragged piece %s did not spring back (transform %s)' % (pid, pc['tf']))
        if pc['press']:
            bad.append('dragged piece %s still looks pressed' % pid)
        if pc['x'] < -2 or pc['y'] < -2 or pc['x'] + pc['w'] > pc['W'] + 2 or pc['y'] + pc['h'] > pc['H'] + 2:
            out_msgs.append('dragged piece %s outside the stage: %s' % (pid, (pc['x'], pc['y'], pc['w'], pc['h'])))
    rep = page.evaluate('window.__layoutReport()') or {'targets': [], 'W': 0, 'H': 0}
    t = next((t for t in rep['targets'] if t['id'] == pid), None)
    if t is None and not pc.get('gone'):
        bad.append('dragged piece %s is no longer a visible target' % pid)
    elif t and (t['x'] < -2 or t['y'] < -2 or t['x'] + t['w'] > rep['W'] + 2 or t['y'] + t['h'] > rep['H'] + 2):
        out_msgs.append('dragged piece %s outside the stage (layout report): %s' % (pid, (t['x'], t['y'], t['w'], t['h'])))
    if out_msgs and placed_out and 'translate' not in pc.get('tf', ''):
        log.warn('%s [%s]: sprang back to its relayout place, which is outside the stage (failed at %s)' % (tag, what, dup_name))
    else:
        bad += out_msgs
    cur = q(page)
    if not cur or cur['gen'] != gen or cur['submitted'] or cur['phase'] not in LIVE:
        bad.append('question no longer answerable after the lift: %s' % brief(cur))
    elif not page.evaluate("() => window.__next('right')"):
        bad.append('no next step after the lift (phase %s)' % cur['phase'])
    new = page.errors[e0:]
    if new:
        bad.append('page errors: %s' % new[:3])
    for b in bad:
        log.fail('%s [%s]: %s' % (tag, what, b))
    if bad:
        shoot(page, shot)
    elif started:
        log.ok('%s [%s]: gesture aborted, piece sprang back, still answerable' % (tag, what))
    return {'rep': gate(page, log, '%s (layout)' % tag, to_o, shot + '_layout', dup=dup, dup_name=dup_name)[1]}


def finish(page, log, tag, gen, shot):
    """finish the question the right way in the current orientation -> submitted, judged right, next question"""
    out, notes = drive_right(page, gen, timeout_s=20)
    if notes['off']:
        log.fail('%s: a step target lies outside the stage: %s' % (tag, notes['off']))
    if notes['refused']:
        log.warn('%s: steps not taken by the game: %s' % (tag, notes['refused'][:4]))
    if out != 'submitted':
        log.fail('%s: not submitted (%s) after steps %s %s' % (tag, out, notes['steps'][-6:], notes.get('stuck', '')))
        shoot(page, shot)
        return False
    try:
        wait_next_question(page, gen, timeout=20000)
    except Exception:
        log.fail('%s: submitted, but the next question never came (phase %s)' % (tag, (q(page) or {}).get('phase')))
        shoot(page, shot)
        return False
    nq = q(page)
    if not nq:
        log.fail('%s: the session ended instead of asking the next question' % tag)
        return False
    if nq.get('retest') or nq.get('err'):
        log.fail('%s: answered the right way after the rotation but judged wrong (next question is a retest, err=%s)' % (tag, nq.get('err')))
    else:
        log.ok('%s: submitted in %d steps, judged right, next question came' % (tag, len(notes['steps'])))
    return True


def run_session(page, log, eng, w, g, lv):
    name = '%s %s L%d' % (w, g, lv)
    shot = '%s_%s_L%d' % (eng, g, lv)
    before = len(page.errors)
    t0 = time.time()
    turn(page, 'land')
    snap = page.evaluate('() => JSON.stringify(Store.s)')     # the drift controls start from this very state
    R = {}                                                     # reports of the rotated states, for the drift check
    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, SEED + lv])
    try:
        # ---- q1, created in landscape
        try:
            R['q1'] = ident(wait_phase(page, phases=LIVE, timeout=20000))
            cur = answerable(page, timeout=20000)
        except Exception as e:
            log.fail('%s q1: never answerable in landscape (%s)' % (name, str(e)[:160]))
            return
        gen = cur['gen']
        if cur['level'] != lv:
            log.warn('%s q1: question level is %s' % (name, cur['level']))
        settle(page)
        rep0 = page.evaluate('window.__layoutReport()')
        base = set(check(rep0)) if rep0 else set()
        if base:
            log.warn('%s q1: landscape layout before any rotation already has problems: %s' % (name, sorted(base)))
        # 1. landscape -> portrait
        turn(page, 'port')
        p1, R['q1 land->port'] = gate(page, log, '%s q1 step1 land->port' % name, 'port', shot + '_q1_1port')
        # 2. back to landscape
        turn(page, 'land')
        _, rep2 = gate(page, log, '%s q1 step2 port->land' % name, 'land', shot + '_q1_2land', known=base)
        if DRIFT:
            report_drift(log, '%s q1 step2 port->land vs the landscape layout before any rotation' % name, rep2, rep0)
        cur = q(page)
        if not cur or cur['gen'] != gen or cur['submitted'] or cur['phase'] not in ('ready', 'input'):
            log.fail('%s q1: not answerable any more after two rotations: %s' % (name, brief(cur)))
            return
        # 3. mid-drag rotation to portrait (a question without a draggable piece just turns)
        tag = '%s q1 step3 mid-drag land->port' % name
        if mid_drag(page, log, tag, shot + '_q1_3drag', gen, 'port', dup=p1, dup_name='step1') is None:
            turn(page, 'port')
            gate(page, log, '%s q1 step3 land->port (no draggable piece: plain turn)' % name, 'port', shot + '_q1_3port', dup=p1, dup_name='step1')
        # 4. finish in portrait
        if not finish(page, log, '%s q1 step4 finish in portrait' % name, gen, shot + '_q1_4stuck'):
            return

        # ---- q2, created in portrait: the same the other way round
        cur2 = wait_phase(page, phases=LIVE, timeout=20000, gen=gen)
        gen2 = cur2['gen']
        R['q2'] = ident(cur2)
        n2 = '%s q2' % name
        act_drag = mid_drag(page, log, '%s act-phase mid-drag port->land' % n2, shot + '_q2_act', gen2, 'land') if cur2['phase'] == 'act' else None
        if act_drag:
            try:
                answerable(page, timeout=20000)          # the act goes on in landscape
            except Exception as e:
                log.fail('%s: never answerable after turning during the act (%s)' % (n2, str(e)[:160]))
                return
            settle(page)
            _, R['q2 port->land'] = gate(page, log, '%s answerable in landscape (turned during the act)' % n2, 'land', shot + '_q2_land')
        else:
            try:
                answerable(page, timeout=20000)
            except Exception as e:
                log.fail('%s: never answerable in portrait (%s)' % (n2, str(e)[:160]))
                return
            settle(page)
            gate(page, log, '%s fresh in portrait' % n2, 'port', shot + '_q2_port')
            md = mid_drag(page, log, '%s mid-drag port->land' % n2, shot + '_q2_drag', gen2, 'land')
            if md is None:
                turn(page, 'land')
                _, R['q2 port->land'] = gate(page, log, '%s port->land (no draggable piece: plain turn)' % n2, 'land', shot + '_q2_land')
            else:
                R['q2 port->land'] = md['rep']
        finish(page, log, '%s finish in landscape' % n2, gen2, shot + '_q2_stuck')
    except Exception as e:
        log.fail('%s: exception %s' % (name, str(e)[:300]))
    finally:
        go_home(page)
        # drift: the same questions laid out fresh in the orientation they were turned to
        if DRIFT and R.get('q1 land->port'):
            fresh, why = control(page, w, g, lv, snap, 'port', R['q1'])
            if fresh:
                report_drift(log, '%s q1 step1 land->port vs a fresh portrait start' % name, R['q1 land->port'], fresh)
            else:
                log.warn('%s q1: no drift control (%s)' % (name, why))
        if DRIFT and R.get('q2 port->land'):
            fresh, why = control(page, w, g, lv, snap, 'land', R['q2'], second=True)
            if fresh:
                report_drift(log, '%s q2 port->land vs a fresh landscape start' % name, R['q2 port->land'], fresh)
            else:
                log.warn('%s q2: no drift control (%s)' % (name, why))
        new = page.errors[before:]
        log.check(not new, '%s: zero console/page errors (%.1fs) %s' % (name, time.time() - t0, new[:3]))


def reveal_session(page, log, eng, w, g, lv):
    """step 5 (normal speed): the iPad turns 300 ms after the submit, while the answer is being revealed"""
    name = '%s %s L%d' % (w, g, lv)
    shot = '%s_%s_L%d_5reveal' % (eng, g, lv)
    before = len(page.errors)
    t0 = time.time()
    turn(page, 'land')
    snap = page.evaluate('() => JSON.stringify(Store.s)')
    R = {}
    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, SEED + lv])
    try:
        try:
            cur = answerable(page, timeout=45000, pause=250)
        except Exception as e:
            log.fail('%s step5 q1: never answerable (%s)' % (name, str(e)[:160]))
            return
        gen = cur['gen']
        settle(page)
        out, notes = drive_right(page, gen, timeout_s=45, pause_ms=300)
        if out != 'submitted':
            log.fail('%s step5 q1: not submitted (%s) after %s %s' % (name, out, notes['steps'][-6:], notes.get('stuck', '')))
            return
        page.wait_for_timeout(300)
        ph = (q(page) or {}).get('phase')
        turn(page, 'port')
        tag = '%s step5 turned to portrait 300ms after submit (phase %s)' % (name, ph)
        # R3-C03: the REVEAL frame itself after the turn - the answer cards, the task card and the done button were
        # re-laid for portrait (inside the stage), and the page does not scroll
        page.wait_for_timeout(250)
        rr = page.evaluate('window.__layoutReport()')
        if rr:
            W_, H_ = rr['W'], rr['H']
            outm = [(m.get('id') or m['cls'], m['x'], m['y'], m['w'], m['h']) for m in rr['math'] if m['cls'] in ('card', 'task', 'done') and (m['x'] < -2 or m['y'] < -2 or m['x'] + m['w'] > W_ + 2 or m['y'] + m['h'] > H_ + 2)]
            sc = rr['scroll']
            scroll = bool(sc['x'] or sc['y'] or sc['bw'] > sc['vw'] + 1 or sc['bh'] > sc['vh'] + 1)
            log.check(W_ < H_ and not outm and not scroll, '%s: the reveal frame is portrait, cards / task / done inside the stage, no scroll %s' % (tag, outm[:3]))
            if outm or scroll:
                shoot(page, shot + '_revealframe')
        try:
            wait_next_question(page, gen, timeout=45000)
        except Exception:
            log.fail('%s: the next question never came (phase %s)' % (tag, (q(page) or {}).get('phase')))
            shoot(page, shot + '_stuck')
            return
        nq = q(page)
        if not nq:
            log.fail('%s: the session ended instead of asking the next question' % tag)
            return
        if nq.get('retest') or nq.get('err'):
            log.fail('%s: the right answer was judged wrong (next question is a retest)' % tag)
        try:
            R['q2'] = ident(wait_phase(page, phases=LIVE, timeout=45000, gen=gen))
            answerable(page, gen=gen, timeout=45000, pause=250)
        except Exception as e:
            log.fail('%s: next question never answerable (%s)' % (tag, str(e)[:160]))
            return
        page.wait_for_timeout(250)
        settle(page, 4000)
        _, R['rep'] = gate(page, log, '%s -> q2' % tag, 'port', shot)
    except Exception as e:
        log.fail('%s step5: exception %s' % (name, str(e)[:300]))
    finally:
        go_home(page)
        if DRIFT and R.get('rep'):
            fresh, why = control(page, w, g, lv, snap, 'port', R['q2'], second=True, quick=True)
            if fresh:
                report_drift(log, '%s step5 q2 (created after the turn during the reveal) vs a fresh portrait start' % name, R['rep'], fresh)
            else:
                log.warn('%s step5: no drift control (%s)' % (name, why))
        new = page.errors[before:]
        log.check(not new, '%s step5: zero console/page errors (%.1fs) %s' % (name, time.time() - t0, new[:3]))


def main():
    results = []
    with sync_playwright() as p, serve() as base:
        for eng in ENGINES:
            suffix = ('_' + '-'.join(WORLDS)) if len(WORLDS) < 6 else ''
            suffix += ('_' + '-'.join(sorted(ONLY))) if ONLY else ''
            suffix += '_reveal' if not MAIN else ''
            log = Log('rotate_%s%s' % (eng, suffix))
            br = getattr(p, eng).launch()
            try:
                if MAIN:
                    page = new_page(br, base, *VIEW['land'], fast=True)
                    enter(page)
                    maxlv = page.evaluate('MAXLV')
                    for w in WORLDS:
                        games = page.evaluate("(w) => WORLDS[w].games.filter(g => GAMES[g])", w)
                        for g in games:
                            if ONLY and g not in ONLY:
                                continue
                            for lv in [2] + ([maxlv[w]] if maxlv[w] == 4 else []):
                                run_session(page, log, eng, w, g, lv)
                    page.context.close()
                if REVEAL:
                    page = new_page(br, base, *VIEW['land'], fast=False)
                    enter(page)
                    for w in WORLDS:
                        games = page.evaluate("(w) => WORLDS[w].games.filter(g => GAMES[g])", w)
                        pick = [g for g in games if (REVEAL_ALL or g == REVEAL_PICK.get(w)) and (not ONLY or g in ONLY)]
                        for g in pick:
                            reveal_session(page, log, eng, w, g, 2)
                    page.context.close()
            except Exception as e:
                log.fail('%s: harness exception %s' % (eng, str(e)[:300]))
            finally:
                br.close()
            results.append((eng, log.passes, log.fails, log.warns, log.path))
            log.close()
    print('\n==== rotation gate ====')
    for eng, ps, fs, ws, path in results:
        print('%-9s pass=%d fail=%d warn=%d   %s' % (eng, ps, fs, ws, path))
    sys.exit(0 if all(r[2] == 0 for r in results) else 1)


if __name__ == '__main__':
    main()
