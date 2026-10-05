// The score HUD's model: the per-hand ledger, derived from the events, and
// the scoring events between two states (docs/TABLE3D.md section 8).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CATS, HAND_H, PANEL_CHROME, POPUP_BUSY, blank, handTotal, hudEvents, ledgerOf, ledgerTotals, listHeight, popupsOf, segmentState } from "../src/hud.js";
import { loadEngine } from "../src/engine.js";

const line = (item, who, points, suit = null) => ({ item, suit, who, points });
const rules = { game: "classic", aces14: false, sweeps: true };

test("the six categories, in the counting order", () => {
  assert.deepEqual(CATS.map(([k]) => k), ["cards", "spades", "big", "little", "aces", "sweeps"]);
  const h = blank();
  h.aces.you = 3;
  h.big.opp = 2;
  assert.equal(handTotal(h, "you"), 3);
  assert.equal(handTotal(h, "opp"), 2);
});

test("a segment is reached, the cursor, or unreached; the line stops at 21", () => {
  assert.equal(segmentState(3, 5), "reached");
  assert.equal(segmentState(5, 5), "cursor");
  assert.equal(segmentState(6, 5), "unreached");
  assert.equal(segmentState(1, 0), "unreached", "a score of 0 lights nothing");
  assert.equal(segmentState(21, 24), "cursor", "past 21, the finish is the cursor");
  assert.equal(segmentState(20, 24), "reached");
});

test("the ledger: each counted hand, and the hand under way with its sweeps so far", () => {
  const events = [
    { kind: "dealt", hand: 1, deal: 1 },
    { kind: "swept", hand: 1, you: true },
    { kind: "scored", hand: 1, count: { lines: [line("cards", "you", 3), line("ace", "them", 1, "S"), line("ace", "them", 1, "D"), line("sweeps", "you", 1)] } },
    { kind: "dealt", hand: 2, deal: 1 },
    { kind: "swept", hand: 2, you: false },
  ];
  const ledger = ledgerOf({ events, rules });
  assert.equal(ledger.hands.length, 1);
  assert.deepEqual(ledger.hands[0].cards, { you: 3, opp: 0 });
  assert.deepEqual(ledger.hands[0].aces, { you: 0, opp: 2 });
  assert.deepEqual(ledger.hands[0].sweeps, { you: 1, opp: 0 });
  assert.deepEqual(ledger.live.sweeps, { you: 0, opp: 1 });
  assert.deepEqual(ledgerTotals(ledger), { you: 4, opp: 3 });
  // Without sweeps scored, a sweep is not a point.
  const plain = ledgerOf({ events, rules: { ...rules, sweeps: false } });
  assert.deepEqual(plain.live.sweeps, { you: 0, opp: 0 });
});

test("the events between two states: sweeps as they happen; the count with the aces together and its sweeps already shown", () => {
  const events = [
    { kind: "dealt", hand: 1, deal: 1 },
    { kind: "swept", hand: 1, you: false },
    {
      kind: "scored",
      hand: 1,
      count: {
        lines: [
          line("cards", "you", 3),
          line("big_casino", "them", 2),
          line("ace", "you", 1, "S"),
          line("ace", "them", 1, "C"),
          line("ace", "you", 1, "H"),
          line("sweeps", "them", 1),
        ],
      },
    },
  ];
  const out = hudEvents({ events, rules }, 1);
  assert.deepEqual(
    out.map((e) => (e.end ? "end" : `${e.side}:${e.cat}:${e.pts}@${e.line ?? "-"}`)),
    ["opp:sweeps:1@-", "you:cards:3@0", "opp:big:2@1", "you:aces:2@2", "opp:aces:1@3", "end"],
  );
  assert.equal(out[0].label, "Sweep");
  assert.equal(out[3].label, "Aces");
  assert.equal(out.at(-1).line, 6, "the hand ends once its count has been said");
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("over real games the ledger adds up to the game's score, and its events to the ledger", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  for (const [seed, sweeps] of [[3, true], [6, false], [9, true]]) {
    let s = engine.watch({ game: "classic", sweeps, skills: [3, 3], seed });
    let since = 0;
    let shown = ledgerOf({ ...s, events: s.events.slice(0, 0) });
    let running = ledgerTotals(ledgerOf(s));
    while (s.prompt !== "over") {
      s = engine.step().state;
      // Played out, the events take the totals where the ledger says.
      for (const e of hudEvents(s, since)) if (!e.end) running = { ...running, [e.side]: running[e.side] + e.pts };
      since = s.events.length;
      const ledger = ledgerOf(s);
      assert.deepEqual(running, ledgerTotals(ledger), `seed ${seed}: the events agree with the ledger`);
      const live = ledger.live ? { you: handTotal(ledger.live, "you"), opp: handTotal(ledger.live, "opp") } : { you: 0, opp: 0 };
      assert.deepEqual(ledgerTotals(ledger), { you: s.scores.you + live.you, opp: s.scores.them + live.opp }, `seed ${seed}: the ledger is the game's score and the live sweeps`);
      shown = ledger;
    }
    assert.ok(shown.hands.length >= 2);
  }
});

// ---- the widget, on a stand-in DOM and a clock moved by hand -------------------

class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.style = { setProperty() {} };
    this.textContent = "";
    this.className = "";
    const el = this;
    this.classList = {
      add: (...c) => (el.className = [...new Set([...el.className.split(" ").filter(Boolean), ...c])].join(" ")),
      remove: (...c) => (el.className = el.className.split(" ").filter((x) => x && !c.includes(x)).join(" ")),
      toggle: (c, on) => (on ? el.classList.add(c) : el.classList.remove(c)),
      contains: (c) => el.className.split(" ").includes(c),
    };
  }
  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }
  getAttribute(k) {
    return this.attributes[k] ?? null;
  }
  append(...nodes) {
    for (const n of nodes) this.children.push(typeof n === "string" ? Object.assign(new FakeElement("#text"), { textContent: n }) : n);
  }
  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }
  addEventListener() {}
  set innerHTML(_) {}
  get offsetWidth() {
    return 0;
  }
}

