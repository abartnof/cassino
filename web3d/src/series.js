// The match (DESIGN.md §12.3): one game to 21, or a family "World Series",
// the best of seven games ("they regularly play 'World Series' best-of-7's",
// a player's family, in the literature review). Pure, so it is tested; the
// page keeps it with the person's settings.

export const NO_SERIES = Object.freeze({ format: "single", you: 0, them: 0, counted: Object.freeze([]) });
const TO_WIN = 4;

// Who has won the series, if anyone.
export function seriesOver(s) {
  if (s.format !== "best-of-7") return null;
  if (s.you >= TO_WIN) return "you";
  if (s.them >= TO_WIN) return "them";
  return null;
}

// A finished game counted into the series, once (by its seed): the next
// game after a finished series opens a new one.
export function recordGame(s, { seed, youWon }) {
  if (s.format !== "best-of-7" || s.counted.includes(seed)) return s;
  const fresh = seriesOver(s) ? { ...s, you: 0, them: 0, counted: [] } : s;
  return {
    ...fresh,
    you: fresh.you + (youWon ? 1 : 0),
    them: fresh.them + (youWon ? 0 : 1),
    counted: [...fresh.counted, seed].slice(-20),
  };
}

// Where the series stands, in words, or null for a single game.
export function seriesLine(s) {
  if (s.format !== "best-of-7") return null;
  const over = seriesOver(s);
  if (over === "you") return `You win the series, ${s.you} games to ${s.them}.`;
  if (over === "them") return `Your opponent wins the series, ${s.them} games to ${s.you}.`;
  return `Series: you ${s.you}, your opponent ${s.them} (best of seven).`;
}
