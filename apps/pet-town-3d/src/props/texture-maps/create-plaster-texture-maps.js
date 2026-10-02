/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
import { drawWrappedPropTextureElement } from "./draw-wrapped-prop-texture-element.js";
import { drawPropTextureSpeckles } from "./draw-prop-texture-speckles.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createPlasterTextureMaps(nextValue) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(512);
  let [propTextureCanvasResult3, propTextureCanvasResult4] = createPropTextureCanvas(512);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(246, 242, 234);
  propTextureCanvasResult2.fillRect(0, 0, 512, 512);
  propTextureCanvasResult4.fillStyle = propGrayscaleStyle(128);
  propTextureCanvasResult4.fillRect(0, 0, 512, 512);
  for (let index = 0; index < 260; index++) {
    let result = nextValue.next() * 512;
    let result2 = nextValue.next() * 512;
    let rangeResult = nextValue.range(14, 70);
    let result3 = nextValue.next() < 0.55;
    let result4 = nextValue.next() < 0.5;
    let rangeResult2 = nextValue.range(0.25, 0.35);
    drawWrappedPropTextureElement(
      512,
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
          result3
            ? result4
              ? propRgbaStyle(214, 190, 160, rangeResult2)
              : propRgbaStyle(190, 192, 196, rangeResult2)
            : result4
              ? propRgbaStyle(255, 246, 225, rangeResult2)
              : propRgbaStyle(250, 252, 255, rangeResult2 * 0.8),
        );
        radialGradientResult.addColorStop(1, propRgbaStyle(230, 225, 215, 0));
        propTextureCanvasResult2.fillStyle = radialGradientResult;
        propTextureCanvasResult2.fillRect(
          value - rangeResult,
          value2 - rangeResult,
          rangeResult * 2,
          rangeResult * 2,
        );
        let radialGradientResult2 = propTextureCanvasResult4.createRadialGradient(
          value,
          value2,
          0,
          value,
          value2,
          rangeResult,
        );
        radialGradientResult2.addColorStop(0, propGrayscaleStyle(result3 ? 90 : 170, 0.25));
        radialGradientResult2.addColorStop(1, propGrayscaleStyle(128, 0));
        propTextureCanvasResult4.fillStyle = radialGradientResult2;
        propTextureCanvasResult4.fillRect(
          value - rangeResult,
          value2 - rangeResult,
          rangeResult * 2,
          rangeResult * 2,
        );
      },
      true,
    );
  }
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    512,
    nextValue,
    1400,
    (rangeValue) => propRgbaStyle(180, 170, 155, rangeValue.range(0.08, 0.25)),
    0.4,
    1.3,
  );
  drawPropTextureSpeckles(
    propTextureCanvasResult4,
    512,
    nextValue,
    1400,
    (nextValue2) => propGrayscaleStyle(nextValue2.next() < 0.5 ? 60 : 200, 0.5),
    0.5,
    1.4,
  );
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
    bump: createPropCanvasTexture(propTextureCanvasResult3, false),
  };
}
