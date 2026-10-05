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
import { DESKTOP_FOOT, cameraFor } from "../src/framing.js";
import { FOG } from "../src/reveal.js";
import { CAMERA, CAMERA_PORTRAIT, CAMERA_TOUCH, CARD, PITCH, ZONES, ZONES_PORTRAIT, ZONES_TOUCH } from "../src/units.js";

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
const camera = (w) => cameraFor(w.width / w.height, 0, w.height, w.strips, null, w.across ?? CAMERA);
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

// A row of cards (a phone's, a tablet's) is turned alike, so its end cards
// are seen a little more aslant than a fan's: within ten degrees.
test("your hand is seen straight on, and your opponent's backs", () => {
  for (const w of [DESKTOP, PHONE, { zones: ZONES_TOUCH, eye: CAMERA_TOUCH }]) {
    const slots = layout(dealt(), { zones: w.zones });
    const most = w.zones.yourHand.gap !== undefined ? 10 : 8;
    for (const s of slots.filter((x) => x.zone === "your-hand")) assert.ok(off(s, w.eye.position) < most, `your ${s.code}: ${off(s, w.eye.position).toFixed(1)} degrees off`);
    for (const s of slots.filter((x) => x.zone === "their-hand")) assert.ok(off(s, w.eye.position, -1) < 8, `their back: ${off(s, w.eye.position, -1).toFixed(1)} degrees off`);
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

test("your opponent's hand lies beyond the table's last row, so it hides none of it", () => {
  for (const w of [DESKTOP, PHONE]) {
    const at = screen(w, camera(w));
    for (const items of [w.zones.middle.columns, 2 * w.zones.middle.columns]) {
      const slots = layout(dealt(items), { zones: w.zones });
      const far = Math.min(...slots.filter((x) => x.zone === "middle").flatMap((s) => cardCorners(s.pose).map(at).map((p) => p.y)));
      const theirs = Math.max(...slots.filter((x) => x.zone === "their-hand").flatMap((s) => cardCorners(s.pose).map(at).map((p) => p.y)));
      assert.ok(theirs < far, `${w.width}, ${items} items: their hand reaches ${theirs.toFixed(0)} px, the last row ${far.toFixed(0)} px`);
    }
  }
});

// The sixth play-testing: "too much white space on the screen (desktop
// mode) - try to make the hand and the cards on the table bigger (zoom
// in?)". Across the table the eye is closer, and the room it kept for a
// second row of the table, needed at one move in eight, is taken back:
// your opponent's hand lies just beyond the first row and draws back when
// there is a second, partly out of the window's top. Your hand ends just
// above the controls' strip, whatever the window's height. Windows as a
// browser on a computer leaves them, and a tablet held sideways.
const ACROSS = [
  [1280, 800],
  [1440, 900],
  [1440, 790],
  [1366, 650],
  [1920, 960],
  [1180, 820],
  [1024, 768],
].map(([width, height]) => ({ width, height, zones: ZONES, eye: CAMERA }));
const extent = (w, items, zone, view = {}) => {
  const at = screen(w, camera(w));
  const points = layout(dealt(items), { zones: w.zones, ...view })
    .filter((x) => !zone || x.zone === zone)
    .flatMap((s) => cardCorners(s.pose).map(at));
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
};

test("across the table, the cards are larger: a table card a seventh of the window's height", () => {
  for (const w of ACROSS.filter((x) => x.width / x.height >= 1.5)) {
    const card = extent(w, 4, "middle");
    assert.ok(card.bottom - card.top >= w.height / 7, `${w.width}x${w.height}: a table card ${(card.bottom - card.top).toFixed(0)} px tall`);
  }
});

test("across the table, your hand ends above the controls' strip, and nothing runs off the sides", () => {
  for (const w of ACROSS) {
    const hand = extent(w, 4, "your-hand");
    assert.ok(hand.bottom <= w.height - DESKTOP_FOOT, `${w.width}x${w.height}: your hand ends at ${hand.bottom.toFixed(0)} px`);
    const all = extent({ ...w }, 2 * ZONES.middle.columns, null, { chosen: "7H" });
    const dealt12 = layout(dealt(2 * ZONES.middle.columns), { zones: ZONES });
    assert.ok(dealt12.some((s) => s.zone === "your-pile") && dealt12.some((s) => s.zone === "their-pile"));
    assert.ok(all.left >= 0 && all.right <= w.width, `${w.width}x${w.height}: the table spans ${all.left.toFixed(0)} to ${all.right.toFixed(0)} px`);
  }
});

test("across the table, your opponent's hand is in full view over one row, and two fifths of it over two", () => {
  for (const w of ACROSS) {
    const one = extent(w, ZONES.middle.columns, "their-hand");
    assert.ok(one.top >= 0, `${w.width}x${w.height}, one row: their hand from ${one.top.toFixed(0)} px`);
    const two = extent(w, 2 * ZONES.middle.columns, "their-hand");
    assert.ok(two.bottom >= 0.4 * (two.bottom - two.top) - 0.5, `${w.width}x${w.height}, two rows: their hand ${two.top.toFixed(0)} to ${two.bottom.toFixed(0)} px`);
  }
});

// The eye's reach, as tangents of its axis (units.js CAMERA.reach): what
// the layout truly reaches, to within a little.
test("the reach the framing keeps in view is what the table truly reaches", () => {
  const eye = new Vector3(...CAMERA.position);
  const forward = new Vector3(...CAMERA.target).sub(eye).normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const up = new Vector3().crossVectors(right, forward);
  const tangent = (c) => {
    const d = c.clone().sub(eye);
    return { x: d.dot(right) / d.dot(forward), y: d.dot(up) / d.dot(forward) };
  };
  const corners = (zone, items) => layout(dealt(items), { zones: ZONES }).filter((s) => !zone || s.zone === zone).flatMap((s) => cardCorners(s.pose).map(tangent));
  const foot = Math.max(...corners("your-hand", 4).map((t) => -t.y));
  // Never short of it, so nothing is cut off; and not loose.
  assert.ok(CAMERA.reach.foot >= foot && CAMERA.reach.foot - foot < 0.005, `foot ${CAMERA.reach.foot} against ${foot.toFixed(3)}`);
  const theirs = corners("their-hand", 2 * ZONES.middle.columns).map((t) => t.y);
  const twoFifths = Math.min(...theirs) + 0.4 * (Math.max(...theirs) - Math.min(...theirs));
  assert.ok(CAMERA.reach.up >= twoFifths && CAMERA.reach.up - twoFifths < 0.005, `up ${CAMERA.reach.up} against ${twoFifths.toFixed(3)}`);
  const across = Math.max(...corners(null, 2 * ZONES.middle.columns).map((t) => Math.abs(t.x)));
  assert.ok(CAMERA.widthTan >= across && CAMERA.widthTan - across < 0.02, `widthTan ${CAMERA.widthTan} against ${across.toFixed(3)}`);
});

test("your opponent's hand draws back from the middle by a row's depth when there is a second row", () => {
  const z = (items) => layout(dealt(items), { zones: ZONES }).find((s) => s.zone === "their-hand").pose.position.z;
  assert.equal(z(1), z(ZONES.middle.columns), "one row, however full");
  assert.ok(z(ZONES.middle.columns + 1) < z(ZONES.middle.columns) - 8, `${z(ZONES.middle.columns + 1)} against ${z(ZONES.middle.columns)}`);
});

test("the move bar has room between the table and your hand, across the table: its full height on a full window", () => {
  for (const w of ACROSS) {
    const { gap } = room(w);
    // moveBarFit: 40 to 84 px tall, with 7 px clear above and below.
    assert.ok(gap >= (w.height >= 900 ? 84 : 40) + 14, `${w.width}x${w.height}: ${gap.toFixed(0)} px`);
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

// The seventh play-testing: your hand spaced wide on a phone or a tablet,
// and "whatever size and spacing this turns out to be, try to Make the
// cards on the table this same size. plenty of whitespace to use." A card
// of your hand and a card of the table's first row are the same size on
// the screen, to within a tenth, held upright (a phone in a browser's
// window and with none, a tablet) or sideways (a tablet).
const TOUCH = [
  { width: 390, height: 664, strips: { top: 120, foot: 115 }, zones: ZONES_PORTRAIT, touch: true },
  { width: 390, height: 844, strips: { top: 120, foot: 115 }, zones: ZONES_PORTRAIT, touch: true },
  { width: 820, height: 1180, strips: { top: 120, foot: 115 }, zones: ZONES_PORTRAIT, touch: true },
  { width: 1180, height: 820, zones: ZONES_TOUCH, across: CAMERA_TOUCH, eye: CAMERA_TOUCH },
  { width: 1180, height: 740, zones: ZONES_TOUCH, across: CAMERA_TOUCH, eye: CAMERA_TOUCH },
];
// Tablets held sideways, as Safari leaves their windows and with none.
const TABLETS = [
  [1180, 820],
  [1180, 740],
  [1024, 768],
  [1024, 690],
  [1366, 1024],
  [1366, 950],
].map(([width, height]) => ({ width, height, zones: ZONES_TOUCH, across: CAMERA_TOUCH, eye: CAMERA_TOUCH }));
// A card's extent on the screen, across and up.
const cardSize = (w, zone) => {
  const at = screen(w, camera(w));
  const slot = layout(dealt(4), { zones: w.zones }).find((s) => s.zone === zone);
  const ps = cardCorners(slot.pose).map(at);
  const span = (k) => Math.max(...ps.map((p) => p[k])) - Math.min(...ps.map((p) => p[k]));
  return { w: span("x"), h: span("y") };
};
// The same size across, to a tenth; up, the table's card is shorter as it
// lies flat on the table, seen slanting, where your hand's cards are turned
// square to the eye, so to a fifth.
test("on a touch screen your hand's cards are the table's size", () => {
  for (const w of [...TOUCH, ...TABLETS]) {
    const hand = cardSize(w, "your-hand");
    const table = cardSize(w, "middle");
    assert.ok(Math.abs(hand.w / table.w - 1) <= 0.1 && hand.h / table.h <= 1.2, `${w.width}x${w.height}: your hand's cards ${hand.w.toFixed(0)}x${hand.h.toFixed(0)} px, the table's ${table.w.toFixed(0)}x${table.h.toFixed(0)}`);
  }
});

// The tablet's eye closes in on the table (the seventh play-testing:
// "plenty of whitespace to use"): its cards larger than a computer's at
// the same window, and all of it still in view.
test("a tablet held sideways: the table's cards larger than a computer's, and all of it in view", () => {
  for (const w of TABLETS) {
    const computer = { ...w, zones: ZONES, across: CAMERA, eye: CAMERA };
    assert.ok(cardSize(w, "middle").w >= 1.05 * cardSize(computer, "middle").w, `${w.width}x${w.height}: ${cardSize(w, "middle").w.toFixed(0)} px against ${cardSize(computer, "middle").w.toFixed(0)}`);
    const hand = extent(w, 4, "your-hand");
    assert.ok(hand.bottom <= w.height - DESKTOP_FOOT, `${w.width}x${w.height}: your hand ends at ${hand.bottom.toFixed(0)} px`);
    const all = extent(w, 2 * ZONES_TOUCH.middle.columns, null, { chosen: "7H" });
    assert.ok(all.left >= 0 && all.right <= w.width, `${w.width}x${w.height}: the table spans ${all.left.toFixed(0)} to ${all.right.toFixed(0)} px`);
    const one = extent(w, ZONES_TOUCH.middle.columns, "their-hand");
    assert.ok(one.top >= 0, `${w.width}x${w.height}, one row: their hand from ${one.top.toFixed(0)} px`);
    const two = extent(w, 2 * ZONES_TOUCH.middle.columns, "their-hand");
    assert.ok(two.bottom >= 0.4 * (two.bottom - two.top) - 0.5, `${w.width}x${w.height}, two rows: their hand ${two.top.toFixed(0)} to ${two.bottom.toFixed(0)} px`);
    const { gap } = room(w);
    assert.ok(gap >= (w.height >= 900 ? 84 : 40) + 14, `${w.width}x${w.height}: the move bar has ${gap.toFixed(0)} px`);
  }
});

test("the tablet's reach is what its table truly reaches", () => {
  const eye = new Vector3(...CAMERA_TOUCH.position);
  const forward = new Vector3(...CAMERA_TOUCH.target).sub(eye).normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const up = new Vector3().crossVectors(right, forward);
  const tangent = (c) => {
    const d = c.clone().sub(eye);
    return { x: d.dot(right) / d.dot(forward), y: d.dot(up) / d.dot(forward) };
  };
  const corners = (zone, items) => layout(dealt(items), { zones: ZONES_TOUCH }).filter((s) => !zone || s.zone === zone).flatMap((s) => cardCorners(s.pose).map(tangent));
  const foot = Math.max(...corners("your-hand", 4).map((t) => -t.y));
  assert.ok(CAMERA_TOUCH.reach.foot >= foot && CAMERA_TOUCH.reach.foot - foot < 0.005, `foot ${CAMERA_TOUCH.reach.foot} against ${foot.toFixed(3)}`);
  const theirs = corners("their-hand", 2 * ZONES_TOUCH.middle.columns).map((t) => t.y);
  const twoFifths = Math.min(...theirs) + 0.4 * (Math.max(...theirs) - Math.min(...theirs));
  assert.ok(CAMERA_TOUCH.reach.up >= twoFifths && CAMERA_TOUCH.reach.up - twoFifths < 0.005, `up ${CAMERA_TOUCH.reach.up} against ${twoFifths.toFixed(3)}`);
  // The piles' outer edges, and a sweep laid crosswise in them.
  const across = Math.max(...corners(null, 2 * ZONES_TOUCH.middle.columns).map((t) => Math.abs(t.x)));
  assert.ok(CAMERA_TOUCH.widthTan >= across + 0.01 && CAMERA_TOUCH.widthTan - across < 0.025, `widthTan ${CAMERA_TOUCH.widthTan} against ${across.toFixed(3)}`);
});
