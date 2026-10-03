# -*- coding: utf-8 -*-
"""Sentences made of names and numbers that a few plays cannot all meet (every pair of heroes in the race, every pup at
every place, every clock time, every price ...): written out here and added to raw/voice_lines.json; then
tools/voice_bank.py records only what is new.   usage: python tools/voice_extra.py"""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
Q = lambda n: '两' if n == 2 else CN[n]
NAME = {'captain': '美国队长', 'ironman': '钢铁侠', 'hulk': '绿巨人', 'thor': '雷神', 'spiderman': '蜘蛛侠', 'widow': '黑寡妇', 'hawkeye': '鹰眼',
        'chase': '阿奇', 'marshall': '毛毛', 'skye': '天天', 'rocky': '灰灰', 'zuma': '路马', 'rubble': '小砾',
        'catboy': '猫小子', 'owlette': '猫头鹰女', 'gekko': '壁虎侠', 'pj_robot': '机器人', 'luna_girl': '月亮女孩', 'romeo': '罗密欧'}
out = set()
heroes = ['captain', 'ironman', 'hulk', 'thor', 'spiderman', 'widow', 'hawkeye']
for a in heroes:
    out |= {'它赢了' + NAME[a], '它输给了' + NAME[a], NAME[a] + '最快！', NAME[a] + '最慢！', NAME[a] + '第二名！', '不是' + NAME[a], '是' + NAME[a] + '！'}
    for b in heroes:
        if a != b:
            out.add(NAME[a] + '赢了' + NAME[b])
for p in ['chase', 'marshall', 'skye', 'rocky', 'zuma', 'rubble']:
    out |= {'刚才没有' + NAME[p], '是' + NAME[p] + '！'} | {NAME[p] + '是第' + CN[k] + '个' for k in range(1, 6)}
for c in ['catboy', 'owlette', 'gekko', 'pj_robot', 'luna_girl', 'romeo']:
    out |= {'不是' + NAME[c], '是' + NAME[c] + '！'}
col = ['红色', '蓝色', '绿色', '黄色']
for c in col:
    out |= {c + '的！', '它是' + c + '的', c + '！'}
    for a in ['有天线', '没天线']:
        out.add(c + '，' + a + '！')
        for c2 in col:
            if c2 != c:
                out.add('不是' + c2 + '，' + a + '！')
out |= {'大个子！', '小个子！', '它有天线', '它没有天线', '它是大个子', '它是小个子', '再看看线索'}
for n in range(2, 11):
    for a in range(1, n):
        out.add(CN[n] + '是' + CN[a] + '和' + CN[n - a] + '！')
for n in range(1, 13):
    out |= {'拨到' + CN[n] + '点！', CN[n] + '点！', '这是' + CN[n] + '点', '不是' + CN[n] + '点'}
out |= {'再过' + Q(k) + '小时几点？' for k in (1, 2, 3)}
for n in range(1, 11):
    out |= {'要' + Q(n) + '文钱！', '正好' + Q(n) + '文！', '多给了' + Q(n) + '文', '还差' + Q(n) + '文', '翻' + CN[n] + '下，到哪朵？',
            '响了' + CN[n] + '下！', '不是' + CN[n] + '下', '油只够走' + CN[n] + '格！', '没油了，还差' + Q(n) + '格'}
for n in range(0, 21):
    out |= {'拖钢铁侠，停在' + CN[n] + '！', '停在' + CN[n] + '！', '是' + CN[n] + '！'}
for n in range(1, 14):
    out |= {'一共' + Q(n) + '块！', '不是' + Q(n) + '块'}
for n in range(0, 10):
    out |= {Q(n) + '个角！', '不是' + Q(n) + '个角', '这个有' + Q(n) + '个角'}
out |= {'这个没有角', '没油了，走远了', '还有三个角的', '又见面啦！'}
# R8: the reasoning reveals say why; the balance weighs; feedback by dimension
W = {'size': '变小', 'color': '变颜色', 'turn': '转一下', 'count': '变两个', 'fill': '变空心'}
for ops in (['size'], ['color'], ['turn'], ['size', 'color'], ['count', 'turn'], ['fill', 'size'], ['count', 'color']):
    out.add('，'.join(W[o] for o in ops) + '！')
out |= {'那只' + x for x in ('颜色不一样', '图案不一样', '尾巴不一样', '方向不一样')}
for c in col:
    out |= {c + '！', '不是' + c + '！'}
out |= {'有天线！', '没天线！', '加葡萄，称西瓜！', '两边一样重！'}
out |= {'西瓜有' + Q(n) + '串重！' for n in range(2, 7)}
out |= {'颜色和大家一样', '形状和大家一样', '点点和大家一样多', '方向和大家一样', '边数和大家一样'}
# world 1: 翻 (a + m on the cloud line) and 装 (a and need make cap)
for a_ in range(0, 20):
    for m in range(1, 11):
        if a_ + m <= 20:
            out.add(CN[a_] + '翻' + CN[m] + '下，到' + CN[a_ + m] + '！')
for cap in (5, 10):
    for a_ in range(0, cap + 1):
        out.add(CN[a_] + '和' + CN[cap - a_] + '，凑成' + CN[cap] + '！')
out |= {'翻' + Q(m) + '下，到哪朵？' for m in range(1, 11)}
p = os.path.join(ROOT, 'raw', 'voice_lines.json')
have = set(json.load(open(p, encoding='utf-8')))
miss = os.path.join(ROOT, 'raw', 'voice_miss.json')
if os.path.exists(miss):
    out |= set(json.load(open(miss, encoding='utf-8')))
new = sorted(out - have)
json.dump(sorted(have | out), open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('extra', len(out), 'new', len(new))
