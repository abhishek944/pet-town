/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { drawPropTextureSpeckles } from "./draw-prop-texture-speckles.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createSailclothTextureMaps(value) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(256);
  propTextureCanvasResult2.fillStyle = propRgbaStyle(250, 244, 230);
  propTextureCanvasResult2.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 256; index += 2) {
    propTextureCanvasResult2.fillStyle = propRgbaStyle(120, 100, 70, 0.04);
    propTextureCanvasResult2.fillRect(0, index, 256, 1);
  }
  for (let index2 = 0; index2 < 256; index2 += 3) {
    propTextureCanvasResult2.fillStyle = propRgbaStyle(120, 100, 70, 0.03);
    propTextureCanvasResult2.fillRect(index2, 0, 1, 256);
  }
  propTextureCanvasResult2.strokeStyle = propRgbaStyle(150, 125, 95, 0.35);
  propTextureCanvasResult2.lineWidth = 1.5;
  propTextureCanvasResult2.setLineDash([4, 3]);
  for (let result of [256 / 3, 512 / 3]) {
    propTextureCanvasResult2.beginPath();
    propTextureCanvasResult2.moveTo(result, 0);
    propTextureCanvasResult2.lineTo(result, 256);
    propTextureCanvasResult2.stroke();
  }
  propTextureCanvasResult2.setLineDash([]);
  drawPropTextureSpeckles(
    propTextureCanvasResult2,
    256,
    value,
    60,
    (rangeValue) => propRgbaStyle(170, 150, 120, rangeValue.range(0.05, 0.15)),
    2,
    8,
  );
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
  };
}
