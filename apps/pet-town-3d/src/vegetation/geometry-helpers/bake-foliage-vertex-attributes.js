/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
export function bakeFoliageVertexAttributes(attributesValue, value) {
  if (!attributesValue.attributes.normal) {
    attributesValue.computeVertexNormals();
  }
  let position2 = attributesValue.attributes.position;
  let normal2 = attributesValue.attributes.normal;
  let count2 = position2.count;
  let floatBuffer = new Float32Array(count2 * 3);
  let floatBuffer2 = new Float32Array(count2);
  let floatBuffer3 = new Float32Array(count2);
  let floatBuffer4 = new Float32Array(count2 * 3);
  for (let index2 = 0; index2 < count2; index2++) {
    vegetationState.foliageVertexPositionScratch.fromBufferAttribute(position2, index2);
    vegetationState.foliageVertexNormalScratch.fromBufferAttribute(normal2, index2);
    let valueResult = value(
      vegetationState.foliageVertexPositionScratch,
      vegetationState.foliageVertexNormalScratch,
      index2,
    );
    floatBuffer[index2 * 3] = valueResult.c[0];
    floatBuffer[index2 * 3 + 1] = valueResult.c[1];
    floatBuffer[index2 * 3 + 2] = valueResult.c[2];
    floatBuffer2[index2] = valueResult.s ?? 0;
    floatBuffer3[index2] = valueResult.t ?? 0;
    let position3 = valueResult.n || vegetationState.foliageVertexNormalScratch;
    floatBuffer4[index2 * 3] = position3.x;
    floatBuffer4[index2 * 3 + 1] = position3.y;
    floatBuffer4[index2 * 3 + 2] = position3.z;
  }
  let geometry = new THREE.BufferGeometry();
  let floatBuffer5 = new Float32Array(count2 * 3);
  for (let index3 = 0; index3 < count2; index3++) {
    floatBuffer5[index3 * 3] = position2.getX(index3);
    floatBuffer5[index3 * 3 + 1] = position2.getY(index3);
    floatBuffer5[index3 * 3 + 2] = position2.getZ(index3);
  }
  geometry.setAttribute(`position`, new THREE.BufferAttribute(floatBuffer5, 3));
  geometry.setAttribute(`normal`, new THREE.BufferAttribute(floatBuffer4, 3));
  let floatBuffer6 = new Float32Array(count2 * 2);
  let uv2 = attributesValue.attributes.uv;
  if (uv2) {
    for (let index4 = 0; index4 < count2; index4++) {
      floatBuffer6[index4 * 2] = uv2.getX(index4);
      floatBuffer6[index4 * 2 + 1] = uv2.getY(index4);
    }
  }
  geometry.setAttribute(`uv`, new THREE.BufferAttribute(floatBuffer6, 2));
  geometry.setAttribute(`color`, new THREE.BufferAttribute(floatBuffer, 3));
  geometry.setAttribute(`aSway`, new THREE.BufferAttribute(floatBuffer2, 1));
  geometry.setAttribute(`aTint`, new THREE.BufferAttribute(floatBuffer3, 1));
  geometry.setIndex(
    attributesValue.index
      ? Array.from(attributesValue.index.array)
      : Array.from(
          {
            length: count2,
          },
          (value2, value3) => value3,
        ),
  );
  return geometry;
}
