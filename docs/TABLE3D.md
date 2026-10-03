# The 3D table: design and plan

> How the cassino table is built: what comes from piquet's table, what is new,
> and a phased plan with acceptance criteria, so that a session can resume
> from this file. The engine and the protocol it builds on are in `PLAN.md`
> and `docs/PROTOCOL.md`; the fun it serves is `docs/DESIGN.md` §12. Written
> 2026-10-03, before any table code.

## 1. The brief

From the user, for this game: "build the entire game so it fits in a single
html file (<<10mb); we'll likely even reuse the visual style (realistic
movements, three.js, material design 3 for buttons)", and "we don't have to
reinvent the wheel". The look, the motion and the overlay are piquet's,
whose brief (piquet `docs/TABLE3D.md` §1, in the user's words) still holds:

- clean and a bit cartoonish, bright and easy to use, not childish: "what
  would a computer version of cards look like if it were freed of the cultural
  heritage of having to use grubby cards on dirty furniture";
- toon shading with an ink line around every card; motion easing and shadows;
  a card turned over along an edge that stays on the table;
- Material Design 3 controls, downloaded so the page works offline;
- the dialogue said at the table, in boxes, never the same way twice running.

Standing rules: a client of the protocol that holds no rules; every aid a
toggle; "your opponent", never a proper name; the page makes no sound; every
third-party asset credited in `CREDITS.md` in the commit that brings it in.

## 2. What we are making

**`web3d/cassino3d.html`**: one self-contained page, about 3.5 MB, that plays
Classic or Royal Cassino against the computer (or watches two computer
players), opened from disk with no network.

**The scene.** The same bright, pale table as piquet's. Your hand floats
before you, fanned, facing you; your opponent's floats across the table,
backs to you. **The middle of the table is the game**: the loose cards on a
loose grid, and the builds as small squared stacks, slightly fanned so each
card reads, each with a value badge. The capture piles lie face down at each
player's right, sweeps crosswise and offset so they can be counted (the
Swedish tally, `DESIGN.md` §12.2). The stock lies at the dealer's left; its
thickness is the clock of the hand. The scorekeeper sits at the table's
edge.

## 3. What comes from piquet

Piquet's `web3d/` at commit 254cb3c. Every copied file starts with a line
naming its origin (`// From piquet web3d/src/kinematics.js @ 254cb3c.`).

| Piquet module | For cassino |
|---|---|
| `scene.js`, `cards.js`, `materials.js`, `surfaces.js`, `framing.js` | **Copy**: the renderer, the card slab, toon shading and the ink hull, the table top, the camera for any window |
| `easing.js`, `kinematics.js`, `timeline.js`, `director.js` (the render-on-demand loop) | **Copy**: every motion primitive and the clock |
| `art.js`, `faces.js` (Large Text faces), `deck.js` | **Copy**, with 52 cards instead of 32 (`deck.js` by card code; cassino has one of each card, so codes stay unique keys) |
| `engine.js` | **Adapt**: cassino's exports (`docs/PROTOCOL.md`, "WebAssembly") |
| `bag.js`, `dialogue.js` | **Copy**: saying things several ways, and the boxes' timing |
| `speech.js`, `talk.js`, `tools/phrases.py` | **Rewrite**: cassino's events and phrases (§7) |
| `layout.js`, `choreography.js` | **Rewrite**: the middle of the table (§5, §6) |
| `overlay.js`, `scorebug.js` | **Adapt**: the shell, the settings and the score; new chips and trackers (§8) |
| `tutorial.js` | **Adapt**: the teaching ladder (§9) |
| `build.py`, `tools/art.py`, `tools/scheme.mjs` | **Adapt**: the cassino page, all thirteen ranks, the same colour scheme |
| `test/*.test.js`, `test/browser.py` | **Adapt**: node tests of the pure modules; the offline browser test |

## 4. Assets

- **The card art**: the same public-domain deck (AustinGabriel64, CC0), cut
  by `tools/art.py` for all thirteen ranks: 52 faces and the back (Germarquezm,
  CC BY-SA 3.0, re-framed as in piquet). The twenty new faces (2–6) are plain
  pip cards, a small addition.
- **Budget**: piquet's page is 3.1 MB (art 1.6, JavaScript 1.0, engine 0.4).
  Cassino: art about 1.9, JavaScript about 1.1, engine 0.33, so about 3.4 MB.

## 5. Layout: where everything rests

`layout(state) -> Map<card, Pose>` is a pure function of the protocol state,
node-tested, as in piquet.

