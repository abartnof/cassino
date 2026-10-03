// The choreography: how the cards get from one state to the next
// (docs/TABLE3D.md section 6).
//
// The engine reports only the state before a decision of the person's and
// the state at the next; between them its events say what happened, in
// order: you took, your opponent built, the cards were dealt. A small reducer
// replays those events into intermediate states, each laid out by `layout`,
// so every stage of the animation runs between two true layouts: the
// waypoints are exact, not guessed. A final settle lands everything on
// layout(next) whatever happened, and anything the reducer cannot follow (an
// undo, a new game, a sitting restored) is a single direct transition.
//
// choreograph(prev, next, placement, view, options) -> { motions, placement, duration, beats }
//
//   placement  where each of the 52 meshes is: [{ id, key, zone, index, code, pose }]
//   motions    [{ id, path, delay, duration, reveal }]: `reveal` is the face a
//              mesh shows from the start of its motion (a card turned up, or
//              dealt to you), or, as { code: null, atEnd: true }, the face it
//              stops showing when the motion lands (a card turned down).
//   beats      { eventIndex: ms }: when each of next's new events is seen to
//              happen, on the same clock, for the dialogue.
//   view       { chosen, picked }: how the person has asked to see the state
//              (layout.js); it applies to `next` only.
//
// The structure is piquet's choreography.js @ 254cb3c (the reducer, the
// matching of meshes to slots, the plan and its settle); the stages are
// cassino's own: the deal in twos, the trail, the build, the gather of a
// capture into its taker's pile, the residue, and the cards collected for a
// new hand. Faces follow the layout's rule: a mesh shows a face only when the
// state it is moving towards lets the person know that card.

import { Vector3 } from "three";
import { carryBlock, fan, lying, pickUp, pull, rise, slide, toss, transfer } from "./kinematics.js";
import { jitter, layout, sweepCards } from "./layout.js";
import { CARD } from "./units.js";

// Starting points, tuned by eye; the speed setting scales them all.
export const TIMING = Object.freeze({
  think: 380, // your opponent's pause before a move that follows another
  play: 560, // the tug out of the hand, then the toss (kinematics.pull)
  resort: 260, // a hand closing up, a card chosen standing up
  reflow: 380, // the items on the table moving up as the grid changes
  gather: 360, // a card pushed across the table into a build or a heap
  gatherStep: 220, // between one group of a capture and the next
  beat: 260, // a capture seen before it is gathered: yours
  look: 700, // and your opponent's, so you can see what they take
  carry: 620, // the gathered heap turned over into its taker's pile
  show: 650, // a sweep's card held up a moment ("Clear!")
  lay: 420, // and then laid crosswise in the pile
  dealCard: 300,
  dealPair: 170, // two at a time: one pair after another
  dealSecond: 50, // and the second card of a pair just behind the first
  collect: 480, // every card back to the stock for a new hand
  collectStagger: 12,
  direct: 420,
});

const REST = 0.02;
const STEP = CARD.thickness + 0.02;
const TOWARD = { you: new Vector3(0, 0, 1), them: new Vector3(0, 0, -1) };
const PILE = { you: "your-pile", them: "their-pile" };
// A card played arcs a little above the hand it leaves, then falls to the
// table: the middle lies far enough off that the toss's own arc would lob it.
const PLAYED = { clearance: 3 };
const HAND = { you: "your-hand", them: "their-hand" };

// How high a card rides as it slides: over anything lying on the table, and
// over every card that will end up beneath it, so no two movers share a
// level on the way.
function ride(to) {
  return 0.3 + 4 * Math.max(0, to.position.y);
}

function onTable(pose) {
  const n = new Vector3(0, 0, 1).applyQuaternion(pose.quaternion);
  return Math.abs(n.y) > 0.9 && pose.position.y < 3;
}

const samePlace = (a, b) => Math.abs(a.position.x - b.position.x) < 1e-9 && Math.abs(a.position.z - b.position.z) < 1e-9;
const samePose = (a, b) => a.position.equals(b.position) && a.quaternion.equals(b.quaternion);

