// The brief at the game's end, laid out for its dialog (the user: "when the
// game is over, put a button on-screen that says something like 'Review how
// you did?' ... the reviews should be gentle, and focused on trends"). The
// words are the engine's; the page only lays them out: at most three
// bullets, and how it was worked out folded away.
import { test } from "node:test";
import assert from "node:assert/strict";
import { METHOD_TITLE, briefBlocks } from "../src/review.js";

const brief = {
  bullets: [
    { lead: "Going well:", text: "you took every pair that mattered." },
    { lead: "Next: building.", text: "A build keeps a card safe for your next turn." },
    { lead: "", text: "Nothing else stood out." },
  ],
  method: "Your moves were compared afterwards.",
};

test("the brief laid out: the bullets with their leads, then how it was worked out", () => {
  const blocks = briefBlocks(brief);
  assert.deepEqual(blocks, [
    { type: "bullets", items: brief.bullets },
    { type: "method", title: METHOD_TITLE, text: brief.method },
  ]);
  assert.equal(METHOD_TITLE, "How is this worked out?");
});

test("never more than three bullets, and an empty one is left out", () => {
  const many = { ...brief, bullets: [...brief.bullets, { lead: "More:", text: "a fourth." }, { lead: "x", text: "" }] };
  assert.equal(briefBlocks(many)[0].items.length, 3);
  assert.equal(briefBlocks({ ...brief, bullets: [{ lead: "a", text: "" }, { lead: "b", text: "kept" }] })[0].items.length, 1);
});

test("with no method there is no disclosure, and nothing at all is no bullets", () => {
  assert.deepEqual(
    briefBlocks({ ...brief, method: "" }).map((b) => b.type),
    ["bullets"],
  );
  assert.deepEqual(briefBlocks(null), [{ type: "bullets", items: [] }]);
});
