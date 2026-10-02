/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function createPlayerEllipsoidGeometry(value, value2, value3, value4 = 24, value5 = 16) {
  let sphereGeometry = new THREE.SphereGeometry(1, value4, value5);
  let position2 = sphereGeometry.attributes.position;
  let normal2 = sphereGeometry.attributes.normal;
  for (let index = 0; index < position2.count; index++) {
    let xResult = position2.getX(index);
    let yResult = position2.getY(index);
    let zResult = position2.getZ(index);
    position2.setXYZ(index, xResult * value, yResult * value2, zResult * value3);
    let result = xResult / value;
    let result2 = yResult / value2;
    let result3 = zResult / value3;
    let result4 = Math.hypot(result, result2, result3) || 1;
    normal2.setXYZ(index, result / result4, result2 / result4, result3 / result4);
  }
  return sphereGeometry;
}
