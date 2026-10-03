// The engine module, built: without it the tests that play real games would
// skip, and the suite would pass while proving little (the table review's
// Q2). bin/gate builds it before the Node tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

test("the engine's WebAssembly module is built, so no real-game test skips", () => {
  const wasm = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);
  assert.ok(existsSync(wasm), "build it: cargo build --release -p cassino-wasm --lib --target wasm32-unknown-unknown");
});
