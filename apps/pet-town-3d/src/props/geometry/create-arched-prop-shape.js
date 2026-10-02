/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import * as THREE from "three";
export function createArchedPropShape(value, value2, value3 = value / 2) {
  let shape = new THREE.Shape();
  shape.moveTo(-value / 2, 0);
  shape.lineTo(value / 2, 0);
  shape.lineTo(value / 2, value2 - value3);
  shape.absarc(0, value2 - value3, value / 2, 0, Math.PI, false);
  shape.lineTo(-value / 2, 0);
  return shape;
}
