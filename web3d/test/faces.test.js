// From piquet web3d/test/faces.test.js @ 254cb3c, less its measure of
// piquet's fanned hand (cassino's hands are four cards, each well shown).
// The Jumbo Index faces: which device gets them, and what each one draws.

import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { drawJumbo, facesFor, isPhone, JUMBO, rankAndSuit } from "../src/faces.js";
import { layout } from "../src/layout.js";
import { CARD, ZONES_PORTRAIT } from "../src/units.js";

test("a phone, held either way, is a touch screen with a short side under 600 px", () => {
  assert.ok(isPhone({ coarse: true, shortSide: 390 }), "an iPhone");
  assert.ok(isPhone({ coarse: true, shortSide: 412 }), "an Android");
  assert.ok(!isPhone({ coarse: true, shortSide: 744 }), "an iPad mini is not");
  assert.ok(!isPhone({ coarse: true, shortSide: 820 }), "an iPad is not");
  assert.ok(!isPhone({ coarse: false, shortSide: 390 }), "a narrow window on a computer is not");
});

test("automatic faces are Jumbo Index on a phone and classic elsewhere; a choice is kept", () => {
  assert.equal(facesFor("auto", true), "jumbo");
  assert.equal(facesFor("auto", false), "classic");
  assert.equal(facesFor(undefined, true), "jumbo");
  for (const phone of [true, false]) {
    assert.equal(facesFor("classic", phone), "classic");
    assert.equal(facesFor("jumbo", phone), "jumbo");
  }
});

test("the table's codes read as rank and suit, the ten as 10", () => {
  assert.deepEqual(rankAndSuit("TH"), ["10", "H"]);
  assert.deepEqual(rankAndSuit("AS"), ["A", "S"]);
  assert.deepEqual(rankAndSuit("7D"), ["7", "D"]);
});

// A 2D context that records what is drawn, measuring text as a font would:
// a glyph's ink a little narrower than its size, its capitals 0.7 of it,
// and the variation selector no ink at all.
function recorder() {
  const calls = [];
  let font = "";
  const ctx = {
    calls,
    fillStyle: "",
    textAlign: "",
    textBaseline: "",
    set font(f) {
      font = f;
    },
    get font() {
      return font;
    },
    measureText(text) {
      const size = Number(font.match(/([\d.]+)px/)[1]);
      return { actualBoundingBoxAscent: 0.7 * size, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 0.8 * size * [...text.replace(/\uFE0E/g, "")].length };
    },
    fillRect: (...a) => calls.push(["fillRect", ...a]),
    fillText: (text, x, y, maxWidth) => calls.push(["fillText", text, x, y, font, ctx.fillStyle, maxWidth]),
    save: () => calls.push(["save"]),
    restore: () => calls.push(["restore"]),
    translate: () => {},
    rotate: (a) => calls.push(["rotate", a]),
  };
  return ctx;
}

test("a face is paper from edge to edge -- the table's ink line draws its edge", () => {
  const ctx = recorder();
  drawJumbo(ctx, 500, "QH");
  const [[call, x, y, w, h]] = ctx.calls;
  assert.deepEqual([call, x, y, w], ["fillRect", 0, 0, 500]);
  assert.ok(Math.abs(h - 700) < 1e-9, `${h} tall`);
});

test("each corner has the rank over the suit, the same at both ends, turned about the centre", () => {
  const ctx = recorder();
  drawJumbo(ctx, 700, "TH");
  const texts = ctx.calls.filter((c) => c[0] === "fillText");
  assert.equal(texts.length, 4);
  assert.deepEqual(texts.map((t) => t[1]), ["10", "♥︎", "10", "♥︎"]);
  assert.ok(ctx.calls.some((c) => c[0] === "rotate" && Math.abs(c[1] - Math.PI) < 1e-9));
  for (const t of texts) assert.equal(t[5], JUMBO.red);
  // The rank above the suit.
  assert.ok(texts[0][3] < texts[1][3]);
});

test("every rank is set at one size, the ten included, in the platform's bold UI font", () => {
  const sizes = new Set();
  for (const code of ["7S", "TS", "QS", "AS"]) {
    const ctx = recorder();
    drawJumbo(ctx, 700, code);
    const rank = ctx.calls.find((c) => c[0] === "fillText");
    assert.match(rank[4], /^700 /);
    assert.match(rank[4], /system-ui/);
    sizes.add(rank[4]);
  }
  assert.equal(sizes.size, 1);
});

