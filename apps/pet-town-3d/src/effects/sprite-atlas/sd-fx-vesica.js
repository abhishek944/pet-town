/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { fxAtlasLength } from "./fx-atlas-length.js";
export function sdFxVesica(x, y, radius, offset) {
  x = Math.abs(x);
  y = Math.abs(y);
  let result = Math.sqrt(radius * radius - offset * offset);
  return (y - result) * offset > x * result
    ? fxAtlasLength(x, y - result)
    : fxAtlasLength(x + offset, y) - radius;
}
