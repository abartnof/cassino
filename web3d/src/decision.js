// What a hint is for: the position, named by the record up to it. The
// engine appends `hint` and `nudged` lines to the record when a hint is
// shown, and the aids line changes with a setting; neither changes the
// position, so neither is part of the key (a hint is asked for once a
// decision, not again whenever the saved text changes).
export function decisionKey(saved) {
  const lines = saved
    .trimEnd()
    .split("\n")
    .filter((l) => !l.startsWith("aids "));
  while (lines.length && /^(hint|nudged)\b/.test(lines[lines.length - 1])) lines.pop();
  return lines.join("\n");
}
