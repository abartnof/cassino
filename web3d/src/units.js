// From piquet web3d/src/units.js @ 254cb3c.
// Space: units, the table, the camera, the zones -- one source of truth.
//
// Centimetres throughout. y is up and the table top is y = 0; the human sits
// at +z, the opponent at -z, and x runs to the human's right
// (docs/TABLE3D.md section 6).

// A poker-size card, 2.5 x 3.5 in: exactly the 5:7 of the face art.
export const CARD = Object.freeze({
  width: 6.35,
  height: 8.89,
  radius: 0.3175, // 5% of the width, as in the art
  thickness: 0.03,
});

// The implied table: a large pale slab whose edge falls away out of sight.
export const TABLE = Object.freeze({
  width: 140,
  depth: 100,
});

// The eye looks down at the table at PITCH degrees to it (90 would be
// straight down). Play-testing found the cards "too hard to see, esp. in
// mobile mode" from the old eyes, at 42 degrees across the table and 29 on a
// phone, and asked for the camera higher, at 70 or 80: at 70 a card on the
// table is foreshortened by only 6 per cent, against 32 and 52, and the
// table still has some depth. Both hands are turned square to the eye
// (`facingEye`, below), as the play-testing asked.
export const PITCH = 70;
const DEG = Math.PI / 180;
// The eye `distance` from `target`, back toward you and up, at PITCH.
const over = (target, distance) =>
  Object.freeze([target[0], target[1] + distance * Math.sin(PITCH * DEG), target[2] + distance * Math.cos(PITCH * DEG)]);
// The tilt, in degrees, that turns a hand held at `centre` square to the
// eye: how far it leans back from upright (layout.js, kinematics.js fan).
export const facingEye = (eye, centre) => Math.atan2(eye[1] - centre[1], eye[2] - centre[2]) / DEG;

// The human's eyes, high over the table and looking down at a point a
// little beyond its middle, so that your hand, your opponent's beyond the
// middle's last row, and the move bar between the table and your hand all
// fit between the window's top and the prompt (test/eye.test.js). The sixth
// play-testing found "too much white space on the screen (desktop mode)":
// the field is 31 degrees (from 40), the cards a third larger, and the
// room kept for a second row of the table is no longer kept empty (your
// opponent's hand draws back over it when it is needed, ZONES below).
const TARGET = Object.freeze([0, 0, -14]);
export const CAMERA = Object.freeze({
  position: over(TARGET, 102),
  target: TARGET,
  fov: 31, // vertical, degrees
  // Nothing comes nearer the eye than about 45 cm; a near plane at 20 keeps
  // the depth buffer fine enough to tell a card from the one it lies on.
  near: 20,
  far: 400,
  maxPixelRatio: 2,
  // The table's half-width the view must keep, as the tangent of half the
  // horizontal field: the piles' outer edges, with a little to spare
  // (test/eye.test.js), so a squarer window widens the field.
  widthTan: 0.4,
  // What must be in view, as tangents of the eye's axis: up, two fifths of
  // your opponent's hand drawn back over a second row; down (`foot`), your
  // hand's lowest corner. The field widens on a short window to keep them
  // between its top and the controls' strip, and the picture is lifted so
  // that your hand ends just above the strip (framing.js; test/eye.test.js
  // measures both).
  reach: Object.freeze({ up: 0.252, foot: 0.239 }),
});

// The eye across the table on a tablet (ZONES_TOUCH, below): where your
// hand lies in a row, the table's size, near the table (the seventh
// play-testing), and the piles have come in from the far edges, so the
// field closes in on the table: the cards about a tenth larger, as wide a
// view as the table needs (`widthTan`, the piles' outer edges and a sweep
// laid crosswise in them) and as tall (`reach`, your hand's lowest corner
// now near the table), the eye where it was (test/eye.test.js measures
// both).
export const CAMERA_TOUCH = Object.freeze({
  ...CAMERA,
  fov: 24,
  widthTan: 0.365,
  reach: Object.freeze({ up: 0.256, foot: 0.199 }),
});

