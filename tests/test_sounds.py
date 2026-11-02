# -*- coding: utf-8 -*-
"""行 has two sounds and the voice picked the wrong one (client 2026-11-01: 你能行的 was said 你能航的; 这一行 of the colour
rows was said 这一形). tools/voice_bank.py gives the voice 形 (xing) or 航 (hang) instead (SOUNDS), the key stays the line.
 01 every line the app says with 行 in it is given one of the two - a new line with 行 has to say which
 02 the sound is the one the line means: 能行 / 不行 xing, a row (这一行 那行 每行 行和列) hang
 03 every line SOUNDS changes is recorded
usage: python tests/test_sounds.py"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tools'))
from harness import ROOT, Log
from voice_bank import spoken, key

log = Log('sounds')
lines = json.load(open(os.path.join(ROOT, 'raw', 'voice_lines.json'), encoding='utf-8'))
both = [t for t in lines if '行' in t]
left = [t for t in both if '行' in spoken(t)]
log.check(both and not left, '01 %d lines with 行, each given 形 or 航 %s' % (len(both), left))
want = {'你能行的！': '你能形的！', '放这里不行哦': '放这里不形哦', '转这面不行哦': '转这面不形哦', '这一行，': '这一航，',
        '红色这一行，': '红色这一航，', '不是蓝色那行': '不是蓝色那航', '每行每列都不一样！': '每航每列都不一样！',
        '行和列都对！': '航和列都对！', '中间缺了哪一行？': '中间缺了哪一航？'}
bad = ['%s -> %s' % (t, spoken(t)) for t, s in want.items() if spoken(t) != s]
missing = [t for t in want if t not in lines]
log.check(not bad and not missing, '02 xing where it means can / cannot, hang where it is a row %s %s' % (bad, missing))
bank = set(json.load(open(os.path.join(ROOT, 'assets', 'voice', 'bank.json'), encoding='utf-8')))
gone = [t for t in lines if spoken(t) != t and (key(t) not in bank or not os.path.exists(os.path.join(ROOT, 'assets', 'voice', 'v', key(t) + '.mp3')))]
log.check(not gone, '03 the %d lines it changes are recorded %s' % (sum(1 for t in lines if spoken(t) != t), gone))
sys.exit(0 if log.close() else 1)
