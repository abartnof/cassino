// The person's settings, kept in the browser: defaults, storage that may
// fail, the URL's overrides, and the daily deal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULTS, SKILLS, dailySeed, loadPrefs, savePrefs, loadSitting, saveSitting, withUrl } from "../src/prefs.js";

function memory() {
  const items = new Map();
  return { getItem: (k) => (items.has(k) ? items.get(k) : null), setItem: (k, v) => items.set(k, String(v)), removeItem: (k) => items.delete(k) };
}
const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };

test("with nothing kept, the defaults; what is kept comes back", () => {
  const store = memory();
  assert.deepEqual(loadPrefs(store), DEFAULTS);
  savePrefs(store, { ...DEFAULTS, skill: 2.5, rules: { game: "royal", aces14: true, sweeps: false } });
  const back = loadPrefs(store);
  assert.equal(back.skill, 2.5);
  assert.deepEqual(back.rules, { game: "royal", aces14: true, sweeps: false });
  assert.deepEqual(back.aids, DEFAULTS.aids);
});

test("storage that throws, or holds nonsense, gives the defaults and never fails", () => {
  assert.deepEqual(loadPrefs(broken), DEFAULTS);
  savePrefs(broken, DEFAULTS);
  assert.equal(loadSitting(broken), null);
  saveSitting(broken, "text");
  const store = memory();
  store.setItem("cassino.prefs", "{not json");
  assert.deepEqual(loadPrefs(store), DEFAULTS);
  store.setItem("cassino.prefs", JSON.stringify({ skill: "very", speed: -3, rules: { game: "poker" } }));
  const p = loadPrefs(store);
  assert.equal(p.skill, DEFAULTS.skill);
  assert.equal(p.speed, DEFAULTS.speed);
  assert.equal(p.rules.game, "classic");
  assert.equal(p.rules.aces14, false, "aces 1 or 14 only with Royal");
});

test("the skill dial runs from 1 to 4 in halves", () => {
  assert.deepEqual(SKILLS.map((s) => s.value), [1, 1.5, 2, 2.5, 3, 3.5, 4]);
  assert.ok(SKILLS.every((s) => s.words.length > 0));
});

test("the URL overrides what is kept, for tests and shared links", () => {
  const url = new URLSearchParams("game=royal&aces14&nosweeps&skill=1.5&speed=6");
  const p = withUrl(DEFAULTS, url);
  assert.equal(withUrl(DEFAULTS, new URLSearchParams("tutorial=0")).tutorial, false);
  assert.deepEqual(p.rules, { game: "royal", aces14: true, sweeps: false });
  assert.equal(p.skill, 1.5);
  assert.equal(p.speed, 6);
  assert.deepEqual(withUrl(DEFAULTS, new URLSearchParams("")), DEFAULTS);
});

test("a sitting is kept as its saved text", () => {
  const store = memory();
  assert.equal(loadSitting(store), null);
  saveSitting(store, "cassino record v1\nseed 3");
  assert.equal(loadSitting(store), "cassino record v1\nseed 3");
  saveSitting(store, null);
  assert.equal(loadSitting(store), null);
});

test("the daily deal: the same seed all day, everywhere, a new one tomorrow", () => {
  const a = dailySeed(new Date(2026, 9, 3, 8, 0));
  const b = dailySeed(new Date(2026, 9, 3, 23, 59));
  const c = dailySeed(new Date(2026, 9, 4, 0, 1));
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(Number.isInteger(a) && a > 0 && a < 2 ** 31);
});

import { loadSeries, saveSeries } from "../src/prefs.js";

test("the series is kept, checked, and survives storage that fails", () => {
  const store = memory();
  assert.deepEqual(loadSeries(store), { format: "single", you: 0, them: 0, counted: [] });
  saveSeries(store, { format: "best-of-7", you: 2, them: 1, counted: [5, 6, 7] });
  assert.deepEqual(loadSeries(store), { format: "best-of-7", you: 2, them: 1, counted: [5, 6, 7] });
  store.setItem("cassino.series", JSON.stringify({ format: "best-of-99", you: "x" }));
  assert.equal(loadSeries(store).format, "single");
  assert.equal(loadSeries(broken).format, "single");
  saveSeries(broken, { format: "best-of-7", you: 0, them: 0, counted: [] });
  assert.equal(loadPrefs(store).match, "single");
});
