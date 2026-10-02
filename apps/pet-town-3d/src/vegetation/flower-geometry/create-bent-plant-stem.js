/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
import * as THREE from "three";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
export function createBentPlantStem(
  value,
  value2,
  value3,
  value4,
  value5,
  value6 = 0.014,
  value7 = 5,
  value8 = 3,
) {
  let cylinderGeometry = new THREE.CylinderGeometry(
    value6 * 0.8,
    value6,
    value,
    value7,
    value8,
    true,
  );
  cylinderGeometry.translate(0, value / 2, 0);
  let position2 = cylinderGeometry.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let result = position2.getY(index) / value;
    position2.setX(index, position2.getX(index) + value2 * result * result);
    position2.setZ(index, position2.getZ(index) + value3 * result * result);
  }
  cylinderGeometry.computeVertexNormals();
  return bakeFoliageVertexAttributes(cylinderGeometry, (yValue) => ({
    c: mixFoliageRgb(value4, value5, clampFoliageUnit(yValue.y / value)),
    s: yValue.y,
    t: 0,
  }));
}
