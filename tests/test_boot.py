# -*- coding: utf-8 -*-
"""F01 first screen: byte budget, nothing of the map/islands/games fetched early, time to interactive, and the
first sentence spoken synchronously inside the #play click.

- cold load (fresh context, service workers blocked, normal speed), every response recorded until 1.2 s after the
  'load' event - strictly before Boot.later's idle prefetch (load + 1.5 s) - and before #play is clicked
- budget (R3-F01): EVERY first-screen response INCLUDING index.html <= 450 KB, index.html counted as it travels
  (gzip -6, what GitHub Pages sends - tests/smoke.py checks the real Content-Encoding and size on the live site)
- only what the entry screen shows may be fetched (index.html, the #entry pictures, manifest/icons)
- time to interactive: navigation start -> window.__ready === true, and -> #play visible  (FAIL > 2.5 s)
- click #play: the map is on inside the click, fully shown (fade done, sea + islands loaded) within 1 s; the speech log
  has the 'first' sentence and the engine's speak() was called before the click handler returned
usage: python tests/test_boot.py [chromium|webkit]      (default: both engines)"""
import os, sys, gzip
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, ROOT, SPEECH_INIT, Log

ENGINES = [sys.argv[1]] if len(sys.argv) > 1 else ['chromium', 'webkit']
BUDGET = 450 * 1024          # bytes, index.html included (gzip -6 transfer size)
TTI_MAX = 1000               # ms - TASK: interactive in < 1 s (local; the iPad cold start is an IPAD-CHECKLIST item)
MAP_MAX = 1000               # ms

# timing probes, installed before any page script runs
BOOT_INIT = r"""
(() => {
  const B = window.__boot = { readyAt: null, playVisibleAt: null, before: null, after: null, mapShownAt: null };
  let ready;
  Object.defineProperty(window, '__ready', { configurable: true, get() { return ready; },
    set(v) { ready = v; if (v === true && B.readyAt == null) B.readyAt = performance.now(); } });
  const visible = () => {
    const p = document.getElementById('play'); if (!p) return false;
    const r = p.getBoundingClientRect();
    if (r.width < 10 || r.height < 10 || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) return false;
    for (let e = p; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false; }
    return true;
  };
  const poll = () => { if (B.playVisibleAt == null && visible()) B.playVisibleAt = performance.now(); if (B.playVisibleAt == null) requestAnimationFrame(poll); };
  requestAnimationFrame(poll);
  const isPlay = e => e.target && e.target.closest && e.target.closest('#play');
  const snap = () => ({ t: performance.now(), calls: JSON.parse(JSON.stringify(window.__speechCalls || [])), log: JSON.parse(JSON.stringify(window.__speechLog || [])),
                        mapOn: !!(document.getElementById('map') && document.getElementById('map').classList.contains('on')) });
  /* capture on window runs before the app's #play listener, bubble on window after it: same click dispatch */
  window.addEventListener('click', e => { if (isPlay(e)) B.before = snap(); }, true);
  window.addEventListener('click', e => { if (isPlay(e)) { B.after = snap(); requestAnimationFrame(() => { B.frameAfter = performance.now(); }); } }, false);
})();
"""

LOAD_PLUS = r"""() => { const n = performance.getEntriesByType('navigation')[0]; return !!n && n.loadEventEnd > 0 && performance.now() >= n.loadEventEnd + 1200; }"""

SNAP = r"""() => {
  const n = performance.getEntriesByType('navigation')[0] || {};
  const B = window.__boot;
  return { now: performance.now(), loadStart: n.loadEventStart, loadEnd: n.loadEventEnd, dcl: n.domContentLoadedEventEnd, respEnd: n.responseEnd,
           bootDone: Boot.done, ready: B.readyAt, playVis: B.playVisibleAt,
           paint: performance.getEntriesByType('paint').map(p => [p.name, Math.round(p.startTime)]),
           entry: Array.from(document.querySelectorAll('#entry img')).map(i => new URL(i.getAttribute('src'), location.href).href),
           links: Array.from(document.querySelectorAll('link[href]')).map(l => [l.rel, new URL(l.getAttribute('href'), location.href).href]),
           res: performance.getEntriesByType('resource').map(r => ({ name: r.name, start: Math.round(r.startTime), end: Math.round(r.responseEnd), size: r.transferSize || 0, enc: r.encodedBodySize || 0 })) };
}"""

