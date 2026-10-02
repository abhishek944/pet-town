/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { createCreatureDeformedSphereGeometry } from "./create-creature-deformed-sphere-geometry.js";
export function createCreaturePetalGeometry(
  value,
  value2,
  value3,
  {
    tip: value4 = 0.8,
    base: value5 = 0.35,
    bend: value6 = 0,
    cup: value7 = 0,
    thinTip: value8 = 0.6,
    ws: value9 = 12,
    hs: value10 = 11,
    twist: value11 = 0,
  } = {},
) {
  let result = value5 / (value5 + value4);
  let result2 = result ** +value5 * (1 - result) ** value4;
  return createCreatureDeformedSphereGeometry(
    (setValue, value12, value13, value14, value15) => {
      let result3 = (value15 ** +value5 * (1 - value15) ** value4) / result2;
      let result4 = Math.sqrt(Math.max(0, 1 - value13 * value13)) || 1e-6;
      let result5 = value12 / result4;
      let result6 = value14 / result4;
      let result7 = result5 * value * result3 * Math.min(1, result4 * 3);
      let result8 =
        result6 * (value3 * result3 ** +value8 * Math.min(1, result4 * 3)) +
        (result7 / (value || 1)) * value7 * (result7 / (value || 1)) * value +
        value6 * value2 * value15 * value15;
      let result7Value = result7;
      if (value11) {
        let result9 = value11 * value15;
        let result10 = Math.cos(result9);
        let result11 = Math.sin(result9);
        result7Value = result7 * result10 - result8 * result11;
        result8 = result7 * result11 + result8 * result10;
      }
      setValue.set(result7Value, value15 * value2, result8);
    },
    value9,
    value10,
  );
}
