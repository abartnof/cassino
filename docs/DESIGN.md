# Cassino: design

> Living document: how the engine, the opponent and the table are built, and
> why. The rules are in `docs/RULES.md`. Where the work stands is in
> `PLAN.md`. The literature review behind all of it is
> `cassino-lit-review.md`, cited by its source IDs (for example [02-S1]).

## 1. What we are building

Two-player Cassino against the computer, in one self-contained web page:

- **Two games**, chosen at the start: **Classic** (court cards pair only) and
  **Royal** (J 11, Q 12, K 13). Royal has an "Aces count 1 or 14" setting, and
  both have "Score sweeps" and "Raise builds". `RULES.md` settles everything else once.
- **A rules engine and opponent in Rust**, compiled to WebAssembly and inlined
  into the page.
- **A 3D table** (three.js, realistic motion, Material Design 3 controls),
  adapted from the sibling project piquet's.
- **A terminal client** on the same engine. It includes a **watch mode**, where
  two computer players play each other and a person can follow along. The
  watch mode was the user's suggestion.
- **Table talk**: what people actually say at a Cassino table, in dialogue
  boxes (§12).
- **Aids that make it fun to learn and play**, each one a toggle (§12).

The whole page should be modest in size, well under 10 MB. Piquet's is
3.1 MB, and this one should land near 3.5 MB (§11).

Non-goals for now:
- networked play;
- three or four players, and partnerships;
- the other presets the review lists (Spade, Nordic, Dominican, South
  African), which the engine's structure leaves room for (§6);
- sound. The page makes no sound, as in piquet.

## 2. Engineering conventions

- **Rust**, from the first line (§4).
- **Test-driven development.** Tests come before the implementation, always.
- **Atomic commits**, often, straight to `main` until the game is public. One
  logical change per commit.
- **Modular.** Cards, the table and moves, the hand and game, scoring,
  observation, agents, the session and each client are separate modules.
- **Plain data.** Game state is plain, copyable values with no shared mutable
  state. The search clones positions freely, so the core position type stays
  small.
- **The engine holds the rules; clients hold none.** The browser table and the
  terminal are clients of one protocol (§10). A client never decides what is
  legal. It asks.
- **No runtime dependencies** in the core crate. Test-only dependencies are
  allowed when they earn their place.
- **Measure rather than argue**, wherever measuring is cheap, and always with
  mirrored pairs (§11.4).
- **Public-facing documents**: neutral and dated, with no session diary. The
  person who commissioned the game is "the user".

## 3. What carries over from piquet and bezique

Piquet is finished and public. Bezique has its engine, its session and its
protocol, and its table is next. Both share one architecture, and bezique's
`DESIGN.md` §3 already sorted piquet's parts into those that travel and those
that do not. Cassino is the third game, and the first that is not a
trick-taking game.

| Part | Origin | For cassino |
|---|---|---|
| Workspace shape | `*-core`, `*-wasm`, `*-cli` | **Copy**: `cassino-core`, `cassino-wasm`, `cassino-cli` |
| Seeded generator | bezique's small modern generator | **Copy** |
| Scoring as an ordered event log | piquet `scoring.rs` | **Copy the idea**. Cassino's events also drive the table talk and the trackers (§8, §12) |
| Observation discipline | piquet `observation.rs` | **Copy the discipline**. The content is new (§9) |
| The session: undo, replay, aids, hints | piquet `table.rs`, bezique `session.rs` | **Adapt**: same loop, new prompts |
| JSON protocol, wasm exports | `docs/PROTOCOL.md` in both | **Adapt**: same loop. Moves are richer (§7.2) |
| Capability ladder, erraticism, style | both | **Copy the design**. The rungs are new (§11) |
| Mirrored-pair tournaments | both | **Copy** |
| Exact endgame solver | both | **Rewrite**. Cassino's last deal is perfect information for a player who counts cards (§11.2) |
| 3D scene, cards, ink lines, motion, framing, surfaces, art loader, director | piquet `web3d/src` | **Copy verbatim**, with a header naming the origin and commit |
| Layout, choreography, overlay, celebrations | piquet `web3d/src` | **Rewrite or adapt**. Cassino's action is in the middle of the table, not in tricks (§12.7) |
| Card art | the same public-domain deck | **Re-cut** with all 13 ranks. The source SVG already holds the full 52 |
| Python oracle and golden vectors | piquet only | **Not repeated**: brute-force references in the tests instead (§4) |

