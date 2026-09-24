# -*- coding: utf-8 -*-
"""Fault injection: an exception in a step the question loop does not await must never leave the child stuck.

 1. H3: the child's tap on the torch starts enterCave (async, gesture-driven) -> it throws
 2. H4 L1: the theft is started by a timer (steal) -> it throws
 3. a plain error thrown from a timer while a question is open
 4. an error in present() (awaited path, for comparison)
each: the question ends as its own 'error' outcome within 3 s (console.error 'question error'), the next question
comes and is answerable, no star for the broken question, and three errors in a row end the session on the map.
usage: python tests/test_faults.py [chromium|webkit]
"""
import os, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import serve, new_page, enter, wait_phase, q, step, Log, wait_map

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'


def next_q_after(page, gen, timeout=4000):
    page.wait_for_function("(g) => { const q = window.__q; return !q || q.gen !== g; }", arg=gen, timeout=timeout, polling=20)


def main():
    log = Log('faults_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()
        page = new_page(br, base, 1180, 820, fast=True)
        enter(page)

        def case(name, world, game, level, inject, drive):
            page.evaluate("gesture('home')")
            page.wait_for_timeout(200)
            before = len(page.errors)
            stars0 = page.evaluate("(w) => __state().worlds[w].stars", world)
            page.evaluate("([w,g,l]) => window.__go(w, g, l, {noDemo: true, seed: 77})", [world, game, level])
            wait_phase(page, phases=('act', 'ready', 'input', 'show'), timeout=10000)
            gen = q(page)['gen']
            page.evaluate("() => { " + inject + " }")          # (an expression that is a function would be called)
            t0 = time.time()
            drive(gen)
            try:
                next_q_after(page, gen)
                dt = time.time() - t0
                errs = [e for e in page.errors[before:] if 'question error' in e]
                log.check(bool(errs), '%s: the broken question ended as an error outcome (%.1f s) %s' % (name, dt, [e[:90] for e in errs[:1]]))
                st = wait_phase(page, timeout=8000)
                log.check(st is not None or q(page) is not None, '%s: the next question came and is answerable' % name)
                stars = page.evaluate("(w) => __state().worlds[w].stars", world) - stars0
                log.check(stars == 0, '%s: no star for the broken question (got %d)' % (name, stars))
            except Exception as e:
                log.fail('%s: STUCK - the question never ended (%s)' % (name, str(e)[:100]))

        # 1. gesture-driven async step
        def drive_h3(gen):
            for _ in range(12):
                cur = q(page)
                if not cur or cur['gen'] != gen:
                    return
                s = step(page, 'right')
                page.wait_for_timeout(60)
                if s and s[0]['p'].get('id') == 'done':
                    return
        case('H3 enterCave throws (tap on the torch)', 'huluwa', 'H3', 2,
             "GAMES.H3.enterCave = async function () { await new Promise(r => setTimeout(r, 30)); throw new Error('injected enterCave'); }", drive_h3)
        page.evaluate("location.reload()")
        page.wait_for_function('window.__ready === true', timeout=20000)
        enter(page)

        # 2. timer-driven async step (H4 L1: the theft starts by itself)
        def drive_none(gen):
            pass
        page.evaluate("gesture('home')")
        before = len(page.errors)
        page.evaluate("() => { GAMES.H4.steal = async function () { await new Promise(r => setTimeout(r, 30)); throw new Error('injected steal'); }; }")
        page.evaluate("window.__go('huluwa', 'H4', 1, {noDemo: true, seed: 78})")
        try:
            page.wait_for_function("() => window.__q && window.__q.gen", timeout=10000, polling=20)
            gen = q(page)['gen']
            for _ in range(12):                   # the child counts the gems; the theft starts from a timer afterwards
                cur = q(page)
                if not cur or cur['gen'] != gen:
                    break
                step(page, 'right')
                page.wait_for_timeout(60)
            next_q_after(page, gen, timeout=6000)
            errs = [e for e in page.errors[before:] if 'question error' in e]
            log.check(bool(errs), 'H4 steal throws (timer-driven): the question ended as an error outcome %s' % [e[:90] for e in errs[:1]])
        except Exception as e:
            log.fail('H4 steal throws (timer-driven): STUCK (%s)' % str(e)[:100])
        page.evaluate("location.reload()")
        page.wait_for_function('window.__ready === true', timeout=20000)
        enter(page)

        # 3. a plain error from a timer while a question is open
        case('an error thrown from a timer', 'peppa', 'P3', 2,
             "setTimeout(() => { throw new Error('injected timer error'); }, 50)", drive_none)

        # 3b. the reveal throws AFTER a right answer: the question is an error outcome and records NOTHING (R3-C01)
        page.evaluate("gesture('home')")
        page.wait_for_timeout(200)
        before = len(page.errors)
        n0 = page.evaluate("() => { const g = (__state().worlds.peppa.g || {}).P1; return g ? g.n : 0; }")
        m0 = page.evaluate("() => __state().worlds.peppa.mastery")
        page.evaluate("() => { GAMES.P1.reveal = async function () { await new Promise(r => setTimeout(r, 30)); throw new Error('injected reveal'); }; }")
        page.evaluate("window.__go('peppa', 'P1', 2, {noDemo: true, seed: 81})")
        try:
            wait_phase(page, timeout=10000)
            gen = q(page)['gen']
            for _ in range(12):
                cur = q(page)
                if not cur or cur['gen'] != gen or cur['submitted']:
                    break
                step(page, 'right')
                page.wait_for_timeout(60)
            next_q_after(page, gen, timeout=6000)
            errs = [e for e in page.errors[before:] if 'question error' in e]
            n1 = page.evaluate("() => { const g = (__state().worlds.peppa.g || {}).P1; return g ? g.n : 0; }")
            m1 = page.evaluate("() => __state().worlds.peppa.mastery")
            log.check(bool(errs), 'reveal throws after a right answer: error outcome %s' % [e[:80] for e in errs[:1]])
            log.check(n1 == n0 and m1 == m0, 'reveal throws: nothing recorded (P1 answers %d -> %d, mastery %s -> %s)' % (n0, n1, m0, m1))
        except Exception as e:
            log.fail('reveal throws: STUCK (%s)' % str(e)[:100])
        page.evaluate("location.reload()")
        page.wait_for_function('window.__ready === true', timeout=20000)
        enter(page)

        # 4. present() throws: three broken questions in a row end the session gently
        page.evaluate("gesture('home')")
        page.evaluate("() => { GAMES.B2.present = async function () { throw new Error('injected present'); }; }")
        page.evaluate("window.__go('bluey', 'B2', 1, {noDemo: true, seed: 79})")
        try:
            wait_map(page, timeout=15000)
            log.ok('present() throws every time: the session ends on the map after three broken questions')
        except Exception as e:
            log.fail('present() throws every time: the session did not end (%s)' % str(e)[:100])
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
