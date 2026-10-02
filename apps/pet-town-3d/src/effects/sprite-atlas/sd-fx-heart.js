/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { fxAtlasLength } from "./fx-atlas-length.js";
export function sdFxHeart(x, y) {
  if (((x = Math.abs(x)), y + x > 1)) {
    return fxAtlasLength(x - 0.25, y - 0.75) - Math.SQRT2 / 4;
  }
  let result = (x - 0) ** 2 + (y - 1) ** 2;
  let result2 = 0.5 * Math.max(x + y, 0);
  let result3 = (x - result2) ** 2 + (y - result2) ** 2;
  return Math.sqrt(Math.min(result, result3)) * Math.sign(x - y);
}
