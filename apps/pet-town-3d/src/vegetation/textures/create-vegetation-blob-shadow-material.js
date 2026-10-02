/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
import * as THREE from "three";
export function createVegetationBlobShadowMaterial() {
  let element = document.createElement(`canvas`);
  element.width = element.height = 128;
  let painter = element.getContext(`2d`);
  let radialGradientResult = painter.createRadialGradient(64, 64, 0, 64, 64, 64);
  radialGradientResult.addColorStop(0, `rgba(0,0,0,1)`);
  radialGradientResult.addColorStop(0.45, `rgba(0,0,0,0.75)`);
  radialGradientResult.addColorStop(1, `rgba(0,0,0,0)`);
  painter.fillStyle = radialGradientResult;
  painter.fillRect(0, 0, 128, 128);
  return new THREE.MeshBasicMaterial({
    color: 666132,
    alphaMap: new THREE.CanvasTexture(element),
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    fog: true,
  });
}
