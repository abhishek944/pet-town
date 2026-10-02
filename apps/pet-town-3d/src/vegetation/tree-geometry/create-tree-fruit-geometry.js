/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import * as THREE from "three";
import { createFoliageEllipsoid } from "../geometry-helpers/create-foliage-ellipsoid.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
export function createTreeFruitGeometry(position, value, value2, yValue, value3) {
  let foliageEllipsoidResult = createFoliageEllipsoid(value2, 7, 5, 0.9);
  foliageEllipsoidResult.translate(position.x, position.y, position.z);
  let cylinderGeometry = new THREE.CylinderGeometry(value2 * 0.12, value2 * 0.15, value2 * 0.6, 4);
  cylinderGeometry.translate(position.x, position.y + value2 * 1, position.z);
  let mixFoliageRgbResult = mixFoliageRgb(value, [1, 0.95, 0.85], 0.4);
  let multiplyFoliageRgbResult = multiplyFoliageRgb(value, 0.6);
  let result = position.distanceTo(yValue) / value3;
  let result2 =
    1 *
    (0.55 + 0.45 * clampFoliageUnit((position.y - yValue.y + value3) / (2 * value3))) *
    (1 + 0.15 * result);
  return mergeFoliageGeometry([
    bakeFoliageVertexAttributes(foliageEllipsoidResult, (value4, yValue2) => ({
      c: mixFoliageRgb(
        multiplyFoliageRgbResult,
        mixFoliageRgbResult,
        clampFoliageUnit(yValue2.y * 0.55 + 0.5),
      ),
      s: result2,
      t: 0,
    })),
    bakeFoliageVertexAttributes(cylinderGeometry, () => ({
      c: foliageColorToRgb(`#5a3a1e`),
      s: result2,
      t: 0,
    })),
  ]);
}
