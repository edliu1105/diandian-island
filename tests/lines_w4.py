# -*- coding: utf-8 -*-
"""World 4: every sentence the 28 games say - played right and wrong (with the explain step) at every level, several
seeds, fast mode, Voice.say / sayNow hooked. Checks the client's rule (no sentence longer than 8 Chinese characters) and
that every sentence is recorded (assets/voice bank) or listed in its island's raw/js/w4/<f|i|m|n|o|x|v>.voice.txt (read by
tools/voice_w4.py for the recording). --write adds the missing ones to the voice.txt files.
usage: python tests/lines_w4.py [seeds=4] [--write]          W4_ONLY=F1,F2 for some games"""
import os, re, sys, json
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ISL = {'F1': 'f', 'F2': 'f', 'F3': 'f', 'F4': 'f', 'I1': 'i', 'I2': 'i', 'I3': 'i', 'I4': 'i', 'M1': 'm', 'M2': 'm', 'M3': 'm', 'M4': 'm',
       'N1': 'n', 'N2': 'n', 'N3': 'n', 'N4': 'n', 'O1': 'o', 'O2': 'o', 'O3': 'o', 'O4': 'o', 'F5': 'x', 'F6': 'x', 'F7': 'x', 'F8': 'x',
       'I5': 'v', 'I6': 'v', 'I7': 'v', 'I8': 'v'}
CJK = re.compile(r'[一-鿿]')
HOOK = """() => { window.__lines = window.__lines || []; if (window.__lh) return; window.__lh = 1;
  const rec = t => { const st = Session.st; window.__lines.push([String(t || ''), st && st.G ? st.G.id : '', Bank.has(String(t || ''))]); };
  const s1 = Voice.say.bind(Voice), s2 = Voice.sayNow.bind(Voice); Voice.say = (t, x) => { rec(t); return s1(t, x); }; Voice.sayNow = (t, x) => { rec(t); return s2(t, x); }; }"""


def play(args):
    ids, seeds = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question
    lines, errs = [], []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        from test_w4 import load_games
        load_games(page); page.evaluate(HOOK)
        for w, g in ids:
            for lv in range(1, 6):
                for s in range(seeds):
                    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, 100 + 7 * s + lv])
                    try:
                        for strat in ('wrong', 'right', 'wrong'):
                            gen, snap = answer_question(page, strat, timeout=25000)
                            wait_next_question(page, gen, timeout=30000)
                    except Exception as e:
                        errs.append('%s L%d s%d %s' % (g, lv, s, str(e)[:120]))
                    page.evaluate("gesture('home')"); page.wait_for_timeout(40)
        lines = page.evaluate("window.__lines")
        errs += page.errors
        br.close()
    return lines, errs


def main():
    seeds = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 4
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = page.evaluate("() => ORDER4.flatMap(w => WORLDS[w].games.map(g => [w, g]))")
        br.close()
    only = os.environ.get('W4_ONLY')
    if only: ids = [x for x in ids if x[1] in only.split(',')]
    jobs = 4
    seen, errs = {}, []
    with Pool(jobs) as pool:
        for lines, e in pool.map(play, [(ids[i::jobs], seeds) for i in range(jobs)]):
            errs += e
            for t, g, has in lines:
                if g in ISL and CJK.search(t): seen.setdefault((t, g), has)
    listed = {}
    for f in set(ISL.values()):
        pth = os.path.join(ROOT, 'raw', 'js', 'w4', f + '.voice.txt')
        listed[f] = set(x.strip() for x in open(pth, encoding='utf-8')) if os.path.exists(pth) else set()
    allListed = set().union(*listed.values())
    longs = sorted(set(t for (t, g) in seen if len(CJK.findall(t)) > 8))
    missing = {}
    for (t, g), has in seen.items():
        if not has and t not in allListed: missing.setdefault(ISL[g], set()).add(t)
    print('sentences said: %d (games %d); longer than 8: %s' % (len(set(t for t, g in seen)), len(set(g for t, g in seen)), longs))
    print('not recorded and not in a voice.txt: %d' % sum(len(v) for v in missing.values()))
    for f, v in sorted(missing.items()): print('  %s: %s' % (f, sorted(v)))
    print('errors:', errs[:6])
    if '--write' in sys.argv:
        for f, v in missing.items():
            pth = os.path.join(ROOT, 'raw', 'js', 'w4', f + '.voice.txt')
            with open(pth, 'a', encoding='utf-8', newline='\n') as o:
                for t in sorted(v): o.write(t + '\n')
        print('written')
    return not longs and not errs


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
