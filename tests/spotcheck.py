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
 5. idle cues and rhythm, looked at and timed (real timings): a child who touches nothing - the host's cues come
    one at a time (a screenshot at each cue, on a sheet); a right answer - praise + star into the tray; the map's
    star show for 5 stars and a tap that skips it; frame pacing during the celebrations and the tap-to-press delay
    (Chromium - a desktop proxy, the iPad itself stays on the real-device checklist)                (~1.5 min)
What is judged is what the child sees and hears (screens, order, timing). Code is only read to explain a problem.
usage: python tests/spotcheck.py [seed] [--parts 1,3,5]
out:   tests/logs/spotcheck.log, shots/spot/spot_<seed>.jpg, shots/spot/idle_<seed>.jpg
"""
import os, sys, time, random, re
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, wait_phase, q, step, answer_question, wait_next_question, Log, ROOT, SPEECH_INIT

ARGS = [a for i, a in enumerate(sys.argv[1:]) if not a.startswith('--') and sys.argv[i] != '--parts']
SEED = int(ARGS[0]) if ARGS else int(time.time()) % 100000
PARTS = set('12345')
if '--parts' in sys.argv:
    PARTS = set(sys.argv[sys.argv.index('--parts') + 1].replace(',', ''))
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


TIMELINE_JS = """() => {
  window.__tl = [];
  const now = () => Math.round(performance.now());
  for (const k of ['glance', 'wave', 'yawn']) { const o = Actor.prototype[k]; Actor.prototype[k] = function (...a) { window.__tl.push([k, this.id, now()]); return o.apply(this, a); }; }
  const og = Hand.go; let last = 0;
  Hand.go = function (...a) { const t = now(); if (t - last > 400) window.__tl.push(['hand', '', t]); last = t; return og.apply(this, a); };
  const ogl = Hints.glow; Hints.glow = function (...a) { window.__tl.push(['glow', '', now()]); return ogl.apply(this, a); };
  const osay = Voice.say; Voice.say = function (text, opt) { if (opt && opt.tag === 'hint1') window.__tl.push(['say-again', '', now()]); return osay.apply(this, arguments); };
}"""

FRAMES_JS = """(ms) => new Promise(res => { const d = []; let last = performance.now(); const t0 = last;
  const f = t => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else { d.sort((a, b) => a - b); res({ n: d.length, p50: d[Math.floor(d.length * 0.5)], p95: d[Math.floor(d.length * 0.95)], long: d.filter(x => x > 25).length }); } };
  requestAnimationFrame(f); })"""


def part5(p, base, log):
    """5. this round's UX: the idle cues one at a time (screenshots), the celebration budget, the map's star show and
    its skip, frame pacing and the tap-to-press delay"""
    from PIL import Image, ImageDraw, ImageFont
    shots = []
    wk = p.webkit.launch()
    page = new_page(wk, base, 1180, 820, fast=False, sw='block')
    enter(page); page.wait_for_timeout(600)
    page.evaluate(TIMELINE_JS)
    w, g = R.choice([('peppa', 'P2'), ('peppa', 'P3'), ('bluey', 'B2'), ('bluey', 'B4'), ('huluwa', 'H1'), ('paw', 'A1'), ('xiyou', 'X2'), ('avengers', 'V2')])
    page.evaluate("([w,g,s]) => window.__go(w, g, 1, {noDemo: true, seed: s})", [w, g, R.randint(1, 9999)])
    try:
        st = wait_phase(page, phases=('ready', 'input'), timeout=30000)
        gen = st['gen']
        mates = page.evaluate("() => { const G = Session.G, h = Session.host(G); return Object.values(G.actors).filter(a => a !== h && !a.math && !a.dead && a.x > 40 && a.x < Stage.W - 40).map(a => a.id); }")
        f = os.path.join(SHOTS, 'idle_0_ready.png'); page.screenshot(path=f); shots.append((f, '%s ready' % g))
        seen = 0
        t_end = time.time() + 22
        while time.time() < t_end:
            tl = page.evaluate('window.__tl')
            cur = q(page)
            if not cur or cur['gen'] != gen:
                break
            if len(tl) > seen:
                ev = tl[seen]; seen += 1
                if ev[0] in ('glow', 'say-again'):
                    continue
                page.wait_for_timeout(380)
                f = os.path.join(SHOTS, 'idle_%d_%s.png' % (len(shots), ev[0]))
                page.screenshot(path=f); shots.append((f, '%s %s' % (ev[0], ev[1])))
                if ev[0] == 'hand' and any(e[0] == 'yawn' for e in tl[:seen]):
                    break
            page.wait_for_timeout(100)
        tl = page.evaluate('window.__tl')
        t = {}
        for k, who, ms in tl:
            t.setdefault(k, []).append(ms)
        t0 = tl[0][2] if tl else 0
        log.w('5 %s idle timeline (ms from the first cue): %s' % (g, ', '.join('%s:%s@%d' % (k, who, ms - t0) for k, who, ms in tl)))
        wave, yawn, hands = (t.get('wave') or [None])[0], (t.get('yawn') or [None])[0], t.get('hand', [])
        glow, again = (t.get('glow') or [None])[0], (t.get('say-again') or [None])[0]
        log.check(again is not None and glow is not None and glow > again, '5 %s 5 s: the question is said again, the work glows after it (+%s ms)' % (g, None if again is None or glow is None else glow - again))
        log.check(wave is not None and any(h > wave + 600 for h in hands) and not any(wave - 50 < h < wave + 600 for h in hands),
                  '5 %s 10 s: the host waves first, the gesture comes after the wave' % g)
        log.check(yawn is not None and any(h >= yawn + 1000 for h in hands) and not any(yawn - 50 < h < yawn + 1000 for h in hands),
                  '5 %s 15 s: the host yawns (little z), then the hand points - never both at once' % g)
        friends = [x for x in tl if x[0] == 'glance' and again is not None and x[2] < again - 200]
        log.check(len(friends) == (1 if mates else 0), '5 %s thinking time: %s glances at the child before the first hint (%s; friends on stage %s)' % (g, 'one friend' if mates else 'nobody (no friend on stage)', [x[1] for x in friends], mates))
        cur = real_answer(page, gen)
        page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g || q.phase === 'praise'; }", arg=gen, timeout=20000, polling=20)
        t1 = time.time()
        page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g; }", arg=gen, timeout=20000, polling=20)
        cel = (time.time() - t1) * 1000
        log.check(cel <= 2700, '5 %s right answer: praise + star into the tray %.0f ms (<= 2.5 s + polling)' % (g, cel))
    except Exception as e:
        log.fail('5 %s idle / celebration: %s' % (g, str(e)[:160]))
    page.evaluate("gesture('home')"); page.wait_for_timeout(900)
    try:
        ms = page.evaluate("async (w) => { Store.w(w).stars += 5; const t = performance.now(); await MapView.celebrate(w, 5, false); return performance.now() - t; }", w)
        log.check(ms <= 2500, '5 map: 5 stars fly into the lamps in %.0f ms (<= 2.5 s)' % ms)
        page.evaluate("(w) => { Store.w(w).stars += 5; window.__celT = null; const t = performance.now(); MapView.celebrate(w, 5, false).then(() => { window.__celT = performance.now() - t; }); }", w)
        page.wait_for_timeout(650)
        f = os.path.join(SHOTS, 'idle_map_stars.png'); page.screenshot(path=f); shots.append((f, 'map stars flying'))
        page.evaluate("document.querySelector('#map').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}))")
        page.wait_for_function('window.__celT != null', timeout=5000)
        skipped = page.evaluate('window.__celT')
        log.check(skipped <= 1300, '5 map: a tap skips the star show (it ended %.0f ms after it began)' % skipped)
    except Exception as e:
        log.fail('5 map star show: %s' % str(e)[:160])
    log.check(not page.errors, '5 zero page / console errors %s' % page.errors[:2])
    page.context.close(); wk.close()
    cr = p.chromium.launch()
    page = new_page(cr, base, 1180, 820, fast=False, sw='block')
    enter(page); page.wait_for_timeout(600)
    try:
        page.evaluate("([w,g]) => window.__go(w, g, 1, {noDemo: true, seed: 7})", ['peppa', 'P1'])
        wait_phase(page, phases=('act', 'ready', 'input'), timeout=30000)
        page.evaluate("""() => { window.__lat = []; document.addEventListener('pointerdown', e => { const ts = e.timeStamp, t = e.target.closest('.tgt,.card,.done,.item');
            requestAnimationFrame(() => requestAnimationFrame(() => window.__lat.push([Math.round(performance.now() - ts), !!(t && t.classList.contains('press'))]))); }, true); }""")
        s1 = page.evaluate("window.__next('right')")
        if s1 and s1.get('at'):
            page.mouse.move(s1['at']['x'], s1['at']['y']); page.mouse.down(); page.wait_for_timeout(120); page.mouse.up()
        page.wait_for_timeout(300)
        lat = page.evaluate('window.__lat')
        log.check(bool(lat) and lat[0][0] <= 50, '5 a touch shows its press by the second frame, %s ms (<= 50 ms, Chromium)' % (lat[0][0] if lat else None))
        for i in range(30):
            cur = q(page)
            if not cur or cur['submitted']:
                break
            if cur['phase'] in ('act', 'ready', 'input'):
                step(page, 'right')
            page.wait_for_timeout(250)
        page.wait_for_function("() => { const q = window.__q; return !q || q.phase === 'praise'; }", timeout=20000, polling=20)
        fr = page.evaluate(FRAMES_JS, 2500)
        log.check(fr['p95'] <= 20 and fr['long'] <= max(2, fr['n'] // 50), '5 celebration frame pacing (Chromium): p50 %.1f / p95 %.1f ms, %d of %d frames > 25 ms' % (fr['p50'], fr['p95'], fr['long'], fr['n']))
    except Exception as e:
        log.fail('5 frames / latency: %s' % str(e)[:160])
    log.check(not page.errors, '5 chromium: zero page / console errors %s' % page.errors[:2])
    page.context.close(); cr.close()
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
        cell = 420; cols = 3; rows = (len(shots) + cols - 1) // cols
        S = Image.new('RGB', (cols * (cell + 10) + 10, max(1, rows) * (cell + 40) + 10), (250, 246, 238))
        d = ImageDraw.Draw(S)
        for k, (f, n) in enumerate(shots):
            im = Image.open(f).convert('RGB'); im.thumbnail((cell, cell))
            r, c = divmod(k, cols); x, y = 10 + c * (cell + 10), 10 + r * (cell + 40)
            S.paste(im, (x, y + 30)); d.text((x, y + 4), '%d %s' % (k, n), fill=(43, 33, 24), font=font)
        out = os.path.join(SHOTS, 'idle_%d.jpg' % SEED); S.save(out, quality=85)
        log.w('idle sheet: %s' % out)
    except Exception as e:
        log.warn('idle sheet: %s' % e)


def main():
    log = Log('spotcheck')
    log.w('seed %d' % SEED)
    t_all = time.time()
    with sync_playwright() as p, serve() as base:
        wk = p.webkit.launch()
        if '5' in PARTS:
            t0 = time.time()
            part5(p, base, log)
            log.w('part 5: %.0f s' % (time.time() - t0))
        # ---------------------------------------------------------------- 1. every game once, random level
        t0 = time.time()
        page = new_page(wk, base, 1180, 820, fast=True)
        enter(page)
        for w, games, top in (WORLDS if '1' in PARTS else []):
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
        for w, games, top in (WORLDS if '2' in PARTS else []):
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
        if '2' in PARTS:
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
        for w, g, top in (R.sample(allg, 8) if '3' in PARTS else []):
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
            if not files:
                raise RuntimeError('part 3 not run - no contact sheet')
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
        if '4' not in PARTS:
            log.w('total %.1f min (seed %d, parts %s)' % ((time.time() - t_all) / 60, SEED, ''.join(sorted(PARTS))))
            sys.exit(0 if log.close() else 1)
        cr = p.chromium.launch()
        ctx = cr.new_context(viewport={'width': 1180, 'height': 820}, service_workers='allow')
        ctx.add_init_script('window.__fast = 1;' + SPEECH_INIT)
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(base + 'index.html')
        page.wait_for_function('window.__ready === true', timeout=20000)
        page.click('#play')
        page.evaluate('window.__firstLoad = 1')           # a reload by itself would drop this mark
        n_assets = len(re.findall(r'\["\./assets/', open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()))
        full = False
        for _ in range(90):
            cs = page.evaluate("""async () => { const out = {}; for (const k of await caches.keys()) { const c = await caches.open(k); out[k] = (await c.keys()).length; } return out; }""")
            if any(k.startswith('ddi-assets-') and n >= n_assets + 1 for k, n in cs.items()) and page.evaluate("!!navigator.serviceWorker.controller"):
                full = True
                break
            page.wait_for_timeout(1000)
        log.check(full, '4 first visit: all %d assets precached' % n_assets)
        page.wait_for_timeout(3500)                          # past the map's safe-moment check
        log.check(page.evaluate('window.__firstLoad === 1'), '4 first visit: the page never reloads by itself when the worker takes over')
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
