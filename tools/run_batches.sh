#!/usr/bin/env bash
# Run Codex ImageGen batches in parallel (default 6 lanes). Logs -> batches/logs/<batch>.log
# usage: tools/run_batches.sh [index.tsv] [parallel]
set -u
cd "$(dirname "$0")/.."
INDEX="${1:-batches/index.tsv}"
PAR="${2:-6}"
mkdir -p batches/logs raw/bg raw/props raw/islands raw/icon

run_one() {
  line="$1"
  bid=$(printf '%s' "$line" | cut -f1)
  refs=$(printf '%s' "$line" | cut -f2)
  targets=$(printf '%s' "$line" | cut -f3)
  all=1
  IFS=',' read -ra T <<< "$targets"
  for t in "${T[@]}"; do [ -s "$t" ] || all=0; done
  if [ "$all" = 1 ]; then echo "[skip] $bid"; return 0; fi
  imgs=()
  IFS=',' read -ra R <<< "$refs"
  for r in "${R[@]}"; do imgs+=(-i "$r"); done
  echo "[start] $bid $(date +%H:%M:%S)"
  # prompt MUST come before -i (variadic); stdin from /dev/null
  codex exec -C "$(pwd)" --skip-git-repo-check -s workspace-write -m gpt-6-astra \
     -c model_reasoning_effort='"low"' "$(cat "batches/$bid.md")" "${imgs[@]}" < /dev/null \
     > "batches/logs/$bid.log" 2>&1
  rc=$?
  miss=""
  for t in "${T[@]}"; do [ -s "$t" ] || miss="$miss $t"; done
  echo "[done] $bid rc=$rc $(date +%H:%M:%S) missing:${miss:- none}"
}
export -f run_one

grep -v '^\s*$' "$INDEX" | tr '\n' '\0' | xargs -0 -P "$PAR" -I{} bash -c 'run_one "$@"' _ {}
echo "ALL BATCHES FINISHED $(date +%H:%M:%S)"
