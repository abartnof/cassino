# Cassino: plan

> Living document: status, decisions, milestones, and what comes next. It is
> updated as each piece of work lands, so that work can resume from here. The
> reasoning is in `docs/DESIGN.md` and the rules in `docs/RULES.md`.

## Where we are

**2026-10-03: the literature review is finished; the engine begins.**

- `cassino-lit-review.md` (and its PDF): the review, with 400+ sources,
  simulations and a fact-check pass. Its research notes and scripts are in
  `research/`, and its build tools in `tools/`.
- `docs/RULES.md`: both games as they will be implemented, every contested
  point settled once, and twenty worked examples ready to become fixtures.
- `docs/DESIGN.md`: architecture, what carries over from piquet and bezique,
  the move model, observation, the opponent, and the fun: table talk,
  traditional objects, digital aids, explanations and hints.

## Settled decisions

| Decision | Choice | Reasoning |
|---|---|---|
| The games | Two-player **Classic** and **Royal** Cassino, chosen at the start | the user; `RULES.md` |
| Settings | "Aces count 1 or 14" (Royal only, off) and "Score sweeps" (on) | `RULES.md`, "Authority" |
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

- [ ] 1. **Cards and rules**: `CardSet`, notation, values for both games.
- [ ] 2. **The table and moves**: move generation, the reference generator,
  `apply`, the `RULES.md` fixtures.
- [ ] 3. **The hand and the game**: dealing, the residue, events, scoring, the
  game to 21. Invariants over random play.
- [ ] 4. **Agents and measurement**: random and greedy agents, the
  mirrored-pair harness, the anatomy of a hand.
- [ ] 5. **The terminal client**: play against the computer, and **watch
  mode**.
- [ ] 6. **Observation and the stronger rungs**: the view and its leak test,
  the build inference, counting, the exact last-deal solver, sampled search.
  Each rung measured.
- [ ] 7. **Explanations and hints**: the category evaluation, `explain`,
  `hint`, `options` with reasons, sweep warnings, the unseen-card summary.
- [ ] 8. **The session, the protocol and the wasm module**:
  `docs/PROTOCOL.md`, replay byte for byte, native and wasm.
- [ ] 9. **The 3D table**, adapted from piquet's: art for 52 cards, the
  middle-of-the-table layout, builds, the cribbage board, the table talk.
- [ ] 10. **Teaching**: tutorial pages, on-screen help.

## Working conventions

- **Test-driven**: tests first, throughout.
- **Atomic commits, often**, straight to `main` until the game is public.
  `PLAN.md` is updated as each piece of work lands.
- **Every aid a toggle.** "Your opponent", never a proper name.
- **Every third-party asset credited in `CREDITS.md`** in the commit that
  brings it in.
- **Consult the user before anything that spends money**, and before any long
  compute run, with a runtime and cost estimate in hand.
- **Simulations stop when the signal is clear.** Batches, looks between them,
  and an O'Brien–Fleming boundary fixed before the first batch: a clear
  effect ends the run early, and the last look reports the interval
  (`docs/DESIGN.md` §11.4). The user: "if you have a clear signal coming
  through, your sample size can be rather small".

## Open for the user

1. **A `LICENSE` file.** `Cargo.toml` says MIT, as piquet and bezique do; the
   file itself, with its copyright line, is the user's to add.

## Notes for a future session

- Read `docs/RULES.md` before touching move generation. The fixtures W1–W20
  are the rules' worked examples.
- `~/piquet` and `~/bezique` are the working references. Read their
  `docs/PROTOCOL.md`, piquet's `docs/TABLE3D.md`, and the "Hard-won lessons"
  in piquet's `PLAN.md`.
- Observation is where piquet's subtle defects lived. Here, the subtle point
  is that a controlled build announces a card in its controller's hand.
