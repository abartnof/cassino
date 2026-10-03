// The replay after the game, with both hands face up: the record in steps,
// and your opponent's hand at each.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { commandsBetween, prefix, steps, stops, theirHand } from "../src/replay.js";
import { loadEngine } from "../src/engine.js";

const RECORD = "cassino record v1\nseed 21\nrules classic aces14=0 sweeps=1\nskill 3\naids hints=0 explain=0 play_forced=0\ntrail 7H\ntake 8S 8D\nnext\n*trail 2C\n";

test("the record's steps are its commands, and a prefix keeps the header", () => {
  assert.equal(steps(RECORD), 4);
  assert.equal(prefix(RECORD, 0), "cassino record v1\nseed 21\nrules classic aces14=0 sweeps=1\nskill 3\naids hints=0 explain=0 play_forced=0\n");
  assert.ok(prefix(RECORD, 2).endsWith("trail 7H\ntake 8S 8D\n"));
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("replayed step by step, your opponent's hand is what they hold, never a card you can see", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  let s = engine.start({ game: "royal", aces14: true, sweeps: true, skill: 2, seed: 31 });
  for (let n = 0; s.prompt !== "over"; n++) s = engine.send(s.prompt === "play" ? s.moves[(n * 3) % s.moves.length] : "next").state;
  const record = s.saved;
  const revealed = engine.reveal();
  const n = steps(record);
  assert.ok(n > 20);
  for (let k = 0; k < n; k += 3) {
    const r = engine.restore(prefix(record, k));
    assert.ok(r.ok, `step ${k}: ${r.error}`);
    const theirs = theirHand(r.state, revealed);
    assert.equal(theirs.length, r.state.opponent_holds, `step ${k}`);
    const seen = new Set([...r.state.hand.map((c) => c.card), ...r.state.table.flatMap((i) => i.cards.map((c) => c.card))]);
    for (const c of theirs) assert.ok(!seen.has(c), `step ${k}: ${c} is in their hand and in sight`);
  }
  assert.ok(engine.restore(record).ok);
});

test("the replay stops after each of your decisions, the table's forced moves with it", () => {
  // trail 7H | take 8S 8D | next, then the forced trail made by the table.
  assert.deepEqual(stops(RECORD), [0, 1, 2, 4]);
  assert.deepEqual(commandsBetween(RECORD, 2, 4), ["next"], "the forced move the engine makes itself");
});

test("stepping forward by sending, and back by restoring, reach the same positions", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  let s = engine.start({ game: "classic", sweeps: true, skill: 3, seed: 44 });
  s = engine.send("set play_forced on").state;
  for (let n = 0; s.prompt !== "over"; n++) s = engine.send(s.prompt === "play" ? s.moves[(n * 5) % s.moves.length] : "next").state;
  const record = s.saved;
  const at = stops(record);
  let r = engine.restore(prefix(record, at[0]));
  assert.ok(r.ok, r.error);
  for (let k = 1; k < at.length; k++) {
    for (const command of commandsBetween(record, at[k - 1], at[k])) assert.ok(engine.send(command).ok, `step ${k}: ${command}`);
    const forward = engine.state().saved;
    if (k % 7 === 0) {
      const back = engine.restore(prefix(record, at[k]));
      assert.ok(back.ok, back.error);
      assert.equal(back.state.saved, forward, `step ${k}: restored as stepped`);
    }
  }
  assert.equal(engine.state().saved, record, "stepped to the end, the record itself");
});

import { choreograph, initialPlacement } from "../src/choreography.js";
import { layout, sweepCards } from "../src/layout.js";

test("in the replay, the choreography keeps your opponent's hand face up and lands on the layout", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  let s = engine.start({ game: "classic", sweeps: true, skill: 2, seed: 52 });
  for (let n = 0; s.prompt !== "over"; n++) s = engine.send(s.prompt === "play" ? s.moves[(n * 3) % s.moves.length] : "next").state;
  const record = s.saved;
  const revealed = engine.reveal();
  const at = stops(record);
  let state = engine.restore(prefix(record, 0)).state;
  const view = { revealed };
  let placement = initialPlacement(state, view);
  for (let k = 1; k < Math.min(at.length, 25); k++) {
    for (const command of commandsBetween(record, at[k - 1], at[k])) engine.send(command);
    const next = engine.state();
    const result = choreograph(state, next, placement, view);
    const theirs = theirHand(next, revealed);
    const shown = result.placement.filter((m) => m.zone === "their-hand").map((m) => m.code).sort();
    assert.deepEqual(shown, [...theirs].sort(), `step ${k}: their hand face up`);
    const target = layout(next, { theirs, sweeps: sweepCards(next.events, next.hand_number) });
    for (const slot of target) assert.ok(result.placement.some((m) => m.pose.position.distanceTo(slot.pose.position) < 1e-9 && m.code === slot.code), `step ${k}: ${slot.key} landed`);
    placement = result.placement;
    state = next;
  }
});
