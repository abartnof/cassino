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