// The eye for a phone held upright, over the stacked arrangement of
// ZONES_PORTRAIT (cassino's, below; the reach is measured for it). Its field is not fixed: framing.js fits it to the band the
// overlay leaves, from `reach` -- how far the table's cards reach from the
// eye's axis, up, down and to the side, as tangents, over whole parties
// (the staging test measures it, and holds it to the table).
const TARGET_PORTRAIT = Object.freeze([0, 0, -16]);
export const CAMERA_PORTRAIT = Object.freeze({
  position: over(TARGET_PORTRAIT, 90),
  target: TARGET_PORTRAIT,
  reach: Object.freeze({ up: 0.293, down: -0.345, across: 0.301 }),
  // Your hand's own reach across -- with its cards raised, and as it is held
  // in play -- and how much more it reaches for each unit its fan is
  // lengthened (layout.js `fill`): framing.js lengthens it to take whatever
  // width the window has to spare. Measured by the staging test; `perFill`
  // is the steepest rate, so the hand never overruns.
  // Cassino's hand is laid out at one length (no `fill`): its reach is
  // within the table's.
  hand: Object.freeze({ across: 0.2, still: 0.2, perFill: 0.2 }),
});

// Narrower than this, the table is laid out for a phone held upright.
export const PORTRAIT_BELOW = 0.85;

// Where everything rests at the cassino table (docs/TABLE3D.md section 5),
// in centimetres on the table. Hands are fans floating before their holders;
// the rest lies flat. Replaces piquet's zones: the middle of the table is the
// game here, not the tricks.
export const ZONES = Object.freeze({
  // Where the eye is that sees this arrangement.
  eye: CAMERA.position,
  // Both hands turned square to the eye (play-testing): yours leaning back
  // toward you, your opponent's tipped toward you, its backs to the eye
  // (`lean`, from upright). Your opponent's lies beyond the middle's second
  // row, so it hides none of it.
  // Your opponent's lies just beyond the middle's first row, and `back` cm
  // further off for each row past it (layout.js), partly out of the
  // window's top over a second row (the sixth play-testing: the empty room
  // kept for a second row, needed at one move in eight, was white space).
  yourHand: Object.freeze({ centre: Object.freeze([0, 17, 6.7]), radius: 16, spread: 5.6, lean: facingEye(CAMERA.position, [0, 17, 6.7]) }),
  theirHand: Object.freeze({ centre: Object.freeze([0, 5, -30]), back: 12, radius: 16, spread: 5.2, lean: facingEye(CAMERA.position, [0, 5, -30]) }),
  // The middle: items on a grid in arrival order, at most `columns` to a
  // row, the first row nearest you and later rows away from you: a row
  // nearer than this would lie under your floating hand, as the eye sees
  // it, and could not be tapped.
  // Cassino's change after play-testing: further from you (from -7), for
  // the move bar's large buttons between the table and your hand, clear of
  // a card chosen and standing up out of the hand.
  middle: Object.freeze({ x: 0, z: -17, columns: 6, gapX: 1.8, gapZ: 2.2 }),
  // A build's cards, each laid down and to the right of the last, enough
  // that every card's index and a strip of its face show: a ten of
  // diamonds in a build should be seen at a glance.
  stack: Object.freeze({ dx: 1.5, dz: 2 }),
  // Each player's captures, squared and face down at their right; sweep
  // cards crosswise in the pile, each offset a little from the last. Yours,
  // and your stock, clear of the window's foot, where the aids are.
  yourPile: Object.freeze({ x: 34, z: 0, sweepStep: 1.4 }),
  theirPile: Object.freeze({ x: -34, z: -20, sweepStep: 1.4 }),
  // The count row: a finished hand's counted aces and Cassinos, face up from
  // their taker's pile toward the middle, `first` from the pile and `step`
  // apart.
  count: Object.freeze({ first: 10, step: 7.75 }),
  // The stock, at the dealer's left: yours on your left, theirs on their left
  // (your right).
  stock: Object.freeze({ you: Object.freeze({ x: -34, z: 0 }), them: Object.freeze({ x: 34, z: -20 }) }),
});

