/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import * as THREE from "three";
import { effectsState } from "../state.js";
import { sampleFxDaylightWeights } from "../daylight/sample-fx-daylight-weights.js";
import { particleGroundHeight } from "./particle-ground-height.js";
import { randomParticleRange } from "./random-particle-range.js";
import { populateAmbientParticles } from "./populate-ambient-particles.js";
import { synchronizeParticleTrees } from "./synchronize-particle-trees.js";
import { emitParticleBurst } from "./emit-particle-burst.js";
export function updateParticleEffects(deltaTime, context) {
  if (!effectsState.particleEffectsState) {
    return;
  }
  deltaTime = Number.isFinite(deltaTime) ? Math.min(Math.max(deltaTime, 0), 0.1) : 0;
  if (!effectsState.particleEffectsState.frozen) {
    effectsState.particleEffectsState.time += deltaTime;
  }
  let { uniforms: particleEffectsStateValue, moteU: particleEffectsStateValue2 } =
    effectsState.particleEffectsState;
  particleEffectsStateValue.uTime.value = effectsState.particleEffectsState.time;
  let fxDaylightWeightsResult = sampleFxDaylightWeights(context);
  particleEffectsStateValue.uLight.value.setRGB(
    fxDaylightWeightsResult.day * 1 +
      fxDaylightWeightsResult.golden * 1 +
      fxDaylightWeightsResult.night * 0.32,
    fxDaylightWeightsResult.day * 1 +
      fxDaylightWeightsResult.golden * 0.82 +
      fxDaylightWeightsResult.night * 0.38,
    fxDaylightWeightsResult.day * 1 +
      fxDaylightWeightsResult.golden * 0.7 +
      fxDaylightWeightsResult.night * 0.58,
  );
  let fog2 = context.scene.fog;
  if (fog2?.isFog) {
    particleEffectsStateValue.uFogColor.value.copy(fog2.color);
    particleEffectsStateValue.uFogNear.value = fog2.near;
    particleEffectsStateValue.uFogFar.value = fog2.far;
  } else {
    particleEffectsStateValue.uFogNear.value = 1e6;
    particleEffectsStateValue.uFogFar.value = 2e6;
  }
  let ambient2 = context.fx.ambient;
  let camera2 = context.camera;
  let position2 = context.player?.position;
  let position3 = position2
    ? effectsState.particleEffectsState.focus.copy(position2)
    : camera2
        .getWorldDirection(effectsState.particleEffectsState.focus)
        .multiplyScalar(18)
        .add(camera2.position);
  let result = ambient2.enabled ? ambient2.density : 0;
  let result2 = (context.water?.surfaceY ?? context.water?.level ?? -1e9) > camera2.position.y;
  let callback = (value3, value4, value5, value6) =>
    Math.max(
      particleGroundHeight(context, value3, value4),
      context.water?.surfaceY ?? context.water?.level ?? -1e9,
    ) + randomParticleRange(value5, value6);
  let result3 =
    fxDaylightWeightsResult.night +
    fxDaylightWeightsResult.golden *
      THREE.MathUtils.smoothstep(-fxDaylightWeightsResult.elev, -0.12, 0.04);
  if (
    (populateAmbientParticles(
      `firefly`,
      ambient2.fireflies && !result2 ? 60 * result * Math.min(1, result3) : 0,
      16,
      position3,
      deltaTime,
      (value7, value8) => callback(value7, value8, 0.75, 2.4),
    ),
    populateAmbientParticles(
      `pollen`,
      ambient2.pollen && !result2
        ? 28 * result * (fxDaylightWeightsResult.day + fxDaylightWeightsResult.golden * 0.2)
        : 0,
      10,
      position3,
      deltaTime,
      (value9, value10) => callback(value9, value10, 0.4, 4.5),
      {
        dir: [0.25, 0.02, 0.1],
      },
    ),
    synchronizeParticleTrees(context),
    ambient2.petals && result > 0 && effectsState.particleEffectsState.trees.length)
  ) {
    let filterResult = effectsState.particleEffectsState.trees.filter(
      (pValue) =>
        Math.abs(pValue.p.x - position3.x) < 40 && Math.abs(pValue.p.z - position3.z) < 40,
    );
    if (filterResult.length > 24) {
      filterResult.sort(
        (pValue2, pValue3) =>
          (pValue2.p.x - position3.x) ** 2 +
          (pValue2.p.z - position3.z) ** 2 -
          ((pValue3.p.x - position3.x) ** 2 + (pValue3.p.z - position3.z) ** 2),
      );
      filterResult.length = 24;
    }
    for (let result4 of filterResult) {
      result4.kindP ??= /blossom|cherry|sakura|pink/i.test(result4.kind)
        ? `petal`
        : /autumn|orange|maple/i.test(result4.kind)
          ? `autumnLeaf`
          : `leaf`;
      let result5 =
        (result4.kindP === `petal` ? 1.5 : result4.kindP === `autumnLeaf` ? 0.6 : 0.12) * result;
      let result6 = !result4.warm;
      for (
        result4.warm = true,
          result4.acc =
            (result4.acc ?? Math.random()) + deltaTime * result5 + (result6 ? result5 * 5 : 0);
        result4.acc >= 1;
      ) {
        --result4.acc;
        let result7 = Math.random() * Math.PI * 2;
        let result8 = result4.radius * randomParticleRange(0.55, 1.05);
        let result9 = result4.p.x + Math.cos(result7) * result8;
        let result10 = result4.p.z + Math.sin(result7) * result8;
        let result11 = result4.canopyY - result4.radius * randomParticleRange(0.15, 0.6);
        let result12 = Math.max(0.5, result11 - particleGroundHeight(context, result9, result10));
        let result13 = Math.min(14, result12 / 0.56 + 0.8);
        emitParticleBurst([result9, result11, result10], result4.kindP, {
          life: result13,
          dir: [0.2, 0, 0.08],
          spread: 0.05,
          age: result6 ? Math.random() * result13 * 0.85 : 0,
        });
      }
    }
  }
  let sunDir2 = context.sky?.sunDir;
  if (
    (sunDir2
      ? particleEffectsStateValue2.uSunDir.value.copy(sunDir2)
      : context.sun &&
        particleEffectsStateValue2.uSunDir.value
          .copy(context.sun.position)
          .sub(context.sun.target?.position ?? effectsState.particleEffectsState.tmp.set(0, 0, 0))
          .normalize(),
    particleEffectsStateValue.uSunDir.value.copy(particleEffectsStateValue2.uSunDir.value),
    (particleEffectsStateValue2.uTime.value = effectsState.particleEffectsState.time),
    particleEffectsStateValue2.uCam.value.copy(camera2.position),
    (particleEffectsStateValue2.uAmt.value =
      (ambient2.motes && ambient2.enabled ? 1 : 0) *
      (fxDaylightWeightsResult.day + fxDaylightWeightsResult.golden * 0.5) *
      (result2 ? 0 : 0.8)),
    (effectsState.particleEffectsState.motes.visible =
      particleEffectsStateValue2.uAmt.value > 0.01),
    effectsState.particleEffectsState.dirtyMax >= 0)
  ) {
    for (let result14 in effectsState.particleEffectsState.attrs) {
      let result15 = effectsState.particleEffectsState.attrs[result14];
      result15.clearUpdateRanges();
      if (effectsState.particleEffectsState.wrapped) {
        result15.addUpdateRange(0, result15.array.length);
      } else {
        result15.addUpdateRange(
          effectsState.particleEffectsState.dirtyMin * result15.itemSize,
          (effectsState.particleEffectsState.dirtyMax -
            effectsState.particleEffectsState.dirtyMin +
            1) *
            result15.itemSize,
        );
      }
      result15.needsUpdate = true;
    }
    effectsState.particleEffectsState.dirtyMin = 1 / 0;
    effectsState.particleEffectsState.dirtyMax = -1;
    effectsState.particleEffectsState.wrapped = false;
  }
}
