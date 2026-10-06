// The person's settings, kept in the browser: defaults, storage that may
// fail, the URL's overrides, and the daily deal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULTS, SKILLS, badgesOn, chooseGame, dailySeed, gameSaid, loadPrefs, menuChoices, welcomeWanted, savePrefs, loadSitting, saveSitting, withUrl } from "../src/prefs.js";

function memory() {
  const items = new Map();
  return { getItem: (k) => (items.has(k) ? items.get(k) : null), setItem: (k, v) => items.set(k, String(v)), removeItem: (k) => items.delete(k) };
}
const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };

test("with nothing kept, the defaults; what is kept comes back", () => {
  const store = memory();
  assert.deepEqual(loadPrefs(store), DEFAULTS);
  savePrefs(store, { ...DEFAULTS, skill: 2.5, rules: { game: "royal", aces14: true, sweeps: false, raising: true } });
  const back = loadPrefs(store);
  assert.equal(back.skill, 2.5);
  assert.deepEqual(back.rules, { game: "royal", aces14: true, sweeps: false, raising: true });
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
  assert.equal(p.rules.game, DEFAULTS.rules.game);
  assert.equal(p.rules.aces14, DEFAULTS.rules.aces14, "aces 1 or 14 as the default has it");
});

test("the scoring board is gone: a setting kept for it is forgotten", () => {
  const store = memory();
  store.setItem("cassino.prefs", JSON.stringify({ pegboard: false }));
  assert.equal("pegboard" in loadPrefs(store), false);
  assert.equal("pegboard" in DEFAULTS, false);
});

// The seventh play-testing: "remove undo." The table takes no move back,
// and a switch kept for it is forgotten.
test("undo is gone: a setting kept for it is forgotten", () => {
  const store = memory();
  store.setItem("cassino.prefs", JSON.stringify({ undo: true }));
  assert.equal("undo" in loadPrefs(store), false);
  assert.equal("undo" in DEFAULTS, false);
});

// Play-testing: could raising "be turned off in the config"? On by default,
// as the rules have it; kept settings from before the setting raise.
test("builds are raised unless the setting is off, and the choice is kept", () => {
  assert.equal(DEFAULTS.rules.raising, true);
  const store = memory();
  savePrefs(store, { ...DEFAULTS, rules: { ...DEFAULTS.rules, raising: false } });
  assert.equal(loadPrefs(store).rules.raising, false);
  store.setItem("cassino.prefs", JSON.stringify({ rules: { game: "classic", aces14: false, sweeps: true }, v: 2 }));
  assert.equal(loadPrefs(store).rules.raising, true);
  assert.equal(withUrl(DEFAULTS, new URLSearchParams("noraise")).rules.raising, false);
});

test("sweeps are off by default; the old default kept before then is not a choice", () => {
  assert.equal(DEFAULTS.rules.sweeps, false);
  const store = memory();
  // Kept before the default changed: every setting was saved, defaults too.
  store.setItem("cassino.prefs", JSON.stringify({ rules: { game: "royal", aces14: false, sweeps: true }, skill: 2 }));
  assert.deepEqual(loadPrefs(store).rules, { game: "royal", aces14: true, sweeps: false, raising: true }, "the aces kept before then, the old default too");
  assert.equal(loadPrefs(store).skill, 2, "the rest kept as it was");
  // Chosen since: kept.
  savePrefs(store, { ...loadPrefs(store), rules: { game: "classic", aces14: false, sweeps: true } });
  assert.equal(loadPrefs(store).rules.sweeps, true);
  assert.equal(withUrl(DEFAULTS, new URLSearchParams("sweeps")).rules.sweeps, true);
});

test("build values: off by default, kept when chosen, and always on with the tutorial", () => {
  assert.equal(DEFAULTS.buildValues, false);
  assert.equal(badgesOn({ ...DEFAULTS, tutorial: false }), false);
  assert.equal(badgesOn({ ...DEFAULTS, tutorial: true }), true);
  assert.equal(badgesOn({ ...DEFAULTS, tutorial: false, buildValues: true }), true);
  const store = memory();
  savePrefs(store, { ...DEFAULTS, buildValues: true });
  assert.equal(loadPrefs(store).buildValues, true);
});

// Play-testing: "the card tracker hud should be collapsed by default".
test("the trackers' panel starts folded, and stays as it was left", () => {
  assert.equal(DEFAULTS.trackersOpen, false);
  const store = memory();
  savePrefs(store, { ...DEFAULTS, trackersOpen: true });
  assert.equal(loadPrefs(store).trackersOpen, true);
  // Settings kept before it folded by default hold the old default, open,
  // which is not taken for a choice.
  store.setItem("cassino.prefs", JSON.stringify({ ...DEFAULTS, trackersOpen: true, v: 2 }));
  assert.equal(loadPrefs(store).trackersOpen, false);
});