// The meshes placed straight onto a layout, the first time a state is seen.
export function initialPlacement(state, view = {}) {
  return layoutOf(state, view).map((slot, id) => ({ id, ...slot }));
}

// A state laid out, its sweep cards taken from its own events.
function layoutOf(state, view = {}) {
  return layout(state, { chosen: view.chosen ?? null, picked: view.picked ?? [], sweeps: sweepCards(state.events, state.hand_number) });
}

// Before the first deal of a sitting: the whole pack squared at the first
// dealer's left, nothing yet said. Choreographed from this to a new game's
// first state, the opening deal is played out.
export function opening(state) {
  const first = state.events.find((e) => e.kind === "first_dealer");
  return {
    seed: state.seed,
    rules: state.rules,
    watching: state.watching,
    events: [],
    hand: [],
    opponent_holds: 0,
    table: [],
    piles: { you: { cards: 0 }, them: { cards: 0 } },
    undealt: 52,
    dealer: first ? (first.you ? "you" : "them") : state.dealer,
    hand_number: 1,
  };
}

// ---- the reducer: events into intermediate states --------------------------

function sameStart(prev, next) {
  if (!prev || prev.seed !== next.seed || prev.watching !== next.watching) return false;
  if (JSON.stringify(prev.rules) !== JSON.stringify(next.rules)) return false;
  if (next.events.length < prev.events.length) return false;
  const last = prev.events.length - 1;
  return last < 0 || (next.events[last].kind === prev.events[last].kind && next.events[last].text === prev.events[last].text);
}

// Only what the layout reads.
function snapshot(s) {
  return {
    events: s.events,
    hand: [...s.hand],
    opponent_holds: s.opponent_holds,
    table: s.table.map((item) => ({ ...item, cards: [...item.cards] })),
    piles: { you: { cards: s.piles.you.cards }, them: { cards: s.piles.them.cards } },
    undealt: s.undealt,
    dealer: s.dealer,
    hand_number: s.hand_number,
  };
}

// The table after a move, as the session keeps its items (session.rs
// `place`): a trail goes to the end; a capture lifts what it takes; a new
// build takes the place of the first loose card it was made from, its loose
// cards first and the card played on top; a raised build keeps its place,
// the card played and then the loose cards laid on it. Ids of items that
// arrive here are provisional: only the next state's are the engine's.
function moved(table, e, who, at) {
  const card = e.card;
  if (e.type === "trail") return [...table, { id: `trail${at}`, cards: [card], build: null }];
  if (e.type === "take") {
    const taken = new Set(e.taken.map((c) => c.card));
    return table.filter((item) => !taken.has(item.cards[0].card));
  }
  const loose = new Set(e.loose.map((c) => c.card));
  const isLoose = (item) => item.cards.length === 1 && loose.has(item.cards[0].card);
  const laid = table.filter(isLoose).map((item) => item.cards[0]);
  const onto = e.onto?.card ?? null;
  const target = onto ? table.find((item) => item.cards.some((c) => c.card === onto)) : null;
  const build = { value: e.value, multiple: false, controller: who };
  const out = [];
  let placed = false;
  for (const item of table) {
    if (item === target) out.push({ ...item, cards: [...item.cards, card, ...laid], build: { ...item.build, ...build } });
    else if (isLoose(item)) {
      if (!target && !placed) {
        out.push({ id: `build${at}`, cards: [...laid, card], build });
        placed = true;
      }
    } else out.push(item);
  }
  return out;
}

