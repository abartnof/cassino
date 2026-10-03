// Cassino at a three-dimensional table.
//
// A client of the table protocol (docs/PROTOCOL.md): it draws the engine's
// state and sends back commands, and holds no rules. The plan is
// docs/TABLE3D.md. Phase T1: the state laid out at rest (layout.js), every
// card of the pack where it lies, faces only where the person may see them.

import { loadTextures } from "./art.js";
import { createDeck, place } from "./deck.js";
import { decodeBase64, loadEngine } from "./engine.js";
import { layout, sweepCards } from "./layout.js";
import { createScene } from "./scene.js";
import { chooseSurface } from "./surfaces.js";

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
  // One mesh per slot of the layout, keyed as the layout keys it.
  const meshes = new Map();
  function draw(s) {
    const slots = layout(s, { sweeps: sweepCards(s.events, s.hand_number) });
    const live = new Set();
    for (const slot of slots) {
      let mesh = meshes.get(slot.key);
      if (!mesh) {
        mesh = deck.card(null);
        meshes.set(slot.key, mesh);
      }
      deck.reveal(mesh, slot.code);
      place(mesh, slot.pose);
      live.add(slot.key);
    }
    for (const [key, mesh] of meshes) {
      if (!live.has(key)) {
        stage.scene.remove(mesh);
        meshes.delete(key);
      }
    }
    stage.render();
  }
  draw(state);
  document.getElementById("loading").remove();
  // For the browser test.
  window.cassino3d = {
    engine,
    state: () => state,
    meshes: () => meshes.size,
    faces: () => [...meshes.values()].filter((m) => m.userData.code).map((m) => m.userData.code),
  };
}

main().catch((error) => {
  console.error(error);
  const loading = document.getElementById("loading");
  if (loading) loading.textContent = "The table could not be set.";
});
