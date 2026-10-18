# -*- coding: utf-8 -*-
"""积木城's sentences for the voice bank: the literals of raw/js/w5.js, raw/js/w5_core_patch.py and the rule files
raw/js/w5/*.js (the ones ending in ！？。), and every sentence the rules build from numbers and names, listed in
raw/js/w5/<island>.voice.txt (one per line; tests/lines_w5.py --write adds what a rule's lines() or a played game says).
Added to raw/voice_lines.json; then tools/voice_bank.py records only what is new (ONLY the integrator runs voice_bank:
two runs at once corrupt assets/voice/bank.json). Checks the client's rule: no sentence longer than 8 Chinese characters
(those are reported and NOT added).   usage: python tools/voice_w5.py"""
import os, re, json, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJK = re.compile(r'[一-鿿]')
out = set()
W5D = os.path.join(ROOT, 'raw', 'js', 'w5')
srcs = [os.path.join(ROOT, 'raw', 'js', 'w5.js'), os.path.join(ROOT, 'raw', 'js', 'w5_core_patch.py')] + sorted(glob.glob(os.path.join(W5D, '*.js')))
for p in srcs:
    s = open(p, encoding='utf-8').read()
    if p.endswith('.js'):
        s = re.sub(r'/\*[\s\S]*?\*/', '', s)          # a comment's apostrophe ("the flags' look") would pair the quotes wrongly
    else:
        s = re.sub(r'(?m)^\s*#.*$', '', s)
    for t in re.findall(r"'((?:[^'\\\n]|\\.)*)'", s):
        if CJK.search(t) and not re.search(r'[A-Za-z0-9#=/{}<>（）：]', t) and re.search(r'[！？。]$', t):
            out.add(t)
for p in sorted(glob.glob(os.path.join(W5D, '*.voice.txt'))):
    for line in open(p, encoding='utf-8'):
        t = line.strip()
        if t and CJK.search(t):
            out.add(t)
long = sorted(t for t in out if len(CJK.findall(t)) > 8)
p = os.path.join(ROOT, 'raw', 'voice_lines.json')
lines = set(json.load(open(p, encoding='utf-8'))) if os.path.exists(p) else set()
new = sorted((out - lines) - set(long))
json.dump(sorted(lines | (out - set(long))), open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('w5 lines', len(out), 'new', len(new), 'longer than 8 (NOT added):', long)
