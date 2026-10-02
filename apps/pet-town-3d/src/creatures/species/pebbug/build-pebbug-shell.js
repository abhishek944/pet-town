import { createCreatureDeformedSphereGeometry } from "../../geometry/create-creature-deformed-sphere-geometry.js";
import { sampleCreatureValueNoise } from "../../math/sample-creature-value-noise.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { createPebbugShellColoring } from "./create-pebbug-shell-coloring.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
export function buildPebbugShell(palette, body, materials) {
  let creatureDeformedSphereGeometryResult = createCreatureDeformedSphereGeometry(
    (setValue, value, value2, value3) => {
      let result =
        1 + (sampleCreatureValueNoise(value * 2.3 + 5, value2 * 2.3, value3 * 2.3) - 0.5) * 0.06;
      let value2Value = value2;
      if (value2Value < -0.35) {
        value2Value = -0.35 - (value2Value + 0.35) * 0.2;
      }
      setValue.set(value * 0.3 * result, value2Value * 0.235 * result, value3 * 0.33 * result);
    },
    56,
    40,
  );
  colorCreatureGeometryVertices(
    creatureDeformedSphereGeometryResult,
    createPebbugShellColoring(palette),
  );
  let creatureDeformedSphereGeometryResult2 = createCreatureDeformedSphereGeometry(
    (setValue2, value4, value5, value6) => {
      let result2 = 1 - 0.35 * Math.max(0, -value5);
      setValue2.set(
        value4 * 0.16 * result2,
        value5 * 0.042 + 0.02 * (1 - value4 * value4),
        value6 * 0.075 * result2,
      );
    },
    22,
    12,
  );
  colorCreatureGeometryVertices(
    creatureDeformedSphereGeometryResult2,
    (multiplyScalarValue, position, yValue) => {
      lerpCreatureRigColor(
        multiplyScalarValue,
        palette.stoneLo,
        palette.stone,
        smoothstepCreatureValue(-0.6, 0.6, yValue.y),
      );
      multiplyScalarValue.multiplyScalar(
        0.94 + 0.12 * sampleCreatureValueNoise(position.x * 20, position.y * 20, position.z * 20),
      );
    },
  );
  transformCreatureGeometry(creatureDeformedSphereGeometryResult2, [0, 0.075, 0.275], [0.32, 0, 0]);
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(0.3, 0.06, 0.33, 26, 10);
  fillCreatureGeometryColor(creatureEllipsoidGeometryResult, palette.under);
  transformCreatureGeometry(creatureEllipsoidGeometryResult, [0, -0.08, 0]);
  addCreatureBoneMesh(
    body,
    mergeCreatureGeometries([
      creatureDeformedSphereGeometryResult,
      creatureDeformedSphereGeometryResult2,
      creatureEllipsoidGeometryResult,
    ]),
    materials.body,
    null,
    null,
    `shell`,
  );
}
