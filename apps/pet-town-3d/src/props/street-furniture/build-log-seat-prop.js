/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import * as THREE from "three";
import { createBeveledPropCylinder } from "../geometry/create-beveled-prop-cylinder.js";
import { propsState } from "../state.js";
export function buildLogSeatProp(values, value, lenValue = {}) {
  let result = lenValue.len ?? 1.5;
  let result2 = lenValue.r ?? 0.22;
  values.push(0, result2 * 0.85, 0, 0, 0, Math.PI / 2);
  values.add(`wood`, createBeveledPropCylinder(result2, result, 12, 0.05), {
    y: -result / 2,
    tint: propsState.propPalette.bark,
    uv: {
      mode: `native`,
      su: 0.8,
      sv: result / 2,
      swap: true,
    },
    jitter: 0.05,
  });
  for (let result3 of [-1, 1]) {
    values.add(`plain`, new THREE.CircleGeometry(result2 * 0.86, 14), {
      y: result3 * (result / 2 + 0.003),
      rx: (-result3 * Math.PI) / 2,
      tint: 15189134,
      colorFn: (multiplyScalarValue, value2, value3, value4) =>
        multiplyScalarValue.multiplyScalar(0.82 + 0.18 * Math.cos(Math.hypot(value2, value4) * 60)),
    });
  }
  values.pop();
  values.add(`wood`, createBeveledPropCylinder(0.06, 0.2, 6, 0.02), {
    x: 0.3,
    y: result2 * 1.5,
    z: 0.05,
    rx: 0.4,
    tint: propsState.propPalette.bark,
  });
  return {
    radius: result / 2,
    colliders: [
      {
        x: 0,
        z: 0,
        w: result,
        d: result2 * 2,
        radius: result / 2,
        h: result2 * 1.8,
      },
    ],
  };
}
