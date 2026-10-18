# -*- coding: utf-8 -*-
"""积木城 screenshots to look at by eye (docs/W5-DESIGN.md §9.8): the block-town map at 1180 x 820, 820 x 1180 and 1024 x 768
(佩奇·积木屋 flagged, Bluey·积木院 open, the islands not live as clouds, the gate, the block castle), the castle party, and
every game with a rule (or W5_ONLY) - the question, then the explanation after a wrong answer - landscape and portrait.
One contact sheet: tests/logs/w5_shots.png (single shots in tests/logs/w5_shots/).
usage: python tests/shots_w5.py        W5_ONLY=P8 for some games; W5_SHOTS=map for the map only"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs', 'w5_shots')
os.makedirs(OUT, exist_ok=True)


def main():
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, wait_phase, answer_question
    shots = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch()
        for vw, vh in ((1180, 820), (820, 1180), (1024, 768)):
            page = new_page(br, base, vw, vh, fast=True, extra_init='window.__live5 = %s;' % json.dumps(['peppa5', 'bluey5']))
            page.evaluate("""() => { LIVE().concat(ORDER2).forEach(w => { const ws = Store.w(w); ws.unlocked = true; ws.pass = true; WORLDS[w].games.forEach(g => { (ws.gstars = ws.gstars || {})[g] = 5; }); });
              const p5 = Store.w('peppa5'); p5.unlocked = true; WORLDS.peppa5.games.forEach(g => { (p5.gstars = p5.gstars || {})[g] = 5; }); p5.stars = 23;
              Object.assign(Store.s, { flags: LIVE().concat(ORDER2, ['peppa5']), gateShown: true, w2seen: true, fin2: 'seen', gate5: true, w5seen: true, mapSet: 5 }); Store.save(); }""")
            page.reload(); page.wait_for_function('window.__ready === true', timeout=20000); enter(page)
            page.wait_for_timeout(4000)
            f = os.path.join(OUT, 'map_%dx%d.png' % (vw, vh)); page.screenshot(path=f); shots.append((f, 'map %dx%d' % (vw, vh)))
            if vw == 1180:
                page.evaluate("MapView.tapIsland('peppa5')"); page.wait_for_timeout(1200)
                f = os.path.join(OUT, 'panel.png'); page.screenshot(path=f); shots.append((f, 'island panel'))
                page.evaluate("MapView.closePanel(true); Finale.play('blocks')"); page.wait_for_timeout(1500)
                f = os.path.join(OUT, 'finale.png'); page.screenshot(path=f); shots.append((f, 'party'))
            page.context.close()
        if os.environ.get('W5_SHOTS') != 'map':
            page = new_page(br, base, 1180, 820, fast=True); enter(page)
            page.evaluate("() => W3.load()"); page.wait_for_timeout(800)
            ids = page.evaluate("() => ORDER5.flatMap(w => WORLDS[w].games.filter(g => !!W5R[g]).map(g => [w, g]))")
            page.context.close()
            only = os.environ.get('W5_ONLY')
            if only: ids = [x for x in ids if x[1] in only.split(',')]
            for vw, vh in ((1180, 820), (820, 1180)):
                page = new_page(br, base, vw, vh, fast=True); enter(page); page.evaluate("() => W3.load()"); page.wait_for_timeout(800)
                page.evaluate("window.__xhold = 0")
                for w, g in ids:
                    for lv in ((1, 3, 5) if vw == 1180 else (3,)):
                        page.evaluate("([w,g,l]) => { (Store.w(w).gstars || {})[g] = 0; window.__go(w, g, l, {noDemo: true, seed: 5}); }", [w, g, lv])
                        try:
                            wait_phase(page, timeout=20000); page.wait_for_timeout(500)
                            f = os.path.join(OUT, '%s_L%d_%dx%d_q.png' % (g, lv, vw, vh)); page.screenshot(path=f); shots.append((f, '%s L%d %s' % (g, lv, 'land' if vw > vh else 'port')))
                            page.evaluate("() => { Store.s.settings.explain = 'step'; }")
                            answer_question(page, 'wrong', timeout=20000)
                            page.wait_for_function("!!document.getElementById('stepnext')", timeout=20000)
                            for _ in range(3):         # the last step: blue and gold rings on the stage
                                page.wait_for_timeout(400)
                                r = page.evaluate("(() => { const b = document.getElementById('stepnext'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
                                if not r: break
                                if page.evaluate("document.querySelectorAll('#stage > .ringo').length") >= 2: break
                                page.mouse.click(r[0], r[1])
                            page.wait_for_timeout(500)
                            f = os.path.join(OUT, '%s_L%d_%dx%d_x.png' % (g, lv, vw, vh)); page.screenshot(path=f); shots.append((f, '%s L%d explain' % (g, lv)))
                        except Exception as e:
                            print('shot failed', g, lv, str(e)[:120])
                        page.evaluate("() => { Store.s.settings.explain = 'auto'; gesture('home'); }"); page.wait_for_timeout(200)
                page.context.close()
        br.close()
    cols, W = 4, 420
    tiles = []
    for f, label in shots:
        im = Image.open(f).convert('RGB'); im.thumbnail((W, W)); tiles.append((im, label))
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (W + 10), rows * (W + 30)), (255, 255, 255)); d = ImageDraw.Draw(sheet)
    for i, (im, label) in enumerate(tiles):
        x, y = (i % cols) * (W + 10), (i // cols) * (W + 30)
        sheet.paste(im, (x, y)); d.text((x + 4, y + im.height + 4), label, fill=(0, 0, 0))
    out = os.path.join(os.path.dirname(OUT), 'w5_shots.png'); sheet.save(out)
    print('sheet', out, len(tiles))


if __name__ == '__main__':
    main()
