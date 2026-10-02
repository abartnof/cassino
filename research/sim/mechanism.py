#!/usr/bin/env python3
"""Mechanism analysis of the seat (dealer / non-dealer) effect (ORIGINAL COMPUTATION).
Records, for self-play hands, where in each 8-play deal the sweeps happen and
who captures the scoring cards. Usage: python3 mechanism.py POLICY N SEED
"""
import json
import random
import sys
from collections import defaultdict
from cassino_sim import (State, POLICIES, legal_moves, apply_move, score_hand, ALL_CARDS,
                         RANK, SUIT, SPADES, BIG_CASINO, LITTLE_CASINO)


def run(pol_name, n, seed):
    rng = random.Random(seed)
    pols = [POLICIES[pol_name](), POLICIES[pol_name]()]
    sweeps_by_slot = defaultdict(int)       # (role, play index within deal 0..7)
    caps_by_slot = defaultdict(int)
    points_cards_by_role = defaultdict(int)  # aces + casinos captured "live" (not residue)
    first_deal_vs_later = defaultdict(int)
    for i in range(n):
        dealer = i % 2
        deck = list(ALL_CARDS)
        rng.shuffle(deck)
        st = State(deck, dealer)
        for d in range(6):
            st.deal()
            p = st.to_move
            for k in range(8):
                moves = legal_moves(st, p)
                m = pols[p].choose(st, p, moves, rng)
                before = st.sweeps[p]
                apply_move(st, p, m)
                role = 'dealer' if p == dealer else 'nondealer'
                if m[0] == 'C':
                    caps_by_slot[(role, k)] += 1
                    taken = [m[1]] + list(m[2])
                    for c in taken:
                        if RANK[c] == 1 or c in (BIG_CASINO, LITTLE_CASINO):
                            points_cards_by_role[role] += 1
                if st.sweeps[p] > before:
                    sweeps_by_slot[(role, k)] += 1
                    first_deal_vs_later[(role, 'deal1' if d == 0 else 'deal2-6')] += 1
                p = 1 - p
    return {
        'policy': pol_name, 'n_hands': n, 'seed': seed,
        'sweeps_per_hand_by_role_and_play_index': {f'{r}:{k}': round(v / n, 4) for (r, k), v in sorted(sweeps_by_slot.items())},
        'captures_per_hand_by_role_and_play_index': {f'{r}:{k}': round(v / n, 4) for (r, k), v in sorted(caps_by_slot.items())},
        'sweeps_per_hand_deal1_vs_later': {f'{r}:{d}': round(v / n, 4) for (r, d), v in sorted(first_deal_vs_later.items())},
        'scoring_cards_captured_in_play_per_hand': {r: round(v / n, 4) for r, v in points_cards_by_role.items()},
    }


if __name__ == '__main__':
    pol = sys.argv[1] if len(sys.argv) > 1 else 'heuristic'
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 7
    print(json.dumps(run(pol, n, seed), indent=1))
