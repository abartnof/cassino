# Working on this repository

Cassino, Classic and Royal, as one offline web page: a Rust engine compiled to
WebAssembly, a three.js table, a terminal client. Start with `PLAN.md` (where
things stand), then `docs/RULES.md` (the rules, settled) and
`docs/DESIGN.md` (why it is built this way).

Standing rules:

- **Test-driven.** Write the test, watch it fail, then make it pass.
- **Atomic commits, often**: one logical change each, with `PLAN.md` kept
  current as work lands.
- **The gate before every commit**: `bin/gate && git commit ...`. It runs
  `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` and
  `cargo test`, prints a one-line summary, and exits non-zero on any
  failure. **Never pipe it** (`bin/gate | tail` reports tail's status, not
  the gate's: twice a broken build was committed that way).
- **Simulations stop when the signal is clear.** Run in batches, look between
  them, and stop when the effect crosses an O'Brien–Fleming boundary fixed
  before the first batch; otherwise report the interval at the last look
  (`docs/DESIGN.md` §11.4). Never peek with an unadjusted p < 0.05. Always
  mirrored pairs.
- **The engine holds the rules; clients hold none.**
- **Documents are public-facing.** The person who commissioned the game is
  "the user" (or "the maintainer"), never named, and the docs are project
  notes, not a diary.
- **Consult the user before anything that spends money** or any long compute
  run, with an estimate in hand.
