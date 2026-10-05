// Choosing a move: the hand card, the table cards, the chips
// (docs/TABLE3D.md section 8).
import { test } from "node:test";
import assert from "node:assert/strict";
import { BAR, BAR_ORDER, EMPTY, barAcross, chipsOf, choose, fitLabels, itemState, moveBar, moveBarFit, pick, selectionText } from "../src/selection.js";

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
  assert.equal(valuesSaid([12]), "a queen", "a court by its name (second review, S10)");
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

test("the move bar: Take, Build and Trail each in its own place, always there, lit when the choice makes one", () => {
  const off = moveBar([]);
  assert.deepEqual(
    off.map((p) => [p.kind, p.buttons.map((b) => [b.label, b.enabled])]),
    [
      ["build", [["Build", false]]],
      ["take", [["Take", false]]],
      ["trail", [["Trail", false]]],
    ],
  );
  const chips = [
    { kind: "build", label: "Build 6", move: "build 6 3H 2D AC" },
    { kind: "build", label: "Build 3s", move: "build 3 3H 2D AC" },
    { kind: "take", label: "Take", move: "take 3H 2D AC" },
  ];
  assert.deepEqual(
    moveBar(chips).map((p) => [p.kind, p.buttons.map((b) => [b.label, b.short, b.enabled, b.move ?? null])]),
    [
      ["build", [["Build 6", "6", true, "build 6 3H 2D AC"], ["Build 3s", "3s", true, "build 3 3H 2D AC"]]],
      ["take", [["Take", "Take", true, "take 3H 2D AC"]]],
      ["trail", [["Trail", "Trail", false, null]]],
    ],
    "each kind in its own place, as many of it as the choice makes sharing it",
  );
  const ace = moveBar([
    { kind: "take", label: "Take as 1", move: "take AC AH" },
    { kind: "take", label: "Take as 14", move: "take AC=14 KS AH" },
  ]);
  assert.deepEqual(ace.find((p) => p.kind === "take").buttons.map((b) => b.short), ["as 1", "as 14"]);
});

// The words on a place's buttons, fitted to its width: a measure as a font
// would, each character 0.6 of the size.
const measure = (text, px) => text.length * 0.6 * px;
test("a place's words are as large as the bar's where they fit, smaller where not, and short where small would be too small", () => {
  const h = 80; // the words at most 0.38 of it: 30.4 px
  const one = (label, width) => fitLabels([{ label, short: label }], { width, h, gap: 6, measure });
  assert.deepEqual(one("Take", 240), [{ text: "Take", px: h * BAR.label }], "room to spare: as large as the bar's");
  const long = one("Take as 14", 200)[0];
  assert.equal(long.text, "Take as 14");
  assert.ok(long.px < h * BAR.label && Math.abs(measure("Take as 14", long.px) - (200 - 2 * BAR.pad * h - BAR.slack)) < 1e-9, "fitted to the room inside the padding, with a little to spare");
  // Two moves share a place: both the same size, the longer fitted.
  const two = fitLabels(
    [
      { label: "Build 6", short: "6" },
      { label: "Build 3s", short: "3s" },
    ],
    { width: 240, h, gap: 6, measure },
  );
  assert.deepEqual(two.map((b) => b.text), ["Build 6", "Build 3s"]);
  assert.equal(two[0].px, two[1].px);
  assert.ok(two[0].px >= 13, `${two[0].px}`);
  // On a phone's narrow bar the long words would be too small to read:
  // the short ones, at the bar's size where they fit.
  const small = fitLabels(
    [
      { label: "Build 6", short: "6" },
      { label: "Build 3s", short: "3s" },
    ],
    { width: 100, h: 36, gap: 4, measure },
  );
  assert.deepEqual(small.map((b) => b.text), ["6", "3s"]);
  assert.equal(small[0].px, 36 * BAR.label);
});

// The seventh play-testing: "remove the sum button to the left of the
// action buttons." The bar is Take, Build and Trail alone.
// The user: "run a few hundred automated games, and look at the order in
// which people use the action buttons. The most common action button
// should be on the far right, and the least common action button should be
// on the left, to make the UX good for someone's thumb. Another config can
// be to turn the action buttons to the other direction for left-handed
// players, but it should default to the way that I'm describing." Over
// 300 games of each variant (web3d/tools/moves.mjs; measurements/README.md)
// a trail is half the moves made, a capture about two in five, a build one
// in ten: Build, Take, Trail, left to right; left-handed, the other way.
test("the move bar: the moves least made at the left, the most at the right; turned round for a left hand", () => {
  assert.deepEqual(BAR_ORDER, ["build", "take", "trail"]);
  assert.deepEqual(moveBar([]).map((p) => p.kind), ["build", "take", "trail"]);
  assert.deepEqual(moveBar([], { leftHanded: true }).map((p) => p.kind), ["trail", "take", "build"]);
});

test("the move bar's width goes only with its height, whatever the choice makes; it has no sum", () => {
  const across = barAcross(374, 8);
  assert.equal(across.perH, 3 * BAR.place);
  assert.equal(across.fixed, 2 * 8, "two gaps between three places");
  assert.equal(across.room, 374);
  assert.equal("sum" in BAR, false);
});

