# Cassino: the rules as implemented

> Status: **adopted**, 2026-10-03. The user chose the two games (standard
> Cassino and Royal Cassino, switchable at the start of a game) and delegated
> the contested points, which are settled here once each. The engine is built
> to this document. Any change to it starts as a change to the tests.

Two-player Cassino, in two forms:

- **Classic**: the standard Anglo-American game.
- **Royal**: the same game with numeric court cards.

Each rule cites its source by the IDs of the literature review
(`cassino-lit-review.md`, Appendix B). For example, [02-S1] is John McLeod's
"Casino" page on pagat.com.

## Authority

**Pagat.com's "Casino" page [02-S1] is the authority for Classic.** For Royal,
pagat's "Royal Casino" page [02-S3] supplies the court values. It describes
North American Royal Casino as differing "from ordinary Casino only in values",
and Wikipedia agrees: "The only difference from standard American Cassino is
that Jacks are now worth 11, Queens 12 and Kings 13" [01-S1]. Where pagat is
silent, this document makes the choice and labels it an *interpretation*.

Pagat was the authority for piquet too. It is current (updated May 2026). It
is explicit about building, where the old books are loose. And its worked
examples make good test fixtures (see "Worked examples").

**Two games, three settings.** The game is chosen at the start, and so are
its settings:

| Setting | Values | Default | Notes |
|---|---|---|---|
| Game | Classic, Royal | Classic | Royal changes only the card values (rule 1) |
| Aces count 1 or 14 | off, on | off | Royal only. Parlett's variation [01-S1], standard in pagat's North American Royal [02-S3] |
| Score sweeps | on, off | on | Both games. Royal "is often played without a score for sweeps" [02-S3] |

Everything else is one rule, implemented once.

## The game

### 1. Cards and values

- One 52-card pack. No jokers.
- **Classic.** Ace counts 1, and 2 to 10 count their pips. **Jacks, queens and
  kings have no numeric value.** A court card can only capture one court card
  of its own rank (rule 4). It never takes part in a sum or a build [02-S1].
- **Royal.** Ace counts 1, and 2 to 10 count their pips. **Jack 11, queen 12,
  king 13** [02-S3][01-S1]. Court cards behave exactly like numeral cards.
- **Royal with "Aces count 1 or 14".** An ace played from the hand to capture
  counts **1 or 14, as the player chooses**. An ace on the table, or in a
  build, always counts 1 [03-S28][02-S3].
  - Pagat's example: "an Ace can capture a King and an Ace, counting the
    capturing Ace as 14 and the captured Ace as 1" [02-S3].
- A card's **capture value** is what it can capture: its value as above, and
  for a hand ace with the option on, 1 or 14.

### 2. Dealing

