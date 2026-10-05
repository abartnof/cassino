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
import { fan, lying, row } from "./kinematics.js";
import { countLines, countOf } from "./scorebug.js";
import { CARD, ZONES } from "./units.js";

const DEG = Math.PI / 180;
const REST = 0.02; // a card on the table rests a hair above it
const GAP = 0.02; // and a hair above whatever it lies on
const STEP = CARD.thickness + GAP;
const CHOSEN_LIFT = 1.6; // the hand card chosen stands clear of the hand (and of the move bar above it)
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

// Your hand: fanned, or, on a phone or a tablet (a zone with a `gap`), a
// row of cards spaced wide (the seventh play-testing).
function yourHand(codes, chosen, Z) {
  const zone = Z.yourHand;
  const centre = new Vector3(...zone.centre);
  const held = { count: codes.length, centre, facing: toward(centre, 1), tilt: zone.lean * DEG };
  const poses = zone.gap !== undefined ? row({ ...held, gap: zone.gap }) : fan({ ...held, radius: zone.radius, spread: zone.spread * DEG });
  return codes.map((code, i) => {
    const pose = poses[i];
    if (code === chosen) pose.position.addScaledVector(new Vector3(0, 1, 0).applyQuaternion(pose.quaternion), CHOSEN_LIFT);
    return { key: code, zone: "your-hand", index: i, code, faceUp: true, item: null, pose };
  });
}

// Your opponent's hand, backs to you, tipped toward you so the backs are
// square to the eye (units.js), never face up (the replay with both hands
// face up went in the seventh play-testing). It lies just beyond the
// middle's last row: `back` further off for each row past the first
// (`rows`).
function theirHand(count, Z, rows = 1) {
  const zone = Z.theirHand;
  const centre = new Vector3(...zone.centre).add(new Vector3(0, 0, -(zone.back ?? 0) * Math.max(0, rows - 1)));
  return fan({
    count,
    centre,
    facing: toward(centre, -1),
    radius: zone.radius,
    spread: zone.spread * DEG,
    tilt: -zone.lean * DEG,
  }).map((pose, i) => ({ key: `their-hand:${i}`, zone: "their-hand", index: i, code: null, faceUp: false, item: null, pose }));
}

// Where the item at `slot` of `count` lies on the grid: rows of at most
// `columns`, centred across, the first row at the zone's line and later rows
// away from you (never toward you, where your hand would hide them).
export function gridPlace(slot, count, Z = ZONES) {
  const m = Z.middle;
  const rows = Math.ceil(count / m.columns);
  const row = Math.floor(slot / m.columns);
  const inRow = row < rows - 1 ? m.columns : count - row * m.columns;
  const col = slot - row * m.columns;
  const pitchX = CARD.width + m.gapX + Z.stack.dx * 2;
  const pitchZ = CARD.height + m.gapZ + Z.stack.dz * 2;
  return { x: m.x + (col - (inRow - 1) / 2) * pitchX, z: m.z - row * pitchZ };
}

// The table's items in the order they lie on the grid: as they came, or,
// sorted (the user: "cards and [builds] on the table, dynamically
// automatically sort in descending order, left to right"), highest first,
// a build by its value and a loose card by its rank (an ace one, a king
// thirteen), equal ones as they came.
const RANKS = "A23456789TJQK";
const valueOf = (item) => item.build?.value ?? RANKS.indexOf(item.cards[0].card[0]) + 1;
export function tableOrder(items, sort = false) {
  if (!sort) return items;
  return items.map((item, k) => ({ item, k })).sort((a, b) => valueOf(b.item) - valueOf(a.item) || a.k - b.k).map((x) => x.item);
}

// Your hand in the order it is held: as dealt, or, sorted as the table is
// (the user: "if the user turns on card sorting, then their own cards
// should also stay sorted"), highest first, an ace high where it may count
// fourteen (`aces14`: Royal's aces 1 or 14), else low; equal ranks as
// dealt.
export function handOrder(hand, sort = false, aces14 = false) {
  if (!sort) return hand;
  const value = (c) => {
    const rank = RANKS.indexOf(c.card[0]) + 1;
    return rank === 1 && aces14 ? 14 : rank;
  };
  return hand.map((c, k) => ({ c, k })).sort((a, b) => value(b.c) - value(a.c) || a.k - b.k).map((x) => x.c);
}

function middle(items, picked, Z) {
  const slots = [];
  const chosen = new Set(picked);
  items.forEach((item, slot) => {
    const { x, z } = gridPlace(slot, items.length, Z);
    const codes = item.cards.map((c) => c.card);
    // A build's cards from the first laid, each a little down and to the
    // right of the last; centred on the grid place.
    const n = codes.length;
    const x0 = x - ((n - 1) * Z.stack.dx) / 2;
    const z0 = z - ((n - 1) * Z.stack.dz) / 2;
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
          x: x0 + i * Z.stack.dx,
          z: z0 + i * Z.stack.dz,
          height: REST + i * STEP + lifted,
          yaw: n > 1 ? 0 : jitter(code, 1.5),
        }),
      });
    });
  });
  return slots;
}

