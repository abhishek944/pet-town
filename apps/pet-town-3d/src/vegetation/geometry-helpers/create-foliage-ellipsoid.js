/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import * as THREE from "three";
export function createFoliageEllipsoid(value, value2 = 8, value3 = 6, value4 = 1) {
  let sphereGeometry = new THREE.SphereGeometry(value, value2, value3);
  if (value4 !== 1) {
    sphereGeometry.scale(1, value4, 1);
  }
  return sphereGeometry;
}
