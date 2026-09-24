# -*- coding: utf-8 -*-
"""Real-run screenshots for review round R3 (WebKit, real timings, real speech path) + labelled contact sheets.

landscape 1180x820: entry, first map, island panel, parent gate (real long press), parent panel, a map with progress
  (two worlds passed, story chapters, third world just opened), no-speech-engine state (map + in game),
  a wrong answer's correction (B3 hands-on pairing, H3 counting on, P2), the finale,
  every game at level 2 (ready + reveal) and every game at its top level (ready)
portrait 820x1180: map, island panel, every game at level 2 (ready + reveal)
usage: python tests/shots_r3.py [engine] [--only-sheets] [--games=H3,A4]
out:   shots/R3/raw/*.png, shots/R3/R3_*.jpg (contact sheets)
"""
import os, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, wait_phase, step, q, set_state, ROOT

ENGINE = next((a for a in sys.argv[1:] if not a.startswith('--')), 'webkit')
OUT = os.path.join(ROOT, 'shots', 'R3')
RAW = os.path.join(OUT, 'raw')
os.makedirs(RAW, exist_ok=True)
WORLDS = [('peppa', ['P1', 'P2', 'P3', 'P4'], 3), ('bluey', ['B1', 'B2', 'B3', 'B4'], 3), ('huluwa', ['H1', 'H2', 'H3', 'H4'], 4),
          ('paw', ['A1', 'A2', 'A3', 'A4'], 4), ('xiyou', ['X1', 'X2', 'X3', 'X4'], 4), ('avengers', ['V1', 'V2', 'V3', 'V4'], 4)]
errs_all = []


def shot(page, name):
    page.screenshot(path=os.path.join(RAW, name + '.png'))


def go(page, w, g, lv, seed=99):
    page.evaluate("([w,g,l,s]) => window.__go(w, g, Number(l), {noDemo: true, seed: s})", [w, g, lv, seed])
    wait_phase(page, timeout=30000)


def to_ready(page):
    """do the preliminary act the right way until the question asks for its answer"""
    for i in range(14):
        cur = q(page)
        if cur and cur['phase'] in ('ready', 'input') and not cur.get('submitted'):
            return
        if cur and cur['phase'] == 'act':
            step(page, 'right')
        page.wait_for_timeout(650)


def finish(page, strategy='right'):
    for i in range(24):
        cur = q(page)
        if not cur or cur['submitted']:
            return
        if cur['phase'] not in ('act', 'ready', 'input'):
            page.wait_for_timeout(300)
            continue
        step(page, strategy)
        page.wait_for_timeout(420)


def home(page):
    page.evaluate("gesture('home')")
    page.wait_for_timeout(900)


def shoot_game(page, w, g, lv, tag, reveal=True):
    go(page, w, g, lv)
    to_ready(page)
    page.wait_for_timeout(1500)
    shot(page, tag + '_ready')
    if reveal:
        finish(page)
        # the settled reveal: the praise phase starts when the question's own reveal has finished
        try:
            page.wait_for_function("() => { const q = window.__q; return !q || q.phase === 'praise'; }", timeout=20000, polling=50)
        except Exception:
            pass
        page.wait_for_timeout(350)
        shot(page, tag + '_reveal')
    home(page)


def correction(page, w, g, lv, tag, after_ms, pair_taps=0):
    go(page, w, g, lv, seed=7)
    to_ready(page)
    finish(page, 'wrong')
    try:
        page.wait_for_function("() => { const q = window.__q; return q && ['correcting','pairing'].includes(q.phase); }", timeout=8000, polling=50)
    except Exception:
        pass
    for k in range(pair_taps):            # B3: the child pairs by hand - two pairs done, the third block glows
        try:
            page.wait_for_function("() => !!window.__next('right')", timeout=6000, polling=50)
            step(page, 'right')
        except Exception:
            pass
        page.wait_for_timeout(500)
    page.wait_for_timeout(after_ms)
    shot(page, tag)
    home(page)


