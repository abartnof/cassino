// The line the aids add under the prompt (src/aids.js): the hint, or the
// tutor's tip, and the sweep warning, both when both are on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { aidLine } from "../src/aids.js";

const warning = "Trail leaves a sweep: a 9 would clear the table, and 2 you have not seen.";
const base = { hint: null, nudge: null, warning: null, clearing: null };

test("a hint stands alone", () => {
  const got = aidLine({ ...base, hint: { advice: "Take the nine" }, nudge: { words: "Look for pairs." }, warning });
  assert.deepEqual(got, { text: "Hint: Take the nine.", warned: false });
});

test("a tip does not hide a warning the player turned on: the tip first, then the warning", () => {
  const got = aidLine({ ...base, nudge: { words: "Look for pairs." }, warning });
  assert.equal(got.text, `Tip: Look for pairs. ${warning}`);
  assert.equal(got.warned, true, "the warning was shown, so it is help");
});

test("a tip alone, a warning alone, the table that one card clears, and nothing", () => {
  assert.deepEqual(aidLine({ ...base, nudge: { words: "Look for pairs." } }), { text: "Tip: Look for pairs.", warned: false });
  assert.deepEqual(aidLine({ ...base, warning }), { text: warning, warned: true });
  assert.deepEqual(aidLine({ ...base, clearing: "A 9 would clear the table." }), { text: "A 9 would clear the table.", warned: false });
  assert.deepEqual(aidLine({ ...base, nudge: { words: "Look for pairs." }, clearing: "A 9 would clear the table." }).text, "Tip: Look for pairs. A 9 would clear the table.");
  assert.equal(aidLine(base), null);
});