// On opening, the new game's menu, which welcomes (with Continue for a
// game kept), unless the address asks for a game.
test("the new game's menu on opening, unless the address asks for a game", () => {
  assert.equal(welcomeWanted(new URLSearchParams("")), true);
  assert.equal(welcomeWanted(new URLSearchParams("skill=2")), true);
  assert.equal(welcomeWanted(new URLSearchParams("seed=7")), false, "a shared game's link goes straight to it");
  assert.equal(welcomeWanted(new URLSearchParams("watch")), false);
  assert.equal(welcomeWanted(new URLSearchParams("welcome=0")), false);
});

// The user: "I asked for one new game window and this is two ... Since
// the tutorial depends on the config of the new game, why don't you just
// put tutorial mode as an option within the new game config?" The tutorial
// is chosen with the rest of a new game: turned on there, from its first
// page; left on, its pages read already are not read again; off, none.
test("the tutorial, chosen in the new game's menu: turned on, from its first page", () => {
  const series = { format: "single", you: 0, them: 0, counted: [] };
  const game = { rules: DEFAULTS.rules, skill: 3, match: "single" };
  const off = { ...DEFAULTS, tutorial: false, seen: ["intro", "pairing"] };
  const on = { ...DEFAULTS, tutorial: true, seen: ["intro", "pairing"] };
  assert.equal(menuChoices(off, null).tutorial, false);
  assert.equal(menuChoices(on, null).tutorial, true);
  assert.deepEqual(chooseGame(off, series, { ...game, tutorial: true }).patch.seen, []);
  assert.equal(chooseGame(off, series, { ...game, tutorial: true }).patch.tutorial, true);
  assert.equal("seen" in chooseGame(on, series, { ...game, tutorial: true }).patch, false, "left on: what was read stays read");
  assert.equal(chooseGame(on, series, { ...game, tutorial: false }).patch.tutorial, false);
});

// The user: "please turn off tutorial by default". Off unless turned on in
// the new game's menu; kept on under the old default (before version 6) it
// is not taken for a choice.
test("the tutorial off by default, and the old default kept is not a choice", () => {
  assert.equal(DEFAULTS.tutorial, false);
  const store = memory();
  store.setItem("cassino.prefs", JSON.stringify({ ...DEFAULTS, tutorial: true, v: 5 }));
  assert.equal(loadPrefs(store).tutorial, false, "the old default is not a choice");
  savePrefs(store, { ...DEFAULTS, tutorial: true });
  assert.equal(loadPrefs(store).tutorial, true, "chosen since, it is kept");
});

test("the table talk: everything by default, or the calls, or none", () => {
  assert.equal(DEFAULTS.talk, "all");
  const store = memory();
  savePrefs(store, { ...DEFAULTS, talk: "calls" });
  assert.equal(loadPrefs(store).talk, "calls");
  store.setItem("cassino.prefs", JSON.stringify({ talk: "shouting" }));
  assert.equal(loadPrefs(store).talk, "all");
});

test("the skill dial runs from 1 to 4 in halves", () => {
  assert.deepEqual(SKILLS.map((s) => s.value), [1, 1.5, 2, 2.5, 3, 3.5, 4]);
  assert.ok(SKILLS.every((s) => s.words.length > 0));
});

