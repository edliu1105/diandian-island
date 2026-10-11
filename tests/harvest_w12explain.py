# -*- coding: utf-8 -*-
"""The lines the explanations of worlds 1 and 2 can say (client 2026-10-10) that are not recorded yet.

1. templates, expanded in full (every number they can take)
2. what the explanations really said: every game x level x SEEDS seeds answered wrong (fast timings), the speech
   recorded while a question is in its 'explain' phase, plus the "one question, two asks" lines
The file holds every line (lines already in assets/voice/bank.json are skipped by the recorder; the ones not recorded
yet are printed). Every line must be <= 8 CJK characters (else this fails).
usage: python tests/harvest_w12explain.py [seeds=4]
writes raw/js/w4/w12explain.voice.txt (one line per line; tools/voice_w4.py picks *.voice.txt up)"""
import os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, wait_next_question, ROOT
import test_explain as T

SEEDS = int(sys.argv[1]) if len(sys.argv) > 1 else 4
OUT = os.path.join(ROOT, 'raw', 'js', 'w4', 'w12explain.voice.txt')
CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
CNQ = lambda n: '两' if n == 2 else CN[n]


def fnv(t):
    """Bank.key(): FNV-1a over the UTF-16 code units (JS charCodeAt)"""
    h = 0x811c9dc5
    data = t.encode('utf-16-le')
    for i in range(0, len(data), 2):
        h ^= data[i] | (data[i + 1] << 8)
        h = (h * 16777619) & 0xffffffff
    return '%08x' % h


def templates():
    """every line the explanations say now (2026-10-10: world 2 trimmed to <= 5.5 s; world 1 counts aloud again), numbers
    expanded in full (the counted numbers themselves are the number clips assets/voice/n*.mp3, o*.mp3)"""
    out = []
    out += ['零']                                                           # EX.word: a chosen 0 (1-20 are the counting clips n*.mp3 / o*.mp3)
    out += ['对的是这个！', '还有一个！', '它没有比赛', '刚才没有莱德']
    out += ['第' + CN[n] + '个只一个' for n in range(1, 8)] + [CNQ(n) + '个娃！' for n in range(1, 6)]     # H2
    out += ['还差' + CNQ(n) + '个' for n in range(1, 6)] + ['本来就一样多！']    # B4, X3
    out += ['多了' + CNQ(n) + '个' for n in range(1, 4)]                    # B1 (the spoken "why" is back, 2026-10-10)
    out += ['洪水要' + CNQ(n) + '只' for n in range(1, 6)]                  # A1 rest
    out += ['响了' + CN[n] + '下！' for n in range(1, 11)]                  # C3
    out += ['一共' + CNQ(n) + '块！' for n in range(2, 14)]                 # D3
    out += [CNQ(n) + '块长！' for n in range(3, 11)]                        # Y1
    out += ['停在' + CN[n] + '！' for n in range(1, 21)]                    # W1
    out += [CN[n] + '点！' for n in range(1, 13)]                           # W2
    out += ['是' + CN[n] + '！' for n in range(0, 20)]                      # G3
    out += ['正好' + CNQ(n) + '文！' for n in range(2, 10)]                  # G2
    out += [CNQ(n) + '个角！' for n in range(3, 8)]                         # G1
    out += ['屋子太高了', '这块是三角形', '这块太小了', '火箭身子太细']           # W3: why a group cannot build it (feedback)
    out += ['这一列最多！', '这一列最少！', '哪个最多？', '哪个最少？', '从大到小！', '从小到大！', '一模一样！', '藏在这里！', '就是它！', '拼好啦！', '放进去啦！', '救到小猫啦！', '一样重啦', '每人一双！']
    out += [CNQ(n) + '个' for n in range(1, 5)] + ['一共' + CNQ(n) + '个！' for n in range(1, 14)]                 # P1, P3, D2
    out += [CNQ(n) + '根蜡烛！' for n in range(1, 7)]                                                            # P4
    out += ['布鲁伊的多！', '宾果的多！', '布鲁伊的少！', '宾果的少！', '一样多！', '没加没拿，一样多！', '爸爸加了一块！', '爸爸拿走一块！']   # B1, B3
    out += [CNQ(n) + '样东西' + CNQ(n) + '个币' for n in range(2, 6)]                                              # B2
    out += ['巡山的' + CNQ(n) + '个' for n in range(1, 7)] + ['洞里有' + CNQ(n) + '个' for n in range(1, 7)]           # H3
    out += ['拿了' + CNQ(n) + '个' for n in range(1, 6)]                                                          # H4
    for n in range(2, 7):                                                                                        # A1 L1-2
        for a in range(1, n):
            out.append('火灾' + CNQ(a) + '只，洪水' + CNQ(n - a) + '只')
    out += ['一共' + CNQ(n) + '只' for n in range(2, 11)]                                                         # A2, A4
    for k in range(1, 10):                                                                                       # A3
        for d in (1, 2):
            if k + d <= 10: out.append(CN[k] + '添' + CN[d] + '，是' + CN[k + d] + '只！')
            if k - d >= 1: out.append(CN[k] + '走' + CN[d] + '，剩' + CN[k - d] + '只！')
    out += ['变到' + CN[n] + '节' for n in range(2, 11)]                                                          # X1
    out += ['到' + CN[n] + '！' for n in range(2, 11)]                                                            # X2
    out += ['还差' + CNQ(n) + '只' for n in range(1, 8)]                                                          # X4
    out += ['一共' + CNQ(n) + '位' for n in range(2, 10)]                                                         # V1
    out += ['一箱，十个！', '两箱，二十！'] + ['十和' + CN[n - 10] + '，' + CN[n] + '！' for n in range(11, 20)]              # V2
    out += ['还差' + CNQ(n) + '格' for n in range(1, 6)] + ['一共' + CNQ(n) + '格' for n in range(11, 19)]                # V3
    out += [CN[n] + '，就是' + CNQ(n) + '个' for n in range(1, 20)]                                                 # V4
    out += ['每人' + CNQ(n) + '个' for n in range(2, 6)]                                                          # C1
    return out


