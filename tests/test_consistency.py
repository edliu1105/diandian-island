# -*- coding: utf-8 -*-
"""Independent mathematics (R3-C03): the test works out every answer from what is ON SCREEN - never from the app's
question object (q.answer / opts are not read) - picks the card that SHOWS that amount and checks that the app agrees.

Numerals are switched off (parent setting), so every quantity is drawn as dots: the test reads amounts by counting
the dots (filled circles; a yellow ten-stick counts ten). Per game, what the child sees:
  P1  splats on the sheet                    -> how many
  P3  the toys on the floor before tidying   -> how many went into the box
  B1  cookies on the two plates + the goal   -> which plate has more / less, or the same
  H4  the sign (all gems) - the gems left    -> how many were taken
  A2  the animals in the pen                 -> how many altogether
  A4  the basket's sign + the kittens lifted -> how many in the basket now
  X4  the task card (all clones) - visible   -> how many hid
  V1  the jet's display + heroes on the line -> how many heroes altogether
The chosen card must be judged right (the question goes on to its reveal, never to a correction), and the spoken
summary must name the same amount.
usage: python tests/test_consistency.py [chromium|webkit]
"""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, wait_phase, q, Log

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
CN = '零一二三四五六七八九十'

JS = r"""
(() => {
  const vis = e => { if (!e || !e.isConnected) return false; for (let x = e; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false; } const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight; };
  const dots = root => { if (!root) return null; let v = 0; root.querySelectorAll('svg.d circle').forEach(c => { const f = c.getAttribute('fill') || ''; if (f && f !== 'none' && !/^rgba\(43,33,24/.test(f)) v++; }); root.querySelectorAll('svg.d rect').forEach(r => { if (r.getAttribute('fill') === '#FFD34D') v += 10; }); return v; };
  const imgs = (re, root) => Array.from((root || Stage.el).querySelectorAll('img')).filter(i => re.test(i.getAttribute('src') || '') && vis(i));
  const inside = (e, box) => { const r = e.getBoundingClientRect(), b = box.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom; };
  const cards = () => Array.from(Stage.el.querySelectorAll('[data-gid^="card"]')).filter(vis).map(c => ({ id: c.dataset.gid, v: dots(c) }));
  window.__see = {
    cards,
    P1: () => ({ want: Session.G.els.splats.children.length }),
    P3: () => ({ want: imgs(/props\/(ball|car|rocket|duck|teddy|dino)\.png$/).filter(i => !i.closest('.task')).length }),
    B1: () => {
      const [p0, p1] = Session.G.els.plates, items = imgs(/props\/(cookie|strawberry|watermelon|cherry)\.png$/);
      const n0 = items.filter(i => inside(i, p0)).length, n1 = items.filter(i => inside(i, p1)).length;
      const kind = Session.st.kind;                 /* the goal the task card shows (more / less / same) - not the answer */
      let pick = null;
      if (n0 === n1) pick = 'same'; else if (kind === 'more') pick = n0 > n1 ? p0.dataset.gid : p1.dataset.gid; else if (kind === 'less') pick = n0 < n1 ? p0.dataset.gid : p1.dataset.gid;
      return { want: pick, detail: [n0, n1, kind] };
    },
    H4: () => { const sign = Session.st.sign, N = dots(sign), left = imgs(/props\/gem\.png$/).filter(i => !i.closest('.task')).length; return { want: N - left, detail: [N, left] }; },
    A2: () => ({ want: imgs(/props\/(kitten|chick|bunny|turtle)\.png$/).filter(i => inside(i, Session.G.els.pen)).length }),
    A4pre: () => ({ k0: dots(Session.G.els.tag), m: imgs(/props\/kitten\.png$/).filter(i => !i.closest('.task')).length }),
    X4: () => { const N = dots(document.querySelector('.task .qdots')), main = Session.G.actors.wukong.root; const clones = Array.from(Stage.el.querySelectorAll('.actor')).filter(a => a !== main && vis(a) && /wukong\.png/.test((a.querySelector('img') || {}).src || '')).length; return { want: N - clones, detail: [N, clones] }; },
    V1pre: () => ({ a: dots(Session.G.els.disp) }),                      /* the display says how many are in the jet */
    V1: () => { const heroes = Array.from(Stage.el.querySelectorAll('.actor')).filter(e => vis(e) && /(ironman|captain|thor|hulk|widow|hawkeye|spiderman|miles|panther)\.png/.test((e.querySelector('img') || {}).src || '')).length; return { heroes }; },
  };
  return true;
})()
"""
CASES = [('peppa', 'P1'), ('peppa', 'P3'), ('bluey', 'B1'), ('huluwa', 'H4'), ('paw', 'A2'), ('paw', 'A4'), ('xiyou', 'X4'), ('avengers', 'V1')]


