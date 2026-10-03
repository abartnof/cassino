// The scoring board (DESIGN.md §12.2): Foster's cribbage board, which the
// game's period players kept score on, cut down to a track of 21 holes for
// each player and a hole to start from. Each has two pegs, and the back peg
// leapfrogs the front, so the gap between a player's pegs is always what
// they scored last hand: an audit trail built into the object. Pegged at
// the end of each hand's count, lifted, carried and dropped into its hole.
//
// Cassino's own (piquet has no board). The pegs' positions are a pure
// function of the events (`pegsOf`); the object is a few toon-shaded meshes
// with the table's ink line, at the edge of the table.

import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshToonMaterial, Quaternion, SphereGeometry, Vector3 } from "three";
import { transfer } from "./kinematics.js";
import { inkMaterial, RAMPS } from "./materials.js";

export const BOARD = Object.freeze({
  holes: 21,
  start: 1.4, // from the start hole to the first
  pitch: 1.1,
  group: 0.55, // more between one five and the next
  length: 28,
  width: 4.2,
  thick: 0.8,
  track: 0.95, // each track's distance from the board's centre line
  centre: Object.freeze([-24, 0, 20]), // at the table's edge, at your left
});

// Where hole `i` lies along the board (0 the start, 21 the game hole), from
// the board's left end.
export function holeX(i) {
  const left = -BOARD.length / 2 + 1.3;
  if (i === 0) return left;
  return left + BOARD.start + (i - 1) * BOARD.pitch + Math.floor((i - 1) / 5) * BOARD.group;
}

// Each player's pegs, from the hands' ends: the front peg in the hole of
// their total, the back peg where the front stood before the last hand.
export function pegsOf(events) {
  const totals = events.filter((e) => e.kind === "hand_ends").map((e) => e.totals);
  const at = (k, who) => Math.min(BOARD.holes, k < 0 ? 0 : totals[k][who]);
  const n = totals.length;
  return {
    you: { front: at(n - 1, "you"), back: at(n - 2, "you") },
    opp: { front: at(n - 1, "them"), back: at(n - 2, "them") },
  };
}

const WOOD = "#b8854f";
const HOLE = "#3a2716";
const PEGS = { you: "#924c00", opp: "#00696e" }; // the build badges' colours

export function createPegboard(stage) {
  const ramp = RAMPS.table();
  const group = new Group();
  const [cx, , cz] = BOARD.centre;
  group.position.set(cx, 0, cz);
  const ink = inkMaterial({ width: 2 });
  stage.registerInk(ink);
  const withInk = (mesh) => {
    mesh.add(new Mesh(mesh.geometry, ink));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const board = withInk(new Mesh(new BoxGeometry(BOARD.length, BOARD.thick, BOARD.width), new MeshToonMaterial({ color: WOOD, gradientMap: ramp })));
  board.position.y = BOARD.thick / 2;
  group.add(board);
  const top = BOARD.thick + 0.002;
  const holeGeometry = new CylinderGeometry(0.17, 0.17, 0.01, 12);
  const holeMaterial = new MeshToonMaterial({ color: HOLE, gradientMap: ramp });
  const trackZ = { you: BOARD.track, opp: -BOARD.track };
  for (const side of ["you", "opp"]) {
    for (let i = 0; i <= BOARD.holes; i++) {
      const hole = new Mesh(holeGeometry, holeMaterial);
      hole.position.set(holeX(i), top, trackZ[side]);
      group.add(hole);
    }
  }
  // A peg: a short shaft and a round head, standing in a hole.
  const shaft = new CylinderGeometry(0.2, 0.2, 1.3, 14);
  const head = new SphereGeometry(0.3, 16, 10);
  const pegs = { you: [], opp: [] };
  for (const side of ["you", "opp"]) {
    const material = new MeshToonMaterial({ color: PEGS[side], gradientMap: ramp });
    for (let k = 0; k < 2; k++) {
      const peg = new Group();
      const body = withInk(new Mesh(shaft, material));
      body.position.y = 0.65;
      const knob = withInk(new Mesh(head, material));
      knob.position.y = 1.35;
      peg.add(body, knob);
      group.add(peg);
      pegs[side].push(peg);
    }
  }
  stage.scene.add(group);

  // Where a peg stands in hole `i` of a track; two in one hole stand side
  // by side.
  const standing = (side, i, k, shared) => ({
    position: new Vector3(holeX(i) + (shared ? (k ? 0.22 : -0.22) : 0), top - 0.25, trackZ[side]),
    quaternion: new Quaternion(),
  });
  let shown = { you: { front: 0, back: 0 }, opp: { front: 0, back: 0 } };
  const place = (peg, pose) => {
    peg.position.copy(pose.position);
    peg.quaternion.copy(pose.quaternion);
  };
  // Which peg is the front one, a player at a time (they swap as they
  // leapfrog).
  const front = { you: 0, opp: 0 };
  function poses(side, p) {
    const shared = p.front === p.back;
    return { front: standing(side, p.front, front[side], shared), back: standing(side, p.back, 1 - front[side], shared) };
  }

  let moving = [];
  function frame(now) {
    moving = moving.filter((m) => {
      const t = Math.min(1, Math.max(0, (now - m.start) / m.ms));
      if (t > 0) place(m.peg, m.path(t));
      return t < 1;
    });
    stage.render();
    if (moving.length) requestAnimationFrame(frame);
  }

  return {
    group,
    // At once: a new game, a sitting restored, an undo.
    reset(p) {
      moving = [];
      front.you = front.opp = 0;
      shown = JSON.parse(JSON.stringify(p));
      for (const side of ["you", "opp"]) {
        const at = poses(side, p[side]);
        place(pegs[side][front[side]], at.front);
        place(pegs[side][1 - front[side]], at.back);
      }
      stage.render();
    },
    // A hand pegged: each player's back peg lifted over the front and set
    // in the hole of their new total.
    peg(p) {
      const now = performance.now();
      let delay = 0;
      for (const side of ["you", "opp"]) {
        if (p[side].front === shown[side].front) continue;
        const leaping = pegs[side][1 - front[side]];
        front[side] = 1 - front[side];
        const at = poses(side, p[side]);
        const from = { position: leaping.position.clone(), quaternion: leaping.quaternion.clone() };
        moving.push({ peg: leaping, path: transfer(from, at.front, { clearance: 2.2 }), start: now + delay, ms: 700 });
        // The other peg, now the back one, stays where it stood.
        place(pegs[side][1 - front[side]], at.back);
        delay += 350;
      }
      shown = JSON.parse(JSON.stringify(p));
      if (moving.length) requestAnimationFrame(frame);
    },
    pegs,
  };
}
