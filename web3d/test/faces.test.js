// From piquet web3d/test/faces.test.js @ 254cb3c, less its measure of
// piquet's fanned hand (cassino's hands are four cards, each well shown).
// The Jumbo Index faces: which device gets them, and what each one draws.

import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { drawJumbo, facesFor, JUMBO, largeTextByDefault, rankAndSuit } from "../src/faces.js";
import { layout } from "../src/layout.js";
import { CARD, ZONES_PORTRAIT } from "../src/units.js";

test("Large Text by default on a phone or a tablet, a touch screen its main pointer, and not on a computer", () => {
  assert.ok(largeTextByDefault({ coarse: true }), "an iPhone or an Android phone");
  assert.ok(largeTextByDefault({ coarse: true, mac: false, touchPoints: 5 }), "an iPad, or an Android tablet");
  // iPadOS's Safari says it is a Mac; only its touch points tell.
  assert.ok(largeTextByDefault({ coarse: false, mac: true, touchPoints: 5 }), "an iPad whose Safari asks for the desktop site");
  assert.ok(!largeTextByDefault({ coarse: false, mac: true, touchPoints: 0 }), "a Mac is not");
  assert.ok(!largeTextByDefault({ coarse: false, mac: false, touchPoints: 10 }), "a computer with a touch screen and a mouse is not");
  assert.ok(!largeTextByDefault({ coarse: false }), "a narrow window on a computer is not");
});

test("automatic faces are Jumbo Index on a phone or a tablet and classic elsewhere; a choice is kept", () => {
  assert.equal(facesFor("auto", true), "jumbo");
  assert.equal(facesFor("auto", false), "classic");
  assert.equal(facesFor(undefined, true), "jumbo");
  for (const touch of [true, false]) {
    assert.equal(facesFor("classic", touch), "classic");
    assert.equal(facesFor("jumbo", touch), "jumbo");
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
    translate: (x, y) => calls.push(["translate", x, y]),
    scale: (x, y) => calls.push(["scale", x, y]),
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

// The sixth play-testing: on an iPhone the table's cards were "still too
// small to read". A card on the screen is never read upside down, so the
// face has no turned corner; below the corner the hand needs, a big rank
// and suit fill the card, for the table, where all of a card shows.
const fills = (code, width = 700) => {
  const ctx = recorder();
  drawJumbo(ctx, width, code);
  return { ctx, texts: ctx.calls.filter((c) => c[0] === "fillText"), u: width / JUMBO.w };
};
const sizeOf = (call) => Number(call[4].match(/([\d.]+)px/)[1]);

test("one corner, the rank over the suit, at the top left; none turned upside down", () => {
  const { ctx, texts } = fills("TH");
  assert.ok(!ctx.calls.some((c) => c[0] === "rotate"), "nothing turned");
  assert.equal(texts.length, 4);
  assert.deepEqual(texts.map((t) => t[1]), ["10", "♥︎", "10", "♥︎"], "the corner, then the big rank and suit");
  for (const t of texts) assert.equal(t[5], JUMBO.red);
  assert.ok(texts[0][3] < texts[1][3], "the corner's rank above its suit");
});

test("below the corner, a big rank and suit side by side, centred across the card and within it", () => {
  for (const code of ["7S", "QC", "AD", "KH", "TD", "2S"]) {
    const { texts, u } = fills(code);
    const [rank, suit, bigRank, bigSuit] = texts;
    assert.ok(sizeOf(bigRank) >= 1.5 * sizeOf(rank), `${code}: the big rank ${sizeOf(bigRank)} against the corner's ${sizeOf(rank)}`);
    // The recorder's ink: a character 0.8 of its size wide, its capitals 0.7 tall.
    const cornerBottom = suit[3];
    const capTop = bigRank[3] - 0.7 * sizeOf(bigRank);
    assert.ok(capTop >= cornerBottom, `${code}: the big rank starts at ${capTop}, under the corner's ${cornerBottom}`);
    assert.ok(bigRank[3] <= (JUMBO.h - JUMBO.big.margin) * u + 1e-9, `${code}: the big rank runs off the card`);
    const right = bigSuit[2] + 0.8 * sizeOf(bigSuit);
    assert.ok(bigSuit[2] > bigRank[2], `${code}: the suit beside the rank`);
    if (code[0] !== "T") {
      const left = bigRank[2];
      assert.ok(Math.abs((left + right) / 2 - (JUMBO.w / 2) * u) < 1e-6, `${code}: centred across the card`);
      assert.ok(left >= JUMBO.big.margin * u - 1e-9 && right <= (JUMBO.w - JUMBO.big.margin) * u + 1e-9, `${code}: within the card`);
    }
  }
});

test("every big rank is set at one size, the ten narrowed to fit as the others do", () => {
  const sizes = new Set(["7S", "TS", "QS", "AS", "KD"].map((code) => fills(code).texts[2][4]));
  assert.equal(sizes.size, 1);
  const { ctx } = fills("TS");
  const scale = ctx.calls.find((c) => c[0] === "scale");
  assert.ok(scale && scale[1] < 1 && scale[2] === 1, `the ten narrowed: ${scale}`);
  assert.ok(!fills("7S").ctx.calls.some((c) => c[0] === "scale"), "a single character is not");
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
