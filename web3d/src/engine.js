// The engine: the rules, compiled to WebAssembly, behind the table protocol
// (docs/PROTOCOL.md). This is the only way the page learns anything about the
// game, and it knows nothing about the scene.

export async function loadEngine(bytes) {
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
  return {
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
    // Every hand's deals once the game is over (null before): for the
    // replay with both hands face up.
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
}

export function decodeBase64(text) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}
