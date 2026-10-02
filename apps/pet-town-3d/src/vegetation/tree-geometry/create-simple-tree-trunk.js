/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import * as THREE from "three";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
export function createSimpleTreeTrunk(value, value2, value3, position2 = null) {
  let cylinderGeometry = new THREE.CylinderGeometry(value3, value2 * 1.15, value, 5, 1, true);
  if ((cylinderGeometry.translate(0, value / 2, 0), position2)) {
    let position3 = cylinderGeometry.attributes.position;
    for (let index = 0; index < position3.count; index++) {
      let clampFoliageUnitResult = clampFoliageUnit(position3.getY(index) / value);
      position3.setX(
        index,
        position3.getX(index) + position2.x * clampFoliageUnitResult * clampFoliageUnitResult,
      );
      position3.setZ(
        index,
        position3.getZ(index) + position2.z * clampFoliageUnitResult * clampFoliageUnitResult,
      );
    }
    cylinderGeometry.computeVertexNormals();
  }
  return bakeFoliageVertexAttributes(cylinderGeometry, (yValue) => ({
    c: mixFoliageRgb(
      foliageColorToRgb(`#4d3322`),
      foliageColorToRgb(`#8a5d3b`),
      clampFoliageUnit(yValue.y / value),
    ),
    s: clampFoliageUnit(yValue.y / value) * clampFoliageUnit(yValue.y / value) * 1.2,
    t: 0,
  }));
}
