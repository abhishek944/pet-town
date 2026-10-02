import { buildLumbleFluff } from "./build-lumble-fluff.js";
import { buildLumbleTailAndLegs } from "./build-lumble-tail-and-legs.js";
import { buildLumbleWings } from "./build-lumble-wings.js";
import { buildLumbleHead } from "./build-lumble-head.js";
import { buildLumbleAntennae } from "./build-lumble-antennae.js";
/** Lumble moth geometry, wing gradients, glowing spots, antennae and face. */
import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
export function buildLumbleCreature(palette) {
  let materials = getCreatureMaterials();
  let root = createCreatureRigRoot();
  let bob = createCreatureBone(`bob`, root);
  let body = createCreatureBone(`body`, bob, [0, 0.3, 0]);
  buildLumbleFluff.call(this, palette, body, materials);
  buildLumbleTailAndLegs.call(this, palette, body, materials, bob);
  buildLumbleWings.call(this, body, palette, materials);
  let head, faceSurface;
  ({ head, faceSurface } = buildLumbleHead.call(this, body, palette, materials));
  buildLumbleAntennae.call(this, head, palette, materials);
  return {
    root: root,
    face: buildCreatureFace(head, {
      surface: faceSurface,
      eye: {
        style: `round`,
        yaw: 0.4,
        pitch: 0.05,
        size: [0.052, 0.064, 0.028],
        iris: palette.iris,
        top: 1707822,
      },
      mouth: {
        style: `smile`,
        pitch: -0.36,
        w: 0.018,
      },
      happy: {
        eyes: `arc`,
        mouth: `bigGrin`,
      },
    }),
  };
}
