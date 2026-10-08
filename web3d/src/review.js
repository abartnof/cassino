// The brief at the game's end, laid out for its dialog (chrome.js
// showReview): the engine's words (docs/PROTOCOL.md, "The tutor") as at
// most three bullets, each with a lead to set in bold, and a disclosure for
// how it was worked out. The page adds no judgement of its own.
//
// Blocks: { type: "bullets", items: [{ lead, text }] } and
// { type: "method", title, text }.
export const METHOD_TITLE = "How is this worked out?";

export function briefBlocks(brief) {
  const items = (brief?.bullets ?? []).filter((b) => b && b.text).slice(0, 3).map((b) => ({ lead: b.lead ?? "", text: b.text }));
  const blocks = [{ type: "bullets", items }];
  if (brief?.method) blocks.push({ type: "method", title: METHOD_TITLE, text: brief.method });
  return blocks;
}