def capture():
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        # ---------------------------------------------------------------- landscape shell
        page = new_page(br, base, 1180, 820, fast=False, sw='block')
        page.wait_for_timeout(900)
        shot(page, 'L_00_entry')
        enter(page)
        page.wait_for_timeout(2600)
        shot(page, 'L_01_map_first')
        page.evaluate("MapView.tapIsland('peppa')")
        page.wait_for_timeout(1400)
        shot(page, 'L_02_panel_peppa')
        page.evaluate("MapView.closePanel(true)")
        page.wait_for_timeout(400)
        gb = page.locator('#gear').bounding_box()
        page.mouse.move(gb['x'] + gb['width'] / 2, gb['y'] + gb['height'] / 2)
        page.mouse.down()
        page.wait_for_timeout(1900)
        page.mouse.up()
        page.wait_for_timeout(600)
        shot(page, 'L_03_parent_gate')
        page.evaluate("Parent.panel()")
        page.wait_for_timeout(500)
        shot(page, 'L_04_parent_panel')
        page.evaluate("Parent.close()")
        # ---------------------------------------------------------------- every game, level 2 and top level
        for w, games, top in WORLDS:
            for g in games:
                shoot_game(page, w, g, 2, 'L_%s_L2' % g)
        for w, games, top in WORLDS:
            for g in games:
                shoot_game(page, w, g, top, 'L_%s_L%d' % (g, top), reveal=False)
        # ---------------------------------------------------------------- corrections after a wrong answer
        correction(page, 'bluey', 'B3', 2, 'L_fix_B3_pairing', 400, pair_taps=2)
        correction(page, 'huluwa', 'H3', 2, 'L_fix_H3_counton', 3200)
        correction(page, 'peppa', 'P2', 2, 'L_fix_P2_onebyone', 3000)
        errs_all.extend(page.errors)
        page.context.close()
        # ---------------------------------------------------------------- a map with progress + the finale
        page = new_page(br, base, 1180, 820, fast=False, sw='block')
        set_state(page, """
          const W = s.worlds;
          Object.assign(W.peppa, { cleared: true, stars: 24, visits: 11, story: 3, sessions: 9, level: 3 });
          Object.assign(W.bluey, { cleared: true, stars: 19, visits: 6, story: 2, sessions: 7, level: 3 });
          Object.assign(W.huluwa, { unlocked: true, stars: 4, visits: 3, story: 1, sessions: 2, level: 1 });
        """)
        enter(page)
        page.wait_for_timeout(3200)
        shot(page, 'L_05_map_progress')
        page.evaluate("Finale.play()")
        page.wait_for_timeout(3500)
        shot(page, 'L_06_finale_a')
        page.wait_for_timeout(5000)
        shot(page, 'L_07_finale_b')
        errs_all.extend(page.errors)
        page.context.close()
        # ---------------------------------------------------------------- no speech engine at all
        page = new_page(br, base, 1180, 820, fast=False, no_speech=True, sw='block')
        enter(page)
        page.wait_for_timeout(5000)
        shot(page, 'L_08_nospeech_map')
        go(page, 'peppa', 'P1', 1)
        page.wait_for_timeout(2500)
        shot(page, 'L_09_nospeech_game')
        home(page)
        page.context.close()
        # ---------------------------------------------------------------- portrait
        page = new_page(br, base, 820, 1180, fast=False, sw='block')
        enter(page)
        page.wait_for_timeout(2600)
        shot(page, 'P_00_map')
        page.evaluate("MapView.tapIsland('bluey')")
        page.wait_for_timeout(1400)
        shot(page, 'P_01_panel_bluey')
        page.evaluate("MapView.closePanel(true)")
        for w, games, top in WORLDS:
            for g in games:
                shoot_game(page, w, g, 2, 'P_%s_L2' % g)
        errs_all.extend(page.errors)
        page.context.close()
        br.close()
    print('page errors:', errs_all)


