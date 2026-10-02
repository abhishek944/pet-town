/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function createPlayerRoundedBoxGeometry(value, value2, value3, value4 = 0.28) {
  let sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
  let position2 = sphereGeometry.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let callback = (value5) => Math.sign(value5) * Math.abs(value5) ** +value4;
    position2.setXYZ(
      index,
      (callback(position2.getX(index)) * value) / 2,
      (callback(position2.getY(index)) * value2) / 2,
      (callback(position2.getZ(index)) * value3) / 2,
    );
  }
  sphereGeometry.computeVertexNormals();
  return sphereGeometry;
}
