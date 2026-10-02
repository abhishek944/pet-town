/** Transparent grass fringe, moss and path edge overlay textures. */
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { createSampledTextureCanvas } from "../canvas/create-sampled-texture-canvas.js";
import { interpolateTextureRgb } from "../canvas/interpolate-texture-rgb.js";
import { clampTextureUnit } from "../canvas/clamp-texture-unit.js";
import { smoothTextureRange } from "../canvas/smooth-texture-range.js";
import { terrainState } from "../../state.js";
export function createMossOverlayTexture(value) {
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let terrainTextureCanvasResult = createTerrainTextureCanvas();
  let hexToTextureRgbResult = hexToTextureRgb(6986309);
  let hexToTextureRgbResult2 = hexToTextureRgb(9616220);
  let sampledTextureCanvasResult = createSampledTextureCanvas((value2, value3) => {
    let result = tileableTextureNoiseResult.fbm(value2, value3, 4, 4);
    let result2 = tileableTextureNoiseResult.fbm(value2 + 33, value3, 16, 2);
    let interpolateTextureRgbResult = interpolateTextureRgb(
      hexToTextureRgbResult,
      hexToTextureRgbResult2,
      clampTextureUnit(0.5 + result2),
    );
    return [
      interpolateTextureRgbResult[0],
      interpolateTextureRgbResult[1],
      interpolateTextureRgbResult[2],
      smoothTextureRange(-0.05, 0.12, result) * 255,
    ];
  }, true);
  terrainTextureCanvasResult.g.imageSmoothingEnabled = true;
  terrainTextureCanvasResult.g.drawImage(
    sampledTextureCanvasResult,
    0,
    0,
    terrainState.terrainTextureLogicalSize,
    terrainState.terrainTextureLogicalSize,
  );
  return terrainTextureCanvasResult.c;
}
