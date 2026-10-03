// The director: the engine's states, choreographed, played out on the cards.
//
// It holds the 52 card meshes and where each one is; hands every change of
// state, or of how the person asks to see it, to the choreography; runs the
// motions on the timeline, turning faces up and down as they begin and land;
// has the cards decorated once they are still; and renders only while
// something moves, so a table at rest costs nothing.
//
// From piquet web3d/src/director.js @ 254cb3c: the clock that a gate can
// hold, the motions run on the timeline, picking and screen points. Cassino's
// takes states rather than an engine (the page sends the commands), and its
// decoration is the page's: `decorate(placement, deck, meshes)` runs whenever
// the cards come to rest or the view changes.

import { Raycaster, Vector2, Vector3 } from "three";
import { choreograph, initialPlacement, opening } from "./choreography.js";
import { cardCorners } from "./kinematics.js";
import { Timeline } from "./timeline.js";
import { CARD, ZONES } from "./units.js";

// `view()` is how the person asks to see the state: { chosen, picked }.
// `advance` and `restart` return { beats, count }: when each new event will
// be seen to happen, and each line of a hand's count said, in ms from now on
// the table's clock (for the dialogue and the score sheet; see `at`).
// `rested()` runs whenever the cards come to rest.
export function createDirector({ stage, deck, view, decorate, rested, manual = false, speed = 1 }) {
  const meshes = Array.from({ length: 52 }, () => deck.card(null));
  meshes.forEach((mesh, id) => (mesh.userData.id = id));
  let state = null;
  let placement = [];

  const timeline = new Timeline({
    apply: (id, pose) => {
      meshes[id].position.copy(pose.position);
      meshes[id].quaternion.copy(pose.quaternion);
    },
    speed,
  });

  function dress() {
    decorate?.(timeline.busy() ? [] : placement, deck, meshes);
    if (timeline.busy()) for (const m of placement) deck.decorate(meshes[m.id], {});
  }

  // ---- the clock ----------------------------------------------------------

  // The table's clock can stop: at a gate (a tutorial page, later) the cards
  // hold still until the gate is released, and then carry on from where they
  // were. Held time is taken off the clock, so everything scheduled on it
  // simply waits. Each entry is { at, gate, fn }: at a gate the clock stops
  // and `fn(release)` is called; otherwise `fn()` runs when its time comes.
  let manualNow = 0;
  const wall = () => (manual ? manualNow : performance.now());
  let offset = 0;
  let heldAt = null;
  const queue = [];
  const now = () => heldAt ?? wall() - offset;
  let running = false;
  function schedule(entry) {
    queue.push(entry);
    queue.sort((a, b) => a.at - b.at || b.gate - a.gate);
    wake();
  }
  function release() {
    if (heldAt === null) return;
    offset = wall() - heldAt;
    heldAt = null;
    wake();
  }
  function due(until) {
    while (queue.length && queue[0].at <= until && heldAt === null) {
      const entry = queue.shift();
      if (entry.gate) {
        heldAt = entry.at;
        timeline.tick(entry.at);
        stage.render();
        entry.fn(release);
        return true;
      }
      entry.fn();
    }
    return heldAt !== null;
  }
  // A frame: what is due runs, the cards move, and the table is drawn if
  // anything moved. The loop runs while cards move or something is due.
  let moving = false;
  function frame() {
    if (heldAt === null) {
      const held = due(now());
      if (!held) {
        const busy = timeline.tick(now());
        if (timeline.moved || moving) stage.render();
        moving = false;
        if ((busy || queue.length) && !manual) {
          requestAnimationFrame(frame);
          return;
        }
      }
    }
    running = false;
  }
  function wake() {
    if (manual) return frame();
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function settle(s, from = s) {
    timeline.skip();
    placement = initialPlacement(from, view());
    for (const m of placement) {
      deck.reveal(meshes[m.id], m.code);
      meshes[m.id].position.copy(m.pose.position);
      meshes[m.id].quaternion.copy(m.pose.quaternion);
    }
    state = s;
    dress();
    stage.render();
  }

  function animate(prev, next, waits = {}) {
    timeline.skip(); // anything still moving lands first
    const scaled = Object.fromEntries(Object.entries(waits).map(([k, ms]) => [k, ms * timeline.speed]));
    const result = choreograph(prev, next, placement, view(), { waits: scaled });
    placement = result.placement;
    state = next;
    const start = now();
    for (const m of result.motions) {
      const mesh = meshes[m.id];
      const reveal = m.reveal;
      timeline.add(
        {
          target: m.id,
          path: m.path,
          delay: m.delay,
          duration: m.duration,
          onStart: reveal && !reveal.atEnd ? () => deck.reveal(mesh, reveal.code) : undefined,
          onDone: reveal && reveal.atEnd ? () => deck.reveal(mesh, reveal.code) : undefined,
        },
        start,
      );
    }
    const beats = {};
    for (const [k, ms] of Object.entries(result.beats)) beats[k] = ms / timeline.speed;
    const count = result.count ? { at: result.count.at, lines: result.count.lines.map((ms) => ms / timeline.speed) } : null;
    timeline.idle().then(() => {
      dress();
      rested?.();
      moving = true; // drawn once more, dressed
      wake();
    });
    dress();
    moving = true;
    if (manual) frame();
    else wake();
    if (!timeline.busy()) rested?.();
    return { beats, count };
  }

  // ---- picking ------------------------------------------------------------

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  // The card under a point on the canvas, as its place at the table.
  function pick(clientX, clientY) {
    const rect = stage.renderer.domElement.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, stage.camera);
    const [hit] = raycaster.intersectObjects(meshes, false);
    return hit ? placement[hit.object.userData.id] : null;
  }

  // Where a point of the table is on the screen.
  function toScreen(p) {
    const q = p.clone().project(stage.camera);
    const rect = stage.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + ((q.x + 1) / 2) * rect.width, y: rect.top + ((1 - q.y) / 2) * rect.height };
  }

  // Where on the screen to point at a card so that it is the one hit: near
  // the index corner for a card in a fanned hand, its centre on the table.
  function screenPoint(code) {
    const m = placement.find((x) => x.code === code);
    if (!m) return null;
    const mesh = meshes[m.id];
    const local = m.zone === "your-hand" ? new Vector3(-CARD.width / 2 + 0.8, CARD.height / 2 - 1.4, CARD.thickness / 2) : new Vector3(0, 0, CARD.thickness / 2);
    return toScreen(local.applyQuaternion(mesh.quaternion).add(mesh.position));
  }

  // Where to speak from, on the screen: just above your hand's top edge, or
  // just below your opponent's lowest, near the middle of the table where
  // the eye already is (after piquet's director.js). From where the hand
  // rests once the cards have moved (a line can be said before a dealt
  // hand arrives); with no cards in it, from where the hand would be.
  function handEdge(who) {
    const zone = who === "you" ? "your-hand" : "their-hand";
    const points = placement
      .filter((m) => m.zone === zone)
      .flatMap((m) => cardCorners(m.pose).map(toScreen));
    if (!points.length) {
      const centre = ZONES[who === "you" ? "yourHand" : "theirHand"].centre;
      return { ...toScreen(new Vector3(...centre)), empty: true };
    }
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = who === "you" ? Math.min(...points.map((p) => p.y)) : Math.max(...points.map((p) => p.y));
    return { x, y };
  }

  return {
    handEdge,
    state: () => state,
    placement: () => placement,
    meshOf: (code) => {
      const m = placement.find((x) => x.code === code);
      return m ? meshes[m.id] : null;
    },
    busy: () => timeline.busy(),
    // The animation's speed, for what moves from now on.
    setSpeed(v) {
      timeline.speed = v;
    },
    idle: () => timeline.idle(),
    // Straight onto the table: a new game, a sitting restored. With
    // `dealt`, from the pack squared at the dealer's left, and the opening
    // deal played out.
    // `waits` (ms of the clock, by event index) holds events back.
    restart(s, { dealt = false, waits = {} } = {}) {
      queue.length = 0;
      release();
      if (!dealt) {
        settle(s);
        return { beats: {}, count: null };
      }
      const start = opening(s);
      settle(start);
      return animate(start, s, waits);
    },
    // The next state, animated from this one.
    advance(next) {
      return animate(state, next);
    },
    // The same state seen differently: a card chosen, table cards picked.
    rearrange() {
      if (timeline.busy()) {
        dress();
        return;
      }
      animate(state, state);
    },
    redecorate() {
      dress();
      stage.render();
    },
    // Hold the table at `ms` from now on its clock: the cards stop, and
    // `open(release)` is called; they carry on when it calls release.
    gate(ms, open) {
      schedule({ at: now() + ms, gate: true, fn: open });
    },
    // Run `fn` at `ms` from now on the table's clock, which a gate stops.
    at(ms, fn) {
      schedule({ at: now() + ms, gate: false, fn });
    },
    held: () => heldAt !== null,
    clock: () => now(),
    // What was timed to the moves is over: an undo, a new game.
    cancelTimed() {
      queue.length = 0;
      release();
    },
    skip() {
      timeline.skip();
      due(Infinity);
      dress();
      moving = true;
      wake();
    },
    // For stills: move the hand-driven clock and draw.
    tick(ms) {
      manualNow += ms;
      frame();
    },
    pick,
    screenPoint,
    toScreen,
    meshes,
    timeline,
  };
}
