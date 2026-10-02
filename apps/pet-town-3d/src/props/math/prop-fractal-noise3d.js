/** Prop interpolation, seeded random and deterministic 3D noise. */
import { propValueNoise3d } from "./prop-value-noise3d.js";
export let propFractalNoise3d = (value, value2, value3, value4 = 3) => {
  let index = 0;
  let result = 1;
  let index2 = 0;
  for (let index3 = 0; index3 < value4; index3++) {
    index += propValueNoise3d(value * result, value2 * result, value3 * result) / result;
    index2 += 1 / result;
    result *= 2;
  }
  return index / index2;
};
