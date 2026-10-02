import { colorCreatureGeometryVertices } from "../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../geometry/get-creature-color.js";
import { createCreatureEllipsoidGeometry } from "../geometry/create-creature-ellipsoid-geometry.js";
import { smoothstepCreatureValue } from "../math/smoothstep-creature-value.js";
import { lerpCreatureFaceColor } from "./lerp-creature-face-color.js";
export function createCreatureMouthVolumeTools() {
  let createOpenMouth = (width, height, depth, flattenTop = 0) => {
    let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
      width,
      height,
      depth,
      18,
      12,
    );
    let position4 = creatureEllipsoidGeometryResult.attributes.position;
    if (flattenTop) {
      for (let index4 = 0; index4 < position4.count; index4++) {
        let yResult = position4.getY(index4);
        if (yResult > height * (1 - flattenTop)) {
          position4.setY(
            index4,
            height * (1 - flattenTop) + (yResult - height * (1 - flattenTop)) * 0.15,
          );
        }
      }
    }
    creatureEllipsoidGeometryResult.computeVertexNormals();
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult, (copyValue3, yValue) => {
      let result25 = (yValue.y / height + 1) / 2;
      copyValue3
        .copy(getCreatureColor(16744341))
        .lerp(getCreatureColor(5904432), smoothstepCreatureValue(0.2, 0.55, result25));
    });
    return creatureEllipsoidGeometryResult;
  };
  let createTongue = (width, length, curl = 0.4) => {
    let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
      width,
      width * 0.35,
      length,
      14,
      10,
    );
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult2, (value20, zValue) =>
      lerpCreatureFaceColor(
        value20,
        16748452,
        16736126,
        smoothstepCreatureValue(-length, length, zValue.z),
      ),
    );
    let position5 = creatureEllipsoidGeometryResult2.attributes.position;
    for (let index5 = 0; index5 < position5.count; index5++) {
      let zResult = position5.getZ(index5);
      position5.setY(
        index5,
        position5.getY(index5) - curl * Math.max(0, zResult / length) ** 2 * length,
      );
    }
    creatureEllipsoidGeometryResult2.computeVertexNormals();
    return creatureEllipsoidGeometryResult2;
  };
  return {
    createOpenMouth,
    createTongue,
  };
}
