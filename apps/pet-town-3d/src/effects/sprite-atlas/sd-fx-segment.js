/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
import { fxAtlasLength } from "./fx-atlas-length.js";
export function sdFxSegment(x, y, startX, startY, endX, endY) {
  let result = x - startX;
  let result2 = y - startY;
  let result3 = endX - startX;
  let result4 = endY - startY;
  let clampFxAtlasValueResult = clampFxAtlasValue(
    (result * result3 + result2 * result4) / (result3 * result3 + result4 * result4),
  );
  return fxAtlasLength(
    result - result3 * clampFxAtlasValueResult,
    result2 - result4 * clampFxAtlasValueResult,
  );
}
