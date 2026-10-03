// The scoring board: where each player's two pegs stand, and its holes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BOARD, holeX, pegsOf } from "../src/pegboard.js";

const ends = (pairs) => pairs.map(([you, them], i) => ({ kind: "hand_ends", hand: i + 1, yours: 0, theirs: 0, totals: { you, them } }));

test("before any hand, both pegs at the start", () => {
  assert.deepEqual(pegsOf([]), { you: { front: 0, back: 0 }, opp: { front: 0, back: 0 } });
});

test("the back peg leapfrogs the front: the gap is the last hand's points", () => {
  const p = pegsOf(ends([[6, 5], [15, 8]]));
  assert.deepEqual(p.you, { front: 15, back: 6 });
  assert.deepEqual(p.opp, { front: 8, back: 5 });
  assert.equal(p.you.front - p.you.back, 9, "the last hand's points");
});

test("past 21 the front peg stands in the game hole", () => {
  const p = pegsOf(ends([[14, 3], [24, 10]]));
  assert.deepEqual(p.you, { front: BOARD.holes, back: 14 });
});

test("the holes run in fives, each group a little apart, the game hole last", () => {
  const xs = Array.from({ length: BOARD.holes + 1 }, (_, i) => holeX(i));
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1]);
  const step = (i) => xs[i] - xs[i - 1];
  assert.ok(step(6) > step(5) + 0.2, "a gap after each five");
  assert.ok(Math.abs(step(2) - step(3)) < 1e-9);
});