**Copy, do not share, for now.** Cassino is the third copy, and the point at
which a shared front-end package becomes worth considering. It is still
deferred until the bezique and cassino tables both exist. Then a diff across
the three repositories shows which files stayed identical, and those files are
the package. Every copied file starts with a one-line header naming its origin
(`// From piquet web3d/src/kinematics.js @ 254cb3c.`), so that diff is easy to
take.

## 4. Language and method

**Cassino starts in Rust**, for bezique's reasons (bezique `DESIGN.md` §4),
which apply here even more strongly:

1. **The pipeline is proven.** Rust → wasm → JSON protocol → three.js page
   shipped in piquet. The toolchain is installed on this machine: Rust 1.98
   with the `wasm32-unknown-unknown` target, Node 18 and Chromium.
2. **The opponent will search.** The stronger rungs sample the hidden cards
   and search each sample (§11), thousands of times per measurement.
3. **The rules are researched.** The literature review and `RULES.md` leave
   no rule to discover.

The literature review's Python simulator (`research/sim/cassino_sim.py`) is
not an oracle. It deliberately restricts the move set: it offers only maximal
captures and merges same-value builds. It stays where it is, as research.

What replaces an oracle:

- **A brute-force reference move generator inside the test suite.** It
  enumerates every subset of table items for every hand card and value, and
  checks each against a literal reading of `RULES.md` rules 4–7. The fast
  generator must produce exactly the same set on thousands of positions, some
  drawn from random play and some synthetic and crowded.
- **The worked examples in `RULES.md`** as fixtures, written before the code.
- **Invariants over random play**, checked in every test run:
  - 52 cards conserved;
  - eleven points a hand, or eight with a tie for cards, plus sweeps;
  - a legal move always exists;
  - no build survives the hand;
  - the event log reconciles with the totals.
- **Exact statistical targets** where they exist, such as the composition of
  the opening layout.

**Keeping experiments cheap.** A `src/bin/` measurement harness with a shared
mirrored-pair driver and TSV output makes each new experiment a short file.
Python is only for analysing what those files contain.

## 5. Cards

- **52 cards in a `u64`.** Card index = `suit * 13 + (rank - 1)`, with suits in
  the order spades, hearts, diamonds, clubs.
  - Spades are one contiguous 13-bit run, so a spade tally is one `popcount`.
  - Each rank has a precomputed four-bit mask.
- **`CardSet`** is the `u64` newtype. It serves for hands, piles, the stock's
  remainder, loose cards, build contents, and the cards a move takes.
- **Notation:** rank `A 2 3 4 5 6 7 8 9 T J Q K`, then suit `S H D C`, so `TD`
  is the ten of diamonds. Input also accepts `10D`. Display shows `10♦`.
- **The deck order** is a shuffled `[Card; 52]` from the seeded generator.
  Dealing pops from the front, in pagat's order (rule 2), so the same seed
  deals the same game everywhere.

## 6. Rules and values

```rust
pub enum Game { Classic, Royal }
pub struct Rules { pub game: Game, pub aces_fourteen: bool, pub sweeps: bool }
```

All value logic lives in two functions:

- `build_value(card) -> Option<u8>`: the card's value in sums and builds.
  `None` for a Classic court card. An ace is always 1.
- `capture_values(card) -> &[u8]`: what the card can capture.
  - A Classic court card captures by rank, as a special case.
  - With `aces_fourteen` on in Royal, an ace captures as `[1, 14]`.
  - Every other card captures as its build value.

Everything else in the engine reads values only through these two. A future
preset, such as the Nordic game where 10♦ is 16 and 2♠ is 15 from the hand
(review §3.2 row 7), would be a change to these functions plus scoring. The
move generator would not change.

## 7. The table and moves

### 7.1 The table

```rust
pub struct Build { pub cards: CardSet, pub value: u8, pub multiple: bool, pub controller: Seat }
pub struct Table { pub loose: CardSet, pub builds: ArrayVec<Build, N> }
```

- **A build is identified by its cards.** Cards are unique, so any card in a
  build names it. The protocol refers to "the build containing 5♣", and that
  reference stays stable as other builds come and go.
- **The core keeps no positions.** Where each card sits on the table is
  presentation. The session derives it from the order things arrived, and
  passes it to clients (§10).

### 7.2 Moves

```rust
pub enum Move {
    Trail { card: Card },
    Capture { card: Card, value: u8, taken: CardSet },
    Build { card: Card, value: u8, onto: Option<BuildRef>, loose: CardSet },
}
```

