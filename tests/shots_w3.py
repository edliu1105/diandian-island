# -*- coding: utf-8 -*-
"""Screenshots of every sky game (question on screen, and after the right answer's reveal) in both orientations, put on
labelled contact sheets: tests/logs/w3shots/sheet_<L|P>_<n>.png.   usage: python tests/shots_w3.py [level=3] [games,comma]"""
import os, sys
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, step, q

LV = int(sys.argv[1]) if len(sys.argv) > 1 else 3
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 else None
OUT = os.path.join(os.path.dirname(__file__), 'logs', 'w3shots')
os.makedirs(OUT, exist_ok=True)


def shoot(page, w, g, tag, seed=99):
    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, LV, seed])
    wait_phase(page, timeout=30000)
    page.wait_for_timeout(1500)
    a = os.path.join(OUT, tag + '_a.png'); page.screenshot(path=a)
    for i in range(30):
        cur = q(page)
        if not cur or cur['submitted']: break
        if cur['phase'] not in ('act', 'ready', 'input'): page.wait_for_timeout(250); continue
        step(page, 'right'); page.wait_for_timeout(350)
    page.wait_for_timeout(1900)
    b = os.path.join(OUT, tag + '_b.png'); page.screenshot(path=b)
    page.evaluate("gesture('home')"); page.wait_for_timeout(500)
    return a, b


def sheet(files, name, cols=4):
    ims = [(n, Image.open(f).convert('RGB')) for n, f in files]
    w0, h0 = ims[0][1].size; s = 0.36; W, H = int(w0 * s), int(h0 * s)
    rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (cols * (W + 6), rows * (H + 22)), (255, 255, 255)); d = ImageDraw.Draw(sh)
    for i, (n, im) in enumerate(ims):
        x, y = (i % cols) * (W + 6), (i // cols) * (H + 22)
        sh.paste(im.resize((W, H)), (x, y + 18)); d.text((x + 4, y + 2), n, fill=(0, 0, 0))
    sh.save(os.path.join(OUT, name))


with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    for tag, vw, vh in (('L', 1180, 820), ('P', 820, 1180)):
        page = new_page(br, base, vw, vh, fast=False, hint_scale=40)
        enter(page); page.wait_for_timeout(600)
        ids = page.evaluate("() => ORDER3.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        files = []
        for w, g in ids:
            if ONLY and g not in ONLY: continue
            try:
                a, b = shoot(page, w, g, '%s_%s' % (tag, g))
                files += [(g + ' question', a), (g + ' reveal', b)]
            except Exception as e:
                print('ERR', g, str(e)[:200])
                page.evaluate("gesture('home')"); page.wait_for_timeout(500)
        print(tag, 'errors', page.errors[:5])
        for k in range(0, len(files), 16):
            sheet(files[k:k + 16], 'sheet_%s_%d.png' % (tag, k // 16))
        page.context.close()
    br.close()
