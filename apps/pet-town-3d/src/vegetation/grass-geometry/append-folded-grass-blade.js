/** Folded grass blades, tuft levels of detail and dune grass geometry. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
export function appendFoldedGrassBlade(
  value,
  {
    ox: value2,
    oz: value3,
    dir: value4,
    h: value5,
    w: value6,
    lean: value7,
    segs: value9 = 2,
    fold: value10 = 0.35,
    twist: value11 = 0,
    colAt: value8,
    upBase: value12 = 0.85,
    upTip: value13 = 0.35,
  },
) {
  let { P: valueValue, N: valueValue2, I: valueValue3, COL: valueValue4, SW: valueValue5 } = value;
  let result = Math.cos(value4);
  let result2 = Math.sin(value4);
  let result3 = valueValue.length / 3;
  let values = [];
  for (let index = 0; index < value9; index++) {
    let result7 = index / value9;
    let result8 = value7 * result7 * result7 * value5;
    let result9 = value5 * result7 * (1 - 0.25 * value7 * result7);
    let result10 = value2 + result * result8;
    let result11 = value3 + result2 * result8;
    let result12 = value4 + Math.PI / 2 + value11 * result7;
    let result13 = Math.cos(result12);
    let result14 = Math.sin(result12);
    let result15 = (value6 / 2) * (1 - result7) ** 0.6 * (index === 0 ? 0.9 : 1);
    let normalizeResult2 = new THREE.Vector3(
      result * 0.8,
      0.35 + value7 * result7 * 0.4,
      result2 * 0.8,
    ).normalize();
    let values2 = [result10 - result13 * result15, result9, result11 - result14 * result15];
    let values3 = [
      result10 + normalizeResult2.x * result15 * value10,
      result9 + normalizeResult2.y * result15 * value10,
      result11 + normalizeResult2.z * result15 * value10,
    ];
    let values4 = [result10 + result13 * result15, result9, result11 + result14 * result15];
    let result16 = value12 + (value13 - value12) * result7;
    let normalizeResult3 = new THREE.Vector3(
      normalizeResult2.x - result13 * 0.6,
      normalizeResult2.y,
      normalizeResult2.z - result14 * 0.6,
    )
      .normalize()
      .lerp(vegetationState.foliageUpAxis, result16)
      .normalize();
    let normalizeResult4 = normalizeResult2
      .clone()
      .lerp(vegetationState.foliageUpAxis, result16)
      .normalize();
    let normalizeResult5 = new THREE.Vector3(
      normalizeResult2.x + result13 * 0.6,
      normalizeResult2.y,
      normalizeResult2.z + result14 * 0.6,
    )
      .normalize()
      .lerp(vegetationState.foliageUpAxis, result16)
      .normalize();
    let value8Result = value8(result7);
    for (let [result17, position] of [
      [values2, normalizeResult3],
      [values3, normalizeResult4],
      [values4, normalizeResult5],
    ]) {
      valueValue.push(...result17);
      valueValue2.push(position.x, position.y, position.z);
      valueValue4.push(...value8Result);
      valueValue5.push(Math.max(0, result17[1]));
    }
    values.push(result3 + index * 3);
  }
  let result4 = value5 * (1 - 0.25 * value7);
  let normalizeResult = new THREE.Vector3(result * 0.5, 0.6, result2 * 0.5)
    .normalize()
    .lerp(vegetationState.foliageUpAxis, value13)
    .normalize();
  valueValue.push(value2 + result * value7 * value5, result4, value3 + result2 * value7 * value5);
  valueValue2.push(normalizeResult.x, normalizeResult.y, normalizeResult.z);
  valueValue4.push(...value8(1));
  valueValue5.push(result4);
  let result5 = valueValue.length / 3 - 1;
  for (let index2 = 0; index2 < value9 - 1; index2++) {
    let result18 = values[index2];
    let result19 = values[index2 + 1];
    valueValue3.push(
      result18,
      result18 + 1,
      result19 + 1,
      result18,
      result19 + 1,
      result19,
      result18 + 1,
      result18 + 2,
      result19 + 2,
      result18 + 1,
      result19 + 2,
      result19 + 1,
    );
  }
  let result6 = values[value9 - 1];
  valueValue3.push(result6, result6 + 1, result5, result6 + 1, result6 + 2, result5);
}
