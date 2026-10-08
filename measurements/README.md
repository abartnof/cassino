# Measurements

Every number here comes from `cargo run --release --bin measure`: mirrored
pairs (each seed's cards played twice, the players swapping seats), run
sequentially. Each run fixes its batch size and its number of looks before
the first batch, and stops as soon as |z| crosses the O'Brien–Fleming
boundary for that look. If no boundary is crossed by the last look, the run
reports the estimate and its 95% interval. That is the user's standing rule:
"if you have a clear signal coming through, your sample size can be rather
small" (`docs/DESIGN.md` §11.4).

Units:

- **hand**: A's points less B's, summed over one mirrored pair of hands.
- **game**: +1 for each of the pair's two games A wins, −1 for each it loses
  (−2 to 2).

## The ladder

| Date | A | B | Rules | Unit | Plan | Result |
|---|---|---|---|---|---|---|
| 2026-10-03 | 2 greedy | 1 legal | Classic | hand | 50 × 4 | **Clear at look 1**, 50 pairs: +11.82 ± 1.00 points a pair |
| 2026-10-03 | 2 greedy | 1 legal | Royal | game | 50 × 4 | **Clear at look 1**, 50 pairs: +1.88 ± 0.07 games a pair (wins about 97% of games) |
| 2026-10-03 | 3 counter | 2 greedy | Classic | hand | 100 × 4 | **Clear at look 1**, 100 pairs: +6.76 ± 0.65 points a pair |
| 2026-10-03 | 3 counter | 2 greedy | Royal | hand | 100 × 4 | **Clear at look 1**, 100 pairs: +9.02 ± 0.69 points a pair |
| 2026-10-03 | 3 counter | 2 greedy | Classic | game | 100 × 4 | **Clear at look 1**, 100 pairs: +1.52 ± 0.10 games a pair (wins about 88% of games; the review's counting agent won 91% against its greedy [07-S40]) |
| 2026-10-03 | searcher, playouts to the end of the *hand* by greedy players | 3 counter | Classic | hand | 50 × 4 | No clear difference after 200 pairs: +0.71, 95% interval −0.20 to +1.62. **Deleted**: the final margin is too noisy for 32 worlds to separate moves |
| 2026-10-03 | searcher, playouts to the end of the *deal*, greedy | 3 counter | Classic | hand | 50 × 4 | **Clear at look 3**, 150 pairs: +1.96 ± 0.51 |
| 2026-10-03 | searcher, deal playouts by the counter | searcher, deal playouts by greedy | Classic | hand | 50 × 4 | **Clear at look 3**, 150 pairs: +1.05 ± 0.44 (z 2.39 against 2.34: confirmed on fresh seeds below) |
| 2026-10-03 | (the same, seeds from 5,000,000) | | Classic | hand | 50 × 4 | **Clear at look 4**, 200 pairs: +0.82 ± 0.38. The counter is the playout policy |
| 2026-10-03 | 4 searcher | 3 counter | Classic | hand | 50 × 4 | **Clear at look 1**, 50 pairs: +3.72 ± 0.79 points a pair |
| 2026-10-03 | 4 searcher | 3 counter | Royal | hand | 50 × 4 | **Clear at look 1**, 50 pairs: +6.42 ± 0.89 points a pair |
| 2026-10-03 | 4 searcher | 3 counter | Classic | game | 50 × 4 | **Clear at look 1**, 50 pairs: +1.04 ± 0.14 games a pair (wins about 76% of games) |

## The skill dial

| Date | A | B | Rules | Unit | Plan | Result |
|---|---|---|---|---|---|---|
| 2026-10-03 | 4 at erraticism 0.5, slips repeating down to rung 1 | 3 counter | Classic | hand | 50 × 4 | **Clear at look 3**, 150 pairs: *loses* by 1.83 ± 0.54. A few random moves cost more than half a rung: slips changed to one rung |
| 2026-10-03 | 4 at erraticism 0.5, one-rung slips (skill 3.5) | 3 counter | Classic | hand | 50 × 4 | **Clear at look 3**, 150 pairs: beats by 1.37 ± 0.50 |
| 2026-10-03 | 4 at erraticism 0.5, one-rung slips (skill 3.5) | 4 searcher | Classic | hand | 50 × 4 | **Clear at look 3**, 150 pairs: loses by 2.03 ± 0.52. Skill 3.5 sits between the rungs, as it should |
| 2026-10-03 | skill 3.5, decisions drawn from a hash of the view | 3 counter | Classic | hand | 50 × 4 | **Clear at look 4**, 200 pairs: beats by 1.19 ± 0.43 (seeds from 9,000,000) |
| 2026-10-03 | skill 3.5, decisions drawn from a hash of the view | 4 searcher | Classic | hand | 50 × 4 | **Clear at look 2**, 100 pairs: loses by 2.26 ± 0.59. Still between the rungs |

## Card weights that follow the piles

The worth of one more card and one more spade (`worth.rs`) is flat, 0.2 and
0.15. A model prices them by the chance of carrying a total across the
majority, each card still to come an even chance (code in commit 468e3a6,
reverted).

| Date | A | B | Rules | Unit | Plan | Result |
|---|---|---|---|---|---|---|
| 2026-10-03 | counter, dynamic weights | 3 counter | Classic | hand | 100 × 4 | **Clear at look 4**, 400 pairs: *loses* by 0.41 ± 0.17 |
| 2026-10-03 | counter, dynamic weights scaled to the flat level at the start | 3 counter | Classic | hand | 100 × 4 | No clear difference after 400 pairs: −0.26, 95% interval −0.57 to +0.05 |
| 2026-10-03 | searcher, dynamic weights | 4 searcher | Classic | hand | 50 × 4 | No clear difference after 200 pairs: +0.24, 95% interval −0.33 to +0.81 |

The flat weights stay. A principled model of the value of a card was no
better, and at its own level worse, than the constants: piquet's lesson that
measuring beats reasoning, again.

## The anatomy of a hand

`cargo run --release --bin anatomy A B N`: where each agent's points come
from, per hand, averaged over both seats of N mirrored pairs (Classic).

| Per hand | counter | greedy | | searcher | counter |
|---|---|---|---|---|---|
| points | 7.64 | 4.03 | | 6.41 | 4.83 |
| cards captured | 29.6 | 22.5 | | 27.1 | 24.9 |
| most cards (share) | 0.73 | 0.21 | | 0.56 | 0.34 |
| spades | 7.4 | 5.6 | | 6.8 | 6.2 |
| aces | 2.46 | 1.54 | | 2.19 | 1.80 |
| sweeps | 0.58 | 0.26 | | 0.34 | 0.19 |
| new builds | 2.04 | 0 | | 2.30 | 1.80 |
| own builds taken in / lost | 1.77 / 0.27 | — | | 2.06 / 0.29 | 1.48 / 0.27 |
| residue cards | 2.14 | 0.99 | | 2.04 | 0.93 |

(300 pairs for counter–greedy, 100 for searcher–counter; 2026-10-03.)

- **The counter's edge is building.** It makes about two builds a hand and
  keeps 87% of them, which greedy, never building, cannot answer. It wins
  most cards nearly three hands in four.
- **The searcher's edge is the end of the hand.** It takes twice the
  residue: the exact last-deal solver wins the last capture. It also builds
  a little more, and sweeps more.

## The ladder in the other settings

| Date | A | B | Rules | Unit | Plan | Result |
|---|---|---|---|---|---|---|
| 2026-10-03 | 2 greedy | 1 legal | Royal, aces 1 or 14 | hand | 50 × 4 | **Clear at look 1**: +9.88 ± 0.99 |
| 2026-10-03 | 3 counter | 2 greedy | Royal, aces 1 or 14 | hand | 50 × 4 | **Clear at look 1**: +9.56 ± 0.88 |
| 2026-10-03 | 4 searcher | 3 counter | Royal, aces 1 or 14 | hand | 50 × 4 | **Clear at look 1**: +3.76 ± 0.84 |
| 2026-10-03 | 3 counter | 2 greedy | Classic, sweeps not scored | hand | 50 × 4 | **Clear at look 1**: +6.58 ± 0.96 |
| 2026-10-03 | 4 searcher | 3 counter | Classic, sweeps not scored | hand | 50 × 4 | **Clear at look 1**: +4.06 ± 0.90 |

Every rung beats the one below in every setting.

## Playing the last deal for the game

| Date | A | B | Rules | Unit | Plan | Result |
|---|---|---|---|---|---|---|
| 2026-10-03 | searcher, last deal solved for the game (100 for deciding it, plus the margin) | 4 searcher | Classic | game | 100 × 4 | No clear difference after 400 pairs: +0.005 games a pair, 95% interval −0.005 to +0.015. Reverted (code in 49aed21) |

## How often each move is made

For the move bar's order (the user: "run a few hundred automated games,
and look at the order in which people use the action buttons. The most
common action button should be on the far right, and the least common
action button should be on the left, to make the UX good for someone's
thumb"; and, the players being "somewhat competent", by the competent
rungs, 3 to 4). Both seats played by the computer, sweeps not scored,
builds raised; `node web3d/tools/moves.mjs <games> <skill>`. A count, not
a comparison of agents, so no sequential plan: the shares and their 95%
intervals.

| Date | Skill | Rules | Games | Moves | Build | Take | Trail |
|---|---|---|---|---|---|---|---|
| 2026-10-05 | 3 counter | Royal | 300 | 52,080 | 13.1% ± 0.3 | 35.9% ± 0.4 | 51.1% ± 0.4 |
| 2026-10-05 | 3 counter | Classic | 300 | 52,896 | 8.5% ± 0.2 | 41.4% ± 0.4 | 50.1% ± 0.4 |
| 2026-10-05 | 4 searcher | Royal | 50 | 8,736 | 15.6% ± 0.8 | 35.3% ± 1.0 | 49.1% ± 1.0 |
| 2026-10-05 | 4 searcher | Classic | 50 | 8,736 | 10.6% ± 0.6 | 40.6% ± 1.0 | 48.8% ± 1.0 |
| 2026-10-05 | 2 greedy | Royal | 300 | 52,080 | 0.0% | 39.1% ± 0.4 | 60.9% ± 0.4 |
| 2026-10-05 | 2 greedy | Classic | 300 | 51,888 | 0.0% | 43.5% ± 0.4 | 56.5% ± 0.4 |

The same order at every competent rung and in both games: a trail is
about half the moves, a capture about two in five, a build one in ten.
The move bar runs Build, Take, Trail, left to right (`selection.js`
`BAR_ORDER`), the other way round for a left hand (a setting). The greedy
rung never builds, which is why the competent rungs decide; skill 4 was
run for 50 games of each, at about 3 s a game, its shares already well
apart.

## The advisor's noise, for the tutor's clear chances

For `tutor::MARGIN` (`docs/DESIGN.md` §12.8): how much a skill's gap (the
best move using it less the best not) moves when the advisor samples other
worlds. `noise 600 8 --rules classic|royal`: every fifth eligible decision
of the strongest rung's games against the counter, before the last deal,
each gap re-evaluated under 8 advisor seeds. Descriptive, a fixed count.
The standard deviation of the gap across seeds, in points:

