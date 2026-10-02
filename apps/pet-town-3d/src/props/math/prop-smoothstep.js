/** Prop interpolation, seeded random and deterministic 3D noise. */
import { clampPropValue } from "./clamp-prop-value.js";
export let propSmoothstep = (value, value2, value3) => {
  let clampPropValueResult = clampPropValue((value3 - value) / (value2 - value));
  return clampPropValueResult * clampPropValueResult * (3 - 2 * clampPropValueResult);
};
