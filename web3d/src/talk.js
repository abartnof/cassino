// What the table says: the protocol's events as a queue of phrases, each
// with its speaker (docs/TABLE3D.md section 7, docs/DESIGN.md section 12.1).
// The phrases are groups of the bank in web3d/tools/phrases.py, each said in
// several ways (docs/PHRASES.md); the dialogue picks among them. A pure
// function, so the page only shows what it returns.
//
// speech(state, since) -> [{ who, phrase, at, kind }] for the events from
// index `since`: who is "you" or "them"; `at` is the index of the event the
// phrase belongs to, so it is said when that event is seen to happen.
//
// The idea is piquet's speech.js @ 254cb3c ("maximal speaking": anything a
// person would say, we say); the talk is cassino's: the house rules agreed
// aloud before the game (Jack London's players), the build calls in the
// singular and the plural and a raise by its new total (Dick, Foster, the
// Hoyles), the dealer's "Last.", "Clear!" for a sweep, "Cash.", a cassino
// card or a haul of several taken, the clinches, and the custom of pointing
// out what an opponent left. Nothing is said while a hand is scored: the
// score's popups and the celebrations on the table tell it (the sixth
// play-testing: "Remove the dialog balloons during scoring, and let the
// pop-ups do the work"). All of it kind: nothing said belittles anyone.

const POINT_CARDS = new Set(["AS", "AH", "AD", "AC", "TD", "2S"]);
// Table cards taken at once that make a haul worth remarking.
const HAUL = 4;

// The kinds of the events a move brings with it: a sweep, cash, a clinch.
function following(events, at) {
  const kinds = new Set();
  for (let k = at + 1; k < events.length && ["swept", "cash", "clinched"].includes(events[k].kind); k++) kinds.add(events[k].kind);
  return kinds;
}

// What a capture says, if nothing else speaks for it (a sweep, cash): a
// cassino card taken, or a haul of several cards. A plain capture says
// nothing, so the table does not chatter on every move.
function taking(e, then) {
  if (then.has("swept") || then.has("cash")) return null;
  const cards = [e.card, ...(e.taken ?? [])].map((c) => c?.card);
  if (cards.includes("TD")) return "take-big-casino";
  if (cards.includes("2S")) return "take-little-casino";
  return (e.taken?.length ?? 0) >= HAUL ? "take-many" : null;
}

// The call a build makes: a raise by its new total, a multiple build in the
// plural, any other in the singular.
function call(e) {
  if (e.build_kind === "raise") return `raise-${e.value}`;
  return e.multiple ? `builds-${e.value}` : `build-${e.value}`;
}

// The builds on the table, followed through a game's events: each its cards,
// its controller and its value, so the talk knows whose build a capture
// takes or a raise changes. `see(e)` returns what the event did: `took`,
// the builds a capture took; `raised`, the build a raise or an addition
// changed, as it was before.
export function followBuilds() {
  let builds = [];
  return {
    builds: () => builds,
    see(e) {
      if (e.kind === "dealt" && e.deal === 1) builds = [];
      if (e.kind !== "played") return {};
      const who = e.you ? "you" : "them";
      if (e.type === "build") {
        const cards = [e.card, ...(e.loose ?? [])].filter(Boolean).map((c) => c.card);
        const onto = e.onto && builds.find((b) => b.cards.has(e.onto.card));
        if (!onto) {
          builds.push({ cards: new Set(cards), who, value: e.value });
          return {};
        }
        const raised = { who: onto.who, value: onto.value };
        for (const c of cards) onto.cards.add(c);
        // Taken over from its builder: whose it was, for a capture back.
        if (onto.who !== who) onto.from = onto.who;
        onto.who = who;
        onto.value = e.value;
        return { raised };
      }
      if (e.type === "take") {
        const taken = new Set((e.taken ?? []).map((c) => c.card));
        const took = builds.filter((b) => [...b.cards].some((c) => taken.has(c)));
        builds = builds.filter((b) => !took.includes(b));
        return { took };
      }
      return {};
    },
  };
}

