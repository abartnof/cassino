"""Invariant tests for cassino_sim.py (original computation)."""
import random, time
from cassino_sim import *

def check(policies, n, seed):
    rng = random.Random(seed)
    t=time.time()
    nb=0
    for i in range(n):
        sc, info = play_hand(policies, i % 2, rng)
        assert sc[0]['n_cards'] + sc[1]['n_cards'] == 52, sc
        assert sc[0]['n_spades'] + sc[1]['n_spades'] == 13
        pts = sum(sc[j]['total11'] for j in range(2))
        tie_c = sc[0]['n_cards'] == 26
        tie_s = False
        exp = 11 - (3 if tie_c else 0)
        assert pts == exp, (pts, exp, sc)
        assert sc[0]['aces'] + sc[1]['aces'] == 4
    return time.time()-t

for names in [('random','random'),('greedy','greedy'),('heuristic','heuristic'),('random','heuristic')]:
    pols=[POLICIES[names[0]](), POLICIES[names[1]]()]
    n = 3000 if 'heuristic' not in names else 300
    dt=check(pols, n, 7)
    print(names, n, 'hands OK', f'{dt/n*1000:.1f} ms/hand')
