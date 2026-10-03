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
  `cargo test`, then (with `web3d/node_modules` present) builds the wasm
  module, runs the table's Node tests and checks that the committed page,
  `web3d/cassino3d.html`, is built from the current sources (rebuild it with
  `python3 web3d/build.py` and commit it with any engine or table change).
  It prints a one-line summary and exits non-zero on any failure. The gate
  does not open a browser: before committing a change to the table, also run
  `~/piquet/.venv/bin/python web3d/test/browser.py --quick` (a minute: the
  page loads with no console error and plays a few moves), and the full
  browser test (about fifteen minutes) before a phase is called done. **Never pipe it** (`bin/gate | tail` reports tail's status, not
  the gate's), and in a multi-step shell command write `bin/gate || exit 1`
  before the commit. `set -e` has no effect in Claude Code's shell, and a
  heredoc ends an `&&` chain at its closing line, so a commit after one runs
  regardless. Broken builds were committed four times before this rule.
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