export function stagesBetween(prev, next) {
  if (!sameStart(prev, next)) return null;
  let s = snapshot(prev);
  const stages = [];
  const fresh = next.events.slice(prev.events.length);
  fresh.forEach((e, n) => {
    const at = prev.events.length + n; // the event's index, for its moment (beats)
    const seen = (more = 0) => next.events.slice(0, at + 1 + more);
    const who = e.you ? "you" : "them";
    switch (e.kind) {
      case "dealt": {
        const dealer = e.you_deal ? "you" : "them";
        const elder = e.you_deal ? "them" : "you";
        if (e.deal === 1) {
          // A new hand: everything comes together as the stock at the
          // dealer's left.
          s = {
            ...s,
            events: seen(),
            hand: [],
            opponent_holds: 0,
            table: [],
            piles: { you: { cards: 0 }, them: { cards: 0 } },
            undealt: 52,
            dealer,
            hand_number: e.hand,
          };
          stages.push({ kind: "collect", state: s, at });
        }
        // In twos: to the elder, to the table (the first deal), to the
        // dealer, and round again.
        const order = e.table.length ? [elder, "table", dealer, elder, "table", dealer] : [elder, dealer, elder, dealer];
        const ids = e.table.map((c, i) => next.table.find((item) => item.cards.length === 1 && item.cards[0].card === c.card)?.id ?? `dealt${at}:${i}`);
        s = {
          ...s,
          events: seen(),
          hand: [...e.yours],
          opponent_holds: 4,
          table: [...s.table, ...e.table.map((c, i) => ({ id: ids[i], cards: [c], build: null }))],
          undealt: s.undealt - 8 - e.table.length,
          dealer,
          hand_number: e.hand,
        };
        stages.push({ kind: "deal", state: s, order, at });
        break;
      }
      case "played": {
        const sweep = fresh[n + 1]?.kind === "swept";
        const piles =
          e.type === "take" ? { ...s.piles, [who]: { cards: s.piles[who].cards + e.taken.length + 1 } } : s.piles;
        s = {
          ...s,
          events: seen(sweep ? 1 : 0),
          hand: who === "you" ? s.hand.filter((c) => c.card !== e.card.card) : s.hand,
          opponent_holds: who === "them" ? s.opponent_holds - 1 : s.opponent_holds,
          table: moved(s.table, e, who, at),
          piles,
        };
        stages.push({ kind: e.type, state: s, who, event: e, sweep, at });
        break;
      }
      case "residue": {
        if (e.you === null || !e.cards.length) break;
        const items = s.table.map((item) => item.cards.map((c) => c.card));
        s = {
          ...s,
          events: seen(),
          table: [],
          piles: { ...s.piles, [who]: { cards: s.piles[who].cards + e.cards.length } },
        };
        stages.push({ kind: "residue", state: s, who, event: e, items, at });
        break;
      }
      default:
        s = { ...s, events: seen() }; // the rest move no cards
        break;
    }
  });
  return stages;
}

// ---- matching meshes to slots -------------------------------------------------

// Where a zone's newcomers come from, in order of preference; zones claim in
// CLAIM order. Cards the person knows match by their codes first, and the
// cards of the piles and the stock by their places (keys) next, so only what
// truly arrives is claimed.
const SOURCES = {
  middle: ["their-hand", "your-hand", "stock", "your-pile", "their-pile"],
  "your-pile": ["your-pile", "middle", "your-hand"],
  "their-pile": ["their-pile", "middle", "their-hand"],
  "your-hand": ["your-hand", "stock", "middle", "your-pile", "their-pile"],
  "their-hand": ["their-hand", "stock", "middle", "your-pile", "their-pile"],
  stock: ["stock", "your-pile", "their-pile", "middle", "your-hand", "their-hand"],
};
const CLAIM = ["middle", "your-pile", "their-pile", "your-hand", "their-hand", "stock"];
const KEYED = new Set(["your-pile", "their-pile", "stock"]);

// Which of a zone's meshes to take first when some must leave it.
function takeOrder(zone, meshes, destination) {
  const byIndex = [...meshes].sort((a, b) => a.index - b.index);
  if (zone === destination) return byIndex; // staying put: keep the order
  if (zone === "stock" || zone.endsWith("pile")) return byIndex.reverse(); // off the top
  if (zone === "their-hand") {
    // A card chosen from a hand held up: not always the end one.
    const n = byIndex.length;
    const k = n ? Math.floor(((jitter(`${destination}${n}`, 1) + 1) / 2) * n) % n : 0;
    return [...byIndex.slice(k), ...byIndex.slice(0, k)];
  }
  return byIndex;
}

