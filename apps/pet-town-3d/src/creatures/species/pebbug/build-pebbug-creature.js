import { buildPebbugShell } from "./build-pebbug-shell.js";
import { buildPebbugCrystalsAndMoss } from "./build-pebbug-crystals-and-moss.js";
import { buildPebbugFlowerAndLegs } from "./build-pebbug-flower-and-legs.js";
import { buildPebbugHead } from "./build-pebbug-head.js";
/** Pebbug beetle geometry, stone shell cells, moss, crystals, legs and flower. */

import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
export function buildPebbugCreature(palette) {
  let materials = getCreatureMaterials();
  let root = createCreatureRigRoot();
  let bob = createCreatureBone(`bob`, root);
  let body = createCreatureBone(`body`, bob, [0, 0.2, 0]);
  buildPebbugShell.call(this, palette, body, materials);
  buildPebbugCrystalsAndMoss.call(this, palette, body, materials);
  buildPebbugFlowerAndLegs.call(this, body, palette, materials, bob);
  let head, faceSurface, muzzleSurface;
  ({ head, faceSurface, muzzleSurface } = buildPebbugHead.call(this, body, palette, materials));
  return {
    root: root,
    face: buildCreatureFace(head, {
      surface: faceSurface,
      eye: {
        style: `shy`,
        yaw: 0.36,
        pitch: 0.06,
        size: [0.036, 0.044, 0.022],
        iris: palette.iris,
        top: 1708048,
      },
      mouth: {
        style: `o`,
        pitch: -0.6,
        w: 0.014,
        surface: muzzleSurface,
        openScale: 1.2,
      },
      blush: {
        yaw: 0.62,
        pitch: -0.16,
        size: [0.042, 0.026],
        color: 16747146,
        happyOnly: true,
      },
      happy: {
        eyes: `squeeze`,
        mouth: `smile`,
      },
    }),
  };
}
