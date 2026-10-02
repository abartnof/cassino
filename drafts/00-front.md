# Cassino (Casino): A Literature Review for Game Development

*Prepared 2 October 2026. Scope: history, rules and variants, terminology, table talk, scorekeeping tools and digital implementations, statistics, strategy, regional traditions and cultural history of the card game Cassino/Casino and its fishing-game relatives. Written for a team building a video game version, with emphasis on (a) what people say during play, (b) scorekeepers and tools with unique affordances, (c) statistics, and (d) distinct strategies.*

---

## How to read this document
- **Citation rule.** Every factual statement carries a citation in square brackets.
  - `[NN-S#]` means source S# in research note NN. The notes are in the `research/` folder of this repository. Their full source lists are reproduced in **Appendix B**.
  - `[11-V-S#]` refers to primary sources re-checked by the coordinator in note 11.
  - `[NN §x]` points to a section of a research note where an argument or tabulation is developed.
- **Original computation.** Numbers labelled *original computation* come from simulations and enumerations written for this review. They are not published results. Code and outputs are in `research/sim/` and are cited as `[07-S40]`–`[07-S43]` and `[SIM-ST]` (the strategy tests in §9.4).
- **Quotations** are verbatim. Non-English quotations are followed by an English translation. Eighteenth-century long-s (ſ) is normalised to "s".
- **Reliability flags** used in the underlying notes: `[UGC]` = user-generated (forums, reviews), `[promo]` = commercial or marketing page, `[UNVERIFIED]` = could not be confirmed in a fetched source. Wikipedia is treated as a secondary or tertiary source. Wherever possible its claims were followed back to primary sources (note 01).

## Method
1. **Ten parallel research strands**, each producing a fully cited note [research/01–10]:
   - 01: Wikipedia in every language
   - 02: Pagat and modern rules sites
   - 03: historical rulebooks, 1792–1952
   - 04: cultural and literary history
   - 05: glossary and table talk
   - 06: scorekeepers, apps and digital implementations
   - 07: statistics and academic work, plus a Monte Carlo simulation
   - 08: strategy
   - 09: variants and the fishing family
   - 10: non-English sources beyond Wikipedia
2. **Sources searched:**
   - Project Gutenberg, Internet Archive (full text and page images), Wikisource
   - Chronicling America; the Finnish and Norwegian national library collections; the Swedish SAOB and Danish ODS dictionaries
   - Wikipedia in 15+ languages
   - Pagat, BoardGameGeek and Reddit (via archives)
   - App stores, GitHub, Google Patents
   - arXiv, OpenAlex and CrossRef
3. **Coordinator synthesis pass (note 11).** Contradictions between the notes were resolved by reading primary sources directly from page images: Long 1792, the 1793 mock-heroic poem, Dick's *American Hoyle* (4th ed.), the German translation of 1797 and the *Sporting Magazine* of 1793. This pass produced several new findings (§12).
4. **New simulation experiments** tested historical strategy maxims, singly and in combination, against a greedy baseline (32,000 duplicate deals per variant) and against a card-counting player (8,000 per variant) (§9.4).

---

## Executive summary
**What the game is.**

- Cassino is a "fishing" card game. A card played from the hand captures table cards of equal rank, or sets of table cards that sum to its value [09-S1][02-S1].
- It is "the only fishing game to have become popular in English speaking countries" [02-S1].
- Its distinctive mechanics are **building** and **calling**. These are American additions of 1866–67 [11 §V4][03-S15]. Pratesi notes they are "absent from other games of the family" [02-S30].

**History in brief.**

- **First records: London, 1792.** Two rival texts appeared: Robert Long's *Short Rules* ("Cassino") and an anonymous mock-heroic poem ("Casino"; 1792, reissued with laws in 1793). They disagreed on spelling, the lurch and capture etiquette [11 §V1–V3].
- **The poem's tradition went to Germany, Poland and Denmark.** The German 1797 laws translate it closely [11 §V3].
- **The poem's "General Rules" became the strategy canon.** They were merged with Long's laws by the *Sporting Magazine* in 1793, and a condensed version became the Hoyle maxims, reprinted until 1929 [11 §V9][08 §0].
- **America reinvented the game:**
  - building and spoken calls in 1866–67 [03-S14][03-S15];
  - Royal, Spade and Draw Cassino in 1894–1909 [03-S22][03-S23][03-S29];
  - a national-game status that faded with Gin Rummy [03-S31][04-S7].