- **A capture is the set of cards it takes.** Builds are taken whole, so
  `taken` says which builds went too. Two different groupings of the same set
  are the same move. The groups are recomputed only for narration (§7.4).
- **A build move is (card, announced value, target, loose cards).** The kind
  follows from these:
  - **new**: `onto` is `None`;
  - **add**: the value equals the target's value;
  - **raise**: the value equals the target's value plus the card's, and the
    target is single.

  The three cannot collide, because a card's value is at least 1. The result
  is single exactly when no further groups joined: a new build whose cards sum
  to the value, or a raise with no loose cards.
- **The value is explicit** on captures, because a Royal ace can capture as 1
  or 14. It is explicit on builds, because "building 10" and "building fives"
  can use the same cards (W8).

### 7.3 Generating moves

For a value v, the **groups** are every subset of loose cards that sums to v,
plus every build of value v. Loose cards that can enter sums are few (rarely
more than ten), so the subsets are enumerated by a pruned depth-first search
over the cards sorted by value.

- **Captures with v**: every non-empty union of pairwise-disjoint groups,
  deduplicated by the union.
- **Builds, for each hand card c and each value V the player holds after
  playing c** (rule 5):
  - **new single**: subsets of loose cards summing to V − value(c);
  - **new multiple**: a subset S0 summing to V − value(c) (empty if c alone
    is V), plus a non-empty union of further V-groups of loose cards;
  - **raise**: each single build B with value(B) + value(c) = V, plus any union
    of loose V-groups;
  - **add**: each build of value V, plus S0 and any union of loose V-groups,
    as for a new multiple build.
- **Trails**: every hand card, unless the player controls a build.
- **Filter**: the controller's obligation (rule 7), checked on the resulting
  position.

**The full move list can be astronomical.** Partial captures and optional
absorptions mean every union of disjoint groups is a separate legal move. On
an ordinary table that is a few dozen; on a crowded one (a hand where every
card is trailed grows the table to 40 cards) it ran a test out of memory. So
there are two generators:

- **`legal_moves`** is exhaustive, verified against the reference, and
  exponential. It is for tests and small positions.
- **`candidate_moves`** is what agents, hints and clients use. It is exactly
  `legal_moves` whenever no value has more than 12 groups on the table,
  which is over 85% of random positions and nearly every real one. Beyond
  that it offers every trail, each group alone, greedy maximal packings and
  the smallest partial builds, all legal. A person may still make any legal
  move, which `check` accepts.

On top of them:

- **The opponent's candidates.** Dominated moves are pruned. A capture that
  takes a strict subset of another capture with the same card is usually
  worse, but not always: leaving a card can deny a sweep. So pruning is a
  measured policy (§11), never a rule.
- **The person's interface** never lists moves. A person selects cards, and
  the engine answers which moves those selections can still become (§12.3).

### 7.4 Groups for narration

A capture's groups are recomputed deterministically: pairs first, then
builds, then sums from the fewest cards up. The table talk and the animation
can then say "the eight takes the eight, then six and two, then five and
three", and fly the cards over group by group.

## 8. The hand, the game and the score

- **`Hand`** runs one pass through the pack:
  - six deals, alternating turns;
  - the residue to the last capturer;
  - an ordered **event log**.

  It is an immutable-feeling state machine: `apply(move) -> Result<Events,
  Illegal>`.
- **Events** are the single source of truth for scoring, narration, trackers
  and animation:

  ```
  Dealt { deal: 1..=6, last: bool }
  Played { seat, move, groups }      // the move, with its narrated groups
  Swept { seat }
  Cash { seat }                      // an ace took an ace
  Clinched { seat, what: Cards | Spades }   // 27th card / 7th spade
  Residue { seat: Option<Seat>, cards }
  Scored { breakdown }               // in Foster's count order
  ```

  `Clinched` is the moment physical players claim mid-hand: "spades or cards
  as soon as one player has captured 7 or 27 of them" [02-S1]. The Dominican
  custom of pointing out *dejado* ("left behind") cards [02-S3] is a note
  (`advice::Note::LeftBehind`), not an event (§12.1).
- **The breakdown** follows Foster's count order: cards, spades, Big Cassino,
  Little Cassino, aces in the order ♠ ♣ ♥ ♦, then sweeps [03-S31][02-S1]. It
  carries the checksum (eleven, or eight with a tie for cards).
- **`Game`** runs hands to 21 (rule 10) and alternates the deal. It holds the
  rules, the totals and the hand history.
