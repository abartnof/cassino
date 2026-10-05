#!/usr/bin/env node
// How often each kind of move is made (Take, Build, Trail), over whole
// games played by the computer at both seats: the move bar puts the most
// used at the far right, under a right thumb, the least used at the left
// (the seventh play-testing; selection.js KINDS, measurements/README.md).
//
//   node web3d/tools/moves.mjs [games] [skill]   # games of each variant
//
// The engine module must be built (bin/gate builds it). Prints the counts
// and shares for Royal and Classic Cassino, each with a 95% interval.

import { readFileSync } from "node:fs";
import { loadEngine } from "../src/engine.js";

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);
const games = Number(process.argv[2]) || 150;
const skill = Number(process.argv[3]) || 3;
const engine = await loadEngine(readFileSync(WASM));

function count(game) {
  const n = { take: 0, build: 0, trail: 0 };
  for (let seed = 1; seed <= games; seed++) {
    let s = engine.watch({ game, aces14: false, sweeps: false, raising: true, skills: [skill, skill], seed });
    for (let k = 0; s.prompt !== "over" && k < 2000; k++) s = engine.step().state;
    for (const e of s.events) if (e.kind === "played") n[e.type] += 1;
  }
  return n;
}

const started = Date.now();
for (const game of ["royal", "classic"]) {
  const n = count(game);
  const all = n.take + n.build + n.trail;
  const line = Object.entries(n)
    .sort((a, b) => a[1] - b[1])
    .map(([kind, k]) => {
      const p = k / all;
      const half = 1.96 * Math.sqrt((p * (1 - p)) / all);
      return `${kind} ${k} (${(100 * p).toFixed(1)}% ± ${(100 * half).toFixed(1)})`;
    });
  console.log(`${game}, ${games} games at skill ${skill}, ${all} moves, least to most: ${line.join(", ")}`);
}
console.log(`${((Date.now() - started) / 1000).toFixed(0)} s`);
