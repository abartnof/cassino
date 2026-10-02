#!/usr/bin/env python3
"""
Experiments for the Cassino Monte Carlo study (ORIGINAL COMPUTATION).
Run:  python3 run_experiments.py [--quick]
Writes results.json and prints a summary. Deterministic for a given
--seed regardless of the number of worker processes (work is split into
fixed seeded chunks).
"""
import argparse
import json
import math
import multiprocessing as mp
import random
import statistics
import sys
import time
from collections import Counter

from cassino_sim import POLICIES, play_hand, play_game, ALL_CARDS

CHUNK = 500


def mk_pols(a, b):
    return [POLICIES[a](), POLICIES[b]()]


# ------------------------------------------------------------ workers
def w_selfplay(args):
    pol, seed, n = args
    rng = random.Random(seed)
    pols = mk_pols(pol, pol)
    rows = []
    for i in range(n):
        dealer = i % 2
        sc, info = play_hand(pols, dealer, rng)
        d, nd = sc[dealer], sc[1 - dealer]
        rows.append((
            d['total'], nd['total'], d['total11'], nd['total11'],
            d['n_cards'], d['n_spades'], d['cards'], nd['cards'],
            d['spades'], d['big'], d['little'], d['aces'],
            d['sweeps'], nd['sweeps'],
            info['residue'], 1 if info['last_capturer'] == dealer else 0,
            1 if info['first_play_sweep_possible'] else 0,
        ))
    return rows


def w_duplicate(args):
    a, b, seed, n = args
    rng = random.Random(seed)
    out = []
    for i in range(n):
        deck = list(ALL_CARDS)
        rng.shuffle(deck)
        hseed = rng.randrange(1 << 30)
        res = []
        # A deals (A = player0 dealer), then same deck with B dealing
        for dealer_is_a in (True, False):
            pols = mk_pols(a, b)  # player0 = A, player1 = B
            dealer = 0 if dealer_is_a else 1
            sc, _ = play_hand(pols, dealer, random.Random(hseed), deck=list(deck))
            res.append((sc[0]['total'], sc[1]['total'], sc[0]['total11'], sc[1]['total11']))
        out.append(res)
    return out


def w_games(args):
    a, b, seed, n, sweeps_count = args
    rng = random.Random(seed)
    out = []
    for i in range(n):
        first_dealer = i % 2
        g = play_game(mk_pols(a, b), first_dealer, rng, sweeps_count=sweeps_count)
        out.append((g['winner'], g['n_hands'], g['totals'][0], g['totals'][1], first_dealer))
    return out


def w_branching(args):
    seed, n = args
    rng = random.Random(seed)
    pols = mk_pols('random', 'random')
    out = []
    for i in range(n):
        sc, info = play_hand(pols, i % 2, rng, record_branching=True)
        out.append(info['branching'])
    return out


def run_chunks(pool, fn, base_args_list):
    res = pool.map(fn, base_args_list, chunksize=1)
    flat = []
    for r in res:
        flat.extend(r)
    return flat


def chunks(total, seed0):
    k = 0
    out = []
    while total > 0:
        n = min(CHUNK, total)
        out.append((seed0 + k, n))
        total -= n
        k += 1
    return out


# ------------------------------------------------------------ stats
def mean_ci(xs):
    n = len(xs)
    m = sum(xs) / n
    sd = statistics.pstdev(xs) if n > 1 else 0.0
    se = sd / math.sqrt(n)
    return {'mean': round(m, 4), 'sd': round(sd, 4), 'ci95': [round(m - 1.96 * se, 4), round(m + 1.96 * se, 4)], 'n': n}


def prop_ci(k, n):
    p = k / n
    se = math.sqrt(p * (1 - p) / n)
    return {'p': round(p, 4), 'ci95': [round(p - 1.96 * se, 4), round(p + 1.96 * se, 4)], 'k': k, 'n': n}


