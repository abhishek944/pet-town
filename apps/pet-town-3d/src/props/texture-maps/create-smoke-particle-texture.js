/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import * as THREE from "three";
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { PropRandom } from "../math/prop-random.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
export function createSmokeParticleTexture() {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(128);
  let propRandom = new PropRandom(5);
  for (let index = 0; index < 9; index++) {
    let result = 64 + propRandom.range(-22, 22);
    let result2 = 64 + propRandom.range(-18, 18);
    let rangeResult = propRandom.range(22, 40);
    let radialGradientResult = propTextureCanvasResult2.createRadialGradient(
      result,
      result2,
      0,
      result,
      result2,
      rangeResult,
    );
    radialGradientResult.addColorStop(0, propGrayscaleStyle(255, 0.55));
    radialGradientResult.addColorStop(0.6, propGrayscaleStyle(250, 0.25));
    radialGradientResult.addColorStop(1, propGrayscaleStyle(250, 0));
    propTextureCanvasResult2.fillStyle = radialGradientResult;
    propTextureCanvasResult2.fillRect(0, 0, 128, 128);
  }
  let texture = new THREE.CanvasTexture(propTextureCanvasResult);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