| Date | Rules | Gaps | Median | 90th percentile | 95th percentile |
|---|---|---|---|---|---|
| 2026-10-08 | Classic | 1,347 (600 positions, 61 games) | 0.18 | 0.38 | 0.44 |
| 2026-10-08 | Royal | 1,526 (600 positions, 64 games) | 0.22 | 0.43 | 0.48 |

By skill the medians run from 0.14 (choosing builds, trailing) to 0.32
(aces and Cassinos in Royal). The margin is set at **0.4 points**, about
twice the typical spread; in the last deal, where the values are exact, it
is `advice::SOUND` (0.15).

## What each skill is worth: the strongest rung with one knocked out

For the tutor (`docs/DESIGN.md` §12.8; `knockout.rs`): the searcher with
one skill knocked out against itself whole, sweeps not scored (the game's
default), raising on, unit hand, batches of 100, at most 4 looks, seeds from
1,000,000. A skill of action is knocked out by withholding its moves; one of
restraint by choosing as if blind to it. Every run was clear. Points lost
per mirrored pair of hands (two hands), ± one standard error:

| Date | Skill knocked out | Classic | Royal |
|---|---|---|---|
| 2026-10-08 | Taking pairs | **−10.15 ± 0.49** (look 1) | **−5.91 ± 0.59** (look 1) |
| 2026-10-08 | Building | **−3.84 ± 0.60** (look 1) | **−6.24 ± 0.64** (look 1) |
| 2026-10-08 | Choosing what to trail (any trail at random) | **−3.83 ± 0.61** (look 1) | **−2.94 ± 0.67** (look 1) |
| 2026-10-08 | Taking sums | **−2.65 ± 0.55** (look 1) | **−3.80 ± 0.54** (look 1) |
| 2026-10-08 | Answering your opponent's builds | **−2.01 ± 0.39** (look 1) | **−3.49 ± 0.54** (look 1) |
| 2026-10-08 | Keeping aces and Cassinos | **−1.05 ± 0.24** (look 3) | **−1.30 ± 0.34** (look 2) |
| 2026-10-08 | Choosing safe builds (a build at random) | **−0.70 ± 0.21** (look 3) | **−1.53 ± 0.35** (look 2) |
| 2026-10-08 | Leaving no sweep (blind to it) | **−0.62 ± 0.18** (look 2) | **−0.61 ± 0.23** (look 4) |

