// The person's settings and their sitting, kept in the browser
// (docs/TABLE3D.md section 8): the rules and skill the last new game was
// chosen with (the next one's, unless changed in its menu), the aids, how
// the table looks and moves. Every read and write survives
// storage that is missing, full or blocked (a private window, cleared site
// data): the page then simply starts from the defaults.

const PREFS = "cassino.prefs";
// What is kept is every setting, defaults too: the version says which
// defaults it was kept under, so a default changed since (sweeps, version
// 2; the trackers' panel folded, 3; Royal Cassino the game, 4) is not
// taken for the person's choice.
const VERSION = 4;
const SITTING = "cassino.sitting";
const SERIES = "cassino.series";

export const DEFAULTS = Object.freeze({
  // Sweeps scored only if chosen: pagat's Casino has them as a variant, and
  // play-testing preferred the game without them (docs/RULES.md). Builds
  // raised unless chosen otherwise (play-testing asked for the choice).
  // Royal Cassino the game unless plain Cassino, the variant, is chosen
  // (the user: "I want Royal Casino on the left and to be the default.
  // Casino is the variant and on the right").
  rules: Object.freeze({ game: "royal", aces14: false, sweeps: false, raising: true }),
  skill: 3,
  speed: 1,
  surface: "random",
  // The card faces: "auto" (Large Text on a phone or a tablet), "classic"
  // or "jumbo".
  faces: "auto",
  // The match: one game to 21, or a World Series, the best of seven.
  match: "single",
  // The engine's aids (docs/PROTOCOL.md), and the page's own.
  aids: Object.freeze({ hints: false, explain: false, play_forced: false }),
  trackers: true,
  // The trackers' panel open, or folded to its heading: folded at first
  // (play-testing), since version 3 of the kept settings.
  trackersOpen: false,
  // A badge with its value over each build, always in view; always on while
  // the tutorial is (badgesOn).
  buildValues: false,
  unseen: false,
  sweepWarning: false,
  // What is said at the table: "all", "calls" (what carries the game) or
  // "none" (talk.js heard).
  talk: "all",
  // The tutorial: its pages open by themselves, each once (`seen`).
  tutorial: true,
  seen: Object.freeze([]),
});

// The skill dial, in halves: each rung as your opponent plays it (DESIGN.md
// §11); a half is the rung below with the one above's play now and then.
export const SKILLS = Object.freeze([
  { value: 1, words: "plays any card it may" },
  { value: 1.5, words: "between the two" },
  { value: 2, words: "takes what it can, greedily" },
  { value: 2.5, words: "between the two" },
  { value: 3, words: "counts the cards and reads your builds" },
  { value: 3.5, words: "between the two" },
  { value: 4, words: "plays the deal out in its head" },
]);

export const SPEEDS = Object.freeze([
  { value: 0.6, words: "Leisurely" },
  { value: 1, words: "Natural" },
  { value: 1.7, words: "Brisk" },
  { value: 100, words: "Instant" },
]);

function read(store, key) {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function write(store, key, value) {
  try {
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, value);
  } catch {
    // Not kept, this time.
  }
}

const isBool = (x) => typeof x === "boolean";

// What was kept, each field checked: anything odd falls back to its default.
export function loadPrefs(store) {
  let kept = {};
  try {
    kept = JSON.parse(read(store, PREFS) ?? "{}") ?? {};
  } catch {
    kept = {};
  }
  const r = kept.rules ?? {};
  const game = ["royal", "classic"].includes(r.game) && kept.v >= 4 ? r.game : DEFAULTS.rules.game;
  const aids = kept.aids ?? {};
  return {
    rules: {
      game,
      aces14: game === "royal" && r.aces14 === true,
      sweeps: isBool(r.sweeps) && kept.v >= 2 ? r.sweeps : DEFAULTS.rules.sweeps,
      raising: isBool(r.raising) ? r.raising : DEFAULTS.rules.raising,
    },
    skill: SKILLS.some((s) => s.value === kept.skill) ? kept.skill : DEFAULTS.skill,
    speed: Number.isFinite(kept.speed) && kept.speed > 0 ? kept.speed : DEFAULTS.speed,
    surface: typeof kept.surface === "string" ? kept.surface : DEFAULTS.surface,
    faces: ["auto", "classic", "jumbo"].includes(kept.faces) ? kept.faces : DEFAULTS.faces,
    match: kept.match === "best-of-7" ? "best-of-7" : "single",
    aids: Object.fromEntries(Object.entries(DEFAULTS.aids).map(([k, v]) => [k, isBool(aids[k]) ? aids[k] : v])),
    trackers: isBool(kept.trackers) ? kept.trackers : DEFAULTS.trackers,
    trackersOpen: isBool(kept.trackersOpen) && kept.v >= 3 ? kept.trackersOpen : DEFAULTS.trackersOpen,
    buildValues: isBool(kept.buildValues) ? kept.buildValues : DEFAULTS.buildValues,
    unseen: isBool(kept.unseen) ? kept.unseen : DEFAULTS.unseen,
    sweepWarning: isBool(kept.sweepWarning) ? kept.sweepWarning : DEFAULTS.sweepWarning,
    talk: ["all", "calls", "none"].includes(kept.talk) ? kept.talk : DEFAULTS.talk,
    tutorial: isBool(kept.tutorial) ? kept.tutorial : DEFAULTS.tutorial,
    seen: Array.isArray(kept.seen) ? kept.seen.filter((k) => typeof k === "string") : [],
  };
}

