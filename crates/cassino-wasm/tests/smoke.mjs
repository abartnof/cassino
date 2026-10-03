// Plays whole games through the WebAssembly module in Node, as a page would:
// the state as JSON, one command at a time. Run after building the module:
//
//   cargo build --release -p cassino-wasm --lib --target wasm32-unknown-unknown
//   node crates/cassino-wasm/tests/smoke.mjs [games] [skill]
import { readFileSync } from "node:fs";

const path = new URL("../../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);
const { instance } = await WebAssembly.instantiate(readFileSync(path), {});
const w = instance.exports;
const decoder = new TextDecoder();
const encoder = new TextEncoder();

const out = () => JSON.parse(decoder.decode(new Uint8Array(w.memory.buffer, w.cassino_out(), w.cassino_out_len())));
const send = (command) => {
  const bytes = encoder.encode(command);
  new Uint8Array(w.memory.buffer, w.cassino_alloc(bytes.length), bytes.length).set(bytes);
  return w.cassino_send(bytes.length) === 1;
};

const games = Number(process.argv[2] ?? 3);
const skill = Number(process.argv[3] ?? 4);
let slowest = 0;
for (let seed = 1; seed <= games; seed++) {
  w.cassino_new(seed % 2, 1, 1, Math.round(skill * 1000), seed);
  let state = out();
  let sends = 0;
  const started = performance.now();
  while (state.prompt !== "over") {
    const command = state.prompt === "play" ? state.moves[0] : "next";
    const t = performance.now();
    if (!send(command)) throw new Error(`refused ${command}: ${out().error}`);
    slowest = Math.max(slowest, performance.now() - t);
    state = out();
    sends++;
  }
  const end = state.events.find((e) => e.kind === "game_ends");
  console.log(`seed ${seed}: ${end.text} ${sends} commands, ${((performance.now() - started) / sends).toFixed(1)} ms each`);
}
console.log(`slowest command (the opponent thinking included): ${slowest.toFixed(0)} ms`);
