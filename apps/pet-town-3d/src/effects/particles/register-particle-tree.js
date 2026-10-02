/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import * as THREE from "three";
import { copyParticlePosition } from "./copy-particle-position.js";
import { effectsState } from "../state.js";
export function registerParticleTree(tree, options = {}) {
  if (!tree) {
    return;
  }
  let result = tree.isObject3D
    ? tree.getWorldPosition(new THREE.Vector3())
    : copyParticlePosition(tree.position ?? tree, new THREE.Vector3());
  let result2 = options.kind ?? tree.kind ?? tree.type ?? tree.userData?.kind ?? `leafy`;
  if (/pine|palm/i.test(result2)) {
    return;
  }
  let result3 = tree.height ?? tree.h;
  let result4 =
    options.canopyY ??
    tree.canopyY ??
    tree.userData?.canopyY ??
    (result3 ? result.y + result3 * 0.72 : result.y + 3.2);
  let result5 = options.radius ?? tree.canopyRadius ?? tree.radius ?? tree.userData?.radius ?? 1.8;
  effectsState.particleEffectsState.trees.push({
    p: result,
    kind: result2,
    canopyY: result4,
    radius: result5,
    manual: !!options.manual,
  });
}
