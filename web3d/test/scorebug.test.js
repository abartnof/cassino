// The score, the trackers and the count: pure functions of the state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { celebrationOf, countLines, countOf, lineCard, lineLabel, trackerTable, trackers } from "../src/scorebug.js";
import { loadEngine } from "../src/engine.js";

const line = (item, who, points, suit = null) => ({ item, suit, who, points });

test("the count's lines in words, and the cards they name", () => {
  assert.equal(lineLabel(line("cards", "you", 3)), "Most cards");
  assert.equal(lineLabel(line("ace", "them", 1, "H")), "Ace of hearts");
  assert.equal(lineLabel(line("big_casino", "you", 2)), "Big Casino, 10♦");
  assert.equal(lineLabel(line("sweeps", "you", 1)), "A sweep");
  assert.equal(lineLabel(line("sweeps", "them", 3)), "3 sweeps");
  assert.equal(lineCard(line("ace", "them", 1, "H")), "AH");
  assert.equal(lineCard(line("big_casino", "you", 2)), "TD");
  assert.equal(lineCard(line("little_casino", "you", 1)), "2S");
  assert.equal(lineCard(line("spades", "you", 1)), null);
});

test("trackers follow the captures, and a clinch settles a point for both", () => {
  const state = {
    hand_number: 2,
    piles: {
      you: { cards: 27, spades: 3, aces: 1, big_casino: true, little_casino: false, sweeps: 2 },
      them: { cards: 10, spades: 5, aces: 0, big_casino: false, little_casino: true, sweeps: 0 },
    },
    events: [
      { kind: "clinched", hand: 1, you: false, what: "spades" },
      { kind: "clinched", hand: 2, you: true, what: "cards" },
    ],
  };
  const t = trackers(state);
  const get = (who, key) => t[who].find((x) => x.key === key);
  assert.equal(get("you", "cards").n, 27);
  assert.equal(get("you", "cards").done, true);
  assert.equal(get("them", "cards").lost, true);
  assert.equal(get("them", "spades").done, false, "a clinch of an earlier hand is over");
  assert.equal(get("you", "big_casino").have, true);
  assert.equal(get("them", "little_casino").have, true);
  assert.equal(get("you", "sweeps").n, 2);
});

test("the trackers as a table: a column for each point, a row for each player, a tip on each", () => {
  const state = {
    hand_number: 1,
    rules: { sweeps: false },
    piles: {
      you: { cards: 27, spades: 3, aces: 1, big_casino: true, little_casino: false, sweeps: 0 },
      them: { cards: 10, spades: 0, aces: 0, big_casino: false, little_casino: false, sweeps: 0 },
    },
    events: [{ kind: "clinched", hand: 1, you: true, what: "cards" }],
  };
  const table = trackerTable(trackers(state));
  assert.deepEqual(table.columns.map((c) => c.head), ["Cards", "Spades", "Aces", "10♦", "2♠"], "no sweeps column when sweeps are not scored");
  assert.ok(table.columns.every((c) => c.tip.length > 20), "every column says what it counts and what it scores");
  assert.match(table.columns[0].tip, /27/);
  assert.deepEqual(table.rows.map((r) => r.name), ["Opp", "You"], "your opponent's row above yours, as they sit across the table");
  const cell = (who, key) => table.rows.find((r) => r.who === who).cells.find((c) => c.key === key);
  // Values only in the cells; the meaning is in the headers and the tips.
  assert.equal(cell("you", "cards").text, "27");
  assert.equal(cell("you", "spades").text, "3");
  assert.equal(cell("you", "big_casino").text, "✓");
  assert.equal(cell("them", "big_casino").text, "–");
  assert.equal(cell("you", "cards").look, "won");
  assert.equal(cell("them", "cards").look, "lost");
  assert.equal(cell("them", "big_casino").look, "lost", "the other player has it");
  assert.equal(cell("them", "little_casino").look, "none", "still out");
  assert.equal(cell("them", "spades").look, "none");
  assert.match(cell("you", "cards").tip, /most cards is yours/i);
  assert.match(cell("them", "cards").tip, /10 cards/);
  assert.match(cell("you", "spades").tip, /4 more/, "how far from certain");
  assert.equal(cell("them", "big_casino").tip, "You took Big Casino.");
  assert.match(cell("them", "little_casino").tip, /not taken yet/i);
  // A watched game names its seats.
  const watched = trackerTable(trackers(state), { watching: true });
  assert.deepEqual(watched.rows.map((r) => r.name), ["North", "South"]);
  assert.match(watched.rows[0].cells[0].tip, /^North has taken 10 cards/);
});

test("a celebration on the table for each line of the count: its words, its points, where", () => {
  assert.deepEqual(celebrationOf({ item: "big_casino", who: "you", points: 2 }), { label: "Big Casino", pts: 2, card: "TD", pile: "you" });
  assert.deepEqual(celebrationOf({ item: "little_casino", who: "them", points: 1 }), { label: "Little Casino", pts: 1, card: "2S", pile: "them" });
  assert.deepEqual(celebrationOf({ item: "ace", suit: "H", who: "you", points: 1 }), { label: "Ace", pts: 1, card: "AH", pile: "you" });
  assert.deepEqual(celebrationOf({ item: "cards", who: "them", points: 3 }), { label: "Most cards", pts: 3, card: null, pile: "them" });
  assert.deepEqual(celebrationOf({ item: "spades", who: "you", points: 1 }), { label: "Most spades", pts: 1, card: null, pile: "you" });
  assert.equal(celebrationOf({ item: "sweeps", who: "you", points: 2 }), null, "a sweep is celebrated as it is made");
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("over real games: a count at every hand's end, naming the cards it counts", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  for (const seed of [3, 4]) {
    let state = engine.start({ game: seed === 4 ? "royal" : "classic", skill: 2, seed });
    for (let n = 0; state.prompt !== "over"; n++) {
      if (state.prompt === "play") {
        assert.equal(countOf(state), null, "no count while the hand is played");
        state = engine.send(state.moves[(n * 5) % state.moves.length]).state;
        continue;
      }
      const lines = countLines(countOf(state));
      assert.ok(lines.length, `seed ${seed}: a count at the end of hand ${state.hand_number}`);
      for (const l of lines) if (["ace", "big_casino", "little_casino"].includes(l.item)) assert.ok(l.code);
      state = engine.send("next").state;
    }
    assert.ok(countOf(state));
  }
});
