# Cassino: plan

> Living document: status, decisions, milestones, and what comes next. It is
> updated as each piece of work lands, so that work can resume from here. The
> reasoning is in `docs/DESIGN.md` and the rules in `docs/RULES.md`.

## Where we are

**2026-10-03: the game is playable, complete for both games, as one offline
page** (`web3d/cassino3d.html`, about 3.3 MB, committed and checked by the
gate against its sources). The engine: a measured four-rung opponent with a
skill dial; explanations, hints and the selection interface; the session
and its JSON protocol; a module that plays a whole game in Node at 10–16 ms
a command, byte for byte as the native build does. The table: all nine
phases of `docs/TABLE3D.md`, the designer's score HUD, the fairness features
and the match, on a desktop, a tablet or a phone held either way. 236 Rust
tests and 213 Node tests of the table, all passing (`bin/gate`), and an
offline browser test that plays whole games by clicking.

**Reviewed.** A full code review by a separate agent
(`docs/reviews/2026-10-03-engine.md`) found one rules-level hole and seven
robustness problems; all are fixed, test first. The hole: under aces 1 or
14, one ace could guard a build of 1 and a build of 14 at once, leaving no
legal move. RULES.md now says each held card answers for one build value.

- **The engine** (`crates/cassino-core`): cards, values for Classic, Royal
  and Royal with aces at 14, the table and builds, move generation, checking
  with a reason for every refusal, the hand (six deals, residue, events) and
  the game (cut, hands to 21). All twenty worked examples of `RULES.md` are
  fixtures. The exhaustive generator matches a brute-force, literal reading
  of the rules on 1,200 synthetic and 4,000+ real-play positions, and planted
  bugs are caught. The bounded candidate generator equals it on ordinary
  tables and stays fast on crowded ones.
- **Observation**: the `View`, with leak tests at every layer; sampled
  worlds that honour the card each opponent build announces.
- **The opponent**: legal, greedy, counter, searcher (the exact last-deal
  solver plus deal-length playouts in sampled worlds). Each rung beats the
  one below, clearly, in sequential mirrored measurements
  (`measurements/README.md`). The skill dial runs from 1 to 4, with one-rung
  erratic slips between rungs. Every decision is a pure function of the
  opponent's seed and the view.
- **Explanations and hints** (`advice.rs`, `words.rs`): notes on any move
  from one observer's view (points, sweeps, cash, clinches, the card a build
  announces, sweeps left open, cards left behind, builds at risk), hints
  from the top rung, ratings (sound, dubious, blunder), the unseen summary,
  sweep values.
- **The selection interface** (`select.rs`): pick a card, tap the table,
  and get the chips, the addable cards, the running sum and the reasons.
- **The session and protocol** (`session.rs`, `crates/cassino-wasm`,
  `docs/PROTOCOL.md`): commands, events with sentences and notes, aids,
  undo by snapshot, replay of records, watch mode, table items with stable
  ids; JSON state, offer and hint; C exports; a Node smoke test.
- **The terminal client** (`cargo run -p cassino-cli`): a client of the
  session, at `--skill 1-4` with `--explain`, `hint` and undo, or `--watch`.
- **Measurement**: mirrored pairs, sequential with O'Brien–Fleming
  boundaries (`cargo run --release --bin measure`); `anatomy` for where an
  agent's points come from; `bench` for speeds. Two principled ideas were
  measured and dropped: card weights that follow the piles, and playing the
  last deal for the game (`measurements/README.md`).
- **Determinism**: golden games (`crates/cassino-wasm/tests/golden.txt`)
  checked natively and through the module in Node.
