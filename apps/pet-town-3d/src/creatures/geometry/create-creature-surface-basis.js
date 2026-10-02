/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
export function createCreatureSurfaceBasis(cloneValue, value = new THREE.Vector3(0, 1, 0)) {
  let normalizeResult = cloneValue.clone().normalize();
  let crossVectorsResult = new THREE.Vector3().crossVectors(value, normalizeResult);
  if (crossVectorsResult.lengthSq() < 1e-6) {
    crossVectorsResult.set(1, 0, 0);
  }
  crossVectorsResult.normalize();
  let normalizeResult2 = new THREE.Vector3()
    .crossVectors(normalizeResult, crossVectorsResult)
    .normalize();
  return new THREE.Matrix4().makeBasis(crossVectorsResult, normalizeResult2, normalizeResult);
}
