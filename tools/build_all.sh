#!/usr/bin/env bash
# The whole page from its sources, in the only order that works:
#  build_w3 first (it rewrites the world-3 inline block, which holds W3.load), then v2_patch (adds v2games.js to W3.load),
#  then w4_core_patch (puts w4games.js before it), then build_w4. Every step starts from a fresh copy: w4_core_patch is not
#  idempotent, never run it twice on the same page.   usage: tools/build_all.sh
set -eu
cd "$(dirname "$0")/.."
cp raw/index_pre_v2.html index.html
python raw/js/build_w3.py
python raw/js/v2_patch.py
python raw/js/w4_core_patch.py
python raw/js/build_w4.py
grep -q "assets/js/v2games.js" index.html || { echo "BUILD BROKEN: v2games.js not loaded"; exit 1; }
for f in assets/js/w3games.js assets/js/w4games.js assets/js/v2games.js; do node --check "$f"; done
python tools/gen_sw_list.py
echo "build ok $(md5sum index.html | cut -c1-10)"
