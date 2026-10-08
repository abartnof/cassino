// The tutorial: its pages, and each one's moment in a real game.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PAGE_KEYS, moveKinds, pageDue, parseTutorial } from "../src/tutorial.js";
import { loadEngine } from "../src/engine.js";

const TEXT = readFileSync(new URL("../tutorial.md", import.meta.url), "utf8");

test("the pages parse, one for each key, each with words", () => {
  const pages = parseTutorial(TEXT);
  assert.deepEqual(pages.map((p) => p.key), PAGE_KEYS);
  for (const p of pages) {
    assert.ok(p.title.length > 0 && p.blocks.length > 0, p.key);
  }
  const bold = pages[0].blocks.flatMap((b) => b.spans ?? b.items.flat()).filter((s) => s.bold);
  assert.ok(bold.length > 0, "bold survives the parse");
});

// Written for new players (the fourth play-testing: every term explained,
// concise, readable): none of the game's jargon a new player would not
// know, no history that does not help them play, and the interface as it
// is (the move bar's Take, Build and Trail, not the old chips).
const JARGON = ["fishing", "court card", "capture", "controller", "control", "guard", "single build", "chip", "old books", "1867", "colour"];

test("the tutorial is plain: no jargon a new player would not know", () => {
  const words = parseTutorial(TEXT).flatMap((p) => [p.title, ...p.blocks.flatMap((b) => (b.spans ? [b.spans] : b.items)).map((spans) => spans.map((x) => x.text).join(""))]);
  const found = JARGON.filter((term) => words.some((w) => new RegExp(`\\b${term}`, "i").test(w)));
  assert.deepEqual(found, []);
  const intro = parseTutorial(TEXT)[0].blocks.flatMap((b) => b.spans ?? b.items.flat()).filter((x) => x.bold).map((x) => x.text);
  for (const button of ["Take", "Build", "Trail"]) assert.ok(intro.some((t) => t.includes(button)), `the intro names the ${button} button`);
  assert.ok(intro.includes("hand"), "the intro says what a hand is: six deals, scored at the end");
});

const item = (id, cards, build = null) => ({ id, cards: cards.map((c) => ({ card: c })), build });
const classic = { game: "classic", aces14: false, sweeps: true };

test("the kinds of the moves on offer, from their words and the table", () => {
  const table = [item(1, ["8H"]), item(2, ["5C"]), item(3, ["3D"]), item(4, ["2S", "4D"], { value: 6, multiple: false }), item(5, ["6C"])];
  const state = (moves, rules = classic) => ({ rules, table, moves });
  assert.deepEqual([...moveKinds(state(["take 8S 8H"]))], ["pair"]);
  assert.deepEqual([...moveKinds(state(["take 8S 5C 3D"]))], ["sum"]);
  assert.deepEqual([...moveKinds(state(["take 6S 2S 4D"]))], [], "taking a build is neither");
  assert.deepEqual([...moveKinds(state(["build 9 4H 5C"]))], ["build"]);
  assert.deepEqual([...moveKinds(state(["build 9 3H on 2S"]))], ["raise"]);
  assert.deepEqual([...moveKinds(state(["build 6 6H on 2S"]))], ["multiple"], "adding to a build at its value");
  assert.deepEqual([...moveKinds(state(["build 8 8C 5C 3D"]))], ["multiple"], "a new build of two eights");
  assert.deepEqual([...moveKinds(state(["take AC=14 KS AH"], { game: "royal", aces14: true, sweeps: true }))], ["ace14"]);
});

