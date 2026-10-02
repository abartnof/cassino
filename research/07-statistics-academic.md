# 07 — Statistics, mathematics, computation and academic work on Cassino and its fishing-game relatives

Scope: statistical, mathematical, computational and academic work on **Cassino/Casino** and close fishing-game relatives (Scopa, Scopone, Escoba, Nordic Kasino, Pasur, Basra/Bastra, Xeri/Tseri, Cuarenta, Chkobba, Tablanette). Every claim has a citation `[Sx]` to a source fetched in this session (list at the end). Anything marked **ORIGINAL COMPUTATION** was produced in this session by the scripts in `research/sim/` [S40–S43]. Those are simulations or exact enumerations, not published results.

---

## 0. Key takeaways for the video-game team

1. **There is almost no published quantitative work on Cassino itself.** arXiv, OpenAlex, CrossRef and web searches turned up **no** peer-reviewed or preprint paper that analyses Anglo-American Cassino (no AI paper, no complexity estimate, no dealer-advantage figure) [S1][S30][S31][S32]. The academic literature on the family covers its relatives:
   - **Scopone:** Di Palma & Lanzi, *IEEE Transactions on Games* 2018, plus the 2014 master's thesis behind it [S2][S3][S4].
   - **Pasur:** Baghal, arXiv 2025, which uses GPU counterfactual regret minimisation [S5].
   - **Scopa:** included as the "fishing" representative in the 2026 *Valet* benchmark of 21 traditional card games [S8].
2. **Seat advantage depends on the game structure and on how people play, so the team should measure it rather than assume it.**
   - In 4-player Scopone, the dealer's team wins more often, and the advantage grows with player strength. The hand team's win rate in self-play falls from 38.0% (random) to 34.7% (ISMCTS) to 29.5% (cheating MCTS) [S2].
   - In my simulation of 2-player Cassino (pagat rules) the seat effect is small and its **sign depends on playing style**. Dealer − non-dealer points per hand by policy (ORIGINAL COMPUTATION, §6.3, §6.10):
     - random: +0.35
     - PIMC: +0.65
     - heuristic: −0.87
     - greedy: −1.15
   - The one robust positional fact is that **the dealer takes the end-of-hand residue in 60–77% of hands** under every policy. That supports the classic advice to hold back a face card for the last play [S21][S23].
3. **How often sweeps happen depends heavily on playing style.**
   - Per hand: 0.045 under random play, 0.16 under PIMC, 0.69 under the heuristic and 0.86 under greedy play.
   - At least one sweep per hand: 4.1%, 13%, 45.5% and 51.2% respectively.
   - The more careful PIMC player rarely leaves a sweepable table (ORIGINAL COMPUTATION, §6.5, §6.10).
   - Against casual human players the sweep ("clear") UI will fire often; against careful AI, rarely.
4. **A game to 21 lasts 3–4 hands**, i.e. 156–208 card plays. Heuristic self-play averages 3.48 hands, with 95% of games taking 3 or 4. Without sweep points the average is 3.63 hands. The winner averages about 24.6 points and the loser about 15.3 (ORIGINAL COMPUTATION, §6.7).
5. **"Most cards" ties at 26–26 happen in about 7% of hands under sensible play** (4.5% under random play). The scoreboard must handle the "no one scores the 3 points" case often (ORIGINAL COMPUTATION, §6.6).
6. **The game is shallow per move but deep overall, and simple AI is already strong.**
   - Branching averages about 4.5 legal moves per decision (maximum seen: 101). A Knuth-estimator size of the full-information tree for one fixed deal is about 10^28 leaves, and there are about 10^50 distinct deals (ORIGINAL COMPUTATION, §6.9).
   - A one-ply card-counting heuristic beats greedy play by +3.8 points per hand and wins 91% of games to 21 (§6.8).
   - In Scopone, published results show that a greedy beginner strategy is "stronger than one might expect": in a round-robin of rule-based bots its overall win rate was 39.8%, against 44.4% and 44.0% for the two expert-rule bots [S2]. A hobby Scopa engine reports that deeper search, tuned weights and opponent modelling all gave null results beyond a cheap PIMC search [S20].
   - For the game, cheap AI is enough for difficulty tiers. A caution: naive PIMC with greedy rollouts was weaker than the one-ply heuristic (−2.05 points per hand, §6.10), so search-based AI needs good playout policies.
7. **Popularity proxies:**
   - Casino is the **8th most-visited rules page on pagat.com** in July, August and September 2026 [S24].
   - The English Wikipedia "Cassino (card game)" article got about 41,000 views in 2025, against about 117,000 for "Scopa" and about 256,000 for "Cribbage" [S27].
   - Google Books Ngram for lower-case "cassino" (the form most likely to mean the card game) peaks in the 1810s–1820s and falls about 46-fold by 2019 [S26]. This fits the documented 19th-century decline of Cassino in England and its later eclipse by Gin Rummy [S28].
   - YouGov's 2023 US survey of 30 card games does not include Casino at all [S25].

---

## 1. Search coverage: what exists and what does not

- **arXiv API** (re-queried after rate limiting) [S30]:
  - `all:cassino AND all:card`, `all:scopa AND all:card`, `all:"fishing card"` and `all:pasur` each return 1 result, the Pasur CFR paper (2508.06559).
  - `all:scopone` returns 1 result, Di Palma & Lanzi (1807.06813).
  - `all:escoba AND all:card` returns 0.
  - `all:briscola` returns 1 (2605.17043, a trick-taking game rather than a fishing game).
  - arXiv's full-text search UI also surfaced the Valet testbed paper (2603.03252), the GPU-CFR paper (2609.11923) and the CCS-MCCFR paper (2607.27035). All three mention Scopa or Pasur [S8][S6][S7].
- **OpenAlex** [S31]:
  - The most relevant "scopone" hits are Di Palma & Lanzi (IEEE ToG 2018) and the 2014 Politecnico di Milano thesis.
  - "pasur card game" returns Baghal 2025 plus the two 2026 CFR papers that cite it.
  - "cassino card game" returns mostly noise. The only on-topic items are a chemistry-education adaptation (*J. Chem. Educ.* 2020) and the Hoyle "CASSINO" chapter.
  - Searches for Scopa are polluted by the Parkinson's-disease "SCOPA" rating scales. This is a false-positive trap for anyone searching the literature.
- **Semantic Scholar API:** HTTP 429 (rate limited) on every attempt in this session, so it was not searched (see Gaps).
- **CrossRef** `query.bibliographic`: noise only, apart from Bell et al. 2020 and the Hoyle chapter [S32].
- **Ludii** (general game system): the Ludii portal returns no game pages for Scopa/Cassino/Casino/Escoba/Pasur/Basra/Scopone. The Ludii GitHub game library (`Common/res/lud/`) has no card-game category at all: its folders are board, dominoes, math, puzzle, etc. [S33]. **No Ludii model of any fishing game exists.**
- **Thesis repositories:**
  - **POLITesi (Politecnico di Milano):** Di Palma 2014 on Scopone [S3].
  - **Universidad Politécnica Salesiana (Ecuador):** a card-recognition thesis for blind *Cuarenta* players [S16].
  - **DiVA and Theseus:** site searches for kasino/kortspel/korttipeli returned only gambling-related theses, nothing on the card game [S34].
  - **Finnish university repositories:** no Kasino AI or statistics thesis was found. The closest Finnish academic artefacts are university programming-course projects that implement Cassino with AI opponents, for example an Aalto "first year programming course" project from 2009 and a "Programming Studio 2" project [S22].

---

## 2. Peer-reviewed and preprint research

### 2.1 Scopone: Di Palma & Lanzi (2018), *IEEE Transactions on Games* 10(3):317–332; master's thesis (2014)