- **Tallies** for the trackers come from the piles: cards, spades, aces, the
  Cassinos and sweeps, for each seat.

## 9. Observation: what each player knows

Piquet's observation module leaked four times. Cassino's information is
simpler, but not trivial.

- **Hidden:** the opponent's hand, and the stock's order.
- **Public:** the table, everything played, everything captured (all of it
  was seen when it was taken), the scores, whose deal it is, and the deal
  number.
- **Public, and easy to forget: a build announces a card.** A player who
  controls a build of value V holds a card of value V, by rule 5. A sampling
  opponent must deal the other player's hidden hands consistently with every
  build they control. A BGG reviewer advises bluffing by trailing instead,
  "since building annnounces [*sic*] your next move" [02-S57].
- **Perfect memory is a rung, not a given.** The view exposes the full public
  history. Weaker rungs choose not to use it, and the card-counting aid shows
  a person the same summary the counting rungs use (§12.3).
- **The last deal is perfect information** for anyone who counts. Every unseen
  card is in the opponent's hand (52 = 4 + 6 × 8).

`View` is the only way an agent sees a hand. A test plants a deliberate leak
and checks that the leak test catches it, as bezique's does.

## 10. The protocol

The protocol follows piquet's (`piquet/docs/PROTOCOL.md`):
`start(rules, level, seed) -> state`, then `send(command) -> accepted? ;
state`. The engine runs the opponent between the person's decisions.

- **The state** carries:
  - the table, with each item's slot in arrival order, each build's value,
    kind and controller;
  - your hand;
  - the size of the opponent's hand;
  - the stock count;
  - the deal number;
  - the tallies;
  - the scores;
  - the prompt;
  - the events since the last state.
- **Selections, not lists.** For the play prompt, a client may ask
  `options <hand card> [table items…]`. The engine answers with the moves
  still reachable, grouped as capture, build N, build Ns and trail, and with
  the reason any item cannot be added (§12.3).
- **Commands** use the card notation:
  - `trail 7H`;
  - `take 8S 8D 6C 2D 5S 3H` (with the capture value when an ace is played:
    `take AC=14 KS AH`);
  - `build 8 3D 5C`;
  - `build 9 AD on 3S`, where `on` names a card in the target build;
  - `next`, `undo`, `set <aid> on|off`, and `replay`, as in piquet.
- **Watch mode** is the same session with two computer seats. A command steps
  it one move at a time.

## 11. The opponent

### 11.1 A ladder of capabilities

As in piquet and bezique, skill is a **ladder of named capabilities**. Each
rung is a concept a player could be taught, and each must beat the rung below
it in a mirrored measurement or be deleted. As measured
(`measurements/README.md`):

1. **Legal** (`agents.rs`). Any candidate move, uniformly.
2. **Greedy** (`agents.rs`). Takes the capture worth most and otherwise
   trails its least valuable card; never builds. It beats legal by 11.8
   points a mirrored pair of hands.
3. **Counter** (`counter.rs`). Remembers every card, samples the opponent's
   possible hands (honouring what their builds announce), and weighs each
   move by what it banks, what the opponent's best reply would take back,
   and what a surviving build of its own will take next turn. It prices the
   sweep a stolen lone build would be. It beats greedy by 6.8 points a pair
   in Classic (9.0 in Royal) and wins about 88% of games.
4. **Searcher** (`search.rs`). In the last deal, the exact solver
   (§11.2). Before it, sampled worlds, each candidate played out to the end
   of the current deal by the counter for both seats (§11.3). It beats the
   counter by 3.7 points a pair in Classic (6.4 in Royal) and wins about 76%
   of games.

One proposed design failed measurement and was deleted: playouts to the end
of the *hand* with greedy players were no clearly better than the counter.

**The player scales the opponent up and down.** The skill setting runs from
the bottom rung to the top. Between rungs, **erraticism** gives finer steps:
on each decision it may slip the opponent down a rung, drawing from the
agent's own random stream so the cards never change. The setting can change
between games, and from the next hand during one. Each setting's strength is
measured, so the labels tell the truth.

**Style** (aggressive builder, cautious trailer, sweep-hunter) follows piquet. A style chooses among near-equal options, and is
calibrated to be EV-neutral. The opponent is "your opponent" in anything a
player reads, never a proper name.

### 11.2 The last deal is solved exactly

After the sixth deal, both hands are known to a counting player. That leaves
eight plies of perfect information. Alpha-beta search with move ordering and
a transposition table solves it, in a median of 5 ms natively.

