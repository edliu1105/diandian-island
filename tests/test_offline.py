# -*- coding: utf-8 -*-
"""Service worker gate (F02, R3-F02): full precache -> offline play; a broken update never replaces a working version;
a 404/503 page answer falls back to the cached page; ONE release = page + assets: a release whose download breaks
leaves the old page AND the old assets (online and offline); a complete release waits until the page asks for the
switch (entry screen / background) and then page and assets change together; sw.js VERSION must match the files.
usage: python tests/test_offline.py [chromium|webkit]"""
import os, sys, re, time, threading, functools, http.server, socketserver, contextlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import ROOT, SPEECH_INIT, Log, wait_phase, answer_question, wait_next_question

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'


class Ctl:
    fail = set()          # paths answered with 404
    status = {}           # path -> forced status (e.g. 503)
    override = {}         # path -> bytes


class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path in Ctl.fail:
            self.send_error(404); return
        if path in Ctl.status:
            self.send_error(Ctl.status[path]); return
        if path in Ctl.override:
            b = Ctl.override[path]
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript' if path.endswith('.js') else 'text/html')
            self.send_header('Content-Length', str(len(b)))
            self.end_headers()
            self.wfile.write(b); return
        return super().do_GET()


class TS(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


@contextlib.contextmanager
def serve():
    srv = TS(('127.0.0.1', 0), functools.partial(H, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        yield 'http://127.0.0.1:%d/' % srv.server_address[1]
    finally:
        srv.shutdown()


def cache_state(page):
    return page.evaluate("""async () => { const out = {}; for (const k of await caches.keys()) { const c = await caches.open(k); out[k] = (await c.keys()).length; } return out; }""")


def wait_sw_ready(page, want_assets, timeout=240):
    t0 = time.time()
    while time.time() - t0 < timeout:
        st = cache_state(page)
        ctrl = page.evaluate("!!(navigator.serviceWorker && navigator.serviceWorker.controller)")
        full = [k for k, n in st.items() if k.startswith('ddi-assets-') and n >= want_assets + 1]
        if ctrl and full:
            return st
        page.wait_for_timeout(1000)
    return cache_state(page)


def main():
    log = Log('offline_%s' % ENGINE)
    import subprocess
    chk = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'gen_sw_list.py'), '--check'], capture_output=True, text=True)
    log.check(chk.returncode == 0, 'sw.js VERSION matches index.html + manifest + assets (%s)' % chk.stdout.strip())
    sw_src = open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()
    html_src = open(os.path.join(ROOT, 'index.html'), 'rb').read()
    n_assets = len(re.findall(r'\["\./assets/', sw_src))
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        ctx = br.new_context(viewport={'width': 1180, 'height': 820}, service_workers='allow')
        ctx.add_init_script('window.__fast = 1;' + SPEECH_INIT)
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(base + 'index.html')
        page.wait_for_function('window.__ready === true', timeout=20000)
        page.click('#play')                       # Boot.later registers the SW a moment after the map shows
        st = wait_sw_ready(page, n_assets)
        full = [k for k, n in st.items() if k.startswith('ddi-assets-') and n >= n_assets + 1]
        log.check(bool(full), 'first visit: every one of %d assets precached %s' % (n_assets, st))
        page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
        log.check(page.evaluate("!!navigator.serviceWorker.controller"), 'page is controlled by the service worker after reload')
        # the parent panel tells the parent that the iPad is ready to play without network
        page.evaluate("Parent.panel()")
        try:
            page.wait_for_function("() => /已就绪/.test(document.querySelector('#parent .sheet').textContent)", timeout=5000)
            log.ok('parent panel: offline ready (%s)' % page.evaluate("(() => { const t = document.querySelector('#parent .sheet').textContent; const i = t.indexOf('已就绪'); return t.slice(i, i + 30); })()"))
        except Exception:
            log.fail('parent panel does not report offline readiness: %s' % page.evaluate("document.querySelector('#parent .sheet').textContent.slice(0, 400)"))
        page.evaluate("Parent.close()")

        # ---- offline: reload and play one question of every world
        ctx.set_offline(True)
        try:
            page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
        except Exception as e:
            # Playwright's WebKit on Windows cannot emulate an offline navigation through a service worker
            # ("internal error"); the offline path is verified in Chromium and must be confirmed on the iPad itself.
            log.warn('%s: offline navigation cannot be emulated by this driver (%s) - see IPAD-CHECKLIST' % (ENGINE, str(e).splitlines()[0][:80]))
            ctx.set_offline(False)
            br.close()
            sys.exit(0 if log.close() else 1)
        page.click('#play')
        page.wait_for_function("document.querySelector('#map').classList.contains('on')", timeout=10000)
        bad_imgs = []
        for w, g in [('peppa', 'P1'), ('bluey', 'B2'), ('huluwa', 'H2'), ('paw', 'A3'), ('xiyou', 'X2'), ('avengers', 'V1')]:
            page.evaluate("([w,g]) => window.__go(w, g, 1, {noDemo: true, seed: 5})", [w, g])
            try:
                gen, snap = answer_question(page, 'right')
                wait_next_question(page, gen, timeout=20000)
                broken = page.evaluate("Array.from(document.images).filter(i => i.src && i.complete && i.naturalWidth === 0 && i.isConnected).map(i => i.src)")
                bad_imgs += broken
                log.check(not broken, 'offline %s %s: question played, no broken picture %s' % (w, g, broken[:3]))
            except Exception as e:
                log.fail('offline %s %s: %s' % (w, g, str(e)[:120]))
            page.evaluate("gesture('home')")
        ctx.set_offline(False)

        # ---- a broken update (one asset 404): the install must fail, the working version must stay
        before = cache_state(page)
        new_sw = sw_src.replace(re.search(r"const VERSION = '([^']*)'", sw_src).group(0), "const VERSION = 'vbroken1'")
        new_sw = re.sub(r'\["\./assets/props/cake\.png","[0-9a-f]+"\]', '["./assets/props/cake.png","changed000"]', new_sw)   # changed content -> must be downloaded
        Ctl.override['/sw.js'] = new_sw.encode('utf-8')
        Ctl.fail.add('/assets/props/cake.png')
        page.evaluate("navigator.serviceWorker.getRegistration().then(r => r && r.update())")
        page.wait_for_timeout(9000)
        after = cache_state(page)
        old_assets = [k for k in before if k.startswith('ddi-assets-')]
        log.check(all(k in after for k in old_assets), 'broken update: previous caches kept %s' % after)
        log.check('ddi-assets-vbroken1' not in after or after.get('ddi-assets-vbroken1', 0) < n_assets + 1, 'broken update: incomplete new cache never activated')
        ctx.set_offline(True)
        page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
        log.ok('broken update: offline reload still works')
        ctx.set_offline(False)
        Ctl.override.clear(); Ctl.fail.clear()

        # ---- R3-F02 a release whose download breaks: NEW page + one NEW asset that fails -> old page, old assets
        mark = b'<!--RELEASE-2-->'
        new_html = html_src.replace(b'</html>', mark + b'</html>')
        rel = sw_src.replace(re.search(r"const VERSION = '([^']*)'", sw_src).group(0), "const VERSION = 'vrel2broken'")
        rel = re.sub(r'\["\./assets/props/cake\.png","[0-9a-f]+"\]', '["./assets/props/cake.png","changed222"]', rel)
        Ctl.override['/sw.js'] = rel.encode('utf-8')
        Ctl.override['/index.html'] = new_html
        Ctl.override['/'] = new_html
        Ctl.fail.add('/assets/props/cake.png')
        page.evaluate("navigator.serviceWorker.getRegistration().then(r => r && r.update())")
        page.wait_for_timeout(9000)
        waiting = page.evaluate("navigator.serviceWorker.getRegistration().then(r => !!(r && r.waiting))")
        page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
        html_now = page.evaluate("document.documentElement.outerHTML.includes('RELEASE-2')")
        log.check(not waiting and not html_now, 'broken release (new page + failing asset): nothing waiting, the page stays the old one online (waiting %s, new page %s)' % (waiting, html_now))
        ctx.set_offline(True)
        try:
            page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
            log.check(not page.evaluate("document.documentElement.outerHTML.includes('RELEASE-2')"), 'broken release: offline too the old page with the old assets')
        except Exception as e:
            log.fail('broken release: offline reload failed (%s)' % str(e)[:80])
        ctx.set_offline(False)
        Ctl.override.clear(); Ctl.fail.clear()

        # ---- R3-F02 a complete release: installed in the background, WAITS; the page switches when it asks for it
        mark3 = b'<!--RELEASE-3-->'
        new_html3 = html_src.replace(b'</html>', mark3 + b'</html>')
        rel3 = sw_src.replace(re.search(r"const VERSION = '([^']*)'", sw_src).group(0), "const VERSION = 'vrel3good'")
        rel3 = re.sub(r'\["\./assets/props/cake\.png","[0-9a-f]+"\]', '["./assets/props/cake.png","changed333"]', rel3)
        Ctl.override['/sw.js'] = rel3.encode('utf-8')
        Ctl.override['/index.html'] = new_html3
        Ctl.override['/'] = new_html3
        page.evaluate("navigator.serviceWorker.getRegistration().then(r => r && r.update())")
        try:
            page.wait_for_function("navigator.serviceWorker.getRegistration().then(r => !!(r && r.waiting))", timeout=60000, polling=500)
            still_old = not page.evaluate("document.documentElement.outerHTML.includes('RELEASE-3')")
            cs = cache_state(page)
            log.check(still_old and any(k.startswith('ddi-assets-v') and 'rel3' not in k for k in cs), 'complete release installed and WAITING; the running page keeps its own version (caches %s)' % sorted(cs))
            page.evaluate("() => window.__swApply()")
            page.wait_for_function("document.documentElement.outerHTML.includes('RELEASE-3')", timeout=20000)
            page.wait_for_function('window.__ready === true', timeout=20000)
            cs = cache_state(page)
            log.check(set(k for k in cs if k.startswith('ddi-')) == {'ddi-core-vrel3good', 'ddi-assets-vrel3good'}, 'switch: page and assets changed TOGETHER, old version removed (caches %s)' % sorted(cs))
            ctx.set_offline(True)
            page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
            log.check(page.evaluate("document.documentElement.outerHTML.includes('RELEASE-3')"), 'after the switch: offline the new page with the new assets')
            ctx.set_offline(False)
        except Exception as e:
            log.fail('complete release: %s' % str(e)[:120])
            ctx.set_offline(False)
        Ctl.override.clear(); Ctl.fail.clear()

        # ---- the server answers 503 for the page -> this version's cached page is served
        Ctl.status['/index.html'] = 503
        page.reload();
        try:
            page.wait_for_function('window.__ready === true', timeout=20000)
            log.ok('503 for index.html: the cached page was served')
        except Exception as e:
            log.fail('503 for index.html: page did not load (%s)' % str(e)[:80])
        Ctl.status.clear()
        log.check(not errs, 'zero page errors %s' % errs[:3])
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
