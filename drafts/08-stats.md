## 8. Statistics

### 8.1 What exists in print, and what doesn't
- **No published quantitative study of Anglo-American Cassino exists.** There is no AI paper, no complexity estimate and no dealer-advantage figure in arXiv, OpenAlex, CrossRef or the thesis repositories searched [07-S1][07-S30][07-S31][07-S32][07-S34].
- **Ludii has no fishing game at all.** Its library has no card-game category [07-S33][02-S65].
- **The closest academic work is on Scopone** (Di Palma & Lanzi, *IEEE Transactions on Games* 10(3):317–332, 2018) [07-S2]:
  - The dealer's ("deck") team wins 45.7% of matches against 41.7% for the other side, with 12.6% ties, under random play (p = 0.071).
  - The hand team's win rate falls as skill rises: "38.0% of the random strategy, 38.1% of CS, 34.7% of ISMCTS, and 29.5% of MCTS" [07-S2].
  - In the final tournament ISMCTS won 55.8%, against 41.7% for the expert-rule bot [07-S2].
  - Humans won 47.6% against a greedy bot but only 23.8% against ISMCTS-4000 [07-S2].
  - Human partners "were puzzled by their teammate's behavior" when partnered with search bots [07-S2].
- **Scopone game size** (lower bounds) [07-S3]:
  - State space 2.02×10^47, information-set space 2.23×10^58.
  - Effective branching factor 4.33 with perfect information, 8.8 with information sets.
- **Pasur** was solved with GPU counterfactual regret minimisation, but only "both players have full knowledge of each other's hands" [07-S5].
  - In that setting, the first player's win probability ranges from 0.06 with no jacks to 0.85 with four jacks and five or more clubs [07-S5].
- **Scopa represents the fishing family in the 2026 Valet benchmark of 21 traditional card games.** The benchmark has no Cassino encoding [07-S8][07-S10].
- **Scopone opening sweep:** Favero (2003) puts the chance at about 54.05% under the orthodox lead. His conditional probabilities, 146/203, 49/87 and 1/3, were reproduced exactly [07-S19][07-S42].
- **Educational and therapeutic uses:**
  - A 2020 "Organic Chemistry I Cassino" teaching game [07-S12].
  - Ecuadorian research on Cuarenta for mathematics teaching [07-S15].
  - A card-recognition system for blind Cuarenta players, at 94.7% accuracy with artificial light [07-S16].
  - Scopa as a cognitive game in the EU MoveCare elder-care platform [07-S17].

### 8.2 Popularity indicators
- **Pagat.com:** Casino is the **8th most-visited rules page** in July–September 2026 [07-S24].
- **YouGov:** its 2023 US survey of 30 card games does not list Casino at all. The only fishing game it lists is Zwickern, which 4% have played [07-S25].
- **Google Books Ngram:** lower-case "cassino" peaks at 6.50×10⁻⁸ in **1821** and falls about 46-fold by 2019 [07-S26]. "Big Casino" (single s) peaks in 1912, which tracks the American revival [07-S26].
- **Wikipedia:** see §2.6 for Nordic July seasonality [01-S63]. The table below shows annual pageviews.
#### 8.2.1 Wikipedia pageviews (Wikimedia REST API, user agents, calendar-year totals) [07-S27]

| Article | 2016 | 2020 | 2025 | 2025 per month |
|---|---|---|---|---|
| en: Cassino (card game) | 48,760 | 39,443 | 41,170 | ~3,431 |
| en: Scopa | 90,010 | 115,238 | 116,672 | ~9,723 |
| en: Pasur (card game) | 8,383 | 15,115 | 11,844 | ~987 |
| en: Bastra (Basra) | 8,772 | 25,297 | 11,394 | ~950 |
| en: Escoba | 6,685 | 9,796 | 9,576 | ~798 |
| en: Tablanette | — | 255 | 8,409 | ~701 |
| en: Cuarenta | 7,315 | 8,907 | 6,455 | ~538 |
| en: Tseri (Xeri) | 1,434 | 1,180 | 1,343 | ~112 |
| en: Cribbage (comparator) | 299,647 | 336,912 | 255,600 | ~21,300 |
| en: Gin rummy (comparator) | 500,396 | 680,108 | 316,013 | ~26,334 |
| it: Scopa (gioco) | 202,514 | 231,846 | 146,971 | ~12,248 |
| it: Scopone | 42,307 | 58,079 | 27,018 | ~2,252 |
| fi: Kasino (korttipeli) | 8,311 | 31,380 | 22,659 | ~1,888 |
| sv: Kasino (kortspel) | 12,385 | 10,531 | 13,047 | ~1,087 |
| no: Kasino (kortspill) | 29,111 | 16,297 | 23,240 | ~1,937 |

