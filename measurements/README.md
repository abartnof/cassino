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
