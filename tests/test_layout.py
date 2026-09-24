# -*- coding: utf-8 -*-
"""Layout gate: every game x level x orientation, the answerable state of two questions.

checks (stage px; the stage is scaled >= 1 on every iPad, so stage px >= CSS px):
  - no page scroll; every target and math piece fully inside the stage
  - tap targets >= 88 x 88; gaps between targets >= 20
  - nothing interactive or mathematical under the HUD (home / avatar / tray)
  - characters are not cut by the stage edge (except when parked fully outside)
  - characters do not cover targets / math pieces; math pieces do not cover each other
usage: python tests/test_layout.py [chromium|webkit] [worlds] [land,port]
writes tests/logs/layout_<engine>.log and screenshots of failing states to shots/layout/
"""
import os, sys, time, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question, Log, ROOT

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
WORLDS = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else ['peppa', 'bluey', 'huluwa', 'paw', 'xiyou', 'avengers']
ORIENTS = sys.argv[3].split(',') if len(sys.argv) > 3 else ['land', 'port']
MAXLV = {'peppa': 3, 'bluey': 3, 'huluwa': 4, 'paw': 4, 'xiyou': 4, 'avengers': 4}
VIEW = {'land': (1180, 820), 'port': (820, 1180)}
SHOTS = os.path.join(ROOT, 'shots', 'layout')
os.makedirs(SHOTS, exist_ok=True)


def inter(a, b):
    x0, y0 = max(a['x'], b['x']), max(a['y'], b['y'])
    x1, y1 = min(a['x'] + a['w'], b['x'] + b['w']), min(a['y'] + a['h'], b['y'] + b['h'])
    return max(0, x1 - x0) * max(0, y1 - y0)


def gap(a, b):
    dx = max(b['x'] - (a['x'] + a['w']), a['x'] - (b['x'] + b['w']), 0)
    dy = max(b['y'] - (a['y'] + a['h']), a['y'] - (b['y'] + b['h']), 0)
    return max(dx, dy) if (dx == 0 or dy == 0) else (dx * dx + dy * dy) ** 0.5


def core(a):
    """a sticker's bounding box has air around arms and heads: judge on the core"""
    return {'x': a['x'] + a['w'] * 0.14, 'y': a['y'] + a['h'] * 0.08, 'w': a['w'] * 0.72, 'h': a['h'] * 0.9}


def check(rep):
    bad = []
    W, H = rep['W'], rep['H']
    sc = rep['scroll']
    if sc['x'] or sc['y'] or sc['bw'] > sc['vw'] + 1 or sc['bh'] > sc['vh'] + 1:
        bad.append('page scrolls %s' % sc)
    T = rep['targets']
    for t in T + rep['math']:
        if t['x'] < -2 or t['y'] < -2 or t['x'] + t['w'] > W + 2 or t['y'] + t['h'] > H + 2:
            bad.append('outside stage: %s %s' % (t.get('id') or t.get('cls'), (t['x'], t['y'], t['w'], t['h'])))
    for t in T:
        s = t.get('slop') or {'l': 0, 'r': 0, 't': 0, 'b': 0}
        hw, hh = t['w'] + s['l'] + s['r'], t['h'] + s['t'] + s['b']      # the real hit area (box + hit slop)
        if hw < 88 or hh < 88:
            bad.append('target < 88: %s %dx%d (hit %dx%d)' % (t['id'], t['w'], t['h'], hw, hh))
    for i in range(len(T)):
        for j in range(i + 1, len(T)):
            g = gap(T[i], T[j])
            if g < 20:
                bad.append('targets closer than 20: %s ~ %s (%s)' % (T[i]['id'], T[j]['id'], round(g, 1)))
    for hd in rep['hud']:
        hz = {'x': hd['x'] - 10, 'y': hd['y'] - 10, 'w': hd['w'] + 20, 'h': hd['h'] + 20}
        for t in T + rep['math']:
            if inter(hz, t) > 0:
                bad.append('under HUD %s: %s' % (hd['id'], t.get('id') or t.get('cls')))
    for a in rep['actors']:
        inside = inter(a, {'x': 0, 'y': 0, 'w': W, 'h': H})
        area = a['w'] * a['h']
        if 0 < inside < area * 0.94:
            bad.append('character cut by edge: %s (%d%% visible)' % (a['id'], 100 * inside / area))
    # what the finger really hits: a target must own >= 78% of its sample points (characters/other pieces on top = covered)
    for t in T:
        for c in t.get('covered', []):
            if c['part'] >= 22:
                bad.append('%s covered by %s (%d%%)' % (t['id'], c['by'], c['part']))
    # a character hidden behind pieces the child works with (more than a quarter of its core)
    for a in rep['actors']:
        for h in a.get('hidden', []):
            if h["part"] > 30:
                bad.append('character %s hidden behind %s (%d%%)' % (a['id'], h['by'], h['part']))
    # characters must not sit on top of the non-interactive math pieces (task card, badges): rect test on the sticker core
    for a in rep['actors']:
        if a['math']:
            continue
        c = core(a)
        for t in rep['math']:
            if t.get('id'):
                continue
            ov = inter(c, t)
            if ov > 0.15 * min(c['w'] * c['h'], t['w'] * t['h']):
                bad.append('character %s over %s' % (a['id'], t.get('cls')))
    M = [m for m in rep['math'] if m['cls'] in ('card', 'task', 'done')]
    for i in range(len(M)):
        for j in range(i + 1, len(M)):
            if inter(M[i], M[j]) > 0:
                bad.append('math pieces overlap: %s ~ %s' % (M[i].get('id') or M[i]['cls'], M[j].get('id') or M[j]['cls']))
    return bad


