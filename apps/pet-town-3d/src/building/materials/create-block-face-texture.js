/** Block selection outlines, face textures and physical materials. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { createBlockFaceCanvas } from "../icons/create-block-face-canvas.js";
export function createBlockFaceTexture(key, face) {
  let result = key + face;
  if (buildingState.blockFaceTextureCache.has(result)) {
    return buildingState.blockFaceTextureCache.get(result);
  }
  let texture = new THREE.CanvasTexture(createBlockFaceCanvas(key, face, 128));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  buildingState.blockFaceTextureCache.set(result, texture);
  return texture;
}
