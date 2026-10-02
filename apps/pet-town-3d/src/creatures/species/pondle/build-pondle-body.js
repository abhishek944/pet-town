import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { sampleCreatureValueNoise } from "../../math/sample-creature-value-noise.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
export function buildPondleBody(palette, body, materials) {
  let creatureBodyGeometryResult = createCreatureBodyGeometry(0.25, 0.19, 0.24, {
    flat: 0.7,
    taper: 0.15,
  });
  colorCreatureGeometryVertices(creatureBodyGeometryResult, (lerpValue, position, zValue) => {
    let result = Math.max(
      smoothstepCreatureValue(0.2, 0.65, zValue.z) * smoothstepCreatureValue(0.75, 0.2, zValue.y),
      smoothstepCreatureValue(-0.15, -0.55, zValue.y),
    );
    lerpCreatureRigColor(lerpValue, palette.skin, palette.belly, result);
    let smoothstepCreatureValueResult = smoothstepCreatureValue(
      0.6,
      0.66,
      sampleCreatureValueNoise(position.x * 13 + 3, position.y * 13, position.z * 13),
    );
    lerpValue.lerp(
      getCreatureColor(palette.spot),
      smoothstepCreatureValueResult *
        smoothstepCreatureValue(-0.1, 0.4, zValue.y) *
        (1 - result) *
        0.9,
    );
  });
  addCreatureBoneMesh(body, creatureBodyGeometryResult, materials.glossy, null, null, `bodyMesh`);
}
