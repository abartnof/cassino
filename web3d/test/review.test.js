// The review at the game's end, laid out for its dialog (the user: "when
// the game is over, put a button on-screen that says something like
// 'Review how you did?' ... the reviews should be gentle, and focused on
// trends"). The words are the engine's; the page only lays them out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewBlocks } from "../src/review.js";

const full = {
  summary: "You made 52 choices this game.",
  strengths: ["You never let a capture go by.", "You took 4 of the 6 Cassinos dealt."],
  tries: [
    { title: "Building for a bigger capture", text: "Building was the strongest play 11 times." },
    { title: "The last deal", text: "Your moves in the last deal gave up more." },
  ],
  closing: "Explanations comment on each move.",
  method: "Each of your moves was compared afterwards.",
};

test("the review laid out: the summary, what went well, what to try, the closing, how it was worked out", () => {
  const blocks = reviewBlocks(full);
  assert.deepEqual(
    blocks.map((b) => [b.type, b.text ?? b.items?.length]),
    [
      ["p", full.summary],
      ["h", "Going well"],
      ["ul", 2],
      ["h", "Something to try"],
      ["h4", "Building for a bigger capture"],
      ["p", "Building was the strongest play 11 times."],
      ["h4", "The last deal"],
      ["p", "Your moves in the last deal gave up more."],
      ["p", full.closing],
      ["small", full.method],
    ],
  );
});

test("a section with nothing in it is left out", () => {
  const blocks = reviewBlocks({ ...full, strengths: [], tries: [] });
  assert.deepEqual(
    blocks.map((b) => b.type),
    ["p", "p", "small"],
  );
  assert.ok(!blocks.some((b) => b.text === "Going well" || b.text === "Something to try"));
});
