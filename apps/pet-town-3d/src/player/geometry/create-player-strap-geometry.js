/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function createPlayerStrapGeometry(values, value, value2, value3, value4 = 8) {
  let values2 = [];
  let values3 = [];
  let values4 = [];
  let length2 = values.length;
  let vector = new THREE.Vector3();
  let vector2 = new THREE.Vector3();
  let vector3 = new THREE.Vector3();
  for (let index = 0; index < length2; index++) {
    vector
      .subVectors(values[Math.min(length2 - 1, index + 1)], values[Math.max(0, index - 1)])
      .normalize();
    vector3.copy(value[index]).addScaledVector(vector, -value[index].dot(vector)).normalize();
    vector2.crossVectors(vector, vector3).normalize();
    for (let index2 = 0; index2 <= value4; index2++) {
      let result = (index2 / value4) * Math.PI * 2;
      let result2 = Math.cos(result);
      let result3 = Math.sin(result);
      let result4 = (Math.sign(result2) * Math.abs(result2) ** 0.35 * value2) / 2;
      let result5 = (Math.sign(result3) * Math.abs(result3) ** 0.35 * value3) / 2;
      let position = values[index];
      values2.push(
        position.x + vector2.x * result4 + vector3.x * result5,
        position.y + vector2.y * result4 + vector3.y * result5,
        position.z + vector2.z * result4 + vector3.z * result5,
      );
      let normalizeResult = new THREE.Vector3()
        .addScaledVector(vector2, result2)
        .addScaledVector(vector3, result3 * 1.5)
        .normalize();
      values3.push(normalizeResult.x, normalizeResult.y, normalizeResult.z);
    }
  }
  for (let index3 = 0; index3 < length2 - 1; index3++) {
    for (let index4 = 0; index4 < value4; index4++) {
      let result6 = index3 * (value4 + 1) + index4;
      let result7 = result6 + value4 + 1;
      values4.push(result6, result7, result6 + 1, result7, result7 + 1, result6 + 1);
    }
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(values2, 3));
  geometry.setAttribute(`normal`, new THREE.Float32BufferAttribute(values3, 3));
  geometry.setIndex(values4);
  return geometry;
}
