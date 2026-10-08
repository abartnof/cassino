// The review at the game's end, laid out for its dialog (chrome.js
// showReview): the engine's words (docs/PROTOCOL.md, "The review") in
// blocks, a section left out when it has nothing in it. The page adds no
// judgement of its own.
//
// Blocks: { type: "p" | "h" | "h4" | "small", text } and { type: "ul", items }.
export function reviewBlocks(review) {
  const blocks = [{ type: "p", text: review.summary }];
  if (review.strengths.length) blocks.push({ type: "h", text: "Going well" }, { type: "ul", items: review.strengths });
  if (review.tries.length) {
    blocks.push({ type: "h", text: "Something to try" });
    for (const t of review.tries) blocks.push({ type: "h4", text: t.title }, { type: "p", text: t.text });
  }
  blocks.push({ type: "p", text: review.closing }, { type: "small", text: review.method });
  return blocks;
}
