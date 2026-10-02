/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */

import { fxAtlasLength } from "./fx-atlas-length.js";
import { smoothstepFxAtlasValue } from "./smoothstep-fx-atlas-value.js";
import { clampFxAtlasValue } from "./clamp-fx-atlas-value.js";
import { sdFxHeart } from "./sd-fx-heart.js";
import { shadeFxAtlasDistance } from "./shade-fx-atlas-distance.js";
import { sdFxSegment } from "./sd-fx-segment.js";
import { sdFxStar } from "./sd-fx-star.js";
export const sampleHeartSprite = (x, y, edgeWidth) => {
  let result = 1.55;
  let result2 = sdFxHeart(x * result * 0.62, (y * result + 1) * 0.62 - 0.07) / 0.62 / result;
  let smoothstepFxAtlasValueResult = smoothstepFxAtlasValue(
    0.13,
    0.07,
    fxAtlasLength(x + 0.33, y - 0.25),
  );
  return shadeFxAtlasDistance(
    result2,
    edgeWidth,
    0.8 + 0.2 * clampFxAtlasValue(0.5 + 0.6 * (y - x)),
    smoothstepFxAtlasValueResult,
  );
};
export const sampleNoteSprite = (x, y, edgeWidth) => {
  let result = x + 0.2;
  let result2 = y + 0.52;
  let result3 = Math.cos(0.45);
  let result4 = Math.sin(0.45);
  let result5 =
    (fxAtlasLength(
      (result3 * result + result4 * result2) / 0.3,
      (-result4 * result + result3 * result2) / 0.21,
    ) -
      1) *
    0.21;
  let result6 = sdFxSegment(x, y, 0.07, -0.45, 0.07, 0.62) - 0.065;
  let result7 = sdFxSegment(x, y, 0.07, 0.62, 0.42, 0.22) - 0.07;
  return shadeFxAtlasDistance(
    Math.min(result5, result6, result7) * 0.95,
    edgeWidth,
    0.9,
    smoothstepFxAtlasValue(0.08, 0.03, fxAtlasLength(x + 0.28, y + 0.45)),
  );
};
export const sampleSleepSprite = (x, y, edgeWidth) =>
  shadeFxAtlasDistance(
    Math.min(
      sdFxSegment(x, y, -0.42, 0.5, 0.42, 0.5),
      sdFxSegment(x, y, 0.42, 0.5, -0.42, -0.5),
      sdFxSegment(x, y, -0.42, -0.5, 0.42, -0.5),
    ) - 0.1,
    edgeWidth,
    0.9 + 0.1 * clampFxAtlasValue(y),
  );
export const sampleStarSprite = (x, y, edgeWidth) =>
  shadeFxAtlasDistance(
    sdFxStar(x, y + 0.05, 0.72, 0.5) - 0.08,
    edgeWidth,
    0.8 + 0.2 * clampFxAtlasValue(0.5 + y),
    smoothstepFxAtlasValue(0.12, 0.05, fxAtlasLength(x + 0.18, y - 0.2)),
  );
export const sampleSquareSprite = (x, y, edgeWidth) => {
  let result = Math.abs(x) - 0.62;
  let result2 = Math.abs(y) - 0.62;
  let result3 =
    fxAtlasLength(Math.max(result, 0), Math.max(result2, 0)) +
    Math.min(Math.max(result, result2), 0) -
    0.18;
  let smoothstepFxAtlasValueResult = smoothstepFxAtlasValue(-0.22, -0.02, result3);
  return [
    clampFxAtlasValue(
      0.78 +
        0.22 * clampFxAtlasValue(0.5 + 0.5 * (y - x)) -
        smoothstepFxAtlasValueResult * (x + y < 0 ? 0.18 : -0.12),
    ),
    0,
    clampFxAtlasValue(0.5 - result3 / edgeWidth),
  ];
};
