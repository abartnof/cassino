// The WebAssembly module in Node, as a page would use it: the state as JSON,
// one command at a time. Two checks:
//
// 1. The golden games (tests/golden.txt): scripted games must end in a state
//    whose JSON hashes exactly as the native build's did, so every build of
//    the engine plays alike, byte for byte.
// 2. Whole games against the opponent, timed.
//
//   cargo build --release -p cassino-wasm --lib --target wasm32-unknown-unknown
//   node crates/cassino-wasm/tests/smoke.mjs [games] [skill]
import { readFileSync } from "node:fs";

const path = new URL("../../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);
const { instance } = await WebAssembly.instantiate(readFileSync(path), {});
const w = instance.exports;
const decoder = new TextDecoder();
const encoder = new TextEncoder();

const bytes = () => new Uint8Array(w.memory.buffer, w.cassino_out(), w.cassino_out_len()).slice();
const out = () => JSON.parse(decoder.decode(bytes()));
const send = (command) => {
  const b = encoder.encode(command);
  new Uint8Array(w.memory.buffer, w.cassino_alloc(b.length), b.length).set(b);
  return w.cassino_send(b.length) === 1;
};

// FNV-1a, as cassino_wasm::fnv.
const fnv = (data) => {
  let h = 0xcbf29ce484222325n;
  for (const b of data) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h;
};

// 1. The golden games.
const golden = readFileSync(new URL("./golden.txt", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"));
let failures = 0;
for (const line of golden) {
  const [game, aces, sweeps, skill, seed, want] = line.trim().split(/\s+/);
  w.cassino_new(+game, +aces, +sweeps, +skill, +seed);
  let state = out();
  for (let n = 0; state.prompt !== "over"; n++) {
    const command = state.prompt === "play" ? state.moves[n % state.moves.length] : "next";
    if (!send(command)) throw new Error(`refused ${command}: ${out().error}`);
    state = out();
  }
  const got = fnv(bytes());
  if (got !== BigInt(want)) {
    failures++;
    console.log(`MISMATCH ${line}: the module's game hashes ${got}`);
  }
}
console.log(`golden games: ${golden.length - failures} of ${golden.length} play exactly as the native build`);

// 2. Whole games against the opponent.
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
process.exit(failures ? 1 : 0);
