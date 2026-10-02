/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import * as THREE from "three";
export function createPropCanvasTexture(value, value2 = true) {
  let texture = new THREE.CanvasTexture(value);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = value2 ? THREE.SRGBColorSpace : ``;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
