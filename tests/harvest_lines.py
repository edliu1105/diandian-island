# -*- coding: utf-8 -*-
"""Collect every sentence the app says, for the voice bank (tools/voice_bank.py):
1. static: the literal sentences in index.html (say / sayNow / K.say calls, PRAISE / CHEER / AGAIN, intro / bye / hi / praise)
2. played: every game, every level - right answers, a wrong answer and its retry, waiting through the hint ladder -
   with the narration log (window.__speechLog) read after each game
3. numbers: a sentence with one Chinese number in it is also made for every number 1-20 (its count form uses 两)
writes raw/voice_lines.json.   usage: python tests/harvest_lines.py [jobs=3]"""
import os, re, sys, json
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'raw', 'voice_lines.json')
CJK = re.compile(r'[一-鿿]')


def static_lines():
    s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    out = set()
    for m in re.finditer(r"(?:Voice\.say|Voice\.sayNow|\.sayNow|K\.say\(st,|Voice\.unlock|W2X\.say|line:)\s*\(?\s*'([^'\\\n]{1,24})'", s):
        out.add(m.group(1))
    for m in re.finditer(r"(?:intro|bye|hi|summary)\s*:\s*'([^'\\\n]{1,24})'", s):
        out.add(m.group(1))
    for m in re.finditer(r"(?:const (?:PRAISE|CHEER|AGAIN)\s*=|praise\s*:|why\s*:)\s*\[([^\]]*)\]", s):
        out.update(re.findall(r"'([^'\\\n]{1,24})'", m.group(1)))
    for m in re.finditer(r"\?\s*'([^'\\\n]{1,24})'\s*:\s*'([^'\\\n]{1,24})'", s):          # a ? 'x' : 'y' sentence choice
        out.update([m.group(1), m.group(2)])
    for m in re.finditer(r"\|\|\s*'([^'\
]{2,24})'", s):          # a fallback sentence: say(x || '玩得真开心！')
        out.add(m.group(1))
    for m in re.finditer(r"(?:const (?:PLACE_SAY|PLACE_WORD) = |W2X\.say\()\{([^}]*)\}", s):   # sentence tables
        out.update(re.findall(r"'([^'\\\n]{1,24})'", m.group(1)))
    # every complete sentence literal in the code (ends with ！？。) - a sentence passed around in a variable is never missed;
    # fragments that start with a measure word are pieces of number sentences, not sentences
    for t in re.findall(r"'([^'\
]{3,20})'", s):
        if re.search(r'[！？。]$', t) and not re.search(r'[A-Za-z0-9<>=/{}]', t) and t[0] not in '个只块根格文下点节面小的':
            out.add(t)
    return {t for t in out if CJK.search(t) and len(t) >= 3}


def play(ids):
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question, wait_phase
    got = set()
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch()
        page = new_page(br, base, 1180, 820, fast=True, hint_scale=0.05); enter(page)
        for w, g, mx in ids:
            for lv in range(1, mx + 1):
                for seed in (3, 11):
                    try:
                        page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, seed])
                        gen, _ = answer_question(page, 'right', timeout=20000); gen = wait_next_question(page, gen, timeout=30000) or gen
                        gen2, _ = answer_question(page, 'wrong', timeout=20000); wait_next_question(page, gen2, timeout=30000)
                        gen3, _ = answer_question(page, 'right', timeout=20000); wait_next_question(page, gen3, timeout=30000)
                        if seed == 3:                                  # the hint ladder and its kind words
                            wait_phase(page, timeout=20000); page.wait_for_timeout(2600)
                    except Exception as e:
                        pass
                    page.evaluate("gesture('home')"); page.wait_for_timeout(60)
            log = page.evaluate("window.__speechLog.map(e => e.text)")
            got.update(t for t in log if t)
            page.evaluate("window.__speechLog.length = 0")
        br.close()
    return sorted(got)


NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
NUMRE = re.compile(r'二十|十[一二三四五六七八九]?|[一二两三四五六七八九]')


def expand(lines):
    """a sentence seen with different numbers in the same place (每人三个 / 每人四个) is a template: it is also made for the
    numbers around the ones seen (1 .. the largest seen + 2, at most 20); 2 is 两 before a measure word, 二 otherwise.
    Words like 一起 / 一样 / 第一 / 擦一擦 / 八戒 / 二娃 are not numbers."""
    skip = re.compile(r'一起|一样|一下|一点|一个一个|一组一组|一边|一定|一遍|一次|一闪|一模一样|一共|第[一二三四五六七八九十]+(?=[个只位格层排列])|一列|一行|一盘|一块块|一格一格|一种|一对|一些|一会|统一|一直|([一-鿿])一|八戒|[大二三四五六七]娃')
    measure = set('个只块下文位根颗面步格节双队样层朵张把条人对盘排列点')
    groups = {}
    for t in lines:
        masked = skip.sub(lambda m: '＊' * len(m.group(0)), t)
        ms = list(NUMRE.finditer(masked))
        if len(ms) != 1:
            continue
        m = ms[0]
        tpl = (t[:m.start()], t[m.end():])
        v = m.group(0); n = 2 if v == '两' else NUM.index(v) + 1
        groups.setdefault(tpl, set()).add(n)
    out = set()
    for (a, b), ns in groups.items():
        if len(ns) < 2:
            continue
        nxt = b[:1]
        for i in range(1, min(20, max(ns) + 2) + 1):
            w = ('两' if nxt in measure else '二') if i == 2 else NUM[i - 1]
            out.add(a + w + b)
    return out


def main():
    jobs = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    st = static_lines()
    # the games: world, id, highest level
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        games = page.evaluate("() => Object.values(GAMES).map(g => [g.world, g.id, MAXLV[g.world] || 4]).filter(x => WORLDS[x[0]])")
        extra = page.evaluate("() => [].concat(Object.values(WORLDS).map(w => w.hi).filter(Boolean), Object.values(GAMES).map(g => g.intro).filter(Boolean), Object.values(GAMES).map(g => g.bye).filter(Boolean), Object.values(GAMES).flatMap(g => g.praise || []), PRAISE, CHEER, AGAIN, Object.values(CHARS).map(c => '不是' + c[0]), Object.values(CHARS).map(c => '是' + c[0] + '！'))")
        br.close()
    chunks = [games[i::jobs] for i in range(jobs)]
    with Pool(jobs) as pool:
        played = set().union(*pool.map(play, chunks))
    json.dump(sorted(played), open(os.path.join(ROOT, 'raw', 'voice_played.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    lines = st | set(extra) | played
    lines |= {'插上旗子啦！'} | {(n if i != 2 else '两') + '面旗子啦！' for i, n in enumerate(NUM, 1)}
    lines |= expand(lines)
    lines = sorted(t for t in lines if CJK.search(t) and 2 <= len(t) <= 24 and t == t.strip())
    json.dump(lines, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('static', len(st), 'played', len(played), 'total', len(lines))


if __name__ == '__main__':
    main()
