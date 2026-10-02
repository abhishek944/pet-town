/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import * as THREE from "three";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { createNoisyFlowerCenter } from "../flower-geometry/create-noisy-flower-center.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createFallenLogGeometry(value, LValue = {}) {
  let result = LValue.L ?? 2.2 + value() * 1.2;
  let result2 = LValue.r ?? 0.3 + value() * 0.1;
  let values = [];
  let cylinderGeometry = new THREE.CylinderGeometry(result2, result2 * 1.05, result, 11, 4, true);
  let uv2 = cylinderGeometry.attributes.uv;
  for (let index = 0; index < uv2.count; index++) {
    uv2.setXY(index, uv2.getX(index) * 2.5, uv2.getY(index) * result * 0.6);
  }
  cylinderGeometry.rotateZ(Math.PI / 2);
  cylinderGeometry.translate(0, result2 * 0.92, 0);
  let foliageColorToRgbResult = foliageColorToRgb(`#5f9a3a`);
  let foliageColorToRgbResult2 = foliageColorToRgb(`#8a6242`);
  let foliageColorToRgbResult3 = foliageColorToRgb(`#5a3d28`);
  values.push(
    bakeFoliageVertexAttributes(cylinderGeometry, (position, yValue) => {
      let mixFoliageRgbResult = mixFoliageRgb(
        foliageColorToRgbResult3,
        foliageColorToRgbResult2,
        clampFoliageUnit(yValue.y * 0.5 + 0.6),
      );
      let result3 =
        foliageSmoothstep(0.45, 0.85, yValue.y) * (0.6 + 0.4 * Math.sin(position.x * 2.3 + 1.7));
      mixFoliageRgbResult = mixFoliageRgb(
        mixFoliageRgbResult,
        foliageColorToRgbResult,
        clampFoliageUnit(result3),
      );
      return {
        c: multiplyFoliageRgb(
          mixFoliageRgbResult,
          0.6 + 0.4 * clampFoliageUnit(position.y / (result2 * 1.6)),
        ),
        s: 0,
        t: 1,
      };
    }),
  );
  for (let result4 of [-1, 1]) {
    let circleGeometry = new THREE.CircleGeometry(result2 * (result4 > 0 ? 1.05 : 1), 11, 0);
    circleGeometry.rotateY((result4 * Math.PI) / 2);
    circleGeometry.translate((result4 * result) / 2, result2 * 0.92, 0);
    values.push(
      bakeFoliageVertexAttributes(circleGeometry, (yValue2) => {
        let result5 = Math.hypot(yValue2.y - result2 * 0.92, yValue2.z) / result2;
        let result6 = 0.5 + 0.5 * Math.cos(result5 * 18);
        return {
          c:
            result5 > 0.85
              ? foliageColorToRgb(`#6a4a30`)
              : mixFoliageRgb(foliageColorToRgb(`#c9a476`), foliageColorToRgb(`#e6c998`), result6),
          s: 0,
          t: 0,
        };
      }),
    );
  }
  for (let index2 = 0; index2 < 4; index2++) {
    let noisyFlowerCenterResult = createNoisyFlowerCenter(
      0.12 + value() * 0.08,
      0.45,
      index2 + 5,
      9,
      6,
    );
    noisyFlowerCenterResult.scale(1.4, 1, 1.1);
    noisyFlowerCenterResult.translate(
      (value() - 0.5) * result * 0.8,
      result2 * 1.8,
      (value() - 0.5) * result2 * 0.5,
    );
    values.push(
      bakeFoliageVertexAttributes(noisyFlowerCenterResult, (value2, yValue3) => ({
        c: mixFoliageRgb(
          foliageColorToRgb(`#3f7a2a`),
          foliageColorToRgb(`#8cc454`),
          clampFoliageUnit(yValue3.y * 0.5 + 0.5),
        ),
        s: 0,
        t: 0,
      })),
    );
  }
  for (let index3 = 0; index3 < 3; index3++) {
    let cylinderGeometry2 = new THREE.CylinderGeometry(0.14, 0.12, 0.04, 10, 1, false, 0, Math.PI);
    let result7 = value() < 0.5 ? -1 : 1;
    cylinderGeometry2.rotateY(result7 < 0 ? Math.PI : 0);
    cylinderGeometry2.translate(
      (value() - 0.5) * result * 0.7,
      result2 * (0.7 + value() * 0.5),
      result7 * result2 * 0.95,
    );
    values.push(
      bakeFoliageVertexAttributes(cylinderGeometry2, (value3, yValue4) => ({
        c: mixFoliageRgb(
          foliageColorToRgb(`#c7662e`),
          foliageColorToRgb(`#f2b45a`),
          clampFoliageUnit(yValue4.y * 0.5 + 0.5),
        ),
        s: 0,
        t: 0,
      })),
    );
  }
  return {
    geo: mergeFoliageGeometry(values),
    length: result,
    radius: result2,
  };
}
