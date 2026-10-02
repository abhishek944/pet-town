/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import { effectsState } from "../state.js";
export function countLivingParticles() {
  let index = 0;
  let array2 = effectsState.particleEffectsState.attrs.iA.array;
  let time2 = effectsState.particleEffectsState.time;
  for (let index2 = 0; index2 < effectsState.particlePoolCapacity; index2++) {
    let result = array2[index2 * 4];
    let result2 = array2[index2 * 4 + 1];
    if (result2 > 0 && time2 - result <= result2) {
      index++;
    }
  }
  return index;
}
