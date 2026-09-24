# -*- coding: utf-8 -*-
"""Shared Playwright harness for 点点岛 tests.

- ThreadingTCPServer (a single-threaded server randomly 404s under parallel asset requests)
- speechSynthesis recorder; a fake engine/voice is injected ONLY when the browser has no voices
- gesture driver: every step goes through window.__gesture, the same handler real pointers use
"""
import os, sys, time, json, threading, socketserver, http.server, functools, contextlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGDIR = os.path.join(ROOT, 'tests', 'logs')
os.makedirs(LOGDIR, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


class TServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


@contextlib.contextmanager
def serve(root=ROOT):
    handler = functools.partial(QuietHandler, directory=root)
    srv = TServer(('127.0.0.1', 0), handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    try:
        yield 'http://127.0.0.1:%d/' % srv.server_address[1]
    finally:
        srv.shutdown()


# Recorder + stub. Real engines are kept; a fake voice/engine is added only when getVoices() is empty.
ENV_NOISE = ('net::ERR_NO_BUFFER_SPACE', 'net::ERR_INSUFFICIENT_RESOURCES')
SPEECH_INIT = r"""
(() => {
  window.__speechCalls = [];
  const hasSynth = 'speechSynthesis' in window;
  if (window.__noSpeech) { try { delete window.speechSynthesis; } catch (e) {} try { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); } catch (e) {} return; }
  if (!hasSynth || !window.SpeechSynthesisUtterance) {
    const U = function (t) { this.text = t; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; this.onend = null; this.onerror = null; this.onstart = null; };
    window.SpeechSynthesisUtterance = U;
  }
  const real = hasSynth ? window.speechSynthesis : null;
  let voices = [];
  try { voices = real ? real.getVoices() : []; } catch (e) {}
  const fake = !real || !voices.length;
  if (!fake) {
    const sp = real.speak.bind(real), cc = real.cancel.bind(real);
    real.speak = u => { window.__speechCalls.push({ t: performance.now(), ev: 'speak', text: u.text }); return sp(u); };
    real.cancel = () => { window.__speechCalls.push({ t: performance.now(), ev: 'cancel' }); return cc(); };
    return;
  }
  const V = [{ name: 'Test Ting-Ting', lang: 'zh-CN', voiceURI: 'test-zh', localService: true, default: true }];
  /* the fake engine gets a plain utterance class too, so the fake voice object can be assigned */
  window.SpeechSynthesisUtterance = function (t) { this.text = t; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; this.onend = null; this.onerror = null; this.onstart = null; };
  let cur = null, timer = 0, queue = [];
  const S = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices() { return V; },
    addEventListener() {}, removeEventListener() {},
    resume() {}, pause() {},
    speak(u) {
      window.__speechCalls.push({ t: performance.now(), ev: 'speak', text: u.text });
      queue.push(u); S.pending = queue.length > 1 || !!cur; if (!cur) next();
    },
    cancel() {
      window.__speechCalls.push({ t: performance.now(), ev: 'cancel' });
      clearTimeout(timer); const c = cur; cur = null; queue = []; S.speaking = false; S.pending = false;
      if (c && c.onend) setTimeout(() => c.onend({}), 0);
    },
  };
  function next() {
    cur = queue.shift() || null; S.pending = queue.length > 0;
    if (!cur) { S.speaking = false; return; }
    S.speaking = true;
    const u = cur, dur = window.__fast ? 30 : Math.min(1800, 120 + (u.text || '').length * 110);
    timer = setTimeout(() => { if (cur !== u) return; cur = null; S.speaking = false; if (u.onend) u.onend({}); next(); }, dur);
  }
  try { Object.defineProperty(window, 'speechSynthesis', { value: S, configurable: true }); } catch (e) { window.speechSynthesis = S; }
})();
"""


def new_page(browser, base, vw=1180, vh=820, fast=True, no_speech=False, hint_scale=None, extra_init='', sw=None):
    ctx = browser.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1, has_touch=False,
                              service_workers=('block' if fast else 'allow') if sw is None else sw)
    init = ''
    if fast:
        init += 'window.__fast = 1;'
    if no_speech:
        init += 'window.__noSpeech = 1;'
    if hint_scale:
        init += 'window.__hintScale = %s;' % hint_scale
    ctx.add_init_script(init + SPEECH_INIT + extra_init)
    page = ctx.new_page()
    errors, env = [], []

    def add(msg):
        # Windows runs out of socket buffers when other programs / parallel browser suites hold many connections:
        # a machine problem, not the app. Printed (so it is in every log) and kept apart in page.env_errors.
        if any(k in msg for k in ENV_NOISE):
            env.append(msg)
            print(time.strftime('%H:%M:%S ') + 'ENV-NOISE (machine socket buffers, not the app): ' + msg[:160], flush=True)
            return
        errors.append(msg)
    page.on('pageerror', lambda e: add('pageerror: ' + str(e)))
    page.on('console', lambda m: add('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning', 'assert') and 'blocked by Playwright' not in m.text else None)

    def on_fail(req):
        f = req.failure or ''
        if 'abort' in f.lower() or 'cancel' in f.lower():
            return
        add('requestfailed: %s %s' % (req.url, f))
    page.on('requestfailed', on_fail)
    page.errors = errors
    page.env_errors = env
    page.goto(base + 'index.html')
    page.wait_for_function('window.__ready === true', timeout=20000)
    return page


def enter(page):
    page.click('#play')
    page.wait_for_function("document.querySelector('#map').classList.contains('on')", timeout=10000)


def q(page):
    return page.evaluate('window.__q')


def wait_phase(page, phases=('act', 'ready', 'input'), timeout=15000, gen=None):
    """wait until the current question is answerable (optionally a different question than `gen`)"""
    js = """([ph, gen]) => { const q = window.__q; if (!q) return false; if (gen != null && q.gen === gen) return false; return ph.includes(q.phase); }"""
    page.wait_for_function(js, arg=[list(phases), gen], timeout=timeout, polling=20)
    return q(page)


def step(page, strategy='right'):
    s = page.evaluate('(st) => window.__next(st)', strategy)
    if not s:
        return None
    r = page.evaluate('([g, p]) => window.__gesture(g, p)', [s['g'], s['p']])
    return s, r


def answer_question(page, strategy='right', max_steps=40, timeout=15000):
    """drive the current question with `strategy` until it is submitted; returns the question snapshot at submit"""
    st = wait_phase(page, timeout=timeout)
    gen = st['gen']
    snap = None
    for _ in range(max_steps):
        cur = q(page)
        if not cur or cur['gen'] != gen:
            break
        if cur['submitted']:
            snap = cur
            break
        if cur['phase'] not in ('act', 'ready', 'input'):
            page.wait_for_timeout(15)
            continue
        s = step(page, 'right' if cur.get('guided') else strategy)   # a guided question is followed, like a child being led
        if s is None:
            page.wait_for_timeout(15)
            continue
        page.wait_for_timeout(5)
    if snap is None:
        snap = q(page)
    return gen, snap


def wait_next_question(page, gen, timeout=20000):
    js = """(gen) => { const q = window.__q; return !q || q.gen !== gen; }"""
    page.wait_for_function(js, arg=gen, timeout=timeout, polling=20)


def wait_map(page, timeout=30000):
    """back on the map; when the last world was just mastered the grand finale plays first - leave it with its home button"""
    page.wait_for_function("window.__q === null && ((document.querySelector('#map').classList.contains('on') && !document.querySelector('#game').classList.contains('on')) || Screens.cur === 'finale')", timeout=timeout, polling=50)
    if page.evaluate("Screens.cur === 'finale'"):
        page.evaluate("gesture('home')")
        page.wait_for_function("document.querySelector('#map').classList.contains('on') && Screens.cur === 'map'", timeout=timeout, polling=50)


def state(page):
    return page.evaluate('window.__state()')


def set_state(page, mutate_js):
    """mutate the stored state then reload (tests may write level/stars/mastery fields directly)"""
    page.evaluate("""(js) => { const s = JSON.parse(localStorage.getItem('ddi.v1') || 'null') || window.__state(); (new Function('s', js))(s); localStorage.setItem('ddi.v1', JSON.stringify(s)); }""", mutate_js)
    page.reload()
    page.wait_for_function('window.__ready === true', timeout=20000)


class Log:
    def __init__(self, name):
        self.path = os.path.join(LOGDIR, name + '.log')
        self.f = open(self.path, 'w', encoding='utf-8')
        self.fails = 0
        self.passes = 0
        self.warns = 0

    def ok(self, msg):
        self.passes += 1
        self.w('PASS ' + msg)

    def fail(self, msg):
        self.fails += 1
        self.w('FAIL ' + msg)

    def warn(self, msg):
        self.warns += 1
        self.w('WARN ' + msg)

    def w(self, msg):
        line = time.strftime('%H:%M:%S ') + msg
        print(line, flush=True)
        self.f.write(line + '\n')
        self.f.flush()

    def check(self, cond, msg):
        (self.ok if cond else self.fail)(msg)
        return cond

    def close(self):
        self.w('SUMMARY pass=%d fail=%d warn=%d' % (self.passes, self.fails, self.warns))
        self.f.close()
        return self.fails == 0
