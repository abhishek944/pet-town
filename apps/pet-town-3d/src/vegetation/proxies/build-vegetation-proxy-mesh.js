/** Merged reflection and shadow proxy meshes with removable vertex ranges. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { getVegetationRenderPass } from "../instances/get-vegetation-render-pass.js";
export function buildVegetationProxyMesh(value, value2, value3) {
  let index2 = 0;
  let index3 = 0;
  for (let result2 of value) {
    for (let result3 of value3(result2)) {
      index2 += result3.attributes.position.count;
      index3 += result3.index.count;
    }
  }
  if (!index2) {
    return null;
  }
  let floatBuffer = new Float32Array(index2 * 3);
  let floatBuffer2 = new Float32Array(index2 * 3);
  let floatBuffer3 = new Float32Array(index2 * 3);
  let floatBuffer4 = new Float32Array(index2);
  let floatBuffer5 = new Float32Array(index2 * 3);
  let uint32Array = new Uint32Array(index3);
  let matrix3 = new THREE.Matrix3();
  let vector = new THREE.Vector3();
  let index4 = 0;
  let index5 = 0;
  for (let position2 of value) {
    position2.field.matrixOf(position2, vegetationState.vegetationInstanceMatrix);
    matrix3.getNormalMatrix(vegetationState.vegetationInstanceMatrix);
    let color2 = position2.tint || (position2.owner ? position2.owner.parts[1]?.tint : null);
    let index4Value = index4;
    for (let result4 of value3(position2)) {
      let position3 = result4.attributes.position;
      let normal2 = result4.attributes.normal;
      let color3 = result4.attributes.color;
      let aSway2 = result4.attributes.aSway;
      let aTint2 = result4.attributes.aTint;
      let array2 = result4.index.array;
      for (let index6 = 0; index6 < position3.count; index6++) {
        vector
          .fromBufferAttribute(position3, index6)
          .applyMatrix4(vegetationState.vegetationInstanceMatrix);
        floatBuffer[(index4 + index6) * 3] = vector.x;
        floatBuffer[(index4 + index6) * 3 + 1] = vector.y;
        floatBuffer[(index4 + index6) * 3 + 2] = vector.z;
        vector.fromBufferAttribute(normal2, index6).applyMatrix3(matrix3).normalize();
        floatBuffer2[(index4 + index6) * 3] = vector.x;
        floatBuffer2[(index4 + index6) * 3 + 1] = vector.y;
        floatBuffer2[(index4 + index6) * 3 + 2] = vector.z;
        let result5 = aTint2 ? aTint2.getX(index6) : 0;
        floatBuffer3[(index4 + index6) * 3] =
          color3.getX(index6) * (color2 && result5 ? 1 + (color2.r - 1) * result5 : 1);
        floatBuffer3[(index4 + index6) * 3 + 1] =
          color3.getY(index6) * (color2 && result5 ? 1 + (color2.g - 1) * result5 : 1);
        floatBuffer3[(index4 + index6) * 3 + 2] =
          color3.getZ(index6) * (color2 && result5 ? 1 + (color2.b - 1) * result5 : 1);
        floatBuffer4[index4 + index6] = aSway2 ? aSway2.getX(index6) * position2.sy : 0;
        floatBuffer5[(index4 + index6) * 3] = position2.x;
        floatBuffer5[(index4 + index6) * 3 + 1] = position2.y;
        floatBuffer5[(index4 + index6) * 3 + 2] = position2.z;
      }
      for (let index7 = 0; index7 < array2.length; index7++) {
        uint32Array[index5 + index7] = array2[index7] + index4;
      }
      index4 += position3.count;
      index5 += array2.length;
    }
    (position2.proxyRanges ||= {})[value2] = [index4Value, index4];
  }
  let geometry2 = new THREE.BufferGeometry();
  geometry2.setAttribute(`position`, new THREE.BufferAttribute(floatBuffer, 3));
  geometry2.setAttribute(`normal`, new THREE.BufferAttribute(floatBuffer2, 3));
  geometry2.setAttribute(`color`, new THREE.BufferAttribute(floatBuffer3, 3));
  geometry2.setAttribute(`aSway`, new THREE.BufferAttribute(floatBuffer4, 1));
  geometry2.setAttribute(`aTint`, new THREE.BufferAttribute(new Float32Array(index2), 1));
  geometry2.setAttribute(`aOrigin`, new THREE.BufferAttribute(floatBuffer5, 3));
  geometry2.setIndex(new THREE.BufferAttribute(uint32Array, 1));
  geometry2.computeBoundingSphere();
  let mesh = new THREE.Mesh(geometry2, vegetationState.vegetationRuntimeState.materials.proxy.mat);
  mesh.name = value2 === `refl` ? `veg:reflproxy_canopy` : `veg:shadowproxy`;
  mesh.castShadow = value2 === `shadow`;
  mesh.receiveShadow = false;
  mesh.frustumCulled = value2 === `refl`;
  mesh.customDepthMaterial = vegetationState.vegetationRuntimeState.materials.proxy.depth;
  mesh.userData.veg = true;
  mesh.userData.proxy = value2;
  let result = value2 === `refl` ? 2 : -1;
  mesh.onBeforeRender = function (value4) {
    if (getVegetationRenderPass(value4) !== result) {
      this.userData.dr = this.geometry.drawRange.count;
      this.geometry.drawRange.count = 0;
    }
  };
  mesh.onAfterRender = function () {
    if (this.userData.dr !== undefined) {
      this.geometry.drawRange.count = this.userData.dr;
      this.userData.dr = undefined;
    }
  };
  vegetationState.vegetationRuntimeState.group.add(mesh);
  return mesh;
}
