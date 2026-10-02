/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
import * as THREE from "three";
import { createVegetationTextureRandom } from "./create-vegetation-texture-random.js";
import { clampTextureColorByte } from "./clamp-texture-color-byte.js";
export function createPineFringeTexture(value = 128, value2 = 9) {
  let element = document.createElement(`canvas`);
  element.width = element.height = value;
  let painter = element.getContext(`2d`);
  let vegetationTextureRandomResult = createVegetationTextureRandom(value2);
  painter.clearRect(0, 0, value, value);
  painter.lineCap = `round`;
  let result = value / 2;
  painter.fillStyle = `rgb(200,204,196)`;
  painter.beginPath();
  painter.ellipse(result, result * 0.8, value * 0.2, value * 0.14, 0, 0, Math.PI * 2);
  painter.fill();
  for (let index = 0; index < 70; index++) {
    let result2 = Math.PI / 2 + (vegetationTextureRandomResult() - 0.5) * 2.4;
    let result3 = value * (0.18 + vegetationTextureRandomResult() * 0.3);
    let result4 = result + (vegetationTextureRandomResult() - 0.5) * value * 0.3;
    let result5 = result * 0.8 + (vegetationTextureRandomResult() - 0.5) * value * 0.15;
    let result6 = 205 + (vegetationTextureRandomResult() - 0.5) * 30;
    painter.strokeStyle = `rgb(${clampTextureColorByte(result6 - 4)},${clampTextureColorByte(result6 + 4)},${clampTextureColorByte(result6 - 8)})`;
    painter.lineWidth = 2 + vegetationTextureRandomResult() * 2.2;
    painter.beginPath();
    painter.moveTo(result4, result5);
    painter.quadraticCurveTo(
      result4 + Math.cos(result2) * result3 * 0.5,
      result5 + Math.sin(result2) * result3 * 0.4,
      result4 + Math.cos(result2) * result3,
      result5 + Math.sin(result2) * result3,
    );
    painter.stroke();
  }
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  return texture;
}
