# -*- coding: utf-8 -*-
"""World 4, five options and the explain step: screenshots of every game - its question with the options, the explain step
part way (the one he chose ringed blue, ~1 s in) and at its end (the right one ringed gold) - in landscape 1180 x 820 (L1
and L5) and portrait 820 x 1180 (L3). Real time (no fast mode), so the shots show what a child sees. Every game's shots go
on one contact sheet. Out: tests/logs/w4opt/<game>_<L|P><level>_<opt|mid|end>.jpg and sheet_<game>.jpg.
usage: python tests/shots_w4opt.py [jobs=3]        W4_ONLY=F1,F2 for some games, W4_SHOTS=1180x820x4,820x1180x5 other sizes / levels"""
import os, sys
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_w4 import XWRAP, load_games, answer_fully

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tests', 'logs', 'w4opt')
SIZES = [(1180, 820, 1, 'L'), (1180, 820, 5, 'L'), (820, 1180, 3, 'P')]
if os.environ.get('W4_SHOTS'):          # e.g. W4_SHOTS=1180x820x4,820x1180x5 (width x height x level)
    SIZES = [(int(w), int(h), int(l), 'L' if int(w) > int(h) else 'P') for w, h, l in (x.split('x') for x in os.environ['W4_SHOTS'].split(','))]


def shoot(args):
    ids, = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_phase
    done = []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch()
        for vw, vh, lv, tag in SIZES:
            page = new_page(br, base, vw, vh, fast=False, sw='block'); enter(page)
            load_games(page); page.evaluate(XWRAP)
            for w, g in ids:
                name = '%s_%s%d' % (g, tag, lv)
                try:
                    page.evaluate("window.__xr = null; window.__xhold = true; window.__xrel = null")
                    page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 11})", [w, g, lv])
                    wait_phase(page, timeout=60000); page.wait_for_timeout(900)
                    page.screenshot(path=os.path.join(OUT, name + '_opt.jpg'), type='jpeg', quality=86)
                    answer_fully(page, 'wrong')
                    page.wait_for_function("window.__xr && performance.now() - window.__xr.t0 > 1000", timeout=60000, polling=50)
                    page.screenshot(path=os.path.join(OUT, name + '_mid.jpg'), type='jpeg', quality=86)
                    page.wait_for_function("window.__xr && window.__xr.ms != null", timeout=60000, polling=50)
                    page.wait_for_timeout(250)
                    page.screenshot(path=os.path.join(OUT, name + '_end.jpg'), type='jpeg', quality=86)
                    x = page.evaluate("window.__xr")
                    done.append('%s %s explain %.1f s right gold %s chosen %s said %s %s' % (name, 'ok' if x.get('rightOk') else 'NO GOLD', (x.get('ms') or 0) / 1000.0, x.get('rightOk'), x.get('chosen'), x.get('said'), page.errors[-1:] if page.errors else ''))
                except Exception as e:
                    done.append('%s FAILED %s' % (name, str(e)[:200]))
                page.evaluate("window.__xhold = false; if (window.__xrel) window.__xrel()")
                page.wait_for_timeout(200)
                page.evaluate("gesture('home')"); page.wait_for_timeout(300)
            page.context.close()
        br.close()
    return done


def sheet(g):
    from PIL import Image
    rows = []
    for vw, vh, lv, tag in SIZES:
        ims = []
        for k in ('opt', 'mid', 'end'):
            f = os.path.join(OUT, '%s_%s%d_%s.jpg' % (g, tag, lv, k))
            if os.path.exists(f):
                im = Image.open(f).convert('RGB'); ims.append(im.resize((int(im.width * 0.42), int(im.height * 0.42))))
        if ims: rows.append(ims)
    if not rows: return
    W = max(sum(i.width for i in r) + 8 * (len(r) - 1) for r in rows); H = sum(max(i.height for i in r) for r in rows) + 8 * (len(rows) - 1)
    S = Image.new('RGB', (W, H), (40, 40, 40)); y = 0
    for r in rows:
        x = 0
        for i in r: S.paste(i, (x, y)); x += i.width + 8
        y += max(i.height for i in r) + 8
    S.save(os.path.join(OUT, ('sheet_%s_more.jpg' if os.environ.get('W4_SHOTS') else 'sheet_%s.jpg') % g), quality=82)


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = page.evaluate("() => ORDER4.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        br.close()
    only = os.environ.get('W4_ONLY')
    if only: ids = [x for x in ids if x[1] in only.split(',')]
    with Pool(jobs) as pool:
        for part in pool.map(shoot, [(ids[i::jobs],) for i in range(jobs)]):
            for line in part: print(line, flush=True)
    for w, g in ids: sheet(g)
    print('shots in', OUT)


if __name__ == '__main__':
    main()
