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
## 2. History: from a London craze (1792) to Nordic cottages and South African townships

### 2.1 Before Cassino: the fishing family
- In "fishing" games a player plays a card from hand and captures matching table cards. McLeod defines the family as one where "Each player in turn plays a card. If it matches a card or cards in the layout, the played card and the matched cards are captured" [09-S1]. The family name was first used by Michael Dummett [09-S70].
- McLeod divides the family into three branches [09-S1]:
  - **Western layout games**, which capture by sum (Cassino, Scopa, Escoba, Basra, Pasur, Tablić).
  - **Single-pile games** (Pishti, Xeri).
  - **Oriental flip-from-stock games** (hanafuda, Go-Stop, Chinese Ten).
- The earliest European fishing game on record is English **Laugh and Lie Down**, named in 1522 and described by Francis Willughby c. 1665 [09-S69][09-S42].
  - Parlett calls it "the earliest known example of a European game of the Fishing family (Cassino, Scopa, etc), which may be of Chinese origin" [02-S34].
  - Its name comes from the rule that a player who can no longer capture lays down the hand, "whereupon the other players are supposed to laugh at you" [09-S69].
- Other early French and English fishing games:
  - French **Culbas** (1658) [09-S43] and **Papillon**, which appears in the *Académie des jeux* by 1730 [09-S41]. Papillon already had sum-capture: an ace, a four and a five "vous pouvez prendre … avec un seul dix" [you can take with a single ten] [09-S79].
  - The Yorkshire game **Snitch'ems**, printed in 1773 and 1797, captured by "making eights and tens" [02-S18][09-S73].
- Pratesi notes that the ancient members of the family typically scored only "the player having the greatest number of cards". Cassino's many special scoring cards mark it as a "more evolved member" [09-S70].

### 2.2 First records: London, 1792 — two rival rulebooks
- **Robert Long, *Short Rules for Playing the Game of Cassino* (London, 1792)** is the earliest known rulebook. Its title page spells the game "CASSINO" [11-V-S1].
- **Long's game:**
  - Deal: four cards each, plus four face up "upon the Board (the first Deal only)" [03-S1][11-V-S1].
  - Captures are made by "pairing or equalling any number of Pips" [03-S1].
  - Court cards can only pair [03-S1]. There is no building and no calling [03-S1].
  - Scoring: an 11-point game, "The Ten of Diamonds, which is Great Cassino, marks two Points: The Deuce of Spades, which is Little Cassino, marks one Point: The Majority of the Cards — three Points. The Majority of the Spades — one Point: and The Four Aces — one Point each", with "Six Points gained save the Lurch" [03-S1][11-V-S1].
- Clearing the board already scored in 1792. A player who takes all the table cards "clears the Board, and marks one Point in the Game as often as repeated" [11-V-S1]. This contradicts Pratesi's claim that the earliest rules gave no points for sweeps [11 §V2].
- Long describes a forerunner of the later "call". With a pair in hand and a third card of that rank on the board, a player "may (if he pleases) lay down one of them and wait his Turn". The cards are not protected: "the Adversary being at Liberty to take them if he can" [03-S1].
- A second 1792 text, ***Casino; a mock-heroic poem***, reprinted with an appendix of laws in 1793, spells the game "Casino". It attacks Long directly: "Mr. R. L. speaks of Three-handed Casino, (or CASSINO as he erroneously spells it,)" [11-V-S2].
  - The poem disputes Long's lurch: "Mr. R. L. declares the Lurch to be Six, whereas the Custom of the first Clubs and the first Circles in London will decide against him" [11-V-S2].
  - It also disputes Long's optional capture, saying opponents "may compel you (if they please) to take up the Pair" [11-V-S2].
  - It sets its own rules: "The Lurch is Five" [11-V-S2]. Three-handed play goes to fifteen with "Six Counters … necessary to score with" [11-V-S2].
  - It gives the earliest count-out ("seniority") order: "Great Casino … 1st … Little Casino 2d. The Cards 3d. Majority of Spades 4th. Ace of Spades 5th. Ace of Clubs 6th. Ace of Hearts 7th. Ace of Diamonds the last" [11-V-S2].
- So the spelling dispute is as old as the game itself. Long (1792) wrote "Cassino" and the poem (1792/93) wrote "Casino", calling Long's form an error [11 §V1].
  - Pagat's claim that "the earliest sources use the spelling Casino" [02-S1] is wrong about Long's own title [11 §V1].
  - Wikipedia's statement that "Cassino" is used in the earliest rules [01-S1] is correct [11 §V1].
- Pratesi documents a third early text, *Rules for Cassino*, dedicated to the Duchess of Marlborough (1795) [09-S70].
  - From these sources he concludes that "a craze for the game occurred in London in the early years of the 1790s" [09-S70].
  - The poem says that "the Knowledge of the Game is at this Time almost confined to the Circles of Fashion" [04-S21].
- The poem treats the counting cards as characters: "The Diamond-ten, the Great Casino nam'd, / Two Points demands, and chief in Rank is fam'd; / The Deuce of Spades, Casino's younger Brother" [04-S21]. It also makes a revolutionary-era pun on court cards that can only pair: "Casino is a Democrate; / And, like Tom Paine, exhorts all Subject Slaves, / 'First Kings and Queens dismiss, and then the Knaves'" [04-S21].

### 2.3 Hoyle and the Regency drawing room (1795–1840)
- Cassino first appears in a Hoyle-type compendium as an "ADDENDA" to *Pigott's New Hoyle* (1795) [03-S2]. It enters Charles Jones's *Hoyle's Games Improved* in 1796; the 1790 and 1791 Hoyles contain none [03-S5][03-S39].
- Jones's 1796 table lists "The Sweep or last Trick". In this period "sweep" still meant taking the leftover cards at the end [03-S5]. By 1800 the text reads "Besides a sweep before the end of the game, when a player can match all on the board, reckons 1" [03-S6].
- Two lines of text then dominated British and early American Hoyles for about eighty years. **Neither added building** [03 §0]:
  - Jones's Hoyle, continued through Bohn 1850/67 [03-S12].
  - Pigott's text, reprinted in New York (1823, 1830), Philadelphia (1857, 1869), Boston (1875) and London (1876) [03-S8][03-S9][03-S13][03-S17][03-S18].
- Cassino was a fixture of genteel evenings:
  - Austen's letter of 20 November 1800 describes "a whist and a casino table" [04-S19].
  - In *Sense and Sensibility* (1811) "Lady Middleton proposed a rubber of Casino" [04-S17].
  - In *Pride and Prejudice* (1813) Miss De Bourgh plays cassino at Rosings, where "Scarcely a syllable was uttered that did not relate to the game" [04-S16].
- Diaries and letters show the game spreading and how much was staked:
  - Canning "played cassino" (1793–95) [04-S47].
  - The Francis family played for "3d cassino" (1804) [04-S45].
  - T. B. Adams played it at the Prussian court in 1798 [04-S44].
  - Lady Nugent "played cassino till 12" in Jamaica (1801–05) [04-S46].
  - Martha Wilmot in Russia bought "a little box of Cassino Markers of tortoiseshell" in 1804 [04-S36].
- From 1806 to 1840 novels and magazines refer to "the cassino table" as a drawing-room institution, including "the insipid gravities of the cassino table" (1826) [04-S49].
- Dickens's young David Copperfield would "play casino with Mrs. Micawber" (1850) [04-S22].
- By the later nineteenth century, Pratesi finds English handbooks treating the game as "an old traditional game on the way to dying out" [04-S7].
  - Captain Crawley (1876) admits, "Of this game I, personally, know nothing" [02-S30].
  - Professor Hoffmann's *Hoyle's Games Modernized* (London, 1909) omits Cassino entirely [03-S30].

### 2.4 The Continent: a separate "Casino" lineage (1795–1829)
- Rules for "Casino" were printed in Vienna and Prague in 1795 [09-S70]. Pratesi reads the title order *Gesetzbuch der modernen Spiele Casino, Whist, Boston…* as "indicative of an actual fashion for the game" [04-S7].
- The German book of 1797 translates the 1793 poem's laws almost word for word. Examples [11 §V3]:
  - "Derjenige, der … den Tisch räumt, zähle für jedesmal unwiderruflich ein Point" (whoever clears the table scores one point, irrevocably, each time).
  - "dieses nennet man den Sweep, oder den Kehraus" (this is called the sweep, or the *Kehraus*).
  - "Der Lurch (Bredouille) oder doppelt gewonnenes Spiel ist Fünf" (the lurch, or doubly won game, is five).
- The same text, with the poem's Florentine etymology, the lurch of five and the count-out order for three players, reappears in Polish (Wrocław 1821) and Danish (1829) [10-S46][10-S36]. Note 11 infers from the textual match [11 §V3]:
  - Continental Casino descends from the poem's "Casino" tradition rather than from Long.
  - This may explain why German sources "invariably use the spelling 'Casino'" [01-S1].
- The German and Polish books even teach pronunciation: Sweep "wie Swiep", Lurch "wie Lordsch" [10-S41]; Polish "Świp", "Lordź" [10-S46].
- The 1810 Berlin *Spielalmanach* adds the high card values that define Nordic Kasino today [01-S83]:
  - a Queen "welche 12 gilt" (which counts 12);
  - an Ace taken "nach dem Werthe von 14" (at the value of 14);
  - Great Casino "nach ihrem Casino-Werthe von 16" (at its casino value of 16).

  An English writer reported in 1846 that "in some parts of Germany:— Great Cassino takes sixteen. Little Cassino—fifteen. Every Ace—fourteen. King—thirteen. Queen—twelve. Knave—eleven" [03-S11].
- In Sweden, *cassino* is attested as a card game from 1817 [10-S16]. The sweep word *tablerace* ("table rase") is attested from 1838 [10-S19].
- In Danish, *svippe* ("clear the table at kasino") is attested by 1852 [10-S35].
- Icelandic dictionaries of 1920–24 record *kasína* and *svippa* [10-S39].

### 2.5 America reinvents the game (1866–1950)
- Dick ("Trumps") first printed **building** in *The American Card Player* (entered 1866): "the dealer puts an ace upon it and says 'seven,' … This is called building up" [11-V-S4][03-S14].
- The 1864 date sometimes given for this is wrong [11 §V4]:
  - the preface to the fourth edition of the *American Hoyle* lists Cassino among games "added to the fourth edition" [11-V-S3];
  - that edition's preface is dated February 1867 [03-S15].
- The 1867 *American Hoyle* adds **calling** with spoken grammar. A build is announced in the singular ("'Nine' or 'Ten' — not 'Nines' or 'Tens'"), and a call in the plural ("'Fours,' not 'Four'") [03-S15].
- Pratesi reads the same book as showing how rare the old English game had become in America [04-S7]. The passage itself, though, says "The European game is the favorite with those who play merely for recreation, and is known as Set-back or Rounce Cassino" [11-V-S3][11 §V5]. Several OCR transcriptions misread this as "Bounce" [11 §V5].
- Variants multiplied in print:
  - **21-point play** with mid-hand claims (Townsend 1891; Dick 1894) [03-S20][03-S22].
  - **Court cards valued 11/12/13** as "An Interesting Variation… now very generally played" (1894) [03-S22]. Foster named this **Royal Cassino** in 1897 [03-S23].
  - **Spade Cassino**, pegged to 61 on a cribbage board (1897) [03-S23].
  - **Royal Draw Cassino** (1898) [03-S24].
  - **Diamond Casino** (Ostrow, 1945/49) [03-S35].
- Foster (1897) called Cassino the national game "typical" of America, alongside Skat for Germany and Piquet for France [03-S31]. He also said it was "one of the few games of cards that are unhesitatingly admitted to the domestic circle" [03-S31].
- American newspapers trace the game's social life:
  - Local crazes: "Cassino is all the rage in Mineral Point" (1878) [04-S102].
  - **Progressive cassino** parties with head and foot prizes (1889–1921) [04-S103][04-S106][04-S111].
  - Afternoon casino parties for older women in the 1930s [04-S157].
  - By 1951 "casino party" usually meant a mock gambling night instead [04-S157].
- The game's decline in America is attributed to the rise of rummy games. Scarne writes that it "was greatest in popularity prior to the advent of Gin Rummy" [04-S7]. Morehead (1944) says "In the average home Casino is known as a children's game, but among gamblers it is known as the finest two-handed game of skill" [02-S30].

### 2.6 The game today: where Cassino lives
- **Nordic countries.** Kasino is a living family and summer-cottage game.
  - Wikipedia pageviews from September 2025 to August 2026 were 79/day for Norwegian, 66/day for Finnish and 40/day for Danish. English, with a far larger readership, had 106/day [01-S63].
  - Every Nordic edition peaks in July [01-S63].
  - Finnish sources describe Kasino as "hyvin suosittu" (very popular) and suitable for children and adults alike [10-S1].
  - In 2024, 78.1% of Finns played card games at least sometimes [10-S3].
- **Southern Africa.** A 40-card "Khasino" with stealable capture piles is played in townships and has its own association (KASA) and online apps [02-S4][05-S81][06-S22]. A since-removed Wikipedia edit adds taverns, shebeens and prisons [01-S8].
  - The biggest growth among Cassino apps found is South African: "the most beloved card game from South African townships" [06-S58][06 §12.18].
- **Caribbean.** A Reddit user calls Royal Casino "the national card game of the dominican republic" [05-S95]. Pagat documents a "popular card game in Haiti" pronounced *cásino* [02-S3].
- **United States.** The game survives mainly through family memory: "My mom taught me this game almost 60 years ago, when I was learning arithmetic" [02-S57]. Several players also report learning it in prison [05-S100][06-S20].
- **Brazil.** The brief's premise does not hold. A 1996 Brazilian magazine introduced casino as "radicalmente diferente dos carteados mais populares no Brasil" (radically different from the card games most popular in Brazil) [10-S49]. Brazilians play the sum-to-15 **Escopa** instead, brought by Italian immigrants [09-S82].
- **Market signal.** Cassino's largest Android app has about 166,000 installs. WhatWapp's *Scopa* has about 12.3 million [06-S19][06-S40]. Board Game Arena added Cassino only in April 2025 [06-S31].

### 2.7 Origin claims by Wikipedia edition (from note 01)

| Edition | Claim | Sourcing |
|---|---|---|
| en (now) | English, first recorded 1792; Italian origin "often said, without substantiation"; "casino" then meant a summer house or villa | Parlett 2008; Pratesi 1995; Thompson 2015 [01-S1] |
| en (2006) | "probably descended from the Italian game Scopa" | unsourced [01-S10] |
| en (pre-2007) | "'Casino' is the official name … 'Cassino' is a common mis-spelling. Source: Official Hoyle Rulebook" | removed [01-S10] |
| de (2006–2022) | roots in **17th-century France** | removed 2022 [01-S16] |
| de (now) | England, end of the 18th century | Bermicourt citing Pratesi [01-S16] |
| ja (2007–2013) | **15th-century France**, as gambling; named after casinos; French pronunciation "kashino" | removed 2013 [01-S25] |
| ja (now) | resembles Scopa, but no positive evidence; oldest text late-18th-century London; casino (gambling house) is a 19th-century word | pagat [01-S24] |
| nb (now) | "stammer fra Italia" [comes from Italy], variant of Scopa | unsourced [01-S26] |
| hu (now) | origin in a **medieval Italian** game, scopa; popular in Hungary in the early 20th century | unsourced [01-S20] |
| fi (now) | first records in 18th-century England; believed related to Scopa | unsourced [01-S17] |
| sv (now) | "**av kinesiskt ursprung**" [of Chinese origin]; in Sweden since the early 1800s | general refs; likely derived from Torgny's claim about the *fishing mechanism* [01-S29, 01-S34] |
| sv (2016–21) | the word *kasino* is an Italian diminutive of *casa* | [01-S30] |
| it (now) | "gioco di carte inglese" [English card game] | Britannica, pagat [01-S23] |
| 1868 American Hoyle | "a card game of Italian origin" | primary source [01-S79] |
| cs Pasúr | "italská hra Cassino" [the Italian game Cassino] | unsourced [01-S62] |
| CardRules+ (cited by it) | Cassino is the "progenitore" [progenitor] of Scopa and Escoba | web page, unsupported [01-S70] |

- **Spelling** (the Long-vs-poem dispute is in §2.2 above; further details):
  - The archive.org scan of Long's title page reads "SHORT RULES FOR PLAYING THE GAME OF CASSINO", and the archive metadata gives "cassino" [01-S81]. Hoyle 1796 uses both: the running head "The Game of CASINO" and the text "GAME of CASSINO" [01-S82].
  - Bermicourt's 2022 talk comment ("Both spellings were used early on, but 'Casino' was first") conflicts with his own later article text [01-S2].
  - The nb title moved to "Kasino" as the Språkrådet spelling [01-S28].

---

## 3. The rules: a standard core and a large set of contested options

### 3.1 The modern Anglo-American core (Pagat's standard)
- **Players and deal:**
  - Casino is played by 2–4 players; four play as partners sitting opposite each other [02-S1].
  - It is "one of the few games which will deal out evenly to two, three, or four players" [02-S1].
  - Each player gets four cards and four go face up to the table. "Traditionally, the deal is in twos" [02-S1].
  - Later deals give four cards each and none to the table: "6 deals for 2 players, 4 deals for three players, 3 deals for 4 players" [02-S1].
  - "The dealer must announce "last" when dealing the last cards" [02-S1].
- **Capturing:**
  - A court card captures only a matching court card. "If the table contains more than one matching card only one may be captured" [02-S1].
  - A numeral card captures same-rank cards and any separate sets that sum to its rank. For example, an eight with A 2 3 5 6 8 on the table "could capture 8 6 2 5 3 or 8 5 2 A, but not all six cards" [02-S1].
- **Building:**
  - A build "must announce the capturing number (saying, for example, "building 5")", and the builder "must hold a numeral card which can later make the capture" [02-S1].
  - Builds are either **single** (e.g. 2+3 = 5) or **multiple** (e.g. 6-3 + 5-4 + 9 = 9) [02-S1].
  - A build must include the card just played [02-S1].
  - Builds can be "stolen" by anyone holding the announced rank [02-S1].
  - A single build can be raised with a hand card. "The capturing number of a multiple build can never be changed" [02-S1].
  - "you are never allowed to break up or rearrange the cards that are already in the build" [02-S1].
- **Trailing:**
  - "You are allowed to trail a card even if that card could have made a capture" [02-S1].
  - The one exception: a player who was the last to add to a build on the table may not trail [02-S1].
- **End of the deal:** at the end, the last capturer takes the remaining table cards, which "are sometimes known as the residue" [02-S1].
- **Scoring:**
  - Eleven points per hand: Most Cards 3, Most Spades 1, each Ace 1, ♦10 ("Big Casino or the Good Ten") 2, ♠2 ("Little Casino or the Good Two") 1 [02-S1].
  - Ties on cards or spades score nothing, and the game is played to 21 [02-S1].
  - Sweep points are listed as a common variant: "Many people play that a Sweep is worth one point… Some players call this a clear" [02-S1].
- **The 11-point checksum.** Foster notes that "the total number of points to be made in each hand, exclusive of sweeps, is eleven, and the total of the claims made must agree with that number" [03-S31]. This is a built-in error check that one shipped app's scoring bug would have failed: "Sometimes the final total is greater than 11 (combined) per round" [06-S20][06 §5].

### 3.2 Options matrix (for the game's rules menu)
The table below is reproduced from research note 02 (33 rows, each alternative attested), followed by additional rows found by the other notes and the verification pass.

| # | Rule / option | Default (classic) | Attested alternatives (source) |
|---|---|---|---|
| 1 | Players / partnerships | 2; 3–4 solo; 4 as 2v2 [02-S1] | 5 players: remove 2♥2♦2♣, 5 cards last deal [02-S37][02-S39]; up to 6 (Dick 1867) [02-S36]; California 2,3,4,6 [02-S37] |
| 2 | Direction | Clockwise [02-S1] | Counter-clockwise: Dominican, Swazi, Diloti 4p [02-S3][02-S4][02-S9] |
| 3 | Deal pattern | 4 each + 4 table, in twos [02-S1][02-S31] | Singly (Dick 1867; "some players") [02-S36][02-S1]; 3-card deals (Diamond, Hungarian) [02-S30][02-S3]; Draw Cassino refill after each play [02-S31][02-S32]; Suipi 8-card hands [02-S39]; Swazi: all cards dealt, 4 cut to table [02-S4] |
| 4 | "Last" announcement | Dealer says "last" [02-S1] | "cards" [02-S37]; "sistan"/"båt" [02-S5]; sound cue in software [02-S47] |
| 5 | Court-card values | No numeric value; pair only [02-S1] | Royal: J11 Q12 K13 [02-S3][02-S31][02-S32]; USPCC 11/12-spot packs: J13 Q14 K15 [02-S32]; Zwicker dual values [02-S8] |
| 6 | Ace value | 1 [02-S1] | 1 or 14 (Royal) [02-S3][02-S32]; 14 in hand/1 on table (Finnish, Krypkasino) [02-S5][02-S6]; "sometimes... 14 each" [02-S31] |
| 7 | Cassino dual values | none | 2♠ = 2/15, 10♦ = 10/16 (Finnish; German 1810; Mulle; BGG house rule; Reddit "kasino kryp") [02-S5][02-S36][02-S54][02-S56][02-S63]; Buckeye: 10♦ = 10/11 [02-S37] |
| 8 | Pairing court cards | Take only one matching court card [02-S1][02-S47][02-S41] | Take all matching (Britannica/Parlett; Foster; Denexa; California) [02-S33][02-S31][02-S40][02-S37]; take one or three (never two) [02-S39]; Royal: any number [02-S39] |
| 9 | Pairing numerals | Take all same-rank cards + any disjoint sums [02-S1][02-S32] | Scopa-style "single match beats sum" (Scopa/Escoba family) [02-S10][02-S12]; BGG reviewer: capture card ≥ each captured card [02-S57] |
| 10 | Forced capture | Not compulsory; may trail a capturing card [02-S1][02-S47] | Must capture with a capturing card if played (Scopa/Escoba/Basra) [02-S10][02-S12][02-S15]; may not trail a card that could capture (Denexa) [02-S40]; must take matching loose cards (Dominican) [02-S3]; misère forms force full capture [02-S6][02-S53] |
| 11 | Build must include a hand card | Yes [02-S1] | Table-only builds allowed: pagat variant, Swazi [02-S1][02-S4]; BGG "What's on the table is always fair game" [02-S59] |
| 12 | Must hold capturing card | Yes [02-S1][02-S31][02-S32] | Penalty −5 if violated (Finnish) [02-S53]; build broken & opponents retract [02-S31][02-S32]; Michigan −2 [02-S37]; old Zwicker: not required [02-S8] |
| 13 | Announce build value aloud | Required ("building 5") [02-S1] | Required with penalty: unnamed builds may be separated by others [02-S32]; optional (Diloti, Seres) [02-S9][02-S53] |
| 14 | Single build raise by hand card | Yes, any player [02-S1][02-S31] | Only opponent's build (Dominican, Swazi, Diloti) [02-S3][02-S4][02-S9]; not in succession, alternately (Dick 1867) [02-S36]; own raise OK only holding both cards [02-S32] |
| 15 | Table cards in raising a single build | No [02-S1][02-S31][02-S32][02-S63] | Yes if hand card also contributes (pagat variant) [02-S1]; Cats at Cards allows [02-S39] |
| 16 | Multiple (double/"natural") builds | Allowed; value fixed [02-S1][02-S31] | Called "calling" in USPCC/Dick/playingcarddecks [02-S32][02-S36][02-S43]; group/"family"/"soy" (Diloti) [02-S9]; "protected" if topped with same rank [02-S61] |
| 17 | Build counts as a card for combos/extension | No [02-S1][02-S59] | Yes (pagat variant; Dick 1867; Wikipedia 2019) [02-S1][02-S36][02-S37]; Diloti variant [02-S9] |
| 18 | Multiple builds of same value at once | Not addressed by pagat; BGG players say legal [02-S58] | Forbidden: Swazi, *Cassino!* iOS, Wikipedia Variant 3; BGA enforces [02-S4][02-S58][02-S37] |
| 19 | Several builds by one player | Allowed (second build) [02-S1][02-S31][02-S32] | Swazi 2p first half: max one build [02-S4] |
| 20 | Owner may trail | No [02-S1][02-S31][02-S47] | Yes (pagat variant; Swazi; South Africa 2nd phase) [02-S1][02-S4]; Variant 2 must take/add next turn [02-S37] |
| 21 | Build for partner | Not part of pagat core rules (listed only as a variant) [02-S1]; explicitly forbidden by Cats at Cards [02-S39] | Allowed: Foster, USPCC, pagat variant ("building 9 for partner"), Zwicker [02-S31][02-S32][02-S1][02-S8]; only when provable (Dominican var., Swazi) [02-S3][02-S4] |
| 22 | Building with court cards | Never [02-S59][02-S61] | Royal yes [02-S3]; "Trailing-royals" natural building [02-S37] |
| 23 | Sweeps | Variant in pagat; standard in Foster/USPCC/Britannica (1 pt) [02-S1][02-S31][02-S32][02-S33] | None (Royal per many; California; Swazi) [02-S3][02-S37][02-S4]; cancel between sides [02-S31][02-S3][02-S5]; not when ≥18/≥10 pts [02-S3][02-S5]; not in last deal [02-S5]; 2 pts (Michigan) [02-S37]; first-turn sweep 2 pts (Hungarian) [02-S3] |
| 24 | Last-card sweep | Counts only if a genuine full capture [02-S1][02-S31] | Never (Scopa) [02-S10]; never after last deal (Finnish) [02-S5] |
| 25 | Residue (cards left) | To last capturer, not a sweep [02-S1][02-S31] | +1 point "sistan" (Swedish) [02-S5]; 2 for cards + 1 last capture [02-S1]; keep a court card back to win them (Long 1792 advice, not a rule) [03-S1]; nobody (Haitian, Cuarenta) [02-S39][02-S13]; dealer's team (Tablić) [02-S17] |
| 26 | Points: cards / spades | 3 / 1 [02-S1][02-S31] | 2 / 2 (Wippen; Swazi split ties; family) [02-S1][02-S4][02-S61]; 1 / 2 (Swedish/Finnish) [02-S5]; 1 (CT/NY) [02-S1]; ≥5 spades =1 (S. Africa) [02-S4]; Överspader (1 per spade over 6) [02-S5]; thresholds 27+/7+ [02-S45][02-S60]; bonus per card >35 / spade >10 [02-S61] |
| 27 | Points: 10♦ / 2♠ / aces | 2 / 1 / 1 each [02-S1] | 3 / 2 (CT/NY) [02-S1]; Spade Cassino every spade 1, J♠ +1 (24 total, to 61) [02-S1][02-S31][02-S32] |
| 28 | Ties for cards/spades | Nobody scores [02-S1] | Split 1–1 (Swazi) [02-S4]; postponed to next round (Finnish) [02-S53]; most spades breaks a 26–26 (Portuguese) [02-S37] |
| 29 | Target | 21 [02-S1][02-S32][02-S33] | 11 (difference scoring; lurch <6 doubles) [02-S1][02-S31][02-S36]; each deal a game [02-S31][02-S32]; 16 (Nordic) [02-S5]; 50 [02-S1]; 61 (Spade) [02-S31]; 6 (Royal, wiki) [02-S37]; best-of-7 [02-S61] |
| 30 | Near-target restrictions | None [02-S3] | Dominican 18/19/20 (or Soto from 16) [02-S3] |
| 31 | Count-out / claim | Optional [02-S1] | Claim mid-hand, wrong claim loses (Foster; Dick 1880; Cats) [02-S31][02-S36][02-S39]; order cards, spades, big, little, aces ♠♣♥♦, sweeps [02-S31][02-S32][02-S1] |
| 32 | Skunk / all 11 | — | +1 point, or instant win [02-S37] |
| 33 | Extra play modes | — | Draw, Royal Draw (fail to draw → draw two) [02-S32]; Pluck [02-S37][02-S39]; misère (Krypkasino, Misäärikasino, Lazy/Laisto, Give-away) [02-S6][02-S53][02-S61][02-S30]; capture-pile stealing (Swazi, Steal Pile) [02-S4][02-S61]; solo vs automaton [02-S61] |
| 34 | Lurch (double game) | — (modern) | 1792 Long: "Six Points gained save the Lurch" [11-V-S1]; 1793 poem/German 1797/Danish 1829: lurch is **five** [11-V-S2][11-V-S6][10-S36]; 3-handed lurch 7 (poem) [11-V-S2]; 1952 USPCC: 11 in two deals doubled, in one deal ×4 [03-S36] |
| 35 | Compulsory capture (historical) | Optional (Long 1792) [03-S1] | Opponents "may compel you" to take up a pair (1793 poem) [11-V-S2] |
| 36 | Count-out precedence | Cards, spades, Big, Little, aces ♠♣♥♦, sweeps (Foster) [03-S31] | Great Casino, Little Casino, Cards, Spades, aces ♠♣♥♦ (1793) [11-V-S2]; points first, then cards, then spades (Finnish) [10-S1]; "no one point has precedence" (*NY Clipper*, 1883/1890) [04-S131][04-S167]; "Cards and spades go out first, of course" (Jack London, 1912) [04-S28] |
| 37 | Dual hand/table values | None | Nordic: A 14/1, ♠2 15/2, ♦10 16/10 from hand vs. table [10-S1][10-S32]; Swedish: player's *choice* each time [10-S24]; first in print 1810 (Berlin) [01-S83] |
| 38 | Special clearing card | None | Danish: "Spar 5 rydder bordet" (♠5 clears the table) [10-S37][01-S11] |
| 39 | Multi-card hand plays | One hand card per turn | Hungarian Kaszinó: several hand cards vs. several table cards, equal sums ≤ 13 [01-S20][01-S73] |
| 40 | After a sweep | Next player plays normally (must trail onto an empty table) | Hungarian: opponent trails, then **moves again** [01-S20]; German: "eine Karte für den Tisch bringen" [01-S14] |
| 41 | Sweep cancellation and freezes | No cancellation [02-S3] | Opposing sweeps cancel (Dick 1894; Foster; Dominican; Finnish *mökki kaatuu*; Danish) [03-S22][03-S31][02-S3][10-S1][10-S37]; no sweep in the last deal [10-S1]; none once anyone has ≥10 [02-S5]; only the first *mökki* per hand counts (house rule) [10-S1]; sweeps under "Sweep freeze" in software [06-S60] |
| 42 | Tied majorities | Nobody scores [02-S1] | Finnish carry-over ("jää pakkaan"): cards tie → next deal's cards point worth 2, 3…; spades 4, 6… [01-S17][10-S1]; Russian *Скопа* 26–26 → 1 each [01-S58] |
| 43 | Exceeding the target | Highest score wins [02-S1] | Danish: "den der er tættere på 21 der vinder" (whoever is closer to 21 wins) [01-S11]; Finnish exact-16 variant (17 → 15, 18 → 14) [01-S17] |
| 44 | Claiming / challenge calls | Claim 21; wrong claim loses [03-S31] | Hungarian "Ausz!" / "Kint vagyok!"; challenge "Fals!" (wrong capture → challenger +2; correct → capturer +1) [01-S20]; Pasur "per shodam" [02-S14]; Scopa "chiamarsi fuori" [02-S10] |
| 45 | Point weights (regional) | 3/1/2/1/1 [02-S1] | Icelandic family: ♦10 **5**, ♠2 **2**, last trick 1 [10-S40]; Swazi cards 2, spades 2 [02-S4]; Finnish 1/2 for cards/spades [10-S1]; Russian *Скопа*: cards 2, clubs 1, 2♣ 1, ♦10 1, no aces [01-S58] |
| 46 | Last round played open | Hidden | Hungarian: eighth draw played "nyitott lapokkal" (with open cards) [01-S20] |
| 47 | Opening layout restrictions | Any | Norwegian: point cards on the table replaced [01-S26]; Swazi: re-cut if ≥3 points or ≥3 pictures [02-S4]; Scopa: redeal if 3+ kings [02-S10] |

### 3.3 The contested questions, ranked by how much players fight about them
- **Can you raise your own build?** Sources contradict each other:
  - **No:** Dick 1866; USPCC 1898; Standard Hoyle 1904 [03-S14][03-S24][03-S25].
  - **Yes**, if you hold cards for both builds: Foster, who calls the opposite view "a common error … manifestly unfair" [03-S31]; also 1907, 1929, 1949, 1952 [03-S28][03-S33][03-S35][03-S36].
  - Today Dominican and Swazi rules forbid it, while Pagat allows it [02-S3][02-S4][02-S1].
- **Can two builds of the same value coexist?** Board Game Arena blocks one such move. A veteran BGG poster objects: "I've played for more than 60 years with dozens of other players, and never encountered anyone who thought it should not be allowed" [02-S58]. The iOS *Cassino!* forbids it [02-S58]. An unsourced Norwegian edit makes the same point more heatedly: "Det er lov til å bygge flere bygg samtidig. Sier man noe annet er man en DUST og dårlig taper!!!" (It's allowed to have several builds at once; anyone who says otherwise is an IDIOT and a sore loser!!!) [01-S28].
- **Does a face card take one or all matching face cards?**
  - One: Pagat and USPCC 1952 [02-S1][03-S36].
  - All: Foster, Britannica/Parlett, Denexa [02-S31][02-S33][02-S40].
  - One or three, never two: Cats at Cards; Ostrow 1949 [02-S39][03-S35].
  - Foster's rationale for restraint: "It is considered bad policy to take in three court cards, as it stops all sweeps when the fourth appears" [03-S31].
- **Are sweeps scored?**
  - "Sweeps are not part of the regular rules. They are a variant and we play with them every single time. Why wouldn't you??" vs. "there is virtually no skill in getting a sweep" (BGG, 2017) [05-S74-BGG1893693].
  - "It is not general to-day to count sweeps; but sweeps should be scored, as there is fine play made in the scoring of them" (1904) [03-S25].
  - Jack London's characters settle the question before the deal: "Do you count sweeps?" / "Certainly not … That's a sissy game" [04-S28].
- **Must you capture if you can?** Pagat: no [02-S1]. Denexa: "A player may not simply trail if they are able to capture something with that card" [02-S40]. Scopa, Escoba and Basra make it compulsory [02-S10][02-S12][02-S15].
- **Design implication:** reviews of shipped Cassino apps show that players want their household rules available:
  - "never heard of sweep so that gets turned off" [06-S19]
  - "Real casino players don't play identical card building" [06-S19]
  - "We want the kasi cassino where the ace is a 14" [06-S22]

  Successful apps therefore ship a "variation builder" or regional presets [06-S27][06-S25].
## 4. Variants and the wider fishing family

### 4.1 Named Cassino variants
- **Classic English (1792):** no building; court cards pair only; 11-point difference scoring with a lurch [11-V-S1][03-S1]. The Americans later called it "Set-back or Rounce Cassino" [11 §V5].
- **American (1866–67):** adds building, calling and spoken announcements; each deal counts as a game. Building is printed from 1866 [03-S14], the deal-as-game scoring from 1867 [03-S15].
- **Twenty-one-point:**
  - Points are scored as made, and a correct claim wins "even if his adversary has 21 or more" [03-S31].
  - "If he is mistaken, and cannot show out, he loses the game" [03-S31].
  - If neither player claims and both are out, play continues to 32, then 43, "eleven points more each time" [09-S76].
- **Royal Cassino:**
  - J/Q/K = 11/12/13 [03-S31]. The ace is "14 or 1 at the option of the holder; but if it is one of the cards lying on the table, it is always 1" [03-S28].
  - In 1898 the USPC suggested using 60-card poker packs with 11- and 12-spot cards, making "the jacks thirteens, the queens fourteens, the kings fifteens, and the aces ones or sixteens" [03-S24].
  - In 1905 the joker was valued at 15 [03-S27].
- **Spade Cassino:** "every spade counts one point … The spade Jack counts one in addition" [09-S76]. That makes 24 points per hand, pegged on a cribbage board to 61 [03-S23][11 §V7].
- **Draw / Royal Draw Cassino:**
  - Players refill their hand to four from a stock "left on the table, face down, slightly spread" [03-S29].
  - "If a player fails to draw in proper turn … he must draw two cards" [03-S33].
  - Swedish *dragkasino* and Finnish *pakkakasino* are the same idea [10-S24][10-S1].
- **Diamond Casino (Ostrow 1945/49):**
  - 40 cards, three each, four to the table [03-S35].
  - Scoring: most cards, most diamonds and the 7♦ score 1 each; all four 7s, 6s or aces score 2 [03-S35].
- **Give-away Casino and Nordic misère forms** (*Krypkasino*, *Laistokasino*, *Smyg*) [02-S30][02-S6][10-S1][01-S26]:
  - Krypkasino counts a forced sweep "+5 to taker, −5 to the player who set it up" [02-S6].
  - Players customarily warn about a sweep they are leaving open: "tabbe på 9" (sweep for a nine) [02-S6].
- **Nordic Kasino (SE/FI/NO/DK/IS):** Royal values; ♦10, ♠2 and aces worth more from the hand; usually no building; sweeps (*tabbe*, *mökki*, *svupper*) that often cancel; game to 16 or 21 [10 §1][10 §17]. Byggkasino is the Swedish building version, scoring cards 3 and spades 1, to 21 [10-S25].
- **Mulle (two decks):**
  - Capturing a card's identical twin (same rank and suit) scores a *mulle* [10-S26].
  - It is associated with prison: Glimne calls it "kåkfararvarianten av kasino" (the jailbird variant of kasino) [01-S72].
  - A Kumla informant says: "Vet man inte vad mulle är efter en vistelse på t.ex. Kumla – har man inte 'suttit inne'!" (If you don't know what mulle is after a stay at Kumla, you haven't 'done time'!) [10-S27].
- **Hungarian Kaszinó:** three-card deals; multi-card hand combinations up to 13; a double move after a sweep; open last round; "Ausz!" to go out at 11 [01-S20][01-S73].
- **African Casino (Swazi, Sotho, South African):**
  - Capture piles are face up, and their top cards can be used in builds [02-S4].
  - Builds have owners [02-S4].
  - Playing a card that could have captured into a build instead is "drifting" [02-S4].
  - The South African form uses 40 cards [02-S4].
- **Dominican Royal Casino:** counter-clockwise play; compulsory capture of equal loose cards; sweep cancellation; and endgame restrictions. "at 18 can only win by most cards; at 19 only by 10♦; at 20 only by most spades" [02-S3].
- **Belgian/Dutch Wippen:**
  - Scoring: cards 2, spades 2, sweep ("wip") 1 [02-S1].
  - The Dutch article teaches it as a ladder: pairing, then summing, then building, then raising, then double builds [09-S61].
  - "In manchen Gegenden Belgiens 'wippt' der Spieler bei einer Wippe wirklich auf seinem Platz (steht kurz auf und setzt sich wieder)" (In some parts of Belgium the player literally "wips" in their seat at a Wippe, standing up briefly and sitting down again) [01-S60].
- **Zwicker (Schleswig-Holstein):**
  - Jokers worth 15/20/25 [02-S8].
  - Builds can go by subtraction as well as addition [02-S8].
  - The sweep is the "Zwick" ("equivalent to the English 'tweak'") [02-S8].
- **Stealing Bundles (children's game):** "you can steal your opponent's bundle if you can match its top card" [03-S36]. The 1952 USPCC recommends it as a first step, then "full-fledged Royal Cassino—no happier introduction to arithmetic was ever devised!" [03-S36].
- **Folk variants found only in Wikipedia history** (unverified elsewhere) [01-S5][01-S6][01-S7][01-S9][02-S37]:
  - Pluck, California, Portuguese, Buckeye, Michigan and Florida Cassino;
  - "orphan" face cards;
  - the "skunk".

### 4.2 Comparison matrix across the family

Abbreviations: Σ+ = sum to the played card; "+15/+11/+10/+8,10" = played card plus captured set = N; B = building; ΣΣ = multiple sets per capture; P = pairing; 1-of = capture a single card or set; Flip = turn up from stock; Seq = sequence; Pile = single-pile.

| Game | Region | Deck | Pl. | Deal (hand/table; re-deal) | Capture | B | Special-power cards | Sweep | Main scoring items | Target | Src |
|---|---|---|---|---|---|---|---|---|---|---|---|
| English Cassino (1790s) | England | 52 | 2–4 | 4/4; 4s | P, Σ+ (courts P only) | no | — | 1 (Pigott) | cards 3, ♦10 2, ♠2 1, spades 1, A×4 | 11 (diff.), lurch <6 | [09-S72][09-S40] |
| American Cassino | USA | 52 | 2–6 | 4/4; 4s | P, ΣΣ, call | yes | — | 1 | as above | per deal | [09-S75] |
| Modern Casino | Anglo-Am. | 52 | 2–4 | 4/4; 4s | P (courts), ΣΣ | yes | — | opt. 1 | 11 pts | 21 | [09-S2] |
| Royal Casino | Anglo-Am. | 52 | 2–4 | 4/4 | ΣΣ, J11 Q12 K13 A1/14 | yes | — | opt. | 11 pts | 21 | [09-S3][09-S76] |
| Spade Casino | USA | 52 | 2–4 | 4/4 | as Casino | yes | — | 1 | every ♠ 1, ♠J +1 = 24 | 61 (cribbage) | [09-S76] |
| Draw Casino | USA/SE/FI | 52 | 2 | 4/4 then draw 1 | as Casino/Royal | yes/no | — | — | as base | as base | [09-S77][09-S62][09-S63] |
| Diamond Casino | USA | 40 | 2–4 | 3/4 | Scopa-like | — | — | 1 | cards, ♦ maj., ♦7 1; four 7s/6s/As 2 | 11 | [09-S70][09-S40] |
| Dominican Casino | DR | 52 | 2–4 | 4/4 | ΣΣ, A1/14, compulsory if equal loose card | yes | — | 1, cancel | 11 pts | 21 + endgame restrictions | [09-S3] |
| Hungarian Kaszinó | HU/AT | 52 | 2 | 3/4 | **multi-card from hand** | no | — | 1 (2 if first play) | 11 pts | 11 | [09-S3] |
| Swedish Kasino | SE | 52 | 2–4 | 4/4 | ΣΣ, Royal, optional | no | — | *tabbe* 1 | spades 2, cards 1, A, ♦10 2, ♠2 1, *sistan* 1 | 16 | [09-S4] |
| Finnish Kasino | FI | 52 | 2–4 | 4/4 | ΣΣ; **hand A14 ♠2=15 ♦10=16** | var. | — | *mökki* 1, cancel | 10 pts, rollovers | 16 | [09-S4][09-S63] |
| Danish Kasino | DK | 52 | 2–4 | 4/4 | ΣΣ, dual values; opt. ± × ÷ | yes | **♠5 clears** | *svupper* 1 | + *sidsten* 1 | 21 | [09-S65] |
| Mulle | SE | 104 | 2–4 | 5/5 or 4/8 | as Kasino | — | — | 1 | **mulle** 5 or capture value | — | [09-S4] |
| Krypkasino | SE | 104 | 2–6 | varies | as Kasino; avoid points | — | — | **+5/−5** | 42 penalty pts | low wins | [09-S6] |
| Swazi Casino | Eswatini | 52 | 2–4 | all dealt (12/12 for 2) | ΣΣ; **steal top of opp. pile into builds** | yes | — | none | cards 2, spades 2, ♠2 1, ♦10 2, A | — | [09-S5] |
| Zwicker | Schleswig-H. | 52+3–6 jokers | 4 (2–6) | 4/3; 4s | ΣΣ; courts dual (A1/11…K4/14) | **add or subtract** | jokers 15–30 | Zwick 1 | jokers 5–7, ♦10 3, ♠10, ♠2, A, cards 3 | series | [09-S7] |
| Tuxedo | USA | 40 Rook | 2–6 | 4/4 | Casino | yes | — | 10/5 | cards 15, "orange" 10, 5s 5 | 100 | [09-S3] |
| Stealing Bundles | Anglo/Arg./It | 52/40 | 2–4 | 4/4 | P only | no | — | — | **steal whole bundle** | most cards | [09-S8] |
| Wippen | BE/NL | 52 (104) | 2–6 | 4/4 | P → Σ → B (graded) | opt. | — | *wip* 1 | cards 2, spades 2, ♦10 2, ♠2 1, A | agreed | [09-S61][09-S2] |
| Scopa | Italy | 40 | 2(–6) | 3/4; 3s | 1-of; single>set; compulsory | (cascina var.) | (Ace in var.) | scopa 1 | cards, coins, settebello, primiera | 11 | [09-S9][09-S54] |
| Scopone | Italy | 40 | 4 | 9/4 or 10/0 | 1-of | no | — | 1 | 4 + scope | 11 (21) | [09-S10] |
| Cirulla | Liguria | 40 Fr | 4 (2–3) | 3/4 | match, Σ, **+15**, **Ace all** | no | ♥7 wild for bonuses | 1 | grande 5, piccola ≤6, bonuses 3/10 | 51 | [09-S11] |
| Cicera | Brescia | 52 It | 4 | 12/4 | 1-of, optional | no | — | scùa 1, **picada** 1 | cards 2, swords, mata, etc. | — | [09-S12] |
| Escoba | Spain/S.Am. | 40 Sp | 2–4 | 3/4 | **+15** | no | — | 1 (deal 15/30) | cartas, oros, 7 de velo, setenta | 21 | [09-S13] |
| Escopa/Escova | Brazil/Portugal | 40 | 2–4 | 3/4 | +15 | no | — | 1 | + all 7s; **end-sum checksum** | 21/31 | [09-S82][09-S66][09-S49] |
| Chorizo/Báciga | Uruguay | 40 Sp | 2–4 | 3/4 | +15 | no | — | 1 | **hand declarations** (Chorizo 20) | 21 | [09-S14] |
| Chkobba | Tunisia/Fr | 40 Fr | 2/4 | 3/4 | 1-of, compulsory | no | — | 1 | kārṭa, dīnārī, barmīla, ♦7 | 21 | [09-S9][09-S68] |
| Cuarenta | Ecuador | 40 | 2/4 | 5/0 | P, Σ (numerals), **Seq** | no | — | limpia 2 | **caída 2**, ronda 4, card count | 40 | [09-S15] |
| Ronda | Morocco | 40 Sp | 2–4 | 3/4 | P + **Seq** | no | — | missa 1 | caída 1, ronda/tringa, cards >20 | 41 | [09-S25] |
| Tablić | Balkans | 52 | 2/4 | 6/4 | ΣΣ, K14 Q13 J12 A1/11 | no | — | tabla 1 | A K Q J 10 1, ♦10 2, ♣2 1, cards 3 | 101 | [09-S16] |
| Basra | Middle East | 52 | 2/4 | 4/4 | P, Σ (numerals) | no | **J all, ♦7 all** | **10** | cards 30, J/A 1, ♣2 2, ♦10 3 | 101 | [09-S18] |
| Pâsur | Iran | 52 | 2–4 | 4/4 | **+11**; J all | no | J | **Sur 5**, cancel | 7 clubs 7, A/J 1, ♣2 2, ♦10 3 | 62 | [09-S19] |
| Kontsina | Greece | 52 | 2 | 4/4 | 1-of | no | — | — | cards 2, clubs 1, good 2, good 10 | rounds | [09-S20] |
| Diloti | Greece | 52 | 2/4 | 6/4 | ΣΣ + **declarations** | yes | — | xeri 10 | cards 4, A, good 10 2, good 2 | 61 | [09-S21] |
| Xeri | Greece | 52 | 2/4 | 6/4 pile | **Pile**; J takes | no | J | xeri 10/20 | A K Q J 10 1 etc. | rounds/151 | [09-S22] |
| Pişti | Turkey | 52 | 4 (2) | 4/4 pile | Pile; J takes | no | J | pişti 10/20 | J, A, ♣2 2, ♦10 3, cards 3 | 151 | [09-S23] |
| Seep | N. India/Pak. | 52 | 4 | bid, then all | ΣΣ, houses ≥9 | **houses** | — | **50** | spades by value, ♦10 6 (=100) | 100 lead | [09-S24] |
| Laugh & Lie Down | England | 52 | 5 | 8/12 | pairs only | no | — | — | cards vs 8 | chips | [09-S42][09-S69] |
| Culbas | France | 52/32 | 3–8 | 5/8 | pairs only | no | — | — | shedding | pool | [09-S43] |
| Papillon | France | 52 | 3–4 | 3/7 (3p) | P, Σ (courts/10s P) | no | — | sauterelle 1 | aces, feats, *papillon* takes pool | rounds | [09-S41][09-S79] |
| Snitch'ems | Yorkshire | 52 | 2 | 3/4 | P/prials, **+8 / +10** | no | — | — | majority of cards | 1 deal | [09-S27][09-S73] |
| Hachi-Hachi | Japan | 48 hanafuda | 3 active | — | **Flip**, month match | no | — | — | 264 total, par 88, yaku | money | [09-S37] |
| Koi-Koi | Japan | 48 | 2 | 8/8 | Flip | no | — | — | yaku; koi-koi push-your-luck | 12 months | [09-S52] |
| Go-Stop | Korea | 48(+bonus) | 2–3 | 10/8 (2p) | Flip | no | bonus cards | *sseul* steal | go/stop multipliers | 3 or 7 to stop | [09-S36][09-S53] |
| Chinese Ten | China/Thai/Indo | 52 | 2–4 | 24/n; 4 table | **+10**, one card; Flip | no | — | — | red cards | — | [09-S35] |

---


### 4.3 Mechanics library: candidate optional game modes (from note 09)

Each item below is a rule found in a real variant, so a mode can be named after its source game.

1. **Royal values** (J 11, Q 12, K 13, A 1/14) [09-S3][09-S76].
2. **Nordic dual-value hand cards** (A, ♠2, ♦10 worth more from hand than on the table) [09-S4][09-S63][09-S74]. This is historically the 1810 German rule.
3. **Target-sum capture**: Escoba +15 [09-S13], Pasur +11 [09-S19], Chinese Ten +10 [09-S35], Snitch'ems +8/+10 [09-S27].
4. **Single-capture discipline** (Scopa 1-of; single beats set) vs **multi-set capture** (Casino/Tablić) [09-S9][09-S2][09-S16].
5. **Building variants:**
   - None (Nordic) [09-S4].
   - Classic single/multiple builds [09-S2].
   - Swazi stealing into builds [09-S5].
   - Zwicker subtraction [09-S7].
   - Seep minimum-9 houses and one house per value [09-S24].
   - Diloti plain/group declarations [09-S21].
   - Danish ± × ÷ combinations [09-S65].
6. **Calling** (American 1860s): lock a rank to pairing only [09-S75].
7. **Sequence capture + "caída" bonus for taking the previous player's card**: Cuarenta, Ronda, Porrazo; Cicera's "picada" [09-S15][09-S25][09-S26][09-S12].
8. **Wild sweepers:** Jack (Basra/Pasur/Pişti), Ace (Asso pigliatutto/Cirulla), ♠5 (Danish), ♦7 (Basra), Jokers (Eléwénjewé) [09-S18][09-S19][09-S23][09-S9][09-S11][09-S65][09-S34].
9. **Sweep economics:**
   - Off / 1 point [09-S2].
   - Big sweeps: Basra 10, Pasur 5, Seep 50 [09-S18][09-S19][09-S24].
   - Cancelling sweeps: Dominican, Finnish, Pasur [09-S3][09-S4][09-S19].
   - Escalating streak "whirlwind" tactics [09-S10].
   - Hungarian double turn after a sweep (anti-snowball) [09-S3].
   - Krypkasino +5/−5 [09-S6].
10. **Steal-the-pile:** Stealing Bundles (whole bundle) [09-S8]; Ghârat/Shlla'at (top cards) [09-S32][09-S33].
11. **Single-pile mode** (Pişti/Xeri), with an optional **bluff pişti** [09-S23][09-S22].
12. **Hand declarations/bonuses at the deal:**
    - Ronda/tringa, with legal bluffing [09-S25].
    - Cirulla barsega/barsegon with a wild ♥7 [09-S11].
    - Chorizo Flor/Escalera [09-S14].
    - Scopa Bazzica [09-S9].
    - Cuarenta ronda [09-S15].
13. **Dealer table-sum bonus:** initial layout totals 15/30 (Escoba/Cirulla/Escopa) [09-S13][09-S11][09-S49].
14. **Endgame tension rules:**
    - Dominican 18/19/20 "can only win by…" [09-S3].
    - Claim-out ("chiamarsi fuori", "per shodam", "Ausz!", 21-point Cassino claims, with a penalty for false claims) [09-S9][09-S19][09-S3][09-S76].
    - Cuarenta 38-point limpia ban [09-S15].
15. **Misère modes:** Krypkasino, Laistokasino, Smyg, Give-away Casino [09-S6][09-S63][09-S64][09-S70].
16. **Draw-to-four** (Draw Cassino / dragkasino / pakkakasino) [09-S77][09-S62][09-S63].
17. **Double-deck modes** (Mulle "mulle" for identical cards; Krypkasino) [09-S4][09-S6].
18. **Flip-from-stock and push-your-luck "Koi-Koi / Go-Stop"** after scoring [09-S52][09-S53].
19. **Partnership aids:**
    - "Build for partner" (with proof rules) [09-S2][09-S3][09-S7].
    - Asking a partner (Zwicker *Magger*) [09-S7].
    - Drifting as a signal (Swazi) [09-S5].
20. **Learning ladder** (Wippen): pairing → summing → building → raising → double-building [09-S61][09-S60].
21. **Rollover ties** (Finnish "pakkaan"; Basra's 30 for cards rolls over) [09-S63][09-S18].

---

## 5. Terminology

### 5.1 Key terms and where they come from
- **Cassino / Casino:**
  - Both spellings date from 1792–93 [11 §V1].
  - Italian *casino* meant a small house where "small Coteries meet, play at cards, generally sup together" (Lady Miller, Venice 1771) [04-S37].
  - Etymonline: "The card game (also cassino) is attested by that name from 1792. Specifically as 'building for aristocratic gambling' by 1820" [04-S8].
  - Italian *cassino* means a "box-cart" [02-S30]. Treccani gives *casino* no card-game sense [10-S47], and Pratesi found no game called Casino in Florentine club archives [09-S70].
- **Great / Big Cassino (♦10) and Little Cassino (♠2):**
  - "Great" and "Little" from 1792 [11-V-S1]. "Big" in American speech by 1875 [04-S138].
  - Regional nicknames:
    - "Good Ten" / "Good Two" (Pagat) [02-S1]
    - "big ten" / "spy two" (southern Africa) [02-S4]
    - Swedish *storan* / *lillan* and the colloquial *storkajsa* / *lillkajsa* / *lillstina*, which turn the cards into women's names [10-S17]
    - Hester Piozzi's "Decemvir" for the ten (1819) [04-S23]
- **Sweep:**
  - In 1792–96 the word meant taking the leftover cards after the last trick [11 §V2][03-S5]. Clearing the board mid-game was described as "clears the Board" [11-V-S1].
  - The mid-game sense of "sweep" appears by 1800 [03-S6].
  - Translations have kept the broom image:
    - German *Kehraus* (1797) [11-V-S6]
    - Polish *wymiatacz* ("sweeper") [10-S46]
    - French translators' "coups de balai" ("broom strokes") [10-S62]
- **Lurch:** a doubled loss when the loser scored under 6 (Long) [11-V-S1] or under 5 (1793 poem) [11-V-S2]. The 1797 German glosses it as "Bredouille" [11-V-S6].
- **Build, building up, call:** American, from 1866–67 [11 §V4][03-S15]. **Raise** is printed from 1894 ("raise the Build") [03-S22]. **Trailing** appears from Foster 1897: "because he is simply following along waiting for opportunities" [03-S31][03-S23].
- **Cards and spades:** the two majority points gave American English the idiom "to give someone cards and spades", meaning a big head start. Green's earliest citation is from 1861 [04-S13].

### 5.2 English glossary (from note 05)

Format: term | definition (quoted where possible) | source(s) | earliest attestation found in fetched texts.

> Note on "earliest attestation": this is the earliest date among the sources fetched for this review (rulebooks, note 04's newspaper searches and the primary-source checks in note 11). It is not a dictionary-grade first citation.

#### 5.2a Game names, spellings, cards, and scoring objects

| Term | Definition / usage | Source(s) | Earliest attestation found |
|---|---|---|---|
| **Cassino** | The game; double-s spelling. Wikipedia: "Cassino, sometimes spelt Casino, is an English card game for two to four players" | [05-S2] | 1792, title of Long's *Short rules for playing the game of cassino* [05-S3]; 1797 "caſſino" [05-S4, 05-S5] |
| **Casino** | Single-s spelling; Pagat's preferred headword. German sources "invariably use the spelling 'Casino'" [05-S2]. A 2012 BGG user: searching "Casino" in the App Store "just yields a list of gambling apps!"; another notes "'Cassino' (note the doubled 's')" finds the card game [05-S74-BGG826479] | [05-S1, 05-S2, 05-S74] | Etymonline: "The card game (also cassino) is attested by that name from 1792" [05-S79] |
| **"Cersina"** (folk pronunciation) | "One of my grandma's favorite card games is called 'Cassino' Pronounced 'Cersina'" | [05-S90 Reddit AskReddit 2023] `[UGC]` | — |
| **cásino** (Haiti) | In Haiti "pronounced with the stress on the first syllable: cásino" | [05-S12] | — |
| **Great Cassino** | The ten of diamonds, 2 points. "Great Caſſino, is the ten of diamonds, and reckons for two points" (1797) | [05-S4, 05-S7, 05-S8, 05-S9, 05-S10] | 1792 (Long, p. 5, "Great Caſſino", confirmed from the page image) [11-V-S1]; 1797 [05-S4] |
| **Big Cassino / Big Casino** | Later name for the 10♦. "The Ten of diamonds, Big Cassino. 2" | [05-S11, 05-S1] | in rulebooks: Townsend 1891 ("Big Casino") [03-S20]; in speech: "big cassino" in an 1875 sermon and "little and big cassino" in 1878 [04-S138][04-S102][11 §V6] |
| **Good Ten** | Alternative name for 10♦ ("called Big Casino or the Good Ten") | [05-S1] | — (cf. Greek «το 10 το καλό» [05-S24], Turkish "güzel onlu" [05-S68]) |
| **Big ten** | South African name for 10♦ ("Ten of diamonds ('big ten')") | [05-S13] | — |
| **Little Cassino / Little Casino** | The two of spades, 1 point. "Little Caſſino, is the two of ſpades, and reckons for one point" | [05-S4, 05-S7, 05-S8, 05-S11, 05-S1] | 1792 (Long, OCR "Little Caſlino") [05-S3]; 1797 [05-S4] |
| **Good Two** | Alternative name for 2♠ | [05-S1] | — |
| **Spy two** | South African name for 2♠ ("Two of spades ('spy two')") | [05-S13] | — |
| **the Cassinos** | Collective for both scoring cards: "every spade, every Ace, the Cassinos and the sweeps" | [05-S11] | 1914 [05-S11] |
| **Cards (the cards)** | The 3-point majority of cards. Foster's glossary: "Cards … The majority of cards at Cassino" | [05-S4, 05-S8, 05-S11] | 1797 "The Cards, is having a greater ſhare of the pack than your adverſary" [05-S4] |
| **Spades (the spades)** | 1 point for majority of spades | [05-S4, 05-S8, 05-S11] | 1797 [05-S4] |
| **Aces** | 1 point each | [05-S4, 05-S8, 05-S11] | 1797 [05-S4] |
| **Natural points** | Foster's glossary: "those which must be made every deal, such as big and little cassino" | [05-S11] | 1914 [05-S11] |
| **Cash** | "capturing an ace with another ace is called 'cash' by some players" | [05-S1] | — |
| **Spade Cassino** | Variant: every spade scores; game to 61, "scored on a cribbage board, every point being pegged immediately" | [05-S11, 05-S1] | 1897 per Wikipedia [05-S2]; text seen in Foster 1914 [05-S11] |
| **Royal Cassino / Royal Casino** | Variant where J/Q/K = 11/12/13, A = 1 or 14 | [05-S11, 05-S12] | Foster 1897 per [05-S2]; 1894 mention per [05-S2] |
| **Draw Cassino** | Each player "keeps his hand filled to four cards by drawing" | [05-S11] | Foster [05-S11] |
| **Twenty-one Point Cassino** | Played to 21; points "count out in the following order:--Cards first, then Spades, Big Cassino, Little Cassino, Aces, and Sweeps" | [05-S11, 05-S2] | 1880 per [05-S2]; Foster 1914 text [05-S11] |
| **Set-back / Rounce Cassino** | 1867 name for the "European" 11-point subtraction game: "known as Set-back or Rounce Cassino" | [05-S8][11-V-S3] (§12, V5) | 1867 [05-S8] |
| **Diamond Cassino** | Modern 40-card variant ("cross between Cassino and Scopa") | [05-S2] | Parlett 2008 per [05-S2] |
| **Tuxedo** | US Casino variant with Rook cards; players call "orange" | [05-S12] | — |

#### 5.2b Actions and play terms

| Term | Definition / usage | Source(s) | Earliest attestation found |
|---|---|---|---|
| **pair / pairing** | Capturing equal-rank cards: "he can match or pair a card or cards on the table" | [05-S11, 05-S8] | 1867 "When a player cannot, or does not choose to pair, combine, or build up" [05-S8] |
| **combine / combining** | Taking cards whose pips sum to the played card. 1867 term list: "To play a card which will take two or more cards of a different denomination…" | [05-S8, 05-S9, 05-S11] | 1867 [05-S8] |
| **take in / taking in** | Capturing; Foster's heading "Taking In"; "cards … taken in or won" | [05-S11] | 1914 [05-S11]; Swedish "ta in" parallel [05-S33] |
| **capture** | Modern rules-speak ("A build can be captured by playing a numeral card of the rank which was announced") | [05-S1] | modern [05-S1] |
| **build** | "A card already built up" (1867); modern: cards combined "into builds, which can only be captured as a unit" | [05-S8, 05-S1] | 1867 [05-S8]; Wikipedia claims "building up" first in Dick 1864 [05-S2], but Cassino was absent from the 1864 first edition; earliest building is 1866 [11 §V4] |
| **building up** | 1867: playing a card on a table card and calling the total — "This is called building up" | [05-S8, 05-S9] | 1867 [05-S8] |
| **build from the table** | "Employing cards on the table to continue a build" (Cassell's term list) | [05-S9] | Cassell's (3rd ed., n.d.) [05-S9] |
| **single build** | Build whose cards sum to the capture value, e.g. "a 5-build made of a 2 and a 3" | [05-S1] | modern [05-S1] |
| **multiple build / double build / compound build** | Two or more sets each equal to the value. Foster calls these "Double Builds": "announcing the build as 'Two Sevens.' This cannot be increased" | [05-S11, 05-S1] | Foster [05-S11]; "compound build" [UNVERIFIED — not found as a phrase in fetched English sources; Swedish "sammansatt bygge" = compound build [05-S34]] |
| **increase / raise a build** | Foster: "Increasing Builds … announcing the total value, 'Ten.'" Pagat: "Adding to a build … increasing the capturing number" | [05-S11, 05-S1] | Foster [05-S11]; 1867 example of A→"Seven", 2→"Nine", A→"Ten" [05-S8] |
| **protected build** | BGG user: building on another's build "is allowed unless the build is 'protected' by either having multiple builds in the pile … or it is topped with a card of the same rank" | [05-S74-BGG597527] `[UGC]` | 2010 [05-S74] |
| **lock / locks** | BGG user: "The second set within the build 'locks' it" | [05-S74-BGG1893693] `[UGC]` | 2017 |
| **"reserved"** | A card in hand that is earmarked to capture an existing build: "you may not build or call with a card in your hand that is already reserved in another build or call" | [05-S78] | modern YouTube rules [05-S78] |
| **calling / call** | Locking pairs by playing a matching card and naming the rank in the plural: "he may play one of them on the table, at the same time calling the denomination … the plural is always used. Thus: 'Fours,' not 'Four.' This is termed calling" | [05-S8, 05-S9] | 1867 [05-S8]; Wikipedia credits Dick 1867 with first "calling" rules [05-S2] |
| **build and call** | Playing a duplicate on your own build and repeating the value — "the card so played is equivalent to a 'call'" | [05-S8, 05-S2] | 1867 [05-S8] |
| **build for partner / "for partner"** | Building toward a value partner is known to hold; must announce "for partner" | [05-S1, 05-S12] | Foster: partner may build "and 'two Eights,' called, although the player has no 8" [05-S11] |
| **steal (a build)** | Capturing someone else's build: "It is thus possible to 'steal' a build created by another player" | [05-S1] | modern; Swedish "stjäla" ett bygge [05-S34] |
| **trail / trailing** | Playing a card without capture/build. Foster: "This is called trailing, because he is simply following along waiting for opportunities" | [05-S11, 05-S1] | 1897 Foster, 1st ed. [05-S11b] (no "trail" in the 1792–1892 texts fetched) |
| **drifting** | South African term: "In South Africa, playing a card without capturing is called drifting"; also playing a capturing card into a build instead | [05-S13] | — |
| **chow** | South African term for capture ("The capture or 'chow'") | [05-S13] | — |
| **sweep** | Clearing the table; 1 point. "The Sweep.—Matching all the cards on the board" (1867); "If at any time a player is able to win everything on the table with one card, it is a sweep" (Foster) | [05-S7, 05-S8, 05-S11] | "clears the Board" 1792 [11-V-S1]; "The Sweep" (= last cards) 1793/1796 [11-V-S2][03-S5]; mid-game sense "a sweep before the end of the game … reckons 1" 1800 [03-S6] |
| **clear / clear board / clearing the board** | Synonym for sweep: "Some players call this a clear" [05-S1]; "A clear board reckons 1" [05-S9]; "if he clears the board" [05-S7]; BGG "Clears" [05-S74] | [05-S1, 05-S7, 05-S9, 05-S74] | "he clears the Board" 1792 [11-V-S1] |
| **sweeping the board** | "scoring one point for thus 'sweeping the board,' as it is termed" | [05-S10] | 1891 [05-S10] |
| **final sweep** | Taking the last cards at the end: "endeavouring likewise to win the last cards or final sweep" | [05-S7] | "final sweep" 1800 [03-S6] |
| **the last / last cards / last trick** | Remaining table cards go to the last capturer. "Last Cards.—Those cards remaining on the board after the last trick is taken" | [05-S8, 05-S9, 05-S11] | "Try to win the last Trick" 1792 [03-S1]; "Last Cards" glossary 1867 [03-S15] |
| **"last" (dealer's call)** | "The dealer must announce 'last' when dealing the last cards" | [05-S1] | modern [05-S1] |
| **residue** | Cards left at the end, "sometimes known as the residue" | [05-S1] | modern [05-S1] |
| **the board** | The table layout: "matching all the cards on the board" | [05-S7, 05-S8, 05-S9] | "the Board" 1792 [11-V-S1] |
| **the table** | Same; modern dominant term | [05-S1, 05-S11] | — |
| **layout / floor** | "layout" (Pagat); "floor" is used in Basra/Seep descriptions ("known as the 'floor'") | [05-S1, 05-S20, 05-S31] | — |
| **pile / capture pile** | Captured cards "stores them all face down in a pile" | [05-S1] | modern |
| **bundle** | A player's face-up capture pile in **Stealing Bundles** ("to start your 'bundle'") | [05-S16] | — |
| **Stealing Bundles / Steal the Old Man's Bundle / Steal Pile** | Children's fishing game where you capture an opponent's whole bundle by matching its top card | [05-S16, 05-S74-BGG90163] | — (BGG: "It was called, appropriately enough, Steal Pile" [05-S74]) |
| **tricks** | Old usage for captured cards: "The number of tricks are not to be examined or counted before all the cards are played" | [05-S7, 05-S8] | "face them like Tricks before you" 1792 [03-S1] |
| **eldest hand** | "The player sitting at the left hand of the dealer, so called because he is the first to play" | [05-S8, 05-S9] | 1867 [05-S8] |
| **pone** | Player on dealer's right (Foster) | [05-S11] | 1914 [05-S11] |
| **false build** | "A build made without any card in hand to redeem it" | [05-S9] | Cassell's [05-S9] |
| **redeem (a build)** | To capture one's own build/call with the matching card ("holds no card … with which to redeem or take the cards") | [05-S8] | 1867 [05-S8] |
| **lurch** | Loser under 6 when game is 11: "the points consist of eleven, and the lurch is six" | [05-S7, 05-S11, 05-S2] | "Six Points gained save the Lurch" 1792 [11-V-S1]; "The Lurch is Five" 1793 [11-V-S2] |
| **count out / claim out** | Foster: "agree to count out … The moment he reaches 21 he should claim the game … If he is mistaken, and cannot show out, he loses the game" | [05-S11] | 1914 [05-S11] |
| **showing** | End-of-hand count: "each player counts his cards face downward, and announces the number" | [05-S11] | 1914 [05-S11] |
| **skunk / skunking** | Family rule: "you can also win by 'skunking' someone during a round wherein you take all of the round's points" | [05-S91 Reddit 2018] `[UGC]` | 2018 |
| **World Series** | Family custom of best-of-7 matches: "they regularly play 'World Series' best-of-7's" | [05-S74-BGG597527] `[UGC]` | 2010 |
| **Cabin (mökki)** | Finnish sweep term rendered in English on BGG: "Cabin variant (mökki)" | [05-S74-BGG433043] `[UGC]` | 2009 |
| **Lazy Casino (Laisto Casino)** | BGG rendering of Finnish *laistokasino* (misère) | [05-S74-BGG433043] | 2009 |

#### 5.2c Required and illegal announcements (rules digest)

- **Must announce, audibly** — 1867 Law 11: "the player must declare the denomination of the proposed 'build' or 'call,' audibly and distinctly, so that no doubt of his intentions may exist, and failing to comply with this requirement, his opponent may separate the cards, and employ them in any lawful way" [05-S8, p. 220–221]. Example given: playing a Five on a Deuce is not a build "unless the player of the Five says … audibly and distinctly, 'Seven'"; for a call "he must announce his intention by saying, clearly and audibly, 'Fives'" [05-S8].
- **Number of the noun is mandatory (19th c.)** — build = singular ("'Nine' or 'Ten'—not 'Nines' or 'Tens'"); call = plural ("'Fours,' not 'Four'"); "calling out (not Five, but) 'Fives'"; "call (not Four, but) 'Fours'" [05-S8 pp. 218–220; 05-S9].
- **False builds** — 1867 Law 10: building or calling without a card "with which to redeem … he forfeits two points, and the cards … must be separated" [05-S8]. Foster: "the combination must be broken up, and the adversaries may take back the cards they have played" [05-S11].
- **Ambiguous announcements** — Pagat: playing a 5 on a 5 requires "announcing 'building 10' … or 'building 5'"; the announcement fixes what may capture it [05-S1]. Danish (unsourced wiki): if someone lays a 4 on a 4 "og glemmer at fortælle, om det er 8 eller mere 4, er det modstanderens pligt at spørge, hvad det er, man bygger" [*and forgets to say whether it is 8 or "more 4", it is the opponent's duty to ask what is being built*] [05-S43]. Finnish: "Jos esimerkiksi niputtaa kaksi kolmosta yhteen, pitää sanoa selvästi rakentaako kolmoselle vai kuutoselle" [*If you bundle two threes together you must say clearly whether you are building for three or for six*] [05-S40].
- **Can't trail while you own a build** — "you are not allowed simply to trail a card … You must either make a capture of some kind, create another build, or add to a build" [05-S1]; 1867 Law 8 [05-S8].
- **Can't re-examine captured cards** — "nor may any trick but that last won be looked at, as every mistake must be challenged immediately" [05-S7, 05-S8]; Foster: errors "must be challenged and proved before the next trick is taken in" [05-S11].
- **Claiming the win** — Foster: a correct claim of 21 wins "even if his adversary has 21 or more"; a mistaken claim "loses the game" [05-S11]. Same structure in Tablić ("a player who claims to have won but turns out to have fewer than 101 points automatically loses") [05-S26] and Pasur ("per shodam" [*I'm full*]; a false claim means "you have made a fool of yourself") [05-S21].
- **Called-but-false bonus** — Tuxedo: "A false call of 'orange' incurs a 10 point penalty"; if you forget, "another player can score 10 points by calling 'orange'" [05-S12].
- **Pointing out missed captures** — Dominican Royal Casino: cards left that could have been taken are "dejado" (left behind) or "pisado" (stepped on); "It is customary for the opponents to point out such cards" [05-S12].
- **Historical "table talk" cap** — Austen's cassino table (1813): "Their table was superlatively stupid. Scarcely a syllable was uttered that did not relate to the game" [05-S6, ch. XXIX] — a period description of cassino as quiet, game-focused talk.

---

### 5.3 Per-language glossaries (from note 05)

Format: original | literal/English gloss | usage note | source.

#### 5.4a Swedish (Kasino, Byggkasino, Krypkasino, Mulle)

| Original | English | Notes | Source |
|---|---|---|---|
| **kasino** / *cassino* (older) | Cassino | SAOB: older spelling "cassino 1817—1883"; first Swedish card-game citation Düben, *Talisman* (1817): "Två .. kort, som caracterisera Spelet, och hvilka bära namnet Cassino, nemligen Spader Tvåan och Ruter Tian" [*Two cards which characterise the game and bear the name Cassino, namely the two of spades and the ten of diamonds*] | [05-S36] |
| **storan**, also **storstina**, **stora kasino** | "the big one" = 10♦ | "ruter tio som kallas för storan (även storstina eller stora kasino)" [*the ten of diamonds, called "the big one" (also "big Stina" or "big casino")*] | [05-S33, 05-S34, 05-S35, 05-S14] |
| **lillan**, also **lillstina**, **lilla kasino** | "the little one" = 2♠ | "spader två som kallas för lillan (lillstina eller lilla kasino)" [*the two of spades, called "the little one" ("little Stina" or "little casino")*] | [05-S33, 05-S34, 05-S35] |
| **lill-kajsa** / **lill-kasina** / **lill-stina** | colloquial "little Kajsa/Stina" = Little Cassino | SAOB: "-KAJSA, äv. -KASINA. [av KASINO; i formen -KAJSA med anslutning till kvinnonamnet KAJSA] (vard.) spelt. 'lilla kasino'" [*-KAJSA, also -KASINA (from KASINO; in the form -KAJSA associated with the woman's name Kajsa) (colloq.) card games: "little casino"*]; "-STINA. [ombildning av -KASINA] (vard.) … Östergren (1931)" [*-STINA (reshaping of -KASINA) (colloq.) … Östergren (1931)*] — i.e., the cards were punningly turned into women's names | [05-S38] |
| **tabbe**, **tabberas** | sweep | "säger man att hen har gjort en tabbe eller tabberas (ytterst av latinska 'tabula rasa', rent bord)" [*one says they have made a tabbe or tabberas (ultimately from Latin tabula rasa, clean table)*] | [05-S33, 05-S34] |
| tabbe (etymology/date) | — | SAOB tabbe sbst.²: "[efter TABELRAS l. TABLE RASE] kortsp. i kortspelet kasino: förhållandet att ta hem alla kort på bordet. Werner o. Sandgren Kortox. 53 (1949)" [*(after TABELRAS or TABLE RASE) card games: in the card game kasino, the act of taking home all the cards on the table. Werner and Sandgren, Kortox. 53 (1949)*]. Note the **homonym** tabbe sbst.¹ = "blunder, gaffe" — an easy pun for VO ("en tabbe!") | [05-S37] |
| **tabbar** | sweeps (plural) | "För att hålla koll på alla tabbar" [*To keep track of all the sweeps*] | [05-S32, 05-S14] |
| **tvångstabbe** | forced sweep (Krypkasino) | | [05-S15, 05-S33] |
| **"tabbe på knekt"** / **"tabbe på 9"** | "sweep for a jack / for a nine" | Krypkasino courtesy announcement when you leave a capturable table: "En spelare som till exempel spelar ♣4 när det bara ligger ♠7 på bordet bör säga 'tabbe på knekt'" [*A player who, for example, plays ♣4 when there is only ♠7 on the table should say "sweep for a jack"*] | [05-S33, 05-S15] |
| **sistan** | "the last one" — last capture point **and** dealer's warning | "När given delar ut de sista korten ska denne informera alla … genom att helt enkelt säga 'sistan' eller 'båt'" [*When the dealer deals out the last cards, they must inform everyone … by simply saying "the last one" or "boat"*] | [05-S32, 05-S14] |
| **båt / båten / "båten går"** | "boat" / "the boat's leaving" | Synonyms of sistan; dealer may say "'sistan', 'båten går' eller 'sista given'" [*"the last one", "the boat's leaving" or "last deal"*] | [05-S34, 05-S33, 05-S14] |
| **ta in** | take in (capture) | | [05-S33] |
| **lägga ut** | lay out (trail) | "Man säger att spelaren lägger ut" [*One says that the player lays out*] | [05-S33, 05-S34] |
| **krypa** | to creep/crawl = trail without capturing (Krypkasino) | "Att lägga ut ett kort på bordet kallas för att krypa" [*Laying a card out on the table is called creeping*] | [05-S15, 05-S35-Krypkasino] |
| **havet**, **fiska** | "the sea", "to fish" | "På svenska säger man att korten på bordet utgör havet och att spelarna fiskar upp kort därifrån" [*In Swedish one says the table cards are "the sea" and players "fish" cards from it*] | [05-S32] |
| **bygga nytt / bygga på** | build new / build on (increase) | | [05-S34] |
| **enkelt bygge / sammansatt bygge** | single build / compound (multiple) build | | [05-S34] |
| **fria kort** | loose cards | | [05-S34] |
| **"bygger till elva" / "bygger till knekt"** | "building to eleven / to jack" | Required announcement of a single build | [05-S34] |
| **"två åttor"** / **"tre tior"** | "two eights" / "three tens" | Announcing a compound build by value and number of parts | [05-S34] |
| **"ligger"** / **"åttan ligger"** / **"femman ligger"** / **"knekten ligger"** | "lies" / "the eight lies [stays]" | Said when laying a same-rank card to make a locked build instead of capturing ("brukar spelaren förtydliga att hen inte tänker ta in korten genom att annonsera bygget med 'ligger'" [*the player usually makes clear that they do not intend to take in the cards by announcing the build with "lies"*]) | [05-S34] |
| **"storan privat"** | "big casino, private" | Build to 16 that only the 10♦ can take: "Vissa spelare understryker att bygget bara kan tas in av detta enda kort genom att annonsera det med 'storan privat'" [*Some players stress that the build can only be taken in by this one card by announcing it with "big one private"*] | [05-S34] |
| **"bygga åt sin partner"** | build for one's partner | | [05-S34] |
| **"stjäla" ett bygge** | "steal" a build | | [05-S34] |
| **överspader** | "over-spades" scoring variant | 1 point per spade beyond six | [05-S14, 05-S32] |
| **dragkasino** | draw-cassino | | [05-S33, 05-S35] |
| **kasino misär / omvänd kasino / avig kasino** | misère / reversed / "wrong-side-out" cassino | | [05-S33, 05-S35-Krypkasino] |
| **kasino kryp** | reverse Cassino (family name) | Reddit: "In swedish we call it 'kasino kryp'"; poster's family says **"Sweep 9"** when setting up a forced sweep | [05-S92] `[UGC]` |
| **mulle** | capture of an identical card (same rank & suit) in the two-deck game Mulle | Mulle "verkar ha en särskild status på svenska fångvårdsanstalter. Glimne kallar spelet för 'kåkfararvarianten av kasino'" [*seems to have special status in Swedish prisons; Glimne calls it "the jailbird variant of kasino"*] | [05-S14, 05-S33-index] |

#### 5.4b Norwegian

| Original | English | Notes | Source |
|---|---|---|---|
| **lillekasino / storekasino** | little/big cassino | "spar 2 (lillekasino), og to poeng for ruter 10 (storekasino)" [*two of spades (little casino), and two points for the ten of diamonds (big casino)*] | [05-S42] |
| **stikk / ta stikk / stikke** | trick / take a trick (capture) | | [05-S41, 05-S42] |
| **bygge / bygg / doble et bygg** | build / to "double" a build | | [05-S41] `[wiki, tagged unsourced]` |
| **tabbe** | sweep (one extra point) | | [05-S41] |
| **"døgga"** | local name for the last round | "siste runde kalles 'døgga'" [*the last round is called "døgga"*] | [05-S41] `[wiki, unsourced — treat as UNVERIFIED]` |
| **smyg / krypkasino** | misère variant | | [05-S41] |
| **byggekasino** | building variant | | [05-S42] |

#### 5.4c Danish

| Original | English | Notes | Source |
|---|---|---|---|
| **store kasino / lille kasino** | big / little cassino | | [05-S43, 05-S44] |
| **svupper** | sweep (clearing the table) | Lex.dk: "Udtrykket 'at rydde bordet' kendes blandt andet fra kasino, hvor det betyder, at man hjemtager samtlige kort på bordet og får en 'svupper', dvs. et ekstra point" [*The expression "to clear the table" is known from kasino, meaning taking all the cards and getting a "svupper", i.e., an extra point*] | [05-S44, 05-S43] |
| **at rydde bordet** | to clear the table | idiom traced to kasino | [05-S44] |
| **sidsten** | "the last" | dealer marks last round "ved at udmelde 'sidsten'" [*by announcing "sidsten"*] | [05-S43] `[wiki, unsourced]` |
| **udsmidning / matchning / kombinere / bygning** | discard (trail) / matching / combining / building | | [05-S43] |
| **"bygger 9"** | "building 9" | | [05-S43] |
| **"mere syv"** | "more seven" = locked same-rank build | "lægge en 7'er oven på en 7'er og melde 'mere syv'" [*lay a 7 on top of a 7 and announce "more seven"*] | [05-S43] |
| **bygge dobbelt / trippelt** | build double / triple | | [05-S43] |
| **spar 5 rydder bordet** | five of spades clears the table (house rule in Danish wiki) | | [05-S43] `[unsourced]` |

#### 5.4d Finnish (Kasino)

| Original | English | Notes | Source |
|---|---|---|---|
| **mökki** (pl. **mökit**) | "hut/cabin" = sweep | Pagat: "an extra point for each sweep, known in Finnish as a mökki (hut)"; fi-wiki: "Jos pelaaja nostaa omalla vuorollaan kaikki kortit pöydästä, hän saa mökin" [*If a player lifts all cards from the table on their turn, they get a mökki*] | [05-S14, 05-S39, 05-S40] |
| **mökki kaatuu / kaataa mökin** | the hut "falls" / to knock down a hut | Sweep cancellation: "mökkiä ei oteta itselle vaan sen sijaan kaadetaan yksi vastapuolen mökeistä" [*you don't take a hut for yourself; instead one of the opponent's huts is knocked down*] | [05-S40, 05-S39] |
| **patakakkonen** = **pieni kasino** | two of spades = little casino ("Pikku-Kasino" in a commenter's usage) | "Patakakkonen eli pieni kasino on kädessä 15 ja pöydässä tavallinen kakkonen" [*The two of spades, or "little casino", is 15 in the hand and an ordinary two on the table*] | [05-S40, 05-S39] |
| **ruutukymppi** = **iso kasino** | ten of diamonds = big casino | "ruutukymppi eli iso kasino on kädessä 16 ja pöydässä 10" [*the ten of diamonds, or "big casino", is 16 in the hand and 10 on the table*] | [05-S40, 05-S39] |
| **pata / padat** | spade(s) | from French *pique* via Swedish *spader* (fi-wiki); Kasino aim: "kerätä … patoja" [*collect … spades*] | [05-S39, 05-S93] |
| **risti** | clubs (♣); *risti* = "cross" | general Finnish suit name ("nimi on vaihtunut ulkomuodon perusteella ristiksi" [*the name changed to "cross" on the basis of its appearance*]), not Kasino-specific | [05-S93] |
| **ruutu** | diamonds (♦) | "Suomenkielinen nimi johdettiin ruotsinkielisestä nimestä" [*The Finnish name was derived from the Swedish name*] (*ruter*) | [05-S93] |
| **ässä** | ace (14 in hand, 1 on table) | | [05-S39, 05-S40] |
| **sotilas / jätkä**, **rouva / kuningatar**, **kuningas** | jack, queen, king | "jätkällä jätkän, rouvalla rouvan" [*a jack with a jack, a queen with a queen*] | [05-S40] |
| **korttivoitto / patavoitto** | "card win" / "spade win" (majorities) | | [05-S39, 05-S40] |
| **"pakkaan"** | "into the deck" — tied majority points carry over to next deal | | [05-S39, 05-S40] |
| **nostaa / napata / ottaa** | lift / snatch / take (capture) | | [05-S39, 05-S40] |
| **pöytääminen** | "tabling" = trailing | | [05-S39] |
| **etukäsi** | eldest hand | | [05-S40] |
| **rakennuskasino / rakentaa / rakennus** | building-kasino / to build / a build | | [05-S39, 05-S40] |
| **"rakennan ässälle"** | "I'm building for the ace" | Example announcement: "kympin päälle voisi pelata nelosen ja sanoa 'rakennan ässälle'" [*on a ten one could play a four and say "I'm building for the ace"*] | [05-S40] |
| **"rakennan yhdeksikölle"**, **"rakennan kuutoselle"** | "I'm building for the nine / for the six" | | [05-S40] |
| **korottaa** | to raise (a build) | | [05-S39, 05-S40] |
| **kaksoisrakennus** | double build (cannot be raised) | | [05-S39, 05-S40] |
| **laistokasino** | "shirking" (misère) kasino | | [05-S39, 05-S40] |
| **pakkakasino** | draw kasino | | [05-S39, 05-S40] |
| **pimeä kasino** | "dark kasino" — flip top card blindly (a children's luck game) | commenter Olli, 2014 | [05-S40] `[UGC]` |
| **"kiroilla onneaan"** | "to curse one's luck" (after an opponent's double mökki) | commenter Lauri, 2023 | [05-S40] `[UGC]` |

#### 5.4e German / Austrian / Hungarian / Flemish

| Original | English | Notes | Source |
|---|---|---|---|
| **Großes Casino / Kleines Casino** | Big / Little Casino | | [05-S45] |
| **ablegen / paaren / kombinieren / bauen** | trail / pair / combine / build | | [05-S45] |
| **geräumter Tisch** | cleared table (sweep) | | [05-S45] |
| **"eine Karte für den Tisch bringen"** | "bring a card for the table" (forced trail after a sweep) | | [05-S45] |
| **Zwick** (Zwicker) | sweep bonus ("equivalent to the English 'tweak'") | | [05-S28] |
| **das Bild** | "the picture" = table cards (Zwicker) | | [05-S28] |
| **"13 for partner"** | Zwicker build announcement for partner | | [05-S28] |
| **Kaszinó** (Hungarian) | Hungarian Casino | | [05-S12] |
| **tábla** | sweep (Hungarian) | | [05-S12] |
| **csere** | last capture | | [05-S12] |
| **"Ausz!", "Ausz vagyok!", "Kint vagyok!"** | "Out!", "I'm out!" | Said to stop the game on reaching 11 | [05-S12] |
| **pikkje van** | "has the spades" (majority of spades) | | [05-S12] |
| **Wippen / Wip** (Flemish) | Belgian name; "A sweep is known as a Wip" | | [05-S1] |

#### 5.4f Italian (Scopa, Scopone, Cirulla, relatives)

| Original | English | Notes | Source |
|---|---|---|---|
| **scopa** (pl. **scope**) | broom → sweep | "capturing all the cards on the table leaving it empty, which is known as a scopa (sweep)" | [05-S17, 05-S46, 05-S47] |
| **fare scopa** | to make a sweep | "realizza una scopa, che vale un punto" [*makes a scopa, which is worth one point*] | [05-S46] |
| **"Scopa!"** | shouted at the sweep | see §6.4c | [05-S48, 05-S49] |
| **settebello / sette bello**, also **"Piricchio"** | "beautiful seven" = 7 of coins/diamonds | it-wiki: "Settebello (o 'Piricchio')" [*Settebello (or "Piricchio")*] | [05-S46, 05-S27] |
| **primiera / settanta** | prime (best four-suit set) | "Primiera o Settanta" [*Primiera or Settanta ("seventy")*] | [05-S46, 05-S17] |
| **re bello / rebello** | king of coins bonus | | [05-S46, 05-S17] |
| **napola / napoletana**, **napoleone** | coins sequence bonus | | [05-S46, 05-S17] |
| **punti di mazzo** | "deck's points" (the four standard points) | | [05-S47] |
| **la matta** | the King of Coins used to pick dealer | "fino all'uscita della 'matta' (Re di Denari)" [*until the "matta" (King of Coins) comes out*] | [05-S46] |
| **"burning an ace"** (bruciare un asso) | playing an ace when one is already on the table (Scopa d'assi) — "every player will try to avoid" | | [05-S47] |
| **accusare / accuse** | to declare hand combinations (Bàzzica scopa) | | [05-S46] |
| **bussare** | to knock on the table to claim a hand bonus (Cirulla) | "claims a hand bonus … by knocking on the table (bussare)" | [05-S27, 05-S47] |
| **cappotto** | capturing the whole coin suit (instant win, Cirulla) | | [05-S27] |
| **scopa a cascina** | Scopa variant **with building** ("cascina" = farmhouse/stack) | "giocare una carta sopra a una di quelle in tavola, se si possiede una carta che permette di catturarle entrambe al giro successivo" [*play a card on top of one of those on the table, if one holds a card that can capture both on the next turn*] | [05-S46] |
| **scopa a fidasse** ("a fidarsi") | "trust-me scopa" — bluff sweep | Claimant asks **"vi fidate?" / "ti fidi?"** [*do you (pl./sg.) trust me?*]; a false scopa caught loses a point, a doubter of a true one loses a point | [05-S46] |
| **maresciallo / maresciallone / saponificatrice / argentina** | K♠ penalty card ("marshal"), K♠-on-K♠ scopa, Q♠ penalty ("soap-maker"), Q♦ bonus | regional Maresciallo variant | [05-S46] |
| **rosmarino** | J♠ bonus ("rosemary") | | [05-S46] |
| **rubamazzo / rubamazzetto** | "steal the deck" (= Stealing Bundles) | | [05-S16, 05-S46] |
| **"A chi tocca?" / "Tocca a me" / "Tocca a te"** | "Whose turn?" / "My turn" / "Your turn" | listed as "Fun words to say while you play" | [05-S50] `[blog]` |
| Ligurian suit names **dinæ, coppe, scioî, spoæ/spâ** | money, cups, flowers, swords | used for French suits in Cirulla | [05-S27] |

#### 5.4g Spanish — Escoba (Spain, Argentina, Uruguay, Chile)

| Original | English | Notes | Source |
|---|---|---|---|
| **escoba** | broom → sweep | "The name of the game means 'broom'" | [05-S18] |
| **escoba de quince / escoba del 15** | broom-of-15 | captures sum to 15 | [05-S18] |
| **"cada escoba cantada vale 1 punto"** | "each escoba **sung/called out** is worth 1 point" | *cantar* = to call aloud; implies the sweep is announced | [05-S51] |
| **cartas / oros / siete de velo / guindis / la setenta** | cards / coins / 7 of coins ("velo" or "guindis") / the prime ("seventy") | | [05-S18] |
| **"¡Soplo!" / "asoplo"** | "blow!" — calling out an opponent's missed 15 to take it | forum, 2005: "claro ke puedes sumar tu esas 15, pero tienes que gritarle un ASOPLO!!!, para que quede constancia" [*of course you can take those 15 yourself, but you have to shout "asoplo!!!" at her so it's on record*] | [05-S52] `[UGC]` |
| **Chorizo / Báciga / Flor / Escalera / Tres de nueve / Dos de miseria** | Uruguayan declarable hand combos | declared aloud "immediately before playing the first of their three cards" | [05-S83] |
| **Casita robada** | "stolen little house" (= Stealing Bundles) | | [05-S16] |

#### 5.4h Spanish — Cuarenta (Ecuador)

| Original | English | Notes | Source |
|---|---|---|---|
| **caída** | "a fall" — capturing by matching the card just played by the previous player (2 pts) | | [05-S19, 05-S53, 05-S56] |
| **limpia** | "a cleansing" — clearing the table (2 pts) | | [05-S19, 05-S53] |
| **caída y limpia** | both at once | 40caidaylimpia: "Se otorgan 2 puntos más **el permiso de burlarse de los contrincantes**" [*2 points plus permission to mock the opponents*] | [05-S59, 05-S53] |
| **ronda / doble ronda** | three / four of a rank dealt | announced immediately after the deal | [05-S19, 05-S53] |
| **"dos por guapo"** | "two for being handsome" | phrase used to claim the ronda bonus | [05-S57, 05-S59, 05-S55] |
| **"dos por shunsho"**, **"¡Toma, dos por shunsho!"** | "two for [shunsho]" / "Take that, two for shunsho!" | said at the moment of a caída; *shunsho* gloss not found [UNVERIFIED meaning] | [05-S56, 05-S57, 05-S58, 05-S54] |
| **"dos señor juez" / "dos por favor, señor juez" / "dos juecito"** | "two, Mr. Judge" / "two please, Mr. Judge" / "two, little judge" | claiming caída points from the scorer-judge | [05-S56, 05-S59, 05-S55] |
| **"con esta te caigo"** | "with this one I'll fall on you" | said while holding the card to your forehead | [05-S57, 05-S54] |
| **"as que no me caerás"** | "ace that you won't fall on me" | | [05-S57] |
| **"Capariche"** | (unglossed) | said "cuando se realiza una caída o limpia que levante muchas cartas de la mesa" [*when a caída or limpia is made that lifts many cards from the table*] | [05-S57] |
| **"Cuatrero has de ser"** | "You must be a rustler" (*cuatrero* = cattle-thief; wordplay on *cuatro*) | said "cuando lanzan la baraja con el número 4" [*when the card with the number 4 is thrown*] | [05-S57, 05-S58] |
| **"marido tiene"**, **"José me llamo"**, **"la foto"**, **"dolido va"** | "she has a husband", "my name is José", "the photo", "he goes off hurt" | listed vocabulary/distractors (meanings not explained in sources) | [05-S56, 05-S58, 05-S54] |
| **"treinta y ocho que no juega" / "38 que no juega"** | "38 doesn't play" — at 38 you can only win by a caída | | [05-S56, 05-S59, 05-S53, 05-S54] |
| **zapatero / zapatería / "zapateros se quedaron"** | "shoemaker" — losing a chica with < 10 points; "they stayed shoemakers" | El Telégrafo: losers "deben lustrar los zapatos a los rivales" [*must shine the rivals' shoes*]; tournament "rincón de la zapatería" [*the shoe-shop corner*] | [05-S53, 05-S55, 05-S58, 05-S59] |
| **perro / tanto** | "dog" (10 pts) / "tally" (2 pts) score cards | | [05-S53, 05-S56, 05-S59] |
| **viejas** | "old ladies" = J, Q, K | | [05-S56, 05-S59] |
| **chica / mesa / data / cartón** | 40-point game / match / a deal / one's captured cards | | [05-S53, 05-S54] |
| **"pasa la mano con diez"** | "the deal passes, with ten" — misdeal penalty | | [05-S59, 05-S53] |
| **"dos por darlas" / "dos por dar"** | "two for dealing them" | tie-break points | [05-S53, 05-S59] |
| **"dos por falla"** | "two for failure" — "es una gran vergüenza" [*it is a great shame*] | | [05-S59] |
| **"veo y juego"** | "I see and I play" — formal challenge of a capture | | [05-S59] |
| **Juez de Aguas** | "Water Judge" — referee/scorer | | [05-S59] |
| **"cuarenta señores, gracias"** | "Forty, gentlemen, thank you" — winner's sign-off | | [05-S57] |
| **"todo dos" / "a todo rigor"** | Quito "everything is two" vs "strict" scoring | | [05-S53, 05-S58] |

#### 5.4i Portuguese (Brazil / Portugal)

| Original | English | Notes | Source |
|---|---|---|---|
| **Escova / jogo de escovas** | "brush" — Portuguese/Brazilian Escoba | "faz uma 'escova' e deverá colocar uma delas desvirada na sua pilha" [*makes an "escova" and must place one of them face up in their pile*] | [05-S73] |
| **carteador** | dealer | | [05-S73] |
| **Primeira** | prime | | [05-S73] |
| **"grande cassino" / "pequeno cassino"** | big/little cassino | **[UNVERIFIED — appears only in a search-engine summary of a login-walled Brazilian forum; page returned 403]** | — |
| "varrer" (to sweep) | — | **[UNVERIFIED — not found in any fetched Portuguese source]** | — |

#### 5.4j Arabic — Chkobba (Tunisia) and Basra/Bastra (Egypt, Levant, Gulf)

| Original | English | Notes | Source |
|---|---|---|---|
| **chkobba / škubba (شكبّة)** | sweep (from Italian *scopa*) | "Capturing all the cards from the layout leaving it empty is called a chkobba"; verb "chkobber" | [05-S17, 05-S66] |
| **ʾakala (أكل)** "manger" | "to eat" = capture | "faire le pli (أكل ʾakala ou « manger » en arabe)" [*to take the trick (أكل ʾakala, or "to eat" in Arabic)*] | [05-S66] |
| **kārṭa (كارطة)** | the cards (majority) | | [05-S17, 05-S66] |
| **dīnārī (ديناري)** | diamonds (from Italian *denari*) | | [05-S17, 05-S66] |
| **barmīla (برميلة)** | prime (from *primiera*) | | [05-S17, 05-S66] |
| **sabʿa l-ḥayya (سبعة الحيّة)** / **al-ḥayya** | "the living seven" = 7♦ | | [05-S17, 05-S66] |
| **bājī (باجي)** | a tied point ("Lorsqu'il y a égalité … il est déclaré bājī" [*When there is a tie … it is declared bājī*]) | | [05-S66] |
| card names **laṣ, dū, trīs, kwātrū, šīnkū, sīs, sabʿa, mujīra, kawwāl, rayy** | A,2,3,4,5,6,7,Q,J,K (Sicilian/Spanish/French loans) | | [05-S66] |
| **"CHKOBBAAA!", "Sab3a l-7ayya!", "Barmīla!", "Wesh hadi?!", "Yaser ya 3ammi!" [*That's a lot, uncle! (?)*], "Rak tel3ab bel 7adh ken!" [*You're only playing on luck!*], "Khallini narba7 marra!", "Yallah Nel3bou!"** | sweep shout; 7♦ shout; prime shout; "What's this?!"; hype; trash-talk; "let me win once!"; "let's play!" | **promotional site — use as flavour, verify with a native speaker** | [05-S67] `[promo]` |
| **Racham (رشّام)**, **El Ghaffas (الغفّاص)**, **Tannbir (التنبير)** | café scorekeeper; the sore loser; spectators' sneaky commentary | | [05-S67] `[promo]` |
| **basra** | sweep worth 10 (Egypt); in Lebanon, specifically capturing a lone card | | [05-S20, 05-S61, 05-S62] |
| **double basra** | jack takes lone jack (20) | | [05-S20, 05-S61] |
| **"the floor"** | the table area ("maybe the game was originally played on the floor") | | [05-S20] |
| **ashush / imam** | the jack; "it is an imam that 'eats' everything else on the floor"; "In Bahrain, I have heard people referring to the knave as imam" (Khuri 1990, quoted) | | [05-S20] |
| **komai** | 7♦ (Ethiopian basra) | | [05-S61] |
| **Assaba-al'-Komi** | alternative (Yemeni) name of Basra | | [05-S20] |

#### 5.4k Persian — Pâsur

| Original | English | Notes | Source |
|---|---|---|---|
| **pâsur (پاسور)** | the game; also "playing cards" in general | "can also mean playing cards more generally in everyday Persian"; name from Russian per Wikipedia (citing Marashi 1994) | [05-S65, 05-S64, 05-S21] |
| **sur / soor (سور)** | sweep (5 pts) | | [05-S21, 05-S64, 05-S65] |
| **haft khâj (هفت خاج)** | "seven clubs" — 7+ clubs bonus | | [05-S21, 05-S65] |
| **chahâr barg** | "four cards" (alt. name) | | [05-S21, 05-S64] |
| **yâzdahtâyi** | "eleveny" (alt. name) | | [05-S21] |
| **haft va chahâr, yâzdah** | "seven and four, eleven" (alt. name) | | [05-S21] |
| **"per shodam"** | "I'm full / I'm done" — stopping the game on reaching 62 | | [05-S21] |
| **pasur ru baaz (پاسور رو باز)** | "open pasur" variant | | [05-S64] |

#### 5.4l Greek — Xeri, Kontsina, Diloti

| Original | English | Notes | Source |
|---|---|---|---|
| **ξερή (xeri)** | "dry, plain" — capturing a lone card (Xeri) / clearing the table (Diloti) | Pagat: "from the Greek adjective 'ξερή' meaning dry or plain" | [05-S22, 05-S23] |
| **κάνει ξερή / κάνεις ξερή** | "makes a xeri" | "Πότε κάνεις ξερή; Ξερή κάνει ο παίχτης όταν κάτω υπάρχει μόνο ένα φύλο" [*When do you make a xeri? When there's only one card down…*] | [05-S70, 05-S71] |
| **ξερή με βαλέ** | xeri with a jack (20) | | [05-S71] |
| **το καλό 10 / το καλό δύο** | "the good 10" (10♦) / "the good two" (2♣) | «το 2 το καλό» and «το 10 το καλό»; "one could alternatively call them the 'lucky 2' and the 'lucky 10'" | [05-S24, 05-S70] |
| **Δηλωτή (Diloti)** | "declared" — from «δηλώνω» "to declare" | | [05-S23] |
| **δηλώνω / δήλωση** | to declare / a declaration (= build) | "Usually the player will verbally declare the value of the pile … though this is not obligatory" | [05-S23, 05-S72] |
| **«οκτάρια»** | "eights" — group declaration of eights | "δεν πρέπει … να τα βάλουμε όλα μαζί δηλώνοντας «οκτάρια»" [*we must not … put them all together declaring "eights"*] | [05-S72] |
| **«σόι»** (soi) | "kin/family" — a pair-of-equal-cards declaration | "δηλώνουμε «σόι» βάζοντας ένα 3 πάνω σε κάποιο 3" [*we declare "kin" by putting a 3 on top of a 3*] | [05-S72, 05-S23] |
| **"two 9's" / "group of 9's" / "family of 9's"** | Pagat's English for group declarations | | [05-S23] |
| **χαρτωσιά** | a round/deal of cards | | [05-S72] |
| **Κοντσίνα / Κολτσίνα / Κολιτσίνα** | Kontsina (children's game) | | [05-S24] |
| **καφενεία** | coffeehouses — Diloti "το πιο παραδοσιακό παιχνίδι τράπουλας στα καφενεία" [*the most traditional card game in the coffeehouses*] | | [05-S72] |

#### 5.4m Turkish — Pişti / Pişpirik

| Original | English | Notes | Source |
|---|---|---|---|
| **pişti** | "cooked" — capturing a lone card (10 pts) | Pagat: "The word 'pişti', which means 'cooked'"; first in Ahmed Vefik Paşa's *Lugat-ı Osmani* (1876) as "kâğıt oyunu" [*card game*] | [05-S25, 05-S68] |
| **pişpirik** | alt. name | | [05-S25, 05-S68] |
| **kesmek** | "to cut" — to capture (matching or with a jack) | | [05-S68] |
| **güzel onlu / karo onlu** | "beautiful ten" (10♦, 3 pts) | | [05-S68] |
| **güzel ikili / sinek ikili** | "beautiful two" (2♣, 2 pts) | | [05-S68] |
| **vale (bacak)** | jack ("leg") | | [05-S68] |
| **kart fazlası** | card majority | | [05-S68] |
| **"İlk elin günahı olmaz"** | "The first hand has no sin" — saying used when the first capture leaves the next player exposed to a pişti | | [05-S68] |
| **pişti olmak** | idiom: two people unintentionally doing the same thing at once | | [05-S94] |

#### 5.4n Other relatives (brief)

| Language/game | Term | Gloss | Source |
|---|---|---|---|
| Catalan, *Cau Robat* | **"cau"**, **"recau"**, **"contracau"** | said aloud when matching the previous player's non-capturing card, then re-matching | [05-S29] |
| French-Canadian, *Mitaines* | **"mitten" / "glove" / "sock"** (mitaine, gant, chausson); **"clearing for 10"** | called when starting a pair/three/four | [05-S30] |
| Hindi/Punjabi, *Seep* | **Seep/Sip/Sweep**, **house**, **"bid for a house"**, **baazi**, **satthi** | | [05-S31] |
| Serbian/Balkan, *Tablić* | **tabla** (sweep); Macedonian **"peeshee"** | | [05-S26] |
| Southern Africa | **chow** (capture), **drifting** (trail), **spy two**, **big ten**, **crazy casino**; Namibia: **Omulongo Womadi**; "Khasino" (South African association KASA, "40 on Deck") | | [05-S13, 05-S80, 05-S81] |
| Dominican Republic (Spanish) | **Captura / Cojer**, **Forma** (build), **Virados** (sweeps), **diez de casino**, **dos de casino**, **espadas**, **dejado / pisado** | Royal Casino is described by a Reddit user as "the national card game of the dominican republic" | [05-S12, 05-S95] |
| Haiti | **cásino** (stress on first syllable) | | [05-S12, 05-S80] |
| English 18th c., *Snitch'ems* | name "may derive from the dialect word 'snitch' in the sense of to steal/pilfer" | | [05-S82] |

---


## 6. Table talk: what people say during the game

### 6.1 The announcement is part of the rules (a timeline)
The single most important finding for voice-over and UI is that, from 1867 on, **what a player said changed what the move legally was**.

- **1792:** Long's forerunner of the call is silent. You lay one card of a pair "and wait your Turn", and the cards are not protected [03-S1].
- **1866:** Dick's building example has the players speak the totals: "the dealer puts an ace upon it and says 'seven,' … the non-dealer throws a deuce upon them and says 'nine,' … the dealer again puts upon the heap his other ace, and cries 'ten'" [03-S14].
- **1867:** the *American Hoyle* makes speech binding. "the player must declare the denomination of the proposed 'build' or 'call,' audibly and distinctly, … and failing to comply with this requirement, his opponent may separate the cards." "No announcement … possesses any value whatever, unless the above condition be strictly observed" [11-V-S3][03-S15].
  - Grammar encodes the move type. A build is singular ("Nine"), a call is plural ("Fives") [03-S15].
  - A false build or call "forfeits two points" [03-S15].
- **1877–1880:** letters to the *New York Dispatch* answers column record real disputes word for word. They show singular "seven" and plural "sevens" in use [04-S155]:
  - "A plays a four spot, C puts a three on it, calling 'seven;' … D … plays ace on B's six, and putting it on his partner (C's) seven, calls 'sevens'" [04-S155].
  - A player locks a combination by calling it "fives all" [04-S155].
  - "Can B put an ace on top of the nine and call it ten? He cannot, as the call is nin[es]" [04-S155].
- **1891:** Townsend adds explicit verbs, "'I build seven' (not sevens)" and "'I call sixes'". His reason: "to avoid the disputes caused by misunderstanding whether singular or plural number was called" [03-S20].
- **1894:** in Dick's rewritten *American Hoyle*, saying the number can end your turn. "if A had said 'nine' when he played his Ace, this would have completed his play" [03-S22].
- **1897–1914:** Foster's forms are "Nine", "Ten", "Two Sevens", "Two Nines", and "'two Eights,' called" for a partner [03-S31].
- **1904:** the penalty for silence is still in the *Standard Hoyle*: "If in building the player fail to call the build, his adversaries have the right to disperse the cards" [03-S25].
- **1945–1952:** "Building eight" / "Building sevens" [03-S35]; "building six" / "building fours" [03-S36].
- **Today:** Pagat requires "building 5", "building 9 for partner" [02-S1].
  - Equivalents in other languages:
    - Danish "bygger ni" [*building nine*] and, for a same-rank lock, "mere syv" ("more seven") [10-S37]
    - Swedish "bygger till knekt" [*building to jack*], "två åttor" [*two eights*], "åttan ligger" [*the eight lies*], "storan privat" [*big one private*] [10-S25]
    - Finnish "rakennan ässälle" ("I'm building for the ace") [10-S1]
    - Norwegian "bygger 9" [*building 9*] [10-S32]
    - German Wippen "Für 9" [*For 9*] / "Nochmal für 5" [*Again for 5*] [01-S60]
    - Russian "Строю 7" [*I build 7*] / "Строю восьмерки" [*I build eights*] [10-S57]
    - Italian "costruisco un sei" [*I build a six*] [01-S23]
    - Brazilian Portuguese "construindo seis" [*building six*] [10-S49]
  - The duty to ask is also attested. In Danish, if a player forgets to say whether a 4 on a 4 is "8 eller mere 4" [*8 or "more 4"*], "er det modstanderens pligt at spørge" (it is the opponent's duty to ask) [01-S11].

### 6.2 The dealer's "last"
- English: "The dealer must announce "last" when dealing the last cards" [02-S1]. An older Wikipedia text gives "cards" [01-S5].
- The rule is old. "When the last cards are being dealt, the dealer must announce that fact" (1949) [03-S35]. "Before dealing the final round, dealer must announce the fact that it is the last" (1952) [03-S36].
- Other languages:
  - Swedish "sistan" [*the last one*], "båt" [*boat*], "båten går" [*the boat's leaving*], "sista given" [*last deal*] [10-S24]
  - Norwegian "sisten" [*the last*] [10-S32], with a local "døgga" [01-S26]
  - Danish "sidsten" [*the last one*] [10-S37]
  - Brazilian "últimas cartas" [*last cards*] [10-S49]
  - German "Letzte Runde" [*last round*] [02-S29]
- In Norway the call may have scoring consequences. A 2022 Norwegian Wikipedia talk-page comment says that if the dealer fails to announce the last deal "*før* forhånda legger sitt første kort" (*before forehand lays down his first card*), the last-trick point counts only if forehand takes it [01-S27] `[UGC]`.
- Players notice when software drops the cue. "Why has it stopped calling cards? It's no longer notifying it being the last hand. please fix" (13 upvotes) [06-S20]. SpiteNET plays a sound instead [06-S34].

### 6.3 Counting, claiming and challenging aloud
- **Showing:** "each player counts his cards face downward, and announces the number" [03-S31].
- **The count read aloud as a chant:**
  - The English translation of a Feydeau farce stages "Cards... Spades... Ten of diamonds..." / "Deuce... Aces..." and ends "Clean sweep! You owe me a hundred francs" [04-S159].
  - Hungarian novelist Tandori writes the chant "Laptöbbség! pikktöbbség! nagy k., kis k., a négy ász" (Card majority! Spade majority! big c., little c., the four aces!) [10-S56].
  - In a snowbound Norwegian cabin "guttungen fører regnskapet og teller sammen og leser opp stillingen" (the little boy keeps the accounts, adds up and reads out the score) [10-S29].
- **Claiming out:**
  - "I have three points, and am out" (*New York Dispatch*, 1881) [04-S130].
  - "In playing cassino the one claiming game first wins" (*Police Gazette*) [04-S133].
  - Hungarian "Ausz!" / "Ausz vagyok!" / "Kint vagyok!" ("Out!" / "I'm out!") [01-S20][02-S3]. A player who fails to declare and is beaten to it loses [01-S20].
  - Pasur "per shodam" ("I'm full") [02-S14].
- **Challenging:**
  - Hungarian "Fals!" [*False!*] [01-S20].
  - English rules say "every mistake must be challenged immediately" [03-S15].
  - Dominican players customarily point out *dejado* / *pisado* ("left behind" / "stepped on") cards their opponent missed [02-S3].
  - A 2005 Spanish-language forum post says players shout "¡Asoplo!" [*Blow!*] to claim an opponent's missed 15 [05-S52] `[UGC]`.
- **Agreeing house rules before the deal**, as Jack London scripts it in 1912 [04-S28]:
  - "Do you count sweeps?" / "Certainly not … That's a sissy game."
  - "Cards and spades go out first, of course, and then big and little casino, and the aces in the bridge order of value. Is that right?"
  - "Low deals."
- **Generosity on a tie** (*Harper's Bazaar*, 1883) [04-S135]:
  - "The cards are a tie, Katy, so neither of us takes that point."
  - "let's count it. You may have it."
- **Superstition** (*Birmingham Age-Herald*, 1912): a winning player "slapped his cards down and said: 'Boys, I'm going to die'" [04-S137].
- **Austen's verdict on Cassino table talk:** "Scarcely a syllable was uttered that did not relate to the game" [04-S16].

### 6.4 Barks by tradition (from note 05)

Legend for **Status**: **R** = required/regulated by the rules (silence or misstatement has a consequence); **C** = customary (documented as habitually said, not required); **T** = taunt/banter; **D** = documented only in a single user-generated or promotional source (treat as flavour, verify with native speakers before shipping).

#### 6.4a Anglo-American Cassino (English)

| Moment | Line(s) | Status | Notes | Source |
|---|---|---|---|---|
| Making a single build | **"Seven."** / **"Nine."** / **"Ten."** (19th c.); **"Building eight."** / **"Building seven."** / **"Building 5."** (modern) | R | 1867: build announced in the **singular** — "'Nine' or 'Ten'—not 'Nines' or 'Tens'"; Pagat: "must announce the capturing number (saying, for example, 'building 5')" | [05-S8, 05-S9, 05-S1, 05-S76, 05-S77] |
| Raising (increasing) a build | **"Nine."** → **"Ten."**; **"Building nine."** | R | 1867 dialogue: dealer says "Seven," opponent throws a Deuce and says "Nine," dealer adds Ace and "cries 'Ten'"; Foster: "announcing the total value, 'Ten.'" | [05-S8, 05-S9, 05-S11, 05-S1] |
| Making a multiple (locked) build | **"Two Sevens."** / **"Two Nines."** (Foster); **"Building eights."** / **"Building fives."** / **"Building xes"** (modern) | R | Foster: "announcing the build as 'Two Sevens.' This cannot be increased"; BGG reviewer: "announcing 'building xes'"; Denexa: "a 5 was played on another 5 with a declaration of 'Building fives', the build could not be captured with a 10" | [05-S11, 05-S74-BGG85266, 05-S76] |
| Calling (locking a pair) | **"Fives."** / **"Treys."** / **"Fours."** (19th c.); **"Calling 5."** / **"Calling 8."** (modern) | R | 1867: "calling out (not Five, but) 'Fives'"; "In calling the denomination, the plural is always used"; modern YouTube/website rules say "calling 5", "calling 8" | [05-S8, 05-S9, 05-S78, 05-S77] |
| Build-and-call (adding a duplicate to own build) | **"Fours."** (repeated) | R | 1867 Law 9: "repeating his announcement … call (not Four, but) 'Fours'" | [05-S8] |
| Building for partner | **"…for partner"**; **"two Eights"** (built on partner's 8); **"building 9 for partner"** | R | Pagat; Dominican variant "must always announce 'for partner'"; Foster "'two Eights,' called, although the player has no 8" | [05-S1, 05-S12, 05-S11] |
| Combining (no build) | (calling attention) | C | Foster: player "may combine these three cards, calling attention to the fact that their collective value is 9" | [05-S11] |
| Opponent's unclear build | "**What are you building?**" (implied) | C | 1867: unclear build → opponent "may separate the cards"; Danish: opponent's "pligt at spørge, hvad det er, man bygger" [*duty to ask what is being built*] | [05-S8, 05-S43] |
| Dealer deals the final round | **"Last."** | R/C | Pagat: "The dealer must announce 'last' when dealing the last cards"; BGG user calls the end "how EPIC the 'last' round is" | [05-S1, 05-S74-BGG1156351] |
| Taking the last cards | (no fixed line) | — | Foster: "The last trick is usually made by the dealer, who always keeps back a court card" | [05-S11] |
| Sweep / clear | **no traditional English sweep shout found** | — | Sources describe *marking* a sweep (capturing card turned face up "at the bottom of the tricks") rather than a call. Family-variant evidence: Swedish-heritage family playing reverse Cassino says **"Sweep 9"** to warn of a forced sweep | [05-S11, 05-S1, 05-S92] `[UGC]` |
| Counting at hand end | announce card count; claim spades, Cassinos, aces | R | Foster: "each player counts his cards face downward, and announces the number … then turned face up, and the spades counted and claimed" | [05-S11] |
| Reaching 21 mid-hand | claim the game ("count out") | R | Foster: "The moment he reaches 21 he should claim the game … If he is mistaken … he loses" | [05-S11] |
| Challenging an error | challenge "immediately" | R | "every mistake must be challenged immediately"; Foster: before "the next trick is taken in" | [05-S7, 05-S8, 05-S11] |
| Tuxedo (Cassino variant) | **"Orange!"** | R | must call to score; others can steal it; false call −10 | [05-S12] |
| Whole-round shutout | "skunking" | D | family usage | [05-S91] `[UGC]` |
| Period flavour (public domain) | **"I do long for a game of cassino — that is, in the family way — just for a trifle; — I never lose much, you know."** | — | Mrs. Scatter in Reynolds, *Cheap Living* (1797) | [05-S5] |
| Period flavour | "Their table was superlatively stupid. Scarcely a syllable was uttered that did not relate to the game" | — | Austen 1813 on Miss De Bourgh's cassino table | [05-S6] |

#### 6.4b Nordic Kasino

| Moment | Line(s) | Translation | Status | Source |
|---|---|---|---|---|
| Dealer deals last cards (SE) | **"Sistan!"**, **"Båt!"**, **"Båten går!"**, **"Sista given!"** | "The last one!", "Boat!", "The boat's leaving!", "Last deal!" | R (should warn) | [05-S14, 05-S32, 05-S34] |
| Dealer marks last round (DK) | **"Sidsten!"** | "The last!" | C | [05-S43] `[unsourced wiki]` |
| Single build (SE) | **"Bygger till elva."** / **"Bygger till knekt."** / **"Bygger till tretton / kung."** | "Building to eleven / to jack / to thirteen / king" | R ("Spelaren annonserar sedan byggets värde" [*The player then announces the value of the build*]) | [05-S34] |
| Compound build (SE) | **"Två åttor."** / **"Tre tior."** | "Two eights." / "Three tens." | C | [05-S34] |
| Locking same rank (SE) | **"Ligger."** / **"Åttan ligger."** / **"Knekten ligger."** | "It lies." / "The eight lies." | C | [05-S34] |
| Build only the 10♦ can take (SE) | **"Storan privat."** | "Big one, private." | C ("Vissa spelare…" [*Some players…*]) | [05-S34] |
| Single build (DK) | **"Bygger 9."** / locked: **"Mere syv."** | "Building 9." / "More seven." | R/C | [05-S43] |
| Single build (FI) | **"Rakennan ässälle."** / **"Rakennan yhdeksikölle."** / **"Rakennan kuutoselle."** | "I'm building for the ace / the nine / the six." | R (must "sanoa selvästi" [*say clearly*]) | [05-S40] |
| Sweep (SE/FI/DK) | **"Tabbe!"** / **"Mökki!"** / **"Svupper!"** | the sweep nouns | **Not documented as shouted**; documented as the *name* of the event (e.g., "gjort en tabbe" [*made a tabbe*], "saa mökin" [*gets a mökki*], "får en 'svupper'" [*gets a "svupper"*]) | [05-S33, 05-S39, 05-S44] |
| Cancelling opponent's sweep (FI) | **"Mökki kaatuu."** / "kaadetaan mökki" [*a hut is knocked down*] | "The hut falls." | C (descriptive verb) | [05-S40, 05-S39] |
| Setting up a forced sweep (Krypkasino) | **"Tabbe på knekt."** / **"Tabbe på 9."** / "sweep for an ace" / "sweep for a six or a queen" | "Sweep for a jack / for a nine" | C ("It is customary for a player who sets up a sweep to announce it"; "bör säga" [*should say*]) | [05-S15, 05-S33] |
| Claiming 16 mid-deal (SE) | (announce reaching target) | — | R (variant: "kan spelaren annonsera detta" [*the player may announce this*]) | [05-S33] |

#### 6.4c Italian (Scopa family)

| Moment | Line(s) | Translation | Status | Source |
|---|---|---|---|---|
| Sweep | **"Scopa!"** | "Broom!/Sweep!" | C — "usually announced by the player saying 'Scopa!' at the time of the sweep"; Canadian-Italian family: "slap my winning card down and not only shout 'Scopa!'…" | [05-S49, 05-S48] |
| Sweep (gesture) | slam card; "forceful Italian grunts and gestures that loosely mean 'So there!' 'Take that!' or 'Now, who's laughing?!'" | | T | [05-S48] |
| Losing reply | (in-laws' expressions translating as) **"Go shoot yourself!"**, **"Go become a nun!"** | Italian originals not given in source [UNVERIFIED originals] | T | [05-S48] |
| Bluff sweep (Scopa a fidasse) | **"Vi fidate?"** / **"Ti fidi?"** | "Do you (all) trust me?" / "Do you trust me?" | R in that variant | [05-S46] |
| Claiming hand bonus (Cirulla) | knock on table (**bussare**), reveal cards; name the 7's wild value | | R | [05-S27, 05-S47] |
| Turn-taking | **"A chi tocca?"**, **"Tocca a me."**, **"Tocca a te."** | "Whose turn?", "My turn.", "Your turn." | C | [05-S50] `[blog]` |
| Partner signalling | (no words) — "segnalare il possesso di una determinata carta al proprio compagno" [*signal possession of a particular card to one's partner*] by card choice; "questi segnali sono comprensibili anche dagli avversari" [*these signals can also be read by the opponents*] | | C | [05-S46] |
| Wit/etiquette | "Scopa FRAC: Definita scherzosamente 'la scopa più elegante che c'è'" | "jokingly called 'the most elegant scopa there is'" | — | [05-S46] |

#### 6.4d Spanish — Escoba

| Moment | Line(s) | Translation | Status | Source |
|---|---|---|---|---|
| Sweep | **"¡Escoba!"** | "Broom!" | C — rules text calls it an "escoba cantada" (a called escoba) | [05-S51] |
| Claiming opponent's missed 15 | **"¡Soplo!"** / **"¡Asoplo!"** | "Blow!" (cf. huffing in draughts) | D | [05-S52] `[UGC]` |
| Uruguayan Chorizo declarations | **"¡Flor!"**, **"¡Escalera!"**, **"¡Chorizo!"**, **"¡Báciga!"** | combo names | R (declared "immediately before playing the first of their three cards") | [05-S83] |

#### 6.4e Spanish — Cuarenta (Ecuador) — the richest documented bark set

General: "The play is supposed to be full of bravado, loud, exciting, even silly" [05-S19]; "para jugar cuarenta 'hay que ponerse charlatán'" [*to play cuarenta 'you have to turn into a chatterbox'*]; "La idea es desconcentrar al rival para que se olvide las cartas lanzadas" [*the idea is to distract the rival so they forget the cards played*]; "el que más dichos repite debilita a su opositor" [*whoever repeats the most sayings weakens his opponent*] [05-S57].

| Moment | Line(s) | Translation | Status | Source |
|---|---|---|---|---|
| Ronda dealt (3 of a kind) | **"¡Ronda!"** / **"¡Dos por guapo!"** | "Round!" / "Two for being handsome!" | R (must claim before first card; "bajo cualquier frase como … 'dos por guapo'" [*using any phrase such as … "two for being handsome"*]) | [05-S19, 05-S59, 05-S57] |
| Caída (matching previous card) | **"¡Toma, dos por shunsho!"** / **"Dos por shunsho"** / **"Toma por shunsho"** | "Take that, two for shunsho!" | C | [05-S57, 05-S56, 05-S59, 05-S58] |
| Caída (to the scorer) | **"Dos, señor juez."** / **"Dos por favor, señor juez."** / **"Dos, juecito."** | "Two, Mr. Judge." / "Two please, Mr. Judge." / "Two, little judge." | C | [05-S56, 05-S59, 05-S55] |
| Big caída / limpia | **"¡Capariche!"** | (unglossed exclamation) | C | [05-S57] |
| Caída + limpia | **"¡Caída y limpia!"** | "Fall and clean!" | C — earns "el permiso de burlarse de los contrincantes" [*permission to mock the opponents*] | [05-S55, 05-S59] |
| Threat (card on forehead) | **"Con esta te caigo."** | "With this one I'll fall on you." | T | [05-S57, 05-S54] |
| Defiance | **"As que no me caerás."** | "Ace, you won't fall on me." | T | [05-S57] |
| When a 4 is played | **"Cuatrero has de ser."** | "You must be a cattle-thief." | T | [05-S57, 05-S58] |
| Assorted distractors | **"Marido tiene."**, **"José me llamo."**, **"La foto."**, **"Dolido va."** | "She's got a husband.", "My name is José.", "The photo.", "Off he goes, hurt." | T | [05-S56, 05-S58, 05-S54] |
| At 38 points | **"Treinta y ocho que no juega."** | "Thirty-eight doesn't play." | C (rule state) | [05-S56, 05-S59, 05-S54] |
| Shutout (<10 pts) | **"¡Zapatero!"** / **"Zapateros se quedaron."** | "Shoemaker!" / "They stayed shoemakers." | T (losers "deben lustrar los zapatos a los rivales" [*must shine the rivals' shoes*]) | [05-S55, 05-S58, 05-S53] |
| Misdeal | **"Pasa la mano con diez."** | "The deal passes, with ten." | R | [05-S59, 05-S53] |
| Challenge | **"¡Veo y juego!"** | "I see and I play!" | R | [05-S59] |
| Winning | **"Cuarenta, señores, gracias."** | "Forty, gentlemen, thank you." | C | [05-S57] |
| Gesture: caída | card "snapped" down "with great vigor and from well above the surface" — "a purely friendly, but nonetheless rib-poking, gesture"; card raised and thrown "con fuerza" [*forcefully*] | | T | [05-S19, 05-S57] |
| Gesture: prediction | hold the expected card face down near the table, or "on your forehead (facing you, of course)" | | T | [05-S19, 05-S57] |

#### 6.4f Arabic (Chkobba, Basra)

| Moment | Line(s) | Status | Source |
|---|---|---|---|
| Chkobba sweep | **"CHKOBBAAA!"** | D `[promo]` | [05-S67] |
| Capturing 7♦ | **"Sab3a l-7ayya!"** (sabʿa l-ḥayya, "the living seven") | D `[promo]` | [05-S67] |
| Prime | **"Barmīla!"** | D `[promo]` | [05-S67] |
| Surprise / hype / trash talk / bad luck | **"Wesh hadi?!"** [*What's this?!*], **"Yaser ya 3ammi!"** [*That's a lot, uncle! (?)*], **"Rak tel3ab bel 7adh ken!"** [*You're only playing on luck!*], **"Khallini narba7 marra!"** [*Let me win once!*] | D `[promo]` | [05-S67] |
| Gesture | comic gestures "surtout lorsqu'ils font une chkobba ou qu'ils « mangent » le 7 de carreau" [*especially when they make a chkobba or "eat" the 7 of diamonds*]; snapping cards ("faire claquer les cartes, geste technique tunisien par excellence" [*snapping the cards, the Tunisian technical gesture par excellence*]) | C | [05-S66] |
| Etiquette | play fast: "il n'est pas question … de provoquer des temps morts" [*there is no question … of causing dead time*]; speed disrupts card counting | C | [05-S66] |
| Tie on a point | "**bājī**" | C (term) | [05-S66] |
| Basra capture | "the player announces his capture" | C (generic) | [05-S62] |
| Basra slang | jack as "**imam**" that "eats" the floor | C | [05-S20] |

#### 6.4g Persian (Pâsur)

| Moment | Line | Translation | Status | Source |
|---|---|---|---|---|
| Stopping the game at ≥62 | **"Per shodam."** | "I'm full / done." | R (false claim = "made a fool of yourself") | [05-S21] |
| Sweep | **"Sur!"** | the sweep noun | name of event; shout **not documented** | [05-S21, 05-S64, 05-S65] |

#### 6.4h Greek (Xeri / Diloti)

| Moment | Line | Translation | Status | Source |
|---|---|---|---|---|
| Lone-card capture / table-clear | **"Ξερή!"** (*Xerí!*) | "Dry!" | name of the event ("κάνει ξερή" [*makes a xeri*]); explicit shout **not documented in fetched sources** | [05-S22, 05-S23, 05-S70] |
| Declaring a pile (Diloti) | "**eight**" (Pagat's English rendering of a plain declaration; the Greek wording is not quoted in the source); group: **«οκτάρια»** ("eights"); **«σόι»** ("kin") | | C (Pagat: "Usually the player will verbally declare the value … though this is not obligatory"; must clarify if ambiguous) | [05-S23, 05-S72] |

#### 6.4i Turkish (Pişti)

| Moment | Line | Translation | Status | Source |
|---|---|---|---|---|
| Lone-card capture | **"Pişti!"** | "Cooked!" | C — "pişti diyerek yerde bulunan kağıtları alır" [*takes the cards on the table (lit. "on the ground") saying "pişti"*] | [05-S69] |
| After first capture | **"İlk elin günahı olmaz."** | "The first hand has no sin." | C (proverbial) | [05-S68] |

#### 6.4j Other relatives

| Game | Line | When | Source |
|---|---|---|---|
| Hungarian Kaszinó | **"Ausz!"**, **"Ausz vagyok!"**, **"Kint vagyok!"** | stopping at 11 | [05-S12] |
| Catalan Cau Robat | **"Cau!"** → **"Recau!"** → **"Contracau!"** | matching the previous player's non-capturing card, escalating | [05-S29] |
| French-Canadian Mitaines | **"Mitten!"**, **"Glove!"**, **"Sock!"** | starting a pair/three/four | [05-S30] |
| Zwicker (N. Germany) | **"13 for partner"**; "13" / "3" for a queen | build declarations | [05-S28] |
| Dominican Royal Casino | point out "**dejado**"/"**pisado**" cards | after a missed capture | [05-S12] |

---


### 6.5 How real players talk about the game (from note 05)

These are quotations from forums/social media, useful for writing natural-sounding character dialogue and for understanding player expectations. All are `[UGC]`.

**Nostalgia & family transmission**

- "I used to play Cassino with my grandpa growing up." [05-S96]
- "Before she passed, I *did* play Cassino with my grandma (it was a classic for her)" [05-S97]
- "My mom taught me this game almost 60 years ago, when I was learning arithmetic." [05-S74-BGG85266]
- "When I was a child my mom taught me to play Cassino, and it's always been a nostalgic favorite of mine." [05-S74-BGG2988271]
- "Big Casino 10d little casino 2s (from casino, a game I remember playing with my father)" [05-S98]
- "This is a very popular game in my parents' house; they regularly play 'World Series' best-of-7's." [05-S74-BGG597527]
- "I've played for more than 60 years with dozens of other players" [05-S74-BGG3574955]
- Polish-American lineage: "Some of my dad's grandparents came from Poland, and my dad grew up playing Casino" [05-S99]

**Prison/"jail" transmission (US)**

- "I was taught by someone who played in jail a lot" (scoring 10♦ = 3, 2♠ = 2) [05-S100]; reply: "two of them spend a little time in jail. In my Hoyle book, the spelling is casino. Copyright 1947" [05-S100]
- Advice threads about incarceration list "spades, casino, pea knuckle. Domino's" and "Learn to play dominoes, spades, casino, and chess" [05-S101]
- Swedish Mulle is "kåkfararvarianten av kasino" ("the jailbird variant") per Glimne, quoted by [05-S33-index].

**Opinions & arguments (good for rival-AI personality)**

- On sweeps: "Sweeps are not part of the regular rules. They are a variant and we play with them every single time. Why wouldn't you??" vs. "there is virtually no skill in getting a sweep, it's just the luck of the deal" [05-S74-BGG1893693]
- On face cards: "Never part of a build. Ever." [05-S74-BGG1893693]; "you cannot play one on the existing King, call a 'Kings' build" [05-S74-BGG122955]
- On rule-reading: "I would rather it say 'take the cards' than 'snake the flobble'" (about jargon on Pagat) [05-S74-BGG1221271]
- On building rights: "absolutely your move is legal (from no authority, other than the way my in-laws taught me 😁)" [05-S74-BGG3574955]
- On Cassino vs Scopa: "Casino offer more options during play, as Scopa doesn't have builds" [05-S74-BGG952175]
- "Casino is close to my favorite game ever. It is short but strategic" [05-S74-BGG1893693]
- Spelling confusion: "Typing 'Casino' into the App store search function just yields a list of gambling apps!" [05-S74-BGG826479]
- Pronunciation: grandma's "Cassino" "Pronounced 'Cersina'" [05-S90]

**Regional identity**

- US Northeast: Pagat has "two reports of a version played by some in Connecticut and New York state in which 3 points are scored for the 10 of diamonds, 2 points for the 2 of spades and just 1 point for taking most cards" [05-S1]. A 2025 Reddit poster taught "by someone who played in jail a lot" reports the same values ("10 of spades [sic] (big Cassino) 3 pts, 2 of spades (little Cassino) 2 pts … most cards 1 pt"); a reply: "We play 10 Diamonds is 3 points" [05-S100] — two independent sightings of the same house rule.
- Dominican Republic: "Royal Cassino … the national card game of the dominican republic" [05-S95]
- Ecuador: Cuarenta's World Championship organised by the Asociación de Periodistas Deportivos de Pichincha since 1968, with oath ("juramento de rigor" [*the customary oath*]) taken by the Reina de Quito [05-S55, 05-S58]
- South Africa: an association (KASA) runs Khasino leagues/tournaments [05-S81]; YouTube "Khasino Game Play … 40 on Deck" [05-S80]
- Haiti: "Haitian Card Game 'Casino'" taught by a parks programmer (CreekTV) [05-S80]

---


### 6.6 Voice-over implications (synthesis)
- **Attested and rule-bearing:**
  - Build calls in singular and plural form [03-S15][03-S20].
  - "Last" [02-S1].
  - Count-out claims [03-S31].
  - These have the strongest historical warrant for mandatory lines.
- **No traditional English sweep shout was found.** English sources describe *marking* a sweep, not shouting one [05 §3a]. The noun "clear" [02-S1], the 1878 phrase "clean sweep" [04-S102] and Feydeau's "Clean sweep!" [04-S159] are the closest attested English words.
  - Shouted sweeps are documented for "Scopa!" [05-S49], "¡Escoba!" ("cantada", i.e. called out) [05-S51] and "Pişti!" [05-S69].
  - The Nordic nouns (*tabbe*, *mökki*, *svupper*) are documented as names, not exclamations [05 §3b].
- **Chatter systems.** Ecuadorian Cuarenta treats noise as strategy: "La idea es desconcentrar al rival para que se olvide las cartas lanzadas" (the idea is to distract your rival so they forget which cards have been played) [05-S57]. A player who makes a *caída y limpia* earns "el permiso de burlarse de los contrincantes" (permission to mock the opponents) [05-S59].
- **Flavour lines that fire on suit** are available in Finnish card-table puns, e.g. "Pata putos, muttei särkynyt" ("the pot [= spade] fell but didn't break") [10-S2].
- **Accessibility.** Spoken move announcements are the digital equivalent of the old calls. They are already used for TalkBack/VoiceOver in Scopa apps [06-S40][06-S41].
## 7. Scorekeepers, tools and digital implementations

### 7.1 Two centuries of physical scoring aids
- **Counters (1790s–1800s):**
  - The 1793 poem's three-handed game needs "Six Counters … to score with" [11-V-S2].
  - The German 1797 rules print a counter layout ("Man marquirt auf folgende Art", one marks as follows) [10-S41]. So does the 1810 *Spielalmanach* [01-S83].
  - The Polish 1821 almanac opens with a "Tablica do Oznaczenia Gry", a chart of counter patterns for marking 1–9 points [10-S46].
  - In 1804 Martha Wilmot in Russia bought "a little box of Cassino Markers of tortoiseshell" as a gift [04-S36].
- **Paper, counters or a cribbage board (1897):** "the score may be kept with counters, on a sheet of paper, or on a cribbage board" [03-S31].
  - Spade Cassino is built around pegging: "every point being pegged immediately … Sixty-one points is game, once round the board and into the game hole" [03-S23].
  - Porrazo, a Mexican-American relative, is also played to 61 on a cribbage board [09-S26].
- **The face-up sweep card**, found throughout the family:
  - "Sweeps are usually marked by leaving the cards with which they are made face upward at the bottom of the tricks" [03-S31].
  - Opposing sweeps "are sometimes turned down to cancel one another" [03-S31]. The earliest rule found is in Dick (1894): "the players turn the canceled Sweep cards down" [03-S22].
  - The USPCC (1952) explains why: "so the cards representing sweeps will be facing the other way and may be picked out easily" [03-S36].
  - Finnish players lay the card crosswise and prefer a non-scoring card "pistelaskun selkeyttämiseksi" (to keep the scoring clear) [01-S17].
  - Swedish players slide each *tabbe* card under the pile at a right angle, "något förskjutet" (slightly offset) from the last one, which makes a visible tally [10-S24].
  - Mulle, where capture piles are face up, inverts this: a *tabbe* is a face-*down* card [01-S37].
  - Hungarian players instead draw lines on a slate [02-S3].
- **Spare cards as score markers:** Ecuadorian Cuarenta uses the removed 8s, 9s and 10s. Face up counts 2 points; face down counts 10, a *perro* ("dog") [02-S13].
- **Commercial products:**
  - Winning Moves' boxed *Scopa* (2011) contains "2 scoring cards (for your reference), pad of score sheets", with an "s" for each scopa [06-S11].
  - **No Cassino-specific score pad, peg board or patented counter was found** [06 §1.7–1.8].
  - The patents that do exist reskin Cassino's scoring:
    - Clarke's 1898 "casino domino", which kept "Big casino (ten of diamonds) shall count two points" [06-S12].
    - Adams's 1911 word-building deck, "played as in the game of casino… a player may build, as in casino" [06-S13].
- **Audit affordances:**
  - "only the last trick gathered can be seen" [03-S31].
  - Hungarian players move captured cards toward themselves "hogy az ellenfél összevethesse azokat" (so the opponent can check them) and keep piles in order so the last capture can be audited. This supports the "Fals!" challenge [01-S20].
  - In Escopa, the leftover table cards must total 10, 25, 40 or 55, "não havendo um destes valores significa que houve erro" (any other total means there was an error) [09-S66].
  - Foster's 11-point total plays the same role [03-S31].
- **Live clinch thresholds:**
  - Players "count the points as they are earned … spades or cards as soon as one player has captured 7 or 27 of them respectively" [02-S1].
  - A Reddit user asks, "Is it allowed to stack or track your spades separately so you can see if you have yet won seven?" This is an unmet need a digital game can meet [02-S63].

### 7.2 Digital landscape (2026)
- **Small market:** the leading Cassino app has about 166,000 Android installs, far behind the leading Scopa app (see the scale comparison below) [06 §2.1].
- **Board Game Arena:** "Available since Apr 7th 2025", with 2,653 games played [06-S31].
- **No Cassino on Steam** [06-S37].
- **Not in the big compilations:** no Cassino in *Hoyle Card Games* or *Clubhouse Games* [06-S38].
- **Open-source projects:** come largely from Finnish university courses and South African developers [06-S53][06-S56][06-S57].
- **Roguelike trend:** *Scopa Sweep* is a "Traditional Italian Scopa card game turned roguelike" [06-S37]. The Finnish *Kasino* app has a dungeon-style "Trials" mode [06-S24].

#### Mobile catalogue (from note 06)

| App (developer) | Installs (exact) | Rating (n) | Released | Rules / modes noted | Source |
|---|---|---|---|---|---|
| Cassino Card Game (Zol's Apps) | 165,691 | 3.99 (1,121) | Apr 2014 | 2 players; match to 21; sweeps; "Daily-5" same-deal competition; PvP | [06-S19] |
| Casino Card Game (Paris Pinkney) | 139,313 | 3.74 (997) | May 2013 | first hand deals 6 cards, then 4; "build, stack and capture" | [06-S20] |
| G4A: Cassino (Games4All) | 37,779 | 3.71 (386) | Jun 2013 | 3-handed (you vs 2 AIs: "Cary", "Laura") | [06-S21] |
| Cassino Card Game SA (DZ Code) | 27,545 | 3.71 (ZA store) | Feb 2025 | South African 40-card, 10-card hands, two rounds; online ELO; 4-player pairs; "shiya" button | [06-S22] |
| Kasino – Cassino Card Game (O-P Card House, Finland) | 16,073 | — | May 2026 | Nordic rules; "dungeon-style" Trials with bosses and relics; no ads | [06-S24] |
| Cassino Card Game Classic (DZ Code) | 2,292 | 2.71 (17) | Nov 2020 | 52-card classic, vs computer | [06-S23] |
| Pocket Cassino (Pocket of Games) | 652 | iOS 3.75 (4) | Jun 2024 | customizable rules; spectator mode; subscription $2.99/mo | [06-S25] |
| Cassino! (Michael Dokken), Android | 276 | — | Jun 2026 | 1–3 AIs; Easy/Medium/Hard/Insane; variation builder; replay mode | [06-S27] |
| Cassino Pro (Sizo Develops II) | 59 | — | Jun 2026 | SA 40-card; room codes; LAN | [06-S48] |

iOS:

- **Cassino! (Michael Dokken):** 3.76 stars from 302 ratings, released 2012-09-13, v2.5. Supports "2 player, 3 player, and 4 player… Local multiplayer games can be played over bluetooth or wifi. Online… through game center… Turn-Based"; "Four difficulty levels"; variations "Royal, Draw, Sweep, Other Variations"; tutorial; statistics. [06-S26]
- **Cassino Royale (PikeSquare, 2026):** "Training mode suggests your best move — and explains why • It even explains the computer's moves"; "A new Daily Challenge every day — the same deal for everyone"; "Pass & Play: two players, one device"; "Large, readable cards designed for comfortable play at any age"; "No ads. No data collection." [06-S28]
- **Casino Card Game (Paris Pinkney):** 4.33 stars from 6 ratings on iOS. [06-S30]

**Scale comparison with relatives.** On the same day, the leading Scopa app had about 75 times the installs of the top Cassino app (Zol's, 165,691 [06-S19]). The leading Basra and Chkobba apps had about 3–5 times as many, and the leading Pasur app had fewer:

- Scopa: *Scopa: la Sfida* (WhatWapp) 12,339,804 installs and 4.36 stars (229,507 ratings); *Scopa originale Dal Negro* 3,560,675; *Scopa (Broom)* (Lisitso) 1,888,672; *Scopa!* (Escogitare) 1,637,117; *Scopa Più* 1,221,038; *Scopa 15* (Escoba) 865,798. [06-S40]
- Others: *Egyptian Basra v2* 831,177; *Egyptian Basra – كوتشينه* 532,117; *Chkobba Tn* 531,113; the Iranian Pasur app *چهاربرگ آنلاین 11* 142,848; *Xeri+* 68,376. [06-S42]
- iOS: *Scopa!* (Marcarelli) 4.73 stars from 3,743 ratings; *La Scopa* (OutOfTheBit) 4.72 from 3,322; *Pasur11* 4.63 from 1,239; compared with Cassino!'s 302 ratings. [06-S30][06-S43]


### 7.3 How builds are shown on screen
- **Numeric labels:**
  - Psellos labels each build pile with its value [06-S33].
  - SpiteNET treated missing labels as a bug worth a version fix: "If you have version 1 and the numbers on your Build piles don't show… please update" [06-S34].
- **Ownership and value pickers:**
  - Southern African rules: "Each build has an owner" [06-S4].
  - One open-source implementation draws an owner style for each build and opens a modal to choose its value [06-S57].
- **The worst failure is inferring intent.**
  - Paris Pinkney's app made players start "from the middle" [06-S20].
  - Users complained: "Controls are so horrible you cannot know whether the app will build or take!" [06-S20].
- **Rule asymmetry between human and AI** produced the most specific complaints, for example "Can't build on what the bot builds, but the bot can build on what you build" [06-S19].

### 7.4 Captures, sweeps, pace and score screens
- **Explicit selection plus legal-play buttons.** In Psellos, "As you select and deselect cards, the blue buttons at the bottom change to show the legal plays for the selected cards" [06-S33].
- **Staging and refereeing.** SpiteNET holds the played card "slightly above the table until the End Turn button has been clicked". It refuses illegal moves "and display[s] an appropriate message explaining why" [06-S34].
- **Pace.** Players complain both ways:
  - "The app/computer moves WAY to fast. I can't determine what card the app used sometimes" [06-S20].
  - "The gameplay is incredibly slow with no option to speed it up at all" [06-S21].

  Shipped fixes are speed sliders, move logs, and an AI that "turns over the card it plans to play and selects the cards from the table" before playing [06-S27][06-S60][06-S33].
- **Score breakdowns** are the most requested missing feature. "At the end of each game, I want to see a point breakdown summary" [06-S20]. Psellos shows live counts of cards and spades during play [06-S33].

### 7.5 Fairness and AI opponents
- **"The computer cheats"** is the dominant negative review theme across Cassino, Scopa, Basra and Pasur apps [06 §8]:
  - "The cpu gets the Big Cassino 95% of the time" [06-S19].
  - "La sequenza di carte… sembra leggermente 'truccata'" (the run of cards… seems slightly "rigged") [06-S40].
- **Remedies in shipped games:**
  - Replay "with every player's hand revealed" [06-S27].
  - Same-deal daily challenges [06-S19][06-S28].
  - Difficulty defined only by "how many cards it remembers" [06-S42].
  - Fair-information AI. Di Palma & Lanzi describe plain MCTS as "a cheating player" and ISMCTS as "a fair player" [06-S49].
- **Personalities and chatter:**
  - Thorium's Kasino has "AI personalities… *Reno the Risk-taker*, *Cautious Cara*" and "AI table-talk (chat)" [06-S60].
  - A South African project has "Sipho (Aggressive)… Thandi (Patient)… Naledi (Calculating)… They only see what a human sees" [06-S56].

### 7.6 Design lessons with evidence (from note 06)

1. **Every build gets a visible value label, an owner marker, and a "locked/raisable" state.**
   - Shipped games put the number on the pile (Psellos, SpiteNET), and SpiteNET treated missing numbers as a bug worth a version fix. [06-S33][06-S34]
   - The physical rules distinguish raisable single builds from fixed multiple builds ("Two Sevens… cannot be increased"). [06-S1, p. 444][06-S62][06-S34]
   - Southern African rules make ownership a formal concept. [06-S4][06-S56]
   - Players still say "can't change a stack into a number". [06-S19]
   - Suggestion: show the label "8", a coloured owner rim, and a lock glyph on compound builds.

2. **Never infer intent between capture, build and trail. Let the player state it, and show only legal options.**
   - Implicit inference produced the most bitter control complaints ("you cannot know whether the app will build or take", "the game automatically TAKES"). [06-S20]
   - Psellos's context-sensitive buttons, SpiteNET's staged card with End Turn, and Malungisa's legal-value picker solve this. [06-S33][06-S34][06-S57]
   - When several captures are possible, list them, as Lisitso does. [06-S40]

3. **Give the human exactly the move generator the AI uses, and say *why* a move is illegal.**
   - "The AI can do X but I can't" is the most specific recurring complaint across Zol's, Pinkney, G4A and Cassino!. [06-S19][06-S20][06-S21][06-S26]
   - SpiteNET's referee explains each rejected move. [06-S34] The Cassino! developer had to explain the rule in reply to a review. [06-S26]
   - An in-game "why not?" tooltip would answer these complaints before they become 1★ reviews.

4. **Build fairness transparency in from day one.**
   - Rigging accusations dominate negative reviews for Cassino, Scopa, Basra and Pasur apps. [06-S19][06-S21][06-S26][06-S40][06-S42]
   - Proven counter-measures: post-game replay with all hands revealed [06-S27]; a "same deal for everyone" daily mode [06-S19][06-S28]; an in-app explainer on streakiness [06-S36]; difficulty defined by card memory, not information or luck [06-S42]; an explicit "no rubber-banding" promise. [06-S48]
   - Use a fair-information AI (ISMCTS-style) rather than one that peeks. [06-S49]
   - Consider showing the shuffle seed on the replay screen. (Suggestion, not evidenced.)

5. **Show score categories live, with clinch thresholds, and keep the 11-point checksum.**
   - Physical players run mental tallies and claim at 7 spades and 27 cards. [06-S1][06-S2] Psellos shows live card and spade counts. [06-S33]
   - The 11-point invariant would have caught Pinkney's ">11 per round" bug. [06-S1][06-S20]
   - End every hand with a category-by-category breakdown, the most requested missing feature. [06-S20][06-S34][06-S44]
   - Never let ads cover it. [06-S40]

6. **Make "count-out" and claiming a feature, not a hidden rule.**
   - Twenty-one-point Cassino historically ends on a correct claim, and a wrong claim loses. [06-S1][06-S7] Finnish Kasino ends mid-hand when aces and Kasinos are captured. [06-S3]
   - An optional "Claim!" button (or auto-claim) with the traditional count-out order gives these endings their drama. [06-S1][06-S10]

7. **Use the face-up sweep card as the sweep icon.**
   - Across Cassino, Kasino, Scopa and Escoba, players mark a sweep by leaving one card face up or crosswise in the capture pile. [06-S1][06-S2][06-S3][06-S5][06-S8][06-S36]
   - A rotated card in the player's pile (cf. cardgames.io's glowing trick) reads instantly to veterans. [06-S36]
   - Keep the celebration short; a long "Scopa" banner was criticised for freezing play. [06-S40]

8. **Let players control pace, and always make the opponent's last move reviewable.**
   - "Too fast to see what the computer took" and "too slow, no way to speed up" are both common. [06-S19][06-S20][06-S21]
   - Fixes: speed slider [06-S27][06-S40][06-S43]; per-seat play log [06-S60]; a "Last Turn" panel [06-S54]; the AI pre-selecting its capture before taking it [06-S33]; the "picture-in-picture of what the computer picked up" a user asked for. [06-S20]

9. **Treat the rules as a configurable family, with named presets.**
   - Players hold strong and divergent household rules on target score, point values, sweeps, Royal values, deal size, identical-card builds and multiple builds. [06-S19][06-S20][06-S26][06-S22]
   - Successful apps expose a variation builder or presets (Dokken; Pocket Cassino "tailored to your region"; Psellos). [06-S27][06-S25][06-S33]
   - Ship "Classic (Hoyle/Foster)", "Royal", "Spade (61 on a cribbage board)", "Nordic/Finnish to 16", and "South African 40-card" presets. Rules sources: [06-S1][06-S3][06-S4][06-S7][06-S8]

10. **Turn the traditional announcements into UI and audio cues.**
    - Announce build values ("Building nine", "Two Sevens") and the dealer's "Last". [06-S1][06-S2][06-S10]
    - SpiteNET used a sound for "last" [06-S34], and players noticed when an app stopped "calling" the last hand. [06-S20]
    - Spoken move announcements also serve accessibility (TalkBack/VoiceOver in Scopa apps). [06-S40][06-S41]

11. **Design for phones and for older eyes.**
    - Big indices, a large-pip deck option, grid layout on phones, generous touch targets and a landscape option. [06-S60][06-S34][06-S28][06-S19][06-S20]
    - Older players are a core audience. [06-S19][06-S26]

12. **Support the social modes people actually want.**
    - 1v1, 3-handed and 4-handed partnerships [06-S21][06-S19][06-S26]; pass-and-play [06-S28][06-S54]; remote friends and family [06-S19][06-S26][06-S45]; asynchronous turns with reminders [06-S45].
    - Online ranked play needs abandonment handling that does not punish the partner left behind. [06-S22]
    - Format changes such as forced one-hand random matches can alienate a core base. [06-S40]
    - Offer canned table-talk richer than a few phrases, plus blocking. [06-S22][06-S40]

13. **Survive interruptions.**
    - Saving and resuming is expected: "if you leave the screen for anything a text or phone call the game is lost?" [06-S20]; "I switched out of the app… and it gave my capture to the computer". [06-S19]
    - Pasur11 advertises "Resume ability". [06-S43]

14. **Monetise without touching the table.**
    - Short ads only between games were praised ("very, very minimal adds… 1 every 3 or 4 games"). [06-S19]
    - Ads that pop up mid-turn, auto-play your move, or hide results were condemned. [06-S40][06-S42]
    - Several new entrants lead with "No ads". [06-S24][06-S28]

15. **Solve the name problem.**
    - Store searches for "cassino" and "casino card game" return mostly slot machines. [06-S30][06-S52]
    - Dokken's newest listing opens with "Despite the name, it has nothing to do with gambling or real-money casinos". [06-S27]
    - Use "Cassino" with the card-game qualifier everywhere, and consider regional names (Kasino, "Kasi Cassino") in store metadata. [06-S22][06-S24]

16. **Teach building explicitly, and coach in context.**
    - Building is the most confusing part ("doesnt tell you how to build or stack"). [06-S20]
    - Good patterns: Suggest with highlighted alternatives [06-S33]; a coach that explains both your move and the AI's [06-S28]; a hand-scripted tutorial [06-S27]; practice mode with undo [06-S37]. Undo is a common request. [06-S19][06-S20]

17. **There is room for roguelike and progression wrappers around the classic core.**
    - Kasino's Trials/dungeon mode and the Scopa Sweep roguelike suggest a current trend toward rules-mutating runs on top of fishing games. [06-S24][06-S37]
    - The 1911 word-casino patent and a 2020 organic-chemistry "Cassino" teaching game show how far the build/capture core can be re-skinned. [06-S13][06-S65]

18. **Respect the cultures that keep the game alive.**
    - The largest Cassino audience growth found is South African ("Great online Mzansi card game that is played ekasi"; "the most beloved card game from South African townships"). [06-S22][06-S58]
    - Finnish and Nordic players are the other core group, with university course projects and a dedicated Kasino app. [06-S53][06-S24]
    - Americans' attachment is mostly nostalgic and family-based. [06-S19][06-S26][06-S50]
    - Local vocabulary (shiya, drift, mökki) belongs in the UI. [06-S22][06-S56][06-S8]

---

## 8. Statistics

### 8.1 What exists in print, and what doesn't
- **No published quantitative study of Anglo-American Cassino exists.** There is no AI paper, no complexity estimate and no dealer-advantage figure in arXiv, OpenAlex, CrossRef or the thesis repositories searched [07-S1][07-S30][07-S31][07-S32][07-S34].
- **Ludii has no fishing game at all.** Its library has no card-game category [07-S33][02-S65].
- **The closest academic work is on Scopone** (Di Palma & Lanzi, *IEEE Transactions on Games* 10(3):317–332, 2018) [07-S2]:
  - The dealer's ("deck") team wins 45.7% of matches against 41.7% for the other side, with 12.6% ties, under random play (not significant at the 95% level, p = 0.071).
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
These are **policy-conditional** results from four policies (random, greedy, one-ply heuristic with card counting, PIMC), in self-play and mixed matches,, not equilibrium values [07 §6.12]. The engine implements Pagat's standard rules with sweeps scored [07-S40]. Invariants were checked: 52 cards, 13 spades, 4 aces, 11 or 8 non-sweep points [07-S43].

#### 8.4.1 Points per hand by policy (self-play; one "hand" = one full pass of the deck)

| Self-play policy (N hands) | Dealer pts/hand | Non-dealer pts/hand | Dealer − non-dealer [95% CI] | P(dealer wins hand) | P(hand tied) |
|---|---|---|---|---|---|
| random (40,000) | 5.632 | 5.278 | **+0.354** [+0.293, +0.415] | 52.5% | 1.4% |
| greedy (40,000) | 5.254 | 6.400 | **−1.146** [−1.205, −1.088] | 40.7% | 3.7% |
| heuristic (20,000) | 5.305 | 6.177 | **−0.872** [−0.952, −0.792] | 43.1% | 3.8% |

- The standard deviation of points per player per hand is about 2.9–3.1. The standard deviation of the dealer − non-dealer difference is about 5.8–6.2 points.
- Excluding sweeps, the dealer − non-dealer difference is +0.354 (random), −1.236 (greedy) and −0.922 (heuristic) [07-S40].
- **A 26–26 "cards" tie**, which awards nobody the 3 points for cards, occurs in 4.5% (random), 6.9% (greedy) and 7.1% (heuristic) of hands. The scoreboard has to handle it often [07-S40][07 §6.6].


#### 8.4.2 Sweeps

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
- **Sweeps add at most about 0.7–0.9 points per hand (heuristic or greedy), and only about 0.16 under the sweep-averse PIMC style, but they swing games.** Without sweep scoring a game lasts 3.63 hands instead of 3.48 (§8.4.3).


#### 8.4.3 Game length to 21 points (deal alternates, first dealer randomised)

| Matchup (N games) | Mean hands [95% CI] | Hands 2 / 3 / 4 / 5 / 6+ | Winner / loser mean final score |
|---|---|---|---|
| heuristic vs heuristic, sweeps count (5,000) | **3.48** [3.47, 3.50] | 2.3 / 49.7 / 45.4 / 2.5 / 0.1 % | 24.6 / 15.3 |
| heuristic vs heuristic, no sweep points (3,000) | 3.63 [3.61, 3.65] | 0.6 / 40.0 / 54.9 / 4.4 / 0.1 % | 24.3 / 14.8 |
| greedy vs greedy, sweeps (20,000) | 3.40 [3.39, 3.41] | 4.0 / 54.3 / 39.3 / 2.3 / 0.1 % | 24.7 / 15.0 |
| greedy vs greedy, no sweeps (20,000) | 3.63 [3.62, 3.64] | 0.8 / 40.0 / 54.5 / 4.7 / 0.1 % | 24.4 / 14.8 |
| random vs random (20,000) | 3.56 [3.55, 3.57] | 1.5 / 45.1 / 49.6 / 3.8 / 0.1 % | 24.6 / 14.3 |

- Only 0.6–4.0% of self-play games end after two hands, because each hand gives at most 11 points plus sweeps.
- **For session design:** at 52 plays per hand, a typical game is about 180 plays.
- No game ran past 7 hands [07-S40].

#### 8.4.4 Policy comparison (duplicate format: each deck played twice with seats swapped)

| A vs B | A − B points/hand [95% CI] | P(A wins hand) | P(A wins game to 21) |
|---|---|---|---|
| greedy vs random | +5.57 [5.51, 5.63] | 86.9% | 98.3% (10,000 games) |
| heuristic vs random | +7.34 [7.28, 7.40] | 96.0% | 99.9% (2,000 games) |
| heuristic vs greedy | +3.79 [3.72, 3.86] | 75.9% | 91.4% (4,000 games) |


#### 8.4.5 Dealer vs non-dealer: an open question
- The per-hand seat effect is small, and its sign depends on the policy [07-S40][07-S43]:
  - random +0.35, PIMC +0.65, heuristic −0.87, greedy −1.15 points per hand (dealer minus non-dealer).
- Over a whole game it mostly washes out. The first dealer wins 48.4% (greedy) and 48.8% (heuristic) of games to 21 [07-S40].
- The robust positional fact is that **the dealer takes the end-of-hand residue in 60–77% of hands** under every policy [07-S40][07-S43]. This bears out the advice of 1792 ("In the last Deal, a Court-Card or some other ought to be kept to secure the Advantage of the Cards on the Board" [03-S1]) and of 1897 ("The last trick is usually made by the dealer, who always keeps back a court card" [03-S31]).
- Scopone research finds a dealer-side advantage that grows with skill [07-S2]. The Cassino simulations do not settle the direction for strong play, so a stronger agent is needed [07 §6.10].

#### 8.4.6 Skill vs luck
- Under duplicate scoring, a one-ply card-counting heuristic beats greedy play by **+3.79 points per hand** and wins **91.4%** of games to 21 [07-S40].
- In Scopone, by contrast, expert rules beat Greedy by only about 4 percentage points [07-S2].
- In Cassino, look-ahead, card counting and building matter far more than the game's reputation as "a child's game" suggests [07 §6.8][04-S28][04-S7].
- This supports the 1945 assessment that the game "provides wide scope for scientific play and sharp contest of wits" [03-S35].
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

## 10. Cassino beyond English: regional traditions

### 10.1 Highlights
- **Finland (Kasino):**
  - Face cards are 11/12/13. In hand, the ace is 14, *pieni kasino* (♠2) is 15 and *iso kasino* (♦10) is 16; on the table they count 1, 2 and 10 [10-S1].
  - Ten points are scored per deal: most cards 1, most spades 2 [10-S1].
  - A sweep is a *mökki* ("hut"). If the opponent already has one, a new sweep "kaadetaan" (knocks it down) instead of scoring [10-S1].
  - Ties "siirtyvät seuraavaan jakoon" (carry over to the next deal) [10-S1].
  - The game goes to 16 and may end mid-deal [10-S1].
  - The earliest *mökki* found in print is a 1938 pulp story. It sneers at "amerikkalaisittain, ilman mitään mökkejä, sieppauksia ja muuta maallista turhuutta" (the American way, without any mökkis, snatches or other worldly vanity) [10-S6].
- **Sweden (Kasino, Byggkasino, Krypkasino, Mulle):**
  - Lyckans Talisman documents a hand-value *choice*: "Spelaren som står på tur får välja om storan skall räknas som sexton ögon eller de vanliga tio ögonen" (the player whose turn it is may choose whether the big one counts sixteen or the usual ten) [10-S24].
  - It also documents a rich set of calls ("sistan" *last one*, "båten går" *the boat's leaving*, "ligger" *lies*, "trött" *tired*, "storan privat" *the big one, private*, "tabbe på knekt" *sweep on a jack*) [10-S24][10-S25][10-S26].
  - Mulle has margin slang: "hundraklubben" (the hundred club), "senap" (mustard), "ketchup" [10-S26].
- **Norway:**
  - Kasino is listed among "Påskespill" (Easter games), with "Papir og blyant til poengene" (paper and pencil for the points) [10-S32].
  - Strategy tip: avoid table sums of 14, 15 or 16, which an opponent can take with an ace, ♠2 or ♦10 [10-S32].
- **Denmark:**
  - "Spar 5 rydder bordet" (the ♠5 clears the table) [10-S37].
  - The sweep is a "svupper"; "De fleste spiller med at 'svuppere' udligner hinanden" (most play that svuppers cancel each other out) [10-S37].
  - An 1829 rulebook follows the Anglo-German text: "dette kalder man Svep eller Kjørud" (this is called a Svep or Kjørud) [10-S36].
- **Iceland:** a family scores *Stóra-kasína* 5 and *Litla-kasína* 2, with a *svippur* (sweep) worth 1 [10-S40].
- **Germany / Poland:**
  - The 1797 and 1821 texts translate the English rules, with pronunciation notes for "Sweep" and "Lurch" [10-S41][10-S46].
  - Modern German dictionaries have no card-game sense for *Kasino* [10-S43].
  - Zwicker survives in Schleswig-Holstein [10-S44].
- **Hungary:** Kaszinó has 3-card deals, multi-card captures from the hand, "Ausz!" (*Out!*) and "Fals!" (*False!*) [01-S20]. It appears in Tandori's novels [10-S56].
- **Russia:** "сказать: «Строю 7»" (say: "I build 7"); "смести подчистую" (to sweep clean) [10-S57]. A separate folk game, *Скопа*, scores clubs instead of spades [01-S58].
- **Brazil / Portugal:**
  - Casino is little known in Brazil. "Assim mesmo, com um 's' só (pronuncia-se casinó)" (Just like that, with a single 's', pronounced casinó) [10-S49].
  - The fishing game Brazilians actually play is *Escopa/Escova*, brought by Italian immigrants [10-S49][09-S82].
  - Dictionaries define "Cassino grande, o dez de ouros. Cassino pequeno, o dois de espadas" (Big cassino, the ten of diamonds; little cassino, the two of spades) [10-S50].
- **Argentina:** "El Casino o Cassino es un juego de cartas de origen inglés" (Casino or Cassino is a card game of English origin) [10-S53]. Escoba de 15 has an official seniors' tournament regulation [10-S54].
- **Ecuador:** the related Cuarenta is a public festival game with a world championship held since 1968/69 [05-S55][10-S55].
- **Japan:** "ゲーム名は「カジノ」ではなく「カシノ」になります" (the game's name is "kashino", not "kajino" [casino]) [10-S59].
  - Japanese "ビルド" ("build") means capture-by-sum, while the English build is "付け札" (*tsukefuda*, "attached card") [01-S24].
  - This is a localisation trap [01 §2.9].
- **French / Québec:** "gros casino (10 de carreau) 2 points; Le petit casino (2 de pique) 1 point" (*big casino [10♦] 2 points; little casino [2♠] 1 point*) (Mainguy 1987) [10-S62].
- **Afrikaans:** "Bly jy maar hier vanaand by my, en speel kasino, man" (Just stay here with me tonight and play kasino, man; Leipoldt) [10-S61].

### 10.2 Cross-national comparison (from note 10)

| Country / form | ♦10 name | ♠2 name | Hand values ♦10 / ♠2 / A | Face cards | Sweep term and score | Last-deal call or last capture | Majority scoring | Game to | Notes |
|---|---|---|---|---|---|---|---|---|---|
| **Finland**, Kasino [10-S1] | *iso kasino*, *ruutukymppi* | *pieni/pikku kasino*, *patakakkonen* | 16 / 15 / 14 (fixed: hand vs table) | 11/12/13 | *mökki*, +1; cancels the opponent's (*kaataa*); none in the last deal | Leftovers go to the last capturer; no point | cards 1, spades 2; ties carry over ("pakkaan") | 16 (21 with extra-spade rule) | Variants: *laisto-*, *rakennus-*, *pakkakasino* |
| **Sweden**, Kasino [10-S24][10-S28] | *storan*, *storstina*, *stora kasino*; *storkajsa* | *lillan*, *lillstina*, *lilla kasino*; *lillkajsa* | player's choice 16 or 10 / 15 or 2 / 14 or 1 (variants: fixed) | 11/12/13 | *tabbe*/*tabberas* (from *table rase*), +1; offset-card tally | "sistan" / "båten går" / "sista given"; optional *sistan* +1 | cards 1, spades 2 | 16 | Calls: "tabbe på knekt", "storan privat" |
| Sweden, Byggkasino [10-S25] | as above | as above | fixed 16/15/14 | 11/12/13 | tabbe +1 (variant: cancel, or none) | as above | cards **3**, spades **1** | 21 | "bygger till…", "ligger", "två åttor" |
| Sweden, Mulle (2 decks) [10-S26] | *storan* | *lillan* | 16/15/14 | 11/12/13 | tabbe +1; *mulle* = twin capture, scores its pip value | "båten" | 1 per spade | Margin play | "trött", "hundraklubben", "senap", "ketchup" |
| **Norway** [10-S32][10-S29] | *storekasino* (Nynorsk *storekasino*) | *lillekasino* (Nynorsk *veslekasino*) | 16/15/14 | 13/12/11 both ways | *tabbe* +1, card turned face up | "sisten" +1 | cards 1, spades 1 | 16 | "bygger 9", *dobling*; Easter/cabin game |
| **Denmark** [10-S37][10-S38][10-S34][10-S35] | *store kasino* | *lille kasino* | 10 or 16 / 2 or 15 / 1 or 14 | number values | *svupper* +1 (historically *svip*, *svippe*); sweeps cancel | "sidsten" +1 | spades 2, cards 1 | 21 | **♠5 clears the table**; "mere syv" |
| **Iceland** [10-S39][10-S40] | *stóra kasína* (**5 pts**) | *litla kasína* (**2 pts**) | not stated | 11/12/13; A 1/14 | *svippur* (also *borðskeiningur*) +1 | last trick +1 | spades 1, aces (majority) 1, cards 1 | 21 | Unusual weights |
| **Germany**, 1797 [10-S41] | *das große Cassino* | *das kleine Cassino* | none (10 and 2) | pair only | table cleared +1 ("den Tisch räumen") | "Sweep / Kehraus" (last cards) | cards 3, spades 1; subtractive scoring | 11 (Lurch = 5) | 3-handed to 15, count-out order |
| Germany, Zwicker [10-S44] | Karo-Zehn **10 pts** | n/a (♦7, ♠7 1 each) | n/a | K14 Q13 J12 A11 | *Zwicker* 3 | n/a | cards 1 | agreed | Table = "Bild"; capture = *stechen* |
| **Poland**, 1821 [10-S46] | *wielkie Kasino* | *małe Kasino* | none | pair only | "Stół sprząta" +1 | "Sweep albo wymiatacz" | as German | 11 | Counter-marking chart |
| **Hungary** [10-S56] | *nagy kaszinó* | *kis kaszinó* | n/a | n/a | n/a | n/a | *laptöbbség* 3, *pikktöbbség* 1 | n/a | Score chant (Tandori) |
| **Russia** [10-S57] | *большое казино* | *малое казино* | none | pairs (or 3 of a kind) | "смести подчистую" +1 | last capturer | 27+ cards 3; spades 7+ 1 | 21 | "Строю 7" |
| **Brazil**, Casino [10-S49] | *grande casino* / *cassino grande* | *pequeno casino* (folk: *casininho*) | none | pair only | n/a in article | "últimas cartas" | cards 3, spades 1 | 21 | "construindo seis"; called unfamiliar in Brazil |
| **Argentina**, Casino [10-S53]; Escoba [10-S54] | *Gran Casino* (casino) | *Pequeño Casino* | n/a | n/a | Escoba: card face up, 1 per escoba | n/a | Escoba: cartas, oros, setenta, 7 de oro | Escoba 30 | Sum-to-15 arithmetic invariant |
| **Ecuador**, Cuarenta [10-S55] | n/a | n/a | n/a | n/a | *limpia* | n/a | n/a | 40 | *caída*; shouted calls |
| **Italy**, Scopa/Scopone [10-S48] | n/a (*settebello*) | n/a | n/a | 8/9/10 (Italian deck) | *scopa*, card face up | last capture, no scopa | carte, denari, settebello, primiera | 11 or 16 | Matching card must be taken before sums |
| **France/Québec** [10-S62] | *gros/grand casino* | *petit casino* | n/a | n/a | "coups de balai" (translation) | n/a | n/a | n/a | n/a |
| **Japan** [10-S59] | ビッグカシノ [UNVERIFIED: search summary only] | リトルカシノ [UNVERIFIED: search summary only] | none (A = 1) | not numbers; pair only | [UNVERIFIED: search summary only] | n/a | [UNVERIFIED: search summary only] | 21 | 付け札 = build; likened to hanafuda |
| **Greece**, Xeri [10-S60] | 10 καρό = 2 | (2♣ = 1) | n/a | n/a | ξερή 10, with jack 20 | n/a | n/a | n/a | Jack takes all |

(n/a = not stated in the fetched source.)

**Patterns visible in the table:**

1. Apart from the German 1810 *Spielalmanach* and the German Wikipedia text derived from it [01-S83], only the Nordic family gives ♦10, ♠2 and aces higher capture values from the hand.
2. Nordic sweeps usually score 1 and may cancel each other.
3. The English-derived continental texts (German 1797, Polish 1821, Danish 1829, Russian, Brazilian) keep "pair-only" face cards and cards = 3 points.
4. The ♦10 survives as a point card even in other fishing games: Greek Xeri and German Zwicker [10-S60][10-S44].

---


### 10.3 What each Wikipedia edition says (from note 01)

Key: "h/t" = cards to each hand / to the table. Values are as stated in that edition; "—" = not stated. Sources: en [01-S1], da [01-S11], de [01-S14], fi [01-S17], hu [01-S20], it [01-S23], ja [01-S24], nb [01-S26], sv [01-S29], ru [01-S58], nl/de Wippen [01-S59, 01-S60].

| | en (English 1792 / American 1867) | da | de | fi | hu | it | ja | nb | sv | ru «Скопа» | Wippen (nl/de) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Players | 2–4 (Amer. 2,3,4,6) | 2–4 | 2 or 4 (3 var.) | 2–4, pairs | 2 (3–4 var.) | 2–4, pairs | 2 (to 4) | 2–4 (5 var.) | 2–4, best 2 | 2–4, pairs | 2+ (to 6 w/ 2 packs) |
| Deal h/t | 4/4 | 4/4 (in 2s) | 2p: **12**; 3p: **7**; 4p: 4; table 4 | 4/4 (in 2s) | **3**/4 | 4/4 (in 2s) | 4/4 (2×2) | 4/4; point cards on table replaced | 4/4 | 4/4 | 4/4 (in 2s) |
| J/Q/K value | none (pair only); Royal 11/12/13 | implied 11/12/13 ("bygge til 12 (dame)") | 11/12/13 | 11/12/13 | 11/12/13 | none | none | — (old rev: Q=12 example) | 11/12/13 | none | none |
| A / ♠2 / ♦10 special values | — (German 1810: 14/15/16) | 1 or 14 / 2 or 15 / 10 or 16 | 1 or 14 / 2 or 15 / 10 or 16 | 14/15/16 **in hand only** | none | none | none | 14/15/16 in hand | A 1 or 14 | none | none |
| Other special card | — | **♠5 clears table** | — | — | — | — | — | — | — | — | — |
| Building | Amer. yes; English 1792 no | yes ("bygger 9", "mere syv") | yes (bauen) | no (Rakennuskasino var.) | no; but **multi-card hand combos ≤13** | yes | yes (付け札) | yes ("doble") | no (Byggkasino is separate) | no | yes (advanced) |
| Most cards | 3 | 1 or 2 | 3 (≥27) | 1 (ties carry over) | 3 (≥27) | 3 | 3 | 1 | 1 | **2** (26–26: 1 each) | 2 |
| Most spades | 1 | 1 or 2 | 1 (≥7) | **2** (ties carry over ×2) | **2** (≥7) | 1 | 1 | 1 (talk: most play 2) | **2** | most **clubs** 1 | 2 |
| ♦10 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 |
| ♠2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **2♣** 1 | 1 |
| Each ace | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **0** | 1 |
| Sweep | 1 ("sweep") | 1 ("svupper"; cancel) | 1 ("geräumter Tisch") | 1 ("mökki"; cancel; none in last deal) | 1, or **2 on first turn** ("tábla"); opp. moves twice | 1 ("sweep"/scopa) | 1 (スイープ) | 1 ("tabbe") | 1 ("tabbe") | — | 1 ("wip", not last deal) |
| Last capture | 0 | **1** ("sidsten") | 0 | 0 (var. 1) | 0 | 0 | — | **1** | **1** ("sistan") | 0 | 0 |
| Base pts/deal (excl. sweeps) | 11 | 10–12 | 11 | **10** | 12 | 11 | 11 | 10 | 11 (incl. sistan) | 5 | 11 |
| Target | 11 (lurch <6), or each deal a game; 21 (1880) | **21**; closest to 21 wins if several exceed | 21 | **16** (var. 21; exact-16 var.) | **11**, claimed by "Ausz!" | 11 or 21 | 21 | — (talk: 16) | **16** | e.g. 21 | agreed (e.g. 52) |

Notes:

- (a) Spade Cassino (en): every spade 1 and the ♠J +1, 24 points per hand, game 61 [01-S1, 01-S78]; the it edition says 25 [01-S23].
- (b) Finnish ties "jää pakkaan" [stay in the deck] and accumulate [01-S17].
- (c) The de deal sizes conflict with every other edition [01-S14].
- (d) The hu last round is played with open hands [01-S20].

---

## 11. Cassino in culture: literature, social life, idioms

### 11.1 Literature and drama
- **Austen:**
  - Letter of 1800: "There was a whist and a casino table, and six outsiders" [04-S19].
  - *Sense and Sensibility*: "Lady Middleton proposed a rubber of Casino" [04-S17].
  - *Pride and Prejudice*, ch. 29: "Their table was superlatively stupid" [04-S16].
  - *The Watsons*: "Lady Osborne's casino table" [04-S18].
- **Reynolds, *Cheap Living* (1797):** "I do long for a game of cassino — that is, in the family way — just for a trifle" [04-S20][01-S76].
- **Dickens, *David Copperfield* (1850):** "play casino with Mrs. Micawber" [04-S22].
- **Jack London, "A Goboto Night" (1912).** The richest literary transcript of a game, covering house-rule negotiation, card memory and claims [04-S28].
  - Card memory: "I suppose you can name the four cards I hold" / "The knave of spades, the deuce of spades, the tray of hearts, and the ace of diamonds" [04-S28].
  - Claiming: "I go out on little casino and the four aces. 'Big casino' and 'spades' only bring you to twenty" [04-S28].
  - The story was translated into Finnish (1915), Nynorsk (1929), French (1936) and Russian. The translators' choices document local vocabulary [10-S4][10-S30][10-S62][10-S58].
- **O. Henry** uses "big casino" and "little casino" figuratively several times [04-S24][04-S25][04-S26].
- **Later appearances:**
  - Welty's *Delta Wedding*: children "playing cassino" [04-S82].
  - Heyer's Regency pastiche *The Toll-Gate*: "Play cassino with Ben!" [04-S61].
  - Feydeau's farce in English translation: "Clean sweep! You owe me a hundred francs" [04-S159].

### 11.2 Social history
- **1790s London:** Cassino was a craze among the fashionable [09-S70]. Whist players disparaged it in verse: "Who cry, 'Casino! well enough for Chits!'" [04-S21].
- **Stakes were small:**
  - "half a crown is an exorbitant Sum to be sure at 3d cassino" (1804) [04-S45].
  - "just for a trifle" (1797) [04-S20].
- **The game travelled with the gentry:**
  - Berlin (1798): "played Cassino for the first time with Mad: de Haugwitz" [04-S44].
  - Jamaica (1801–05) [04-S46].
  - Russia (1804–08) [04-S36].
- **America, 1870s–1920s:**
  - "Cassino is all the rage in Mineral Point" (1878) [04-S102].
  - "Progressive cassino" parties with head and foot prizes [04-S105][04-S106].
  - Money matches "for $25 a side" (1894) [04-S118].
  - Disputes that turned violent (1900, 1902) [04-S121][04-S122].
  - Courtship: "John proposed to play me a game of cassino to see who should escort Thilda home" [04-S78].
- **Teaching arithmetic:**
  - A 1923 mother reports that her three-year-old "learned to play cassino … that was the way he learned to add". She also invented a "color-cassino" [04-S128].
  - The 1952 USPCC: "no happier introduction to arithmetic was ever devised!" [03-S36].
  - Finnish commenters recommend Kasino for "päässälaskua" (mental arithmetic) [10-S1].
- **Prison transmission** is a recurring thread:
  - Swedish Mulle as "kåkfararvarianten" [01-S72].
  - South African prison and tavern play [01-S8].
  - US players: "I was taught by someone who played in jail a lot" [05-S100].
- **Dual reputation:**
  - "In the average home Casino is known as a children's game, but among gamblers it is known as the finest two-handed game of skill" (Morehead 1944) [02-S30].
  - Parlett suggests the children's reputation is why "their potential depth has gone unnoticed" [04-S50].
- **No organised tournaments.** Chronicling America searches for "cassino tournament", "cassino contest" and "cassino champion(ship)" returned **zero** hits. "Progressive" parties were the competitive format [04 §Gaps].

### 11.3 Idioms that came from the game
- **"Big casino"** (Green's Dictionary of Slang) means [04-S10]:
  - an important person;
  - the ultimate;
  - a fatal disease, especially cancer: "Look, doc, give it to me straight, is it the Big Casino?" (*Ocean's Eleven*, 1960). *The Sopranos* uses it the same way [04-S10].
- **"Little casino"** means something insignificant, and also gonorrhoea [04-S12].
- **"To give someone cards and spades"** means to concede a large handicap. Green's earliest citation is 1861 [04-S13].
  - Extended forms: "could give me cards and spades and big Cassino and then beat me out" (1901) [04-S146].
  - Jack London: "We can give 'em cards and spades an' little casino an' win out on big casino and the aces" [04-S29].
- **Swedish *tabberas*** ("to make a clean sweep") is used figuratively by Astrid Lindgren: "Nu har vi tagit tabberas på allting" (now we've made a clean sweep of everything) [10-S19].
- **Danish "at rydde bordet"** ("to clear the table") is traced to Kasino by Lex.dk [05-S44].
- **The Billy the Kid "Big Casino / Little Casino" nicknames** appear in the film *Chisum* (1970) and on websites. They are **absent** from Garrett's own 1882 *Authentic Life* and from Burns (1926) [04-S52][04-S165][04-S57]. They are probably a 20th-century embellishment, though this is unconfirmed [04 §6].
## 12. Contradictions in the literature, and how they were resolved
Each item was checked against the primary source during this review. The page images are in `research/evidence/`.

| # | Claim in circulation | What the primary source shows | Status |
|---|---|---|---|
| V1 | "The earliest sources use the spelling Casino" (Pagat); Long's title is "…Casino" (Pratesi) [02-S1][09-S70] | Long's 1792 title page reads "CASSINO". The rival 1792/93 poem uses "Casino" and calls Long's spelling an error [11-V-S1][11-V-S2] | Both spellings date from the start; Pagat and Pratesi are wrong about Long |
| V2 | Early rules gave no points for sweeps (Pratesi) [02-S30] | Long (1792): "he clears the Board, and marks one Point in the Game as often as repeated"; the poem (1793): "Whoever clears the Board reckons for each Time one Point absolutely" [11-V-S1][11-V-S2] | Pratesi is right that "sweep" then meant the final take, but wrong about points |
| V3 | Continental Casino derives from Long / "the English rules" (implicit assumption; cf. note 10's "1797 translation of the English rules") [10-S41] | The German 1797 laws translate the 1793 poem (lurch = five, Florentine etymology, three-handed play to 15 with a fixed count-out order) [11-V-S6][11-V-S2] | The Continental line descends from the poem |
| V4 | Building first printed in 1864 [01-S1] | The *American Hoyle*'s 4th-edition preface lists Cassino as "added to the fourth edition"; building is first printed in 1866 (*American Card Player*) [11-V-S3][11-V-S4] | The 1864 date is wrong |
| V5 | "Set-back or Bounce Cassino" [05-S8][01-S79] | Page image reads "Set-back or Rounce Cassino" [11-V-S3] | "Bounce" is an OCR error |
| V6 | "Big Cassino" first in Foster 1897 [05-S11b] | "big cassino" appears in an 1875 sermon and an 1878 newspaper [04-S138][04-S102] | Antedated by about 20 years |
| V7 | Spade Cassino = 25 points per hand (it.wiki) [01-S23] | Foster: "24 points are made in every hand" [03-S23] | 24 |
| V8 | Royal Cassino rules first appear in Foster 1897; Royal Draw in 1911 [01-S1] | Court values 11/12/13 appear in German play by 1810/1846 and in Dick's American variation of 1894; "Royal Draw" appears in 1898 [01-S83][03-S11][03-S22][03-S24] | Older than claimed |
| V9 | Long and the 1793 *Sporting Magazine* contradict each other on the pair trap [08 §3.6] | The magazine merges Long's laws with the poem's "General Rules" and reverses Long's condition; Hoyle kept Long's sense [11-V-S7][03-S6] | Copying slip; the classical maxims trace to the poem |
| — | "Royal Cassino" means face cards have no value (BarGames101) [02-S44] | Royal means courts are 11/12/13 [02-S3] | Web error |
| — | Cassino is Italian (nb, hu, cs Wikipedia; Dick 1866; Lindskog 1847) [01-S26][01-S20][01-S62][03-S14][10-S16] | No Italian game called Casino is attested; Scopa and Scopone are documented later [09-S70][09-S71] | Unsupported tradition. Its earliest printed form is the 1792/93 poem's Florentine etymology [04-S21] |
| — | Cassino is of Chinese origin (sv Wikipedia) [01-S29] | This misapplies a claim about the fishing *mechanism* [01 §2.11] | Unsupported for Cassino itself |
| — | Brazil is a Cassino country (research brief) | Brazil plays Escopa; casino is "radicalmente diferente dos carteados mais populares no Brasil" [10-S49][09-S82] | Not supported |
| — | Kap Tai Shap is a fishing game (research brief) | It is a rummy-type domino game [09-S39][09-S87] | Not supported |
| — | The Billy the Kid "Big/Little Casino" nicknames | Absent from Garrett (1882) and Burns (1926); they appear in the 1970 film *Chisum* [04-S165][04-S57][04-S52] | Probably a 20th-century embellishment |
| — | Ludii has formalised Cassino | No fishing game exists in Ludii [02-S65][07-S33] | Not supported |

## 13. Open questions and gaps
- **Dealer vs non-dealer edge for strong play.** The simulations disagree in sign, so a stronger agent (ISMCTS, CFR) is needed [07 §6.10].
- **Sources not reached:**
  - *The Conjuror's Magazine* (1793) [03 §4].
  - The Vienna/Prague 1795 *Gesetzbuch* and Ulmann (1890) [09 §11].
  - The OED's first citations [04 §Gaps].
  - Parlett's *History of Card Games* and *Penguin* (2008) text [09 §11].
  - Pratesi's archive work beyond his 1995 article [09-S70].
- **Newspapers not searched:** Trove (Australia), Papers Past (NZ), the British Newspaper Archive and Danish Mediestream [04 §Gaps][10 §Gaps].
- **Regional evidence still thin:** Newfoundland, Maritime Canada, Romania and the Brazilian hemeroteca turned up no evidence [04 §Gaps][10 §Gaps].
- **Unresolved etymologies:**
  - *mökki* before 1938 [10 §Gaps].
  - Cuarenta's "shunsho" and "Capariche" [05 §Gaps].
  - *døgga* and Danish *sidsten*, which rest on unsourced wiki text [05 §Gaps].
- **Spoken table talk:** YouTube caption transcripts and regional Reddit communities could not be mined [05 §Gaps]. The **English sweep shout** remains undocumented [05 §3a].
- **No dedicated Cassino scorekeeping product** (pad, board or patent) has been found [06 §1.7–1.8].
- **No strategy literature** was found for Spade Cassino or Draw Cassino [08 §12].
- **Maxims not yet tested in simulation:** building and raising advice, negative inference, the pair trap, seat-dependent cash-card plans and Big Cassino timing. These need a base agent that builds and remembers (§9.4).

## 14. Recommendations for the video game (each traced to evidence above)
1. **Ship rule presets and a variation builder.** Players hold strong and conflicting house rules (§3.2–3.3) [06-S19][06-S22][06-S27]. Suggested presets:
   - *Classic (Pagat/Hoyle 1950s)* [02-S1][03-S36]
   - *Foster 1897 (21 points, count-out claims, raise-own-build)* [03-S31]
   - *Regency 1792 (no building, lurch, difference scoring)* [11-V-S1]
   - *Royal* [03-S24]
   - *Spade (61, cribbage-board scoring)* [03-S23]
   - *Nordic Kasino (16, mökki/tabbe with cancellation)* [10-S1][10-S24]
   - *Byggkasino* [10-S25]
   - *Hungarian Kaszinó* [01-S20]
   - *South African 40-card* [02-S4]
   - *Stealing Bundles (kids)* [03-S36]
2. **Make announcements part of the interface.** From 1867 the spoken build/call was binding, singular for builds and plural for locks [03-S15]. Show labels such as *Building 8* vs *Building 8s / Two 8s*, voice them, and let opponents "separate" undeclared builds in a *Strict 1867* mode [03-S15][03-S25].
3. **Voice the dealer's "Last" and use a sound cue.** Players notice when it is missing [06-S20][06-S34]. Localise it as "sistan / båten går", "sisten", "sidsten", "últimas cartas" [10 §18].
4. **Show the sweep as a rotated face-up card in the capture pile.** This is the near-universal physical convention [03-S31][10-S24][02-S10]. Swedish players offset each one to make a tally [10-S24]. Animate cancellation by turning cards face down [03-S22]. Keep celebrations short [06-S40].
5. **Live trackers:** cards (toward 27), spades (toward 7), cash points and sweeps, with an end-of-hand breakdown checked against the 11-point total [03-S31][02-S1][06-S20][06-S33].
6. **A claim / count-out button with a selectable precedence order**:
   - Foster's (cards first) [03-S31]
   - the 1793 seniority order (Great Casino first) [11-V-S2]
   - no precedence ("Neither cards nor any other point has precedence", *New York Clipper*, 1883) [04-S131]

   Show a penalty for a false claim [03-S31][03-S35].
7. **Never infer intent.** Use explicit capture / build / trail choices that show only legal options [06 §12][06-S33][06-S34]. Give human and AI identical rules, and explain why a move is refused [06 §12.3].
8. **Make fairness visible:**
   - replay with all hands revealed;
   - same-deal daily challenges;
   - AI difficulty defined by memory and inference rather than peeking [06-S27][06-S19][06-S42][06-S49].
9. **AI tiers** following the Scopone template [07-S2][08 §15]:
   - **Greedy:** the bot humans beat most often in Scopone (47.6% wins) [07-S2].
   - **Hoyle 1793/1897 rule bot:** classical maxims, prioritising those the simulations support: courts first, then low cards; keep a court for the end; take the trailed card only as a tie-break (§9.4) [SIM-ST].
   - **Card-counting look-ahead:** beats greedy in 91% of games [07-S40].
   - **ISMCTS.**
10. **Chatter and personality** drawn from attested speech:
    - English build calls, "Last", count-out claims [03-S15][02-S1][04-S28];
    - the Hungarian "Ausz!" and "Fals!" [01-S20];
    - Cuarenta-style taunts as an optional "rowdy table" [05-S57];
    - Finnish suit puns [10-S2];
    - the 1792 poem's personified "Great Casino" and "Casino's younger Brother" for card flavour text [04-S21].
11. **Teaching ladder** modelled on Wippen and Stealing Bundles: pairing → summing → building → raising → multiple builds [09-S61][03-S36]. The arithmetic-teaching heritage is a marketing angle [04-S128][10-S1].
12. **Store naming.** Searching "Casino" returns gambling apps. Use "Cassino (card game)" and regional names (Kasino, Kasi Cassino) [02-S62][06-S27][06-S22].
## Appendix A. Repository map
- `cassino-lit-review.md`: this document (assembled from `drafts/` by `tools/assemble.sh`). `cassino-lit-review.pdf` is built from it by `tools/build_pdf.sh` (pandoc + WeasyPrint, styled by `tools/pdf.css`).
- `research/01-wikipedia.md` … `research/10-multilingual.md`: the ten research notes. Each contains its full, numbered source list, plus quotations and tables too long for this review.
- `research/11-coordinator-verifications.md`: primary-source checks of contradictions (V1–V9).
- `research/evidence/`: page images of the key primary sources:
  - Long 1792 title and pp. 5–7;
  - *American Hoyle*, 4th ed., p. 221;
  - the 1793 poem, p. 31.
- `research/sim/`: simulation code and outputs.
  - `cassino_sim.py`: rules engine and policies.
  - `run_experiments.py`, `mechanism.py`, `pimc.py`, `combinatorics.py`: note 07's experiments.
  - `strategy_tests.py`, `strategy_vs_heuristic.py`, `paired_deltas.py`: the maxim tests in §9.4. Outputs are `strategy_*.json` and `strategy_*.log`.
- `tools/`:
  - `rekey.py`: citation re-keying;
  - `build_bibliography.py`: Appendix B;
  - `check_citations.py`: verifies that every cited key resolves to a bibliography entry.
## Appendix B. Bibliography (all sources, keyed by research note)

Citation keys in the review take the form `[NN-S#]`, where NN is the research note (folder `research/`) and S# is the source number within that note's own source list, reproduced below. `[11-V-S#]` keys refer to the coordinator's verification note. A reference like `[03 §V2]` or `[11 §V4]` points to a section of a research note rather than a single source. Every source was fetched and read during this research session (2 October 2026), unless the note marks it otherwise.


### Note 01: 01 — Wikipedia (all language editions) on Cassino / Casino / Kasino, plus related articles, talk pages, page history, and checks of cited references

(Full note: `research/01-wikipedia.md`)


All sources were fetched 2026-10-02. Wikipedia raw text came from `https://<lang>.wikipedia.org/w/index.php?title=<T>&action=raw` (Norwegian Bokmål is served from no.wikipedia.org), and the rendered text from `api.php?action=parse`. Old revisions came from `index.php?oldid=<id>&action=raw`, and revision lists from `api.php?action=query&prop=revisions`.

**Wikipedia: main articles, talk pages and histories**
- [01-S1] English Wikipedia, "Cassino (card game)", rev 1375945654 (2026-09-21), raw and rendered. https://en.wikipedia.org/wiki/Cassino_(card_game)
- [01-S2] English Wikipedia, "Talk:Cassino (card game)". https://en.wikipedia.org/wiki/Talk:Cassino_(card_game)
- [01-S3] English Wikipedia, revision history of "Cassino (card game)" (432 revisions, 2004-08-31 to 2026-09-21). https://en.wikipedia.org/w/index.php?title=Cassino_(card_game)&action=history
- [01-S4] Same article, first revision, oldid 7039954 (2004-08-31, Halibutt). https://en.wikipedia.org/w/index.php?oldid=7039954
- [01-S5] Same article, oldid 1154273302 (2023-05-11, the pre-rewrite text including the parked/commented section). https://en.wikipedia.org/w/index.php?oldid=1154273302
- [01-S6] Same article, oldid 1084830537 (2022-04-26, California Cassino section). https://en.wikipedia.org/w/index.php?oldid=1084830537
- [01-S7] Same article, oldid 849127505 (2018-07-06, Pluck and Portuguese Cassino). https://en.wikipedia.org/w/index.php?oldid=849127505
- [01-S8] Same article, oldid 1210204755 (2024-02-25, South Africa American cassino). https://en.wikipedia.org/w/index.php?oldid=1210204755
- [01-S9] Same article, oldid 227537442 (2008-07-24, Florida Cassino). https://en.wikipedia.org/w/index.php?oldid=227537442
- [01-S10] Same article, diffs against the previous revision for oldids 94138321, 153705169, 139676511, 62312994, 1084832835, 1084826372, 243378527, 927782050, 987325999 and 1084825818 (edit summaries and changed lines).
- [01-S11] Danish Wikipedia, "Kasino (kortspil)", rev 12158922. https://da.wikipedia.org/wiki/Kasino_(kortspil)
- [01-S12] Danish Wikipedia, "Diskussion:Kasino (kortspil)". https://da.wikipedia.org/wiki/Diskussion:Kasino_(kortspil)
- [01-S13] Danish Wikipedia, history of "Kasino (kortspil)": first revision oldid 472126 (2005-12-25) and diffs 4434706, 9382945, 10565610, 10565613, 10661812, 10661813, 10661845, 10871188, 11201135, 11718228.
- [01-S14] German Wikipedia, "Casino (Kartenspiel)", rev 256341743. https://de.wikipedia.org/wiki/Casino_(Kartenspiel)
- [01-S15] German Wikipedia, "Diskussion:Casino (Kartenspiel)". https://de.wikipedia.org/wiki/Diskussion:Casino_(Kartenspiel)
- [01-S16] German Wikipedia, history of "Casino (Kartenspiel)": diffs 224659875 (origin changed from France to England), 29252884, 33131135, 204507094.
- [01-S17] Finnish Wikipedia, "Kasino (korttipeli)", rev 23498310, raw and rendered. https://fi.wikipedia.org/wiki/Kasino_(korttipeli)
- [01-S18] Finnish Wikipedia, "Keskustelu:Kasino (korttipeli)". https://fi.wikipedia.org/wiki/Keskustelu:Kasino_(korttipeli)
- [01-S19] Finnish Wikipedia, history of "Kasino (korttipeli)": oldid 1879518 (2006 version) and diffs 17767653, 23494138.
- [01-S20] Hungarian Wikipedia, "Kaszinó (kártyajáték)", rev 25838886. https://hu.wikipedia.org/wiki/Kaszinó_(kártyajáték)
- [01-S21] Hungarian Wikipedia, "Kaszinó (kártyajáték)/Példa" (annotated sample game). https://hu.wikipedia.org/wiki/Kaszinó_(kártyajáték)/Példa
- [01-S22] Hungarian Wikipedia, history of "Kaszinó (kártyajáték)": diff 23583678 (2021, screenshot of a computer game removed); talk page "Vita:Kaszinó (kártyajáték)".
- [01-S23] Italian Wikipedia, "Cassino (gioco)", rev 152703178 (created 2026-09-01). https://it.wikipedia.org/wiki/Cassino_(gioco)
- [01-S24] Japanese Wikipedia, "カシノ", rev 106408641. https://ja.wikipedia.org/wiki/カシノ
- [01-S25] Japanese Wikipedia, history of "カシノ": diffs 44277190, 48519596 (2013 history rewrite) and 44848655.
- [01-S26] Norwegian Bokmål Wikipedia, "Kasino (kortspill)", rev 25246971. https://no.wikipedia.org/wiki/Kasino_(kortspill)
- [01-S27] Norwegian Bokmål Wikipedia, "Diskusjon:Kasino (kortspill)" (Bbl, 2022). https://no.wikipedia.org/wiki/Diskusjon:Kasino_(kortspill)
- [01-S28] Norwegian Bokmål Wikipedia, history of "Kasino (kortspill)": oldid 19599819 (2019 version) and diffs 12198338, 7722086, 17023993, 9875671, 24629834, 23955787; page move 6565876 (2010).
- [01-S29] Swedish Wikipedia, "Kasino (kortspel)", rev 59707837. https://sv.wikipedia.org/wiki/Kasino_(kortspel)
- [01-S30] Swedish Wikipedia, history of "Kasino (kortspel)": oldids 6557302 (2008), 14581074 (2011), 43814011 (2018 IP edit), 34296349 (2016) and 51849792 (2023); edit summaries including 14578497 (Paracel63) and 43814351 (Yger).
- [01-S31] Swedish Wikipedia, "Byggkasino". https://sv.wikipedia.org/wiki/Byggkasino
- [01-S32] Swedish Wikipedia, "Krypkasino". https://sv.wikipedia.org/wiki/Krypkasino
- [01-S33] Swedish Wikipedia, "Mulle (kortspel)". https://sv.wikipedia.org/wiki/Mulle_(kortspel)
- [01-S34] Swedish Wikipedia, "Fiskespel". https://sv.wikipedia.org/wiki/Fiskespel
- [01-S35] Swedish Wikipedia, "Kinesisk tia". https://sv.wikipedia.org/wiki/Kinesisk_tia
- [01-S36] Swedish Wikibooks, "Kasino". https://sv.wikibooks.org/wiki/Kasino
- [01-S37] Swedish Wikibooks, "Mulle". https://sv.wikibooks.org/wiki/Mulle

**Wikipedia: related English articles**
- [01-S38] English Wikipedia, "Scopa". https://en.wikipedia.org/wiki/Scopa
- [01-S39] English Wikipedia, "Talk:Scopa". https://en.wikipedia.org/wiki/Talk:Scopa
- [01-S40] English Wikipedia, "Zwickern". https://en.wikipedia.org/wiki/Zwickern
- [01-S41] German Wikipedia, "Zwicker (Kartenspiel)". https://de.wikipedia.org/wiki/Zwicker_(Kartenspiel)
- [01-S42] English Wikipedia, "Pasur (card game)" and its talk page. https://en.wikipedia.org/wiki/Pasur_(card_game)
- [01-S43] English Wikipedia, "Bastra" and its talk page. https://en.wikipedia.org/wiki/Bastra
- [01-S44] English Wikipedia, "Cuarenta" and its talk page. https://en.wikipedia.org/wiki/Cuarenta
- [01-S45] English Wikipedia, "Tablanette". https://en.wikipedia.org/wiki/Tablanette
- [01-S46] English Wikipedia, "Skwitz". https://en.wikipedia.org/wiki/Skwitz
- [01-S47] English Wikipedia, "Byggkasino". https://en.wikipedia.org/wiki/Byggkasino
- [01-S48] English Wikipedia, "Mulle". https://en.wikipedia.org/wiki/Mulle
- [01-S49] English Wikipedia, "Laugh and lie down". https://en.wikipedia.org/wiki/Laugh_and_lie_down
- [01-S50] English Wikipedia, "Escoba del 15". https://en.wikipedia.org/wiki/Escoba_del_15
- [01-S51] English Wikipedia, "Escopa". https://en.wikipedia.org/wiki/Escopa
- [01-S52] English Wikipedia, "Cicera". https://en.wikipedia.org/wiki/Cicera
- [01-S53] English Wikipedia, "Culbas". https://en.wikipedia.org/wiki/Culbas
- [01-S54] English Wikipedia, "Papillon (card game)". https://en.wikipedia.org/wiki/Papillon_(card_game)
- [01-S55] English Wikipedia, "Category:Fishing card games" (member list via API) and redirect checks for Royal Casino, Scopone, Escoba, Basra, Diloti, Xeri→Tseri, Tablanet and Laugh and Lie Down. https://en.wikipedia.org/wiki/Category:Fishing_card_games
- [01-S56] English Wikipedia, "Glossary of card game terms" (entries for lurch, overs, sweep, tableau). https://en.wikipedia.org/wiki/Glossary_of_card_game_terms
- [01-S57] English Wikipedia, "Card game" (section "Fishing games"). https://en.wikipedia.org/wiki/Card_game

**Wikipedia: other languages, unlinked relatives**
- [01-S58] Russian Wikipedia, «Кончинка (карточная игра)». https://ru.wikipedia.org/wiki/Кончинка_(карточная_игра)
- [01-S59] Dutch Wikipedia, "Wippen (kaartspel)". https://nl.wikipedia.org/wiki/Wippen_(kaartspel)
- [01-S60] German Wikipedia, "Wippen". https://de.wikipedia.org/wiki/Wippen
- [01-S61] Spanish Wikipedia, "Escoba (juego de naipes)". https://es.wikipedia.org/wiki/Escoba_(juego_de_naipes)
- [01-S62] Czech Wikipedia, "Pasúr". https://cs.wikipedia.org/wiki/Pasúr

**Data**
- [01-S63] Wikimedia REST pageviews API, per-article, user agent, monthly, 2016-01 to 2026-08. https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/

**Web references cited by the articles (checked)**
- [01-S64] John McLeod, "Casino", pagat.com (last updated 6 May 2026). https://www.pagat.com/fishing/casino.html
- [01-S65] John McLeod, "Nordic Casino" (Kasino in Sweden and Finland, Mulle), pagat.com (last updated 29 May 2017). https://www.pagat.com/fishing/nordic_casino.html
- [01-S66] David Parlett, "Casino", Encyclopaedia Britannica, via WebFetch summary with quoted lines. https://www.britannica.com/topic/casino-card-game
- [01-S67] Mikko Saari, "Kasino", Korttipeliopas (9 July 2010), with reader comments to 2026. https://korttipeliopas.fi/kasino
- [01-S68] Nakoa Davis, "Casino Card Game Rules", GameRules.com. https://gamerules.com/rules/casino-card-game/
- [01-S69] "How to play Casino & Game Rules with Video", PlayingCardDecks.com (2020-07-05). https://playingcarddecks.com/blogs/how-to-play/casino-game-rules
- [01-S70] "Come si gioca a Cassino", CardRules+ (Italian). https://cardrulesplus.com/it/games/cassino/
- [01-S71] "Cassino – card game", gambiter.com (a vandalised mirror of old English Wikipedia text). https://gambiter.com/cards/Cassino_card_game.html
- [01-S72] Lyckans Talisman, card games page (Kasino, Byggkasino, Mulle sections). https://kortspel.lyckans-talisman.se/
- [01-S73] Magyar Elektronikus Könyvtár, "Kártyajátékok szabályai" – KASZINÓ section. https://www.mek.oszk.hu/00000/00056/html/134.htm
- [01-S74] Játékgyűjtemény, "Kaszinó játékszabály" (archived 2009-04-14). https://web.archive.org/web/20090414020649/http://jatek.gyujtemeny.com/jatekszabaly/581.php
- [01-S75] Svenska Akademiens ordbok (SAOB), "mulle", via WebFetch. https://www.saob.se/artikel/?unik=M_1481-0158.2Q3C&pz=5

**Primary sources (archive.org full text)**
- [01-S76] Frederick Reynolds, *Cheap Living: a comedy, in five acts*, London: G.G. & J. Robinson, 1797. Quote on pp. 58–59 of this scan. archive.org id `cheaplivingacom00reyngoog`. https://archive.org/details/cheaplivingacom00reyngoog
- [01-S77] [Lady Sarah Nicolas], *The Cairn: A Gathering of Precious Stones from Many Hands*, London, 1846, p. 128. archive.org id `cairnagathering01nicogoog`. https://archive.org/details/cairnagathering01nicogoog
- [01-S78] R. F. Foster, *Foster's Complete Hoyle*, New York: F. A. Stokes, 1897, pp. 441–448 (Cassino, Twenty-One Point Cassino, Royal Cassino, Spade Cassino). archive.org id `fosterscomplete00fostgoog`. https://archive.org/details/fosterscomplete00fostgoog
- [01-S79] "Trumps" [William Brisbane Dick], *The American Hoyle; or, Gentleman's Hand-book of Games*, New York: Dick & Fitzgerald, 1868 printing (preface refers to 1867 revisions), pp. 217–222 (Cassino, Terms, Laws). archive.org id `americanhoyleorg00dick_2`. https://archive.org/details/americanhoyleorg00dick_2
- [01-S80] [W. B. Dick], *The Modern Pocket Hoyle*, New York: Dick & Fitzgerald, 1868, p. 177ff (Cassino; no 21-point clause). archive.org id `modernpockethoy00dickgoog`. https://archive.org/details/modernpockethoy00dickgoog
- [01-S81] Robert Long, *Short Rules for Playing the Game of Cassino*, London, 1792 (very poor OCR). archive.org id `bim_eighteenth-century_short-rules-for-playing-_long-robert_1792`. https://archive.org/details/bim_eighteenth-century_short-rules-for-playing-_long-robert_1792
- [01-S82] *Hoyle's Games Improved* (ed. Charles Jones), London, 1796, pp. 298–300 ("The Game of Cassino"). archive.org id `bim_eighteenth-century_hoyles-games-improved-b_hoyle-edmond_1796`. https://archive.org/details/bim_eighteenth-century_hoyles-games-improved-b_hoyle-edmond_1796
- [01-S83] [G. W. von Abenstein], *Spielalmanach für Karten-, Schach-, Bret-, Billard-Spieler*, Berlin: Hayn, 1810, pp. 156–164 ("Das Casinospiel"). BSB copy on archive.org, id `10431527bsb`. https://archive.org/details/10431527bsb

**Other**
- [01-S84] Wikidata, Q1047595 "Cassino — fishing card game" (found via the wbsearchentities API). https://www.wikidata.org/wiki/Q1047595


### Note 02: 02 — Pagat.com and modern rules websites: Cassino/Casino rules, variants, terminology, strategy, disagreements

(Full note: `research/02-pagat-and-modern-rules.md`)


- [02-S1] John McLeod, "Casino", pagat.com, last updated 6 May 2026. https://www.pagat.com/fishing/casino.html
- [02-S2] McLeod, "Card Games: Fishing Games" index, pagat.com (updated 24 June 2025). https://www.pagat.com/fishing/
- [02-S3] McLeod, "Royal Casino" (Dominican, North America, Haiti, Tuxedo, Hungarian), pagat.com (updated 3 Jan 2023). https://www.pagat.com/fishing/royal_casino.html
- [02-S4] McLeod, "African Casino" (Swazi, Sotho, South African), pagat.com (updated 1 Sept 2026). https://www.pagat.com/fishing/african_casino.html
- [02-S5] McLeod, "Nordic Casino" (Swedish Kasino, Mulle, Finnish Kasino), pagat.com (updated 29 May 2017). https://www.pagat.com/fishing/nordic_casino.html
- [02-S6] McLeod, "Krypkasino", pagat.com (updated 1 Sept 2026). https://www.pagat.com/fishing/krypkasino.html
- [02-S7] McLeod, "Stealing Bundles", pagat.com. https://www.pagat.com/fishing/bundle.html
- [02-S8] McLeod, "Zwicker", pagat.com (updated 1 Sept 2026). https://www.pagat.com/fishing/zwicker.html
- [02-S9] McLeod, "Diloti", pagat.com (2018). https://www.pagat.com/fishing/diloti.html
- [02-S10] McLeod, "Scopa" (incl. Chkobba, Hurrikan), pagat.com (updated 3 Sept 2025). https://www.pagat.com/fishing/scopa.html
- [02-S11] McLeod, "Scopone", pagat.com. https://www.pagat.com/fishing/scopone.html
- [02-S12] McLeod, "Escoba", pagat.com. https://www.pagat.com/fishing/escoba.html
- [02-S13] McLeod, "Cuarenta", pagat.com. https://www.pagat.com/fishing/cuarenta.html
- [02-S14] McLeod, "Pâsur", pagat.com. https://www.pagat.com/fishing/pasur.html
- [02-S15] McLeod, "Basra", pagat.com. https://www.pagat.com/fishing/basra.html
- [02-S16] McLeod, "Xeri", pagat.com. https://www.pagat.com/fishing/xeri.html
- [02-S17] McLeod, "Tablić, Tabinet", pagat.com. https://www.pagat.com/fishing/tablic.html
- [02-S18] McLeod, "Snitch'ems", pagat.com (updated 8 Apr 2026). https://www.pagat.com/fishing/snitchems.html
- [02-S19] McLeod, "Laugh and Lie Down", pagat.com. https://www.pagat.com/fishing/laugh.html
- [02-S20] McLeod, "Seep", pagat.com. https://www.pagat.com/fishing/seep.html
- [02-S21] McLeod, "Kontsina", pagat.com. https://www.pagat.com/fishing/kontsina.html
- [02-S22] McLeod, "Cirulla", pagat.com. https://www.pagat.com/fishing/cirulla.html
- [02-S23] McLeod, "Cau Robat", pagat.com. https://www.pagat.com/fishing/cau.html
- [02-S24] McLeod, "Ronda", pagat.com. https://www.pagat.com/fishing/ronda.html
- [02-S25] McLeod, "Porrazo", pagat.com. https://www.pagat.com/fishing/porrazo.html
- [02-S26] McLeod, "Eléwénjewé", pagat.com. https://www.pagat.com/fishing/elewenjewe.html
- [02-S27] McLeod, "Žandari", pagat.com. https://www.pagat.com/fishing/zandari.html
- [02-S28] McLeod, "Shlla'at", pagat.com. https://www.pagat.com/fishing/shllaat.html (also consulted: chorizo, cicera, pishti, mitaines, hockey, gharat, chinten pages under https://www.pagat.com/fishing/)
- [02-S29] McLeod, "Casino" (German edition), pagat.com. https://www.pagat.com/de/fishing/casino.html
- [02-S30] Franco Pratesi, "Casino from Nowhere, to Vaguely Everywhere" (dated 09.10.1994; publ. *The Playing-Card* XXIV/1, 1995, pp. 6–11), PDF at naibi.net linked from pagat. https://www.naibi.net/A/57-CASINO%20-Z.pdf
- [02-S31] R. F. Foster, *Foster's Complete Hoyle: An Encyclopedia of Games* (New York: Stokes, 1897), "Cassino" pp. 478–485 and general laws; Project Gutenberg #53881. https://www.gutenberg.org/cache/epub/53881/pg53881.txt
- [02-S32] United States Playing Card Co., *The Official Rules of Card Games — Hoyle Up-to-Date* (Cincinnati; copyright dates to 1943), "Cassino" pp. 185–188; archive.org in.ernet.dli.2015.174022. https://archive.org/download/in.ernet.dli.2015.174022/2015.174022.The-Official-Rules-Of-A-Card-Games_djvu.txt
- [02-S33] David Parlett, "Casino (card game)", *Encyclopaedia Britannica* online (via WebFetch). https://www.britannica.com/topic/casino-card-game
- [02-S34] David Parlett, "Laugh and Lie Down", Historic Card Games. https://www.parlettgames.uk/histocs/laughand.html
- [02-S35] David Parlett, Historic Card Games glossary. https://www.parlettgames.uk/histocs/glossary.html
- [02-S36] Wikipedia, "Cassino (card game)", current revision (raw, fetched 2 Oct 2026). https://en.wikipedia.org/wiki/Cassino_(card_game)
- [02-S37] Wikipedia, "Cassino (card game)", revision 928360023 of 28 Nov 2019. https://en.wikipedia.org/w/index.php?oldid=928360023
- [02-S38] Gambiter.com, "Cassino - card game" (mirror of older Wikipedia, partly vandalised). https://gambiter.com/cards/Cassino_card_game.html
- [02-S39] CatsAtCards.com, "How To Play Cassino" (© 2015). https://www.catsatcards.com/Games/Cassino.html
- [02-S40] Denexa Games blog, "Cassino". https://www.denexa.com/blog/cassino/
- [02-S41] GameRules.com, "Casino Card Game Rules". https://gamerules.com/rules/casino-card-game/
- [02-S42] Game Rules Guru, "Casino". https://gamerulesguru.com/casino.shtml
- [02-S43] John Taylor, "How to play Casino", PlayingCardDecks.com. https://playingcarddecks.com/blogs/how-to-play/casino-game-rules
- [02-S44] BarGames101, "Cassino Card Game". https://bargames101.com/cassino-card-game/
- [02-S45] Psellos, "Cassino Rules" (via WebFetch). https://psellos.com/cassino/rules.html
- [02-S46] Psellos, "Cassino Strategy". http://psellos.com/cassino/strategy.html
- [02-S47] SpiteNET, "Cassino by SpiteNET — How to Play", About, Screen Shots. http://www.spitenet.com/Cassino/play.htm
- [02-S48] Board Game Arena help wiki, "Gamehelpcassino" (raw). https://en.doc.boardgamearena.com/Gamehelpcassino
- [02-S49] Dan…on games!, "Cassino tips and tricks" (19 Dec 2011). https://danongames.wordpress.com/2011/12/19/cassino-tips-and-tricks/
- [02-S50] CardGames.io, "Escoba" (2025) and site index. https://cardgames.io/escoba/
- [02-S51] Games4All, "Cassino" Google Play listing. https://play.google.com/store/apps/details?id=org.games4all.android.games.cassino.prod
- [02-S52] Wikipedia, "Byggkasino". https://en.wikipedia.org/wiki/Byggkasino
- [02-S53] Cristian Seres, "Kasino in English" (korttipelit.net, Wayback 7 Mar 2013). https://web.archive.org/web/20130307135755/www.korttipelit.net/Kasino_in_English
- [02-S54] "Mulle", vingel8.neocities.org (updated 2018-04-18). https://vingel8.neocities.org/mulle
- [02-S55] BoardGameGeek, "Casino" (id 18121) item data via api.geekdo.com/api/geekitems and /api/dynamicinfo (2 Oct 2026). https://boardgamegeek.com/boardgame/18121/casino
- [02-S56] BGG forums list and Rules thread 1585503 "Rule modification" (2016–2026), via api.geekdo.com. https://boardgamegeek.com/thread/1585503
- [02-S57] BGG review thread 85266 "A simple and elegant card game" (2005; replies 2021–22). https://boardgamegeek.com/thread/85266
- [02-S58] BGG thread 3574955 "Increasing opponent's build to match an existing build?" (2025–26). https://boardgamegeek.com/thread/3574955
- [02-S59] BGG thread 1893693 "Can you Do BOTH a Single Build & a Multiple Build in the Same Turn?" (2017). https://boardgamegeek.com/thread/1893693
- [02-S60] BGG thread 1221271 "how to play - reward 5gg" (2014; quotes grandparents.com). https://boardgamegeek.com/thread/1221271
- [02-S61] BGG Variants threads 122955, 597527, 433043, 1156351, 2988271, 90163, 3239537 and Rules thread 703492. https://boardgamegeek.com/thread/122955 (etc.)
- [02-S62] BGG General threads 952175 "This vs. Scopa?", 826479 "iOS app for Casino?", 1204559. https://boardgamegeek.com/thread/952175
- [02-S63] Reddit r/cardgames posts cb2buo (2019), 1jy1diy, 1jzk7gs (Apr 2025), 1o7oazc (Oct 2025), 3438h8 (2015), ouqa3m (2021), 1e0mqof (2024), retrieved via Arctic Shift API. https://www.reddit.com/r/cardgames/comments/1o7oazc/
- [02-S64] Failed/blocked fetches: bicyclecards.com (404), Wayback CDX for bicyclecards (only 404 captures), wikihow.com (blocked), mastersofgames.com (403), officialgamerules.org (403).
- [02-S65] Ludii: https://ludii.games/details.php?keyword=Cassino ; GitHub API listing of Ludeme/Ludii `Common/res/lud`.


### Note 03: 03 — Historical rulebooks and game manuals for Cassino (1792–1952)

(Full note: `research/03-historical-rulebooks.md`)


- **[03-S1]** Robert Long, *Short Rules for Playing the Game of Cassino* (London: J. Owen; E. Newbery; T. Mortimer, Twickenham, 1792), pp. 3–11. Internet Archive `bim_eighteenth-century_short-rules-for-playing-_long-robert_1792`. Page images read from https://archive.org/download/bim_eighteenth-century_short-rules-for-playing-_long-robert_1792/page/n0_s4.jpg … n10_s4.jpg (details: https://archive.org/details/bim_eighteenth-century_short-rules-for-playing-_long-robert_1792).
- **[03-S2]** Charles Pigott, *Pigott's New Hoyle, or the General Repository of Games* (London, 1795), Addenda "The Game of Cassino". IA `bim_eighteenth-century_pigotts-new-hoyle-or-t_pigott-charles_1795`, https://archive.org/details/bim_eighteenth-century_pigotts-new-hoyle-or-t_pigott-charles_1795
- **[03-S3]** Charles Pigott, *Pigott's New Hoyle* (London, 1797), pp. c. 398–399. IA `bim_eighteenth-century_pigotts-new-hoyle-or-_pigott-charles_1797`.
- **[03-S4]** Frederick Reynolds, *Cheap Living: a comedy in five acts* (London: G. G. & J. Robinson, 1797). IA `bim_eighteenth-century_cheap-living-a-comedy-_reynolds-frederick_1797` and `cheaplivingacom00reyngoog`.
- **[03-S5]** Charles Jones (rev.), *Hoyle's Games Improved*, new ed. enlarged (London: R. Baldwin et al., 1796), pp. 298–300. IA `bim_eighteenth-century_hoyles-games-improved-b_hoyle-edmond_1796`.
- **[03-S6]** *Hoyle's Games Improved*, new ed. (London, 1800), pp. 296–298. IA `bim_eighteenth-century_hoyles-games-improved-c_hoyle-edmond_1800`.
- **[03-S7]** *Hoyle's Games Improved* (London: W. Lowndes et al., 1814), pp. 159–162. IA `hoylesgamesimpr00jonegoog`.
- **[03-S8]** *Hoyle's Games Improved* (New York: G. Long, 1823), pp. c. 150–152. IA `hoylesgamesimpr02hoylgoog`.
- **[03-S9]** *Hoyle's Improved Edition of the Rules for Playing Fashionable Games* (New York: W. C. Borradaile, 1830), pp. 118–120; and the 1838 ed. IA `hoylesimprovede01hoylgoog`, `hoylesimprovede00hoylgoog`.
- **[03-S10]** *Hoyle's Games, Improved and Enlarged* (London: Longman, 1835), pp. 244–246; also the 1859 London ed. IA `hoylesgamesimpro00hoyluoft`, `hoylesgamesimpro00hoyl`.
- **[03-S11]** Lady [Sarah] Nicolas (comp.), *The Cairn: a gathering of precious stones from many hands* (London, 1846), p. 128. IA `cairngatheringof00nicorich`.
- **[03-S12]** H. G. Bohn (ed.), *The Hand-book of Games* (London: H. G. Bohn, 1850), pp. 330–332; also London: Bell & Daldy, 1867. IA `handbookofgamesc00bohn`, `handbookgamesco00bohngoog`; Philadelphia: Anners, 1851, `bohnsnewhandboo00hoylgoog`.
- **[03-S13]** *Hoyle's Games: containing the rules for playing fashionable games* (Philadelphia: H. F. Anners, 1857) and *Hoyle's Games* (Philadelphia: J. B. Lippincott, 1869). IA `hoylesgamescont02hoylgoog`, `hoylesgames01hoyl`.
- **[03-S14]** W. B. Dick, *The American Card Player* (New York: Dick & Fitzgerald, ©1866), pp. 128–130, 151. IA `americancardplay00dick`.
- **[03-S15]** "Trumps" [W. B. Dick], *The American Hoyle; or, Gentleman's Hand-book of Games*, 4th ed. (New York: Dick & Fitzgerald, ©1864; preface Feb. 1867), pp. 218–221. IA `americanhoyleorg00dick`; also the 5th ed. (1868) `americanhoyleorg00dick_2` and the 8th ed. (1874) `americanhoyleorg00dick_0`.
- **[03-S16]** "Trumps", *The Modern Pocket Hoyle* (New York: Dick & Fitzgerald, ©1868), pp. 177–182. IA `modernpockethoy00hoylgoog`, `modernpockethoy00dickgoog`.
- **[03-S17]** Thomas Frere (ed.), *Hoyle's Games* (Boston: De Wolfe, Fiske, 1875), pp. 334–336. IA `hoylesgamesconta00frer`; also `hoylesgamescont01hoylgoog` (J. S. Locke, 1875).
- **[03-S18]** G. F. Pardon, *The Card Player's Manual* (London: Ward, Lock & Co., 1876), p. 231 ff. IA `cardplayersmanua00pard`.
- **[03-S19]** *Cassell's Book of In-door Amusements, Card Games, and Fireside Fun*, 3rd ed. (London: Cassell, Petter, Galpin, [1881]), p. 129. Project Gutenberg #49137, https://www.gutenberg.org/cache/epub/49137/pg49137.txt ; IA `cassellsbookofin00cassrich`.
- **[03-S20]** Charles Townsend, *Social Card Games* (Chicago: T. S. Denison, ©1891), pp. 89–94. IA `socialcardgames00town`.
- **[03-S21]** Baxter-Wray [W. H. Peel], *Round Games with Cards* (London, 1891/1897), pp. 97–100. Project Gutenberg #27819, https://www.gutenberg.org/cache/epub/27819/pg27819.txt
- **[03-S22]** "Trumps", *The American Hoyle*, 15th ed., "entirely re-written" (New York: Dick & Fitzgerald, 1894), pp. 316–322. IA `americanhoyleor00dickgoog`; also the ©1892/1898 printing `americanhoyle0000unse`.
- **[03-S23]** R. F. Foster, *Foster's Complete Hoyle* (New York & London: F. A. Stokes, 1897), pp. 441–448. IA `fosterscomplete00fostgoog`.
- **[03-S24]** United States Playing Card Co., *Card Games and How to Play Them*, Publisher's 9th ed. (Cincinnati, ©1898), pp. 55–57. IA `officialrulesofc00unse`.
- **[03-S25]** *The Standard Hoyle* (New York: Excelsior Publishing House, 1904; 1909 reissue), pp. 283–284. IA `standardhoylecom00hoyl`, `standardhoylecom00newy`.
- **[03-S26]** *Fox's Revised Edition of Hoyle's Games* (New York: R. K. Fox, 1905; 1912), p. 115 ff. IA `foxsrevisedediti00newy`, `foxsrevisededit00newy`.
- **[03-S27]** *The New International Encyclopaedia*, 1st ed., vol. IV (New York: Dodd, Mead, 1905), pp. 289–290, "Cassino". Wikisource: https://en.wikisource.org/wiki/The_New_International_Encyclop%C3%A6dia/Cassino_(card_game) (page source `Page:The New International Encyclopædia 1st ed. v. 04.djvu/340`).
- **[03-S28]** [R. F. Foster], *Hoyle's Games*, Autograph Edition (New York: McClure, ©1907), pp. 134–138, glossary. IA `hoylesgames02hoyl`; also `hoylesgames0000unse_t9y0`, `hoylescompleteau0000mccl`, `hoylesgames03hoyl` (A. L. Burt, 1914).
- **[03-S29]** R. F. Foster, *Foster's Complete Hoyle* (New York: F. A. Stokes, 1909), pp. 478–485. IA `fosterscomplete02fostgoog`.
- **[03-S30]** Professor Hoffmann, *Hoyle's Games Modernized*, new ed. revised to 1909 (London: Routledge). Project Gutenberg #39445, https://www.gutenberg.org/cache/epub/39445/pg39445.txt ; also IA `hoylesgamesmoder0000prof` (1907).
- **[03-S31]** R. F. Foster, *Foster's Complete Hoyle: An Encyclopedia of Games* (New York: F. A. Stokes, Oct. 1914; ©1897, 1909, 1914), "Cassino" pp. 478–485, national-games essay, "Discrimination" note, glossary. Project Gutenberg #53881, https://www.gutenberg.org/cache/epub/53881/pg53881.txt
- **[03-S32]** *Hoyle's Games; America's complete hand-book of games* (Chicago: M. A. Donohue, 1920), p. 89 ff. IA `hoylesgamesameri00hoyl`.
- **[03-S33]** Paul H. Seymour (rev.), *The New Hoyle Standard Games* (©1929), pp. 112–117. IA `newhoylestandard0000paul_n1n9`. Related: *Hoyle's Standard Games* (Chicago: Laird & Lee, 1924), IA `hoylesstandardga00unse`.
- **[03-S34]** *Hoyle's Rules for Card Games* (Long Island City, NY: New York Consolidated Card Co., 1926). IA `hoylesrulesforca00hoyl`.
- **[03-S35]** Albert A. Ostrow, *The Complete Card Player* (US ed. 1945; London: Bodley Head, 1949), pp. 237–245, and the "Stealing the Old Man's Bundle" entry. IA `TheCompleteCardPlayer`.
- **[03-S36]** United States Playing Card Co., *The Official Rules of Card Games: Hoyle Up-to-Date*, Publisher's 48th ed., ed. Albert H. Morehead (Cincinnati, ©1887–1952), pp. 9–10, 211–214, glossary. IA `officialrulesofc0000unse_b3h5`.
- **[03-S37]** Norton T. Horr, *A Bibliography of Card-Games and of the History of Playing-Cards* (Cleveland, 1892). IA `cu31924029580754`.
- **[03-S38]** Wikipedia, "Cassino (card game)" (secondary; raw wikitext fetched 2026-10-02), https://en.wikipedia.org/w/index.php?title=Cassino_(card_game)&action=raw
- **[03-S39]** Negative checks: *Hoyle's Games Improved* (London, 1790), IA `bim_eighteenth-century_hoyles-games-improved-_hoyle-edmond_1790`; *An Epitome of Hoyle* (1791), IA `bim_eighteenth-century_an-epitome-of-hoyle-wit_hoyle-edmond_1791`. Neither contains "Cassino" (full-OCR grep, 0 hits).


### Note 04: 04 — Cultural & social history of Cassino (non-rulebook sources)

(Full note: `research/04-cultural-history.md`)


(archive.org items: `https://archive.org/details/<identifier>`; full text at `https://archive.org/download/<id>/<id>_djvu.txt`. "FTS" = archive.org full-text search API `https://archive.org/services/search/beta/page_production/?user_query=…&service_backend=fts`. Chronicling America pages read through ALTO OCR at `https://tile.loc.gov/storage-services/service/ndnp/...`.)

- [04-S1] Wikipedia, "Cassino (card game)" (raw wikitext). https://en.wikipedia.org/w/index.php?title=Cassino_(card_game)&action=raw. Cites Long 1792; Reynolds 1797 p.39; Pratesi 1995; Nicolas 1846 p.128; Parlett 2008 p.401.
- [04-S2] J. McLeod, "Casino", Pagat.com (last updated 6 May 2026). https://www.pagat.com/fishing/casino.html
- [04-S3] J. McLeod, "Nordic Casino" (Kasino in Sweden & Finland, Mulle), Pagat.com. https://www.pagat.com/fishing/nordic_casino.html
- [04-S4] "Krypkasino", Pagat.com. https://www.pagat.com/fishing/krypkasino.html
- [04-S5] J. McLeod, "Royal Casino" (Dominican Republic, North America, Haiti, Tuxedo, Hungarian Kaszinó), Pagat.com. https://www.pagat.com/fishing/royal_casino.html
- [04-S6] "African Casino" (Swazi, Sotho, South African), Pagat.com. https://www.pagat.com/fishing/african_casino.html
- [04-S7] Franco Pratesi, "Casino from Nowhere, to Vaguely Everywhere" (dated 09.10.1994; *The Playing-Card* XXIV/1, Jul/Aug 1995). PDF: https://www.naibi.net/A/57-CASINO%20-Z.pdf
- [04-S8] Etymonline, "casino". https://www.etymonline.com/word/casino
- [04-S9] Wiktionary (raw wikitext): "cassino", "casino", "big cassino", "little cassino", "great cassino", "royal casino", "sweep" (noun sense "In the game casino…"; Finnish translation *mökki*). https://en.wiktionary.org/w/index.php?title=cassino&action=raw (and likewise for each title)
- [04-S10] Green's Dictionary of Slang, "big casino, n.". https://greensdictofslang.com/entry/53hptnq
- [04-S11] Green's Dictionary of Slang, "big casino, adv.". https://greensdictofslang.com/entry/fhh5xha
- [04-S12] Green's Dictionary of Slang, "little casino, n.". https://greensdictofslang.com/entry/26i3rmq
- [04-S13] Languagehat, "Cards and Spades" (with comments by Jonathon Green et al.). https://languagehat.com/cards-and-spades/
- [04-S14] Merriam-Webster, "cards and spades". https://www.merriam-webster.com/dictionary/cards%20and%20spades
- [04-S15] Dictionary.com, "big casino". https://www.dictionary.com/browse/big-casino
- [04-S16] Jane Austen, *Pride and Prejudice* (1813), ch. XXIX. Project Gutenberg #1342. https://www.gutenberg.org/cache/epub/1342/pg1342.txt
- [04-S17] Jane Austen, *Sense and Sensibility* (1811), chs. XXIII and XXVIII. PG #161. https://www.gutenberg.org/cache/epub/161/pg161.txt
- [04-S18] Jane Austen, *The Watsons* (c.1804). PG #77117. https://www.gutenberg.org/cache/epub/77117/pg77117.txt
- [04-S19] Jane Austen to Cassandra, Steventon, Thursday 20 Nov [1800], Brabourne ed., Pemberley.com. https://pemberley.com/janeinfo/brablet4.html
- [04-S20] Frederick Reynolds, *Cheap Living: a comedy* (London 1797). archive.org `bim_eighteenth-century_cheap-living-a-comedy-_reynolds-frederick_1797` (full text) and `_1797_0`, `_1797_1`, `cheaplivingacom00reyngoog` (FTS snippets).
- [04-S21] *Casino; a mock-heroic poem. Dedicated, by permission, to Her Grace the Duchess of Bolton. To which is added, an appendix; containing the laws of the game of casino* (London, 1793). archive.org `bim_eighteenth-century_casino-a-mock-heroic-po_1793` (full text read).
- [04-S22] Charles Dickens, *David Copperfield* (1850), ch. 11. PG #766. https://www.gutenberg.org/cache/epub/766/pg766.txt
- [04-S23] *The Intimate Letters of Hester Piozzi and Penelope Pennington*, letter dated Bath, 29 Oct 1819. PG #57003. https://www.gutenberg.org/cache/epub/57003/pg57003.txt
- [04-S24] O. Henry, "The Hiding of Black Bill", in *Options* (1909). PG #1583. https://www.gutenberg.org/cache/epub/1583/pg1583.txt
- [04-S25] O. Henry, "Hearts and Crosses", in *Heart of the West* (1907). PG #1725.
- [04-S26] O. Henry, "Dougherty's Eye-Opener", in *The Voice of the City* (1908). PG #1444.
- [04-S27] O. Henry, "Shearing the Wolf", in *The Gentle Grafter* (1908). PG #1805.
- [04-S28] Jack London, *A Son of the Sun* (1912), ch. 6 "A Goboto Night". PG #21971. https://www.gutenberg.org/cache/epub/21971/pg21971.txt. Also as *The Adventures of Captain Grief*, archive.org `adventuresofcapt00lond`.
- [04-S29] Jack London, *The Valley of the Moon* (1913). PG #1449.
- [04-S30] Jack London, *John Barleycorn* (1913). PG #318.
- [04-S31] Mary Roberts Rinehart, *Tish* (1916). PG #3464.
- [04-S32] Mary Jane Holmes, *Tracy Park* (1887). PG #15321.
- [04-S33] Sewell Ford, *Torchy and Vee* (1919), ch. XI. PG #20628.
- [04-S34] W. M. Thackeray, *Notes of a Journey from Cornhill to Grand Cairo* (1846), ch. XI. PG #1863.
- [04-S35] I. F. Marcosson & D. Frohman, *Charles Frohman: Manager and Man* (1916). PG #26146.
- [04-S36] *The Russian Journals of Martha and Catherine Wilmot 1803–1808*, ed. Londonderry & H. M. Hyde (1934). archive.org `in.ernet.dli.2015.77240` (full text).
- [04-S37] Lady Anna Riggs Miller, *Letters from Italy … 1770 and 1771* (1777), vol. 2. archive.org `bim_eighteenth-century_letters-from-italy-desc_miller-anna-riggs-lady_1777_2` (full text).
- [04-S38] Alethea Lewis, *Plain Sense. A novel* (1796), vol. 2. archive.org `bim_eighteenth-century_plain-sense-a-novel_lewis-alethea_1796_2` (full text).
- [04-S39] *Proceedings and Debates of the Parliament of Pimlico* (1799). archive.org `bim_eighteenth-century_proceedings-and-debates-_1799` (full text).
- [04-S40] Miss Walsh, *The Officer's Daughter; or, A Visit to Ireland in 1790* (1810), vol. 1. archive.org `officersdaughter01wals` (full text).
- [04-S41] Agnes Witts, *An Edinburgh Diary 1793–1798* (2016 ed.). archive.org `edinburghdiary170000witt` (FTS snippet; item restricted).
- [04-S42] J. G. Lemaistre, *Travels after the Peace of Amiens* (1806). archive.org `travelsafterpeac01lema` (FTS snippet).
- [04-S43] Mary Charlton, *The Parisian* (1794), vol. 1. archive.org `bim_eighteenth-century_the-parisian-or-genuin_charlton-mary_1794_1` (FTS snippet).
- [04-S44] *Berlin and the Prussian Court in 1798: Journal of Thomas Boylston Adams*, ed. V. H. Paltsits (1916). archive.org `berlinandprussi00paltgoog` (full text).
- [04-S45] *The Francis Letters*, ed. Beata Francis & Eliza Keary (1901), vol. 2. archive.org `francisletters02franuoft` (full text).
- [04-S46] *Lady Nugent's Journal of her Residence in Jamaica from 1801 to 1805*, ed. P. Wright (1966/2002). archive.org `bwb_Y0-DKZ-009`, `ladynugentsjourn0000unse` (FTS snippets).
- [04-S47] *The Letter-Journal of George Canning 1793–1795* (1991). archive.org `letterjournalofg0000cann` (FTS snippet).
- [04-S49] archive.org FTS result sets (snippets read) for "cassino table", "game of cassino", "played cassino", "playing cassino", "cassino party/parties", "cassino box", "little cassino". Items cited include:
  - Henry Card, *Beauford* (1811), `beaufordorpictur01card`
  - *The Master Passion* (1808), `masterpassionorh02lond`
  - Mrs. Kelly, *The Fatalists* (1821), `fatalistsorreco01kellgoog`
  - *Scheming*, `schemingnovel01lond`
  - *Literary Gazette* 1 Aug 1818, `sim_literary-gazette_1818-08-01_80`
  - *Spirit of the English Magazines* Dec 1826, `sim_atheneum-or-spirit-of-the-english-magazine_1826-12-01_6_5`
  - C. Gore, *Pin Money* (1831), `pinmoneynovel02gore`
  - C. Gore, *The Fair of May Fair* (1832), `fairofmayfair01gore`
  - *The Highland Inn* (1839), `b2874553x_0002`
  - I. Steward, *The Interdict* (1840), `interdictnovel03stew`
  - T. S. Surr, *A Winter in London* (1806), `winterinlondonor03surr`
  - Lady S. Nicolas, *The Cairn* (1846), `cairngatheringof00nicorich`
  - *Spirit of the Times* 19 Jan 1833, `sim_spirit-of-the-times_1833-01-19_2_58`
  - *Boston Weekly Magazine* 15 Aug 1840, `sim_boston-weekly-magazine_1840-08-15_2_48`
  - *Dixon Evening Telegraph* 22 Aug 1949, `dixon-evening-telegraph-1949-08-22`
  - *St. Louis Post-Dispatch* 9 Jun 1923, `per_st-louis-post-dispatch_1923-06-09_75_274`
  - *Catholic Directory of Southern Africa* (Cassino mission), `catholicdirector1985unse`
- [04-S50] David Parlett, *The Penguin Book of Card Games* (1979; 1987). archive.org `penguinbookofcar0000parl_n7t7`, `penguinbookofcar0000parl_g0d7` (FTS snippets). Also *Card Games for Two* (1978), `cardgamesfortwo0000parl` (FTS snippet).
- [04-S51] David Parlett, "Laugh & Lie Down", Historic Card Games. https://www.parlettgames.uk/histocs/laughand.html
- [04-S52] Quotes.net, *Chisum* (1970) quote. https://www.quotes.net/mquote/17505
- [04-S53] "Chisum (1970) and the True Story of William Bonney", ClassicMovieRev. https://classicmovierev.com/chisum-1970/
- [04-S54] "The Sad Life of Pat Garrett", HistoryCollection. https://historycollection.com/sad-life-pat-garrett-luckless-lawman-killed-billy-kid/
- [04-S55] "Pat Garrett", All That's Interesting. https://allthatsinteresting.com/pat-garrett
- [04-S56] "Big Casino, Little Casino", Wizard of Vegas forum (13 May 2020). https://wizardofvegas.com/forum/questions-and-answers/gambling/34687-big-casino-little-casino/
- [04-S57] Walter Noble Burns, *The Saga of Billy the Kid* (1926), p. 242. archive.org `sagaofbillykid0000burn_r6g3` (full text grepped). Also Siringo, *History of "Billy the Kid"*, PG #38039 (no "casino").
- [04-S58] *Pat Garrett & Billy the Kid* (1973) transcripts, subslikescript.com and springfieldspringfield.co.uk (grepped; no "casino"). https://subslikescript.com/movie/Pat_Garrett__Billy_the_Kid-70518
- [04-S60] Lelia Eye, "Pride and Prejudice and Card Games", guest post on Regina Jeffers' blog (9 May 2022). https://reginajeffers.blog/2022/05/09/pride-and-prejudice-and-card-games-a-guest-post-from-lelia-eye/
- [04-S61] Georgette Heyer, *The Toll-Gate* (1954). archive.org `tollgate00heye`, `tollgate0000geor_e6w0` (FTS snippets).
- [04-S64] Robert Long, *Short Rules for Playing the Game of Cassino* (1792). archive.org `bim_eighteenth-century_short-rules-for-playing-_long-robert_1792` (title confirmed via archive.org metadata search).
- [04-S78] Rolf Johnson, *Happy as a Big Sunflower: Adventures in the West, 1876–1880* (2000). archive.org `happyasbigsunflo0000john` (FTS snippet).
- [04-S79] E. Ramsay Richardson, *Little Aleck: A Life of Alexander H. Stephens* (1932). archive.org `littlealeckalife001558mbp` (FTS snippet).
- [04-S80] Dale Kramer, *Ross and The New Yorker* (1951). archive.org `rossnewyorker00kram` (FTS snippet).
- [04-S81] Roger L. Treat, *Walter Johnson, King of the Pitchers* (1948). archive.org `walterjohnsonkin0000roge` (FTS snippet).
- [04-S82] archive.org FTS snippets, modern fiction and memoir:
  - E. Welty, *Delta Wedding*, `deltawedding00welt`
  - W. R. Burnett, *The Asphalt Jungle*, `asphaltjungle0000wrbu`
  - B. Maddow, *The Asphalt Jungle: a screenplay*, `asphaltjunglescr0000madd`
  - *Slave Ghost Stories*, `slaveghoststorie0000unse`
  - J. K. Ardmore, *To Love Is to Listen* (1967), `toloveistolisten0000ardm`
  - T. Conger, *Banana Moon* (1966), `bananamoon0000tomc`
  - J. Harmon, *The Great Radio Comedians* (1970), `greatradiocomedi00harm`
  - H. R. Smith, *Basic Story Techniques* (1964), `basicstorytechni0000smit`
- [04-S83] *Dicionário Contemporâneo da Língua Portuguesa* (1964). archive.org `dicionariocontem0000unse_z7u4` (FTS snippet).
- [04-S84] James L. Taylor, *A Portuguese-English Dictionary* (Stanford, 1958). archive.org `portugueseenglis00tayl` (FTS snippet).
- [04-S85] Swedish Wikipedia, "Kasino (kortspel)". https://sv.wikipedia.org/w/index.php?title=Kasino_(kortspel)&action=raw
- [04-S86] Norwegian Wikipedia, "Kasino (kortspill)". https://no.wikipedia.org/w/index.php?title=Kasino_(kortspill)&action=raw
- [04-S87] Danish Wikipedia, "Kasino (kortspil)". https://da.wikipedia.org/w/index.php?title=Kasino_(kortspil)&action=raw
- [04-S88] Finnish Wikipedia, "Kasino (korttipeli)". https://fi.wikipedia.org/w/index.php?title=Kasino_(korttipeli)&action=raw
- [04-S89] Hungarian Wikipedia, "Kaszinó (kártyajáték)". https://hu.wikipedia.org/w/index.php?title=Kaszin%C3%B3_(k%C3%A1rtyaj%C3%A1t%C3%A9k)&action=raw
- [04-S90] Japanese Wikipedia, "カシノ". https://ja.wikipedia.org/w/index.php?title=%E3%82%AB%E3%82%B7%E3%83%8E&action=raw
- [04-S91] German Wikipedia, "Casino (Kartenspiel)". https://de.wikipedia.org/w/index.php?title=Casino_(Kartenspiel)&action=raw
- [04-S92] Mikko Saari, "Kasino", Korttipeliopas.fi (2010, with reader comments 2014–2025). https://korttipeliopas.fi/kasino
- [04-S100] *Winchester Virginia Republican*, 16 Feb 1827, p.1. https://www.loc.gov/resource/sn86071897/1827-02-16/ed-1/?sp=1. Same tale in *Boon's Lick Times* 21 Nov 1840 (https://www.loc.gov/resource/sn83016957/1840-11-21/ed-1/?sp=1) and *Evening Star* 29 Nov 1858 (https://www.loc.gov/resource/sn83045462/1858-11-29/ed-1/?sp=1).
- [04-S101] *Weekly North Iowa Times* (McGregor), 7 Oct 1863. https://www.loc.gov/resource/sn84027238/1863-10-07/ed-1/?sp=1
- [04-S102] *Mineral Point Tribune* (Wis.), 8 May 1878. https://www.loc.gov/resource/sn86086770/1878-05-08/ed-1/?sp=1
- [04-S103] *Capital City Courier* (Lincoln, Neb.), 28 Sep 1889. https://www.loc.gov/resource/2010270510/1889-09-28/ed-1/?sp=8
- [04-S104] *Record-Union* (Sacramento), 3 Mar 1892 and 12 Mar 1892. https://www.loc.gov/resource/sn82015104/1892-03-12/ed-1/?sp=8
- [04-S105] *Wheeling Daily Intelligencer*, 24 Nov 1892. https://www.loc.gov/resource/sn84026844/1892-11-24/ed-1/?sp=5
- [04-S106] *St. Paul Daily Globe*, 19 Feb 1893. https://www.loc.gov/resource/sn90059522/1893-02-19/ed-1/?sp=15
- [04-S107] *Louisiana Democrat* (Alexandria), 24 Jul 1895. https://www.loc.gov/resource/sn82003389/1895-07-24/ed-1/?sp=3
- [04-S108] *San Antonio Daily Light*, 17 Feb 1896 (https://www.loc.gov/resource/sn86090439/1896-02-17/ed-1/?sp=4); *Morning News* (Savannah), 21 Mar 1897 (https://www.loc.gov/resource/sn86063034/1897-03-21/ed-1/?sp=12); *San Francisco Call*, 9 Jan 1898 (https://www.loc.gov/resource/sn85066387/1898-01-09/ed-1/?sp=24) and 31 May 1903.
- [04-S109] *St. Louis Republic*, 13 Mar 1904. https://www.loc.gov/resource/sn84020274/1904-03-13/ed-1/?sp=20
- [04-S110] *Alaska Citizen* (Fairbanks), 29 Apr 1912. https://www.loc.gov/resource/sn96060002/1912-04-29/ed-1/?sp=5
- [04-S111] *Western Kansas World* (WaKeeney), 20 Jan 1921. https://www.loc.gov/resource/sn82015485/1921-01-20/ed-1/?sp=8
- [04-S112] *Baltimore County Union* (Towson), 4 Apr 1903. https://www.loc.gov/resource/sn83016368/1903-04-04/ed-1/?sp=1
- [04-S113] *Daily Independent* (Elko, Nev.), 23 Aug 1899. https://www.loc.gov/resource/sn84020355/1899-08-23/ed-1/?sp=3
- [04-S114] *Nashville Union and American*, 21 Mar 1873 (https://www.loc.gov/resource/sn85033699/1873-03-21/ed-1/?sp=4); *Public Ledger* (Memphis), 13 Feb 1880.
- [04-S115] archive.org FTS snippets: *LinC* (Univ. of Evansville yearbooks 1964, 1975, 1976), `linc1975univ`, `linc1976univ`, `linc1964evan`; *Royal Purple* (Kansas State) 1962, `royalpurple1962unse`; *Debris* (Purdue) 1923, `debris1968purd`; *Progressive Farmer* Oct 1954, `sim_progressive-farmer_1954-10_69_10`.
- [04-S116] *Morning Appeal* (Carson City), 21 Sep 1886. https://www.loc.gov/resource/sn86076999/1886-09-21/ed-1/?sp=3
- [04-S117] *Weekly Independent* (Elko), 10 Jun 1894. https://www.loc.gov/resource/sn86076366/1894-06-10/ed-1/?sp=3
- [04-S118] *Goodland Republic* (Kan.), 9 Feb 1894. https://www.loc.gov/resource/sn85030821/1894-02-09/ed-1/?sp=4
- [04-S119] *Guthrie Daily Leader* (Okla.), 13 Sep 1901. https://www.loc.gov/resource/sn86063952/1901-09-13/ed-1/?sp=2
- [04-S120] *Press and Daily Dakotaian* (Yankton), 31 Dec 1885. https://www.loc.gov/resource/sn91099608/1885-12-31/ed-1/?sp=4
- [04-S121] *The Evening World* (NY), 18 Oct 1902. https://www.loc.gov/resource/sn83030193/1902-10-18/ed-1/?sp=1
- [04-S122] *New-York Tribune*, 6 Jan 1900. https://www.loc.gov/resource/sn83030214/1900-01-06/ed-1/?sp=4
- [04-S123] *Chariton Courier* (Keytesville, Mo.), 6 Feb 1890. https://www.loc.gov/resource/sn88068010/1890-02-06/ed-1/?sp=1
- [04-S124] *Edgefield Advertiser* (S.C.), 9 Oct 1884. https://www.loc.gov/resource/sn84026897/1884-10-09/ed-1/?sp=3
- [04-S125] *Wood County Reporter* (Wis.), 21 Jun 1883. https://www.loc.gov/resource/sn85033078/1883-06-21/ed-1/?sp=1
- [04-S126] *New-York Tribune*, 23 Jun 1916 (https://www.loc.gov/resource/sn83030214/1916-06-23/ed-1/?sp=9) and 11 May 1920 (https://www.loc.gov/resource/sn83030214/1920-05-11/ed-1/?sp=14), F.P.A.'s "Diary of Our Own Samuel Pepys".
- [04-S127] *Judge*, 21 Sep 1929, vol. 97. archive.org `sim_judge_1929-09-21_97` (full text).
- [04-S128] [Rita Scherman], *A Mother's Letters to a Schoolmaster* (1923). archive.org `motherslettersto0000jame` (full text).
- [04-S129] archive.org FTS snippets: *Lilith* magazine, issue 6 (1979), `lilith-1979-iss-6`; Ruth Lehrer, *My Book of Ruth* (2010), `isbn_9781438972640`; A. Rothberg, *The Song of David Freed* (1968), `songofdavidfreed00roth`; *St. Louis Post-Dispatch* 28 Oct 1955, `per_st-louis-post-dispatch_st-louis-post-dispatch_1955-10-28_77_297`.
- [04-S130] *New York Dispatch*, 14 Aug 1881 (https://www.loc.gov/resource/sn85026214/1881-08-14/ed-1/?sp=4); also 2 Feb 1879, 13 Mar 1881, 8 Oct 1882, 26 Dec 1886 answers columns.
- [04-S131] *Pioche Weekly Record* (Nev.), 10 Mar 1883. https://www.loc.gov/resource/sn86091346/1883-03-10/ed-1/?sp=3
- [04-S132] *Daily Nevada State Journal*, 4 Mar 1883. archive.org `daily-nevada-state-journal-1883-03-04` (full text).
- [04-S133] *National Police Gazette* answers columns, 1885–1906. archive.org `sim_national-police-gazette_1903-05-09_82_1343`, `…_1903-10-31_83_1368`, `…_1885-12-12_47_430`, `…_1885-02-28_45_388` and others (FTS snippets).
- [04-S134] Haskin "Answers" columns: *Arizona Republican*, 30 Jul 1920 (https://www.loc.gov/resource/sn84020558/1920-07-30/ed-1/?sp=12) and 16 May 1922; *Perth Amboy Evening News*, 4 Mar 1921 and 27 May 1922; *Waterbury Democrat*, 11 Jun 1938 (https://www.loc.gov/resource/sn82014085/1938-06-11/ed-1/?sp=10).
- [04-S135] *Harper's Bazaar*, 29 Sep 1883, vol. 16 no. 39. archive.org `sim_harpers-bazaar_1883-09-29_16_39` (full text).
- [04-S136] *Daily Kennebec Journal* (Augusta, Me.), 16 Aug 1910. https://www.loc.gov/resource/sn82014248/1910-08-16/ed-1/?sp=8
- [04-S137] *Birmingham Age-Herald*, 18 Mar 1912. https://www.loc.gov/resource/sn85038485/1912-03-18/ed-1/?sp=4
- [04-S138] *Lyon County Times* (Silver City, Nev.), 8 Aug 1875. https://www.loc.gov/resource/sn84022053/1875-08-08/ed-1/?sp=4
- [04-S139] *Okolona Messenger* (Miss.), 15 Aug 1906 (https://www.loc.gov/resource/sn87065462/1906-08-15/ed-1/?sp=6). Same story in *Semi-Weekly Leader* (Brookhaven) 21 Jul 1906 and *Mirror and Farmer* (Manchester, N.H.) 23 Aug 1906; *Ada Evening News* 23 Jul 1906 (archive.org `ada-evening-news-1906-07-23`).
- [04-S140] *Richmond Dispatch*, 17 Mar 1894. https://www.loc.gov/resource/sn85038614/1894-03-17/ed-1/?sp=5
- [04-S141] *Evening Star* (Washington), crosswords, 22 Jun 1961 (https://www.loc.gov/resource/sn83045462/1961-06-22/ed-1/?sp=31), 12 Nov 1962, 5 Feb 1963, 14 Nov 1963.
- [04-S142] Joseph E. Badger Jr., *Big George, the Giant of the Gulch; or, The Five Outlaw Brothers*, Beadle's New York Dime Library no. 88 (25 Feb 1880). archive.org `Beadles_New_York_Dime_Library_no._88_1880-02-25` (full text). Serial in *New York Saturday Journal* vol. 7 (Oct–Dec 1876), `New_York_Saturday_Journal_vol._7_1876-11-04` (FTS).
- [04-S143] *Bismarck Daily Tribune*, 27 Nov 1911. https://www.loc.gov/resource/sn85042242/1911-11-27/ed-1/?sp=4
- [04-S144] *Corvallis Times* (Ore.), 30 Jan 1904. https://www.loc.gov/resource/sn2002060538/1904-01-30/ed-1/?sp=3
- [04-S145] *Red Lodge Picket* (Mont.), 5 Jan 1900. https://www.loc.gov/resource/sn84036276/1900-01-05/ed-1/?sp=4
- [04-S146] *Evening Star* (Washington), 27 Apr 1901. https://www.loc.gov/resource/sn83045462/1901-04-27/ed-1/?sp=18
- [04-S147] *Sauk Centre Herald* (Minn.), 14 Dec 1905. https://www.loc.gov/resource/sn89064489/1905-12-14/ed-1/?sp=3
- [04-S148] *Norwich Bulletin* (Conn.), 22 Nov 1913. https://www.loc.gov/resource/sn82014086/1913-11-22/ed-1/?sp=12
- [04-S149] *Evening Star*, 14 May 1944 (https://www.loc.gov/resource/sn83045462/1944-05-14/ed-1/?sp=1) and 15 Aug 1950 (https://www.loc.gov/resource/sn83045462/1950-08-15/ed-1/?sp=3); *Poston Chronicle* 21 Sep 1944; *Arizona Sun* 15 Sep 1950; *Atlanta Daily World* 16 Aug 1950.
- [04-S150] *Helena Weekly Herald* 25 Oct 1883; *Mineral Argus* (Maiden, Mont.) 4 Sep 1884; *Silver Messenger* (Challis, Idaho) 23 Oct 1900; *Idaho Republican* (Blackfoot) 29 Sep 1905 and 9 Nov 1906; *Iowa State Bystander* 8 Jun 1900. All via Chronicling America, "big cassino" / "little cassino" phrase searches.
- [04-S151] *Lincoln County Leader* (White Oaks, N.M.), 28 Mar 1891. https://www.loc.gov/resource/sn87090072/1891-03-28/ed-1/?sp=4
- [04-S152] Sotheby, Wilkinson & Hodge, *Cabinet of Old Fans* (sale catalogue, 1882). archive.org `cabinetofoldfans00soth_0` (FTS snippet).
- [04-S155] *New York Dispatch* answers columns:
  - 1 Apr 1877, https://www.loc.gov/resource/sn85026214/1877-04-01/ed-1/?sp=4
  - 8 Apr 1877, https://www.loc.gov/resource/sn85026214/1877-04-08/ed-1/?sp=4
  - 19 Aug 1877, https://www.loc.gov/resource/sn85026214/1877-08-19/ed-1/?sp=4
  - 31 Mar 1878, https://www.loc.gov/resource/sn85026214/1878-03-31/ed-1/?sp=4
  - 22 Feb 1880, https://www.loc.gov/resource/sn85026214/1880-02-22/ed-1/?sp=4
  - 17 Oct 1880, https://www.loc.gov/resource/sn85026214/1880-10-17/ed-1/?sp=4
- [04-S156] *Somerset Reporter* (Skowhegan, Me.), 20 Apr 1905. https://www.loc.gov/resource/sn84022565/1905-04-20/ed-1/?sp=6
- [04-S157] *Wrangell Sentinel* (Alaska):
  - 29 Jul 1932; 10 Aug, 14 Sep and 26 Oct 1934; 19 Mar 1937
  - 10 Jun 1938, https://www.loc.gov/resource/sn94050093/1938-06-10/ed-1/?sp=3
  - 4 Aug and 27 Oct 1939
  - 7 Sep 1951, https://www.loc.gov/resource/sn94050093/1951-09-07/ed-1/?sp=1

  Also: *Roanoke Rapids Herald*, 8 Mar 1945 (https://www.loc.gov/resource/2017236974/1945-03-08/ed-1/); *Key West Citizen*, 7 Feb 1957, 1 Feb 1961, 12 Apr 1961 (Chronicling America "casino party" search).
- [04-S158] *Virginia Enterprise* (Minn.), 24 Aug 1906 (https://www.loc.gov/resource/sn90059180/1906-08-24/ed-1/?sp=6); *Worcester Daily Press*, 7 Dec 1874 (https://www.loc.gov/resource/sn83021219/1874-12-07/ed-1/?sp=2); *Cecil Whig* (Elkton, Md.), 10 Aug 1872 (https://www.loc.gov/resource/sn83016348/1872-08-10/ed-1/?sp=1).
- [04-S159] Georges Feydeau, *The Pregnant Pause, or, Love's Labor Lost* (English translation; archive.org item dated 1985). archive.org `pregnantpauseorl00feyd` (FTS snippets). Parlett, *Teach Yourself Card Games* (1994), `lccn_93085122` (FTS snippet), is cited under S50.
- [04-S160] *Bristol Courier* (Bristol, Pa.), 29 Apr 1952. archive.org `bristol-courier-1952-04-29` (full text).
- [04-S161] archive.org FTS snippets:
  - "DANNOTCH'S NEWSVIDEOS YouTube Channel Transcripts, JFK Related", `dannotchs-newsvideos-youtube-channel-transcripts-jfk-related`
  - Jos. E. Badger, *Gentleman Joe, the Gilt-Edge Sport*, `929c380a-0f9f-42ed-b047-a9edd8d22fe0`
  - *The Complete Book of Card Games* (1993), `completebookofca0000unse_k3r3`
- [04-S162] Chronicling America "big casino" phrase search (ALTO OCR read):
  - *Wibaux Pioneer*, 24 Feb 1911, https://www.loc.gov/resource/sn85053308/1911-02-24/ed-1/?sp=4
  - *Vilas County News*, 1 Feb 1911, https://www.loc.gov/resource/sn85040613/1911-02-01/ed-1/
  - *Foster's Daily Democrat*, 17 Oct 1899, https://www.loc.gov/resource/sn84023058/1899-10-17/ed-1/?sp=6
  - *Santa Fe New Mexican*, 20 Feb 1900, https://www.loc.gov/resource/sn84020630/1900-02-20/ed-1/?sp=3
  - *Albuquerque Daily Citizen*, 14 Nov 1902, https://www.loc.gov/resource/sn84020613/1902-11-14/ed-1/
- [04-S163] *Lancaster Daily Intelligencer*, 1 Apr 1885. archive.org `per_lancaster-daily-intelligencer_lancaster-daily-intelligencer_1885-04-01_1` (full text).
- [04-S164] "Pat Garrett – An Unlucky Lawman", Legends of America (https://www.legendsofamerica.com/we-patgarrett/); "History of the Office of Sheriff", Excerpts No. 16, New York Correction History Society (https://www.correctionhistory.org/html/chronicl/sheriff/ch16.htm).
- [04-S165] Pat F. Garrett, *The Authentic Life of Billy, the Kid* (1882). archive.org `TheAuthenticLifeOfBillyTheKid`; 1927 ed. `authenticlifeofb0000unse_x7z8` (full texts grepped, no hits).
- [04-S166] *Morning News* (Savannah), 26 Dec 1891 (https://www.loc.gov/resource/sn86063034/1891-12-26/ed-1/?sp=2); *Las Vegas Daily Gazette* (N.M.), 25 Nov and 3 Dec 1882 (https://www.loc.gov/resource/sn90051703/1882-12-03/ed-1/?sp=4); *Fergus County Argus* (Lewistown, Mont.), 15 Jan and 5 Mar 1902 (https://www.loc.gov/resource/sn84036228/1902-03-05/ed-1/?sp=5).
- [04-S167] *The Day Book* (Chicago), 21 May 1913 (https://www.loc.gov/resource/sn83045487/1913-05-21/ed-1/?sp=32); *Goldsboro Weekly Argus*, 1 Nov 1900 (https://www.loc.gov/resource/sn84020751/1900-11-01/ed-1/?sp=1); *Pioche Weekly Record*, 6 Sep 1890 (https://www.loc.gov/resource/sn86091346/1890-09-06/ed-1/?sp=2).
- [04-S153] Robin McGrath, "Traditional Games of Newfoundland and Labrador" (Heritage NL). https://heritagenl.ca/wp-content/uploads/2020/05/26a-Traditional-Games-of-Newfoundland-and-Labrador.pdf
- [04-S154] Web search results on Newfoundland card games (CBC "120s" article etc.), WebSearch 2 Oct 2026. https://www.cbc.ca/news/canada/newfoundland-labrador/120s-the-rooms-joy-barfoot-1.4135007 (listed in results; not opened)


### Note 05: 05 — Glossary & Table-Talk Corpus: Cassino and its relatives

(Full note: `research/05-table-talk-terminology.md`)


All accessed 2026-10-02 unless noted. `[S#]` numbers not listed (S60, S63, S75, S84–S89) were not used.

**Historical primary texts**
- [05-S3] Robert Long, *Short rules for playing the game of cassino* (Twickenham, 1792). archive.org id `bim_eighteenth-century_short-rules-for-playing-_long-robert_1792` — https://archive.org/details/bim_eighteenth-century_short-rules-for-playing-_long-robert_1792 (OCR: `_djvu.txt`; heavily garbled).
- [05-S4] Charles Pigott, *Pigott's New Hoyle; or, the general repository of games* (London, 1797), "The Game of Cassino," pp. ~198–199. archive.org `bim_eighteenth-century_pigotts-new-hoyle-or-_pigott-charles_1797`.
- [05-S5] Frederick Reynolds, *Cheap Living: a comedy, in five acts* (London, 1797). archive.org `cheaplivingacom00reyngoog` — https://archive.org/details/cheaplivingacom00reyngoog
- [05-S6] Jane Austen, *Pride and Prejudice* (1813), ch. XXIX. Project Gutenberg #1342 — https://www.gutenberg.org/cache/epub/1342/pg1342.txt
- [05-S7] *Bohn's New Hand-book of Games* (1851), "Cassino." archive.org `bohnsnewhandboo00hoylgoog` — https://archive.org/details/bohnsnewhandboo00hoylgoog
- [05-S8] "Trumps" [William Brisbane Dick], *The American Hoyle, or, Gentleman's Hand-book of Games* (New York: Dick & Fitzgerald, 4th ed., ©1864; preface Feb. 1867), "Cassino" — Terms, Laws 1–16, pp. 218–221. archive.org `americanhoyleorg00dick` — https://archive.org/details/americanhoyleorg00dick
- [05-S9] *Cassell's Book of In-door Amusements, Card Games, and Fireside Fun*, 3rd ed. (London: Cassell, Petter, Galpin & Co., n.d.), "Cassino," p. 129 ff. Project Gutenberg #49137 — https://www.gutenberg.org/ebooks/49137
- [05-S10] Baxter-Wray [W. H. Peel], *Round Games with Cards* (London, 1891), "Cassino," pp. 97–100. Project Gutenberg #27819 — https://www.gutenberg.org/ebooks/27819
- [05-S11b] R. F. Foster, *Foster's complete Hoyle; an encyclopedia of all the indoor games played at the present day* (London/New York: F. A. Stokes, 1897), "Cassino." archive.org `fosterscomplete00fostgoog` — https://archive.org/details/fosterscomplete00fostgoog
- [05-S11] R. F. Foster, *Foster's Complete Hoyle*, revised and enlarged to October 1914 (New York: F. A. Stokes), "Cassino," "Twenty-one Point," "Royal," "Spade," "Draw Cassino," pp. 478–485; glossary entries "Cards," "Natural Points"; "Discrimination" note. Project Gutenberg #53881 — https://www.gutenberg.org/ebooks/53881

**Reference sites (Pagat, by John McLeod and contributors)**
- [05-S1] "Casino" — https://www.pagat.com/fishing/casino.html (last updated 6 May 2026)
- [05-S12] "Royal Casino" (Dominican, North American, Haiti, Tuxedo, Hungarian Kaszinó) — https://www.pagat.com/fishing/royal_casino.html
- [05-S13] "African Casino" (Swazi, Sotho, South African) — https://www.pagat.com/fishing/african_casino.html
- [05-S14] "Nordic Casino" (Sweden, Mulle, Finland) — https://www.pagat.com/fishing/nordic_casino.html
- [05-S15] "Krypkasino" — https://www.pagat.com/fishing/krypkasino.html
- [05-S16] "Stealing Bundles" — https://www.pagat.com/fishing/bundle.html
- [05-S17] "Scopa" (incl. Chkobba section) — https://www.pagat.com/fishing/scopa.html
- [05-S18] "Escoba" — https://www.pagat.com/fishing/escoba.html
- [05-S19] "Cuarenta" (contributed by Paul J. Welty) — https://www.pagat.com/fishing/cuarenta.html
- [05-S20] "Basra" (incl. quotation from Fuad I. Khuri, *Tents and Pyramids*, Saqi, 1990, App. F, pp. 145–6) — https://www.pagat.com/fishing/basra.html
- [05-S21] "Pâsur" — https://www.pagat.com/fishing/pasur.html
- [05-S22] "Xeri" — https://www.pagat.com/fishing/xeri.html
- [05-S23] "Diloti" — https://www.pagat.com/fishing/diloti.html
- [05-S24] "Kontsina" — https://www.pagat.com/fishing/kontsina.html
- [05-S25] "Pishti" — https://www.pagat.com/fishing/pishti.html
- [05-S26] "Tablić" — https://www.pagat.com/fishing/tablic.html
- [05-S27] "Cirulla" — https://www.pagat.com/fishing/cirulla.html
- [05-S28] "Zwicker" — https://www.pagat.com/fishing/zwicker.html
- [05-S29] "Cau Robat" — https://www.pagat.com/fishing/cau.html
- [05-S30] "Mitaines" — https://www.pagat.com/fishing/mitaines.html
- [05-S31] "Seep" — https://www.pagat.com/fishing/seep.html
- [05-S32] Martin Sörensson, "Kasino i Sverige" (Swedish) — https://www.pagat.com/fishing/kasino_i_norden_sv.html
- [05-S82] "Snitch'ems" — https://www.pagat.com/fishing/snitchems.html
- [05-S83] "Chorizo and Báciga" — https://www.pagat.com/fishing/chorizo.html

**Swedish / Nordic**
- [05-S33] Lyckans Talisman, "Kasino" (rev. 25 Mar 2026; cites Mård 1975, Holmström 1981, Glimne 2016, Werner & Sandgren 1975, etc.) — https://kortspel.lyckans-talisman.se/Spelbeskrivningar-html/Kasino.html ; [05-S33-index] Lyckans Talisman home page, fishing-games section — https://kortspel.lyckans-talisman.se/
- [05-S34] Lyckans Talisman, "Byggkasino" (rev. 26 Mar 2026; cites Glimne 2016, Werner & Sandgren 1975, Ostrow 1949, Foster 1914) — https://kortspel.lyckans-talisman.se/Spelbeskrivningar-html/Byggkasino.html
- [05-S35] sv.wikipedia, "Kasino (kortspel)" — https://sv.wikipedia.org/wiki/Kasino_(kortspel) ; [05-S35-Krypkasino] sv.wikipedia, "Krypkasino" — https://sv.wikipedia.org/wiki/Krypkasino
- [05-S36] Svenska Akademiens ordbok (SAOB), "kasino" (publ. 1935) — https://www.saob.se/artikel/?seek=kasino&pz=1
- [05-S37] SAOB, "tabbe" sbst.² (card sense) and sbst.¹ (blunder) (publ. 2002) — https://www.saob.se/artikel/?unik=T_0001-0016.Ev8z&pz=3 ; https://www.saob.se/artikel/?unik=T_0001-0015.0ow7&pz=3
- [05-S38] SAOB, "lill-" compounds (-kajsa/-kasina, -stina) — https://www.saob.se/artikel/?seek=lillkajsa&pz=1
- [05-S39] fi.wikipedia, "Kasino (korttipeli)" — https://fi.wikipedia.org/wiki/Kasino_(korttipeli)
- [05-S40] Mikko Saari, "Kasino," *Korttipeliopas* (9 Jul 2010) with reader comments 2014–2026 — https://korttipeliopas.fi/kasino
- [05-S41] no.wikipedia, "Kasino (kortspill)" (tagged *Kildeløs*) — https://no.wikipedia.org/wiki/Kasino_(kortspill)
- [05-S42] Rolf Bryhn, "kasino – kortspill," *Store norske leksikon* — https://snl.no/kasino_-_kortspill
- [05-S43] da.wikipedia, "Kasino (kortspil)" (tagged *ingen kilder*) — https://da.wikipedia.org/wiki/Kasino_(kortspil)
- [05-S44] Svend Novrup, "kasino – kortspil," *Lex.dk* — https://lex.dk/kasino_-_kortspil
- [05-S93] fi.wikipedia, "Risti (maa)," "Pata (maa)," "Ruutu (maa)" — https://fi.wikipedia.org/wiki/Risti_(maa) etc.

**German**
- [05-S45] de.wikipedia, "Casino (Kartenspiel)" — https://de.wikipedia.org/wiki/Casino_(Kartenspiel)

**Italian**
- [05-S46] it.wikipedia, "Scopa (gioco)" — https://it.wikipedia.org/wiki/Scopa_(gioco)
- [05-S47] en.wikipedia, "Scopa" — https://en.wikipedia.org/wiki/Scopa
- [05-S48] Shirley Phillips, "How Scopa, the Italian card game, brought us closer together," *The Globe and Mail* (First Person), 17 Oct 2023 — https://www.theglobeandmail.com/life/first-person/article-how-scopa-the-italian-card-game-brought-us-closer-together/
- [05-S49] Learn Italian Pod, "Scopa Rules: How to Play Scopa in 5 Easy Steps" (6 Jul 2023) — https://www.learnitalianpod.com/2023/07/06/how-to-play-scopa/
- [05-S50] See You In Italy, "Scopa Rules!" — https://www.seeyouinitaly.com/italian-card-games/scopa/

**Spanish (Escoba, Cuarenta)**
- [05-S51] OPQA, "Manual de la Escoba" — https://opqa.com/ayuda/manual_escoba.html
- [05-S52] ElOtroLado.net forum, "duda sobre la escoba (juego de cartas)" (Feb–Mar 2005) — https://www.elotrolado.net/hilo_duda-sobre-la-escoba-juego-de-cartas_390992
- [05-S53] en.wikipedia, "Cuarenta" — https://en.wikipedia.org/wiki/Cuarenta
- [05-S54] es.wikipedia, "40 (juego de naipes)" — https://es.wikipedia.org/wiki/40_(juego_de_naipes)
- [05-S55] *El Universo*, "El Mundial de Cuarenta, una tradición que une a Quito en sus fiestas de fundación" — https://www.eluniverso.com/noticias/ecuador/el-mundial-de-cuarenta-una-tradicion-que-une-a-quito-en-sus-fiestas-de-fundacion-nota/
- [05-S56] *El Comercio* (Quito), "¿Cómo se juega 40? El popular juego de Fiestas de Quito" — https://www.elcomercio.com/deportes/futbol/cuarenta-juego-cartas-fiestas-quito/
- [05-S57] *El Comercio* (Quito), "El cuarenta, una tradición en las fiestas quiteñas" — https://www.elcomercio.com/actualidad/cuarenta-tradicion-fiestas-quitenas/
- [05-S58] *El Telégrafo*, "El 40, el juego tradicional en Fiestas de Quito" — https://www.eltelegrafo.com.ec/noticias/locales/189/el-40-el-juego-tradicional-en-fiestas-de-quito
- [05-S59] 40 Caída y Limpia (commercial deck maker), "Reglas para jugar 40" — https://40caidaylimpia.com/reglas-para-jugar-40/

**Portuguese**
- [05-S73] pt.wikipedia, "Escova (jogo de cartas)" — https://pt.wikipedia.org/wiki/Escova_(jogo_de_cartas)

**Arabic / Persian / Greek / Turkish**
- [05-S61] en.wikipedia, "Bastra" — https://en.wikipedia.org/wiki/Bastra
- [05-S62] White Knuckle Cards, "Basra" — https://whiteknucklecards.com/games/basra.html
- [05-S64] en.wikipedia, "Pasur (card game)" — https://en.wikipedia.org/wiki/Pasur_(card_game)
- [05-S65] Dan Ahmadi, "Persian Card Game Guide: Pasur, Hokm and Iranian Classics," playpasur.com (11 Sep 2026) — https://playpasur.com/blog/persian-card-game-guide
- [05-S66] fr.wikipedia, "Chkobba" (tagged *À sourcer*; bibliography: Lhôte 1993; Mascort 2021) — https://fr.wikipedia.org/wiki/Chkobba
- [05-S67] Chkobba.gg, "About Chkobba — History & Culture" `[promo]` — https://chkobba.gg/about
- [05-S68] tr.wikipedia, "Pişti" — https://tr.wikipedia.org/wiki/Pişti
- [05-S69] Uzmanlar Diyor Ki, "Pişti Nasıl Oynanır? Puan Hesaplama ve Taktikler" — https://uzmanlardiyorki.com/pisti-nasil-oynanir/
- [05-S70] ipy.gr, "Πως παίζεται η ξερή;" (18 Oct 2019) — https://ipy.gr/2019/10/18/pos-paizetai-i-jeri/
- [05-S71] cardgamesgr.blogspot.com, "Ξερή" (Mar 2014) — https://cardgamesgr.blogspot.com/2014/03/blog-post.html
- [05-S72] alogomouris.blogspot.com, "Οι κανόνες της Δηλωτής" (Feb 2011), reproducing Γιώργος Κουσουνέλος, *Το αλφαβητάρι του χαρτοπαίκτη* (Δίαυλος) — http://alogomouris.blogspot.com/2011/02/blog-post_5755.html (same text: https://pefkon.blogspot.com/2014/10/blog-post_99.html, http://ligakaikala.blogspot.com/2020/02/blog-post_95.html)
- [05-S94] Datça Haber, "Pişti olmak ya da pişpirik oynamak…" — https://www.datca-haber.com/makale/pisti-olmak-ya-da-pispirik-oynamak-1005

**Encyclopedic / dictionary / modern English rules**
- [05-S2] en.wikipedia, "Cassino (card game)" (raw wikitext) — https://en.wikipedia.org/wiki/Cassino_(card_game)
- [05-S76] Denexa Games blog, "Cassino" (24 Oct 2014) — https://www.denexa.com/blog/cassino/
- [05-S77] Gather Together Games, "Casino" — https://www.gathertogethergames.com/casino
- [05-S78] Triple S Games, "How to play Casino," YouTube video description — https://www.youtube.com/watch?v=6rftQLsv6Uk
- [05-S79] Online Etymology Dictionary, "casino" — https://www.etymonline.com/word/casino
- [05-S80] YouTube metadata: CreekTV, "Haitian Card Game 'Casino' - Culture N' the Creek" — https://www.youtube.com/watch?v=-UaCbzqbTu4 ; Khasino South Africa, "Khasino Game Play - OB vs 22 Pagez" — https://www.youtube.com/watch?v=m9LirEGUQqs
- [05-S81] Khasino Association of Southern Africa (KASA) — http://www.khasino.co.za (text extracted from site bundle)

**BoardGameGeek (user-generated)** — Casino, BGG id 18121, retrieved via `api.geekdo.com/api/articles?threadid=…`
- [05-S74-BGG85266] "A simple and elegant card game" (review, 2005; replies 2021–22) — https://boardgamegeek.com/thread/85266
- [05-S74-BGG952175] "This vs. Scopa?" (2013) — https://boardgamegeek.com/thread/952175
- [05-S74-BGG826479] "iOS app for Casino?" (2012) — https://boardgamegeek.com/thread/826479
- [05-S74-BGG3574955] "Increasing opponent's build to match an existing build?" (2025–26) — https://boardgamegeek.com/thread/3574955
- [05-S74-BGG1893693] "Can you Do BOTH a Single Build & a Multiple Build in the Same Turn?" (2017) — https://boardgamegeek.com/thread/1893693
- [05-S74-BGG1221271] "how to play - reward 5gg" (2014) — https://boardgamegeek.com/thread/1221271
- [05-S74-BGG2988271] "Cassino solo variant" (2022) — https://boardgamegeek.com/thread/2988271
- [05-S74-BGG1156351] "4 stack variation" (2014) — https://boardgamegeek.com/thread/1156351
- [05-S74-BGG597527] "Scoring Variant" (2010) — https://boardgamegeek.com/thread/597527
- [05-S74-BGG433043] "Variants for Casino" (2009; Finnish mökki/laisto) — https://boardgamegeek.com/thread/433043
- [05-S74-BGG122955] "Card and spades bonus" (2006) — https://boardgamegeek.com/thread/122955
- [05-S74-BGG90163] "Steal the Old Man's Bundle" (2005–10) — https://boardgamegeek.com/thread/90163
- (also read: threads 1204559, 1585503, 703492, 3239537)

**Reddit (user-generated)** — retrieved via the Pullpush.io archive API (reddit.com blocks automated fetches)
- [05-S90] r/AskReddit comment, 2023-05-18 ("Pronounced 'Cersina'") — https://www.reddit.com/r/AskReddit/comments/13kcn60/what_obvious_thing_did_you_recently_realize/jkn3n7n/
- [05-S91] r/Random_Acts_Of_Amazon comment, 2018-11-27 ("skunking") — https://www.reddit.com/r/Random_Acts_Of_Amazon/comments/a0unxv/tortilla_blanket_tuesday_hangout_thread_27_nov/eal4w4j/
- [05-S92] r/cardgames, "What variant of Cassino would this be?" 2025-10-15 ("kasino kryp", "Sweep 9") — https://www.reddit.com/r/cardgames/comments/1o7oazc/what_variant_of_cassino_would_this_be/
- [05-S95] r/spades, "Looking to begin playing Spades," 2025-03-28 (Dominican Royal Cassino) — https://www.reddit.com/r/spades/comments/1jm4kuq/looking_to_begin_playing_spades/
- [05-S96] r/cardgames comment, 2026-03-20 ("with my grandpa") — https://www.reddit.com/r/cardgames/comments/1h8ultq/discover_pocket_cassino_a_modern_twist_on_a/obgmjeo/
- [05-S97] r/boardgames comment, 2025-11-29 ("with my grandma") — https://www.reddit.com/r/boardgames/comments/7oeq0k/my_thoughts_on_the_board_game_designed_by_the/nrfklss/
- [05-S98] r/playingcards comment, 2026-08-06 ("with my father") — https://www.reddit.com/r/playingcards/comments/1vfxkkz/does_anyone_know_about_other_interesting/p1ypb8q/
- [05-S99] r/boardgames comment, 2024-08-26 (Polish-American family; "Cztery punkty") — https://www.reddit.com/r/boardgames/comments/1f0vb4o/english_name_of_the_cardgame_cztery_punkty/ljypqdv/
- [05-S100] r/cardgames, "Am I the only one," 2025-09-07, and replies ndvy56e, net4xvq — https://www.reddit.com/r/cardgames/comments/1nay4tx/am_i_the_only_one/
- [05-S101] r/DarkNetMarkets comment d7h98ux (2016-09-10) — https://www.reddit.com/comments/524ckh/_/d7h98ux ; r/AskReddit comment c4u0mav (2012-05-30) — https://www.reddit.com/comments/uaaun/_/c4u0mav


### Note 06: 06 — Scorekeepers, physical aids, and digital implementations of Cassino and its relatives

(Full note: `research/06-tools-scorekeepers-digital.md`)


- [06-S1] *Foster's Complete Hoyle* (R. F. Foster), 1897 ed., "Cassino" pp. 441–448 (scoring, building, "Two Sevens", sweeps marked face up, irregularities, "Showing", Twenty-One Point, Royal, Spade Cassino). archive.org id `fosterscomplete00fostgoog`, full text https://archive.org/download/fosterscomplete00fostgoog/fosterscomplete00fostgoog_djvu.txt
- [06-S2] John McLeod, "Casino", pagat.com (last updated 6 May 2026): https://www.pagat.com/fishing/casino.html (fetched via /fishing/cassino.html). Sections: Deal ("last"), Sweeps ("clear"), Scoring variants (11/50 points, CT/NY 3-2-1, count as earned with 7/27 thresholds), Software.
- [06-S3] John McLeod, "Nordic Casino", pagat.com: https://www.pagat.com/fishing/nordic_casino.html (Swedish *tabbe* marker; Finnish Kasino scoring, *mökki*, 16 points).
- [06-S4] John McLeod (with J. Dushoff, F. Asmal), "African Casino", pagat.com: https://www.pagat.com/fishing/african_casino.html (face-up capture piles, build owners, "drifting", "chow").
- [06-S5] John McLeod, "Scopa", pagat.com: https://www.pagat.com/fishing/scopa.html (scopa marked face up; software list incl. Thanos, Net.Scopa/Net.Chkobba).
- [06-S6] John McLeod, "Pâsur", pagat.com: https://www.pagat.com/fishing/pasur.html (Sur marker and cancellation; 50-point rule; playpasur.com link).
- [06-S7] Wikipedia, "Cassino (card game)", raw wikitext fetched 2026-10-02: https://en.wikipedia.org/w/index.php?title=Cassino_(card_game)&action=raw (lurch; 21-point Cassino from "Trumps" 1880 p. 181; Spade Cassino on a cribbage board from Foster 1897 p. 448).
- [06-S8] Wikipedia (fi), "Kasino (korttipeli)", raw: https://fi.wikipedia.org/w/index.php?title=Kasino_(korttipeli)&action=raw (mökki marked crosswise, non-point-card tip, "jää pakkaan" carry-over, exact-16 variant).
- [06-S9] Mikko Saari, "Kasino", Korttipeliopas.fi: https://korttipeliopas.fi/kasino
- [06-S10] "How To Play Cassino", CatsAtCards: https://www.catsatcards.com/Games/Cassino.html (fetched via WebFetch; "Building Nines", "Last", "count out", scoring order).
- [06-S11] Winning Moves Inc., *SCOPA™ The Great Italian Card Game* rules sheet (© 2011): https://winning-moves.com/images/scopa%20rulesv2.pdf (contents incl. "pad of score sheets", "2 scoring cards"; sample scoresheet with "s").
- [06-S12] US Patent 599,767, Richard G. Clarke, "Game-Pieces" (filed 3 Jun 1897, issued 1 Mar 1898). PDF https://patentimages.storage.googleapis.com/pdfs/US599767.pdf; Google Patents page US599767A.
- [06-S13] US Patent 1,012,574, Emma F. Adams, "Playing-Cards" (filed 13 Dec 1910, issued 26 Dec 1911). https://patentimages.storage.googleapis.com/pdfs/US1012574.pdf
- [06-S14] US Patent 745,879, Catherine C. Meriwether, "Playing-Cards" (filed 9 Oct 1903, issued 1 Dec 1903). https://patentimages.storage.googleapis.com/pdfs/US745879.pdf
- [06-S15] US Patent 1,743,613, Isadore L. Lesavoy, "Playing Cards" (filed 4 Jan 1929, issued 14 Jan 1930). https://patentimages.storage.googleapis.com/pdfs/US1743613.pdf
- [06-S16] Google Patents query results (xhr endpoint) for q=cassino, cassino+card, cassino+counter, cassino+score, "little casino", casino+"big casino" before 1970, run 2026-10-02 (https://patents.google.com/?q=cassino); full texts of US 2006/0249907 A1 (Wong & Anderson, "East-West Cassino") and US 8,511,687 B2 (Kennedy) checked via https://patentimages.storage.googleapis.com/pdfs/US20060249907.pdf and …/US8511687.pdf: gambling patents, not relevant.
- [06-S17] Antique Card and Table Games (dealer), "Card Games 1801–1850": https://antiquecardandtablegames.co.uk/card-games-1801-1850/ ("1820 – The Musical Game of Pope Joan, Cassino & Commerce", Chappell & Co).
- [06-S18] V&A Collections API search: https://api.vam.ac.uk/v2/objects/search?q=cassino ; Smithsonian Open Access API search: https://api.si.edu/openaccess/api/v1.0/search?q=cassino+game (2026-10-02).
- [06-S19] Google Play, "Cassino Card Game" (Zol's Apps): https://play.google.com/store/apps/details?id=com.zolsapps.cassino. Listing, metadata and ~288 reviews retrieved via google-play-scraper 2026-10-02 (quoted reviews dated as shown).
- [06-S20] Google Play, "Casino Card Game" (Paris Pinkney): https://play.google.com/store/apps/details?id=casino.game. Listing and ~287 reviews, same method.
- [06-S21] Google Play, "G4A: Cassino" (Games4All): https://play.google.com/store/apps/details?id=org.games4all.android.games.cassino.prod. Listing and ~96 reviews.
- [06-S22] Google Play, "Cassino Card Game SA / South Africa" (DZ Code): https://play.google.com/store/apps/details?id=com.dzsoftware.topten. Listing and ~94 reviews; ZA-store rating from search with country=za.
- [06-S23] Google Play, "Cassino Card Game Classic" (DZ Code): https://play.google.com/store/apps/details?id=com.dzsoftware.cassinoclassic
- [06-S24] Google Play, "Kasino – Cassino Card Game" (O-P Card House): https://play.google.com/store/apps/details?id=com.opcardhouse.kasino ; developer site "Kasino of The North": http://www.opsahkopalvelut.fi/opcardhouse/
- [06-S25] Pocket Cassino: App Store https://apps.apple.com/app/pocket-cassino/id6475610484 (iTunes lookup API); Google Play https://play.google.com/store/apps/details?id=com.pocketofgames.pocketcassino
- [06-S26] App Store, "Cassino!" (Michael Dokken), id527702079: iTunes lookup API https://itunes.apple.com/lookup?id=527702079 and ratings/reviews page https://apps.apple.com/us/app/id527702079?see-all=reviews (reviews 2016–2025 with developer responses).
- [06-S27] Google Play, "Cassino!" (Michael Dokken): https://play.google.com/store/apps/details?id=com.mkdokken.cassino (description: variations, Insane, Replay mode, per-variation stats, gambling disclaimer).
- [06-S28] App Store, "Cassino Royale" (PikeSquare, LLC), id6780693107: https://itunes.apple.com/lookup?id=6780693107
- [06-S29] (reserved; not used)
- [06-S30] iTunes Search API results for "cassino", "casino card game", "kasino", "scopa", "pasur", "basra" (US store, 2026-10-02): https://itunes.apple.com/search?term=cassino&entity=software
- [06-S31] Board Game Arena, Cassino game panel: https://en.boardgamearena.com/gamepanel?game=cassino ; BGA wiki quick rules: https://en.doc.boardgamearena.com/Gamehelpcassino
- [06-S32] CardzMania, "Cassino": https://www.cardzmania.com/Cassino
- [06-S33] Psellos, "Cassino in the Browser": https://psellos.com/cassino/ and "Cassino Interface": https://psellos.com/cassino/touch-interface.html (fetched via WebFetch).
- [06-S34] SpiteNET, *Cassino by SpiteNET*: http://www.spitenet.com/Cassino/ , how-to-play http://www.spitenet.com/Cassino/play.htm , screenshots http://www.spitenet.com/Cassino/shots.htm , about http://www.spitenet.com/Cassino/about.htm
- [06-S35] Thanos Card Games: https://thanoscardgames.jimdofree.com/
- [06-S36] CardGames.io, "Escoba" (rules and error-report text): https://cardgames.io/escoba/ ; 404 checks for https://cardgames.io/casino/ and /cassino/.
- [06-S37] Steam store search API (https://store.steampowered.com/api/storesearch/?term=cassino …) and appdetails/reviews for *Scopa Sweep* (app 5048870) and *Escoba* (app 3866030), 2026-10-02.
- [06-S38] Wikipedia raw wikitext of "Hoyle Card Games", "Clubhouse Games", "Clubhouse Games: 51 Worldwide Classics", "Microsoft Entertainment Pack" (no Cassino/Casino card-game mention; 2026-10-02).
- [06-S39] (reserved; not used)
- [06-S40] Google Play Scopa-family listings and reviews (google-play-scraper; Italian store for the first four):
  - WhatWapp "Scopa: la Sfida": https://play.google.com/store/apps/details?id=com.WhatWapp.Scopa
  - Escogitare "Scopa!": …?id=com.escogitare.scopa
  - Spaghetti Interactive "Scopa Più": …?id=it.spaghettiinteractive.scopapiu
  - Digitalmoka "Scopa originale Dal Negro": …?id=com.digitalmoka.scopadalnegro
  - Lisitso "Scopa (Broom)": …?id=com.application.game.scopa
  - Escogitare "Scopa 15": …?id=com.escogitare.scopa15
- [06-S41] App Store, "Scopa!" (Sonya Marcarelli) id455507367 and "Scopa Pro" (Evocon) id501678276, via https://itunes.apple.com/lookup?id=455507367
- [06-S42] Google Play listings and reviews:
  - Egyptian Basra v2: https://play.google.com/store/apps/details?id=com.theedarkseraph.egybasra
  - Egyptian Basra – كوتشينه: …?id=eg.kotshena.kotshenamasrya
  - Chkobba Tn: …?id=com.chadli.ChkobbaTn
  - Pasur/Chaharbarg 11 (IcecreamLab): …?id=ir.IcecreamLab.RemasteredCharbarg
  - Xeri+: …?id=com.charisis.xeriplusplus
- [06-S43] App Store, "Pasur11" (mahmoud amiri), id1329519990: https://itunes.apple.com/lookup?id=1329519990
- [06-S44] App Store, "Δηλωτή – Diloti Card Game" (Themistoklis Valtinos), id6763237145: https://itunes.apple.com/lookup?id=6763237145
- [06-S45] playpasur.com: https://playpasur.com/ (via WebFetch).
- [06-S46] Google Play, "Scopa Scorer" (GiMiSiS Interactive): https://play.google.com/store/apps/details?id=com.gimisis.pointerscopa ; "Scopa Scorer" (Matthew Miner): …?id=name.matthewminer.scopascorer
- [06-S47] GitHub, nigeleke/scopa (scoring app) README: https://github.com/nigeleke/scopa
- [06-S48] Google Play, "Cassino Pro: Card Game" (Sizo Develops II): https://play.google.com/store/apps/details?id=com.sizodevelops.sacasino
- [06-S49] S. Di Palma & P. L. Lanzi, "Traditional Wisdom and Monte Carlo Tree Search Face-to-Face in the Card Game Scopone", *IEEE Transactions on Games*, 2018, doi:10.1109/TG.2018.2834618 (abstract via OpenAlex https://api.openalex.org/works/https://doi.org/10.1109/tg.2018.2834618).
- [06-S50] Zol's Apps homepage: http://www.zolsapps.com ("I played it with my daughters when they were young…").
- [06-S51] Pocket of Games, "Pocket Cassino — Rules, Strategy & Download": https://pocketofgames.com/pocket-cassino/
- [06-S52] Google Play search results (google-play-scraper `search`, US store) for "cassino card game", "casino card game build capture", "kasino", "scopa", "scopone", "pasur", "basra card game", "chkobba", "cassino score keeper", "scopa punteggio segnapunti", 2026-10-02.
- [06-S53] GitHub repository search API, e.g. https://api.github.com/search/repositories?q=cassino+card+game , q=kasino+card, q=cassino+game+scala, q=scopa, q=basra+card, q=scopone (2026-10-02). Includes repo descriptions for PGHM/kasino, SuneReeh/kasino, tikkanr1/Cassino, jooakar/scalassino etc.
- [06-S54] GitHub, penkkaa1/Cassino-cpp README: https://github.com/penkkaa1/Cassino-cpp ; penkkaa1/Cassino (description "Project for 'Programming Studio 2' course"): https://github.com/penkkaa1/Cassino
- [06-S55] GitHub, esst-prog2/casino README ("Homework 2 — Kaszinó"): https://github.com/esst-prog2/casino
- [06-S56] GitHub, basil-dlamini/sa-cassino-play README: https://github.com/basil-dlamini/sa-cassino-play
- [06-S57] GitHub, Malungisa-Mndzebele/cassino-card-game README and `src/lib/components/GameBoard.svelte`: https://github.com/Malungisa-Mndzebele/cassino-card-game
- [06-S58] GitHub, Tebogo60/casino_card_game README: https://github.com/Tebogo60/casino_card_game
- [06-S59] GitHub, mosa-retha/Cassino-game README: https://github.com/mosa-retha/Cassino-game
- [06-S60] GitHub, Thorium/Kasino README (Finnish Kasino and Laistokasino; web build https://thorium.github.io/Kasino/): https://github.com/Thorium/Kasino
- [06-S61] GitHub, RandyNorthrup/american-cassino-releases README: https://github.com/RandyNorthrup/american-cassino-releases
- [06-S62] GitHub, dkmccandless/cassino README: https://github.com/dkmccandless/cassino
- [06-S63] GitHub, cbtechny/Cassinito README: https://github.com/cbtechny/Cassinito
- [06-S64] GitHub, k-Constable/cassino_project README: https://github.com/k-Constable/cassino_project
- [06-S65] P. T. Bell, B. A. Martinez-Ortega, A. Birkenfeld, "Organic Chemistry I Cassino: A Card Game for Learning Functional Group Transformations…", *J. Chem. Educ.* 2020, doi:10.1021/acs.jchemed.9b00995 (abstract via OpenAlex). [Supplementary: an educational re-skin of Cassino, cf. lesson 17.]


### Note 07: 07 — Statistics, mathematics, computation and academic work on Cassino and its fishing-game relatives

(Full note: `research/07-statistics-academic.md`)


- [07-S1] Search log, arXiv full-text search UI (arxiv.org/search) for "scopone", "scopa", "pasur", "cassino", "casino card", "briscola", "fishing card game", "basra", "kasino", "escoba". Fetched 2026-10-02. https://arxiv.org/search/?query=scopone&searchtype=all
- [07-S2] Di Palma, S. & Lanzi, P. L. "Traditional Wisdom and Monte Carlo Tree Search Face-to-Face in the Card Game Scopone." arXiv:1807.06813v1 (18 Jul 2018); *IEEE Transactions on Games* 10(3):317–332 (2018), DOI 10.1109/TG.2018.2834618. PDF https://arxiv.org/pdf/1807.06813 (pp. 1–15, Tables I–VIII).
- [07-S3] Di Palma, S. *Monte Carlo tree search algorithms applied to the card game Scopone.* Tesi di laurea magistrale, Politecnico di Milano (relatore P. L. Lanzi), 18 Dec 2014. https://www.politesi.polimi.it/handle/10589/102246 ; PDF https://www.politesi.polimi.it/retrieve/a81cb05b-1c24-616b-e053-1605fe0a889a/2014_12_DiPalma.pdf (Ch. 5, Tables 5.1–5.2, pp. 60–62).
- [07-S4] Świechowski, M., Godlewski, K., Sawicki, B. & Mańdziuk, J. "Monte Carlo Tree Search: A Review of Recent Modifications and Applications." arXiv:2103.04931; *Artificial Intelligence Review* (2022), DOI 10.1007/s10462-022-10228-y. https://arxiv.org/pdf/2103.04931
- [07-S5] Baghal, S. "Solving Pasur Using GPU-Accelerated Counterfactual Regret Minimization." arXiv:2508.06559v1 (6 Aug 2025). https://arxiv.org/abs/2508.06559 (Tables 1, 2, 15, 16; §3).
- [07-S6] Li, B. & Huang, L. "GPU-CFR: 80x Faster Counterfactual Regret Minimization by Compiling the Game to Static Dataflow and CUDA Graph Replay." arXiv:2609.11923 (Sept 2026). https://arxiv.org/pdf/2609.11923
- [07-S7] Li, B., Chen, Y. & Huang, L. "Correlated Chance Sampling for Monte Carlo Counterfactual Regret Minimization." arXiv:2607.27035 (July 2026). https://arxiv.org/pdf/2607.27035
- [07-S8] Goadrich, M., Morenville, A. & Piette, É. "Valet: A Standardized Testbed of Traditional Imperfect-Information Card Games." arXiv:2603.03252v1 (3 Mar 2026). https://arxiv.org/pdf/2603.03252 (Table 1; §§2–3).
- [07-S9] Niklaus, J., Alberti, M., Pondenkandath, V., Ingold, R. & Liwicki, M. "Survey of Artificial Intelligence for Card Games and Its Application to the Swiss Game Jass." arXiv:1906.04439 (2019), DOI 10.1109/SDS.2019.00-12. https://arxiv.org/pdf/1906.04439 (ref. [11]).
- [07-S10] Valet project site sources (GitHub mgoadric/valet): `_posts/2026-01-15-scopa.md` and `assets/games/Scopa2.rcy`. https://github.com/mgoadric/valet
- [07-S11] CardStock repository (GitHub mgoadric/cardstock): `CardStock/games/Escoba2.rcy`, `Scopa2.rcy`, `BustedJunk/Scopone4.rcy`, `Analysis/ChoicesScopa.png`, `Analysis/MScopaScores.png`. https://github.com/mgoadric/cardstock
- [07-S12] Bell, P. T., Martinez-Ortega, B. A. & Birkenfeld, A. "Organic Chemistry I Cassino: A Card Game for Learning Functional Group Transformations for First-Semester Students." *J. Chem. Educ.* (2020). DOI 10.1021/acs.jchemed.9b00995. Abstract via OpenAlex W3027393209.
- [07-S13] WildPino/scopa-master README (GitHub). https://github.com/WildPino/scopa-master
- [07-S14] DeLnlyMthrLvr/ScopaAI_ToM README (Alessandro Castoldi). https://github.com/DeLnlyMthrLvr/ScopaAI_ToM
- [07-S15] Barros Morales, R., Rodríguez Domínguez, L. de los Á. & Barros Bastidas, C. "El juego del cuarenta, una opción para la enseñanza de las matemáticas y las ciencias sociales en Ecuador." *Revista Universidad y Sociedad* 7(2):137–144 (2015). Record and abstract via OpenAlex W2203167364 (https://api.openalex.org/works/W2203167364).
- [07-S16] Gualli Ushiña, R. F. & Angamarca Pupiales, O. S. *Estudio de procedimientos y algoritmos para el reconocimiento automático de las cartas de un jugador de 40 no vidente.* Universidad Politécnica Salesiana, 2016. http://dspace.ups.edu.ec/handle/123456789/13371 (abstract via OpenAlex W2581111615).
- [07-S17] Luperto, M. et al. "Integrating Social Assistive Robots, IoT, Virtual Communities and Smart Objects to Assist at-Home Independently Living Elders: the MoveCare Project." *International Journal of Social Robotics* (2022), DOI 10.1007/s12369-021-00843-0. Full text PMC8853423: https://pmc.ncbi.nlm.nih.gov/articles/PMC8853423/
- [07-S18] Giacomelli, P. "Beyond the briscola advantage: a Monte Carlo dominance test for deterministic strategies in two-player Briscola Game." arXiv:2605.17043 (2026). https://arxiv.org/abs/2605.17043
- [07-S19] Favero, G. "Qual è la probabilità di fare scopa all'apertura delle carte?" vialattea.net, Chiedi all'esperto, 13/08/2003. https://www.vialattea.net/content/480/
- [07-S20] Tartaluca21/scopa-engine-ai, README and EMPIRICAL_FINDINGS.md (GitHub). https://github.com/Tartaluca21/scopa-engine-ai
- [07-S21] Foster, R. F. *Foster's Complete Hoyle* (New York, 1897), "Cassino", pp. 441–448. Internet Archive id `fosterscomplete00fostgoog`, https://archive.org/download/fosterscomplete00fostgoog/fosterscomplete00fostgoog_djvu.txt
- [07-S22] GitHub repository search API results and READMEs (queries: cassino card, kasino card, scopa ai, scopone, escoba card, basra card, cuarenta card, chkobba, tablanet, pasur), including PGHM/kasino, penkkaa1/Cassino, jooakar/scalassino, Nic98/Pasur-Trainer, joseduc10/cuarenta, assilrguez/Chkobba_AI, Binary-Team/Rachma-Android. https://api.github.com/search/repositories?q=cassino+card (fetched 2026-10-02).
- [07-S23] McLeod, J. "Casino – Card Game Rules." pagat.com, last updated 6 May 2026. https://www.pagat.com/fishing/casino.html
- [07-S24] McLeod, J. "pagat.com statistics" (Popular Game Pages; Difficulty, Popularity and Trend; Notes), last updated 1 Oct 2026. https://www.pagat.com/statistics/
- [07-S25] YouGov. "YouGov Survey: Card Games." Crosstabs, sample 1000 U.S. adult citizens, 10–12 May 2023. https://d3nkl3psvxxpe9.cloudfront.net/documents/crosstabs_Card_Games.pdf (Q4, p. 2).
- [07-S26] Google Books Ngram Viewer JSON API, queries fetched 2026-10-02, e.g. https://books.google.com/ngrams/json?content=cassino&year_start=1700&year_end=2019&corpus=en&smoothing=3 (plus en-US, en-GB, it, es corpora and phrase queries listed in §5.4).
- [07-S27] Wikimedia REST API, per-article monthly pageviews (user agents), 2016-01 to 2025-12, e.g. https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/Cassino_(card_game)/monthly/2016010100/2025123100 ; redirect resolution via https://en.wikipedia.org/w/api.php?action=query&titles=Basra_(card_game)|Xeri&redirects=1
- [07-S28] Wikipedia contributors. "Cassino (card game)." English Wikipedia, raw wikitext fetched 2026-10-02. https://en.wikipedia.org/w/index.php?title=Cassino_(card_game)&action=raw
- [07-S30] arXiv API queries (export.arxiv.org), fetched 2026-10-02, e.g. https://export.arxiv.org/api/query?search_query=all:cassino+AND+all:card
- [07-S31] OpenAlex works search API, fetched 2026-10-02, e.g. https://api.openalex.org/works?search=scopone
- [07-S32] CrossRef works API, fetched 2026-10-02, e.g. https://api.crossref.org/works?query.bibliographic=cassino%20card%20game
- [07-S33] Ludii: portal https://ludii.games/details.php?keyword=Scopa (no game page) and GitHub tree https://api.github.com/repos/Ludeme/Ludii/contents/Common/res/lud
- [07-S34] Web searches (site:diva-portal.org kasino kortspel; site:theseus.fi kasino korttipeli), 2026-10-02.
- [07-S35] Psellos. "Cassino Rules." https://psellos.com/cassino/rules.html (via WebFetch).
- [07-S36] rcantore/escoba15 README (GitHub). https://github.com/rcantore/escoba15
- [07-S37] dkmccandless/cassino README (GitHub). https://github.com/dkmccandless/cassino
- [07-S38] Thorium/Kasino README (GitHub). https://github.com/Thorium/Kasino
- [07-S40] ORIGINAL COMPUTATION: `research/sim/cassino_sim.py` + `research/sim/run_experiments.py` → `research/sim/results.json` (seed 20261002).
- [07-S41] ORIGINAL COMPUTATION: `research/sim/mechanism.py` → `research/sim/mechanism_heuristic.json` (seed 11, 4,000 hands), `mechanism_greedy.json` (seed 12, 10,000), `mechanism_random.json` (seed 13, 10,000).
- [07-S42] ORIGINAL COMPUTATION: `research/sim/combinatorics.py` → `research/sim/combinatorics_out.json`.
- [07-S43] ORIGINAL COMPUTATION: `research/sim/pimc.py` → `research/sim/pimc_self_*.json`, `research/sim/pimc_vs_heur_*.json`; invariant tests `research/sim/test_invariants.py`.


### Note 08: 08 — Cassino strategy and tactics: a cited compendium

(Full note: `research/08-strategy.md`)


- **[08-S1]** Robert Long, *Short Rules for Playing the Game of Cassino* (Twickenham?, 1792), 12 pp. Maxims I–V p.3, VI–IX p.4; "Of Playing" pp.6–8; "N.B. … remember the Cards" p.12. Read from page images (OCR unusable). archive.org id `bim_eighteenth-century_short-rules-for-playing-_long-robert_1792`, https://archive.org/details/bim_eighteenth-century_short-rules-for-playing-_long-robert_1792 (page images n2–n11).
- **[08-S2]** *The Sporting Magazine*, vol. III (London, 1793–94):
  - "Rules and Instructions for playing the Game of Cassino", No. XIV (Nov 1793) pp.88–89, rules 1–10
  - "Further Rules for Playing", No. XV (Dec 1793) pp.124–125, rules 11–21
  - concluding instalment on four-, three- and two-handed play
  - "The Game at Cassino. A Conversation" (letter signed Carolus, Jan. 20, 1794), p.~197

  archive.org `sportingmagazine03londuoft`, https://archive.org/details/sportingmagazine03londuoft (djvu text lines ~11060–11290, 16730–16860, 25624–25780, 27099–27150).
- **[08-S3]** *Hoyle's Games Improved*, revised and corrected by Charles Jones, Esq. (London, 1796), "The Game of Cassino", pp.298–300. archive.org `bim_eighteenth-century_hoyles-games-improved-b_hoyle-edmond_1796`.
- **[08-S4]** Henry G. Bohn (ed.), *The Hand-book of Games* (London, 1850), "Cassino" pp.330–332, "Rules". archive.org `handbookofgamesc00bohn`.
- **[08-S5]** [W. B. Dick], *The American Hoyle; or, Gentleman's Hand-book of Games* (New York: Dick & Fitzgerald, 1864), "Cassino" pp.218–222 incl. "Maxims for Playing". archive.org `americanhoyleorg00dick`.
- **[08-S6]** [W. B. Dick], *The American Card Player* (New York, 1866), "The Mode of Playing Cassino" pp.128–130. archive.org `americancardplay00dick`.
- **[08-S7]** *Cassell's Book of In-door Amusements, Card Games, and Fireside Fun*, 3rd ed. (London: Cassell, Petter, Galpin & Co., undated, c.1881), "Cassino". Project Gutenberg #49137, https://www.gutenberg.org/ebooks/49137.
- **[08-S8]** Baxter-Wray [W. H. Peel], *Round Games with Cards* (London, 1891/1897), "Cassino" pp.97–100. Project Gutenberg #27819, https://www.gutenberg.org/ebooks/27819.
- **[08-S9]** R. F. Foster, *Foster's Complete Hoyle* (New York: Stokes, 1897; rev. 1909, 1914), "Cassino" pp.478–485 incl. "Trailing", "Last Cards", "Suggestions for Good Play", "Twenty-one Point Cassino", "Royal/Spade/Draw Cassino"; "Discrimination" in the laws chapter. Project Gutenberg #53881, https://www.gutenberg.org/ebooks/53881. The 1897 text was checked as identical: archive.org `fosterscomplete00fostgoog`.
- **[08-S10]** *The American Hoyle* (New York: Dick & Fitzgerald, 1892 ed.), "Cassino" pp.316–322, incl. "Three and Four Handed Cassino". archive.org `americanhoyle0000unse`.
- **[08-S11]** Paul H. Seymour, *The New Hoyle Standard Games* (Laidlaw Brothers, 1929), "Rules for Playing Cassino" pp.115–116. archive.org `newhoylestandard0000paul_n1n9`.
- **[08-S12]** Albert H. Morehead & Geoffrey Mott-Smith, *Games for Two* (1947), Casino, "Pointers on Play" (c. pp.36–38). Read through archive.org full-text-search snippets chained together; borrow-only item `gamesfortwo0000albe`.
- **[08-S13]** Albert H. Morehead & Geoffrey Mott-Smith, *Culbertson's Card Games Complete, with Official Rules* (1952), Casino, "Pointers on Casino play" (c. p.258). Read through archive.org full-text-search snippets; `culbertsonscardg0000albe`.
- **[08-S14]** Albert H. Morehead & Geoffrey Mott-Smith, *Hoyle's Rules of Games* (orig. 1946; New American Library printing 1983), Casino "Strategy of Casino" pp.171–172 and "Royal Casino" p.172. Read through archive.org full-text-search snippets; `hoylesrulesofgam00albe_0`.
- **[08-S15]** John Scarne, *Scarne's Encyclopedia of Games* (New York: Harper & Row, 1973), Casino, "Strategy at Casino" and "Royal Casino". Read through archive.org full-text-search snippets; `scarnesencyclope0000scar`.
- **[08-S16]** Edwin Silberstang, *Silberstang's Encyclopedia of Games & Gambling* (New York: Cardoza, 1996), Casino "Strategy" pp.279–281. Same text in *Playboy's Book of Games* (1972/1979). Read through archive.org full-text-search snippets; `silberstangsency00silb`, `playboysbookofga0000silb`.
- **[08-S17]** George F. Hervey, *Card Games for All the Family* (Teach Yourself Books, Hodder & Stoughton, 1977; 3rd impr. 1982), Casino, "Strategy". Read through archive.org full-text-search snippets; `cardgamesforallf0000herv`.
- **[08-S18]** Peter Arnold, *The Book of Card Games* (London: Christopher Helm, 1988), Casino, illustrative hand and counting out. Read through archive.org full-text-search snippets; `bookofcardgames0000arno`.
- **[08-S19]** John McLeod, "Casino", pagat.com (last updated 6 May 2026), incl. "Hint on tactics", partnership trailing example, variations. https://www.pagat.com/fishing/casino.html
- **[08-S20]** pagat.com, "Nordic Casino" — "Tactics" section with examples. https://www.pagat.com/fishing/nordic_casino.html (Swedish version https://www.pagat.com/fishing/kasino_i_norden_sv.html, "Taktik").
- **[08-S21]** pagat.com, "Krypkasino" — "Tactics". https://www.pagat.com/fishing/krypkasino.html
- **[08-S22]** pagat.com, "African Casino" — "Notes on tactics". https://www.pagat.com/fishing/african_casino.html
- **[08-S23]** pagat.com, "Scopone" — "Advice on playing Scopone". https://www.pagat.com/fishing/scopone.html
- **[08-S24]** pagat.com, "Escoba" — "Strategy". https://www.pagat.com/fishing/escoba.html
- **[08-S25]** pagat.com, "Pâsur" — "Tactics" (advice from Ali Jahânshiri). https://www.pagat.com/fishing/pasur.html
- **[08-S26]** pagat.com, "Seep" — "Basic Tactics". https://www.pagat.com/fishing/seep.html
- **[08-S27]** pagat.com, "Cuarenta" — "Tactics". https://www.pagat.com/fishing/cuarenta.html
- **[08-S28]** pagat.com, "Basra" — "Customs and Tactics". https://www.pagat.com/fishing/basra.html
- **[08-S29]** pagat.com, "Diloti". https://www.pagat.com/fishing/diloti.html
- **[08-S30]** "Le regole del Chitarrella (tradotte in italiano)", Sandro Tamanini, pagat.com Italian section (© 2005). https://www.pagat.com/it/fishing/chita.html. **[08-S30b]** Sandro Tamanini, "Lo scopone scientifico", https://www.pagat.com/it/fishing/tamanini.html
- **[08-S31]** "Codice di Chitarrella", it.wikipedia.org (raw wikitext fetched), citing F. Pratesi, *JIPCS* XXVII/4 (1999) 166–172. https://it.wikipedia.org/wiki/Codice_di_Chitarrella
- **[08-S32]** "Scopa (gioco)", it.wikipedia.org, section "Strategia". https://it.wikipedia.org/wiki/Scopa_(gioco)
- **[08-S33]** "Scopa", en.wikipedia.org (tactic of capturing aces and sixes for primiera). https://en.wikipedia.org/wiki/Scopa
- **[08-S34]** "Kasino (kortspill)", no.wikipedia.org, section "Strategi". https://no.wikipedia.org/wiki/Kasino_(kortspill)
- **[08-S35]** Cristian Seres, "Kasino (in English)", korttipelit.net, archived 7 Mar 2013, "The Strategy" and variations. https://web.archive.org/web/20130307135755/www.korttipelit.net/Kasino_in_English
- **[08-S36]** Psellos, "Cassino Strategy" (Cassino in the Browser). http://psellos.com/cassino/strategy.html (rules page http://psellos.com/cassino/rules.html)
- **[08-S37]** "Cassino tips and tricks", *Dan…on games!* blog, 19 Dec 2011. https://danongames.wordpress.com/2011/12/19/cassino-tips-and-tricks/
- **[08-S38]** "Pro Tips", *Dan…on games!* blog, 7 Apr 2011 (Cassino section). https://danongames.wordpress.com/2011/04/07/pro-tips/
- **[08-S39]** BoardGameGeek, Casino (id 18121), review thread "A simple and elegant card game" (2005), thread 85266. Fetched through BGG JSON `api/articles?threadid=85266`. https://boardgamegeek.com/thread/85266
- **[08-S40]** BoardGameGeek, "Noob questions." (2011–2016), thread 703492. https://boardgamegeek.com/thread/703492
- **[08-S41]** BoardGameGeek, "This vs. Scopa?" (2013), thread 952175. https://boardgamegeek.com/thread/952175
- **[08-S42]** BoardGameGeek, "Cassino solo variant" (2022), thread 2988271. https://boardgamegeek.com/thread/2988271
- **[08-S43]** gambiter.com, "Cassino – card game", sections "Advantages gained through building" and "Acting with builds on the table". The text appears to mirror an older English Wikipedia revision; the current Wikipedia article lacks it, and that provenance is unverified. https://gambiter.com/cards/Cassino_card_game.html
- **[08-S44]** Nordic Card Games (Runar), "Casino Card Game Rules", "Tips and strategy" (updated 18 Aug 2026). https://nordiccardgames.com/game/casino
- **[08-S45]** Official Game Rules, "How to Play Casino Card Game", "Strategy Tips". https://officialgamerules.org/game-rules/casino/
- **[08-S46]** Finnish Kasino guides:
  - (a) kasinokorttipeli.fi, "Kasino-korttipeli | Pelisäännöt sekä vinkit voittamiseen", https://kasinokorttipeli.fi/
  - (b) saannot.com, "Kasino korttipeli – Viralliset säännöt, ohjeet ja strategiat", "Strategia ja voittovinkit", https://saannot.com/kasino-korttipeli/
  - also parhaatkorttipelit.fi (not relied on; see Gaps), https://parhaatkorttipelit.fi/kasino-korttipeli-saannot-peliohjeet-ja-vinkit/
- **[08-S47]** Italian Scopa/Scopone strategy pages:
  - (a) DimensionePoker, "Strategie per vincere a Scopa: 6 'trucchi'" (updated 9 May 2025), https://www.dimensionepoker.com/giochi-di-carte/strategie-scopa
  - (b) Ludopoli, "Giocare a scopa online: la regola del pari e dispari!", https://www.ludopoli.it/scopa-online-regola-pari-dispari.aspx/doc/strategie_giochi_carte.aspx
  - (c) Scoponescientifico.net, "Strategie di scopone scientifico: lo spariglio", http://www.scoponescientifico.net/scopone_online_strategia.html
- **[08-S48]** Stefano Di Palma & Pier Luca Lanzi, "Traditional Wisdom and Monte Carlo Tree Search Face-to-Face in the Card Game Scopone", *IEEE Transactions on Games* (2018), doi:10.1109/TG.2018.2834618; preprint arXiv:1807.06813 (read in full). https://arxiv.org/abs/1807.06813
- **[08-S49]** Sina Baghal, "Solving Pasur Using GPU-Accelerated Counterfactual Regret Minimization", arXiv:2508.06559 (Aug 2025). https://arxiv.org/abs/2508.06559
- **[08-S50]** MakinenJO, "Cassino — A card game with human/AI opponents" (GitHub), `brain.py` difficulty multipliers. https://github.com/MakinenJO/Cassino/blob/HEAD/brain.py
- **[08-S51]** spielkarten.org, "Mastering Cassino: A Comprehensive Card Game Guide" (24 Apr 2024) (generic; corroborative only). https://spielkarten.org/en/blog/mastering-cassino-a-comprehensive-card-game-guide/
- **[08-S52]** gamelearn.eu, "Escoba" (Spanish), "Consejos de Estrategia", variants (low reliability; corroborative only). https://gamelearn.eu/es/card-games/escoba
- **[08-S53]** David Parlett, *The Penguin Book of Card Games* (1979; 1987 printing, London: Treasure), "Cassino Games" introduction and "Cassino" (pp.349–355). Read through archive.org full-text-search snippets chained together; `penguinbookofcar0000parl`.


### Note 09: 09 — Cassino variants and the fishing-game family: catalog, comparison, genealogy, origin debate

(Full note: `research/09-variants-family.md`)


- [09-S1] McLeod, J. "Card Games: Fishing Games" (classified index), pagat.com. https://www.pagat.com/fishing/
- [09-S2] McLeod, J. "Casino", pagat.com (last updated 6 May 2026); historical intro based on Pratesi 1995. https://www.pagat.com/fishing/casino.html
- [09-S3] McLeod, J. "Royal Casino" (Dominican, North American, Haitian, Tuxedo, Hungarian Kaszinó), pagat.com. https://www.pagat.com/fishing/royal_casino.html
- [09-S4] McLeod, J. "Nordic Casino" (Sweden, Mulle, Finland), pagat.com. https://www.pagat.com/fishing/nordic_casino.html
- [09-S5] McLeod, J. "African Casino" (Swazi, Sotho, South African), pagat.com. https://www.pagat.com/fishing/african_casino.html
- [09-S6] McLeod, J. "Krypkasino", pagat.com. https://www.pagat.com/fishing/krypkasino.html
- [09-S7] McLeod, J. "Zwicker", pagat.com. https://www.pagat.com/fishing/zwicker.html
- [09-S8] McLeod, J. "Stealing Bundles", pagat.com. https://www.pagat.com/fishing/bundle.html
- [09-S9] McLeod, J. "Scopa" (incl. variants, Chkobba, Hurrikan), pagat.com. https://www.pagat.com/fishing/scopa.html
- [09-S10] McLeod, J. "Scopone", pagat.com. https://www.pagat.com/fishing/scopone.html
- [09-S11] McLeod, J. "Cirulla", pagat.com. https://www.pagat.com/fishing/cirulla.html
- [09-S12] McLeod, J. "Cicera", pagat.com. https://www.pagat.com/fishing/cicera.html
- [09-S13] McLeod, J. "Escoba", pagat.com. https://www.pagat.com/fishing/escoba.html
- [09-S14] McLeod, J. "Chorizo / Báciga", pagat.com. https://www.pagat.com/fishing/chorizo.html
- [09-S15] McLeod, J. (from P. J. Welty) "Cuarenta", pagat.com. https://www.pagat.com/fishing/cuarenta.html
- [09-S16] McLeod, J. "Tablić, Tabinet", pagat.com. https://www.pagat.com/fishing/tablic.html
- [09-S17] McLeod, J. "Žandari", pagat.com. https://www.pagat.com/fishing/zandari.html
- [09-S18] McLeod, J. "Basra", pagat.com. https://www.pagat.com/fishing/basra.html
- [09-S19] McLeod, J. "Pâsur", pagat.com. https://www.pagat.com/fishing/pasur.html
- [09-S20] McLeod, J. "Kontsina", pagat.com. https://www.pagat.com/fishing/kontsina.html
- [09-S21] McLeod, J. "Diloti", pagat.com. https://www.pagat.com/fishing/diloti.html
- [09-S22] McLeod, J. "Xeri", pagat.com. https://www.pagat.com/fishing/xeri.html
- [09-S23] McLeod, J. "Pişti", pagat.com. https://www.pagat.com/fishing/pishti.html
- [09-S24] McLeod, J. "Seep", pagat.com. https://www.pagat.com/fishing/seep.html
- [09-S25] McLeod, J. "Ronda", pagat.com. https://www.pagat.com/fishing/ronda.html
- [09-S26] McLeod, J. "Porrazo", pagat.com. https://www.pagat.com/fishing/porrazo.html
- [09-S27] McLeod, J. (Reid & Eaton) "Snitch'ems", pagat.com (incl. bibliography: Covent Garden Magazine Oct 1773; Sporting Magazine Dec 1797). https://www.pagat.com/fishing/snitchems.html
- [09-S28] McLeod, J. "Laugh and Lie Down", pagat.com. https://www.pagat.com/fishing/laugh.html
- [09-S29] McLeod, J. "Cau Robat", pagat.com. https://www.pagat.com/fishing/cau.html
- [09-S30] McLeod, J. "Mitaines", pagat.com. https://www.pagat.com/fishing/mitaines.html
- [09-S31] McLeod, J. "Hockey", pagat.com. https://www.pagat.com/fishing/hockey.html
- [09-S32] McLeod, J. "Ghârat", pagat.com. https://www.pagat.com/fishing/gharat.html
- [09-S33] McLeod, J. "Shlla'at", pagat.com. https://www.pagat.com/fishing/shllaat.html
- [09-S34] McLeod, J. "Eléwénjewé", pagat.com. https://www.pagat.com/fishing/elewenjewe.html
- [09-S35] McLeod, J. "Chinese Ten / Red Frog Black Frog / Main Merah", pagat.com. https://www.pagat.com/fishing/chinten.html
- [09-S36] McLeod, J. "Go Stop", pagat.com. https://www.pagat.com/fishing/gostop.html
- [09-S37] McLeod, J. "Hachi-Hachi", pagat.com. https://www.pagat.com/fishing/88.html
- [09-S38] McLeod, J. (after Culin 1895) "Tiu U", pagat.com. https://www.pagat.com/domino/fishing/tiu-u.html
- [09-S39] McLeod, J. "Card games in China", pagat.com. https://www.pagat.com/national/china.html
- [09-S40] Wikipedia (EN), "Cassino (card game)", raw wikitext fetched 2026-10-02 (cites Long 1792, Reynolds 1797, von Abenstein 1810, Nicolas 1846, Trumps 1867/1880, Foster 1897/1911, Parlett 2008, Pratesi 1995). https://en.wikipedia.org/wiki/Cassino_(card_game)
- [09-S41] Wikipedia (EN), "Papillon (card game)". https://en.wikipedia.org/wiki/Papillon_(card_game)
- [09-S42] Wikipedia (EN), "Laugh and lie down". https://en.wikipedia.org/wiki/Laugh_and_lie_down
- [09-S43] Wikipedia (EN), "Culbas". https://en.wikipedia.org/wiki/Culbas
- [09-S44] Wikipedia (EN), "Scopa". https://en.wikipedia.org/wiki/Scopa
- [09-S45] Wikipedia (EN), "Bastra" (Basra). https://en.wikipedia.org/wiki/Bastra
- [09-S46] Wikipedia (EN), "Tablanette". https://en.wikipedia.org/wiki/Tablanette
- [09-S47] Wikipedia (EN), "Pasur (card game)". https://en.wikipedia.org/wiki/Pasur_(card_game)
- [09-S48] Wikipedia (EN), "Cuarenta". https://en.wikipedia.org/wiki/Cuarenta
- [09-S49] Wikipedia (EN), "Escopa" (Brazilian). https://en.wikipedia.org/wiki/Escopa
- [09-S50] Wikipedia (EN), "Escoba del 15". https://en.wikipedia.org/wiki/Escoba_del_15
- [09-S51] Wikipedia (EN), "Hanafuda" (history section; cites Depaulis 2009, Kuromiya 2005, McLeod & Dummett 1975). https://en.wikipedia.org/wiki/Hanafuda
- [09-S52] Wikipedia (EN), "Koi-Koi". https://en.wikipedia.org/wiki/Koi-Koi
- [09-S53] Wikipedia (EN), "Go-Stop". https://en.wikipedia.org/wiki/Go-Stop
- [09-S54] Wikipedia (IT), "Scopa (gioco)". https://it.wikipedia.org/wiki/Scopa_(gioco)
- [09-S55] Wikipedia (IT), "Scopone". https://it.wikipedia.org/wiki/Scopone
- [09-S56] Wikipedia (IT), "Codice di Chitarrella" (cites Pratesi, JIPCS XXVII/4, 1999, pp. 166–172). https://it.wikipedia.org/wiki/Codice_di_Chitarrella
- [09-S57] Wikipedia (IT), "Cirulla". https://it.wikipedia.org/wiki/Cirulla
- [09-S58] Wikipedia (DE), "Casino (Kartenspiel)". https://de.wikipedia.org/wiki/Casino_(Kartenspiel)
- [09-S59] Wikipedia (DE), "Zwicker (Kartenspiel)" (cites Lau 1918, Fallada 1928/1943, Hülsemann 1930, Mensing 1935, Grupp). https://de.wikipedia.org/wiki/Zwicker_(Kartenspiel)
- [09-S60] Wikipedia (DE), "Wippen". https://de.wikipedia.org/wiki/Wippen
- [09-S61] Wikipedia (NL), "Wippen (kaartspel)". https://nl.wikipedia.org/wiki/Wippen_(kaartspel)
- [09-S62] Wikipedia (SV), "Kasino (kortspel)". https://sv.wikipedia.org/wiki/Kasino_(kortspel)
- [09-S63] Wikipedia (FI), "Kasino (korttipeli)" (cites Saari, korttipeliopas.fi). https://fi.wikipedia.org/wiki/Kasino_(korttipeli)
- [09-S64] Wikipedia (NO), "Kasino (kortspill)" (flagged unsourced). https://no.wikipedia.org/wiki/Kasino_(kortspill)
- [09-S65] Wikipedia (DA), "Kasino (kortspil)" (flagged unsourced). https://da.wikipedia.org/wiki/Kasino_(kortspil)
- [09-S66] Wikipedia (PT), "Escova (jogo de cartas)". https://pt.wikipedia.org/wiki/Escova_(jogo_de_cartas)
- [09-S67] Wikipedia (ES), "40 (juego de naipes)". https://es.wikipedia.org/wiki/40_(juego_de_naipes)
- [09-S68] Wikipedia (FR), "Chkobba". https://fr.wikipedia.org/wiki/Chkobba
- [09-S69] Parlett, D. "Laugh and Lie Down", *Historic Card Games*, parlettgames.uk (after Willughby c.1665; OED quotations Skelton 1522, Florio 1591, Lyly 1594, S.R. 1634, Forby c.1825). https://www.parlettgames.uk/histocs/laughand.html
- [09-S70] Pratesi, F. "Casino from Nowhere, to Vaguely Everywhere" (dated 09.10.1994), *The Playing-Card* XXIV/1 (1995) 6–12; author's PDF at naibi.net. https://www.naibi.net/A/57-CASINO%20-Z.pdf
- [09-S71] Pratesi, F. "Scopone italianissimo" (08.01.1994), *L'Esopo* 61 (1994) 65–77; PDF at naibi.net. https://naibi.net/A/53-SCOPON-Z.pdf
- [09-S72] [Pigott, C.] *Pigott's New Hoyle, or the General Repository of Games* (London, 1795), "Addenda — The Game of Cassino". archive.org id `bim_eighteenth-century_pigotts-new-hoyle-or-t_pigott-charles_1795` (full text lines ~17770–17990). https://archive.org/details/bim_eighteenth-century_pigotts-new-hoyle-or-t_pigott-charles_1795
- [09-S73] *The Sporting Magazine*, vol. XI, "For December, 1797": "The Game of Snitch'em's", pp. ~150–151. archive.org id `sportingmagazin25unkngoog`. https://archive.org/details/sportingmagazin25unkngoog
- [09-S74] [von Abenstein, G. W.] *Spielalmanach für Karten-, Schach-, Bret-, Billard-Spieler* (Berlin, 1810), "Das Casino-Spiel" pp. ~155–164. archive.org id `10431527bsb` (BSB scan; Fraktur OCR). https://archive.org/details/10431527bsb
- [09-S75] "Trumps" [W. B. Dick], *The American Hoyle, or Gentleman's Hand-book of Games*, 4th ed. (New York: Dick & Fitzgerald; copyright 1864), "Cassino" pp. 218–221. archive.org id `americanhoyleorg00dick`. https://archive.org/details/americanhoyleorg00dick
- [09-S76] Foster, R. F. *Foster's Complete Hoyle* (New York: Stokes, 1897), "Cassino" pp. 441–448 (Royal, Spade, 21-point). archive.org id `fosterscomplete00fostgoog`. https://archive.org/details/fosterscomplete00fostgoog
- [09-S77] Foster, R. F. *Foster's Complete Hoyle* (copyright 1909 ed.), "Draw Cassino". archive.org id `fosterscomplete02fostgoog`. https://archive.org/details/fosterscomplete02fostgoog
- [09-S78] Foster, R. F. *Foster's Complete Hoyle* (copyright 1914 ed.), "Draw Cassino" p. 485. archive.org id `fosterscompleteh01fost`. https://archive.org/details/fosterscompleteh01fost
- [09-S79] *Académie universelle des jeux*, t. 2 (1802), "Le jeu du Papillon" (pp. ~133 ff.) and "Du Cul-Bas". archive.org id `CHEPFL_LIPR_AXA96_02`. https://archive.org/details/CHEPFL_LIPR_AXA96_02 (also checked `laplusnouvellea00jeuxgoog`, 1721, which mentions Cul-bas — [09-S79-note])
- [09-S80] Lalanne, P. / Académie des jeux oubliés, "Le Papillon", salondesjeux.fr. https://www.salondesjeux.fr/papillon.htm
- [09-S81] AD Poker, "Règles du Papillon" (fetched via WebFetch). https://www.adpoker.fr/papillon.html
- [09-S82] Copag (Equipe Copag), "Escopa — Saiba como jogar e as regras da Escopa!" (03.06.2020), Wayback snapshot 2023-05-01. http://web.archive.org/web/20230501112100/https://copag.com.br/blog/detalhes/escopa
- [09-S83] Reynolds, F. *Cheap Living: a comedy in five acts* (London, 1797), Mrs Scatter's line. archive.org id `cheaplivingacom00reyngoog`. https://archive.org/details/cheaplivingacom00reyngoog
- [09-S84] IPCS, "Combined Index of IPCS publications 1972–1997" (lists Pratesi XXIV/1/6-12; Burton XXIV/5/164; Fairbairn on Mekuri). https://www.i-p-c-s.org/tpcindex.html
- [09-S85] IPCS, "The Playing-Card (from 1995)" contents list (incl. "Playing the Game: Fishing in 18th-century Yorkshire"; "The 'Very Costly Game' of Zwicken"). https://www.i-p-c-s.org/wp/the-playing-card-1995-2004/
- [09-S86] Pratesi, F. bibliography index, naibi.net (lists #53 Scopone italianissimo; #57 Casino from Nowhere; Casino dei Nobili archival studies). https://www.naibi.net/p/
- [09-S87] Celko, J. "Kap Tai Shap", The Game Cabinet. http://www.gamecabinet.com/rules/DominoKapTaiShap.html
- [09-S90] Parlett, D. "The Chinese 'Leaf' Game", *Historic Card Games*, parlettgames.uk. https://www.parlettgames.uk/histocs/leafgame.html


### Note 10: 10 — Cassino/Kasino outside English: multilingual, non-Wikipedia sources

(Full note: `research/10-multilingual.md`)


- **[10-S1]** Mikko Saari, "Kasino", *Korttipeliopas*, published 9 July 2010, with reader comments to 2026. https://korttipeliopas.fi/kasino
- **[10-S2]** Tauno Kuoppala (collector), "Korttipelisanontoja", *Keuruun Veräjä*, Keuruun kaupunginkirjasto. http://keuruunveraja.fi/items/show/566
- **[10-S3]** Kinnunen, J. et al., *Pelaajabarometri 2024: Seurapelaamisen vastaisku*, Tampere University, pp. 21–22. https://trepo.tuni.fi/handle/10024/162303 (PDF 978-952-03-3742-1)
- **[10-S4]** *Työmies*, 14 April 1915, pp. 5–6 (Finnish serial translation of Jack London). https://digi.kansalliskirjasto.fi/sanomalehti/binding/1189470?page=5 and ?page=6 (OCR via `/page-N.txt`)
- **[10-S5]** Jack London, *A Son of the Sun* (1912), ch. 6 "A Goboto Night", Project Gutenberg #21971. https://www.gutenberg.org/cache/epub/21971/pg21971.txt
- **[10-S6]** *Jännityslukemisto* 1938 ("Taiga kertoo: Iso casino"), binding 698747, pp. 8–11, and teaser in binding 698746, p. 14. https://digi.kansalliskirjasto.fi/aikakausi/binding/698747?page=8
- **[10-S7]** *Jännityslukemisto* 1939, binding 695326, p. 3. https://digi.kansalliskirjasto.fi/aikakausi/binding/695326?page=3
- **[10-S8]** *Kariston Viikkolehti*, 1 November 1930, p. 8. https://digi.kansalliskirjasto.fi/aikakausi/binding/695471?page=8
- **[10-S9]** *Suomen Sosialidemokraatti*, 25 June 1931, p. 1 (https://digi.kansalliskirjasto.fi/sanomalehti/binding/1314645?page=1); *Helsingin Sanomat*, 26 June 1931, p. 4 (binding 1829432).
- **[10-S10]** *Aamulehti*, 3 January 1932, p. 14. https://digi.kansalliskirjasto.fi/sanomalehti/binding/1720688?page=14
- **[10-S11]** *Poliisimies*, 15 January 1938, p. 15. https://digi.kansalliskirjasto.fi/aikakausi/binding/897947?page=15
- **[10-S12]** *Hatchijo* (Helsinki), 15 August 1923, p. 6. https://digi.kansalliskirjasto.fi/aikakausi/binding/617165?page=6
- **[10-S13]** *Nordan*, 1 November 1924, p. 12. https://digi.kansalliskirjasto.fi/aikakausi/binding/957511?page=12
- **[10-S14]** Karisto *Uutuusluettelo* 1926, p. 19 (ad for R. L. Sunderland, *Kaksitoista parasta korttipeliä*, trans. Väinö Meitti). https://digi.kansalliskirjasto.fi/aikakausi/binding/1135830?page=19 ; Finna record fikka.3780878.
- **[10-S15]** Finna record eepos.3185756, *Pohjoiset korttipelit* (2024); Tarja Karjalainen, "'Sodankylähän on neljän tupen kehto'", *Sompio*, 25 November 2024. https://www.sompio.fi/artikkeli/pohjoiset-korttipelit-kirjassa-kasitellaan-kahdeksaa-pohjois-suomessa-suosittua-korttipelia
- **[10-S16]** Svenska Akademiens ordbok (SAOB), "kasino". https://www.saob.se/artikel/?seek=kasino&pz=1
- **[10-S17]** SAOB, "kajsa" (sense 5) and "lill-" compounds (*-kajsa*, *-kasina*, *-stina*). https://www.saob.se/artikel/?seek=kajsa&pz=1 ; https://www.saob.se/artikel/?seek=lillkajsa&pz=1
- **[10-S18]** SAOB, "tabbe" sbst. 2 (band 33, 2002). https://www.saob.se/artikel/?unik=T_0001-0016.Ev8z&pz=3
- **[10-S19]** SAOB, "tabelras". https://www.saob.se/artikel/?seek=tabelras&pz=1
- **[10-S20]** *Nordisk familjebok*, 1st ed., vol. 3 (Capitulum–Duplikant), "Casino". https://runeberg.org/nfac/0041.html
- **[10-S21]** *Nordisk familjebok*, Uggleupplagan, vol. 13 (Johan–Kikare), "Kasino". https://runeberg.org/nfbm/0633.html
- **[10-S22]** *Nordisk familjebok*, 3rd ed., vol. 11 (Jylland–Kragduva), "Kasino". https://runeberg.org/nfdk/0329.html
- **[10-S23]** *Lyckans Talisman: Kortspel*, index, section "Fiskespel". https://kortspel.lyckans-talisman.se/
- **[10-S24]** *Lyckans Talisman*, "Kasino" (rev. 25 March 2026; draws on Mård 1975, Holmström 1981, Werner & Sandgren *Kortoxen* 1975, Glimne 2016, etc.). https://kortspel.lyckans-talisman.se/Spelbeskrivningar-html/Kasino.html
- **[10-S25]** *Lyckans Talisman*, "Byggkasino" (rev. 26 March 2026). https://kortspel.lyckans-talisman.se/Spelbeskrivningar-html/Byggkasino.html
- **[10-S26]** *Lyckans Talisman*, "Mulle (kasino)" (rev. 30 March 2026). https://kortspel.lyckans-talisman.se/Spelbeskrivningar-html/Mulle%20(kasino).html
- **[10-S27]** *Lyckans Talisman*, "Kortspel som heter mulle". https://kortspel.lyckans-talisman.se/Mulle%20(ordet).html
- **[10-S28]** Martin Sörensson / John McLeod, "Kasino i Norden" (Swedish), pagat.com, 2016. https://www.pagat.com/fishing/kasino_i_norden_sv.html
- **[10-S29]** *Nationen* (Oslo), 12 March 1985, p. 17, National Library of Norway. https://www.nb.no/items/532562ef8c5766a76a8f228f4cd7c4d6 (ALTO text via api.nb.no)
- **[10-S30]** *Den 17de mai*, 19 September 1929, p. 6 (Nynorsk translation of London). https://www.nb.no/items/932cfa3bbf9cd17f44c5b177fa15803a
- **[10-S31]** *Budstikka*, 1 March 2008, p. 93 (quiz). https://www.nb.no/items/9add604c4f99dc03e00d2b0acb14af7e
- **[10-S32]** Runar (maintainer), "Regler for kortspillet Kasino", *Norske kortspill*, updated 18 August 2026. https://norske-kortspill.no/spill/kasino
- **[10-S33]** *Den Danske Ordbog*, "kasino" (via Wayback). https://web.archive.org/web/2024/https://ordnet.dk/ddo/ordbog?query=kasino
- **[10-S34]** *Ordbog over det danske Sprog*, vol. 10, "Kasino". https://archive.org/details/ordbogoverdetdan10dansuoft (djvu text)
- **[10-S35]** *Ordbog over det danske Sprog*, vol. 22, "Svip" (5) and "svippe" (4). https://archive.org/details/ordbogoverdetdan22dansuoft
- **[10-S36]** *Nyeste dansk spillebog* (1829), "XV. Cassinospillet" (c. pp. 189–200). https://archive.org/details/nyeste-dansk-spillebog
- **[10-S37]** "Kasino (kortspil) Spilleregler", ludo.dk. https://ludo.dk/spilleregler/kasino-kortspil
- **[10-S38]** "Kasino", Spilregler.dk. https://spilregler.dk/kasino/
- **[10-S39]** Sigfús Blöndal, *Íslensk-dönsk orðabók*, vols. 1–2 (1920–24): "kasína", "svippa/svippur", "borðskeiningur". https://archive.org/details/islandskdanskord01sigfuoft ; https://archive.org/details/islandskdanskord02sigfuoft
- **[10-S40]** Óli Gneisti, "Kasína – reglur", 5 April 2020. https://truflun.net/oligneisti/2020/04/05/kasina-reglur/
- **[10-S41]** *Das neue Königliche l'Hombre… Casino &c.* (1797), "Das Cassino-Spiel", pp. 316–330. https://archive.org/details/10431610bsb
- **[10-S42]** J. N. Martius, *Unterricht in der natürlichen Magie*, vol. 19 (1805), p. 259 [archive.org full-text snippet]. https://archive.org/details/11755166bsb
- **[10-S43]** DWDS, "Kasino". https://www.dwds.de/wb/Kasino
- **[10-S44]** "Zwickern", Kartenspiele.net. https://kartenspiele.net/zwickern/
- **[10-S45]** John McLeod, "Zwicker", pagat.com. https://www.pagat.com/fishing/zwicker.html
- **[10-S46]** *Naynowszy almanak dla grających w karty i w szachy* (Wrocław: W. B. Korn, 1821), "Gra Kasino (Casino)". https://archive.org/details/rcin.org.pl.WA35_4179_7784_Naynowszy-almanak_66240
- **[10-S47]** Treccani, *Vocabolario*, "casino". https://www.treccani.it/vocabolario/casino/
- **[10-S48]** Alfonso Grasso (ed.), "Le regole dello Scopone di Chitarrella" (Neapolitan and Italian), *Il Portale del Sud*. http://www.ilportaledelsud.org/chitarrella.htm
- **[10-S49]** "Pescaria a seco", *Super Interessante* (Brazil) no. 111, December 1996, in archive.org item super-interessante-004-janeiro-de-1988, file "Super Interessante 111 - Dezembro de 1996_djvu.txt". https://archive.org/details/super-interessante-004-janeiro-de-1988
- **[10-S50]** *Dicionário Contemporâneo da Língua Portuguesa* (1964), p. 904 [snippet]. https://archive.org/details/dicionariocontem0000unse_z7u4
- **[10-S51]** *Michaelis: moderno dicionário da língua portuguesa* (São Paulo: Melhoramentos, 2005), p. 2290 [snippet]. https://archive.org/details/michaelismoderno0000unse
- **[10-S52]** Marques Rebelo, *Stela me abriu a porta*, p. 182 [snippet, OCR]; also *O Jornal*, 10 May 1936 [snippet]. https://archive.org/details/stelameabriuport0000marq
- **[10-S53]** "Para divertirse en parejas: el casino, pero a los naipes", *Diario Popular* (Argentina), 23 April 2013. https://www.diariopopular.com.ar/suerte/para-divertirse-parejas-el-casino-pero-los-naipes-n154165
- **[10-S54]** Juegos Bonaerenses (Prov. Buenos Aires), "Escoba de 15" regulation (coord. Guillermo Vaccarini), 2026. https://juegos.gba.gob.ar/wp-content/uploads/2026/reglamentos/especificos/deportes_adultos_mayores/escoba_de_15.pdf
- **[10-S55]** Alexis Sinchire, "¿Cómo se juega 40? El popular juego de Fiestas de Quito", *El Comercio* (Quito). https://www.elcomercio.com/deportes/futbol/cuarenta-juego-cartas-fiestas-quito/
- **[10-S56]** Tandori Dezső, *Valamivel több* (Magvető, 1980) p. 434; *Miért élnél örökké?* (1977) p. 306; *A meghívás fennáll* (1979) p. 578; *Sár és vér és játék* (1983) p. 786 [archive.org full-text snippets; items lending-restricted]. https://archive.org/details/valamiveltobb0000tand
- **[10-S57]** "Казино – подробные правила игры", gamerules.ru. https://gamerules.ru/kazino
- **[10-S58]** *Золотая энциклопедия азартных игр* (2001), p. 778 [snippet] (https://archive.org/details/zolotaiaentsiklo0000unse); Russian Jack London volume, p. 586 [snippet] (https://archive.org/details/jacklondon0000pzlo).
- **[10-S59]** "カシノのゲームルール", トランプスタジアム (playingcards.jp). https://playingcards.jp/game_rules/casino_rules.html
- **[10-S60]** "Ξερή", *Παιχνίδια με τράπουλα και άλλα…* (blog), March 2014. https://cardgamesgr.blogspot.com/2014/03/blog-post.html
- **[10-S61]** C. Louis Leipoldt, *Dingaansdag* (archive.org; full-text index year 1925), pp. ~185. https://archive.org/details/clleipoldtdingaan
- **[10-S62]** French full-text snippets: Jack London, *Fils du soleil* (1936) p. 234 (https://archive.org/details/filsdusoleil0000unse); C. Mainguy, *Les jeux de cartes joués au Québec* (1987) p. 214 (https://archive.org/details/lesjeuxdecartesj0000main); James Gunn, *Tendre femelle* (Gallimard 1986) p. 294 (https://archive.org/details/tendrefemelle0000gunn); J. Gaarder, *Le mystère de la patience* (Seuil 1999) p. 422 (https://archive.org/details/lemysteredelapat0000gaar).

Tools used: digi.kansalliskirjasto.fi REST search and `/page-N.txt` OCR; api.nb.no full-text search and ALTO; the archive.org full-text search (FTS) API (be-api.us.archive.org/fts/v1/search) and djvu text files; the Finna API.

---


### Note 11: 11 — Coordinator verifications: resolving contradictions between the research notes

(Full note: `research/11-coordinator-verifications.md`)


- **[11-V-S1]** Robert Long, *Short Rules for Playing the Game of Cassino* (London, 1792). Page images read from archive.org `bim_eighteenth-century_short-rules-for-playing-_long-robert_1792`, `page/n0_s4.jpg` (title), `n4_s4.jpg` (p. 5), `n5_s4.jpg` (p. 6), `n6_s4.jpg` (p. 7), `n7_s4.jpg` (p. 8). https://archive.org/details/bim_eighteenth-century_short-rules-for-playing-_long-robert_1792
- **[11-V-S2]** *Casino; a mock-heroic poem … To which is added, an appendix; containing the laws of the game of casino* (London, 2nd ed. 1793). archive.org `bim_eighteenth-century_casino-a-mock-heroic-po_1793`, full-text OCR (`_djvu.txt`), laws I–VII (OCR lines ~360–490) and Notes (OCR lines ~745–843); p. 31 page image `page/n27_s4.jpg`. https://archive.org/details/bim_eighteenth-century_casino-a-mock-heroic-po_1793
- **[11-V-S3]** "Trumps" [W. B. Dick], *The American Hoyle*, 4th ed. (New York: Dick & Fitzgerald; ©1864; preface to 4th ed.), preface (OCR lines 134–166) and p. 221 page image (`page/leaf231_s2.jpg`). archive.org `americanhoyleorg00dick`. https://archive.org/details/americanhoyleorg00dick
- **[11-V-S4]** W. B. Dick, *The American Card Player* (New York: Dick & Fitzgerald, entered 1866). archive.org `americancardplay00dick`, OCR lines 402 and 7155–7162. https://archive.org/details/americancardplay00dick
- **[11-V-S5]** "Trumps", *The Modern Pocket Hoyle* (New York: Dick & Fitzgerald, ©1868). archive.org `modernpockethoy00dickgoog`, OCR lines 12033 and 12205.
- **[11-V-S6]** *Das neue Königliche l'Hombre … Casino &c.* (1797), "Das Casino-Spiel" / "Gesetze des Casino-Spiels", pp. 316–330. archive.org `10431610bsb`, OCR (`_djvu.txt`) lines ~15505–15944. https://archive.org/details/10431610bsb
- **[11-V-S7]** *The Sporting Magazine*, vol. III (London, Nov 1793 – Jan 1794), "Rules and Instructions for playing the Game of Cassino" and "Further Rules". archive.org `sportingmagazine03londuoft`, OCR (`_djvu.txt`) lines ~11060–11140 and 16680–16860. https://archive.org/details/sportingmagazine03londuoft
- Cross-references such as "[03 S15]" point to the numbered sources in research notes 01–10 in this folder.


### Original computation added in the synthesis pass
- [SIM-ST] Strategy-maxim tests: `research/sim/strategy_tests.py` (variants vs. greedy baseline, duplicate decks; outputs `strategy_tests_2026.json`, `strategy_tests_2027.json`) and `research/sim/strategy_vs_heuristic.py` (variants vs. the one-ply card-counting heuristic, same decks for every variant; output `strategy_vs_heuristic_31.json`, with paired differences from plain greedy computed by `research/sim/paired_deltas.py` → `strategy_vs_heuristic_31_paired.json`). Rules engine: `research/sim/cassino_sim.py` (pagat standard two-player rules, sweeps scored) [07-S40].


### Key aliases
- [05-S74] = the BoardGameGeek thread group in note 05 (Casino, BGG id 18121), itemised above as [05-S74-BGG…].
- [08-S46a], [08-S46b] = items (a) and (b) of [08-S46]; [08-S47a], [08-S47b], [08-S47c] = items (a)–(c) of [08-S47]; [08-S30b] = second item of [08-S30]; [08-S11b] style suffixes follow the same convention.
- [05-S11b] = Foster 1897 first edition, listed in note 05 as S11b.
