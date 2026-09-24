# -*- coding: utf-8 -*-
"""Rewrite the precache list inside sw.js from assets/ ([url, content-hash] pairs) and set the cache VERSION.
VERSION = a hash over index.html, manifest.webmanifest and every asset: ONE release = page + assets together; a changed
index.html alone also makes a new version (the service worker never mixes a newer page with older assets).
Run it for EVERY release (tests/test_offline.py fails when sw.js is stale; `--check` only reports).
Startup images (assets/splash) are not precached: iOS fetches them only when adding to the home screen.
usage: python tools/gen_sw_list.py [--no-bump]
"""
import os, re, sys, json, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'splash'}
files = []
for base, dirs, names in os.walk(os.path.join(ROOT, 'assets')):
    rel = os.path.relpath(base, ROOT).replace('\\', '/')
    if rel.split('/')[-1] in SKIP_DIRS:
        continue
    for n in sorted(names):
        if n.endswith('.json'):
            continue
        files.append('./' + rel + '/' + n)
files.sort()
h = hashlib.sha1()
pairs = []
for f in files:
    b = open(os.path.join(ROOT, f[2:]), 'rb').read()
    fh = hashlib.sha1(b).hexdigest()[:10]
    pairs.append([f, fh])
    h.update(f.encode())
    h.update(fh.encode())
for core in ('index.html', 'manifest.webmanifest'):          # the page belongs to the version too
    h.update(core.encode())
    h.update(hashlib.sha1(open(os.path.join(ROOT, core), 'rb').read()).hexdigest()[:10].encode())
p = os.path.join(ROOT, 'sw.js')
s = open(p, encoding='utf-8').read()
lst = 'const ASSET_FILES = ' + json.dumps(pairs, ensure_ascii=False, separators=(',', ':')) + ';'
s = re.sub(r'/\*@@ASSET_LIST@@\*/.*?/\*@@END_ASSET_LIST@@\*/', lambda m: '/*@@ASSET_LIST@@*/\n' + lst + '\n/*@@END_ASSET_LIST@@*/', s, flags=re.S)
ver = 'v' + h.hexdigest()[:8]
if '--check' in sys.argv:
    cur = re.search(r"const VERSION = '([^']*)';", open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()).group(1)
    print('sw.js VERSION', cur, 'expected', ver, 'OK' if cur == ver else 'STALE - run python tools/gen_sw_list.py')
    sys.exit(0 if cur == ver else 1)
if '--no-bump' not in sys.argv:
    s = re.sub(r"const VERSION = '[^']*';", "const VERSION = '" + ver + "';", s)
open(p, 'w', encoding='utf-8', newline='\n').write(s)
total = sum(os.path.getsize(os.path.join(ROOT, f[2:])) for f in files)
print(len(files), 'files,', total // 1024, 'KB precached')
