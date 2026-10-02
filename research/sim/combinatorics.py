#!/usr/bin/env python3
"""Exact combinatorial facts for Cassino and relatives (ORIGINAL COMPUTATION).
All results are exact enumerations / closed forms; run: python3 combinatorics.py
"""
from fractions import Fraction as F
from math import comb, factorial, log10
from itertools import combinations

out = {}

# 1. Cassino (2 players): number of distinct deals of one hand, treating each
#    4-card packet (table, then per deal: non-dealer, dealer) as unordered but
#    packet sequence as ordered: 52! / (4!)^13
n_deals = factorial(52) // (factorial(4) ** 13)
out['cassino_distinct_deals_log10'] = round(log10(n_deals), 3)

# 2. Cassino: hidden information at the first decision: non-dealer sees own 4 +
#    table 4 = 8 cards; opponent's hand is any 4 of the 44 unseen cards
out['cassino_first_decision_opponent_hands'] = comb(44, 4)

# 3. Pasur: P(at least one Jack among the initial 4 table cards) -> Jack must
#    be replaced (Baghal 2025 rule description)
out['pasur_P_jack_in_initial_pool'] = float(1 - F(comb(48, 4), comb(52, 4)))

# 4. Scopa/Scopone (40 cards): P(3 or 4 kings among 4 table cards) -> redeal
#    under the rule quoted by Di Palma & Lanzi (2018)
p = F(comb(4, 3) * comb(36, 1) + comb(4, 4), comb(40, 4))
out['scopa_P_3plus_kings_on_table'] = (str(p), float(p))

# 5. Escoba (Spanish 40-card deck, values 1-7, sota 8, caballo 9, rey 10):
#    P(the 4 initial table cards sum to 15 or to 30) -> 'escoba' for dealer
vals = [v for v in list(range(1, 8)) + [8, 9, 10] for _ in range(4)]
tot = 0
c15 = c30 = 0
for comb4 in combinations(range(40), 4):
    s = sum(vals[i] for i in comb4)
    tot += 1
    if s == 15:
        c15 += 1
    elif s == 30:
        c30 += 1
out['escoba_P_table_sums_15'] = (c15, tot, c15 / tot)
out['escoba_P_table_sums_30'] = (c30, tot, c30 / tot)
out['escoba_deck_total_mod_15'] = sum(vals) % 15  # => residue sum = 10 mod 15

# 6. Scopone a 10 carte: conditional probabilities that the next player holds a
#    card of the rank just led onto an empty table (Favero 2003 check):
#    S holds g cards of the rank (g=1..4); next player E holds 10 of the 30
#    cards S cannot see.
cond = {}
for g in range(1, 5):
    left = 4 - g
    p_none = F(comb(30 - left, 10), comb(30, 10))
    cond[g] = (str(1 - p_none), float(1 - p_none))
out['scopone10_P_next_player_can_scopa_given_group_size'] = cond

# 7. Cassino: P(non-dealer's first card can match the rank of at least one of
#    the 4 table cards) is policy-free only for rank matches; give P(the
#    4 table cards are 4 distinct ranks)
r = [rk for rk in range(13) for _ in range(4)]
distinct = sum(1 for c in combinations(range(52), 4) if len({r[i] for i in c}) == 4)
out['cassino_P_table_4_distinct_ranks'] = distinct / comb(52, 4)

if __name__ == '__main__':
    import json
    print(json.dumps(out, indent=1))
