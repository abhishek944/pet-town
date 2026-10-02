/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
import * as THREE from "three";
export function createAdaptiveWaterGrid(value, value2, value3, value4, value5) {
  let values = [];
  for (let result = -value3; result <= value3 + 1e-6; result += value5) {
    values.push(result);
  }
  let value3Value = value3;
  let value5Value = value5;
  let values2 = [];
  for (; value3Value < value4;) {
    value5Value *= 1.2;
    value3Value = Math.min(value4, value3Value + value5Value);
    values2.push(value3Value);
  }
  let values3 = [
    ...values2
      .slice()
      .reverse()
      .map((value6) => -value6),
    ...values,
    ...values2,
  ];
  let length2 = values3.length;
  let floatBuffer = new Float32Array(length2 * length2 * 3);
  let floatBuffer2 = new Float32Array(length2 * length2 * 3);
  for (let index2 = 0; index2 < length2; index2++) {
    for (let index3 = 0; index3 < length2; index3++) {
      let result2 = (index2 * length2 + index3) * 3;
      floatBuffer[result2] = value + values3[index3];
      floatBuffer[result2 + 1] = 0;
      floatBuffer[result2 + 2] = value2 + values3[index2];
      floatBuffer2[result2 + 1] = 1;
    }
  }
  let uint32Array = new Uint32Array((length2 - 1) * (length2 - 1) * 6);
  let index = 0;
  for (let index4 = 0; index4 < length2 - 1; index4++) {
    for (let index5 = 0; index5 < length2 - 1; index5++) {
      let result3 = index4 * length2 + index5;
      let result4 = (index4 + 1) * length2 + index5;
      let result5 = result3 + 1;
      let result6 = result4 + 1;
      uint32Array[index++] = result3;
      uint32Array[index++] = result4;
      uint32Array[index++] = result5;
      uint32Array[index++] = result5;
      uint32Array[index++] = result4;
      uint32Array[index++] = result6;
    }
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.BufferAttribute(floatBuffer, 3));
  geometry.setAttribute(`normal`, new THREE.BufferAttribute(floatBuffer2, 3));
  geometry.setIndex(new THREE.BufferAttribute(uint32Array, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(value, 0, value2), value4 * 1.5);
  return geometry;
}
