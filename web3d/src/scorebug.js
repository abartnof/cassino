// The score, the trackers and the count (docs/TABLE3D.md section 8): pure
// functions of the protocol's state, so the page only draws what these say.
//
// Cassino scores only at the end of a hand, in the count; during the hand
// the news is in the captures, which the trackers follow: cards towards 27,
// spades towards 7, the aces, the two Casinos and the sweeps (DESIGN.md
// §12.3). The idea of a broadcast's score, two numbers that tick, is
// piquet's (scorebug.js @ 254cb3c); the rest is cassino's own.

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

// The count of the hand under way, once it is over: its `scored` event.
export function countOf(state) {
  return (state.events ?? []).findLast((e) => e.kind === "scored" && e.hand === state.hand_number) ?? null;
}

// The count's lines, in Foster's order, each with its words and its card.
export function countLines(scored) {
  return (scored?.count.lines ?? []).map((line) => ({ ...line, label: lineLabel(line), code: lineCard(line) }));
}

// Where the game stands: the totals before this hand's count (`before`) and
// after it (`after`; the same, until the hand is over), the target, the
// hand and the deal.
export function standing(state) {
  const ends = (state.events ?? []).findLast((e) => e.kind === "hand_ends" && e.hand === state.hand_number);
  const after = { you: state.scores.you, them: state.scores.them };
  const before = ends ? { you: ends.totals.you - ends.yours, them: ends.totals.them - ends.theirs } : { ...after };
  return { before, after, target: state.target, hand: state.hand_number, deal: state.deal };
}

// The totals once the first `k` lines of the count have been said.
export function scoreAfter(before, lines, k) {
  const score = { ...before };
  for (const line of lines.slice(0, k)) score[line.who] += line.points;
  return score;
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
      { key: "sweeps", label: "Sweeps", n: p.sweeps },
    ];
  }
  return out;
}

// The score sheet: a row for each hand finished, with the game's totals.
export function history(events) {
  return (events ?? [])
    .filter((e) => e.kind === "hand_ends")
    .map((e) => ({ hand: e.hand, you: e.yours, them: e.theirs, totals: { ...e.totals } }));
}

// The period, as a broadcast puts its quarter: the hand, and the deal of six.
export function period(state) {
  if (!state.deal) return `Hand ${state.hand_number}`;
  return `Hand ${state.hand_number} · Deal ${state.deal} of 6`;
}
