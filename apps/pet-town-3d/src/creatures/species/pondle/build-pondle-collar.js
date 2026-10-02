import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createPondleLilyPadGeometry } from "./create-pondle-lily-pad-geometry.js";
export function buildPondleCollar(body, palette, materials) {
  let configureCreatureJiggleBoneResult = configureCreatureJiggleBone(
    createCreatureBone(`collar`, body, [0, 0.235, 0.2], [1.05, 0, 0]),
    {
      dir: [0, 0.2, 1],
      len: 0.12,
      k: 170,
      d: 11,
      limit: 0.2,
    },
  );
  let pondleLilyPadGeometryResult = createPondleLilyPadGeometry(0.135, 0.035, 0.7, 0.8);
  pondleLilyPadGeometryResult.rotateY(Math.PI / 2);
  pondleLilyPadGeometryResult.translate(0, 0, 0.035);
  colorCreatureGeometryVertices(pondleLilyPadGeometryResult, (lerpValue3, position3, yValue5) => {
    let hypotResult = Math.hypot(position3.x, position3.z - 0.035);
    let atan2Result = Math.atan2(position3.z - 0.035, position3.x);
    lerpCreatureRigColor(
      lerpValue3,
      palette.pad,
      palette.padLight,
      smoothstepCreatureValue(0.04, 0.14, hypotResult),
    );
    let result6 =
      (1 - smoothstepCreatureValue(0, 0.16, Math.abs(Math.sin(atan2Result * 5)))) *
      smoothstepCreatureValue(0.04, 0.07, hypotResult) *
      smoothstepCreatureValue(0, 0.6, yValue5.y);
    lerpValue3.lerp(getCreatureColor(palette.padVein), result6 * 0.7);
    lerpValue3.lerp(
      getCreatureColor(15792856),
      smoothstepCreatureValue(0.125, 0.138, hypotResult) * 0.5,
    );
    lerpValue3.multiplyScalar(yValue5.y < -0.2 ? 0.8 : 1);
  });
  addCreatureBoneMesh(
    configureCreatureJiggleBoneResult,
    pondleLilyPadGeometryResult,
    materials.body,
  );
}
