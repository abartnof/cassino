// Cassino at a three-dimensional table.
//
// A client of the table protocol (docs/PROTOCOL.md): it draws the engine's
// state and sends back commands, and holds no rules. The plan is
// docs/TABLE3D.md. Phase T2: the state laid out at rest (layout.js), and a
// move chosen by tapping: a hand card, then the table cards to go with it,
// then the chip that says what to do with them (selection.js, overlay.js).

import { Raycaster, Vector2, Vector3 } from "three";
import { loadTextures } from "./art.js";
import { createDeck, place } from "./deck.js";
import { decodeBase64, loadEngine } from "./engine.js";
import { layout, sweepCards } from "./layout.js";
import { createOverlay } from "./overlay.js";
import { createScene } from "./scene.js";
import { EMPTY, choose, chipsOf, itemState, pick, selectionText, whyNot } from "./selection.js";
import { chooseSurface } from "./surfaces.js";
import { CARD } from "./units.js";

/* global WASM_BASE64, ART */

const params = new URL(window.location.href).searchParams;

async function main() {
  const engine = await loadEngine(decodeBase64(WASM_BASE64));
  const settings = {
    game: params.get("game") ?? "classic",
    aces14: params.has("aces14"),
    sweeps: !params.has("nosweeps"),
    skill: Number(params.get("skill")) || 4,
  };
  const newSeed = () => Number(params.get("seed")) || Math.floor(Math.random() * 2 ** 31);
  let state = engine.start({ ...settings, seed: newSeed() });
  let sel = EMPTY;
  let offer = null;
  let message = null;

  const stage = createScene(document.getElementById("stage"), {
    table: chooseSurface({ chosen: params.get("table") ?? "random", saved: null }),
  });
  const anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
  const textures = await loadTextures(ART, { anisotropy, pixelRatio: stage.renderer.getPixelRatio() });
  const deck = createDeck(stage, textures);
  const overlay = createOverlay(document.getElementById("overlay"), {
    onChip: (chip) => {
      const sent = engine.send(chip.move);
      state = sent.state;
      message = sent.ok ? null : state.error;
      sel = EMPTY;
      refresh();
    },
    onNext: () => {
      state = engine.send("next").state;
      sel = EMPTY;
      refresh();
    },
    onNewGame: () => {
      state = engine.start({ ...settings, seed: newSeed() });
      sel = EMPTY;
      refresh();
    },
  });

  // One mesh per slot of the layout, keyed as the layout keys it.
  const meshes = new Map();
  const slotOf = new Map();
  function draw() {
    const slots = layout(state, {
      chosen: sel.chosen,
      picked: sel.picked,
      sweeps: sweepCards(state.events, state.hand_number),
    });
    const live = new Set();
    slotOf.clear();
    for (const slot of slots) {
      let mesh = meshes.get(slot.key);
      if (!mesh) {
        mesh = deck.card(null);
        meshes.set(slot.key, mesh);
      }
      deck.reveal(mesh, slot.code);
      place(mesh, slot.pose);
      const look = slot.zone === "middle" ? itemState(slot.code, offer, sel) : slot.code && slot.code === sel.chosen ? "picked" : "idle";
      deck.decorate(mesh, {
        line: look === "picked" ? "chosen" : look === "addable" ? "hint" : "plain",
        dim: look === "refused",
      });
      slotOf.set(mesh, slot);
      live.add(slot.key);
    }
    for (const [key, mesh] of meshes) {
      if (!live.has(key)) {
        stage.scene.remove(mesh);
        meshes.delete(key);
      }
    }
    stage.render();
    placeBadges();
  }

  // Where a point of the table is on the screen.
  function toScreen(p) {
    const q = p.clone().project(stage.camera);
    const rect = stage.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + ((q.x + 1) / 2) * rect.width, y: rect.top + ((1 - q.y) / 2) * rect.height };
  }

  // A badge just above each build's top card.
  function placeBadges() {
    const list = [];
    for (const item of state.table) {
      if (!item.build) continue;
      const top = meshes.get(item.cards[item.cards.length - 1].card);
      if (!top) continue;
      const at = toScreen(top.position.clone().add(new Vector3(0, 0, -CARD.height / 2 - 1)));
      list.push({ ...item.build, ...at });
    }
    overlay.placeBadges(list);
  }
  window.addEventListener("resize", placeBadges);

  function refresh() {
    offer = sel.chosen && state.prompt === "play" ? engine.offer(selectionText(sel)) : null;
    if (offer?.error) offer = null;
    draw();
    overlay.show({ state, chips: chipsOf(offer), sum: offer?.sum ?? null, message });
  }

  // A tap on a card.
  function tapped(slot) {
    message = null;
    if (state.prompt !== "play") return;
    if (slot.zone === "your-hand") {
      sel = choose(sel, slot.code);
    } else if (slot.zone === "middle") {
      if (!sel.chosen) {
        message = "Choose a card from your hand first.";
      } else if (itemState(slot.code, offer, sel) === "refused") {
        message = whyNot(slot.code, offer);
      } else {
        const item = state.table.find((i) => i.id === slot.item);
        sel = pick(sel, item.cards.map((c) => c.card));
      }
    }
    refresh();
  }

  const raycaster = new Raycaster();
  const canvas = stage.renderer.domElement;
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const ndc = new Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, stage.camera);
    const [hit] = raycaster.intersectObjects([...meshes.values()], false);
    if (hit) tapped(slotOf.get(hit.object));
  });

  refresh();
  document.getElementById("loading").remove();

  // For the browser test: where a card is on the screen (its centre, or near
  // the index corner for a card in a fanned hand), and the chips.
  window.cassino3d = {
    engine,
    state: () => state,
    meshes: () => meshes.size,
    faces: () => [...meshes.values()].filter((m) => m.userData.code).map((m) => m.userData.code),
    chips: () => overlay.chips(),
    screenPoint(code) {
      const mesh = meshes.get(code);
      if (!mesh) return null;
      const slot = slotOf.get(mesh);
      const local = slot.zone === "your-hand" ? new Vector3(-CARD.width / 2 + 0.8, CARD.height / 2 - 1.4, CARD.thickness / 2) : new Vector3(0, 0, CARD.thickness / 2);
      return toScreen(local.applyQuaternion(mesh.quaternion).add(mesh.position));
    },
  };
}

main().catch((error) => {
  console.error(error);
  const loading = document.getElementById("loading");
  if (loading) loading.textContent = "The table could not be set.";
});
