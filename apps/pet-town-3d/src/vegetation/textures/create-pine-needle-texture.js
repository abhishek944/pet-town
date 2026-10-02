/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
import { createVegetationTextureRandom } from "./create-vegetation-texture-random.js";
import { clampTextureColorByte } from "./clamp-texture-color-byte.js";
import { drawWrappedVegetationTextureElement } from "./draw-wrapped-vegetation-texture-element.js";
import { createRepeatingVegetationTexture } from "./create-repeating-vegetation-texture.js";
export function createPineNeedleTexture(value = 256, value2 = 23) {
  let element = document.createElement(`canvas`);
  element.width = element.height = value;
  let painter = element.getContext(`2d`);
  let vegetationTextureRandomResult = createVegetationTextureRandom(value2);
  painter.fillStyle = `rgb(206,210,200)`;
  painter.fillRect(0, 0, value, value);
  painter.lineCap = `round`;
  for (let index = 0; index < 150; index++) {
    let result = vegetationTextureRandomResult() * value;
    let result2 = vegetationTextureRandomResult() * value;
    let result3 = 7 + Math.floor(vegetationTextureRandomResult() * 6);
    let result4 = (vegetationTextureRandomResult() - 0.5) * 50;
    for (let index2 = 0; index2 < result3; index2++) {
      let result5 = Math.PI / 2 + (vegetationTextureRandomResult() - 0.5) * 0.9;
      let result6 = 9 + vegetationTextureRandomResult() * 12;
      let result7 = result + (vegetationTextureRandomResult() - 0.5) * 10;
      let result8 = result2 + (vegetationTextureRandomResult() - 0.5) * 6;
      let result9 = 214 + result4 + (vegetationTextureRandomResult() - 0.5) * 30;
      painter.strokeStyle = `rgba(${clampTextureColorByte(result9 - 6)},${clampTextureColorByte(result9 + 4)},${clampTextureColorByte(result9 - 10)},0.75)`;
      painter.lineWidth = 1.4 + vegetationTextureRandomResult() * 1.3;
      drawWrappedVegetationTextureElement(
        value,
        result7,
        result8,
        result6 + 2,
        (value3, value4) => {
          painter.beginPath();
          painter.moveTo(value3, value4);
          painter.lineTo(
            value3 + Math.cos(result5) * result6,
            value4 + Math.sin(result5) * result6,
          );
          painter.stroke();
        },
      );
    }
  }
  return createRepeatingVegetationTexture(element);
}
