# -*- coding: utf-8 -*-
"""Real-run screenshots for a review round (labelled contact sheets are built afterwards).
usage: python tests/shots_review.py <outdir> <engine> <games: world:game:level,...> [portrait games]
"""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, step, q

out = sys.argv[1]
engine = sys.argv[2] if len(sys.argv) > 2 else 'webkit'
games = [x.split(':') for x in (sys.argv[3] if len(sys.argv) > 3 else 'peppa:P1:1').split(',') if x]
pgames = [x.split(':') for x in (sys.argv[4] if len(sys.argv) > 4 else '').split(',') if x]
os.makedirs(out, exist_ok=True)


def shoot_game(page, w, g, lv, tag):
    page.evaluate("([w,g,l]) => window.__go(w, g, Number(l), {noDemo: true, seed: 99})", [w, g, lv])
    wait_phase(page, timeout=25000)
    for i in range(10):
        cur = q(page)
        if cur and cur['phase'] in ('ready', 'input'):
            break
        if cur and cur['phase'] == 'act':
            step(page, 'right')
        page.wait_for_timeout(700)
    page.wait_for_timeout(1400)
    page.screenshot(path=os.path.join(out, tag + '_ready.png'))
    for i in range(16):
        cur = q(page)
        if not cur or cur['submitted']:
            break
        if cur['phase'] not in ('act', 'ready', 'input'):
            page.wait_for_timeout(300)
            continue
        step(page, 'right')
        page.wait_for_timeout(450)
    page.wait_for_timeout(1700)
    page.screenshot(path=os.path.join(out, tag + '_reveal.png'))
    page.evaluate("gesture('home')")
    page.wait_for_timeout(800)


with sync_playwright() as p, serve() as base:
    br = getattr(p, engine).launch()
    page = new_page(br, base, 1180, 820, fast=False)
    page.wait_for_timeout(600)
    page.screenshot(path=os.path.join(out, 'L_entry.png'))
    enter(page)
    page.wait_for_timeout(1800)
    page.screenshot(path=os.path.join(out, 'L_map.png'))
    page.evaluate("MapView.tapIsland('peppa')")
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(out, 'L_panel.png'))
    page.evaluate("MapView.closePanel(true)")
    for w, g, lv in games:
        shoot_game(page, w, g, lv, 'L_%s_%s_L%s' % (w, g, lv))
    # parent gate: a real long press on the gear
    gb = page.locator('#gear').bounding_box()
    page.mouse.move(gb['x'] + gb['width'] / 2, gb['y'] + gb['height'] / 2)
    page.mouse.down()
    page.wait_for_timeout(1800)
    page.mouse.up()
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(out, 'L_parentgate.png'))
    page.evaluate("Parent.close()")
    errs = list(page.errors)
    page.context.close()
    if pgames:
        page = new_page(br, base, 820, 1180, fast=False)
        enter(page)
        page.wait_for_timeout(1800)
        page.screenshot(path=os.path.join(out, 'P_map.png'))
        for w, g, lv in pgames:
            shoot_game(page, w, g, lv, 'P_%s_%s_L%s' % (w, g, lv))
        errs += page.errors
    print('errors:', errs)
    br.close()
