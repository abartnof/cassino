// The game's end (play-testing: "the camera pulls back, and you see that just
// beyond the camera was the edge of a table, and your opponent was one of
// these cards"): which court your opponent turns out to be, where the
// table's edges and the figure stand, and the camera's way back to see them.
// Pure, so tested on paper; scene.js draws it and main.js times it.
//
// The courts are cut from a Spanish-suited pack of about 1760
// (web3d/tools/courts.py, CREDITS.md): coins, cups, swords and clubs, each
// with its sota (jack), caballo (horseman) and rey (king).

import { PORTRAIT_BELOW } from "./units.js";

export const COURTS = Object.freeze(
  ["oros", "copas", "espadas", "bastos"].flatMap((suit) => ["sota", "caballo", "rey"].map((rank) => `${suit}-${rank}`)),
);

const SUIT = { oros: "coins", copas: "cups", espadas: "swords", bastos: "clubs" };
const RANK = { sota: "jack", caballo: "horseman", rey: "king" };
// "the king of coins", for the figure's title.
export const courtName = (court) => {
  const [suit, rank] = court.split("-");
  return `the ${RANK[rank]} of ${SUIT[suit]}`;
};

// The same game, the same opponent.
export const courtFor = (seed) => COURTS[(Number(seed) >>> 0) % COURTS.length];

// The table as the reveal shows it, in centimetres (units.js): its near edge
// just behind your seat, out of the play's view; its far edge and sides out
// of it too, or so far off that they are lost in the air (FOG), so in play
// the table still has no edge.
export const TABLE_EDGES = Object.freeze({ near: 70, far: -200, half: 150, thickness: 5 });

// Your opponent: a court card as tall as a person sitting across the table,
// standing on the table's far side and facing you, in the scan's Spanish
// proportions (219 x 342). Shown only at the reveal.
export const FIGURE = Object.freeze({ height: 100, aspect: 219 / 342, z: -150, bottom: 0 });
// Where its balloon is anchored: the head, high on the card.
export const figureHead = () => [0, FIGURE.bottom + FIGURE.height * 0.84, FIGURE.z];

// The far clipping plane at the reveal: the play's (units.js CAMERA.far,
// 400 cm) would cut the figure off.
export const REVEAL_FAR = 1200;

// How long the camera takes to pull back.
export const REVEAL_MS = 2600;
// In play the table fades into the air; at the reveal the air clears, so
// the figure and the table's far edge are seen.
export const FOG = Object.freeze({ play: Object.freeze([110, 260]), reveal: Object.freeze([520, 1200]) });

// The camera at the end: back past the near edge and up, looking down the
// table to the figure. On a window narrower than PORTRAIT_BELOW (a phone
// held upright, units.js), further back and aimed higher, so the figure
// sits whole in the short band between the score and the controls.
export function revealPose(aspect = 1.6) {
  if (aspect < PORTRAIT_BELOW) return { position: [0, 130, 270], target: [0, 50, -90], fov: 46 };
  return { position: [0, 105, 215], target: [0, 28, -80], fov: 46 };
}

// The camera on its way: `u` from 0 (the play's eye) to 1 (the reveal's).
export function poseAt(from, to, u) {
  const mix = (a, b) => a.map((v, i) => v + (b[i] - v) * u);
  return { position: mix(from.position, to.position), target: mix(from.target, to.target), fov: from.fov + (to.fov - from.fov) * u };
}