# what the explanations no longer say since the trim (2026-10-10): left out when the file is merged again
STALE = re.compile(r'^(你选的是.*|这是第.个|我们一起看！|我们一起数！|一个一个看！|一个对一个|从根开始数！|只有一个站出来|从一开始，全部数|五只，接着数|空格数一数|外面的排进格子|一箱是十个|'
                   r'第一个还差几格？|满格是十|数一个盘子！|一组一组看！|看看哪边重！|一个一个加！|从头数一数！|一个一个数！|每列数一数！|从头摆到尾！|最短的路！|看蜻蜓写！|剩下的数一数|'
                   r'数位置，.*|.个，一起出来|洞口.*|外面.个，一共.*|数到.*|电梯里本来.*|篮子里本来.*|从.*接着数|从.*开始翻|飞机里本来.*|.*有这么多|一样东西一个币)$')


def main():
    bank = set(json.load(open(os.path.join(ROOT, 'assets', 'voice', 'bank.json'), encoding='utf-8')))
    said = set()
    if SEEDS == 0:                      # templates only: keep what earlier runs heard (the file itself)
        if os.path.exists(OUT):
            said = set(x.strip() for x in open(OUT, encoding='utf-8') if x.strip() and not STALE.match(x.strip()))
        return finish(bank, said)
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page); page.evaluate(T.NOREV)
        page.evaluate("""() => { window.__xsaid = []; const o = Voice.say.bind(Voice); Voice.say = (t, opt) => { const st = Session.st; if (t && st && !(opt && opt.tag === 'count-fallback') && (st.explaining || (opt && opt.tag === 'two') || st.sub2)) window.__xsaid.push(t); return o(t, opt); }; }""")
        ids = T.games_of(page, T.W1 + T.W2)
        for seed in range(SEEDS):
            for w, g, lv in ids:
                try:
                    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, 500 + seed * 37 + lv])
                    gen, snap = answer_question(page, 'wrong' if seed % 2 == 0 else 'right', timeout=25000)
                    wait_next_question(page, gen, timeout=40000)
                    if seed % 2:                                  # a right first ask, then the second one wrong (two asks)
                        gen, snap = answer_question(page, 'wrong', timeout=25000); wait_next_question(page, gen, timeout=40000)
                except Exception as e:
                    print('skip', g, lv, str(e)[:80])
                page.evaluate("gesture('home')"); page.wait_for_timeout(40)
            print('seed', seed, 'lines so far', len(set(page.evaluate("window.__xsaid")))); sys.stdout.flush()
        said = set(page.evaluate("window.__xsaid"))
        br.close()
    if os.path.exists(OUT):
        said |= set(x.strip() for x in open(OUT, encoding='utf-8') if x.strip() and not STALE.match(x.strip()))
    return finish(bank, said)


def finish(bank, said):
    numbers = re.compile(r'^[一二两三四五六七八九十]+$')            # said by the counting clips (0 is not one: "零" is recorded)
    lines = [t for t in templates()] + sorted(said)
    seen, out = set(), []
    for t in lines:
        if t in seen or numbers.match(t):
            continue
        seen.add(t)
        out.append(t)
    new = [t for t in out if fnv(t) not in bank]
    cjk = lambda s: len(re.findall(r'[㐀-鿿]', s))
    long = [t for t in out if cjk(t) > 8]
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:      # every line the explanations say (the recorder skips recorded ones)
        f.write('\n'.join(out) + '\n')
    print('%d lines in %s, %d not recorded yet: %s' % (len(out), OUT, len(new), new))
    if long:
        print('TOO LONG (> 8 characters):', long)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