Bibliographic details: authors Stefano Di Palma and Pier Luca Lanzi (Politecnico di Milano, DEIB); arXiv 1807.06813; DOI 10.1109/TG.2018.2834618 [S2][S4]. Volume, issue and pages are confirmed by the MCTS review's reference list [S4]. The underlying MSc thesis is "Monte Carlo tree search algorithms applied to the card game Scopone" (Di Palma, supervisor Lanzi, defended 18 Dec 2014, POLITesi hdl 10589/102246) [S3].

**What they built.**
- Three rule-based bots:
  - **Greedy:** the beginner strategy.
  - **Chitarrella-Saracino (CS):** "the 44 rules of Chitarrella and the most important playing strategies from the 110 advices contained in the book by Saracino".
  - **Cicuti-Guardamagna (CG):** CS plus extra rules for sevens.
- A **cheating MCTS** player that sees all hands.
- A **fair ISMCTS** player [S2].
- They also built a "card guessing" module that tracks inferences such as: if a player "did not do a scopa move, we can fairly assume that the card required for the scopa was not in her hand" [S2]. This is a model for an AI's opponent inference.

**Experimental design.** "we randomly generated 1000 initial decks … and used these 1000 decks in all the experiments". Each matchup was played with seats swapped, and 95% confidence intervals are reported [S2].