// The run of play, followed through a game's events, for what a move says
// in its context (the sixth play-testing: the talk felt "staccato", each
// line about its own move alone). `see(e)` returns, for a move: `prev`, the
// move before it; `run`, how many times running its maker has only
// trailed; `takes`, how many times running they have captured; `empty`,
// whether a sweep has left the table bare; `sinceBuild`, for a move of
// yours, how many of your moves this game since your last build; and
// `cassinos`, the Cassinos its maker has taken this hand. For a sweep,
// `sweeps`: how many its maker has made this hand, this one included.
export function followPlay() {
  let prev = null;
  let empty = false;
  let sinceBuild = 0;
  const trails = { you: 0, them: 0 };
  const takes = { you: 0, them: 0 };
  const sweeps = { you: 0, them: 0 };
  const cassinos = { you: [], them: [] };
  return {
    see(e) {
      if (e.kind === "dealt" && e.deal === 1) {
        prev = null;
        empty = false;
        for (const side of ["you", "them"]) {
          trails[side] = takes[side] = sweeps[side] = 0;
          cassinos[side] = [];
        }
      }
      if (e.kind === "swept") {
        empty = true;
        const side = e.you ? "you" : "them";
        sweeps[side] += 1;
        return { sweeps: sweeps[side] };
      }
      if (e.kind !== "played") return {};
      const who = e.you ? "you" : "them";
      const seen = { prev, run: trails[who], takes: takes[who], empty, sinceBuild: e.you ? sinceBuild : null, cassinos: cassinos[who] };
      trails[who] = e.type === "trail" ? trails[who] + 1 : 0;
      takes[who] = e.type === "take" ? takes[who] + 1 : 0;
      if (e.you) sinceBuild = e.type === "build" ? 0 : sinceBuild + 1;
      if (e.type === "take") {
        const got = [e.card, ...(e.taken ?? [])].map((c) => c?.card).filter((c) => c === "TD" || c === "2S");
        cassinos[who] = [...new Set([...cassinos[who], ...got])];
      }
      prev = e;
      empty = false;
      return seen;
    },
  };
}

// The score as each hand ends, for what is said as the next is dealt (the
// seventh play-testing: talk about the run of the game, from the period
// books): far ahead or behind, a comeback, close near the end, a long game;
// or nothing to remark. `e`, the hand's end: its points and the totals.
export const SCORE = Object.freeze({ far: 7, near: 12, close: 3, behind: 3, swing: 4, long: 4 });
export function scoreSaid(e, hand) {
  const { you, them } = e.totals;
  const before = { you: you - (e.yours ?? 0), them: them - (e.theirs ?? 0) };
  const won = (e.yours ?? 0) - (e.theirs ?? 0); // your margin in the hand
  if (Math.max(you, them) >= SCORE.near && Math.abs(you - them) <= SCORE.close) return "score-close";
  if (before.them - before.you >= SCORE.behind && won >= SCORE.swing) return "score-comeback-you";
  if (before.you - before.them >= SCORE.behind && -won >= SCORE.swing) return "score-comeback-them";
  if (them - you >= SCORE.far) return "score-ahead";
  if (you - them >= SCORE.far) return "score-behind";
  if (hand >= SCORE.long) return "score-long";
  return null;
}

