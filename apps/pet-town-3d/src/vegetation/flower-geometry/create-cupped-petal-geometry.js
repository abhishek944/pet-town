/** Cupped petals, flower rings, bent stems and flower variants with levels of detail. */
import * as THREE from "three";
export function createCuppedPetalGeometry(
  value,
  value2,
  {
    cupL: value3 = 0.3,
    cupW: value4 = 0.4,
    curl: value5 = 0.15,
    widths: value6 = [0.34, 1, 0.74],
    ss: values = [0, 0.42, 0.8],
    cols: value7 = 3,
  } = {},
) {
  let values2 = [];
  let values3 = [];
  let values4 = [];
  let values5 = [];
  let values6 = value7 === 5 ? [-1, -0.5, 0, 0.5, 1] : [-1, 0, 1];
  let length2 = values6.length;
  let callback = (value8, value9) =>
    value3 * value * value8 * value8 +
    value4 * value2 * value9 * value9 * (0.4 + 0.6 * value8) -
    value5 * value * Math.max(0, value8 - 0.72) ** 2 * 5;
  for (let index = 0; index < values.length; index++) {
    let result3 = values[index];
    let result4 = value2 * value6[index];
    for (let result5 of values6) {
      values2.push(
        value * result3,
        callback(result3, result5) + (result5 === 0 ? -0.08 * value2 * result3 : 0),
        result5 * result4 * (1 - 0.12 * (1 - Math.abs(result5)) * 0),
      );
      values4.push(result3);
      values5.push(Math.abs(result5));
    }
  }
  values2.push(value, callback(1, 0), 0);
  values4.push(1);
  values5.push(0);
  for (let index2 = 0; index2 < values.length - 1; index2++) {
    let result6 = index2 * length2;
    let result7 = result6 + length2;
    for (let index3 = 0; index3 < length2 - 1; index3++) {
      values3.push(
        result6 + index3,
        result7 + index3,
        result6 + index3 + 1,
        result6 + index3 + 1,
        result7 + index3,
        result7 + index3 + 1,
      );
    }
  }
  let result = (values.length - 1) * length2;
  let result2 = values.length * length2;
  for (let index4 = 0; index4 < length2 - 1; index4++) {
    values3.push(result + index4, result2, result + index4 + 1);
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(values2, 3));
  geometry.setIndex(values3);
  geometry.computeVertexNormals();
  let normal2 = geometry.attributes.normal;
  for (let index5 = 0; index5 < normal2.count; index5++) {
    if (normal2.getY(index5) < 0) {
      normal2.setXYZ(index5, -normal2.getX(index5), -normal2.getY(index5), -normal2.getZ(index5));
    }
  }
  geometry.userData.s = values4;
  geometry.userData.u = values5;
  return geometry;
}
