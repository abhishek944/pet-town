/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */

import { fxAtlasLength } from "./fx-atlas-length.js";
import { smoothstepFxAtlasValue } from "./smoothstep-fx-atlas-value.js";
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
export const sampleDotSprite = (x, y) => {
  let fxAtlasLengthResult = fxAtlasLength(x, y);
  return [
    1,
    0,
    Math.exp(-fxAtlasLengthResult * fxAtlasLengthResult * 5.5) *
      smoothstepFxAtlasValue(1, 0.85, fxAtlasLengthResult),
  ];
};
export const sampleSparkleSprite = (x, y, edgeWidth) => {
  let clampFxAtlasValueResult = clampFxAtlasValue(
    (0.95 - (Math.sqrt(Math.abs(x)) + Math.sqrt(Math.abs(y)))) / (edgeWidth * 3 + 0.04),
  );
  let fxAtlasLengthResult = fxAtlasLength(x, y);
  let result = Math.exp(-fxAtlasLengthResult * fxAtlasLengthResult * 10) * 0.55;
  return [
    1,
    Math.exp(-fxAtlasLengthResult * fxAtlasLengthResult * 60),
    clampFxAtlasValue(Math.max(clampFxAtlasValueResult, result)),
  ];
};
export const sampleRingSprite = (x, y, edgeWidth) => [
  1,
  0,
  clampFxAtlasValue(0.5 - (Math.abs(fxAtlasLength(x, y) - 0.72) - 0.1) / (edgeWidth * 2)) * 0.9,
];
export const sampleGlowSprite = (x, y) => {
  let fxAtlasLengthResult = fxAtlasLength(x, y);
  return [
    1,
    Math.exp(-fxAtlasLengthResult * fxAtlasLengthResult * 40) * 0.8,
    Math.exp(-fxAtlasLengthResult * fxAtlasLengthResult * 3.2) *
      smoothstepFxAtlasValue(1, 0.7, fxAtlasLengthResult),
  ];
};
