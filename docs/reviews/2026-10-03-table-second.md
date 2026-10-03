# Second review of the 3D table, 2026-10-03

A second code review of the table, by a separate agent, covering what changed
after the first review (`docs/reviews/2026-10-03-table.md`, at 6559cd4): the
fixes for T1–T20 and Q1–Q5, the replay after the game with both hands face
up, "see the last move again", the best-of-seven series, the seed in the
settings, the sweep warning, the director's timed entries with kinds and
the new `skip()`, the HUD's ledger kept per hand, the keyboard path, the
engine's `reveal` and `deal_seen`, and the gate's stale-page check. The
reviewed range is `git diff 6559cd4..89a8368` over `web3d/src`, `web3d/test`,
`crates`, `bin` and `web3d/build.py` (HEAD later moved to 2f68258, a change
to the docs only). No source file was changed.

**Method.** Every changed module and test was read. Each finding below was
checked against the code. Most were reproduced, either in Node against the
real engine (`target/wasm32-unknown-unknown/release/cassino_wasm.wasm`,
built from these sources) or in headless Chromium on the built page
(`web3d/cassino3d.html`). For the Chromium runs, a sitting was put into
`cassino.sitting` and the page reloaded so that it restored that sitting,
then driven by clicks, sometimes on the hand-driven clock (`?manual`). Each
reproduction is described with its finding so it can be rerun. The Node
suite passes (163 tests, none skipped). The full browser test was not
rerun.

## Summary

