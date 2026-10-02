/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
export function creatureSphericalDirection(value, value2, setValue = new THREE.Vector3()) {
  return setValue.set(
    Math.sin(value) * Math.cos(value2),
    Math.sin(value2),
    Math.cos(value) * Math.cos(value2),
  );
}
