/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createWindowTextureMaps() {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(128);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(128);
  let linearGradientResult = propTextureCanvasResult2.createLinearGradient(0, 0, 0, 128);
  linearGradientResult.addColorStop(0, propRgbaStyle(205, 232, 245));
  linearGradientResult.addColorStop(0.55, propRgbaStyle(120, 170, 200));
  linearGradientResult.addColorStop(1, propRgbaStyle(70, 110, 140));
  propTextureCanvasResult2.fillStyle = linearGradientResult;
  propTextureCanvasResult2.fillRect(0, 0, 128, 128);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(255, 255, 255, 0.45);
  for (let [result, result2] of [
    [18, 16],
    [44, 7],
    [80, 20],
  ]) {
    propTextureCanvasResult2.beginPath();
    propTextureCanvasResult2.moveTo(result, 128);
    propTextureCanvasResult2.lineTo(result + result2, 128);
    propTextureCanvasResult2.lineTo(result + result2 + 50, 0);
    propTextureCanvasResult2.lineTo(result + 50, 0);
    propTextureCanvasResult2.closePath();
    propTextureCanvasResult2.fill();
  }
  let radialGradientResult = propTextureCanvasResult4.createRadialGradient(
    64,
    79.36,
    4,
    64,
    70.4,
    96,
  );
  radialGradientResult.addColorStop(0, propRgbaStyle(255, 226, 150));
  radialGradientResult.addColorStop(0.55, propRgbaStyle(255, 196, 105));
  radialGradientResult.addColorStop(1, propRgbaStyle(255, 170, 70));
  propTextureCanvasResult4.fillStyle = radialGradientResult;
  propTextureCanvasResult4.fillRect(0, 0, 128, 128);
  for (let result3 of [0, 1]) {
    let result4 = result3 ? 98 : 0;
    let linearGradientResult2 = propTextureCanvasResult4.createLinearGradient(
      result4,
      0,
      result4 + 30,
      0,
    );
    let result5 = result3
      ? [propRgbaStyle(200, 140, 50, 0), propRgbaStyle(176, 118, 38)]
      : [propRgbaStyle(176, 118, 38), propRgbaStyle(200, 140, 50, 0)];
    linearGradientResult2.addColorStop(0, result5[0]);
    linearGradientResult2.addColorStop(1, result5[1]);
    propTextureCanvasResult4.fillStyle = linearGradientResult2;
    propTextureCanvasResult4.fillRect(result4, 0, 30, 128);
    propTextureCanvasResult4.strokeStyle = propRgbaStyle(130, 82, 24, 0.45);
    propTextureCanvasResult4.lineWidth = 2;
    for (let index = 0; index < 3; index++) {
      let result6 = result3 ? 122 - index * 8 : 6 + index * 8;
      propTextureCanvasResult4.beginPath();
      propTextureCanvasResult4.moveTo(result6, 0);
      propTextureCanvasResult4.lineTo(result6 + (result3 ? -3 : 3), 128);
      propTextureCanvasResult4.stroke();
    }
  }
  propTextureCanvasResult4.fillStyle = propRgbaStyle(150, 96, 40, 0.8);
  propTextureCanvasResult4.fillRect(0, 118, 128, 10);
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    emissive: createPropCanvasTexture(propTextureCanvasResult3),
  };
}