export function match(current, target) {
  const byCode = new Map(current.filter((m) => m.code).map((m) => [m.code, m]));
  const taken = new Set();
  const owner = new Array(target.length).fill(null);
  const own = (k, mesh) => {
    owner[k] = mesh.id;
    taken.add(mesh.id);
  };
  target.forEach((slot, k) => {
    const mesh = slot.code && byCode.get(slot.code);
    if (mesh) own(k, mesh);
  });
  const byKey = new Map(current.filter((m) => KEYED.has(m.zone) && !taken.has(m.id)).map((m) => [m.key, m]));
  target.forEach((slot, k) => {
    if (owner[k] !== null || !KEYED.has(slot.zone)) return;
    const mesh = byKey.get(slot.key);
    if (mesh && mesh.zone === slot.zone && !taken.has(mesh.id)) own(k, mesh);
  });
  for (const zone of CLAIM) {
    const open = target.map((slot, k) => k).filter((k) => target[k].zone === zone && owner[k] === null);
    for (const source of SOURCES[zone]) {
      if (!open.length) break;
      const free = takeOrder(source, current.filter((m) => m.zone === source && !taken.has(m.id)), zone);
      while (open.length && free.length) own(open.shift(), free.shift());
    }
  }
  // Anything left over (a transition the rules above do not describe) pairs
  // up in order; the direct stage animates it plainly.
  const spare = current.filter((m) => !taken.has(m.id));
  owner.forEach((id, k) => {
    if (id === null) own(k, spare.shift());
  });
  return owner;
}

// ---- the plan: stages into motions ------------------------------------------

class Plan {
  constructor(placement, view) {
    this.now = placement.map((m) => ({ ...m }));
    this.view = view;
    this.clock = 0;
    this.end = 0;
    this.motions = [];
    this.free = new Map(); // when each mesh is next free to move
  }

  // A motion for a mesh, never overlapping the motion before it.
  add(id, path, start, duration, reveal) {
    const begin = Math.max(start, this.free.get(id) ?? 0);
    this.motions.push({ id, path, delay: begin, duration, reveal });
    this.free.set(id, begin + duration);
    this.end = Math.max(this.end, begin + duration);
    return begin + duration;
  }

  // Move a mesh to a slot (or to a pose that is no layout's, as a slot with
  // the mesh's own zone and key): its face changes as the slot's does.
  move(id, slot, path, start, duration) {
    const was = this.now[id];
    const reveal = was.code === slot.code ? undefined : slot.code ? { code: slot.code } : { code: null, atEnd: true };
    const end = this.add(id, path, start, duration, reveal);
    this.now[id] = { id, key: slot.key ?? was.key, zone: slot.zone ?? was.zone, index: slot.index ?? was.index, code: slot.code, item: slot.item ?? null, pose: slot.pose };
    return end;
  }

  // A pose that is no layout's, for a mesh on its way: same face, same place
  // in the bookkeeping.
  via(id, pose) {
    const m = this.now[id];
    return { key: m.key, zone: m.zone, index: m.index, code: m.code, item: m.item, pose };
  }

  // Move every mesh to its slot in `target`, choosing each motion by where it
  // comes from and goes to. Returns when the stage ends.
  stage(target, choose, start = this.clock) {
    const owner = match(this.now, target);
    let end = start;
    owner.forEach((id, k) => {
      const mesh = this.now[id];
      const slot = target[k];
      if (samePose(mesh.pose, slot.pose) && mesh.code === slot.code) {
        this.now[id] = { id, ...slot };
        return;
      }
      const m = choose?.(mesh, slot) ?? this.plain(mesh, slot);
      end = Math.max(end, this.move(id, slot, m.path, start + m.delay, m.duration));
    });
    this.clock = end;
    return end;
  }

