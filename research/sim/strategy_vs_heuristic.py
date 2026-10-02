#!/usr/bin/env python3
"""ORIGINAL COMPUTATION: strategy-maxim variants (greedy-based, see strategy_tests.py)
each played in duplicate against the one-ply card-counting HeuristicPolicy (which builds).
Reports variant-minus-heuristic points per hand; compare each variant with the plain greedy
baseline row to get the maxim's effect against a building opponent.
Usage: python3 strategy_vs_heuristic.py N_DECKS SEED variant..."""
import sys, json, math, random
from multiprocessing import Pool
import strategy_tests as T
import cassino_sim as cs

def run_chunk(args):
    vname, seed, n = args
    rng = random.Random(seed)
    V = T.Variant(vname, **T.VARIANTS[vname]) if vname != 'greedy' else cs.GreedyPolicy()
    H = cs.HeuristicPolicy()
    diffs = []
    for _ in range(n):
        deck = list(cs.ALL_CARDS); rng.shuffle(deck)
        d = 0.0
        for seat in (0, 1):
            pols = [V, H] if seat == 0 else [H, V]
            sc, _ = cs.play_hand(pols, 0, random.Random(rng.random()), deck=list(deck))
            d += sc[seat]['total'] - sc[1 - seat]['total']
        diffs.append(d / 2)
    return diffs

if __name__ == '__main__':
    n, seed = int(sys.argv[1]), int(sys.argv[2])
    out = {}
    with Pool() as pool:
        for vi, v in enumerate(sys.argv[3:]):
            # common random numbers: same seeds for every variant
            rows = pool.map(run_chunk, [(v, seed * 1000 + k, n // 8) for k in range(8)])
            d = [x for r in rows for x in r]
            m = sum(d) / len(d); sd = math.sqrt(sum((x - m) ** 2 for x in d) / (len(d) - 1))
            out[v] = {'n_decks': len(d), 'mean_vs_heuristic': round(m, 4), 'ci95': [round(m - 1.96 * sd / math.sqrt(len(d)), 4), round(m + 1.96 * sd / math.sqrt(len(d)), 4)], 'diffs': d}
            print(v, {k: out[v][k] for k in ('n_decks', 'mean_vs_heuristic', 'ci95')}, flush=True)
    json.dump(out, open(f'strategy_vs_heuristic_{seed}.json', 'w'))
