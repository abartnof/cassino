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

**The scene.** The same bright, pale table as piquet's, seen from high
over it: the eye looks down at 70 degrees to the table (play-testing found
the cards "too hard to see, esp. in mobile mode" from the old eyes, at 42
degrees across the table and 29 on a phone; at 70 a card lying on the table
is foreshortened by 6 per cent, against 32 and 52). Your hand floats before
you, fanned, turned square to the eye (on a phone or a tablet, a row of
cards spaced wide, lying just off the table, the table's size: the
seventh play-testing; §8); your opponent's lies just beyond the
middle's last row, tipped toward you, its backs square to the eye
(`units.js` `PITCH`, `facingEye`; `test/eye.test.js`). Across the table the
field is 31 degrees (the sixth play-testing: "too much white space on the
screen (desktop mode) - try to make the hand and the cards on the table
bigger"), a table card a seventh of the window's height, a third larger
than before: the room once kept empty for a second row of the middle,
needed at one move in eight, is given up, your opponent's hand drawing
back 12 cm over a second row, partly out of the window's top (two fifths
of it in view at least). The field widens only where it must, on a
squarer window for the table's width and on a shorter one for its reach,
and the picture is lifted so that your hand ends just above the controls'
strip, the prompt, the note and the aids' line (`framing.js`
`DESKTOP_FOOT`); the hints and explanations sit at the window's bottom
right, and your opponent's words beside their hand. **The middle of the table is the game**: the loose cards on a
loose grid, and the builds as small squared stacks, fanned so each card's
index and a strip of its face read, each with a value badge (a setting). The capture piles lie face down at each
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

