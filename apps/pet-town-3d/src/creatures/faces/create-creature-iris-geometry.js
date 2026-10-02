/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { createCreatureEllipsoidGeometry } from "../geometry/create-creature-ellipsoid-geometry.js";
import { getCreatureColor } from "../geometry/get-creature-color.js";
import { colorCreatureGeometryVertices } from "../geometry/color-creature-geometry-vertices.js";
import { smoothstepCreatureValue } from "../math/smoothstep-creature-value.js";
export function createCreatureIrisGeometry(value, value2, value3, value4, value5, value6) {
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
    value,
    value2,
    value3,
    22,
    16,
  );
  let creatureColorResult = getCreatureColor(value4);
  let creatureColorResult2 = getCreatureColor(value5);
  let lerpResult = new THREE.Color(value4).lerp(new THREE.Color(16777215), 0.35);
  return colorCreatureGeometryVertices(
    creatureEllipsoidGeometryResult,
    (copyValue, position, zValue) => {
      let result = (position.y / value2 + 1) / 2;
      if (value6 === `bulge`) {
        let hypotResult = Math.hypot(position.x / value, position.y / value2);
        copyValue
          .copy(creatureColorResult)
          .lerp(creatureColorResult2, smoothstepCreatureValue(0.8, 1, hypotResult) * 0.4);
        return;
      }
      if (value6 === `bead`) {
        copyValue
          .copy(creatureColorResult2)
          .lerp(creatureColorResult, smoothstepCreatureValue(0.5, 0, result) * 0.5);
        return;
      }
      copyValue
        .copy(creatureColorResult)
        .lerp(creatureColorResult2, smoothstepCreatureValue(0.18, 0.78, result));
      let result2 =
        smoothstepCreatureValue(0.34, 0.1, result) * smoothstepCreatureValue(0.2, 0.8, zValue.z);
      copyValue.lerp(lerpResult, result2 * 0.8);
    },
  );
}
