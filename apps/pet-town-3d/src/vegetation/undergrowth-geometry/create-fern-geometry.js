/** Bushes, ferns, saplings, clover, mushrooms, reeds and fallen logs. */
import * as THREE from "three";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { vegetationState } from "../state.js";
import { mixFoliageRgb } from "../geometry-helpers/mix-foliage-rgb.js";
import { bakeFoliageVertexAttributes } from "../geometry-helpers/bake-foliage-vertex-attributes.js";
import { createFoliageBufferGeometry } from "../geometry-helpers/create-foliage-buffer-geometry.js";
export function createFernGeometry(value, frondsValue = {}) {
  let result = frondsValue.fronds ?? 5 + Math.floor(value() * 3);
  let values = [];
  let values2 = [];
  let values3 = [];
  let values4 = [];
  let values5 = [];
  let callback = (position, position2, value2, value3) => {
    values.push(position.x, position.y, position.z);
    values2.push(position2.x, position2.y, position2.z);
    values4.push(...value2);
    values5.push(value3);
    return values.length / 3 - 1;
  };
  let foliageColorToRgbResult = foliageColorToRgb(`#3a7a34`);
  let foliageColorToRgbResult2 = foliageColorToRgb(`#5aa844`);
  let foliageColorToRgbResult3 = foliageColorToRgb(`#9ad066`);
  for (let index = 0; index < result; index++) {
    let result2 = (index / result) * vegetationState.foliageFullTurn + (value() - 0.5) * 0.5;
    let result3 = (frondsValue.L ?? 0.55) * (0.8 + value() * 0.4);
    let result4 = 0.75 + value() * 0.3;
    let result5 = 0.85 + value() * 0.3;
    let vector = new THREE.Vector3(Math.cos(result2), 0, Math.sin(result2));
    let vector2 = new THREE.Vector3(-vector.z, 0, vector.x);
    let callback2 = (value4) =>
      vector
        .clone()
        .multiplyScalar(result3 * value4 * 0.9)
        .add(
          new THREE.Vector3(0, result3 * (result4 * value4 - result5 * value4 * value4) * 0.8, 0),
        );
    let normalizeResult = vegetationState.foliageUpAxis
      .clone()
      .addScaledVector(vector, 0.3)
      .normalize();
    for (let index2 = 0; index2 < 7; index2++) {
      let result6 = 0.12 + (index2 / 7) * 0.82;
      let result7 = Math.min(1, result6 + 0.12);
      let result8 =
        result3 *
        0.24 *
        Math.sin(Math.PI * Math.min(1, 0.15 + result6 * 0.9)) *
        (0.9 + value() * 0.2);
      let callback2Result = callback2(result6);
      let callback2Result2 = callback2(result6 + 0.035);
      let callback2Result3 = callback2(result6 + 0.07);
      for (let result9 of [-1, 1]) {
        let multiplyScalarResult = vector2.clone().multiplyScalar(result9);
        let result10 = callback2Result3
          .clone()
          .addScaledVector(multiplyScalarResult, result8)
          .add(new THREE.Vector3(0, -result8 * 0.25, 0));
        let mixFoliageRgbResult = mixFoliageRgb(
          foliageColorToRgbResult,
          foliageColorToRgbResult2,
          result6,
        );
        let mixFoliageRgbResult2 = mixFoliageRgb(
          foliageColorToRgbResult2,
          foliageColorToRgbResult3,
          result6,
        );
        let callbackResult5 = callback(
          callback2Result,
          normalizeResult,
          mixFoliageRgbResult,
          result6 * 0.5,
        );
        let callbackResult6 = callback(
          callback2Result2,
          normalizeResult,
          mixFoliageRgbResult,
          result6 * 0.5,
        );
        let callbackResult7 = callback(
          result10,
          normalizeResult,
          mixFoliageRgbResult2,
          result7 * 0.5 + 0.05,
        );
        values3.push(callbackResult5, callbackResult6, callbackResult7);
      }
      let callback2Result4 = callback2(Math.max(0, result6 - 0.12));
      let callback2Result5 = callback2(result6);
      let callbackResult = callback(
        callback2Result4.clone().addScaledVector(vector2, -0.008),
        normalizeResult,
        foliageColorToRgbResult,
        result6 * 0.4,
      );
      let callbackResult2 = callback(
        callback2Result4.clone().addScaledVector(vector2, 0.008),
        normalizeResult,
        foliageColorToRgbResult,
        result6 * 0.4,
      );
      let callbackResult3 = callback(
        callback2Result5.clone().addScaledVector(vector2, 0.006),
        normalizeResult,
        foliageColorToRgbResult2,
        result6 * 0.5,
      );
      let callbackResult4 = callback(
        callback2Result5.clone().addScaledVector(vector2, -0.006),
        normalizeResult,
        foliageColorToRgbResult2,
        result6 * 0.5,
      );
      values3.push(
        callbackResult,
        callbackResult2,
        callbackResult3,
        callbackResult,
        callbackResult3,
        callbackResult4,
      );
    }
  }
  return bakeFoliageVertexAttributes(
    createFoliageBufferGeometry(values, values2, null, values3),
    (value5, value6, value7) => ({
      c: values4.slice(value7 * 3, value7 * 3 + 3),
      s: values5[value7],
      t: 1,
    }),
  );
}