  // How a card goes from one place to another when nothing more particular
  // is said: onto the table it is tossed; up into a hand it rises; within a
  // hand it is carried; across the table it slides.
  plain(mesh, slot) {
    const from = mesh.pose;
    const to = slot.pose;
    if (mesh.zone === slot.zone && !onTable(to)) return { path: transfer(from, to, { clearance: 1.2 }), delay: 0, duration: TIMING.resort };
    if (onTable(from) && onTable(to)) {
      if (samePlace(from, to)) return { path: slide(from, to), delay: 0, duration: TIMING.resort };
      const faceTurns = new Vector3(0, 0, 1).applyQuaternion(from.quaternion).y * new Vector3(0, 0, 1).applyQuaternion(to.quaternion).y < 0;
      if (faceTurns) return { path: toss(from, to), delay: 0, duration: TIMING.direct };
      return { path: slide(from, to, { lift: ride(to) }), delay: 0, duration: TIMING.reflow };
    }
    if (onTable(from)) {
      const toward = slot.zone === "their-hand" ? TOWARD.them : TOWARD.you;
      return { path: pickUp(from, to, { toward }), delay: 0, duration: TIMING.direct };
    }
    if (onTable(to)) return { path: toss(from, to), delay: 0, duration: TIMING.direct };
    return { path: transfer(from, to), delay: 0, duration: TIMING.direct };
  }

  // Your opponent pauses before a move that follows another.
  think(who) {
    if (who === "them" && this.motions.length) this.clock = Math.max(this.clock, this.end) + TIMING.think;
  }

  // The mesh of the card played: from your hand by its code; from your
  // opponent's, one of their fan's backs.
  played(who, code) {
    const known = this.now.find((m) => m.code === code);
    if (known) return known;
    const fan = this.now.filter((m) => m.zone === HAND[who]);
    return takeOrder(HAND[who], fan, "middle")[0] ?? this.now.find((m) => m.zone === HAND[who]);
  }

  // The hand a card left closes up as it goes.
  closeUp(who, card, target, start) {
    const slots = target.filter((s) => s.zone === HAND[who]);
    const rest = this.now.filter((m) => m.zone === HAND[who] && m.id !== card.id).sort((a, b) => a.index - b.index);
    const byCode = new Map(slots.filter((s) => s.code).map((s) => [s.code, s]));
    const anonymous = slots.filter((s) => !s.code);
    rest.forEach((mesh) => {
      const slot = mesh.code ? byCode.get(mesh.code) : anonymous.shift();
      if (!slot || samePose(mesh.pose, slot.pose)) return;
      this.move(mesh.id, slot, transfer(mesh.pose, slot.pose, { clearance: 1.2 }), start, TIMING.resort);
    });
  }

  // ---- the stages -------------------------------------------------------------

  direct(state) {
    this.stage(layoutOf(state, this.view), null, Math.max(this.clock, this.end));
  }

  // Every card back to the stock at the new dealer's left: the cards lying
  // highest leave first, each landing on those before it, and a card face
  // up turns over on its way.
  collect({ state }) {
    const target = layoutOf(state);
    const stock = target.filter((s) => s.zone === "stock");
    const kept = new Set(this.now.filter((m) => m.zone === "stock").map((m) => m.key));
    const open = stock.filter((s) => !kept.has(s.key));
    const leaving = this.now.filter((m) => m.zone !== "stock").sort((a, b) => b.pose.position.y - a.pose.position.y || a.id - b.id);
    const start = this.clock;
    leaving.forEach((mesh, k) => {
      const slot = open[k];
      if (!slot) return;
      const faceUp = new Vector3(0, 0, 1).applyQuaternion(mesh.pose.quaternion).y > 0.5;
      const path = onTable(mesh.pose) && !faceUp ? slide(mesh.pose, slot.pose, { lift: ride(slot.pose) }) : toss(mesh.pose, slot.pose);
      this.move(mesh.id, slot, path, start + k * TIMING.collectStagger, TIMING.collect);
    });
    this.clock = Math.max(this.clock, this.end);
  }

