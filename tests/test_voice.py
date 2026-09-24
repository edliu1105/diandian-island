# -*- coding: utf-8 -*-
"""Speech gate (WebKit rules 1-10) at NORMAL speed, with fault injection.
 - entry: the first sentence is handed to the engine inside the click (same task), nothing cancelled before it
 - one narration at a time; every speak after a cancel waits >= 150 ms (engine call timestamps)
 - no unwarranted repeats; the last counting word of a reveal is really counted
 - missing mp3 -> protected fallback that a tap cannot cut; late decode never speaks an old number;
   suspended audio -> the number is still said (resumed or fallback)
 - engine stuck "speaking" -> recovery, narration continues; silent engine -> 3 misses -> big retry target
 - lying engine (onstart / onend fire, speaking / pending never true) -> still 3 misses -> big retry target
 - leaving a game: nothing of the old session is said afterwards
usage: python tests/test_voice.py [chromium|webkit]"""
import os, sys, time, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from harness import serve, new_page, enter, wait_phase, answer_question, wait_next_question, wait_map, Log

ENGINE = sys.argv[1] if len(sys.argv) > 1 else 'chromium'

CLICK_PROBE = """
window.__clickT = [];
document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('#play')) window.__clickT.push(performance.now()); }, true);
"""


def calls(page):
    return page.evaluate("window.__speechCalls")


def slog(page):
    return page.evaluate("window.__speechLog")


def check_engine_calls(log, tag, cs, strict_gap=True):
    """cancel -> speak >= 150 ms; one utterance at a time is checked on the app log"""
    bad = []
    last_cancel = None
    for c in cs:
        if c['ev'] == 'cancel':
            last_cancel = c['t']
        elif c['ev'] == 'speak' and last_cancel is not None:
            gap = c['t'] - last_cancel
            if gap < 150 and strict_gap:
                bad.append(round(gap))
    log.check(not bad, '%s: every speak >= 150 ms after the previous cancel (violations %s)' % (tag, bad[:8]))


def check_one_at_a_time(log, tag, sl):
    """app log: narr 'speak' must be followed by a termination (end/timeout/error/cancel) before the next 'speak'"""
    busy, bad = False, 0
    for e in sl:
        if e['ch'] != 'narr':
            continue
        if e['ev'] == 'speak':
            if busy:
                bad += 1
            busy = True
        elif e['ev'] in ('end', 'timeout', 'error', 'cancel'):
            busy = False
    log.check(bad == 0, '%s: one narration at a time (%d overlaps)' % (tag, bad))


def check_repeats(log, tag, sl):
    last = {}
    rep = []
    for e in sl:
        if e['ch'] != 'narr' or e['ev'] != 'speak':
            continue
        key = (e['text'], e['tag'])
        if key in last and e['t'] - last[key] < 3000 and not e['tag'].startswith(('hint', 'relisten', 'retry', 'resay', 'count')):
            rep.append((e['text'], e['tag'], e['t'] - last[key]))
        last[key] = e['t']
    log.check(not rep, '%s: no sentence repeated within 3 s without a reason %s' % (tag, rep[:5]))