- **The "Italian origin" story is unsupported.** Its earliest printed form is the poem's dictionary-based Florentine etymology [04-S21][09-S70].

**Where the game lives now** [01-S63][10-S1][02-S4][06-S22][02-S57]:

- Nordic summer cottages (Kasino; Wikipedia pageviews peak in July);
- South African townships (40-card Khasino);
- the Dominican Republic and Haiti [02-S3][05-S95];
- American family memory.

**What people say.**

- From 1867 the spoken announcement *was* the rule. A build was named in the singular ("Nine"), a call or lock in the plural ("Fives"), "audibly and distinctly", or the opponent "may separate the cards" [11-V-S3][03-S15].
- Calls with the same function exist in Danish ("mere syv"), Swedish ("två åttor", "ligger", "storan privat"), Finnish ("rakennan ässälle") and Russian ("Строю 7") [10-S37][10-S25][10-S1][10-S57].
- The dealer warns "Last" / "sistan" / "båten går" / "sidsten" [02-S1][10-S24][10-S37].
- Players claim out ("I have three points, and am out"; Hungarian "Ausz!") and challenge ("Fals!") [04-S130][01-S20].
- **No traditional English sweep shout was found.** The shouted sweep belongs to Scopa, Escoba and Pişti [05 §3].

**Scorekeeping tools** [04-S36][11-V-S2][03-S23][03-S31][10-S24][02-S13][06 §1.7]:

- Tortoiseshell "Cassino Markers" (1804); counters (1793).
- A cribbage board (Spade Cassino to 61).
- The near-universal face-up sweep card; Swedish offset tallies.
- Cuarenta's spare cards as score markers.
- **No dedicated Cassino score pad or device was found.**
- Shipped apps show that players want:
  - visible build labels;
  - explicit capture/build choices;
  - pace control;
  - score breakdowns;
  - fairness transparency, because "the computer cheats" is the top complaint [06 §8][06 §12].

**Statistics.**

- No published quantitative study of Cassino exists [07 §1]. Original simulation for this review finds [07-S40][07-S43][07-S42]:
  - a game to 21 lasts about 3.5 hands;
  - 26–26 card ties occur about 7% of the time;
  - sweeps range from about 0.05 per hand (random play) to 0.86, and from 0.16 to 0.86 for non-random styles;
  - the dealer takes the end-of-hand residue in 60–77% of hands;
  - a one-ply card-counting bot beats greedy play in 91% of games;
  - there are about 10^50 distinct deals.
- The best analogue research, on Scopone, measured a dealer-side edge and found that search AI (ISMCTS) is much harder for humans than rule-based bots [07-S2].

**Strategy.**

- Classical advice: memory first; cards > spades > cash points; take the opponent's trailed card; never feed the Cassinos; the dealer keeps a court card for the last capture [08 §1–8].
- The main disputes are trailing small vs high cards (Foster vs Psellos), when to cash Big Cassino, and whether Royal Cassino is more skilful [08 §14].
- Simulation tests of these maxims (§9.4) support trailing court cards first and then low cards, and holding a court card for the end of the hand, in either seat. They find that taking the card your opponent just trailed helps only as a tie-break [SIM-ST].
- No maxim comes close to the combined value of the card-counting bot's look-ahead, counting and building. The best bundle of maxims recovers about an eighth of a greedy player's deficit against the card-counting bot [SIM-ST].

**Recommendations** for the game are in §14.

---

## Contents
1. (this front matter)
2. History
3. Rules: standard core and options matrix
4. Variants and the fishing family
5. Terminology
6. Table talk
7. Scorekeepers, tools and digital implementations
8. Statistics
9. Strategy (including simulation tests of historical maxims)
10. Regional traditions
11. Culture, literature, idioms
12. Contradictions resolved
13. Open questions and gaps
14. Recommendations for the video game
- Appendix A. Repository map
- Appendix B. Bibliography
