# The table protocol

How a client plays Cassino against the engine. The 3D table will be one such
client; the terminal is another. Anything that replaces them talks to the
engine in exactly this way and needs no game logic of its own.

The engine side is `cassino_core::session` (a sitting, advanced one human
decision at a time) and `crates/cassino-wasm` (the same thing as JSON and
one-line commands). A native Rust client can use `Session` directly and skip
the JSON; the shapes are the same.

## The loop

```
new(game, aces14, sweeps, raising, skill, seed)  -> state
loop:
    read state.prompt          -- "play", "next_hand" or "over"
    draw state                 -- hand, table, piles, scores, events
    (while choosing: offer(selection) -> offer)
    send(command)              -> accepted? ; state again
```

The engine runs the opponent between the person's decisions, so after any
accepted command the state is already at the person's next decision. Nothing
happens while the client waits.

**A seed fixes a game.** The same settings and seed always deal the same
cards, and the opponent's decisions are pure functions of what it sees, so
the same record of commands always replays into the same game.

## Commands

| Command | When | Meaning |
|---|---|---|
| `trail 7H` | `prompt == "play"` | Trail a card |
| `take 8S 8D 6C 2D` | `prompt == "play"` | Capture: the played card, then every card taken (a build is named by all its cards) |
| `take AC=14 KS AH` | `prompt == "play"` | An ace capturing as 14 (Royal, with the setting) |
| `build 8 3D 5C` | `prompt == "play"` | A new build: value, played card, loose cards |
| `build 9 2S on 3C 9D` | `prompt == "play"` | Onto the build containing 3C, absorbing 9D |
| `next` | `prompt == "next_hand"` | Deal the next hand, once the count has been seen |
| `undo` | `can_undo` | Take back the last decision, with the opponent's replies and anything the table did for the person after it; refused (`deal_seen`) once a deal has come since it, whose cards the person has seen. A known limit: undoing a move the person made after a hint or a reveal lets them remember a card that was shown and taken back |
| `set <aid> on` / `off` | any time | `hints`, `explain`, `play_forced` |
| `hint` | `prompt == "play"` | Record that the hint was shown; no change to the game. The decision pending then counts as assisted (the tutor does not take it as evidence). The `hint` query sends it itself when it answers |
| `nudged <skill>` | `prompt == "play"` | Record that the tutor's nudge for that skill (its slug: `pairs`, `sums`, `building`, `safe-builds`, `answering-builds`, `sweeps`, `valuables`, `trailing`) was shown; the decision pending counts as assisted |
| `warned` | `prompt == "play"` | Record that a warning about the move (the page's sweep warning) was shown. Like `hint`: once a decision, the decision pending counts as assisted, and a position at which one was shown stays assisted across `undo`. The page sends it when it shows a sweep warning |

A refused command leaves the game as it was, and `state.error` says why in a
sentence a person can read ("To build 9 you must hold another card that can
take 9.").

Cards are a rank (`A 2 3 4 5 6 7 8 9 T J Q K`) and a suit (`S H D C`): `TD`
is the ten of diamonds. `10D` and lower case are accepted too.

**Aids** change what the person is told or asked, never what happens:

- `hints`: the `hint` query answers.
- `explain`: every played event carries notes, and a poor move of the
  person's is followed by a verdict event.
- `play_forced`: a move is made for the person when it is the only one. It is
  recorded with a `*`.

## The selection interface

A person never scrolls a list of moves. The client sends the **offer** query
with the hand card picked and the table cards tapped:

```
offer("3H AC 2D")  ->  {
  "card": {...3H}, "picked": [...AC, 2D], "sum": 6,
  "moves": [
    {"move": "take 3H 2D AC",    "chip": {"kind": "take",  "label": "Take"},     "said": "take 2♦ A♣ with 3♥"},
    {"move": "build 6 3H 2D AC", "chip": {"kind": "build", "label": "Build 6"},  "said": "build six: 3♥ on 2♦ A♣", "call": "Building six."},
    {"move": "build 3 3H 2D AC", "chip": {"kind": "build", "label": "Build 3s"}, "said": "build threes: ...", "call": "Building threes."}
  ],
  "can_add": [], "why_not": [{"card": {...}, "reason": "Those cards don't make groups of 3."}]
}
```

- `moves`: every move the selection makes exactly. The client shows them as
  chips and sends the chosen one's `move`. It never guesses between capturing
  and building. Each also has `leaves_sweep`: `null`, or
  `{values, unseen}` when the move would leave a table your opponent could
  sweep, with the capture values that would clear it and how many such
  cards you cannot see (the sweep warning, before the move is made).
- `can_add`: table cards that could still join the selection on the way to
  some move. Light them up.
- `why_not`: for every other table item, named by one of its cards, why it
  cannot join. This is the "why not?" aid.
- `sum`: the running total of the hand card and the selection. This is the
  arithmetic aid.
- Tapping one card of a build selects the whole build.

The state also lists `moves`, every move offered to the person, for clients
that want a list and for tests.

## The state

Every field comes from the person's view (South's, when watching), so a
client cannot show more than the person at the table could know.

| Field | Meaning |
|---|---|
| `protocol` | This document's version (1) |
| `seed`, `rules` (`game`: `classic`/`royal`, `aces14`, `sweeps`, `raising`), `skill` | The sitting's settings |
| `watching` | Two computer players: advance with `step` |
| `prompt` | `play`, `next_hand` or `over` |
| `hand` | Your cards, by rank then suit: `{card, label, rank, suit}` |
| `moves` | The moves offered to you, in the command form |
| `opponent_holds`, `undealt`, `deal` (1–6), `hand_number`, `dealer`, `to_move` | Where the hand stands; `dealer` and `to_move` are `you` or `them` |
| `table` | The items on the table in arrival order: `{id, cards, build}`; `build` is `null` for a loose card, else `{value, multiple, controller, call}` |
| `table_cards` | How many cards are on the table |
| `piles` | `{you, them}`: `{cards, spades, aces, big_casino, little_casino, sweeps}` |
| `last_capturer` | Who takes the residue, so far |
| `scores`, `target` | The game's totals before this hand, and 21 |
| `events` | Everything that has happened, in order (see below) |
| `can_undo`, `aids`, `error` | |
| `error_code` | Why the last command was refused, as a code: an `Illegal` reason (`not_holding`, `does_not_split`, …) or `not_a_move`, `game_over`, `hand_over`, `hand_not_over`, `not_your_turn` (a `hint` or `nudged` with no decision pending), `nothing_to_undo`, `deal_seen`, `bad_setting`, `bad_nudge` (`nudged` without a known skill slug), `watching` |
| `saved`, `record_version` | The sitting as text, to keep across a reload (see "Saving and restoring") |
| `unseen` | The counting aid: `{aces, big_casino, little_casino, spades, cards}` that you cannot see |
| `sweep_values` | The values a single card could sweep the table with |
| `record` | The commands taken from your seat, `*` for forced moves |

**Table items** keep their `id` while they lie on the table. A build's cards
are in the order they were laid, the last on top. A new build takes the place
of the first loose card it was made from, and a trailed card goes to the end.
A freshly dealt table's items lie in the order the `dealt` event lists its
cards: by rank, then suit. A client animates by id: an id that disappears was
captured (or absorbed into a build), and a new id arrived. With these rules a
client can replay the events between two states into the tables between them
(the 3D table's choreography does, and its tests hold it to the engine's).

### Events

Each event has `kind`, `hand`, `text` (one sentence ready to show) and
`notes` (sentences, with the explain aid). Kinds and their fields:

| `kind` | Fields |
|---|---|
| `cut` | `yours`, `theirs`: the cards shown in the cut for the deal |
| `first_dealer` | `you` |
| `dealt` | `deal`, `last` (the sixth deal, "Last."), `you_deal`, `yours` (the cards you were dealt), `table` (the layout, on the first deal) |
| `played` | `you`, `move`, `card`, `type` (`trail`/`take`/`build`), `value`, `taken`, `onto`, `loose`, `groups` (a capture's groups in narration order: pairs, builds, sums), `call` ("Building eight."), `build_kind` (`new`/`raise`/`add`, `null` unless a build), `raised_from` (a raise's old value), `multiple` (the build is now multiple), `left` (the cards the card played could also have taken: "You left the five.") |
| `swept`, `cash` | `you` |
| `clinched` | `you`, `what`: `cards` (27) or `spades` (7) |
| `residue` | `you` (`null`: nobody captured), `cards` |
| `scored` | `count`: `{lines: [{item, suit, who, points}], tallies, total}`, in Foster's count order |
| `hand_ends` | `yours`, `theirs`, `totals` |
| `game_ends` | `you_won`, `totals` |
| `verdict` | `quality` (`dubious`/`blunder`), `better` (a move), `loss` (points) |

## Saving and restoring

`state.saved` is the whole sitting as text: a header (the record's version,
the seed, the rules, the skill, the aids), then one command a line, `*` for
a move the table made for the person:

```
cassino record v1
seed 21
rules royal aces14=1 sweeps=1
skill 3
aids hints=0 explain=1 play_forced=0
take 8S 8D
next
*trail 7H
```

With "Raise builds" off the rules line ends `raise=0`; on, the default, it says
nothing of it, so records kept before the setting restore as they were.

A page keeps it and hands it to `cassino_restore` on reload. Restoring
replays the commands with the aids on, so the notes come back. It is refused
if the record was made by another version of the engine's play (the first
line), if a command no longer fits, or if a move marked `*` was not the only
one. A build's target is always recorded by its lowest card.