def summarize_selfplay(rows):
    n = len(rows)
    col = list(zip(*rows))
    (dt, ndt, dt11, ndt11, dcards, dspades, dcp, ndcp, dsp, dbig, dlit, daces,
     dsw, ndsw, resid, dres, fps) = col
    diff = [a - b for a, b in zip(dt, ndt)]
    diff11 = [a - b for a, b in zip(dt11, ndt11)]
    sweeps_total = [a + b for a, b in zip(dsw, ndsw)]
    s = {
        'n_hands': n,
        'dealer_points': mean_ci(dt), 'nondealer_points': mean_ci(ndt),
        'dealer_minus_nondealer': mean_ci(diff),
        'dealer_points_no_sweeps': mean_ci(dt11), 'nondealer_points_no_sweeps': mean_ci(ndt11),
        'dealer_minus_nondealer_no_sweeps': mean_ci(diff11),
        'P_dealer_wins_hand': prop_ci(sum(1 for x in diff if x > 0), n),
        'P_hand_tied': prop_ci(sum(1 for x in diff if x == 0), n),
        'dealer_cards_count': mean_ci(dcards),
        'P_dealer_most_cards': prop_ci(sum(1 for x in dcp if x == 3), n),
        'P_nondealer_most_cards': prop_ci(sum(1 for x in ndcp if x == 3), n),
        'P_cards_tie_26_26': prop_ci(sum(1 for x in dcards if x == 26), n),
        'dealer_spades_count': mean_ci(dspades),
        'P_dealer_most_spades': prop_ci(sum(dsp), n),
        'P_dealer_big_casino': prop_ci(sum(1 for x in dbig if x), n),
        'P_dealer_little_casino': prop_ci(sum(dlit), n),
        'dealer_aces': mean_ci(daces),
        'dealer_sweeps': mean_ci(dsw), 'nondealer_sweeps': mean_ci(ndsw),
        'sweeps_per_hand_total': mean_ci(sweeps_total),
        'sweeps_per_hand_distribution': {str(k): round(v / n, 4) for k, v in sorted(Counter(sweeps_total).items())},
        'P_at_least_one_sweep': prop_ci(sum(1 for x in sweeps_total if x > 0), n),
        'residue_cards': mean_ci(resid),
        'P_dealer_takes_residue': prop_ci(sum(dres), n),
        'P_first_play_can_sweep': prop_ci(sum(fps), n),
        'dealer_cards_distribution': {str(k): round(v / n, 4) for k, v in sorted(Counter(dcards).items())},
    }
    # expected category points by role
    s['category_points_dealer'] = {
        'cards(3)': round(sum(dcp) / n, 4), 'spades(1)': round(sum(dsp) / n, 4),
        'big_casino(2)': round(sum(dbig) / n, 4), 'little_casino(1)': round(sum(dlit) / n, 4),
        'aces(4)': round(sum(daces) / n, 4), 'sweeps': round(sum(dsw) / n, 4)}
    s['category_points_nondealer'] = {
        'cards(3)': round(sum(ndcp) / n, 4), 'spades(1)': round(1 - sum(dsp) / n, 4),
        'big_casino(2)': round(2 - sum(dbig) / n, 4), 'little_casino(1)': round(1 - sum(dlit) / n, 4),
        'aces(4)': round(4 - sum(daces) / n, 4), 'sweeps': round(sum(ndsw) / n, 4)}
    return s


def summarize_duplicate(rows, a, b):
    # rows: list of [(A0,B0,A0_11,B0_11) with A dealing, (...) with B dealing]
    diffs, diffs11, awins, ties, n_hands = [], [], 0, 0, 0
    a_deal_diff, b_deal_diff = [], []
    for (r1, r2) in rows:
        d1 = r1[0] - r1[1]
        d2 = r2[0] - r2[1]
        diffs.append((d1 + d2) / 2)
        diffs11.append(((r1[2] - r1[3]) + (r2[2] - r2[3])) / 2)
        a_deal_diff.append(d1)
        b_deal_diff.append(d2)
        for d in (d1, d2):
            n_hands += 1
            if d > 0:
                awins += 1
            elif d == 0:
                ties += 1
    return {
        'A': a, 'B': b, 'n_decks': len(rows), 'n_hands': n_hands,
        'A_minus_B_points_per_hand': mean_ci(diffs),
        'A_minus_B_points_per_hand_no_sweeps': mean_ci(diffs11),
        'A_minus_B_when_A_deals': mean_ci(a_deal_diff),
        'A_minus_B_when_B_deals': mean_ci(b_deal_diff),
        'P_A_wins_hand': prop_ci(awins, n_hands),
        'P_hand_tied': prop_ci(ties, n_hands),
    }


def summarize_games(rows, a, b):
    n = len(rows)
    hands = [r[1] for r in rows]
    awins = sum(1 for r in rows if r[0] == 0)
    fdw = sum(1 for r in rows if r[0] is not None and r[0] == r[4])
    unfinished = sum(1 for r in rows if r[0] is None)
    return {
        'A': a, 'B': b, 'n_games': n,
        'hands_per_game': mean_ci(hands),
        'hands_per_game_distribution': {str(k): round(v / n, 4) for k, v in sorted(Counter(hands).items())},
        'median_hands': statistics.median(hands),
        'P_A_wins_game': prop_ci(awins, n),
        'P_first_dealer_wins_game': prop_ci(fdw, n),
        'unfinished': unfinished,
        'winner_final_score': mean_ci([max(r[2], r[3]) for r in rows]),
        'loser_final_score': mean_ci([min(r[2], r[3]) for r in rows]),
    }


