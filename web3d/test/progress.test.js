// What the tutor keeps between games (src/progress.js): the last 30
// finished games, each as its record and its summary, in the browser's
// storage, with every access surviving storage that is missing or throws.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_GAMES, addGame, clearProgress, exportProgress, historyOf, importProgress, loadProgress, progressSaid, refreshOne } from "../src/progress.js";

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k), m };
};
const broken = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("full");
  },
  removeItem() {
    throw new Error("blocked");
  },
};
const game = (n) => ({ record: `cassino record v1\nseed ${n}\n`, summary: `cassino evidence v1\npairs ${n} 0 0` });

test("a finished game is kept with its summary and read back after a reload", () => {
  const store = memory();
  assert.deepEqual(loadProgress(store), []);
  assert.equal(addGame(store, game(1)), true);
  addGame(store, game(2));
  assert.deepEqual(loadProgress(store), [game(1), game(2)]);
  assert.deepEqual(historyOf(loadProgress(store)), [game(1).summary, game(2).summary]);
  assert.ok([...store.m.keys()].every((k) => k.startsWith("cassino.progress")), "under one versioned key");
});

test("only the last thirty games are kept, and a game is kept once", () => {
  const store = memory();
  for (let n = 1; n <= MAX_GAMES + 5; n++) addGame(store, game(n));
  const kept = loadProgress(store);
  assert.equal(kept.length, MAX_GAMES);
  assert.equal(kept[0].record, game(6).record, "the oldest went first");
  assert.equal(kept.at(-1).record, game(MAX_GAMES + 5).record);
  addGame(store, game(MAX_GAMES + 5));
  assert.equal(loadProgress(store).length, MAX_GAMES, "the same game again is not a second game");
});

test("with storage missing or throwing, everything works as one game", () => {
  for (const store of [broken, null, undefined]) {
    assert.deepEqual(loadProgress(store), []);
    assert.equal(addGame(store, game(1)), false);
    assert.doesNotThrow(() => clearProgress(store));
    assert.equal(refreshOne(store, { learner: () => ({ stale: [] }) }), false);
  }
  assert.deepEqual(historyOf([]), []);
});

test("what was kept in damaged or foreign form is ignored", () => {
  for (const bad of ["{", "null", "[]", '{"v":99,"games":[{"record":"x","summary":"y"}]}', '{"v":1,"games":"no"}']) {
    const store = memory();
    store.setItem("cassino.progress", bad);
    assert.deepEqual(loadProgress(store), [], bad);
  }
  const store = memory();
  store.setItem("cassino.progress", JSON.stringify({ v: 1, games: [game(1), { record: 5 }, null, { record: "r", summary: 3 }] }));
  assert.deepEqual(loadProgress(store), [game(1), { record: "r", summary: null }], "odd entries dropped, an odd summary becomes missing");
});

test("the settings say what is kept", () => {
  assert.match(progressSaid(0), /Nothing is kept/);
  assert.match(progressSaid(1), /last game is kept/);
  assert.match(progressSaid(7), /last 7 games are kept in this browser only/);
});

test("clearing forgets everything", () => {
  const store = memory();
  addGame(store, game(1));
  clearProgress(store);
  assert.deepEqual(loadProgress(store), []);
});

test("stale summaries are recomputed one at a time from their records", () => {
  const store = memory();
  addGame(store, { record: "r1", summary: "old" });
  addGame(store, game(2));
  addGame(store, { record: "r3", summary: null });
  const asked = [];
  const engine = {
    learner: (history) => ({ stale: history.flatMap((s, i) => (s === "old" || s === null ? [i] : [])) }),
    evidenceOf: (record) => (asked.push(record), record === "r3" ? null : `fresh ${record}`),
  };
  const gave = new Set();
  assert.equal(refreshOne(store, engine, gave), true, "the first stale one");
  assert.deepEqual(asked, ["r1"]);
  assert.equal(loadProgress(store)[0].summary, "fresh r1");
  // The third record gives nothing (it will not restore): it is left, and
  // the loop ends rather than asking again.
  assert.equal(refreshOne(store, engine, gave), true, "r3 was tried");
  assert.equal(refreshOne(store, engine, gave), false, "nothing else is stale");
  assert.deepEqual(asked, ["r1", "r3"]);
  assert.equal(loadProgress(store)[2].summary, null);
  assert.equal(refreshOne(store, engine, gave), false);
  assert.deepEqual(asked, ["r1", "r3"], "an unrecomputable record is not asked for again this sitting");
});

test("progress is exported as a file and imported back; a bad file is refused politely", () => {
  const store = memory();
  addGame(store, game(1));
  addGame(store, game(2));
  const text = exportProgress(loadProgress(store));
  const other = memory();
  const got = importProgress(other, text);
  assert.equal(got.ok, true);
  assert.equal(got.count, 2);
  assert.deepEqual(loadProgress(other), loadProgress(store));
  for (const bad of ["", "hello", "{", '{"cassino":"progress","v":99,"games":[]}', '{"cassino":"other","v":1,"games":[]}', '{"cassino":"progress","v":1,"games":[{"record":3}]}']) {
    const target = memory();
    addGame(target, game(9));
    const r = importProgress(target, bad);
    assert.equal(r.ok, false, bad);
    assert.match(r.error, /\S/);
    assert.deepEqual(loadProgress(target), [game(9)], "a refused file changes nothing");
  }
  const big = exportProgress(Array.from({ length: 40 }, (_, n) => game(n)));
  assert.equal(importProgress(memory(), big).count, MAX_GAMES, "an import is capped too");
  assert.equal(importProgress(broken, text).ok, false, "storage that will not keep it is said so");
});
