/** Lily pad palettes, veined pads and flowering lily clusters. */
import { vegetationState } from "../state.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { createFoliageBufferGeometry } from "../geometry-helpers/create-foliage-buffer-geometry.js";
import { mergeFoliageGeometry } from "../geometry-helpers/merge-foliage-geometry.js";
export function createLilyPadGeometry(value, value2, value3, value4, inCValue) {
  let result = 0.42;
  let result2 = value() * vegetationState.foliageFullTurn;
  let values = [value3, 0.03, value4];
  let values2 = [0, 1, 0];
  let values3 = [...mixFoliageRgb(inCValue.inC, inCValue.out, 0.15)];
  let values4 = [];
  let values5 = [
    {
      f: 0.5,
      y: 0.03,
      ny: 1,
    },
    {
      f: 0.94,
      y: 0.032,
      ny: 1,
    },
    {
      f: 1,
      y: 0.042,
      ny: 0.7,
    },
    {
      f: 1.01,
      y: 0.012,
      ny: 0,
    },
  ];
  let result3 = value() * vegetationState.foliageFullTurn;
  for (let result4 of values5) {
    for (let index = 0; index <= 44; index++) {
      let result5 =
        result2 + result / 2 + (index / 44) * (vegetationState.foliageFullTurn - result);
      let result6 =
        1 + 0.03 * Math.sin(result5 * 5 + result3) + 0.015 * Math.sin(result5 * 11 + result3 * 2);
      let result7 = Math.cos(result5);
      let result8 = Math.sin(result5);
      values.push(
        value3 + result7 * value2 * result4.f * result6,
        result4.y,
        value4 + result8 * value2 * result4.f * result6,
      );
      let result9 = Math.sqrt(1 - result4.ny * result4.ny);
      values2.push(result7 * result9, result4.ny, result8 * result9);
      let result10 =
        result4.f < 0.6
          ? mixFoliageRgb(inCValue.inC, inCValue.out, 0.4)
          : mixFoliageRgb(inCValue.inC, inCValue.out, 0.85);
      if (result4.f >= 1) {
        result10 = multiplyFoliageRgb(
          inCValue.edge || inCValue.out,
          result4.y < 0.02 ? 0.72 : 0.92,
        );
      }
      values3.push(...multiplyFoliageRgb(result10, 0.97 + 0.06 * Math.sin(result5 * 3 + result3)));
    }
  }
  for (let index2 = 0; index2 < 44; index2++) {
    values4.push(0, 1 + index2 + 1, 1 + index2);
  }
  for (let index3 = 0; index3 < values5.length - 1; index3++) {
    let result11 = 1 + index3 * 45;
    let result12 = 1 + (index3 + 1) * 45;
    for (let index4 = 0; index4 < 44; index4++) {
      values4.push(
        result11 + index4,
        result11 + index4 + 1,
        result12 + index4 + 1,
        result11 + index4,
        result12 + index4 + 1,
        result12 + index4,
      );
    }
  }
  let bakeFoliageVertexAttributesResult = bakeFoliageVertexAttributes(
    createFoliageBufferGeometry(values, values2, null, values4),
    (value5, value6, value7) => ({
      c: values3.slice(value7 * 3, value7 * 3 + 3),
      s: 0.2,
      t: 0,
    }),
  );
  let values6 = [];
  let values7 = [];
  let values8 = [];
  let mixFoliageRgbResult = mixFoliageRgb(
    mixFoliageRgb(inCValue.inC, inCValue.out, 0.7),
    inCValue.vein,
    0.25,
  );
  for (let index5 = 0; index5 < 9; index5++) {
    let result13 =
      result2 + result / 2 + ((index5 + 0.5) / 9) * (vegetationState.foliageFullTurn - result);
    let result14 = Math.cos(result13);
    let result15 = Math.sin(result13);
    let result16 = -result15;
    let result14Value = result14;
    let result17 = 0.006;
    let result18 = value2 * 0.9;
    let result19 = values6.length / 3;
    values6.push(
      value3 + result16 * result17,
      0.0335,
      value4 + result14Value * result17,
      value3 - result16 * result17,
      0.0335,
      value4 - result14Value * result17,
      value3 + result14 * result18,
      0.0345,
      value4 + result15 * result18,
    );
    values7.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    values8.push(result19, result19 + 2, result19 + 1);
  }
  return mergeFoliageGeometry([
    bakeFoliageVertexAttributesResult,
    bakeFoliageVertexAttributes(
      createFoliageBufferGeometry(values6, values7, null, values8),
      () => ({
        c: mixFoliageRgbResult,
        s: 0.2,
        t: 0,
      }),
    ),
  ]);
}
