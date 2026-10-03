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

// The human's eyes, looking down the table at a point a little in front of
// its centre.
export const CAMERA = Object.freeze({
  position: Object.freeze([0, 55, 60]),
  target: Object.freeze([0, 0, 0]),
  fov: 40, // vertical, degrees
  // Nothing comes nearer the eye than about 45 cm; a near plane at 20 keeps
  // the depth buffer fine enough to tell a card from the one it lies on.
  near: 20,
  far: 400,
  maxPixelRatio: 2,
  // The table's half-width the view must keep, as the tangent of half the
  // horizontal field: what 40 degrees shows at 16:10 across the whole window.
  widthTan: 0.44,
});

// The eye for a phone held upright, over the stacked arrangement of
// ZONES_PORTRAIT. Its field is not fixed: framing.js fits it to the band the
// overlay leaves, from `reach` -- how far the table's cards reach from the
// eye's axis, up, down and to the side, as tangents, over whole parties
// (the staging test measures it, and holds it to the table).
export const CAMERA_PORTRAIT = Object.freeze({
  position: Object.freeze([0, 40, 72]),
  target: Object.freeze([0, 0, 0]),
  reach: Object.freeze({ up: 0.165, down: -0.334, across: 0.244 }),
  // Your hand's own reach across -- with its cards raised, and as it is held
  // in play -- and how much more it reaches for each unit its fan is
  // lengthened (layout.js `fill`): framing.js lengthens it to take whatever
  // width the window has to spare. Measured by the staging test; `perFill`
  // is the steepest rate, so the hand never overruns.
  hand: Object.freeze({ across: 0.298, still: 0.289, perFill: 0.192 }),
});

// Narrower than this, the table is laid out for a phone held upright.
export const PORTRAIT_BELOW = 0.85;

// Where everything rests at the cassino table (docs/TABLE3D.md section 5),
// in centimetres on the table. Hands are fans floating before their holders;
// the rest lies flat. Replaces piquet's zones: the middle of the table is the
// game here, not the tricks.
export const ZONES = Object.freeze({
  // Both hands held as piquet's are: at 75 degrees to the table, leaning back
  // 15 from upright toward their holder.
  yourHand: Object.freeze({ centre: Object.freeze([0, 16, 26]), radius: 16, spread: 5.6, lean: 15 }),
  theirHand: Object.freeze({ centre: Object.freeze([0, 12, -22]), radius: 16, spread: 5.2, lean: 15 }),
  // The middle: items on a grid in arrival order, filling rows from the
  // centre line outward, at most `columns` to a row.
  middle: Object.freeze({ x: 0, z: -7, columns: 6, gapX: 1.8, gapZ: 2.2 }),
  // A build's cards, each laid a little down and to the right of the last,
  // so every index shows.
  stack: Object.freeze({ dx: 0.9, dz: 1.3 }),
  // Each player's captures, squared and face down at their right; sweep
  // cards crosswise in the pile, each offset a little from the last.
  yourPile: Object.freeze({ x: 34, z: 6, sweepStep: 1.4 }),
  theirPile: Object.freeze({ x: -34, z: -20, sweepStep: 1.4 }),
  // The stock, at the dealer's left: yours on your left, theirs on their left
  // (your right).
  stock: Object.freeze({ you: Object.freeze({ x: -34, z: 6 }), them: Object.freeze({ x: 34, z: -20 }) }),
});
