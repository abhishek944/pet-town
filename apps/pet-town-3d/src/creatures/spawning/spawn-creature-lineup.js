/** Habitat-aware spawning, safe location selection and inspection lineups. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { findCreatureLineupLocation } from "./find-creature-lineup-location.js";
import { spawnCreature } from "./spawn-creature.js";
export function spawnCreatureLineup(value) {
  let values = [];
  let result = creaturesState.creaturesRuntime.ctx.params.get(`lineupOnly`);
  for (let result5 of creaturesState.creatureSpeciesDefinitions) {
    if (!result || result.split(`,`).includes(result5.id)) {
      if (value === `2`) {
        result5.variants.forEach((value2, value3) => values.push([result5, value3]));
      } else {
        values.push([result5, 0]);
      }
    }
  }
  let result2 = 1.5;
  let result3 = value === `2` ? 2 : 1;
  let ceilResult = Math.ceil(values.length / result3);
  let creatureLineupLocationResult = findCreatureLineupLocation(ceilResult, result2);
  creaturesState.creaturesRuntime.lineup = {
    ...creatureLineupLocationResult,
    spacing: result2,
    perRow: ceilResult,
    rows: result3,
  };
  try {
    creaturesState.creaturesRuntime.ctx.vegetation?.clearArea?.(
      new THREE.Vector3(
        creatureLineupLocationResult.x,
        creatureLineupLocationResult.y,
        creatureLineupLocationResult.z - (result3 - 1) * 0.75,
      ),
      ceilResult * result2 * 0.5 + 1.5,
      {
        trees: false,
        small: true,
      },
    );
  } catch {}
  let result4 = creaturesState.creaturesRuntime.ctx.params.get(`lineupState`) ?? `idle`;
  values.forEach(([scaleValue, value4], value5) => {
    let result6 = Math.floor(value5 / ceilResult);
    let result7 = value5 % ceilResult;
    let result8 = creatureLineupLocationResult.x + (result7 - (ceilResult - 1) / 2) * result2;
    let result9 = creatureLineupLocationResult.z - result6 * 1.5;
    let spawnCreatureResult = spawnCreature(scaleValue, value4, result8, result9);
    spawnCreatureResult.size = scaleValue.scale ?? 1;
    spawnCreatureResult.mesh.scale.setScalar(spawnCreatureResult.size);
    spawnCreatureResult.bodyR = scaleValue.radius * spawnCreatureResult.size;
    spawnCreatureResult.radius = Math.max(0.85, spawnCreatureResult.bodyR * 2.2);
    spawnCreatureResult.wallR = Math.min(0.4, spawnCreatureResult.bodyR * 0.72);
    spawnCreatureResult.yaw = 0;
    spawnCreatureResult.pose = {
      yaw: 0,
      state: result4,
    };
    spawnCreatureResult.home.set(result8, 0, result9);
  });
}
