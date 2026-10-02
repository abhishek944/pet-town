/** Skinned mesh batching, per-vertex material properties and shadow proxy extraction. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { packCreatureMaterialProperties } from "./pack-creature-material-properties.js";
export function bakeCreatureMeshGeometry(mesh, value, value2, value3) {
  let copy2 = mesh.geometry.clone();
  mesh.updateWorldMatrix(true, false);
  copy2.applyMatrix4(creaturesState.creatureBakeMatrixScratch.copy(mesh.matrixWorld));
  let count2 = copy2.attributes.position.count;
  if (!copy2.index) {
    let uint32Array = new Uint32Array(count2);
    for (let index2 = 0; index2 < count2; index2++) {
      uint32Array[index2] = index2;
    }
    copy2.setIndex(new THREE.BufferAttribute(uint32Array, 1));
  }
  if ((copy2.attributes.normal || copy2.computeVertexNormals(), !copy2.attributes.color)) {
    let color2 = mesh.material.color ?? new THREE.Color(1, 1, 1);
    let floatBuffer2 = new Float32Array(count2 * 3);
    for (let index3 = 0; index3 < count2; index3++) {
      floatBuffer2[index3 * 3] = color2.r;
      floatBuffer2[index3 * 3 + 1] = color2.g;
      floatBuffer2[index3 * 3 + 2] = color2.b;
    }
    copy2.setAttribute(`color`, new THREE.BufferAttribute(floatBuffer2, 3));
  }
  let result =
    value3 === `blush` ? [`position`, `normal`, `color`, `uv`] : [`position`, `normal`, `color`];
  for (let result2 of Object.keys(copy2.attributes)) {
    if (!result.includes(result2)) {
      copy2.deleteAttribute(result2);
    }
  }
  if (value3 === `opaque`) {
    let result3 = packCreatureMaterialProperties(value2, mesh.material) ?? [0.8, 0, 0, 0];
    let floatBuffer3 = new Float32Array(count2 * 4);
    for (let index4 = 0; index4 < count2; index4++) {
      floatBuffer3.set(result3, index4 * 4);
    }
    copy2.setAttribute(`crp`, new THREE.BufferAttribute(floatBuffer3, 4));
  }
  let uint16Array = new Uint16Array(count2 * 4);
  let floatBuffer = new Float32Array(count2 * 4);
  for (let index5 = 0; index5 < count2; index5++) {
    uint16Array[index5 * 4] = value;
    floatBuffer[index5 * 4] = 1;
  }
  copy2.setAttribute(`skinIndex`, new THREE.Uint16BufferAttribute(uint16Array, 4));
  copy2.setAttribute(`skinWeight`, new THREE.Float32BufferAttribute(floatBuffer, 4));
  copy2.morphAttributes = {};
  return copy2;
}
