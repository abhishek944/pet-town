/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
export function creatureEllipsoidNormal(position, value, setValue = new THREE.Vector3()) {
  return setValue
    .set(
      position.x / (value[0] * value[0]),
      position.y / (value[1] * value[1]),
      position.z / (value[2] * value[2]),
    )
    .normalize();
}
