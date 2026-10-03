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

// How many steps the record has: one a command.
export function steps(saved) {
  return split(saved).commands.length;
}

// The record of the first `k` steps, to restore.
export function prefix(saved, k) {
  const { header, commands } = split(saved);
  return [...header, ...commands.slice(0, k)].join("\n") + "\n";
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

// The commands to send to go from one stop to the next: your decision (the
// engine makes the forced moves after it itself, as it did in the game).
export function commandsBetween(saved, from, to) {
  return split(saved).commands.slice(from, to).filter((c) => !c.startsWith("*"));
}
