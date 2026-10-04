# Cassino

Cassino is a card game of fishing: you play one card at a time from your hand
to take cards from the middle of the table, by matching them, by adding them
up, or by building piles you mean to take next turn. It was one of America's
favourite family games for a century and a half ("typical" of the country, as
Foster wrote in 1897), and is still played in the Dominican Republic, the
Nordic countries and many family kitchens. This is a version you can play
against the computer, in Classic or Royal Cassino, and learn as you play.

**Play it at [abartnof.github.io/cassino](https://abartnof.github.io/cassino/)**,
or open `web3d/cassino3d.html` in a browser: it is one self-contained page,
about 3 MB, and needs no installation, no server and no network, so a copy
saved to your own machine plays offline.

## Learning the game

- **[pagat.com](https://www.pagat.com/fishing/casino.html)**: the clearest
  modern rules, and the ones this game follows (with
  [Royal Casino](https://www.pagat.com/fishing/royal_casino.html)).
- **The game's own tutorial** opens each idea the first time it comes up in
  play: pairing, summing, building, raising, multiple builds, the count. The
  question mark has all of its pages at any time.
- `docs/RULES.md`: the rules exactly as implemented, every one with its
  source.

## How it works

- **The rules engine** is written in Rust (`crates/cassino-core`) and compiled
  to WebAssembly inside the page. It deals, checks every move with a reason
  for every refusal, scores, explains, hints, and plays your opponent, from
  one that plays any card it may to one that plays the deal out in its head
  (the skill dial runs from 1 to 4 in halves; `measurements/README.md` has
  how each rung was measured against the others).
- **The table** is drawn with three.js and Material Web (`web3d/`): the cards
  dealt in twos, captures gathered and turned into their taker's pile, the
  count with each ace and Cassino turned up, the table talk of the period
  books and a score HUD. It works on a phone held either way.
- A **terminal version** plays the same game: `cargo run -p cassino-cli`.

To build and test it yourself:

```
python3 web3d/build.py      # rebuild the page; needs Rust's wasm32 target and `npm ci` in web3d/
bin/gate                    # formatting, lints, the engine's tests and the table's Node tests
~/piquet/.venv/bin/python web3d/test/browser.py   # the page in a real browser, offline (Playwright)
```

- `docs/DESIGN.md`: why the engine and the table are built the way they are.
- `docs/PROTOCOL.md`: the engine's interface, which the page and the terminal
  both use.
- `docs/TABLE3D.md`: the table, phase by phase.
- `docs/PHRASES.md`: everything said at the table, with its source.
- `PLAN.md`: where the work stands.
- `CREDITS.md`: the card art, the libraries and the design system.

## The research behind it

- `cassino-lit-review.md`: a fully cited literature review of Cassino and its
  relatives (history, rules, table talk, scorekeeping, strategy, apps),
  compiled as background for this game; `cassino-lit-review.pdf` is the same
  review as a PDF (rebuild with `tools/build_pdf.sh`; needs pandoc and
  WeasyPrint).
- `research/`: the per-topic notes behind it, with sources.