- **The first dealer is decided by a cut.** Each player cuts, and **low
  deals**, with the ace low. Equal ranks cut again. The deal then alternates
  between hands.
  - *(Interpretation: pagat does not say how the first dealer is chosen. Jack
    London's players settle it before the game: "Low deals" [04-S28].)*
- **The first deal of a hand:** four cards to each player and four face up to
  the table. They go in twos: two to the non-dealer, two to the table, two to
  the dealer, then the same again [02-S1].
- **Five more deals** follow as the hands run out. Each is four cards to each
  player, in twos, and none to the table. That makes six deals for two
  players, and the whole pack in one hand [02-S1].
- On the sixth deal the dealer announces **"last"** [02-S1].

### 3. The play

- The non-dealer plays first in every deal, and turns alternate.
- On each turn a player plays **exactly one card from the hand**. It is used
  to **capture** (rule 4), to **build** (rule 5), or to **trail** (rule 6).
- **Everything on the table is public.** Each build shows its value, and
  whether it is single or multiple.

### 4. Capturing

The played card's capture value **v** decides what it can take. With an ace
under the "1 or 14" option, the player names v for this play.

- **A group of value v** is one of:
  - a single loose card of value v (pairing);
  - two or more loose cards whose values total v;
  - a build whose value is v.
- **A capture takes one or more groups of value v, disjoint from each other.**
  The played card and everything taken go to the player's capture pile,
  face down.
  - Pagat's example: with A, 2, 3, 5, 6, 8 on the table, an eight "could
    capture 8 6 2 5 3 or 8 5 2 A, but not all six cards" [02-S1].
- **A build is only ever taken whole, and only as its own group.** It cannot
  be added to loose cards to make a sum. "A 7-build plus a loose 2 cannot be
  taken by a 9" [02-S1].
- **Capturing is never compulsory, and nor is taking everything available.**
  A player may take any choice of the groups on offer, or trail instead
  [02-S1]. *(Interpretation for partial captures: pagat makes capturing
  optional and lets a card that could capture be trailed. Taking some of the
  available groups is the same freedom, applied to fewer cards.)*
- **Classic court cards** capture exactly **one** loose card of their own rank.
  With two queens on the table, a queen takes one "but not both" [02-S1].
- **A sweep** is a capture that leaves the table empty (rule 8).

### 5. Building

A build is a pile on the table with an announced **value**. Only a card of
that value can capture it. Every build is **single** or **multiple**, and
every build has a **controller**.

- **Single build:** cards whose values total the build's value, for example
  "a 5-build made of a 2 and a 3". The cards of a single build are
  "irrevocably joined" [02-S1]. A single build can be raised.
- **Multiple build:** two or more groups that each total the value, for
  example "a 9-build made of 6-3 plus 5-4 plus 9". Its value "can never be
  changed" [02-S1].
- **Controller:** the last player to create the build or add to it.
- **Card values in builds:** the played card and every table card count at
  their value under rule 1. **An ace counts 1 in any build**, even with the
  "1 or 14" option. *(Interpretation: an ace on the table counts 1 [03-S28],
  and a build is on the table. The 14 matters only when capturing.)* Classic
  court cards have no value, so they are never part of a build.

**The requirement on every build move.** After the play, the player must hold
a card whose capture value equals the build's value. You announce a number
you can capture [02-S1]. Under the "1 or 14" option, a held ace meets this
for a build of 14.

**Each card answers for one value.** A player who controls builds of several
values must hold a different card for each; two builds of the same value
need only one. This matters only under "Aces count 1 or 14": one ace answers
for a build of 1 or a build of 14, not both. *(Decision, 2026-10-03: without
it, one ace could guard both, and the player could be left with no legal
move at all, which breaks rule 7's consequences. The engine review found
it.)*

The value limits follow from the requirement: 10 in Classic, 13 in Royal, and
14 in Royal with the option on.

A build move plays one card **c** from the hand and announces a value **V**.
There are three kinds.

**5a. A new build.** Card c is combined with loose cards from the table.
- **Single:** c plus one or more loose cards, together totalling V.
  - "Holding 3 and 8 with a 5 on the table, you may put the 3 on the 5 and
    announce *building 8*" [02-S1].
- **Multiple:** c, alone or with loose cards, totals V. One or more further
  groups of loose cards, each totalling V, join it.
  - With A and 2 on the table, a 3 played on them can be announced *building
    3* [02-S1].
- A build must include the card just played. A build made only of table cards
  is not allowed [02-S1].

**5b. Raising a single build.** Card c goes on a single build of value B,
making a single build of value V = B + value(c).
- Any single build can be raised, whoever controls it, including your own
  [02-S1].
- **Loose cards can never change a single build's value** [02-S1].
- In the same move, loose groups that each total the *new* value V may be
  absorbed. The build then becomes multiple [02-S1] (Example C below).
- A multiple build can never be raised [02-S1].

**5c. Adding to a build.** Card c, alone or with loose cards, totals the value
V of an existing build, single or multiple, and joins it [02-S1].
- Further loose groups of value V may be absorbed in the same move.
- The result is a multiple build of value V.

**Rules common to all three:**
- **The player becomes the build's controller.**
- **Builds are never broken up or rearranged** [02-S1]. Moves change a build
  only by adding to it, or by capturing it whole.
- **Two builds of the same value may stand on the table at once.** A card of
  that value can capture either or both. *(Decision: see the table below.)*
- A player may control several builds at once [02-S1].

### 6. Trailing

- **Trailing** puts the played card on the table as a loose card, without
  capturing or building.
- It is allowed even when the card could have captured [02-S1].
- **A player who controls a build may not trail** [02-S1].

### 7. The controller's obligation

A player may never make a move that leaves them controlling a build without
holding a card of its value. "You are not allowed to play so as to leave
yourself with no card equal to the value of this build" [02-S1]. A different
card must answer for each distinct value (rule 5).

Consequences, checked by the tests:

- A legal move always exists. A controller can always capture the build, and
  anyone else can trail.
- A player never controls builds of more different values than they hold
  cards.
- No build survives to the end of a hand. A controller's last card must
  capture what they control, so only loose cards are ever left over.

### 8. Sweeps

- **A sweep** is a capture that leaves the table empty.
- When sweeps are scored, each is worth one point [02-S1]. Opposing sweeps do
  not cancel, because "if sweeps are scored ... there is no cancelling"
  [02-S3]. The capturing card is kept face up, crosswise in the capture pile,
  to count them [02-S1][03-S31].
- **A capture on the last card of the hand is a sweep if it really does take
  everything** [02-S1].
- After a sweep, the next player has an empty table and must trail.

### 9. The end of the hand

- After the last card of the sixth deal, any cards left on the table (the
  *residue*) go to the last player who captured [02-S1].
- **Taking the residue is never a sweep** [02-S1].
- If nobody captured at all during the hand, the residue goes to nobody.
  *(Interpretation for a case that should never happen in practice. Pagat is
  silent.)*

### 10. Scoring

At the end of each hand [02-S1]:

| Item | Points |
|---|---|
| Most cards (27 or more of 52) | 3 |
| Most spades (7 or more of 13) | 1 |
| Big Casino, the ten of diamonds | 2 |
| Little Casino, the two of spades | 1 |
| Each ace | 1 |
| Each sweep (when scored) | 1 |

- A tie for cards (26 each) scores nothing [02-S1]. A tie for spades cannot
  happen between two players unless the residue went to nobody, and then it
  also scores nothing.
- **Checksum:** "the total number of points to be made in each hand, exclusive
  of sweeps, is eleven" [03-S31]. The exception is a tie for cards, which
  makes it eight.
- **The game is the first to 21**, played over as many hands as it takes
  [02-S1].
  - Scores are counted only at the end of a hand.
  - If both players reach 21 in the same hand, the higher total wins.
  - If the totals are equal, another hand is played [02-S1].

## Decisions on contested points

The literature review's options matrix (§3.2) lists the alternatives with
their sources. §3.3 ranks the arguments. This is what the engine does.

| Point | Decision | For | Against |
|---|---|---|---|
| Classic: how many matching court cards a court card takes | **One** | pagat [02-S1]; USPCC 1952 [03-S36] | All: Foster [03-S31], Britannica [02-S33], Denexa [02-S40]. One or three: Cats at Cards [02-S39] |
| Raising your own single build | **Allowed**, if you hold the new value | pagat [02-S1]; Foster, who calls the prohibition "a common error … manifestly unfair" [03-S31] | Dick 1866 [03-S14], USPCC 1898 [03-S24], Dominican and Swazi [02-S3][02-S4] |
| Two builds of the same value at once | **Allowed** | BGG veteran: "never encountered anyone who thought it should not be allowed" [02-S58]. Pagat lays down no prohibition | Board Game Arena, the iOS *Cassino!*, Swazi [02-S58][02-S4] |
| Compulsory capture | **No** | pagat [02-S1] | Denexa [02-S40]; Dominican matching cards [02-S3]; Scopa family |
| Partial capture | **Allowed** | follows from optional capture (interpretation) | Dominican matching cards [02-S3] |
| Builds made only of table cards | **No** | pagat [02-S1] | pagat's own variant; Swazi [02-S4] |
| Table cards in raising a single build | **No**, except absorbing groups of the new value | pagat [02-S1] | pagat's variant; Cats at Cards [02-S39] |
| A single build as a card in a sum | **No** | pagat [02-S1]; BGG [02-S59] | pagat's variant; Dick 1867 [02-S36] |
| The controller trailing | **No** | pagat [02-S1] | pagat's variant; Swazi [02-S4] |
| Sweeps | **Scored, 1 point** (setting) | Foster, USPCC, Britannica [03-S31][02-S32][02-S33] | A variant in pagat [02-S1]; often unscored in Royal [02-S3] |
| Sweep cancellation | **No** | pagat Royal [02-S3] | Foster, Dominican, Finnish [03-S31][02-S3][10-S1] |
| A sweep on the last card | **Counts**, if it takes everything | pagat [02-S1] | Scopa; Finnish last deal [02-S10][02-S5] |
| Royal ace | **1**, or 1/14 from the hand (setting) | Wikipedia/Parlett [01-S1]; pagat [02-S3]; Foster 1907 [03-S28] | — |
| An ace inside a build (option on) | **Always 1** | interpretation from [03-S28] | Swazi lets aces be 14 in builds [02-S4] |
| Target | **21**, scored at the end of the hand, no claiming | pagat [02-S1] | Claims during play: Foster [03-S31]; 11 by difference [02-S1] |
| The deal | **In twos** | pagat, "traditionally" [02-S1] | Singly [02-S1][02-S36] |
| The first dealer | **A cut; low deals** | Jack London, 1912 [04-S28] (pagat is silent) | — |

## Announcements

The engine knows every move exactly, so announcements are table talk, not
rules. They come from the period books and the review's §6.

| Moment | Words | Source |
|---|---|---|
| A single build | "Building eight" | [02-S1][03-S15] |
| A multiple build | "Building eights" (plural for a multiple build) | [03-S15]; review §14 item 2 |
| The cut for the first deal | "Low deals" | [04-S28] |
| The sixth deal | "Last" | [02-S1] |
| A sweep | "Sweep" | [02-S1] |
| An ace taking an ace | "Cash" | [02-S1] |

## Worked examples

These become test fixtures, written before the code they test. Pagat's
examples give no suits, so the suits here are illustrative. Notation:
`TD` is the ten of diamonds.

- **W1. Several groups at once.**
  - Table: A♣ 2♦ 3♥ 5♠ 6♣ 8♦.
  - Playing 8♠ may take {8♦, 6♣+2♦, 5♠+3♥} or {8♦, 5♠+2♦+A♣}, or any part of
    either (rule 4). It cannot take all six: they total 25, not a multiple of
    eight [02-S1].
- **W2. Matching court cards.**
  - Table: Q♠ Q♥.
  - Classic: Q♦ takes one queen, not both [02-S1].
  - Royal: Q♦ may take both, since each is a group of 12.
- **W3. A single build.**
  - Table: 5♣. Hand: 3♦ 8♠.
  - Playing 3♦ on 5♣ is "building 8" [02-S1].
- **W4. One card, several uses.**
  - Table: A♣ 2♦. Hand: 3♥ 3♠ 6♦.
  - Playing 3♥ may capture A♣+2♦. It may make a single build of 6 (3♥+A♣+2♦).
    It may make a multiple build of 3 (3♥ and A♣+2♦). Or it may trail.
  - It may not build 4 or 5, because no 4 or 5 is held [02-S1].
  - The 6♦ can only trail: 6+A, 6+2 and 6+A+2 are not held, and A+2 is not 6.
- **W5. A five-card multiple build.**
  - Table: 3♦ 4♠ 5♥ 7♣. Hand: 2♣ 7♦.
  - Playing 2♣ makes a multiple 7-build of 5♥+2♣, 3♦+4♠ and 7♣ [02-S1].
- **W6. Taking a build with loose cards.**
  - Table: a single 9-build (6♠+3♥), and loose 5♦ and 4♣.
  - 9♣ takes all of it [02-S1].
- **W7. A build is not a card.**
  - Table: a single 7-build (4♥+3♠), and loose 2♦.
  - 9♠ cannot take the 7-build plus the 2 [02-S1].
- **W8. Two fives.**
  - Table: 5♥. Hand: 5♠, plus a 10, plus another 5.
  - 5♠ on 5♥ may be announced "building 10" (single) or "building fives"
    (multiple). The announcement fixes which rank captures it [02-S1].
  - Holding only the 10, only the first is legal. Holding only the 5, only the
    second.
- **W9. Raised twice (pagat's Example A).**
  - Table: a single 6-build (3♠+3♦) made by one player.
  - The other, holding 2♥ and 8♣, adds 2♥: "building 8".
  - The first, holding A♦ and 9♠, adds A♦: "building 9" [02-S1].
- **W10. No loose cards in a raise (Example B).**
  - Table: a single 5-build (A♠+4♦) and a loose 2♣. Hand: 3♥ 8♦ T♠.
  - 3♥ may raise the build to 8. It may not take in the loose 2♣ to make 10
    [02-S1].
- **W11. Raising and absorbing (Example C).**
  - Table: a single 7-build (3♣+4♥) and a loose 9♦. Hand: 2♠ 9♣.
  - 2♠ raises the build to 9 and absorbs 9♦ into a multiple build of 9:
    "building nines" [02-S1].
- **W12. Adding with a loose card.**
  - Table: a single 8-build (5♠+3♥) and a loose 6♦. Hand: 2♣ 8♥.
  - 2♣ with 6♦ joins the 8-build, making it multiple [02-S1].
- **W13. The controller.**
  - A player controls an 8-build and holds 8♣ and 4♦.
  - They may not trail 4♦.
  - 8♣ may capture the build, but may not capture anything else that leaves
    the build behind [02-S1].
- **W14. A multiple build is fixed.**
  - Table: a multiple 5-build (5♣ and 3♦+2♥). Hand: A♠ 6♦.
  - A♠ cannot raise it to 6 [02-S1].
- **W15. Royal court values.**
  - A queen captures A+J, or 7+5 [01-S1].
- **W16. Royal, aces count 1 or 14.**
  - Table: K♠ A♥.
  - A♣ as 14 takes K♠ and A♥ [02-S3]. As 1 it takes A♥ alone.
- **W17. Royal, aces count 1 or 14.**
  - Table: 8, 5 and A. An ace from the hand takes all three as 14 [02-S3].
- **W18. Court cards in builds.**
  - Classic: a jack can never build.
  - Royal: J♣ from the hand on a loose 2♦ is "building 13", if a king is held.
- **W19. Sweep, or residue.**
  - The last card of the hand, 7♠, takes 3♥+4♦, the only cards on the table.
    That is a sweep.
  - Had it trailed instead, the residue would have gone to the last capturer,
    and no sweep would be scored [02-S1].
- **W20. Trailing a card that could capture.**
  - Table: 5♦. Hand: 5♣.
  - Trailing 5♣ is legal [02-S1].

## Not implemented

- Three and four players, and partnerships. Building for a partner goes with
  them.
- Claiming or counting out during play, and its precedence orders.
- Draw, Spade, Diamond, Give-away and Stealing Bundles; the Dominican,
  Nordic, African, Hungarian and Zwicker games; and the 1792 game without
  building. The review's §4 describes them. Each is a candidate for a later
  preset.
- Foster's "take all matching court cards", table-only builds, builds treated
  as cards, and the other permissive building variants pagat lists.
