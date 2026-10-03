// The choreography: from one state to the next, through the events between
// them, ending exactly on the layout (docs/TABLE3D.md section 6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { choreograph, initialPlacement, opening, stagesBetween } from "../src/choreography.js";
import { cardCorners } from "../src/kinematics.js";
import { layout, sweepCards } from "../src/layout.js";
import { loadEngine } from "../src/engine.js";

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);
const skip = !existsSync(WASM) && "build the module first";
const engine = existsSync(WASM) ? await loadEngine(readFileSync(WASM)) : null;

const laidOut = (state, view = {}) => layout(state, { ...view, sweeps: sweepCards(state.events, state.hand_number) });
const codes = (cards) => cards.map((c) => c.card ?? c);

// What the person may know after `next`: their hand, the table, the sweep
// cards, and every card the events between showed them.
function known(prev, next) {
  const seen = new Set([...codes(next.hand), ...next.table.flatMap((i) => codes(i.cards))]);
  if (prev) for (const c of [...codes(prev.hand), ...prev.table.flatMap((i) => codes(i.cards))]) seen.add(c);
  for (const e of next.events.slice(prev ? prev.events.length : 0)) {
    if (e.kind === "played") for (const c of [e.card, ...(e.taken ?? []), ...(e.loose ?? [])]) seen.add(c.card);
    if (e.kind === "dealt") for (const c of [...e.yours, ...e.table]) seen.add(c.card);
  }
  return seen;
}

// Plays a choreography out on paper: checks it, and returns the placement it
// leaves.
function playOut(prev, next, placement, label, view = {}) {
  const result = choreograph(prev, next, placement, view);
  const target = laidOut(next, view);
  // Every slot of layout(next) has exactly one mesh on it, showing its face.
  const left = [...result.placement];
  for (const slot of target) {
    const k = left.findIndex((m) => m.pose.position.distanceTo(slot.pose.position) < 1e-9 && Math.abs(Math.abs(m.pose.quaternion.dot(slot.pose.quaternion)) - 1) < 1e-9);
    assert.ok(k >= 0, `${label}: nothing lands on ${slot.key}`);
    assert.equal(left[k].code, slot.code, `${label}: the face at ${slot.key}`);
    left.splice(k, 1);
  }
  // Each mesh's motions follow one another, and the last ends where it rests.
  const byMesh = new Map();
  for (const m of result.motions) {
    if (!byMesh.has(m.id)) byMesh.set(m.id, []);
    byMesh.get(m.id).push(m);
  }
  const faces = new Map(placement.map((m) => [m.id, m.code]));
  for (const [id, list] of byMesh) {
    list.sort((a, b) => a.delay - b.delay);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].delay >= list[i - 1].delay + list[i - 1].duration - 1e-9, `${label}: mesh ${id}'s motions overlap`);
    const end = list[list.length - 1].path(1);
    const rest = result.placement[id].pose;
    assert.ok(end.position.distanceTo(rest.position) < 1e-6, `${label}: mesh ${id} ends where it rests`);
    for (const m of list) if (m.reveal) faces.set(id, m.reveal.code);
    assert.ok(result.duration >= list[list.length - 1].delay + list[list.length - 1].duration - 1e-9, `${label}: the duration covers every motion`);
  }
  for (const m of result.placement) assert.equal(faces.get(m.id) ?? null, m.code ?? null, `${label}: mesh ${m.id} shows the face it rests with`);
  // No face shown that the person could not know.
  const may = known(prev, next);
  for (const m of result.motions) if (m.reveal?.code) assert.ok(may.has(m.reveal.code), `${label}: ${m.reveal.code} shown`);
  return result;
}

// Nothing passes through the table, on any path.
function throughTable(result) {
  let worst = 0;
  for (const m of result.motions) {
    for (let i = 0; i <= 40; i++) {
      const p = m.path(i / 40);
      worst = Math.min(worst, ...cardCorners(p).map((c) => c.y));
    }
  }
  return worst;
}

test("the reducer replays a move into the state the engine reaches", { skip }, () => {
  for (const [seed, game, aces14] of [[3, "classic", false], [8, "royal", true], [21, "royal", false]]) {
    let state = engine.watch({ game, aces14, sweeps: true, skill: 3, seed });
    for (let n = 0; state.prompt !== "over" && n < 400; n++) {
      const next = engine.step().state;
      const stages = stagesBetween(state, next);
      assert.ok(stages, `seed ${seed} step ${n} follows on`);
      if (stages.length) {
        const s = stages[stages.length - 1].state;
        const label = `seed ${seed} step ${n} (${next.events.slice(state.events.length).map((e) => e.kind).join(", ")})`;
        assert.deepEqual(codes(s.hand), codes(next.hand), `${label}: hand`);
        assert.equal(s.opponent_holds, next.opponent_holds, `${label}: their hand`);
        assert.deepEqual(s.table.map((i) => codes(i.cards)), next.table.map((i) => codes(i.cards)), `${label}: table`);
        assert.equal(s.piles.you.cards, next.piles.you.cards, `${label}: your pile`);
        assert.equal(s.piles.them.cards, next.piles.them.cards, `${label}: their pile`);
        assert.equal(s.undealt, next.undealt, `${label}: stock`);
        assert.equal(s.dealer, next.dealer, `${label}: dealer`);
      }
      state = next;
    }
    assert.equal(state.prompt, "over");
  }
});

