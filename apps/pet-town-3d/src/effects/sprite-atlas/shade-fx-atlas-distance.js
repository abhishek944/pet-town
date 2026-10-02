/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
import { effectsState } from "../state.js";
export function shadeFxAtlasDistance(distance, edgeWidth, brightness, highlight = 0) {
  let clampFxAtlasValueResult = clampFxAtlasValue(0.5 - distance / edgeWidth);
  let clampFxAtlasValueResult2 = clampFxAtlasValue(
    0.5 - (distance - effectsState.fxAtlasOutlineWidth) / edgeWidth,
  );
  return [
    brightness,
    Math.max(1 - clampFxAtlasValueResult, highlight * clampFxAtlasValueResult),
    clampFxAtlasValueResult2,
  ];
}
