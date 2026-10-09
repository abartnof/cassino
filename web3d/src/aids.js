// The line the aids add under the prompt (docs/DESIGN.md §12.3, §12.8): the
// hint, which stands alone; or the tutor's tip and then the sweep warning
// the player turned on (a tip must not silently hide it), compactly, one
// after the other. The inputs are already the engine's words:
//   hint     { advice } or null
//   nudge    { words } or null
//   warning  what a move would leave your opponent to sweep, or null (only
//            given with the sweep warning on)
//   clearing the table-wide fact "a 9 would clear the table", or null (the
//            same switch); shown when no warning is
// Returns { text, warned } or null. `warned`: a warning about a move is on
// the screen, which the engine records as help (the command `warned`).
export function aidLine({ hint, nudge, warning, clearing }) {
  if (hint) return { text: `Hint: ${hint.advice}.`, warned: false };
  const parts = [];
  if (nudge) parts.push(`Tip: ${nudge.words}`);
  if (warning) parts.push(warning);
  else if (clearing) parts.push(clearing);
  return parts.length ? { text: parts.join(" "), warned: Boolean(warning) } : null;
}
