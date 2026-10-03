// Choosing a move: the hand card, the table cards, the chips
// (docs/TABLE3D.md section 8).
import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY, choose, pick, selectionText, chipsOf, itemState } from "../src/selection.js";

test("tapping a hand card chooses it, and again lets it go", () => {
  const a = choose(EMPTY, "3H");
  assert.equal(a.chosen, "3H");
  assert.equal(choose(a, "3H").chosen, null);
  assert.equal(selectionText(EMPTY), "");
});

test("choosing another card starts the table afresh", () => {
  const a = pick(choose(EMPTY, "3H"), ["AC"]);
  assert.deepEqual(a.picked, ["AC"]);
  const b = choose(a, "3S");
  assert.equal(b.chosen, "3S");
  assert.deepEqual(b.picked, []);
});

test("tapping a table item picks it whole, and again lets it go", () => {
  const a = choose(EMPTY, "9C");
  const b = pick(a, ["6S", "3H"]); // a build of nine
  assert.deepEqual(b.picked.slice().sort(), ["3H", "6S"]);
  assert.equal(selectionText(b), "9C 6S 3H");
  const c = pick(b, ["3H", "6S"]);
  assert.deepEqual(c.picked, []);
  assert.equal(pick(EMPTY, ["AC"]), EMPTY, "nothing picked before a hand card is chosen");
});

test("chips: take first, then builds by value, then trail", () => {
  const offer = {
    moves: [
      { move: "trail 3H", chip: { kind: "trail", label: "Trail" }, said: "trail 3♥", call: null },
      { move: "build 6 3H 2D AC", chip: { kind: "build", label: "Build 6", value: 6 }, said: "build six", call: "Building six." },
      { move: "take 3H 2D AC", chip: { kind: "take", label: "Take" }, said: "take", call: null },
      { move: "build 3 3H 2D AC", chip: { kind: "build", label: "Build 3s", value: 3 }, said: "build threes", call: "Building threes." },
    ],
  };
  assert.deepEqual(chipsOf(offer).map((c) => c.label), ["Take", "Build 3s", "Build 6", "Trail"]);
  assert.equal(chipsOf(offer)[0].move, "take 3H 2D AC");
  assert.deepEqual(chipsOf({ error: "It is not your turn." }), []);
});

test("an ace's two capture values become two chips", () => {
  const offer = {
    moves: [
      { move: "take AC=14 KS AH", chip: { kind: "take", label: "Take", value: 14 } },
      { move: "take AC AH", chip: { kind: "take", label: "Take", value: 1 } },
    ],
  };
  assert.deepEqual(chipsOf(offer).map((c) => c.label), ["Take as 1", "Take as 14"]);
});

test("each table card is picked, addable, refused or idle", () => {
  const sel = pick(choose(EMPTY, "9C"), ["4D"]);
  const offer = { can_add: [{ card: "5S" }], why_not: [{ card: { card: "KH" }, reason: "No." }] };
  assert.equal(itemState("4D", offer, sel), "picked");
  assert.equal(itemState("5S", offer, sel), "addable");
  assert.equal(itemState("KH", offer, sel), "refused");
  assert.equal(itemState("2C", offer, sel), "idle");
  assert.equal(itemState("4D", null, EMPTY), "idle");
});

import { selectionOf, whyNot } from "../src/selection.js";

test("a move's text as the selection that makes it, a build picked whole", () => {
  const table = [
    { id: 1, cards: [{ card: "3C" }, { card: "6D" }], build: { value: 9 } },
    { id: 2, cards: [{ card: "9D" }] },
    { id: 3, cards: [{ card: "5C" }] },
  ];
  assert.deepEqual(selectionOf("trail 7H", table), { chosen: "7H", picked: [] });
  assert.deepEqual(selectionOf("take 9S 3C 6D 9D", table), { chosen: "9S", picked: ["3C", "6D", "9D"] });
  assert.deepEqual(selectionOf("take AC=14 KS AH", table), { chosen: "AC", picked: ["KS", "AH"] });
  assert.deepEqual(selectionOf("build 8 3D 5C", table), { chosen: "3D", picked: ["5C"] });
  assert.deepEqual(selectionOf("build 11 2S on 3C 9D", table), { chosen: "2S", picked: ["3C", "6D", "9D"] });
});

test("a refused build is refused on any of its cards, and says why on each (the table review's T5)", () => {
  const table = [
    { id: 1, cards: [{ card: "AS" }, { card: "6D" }], build: { value: 7 } },
    { id: 2, cards: [{ card: "5C" }] },
  ];
  // The engine names the build by its lowest card.
  const offer = { moves: [], can_add: [{ card: "5C" }], why_not: [{ card: { card: "AS" }, reason: "To take the 7-build you need a 7." }] };
  const sel = { chosen: "2H", picked: [] };
  assert.equal(itemState("6D", offer, sel, table), "refused", "the top card too");
  assert.equal(itemState("AS", offer, sel, table), "refused");
  assert.equal(whyNot("6D", offer, table), "To take the 7-build you need a 7.");
  assert.equal(itemState("5C", offer, sel, table), "addable");
});

import { sweepWarning, valuesSaid } from "../src/selection.js";

test("the sweep warning, before the move: which chip leaves a sweep, and what would clear the table", () => {
  assert.equal(valuesSaid([8]), "an 8");
  assert.equal(valuesSaid([1, 14]), "an ace");
  assert.equal(valuesSaid([9, 7]), "a 9 or a 7");
  const offer = {
    moves: [
      { move: "trail 5C", chip: { kind: "trail", label: "Trail" }, leaves_sweep: { values: [9], unseen: 2 } },
      { move: "build 9 5C 4D", chip: { kind: "build", label: "Build 9", value: 9 }, leaves_sweep: null },
    ],
  };
  const chips = chipsOf(offer);
  assert.deepEqual(chips.find((c) => c.kind === "trail").leaves, { values: [9], unseen: 2 });
  assert.equal(sweepWarning(chips), "Trail leaves a sweep: a 9 would clear the table, and 2 you have not seen.");
  assert.equal(sweepWarning(chips.filter((c) => c.kind !== "trail")), null);
});
