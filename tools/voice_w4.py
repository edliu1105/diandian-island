# -*- coding: utf-8 -*-
"""World 4's sentences for the voice bank: the literals of raw/js/w4.js, raw/js/w4_core_patch.py and the rule files
raw/js/w4/*.js (the ones ending in ！？。), and every sentence the rules can build from numbers, listed by their authors
in raw/js/w4/*.voice.txt. Added to raw/voice_lines.json; then tools/voice_bank.py records only what is new.
Checks the client's rule: no sentence longer than 8 Chinese characters.   usage: python tools/voice_w4.py"""
import os, re, json, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJK = re.compile(r'[一-鿿]')
out = set()
srcs = [os.path.join(ROOT, 'raw', 'js', 'w4.js'), os.path.join(ROOT, 'raw', 'js', 'w4_core_patch.py')] + glob.glob(os.path.join(ROOT, 'raw', 'js', 'w4', '*.js'))
for p in srcs:
    s = open(p, encoding='utf-8').read()
    for t in re.findall(r"'((?:[^'\\\n]|\\.)*)'", s):
        if CJK.search(t) and len(CJK.findall(t)) <= 8 and not re.search(r'[A-Za-z0-9#=/{}<>（）：]', t) and re.search(r'[！？。]$', t):
            out.add(t)
for p in glob.glob(os.path.join(ROOT, 'raw', 'js', 'w4', '*.voice.txt')):
    for line in open(p, encoding='utf-8'):
        t = line.strip()
        if t and CJK.search(t):
            out.add(t)
long = sorted(t for t in out if len(CJK.findall(t)) > 8)
p = os.path.join(ROOT, 'raw', 'voice_lines.json')
lines = set(json.load(open(p, encoding='utf-8'))) if os.path.exists(p) else set()
new = sorted(out - lines)
json.dump(sorted(lines | (out - set(long))), open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('w4 lines', len(out), 'new', len(new), 'longer than 8 (NOT added):', long)
