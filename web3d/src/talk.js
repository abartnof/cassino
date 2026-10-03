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
// Hoyles), the dealer's "Last.", "Clear!" for a sweep, "Cash.", the clinches,
// the custom of pointing out what an opponent left, and the count chanted.

const POINT_CARDS = new Set(["AS", "AH", "AD", "AC", "TD", "2S"]);

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

export function speech(state, since = 0) {
  const out = [];
  const rules = state.rules ?? {};
  state.events.forEach((e, at) => {
    if (at < since) return;
    const say = (who, phrase, extra = {}) => out.push({ who, phrase, at, kind: e.kind, ...extra });
    const who = e.you ? "you" : "them";
    switch (e.kind) {
      case "cut":
        // The house rules, agreed before the cut: your opponent asks, and
        // your settings answer.
        say("them", "sweeps-ask");
        say("you", rules.sweeps === false ? "sweeps-no" : "sweeps-yes");
        if (rules.game === "royal") say("them", "royal");
        if (rules.aces14) say("them", "aces-14");
        say("them", "low-deals");
        break;
      case "first_dealer":
        say("them", e.you ? "your-deal" : "my-deal");
        break;
      case "dealt":
        if (e.last) say(e.you_deal ? "you" : "them", "last");
        break;
      case "played":
        if (e.type === "build") say(who, call(e));
        // What you left, pointed out (the Dominican dejado): always when it
        // holds a point card or more than one card, otherwise now and then.
        if (e.you && e.left?.length) {
          const worth = e.left.length > 1 || e.left.some((c) => POINT_CARDS.has(c.card));
          if (worth || at % 2 === 0) say("them", e.left.length > 1 ? "left-more" : `left-${e.left[0].rank}`);
        }
        break;
      case "swept":
        say(who, "sweep");
        break;
      case "cash":
        say(who, "cash");
        break;
      case "clinched":
        say(who, e.what === "cards" ? "clinch-cards" : "clinch-spades");
        break;
      case "residue":
        if (e.you !== null) say(who, "residue");
        break;
      case "scored":
        e.count.lines.forEach((line, i) => say(line.who, chant(line), { line: i }));
        break;
      case "game_ends":
        say(e.you_won ? "you" : "them", "game-won");
        say(e.you_won ? "them" : "you", "good-game");
        break;
      default:
        break;
    }
  });
  return out;
}