- **Your hand**: `state.hand`, fanned and floating, square to the eye; on
  a phone or a tablet a row, spaced wide (`kinematics.js` `row`; the
  seventh play-testing: "On mobile and ipad, don't bother fanning the cards
  in the player's hand, just space them wide. whatever size and spacing
  this turns out to be, try to Make the cards on the table this same size.
  plenty of whitespace to use"). The row lies just off the table, just
  nearer you than its first row with the move bar between, so its cards are
  as far from the eye as the table's and as wide on the screen (to a tenth;
  a table card, lying flat and seen slanting, is a little shorter); your
  hand no longer held up near the eye, the field closes in and the table's
  cards are larger. Upright, `ZONES_PORTRAIT`; a tablet held sideways has
  its own arrangement and eye (`ZONES_TOUCH`, `CAMERA_TOUCH`: the middle
  five wide and the piles in from the edges, the cards about a tenth
  larger than a computer's at the same window). Your pile and the stock
  beside the row lie as far from a row of four as its cards from each
  other (the user: "make the spacing between the users hands (face up or
  down) uniform"). A computer keeps the fan.
- **Their hand**: `state.opponent_holds` anonymous cards, backs to you and
  square to the eye; never face up (the replay after the game that
  turned it face up went in the seventh play-testing).
- **The table**: `state.table` items in arrival order on a grid that grows
  from the centre. A loose card lies flat. A build is a stack: its cards in
  the order laid, each offset so its whole index and a strip of its face
  show (the layout test holds the offsets to the index measured on the
  art), the last on top. With "Build values" on (off by default, always on
  while the tutorial is), a badge on the top card's top right corner, clear
  of the indices: the value ("8s" for a multiple build), white on a dark
  disc ringed in white; its title names whose build it is and its cards,
  and a tap on it is a tap on the build. The badges are placed as each
  frame is drawn, so they follow the cards, and stay through every move
  that leaves their build alone (`badges.js`); a build made, raised or
  taken shows its badge once the cards rest.
  An item keeps its slot while it lies there; new items take the next free
  slot. Or, sorted (a setting, on by default; the user: "cards and
  [builds] on the table, dynamically automatically sort in descending
  order, left to right"), the items lie highest first, a build by its
  value and a loose card by its rank, equal ones as they came, across the
  first row and on into the next, and slide to their places as the table
  changes (`layout.js` `tableOrder`); and your hand with it (the user: "if
  the user turns on card sorting, then their own cards should also stay
  sorted"), highest first, an ace high where it may count fourteen
  (`handOrder`). The grid shrinks the cards a little
  as the table fills, and on a phone it wraps.
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
`layout(next)` whatever happened, and a new game or a sitting restored is
one direct transition. The tests hold the reducer to the engine's own states (a watched
game steps one move at a time), and every timeline of real games to its
layout, its faces, no leak, and no card through the table.

| Event | Motion |
|---|---|
| `cut` | Each player's card peeled off the top of the pack toward them and laid face up beside it, nearer the middle, yours nearer you; both seen a moment ("Low deals."); then back on the pack, face down, before the deal. A tied cut is shown again. Heard as it begins, so the house rules are agreed as the cards are cut |
| `dealt` | In twos off the top of the stock, each card straight to where it will rest: two to the elder, two face up to the table (the first deal), two to the dealer, and round again. Yours turn to face you as they rise, and show their faces. A new hand first collects every card into the stock at the new dealer's left, the highest first, a face-up card turning over on its way |
| `played`, trail | The card is tugged out of the hand, arcs a little above it and falls to its slot at the end of the grid; the grid moves up to make room |
| `played`, build | The loose cards it takes in are pushed together on the first of them and the card is laid on top; a raised build takes the card and then the loose cards on top of it |
| `played`, capture | **The gather**: the card lands on the first group it takes, a moment to see it, the other groups are pushed onto it in narration order (`groups`), and the heap is turned over into the capturer's pile as one rigid block (`kinematics.carryBlock`) |
| `swept` | The capturing card is held up a moment, facing you ("Clear!"), and laid crosswise in the pile once the heap is in: at the height it was laid, so later captures cover its middle and its ends still show (the Swedish tally) |
| `residue` | The last cards gathered as a capture is, item by item, into the last capturer's pile |
| `scored` | The count ritual (§8), in T4 |

**Every movement starts with a jerk and eases into place** (play-testing
asked for it of all of them; `kinematics.js`). A card tossed to the table
leaves at speed, flies a gravity parabola, touches down on its leading
edge tilted ten degrees, and slides to a stop while its trailing edge falls
flat under gravity, hinged on the edge that touched. A card or a heap
leaving the table is peeled off first, its near edge lifted on the far one
as a fingertip gets under it (`peelOff`; the heap carried to a pile, a
card turned up from a pile for the count, a face-up card collected). Cards
moving within a hand snap off and ease into their places (`easing.snap`,
where piquet's used minimum jerk). Slides start fast and stop against
friction. The tests hold each path to its profile, and every corner of
every card above the table throughout.

Your opponent's moves are staged as in shipped apps that players praise
(`DESIGN.md` §12.3): a pause before each (`think`), and after their card
lands on what it takes, a longer look before the gather (`look`), while
the cards it takes light up (the choreography's `marks`, lit by the
director on the table's clock).

**The game's end: who you were playing** (play-testing asked for it). When
the game ends, the camera pulls back over 2.6 s, past the table's near edge
just behind your seat, and the air clears: your opponent was a court card
all along, standing on the far side of the table, cel-shaded and inked like
the cards, and it says the game's last word from there: one line, no more
(the seventh play-testing: "the opponent should say 1 thing to me, no
more"), "You are quite normal." when you have lost, a gracious "Well
played." when you have won, in a balloon beside the
card, three quarters up it, by the face, its tail pointing at the card (to
its left where there is no room on its right). The figure is made as each
game begins, so it stands the moment the game ends. The table has edges (`reveal.js`
`TABLE_EDGES`), which in play are out of the frame or lost in the fog; a
test holds that to the framing at every window shape. Which court is chosen
by the game's seed, from twelve cut from a Spanish-suited pack of about 1760
(`tools/courts.py`, `CREDITS.md`). A phone held upright has its own pose,
so the figure stands in the band between the score and the controls, left
of the middle, with room beside it for its words. With
reduced motion, or at the Instant speed, the camera cuts instead of
gliding. A new game, or the last move seen again, brings the
play's eye back. `?ending` stages it, as piquet's does: a game played by a
dull script to its end, taken back to your last decision; play the last
card, and arrows then step through all 24 endings (each court winning and
losing); nothing of it is kept.

## 7. Table talk

The dialogue boxes say what Cassino players say (`DESIGN.md` §12.1): the
build calls ("Building eight." / "Building eights."), the dealer's "Last.",
"Clear!" and "Clean sweep!" for a sweep, "Cash." for an ace taking an ace,
the clinches ("That's the cards." / "Seven spades."), sometimes "You left
the five." (the *dejado* custom). Nothing is said while a hand is scored
(the sixth play-testing: "Remove the dialog balloons during scoring, and
let the pop-ups do the work"): the count's chant and the score said after
each hand are gone, and what was still being said is taken down as the
count begins (`main.js` `talk`). Whose deal it is
is said as the cut cards are seen ("Low deals. Your deal."); then, as the
first deal begins, the settings are staged as Jack London's players'
negotiation ("Do you count sweeps?"), answered by your settings either way,
once; a tied cut is only cut again ("Equal. Cut again."). The fourth
play-testing found "Your deal." said after your opponent had played: your
opponent's first move now waits for the opening's calls (`main.js`
`openingWaits`, planned on the opening's moments, `director.preview`),
which the deal does not. A capture that
takes a cassino card ("Now I have Big Cassino.") or a haul of four table cards
or more ("A good haul.") is remarked by its maker, unless a sweep or cash
speaks for it.

**The chatter** (the third play-testing asked for the talk "VERY verbose",
the conversation a part of the game, as it is in Cuarenta, played loud and
full of sayings: "you have to turn into a chatterbox", research/05). With
everything said, every move is remarked: a trail named ("A seven for the
table."; Little Cassino laid down as "a point, if you take it"), a pair or a
sum claimed ("Nine takes nine.", "That makes eight."), your own build taken
in ("Eight out.", KASA's call) or your opponent's ("I'll have your eight.",
"My build!"), a build answered with what it tells of the builder's hand
("So you have an eight."), a raise felt by the builder ("Hey, that was my
eight!"), a sweep, a Cassino or an ace felt by the other ("It's hard on
those who get swept.", 1878; "Such luck!"). The dealer announces a new hand
and each deal, "Last." is answered ("The boat's leaving!"), your opponent
thinks aloud now and then before a move ("With this one, I'll fall on
you.", Cuarenta), names Royal's values as the game begins, and, kept
waiting, says so ("Take your time."). The talk follows each build's controller
through the events (`talk.js` `followBuilds`, checked against the engine's
table at every step), and the run of play (`followPlay`; the sixth
play-testing found the talk "staccato", each line about its own move
alone): a capture of the card just trailed ("Thanks for the king."), a
build on it ("So that's what my two was for."), a build taken back by its
builder answered now and then ("As I thought."), one added to, by its
builder or by the other ("Making sure of it.", "Taking over my eight?"),
the third trail running and the capture that ends it ("Still nothing for
me.", "At last!"), and a trail onto a table swept clean, the one trail
that can truly say "Nothing to take." Each of these takes the place of a
plainer remark, so the table says no more than before; and a build is
always answered with what it tells, never an empty "Noted.".

**The run of the game, and what was said, followed up** (the seventh
play-testing: "add even more IF X then Y triggers. in addition to
textual if X then Y (i said X, then Y, so I'll follow up on X), think
about metatextual ones- you've been playing for a while with no builds,
so the opponent gently ribs you", from the period books on card play,
PG; `research/13-table-banter.md`). The talk is there to bring back how
the game was talked over, and to keep the player from quietly counting
the cards; the period manuals knew the talker who talks "for a purpose"
(1883). Your opponent ribs a long while without a build of yours (at your
tenth move without one, and again at the twenty-second: "Playing, or
only playing at playing?", Lamb), your fourth trail running ("Trumps may
turn up yet.", Grose), your third capture running ("That's a beefy run of
luck!", Hotten), a second sweep in a hand ("Never was such luck!",
Pickwick), both Cassinos to one player, and your clinch ("Counting all
your suits, are you?", Trollope); grumbles its own dry spell ("Shall I
walk three times round my chair?", Foster) and enjoys its own run ("My
usual luck!", Austen); opens the game ("A clean table, and the rigour of
the game.", Lamb); remarks on the score as each new hand is dealt (far
ahead, "Sorry. I think I've won too many.", Austen; far behind; a
comeback either way; close near the end, "Never lost till it's won!",
Crabbe; a long game), nothing being said while a hand is scored; and now
and then on its own talk ("Am I talking too much? On purpose?"). What was
said is followed up: a Cassino trailed as "a point, if you take it" and
taken ("You did say if I could take it!"), a build raised from under its
builder and taken back ("Mine again, I think."), and, kept waiting, your
move answered as your opponent makes theirs ("Worth the wait! Building
eight."). Each is chatter and takes a plainer line's place where they
meet (`talk.js` `followPlay`, `scoreSaid`). Chatter fills
the gaps and yields to the calls: the
dialogue leaves a remark out if it would make a call of a later moment
late, or come long after its own (`dialogue.js` `SLACK`, `LATE`), so a
chatty table plays at the same pace as a quiet one. Nothing said claims a
card the speaker cannot be known to hold. `tools/phrases.py` holds the bank, each
phrase in five or more wordings for the frequent moments, each with a source
letter; `docs/PHRASES.md` is generated from it. The talk is kind
(play-testing asked for it kid-friendly): nothing said belittles anyone, and
a test keeps a list of unkind words out of the bank.

**Each line at its moment** (play-testing asked that the words time up to
the cards). A line is said when its event is seen: a move as its card
lands; a deal as the dealer begins it ("Last." while dealing the last
cards); the last cards as they are gathered; "Clear!" as the sweep's card
is held up and "Cash." as the ace lands on the ace, within the capture
(the choreography's `moments`), not once the heap is in. Lines are said in
the order of their moments. The count is told by the score's popups, a
line a beat, each counted card turning up as its popup comes; a player's
next popup waits for the last (`hud.js` `popupsOf`), and nothing is said
meanwhile (it was paced by a chant until the sixth play-testing). At the
Instant speed nothing waits for the popups.
What one speaker says at one moment is said in one box (`talk.js`
`chunk`: "Low deals. My deal."), so nobody waits through a run of lines
one by one. A setting, "Table talk", chooses everything, the chatter
included; only the calls that carry the game (the house rules, the build
calls, "Last.", a sweep, cash, the game's last word); or nothing (`talk.js`
`heard`).

**Where a line is said.** By its speaker's hand: on a desktop beside it,
yours to the right of your hand (the move bar is above it), your
opponent's to the right of theirs (just beyond it the table begins). On a
phone a box never covers the cards or the move bar (the sixth
play-testing: "in mobile mode, the dialog balloons can completely obscure
the cards, so you can't play until they go away"): each speaker has
places to try, beside the hand within the table's band, below or above
it, and a box goes to the first that covers none of them, or else to the
one that covers least (`dialogue.js` `boxRect`, `covers`). Held upright,
there is no room beside your hand, and the table and the move bar are
above it: your words go below it, over the prompt, for the moment they
are said.

## 8. The overlay

Material Design 3, from piquet's shell.

- **Choosing a move**: tap a hand card, and it lifts; the table cards it
  could take or build with light up (`offer.can_add`); tap them; the
  move bar offers exactly what the selection makes (`offer.moves`:
  *Take*, *Build 8*, *Build 8s*, *Trail*). A card that cannot join says why
  on tap (`offer.why_not`). **The move bar** (play-testing: nothing to hunt
  for below the hand after each choice): Take, Build and Trail are always
  there on your turn, each lit with its move when the
  choice makes one and dimmed under its plain name when not
  (`selection.js` `moveBar`). Each has a place of its own, always there
  and always as wide, so nothing moves as a choice is made (the sixth
  play-testing: "have all possible buttons up, so the user doesn't have to
  constantly wonder if the buttons are in the right place"); two moves of a kind
  share its place, each word fitted to its half (`fitLabels`), or, where
  that would be too small to read, only the words that tell them apart
  (*4s*, *8*). They are large filled buttons, solid even when dimmed
  (play-testing: they are there for the play, no need to hide them), each
  with a faint outline (the sixth play-testing). They run Build, Take,
  Trail, left to right, the move made least to the move made most, so the
  most used is under a right thumb (the user, from a few hundred games;
  `measurements/README.md`, "How often each move is made"); "Left-handed"
  in the settings turns them the other way round. The bar lies under the
  cards (the user: "put the action buttons ... on a layer lower than the
  cards so that they do not occlude the cards"): drawn over the table, it
  has each card that crosses it on the screen cut out of it, frame by
  frame, by clip paths, drawn at once (a mask image, decoded afresh each
  frame, made the buttons flicker: the user, "when a card passes over the
  action buttons, the action buttons flicker"), shared among the bar, its
  row and its places so that no two cut from one element overlap (one
  path cuts overlapping cards out only by halves); and a tap there is the
  card's (`selection.js` `barHoles`, `holeGroups`, `clipPathFor`). The running sum's place
  before them went in the seventh play-testing ("remove the sum button to
  the left of the action buttons"). On a
  desktop the bar fills the space between the table's first row and your
  hand, clear of a card chosen from it, as tall as there is room for, 40
  to 84 px, and no wider than the window (`moveBarFit`), and stays put as
  the table fills (the rows grow away from you; the middle was moved
  further off to make room, and a chosen card stands 1.6 cm out of the
  hand, not 2.2); your own words are then said beside your hand, the tail
  pointing back at it. A phone held upright has the bar in the same place
  (play-testing: "above the cards, not below, to match the desktop
  version"), its three places sharing the screen's width, and your words
  below your hand; held sideways, its places are stacked in the controls'
  column.
- **The score HUD**, from the designer's handoff (the spec and its approved
  reference implementation are commit c484091; the reference's numbers are
  the source of truth, and `hud.js` and `style.css` port them). A dark card
  at the top left, neutral greys only, the system font, tabular numerals:
  - **a row a player** (play-testing, after the handoff: the HUD made
    wider, your opponent's row first, as they sit across the table, and
    each name said once): the name, the **segmented line** to 21 in groups
    of five with a wider finish, and the **score** at its end; a segment is
    reached (6 px), the cursor (12 px) or unreached (4 px). The lines never
    slide: scoring lights the next segments in a wave (each flares to 20 px
    at 38% of 760 ms, 70 ms apart) and dims the old cursor;
  - when a player scores, a **popup** rolls in over their row ("Big Cassino
    +2", the word left, the points larger), the number ticks up beneath
    it, and after 1.7 s the row rolls back, its line's new segments
    rippling and the score popping. The **chevron** sits at the right,
    across both rows;
  - the chevron opens the **ledger**: every hand's six lines in the
    counting order (most cards, most spades, Big Cassino, Little Cassino,
    aces, sweeps), its subtotal under them, "Hand N · live" for the hand
    under way, and the total. One level, no further toggles. It is as tall
    as its hands or as the room below the score allows, and scrolls past
    that (`hud.js` `listHeight`; the seventh play-testing: "when the hud
    gets long enough, it collides with the bottom drawer"): across the
    table it stops above the trackers' drawer at the foot of the left,
    upright above the controls with the aids' panel under it. Open, it lies
    over the table, which is not framed again for it ("The hud shouldn't
    shrink everything, it should just overlap it"), and folds at a tap
    anywhere else ("if the scoring heads up display is extended, and you
    click outside of it, it should automatically retract");
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
  go past it; the card names keep the game's spelling (Big Cassino). Not
  carried over from the spec, as it says: no 18-20 endgame zone, no marks
  under the scores. Our own aids keep to their own panel (below).
- **Trackers** (each a toggle), in a panel of the HUD's palette at the foot
  of the left, headed "Captured this hand", which folds to its heading (open
  by default; kept as left): a table with a column for each point (Cards,
  Spades, Aces, 10♦, 2♠, and Sweeps when they score) and a row for each
  player, only the value in each cell (`scorebug.js` `trackerTable`). A
  point certain to be a player's (27 cards, 7 spades, a Cassino taken) is
  filled in; one that is the other's is dimmed. Every header and cell has
  a tip: what the column counts and scores, and in the cell how far the
  player is from making a point certain. Then the cards still out
  (`state.unseen`). The sweep warning is a line
  under the prompt: before a move, when a chip's move would leave your
  opponent a table to sweep (the offer's `leaves_sweep`), and otherwise
  what would clear the table now (`state.sweep_values`).
- **Scores celebrated on the table** (play-testing asked for the HUD's
  popups on the table too): as each line of the count is scored, a disc
  with its words ("Big Cassino", "Ace", "Most cards") pops in just above the
  card it names, turned up in the count row, or its taker's pile, clear of
  it (below it where there is no room above, under the HUD), and four of
  its points ("+2", white, inked as the disc is) burst out of it like a
  firework: a jolt, then slowing, sinking a little and fading; gone in
  under two seconds. A
  sweep scored is celebrated on its card as it is held up. With reduced
  motion, the disc and its points fade in place (`scorebug.js`
  `celebrationOf`, `overlay.js` `celebrate`).
- **The count ritual**: at the end of a hand, the lines of `scored.count` one
  at a time in Foster's order: each ace and Cassino turns up out of its
  taker's pile into a row (`layout.js` lays out a counted hand; the
  choreography's `count` stage times each card to its line), the HUD's
  popups tell each line's points (the winner of each line chanted it until
  the sixth play-testing, which left the count to the popups), a line a
  beat, a player's popup holding their next line back.
- **The new game's menu** (the seventh play-testing: "it's confusing that
  you can set royal casino to be on, but it isn't happening- that's because
  it needs a new game to apply ... it's new game with x setting, all picked
  from one menu screen"): the plus at the top, New game at the game's end
  and the welcome's New game all open one screen with the game's own
  settings, Royal Cassino or Cassino (with what each means; Royal on the
  left and the default, plain Cassino the variant on the right: the user,
  "I want Royal Casino on the left and to be the default. Casino is the
  variant and on the right"), aces 1 or 14, sweeps,
  raising builds, the skill dial (1 to 4 in halves) and the match (one
  game, or a World Series: the best of seven, `series.js`); Royal's aces 1
  or 14 on by default (the user: "Aces being high or low should be
  selected by default"); Deal starts the
  game with them, Today's deal (seeded from the date) and Watch a game
  likewise, and Cancel changes nothing. The menu starts from the game on
  the table, played or finished, its rules and skill as the engine has
  them (the user: "make the new game settings, consistent with their
  previous game settings ... Do not add any sort of user tracking"), or,
  with none, from the settings kept (`prefs.js` `menuChoices`); what is
  chosen is kept as the settings (`chooseGame`), and another match begins
  its series afresh.
- **Settings**: what the game under way is (`gameSaid`) and where the next
  is chosen; the aids, Large Text, the table talk, the animation, the
  table top; copy the game record (`state.saved`).
- **Fairness**: the game's seed in the settings, shown once the game is
  over, so the same deal can be played again; and the last move seen again
  from the top bar. The replay after the game with both hands face up was
  removed in the seventh play-testing ("remove the option to replay a game
  with both hands visible").

## 9. Teaching

The tutorial pages follow the teaching ladder: pairing, summing, building,
raising, multiple builds (`DESIGN.md` §12.5), each at its first occurrence
in a real game; Royal adds its jacks, queens and kings with numbers, and
on the same page the ace's 1 or 14 (the fifth play-testing folded its own
page into Royal's). Help pages, reachable at any time, cover the rules, the
count and the table talk.

Each page is written for its moment, for a new player (the fourth
play-testing): what is about to happen, and only what is needed to play it,
in plain words. Every term is explained where it first appears ("hand" as
six deals, a build that belongs to whoever built on it last), the
interface named as it is (Take, Build, Trail), and no history that does not
help play. A test keeps a list of jargon out of the pages.

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
  end of the game. **Done**: at the end of a hand, each ace and Cassino the
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
  Said: the house rules agreed aloud and the cut as the opening deal is
  dealt (it waited for them until play-testing found the wait too long);
  the build calls (singular, plural, a raise by its
  new total: the engine's `played` event now says which); "Last."; "Clear!";
  "Cash."; the clinches; your opponent pointing out what you left; the
  residue; the count chanted line by line with the sheet (until the sixth
  play-testing left the count to the score's popups); the game's end.
  Boxes linger on the table's clock.
- **T6. Settings and aids.** Everything in §8's settings; watch mode; hints
  and explanations; undo; saved sittings across a reload. **Done**: the top
  bar (new game, hint, undo, the game log, help, settings); the settings
  dialog (`chrome.js`: the next game's rules and your opponent's skill in
  halves, New game, Today's deal, Watch a game, all in the new game's
  menu since the seventh play-testing; the engine's aids and the
  page's: trackers, cards still out, the sweep warning, undo; animation
  speed and the table top); the credits on screen; preferences and the
  sitting kept in the browser (`prefs.js`, node-tested, surviving storage
  that fails); a hint shown under the prompt with its cards lit, chosen by
  the hint button; the game log with each move's notes (the explain aid);
  a watched game that plays itself. The director now draws only when a
  card moved. The browser test turns hints on in the dialog, plays a hinted
  move, reloads, reads the credits and watches a game. **Undo removed** in
  the seventh play-testing ("remove undo"): the table takes no move back
  (the engine and the terminal keep it).
  **After play-testing**: a welcome on opening the page: Continue (with a
  game kept), New game, or Tutorial, which turned the tutorial on from its
  first page. Since the seventh play-testing ("I asked for one new game
  window and this is two ... why don't you just put tutorial mode as an
  option within the new game config?") the page opens on the new game's
  menu itself (`chrome.js` `showNewGame`, `opening`), the tutorial a
  switch in it, near its end since most players never need it (the
  user), turned on there from its first page, and Continue beside
  Deal with a game kept; the settings no longer have the tutorial's
  switch. With no game kept, the table is held at the pack behind it, as a
  tutorial page holds it, so nothing is dealt or said until the choice. A
  link that names a game (`?seed`, `?watch`) goes straight to it. On a
  desktop, Explanations and Hints are toggled at the foot of the controls,
  under your hand (an MD3 segmented button set, both may be on; the lesser
  aid on the left, since the sixth play-testing); turning the explanations
  on opens the game log, where they are told. A phone keeps them in the
  settings.
- **T7. Teaching.** Tutorial and help pages. **Done**: nine pages in
  `web3d/tutorial.md` (the introduction; pairing, summing, building,
  raising, multiple builds; the court cards count, with the ace's 1 or 14;
  the count; what is said at the table), each opening by itself at its first
  moment in a real game with the table held still (`tutorial.js`:
  `pageDue`, from the moves on offer and what your opponent has just done;
  node-tested against real games, every page reached), and all of them at
  any time from the question mark. The tutorial is on for a new player and
  a switch in the new game's menu (in the settings until the seventh
  play-testing); a page read already does not come again. The
  browser test reads the introduction, meets a page of the ladder in play,
  and pages through the help.
- **T8. Phones.** Piquet's phone framing and Large Text faces, fitted to a
  middle that grows. **Done**: cassino's own stacked arrangement
  (`units.js` `ZONES_PORTRAIT`; since the eye was raised, the middle five
  wide, so ten items lie in two rows, your opponent's hand beyond them with
  its pile and stock beside it, your hand a row just off the table, nearer
  you than its first row, with yours beside it, and room for the move bar
  between); the layout and
  choreography take their zones from the view; a staging test measures the
  portrait camera's reach over whole games and holds `CAMERA_PORTRAIT.reach`
  to it; the page measures the overlay's strips (upright: under the HUD as
  it is folded, above the controls and the bar of icons at the foot; the
  aids' panel folded into the HUD, open while its hand-by-hand scores are,
  both then lying over the table, the HUD a little shorter, the foot kept
  for the prompt's one line and the note, since the sixth play-testing
  found the table's cards too small in the window a browser leaves on an
  iPhone; the controls a fixed height, a line more while an aid that
  speaks under the prompt is on, so that nothing said there frames the
  table afresh: the seventh play-testing found the camera "often slightly
  moving when I'm selecting cards" on an iPad, the prompt emptied while a
  chosen card rose;
  sideways: between the HUD's column and the controls') and frames the table
  between them, laying the cards out afresh when the phone turns. The Large
  Text faces (automatic on a phone or a tablet, or chosen in the settings)
  have their index fitted to the 2.9 units of each card cassino's hand of
  four shows, which the faces test measures, at the top left only (a card
  on the screen is never read upside down); and in the room right of that
  strip, clear of the index across the card, for the table, where all of a
  card shows, the rank over the suit again, as large as the room holds,
  about twice the index, a 10 narrowed to the room (the sixth
  play-testing: on an iPhone the table's cards were "still too small to
  read"; and then "put it in that 3/4, so that it does not overlap on the
  X axis with the top left card value"). The browser test plays by tapping on a phone held either way.
- **T9. Traditional objects.** The pegboard, the sweep tally, the stock as a
  clock, polished. **Done**: the scoring board (`pegboard.js`): a wooden
  board of 21 holes a player in fives, a start hole and two pegs each, at
  the table's edge at your left (not on a phone; a switch in the settings).
  The pegs stand where `pegsOf` says, a pure function of the hands' ends:
  the front peg at the total, the back where the front stood before the
  last hand; at the end of each count the back peg is lifted over the
  front and dropped in its new hole, so the gap is always the last hand's
  points. The sweep tally (the sweep cards crosswise, where later captures
  cover them) and the stock's thickness as the hand's clock came with T3.
  **The board removed** after the first play-testing: with the score HUD on
  screen (its segmented lines to 21 and the per-hand ledger) the board said
  the same thing again, and took a corner of the table.

## 11. Testing

- **Node tests** (`web3d/test/*.test.js`, run by `bin/gate`) of the pure
  modules and, against the real engine module, of whole games: the layout
  (faces only where known), the choreography (every timeline of real games
  lands on its layout, faces as they should be, no leak, no card through
  the table, in both arrangements; the reducer held to the engine's own
  states), the HUD (its model and, on a stand-in DOM, its widget), the
  talk and the phrase bank, the tutorial's moments, the staging test of
  the phone camera's reach, the series, the preferences, and
  the piquet modules brought across. `bin/gate` builds the engine module
  first, so nothing skips, and checks that the committed page is built
  from the sources.
- **The offline browser test** (`test/browser.py`, Playwright with the
  system Chromium; about fifteen minutes): it blocks every network request
  and plays a whole game by clicking, checking at every rest that no face
  is shown that the person could not know, the HUD at every hand's end, the
  talk, the count; then no replay offered, a World Series game counted, the last
  move seen again; the settings (hints, no undo, the log, the keyboard path, a
  reload that brings the sitting back, the credits); watched games; the
  tutorial; a phone held either way, a tablet held upright and a tall
  window, each played by tapping. It saves screenshots and strips of the
  motion to read back by eye. Headless Chromium on SwiftShader needs
  software compositing for CSS animations to run (`--disable-gpu-compositing`).
