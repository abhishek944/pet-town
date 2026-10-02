/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
import { drawPropTextureSpeckles } from "./draw-prop-texture-speckles.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createGardenSoilTextureMaps(value) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(256);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(256);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(122, 84, 58);
  propTextureCanvasResult2.fillRect(0, 0, 256, 256);
  propTextureCanvasResult4.fillStyle = propGrayscaleStyle(128);
  propTextureCanvasResult4.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 4; index++) {
    let result = (index * 256) / 4;
    let linearGradientResult = propTextureCanvasResult2.createLinearGradient(
      0,
      result,
      0,
      result + 64,
    );
    linearGradientResult.addColorStop(0, propRgbaStyle(80, 52, 36, 0.6));
    linearGradientResult.addColorStop(0.5, propRgbaStyle(150, 108, 76, 0.3));
    linearGradientResult.addColorStop(1, propRgbaStyle(80, 52, 36, 0.6));
    propTextureCanvasResult2.fillStyle = linearGradientResult;
    propTextureCanvasResult2.fillRect(0, result, 256, 64);
    let linearGradientResult2 = propTextureCanvasResult4.createLinearGradient(
      0,
      result,
      0,
      result + 64,
    );
    linearGradientResult2.addColorStop(0, propGrayscaleStyle(40));
    linearGradientResult2.addColorStop(0.5, propGrayscaleStyle(220));
    linearGradientResult2.addColorStop(1, propGrayscaleStyle(40));
    propTextureCanvasResult4.fillStyle = linearGradientResult2;
    propTextureCanvasResult4.fillRect(0, result, 256, 64);
  }
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    256,
    value,
    900,
    (nextValue) =>
      nextValue.next() < 0.5
        ? propRgbaStyle(70, 45, 30, nextValue.range(0.3, 0.7))
        : propRgbaStyle(170, 128, 95, nextValue.range(0.3, 0.6)),
    0.6,
    2.4,
  );
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    256,
    value,
    30,
    (rangeValue) => propRgbaStyle(190, 180, 165, rangeValue.range(0.6, 0.9)),
    1.2,
    2.6,
  );
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    bump: createPropCanvasTexture(propTextureCanvasResult3, false),
  };
}
