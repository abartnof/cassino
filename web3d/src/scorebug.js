// The count and the trackers (docs/TABLE3D.md section 8): pure functions of
// the protocol's state, so the page only draws what these say. (The score
// itself is the HUD's, hud.js.)
//
// Cassino scores only at the end of a hand, in the count; during the hand
// the news is in the captures, which the trackers follow: cards towards 27,
// spades towards 7, the aces, the two Cassinos and the sweeps (DESIGN.md
// §12.3).

const SUIT_NAME = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" };

// The card a line of the count names, if it names one: an ace, or a Cassino.
export function lineCard(line) {
  if (line.item === "ace") return `A${line.suit}`;
  if (line.item === "big_casino") return "TD";
  if (line.item === "little_casino") return "2S";
  return null;
}

// A line of the count in words, as it is said at the table.
export function lineLabel(line) {
  switch (line.item) {
    case "cards":
      return "Most cards";
    case "spades":
      return "Most spades";
    case "big_casino":
      return "Big Cassino, 10♦";
    case "little_casino":
      return "Little Cassino, 2♠";
    case "ace":
      return `Ace of ${SUIT_NAME[line.suit]}`;
    case "sweeps":
      return line.points === 1 ? "A sweep" : `${line.points} sweeps`;
    default:
      return line.item;
  }
}

// A line of the count celebrated on the table, as the score's popup is on
// the HUD: its words on a disc over the card it names (an ace, a Cassino,
// turned up in the count row) or over its taker's pile (most cards, most
// spades), with its points bursting out. A sweep is celebrated as it is
// made, so not again here.
const CELEBRATED = { cards: "Most cards", spades: "Most spades", big_casino: "Big Cassino", little_casino: "Little Cassino", ace: "Ace" };
export function celebrationOf(line) {
  const label = CELEBRATED[line.item];
  if (!label) return null;
  return { label, pts: line.points, card: lineCard(line), pile: line.who };
}

// The count of the hand under way, once it is over: its `scored` event.
export function countOf(state) {
  return [...(state.events ?? [])].reverse().find((e) => e.kind === "scored" && e.hand === state.hand_number) ?? null;
}

// The count's lines, in Foster's order, each with its words and its card.
export function countLines(scored) {
  return (scored?.count.lines ?? []).map((line) => ({ ...line, label: lineLabel(line), code: lineCard(line) }));
}

// What each player has captured this hand, item by item, for the trackers:
// `n` of `of` where there is a goal (27 cards, 7 spades: past it, the point
// is clinched), `have` for a single card, and `lost` once the other player
// has clinched it.
export function trackers(state) {
  const clinched = { you: new Set(), them: new Set() };
  for (const e of state.events ?? []) {
    if (e.kind === "clinched" && e.hand === state.hand_number) clinched[e.you ? "you" : "them"].add(e.what);
  }
  const out = {};
  for (const [who, other] of [
    ["you", "them"],
    ["them", "you"],
  ]) {
    const p = state.piles[who];
    out[who] = [
      { key: "cards", label: "Cards", n: p.cards, of: 27, done: clinched[who].has("cards"), lost: clinched[other].has("cards") },
      { key: "spades", label: "Spades", n: p.spades, of: 7, done: clinched[who].has("spades"), lost: clinched[other].has("spades") },
      { key: "aces", label: "Aces", n: p.aces, of: 4 },
      { key: "big_casino", label: "10♦", have: p.big_casino },
      { key: "little_casino", label: "2♠", have: p.little_casino },
      ...(state.rules?.sweeps === false ? [] : [{ key: "sweeps", label: "Sweeps", n: p.sweeps }]),
    ];
  }
  return out;
}

// The trackers as a table (the aids' panel): a column for each point, with
// its header and a tip saying what it counts and what it scores; a row for
// each player; in each cell only the value (a dash for nothing taken), its
// look ("won": the point is theirs for certain; otherwise "", every cell
// alike), and a tip in words. `watching`: the seats are South and North.
// Each header's tip says first what its point is worth (play-testing:
// "Getting X (aka Big Cassino) is worth n points"), then how it is won.
const COLUMNS = {
  cards: { head: "Cards", tip: "Taking the most cards is worth 3 points. 27 of the 52 makes it certain." },
  spades: { head: "Spades", tip: "Taking the most spades is worth 1 point. 7 of the 13 makes it certain." },
  aces: { head: "Aces", tip: "Each ace you take is worth 1 point." },
  big_casino: { head: "10♦", tip: "Taking the ten of diamonds (Big Cassino) is worth 2 points." },
  little_casino: { head: "2♠", tip: "Taking the two of spades (Little Cassino) is worth 1 point." },
  sweeps: { head: "Sweeps", tip: "Each sweep, taking every card on the table, is worth 1 point." },
};
const GOAL = { cards: { of: 27, word: "cards", point: "most cards" }, spades: { of: 7, word: "spades", point: "most spades" } };

export function trackerTable(t, { watching = false } = {}) {
  const seats = watching
    ? { you: { name: "South", who: "South", has: "has", own: "South's" }, them: { name: "North", who: "North", has: "has", own: "North's" } }
    : { you: { name: "You", who: "You", has: "have", own: "yours" }, them: { name: "Opp", who: "Your opponent", has: "has", own: "your opponent's" } };
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  const columns = t.you.map((x) => ({ key: x.key, ...COLUMNS[x.key] }));
  // North above South: your opponent sits across the table, above you.
  const rows = ["them", "you"].map((who) => {
    const other = who === "you" ? "them" : "you";
    const me = seats[who];
    const cells = t[who].map((x) => {
      if (x.have !== undefined) {
        const theirs = t[other].find((y) => y.key === x.key).have;
        const name = x.key === "big_casino" ? "Big Cassino" : "Little Cassino";
        const tip = x.have ? `${me.who} took ${name}.` : theirs ? `${seats[other].who} took ${name}.` : `${name} is not taken yet.`;
        return { key: x.key, text: x.have ? "✓" : "–", look: x.have ? "won" : "", tip };
      }
      let tip;
      const goal = GOAL[x.key];
      if (goal) {
        const taken = `${me.who} ${me.has} taken ${plural(x.n, goal.word.slice(0, -1), goal.word)}`;
        tip = x.done
          ? `${taken}: ${goal.point} is ${me.own}.`
          : x.lost
            ? `${taken}; ${goal.point} is ${seats[other].own}.`
            : `${taken}; ${goal.of - x.n} more ${goal.of - x.n === 1 ? "makes" : "make"} ${goal.point} certain.`;
      } else if (x.key === "aces") tip = `${me.who} ${me.has} taken ${plural(x.n, "ace")}: ${plural(x.n, "point")}.`;
      else tip = `${me.who} ${me.has} made ${plural(x.n, "sweep")}: ${plural(x.n, "point")}.`;
      return { key: x.key, text: x.n ? String(x.n) : "–", look: x.done ? "won" : "", tip };
    });
    return { who, name: me.name, tip: watching ? `${me.own} captures this hand` : who === "you" ? "Your captures this hand" : "Your opponent's captures this hand", cells };
  });
  return { columns, rows };
}
