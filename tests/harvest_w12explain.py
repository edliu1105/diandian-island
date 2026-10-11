# -*- coding: utf-8 -*-
"""The lines the explanations of worlds 1 and 2 can say (client 2026-10-10) that are not recorded yet.

1. templates, expanded in full (every number they can take)
2. what was really said: every game x level x SEEDS seeds, two questions each answered wrong (odd seeds: the first ask
   right, so the second ask is heard too), fast timings, JOBS browsers; every Voice.say (and sayNow) while a question
   is in its feedback ('correcting') or explanation, or with the tags wrong / explain / two. Prints every line heard
   that has no recording (in recordings mode such a line is silent: review OX1 P1)
The file holds every line (lines already in assets/voice/bank.json are skipped by the recorder; the ones not recorded
yet are printed). Every line must be <= 8 CJK characters (else this fails).
usage: python tests/harvest_w12explain.py [seeds=8] [jobs=4]      (seeds=0: templates only, no browser)
writes raw/js/w4/w12explain.voice.txt (one line per line; tools/voice_w4.py picks *.voice.txt up)"""
import os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
from harness import serve, new_page, enter, answer_question, wait_next_question, ROOT
import test_explain as T

_KW = dict(x.split('=', 1) for x in sys.argv[1:] if '=' in x and not x.startswith('-'))
_POS = [x for x in sys.argv[1:] if '=' not in x and not x.startswith('-')]   # (a worker process gets --multiprocessing-fork)
SEEDS = int(_KW.get('seeds', _POS[0] if _POS else 8))
JOBS = int(_KW.get('jobs', _POS[1] if len(_POS) > 1 else 4))
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
    # the feedback lines of world 2 (W2Say, W2X.say: review OX1 P1), every value a template can take
    out += ['这里不是' + CN[n] for n in range(0, 21)] + ['不是这个哦']                                            # W2Say.at: J1, Q1
    out += ['不是' + CNQ(n) + '个' for n in range(0, 21)]                                                        # W2Say.notN: C1, C2, D2, Y3
    out += ['不是' + CN[n] + '下' for n in range(1, 11)]                                                         # C3: numOptions 1-10
    out += ['不是' + CNQ(n) + '块' for n in range(2, 14)]                                                        # D3: numOptions 2-13
    out += ['不是' + CNQ(n) + '个角' for n in range(3, 10)] + ['这个有' + CNQ(n) + '个角' for n in range(1, 10)] + ['这个没有角', '还有三个角的']   # G1: 3-9
    out += ['这是' + CN[n] + '点' for n in range(1, 13)] + ['不是' + CN[n] + '点' for n in range(1, 13)]          # W2: 1-12
    out += ['多给了' + CNQ(n) + '文' for n in range(1, 10)] + ['还差' + CNQ(n) + '文' for n in range(1, 10)]      # G2: price <= 9, purse <= 11
    out += ['没油了，还差' + CNQ(n) + '格' for n in range(1, 13)] + ['没油了，走远了']                             # D1: 6 x 4 cells, walls
    COL = ['红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '青色']                                                  # W2X.cname: J2
    out += [c + '！' for c in COL] + ['不是' + c + '！' for c in COL] + ['它是' + c + '的' for c in COL] + [c + '的！' for c in COL]
    out += ['有天线！', '没天线！', '大个子！', '小个子！', '它有天线', '它没有天线', '它是大个子', '它是小个子', '再看看线索']
    PW = ['上面', '下面', '里面', '旁边', '左边', '右边', '中间']                                                     # PLACE_WORD: Q2
    out += ['这是' + w + '哦' for w in PW] + ['在盒子里面！', '在两个中间！'] + ['在桌子' + w + '！' for w in ['上面', '下面', '旁边', '左边', '右边']]
    out += ['颜色不一样', '图案不一样', '尾巴不一样', '方向不一样']                                                   # Q4
    out += ['它没有比赛', '再想一想', '它是第一名']                                                                  # W4
    out += ['再来一题！', '下一题来啦！', '再来一个！']                                                               # AGAIN: after every explanation (a new question comes)
    return out


# what the explanations no longer say since the trim (2026-10-10): left out when the file is merged again
STALE = re.compile(r'^(你选的是.*|这是第.个|我们一起看！|我们一起数！|一个一个看！|一个对一个|从根开始数！|只有一个站出来|从一开始，全部数|五只，接着数|空格数一数|外面的排进格子|一箱是十个|'
                   r'第一个还差几格？|满格是十|数一个盘子！|一组一组看！|看看哪边重！|一个一个加！|从头数一数！|一个一个数！|每列数一数！|从头摆到尾！|最短的路！|看蜻蜓写！|剩下的数一数|'
                   r'数位置，.*|.个，一起出来|洞口.*|外面.个，一共.*|数到.*|电梯里本来.*|篮子里本来.*|从.*接着数|从.*开始翻|飞机里本来.*|.*有这么多|一样东西一个币)$')


HOOK = T.SAYHOOK                    # the same hook as the Bank.has check of tests/test_explain.py


def sweep_job(args):
    """one worker: its own server and browser; every (game, level) of its share x its seeds, answered wrong (even seeds)
    or right then wrong (odd seeds: the second of two asks). Returns [line, game, level, phase, tag] for every line said
    in a question's feedback / explanation / second ask"""
    seeds, ids = args
    from playwright.sync_api import sync_playwright
    from harness import serve, new_page, enter, answer_question, wait_next_question
    said, skipped = [], []
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page); page.evaluate(T.NOREV)
        page.evaluate(HOOK)
        for seed in seeds:
            for w, g, lv in ids:
                try:
                    page.evaluate("([w,g,l,s]) => window.__go(w, g, l, {noDemo: true, seed: s})", [w, g, lv, 500 + seed * 37 + lv])
                    gen, snap = answer_question(page, 'wrong' if seed % 2 == 0 else 'right', timeout=25000)
                    wait_next_question(page, gen, timeout=40000)
                    gen, snap = answer_question(page, 'wrong', timeout=25000)      # a second question, wrong (a new one)
                    wait_next_question(page, gen, timeout=40000)
                except Exception as e:
                    skipped.append('%s L%d seed %d: %s' % (g, lv, seed, str(e)[:80]))
                page.evaluate("gesture('home')"); page.wait_for_timeout(40)
            said += page.evaluate("window.__xsaid.splice(0)")
        br.close()
    return said, skipped


