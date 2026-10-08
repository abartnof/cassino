// What a screen reader is told once the cards are still: the last event's
// sentence (the engine's own), then whose turn it is. The visible prompt is
// empty for most of a turn, so this is told separately (overlay.js).
export function announcement(state) {
  if (state.watching) return "";
  const last = [...(state.events ?? [])].reverse().find((e) => e.text);
  const turn = state.prompt === "play" ? "Your turn." : state.prompt === "next_hand" ? "The hand is over." : state.prompt === "over" ? "The game is over." : "";
  return [last?.text, turn].filter(Boolean).join(" ");
}