- **Your hand**: `state.hand`, fanned and floating.
- **Their hand**: `state.opponent_holds` anonymous cards, backs to you.
- **The table**: `state.table` items in arrival order on a grid that grows
  from the centre. A loose card lies flat. A build is a stack: its cards in
  the order laid, each offset a little so its index shows, the last on top,
  with a badge (value; "8s" for a multiple build; the controller's colour).
  An item keeps its slot while it lies there; new items take the next free
  slot. The grid shrinks the cards a little as the table fills, and on a
  phone it wraps.
- **The piles**: each player's captures face down at their right, squared,
  their thickness the count. Each sweep's capturing card lies crosswise in
  the pile, face up, offset from the last.
- **The stock**: `state.undealt` cards at the dealer's left.

**Identities only where the view has them**: a mesh shows its face only when
the state reveals the card to the person (your hand, the table, captures as
they happen); everything else shows its back. A test walks scripted games and
checks that no mesh in the opponent's hand or the stock carries a face.

## 6. Choreography: how things get there

`choreograph(prev, next)` turns the events since the last state into a
timeline; every timeline ends exactly at `layout(next)` (the test).

| Event | Motion |
|---|---|
| `dealt` | In twos from the stock: two to the non-dealer, two to the table (first deal), two to the dealer, twice. The sixth deal's dealer says "Last." |
| `played`, trail | The card leaves the hand, arcs and is laid on its slot |
| `played`, build | The card arcs onto its first loose card (or the target build) and the other loose cards slide in under it; the badge appears or changes |
| `played`, capture | **The gather**: the card lands on the first group, the groups slide together in narration order (`groups`), and the whole lot sweeps into the capturer's pile |
| `swept` | The capturing card turns face up and lies crosswise in the pile; a short celebration |
| `residue` | The last cards slide to the last capturer's pile |
| `scored` | The count ritual (§8) |

Your opponent's moves are staged as in shipped apps that players praise: the
card is lifted, the cards it will take light up, then they go (`DESIGN.md`
§12.3).

## 7. Table talk

The dialogue boxes say what Cassino players say (`DESIGN.md` §12.1): the
build calls ("Building eight." / "Building eights."), the dealer's "Last.",
"Clear!" and "Clean sweep!" for a sweep, "Cash." for an ace taking an ace,
the clinches ("That's the cards." / "Seven spades."), sometimes "You left
the five." (the *dejado* custom), and the count's chant. Before the game,
the settings are staged as Jack London's players' negotiation ("Do you count
sweeps?" … "Low deals."). `tools/phrases.py` holds the bank, each phrase in
several wordings with a source letter; `docs/PHRASES.md` is generated from it.

## 8. The overlay

Material Design 3, from piquet's shell.

- **Choosing a move**: tap a hand card, and it lifts; the table cards it
  could take or build with light up (`offer.can_add`); tap them; a running
  sum shows; chips offer exactly what the selection makes (`offer.moves`:
  *Take*, *Build 8*, *Build 8s*, *Trail*). A card that cannot join says why
  on tap (`offer.why_not`).
- **The score**: piquet's broadcast-style score (two numbers that tick),
  first; the 21-hole pegboard (`DESIGN.md` §12.2) as a 3D object later, the
  gap between a player's pegs the last hand's points.
- **Trackers** (each a toggle): cards towards 27, spades towards 7, aces and
  Casinos taken, sweeps; cards still out (`state.unseen`); the sweep warning
  (`state.sweep_values`).
- **The count ritual**: at the end of a hand, the lines of `scored.count` one
  at a time in Foster's order, each with its points, the cards fanned toward
  the winner.
- **Settings**: Classic or Royal, aces 1 or 14, sweeps, the skill dial (1 to
  4 in halves), the aids, Large Text, watch mode, a new game, copy the game
  record (`state.saved`), the daily deal (seeded from the date).
- **Fairness**: the seed on the score; after the game, a replay with both
  hands face up.

## 9. Teaching

The tutorial pages follow the teaching ladder: pairing, summing, building,
raising, multiple builds (`DESIGN.md` §12.5), each at its first occurrence
in a real game; Royal adds "The court cards count"; the ace's 1-or-14 adds
one more. Help pages, reachable at any time, cover the rules, the count and
the table talk.

## 10. Phases

Each phase ends with its tests green and a commit; `PLAN.md` records it.

- **T0. Scaffold.** `web3d/` with `package.json` (piquet's pins), the copied
  modules with origin headers, `tools/art.py` cutting 52 faces, `build.py`
  inlining the wasm, the bundle and the art into `cassino3d.html`. Accept:
  the page opens from disk, shows the table, and the browser test sees no
  network request and no console error.
- **T1. The state drawn.** `engine.js`, `layout.js`: a new game's state laid
  out at rest (hands, table, stock); identities only where the view has
  them. Accept: layout node tests; a screenshot by eye.
- **T2. Choosing a move.** Selection, `offer`, chips, sending the move, and
  the opponent's reply drawn at rest. Accept: a whole game playable by
  clicks in the browser test.
- **T3. Motion.** The choreography of §6, ending exactly at the layout.
  Accept: choreography node tests; a strip of screenshots of a gather.
- **T4. The score and the count.** Score, trackers, the count ritual, the
  end of the game.
- **T5. Table talk.** The phrase bank and the dialogue boxes.
- **T6. Settings and aids.** Everything in §8's settings; watch mode; hints
  and explanations; undo; saved sittings across a reload.
- **T7. Teaching.** Tutorial and help pages.
- **T8. Phones.** Piquet's phone framing and Large Text faces, fitted to a
  middle that grows.
- **T9. Traditional objects.** The pegboard, the sweep tally, the stock as a
  clock, polished.

## 11. Testing

- **Node tests** of the pure modules (`layout`, `choreography`, `easing`,
  `kinematics`, `timeline`, `talk`, `bag`, `framing`), as piquet's.
- **The offline browser test** (`test/browser.py`, Playwright in the project
  `.venv`): it blocks every network request, plays a game by clicking, and
  saves screenshots to read back by eye.
- **The leak test at the table**: no face shown that the person could not
  see.
