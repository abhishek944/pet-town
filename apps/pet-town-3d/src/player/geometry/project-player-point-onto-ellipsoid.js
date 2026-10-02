/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function projectPlayerPointOntoEllipsoid(position, value, setValue = new THREE.Vector3()) {
  let result =
    1 /
    Math.sqrt(
      (position.x / value[0]) ** 2 + (position.y / value[1]) ** 2 + (position.z / value[2]) ** 2 ||
        1,
    );
  return setValue.set(position.x * result, position.y * result, position.z * result);
}