Notes:
- 2020 shows a pandemic bump for several games (Gin rummy, Bastra, Pasur).
- Finnish Kasino roughly tripled between 2018 and 2020 and stayed high.
- The Tablanette article only became a real article around 2020–21, which explains its jump.
- The figures exclude redirects. For example, "Basra (card game)" redirects to "Bastra" and "Xeri" redirects to "Tseri" [07-S27].


### 8.3 Exact combinatorics (original computation)

| Quantity | Value |
|---|---|
| Distinct Cassino deals per hand | 10^49.964 |
| Opponent hands possible at first decision | C(44,4) = 135,751 |
| P(4 Cassino table cards all of different rank) | 67.6% |
| Pasur: P(Jack among initial 4 pool cards → replace) | 28.1% |
| Scopa/Scopone: P(≥3 kings among 4 table cards) | 29/18,278 = 0.159% |
| Escoba: P(table sums to 15) / P(sums to 30) | 3.41% / 2.73% |
| Escoba: deck total mod 15 | 10, so the residue always sums to 10, 25, 40 … |
| Scopone-10: P(next player holds the led rank) for group size 1 / 2 / 3 / 4 | 146/203 / 49/87 / 1/3 / 0 (matches Favero [07-S19]) |

- **Built-in arithmetic checks for the scoreboard and engine** [03-S31][07-S42][09-S66]:
  - Anglo-American Cassino has 11 non-sweep points per hand.
  - The only possible tie on cards is 26–26, which leaves 8 points.
  - Escoba's remaining table cards must sum to 10, 25, 40, …

### 8.4 Monte Carlo study of two-player Cassino (original computation, research note 07)
These are **policy-conditional** results from five policy sets (random, greedy, one-ply heuristic with card counting, PIMC), not equilibrium values [07 §6.12]. The engine implements Pagat's standard rules with sweeps scored [07-S40]. Invariants were checked: 52 cards, 13 spades, 4 aces, 11 or 8 non-sweep points [07-S43].

#### 8.4.2 Points per hand by policy (self-play; one "hand" = one full pass of the deck)

| Self-play policy (N hands) | Dealer pts/hand | Non-dealer pts/hand | Dealer − non-dealer [95% CI] | P(dealer wins hand) | P(hand tied) |
|---|---|---|---|---|---|
| random (40,000) | 5.632 | 5.278 | **+0.354** [+0.293, +0.415] | 52.5% | 1.4% |
| greedy (40,000) | 5.254 | 6.400 | **−1.146** [−1.205, −1.088] | 40.7% | 3.7% |
| heuristic (20,000) | 5.305 | 6.177 | **−0.872** [−0.952, −0.792] | 43.1% | 3.8% |

- The standard deviation of points per player per hand is about 2.9–3.1. The standard deviation of the dealer − non-dealer difference is about 5.8–6.2 points.
- Excluding sweeps, the dealer − non-dealer difference is +0.354 (random), −1.236 (greedy) and −0.922 (heuristic) [07-S40].


#### 8.4.5 Sweeps

| Self-play policy | Sweeps per hand (both players) | P(≥1 sweep) | Distribution 0 / 1 / 2 / 3 / 4+ |
|---|---|---|---|
| random | 0.045 | 4.1% | 95.9 / 3.8 / 0.3 / 0.03 / 0 % |
| greedy | 0.859 | 51.2% | 48.8 / 28.8 / 14.2 / 5.4 / 2.9 % |
| heuristic | 0.693 | 45.5% | 54.5 / 29.1 / 11.1 / 3.7 / 1.6 % |
| PIMC (600 hands, [07-S43]) | 0.158 | 13.0% | — |

- The non-dealer can sweep on the very first play of a hand in only **~1.45%** of deals: 1.43% (random), 1.47% (greedy), 1.46% (heuristic). This depends almost entirely on the deal [07-S40].
- Where sweeps happen (heuristic) [07-S41]:
  - Most come mid-deal: 0.147 per hand on the dealer's 2nd play and 0.121 on the non-dealer's 2nd play.
  - Only 0.065 (dealer) + 0.070 (non-dealer) sweeps per hand happen in the first deal; the other 0.55 happen in deals 2–6.
