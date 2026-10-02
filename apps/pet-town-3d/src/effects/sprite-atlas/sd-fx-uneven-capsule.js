/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { fxAtlasLength } from "./fx-atlas-length.js";
export function sdFxUnevenCapsule(x, y, bottomRadius, topRadius, height) {
  x = Math.abs(x);
  let result = (bottomRadius - topRadius) / height;
  let result2 = Math.sqrt(1 - result * result);
  let result3 = -result * x + result2 * y;
  return result3 < 0
    ? fxAtlasLength(x, y) - bottomRadius
    : result3 > result2 * height
      ? fxAtlasLength(x, y - height) - topRadius
      : x * result2 + y * result - bottomRadius;
}
