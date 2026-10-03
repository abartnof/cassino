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
    }))
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || (a.value ?? 0) - (b.value ?? 0));
}

// How a table card is drawn while choosing: picked, could be added, cannot
// join (tap it to hear why), or idle.
export function itemState(code, offer, sel) {
  if (sel.picked.includes(code)) return "picked";
  if (!offer) return "idle";
  if ((offer.can_add ?? []).some((c) => c.card === code)) return "addable";
  if ((offer.why_not ?? []).some((w) => w.card.card === code)) return "refused";
  return "idle";
}

// Why a table card cannot join, in the engine's words, if it cannot.
export function whyNot(code, offer) {
  return (offer?.why_not ?? []).find((w) => w.card.card === code)?.reason ?? null;
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
