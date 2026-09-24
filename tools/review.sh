#!/usr/bin/env bash
# Independent codex review (GPT-6 Astra, reasoning max, read-only) on a frozen snapshot.
# usage: tools/review.sh <Rn> "<files/dirs to freeze>" "<screenshots to attach>"
#   prompt  = docs/REVIEW-<Rn>-TASK.md   (fixed brief + round checklist, written beforehand)
#   output  = docs/REVIEW-<Rn>.md        (final message, verbatim)   + docs/logs/REVIEW-<Rn>.stdout.log
# Re-runs once if the output lacks a SCORE line or does not end with a VERDICT line (invalid call, not a round).
set -u
cd "$(dirname "$0")/.."
RN="$1"; FILES="$2"; SHOTS="${3:-}"
SNAP="review/$RN"
rm -rf "$SNAP"; mkdir -p "$SNAP" docs/logs
for f in $FILES; do
  mkdir -p "$SNAP/$(dirname "$f")"
  cp -r "$f" "$SNAP/$f"
done
for s in $SHOTS; do
  mkdir -p "$SNAP/$(dirname "$s")"
  cp "$s" "$SNAP/$s"
done
imgs=()
for s in $SHOTS; do imgs+=(-i "$s"); done

valid() {
  local f="docs/REVIEW-$RN.md"
  [ -s "$f" ] || return 1
  grep -qE '^\s*\**SCORE:' "$f" || return 1
  last=$(grep -v '^\s*$' "$f" | tail -n 1 | tr -d '*` \r')
  case "$last" in VERDICT:APPROVE|VERDICT:REJECT) return 0;; esac
  return 1
}

for attempt in 1 2; do
  echo "[review $RN] attempt $attempt start $(date +%H:%M:%S)"
  # prompt MUST precede -i (variadic); stdin from /dev/null
  codex exec -C "$SNAP" --skip-git-repo-check -s read-only -m gpt-6-astra \
    -c model_reasoning_effort='"max"' -o "docs/REVIEW-$RN.md" \
    "$(cat "docs/REVIEW-$RN-TASK.md")" "${imgs[@]}" < /dev/null \
    > "docs/logs/REVIEW-$RN.stdout.$attempt.log" 2>&1
  echo "[review $RN] attempt $attempt rc=$? end $(date +%H:%M:%S)"
  if valid; then echo "[review $RN] VALID"; exit 0; fi
  echo "[review $RN] INVALID output (missing SCORE/VERDICT) - retrying"
  [ -f "docs/REVIEW-$RN.md" ] && mv "docs/REVIEW-$RN.md" "docs/logs/REVIEW-$RN.invalid.$attempt.md"
done
echo "[review $RN] FAILED twice"
exit 1
