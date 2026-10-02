/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
export function createPlayerRadialGradientTexture(value) {
  let element = document.createElement(`canvas`);
  element.width = element.height = 64;
  let painter = element.getContext(`2d`);
  let radialGradientResult = painter.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (let [result, result2] of value) {
    radialGradientResult.addColorStop(result, result2);
  }
  painter.fillStyle = radialGradientResult;
  painter.fillRect(0, 0, 64, 64);
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
