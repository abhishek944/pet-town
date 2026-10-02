/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import * as THREE from "three";
export function createTaperedSquareColumn(value, value2, value3) {
  let toNonIndexedResult = new THREE.CylinderGeometry(
    value * Math.SQRT1_2,
    value2 * Math.SQRT1_2,
    value3,
    4,
    1,
  ).toNonIndexed();
  toNonIndexedResult.rotateY(Math.PI / 4);
  toNonIndexedResult.deleteAttribute(`normal`);
  toNonIndexedResult.computeVertexNormals();
  return toNonIndexedResult;
}
