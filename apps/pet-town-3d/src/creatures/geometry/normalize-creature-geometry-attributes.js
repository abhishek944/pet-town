/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
export function normalizeCreatureGeometryAttributes(attributesValue) {
  for (let result of Object.keys(attributesValue.attributes)) {
    if (result !== `position` && result !== `normal` && result !== `color`) {
      attributesValue.deleteAttribute(result);
    }
  }
  if (!attributesValue.index) {
    let uint32Array = new Uint32Array(attributesValue.attributes.position.count);
    for (let index2 = 0; index2 < uint32Array.length; index2++) {
      uint32Array[index2] = index2;
    }
    attributesValue.setIndex(new THREE.BufferAttribute(uint32Array, 1));
  }
  return attributesValue;
}
