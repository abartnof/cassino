// The build badges (docs/TABLE3D.md section 8): a value over each build,
// kept in view through the moves, as pure functions of the states. The page
// places them where the build's top card is drawn, frame by frame.

const sameCards = (a, b) => a.cards.length === b.cards.length && a.cards.every((c, i) => c.card === b.cards[i].card);
const sameBuild = (a, b) => a.build.value === b.build.value && a.build.multiple === b.build.multiple && a.build.controller === b.build.controller && sameCards(a, b);

// The table items whose badges show. At rest, every build. While the cards
// move from `before` to `after`, the builds the move leaves as they were, so
// a badge stays through every move that does not touch its build; a build
// made, raised or taken waits for the cards to come to rest.
export function badgesShown(before, after, moving) {
  const builds = (after?.table ?? []).filter((item) => item.build);
  if (!moving) return builds;
  const was = new Map((before?.table ?? []).filter((item) => item.build).map((item) => [item.id, item]));
  return builds.filter((item) => was.has(item.id) && sameBuild(was.get(item.id), item));
}

// What a badge says: the value, or its plural for a multiple build.
export function badgeText(build) {
  return build.multiple ? `${build.value}s` : `${build.value}`;
}

// The badge's title (its tooltip): whose build, of what, and its cards.
// `whose`: the owners' words (South's and North's in a watched game).
export function badgeTitle(item, whose = { you: "Your", them: "Your opponent's" }) {
  const owner = whose[item.build.controller];
  return `${owner} build of ${badgeText(item.build)}: ${item.cards.map((c) => c.label).join(" ")}`;
}
