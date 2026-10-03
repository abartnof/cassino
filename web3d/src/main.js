// Cassino at a three-dimensional table.
//
// A client of the table protocol (docs/PROTOCOL.md): it draws the engine's
// state and sends back commands, and holds no rules. The plan is
// docs/TABLE3D.md; this is phase T0, the scaffold: the engine, the scene and
// the art, with the table's opening cards laid out in a row.

import { loadTextures } from "./art.js";
import { createDeck, place } from "./deck.js";
import { decodeBase64, loadEngine } from "./engine.js";
import { lying } from "./kinematics.js";
import { createScene } from "./scene.js";
import { chooseSurface } from "./surfaces.js";
import { CARD } from "./units.js";

/* global WASM_BASE64, ART */

const params = new URL(window.location.href).searchParams;

async function main() {
  const engine = await loadEngine(decodeBase64(WASM_BASE64));
  const seed = Number(params.get("seed")) || Math.floor(Math.random() * 2 ** 31);
  const state = engine.start({ game: params.get("game") ?? "classic", skill: 4, seed });
  const stage = createScene(document.getElementById("stage"), {
    table: chooseSurface({ chosen: params.get("table") ?? "random", saved: null }),
  });
  const anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
  const textures = await loadTextures(ART, { anisotropy, pixelRatio: stage.renderer.getPixelRatio() });
  const deck = createDeck(stage, textures);
  // The table's cards in a row across the middle, face up.
  const items = state.table;
  items.forEach((item, i) => {
    const mesh = deck.card(item.cards[0].card);
    const x = (i - (items.length - 1) / 2) * (CARD.width + 1.5);
    place(mesh, lying({ x, z: -6, height: 0.02 }));
  });
  stage.render();
  document.getElementById("loading").remove();
  // For the browser test.
  window.cassino3d = { engine, state };
}

main().catch((error) => {
  console.error(error);
  const loading = document.getElementById("loading");
  if (loading) loading.textContent = "The table could not be set.";
});
