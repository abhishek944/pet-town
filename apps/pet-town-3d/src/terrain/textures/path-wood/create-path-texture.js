/** Paths, gravel, planks, bark and log end grain textures. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { interpolateTextureRgb } from "../canvas/interpolate-texture-rgb.js";
import { smoothTextureRange } from "../canvas/smooth-texture-range.js";
import { paintWrappedTextureGlow } from "../canvas/paint-wrapped-texture-glow.js";
import { terrainState } from "../../state.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
import { paintTexturePebble } from "../canvas/paint-texture-pebble.js";
import { pickTexturePaletteColor } from "../canvas/pick-texture-palette-color.js";
export function createPathTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let hexToTextureRgbResult = hexToTextureRgb(12754283);
  let hexToTextureRgbResult2 = hexToTextureRgb(14268810);
  paintSampledTexture(terrainTextureCanvasResult2, (value2, value3) => {
    let result2 = tileableTextureNoiseResult.fbm(value2, value3, 4, 3);
    let result3 = tileableTextureNoiseResult.fbm(value2 + 71, value3 + 5, 16, 2);
    let interpolateTextureRgbResult = interpolateTextureRgb(
      hexToTextureRgbResult,
      hexToTextureRgbResult2,
      smoothTextureRange(-0.5, 0.55, result2),
    );
    let result4 = 1 + result3 * 0.05 + tileableTextureNoiseResult.vn(value2, value3, 64) * 0.03;
    return [
      interpolateTextureRgbResult[0] * result4,
      interpolateTextureRgbResult[1] * result4,
      interpolateTextureRgbResult[2] * result4,
    ];
  });
  for (let index = 0; index < 18; index++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      12 + seededRandomResult() * 18,
      hexToTextureRgb(15258280),
      0.2,
    );
  }
  for (let index2 = 0; index2 < 14; index2++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      8 + seededRandomResult() * 12,
      hexToTextureRgb(11109464),
      0.14,
    );
  }
  for (let index3 = 0; index3 < 520; index3++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.5 + seededRandomResult() * 0.9,
      seededRandomResult() < 0.5 ? hexToTextureRgb(10254930) : hexToTextureRgb(15786176),
      0.35,
    );
  }
  let result = [15259314, 12163696, 11117466, 13481102, 13222325].map(hexToTextureRgb);
  for (let index4 = 0; index4 < 55; index4++) {
    let result5 = 1.4 + seededRandomResult() * 2.6;
    paintTexturePebble(
      terrainTextureCanvasResult2,
      seededRandomResult,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      result5,
      result5 * (0.6 + seededRandomResult() * 0.35),
      pickTexturePaletteColor(seededRandomResult, result),
    );
  }
  return terrainTextureCanvasResult;
}
