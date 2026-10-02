#!/bin/sh
# Build cassino-lit-review.pdf from the assembled markdown.
# Requires: pandoc, weasyprint (Debian: apt install pandoc weasyprint fonts-noto-core).
set -e
cd "$(dirname "$0")/.."
sh tools/assemble.sh
pandoc cassino-lit-review.md \
  --from markdown-tex_math_dollars-raw_tex \
  --standalone \
  --columns=100000 \
  --metadata lang=en \
  --metadata pagetitle="Cassino (Casino): A Literature Review for Game Development" \
  --css "$(pwd)/tools/pdf.css" \
  --pdf-engine=weasyprint \
  -o cassino-lit-review.pdf
ls -l cassino-lit-review.pdf
