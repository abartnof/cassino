// The build badges: which builds show their value while the cards move, and
// what each badge says.
import { test } from "node:test";
import assert from "node:assert/strict";
import { badgeText, badgeTitle, badgesShown } from "../src/badges.js";

const card = (code, label = code) => ({ card: code, label });
const build = (id, value, codes, { multiple = false, controller = "you" } = {}) => ({ id, cards: codes.map((c) => card(c)), build: { value, multiple, controller } });
const loose = (id, code) => ({ id, cards: [card(code)], build: null });

test("at rest, every build shows its badge, and nothing else does", () => {
  const after = { table: [loose(1, "5H"), build(2, 7, ["6S", "AS"]), build(3, 9, ["4C", "5D"], { controller: "them" })] };
  assert.deepEqual(badgesShown(after, after, false).map((i) => i.id), [2, 3]);
});

test("while the cards move, a build the move leaves alone keeps its badge", () => {
  const before = { table: [loose(1, "5H"), build(2, 7, ["6S", "AS"]), build(3, 9, ["4C", "5D"])] };
  // A trail elsewhere: both builds untouched.
  const trail = { table: [...before.table, loose(4, "KH")] };
  assert.deepEqual(badgesShown(before, trail, true).map((i) => i.id), [2, 3]);
  // The 9 raised to 10, the 7 untouched: the raised one waits for the rest.
  const raised = { table: [before.table[0], before.table[1], build(3, 10, ["4C", "5D", "AH"])] };
  assert.deepEqual(badgesShown(before, raised, true).map((i) => i.id), [2]);
  assert.deepEqual(badgesShown(before, raised, false).map((i) => i.id), [2, 3]);
  // The 7 taken: gone at once; a new build: shown once the cards rest.
  const taken = { table: [before.table[0], before.table[2], build(5, 8, ["5H", "3C"])] };
  assert.deepEqual(badgesShown(before, taken, true).map((i) => i.id), [3]);
});

test("a badge says the value, a multiple build its plural; its title, whose and of what", () => {
  const b = build(2, 7, ["6S", "AS"]);
  b.cards = [card("6S", "6♠"), card("AS", "A♠")];
  assert.equal(badgeText(b.build), "7");
  assert.equal(badgeText({ value: 8, multiple: true }), "8s");
  assert.equal(badgeTitle(b), "Your build of 7: 6♠ A♠");
  const theirs = build(3, 8, ["4C", "4D", "8H"], { multiple: true, controller: "them" });
  assert.equal(badgeTitle(theirs), "Your opponent's build of 8s: 4C 4D 8H");
});
