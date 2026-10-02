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
  - That merged text then appeared, with little change, in Hoyle from 1796 to 1929 [08 §0][03-S5][03-S33].
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
PLACEHOLDER_TESTS

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
- Capture preferences: the opponent's trailed card [08-S1, 08-S2, 08-S9]; spades in ties [08-S4, 08-S9]; the Ace before Big Cassino [08-S2]; combinations before pairs early [08-S4]; more cards per capture [08-S9].
- Trail heuristics conditioned on counts: play the 4th ace at once when three are out [08-S2, 08-S9]; prefer Little Cassino over an Ace as a forced trail [08-S2]; trail dead ranks [08-S3, 08-S20]; avoid trailing spades [08-S9, 08-S13]; don't make ten while ♦10 is unseen [08-S9, 08-S12].
- Builds only by a simple EV test: "build only if you get more than 1 extra point" early, more freely later [08-S36]. Uses multiple builds for protection [08-S9, 08-S43]. Raises or steals opponent builds when holding the card [08-S9].
- Endgame: as dealer, keeps a court card for the last capture [08-S1, 08-S9, 08-S19]. As non-dealer, saves a cash card for the last trail of a deal [08-S12, 08-S14].
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