Royal's court cards build and sum (J 11, Q 12, K 13), so building and sums
are worth more there and pairs less. A sweep scores nothing here, yet
leaving one still costs about 0.3 points a hand: the cards go with it.

**The prerequisites, by pairs of knockouts** (Classic): the second skill's
worth with the first already out, against its worth alone.

| Date | First out | Then out | Worth with the first out | Worth alone |
|---|---|---|---|---|
| 2026-10-08 | Taking pairs | Taking sums | **−4.43 ± 0.74** (look 1) | −2.65 ± 0.55 |
| 2026-10-08 | Taking sums | Building | **−7.62 ± 0.70** (look 1) | −3.84 ± 0.60 |
| 2026-10-08 | Taking sums | Answering builds | **−3.34 ± 0.44** (look 1) | −2.01 ± 0.39 |

No skill lost its worth with another gone; each was worth *more*. The
skills stand in for one another (a player who cannot take pairs leans on
sums, and one who cannot take sums leans on building), so worth cannot show
which skill must be learnt first. The prerequisites stay the logical ones:
a build is a sum, and so is the capture of most builds.

## What the strongest rung meets, for the learner's thresholds

For `learner::master`, `top_rate` and `top_cost` (`docs/DESIGN.md` §12.8):
the share of its clear chances the strongest rung meets, and the points a
game it loses to each skill, judged by the tutor's own advisor
(`learn searcher 30 --rules classic|royal --first 1000|2000`, the counter
opposite, sweeps not scored, builds raised). Descriptive, a fixed count of
30 games of each. The two games pooled give the constants:

