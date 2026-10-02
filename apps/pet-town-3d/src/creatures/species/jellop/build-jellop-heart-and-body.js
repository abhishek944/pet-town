import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { createJellopHeartGeometry } from "./create-jellop-heart-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { hashCreatureCoordinates } from "../../math/hash-creature-coordinates.js";
export function buildJellopHeartAndBody(palette, body, materials, result, result2, result3) {
  let jellopHeartGeometryResult = createJellopHeartGeometry(0.035);
  colorCreatureGeometryVertices(jellopHeartGeometryResult, (lerpValue, yValue, yValue2) => {
    lerpCreatureRigColor(
      lerpValue,
      palette.heartLo,
      palette.heart,
      smoothstepCreatureValue(-0.04, 0.05, yValue.y),
    );
    lerpValue.lerp(
      getCreatureColor(16777215),
      smoothstepCreatureValue(0.6, 1, yValue2.y * 0.6 + yValue2.z * 0.4) * 0.25,
    );
  });
  let addCreatureBoneMeshResult = addCreatureBoneMesh(
    createCreatureBone(`heart`, body, [0, 0.1, -0.02]),
    jellopHeartGeometryResult,
    materials.heart,
    null,
    null,
    `core`,
  );
  addCreatureBoneMeshResult.userData.bucket = `inner`;
  let creatureBodyGeometryResult = createCreatureBodyGeometry(result, result2, result3, {
    taper: 0.08,
    flat: 0.85,
    ws: 36,
    hs: 26,
  });
  colorCreatureGeometryVertices(creatureBodyGeometryResult, (lerpValue2, position2, yValue3) => {
    lerpCreatureRigColor(
      lerpValue2,
      palette.lo,
      palette.hi,
      smoothstepCreatureValue(-0.15, 0.22, position2.y),
    );
    lerpValue2.lerp(
      getCreatureColor(palette.hi),
      smoothstepCreatureValue(0.5, 1, yValue3.y) * 0.35,
    );
    let result4 =
      smoothstepCreatureValue(0.55, 0.9, yValue3.y) *
      smoothstepCreatureValue(
        0.62,
        0.7,
        hashCreatureCoordinates(Math.round(position2.x * 90), Math.round(position2.z * 90), 3),
      );
    lerpValue2.lerp(getCreatureColor(palette.dust), result4 * 0.8);
  });
  let addCreatureBoneMeshResult2 = addCreatureBoneMesh(
    body,
    creatureBodyGeometryResult,
    materials.jelly,
    null,
    null,
    `jelly`,
  );
  addCreatureBoneMeshResult2.renderOrder = 3;
}
