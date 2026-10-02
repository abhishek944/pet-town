/** Paths, gravel, planks, bark and log end grain textures. */
import { createTerrainTextureCanvas } from "../canvas/create-terrain-texture-canvas.js";
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { textureRgbToCss } from "../canvas/texture-rgb-to-css.js";
import { hexToTextureRgb } from "../canvas/hex-to-texture-rgb.js";
import { terrainState } from "../../state.js";
import { paintWrappedTextureCircle } from "../canvas/paint-wrapped-texture-circle.js";
import { paintWrappedTextureStroke } from "../canvas/paint-wrapped-texture-stroke.js";
export function createLogEndTexture(value) {
  let { c: terrainTextureCanvasResult, g: terrainTextureCanvasResult2 } =
    createTerrainTextureCanvas();
  let seededRandomResult = createSeededRandom(value);
  terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(7227950));
  terrainTextureCanvasResult2.fillRect(
    0,
    0,
    terrainState.terrainTextureLogicalSize,
    terrainState.terrainTextureLogicalSize,
  );
  for (let [result, result2] of [
    [64, 64],
    [192, 64],
    [64, 192],
    [192, 192],
  ]) {
    terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(6044708));
    terrainTextureCanvasResult2.fillRect(result - 64, result2 - 64, 128, 128);
    terrainTextureCanvasResult2.fillStyle = textureRgbToCss(hexToTextureRgb(14199664));
    terrainTextureCanvasResult2.beginPath();
    terrainTextureCanvasResult2.arc(result, result2, 52, 0, terrainState.textureFullTurn);
    terrainTextureCanvasResult2.fill();
    for (let result3 = 6; result3 < 52; result3 += 5 + seededRandomResult() * 3) {
      terrainTextureCanvasResult2.strokeStyle = textureRgbToCss(hexToTextureRgb(11830094), 0.55);
      terrainTextureCanvasResult2.lineWidth = 1.3;
      terrainTextureCanvasResult2.beginPath();
      for (let index = 0; index <= terrainState.textureFullTurn + 0.01; index += 0.2) {
        let result4 = result3 + Math.sin(index * 3 + result3) * 0.8;
        let result5 = result + Math.cos(index) * result4;
        let result6 = result2 + Math.sin(index) * result4;
        if (index === 0) {
          terrainTextureCanvasResult2.moveTo(result5, result6);
        } else {
          terrainTextureCanvasResult2.lineTo(result5, result6);
        }
      }
      terrainTextureCanvasResult2.stroke();
    }
    paintWrappedTextureCircle(
      terrainTextureCanvasResult2,
      result,
      result2,
      2.5,
      hexToTextureRgb(10119740),
      0.9,
    );
    for (let index2 = 0; index2 < 3; index2++) {
      let result7 = seededRandomResult() * terrainState.textureFullTurn;
      paintWrappedTextureStroke(
        terrainTextureCanvasResult2,
        result + Math.cos(result7) * 12,
        result2 + Math.sin(result7) * 12,
        result7,
        30,
        1.2,
        hexToTextureRgb(9067572),
        0.5,
      );
    }
  }
  return terrainTextureCanvasResult;
}
