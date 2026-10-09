// The engine: the rules, compiled to WebAssembly, behind the table protocol
// (docs/PROTOCOL.md). This is the only way the page learns anything about the
// game, and it knows nothing about the scene.

const SEPARATOR = "--";

// Summaries as the engine takes them: one after another, a line of `--`
// between; a missing one stands as text that is no summary (stale).
export function joinSummaries(list) {
  return list.map((s) => s || "stale").join(`\n${SEPARATOR}\n`);
}

// A fault in the module (a panic aborts; a borrow left held makes every
// later call fail): the first is told to `onTrap` and the engine is then
// still, taking nothing and answering what is harmless, so the page can
// offer a reload of the saved sitting rather than go on over a broken engine.
export function guard(api, onTrap) {
  let dead = false;
  let last = null;
  const note = (r) => {
    const s = r && typeof r === "object" ? (r.state ?? r) : null;
    if (s && s.prompt !== undefined) last = s;
    return r;
  };
  const stilled = (name) => {
    const state = { ...(last ?? {}), error: "The table has stopped.", error_code: "stopped" };
    if (name === "send") return { ok: false, state };
    if (name === "step") return { stepped: false, state };
    if (name === "restore") return { ok: false, error: state.error };
    return name === "state" ? last : null;
  };
  const out = {};
  for (const [name, fn] of Object.entries(api)) {
    out[name] = (...args) => {
      if (dead) return stilled(name);
      try {
        return note(fn(...args));
      } catch (error) {
        dead = true;
        onTrap(error);
        return stilled(name);
      }
    };
  }
  return out;
}

export async function loadEngine(bytes, onTrap = () => {}) {
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const ex = instance.exports;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  // Read memory.buffer afresh every time: the module may grow its memory,
  // which detaches any view taken before.
  const out = () => JSON.parse(dec.decode(new Uint8Array(ex.memory.buffer, ex.cassino_out(), ex.cassino_out_len())));
  const write = (text) => {
    const bytes = enc.encode(text);
    const at = ex.cassino_alloc(bytes.length);
    new Uint8Array(ex.memory.buffer, at, bytes.length).set(bytes);
    return bytes.length;
  };
  const numbers = ({ game = "classic", aces14 = false, sweeps = true, raising = true }) => [
    game === "royal" ? 1 : 0,
    aces14 ? 1 : 0,
    sweeps ? 1 : 0,
    raising ? 1 : 0,
  ];
  const api = {
    // A new sitting: { game: "classic" | "royal", aces14, sweeps, raising,
    // skill, seed }.
    start(settings) {
      const [game, aces, sweeps, raising] = numbers(settings);
      ex.cassino_new(game, aces, sweeps, raising, Math.round((settings.skill ?? 4) * 1000), settings.seed >>> 0);
      return out();
    },
    // Two computer players to watch: { ..., skills: [south, north] }.
    watch(settings) {
      const [game, aces, sweeps, raising] = numbers(settings);
      const [south, north] = settings.skills ?? [4, 4];
      ex.cassino_watch(game, aces, sweeps, raising, Math.round(south * 1000), Math.round(north * 1000), settings.seed >>> 0);
      return out();
    },
    state() {
      ex.cassino_render();
      return out();
    },
    // A command; returns whether it was accepted, and the state after.
    send(command) {
      const ok = ex.cassino_send(write(command)) === 1;
      return { ok, state: out() };
    },
    step() {
      const stepped = ex.cassino_step() === 1;
      return { stepped, state: out() };
    },
    // What a selection ("3H AC 2D": the hand card, then the table cards) can
    // become.
    offer(selection) {
      ex.cassino_offer(write(selection));
      return out();
    },
    hint() {
      ex.cassino_hint();
      return out();
    },
    // The tutor (docs/PROTOCOL.md, "The tutor"). The summaries are text the
    // engine made; a missing one (null) counts as stale. The advisor runs
    // over a whole game for the evidence: call it off the game-end path.
    //
    // This game's evidence summary once it is over (null before).
    evidence() {
      ex.cassino_evidence();
      return out()?.summary ?? null;
    },
    // The summary of a stored record of a finished game, the sitting left
    // alone; null if the record does not restore or was not finished.
    evidenceOf(record) {
      ex.cassino_evidence_of(write(record));
      return out()?.summary ?? null;
    },
    // What the games say, oldest first: { games, focus, mastered, stale }
    // (focus a skill's slug or null; stale the indexes to recompute).
    learner(history) {
      ex.cassino_learner(write(joinSummaries(history)));
      return out();
    },
    // The brief of the game just finished: { bullets: [{ lead, text }],
    // method }, or null before it is over. `game` is its summary (null to
    // have it worked out here), `history` the earlier games', oldest first.
    brief(game, history) {
      ex.cassino_brief(write(`${game ?? ""}\n${SEPARATOR}\n${joinSummaries(history)}`));
      return out();
    },
    // Tells the sitting which skill the tutor is on (a slug; null for none).
    // Not part of the record: say it again after a restore.
    setFocus(slug) {
      return ex.cassino_set_focus(write(slug ?? "")) === 1;
    },
    // The nudge for this decision: { skill, words } or null. Showing it is
    // send(`nudged ${skill}`).
    nudge() {
      ex.cassino_nudge();
      return out();
    },
    // Every hand's deals once the game is over (null before). The table no
    // longer uses it (its replay with both hands face up went in the
    // seventh play-testing); the protocol keeps it.
    reveal() {
      ex.cassino_reveal();
      return out();
    },
    // Restores a sitting from its saved text; { ok, state } or { ok, error }.
    restore(text) {
      const ok = ex.cassino_restore(write(text)) === 1;
      const value = out();
      return ok ? { ok, state: value } : { ok, error: value.error };
    },
  };
  return guard(api, onTrap);
}

export function decodeBase64(text) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}
