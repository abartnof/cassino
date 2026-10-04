// What the table says: the events as phrases, each with its speaker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { chunk, countPace, followBuilds, heard, speech } from "../src/talk.js";
import { GAP, TURN, createDialogue, saying } from "../src/dialogue.js";
import { loadEngine } from "../src/engine.js";

const WORDS = JSON.parse(readFileSync(new URL("../words.json", import.meta.url)));
const card = (code, rank) => ({ card: code, rank });
const state = (events, rules = { game: "classic", aces14: false, sweeps: true }) => ({ events, rules });
const said = (lines) => lines.map((l) => `${l.who}:${l.phrase}`);
// The lines of some phrases only: a list of them, or a test.
const only = (lines, which) => said(lines.filter((l) => (typeof which === "function" ? which(l.phrase) : which.includes(l.phrase))));

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
// group and none too long for a balloon. A line play-testing gave word for
// word, said at most once a game, is said only its own way.
const VERBATIM = new Set(["quite-normal"]);
const FREQUENT = /^(build|builds|raise|left|count-sweeps)-\d+$|^count-|^take-|^(sweep|cash|clinch-cards|clinch-spades|residue|last|low-deals|my-deal|your-deal|left-more)$/;

test("everything is said in several ways, the frequent moments in many", () => {
  const few = [];
  for (const [group, keys] of Object.entries(WORDS.groups)) {
    const texts = keys.map((k) => WORDS.texts[k]);
    assert.equal(new Set(texts).size, texts.length, `${group} says something twice`);
    if (!VERBATIM.has(group) && texts.length < (FREQUENT.test(group) ? 5 : 3)) few.push(`${group}: ${texts.length}`);
    for (const text of texts) assert.ok(text.length <= 44, `too long for a balloon: "${text}"`);
    // The count is written a line a second (choreography's countLine), and
    // its chant keeps up only if its lines are short: none longer than "The
    // ace of diamonds.", the longest it had.
    if (group.startsWith("count-")) for (const text of texts) assert.ok(text.length <= 20, `too long for the chant: "${text}"`);
  }
  assert.deepEqual(few, []);
});

// Whose deal it is, said as the cut cards are seen (play-testing: "Your
// deal." came after your opponent had already played); the house rules
// agreed as the deal begins.
test("the cut decides the deal, said as it is seen; then the house rules, as the cards are dealt", () => {
  const events = [{ kind: "cut", hand: 1 }, { kind: "first_dealer", hand: 1, you: true }, { kind: "dealt", hand: 1, deal: 1, last: false, you_deal: true }];
  const lines = speech(state(events));
  assert.deepEqual(said(lines), ["them:low-deals", "them:your-deal", "them:sweeps-ask", "you:sweeps-yes"]);
  assert.deepEqual(lines.map((l) => l.at), [1, 1, 2, 2], "with the cut cards seen, and as the deal begins");
  const royal = speech(state(events, { game: "royal", aces14: true, sweeps: false }));
  assert.deepEqual(said(royal), ["them:low-deals", "them:your-deal", "them:sweeps-ask", "you:sweeps-no", "them:royal", "them:aces-14"]);
});

// Equal ranks cut again (docs/RULES.md §2): the engine tells each cut, and
// the house rules are agreed once, before the first.
test("a tied cut is cut again, and the house rules are not asked twice", () => {
  const cut = (yours, theirs) => ({ kind: "cut", hand: 1, yours: card(yours, Number(yours[0])), theirs: card(theirs, Number(theirs[0])) });
  const deal = { kind: "dealt", hand: 1, deal: 1, last: false, you_deal: true };
  const lines = speech(state([cut("5H", "5C"), cut("3D", "9S"), { kind: "first_dealer", hand: 1, you: true }, deal, { ...deal, deal: 2 }]));
  assert.deepEqual(said(lines.filter((l) => l.phrase !== "deal-more")), ["them:cut-again", "them:low-deals", "them:your-deal", "them:sweeps-ask", "you:sweeps-yes"]);
  assert.equal(lines[0].at, 0, "said as the equal cards are seen");
});

