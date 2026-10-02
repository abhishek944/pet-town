import { sampleCreatureEllipsoidPoints } from "../../rig-builders/sample-creature-ellipsoid-points.js";
import { hashCreatureCoordinates } from "../../math/hash-creature-coordinates.js";
import { createCreatureSphereClusterGeometry } from "../../geometry/create-creature-sphere-cluster-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { clampCreatureValue } from "../../math/clamp-creature-value.js";
import { lerpCreatureRigColorRamp } from "../../rig-builders/lerp-creature-rig-color-ramp.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
export function buildNimbaaWool(palette, body, materials) {
  let values = [0.33, 0.28, 0.36];
  let creatureEllipsoidPointsResult = sampleCreatureEllipsoidPoints(
    78,
    values[0],
    values[1],
    values[2],
    (value, value2, value3) =>
      value2 > -0.62 && !(value3 > 0.5 && value2 > -0.35 && Math.abs(value) < 0.62),
  );
  let values2 = [
    {
      p: [0, 0, 0],
      r: 1,
      s: [values[0] * 0.97, values[1] * 0.97, values[2] * 0.97],
    },
  ];
  creatureEllipsoidPointsResult.forEach(([value4, value5, value6], value7) =>
    values2.push({
      p: [value4, value5, value6],
      r: 0.07 + 0.04 * hashCreatureCoordinates(value7, 1, 2),
    }),
  );
  let creatureSphereClusterGeometryResult = createCreatureSphereClusterGeometry(values2, 11, 8);
  colorCreatureGeometryVertices(
    creatureSphereClusterGeometryResult,
    (lerpValue, position2, yValue) => {
      let clampCreatureValueResult = clampCreatureValue((position2.y + 0.36) / 0.72, 0, 1);
      lerpCreatureRigColorRamp(
        lerpValue,
        palette.woolLo,
        palette.woolMid,
        palette.woolHi,
        clampCreatureValueResult,
      );
      let hypotResult = Math.hypot(
        position2.x / values[0],
        position2.y / values[1],
        position2.z / values[2],
      );
      lerpValue.lerp(
        getCreatureColor(palette.woolCrease),
        smoothstepCreatureValue(1.22, 1, hypotResult) * 0.5,
      );
      lerpValue.multiplyScalar(0.92 + 0.08 * smoothstepCreatureValue(-0.8, 0.6, yValue.y));
    },
  );
  addCreatureBoneMesh(
    body,
    creatureSphereClusterGeometryResult,
    materials.fluff,
    null,
    null,
    `wool`,
  );
}
