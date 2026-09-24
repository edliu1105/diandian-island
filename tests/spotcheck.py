# -*- coding: utf-8 -*-
"""Spot check (client's standard after R3: random screenshots + spot-checked interactions, ~1/10 of the full gate).
Budget: about 10-15 minutes wall clock. A new random sample every run (the seed is printed so a run can be repeated).

 1. every game once (WebKit, fast timings): 24 games, each at a random level, one question answered right through
    the app's own step - judged right, zero page / console errors                                 (~2 min)
 2. real fingers, sampled (WebKit): one random game per world at a random level, answered with REAL pointer strokes
    (mouse down / move / up at screen pixels); the parent gear's long press opens the adult gate; the home button
    brings the child back to the map                                                               (~3 min)
 3. random screenshots (WebKit, real timings): 8 random game / level / orientation picks, question + reveal, on a
    contact sheet for a human look (clipping, overlaps, readability)                               (~5 min)
 4. offline, sampled (Chromium): first visit precaches every asset, offline reload, one question   (~1 min)
usage: python tests/spotcheck.py [seed]
out:   tests/logs/spotcheck.log, shots/spot/spot_<seed>.jpg
"""
import os, sys, time, random, re
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, wait_phase, q, step, answer_question, wait_next_question, Log, ROOT, SPEECH_INIT

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else int(time.time()) % 100000
R = random.Random(SEED)
WORLDS = [('peppa', ['P1', 'P2', 'P3', 'P4'], 3), ('bluey', ['B1', 'B2', 'B3', 'B4'], 3), ('huluwa', ['H1', 'H2', 'H3', 'H4'], 4),
          ('paw', ['A1', 'A2', 'A3', 'A4'], 4), ('xiyou', ['X1', 'X2', 'X3', 'X4'], 4), ('avengers', ['V1', 'V2', 'V3', 'V4'], 4)]
SHOTS = os.path.join(ROOT, 'shots', 'spot')
os.makedirs(SHOTS, exist_ok=True)


def stroke(page, ph):
    pts = ph['pts']
    m = page.mouse
    m.move(pts[0]['x'], pts[0]['y'])
    m.down()
    for p in pts[1:]:
        m.move(p['x'], p['y'], steps=2)
        page.wait_for_timeout(16)
    if ph.get('hold'):
        page.wait_for_timeout(int(ph['hold']))
    m.up()


def real_answer(page, gen, limit=40):
    """answer the current question with real pointer strokes built by __physical from the right steps"""
    for _ in range(limit):
        cur = q(page)
        if not cur or cur['gen'] != gen or cur['submitted']:
            return cur
        if cur['phase'] not in ('act', 'ready', 'input'):
            page.wait_for_timeout(120)
            continue
        s = page.evaluate("window.__next('right')")
        if not s:
            page.wait_for_timeout(120)
            continue
        ph = page.evaluate("(s) => window.__physical(s)", {'g': s['g'], 'p': s['p']})
        if not ph:
            return None
        stroke(page, ph)
        page.wait_for_timeout(260)
    return q(page)


