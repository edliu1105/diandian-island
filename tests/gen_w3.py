# -*- coding: utf-8 -*-
"""World 3 generators: every game, difficulty 1-5, 300 seeds - the question has an answer, an answer that is one of the
choices (card games), and there are enough different questions for "a new one after a mistake".
usage: python tests/gen_w3.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, Log
log = Log('gen_w3')
JS = r"""() => {
  const out = [];
  for (const w of ORDER3) for (const id of WORLDS[w].games) {
    const g = GAMES[id];
    for (let lv = 1; lv <= 5; lv++) {
      const keys = new Set(); let bad = null;
      for (let s = 1; s <= 300 && !bad; s++) {
        const G = { rng: RNG(s * 7919 + lv), bags: {}, ws: Store.w(w), id, world: w, W: WORLDS[w] };
        let q; try { q = g.gen(G, { level: lv, kind: g.kind0, rng: G.rng }); } catch (e) { bad = 'throw ' + e.message; break; }
        keys.add(g.key(q));
        if (q.answer == null || q.answer === -1 || q.answer === '' || (typeof q.answer === 'number' && isNaN(q.answer))) bad = 'no answer ' + JSON.stringify(q.k);
        else if (q.opts && Array.isArray(q.opts) && typeof q.opts[0] === 'number' && typeof q.answer === 'number' && !q.opts.includes(q.answer) && q.answer >= q.opts.length) bad = 'answer not in opts ' + JSON.stringify(q.k);
      }
      out.push([id, lv, bad, keys.size]);
    }
  }
  return out;
}"""
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
    for id, lv, bad, n in page.evaluate(JS):
        log.check(not bad and n >= 3, '%s L%d: answers valid, %d different questions %s' % (id, lv, n, bad or ''))
    log.check(not page.errors, 'no page errors %s' % page.errors[:3])
    br.close()
sys.exit(0 if log.close() else 1)
