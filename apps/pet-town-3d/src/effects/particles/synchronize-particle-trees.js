/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import { effectsState } from "../state.js";
import { registerParticleTree } from "./register-particle-tree.js";
export function synchronizeParticleTrees(context) {
  let trees2 = context.vegetation?.trees;
  if (
    trees2 &&
    (trees2 !== effectsState.cachedParticleTrees ||
      trees2.length !== effectsState.cachedParticleTreeCount)
  ) {
    effectsState.cachedParticleTrees = trees2;
    effectsState.cachedParticleTreeCount = trees2.length;
    effectsState.particleEffectsState.trees = effectsState.particleEffectsState.trees.filter(
      (manualValue) => manualValue.manual,
    );
    for (let result of trees2) {
      registerParticleTree(result);
    }
  }
}
