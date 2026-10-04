// The eye over the table (play-testing: the cards were "too hard to see,
// esp. in mobile mode -- please shift the camera higher", with the hand
// tilted "so it's viewed essentially straight-on"): looking down at 70
// degrees to the table, both hands turned square to it, and room left on
// the screen for the move bar between the table and your hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { cardCorners } from "../src/kinematics.js";
import { layout } from "../src/layout.js";
import { cameraFor } from "../src/framing.js";
import { FOG } from "../src/reveal.js";
import { CAMERA, CAMERA_PORTRAIT, CARD, PITCH, ZONES, ZONES_PORTRAIT } from "../src/units.js";

const card = (code) => ({ card: code, label: code, rank: 0, suit: code[1] });
// A state as the protocol gives it, with only what the layout reads: four
// cards each, and a table of `items` single cards.
const dealt = (items = 4) => ({
  hand: ["AS", "7H", "TD", "KC"].map(card),
  table: ["2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "TS", "JS", "QS", "KS"].slice(0, items).map((c, i) => ({ id: i + 1, cards: [card(c)], build: null })),
  opponent_holds: 4,
  undealt: 24,
  dealer: "them",
  piles: { you: { cards: 6, sweeps: 0 }, them: { cards: 6, sweeps: 0 } },
});

// A desktop window, and a phone held upright between the strips the page
// measures there (the score and the aids' panel above, the prompt and the
// tools below).
const DESKTOP = { width: 1280, height: 800, zones: ZONES, eye: CAMERA };
const PHONE = { width: 390, height: 844, strips: { top: 260, foot: 151 }, zones: ZONES_PORTRAIT, eye: CAMERA_PORTRAIT };
const camera = (w) => cameraFor(w.width / w.height, 0, w.height, w.strips, null);
const screen = (w, cam) => (p) => {
  const v = p.clone().project(cam);
  return { x: ((v.x + 1) / 2) * w.width, y: ((1 - v.y) / 2) * w.height };
};
const DEG = 180 / Math.PI;

test("the eye looks down at 70 degrees to the table, on a desktop and on a phone", () => {
  assert.equal(PITCH, 70);
  for (const eye of [CAMERA, CAMERA_PORTRAIT]) {
    const look = new Vector3(...eye.target).sub(new Vector3(...eye.position));
    assert.ok(Math.abs(Math.asin(-look.y / look.length()) * DEG - PITCH) < 1e-9, `${eye.position}`);
  }
});

// The angle between a card's face (or back) and the way to the eye.
const off = (slot, eye, side = 1) => {
  const normal = new Vector3(0, 0, side).applyQuaternion(slot.pose.quaternion);
  const to = new Vector3(...eye).sub(slot.pose.position).normalize();
  return Math.acos(Math.min(1, normal.dot(to))) * DEG;
};

test("your hand is seen straight on, and your opponent's backs", () => {
  for (const w of [DESKTOP, PHONE]) {
    const slots = layout(dealt(), { zones: w.zones });
    for (const s of slots.filter((x) => x.zone === "your-hand")) assert.ok(off(s, w.eye.position) < 8, `your ${s.code}: ${off(s, w.eye.position).toFixed(1)} degrees off`);
    for (const s of slots.filter((x) => x.zone === "their-hand")) assert.ok(off(s, w.eye.position, -1) < 8, `their back: ${off(s, w.eye.position, -1).toFixed(1)} degrees off`);
    // In the replay after the game their faces are turned to you, as square.
    const open = layout(dealt(), { zones: w.zones, theirs: ["2H", "3H", "4H", "5H"] }).filter((x) => x.zone === "their-hand");
    for (const s of open) assert.ok(off(s, w.eye.position) < 8, `their ${s.code} in the replay: ${off(s, w.eye.position).toFixed(1)} degrees off`);
  }
});

// Where the move bar goes (main.js placeMoveBar): between the near edge of
// the table's first row and the top of your hand, clear of a card chosen
// from it, which stands 1.6 cm up out of the hand.
function room(w, items = 4) {
  const cam = camera(w);
  const at = screen(w, cam);
  const m = w.zones.middle;
  const near = at(new Vector3(m.x, 0, m.z + CARD.height / 2 + w.zones.stack.dz)).y;
  const hand = layout(dealt(items), { zones: w.zones }).filter((x) => x.zone === "your-hand");
  const top = Math.min(...hand.flatMap((s) => cardCorners(s.pose).map(at).map((p) => p.y)));
  const chosen = layout(dealt(items), { zones: w.zones, chosen: "7H" }).filter((x) => x.zone === "your-hand");
  const raised = Math.min(...chosen.flatMap((s) => cardCorners(s.pose).map(at).map((p) => p.y)));
  return { gap: raised - near, near, top };
}

test("between the table and your hand there is room for the move bar, on a desktop and on a phone", () => {
  assert.ok(room(DESKTOP).gap >= 70, `desktop: ${room(DESKTOP).gap.toFixed(0)} px`);
  assert.ok(room(PHONE).gap >= 50, `phone: ${room(PHONE).gap.toFixed(0)} px`);
});

test("your opponent's hand lies beyond the table's second row, so it hides none of it", () => {
  for (const w of [DESKTOP, PHONE]) {
    const at = screen(w, camera(w));
    const two = 2 * w.zones.middle.columns; // two full rows
    const slots = layout(dealt(two), { zones: w.zones });
    const far = Math.min(...slots.filter((x) => x.zone === "middle").flatMap((s) => cardCorners(s.pose).map(at).map((p) => p.y)));
    const theirs = Math.max(...slots.filter((x) => x.zone === "their-hand").flatMap((s) => cardCorners(s.pose).map(at).map((p) => p.y)));
    assert.ok(theirs < far, `${w.width}: their hand reaches ${theirs.toFixed(0)} px, the second row ${far.toFixed(0)} px`);
  }
});

test("a phone's middle is five wide, so ten items lie in two rows", () => {
  assert.equal(ZONES_PORTRAIT.middle.columns, 5);
});

test("nothing on the table is lost in the air: every card nearer the eye than the fog begins", () => {
  for (const w of [DESKTOP, PHONE]) {
    const eye = new Vector3(...w.eye.position);
    const slots = layout(dealt(2 * w.zones.middle.columns), { zones: w.zones });
    const far = Math.max(...slots.flatMap((s) => cardCorners(s.pose).map((c) => c.distanceTo(eye))));
    assert.ok(far < FOG.play[0], `${w.width}: a card ${far.toFixed(0)} cm off`);
  }
});
