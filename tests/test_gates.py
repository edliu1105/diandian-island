# -*- coding: utf-8 -*-
"""Parent gate (adults only; a child must not get in) - driven with REAL pointer events on the map's gear.

short tap / 1.2 s hold -> toast only, no gate;  1.6 s hold -> keypad gate (two-digit additions, typed answer);
correct then wrong -> gate closes + 30 s cooldown (persisted: a reload does not clear it);
long press during the cooldown -> toast '请 30 秒后再试' only;  clock moved to 25 s -> still closed, past 30 s -> opens;
the question just asked is never asked again right away (forced collision on Store.s.gate.last);
two correct in a row -> parent panel (语音诊断 + per-world table + 设置);  '关闭' closes it;  mashing '确定' -> closed.
The child's map shows nothing of the parent UI; the gear is >= 88x88 CSS px and tappable over its whole disc.
usage: python tests/test_gates.py [chromium|webkit]      (default: both engines)"""
import os, sys, re
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, Log

ENGINES = [sys.argv[1]] if len(sys.argv) > 1 else ['chromium', 'webkit']
QRE = re.compile(r'^\s*(\d+)\s*\+\s*(\d+)\s*=\s*$')
TOAST_HOLD = '家长你好：请按住小齿轮'
TOAST_COOL = '请 30 秒后再试'
TOAST_WRONG = '答错了，请 30 秒后再试'

# per page load: when the finger went down on the gear, when #parent turned on
RECORDER = r"""() => {
  if (window.__gt) return true;
  const G = window.__gt = { down: null, open: null };
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('#gear')) { G.down = performance.now(); G.open = null; } }, true);
  const P = document.getElementById('parent');
  new MutationObserver(() => { if (P.classList.contains('on') && G.open == null) G.open = performance.now(); }).observe(P, { attributes: true, attributeFilter: ['class'] });
  return true;
}"""

GATE = r"""() => {
  const P = document.getElementById('parent'), sh = P.querySelector('.sheet');
  const qs = Array.from(sh.querySelectorAll('.q')).map(e => e.textContent);
  let saved = null; try { saved = JSON.parse(localStorage.getItem('ddi.v1')).gate; } catch (e) {}
  return { on: P.classList.contains('on'), shown: getComputedStyle(P).display !== 'none',
           h2: Array.from(sh.querySelectorAll('h2')).map(e => e.textContent).join('|'), q: qs[0] || '', out: qs[1] || '',
           keys: Array.from(sh.querySelectorAll('.opts button')).map(b => b.textContent), empty: sh.childElementCount === 0,
           last: Store.s.gate.last, cool: Store.s.gate.cool, saved, now: Date.now(),
           map: document.getElementById('map').classList.contains('on') };
}"""

TOAST = r"""() => { const t = document.getElementById('toast'); return { on: t.classList.contains('on'), shown: getComputedStyle(t).display !== 'none', text: t.textContent }; }"""
TOAST_RESET = r"""() => { const t = document.getElementById('toast'); t.classList.remove('on'); t.textContent = ''; }"""

GEAR = r"""() => {
  const g = document.getElementById('gear'), r = g.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = Math.min(r.width, r.height) / 2 - 4;
  const pts = [[0, 0]]; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
  const miss = pts.filter(([dx, dy]) => { const h = document.elementFromPoint(cx + dx, cy + dy); return !(h && (h === g || g.contains(h))); })
                  .map(([dx, dy]) => [Math.round(dx), Math.round(dy)]);
  return { w: r.width, h: r.height, R, miss, inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, aria: g.getAttribute('aria-label') };
}"""

# anything saying 家长 that the child can see on the map (text, pseudo content, labels) outside #parent / #toast;
# the gear's own aria-label is the one allowed exception
LEAK = r"""() => {
  const bad = [];
  const shown = e => {
    for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false; }
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
  };
  const inside = e => !!e.closest('#parent, #toast');
  const name = e => '<' + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '>';
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const e = n.parentElement;
    if (!n.nodeValue.includes('家长') || !e || inside(e)) continue;
    if (shown(e)) bad.push('text "' + n.nodeValue.trim().slice(0, 30) + '" in ' + name(e));
  }
  for (const e of document.body.querySelectorAll('*')) {
    if (inside(e) || !shown(e)) continue;
    for (const a of ['aria-label', 'title', 'alt', 'placeholder', 'aria-description']) {
      const v = e.getAttribute(a);
      if (v && v.includes('家长') && !(e.id === 'gear' && a === 'aria-label')) bad.push(a + '="' + v + '" on ' + name(e));
    }
    for (const ps of ['::before', '::after']) { const c = getComputedStyle(e, ps).content; if (c && c.includes('家长')) bad.push('css ' + ps + ' on ' + name(e)); }
  }
  if (document.title.includes('家长')) bad.push('title');
  return { bad, parentShown: getComputedStyle(document.getElementById('parent')).display !== 'none',
           toastShown: getComputedStyle(document.getElementById('toast')).display !== 'none', map: document.getElementById('map').classList.contains('on') };
}"""

