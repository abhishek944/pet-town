import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { sampleCreatureValueNoise } from "../../math/sample-creature-value-noise.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
export function buildPondleHead(body, palette, materials) {
  let head = createCreatureBone(`head`, body, [0, 0.27, 0.11]);
  let faceSurface = {
    center: [0, 0.05, 0.06],
    radii: [0.25, 0.155, 0.2],
  };
  let creatureBodyGeometryResult2 = createCreatureBodyGeometry(0.25, 0.155, 0.2, {
    flat: 0.3,
  });
  colorCreatureGeometryVertices(creatureBodyGeometryResult2, (lerpValue2, position2, zValue2) => {
    lerpCreatureRigColor(
      lerpValue2,
      palette.belly,
      palette.skin,
      smoothstepCreatureValue(-0.55, -0.2, position2.y / 0.155 + 0.25 * (1 - zValue2.z)),
    );
    let smoothstepCreatureValueResult2 = smoothstepCreatureValue(
      0.68,
      0.74,
      sampleCreatureValueNoise(position2.x * 14 + 1, position2.y * 14 + 5, position2.z * 14),
    );
    lerpValue2.lerp(
      getCreatureColor(palette.spot),
      smoothstepCreatureValueResult2 * smoothstepCreatureValue(0.3, 0.8, zValue2.y) * 0.8,
    );
  });
  transformCreatureGeometry(creatureBodyGeometryResult2, faceSurface.center);
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(0.12, 0.045, 0.085, 18, 12);
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult, (value9, yValue2) =>
    lerpCreatureRigColor(
      value9,
      palette.belly,
      palette.pouch,
      smoothstepCreatureValue(0.03, -0.035, yValue2.y),
    ),
  );
  transformCreatureGeometry(creatureEllipsoidGeometryResult, [0, -0.015, 0.125]);
  let values = [];
  let values2 = [];
  for (let result4 of [-1, 1]) {
    let values4 = [result4 * 0.12, 0.165, 0.1];
    let creatureEllipsoidGeometryResult4 = createCreatureEllipsoidGeometry(
      0.095,
      0.09,
      0.09,
      20,
      14,
    );
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult4, (value10, value11, yValue3) =>
      lerpCreatureRigColor(
        value10,
        palette.skin,
        palette.skinLight,
        smoothstepCreatureValue(0.3, 1, yValue3.y),
      ),
    );
    transformCreatureGeometry(creatureEllipsoidGeometryResult4, values4);
    values.push(creatureEllipsoidGeometryResult4);
    values2.push({
      center: values4,
      radii: [0.095, 0.09, 0.09],
    });
  }
  let values3 = [];
  for (let result5 of [-1, 1]) {
    let creatureEllipsoidGeometryResult5 = createCreatureEllipsoidGeometry(
      0.05,
      0.04,
      0.04,
      14,
      10,
    );
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult5, (value12, value13, yValue4) =>
      lerpCreatureRigColor(
        value12,
        palette.skin,
        palette.skinLight,
        smoothstepCreatureValue(-0.2, 0.8, yValue4.y),
      ),
    );
    transformCreatureGeometry(creatureEllipsoidGeometryResult5, [result5 * 0.185, 0.025, 0.16]);
    values3.push(creatureEllipsoidGeometryResult5);
  }
  addCreatureBoneMesh(
    head,
    mergeCreatureGeometries([
      creatureBodyGeometryResult2,
      creatureEllipsoidGeometryResult,
      ...values,
      ...values3,
    ]),
    materials.glossy,
    null,
    null,
    `headMesh`,
  );
  return {
    head,
    faceSurface,
    values2,
  };
}