# ------------------------------------------------------------------ contact sheets
def sheets():
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 26)

    def sheet(name, files, cols, scale):
        ims = [(f, Image.open(os.path.join(RAW, f + '.png')).convert('RGB')) for f in files if os.path.exists(os.path.join(RAW, f + '.png'))]
        if not ims:
            return
        w = max(int(i.width * scale) for _, i in ims)
        h = max(int(i.height * scale) for _, i in ims)
        lab = 40
        rows = (len(ims) + cols - 1) // cols
        S = Image.new('RGB', (cols * w + (cols + 1) * 12, rows * (h + lab) + (rows + 1) * 12), (250, 246, 238))
        d = ImageDraw.Draw(S)
        for k, (f, im) in enumerate(ims):
            r, c = divmod(k, cols)
            x, y = 12 + c * (w + 12), 12 + r * (h + lab + 12)
            t = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
            S.paste(t, (x, y + lab))
            d.rectangle([x, y + lab, x + t.width - 1, y + lab + t.height - 1], outline=(43, 33, 24), width=2)
            d.text((x + 4, y + 6), f + '.png', fill=(43, 33, 24), font=font)
        S.save(os.path.join(OUT, name + '.jpg'), quality=86)
        print('sheet', name, S.size)

    sheet('R3_01_shell_landscape', ['L_00_entry', 'L_01_map_first', 'L_02_panel_peppa', 'L_03_parent_gate', 'L_04_parent_panel', 'L_05_map_progress'], 3, 0.5)
    sheet('R3_02_states', ['L_08_nospeech_map', 'L_09_nospeech_game', 'L_06_finale_a', 'L_07_finale_b', 'L_fix_B3_pairing', 'L_fix_H3_counton', 'L_fix_P2_onebyone'], 4, 0.5)
    for k, (w, games, top) in enumerate(WORLDS):
        files = []
        for g in games:
            files += ['L_%s_L2_ready' % g, 'L_%s_L2_reveal' % g]
        sheet('R3_%02d_%s_landscape_L2' % (3 + k, w), files, 4, 0.5)
    tops = []
    for w, games, top in WORLDS:
        tops += ['L_%s_L%d_ready' % (g, top) for g in games]
    for k in range(3):
        sheet('R3_%02d_top_levels_%d' % (9 + k, k + 1), tops[k * 8:(k + 1) * 8], 4, 0.5)
    sheet('R3_12_portrait_shell', ['P_00_map', 'P_01_panel_bluey'], 2, 0.5)
    allp = []
    for w, games, top in WORLDS:
        for g in games:
            allp += ['P_%s_L2_ready' % g, 'P_%s_L2_reveal' % g]
    for k in range(4):
        sheet('R3_%02d_portrait_L2_%d' % (13 + k, k + 1), allp[k * 12:(k + 1) * 12], 6, 0.36)


def reshoot(games):
    """re-shoot only these games (landscape L2 + top level, portrait L2) after a fix, then rebuild the sheets"""
    from playwright.sync_api import sync_playwright
    W = {g: (w, top) for w, gs, top in WORLDS for g in gs}
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        for tag, (vw, vh) in (('L', (1180, 820)), ('P', (820, 1180))):
            page = new_page(br, base, vw, vh, fast=False, sw='block')
            enter(page)
            page.wait_for_timeout(800)
            for g in games:
                w, top = W[g]
                shoot_game(page, w, g, 2, '%s_%s_L2' % (tag, g))
                if tag == 'L':
                    shoot_game(page, w, g, top, 'L_%s_L%d' % (g, top), reveal=False)
            errs_all.extend(page.errors)
            page.context.close()
        br.close()
    print('page errors:', errs_all)


if __name__ == '__main__':
    only = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--games=')), None)
    if only:
        reshoot(only.split(','))
    elif '--only-sheets' not in sys.argv:
        capture()
    sheets()
