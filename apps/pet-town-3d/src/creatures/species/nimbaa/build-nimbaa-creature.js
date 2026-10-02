import { buildNimbaaWool } from "./build-nimbaa-wool.js";
import { buildNimbaaLegs } from "./build-nimbaa-legs.js";
import { buildNimbaaCloudTail } from "./build-nimbaa-cloud-tail.js";
import { buildNimbaaHead } from "./build-nimbaa-head.js";
import { buildNimbaaTuftAndEars } from "./build-nimbaa-tuft-and-ears.js";
/** Nimbaa lamb geometry, wool clusters, moon horns, cloud tail and face. */
import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
export function buildNimbaaCreature(palette) {
  let materials = getCreatureMaterials();
  let root = createCreatureRigRoot();
  let bob = createCreatureBone(`bob`, root);
  let body = createCreatureBone(`body`, bob, [0, 0.39, 0]);
  buildNimbaaWool.call(this, palette, body, materials);
  buildNimbaaLegs.call(this, bob, materials, palette);
  buildNimbaaCloudTail.call(this, body, palette, materials);
  let head, faceSurface, muzzleSurface;
  ({ head, faceSurface, muzzleSurface } = buildNimbaaHead.call(this, body, palette, materials));
  buildNimbaaTuftAndEars.call(this, palette, head, materials);
  return {
    root: root,
    face: buildCreatureFace(head, {
      surface: faceSurface,
      eye: {
        style: `round`,
        yaw: 0.42,
        pitch: 0.14,
        size: [0.058, 0.072, 0.032],
        iris: palette.iris,
        top: 1380138,
      },
      blush: {
        yaw: 0.74,
        pitch: -0.14,
        size: [0.058, 0.036],
        color: 16747174,
      },
      mouth: {
        style: `cat`,
        pitch: -0.35,
        w: 0.022,
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
