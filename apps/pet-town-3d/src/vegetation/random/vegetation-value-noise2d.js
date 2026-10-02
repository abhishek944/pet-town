/** Deterministic random streams, hashes, value noise and interpolation for vegetation placement and geometry. */
import { vegetationHash2d } from "./vegetation-hash2d.js";
import { vegetationHermiteBlend } from "./vegetation-hermite-blend.js";
export function vegetationValueNoise2d(value, value2, value3 = 0) {
  let result = Math.floor(value);
  let result2 = Math.floor(value2);
  let result3 = value - result;
  let result4 = value2 - result2;
  let vegetationHash2dResult = vegetationHash2d(result, result2, value3);
  let vegetationHash2dResult2 = vegetationHash2d(result + 1, result2, value3);
  let vegetationHash2dResult3 = vegetationHash2d(result, result2 + 1, value3);
  let vegetationHash2dResult4 = vegetationHash2d(result + 1, result2 + 1, value3);
  let vegetationHermiteBlendResult = vegetationHermiteBlend(result3);
  let vegetationHermiteBlendResult2 = vegetationHermiteBlend(result4);
  return (
    vegetationHash2dResult +
    (vegetationHash2dResult2 - vegetationHash2dResult) * vegetationHermiteBlendResult +
    (vegetationHash2dResult3 - vegetationHash2dResult) * vegetationHermiteBlendResult2 +
    (vegetationHash2dResult -
      vegetationHash2dResult2 -
      vegetationHash2dResult3 +
      vegetationHash2dResult4) *
      vegetationHermiteBlendResult *
      vegetationHermiteBlendResult2
  );
}