test("every choreography of real games ends exactly at the layout, faces only where known", { skip }, () => {
  let worst = 0;
  for (const [seed, game] of [[1, "classic"], [2, "royal"], [5, "classic"]]) {
    let state = engine.start({ game, aces14: game === "royal", sweeps: true, skill: 2, seed });
    const start = opening(state);
    let placement = playOut(start, state, initialPlacement(start), `seed ${seed} opening`).placement;
    for (let n = 0; state.prompt !== "over"; n++) {
      // Now and then a card chosen and table cards picked, seen first.
      const view = n % 3 === 0 && state.prompt === "play" ? { chosen: state.hand[0].card, picked: state.table.length ? codes(state.table[0].cards) : [] } : {};
      if (view.chosen) placement = playOut(state, state, placement, `seed ${seed} step ${n} choosing`, view).placement;
      const command = state.prompt === "play" ? state.moves[(n * 7) % state.moves.length] : "next";
      const next = engine.send(command).state;
      const result = playOut(state, next, placement, `seed ${seed} step ${n} ${command}`);
      worst = Math.min(worst, throughTable(result));
      placement = result.placement;
      state = next;
    }
  }
  assert.ok(worst >= -1e-6, `a card dips ${worst} cm into the table`);
});

test("an undo and a new game go straight to their layouts", { skip }, () => {
  let state = engine.start({ game: "classic", sweeps: true, skill: 1, seed: 11 });
  let placement = initialPlacement(state);
  for (let n = 0; n < 6; n++) {
    const next = engine.send(state.moves[0]).state;
    placement = playOut(state, next, placement, `move ${n}`).placement;
    state = next;
  }
  const undone = engine.send("undo").state;
  assert.equal(stagesBetween(state, undone), null);
  placement = playOut(state, undone, placement, "undo").placement;
  const fresh = engine.start({ game: "royal", sweeps: false, skill: 4, seed: 12 });
  assert.equal(stagesBetween(undone, fresh), null);
  playOut(undone, fresh, placement, "new game");
});

test("the opening deal goes in twos: elder, table, dealer, and round again", { skip }, () => {
  const state = engine.start({ game: "classic", sweeps: true, skill: 1, seed: 4 });
  const start = opening(state);
  const placement = initialPlacement(start);
  const result = choreograph(start, state, placement);
  const dealt = result.motions.filter((m) => placement[m.id].zone === "stock").sort((a, b) => a.delay - b.delay);
  const where = (m) => result.placement[m.id].zone;
  const elder = state.dealer === "you" ? "their-hand" : "your-hand";
  const dealer = state.dealer === "you" ? "your-hand" : "their-hand";
  // The deal's twelve, before any play (the elder may have played one).
  const firstTwelve = dealt.slice(0, 12).map((m) => {
    const z = where(m);
    return z === "middle" || z.endsWith("pile") ? "table" : z;
  });
  const expected = [elder, elder, "table", "table", dealer, dealer, elder, elder, "table", "table", dealer, dealer];
  // A card the elder has since played left their hand: it went there first.
  firstTwelve.forEach((z, i) => {
    if (expected[i] === elder && z === "table") return;
    assert.equal(z, expected[i], `card ${i} of the deal`);
  });
});

// A position to capture from, built by hand: the table as the protocol gives
// it, your hand, and your opponent's.
const card = (code) => ({ card: code, label: code, rank: 0, suit: code[1] });
function position({ hand, table, holds = 3, piles = [0, 0], events = [] }) {
  return {
    seed: 1,
    rules: { game: "classic", aces14: false, sweeps: true },
    watching: false,
    events,
    hand: hand.map(card),
    opponent_holds: holds,
    table: table.map(([id, cs, build]) => ({ id, cards: cs.map(card), build: build ?? null })),
    piles: { you: { cards: piles[0], sweeps: 0 }, them: { cards: piles[1], sweeps: 0 } },
    undealt: 24,
    dealer: "them",
    hand_number: 1,
  };
}

