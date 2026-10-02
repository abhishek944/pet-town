/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import * as THREE from "three";
export function createFoliageBufferGeometry(values, value, value2, value3) {
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(values, 3));
  geometry.setAttribute(`normal`, new THREE.Float32BufferAttribute(value, 3));
  geometry.setAttribute(
    `uv`,
    new THREE.Float32BufferAttribute(value2 || Array((values.length / 3) * 2).fill(0), 2),
  );
  geometry.setIndex(value3);
  return geometry;
}
