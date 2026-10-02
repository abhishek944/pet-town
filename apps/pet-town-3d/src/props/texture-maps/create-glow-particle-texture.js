/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import * as THREE from "three";
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
import { propGrayscaleStyle } from "./prop-grayscale-style.js";
export function createGlowParticleTexture() {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(64);
  let radialGradientResult = propTextureCanvasResult2.createRadialGradient(32, 32, 0, 32, 32, 32);
  radialGradientResult.addColorStop(0, propGrayscaleStyle(255, 1));
  radialGradientResult.addColorStop(0.25, propGrayscaleStyle(255, 0.55));
  radialGradientResult.addColorStop(1, propGrayscaleStyle(255, 0));
  propTextureCanvasResult2.fillStyle = radialGradientResult;
  propTextureCanvasResult2.fillRect(0, 0, 64, 64);
  let texture = new THREE.CanvasTexture(propTextureCanvasResult);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
