// The staging test: how far the table's cards reach from the eye of a phone
// held upright, over whole games (units.js CAMERA_PORTRAIT.reach), so the
// framing can fit the table between the overlay's strips without losing a
// card (framing.js). As piquet's staging test measures its own.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { Vector3 } from "three";
import { cardCorners } from "../src/kinematics.js";
import { layout, sweepCards } from "../src/layout.js";
import { loadEngine } from "../src/engine.js";
import { CAMERA_PORTRAIT, ZONES_PORTRAIT } from "../src/units.js";

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

// The camera's frame: tangents up, down and across of a point.
const eye = new Vector3(...CAMERA_PORTRAIT.position);
const forward = new Vector3(...CAMERA_PORTRAIT.target).sub(eye).normalize();
const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
const up = new Vector3().crossVectors(right, forward);
function tangents(p) {
  const d = p.clone().sub(eye);
  const z = d.dot(forward);
  return { x: d.dot(right) / z, y: d.dot(up) / z };
}

export async function measure(games = [[1, "classic"], [2, "royal"], [3, "classic"], [4, "royal"]]) {
  const engine = await loadEngine(readFileSync(WASM));
  const reach = { up: -Infinity, down: Infinity, across: 0 };
  const see = (slots) => {
    for (const s of slots) {
      for (const c of cardCorners(s.pose)) {
        const t = tangents(c);
        reach.up = Math.max(reach.up, t.y);
        reach.down = Math.min(reach.down, t.y);
        reach.across = Math.max(reach.across, Math.abs(t.x));
      }
    }
  };
  for (const [seed, game] of games) {
    let s = engine.start({ game, aces14: game === "royal", sweeps: true, skill: 3, seed });
    for (let n = 0; s.prompt !== "over" && n < 500; n++) {
      const sweeps = sweepCards(s.events, s.hand_number);
      see(layout(s, { sweeps, zones: ZONES_PORTRAIT }));
      // A card chosen stands up out of the hand, and a build picked rises.
      if (s.hand.length) see(layout(s, { sweeps, zones: ZONES_PORTRAIT, chosen: s.hand[n % s.hand.length].card, picked: s.table.flatMap((i) => i.cards.map((c) => c.card)) }));
      s = engine.send(s.prompt === "play" ? s.moves[(n * 7) % s.moves.length] : "next").state;
    }
  }
  return reach;
}

test("the portrait camera's reach holds every card of whole games, and no more than a little besides", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const reach = await measure();
  const r = CAMERA_PORTRAIT.reach;
  assert.ok(r.up >= reach.up, `up ${r.up} < ${reach.up.toFixed(3)}`);
  assert.ok(r.down <= reach.down, `down ${r.down} > ${reach.down.toFixed(3)}`);
  assert.ok(r.across >= reach.across, `across ${r.across} < ${reach.across.toFixed(3)}`);
  // Not loose: a few per cent of margin, so the table fills its band.
  assert.ok(r.up - reach.up < 0.03 && reach.down - r.down < 0.03 && r.across - reach.across < 0.03, `measured ${JSON.stringify(reach)}`);
});
