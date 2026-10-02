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
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
export function createClayTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let tileableVoronoiSamplerResult = createTileableVoronoiSampler(value + 3, 3, 0.9, 2);
  let hexToTextureRgbResult = hexToTextureRgb(11103308);
  let hexToTextureRgbResult2 = hexToTextureRgb(12946276);
  let hexToTextureRgbResult3 = hexToTextureRgb(14196858);
  let hexToTextureRgbResult4 = hexToTextureRgb(8276528);
  let result = terrainState.terrainTextureLogicalSize / 2;
  paintSampledTexture(terrainTextureCanvasResult2, (value2, value3) => {
    let [
      tileableVoronoiSamplerResultResult,
      tileableVoronoiSamplerResultResult2,
      tileableVoronoiSamplerResultResult3,
      ,
      tileableVoronoiSamplerResultResult5,
    ] = tileableVoronoiSamplerResult(value2, value3);
    let result2 = tileableTextureNoiseResult.fbm(value2, value3, 3, 3);
    let result3 = tileableTextureNoiseResult.fbm(value2 + 17, value3 + 3, 10, 2);
    let result4 = tileableTextureNoiseResult.fbm(value2, value3 + 5, 32, 2);
    let interpolateTextureRgbResult = interpolateTextureRgb(
      hexToTextureRgbResult,
      hexToTextureRgbResult2,
      smoothTextureRange(-0.6, 0.6, result2 + (tileableVoronoiSamplerResultResult3 - 0.5) * 0.6),
    );
    let result5 =
      1 +
      (tileableVoronoiSamplerResultResult3 - 0.5) * 0.2 +
      result3 * 0.06 +
      result4 * 0.04 -
      (tileableVoronoiSamplerResultResult5 / result) * 0.14;
    interpolateTextureRgbResult = [
      interpolateTextureRgbResult[0] * result5,
      interpolateTextureRgbResult[1] * result5,
      interpolateTextureRgbResult[2] * result5,
    ];
    let result6 = tileableVoronoiSamplerResultResult2 - tileableVoronoiSamplerResultResult;
    if (result6 < 6) {
      interpolateTextureRgbResult = interpolateTextureRgb(
        interpolateTextureRgbResult,
        tileableVoronoiSamplerResultResult5 < 0 ? hexToTextureRgbResult3 : hexToTextureRgbResult4,
        (1 - result6 / 6) * 0.27,
      );
    }
    return interpolateTextureRgbResult;
  });
  for (let index = 0; index < 20; index++) {
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.textureFullTurn,
      6 + seededRandomResult() * 8,
      3 + seededRandomResult() * 3,
      seededRandomResult() < 0.5 ? hexToTextureRgb(13605492) : hexToTextureRgb(9328186),
      0.12,
      (seededRandomResult() - 0.5) * 3,
    );
  }
  for (let index2 = 0; index2 < 220; index2++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.6 + seededRandomResult() * 0.8,
      seededRandomResult() < 0.5 ? hexToTextureRgb(8671279) : hexToTextureRgb(14726544),
      0.22,
    );
  }
  return terrainTextureCanvasResult;
}