// Numbers and cards in words, for the slots of the chatter's lines.
const NUMBER = ["nothing", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const TENS = { 2: "twenty", 3: "thirty", 4: "forty", 5: "fifty" };
export function number(n) {
  if (n <= 20) return NUMBER[n];
  const tens = TENS[Math.floor(n / 10)];
  return n % 10 ? `${tens}-${NUMBER[n % 10]}` : tens;
}
// A build's value in the plural, as a multiple build is called.
const plural = (n) => (n === 6 ? "sixes" : `${number(n)}s`);
const RANK = ["", "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king"];
const named = (rank) => ({
  card: RANK[rank],
  cards: rank === 6 ? "sixes" : `${RANK[rank]}s`,
  acard: `${rank === 1 || rank === 8 ? "an" : "a"} ${RANK[rank]}`,
});
// The card that takes a build of a value (an ace takes fourteen): its name,
// and with its article.
const taker = (value) => RANK[value === 14 ? 1 : value];
const takers = (value) => ({ taker: taker(value), ataker: named(value === 14 ? 1 : value).acard });

// Who sits across: the other player.
const other = (who) => (who === "you" ? "them" : "you");

// `waited`: you were kept a while over the first move of yours since
// `since`, and your opponent said so (main.js); it follows that up.
export function speech(state, since = 0, { waited = false } = {}) {
  const out = [];
  const rules = state.rules ?? {};
  const follow = followBuilds();
  const run = followPlay();
  let ended = null; // the last hand's end, for the score said at the next
  let waiting = waited;
  let followUp = null; // { phrase, at }: your opponent's follow-up, to come with their move
  state.events.forEach((e, at) => {
    const did = { ...follow.see(e), ...run.see(e) };
    if (e.kind === "hand_ends") ended = e;
    if (at < since) return;
    const say = (who, phrase, extra = {}) => out.push({ who, phrase, at, kind: e.kind, ...extra });
    // A remark: chatter, heard only when everything is, and said only where
    // it has room (dialogue.js).
    const remark = (who, phrase, vars, extra = {}) => say(who, phrase, { chatter: true, ...(vars ? { vars } : {}), ...extra });
    const who = e.you ? "you" : "them";
    switch (e.kind) {
      case "cut":
        // Equal cards are cut again.
        if (e.yours && e.theirs && e.yours.rank === e.theirs.rank) say("them", "cut-again");
        break;
      case "first_dealer":
        // Whose deal it is, said as the cut cards are seen (play-testing:
        // said later, it came after your opponent had played).
        say("them", "low-deals");
        say("them", e.you ? "your-deal" : "my-deal");
        break;
      case "dealt": {
        const dealer = e.you_deal ? "you" : "them";
        // The house rules, agreed as the first deal begins, once: your
        // opponent asks (Jack London's players), and your settings answer;
        // Royal's values and the aces, remarked where there is room.
        if (e.hand === 1 && e.deal === 1) {
          say("them", "sweeps-ask");
          say("you", rules.sweeps === false ? "sweeps-no" : "sweeps-yes");
          if (rules.game === "royal") remark("them", "royal");
          if (rules.aces14) remark("them", "aces-14");
          // And a word to begin on (Lamb's "the rigour of the game").
          remark("them", "game-start");
        }
        if (e.deal === 1 && e.hand > 1) {
          // The score, remarked by your opponent as the next hand is dealt
          // (nothing is said while a hand is scored): in place of their own
          // "New hand." when the deal is theirs.
          const score = ended ? scoreSaid(ended, e.hand) : null;
          if (!(score && dealer === "them")) remark(dealer, "new-hand");
          if (score) remark("them", score);
        } else if (e.deal > 1 && !e.last) remark(dealer, "deal-more");
        if (e.last) {
          say(dealer, "last");
          remark(other(dealer), "last-reply");
        }
        break;
      }
      case "played":
        // Kept waiting over your move, your opponent follows it up as they
        // make their own, with its call, which a remark alone would have
        // to make way for ("Worth the wait! Building eight.").
        if (!e.you && followUp) {
          remark("them", followUp.phrase);
          followUp = null;
        }
        played(e, at, who, did, state.events, since, remark, say);
        // And in place of your own remark on it (your calls stay).
        if (e.you && waiting) {
          waiting = false;
          for (let k = out.length - 1; k >= 0 && out[k].at === at; k--) if (out[k].who === "you" && out[k].chatter) out.splice(k, 1);
          followUp = { phrase: e.type === "take" ? "waited-take" : "waited-other", at };
        }
        break;
      case "swept":
        say(who, "sweep");
        // A second sweep in a hand is felt more ("Never was such luck!").
        remark(other(who), did.sweeps > 1 ? "sweep-again" : "sweep-reply");
        break;
      case "cash":
        say(who, "cash");
        break;
      case "clinched":
        remark(who, e.what === "cards" ? "clinch-cards" : "clinch-spades");
        // Yours: your opponent sees you counting ("Counting all your
        // suits, are you?").
        if (e.you) remark("them", "counting-you");
        break;
      case "residue":
        if (e.you !== null) remark(who, "residue");
        break;
      case "game_ends":
        // One line, your opponent's, from beside the court card it turns
        // out to have been all along (the seventh play-testing: "the
        // opponent should say 1 thing to me, no more"): winning, its last
        // word (play-testing); losing, a gracious one.
        say("them", e.you_won ? "good-game" : "quite-normal");
        break;
      default:
        break;
    }
  });
  // No move of theirs to come with: on your move, then.
  if (followUp) out.push({ who: "them", phrase: followUp.phrase, at: followUp.at, kind: "played", chatter: true });
  return out;
}

// What a move says: the build's call and its answer; a capture's claim, in
// its own words, and what the other player feels of it; a trail named; what
// you left pointed out; and now and then your opponent thinking aloud first.
// Each in the context of the moves before it (`did`, followBuilds and
// followPlay): a capture of the card just trailed, or a build on it; a
// build taken back by its builder, or taken by the other; a build added to;
// the third trail running, and the capture that ends such a run; a trail
// onto a table swept clean. Each says what a plainer line would have, not
// more.
function played(e, at, who, did, events, since, remark, say) {
  const them = other(who);
  const card = e.card ?? {};
  // The card the other player trailed just before this move, if any.
  const trailed = did.prev && did.prev.you !== e.you && did.prev.type === "trail" ? did.prev.card : null;
  // Your opponent thinks aloud as your move is seen, before theirs: now and
  // then, and only about a move in this batch.
  // Now and then, in place of that, a word on its own talk, which is
  // there to keep the game lively and you from counting quietly ("Am I
  // talking too much? On purpose?").
  if (!e.you && at % 3 === 0 && at - 1 >= since) {
    remark("them", at % 12 === 0 ? "talkative" : e.type === "take" ? "think-take" : "think", null, { at: at - 1 });
  }
  // The run of the game: a long while without a build of yours, ribbed at
  // your tenth move without one and again at the twenty-second.
  if (e.you && (did.sinceBuild === 9 || did.sinceBuild === 21) && e.type !== "build") remark("them", "rib-no-builds");
  if (e.type === "build") {
    say(who, call(e));
    const value = number(e.value);
    const onTrailed = trailed && (e.loose ?? []).some((c) => c.card === trailed.card);
    if (did.raised && did.raised.who !== who) {
      // Another's build: joined at its value, or raised from under it.
      if (e.build_kind === "add") remark(them, "joined-mine", { value, values: plural(e.value), ...takers(e.value) });
      else remark(them, "raised-mine", { old: number(did.raised.value), value });
    } else if (e.build_kind === "add") remark(them, "build-more-reply", { values: plural(e.value) });
    else if (onTrailed) remark(them, "build-on-mine", { card: named(trailed.rank).card, value });
    else remark(them, "build-reply", { value, ...takers(e.value) });
  }
  if (e.type === "trail") {
    if (card.card === "2S") remark(who, "trail-little-casino");
    else if (card.card === "TD") remark(who, "trail-big-casino");
    else if (did.empty && card.rank) remark(who, "trail-fresh", named(card.rank));
    else if (did.run === 2 && card.rank) remark(who, "trail-again", named(card.rank));
    // Your opponent's fourth trail running: its dry spell, grumbled.
    else if (did.run === 3 && !e.you) remark(who, "own-dry-spell");
    else if (card.rank === 1) remark(who, "trail-ace");
    else if (card.rank) remark(who, "trail", named(card.rank));
    // Your fourth, ribbed ("Are you sandbagging me?").
    if (did.run === 3 && e.you) remark("them", "rib-trails");
  }
  if (e.type === "take") {
    const then = following(events, at);
    const stolen = (did.took ?? []).find((b) => b.who !== who);
    const own = (did.took ?? []).find((b) => b.who === who);
    // Every card the capture brings in, the card played among them.
    const taken = [card, ...(e.taken ?? [])].map((c) => c.card).filter(Boolean);
    const loud = then.has("swept") || then.has("cash");
    // A Cassino the other trailed just before, "a point, if you take it".
    const offered = trailed && ["2S", "TD"].includes(trailed.card) && taken.includes(trailed.card);
    if (!loud) {
      // A build taken back from under the one who raised it.
      if (stolen && stolen.from === who) remark(who, "take-back-raised");
      else if (stolen) remark(who, "take-theirs", { value: number(stolen.value), ...takers(stolen.value) });
      else if (own) remark(who, "take-own", { value: number(own.value) });
      else if (offered) remark(who, "take-offered");
      // Your opponent's third capture running: its luck, enjoyed.
      else if (did.takes === 2 && !e.you) remark(who, "own-streak");
      else {
        const big = taking(e, then);
        if (big) remark(who, big);
        else if (did.run >= 3) remark(who, "take-at-last");
        else if (trailed && taken.includes(trailed.card)) remark(who, "take-trailed", { card: named(trailed.rank).card });
        else if ((e.groups ?? []).every((g) => g.length === 1 && g[0].rank === card.rank)) remark(who, "take-pair", named(card.rank));
        else remark(who, "take-sum", { value: number(e.value ?? card.rank) });
      }
    }
    // What the other player feels: a build lost, a Cassino or an ace gone,
    // a build taken back as called (now and then: it is the usual end of a
    // build), a haul (a sweep is felt as it is claimed).
    // Both Cassinos to one player in a hand, felt as one.
    const both = (did.cassinos ?? []).length < 2 && new Set([...(did.cassinos ?? []), ...taken.filter((c) => c === "TD" || c === "2S")]).size === 2;
    if (stolen) remark(them, "lost-build", { value: number(stolen.value) });
    else if (!loud && both) remark(them, "both-cassinos");
    else if (!loud && taken.includes("TD")) remark(them, "big-casino-gone");
    else if (!loud && taken.includes("2S")) remark(them, "little-casino-gone");
    else if (!loud && own && at % 2 === 0) remark(them, "own-build-reply");
    else if (!loud && taken.some((c) => c[0] === "A")) remark(them, "ace-gone");
    else if (!loud && (e.taken?.length ?? 0) >= HAUL) remark(them, "haul-reply");
    // Your third capture running, ribbed ("That's a beefy run of luck!").
    if (e.you && did.takes === 2) remark("them", "rib-streak");
  }
  // What you left, pointed out (the Dominican dejado): always when it
  // holds a point card or more than one card, otherwise now and then.
  if (e.you && e.left?.length) {
    const worth = e.left.length > 1 || e.left.some((c) => POINT_CARDS.has(c.card));
    if (worth || at % 2 === 0) remark("them", e.left.length > 1 ? "left-more" : `left-${e.left[0].rank}`);
  }
}

// Lines one speaker says at one moment, said as one (play-testing: waiting
// through your opponent's lines one by one is time spent for nothing): the
// first's phrase and moment, the words joined.
export function chunk(lines) {
  const out = [];
  for (const l of lines) {
    const last = out.at(-1);
    if (last && last.who === l.who && last.delay === l.delay) {
      out[out.length - 1] = { ...last, words: `${last.words} ${l.words}`, chatter: !!(last.chatter && l.chatter) };
    } else out.push(l);
  }
  return out;
}

// The table talk at a level (a setting): "none"; "calls", what carries the
// game -- the house rules, the build calls, "Last.", a sweep, cash, the
// game's last word; or "all", the chatter too: every move remarked, the
// builds answered.
export function heard(lines, level) {
  if (level === "none") return [];
  if (level === "calls") return lines.filter((l) => !l.chatter);
  return lines;
}
