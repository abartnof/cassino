#!/usr/bin/env python3
"""ORIGINAL COMPUTATION: paired (common-random-number) comparison of each variant in a
strategy_vs_heuristic_<seed>.json file with the plain greedy row. Every variant in that file
was played on the same decks, so per-deck differences give much tighter intervals than
comparing the unpaired confidence intervals.
Usage: python3 paired_deltas.py strategy_vs_heuristic_31.json  (writes *_paired.json)"""
import sys, json, math

src = sys.argv[1]
d = json.load(open(src))
g = d['greedy']['diffs']
out = {}
for k, v in d.items():
    x = [a - b for a, b in zip(v['diffs'], g)]
    m = sum(x) / len(x)
    sd = math.sqrt(sum((y - m) ** 2 for y in x) / (len(x) - 1))
    ci = 1.96 * sd / math.sqrt(len(x))
    out[k] = {'n_decks': len(x), 'mean_vs_heuristic': v['mean_vs_heuristic'],
              'gain_over_greedy': round(m, 4), 'ci95': [round(m - ci, 4), round(m + ci, 4)]}
    print(f"{k:26s} vs heuristic {v['mean_vs_heuristic']:+.3f}   gain over greedy {m:+.3f} [{m - ci:+.3f}, {m + ci:+.3f}]")
json.dump(out, open(src.replace('.json', '_paired.json'), 'w'), indent=1)
