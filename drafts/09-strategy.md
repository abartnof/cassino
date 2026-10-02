## 9. Strategy

### 9.1 Where the advice comes from
- **Long (1792)** gives nine numbered maxims [03-S1]. The first five:
  - "I. Take up the Card played by your Adversary in Preference to any other."
  - "II. Take up Spades in Preference to the other Suits."
  - "III. When you hold a Pair, play one of them."
  - "IV. Aim at clearing the Board always, but forego an Advantage rather than give your Enemy that Chance."
  - "V. Never play a Ten while Great Cassino is in, nor a Deuce while Little Cassino is unplayed."
- **The 1793 poem** has eleven "General Rules and Directions for Playing the Game of Casino". These are the source of most later classical advice [11 §V9]:
  - The *Sporting Magazine* (Nov–Dec 1793) merged them with Long's laws [11-V-S7].
  - A condensed version became Hoyle's "principal objects" paragraph, reprinted with small edits from 1796 to 1929 [08 §0][03-S5][03-S33].
- **R. F. Foster (1897)** wrote the other classic set, "Suggestions for Good Play" [03-S31].
- **20th-century "pointers"** come from Morehead & Mott-Smith (1946–52), Scarne, Silberstang and Hervey [08-S12][08-S13][08-S14][08-S15][08-S16][08-S17].
- **Modern sources** add numerical reasoning: Psellos's "9% rule" and expected-value test for builds [08-S36].

### 9.2 The core strategic ideas
- **Memory first.** "The principal thing in Cassino is to remember what has been played especially in the counting and high cards, such as Aces, Eights, Nines, and Tens" [08-S9]. "In the last deal, you should know the rank of every card held by your opponent" [08-S12].
- **Priorities: cards > spades > cash points.**
  - Foster: "Go for 'cards' in preference to everything else" [08-S9].
  - The 1793 rule warns that "the Desire of taking Spades should never bias your Play" [11-V-S2].
  - Nordic scoring reverses the order. Most spades is worth 2 there, so "taking the ♠Q from the table may be better than capturing three cards" [08-S20].
- **Take the trailed card.** Taking the card your opponent just trailed is unanimous advice from 1792 to 1929 [08 §1.5]. No source gives a reason [08 §1.5].
- **Don't feed the Cassinos.**
  - "Never play a Ten while Great Cassino is in" [03-S1].
  - Foster generalises this to any trail that "will make a Ten with those on the table" [08-S9].
- **Trailing (contested):**
  - Classical sources say to trail court cards, then small cards, keeping aces [08 §3.1–3.2].
  - Psellos says to trail middle and high cards early and low cards later, to deny combinations [08-S36].
  - Note 08 suggests the two fit together: Foster's advice is offensive and Psellos's is defensive [08 §3.2].
- **Building.**
  - Build only if the expected gain beats capturing now: "build only if you get more than 1 extra point" early on [08-S36].
  - Take the adversary's builds and "build on his build at every opportunity" [08-S9].
  - Multiple builds protect; single builds invite raising [08 §4.3].
- **Negative inference.** "If he had a ten he would have done this, if he had a nine he would have done that" [08-S13]. A build that survives your opponent's turn suggests they lack that rank [08-S40].
- **Unpaired-rank counting.**
  - In Culbertson: "all unpaired cards not paired by the table or by your own hand will be in the opponent's hand" [08-S13].
  - Scopone has the same technique, "contare il Quarantotto" [08-S30].
- **Seat.**
  - The dealer keeps back a court card for the last capture [08 §7–8].
  - The non-dealer saves cash cards for his last play of a deal, "since you will have first chance at it next deal" [08-S14].
- **Sweep defence.** "not to leave on the Board one Card only, or such Cards as, by Combination, may be taken with one Card", with four listed exceptions (early game, a point available, close race for cards, comfortable score) [11-V-S2].
  - Nordic players avoid leaving table totals of 14, 15 or 16 [08-S34][08-S35].