- **Sweeps add at most about 0.7–0.9 points per hand (heuristic or greedy), and only about 0.16 under the sweep-averse PIMC style, but they swing games.** Without sweep scoring a game lasts 3.63 hands instead of 3.48 (§6.7).


#### 8.4.7 Game length to 21 points (deal alternates, first dealer randomised)

| Matchup (N games) | Mean hands [95% CI] | Hands 2 / 3 / 4 / 5 / 6+ | Winner / loser mean final score |
|---|---|---|---|
| heuristic vs heuristic, sweeps count (5,000) | **3.48** [3.47, 3.50] | 2.3 / 49.7 / 45.4 / 2.5 / 0.1 % | 24.6 / 15.3 |
| heuristic vs heuristic, no sweep points (3,000) | 3.63 [3.61, 3.65] | 0.6 / 40.0 / 54.9 / 4.4 / 0.1 % | 24.3 / 14.8 |
| greedy vs greedy, sweeps (20,000) | 3.40 [3.39, 3.41] | 4.0 / 54.3 / 39.3 / 2.3 / 0.1 % | 24.7 / 15.0 |
| greedy vs greedy, no sweeps (20,000) | 3.63 [3.62, 3.64] | 0.8 / 40.0 / 54.5 / 4.7 / 0.1 % | 24.4 / 14.8 |
| random vs random (20,000) | 3.56 [3.55, 3.57] | 1.5 / 45.1 / 49.6 / 3.8 / 0.1 % | 24.6 / 14.3 |

- Two hands can only reach 21 in about 1–8% of games, because each hand gives at most 11 points plus sweeps.
- **For session design:** at 52 plays per hand, a typical game is about 180 plays.
- No game ran past 7 hands [07-S40].

#### 8.4.8 Policy comparison (duplicate format: each deck played twice with seats swapped)

| A vs B | A − B points/hand [95% CI] | P(A wins hand) | P(A wins game to 21) |
|---|---|---|---|
| greedy vs random | +5.57 [5.51, 5.63] | 86.9% | 98.3% (10,000 games) |
| heuristic vs random | +7.34 [7.28, 7.40] | 96.0% | 99.9% (2,000 games) |
| heuristic vs greedy | +3.79 [3.72, 3.86] | 75.9% | 91.4% (4,000 games) |

Skill dominates luck in Cassino much more than the "simple game" reputation suggests. A modest look-ahead player beats a greedy capture-maximiser in about 9 of 10 games to 21 [07-S40]. Compare Scopone, where the expert rule set beat Greedy by only about 4 percentage points [07-S2].


#### 8.4.x Dealer vs non-dealer: an open question
- The per-hand seat effect is small, and its sign depends on the policy [07-S40][07-S43]:
  - random +0.35, PIMC +0.65, heuristic −0.87, greedy −1.15 points per hand (dealer minus non-dealer).
- Over a whole game it mostly washes out. The first dealer wins 48.4% (greedy) and 48.8% (heuristic) of games to 21 [07-S40].
- The robust positional fact is that **the dealer takes the end-of-hand residue in 60–77% of hands** under every policy [07-S40][07-S43]. This bears out the advice of 1792 ("In the last Deal, a Court-Card or some other ought to be kept to secure the Advantage of the Cards on the Board" [03-S1]) and of 1897 ("The last trick is usually made by the dealer, who always keeps back a court card" [03-S31]).
- Scopone research finds a dealer-side advantage that grows with skill [07-S2]. The Cassino simulations do not settle the direction for strong play, so a stronger agent is needed [07 §6.10].

#### 8.4.y Skill vs luck
- Under duplicate scoring, a one-ply card-counting heuristic beats greedy play by **+3.79 points per hand** and wins **91.4%** of games to 21 [07-S40].
- In Scopone, by contrast, expert rules beat Greedy by only about 4 percentage points [07-S2].
- In Cassino, building and card-counting skill matter far more than the game's "child's game" reputation suggests [07 §6.8][04-S7].
- This supports the 1945 assessment that the game "provides wide scope for scientific play and sharp contest of wits" [03-S35].
