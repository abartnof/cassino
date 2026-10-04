// The page's wrapper around the WebAssembly module, against the module itself
// (built by `cargo build --release -p cassino-wasm --lib --target
// wasm32-unknown-unknown`, which web3d/build.py does).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { loadEngine } from "../src/engine.js";

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("the engine plays a game through the protocol", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  let state = engine.start({ game: "royal", aces14: true, sweeps: true, skill: 2, seed: 5 });
  assert.equal(state.rules.game, "royal");
  assert.equal(state.prompt, "play");
  const card = state.hand[0].card;
  const offer = engine.offer(card);
  assert.equal(engine.reveal(), null, "nothing revealed while the game is played");
  assert.ok(Array.isArray(offer.moves));
  const refused = engine.send("trail ZZ");
  assert.equal(refused.ok, false);
  assert.equal(refused.state.error_code, "not_a_move");
  for (let n = 0; state.prompt !== "over"; n++) {
    const command = state.prompt === "play" ? state.moves[n % state.moves.length] : "next";
    const sent = engine.send(command);
    assert.ok(sent.ok, `${command}: ${sent.state.error}`);
    state = sent.state;
  }
  assert.ok(state.events.some((e) => e.kind === "game_ends"));
  // Once over, and only then, every hand's deals.
  const revealed = engine.reveal();
  assert.equal(revealed.hands.length, state.events.filter((e) => e.kind === "hand_ends").length);
  assert.equal(engine.send(state.moves[0] ?? "trail AS").state.error_code, "game_over");
  const restored = engine.restore(state.saved);
  assert.ok(restored.ok);
  assert.equal(restored.state.saved, state.saved);
  assert.equal(engine.restore("nonsense").ok, false);
});

// "Raise builds" (play-testing asked for the choice): on, as the rules have
// it, unless the sitting is started with it off; then no build is raised,
// and a raise asked for is refused with its reason.
test("with raising off, no build is raised in a whole game, and the state says so", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  assert.equal(engine.start({ game: "classic", seed: 5 }).rules.raising, true);
  let raisesOn = 0;
  for (const raising of [true, false]) {
    for (const seed of [5, 6, 7]) {
      let s = engine.start({ game: seed === 6 ? "royal" : "classic", raising, skill: 3, seed });
      assert.equal(s.rules.raising, raising);
      for (let n = 0; s.prompt !== "over" && n < 500; n++) {
        s = engine.send(s.prompt === "play" ? s.moves[(n * 5) % s.moves.length] : "next").state;
      }
      const raised = s.events.filter((e) => e.kind === "played" && e.build_kind === "raise").length;
      if (raising) raisesOn += raised;
      else assert.equal(raised, 0, `seed ${seed}`);
    }
  }
  assert.ok(raisesOn > 0, "with it on, the same games raise");
});