test("suits are plain text glyphs, never colour emoji, black and red as they should be", () => {
  for (const [suit, glyph, colour] of [["S", "♠", JUMBO.ink], ["H", "♥", JUMBO.red], ["D", "♦", JUMBO.red], ["C", "♣", JUMBO.ink]]) {
    const ctx = recorder();
    drawJumbo(ctx, 700, `A${suit}`);
    const drawn = ctx.calls.filter((c) => c[0] === "fillText")[1];
    assert.equal(drawn[1], `${glyph}︎`);
    assert.equal(drawn[5], colour);
  }
});

test("the suit's ink is centred on the rank's, whatever font draws it", () => {
  const ctx = recorder();
  drawJumbo(ctx, 700, "AS");
  const [rank, suit] = ctx.calls.filter((c) => c[0] === "fillText");
  const size = Number(suit[4].match(/([\d.]+)px/)[1]);
  assert.ok(Math.abs(suit[2] + (0.8 * size) / 2 - rank[2]) < 1e-9, "the suit's ink centre is under the rank's");
});

// A full hand fanned on a phone shows each card only by a strip at its left;
// cassino's hand of four, held up on a phone (ZONES_PORTRAIT), must show at
// least the strip the Large Text index is fitted to.
const U = CARD.width / JUMBO.w; // centimetres in a unit of the face
test("cassino's hand on a phone shows at least JUMBO.strip of each card", () => {
  const state = {
    hand: ["AS", "7C", "TH", "KH"].map((c) => ({ card: c })),
    opponent_holds: 4,
    table: [],
    piles: { you: { cards: 0 }, them: { cards: 0 } },
    undealt: 32,
    dealer: "them",
  };
  const hand = layout(state, { zones: ZONES_PORTRAIT }).filter((x) => x.zone === "your-hand");
  const at = (pose, ux, uy) => new Vector3(-CARD.width / 2 + ux * U, CARD.height / 2 - uy * U, 0).applyQuaternion(pose.quaternion).add(pose.position);
  for (let i = 0; i + 1 < hand.length; i++) {
    const [a, b] = [hand[i].pose, hand[i + 1].pose];
    const inv = a.quaternion.clone().invert();
    const mine = (p) => p.clone().sub(a.position).applyQuaternion(inv);
    const [p, q] = [mine(at(b, 0, 0)), mine(at(b, 0, JUMBO.h))];
    for (const uy of [JUMBO.rankTop, 2.5, 4.4]) {
      const y = CARD.height / 2 - uy * U;
      const shown = (p.x + ((y - p.y) / (q.y - p.y)) * (q.x - p.x) + CARD.width / 2) / U;
      assert.ok(shown >= JUMBO.strip, `card ${i} shows ${shown.toFixed(2)} units`);
    }
  }
});

test("the index fits the strip, with room either side: every rank and suit within it", () => {
  const room = JUMBO.strip - 2 * JUMBO.margin;
  for (const code of ["7S", "TH", "QC", "AD", "KS", "8H"]) {
    const ctx = recorder();
    drawJumbo(ctx, 700, code);
    const u = 700 / JUMBO.w;
    const [rank, suit] = ctx.calls.filter((c) => c[0] === "fillText");
    // One character, centred in the strip, its ink within it; a 10 starts
    // where the room does and runs on under the next card.
    const size = Number(rank[4].match(/([\d.]+)px/)[1]);
    if (code[0] === "T") assert.ok(Math.abs(rank[2] - JUMBO.margin * u) < 1e-9, `${code}: the 10 starts at the strip's margin`);
    else {
      assert.ok(Math.abs(rank[2] - (JUMBO.margin + room / 2) * u) < 1e-9, `${code}: the rank is centred in the strip`);
      assert.ok(0.8 * size <= room * u + 1e-9, `${code}: the rank's ink is wider than the room`);
    }
    assert.equal(rank[6], undefined, "the canvas does not narrow it");
    const suitSize = Number(suit[4].match(/([\d.]+)px/)[1]);
    const ink = 0.8 * suitSize; // the recorder's ink width for one glyph
    assert.ok(suit[2] >= JUMBO.margin * u - 1e-9 && suit[2] + ink <= (JUMBO.strip - JUMBO.margin) * u + 1e-9, `${code}: the suit runs out of the strip`);
  }
});