# "move the clock": Date.now() returns `target` right now and keeps ticking from there
CLOCK = r"""(target) => {
  if (!window.__realNow) { const rn = Date.now.bind(Date); window.__realNow = rn; window.__dtOff = 0; Date.now = () => rn() + window.__dtOff; }
  window.__dtOff = target - window.__realNow();
  return Date.now();
}"""

# the next gate question: its first two random draws reproduce exactly the question asked last (a+b = Store.s.gate.last)
FORCE_REPEAT = r"""() => {
  const m = /^(\d+)\+(\d+)$/.exec(Store.s.gate.last); if (!m) return null;
  const a = +m[1], b = +m[2], ra = (a - 12 + 0.5) / 60, rb = (b - 11 + 0.5) / 30;
  const f = window.__forced = { last: Store.s.gate.last, queue: [ra, rb, ra, rb], used: 0 };
  const orig = Parent.makeQ;
  Parent.makeQ = function () {
    const R = Math.random;
    Math.random = () => { if (f.queue.length) { f.used++; return f.queue.shift(); } return R(); };
    try { return orig.call(this); } finally { Math.random = R; Parent.makeQ = orig; }
  };
  return f.last;
}"""


def press(page, ms):
    """real mouse: down on the gear's centre, hold `ms`, up. Returns (gate open while still held, toast, timing)"""
    b = page.locator('#gear').bounding_box()
    x, y = b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
    page.evaluate(TOAST_RESET)
    page.mouse.move(x, y)
    page.mouse.down()
    page.wait_for_timeout(ms)
    during = page.evaluate("document.getElementById('parent').classList.contains('on')")
    page.mouse.up()
    page.wait_for_timeout(60)
    return during, page.evaluate(TOAST), page.evaluate('window.__gt')


def key(page, k):
    page.locator('#parent .opts button').filter(has_text=re.compile('^' + re.escape(k) + '$')).click()


def type_answer(page, s):
    for ch in s:
        key(page, ch)


def question(log, E, st, asked, label):
    m = QRE.match(st['q'])
    if not log.check(bool(m), E + '%s: question text "%s" parsed' % (label, st['q'])):
        return None
    a, b = int(m.group(1)), int(m.group(2))
    k = '%d+%d' % (a, b)
    log.check(10 <= a <= 99 and 10 <= b <= 99, E + '%s: two two-digit numbers (%s)' % (label, k))
    log.check(st['last'] == k, E + '%s: Store.s.gate.last = "%s" is the question shown' % (label, st['last']))
    if asked:
        log.check(asked[-1] != k, E + '%s: "%s" differs from the question before it ("%s")' % (label, k, asked[-1]))
    asked.append(k)
    return a + b


def leak_check(page, log, E, where):
    r = page.evaluate(LEAK)
    log.check(r['map'] and not r['bad'] and not r['parentShown'] and not r['toastShown'],
              E + '%s: nothing of the parent UI visible on the map (leaks %s, #parent shown %s, #toast shown %s)' % (where, r['bad'][:4], r['parentShown'], r['toastShown']))


