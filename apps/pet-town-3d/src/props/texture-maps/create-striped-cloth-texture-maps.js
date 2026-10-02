/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propRgbaStyle } from "./prop-rgba-style.js";
import { createPropCanvasTexture } from "./create-prop-canvas-texture.js";
export function createStripedClothTextureMaps(
  value,
  value2 = [226, 78, 70],
  value3 = [255, 246, 228],
) {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(256);
  for (let index = 0; index < 4; index++) {
    let [result, result2, result3] = index & 1 ? value3 : value2;
    propTextureCanvasResult2.fillStyle = propRgbaStyle(result, result2, result3);
    propTextureCanvasResult2.fillRect(index * 64, 0, 64, 256);
    let linearGradientResult = propTextureCanvasResult2.createLinearGradient(
      index * 64,
      0,
      (index + 1) * 64,
      0,
    );
    linearGradientResult.addColorStop(0, propRgbaStyle(0, 0, 0, 0.06));
    linearGradientResult.addColorStop(0.5, propRgbaStyle(255, 255, 255, 0.05));
    linearGradientResult.addColorStop(1, propRgbaStyle(0, 0, 0, 0.08));
    propTextureCanvasResult2.fillStyle = linearGradientResult;
    propTextureCanvasResult2.fillRect(index * 64, 0, 64, 256);
    propTextureCanvasResult2.strokeStyle = propRgbaStyle(0, 0, 0, 0.12);
    propTextureCanvasResult2.setLineDash([5, 4]);
    propTextureCanvasResult2.lineWidth = 1.2;
    propTextureCanvasResult2.beginPath();
    propTextureCanvasResult2.moveTo(index * 64 + 5, 0);
    propTextureCanvasResult2.lineTo(index * 64 + 5, 256);
    propTextureCanvasResult2.stroke();
    propTextureCanvasResult2.setLineDash([]);
  }
  for (let index2 = 0; index2 < 256; index2 += 2) {
    propTextureCanvasResult2.fillStyle = propRgbaStyle(0, 0, 0, 0.03);
    propTextureCanvasResult2.fillRect(0, index2, 256, 1);
  }
  for (let index3 = 0; index3 < 256; index3 += 2) {
    propTextureCanvasResult2.fillStyle = propRgbaStyle(255, 255, 255, 0.025);
    propTextureCanvasResult2.fillRect(index3, 0, 1, 256);
  }
  return {
    map: createPropCanvasTexture(propTextureCanvasResult),
  };
}
