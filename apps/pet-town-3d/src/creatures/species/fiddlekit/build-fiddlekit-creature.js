import { buildFiddlekitBodyAndLegs } from "./build-fiddlekit-body-and-legs.js";
import { buildFiddlekitFernTail } from "./build-fiddlekit-fern-tail.js";
import { buildFiddlekitHead } from "./build-fiddlekit-head.js";
import { buildFiddlekitBeret } from "./build-fiddlekit-beret.js";
import { buildFiddlekitEars } from "./build-fiddlekit-ears.js";
/** Fiddlekit fox geometry, fern tail, acorn beret, ears and face. */

import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
export function buildFiddlekitCreature(palette) {
  let materials = getCreatureMaterials();
  let root = createCreatureRigRoot();
  let bob = createCreatureBone(`bob`, root);
  let body = createCreatureBone(`body`, bob, [0, 0.3, 0]);
  buildFiddlekitBodyAndLegs.call(this, palette, body, materials, bob);
  buildFiddlekitFernTail.call(this, body, palette, materials);
  let head, faceSurface, muzzleSurface;
  ({ head, faceSurface, muzzleSurface } = buildFiddlekitHead.call(this, body, palette, materials));
  buildFiddlekitBeret.call(this, head, palette, materials);
  buildFiddlekitEars.call(this, head, palette, materials);
  return {
    root: root,
    face: buildCreatureFace(head, {
      surface: faceSurface,
      eye: {
        style: `almond`,
        yaw: 0.37,
        pitch: 0.24,
        size: [0.056, 0.044, 0.026],
        roll: 0.32,
        iris: palette.iris,
        top: 2757640,
      },
      mouth: {
        style: `smile`,
        pitch: -0.42,
        yaw: 0,
        w: 0.024,
        surface: muzzleSurface,
        openScale: 0.9,
      },
      happy: {
        eyes: `arc`,
        mouth: `tongue`,
      },
    }),
  };
}
