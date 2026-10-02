#!/usr/bin/env python3
"""Concatenate the Sources sections of research/NN-*.md, re-keying [S#] -> [NN-S#]."""
import re, glob, subprocess, os
out = ["## Appendix B. Bibliography (all sources, keyed by research note)\n",
       "Citation keys in the review take the form `[NN-S#]`, where NN is the research note (folder `research/`) and S# is the source number within that note's own source list, reproduced below. `[11-V-S#]` keys refer to the coordinator's verification note. A reference like `[03 §V2]` or `[11 §V4]` points to a section of a research note rather than a single source. Every source was fetched and read during this research session (2 October 2026), unless the note marks it otherwise.\n"]
titles = {}
for f in sorted(glob.glob('research/[01][0-9]-*.md')):
    nn = os.path.basename(f)[:2]
    txt = open(f).read()
    m = re.search(r'^## Sources[^\n]*\n(.*?)(?=^## |\Z)', txt, re.S | re.M)
    if not m:
        continue
    body = m.group(1)
    if nn == '11':
        body = body.replace('[V-S', '[11-V-S')
    else:
        body = subprocess.run(['python3', 'tools/rekey.py', nn], input=body, capture_output=True, text=True).stdout
    title = txt.splitlines()[0].lstrip('# ').strip()
    out.append(f"\n### Note {nn}: {title}\n")
    out.append(f"(Full note: `research/{os.path.basename(f)}`)\n\n")
    out.append(body.strip() + "\n")
out.append('''
### Key aliases
- [05-S74] = the BoardGameGeek thread group in note 05 (Casino, BGG id 18121), itemised above as [05-S74-BGG…].
- [08-S46a], [08-S46b] = items (a) and (b) of [08-S46]; [08-S47a], [08-S47b], [08-S47c] = items (a)–(c) of [08-S47]; [08-S30b] = second item of [08-S30]; [08-S11b] style suffixes follow the same convention.
- [05-S11b] = Foster 1897 first edition, listed in note 05 as S11b.
''')
open('drafts/99-bibliography.md', 'w').write('\n'.join(out))
print('ok', sum(1 for l in '\n'.join(out).splitlines() if l.lstrip().startswith(('- [', '- **['))))