def run(p, eng, base, log):
    E = eng + ': '
    br = getattr(p, eng).launch()
    page = new_page(br, base, 1180, 820, fast=True)
    enter(page)
    page.evaluate(RECORDER)
    asked = []

    # ---- the child's map
    g = page.evaluate(GEAR)
    log.check(g['w'] >= 88 and g['h'] >= 88, E + 'gear box %.0fx%.0f CSS px (>= 88x88)' % (g['w'], g['h']))
    log.check(g['inView'] and not g['miss'], E + 'gear: centre + 8 points at r=%.0f px all hit the gear, inside the viewport (missed %s)' % (g['R'], g['miss']))
    leak_check(page, log, E, 'map on entry')

    # ---- short tap, and a 1.2 s hold: a toast, never the gate
    during, t, _ = press(page, 150)
    log.check(t['on'] and t['shown'] and t['text'] == TOAST_HOLD, E + 'short tap (150 ms) -> toast on "%s"' % t['text'])
    page.wait_for_timeout(1900)
    st = page.evaluate(GATE)
    log.check(not during and not st['on'] and not st['shown'], E + 'short tap -> no gate, also after the 1.6 s mark')
    during, t, _ = press(page, 1200)
    page.wait_for_timeout(800)
    st = page.evaluate(GATE)
    log.check(t['on'] and t['text'] == TOAST_HOLD and not during and not st['on'], E + '1.2 s hold -> toast "%s", no gate' % t['text'])

    # ---- long press -> keypad gate
    during, t, gt = press(page, 1900)
    st = page.evaluate(GATE)
    ms = (gt['open'] - gt['down']) if gt and gt.get('open') is not None and gt.get('down') is not None else None
    log.check(during and st['on'] and st['shown'], E + 'long press (1.9 s) -> gate open while still held')
    log.check(ms is not None and 1550 <= ms <= 2000, E + 'gate opened %s ms after the finger went down (1.6 s hold)' % (None if ms is None else round(ms)))
    log.check(st['h2'] == '家长验证（1/2）', E + 'gate title "%s"' % st['h2'])
    log.check(sorted(st['keys']) == sorted(list('1234567890') + ['⌫', '确定']), E + 'on-screen keypad: digits 0-9, ⌫, 确定 %s' % st['keys'])
    ans = question(log, E, st, asked, 'gate 1 Q1')
    if ans is None:
        br.close(); return
    s = str(ans)
    type_answer(page, s)
    key(page, '⌫')
    out1 = page.evaluate(GATE)['out']
    key(page, s[-1])
    out2 = page.evaluate(GATE)['out']
    log.check(out1 == s[:-1] and out2 == s, E + 'typed %s, ⌫ -> "%s", retyped -> "%s"' % (s, out1, out2))
    key(page, '确定')
    st = page.evaluate(GATE)
    log.check(st['on'] and st['h2'] == '家长验证（2/2）', E + 'correct answer -> second question ("%s", "%s")' % (st['h2'], st['q']))
    ans2 = question(log, E, st, asked, 'gate 1 Q2')
    if ans2 is None:
        br.close(); return

    # ---- a wrong answer closes the gate and starts the 30 s cooldown
    type_answer(page, str(ans2 + 1))
    key(page, '确定')
    st = page.evaluate(GATE)
    t = page.evaluate(TOAST)
    left = st['cool'] - st['now']
    log.check(not st['on'] and not st['shown'] and st['empty'], E + 'wrong answer (%d for %s) -> gate closed, sheet emptied' % (ans2 + 1, asked[-1]))
    log.check(t['on'] and t['text'] == TOAST_WRONG, E + 'wrong answer -> toast "%s"' % t['text'])
    log.check(28000 < left <= 30000, E + 'cooldown Store.s.gate.cool = now + %d ms (30 s)' % left)
    log.check(bool(st['saved']) and st['saved'].get('cool') == st['cool'], E + 'cooldown persisted in localStorage (%s)' % st['saved'])

    # ---- long press during the cooldown: toast only
    during, t, _ = press(page, 1900)
    st = page.evaluate(GATE)
    log.check(not during and not st['on'] and t['on'] and t['text'] == TOAST_COOL, E + 'long press during the cooldown -> no gate, toast "%s"' % t['text'])

    # ---- a reload (relaunch) does not clear the cooldown
    st = page.evaluate(GATE)
    if st['cool'] - st['now'] > 5000:
        page.reload()
        page.wait_for_function('window.__ready === true', timeout=20000)
        enter(page)
        page.evaluate(RECORDER)
        during, t, _ = press(page, 1900)
        st = page.evaluate(GATE)
        log.check(not during and not st['on'] and t['text'] == TOAST_COOL, E + 'after a reload, still in the cooldown -> no gate, toast "%s"' % t['text'])
    else:
        log.warn(E + 'reload check skipped: less than 5 s of cooldown left')

    # ---- move the clock: 25 s after the wrong answer still closed, past 30 s open again
    cool = page.evaluate('Store.s.gate.cool')
    page.evaluate(CLOCK, cool - 5000)
    during, t, _ = press(page, 1900)
    st = page.evaluate(GATE)
    log.check(not during and not st['on'] and t['text'] == TOAST_COOL, E + 'clock at 25 s after the wrong answer -> still closed, toast "%s"' % t['text'])
    page.evaluate(CLOCK, cool + 500)
    forced = page.evaluate(FORCE_REPEAT)
    during, t, _ = press(page, 1900)
    st = page.evaluate(GATE)
    f = page.evaluate('window.__forced')
    log.check(during and st['on'] and st['h2'] == '家长验证（1/2）', E + 'clock past the 30 s cooldown -> the gate opens again')
    log.check(bool(f) and f['used'] == 4 and st['q'].replace(' ', '').rstrip('=') != forced,
              E + 'forced repeat of the last question "%s": both repeat draws rejected (%s draws used), shown "%s"' % (forced, f and f['used'], st['q']))
    ans = question(log, E, st, asked, 'gate 2 Q1')
    if ans is None:
        br.close(); return
    type_answer(page, str(ans)); key(page, '确定')
    st = page.evaluate(GATE)
    log.check(st['on'] and st['h2'] == '家长验证（2/2）', E + 'gate 2: first correct -> second question, not yet the panel')
    ans = question(log, E, st, asked, 'gate 2 Q2')
    if ans is None:
        br.close(); return
    type_answer(page, str(ans)); key(page, '确定')

    # ---- the parent panel
    pn = page.evaluate(r"""() => {
      const sh = document.querySelector('#parent .sheet');
      const h3 = Array.from(sh.querySelectorAll('h3'));
      const d = h3.find(e => e.textContent === '语音诊断');
      return { on: document.getElementById('parent').classList.contains('on'),
               h2: Array.from(sh.querySelectorAll('h2')).map(e => e.textContent), h3: h3.map(e => e.textContent),
               diag: d && d.nextElementSibling ? d.nextElementSibling.textContent : '',
               rows: Array.from(sh.querySelectorAll('table tr')).slice(1).map(tr => tr.firstElementChild.textContent),
               cols: Array.from(sh.querySelectorAll('table th')).map(e => e.textContent),
               worlds: ORDER.map(id => WORLDS[id].name), floors: sh.querySelectorAll('table select').length,
               buttons: Array.from(sh.querySelectorAll('button')).map(b => b.textContent), keypad: sh.querySelectorAll('.opts button').length };
    }""")
    log.check(pn['on'] and pn['h2'] == ['家长面板'] and pn['keypad'] == 0, E + 'two correct in a row -> parent panel %s' % pn['h2'])
    log.check('语音诊断' in pn['h3'] and '系统声音' in pn['diag'] and '引擎活动' in pn['diag'], E + 'panel: voice diagnostics section "%s"' % pn['diag'][:70])
    log.check(pn['rows'] == pn['worlds'] and pn['floors'] == len(pn['worlds']) and '难度下限' in pn['cols'],
              E + 'panel: per-world progress table, one row per world %s with a floor selector each (%d)' % (pn['rows'], pn['floors']))
    want = ['全部解锁', '清空进度', '测试发声', '关闭']
    log.check('设置' in pn['h3'] and all(w in pn['buttons'] for w in want) and any(b.startswith('数字显示') for b in pn['buttons']),
              E + 'panel: settings %s' % [b for b in pn['buttons'] if b not in ('我听见了',)])
    page.locator('#parent .sheet button.x').filter(has_text='关闭').click()
    st = page.evaluate(GATE)
    log.check(not st['on'] and not st['shown'] and st['empty'] and st['map'], E + "'关闭' closes the panel, back on the map")
    leak_check(page, log, E, 'map after the panel closed')

    # ---- a child mashing '确定' (empty input) never gets in
    during, t, _ = press(page, 1900)
    st0 = page.evaluate(GATE)
    question(log, E, st0, asked, 'gate 3 Q1')
    key(page, '确定')
    st = page.evaluate(GATE)
    log.check(during and st0['on'] and not st['on'] and st['cool'] - st['now'] > 28000,
              E + "mashing '确定' with nothing typed -> gate closed, cooldown %d ms" % (st['cool'] - st['now']))
    log.check(len(asked) == 5 and all(a != b for a, b in zip(asked, asked[1:])), E + 'no question asked twice in a row over the run %s' % asked)
    page.wait_for_timeout(2600)                    # the last toast fades
    leak_check(page, log, E, 'map at the end')
    log.check(not page.errors, E + 'zero page/console errors %s' % page.errors[:4])
    br.close()


def main():
    log = Log('gates' if len(ENGINES) > 1 else 'gates_' + ENGINES[0])
    with sync_playwright() as p, serve() as base:
        for eng in ENGINES:
            try:
                run(p, eng, base, log)
            except Exception as e:
                log.fail('%s: exception %s' % (eng, str(e).splitlines()[0][:200] if str(e) else repr(e)))
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
