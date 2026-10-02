/** Wall shading, ivy, trailing vines, flower rosettes, cottage windows and gabled roof details. */
import * as THREE from "three";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
export function appendRoundWindowGeometry(addValue, value, value2, value3) {
  addValue.add(`glass`, new THREE.CylinderGeometry(value2, value2, 0.08, 20), {
    rx: Math.PI / 2,
    uv: {
      mode: `unit`,
    },
    noAO: true,
  });
  addValue.add(`paint`, new THREE.TorusGeometry(value2 + 0.04, 0.075, 8, 22), {
    z: 0.05,
    tint: value3,
  });
  addValue.add(`paint`, createBeveledPropBox(0.06, value2 * 2, 0.06, 0.012), {
    z: 0.05,
    tint: value3,
    uv: {
      grain: 1,
    },
  });
  addValue.add(`paint`, createBeveledPropBox(value2 * 2, 0.06, 0.06, 0.012), {
    z: 0.05,
    tint: value3,
  });
}
