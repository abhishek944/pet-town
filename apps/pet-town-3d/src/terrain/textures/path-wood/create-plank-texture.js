/** Paths, gravel, planks, bark and log end grain textures. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { createTileableTextureNoise } from "../canvas/create-tileable-texture-noise.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { paintSampledTexture } from "../canvas/paint-sampled-texture.js";
import { terrainState } from "../../state.js";
import { paintWavyTextureLine } from "../grass-dirt/paint-wavy-texture-line.js";
import { textureRgbToCss } from "../canvas/texture-rgb-to-css.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
import { paintWrappedTextureEllipse } from "../canvas/paint-wrapped-texture-ellipse.js";
export function createPlankTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  let tileableTextureNoiseResult = createTileableTextureNoise(value);
  let values = [12618325, 11894090, 13210975, 12223569].map(hexToTextureRgb);
  paintSampledTexture(terrainTextureCanvasResult2, (value2, value3) => {
    let result = Math.floor(value3 / 32);
    let result2 = values[(result * 7 + 3) % values.length];
    let result3 =
      1 +
      (tileableTextureNoiseResult.vn(value2, value3, 3, 64) * 0.07 +
        tileableTextureNoiseResult.vn(value2, value3, 16, 128) * 0.04);
    return [result2[0] * result3, result2[1] * result3, result2[2] * result3];
  });
  for (let index = 0; index < terrainState.terrainTextureLogicalSize / 32; index++) {
    let result4 = index * 32;
    for (let index2 = 0; index2 < 7; index2++) {
      paintWavyTextureLine(
        terrainTextureCanvasResult2,
        result4 + 5 + seededRandomResult() * 22,
        0.8,
        1 + Math.floor(seededRandomResult() * 3),
        seededRandomResult() * terrainState.textureFullTurn,
        hexToTextureRgb(9329972),
        0.22,
        1,
      );
    }
    terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(5913122), 0.9);
    terrainTextureCanvasResult2.fillRect(0, result4, terrainState.terrainTextureLogicalSize, 2);
    terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(14989188), 0.5);
    terrainTextureCanvasResult2.fillRect(
      0,
      result4 + 2,
      terrainState.terrainTextureLogicalSize,
      1.5,
    );
    terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(8015660), 0.35);
    terrainTextureCanvasResult2.fillRect(
      0,
      result4 + 32 - 3,
      terrainState.terrainTextureLogicalSize,
      1.5,
    );
    let result5 = ((index * 83) % 128) + 20;
    for (let result6 of [result5, result5 + 128]) {
      let result7 = result6 % terrainState.terrainTextureLogicalSize;
      terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(5913122), 0.85);
      terrainTextureCanvasResult2.fillRect(result7, result4, 2, 32);
      terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(14989188), 0.35);
      terrainTextureCanvasResult2.fillRect(result7 + 2, result4, 1.2, 32);
      paintWrappedTextureCircle(
        terrainTextureCanvasResult2,
        result7 - 5,
        result4 + 8,
        1.4,
        hexToTextureRgb(4928805),
        0.8,
      );
      paintWrappedTextureCircle(
        terrainTextureCanvasResult2,
        result7 + 7,
        result4 + 8,
        1.4,
        hexToTextureRgb(4928805),
        0.8,
      );
    }
    if (seededRandomResult() < 0.5) {
      let result8 = seededRandomResult() * terrainState.terrainTextureLogicalSize;
      let result9 = result4 + 10 + seededRandomResult() * 12;
      paintWrappedTextureEllipse(
        terrainTextureCanvasResult2,
        result8,
        result9,
        4,
        2.4,
        0,
        hexToTextureRgb(9067058),
        0.7,
      );
      paintWrappedTextureEllipse(
        terrainTextureCanvasResult2,
        result8,
        result9,
        1.8,
        1,
        0,
        hexToTextureRgb(6175520),
        0.8,
      );
    }
  }
  return terrainTextureCanvasResult;
}
