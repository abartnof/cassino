#!/bin/sh
# Assemble the literature review from drafts and verify citations.
set -e
cd "$(dirname "$0")/.."
python3 tools/build_bibliography.py > /dev/null
cat drafts/00-front.md drafts/02-history.md drafts/03-rules-a.md drafts/04-variants.md drafts/05-06-terms-talk.md drafts/07-tools.md drafts/08-stats.md drafts/09-strategy.md drafts/10-regional.md drafts/11-culture.md drafts/12-14-closing.md drafts/98-appendix-a.md drafts/99-bibliography.md | sed 's/\r$//' > cassino-lit-review.md
BODY=$(mktemp); cat drafts/0*.md drafts/1*.md > "$BODY"
python3 tools/check_citations.py "$BODY" drafts/99-bibliography.md
wc -w cassino-lit-review.md
rm -f "$BODY"