def main():
    bank = set(json.load(open(os.path.join(ROOT, 'assets', 'voice', 'bank.json'), encoding='utf-8')))
    said = set()
    if SEEDS == 0:                      # templates only: keep what earlier runs heard (the file itself)
        if os.path.exists(OUT):
            said = set(x.strip() for x in open(OUT, encoding='utf-8') if x.strip() and not STALE.match(x.strip()))
        return finish(bank, said)
    from multiprocessing import Pool
    with sync_playwright() as p, serve() as base:
        br = p.chromium.launch(); page = new_page(br, base, 1180, 820, fast=True); enter(page)
        ids = T.games_of(page, T.W1 + T.W2)
        br.close()
    jobs = [(list(range(SEEDS)), ids[i::JOBS]) for i in range(JOBS)]
    heard, where = set(), {}
    with Pool(JOBS) as pool:
        for part, skipped in pool.map(sweep_job, jobs):
            for t, g, lv, ph, tag in part:
                heard.add(t); where.setdefault(t, '%s L%s %s/%s' % (g, lv, ph, tag))
            for x in skipped:
                print('skip', x)
    miss = sorted(t for t in heard if fnv(t) not in bank)
    print('%d different lines heard in feedback / explanations / second asks; not recorded: %d' % (len(heard), len(miss)))
    for t in miss:
        print('  NOT RECORDED %s   (%s)' % (t, where[t]))
    said = set(heard)
    if os.path.exists(OUT):
        said |= set(x.strip() for x in open(OUT, encoding='utf-8') if x.strip() and not STALE.match(x.strip()))
    return finish(bank, said)


def finish(bank, said):
    lines = [t for t in templates()] + sorted(said)          # a number word said through Voice.say needs a recording too
    seen, out = set(), []
    for t in lines:
        if t in seen:
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