| Skill | Chances a game (Classic, Royal) | Met | Points lost a game | Mastery asks (0.85 of met) |
|---|---|---|---|---|
| Taking pairs | 7.7, 6.3 | 0.974 (410 of 421) | 0.10 | 0.83 |
| Taking sums | 3.2, 3.5 | 0.965 (193 of 200) | 0.07 | 0.82 |
| Building | 3.8, 7.0 | 0.938 (304 of 324) | 0.22 | 0.80 |
| Choosing safe builds | 2.2, 3.6 | 0.966 (169 of 175) | 0.10 | 0.82 |
| Answering builds | 1.5, 2.1 | 1.000 (107 of 107) | 0.00 | 0.85 |
| Leaving no sweep | 1.4, 5.4 | 0.956 (196 of 205) | 0.09 | 0.81 |
| Keeping aces and Cassinos | 13.3, 13.5 | 0.994 (799 of 804) | 0.04 | 0.85 |
| Choosing what to trail | 9.2, 10.3 | 0.949 (553 of 583) | 0.46 | 0.81 |

Not perfect: the strongest rung is itself short of its advisor's every
choice, which samples other worlds. Lesioned students, one game each of
Classic from seed 1 (the `learn` binary, descriptive): the searcher with
building out met 0 of 34 chances at building (7.5 points a game); with
pairs out, 0 of 99 (17.5 a game); greedy, 0 of 31 at building (6.2 a game)
and 35 of 57 at trailing (5.7 a game). The counter (rung 3) met 77% of its
building chances and 72% of its trailing chances (2.2 points a game):
trailing is where it is weakest.

The learner's constants (`learner.rs`) were set against these numbers by
replaying the strongest rung's 54 four-game windows: with the lower bound
at the 10th percentile and mastery at 0.9 of the strongest rung's rate it
mastered 2.5 skills of 8 on average in four games, and named a focus (a single miss
in a rare skill) in 10 of 54; at the 20th percentile and 0.85, with a focus
asked to be surely short of mastery (90th percentile below the bar), it
masters 3 to 7 and names none. The rarest skills (answering builds, two
chances a game or fewer) cannot be certified in four games from their
chances alone, which is as it should be. The lesioned students are in
`cargo test` (`learner::tests`).