**Seat bias (deck team = dealer's side vs hand team), random players.** "the deck team has an advantage over the hand team, winning 45.7%[45.3−46.1] of the matches, while the hand team wins 41.7%[41.3−42.1] of the matches and 12.6%[12.4−12.8] of the matches end with a tie. Such advantage was known and already mentioned in the historical strategy books … but was not estimated quantitatively before". They add: "the reported difference is not statistically significant for a 95% confidence level (p-value is 0.071)" [S2].

**The bias grows with skill.** In same-AI matches "the winning rate of the hand team decreases as the player's strength increases: 38.0% of the random strategy, 38.1% of CS, 34.7% of ISMCTS, and 29.5% of MCTS" [S2].

**Rule-based tournament** (Table IV) [S2]:

| Bot | Wins | Losses | Ties |
|---|---|---|---|
| CS | 44.4% | 41.2% | 14.3% |
| CG | 44.0% | 42.0% | 14.1% |
| Greedy | 39.8% | 45.0% | 15.2% |

The authors' commentary [S2]:
- "the Greedy strategy … turns out to be stronger than one might expect … there is only a difference of about 4% of wins".
- The scopa-prevention habit plus taking the most valuable cards "are sufficient to obtain a good strategy".
- Greedy-vs-Greedy produces more ties (17.3%) "since the points are equally distributed".

**MCTS and ISMCTS tuning** [S2]:
- **MCTS reward function:** "Scores Difference" was best at low iteration counts. MCTS "begins to stabilize" at 1,000 iterations.
- **MCTS vs Greedy:** as the deck team, MCTS reached 91.8% wins at 4,000 iterations and 93.8% at 32,000. As the hand team it reached 84.0% and 86.2%.
- **Playout policy:** ε-greedy playouts with ε = 0.3 were best. Pure greedy playouts "dramatically harm" plain MCTS but not ISMCTS.
- **ISMCTS:** "needs four times more iterations before its performance stabilizes". At 4,000 iterations it beats Greedy 66.6% as the deck team and 53.0% as the hand team.

**Final tournament** (Table VI) [S2]:

| AI | Wins | Losses | Ties |
|---|---|---|---|
| Random | 10.3% | 84.8% | 4.9% |
| CS | 41.7% | 47.9% | 10.4% |
| MCTS (cheating, 1k iterations) | 79.0% | 12.6% | 8.3% |
| ISMCTS (4k iterations) | 55.8% | 34.1% | 10.1% |

- ISMCTS at 32,000 iterations beats CS 64.8% / 23.3% / 11.8% (wins / losses / ties) [S2].
- Cost: "an average of 20 seconds to select a move using 32000 iterations" (C#/Mono, Intel Core i5 3.2 GHz) [S2].

**Human study.** "218 matches involving 32 people … ended up with 105 matches recorded (21 for each one of the five artificial players)". Humans "won 30.5% of the matches, tied 12.4% … and lost the remaining 57.1%". Human win rates by opponent: 47.6% against Greedy, 42.9% against CS, 33.3% against ISMCTS-1000, 23.8% against ISMCTS-4000, and 4.8% against cheating MCTS [S2].

Design-relevant note on the human study: players "were puzzled by their teammate's behavior" when partnered with MCTS/ISMCTS, because those bots do not follow "what is perceived as the traditional way to play" [S2]. This is a UX warning: strong AI partners can feel alien.

**Game complexity** (thesis, Ch. 5) [S3]:
- **MCTS view (perfect information):**
  - State space 2.02×10^47, tree nodes 1.03×10^23, leaves 1.73×10^22, depth 36, effective branching factor (EBF) 4.33.
  - The number of initial states is C(40,9)·C(31,9)·C(22,9)·C(13,9) = 1.96×10^24.
  - These counts treat a move as just "playing a card", so they "have to be considered as a lower bound".
  - Comparison: "a game tree complexity and EBF comparable with Connect Four, and a state space similar to Chess".
- **ISMCTS view (information sets):**
  - Information-set space 2.23×10^58, tree nodes 1.14×10^34, leaves 3.95×10^33 (= 9!·27!), EBF 8.8.
  - Comparison: "a game tree complexity comparable with Congkak, an EBF like Domineering(8×8), and a state space similar to Hex(11×11)".

**Rules details useful to a designer** [S2]:
- Scopa (sweep) is "not allowed" on the last turn.
- The primiera point values are 7=21, 6=18, A=16, 5=15, 4=14, 3=13, 2=12, face cards=10.
- If three kings land on the table at the deal, the deal is repeated.

**Citation trail.**
- The 2021/2022 MCTS survey by Świechowski et al. cites the paper as "Di Palma S, Lanzi PL (2018) … IEEE Transactions on Games 10(3):317–332" [S4].
- The 2019 Jass AI survey cites it but **mis-attributes the authors** as "M. N. Watanabe and P. L. Lanzi" [S9]. Anyone following references should be aware of this error.

### 2.2 Pasur: Baghal (2025), "Solving Pasur Using GPU-Accelerated Counterfactual Regret Minimization", arXiv 2508.06559

**Scope.** "Pasur is a fishing card game played over six rounds and is played similarly to games such as Cassino and Scopa, and Bastra". It is "popular in Middle Eastern cultures". Two-player variant [S5].

**Rules recorded** [S5]:
- Capture rules:
  - A numeral card captures numeral cards from the pool "if their total sum equals 11".
  - A Jack takes "All cards in the pool, except Kings and Queens".
  - A Queen captures a single Queen; a King captures a single King.
- A **Sur** (sweep) cannot be made with a Jack and is not allowed in the final round.
- Scoring:

  | Item | Points |
  |---|---|
  | Most Clubs | 7 |
  | Each Jack | 1 |
  | Each Ace | 1 |
  | Each Sur | 5 |
  | 10♦ | 3 |
  | 2♣ | 2 |

- Rule note and computed probability: an initial pool containing a Jack is re-dealt. The probability of at least one Jack among the 4 pool cards is 1 − C(48,4)/C(52,4) = **28.1%** (ORIGINAL COMPUTATION) [S42].

**Method.**
- The game tree is split into "(1) actual game states, and (2) inherited scores from previous rounds" and solved round by round backwards.
- "the complete game tree … on average consists of over 10^9 nodes", run on "32 GB of RAM and 10 GB of VRAM".
- DCFR parameters "γ = 2, α = 1.5, β = 0".
- XGBoost models are trained to imitate the strategies [S5].

**Important caveat: perfect information.** The solved setting assumes "both players have full knowledge of each other's hands". The author lists extending to the hidden-hand game as future work [S5]. So this is not yet a solution of real Pasur.

**Results** [S5]:
- More than 500 random decks were solved.
- **Deck "fair value"** (P(first player Alex wins) under near-Nash self-play) depends strongly on Jacks and Clubs dealt to Alex (Table 16). Examples:
  - 0 Jacks and ≤7 clubs: v = 0.06.
  - 2 Jacks and >6 clubs: v = 0.54.
  - 4 Jacks and >4 clubs: v = 0.85.
- In the author's words: "the distribution of high-value cards heavily influences match outcomes".

**Citations.** Cited in 2026 by Li & Huang (GPU-CFR, Tsinghua) [S6] and by Li, Chen & Huang (Correlated Chance Sampling MCCFR) [S7]. Both are general CFR-engineering papers and do not report new Pasur results.

### 2.3 Benchmark suites: Valet (2026) and CardStock

**Valet** (Goadrich, Morenville & Piette, arXiv 2603.03252, March 2026) [S8]:
- A testbed of "21 traditional imperfect-information card games" encoded in the RECYCLE card-game description language.
- **Scopa** is the representative of "fishing and capture". Its Table 1 row reads "Scopa | Fishing | Italy | 1700 | 2 | Italian | High Score".
- The selection was guided by pagat.com's classifications and Parlett's *Penguin Book of Card Games* [S8].
- The project site states that the Scopa rules are "summarized from https://www.pagat.com/fishing/scopa.html". It lists Scopone, **Casino** and Escoba as other fishing games, plus the Hanafuda games Go-Stop and Hachi-Hachi [S10].

**CardStock** (the same group's system) [S11]:
- Its GitHub repository holds RECYCLE encodings `Escoba2.rcy` and `Scopa2.rcy`, an abandoned `Scopone4.rcy` (in a "BustedJunk" folder), and analysis plots.
- The Scopa branching-factor plot shows the rhythm of 3-card hands. Branching mostly sits at about 3, then 2, then 1 per hand, and seldom exceeds about 6 (my reading of `ChoicesScopa.png`) [S11].
- **No Cassino encoding exists in CardStock or Valet.**

### 2.4 Other academic work touching the family

- **Chemistry education:** Bell, Martinez-Ortega & Birkenfeld (2020), "Organic Chemistry I Cassino: A Card Game for Learning Functional Group Transformations for First-Semester Students", *J. Chem. Educ.*, DOI 10.1021/acs.jchemed.9b00995. The abstract describes a card game "based on learning the basic functional group interconversions" [S12]. Cassino's capture/build mechanic has been reused for teaching.
- **Mathematics education (Ecuador):** Barros Morales, Rodríguez Domínguez & Barros Bastidas (2015), "El juego del cuarenta, una opción para la enseñanza de las matemáticas y las ciencias sociales en Ecuador", *Revista Universidad y Sociedad* 7(2):137–144 [S15].
  - "El Cuarenta se clasifica dentro de los juegos populares pasivos, pues para este no se necesita de un esfuerzo físico, solo un esfuerzo triple mental … matemática, el uso de la memoria y la estrategia". Translation: Cuarenta is a passive popular game needing no physical effort, only a "triple mental effort": mathematics, memory and strategy.
  - The article claims the game develops "capacidades matemáticas" (mathematical abilities) in basic-education pupils [S15].
- **Accessibility / computer vision (Ecuador):** Gualli Ushiña & Angamarca Pupiales (2016), Universidad Politécnica Salesiana thesis. It recognises *Cuarenta* cards for a blind player using OpenCV and a multilayer neural network: "a reliability greater than 85% and increasing its reliability to 94.7% if artificial light is included" [S16]. This is relevant if the video game targets accessibility.
- **Elder care / cognitive games:** the EU MoveCare platform offered "two cards games (scopa and briscola, popular in the South of Europe)" among its cognitive games (Luperto et al., *Int. J. Social Robotics* 2022, PMC8853423) [S17].
- **Adjacent methodology (not a fishing game):** Giacomelli (2026), "Beyond the briscola advantage", arXiv 2605.17043. It is a pre-registered Monte Carlo tournament of 10^6 Briscola games with Wilson confidence intervals and a reproducibility appendix [S18]. It is a good template for publishing Cassino simulation claims.
- **Surveys** that place Scopone in the card-game AI landscape: the Niklaus et al. 2019 Jass survey [S9] and the Świechowski et al. MCTS review [S4].

---

## 3. Published probability results and classic "statistical" claims

- **Scopone, probability of a scopa on the opening lead** (Gino Favero, "Qual è la probabilità di fare scopa all'apertura delle carte?", vialattea.net, 13 Aug 2003) [S19].
  - Setting: 10-card Scopone, opening lead onto an empty table, "senza 'scopa d'asso'" (without the ace-sweep rule).
  - Conditioning on the size i of the group the leader's card comes from, the next player can sweep with probability P(B|A₃) = 1/3, P(B|A₂) = 49/87 and P(B|A₁) = 146/203. Favero: "1/3 ~ 33%, 49/87 ~ 56% e 146/203 ~ 72%".
  - Overall, about **54.05%** for the orthodox lead policy, against about 46.74% for the alternative ("decisamente minore del precedente" = "decidedly lower than the previous one") [S19].
  - **Check (ORIGINAL COMPUTATION):** 1 − C(30−(4−g),10)/C(30,10) gives exactly 146/203, 49/87, 1/3 and 0 for g = 1–4 [S42].
- **Classic Cassino scoring arithmetic** [S21][S23][S35]:
  - "the total number of points to be made in each hand, exclusive of sweeps, is eleven" (Foster 1897) [S21].
  - Pagat: "There are eleven possible points in each hand" [S23].
  - Psellos: "most cards" requires "27 cards or more" [S35].
  - This implies only one tie case for cards (26–26). A spades tie is impossible (13 spades).
- **Classic positional claim, 1897:** "The last trick is usually made by the dealer, who always keeps back a court card if he has one, to pair one already on the table" [S21]. Pagat's modern hint says the same: "it is often good for the dealer to hold back a face card to play last if possible" [S23]. My simulation quantifies how often the dealer takes the residue (§6.3).
- **Classic heuristic advice, 1897** (the basis of the heuristic bot in §6): "Go for 'cards' in preference to everything else, and always make combinations that take in as many cards as possible"; "If Big Cassino is still to come, avoid trailing cards that will make a Ten" [S21].
- **Escoba arithmetic (ORIGINAL COMPUTATION** on the 40-card Spanish deck, sota = 8, caballo = 9, rey = 10) [S42]:
  - P(the 4 opening table cards sum to 15) = 3,120/91,390 = **3.41%**.
  - P(they sum to 30) = 2,492/91,390 = **2.73%**.
  - The whole deck sums to 220 ≡ 10 (mod 15). Every capture removes a multiple of 15, so the final residue always sums to 10, 25, 40, … This makes a handy integrity check for an Escoba engine.
- **Scopa / Scopone opening redeal (ORIGINAL COMPUTATION):** P(≥3 kings among the 4 table cards) = 29/18,278 = **0.159%** [S42]. This is the redeal condition reported by Di Palma & Lanzi [S2].

---

## 4. Open-source and hobby AI projects with quantitative or design-relevant content

- **Scopa engine with PIMC (Tartaluca21/scopa-engine-ai)** [S20]:
  - What it is: Perfect-Information Monte Carlo (PIMC) search plus alpha-beta search, a genetic algorithm and an ISMCTS alternative. Results are reported as "paired, seat-swapped" self-play, in points per deal with 95% confidence intervals.
  - Reported findings (hobby project, not peer-reviewed):
    - The deployed configuration (12 worlds, depth 5, "≈10 ms" per move) "agrees ~82% with a 23×-larger 'oracle' search".
    - Deeper search "leaned worse": 40×12 vs 12×5 = −0.80 ± 0.42 points/deal. They attribute this to "PIMC strategy fusion".
    - "an anytime ISMCTS at a 50×-larger time budget only tied PIMC@10 ms (+0.03 ± 0.46)".
    - An evolved weight genome lost to uniform weights by "+0.298 ± 0.141 pts/deal". It over-valued scope, with 0.61 vs 0.50 scope per deal.
    - Soft "rational-opponent" inference was a null result (−0.033 ± 0.095).
    - A learned value function predicted better (R² 0.49 vs 0.30) but played no better.
  - Warning from the authors: "an N = 60 run once showed a +0.77 / 2.4σ effect that failed to replicate". Scopa self-play is so noisy that N ≥ 150 hands and several seeds are needed [S20].
- **Scopa RL environment (WildPino/scopa-master)** [S13]: MaskablePPO with an LSTM policy (2 layers, 256 units) and a 296-dimensional observation. Reward shaping includes "+3.0 per svuotare il tavolo" (+3.0 for clearing the table, i.e. a scopa) and "+1.5 per catturare il 7♦" (+1.5 for capturing the 7♦). No performance figures are published.
- **Scopone RL (DeLnlyMthrLvr/ScopaAI_ToM, Alessandro Castoldi):** "developing and training AI agents to play the card game Scopone Scientifico using various reinforcement learning techniques" with PettingZoo. No results are published [S14].
- **Escoba del 15 engine in Rust (rcantore/escoba15):** uses "Information Set Monte Carlo Tree Search (ISMCTS)". Playouts score cards, oros (coins), the "siete de velo" (7 of coins) and escobas. No strength figures [S36].
- **Cassino as a Go module (dkmccandless/cassino):** a precise rules write-up covering simple vs compound builds and the controlled-build constraint. It scores a sweep "immediately" [S37]. Useful as a reference implementation of building rules.
- **Finnish Kasino with AI (Thorium/Kasino)**, MonoGame plus browser build [S38]. It documents a markedly different Finnish scoring system:
  - Most spades 2, most cards 1.
  - "Tied categories carry over".
  - "Sweeps cancel out. The lowest sweep count at the table is subtracted from every player's sweeps".
  - "Sweep freeze. Once any player has reached 10 cumulative points, sweeps score nothing".
  - Target 16.
  - The point for the team: Nordic Kasino statistics would differ from Anglo-American Cassino.
- **University course projects** (Finland and elsewhere) [S22]:
  - "Kasino card game with GUI done in Java as part of first year programming course at Aalto University. Completed in 2009"; the author adds that the AI "is even competetive" [sic].
  - "Project for 'Programming Studio 2' course. A card game called 'Cassino'".
  - A ScalaFX "Nordic Casino" with "Computer opponents, which select the best available move on each turn".
  - The Pasur Trainer (a Java project that adds scoring and logging to a Pasur trainer).
  - These are teaching artefacts, not research. None reports statistics.
- **Other relatives on GitHub** [S22]: Cuarenta "Card Game Environment" (joseduc10/cuarenta), a Chkobba AI (marked "Not ready yet"), many Basra and Tablanette implementations, and a Chkobba/Rummy/Belote score-keeping app (Binary-Team/Rachma-Android). None publishes numeric results.

---

## 5. Popularity data

### 5.1 pagat.com traffic ranking (2026)

- Pagat's "Popular Game Pages" table ranks rules pages by distinct visiting hosts per month [S24].
- **Casino is #8 in each of July, August and September 2026.** The pages above it are Shithead, Swoop, Twenty-Nine, Gin Rummy, Golf, Rummy (Basic) and Cheat [S24].
- Method: the popularity hearts rank pages by "the average number of people (actually different IP addresses) per month who visited the game rules page in the last 6 months. Top 10% get 5 hearts…" [S24].
- On its own rules page pagat calls Casino "the only fishing game to have become popular in English speaking countries" [S23].

### 5.2 YouGov (US, 2023)

- YouGov's "Card Games" survey: 1,000 US adult citizens, fieldwork 10–12 May 2023, margin of error ±3.9% [S25].
- It asked "Have you ever played…" for 30 games. **Casino/Cassino is not among them.** The only fishing game listed is **Zwickern: 4% have played** [S25].
- Comparators: Gin Rummy 52%, Cribbage 20%, Go Fish 79%, Solitaire 83% [S25].
- Cassino's absence suggests it is no longer seen as a mainstream US game. This is an inference.

### 5.3 Wikipedia pageviews (Wikimedia REST API, user agents, calendar-year totals) [S27]

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
- The figures exclude redirects. For example, "Basra (card game)" redirects to "Bastra" and "Xeri" redirects to "Tseri" [S27].

### 5.4 Google Books Ngram (English, 1700–2019, smoothing 3) [S26]

- **Lower-case "cassino"** (mostly the card game, since the place name is capitalised):
  - First appears around 1800, peaks at **6.50×10⁻⁸ in 1821**, falls to 1.30×10⁻⁸ by 1860 and 2.5×10⁻⁹ by 1900, and is **1.40×10⁻⁹ in 2019**.
  - That is roughly a 46-fold drop from peak.
  - Decade means (unsmoothed): 1820s 5.33×10⁻⁸; 1850s 8.99×10⁻⁹; 1900s 2.22×10⁻⁹; 1940s 5.35×10⁻⁹ (a small bump); 2010s 1.57×10⁻⁹.
  - The en-GB corpus peaks in 1823 (9.03×10⁻⁸) and en-US in 1819 (3.13×10⁻⁸).
- **Capitalised "Cassino"** is dominated by the town and abbey of Monte Cassino. It peaks at **4.98×10⁻⁷ in 1944**, the battle of Monte Cassino, so it is **not usable** as a card-game signal. "Monte Cassino" alone peaks in 1946.
- **Phrase signals** are sparse (≤10⁻⁸) but consistent:
  - "Little Cassino" peaks in the 1830s (decade mean 9.9×10⁻⁹) and fades after the 1860s.
  - "Big Casino" and "Little Casino" (single-s spelling) rise in the 1880s–1920s, with "Big Casino" peaking in 1912 at 1.14×10⁻⁸. This matches the American revival described in histories [S28].
- **Comparators in the same corpus:**
  - "whist" peaks at 9.22×10⁻⁷ (1895).
  - "piquet" peaks at 7.77×10⁻⁷ (1778).
  - "cribbage" peaks at 1.20×10⁻⁷ (1793), still 6.1×10⁻⁸ in 2019.
  - Cribbage keeps about 40× Cassino's 2019 frequency.
- **Italian corpus:** "scopone" rises through the 20th century (peak 2.20×10⁻⁷ in 1984) and "scopone scientifico" peaks in 2006. "scopa" is unusable because it is also the ordinary word for "broom".
- **Spanish corpus:** "escoba" (broom) and "cuarenta" (forty) are confounded by ordinary vocabulary and cannot be used.
- **Historical consistency:** Wikipedia states Cassino "began to fade away in England in the late 19th century" while becoming popular in America, and "was eventually eclipsed by Gin Rummy" (citing Pratesi 1995) [S28]. Pagat dates its first appearance "at the end of the eighteenth century in London" [S23]. The lower-case Ngram curve, which starts around 1800, matches this.

### 5.5 Finnish and Nordic surveys

- No published survey with Kasino percentages was found. The only lead was a web-search result summary (not a fetched page). It described a commercial Finnish card-games site's informal "small-scale survey" listing Paskahousu, Kasino, Sika, Tuppi, Ginirommi, Seiska and Mustamaija as popular light games. **[UNVERIFIED — not found in fetched sources]**

---

## 6. ORIGINAL COMPUTATION: Monte Carlo study of 2-player Cassino

**Citation for every number in this section:**
- Scripts: `research/sim/cassino_sim.py` (engine and policies), `research/sim/run_experiments.py` (experiments; output `research/sim/results.json`), `research/sim/mechanism.py` (seat-effect mechanism; outputs `research/sim/mechanism_*.json`), `research/sim/pimc.py` (PIMC robustness check; outputs `research/sim/pimc_*.json`), and `research/sim/combinatorics.py` (exact enumerations; output `research/sim/combinatorics_out.json`) [S40–S43].
- Reproduce with `cd research/sim && python3 run_experiments.py` (seed 20261002; about 17 minutes on 2 cores). The invariant tests are in `research/sim/test_invariants.py`.
- Other runs:
  - `python3 mechanism.py heuristic 4000 11` (also `greedy 10000 12` and `random 10000 13`);
  - `python3 pimc.py self 300 101` and `python3 pimc.py self 300 202`;
  - `python3 pimc.py heuristic 100 303` and `python3 pimc.py heuristic 100 404`;
  - `python3 combinatorics.py`.

### 6.1 Rules implemented (from pagat's Casino page [S23])

- 52 cards. A = 1 and 2–10 count their pip value. J, Q and K have no numeric value and "can only capture an equal picture"; with several on the table, "only one may be captured" [S23].
- Deal: 4 cards to each player and 4 to the table on the first deal, then 4 to each player only. That gives "6 deals for 2 players". The player left of the dealer (the non-dealer) leads [S23].
- Plays:
  - trail;
  - capture (equal ranks and/or disjoint sets summing to the capturing value, plus a build of that value);
  - build (single or multiple; the builder "must hold a numeral card which can later make the capture");
  - add to a build (raise a single build; or add a matching set, making it multiple).
- Control rule: the player in control of a build may not trail, and may not "leave yourself with no card equal to the value of this build" [S23].
- Residue to the last capturer; it counts as a sweep only if the final capture itself cleared the table [S23].
- Scoring:
  - Most cards 3 (no points on a tie), most spades 1, Big Casino (10♦) 2, Little Casino (2♠) 1, each ace 1.
  - Plus 1 per sweep: "Many people play that a Sweep is worth one point" [S23].
- Game: 21 points; if both reach it, the higher score wins; a tie plays another hand [S23].

**Simplifications** (choices of the simulator, documented in the script):
- Capture moves are limited to *maximal* sets of loose cards, and always include the matching build.
- Builds of equal value are merged into one multiple build.
- When a new multiple build absorbs further loose sets, only the largest such packing is used.

**Policies:**
- **random:** uniform over legal moves.
- **greedy:** takes the most valuable capture; otherwise trails its least valuable card; never builds.
- **heuristic:** one-ply look-ahead with card counting. For each move it scores immediate value plus the value of its own builds that survive the reply, minus the expected best greedy reply. The reply is estimated over 24 samples of the opponent's hidden hand drawn from unseen cards. It handles the end-of-hand residue explicitly.
- **pimc:** Perfect-Information Monte Carlo with 8 sampled worlds × greedy rollouts to the end of the hand. Sampling is constrained so that an opponent who controls a build holds a card of its value.
- **Card weights** used by greedy and heuristic: 0.2 per card, +0.15 per spade, +1 per ace, +2 for 10♦, +1 for 2♠, +1 per sweep.

**Invariants verified** over thousands of hands per policy pair: 52 cards always distributed; 13 spades; 4 aces; non-sweep points = 11, or 8 on a 26–26 cards tie [S43].

### 6.2 Points per hand by policy (self-play; one "hand" = one full pass of the deck)

| Self-play policy (N hands) | Dealer pts/hand | Non-dealer pts/hand | Dealer − non-dealer [95% CI] | P(dealer wins hand) | P(hand tied) |
|---|---|---|---|---|---|
| random (40,000) | 5.632 | 5.278 | **+0.354** [+0.293, +0.415] | 52.5% | 1.4% |
| greedy (40,000) | 5.254 | 6.400 | **−1.146** [−1.205, −1.088] | 40.7% | 3.7% |
| heuristic (20,000) | 5.305 | 6.177 | **−0.872** [−0.952, −0.792] | 43.1% | 3.8% |

- The standard deviation of points per player per hand is about 2.9–3.1. The standard deviation of the dealer − non-dealer difference is about 5.8–6.2 points.
- Excluding sweeps, the dealer − non-dealer difference is +0.354 (random), −1.236 (greedy) and −0.922 (heuristic) [S40].

### 6.3 Dealer vs non-dealer: who has the edge, and why

- **Result:** the size and sign of the seat effect depend on the policies.
- **Self-play, dealer − non-dealer points per hand** [S40][S43]:
  - random: +0.35 [+0.29, +0.42]
  - PIMC: +0.65 [+0.19, +1.10] (600 hands)
  - heuristic: −0.87 [−0.95, −0.79]
  - greedy: −1.15 [−1.20, −1.09]
- **Mixed duplicate matches.** The seat effect is estimated as half the difference between "A − B when A deals" and "A − B when B deals" [S40][S43]:
  - heuristic/greedy: −1.19 (heuristic beat greedy by +2.60 points per hand when heuristic dealt, and by +4.98 when greedy dealt);
  - PIMC/heuristic: −0.11, consistent with zero;
  - greedy/random: −0.03;
  - heuristic/random: −0.06.
- **Conclusion:** in 2-player Cassino the seat is worth at most about ±1 point per hand (≤10% of the 11 points), and **no direction is established for strong play**.
- The non-dealer-advantage mechanism described below applies to "hold-back" styles: greedy and heuristic players that keep aces and casinos until they can capture.
- **Over a whole game the seat effect mostly washes out**, because the deal alternates. In 20,000 greedy games, the first dealer won 48.4% [47.7, 49.1]. In 5,000 heuristic games it won 48.8% [47.4, 50.2] [S40].
- **Dealer's compensations:**
  - Takes the end-of-hand residue in 60.5% (random), 64.1% (greedy) and **72.0% (heuristic)** of hands.
  - Makes more sweeps: 0.372 vs 0.322 per hand under heuristic, and 0.474 vs 0.385 under greedy [S40].
- **Non-dealer's gains** (heuristic self-play), shown as expected category points per hand [S40]:

  | Category (max points) | Dealer | Non-dealer |
  |---|---|---|
  | Cards (3) | 1.330 | 1.458 |
  | Spades (1) | 0.466 | 0.534 |
  | Big Casino (2) | 0.989 | 1.011 |
  | Little Casino (1) | 0.437 | 0.563 |
  | Aces (4) | **1.712** | **2.289** |
  | Sweeps | 0.372 | 0.322 |

- **Mechanism** (`mechanism.py`, heuristic, 4,000 hands) [S41]:
  - The non-dealer's *first play of each deal* (fresh 4-card hand) captures 3.72 times per hand, i.e. in 62% of the 6 deals. The dealer's first play captures 3.19 times.
  - Scoring cards (aces and casinos) captured *during play* average 1.95 per hand for the non-dealer against 1.20 for the dealer.
  - Under random play these are equal (1.45 vs 1.45), because random players do not hold valuable cards back. With greedy players: 3.20 vs 2.35.
- **Interpretation (inference from these numbers):**
  - Sensible players keep aces and Little Casino until they can capture with them, so these cards often become the last card of a deal.
  - The dealer's forced last card is then exposed to the non-dealer's fresh 4-card hand.
  - The non-dealer's own forced last card faces only the dealer's single remaining card, and then the non-dealer's own fresh hand.
  - The per-play capture counts above fit this explanation.
  - **This is a property of these policies plus the 4-card deal structure. It is not a property of optimal play.** The PIMC agent, which plays differently and makes far fewer sweeps, shows the opposite sign (§6.10).
- **Comparison:** in Scopone (one 9-card deal, dealer always last) the dealer's side is favoured, and increasingly so with skill [S2]. Scopone's single 9-card deal leaves no leader-of-each-deal advantage for the non-dealing side to exploit, which may explain the opposite direction. That is an inference.

### 6.4 Distribution of the 11 points

Heuristic self-play, both seats combined, per hand [S40]:

| Category | Expected points (both players) | Detail |
|---|---|---|
| Cards (3) | 2.788 | 3 × (1 − 7.07% tie) |
| Spades (1) | 1 | Never tied |
| Big Casino (2) | 2 | |
| Little Casino (1) | 1 | |
| Aces (4) | 4 | |
| Sweeps | 0.693 | |
| **Total** | **≈11.48** | |

- Mean cards captured by the dealer: 25.65 (SD 5.37). Under greedy: 25.14 (SD 5.61). Under random: 26.66 (SD 7.84).
- Under random play the dealer wins "cards" 52.2% of the time against 43.3% for the non-dealer, driven by the large residue (8.1 cards on average) [S40].

### 6.5 Sweeps

| Self-play policy | Sweeps per hand (both players) | P(≥1 sweep) | Distribution 0 / 1 / 2 / 3 / 4+ |
|---|---|---|---|
| random | 0.045 | 4.1% | 95.9 / 3.8 / 0.3 / 0.03 / 0 % |
| greedy | 0.859 | 51.2% | 48.8 / 28.8 / 14.2 / 5.4 / 2.9 % |
| heuristic | 0.693 | 45.5% | 54.5 / 29.1 / 11.1 / 3.7 / 1.6 % |
| PIMC (600 hands, [S43]) | 0.158 | 13.0% | — |

- The non-dealer can sweep on the very first play of a hand in only **~1.45%** of deals: 1.43% (random), 1.47% (greedy), 1.46% (heuristic). This depends almost entirely on the deal [S40].
- Where sweeps happen (heuristic) [S41]:
  - Most come mid-deal: 0.147 per hand on the dealer's 2nd play and 0.121 on the non-dealer's 2nd play.
  - Only 0.065 (dealer) + 0.070 (non-dealer) sweeps per hand happen in the first deal; the other 0.55 happen in deals 2–6.
- **Sweeps add at most about 0.7–0.9 points per hand (heuristic or greedy), and only about 0.16 under the sweep-averse PIMC style, but they swing games.** Without sweep scoring a game lasts 3.63 hands instead of 3.48 (§6.7).

### 6.6 "Cards" ties (26–26)

- P(26–26 tie): random 4.49% [4.28, 4.69]; greedy 6.85% [6.60, 7.10]; heuristic 7.07% [6.71, 7.42] [S40].
- When it happens, the 3 points for cards are not awarded. Some variants carry the points over, as in Finnish rules ("Tied categories carry over") [S38].

### 6.7 Game length to 21 points (deal alternates, first dealer randomised)

| Matchup (N games) | Mean hands [95% CI] | Hands 2 / 3 / 4 / 5 / 6+ | Winner / loser mean final score |
|---|---|---|---|
| heuristic vs heuristic, sweeps count (5,000) | **3.48** [3.47, 3.50] | 2.3 / 49.7 / 45.4 / 2.5 / 0.1 % | 24.6 / 15.3 |
| heuristic vs heuristic, no sweep points (3,000) | 3.63 [3.61, 3.65] | 0.6 / 40.0 / 54.9 / 4.4 / 0.1 % | 24.3 / 14.8 |
| greedy vs greedy, sweeps (20,000) | 3.40 [3.39, 3.41] | 4.0 / 54.3 / 39.3 / 2.3 / 0.1 % | 24.7 / 15.0 |
| greedy vs greedy, no sweeps (20,000) | 3.63 [3.62, 3.64] | 0.8 / 40.0 / 54.5 / 4.7 / 0.1 % | 24.4 / 14.8 |
| random vs random (20,000) | 3.56 [3.55, 3.57] | 1.5 / 45.1 / 49.6 / 3.8 / 0.1 % | 24.6 / 14.3 |

- Two hands can only reach 21 in about 1–8% of games, because each hand gives at most 11 points plus sweeps.
- **For session design:** at 52 plays per hand, a typical game is about 180 plays.
- No game ran past 7 hands [S40].

### 6.8 Policy comparison (duplicate format: each deck played twice with seats swapped)

| A vs B | A − B points/hand [95% CI] | P(A wins hand) | P(A wins game to 21) |
|---|---|---|---|
| greedy vs random | +5.57 [5.51, 5.63] | 86.9% | 98.3% (10,000 games) |
| heuristic vs random | +7.34 [7.28, 7.40] | 96.0% | 99.9% (2,000 games) |
| heuristic vs greedy | +3.79 [3.72, 3.86] | 75.9% | 91.4% (4,000 games) |

Skill dominates luck in Cassino much more than the "simple game" reputation suggests. A modest look-ahead player beats a greedy capture-maximiser in about 9 of 10 games to 21 [S40]. Compare Scopone, where the expert rule set beat Greedy by only about 4 percentage points [S2].

### 6.9 Complexity under random play (10,000 hands)

- **Branching:** 52 decisions per hand. Mean branching factor 4.45; geometric mean 3.27; maximum 101 (many build and capture combinations).
- **Branching by position in a deal:** it falls with hand size: about 7.1 / 7.3 on the first two plays of the hand, about 9 at the start of later deals (more cards on the table), then about 4.5, 2.7 and 1.3 as hands empty.
- **Tree size for a fixed deal:** the mean of log10 of the product of branching factors along a path is 24.7. The **Knuth (1975) unbiased estimator** of the number of leaves of the full-information tree for one fixed deal is **≈10^28.2**. The estimator is heavy-tailed, so treat this as an order of magnitude.
- **Number of deals:** the number of distinct deals of one hand (13 ordered 4-card packets) is 52!/(4!)^13 ≈ **10^49.96** [S42].
- **Hidden information at the first decision:** the leader faces C(44,4) = 135,751 possible opponent hands [S42].
- **Comparison with Scopone:** Di Palma's lower-bound Scopone tree is 1.03×10^23 nodes, with an EBF of 4.33 [S3]. A Cassino hand is longer (52 vs 36 plays) and building raises branching.

### 6.10 Robustness check with a stronger agent (PIMC)

**PIMC agent:** for each legal move, 8 sampled worlds × greedy rollouts to the end of the hand; choose the move with the best mean point differential (`pimc.py`) [S43]. I ran 2 × 300 self-play hands (seeds 101 and 202) and 2 × 100 duplicate decks against the heuristic (seeds 303 and 404).

| Metric (PIMC self-play, 600 hands) | Value [95% CI] |
|---|---|
| Dealer / non-dealer points per hand | 5.79 / 5.14 |
| Dealer − non-dealer | **+0.65** [+0.19, +1.10]; +0.60 excluding sweeps |
| P(dealer wins hand) / P(hand tied) | 54.8% / 3.3% |
| Sweeps per hand (dealer + non-dealer) | 0.103 + 0.055 = **0.158**; P(≥1 sweep) = 13.0% |
| P(cards tie 26–26) | 7.7% |
| Dealer takes residue | **77.2%** |
| Dealer aces per hand | 2.01 [1.92, 2.10] |

- **Strength:** PIMC with greedy rollouts is *weaker* than the one-ply heuristic. PIMC − heuristic = −2.05 [−2.50, −1.60] points per hand (200 decks, seats swapped); PIMC wins 32.3% of hands [S43]. The likely cause is that the greedy rollouts never build and trail naively, which biases PIMC's evaluations. Tartaluca21 report a similar ceiling for PIMC-style Scopa engines [S20].
- **What PIMC changes:**
  - It avoids leaving sweepable tables: 0.16 sweeps per hand against 0.69 for the heuristic.
  - It does not show the aces asymmetry: dealer aces 2.01 against 1.71 for the heuristic.
  - The dealer advantage reappears, carried by the residue (77%).
- **Bottom line:** whether the dealer or the non-dealer is better off in 2-player Cassino is **not settled** by these agents. Settling it needs a stronger agent, e.g. ISMCTS with heuristic playouts or CFR on an abstraction (see Gaps).
- **Policy-independent facts across all five policy sets:**
  - The dealer takes the residue 60–77% of the time.
  - The first-play sweep chance is about 1.4–1.5% (where measured).
  - Cards ties occur 4.5–7.7% of the time.

### 6.11 Exact combinatorics (all ORIGINAL COMPUTATION, `combinatorics.py`) [S42]

| Quantity | Value |
|---|---|
| Distinct Cassino deals per hand | 10^49.964 |
| Opponent hands possible at first decision | C(44,4) = 135,751 |
| P(4 Cassino table cards all of different rank) | 67.6% |
| Pasur: P(Jack among initial 4 pool cards → replace) | 28.1% |
| Scopa/Scopone: P(≥3 kings among 4 table cards) | 29/18,278 = 0.159% |
| Escoba: P(table sums to 15) / P(sums to 30) | 3.41% / 2.73% |
| Escoba: deck total mod 15 | 10, so the residue always sums to 10, 25, 40 … |
| Scopone-10: P(next player holds the led rank) for group size 1 / 2 / 3 / 4 | 146/203 / 49/87 / 1/3 / 0 (matches Favero [S19]) |

### 6.12 Caveats

- These are policy-conditional results, not equilibrium values. No agent here is near-optimal.
- The engine restricts captures to maximal sets and merges same-value builds. Permissive building variants listed by pagat [S23] were not modelled; nor were partnership play, 3- or 4-player games, Royal Cassino, Nordic Kasino scoring [S38] or "counting out".
- The heuristic's opponent sampling ignores the constraint that an opponent controlling a build must hold its capturing card. PIMC enforces it.

---

## 7. Implications for the video game (derived from the above)

- **Alternate the deal; do not hard-code a "dealer advantage" into the AI's beliefs.**
  - The per-hand seat effect is at most about ±1 point, and its sign depends on playing style.
  - Over a full game to 21 the first dealer's win rate is 48–49% under the tested policies (§6.3, §6.10).
  - The robust positional fact is the dealer's last-play/residue edge (60–77%). An AI should hold back a face card for the final play [S21][S23].
- **Difficulty tiers come almost for free:**
  - Random play loses about 99% of games.
  - Greedy play is a natural "beginner" level that humans can beat (compare Scopone humans: 47.6% wins against Greedy [S2]).
  - The look-ahead heuristic beats greedy 91% of the time.
  - Search-based AI (ISMCTS, or PIMC with good playouts) is the natural "expert" tier. My naive PIMC with greedy rollouts was weaker than the heuristic (§6.10).
  - Scopone research found ISMCTS harder for humans than expert rule bots [S2]. A Scopa hobby engine found little gain from more search than about 10 ms of PIMC [S20].
- **Expect frequent events:**
  - 0.16–0.86 sweeps per hand depending on style.
  - A 26–26 tie roughly every 13–22 hands.
  - The residue in every hand: about 3.3 cards on average under heuristic or greedy play, and about 8 under random play.
  - The scoring screen should state who took the last cards and why.
- **Partner-AI caution:** in team variants, strong bots can puzzle human partners [S2].

---

## 8. Gaps / leads not followed

- **Semantic Scholar** returned HTTP 429 for every query in this session, so citation-graph expansion (papers citing Di Palma & Lanzi or Baghal) was done only through OpenAlex, arXiv and the reference lists of fetched papers. Re-run later with an API key.
- **Google Scholar** was not queried directly; only general web search was used.
- **IEEE Xplore and ACM DL** full-text search was not run directly. The Scopone paper was found through arXiv and OpenAlex.
- **Theses not found** (absence not proven):
  - No Finnish thesis on Kasino in trepo.tuni.fi, helda.helsinki.fi or aaltodoc; these repositories were not searched individually, only via web search and Theseus.
  - No Scandinavian thesis in DiVA.
  - No Italian thesis on Scopa reinforcement learning (one web search, no hits).
- **Pratesi (1995)**, "Casino from Nowhere to Vaguely Everywhere", *The Playing-Card* XXIV(1):6–11, is the key historical source on spread and popularity. It was cited via pagat and Wikipedia but not fetched.
- **Two Scopone strategy books** may contain quantitative claims about the deck-team advantage: Saracino's (110 "advices") and Cicuti & Guardamagna's. Not fetched.
- **The Valet and CardStock repositories** contain plot images (score spread and lead history for Scopa and Escoba) with numbers that could be extracted with more work.
- **Pasur fair-value distribution** (Fig. 14 of Baghal) was not digitised.
- **Survey data:** no Finnish, Norwegian or Swedish survey of card-game popularity with Kasino figures was found. pagat's own monthly statistics for other months could be tracked over time.
- **Simulation extensions not done:**
  - 4-player partnership Cassino.
  - Royal and Nordic variants.
  - An ISMCTS agent.
  - Larger PIMC samples, and PIMC with heuristic rollouts (too slow in pure Python here).
  - A stronger agent to settle the sign of the dealer/non-dealer effect (§6.10).
  - Sensitivity of the seat effect to the card weights.

---

## Sources

- [S1] Search log, arXiv full-text search UI (arxiv.org/search) for "scopone", "scopa", "pasur", "cassino", "casino card", "briscola", "fishing card game", "basra", "kasino", "escoba". Fetched 2026-10-02. https://arxiv.org/search/?query=scopone&searchtype=all
- [S2] Di Palma, S. & Lanzi, P. L. "Traditional Wisdom and Monte Carlo Tree Search Face-to-Face in the Card Game Scopone." arXiv:1807.06813v1 (18 Jul 2018); *IEEE Transactions on Games* 10(3):317–332 (2018), DOI 10.1109/TG.2018.2834618. PDF https://arxiv.org/pdf/1807.06813 (pp. 1–15, Tables I–VIII).
- [S3] Di Palma, S. *Monte Carlo tree search algorithms applied to the card game Scopone.* Tesi di laurea magistrale, Politecnico di Milano (relatore P. L. Lanzi), 18 Dec 2014. https://www.politesi.polimi.it/handle/10589/102246 ; PDF https://www.politesi.polimi.it/retrieve/a81cb05b-1c24-616b-e053-1605fe0a889a/2014_12_DiPalma.pdf (Ch. 5, Tables 5.1–5.2, pp. 60–62).
- [S4] Świechowski, M., Godlewski, K., Sawicki, B. & Mańdziuk, J. "Monte Carlo Tree Search: A Review of Recent Modifications and Applications." arXiv:2103.04931; *Artificial Intelligence Review* (2022), DOI 10.1007/s10462-022-10228-y. https://arxiv.org/pdf/2103.04931
- [S5] Baghal, S. "Solving Pasur Using GPU-Accelerated Counterfactual Regret Minimization." arXiv:2508.06559v1 (6 Aug 2025). https://arxiv.org/abs/2508.06559 (Tables 1, 2, 15, 16; §3).
- [S6] Li, B. & Huang, L. "GPU-CFR: 80x Faster Counterfactual Regret Minimization by Compiling the Game to Static Dataflow and CUDA Graph Replay." arXiv:2609.11923 (Sept 2026). https://arxiv.org/pdf/2609.11923
- [S7] Li, B., Chen, Y. & Huang, L. "Correlated Chance Sampling for Monte Carlo Counterfactual Regret Minimization." arXiv:2607.27035 (July 2026). https://arxiv.org/pdf/2607.27035
- [S8] Goadrich, M., Morenville, A. & Piette, É. "Valet: A Standardized Testbed of Traditional Imperfect-Information Card Games." arXiv:2603.03252v1 (3 Mar 2026). https://arxiv.org/pdf/2603.03252 (Table 1; §§2–3).
- [S9] Niklaus, J., Alberti, M., Pondenkandath, V., Ingold, R. & Liwicki, M. "Survey of Artificial Intelligence for Card Games and Its Application to the Swiss Game Jass." arXiv:1906.04439 (2019), DOI 10.1109/SDS.2019.00-12. https://arxiv.org/pdf/1906.04439 (ref. [11]).
- [S10] Valet project site sources (GitHub mgoadric/valet): `_posts/2026-01-15-scopa.md` and `assets/games/Scopa2.rcy`. https://github.com/mgoadric/valet
- [S11] CardStock repository (GitHub mgoadric/cardstock): `CardStock/games/Escoba2.rcy`, `Scopa2.rcy`, `BustedJunk/Scopone4.rcy`, `Analysis/ChoicesScopa.png`, `Analysis/MScopaScores.png`. https://github.com/mgoadric/cardstock
- [S12] Bell, P. T., Martinez-Ortega, B. A. & Birkenfeld, A. "Organic Chemistry I Cassino: A Card Game for Learning Functional Group Transformations for First-Semester Students." *J. Chem. Educ.* (2020). DOI 10.1021/acs.jchemed.9b00995. Abstract via OpenAlex W3027393209.
- [S13] WildPino/scopa-master README (GitHub). https://github.com/WildPino/scopa-master
- [S14] DeLnlyMthrLvr/ScopaAI_ToM README (Alessandro Castoldi). https://github.com/DeLnlyMthrLvr/ScopaAI_ToM
- [S15] Barros Morales, R., Rodríguez Domínguez, L. de los Á. & Barros Bastidas, C. "El juego del cuarenta, una opción para la enseñanza de las matemáticas y las ciencias sociales en Ecuador." *Revista Universidad y Sociedad* 7(2):137–144 (2015). Record and abstract via OpenAlex W2203167364 (https://api.openalex.org/works/W2203167364).
- [S16] Gualli Ushiña, R. F. & Angamarca Pupiales, O. S. *Estudio de procedimientos y algoritmos para el reconocimiento automático de las cartas de un jugador de 40 no vidente.* Universidad Politécnica Salesiana, 2016. http://dspace.ups.edu.ec/handle/123456789/13371 (abstract via OpenAlex W2581111615).
- [S17] Luperto, M. et al. "Integrating Social Assistive Robots, IoT, Virtual Communities and Smart Objects to Assist at-Home Independently Living Elders: the MoveCare Project." *International Journal of Social Robotics* (2022), DOI 10.1007/s12369-021-00843-0. Full text PMC8853423: https://pmc.ncbi.nlm.nih.gov/articles/PMC8853423/
- [S18] Giacomelli, P. "Beyond the briscola advantage: a Monte Carlo dominance test for deterministic strategies in two-player Briscola Game." arXiv:2605.17043 (2026). https://arxiv.org/abs/2605.17043
- [S19] Favero, G. "Qual è la probabilità di fare scopa all'apertura delle carte?" vialattea.net, Chiedi all'esperto, 13/08/2003. https://www.vialattea.net/content/480/
- [S20] Tartaluca21/scopa-engine-ai, README and EMPIRICAL_FINDINGS.md (GitHub). https://github.com/Tartaluca21/scopa-engine-ai
- [S21] Foster, R. F. *Foster's Complete Hoyle* (New York, 1897), "Cassino", pp. 441–448. Internet Archive id `fosterscomplete00fostgoog`, https://archive.org/download/fosterscomplete00fostgoog/fosterscomplete00fostgoog_djvu.txt
- [S22] GitHub repository search API results and READMEs (queries: cassino card, kasino card, scopa ai, scopone, escoba card, basra card, cuarenta card, chkobba, tablanet, pasur), including PGHM/kasino, penkkaa1/Cassino, jooakar/scalassino, Nic98/Pasur-Trainer, joseduc10/cuarenta, assilrguez/Chkobba_AI, Binary-Team/Rachma-Android. https://api.github.com/search/repositories?q=cassino+card (fetched 2026-10-02).
- [S23] McLeod, J. "Casino – Card Game Rules." pagat.com, last updated 6 May 2026. https://www.pagat.com/fishing/casino.html
- [S24] McLeod, J. "pagat.com statistics" (Popular Game Pages; Difficulty, Popularity and Trend; Notes), last updated 1 Oct 2026. https://www.pagat.com/statistics/
- [S25] YouGov. "YouGov Survey: Card Games." Crosstabs, sample 1000 U.S. adult citizens, 10–12 May 2023. https://d3nkl3psvxxpe9.cloudfront.net/documents/crosstabs_Card_Games.pdf (Q4, p. 2).
- [S26] Google Books Ngram Viewer JSON API, queries fetched 2026-10-02, e.g. https://books.google.com/ngrams/json?content=cassino&year_start=1700&year_end=2019&corpus=en&smoothing=3 (plus en-US, en-GB, it, es corpora and phrase queries listed in §5.4).
- [S27] Wikimedia REST API, per-article monthly pageviews (user agents), 2016-01 to 2025-12, e.g. https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/Cassino_(card_game)/monthly/2016010100/2025123100 ; redirect resolution via https://en.wikipedia.org/w/api.php?action=query&titles=Basra_(card_game)|Xeri&redirects=1
- [S28] Wikipedia contributors. "Cassino (card game)." English Wikipedia, raw wikitext fetched 2026-10-02. https://en.wikipedia.org/w/index.php?title=Cassino_(card_game)&action=raw
- [S30] arXiv API queries (export.arxiv.org), fetched 2026-10-02, e.g. https://export.arxiv.org/api/query?search_query=all:cassino+AND+all:card
- [S31] OpenAlex works search API, fetched 2026-10-02, e.g. https://api.openalex.org/works?search=scopone
- [S32] CrossRef works API, fetched 2026-10-02, e.g. https://api.crossref.org/works?query.bibliographic=cassino%20card%20game
- [S33] Ludii: portal https://ludii.games/details.php?keyword=Scopa (no game page) and GitHub tree https://api.github.com/repos/Ludeme/Ludii/contents/Common/res/lud
- [S34] Web searches (site:diva-portal.org kasino kortspel; site:theseus.fi kasino korttipeli), 2026-10-02.
- [S35] Psellos. "Cassino Rules." https://psellos.com/cassino/rules.html (via WebFetch).
- [S36] rcantore/escoba15 README (GitHub). https://github.com/rcantore/escoba15
- [S37] dkmccandless/cassino README (GitHub). https://github.com/dkmccandless/cassino
- [S38] Thorium/Kasino README (GitHub). https://github.com/Thorium/Kasino
- [S40] ORIGINAL COMPUTATION: `research/sim/cassino_sim.py` + `research/sim/run_experiments.py` → `research/sim/results.json` (seed 20261002).
- [S41] ORIGINAL COMPUTATION: `research/sim/mechanism.py` → `research/sim/mechanism_heuristic.json` (seed 11, 4,000 hands), `mechanism_greedy.json` (seed 12, 10,000), `mechanism_random.json` (seed 13, 10,000).
- [S42] ORIGINAL COMPUTATION: `research/sim/combinatorics.py` → `research/sim/combinatorics_out.json`.
- [S43] ORIGINAL COMPUTATION: `research/sim/pimc.py` → `research/sim/pimc_self_*.json`, `research/sim/pimc_vs_heur_*.json`; invariant tests `research/sim/test_invariants.py`.
