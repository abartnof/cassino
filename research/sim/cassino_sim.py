#!/usr/bin/env python3
"""
Reproducible Monte Carlo simulator for standard two-player Cassino (Casino).

ORIGINAL COMPUTATION for the Cassino literature review
(research/07-statistics-academic.md). Not a published source.

Rules implemented (source: John McLeod, "Casino - Card Game Rules", pagat.com,
https://www.pagat.com/fishing/casino.html , page last updated 6 May 2026;
fetched 2026-10-02), two-player Anglo-American version:

  * 52-card French deck. Ace=1, 2..10 = pip value. J, Q, K have no numeric
    value and can only capture ONE face card of the same rank.
  * Deal: 4 cards to each player and 4 face up to the table on the first deal;
    afterwards 4 cards to each player and none to the table; 6 deals per
    "hand" (one pass through the deck). Non-dealer plays first in every deal;
    players alternate.
  * Plays: trail; capture (a numeral card captures any combination of
    disjoint sets of loose numeral cards each summing to its value, plus a
    build of that value); build (single build, multiple build); add to a
    build (raise a single build with a hand card; or add a matching set to
    any build, making it multiple). The builder must hold, in addition to
    the card played, a card able to capture the build. A player who controls
    a build (was last to add to it) may not trail and may not play so as to
    be left without a card of the build's value.
  * Residue: after the last card of the hand, remaining table cards go to the
    last player who captured (does not count as a sweep, unless the final
    capture itself took everything).
  * Scoring per hand: Most cards 3 (27+; 26-26 tie scores nothing),
    Most spades 1 (7+), Big Casino (10 of diamonds) 2, Little Casino
    (2 of spades) 1, each Ace 1 = 11 points; plus 1 point per sweep
    ("Many people play that a Sweep is worth one point" - pagat).
  * Game: first to 21 or more; if both reach 21 in the same hand the higher
    total wins; an exact tie plays another hand. Deal alternates.

Documented simplifications (choices of the simulator, not rules):
  * Capture moves offered to the policy are restricted to MAXIMAL captures of
    loose cards (no further disjoint set summing to the capturing value could
    be added) and always include the build of that value if one exists.
  * When a build of value v already exists, any new build of value v is
    merged into it (multiple build), so at most one build per value exists.
  * When a new multiple build absorbs further loose sets, the simulator
    absorbs the largest maximal packing only.
  * Builds use the standard (non-permissive) rules: table cards may not change
    the value of a single build; multiple builds cannot be raised.

Policies:
  random    - uniform over the legal-move list generated as above.
  greedy    - capture with the highest immediate value (card weights below,
              +1 for a sweep); otherwise trail the lowest-valued card;
              never builds.
  heuristic - one-ply look-ahead with card counting: for each legal move,
              immediate value + value of builds it controls that survive the
              opponent's reply, minus the expected value of the opponent's
              best immediate (greedy) reply, estimated by sampling the
              opponent's hidden hand from the cards this player has not seen.
              Handles the end-of-hand residue explicitly.

Card value weights used by greedy/heuristic (point-equivalents, a modelling
choice): every card 0.2 (towards 'most cards', 3 pts), spade +0.15, ace +1,
Big Casino +2, Little Casino +1; sweep +1.

Usage examples: see run_experiments.py.
"""
import random
import itertools
from functools import lru_cache

# ----------------------------------------------------------------- cards
SPADES, HEARTS, DIAMONDS, CLUBS = 0, 1, 2, 3
SUITCH = "SHDC"
RANKCH = {1: "A", 11: "J", 12: "Q", 13: "K"}


def mk(rank, suit):
    return (rank - 1) * 4 + suit


