// What the table says: the protocol's events as a queue of phrases, each
// with its speaker (docs/TABLE3D.md section 7, docs/DESIGN.md section 12.1).
// The phrases are groups of the bank in web3d/tools/phrases.py, each said in
// several ways (docs/PHRASES.md); the dialogue picks among them. A pure
// function, so the page only shows what it returns.
//
// speech(state, since) -> [{ who, phrase, at, kind, line? }] for the events
// from index `since`: who is "you" or "them"; `at` is the index of the event
// the phrase belongs to, so it is said when that event is seen to happen;
// `line`, for the count's chant, is the index of its line, said as that line
// is written on the score sheet.
//
// The idea is piquet's speech.js @ 254cb3c ("maximal speaking": anything a
// person would say, we say); the talk is cassino's: the house rules agreed
// aloud before the game (Jack London's players), the build calls in the
// singular and the plural and a raise by its new total (Dick, Foster, the
// Hoyles), the dealer's "Last.", "Clear!" for a sweep, "Cash.", a casino
// card or a haul of several taken, the clinches, the custom of pointing out
// what an opponent left, and the count chanted, a tie on the cards first.
// All of it kind: nothing said belittles anyone.

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
// casino card taken, or a haul of several cards. A plain capture says
// nothing, so the table does not chatter on every move.
function taking(e, then) {
  if (then.has("swept") || then.has("cash")) return null;
  const cards = [e.card, ...(e.taken ?? [])].map((c) => c?.card);
  if (cards.includes("TD")) return "take-big-casino";
  if (cards.includes("2S")) return "take-little-casino";
  return (e.taken?.length ?? 0) >= HAUL ? "take-many" : null;
}

// The chant of a line of the count.
function chant(line) {
  if (line.item === "ace") return `count-ace-${line.suit}`;
  if (line.item === "sweeps") return `count-sweeps-${Math.min(8, line.points)}`;
  return `count-${line.item.replace("_", "-")}`;
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

// Numbers and cards in words, for the slots of the chatter's lines.
const NUMBER = ["nothing", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const TENS = { 2: "twenty", 3: "thirty", 4: "forty", 5: "fifty" };
export function number(n) {
  if (n <= 20) return NUMBER[n];
  const tens = TENS[Math.floor(n / 10)];
  return n % 10 ? `${tens}-${NUMBER[n % 10]}` : tens;
}
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
// A score this close to 21 is worth remarking, the points still needed:
// no more than the cards' three, so that "I'll make cards. That's all I
// need." is true when said.
const NEAR = 3;

export function speech(state, since = 0) {
  const out = [];
  const rules = state.rules ?? {};
  const follow = followBuilds();
  state.events.forEach((e, at) => {
    const did = follow.see(e);
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
        }
        if (e.deal === 1 && e.hand > 1) remark(dealer, "new-hand");
        else if (e.deal > 1 && !e.last) remark(dealer, "deal-more");
        if (e.last) {
          say(dealer, "last");
          remark(other(dealer), "last-reply");
        }
        break;
      }
      case "played":
        played(e, at, who, did, state.events, since, remark, say);
        break;
      case "swept":
        say(who, "sweep");
        remark(other(who), "sweep-reply");
        break;
      case "cash":
        say(who, "cash");
        break;
      case "clinched":
        remark(who, e.what === "cards" ? "clinch-cards" : "clinch-spades");
        break;
      case "residue":
        if (e.you !== null) remark(who, "residue");
        break;
      case "scored": {
        // A tie on the cards scores nobody, and is said first, where the
        // cards would be counted: at the count's moment, not as a line of it.
        const t = e.count.tallies;
        if (t && t.you.cards === t.them.cards && !e.count.lines.some((l) => l.item === "cards")) say("them", "count-cards-tie");
        e.count.lines.forEach((line, i) => say(line.who, chant(line), { line: i }));
        break;
      }
      case "hand_ends": {
        // The score said aloud by your opponent, who keeps it, and
        // answered; the end in sight remarked. Not when the game is over:
        // the winner claims it instead.
        if (state.events.slice(at + 1).some((n) => n.kind === "game_ends" && n.hand === e.hand)) break;
        const { you, them } = e.totals;
        const vars = { mine: number(them), yours: number(you) };
        if (you === them) {
          remark("them", "score-tie", { n: number(you) });
          remark("you", "score-reply-tie");
        } else {
          remark("them", them > you ? "score-mine" : "score-yours", vars);
          remark("you", you > them ? "score-reply-ahead" : "score-reply-behind");
        }
        const target = state.target ?? 21;
        const near = you >= them ? "you" : "them";
        const need = target - e.totals[near];
        if (need <= NEAR && need > 0) remark(near, "need", { need: number(need) });
        break;
      }
      case "game_ends": {
        const winner = e.you_won ? "you" : "them";
        say(winner, "game-won");
        remark(other(winner), "good-game");
        remark(winner, "rematch");
        remark(other(winner), "rematch-reply");
        // Your opponent, revealed a court card all along, has the last
        // word when it wins (play-testing).
        if (winner === "them") say("them", "quite-normal");
        break;
      }
      default:
        break;
    }
  });
  return out;
}

