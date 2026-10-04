# -*- coding: utf-8 -*-
"""The sky's sentences for the voice bank: every sentence literal of the world-3 code (raw/js/w3*.js) and the sentences
made of names and numbers (rows and columns, the abacus, the harbour sums, the furnace, the suits, the fruit plates,
what is missing ...). Added to raw/voice_lines.json; then tools/voice_bank.py records only what is new.
Also checks the client's rule: no sentence longer than 8 characters (punctuation not counted).
usage: python tools/voice_w3.py"""
import os, re, json, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九']
Q = lambda n: '两' if n == 2 else CN[n]
CJK = re.compile(r'[一-鿿]')
out = set()
# 1. every complete sentence in the sky code (fragments like a colour name alone are pieces of the ones below)
for f in glob.glob(os.path.join(ROOT, 'raw', 'js', 'w3*.js')):
    s = open(f, encoding='utf-8').read()
    for t in re.findall(r"'((?:[^'\\\n]|\\.)*)'", s):          # every single-quoted string, the quotes paired properly
        if 2 <= len(t) <= 16 and CJK.search(t) and not re.search(r'[A-Za-z0-9#=/{}<>]', t) and (re.search(r'[！？。]$', t) or len(t) >= 4):
            out.add(t)
# 2. names and numbers
rows = ['红色', '蓝色', '黄色', '绿色', '紫色']
cols = ['番茄', '茄子', '南瓜', '西兰花', '胡萝卜']
for r in rows: out |= {r + '这一行，', '这是' + r + '那行', '不是' + r + '那行'}
for c in cols: out |= {c + '这一列！', '这是' + c + '那列', '不是' + c + '那列'}
for n in range(1, 21): out |= {'拨出' + CN[n] + '！', '不是' + CN[n], '是' + CN[n] + '！'}
for v in range(0, 30): out.add('这是' + CN[v])
for k in range(1, 5): out.add('五和' + CN[k] + '是' + CN[5 + k] + '！')
for k in range(1, 10): out.add('十和' + CN[k] + '是' + CN[10 + k] + '！')
for w, name in (('只', '海豹'), ('个', '海星')):
    for a in range(1, 11): out |= {'有' + Q(a) + w + name, '一开始有' + Q(a) + w}
    for n in range(1, 10): out |= {'又来了' + Q(n) + w + '！', '走了' + Q(n) + w + '！', '来了' + Q(n) + w, '走了' + Q(n) + w}
for a in range(0, 11):
    for b in range(1, 11):
        if a + b <= 10: out.add(CN[a] + '加' + CN[b] + '等于' + CN[a + b] + '！')
        if b < a: out.add(CN[a] + '减' + CN[b] + '等于' + CN[a - b] + '！')
for r in range(0, 14): out |= {'等于' + CN[r] + '！', '不是等于' + CN[r]}
for x in range(1, 10): out.add('放进' + CN[x] + '个，')
for k in range(1, 5): out |= {'每次多' + Q(k) + '个！', '每次少' + Q(k) + '个！'}
for n in range(1, 13): out |= {'一共' + Q(n) + '种！', '不是' + Q(n) + '种'}
for n in range(2, 21): out |= {'一共' + Q(n) + '个！', '不是' + Q(n) + '个'}
for f in ('柿子', '石榴', '杨桃'): out |= {'哪盘全是' + f + '？', '哪盘没有' + f + '？', '数一数' + f + '！', '这盘有' + f, '全是' + f + '！', '没有' + f + '！', '只有一个' + f + '！'}
for c in range(2, 6): out.add('这盘有' + Q(c) + '个')
for w in ('两', '三', '四'): out |= {w + '块不一样大', '这是' + w + '块哦', '一样大的' + w + '块！'}
for w in ('球形', '方块形', '圆柱形', '圆锥形'): out |= {'这是' + w + '的', '都是' + w + '！'}
for n in ('轮子', '车灯', '门', '窗户', '烟囱', '把手', '尾巴', '眼睛', '鱼鳍', '伞把', '桌子腿', '耳朵', '鼻子', '胡子', '翅膀', '壶嘴', '盖子', '花瓣', '叶子', '一格', '一个角', '一道光', '指针', '一个点', '一个点点'):
    out.add('少了' + n + '！')
out |= {'飞到云上啦！', '飞到云上去！', '彩虹城堡开啦！', '先集满五颗星！', '集满星星有旗子！'}
out = {t for t in out if CJK.search(t)}
too_long = sorted(t for t in out if len(re.sub(r'[，。！？、]', '', t)) > 8)
p = os.path.join(ROOT, 'raw', 'voice_lines.json')
have = set(json.load(open(p, encoding='utf-8')))
miss = os.path.join(ROOT, 'raw', 'voice_miss.json')
if os.path.exists(miss): out |= set(json.load(open(miss, encoding='utf-8')))
new = sorted(out - have)
json.dump(sorted(have | out), open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('sky sentences', len(out), 'new', len(new))
print('longer than 8:', too_long)
