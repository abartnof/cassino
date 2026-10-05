// What the table says: the events as phrases, each with its speaker.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { chunk, followBuilds, heard, speech } from "../src/talk.js";
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
const FREQUENT = /^(build|builds|raise|left)-\d+$|^take-|^(sweep|cash|clinch-cards|clinch-spades|residue|last|low-deals|my-deal|your-deal|left-more)$/;

test("everything is said in several ways, the frequent moments in many", () => {
  const few = [];
  for (const [group, keys] of Object.entries(WORDS.groups)) {
    const texts = keys.map((k) => WORDS.texts[k]);
    assert.equal(new Set(texts).size, texts.length, `${group} says something twice`);
    if (!VERBATIM.has(group) && texts.length < (FREQUENT.test(group) ? 5 : 3)) few.push(`${group}: ${texts.length}`);
    for (const text of texts) assert.ok(text.length <= 44, `too long for a balloon: "${text}"`);
  }
  assert.deepEqual(few, []);
});

// Whose deal it is, said as the cut cards are seen (play-testing: "Your
// deal." came after your opponent had already played); the house rules
// agreed as the deal begins.
test("the cut decides the deal, said as it is seen; then the house rules, as the cards are dealt", () => {
  const events = [{ kind: "cut", hand: 1 }, { kind: "first_dealer", hand: 1, you: true }, { kind: "dealt", hand: 1, deal: 1, last: false, you_deal: true }];
  const lines = speech(state(events));
  assert.deepEqual(said(lines), ["them:low-deals", "them:your-deal", "them:sweeps-ask", "you:sweeps-yes", "them:game-start"]);
  assert.deepEqual(lines.map((l) => l.at), [1, 1, 2, 2, 2], "with the cut cards seen, and as the deal begins");
  const royal = speech(state(events, { game: "royal", aces14: true, sweeps: false }));
  assert.deepEqual(said(royal), ["them:low-deals", "them:your-deal", "them:sweeps-ask", "you:sweeps-no", "them:royal", "them:aces-14", "them:game-start"]);
});

