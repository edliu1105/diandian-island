#!/usr/bin/env bash
# R3 invocation of tools/review.sh: frozen files (globs expand inside review.sh) + the 16 contact sheets
cd "$(dirname "$0")/.."
FILES="index.html sw.js manifest.webmanifest README.md .nojekyll assets docs/TASK.md docs/DESIGN.md docs/REVIEW_BRIEF.md docs/REVIEW-R1.md docs/RESPONSE-R1.md docs/REVIEW-R2.md docs/RESPONSE-R2.md docs/DEPLOY.md docs/IPAD-CHECKLIST.md tests/*.py tests/run_all.sh tests/logs/r3_* tools shots/R3"
SHOTS="$(ls shots/R3/R3_*.jpg | tr '\n' ' ')"
bash tools/review.sh R3 "$FILES" "$SHOTS"
