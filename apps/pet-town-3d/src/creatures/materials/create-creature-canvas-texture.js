/** Shared creature materials, fur shading, emissive variants and day-night lighting. */
import * as THREE from "three";
export function createCreatureCanvasTexture(value, value2, value3) {
  let element = document.createElement(`canvas`);
  element.width = value;
  element.height = value2;
  value3(element.getContext(`2d`), value, value2);
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
