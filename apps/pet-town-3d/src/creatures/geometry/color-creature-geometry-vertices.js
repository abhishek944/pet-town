/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function colorCreatureGeometryVertices(attributesValue, value) {
  let position2 = attributesValue.attributes.position;
  let normal2 = attributesValue.attributes.normal;
  let count2 = position2.count;
  let color2 = attributesValue.attributes.color;
  if (!color2) {
    color2 = new THREE.BufferAttribute(new Float32Array(count2 * 3), 3);
    attributesValue.setAttribute(`color`, color2);
  }
  let t2 = attributesValue.userData.t;
  let color3 = new THREE.Color();
  for (let index = 0; index < count2; index++) {
    creaturesState.creatureGeometryPositionScratch.fromBufferAttribute(position2, index);
    creaturesState.creatureGeometryNormalScratch.fromBufferAttribute(normal2, index);
    color3.setRGB(1, 1, 1);
    value(
      color3,
      creaturesState.creatureGeometryPositionScratch,
      creaturesState.creatureGeometryNormalScratch,
      t2 ? t2[index] : 0,
      index,
    );
    color2.setXYZ(index, color3.r, color3.g, color3.b);
  }
  color2.needsUpdate = true;
  return attributesValue;
}
