/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { createCreatureDeformedSphereGeometry } from "./create-creature-deformed-sphere-geometry.js";
export function createCreatureBodyGeometry(
  value,
  value2,
  value3,
  { taper: value4 = 0, flat: value5 = 0, sag: value6 = 0, ws: value7 = 28, hs: value8 = 20 } = {},
) {
  return createCreatureDeformedSphereGeometry(
    (setValue, value9, value10, value11) => {
      let result = 1 - value4 * value10 * 0.5;
      let value10Value = value10;
      if (value5 > 0) {
        let result3 = -1 + 0.5 * value5;
        let result4 = 0.18;
        let result5 = result3 + result4;
        if (value10 < result5) {
          value10Value = result5 - result4 * Math.tanh((result5 - value10) / result4);
        }
      }
      let result2 = 1 + value6 * (1 - value10) * 0.25 * (1 - value10 * value10);
      setValue.set(
        value9 * value * result * result2,
        value10Value * value2,
        value11 * value3 * result * result2,
      );
    },
    value7,
    value8,
  );
}