MAP_SHOWN = r"""() => {
  const B = window.__boot, m = document.getElementById('map');
  if (!m.classList.contains('on') || getComputedStyle(m).display === 'none' || parseFloat(getComputedStyle(m).opacity) < 0.99) return false;
  if (document.getElementById('entry').classList.contains('on')) return false;
  const imgs = Array.from(document.querySelectorAll('#islands img'));
  if (imgs.length < 7 || imgs.some(i => !i.complete || !i.naturalWidth)) return false;
  const sea = performance.getEntriesByType('resource').filter(r => /assets\/bg\/map_sea\.jpg/.test(r.name));
  if (!sea.length || !sea.some(r => r.responseEnd > 0) || !/map_sea/.test(getComputedStyle(document.getElementById('mapbg')).backgroundImage)) return false;
  if (B.mapShownAt == null) B.mapShownAt = performance.now();
  return true;
}"""


def classify(path):
    """what a URL requested before #play belongs to (for the report)"""
    for pre, name in (('assets/bg/map_sea', 'map'), ('assets/isl/', 'island'), ('assets/bg/', 'game-bg'), ('assets/bgthumb/', 'game-bgthumb'),
                      ('assets/props/', 'game-prop'), ('assets/thumbs/', 'game-thumb'), ('assets/voice/', 'voice'), ('assets/chars/', 'character'),
                      ('assets/splash/', 'splash'), ('sw.js', 'service-worker')):
        if path.startswith(pre):
            return name
    return 'other'


