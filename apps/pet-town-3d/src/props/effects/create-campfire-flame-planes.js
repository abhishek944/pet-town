/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
import * as THREE from "three";
export function createCampfireFlamePlanes(nextValue) {
  let values = [];
  let values2 = [];
  let values3 = [];
  let values4 = [];
  let callback = (value, value2, value3, value4, value5, value6) => {
    let result = Math.cos(value3);
    let result2 = Math.sin(value3);
    let result3 = values.length / 3;
    for (let [result4, result5] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]) {
      let result6 = (result4 - 0.5) * value4;
      values.push(value + result * result6, result5 * value5 - 0.05, value2 - result2 * result6);
      values2.push(result4, result5 * 0.94 + 0.06);
      values3.push(value6);
    }
    values4.push(result3, result3 + 1, result3 + 2, result3, result3 + 2, result3 + 3);
  };
  for (let index = 0; index < 4; index++) {
    callback(0, 0, (index * Math.PI) / 4, 0.78, 1.25, nextValue.next() * 10);
  }
  for (let index2 = 0; index2 < 3; index2++) {
    let result7 = (index2 / 3) * Math.PI * 2 + 0.5;
    callback(
      Math.cos(result7) * 0.15,
      Math.sin(result7) * 0.15,
      result7 + Math.PI / 2,
      0.45,
      nextValue.range(0.7, 0.9),
      nextValue.next() * 10,
    );
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(values, 3));
  geometry.setAttribute(`uv`, new THREE.Float32BufferAttribute(values2, 2));
  geometry.setAttribute(`aPhase`, new THREE.Float32BufferAttribute(values3, 1));
  geometry.setIndex(values4);
  return geometry;
}
