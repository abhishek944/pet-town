/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createRoofShingleTextureMaps(rangeValue) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(512);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(512);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(90, 70, 60);
  propTextureCanvasResult2.fillRect(0, 0, 512, 512);
  propTextureCanvasResult4.fillStyle = propGrayscaleStyle(20);
  propTextureCanvasResult4.fillRect(0, 0, 512, 512);
  let result = 512 / 7;
  let values = [];
  for (let index = 0; index < 8; index++) {
    values.push(
      Array.from(
        {
          length: 9,
        },
        () => [rangeValue.range(0.84, 1), rangeValue.range(-6, 6)],
      ),
    );
  }
  for (let result2 = 8; result2 >= 0; result2--) {
    let result3 = result2 * 64;
    let result4 = (result2 & 1) * 0.5;
    let result5 = values[result2 % 8];
    for (let result6 = -1; result6 <= 7; result6++) {
      let result7 = (result6 + result4) * result;
      let [result8, result9] = result5[(result6 + 7) % 7];
      let callback = (painter, value) => {
        let result10 = result3 - 38.4;
        let result11 = result3 + 64;
        let result12 = result * 0.46;
        painter.beginPath();
        painter.moveTo(result7 + 2, result10);
        painter.lineTo(result7 + result - 2, result10);
        painter.lineTo(result7 + result - 2, result11 - result12);
        painter.quadraticCurveTo(result7 + result - 2, result11, result7 + result / 2, result11);
        painter.quadraticCurveTo(result7 + 2, result11, result7 + 2, result11 - result12);
        painter.closePath();
        painter.fillStyle = value;
        painter.fill();
      };
      let linearGradientResult = propTextureCanvasResult2.createLinearGradient(
        0,
        result3 - 38.4,
        0,
        result3 + 64,
      );
      linearGradientResult.addColorStop(
        0,
        propRgbaStyle(150 * result8 + result9, 150 * result8, 150 * result8 - result9),
      );
      linearGradientResult.addColorStop(
        0.55,
        propRgbaStyle(215 * result8 + result9, 212 * result8, 208 * result8 - result9),
      );
      linearGradientResult.addColorStop(
        1,
        propRgbaStyle(250 * result8 + result9, 246 * result8, 240 * result8 - result9),
      );
      callback(propTextureCanvasResult2, linearGradientResult);
      propTextureCanvasResult2.strokeStyle = propRgbaStyle(80, 60, 50, 0.35);
      propTextureCanvasResult2.lineWidth = 2;
      propTextureCanvasResult2.stroke();
      for (let index2 = 0; index2 < 6; index2++) {
        propTextureCanvasResult2.fillStyle = propRgbaStyle(
          90,
          70,
          60,
          rangeValue.range(0.05, 0.14),
        );
        propTextureCanvasResult2.beginPath();
        propTextureCanvasResult2.arc(
          result7 + rangeValue.range(8, 65.14285714285714),
          result3 + rangeValue.range(0, 51.2),
          rangeValue.range(1, 3),
          0,
          7,
        );
        propTextureCanvasResult2.fill();
      }
      let linearGradientResult2 = propTextureCanvasResult4.createLinearGradient(
        0,
        result3 - 38.4,
        0,
        result3 + 64,
      );
      linearGradientResult2.addColorStop(0, propGrayscaleStyle(70));
      linearGradientResult2.addColorStop(1, propGrayscaleStyle(235));
      callback(propTextureCanvasResult4, linearGradientResult2);
    }
  }
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    bump: createPropCanvasTexture(propTextureCanvasResult3, false),
  };
}
