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

`choreograph(prev, next, placement, view)` turns the events since the last
state into a timeline (`choreography.js`, after piquet's). A reducer replays
the events into the states between, each laid out by `layout`, so every
stage runs between two true layouts; a final settle lands everything on
`layout(next)` whatever happened, and an undo or a new game is one direct
transition. The tests hold the reducer to the engine's own states (a watched
game steps one move at a time), and every timeline of real games to its
layout, its faces, no leak, and no card through the table.

| Event | Motion |
|---|---|
| `dealt` | In twos off the top of the stock, each card straight to where it will rest: two to the elder, two face up to the table (the first deal), two to the dealer, and round again. Yours turn to face you as they rise, and show their faces. A new hand first collects every card into the stock at the new dealer's left, the highest first, a face-up card turning over on its way |
| `played`, trail | The card is tugged out of the hand, arcs a little above it and falls to its slot at the end of the grid; the grid moves up to make room |
| `played`, build | The loose cards it takes in are pushed together on the first of them and the card is laid on top; a raised build takes the card and then the loose cards on top of it |
| `played`, capture | **The gather**: the card lands on the first group it takes, a moment to see it, the other groups are pushed onto it in narration order (`groups`), and the heap is turned over into the capturer's pile as one rigid block (`kinematics.carryBlock`) |
| `swept` | The capturing card is held up a moment, facing you ("Clear!"), and laid crosswise in the pile once the heap is in: at the height it was laid, so later captures cover its middle and its ends still show (the Swedish tally) |
| `residue` | The last cards gathered as a capture is, item by item, into the last capturer's pile |
| `scored` | The count ritual (§8), in T4 |

Your opponent's moves are staged as in shipped apps that players praise
(`DESIGN.md` §12.3): a pause before each (`think`), and after their card
lands on what it takes, a longer look before the gather (`look`), while
the cards it takes light up (the choreography's `marks`, lit by the
director on the table's clock).

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
- **The score HUD**, from the designer's handoff (the spec and its approved
  reference implementation are commit c484091; the reference's numbers are
  the source of truth, and `hud.js` and `style.css` port them). A dark card
  at the top left, neutral greys only, the system font, tabular numerals:
  - two **segmented lines** to 21, yours above, in groups of five with a
    wider finish; a segment is reached (6 px), the cursor (12 px) or
    unreached (4 px). The lines never slide: scoring lights the next
    segments in a wave (each flares to 20 px at 38% of 760 ms, 70 ms apart)
    and dims the old cursor. Only the lines' tones tell the players apart;
  - the **scores**, with a **chevron** between them. When a player scores,
    a **popup** rolls in over their score ("Big Casino +2", the word left,
    the points at twice its size), the number ticks up beneath it, and after
    1.7 s the score rolls back with a pop;
  - the chevron opens the **ledger**: every hand's six lines in the
    counting order (most cards, most spades, Big Casino, Little Casino,
    aces, sweeps), its subtotal under them, "Hand N · live" for the hand
    under way, and the total. One level, no further toggles;
  - three springs, sampled for CSS `linear()`: fast spatial (damping 0.6,
    stiffness 800), default spatial (0.75, 380), effects (1.0, 1600).
    Reduced motion collapses every duration.

  The model is a per-hand ledger derived from the events (`ledgerOf`), and
  the totals from it. Choices made in integrating it: a sweep's point
  shows as the sweep is made (when sweeps are scored), so the running total
  includes the live hand's sweeps and the count does not show them again;
  the count's aces come as one popup a player, at the first ace's line;
  popups queue one side at a time (about 2 s each), and a hand joins the
  ledger once its popups have played; the line stops at 21 but the scores
  go past it; the card names keep the game's spelling (Big Casino). Not
  carried over from the spec, as it says: no 18-20 endgame zone, no marks
  under the scores. Our own aids keep to their own panel (below).
- **Trackers** (each a toggle), in a panel of the HUD's palette at the foot
  of the left: cards towards 27, spades towards 7, aces and Casinos taken,
  sweeps; cards still out (`state.unseen`). The sweep warning
  (`state.sweep_values`) is a line under the prompt.
