/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
export function mergeCreatureTexturedGeometries(value) {
  let index2 = 0;
  let index3 = 0;
  for (let result of value) {
    index2 += result.attributes.position.count;
    index3 += result.index.count;
  }
  let floatBuffer = new Float32Array(index2 * 3);
  let floatBuffer2 = new Float32Array(index2 * 3);
  let floatBuffer3 = new Float32Array(index2 * 2);
  let uint16Array = new Uint16Array(index3);
  let index4 = 0;
  let index5 = 0;
  for (let result2 of value) {
    floatBuffer.set(result2.attributes.position.array, index4 * 3);
    floatBuffer2.set(result2.attributes.normal.array, index4 * 3);
    floatBuffer3.set(result2.attributes.uv.array, index4 * 2);
    for (let index6 = 0; index6 < result2.index.count; index6++) {
      uint16Array[index5 + index6] = result2.index.array[index6] + index4;
    }
    index4 += result2.attributes.position.count;
    index5 += result2.index.count;
  }
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.BufferAttribute(floatBuffer, 3));
  geometry.setAttribute(`normal`, new THREE.BufferAttribute(floatBuffer2, 3));
  geometry.setAttribute(`uv`, new THREE.BufferAttribute(floatBuffer3, 2));
  geometry.setIndex(new THREE.BufferAttribute(uint16Array, 1));
  return geometry;
}
