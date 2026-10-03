// Cassino at a three-dimensional table.
//
// A client of the table protocol (docs/PROTOCOL.md): it draws the engine's
// state and sends back commands, and holds no rules. The plan is
// docs/TABLE3D.md. Phase T3: a move chosen by tapping (selection.js,
// overlay.js), and every change of state played out on the cards by the
// director (director.js, choreography.js): the deal in twos, the trail, the
// build, the gather of a capture into its taker's pile.

import { Vector3 } from "three";
import { loadTextures } from "./art.js";
import { createDeck } from "./deck.js";
import { createDirector } from "./director.js";
import { decodeBase64, loadEngine } from "./engine.js";
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

  // The cards' lines while choosing: the hand card chosen and the table
  // cards picked in amber, what could join in cyan, what cannot dimmed.
  function decorate(placement, deck, meshes) {
    for (const m of placement) {
      const look = m.zone === "middle" ? itemState(m.code, offer, sel) : m.code && m.code === sel.chosen ? "picked" : "idle";
      deck.decorate(meshes[m.id], {
        line: look === "picked" ? "chosen" : look === "addable" ? "hint" : "plain",
        dim: look === "refused",
      });
    }
  }

  const director = createDirector({
    stage,
    deck,
    view: () => sel,
    decorate,
    rested: () => {
      placeBadges();
      show();
    },
    manual: params.has("manual"),
    speed: Number(params.get("speed")) || 1,
  });

  function advance(next) {
    state = next;
    sel = EMPTY;
    offer = null;
    overlay.placeBadges([]);
    director.advance(state);
    show();
  }

  const overlay = createOverlay(document.getElementById("overlay"), {
    onChip: (chip) => {
      const sent = engine.send(chip.move);
      message = sent.ok ? null : sent.state.error;
      advance(sent.state);
    },
    onNext: () => advance(engine.send("next").state),
    onNewGame: () => {
      state = engine.start({ ...settings, seed: newSeed() });
      sel = EMPTY;
      offer = null;
      overlay.placeBadges([]);
      director.restart(state, { dealt: true });
      show();
    },
  });

  // A badge just above each build's top card, once the cards are still.
  function placeBadges() {
    if (director.busy()) return overlay.placeBadges([]);
    const list = [];
    for (const item of state.table) {
      if (!item.build) continue;
      const top = director.meshOf(item.cards[item.cards.length - 1].card);
      if (!top) continue;
      const at = director.toScreen(top.position.clone().add(new Vector3(0, 0, -CARD.height / 2 - 1)));
      list.push({ ...item.build, ...at });
    }
    overlay.placeBadges(list);
  }
  window.addEventListener("resize", placeBadges);

  function show() {
    overlay.show({ state, chips: director.busy() ? [] : chipsOf(offer), sum: offer?.sum ?? null, message });
  }

  // The selection changed: ask the engine what it makes, and show it.
  function refresh() {
    offer = sel.chosen && state.prompt === "play" ? engine.offer(selectionText(sel)) : null;
    if (offer?.error) offer = null;
    director.rearrange();
    show();
  }

  // A tap on a card. While the cards are moving, a tap lands them.
  function tapped(slot) {
    if (director.busy()) {
      director.skip();
      return;
    }
    message = null;
    if (!slot || state.prompt !== "play") return;
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

  const canvas = stage.renderer.domElement;
  canvas.addEventListener("click", (event) => tapped(director.pick(event.clientX, event.clientY)));

  director.restart(state, { dealt: !params.has("nodeal") });
  show();
  document.getElementById("loading").remove();

  // For the browser test: where a card is on the screen, the chips, and the
  // clock (with ?manual, the test moves it by hand).
  window.cassino3d = {
    engine,
    state: () => state,
    meshes: () => director.meshes.length,
    faces: () => director.meshes.filter((m) => m.userData.code).map((m) => m.userData.code),
    chips: () => overlay.chips(),
    screenPoint: (code) => director.screenPoint(code),
    busy: () => director.busy(),
    skip: () => director.skip(),
    tick: (ms) => director.tick(ms),
  };
}

main().catch((error) => {
  console.error(error);
  const loading = document.getElementById("loading");
  if (loading) loading.textContent = "The table could not be set.";
});
