/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import * as THREE from "three";
export function extrudePropShape(value, value2, value3 = 0.03, value4 = 10) {
  let extrudeGeometry = new THREE.ExtrudeGeometry(value, {
    depth: Math.max(value2 - 2 * value3, 0.001),
    bevelEnabled: value3 > 0,
    bevelThickness: value3,
    bevelSize: value3,
    bevelSegments: 2,
    curveSegments: value4,
  });
  extrudeGeometry.translate(0, 0, -value2 / 2 + value3);
  return extrudeGeometry;
}
