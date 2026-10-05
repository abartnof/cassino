// The layout: where all 52 cards rest for a state of the protocol
// (docs/TABLE3D.md section 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { layout } from "../src/layout.js";
import { CARD, ZONES } from "../src/units.js";

const card = (code) => ({ card: code, label: code, rank: 0, suit: code[1] });

// A state as the protocol gives it, with only what the layout reads.
function state({ hand, table = [], holds = 4, undealt = 40, piles = [0, 0], sweeps = [0, 0], dealer = "them" }) {
  return {
    hand: hand.map(card),
    table: table.map(([id, cards, build]) => ({ id, cards: cards.map(card), build: build ?? null })),
    opponent_holds: holds,
    undealt,
    dealer,
    piles: {
      you: { cards: piles[0], sweeps: sweeps[0] },
      them: { cards: piles[1], sweeps: sweeps[1] },
    },
  };
}

const opening = state({
  hand: ["AS", "7H", "TD", "KC"],
  table: [
    [1, ["3S"]],
    [2, ["4D"]],
    [3, ["9C"]],
    [4, ["QH"]],
  ],
});

test("every card of the pack is placed once", () => {
  const slots = layout(opening);
  assert.equal(slots.length, 52);
  assert.equal(new Set(slots.map((s) => s.key)).size, 52);
  for (const s of slots) {
    assert.ok(Number.isFinite(s.pose.position.x) && Number.isFinite(s.pose.position.y) && Number.isFinite(s.pose.position.z), s.key);
  }
});

test("faces only where the view has them", () => {
  const slots = layout(opening);
  const known = slots.filter((s) => s.code).map((s) => s.code).sort();
  assert.deepEqual(known, ["3S", "4D", "7H", "9C", "AS", "KC", "QH", "TD"].sort());
  for (const s of slots.filter((s) => ["their-hand", "stock", "your-pile", "their-pile"].includes(s.zone))) {
    assert.equal(s.code, null, `${s.zone} ${s.key} shows no face`);
  }
});

test("the zones hold what the state says", () => {
  const s = state({ hand: ["AS", "7H"], table: [[1, ["3S"]]], holds: 2, undealt: 8, piles: [20, 19] });
  const count = (zone) => layout(s).filter((x) => x.zone === zone).length;
  assert.equal(count("your-hand"), 2);
  assert.equal(count("their-hand"), 2);
  assert.equal(count("middle"), 1);
  assert.equal(count("stock"), 8);
  assert.equal(count("your-pile"), 20);
  assert.equal(count("their-pile"), 19);
});

test("a build shows each covered card's whole corner index, and a strip of its face", () => {
  // The classic faces' index (rank over suit) reaches 0.85 cm in from the
  // left edge and 1.9 cm down from the top, measured on the art.
  const index = { across: 0.85, down: 1.9 };
  assert.ok(ZONES.stack.dx >= index.across + 0.5, "the left strip shows the index and some of the face");
  assert.ok(ZONES.stack.dz >= index.down, "the top strip shows the rank and the suit");
});

test("a build is a stack in the order laid, the last on top and each index showing", () => {
  const s = state({ hand: ["8S"], table: [[5, ["5C", "3D"], { value: 8, multiple: false, controller: "you" }]], holds: 1, undealt: 0, piles: [24, 24] });
  const [first, second] = ["5C", "3D"].map((c) => layout(s).find((x) => x.code === c));
  assert.ok(second.pose.position.y > first.pose.position.y, "the last laid lies on top");
  assert.ok(Math.abs(second.pose.position.x - first.pose.position.x - ZONES.stack.dx) < 1e-9);
  assert.ok(Math.abs(second.pose.position.z - first.pose.position.z - ZONES.stack.dz) < 1e-9);
  assert.equal(first.item, 5);
});