- **The 3D table** (`web3d/`, plan and phases in `docs/TABLE3D.md`): one
  offline page of about 3 MB, piquet's scene, cards and motion copied with
  origin headers. Done: T0 the scaffold, T1 the state laid out, T2 a move
  chosen by tapping, T3 the motion (the deal in twos, trails, builds, the
  gather of a capture turned over into its pile, sweeps held up and laid
  crosswise), T4 the score and the count (each ace and Cassino turned up as
  its line is told; live trackers), T5 the table talk (a sourced phrase bank, `docs/PHRASES.md`; the
  house rules agreed aloud as the cards are dealt, the build calls, "Last.",
  "Clear!", the count chanted), T6 settings and aids (rules, skill, today's
  deal, watch mode, hints, explanations in a game log, undo, the sitting
  kept across a reload, the credits on screen). A whole game is played by
  clicking in an offline browser test. The score is the designer's HUD
  (segmented lines to 21, the broadcast-swap popup, the per-hand ledger;
  `docs/TABLE3D.md` §8). T7 teaching: tutorial pages at each idea's first
  moment (the teaching ladder: pairing, summing, building, raising,
  multiple builds; Royal's court cards; the count), and all of them from
  the question mark. T8 phones: a stacked table framed between the HUD and
  the controls, upright or sideways, and Large Text faces fitted to the
  hand. T9 the scoring board, a 21-hole cribbage-style board, was built and
  then removed after the first play-testing: the HUD already shows it.
- **The table reviewed twice** (`docs/reviews/2026-10-03-table.md`: one
  critical finding, an upright tablet's overlay and framing disagreeing; four
  major; fifteen minor; an engine one, undo across a deal; five on the tests.
  `docs/reviews/2026-10-03-table-second.md`, of what changed since: three
  major where the fixes met the new features, six minor). All fixed, each
  with a test, the triage recorded in each.
- **Fairness and the match** (DESIGN.md §12.3): the seed shown; after the
  game, a replay with both hands face up (the engine reveals the deals only
  once the game is over); the last move seen again; a World Series, the
  best of seven; the sweep warning before a move (the offer says which
  move leaves a sweep).
- **The first play-testing** (2026-10-03), each note done, test first:
  sweeps off by default (the table and the terminal; kept settings carry a
  version so the old default is not taken for a choice); the scoring
  board removed, the HUD already showing it; builds fanned so each card
  reads, and a value badge that stays in view through the moves (a
  setting, on with the tutorial); the trackers as a foldable table with
  tips; a welcome on opening (Continue, New game, Tutorial); hints and
  explanations toggled under the cards on a desktop; plain white speech
  balloons; the talk kind, with five or more wordings for the frequent
  moments, and each line timed to its moment, the count paced by what is
  said and by the score's popups; scores celebrated on the table, a disc
  on the card with its points bursting out; and card motion that starts
  with a jerk, eases into place, peels off the table and settles on it
  leading edge first. The tutorial's text is `web3d/tutorial.md`, for
  editing (its pages are matched to their moments by position).
- **The second play-testing** (2026-10-03), each note done: the opening
  talk chunked by speaker and the deal under way during it, and a "Table
  talk" setting (everything, the calls, or quiet); the cut shown on the
  table; the move bar (Take, Build, Trail) always there on your turn,
  between the table and your hand on a desktop, your words beside your
  hand; the score's celebrations above their cards, bursting like
  fireworks, in white; your opponent's row and bar above yours, each
  named; slides on the table flicked off and gliding to a stop; and the
  build badges as tall as the cards' corner ranks.
- **The third play-testing** (2026-10-03): no build badge on a card still
  in the pack (a new game's opening build was taken for untouched); speech
  balloons that wrap their words; the move bar's buttons large and solid,
  filling the space between the table and your hand (the table six
  centimetres further off; compact and wrapping on a phone); and the score
  HUD a row a player, name, line and score, your opponent's first.
- **The fourth play-testing** (2026-10-04): the HUD's scores whole at two
  digits (the column sized in the number's own font; a device with wider
  digits than headless Chromium's cut a score past 9 off); the trackers'
  cells all alike, a dash where nothing is taken; and the table talk very
  verbose, the conversation a part of the game as in Cuarenta ("you have
  to turn into a chatterbox"): every move remarked, builds answered with
  what they tell of the builder's hand, a stolen or raised build felt, the
  score said after each hand, the game proposed and a rematch offered, your
  opponent thinking aloud and, kept waiting, saying so. Sourced from the
  research where it can be (`docs/PHRASES.md`), kind throughout. The talk
  follows each build's controller through the events, checked against the
  engine's table; every remark is chatter, heard only at "Everything" and
  left out where it would make a call late (`docs/TABLE3D.md` §7). And the
  tutorial rewritten for new players: each page what its moment needs, in
  plain words, every term explained where it first appears, the interface
  as it is, no history that does not help play (`docs/TABLE3D.md` §9).
  Then, played on the published page: whose deal said with the cut (held
  up longer to be seen) and your opponent's first move waiting for the
  opening's calls, no longer said after it; and the trackers' header tips
  saying first what each point is worth. And the game's end: the camera
  pulls back past the table's near edge, and your opponent was a court card
  all along, standing across the table, cel-shaded, saying the last words
  (twelve courts from a Spanish-suited pack of about 1760, credited;
  `?ending` stages it and steps through all 24 endings; `docs/TABLE3D.md`
  §6).
- **The fifth play-testing** (2026-10-04): your opponent's words at the
  game's end in a balloon beside the court card, three quarters up it, its
  tail pointing at the card (the figure made as each game begins, so it
  stands before its first word); losing, the card's last word, "You are
  quite normal."; the eye raised to look down at 70 degrees to the table
  (from 42, and 29 on a phone), both hands turned square to it, the
  phone's table laid out afresh for a view from above (the middle five
  wide; table cards about 58 px tall on a phone, from 39, and about 90 on
  a desktop, from 71); and on a phone held upright the move bar between
  the table and your hand, as on a desktop. The trackers' panel folded at
  first, its whole heading the button that opens and folds it. The
  tutorial's page on the ace's 1 or 14 folded into Royal's. "Cassino" the
  canonical spelling everywhere the game speaks or the documents name it
  (Big and Little Cassino in the sentences, the score, the tips, the talk,
  the tutorial and the terminal); quotations, the titles of pagat's pages,
  the research notes and code identifiers such as `big_casino` keep theirs.
  And "Raise builds", a setting of both games (on by default, as the rules
  have it): off, no build is raised, in the engine, the table, the
  terminal (`--no-raise`) and the saved record (`raise=0`), and the
  tutorial's page on raising says so.
- **The sixth play-testing** (2026-10-04): Large Text faces by default on
  a tablet as on a phone (an iPad's Safari says it is a Mac; its touch
  points tell it from one); Explanations to the left of Hints, under the
  cards and in the settings, the lesser aid first; and the move bar's
  places fixed, the running sum's among them, so nothing moves as a move
  is chosen (two moves of a kind share a place, their words fitted to it).
- **The South African game, researched**
  (`research/12-south-african-khasino.md`): KASA's rulebooks and its own
  online game as the canonical sources, twenty open-source engines, and
  readings with confidence for what an engine needs. Enough to write a
  settled rules document for the two-player game, with a few points to
  decide or ask KASA about. **Not to be built** (the user, 2026-10-04):
  KASA's own free online game, several apps and some twenty open-source
  engines already serve its players, and KASA revises its rules almost
  weekly. The note stays as the record.

## Settled decisions

| Decision | Choice | Reasoning |
|---|---|---|
| The games | Two-player **Classic** and **Royal** Cassino, chosen at the start | the user; `RULES.md` |
| Settings | "Aces count 1 or 14" (Royal only, off), "Score sweeps" (off since the first play-testing) and "Raise builds" (on; a choice since the fifth) | `RULES.md`, "Authority" |
| Rule authority | pagat.com, Casino and Royal Casino | `RULES.md` |
| Language | **Rust from the first line**; no Python oracle | `DESIGN.md` §4 |
| What replaces the oracle | A brute-force reference move generator, the worked examples, invariants | `DESIGN.md` §4, §13 |
| Reuse of piquet | Copy and adapt, with origin headers; a shared package after the third table | `DESIGN.md` §3 |
| Card model | 52 cards in a `u64`, suit-major | `DESIGN.md` §5 |
| Moves | A capture is the set it takes; a build is (card, value, target, loose cards) | `DESIGN.md` §7.2 |
| Scoring | An ordered event log; totals derived | `DESIGN.md` §8 |
| Evaluation | Broken down by category from the start, for explanations | `DESIGN.md` §12.4 |
| Opponent | A measured capability ladder; the last deal solved exactly | `DESIGN.md` §11 |
| Measurement | Mirrored pairs, always; sequential with fixed O'Brien–Fleming boundaries; Classic and Royal separately | `DESIGN.md` §11.4 |
| Opponent strength | A skill setting the player raises and lowers: the ladder's rungs, with erraticism between them | `DESIGN.md` §11.1 |
| Page | One self-contained HTML file, well under 10 MB | the user |
| Sound | None | as piquet |

## Milestones

- [x] 1. **Cards and rules**: `CardSet`, notation, values for both games.
- [x] 2. **The table and moves**: move generation, the reference generator,
  `apply`, the `RULES.md` fixtures, narration groups.
- [x] 3. **The hand and the game**: dealing, the residue, events, scoring, the
  game to 21. Invariants over random play.
- [x] 4. **Agents and measurement**: random and greedy agents, the mirrored,
  sequential harness and the measurement binary. (The anatomy of a hand is
  still to come.)
- [x] 5. **The terminal client**: play against the computer, and **watch
  mode**.
- [x] 6. **Observation and the stronger rungs**: the view and its leak test,
  the build inference, counting, the exact last-deal solver, sampled search,
  the skill dial. Each rung measured.
- [x] 7. **Explanations and hints**: notes, hints, ratings, the selection
  offer with reasons, sweep warnings, the unseen-card summary.
- [x] 8. **The session, the protocol and the wasm module**:
  `docs/PROTOCOL.md`; the CLI on the session; saved sittings; golden games,
  native and wasm byte for byte; a Node smoke test.
- [x] 9. **The 3D table**, adapted from piquet's: art for 52 cards, the
  middle-of-the-table layout, builds, the table talk.
  Phases T0–T9 in `docs/TABLE3D.md`, the designer's HUD, two reviews.
- [x] 10. **Teaching**: tutorial pages at each idea's first moment, and all
  of them from the question mark (T7).

## Working conventions

- **Test-driven**: tests first, throughout.
- **Atomic commits, often**, straight to `main` until the game is public.
  `PLAN.md` is updated as each piece of work lands.
- **Every aid a toggle.** "Your opponent", never a proper name.
- **Every third-party asset credited in `CREDITS.md`** in the commit that
  brings it in.
- **Consult the user before anything that spends money**, and before any long
  compute run, with a runtime and cost estimate in hand.
- **An unattended overnight session ends with the VM shut down**: everything
  committed, this file current, then `sudo shutdown -h now` (the instance
  cannot stop itself through `gcloud`; piquet's `docs/VM.md`).
- **Simulations stop when the signal is clear.** Batches, looks between them,
  and an O'Brien–Fleming boundary fixed before the first batch: a clear
  effect ends the run early, and the last look reports the interval
  (`docs/DESIGN.md` §11.4). The user: "if you have a clear signal coming
  through, your sample size can be rather small".

## Published

**2026-10-04: public**, at the user's request: the repository
(<https://github.com/abartnof/cassino>) and the game, served by GitHub
Pages from `main` at <https://abartnof.github.io/cassino/> (the root
`index.html` goes on to `web3d/cassino3d.html`, as piquet's does). Every
push to `main` republishes the page. MIT (`LICENSE`), checked first against
every part by others (`CREDITS.md`).

## Open for the user

1. **One design call made provisionally**: the game's seed is shown only once
   the game is over (shown during it, a second window could read your
   opponent's hand; the second review, S4). Fairness is still checkable
   after the game, with the replay.

2. **The trackers' fold** could not be made to fail here (Chromium and
   WebKit, mouse and touch); the whole heading is now its button. Worth
   trying on the device that found it.
3. **The eye at 70 degrees**, of the 70 or 80 play-testing offered: at 80
   the table is flat, and on a phone the hand would shrink further.
   `units.js` `PITCH`; the zones and the phone camera's reach would follow.

## What could come next

- Real devices: the phone and tablet layouts are tested in headless
  Chromium only, and the HUD's springs need `linear()` (Safari 17.2+); its
  handoff lists what was not designed (a win flourish, tie popups).
- The shared package across piquet, bezique and cassino, once the third
  game shows what they truly share (`docs/DESIGN.md` §3).
- A screen-reader narration of each move (the game log has the words; only
  the focused card is told now).

## Notes for a future session

- Before committing a table change: `bin/gate` (it builds the module and
  checks the committed page), then `~/piquet/.venv/bin/python
  web3d/test/browser.py --quick`; the full browser test (about fifteen
  minutes, best run in the background) before calling a phase done.
- Read `docs/RULES.md` before touching move generation. The fixtures W1–W20
  are the rules' worked examples.
- `~/piquet` and `~/bezique` are the working references. Read their
  `docs/PROTOCOL.md`, piquet's `docs/TABLE3D.md`, and the "Hard-won lessons"
  in piquet's `PLAN.md`.
- Observation is where piquet's subtle defects lived. Here, the subtle point
  is that a controlled build announces a card in its controller's hand.