  // The cards off the top of the stock in twos, each straight to where it
  // will rest: up into a hand (yours turning to face you, and showing their
  // faces), or face up onto the table.
  deal({ state, order }) {
    const target = layoutOf(state);
    const top = this.now.filter((m) => m.zone === "stock").sort((a, b) => b.index - a.index);
    const slotsOf = {
      you: target.filter((s) => s.zone === "your-hand"),
      them: target.filter((s) => s.zone === "their-hand"),
      table: target.filter((s) => s.zone === "middle" && !this.now.some((m) => m.code === s.code)),
    };
    const start = this.clock;
    order.forEach((to, pair) => {
      for (let k = 0; k < 2; k++) {
        const mesh = top.shift();
        const slot = slotsOf[to].shift();
        if (!mesh || !slot) continue;
        const delay = pair * TIMING.dealPair + k * TIMING.dealSecond;
        const path = to === "table" ? toss(mesh.pose, slot.pose, { clearance: 3 }) : rise(mesh.pose, slot.pose);
        this.move(mesh.id, slot, path, start + delay, TIMING.dealCard);
      }
    });
    this.clock = start + order.length * TIMING.dealPair;
    this.stage(target, null, Math.max(this.clock, this.end));
  }

  // A trail: the card leaves the hand and is laid at the end of the grid,
  // the rest of the table moving up to make room.
  trail({ state, who }) {
    this.think(who);
    const target = layoutOf(state);
    const start = this.clock;
    this.stage(
      target,
      (mesh, slot) => {
        if (slot.zone === "middle" && mesh.zone !== "middle") return { path: pull(mesh.pose, slot.pose, PLAYED), delay: 0, duration: TIMING.play };
        return null;
      },
      start,
    );
  }

  // A build: the loose cards it takes in are pushed together on the first
  // of them, and the card played is laid on top; a build raised or added to
  // takes the card played and then the loose cards on top of it.
  build({ state, who, event }) {
    this.think(who);
    const target = layoutOf(state);
    const start = this.clock;
    const raising = Boolean(event.onto);
    const loose = new Set(event.loose.map((c) => c.card));
    this.stage(
      target,
      (mesh, slot) => {
        if (slot.zone === "middle" && mesh.zone !== "middle") {
          return { path: pull(mesh.pose, slot.pose, PLAYED), delay: raising ? 0 : TIMING.gather * 0.4, duration: TIMING.play };
        }
        if (loose.has(mesh.code)) {
          return { path: slide(mesh.pose, slot.pose, { lift: ride(slot.pose) }), delay: raising ? TIMING.play : 0, duration: TIMING.gather };
        }
        return null;
      },
      start,
    );
  }

  // A capture, "the gather": the card is laid on the first group it takes;
  // a moment to see it; the other groups are pushed onto it in the order
  // they are named; and the heap is turned over into the taker's pile as
  // one. A sweep's card is first held up ("Clear!"), and laid crosswise on
  // the pile once the heap is in.
  take({ state, who, event, sweep }) {
    this.think(who);
    const target = layoutOf(state);
    const card = this.played(who, event.card.card);
    const groups = event.groups.map((g) => g.map((c) => this.now.find((m) => m.code === c.card)).filter(Boolean)).filter((g) => g.length);
    if (!groups.length) return; // nothing to gather: the settle places it
    this.closeUp(who, card, target, this.clock);
    this.gather(who, groups, { mesh: card, code: event.card.card, sweep }, target, this.clock);
  }

  // The last cards on the table to the last capturer, gathered as a capture
  // is, item by item in the order they lie.
  residue({ state, who, items }) {
    const target = layoutOf(state);
    const groups = items.map((codes) => codes.map((c) => this.now.find((m) => m.code === c)).filter(Boolean)).filter((g) => g.length);
    if (!groups.length) return;
    this.clock = Math.max(this.clock, this.end) + TIMING.beat;
    this.gather(who, groups, null, target, this.clock);
  }

