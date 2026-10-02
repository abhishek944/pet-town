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
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
export function createCobbleTexture(value, value2, mapValue, value3, jitterValue = {}) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let tileableVoronoiSamplerResult = createTileableVoronoiSampler(
    value + 7,
    value2,
    jitterValue.jitter ?? 0.85,
  );
  let values = mapValue.map(hexToTextureRgb);
  let hexToTextureRgbResult = hexToTextureRgb(value3);
  let hexToTextureRgbResult2 = hexToTextureRgb(jitterValue.hl ?? 14735562);
  let result = terrainState.terrainTextureLogicalSize / value2;
  paintSampledTexture(terrainTextureCanvasResult2, (value4, value5) => {
    let [
      tileableVoronoiSamplerResultResult,
      tileableVoronoiSamplerResultResult2,
      tileableVoronoiSamplerResultResult3,
      tileableVoronoiSamplerResultResult4,
      tileableVoronoiSamplerResultResult5,
    ] = tileableVoronoiSamplerResult(value4, value5);
    let result2 = tileableVoronoiSamplerResultResult2 - tileableVoronoiSamplerResultResult;
    let interpolateTextureRgbResult = interpolateTextureRgb(
      values[Math.floor(tileableVoronoiSamplerResultResult3 * values.length) % values.length],
      values[(Math.floor(tileableVoronoiSamplerResultResult3 * values.length) + 1) % values.length],
      tileableTextureNoiseResult.fbm(value4, value5, 8, 2) * 0.5 + 0.5,
    );
    let result3 =
      0.9 +
      (1 - Math.min(1, tileableVoronoiSamplerResultResult / (result * 0.75)) ** 2) *
        (jitterValue.dome ?? 0.12) +
      tileableTextureNoiseResult.fbm(value4 + 40, value5 + 9, 16, 2) * 0.06 +
      tileableTextureNoiseResult.vn(value4, value5, 64) * 0.025;
    result3 +=
      (-(tileableVoronoiSamplerResultResult4 + tileableVoronoiSamplerResultResult5) /
        (result * 1.4)) *
      (jitterValue.shade ?? 0.08);
    interpolateTextureRgbResult = [
      interpolateTextureRgbResult[0] * result3,
      interpolateTextureRgbResult[1] * result3,
      interpolateTextureRgbResult[2] * result3,
    ];
    let result4 = jitterValue.mortar ?? 2.2;
    if (result2 < result4) {
      interpolateTextureRgbResult = interpolateTextureRgb(
        hexToTextureRgbResult,
        interpolateTextureRgbResult,
        smoothTextureRange(0, result4, result2) * 0.6,
      );
    } else {
      if (result2 < result4 + 2.5) {
        interpolateTextureRgbResult = interpolateTextureRgb(
          interpolateTextureRgbResult,
          hexToTextureRgbResult2,
          (1 - (result2 - result4) / 2.5) *
            0.18 *
            (tileableVoronoiSamplerResultResult5 < 0 ? 1 : 0.3),
        );
      }
    }
    return interpolateTextureRgbResult;
  });
  for (let index = 0; index < 180; index++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.5 + seededRandomResult() * 1,
      seededRandomResult() < 0.5 ? hexToTextureRgbResult : hexToTextureRgbResult2,
      0.28,
    );
  }
  return terrainTextureCanvasResult;
}
