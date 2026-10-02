/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
import { drawWrappedPropTextureElement } from "./draw-wrapped-prop-texture-element.js";
import { drawPropTextureSpeckles } from "./draw-prop-texture-speckles.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createRockTextureMaps(nextValue) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(256);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(256);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(232, 230, 226);
  propTextureCanvasResult2.fillRect(0, 0, 256, 256);
  propTextureCanvasResult4.fillStyle = propGrayscaleStyle(128);
  propTextureCanvasResult4.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 120; index++) {
    let result = nextValue.next() * 256;
    let result2 = nextValue.next() * 256;
    let rangeResult = nextValue.range(6, 26);
    let result3 = nextValue.next() < 0.5;
    drawWrappedPropTextureElement(
      256,
      result,
      result2,
      (value, value2) => {
        let radialGradientResult = propTextureCanvasResult2.createRadialGradient(
          value,
          value2,
          0,
          value,
          value2,
          rangeResult,
        );
        radialGradientResult.addColorStop(
          0,
          result3 ? propRgbaStyle(170, 168, 165, 0.25) : propRgbaStyle(255, 255, 255, 0.25),
        );
        radialGradientResult.addColorStop(1, propRgbaStyle(200, 200, 200, 0));
        propTextureCanvasResult2.fillStyle = radialGradientResult;
        propTextureCanvasResult2.fillRect(
          value - rangeResult,
          value2 - rangeResult,
          2 * rangeResult,
          2 * rangeResult,
        );
        let radialGradientResult2 = propTextureCanvasResult4.createRadialGradient(
          value,
          value2,
          0,
          value,
          value2,
          rangeResult,
        );
        radialGradientResult2.addColorStop(0, propGrayscaleStyle(result3 ? 70 : 190, 0.4));
        radialGradientResult2.addColorStop(1, propGrayscaleStyle(128, 0));
        propTextureCanvasResult4.fillStyle = radialGradientResult2;
        propTextureCanvasResult4.fillRect(
          value - rangeResult,
          value2 - rangeResult,
          2 * rangeResult,
          2 * rangeResult,
        );
      },
      true,
    );
  }
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    256,
    nextValue,
    700,
    (nextValue2) =>
      nextValue2.next() < 0.5
        ? propRgbaStyle(120, 118, 115, nextValue2.range(0.15, 0.4))
        : propRgbaStyle(255, 255, 255, nextValue2.range(0.2, 0.5)),
    0.4,
    1.2,
  );
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    256,
    nextValue,
    40,
    (rangeValue) => propRgbaStyle(200, 205, 150, rangeValue.range(0.25, 0.5)),
    1.5,
    4,
  );
  for (let index2 = 0; index2 < 5; index2++) {
    let result4 = nextValue.next() * 256;
    let result5 = nextValue.next() * 256;
    propTextureCanvasResult2.strokeStyle = propRgbaStyle(90, 88, 85, 0.35);
    propTextureCanvasResult4.strokeStyle = propGrayscaleStyle(30, 0.8);
    propTextureCanvasResult2.lineWidth = propTextureCanvasResult4.lineWidth = 1.2;
    propTextureCanvasResult2.beginPath();
    propTextureCanvasResult4.beginPath();
    propTextureCanvasResult2.moveTo(result4, result5);
    propTextureCanvasResult4.moveTo(result4, result5);
    for (let index3 = 0; index3 < 8; index3++) {
      result4 += nextValue.range(-10, 10);
      result5 += nextValue.range(3, 12);
      propTextureCanvasResult2.lineTo(result4, result5);
      propTextureCanvasResult4.lineTo(result4, result5);
    }
    propTextureCanvasResult2.stroke();
    propTextureCanvasResult4.stroke();
  }
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    bump: createPropCanvasTexture(propTextureCanvasResult3, false),
  };
}
