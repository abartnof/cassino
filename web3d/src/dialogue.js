// From piquet web3d/src/dialogue.js @ 254cb3c, with cassino's `skip`.
// The dialogue at the table: the phrases speech.js asks for, each given its
// words and its moment, for the declarations' dialogue boxes. The words are
// the phrase bank's (web3d/tools/phrases.py, docs/PHRASES.md), bundled into
// the page by web3d/build.py.
//
// Everything is said in several ways, and each is picked without repeating
// the last (bag.js). Each line waits for its moment -- the animation's beat
// for the event it belongs to -- and for the line before it to have been
// said, so a box never appears before its turn.
//
// createDialogue(bank, clock) -> { say(lines, onLine), words(lines), plan(lines), estimate(lines), stop() }
//   bank:   { groups: { id: [key] }, texts: { key: words } }
//   clock:  ms now -- the table's clock, which stops while the table is held
//           still, so time held is not counted as time passed
//   lines:  [{ who: "you"|"them", phrase, delay, at, chatter, vars }] from
//           speech(): phrase is a group id; delay the ms from now until its
//           moment (0 if absent); at, the event it belongs to; chatter, a
//           remark that yields to the calls (below); vars, the words its
//           text's {slots} are filled with ("{Lead}" capitalised).
//           Or { pause: true, delay }: the moment between the declarations'
//           rounds (breaks.js), which comes once the line before it has been
//           said, and before which nothing after it comes.
//   onLine: (line, words, ms) for each line, ms from now until it is said
//           (words null for a pause)

import { createBags } from "./bag.js";

export const GAP = 90; // ms between one speaker's lines
export const TURN = 280; // ms when the other speaks
// How long a line takes to say: about as long as a person takes.
export const saying = (words) => 250 + 65 * (words || "").length;
// Cassino's chatter (play-testing: the talk "VERY verbose"): a remark is said
// in a gap, and is not said at all if it would make a call of a later moment
// (a build called, "Clear!", the count) more than SLACK late, or if it would
// come more than LATE after its own moment, when it would seem to be about
// something else.
export const SLACK = 250;
export const LATE = 2000;

// A text with its {slots} filled from `vars`; a capitalised slot is filled
// capitalised.
function fill(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (slot, key) => {
    const value = String(vars[key.toLowerCase()] ?? slot);
    return key[0] === key[0].toUpperCase() ? value[0].toUpperCase() + value.slice(1) : value;
  });
}

// Where a box beside its speaker goes (`anchor.side`): your words beside
// your hand on a desktop, and your opponent's beside the court card at the
// game's end (play-testing: "to the side of the opponent, with the dialogue
// box tail pointing at the card"). To the speaker's right, at `anchor.x`,
// wrapping to the room there; failing that, to its left, ending at
// `anchor.left`, its tail pointing right; failing both, kept on the screen
// at the right. A box is never squeezed narrower than BESIDE_MIN pixels, or
// its words' own width if less.
export const BESIDE_MIN = 140;
export function besideAt(anchor, width, viewWidth, margin = 8) {
  const fits = (room) => room >= Math.min(width, BESIDE_MIN);
  const right = viewWidth - margin - anchor.x;
  if (fits(right)) return { side: "right", at: anchor.x, room: right };
  if (anchor.left !== undefined && fits(anchor.left - margin)) return { side: "left", at: anchor.left, room: anchor.left - margin };
  return { side: "right", at: viewWidth - margin - width, room: null };
}

export function createDialogue(bank, clock = () => performance.now()) {
  const pick = createBags();
  let next = 0; // when the last line said will have ended, on the clock
  let last = null; // who said it
  const chosen = (line) => (line.pause ? null : line.words ?? fill(bank.texts?.[pick(line.phrase, bank.groups?.[line.phrase])] ?? "", line.vars));
  // The words a line is most often said in, for a line not yet given its own.
  const usual = (line) => (line.pause ? null : line.words ?? fill(bank.texts?.[bank.groups?.[line.phrase]?.[0]] ?? "", line.vars));

  // Each line's moment and its end, in ms from now: after the line before it
  // has been said, and not before its own moment; chatter with no room
  // left out. Says nothing.
  function schedule(lines, words) {
    const now = clock();
    let t = next;
    let who = last;
    const out = [];
    lines.forEach((line, i) => {
      const said = words(line);
      const gap = who === null ? 0 : line.pause || line.who !== who ? TURN : GAP;
      const start = Math.max(now + (line.delay ?? 0), t + gap, now);
      const end = line.pause ? start : start + saying(said);
      if (line.chatter) {
        const call = lines.slice(i + 1).find((l) => !l.chatter && !l.pause && l.at !== line.at);
        const late = start - (now + (line.delay ?? 0)) > LATE;
        const blocks = call && end + (call.who === line.who ? GAP : TURN) > now + (call.delay ?? 0) + SLACK;
        if (late || blocks) return;
      }
      t = end;
      who = line.pause ? null : line.who;
      out.push({ ...line, words: said, ms: start - now, end: t - now });
    });
    return { out, t, who };
  }

  return {
    // Each line at its moment, and after the line before it has been said.
    say(lines, onLine) {
      const { out, t, who } = schedule(lines, chosen);
      next = t;
      last = who;
      for (const line of out) onLine?.(line, line.words, line.ms);
    },
    // The lines, each with the words it will be said in, chosen now: so that
    // what is planned (below) is what is then said.
    words(lines) {
      return lines.map((line) => (line.pause ? line : { ...line, words: chosen(line) }));
    },
    // When each line would be said and done, in ms from now, if said next.
    plan(lines) {
      return schedule(lines, usual).out;
    },
    // About when these lines, said next, will all have been said -- in ms
    // from now. For the score, which waits for the dialogue.
    estimate(lines) {
      const out = schedule(lines, usual).out;
      return Math.max(0, next - clock(), ...out.map((l) => l.end));
    },
    // Undo, or a new partie: nothing still to come holds up what follows.
    stop() {
      next = 0;
      last = null;
    },
    // Cassino's: the cards landed by a tap, and the lines not yet said
    // dropped (the director's skip): what is said next is said at once.
    skip() {
      next = 0;
      last = null;
    },
  };
}