RANK = [c // 4 + 1 for c in range(52)]
SUIT = [c % 4 for c in range(52)]
BIG_CASINO = mk(10, DIAMONDS)
LITTLE_CASINO = mk(2, SPADES)
ALL_CARDS = tuple(range(52))


def cstr(c):
    r = RANK[c]
    return RANKCH.get(r, str(r)) + SUITCH[SUIT[c]]


W_CARD, W_SPADE, W_ACE, W_BIG, W_LITTLE, W_SWEEP = 0.2, 0.15, 1.0, 2.0, 1.0, 1.0


def _cv(c):
    v = W_CARD
    if SUIT[c] == SPADES:
        v += W_SPADE
    if RANK[c] == 1:
        v += W_ACE
    if c == BIG_CASINO:
        v += W_BIG
    if c == LITTLE_CASINO:
        v += W_LITTLE
    return v


CV = [_cv(c) for c in range(52)]


# ------------------------------------------------------ subset utilities
@lru_cache(maxsize=200000)
def _subsets_with_sum(cards, s):
    """cards: sorted tuple of numeral card ids. Return tuple of bitmasks
    (over positions in `cards`) of non-empty subsets whose rank sum == s."""
    n = len(cards)
    vals = [RANK[c] for c in cards]
    out = []
    # simple DFS with pruning (values are positive)
    order = sorted(range(n), key=lambda i: -vals[i])

    def dfs(k, rem, mask):
        if rem == 0:
            if mask:
                out.append(mask)
            return
        for j in range(k, n):
            i = order[j]
            if vals[i] <= rem:
                dfs(j + 1, rem - vals[i], mask | (1 << i))

    dfs(0, s, 0)
    return tuple(sorted(set(out)))


@lru_cache(maxsize=200000)
def _maximal_unions(cards, v):
    """All maximal unions of pairwise-disjoint subsets of `cards` each summing
    to v. Returns tuple of bitmasks (may be empty tuple)."""
    subs = _subsets_with_sum(cards, v)
    if not subs:
        return ()
    unions = set()
    m = len(subs)

    def dfs(start, used):
        extended = False
        for j in range(start, m):
            s = subs[j]
            if s & used == 0:
                extended = True
                dfs(j + 1, used | s)
        if not extended:
            unions.add(used)

    dfs(0, 0)
    # keep maximal ones only (no subset disjoint from union)
    res = [u for u in unions if u and all(s & u for s in subs)]
    return tuple(sorted(set(res)))


def _mask_to_cards(cards, mask):
    return tuple(cards[i] for i in range(len(cards)) if mask >> i & 1)


def maximal_captures(loose_numerals, v):
    cand = tuple(sorted(c for c in loose_numerals if RANK[c] <= v))
    if not cand:
        return []
    return [_mask_to_cards(cand, u) for u in _maximal_unions(cand, v)]


def subsets_summing(loose_numerals, s):
    cand = tuple(sorted(c for c in loose_numerals if RANK[c] <= s))
    if not cand or s <= 0:
        return []
    return [_mask_to_cards(cand, u) for u in _subsets_with_sum(cand, s)]


def largest_packing(loose_numerals, v):
    best = ()
    for u in maximal_captures(loose_numerals, v):
        if len(u) > len(best) or (len(u) == len(best) and u < best):
            best = u
    return best


# ------------------------------------------------------------------ state
class Build:
    __slots__ = ("value", "cards", "multiple", "owner")

    def __init__(self, value, cards, multiple, owner):
        self.value = value
        self.cards = cards
        self.multiple = multiple
        self.owner = owner

    def copy(self):
        return Build(self.value, list(self.cards), self.multiple, self.owner)


class State:
    def __init__(self, deck, dealer):
        self.dealer = dealer
        self.stock = list(deck)
        self.hands = [[], []]
        self.loose = []
        self.builds = []
        self.piles = [[], []]
        self.sweeps = [0, 0]
        self.last_capturer = None
        self.public = set()
        self.deal_no = 0
        self.to_move = 1 - dealer
        self.n_plays = 0
        self.branching = []  # legal-move counts (for complexity estimates)

    def deal(self):
        nd = 1 - self.dealer
        first = self.deal_no == 0
        # pagat: deal in twos (other player, table, dealer); order irrelevant
        # for a uniformly shuffled deck, so deal 4/4/4 for simplicity.
        self.hands[nd] = [self.stock.pop() for _ in range(4)]
        if first:
            self.loose = [self.stock.pop() for _ in range(4)]
            self.public.update(self.loose)
        self.hands[self.dealer] = [self.stock.pop() for _ in range(4)]
        self.deal_no += 1
        self.to_move = nd

    def final_deal(self):
        return self.deal_no == 6

    def build_with_value(self, v):
        for b in self.builds:
            if b.value == v:
                return b
        return None


# ------------------------------------------------------------ move gen
# Moves:
#   ('T', card)
#   ('C', card, loose_tuple, build_value_or_0)
#   ('B', card, new_value, loose_tuple, absorbed_build_values, multiple)


def legal_moves(st, p):
    hand = st.hands[p]
    loose_num = [c for c in st.loose if RANK[c] <= 10]
    owned = [b for b in st.builds if b.owner == p]
    moves = []
    seen_cards_rank = set()
    hand_ranks = [RANK[c] for c in hand]
    for idx, c in enumerate(hand):
        r = RANK[c]
        if r > 10:
            for f in st.loose:
                if RANK[f] == r:
                    moves.append(('C', c, (f,), 0))
        else:
            v = r
            b = st.build_with_value(v)
            caps = maximal_captures(loose_num, v)
            if b is not None:
                if caps:
                    for u in caps:
                        moves.append(('C', c, u, v))
                else:
                    moves.append(('C', c, (), v))
            else:
                for u in caps:
                    moves.append(('C', c, u, 0))
            # building
            other_vals = set(hand_ranks[j] for j in range(len(hand))
                             if j != idx and hand_ranks[j] <= 10)
            for v2 in other_vals:
                need = v2 - v
                existing = st.build_with_value(v2)
                if need > 0 and existing is None:
                    for T in subsets_summing(loose_num, need):
                        moves.append(('B', c, v2, T, (), False))
                if need >= 0:
                    t0_opts = [()] if need == 0 else subsets_summing(loose_num, need)
                    for T0 in t0_opts:
                        rest = [x for x in loose_num if x not in T0]
                        U = largest_packing(rest, v2)
                        groups = (1 if U else 0) + (1 if existing is not None else 0)
                        if groups >= 1:
                            absorbed = (v2,) if existing is not None else ()
                            moves.append(('B', c, v2, tuple(sorted(T0 + U)), absorbed, True))
                # raising a single build
                for sb in st.builds:
                    if not sb.multiple and sb.value + v == v2 and sb.value != v2:
                        absorbed = (sb.value,) + ((v2,) if existing is not None else ())
                        mult = existing is not None
                        moves.append(('B', c, v2, (), absorbed, mult))
                        U = largest_packing(loose_num, v2)
                        if U:
                            moves.append(('B', c, v2, U, absorbed, True))
            if r in seen_cards_rank:
                pass
        if not owned:
            moves.append(('T', c))
        seen_cards_rank.add(r)
    # dedupe
    moves = list(dict.fromkeys(moves))
    # constraint: after the move, p must hold a card of each owned build value
    legal = []
    for m in moves:
        if _respects_control(st, p, m):
            legal.append(m)
    return legal


def _respects_control(st, p, m):
    card = m[1]
    hand_after = list(st.hands[p])
    hand_after.remove(card)
    need_vals = set()
    removed_vals = set()
    if m[0] == 'C' and m[3]:
        removed_vals.add(m[3])
    if m[0] == 'B':
        removed_vals.update(m[4])
        need_vals.add(m[2])
    for b in st.builds:
        if b.owner == p and b.value not in removed_vals:
            need_vals.add(b.value)
    hr = set(RANK[c] for c in hand_after)
    return all(v in hr for v in need_vals)


def apply_move(st, p, m):
    kind, card = m[0], m[1]
    st.hands[p].remove(card)
    st.public.add(card)
    if kind == 'T':
        st.loose.append(card)
        res = None
    elif kind == 'C':
        loose_t, bval = m[2], m[3]
        taken = [card]
        for x in loose_t:
            st.loose.remove(x)
            taken.append(x)
        if bval:
            b = st.build_with_value(bval)
            st.builds.remove(b)
            taken.extend(b.cards)
        st.piles[p].extend(taken)
        st.last_capturer = p
        sweep = not st.loose and not st.builds
        if sweep:
            st.sweeps[p] += 1
        res = sweep
    else:  # 'B'
        v2, loose_t, absorbed, mult = m[2], m[3], m[4], m[5]
        cards = [card]
        for x in loose_t:
            st.loose.remove(x)
            cards.append(x)
        for av in absorbed:
            b = st.build_with_value(av)
            st.builds.remove(b)
            cards.extend(b.cards)
        st.builds.append(Build(v2, cards, mult, p))
        res = None
    st.n_plays += 1
    return res


def score_hand(st):
    """Return list of two dicts with category points and raw counts."""
    out = []
    n = [len(st.piles[0]), len(st.piles[1])]
    sp = [sum(1 for c in st.piles[i] if SUIT[c] == SPADES) for i in range(2)]
    for i in range(2):
        pile = st.piles[i]
        d = {
            'n_cards': n[i], 'n_spades': sp[i],
            'cards': 3 if n[i] > n[1 - i] else 0,
            'spades': 1 if sp[i] > sp[1 - i] else 0,
            'big': 2 if BIG_CASINO in pile else 0,
            'little': 1 if LITTLE_CASINO in pile else 0,
            'aces': sum(1 for c in pile if RANK[c] == 1),
            'sweeps': st.sweeps[i],
        }
        d['total11'] = d['cards'] + d['spades'] + d['big'] + d['little'] + d['aces']
        d['total'] = d['total11'] + d['sweeps']
        out.append(d)
    return out


# --------------------------------------------------------------- policies
def immediate_value(st, p, m):
    if m[0] != 'C':
        return 0.0
    v = CV[m[1]] + sum(CV[x] for x in m[2])
    if m[3]:
        b = st.build_with_value(m[3])
        v += sum(CV[x] for x in b.cards)
    # sweep?
    remaining_loose = len(st.loose) - len(m[2])
    remaining_builds = len(st.builds) - (1 if m[3] else 0)
    if remaining_loose == 0 and remaining_builds == 0:
        v += W_SWEEP
    return v


class RandomPolicy:
    name = 'random'

    def choose(self, st, p, moves, rng):
        return rng.choice(moves)


class GreedyPolicy:
    name = 'greedy'

    def choose(self, st, p, moves, rng):
        caps = [m for m in moves if m[0] == 'C']
        if caps:
            best = max(immediate_value(st, p, m) for m in caps)
            cands = [m for m in caps if immediate_value(st, p, m) >= best - 1e-9]
            return rng.choice(cands)
        trails = [m for m in moves if m[0] == 'T']
        if trails:
            lo = min(CV[m[1]] for m in trails)
            cands = [m for m in trails if CV[m[1]] <= lo + 1e-9]
            return rng.choice(cands)
        return rng.choice(moves)


def _best_capture_table_part(loose, builds, r):
    """Greedy capture value (excluding the capturing card itself) for a card of
    rank r on a hypothetical table (loose: list, builds: list of (value, cards)).
    Returns (value, build_value_taken_or_0), or (None, 0) if no capture."""
    best = None
    best_b = 0
    if r > 10:
        for f in loose:
            if RANK[f] == r:
                val = CV[f]
                if len(loose) == 1 and not builds:
                    val += W_SWEEP
                if best is None or val > best:
                    best = val
        return best, 0
    loose_num = [c for c in loose if RANK[c] <= 10]
    bcards = None
    for (bv, bc) in builds:
        if bv == r:
            bcards = bc
    caps = maximal_captures(loose_num, r)
    if bcards is not None:
        bval = sum(CV[x] for x in bcards)
        if not caps:
            caps = [()]
        for u in caps:
            val = bval + sum(CV[x] for x in u)
            if len(u) == len(loose) and len(builds) == 1:
                val += W_SWEEP
            if best is None or val > best:
                best, best_b = val, r
    else:
        for u in caps:
            val = sum(CV[x] for x in u)
            if len(u) == len(loose) and not builds:
                val += W_SWEEP
            if best is None or val > best:
                best, best_b = val, 0
    return best, best_b


class HeuristicPolicy:
    name = 'heuristic'

    def __init__(self, samples=24):
        self.samples = samples

    def choose(self, st, p, moves, rng):
        if len(moves) == 1:
            return moves[0]
        q = 1 - p
        unseen = [c for c in ALL_CARDS if c not in st.public and c not in st.hands[p]]
        opp_n = len(st.hands[q])
        my_after = len(st.hands[p]) - 1
        final = st.final_deal()
        # Is the opponent's reply the very last play of the hand?
        opp_last = final and opp_n == 1 and my_after == 0
        # Is my move the very last play of the hand?
        me_last = final and opp_n == 0 and my_after == 0
        if opp_n == 0 and not final:
            reply_n = 4  # opponent's next hand (approximation)
        else:
            reply_n = opp_n
        samples = []
        if reply_n > 0 and len(unseen) >= reply_n:
            for _ in range(self.samples):
                samples.append(rng.sample(unseen, reply_n))
        best_score, best_moves = None, []
        for m in moves:
            sc = self._evaluate(st, p, m, samples, opp_last, me_last, reply_n)
            if best_score is None or sc > best_score + 1e-9:
                best_score, best_moves = sc, [m]
            elif abs(sc - best_score) <= 1e-9:
                best_moves.append(m)
        if len(best_moves) > 1:
            # tie-break: prefer trailing/playing the lowest-valued card
            lo = min(CV[m[1]] for m in best_moves)
            best_moves = [m for m in best_moves if CV[m[1]] <= lo + 1e-9]
        return rng.choice(best_moves)

    def _evaluate(self, st, p, m, samples, opp_last, me_last, reply_n):
        # resulting table
        loose = list(st.loose)
        builds = [(b.value, list(b.cards), b.owner) for b in st.builds]
        gain = 0.0
        captured_now = False
        if m[0] == 'T':
            loose.append(m[1])
        elif m[0] == 'C':
            gain = immediate_value(st, p, m)
            captured_now = True
            for x in m[2]:
                loose.remove(x)
            if m[3]:
                builds = [b for b in builds if b[0] != m[3]]
        else:
            v2, lt, absorbed = m[2], m[3], m[4]
            cards = [m[1]]
            for x in lt:
                loose.remove(x)
                cards.append(x)
            nb = []
            for b in builds:
                if b[0] in absorbed:
                    cards.extend(b[1])
                else:
                    nb.append(b)
            nb.append((v2, cards, p))
            builds = nb
        table_val = sum(CV[x] for x in loose) + sum(CV[x] for b in builds for x in b[1])
        if me_last:
            # residue goes to last capturer
            lc = p if captured_now else st.last_capturer
            if lc == p:
                gain += table_val
            elif lc is not None:
                gain -= table_val
            return gain
        my_builds = [b for b in builds if b[2] == p]
        my_build_val = sum(CV[x] for b in my_builds for x in b[1])
        if not samples:
            return gain + my_build_val
        bl = [(b[0], b[1]) for b in builds]
        # per-card best reply value on resulting table (memo by card)
        cache = {}
        opp_total = 0.0
        kept_total = 0.0
        lc_after = p if captured_now else st.last_capturer
        for hand in samples:
            best = 0.0
            took = 0
            any_cap = False
            for c in hand:
                r = RANK[c]
                if r not in cache:
                    cache[r] = _best_capture_table_part(loose, bl, r)
                tv, bv = cache[r]
                if tv is None:
                    continue
                val = CV[c] + tv
                if opp_last:
                    # capturing with the final card also takes the whole residue
                    val = CV[c] + table_val
                if not any_cap or val > best:
                    best, took, any_cap = val, bv, True
            if opp_last and not any_cap:
                # opponent cannot capture with final card: residue to lc_after
                if lc_after == p:
                    kept_total += table_val + CV[hand[0]]
                else:
                    opp_total += table_val + CV[hand[0]]
                continue
            opp_total += best
            # builds of mine that survive the reply (I capture them later)
            kept_total += sum(CV[x] for b in my_builds if b[0] != took for x in b[1])
        k = len(samples)
        return gain + kept_total / k - opp_total / k


POLICIES = {
    'random': RandomPolicy,
    'greedy': GreedyPolicy,
    'heuristic': HeuristicPolicy,
}


# ------------------------------------------------------------------ play
def play_hand(policies, dealer, rng, deck=None, record_branching=False):
    """Play one hand (52 cards). policies: [policy_for_player0, policy_for_player1].
    Returns (scores, info)."""
    if deck is None:
        deck = list(ALL_CARDS)
        rng.shuffle(deck)
    st = State(deck, dealer)
    first_play_sweep_possible = None
    for d in range(6):
        st.deal()
        p = st.to_move
        for _ in range(8):
            moves = legal_moves(st, p)
            if not moves:
                raise RuntimeError("no legal move")
            if record_branching:
                st.branching.append(len(moves))
            if st.n_plays == 0:
                first_play_sweep_possible = any(
                    m[0] == 'C' and len(m[2]) == len(st.loose) and not st.builds
                    for m in moves)
            m = policies[p].choose(st, p, moves, rng)
            apply_move(st, p, m)
            p = 1 - p
    # residue
    residue = len(st.loose) + sum(len(b.cards) for b in st.builds)
    if st.last_capturer is not None:
        for b in st.builds:
            st.piles[st.last_capturer].extend(b.cards)
        st.piles[st.last_capturer].extend(st.loose)
    st.loose, st.builds = [], []
    sc = score_hand(st)
    info = {
        'residue': residue,
        'last_capturer': st.last_capturer,
        'first_play_sweep_possible': first_play_sweep_possible,
        'branching': st.branching if record_branching else None,
    }
    return sc, info


def play_game(policies, first_dealer, rng, target=21, sweeps_count=True, max_hands=100):
    """Play a game to `target`. Returns dict with winner, n_hands, totals."""
    tot = [0, 0]
    dealer = first_dealer
    n = 0
    while n < max_hands:
        sc, _ = play_hand(policies, dealer, rng)
        n += 1
        for i in range(2):
            tot[i] += sc[i]['total'] if sweeps_count else sc[i]['total11']
        if max(tot) >= target and tot[0] != tot[1]:
            winner = 0 if tot[0] > tot[1] else 1
            return {'winner': winner, 'n_hands': n, 'totals': tuple(tot),
                    'first_dealer': first_dealer}
        dealer = 1 - dealer
    return {'winner': None, 'n_hands': n, 'totals': tuple(tot), 'first_dealer': first_dealer}


if __name__ == '__main__':
    rng = random.Random(1)
    pol = [HeuristicPolicy(), HeuristicPolicy()]
    sc, info = play_hand(pol, 0, rng)
    print(sc, info)
