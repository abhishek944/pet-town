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
import { paintWrappedTextureStroke } from "../canvas/paint-wrapped-texture-stroke.js";
import { paintWrappedTextureGlow } from "../canvas/paint-wrapped-texture-glow.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
export function createLayeredStoneTexture(
  value,
  mapValue = [11576468, 12365981, 10918795, 12627604, 11247502],
  value2 = 7036754,
  value3 = 14735044,
) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let tileableVoronoiSamplerResult = createTileableVoronoiSampler(value + 5, 2, 0.9, 4);
  let values = mapValue.map(hexToTextureRgb);
  let hexToTextureRgbResult = hexToTextureRgb(value2);
  let hexToTextureRgbResult2 = hexToTextureRgb(value3);
  let result = terrainState.terrainTextureLogicalSize / 4;
  paintSampledTexture(terrainTextureCanvasResult2, (value4, value5) => {
    let [
      tileableVoronoiSamplerResultResult,
      tileableVoronoiSamplerResultResult2,
      tileableVoronoiSamplerResultResult3,
      ,
      tileableVoronoiSamplerResultResult5,
    ] = tileableVoronoiSamplerResult(value4, value5);
    let result2 = tileableTextureNoiseResult.fbm(value4, value5, 1, 3, 10);
    let interpolateTextureRgbResult = interpolateTextureRgb(
      values[Math.floor(tileableVoronoiSamplerResultResult3 * values.length) % values.length],
      values[Math.floor((result2 * 0.5 + 0.5) * values.length) % values.length],
      0.55,
    );
    let result3 =
      1 +
      result2 * 0.1 +
      tileableTextureNoiseResult.fbm(value4 + 40, value5, 3, 2, 24) * 0.05 +
      tileableTextureNoiseResult.fbm(value4, value5 + 9, 24, 2) * 0.05;
    result3 += (-tileableVoronoiSamplerResultResult5 / result) * 0.1;
    interpolateTextureRgbResult = [
      interpolateTextureRgbResult[0] * result3,
      interpolateTextureRgbResult[1] * result3,
      interpolateTextureRgbResult[2] * result3,
    ];
    let result4 = tileableVoronoiSamplerResultResult2 - tileableVoronoiSamplerResultResult;
    let smoothTextureRangeResult = smoothTextureRange(
      -0.15,
      0.25,
      tileableTextureNoiseResult.fbm(value4 + 13, value5 + 71, 6, 2),
    );
    if (result4 < 2.2) {
      interpolateTextureRgbResult = interpolateTextureRgb(
        interpolateTextureRgbResult,
        hexToTextureRgbResult,
        (1 - result4 / 2.2) * 0.45 * smoothTextureRangeResult,
      );
    } else {
      if (result4 < 5 && tileableVoronoiSamplerResultResult5 < 0) {
        interpolateTextureRgbResult = interpolateTextureRgb(
          interpolateTextureRgbResult,
          hexToTextureRgbResult2,
          (1 - (result4 - 2.2) / 2.8) * 0.2 * smoothTextureRangeResult,
        );
      }
    }
    return interpolateTextureRgbResult;
  });
  for (let index = 0; index < 22; index++) {
    let result5 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let result6 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let result7 = seededRandomResult() * terrainState.textureFullTurn;
    let result8 = 4 + seededRandomResult() * 7;
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      result5 + 0.6,
      result6 + 1.4,
      result7,
      result8,
      1.4,
      hexToTextureRgbResult,
      0.22,
    );
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      result5,
      result6,
      result7,
      result8,
      1.2,
      hexToTextureRgbResult2,
      0.22,
    );
  }
  for (let index2 = 0; index2 < 18; index2++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      6 + seededRandomResult() * 12,
      seededRandomResult() < 0.5 ? hexToTextureRgb(9405556) : hexToTextureRgb(13878960),
      0.14,
    );
  }
  for (let index3 = 0; index3 < 260; index3++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.5 + seededRandomResult() * 0.9,
      seededRandomResult() < 0.5 ? hexToTextureRgbResult : hexToTextureRgbResult2,
      0.25,
    );
  }
  return terrainTextureCanvasResult;
}