## The hint

The `hint` query answers `null` unless hints are on and it is your turn.
Otherwise it gives `{move, advice, value, notes}`: the top rung's move in
your place, in words ("take 10♦ with 10♣"), its value in points, and the
notes on it. It is computed from your view only. The advisor is seeded by the
position, so asking twice gives the same answer, and asking changes nothing
in the game. An answer is recorded as a `hint` command (see Commands), so a
saved game knows which decisions were helped; records from before it replay
as they did.

## The review

The review at the game's end is the brief (see "The tutor" below and
`docs/DESIGN.md` §12.8): a few bullets and a method, gentle and about
habits, never a single move. There is no other review query; the longer prose
review it replaced is gone.

## The tutor

Four queries and a command let a client carry the tutor from game to game
(`docs/DESIGN.md` §12.8). The client stores, per finished game, the record
(`state.saved`) and the game's **summary**, the text of what the game showed
of each skill (`learner::Summary`, versioned: `cassino evidence v<n>`, then a
line a skill). The engine holds the words and the judgement; the client holds
only the text. Where a query takes summaries it takes them oldest first with a
line of `--` between; an entry that is missing or no summary counts as stale.

- **`evidence`**: once the game is over (`null` before, and when watching),
  `{summary}` for this game. The advisor runs over every decision: about
  0.5 s in the module (0.8 s native), so a client asks for it after the
  ending has settled, not during it.
