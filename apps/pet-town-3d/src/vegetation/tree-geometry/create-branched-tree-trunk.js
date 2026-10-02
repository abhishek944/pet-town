/** Tree palettes, trunks, broadleaf crowns, fruit, pine tiers and palm fronds. */
import * as THREE from "three";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
export function createBranchedTreeTrunk(
  value,
  {
    H: value2,
    r0: value3,
    r1: value4,
    bend: value6 = 0.15,
    flare: value7 = true,
    branches: value8 = 2,
    color: value9 = foliageColorToRgb(`#7a5234`),
    dark: value10 = foliageColorToRgb(`#4a2f1f`),
    topY: value5,
    R: value11 = 2,
  },
) {
  let values = [];
  let cylinderGeometry = new THREE.CylinderGeometry(value4, value3, value2, 8, 6, false);
  cylinderGeometry.translate(0, value2 / 2, 0);
  let result = (value() - 0.5) * 2;
  let result2 = (value() - 0.5) * 2;
  let position2 = cylinderGeometry.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let result4 = position2.getY(index) / value2;
    position2.setX(index, position2.getX(index) + result * value6 * Math.sin(result4 * Math.PI));
    position2.setZ(index, position2.getZ(index) + result2 * value6 * Math.sin(result4 * Math.PI));
    let result5 = 1 + 0.55 * (1 - Math.min(1, result4 * 4)) ** 2;
    position2.setX(index, position2.getX(index) * result5);
    position2.setZ(index, position2.getZ(index) * result5);
  }
  cylinderGeometry.computeVertexNormals();
  let uv2 = cylinderGeometry.attributes.uv;
  for (let index2 = 0; index2 < uv2.count; index2++) {
    uv2.setXY(index2, uv2.getX(index2) * 2, uv2.getY(index2) * value2 * 0.5);
  }
  if ((values.push(cylinderGeometry), value7)) {
    let result6 = 4 + Math.floor(value() * 2);
    for (let index3 = 0; index3 < result6; index3++) {
      let result7 = (index3 / result6) * vegetationState.foliageFullTurn + value() * 0.5;
      let result8 = value3 * (1.5 + value() * 0.5);
      let cylinderGeometry2 = new THREE.CylinderGeometry(
        value3 * 0.12,
        value3 * 0.5,
        result8,
        6,
        1,
      );
      cylinderGeometry2.translate(0, result8 / 2, 0);
      cylinderGeometry2.rotateZ(-(0.95 + value() * 0.2));
      cylinderGeometry2.rotateY(-result7);
      cylinderGeometry2.scale(1, 0.8, 1);
      cylinderGeometry2.translate(
        Math.cos(result7) * value3 * 0.3,
        -0.12,
        Math.sin(result7) * value3 * 0.3,
      );
      values.push(cylinderGeometry2);
    }
  }
  for (let index4 = 0; index4 < value8; index4++) {
    let result9 = value() * vegetationState.foliageFullTurn;
    let result10 = Math.min(0.9 + value() * 0.6, value11 * 0.55);
    let result11 = value2 * (0.82 + value() * 0.13);
    let cylinderGeometry3 = new THREE.CylinderGeometry(value4 * 0.35, value4 * 0.7, result10, 6, 1);
    cylinderGeometry3.translate(0, result10 / 2, 0);
    cylinderGeometry3.rotateZ(-(0.45 + value() * 0.25));
    cylinderGeometry3.rotateY(-result9);
    cylinderGeometry3.translate(result * value6 * 0.9, result11, result2 * value6 * 0.9);
    values.push(cylinderGeometry3);
  }
  let result3 = value5 ?? value2;
  return mergeFoliageGeometry(
    values.map((value12) =>
      bakeFoliageVertexAttributes(value12, (yValue) => {
        let result12 = yValue.y / result3;
        let result13 = 0.72 + 0.28 * foliageSmoothstep(0, 0.3, result12);
        let result14 = 1 - 0.3 * foliageSmoothstep(0.72, 1, result12);
        return {
          c: multiplyFoliageRgb(
            mixFoliageRgb(value10, value9, foliageSmoothstep(-0.05, 0.3, result12)),
            result13 * result14,
          ),
          s: ((Math.max(0, yValue.y) * Math.max(0, yValue.y)) / (result3 * result3)) * 1.2,
          t: 1,
        };
      }),
    ),
  );
}
