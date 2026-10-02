#!/usr/bin/env python3
"""
Perfect-Information Monte Carlo (PIMC) policy for the Cassino simulator
(ORIGINAL COMPUTATION; robustness check for the dealer/non-dealer result).

For each decision: sample `n_worlds` determinizations of the hidden cards
(opponent hand + undealt stock order) uniformly from the cards this player has
not seen; for every legal move, apply it in each world and roll the hand out
to the end with greedy play for both sides; pick the move with the best mean
final hand point differential (own total - opponent total, sweeps included).
"""
import random
from cassino_sim import (State, Build, legal_moves, apply_move, score_hand,
                         GreedyPolicy, HeuristicPolicy, RandomPolicy, ALL_CARDS, RANK,
                         play_hand)


def copy_state(st):
    s = State.__new__(State)
    s.dealer = st.dealer
    s.stock = list(st.stock)
    s.hands = [list(st.hands[0]), list(st.hands[1])]
    s.loose = list(st.loose)
    s.builds = [b.copy() for b in st.builds]
    s.piles = [list(st.piles[0]), list(st.piles[1])]
    s.sweeps = list(st.sweeps)
    s.last_capturer = st.last_capturer
    s.public = set(st.public)
    s.deal_no = st.deal_no
    s.to_move = st.to_move
    s.n_plays = st.n_plays
    s.branching = []
    return s


_GREEDY = GreedyPolicy()


def rollout(st, p, rng, pol=_GREEDY):
    while True:
        in_deal = st.n_plays - 8 * (st.deal_no - 1)
        if in_deal == 8:
            if st.deal_no == 6:
                break
            st.deal()
            p = st.to_move
        moves = legal_moves(st, p)
        m = pol.choose(st, p, moves, rng)
        apply_move(st, p, m)
        p = 1 - p
    if st.last_capturer is not None:
        for b in st.builds:
            st.piles[st.last_capturer].extend(b.cards)
        st.piles[st.last_capturer].extend(st.loose)
    st.loose, st.builds = [], []
    return score_hand(st)


class PIMCPolicy:
    name = 'pimc'

    def __init__(self, n_worlds=8):
        self.n_worlds = n_worlds

    def choose(self, st, p, moves, rng):
        if len(moves) == 1:
            return moves[0]
        q = 1 - p
        unseen = [c for c in ALL_CARDS if c not in st.public and c not in st.hands[p]]
        h = len(st.hands[q])
        assert len(unseen) == h + len(st.stock), (len(unseen), h, len(st.stock))
        totals = [0.0] * len(moves)
        for w in range(self.n_worlds):
            perm = list(unseen)
            rng.shuffle(perm)
            # consistency: the opponent must hold a card of the value of
            # every build it controls (rules force it); place one such card.
            forced = []
            for b in st.builds:
                if b.owner == q and not any(RANK[c] == b.value for c in forced):
                    for c in perm:
                        if RANK[c] == b.value and c not in forced:
                            forced.append(c)
                            break
            rest = [c for c in perm if c not in forced]
            base = copy_state(st)
            base.hands[q] = forced + rest[:h - len(forced)]
            base.stock = rest[h - len(forced):]
            seed = rng.randrange(1 << 30)
            for i, m in enumerate(moves):
                s2 = copy_state(base)
                apply_move(s2, p, m)
                sc = rollout(s2, q, random.Random(seed))
                totals[i] += sc[p]['total'] - sc[q]['total']
        best = max(totals)
        cands = [m for m, t in zip(moves, totals) if t >= best - 1e-9]
        return rng.choice(cands)


if __name__ == '__main__':
    import sys, time, json, math
    mode = sys.argv[1] if len(sys.argv) > 1 else 'self'
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    rng = random.Random(seed)
    t = time.time()
    rows = []
    if mode == 'self':
        pols = [PIMCPolicy(), PIMCPolicy()]
        for i in range(n):
            dealer = i % 2
            sc, info = play_hand(pols, dealer, rng)
            rows.append({'dealer_total': sc[dealer]['total'], 'nondealer_total': sc[1 - dealer]['total'],
                         'dealer_total11': sc[dealer]['total11'], 'nondealer_total11': sc[1 - dealer]['total11'],
                         'dealer_sweeps': sc[dealer]['sweeps'], 'nondealer_sweeps': sc[1 - dealer]['sweeps'],
                         'dealer_cards': sc[dealer]['n_cards'], 'dealer_aces': sc[dealer]['aces'],
                         'dealer_resid': 1 if info['last_capturer'] == dealer else 0})
    else:
        # duplicate: PIMC (player0) vs other (player1), same deck both seatings
        other = {'heuristic': HeuristicPolicy, 'greedy': GreedyPolicy, 'random': RandomPolicy}[mode]
        for i in range(n):
            deck = list(ALL_CARDS)
            rng.shuffle(deck)
            hs = rng.randrange(1 << 30)
            for dealer in (0, 1):
                sc, info = play_hand([PIMCPolicy(), other()], dealer, random.Random(hs), deck=list(deck))
                rows.append({'pimc_dealer': dealer == 0, 'pimc_total': sc[0]['total'], 'other_total': sc[1]['total']})
    print(json.dumps({'mode': mode, 'n': n, 'seed': seed, 'rows': rows, 'elapsed': time.time() - t}))