// Equal ranks cut again (docs/RULES.md §2): the engine tells each cut, and
// the house rules are agreed once, before the first.
test("a tied cut is cut again, and the house rules are not asked twice", () => {
  const cut = (yours, theirs) => ({ kind: "cut", hand: 1, yours: card(yours, Number(yours[0])), theirs: card(theirs, Number(theirs[0])) });
  const deal = { kind: "dealt", hand: 1, deal: 1, last: false, you_deal: true };
  const lines = speech(state([cut("5H", "5C"), cut("3D", "9S"), { kind: "first_dealer", hand: 1, you: true }, deal, { ...deal, deal: 2 }]));
  assert.deepEqual(said(lines.filter((l) => l.phrase !== "deal-more")), ["them:cut-again", "them:low-deals", "them:your-deal", "them:sweeps-ask", "you:sweeps-yes", "them:game-start"]);
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

// A capture says nothing as a rule; it speaks when it takes a cassino card,
// or a haul of several cards at once (Long: "take up as many as you can
// with one Card").
const take = (you, played, taken) => ({ kind: "played", hand: 1, you, type: "take", card: card(played, 0), taken: taken.map((c) => card(c, 0)), left: [] });

test("a capture taking a cassino card, or a haul of several, is remarked by its maker", () => {
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

// The sixth play-testing: "Remove the dialog balloons during scoring, and
// let the pop-ups do the work": the count is told by the score's popups and
// the celebrations on the table, and the score after the hand by the HUD.
test("nothing is said while a hand is scored: the score's popups tell it", () => {
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
      tallies: { you: { cards: 26 }, them: { cards: 26 } },
    },
  };
  const ends = { kind: "hand_ends", hand: 1, yours: 4, theirs: 4, totals: { you: 19, them: 12 } };
  assert.deepEqual(said(speech(state([scored, ends]))), []);
  // The game's end has its word still.
  const over = speech(state([scored, { ...ends, totals: { you: 12, them: 21 } }, { kind: "game_ends", hand: 1, you_won: false }]));
  assert.deepEqual(said(over), ["them:quite-normal"]);
});

// The seventh play-testing: "when the game concludes, the opponent should
// say 1 thing to me, no more. when I lost, the opponent said like three
// things to me: just one will suffice." One line, your opponent's, from
// beside the court card, heard whenever the calls are; nothing from you.
test("the game's end: your opponent says one thing, no more", () => {
  for (const [won, line] of [[false, "them:quite-normal"], [true, "them:good-game"]]) {
    const lines = speech(state([{ kind: "game_ends", hand: 1, you_won: won }]));
    assert.deepEqual(said(lines), [line], won ? "you won" : "you lost");
    assert.deepEqual(said(heard(lines, "calls")), [line]);
  }
});

// The game lost (play-testing): your opponent, revealed a court card, "says
// 'You are quite normal.'" -- its last word, heard whenever the calls are.
test("losing, your opponent's last word is that you are quite normal", () => {
  const lines = speech(state([{ kind: "game_ends", hand: 1, you_won: false }]));
  assert.equal(said(lines).at(-1), "them:quite-normal");
  assert.deepEqual(said(heard(lines, "calls")), ["them:quite-normal"]);
  assert.deepEqual(heard(lines, "none"), []);
  assert.deepEqual(WORDS.groups["quite-normal"].map((k) => WORDS.texts[k]), ["You are quite normal."]);
  assert.ok(!said(speech(state([{ kind: "game_ends", hand: 1, you_won: true }]))).includes("them:quite-normal"), "not when you win");
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
  for (const kind of ["build", "last", "take"]) assert.ok([...asked].some((p) => p.startsWith(kind)), `nothing said for ${kind}`);
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

test("lines one speaker says at one moment are said as one, so nobody waits through them one by one", () => {
  const lines = [
    { who: "them", phrase: "sweeps-ask", at: 0, delay: 0, words: "Do you count sweeps?" },
    { who: "you", phrase: "sweeps-no", at: 0, delay: 0, words: "No sweeps." },
    { who: "them", phrase: "royal", at: 0, delay: 0, words: "Royal, then." },
    { who: "them", phrase: "low-deals", at: 0, delay: 0, words: "Low deals." },
    { who: "them", phrase: "my-deal", at: 1, delay: 0, words: "My deal." },
    { who: "them", phrase: "last", at: 2, delay: 900, words: "Last." },
    { who: "you", phrase: "last-reply", at: 2, delay: 900, words: "Already?" },
  ];
  const said = chunk(lines);
  assert.deepEqual(said.map((l) => l.words), ["Do you count sweeps?", "No sweeps.", "Royal, then. Low deals. My deal.", "Last.", "Already?"]);
  assert.equal(said[2].phrase, "royal", "a chunk keeps its first line's phrase and moment");
});

test("the talk at three levels: none, the calls that carry the game, or everything", () => {
  const lines = ["sweeps-ask", "build-8", "last", "sweep", "cash", "quite-normal"].map((phrase) => ({ who: "them", phrase }));
  const chatter = ["left-7", "take-many", "take-big-casino", "clinch-cards", "residue", "haul-reply", "trail"].map((phrase) => ({ who: "them", phrase, chatter: true }));
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
  // Big and Little Cassino trailed are named: a point, if it is taken.
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
  // Taken back by its builder, as the call said: answered now and then
  // (not every time: it is the usual end of a build).
  const answered = speech(state([built, play(true, "trail", "4D"), play(false, "take", "8D", { value: 8, taken: [c("3H"), c("5C")], groups: [[c("3H"), c("5C")]] })]), 2);
  assert.deepEqual(said(answered), ["them:take-own", "you:own-build-reply"]);
  const raised = speech(state([built, play(true, "build", "2C", { value: 10, build_kind: "raise", raised_from: 8, multiple: false, onto: c("3H") })]), 1);
  assert.deepEqual(said(raised), ["you:raise-10", "them:raised-mine"]);
  assert.deepEqual(raised[1].vars, { old: "eight", value: "ten" });
  // Your own build raised by you is nobody's loss.
  const mine = play(true, "build", "3H", { value: 8, build_kind: "new", multiple: false, loose: [c("5C")] });
  assert.deepEqual(said(speech(state([mine, play(true, "build", "2C", { value: 10, build_kind: "raise", raised_from: 8, multiple: false, onto: c("3H") })]), 1)), ["you:raise-10", "them:build-reply"]);
});

// The run of play (the sixth play-testing: the talk felt "staccato", each
// line about its own move; "IF the player took their build, then say X - IF
// opponent snagged the build then say Y"): what a move says follows from
// the moves before it.
test("a capture of the card just trailed says so, a sum with it too; any other is named as before", () => {
  const trailed = play(false, "trail", "7H");
  const pair = speech(state([trailed, play(true, "take", "7C", { value: 7, taken: [c("7H")], groups: [[c("7H")]] })]), 1);
  assert.deepEqual(chat(pair), ["you:take-trailed"]);
  assert.equal(pair[0].vars.card, "seven");
  const sum = speech(state([trailed, play(true, "take", "9C", { value: 9, taken: [c("7H"), c("2D")], groups: [[c("7H"), c("2D")]] })]), 1);
  assert.deepEqual(chat(sum), ["you:take-trailed"]);
  // The card trailed two moves before, not the last: named as before.
  const older = speech(state([trailed, play(true, "trail", "4D"), play(false, "take", "7S", { value: 7, taken: [c("7H")], groups: [[c("7H")]] })]), 2);
  assert.deepEqual(chat(older), ["them:take-pair"]);
});

test("a build on the card the other just trailed is answered for it", () => {
  const lines = speech(state([play(false, "trail", "2H"), play(true, "build", "5S", { value: 7, build_kind: "new", multiple: false, loose: [c("2H")] })]), 1);
  assert.deepEqual(said(lines), ["you:build-7", "them:build-on-mine"]);
  assert.deepEqual(lines[1].vars, { card: "two", value: "seven" });
});

test("a build added to is answered for what it is: its builder's own made surer, or another's joined", () => {
  const mine = play(true, "build", "3H", { value: 8, build_kind: "new", multiple: false, loose: [c("5C")] });
  const more = speech(state([mine, play(true, "build", "8D", { value: 8, build_kind: "add", multiple: true, onto: c("3H") })]), 1);
  assert.deepEqual(said(more), ["you:builds-8", "them:build-more-reply"]);
  assert.equal(more[1].vars.values, "eights");
  const theirs = play(false, "build", "3H", { value: 6, build_kind: "new", multiple: false, loose: [c("3C")] });
  const joined = speech(state([theirs, play(true, "build", "6D", { value: 6, build_kind: "add", multiple: true, onto: c("3H") })]), 1);
  assert.deepEqual(said(joined), ["you:builds-6", "them:joined-mine"], "not a raise: the value is the same");
  assert.deepEqual(joined[1].vars, { value: "six", values: "sixes", taker: "six", ataker: "a six" });
});

test("a run of trails is remarked at the third, and the capture that ends it", () => {
  const events = [
    play(true, "trail", "2H"),
    play(false, "trail", "3D"),
    play(true, "trail", "4H"),
    play(false, "trail", "5D"),
    play(true, "trail", "6H"),
    play(false, "trail", "9C"),
    play(true, "take", "9D", { value: 9, taken: [c("9C")], groups: [[c("9C")]] }),
  ];
  const lines = speech(state(events));
  const yours = lines.filter((l) => l.who === "you" && l.chatter).map((l) => l.phrase);
  assert.deepEqual(yours, ["trail", "trail", "trail-again", "take-at-last"]);
  // Said at the third only, not at every trail after it.
  const longer = [...events.slice(0, 6), play(true, "trail", "7H"), play(false, "trail", "8C"), play(true, "trail", "KH")];
  assert.deepEqual(speech(state(longer)).filter((l) => l.who === "you" && l.chatter).map((l) => l.phrase), ["trail", "trail", "trail-again", "trail", "trail"]);
  assert.equal(lines.find((l) => l.phrase === "trail-again").vars.acard, "a six");
  // A new hand starts the count afresh.
  const next = speech(state([...events.slice(0, 4), { kind: "dealt", hand: 2, deal: 1, last: false, you_deal: true }, play(true, "trail", "6H")]), 5);
  assert.deepEqual(chat(next), ["you:trail"]);
});

test("a trail onto a table swept clean says there was nothing to take; no other trail claims it", () => {
  const lines = speech(state([play(false, "take", "TC", { value: 10, taken: [c("4H"), c("6H")], groups: [[c("4H"), c("6H")]] }), { kind: "swept", hand: 1, you: false }, play(true, "trail", "5S")]), 2);
  assert.deepEqual(chat(lines), ["you:trail-fresh"]);
  assert.equal(lines[0].vars.acard, "a five");
  assert.ok(WORDS.groups["trail-fresh"].some((k) => /^Nothing to take/.test(WORDS.texts[k])));
  for (const group of ["trail", "trail-again", "trail-ace"]) {
    for (const k of WORDS.groups[group]) assert.doesNotMatch(WORDS.texts[k], /nothing to take/i, `${group}: a trail may have been chosen over a capture`);
  }
});

test("every answer to a build says what the build tells", () => {
  for (const k of WORDS.groups["build-reply"]) assert.match(WORDS.texts[k], /\{(value|Value|ataker|Ataker|taker)\}/, WORDS.texts[k]);
});

test("a sweep, a Cassino or an ace taken is felt by the other player", () => {
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

// ---- the seventh play-testing: "add even more IF X then Y triggers. in
// addition to textual if X then Y (i said X, then Y, so I'll follow up on
// X), think about metatextual ones- you've been playing for a while with no
// builds, so the opponent gently ribs you", from period books about card
// play (research/13-table-banter.md), PG throughout. The talk revives how
// the game was talked over, and keeps the player from quietly counting.

const deal = (hand, dealt = 1, youDeal = false, last = false) => ({ kind: "dealt", hand, deal: dealt, last, you_deal: youDeal });
const ends = (hand, yours, theirs, totals) => ({ kind: "hand_ends", hand, yours, theirs, totals });
const trailBy = (you, code) => play(you, "trail", code);
const pairBy = (you, code, taken) => play(you, "take", code, { value: c(code).rank, taken: [c(taken)], groups: [[c(taken)]] });

test("a long while without a build of yours is ribbed: at your tenth move without one, and again at the twenty-second", () => {
  const yours = (n) => Array.from({ length: n }, (_, i) => [trailBy(true, "23456789T"[i % 9] + "H"), trailBy(false, "23456789T"[i % 9] + "C")]).flat();
  const ribs = (events) => only(speech(state(events)), ["rib-no-builds"]);
  assert.deepEqual(ribs(yours(9)), []);
  assert.deepEqual(ribs(yours(10)), ["them:rib-no-builds"]);
  assert.deepEqual(ribs(yours(22)), ["them:rib-no-builds", "them:rib-no-builds"]);
  // A build of yours starts the count again, across hands too.
  const built = [...yours(6), play(true, "build", "5H", { value: 8, loose: [c("3S")] }), ...yours(9)];
  assert.deepEqual(ribs(built), []);
  assert.deepEqual(ribs([...yours(6), deal(2, 1), ...yours(4)]), ["them:rib-no-builds"], "the game's moves, not the hand's");
});

test("a fourth trail running is ribbed by the other player; your opponent's own is its dry spell", () => {
  const run = [trailBy(true, "2H"), trailBy(false, "3C"), trailBy(true, "4H"), trailBy(false, "5C"), trailBy(true, "6H"), trailBy(false, "7C"), trailBy(true, "8H"), trailBy(false, "9C")];
  const lines = speech(state(run));
  assert.deepEqual(only(lines, ["rib-trails", "own-dry-spell", "trail-again"]), ["you:trail-again", "them:trail-again", "them:rib-trails", "them:own-dry-spell"]);
  // Your opponent's fourth trail says its dry spell in place of a plain trail.
  assert.deepEqual(chat(speech(state(run), 7)), ["them:own-dry-spell"]);
});

test("as a new hand is dealt, your opponent remarks on the score: far ahead or behind, a comeback, close near the end, a long game", () => {
  const at = (before, totals, hand = 2) => only(speech(state([ends(hand - 1, totals.you - before.you, totals.them - before.them, totals), deal(hand, 1, false)])), (p) => p.startsWith("score-"));
  assert.deepEqual(at({ you: 0, them: 0 }, { you: 2, them: 10 }), ["them:score-ahead"]);
  assert.deepEqual(at({ you: 0, them: 0 }, { you: 10, them: 1 }), ["them:score-behind"]);
  assert.deepEqual(at({ you: 4, them: 10 }, { you: 12, them: 13 }, 3), ["them:score-close"], "close near the end comes first");
  assert.deepEqual(at({ you: 2, them: 9 }, { you: 10, them: 11 }), ["them:score-comeback-you"]);
  assert.deepEqual(at({ you: 9, them: 2 }, { you: 11, them: 10 }), ["them:score-comeback-them"]);
  assert.deepEqual(at({ you: 8, them: 6 }, { you: 11, them: 8 }, 4), ["them:score-long"]);
  assert.deepEqual(at({ you: 0, them: 0 }, { you: 6, them: 5 }), [], "nothing to remark");
  // Said by your opponent whoever deals; the dealer's "New hand." gives way
  // when it is your opponent's deal.
  const theirDeal = speech(state([ends(1, 2, 9, { you: 2, them: 9 }), deal(2, 1, false)]));
  assert.deepEqual(chat(theirDeal), ["them:score-ahead"]);
  const yourDeal = speech(state([ends(1, 2, 9, { you: 2, them: 9 }), deal(2, 1, true)]));
  assert.deepEqual(chat(yourDeal), ["you:new-hand", "them:score-ahead"]);
});

test("the game opens with a word from your opponent, after the house rules", () => {
  const lines = speech(state([deal(1, 1, true)]));
  assert.deepEqual(said(lines), ["them:sweeps-ask", "you:sweeps-yes", "them:game-start"]);
  assert.equal(lines.at(-1).chatter, true);
});

test("a Cassino trailed as 'a point, if you take it' and taken at once is answered for the offer", () => {
  const lines = speech(state([trailBy(true, "2S"), play(false, "take", "2C", { value: 2, taken: [c("2S")], groups: [[c("2S")]] })]));
  assert.deepEqual(chat(lines), ["you:trail-little-casino", "them:take-offered", "you:little-casino-gone"]);
  const big = speech(state([trailBy(false, "TD"), play(true, "take", "TH", { value: 10, taken: [c("TD")], groups: [[c("TD")]] })]));
  assert.deepEqual(chat(big), ["them:trail-big-casino", "you:take-offered", "them:big-casino-gone"]);
});

test("a build raised from under its builder and taken back by them is answered for it", () => {
  const events = [
    play(false, "build", "2C", { value: 6, build_kind: "new", loose: [c("4D")] }),
    play(true, "build", "3H", { value: 9, build_kind: "raise", onto: c("2C"), loose: [] }),
    play(false, "take", "9S", { value: 9, taken: [c("2C"), c("4D"), c("3H")], groups: [[c("2C"), c("4D"), c("3H")]] }),
  ];
  const lines = speech(state(events), 2);
  assert.deepEqual(chat(lines), ["them:take-back-raised", "you:lost-build"]);
});

test("a second sweep in a hand, both Cassinos to one player, a run of three captures: each felt by the other", () => {
  const sweep = (you, code) => [play(you, "take", code, { value: c(code).rank, taken: [c("5D")], groups: [[c("5D")]] }), { kind: "swept", hand: 1, you }];
  const twice = speech(state([...sweep(true, "5C"), trailBy(false, "3D"), ...sweep(true, "3H")]));
  assert.deepEqual(only(twice, ["sweep-reply", "sweep-again"]), ["them:sweep-reply", "them:sweep-again"]);
  // A new hand starts the sweeps afresh.
  assert.deepEqual(only(speech(state([...sweep(true, "5C"), deal(2, 1), ...sweep(true, "3H")])), ["sweep-reply", "sweep-again"]), ["them:sweep-reply", "them:sweep-reply"]);
  const both = speech(state([pairBy(true, "TH", "TD"), trailBy(false, "4D"), pairBy(true, "2H", "2S")]));
  assert.deepEqual(only(both, ["big-casino-gone", "little-casino-gone", "both-cassinos"]), ["them:big-casino-gone", "them:both-cassinos"]);
  const streak = speech(state([pairBy(true, "4H", "4C"), trailBy(false, "9D"), pairBy(true, "5H", "5C"), trailBy(false, "8D"), pairBy(true, "6H", "6C")]));
  assert.deepEqual(only(streak, ["rib-streak"]), ["them:rib-streak"]);
  const theirs = speech(state([pairBy(false, "4H", "4C"), trailBy(true, "9D"), pairBy(false, "5H", "5C"), trailBy(true, "8D"), pairBy(false, "6H", "6C")]));
  assert.deepEqual(only(theirs, ["own-streak", "take-pair"]).filter((l) => l.startsWith("them")), ["them:take-pair", "them:take-pair", "them:own-streak"]);
});

test("your clinch is answered: your opponent sees you counting", () => {
  const lines = speech(state([pairBy(true, "4H", "4S"), { kind: "clinched", hand: 1, you: true, what: "spades" }]));
  assert.deepEqual(only(lines, ["clinch-spades", "counting-you"]), ["you:clinch-spades", "them:counting-you"]);
  assert.deepEqual(only(speech(state([pairBy(false, "4H", "4S"), { kind: "clinched", hand: 1, you: false, what: "cards" }])), ["counting-you"]), []);
});

test("kept waiting a while, your opponent follows up on your move: a capture, or anything else", () => {
  const events = [trailBy(false, "3C"), pairBy(true, "3H", "3C"), trailBy(false, "5D")];
  const followed = speech(state(events), 1, { waited: true });
  assert.deepEqual(only(followed, (p) => p.startsWith("waited")), ["them:waited-take"]);
  // Said with their move, before its own words, so a call there carries it.
  const theirs = followed.filter((l) => l.at === 2).map((l) => l.phrase);
  assert.equal(theirs[0], "waited-take");
  assert.deepEqual(only(speech(state([trailBy(true, "8H")]), 0, { waited: true }), (p) => p.startsWith("waited")), ["them:waited-other"]);
  assert.deepEqual(only(speech(state(events), 1), (p) => p.startsWith("waited")), [], "only when kept waiting");
  // In place of your own remark on that move, so it has the room (your
  // calls stay).
  assert.deepEqual(chat(speech(state(events), 1, { waited: true })).filter((l) => l.startsWith("you")), []);
  const build = speech(state([play(true, "build", "3H", { value: 8, build_kind: "new", loose: [c("5D")] })]), 0, { waited: true });
  assert.deepEqual(said(build).filter((l) => l.startsWith("you")), ["you:build-8"]);
});

test("now and then your opponent remarks on its own talk", () => {
  const events = Array.from({ length: 26 }, (_, i) => trailBy(i % 2 === 1, "23456789TJQK"[i % 12] + "SHDC"[i % 4]));
  const lines = speech(state(events));
  const talk = lines.filter((l) => l.phrase === "talkative");
  assert.ok(talk.length >= 1 && talk.length <= 3, `${talk.length} remarks on the talk in 26 moves`);
  for (const l of talk) assert.equal(l.who, "them");
});

test("the new remarks are said in several ways, kindly, each from the period books or the table's own", () => {
  for (const group of ["rib-no-builds", "rib-trails", "own-dry-spell", "score-ahead", "score-behind", "score-close", "score-comeback-you", "score-comeback-them", "score-long", "game-start", "take-offered", "take-back-raised", "sweep-again", "both-cassinos", "rib-streak", "own-streak", "counting-you", "waited-take", "waited-other", "talkative"]) {
    assert.ok((WORDS.groups[group] ?? []).length >= 4, `${group}: ${(WORDS.groups[group] ?? []).length} ways`);
  }
});

// The user: "remove the game dialog that says you're a Trump, and remove
// any other dialog that references a trump please."
test("nothing said mentions a trump", () => {
  const trumps = Object.entries(WORDS.texts).filter(([, text]) => /trump/i.test(text));
  assert.deepEqual(trumps, []);
});
