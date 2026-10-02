/** Creature lifecycle, context integration, lighting, animation distance limits and shadow batches. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { ensureCreaturesSpawned } from "../spawning/ensure-creatures-spawned.js";
import { updateCreatureDebugCamera } from "../debug-camera/update-creature-debug-camera.js";
import { sampleCreatureNightFactor } from "../world/sample-creature-night-factor.js";
import { updateCreatureMaterialLighting } from "../materials/update-creature-material-lighting.js";
import { dampCreatureValue } from "../math/damp-creature-value.js";
export function updateCreatures(value, terrainValue) {
  if (
    !creaturesState.creaturesRuntime ||
    (!creaturesState.creaturesRuntime.spawned &&
      (ensureCreaturesSpawned(), !creaturesState.creaturesRuntime.spawned))
  ) {
    return;
  }
  if (!(value > 0)) {
    updateCreatureDebugCamera(terrainValue);
    return;
  }
  value = Math.min(value, 1 / 20);
  let result = performance.now();
  if (
    ((creaturesState.creaturesRuntime.time += value),
    terrainValue.terrain && terrainValue.terrain !== creaturesState.creaturesRuntime.hookedTerrain)
  ) {
    creaturesState.creaturesRuntime.hookedTerrain = terrainValue.terrain;
    try {
      if (
        typeof terrainValue.terrain.onChange == `function` &&
        !terrainValue.terrain.__creatureHook
      ) {
        terrainValue.terrain.onChange(() => {
          creaturesState.creaturesRuntime.dirty = true;
        });
        terrainValue.terrain.__creatureHook = true;
      }
    } catch {}
  }
  if (creaturesState.creaturesRuntime.dirty) {
    creaturesState.creaturesRuntime.dirty = false;
    for (let result4 of creaturesState.creaturesRuntime.list) {
      result4.airborne = true;
      result4.vy = 0;
    }
  }
  let creatureNightFactorResult = sampleCreatureNightFactor();
  updateCreatureMaterialLighting(creatureNightFactorResult, creaturesState.creaturesRuntime.time);
  creaturesState.creaturesRuntime.haloMat.opacity =
    creatureNightFactorResult *
    (0.45 + 0.12 * Math.sin(creaturesState.creaturesRuntime.time * 2.1));
  let position2 = terrainValue.player?.position?.isVector3 ? terrainValue.player.position : null;
  if (position2) {
    if (creaturesState.creaturesRuntime.playerPrev) {
      let result5 =
        Math.hypot(
          position2.x - creaturesState.creaturesRuntime.playerPrev.x,
          position2.z - creaturesState.creaturesRuntime.playerPrev.z,
        ) / Math.max(value, 0.001);
      creaturesState.creaturesRuntime.playerSpeed = dampCreatureValue(
        creaturesState.creaturesRuntime.playerSpeed,
        result5,
        6,
        value,
      );
    }
    creaturesState.creaturesRuntime.playerPrev = (
      creaturesState.creaturesRuntime.playerPrev ?? new THREE.Vector3()
    ).copy(position2);
  }
  let result2 = Number.isFinite(terrainValue.timeOfDay) ? terrainValue.timeOfDay : 0.4;
  let options = {
    night: creatureNightFactorResult,
    player: creaturesState.creaturesRuntime.ctx.params.get(`lineup`) ? null : position2,
    playerSpeed: creaturesState.creaturesRuntime.playerSpeed,
    noonish: Math.abs(result2 - 0.5) < 0.06,
  };
  updateCreatureDebugCamera(terrainValue);
  let position3 = terrainValue.camera?.position;
  let result3 = Number.isFinite(terrainValue.sky?.shadowCastRadius)
    ? terrainValue.sky.shadowCastRadius
    : 1 / 0;
  if (
    !creaturesState.creaturesRuntime.tierUnsub &&
    typeof terrainValue.post?.onTier == `function`
  ) {
    try {
      creaturesState.creaturesRuntime.tierUnsub =
        terrainValue.post.onTier((creatureShadowsValue) => {
          creaturesState.creaturesRuntime.tierShadows =
            creatureShadowsValue?.creatureShadows !== false;
        }) || true;
    } catch {
      creaturesState.creaturesRuntime.tierUnsub = true;
    }
  }
  for (let result6 of creaturesState.creaturesRuntime.list) {
    let result7 = position3 ? position3.distanceToSquared(result6.position) : 0;
    options.camDist = Math.sqrt(result7);
    let result8 = result7 > 8100;
    let result3Value = result3;
    let result9 = position2
      ? (result6.position.x - position2.x) ** 2 + (result6.position.z - position2.z) ** 2
      : 0;
    if (
      ((result6.castsShadow =
        creaturesState.creaturesRuntime.tierShadows &&
        result7 < 1444 &&
        result9 <= result3Value * result3Value),
      result6.think(value, options),
      result6.move(value, options),
      result8)
    ) {
      result6.mesh.visible = false;
      result6.shadow.visible = false;
      continue;
    }
    if (
      ((result6.mesh.visible = true),
      (result6.lodAcc = (result6.lodAcc ?? 0) + value),
      result7 > 3600 && (creaturesState.creaturesRuntime.frame + result6.id) & 3)
    ) {
      continue;
    }
    let result10 = Math.min(result6.lodAcc, 1 / 10);
    result6.lodAcc = 0;
    result6.animate(result10, options);
    if (result7 < 3600) {
      result6.secondary(result10);
    }
  }
  let index = 0;
  for (let result11 of creaturesState.creaturesRuntime.list) {
    if (result11.castsShadow && result11.mesh.visible) {
      for (let result12 of result11.proxies) {
        if (index >= creaturesState.creaturesRuntime.proxyMax) {
          break;
        }
        creaturesState.creatureWorldMatrixScratch.multiplyMatrices(
          result12.bone.matrixWorld,
          result12.m,
        );
        creaturesState.creaturesRuntime.proxy.setMatrixAt(
          index++,
          creaturesState.creatureWorldMatrixScratch,
        );
      }
    }
  }
  creaturesState.creaturesRuntime.proxy.count = index;
  creaturesState.creaturesRuntime.proxy.instanceMatrix.needsUpdate = true;
  creaturesState.creaturesRuntime.proxy.visible = index > 0;
  let index2 = 0;
  for (let result13 of creaturesState.creaturesRuntime.list) {
    let shadow2 = result13.shadow;
    if (shadow2.visible && result13.mesh.visible) {
      creaturesState.creatureWorldMatrixScratch.compose(
        shadow2.position,
        creaturesState.creatureIdentityQuaternion,
        shadow2.scale,
      );
      creaturesState.creaturesRuntime.shadows.setMatrixAt(
        index2++,
        creaturesState.creatureWorldMatrixScratch,
      );
    }
  }
  creaturesState.creaturesRuntime.shadows.count = index2;
  creaturesState.creaturesRuntime.shadows.instanceMatrix.needsUpdate = true;
  creaturesState.creaturesRuntime.frame = (creaturesState.creaturesRuntime.frame ?? 0) + 1;
  creaturesState.creaturesRuntime.icons.update(value);
  updateCreatureDebugCamera(terrainValue);
  creaturesState.creaturesRuntime.ms =
    (creaturesState.creaturesRuntime.ms ?? 0) * 0.95 + (performance.now() - result) * 0.05;
}
