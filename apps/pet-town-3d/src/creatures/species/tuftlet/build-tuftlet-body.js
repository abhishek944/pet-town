import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
export function buildTuftletBody(palette, body, materials) {
  let creatureBodyGeometryResult = createCreatureBodyGeometry(0.19, 0.19, 0.2, {
    taper: -0.12,
  });
  colorCreatureGeometryVertices(creatureBodyGeometryResult, (lerpValue, value, yValue) => {
    let result = yValue.y * 0.6 - yValue.z * 0.8;
    lerpCreatureRigColor(
      lerpValue,
      palette.belly,
      palette.back,
      smoothstepCreatureValue(-0.55, -0.25, result),
    );
    lerpValue.lerp(
      getCreatureColor(palette.backDark),
      smoothstepCreatureValue(0.2, 0.8, result) * 0.35,
    );
  });
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(0.13, 0.1, 0.12, 20, 14);
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult, (value2, value3, yValue2) => {
    let result2 = yValue2.y * 0.6 - yValue2.z * 0.8;
    lerpCreatureRigColor(
      value2,
      palette.belly,
      palette.back,
      smoothstepCreatureValue(-0.55, -0.25, result2),
    );
  });
  transformCreatureGeometry(creatureEllipsoidGeometryResult, [0, 0.15, 0.04]);
  addCreatureBoneMesh(
    body,
    mergeCreatureGeometries([creatureBodyGeometryResult, creatureEllipsoidGeometryResult]),
    materials.body,
    null,
    null,
    `bodyMesh`,
  );
}