test("the gather: the card on the first group, the others pushed on in turn, the heap turned into the pile", () => {
  const before = position({
    hand: ["8S", "KD"],
    table: [
      [1, ["8H"]],
      [2, ["5C"]],
      [3, ["2D"]],
      [4, ["3D"]],
      [5, ["6C", "2S"], { value: 8, multiple: false, controller: "them" }],
      [6, ["QH"]],
    ],
    piles: [4, 6],
    events: [{ kind: "dealt", hand: 1, text: "Deal 3 of 6." }],
  });
  const played = {
    kind: "played",
    hand: 1,
    text: "You take.",
    you: true,
    move: "take 8S 8H 5C 3D 6C 2S",
    card: card("8S"),
    type: "take",
    value: 8,
    taken: ["8H", "5C", "3D", "6C", "2S"].map(card),
    groups: [["8H"], ["6C", "2S"], ["5C", "3D"]].map((g) => g.map(card)),
    call: null,
  };
  const after = {
    ...before,
    events: [...before.events, played],
    hand: [card("KD")],
    table: [
      [3, ["2D"]],
      [6, ["QH"]],
    ].map(([id, cs]) => ({ id, cards: cs.map(card), build: null })),
    piles: { you: { cards: 10, sweeps: 0 }, them: { cards: 6, sweeps: 0 } },
  };
  const placement = initialPlacement(before);
  const result = playOut(before, after, placement, "the gather");
  const id = (code) => placement.find((m) => m.code === code).id;
  const motionsOf = (code) => result.motions.filter((m) => m.id === id(code)).sort((a, b) => a.delay - b.delay);
  const landed = motionsOf("8S")[0];
  const first = landed.path(1).position;
  assert.ok(first.distanceTo(placement[id("8H")].pose.position.clone().setY(first.y)) < 1e-9, "the card lands on the first group");
  const pushed = (code) => motionsOf(code)[0].delay;
  assert.ok(pushed("6C") >= landed.delay + landed.duration, "the build is pushed on after the card has landed");
  assert.ok(pushed("5C") > pushed("6C"), "the sum after the build, as they were named");
  // Into your pile, face down, all at once: the heap goes as one.
  const into = ["8H", "8S", "6C", "2S", "5C", "3D"].map((c) => motionsOf(c).at(-1));
  assert.ok(into.every((m) => m.delay === into[0].delay), "the heap goes as one");
  assert.ok(into.every((m) => m.reveal?.code === null && m.reveal.atEnd), "turned face down as it lands");
  assert.ok(into[0].delay >= Math.max(...["6C", "2S", "5C", "3D"].map((c) => motionsOf(c)[0].delay + motionsOf(c)[0].duration)) - 1e-9);
  // The rest of the table moves up only after.
  const moveUp = motionsOf("QH");
  assert.ok(moveUp.length === 1 && moveUp[0].delay >= into[0].delay + into[0].duration - 1e-9, "the table closes up after the gather");
  assert.ok(throughTable(result) >= -1e-6);
});

test("a sweep's card is held up, then laid crosswise on the pile once the heap is in", () => {
  const before = position({ hand: ["9S", "KD"], table: [[1, ["4H"]], [2, ["5C"]]], piles: [4, 6], events: [{ kind: "dealt", hand: 1, text: "Deal 3 of 6." }] });
  const played = {
    kind: "played",
    hand: 1,
    text: "You take.",
    you: true,
    move: "take 9S 4H 5C",
    card: card("9S"),
    type: "take",
    value: 9,
    taken: ["4H", "5C"].map(card),
    groups: [["4H", "5C"].map(card)],
    call: null,
  };
  const swept = { kind: "swept", hand: 1, text: "Sweep!", you: true };
  const after = {
    ...before,
    events: [...before.events, played, swept],
    hand: [card("KD")],
    table: [],
    piles: { you: { cards: 7, sweeps: 1 }, them: { cards: 6, sweeps: 0 } },
  };
  const placement = initialPlacement(before);
  const result = playOut(before, after, placement, "the sweep");
  const id = placement.find((m) => m.code === "9S").id;
  const mine = result.motions.filter((m) => m.id === id).sort((a, b) => a.delay - b.delay);
  assert.equal(mine.length, 3, "laid on the heap, held up, laid crosswise");
  const held = mine[1].path(1);
  assert.ok(held.position.y > 8, "held up over the table");
  const heap = result.motions.filter((m) => m.id !== id && m.reveal?.atEnd);
  assert.equal(heap.length, 2);
  assert.ok(mine[2].delay + mine[2].duration > heap[0].delay + heap[0].duration, "laid crosswise after the heap is in");
  const rest = result.placement[id];
  assert.equal(rest.code, "9S");
  assert.equal(rest.zone, "your-pile");
  assert.ok(throughTable(result) >= -1e-6);
});

test("beats: each new event's moment, after the motion it names", { skip }, () => {
  let state = engine.start({ game: "classic", sweeps: true, skill: 2, seed: 9 });
  const placement = initialPlacement(state);
  const next = engine.send(state.moves[0]).state;
  const result = choreograph(state, next, placement);
  const ks = Object.keys(result.beats).map(Number);
  assert.deepEqual(ks, [...Array(next.events.length - state.events.length).keys()].map((k) => k + state.events.length));
  for (let i = 1; i < ks.length; i++) assert.ok(result.beats[ks[i]] >= result.beats[ks[i - 1]], "in order");
  assert.ok(result.beats[ks[0]] > 0, "your move is seen when it lands");
});
