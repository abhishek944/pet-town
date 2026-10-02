/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import * as THREE from "three";
export function createPostRenderTarget(width, height, options = {}) {
  return new THREE.WebGLRenderTarget(Math.max(1, width), Math.max(1, height), {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    ...options,
  });
}
