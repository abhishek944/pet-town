/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
import * as THREE from "three";
import { createVegetationTextureRandom } from "./create-vegetation-texture-random.js";
import { clampTextureColorByte } from "./clamp-texture-color-byte.js";
export function createLeafFringeAtlas(value = 256, value2 = 5) {
  let element = document.createElement(`canvas`);
  element.width = element.height = value;
  let painter = element.getContext(`2d`);
  let vegetationTextureRandomResult = createVegetationTextureRandom(value2);
  painter.clearRect(0, 0, value, value);
  let result = value / 2;
  for (let index = 0; index < 2; index++) {
    for (let index2 = 0; index2 < 2; index2++) {
      let result2 = index2 * result;
      let result3 = index * result;
      painter.save();
      painter.beginPath();
      painter.rect(result2 + 1, result3 + 1, result - 2, result - 2);
      painter.clip();
      let result4 = 3 + Math.floor(vegetationTextureRandomResult() * 3);
      let result5 = vegetationTextureRandomResult() * Math.PI * 2;
      let result6 = result2 + result * (0.4 + vegetationTextureRandomResult() * 0.2);
      let result7 = result3 + result * (0.5 + vegetationTextureRandomResult() * 0.15);
      for (let index3 = 0; index3 < result4; index3++) {
        let result8 =
          result5 +
          (index3 - (result4 - 1) / 2) * (0.55 + vegetationTextureRandomResult() * 0.35) +
          (vegetationTextureRandomResult() - 0.5) * 0.3;
        let result9 = result * (0.3 + vegetationTextureRandomResult() * 0.16);
        let result10 = result9 * (0.34 + vegetationTextureRandomResult() * 0.12);
        let result11 = 214 + (vegetationTextureRandomResult() - 0.5) * 30;
        painter.save();
        painter.translate(result6, result7);
        painter.rotate(result8);
        let linearGradientResult = painter.createLinearGradient(0, -result10, 0, result10);
        linearGradientResult.addColorStop(
          0,
          `rgb(${clampTextureColorByte(result11 + 18)},${clampTextureColorByte(result11 + 20)},${clampTextureColorByte(result11 + 8)})`,
        );
        linearGradientResult.addColorStop(
          1,
          `rgb(${clampTextureColorByte(result11 - 22)},${clampTextureColorByte(result11 - 18)},${clampTextureColorByte(result11 - 20)})`,
        );
        painter.fillStyle = linearGradientResult;
        painter.beginPath();
        painter.moveTo(0, 0);
        painter.bezierCurveTo(
          result9 * 0.25,
          -result10 * 1.2,
          result9 * 0.72,
          -result10,
          result9,
          0,
        );
        painter.bezierCurveTo(result9 * 0.72, result10, result9 * 0.25, result10 * 1.2, 0, 0);
        painter.fill();
        painter.restore();
      }
      painter.restore();
    }
  }
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  return texture;
}
