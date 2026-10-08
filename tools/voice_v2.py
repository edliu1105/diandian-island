# -*- coding: utf-8 -*-
"""v2's sentences for the voice bank (docs/PLAN-v2.md): the literals of raw/js/v2.js and the sentences made of numbers
(给我几个, 几后面是几, 几分成几和几, 几加几等于几, the unloading ...). Added to raw/voice_lines.json; then
tools/voice_bank.py records only what is new. Checks the client's rule: no sentence longer than 8 characters.
usage: python tools/voice_v2.py"""
import os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
Q = lambda n: '两' if n == 2 else CN[n]
CJK = re.compile(r'[一-鿿]')
out = set()
s = open(os.path.join(ROOT, 'raw', 'js', 'v2.js'), encoding='utf-8').read()
for t in re.findall(r"'((?:[^'\\\n]|\\.)*)'", s):
    if CJK.search(t) and len(CJK.findall(t)) <= 8 and not re.search(r'[A-Za-z0-9#=/{}<>（）：]', t) and re.search(r'[！？。]$', t):
        out.add(t)
for n in range(2, 11): out.add('给我' + Q(n) + '个！')
for n in range(0, 21): out |= {CN[n] + '后面是几？', CN[n] + '前面是几？', '不是' + CN[n], '不是' + Q(n) + '个'}
for w in range(2, 11):
    for a in range(1, w): out.add(CN[w] + '分成' + CN[a] + '和几？')
for a in range(0, 11):
    for b in range(0, 11 - a): out.add(CN[a] + '加' + CN[b] + '等于几？')
    for b in range(0, a + 1): out.add(CN[a] + '减' + CN[b] + '等于几？')
for b in range(1, 10): out.add('搬走' + Q(b) + '箱！')
for r in range(0, 10): out.add('还剩' + Q(r) + '箱。')
for c in range(1, 11): out.add('一共' + Q(c) + '块。')
for n in range(0, 11): out.add('不是' + Q(n) + '箱')
out |= {'两边不一样多', '两边一样多', '哪张让两边一样多？', '两边一样多吗？', '方框里是几？', '一样多！', '不一样多！', '宝石册满啦！', '月测开始！', '这边不是空的', '这个不是一家', '再看一看', '新英雄来啦！', '能量宝石！', '找回老朋友！', '月测做完啦', '明天见！', '停船还是继续？'}
long = [t for t in out if len(CJK.findall(t)) > 8]
p = os.path.join(ROOT, 'raw', 'voice_lines.json')
lines = set(json.load(open(p, encoding='utf-8'))) if os.path.exists(p) else set()
new = sorted(out - lines)
json.dump(sorted(lines | out), open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('v2 lines', len(out), 'new', len(new), 'longer than 8:', long)
