#!/usr/bin/env bash
# Independent UX spot review by Fable 5.1 (high) on a frozen snapshot of the app.
# usage: tools/fable_review.sh <Rn>      brief = docs/REVIEW-<Rn>-TASK.md, result = docs/REVIEW-<Rn>.md
set -u
cd "$(dirname "$0")/.."
RN="$1"; SNAP="review/$RN"
mkdir -p "$SNAP"
cp -r index.html sw.js manifest.webmanifest README.md assets docs tests tools "$SNAP/" 2>/dev/null
rm -rf "$SNAP/tests/logs"; mkdir -p "$SNAP/tests/logs"
cp "docs/REVIEW-$RN-TASK.md" "$SNAP/REVIEW_TASK.md"
cd "$SNAP"
PYTHONIOENCODING=utf-8 claude -p "请阅读本目录的 REVIEW_TASK.md 并按其要求完成用户体验抽查评审，结果写入 REVIEW-$RN.md。" \
  --model claude-fable-5-1 --effort high --permission-mode acceptEdits --allowedTools "Bash Read Write Edit Glob Grep" > review_run.log 2>&1
echo "exit $?"
cd ../..
[ -s "$SNAP/REVIEW-$RN.md" ] && cp "$SNAP/REVIEW-$RN.md" "docs/REVIEW-$RN.md" && grep -E "SCORE|VERDICT" "docs/REVIEW-$RN.md"