// What a move says: the build's call and its answer; a capture's claim, in
// its own words, and what the other player feels of it; a trail named; what
// you left pointed out; and now and then your opponent thinking aloud first.
function played(e, at, who, did, events, since, remark, say) {
  const them = other(who);
  const card = e.card ?? {};
  // Your opponent thinks aloud as your move is seen, before theirs: now and
  // then, and only about a move in this batch.
  if (!e.you && at % 3 === 0 && at - 1 >= since) {
    remark("them", e.type === "take" ? "think-take" : "think", null, { at: at - 1 });
  }
  if (e.type === "build") {
    say(who, call(e));
    const value = number(e.value);
    if (did.raised && did.raised.who !== who) remark(them, "raised-mine", { old: number(did.raised.value), value });
    else remark(them, "build-reply", { value, ...takers(e.value) });
  }
  if (e.type === "trail") {
    if (card.card === "2S") remark(who, "trail-little-casino");
    else if (card.card === "TD") remark(who, "trail-big-casino");
    else if (card.rank === 1) remark(who, "trail-ace");
    else if (card.rank) remark(who, "trail", named(card.rank));
  }
  if (e.type === "take") {
    const then = following(events, at);
    const stolen = (did.took ?? []).find((b) => b.who !== who);
    const own = (did.took ?? []).find((b) => b.who === who);
    // Every card the capture brings in, the card played among them.
    const taken = [card, ...(e.taken ?? [])].map((c) => c.card).filter(Boolean);
    const loud = then.has("swept") || then.has("cash");
    if (!loud) {
      if (stolen) remark(who, "take-theirs", { value: number(stolen.value), ...takers(stolen.value) });
      else if (own) remark(who, "take-own", { value: number(own.value) });
      else {
        const big = taking(e, then);
        if (big) remark(who, big);
        else if ((e.groups ?? []).every((g) => g.length === 1 && g[0].rank === card.rank)) remark(who, "take-pair", named(card.rank));
        else remark(who, "take-sum", { value: number(e.value ?? card.rank) });
      }
    }
    // What the other player feels: a build lost, a Casino or an ace gone,
    // a haul (a sweep is felt as it is claimed).
    if (stolen) remark(them, "lost-build", { value: number(stolen.value) });
    else if (!loud && taken.includes("TD")) remark(them, "big-casino-gone");
    else if (!loud && taken.includes("2S")) remark(them, "little-casino-gone");
    else if (!loud && taken.some((c) => c[0] === "A")) remark(them, "ace-gone");
    else if (!loud && (e.taken?.length ?? 0) >= HAUL) remark(them, "haul-reply");
  }
  // What you left, pointed out (the Dominican dejado): always when it
  // holds a point card or more than one card, otherwise now and then.
  if (e.you && e.left?.length) {
    const worth = e.left.length > 1 || e.left.some((c) => POINT_CARDS.has(c.card));
    if (worth || at % 2 === 0) remark("them", e.left.length > 1 ? "left-more" : `left-${e.left[0].rank}`);
  }
}

// The count's pace, from what is to be said (lines with their words, as the
// dialogue's `words` gives them) and the dialogue's `plan`: `lead`, the
// time taken by what is said at the count's moment before the chant (a tie
// on the cards); `gaps[i]`, from line i of the chant to the next, or to its
// end for the last. The choreography turns each counted card up, and the
// sheet is written, as its line is said. Null with no count among them.
export function countPace(lines, plan) {
  const first = lines.findIndex((l) => l.line !== undefined);
  if (first < 0) return null;
  const from = lines.findIndex((l) => l.at === lines[first].at);
  const said = plan(lines.slice(from).map((l) => ({ ...l, delay: 0 })));
  const chant = said.filter((l) => l.line !== undefined);
  return {
    lead: chant[0].ms - said[0].ms,
    gaps: chant.map((l, i) => (i + 1 < chant.length ? chant[i + 1].ms - l.ms : l.end - l.ms)),
  };
}

// Lines one speaker says at one moment, said as one (play-testing: waiting
// through your opponent's lines one by one is time spent for nothing): the
// first's phrase and moment, the words joined. The count's lines keep their
// own moments, each with its card.
export function chunk(lines) {
  const out = [];
  for (const l of lines) {
    const last = out.at(-1);
    if (last && last.who === l.who && last.delay === l.delay && last.line === undefined && l.line === undefined) {
      out[out.length - 1] = { ...last, words: `${last.words} ${l.words}`, chatter: !!(last.chatter && l.chatter) };
    } else out.push(l);
  }
  return out;
}

// The table talk at a level (a setting): "none"; "calls", what carries the
// game -- the house rules, the build calls, "Last.", a sweep, cash, the
// count, the game won; or "all", the chatter too: every move remarked, the
// builds answered, the score said aloud, the game proposed and the rematch.
export function heard(lines, level) {
  if (level === "none") return [];
  if (level === "calls") return lines.filter((l) => !l.chatter);
  return lines;
}