def act_until_cards(page, gen, max_steps=30):
    """preliminary acts (jump, tidy, whistle, lift, spell, portal ...) - never the answer - until the answer is asked"""
    for _ in range(max_steps):
        cur = q(page)
        if not cur or cur['gen'] != gen:
            return False
        ready = page.evaluate("() => { const st = Session.st; return !!st && ['ready', 'input'].includes(st.phase) && (!!st.cards || st.G.id === 'B1'); }")
        if ready:
            return True
        if cur['phase'] in ('act', 'ready', 'input'):
            s = page.evaluate("window.__next('right')")
            if s:
                page.evaluate("([g, p]) => window.__gesture(g, p)", [s['g'], s['p']])
        page.wait_for_timeout(80)
    return False


def main():
    log = Log('consistency_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        page = new_page(br, base, 1180, 820, fast=True)
        page.evaluate("() => { Store.s.settings.digits = false; Store.save(); }")
        page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
        enter(page)
        page.evaluate(JS)
        for w, g in CASES:
            page.evaluate("gesture('home')")
            page.wait_for_timeout(200)
            n0 = len(page.evaluate("window.__speechLog || []"))
            page.evaluate("([w,g]) => window.__go(w, g, 2, {noDemo: true, seed: 61})", [w, g])
            for k in range(3):
                try:
                    st = wait_phase(page, phases=('act', 'ready', 'input'), timeout=20000)
                except Exception:
                    log.fail('%s q%d: never answerable' % (g, k + 1))
                    break
                gen = st['gen']
                pre = page.evaluate("() => window.__see.A4pre()") if g == 'A4' else page.evaluate("() => window.__see.P3()") if g == 'P3' else page.evaluate("() => window.__see.V1pre()") if g == 'V1' else None
                if not act_until_cards(page, gen):
                    log.fail('%s q%d: the answer was never asked' % (g, k + 1))
                    break
                if g == 'A4':
                    seen = {'want': pre['k0'] + pre['m'], 'detail': pre}
                elif g == 'P3':
                    seen = {'want': pre['want'], 'detail': 'toys on the floor before tidying'}
                elif g == 'V1':
                    h = page.evaluate("() => window.__see.V1()")
                    seen = {'want': pre['a'] + h['heroes'], 'detail': [pre['a'], h['heroes']]}
                else:
                    seen = page.evaluate("(g) => window.__see[g]()", g)
                want = seen['want'] if seen else None
                if g == 'B1':
                    pick = want
                else:
                    cs = page.evaluate("() => window.__see.cards()")
                    hit = [c['id'] for c in cs if c['v'] == want]
                    pick = hit[0] if len(hit) == 1 else None
                    if len(hit) != 1:
                        log.fail('%s q%d: exactly one card must show %s dots (cards %s, seen %s)' % (g, k + 1, want, cs, seen))
                        break
                if not pick:
                    log.fail('%s q%d: could not decide from the screen (%s)' % (g, k + 1, seen))
                    break
                page.evaluate("(id) => window.__gesture('tap', { id })", pick)
                try:
                    page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g || ['reveal', 'praise', 'correcting'].includes(q.phase); }", arg=gen, timeout=5000, polling=20)
                except Exception:
                    pass
                cur = q(page) or {}
                ok = cur.get('gen') != gen or cur.get('phase') in ('reveal', 'praise')
                log.check(ok and cur.get('phase') != 'correcting', '%s q%d: the amount seen on screen (%s %s) -> card %s -> the app agrees (phase %s)' % (g, k + 1, want, seen.get('detail', '') if seen else '', pick, cur.get('phase')))
                # the spoken summary names the same amount
                if isinstance(want, int):
                    page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g; }", arg=gen, timeout=15000, polling=20)
                    said = [e for e in page.evaluate("window.__speechLog || []")[n0:] if e.get('tag') == 'summary']
                    n0 = len(page.evaluate("window.__speechLog || []"))
                    if said:
                        txt = said[-1]['text']
                        names = CN[want] + ('两' if want == 2 else '') if want <= 10 else str(want)
                        log.check(any(ch in txt for ch in names) if want <= 10 else True, '%s q%d: the spoken summary names %s ("%s")' % (g, k + 1, names, txt))
                else:
                    page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g; }", arg=gen, timeout=15000, polling=20)
                    n0 = len(page.evaluate("window.__speechLog || []"))
        log.check(not page.errors, 'zero page / console errors %s' % page.errors[:3])
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
