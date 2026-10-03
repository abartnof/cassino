// The person's settings and their sitting, kept in the browser
// (docs/TABLE3D.md section 8): the rules and skill for the next game, the
// aids, how the table looks and moves. Every read and write survives
// storage that is missing, full or blocked (a private window, cleared site
// data): the page then simply starts from the defaults.

const PREFS = "cassino.prefs";
const SITTING = "cassino.sitting";
const SERIES = "cassino.series";

export const DEFAULTS = Object.freeze({
  rules: Object.freeze({ game: "classic", aces14: false, sweeps: true }),
  skill: 3,
  speed: 1,
  surface: "random",
  // The card faces: "auto" (Large Text on a phone), "classic" or "jumbo".
  faces: "auto",
  // The match: one game to 21, or a World Series, the best of seven.
  match: "single",
  // The engine's aids (docs/PROTOCOL.md), and the page's own.
  aids: Object.freeze({ hints: false, explain: false, play_forced: false }),
  undo: false,
  trackers: true,
  unseen: false,
  sweepWarning: false,
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
  const game = r.game === "royal" ? "royal" : "classic";
  const aids = kept.aids ?? {};
  return {
    rules: {
      game,
      aces14: game === "royal" && r.aces14 === true,
      sweeps: isBool(r.sweeps) ? r.sweeps : DEFAULTS.rules.sweeps,
    },
    skill: SKILLS.some((s) => s.value === kept.skill) ? kept.skill : DEFAULTS.skill,
    speed: Number.isFinite(kept.speed) && kept.speed > 0 ? kept.speed : DEFAULTS.speed,
    surface: typeof kept.surface === "string" ? kept.surface : DEFAULTS.surface,
    faces: ["auto", "classic", "jumbo"].includes(kept.faces) ? kept.faces : DEFAULTS.faces,
    match: kept.match === "best-of-7" ? "best-of-7" : "single",
    aids: Object.fromEntries(Object.entries(DEFAULTS.aids).map(([k, v]) => [k, isBool(aids[k]) ? aids[k] : v])),
    undo: isBool(kept.undo) ? kept.undo : DEFAULTS.undo,
    trackers: isBool(kept.trackers) ? kept.trackers : DEFAULTS.trackers,
    unseen: isBool(kept.unseen) ? kept.unseen : DEFAULTS.unseen,
    sweepWarning: isBool(kept.sweepWarning) ? kept.sweepWarning : DEFAULTS.sweepWarning,
    tutorial: isBool(kept.tutorial) ? kept.tutorial : DEFAULTS.tutorial,
    seen: Array.isArray(kept.seen) ? kept.seen.filter((k) => typeof k === "string") : [],
  };
}

export function savePrefs(store, prefs) {
  write(store, PREFS, JSON.stringify(prefs));
}

// The URL's say, over what was kept: for tests, and links that set a game.
export function withUrl(prefs, params) {
  const out = { ...prefs, rules: { ...prefs.rules } };
  if (params.has("game")) out.rules.game = params.get("game") === "royal" ? "royal" : "classic";
  if (params.has("aces14")) out.rules.aces14 = out.rules.game === "royal";
  if (params.has("nosweeps")) out.rules.sweeps = false;
  const skill = Number(params.get("skill"));
  if (params.has("skill") && skill >= 1 && skill <= 4) out.skill = skill;
  const speed = Number(params.get("speed"));
  if (params.has("speed") && speed > 0) out.speed = speed;
  if (params.has("table")) out.surface = params.get("table");
  if (["auto", "classic", "jumbo"].includes(params.get("faces"))) out.faces = params.get("faces");
  if (params.has("tutorial")) out.tutorial = params.get("tutorial") !== "0";
  return out;
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
