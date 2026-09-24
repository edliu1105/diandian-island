# -*- coding: utf-8 -*-
"""Depth audit (what the child sees: nothing important is covered, the nearer thing is in front).

For every game, both orientations, the lowest and the highest level, at three moments of a question - when it becomes
playable (Hints.arm), when the answer cards appear (K.cards) and at the end of the reveal (Session.endQ) - every
element on the stage is classified and checked:
  note    numbers, badges, rings, flags, lines          -> must never be covered by anything (except the ghost hand)
  ui      answer cards, task card, buttons              -> must not be covered by the scene
  characters                                             -> the one standing lower (nearer) is not covered by a farther one
  counted things (targets, the question's own pictures)  -> never under a character, never under a card or the task card
usage: python tests/depth_audit.py [--shots]      (fast timings, ~2 min; --shots: real-timing screenshots of the cases)
out:   tests/logs/depth_audit.log
"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, wait_next_question, Log, ROOT

WORLDS = [('peppa', ['P1', 'P2', 'P3', 'P4'], 3), ('bluey', ['B1', 'B2', 'B3', 'B4'], 3), ('huluwa', ['H1', 'H2', 'H3', 'H4'], 4),
          ('paw', ['A1', 'A2', 'A3', 'A4'], 4), ('xiyou', ['X1', 'X2', 'X3', 'X4'], 4), ('avengers', ['V1', 'V2', 'V3', 'V4'], 4)]

AUDIT_JS = r"""() => {
  const cs = e => getComputedStyle(e);
  const stageR = Stage.el.getBoundingClientRect();
  const big = r => r.width * r.height > 0.45 * stageR.width * stageR.height;
  const invisible = e => { const s = cs(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.15) return true;
    const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return true;
    if (!e.children.length && !e.textContent.trim() && (s.backgroundColor === 'rgba(0, 0, 0, 0)' || s.backgroundColor === 'transparent') && s.backgroundImage === 'none' && s.borderStyle === 'none' && s.boxShadow === 'none') return true;
    return false; };
  const kind = e => {
    if (e.classList.contains('hand')) return 'hand';
    if (e.matches('.badge, .ringo, .flagb, .note') || (e.matches('svg.lines') && !e.classList.contains('scene'))) return 'note';
    if (e.matches('.card, .task, .done, .btn')) return 'ui';
    if (e._actorId) return 'actor';
    if (e.matches('svg.lines.scene')) return 'ground';
    if (e.querySelector('svg.d') && !e.querySelector('img') && !e.classList.contains('tgt')) return 'note';   /* an unmarked number label */
    return 'item';
  };
  const name = e => { if (e._actorId) return 'actor:' + e._actorId; const im = e.querySelector('img'); const c = (e.getAttribute('class') || '').trim();
    return (e.tagName.toLowerCase()) + (c ? '.' + c.split(/\s+/).join('.') : '') + (im && im.getAttribute('src') ? '[' + im.getAttribute('src').split('/').pop() + ']' : ''); };
  const kids = Array.from(Stage.el.children).map((e, i) => ({ e, i, k: kind(e), r: e.getBoundingClientRect(), z: (z => z === 'auto' ? 0 : +z)(cs(e).zIndex) }))
    .filter(o => o.k !== 'hand' && !invisible(o.e));
  const above = (a, b) => (a.z !== b.z ? a.z > b.z : a.i > b.i);                 /* a paints over b (same stacking context) */
  const shrink = (o, fx, fy) => { const r = o.r, dx = r.width * fx, dy = r.height * fy; return { l: r.left + dx, t: r.top + dy, r: r.right - dx, b: r.bottom - dy }; };
  const inner = o => (o.k === 'actor' || o.e.querySelector('img')) ? shrink(o, 0.14, 0.03) : shrink(o, 0.02, 0.02);
  const ov = (a, b) => { const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t); return w > 0 && h > 0 ? w * h : 0; };
  const area = r => Math.max(1, (r.r - r.l) * (r.b - r.t));
  const out = [];
  const math = o => o.k === 'item' && (o.e.classList.contains('tgt') || (Session.st && Session.st.els && Session.st.els.includes(o.e)));
  for (const n of kids.filter(o => o.k === 'note')) for (const o of kids) {
    if (o === n || o.k === 'note' || o.k === 'ground') continue;
    const a = ov(inner(n), inner(o)); if (a < 30 || a < 0.04 * area(inner(n))) continue;
    if (above(o, n)) out.push({ type: 'note-covered', note: name(n.e), by: name(o.e), zn: n.z, zb: o.z, frac: +(a / area(inner(n))).toFixed(2) });
  }
  for (const u of kids.filter(o => o.k === 'ui')) for (const o of kids) {
    if (o === u || o.k === 'ui' || o.k === 'note' || o.k === 'ground') continue;
    const a = ov(inner(u), inner(o)); if (a < 200) continue;
    if (above(o, u)) out.push({ type: 'ui-covered', ui: name(u.e), by: name(o.e), zu: u.z, zb: o.z, frac: +(a / area(inner(u))).toFixed(2) });
    else if (math(o) && a >= 0.1 * area(inner(o))) out.push({ type: 'math-under-ui', item: name(o.e), ui: name(u.e), frac: +(a / area(inner(o))).toFixed(2) });
  }
  const ch = kids.filter(o => o.k === 'actor');
  for (const A of ch) for (const B of ch) {
    if (A === B || !(A.r.bottom > B.r.bottom + 16) || !above(B, A)) continue;                   /* A nearer, B painted over A */
    const ia = inner(A), ib = inner(B), a = ov(ia, ib); if (a < 0.06 * Math.min(area(ia), area(ib))) continue;
    out.push({ type: 'depth', near: name(A.e), far: name(B.e), zn: A.z, zf: B.z, frac: +(a / Math.min(area(ia), area(ib))).toFixed(2) });
  }
  for (const A of ch) for (const M of kids.filter(math)) {
    const a = ov(inner(A), inner(M)); if (a < 0.2 * area(inner(M))) continue;
    if (above(A, M)) out.push({ type: 'math-under-character', item: name(M.e), by: name(A.e), frac: +(a / area(inner(M))).toFixed(2) });
  }
  return out;
}"""

HOOK_JS = """(audit) => {
  window.__aud = []; const A = new Function('return (' + audit + ')')();
  const rec = tag => { try { Stand.sort(); const st = Session.st; window.__aud.push({ tag, game: Session.G && Session.G.id, level: st && st.level, kind: st && st.kind, v: A() }); } catch (e) { window.__aud.push({ tag, err: String(e) }); } };
  const oa = Hints.arm; Hints.arm = function (st) { rec('arm'); return oa.apply(this, arguments); };
  const oc = K.cards; K.cards = function () { const r = oc.apply(this, arguments); rec('cards'); return r; };
  const oe = Session.endQ; Session.endQ = function (st) { rec('reveal-end'); return oe.apply(this, arguments); };
}"""


def main():
    log = Log('depth_audit')
    t0 = time.time()
    found = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch()
        for orient, (vw, vh) in (('L', (1180, 820)), ('P', (820, 1180))):
            page = new_page(br, base, vw, vh, fast=True)
            enter(page)
            page.evaluate(HOOK_JS, AUDIT_JS)
            for w, games, top in WORLDS:
                for g in games:
                    for lv in sorted({1, top}):
                        page.evaluate("window.__aud = []")
                        page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 7})", [w, g, lv])
                        try:
                            gen, snap = answer_question(page, 'right', timeout=20000)
                            wait_next_question(page, gen, timeout=20000)
                        except Exception as e:
                            log.warn('%s %s L%d: %s' % (orient, g, lv, str(e)[:100]))
                        aud = page.evaluate('window.__aud')
                        bad = [(a['tag'], v) for a in aud for v in a.get('v', [])]
                        seen = set()
                        for tag, v in bad:
                            key = json.dumps(v, sort_keys=True)
                            if key in seen:
                                continue
                            seen.add(key)
                            found.append((orient, g, lv, tag, v))
                        log.check(not bad, '%s %s L%d: nothing important covered, nearer in front %s' % (orient, g, lv, '' if not bad else '(%d)' % len(seen)))
                        page.evaluate("gesture('home')")
                        page.wait_for_timeout(60)
            log.check(not page.errors, '%s zero page errors %s' % (orient, page.errors[:2]))
            page.context.close()
        br.close()
    for f in found:
        log.w('CASE %s %s L%d @%s %s' % (f[0], f[1], f[2], f[3], json.dumps(f[4], ensure_ascii=False)))
    log.w('total %.1f min, %d cases' % ((time.time() - t0) / 60, len(found)))
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
