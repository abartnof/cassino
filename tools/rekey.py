#!/usr/bin/env python3
"""Re-key citations like [S8] or [S8, S9 p.3] in a research-note excerpt to [05-S8] style.
Usage: rekey.py NOTE_PREFIX < excerpt.md > out.md"""
import re, sys
prefix = sys.argv[1]
tok = re.compile(r'(?<![\w-])(S\d+[a-z]?(?:-[A-Za-z]+\d+)?)')
def fix(m):
    inner = m.group(1)
    if not re.match(r'\s*S\d', inner):
        return m.group(0)
    return '[' + tok.sub(lambda t: f'{prefix}-{t.group(1)}', inner) + ']'
sys.stdout.write(re.sub(r'\[([^\[\]]*)\]', fix, sys.stdin.read()))
