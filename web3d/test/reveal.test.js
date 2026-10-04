// The game's end: the camera pulls back past the table's near edge, and
// your opponent turns out to be a court card standing across the table.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { Frustum, Matrix4, PerspectiveCamera, Vector3 } from "three";
import { COURTS, FIGURE, FOG, REVEAL_FAR, TABLE_EDGES, courtFor, figureHead, poseAt, revealPose } from "../src/reveal.js";
import { cameraFor } from "../src/framing.js";
import { PORTRAIT_BELOW, ZONES_PORTRAIT } from "../src/units.js";

const frustum = (camera) => {
  camera.updateMatrixWorld();
  return new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
};
const sees = (camera, points) => {
  const f = frustum(camera);
  return points.filter(([x, y, z]) => f.containsPoint(new Vector3(x, y, z)));
};
const posed = (pose, aspect) => {
  // The reveal's own clipping: a figure beyond its far plane is not drawn.
  const camera = new PerspectiveCamera(pose.fov, aspect, 20, REVEAL_FAR);
  camera.position.set(...pose.position);
  camera.lookAt(...pose.target);
  camera.updateProjectionMatrix();
  return camera;
};

const half = (FIGURE.height * FIGURE.aspect) / 2;
const figure = [
  [-half, FIGURE.bottom, FIGURE.z],
  [half, FIGURE.bottom, FIGURE.z],
  [-half, FIGURE.bottom + FIGURE.height, FIGURE.z],
  [half, FIGURE.bottom + FIGURE.height, FIGURE.z],
];
const nearEdge = [-40, 0, 40].map((x) => [x, 0, TABLE_EDGES.near]);
const farEdge = [-60, 0, 60].map((x) => [x, 0, TABLE_EDGES.far]);
const sides = [-1, 1].flatMap((s) => [-60, 0].map((z) => [s * TABLE_EDGES.half, 0, z]));
const ASPECTS = [0.46, 0.75, 1.6, 2.2];

test("your opponent is one of the twelve courts, chosen by the game's seed", () => {
  assert.equal(COURTS.length, 12);
  assert.equal(new Set(COURTS).size, 12);
  for (const suit of ["oros", "copas", "espadas", "bastos"]) for (const rank of ["sota", "caballo", "rey"]) assert.ok(COURTS.includes(`${suit}-${rank}`));
  assert.equal(courtFor(7), courtFor(7), "the same game, the same opponent");
  assert.equal(new Set([...Array(24).keys()].map(courtFor)).size, 12, "every court comes up");
});

// Seen in play: in the frame, and not yet lost in the air (the fog is whole
// at FOG.play[1] from the eye, where the table is the colour of the sky).
const shows = (camera, points) => sees(camera, points).filter((p) => camera.position.distanceTo(new Vector3(...p)) < FOG.play[1]);

test("in play the table has no edge in view: out of the frame, or lost in the air", () => {
  for (const aspect of [...ASPECTS, 3]) {
    const camera = cameraFor(aspect);
    assert.deepEqual(shows(camera, [...nearEdge, ...farEdge, ...sides]), [], `aspect ${aspect}`);
  }
  // The table's zones lie well inside its edges (a phone's stacked ones too).
  for (const [, zone] of Object.entries(ZONES_PORTRAIT)) {
    if (zone?.center) assert.ok(Math.abs(zone.center[0]) < TABLE_EDGES.half && zone.center[2] < TABLE_EDGES.near && zone.center[2] > TABLE_EDGES.far);
  }
});

test("pulled back, the near edge comes into view and your opponent stands whole across the table", () => {
  for (const aspect of ASPECTS) {
    const camera = posed(revealPose(aspect), aspect);
    assert.equal(sees(camera, figure).length, 4, `aspect ${aspect}: the whole figure`);
    // The near edge, where it is not under a phone's controls.
    if (aspect >= PORTRAIT_BELOW) assert.ok(sees(camera, nearEdge).length >= 1, `aspect ${aspect}: the near edge`);
    assert.ok(sees(camera, [figureHead()]).length === 1, "the head, where the balloon is anchored");
    for (const p of figure) assert.ok(camera.position.distanceTo(new Vector3(...p)) < FOG.reveal[0], "clear of the air");
  }
});

test("the way back: from the play's eye to the reveal's, smoothly", () => {
  const from = { position: [0, 55, 60], target: [0, 0, 0], fov: 40 };
  const to = revealPose(1.6);
  assert.deepEqual(poseAt(from, to, 0), from);
  assert.deepEqual(poseAt(from, to, 1), { position: to.position, target: to.target, fov: to.fov });
  const mid = poseAt(from, to, 0.5);
  for (let i = 0; i < 3; i++) assert.ok(Math.min(from.position[i], to.position[i]) <= mid.position[i] && mid.position[i] <= Math.max(from.position[i], to.position[i]));
});

test("the twelve courts are cut from the pinned scan, up to date", { skip: !existsSync("/usr/bin/python3") && "no python3" }, () => {
  execFileSync("python3", [new URL("../tools/courts.py", import.meta.url).pathname, "--check"]);
});
