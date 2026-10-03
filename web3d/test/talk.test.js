// What the table says: the events as phrases, each with its speaker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { speech } from "../src/talk.js";
import { loadEngine } from "../src/engine.js";

const WORDS = JSON.parse(readFileSync(new URL("../words.json", import.meta.url)));
const card = (code, rank) => ({ card: code, rank });
const state = (events, rules = { game: "classic", aces14: false, sweeps: true }) => ({ events, rules });
const said = (lines) => lines.map((l) => `${l.who}:${l.phrase}`);

test("the phrase bank is up to date with its source", { skip: !existsSync("/usr/bin/python3") && "no python3" }, () => {
  const tool = new URL("../tools/phrases.py", import.meta.url).pathname;
  execFileSync("python3", [tool, "--check"]);
});

// Kind talk (play-testing: "Keep it kid-friendly"): nothing said at the
// table insults, belittles or sneers. Jack London's "That's a sissy game."
// was the case in point.
const UNKIND = [
  "sissy", "stupid", "dumb", "idiot", "fool", "foolish", "loser", "baby", "chicken", "coward", "sucker",
  "pathetic", "useless", "hopeless", "careless", "clumsy", "lousy", "rubbish", "shame", "hate", "shut up",
  "take that", "so there", "who's laughing", "shoot", "too slow", "blind", "weak",
];

test("nothing in the bank is unkind", () => {
  const unkind = new RegExp(`\\b(${UNKIND.join("|")})\\b`, "i");
  const said = Object.entries(WORDS.texts).filter(([, text]) => unkind.test(text));
  assert.deepEqual(said, []);
});

// Variety (play-testing: "a lot of written dialogue in the lit review you
// can choose from at any event"): everything is said at least three ways,
// and what comes up again and again (the build calls, the captures and
// clears, the count, the deal, "Last.") at least five, none twice in one
// group and none too long for a balloon.
const FREQUENT = /^(build|builds|raise|left|count-sweeps)-\d+$|^count-|^take-|^(sweep|cash|clinch-cards|clinch-spades|residue|last|low-deals|my-deal|your-deal|left-more)$/;

test("everything is said in several ways, the frequent moments in many", () => {
  const few = [];
  for (const [group, keys] of Object.entries(WORDS.groups)) {
    const texts = keys.map((k) => WORDS.texts[k]);
    assert.equal(new Set(texts).size, texts.length, `${group} says something twice`);
    if (texts.length < (FREQUENT.test(group) ? 5 : 3)) few.push(`${group}: ${texts.length}`);
    for (const text of texts) assert.ok(text.length <= 44, `too long for a balloon: "${text}"`);
    // The count is written a line a second (choreography's countLine), and
    // its chant keeps up only if its lines are short: none longer than "The
    // ace of diamonds.", the longest it had.
    if (group.startsWith("count-")) for (const text of texts) assert.ok(text.length <= 20, `too long for the chant: "${text}"`);
  }
  assert.deepEqual(few, []);
});

test("before the game, the house rules agreed aloud, then the cut", () => {
  const events = [{ kind: "cut", hand: 1 }, { kind: "first_dealer", hand: 1, you: true }];
  assert.deepEqual(said(speech(state(events))), ["them:sweeps-ask", "you:sweeps-yes", "them:low-deals", "them:your-deal"]);
  const royal = speech(state(events, { game: "royal", aces14: true, sweeps: false }));
  assert.deepEqual(said(royal), ["them:sweeps-ask", "you:sweeps-no", "them:royal", "them:aces-14", "them:low-deals", "them:your-deal"]);
});

test("builds are called: single in the singular, multiple in the plural, a raise by its new total", () => {
  const build = (extra) => ({ kind: "played", hand: 1, type: "build", value: 8, left: [], ...extra });
  const lines = speech(
    state([
      build({ you: true, build_kind: "new", multiple: false }),
      build({ you: false, build_kind: "add", multiple: true }),
      build({ you: true, build_kind: "raise", value: 10, raised_from: 8, multiple: false }),
      build({ you: false, build_kind: "new", multiple: true, value: 5 }),
    ]),
  );
  assert.deepEqual(said(lines), ["you:build-8", "them:builds-8", "you:raise-10", "them:builds-5"]);
  assert.deepEqual(lines.map((l) => l.at), [0, 1, 2, 3]);
});

test("the dealer says 'Last.'; a sweep, cash and the clinches are claimed by their maker", () => {
  const lines = speech(
    state([
      { kind: "dealt", hand: 1, deal: 5, last: false, you_deal: false },
      { kind: "dealt", hand: 1, deal: 6, last: true, you_deal: false },
      { kind: "played", hand: 1, you: true, type: "take", left: [] },
      { kind: "swept", hand: 1, you: true },
      { kind: "cash", hand: 1, you: false },
      { kind: "clinched", hand: 1, you: false, what: "spades" },
      { kind: "residue", hand: 1, you: true, cards: [] },
    ]),
  );
  assert.deepEqual(said(lines), ["them:last", "you:sweep", "them:cash", "them:clinch-spades", "you:residue"]);
});

// A capture says nothing as a rule; it speaks when it takes a casino card,
// or a haul of several cards at once (Long: "take up as many as you can
// with one Card").
const take = (you, played, taken) => ({ kind: "played", hand: 1, you, type: "take", card: card(played, 0), taken: taken.map((c) => card(c, 0)), left: [] });

