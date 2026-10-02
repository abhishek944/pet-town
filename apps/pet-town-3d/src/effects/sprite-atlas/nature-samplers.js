/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */

import { fxAtlasLength } from "./fx-atlas-length.js";
import { smoothstepFxAtlasValue } from "./smoothstep-fx-atlas-value.js";
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
import { sdFxVesica } from "./sd-fx-vesica.js";
import { sdFxUnevenCapsule } from "./sd-fx-uneven-capsule.js";
import { smoothUnionFxDistance } from "./smooth-union-fx-distance.js";
export const sampleLeafSprite = (x, y, edgeWidth) => {
  let SQRT1_22 = Math.SQRT1_2;
  let result = SQRT1_22 * x - SQRT1_22 * y;
  let result2 = SQRT1_22 * x + SQRT1_22 * y;
  let sdFxVesicaResult = sdFxVesica(result, result2, 0.85, 0.52);
  let result3 =
    smoothstepFxAtlasValue(0.05, 0, Math.abs(result)) *
    smoothstepFxAtlasValue(0.8, 0.2, Math.abs(result2));
  let result4 =
    clampFxAtlasValue(0.5 - sdFxVesicaResult / edgeWidth) *
    smoothstepFxAtlasValue(0.95, 0.9, fxAtlasLength(x, y) * 0.7 + 0.3);
  return [0.85 + 0.15 * clampFxAtlasValue(0.5 + result) - result3 * 0.3, 0, result4];
};
export const samplePetalSprite = (x, y, edgeWidth) => {
  let result = fxAtlasLength(x / 0.62, (y + 0.05) / 0.85) - 1;
  result *= 0.62;
  result = Math.max(result, -(fxAtlasLength(x, y - 0.92) - 0.2));
  return [
    0.75 + 0.25 * clampFxAtlasValue(0.6 - y * 0.6),
    smoothstepFxAtlasValue(0.35, 0, fxAtlasLength(x, y + 0.55)) * 0.35,
    clampFxAtlasValue(0.5 - result / edgeWidth),
  ];
};
export const sampleDropSprite = (x, y, edgeWidth) => {
  let sdFxUnevenCapsuleResult = sdFxUnevenCapsule(x, y + 0.45, 0.48, 0.04, 1.2);
  let smoothstepFxAtlasValueResult = smoothstepFxAtlasValue(
    0.11,
    0.05,
    fxAtlasLength(x + 0.17, y + 0.3),
  );
  return [
    0.8 + 0.2 * clampFxAtlasValue(0.5 - x),
    smoothstepFxAtlasValueResult,
    clampFxAtlasValue(0.5 - sdFxUnevenCapsuleResult / edgeWidth),
  ];
};
export const sampleSmokeSprite = (x, y, edgeWidth) => {
  let result = fxAtlasLength(x + 0.28, y + 0.12) - 0.42;
  result = smoothUnionFxDistance(result, fxAtlasLength(x - 0.3, y + 0.15) - 0.38, 0.15);
  result = smoothUnionFxDistance(result, fxAtlasLength(x + 0.02, y - 0.25) - 0.45, 0.15);
  result = smoothUnionFxDistance(result, fxAtlasLength(x - 0.05, y + 0.38) - 0.36, 0.15);
  let smoothstepFxAtlasValueResult = smoothstepFxAtlasValue(0, -0.35, result);
  return [
    0.72 + 0.28 * clampFxAtlasValue(0.55 + 0.6 * (y - x * 0.5)),
    0,
    smoothstepFxAtlasValueResult * clampFxAtlasValue(0.5 - result / (edgeWidth * 4)),
  ];
};
