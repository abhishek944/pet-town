import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
import { createBirdFeather } from "./create-bird-feather.js";
import { createBirdFacialDisc } from "./create-bird-facial-disc.js";

export function buildHushHead(body, palette, materials) {
  const head = createCreatureBone("head", body, [0, 0.57, 0.065]);
  const surface = { center: [0, 0, 0], radii: [0.315, 0.285, 0.26] };
  const ellipsoid = (radii, color, position, rotation = [0, 0, 0]) =>
    transformCreatureGeometry(
      fillCreatureGeometryColor(createCreatureEllipsoidGeometry(...radii, 24, 18), color),
      position,
      rotation,
    );
  const pieces = [createBirdFacialDisc(palette.back, palette.face)];
  const eyes = [-1, 1].map((side) => ({
    center: [side * 0.12, 0.025, 0.242],
    radii: [0.097, 0.108, 0.025],
  }));
  for (const [i, eye] of eyes.entries()) {
    const side = i ? 1 : -1;
    pieces.push(ellipsoid(eye.radii, palette.face, eye.center));
    pieces.push(
      ellipsoid(
        [0.056, 0.032, 0.009],
        palette.cheek,
        [side * 0.192, -0.079, 0.217],
        [0, side * 0.4, side * 0.08],
      ),
    );
  }
  // A soft swept fringe replaces the spiky central crown.
  for (let i = 0; i < 3; i++) {
    pieces.push(
      createBirdFeather(
        0.036,
        0.11 - i * 0.018,
        palette.back,
        palette.cover,
        [(i - 1) * 0.034, 0.253, -0.035],
        [-0.65, 0.8, -0.2],
        -0.2,
      ),
    );
  }
  for (const side of [-1, 1]) {
    pieces.push(
      createBirdFeather(
        0.041,
        0.09,
        palette.back,
        palette.back,
        [side * 0.24, 0.15, -0.025],
        [side * 0.65, 0.65, -0.28],
        side * 0.25,
      ),
    );
  }
  // A short cupped beak reads as an owl beak rather than a button nose.
  pieces.push(
    createBirdFeather(
      0.033,
      0.072,
      palette.beak,
      palette.beakTip,
      [0, -0.045, 0.255],
      [0, -0.36, 1],
    ),
  );
  addCreatureBoneMesh(
    head,
    mergeCreatureGeometries(pieces),
    materials.fluff,
    null,
    null,
    "hushHead",
  );
  const face = buildCreatureFace(head, {
    surface,
    eye: {
      surfaces: eyes,
      style: "bulge",
      yaw: 0.025,
      pitch: -0.015,
      size: [0.073, 0.083, 0.017],
      iris: palette.iris,
      top: 0x382e3d,
      pupil: 0.67,
      sink: 0.1,
    },
    mouth: { style: "none" },
    happy: { eyes: "arc" },
  });
  // Lids graze the upper eye edge; the pupils stay fully visible and friendly.
  for (const eye of face.eyes) {
    addCreatureBoneMesh(
      eye.open,
      ellipsoid([0.073, 0.021, 0.012], palette.face, [0, 0.079, 0.012]),
      materials.fluff,
      null,
      null,
      "softUpperLid",
    );
  }
  return face;
}
