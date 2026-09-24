#!/usr/bin/env bash
# Release gate: every test suite on one engine, one after the other (parallel browsers exhaust Windows socket
# buffers). Each suite's own log is in tests/logs/; this script adds one summary table:
#   tests/logs/<tag>_summary_<engine>.txt  (suite, exit code, SUMMARY line, minutes)
# The script FAILS (exit 1, last summary line 'GATE: FAIL ...') when any suite exits non-zero or prints no SUMMARY line.
# usage: tests/run_all.sh <chromium|webkit> [tag]
set -u
cd "$(dirname "$0")/.."
ENG="$1"; TAG="${2:-gate}"
export PYTHONIOENCODING=utf-8
OUT="tests/logs/${TAG}_summary_${ENG}.txt"
: > "$OUT"
echo "engine $ENG  app md5 $(md5sum index.html | cut -c1-10)  start $(date +%H:%M:%S)" >> "$OUT"
BAD=""
run() {
  local name="$1"; shift
  local t0=$(date +%s)
  python "$@" > "tests/logs/${TAG}_${name}_${ENG}.txt" 2>&1
  local rc=$?
  local t1=$(date +%s)
  local sum=$(grep -a "SUMMARY" "tests/logs/${TAG}_${name}_${ENG}.txt" | tail -n 1 | sed 's/^[0-9:]* //')
  if [ "$rc" != "0" ] || [ -z "$sum" ]; then BAD="$BAD $name"; fi
  printf "%-16s rc=%s  %-60s %s min\n" "$name" "$rc" "$sum" "$(awk -v a="$t0" -v b="$t1" 'BEGIN{printf "%.1f", (b-a)/60}')" >> "$OUT"
}
run flow_right     tests/test_flow.py "$ENG" "" right
run flow_wrong     tests/test_flow.py "$ENG" "" wrong
run layout         tests/test_layout.py "$ENG"
run rotate         tests/test_rotate.py "$ENG" "" "" --reveal-all
run rotate_gest    tests/test_rotate_gesture.py "$ENG"
run real_input     tests/test_real_input.py "$ENG"
run pedagogy       tests/test_pedagogy.py "$ENG"
run gates          tests/test_gates.py "$ENG"
run hints          tests/test_hints.py "$ENG"
run idle           tests/test_idle.py "$ENG"
run background     tests/test_background.py "$ENG"
run voice          tests/test_voice.py "$ENG"
run nospeech       tests/test_nospeech.py "$ENG"
run boot           tests/test_boot.py "$ENG"
run offline        tests/test_offline.py "$ENG"
run faults         tests/test_faults.py "$ENG"
run consistency    tests/test_consistency.py "$ENG"
run stress         tests/test_stress.py "$ENG"
if [ "$ENG" = "chromium" ]; then
  run generators   tests/test_generators.py
  run dots         tests/test_dots.py
  run soak15       tests/test_soak.py 15 chromium
else
  run soak3        tests/test_soak.py 3 webkit
fi
echo "end $(date +%H:%M:%S)" >> "$OUT"
if [ -n "$BAD" ]; then echo "GATE: FAIL -$BAD" >> "$OUT"; else echo "GATE: PASS" >> "$OUT"; fi
cat "$OUT"
[ -z "$BAD" ]
