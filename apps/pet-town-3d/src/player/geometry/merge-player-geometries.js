/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function mergePlayerGeometries(everyValue) {
  let index2 = 0;
  let index3 = 0;
  for (let result2 of everyValue) {
    index2 += result2.attributes.position.count;
    index3 += result2.index ? result2.index.count : result2.attributes.position.count;
  }
  let floatBuffer = new Float32Array(index2 * 3);
  let floatBuffer2 = new Float32Array(index2 * 3);
  let uint32Array = new Uint32Array(index3);
  let result = everyValue.every((attributesValue) => attributesValue.attributes.color)
    ? new Float32Array(index2 * 3)
    : null;
  let index4 = 0;
  let index5 = 0;
  for (let result3 of everyValue) {
    let count2 = result3.attributes.position.count;
    if (
      (floatBuffer.set(result3.attributes.position.array, index4 * 3),
      floatBuffer2.set(result3.attributes.normal.array, index4 * 3),
      result && result.set(result3.attributes.color.array, index4 * 3),
      result3.index)
    ) {
      for (let index6 = 0; index6 < result3.index.count; index6++) {
        uint32Array[index5 + index6] = result3.index.array[index6] + index4;
      }
      index5 += result3.index.count;
    } else {
      for (let index7 = 0; index7 < count2; index7++) {
        uint32Array[index5 + index7] = index4 + index7;
      }
      index5 += count2;
    }
    index4 += count2;
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.BufferAttribute(floatBuffer, 3));
  geometry.setAttribute(`normal`, new THREE.BufferAttribute(floatBuffer2, 3));
  if (result) {
    geometry.setAttribute(`color`, new THREE.BufferAttribute(result, 3));
  }
  geometry.setIndex(new THREE.BufferAttribute(uint32Array, 1));
  return geometry;
}
