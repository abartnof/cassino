// The replay after the game, with both hands face up ("fairness you can
// check", DESIGN.md §12.3): the saved record in steps (the engine restores
// any prefix of it, so each step is a true position), and your opponent's
// hand at each, from what the engine reveals once the game is over.

const HEADER = /^(cassino record|seed|rules|skill|aids)\b/;

function split(saved) {
  const lines = saved.split("\n").filter((l) => l.trim() !== "");
  const header = [];
  let i = 0;
  while (i < lines.length && HEADER.test(lines[i])) header.push(lines[i++]);
  return { header, commands: lines.slice(i) };
}

// The record as the replay plays it: forced moves off in its header, and
// every forced move (*) made as the ordinary move it was. The header holds
// the aids as they stood at the game's end, so a record whose forced moves
// were turned on or off during the game would otherwise be replayed
// differently forward and back (the table's second review, S2).
const unforced = (c) => (c.startsWith("*") ? c.slice(1) : c);
function normal(header) {
  return header.map((l) => (l.startsWith("aids") ? l.replace(/play_forced=\d/, "play_forced=0") : l));
}

// How many steps the record has: one a command.
export function steps(saved) {
  return split(saved).commands.length;
}

// The record of the first `k` steps, to restore.
export function prefix(saved, k) {
  const { header, commands } = split(saved);
  return [...normal(header), ...commands.slice(0, k).map(unforced)].join("\n") + "\n";
}

// Your opponent's cards at a state: what they were dealt in this hand so far
// less what they have played, from `revealed` (engine.reveal()).
export function theirHand(state, revealed) {
  const hand = revealed?.hands?.[state.hand_number - 1];
  if (!hand) return [];
  // The deals so far, from the events (a state between, too, has those).
  const deals = state.events.filter((e) => e.kind === "dealt" && e.hand === state.hand_number).length;
  const dealt = hand.deals.slice(0, deals).flatMap((d) => d.them.map((c) => c.card));
  const played = new Set(state.events.filter((e) => e.kind === "played" && e.hand === state.hand_number && e.you === false).map((e) => e.card.card));
  // In order, low to high, as your own hand is held.
  const order = (c) => "A23456789TJQK".indexOf(c[0]) * 4 + "SHDC".indexOf(c[1]);
  return dealt.filter((c) => !played.has(c)).sort((a, b) => order(a) - order(b));
}

// Where the replay stops: after each of your decisions and whatever the
// table then did for you (a forced move, marked *), as prefix lengths of the
// record's commands, from 0 (the deal) to the end.
export function stops(saved) {
  const { commands } = split(saved);
  const out = [0];
  for (let i = 0; i < commands.length; i++) {
    if (commands[i].startsWith("*")) continue;
    let j = i + 1;
    while (j < commands.length && commands[j].startsWith("*")) j++;
    out.push(j);
  }
  return out;
}

// The commands to send to go from one stop to the next: your decision, and
// the forced moves after it as ordinary moves (the replay's sitting has
// forced moves off: see `prefix`).
export function commandsBetween(saved, from, to) {
  return split(saved).commands.slice(from, to).map(unforced);
}
