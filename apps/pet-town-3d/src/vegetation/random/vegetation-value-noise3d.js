/** Deterministic random streams, hashes, value noise and interpolation for vegetation placement and geometry. */
import { vegetationHermiteBlend } from "./vegetation-hermite-blend.js";
import { vegetationHash3d } from "./vegetation-hash3d.js";
export function vegetationValueNoise3d(value, value2, value3, value4 = 0) {
  let result = Math.floor(value);
  let result2 = Math.floor(value2);
  let result3 = Math.floor(value3);
  let vegetationHermiteBlendResult = vegetationHermiteBlend(value - result);
  let vegetationHermiteBlendResult2 = vegetationHermiteBlend(value2 - result2);
  let vegetationHermiteBlendResult3 = vegetationHermiteBlend(value3 - result3);
  let callback = (value5, value6, value7) => value5 + (value6 - value5) * value7;
  let callback2 = (value8, value9, value10) =>
    vegetationHash3d(result + value8, result2 + value9, result3 + value10, value4);
  return callback(
    callback(
      callback(callback2(0, 0, 0), callback2(1, 0, 0), vegetationHermiteBlendResult),
      callback(callback2(0, 1, 0), callback2(1, 1, 0), vegetationHermiteBlendResult),
      vegetationHermiteBlendResult2,
    ),
    callback(
      callback(callback2(0, 0, 1), callback2(1, 0, 1), vegetationHermiteBlendResult),
      callback(callback2(0, 1, 1), callback2(1, 1, 1), vegetationHermiteBlendResult),
      vegetationHermiteBlendResult2,
    ),
    vegetationHermiteBlendResult3,
  );
}