The claim that the strongest rung names no focus was tuned in-sample: the
constants were chosen on those 54 windows. A fresh-window check on seeds
9000-9031 (eight four-game windows, both rule sets): no focus in 8 of 8
windows, 3 to 6 skills mastered. The acceptance tests use mastered >= 3,
and the focus rule gained, after the review of the learner, the "costly"
route (a gain of two points a game over eight chances): one point named a
focus for the strongest rung in one window of nine. A three-window sweep of
each lesioned student and the strongest rung is behind `--ignored`
(`cargo test -p cassino-core --lib learner:: -- --ignored`, about 1.5
minutes in a debug build); the greedy player is told Building or Trailing
(it lacks both; Building in five windows of six).

## The tutor's rules: precision and coverage

For §12.8 (`docs/DESIGN.md`): `rules 200 --rules classic|royal`, then
`rules 200 --confirm --only IDS --rules classic|royal`. The strongest rung
(skill 4) in the person's seat against skill 3, 200 games each, sweeps not
scored (the game's default). A fixed count, descriptive. Selection seeds
1000..1200; confirmation seeds 5,000,000..5,000,200. Raw output:
`rules-<rules>-selection.txt` and `rules-<rules>-confirmation.txt`. Date
2026-10-08.

How it is measured:

- **Precision**: of the decisions where the rule's trigger fires, the share
  where the rung's move satisfies the prescription. The trigger and the
  prescription are what the rule's text says (a sum rule asks for a sum
  group, a pair rule for the pair). The interval is clustered by game
  (ratio estimator over per-game tallies, an effective sample, then a
  Wilson interval), since a game's decisions are correlated. In these runs
  the effective sample came out near the number of firings, so the
  clustering widened the intervals little.
- **Safe-build rules** (SB1 to SB5) are measured only where the rung built,
  so precision is P(safe build | trigger, the rung built) and does not mix
  in whether to build at all. Rules about trailing that begin "When you
  trail" (T5, T6) are measured the same way.
- **Coverage**: of the decisions holding a clear chance at the skill
  (`tutor::chances`, margin 0.4 before the last deal), the share where the
  trigger fires.
- **Ships**: the clustered lower bound is at least 0.80. Per skill the
  candidate with the best lower bound among those is chosen (34 candidates
  were written before the runs; the second round, P3 P4 B4 B5 B6 SB4 SB5 N3
  N4 T4 T5 T6, for the skills whose first candidates fell short) and then
  confirmed on fresh seeds.

### Classic

| Skill | Rule | Text | Selection | Confirmation | Coverage | Verdict |
|---|---|---|---|---|---|---|
| Pairs | P3 | Take a pair, unless you can build or take more cards instead. | 0.887 [0.879, 0.895] | 0.890 [0.882, 0.897] | 1.00 | shipped |
| Sums | none | best S3 0.782 [0.758, 0.805] | | | | no rule |
| Building | B3 | With nothing to take, build rather than trail, if you can. | 0.851 [0.828, 0.872] | 0.843 [0.819, 0.864] | 0.48 | shipped |
| Safe builds | SB1 | Build a value that at most one card you cannot see can take. | 0.979 [0.969, 0.986] | 0.978 [0.968, 0.985] | 0.72 | shipped |
| Answering builds | A3 | If you cannot take their build, raise it, if you can. | 0.989 [0.942, 0.998] | 0.920 [0.850, 0.959] | 0.32 | shipped |
| No sweep | none | best N4 0.832 [0.759, 0.886] | | | | no rule |
| Valuables | V1 | Never trail an ace or Cassino while you have another card to trail. | 0.927 [0.918, 0.935] | 0.926 [0.917, 0.934] | 0.96 | shipped |
| Trailing | none | best T3 0.793 [0.782, 0.804] | | | | no rule |

### Royal