def run(p, eng, base, log):
    E = eng + ': '
    br = getattr(p, eng).launch()
    # the first AudioContext of a freshly launched headless Chromium on Windows blocks ~0.5 s (audio service start-up) -
    # a test-machine artifact, not the app: warm it in a throwaway context. The measured page below is still a cold load.
    warm = br.new_context()
    wp = warm.new_page()
    wp.goto(base + 'manifest.webmanifest')
    audio_warm = wp.evaluate("(() => { const C = window.AudioContext || window.webkitAudioContext; if (!C) return 'n/a: no Web Audio in this build'; const t = performance.now(); try { const c = new C(); c.close && c.close(); } catch (e) { return 'threw ' + e.name; } return Math.round(performance.now() - t) + ' ms'; })()")
    warm.close()
    log.w('%s browser audio service warmed in a throwaway context (first AudioContext: %s)' % (eng, audio_warm))
    ctx = br.new_context(viewport={'width': 1180, 'height': 820}, device_scale_factor=1, has_touch=False, service_workers='block')
    ctx.add_init_script(SPEECH_INIT + BOOT_INIT)
    page = ctx.new_page()
    errors, resps, reqs = [], [], []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning', 'assert') else None)
    page.on('request', lambda r: reqs.append(r))
    page.on('response', lambda r: resps.append(r))
    page.goto(base + 'index.html', wait_until='load')
    page.wait_for_function(LOAD_PLUS, polling=10, timeout=15000)
    snap = page.evaluate(SNAP)
    pre_resps, pre_reqs = list(resps), list(reqs)
    raw_index = open(os.path.join(ROOT, 'index.html'), 'rb').read()     # read now: the file may be edited between runs
    rel = lambda u: u[len(base):] if u.startswith(base) else u

    # ---- the measurement window itself
    win = snap['now'] - snap['loadStart']
    log.check(not snap['bootDone'] and win < 1500, E + 'window closed %.0f ms after the load event, before the idle prefetch (Boot.done=%s)' % (win, snap['bootDone']))

    # ---- bytes
    rows, seen = [], set()
    for r in pre_resps:
        path = rel(r.url)
        try:
            n, how = len(r.body()), 'body'
        except Exception:
            n, how = int(r.headers.get('content-length') or 0), 'content-length'
        rows.append((path, r.status, n, r.headers.get('content-length'), how))
        seen.add(r.url)
    no_resp = [rel(r.url) for r in pre_reqs if r.url not in seen]
    in_page = [x for x in snap['res'] if x['name'] not in seen]
    idx = [x for x in rows if x[0] in ('index.html', '')]
    others = [x for x in rows if x[0] not in ('index.html', '')]
    total = sum(x[2] for x in others)
    gz9, gz6 = len(gzip.compress(raw_index, 9)), len(gzip.compress(raw_index, 6))
    log.w('%s requests before #play (until load + %.0f ms):' % (eng, win))
    entry = set(rel(u) for u in snap['entry'])
    for path, st, n, cl, how in sorted(rows, key=lambda x: -x[2]):
        kind = 'page' if path in ('index.html', '') else 'entry screen' if path in entry else classify(path)
        log.w('   %8d B  %-5s %s  [%s]%s' % (n, st, path, kind, '' if how == 'body' else ' (size from ' + how + ')'))
    log.w('%s index.html served %s B (disk %d B = %.1f KB; gzip -9 %d B = %.1f KB, gzip -6 %d B = %.1f KB)'
          % (eng, idx[0][2] if idx else '?', len(raw_index), len(raw_index) / 1024, gz9, gz9 / 1024, gz6, gz6 / 1024))
    log.check(bool(idx) and idx[0][2] == len(raw_index), E + 'index.html fetched once, served size = file on disk (%d B)' % len(raw_index))
    log.check(total + gz6 <= BUDGET, E + 'first-screen transfer incl. index.html (gzip -6 %.1f KB): %.1f KB over %d responses (budget 450 KB)' % (gz6 / 1024, (total + gz6) / 1024, len(others) + 1))
    if no_resp:
        log.warn(E + 'requests without a response inside the window %s' % no_resp)
    if in_page:
        log.warn(E + 'resources in the page timeline without a Playwright response %s' % [rel(x['name']) for x in in_page])

    # ---- nothing but the entry screen
    allowed = {base + 'index.html'} | set(snap['entry']) | {h for rel_, h in snap['links'] if rel_ in ('manifest', 'icon', 'apple-touch-icon')}
    early = [(x[0], x[2], classify(x[0])) for x in others if base + x[0] not in allowed]
    log.check(not early, E + 'no map/island/game asset requested before #play %s' % (['%s (%s, %d B)' % (a, c, n) for a, n, c in early] or ''))
    log.w('%s   entry screen pictures: %s' % (eng, [rel(u) for u in snap['entry']]))

    # ---- time to interactive
    log.w('%s timing (ms since navigation start): DOMContentLoaded %.0f, load %.0f, paint %s, __ready %.0f, #play visible %.0f'
          % (eng, snap['dcl'], snap['loadStart'], snap['paint'], snap['ready'] or -1, snap['playVis'] or -1))
    log.check(snap['ready'] is not None and snap['ready'] <= TTI_MAX, E + 'window.__ready === true at %.0f ms (<= %d)' % (snap['ready'] or -1, TTI_MAX))
    log.check(snap['playVis'] is not None and snap['playVis'] <= TTI_MAX, E + '#play visible at %.0f ms (<= %d)' % (snap['playVis'] or -1, TTI_MAX))

    # ---- the click
    page.click('#play')
    B = page.evaluate('window.__boot')
    bf, af = B.get('before'), B.get('after')
    if not log.check(bool(bf and af), E + 'click on #play seen before and after the app handler'):
        br.close(); return
    new_log = af['log'][len(bf['log']):]
    new_calls = af['calls'][len(bf['calls']):]
    first = [e for e in new_log if e.get('tag') == 'first' and e.get('ev') == 'speak']
    spoke = [c for c in new_calls if c.get('ev') == 'speak']
    fake = page.evaluate("(() => { try { const v = speechSynthesis.getVoices(); return !!(v[0] && v[0].name === 'Test Ting-Ting'); } catch (e) { return null; } })()")
    log.check(af['mapOn'], E + 'map screen switched on inside the click handler')
    log.check(bool(first), E + "speech log has the first sentence (tag 'first', ev 'speak') when the click handler returns: %s" % [e['text'] for e in first])
    log.check(bool(spoke), E + '%s engine speak() called inside the click dispatch: %s' % ('fake' if fake else 'real', [c.get('text') for c in spoke]))
    try:
        page.wait_for_function(MAP_SHOWN, polling='raf', timeout=5000)
    except Exception:
        pass
    B = page.evaluate('window.__boot')
    dt = (B['mapShownAt'] - bf['t']) if B.get('mapShownAt') is not None else None
    pics = page.evaluate(r"""(t0) => performance.getEntriesByType('resource').filter(r => /assets\/(bg\/map_sea\.jpg|isl\/)/.test(r.name)).map(r => [r.name.split('/assets/')[1], Math.round(r.responseEnd - t0)])""", bf['t'])
    log.check(dt is not None and dt <= MAP_MAX, E + 'map fully shown (fade done, sea + 7 islands loaded) %s ms after the click (<= %d)' % (None if dt is None else round(dt), MAP_MAX))
    log.w('%s   click handler ran %.0f ms, first frame %.0f ms after the click; map pictures finished (ms after click): %s'
          % (eng, af['t'] - bf['t'], (B.get('frameAfter') or bf['t']) - bf['t'], pics))
    log.check(not errors, E + 'zero page/console errors %s' % errors[:4])
    br.close()


def main():
    log = Log('boot' if len(ENGINES) > 1 else 'boot_' + ENGINES[0])
    with sync_playwright() as p, serve() as base:
        for eng in ENGINES:
            try:
                run(p, eng, base, log)
            except Exception as e:
                log.fail('%s: exception %s' % (eng, str(e).splitlines()[0][:200] if str(e) else repr(e)))
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