def main():
    log = Log('spotcheck')
    log.w('seed %d' % SEED)
    t_all = time.time()
    with sync_playwright() as p, serve() as base:
        wk = p.webkit.launch()
        # ---------------------------------------------------------------- 1. every game once, random level
        t0 = time.time()
        page = new_page(wk, base, 1180, 820, fast=True)
        enter(page)
        for w, games, top in WORLDS:
            for g in games:
                lv = R.randint(1, top)
                before = len(page.errors)
                page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, R.randint(1, 9999)])
                try:
                    gen, snap = answer_question(page, 'right', timeout=20000)
                    wait_next_question(page, gen, timeout=20000)
                    nq = q(page)
                    ok = snap and snap.get('submitted') and not (nq and (nq.get('retest') or nq.get('err')))
                    log.check(ok and not page.errors[before:], '1 %s L%d: one question answered right, judged right, no error %s' % (g, lv, page.errors[before:][:1]))
                except Exception as e:
                    log.fail('1 %s L%d: %s' % (g, lv, str(e)[:120]))
                page.evaluate("gesture('home')")
                page.wait_for_timeout(120)
        page.context.close()
        log.w('part 1: %.0f s' % (time.time() - t0))

        # ---------------------------------------------------------------- 2. real fingers, one random game per world
        t0 = time.time()
        page = new_page(wk, base, 1180, 820, fast=True)
        enter(page)
        for w, games, top in WORLDS:
            g, lv = R.choice(games), R.randint(1, top)
            before = len(page.errors)
            page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, R.randint(1, 9999)])
            try:
                st = wait_phase(page, timeout=20000)
                gen = st['gen']
                cur = real_answer(page, gen)
                page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g; }", arg=gen, timeout=20000)
                nq = q(page)
                log.check(cur is not None and not (nq and (nq.get('retest') or nq.get('err'))) and not page.errors[before:], '2 %s L%d: answered with real pointer strokes, judged right %s' % (g, lv, page.errors[before:][:1]))
            except Exception as e:
                log.fail('2 %s L%d real input: %s' % (g, lv, str(e)[:120]))
            # the home button with a real click
            hb = page.locator('#home').bounding_box()
            if hb:
                page.mouse.click(hb['x'] + hb['width'] / 2, hb['y'] + hb['height'] / 2)
            try:
                page.wait_for_function("document.querySelector('#map').classList.contains('on') && !Session.G", timeout=5000)
                log.ok('2 %s: the home button (real click) brings the child back to the map' % g)
            except Exception:
                log.fail('2 %s: the home button did not return to the map' % g)
                page.evaluate("gesture('home')")
        gb = page.locator('#gear').bounding_box()
        page.mouse.move(gb['x'] + gb['width'] / 2, gb['y'] + gb['height'] / 2)
        page.mouse.down(); page.wait_for_timeout(1800); page.mouse.up()
        page.wait_for_timeout(300)
        log.check(page.evaluate("document.querySelector('#parent').classList.contains('on')"), '2 parent gear: a real 1.8 s long press opens the adult gate')
        page.evaluate("Parent.close()")
        page.mouse.click(gb['x'] + gb['width'] / 2, gb['y'] + gb['height'] / 2)
        page.wait_for_timeout(300)
        log.check(not page.evaluate("document.querySelector('#parent').classList.contains('on')"), '2 parent gear: a short tap does NOT open the gate (child-proof)')
        log.check(not page.errors, '2 zero page / console errors %s' % page.errors[:2])
        page.context.close()
        log.w('part 2: %.0f s' % (time.time() - t0))

        # ---------------------------------------------------------------- 3. random screenshots (real timings)
        t0 = time.time()
        picks = []
        allg = [(w, g, top) for w, games, top in WORLDS for g in games]
        for w, g, top in R.sample(allg, 8):
            picks.append((w, g, R.randint(1, top), R.choice(['L', 'P'])))
        files = []
        for orient in ('L', 'P'):
            sel = [x for x in picks if x[3] == orient]
            if not sel:
                continue
            vw, vh = (1180, 820) if orient == 'L' else (820, 1180)
            page = new_page(wk, base, vw, vh, fast=False, sw='block')
            enter(page); page.wait_for_timeout(700)
            for w, g, lv, _ in sel:
                page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, R.randint(1, 9999)])
                try:
                    wait_phase(page, timeout=30000)
                    for i in range(14):                      # the preliminary act the right way
                        cur = q(page)
                        if cur and cur['phase'] in ('ready', 'input'):
                            break
                        if cur and cur['phase'] == 'act':
                            step(page, 'right')
                        page.wait_for_timeout(600)
                    page.wait_for_timeout(1200)
                    f1 = os.path.join(SHOTS, '%s_%s_L%d_ready.png' % (orient, g, lv)); page.screenshot(path=f1)
                    for i in range(24):
                        cur = q(page)
                        if not cur or cur['submitted']:
                            break
                        if cur['phase'] in ('act', 'ready', 'input'):
                            step(page, 'right')
                        page.wait_for_timeout(380)
                    try:
                        page.wait_for_function("() => { const q = window.__q; return !q || q.phase === 'praise'; }", timeout=20000, polling=50)
                    except Exception:
                        pass
                    f2 = os.path.join(SHOTS, '%s_%s_L%d_reveal.png' % (orient, g, lv)); page.screenshot(path=f2)
                    files += [f1, f2]
                except Exception as e:
                    log.fail('3 %s %s L%d screenshot: %s' % (orient, g, lv, str(e)[:100]))
                page.evaluate("gesture('home')"); page.wait_for_timeout(700)
            log.check(not page.errors, '3 %s screenshots: zero page / console errors %s' % (orient, page.errors[:2]))
            page.context.close()
        wk.close()
        try:
            from PIL import Image, ImageDraw, ImageFont
            font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
            ims = [(os.path.basename(f), Image.open(f).convert('RGB')) for f in files]
            cell = 420
            cols = 4
            rows = (len(ims) + cols - 1) // cols
            S = Image.new('RGB', (cols * (cell + 10) + 10, rows * (cell + 40) + 10), (250, 246, 238))
            d = ImageDraw.Draw(S)
            for k, (n, im) in enumerate(ims):
                r, c = divmod(k, cols)
                im.thumbnail((cell, cell))
                x, y = 10 + c * (cell + 10), 10 + r * (cell + 40)
                S.paste(im, (x, y + 30)); d.text((x, y + 4), n, fill=(43, 33, 24), font=font)
            out = os.path.join(SHOTS, 'spot_%d.jpg' % SEED)
            S.save(out, quality=85)
            log.w('contact sheet: %s' % out)
        except Exception as e:
            log.warn('contact sheet: %s' % e)
        log.w('part 3: %.0f s' % (time.time() - t0))

        # ---------------------------------------------------------------- 4. offline, sampled (Chromium)
        t0 = time.time()
        cr = p.chromium.launch()
        ctx = cr.new_context(viewport={'width': 1180, 'height': 820}, service_workers='allow')
        ctx.add_init_script('window.__fast = 1;' + SPEECH_INIT)
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(base + 'index.html')
        page.wait_for_function('window.__ready === true', timeout=20000)
        page.click('#play')
        n_assets = len(re.findall(r'\["\./assets/', open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()))
        full = False
        for _ in range(90):
            cs = page.evaluate("""async () => { const out = {}; for (const k of await caches.keys()) { const c = await caches.open(k); out[k] = (await c.keys()).length; } return out; }""")
            if any(k.startswith('ddi-assets-') and n >= n_assets + 1 for k, n in cs.items()) and page.evaluate("!!navigator.serviceWorker.controller"):
                full = True
                break
            page.wait_for_timeout(1000)
        log.check(full, '4 first visit: all %d assets precached' % n_assets)
        ctx.set_offline(True)
        try:
            page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
            page.click('#play')
            w, games, top = R.choice(WORLDS)
            g = R.choice(games)
            page.evaluate("([w,g]) => window.__go(w, g, 1, {noDemo: true, seed: 5})", [w, g])
            gen, snap = answer_question(page, 'right')
            wait_next_question(page, gen, timeout=20000)
            broken = page.evaluate("Array.from(document.images).filter(i => i.src && i.complete && i.naturalWidth === 0 && i.isConnected).map(i => i.src)")
            log.check(not broken, '4 offline: %s played a question, no broken picture %s' % (g, broken[:2]))
        except Exception as e:
            log.fail('4 offline: %s' % str(e)[:120])
        ctx.set_offline(False)
        log.check(not errs, '4 zero page errors %s' % errs[:2])
        cr.close()
        log.w('part 4: %.0f s' % (time.time() - t0))
    log.w('total %.1f min (seed %d)' % ((time.time() - t_all) / 60, SEED))
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