// Whether the builds' badges show: chosen, or the tutorial on.
export function badgesOn(prefs) {
  return Boolean(prefs.buildValues || prefs.tutorial);
}

export function savePrefs(store, prefs) {
  write(store, PREFS, JSON.stringify({ ...prefs, v: VERSION }));
}

// The URL's say, over what was kept: for tests, and links that set a game.
export function withUrl(prefs, params) {
  const out = { ...prefs, rules: { ...prefs.rules } };
  if (params.has("game")) out.rules.game = params.get("game") === "royal" ? "royal" : "classic";
  if (params.has("aces14")) out.rules.aces14 = out.rules.game === "royal";
  if (params.has("sweeps")) out.rules.sweeps = true;
  if (params.has("nosweeps")) out.rules.sweeps = false;
  if (params.has("noraise")) out.rules.raising = false;
  const skill = Number(params.get("skill"));
  if (params.has("skill") && skill >= 1 && skill <= 4) out.skill = skill;
  const speed = Number(params.get("speed"));
  if (params.has("speed") && speed > 0) out.speed = speed;
  if (params.has("table")) out.surface = params.get("table");
  if (["auto", "classic", "jumbo"].includes(params.get("faces"))) out.faces = params.get("faces");
  if (params.has("tutorial")) out.tutorial = params.get("tutorial") !== "0";
  if (params.has("values")) out.buildValues = params.get("values") !== "0";
  return out;
}

// The new game's menu on opening the page, which welcomes (with Continue
// for a game kept): shown unless the address asks for a game (a shared
// game's seed, watch mode) or for none (welcome=0, for tests).
export function welcomeWanted(params) {
  return !params.has("seed") && !params.has("watch") && params.get("welcome") !== "0";
}

// A new game's choices, from the new game's menu (the seventh
// play-testing: the game's own settings taken out of the settings, where
// Royal could be chosen and not happen until a new game): what they set,
// kept for the next game too, and the series, begun afresh for another
// match. Aces 1 or 14 is Royal's alone. And the tutorial, chosen with the
// rest (the user: "put tutorial mode as an option within the new game
// config"): turned on here, from its first page; left on, its pages read
// already are not read again.
export function chooseGame(prefs, series, { rules, skill, match, tutorial }) {
  const game = rules.game === "royal" ? "royal" : "classic";
  const patch = {
    rules: { game, aces14: game === "royal" && rules.aces14 === true, sweeps: rules.sweeps === true, raising: rules.raising !== false },
    skill,
    match,
  };
  if (typeof tutorial === "boolean") {
    patch.tutorial = tutorial;
    if (tutorial && !prefs.tutorial) patch.seen = [];
  }
  const fresh = match !== prefs.match || series.format !== match ? { format: match, you: 0, them: 0, counted: [] } : series;
  return { patch, series: fresh };
}

// What the new game's menu starts from: the game on the table, played or
// finished, as the engine has it (its rules and your opponent's skill), so
// a new game is like the last unless changed (the user: "make the new game
// settings, consistent with their previous game settings"); with none, or
// a watched one, the settings kept. Nothing more is kept for it. The
// tutorial as it is set.
export function menuChoices(prefs, state) {
  const played = state && !state.watching && state.rules;
  return {
    rules: played ? { ...state.rules } : { ...prefs.rules },
    skill: played && SKILLS.some((s) => s.value === state.skill) ? state.skill : prefs.skill,
    match: prefs.match,
    tutorial: Boolean(prefs.tutorial),
  };
}

// The game under way in words, for the settings: its rules and your
// opponent's skill.
export function gameSaid(rules, skill) {
  const parts = [rules.game === "royal" ? "Royal Cassino" : "Cassino"];
  if (rules.game === "royal" && rules.aces14) parts.push("aces 1 or 14");
  parts.push(rules.sweeps ? "sweeps scored" : "no sweeps", rules.raising === false ? "no raising" : "builds raised");
  return `${parts.join(", ")}; your opponent at ${skill}`;
}

// The sitting under way, as the engine saves it (state.saved), to restore
// on reload; null to forget it.
export function loadSitting(store) {
  return read(store, SITTING);
}
export function saveSitting(store, text) {
  write(store, SITTING, text);
}

// The daily deal: a seed from the date where the person is, the same for
// everyone that day, needing no network.
export function dailySeed(date = new Date()) {
  const day = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  let h = 2166136261;
  for (const ch of `cassino daily ${day}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % (2 ** 31 - 1)) + 1;
}

// The series under way (series.js), checked as the preferences are.
export function loadSeries(store) {
  let kept = {};
  try {
    kept = JSON.parse(read(store, SERIES) ?? "{}") ?? {};
  } catch {
    kept = {};
  }
  const count = (n) => (Number.isInteger(n) && n >= 0 && n <= 7 ? n : 0);
  if (kept.format !== "best-of-7") return { format: "single", you: 0, them: 0, counted: [] };
  return { format: "best-of-7", you: count(kept.you), them: count(kept.them), counted: Array.isArray(kept.counted) ? kept.counted.filter(Number.isFinite) : [] };
}
export function saveSeries(store, series) {
  write(store, SERIES, JSON.stringify(series));
}