// A player's captures: a squared pile face down, in the order they went in.
// Each sweep's card lies crosswise in it, face up, at the height it was laid,
// so later captures cover its middle and its ends still show, each a little
// along from the last (the Swedish tally). Plain cards are keyed by their
// place among the plain ones, which a sweep laid on them does not change.
//
// Once the hand is counted, the cards the count names (`drawn`) are out of
// the pile, in the count row: a sweep card from its place, and the rest off
// the top of the plain cards, which are anonymous.
function pileOf(who, count, sweeps, drawn, Z) {
  const zone = who === "you" ? Z.yourPile : Z.theirPile;
  const name = who === "you" ? "your-pile" : "their-pile";
  const side = who === "you" ? 1 : -1;
  const crosswise = new Map(sweeps.filter((s) => s.at < count).map((s, k) => [s.at, { code: s.code, k }]));
  const places = [];
  let plain = 0;
  for (let i = 0; i < count; i++) {
    const sweep = crosswise.get(i);
    places.push(sweep ? { sweep } : { plain: plain++ });
  }
  const sweepCodes = new Set([...crosswise.values()].map((s) => s.code));
  let offTop = drawn.filter((c) => !sweepCodes.has(c)).length;
  const kept = [];
  for (let i = places.length - 1; i >= 0; i--) {
    const p = places[i];
    if (p.sweep ? drawn.includes(p.sweep.code) : offTop-- > 0) continue;
    kept.unshift(p);
  }
  return kept.map((p, i) => {
    if (p.sweep) {
      return {
        key: p.sweep.code,
        zone: name,
        index: i,
        code: p.sweep.code,
        faceUp: true,
        item: null,
        pose: lying({
          x: zone.x - side * p.sweep.k * zone.sweepStep,
          z: zone.z + side * (CARD.height / 2 - CARD.width / 4),
          height: REST + i * STEP,
          yaw: 90 * DEG,
        }),
      };
    }
    return {
      key: `${name}:${p.plain}`,
      zone: name,
      index: i,
      code: null,
      faceUp: false,
      item: null,
      pose: lying({ x: zone.x, z: zone.z, height: REST + i * STEP, faceUp: false, yaw: jitter(`${name}${p.plain}`, 2) }),
    };
  });
}

// The count row: the aces and Cassinos a player's count names, face up and
// in the count's order, laid out from their pile toward the middle of the
// table, which is clear by then.
function countRow(who, codes, Z) {
  const zone = who === "you" ? Z.yourPile : Z.theirPile;
  const toward = who === "you" ? -1 : 1;
  return codes.map((code, k) => ({
    key: code,
    zone: who === "you" ? "your-count" : "their-count",
    index: k,
    code,
    faceUp: true,
    item: null,
    pose: lying({ x: zone.x + toward * (Z.count.first + k * Z.count.step), z: zone.z, height: REST + k * STEP, yaw: jitter(code, 1.5) }),
  }));
}

// The cards a finished hand's count names, by whose they are.
export function countedCards(state) {
  const out = { you: [], them: [] };
  for (const line of countLines(countOf(state))) if (line.code) out[line.who].push(line.code);
  return out;
}

function stock(count, dealer, Z) {
  const at = Z.stock[dealer === "you" ? "you" : "them"];
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

// `zones`: where things rest (units.js): ZONES across a table, or
// ZONES_PORTRAIT on a phone held upright.
// `sort`: the table's items and your hand in descending order (tableOrder,
// handOrder).
export function layout(state, { chosen = null, picked = [], sweeps = { you: [], them: [] }, zones = ZONES, sort = false } = {}) {
  const counted = countedCards(state);
  return [
    ...yourHand(handOrder(state.hand, sort, state.rules?.aces14).map((c) => c.card), chosen, zones),
    ...theirHand(state.opponent_holds, zones, Math.ceil((state.table?.length ?? 0) / zones.middle.columns)),
    ...middle(tableOrder(state.table, sort), picked, zones),
    ...pileOf("you", state.piles.you.cards, sweeps.you ?? [], counted.you, zones),
    ...pileOf("them", state.piles.them.cards, sweeps.them ?? [], counted.them, zones),
    ...countRow("you", counted.you, zones),
    ...countRow("them", counted.them, zones),
    ...stock(state.undealt, state.dealer, zones),
  ];
}

// The sweep cards of the hand under way, by who made them: the card of each
// capture that swept (each `swept` follows its `played`), and `at`, how many
// of its holder's captured cards lay beneath it, counted from the events.
export function sweepCards(events, hand) {
  const out = { you: [], them: [] };
  const pile = { you: 0, them: 0 };
  let last = null;
  for (const e of events) {
    if (e.hand !== hand) continue;
    const who = e.you ? "you" : "them";
    if (e.kind === "played") {
      last = e;
      if (e.type === "take") pile[who] += e.taken.length + 1;
    }
    if (e.kind === "swept" && last) out[who].push({ code: last.card.card, at: pile[who] - 1 });
  }
  return out;
}
