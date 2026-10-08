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
PYTHONIOENCODING=utf-8 claude -p "请阅读本目录的 REVIEW_TASK.md 并按其要求完成用户体验抽查评审，结果写入 REVIEW-$RN.md。重要：这是非交互模式，你的回合一结束会话就结束，后台任务不会再叫醒你。所以所有命令都在前台运行（长的命令分段跑，或加 timeout），不要放到后台；结束之前一定要写好 REVIEW-$RN.md，哪怕有实验没做完，也在报告里写明。" \
  --model claude-fable-5-1 --effort high --permission-mode acceptEdits --allowedTools "Bash Read Write Edit Glob Grep" > review_run.log 2>&1
echo "exit $?"
cd ../..
[ -s "$SNAP/REVIEW-$RN.md" ] && cp "$SNAP/REVIEW-$RN.md" "docs/REVIEW-$RN.md" && grep -E "SCORE|VERDICT" "docs/REVIEW-$RN.md"
