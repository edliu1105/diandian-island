#!/usr/bin/env bash
# Release check for the sky world: its own suites + the shared ones, one after the other on chromium.
#   tests/logs/<tag>_summary_w3.txt     usage: tests/run_w3.sh [tag]
set -u
cd "$(dirname "$0")/.."
TAG="${1:-w3}"
export PYTHONIOENCODING=utf-8
OUT="tests/logs/${TAG}_summary_w3.txt"
: > "$OUT"
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
run gen_w3     tests/gen_w3.py
run w3         tests/test_w3.py chromium 2
run demo_w3    tests/demo_w3.py
run stars      tests/test_stars.py 3
run w2         tests/test_w2.py chromium
run voicebank  tests/test_voicebank.py 3
run boot       tests/test_boot.py chromium
run voice      tests/test_voice.py chromium
run spotcheck  tests/spotcheck.py
run intro_w3   tests/intro_w3.py
run r11        tests/r11_check.py
run gate3      tests/gate3_flow.py
run strict2    tests/strict2_check.py
echo "end $(date +%H:%M:%S)" >> "$OUT"
if [ -n "$BAD" ]; then echo "W3: FAIL -$BAD" >> "$OUT"; else echo "W3: PASS" >> "$OUT"; fi
cat "$OUT"
[ -z "$BAD" ]