function clock() {
  let now = 0;
  const queue = [];
  return {
    later: (ms, fn) => queue.push({ at: now + ms, fn }),
    run(ms) {
      const until = now + ms;
      for (;;) {
        queue.sort((a, b) => a.at - b.at);
        if (!queue.length || queue[0].at > until) break;
        const e = queue.shift();
        now = e.at;
        e.fn();
      }
      now = until;
    },
  };
}

test("the widget: a hand's late popups stay in that hand, and the next hand's live block opens at its deal (the table review's T6)", async () => {
  globalThis.document = { createElement: (tag) => new FakeElement(tag) };
  const { createHud } = await import("../src/hud.js");
  const c = clock();
  const hud = createHud(new FakeElement("div"), { later: c.later });
  hud.reset({ hands: [], live: blank() });
  // Hand 1's count: five lines to you, queued one after another.
  for (const [cat, pts] of [["cards", 3], ["spades", 1], ["big", 2], ["little", 1], ["aces", 3]]) hud.score({ side: "you", cat, label: cat, pts, hand: 1 });
  hud.endHand(1);
  // Next hand at once (Brisk), and your opponent sweeps with its first card.
  hud.dealt(2);
  hud.score({ side: "opp", cat: "sweeps", label: "Sweep", pts: 1, hand: 2 });
  c.run(20_000);
  const l = hud.ledger();
  assert.deepEqual(l.hands.map((h) => [h.hand, h.ended]), [[1, true], [2, false]]);
  assert.equal(handTotal(l.hands[0].lines, "you"), 10);
  assert.equal(handTotal(l.hands[0].lines, "opp"), 0, "the sweep is not booked to hand 1");
  assert.deepEqual(l.hands[1].lines.sweeps, { you: 0, opp: 1 });
  assert.deepEqual(hud.totals(), { you: 10, opp: 1 });
  assert.deepEqual(hud.shown(), { you: 10, opp: 1 });
  assert.ok(hud.idle());
  delete globalThis.document;
});

test("the count's popups, line by line: whose popup each line brings, the aces one a player", () => {
  const lines = [
    { item: "cards", who: "them", points: 3 },
    { item: "spades", who: "them", points: 1 },
    { item: "big_casino", who: "you", points: 2 },
    { item: "ace", who: "them", suit: "S", points: 1 },
    { item: "ace", who: "them", suit: "H", points: 1 },
    { item: "ace", who: "you", suit: "D", points: 1 },
    { item: "sweeps", who: "you", points: 2 },
  ];
  assert.deepEqual(popupsOf(lines), ["opp", "opp", "you", "opp", null, "you", null]);
  assert.ok(POPUP_BUSY > 1000);
});

// The seventh play-testing: "when the hud gets long enough, it collides
// with the bottom drawer. please fix this by ensuring the scoring hud is
// scrollable, but it won't overlap with the bottom drawer." The ledger's
// list is as tall as its hands, or as the room the page measures allows
// (less the ledger's own rules, heads and total), and scrolls past it.
test("the ledger's list: all its hands where there is room, and no taller than the room, scrolling past it", () => {
  assert.equal(listHeight(2, 1000), 2 * HAND_H, "room enough: every hand");
  assert.equal(listHeight(5, 600), 600 - PANEL_CHROME, "short of room: as tall as it, less the ledger's chrome");
  assert.equal(listHeight(5, 40), 0, "no room: the totals alone, never over the drawer");
  assert.equal(listHeight(0, 600), 0);
  assert.equal(listHeight(9, Infinity), 9 * HAND_H, "unmeasured: the whole of it");
});

// The user: "if the scoring heads up display is extended, and you click
// outside of it, it should automatically retract." The page folds it
// (main.js); folding says so, as the chevron does, and folding it folded
// does nothing.
test("the widget folds when the page asks, as the chevron would", async () => {
  globalThis.document = { createElement: (tag) => new FakeElement(tag) };
  const { createHud } = await import("../src/hud.js");
  const told = [];
  const hud = createHud(new FakeElement("div"), { onToggle: (open) => told.push(open) });
  hud.reset({ hands: [], live: blank() });
  assert.equal(hud.isOpen(), false);
  hud.fold();
  assert.deepEqual(told, [], "folded already: nothing");
  hud.setOpen(true);
  assert.equal(hud.isOpen(), true);
  hud.fold();
  assert.equal(hud.isOpen(), false);
  assert.deepEqual(told, [true, false]);
  delete globalThis.document;
});
