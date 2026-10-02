/** Blob shadows and generated broadleaf, pine, fringe and bark textures. */
import * as THREE from "three";
export function createRepeatingVegetationTexture(
  value,
  { srgb: value2 = true, aniso: value3 = 4 } = {},
) {
  let texture = new THREE.CanvasTexture(value);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  if (value2) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.anisotropy = value3;
  texture.generateMipmaps = true;
  return texture;
}
