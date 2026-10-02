/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import * as THREE from "three";
export function createBeveledPropBox(value, value2, value3, value4 = 0.05) {
  if (
    ((value4 = Math.min(value4, value / 2 - 0.001, value2 / 2 - 0.001, value3 / 2 - 0.001)),
    !(value4 > 0.004))
  ) {
    return new THREE.BoxGeometry(value, value2, value3).toNonIndexed();
  }
  let values = [value / 2, value2 / 2, value3 / 2];
  let values2 = [];
  let values3 = [];
  let callback = (value5, value6, value7) => {
    let values5 = [0, 0, 0];
    let values6 = [0, 0, 0];
    for (let index = 0; index < 3; index++) {
      values5[index] =
        index === value5 ? value6 * values[index] : value7[index] * (values[index] - value4);
    }
    values6[value5] = value6;
    return {
      p: values5,
      n: values6,
    };
  };
  let callback2 = (pValue, pValue2, pValue3) => {
    let values7 = [
      pValue2.p[0] - pValue.p[0],
      pValue2.p[1] - pValue.p[1],
      pValue2.p[2] - pValue.p[2],
    ];
    let values8 = [
      pValue3.p[0] - pValue.p[0],
      pValue3.p[1] - pValue.p[1],
      pValue3.p[2] - pValue.p[2],
    ];
    let values9 = [
      values7[1] * values8[2] - values7[2] * values8[1],
      values7[2] * values8[0] - values7[0] * values8[2],
      values7[0] * values8[1] - values7[1] * values8[0],
    ];
    let values10 = [
      pValue.n[0] + pValue2.n[0] + pValue3.n[0],
      pValue.n[1] + pValue2.n[1] + pValue3.n[1],
      pValue.n[2] + pValue2.n[2] + pValue3.n[2],
    ];
    if (values9[0] * values10[0] + values9[1] * values10[1] + values9[2] * values10[2] < 0) {
      [pValue2, pValue3] = [pValue3, pValue2];
    }
    for (let result of [pValue, pValue2, pValue3]) {
      values2.push(...result.p);
      values3.push(...result.n);
    }
  };
  let callback3 = (value8, value9, value10, value11) => {
    callback2(value8, value9, value10);
    callback2(value8, value10, value11);
  };
  let values4 = [-1, 1];
  for (let index2 = 0; index2 < 3; index2++) {
    for (let result2 of values4) {
      let result3 = (index2 + 1) % 3;
      let result4 = (index2 + 2) % 3;
      let callback4 = (value12, value13) => {
        let values11 = [0, 0, 0];
        values11[result3] = value12;
        values11[result4] = value13;
        return values11;
      };
      callback3(
        callback(index2, result2, callback4(-1, -1)),
        callback(index2, result2, callback4(1, -1)),
        callback(index2, result2, callback4(1, 1)),
        callback(index2, result2, callback4(-1, 1)),
      );
    }
  }
  for (let index3 = 0; index3 < 3; index3++) {
    for (let result5 = index3 + 1; result5 < 3; result5++) {
      let result6 = 3 - index3 - result5;
      for (let result7 of values4) {
        for (let result8 of values4) {
          let callback5 = (value14) => {
            let values12 = [0, 0, 0];
            values12[index3] = result7;
            values12[result5] = result8;
            values12[result6] = value14;
            return values12;
          };
          callback3(
            callback(index3, result7, callback5(-1)),
            callback(index3, result7, callback5(1)),
            callback(result5, result8, callback5(1)),
            callback(result5, result8, callback5(-1)),
          );
        }
      }
    }
  }
  for (let result9 of values4) {
    for (let result10 of values4) {
      for (let result11 of values4) {
        let values13 = [result9, result10, result11];
        callback2(
          callback(0, result9, values13),
          callback(1, result10, values13),
          callback(2, result11, values13),
        );
      }
    }
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(values2, 3));
  geometry.setAttribute(`normal`, new THREE.Float32BufferAttribute(values3, 3));
  return geometry;
}
