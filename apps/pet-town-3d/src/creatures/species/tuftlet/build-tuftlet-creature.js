import { buildTuftletBody } from "./build-tuftlet-body.js";
import { buildTuftletLimbsAndTail } from "./build-tuftlet-limbs-and-tail.js";
import { buildTuftletHead } from "./build-tuftlet-head.js";
import { buildTuftletJawAndCrest } from "./build-tuftlet-jaw-and-crest.js";
/** Tuftlet finch geometry, wing markings, beak, jaw and crest. */
import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
export function buildTuftletCreature(palette) {
  let materials = getCreatureMaterials();
  let root = createCreatureRigRoot();
  let bob = createCreatureBone(`bob`, root);
  let body = createCreatureBone(`body`, bob, [0, 0.27, 0]);
  buildTuftletBody.call(this, palette, body, materials);
  buildTuftletLimbsAndTail.call(this, bob, palette, materials, body);
  let head, faceSurface;
  ({ head, faceSurface } = buildTuftletHead.call(this, body, palette, materials));
  buildTuftletJawAndCrest.call(this, head, palette, materials);
  return {
    root: root,
    face: buildCreatureFace(head, {
      surface: faceSurface,
      eye: {
        style: `bead`,
        yaw: 0.5,
        pitch: 0.16,
        size: [0.03, 0.03, 0.02],
        iris: 2763322,
        top: 657938,
      },
      blush: {
        yaw: 0.72,
        pitch: -0.1,
        size: [0.062, 0.045],
        color: palette.cheek,
      },
      mouth: {
        style: `none`,
      },
      happy: {
        eyes: `arc`,
      },
    }),
  };
}
