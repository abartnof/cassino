// Choosing a move (docs/TABLE3D.md section 8): the hand card chosen, the
// table cards picked, and the chips that offer what the selection makes.
//
// Pure, so it is node-tested. The engine decides everything (the offer, from
// cassino_offer); this only keeps what the person has tapped, and puts the
// engine's answer in the order the chips show it. The interface never guesses
// between capturing and building: the person taps the chip.

export const EMPTY = Object.freeze({ chosen: null, picked: Object.freeze([]) });

// A hand card tapped: chosen, or let go if it was. Choosing another card
// starts the table afresh.
export function choose(sel, code) {
  if (sel.chosen === code) return EMPTY;
  return { chosen: code, picked: [] };
}

// A table item tapped, all its cards (a build comes whole): picked, or let go
// if it was. Nothing is picked before a hand card is chosen.
export function pick(sel, cards) {
  if (!sel.chosen) return sel;
  const had = cards.every((c) => sel.picked.includes(c));
  const picked = had ? sel.picked.filter((c) => !cards.includes(c)) : [...sel.picked, ...cards.filter((c) => !sel.picked.includes(c))];
  return { chosen: sel.chosen, picked };
}

// The selection as the offer query takes it: the hand card, then the table
// cards.
export function selectionText(sel) {
  return sel.chosen ? [sel.chosen, ...sel.picked].join(" ") : "";
}

const ORDER = { take: 0, build: 1, trail: 2 };

// The offer's moves as chips: captures first, then builds by value, then the
// trail. An ace that captures as 1 or 14 makes two Take chips, which say so.
export function chipsOf(offer) {
  const moves = offer?.moves ?? [];
  const takes = moves.filter((m) => m.chip.kind === "take").length;
  return moves
    .map((m) => ({
      label: m.chip.kind === "take" && takes > 1 && m.chip.value != null ? `Take as ${m.chip.value}` : m.chip.label,
      move: m.move,
      kind: m.chip.kind,
      value: m.chip.value ?? null,
      said: m.said ?? null,
      call: m.call ?? null,
      leaves: m.leaves_sweep ?? null,
    }))
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || (a.value ?? 0) - (b.value ?? 0));
}

// The move bar (play-testing: the buttons always there, lighting up and
// dimming, so nothing is hunted for after each choice): Take, Build and
// Trail in their places, each lit with its move when the choice makes one,
// as many of a kind as it makes (Build 6, Build 3s), and dimmed under its
// plain name when it makes none. `chips` as chipsOf gives them.
const KINDS = [
  ["take", "Take"],
  ["build", "Build"],
  ["trail", "Trail"],
];
export function moveBar(chips) {
  return KINDS.flatMap(([kind, name]) => {
    const mine = chips.filter((c) => c.kind === kind);
    return mine.length ? mine.map((c) => ({ ...c, kind, enabled: true })) : [{ kind, label: name, enabled: false }];
  });
}

// Where the move bar sits on a desktop, and how tall (play-testing: fill
// the space between the hand and the table with larger buttons): centred
// in the space between the table's near edge (`near`, px) and the top of
// your hand less the rise of a card chosen from it (`top`, `lift`), as tall
// as that less a margin each side, between 40 and 84 px.
export function moveBarFit({ near, top, lift }) {
  const room = top - lift - near;
  return { y: near + room / 2, h: Math.max(40, Math.min(84, room - 14)) };
}

// The cards of the table item a card belongs to (a build's all of them).
function itemCards(code, table) {
  const item = (table ?? []).find((i) => i.cards.some((c) => c.card === code));
  return item ? item.cards.map((c) => c.card) : [code];
}

// The engine's reason a table item cannot join, if it cannot: `why_not`
// names each item by one card (a build by its lowest), so any card of the
// item finds it (the table review's T5).
function refusal(code, offer, table) {
  const cards = itemCards(code, table);
  return (offer?.why_not ?? []).find((w) => cards.includes(w.card.card)) ?? null;
}

// How a table card is drawn while choosing: picked, could be added, cannot
// join (tap it to hear why), or idle. `table`: the state's, so a build is
// judged whole.
export function itemState(code, offer, sel, table = []) {
  if (sel.picked.includes(code)) return "picked";
  if (!offer) return "idle";
  if ((offer.can_add ?? []).some((c) => c.card === code)) return "addable";
  if (refusal(code, offer, table)) return "refused";
  return "idle";
}

// Why a table card cannot join, in the engine's words, if it cannot.
export function whyNot(code, offer, table = []) {
  return refusal(code, offer, table)?.reason ?? null;
}

// The selection that makes a move, from its command text (the hint's move,
// shown by choosing it): the card played, then the table cards it uses, a
// build named by one of its cards picked whole.
export function selectionOf(move, table) {
  const words = move.split(/\s+/);
  const itemOf = (code) => table.find((item) => item.cards.some((c) => c.card === code));
  const whole = (codes) => {
    const out = [];
    for (const code of codes) {
      const item = itemOf(code);
      for (const c of item ? item.cards.map((x) => x.card) : [code]) if (!out.includes(c)) out.push(c);
    }
    return out;
  };
  const card = (w) => w.split("=")[0];
  if (words[0] === "trail") return { chosen: card(words[1]), picked: [] };
  if (words[0] === "take") return { chosen: card(words[1]), picked: whole(words.slice(2)) };
  return { chosen: card(words[2]), picked: whole(words.slice(3).filter((w) => w !== "on")) };
}

// Capture values as they are said: "an 8", "an ace", "a 9 or a 7".
// A court card's value is said by its name (the second review, S10: a lone
// court on a Classic table is swept by its rank).
export function valuesSaid(values) {
  const named = { 1: "an ace", 14: "an ace", 11: "a jack", 12: "a queen", 13: "a king" };
  const said = values.map((v) => named[v] ?? (v === 8 ? "an 8" : `a ${v}`));
  return [...new Set(said)].join(" or ");
}

// The sweep warning before a move (DESIGN.md §12.3): the first chip whose
// move would leave your opponent a table to sweep, what would clear it, and
// how many such cards you have not seen; or null.
export function sweepWarning(chips) {
  const c = chips.find((x) => x.leaves);
  if (!c) return null;
  const unseen = c.leaves.unseen === 1 ? "1 you have not seen" : `${c.leaves.unseen} you have not seen`;
  return `${c.label} leaves a sweep: ${valuesSaid(c.leaves.values)} would clear the table, and ${unseen}.`;
}