- **`evidence_of(record)`**: the same for a stored record (a finished game's
  saved text), the sitting left alone; `{summary}` or `{error}`. For the
  summaries `learner` lists as stale (made by another evidence version).
  The record is restored with the explanations off, which the evidence has
  no use for and which would cost an advisor run a move.
- **`learner(history)`**: `{games, focus, mastered, stale}`: the number of
  current summaries, the skill to work on next (a slug or `null`), the
  slugs mastered, the indexes to recompute with `evidence_of`, and
  `version`, the evidence version this engine makes. A summary of a
  *newer* version is listed as stale too (this engine cannot read it), but a
  client should not recompute it back: another tab with a newer page made it.
- **`brief(game, history)`**: `{bullets: [{lead, text}], method}`, one to
  three bullets and the sentences that say how they were worked out
  (`null` before the game is over). The input is this game's summary (empty
  to have it worked out here), a `--` line, then the earlier games'
  summaries (empty with no stored games: the brief then rests on this game).
  The review it rests on shares one advisor pass over the game with the
  evidence, kept in the sitting: with `evidence` asked first, the brief
  costs nothing more; asked alone, about the cost of `evidence`.
- **`brief_of_record(record, history)`**: `{bullets, method, summary}` for a
  stored record of a finished game, with no sitting needed (`null` if the
  record does not restore or was not finished): the record is restored
  quietly, and the game's evidence, the review and the brief come from one
  advisor pass. The input is the record, a line `==`, then the history as for
  `brief`. For a client that works out the tutor off its main thread, in a
  worker with an instance of its own: `evidence_of`, `learner` and this are
  stateless.