test("builds are called: single in the singular, multiple in the plural, a raise by its new total", () => {
  const build = (extra) => ({ kind: "played", hand: 1, type: "build", value: 8, left: [], ...extra });
  const lines = heard(
    speech(
      state([
        build({ you: true, build_kind: "new", multiple: false }),
        build({ you: false, build_kind: "add", multiple: true }),
        build({ you: true, build_kind: "raise", value: 10, raised_from: 8, multiple: false }),
        build({ you: false, build_kind: "new", multiple: true, value: 5 }),
      ]),
    ),
    "calls",
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
  assert.deepEqual(only(lines, ["last", "sweep", "cash", "clinch-spades", "residue"]), ["them:last", "you:sweep", "them:cash", "them:clinch-spades", "you:residue"]);
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
  const remarks = lines.filter((l) => /^take-(big|little|many)/.test(l.phrase));
  assert.deepEqual(said(remarks), ["you:take-big-casino", "them:take-little-casino", "you:take-many", "you:take-many"]);
  assert.deepEqual(remarks.map((l) => l.at), [0, 1, 2, 4]);
  // Three cards taken is no haul.
  assert.deepEqual(only(speech(state([take(true, "9H", ["2C", "3C", "4C"])])), ["take-many"]), []);
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
  // What each capture's maker says: the sweep, the cash, nothing more.
  const makers = lines.filter((l) => l.who === (l.at < 2 || l.at > 3 ? "you" : "them"));
  assert.deepEqual(said(makers), ["you:sweep", "them:cash", "you:take-big-casino", "you:clinch-spades"]);
});

test("your opponent points out what you left: always a point card, otherwise now and then", () => {
  const trail = (at, left) => ({ kind: "played", hand: 1, you: true, type: "trail", left });
  const events = [trail(0, [card("AH", 1)]), trail(1, [card("5C", 5)]), trail(2, [card("5C", 5)]), trail(3, [card("3D", 3), card("4D", 4)])];
  const lines = only(speech(state(events)), (p) => p.startsWith("left-"));
  assert.ok(lines.includes("them:left-1"), "an ace left is always pointed out");
  assert.equal(lines.filter((l) => l === "them:left-5").length, 1, "a plain card now and then");
  // Your opponent's misses are theirs to notice.
  assert.deepEqual(only(speech(state([{ ...trail(0, [card("AH", 1)]), you: false }])), (p) => p.startsWith("left-")), []);
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
  assert.deepEqual(said(lines), ["you:count-cards", "them:count-big-casino", "you:count-ace-D", "them:count-sweeps-2", "them:game-won", "you:good-game", "them:rematch", "you:rematch-reply", "them:quite-normal"]);
  assert.deepEqual(lines.slice(0, 4).map((l) => l.line), [0, 1, 2, 3]);
});

// The game lost (play-testing): your opponent, revealed a court card, "says
// 'You are quite normal.'" -- its last word, heard whenever the calls are.
test("losing, your opponent's last word is that you are quite normal", () => {
  const lines = speech(state([{ kind: "game_ends", hand: 1, you_won: false }]));
  assert.equal(said(lines).at(-1), "them:quite-normal");
  assert.deepEqual(said(heard(lines, "calls")), ["them:game-won", "them:quite-normal"]);
  assert.deepEqual(heard(lines, "none"), []);
  assert.deepEqual(WORDS.groups["quite-normal"].map((k) => WORDS.texts[k]), ["You are quite normal."]);
  assert.ok(!said(speech(state([{ kind: "game_ends", hand: 1, you_won: true }]))).includes("them:quite-normal"), "not when you win");
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

// Whose build a capture takes, or a raise changes, is a thing to talk
// about: the talk follows the builds through the events, each its cards and
// its controller, and agrees with the engine's table at every step.
test("the builds followed through the events agree with the engine's table", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  let raised = 0;
  let stolen = 0;
  for (const [seed, game, aces14] of [[1, "classic", false], [2, "royal", true], [5, "classic", false], [8, "royal", false]]) {
    let s = engine.watch({ game, aces14, sweeps: true, skills: [4, 4], seed });
    const follow = followBuilds();
    let seen = 0;
    while (s.prompt !== "over") {
      for (; seen < s.events.length; seen++) {
        const did = follow.see(s.events[seen]);
        if (did.raised && did.raised.who !== (s.events[seen].you ? "you" : "them")) raised++;
        if (did.took?.some((b) => b.who !== (s.events[seen].you ? "you" : "them"))) stolen++;
      }
      const ours = follow.builds().map((b) => `${[...b.cards].sort().join(" ")}:${b.who}:${b.value}`).sort();
      const theirs = s.table.filter((i) => i.build).map((i) => `${i.cards.map((c) => c.card).sort().join(" ")}:${i.build.controller}:${i.build.value}`).sort();
      assert.deepEqual(ours, theirs, `seed ${seed}, after event ${seen}`);
      s = engine.step().state;
    }
  }
  assert.ok(raised > 0 && stolen > 0, `the games raised (${raised}) and took (${stolen}) another's build`);
});

test("the count's pace, from what is said: the words before the chant, and each line's length", () => {
  const plan = createDialogue({ groups: {}, texts: {} }, () => 0).plan;
  const lines = [
    { who: "you", phrase: "residue", at: 4, words: "And the rest are mine." },
    { who: "them", phrase: "count-cards-tie", at: 5, words: "The cards are a tie." },
    { who: "you", phrase: "count-spades", at: 5, line: 0, words: "Spades." },
    { who: "them", phrase: "count-ace-S", at: 5, line: 1, words: "The ace of spades." },
    { who: "them", phrase: "count-big-casino", at: 5, line: 2, words: "Big Casino." },
  ];
  const pace = countPace(lines, plan);
  assert.equal(pace.lead, saying("The cards are a tie.") + TURN, "the tie said before the first line");
  assert.deepEqual(pace.gaps, [saying("Spades.") + TURN, saying("The ace of spades.") + GAP, saying("Big Casino.")]);
  assert.equal(countPace(lines.slice(0, 1), plan), null, "no count, no pace");
  assert.equal(countPace(lines.filter((l) => l.phrase !== "count-cards-tie"), plan).lead, 0);
});

test("lines one speaker says at one moment are said as one, so nobody waits through them one by one", () => {
  const lines = [
    { who: "them", phrase: "sweeps-ask", at: 0, delay: 0, words: "Do you count sweeps?" },
    { who: "you", phrase: "sweeps-no", at: 0, delay: 0, words: "No sweeps." },
    { who: "them", phrase: "royal", at: 0, delay: 0, words: "Royal, then." },
    { who: "them", phrase: "low-deals", at: 0, delay: 0, words: "Low deals." },
    { who: "them", phrase: "my-deal", at: 1, delay: 0, words: "My deal." },
    { who: "them", phrase: "last", at: 2, delay: 900, words: "Last." },
    { who: "you", phrase: "count-spades", at: 5, delay: 2000, line: 0, words: "Spades." },
    { who: "you", phrase: "count-ace-S", at: 5, delay: 3000, line: 1, words: "Ace of spades." },
  ];
  const said = chunk(lines);
  assert.deepEqual(said.map((l) => l.words), ["Do you count sweeps?", "No sweeps.", "Royal, then. Low deals. My deal.", "Last.", "Spades.", "Ace of spades."]);
  assert.equal(said[2].phrase, "royal", "a chunk keeps its first line's phrase and moment");
  assert.equal(said[4].line, 0, "the count's lines keep their own moments");
});

test("the talk at three levels: none, the calls that carry the game, or everything", () => {
  const lines = ["sweeps-ask", "build-8", "last", "sweep", "cash", "count-spades", "game-won"].map((phrase) => ({ who: "them", phrase }));
  const chatter = ["left-7", "take-many", "take-big-casino", "clinch-cards", "residue", "good-game", "trail"].map((phrase) => ({ who: "them", phrase, chatter: true }));
  assert.deepEqual(heard([...lines, ...chatter], "none"), []);
  assert.deepEqual(heard([...lines, ...chatter], "all"), [...lines, ...chatter]);
  assert.deepEqual(heard([...lines, ...chatter], "calls"), lines);
});

// ---- the chatter (play-testing: the talk "VERY verbose", the conversation
// a part of the game, as it is where Cuarenta is played: "hay que ponerse
// charlatán", research/05). Every remark is chatter: heard only at the
// "all" level, and said only where it has room (dialogue.js).

const chat = (lines) => lines.filter((l) => l.chatter).map((l) => `${l.who}:${l.phrase}`);
const calls = (lines) => said(lines.filter((l) => !l.chatter));
const c = (code) => ({ card: code, rank: "A23456789TJQK".indexOf(code[0]) + 1, suit: code[1] });
const play = (you, type, played, extra = {}) => ({ kind: "played", hand: 1, you, type, card: c(played), taken: [], loose: [], left: [], groups: [], ...extra });

// What comes every move or two is said in many ways, or the chatter
// repeats itself: eight at least.
test("the chatter of every move is said in many ways", () => {
  for (const group of ["trail", "take-pair", "take-sum", "build-reply", "think", "deal-more"]) {
    assert.ok(WORDS.groups[group].length >= 8, `${group}: ${WORDS.groups[group].length} ways`);
  }
});

test("every move says something: a trail, a pair, a sum, each in its own words", () => {
  const lines = speech(
    state([
      play(true, "trail", "7H"),
      play(false, "take", "9C", { value: 9, taken: [c("9D")], groups: [[c("9D")]] }),
      play(true, "take", "8S", { value: 8, taken: [c("3H"), c("5C")], groups: [[c("3H"), c("5C")]] }),
      play(false, "trail", "8H"),
    ]),
  );
  const moves = lines.filter((l) => !l.phrase.startsWith("think"));
  assert.deepEqual(chat(moves), ["you:trail", "them:take-pair", "you:take-sum", "them:trail"]);
  assert.equal(moves[0].vars.acard, "a seven");
  assert.equal(moves[1].vars.cards, "nines");
  assert.equal(moves[2].vars.value, "eight");
  assert.equal(moves[3].vars.acard, "an eight");
  assert.deepEqual(chat(speech(state([play(true, "trail", "AH")]))), ["you:trail-ace"]);
  // Big and Little Casino trailed are named: a point, if it is taken.
  assert.deepEqual(chat(speech(state([play(true, "trail", "2S"), play(false, "trail", "TD")]))), ["you:trail-little-casino", "them:trail-big-casino"]);
});

test("a build is answered with what it tells of the builder's hand", () => {
  const lines = speech(state([play(true, "build", "3H", { value: 8, build_kind: "new", multiple: false, loose: [c("5C")] })]));
  assert.deepEqual(said(lines), ["you:build-8", "them:build-reply"]);
  assert.deepEqual(lines[1].vars, { value: "eight", taker: "eight", ataker: "an eight" });
  const royal = speech(state([play(false, "build", "3H", { value: 13, build_kind: "new", multiple: false, loose: [c("TC")] })]));
  assert.equal(royal[1].vars.taker, "king");
});

test("a build taken by the other player, or raised from under its builder, is felt by both", () => {
  const built = play(false, "build", "3H", { value: 8, build_kind: "new", multiple: false, loose: [c("5C")] });
  const stolen = speech(state([built, play(true, "take", "8D", { value: 8, taken: [c("3H"), c("5C")], groups: [[c("3H"), c("5C")]] })]), 1);
  assert.deepEqual(said(stolen), ["you:take-theirs", "them:lost-build"]);
  assert.equal(stolen[0].vars.value, "eight");
  const own = speech(state([built, play(false, "take", "8D", { value: 8, taken: [c("3H"), c("5C")], groups: [[c("3H"), c("5C")]] })]), 1);
  assert.deepEqual(said(own), ["them:take-own"]);
  const raised = speech(state([built, play(true, "build", "2C", { value: 10, build_kind: "raise", raised_from: 8, multiple: false, onto: c("3H") })]), 1);
  assert.deepEqual(said(raised), ["you:raise-10", "them:raised-mine"]);
  assert.deepEqual(raised[1].vars, { old: "eight", value: "ten" });
  // Your own build raised by you is nobody's loss.
  const mine = play(true, "build", "3H", { value: 8, build_kind: "new", multiple: false, loose: [c("5C")] });
  assert.deepEqual(said(speech(state([mine, play(true, "build", "2C", { value: 10, build_kind: "raise", raised_from: 8, multiple: false, onto: c("3H") })]), 1)), ["you:raise-10", "them:build-reply"]);
});

test("a sweep, a Casino or an ace taken is felt by the other player", () => {
  const lines = speech(
    state([
      play(true, "take", "TC", { value: 10, taken: [c("4H"), c("6H")], groups: [[c("4H"), c("6H")]] }),
      { kind: "swept", hand: 1, you: true },
      play(false, "take", "TS", { value: 10, taken: [c("TD")], groups: [[c("TD")]] }),
      play(true, "take", "5S", { value: 5, taken: [c("AH"), c("4C")], groups: [[c("AH"), c("4C")]] }),
      play(false, "take", "AS", { value: 1, taken: [c("AC")], groups: [[c("AC")]] }),
      { kind: "cash", hand: 1, you: false },
    ]),
  );
  assert.deepEqual(said(lines), ["you:sweep", "them:sweep-reply", "them:take-big-casino", "you:big-casino-gone", "you:take-sum", "them:ace-gone", "them:cash"]);
  // A haul is four table cards or more, as its maker's remark counts them.
  const haul = (n) => play(true, "take", "KC", { value: 13, taken: ["2C", "3C", "4C", "4D", "5D"].slice(0, n).map(c), groups: [] });
  assert.deepEqual(only(speech(state([haul(3)])), ["haul-reply"]), []);
  assert.deepEqual(only(speech(state([haul(4)])), ["haul-reply"]), ["them:haul-reply"]);
});

test("the dealer announces a new hand and more cards, and 'Last.' is answered", () => {
  const lines = speech(
    state([
      { kind: "dealt", hand: 2, deal: 1, last: false, you_deal: true },
      { kind: "dealt", hand: 2, deal: 3, last: false, you_deal: true },
      { kind: "dealt", hand: 2, deal: 6, last: true, you_deal: true },
    ]),
  );
  assert.deepEqual(said(lines), ["you:new-hand", "you:deal-more", "you:last", "them:last-reply"]);
  assert.deepEqual(only(speech(state([{ kind: "dealt", hand: 1, deal: 1, last: false, you_deal: false }])), ["new-hand"]), [], "the first hand's deal brings the house rules instead");
});

test("the score said aloud after each hand, and answered; the game's end in sight", () => {
  const ends = (you, them) => ({ kind: "hand_ends", hand: 1, yours: 0, theirs: 0, totals: { you, them } });
  const ahead = speech(state([ends(7, 4)]));
  assert.deepEqual(said(ahead), ["them:score-yours", "you:score-reply-ahead"]);
  assert.deepEqual(ahead[0].vars, { mine: "four", yours: "seven" });
  assert.deepEqual(said(speech(state([ends(5, 9)]))), ["them:score-mine", "you:score-reply-behind"]);
  const tied = speech(state([ends(6, 6)]));
  assert.deepEqual(said(tied), ["them:score-tie", "you:score-reply-tie"]);
  assert.equal(tied[0].vars.n, "six");
  const close = speech(state([ends(12, 18)]));
  assert.deepEqual(said(close), ["them:score-mine", "you:score-reply-behind", "them:need"]);
  assert.equal(close[2].vars.need, "three");
  assert.deepEqual(said(speech(state([ends(19, 12)]))).at(-1), "you:need");
  // The game over, the winner claims it instead.
  assert.deepEqual(said(speech(state([ends(22, 12), { kind: "game_ends", hand: 1, you_won: true }]))), ["you:game-won", "them:good-game", "you:rematch", "them:rematch-reply"]);
});

test("your opponent thinks aloud now and then, before a move, as yours is seen", () => {
  const events = [play(true, "trail", "7H"), play(false, "trail", "8H"), play(true, "trail", "2H"), play(false, "trail", "3D")];
  const lines = speech(state(events));
  const thinks = lines.filter((l) => l.phrase.startsWith("think"));
  assert.equal(thinks.length, 1, "now and then, not every move");
  assert.equal(thinks[0].who, "them");
  assert.equal(thinks[0].at, 2, "said as your move is seen, before theirs");
  assert.deepEqual(said(speech(state(events), 3)).filter((l) => l.includes("think")), [], "not about a move from before");
});

test("the remarks are chatter; the calls that carry the game are not", () => {
  const lines = speech(
    state([
      { kind: "cut", hand: 1 },
      { kind: "first_dealer", hand: 1, you: false },
      { kind: "dealt", hand: 1, deal: 1, last: false, you_deal: false },
      play(true, "build", "3H", { value: 8, build_kind: "new", multiple: false, loose: [c("5C")] }),
      play(false, "take", "8D", { value: 8, taken: [c("3H"), c("5C")], groups: [[c("3H"), c("5C")]] }),
      { kind: "dealt", hand: 1, deal: 6, last: true, you_deal: false },
    ]),
  );
  assert.deepEqual(calls(lines), ["them:low-deals", "them:my-deal", "them:sweeps-ask", "you:sweeps-yes", "you:build-8", "them:last"]);
  assert.deepEqual(heard(lines, "calls"), lines.filter((l) => !l.chatter));
});

test("lines merged into one are chatter only if all of them are", () => {
  const lines = [
    { who: "them", phrase: "deal-more", at: 0, delay: 0, words: "Four more each.", chatter: true },
    { who: "them", phrase: "last", at: 0, delay: 0, words: "Last." },
    { who: "you", phrase: "trail", at: 1, delay: 500, words: "Just a seven.", chatter: true },
    { who: "you", phrase: "trail", at: 1, delay: 500, words: "Or two.", chatter: true },
  ];
  assert.deepEqual(chunk(lines).map((l) => !!l.chatter), [false, true]);
});

test("over real games: every move says something, and every slot in the words is filled", { skip: !existsSync(WASM) && "build the module first" }, async () => {
  const engine = await loadEngine(readFileSync(WASM));
  for (const [seed, game, aces14] of [[3, "classic", false], [4, "royal", true]]) {
    let s = engine.watch({ game, aces14, sweeps: true, skills: [3, 4], seed });
    let since = 0;
    const quiet = [];
    while (s.prompt !== "over") {
      const lines = speech(s, since);
      for (const line of lines) {
        for (const key of WORDS.groups[line.phrase]) {
          for (const [, slot] of WORDS.texts[key].matchAll(/\{(\w+)\}/g)) {
            assert.ok(line.vars?.[slot.toLowerCase()] !== undefined, `${line.phrase}: no ${slot} for "${WORDS.texts[key]}"`);
          }
        }
      }
      // A move, or the sweep, cash or clinch it brings with it.
      s.events.forEach((e, at) => {
        if (at < since || e.kind !== "played") return;
        let end = at + 1;
        while (end < s.events.length && ["swept", "cash", "clinched"].includes(s.events[end].kind)) end++;
        if (!lines.some((l) => l.at >= at && l.at < end)) quiet.push(e.text);
      });
      since = s.events.length;
      s = engine.step().state;
    }
    assert.deepEqual(quiet, [], "a move with nothing said");
  }
});