| ID | Severity | Finding |
|---|---|---|
| S1 | major | "See the last move again" pressed while the HUD's popups are still playing freezes the score HUD for the rest of the game |
| S2 | major | The replay steps forward with the end-of-game aids, so if "Play forced moves" was changed during the game the replay leaves the record. Turned on and then off, it freezes at the first forced move |
| S3 | major | During the replay, Undo, the aid switches and "Copy game record" act on the replay's position. Undo makes the replay play a game that never happened |
| S4 | minor (design) | The seed shown during the game, together with the replay, lets the person read their opponent's hand and every coming deal before the game is over |
| S5 | minor | After leaving the replay part-way, "See the last move again" plays a step of the replay and leaves a mid-game table under "game over" |
| S6 | minor | The keyboard handler swallows Enter and Space on the replay bar's buttons, so the replay cannot be driven from the keyboard |
| S7 | minor | With Play on, Next pressed while cards move steps twice: `skip()` runs the pending auto-step and the talk it schedules |
| S8 | minor | The series counts a game once per seed: a second game on the same seed (today's deal again, every game on a `?seed=` page) is never counted, and seeded links write to the saved series |
| S9 | minor | The gate's stale-page check compares the working tree, not what is committed. Without `web3d/node_modules` the gate skips the Node tests and the page check, and still says "ok" |
| S10 | nit | The sweep line names a lone court by its number: "A 12 would clear the table." |
| S11 | nit | `Hand::deck()` is public, unused, and returns the undealt deck |

## Findings

### S1. "Again" freezes the HUD (major)

`web3d/src/main.js:235-240` (`again`), `web3d/src/director.js:246-248`
(`restart` empties the queue), `web3d/src/hud.js:291-297` (`busyUntil` is
cleared only by a timed callback).

`again` calls `director.restart(lastMove.before)`, and `restart` runs
`queue.length = 0`. The button is disabled only while cards move. The HUD's
popups, the hand's end (`hud.endHand`, `board.peg`), the talk and the
speech boxes' take-downs all run on that queue and often outlast the cards.
A side's popup takes 1.96 s, and a count's popups for one side run several
seconds past the rest. If the queue is emptied while a popup is under way,
`busyUntil[side]` stays `true` forever. Every later score event for that
side then goes into the HUD's own queue and is never played, and nothing
but a `hud.reset` (undo, new game, reload, replay) recovers. Unlike undo,
`again` does not call `scoreShown()`.

**Reproduced** (Chromium, seed 1, a sitting one move before hand 1 ends, in
which the opponent takes six lines of the count):

| Run | HUD at the cards' rest | Game at the cards' rest | After hand 2: HUD shown / totals | After hand 2: game | `hud().idle` |
|---|---|---|---|---|---|
| Instant, again pressed at rest | 1–3 | 2–9 | 1–3 / 2–4 | 7–15 | false |
| Instant, control (no press) | 1–3 | 2–9 | 7–15 / 7–15 | 7–15 | true |

At Natural speed the totals had caught up when the button was pressed, but
`hands` stayed 0 and `idle` stayed false: hand 1 never closed in the ledger,
the pegboard was not pegged, and the opponent's later scores would queue
forever. Speech boxes whose take-down was queued also stay up until that
speaker says something else.

**Scenario.** The opponent sweeps, or a hand ends. The person presses the
turning arrow at once to see the capture again. From then on, the HUD shows
a stale score for the rest of the game.

**Fix.** Add a director call that lays out `before` and animates to `after`
without touching the queue (`settle(before)` then `animate`), and use it in
place of `restart`. At least, call `scoreShown()` after the replay of the
move, or keep the button disabled until `hud.idle()`. A browser check:
press again during a count's popups, then compare `hud()` with the scores at
the next hand's end.

### S2. The replay leaves the record when play_forced changed mid-game (major)

`web3d/src/main.js:412-416` (forward: the decisions are sent, and the engine
is trusted to make the forced moves), `web3d/src/replay.js:56-60`
(`commandsBetween` drops `*` lines), `crates/cassino-core/src/session.rs:470-497`
(a restore replays with `play_forced` off, then sets the header's aids).

`set` commands are not recorded. The record's `aids` header holds the aids
as they stood at the end of the game. Forward stepping restores prefix 0,
which leaves the session with the end-of-game `play_forced`, then sends only
the person's decisions and relies on the engine to make the `*` moves
itself. That holds only if `play_forced` never changed during the game.
Back is driven by `restore(prefix)` instead, which replays the `*` lines
exactly, so forward and back disagree.

**Reproduced** (Node, the page's calls: `restore(prefix(record, 0))`, then
`commandsBetween` sent for each stop, compared at each stop with
`restore(prefix(record, at[k]))`). Classic, skill 2, the aid toggled at the
person's 30th decision:

| Case | Seeds | First wrong stop | Commands refused | Ends at the record's end? |
|---|---|---|---|---|
| Off, then on | 4 of 4 | stop 2–7 | 4–9 (dead steps) | yes, and stops shift: one step shows two decisions |
| On, then off | 4 of 4 | stop 2–7 of 44–71 | 41–67 | no |

In the "on, then off" case the replay freezes at its first forced move.
Every later Next is refused, but the counter runs on to "Move 71 of 71" with
the table still at step 7. Control: with the aid unchanged all game, 0 of 60
games diverged. The Node test of forward stepping
(`web3d/test/replay.test.js:44`) only covers `play_forced` on throughout.

**Fix.** Step forward by `restore(prefix(record, at[k]))`, as Back does. Or,
after the restore, send `set play_forced off` and send every command between
two stops with its `*` stripped, which plays the forced moves as ordinary
moves at the same positions. Also check `send(...).ok` and stop on a refusal
rather than advancing `replay.k`. Add the two toggled cases to the test.

### S3. The replay's position is reachable from other controls (major)

`web3d/src/chrome.js:294-295` (Undo shown and enabled from `prefs.undo` and
`state.can_undo` alone), `web3d/src/main.js:214-227` (undo), `181-192`
(aids), `205-213` (copy). None of these checks `replay`.

During the replay the engine session is the replay's restored sitting,
which has a snapshot for every forward step, so `can_undo` is true:

- **Undo** takes back a decision in the replayed sitting, but `replay.k`
  stays where it was. The next Next sends the following decision at the
  wrong position. Most of the time the card is still in hand and the engine
  accepts the move, so the opponent replies to a position that never
  occurred. Reproduced in Chromium (seed 77, undo on): after Next, Next and
  Undo, the events went from 7 to 5 while the counter stayed at "Move 2".
  In Node, over 20 games of Next, Next, Undo and Next: the command was
  accepted at the wrong position 18 times and refused 2 times, and in all
  20 the position shown differed from the record's.
- **Play forced moves** turned on during the replay makes a forced move in
  the replayed sitting (`advance(sent)`), with the same effect.
- **Copy game record** copies `state.saved` of the replay's prefix, a
  truncated game.
- With hints on, the hint button is shown and enabled but does nothing,
  because `hint` is null in the replay.

**Scenario.** The person has Undo on and replays a loss to check that the
computer played fair. They press the undo arrow, expecting it to step back.
From there the replay plays out a fabricated game with both hands face up.

**Fix.** While `replay` is set, hide or disable undo, hint and "again"
(`chrome.sync` could take a `replaying` flag); copy `replay.record`; and do
not send aids to the engine (save the preference only). Or make undo mean
Back during the replay.

### S4. The seed in the settings reveals the opponent's hand mid-game (minor, design)

`web3d/src/chrome.js:287-289` (the seed and "Add ?seed=N … to deal it
again", shown whenever there is a state), `docs/DESIGN.md` §12.3 ("Every
game shows its seed").

The deals do not depend on play (`game.rs`: "the same seed gives the same
cards … however the players think"). With the seed in hand, a second tab at
`?seed=N`, played out any way and then replayed with both hands, shows the
opponent's cards for every deal of every hand that game reached. It also
shows the person's own coming deals, and in a played tab that alone
determines the opponent's 24 cards for the hand. **Reproduced** in Node with
two engine instances standing in for two tabs, mid-way through hand 1, over
seeds 100–119: the opponent's hidden hand was read exactly in 20 of 20
games (seed 100: 8♠ 8♥ J♠). "Copy game record" also carries the seed. That
was true before, but the replay turns reading the seed into reading the
cards.

**Fix (a decision for the user).** Show the seed, and offer the record,
once the game is over. Fairness is still checkable, since the person can
deal the seed again afterwards and compare. Or show a commitment during the
game (a hash of the seed) and the seed after it.

### S5. "Again" after leaving the replay shows a replay step (minor)

`web3d/src/main.js:309` (`advance` sets `lastMove`, including for each
replay step), `360-371` (`settleOn`, used by start, back and leave, does not
clear it), `567` (`canAgain` is `Boolean(lastMove) && !replay`).

After a replay left part-way, `lastMove` is the last replay step taken.
"Again" is enabled at game over and animates that step, which leaves the
director resting on a mid-game state while the page's `state` is the
finished game. **Reproduced** in Chromium (seed 77): Replay, Next three
times, Leave, then Again. The table rested on hand 1's position (10♣ in
your hand, three table cards, one card in your opponent's hand) under "Your
opponent wins the game, 22 to 8." with New game and Replay showing.

**Fix.** Clear `lastMove` in `settleOn`, or when entering and leaving the
replay.

### S6. The replay bar does not work from the keyboard (minor)

`web3d/src/main.js:651-676`. The exclusion list at `656` names
`md-assist-chip, md-filled-button, md-icon-button, button`, but not
`md-text-button` or `md-outlined-button`; `preventDefault()` is at `658`.

Most replay stops are the person's turn (`state.prompt === "play"`). Enter
or Space on a focused replay button (Back, Next, Play, Leave) is taken by
the table's handler, which prevents the button's activation and then does
nothing, because `tapped` returns in the replay. **Reproduced** in Chromium:
with focus on Next at a "play" stop, Enter left `k` at 1. With the page's
handler kept from seeing the key (a capturing listener that stops
propagation), the same Enter stepped to 2. The arrow keys also move the
hidden card focus during the replay.

**Fix.** Return when the target is inside any button-like control
(`md-text-button, md-outlined-button, md-filled-tonal-button, [role=button]`)
or inside the controls section, and while `replay` is set.

### S7. Next during auto-play steps twice (minor)

`web3d/src/main.js:372-384, 411`; `web3d/src/director.js:306-320`.

With Play on, the next step is queued 900 ms after each rest as a "hard"
entry. If the person presses Next in that window, a step runs and the cards
move. A second Next while they move calls `skip()`, which runs every
non-linger entry, including the queued auto-step. That step runs
`replayDo("next")`, and then the press itself steps again. The loop also
runs, at once, the talk entries scheduled during the skip, contrary to "a
line not yet said is dropped". **Reproduced** on the manual clock (seed 77):
with Play on and k = 0, Next at rest went to k = 1, and Next while moving
went to k = 3.

**Fix.** Give the auto-step its own kind that `skip()` drops (and reschedule
it at the rest), or cancel it when Next or Back is pressed. In `skip()`,
drop talk entries scheduled during the loop as well.

### S8. Series counted by seed (minor)

`web3d/src/series.js:79-88`, `web3d/src/main.js:62, 325-330`.

`recordGame` ignores a game whose seed is already in `counted`. The seed
does not identify a game:

- On a `?seed=N` page every new game deals seed N (`randomSeed`), so a
  series played there never moves past its first game.
- "Today's deal" played twice in a series counts once.
- `saveSeries` is not guarded the way `persist` is for seeded links (T16),
  so a test or shared link writes into the person's saved series.

There is no double count: the dedupe also stops undo past the end from
re-counting a game.

**Fix.** Mark the game counted on the page (a flag reset by `newGame`), or
key on something per game, such as a start counter kept with the sitting.
Do not save the series from a seeded link.

### S9. The gate's page check and the silent skip (minor)

`web3d/build.py:149-153`, `bin/gate:26, 38-44`.

`--check` compares the build with the working tree's
`web3d/cassino3d.html`, but a commit takes the index. A typical slip still
passes: edit a source, rebuild, `git add` only the source, then
`bin/gate && git commit`. The committed page is then stale. Separately, the
whole Node block, now including the module build and the page check, runs
only `if [ -d web3d/node_modules ]`. In a fresh clone the gate prints "gate:
ok" without the Node tests or the page check. The first review's Q2 asked
the gate to fail rather than skip.

**Fix.** Also fail when the page differs from its staged copy
(`git diff --quiet -- web3d/cassino3d.html`) or when there are unstaged
changes under `web3d/src`. Fail, or print loudly, when `node_modules` is
missing.

### S10. Courts named by number in the sweep line (nit)

`web3d/src/selection.js:104-107`, with `advice::sweep_values`, which gives a
lone court's rank. A Classic table holding only Q♣ (seed 4) reads "A 12
would clear the table." Royal reads the same for a lone Q♥ (seed 1), and
the warning before a move uses the same words. Say "a jack", "a queen" and
"a king" for 11–13.

### S11. `Hand::deck()` (nit)

`crates/cassino-core/src/hand.rs:216-219`. It is public, used nowhere, and
returns the shuffled deck with the undealt cards. Nothing leaks today, but
it invites a client feature that would. Remove it, or make it `pub(crate)`.

## The first review's fixes, checked

Each fix was read against its finding. All hold, apart from the
interactions below.

- **T1–T3.** The overlay follows the framing's rule, the watch flag is reset
  by `newGame`, and the log listens for `change`.
- **T4 (the kinds and `skip()`).** Talk is dropped and boxes linger. Two
  gaps remain: entries scheduled during the skip loop, talk included, run at
  once (S7), and `restart`, used by "again", still empties everything,
  including the lingers (S1).
- **T5–T20.** Sound, including the refused builds, the token on each rest,
  the gate guard, the pegboard rule, the hint during motion, the hint cache,
  the aids while watching and on restore, the URL overrides, the speech box
  anchor and the opening's words. The engine's `deal_seen` also refuses
  undo of Next hand and across forced moves.
- **Q1–Q5.** Fixed as the triage table says. The gate's remaining skip is
  S9. The forward-replay test covers only `play_forced` on throughout (S2).
  No test exercises "again" while the HUD is busy (S1), or controls used
  during the replay (S3, S6).

## Checked and found sound

- **The engine reveals nothing before the end.** `Session::deals` requires
  the prompt `over` and `Game::deals` a winner. The page calls `reveal()`
  only after checking `state.prompt === "over"` and not watching, and
  `view.revealed` exists only while `replay` is set. Over a game's replayed
  steps, the opponent's face-up cards always numbered `opponent_holds` and
  never included a card in sight (the existing test). `deals_of` agrees
  with the dealt events.
- **Persistence.** A replay step is never saved (`persist` returns while
  `replay` is set). A game over saves no sitting. Leaving the replay
  restores the full record, and New game, watch or reload during a replay
  start clean. `replayStepping` and `watchStep` are reset where the queue is
  cancelled, or before they are next tested.
- **The series.** No game is counted twice, and neither a watched nor a
  replayed game is counted.
- **The sweep warning.** It is computed from the person's view only. At a
  hand's last card nothing is unseen, so it gives no false warning.
- **`skip()` cannot loop forever.** Every hard chain (HUD popups, marks) is
  finite, and the watch and replay steps are queued only from `rested`.

## Triage (the same day)

| ID | Decision | Fix |
|---|---|---|
| S1 | fixed | "See the last move again" re-lays the cards with `director.again(before, after)`, which keeps the timed queue, so the HUD's popups finish. The browser test presses it at a hand's end, while the count's popups are queued, and then checks the HUD. |
| S2 | fixed | The replay plays a normalized record: forced moves off in its header and every forced move made as the ordinary move it was, both forward (`commandsBetween`) and back (`prefix`); a refused command stops the replay rather than running the counter on. Node-tested with the aid turned on and off mid-game, two seeds each. |
| S3 | fixed | During the replay undo, hint and "again" are hidden; an aid switch changes only the preference; Copy gives the whole game's record. |
| S4 | fixed (design) | The seed is shown once the game is over (and in the replay), with a line saying why not before. Fairness can still be checked after the game; the daily deal's seed stays computable from the date, as it must, for everyone to get the same cards. |
| S5 | fixed | The last move is forgotten across the replay (`settleOn`) and is not kept from a replay step. |
| S6 | fixed | Keys on any button (the replay bar's included) are the button's own, and the card keys rest during the replay. The browser test steps the replay with Enter. |
| S7 | fixed | A skip runs only what is timed to the moves (and gates): talk queued during it waits its moment; the replay's auto-step carries a token, so a step pressed by hand takes its place. |
| S8 | fixed | A game is counted once by a fingerprint of its record, not its seed; a game from a seeded link is not saved into the series. |
| S9 | fixed | The gate's summary says when the table's tests and the page check were skipped (no `node_modules`), and notes a rebuilt page that is not staged. |
| S10 | fixed | A court's value is said by its name ("a queen would clear the table"). Node-tested. |
| S11 | fixed | `Hand::deck()` removed. |
