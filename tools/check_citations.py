#!/usr/bin/env python3
"""Verify every [NN-S#] key cited in a markdown file exists in the bibliography appendix."""
import re, sys
doc = open(sys.argv[1]).read()
bib = open(sys.argv[2]).read()
defined = set(re.findall(r'\[(\d\d-(?:V-)?S\d+[a-z]?(?:-[A-Za-z]+\d+)?)\]', bib))
# within bib, entries are like "- [02-S1]" or "- **[02-S1]**"
cited = set()
for inner in re.findall(r'\[([^\[\]]*\d\d-(?:V-)?S\d[^\[\]]*)\]', doc):
    for k in re.findall(r'(\d\d-(?:V-)?S\d+[a-z]?(?:-[A-Za-z]+\d+)?)', inner):
        cited.add(k)
missing = sorted(k for k in cited if k not in defined)
print(f'cited keys: {len(cited)}; defined: {len(defined)}; missing: {len(missing)}')
for k in missing: print('  MISSING', k)