### 9.3 Agreement and disagreement summary (from note 08)

| Topic | Consensus | Dissent |
|---|---|---|
| Remember cards | Universal [08-S1–08-S17, 08-S30] | — |
| Cards > spades > tie-breaks | Standard Cassino [08-S1, 08-S2, 08-S9, 08-S13, 08-S14, 08-S16] | Nordic reverses it (spades 2 pts) [08-S20, 08-S35] |
| Prefer spades in ties | Universal | 1793: don't let it bias play [08-S2] |
| Trail courts first (standard) | [08-S1, 08-S2, 08-S3–08-S6, 08-S16] | Psellos (Royal): trail 7–J early [08-S36] |
| Trail small cards (except aces) | Hoyle line, Foster [08-S4, 08-S9] | Psellos, Pasur: trail high to deny combos [08-S36, 08-S25] |
| Never trail 10/2 while the Cassinos are out | Universal [08-S1, 08-S2, 08-S4, 08-S9, 08-S12] | — |
| Pair trick with the 4th card out | Long, Hoyle [08-S1, 08-S4] | 1793 reverses the condition [08-S2] |
| Build with cash cards early | Morehead [08-S12, 08-S14] (dealer) | Silberstang: only when safe by count [08-S16]; Danon decoy first [08-S37] |
| Cash Big Cassino ASAP | Silberstang [08-S16]; Seres (when safe) [08-S35] | saannot.com: save it for a big capture [08-S46b]; Danon: leave it on the table if the opponent has shown no Ten [08-S37] |
| Track face cards | Psellos (Royal) [08-S36] | Silberstang (standard): unnecessary [08-S16] |
| Royal Cassino skill | Morehead: "superior" per some authorities [08-S14]; Parlett: experts prefer the advanced variants [08-S53] | Scarne: "less strategic" [08-S15]; Seres: "lacks the charm" [08-S35] |
| Avoid leaving one capturable card | Universal [08-S1, 08-S2, 08-S38, 08-S39] | 1793 lists exceptions (early game, points, close cards race, comfortable score) [08-S2] |
| Take 3 court cards? | Foster: bad (kills sweeps) [08-S9] | BGG: playing the 4th king deliberately to kill sweeps [08-S39] |

---


### 9.4 Testing the maxims in simulation (original computation)
No published source tests any Cassino maxim [07 §1]. For this review, each maxim was coded as a small change to the simulator's greedy player and played against an unchanged copy of it [SIM-ST].

**Set-up** [SIM-ST][07-S40]:

- **Rules:** standard two-player Pagat rules, with sweeps worth 1 point. A hand has about 11.7 points at stake (11.65 in greedy self-play [07-S40]): up to 11 for cards, spades and cash points (cards score nothing on a 26–26 tie), plus about 0.87 for sweeps.
- **Baseline ("greedy"):** makes the capture with the highest immediate value and never builds. When it cannot capture, it trails its least valuable card. In practice that is a random plain card, since every non-spade card from 2 to K except Big Cassino carries the same weight.
- **Duplicate deals:** each shuffled deck is played twice, with the two players swapping seats, so the luck of the deal cancels out. Each variant played 32,000 decks (64,000 hands).
- **Measure:** the variant's average points per hand minus the baseline's, with a 95% confidence interval. A game to 21 lasts about 3.5 hands [07-S40], so +0.3 points per hand is roughly one point per game.
- **Control:** an unchanged copy of the baseline scored +0.005 [−0.023, +0.032], confirming that the harness is unbiased.
- **Second opponent:** the main variants were also played against the one-ply card-counting player, which builds. These runs used 8,000 decks each, with the same decks for every variant, so each variant can be compared directly with plain greedy [SIM-ST].

#### Results

