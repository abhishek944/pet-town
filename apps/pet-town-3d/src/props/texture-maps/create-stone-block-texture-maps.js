/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
import { drawPropTextureSpeckles } from "./draw-prop-texture-speckles.js";
import { drawWrappedPropTextureElement } from "./draw-wrapped-prop-texture-element.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createStoneBlockTextureMaps(rangeValue) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(512);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(512);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(200, 186, 166);
  propTextureCanvasResult2.fillRect(0, 0, 512, 512);
  propTextureCanvasResult4.fillStyle = propGrayscaleStyle(40);
  propTextureCanvasResult4.fillRect(0, 0, 512, 512);
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    512,
    rangeValue,
    900,
    (rangeValue2) => propRgbaStyle(156, 140, 122, rangeValue2.range(0.1, 0.3)),
    0.5,
    1.5,
  );
  let index = 0;
  let values = [];
  for (; index < 502;) {
    let result = Math.round(rangeValue.range(44, 78));
    if (512 - (index + result) < 40) {
      result = 512 - index;
    }
    values.push([index, result]);
    index += result;
  }
  for (let [result2, result3] of values) {
    let rangeResult = rangeValue.range(0, 60);
    let rangeResultValue = rangeResult;
    for (; rangeResult < rangeResultValue + 512;) {
      let rangeResult2 = rangeValue.range(58, 120);
      if (rangeResultValue + 512 - (rangeResult + rangeResult2) < 40) {
        rangeResult2 = rangeResultValue + 512 - rangeResult;
      }
      let rangeResult3 = rangeValue.range(0.82, 1.02);
      let rangeResult4 = rangeValue.range(-8, 8);
      drawWrappedPropTextureElement(512, rangeResult, result2, (value, value2) => {
        let result4 = value + 4;
        let result5 = value2 + 4;
        let result6 = rangeResult2 - 8;
        let result7 = result3 - 8;
        let result8 = Math.min(result6, result7) * rangeValue.range(0.28, 0.45);
        let callback = (painter) => {
          painter.beginPath();
          painter.roundRect(result4, result5, result6, result7, result8);
        };
        let linearGradientResult = propTextureCanvasResult2.createLinearGradient(
          result4,
          result5,
          result4 + result6 * 0.4,
          result5 + result7,
        );
        linearGradientResult.addColorStop(
          0,
          propRgbaStyle(
            255 * rangeResult3 + rangeResult4,
            250 * rangeResult3,
            240 * rangeResult3 - rangeResult4,
          ),
        );
        linearGradientResult.addColorStop(
          0.6,
          propRgbaStyle(
            238 * rangeResult3 + rangeResult4,
            229 * rangeResult3,
            214 * rangeResult3 - rangeResult4,
          ),
        );
        linearGradientResult.addColorStop(
          1,
          propRgbaStyle(
            204 * rangeResult3 + rangeResult4,
            190 * rangeResult3,
            172 * rangeResult3 - rangeResult4,
          ),
        );
        callback(propTextureCanvasResult2);
        propTextureCanvasResult2.fillStyle = linearGradientResult;
        propTextureCanvasResult2.fill();
        propTextureCanvasResult2.strokeStyle = propRgbaStyle(110, 102, 92, 0.35);
        propTextureCanvasResult2.lineWidth = 2;
        propTextureCanvasResult2.stroke();
        let radialGradientResult = propTextureCanvasResult4.createRadialGradient(
          result4 + result6 / 2,
          result5 + result7 / 2,
          2,
          result4 + result6 / 2,
          result5 + result7 / 2,
          Math.max(result6, result7) * 0.6,
        );
        radialGradientResult.addColorStop(0, propGrayscaleStyle(250));
        radialGradientResult.addColorStop(0.7, propGrayscaleStyle(215));
        radialGradientResult.addColorStop(1, propGrayscaleStyle(120));
        callback(propTextureCanvasResult4);
        propTextureCanvasResult4.fillStyle = radialGradientResult;
        propTextureCanvasResult4.fill();
      });
      rangeResult += rangeResult2;
    }
  }
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    512,
    rangeValue,
    500,
    (rangeValue3) => propRgbaStyle(120, 115, 105, rangeValue3.range(0.05, 0.18)),
    0.5,
    2,
  );
  for (let index2 = 0; index2 < 14; index2++) {
    let result9 = rangeValue.next() * 512;
    let result10 = rangeValue.next() * 512;
    let radialGradientResult2 = propTextureCanvasResult2.createRadialGradient(
      result9,
      result10,
      1,
      result9,
      result10,
      rangeValue.range(6, 16),
    );
    radialGradientResult2.addColorStop(0, propRgbaStyle(140, 160, 90, 0.35));
    radialGradientResult2.addColorStop(1, propRgbaStyle(140, 160, 90, 0));
    propTextureCanvasResult2.fillStyle = radialGradientResult2;
    propTextureCanvasResult2.fillRect(result9 - 20, result10 - 20, 40, 40);
  }
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    bump: createPropCanvasTexture(propTextureCanvasResult3, false),
  };
}