- **`set_focus(slug)`**: tells the sitting which skill to work on (empty for
  none; 1 if it was a skill). Not in the record: say it again after a
  restore. With a focus set, the person's decisions at it may be nudged.
- **`nudge`**: `{skill, words}` for the current decision, or `null`: a
  focus is set, it is the person's turn, a clear chance at the focus is on
  the table, and no nudge has been shown this game nor a hint at this
  decision. The words are the engine's (`tutor::nudge_words`). The answer
  is kept for the decision, so asking again is free; the first ask costs
  one advisor run (3 ms on average, 50 ms at most in Node). Showing the
  nudge is the recorded command `nudged <skill>`; until then it is still on
  offer.

## The replay

Once the game is over, and never before, the `reveal` query gives what was
dealt to whom in every hand: `{hands: [{hand, dealer, deals: [{you, them,
table}]}]}`, six deals a hand, `table` only in the first. With the events
it lets a client replay the game with both hands face up, so a person can
check that the computer played fair (DESIGN.md §12.3).

## Watching

`watch(game, aces14, sweeps, raising, south_skill, north_skill, seed)` seats two
computer players. `step` makes the next move, one move whoever's it is, or
deals the next hand. The narration names the seats South and North. Every command but `set` is
refused (`watching`); `set` changes the aid but plays nothing.
The `sweep` warning of an offered move (`leaves_sweep`) carries its own
words, which promise no point when sweeps are off.

## WebAssembly

The module exports, with no `wasm-bindgen`:

| Export | |
|---|---|
| `cassino_new(game, aces14, sweeps, raising, skill_milli, seed)` | A new sitting; game 0 Classic, 1 Royal; the settings 0 or 1; skill in thousandths (1000–4000) |
| `cassino_watch(game, aces14, sweeps, raising, south_milli, north_milli, seed)` | A watched game |
| `cassino_alloc(len) -> ptr` | A buffer to write a command or selection into |
| `cassino_send(len) -> 0/1` | Carry out the command just written; renders the state |
| `cassino_step() -> 0/1` | One step of a watched game; renders the state |
| `cassino_offer(len)` | Renders the offer for the selection just written |
| `cassino_hint()` | Renders the hint |
| `cassino_evidence()` | Renders this game's summary once it is over (`null` before; see "The tutor") |
| `cassino_evidence_of(len)` | Renders the summary of the stored record just written |
| `cassino_learner(len)` | Renders the learner over the summaries just written |
| `cassino_brief(len)` | Renders the brief; the input is this game's summary, `--`, the history |
| `cassino_brief_of_record(len)` | Renders the brief of the stored record just written, `==`, the history (see "The tutor") |
| `cassino_set_focus(len) -> 0/1` | Sets the tutor's focus from the slug just written (empty: none) |
| `cassino_nudge()` | Renders the nudge for the current decision (`null` for none) |
| `cassino_reveal()` | Renders every hand's deals once the game is over (`null` before; see "The replay") |
| `cassino_restore(len) -> 0/1` | Restores the sitting from the saved text just written; on refusal the old sitting stays and the rendered JSON is `{"error": ...}` |
| `cassino_render()` | Renders the state again |
| `cassino_out() -> ptr`, `cassino_out_len() -> len` | The last rendered JSON |

`crates/cassino-wasm/tests/smoke.mjs` plays whole games through the module in
Node, exactly as a page would. It first replays the golden games of
`crates/cassino-wasm/tests/golden.txt`: scripted games whose final state must
hash exactly as the native build's does (`cargo test` checks the native
side). Every build of the engine therefore plays alike, byte for byte. A
change that alters play fails both checks: bump `session::RECORD_VERSION` and
regenerate the file (`cargo test -p cassino-wasm print_golden -- --ignored
--nocapture`). The module is about 330 KB. The top level of
opponent averages 10–16 ms a command in Node, with the slowest under 100 ms.
