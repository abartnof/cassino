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
export const MAX_RECORD = 20_000; // a record's length, in characters (a long game is a few thousand)
export const MAX_IMPORT = 1_000_000; // an import file's size
const FILE = "progress";
// The engine's evidence text: a header and a line a skill (8 of them); the
// engine test checks that the engine's own output passes.
const SUMMARY_LINES = 9;

// Whether `text` reads as the engine's evidence summary, so what is kept
// (and later handed to the engine) is no more than that.
export function validSummary(text) {
  if (typeof text !== "string" || text.length > 2000 || !/^cassino evidence v\d+\n/.test(text)) return false;
  const lines = text.replace(/\n$/, "").split("\n");
  return lines.length === SUMMARY_LINES && !lines.some((l) => l.trim() === "--");
}

// The evidence version a valid summary was made by.
export function summaryVersion(text) {
  return validSummary(text) ? Number(/^cassino evidence v(\d+)/.exec(text)[1]) : null;
}

function read(store) {
  try {
    return store?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

// Entries checked one by one: a record is text, a summary is text or
// missing; anything else is dropped (or, for a summary, treated as missing).
const recordOk = (g) => g && typeof g.record === "string" && g.record && g.record.length <= MAX_RECORD;
function sound(games) {
  if (!Array.isArray(games)) return [];
  return games
    .filter(recordOk)
    .map((g) => ({ record: g.record, summary: validSummary(g.summary) ? g.summary : null }))
    .slice(-MAX_GAMES);
}

function parsed(store) {
  try {
    return JSON.parse(read(store) ?? "null");
  } catch {
    return null;
  }
}

// Whether what is kept was written by a newer page: read as empty, and never
// written over (an older tab must not undo a newer one's progress).
export function isNewerStore(store) {
  const kept = parsed(store);
  return Boolean(kept) && typeof kept.v === "number" && kept.v > VERSION;
}

export function loadProgress(store) {
  const kept = parsed(store);
  return kept && kept.v === VERSION ? sound(kept.games) : [];
}

// Whether it was kept.
function save(store, games) {
  if (isNewerStore(store)) return false;
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
  if (!recordOk(game)) return false;
  const games = loadProgress(store).filter((g) => g.record !== game.record);
  games.push({ record: game.record, summary: game.summary ?? null });
  return save(store, games.slice(-MAX_GAMES));
}

// The summary of a kept game, once worked out.
export function setSummary(store, record, summary) {
  const games = loadProgress(store);
  const g = games.find((x) => x.record === record);
  if (!g || !validSummary(summary)) return false;
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
// The engine's calls may be promises (a worker). `tried` is the records
// already attempted this sitting. A summary made by a newer evidence than
// this engine's is not stale: another tab of a newer page made it, and
// recomputing would only trade the two versions back and forth.
//
// A record the engine says it cannot restore (it comes from another record
// version, or is no finished game) is dropped after that one try, not asked
// for again every sitting; a call that fails some other way (a worker that
// died) leaves it for the next sitting. Returns whether it tried one; the
// page calls it again, when idle, until it says no.
export async function refreshOne(store, engine, tried = new Set()) {
  const games = loadProgress(store);
  if (!games.length) return false;
  let learnt;
  try {
    learnt = await engine.learner(historyOf(games));
  } catch (error) {
    console.error(error);
    return false;
  }
  const newer = (i) => learnt.version != null && (summaryVersion(games[i].summary) ?? 0) > learnt.version;
  const at = learnt.stale.find((i) => games[i] && !tried.has(games[i].record) && !newer(i));
  if (at === undefined) return false;
  const record = games[at].record;
  tried.add(record);
  try {
    const summary = await engine.evidenceOf(record);
    if (summary) setSummary(store, record, summary);
    else if (!engine.stopped?.()) dropGame(store, record);
  } catch (error) {
    console.error(error);
  }
  return true;
}

function dropGame(store, record) {
  save(
    store,
    loadProgress(store).filter((g) => g.record !== record),
  );
}

// What the settings say of the progress kept.
export function progressSaid(count, newer = false) {
  if (newer) return "The progress kept in this browser is from a newer version of the game, so this page leaves it alone and does not use it.";
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
  if (typeof text !== "string" || text.length > MAX_IMPORT) return { ok: false, error: "That file is too large to be a progress file from this game." };
  if (isNewerStore(store)) return { ok: false, error: "The progress kept here is from a newer version of the game, which this page leaves alone." };
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
  if (!games.length) return { ok: false, error: "There are no games in that file, so there is nothing to import." };
  if (!save(store, games)) return { ok: false, error: "This browser would not keep the progress (its storage is blocked or full)." };
  return { ok: true, count: games.length };
}