  // Gather `groups` (meshes, in the order they are named) into a heap on the
  // first, the card played (if any: { mesh, code, sweep }) laid on it, and
  // turn the heap over into `who`'s pile.
  gather(who, groups, played, target, start) {
    const base = groups[0][0].pose.position;
    const heapPose = (k) => lying({ x: base.x, z: base.z, height: REST + k * STEP });
    const heap = [];
    const into = (mesh, at, duration) => {
      const pose = heapPose(heap.length);
      heap.push(mesh);
      if (samePose(this.now[mesh.id].pose, pose)) return at;
      return this.move(mesh.id, this.via(mesh.id, pose), slide(this.now[mesh.id].pose, pose, { lift: ride(pose) }), at, duration);
    };
    // The first group squared where it lies, while the card is on its way.
    let t = start;
    for (const mesh of groups[0]) t = Math.max(t, into(mesh, start, TIMING.gather));
    // The card laid on it, its face shown as it leaves the hand.
    const card = played?.mesh ?? null;
    if (card) {
      const pose = heapPose(heap.length);
      heap.push(card);
      const slot = { key: played.code, zone: "middle", index: 0, code: played.code, pose };
      t = Math.max(t, this.move(card.id, slot, pull(this.now[card.id].pose, pose, PLAYED), start, TIMING.play));
      t += who === "them" ? TIMING.look : TIMING.beat;
    }
    // A sweep's card held up, facing you, over its taker's side of the table.
    let held = null;
    if (card && played.sweep) {
      heap.pop();
      const side = who === "you" ? 1 : -1;
      const centre = new Vector3(base.x, 13, base.z + side * 6);
      held = fan({ count: 1, centre, facing: centre.clone().add(new Vector3(0, 0, 300)), tilt: (15 * Math.PI) / 180 })[0];
      this.move(card.id, this.via(card.id, held), pickUp(this.now[card.id].pose, held, { toward: TOWARD[who] }), t, TIMING.show * 0.6);
      t += TIMING.show * 0.3;
    }
    // The other groups pushed on, one after another.
    let end = t;
    groups.slice(1).forEach((group, g) => {
      group.forEach((mesh, i) => {
        end = Math.max(end, into(mesh, t + g * TIMING.gatherStep + i * 40, TIMING.gather));
      });
    });
    t = Math.max(t, end);
    // The heap turned over into the pile as one: its top card at the bottom.
    const pile = target.filter((s) => s.zone === PILE[who] && !s.code);
    const slots = pile.slice(pile.length - heap.length).reverse();
    const paths = carryBlock(
      heap.map((m) => this.now[m.id].pose),
      slots.map((s) => s.pose),
    );
    heap.forEach((mesh, j) => this.move(mesh.id, slots[j], paths[j], t, TIMING.carry));
    t += TIMING.carry;
    if (held) {
      const slot = target.find((s) => s.code === played.code);
      t = Math.max(t, this.move(card.id, slot, toss(held, slot.pose), Math.max(t - TIMING.carry * 0.3, start), TIMING.lay));
    }
    this.clock = t;
    // The rest of the table moves up.
    this.stage(target, null, t);
  }

  result() {
    return { motions: this.motions, placement: this.now, duration: Math.max(this.clock, this.end) };
  }
}

// Stages whose moment is their start: the cards collected are heard as they
// begin to move. Every other stage's moment is when it has landed.
const HEARD_AT_START = new Set(["collect"]);

export function choreograph(prev, next, placement, view = {}) {
  const plan = new Plan(placement, view);
  const stages = stagesBetween(prev, next);
  const marks = [];
  if (stages) {
    for (const stage of stages) {
      const start = plan.clock;
      plan[stage.kind](stage);
      marks.push({ at: stage.at, start, end: Math.max(plan.clock, plan.end), early: HEARD_AT_START.has(stage.kind) });
    }
  }
  plan.direct(next); // settle: exactly layout(next), whatever came before
  const result = plan.result();
  // When each new event is seen to happen, in ms on this plan's clock: an
  // event that moves no cards happens once the motion before it is done.
  const beats = {};
  let done = 0;
  let m = 0;
  for (let k = prev ? prev.events.length : 0; k < next.events.length; k++) {
    const own = [];
    while (m < marks.length && marks[m].at <= k) {
      if (marks[m].at === k) own.push(marks[m]);
      else done = Math.max(done, marks[m].end);
      m++;
    }
    beats[k] = own.length ? (own[0].early ? own[0].start : own[own.length - 1].end) : done;
    for (const mark of own) done = Math.max(done, mark.end);
  }
  return { ...result, beats };
}
