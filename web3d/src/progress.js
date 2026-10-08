// What the tutor keeps between games (docs/DESIGN.md §12.8, PLAN 11.6): the
// last thirty finished games, each as its record (the engine's saved text)
// and its summary (the engine's text of what the game showed of each skill),
// in the browser's storage. The page holds no judgement: the summaries are
// the engine's, and the records let it recompute any that its newer version
// calls stale. Every access survives storage that is missing, full or
// blocked; the tutor then works from the one game just played (the brief
// with an empty history).
//
// The store is injected (anything with getItem, setItem and removeItem).

const KEY = "cassino.progress";
const VERSION = 1;
export const MAX_GAMES = 30;
const FILE = "progress";

function read(store) {
  try {
    return store?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

// Entries checked one by one: a record is text, a summary is text or
// missing; anything else is dropped (or, for a summary, treated as missing).
function sound(games) {
  if (!Array.isArray(games)) return [];
  return games
    .filter((g) => g && typeof g.record === "string" && g.record)
    .map((g) => ({ record: g.record, summary: typeof g.summary === "string" && g.summary ? g.summary : null }))
    .slice(-MAX_GAMES);
}

export function loadProgress(store) {
  try {
    const kept = JSON.parse(read(store) ?? "null");
    return kept && kept.v === VERSION ? sound(kept.games) : [];
  } catch {
    return [];
  }
}

// Whether it was kept.
function save(store, games) {
  try {
    store.setItem(KEY, JSON.stringify({ v: VERSION, games }));
    return true;
  } catch {
    return false;
  }
}

// A finished game: its record and summary (null if not yet worked out).
// Kept once, however often it is offered; the oldest go past thirty.
export function addGame(store, game) {
  const games = loadProgress(store).filter((g) => g.record !== game.record);
  games.push({ record: game.record, summary: game.summary ?? null });
  return save(store, games.slice(-MAX_GAMES));
}

// The summary of a kept game, once worked out.
export function setSummary(store, record, summary) {
  const games = loadProgress(store);
  const g = games.find((x) => x.record === record);
  if (!g) return false;
  g.summary = summary;
  return save(store, games);
}

export function clearProgress(store) {
  try {
    store?.removeItem(KEY);
  } catch {
    // Not cleared: it was not readable either.
  }
}

// The summaries, oldest first, as the engine's learner and brief take them
// (null where one is missing).
export function historyOf(games) {
  return games.map((g) => g.summary);
}

// Recomputes one stale summary from its record, which the engine's learner
// lists (engine.learner(history).stale) after a change to the evidence.
// `tried` is the records already attempted this sitting, so one that will
// not restore is not asked for again. Returns whether it tried one; the
// page calls it again, when idle, until it says no.
export function refreshOne(store, engine, tried = new Set()) {
  const games = loadProgress(store);
  if (!games.length) return false;
  const { stale } = engine.learner(historyOf(games));
  const at = stale.find((i) => games[i] && !tried.has(games[i].record));
  if (at === undefined) return false;
  tried.add(games[at].record);
  const summary = engine.evidenceOf(games[at].record);
  if (summary) setSummary(store, games[at].record, summary);
  return true;
}

// What the settings say of the progress kept.
export function progressSaid(count) {
  if (!count) return "Nothing is kept yet. Your finished games are kept in this browser only, to choose what the tutor mentions.";
  return `Your last ${count === 1 ? "game is" : `${count} games are`} kept in this browser only, to choose what the tutor mentions.`;
}

// The file to download: the games, as text.
export function exportProgress(games) {
  return JSON.stringify({ cassino: FILE, v: VERSION, games: sound(games) }, null, 1);
}

// A file chosen to import, replacing what is kept. { ok: true, count } or
// { ok: false, error } in a sentence a person can read; a file that is
// refused changes nothing.
export function importProgress(store, text) {
  let file;
  try {
    file = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not a progress file from this game." };
  }
  if (!file || file.cassino !== FILE || !Array.isArray(file.games)) return { ok: false, error: "That file is not a progress file from this game." };
  if (file.v !== VERSION) return { ok: false, error: "That progress file is from another version of the game." };
  if (!file.games.every((g) => g && typeof g.record === "string" && g.record)) return { ok: false, error: "That progress file is damaged: a game in it has no record." };
  const games = sound(file.games);
  if (!save(store, games)) return { ok: false, error: "This browser would not keep the progress (its storage is blocked or full)." };
  return { ok: true, count: games.length };
}
