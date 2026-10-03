// The score, the trackers and the count: pure functions of the state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { countLines, countOf, history, lineCard, lineLabel, period, scoreAfter, standing, trackers } from "../src/scorebug.js";
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

test("the score ticks line by line from the totals before the hand", () => {
  const lines = [line("cards", "you", 3), line("spades", "them", 1), line("big_casino", "you", 2)];
  assert.deepEqual(scoreAfter({ you: 10, them: 12 }, lines, 0), { you: 10, them: 12 });
  assert.deepEqual(scoreAfter({ you: 10, them: 12 }, lines, 2), { you: 13, them: 13 });
  assert.deepEqual(scoreAfter({ you: 10, them: 12 }, lines, 3), { you: 15, them: 13 });
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

test("the period: the hand, and the deal of six", () => {
  assert.equal(period({ hand_number: 2, deal: 3 }), "Hand 2 · Deal 3 of 6");
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("over real games: the count adds up to the totals, and the sheet keeps every hand", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  for (const seed of [3, 4]) {
    let state = engine.start({ game: seed === 4 ? "royal" : "classic", skill: 2, seed });
    let hands = 0;
    for (let n = 0; state.prompt !== "over"; n++) {
      if (state.prompt === "play") {
        assert.equal(countOf(state), null, "no count while the hand is played");
        const s = standing(state);
        assert.deepEqual(s.before, s.after);
        state = engine.send(state.moves[(n * 5) % state.moves.length]).state;
        continue;
      }
      // The hand is over: its count, line by line, makes the new totals.
      const scored = countOf(state);
      assert.ok(scored, `seed ${seed}: a count at the end of hand ${state.hand_number}`);
      const lines = countLines(scored);
      const s = standing(state);
      assert.deepEqual(scoreAfter(s.before, lines, lines.length), s.after);
      for (const l of lines) if (["ace", "big_casino", "little_casino"].includes(l.item)) assert.ok(l.code);
      hands++;
      assert.equal(history(state.events).length, hands);
      state = engine.send("next").state;
    }
    const sheet = history(state.events);
    assert.deepEqual(sheet.at(-1).totals, state.scores);
    const scored = countOf(state);
    const s = standing(state);
    assert.deepEqual(scoreAfter(s.before, countLines(scored), countLines(scored).length), s.after);
  }
});
