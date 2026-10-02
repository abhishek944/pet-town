/** Deterministic random streams, hashes, value noise and interpolation for vegetation placement and geometry. */
import { vegetationValueNoise3d } from "./vegetation-value-noise3d.js";
export function vegetationFractalNoise3d(value, value2, value3, value4 = 0, value5 = 3) {
  let index = 0;
  let result = 0.5;
  let result2 = 1;
  let index2 = 0;
  for (let index3 = 0; index3 < value5; index3++) {
    index +=
      result *
      vegetationValueNoise3d(
        value * result2,
        value2 * result2,
        value3 * result2,
        value4 + index3 * 31,
      );
    index2 += result;
    result *= 0.5;
    result2 *= 2.1;
  }
  return index / index2;
}
