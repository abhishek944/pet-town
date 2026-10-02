/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createBrickTextureMaps(rangeValue) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(512);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(512);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(214, 204, 188);
  propTextureCanvasResult2.fillRect(0, 0, 512, 512);
  propTextureCanvasResult4.fillStyle = propGrayscaleStyle(40);
  propTextureCanvasResult4.fillRect(0, 0, 512, 512);
  for (let index = 0; index < 16; index++) {
    for (let result = -1; result <= 6; result++) {
      let result2 = (result + (index & 1) * 0.5) * 85.33333333333333;
      let result3 = index * 32;
      let rangeResult = rangeValue.range(0.78, 1);
      let rangeResult2 = rangeValue.range(-10, 10);
      let linearGradientResult = propTextureCanvasResult2.createLinearGradient(
        0,
        result3,
        0,
        result3 + 32,
      );
      linearGradientResult.addColorStop(
        0,
        propRgbaStyle(250 * rangeResult, (238 + rangeResult2) * rangeResult, 228 * rangeResult),
      );
      linearGradientResult.addColorStop(
        1,
        propRgbaStyle(210 * rangeResult, (196 + rangeResult2) * rangeResult, 186 * rangeResult),
      );
      propTextureCanvasResult2.fillStyle = linearGradientResult;
      propTextureCanvasResult2.beginPath();
      propTextureCanvasResult2.roundRect(result2 + 3, result3 + 3, 79.33333333333333, 26, 5);
      propTextureCanvasResult2.fill();
      propTextureCanvasResult4.fillStyle = propGrayscaleStyle(215);
      propTextureCanvasResult4.beginPath();
      propTextureCanvasResult4.roundRect(result2 + 3, result3 + 3, 79.33333333333333, 26, 5);
      propTextureCanvasResult4.fill();
      for (let index2 = 0; index2 < 5; index2++) {
        propTextureCanvasResult2.fillStyle = propRgbaStyle(
          120,
          90,
          80,
          rangeValue.range(0.08, 0.2),
        );
        propTextureCanvasResult2.fillRect(
          result2 + rangeValue.range(6, 77.33333333333333),
          result3 + rangeValue.range(5, 25),
          2,
          2,
        );
      }
    }
  }
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    bump: createPropCanvasTexture(propTextureCanvasResult3, false),
  };
}