def summarize_branching(rows):
    import math as _m
    allb = [b for r in rows for b in r]
    logs = [sum(_m.log10(b) for b in r) for r in rows]
    # Knuth (1975) estimator: tree size (leaves) ~ E[prod b_i]; compute log10 of mean via log-sum-exp
    mx = max(logs)
    log_mean = mx + _m.log10(sum(10 ** (l - mx) for l in logs) / len(logs))
    by_pos = {}
    for r in rows:
        for i, b in enumerate(r):
            by_pos.setdefault(i, []).append(b)
    return {
        'n_hands': len(rows),
        'decisions_per_hand': 52,
        'mean_branching_factor': round(sum(allb) / len(allb), 3),
        'geometric_mean_branching_factor': round(10 ** (sum(logs) / sum(len(r) for r in rows)), 3),
        'max_branching_seen': max(allb),
        'mean_log10_path_product': round(sum(logs) / len(logs), 2),
        'median_log10_path_product': round(statistics.median(logs), 2),
        'log10_knuth_estimate_leaves_per_deal': round(log_mean, 2),
        'mean_branching_by_decision_index': [round(sum(by_pos[i]) / len(by_pos[i]), 2) for i in sorted(by_pos)],
    }


# ------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seed', type=int, default=20261002)
    ap.add_argument('--quick', action='store_true')
    ap.add_argument('--workers', type=int, default=2)
    ap.add_argument('--out', default='results.json')
    args = ap.parse_args()
    S = args.seed
    q = 0.05 if args.quick else 1.0

    def N(x):
        return max(CHUNK if x >= CHUNK else x, int(x * q)) if not args.quick else max(50, int(x * q))

    results = {'seed': S, 'quick': args.quick}
    t0 = time.time()
    with mp.Pool(args.workers) as pool:
        # A: self-play per policy
        results['selfplay'] = {}
        for k, (pol, n) in enumerate([('random', 40000), ('greedy', 40000), ('heuristic', 20000)]):
            ch = [(pol, s, m) for (s, m) in chunks(N(n), S + 1000 * (k + 1))]
            rows = run_chunks(pool, w_selfplay, ch)
            results['selfplay'][pol] = summarize_selfplay(rows)
            print(f"[{time.time()-t0:.0f}s] selfplay {pol} done", file=sys.stderr)
        # B: duplicate cross-policy
        results['duplicate'] = []
        for k, (a, b, n) in enumerate([('greedy', 'random', 10000), ('heuristic', 'random', 5000),
                                       ('heuristic', 'greedy', 8000)]):
            ch = [(a, b, s, m) for (s, m) in chunks(N(n), S + 50000 + 1000 * k)]
            rows = run_chunks(pool, w_duplicate, ch)
            results['duplicate'].append(summarize_duplicate(rows, a, b))
            print(f"[{time.time()-t0:.0f}s] duplicate {a}-{b} done", file=sys.stderr)
        # C: games to 21
        results['games'] = []
        for k, (a, b, n, sw) in enumerate([
                ('random', 'random', 20000, True), ('greedy', 'greedy', 20000, True),
                ('heuristic', 'heuristic', 5000, True),
                ('greedy', 'greedy', 20000, False), ('heuristic', 'heuristic', 3000, False),
                ('heuristic', 'greedy', 4000, True), ('heuristic', 'random', 2000, True),
                ('greedy', 'random', 10000, True)]):
            ch = [(a, b, s, m, sw) for (s, m) in chunks(N(n), S + 90000 + 1000 * k)]
            rows = run_chunks(pool, w_games, ch)
            r = summarize_games(rows, a, b)
            r['sweeps_count'] = sw
            results['games'].append(r)
            print(f"[{time.time()-t0:.0f}s] games {a}-{b} sweeps={sw} done", file=sys.stderr)
        # D: branching / complexity under random play
        ch = [(s, m) for (s, m) in chunks(N(10000), S + 200000)]
        rows = run_chunks(pool, w_branching, ch)
        results['complexity_random_play'] = summarize_branching(rows)
    results['elapsed_s'] = round(time.time() - t0, 1)
    with open(args.out, 'w') as f:
        json.dump(results, f, indent=1)
    print(json.dumps(results, indent=1))


if __name__ == '__main__':
    main()
