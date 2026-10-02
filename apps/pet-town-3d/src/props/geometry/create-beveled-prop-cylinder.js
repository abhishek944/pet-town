/** Beveled primitives, gables, lathes, extruded arches and noisy rocks. */
import { createPropLathe } from "./create-prop-lathe.js";
export function createBeveledPropCylinder(
  value,
  value2,
  value3 = 12,
  value4 = 0.04,
  value5 = false,
) {
  let result = Math.min(value4, value * 0.4, value2 * 0.4);
  return createPropLathe(
    [
      [0, 0],
      [value - result, 0],
      [value, result],
      [value, value2 - result],
      [value - result, value2],
      [0, value2],
    ],
    value3,
    value5,
  );
}