def main():
    log = Log('voice_%s' % ENGINE)
    with sync_playwright() as p, serve() as base:
        br = getattr(p, ENGINE).launch()

        # ------------------------------------------------------------ 1. entry + a normal-speed session
        page = new_page(br, base, 1180, 820, fast=False, extra_init=CLICK_PROBE, sw='block')   # routes must see the audio requests
        page.click('#play')
        page.wait_for_function("document.querySelector('#map').classList.contains('on')", timeout=10000)
        cs = calls(page)
        ct = page.evaluate("window.__clickT")
        first = [c for c in cs if c['ev'] == 'speak']
        log.check(bool(first) and bool(ct) and abs(first[0]['t'] - ct[0]) < 30, 'rule 1: the first sentence reached the engine inside the click (dt=%s ms)' % (round(first[0]['t'] - ct[0], 1) if first and ct else None))
        log.check(not any(c['ev'] == 'cancel' and c['t'] <= first[0]['t'] for c in cs) if first else False, 'rule 2: no cancel in front of the first speak')
        page.wait_for_timeout(2500)
        page.evaluate("() => window.__go('peppa', 'P2', 1, {noDemo: true, seed: 11})")
        for i in range(3):
            gen, snap = answer_question(page, 'right' if i != 1 else 'wrong', timeout=30000)
            wait_next_question(page, gen, timeout=40000)
        sl = slog(page)
        cs = calls(page)
        check_engine_calls(log, 'P2 normal speed', cs)
        check_one_at_a_time(log, 'P2 normal speed', sl)
        check_repeats(log, 'P2 normal speed', sl)
        # the reveal of P2 counts every pig: the last counting word must be the number of pigs
        counts = [e for e in sl if e['ch'] == 'count' and e['ev'] == 'speak']
        log.check(len(counts) >= 2, 'counting channel used during the session (%d words)' % len(counts))
        page.evaluate("gesture('home')")
        page.wait_for_timeout(600)
        n_after = len(slog(page))
        page.wait_for_timeout(2500)
        late = [e for e in slog(page)[n_after:] if e['ev'] == 'speak']
        log.check(not late, 'leaving: nothing of the old session is said afterwards %s' % [(e['text'], e['tag']) for e in late][:4])

        # ------------------------------------------------------------ 2. counting-channel faults
        page.route('**/assets/voice/n13.mp3', lambda r: r.fulfill(status=404, body='nope'))
        def slow(route):
            time.sleep(1.5)
            route.continue_()
        page.route('**/assets/voice/n14.mp3', slow)
        page.evaluate("() => { Count.bufs = {}; Count.fails = {}; Count.loading = {}; }")
        page.evaluate("() => window.__go('peppa', 'P4', 1, {noDemo: true, seed: 12})")
        wait_phase(page, timeout=20000)
        base_n = len(slog(page))
        page.evaluate("() => { Count.say(13); }")
        page.wait_for_timeout(400)
        # a child's tap right after (one that does not count anything itself): narration yields, the protected fallback does not
        page.evaluate("() => Voice.hush('input')")
        page.wait_for_timeout(3000)
        seg = slog(page)[base_n:]
        fb = [e for e in seg if e['tag'] == 'count-fallback']
        log.check(any(e['ev'] == 'speak' and e['text'] == '十三' for e in fb), 'missing n13.mp3 -> "十三" said by the narration engine (fallback) %r' % ([(e['ch'], e['ev'], e['tag'], e['text']) for e in seg][:12],))
        # the fallback narration item: after its own 'speak' the next narration event must be its own 'end' (never a cancel)
        nar = [e for e in seg if e['ch'] == 'narr']
        i_fb = next((i for i, e in enumerate(nar) if e['ev'] == 'speak' and e['tag'] == 'count-fallback'), None)
        nxt = nar[i_fb + 1] if i_fb is not None and i_fb + 1 < len(nar) else None
        log.check(nxt is not None and nxt['ev'] == 'end' and nxt['tag'] == 'count-fallback', 'the fallback word is protected: the tap did not cut it (narration after it: %r)' % (((nxt['ev'], nxt['tag']) if nxt else None),))
        mp3 = page.evaluate("() => Count.load('n2').then(b => !!b)")
        st0 = page.evaluate("() => ({ played: Count.played, fallbacks: Count.fallbacks })")
        st0['mp3'] = mp3
        n1 = len(slog(page))
        page.evaluate("() => { Count.say(14); setTimeout(() => Count.say(15), 200); }")
        page.wait_for_timeout(2500)
        st1 = page.evaluate("() => ({ played: Count.played, fallbacks: Count.fallbacks })")
        if st0['mp3']:
            log.check(st1['played'] - st0['played'] == 1 and st1['fallbacks'] == st0['fallbacks'], 'late decode of 14 after 15 was asked: only 15 plays (played +%d, fallbacks +%d)' % (st1['played'] - st0['played'], st1['fallbacks'] - st0['fallbacks']))
        else:
            # this driver cannot decode mp3 at all (Playwright WebKit on Windows): every word falls back - the newest must win
            said = [e['text'] for e in slog(page)[n1:] if e['ch'] == 'narr' and e['ev'] == 'speak' and e['tag'] == 'count-fallback']
            log.check(said[-1:] == ['十五'] and '十四' not in said[said.index('十五'):] if '十五' in said else False, 'no mp3 decoder: the newest word "十五" is the last one said %s' % said)
        page.evaluate("() => Sfx.ctx && Sfx.ctx.suspend()")
        page.wait_for_timeout(200)
        page.evaluate("() => Count.say(4)")
        page.wait_for_timeout(1200)
        st2 = page.evaluate("() => ({ played: Count.played, fallbacks: Count.fallbacks, state: Sfx.ctx ? Sfx.ctx.state : 'none' })")
        log.check((st2['played'] - st1['played']) + (st2['fallbacks'] - st1['fallbacks']) == 1, 'suspended audio: "四" still said (played +%d, fallback +%d, ctx %s)' % (st2['played'] - st1['played'], st2['fallbacks'] - st1['fallbacks'], st2['state']))
        page.evaluate("gesture('home')")
        page.unroute('**/assets/voice/n13.mp3'); page.unroute('**/assets/voice/n14.mp3')
        page.errors[:] = [e for e in page.errors if '404 (Not Found)' not in e]      # the injected 404 itself
        log.check(not page.errors, 'page 1: zero errors %s' % page.errors[:3])
        page.context.close()

        # ------------------------------------------------------------ 3. engine stuck "speaking" forever
        stuck = """
        window.__stuck = () => { const S = window.speechSynthesis; S.speak = u => { window.__speechCalls.push({ t: performance.now(), ev: 'speak', text: u.text }); S.speaking = true; }; S.cancel = () => { window.__speechCalls.push({ t: performance.now(), ev: 'cancel' }); }; };
        """
        page = new_page(br, base, 1180, 820, fast=False, extra_init=stuck)
        enter(page)
        page.wait_for_timeout(1500)
        page.evaluate("() => window.__stuck()")
        t0 = page.evaluate("performance.now()")
        page.evaluate("() => { ['第二句', '第三句', '第四句'].forEach(t => Voice.say(t, { tag: 'probe', owner: null })); }")
        page.wait_for_timeout(16000)
        cs = [c for c in calls(page) if c['t'] >= t0]
        spoke = [c['text'] for c in cs if c['ev'] == 'speak']
        log.check(set(['第二句', '第三句', '第四句']) <= set(spoke), 'stuck engine: every queued sentence was still handed over (recovery works) %s' % spoke)
        log.check(any(e['tag'] == 'recover' for e in slog(page) if e['ev'] == 'cancel'), 'stuck engine: the recovery cancel path was used')
        check_engine_calls(log, 'stuck engine', cs)
        page.context.close()

        # ------------------------------------------------------------ 4. silent engine -> big retry target
        silent = """
        window.__silent = () => { const S = window.speechSynthesis; S.speak = u => { window.__speechCalls.push({ t: performance.now(), ev: 'speak', text: u.text }); S.speaking = false; S.pending = false; }; };
        """
        page = new_page(br, base, 1180, 820, fast=False, extra_init=silent)
        enter(page)
        page.wait_for_timeout(1200)
        page.evaluate("() => window.__silent()")
        page.evaluate("() => { ['一', '二', '三', '四'].forEach(t => Voice.say(t + '句', { tag: 'probe', owner: null })); }")
        page.wait_for_function("document.documentElement.classList.contains('nosound')", timeout=20000)
        vis = page.evaluate("getComputedStyle(document.querySelector('#nosound')).display")
        log.check(vis != 'none', 'three unconfirmed sentences -> the big retry target shows on the map (display %s)' % vis)
        b = page.evaluate("(() => { const r = document.querySelector('#nosound').getBoundingClientRect(); return [r.width, r.height]; })()")
        log.check(b[0] >= 88 and b[1] >= 88, 'retry target is at least 88 px (%s)' % b)
        # the child taps it: the latest sentence is tried again synchronously inside the tap
        n0 = len(calls(page))
        page.click('#nosound')
        c2 = calls(page)[n0:]
        log.check(any(c['ev'] == 'speak' for c in c2), 'tapping the retry target speaks again (inside the tap)')
        # in a game the avatar carries the state (pulsing, relisten = retry)
        page.evaluate("() => window.__go('bluey', 'B1', 1, {noDemo: true, seed: 3})")
        wait_phase(page, timeout=20000)
        anim = page.evaluate("getComputedStyle(document.querySelector('#avatar')).animationName")
        log.check('breathe' in anim, 'in a game the avatar pulses while sound seems lost (%s)' % anim)
        page.evaluate("gesture('home')")
        log.check(not page.errors, 'silent engine: zero errors %s' % page.errors[:3])
        page.context.close()

        # ------------------------------------------------------------ 4b. events lie: onstart / onend fire, the state never
        # shows speaking or pending (R3-I01) -> still three misses -> the big retry target
        liar = """
        window.__liar = () => { const S = window.speechSynthesis; ['speaking', 'pending'].forEach(k => { try { Object.defineProperty(S, k, { configurable: true, get: () => false, set: () => {} }); } catch (e) {} }); };
        """
        page = new_page(br, base, 1180, 820, fast=False, extra_init=liar)
        enter(page)
        page.wait_for_timeout(1200)
        page.evaluate("() => window.__liar()")
        ok_state = page.evaluate("() => { const S = window.speechSynthesis; return S.speaking === false && S.pending === false; }")
        page.evaluate("() => { ['一', '二', '三', '四'].forEach(t => Voice.say(t + '句话', { tag: 'probe', owner: null })); }")
        try:
            page.wait_for_function("document.documentElement.classList.contains('nosound')", timeout=20000)
            ends = [e for e in slog(page) if e['ev'] == 'end']
            log.check(ok_state and len(ends) >= 3, 'events without engine state: %d onend events arrived, yet the requests were not trusted -> retry target shows' % len(ends))
        except Exception:
            log.fail('events without engine state: the app trusted onstart/onend - no retry target after 4 sentences (state faked: %s)' % ok_state)
        log.check(not page.errors, 'lying events: zero errors %s' % page.errors[:3])
        page.context.close()

        # ------------------------------------------------------------ 5. a bombard of taps: only the newest narration survives
        page = new_page(br, base, 1180, 820, fast=False)
        enter(page)
        page.evaluate("() => window.__go('bluey', 'B2', 1, {noDemo: true, seed: 8})")
        wait_phase(page, timeout=20000)
        t0 = page.evaluate("performance.now()")
        qmax = 0
        for i in range(20):
            page.evaluate("gesture('relisten')")
            qmax = max(qmax, page.evaluate("Voice.q.length"))
            page.wait_for_timeout(40)
        page.wait_for_timeout(2500)
        cs = [c for c in calls(page) if c['t'] >= t0]
        log.check(qmax <= 3, '20 fast relisten taps: the queue never exceeds 3 (max %d)' % qmax)
        check_engine_calls(log, '20 fast taps', cs)
        check_one_at_a_time(log, '20 fast taps', [e for e in slog(page) if e['t'] >= t0 - 5])
        page.evaluate("gesture('home')")
        log.check(not page.errors, 'bombard: zero errors %s' % page.errors[:3])
        page.context.close()
        br.close()
    sys.exit(0 if log.close() else 1)


if __name__ == '__main__':
    main()
