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

// The live board, pegged hand by hand, stands where a board reset to the
// same hands stands, a hand scoring nothing included (the table review's
// T9). On a stand-in stage, the animation frames run at once.
test("the board pegged hand by hand agrees with the board set from the hands", async () => {
  globalThis.requestAnimationFrame = (f) => setTimeout(() => f(performance.now() + 60_000), 0);
  const { createPegboard } = await import("../src/pegboard.js");
  const stage = { registerInk() {}, render() {}, scene: { add() {} } };
  const sequence = [[6, 5], [6, 13], [15, 13], [15, 13]]; // a hand scoring nothing for you, then for both
  const live = createPegboard(stage);
  live.reset(pegsOf([]));
  for (let k = 1; k <= sequence.length; k++) {
    live.peg(pegsOf(ends(sequence.slice(0, k))));
    await new Promise((r) => setTimeout(r, 20));
    const fresh = createPegboard(stage);
    fresh.reset(pegsOf(ends(sequence.slice(0, k))));
    for (const side of ["you", "opp"]) {
      const at = (board) => board.pegs[side].map((p) => p.position.x.toFixed(3)).sort();
      assert.deepEqual(at(live), at(fresh), `${side} after hand ${k}`);
    }
  }
  delete globalThis.requestAnimationFrame;
});
