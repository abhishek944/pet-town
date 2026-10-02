/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
export function projectCreaturePointOntoEllipsoid(position, value, setValue = new THREE.Vector3()) {
  let result =
    Math.sqrt(
      (position.x / value[0]) ** 2 + (position.y / value[1]) ** 2 + (position.z / value[2]) ** 2,
    ) || 1;
  return setValue.set(position.x / result, position.y / result, position.z / result);
}
