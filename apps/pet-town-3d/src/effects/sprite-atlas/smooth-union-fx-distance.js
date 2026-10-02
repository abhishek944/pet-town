/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
export let smoothUnionFxDistance = (distanceA, distanceB, blendRadius) => {
  let clampFxAtlasValueResult = clampFxAtlasValue(
    0.5 + (0.5 * (distanceB - distanceA)) / blendRadius,
  );
  return (
    distanceB * (1 - clampFxAtlasValueResult) +
    distanceA * clampFxAtlasValueResult -
    blendRadius * clampFxAtlasValueResult * (1 - clampFxAtlasValueResult)
  );
};