test("the move bar fills the space between the table and your hand, clear of a card chosen", () => {
  // Table cards end at 340 px; your hand's top at 460; a chosen card stands 26 px up.
  const fit = moveBarFit({ near: 340, top: 460, lift: 26 });
  assert.equal(fit.y, (340 + 460 - 26) / 2, "centred in what is left");
  assert.equal(fit.h, 94 - 2 * 7, "as tall as it, less a margin each side");
  assert.equal(moveBarFit({ near: 340, top: 600, lift: 26 }).h, 84, "never more than 84 px");
  assert.equal(moveBarFit({ near: 340, top: 380, lift: 26 }).h, 40, "never less than 40");
});

// On a phone the bar could be wider than the
// screen: it is made only as tall as lets it fit across. Its width grows
// with its height (`perH` px of width a px), past gaps that do not
// (`fixed`).
test("the move bar is never wider than the room across", () => {
  const across = { room: 374, perH: 8, fixed: 24 };
  assert.equal(moveBarFit({ near: 340, top: 460, lift: 26, across }).h, (374 - 24) / 8);
  assert.equal(moveBarFit({ near: 340, top: 460, lift: 26, across: { room: 1200, perH: 8, fixed: 24 } }).h, 80, "room enough: as tall as before");
  assert.equal(moveBarFit({ near: 340, top: 460, lift: 26, across: { room: 200, perH: 8, fixed: 24 } }).h, 32, "never less than 32 to fit");
});

// The user: "put the action buttons (take, build, trail) on a layer lower
// than the cards so that they do not occlude the cards"; and then "when a
// card passes over the action buttons, the action buttons flicker" (a mask
// image, decoded afresh each frame, lagged its frame). Each card that
// crosses the bar is cut out of it by a clip path, drawn at once: the
// cards that cross it, shared among the bar's nested elements so that no
// two cut from one element overlap (one path cuts overlapping cards out
// only by halves), and a tap in one is the card's.
test("the move bar's cut-outs: the cards that cross it, overlapping ones as one, and a tap in one the card's", async () => {
  const { barHoles, mergeHoles, clipPathFor, pointIn } = await import("../src/selection.js");
  const bar = { left: 100, top: 400, width: 300, height: 50 };
  const square = (x, y, s = 40) => [{ x, y }, { x: x + s, y }, { x: x + s, y: y + s }, { x, y: y + s }];
  assert.deepEqual(barHoles(bar, [square(0, 0), square(500, 400)]), [], "no card on the bar");
  const holes = barHoles(bar, [square(0, 0), square(150, 380), square(170, 390), square(300, 400)], 0);
  assert.equal(holes.length, 3, "only the cards that cross it");
  // A heap of cards carried across the bar, overlapping, cut out as one
  // (the user: "if there are many cards piled up on the table, the cards
  // collide in a funny way with the action buttons": one path cut a pile
  // of overlapping cards out only by halves).
  const merged = mergeHoles(holes);
  assert.equal(merged.length, 2, "the two that overlap as one; the one clear of them alone");
  const heap = mergeHoles(Array.from({ length: 12 }, (_, k) => square(150 + k * 3, 380 + k * 2)));
  assert.equal(heap.length, 1, "a heap of twelve, one cut");
  for (const [x, y] of [[151, 381], [150 + 11 * 3 + 39, 380 + 22 + 39], [200, 420]]) assert.ok(pointIn(heap[0], x, y), `${x}, ${y} in the heap's cut`);
  const path = clipPathFor(bar, [square(150, 380)]);
  assert.match(path, /^path\(evenodd, "M-24 -24H324V74H-24Z /, "the bar's box, and room round it");
  assert.match(path, /M50 -20L90 -20L90 20L50 20Z"\)$/, "the card in the bar's own place");
  assert.equal(clipPathFor(bar, []), "");
  assert.ok(pointIn(holes[0], 160, 410));
  assert.ok(!pointIn(holes[0], 260, 410));
});

// And the card's ink outline, drawn just outside its face, cut out with it
// (the user saw "a cell shading error": the card lost its outline where it
// crossed a button).
test("a card's cut-out takes in its ink outline", async () => {
  const { barHoles } = await import("../src/selection.js");
  const bar = { left: 100, top: 400, width: 300, height: 50 };
  const [hole] = barHoles(bar, [[{ x: 150, y: 380 }, { x: 190, y: 380 }, { x: 190, y: 420 }, { x: 150, y: 420 }]], 3);
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  assert.ok(near(hole[0].x, 147) && near(hole[0].y, 377) && near(hole[2].x, 193) && near(hole[2].y, 423), JSON.stringify(hole));
});

test("an outline not square is grown as far along every edge", async () => {
  const { barHoles } = await import("../src/selection.js");
  // A parallelogram, as a card seen aslant: each edge pushed out by 3.
  const poly = [{ x: 150, y: 400 }, { x: 190, y: 400 }, { x: 210, y: 440 }, { x: 170, y: 440 }];
  const [hole] = barHoles({ left: 0, top: 0, width: 1000, height: 1000 }, [poly], 3);
  // The top edge now at y 397, the bottom at 443.
  assert.ok(Math.abs(hole[0].y - 397) < 1e-9 && Math.abs(hole[2].y - 443) < 1e-9, JSON.stringify(hole));
  // The slanted edge from (190, 400) to (210, 440) pushed out 3 along its normal.
  const nx = 40 / Math.hypot(20, 40);
  const ny = -20 / Math.hypot(20, 40);
  const dist = (p) => (p.x - 190) * nx + (p.y - 400) * ny;
  assert.ok(Math.abs(dist(hole[1]) - 3) < 1e-9 && Math.abs(dist(hole[2]) - 3) < 1e-9);
});
