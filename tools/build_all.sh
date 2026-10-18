#!/usr/bin/env bash
# The whole page from its sources, in the only order that works:
#  build_w3 first (it rewrites the world-3 inline block, which holds W3.load), then v2_patch (adds v2games.js to W3.load),
#  then w4_core_patch (puts w4games.js before it), then w5_core_patch (积木城: its anchors contain world 4's lines; puts
#  w5games.js after w4games.js), then build_w4 and build_w5 (they fill the blocks). Every step starts from a fresh copy:
#  the core patches are not meant to run twice on the same page.   usage: tools/build_all.sh
set -eu
cd "$(dirname "$0")/.."
cp raw/index_pre_v2.html index.html
python raw/js/build_w3.py
python raw/js/v2_patch.py
python raw/js/w4_core_patch.py
python raw/js/w5_core_patch.py
python raw/js/build_w4.py
python raw/js/build_w5.py
grep -q "assets/js/v2games.js" index.html || { echo "BUILD BROKEN: v2games.js not loaded"; exit 1; }
grep -q "assets/js/w5games.js" index.html || { echo "BUILD BROKEN: w5games.js not loaded"; exit 1; }
for f in assets/js/w3games.js assets/js/w4games.js assets/js/w5games.js assets/js/v2games.js; do node --check "$f"; done
python tools/gen_sw_list.py        # precaches only git-tracked assets: `git add` new recordings / pictures first, then rerun it
echo "build ok $(md5sum index.html | cut -c1-10)"
