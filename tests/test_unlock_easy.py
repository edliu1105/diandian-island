# -*- coding: utf-8 -*-
"""The client's unlock rule: a world is passed with all four games played once OR 10 stars; the long press on the gear
opens the parent panel directly. usage: python tests/test_unlock_easy.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, wait_next_question, wait_map, Log

log = Log('unlock_easy')
with sync_playwright() as p, serve() as base:
    br = p.chromium.launch()
    # 1. an old save with many stars opens the next island at start-up
    page = new_page(br, base, 1180, 820, fast=True); enter(page)
    page.evaluate("() => { Store.w('peppa').stars = 23; Store.w('bluey').stars = 12; Store.save(); }")
    page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
    st = page.evaluate("() => ({ h: Store.w('huluwa').unlocked, a: Store.w('paw').unlocked })")
    log.check(st['h'] and not st['a'], 'old save with 23 + 12 stars: huluwa opens at start-up, paw not yet %s' % st)
    page.context.close()
    # 2. fresh: every game of peppa and bluey played once (one question each) -> huluwa opens after the session
    page = new_page(br, base, 1180, 820, fast=True); enter(page)
    for w, games in (('peppa', ['P1', 'P2', 'P3', 'P4']), ('bluey', ['B1', 'B2', 'B3', 'B4'])):
        for g in games:
            page.evaluate("([w,g]) => window.__go(w, g, 1, {noDemo: true, seed: 3})", [w, g])
            gen, snap = answer_question(page, 'right', timeout=20000)
            wait_next_question(page, gen, timeout=20000)
            page.evaluate("gesture('home')"); page.wait_for_timeout(80)
    before = page.evaluate("Store.w('huluwa').unlocked")
    page.evaluate("window.__go('peppa', 'P1', 1, {noDemo: true, seed: 4})")
    for i in range(6):
        try:
            gen, snap = answer_question(page, 'right', timeout=20000); wait_next_question(page, gen, timeout=20000)
        except Exception:
            break
    wait_map(page, timeout=60000)
    st = page.evaluate("() => ({ h: Store.w('huluwa').unlocked, stars: Store.w('peppa').stars + Store.w('bluey').stars, played: Store.w('peppa').played })")
    log.check(st['h'], 'fresh save: all 8 games played once -> huluwa opens at the end of the next session %s (open before that session: %s)' % (st, before))
    # 3. the gear
    gb = page.locator('#gear').bounding_box()
    page.mouse.move(gb['x'] + gb['width'] / 2, gb['y'] + gb['height'] / 2); page.mouse.down(); page.wait_for_timeout(1800); page.mouse.up(); page.wait_for_timeout(300)
    txt = page.evaluate("document.querySelector('#parent .sheet h2') && document.querySelector('#parent .sheet h2').textContent")
    log.check(txt == '家长面板', 'long press on the gear opens the parent panel directly (%s)' % txt)
    log.check(not page.errors, 'zero page errors %s' % page.errors[:2])
    br.close()
sys.exit(0 if log.close() else 1)
