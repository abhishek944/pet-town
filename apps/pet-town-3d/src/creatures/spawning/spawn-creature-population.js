/** Habitat-aware spawning, safe location selection and inspection lineups. */
import { spawnBirdPopulation } from "./spawn-bird-population.js";
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { getCreatureWorldExtent } from "../world/get-creature-world-extent.js";
import { getCreatureTerrain } from "../world/get-creature-terrain.js";
import { isCreatureSpawnLocationValid } from "./is-creature-spawn-location-valid.js";
import { sampleCreatureBiome } from "./sample-creature-biome.js";
import { isCreaturePositionBlocked } from "../world/is-creature-position-blocked.js";
import { isCreatureWaterNearby } from "./is-creature-water-nearby.js";
import { spawnCreature } from "./spawn-creature.js";
export function spawnCreaturePopulation() {
  let rng2 = creaturesState.creaturesRuntime.rng;
  let creatureWorldExtentResult = getCreatureWorldExtent();
  let creatureTerrainResult = getCreatureTerrain();
  let position2 =
    creatureTerrainResult?.spawn && Number.isFinite(creatureTerrainResult.spawn.x)
      ? creatureTerrainResult.spawn
      : {
          x: 0,
          z: 0,
        };
  let pond2 = creatureTerrainResult?.landmarks?.pond;
  let values = [];
  let position3 = creaturesState.creaturesRuntime.ctx.camera
    ? creaturesState.creaturesRuntime.ctx.camera.getWorldDirection(new THREE.Vector3())
    : new THREE.Vector3(0, 0, 1);
  let atan2Result = Math.atan2(position3.x, position3.z);
  let sortResult = [...creaturesState.creatureSpeciesDefinitions].sort(
    (nearStartValue, nearStartValue2) =>
      (nearStartValue2.nearStart ?? 0) - (nearStartValue.nearStart ?? 0),
  );
  for (let result of sortResult) {
    if (result.flight) continue;
    let position4 = null;
    for (let index2 = 0; index2 < 600 && !position4; index2++) {
      let result2;
      let result3;
      if (result.nearStart && index2 < 250) {
        let result4 = atan2Result + (rng2() - 0.5) * (result.nearStart > 1 ? 0.7 : 1.3);
        let result5 = 5.5 + rng2() * 6;
        result2 = position2.x + Math.sin(result4) * result5;
        result3 = position2.z + Math.cos(result4) * result5;
      } else if (result.traits.swimmer && pond2 && index2 < 300) {
        let result6 = rng2() * creaturesState.creatureBehaviorTau;
        let result7 = pond2.r + 0.5 + rng2() * 2.5;
        result2 = pond2.x + Math.cos(result6) * result7;
        result3 = pond2.z + Math.sin(result6) * result7;
      } else {
        let result8 = rng2() * creaturesState.creatureBehaviorTau;
        let result9 =
          5 + Math.sqrt(rng2()) * Math.min(creatureWorldExtentResult * 0.6, 24 + index2 * 0.05);
        result2 = position2.x + Math.cos(result8) * result9;
        result3 = position2.z + Math.sin(result8) * result9;
      }
      if (!isCreatureSpawnLocationValid(result2, result3, result.traits.swimmer ? 0.2 : 0.4)) {
        continue;
      }
      let creatureBiomeResult = sampleCreatureBiome(result2, result3);
      if (!(
        (index2 < 250 &&
          result.biomes &&
          creatureBiomeResult != null &&
          !result.biomes.includes(creatureBiomeResult)) ||
        (index2 < 400 && !creaturesState.creatureSpawnBiomes.has(creatureBiomeResult)) ||
        (index2 < 300 &&
          !result.traits.swimmer &&
          isCreaturePositionBlocked(result2, result3, 2.2)) ||
        (result.traits.swimmer && !isCreatureWaterNearby(result2, result3, 5) && index2 < 500) ||
        values.some(
          (position5) =>
            Math.hypot(position5.x - result2, position5.z - result3) < (index2 < 300 ? 7 : 3),
        ) ||
        Math.hypot(position2.x - result2, position2.z - result3) < 3.5
      )) {
        position4 = {
          x: result2,
          z: result3,
        };
      }
    }
    position4 ||= {
      x: position2.x + rng2.range(-6, 6),
      z: position2.z + rng2.range(-6, 6),
    };
    values.push(position4);
    let index = 0;
    for (let index3 = 0; index3 < 300 && index < result.count; index3++) {
      let result10 = rng2() * creaturesState.creatureBehaviorTau;
      let result11 = 0.6 + rng2() * (2.2 + index3 * 0.02);
      let result12 = position4.x + Math.cos(result10) * result11;
      let result13 = position4.z + Math.sin(result10) * result11;
      if (
        !isCreatureSpawnLocationValid(result12, result13, 0.1) ||
        creaturesState.creaturesRuntime.list.some(
          (positionValue) =>
            Math.hypot(positionValue.position.x - result12, positionValue.position.z - result13) <
            1,
        )
      ) {
        continue;
      }
      let filterResult = result.variants
        .map((value, value2) => [value, value2])
        .filter(([rareValue]) => rareValue.rare);
      let filterResult2 = result.variants
        .map((value3, value4) => [value3, value4])
        .filter(([rareValue2]) => !rareValue2.rare);
      spawnCreature(
        result,
        filterResult.length && rng2() < 0.2
          ? rng2.pick(filterResult)[1]
          : rng2.pick(filterResult2)[1],
        result12,
        result13,
      ).home.set(position4.x, 0, position4.z);
      index++;
    }
  }
  spawnBirdPopulation();
}
