import { buildPondleBody } from "./build-pondle-body.js";
import { buildPondleLimbs } from "./build-pondle-limbs.js";
import { buildPondleHead } from "./build-pondle-head.js";
import { buildPondleCollar } from "./build-pondle-collar.js";
/** Pondle frog geometry, lily-pad collar, feet and eyes. */
import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
export function buildPondleCreature(palette) {
  let materials = getCreatureMaterials();
  let root = createCreatureRigRoot();
  let bob = createCreatureBone(`bob`, root);
  let body = createCreatureBone(`body`, bob, [0, 0.2, 0], [-0.16, 0, 0]);
  buildPondleBody.call(this, palette, body, materials);
  buildPondleLimbs.call(this, bob, palette, materials);
  let head, faceSurface, values2;
  ({ head, faceSurface, values2 } = buildPondleHead.call(this, body, palette, materials));
  buildPondleCollar.call(this, body, palette, materials);
  return {
    root: root,
    face: buildCreatureFace(head, {
      surface: faceSurface,
      eye: {
        style: `bulge`,
        yaw: 0.2,
        pitch: 0.12,
        size: [0.072, 0.074, 0.05],
        iris: palette.iris,
        top: palette.irisRim,
        surfaces: values2,
        sink: 0.2,
        pupil: 0.55,
      },
      blush: {
        yaw: 0.62,
        pitch: -0.12,
        size: [0.05, 0.03],
        color: 16747146,
      },
      mouth: {
        style: `wide`,
        pitch: -0.26,
        w: 0.09,
        ink: 0.007,
        openScale: 0.45,
        openDrop: 0.08,
      },
      happy: {
        eyes: `arc`,
        mouth: `grinTongue`,
      },
    }),
  };
}
