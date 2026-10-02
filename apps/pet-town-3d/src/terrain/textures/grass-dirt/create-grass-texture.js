/** Grass and earth surface textures and wavy line painting. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { interpolateTextureRgb } from "../canvas/interpolate-texture-rgb.js";
import { smoothTextureRange } from "../canvas/smooth-texture-range.js";
import { clampTextureUnit } from "../canvas/clamp-texture-unit.js";
import { paintWrappedTextureGlow } from "../canvas/paint-wrapped-texture-glow.js";
import { terrainState } from "../../state.js";
import { paintWrappedTextureStroke } from "../canvas/paint-wrapped-texture-stroke.js";
import { pickTexturePaletteColor } from "../canvas/pick-texture-palette-color.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
export function createGrassTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let hexToTextureRgbResult = hexToTextureRgb(6068036);
  let hexToTextureRgbResult2 = hexToTextureRgb(8368986);
  let hexToTextureRgbResult3 = hexToTextureRgb(9749610);
  let hexToTextureRgbResult4 = hexToTextureRgb(11388268);
  paintSampledTexture(terrainTextureCanvasResult2, (value2, value3) => {
    let result3 = tileableTextureNoiseResult.fbm(value2, value3, 3, 3);
    let result4 = tileableTextureNoiseResult.fbm(value2 + 91, value3 + 13, 6, 2);
    let result5 = tileableTextureNoiseResult.fbm(value2 + 7, value3 + 3, 32, 2);
    let interpolateTextureRgbResult = interpolateTextureRgb(
      hexToTextureRgbResult,
      hexToTextureRgbResult2,
      smoothTextureRange(-0.6, 0.05, result3),
    );
    interpolateTextureRgbResult = interpolateTextureRgb(
      interpolateTextureRgbResult,
      hexToTextureRgbResult3,
      smoothTextureRange(-0.05, 0.6, result3) * 0.85,
    );
    interpolateTextureRgbResult = interpolateTextureRgb(
      interpolateTextureRgbResult,
      hexToTextureRgbResult4,
      clampTextureUnit(result4 * 1.4) * 0.5,
    );
    let result6 = 1 + result5 * 0.07;
    return [
      interpolateTextureRgbResult[0] * result6,
      interpolateTextureRgbResult[1] * result6,
      interpolateTextureRgbResult[2] * result6,
    ];
  });
  for (let index = 0; index < 26; index++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      10 + seededRandomResult() * 16,
      hexToTextureRgb(4883256),
      0.16,
    );
  }
  for (let index2 = 0; index2 < 20; index2++) {
    paintWrappedTextureGlow(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      9 + seededRandomResult() * 14,
      hexToTextureRgb(12376456),
      0.15,
    );
  }
  for (let index3 = 0; index3 < 700; index3++) {
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      -1 + (seededRandomResult() - 0.5) * 1.8,
      4 + seededRandomResult() * 6,
      2.2,
      hexToTextureRgb(4620086),
      0.22,
      (seededRandomResult() - 0.5) * 3,
    );
  }
  let result = [7514193, 8368986, 9091938, 6987595, 9684074].map(hexToTextureRgb);
  for (let index4 = 0; index4 < 1500; index4++) {
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      -1 + (seededRandomResult() - 0.5) * 2,
      5 + seededRandomResult() * 8,
      2 + seededRandomResult() * 1.2,
      pickTexturePaletteColor(seededRandomResult, result),
      0.55 + seededRandomResult() * 0.3,
      (seededRandomResult() - 0.5) * 4,
    );
  }
  let result2 = [11851133, 12770442, 10931314, 13624218].map(hexToTextureRgb);
  for (let index5 = 0; index5 < 650; index5++) {
    paintWrappedTextureStroke(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      -1 + (seededRandomResult() - 0.5) * 1.8,
      3 + seededRandomResult() * 5,
      1.3 + seededRandomResult() * 0.8,
      pickTexturePaletteColor(seededRandomResult, result2),
      0.5 + seededRandomResult() * 0.3,
      (seededRandomResult() - 0.5) * 3,
    );
  }
  for (let index6 = 0; index6 < 22; index6++) {
    let result7 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let result8 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
    let hexToTextureRgbResult5 = hexToTextureRgb(6068036);
    for (let index7 = 0; index7 < 3; index7++) {
      let result9 = (index7 * terrainState.textureFullTurn) / 3 + seededRandomResult();
      paintWrappedTextureCircle(
        terrainTextureCanvasResult2,
        result7 + Math.cos(result9) * 2.3,
        result8 + Math.sin(result9) * 2.3,
        2.2,
        hexToTextureRgbResult5,
        0.6,
      );
    }
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      result7,
      result8,
      0.9,
      hexToTextureRgb(10473322),
      0.6,
    );
  }
  return terrainTextureCanvasResult;
}
