// The key of a decision: what the hint is for. It must not change when the
// hint itself is recorded, nor when an aid is switched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decisionKey } from "../src/decision.js";

const head = "cassino record v1\nseed 5\nrules classic aces14=0 sweeps=0\nskill 3\n";
const aids = (h) => `aids hints=${h} explain=0 play_forced=0\n`;

test("the key ignores the aids line and the hint lines recorded at this decision", () => {
  const body = "trail 5S\ntake 3H 3D\n";
  const bare = decisionKey(head + aids(1) + body);
  assert.equal(decisionKey(head + aids(1) + body + "hint\n"), bare);
  assert.equal(decisionKey(head + aids(1) + body + "hint\nnudged pairs\n"), bare);
  assert.equal(decisionKey(head + aids(0) + body), bare);
});

test("the key changes with the next move or the next hand", () => {
  const a = decisionKey(head + aids(1) + "trail 5S\n");
  assert.notEqual(decisionKey(head + aids(1) + "trail 5S\ntrail 6H\n"), a);
  assert.notEqual(decisionKey(head + aids(1) + "trail 5S\nhint\ntrail 6H\n"), a);
  assert.notEqual(decisionKey(head + aids(1) + "trail 5S\nnext\n"), a);
});
