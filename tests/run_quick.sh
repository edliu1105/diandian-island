#!/usr/bin/env bash
# Quick release check for a rule / world change (the full gate is tests/run_all.sh): the suites that play every game,
# the progress rules, the voice bank and the first screen, one after the other on chromium.
#   tests/logs/<tag>_summary_quick.txt     usage: tests/run_quick.sh [tag]
set -u
cd "$(dirname "$0")/.."
TAG="${1:-quick}"
export PYTHONIOENCODING=utf-8
OUT="tests/logs/${TAG}_summary_quick.txt"
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
  printf "%-14s rc=%s  %-50s %s min\n" "$name" "$rc" "$sum" "$(awk -v a="$t0" -v b="$(date +%s)" 'BEGIN{printf "%.1f", (b-a)/60}')" >> "$OUT"
}
run stars       tests/test_stars.py 3
run w2          tests/test_w2.py chromium
if [ "${SKIP_DONE:-}" = "" ]; then run flow_right  tests/test_flow.py chromium "" right; fi
# (test_flow "wrong" expects the old guided rescue after two mistakes - removed by the client rule; test_stars covers wrong answers)
# test_pedagogy: only the parts still true under the client rules (unlock = 5 stars per game, no guided rescue)
run pedagogy    tests/test_pedagogy.py chromium variety,hint,probe
run gates       tests/test_gates.py chromium
run hints       tests/test_hints.py chromium
run spotcheck   tests/spotcheck.py
run voicebank   tests/test_voicebank.py 3
run boot        tests/test_boot.py chromium
run voice       tests/test_voice.py chromium
echo "end $(date +%H:%M:%S)" >> "$OUT"
if [ -n "$BAD" ]; then echo "QUICK: FAIL -$BAD" >> "$OUT"; else echo "QUICK: PASS" >> "$OUT"; fi
cat "$OUT"
[ -z "$BAD" ]
