// The count and the trackers (docs/TABLE3D.md section 8): pure functions of
// the protocol's state, so the page only draws what these say. (The score
// itself is the HUD's, hud.js.)
//
// Cassino scores only at the end of a hand, in the count; during the hand
// the news is in the captures, which the trackers follow: cards towards 27,
// spades towards 7, the aces, the two Casinos and the sweeps (DESIGN.md
// §12.3).

const SUIT_NAME = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" };

// The card a line of the count names, if it names one: an ace, or a Casino.
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
      return "Big Casino, 10♦";
    case "little_casino":
      return "Little Casino, 2♠";
    case "ace":
      return `Ace of ${SUIT_NAME[line.suit]}`;
    case "sweeps":
      return line.points === 1 ? "A sweep" : `${line.points} sweeps`;
    default:
      return line.item;
  }
}

// A line of the count celebrated on the table, as the score's popup is on
// the HUD: its words on a disc over the card it names (an ace, a Casino,
// turned up in the count row) or over its taker's pile (most cards, most
// spades), with its points bursting out. A sweep is celebrated as it is
// made, so not again here.
const CELEBRATED = { cards: "Most cards", spades: "Most spades", big_casino: "Big Casino", little_casino: "Little Casino", ace: "Ace" };
export function celebrationOf(line) {
  const label = CELEBRATED[line.item];
  if (!label) return null;
  return { label, pts: line.points, card: lineCard(line), pile: line.who };
}

// The count of the hand under way, once it is over: its `scored` event.
export function countOf(state) {
  return (state.events ?? []).findLast((e) => e.kind === "scored" && e.hand === state.hand_number) ?? null;
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
// each player; in each cell only the value, its look ("won": the point is
// theirs for certain; "lost": it is the other player's; "none": nothing
// yet), and a tip in words. `watching`: the seats are South and North.
const COLUMNS = {
  cards: { head: "Cards", tip: "Cards taken this hand. Most cards scores 3 points; 27 of the 52 makes it certain." },
  spades: { head: "Spades", tip: "Spades taken this hand. Most spades scores 1 point; 7 of the 13 makes it certain." },
  aces: { head: "Aces", tip: "Aces taken this hand: a point each." },
  big_casino: { head: "10♦", tip: "Big Casino, the ten of diamonds: 2 points to whoever takes it." },
  little_casino: { head: "2♠", tip: "Little Casino, the two of spades: 1 point to whoever takes it." },
  sweeps: { head: "Sweeps", tip: "Sweeps made this hand, each clearing the table: a point each." },
};
const GOAL = { cards: { of: 27, word: "cards", point: "most cards" }, spades: { of: 7, word: "spades", point: "most spades" } };

export function trackerTable(t, { watching = false } = {}) {
  const seats = watching
    ? { you: { name: "South", who: "South", has: "has", own: "South's" }, them: { name: "North", who: "North", has: "has", own: "North's" } }
    : { you: { name: "You", who: "You", has: "have", own: "yours" }, them: { name: "Opp", who: "Your opponent", has: "has", own: "your opponent's" } };
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  const columns = t.you.map((x) => ({ key: x.key, ...COLUMNS[x.key] }));
  const rows = ["you", "them"].map((who) => {
    const other = who === "you" ? "them" : "you";
    const me = seats[who];
    const cells = t[who].map((x) => {
      if (x.have !== undefined) {
        const theirs = t[other].find((y) => y.key === x.key).have;
        const name = x.key === "big_casino" ? "Big Casino" : "Little Casino";
        const tip = x.have ? `${me.who} took ${name}.` : theirs ? `${seats[other].who} took ${name}.` : `${name} is not taken yet.`;
        return { key: x.key, text: x.have ? "✓" : "–", look: x.have ? "won" : theirs ? "lost" : "none", tip };
      }
      const look = x.done ? "won" : x.lost ? "lost" : x.n ? "" : "none";
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
      return { key: x.key, text: String(x.n), look, tip };
    });
    return { who, name: me.name, tip: watching ? `${me.own} captures this hand` : who === "you" ? "Your captures this hand" : "Your opponent's captures this hand", cells };
  });
  return { columns, rows };
}