| Skill | Rule | Text | Selection | Confirmation | Coverage | Verdict |
|---|---|---|---|---|---|---|
| Pairs | P3 | Take a pair, unless you can build or take more cards instead. | 0.898 [0.889, 0.906] | 0.899 [0.889, 0.908] | 1.00 | shipped |
| Sums | none | best S3 0.760 [0.741, 0.779] | | | | no rule |
| Building | B3 | With nothing to take, build rather than trail, if you can. | 0.882 [0.866, 0.897] | 0.877 [0.861, 0.892] | 0.52 | shipped |
| Safe builds | SB1 | Build a value that at most one card you cannot see can take. | 0.978 [0.970, 0.984] | 0.977 [0.969, 0.983] | 0.65 | shipped |
| Answering builds | A2 | Take your opponent's build when it holds three cards or more. | 0.974 [0.910, 0.993] | 0.873 [0.781, 0.930] | 0.18 | not confirmed: no rule |
| No sweep | none | best N4 0.828 [0.793, 0.858] | | | | no rule |
| Valuables | V1 | Never trail an ace or Cassino while you have another card to trail. | 0.923 [0.913, 0.932] | 0.918 [0.908, 0.927] | 0.96 | shipped |
| Trailing | none | best T3 0.719 [0.707, 0.730] | | | | no rule |

Read with care:

- P3 is the loosest rule to ship: it counts a pair, a build, or a capture
  of more cards than any pair on offer as obeying it. It says to take the
  pair unless something better is on, and the rung does the same.
- Royal's answering-builds choice was the winner's curse at work: the
  selection's best lower bound (A2, 0.910, only 77 firings) fell to 0.781
  on fresh seeds. A1 (0.899) and A3 (0.904) cleared 0.80 in selection but
  were not confirmed, since only the chosen rule is; Royal teaches
  answering builds by no rule until one is.
- Taking sums, leaving no sweep with sweeps off, and trailing have no
  rule. The rung leaves a sweepable table about half the time with sweeps
  off (N1 0.43 Classic, 0.54 Royal), so there is no rule of restraint to
  state; the best, N4 (do not leave four or more cards for one card to
  sweep), fires rarely (coverage 0.17 and 0.26).
- SB1 and B2 share a trigger and differ in the prescription: asked of the
  rung's builds SB1 holds 0.98, but as a reason to build (B2) it is 0.56.

### Other settings

The tables above are the game's defaults: sweeps not scored, aces 1, builds
raised. The shipped rules were then measured under each other setting, one
at a time, with `rules 200 --confirm --seed 6000000 --only P3,B3,SB1,V1[,A3]
--rules classic|royal` and `--sweeps`, `--aces14` (Royal) or `--no-raise`:
200 games on seeds 6,000,000..6,000,200 (fresh: neither the selection nor
the confirmation seeds), the strongest rung against skill 3. A fixed count,
descriptive. A rule is told under a setting only if it is confirmed there
(the clustered lower bound is at least 0.80); otherwise the skill is told as
a plain fact. Raw output: `rules-<rules>-<setting>.txt`. Date 2026-10-08.

| Setting | P3 Pairs | B3 Building | SB1 Safe builds | V1 Valuables | A3 Answering |
|---|---|---|---|---|---|
| Classic, sweeps scored | 0.849 [0.840, 0.857] confirmed | 0.821 [0.796, 0.843] not confirmed | 0.983 [0.973, 0.989] confirmed | 0.922 [0.913, 0.930] confirmed | 0.949 [0.877, 0.980] confirmed |
| Royal, sweeps scored | 0.852 [0.842, 0.863] confirmed | 0.824 [0.804, 0.842] confirmed | 0.974 [0.965, 0.981] confirmed | 0.921 [0.912, 0.930] confirmed | n/a |
| Royal, aces count 1 or 14 | 0.914 [0.905, 0.921] confirmed | 0.876 [0.859, 0.890] confirmed | 0.965 [0.956, 0.973] confirmed | 0.959 [0.952, 0.965] confirmed | n/a |
| Classic, raising off | 0.892 [0.884, 0.900] confirmed | 0.887 [0.864, 0.906] confirmed | 0.994 [0.987, 0.997] confirmed | 0.926 [0.918, 0.934] confirmed | n/a |
| Royal, raising off | 0.913 [0.905, 0.921] confirmed | 0.917 [0.902, 0.930] confirmed | 0.976 [0.968, 0.982] confirmed | 0.925 [0.916, 0.933] confirmed | n/a |

- Only one rule fails: B3 (build rather than trail) in Classic with sweeps
  scored, whose lower bound is 0.796. Classic with sweeps scored is told
  building as the fact instead.
- A3 is not offered in Royal (no rule ships there) nor with raising off
  (it asks for a raise); both are told as the fact.
- Settings were measured one at a time. A combination (for instance Royal
  with sweeps scored and aces at 14) is told what each of its settings
  confirms, which is not itself measured.
- The runs took 4 to 16 minutes each on a loaded machine.
