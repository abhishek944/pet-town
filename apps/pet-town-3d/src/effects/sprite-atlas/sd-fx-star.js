/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
import { fxAtlasLength } from "./fx-atlas-length.js";
export function sdFxStar(x, y, radius, innerRatio) {
  let result = 0.809016994375;
  let result2 = -0.587785252292;
  let result3 = -0.809016994375;
  let result2Value = result2;
  x = Math.abs(x);
  let result4 = Math.max(result * x + result2 * y, 0);
  x -= 2 * result4 * result;
  y -= 2 * result4 * result2;
  result4 = Math.max(result3 * x + result2Value * y, 0);
  x -= 2 * result4 * result3;
  y -= 2 * result4 * result2Value;
  x = Math.abs(x);
  y -= radius;
  let result5 = innerRatio * 0.587785252292 - 0;
  let result6 = innerRatio * result - 1;
  let clampFxAtlasValueResult = clampFxAtlasValue(
    (x * result5 + y * result6) / (result5 * result5 + result6 * result6),
    0,
    radius,
  );
  return (
    fxAtlasLength(x - result5 * clampFxAtlasValueResult, y - result6 * clampFxAtlasValueResult) *
    Math.sign(y * result5 - x * result6)
  );
}
