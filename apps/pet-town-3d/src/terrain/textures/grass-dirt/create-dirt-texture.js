/** Grass and earth surface textures and wavy line painting. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { createTileableVoronoiSampler } from "../canvas/create-tileable-voronoi-sampler.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { clampTextureUnit } from "../canvas/clamp-texture-unit.js";
import { interpolateTextureRgb } from "../canvas/interpolate-texture-rgb.js";
import { terrainState } from "../../state.js";
import { paintWrappedTextureGlow } from "../canvas/paint-wrapped-texture-glow.js";
import { paintWrappedTextureStroke } from "../canvas/paint-wrapped-texture-stroke.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
import { textureRgbToCss } from "../canvas/texture-rgb-to-css.js";
export function createDirtTexture(value, { band: value2 = true, facets: value3 = false } = {}) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let tileableVoronoiSamplerResult = createTileableVoronoiSampler(value + 3, 6, 0.9);
  let hexToTextureRgbResult = hexToTextureRgb(6963496);
  let hexToTextureRgbResult2 = hexToTextureRgb(9132857);
  let hexToTextureRgbResult3 = hexToTextureRgb(11369552);
  paintSampledTexture(terrainTextureCanvasResult2, (value4, value5) => {
    let result2 = tileableTextureNoiseResult.fbm(value4, value5, 2, 3);
    let result3 = tileableTextureNoiseResult.fbm(value4 + 50, value5 + 20, 7, 2);
    let result4 = tileableTextureNoiseResult.fbm(value4 + 5, value5, 20, 2);
    let clampTextureUnitResult = clampTextureUnit(0.5 + result2 * 0.85);
    let result5 =
      clampTextureUnitResult < 0.5
        ? interpolateTextureRgb(
            hexToTextureRgbResult,
            hexToTextureRgbResult2,
            clampTextureUnitResult * 2,
          )
        : interpolateTextureRgb(
            hexToTextureRgbResult2,
            hexToTextureRgbResult3,
            (clampTextureUnitResult - 0.5) * 2,
          );
    let [
      tileableVoronoiSamplerResultResult,
      tileableVoronoiSamplerResultResult2,
      tileableVoronoiSamplerResultResult3,
      ,
      tileableVoronoiSamplerResultResult5,
    ] = tileableVoronoiSamplerResult(value4, value5);
    let result6 = 1 - Math.min(1, tileableVoronoiSamplerResultResult / 24);
    let result7 = 1 + result3 * 0.09 + result4 * 0.05 + result6 * 0.04;
    if (value3) {
      result7 +=
        (tileableVoronoiSamplerResultResult3 - 0.5) * 0.12 -
        (tileableVoronoiSamplerResultResult5 / (terrainState.terrainTextureLogicalSize / 6)) * 0.08;
    }
    let values = [result5[0] * result7, result5[1] * result7, result5[2] * result7];
    if (value3 && tileableVoronoiSamplerResultResult2 - tileableVoronoiSamplerResultResult < 4) {
      values = interpolateTextureRgb(
        values,
        hexToTextureRgb(tileableVoronoiSamplerResultResult5 < 0 ? 12884590 : 5123868),
        (1 - (tileableVoronoiSamplerResultResult2 - tileableVoronoiSamplerResultResult) / 4) * 0.22,
      );
    }
    return values;
  });
  for (let index = 0; index < 9; index++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      16 + seededRandomResult() * 16,
      hexToTextureRgb(5912353),
      0.14,
    );
  }
  for (let index2 = 0; index2 < 7; index2++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      14 + seededRandomResult() * 14,
      hexToTextureRgb(12291422),
      0.13,
    );
  }
  for (let index3 = 0; index3 < 40; index3++) {
    let result8 =
      seededRandomResult() < 0.55 ? hexToTextureRgb(12819052) : hexToTextureRgb(6109731);
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.textureFullTurn,
      6 + seededRandomResult() * 8,
      4 + seededRandomResult() * 4,
      result8,
      0.07 + seededRandomResult() * 0.06,
      (seededRandomResult() - 0.5) * 4,
    );
  }
  for (let index4 = 0; index4 < 300; index4++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.5 + seededRandomResult() * 0.9,
      seededRandomResult() < 0.6 ? hexToTextureRgb(5189660) : hexToTextureRgb(13213815),
      0.22,
    );
  }
  let result = 3 + Math.floor(seededRandomResult() * 3);
  for (let index5 = 0; index5 < result; index5++) {
    let result9 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let result10 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let result11 = 18 + seededRandomResult() * 12;
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      result9 + 2,
      result10 + 5,
      result11 * 1.05,
      hexToTextureRgb(4861210),
      0.16,
    );
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      result9,
      result10,
      result11,
      interpolateTextureRgb(
        hexToTextureRgbResult2,
        hexToTextureRgbResult3,
        0.5 + seededRandomResult() * 0.3,
      ),
      0.3,
    );
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      result9 - result11 * 0.25,
      result10 - result11 * 0.3,
      result11 * 0.55,
      hexToTextureRgb(13674106),
      0.18,
    );
  }
  if (value2) {
    for (let index6 = 0; index6 < 2; index6++) {
      let result12 = index6 * 128;
      let linearGradientResult = terrainTextureCanvasResult2.createLinearGradient(
        0,
        result12,
        0,
        result12 + 24,
      );
      linearGradientResult.addColorStop(0, textureRgbToCss(hexToTextureRgb(12819054), 0.16));
      linearGradientResult.addColorStop(1, textureRgbToCss(hexToTextureRgb(11897438), 0));
      terrainTextureCanvasResult2.fillStyle = linearGradientResult;
      terrainTextureCanvasResult2.fillRect(0, result12, terrainState.terrainTextureLogicalSize, 24);
      for (let index7 = 0; index7 < 12; index7++) {
        paintWrappedTextureGlow(
          terrainTextureCanvasResult2,
          seededRandomResult() * terrainState.terrainTextureLogicalSize,
          result12 + 4 + seededRandomResult() * 14,
          6 + seededRandomResult() * 8,
          seededRandomResult() < 0.6 ? hexToTextureRgb(13214326) : hexToTextureRgb(10252360),
          0.16,
        );
      }
    }
  }
  return terrainTextureCanvasResult;
}
