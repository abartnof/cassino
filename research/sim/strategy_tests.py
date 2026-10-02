#!/usr/bin/env python3
"""
ORIGINAL COMPUTATION (coordinator synthesis pass): tests of historical Cassino
strategy maxims, using the rules engine in cassino_sim.py (pagat standard
two-player rules, sweeps scored).

Each maxim is implemented as a small modification of the simulator's GreedyPolicy
(capture the most valuable set; otherwise trail; never build). Each variant
plays duplicate matches against the unmodified greedy baseline: every shuffled
deck is played twice with the policies swapping seats (the variant is the
dealer once and the non-dealer once), so deal luck cancels.
Reported: mean (variant - baseline) points per hand, with a 95% CI.

These are tests "within a greedy framework": they measure whether a maxim helps a
simple capture-first player, not whether it is optimal play.

Usage: python3 strategy_tests.py N_DECKS SEED [variant ...]
"""
import sys, json, random, math
from multiprocessing import Pool
import cassino_sim as cs
from cassino_sim import RANK, SUIT, CV, SPADES, BIG_CASINO, LITTLE_CASINO, ALL_CARDS


def _sweepable(loose):
    """Could some single card capture every loose card (no builds)?"""
    if not loose:
        return False
    faces = [c for c in loose if RANK[c] > 10]
    if faces:
        return len(loose) == 1
    for v in range(1, 11):
        for u in cs.maximal_captures(loose, v):
            if len(u) == len(loose):
                return True
    return False


def _makes_ten(card, loose):
    if RANK[card] > 10:
        return False
    rest = 10 - RANK[card]
    if rest <= 0:
        return False
    nums = [c for c in loose if RANK[c] <= 10]
    return bool(cs.subsets_summing(nums, rest))


class Variant(cs.GreedyPolicy):
    def __init__(self, name, trail='lowcv', hold_face=False, take_played=False,
                 card_w=None, avoid_ten=False, avoid_sweep=False, spade_bonus=None):
        self.name = name
        self.trail = trail
        self.hold_face = hold_face
        self.take_played = take_played
        self.card_w = card_w
        self.avoid_ten = avoid_ten
        self.avoid_sweep = avoid_sweep
        self.spade_bonus = spade_bonus
        self.last_trailed_by_opp = None

    # value of a capture under (optionally) re-weighted card values
    def _val(self, st, p, m):
        if self.card_w is None and self.spade_bonus is None:
            return cs.immediate_value(st, p, m)
        cards = [m[1]] + list(m[2])
        if m[3]:
            cards += st.build_with_value(m[3]).cards
        w = self.card_w if self.card_w is not None else 0.2
        sb = self.spade_bonus if self.spade_bonus is not None else 0.15
        v = 0.0
        for c in cards:
            v += w + (sb if SUIT[c] == SPADES else 0)
            if RANK[c] == 1: v += 1
            if c == BIG_CASINO: v += 2
            if c == LITTLE_CASINO: v += 1
        if len(st.loose) - len(m[2]) == 0 and len(st.builds) - (1 if m[3] else 0) == 0:
            v += 1
        return v

    def choose(self, st, p, moves, rng):
        caps = [m for m in moves if m[0] == 'C']
        final = st.final_deal()
        if caps:
            if self.take_played and st.loose:
                # Long 1792 rule I: take the card the adversary just played in preference
                tgt = st.loose[-1] if getattr(st, '_last_trail_player', None) == 1 - p else None
                if tgt is not None:
                    pref = [m for m in caps if tgt in m[2]]
                    if pref:
                        caps = pref
            if self.hold_face and final and len(st.hands[p]) > 1:
                nonface = [m for m in caps if RANK[m[1]] <= 10]
                # keep the face card for last unless a face capture is the only capture
                if nonface:
                    caps = nonface
            best = max(self._val(st, p, m) for m in caps)
            cands = [m for m in caps if self._val(st, p, m) >= best - 1e-9]
            return rng.choice(cands)
        trails = [m for m in moves if m[0] == 'T']
        if not trails:
            return rng.choice(moves)
        cand = list(trails)
        if self.hold_face and final and len(st.hands[p]) > 1:
            x = [m for m in cand if RANK[m[1]] <= 10]
            if x: cand = x
        if self.avoid_ten:
            seen = st.public | set(st.hands[p])
            if BIG_CASINO not in seen:
                x = [m for m in cand if not _makes_ten(m[1], st.loose)]
                if x: cand = x
        if self.avoid_sweep:
            x = [m for m in cand if not _sweepable(st.loose + [m[1]])]
            if x: cand = x
        key = self._trail_key(st, p)
        lo = min(key(m[1]) for m in cand)
        cands = [m for m in cand if key(m[1]) <= lo + 1e-9]
        return rng.choice(cands)

    def _trail_key(self, st, p):
        if self.trail == 'lowcv':          # simulator baseline: least valuable card
            return lambda c: CV[c]
        if self.trail == 'foster':          # Foster 1897: smaller cards, except Aces and Little Cassino; no spades
            def k(c):
                special = RANK[c] == 1 or c == LITTLE_CASINO or c == BIG_CASINO
                return (2 if special else 0) + (1 if SUIT[c] == SPADES else 0) + RANK[c] / 100.0
            return k
        if self.trail == 'court_first':     # Long 1792 rule VIII: court card or a little one, keep aces
            def k(c):
                if RANK[c] > 10: return 0 + (0.5 if SUIT[c] == SPADES else 0)
                special = RANK[c] == 1 or c in (LITTLE_CASINO, BIG_CASINO)
                return (5 if special else 1) + RANK[c] / 100.0 + (0.5 if SUIT[c] == SPADES else 0)
            return k
        if self.trail == 'psellos':         # Psellos: trail higher cards early, lower cards later
            early = st.deal_no <= 3
            def k(c):
                special = RANK[c] == 1 or c in (LITTLE_CASINO, BIG_CASINO)
                r = RANK[c] if RANK[c] <= 10 else 10.5
                return (5 if special else 0) + (0.5 if SUIT[c] == SPADES else 0) + ((-r if early else r) / 100.0)
            return k
        if self.trail == 'high':
            def k(c):
                special = RANK[c] == 1 or c in (LITTLE_CASINO, BIG_CASINO)
                return (5 if special else 0) - RANK[c] / 100.0
            return k
        raise ValueError(self.trail)