The objective is the hand's points margin. Piquet's lesson, that "a point is
not a point in a partie", suggested playing the last deal for the *game*
instead: a hand that carries a player over 21 is worth more than its points.
That was built and measured over 400 pairs of whole games, and made no
difference (+0.005 games a pair). The last deal of the deciding hand rarely
turns on it, so it was taken out (`measurements/README.md`).

### 11.3 Earlier deals

Deals 1–5 have hidden cards: the opponent's hand, and the order of the stock.
The searcher samples 32 worlds consistent with its view (§9), narrows the
candidates to the counter's best eight, and plays each candidate out in every
world **to the end of the current deal**, with the counter (on four samples)
for both seats. It scores the worth each side banked on the way.

- **The same worlds, and the same playout luck within each, serve every
  candidate**, so the comparison is not drowned by sampling noise.
- **The horizon is the deal, not the hand.** Playouts to the end of the hand
  measured no better than the counter: a hand's final margin swings by
  several points, too much for 32 worlds to separate moves whose true
  difference is a fraction of a point. The deal is short, and a build never
  survives its end, so what was banked is a fair score.
- **The counter is the playout policy.** It beat greedy in that role,
  confirmed on fresh seeds (greedy never builds, so its playouts misjudge
  builds).
- Cost: about 3 ms a decision natively.

### 11.4 Measurement

- **Always mirrored pairs.** The same deck is played twice with the seats
  swapped. Piquet's unmirrored harness disagreed with itself by five sigma.
- **Sequential, with the stopping rule fixed before the data.** This is a
  standing rule of the repository, from the user: "if you have a clear signal
  coming through, your sample size can be rather small". Every simulation
  runs in batches and looks at its own signal between them. It stops as soon
  as the answer is clear, rather than running a fixed large count.
  - **Peeking has a price, and the boundaries pay it.** Stopping whenever
    p < 0.05 at any look inflates false alarms well past 5%. So each run
    fixes, before its first batch:
    - the batch size;
    - the maximum number of looks;
    - the **O'Brien–Fleming boundary** for that many looks at a two-sided 5%
      (for four looks: |z| ≥ 4.05, 2.86, 2.34, 2.02).

    Piquet's `bin/partie-sequential` did exactly this. It stopped at its
    second look of four, after 200 pairs instead of 400.
  - **A clear effect stops the run early** when the boundary is crossed. Its
    size and interval are reported.
  - **No clear effect by the last look** ends the run with the estimate and
    its 95% interval. That interval bounds how large any difference can be,
    which is a finding too.
  - **The rule lives in the code.** The harness (`tournament.rs`) implements
    the batches, the looks and the boundaries, so a new experiment gets them
    by default. Each run's record states the plan it was held to.
