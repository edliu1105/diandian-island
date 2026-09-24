# -*- coding: utf-8 -*-
"""A device without any speech engine (window.speechSynthesis and the utterance classes gone before the app loads).
For every world, one full session of its first game at level 1 is played ('right' answers) and must return to the map.
Checks: zero page errors; every narration item is logged as ev 'nosynth' and nothing is ever handed to an engine;
the counting channel still runs (speech log ch 'count'); html.nosound is set and the big #nosound retry target is
displayed on the map (and tapping it is harmless).
Natural unlock (R3-U01): from a fresh save, with no speech engine at all, a child who plays Peppa's and Bluey's games
correctly clears both worlds the normal way (P4's Give-N is shown as dots and recorded as its own seen kind) and the
third world opens - nothing is unlocked by the test.
usage: python tests/test_nospeech.py [chromium|webkit]      (default: both engines)"""
import os, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question, wait_map, Log

ENGINES = [sys.argv[1]] if len(sys.argv) > 1 else ['chromium', 'webkit']
# no_speech=True removes window.speechSynthesis; a device without an engine has no utterance classes either
NO_UTTER = ''.join("try { delete window.%s; } catch (e) {} " % c for c in ('SpeechSynthesisUtterance', 'SpeechSynthesisEvent', 'SpeechSynthesisErrorEvent', 'SpeechSynthesisVoice'))

ENV = r"""() => ({ synth: typeof window.speechSynthesis, utter: typeof window.SpeechSynthesisUtterance, app: String(Voice.synth), audio: typeof (window.AudioContext || window.webkitAudioContext) })"""

NOSOUND = r"""() => {
  const b = document.getElementById('nosound'), cs = getComputedStyle(b), r = b.getBoundingClientRect();
  const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { cls: document.documentElement.classList.contains('nosound'), disp: cs.display, w: Math.round(r.width), h: Math.round(r.height),
           hit: !!h && (h === b || b.contains(h)), scr: document.body.dataset.scr, silent: Voice.silent };
}"""

# speech log entries after id `from`
SPEECH = r"""(from) => {
  const all = window.__speechLog, L = all.filter(e => e.id > from);
  const n = f => L.filter(f).length;
  return { maxId: all.length ? all[all.length - 1].id : from,
           count: n(e => e.ch === 'count'), words: L.filter(e => e.ch === 'count' && e.tag !== 'fallback').map(e => e.text).slice(0, 10),
           nosynth: n(e => e.ch === 'narr' && e.ev === 'nosynth'), speak: n(e => e.ch === 'narr' && e.ev === 'speak'),
           tags: Array.from(new Set(L.filter(e => e.ev === 'nosynth').map(e => e.tag))), first: L.filter(e => e.tag === 'first').map(e => e.ev),
           retry: L.filter(e => e.tag === 'retry').map(e => e.ev), calls: (window.__speechCalls || []).length, stats: Count.stats() };
}"""


def play_session(page, w, g):
    """one full session; returns (questions answered, back on the map)"""
    page.evaluate("([w, g]) => window.__go(w, g, 1, {noDemo: true, seed: 7})", [w, g])
    nq, last = 0, None
    while nq < 40:
        try:
            wait_phase(page, timeout=20000, gen=last)
        except Exception:
            break
        gen, snap = answer_question(page, 'right')
        nq, last = nq + 1, gen
        wait_next_question(page, gen, timeout=25000)
        if page.evaluate('window.__q === null'):
            break
    try:
        wait_map(page, timeout=30000)
        return nq, True
    except Exception:
        return nq, False


