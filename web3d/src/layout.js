// The layout: where all 52 cards rest for a state of the protocol, and which
// of them show their faces (docs/TABLE3D.md section 5).
//
// layout(state, view) -> 52 slots { key, zone, index, code, faceUp, item,
// pose }. A pure function of what the engine says and of how the person has
// asked to see it (the hand card chosen, the table cards picked); the
// choreography animates from one layout to the next and must end exactly on
// it.
//
// `code` is a card only where the person may know it: their hand, the table,
// and the sweep cards lying face up in the piles. Everything else (the
// opponent's hand, the stock, the face-down piles) is null, with a key of its
// zone and place, so nothing in the scene can show a card the person could not
// see at a real table.
//
// The structure of piquet's layout.js @ 254cb3c (jitter, the pile, the fanned
// hands), rewritten for the middle of the cassino table.

import { Vector3 } from "three";
import { fan, lying } from "./kinematics.js";
import { CARD, ZONES } from "./units.js";

const DEG = Math.PI / 180;
const REST = 0.02; // a card on the table rests a hair above it
const GAP = 0.02; // and a hair above whatever it lies on
const STEP = CARD.thickness + GAP;
const CHOSEN_LIFT = 2.2; // the hand card chosen stands clear of the hand
const PICKED_LIFT = 0.6; // a table card picked rises a little

// A small fixed turn for each card, so piles look placed by a hand rather than
// stamped by a machine, and the same every time that card lands there.
export function jitter(key, degrees = 3) {
  let h = 2166136261;
  for (const ch of String(key)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) / 4294967295 - 0.5) * 2 * degrees * DEG;
}

// A point level with a held hand, far off toward its holder's side of the
// table (+1 yours, -1 theirs): the fan faces it, then leans back.
function toward(centre, side) {
  return centre.clone().add(new Vector3(0, 0, 300 * side));
}

function yourHand(codes, chosen) {
  const zone = ZONES.yourHand;
  const centre = new Vector3(...zone.centre);
  const poses = fan({
    count: codes.length,
    centre,
    facing: toward(centre, 1),
    radius: zone.radius,
    spread: zone.spread * DEG,
    tilt: zone.lean * DEG,
  });
  return codes.map((code, i) => {
    const pose = poses[i];
    if (code === chosen) pose.position.addScaledVector(new Vector3(0, 1, 0).applyQuaternion(pose.quaternion), CHOSEN_LIFT);
    return { key: code, zone: "your-hand", index: i, code, faceUp: true, item: null, pose };
  });
}

function theirHand(count) {
  const zone = ZONES.theirHand;
  const centre = new Vector3(...zone.centre);
  return fan({
    count,
    centre,
    facing: toward(centre, -1),
    radius: zone.radius,
    spread: zone.spread * DEG,
    tilt: zone.lean * DEG,
  }).map((pose, i) => ({ key: `their-hand:${i}`, zone: "their-hand", index: i, code: null, faceUp: false, item: null, pose }));
}

// Where the item at `slot` of `count` lies on the grid: rows of at most
// `columns`, centred across, the first row at the zone's line and later rows
// toward you, then away, alternately, so the middle grows evenly.
export function gridPlace(slot, count) {
  const m = ZONES.middle;
  const rows = Math.ceil(count / m.columns);
  const row = Math.floor(slot / m.columns);
  const inRow = row < rows - 1 ? m.columns : count - row * m.columns;
  const col = slot - row * m.columns;
  const pitchX = CARD.width + m.gapX + ZONES.stack.dx * 2;
  const pitchZ = CARD.height + m.gapZ + ZONES.stack.dz * 2;
  // Rows alternate either side of the first: 0, +1, -1, +2, ...
  const offset = row === 0 ? 0 : row % 2 === 1 ? (row + 1) / 2 : -row / 2;
  return { x: m.x + (col - (inRow - 1) / 2) * pitchX, z: m.z + offset * pitchZ };
}

function middle(items, picked) {
  const slots = [];
  const chosen = new Set(picked);
  items.forEach((item, slot) => {
    const { x, z } = gridPlace(slot, items.length);
    const codes = item.cards.map((c) => c.card);
    // A build's cards from the first laid, each a little down and to the
    // right of the last; centred on the grid place.
    const n = codes.length;
    const x0 = x - ((n - 1) * ZONES.stack.dx) / 2;
    const z0 = z - ((n - 1) * ZONES.stack.dz) / 2;
    const lifted = codes.some((c) => chosen.has(c)) ? PICKED_LIFT : 0;
    codes.forEach((code, i) => {
      slots.push({
        key: code,
        zone: "middle",
        index: i,
        code,
        faceUp: true,
        item: item.id,
        pose: lying({
          x: x0 + i * ZONES.stack.dx,
          z: z0 + i * ZONES.stack.dz,
          height: REST + i * STEP + lifted,
          yaw: n > 1 ? 0 : jitter(code, 1.5),
        }),
      });
    });
  });
  return slots;
}

// A player's captures: a squared pile face down, the sweep cards crosswise
// in it, face up, each offset a little from the last (the Swedish tally).
function pileOf(who, count, sweepCards) {
  const zone = who === "you" ? ZONES.yourPile : ZONES.theirPile;
  const name = who === "you" ? "your-pile" : "their-pile";
  const plain = Math.max(0, count - sweepCards.length);
  const slots = [];
  for (let i = 0; i < plain; i++) {
    slots.push({
      key: `${name}:${i}`,
      zone: name,
      index: i,
      code: null,
      faceUp: false,
      item: null,
      pose: lying({ x: zone.x, z: zone.z, height: REST + i * STEP, faceUp: false, yaw: jitter(`${name}${i}`, 2) }),
    });
  }
  sweepCards.slice(0, count).forEach((code, k) => {
    // Crosswise, part showing past the pile's edge toward its holder.
    const side = who === "you" ? 1 : -1;
    slots.push({
      key: code,
      zone: name,
      index: plain + k,
      code,
      faceUp: true,
      item: null,
      pose: lying({
        x: zone.x - side * k * zone.sweepStep,
        z: zone.z + side * (CARD.height / 2 - CARD.width / 4),
        height: REST + (plain + k) * STEP,
        yaw: 90 * DEG,
      }),
    });
  });
  return slots;
}

function stock(count, dealer) {
  const at = ZONES.stock[dealer === "you" ? "you" : "them"];
  return Array.from({ length: count }, (_, i) => ({
    key: `stock:${i}`,
    zone: "stock",
    index: i,
    code: null,
    faceUp: false,
    item: null,
    pose: lying({ x: at.x, z: at.z, height: REST + i * STEP, faceUp: false, yaw: jitter(`stock${i}`, 1) }),
  }));
}

export function layout(state, { chosen = null, picked = [], sweeps = { you: [], them: [] } } = {}) {
  return [
    ...yourHand(state.hand.map((c) => c.card), chosen),
    ...theirHand(state.opponent_holds),
    ...middle(state.table, picked),
    ...pileOf("you", state.piles.you.cards, sweeps.you ?? []),
    ...pileOf("them", state.piles.them.cards, sweeps.them ?? []),
    ...stock(state.undealt, state.dealer),
  ];
}

// The sweep cards of the hand under way, by who made them: the card of each
// capture that swept, from the events (each `swept` follows its `played`).
export function sweepCards(events, hand) {
  const out = { you: [], them: [] };
  let last = null;
  for (const e of events) {
    if (e.hand !== hand) continue;
    if (e.kind === "played") last = e;
    if (e.kind === "swept" && last) out[e.you ? "you" : "them"].push(last.card.card);
  }
  return out;
}
