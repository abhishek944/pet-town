/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
import { drawWrappedPropTextureElement } from "./draw-wrapped-prop-texture-element.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createWoodPlankTextureMaps(rangeValue, value = false) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(512);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(512);
  for (let index = 0; index < 8; index++) {
    let result = index * 64;
    let rangeResult = rangeValue.range(0.86, 1);
    let rangeResult2 = rangeValue.range(0.9, 0.97);
    propTextureCanvasResult2.fillStyle = value
      ? propRgbaStyle(246 * rangeResult, 244 * rangeResult, 240 * rangeResult)
      : propRgbaStyle(
          236 * rangeResult,
          222 * rangeResult * rangeResult2,
          200 * rangeResult * rangeResult2 * rangeResult2,
        );
    propTextureCanvasResult2.fillRect(0, result, 512, 64);
    propTextureCanvasResult4.fillStyle = propGrayscaleStyle(170);
    propTextureCanvasResult4.fillRect(0, result, 512, 64);
    for (let index2 = 0; index2 < 26; index2++) {
      let result5 = result + rangeValue.range(4, 60);
      let rangeResult3 = rangeValue.range(0.6, 3);
      let result6 = (rangeValue.int(1, 4) * Math.PI * 2) / 512;
      let result7 = rangeValue.next() * 6;
      let result8 = rangeValue.next() < 0.5;
      propTextureCanvasResult2.strokeStyle = result8
        ? value
          ? propRgbaStyle(150, 145, 140, rangeValue.range(0.03, 0.07))
          : propRgbaStyle(120, 85, 50, rangeValue.range(0.05, 0.14))
        : propRgbaStyle(255, 250, 240, rangeValue.range(0.05, 0.12));
      propTextureCanvasResult2.lineWidth = rangeValue.range(0.8, 2.4);
      propTextureCanvasResult2.beginPath();
      for (let index3 = 0; index3 <= 512; index3 += 8) {
        let result9 = result5 + Math.sin(index3 * result6 + result7) * rangeResult3;
        if (index3) {
          propTextureCanvasResult2.lineTo(index3, result9);
        } else {
          propTextureCanvasResult2.moveTo(index3, result9);
        }
      }
      propTextureCanvasResult2.stroke();
      propTextureCanvasResult4.strokeStyle = propGrayscaleStyle(result8 ? 150 : 185, 0.5);
      propTextureCanvasResult4.lineWidth = 1;
      propTextureCanvasResult4.stroke();
    }
    if (!value && rangeValue.next() < 0.55) {
      let result10 = rangeValue.next() * 512;
      let result11 = result + rangeValue.range(19.2, 44.8);
      let rangeResult4 = rangeValue.range(4, 9);
      drawWrappedPropTextureElement(512, result10, result11, (value2, value3) => {
        for (let result12 = rangeResult4 * 2.2; result12 > 1; result12 -= 2) {
          propTextureCanvasResult2.strokeStyle = propRgbaStyle(110, 72, 40, 0.18);
          propTextureCanvasResult2.lineWidth = 1.2;
          propTextureCanvasResult2.beginPath();
          propTextureCanvasResult2.ellipse(value2, value3, result12 * 1.9, result12 * 0.7, 0, 0, 7);
          propTextureCanvasResult2.stroke();
        }
        propTextureCanvasResult2.fillStyle = propRgbaStyle(105, 66, 36, 0.55);
        propTextureCanvasResult2.beginPath();
        propTextureCanvasResult2.ellipse(value2, value3, rangeResult4, rangeResult4 * 0.6, 0, 0, 7);
        propTextureCanvasResult2.fill();
        propTextureCanvasResult4.fillStyle = propGrayscaleStyle(130);
        propTextureCanvasResult4.beginPath();
        propTextureCanvasResult4.ellipse(value2, value3, rangeResult4, rangeResult4 * 0.6, 0, 0, 7);
        propTextureCanvasResult4.fill();
      });
    }
    let linearGradientResult = propTextureCanvasResult4.createLinearGradient(
      0,
      result,
      0,
      result + 64,
    );
    linearGradientResult.addColorStop(0, propGrayscaleStyle(60));
    linearGradientResult.addColorStop(0.08, propGrayscaleStyle(165, 0));
    linearGradientResult.addColorStop(0.92, propGrayscaleStyle(165, 0));
    linearGradientResult.addColorStop(1, propGrayscaleStyle(70));
    propTextureCanvasResult4.fillStyle = linearGradientResult;
    propTextureCanvasResult4.fillRect(0, result, 512, 64);
    propTextureCanvasResult2.fillStyle = value
      ? propRgbaStyle(120, 115, 110, 0.5)
      : propRgbaStyle(70, 45, 25, 0.55);
    propTextureCanvasResult2.fillRect(0, result, 512, 2.5);
    propTextureCanvasResult2.fillStyle = propRgbaStyle(255, 250, 240, 0.35);
    propTextureCanvasResult2.fillRect(0, result + 3, 512, 1.5);
    propTextureCanvasResult2.fillStyle = value
      ? propRgbaStyle(120, 115, 110, 0.12)
      : propRgbaStyle(90, 60, 35, 0.18);
    propTextureCanvasResult2.fillRect(0, result + 64 - 4, 512, 4);
    let result2 = rangeValue.next() * 512;
    let result3 = rangeValue.next() < 0.6;
    let result4 = rangeValue.next() < 0.35;
    if (result3) {
      for (let result13 of [result2, result2 - 512, result2 + 512]) {
        if (
          ((propTextureCanvasResult2.fillStyle = value
            ? propRgbaStyle(120, 115, 110, 0.4)
            : propRgbaStyle(70, 45, 25, 0.45)),
          propTextureCanvasResult2.fillRect(result13, result, 2, 64),
          (propTextureCanvasResult4.fillStyle = propGrayscaleStyle(60)),
          propTextureCanvasResult4.fillRect(result13 - 1, result, 3, 64),
          result4)
        ) {
          propTextureCanvasResult2.fillStyle = propRgbaStyle(80, 70, 65, 0.45);
          for (let result14 of [result13 - 6, result13 + 7]) {
            propTextureCanvasResult2.beginPath();
            propTextureCanvasResult2.arc(result14, result + 32, 1.5, 0, 7);
            propTextureCanvasResult2.fill();
          }
        }
      }
    }
  }
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    bump: createPropCanvasTexture(propTextureCanvasResult3, false),
  };
}
