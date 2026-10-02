/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import * as THREE from "three";
import { effectsState } from "../state.js";
import { emitParticleBurst } from "./emit-particle-burst.js";
export function initializeParticleShowcase(context) {
  let values = [
    `dust`,
    `hearts`,
    `sparkle`,
    `leaves`,
    `splash`,
    `notes`,
    `smoke`,
    `zzz`,
    `confetti`,
    `poof`,
    `debris`,
    `stars`,
  ];
  let result = context.params.get(`fxTest`) === `sheet`;
  let callback = () => {
    let camera2 = context.camera;
    let worldDirectionResult = camera2.getWorldDirection(new THREE.Vector3());
    let normalizeResult = new THREE.Vector3()
      .crossVectors(worldDirectionResult, camera2.up)
      .normalize();
    let normalizeResult2 = new THREE.Vector3()
      .crossVectors(normalizeResult, worldDirectionResult)
      .normalize();
    let addScaledVectorResult = camera2.position
      .clone()
      .addScaledVector(worldDirectionResult, result ? 6 : 10);
    values.forEach((value, value2) => {
      let result2 = value2 % 6;
      let result3 = Math.floor(value2 / 6);
      let addScaledVectorResult2 = addScaledVectorResult
        .clone()
        .addScaledVector(normalizeResult, (result2 - 2.5) * (result ? 1.45 : 2.4))
        .addScaledVector(normalizeResult2, result3 ? -1.7 : 0.4);
      if (result) {
        let result4 = effectsState.particlePresets[value];
        emitParticleBurst(addScaledVectorResult2, value, {
          age: (result4.life[0] + result4.life[1]) * 0.5 * (value === `sparkle` ? 0.25 : 0.3),
        });
      } else {
        emitParticleBurst(addScaledVectorResult2, value);
      }
    });
  };
  if (result) {
    setTimeout(() => {
      callback();
      effectsState.particleEffectsState.frozen = true;
    }, 1500);
  } else {
    setTimeout(callback, 400);
    setInterval(callback, 1400);
  }
}
