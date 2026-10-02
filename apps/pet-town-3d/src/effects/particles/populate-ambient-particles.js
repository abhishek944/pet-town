/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import { effectsState } from "../state.js";
import { randomParticleRange } from "./random-particle-range.js";
import { emitParticleBurst } from "./emit-particle-burst.js";
export function populateAmbientParticles(
  kind,
  population,
  radius,
  focus,
  deltaTime,
  heightAt,
  options = {},
) {
  let result = (effectsState.particleEffectsState.pop[kind] ??= {
    list: [],
    budget: 0,
  });
  let time2 = effectsState.particleEffectsState.time;
  let result2 = radius * radius * 1.6;
  let index = 0;
  let index2 = 0;
  for (let position2 of result.list) {
    if (position2.d > time2) {
      result.list[index2++] = position2;
      if ((position2.x - focus.x) ** 2 + (position2.z - focus.z) ** 2 < result2) {
        index++;
      }
    }
  }
  result.list.length = index2;
  let result3 = Math.floor(population) - index;
  if (result3 <= 0) {
    return;
  }
  let result4 = effectsState.particlePresets[kind];
  let result5 = index < population * 0.5;
  for (
    result.budget = Math.min(
      result.budget +
        deltaTime * (population / ((result4.life[0] + result4.life[1]) * 0.5)) * 1.5 +
        (result5 ? result3 : 0),
      result3,
    );
    result.budget >= 1;
  ) {
    --result.budget;
    let result6 = Math.sqrt(Math.random()) * radius;
    let result7 = Math.random() * Math.PI * 2;
    let result8 = focus.x + Math.cos(result7) * result6;
    let result9 = focus.z + Math.sin(result7) * result6;
    let randomParticleRangeResult = randomParticleRange(result4.life[0], result4.life[1]);
    let result10 = result5 ? Math.random() * randomParticleRangeResult * 0.8 : 0;
    emitParticleBurst([result8, heightAt(result8, result9), result9], kind, {
      ...options,
      life: randomParticleRangeResult,
      age: result10,
    });
    result.list.push({
      x: result8,
      z: result9,
      d: time2 - result10 + randomParticleRangeResult,
    });
  }
}