| Maxim (source) | How it was coded | vs greedy (pts/hand) | Gain over greedy vs card-counter |
|---|---|---|---|
| **Trail court cards first**, then small cards; keep aces and Cassinos (Long VIII; 1793 rule 10) [08-S1][08-S2] | trail order: courts → low numerals → aces/Cassinos; spades last within each group | **+0.32** [+0.29, +0.35] | **+0.17** [+0.11, +0.24] |
| **Trail small cards**, except aces and Little Cassino; avoid spades (Foster) [08-S9] | trail order: low → high (courts last), then spades, then aces/Cassinos | **+0.16** [+0.13, +0.19] | +0.02 [−0.04, +0.08] |
| Trail middle/high cards early, low cards late (Psellos, written for Royal Cassino) [08-S36] | deals 1–3 high-first, deals 4–6 low-first | +0.06 [+0.03, +0.09] | 0.00 [−0.06, +0.06] |
| *Control:* trail courts, then the highest numerals | trail order: courts → 10 → 9 → …; suit ignored | **−0.57** [−0.60, −0.54] | **−0.36** [−0.43, −0.30] |
| **Keep a court card back** for the end of the last deal (Long; 1793 rule 16; Foster) [08-S1][08-S2][08-S9] | final deal: don't spend a court card while other cards remain | **+0.21** [+0.18, +0.24] | **+0.21** [+0.19, +0.23] |
| — dealer only | | +0.11 [+0.08, +0.14] | +0.16 [+0.14, +0.18] |
| — non-dealer only | | +0.11 [+0.08, +0.13] | not run |
| **Take the opponent's trailed card** "in Preference to any other" (Long I) [08-S1] | always capture the trailed card when possible | **−0.11** [−0.14, −0.09] | **−0.14** [−0.18, −0.11] |
| — as a tie-break only ("if you have a choice", Foster) [08-S9] | prefer it only among captures worth within 0.25 points of the best | +0.01 [−0.02, +0.04] | +0.04 [+0.02, +0.06] |
| "Go for 'cards' in preference to everything else" (Foster) [08-S9] | value of each card captured doubled (0.2 → 0.4) | −0.01 [−0.04, +0.01] | 0.00 [−0.01, +0.01] |
| — stronger (0.8) / weaker (0.05) | | −0.06 / −0.07 (both significant) | not run |
| *Control:* overweight spades (bonus 0.15 → 0.5) | | −0.07 [−0.10, −0.04] | not run |
| Never trail a card that makes ten while Big Cassino is unseen (Foster's form of Long V) [08-S1][08-S9] | trail filter | +0.01 [−0.02, +0.03] | not run |
| Don't leave a table one card can sweep (Long IV; 1793) [08-S1][11-V-S2] | trail filter, no exceptions | 0.00 [−0.03, +0.03] | +0.01 [−0.01, +0.04] |
| **Long 1792 bundle:** courts first + sweep defence + keep a court + take trailed card | combined | **+0.47** [+0.44, +0.50] | **+0.25** [+0.18, +0.32] |
| — same bundle without take-trailed-card | combined | **+0.61** [+0.58, +0.64] | **+0.44** [+0.38, +0.51] |
| — same bundle, take-trailed as a tie-break | combined | **+0.62** [+0.59, +0.65] | **+0.44** [+0.38, +0.51] |
| **Foster 1897 bundle:** small cards first + avoid tens + keep a court + cards ×2 | combined | **+0.30** [+0.27, +0.33] | **+0.22** [+0.15, +0.28] |

*Original computation [SIM-ST]. Middle column: 32,000 duplicate decks per row. Right column: 8,000 duplicate decks per row, paired against plain greedy on the same decks; in absolute terms every variant still loses to the card-counter by 3.2–4.0 points per hand (plain greedy: −3.67; the separate run in §8.4.4, on different decks, gives 3.79 [3.72, 3.86]).*

#### What the tests suggest
- **Trailing court cards first is one of the two most valuable single maxims.**
  - Trailing court cards first is the largest single-rule gain against greedy. Against the card-counter, only keeping a court back gains more. This matches the classical reason: courts "can never be of any other use than to make a pair" [08-S2].
  - Order matters a great deal. The control that trails courts and then *high* numerals loses 0.57 points per hand. The maxim (courts, then *low* numerals) gains 0.32. The gap between them is almost 0.9 points per hand. Most of it probably comes from low versus high numerals, since the only other difference is that the control ignores suit. This is consistent with Foster's reason for trailing small cards: they can "be combined and won with the larger cards kept in the player's hand" [08-S9].
  - Psellos's high-cards-early advice adds little here. It was written for Royal Cassino, where courts count 11–13 and can be combined [08-S36], so these standard-rules tests are not a fair test of it.
- **Keeping a court card for the end works, and not only for the dealer.**
  - Foster, Pagat and the 1793 rule address the dealer [08-S2][08-S9][08-S19]. Long states it for either seat: "In the last Deal, a Court-Card or some other ought to be kept to secure the Advantage of the Cards on the Board" [08-S1]. So does Morehead [08-S12]. The simulation supports the seat-neutral reading. Against greedy, the non-dealer gains just as much (+0.11 each way), and the two gains add up to the combined +0.21.
  - The simulation does not show *why* the non-dealer gains. That would need a dedicated experiment.
- **Taking the opponent's trailed card helps only as a tie-break.**
  - Read literally ("in Preference to any other" [08-S1]), it costs 0.11–0.14 points per hand. It also shrinks the Long bundle's gain, from +0.61 to +0.47 against greedy and from +0.44 to +0.25 against the card-counter.
  - As a tie-break among roughly equal captures, it is neutral against greedy and slightly positive against the card-counter. This is Foster's reading ("if you have a choice" [08-S9]). No source gives a reason for the maxim [08 §1.5], and these tests do not supply one.
- **Re-weighting priorities did not help.**
  - The greedy player already values each card at 0.2 points, so doubling that changed nothing measurable. Larger or smaller weights hurt.
  - Overweighting spades also hurt (−0.07), which agrees with the 1793 warning that "the Desire of taking Spades should never bias your Play" [11-V-S2].
  - These results depend on the simulator's card weights, which are a modelling choice [07-S40].
- **Sweep defence works but does not pay on its own.** Refusing to leave a sweepable table cut the opponent's sweeps from 0.44 to 0.39 per hand, but the net gain was zero, presumably because applying the rule without exceptions forces worse trails elsewhere. The 1793 author's four exceptions (early game, a point available, a close race for cards, a comfortable score) [11-V-S2] may be an answer to this cost. The Long bundle's +0.61 exceeds the sum of its parts (+0.53), so the rules interact, but no run isolates the sweep defence's share.
- **The "Big Cassino" trail filter** (never make ten while ♦10 is unseen) had no measurable effect, probably because the situation is rare: it needs a trail that makes ten with the table while ♦10 is still unaccounted for.
- **Maxims recover only a small part of the gap to the card-counter.** The best bundle (Long's maxims without the literal take-the-trailed-card rule) recovers 0.44 of greedy's 3.67-point deficit per hand against the card-counter. The card-counter still beats every greedy-based variant by more than 3.2 points per hand. The card-counter differs in several ways at once: look-ahead, card counting, building, the option to trail when a capture is available, and explicit handling of the last capture. The tests cannot split the gap between these. The whole gap is about eight times what the best bundle recovers.

#### Limits
- Every variant is the greedy player plus one or more rules. The tests show whether a maxim helps a simple capture-first player, not whether it is part of optimal play.
- The maxims that need memory, inference or building were **not tested**:
  - unpaired-rank counting and negative inference;
  - when to build, raise or take builds;
  - the pair trap;
  - seat-dependent cash-card plans;
  - when to cash Big Cassino.
  Testing these needs a stronger base agent (§13).
- Results are per hand, under one rule set (Pagat, sweeps scored). Nordic scoring (spades worth 2) and Royal values would need their own runs.

**Implications for AI tiers (§9.5):**

- Tier 2 should use the maxims that hold up: courts first, then low cards; keep a court card for the end in either seat; take the trailed card only as a tie-break.
- Taking the trailed card at any cost, and a fixed bias towards spades, are cheap ways to make a lower tier slightly weaker in a way that looks human.
- The large gap to the card-counter suggests that memory, look-ahead and building, not more maxims, should separate Tier 2 from Tier 3.

### 9.5 AI difficulty tiers (from note 08)

Design principle: tiers differ in (a) what the AI *remembers*, (b) how far it *looks ahead*, (c) whether it *infers* hidden cards, and (d) how many of the classical heuristics it applies. The Scopone study is the best empirical template. It built a beginner "Greedy" bot and expert rule bots (Chitarrella–Saracino and Cicuti–Guardamagna), plus a fair ISMCTS bot that beat them, and humans won "47.6% against Greedy and 42.9% against CS … and won only the 23.8% of the matches against the fair ISMCTS player" [08-S48]. Rule-based bots built from traditional maxims therefore make credible mid tiers. Search with hidden-card sampling makes a credible top tier.

#### Tier 1 — Beginner ("Greedy, no memory")
Behaviour, each item cited:

- Capture whenever possible; otherwise trail. This is the BGG solo-variant automaton: "If it can capture one or more cards, it will … If it can't … it will trail them … The AI does not build." [08-S42]
- Among captures, take the most valuable or most cards: "tries to perform the best capture available or it plays the least valuable card if a capture is not available" [08-S48]. Cassino prizes: cards, spades, cash points [08-S1, 08-S9, 08-S14].
- Trail simple discards: court cards first, then small cards [08-S1, 08-S2, 08-S4]. Never trail a 10/2 while a Cassino is out [08-S1, 08-S4]. This is cheap to implement and makes the bot look sensible.
- Basic sweep defence: avoid leaving a lone card when possible [08-S38]. Di Palma & Lanzi's Greedy bot also prioritizes "moves that do not leave on the table a combination of cards which could be captured by a card that is still in play" [08-S48].
- No card memory, no inference, no deliberate building (or only "build if I hold the capture card and the pile ≥ N", like the hobby bot's lowest level, which disfavours special cards and caps "max amount of table cards to pick" at 2 [08-S50]).
- Expected feel: Psellos notes that a strong-memory bot that "doesn't try to guess your cards" is beatable "plenty of the time" [08-S36]. A beginner bot should be weaker than that.

#### Tier 2 — Intermediate ("Hoyle player")
Adds the classical maxims and partial memory:

- Tracks the cash points and the high spot cards (♦10, ♠2, aces; tens, nines, eights) but not everything: "Most players do not make a great effort to remember all other cards" [08-S13]; see also [08-S2, 08-S9, 08-S16].
- Keeps running totals of cards and spades and switches priorities once a majority is clinched (27 cards / 7 spades) [08-S13, 08-S15, 08-S12, 08-S19].
- Capture preferences: the opponent's trailed card, as a tie-break (§9.4) [08-S1, 08-S2, 08-S9]; spades in ties [08-S4, 08-S9]; the Ace before Big Cassino [08-S2]; combinations before pairs early [08-S4]; more cards per capture [08-S9].
- Trail heuristics conditioned on counts: play the 4th ace at once when three are out [08-S2, 08-S9]; prefer Little Cassino over an Ace as a forced trail [08-S2]; trail dead ranks [08-S3, 08-S20]; avoid trailing spades [08-S9, 08-S13]; don't make ten while ♦10 is unseen [08-S9, 08-S12].
- Builds only by a simple EV test: "build only if you get more than 1 extra point" early, more freely later [08-S36]. Uses multiple builds for protection [08-S9, 08-S43]. Raises or steals opponent builds when holding the card [08-S9].
- Endgame: in the final deal, keeps a court card for the last capture in either seat (§9.4) [08-S1, 08-S9, 08-S19]. As non-dealer, saves a cash card for the last trail of a deal [08-S12, 08-S14].
- Score-aware sweep defence per the 1793 rule-21 exceptions [08-S2].
- Hobby precedent for tuning: the MakinenJO bot's level 3 adds `tactic_next` ("try placing card tactically for good pickup next round") and higher weights for aces, ♠2 and spades [08-S50].

#### Tier 3 — Expert ("Morehead/Culbertson player")
Adds full memory and inference:

- Knows every rank still to come, and in the last deal the opponent's exact hand [08-S12]. Tracks unpaired ranks to deduce the final hands [08-S13, 08-S30]. Uses the 220/364 pip total as a cross-check [08-S24, 08-S47a; Derived §2.7].
- Systematic negative inference: "If he had a ten he would have done this…" [08-S13]; the opponent passing a Cassino means he lacks its pair [08-S37]; a surviving build means he lacks its rank [08-S40].
- Opening probability model: about 9% per unseen card per opponent card [08-S36]. EV comparison of capture vs build vs trail [08-S36].
- Seat-aware cash-card plans: dealer builds them early, non-dealer saves them [08-S14, 08-S13]. Ace timing by seat [08-S2].
- Advanced tricks:
  - "Saving your Ten" (leave ♦10 when the opponent has shown no Ten) [08-S37]
  - Decoy builds to draw out an opponent's Ten [08-S37]
  - Trailing builds to rescue Big Cassino [08-S37]
  - Letting the opponent build first, then taking his build [08-S16]
  - Bluff-trailing instead of building to hide intent [08-S39]
  - Pair-trap trailing when the 4th card is out [08-S1, 08-S4]
- Sweep locks: plays or holds the 4th court card depending on whether it wants sweeps [08-S9, 08-S39]. Avoids leaving one-card-capturable tables unless the 1793 exceptions apply [08-S2].
- Score-state play: lurch denial [08-S4, 08-S2]; counting out at 21 [08-S9, 08-S18].
- Partnership mode (4-handed): builds for partner's declared card where the rules allow it [08-S9, 08-S10, 08-S19]; trails a matching card for partner [08-S19]; protects partner's trailed ace [08-S2]; treats a partner's repeated rank as a likely "double" signal (Scopone/African practice) [08-S23, 08-S30, 08-S22].

#### Tier 4 (optional) — "Search" opponent
- Determinized search (ISMCTS) over hidden hands, seeded by the Tier-3 inference model. In Scopone, ISMCTS beat the best rule-based expert and was the hardest fair opponent for humans [08-S48].
- A cheating perfect-information MCTS was strongest (humans won 4.8%) but was not fair [08-S48]. Avoid it, or label it clearly.
- Equilibrium methods (CFR) have been applied to Pasur, a close relative, though under a simplified "full knowledge of each other's hands" setting [08-S49]. That paper also reports that "the distribution of high-value cards heavily influences match outcomes" [08-S49]. That is a reminder that even perfect play has high variance, which argues for multi-deal matches when testing tiers.

#### Knobs for tuning between tiers (each tied to a sourced behaviour)
1. Memory scope: none → cash points + high cards [08-S13] → all ranks [08-S12] → unpaired-rank tracking [08-S13, 08-S30].
2. Inference: off → negative inference from passed captures [08-S13, 08-S37] → probabilistic hand model [08-S36].
3. Build appetite: never [08-S42] → EV-gated [08-S36] → seat- and score-aware [08-S14, 08-S2].
4. Trail policy: courts/small [08-S1, 08-S4] → count-aware dead ranks [08-S3, 08-S20] → game-phase aware (high early, low late) [08-S36].
5. Endgame: none → keep court for last [08-S1, 08-S9] → full last-deal hand reading [08-S12].
6. Deliberate errors at low tiers (Psellos: "Only really serious Cassino players will track all the cards" [08-S36]). A beginner bot that "forgets" whether ♦10 has been seen behaves like a typical human.

---

