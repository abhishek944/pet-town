/** Layered stone, cobble, sand, clay and sandstone surface textures. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { createTileableVoronoiSampler } from "../canvas/create-tileable-voronoi-sampler.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { interpolateTextureRgb } from "../canvas/interpolate-texture-rgb.js";
import { smoothTextureRange } from "../canvas/smooth-texture-range.js";
import { terrainState } from "../../state.js";
import { paintWavyTextureLine } from "../grass-dirt/paint-wavy-texture-line.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
import { paintWrappedTextureEllipse } from "../canvas/paint-wrapped-texture-ellipse.js";
import { pickTexturePaletteColor } from "../canvas/pick-texture-palette-color.js";
import { paintTexturePebble } from "../canvas/paint-texture-pebble.js";
export function createSandTexture(value, value2 = true) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let result = value2 ? null : createTileableVoronoiSampler(value + 4, 2, 0.95, 3);
  let hexToTextureRgbResult = hexToTextureRgb(14928784);
  let hexToTextureRgbResult2 = hexToTextureRgb(15917488);
  if (
    (paintSampledTexture(terrainTextureCanvasResult2, (value3, value4) => {
      let result2 = tileableTextureNoiseResult.fbm(value3, value4, 3, 3);
      let result3 = tileableTextureNoiseResult.vn(value3, value4, 128);
      let result4 = tileableTextureNoiseResult.vn(value3 + 3, value4 + 7, 64);
      let interpolateTextureRgbResult = interpolateTextureRgb(
        hexToTextureRgbResult,
        hexToTextureRgbResult2,
        smoothTextureRange(-0.5, 0.5, result2),
      );
      let result5 = 1 + result3 * 0.035 + result4 * 0.03;
      if (result) {
        let [resultResult, resultResult2, resultResult3, , resultResult5] = result(value3, value4);
        let result6 = resultResult2 - resultResult;
        result5 +=
          (resultResult3 - 0.5) * 0.1 -
          (resultResult5 / (terrainState.terrainTextureLogicalSize / 3)) * 0.1;
        interpolateTextureRgbResult = [
          interpolateTextureRgbResult[0] * result5,
          interpolateTextureRgbResult[1] * result5,
          interpolateTextureRgbResult[2] * result5,
        ];
        if (result6 < 6) {
          interpolateTextureRgbResult = interpolateTextureRgb(
            interpolateTextureRgbResult,
            hexToTextureRgb(resultResult5 < 0 ? 16511183 : 12097375),
            (1 - result6 / 6) * 0.14,
          );
        }
        return interpolateTextureRgbResult;
      }
      return [
        interpolateTextureRgbResult[0] * result5,
        interpolateTextureRgbResult[1] * result5,
        interpolateTextureRgbResult[2] * result5,
      ];
    }),
    value2)
  ) {
    for (let index = 0; index < 8; index++) {
      let result7 =
        (index + seededRandomResult() * 0.6) * (terrainState.terrainTextureLogicalSize / 8);
      let result8 = seededRandomResult() * terrainState.textureFullTurn;
      let result9 = 1 + Math.floor(seededRandomResult() * 2);
      paintWavyTextureLine(
        terrainTextureCanvasResult2,
        result7 + 2.4,
        2.5,
        result9,
        result8,
        hexToTextureRgb(13480570),
        0.28,
        2.4,
      );
      paintWavyTextureLine(
        terrainTextureCanvasResult2,
        result7,
        2.5,
        result9,
        result8,
        hexToTextureRgb(16511442),
        0.5,
        2.2,
      );
    }
  }
  for (let index2 = 0; index2 < 420; index2++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.5 + seededRandomResult() * 0.7,
      hexToTextureRgb(12558442),
      0.45,
    );
  }
  for (let index3 = 0; index3 < 240; index3++) {
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      0.5 + seededRandomResult() * 0.6,
      hexToTextureRgb(16775920),
      0.55,
    );
  }
  for (let index4 = 0; index4 < 7; index4++) {
    paintWrappedTextureEllipse(
      terrainTextureCanvasResult2,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      2 + seededRandomResult() * 1.5,
      1.3 + seededRandomResult(),
      seededRandomResult() * 3,
      pickTexturePaletteColor(
        seededRandomResult,
        [15845298, 16245456, 15251872].map(hexToTextureRgb),
      ),
      0.85,
    );
  }
  for (let index5 = 0; index5 < 10; index5++) {
    let result10 = 1.3 + seededRandomResult() * 1.6;
    paintTexturePebble(
      terrainTextureCanvasResult2,
      seededRandomResult,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      seededRandomResult() * terrainState.terrainTextureLogicalSize,
      result10,
      result10 * 0.75,
      pickTexturePaletteColor(
        seededRandomResult,
        [12035466, 10721417, 13284753].map(hexToTextureRgb),
      ),
    );
  }
  return terrainTextureCanvasResult;
}
