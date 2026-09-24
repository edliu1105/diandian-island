# -*- coding: utf-8 -*-
"""Live smoke test against the published site (run after every deploy).

 1. plain HTTPS: the address answers 200 on its own host (no redirect to another domain, no http), with HSTS;
    index.html, sw.js, manifest, icons and a sample of assets answer 200
 2. per engine (WebKit = the iPad engine, Chromium): first visit -> the service worker precaches EVERY asset;
    one question of every world is played (fast timings, synthetic speech); zero page / console errors
 3. offline (Chromium; Playwright's WebKit on Windows cannot emulate an offline navigation): reload with the
    network off, one question of every world, no broken picture
usage: python tests/smoke.py [url] [chromium,webkit]
log:   tests/logs/smoke_live.log
"""
import os, sys, re, time, urllib.request
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import SPEECH_INIT, Log, answer_question, wait_next_question

URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'https://edliu1105.github.io/diandian-island/')
ENGINES = next((a.split(',') for a in sys.argv[1:] if not a.startswith('http')), ['webkit', 'chromium'])
if not URL.endswith('/'):
    URL += '/'
HOST = re.match(r'https://([^/]+)/', URL).group(1)
PLAY = [('peppa', 'P1'), ('bluey', 'B2'), ('huluwa', 'H2'), ('paw', 'A3'), ('xiyou', 'X2'), ('avengers', 'V1')]


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) smoke'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.geturl(), dict(r.headers), r.read()


def cache_state(page):
    return page.evaluate("""async () => { const out = {}; for (const k of await caches.keys()) { const c = await caches.open(k); out[k] = (await c.keys()).length; } return out; }""")


def main():
    log = Log('smoke_live')
    # ------------------------------------------------------------------ 1. HTTPS + files
    st, final, hd, body = get(URL)
    log.check(st == 200 and final.startswith('https://' + HOST + '/'), 'HTTPS %s -> %s %s (no redirect to another host)' % (URL, st, final))
    log.check('max-age' in (hd.get('Strict-Transport-Security') or hd.get('strict-transport-security') or ''), 'HSTS header present')
    log.check('点点岛'.encode('utf-8') in body, 'index page is the app')
    # R3-F01: what the page really costs on the wire (GitHub Pages compresses)
    req = urllib.request.Request(URL, headers={'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla/5.0 (iPad) smoke'})
    with urllib.request.urlopen(req, timeout=30) as r:
        enc, raw = r.headers.get('Content-Encoding', ''), r.read()
    log.check(enc == 'gzip' and len(raw) <= 150 * 1024, 'index.html travels compressed: Content-Encoding %s, %.1f KB on the wire' % (enc or 'none', len(raw) / 1024))
    st2, _, _, sw = get(URL + 'sw.js')
    sw = sw.decode('utf-8')
    assets = re.findall(r'\["\./(assets/[^"]+)","[0-9a-f]+"\]', sw)
    log.check(st2 == 200 and len(assets) > 100, 'sw.js 200, %d assets listed' % len(assets))
    for f in ['manifest.webmanifest', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png'] + assets[::23]:
        try:
            s, _, _, b = get(URL + f)
            log.check(s == 200 and len(b) > 0, '%s %s (%d bytes)' % (f, s, len(b)))
        except Exception as e:
            log.fail('%s: %s' % (f, e))
    # ------------------------------------------------------------------ 2./3. browsers
    with sync_playwright() as p:
        for eng in ENGINES:
            br = getattr(p, eng).launch()
            ctx = br.new_context(viewport={'width': 1180, 'height': 820}, service_workers='allow')
            ctx.add_init_script('window.__fast = 1;' + SPEECH_INIT)
            page = ctx.new_page()
            errs = []
            page.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
            page.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
            t0 = time.time()
            page.goto(URL)
            page.wait_for_function('window.__ready === true', timeout=30000)
            log.ok('[%s] first load ready in %.1f s' % (eng, time.time() - t0))
            page.click('#play')
            page.wait_for_function("document.querySelector('#map').classList.contains('on')", timeout=10000)
            full = []
            for _ in range(240):
                cs = cache_state(page)
                ctrl = page.evaluate("!!(navigator.serviceWorker && navigator.serviceWorker.controller)")
                full = [k for k, n in cs.items() if k.startswith('ddi-assets-') and n >= len(assets) + 1]
                if full and ctrl:
                    break
                page.wait_for_timeout(1000)
            log.check(bool(full), '[%s] service worker precached all %d assets %s' % (eng, len(assets), cache_state(page)))

            def play(tag):
                for w, g in PLAY:
                    page.evaluate("([w,g]) => window.__go(w, g, 1, {noDemo: true, seed: 11})", [w, g])
                    try:
                        gen, snap = answer_question(page, 'right', timeout=30000)
                        wait_next_question(page, gen, timeout=30000)
                        broken = page.evaluate("Array.from(document.images).filter(i => i.src && i.complete && i.naturalWidth === 0 && i.isConnected).map(i => i.src)")
                        log.check(snap and snap.get('submitted') and not broken, '[%s] %s %s %s: question played, no broken picture %s' % (eng, tag, w, g, broken[:2]))
                    except Exception as e:
                        log.fail('[%s] %s %s %s: %s' % (eng, tag, w, g, str(e)[:160]))
                    page.evaluate("gesture('home')")
                    page.wait_for_timeout(300)

            play('online')
            ctx.set_offline(True)
            try:
                page.reload()
                page.wait_for_function('window.__ready === true', timeout=30000)
                page.click('#play')
                page.wait_for_function("document.querySelector('#map').classList.contains('on')", timeout=10000)
                play('offline')
            except Exception as e:
                if eng == 'webkit':
                    log.warn('[webkit] offline navigation cannot be emulated by this driver (%s) - IPAD-CHECKLIST item' % str(e).splitlines()[0][:80])
                else:
                    log.fail('[%s] offline reload: %s' % (eng, str(e)[:160]))
            ctx.set_offline(False)
            log.check(not errs, '[%s] zero page / console errors %s' % (eng, errs[:3]))
            br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
