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

// The review at the game's end (the user: "when the game is over, put a
// button on-screen that says something like 'Review how you did?'"): none
// while it is played, then the engine's words; worked out on asking, so it
// must be quick enough to ask for at a tap.
test("the review comes once the game is over, quickly", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  let state = engine.start({ game: "royal", aces14: true, sweeps: false, skill: 3, seed: 21 });
  assert.equal(engine.review(), null, "not while the game is played");
  for (let n = 0; state.prompt !== "over"; n++) state = engine.send(state.prompt === "play" ? state.moves[(n * 5) % state.moves.length] : "next").state;
  const started = performance.now();
  const review = engine.review();
  const ms = performance.now() - started;
  assert.match(review.summary, /^You made \d+ choices/);
  assert.ok(Array.isArray(review.strengths) && Array.isArray(review.tries));
  for (const t of review.tries) assert.ok(t.title && t.text);
  assert.ok(review.closing && review.method);
  assert.ok(ms < 3000, `the review took ${ms.toFixed(0)} ms`);
  engine.watch({ game: "classic", skills: [2, 2], seed: 4 });
  assert.equal(engine.review(), null, "nobody to review in a watched game");
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