VARIANTS = {
    'baseline_copy':   dict(),
    'trail_foster':    dict(trail='foster'),
    'trail_court_first': dict(trail='court_first'),
    'trail_psellos':   dict(trail='psellos'),
    'trail_high':      dict(trail='high'),
    'hold_face_last':  dict(hold_face=True),
    'take_played':     dict(take_played=True),
    'cards_first_w04': dict(card_w=0.4),
    'cards_first_w08': dict(card_w=0.8),
    'cards_low_w005':  dict(card_w=0.05),
    'spades_heavy':    dict(spade_bonus=0.5),
    'avoid_ten_trail': dict(avoid_ten=True),
    'avoid_sweep_trail': dict(avoid_sweep=True),
    'foster_all':      dict(trail='foster', avoid_ten=True, hold_face=True, card_w=0.4),
    'long1792_all':    dict(trail='court_first', take_played=True, avoid_sweep=True, hold_face=True),
}


# --- track who trailed last (needed for take_played); wrap apply_move
_orig_apply = cs.apply_move
def _apply(st, p, m):
    r = _orig_apply(st, p, m)
    st._last_trail_player = p if m[0] == 'T' else None
    return r
cs.apply_move = _apply


def run_chunk(args):
    vname, seed, n = args
    rng = random.Random(seed)
    V = Variant(vname, **VARIANTS[vname])
    B = cs.GreedyPolicy()
    diffs, sweepsV, sweepsB, res_dealer = [], 0, 0, 0
    for _ in range(n):
        deck = list(ALL_CARDS); rng.shuffle(deck)
        d = 0.0
        for seat in (0, 1):               # variant in seat `seat`, dealer always player 0
            pols = [V, B] if seat == 0 else [B, V]
            sc, info = cs.play_hand(pols, 0, random.Random(rng.random()), deck=list(deck))
            d += sc[seat]['total'] - sc[1 - seat]['total']
            sweepsV += sc[seat]['sweeps']; sweepsB += sc[1 - seat]['sweeps']
        diffs.append(d / 2.0)
    return diffs, sweepsV, sweepsB


def main():
    n = int(sys.argv[1]); seed = int(sys.argv[2])
    names = sys.argv[3:] or list(VARIANTS)
    out = {}
    with Pool() as pool:
        for vi, v in enumerate(names):
            chunks = [(v, seed * 1000 + vi * 100 + k, n // 8) for k in range(8)]
            rows = pool.map(run_chunk, chunks)
            diffs = [x for r in rows for x in r[0]]
            m = sum(diffs) / len(diffs)
            sd = math.sqrt(sum((x - m) ** 2 for x in diffs) / (len(diffs) - 1))
            ci = 1.96 * sd / math.sqrt(len(diffs))
            sv = sum(r[1] for r in rows) / (2 * len(diffs)); sb = sum(r[2] for r in rows) / (2 * len(diffs))
            out[v] = {'n_decks': len(diffs), 'mean_diff_pts_per_hand': round(m, 4),
                      'ci95': [round(m - ci, 4), round(m + ci, 4)],
                      'variant_sweeps_per_hand': round(sv, 4), 'baseline_sweeps_per_hand': round(sb, 4),
                      'spec': VARIANTS[v]}
            print(v, out[v], flush=True)
    with open(f'strategy_tests_{seed}.json', 'w') as f:
        json.dump(out, f, indent=1)


if __name__ == '__main__':
    main()
