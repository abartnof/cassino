// The match: a single game to 21, or a "World Series", best of seven.
import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_SERIES, recordGame, seriesLine, seriesOver } from "../src/series.js";

test("a series counts the games each side has won, and is over at four", () => {
  let s = { ...NO_SERIES, format: "best-of-7" };
  for (const youWon of [true, false, true, true]) s = recordGame(s, { seed: Math.random(), youWon });
  assert.deepEqual([s.you, s.them], [3, 1]);
  assert.equal(seriesOver(s), null);
  s = recordGame(s, { seed: 99, youWon: true });
  assert.equal(seriesOver(s), "you");
  assert.equal(seriesLine(s), "You win the series, 4 games to 1.");
});

test("a game is counted once, however often its end is seen", () => {
  let s = { ...NO_SERIES, format: "best-of-7" };
  s = recordGame(s, { seed: 7, youWon: false });
  s = recordGame(s, { seed: 7, youWon: false });
  assert.deepEqual([s.you, s.them], [0, 1]);
});

test("a single game keeps no series, and a finished series starts afresh", () => {
  const single = recordGame({ ...NO_SERIES }, { seed: 1, youWon: true });
  assert.deepEqual([single.you, single.them], [0, 0]);
  assert.equal(seriesLine(single), null);
  let s = { format: "best-of-7", you: 4, them: 2, counted: [1, 2, 3, 4, 5, 6] };
  s = recordGame(s, { seed: 8, youWon: false });
  assert.deepEqual([s.you, s.them], [0, 1], "the next game opens a new series");
  assert.equal(seriesLine({ format: "best-of-7", you: 2, them: 1, counted: [] }), "Series: you 2, your opponent 1 (best of seven).");
});
