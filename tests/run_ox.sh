#!/usr/bin/env bash
# The gate for the 5-options + explain change (docs/OPTIONS-EXPLAIN-SPEC.md): every world's new suite plus the main
# regressions, one after the other on Chromium.   usage: tests/run_ox.sh [tag]   -> tests/logs/<tag>_summary.txt
set -u
cd "$(dirname "$0")/.."
TAG="${1:-ox}"
export PYTHONIOENCODING=utf-8
OUT="tests/logs/${TAG}_summary.txt"
mkdir -p tests/logs; : > "$OUT"
echo "app md5 $(md5sum index.html | cut -c1-10)  start $(date +%H:%M:%S)" >> "$OUT"
BAD=""
run() {
  local name="$1"; shift
  local t0=$(date +%s)
  python "$@" > "tests/logs/${TAG}_${name}.txt" 2>&1
  local rc=$?
  local sum=$(grep -a "SUMMARY" "tests/logs/${TAG}_${name}.txt" | tail -n 1 | sed 's/^[0-9:]* //')
  if [ "$rc" != "0" ] || [ -z "$sum" ]; then BAD="$BAD $name"; fi
  printf "%-12s rc=%s  %-50s %s min\n" "$name" "$rc" "$sum" "$(awk -v a="$t0" -v b="$(date +%s)" 'BEGIN{printf "%.1f", (b-a)/60}')" >> "$OUT"
}
run explain12  tests/test_explain.py
run generators tests/test_generators.py
run opt3       tests/test_opt3.py
run w4         tests/test_w4.py chromium 3
run stars      tests/test_stars.py
run w2         tests/test_w2.py chromium
run w3         tests/test_w3.py chromium 3
run v2         tests/test_v2.py
run v2r1       tests/test_v2r1.py
run v2r2       tests/test_v2r2.py
run v2r3       tests/test_v2r3.py
run r11        tests/r11_check.py
run spotcheck  tests/spotcheck.py 4242
run depth      tests/depth_audit.py
run flow_right tests/test_flow.py chromium "" right
run flow_wrong tests/test_flow.py chromium "" wrong
run hints      tests/test_hints.py chromium
run real_input tests/test_real_input.py chromium
run consist    tests/test_consistency.py chromium
run boot       tests/test_boot.py chromium
run offline    tests/test_offline.py chromium
echo "end $(date +%H:%M:%S)" >> "$OUT"
if [ -n "$BAD" ]; then echo "GATE: FAIL -$BAD" >> "$OUT"; else echo "GATE: PASS" >> "$OUT"; fi
cat "$OUT"
[ -z "$BAD" ]