test("a page is due at its first moment, once, and never while watching", () => {
  const table = [item(1, ["8H"]), item(2, ["5C"]), item(3, ["3D"])];
  const s = { rules: classic, prompt: "play", table, moves: ["take 8S 8H", "trail 2C"], events: [], watching: false };
  assert.equal(pageDue(s, []), "intro");
  assert.equal(pageDue(s, ["intro"]), "pairing");
  assert.equal(pageDue(s, ["intro", "pairing"]), null);
  assert.equal(pageDue({ ...s, watching: true }, []), null);
  // Royal's page comes first: it changes what every card is worth, the
  // ace's 1 or 14 with it (play-testing: one page, not two).
  const royal = { ...s, rules: { game: "royal", aces14: true, sweeps: true } };
  assert.equal(pageDue(royal, ["intro"]), "royal");
  assert.equal(pageDue(royal, ["intro", "royal"]), "pairing");
  // Your opponent's build teaches building, if you have not met it yet.
  const built = { ...s, moves: ["trail 2C"], events: [{ kind: "played", you: false, type: "build", build_kind: "new", multiple: false }] };
  assert.equal(pageDue(built, ["intro"], 0), "building");
  assert.equal(pageDue({ ...s, prompt: "next_hand", moves: [], events: [{ kind: "scored", hand: 1 }], hand_number: 1 }, ["intro"]), "count");
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("over real games every page of the ladder comes, Royal's only in Royal", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  const met = new Set();
  for (const [seed, game, aces14] of [[1, "classic", false], [2, "classic", false], [3, "royal", true], [4, "royal", false]]) {
    let s = engine.start({ game, aces14, sweeps: true, skill: 3, seed });
    const seen = [];
    let since = 0;
    for (let n = 0; s.prompt !== "over" && n < 400; n++) {
      let key;
      while ((key = pageDue(s, seen, since))) seen.push(key);
      since = s.events.length;
      s = engine.send(s.prompt === "play" ? s.moves[(n * 3) % s.moves.length] : "next").state;
    }
    if (game === "classic") assert.ok(!seen.includes("royal"));
    seen.forEach((k) => met.add(k));
  }
  for (const key of ["intro", "pairing", "summing", "building", "raising", "multiple", "royal", "count"]) assert.ok(met.has(key), `${key} never came`);
});

// Play-testing: "fold aces into the royals section, and kill the distinct
// aces section".
test("the ace's 1 or 14 is told on Royal's page, and has no page of its own", () => {
  assert.ok(!PAGE_KEYS.includes("aces14"));
  const royal = parseTutorial(TEXT).find((p) => p.key === "royal");
  const words = royal.blocks.flatMap((b) => (b.spans ? [b.spans] : b.items)).map((spans) => spans.map((x) => x.text).join("")).join(" ");
  assert.match(words, /1 or 14/);
  assert.match(words, /Take as 14/);
});

// Play-testing: raising "could it be turned off in the config, and noted as
// such in the tutorial?"
// The game's own settings moved to the new game's menu in the seventh
// play-testing: the page sends you there.
test("the page on raising says it can be turned off in the new game's menu", () => {
  const raising = parseTutorial(TEXT).find((p) => p.key === "raising");
  const words = raising.blocks.flatMap((b) => (b.spans ? [b.spans] : b.items)).map((spans) => spans.map((x) => x.text).join("")).join(" ");
  assert.match(words, /Raise builds/);
  assert.match(words, /new game's menu/);
  assert.doesNotMatch(words, /settings/, "not sent to the settings, where it no longer is");
});

// The user: "a new player is about to be dropped into a whole new world.
// for the next few seconds, what do they need to know? what's in front of
// them, and what are they expected to do? people don't want to read huge
// chunks of text. try to have categories of text (eg your goal, how to do
// it, what the opponent is doing, etc). try to make these one-liners, or
// bullet points." Every page in labelled sections, each line short; the
// first page says what is in front of you, what to do, how, and what your
// opponent is doing.
test("each page in labelled sections of short lines", () => {
  const text = (spans) => spans.map((x) => x.text).join("");
  const words = (s) => s.split(/\s+/).filter(Boolean).length;
  for (const page of parseTutorial(TEXT)) {
    const headings = page.blocks.filter((b) => b.type === "h").map((b) => text(b.spans));
    assert.ok(headings.length >= 2, `${page.key}: in sections (${headings})`);
    assert.equal(page.blocks[0].type, "h", `${page.key}: a section first, no preamble`);
    for (const b of page.blocks) {
      for (const line of b.spans ? [text(b.spans)] : b.items.map(text)) {
        assert.ok(words(line) <= 25, `${page.key}: ${words(line)} words: ${line}`);
      }
    }
  }
  const intro = parseTutorial(TEXT)[0].blocks.filter((b) => b.type === "h").map((b) => text(b.spans).toLowerCase());
  for (const part of ["goal", "in front of you", "your turn", "how", "opponent"]) {
    assert.ok(intro.some((h) => h.includes(part)), `the first page has a section for ${part}: ${intro}`);
  }
});

// Seen in the seventh play-testing's move bar: the running sum's place is
// gone, so no page may promise it.
test("no page promises a running sum beside the buttons", () => {
  assert.doesNotMatch(TEXT, /sum shows/i);
});