- **Beware the maximum of noisy estimates.** Choosing the best of several
  variants by their measured means overstates the winner. A chosen variant is
  confirmed on fresh seeds (piquet's lesson).
- **Ratings by Bradley-Terry over a ladder**, and **the anatomy of a hand**
  (captures, builds, sweeps and residue by rung) to see *why* a rung wins.
- **Classic and Royal are measured separately.** The review notes that
  Psellos's advice was written for Royal, and that its own simulations
  covered only Classic [08-S36].

## 12. Making it fun

The user's brief: what people say during the game belongs in the game, in
dialogue boxes as in piquet. Digital affordances that help, and the
traditional objects that bring joy, should both be considered. This section
collects the candidates. The ones the engine must support are marked
**engine**.

### 12.1 Table talk

Cassino's talk is unusually rule-bearing. From 1867 "what a player said
changed what the move legally was" (review §6.1). The calls are still
traditional even though the engine makes them unambiguous.

| Moment | Said | Source | Engine |
|---|---|---|---|
| A single build | "Building eight." (period style: "Eight.") | [02-S1][03-S15][03-S36] | build event: value, single |
| A multiple build | "Building eights." / "Two eights." Plural, the 1867 grammar | [03-S15][03-S31] | build event: multiple |
| A raise | "Seven." … "Nine." … "Ten.": Dick's 1866 back-and-forth | [03-S14] | build event: raised from |
| The sixth deal | "Last." The dealer must say it; players miss it when apps drop it | [02-S1][06-S20] | `Dealt { last }` |
| A sweep | "Clear!", "Clean sweep!" No traditional English shout exists, so these are the attested nouns | [02-S1][04-S102][04-S159] | `Swept` |
| An ace takes an ace | "Cash." | [02-S1] | `Cash` |
| 27 cards / 7 spades | "That's the cards." / "Seven spades." | [02-S1] (counting as earned) | `Clinched` |
| A missed capture | "You left the five." The Dominican *dejado*/*pisado* custom | [02-S3] | `Left` |
| The count | "Cards… Spades… Big Cassino… Little Cassino… Aces…": the chant (said until the sixth play-testing; now told by the score's popups alone) | [04-S159][10-S56][03-S31] | `Scored`, in order |
| Before the game | "Do you count sweeps?" "Certainly not." / "Low deals." | [04-S28] | the settings and the cut |

Notes on the design:

- **Settings as conversation.** Jack London's players agree their house rules
  aloud before the deal [04-S28]. The new-game screen can stage the settings
  the same way: your opponent asks "Do you count sweeps?", and your settings
  answer, "Certainly not." or "We count them." It is a small thing, but it
  turns a menu into a scene. Then the cut: "Low deals." London's reply goes on
  to belittle a game with sweeps; the table leaves that out.
- **The talk is kind.** Play-testing asked for it kid-friendly: nothing said
  at the table insults, belittles or sneers. Pointing out what was left is an
  observation ("You left the five."), never a jibe, and a test keeps a list
  of unkind words out of the bank.
- **Raise wars.** When a build is raised back and forth, the dialogue shows
  the chain ("Seven." "Nine." "Ten.") the way Dick's 1866 example reads.
- **The count is a ritual.** The end of the hand is staged in Foster's order.
  Each category is called, its cards are fanned toward the winner, and its
  points tick onto the scoreboard. This is the most-requested missing feature
  in shipped apps: "At the end of each game, I want to see a point breakdown
  summary" [06-S20].
- **Pointing out what was left** is a custom, not a nag. It is an opponent
  line that fires sometimes, and an explanation in the hint layer when that is
  switched on.
- **Personas speak their opinions.** The review collects real ones: on court
  cards, "Never part of a build. Ever."; on sweeps, "there is virtually no
  skill in getting a sweep". A persona's lines come from its style.
- **A phrase bank** as in piquet (`docs/PHRASES.md`, generated from a bank).
  Every line is said in several ways, never the same way twice running, with
  a source letter for each.

### 12.2 Traditional objects

- **The cribbage board.** Foster: "the score may be kept with counters, on a
  sheet of paper, or on a cribbage board" [03-S31]. Spade Cassino is played
  around one [03-S23]. A wooden board with a 21-hole track for each player and
  two pegs each is the scorekeeper. In cribbage the back peg leapfrogs the
  front, so **the gap between a player's pegs is always what they scored last
  hand**: an audit trail built into the object. Pegs lift, travel and drop
  with a small settle, using piquet's motion primitives. No Cassino-specific
  board exists [06 §1.7], so the 21-hole board is our adaptation of the
  cribbage board. *Built, then removed after the first play-testing: the
  score HUD's lines to 21 and its per-hand ledger already show the score
  and each hand's points, and the board repeated them.*
- **Counters** are the alternative scorekeeper: 1804's "little box of
  Cassino Markers of tortoiseshell" [04-S36], and the period charts for
  marking points with counters [10-S46].
- **The sweep card, crosswise.** Sweeps are marked "by leaving the cards with
  which they are made face upward at the bottom of the tricks" [03-S31].
  Swedish players offset each one slightly to make a tally [10-S24]. The
  capture pile shows its sweeps physically, countable at a glance.
- **The capture pile, face down, with the last capture on top.** "Only the
  last trick gathered can be seen" [03-S31]. Hungarian players keep piles in
  order so the last capture can be checked [01-S20]. Tapping a pile replays
  what went into it.
- **The stock is the clock.** Its thickness counts the deals left. On the
  sixth it is gone, and "Last" is said.
- **The score sheet.** A paper sheet with a row for each hand is the history
  view and the place the count is written down. It is a sheet of paper, the
  third of Foster's options.
- **Big and Little Cassino have characters.** The 1793 poem calls them "Great
  Casino" and "Casino's younger Brother" [04-S21]. That is flavour for the
  tutorial and for card tooltips.

### 12.3 Digital affordances

Each is a toggle, and most come straight from the review's evidence on
shipped apps (§7.6).

- **Select, and the table answers.** You pick a hand card, and the table items
  it could take or build with light up. As you tap items, a **running sum**
  shows, and chips offer what the selection can still become: *Take*, *Build
  8*, *Build 8s*, *Trail*. The interface never guesses between capturing and
  building. "Controls are so horrible you cannot know whether the app will
  build or take!" [06-S20]. Psellos's legal-play buttons [06-S33] are the
  model. **Engine**: `options`.
- **"Why not?"** An item that cannot join the selection says why: "You'd need
  a 9 to build 9", "Your 8-build needs that 8", "A build can't be part of a
  sum". This answers the most common complaint about shipped apps, that the
  computer seems to play by different rules [06-S19]. The opponent and the
  person use one move generator, and the explanations show it. **Engine**:
  reasons.
- **Build labels.** A big value badge, the controller's colour on the rim,
  and a lock on multiple builds, which can never be raised (review §7.6
  item 1). *As built: a white number on a dark disc, the same for both
  players (its title names the owner), a setting that the tutorial turns
  on; play-testing asked for it to stay in view through the moves.*
- **Live trackers** with the clinch lines: cards towards 27, spades towards 7,
  aces, the Cassinos and sweeps. This meets the need behind the Reddit question
  "Is it allowed to stack or track your spades separately so you can see if
  you have yet won seven?" [02-S63]. **Engine**: tallies, `Clinched`.
- **Cards still out.** Which aces, which Cassinos and how many spades are
  unseen. This is the card-counting aid, showing the counting rungs' summary.
  **Engine**: from the view.
- **Sweep warning.** "A 9 would sweep this table", shown before you commit
  and in the hint layer. **Engine**: which capture values would empty the
  table.
- **What your opponent did.** Their card is lifted, the cards it will take
  light up, then they go. This follows the review's evidence on pace [06-S33].
  There is also a "last turn" replay and a speed setting, because players
  complain about pace both ways [06-S20][06-S21].
- **Hints and explanations** from the top rung, for your moves and your
  opponent's [06-S28].
- **Undo** (off by default outside the tutorial). Removed from the table in
  the seventh play-testing ("remove undo"); the engine and the terminal
  keep it.
- **Fairness you can check.** Every game shows its seed, once it is over, so
  the same deal can be played again. (A replay with both hands face up was
  built, and removed from the table in the seventh play-testing.) A **daily deal** is seeded from the
  date, so it needs no network, and everyone gets the same cards. "The
  computer cheats" is the dominant complaint about apps in this family
  [06-S19]. Your opponent sees only what you see, and the help says so.
- **Watch mode.** Two computer players, at a chosen speed, with their hands
  shown or hidden. It is good for learning, and for us.
- **Match formats.** One game to 21, or a family "World Series" best of
  seven: "they regularly play 'World Series' best-of-7's" [05-S74-BGG597527].
- **The arithmetic heritage.** "No happier introduction to arithmetic was ever
  devised" [03-S36]. The running sum is the aid that serves it.

### 12.4 Explanations and hints

Most people no longer play Cassino. The user wants explanations and hints as
robust as piquet's, with on-screen help pages to follow.

**Three layers, each switchable**, as in piquet:

- **Fact.** What happened: "Your opponent's 8 took 6+2 and 5+3: four cards,
  one of them a spade."
- **Interpretation.** Why it matters: "That leaves only the 9♦, so any 9
  sweeps."
- **Hint.** What the top rung would do in your place, computed from your view
  only. Asking twice gives the same answer, and asking changes nothing about
  the game (piquet `PROTOCOL.md`, "Hints").

**The evaluation is broken down by category from the start.** Piquet
specified a decomposed evaluation and never built it, and its tutor fell back
to naming which rung would play a move (piquet `DESIGN.md` §8). Cassino's
score is already a sum of categories, so a move's worth is naturally a vector:

- **Banked:** cards (towards 27), spades (towards 7), aces, Big Cassino,
  Little Cassino and sweeps, taken by this move.
- **Exposed:** what your opponent's best reply could bank, including a
  sweep.
- **Position:** builds you control and how safe they are, the court card kept
  for the residue, and the cards still out that your holding can take.

An explanation names the largest terms in words a player can learn:
- "takes Big Cassino";
- "leaves a sweep for any 9";
- "protects your 8-build";
- "keeps a court card for the last".

The terms map onto the tutorial's concepts, so an explanation can link to the
page that teaches it.

**Closing the gap in time.** A trail's consequence lands a turn later, and a
build's several turns later. The explanation says so at once ("this trail
gives your opponent a sweep with any 7"), not at the count. That is piquet
`DESIGN.md` §8's first obligation for a tutor.

**Your opponent's moves are explained too.** One shipped app's best-reviewed
feature is that "it even explains the computer's moves" [06-S28]. Only the
layers that are on are shown, from your view: the explanation never reveals
your opponent's hand.

**Move quality** (sound, dubious, blunder) is measured by the evaluation lost
against the hint. It appears only when you ask.

**The review at the game's end** (`review.rs`). Offered once a game is over
("Review how you did?"), it is gentle and about habits, never a single
move: the game is a way back into a game most people never learnt, and the
review is advice, not a marking. Every move the person chose is rated
afterwards against the top rung in their place, from their view, and each
one that gave up points is put down to one theme by comparing it with the
stronger move: a capture let go, a build not made, a build that cost, the
wrong capture, a table left for one card to clear, an ace or a Cassino
trailed, the choice of a trail, and the last deal against the deals before
it. A move-by-move judge misses what spans a hand, so the review also
compares the *mix* of moves with the strongest play's on the same
positions (building was right eleven times, and you built in none of
them), which is how a long-range habit shows. The hands' counts (the
cards, the spades, the Cassinos, the aces) carry luck, so they are only
ever praise. At most two strengths and two habits; a habit only when it
showed at least twice and cost at least two points, above the advisor's
own noise (with the top rung in the person's seat, no theme came to two
points in any of 40 games; `cargo run --release --bin reviews`).

### 12.5 Teaching

The tutorial follows the review's teaching ladder: **pairing → summing →
building → raising → multiple builds** [09-S61][03-S36]. Each step appears at
its first occurrence in a real game, as piquet's tutorial pages do. Royal adds
one page, "The court cards count", and one more for the 1-or-14 ace when that
setting is on. Later, on-screen help pages will cover the rules, the scoring
and the table talk, reachable at any time.

### 12.6 What this asks of the engine

All of these are pure functions of public state, so none can leak:

- events: `Dealt { last }`, `Swept`, `Cash`, `Clinched`, `Left`, `Scored` in
  count order, and builds with their kind and raised-from value;
- the narrated groups of every capture (§7.4);
- tallies for each seat;
- `options(card, selection)`, with the reachable moves and the reason each
  unselectable item is excluded;
- the sweep values of a table;
- the unseen-card summary for a seat;
- `evaluate(view, move)`, broken down by category (§12.4);
- `explain(view, move)` and `hint(view)` on top of it.

### 12.7 The table, in 3D

- **The middle is the game.** Loose cards sit on a loose grid. Builds are
  small squared stacks, slightly fanned so their cards read, each with its
  badge.
- **Capture piles** sit at each player's right, face down, with sweeps
  crosswise.
- **The stock** sits at the dealer's left.
- On a phone, the layout grows as the table fills, and builds collapse to
  their badge with a tap to fan them. Piquet's phone work (framing, the
  Large Text faces) carries over.
- Cards move with piquet's kinematics. The novel motions are the **gather**
  (several cards sliding together into one hand, then into the pile) and the
  **stack** (a card landing squarely on a build).

**Budget.** Piquet's page is 3.1 MB: 1.6 MB of art, 1.0 MB of JavaScript and
0.4 MB of engine. Cassino adds 20 pip cards (2–6). These are simple images,
so the estimate is about +0.3 MB, about 3.5 MB in all.

## 13. Testing

1. **Unit tests**, test first, in every module.
2. **`RULES.md` fixtures**, W1–W20, in a compact position notation.
3. **The brute-force reference generator** (§4) against the fast one, on
   random-play and synthetic positions, for Classic, Royal, and Royal with
   aces at 14.
4. **Statistical invariants** over random play (§4), with **the slow ones in
   the default run**. In piquet they caught more real defects than the unit
   tests did.
5. **Protocol tests.** No state ever names a card its reader could not know.
   Replay reproduces a game byte for byte, native and wasm.
6. **Front-end tests**, adapted from piquet's node tests and its offline
   browser test.

A test that cannot fail is not a test. Deterministic agents in mirrored pairs
tie exactly, so any tolerance must be checked for whether it does any work.

## 14. Risks and open questions

- **The selection interface** is where Cassino could become persnickety, as
  bezique's announcements could. It must make the common case one or two taps
  and the rare case possible, and it needs play-testing.
- **Move-list size** on crowded tables: measured early, with the reference
  generator as the speed baseline.
- **Royal's arithmetic** to 13 or 14 is harder to teach than Classic's to 10.
  The running sum and the court-value labels must carry it.
- **Scorekeeper choice** (cribbage board, counters, or both): settled by the
  score HUD; the board was built and then removed (§12.2).