def main():
    log = Log('layout_%s_%s' % (ENGINE, '-'.join(ORIENTS)))
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        for o in ORIENTS:
            vw, vh = VIEW[o]
            page = new_page(br, base, vw, vh, fast=True)
            enter(page)
            for w in WORLDS:
                games = page.evaluate("(w) => WORLDS[w].games.filter(g => GAMES[g])", w)
                for g in games:
                    for lv in range(1, MAXLV[w] + 1):
                        page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 4321 + l})", [w, g, lv])
                        last = None
                        for qi in range(2):
                            try:
                                wait_phase(page, phases=('act', 'ready', 'input'), timeout=20000, gen=last)
                                for _ in range(12):      # a preliminary act (jump, open, gather...) is done the right way first
                                    cur = page.evaluate('window.__q')
                                    if cur and cur['phase'] in ('ready', 'input'):
                                        break
                                    if cur and cur['phase'] == 'act':
                                        page.evaluate("(() => { const s = window.__next('right'); if (s) window.__gesture(s.g, s.p); })()")
                                    page.wait_for_timeout(120)
                                wait_phase(page, phases=('ready', 'input'), timeout=20000, gen=last)
                            except Exception as e:
                                log.fail('%s %s %s L%d q%d: never answerable (%s)' % (o, w, g, lv, qi + 1, str(e)[:80]))
                                break
                            page.wait_for_timeout(60)
                            rep = page.evaluate('window.__layoutReport()')
                            bad = check(rep) if rep else ['no report']
                            tag = '%s %s L%d q%d [%s]' % (o, g, lv, qi + 1, rep and rep.get('kind'))
                            if bad:
                                for b in sorted(set(bad)):
                                    log.fail('%s: %s' % (tag, b))
                                page.screenshot(path=os.path.join(SHOTS, '%s_%s_L%d_q%d.png' % (o, g, lv, qi + 1)))
                            else:
                                log.ok(tag)
                            try:
                                gen, snap = answer_question(page, 'right')
                                last = gen
                                wait_next_question(page, gen, timeout=20000)
                            except Exception as e:
                                break
                        page.evaluate("gesture('home')")
                        page.wait_for_timeout(50)
            errs = page.errors
            log.check(not errs, '%s: zero console/page errors %s' % (o, errs[:3]))
            page.context.close()
        br.close()
    ok = log.close()
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
