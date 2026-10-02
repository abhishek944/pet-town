/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
export let smoothstepFxAtlasValue = (start, end, value) => {
  let clampFxAtlasValueResult = clampFxAtlasValue((value - start) / (end - start));
  return clampFxAtlasValueResult * clampFxAtlasValueResult * (3 - 2 * clampFxAtlasValueResult);
};
