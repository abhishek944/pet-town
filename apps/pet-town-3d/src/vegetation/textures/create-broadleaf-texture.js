/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
import { createVegetationTextureRandom } from "./create-vegetation-texture-random.js";
import { drawWrappedVegetationTextureElement } from "./draw-wrapped-vegetation-texture-element.js";
import { clampTextureColorByte } from "./clamp-texture-color-byte.js";
import { createRepeatingVegetationTexture } from "./create-repeating-vegetation-texture.js";
export function createBroadleafTexture(value = 256, value2 = 7) {
  let element = document.createElement(`canvas`);
  element.width = element.height = value;
  let painter = element.getContext(`2d`);
  let vegetationTextureRandomResult = createVegetationTextureRandom(value2);
  painter.fillStyle = `rgb(196,200,190)`;
  painter.fillRect(0, 0, value, value);
  for (let index = 0; index < 40; index++) {
    let result = vegetationTextureRandomResult() * value;
    let result2 = vegetationTextureRandomResult() * value;
    let result3 = value * (0.08 + vegetationTextureRandomResult() * 0.12);
    let result4 = vegetationTextureRandomResult() < 0.5;
    drawWrappedVegetationTextureElement(value, result, result2, result3, (value3, value4) => {
      let radialGradientResult = painter.createRadialGradient(
        value3,
        value4,
        0,
        value3,
        value4,
        result3,
      );
      let result5 = result4 ? `255,255,235` : `30,50,40`;
      radialGradientResult.addColorStop(
        0,
        `rgba(${result5},${0.12 + vegetationTextureRandomResult() * 0.08})`,
      );
      radialGradientResult.addColorStop(1, `rgba(${result5},0)`);
      painter.fillStyle = radialGradientResult;
      painter.beginPath();
      painter.arc(value3, value4, result3, 0, Math.PI * 2);
      painter.fill();
    });
  }
  let callback = (value5, value6) => {
    painter.beginPath();
    painter.moveTo(0, 0);
    painter.bezierCurveTo(value5 * 0.25, -value6, value5 * 0.7, -value6 * 0.9, value5, 0);
    painter.bezierCurveTo(value5 * 0.7, value6 * 0.9, value5 * 0.25, value6, 0, 0);
  };
  for (let index2 = 0; index2 < 150; index2++) {
    let result6 = vegetationTextureRandomResult() * value;
    let result7 = vegetationTextureRandomResult() * value;
    let result8 = 3 + Math.floor(vegetationTextureRandomResult() * 5);
    let result9 = vegetationTextureRandomResult() * Math.PI * 2;
    let result10 = 200 + (vegetationTextureRandomResult() - 0.5) * 120;
    let result11 = value * (0.045 + vegetationTextureRandomResult() * 0.03);
    drawWrappedVegetationTextureElement(
      value,
      result6,
      result7,
      result11 * 1.2,
      (value7, value8) => {
        for (let index3 = 0; index3 < result8; index3++) {
          let result12 =
            result9 +
            (index3 / result8) * Math.PI * 1.6 +
            (vegetationTextureRandomResult() - 0.5) * 0.4;
          let result13 = result10 + (vegetationTextureRandomResult() - 0.5) * 30;
          painter.save();
          painter.translate(value7, value8);
          painter.rotate(result12);
          let result14 = result11 * (0.3 + vegetationTextureRandomResult() * 0.12);
          let linearGradientResult = painter.createLinearGradient(0, -result14, 0, result14);
          linearGradientResult.addColorStop(
            0,
            `rgb(${clampTextureColorByte(result13 + 30)},${clampTextureColorByte(result13 + 34)},${clampTextureColorByte(result13 + 18)})`,
          );
          linearGradientResult.addColorStop(
            1,
            `rgb(${clampTextureColorByte(result13 - 34)},${clampTextureColorByte(result13 - 30)},${clampTextureColorByte(result13 - 30)})`,
          );
          painter.fillStyle = linearGradientResult;
          callback(result11, result14);
          painter.fill();
          painter.strokeStyle = `rgba(255,255,230,0.18)`;
          painter.lineWidth = 1;
          painter.beginPath();
          painter.moveTo(result11 * 0.1, 0);
          painter.lineTo(result11 * 0.85, 0);
          painter.stroke();
          painter.restore();
        }
      },
    );
  }
  return createRepeatingVegetationTexture(element);
}
