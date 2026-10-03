// The score HUD's model: the per-hand ledger, derived from the events, and
// the scoring events between two states (docs/TABLE3D.md section 8).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CATS, blank, handTotal, hudEvents, ledgerOf, ledgerTotals, segmentState } from "../src/hud.js";
import { loadEngine } from "../src/engine.js";

const line = (item, who, points, suit = null) => ({ item, suit, who, points });
const rules = { game: "classic", aces14: false, sweeps: true };

test("the six categories, in the counting order", () => {
  assert.deepEqual(CATS.map(([k]) => k), ["cards", "spades", "big", "little", "aces", "sweeps"]);
  const h = blank();
  h.aces.you = 3;
  h.big.opp = 2;
  assert.equal(handTotal(h, "you"), 3);
  assert.equal(handTotal(h, "opp"), 2);
});

test("a segment is reached, the cursor, or unreached; the line stops at 21", () => {
  assert.equal(segmentState(3, 5), "reached");
  assert.equal(segmentState(5, 5), "cursor");
  assert.equal(segmentState(6, 5), "unreached");
  assert.equal(segmentState(1, 0), "unreached", "a score of 0 lights nothing");
  assert.equal(segmentState(21, 24), "cursor", "past 21, the finish is the cursor");
  assert.equal(segmentState(20, 24), "reached");
});

test("the ledger: each counted hand, and the hand under way with its sweeps so far", () => {
  const events = [
    { kind: "dealt", hand: 1, deal: 1 },
    { kind: "swept", hand: 1, you: true },
    { kind: "scored", hand: 1, count: { lines: [line("cards", "you", 3), line("ace", "them", 1, "S"), line("ace", "them", 1, "D"), line("sweeps", "you", 1)] } },
    { kind: "dealt", hand: 2, deal: 1 },
    { kind: "swept", hand: 2, you: false },
  ];
  const ledger = ledgerOf({ events, rules });
  assert.equal(ledger.hands.length, 1);
  assert.deepEqual(ledger.hands[0].cards, { you: 3, opp: 0 });
  assert.deepEqual(ledger.hands[0].aces, { you: 0, opp: 2 });
  assert.deepEqual(ledger.hands[0].sweeps, { you: 1, opp: 0 });
  assert.deepEqual(ledger.live.sweeps, { you: 0, opp: 1 });
  assert.deepEqual(ledgerTotals(ledger), { you: 4, opp: 3 });
  // Without sweeps scored, a sweep is not a point.
  const plain = ledgerOf({ events, rules: { ...rules, sweeps: false } });
  assert.deepEqual(plain.live.sweeps, { you: 0, opp: 0 });
});

test("the events between two states: sweeps as they happen; the count with the aces together and its sweeps already shown", () => {
  const events = [
    { kind: "dealt", hand: 1, deal: 1 },
    { kind: "swept", hand: 1, you: false },
    {
      kind: "scored",
      hand: 1,
      count: {
        lines: [
          line("cards", "you", 3),
          line("big_casino", "them", 2),
          line("ace", "you", 1, "S"),
          line("ace", "them", 1, "C"),
          line("ace", "you", 1, "H"),
          line("sweeps", "them", 1),
        ],
      },
    },
  ];
  const out = hudEvents({ events, rules }, 1);
  assert.deepEqual(
    out.map((e) => (e.end ? "end" : `${e.side}:${e.cat}:${e.pts}@${e.line ?? "-"}`)),
    ["opp:sweeps:1@-", "you:cards:3@0", "opp:big:2@1", "you:aces:2@2", "opp:aces:1@3", "end"],
  );
  assert.equal(out[0].label, "Sweep");
  assert.equal(out[3].label, "Aces");
  assert.equal(out.at(-1).line, 6, "the hand ends once its count has been said");
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("over real games the ledger adds up to the game's score, and its events to the ledger", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  for (const [seed, sweeps] of [[3, true], [6, false], [9, true]]) {
    let s = engine.watch({ game: "classic", sweeps, skills: [3, 3], seed });
    let since = 0;
    let shown = ledgerOf({ ...s, events: s.events.slice(0, 0) });
    let running = ledgerTotals(ledgerOf(s));
    while (s.prompt !== "over") {
      s = engine.step().state;
      // Played out, the events take the totals where the ledger says.
      for (const e of hudEvents(s, since)) if (!e.end) running = { ...running, [e.side]: running[e.side] + e.pts };
      since = s.events.length;
      const ledger = ledgerOf(s);
      assert.deepEqual(running, ledgerTotals(ledger), `seed ${seed}: the events agree with the ledger`);
      const live = ledger.live ? { you: handTotal(ledger.live, "you"), opp: handTotal(ledger.live, "opp") } : { you: 0, opp: 0 };
      assert.deepEqual(ledgerTotals(ledger), { you: s.scores.you + live.you, opp: s.scores.them + live.opp }, `seed ${seed}: the ledger is the game's score and the live sweeps`);
      shown = ledger;
    }
    assert.ok(shown.hands.length >= 2);
  }
});
