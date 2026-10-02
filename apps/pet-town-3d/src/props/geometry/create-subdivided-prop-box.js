/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import * as THREE from "three";
export function createSubdividedPropBox(value, value2, value3, value4 = 0.35) {
  let callback = (value5) => Math.max(1, Math.round(value5 / value4));
  return new THREE.BoxGeometry(
    value,
    value2,
    value3,
    callback(value),
    callback(value2),
    callback(value3),
  ).toNonIndexed();
}
