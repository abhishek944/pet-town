/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import * as THREE from "three";
export function createPropLathe(mapValue, value = 16, value2 = false, value3 = 0) {
  let latheGeometry = new THREE.LatheGeometry(
    mapValue.map(([value4, value5]) => new THREE.Vector2(Math.max(value4, 1e-4), value5)),
    value,
    value3,
  );
  if (!value2) {
    return latheGeometry;
  }
  let toNonIndexedResult = latheGeometry.toNonIndexed();
  toNonIndexedResult.deleteAttribute(`normal`);
  toNonIndexedResult.computeVertexNormals();
  return toNonIndexedResult;
}
