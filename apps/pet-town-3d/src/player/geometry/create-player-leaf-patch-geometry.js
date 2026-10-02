/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function createPlayerLeafPatchGeometry(value, value2, value3 = 20) {
  let planeGeometry = new THREE.PlaneGeometry(1, 1, 10, value3);
  let position2 = planeGeometry.attributes.position;
  for (let index = 0; index < position2.count; index++) {
    let result = position2.getX(index) * 2;
    let result2 = position2.getY(index) + 0.5;
    let result3 = ((Math.sin(Math.PI * result2) ** 0.8 * value2) / 2) * (1 - 0.25 * result2);
    position2.setXYZ(index, result * result3, (result2 - 0.5) * value, 0);
  }
  return planeGeometry;
}