test("items on the grid never overlap, however many there are", () => {
  const codes = ["2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "TS", "JS", "QS", "KS", "2H", "3H"];
  const s = state({ hand: [], table: codes.map((c, i) => [i + 1, [c]]), holds: 0, undealt: 0, piles: [19, 19] });
  const centres = layout(s).filter((x) => x.zone === "middle").map((x) => x.pose.position);
  for (let i = 0; i < centres.length; i++) {
    for (let j = i + 1; j < centres.length; j++) {
      const apart = Math.abs(centres[i].x - centres[j].x) >= CARD.width || Math.abs(centres[i].z - centres[j].z) >= CARD.height;
      assert.ok(apart, `items ${i} and ${j} overlap`);
    }
  }
});

test("rows grow away from you, never toward your hand", () => {
  const codes = ["2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "TS", "JS", "QS", "KS", "2H", "3H"];
  const s = state({ hand: [], table: codes.map((c, i) => [i + 1, [c]]), holds: 0, undealt: 0, piles: [19, 19] });
  const zs = layout(s).filter((x) => x.zone === "middle").map((x) => x.pose.position.z);
  assert.ok(Math.max(...zs) <= ZONES.middle.z + 1e-9, "no row nearer you than the first");
});

test("an item keeps its place when another arrives after it", () => {
  const before = state({ hand: ["AS"], table: [[1, ["3S"]], [2, ["4D"]]] });
  const after = state({ hand: ["AS"], table: [[1, ["3S"]], [2, ["4D"]], [3, ["9C"]]] });
  const where = (s, c) => layout(s).find((x) => x.code === c).pose.position;
  // The grid re-centres as it grows, but the order across it holds.
  assert.ok(where(after, "3S").x < where(after, "4D").x && where(after, "4D").x < where(after, "9C").x);
  assert.ok(where(before, "3S").x < where(before, "4D").x);
});

test("sweep cards lie face up and crosswise in the pile", () => {
  const s = state({ hand: ["AS"], holds: 1, undealt: 0, piles: [10, 6], sweeps: [1, 0] });
  const slots = layout(s, { sweeps: { you: [{ code: "7C", at: 9 }], them: [] } });
  const sweep = slots.find((x) => x.code === "7C");
  assert.equal(sweep.zone, "your-pile");
  assert.equal(sweep.faceUp, true);
  assert.equal(sweep.index, 9);
  assert.equal(slots.filter((x) => x.zone === "your-pile").length, 10, "the sweep card is one of the pile's cards");
});

test("a sweep lies where it was laid: later captures cover it, its ends showing", () => {
  const s = state({ hand: ["AS"], holds: 1, undealt: 0, piles: [12, 6], sweeps: [2, 0] });
  const slots = layout(s, { sweeps: { you: [{ code: "7C", at: 3 }, { code: "9D", at: 8 }], them: [] } });
  const pile = slots.filter((x) => x.zone === "your-pile").sort((a, b) => a.index - b.index);
  assert.deepEqual(pile.map((x) => x.index), [...Array(12).keys()]);
  for (let i = 1; i < pile.length; i++) assert.ok(pile[i].pose.position.y > pile[i - 1].pose.position.y, "each card above the one before");
  const [first, second] = ["7C", "9D"].map((c) => slots.find((x) => x.code === c));
  assert.ok(first.pose.position.y < pile[11].pose.position.y, "covered by what came after");
  assert.notEqual(first.pose.position.x, second.pose.position.x, "each a little along from the last");
  // The plain cards keep their keys as sweeps are laid on them.
  assert.deepEqual(
    pile.filter((x) => !x.code).map((x) => x.key),
    [...Array(10).keys()].map((i) => `your-pile:${i}`),
  );
});

test("a finished hand's counted aces and Cassinos lie face up before their taker's pile, in the count's order", () => {
  const scored = {
    kind: "scored",
    hand: 1,
    count: {
      lines: [
        { item: "cards", suit: null, who: "you", points: 3 },
        { item: "big_casino", suit: null, who: "them", points: 2 },
        { item: "ace", suit: "S", who: "you", points: 1 },
        { item: "ace", suit: "D", who: "you", points: 1 },
        { item: "sweeps", suit: null, who: "you", points: 1 },
      ],
    },
  };
  const s = { ...state({ hand: [], holds: 0, undealt: 0, piles: [30, 22], sweeps: [1, 0] }), hand_number: 1, events: [scored] };
  const slots = layout(s, { sweeps: { you: [{ code: "9C", at: 12 }], them: [] } });
  assert.equal(slots.length, 52);
  const row = (zone) => slots.filter((x) => x.zone === zone).sort((a, b) => a.index - b.index);
  assert.deepEqual(row("your-count").map((x) => x.code), ["AS", "AD"]);
  assert.deepEqual(row("their-count").map((x) => x.code), ["TD"]);
  assert.ok(row("your-count").every((x) => x.faceUp));
  assert.equal(row("your-pile").length, 28);
  assert.equal(row("their-pile").length, 21);
  // Toward the middle, clear of the pile.
  const [ace] = row("your-count");
  assert.ok(ace.pose.position.x < ZONES.yourPile.x - CARD.width);
  assert.ok(slots.find((x) => x.code === "9C"), "the sweep card still lies in the pile");
  // Mid-hand, nothing is counted.
  const playing = { ...s, hand_number: 2 };
  assert.equal(layout(playing).filter((x) => x.zone.endsWith("count")).length, 0);
});

test("a counted card that made a sweep comes out of its place in the pile", () => {
  const scored = { kind: "scored", hand: 1, count: { lines: [{ item: "ace", suit: "H", who: "you", points: 1 }] } };
  const s = { ...state({ hand: [], holds: 0, undealt: 0, piles: [10, 42], sweeps: [1, 0] }), hand_number: 1, events: [scored] };
  const slots = layout(s, { sweeps: { you: [{ code: "AH", at: 4 }], them: [] } });
  assert.equal(slots.filter((x) => x.code === "AH").length, 1);
  assert.equal(slots.find((x) => x.code === "AH").zone, "your-count");
  const pile = slots.filter((x) => x.zone === "your-pile").sort((a, b) => a.index - b.index);
  assert.equal(pile.length, 9);
  assert.deepEqual(pile.map((x) => x.key), [...Array(9).keys()].map((i) => `your-pile:${i}`), "the plain cards stay as they were");
});

test("the stock lies at the dealer's left", () => {
  const theirs = layout(state({ hand: ["AS"], dealer: "them" })).find((x) => x.zone === "stock").pose.position;
  const yours = layout(state({ hand: ["AS"], dealer: "you" })).find((x) => x.zone === "stock").pose.position;
  assert.ok(theirs.x > 0 && yours.x < 0);
});

test("the hand card chosen stands up, and table cards picked rise", () => {
  const plain = layout(opening);
  const chosen = layout(opening, { chosen: "7H", picked: ["4D"] });
  const y = (slots, c) => slots.find((x) => x.code === c).pose.position.y;
  assert.ok(y(chosen, "7H") > y(plain, "7H"));
  assert.ok(y(chosen, "4D") > y(plain, "4D"));
  assert.equal(y(chosen, "AS"), y(plain, "AS"));
});

import { existsSync, readFileSync } from "node:fs";
import { loadEngine } from "../src/engine.js";
import { sweepCards } from "../src/layout.js";
import { countLines, countOf } from "../src/scorebug.js";

test("sweep cards come from the events of the hand under way, at their height in the pile", () => {
  const played = (you, c, hand = 2, taken = 1) => ({ kind: "played", you, card: { card: c }, hand, type: "take", taken: Array(taken).fill({}) });
  const events = [
    played(true, "7C", 1),
    { kind: "swept", you: true, hand: 1 },
    played(false, "9D", 2, 2),
    { kind: "swept", you: false, hand: 2 },
    played(true, "2H"),
    { ...played(false, "5S"), type: "trail" },
    played(false, "KS"),
    { kind: "swept", you: false, hand: 2 },
  ];
  assert.deepEqual(sweepCards(events, 2), {
    you: [],
    them: [
      { code: "9D", at: 2 },
      { code: "KS", at: 4 },
    ],
  });
  assert.deepEqual(sweepCards(events, 1), { you: [{ code: "7C", at: 1 }], them: [] });
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("real games lay out 52 cards at every step, faces only where seen", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  for (const seed of [1, 2, 3]) {
    let state = engine.start({ game: seed === 2 ? "royal" : "classic", skill: 3, seed });
    for (let n = 0; state.prompt !== "over"; n++) {
      const slots = layout(state, { sweeps: sweepCards(state.events, state.hand_number) });
      assert.equal(slots.length, 52, `seed ${seed} step ${n}`);
      assert.equal(new Set(slots.map((s) => s.key)).size, 52);
      const seen = new Set([...state.hand.map((c) => c.card), ...state.table.flatMap((i) => i.cards.map((c) => c.card))]);
      const sweeps = sweepCards(state.events, state.hand_number);
      for (const l of countLines(countOf(state))) if (l.code) seen.add(l.code);
      for (const who of ["you", "them"]) {
        assert.equal(sweeps[who].length, state.piles[who].sweeps, `${who} sweeps, seed ${seed} step ${n}`);
        for (const s of sweeps[who]) {
          assert.ok(s.at < state.piles[who].cards, "a sweep lies in its holder's pile");
          seen.add(s.code);
        }
      }
      for (const s of slots) {
        if (s.code) assert.ok(seen.has(s.code), `${s.code} shown in ${s.zone}`);
      }
      const command = state.prompt === "play" ? state.moves[n % state.moves.length] : "next";
      state = engine.send(command).state;
    }
  }
});

// The seventh play-testing: "remove the option to replay a game with both
// hands visible." Nothing lays your opponent's hand out face up any more,
// whatever the view asks.
test("your opponent's hand is never laid out face up: the replay with both hands is gone", () => {
  const slots = layout(opening, { theirs: ["2H", "3H", "4H", "5H"] }).filter((s) => s.zone === "their-hand");
  assert.equal(slots.length, 4);
  for (const s of slots) assert.ok(!s.faceUp && s.code === null, s.key);
});

// The seventh play-testing: "On mobile and ipad, don't bother fanning the
// cards in the player's hand, just space them wide." On a touch screen
// (ZONES_PORTRAIT, the phone's and the upright tablet's; ZONES_TOUCH, a
// tablet held sideways) your hand is a row: every card turned alike, side
// by side with room between them.
test("on a touch screen your hand is a row, spaced wide, not fanned", async () => {
  const { ZONES_PORTRAIT, ZONES_TOUCH } = await import("../src/units.js");
  for (const zones of [ZONES_PORTRAIT, ZONES_TOUCH]) {
    const hand = layout(opening, { zones }).filter((s) => s.zone === "your-hand").sort((a, b) => a.pose.position.x - b.pose.position.x);
    assert.equal(hand.length, 4);
    for (const s of hand) assert.ok(s.pose.quaternion.angleTo(hand[0].pose.quaternion) < 1e-6, `${s.code} turned unlike the rest`);
    for (let i = 1; i < hand.length; i++) {
      const gap = hand[i].pose.position.x - hand[i - 1].pose.position.x - CARD.width;
      assert.ok(gap >= 1, `${hand[i - 1].code} and ${hand[i].code} ${gap.toFixed(2)} cm apart`);
    }
  }
});

// The user: "look at the spacing between the cards that are in the users
// hand when they have four, and compare that to how little space there is
// between the cards that are held up and the cards on the outside that are
// faced down. Please make the spacing ... uniform." Your pile at the
// row's right and the stock at its left (your deal) lie as far from its
// outer cards as its cards from each other.
test("on a touch screen the face-down cards beside your row are spaced as its cards are", async () => {
  const { ZONES_PORTRAIT, ZONES_TOUCH } = await import("../src/units.js");
  for (const zones of [ZONES_PORTRAIT, ZONES_TOUCH]) {
    const slots = layout(state({ hand: ["AS", "7H", "TD", "KC"], piles: [6, 0], dealer: "you" }), { zones });
    const xs = slots.filter((s) => s.zone === "your-hand").map((s) => s.pose.position.x).sort((a, b) => a - b);
    const gap = zones.yourHand.gap;
    const pile = slots.find((s) => s.zone === "your-pile").pose.position.x;
    const stock = slots.find((s) => s.zone === "stock").pose.position.x;
    assert.ok(Math.abs(pile - CARD.width / 2 - (xs[3] + CARD.width / 2) - gap) < 0.05, `pile ${pile.toFixed(2)}, the row ends at ${(xs[3] + CARD.width / 2).toFixed(2)}`);
    assert.ok(Math.abs(xs[0] - CARD.width / 2 - (stock + CARD.width / 2) - gap) < 0.05, `stock ${stock.toFixed(2)}, the row starts at ${(xs[0] - CARD.width / 2).toFixed(2)}`);
  }
});

// The user: "A option (which default to on) should be that cards and
// [builds] on the table, dynamically automatically sort in descending
// order, left to right." Highest first, a build by its value, a loose card
// by its rank (an ace one, a king thirteen), equal ones as they came;
// across the first row, then the next. Off, as they came.
test("the table sorted: highest first, left to right, a build by its value", async () => {
  const { tableOrder } = await import("../src/layout.js");
  const s = state({
    hand: ["AS"],
    table: [
      [1, ["3S"]],
      [2, ["KD"]],
      [3, ["2H", "5C"], { value: 7, multiple: false, controller: "you" }],
      [4, ["AC"]],
      [5, ["7D"]],
      [6, ["9C"]],
      [7, ["QH"]],
    ],
  });
  assert.deepEqual(tableOrder(s.table, true).map((i) => i.id), [2, 7, 6, 3, 5, 1, 4]);
  assert.deepEqual(tableOrder(s.table, false).map((i) => i.id), [1, 2, 3, 4, 5, 6, 7]);
  const at = (sort) => {
    const slots = layout(s, { sort }).filter((x) => x.zone === "middle");
    const place = (id) => slots.find((x) => x.item === id).pose.position;
    return [1, 2, 3, 4, 5, 6, 7].map(place);
  };
  const sorted = at(true);
  // The first row's six, left to right: K, Q, 9, the build of 7, 7, 3; the ace next row.
  const firstRow = [2, 7, 6, 3, 5, 1].map((id) => sorted[id - 1]);
  for (let k = 1; k < firstRow.length; k++) assert.ok(firstRow[k].x > firstRow[k - 1].x && Math.abs(firstRow[k].z - firstRow[0].z) < 2.5, `item ${k}`);
  assert.ok(sorted[3].z < firstRow[0].z - 5, "the ace in the row beyond");
  assert.deepEqual(at(false)[0], layout(s).filter((x) => x.zone === "middle")[0].pose.position, "off, as they came, as the layout always laid them");
});