// The table for a phone held upright, under CAMERA_PORTRAIT, seen from
// above: the middle five items wide, so ten lie in two rows (99.6 per cent
// of tables in play); your opponent's hand beyond them, its pile and stock
// beside it; your hand a row of cards spaced `gap` apart, not fanned (the
// seventh play-testing: "On mobile and ipad, don't bother fanning the
// cards in the player's hand, just space them wide"), lying just off the
// table and just nearer you than its first row, so its cards are the
// table's size ("try to Make the cards on the table this same size"),
// with your pile and stock beside it; and between the middle and your
// hand, room for the move bar (test/eye.test.js). Your hand no longer
// held up close to the eye, the field closes in, and the table's cards
// are larger. The count rows overlap so all six cards fit across. The
// camera's reach (above) is measured over whole games by the staging test
// (test/staging.test.js).
const YOURS_PORTRAIT = Object.freeze([0, 1.2, 8.5]);
const THEIRS_PORTRAIT = Object.freeze([0, 5, -37.5]);
export const ZONES_PORTRAIT = Object.freeze({
  eye: CAMERA_PORTRAIT.position,
  yourHand: Object.freeze({ centre: YOURS_PORTRAIT, gap: 2, lean: facingEye(CAMERA_PORTRAIT.position, YOURS_PORTRAIT) }),
  theirHand: Object.freeze({ centre: THEIRS_PORTRAIT, radius: 12, spread: 4.5, lean: facingEye(CAMERA_PORTRAIT.position, THEIRS_PORTRAIT) }),
  middle: Object.freeze({ x: 0, z: -12, columns: 5, gapX: 0.8, gapZ: 1.4 }),
  stack: Object.freeze({ dx: 1.2, dz: 1.8 }),
  yourPile: Object.freeze({ x: 20, z: 8.5, sweepStep: 1 }),
  theirPile: Object.freeze({ x: -16, z: -37.5, sweepStep: 1 }),
  count: Object.freeze({ first: 7, step: 3.9 }),
  stock: Object.freeze({ you: Object.freeze({ x: -20, z: 8.5 }), them: Object.freeze({ x: 16, z: -37.5 }) }),
});

// A tablet held sideways (touch, across the table): ZONES, with your hand
// a row spaced wide, not fanned, lying just off the table between the
// move bar and the window's foot, so that its cards are the table's size
// (the seventh play-testing: "On mobile and ipad, don't bother fanning the
// cards in the player's hand, just space them wide. whatever size and
// spacing this turns out to be, try to Make the cards on the table this
// same size. plenty of whitespace to use."); the middle five items wide,
// and the piles and the stocks in from the edges, for CAMERA_TOUCH's
// closer field.
const YOURS_TOUCH = Object.freeze([0, 1.2, 1.5]);
export const ZONES_TOUCH = Object.freeze({
  ...ZONES,
  eye: CAMERA_TOUCH.position,
  yourHand: Object.freeze({ centre: YOURS_TOUCH, gap: 2, lean: facingEye(CAMERA_TOUCH.position, YOURS_TOUCH) }),
  middle: Object.freeze({ ...ZONES.middle, columns: 5 }),
  yourPile: Object.freeze({ ...ZONES.yourPile, x: 30, z: YOURS_TOUCH[2] }),
  theirPile: Object.freeze({ ...ZONES.theirPile, x: -30 }),
  stock: Object.freeze({ you: Object.freeze({ x: -30, z: YOURS_TOUCH[2] }), them: Object.freeze({ x: 30, z: ZONES.stock.them.z }) }),
});
