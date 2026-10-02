/** Deterministic random streams, hashes, value noise and interpolation for vegetation placement and geometry. */
import { vegetationValueNoise2d } from "./vegetation-value-noise2d.js";
export function vegetationFractalNoise2d(value, value2, value3 = 0, value4 = 4) {
  let index = 0;
  let result = 0.5;
  let result2 = 1;
  let index2 = 0;
  for (let index3 = 0; index3 < value4; index3++) {
    index +=
      result * vegetationValueNoise2d(value * result2, value2 * result2, value3 + index3 * 17);
    index2 += result;
    result *= 0.5;
    result2 *= 2.03;
  }
  return index / index2;
}