- **The count ritual**: at the end of a hand, the lines of `scored.count` one
  at a time in Foster's order: each ace and Casino turns up out of its
  taker's pile into a row (`layout.js` lays out a counted hand; the
  choreography's `count` stage times each card to its line), the HUD's
  popups tell each line's points, and the winner of each line chants it.
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
  **Done**: `choreography.js`, `director.js` (piquet's render-on-demand
  loop, taking states), `kinematics.carryBlock`; the opening deal played
  out; a tap while the cards move lands them; `?speed=` and `?manual` (the
  clock moved by hand, for stills). The browser test plays a whole game by
  clicking with the motion on, and saves strips of the deal, a gather and a
  sweep (`t3-deal`, `t3-gather`, `t3-sweep`).
- **T4. The score and the count.** Score, trackers, the count ritual, the
  end of the game. **Done**: at the end of a hand, each ace and Casino the
  count names turned up out of its taker's pile into a count row as its
  line is told; trackers (`scorebug.js`, pure and node-tested). The score
  was first a broadcast's bug and a paper score sheet; both gave way to the
  designer's HUD (§8, `hud.js`), whose model is node-tested against real
  games and whose totals the browser test checks at every hand's end.
- **T5. Table talk.** The phrase bank and the dialogue boxes. **Done**:
  `web3d/tools/phrases.py` (the bank, each phrase in at least two wordings
  with its source; `--check` keeps `docs/PHRASES.md` and `words.json` in
  step, run by the Node tests), `talk.js` (events to phrases, pure and
  node-tested), piquet's `dialogue.js` and boxes by each speaker's hand.
  Said: the house rules agreed aloud and the cut before the opening deal,
  which waits for them; the build calls (singular, plural, a raise by its
  new total: the engine's `played` event now says which); "Last."; "Clear!";
  "Cash."; the clinches; your opponent pointing out what you left; the
  residue; the count chanted line by line with the sheet; the game's end.
  Boxes linger on the table's clock.
- **T6. Settings and aids.** Everything in §8's settings; watch mode; hints
  and explanations; undo; saved sittings across a reload. **Done**: the top
  bar (new game, hint, undo, the game log, help, settings); the settings
  dialog (`chrome.js`: the next game's rules and your opponent's skill in
  halves, New game, Today's deal, Watch a game; the engine's aids and the
  page's: trackers, cards still out, the sweep warning, undo; animation
  speed and the table top); the credits on screen; preferences and the
  sitting kept in the browser (`prefs.js`, node-tested, surviving storage
  that fails); a hint shown under the prompt with its cards lit, chosen by
  the hint button; the game log with each move's notes (the explain aid);
  a watched game that plays itself. The director now draws only when a
  card moved. The browser test turns hints and undo on in the dialog, takes
  a hinted move back, reloads, reads the credits and watches a game.
- **T7. Teaching.** Tutorial and help pages. **Done**: ten pages in
  `web3d/tutorial.md` (the introduction; pairing, summing, building,
  raising, multiple builds; the court cards count; the ace's 1 or 14; the
  count; what is said at the table), each opening by itself at its first
  moment in a real game with the table held still (`tutorial.js`:
  `pageDue`, from the moves on offer and what your opponent has just done;
  node-tested against real games, every page reached), and all of them at
  any time from the question mark. The tutorial is on for a new player and
  a switch in the settings; a page read already does not come again. The
  browser test reads the introduction, meets a page of the ladder in play,
  and pages through the help.
- **T8. Phones.** Piquet's phone framing and Large Text faces, fitted to a
  middle that grows. **Done**: cassino's own stacked arrangement
  (`units.js` `ZONES_PORTRAIT`: the middle three wide, your hand held up
  near the eye, the piles and stocks at the corners); the layout and
  choreography take their zones from the view; a staging test measures the
  portrait camera's reach over whole games and holds `CAMERA_PORTRAIT.reach`
  to it; the page measures the overlay's strips (upright: under the HUD and
  the aids' panel, above the controls and the bar of icons at the foot;
  sideways: between the HUD's column and the controls') and frames the table
  between them, laying the cards out afresh when the phone turns. The Large
  Text faces (automatic on a phone, or chosen in the settings) are fitted
  to the 2.9 units of each card cassino's hand of four shows, which the
  faces test measures. The browser test plays by tapping on a phone held
  either way.
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
