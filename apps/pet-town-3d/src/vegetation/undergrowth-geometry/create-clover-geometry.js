/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { createBentPlantStem } from "../flower-geometry/create-bent-plant-stem.js";
import { createFoliageBufferGeometry } from "../geometry-helpers/create-foliage-buffer-geometry.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
import { createNoisyFlowerCenter } from "../flower-geometry/create-noisy-flower-center.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createCloverGeometry(value, countValue = {}) {
  let values = [];
  let result = countValue.count ?? 9 + Math.floor(value() * 6);
  let foliageColorToRgbResult = foliageColorToRgb(`#4f9a3a`);
  let foliageColorToRgbResult2 = foliageColorToRgb(`#86c45c`);
  for (let index = 0; index < result; index++) {
    let result2 = value() * vegetationState.foliageFullTurn;
    let result3 = 0.3 * Math.sqrt(value());
    let result4 = Math.cos(result2) * result3;
    let result5 = Math.sin(result2) * result3;
    let result6 = 0.05 + value() * 0.05;
    let result7 = 0.8 + value() * 0.4;
    let bentPlantStemResult = createBentPlantStem(
      result6,
      0,
      0,
      foliageColorToRgb(`#3e7a2e`),
      foliageColorToRgb(`#5a9a40`),
      0.006,
      3,
      1,
    );
    bentPlantStemResult.translate(result4, 0, result5);
    values.push(bentPlantStemResult);
    let result8 = value() * vegetationState.foliageFullTurn;
    for (let index2 = 0; index2 < 3; index2++) {
      let result9 = result8 + (index2 / 3) * vegetationState.foliageFullTurn;
      let values2 = [0, 0, 0];
      let values3 = [0, 1, 0];
      let values4 = [];
      let result10 = 0.03 * result7;
      for (let index3 = 0; index3 <= 4; index3++) {
        let result11 = -1 + (2 * index3) / 4;
        let result12 = result11 * 1.2;
        let result13 =
          result10 *
          (0.75 + 0.25 * Math.cos(result11 * Math.PI)) *
          (1 - 0.25 * Math.exp(-result11 * result11 * 20));
        values2.push(
          Math.cos(result12) * result13 + result10 * 0.1,
          0.006 * (1 - Math.abs(result11)),
          Math.sin(result12) * result13,
        );
        values3.push(0, 1, 0);
        if (index3 > 0) {
          values4.push(0, index3 + 1, index3);
        }
      }
      let foliageBufferGeometryResult = createFoliageBufferGeometry(
        values2,
        values3,
        null,
        values4,
      );
      foliageBufferGeometryResult.rotateZ(0.25);
      foliageBufferGeometryResult.rotateY(-result9);
      foliageBufferGeometryResult.translate(result4, result6, result5);
      values.push(
        bakeFoliageVertexAttributes(foliageBufferGeometryResult, (position) => ({
          c: mixFoliageRgb(
            foliageColorToRgbResult,
            foliageColorToRgbResult2,
            clampFoliageUnit(Math.hypot(position.x - result4, position.z - result5) / result10),
          ),
          s: result6,
          t: 1,
        })),
      );
    }
    if (countValue.flowers && value() < 0.25) {
      let result14 = result6 + 0.07;
      let bentPlantStemResult2 = createBentPlantStem(
        result14,
        0.01,
        0,
        foliageColorToRgb(`#3e7a2e`),
        foliageColorToRgb(`#5a9a40`),
        0.005,
      );
      bentPlantStemResult2.translate(result4 + 0.02, 0, result5);
      values.push(bentPlantStemResult2);
      let noisyFlowerCenterResult = createNoisyFlowerCenter(0.022, 1, index);
      noisyFlowerCenterResult.translate(result4 + 0.03, result14 + 0.01, result5);
      values.push(
        bakeFoliageVertexAttributes(noisyFlowerCenterResult, (value2, yValue) => ({
          c: mixFoliageRgb(
            foliageColorToRgb(`#e8d8e8`),
            foliageColorToRgb(`#fff8fb`),
            clampFoliageUnit(yValue.y * 0.5 + 0.5),
          ),
          s: result14,
          t: 0,
        })),
      );
    }
  }
  return mergeFoliageGeometry(values);
}
