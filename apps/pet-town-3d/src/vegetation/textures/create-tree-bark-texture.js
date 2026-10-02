/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
import { createVegetationTextureRandom } from "./create-vegetation-texture-random.js";
import { createRepeatingVegetationTexture } from "./create-repeating-vegetation-texture.js";
export function createTreeBarkTexture(value = 256, value2 = 11) {
  let element = document.createElement(`canvas`);
  element.width = value;
  element.height = value;
  let painter = element.getContext(`2d`);
  let vegetationTextureRandomResult = createVegetationTextureRandom(value2);
  painter.fillStyle = `rgb(214,208,200)`;
  painter.fillRect(0, 0, value, value);
  for (let index = 0; index < 26; index++) {
    let result = vegetationTextureRandomResult() * value;
    let result2 = 2 + vegetationTextureRandomResult() * 5;
    let result3 = 120 + Math.floor(vegetationTextureRandomResult() * 50);
    painter.strokeStyle = `rgba(${result3 - 10},${result3 - 24},${result3 - 36},0.55)`;
    painter.lineWidth = result2;
    for (let result4 of [-value, 0, value]) {
      painter.beginPath();
      for (let result5 = -8; result5 <= value + 8; result5 += 8) {
        let result6 =
          result +
          result4 +
          Math.sin(result5 * 0.045 + index) * 5 +
          Math.sin(result5 * 0.13 + index * 2.1) * 2;
        if (result5 === -8) {
          painter.moveTo(result6, result5);
        } else {
          painter.lineTo(result6, result5);
        }
      }
      painter.stroke();
    }
  }
  for (let index2 = 0; index2 < 20; index2++) {
    let result7 = vegetationTextureRandomResult() * value;
    painter.strokeStyle = `rgba(255,248,236,0.35)`;
    painter.lineWidth = 1.5 + vegetationTextureRandomResult() * 2;
    painter.beginPath();
    for (let result8 = -8; result8 <= value + 8; result8 += 8) {
      let result9 = result7 + Math.sin(result8 * 0.05 + index2 * 3) * 4;
      if (result8 === -8) {
        painter.moveTo(result9, result8);
      } else {
        painter.lineTo(result9, result8);
      }
    }
    painter.stroke();
  }
  for (let index3 = 0; index3 < 5; index3++) {
    let result10 = vegetationTextureRandomResult() * value;
    let result11 = vegetationTextureRandomResult() * value;
    let result12 = 4 + vegetationTextureRandomResult() * 6;
    painter.fillStyle = `rgba(90,60,40,0.45)`;
    painter.beginPath();
    painter.ellipse(result10, result11, result12 * 0.7, result12, 0, 0, Math.PI * 2);
    painter.fill();
  }
  return createRepeatingVegetationTexture(element);
}
