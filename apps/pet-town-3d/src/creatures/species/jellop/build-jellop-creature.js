import { buildJellopHeartAndBody } from "./build-jellop-heart-and-body.js";
import { buildJellopLeafWrap } from "./build-jellop-leaf-wrap.js";
import { buildJellopEars } from "./build-jellop-ears.js";
/** Jellop translucent mochi geometry, internal heart, leaf wrap and gummy ears. */
import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
export function buildJellopCreature(palette) {
  let materials = getCreatureMaterials();
  let root = createCreatureRigRoot();
  let body = createCreatureBone(`body`, createCreatureBone(`bob`, root), [0, 0.15, 0]);
  let result = 0.34;
  let result2 = 0.25;
  let result3 = 0.31;
  buildJellopHeartAndBody.call(this, palette, body, materials, result, result2, result3);
  buildJellopLeafWrap.call(this, body, result2, result, result3, palette, materials);
  buildJellopEars.call(this, body, palette, materials);
  return {
    root: root,
    face: buildCreatureFace(createCreatureBone(`head`, body, [0, 0.15, 0]), {
      surface: {
        center: [0, 0, 0],
        radii: [result * 0.985, result2, result3 * 0.985],
      },
      eye: {
        style: `round`,
        yaw: 0.36,
        pitch: 0.28,
        size: [0.056, 0.07, 0.03],
        iris: palette.iris,
        top: 1706516,
        sink: 0.4,
      },
      blush: {
        yaw: 0.66,
        pitch: 0.02,
        size: [0.058, 0.034],
        color: palette.blush,
      },
      mouth: {
        style: `grin`,
        pitch: -0.02,
        w: 0.068,
      },
      happy: {
        eyes: `arc`,
        mouth: `bigGrin`,
      },
    }),
  };
}
