/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function createPlayerSurfaceDecalGeometry(
  atValue,
  value,
  value2,
  value3,
  value4,
  value5 = 0.003,
) {
  let circleGeometry = new THREE.CircleGeometry(1, 24);
  let position2 = circleGeometry.attributes.position;
  let vector = new THREE.Vector3();
  for (let index = 0; index < position2.count; index++) {
    atValue.at(
      value + position2.getX(index) * value3,
      value2 + position2.getY(index) * value4,
      value5,
      vector,
    );
    position2.setXYZ(index, vector.x, vector.y, vector.z);
  }
  circleGeometry.computeVertexNormals();
  return circleGeometry;
}