test("a capture taking a casino card, or a haul of several, is remarked by its maker", () => {
  const lines = speech(
    state([
      take(true, "TC", ["TD"]),
      take(false, "2S", ["2H"]),
      take(true, "9H", ["2C", "3C", "4C", "4D", "5D"]),
      take(false, "5H", ["5C"]),
      take(true, "8H", ["2D", "6C", "3H", "5S"]),
    ]),
  );
  assert.deepEqual(said(lines), ["you:take-big-casino", "them:take-little-casino", "you:take-many", "you:take-many"]);
  assert.deepEqual(lines.map((l) => l.at), [0, 1, 2, 4]);
  // Three cards taken is no haul.
  assert.deepEqual(said(speech(state([take(true, "9H", ["2C", "3C", "4C"])]))), []);
});

test("a sweep or cash speaks for its capture, which says nothing more", () => {
  const lines = speech(
    state([
      take(true, "TC", ["TD", "4H", "6H", "3S", "7S"]),
      { kind: "swept", hand: 1, you: true },
      take(false, "AH", ["AC", "2S"]),
      { kind: "cash", hand: 1, you: false },
      take(true, "TS", ["TD"]),
      { kind: "clinched", hand: 1, you: true, what: "spades" },
    ]),
  );
  assert.deepEqual(said(lines), ["you:sweep", "them:cash", "you:take-big-casino", "you:clinch-spades"]);
});

test("your opponent points out what you left: always a point card, otherwise now and then", () => {
  const trail = (at, left) => ({ kind: "played", hand: 1, you: true, type: "trail", left });
  const events = [trail(0, [card("AH", 1)]), trail(1, [card("5C", 5)]), trail(2, [card("5C", 5)]), trail(3, [card("3D", 3), card("4D", 4)])];
  const lines = said(speech(state(events)));
  assert.ok(lines.includes("them:left-1"), "an ace left is always pointed out");
  assert.equal(lines.filter((l) => l === "them:left-5").length, 1, "a plain card now and then");
  // Your opponent's misses are theirs to notice.
  assert.deepEqual(said(speech(state([{ ...trail(0, [card("AH", 1)]), you: false }]))), []);
});

test("the count is chanted line by line by whoever wins each", () => {
  const scored = {
    kind: "scored",
    hand: 1,
    count: {
      lines: [
        { item: "cards", suit: null, who: "you", points: 3 },
        { item: "big_casino", suit: null, who: "them", points: 2 },
        { item: "ace", suit: "D", who: "you", points: 1 },
        { item: "sweeps", suit: null, who: "them", points: 2 },
      ],
    },
  };
  const lines = speech(state([scored, { kind: "game_ends", hand: 1, you_won: false }]));
  assert.deepEqual(said(lines), ["you:count-cards", "them:count-big-casino", "you:count-ace-D", "them:count-sweeps-2", "them:game-won", "you:good-game"]);
  assert.deepEqual(lines.slice(0, 4).map((l) => l.line), [0, 1, 2, 3]);
});

// Twenty-six cards each: nobody scores the cards, and your opponent says
// so before the chant ("The cards are a tie, Katy, so neither of us takes
// that point", Harper's Bazaar, 1883).
test("cards tied at the count are said before the chant", () => {
  const scored = (you, them, lines) => ({ kind: "scored", hand: 1, count: { lines, tallies: { you: { cards: you }, them: { cards: them } } } });
  const spades = { item: "spades", suit: null, who: "you", points: 1 };
  const tied = speech(state([scored(26, 26, [spades])]));
  assert.deepEqual(said(tied), ["them:count-cards-tie", "you:count-spades"]);
  assert.equal(tied[0].line, undefined, "said at the count's moment, not as a line of it");
  assert.equal(tied[1].line, 0);
  const cards = { item: "cards", suit: null, who: "them", points: 3 };
  assert.deepEqual(said(speech(state([scored(25, 27, [cards, spades])]))), ["them:count-cards", "you:count-spades"]);
});

test("only the events since the last state are said", () => {
  const events = [{ kind: "swept", hand: 1, you: true }, { kind: "cash", hand: 1, you: true }];
  assert.deepEqual(said(speech(state(events), 1)), ["you:cash"]);
});

const WASM = new URL("../../target/wasm32-unknown-unknown/release/cassino_wasm.wasm", import.meta.url);

test("over real games every phrase asked for is in the bank", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  const asked = new Set();
  for (const [seed, game, aces14] of [[1, "classic", false], [2, "royal", true]]) {
    let s = engine.watch({ game, aces14, sweeps: true, skills: [3, 4], seed });
    let since = 0;
    while (s.prompt !== "over") {
      for (const line of speech(s, since)) {
        assert.ok(WORDS.groups[line.phrase], `no words for ${line.phrase}`);
        assert.ok(line.at >= since && line.at < s.events.length);
        asked.add(line.phrase.replace(/-\w+$/, ""));
      }
      since = s.events.length;
      s = engine.step().state;
    }
  }
  for (const kind of ["build", "last", "take", "count"]) assert.ok([...asked].some((p) => p.startsWith(kind)), `nothing said for ${kind}`);
});
