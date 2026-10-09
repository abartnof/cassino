// What a screen reader is told at the table: the last sentence and whose turn.
import { test } from "node:test";
import assert from "node:assert/strict";
import { announcement } from "../src/announce.js";

test("the last event's sentence, then whose turn it is", () => {
  const events = [{ kind: "played", text: "Your opponent trails the 5 of clubs." }];
  assert.equal(announcement({ prompt: "play", events }), "Your opponent trails the 5 of clubs. Your turn.");
  assert.equal(announcement({ prompt: "next_hand", events }), "Your opponent trails the 5 of clubs. The hand is over.");
  assert.equal(announcement({ prompt: "over", events: [] }), "The game is over.");
  assert.equal(announcement({ prompt: "play", watching: true, events }), "");
});
