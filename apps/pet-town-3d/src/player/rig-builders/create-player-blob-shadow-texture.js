/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
export function createPlayerBlobShadowTexture() {
  let element = document.createElement(`canvas`);
  element.width = element.height = 128;
  let painter = element.getContext(`2d`);
  let radialGradientResult = painter.createRadialGradient(64, 64, 0, 64, 64, 64);
  radialGradientResult.addColorStop(0, `rgba(255,255,255,1)`);
  radialGradientResult.addColorStop(0.45, `rgba(255,255,255,0.75)`);
  radialGradientResult.addColorStop(0.8, `rgba(255,255,255,0.18)`);
  radialGradientResult.addColorStop(1, `rgba(255,255,255,0)`);
  painter.fillStyle = radialGradientResult;
  painter.fillRect(0, 0, 128, 128);
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
