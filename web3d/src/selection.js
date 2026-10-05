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
// dimming, so nothing is hunted for after each choice; and then "have all
// possible buttons up, so the user doesn't have to constantly wonder if the
// buttons are in the right place"): Take, Build and Trail, each in a place
// of its own that is always there at the same width, so nothing moves as a
// choice is made (the running sum's place before them went in the seventh
// play-testing). A place is lit with its moves when the choice makes any,
// as many as it makes sharing it (Build 6, Build 3s), and dimmed under its
// plain name when it makes none. `chips` as chipsOf gives them; each move's
// `short` words say only what tells it from the others of its kind (6, 3s),
// for a place too narrow for the whole.
//
// The places' order, left to right, is the moves' from least made to most
// (the user: "The most common action button should be on the far right,
// and the least common action button should be on the left, to make the UX
// good for someone's thumb"): over 300 games of each variant, a trail is
// half the moves made, a capture about two in five, a build one in ten
// (web3d/tools/moves.mjs; measurements/README.md). `leftHanded`: the other
// way round, the move made most under a left thumb (a setting).
export const BAR_ORDER = Object.freeze(["build", "take", "trail"]);
const NAMES = { take: "Take", build: "Build", trail: "Trail" };
export function moveBar(chips, { leftHanded = false } = {}) {
  const kinds = leftHanded ? [...BAR_ORDER].reverse() : BAR_ORDER;
  return kinds.map((kind) => {
    const name = NAMES[kind];
    const mine = chips.filter((c) => c.kind === kind);
    const short = (label) => label.replace(new RegExp(`^${name} `), "") || label;
    const buttons = mine.length ? mine.map((c) => ({ ...c, kind, short: short(c.label), enabled: true })) : [{ kind, label: name, short: name, enabled: false }];
    return { kind, name, buttons };
  });
}

// Each move's place's width, in heights of the bar; the padding inside a
// button, alone in its place or sharing it;
// the size of its words, at most; and `slack` px to spare beside them (a
// browser draws words a little wider than a canvas measures them, and cuts
// short with an ellipsis what does not fit).
export const BAR = Object.freeze({ place: 2.9, pad: 0.3, split: 0.12, label: 0.38, slack: 4 });

// How the bar's width goes with its height, for moveBarFit's `across`: the
// places' widths, and the two gaps between the three places, `room` px to
// fit in.
export function barAcross(room, gap) {
  return { room, perH: 3 * BAR.place, fixed: 2 * gap };
}

// The words on a place's buttons, `width` px wide all told, `gap` px apart,
// on a bar `h` px high: as large as the bar's words where they fit inside
// the padding, smaller where they do not -- all of a place's the same size
// -- and, where that would be smaller than `least` px, the short words
// instead. `measure(text, px)`: the words' width at that size.
export function fitLabels(buttons, { width, h, gap, measure, least = 13 }) {
  const n = buttons.length;
  const room = (width - gap * (n - 1)) / n - 2 * h * (n > 1 ? BAR.split : BAR.pad) - BAR.slack;
  const size = h * BAR.label;
  const fit = (key) => Math.min(size, ...buttons.map((b) => (size * room) / measure(b[key], size)));
  const full = fit("label");
  const [key, px] = full >= Math.min(least, size) ? ["label", full] : ["short", fit("short")];
  return buttons.map((b) => ({ text: b[key], px }));
}

// Where the move bar sits on a desktop or a phone held upright, and how
// tall (play-testing: fill the space between the hand and the table with
// larger buttons): centred in the space between the table's near edge
// (`near`, px) and the top of your hand less the rise of a card chosen from
// it (`top`, `lift`), as tall as that less a margin each side, between 40
// and 84 px. And, on a phone, no taller than lets it fit `across`: `room`
// px wide, its width `perH` px for each px of its height past `fixed` px of
// gaps -- down to 32 px.
export function moveBarFit({ near, top, lift, across = null }) {
  const room = top - lift - near;
  const h = Math.max(40, Math.min(84, room - 14));
  const widest = across ? Math.max(32, (across.room - across.fixed) / across.perH) : Infinity;
  return { y: near + room / 2, h: Math.min(h, widest) };
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

// The move bar under the cards (the user: "put the action buttons ... on a
// layer lower than the cards so that they do not occlude the cards"). The
// bar is drawn over the table, so each card that crosses it on the screen
// is cut out of it, by clip paths, which are drawn at once (a mask image,
// decoded afresh each frame, made the buttons flicker: the user, "when a
// card passes over the action buttons, the action buttons flicker").
// `polys`: each card's outline on the screen; `bar`: its box ({ left, top,
// width, height }). The cards that cross it:
export function barHoles(bar, polys) {
  const right = bar.left + bar.width;
  const bottom = bar.top + bar.height;
  return polys.filter((poly) => {
    const b = boxOf(poly);
    return b.right > bar.left && b.left < right && b.bottom > bar.top && b.top < bottom;
  });
}
function boxOf(poly) {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}
// The holes shared among `levels` nested elements, each cutting its own
// out (their cuts add up): one path cuts overlapping cards out only by
// halves, so cards whose boxes overlap go to different elements, as far
// as there are elements; past that, to the last.
export function holeGroups(holes, levels) {
  const groups = [];
  const meets = (a, b) => a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  for (const hole of holes) {
    const box = boxOf(hole);
    let k = groups.findIndex((g) => g.every((h) => !meets(boxOf(h), box)));
    if (k < 0) k = groups.length < levels ? groups.length : levels - 1;
    (groups[k] ??= []).push(hole);
  }
  return groups;
}
// An element's clip path with these holes cut out of it: its box (`box`,
// on the screen), with room round it for what is drawn just outside (the
// buttons' outlines), less each hole, in its own place; "" with none.
export function clipPathFor(box, holes, pad = 24) {
  if (!holes.length) return "";
  const at = (n) => Math.round(n * 10) / 10;
  const outer = `M${-pad} ${-pad}H${at(box.width + pad)}V${at(box.height + pad)}H${-pad}Z`;
  const cuts = holes.map((poly) => `M${poly.map((p) => `${at(p.x - box.left)} ${at(p.y - box.top)}`).join("L")}Z`);
  return `path(evenodd, "${[outer, ...cuts].join(" ")}")`;
}

// Whether a point lies in a polygon (its corners in order).
export function pointIn(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