test("the URL overrides what is kept, for tests and shared links", () => {
  const url = new URLSearchParams("game=royal&aces14&nosweeps&skill=1.5&speed=6");
  const p = withUrl(DEFAULTS, url);
  assert.equal(withUrl(DEFAULTS, new URLSearchParams("tutorial=0")).tutorial, false);
  assert.equal(withUrl(DEFAULTS, new URLSearchParams("values")).buildValues, true);
  assert.deepEqual(p.rules, { game: "royal", aces14: true, sweeps: false, raising: true });
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

// The seventh play-testing: "it's confusing that you can set royal casino
// to be on, but it isn't happening- that's because it needs a new game to
// apply. solve this problem by removing game level settings from the
// config, and putting them into a new game menu." The menu's choices take
// effect as the game they start begins, and are kept for the next.
test("a new game's choices: kept as they start it, aces 1 or 14 only with Royal, a new match begun afresh", () => {
  const series = { format: "best-of-7", you: 2, them: 1, counted: [5, 6, 7] };
  const prefs = { ...DEFAULTS, match: "best-of-7" };
  const royal = chooseGame(prefs, series, { rules: { game: "royal", aces14: true, sweeps: true, raising: false }, skill: 2.5, match: "best-of-7" });
  assert.deepEqual(royal.patch, { rules: { game: "royal", aces14: true, sweeps: true, raising: false }, skill: 2.5, match: "best-of-7" });
  assert.equal(royal.series, series, "the same match: the series goes on");
  const classic = chooseGame(prefs, series, { rules: { game: "classic", aces14: true, sweeps: false, raising: true }, skill: 3, match: "single" });
  assert.equal(classic.patch.rules.aces14, false, "aces 1 or 14 is Royal's");
  assert.deepEqual(classic.series, { format: "single", you: 0, them: 0, counted: [] }, "another match: begun afresh");
});

test("the game under way, said in words, for the settings", () => {
  assert.equal(gameSaid({ game: "classic", aces14: false, sweeps: false, raising: true }, 3), "Cassino, no sweeps, builds raised; your opponent at 3");
  assert.equal(gameSaid({ game: "royal", aces14: true, sweeps: true, raising: false }, 1.5), "Royal Cassino, aces 1 or 14, sweeps scored, no raising; your opponent at 1.5");
});

// The user: "if the user has previously played a game, please make the new
// game settings, consistent with their previous game settings ... Do not
// add any sort of user tracking." The menu starts from the game on the
// table, played or finished (its rules and skill, from the engine's own
// state); with none, or a watched one, from the settings kept already.
test("the new game's menu starts from the game played last", () => {
  const prefs = { ...DEFAULTS, match: "best-of-7" };
  const royal = { rules: { game: "royal", aces14: true, sweeps: true, raising: false }, skill: 2, watching: false };
  const tutorial = DEFAULTS.tutorial;
  assert.deepEqual(menuChoices(prefs, royal), { rules: royal.rules, skill: 2, match: "best-of-7", tutorial });
  assert.deepEqual(menuChoices(prefs, null), { rules: DEFAULTS.rules, skill: DEFAULTS.skill, match: "best-of-7", tutorial });
  assert.deepEqual(menuChoices(prefs, { ...royal, watching: true }), { rules: DEFAULTS.rules, skill: DEFAULTS.skill, match: "best-of-7", tutorial });
});

// The user: "I want Royal Casino on the left and to be the default.
// Casino is the variant and on the right." A game kept under the old
// default, plain Cassino (before version 4), is not taken for a choice.
test("Royal Cassino is the default game, and plain Cassino kept as the old default is not a choice", () => {
  assert.equal(DEFAULTS.rules.game, "royal");
  const store = memory();
  store.setItem("cassino.prefs", JSON.stringify({ rules: { game: "classic", aces14: false, sweeps: false, raising: true }, v: 3 }));
  assert.equal(loadPrefs(store).rules.game, "royal");
  savePrefs(store, { ...DEFAULTS, rules: { ...DEFAULTS.rules, game: "classic" } });
  assert.equal(loadPrefs(store).rules.game, "classic", "chosen since, it is kept");
});

// The user: the table sorted, "A option (which default to on)".
test("the table sorted: on by default, and kept when turned off", () => {
  assert.equal(DEFAULTS.sortTable, true);
  const store = memory();
  savePrefs(store, { ...DEFAULTS, sortTable: false });
  assert.equal(loadPrefs(store).sortTable, false);
});

// The user: the move bar "turn[ed] ... to the other direction for
// left-handed players, but it should default to the way that I'm
// describing".
test("left-handed: off by default, and kept when on", () => {
  assert.equal(DEFAULTS.leftHanded, false);
  const store = memory();
  savePrefs(store, { ...DEFAULTS, leftHanded: true });
  assert.equal(loadPrefs(store).leftHanded, true);
});

// The user: "Aces being high or low should be selected by default." Royal's
// aces count 1 or 14 unless chosen otherwise; kept under the old default
// (before version 5) it is not taken for a choice. Plain Cassino has no
// such aces, whatever the address or the settings kept say.
test("aces 1 or 14 on by default, with Royal; never with plain Cassino", () => {
  assert.equal(DEFAULTS.rules.aces14, true);
  const store = memory();
  store.setItem("cassino.prefs", JSON.stringify({ rules: { game: "royal", aces14: false, sweeps: false, raising: true }, v: 4 }));
  assert.equal(loadPrefs(store).rules.aces14, true, "the old default is not a choice");
  savePrefs(store, { ...DEFAULTS, rules: { ...DEFAULTS.rules, aces14: false } });
  assert.equal(loadPrefs(store).rules.aces14, false, "chosen since, it is kept");
  assert.equal(withUrl(DEFAULTS, new URLSearchParams("game=classic")).rules.aces14, false);
  assert.equal(chooseGame(DEFAULTS, { format: "single" }, { rules: { game: "classic", aces14: true }, skill: 3, match: "single" }).patch.rules.aces14, false);
});
