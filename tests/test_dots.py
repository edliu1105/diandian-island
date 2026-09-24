# -*- coding: utf-8 -*-
"""V03-b gate: every quantity 1..20, every layout, every drawn size - all dots inside the svg (stroke included),
neighbours never touch; answer cards 1..20 at every card size keep their content inside the card."""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, Log

JS = r"""
() => {
  const bad = [];
  const sizes = [34, 40, 46, 56, 60, 62, 70, 74, 82, 96, 104, 110, 120, 150];
  for (const layout of ['dice', 'frame', 'line', 'pair']) for (let n = 0; n <= 20; n++) for (const w of sizes) {
    if (layout === 'line' && (n > 6 || w < 46)) continue;
    const s = UI.dots(n, w, { layout });
    const vb = s.getAttribute('viewBox').split(' ').map(Number), W = vb[2], H = vb[3];
    const cs = Array.from(s.querySelectorAll('circle')).map(c => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r'), sw: +c.getAttribute('stroke-width') || 0 }));
    const want = n >= 10 ? n % 10 : n;            /* tens are ten-sticks (10 = one stick, 20 = two), the rest dots */
    if (cs.length !== (n === 0 ? 1 : want)) bad.push([layout, n, w, 'count ' + cs.length]);
    cs.forEach(c => { const e = c.r + c.sw / 2; if (c.x - e < -0.01 || c.y - e < -0.01 || c.x + e > W + 0.01 || c.y + e > H + 0.01) bad.push([layout, n, w, 'clipped']); });
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const d = Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y); if (d < cs[i].r + cs[j].r + Math.max(cs[i].sw, 1)) bad.push([layout, n, w, 'touch']); }
  }
  /* answer cards: content inside the card box */
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;'; document.body.appendChild(host);
  for (const size of [90, 110, 120, 132, 140]) for (let n = 0; n <= 20; n++) for (const layout of ['dice', 'frame']) {
    const c = UI.card(n, size, { layout: n > 6 && layout === 'dice' ? 'frame' : layout }); c.style.position = 'absolute'; host.appendChild(c);
    const cr = c.getBoundingClientRect();
    Array.from(c.querySelectorAll('svg.d')).forEach(s => { const r = s.getBoundingClientRect(); if (r.top < cr.top - 1 || r.bottom > cr.bottom + 1 || r.left < cr.left - 1 || r.right > cr.right + 1) bad.push(['card', n, size, layout, 'overflow']); if (r.height < 4) bad.push(['card', n, size, layout, 'squashed']); });
    c.remove();
  }
  host.remove();
  return bad;
}
"""

def main():
    log = Log('dots')
    with sync_playwright() as p, serve() as base:
        for eng in ('chromium', 'webkit'):
            br = getattr(p, eng).launch()
            page = new_page(br, base, 1180, 820, fast=True)
            enter(page)
            for digits in (True, False):
                page.evaluate("(d) => { Store.s.settings.digits = d; }", digits)
                bad = page.evaluate(JS)
                log.check(not bad, '%s digits=%s: dots 1..20 x layouts x sizes clean (%d problems) %s' % (eng, digits, len(bad), bad[:6]))
            br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
