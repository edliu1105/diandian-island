#!/usr/bin/env bash
# R4 (client instruction: code and assets only - no test logs, no run screenshots; asset contact sheets attached)
cd "$(dirname "$0")/.."
FILES="index.html sw.js manifest.webmanifest README.md assets docs/TASK.md docs/DESIGN.md docs/REVIEW_BRIEF_CODE.md docs/REVIEW-R1.md docs/RESPONSE-R1.md docs/REVIEW-R2.md docs/RESPONSE-R2.md docs/REVIEW-R3.md docs/RESPONSE-R3.md docs/DEPLOY.md docs/IPAD-CHECKLIST.md tools docs/assets_sheets"
SHOTS="docs/assets_sheets/A1_backgrounds.jpg docs/assets_sheets/A2_props.jpg docs/assets_sheets/A3_characters.jpg docs/assets_sheets/A4_islands_icons.jpg"
bash tools/review.sh R4 "$FILES" "$SHOTS"
