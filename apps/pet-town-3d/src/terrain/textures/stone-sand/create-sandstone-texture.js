/** Layered stone, cobble, sand, clay and sandstone surface textures. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { createTileableVoronoiSampler } from "../canvas/create-tileable-voronoi-sampler.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { terrainState } from "../../state.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { interpolateTextureRgb } from "../canvas/interpolate-texture-rgb.js";
import { smoothTextureRange } from "../canvas/smooth-texture-range.js";
import { paintWrappedTextureGlow } from "../canvas/paint-wrapped-texture-glow.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
export function createSandstoneTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let tileableVoronoiSamplerResult = createTileableVoronoiSampler(value + 9, 2, 0.9, 5);
  let hexToTextureRgbResult = hexToTextureRgb(13281396);
  let hexToTextureRgbResult2 = hexToTextureRgb(14861714);
  let hexToTextureRgbResult3 = hexToTextureRgb(15982517);
  let hexToTextureRgbResult4 = hexToTextureRgb(10254926);
  let result = terrainState.terrainTextureLogicalSize / 5;
  paintSampledTexture(terrainTextureCanvasResult2, (value2, value3) => {
    let result2 = tileableTextureNoiseResult.fbm(value2, value3, 3, 3);
    let result3 = tileableTextureNoiseResult.fbm(value2 + 31, value3 + 9, 12, 2);
    let result4 = tileableTextureNoiseResult.vn(value2, value3, 64);
    let [
      tileableVoronoiSamplerResultResult,
      tileableVoronoiSamplerResultResult2,
      tileableVoronoiSamplerResultResult3,
      ,
      tileableVoronoiSamplerResultResult5,
    ] = tileableVoronoiSamplerResult(value2, value3);
    let interpolateTextureRgbResult = interpolateTextureRgb(
      hexToTextureRgbResult,
      hexToTextureRgbResult2,
      smoothTextureRange(-0.6, 0.6, result2 + (tileableVoronoiSamplerResultResult3 - 0.5) * 0.5),
    );
    let result5 =
      1 +
      result3 * 0.06 +
      result4 * 0.03 -
      (tileableVoronoiSamplerResultResult5 / result) * 0.08 +
      (tileableVoronoiSamplerResultResult3 - 0.5) * 0.12;
    interpolateTextureRgbResult = [
      interpolateTextureRgbResult[0] * result5,
      interpolateTextureRgbResult[1] * result5,
      interpolateTextureRgbResult[2] * result5,
    ];
    let result6 = tileableVoronoiSamplerResultResult2 - tileableVoronoiSamplerResultResult;
    let smoothTextureRangeResult = smoothTextureRange(
      0,
      0.3,
      tileableTextureNoiseResult.fbm(value2 + 5, value3 + 50, 5, 2),
    );
    if (result6 < 4) {
      interpolateTextureRgbResult = interpolateTextureRgb(
        interpolateTextureRgbResult,
        tileableVoronoiSamplerResultResult5 < 0 ? hexToTextureRgbResult3 : hexToTextureRgbResult4,
        (1 - result6 / 4) * 0.18 * smoothTextureRangeResult,
      );
    }
    return interpolateTextureRgbResult;
  });
  for (let index = 0; index < 16; index++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      7 + seededRandomResult() * 14,
      seededRandomResult() < 0.5 ? hexToTextureRgb(11832668) : hexToTextureRgb(16048828),
      0.16,
    );
  }
  for (let index2 = 0; index2 < 40; index2++) {
    let result7 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let result8 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let result9 = 1 + seededRandomResult() * 2;
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      result7,
      result8 + 0.9,
      result9,
      hexToTextureRgb(15982779),
      0.26,
    );
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      result7,
      result8,
      result9,
      hexToTextureRgb(10912858),
      0.28,
    );
  }
  for (let index3 = 0; index3 < 200; index3++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.5 + seededRandomResult() * 0.8,
      seededRandomResult() < 0.5 ? hexToTextureRgb(11109711) : hexToTextureRgb(16773324),
      0.24,
    );
  }
  return terrainTextureCanvasResult;
}
