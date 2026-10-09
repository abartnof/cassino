// What the tutor keeps between games (src/progress.js): the last 30
// finished games, each as its record and its summary, in the browser's
// storage, with every access surviving storage that is missing or throws.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_GAMES, MAX_IMPORT, MAX_RECORD, addGame, clearProgress, exportProgress, historyOf, importProgress, isNewerStore, loadProgress, progressSaid, refreshOne, setSummary, validSummary } from "../src/progress.js";

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
const SKILLS = ["pairs", "sums", "building", "safe-builds", "answering-builds", "sweeps", "valuables", "trailing"];
const summaryOf = (n, v = 1) => `cassino evidence v${v}\n${SKILLS.map((s) => `${s} ${n} 0 0`).join("\n")}\n`;
const game = (n) => ({ record: `cassino record v1\nseed ${n}\n`, summary: summaryOf(n) });

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

test("with storage missing or throwing, everything works as one game", async () => {
  for (const store of [broken, null, undefined]) {
    assert.deepEqual(loadProgress(store), []);
    assert.equal(addGame(store, game(1)), false);
    assert.doesNotThrow(() => clearProgress(store));
    assert.equal(await refreshOne(store, { learner: () => ({ stale: [] }) }), false);
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

test("stale summaries are recomputed one at a time from their records", async () => {
  const store = memory();
  addGame(store, { record: "r1", summary: summaryOf(1, 0) });
  addGame(store, game(2));
  addGame(store, { record: "r3", summary: null });
  const asked = [];
  const engine = {
    learner: (history) => ({ stale: history.flatMap((s, i) => (s === null || /^cassino evidence v0/.test(s) ? [i] : [])) }),
    evidenceOf: (record) => (asked.push(record), record === "r3" ? null : summaryOf(9)),
  };
  const gave = new Set();
  assert.equal(await refreshOne(store, engine, gave), true, "the first stale one");
  assert.deepEqual(asked, ["r1"]);
  assert.equal(loadProgress(store)[0].summary, summaryOf(9));
  // The third record gives nothing (it will not restore): it is left, and
  // the loop ends rather than asking again.
  assert.equal(await refreshOne(store, engine, gave), true, "r3 was tried");
  assert.equal(await refreshOne(store, engine, gave), false, "nothing else is stale");
  assert.deepEqual(asked, ["r1", "r3"]);
  assert.deepEqual(loadProgress(store).map((g) => g.record), ["r1", "cassino record v1\nseed 2\n"], "a record that will not restore is dropped after the one try");
  assert.equal(await refreshOne(store, engine, gave), false);
  assert.deepEqual(asked, ["r1", "r3"]);
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

// ---- hardening (the tutor's page-side review) ------------------------------

test("a summary is kept only if it reads as the engine's evidence text", () => {
  assert.equal(validSummary(summaryOf(3)), true);
  assert.equal(validSummary(summaryOf(3).trimEnd()), true, "the last newline does not matter");
  for (const bad of [null, 5, "", "hello", "cassino evidence v1\npairs 1 0 0\n", `${summaryOf(1)}--\n`, summaryOf(1).replace("pairs 1 0 0\n", "--\n"), `junk\n${summaryOf(1)}`, `cassino evidence vx\n${SKILLS.map((s) => `${s} 1 0 0`).join("\n")}`, "x".repeat(5000)]) {
    assert.equal(validSummary(bad), false, String(bad).slice(0, 40));
  }
  const store = memory();
  store.setItem("cassino.progress", JSON.stringify({ v: 1, games: [{ record: "r", summary: "cassino evidence v1\n--\n" }, { record: "s", summary: summaryOf(2) }] }));
  assert.deepEqual(loadProgress(store), [{ record: "r", summary: null }, { record: "s", summary: summaryOf(2) }], "a bad summary becomes missing, to be recomputed");
  assert.equal(setSummary(store, "r", "not a summary"), false, "an unreadable summary is refused");
  assert.equal(loadProgress(store)[0].summary, null);
  assert.equal(setSummary(store, "s", "not a summary"), false);
  assert.equal(loadProgress(store)[1].summary, summaryOf(2), "and a good one is not lost to it");
});

test("a record is capped in length, and a long one is not kept", () => {
  const store = memory();
  const long = { record: "x".repeat(MAX_RECORD + 1), summary: null };
  assert.equal(addGame(store, long), false, "refused");
  assert.deepEqual(loadProgress(store), []);
  store.setItem("cassino.progress", JSON.stringify({ v: 1, games: [long, game(1)] }));
  assert.deepEqual(loadProgress(store), [game(1)], "and dropped on reading");
  assert.equal(addGame(memory(), { record: "x".repeat(MAX_RECORD), summary: null }), true);
});

test("an import file has a size limit and must hold a game", () => {
  const store = memory();
  addGame(store, game(9));
  const padded = JSON.stringify({ cassino: "progress", v: 1, games: [game(1)], pad: "x".repeat(MAX_IMPORT) });
  const r = importProgress(store, padded);
  assert.equal(r.ok, false);
  assert.match(r.error, /too large|big/i);
  const none = importProgress(store, JSON.stringify({ cassino: "progress", v: 1, games: [] }));
  assert.equal(none.ok, false);
  assert.match(none.error, /no games|nothing to import/i);
  assert.deepEqual(loadProgress(store), [game(9)], "both refused leave what was kept");
  const mixed = importProgress(store, JSON.stringify({ cassino: "progress", v: 1, games: [{ record: "x".repeat(MAX_RECORD + 1) }] }));
  assert.equal(mixed.ok, false, "a file whose only games are too long holds nothing to import");
});

test("a store from a newer page is left untouched and read as empty", () => {
  const store = memory();
  const newer = JSON.stringify({ v: 2, games: [game(1)], extra: "from the future" });
  store.setItem("cassino.progress", newer);
  assert.equal(isNewerStore(store), true);
  assert.deepEqual(loadProgress(store), []);
  assert.equal(addGame(store, game(5)), false, "never overwritten");
  assert.equal(setSummary(store, game(1).record, summaryOf(7)), false);
  assert.equal(store.getItem("cassino.progress"), newer);
  assert.equal(importProgress(store, exportProgress([game(2)])).ok, false, "nor by an import");
  assert.equal(store.getItem("cassino.progress"), newer);
  assert.match(progressSaid(0, true), /newer version/i);
  assert.equal(isNewerStore(memory()), false);
  assert.equal(isNewerStore(broken), false);
  const same = memory();
  addGame(same, game(1));
  assert.equal(isNewerStore(same), false);
});

test("summaries of a newer evidence are not recomputed back", async () => {
  const store = memory();
  addGame(store, { record: "r1", summary: summaryOf(1, 3) });
  addGame(store, { record: "r2", summary: summaryOf(2, 0) });
  const asked = [];
  const engine = {
    learner: (h) => ({ version: 2, stale: h.map((_, i) => i) }),
    evidenceOf: (r) => (asked.push(r), summaryOf(5, 2)),
  };
  const tried = new Set();
  assert.equal(await refreshOne(store, engine, tried), true);
  assert.equal(await refreshOne(store, engine, tried), false);
  assert.deepEqual(asked, ["r2"], "the one from the future is left alone");
  assert.equal(loadProgress(store)[0].summary, summaryOf(1, 3));
});

test("a recompute that throws is passed over and the rest go on", async () => {
  const store = memory();
  addGame(store, { record: "r1", summary: null });
  addGame(store, { record: "r2", summary: null });
  const engine = {
    learner: (h) => ({ version: 1, stale: h.map((s, i) => (s === null ? i : -1)).filter((i) => i >= 0) }),
    evidenceOf: (r) => {
      if (r === "r1") throw new Error("worker died");
      return summaryOf(2);
    },
  };
  const tried = new Set();
  assert.equal(await refreshOne(store, engine, tried), true, "r1 failed");
  assert.equal(await refreshOne(store, engine, tried), true, "and r2 was still done");
  assert.equal(await refreshOne(store, engine, tried), false);
  const kept = loadProgress(store);
  assert.deepEqual(kept.map((g) => g.record), ["r1", "r2"], "a throw is not a verdict on the record");
  assert.equal(kept[1].summary, summaryOf(2));
  assert.equal(await refreshOne(store, { learner: () => { throw new Error("x"); } }, new Set()), false, "a learner that throws ends the loop");
});

test("a record is not dropped when the engine itself has stopped", async () => {
  const store = memory();
  addGame(store, { record: "r1", summary: null });
  const engine = { stopped: () => true, learner: () => ({ version: 1, stale: [0] }), evidenceOf: () => null };
  await refreshOne(store, engine, new Set());
  assert.equal(loadProgress(store).length, 1);
});