def run(p, eng, base, log):
    E = eng + ': '
    br = getattr(p, eng).launch()
    page = new_page(br, base, 1180, 820, fast=True, no_speech=True, extra_init=NO_UTTER)
    env = page.evaluate(ENV)
    if not log.check(env['synth'] == 'undefined' and env['utter'] == 'undefined' and env['app'] in ('undefined', 'null'),
                     E + 'setup: no speech engine in the page %s' % env):
        br.close(); return
    enter(page)
    sp = page.evaluate(SPEECH, 0)
    ns = page.evaluate(NOSOUND)
    log.check(sp['first'] == ['nosynth'], E + "entry: the first sentence is logged as 'nosynth' %s" % sp['first'])
    log.check(ns['cls'] and ns['disp'] != 'none' and ns['hit'] and ns['w'] >= 88,
              E + 'entry: html.nosound set, #nosound displayed on the map (%s, %dx%d, on top %s)' % (ns['disp'], ns['w'], ns['h'], ns['hit']))
    last_id, total_count, total_nosynth, total_speak = sp['maxId'], sp['count'], sp['nosynth'], sp['speak']
    worlds = page.evaluate('ORDER')
    for w in worlds:
        g = page.evaluate('(w) => WORLDS[w].games[0]', w)
        before = len(page.errors)
        t0 = time.time()
        try:
            nq, back = play_session(page, w, g)
        except Exception as e:
            log.fail(E + '%s %s L1: exception %s' % (w, g, str(e).splitlines()[0][:160]))
            try:
                page.evaluate("gesture('home')")
            except Exception:
                pass
            continue
        page.wait_for_timeout(600)                                  # the stars fly into the lantern (counted) on the map
        sp = page.evaluate(SPEECH, last_id)
        ns = page.evaluate(NOSOUND)
        last_id = sp['maxId']
        total_count += sp['count']; total_nosynth += sp['nosynth']; total_speak += sp['speak']
        new = page.errors[before:]
        log.check(back and nq >= 3, E + '%s %s L1: full session, %d questions, back on the map (%.1f s)' % (w, g, nq, time.time() - t0))
        log.check(not new, E + '%s %s L1: zero page/console errors %s' % (w, g, new[:3]))
        log.check(sp['nosynth'] > 0 and sp['speak'] == 0, E + "%s %s L1: %d narration items logged 'nosynth', %d handed to an engine (tags %s)" % (w, g, sp['nosynth'], sp['speak'], sp['tags'][:8]))
        log.check(ns['cls'] and ns['disp'] != 'none' and ns['scr'] == 'map' and ns['hit'], E + '%s: back on the map html.nosound=%s, #nosound display=%s, on top %s' % (w, ns['cls'], ns['disp'], ns['hit']))
        log.w('%s   %s counting channel: %d entries %s, Count %s' % (eng, w, sp['count'], sp['words'], sp['stats']))

    # ---- the child taps the big "no sound" target: harmless without an engine
    before = len(page.errors)
    page.click('#nosound')
    page.wait_for_timeout(200)
    sp = page.evaluate(SPEECH, last_id)
    log.check(sp['retry'] == ['nosynth'] and not page.errors[before:], E + "tap on #nosound -> retry logged %s, no error %s" % (sp['retry'], page.errors[before:][:2]))
    st = sp['stats']
    log.check(total_count > 0, E + "counting channel still works: %d speech log entries with ch 'count' over the run" % total_count)
    log.check(total_nosynth > 0 and total_speak == 0 and sp['calls'] == 0,
              E + "narration: %d items logged 'nosynth', %d 'speak', %d engine calls" % (total_nosynth, total_speak, sp['calls']))
    if st['played'] > 0:
        log.ok(E + 'counting words played through Web Audio mp3s: %s' % st)
    elif env['audio'] == 'undefined':
        log.warn(E + 'this browser build has no Web Audio: counting words fell back to the (absent) narration engine, silent here %s' % st)
    else:
        log.fail(E + 'Web Audio present but no counting word was played %s' % st)
    log.check(not page.errors, E + 'zero page/console errors over the run %s' % page.errors[:4])

    # ---- natural unlock without any speech engine: fresh save, the games as they come, right answers
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_function('window.__ready === true', timeout=20000)
    enter(page)
    for w in ('peppa', 'bluey'):
        games = page.evaluate('(w) => WORLDS[w].games', w)
        sess = 0
        while sess < 40 and not page.evaluate('(w) => __state().worlds[w].cleared', w):
            g = games[sess % 4]
            page.evaluate("([w, g, s]) => window.__go(w, g, 0, {noDemo: true, seed: s})", [w, g, 900 + sess])
            try:
                for _ in range(40):
                    try:
                        wait_phase(page, timeout=20000)
                    except Exception:
                        break
                    gen, snap = answer_question(page, 'right')
                    wait_next_question(page, gen, timeout=25000)
                    if page.evaluate("document.querySelector('#map').classList.contains('on') && !document.querySelector('#game').classList.contains('on')"):
                        break
                wait_map(page, timeout=30000)
            except Exception as e:
                log.fail(E + 'natural unlock: %s %s session %d: %s' % (w, g, sess, str(e)[:100]))
                page.evaluate("gesture('home')")
            sess += 1
        st = page.evaluate('(w) => __state().worlds[w]', w)
        rep_ = page.evaluate("(w) => Mastery.gateReport(w)", w)
        log.check(st['cleared'], E + 'natural unlock: %s cleared with no speech engine after %d sessions (per game %s)' % (w, sess, [(x['g'], x['ok'], x['right7'], x['kindsOk'], x.get('seen')) for x in rep_['per']]))
        if w == 'peppa':
            k = page.evaluate("() => ((__state().worlds.peppa.g || {}).P4 || {}).k || {}")
            log.check(k.get('giveNvis', 0) >= 1 and not k.get('giveN'), E + "natural unlock: P4 recorded as the seen kind 'giveNvis' (never as heard 'giveN') %s" % k)
    log.check(page.evaluate('() => __state().worlds.huluwa.unlocked'), E + 'natural unlock: the third world opened by itself (no speech engine, nothing forced)')
    log.check(not page.errors, E + 'natural unlock: zero page/console errors %s' % page.errors[:3])
    br.close()


def main():
    log = Log('nospeech' if len(ENGINES) > 1 else 'nospeech_' + ENGINES[0])
    with sync_playwright() as p, serve() as base:
        for eng in ENGINES:
            try:
                run(p, eng, base, log)
            except Exception as e:
                log.fail('%s: exception %s' % (eng, str(e).splitlines()[0][:200] if str(e) else repr(e)))
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
